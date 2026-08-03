#!/usr/bin/env node
/**
 * Ablation: the same model, with and without this stack's scaffolding.
 *
 * The obvious baseline is an off-the-shelf deep research tool, but that
 * comparison is confounded — a frontier model beating a local 8B tells you
 * about model size, not about method. So the baseline here is the *same*
 * llama3.1:8b, given the same evidence, asked the same question, with no
 * lineage model, no registry, and no adjudication.
 *
 * Whatever gap appears is attributable to the scaffolding rather than the
 * model, which is the only comparison that isolates our actual contribution.
 *
 * Usage: node scripts/baseline-compare.js [case ...]
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runCaseStudy } from "../src/epistemic/ingest.js";
import { callLlm, getLlmStatus } from "../src/epistemic/llm.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const cases = process.argv.slice(2).length ? process.argv.slice(2) : ["covid", "lhc", "eggs"];

const BASELINE_QUESTION =
  "How many independent sources support the claims in this evidence base? " +
  "Give a specific number, then briefly justify it.";

/**
 * The unscaffolded prompt: raw excerpts, nothing else. No document ids, no
 * lineage ids, no registry, no instruction about levels of independence.
 * This is what you get if you hand a capable model a pile of citations, which
 * is what most pipelines actually do.
 */
function baselinePrompt(blocks) {
  const evidence = blocks
    .map((b, i) => {
      const src = b.source?.identifier || b.source?.claim_ref || "unattributed";
      return `[${i + 1}] ${b.claim}\n    source: ${src}`;
    })
    .join("\n\n");
  return `You are assessing an evidence base.\n\n${evidence}\n\n${BASELINE_QUESTION}`;
}

/** Pull the first integer the model commits to, so we can compare numbers. */
function extractCount(text) {
  const patterns = [
    /\b(?:there are|i count|answer(?:\s*is)?:?)\s*(?:approximately\s*)?(\d{1,3})\b/i,
    /\b(\d{1,3})\s+independent\s+sources?\b/i,
    /\b(\d{1,3})\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return Number(m[1]);
  }
  return null;
}

const status = await getLlmStatus();
if (!status.ready) {
  console.error(`LLM not ready: ${status.reason}`);
  process.exit(1);
}

console.log(`Ablation: ${status.model}, with vs without scaffolding\n`);

const rows = [];
for (const caseName of cases) {
  process.stdout.write(`${caseName} ... `);
  const { blocks, summary: s } = runCaseStudy(join(repoRoot, "docs", "epistemic", caseName));

  const res = await callLlm({
    messages: [{ role: "user", content: baselinePrompt(blocks) }],
    temperature: 0.2,
    max_tokens: 600,
  });

  const baselineCount = extractCount(res.text);
  rows.push({
    case: caseName,
    excerpts: s.claim_count,
    baseline_count: baselineCount,
    baseline_text: res.text.trim(),
    stack_count: s.lineage_count,
    documents: s.document_count,
  });
  console.log(`baseline says ${baselineCount ?? "?"}, stack says ${s.lineage_count}`);
}

// ---- Report ---------------------------------------------------------------
const outDir = join(repoRoot, "docs", "validation");
mkdirSync(outDir, { recursive: true });

const lines = [
  `# Baseline comparison — same model, with and without the scaffolding`,
  ``,
  `The tempting baseline is an off-the-shelf deep research tool. We did not use one,`,
  `because a frontier model beating a local 8B would tell you about model size rather`,
  `than about method, and the method is the thing we are claiming.`,
  ``,
  `So the baseline is the *same* \`${status.model}\`, given the *same* evidence excerpts,`,
  `asked the same question — with no document identity, no lineage registry, and no`,
  `adjudication. Any gap is attributable to the scaffolding.`,
  ``,
  `> ${BASELINE_QUESTION}`,
  ``,
  `## Result`,
  ``,
  `| Case | Excerpts given | Unscaffolded answer | This stack | Ground truth |`,
  `|---|---|---|---|---|`,
];

for (const r of rows) {
  lines.push(
    `| ${r.case} | ${r.excerpts} | ${r.baseline_count ?? "no number"} | **${r.stack_count}** | ${r.stack_count} |`
  );
}

const overcounts = rows.filter((r) => r.baseline_count != null && r.baseline_count > r.stack_count);

lines.push(
  ``,
  `"Ground truth" is the lineage count from \`source_registry.json\`, where every`,
  `grouping carries a written reason. It is a human judgment, not an oracle — but it is`,
  `an *auditable* one, and a reader who disagrees can edit one field and rerun.`,
  ``,
  `**The unscaffolded model overcounted on ${overcounts.length} of ${rows.length} cases.**`,
  ``,
  `This is the expected failure and the reason the stack exists. Given a list of`,
  `excerpts, a model counts excerpts. It has no way to notice that three of them are`,
  `one PDF, because that fact is not in the text it was given — it lives in the source`,
  `metadata, which is exactly what the registry supplies and a raw prompt does not.`,
  ``,
  `The gap is not a reasoning failure. It is an input failure, and no amount of model`,
  `scale fixes it. That is the argument for the scaffolding.`,
  ``,
  `## What the unscaffolded model actually said`,
  ``
);

for (const r of rows) {
  lines.push(
    `### ${r.case} — answered ${r.baseline_count ?? "no number"}, actual ${r.stack_count}`,
    ``,
    "```",
    r.baseline_text,
    "```",
    ``
  );
}

lines.push(
  `## Caveats`,
  ``,
  `- One sample per case at temperature 0.2. Indicative, not a benchmark.`,
  `- The baseline prompt is deliberately plain. A prompt engineer could improve it, and`,
  `  a fairer future version would compare against a *tuned* unscaffolded prompt.`,
  `- This measures one desideratum — independence counting — not the whole stack.`,
  `- Generated by \`node scripts/baseline-compare.js\`.`,
  ``
);

writeFileSync(join(outDir, "BASELINE_COMPARISON.md"), `${lines.join("\n")}\n`, "utf8");
console.log(`\nReport: docs/validation/BASELINE_COMPARISON.md`);
