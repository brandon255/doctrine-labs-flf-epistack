#!/usr/bin/env node
/**
 * Run one adjudicated judgment against a case and print the full record.
 *
 * Usage:
 *   node scripts/adjudicate-run.js <case> <job> ["custom question"]
 *
 * Nothing is written. The point is to show the work, check the citations, and
 * hand a human something they can accept, override, or rerun.
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runCaseStudy } from "../src/epistemic/ingest.js";
import { adjudicate, formatAdjudication } from "../src/epistemic/adjudicate.js";
import { ADJUDICATION_JOBS, JOB_NAMES } from "../src/epistemic/jobs.js";
import { getLlmStatus } from "../src/epistemic/llm.js";
import { resolveModelLineage, pickChallenger } from "../src/epistemic/model_identity.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const caseName = process.argv[2];
const jobName = process.argv[3] ?? "lineage";
const customQuestion = process.argv[4];

if (!caseName || !ADJUDICATION_JOBS[jobName]) {
  console.error(`Usage: node scripts/adjudicate-run.js <case> <${JOB_NAMES.join("|")}> ["question"]`);
  process.exit(1);
}

const status = await getLlmStatus();
if (!status.ready) {
  console.error(`LLM not ready: ${status.reason}`);
  console.error(`Start Ollama and pull a model, e.g.  ollama pull llama3.1`);
  process.exit(1);
}

const caseDir = join(repoRoot, "docs", "epistemic", caseName);
const { blocks, summary, claim_graph, measurement_roots } = runCaseStudy(caseDir);
const job = ADJUDICATION_JOBS[jobName];

const proposerLineage = resolveModelLineage(status.model);
const challenger = pickChallenger(status.model, status.models ?? []);

console.log(`Case: ${caseName}  ·  proposer: ${status.model} (lineage ${proposerLineage.lineage_id})`);
console.log(
  challenger
    ? `Challenger: ${challenger.model} (lineage ${challenger.lineage_id})`
    : `Challenger: no different verified weight lineage installed — the model ` +
      `challenge will be labelled correlated. Run 'npm run audit:self' for detail.`
);
console.log(summary.assessment_line);
console.log(`\nAdjudicating: ${jobName} — ${job.desideratum}\n${"─".repeat(72)}\n`);

const record = await adjudicate({
  question: customQuestion ?? job.question,
  jobType: jobName,
  blocks,
  instructions: job.instructions,
  edges: claim_graph?.edges ?? [],
  cwd: caseDir,
  measurementRoots: measurement_roots ?? {},
});

console.log(formatAdjudication(record));
