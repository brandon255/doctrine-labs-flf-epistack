#!/usr/bin/env node
/**
 * Migration: claim-level ids were written into source.root_source_id, which the
 * genealogy engine reads as document identity. That made every excerpt look like
 * its own source and inflated the independent-source count.
 *
 * This moves those values to source.claim_ref (where a within-document locator
 * belongs) and lets the engine resolve real document and lineage identity from
 * the case source_registry.json at run time.
 *
 * Usage: node scripts/migrate-source-identity.js <case> [--write]
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDocumentId, resolveLineageId } from "../src/epistemic/source_identity.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const caseName = process.argv[2];
const write = process.argv.includes("--write");

if (!caseName) {
  console.error("Usage: node scripts/migrate-source-identity.js <case> [--write]");
  process.exit(1);
}

const caseDir = join(repoRoot, "docs", "epistemic", caseName);
const blocksPath = join(caseDir, "evidence_blocks.json");
const registryPath = join(caseDir, "source_registry.json");

if (!existsSync(blocksPath)) {
  console.error(`No evidence_blocks.json at ${blocksPath}`);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(blocksPath, "utf8"));
const blocks = Array.isArray(raw) ? raw : raw.blocks;
const registryFile = existsSync(registryPath)
  ? JSON.parse(readFileSync(registryPath, "utf8"))
  : { documents: {} };
const registry = registryFile.documents ?? {};

let movedClaimRefs = 0;
const docCounts = new Map();
const lineageCounts = new Map();
const unresolved = [];

const migrated = blocks.map((block) => {
  const source = { ...block.source };

  // A root_source_id equal to the identifier is a claim-level locator, not a
  // document id. Move it rather than drop it.
  if (source.root_source_id) {
    source.claim_ref = source.root_source_id;
    delete source.root_source_id;
    movedClaimRefs++;
  } else if (source.identifier) {
    source.claim_ref = source.identifier;
  }

  const { document_id, basis } = resolveDocumentId(block, registry);
  const { lineage_id, declared } = resolveLineageId(document_id, registry);

  if (basis === "fallback") unresolved.push(block.evidence_id);

  docCounts.set(document_id, (docCounts.get(document_id) ?? 0) + 1);
  lineageCounts.set(lineage_id, (lineageCounts.get(lineage_id) ?? 0) + 1);

  return {
    ...block,
    source,
    resolved: { document_id, lineage_id, document_basis: basis, lineage_declared: declared },
  };
});

console.log(`Case: ${caseName}`);
console.log(`  blocks              ${blocks.length}`);
console.log(`  claim_refs moved    ${movedClaimRefs}`);
console.log(`  distinct documents  ${docCounts.size}`);
console.log(`  distinct lineages   ${lineageCounts.size}`);
if (unresolved.length) {
  console.log(`  UNRESOLVED (no registry entry, no URL): ${unresolved.length}`);
  for (const id of unresolved) console.log(`    - ${id}`);
}

console.log("\n  Documents:");
for (const [doc, n] of [...docCounts].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(2)} block(s)  ${doc}`);
}
console.log("\n  Lineages:");
for (const [lin, n] of [...lineageCounts].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(2)} block(s)  ${lin}`);
}

if (write) {
  // Persist only the claim_ref correction. document_id and lineage_id stay
  // derived at run time so that editing the registry re-resolves everything.
  const out = migrated.map(({ resolved, ...block }) => block);
  writeFileSync(blocksPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${blocksPath}`);
} else {
  console.log("\nDry run. Re-run with --write to persist the claim_ref change.");
}
