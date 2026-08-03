import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mechanicalChallenge,
  assertedIndependenceCount,
} from "../src/epistemic/mechanical_challenge.js";
import { verifyCitations } from "../src/epistemic/adjudicate.js";

/** Corpus: 6 blocks, 3 documents, 2 lineages. */
const BLOCKS = [
  {
    evidence_id: "e1",
    claim: "Judge Will put the lab-leak probability near 1 in 300.",
    source: { excerpt: "approximately a 1 in 300 chance that SARS-CoV-2 was the result of a lab leak" },
    provenance: { document_id: "will-decision", lineage_id: "debate-2024" },
    confidence_label: "HIGH",
  },
  {
    evidence_id: "e2",
    claim: "Will described his method as Bayesian.",
    source: { excerpt: "In my Bayesian analysis, modeled after Michael Weissman's analysis" },
    provenance: { document_id: "will-decision", lineage_id: "debate-2024" },
    confidence_label: "HIGH",
  },
  {
    evidence_id: "e3",
    claim: "Judge Eric reached a comparable figure independently.",
    source: { excerpt: "I arrive at a similar order of magnitude by a different route" },
    provenance: { document_id: "eric-decision", lineage_id: "debate-2024" },
    confidence_label: "MEDIUM",
  },
  {
    evidence_id: "e4",
    claim: "Weissman warns that uncertain priors dominate.",
    source: { excerpt: "highly uncertain priors can make fairly large likelihood ratios irrelevant" },
    provenance: { document_id: "weissman-paper", lineage_id: "weissman-analysis" },
    confidence_label: "HIGH",
  },
  {
    evidence_id: "e5",
    claim: "A market-based estimate diverged from the judges.",
    source: { excerpt: "the market settled considerably higher than either judge" },
    provenance: { document_id: "weissman-paper", lineage_id: "weissman-analysis" },
    confidence_label: "LOW",
  },
  {
    evidence_id: "e6",
    claim: "An unsourced summary circulated on social media.",
    source: { excerpt: "everyone agrees the question is closed" },
    provenance: { document_id: "social-post", lineage_id: "weissman-analysis" },
    confidence_label: "FLAGGED",
  },
];

const steps = (reasoning) => verifyCitations(reasoning, BLOCKS).steps;

test("assertedIndependenceCount reads digits and number words", () => {
  assert.equal(assertedIndependenceCount("There are 3 independent lineages here."), 3);
  assert.equal(assertedIndependenceCount("I count three distinct sources."), 3);
  assert.equal(assertedIndependenceCount("independent sources: 5"), 5);
  assert.equal(assertedIndependenceCount("lineages = 2"), 2);
});

// Must not mistake unrelated numbers for a claim about source structure.
test("assertedIndependenceCount ignores numbers that are not about independence", () => {
  assert.equal(assertedIndependenceCount("There is a 1 in 300 chance of a lab leak."), null);
  assert.equal(assertedIndependenceCount("I used 4 reasoning steps."), null);
  assert.equal(assertedIndependenceCount(""), null);
  assert.equal(assertedIndependenceCount(null), null);
});

// A number word embedded in a longer word is not a count. A check that objects
// to sloppy counting had better not miscount.
test("assertedIndependenceCount respects word boundaries", () => {
  assert.equal(assertedIndependenceCount("someone independent sources agree"), null);
  assert.equal(assertedIndependenceCount("nine independent sources agree"), 9);
});

test("a well-supported conclusion draws no objection", () => {
  const c = mechanicalChallenge({
    conclusion: "The evidence traces to 2 independent lineages.",
    confidence: "MEDIUM",
    steps: steps([
      { step: "Will's figure.", cites: ["e1"], quote: "approximately a 1 in 300 chance" },
      { step: "Weissman's caution.", cites: ["e4"], quote: "highly uncertain priors can make fairly large likelihood ratios irrelevant" },
      { step: "Eric's route.", cites: ["e3"], quote: "I arrive at a similar order of magnitude by a different route" },
    ]),
    blocks: BLOCKS,
  });
  assert.equal(c.verdict, "sound");
  assert.deepEqual(c.objections, []);
  assert.equal(c.route, "mechanical");
  assert.equal(c.independent, true);
  assert.equal(c.lineage_id, "deterministic");
});

// C3 is the check the whole exercise is for: the tool catching its own reasoning
// resting on one lineage while claiming to reason about independence.
test("C3 flags a conclusion resting entirely on one lineage", () => {
  const c = mechanicalChallenge({
    conclusion: "These sources corroborate each other.",
    steps: steps([
      { step: "Will's figure.", cites: ["e1"], quote: "approximately a 1 in 300 chance" },
      { step: "Will's method.", cites: ["e2"], quote: "In my Bayesian analysis" },
      { step: "Eric agrees.", cites: ["e3"], quote: "I arrive at a similar order of magnitude" },
    ]),
    blocks: BLOCKS,
    jobType: "lineage",
  });
  const c3 = c.objections.find((o) => o.check === "C3");
  assert.ok(c3, "expected a C3 objection");
  assert.equal(c3.severity, "high");
  assert.equal(c3.detail.lineage, "debate-2024");
  assert.equal(c.verdict, "unsupported");
  assert.match(c3.objection, /one observation of the world read 3 ways/);
});

test("C3 severity drops below high when the job is not about lineage", () => {
  const c = mechanicalChallenge({
    conclusion: "The crux is the prior.",
    steps: steps([
      { step: "One.", cites: ["e1"], quote: "approximately a 1 in 300 chance" },
      { step: "Two.", cites: ["e2"], quote: "In my Bayesian analysis" },
    ]),
    blocks: BLOCKS,
    jobType: "crux",
  });
  assert.equal(c.objections.find((o) => o.check === "C3").severity, "medium");
  assert.equal(c.verdict, "overstated");
});

test("C2 catches asserting more independent sources than the citations span", () => {
  const c = mechanicalChallenge({
    conclusion: "There are 4 independent lineages supporting this.",
    steps: steps([
      { step: "One.", cites: ["e1"], quote: "approximately a 1 in 300 chance" },
      { step: "Two.", cites: ["e4"], quote: "highly uncertain priors" },
    ]),
    blocks: BLOCKS,
  });
  const c2 = c.objections.find((o) => o.check === "C2");
  assert.ok(c2);
  assert.equal(c2.severity, "high");
  assert.deepEqual(c2.detail, { claimed: 4, spanned: 2 });
});

test("C2 stays quiet when the claim is at or under the cited spread", () => {
  const c = mechanicalChallenge({
    conclusion: "There are 2 independent lineages supporting this.",
    steps: steps([
      { step: "One.", cites: ["e1"], quote: "approximately a 1 in 300 chance" },
      { step: "Two.", cites: ["e4"], quote: "highly uncertain priors" },
    ]),
    blocks: BLOCKS,
  });
  assert.equal(c.objections.find((o) => o.check === "C2"), undefined);
});

test("C1 flags a corpus-wide conclusion drawn from a small slice", () => {
  const many = Array.from({ length: 20 }, (_, i) => ({
    evidence_id: `x${i}`,
    claim: `claim ${i}`,
    source: { excerpt: `excerpt number ${i} with enough text to quote` },
    provenance: { document_id: `doc${i}`, lineage_id: `lin${i}` },
    confidence_label: "MEDIUM",
  }));
  const c = mechanicalChallenge({
    conclusion: "The corpus is largely correlated.",
    steps: verifyCitations(
      [{ step: "One.", cites: ["x0"], quote: "excerpt number 0 with enough text to quote" }],
      many
    ).steps,
    blocks: many,
  });
  const c1 = c.objections.find((o) => o.check === "C1");
  assert.ok(c1);
  assert.equal(c1.detail.total, 20);
  assert.equal(c1.severity, "medium");
});

test("C4 flags counter-evidence the reasoning never addressed", () => {
  const c = mechanicalChallenge({
    conclusion: "The question is settled.",
    steps: steps([{ step: "One.", cites: ["e1"], quote: "approximately a 1 in 300 chance" }]),
    blocks: BLOCKS,
    edges: [{ from: "e5", to: "e1", relation: "qualifies", level: "claim" }],
  });
  const c4 = c.objections.find((o) => o.check === "C4");
  assert.ok(c4);
  assert.match(c4.objection, /e5/);
});

test("C4 stays quiet when the qualifying block was itself cited", () => {
  const c = mechanicalChallenge({
    conclusion: "Two lineages, with a caveat.",
    steps: steps([
      { step: "One.", cites: ["e1"], quote: "approximately a 1 in 300 chance" },
      { step: "The caveat.", cites: ["e5"], quote: "the market settled considerably higher" },
    ]),
    blocks: BLOCKS,
    edges: [{ from: "e5", to: "e1", relation: "qualifies", level: "claim" }],
  });
  assert.equal(c.objections.find((o) => o.check === "C4"), undefined);
});

test("C5 flags HIGH confidence resting on almost nothing", () => {
  const c = mechanicalChallenge({
    conclusion: "Definitely two lineages.",
    confidence: "HIGH",
    steps: steps([{ step: "One.", cites: ["e1"], quote: "approximately a 1 in 300 chance" }]),
    blocks: BLOCKS,
  });
  const c5 = c.objections.find((o) => o.check === "C5");
  assert.ok(c5);
  assert.equal(c5.detail.cited_blocks, 1);
});

test("C5 flags a conclusion built only on LOW and FLAGGED blocks", () => {
  const c = mechanicalChallenge({
    conclusion: "The matter is closed.",
    confidence: "MEDIUM",
    steps: steps([
      { step: "Market.", cites: ["e5"], quote: "the market settled considerably higher" },
      { step: "Consensus.", cites: ["e6"], quote: "everyone agrees the question is closed" },
    ]),
    blocks: BLOCKS,
  });
  const c5 = c.objections.find((o) => o.check === "C5");
  assert.ok(c5);
  assert.equal(c5.detail.all_shaky, true);
});

test("C6 flags steps that cite without quoting", () => {
  const c = mechanicalChallenge({
    conclusion: "Two lineages.",
    steps: steps([
      { step: "Points only.", cites: ["e1"] },
      { step: "Also points.", cites: ["e4"] },
    ]),
    blocks: BLOCKS,
  });
  const c6 = c.objections.find((o) => o.check === "C6");
  assert.ok(c6);
  assert.equal(c6.detail.weak, 2);
  assert.equal(c6.severity, "medium");
});

test("C7 flags shown work drawn entirely from one block", () => {
  const c = mechanicalChallenge({
    conclusion: "Two lineages.",
    steps: steps([
      { step: "One.", cites: ["e1"], quote: "approximately a 1 in 300 chance" },
      { step: "Two.", cites: ["e1"], quote: "was the result of a lab leak" },
      { step: "Three.", cites: ["e1"], quote: "1 in 300 chance that SARS-CoV-2" },
    ]),
    blocks: BLOCKS,
  });
  const c7 = c.objections.find((o) => o.check === "C7");
  assert.ok(c7);
  assert.equal(c7.detail.block, "e1");
  assert.equal(c7.detail.document, "will-decision");
});

test("the mechanical challenger is deterministic", () => {
  const args = {
    conclusion: "There are 4 independent lineages.",
    confidence: "HIGH",
    steps: steps([{ step: "One.", cites: ["e1"], quote: "approximately a 1 in 300 chance" }]),
    blocks: BLOCKS,
    jobType: "lineage",
  };
  assert.deepEqual(mechanicalChallenge(args), mechanicalChallenge(args));
});

test("the mechanical challenger survives an empty proposal", () => {
  const c = mechanicalChallenge({ conclusion: "", steps: [], blocks: BLOCKS });
  assert.ok(c.verdict);
  assert.equal(c.route, "mechanical");
});

test("severity aggregates to the worst objection found", () => {
  const c = mechanicalChallenge({
    conclusion: "There are 6 independent lineages.",
    confidence: "HIGH",
    steps: steps([{ step: "One.", cites: ["e1"], quote: "approximately a 1 in 300 chance" }]),
    blocks: BLOCKS,
    jobType: "lineage",
  });
  assert.equal(c.severity, "high");
  assert.equal(c.verdict, "unsupported");
  assert.ok(c.objections.length >= 2);
});
