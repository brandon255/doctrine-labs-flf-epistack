import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { runCaseStudy } from "../src/epistemic/ingest.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const CASES = ["covid", "lhc", "eggs"];

for (const name of CASES) {
  const caseDir = join(repoRoot, "docs", "epistemic", name);

  test(`${name}: case runs end to end`, () => {
    const result = runCaseStudy(caseDir);
    assert.ok(result.summary.claim_count > 0);
    assert.ok(result.report_markdown.includes("# Epistemic case report"));
  });

  test(`${name}: never reports more independent sources than excerpts`, () => {
    const { summary } = runCaseStudy(caseDir);
    assert.ok(
      summary.independent_root_count <= summary.claim_count,
      `${name} claims ${summary.independent_root_count} sources from ${summary.claim_count} excerpts`
    );
  });

  test(`${name}: level counts are monotonically non-increasing`, () => {
    const { summary } = runCaseStudy(caseDir);
    assert.ok(summary.claim_count >= summary.document_count, "claims >= documents");
    assert.ok(summary.document_count >= summary.lineage_count, "documents >= lineages");
  });

  test(`${name}: every block carries a resolved document and lineage`, () => {
    const { blocks } = runCaseStudy(caseDir);
    for (const b of blocks) {
      assert.ok(b.provenance.document_id, `${b.evidence_id} missing document_id`);
      assert.ok(b.provenance.lineage_id, `${b.evidence_id} missing lineage_id`);
    }
  });

  test(`${name}: no block retains a claim-level id in a source-level field`, () => {
    const raw = JSON.parse(readFileSync(join(caseDir, "evidence_blocks.json"), "utf8"));
    const blocks = Array.isArray(raw) ? raw : raw.blocks;
    for (const b of blocks) {
      assert.equal(
        b.source.root_source_id,
        undefined,
        `${b.evidence_id} still has source.root_source_id; run scripts/migrate-source-identity.js`
      );
    }
  });

  test(`${name}: results are deterministic across runs`, () => {
    const a = runCaseStudy(caseDir).summary;
    const b = runCaseStudy(caseDir).summary;
    assert.deepEqual(a, b);
  });
}

test("covid: the corpus that exposed the bug now reports honestly", () => {
  const { summary } = runCaseStudy(join(repoRoot, "docs", "epistemic", "covid"));
  // Before the fix this read 19 independent roots from 21 excerpts.
  assert.ok(
    summary.independent_root_count < 10,
    `expected a collapsed lineage count, got ${summary.independent_root_count}`
  );
  assert.ok(summary.inflation_factor > 1, "COVID corpus is known to be citation-inflated");
});

test("covid: registry declares the Will -> Weissman derivation", () => {
  const registryPath = join(repoRoot, "docs", "epistemic", "covid", "source_registry.json");
  assert.ok(existsSync(registryPath), "covid source_registry.json must exist");
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const will = Object.values(registry.documents).find(
    (d) => d.document_id === "vantreuren-covid-debate-decision-2024"
  );
  assert.ok(will.derives_from.includes("weissman-inconvenient-probability-v511"));
});
