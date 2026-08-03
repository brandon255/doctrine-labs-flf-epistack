import { test } from "node:test";
import assert from "node:assert/strict";
import {
  baseTag,
  loadModelRegistry,
  resolveModelLineage,
  shareLineage,
  summarizeModelShelf,
  pickChallenger,
} from "../src/epistemic/model_identity.js";

const REGISTRY = loadModelRegistry();

test("the shipped registry loads and drops its README key", () => {
  assert.ok(Object.keys(REGISTRY).length > 5);
  assert.equal(REGISTRY._README, undefined);
});

test("baseTag strips the ollama size suffix", () => {
  assert.equal(baseTag("llama3.1:8b"), "llama3.1");
  assert.equal(baseTag("hermes3:latest"), "hermes3");
  assert.equal(baseTag("  QWEN2.5:14B "), "qwen2.5");
});

// The finding that motivated this whole module. hermes3 looks like an
// independent challenger for llama3.1 — different publisher, different name —
// and shares its weights entirely.
test("hermes3 resolves to the llama-3.1 lineage, not its own", () => {
  const h = resolveModelLineage("hermes3:latest", REGISTRY);
  assert.equal(h.lineage_id, "llama-3.1");
  assert.equal(h.lineage_role, "fine-tune");
  assert.deepEqual(h.derives_from, ["llama3.1"]);
  assert.equal(h.publisher, "NousResearch");
  assert.equal(h.verified, true);
});

test("hermes3 and llama3.1 share a lineage; mistral does not", () => {
  assert.equal(shareLineage("hermes3:latest", "llama3.1:8b", REGISTRY), true);
  assert.equal(shareLineage("mistral:7b-instruct", "llama3.1:8b", REGISTRY), false);
});

// llama.cpp reports Mistral as architecture "llama". Merging on that basis
// would be the mirror-image error: faking correlation where none exists.
test("architectural similarity does not merge Mistral into Llama", () => {
  const m = resolveModelLineage("mistral:7b-instruct", REGISTRY);
  assert.equal(m.lineage_id, "mistral-7b");
  assert.equal(m.lineage_role, "base");
  assert.match(m.note, /architecture FAMILY label, not a weight lineage/i);
});

test("longest-prefix matching keeps a context retag off its base entry", () => {
  const retag = resolveModelLineage("qwen2.5-14b-64k:latest", REGISTRY);
  assert.equal(retag.model_id, "qwen2.5-14b-64k");
  assert.equal(retag.lineage_role, "context-retag");
  assert.equal(retag.lineage_id, "qwen-2.5");

  const base = resolveModelLineage("qwen2.5:14b", REGISTRY);
  assert.equal(base.lineage_role, "base");
  assert.equal(base.lineage_id, "qwen-2.5");
});

test("size tags all resolve through one base entry", () => {
  for (const tag of ["llama3.1", "llama3.1:8b", "llama3.1:70b", "llama3.1:405b"]) {
    assert.equal(resolveModelLineage(tag, REGISTRY).lineage_id, "llama-3.1", tag);
  }
});

// Asymmetry vs source_identity.js: an unknown *model* does not earn independent
// standing, because here we are counting our own independence.
test("an unknown model gets its own lineage but is marked unverified", () => {
  const u = resolveModelLineage("some-model-nobody-registered", REGISTRY);
  assert.equal(u.verified, false);
  assert.match(u.lineage_id, /^unverified-/);
  assert.match(u.note, /not in models\/registry\.json/);
});

test("an unverified model makes shared-lineage unknowable rather than false", () => {
  assert.equal(shareLineage("mystery-model", "llama3.1:8b", REGISTRY), null);
});

test("deepseek-r1 is deliberately unverified because its base varies by tag", () => {
  const d = resolveModelLineage("deepseek-r1:8b", REGISTRY);
  assert.equal(d.verified, false);
  assert.match(d.note, /distillations into Qwen or Llama/i);
});

test("an empty model name resolves without throwing", () => {
  const e = resolveModelLineage("", REGISTRY);
  assert.equal(e.verified, false);
  assert.equal(e.lineage_id, "unknown-model");
});

// The live demo: the tool's own three-level counting, pointed at a model shelf.
test("summarizeModelShelf collapses seven models to four lineages", () => {
  const shelf = [
    "mistral:7b-instruct",
    "hermes3:latest",
    "qwen2.5-14b-64k:latest",
    "gemma4e-64k:latest",
    "gemma4:e4b",
    "qwen2.5:14b",
    "llama3.1:8b",
  ];
  const s = summarizeModelShelf(shelf, REGISTRY);
  assert.equal(s.model_count, 7);
  assert.equal(s.lineage_count, 4);
  assert.equal(s.inflation_factor, 1.75);
  assert.deepEqual(s.unverified, []);

  const ids = s.lineages.map((l) => l.lineage_id).sort();
  assert.deepEqual(ids, ["gemma-4", "llama-3.1", "mistral-7b", "qwen-2.5"]);
});

test("summarizeModelShelf reports unverified models rather than dropping them", () => {
  const s = summarizeModelShelf(["llama3.1:8b", "who-knows:latest"], REGISTRY);
  assert.equal(s.lineage_count, 2);
  assert.deepEqual(s.unverified, ["who-knows:latest"]);
});

test("summarizeModelShelf handles an empty shelf", () => {
  const s = summarizeModelShelf([], REGISTRY);
  assert.equal(s.model_count, 0);
  assert.equal(s.lineage_count, 0);
  assert.equal(s.inflation_factor, 0);
});

test("pickChallenger prefers a different verified lineage and the larger model", () => {
  const picked = pickChallenger(
    "llama3.1:8b",
    ["llama3.1:8b", "hermes3:latest", "mistral:7b-instruct", "qwen2.5:14b"],
    REGISTRY
  );
  assert.equal(picked.model, "qwen2.5:14b");
  assert.equal(picked.lineage_id, "qwen-2.5");
  assert.match(picked.reason, /different verified weight lineage/);
});

// A local context retag is the same weights with a different num_ctx. When the
// canonical published model is installed too, use that.
test("pickChallenger prefers canonical base weights over a context retag", () => {
  const picked = pickChallenger(
    "llama3.1:8b",
    ["llama3.1:8b", "qwen2.5-14b-64k:latest", "qwen2.5:14b"],
    REGISTRY
  );
  assert.equal(picked.model, "qwen2.5:14b");
});

test("pickChallenger will still use a retag when it is the only option", () => {
  const picked = pickChallenger("llama3.1:8b", ["llama3.1:8b", "gemma4e-64k:latest"], REGISTRY);
  assert.equal(picked.model, "gemma4e-64k:latest");
  assert.equal(picked.lineage_id, "gemma-4");
});

// The case the old design would have got wrong.
test("pickChallenger refuses hermes3 as a challenger for llama3.1", () => {
  const picked = pickChallenger("llama3.1:8b", ["llama3.1:8b", "hermes3:latest"], REGISTRY);
  assert.equal(picked, null);
});

test("pickChallenger returns null rather than an unverified model", () => {
  assert.equal(pickChallenger("llama3.1:8b", ["llama3.1:8b", "mystery:latest"], REGISTRY), null);
});

test("pickChallenger returns null on a single-model install", () => {
  assert.equal(pickChallenger("llama3.1:8b", ["llama3.1:8b"], REGISTRY), null);
  assert.equal(pickChallenger("llama3.1:8b", [], REGISTRY), null);
});

test("a missing registry file degrades to unverified rather than throwing", () => {
  const empty = loadModelRegistry("/nonexistent/path/registry.json");
  assert.deepEqual(empty, {});
  const r = resolveModelLineage("llama3.1:8b", empty);
  assert.equal(r.verified, false);
});
