import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveGenealogy, mergeGenealogyEdges, clusterIdFromRoot } from "../src/epistemic/genealogy.js";

/** Two excerpts from one document, plus one from a second document in the same lineage. */
function fixture() {
  const registry = {
    "https://a.example/doc-one": {
      document_id: "doc-one",
      lineage_id: "shared-event",
      lineage_role: "judge",
      derives_from: ["doc-two"],
      derivation_basis: "Author says so.",
    },
    "https://b.example/doc-two": {
      document_id: "doc-two",
      lineage_id: "shared-event",
      lineage_role: "observer",
      derives_from: [],
    },
    "https://c.example/doc-three": {
      document_id: "doc-three",
      lineage_id: "separate-event",
      lineage_role: "independent_analysis",
      derives_from: [],
    },
  };
  const blocks = [
    { evidence_id: "e1", claim: "c1", confidence_label: "HIGH", source: { identifier: "x1" }, provenance: { context: "https://a.example/doc-one" } },
    { evidence_id: "e2", claim: "c2", confidence_label: "HIGH", source: { identifier: "x2" }, provenance: { context: "https://a.example/doc-one" } },
    { evidence_id: "e3", claim: "c3", confidence_label: "HIGH", source: { identifier: "x3" }, provenance: { context: "https://b.example/doc-two" } },
    { evidence_id: "e4", claim: "c4", confidence_label: "HIGH", source: { identifier: "x4" }, provenance: { context: "https://c.example/doc-three" } },
  ];
  return { blocks, registry };
}

test("resolveGenealogy rejects non-array input", () => {
  assert.throws(() => resolveGenealogy(null), /REJECTED/);
});

test("counts all three levels separately", () => {
  const { blocks, registry } = fixture();
  const { summary } = resolveGenealogy(blocks, { registry });
  assert.equal(summary.claim_count, 4);
  assert.equal(summary.document_count, 3);
  assert.equal(summary.lineage_count, 2);
});

test("headline independent count is the conservative lineage count", () => {
  const { blocks, registry } = fixture();
  const { summary } = resolveGenealogy(blocks, { registry });
  assert.equal(summary.independent_root_count, summary.lineage_count);
  assert.ok(
    summary.independent_root_count < summary.claim_count,
    "headline must never exceed the excerpt count"
  );
});

test("inflation factor reports excerpts per independent lineage", () => {
  const { blocks, registry } = fixture();
  const { summary } = resolveGenealogy(blocks, { registry });
  assert.equal(summary.inflation_factor, 2); // 4 excerpts / 2 lineages
});

test("assessment line states the conservative number", () => {
  const { blocks, registry } = fixture();
  const { summary } = resolveGenealogy(blocks, { registry });
  assert.match(summary.assessment_line, /Treat as 2 independent source\(s\), not 4/);
});

test("emits same_document edges between excerpts of one document", () => {
  const { blocks, registry } = fixture();
  const { edges } = resolveGenealogy(blocks, { registry });
  const sameDoc = edges.filter((e) => e.relation === "same_document");
  assert.equal(sameDoc.length, 1);
  assert.deepEqual([sameDoc[0].from, sameDoc[0].to].sort(), ["e1", "e2"]);
});

test("emits same_lineage edges between documents sharing an event", () => {
  const { blocks, registry } = fixture();
  const { edges } = resolveGenealogy(blocks, { registry });
  const sameLineage = edges.filter((e) => e.relation === "same_lineage");
  assert.equal(sameLineage.length, 1);
  assert.deepEqual([sameLineage[0].from, sameLineage[0].to].sort(), ["doc-one", "doc-two"]);
});

test("emits declared derivation edges", () => {
  const { blocks, registry } = fixture();
  const { edges } = resolveGenealogy(blocks, { registry });
  const deriv = edges.filter((e) => e.relation === "derives_from");
  assert.equal(deriv.length, 1);
  assert.equal(deriv[0].from, "doc-one");
  assert.equal(deriv[0].to, "doc-two");
});

test("blocks are annotated with document, lineage and role", () => {
  const { blocks, registry } = fixture();
  const out = resolveGenealogy(blocks, { registry });
  const e1 = out.blocks.find((b) => b.evidence_id === "e1");
  assert.equal(e1.provenance.document_id, "doc-one");
  assert.equal(e1.provenance.lineage_id, "shared-event");
  assert.equal(e1.provenance.lineage_role, "judge");
  assert.equal(e1.provenance.independence_class, "correlated");
});

test("a lone excerpt in its own document is marked independent", () => {
  const { blocks, registry } = fixture();
  const out = resolveGenealogy(blocks, { registry });
  const e4 = out.blocks.find((b) => b.evidence_id === "e4");
  assert.equal(e4.provenance.independence_class, "independent");
});

test("REGRESSION: distinct claim-level identifiers must not inflate independence", () => {
  // Without a registry, three excerpts sharing one URL still collapse to one
  // document by URL derivation — the identifier field must not drive the count.
  const blocks = ["a", "b", "c"].map((s, i) => ({
    evidence_id: `e${i}`,
    claim: "c",
    confidence_label: "HIGH",
    source: { identifier: `distinct-claim-id-${s}` },
    provenance: { context: "https://example.com/p/one-single-post" },
  }));
  const { summary } = resolveGenealogy(blocks, {});
  assert.equal(summary.document_count, 1, "one URL means one document");
  assert.equal(summary.independent_root_count, 1);
});

test("input blocks are not mutated", () => {
  const { blocks, registry } = fixture();
  const before = JSON.stringify(blocks);
  resolveGenealogy(blocks, { registry });
  assert.equal(JSON.stringify(blocks), before);
});

test("cluster ids are deterministic", () => {
  assert.equal(clusterIdFromRoot("abc"), clusterIdFromRoot("abc"));
  assert.notEqual(clusterIdFromRoot("abc"), clusterIdFromRoot("abd"));
});

test("mergeGenealogyEdges dedupes by from+to+relation", () => {
  const graph = { subquestion: "q", version: "1", nodes: [], edges: [{ from: "a", to: "b", relation: "supports" }] };
  const merged = mergeGenealogyEdges(graph, [
    { from: "a", to: "b", relation: "supports" },
    { from: "a", to: "b", relation: "same_document" },
  ]);
  assert.equal(merged.edges.length, 2);
});
