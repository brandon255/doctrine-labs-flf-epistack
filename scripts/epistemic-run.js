#!/usr/bin/env node
/** Run epistemic case study ingest - FLF judge demo. */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCaseStudy } from "../src/epistemic/ingest.js";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const caseArg = process.argv[2] ?? "covid";
const CASE_DIRS = {
  covid: join(ROOT, "docs/epistemic/covid"),
  lhc: join(ROOT, "docs/epistemic/lhc"),
  eggs: join(ROOT, "docs/epistemic/eggs"),
  sample: join(ROOT, "docs/epistemic/sample"),
  self: join(ROOT, "docs/epistemic/self"),
};

const caseDir = CASE_DIRS[caseArg] ?? resolve(caseArg);
const result = runCaseStudy(caseDir);

console.log(result.report_markdown);
console.log("\n---\nJSON summary:\n");
console.log(JSON.stringify(result.summary, null, 2));

const outPath = join(caseDir, "RUN_OUTPUT.md");
try {
  writeFileSync(outPath, `${result.report_markdown}\n`, "utf8");
  console.error(`\nSaved: ${outPath}`);
} catch (e) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${result.report_markdown}\n`, "utf8");
  console.error(`\nSaved: ${outPath}`);
}
