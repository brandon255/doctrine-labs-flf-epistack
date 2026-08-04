#!/usr/bin/env node
/**
 * Freeze adjudication runs to readable transcripts.
 *
 * The premise: a reviewer with a stack of submissions will not install a 5GB
 * model to look at one of them. The deterministic half of this tool runs cold,
 * but the proposal and the model challenger do not — so if we want anyone to
 * see the full protocol in motion, we have to capture it ourselves and ship the
 * capture.
 *
 * This writes one markdown file per (case, job) into docs/transcripts/, plus an
 * index. Failures are captured verbatim rather than retried, because a
 * transcript that only contains successes is marketing, not evidence.
 *
 * Usage:
 *   node scripts/freeze-transcripts.js              # every case x every job
 *   node scripts/freeze-transcripts.js covid        # one case, every job
 *   node scripts/freeze-transcripts.js covid crux   # one run
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { runCaseStudy } from "../src/epistemic/ingest.js";
import { adjudicate, formatAdjudication } from "../src/epistemic/adjudicate.js";
import { ADJUDICATION_JOBS, JOB_NAMES } from "../src/epistemic/jobs.js";
import { getLlmStatus } from "../src/epistemic/llm.js";
import { resolveModelLineage, pickChallenger } from "../src/epistemic/model_identity.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "docs", "transcripts");
const CASES_DIR = join(ROOT, "docs", "epistemic");

const args = process.argv.slice(2).filter((a) => a !== "--index-only");
const indexOnly = process.argv.includes("--index-only");
const onlyCase = args[0];
const onlyJob = args[1];

function discoverCases() {
  return readdirSync(CASES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => existsSync(join(CASES_DIR, name, "evidence_blocks.json")))
    .sort();
}

function fence(text) {
  // Transcript bodies can contain backticks; use a long fence so they survive.
  return "``````\n" + String(text ?? "").trimEnd() + "\n``````";
}

/**
 * Recover index-row fields from a transcript we did not just generate, so a
 * single-case rerun can rebuild a complete index instead of truncating it.
 */
function readTranscriptHeader(path) {
  const text = readFileSync(path, "utf8");
  const head = text.slice(0, 4000);
  const pick = (re) => head.match(re)?.[1]?.trim() ?? null;
  const [, caseName, jobName] =
    path.match(/([^/\\]+?)-([^-/\\]+)\.md$/) ?? [null, "unknown", "unknown"];
  // The rendered heading spells multi-word verdicts with spaces
  // ("VERIFIED WITH CAVEAT"), so stopping at the first space silently
  // downgrades them to "VERIFIED" in the index.
  const verdictLine = text
    .match(/^##\s+\S+\s+—\s+([A-Z][A-Z_ ]*[A-Z])\s*$/m)?.[1]
    ?.trim()
    .replace(/\s+/g, "_");
  const grade = text.match(/independence:\s*([A-Za-z_]+)/)?.[1]?.toLowerCase() ?? "—";
  const seconds = pick(/\|\s*Wall time\s*\|\s*([\d.]+)s\s*\|/);
  return {
    caseName,
    jobName,
    verdict: /## This run failed/.test(text) ? "ERROR" : (verdictLine ?? "unknown").toLowerCase(),
    grade,
    elapsedMs: seconds ? Number(seconds) * 1000 : 0,
    error: /## This run failed/.test(text),
  };
}

async function freezeOne({ caseName, jobName, status, proposerLineage, challenger }) {
  const caseDir = join(CASES_DIR, caseName);
  const { blocks, summary, claim_graph, measurement_roots } = runCaseStudy(caseDir);
  const job = ADJUDICATION_JOBS[jobName];

  const startedAt = new Date();
  let record = null;
  let error = null;
  const t0 = Date.now();
  try {
    record = await adjudicate({
      question: job.question,
      jobType: jobName,
      blocks,
      instructions: job.instructions,
      edges: claim_graph?.edges ?? [],
      cwd: caseDir,
      measurementRoots: measurement_roots ?? {},
    });
  } catch (e) {
    error = e;
  }
  const elapsedMs = Date.now() - t0;

  const lines = [];
  lines.push(`# Transcript — \`${caseName}\` · ${jobName}`);
  lines.push("");
  lines.push(
    `> Captured so this can be read without installing anything. Verbatim, ` +
      `including failures. Regenerate with \`node scripts/freeze-transcripts.js ${caseName} ${jobName}\`.`
  );
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|---|---|");
  lines.push(`| Case | \`${caseName}\` |`);
  lines.push(`| Job | \`${jobName}\` — ${job.desideratum} |`);
  lines.push(`| Question | ${job.question} |`);
  lines.push(`| Captured | ${startedAt.toISOString()} |`);
  lines.push(`| Wall time | ${(elapsedMs / 1000).toFixed(1)}s |`);
  lines.push(`| Proposer | \`${status.model}\` (lineage \`${proposerLineage.lineage_id}\`) |`);
  lines.push(
    `| Model challenger | ${
      challenger
        ? `\`${challenger.model}\` (lineage \`${challenger.lineage_id}\`)`
        : "none installed with a different weight lineage"
    } |`
  );
  lines.push(`| Mechanical challenger | always runs, lineage \`deterministic\` |`);
  const externalRoots = Object.keys(measurement_roots ?? {}).filter((r) => measurement_roots[r] !== "$REPO");
  if (externalRoots.length) {
    lines.push(
      `| Measurement roots | captured on the author's machine, where \`${externalRoots.join("`, `")}\` ` +
        `${externalRoots.length === 1 ? "resolves" : "resolve"}. On your checkout ` +
        `${externalRoots.length === 1 ? "it will not" : "they will not"}, and those measurements ` +
        `report \`unverifiable_here\` — unchecked, not disproved. |`
    );
  }
  lines.push("");
  lines.push(`**Corpus:** ${summary.assessment_line}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (error) {
    lines.push("## This run failed");
    lines.push("");
    lines.push(
      "Kept rather than retried. A transcript folder containing only successful runs " +
        "would tell you less than this does."
    );
    lines.push("");
    lines.push(fence(error.stack ?? error.message));
    lines.push("");
  } else {
    lines.push("## The record");
    lines.push("");
    lines.push(fence(formatAdjudication(record)));
    lines.push("");
    lines.push("## Machine-readable");
    lines.push("");
    lines.push("<details><summary>Full JSON record</summary>");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(record, null, 2));
    lines.push("```");
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  const file = join(OUT_DIR, `${caseName}-${jobName}.md`);
  writeFileSync(file, lines.join("\n"), "utf8");

  const verdict = error ? "ERROR" : record?.verdict ?? "unknown";
  const grade = error ? "—" : record?.independence_grade ?? "—";
  return { caseName, jobName, verdict, grade, elapsedMs, error: Boolean(error), file };
}

async function main() {
  const status = await getLlmStatus();
  if (!status.ready && !indexOnly) {
    console.error(`LLM not ready: ${status.reason}`);
    console.error(`Start Ollama and pull a model, e.g.  ollama pull llama3.1`);
    console.error(``);
    console.error(`The mechanical checks run without a model, but the point of a`);
    console.error(`transcript is to capture the steps that DO need one.`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const proposerLineage = status.model
    ? resolveModelLineage(status.model)
    : { lineage_id: "unknown" };
  const challenger = status.model ? pickChallenger(status.model, status.models ?? []) : null;

  const cases = onlyCase ? [onlyCase] : discoverCases();
  const jobs = onlyJob ? [onlyJob] : JOB_NAMES;

  if (indexOnly) {
    console.log("Index-only: rebuilding docs/transcripts/README.md from files on disk.");
  } else {
    console.log(`Freezing ${cases.length} case(s) x ${jobs.length} job(s)`);
    console.log(`Proposer:   ${status.model} (${proposerLineage.lineage_id})`);
    console.log(
      `Challenger: ${challenger ? `${challenger.model} (${challenger.lineage_id})` : "none cross-lineage"}`
    );
  }
  console.log("");

  const results = [];
  if (!indexOnly) {
    for (const caseName of cases) {
      for (const jobName of jobs) {
        if (!ADJUDICATION_JOBS[jobName]) continue;
        process.stdout.write(`  ${caseName}/${jobName} ... `);
        const r = await freezeOne({ caseName, jobName, status, proposerLineage, challenger });
        results.push(r);
        console.log(`${r.verdict} (${(r.elapsedMs / 1000).toFixed(0)}s)`);
      }
    }
  }

  // The index must describe every transcript on disk, not only the ones this
  // invocation produced. Re-running a single case should not silently delete
  // the other twenty rows from the index.
  const onDisk = readdirSync(OUT_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort();
  const freshByFile = new Map(results.map((r) => [`${r.caseName}-${r.jobName}.md`, r]));
  const rows = onDisk.map((file) => {
    const fresh = freshByFile.get(file);
    if (fresh) return { ...fresh, file };
    return { ...readTranscriptHeader(join(OUT_DIR, file)), file };
  });

  // Index.
  const idx = [];
  idx.push("# Transcripts — the tool running, without you installing it");
  idx.push("");
  idx.push(
    "A reviewer with a stack of submissions should not have to pull a five-gigabyte " +
      "model to see whether this works. These are complete adjudication runs, captured " +
      "verbatim from a real machine, including the ones that failed."
  );
  idx.push("");
  idx.push(
    "**Prefer to watch it?** There is a three-minute walkthrough: " +
      "Screencast not uploaded yet. Shot list and narration: " +
      "[`../SCREENCAST_SCRIPT.md`](../SCREENCAST_SCRIPT.md)."
  );
  idx.push("");
  idx.push("## What you're looking at");
  idx.push("");
  idx.push(
    "Each transcript walks the four stages of the adjudication protocol: the model " +
      "**proposes** a conclusion with cited reasoning; every citation is **verified** " +
      "mechanically against the corpus with no model involved; a **challenge** panel " +
      "argues against it; and a human **resolves**. The verdict and the independence " +
      "grade at the top of each file are the outputs that matter."
  );
  idx.push("");
  idx.push(
    "The deterministic half of this — verification and the eight mechanical challenger " +
      "checks — runs on any machine with Node and no model at all. Only the proposal and " +
      "the model challenger need Ollama, which is the entire reason this folder exists."
  );
  idx.push("");
  idx.push("## Run environment");
  idx.push("");
  idx.push("| Field | Value |");
  idx.push("|---|---|");
  idx.push(`| Captured | ${new Date().toISOString()} |`);
  idx.push(`| Proposer | \`${status.model}\` (lineage \`${proposerLineage.lineage_id}\`) |`);
  idx.push(
    `| Model challenger | ${
      challenger ? `\`${challenger.model}\` (lineage \`${challenger.lineage_id}\`)` : "none"
    } |`
  );
  idx.push(`| Machine | Apple M1 Max, local only, no network calls |`);
  idx.push("");
  idx.push("## The runs");
  idx.push("");
  idx.push("| Case | Job | Verdict | Independence | Time | Transcript |");
  idx.push("|---|---|---|---|---|---|");
  for (const r of rows) {
    idx.push(
      `| \`${r.caseName}\` | ${r.jobName} | ${r.error ? "**ERROR**" : r.verdict} | ${r.grade} | ${(
        r.elapsedMs / 1000
      ).toFixed(0)}s | [${r.file}](${r.file}) |`
    );
  }
  idx.push("");

  const failed = rows.filter((r) => r.error).length;
  const unverified = rows.filter((r) => !r.error && /unverified/i.test(String(r.verdict))).length;
  idx.push("## How to read the failures");
  idx.push("");
  idx.push(
    `Of ${rows.length} runs, ${failed} errored and ${unverified} returned an unverified ` +
      `verdict. Both are kept.`
  );
  idx.push("");
  idx.push(
    "An unverified verdict usually means the model quoted a block non-verbatim — it " +
      "paraphrased where the verifier demanded exact text. Across our earlier validation " +
      "runs the model never once invented a block id, so the honest reading is *conclusions " +
      "largely sound, quoting sloppy*. We kept the strict rule anyway: a verifier that " +
      "accepts paraphrase cannot distinguish accurate paraphrase from convenient paraphrase."
  );
  idx.push("");
  idx.push(
    "That is also why an unverified run is not embarrassing to publish. The tool " +
      "rejecting its own model's output is the tool working."
  );
  idx.push("");
  idx.push("## Regenerating");
  idx.push("");
  idx.push("```bash");
  idx.push("ollama serve                              # in another terminal");
  idx.push("node scripts/freeze-transcripts.js        # all cases, all jobs");
  idx.push("node scripts/freeze-transcripts.js covid  # one case");
  idx.push("```");
  idx.push("");

  writeFileSync(join(OUT_DIR, "README.md"), idx.join("\n"), "utf8");

  console.log("");
  console.log(`Wrote ${results.length} transcript(s) + index to docs/transcripts/`);
  console.log(`  errored: ${failed}   unverified: ${unverified}`);
}

main().catch((e) => {
  console.error(`freeze-transcripts failed: ${e.stack ?? e.message}`);
  process.exit(1);
});
