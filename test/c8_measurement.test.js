import { test } from "node:test";
import assert from "node:assert/strict";
import { mechanicalChallenge, assertedIndependenceCount } from "../src/epistemic/mechanical_challenge.js";

// Helper: build a minimal context that exercises C8.
function ctx({ conclusion, citedBlocks }) {
  return { conclusion, citedBlocks, blocks: citedBlocks, citedIds: new Set(citedBlocks.map((b) => b.evidence_id)) };
}

const measurement = (id, value, extra = {}) => ({
  evidence_id: id,
  evidence_kind: "measurement",
  measurement: { command: "git", args: ["log", "--oneline"], value, expectNonZero: true },
  ...extra,
});

test("C8 stays silent when no measurement blocks are cited", () => {
  const out = mechanicalChallenge({
    conclusion: "There are 536 tests.",
    steps: [{ cites: ["b1"], ok: true, quote: "x" }],
    blocks: [{ evidence_id: "b1", evidence_kind: "text" }],
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.equal(c8, undefined);
});

test("C8 stays silent when the conclusion has no quantitative claim", () => {
  const out = mechanicalChallenge({
    conclusion: "The build is solid.",
    steps: [{ cites: ["m1"], ok: true }],
    blocks: [measurement("m1", 536)],
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.equal(c8, undefined);
});

test("C8 stays silent when the headline number traces to a cited measurement", () => {
  const out = mechanicalChallenge({
    conclusion: "There are 536 passing tests.",
    steps: [{ cites: ["m1"], ok: true }],
    blocks: [measurement("m1", 536)],
    citedBlocks: [measurement("m1", 536)],
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.equal(c8, undefined);
});

test("C8 flags a headline number that appears in no cited measurement", () => {
  const out = mechanicalChallenge({
    conclusion: "There are 9999 passing tests.",
    steps: [{ cites: ["m1"], ok: true }],
    blocks: [measurement("m1", 536)],
    citedBlocks: [measurement("m1", 536)],
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.ok(c8, "expected a C8 objection");
  assert.match(c8.objection, /9999/);
  assert.match(c8.objection, /asserted, not measured/);
});

test("C8 flags a rarity phrase in the conclusion with high severity", () => {
  const out = mechanicalChallenge({
    conclusion: "The builder ranks in the single digits globally.",
    steps: [{ cites: ["m1"], ok: true }],
    blocks: [measurement("m1", 536)],
    citedBlocks: [measurement("m1", 536)],
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.ok(c8);
  assert.equal(c8.severity, "high");
  assert.match(c8.objection, /rarity/i);
});

test("C8 flags correlated measurements multiplied as independent", () => {
  const blocks = [
    measurement("m1", 0.03, { provenance: { correlated_with: ["m2"] } }),
    measurement("m2", 0.25, { provenance: { correlated_with: ["m1"] } }),
  ];
  const out = mechanicalChallenge({
    conclusion: "The cumulative rarity multiplied across 2 layers is under 1%.",
    steps: [{ cites: ["m1", "m2"], ok: true }],
    blocks,
    citedBlocks: blocks,
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.ok(c8);
  assert.match(c8.objection, /correlation/i);
  assert.match(c8.objection, /correlated/i);
});

test("C8 stays silent on multiplication phrasing when no correlations are declared", () => {
  const blocks = [
    measurement("m1", 2),
    measurement("m2", 3),
  ];
  const out = mechanicalChallenge({
    conclusion: "The product multiplied across 2 layers is 6.",
    steps: [{ cites: ["m1", "m2"], ok: true }],
    blocks,
    citedBlocks: blocks,
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  // Headline 6 traces to nothing, so C8 fires on the headline-origin arm.
  // What we are verifying here is that the correlation arm did NOT fire.
  if (c8) {
    assert.doesNotMatch(c8.objection, /correlation/i);
  }
});

test("the rarity-funnel-style case fires both C8 arms", () => {
  // This mirrors the self case: a rarity phrase plus declared correlation.
  const blocks = [
    measurement("funnel", "RARITY_PHRASE", {
      provenance: { correlated_with: ["companion"] },
    }),
    measurement("companion", 1, {
      provenance: { correlated_with: ["funnel"] },
    }),
  ];
  const out = mechanicalChallenge({
    conclusion: "Single digits globally via cumulative multiplication across 2 layers.",
    steps: [{ cites: ["funnel", "companion"], ok: true }],
    blocks,
    citedBlocks: blocks,
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.ok(c8);
  assert.equal(c8.severity, "high");
  assert.match(c8.objection, /rarity/i);
  assert.match(c8.objection, /correlation/i);
});

test("assertedIndependenceCount is unchanged by the C8 addition", () => {
  assert.equal(assertedIndependenceCount("3 independent lineages"), 3);
  assert.equal(assertedIndependenceCount("nothing about independence here"), null);
});

// --- C8 and the unrunnable measurement --------------------------------------

test("C8 names measurements this machine could not run", () => {
  const out = mechanicalChallenge({
    conclusion: "Core OS has 94 commits.",
    steps: [
      {
        cites: ["m1"],
        ok: false,
        measurements: [{ id: "m1", unverifiable_here: true, reason: "root absent" }],
      },
    ],
    blocks: [measurement("m1", 94)],
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.ok(c8, "C8 should fire when a cited measurement was unrunnable");
  assert.match(c8.objection, /could not be re-run on this machine/);
  assert.deepEqual(c8.detail.unverifiable_here, ["m1"]);
});

test("C8 raises the unrunnable objection even with no number in the conclusion", () => {
  // The earlier guard returned early when the conclusion carried no headline
  // number. That would have hidden the fact that nothing was checkable.
  const out = mechanicalChallenge({
    conclusion: "The record holds up.",
    steps: [
      { cites: ["m1"], ok: false, measurements: [{ id: "m1", unverifiable_here: true, reason: "root absent" }] },
    ],
    blocks: [measurement("m1", 94)],
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.ok(c8, "an unrunnable measurement is worth saying regardless of phrasing");
  assert.equal(c8.severity, "high", "all cited measurements unrunnable is the severe case");
});

test("C8 does not cry unrunnable when every measurement actually ran", () => {
  const out = mechanicalChallenge({
    conclusion: "Core OS has 94 commits.",
    steps: [{ cites: ["m1"], ok: true, measurements: [{ id: "m1", ok: true, unverifiable_here: false }] }],
    blocks: [measurement("m1", 94)],
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  if (c8) assert.doesNotMatch(c8.objection, /could not be re-run/);
});

test("C8 counts one absent root once, however many steps cite it", () => {
  // Regression: occurrences were counted instead of measurements, producing
  // the nonsense line "4 of 2 cited measurements could not be re-run".
  const out = mechanicalChallenge({
    conclusion: "Core OS has 94 commits.",
    steps: [
      { cites: ["m1"], ok: false, measurements: [{ id: "m1", unverifiable_here: true, reason: "absent" }] },
      { cites: ["m1"], ok: false, measurements: [{ id: "m1", unverifiable_here: true, reason: "absent" }] },
      { cites: ["m1"], ok: false, measurements: [{ id: "m1", unverifiable_here: true, reason: "absent" }] },
    ],
    blocks: [measurement("m1", 94)],
  });
  const c8 = out.objections.find((o) => o.check === "C8");
  assert.deepEqual(c8.detail.unverifiable_here, ["m1"]);
  assert.match(c8.objection, /1 of 1 cited measurement/);
});
