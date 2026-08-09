#!/usr/bin/env node
/**
 * Snapshot AISI evidence blocks + source registries from the sibling
 * aisi-lineage-toolkit repo into this FLF repo at data/aisi/.
 *
 *   node data/aisi/scripts/snapshot.js
 *
 * Each company gets two files:
 *   - evidence_blocks.json (the citations)
 *   - source_registry.json (the lineage declarations)
 *
 * Looks for the source repo at ../doctrine-labs-aisi-lineage-toolkit relative
 * to this script's repo root. Override with AISI_SRC env var.
 */
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DEFAULT_SRC = join(ROOT, "..", "doctrine-labs-aisi-lineage-toolkit", "docs", "epistemic");
const SRC = process.env.AISI_SRC ?? DEFAULT_SRC;
const DEST = join(ROOT, "data", "aisi", "blocks");

if (!existsSync(SRC)) {
  console.error(`AISI source not found at: ${SRC}`);
  console.error(`Set AISI_SRC env var or clone the sibling repo.`);
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });

const companies = readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let totalBlocks = 0;
let totalWithRegistry = 0;
const summary = { regenerated_at: new Date().toISOString(), companies: [] };

for (const c of companies) {
  const srcBlocks = join(SRC, c, "evidence_blocks.json");
  const srcReg = join(SRC, c, "source_registry.json");
  if (!existsSync(srcBlocks)) {
    console.warn(`  skip ${c}: no evidence_blocks.json`);
    continue;
  }
  const destDir = join(DEST, c);
  mkdirSync(destDir, { recursive: true });
  copyFileSync(srcBlocks, join(destDir, "evidence_blocks.json"));

  let hasRegistry = false;
  if (existsSync(srcReg)) {
    copyFileSync(srcReg, join(destDir, "source_registry.json"));
    hasRegistry = true;
    totalWithRegistry += 1;
  } else {
    console.warn(`  ${c}: no source_registry.json (lineage resolution will fall back to URL-based)`);
  }

  const blocks = JSON.parse(readFileSync(srcBlocks, "utf8"));
  const blocksArr = Array.isArray(blocks) ? blocks : (blocks.blocks ?? []);
  totalBlocks += blocksArr.length;
  summary.companies.push({ id: c, block_count: blocksArr.length, has_registry: hasRegistry });
  console.log(`  ${c}: ${blocksArr.length} blocks${hasRegistry ? "" : " (no registry)"}`);
}

writeFileSync(join(DEST, "SNAPSHOT.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(`\nSnapshot complete: ${companies.length} companies, ${totalBlocks} total blocks, ${totalWithRegistry} with registries.`);
console.log(`Source: ${SRC}`);
console.log(`Dest:   ${DEST}`);
