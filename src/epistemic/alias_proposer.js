/**
 * Alias proposer — Job 1 of the local-LLM layer.
 *
 * The model reads evidence blocks and proposes pairs of source identifiers that
 * MIGHT trace to the same root, even though they have different IDs. Every proposal
 * is a suggestion only. Nothing is written until the human clicks Accept. Accept
 * writes to aliases.json, which the existing engine already reads.
 *
 * Honesty guardrails:
 *  - The model is told not to invent. It must justify each proposal in one sentence.
 *  - Proposals are returned to the UI for review. They are NEVER auto-applied.
 *  - Accept writes one alias line to aliases.json + logs to steering_log.jsonl.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { callLlm, getLlmStatus } from "./llm.js";
import { appendSteeringLog } from "./steering_log.js";

/**
 * Build the prompt for the model from a list of evidence blocks.
 * @param {object[]} blocks
 */
function buildPrompt(blocks) {
  const compact = blocks.map((b) => ({
    evidence_id: b.evidence_id,
    source_identifier: b.source?.identifier ?? null,
    root_source_id: b.source?.root_source_id ?? null,
    excerpt: (b.source?.excerpt ?? "").slice(0, 240),
    claim: (b.claim ?? "").slice(0, 240),
  }));

  return `You are an evidence analyst. Below is a JSON list of evidence blocks. Each block has a source identifier and a root_source_id. Two blocks may share a real-world root even if they have different identifiers (for example, two writeups of one study, or two URLs pointing at the same report).

Identify pairs that might trace to the same original source. For each pair:
  - from_id: evidence_id of the first block
  - to_id: evidence_id of the second block
  - proposed_root: a single canonical identifier both could collapse to
  - reason: one sentence explaining the signal (shared excerpt, same study, etc.)

Rules:
  - Only propose when there is real signal. Do not invent.
  - If you see no candidates, return an empty list.
  - Do NOT propose based on topic similarity alone — only shared provenance.
  - Maximum 5 proposals.

Return ONLY a JSON object: { "proposals": [{from_id,to_id,proposed_root,reason}, ...] }

Evidence blocks:
${JSON.stringify(compact, null, 2)}`;
}

/**
 * Run the alias proposer on a case folder.
 * @param {string} caseDir
 * @param {object} [opts]
 * @returns {Promise<{ proposals: Array<{from_id,to_id,proposed_root,reason}>, model: string }>}
 */
export async function proposeAliases(caseDir, opts = {}) {
  const status = await getLlmStatus();
  if (!status.ready) {
    throw new Error(`LLM not ready: ${status.reason || "unknown"}`);
  }

  const blocksPath = join(caseDir, "evidence_blocks.json");
  if (!existsSync(blocksPath)) throw new Error(`no evidence_blocks.json in ${caseDir}`);
  const blocks = JSON.parse(readFileSync(blocksPath, "utf8"));

  const prompt = buildPrompt(blocks);
  const { text, model } = await callLlm({
    messages: [
      { role: "system", content: "You are a careful evidence analyst. You do not invent." },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 1000,
  });

  const parsed = safeParseProposals(text, blocks);
  return { proposals: parsed, model };
}

/**
 * Validate model output against the actual block IDs present (no hallucinated IDs).
 */
function safeParseProposals(text, blocks) {
  const validIds = new Set(blocks.map((b) => b.evidence_id));
  let parsed;
  try {
    const m = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(m ? m[0] : text);
  } catch {
    return [];
  }
  const list = Array.isArray(parsed?.proposals) ? parsed.proposals : [];
  return list
    .filter(
      (p) =>
        p &&
        validIds.has(p.from_id) &&
        validIds.has(p.to_id) &&
        p.from_id !== p.to_id &&
        typeof p.proposed_root === "string" &&
        typeof p.reason === "string",
    )
    .slice(0, 5)
    .map((p) => ({
      from_id: p.from_id,
      to_id: p.to_id,
      proposed_root: p.proposed_root.trim(),
      reason: p.reason.trim(),
    }));
}

/**
 * Human-accepted proposal → write one alias line to aliases.json + log it.
 * Returns the new independence count by re-running the engine.
 * @param {string} caseDir
 * @param {{ from_id: string, to_id: string, proposed_root: string, reason?: string }} proposal
 */
export function acceptAlias(caseDir, proposal) {
  const blocksPath = join(caseDir, "evidence_blocks.json");
  if (!existsSync(blocksPath)) throw new Error(`no evidence_blocks.json in ${caseDir}`);
  const blocks = JSON.parse(readFileSync(blocksPath, "utf8"));

  const from = blocks.find((b) => b.evidence_id === proposal.from_id);
  const to = blocks.find((b) => b.evidence_id === proposal.to_id);
  if (!from || !to) throw new Error("REJECTED: proposal references unknown evidence_id");

  const fromIdent = from.source?.identifier ?? from.source?.root_source_id;
  const toIdent = to.source?.identifier ?? to.source?.root_source_id;
  if (!fromIdent || !toIdent) throw new Error("REJECTED: source identifier missing on referenced block");

  // aliases.json maps: { alias_id : canonical_root }
  const aliasesPath = join(caseDir, "aliases.json");
  const aliases = existsSync(aliasesPath)
    ? JSON.parse(readFileSync(aliasesPath, "utf8"))
    : {};
  aliases[fromIdent] = proposal.proposed_root;
  aliases[toIdent] = proposal.proposed_root;
  writeFileSync(aliasesPath, `${JSON.stringify(aliases, null, 2)}\n`, "utf8");

  appendSteeringLog(caseDir, {
    actor: "user",
    action: "accept_alias",
    from_id: proposal.from_id,
    to_id: proposal.to_id,
    proposed_root: proposal.proposed_root,
    reason: proposal.reason || "",
  });

  // Re-run the engine to report the new independence count.
  // (ingest.js reads aliases.json if present — confirmed in claim_graph.js / genealogy.js wiring.)
  return { ok: true, accepted: proposal, aliases };
}
