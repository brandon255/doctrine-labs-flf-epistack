#!/usr/bin/env node
/**
 * snapshot.js — Copy Eval Contamination Toolkit v2 outputs into the FLF repo
 * for serving on Render. Same pattern as data/aisi/scripts/snapshot.js.
 *
 * Source: ../doctrine-labs-eval-contamination-toolkit/docs/
 *   - epistemic/{winter-2025,summer-2026}/<company>/evidence_blocks.json
 *   - epistemic/reviewers/{winter-2025,summer-2026}-panel.json
 *   - contamination/CONTAMINATION_AUDIT.md
 *   - reviewer-network/{winter-2025,summer-2026}-network.md
 *   - cross-cycle/CROSS_CYCLE_DELTA.md
 *   - EVAL_CONTAMINATION_REPORT.md
 *
 * Destination: data/eval-contamination/blocks/
 */
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const SRC = join(ROOT, "..", "doctrine-labs-eval-contamination-toolkit");
const DEST = join(ROOT, "data", "eval-contamination", "blocks");
const REPORTS_DEST = join(ROOT, "data", "eval-contamination");

if (!existsSync(SRC)) {
  console.error(`\n❌ Cannot find source repo at ${SRC}`);
  console.error(`Expected: <workspace>/doctrine-labs-eval-contamination-toolkit/`);
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });
mkdirSync(REPORTS_DEST, { recursive: true });

// Copy evidence blocks + registries per company × cycle
const CYCLES = ["winter-2025", "summer-2026"];
const COMPANIES = [
  "anthropic", "openai", "google-deepmind", "meta", "xai",
  "z-ai", "alibaba-cloud", "deepseek", "mistral",
];

let totalCompanies = 0;
let totalBlocks = 0;

for (const cycle of CYCLES) {
  for (const company of COMPANIES) {
    const srcDir = join(SRC, "docs", "epistemic", cycle, company);
    if (!existsSync(srcDir)) {
      console.warn(`  skip ${cycle}/${company}: source dir missing`);
      continue;
    }
    const destDir = join(DEST, cycle, company);
    mkdirSync(destDir, { recursive: true });

    const blocksFile = join(srcDir, "evidence_blocks.json");
    const registryFile = join(srcDir, "source_registry.json");
    if (existsSync(blocksFile)) {
      copyFileSync(blocksFile, join(destDir, "evidence_blocks.json"));
      const raw = JSON.parse(readFileSync(blocksFile, "utf8"));
      const arr = Array.isArray(raw) ? raw : (raw.blocks || []);
      totalBlocks += arr.length;
    }
    if (existsSync(registryFile)) {
      copyFileSync(registryFile, join(destDir, "source_registry.json"));
    }
    totalCompanies += 1;
  }
}

// Copy reviewer panel files
for (const cycle of CYCLES) {
  const panelSrc = join(SRC, "docs", "epistemic", "reviewers", `${cycle}-panel.json`);
  const panelDest = join(DEST, "reviewers", `${cycle}-panel.json`);
  if (existsSync(panelSrc)) {
    mkdirSync(dirname(panelDest), { recursive: true });
    copyFileSync(panelSrc, panelDest);
  }
}

// Copy pre-computed audit + report files
const REPORTS = [
  ["docs/contamination/CONTAMINATION_AUDIT.md", "contamination/CONTAMINATION_AUDIT.md"],
  ["docs/contamination/benchmark-shared-roots.json", "contamination/benchmark-shared-roots.json"],
  ["docs/reviewer-network/REVIEWER_NETWORK.md", "reviewer-network/REVIEWER_NETWORK.md"],
  ["docs/reviewer-network/winter-2025-network.md", "reviewer-network/winter-2025-network.md"],
  ["docs/reviewer-network/summer-2026-network.md", "reviewer-network/summer-2026-network.md"],
  ["docs/cross-cycle/CROSS_CYCLE_DELTA.md", "cross-cycle/CROSS_CYCLE_DELTA.md"],
  ["docs/EVAL_CONTAMINATION_REPORT.md", "EVAL_CONTAMINATION_REPORT.md"],
];
for (const [srcRel, destRel] of REPORTS) {
  const src = join(SRC, srcRel);
  const dest = join(REPORTS_DEST, destRel);
  if (existsSync(src)) {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
}

// Snapshot manifest
const manifest = {
  generated_at: new Date().toISOString(),
  source: SRC,
  total_companies: totalCompanies,
  total_evidence_blocks: totalBlocks,
  cycles: CYCLES,
  companies: COMPANIES,
};
writeFileSync(join(REPORTS_DEST, "SNAPSHOT.json"), JSON.stringify(manifest, null, 2));

console.log(`\n✓ Snapshotted ${totalCompanies} company-cycle pairs · ${totalBlocks} blocks`);
console.log(`  → ${DEST}`);
console.log(`  → ${REPORTS_DEST}`);