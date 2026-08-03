import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractUrl,
  documentIdFromUrl,
  resolveDocumentId,
  resolveLineageId,
  indexByDocumentId,
} from "../src/epistemic/source_identity.js";

test("extractUrl pulls a URL out of free-text provenance context", () => {
  assert.equal(
    extractUrl("https://ermsta.com/r/covid_decision_20240217.pdf (Eric Stansifer, PhD)"),
    "https://ermsta.com/r/covid_decision_20240217.pdf"
  );
});

test("extractUrl strips trailing punctuation and returns null when absent", () => {
  assert.equal(extractUrl("see https://example.com/a."), "https://example.com/a");
  assert.equal(extractUrl("no url here"), null);
  assert.equal(extractUrl(undefined), null);
});

test("documentIdFromUrl produces a stable legible id", () => {
  assert.equal(
    documentIdFromUrl("https://www.astralcodexten.com/p/practically-a-book-review-rootclaim"),
    "astralcodexten-practically-a-book-review-rootclaim"
  );
});

test("documentIdFromUrl is stable across trailing slash and .pdf extension", () => {
  const a = documentIdFromUrl("https://blog.rootclaim.com/some-post/");
  const b = documentIdFromUrl("https://blog.rootclaim.com/some-post");
  assert.equal(a, b);
  assert.equal(documentIdFromUrl("https://ermsta.com/r/covid_decision.pdf"), "ermsta-covid-decision");
});

test("documentIdFromUrl refuses opaque shortener hosts", () => {
  assert.equal(documentIdFromUrl("https://tinyurl.com/yrvzp8mk"), null);
  assert.equal(documentIdFromUrl("https://bit.ly/abc"), null);
  assert.equal(documentIdFromUrl("not a url"), null);
});

test("registry overrides win over URL derivation", () => {
  const registry = {
    "https://tinyurl.com/yrvzp8mk": { document_id: "vantreuren-decision", lineage_id: "debate" },
  };
  const block = { provenance: { context: "https://tinyurl.com/yrvzp8mk" }, source: { identifier: "will-bayes" } };
  const out = resolveDocumentId(block, registry);
  assert.equal(out.document_id, "vantreuren-decision");
  assert.equal(out.basis, "registry");
});

test("URL derivation is used when no registry entry exists", () => {
  const block = {
    provenance: { context: "https://michaelweissman.substack.com/p/an-inconvenient-probability-v57" },
    source: { identifier: "weissman-conclusion" },
  };
  const out = resolveDocumentId(block, {});
  assert.equal(out.basis, "url");
  assert.match(out.document_id, /michaelweissman/);
});

test("falls back to source.identifier only as a last resort", () => {
  const block = { provenance: { context: "no url" }, source: { identifier: "agent-hypothesis-1" } };
  const out = resolveDocumentId(block, {});
  assert.equal(out.document_id, "agent-hypothesis-1");
  assert.equal(out.basis, "fallback");
});

test("REGRESSION: excerpts from one document resolve to one document id", () => {
  // The original bug: three excerpts from Judge Will's single 27-page PDF each
  // carried a distinct root_source_id, so the engine counted three sources.
  const registry = {
    "https://tinyurl.com/yrvzp8mk": { document_id: "vantreuren-decision", lineage_id: "wilf-miller-debate" },
  };
  const excerpts = ["will-decision-doc", "will-decision-bayes", "will-decision-inconsistency"].map((id) => ({
    source: { identifier: id },
    provenance: { context: "https://tinyurl.com/yrvzp8mk" },
  }));
  const ids = new Set(excerpts.map((b) => resolveDocumentId(b, registry).document_id));
  assert.equal(ids.size, 1, "three excerpts from one PDF must resolve to one document");
});

test("lineage resolution never silently merges undeclared documents", () => {
  const registry = { u: { document_id: "doc-a", lineage_id: "event-1" } };
  assert.deepEqual(resolveLineageId("doc-a", registry), { lineage_id: "event-1", declared: true });
  // An unknown document becomes its own lineage rather than joining another.
  assert.deepEqual(resolveLineageId("doc-unknown", registry), {
    lineage_id: "doc-unknown",
    declared: false,
  });
});

test("indexByDocumentId keys registry entries by document", () => {
  const registry = { "https://a": { document_id: "doc-a", lineage_role: "judge" } };
  assert.equal(indexByDocumentId(registry)["doc-a"].lineage_role, "judge");
});
