/**
 * Evidence chat — Job 2 of the local-LLM layer.
 *
 * Strictly retrieval-grounded. The prompt is built ONLY from the actual case files
 * (evidence_blocks.json, claim_graph.json, RUN_OUTPUT.md). The model is instructed
 * to answer only from the evidence and to say "I don't see that in the evidence"
 * rather than invent. This is the honesty guardrail.
 *
 * Chat history is kept in memory by the caller; nothing is persisted here.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { callLlm, getLlmStatus } from "./llm.js";
import { runCaseStudy } from "./ingest.js";

const MAX_BLOCKS_IN_PROMPT = 30;
const MAX_EXCERPT_LEN = 400;
const MAX_CLAIM_LEN = 300;

/**
 * Build the system + context prompt for the case.
 * @param {string} caseDir
 */
function buildContextPrompt(caseDir) {
  const blocksPath = join(caseDir, "evidence_blocks.json");
  if (!existsSync(blocksPath)) throw new Error(`no evidence_blocks.json in ${caseDir}`);
  const blocks = JSON.parse(readFileSync(blocksPath, "utf8"));

  const result = runCaseStudy(caseDir);
  const summary = result.summary;

  const blockDigest = blocks.slice(0, MAX_BLOCKS_IN_PROMPT).map((b) => ({
    evidence_id: b.evidence_id,
    claim: (b.claim ?? "").slice(0, MAX_CLAIM_LEN),
    source_identifier: b.source?.identifier ?? null,
    root_source_id: b.source?.root_source_id ?? null,
    excerpt: (b.source?.excerpt ?? "").slice(0, MAX_EXCERPT_LEN),
    confidence_label: b.confidence_label ?? null,
  }));

  const correlatedEdges = (result.claim_graph?.edges ?? []).filter((e) =>
    ["same_document", "same_lineage", "derives_from"].includes(e.relation),
  );

  return `You are an evidence analyst answering questions about a specific epistemic case. You are read-only. You must follow these rules exactly:

1. Answer ONLY from the evidence below. If the answer is not in the evidence, say: "I don't see that in the evidence for this case."
2. Never invent sources, evidence IDs, URLs, or claims.
3. When you cite a block, use its exact evidence_id (e.g. \`covid-seed-001\`).
4. Be honest about uncertainty. If blocks are FLAGGED or LOW confidence, say so.
5. Keep answers short — three paragraphs maximum.
6. Do not give life, medical, legal, or financial advice. This is a reasoning tool, not an oracle.

CASE SUMMARY:
${summary.assessment_line}
- ${summary.claim_count} excerpts cited (level 1)
- ${summary.document_count} distinct documents (level 2)
- ${summary.lineage_count} independent lineages (level 3 — this is the honest source count)
- ${summary.inflation_factor}x citation inflation

When the user asks "how many sources support X", answer with the lineage count, not
the excerpt count. Several excerpts from one document are one source restated. Several
documents drawing on one event are one observation read several ways.

CORRELATED EVIDENCE (these trace to the same root — do NOT count as independent):
${correlatedEdges.length === 0 ? "(none detected)" : correlatedEdges.map((e) => `- ${e.from} ↔ ${e.to}: ${e.note}`).join("\n")}

EVIDENCE BLOCKS:
${JSON.stringify(blockDigest, null, 2)}`;
}

/**
 * Answer a question about a case, grounded in its evidence.
 * @param {string} caseDir
 * @param {string} question
 * @param {Array<{role: string, content: string}>} history
 * @param {object} [opts]
 */
export async function chatWithCase(caseDir, question, history = [], opts = {}) {
  const status = await getLlmStatus();
  if (!status.ready) {
    throw new Error(`LLM not ready: ${status.reason || "unknown"}`);
  }

  const context = buildContextPrompt(caseDir);
  const messages = [
    { role: "system", content: context },
    ...(history || []).slice(-8),
    { role: "user", content: question },
  ];

  const { text, model } = await callLlm({
    messages,
    temperature: 0.2,
    max_tokens: opts.max_tokens ?? 600,
  });

  return { answer: text, model, grounded_in: caseDir };
}
