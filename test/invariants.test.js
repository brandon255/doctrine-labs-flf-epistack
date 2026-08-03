import { test } from "node:test";
import assert from "node:assert/strict";
import { compareValues, verifyMeasurement } from "../src/epistemic/measure.js";
import { resolveVerdict } from "../src/epistemic/adjudicate.js";

/**
 * Category checks, as distinct from the regression guards in the defect register.
 *
 * A guard catches the bug we actually hit. `2026-05-31` passing against `2026`
 * has a guard, and that guard will hold forever — for that pair of values.
 *
 * It does nothing about the next member of the same family. The real defect was
 * never "dates match years"; it was "a partial match is reported as a match,"
 * and that family has infinite members we have not met.
 *
 * So these tests assert properties over a generated space of inputs rather than
 * checking remembered examples. They are written to fail for bugs nobody has
 * made yet, which is the only kind of test that can get ahead of us.
 */

// --- Category: a partial match must never be reported as a match -------------

test("no string that merely starts another is ever equal to it", () => {
  const bases = [
    "2026-05-31",
    "2026-05-31T14:22:09Z",
    "536",
    "5360",
    "12345",
    "abc-def",
    "0.5",
    "0.55",
    "100",
    "1000000",
    "v1.2.3",
    "2026",
    "181 passing",
    "a1b2c3d4e5",
    "-42",
    "3.14159",
  ];
  let checked = 0;

  for (const base of bases) {
    for (let cut = 1; cut < base.length; cut++) {
      const prefix = base.slice(0, cut);
      if (prefix === base) continue;

      // Either direction. The original bug was declared-longer-than-measured,
      // but nothing in the code made the reverse safe, and asserting only the
      // direction we were burned by is how the second half of a bug survives.
      for (const [a, b] of [
        [base, prefix],
        [prefix, base],
      ]) {
        const out = compareValues(a, b);
        assert.equal(
          out.ok,
          false,
          `"${a}" and "${b}" are different values, but compareValues called them equal`
        );
        checked++;
      }
    }
  }

  assert.ok(checked > 100, `expected a real search space; only checked ${checked} pairs`);
});

test("equality still holds where it should, so the rule above is not just strictness", () => {
  // A comparator that returns false for everything would pass the previous test
  // and be useless. Pin the other side.
  for (const v of ["536", "2026-05-31", "0", "abc", "1.5"]) {
    assert.equal(compareValues(v, v).ok, true, `"${v}" should equal itself`);
  }
  assert.equal(compareValues("536", 536).ok, true, "numeric and string 536 are the same quantity");
  assert.equal(compareValues(" 536 ", "536").ok, true, "surrounding whitespace is not a difference");
});

// --- Category: no success state without the work that earns it ---------------

test("a verified measurement always carries both values it claims to have compared", () => {
  // The failure this forbids: a code path that reaches `verified: true` while
  // one side is null, empty, or undefined — a pass reported without a
  // comparison having happened. That is the shape of the Tier 1 defects.
  const cases = [
    { root: "missing", command: "git", args: ["log"], value: 1 },
    { command: "git", args: ["log", "--oneline"], extract: "line_count", value: 999999 },
    { command: "git", args: ["log", "--oneline"], extract: "no_such_extractor", value: 1 },
    { command: "not_whitelisted", args: [], value: 1 },
    { command: "git", args: ["log"], value: "" },
    { command: "git", args: ["log"] },
  ];

  for (const measurement of cases) {
    const out = verifyMeasurement({ evidence_kind: "measurement", measurement }, process.cwd(), {});
    if (out.verified !== true) continue;
    assert.notEqual(out.declared, null, `verified with no declared value: ${JSON.stringify(measurement)}`);
    assert.notEqual(out.actual, null, `verified with no measured value: ${JSON.stringify(measurement)}`);
    assert.notEqual(out.declared, undefined, `verified with undefined declared: ${JSON.stringify(measurement)}`);
    assert.notEqual(out.actual, undefined, `verified with undefined measured: ${JSON.stringify(measurement)}`);
  }
});

test("every failed measurement says which kind of not-passing it was", () => {
  // Three states exist only if every non-passing result is classified. An
  // unlabelled failure silently rejoins the two-state world.
  const cases = [
    { root: "missing_root", command: "git", args: ["log"], value: 1 },
    { command: "git", args: ["log", "--oneline"], extract: "line_count", value: 999999 },
    { command: "not_whitelisted", args: [], value: 1 },
  ];

  for (const measurement of cases) {
    const out = verifyMeasurement(
      { evidence_kind: "measurement", measurement },
      process.cwd(),
      { missing_root: "/nonexistent/path" }
    );
    if (out.verified) continue;
    assert.ok(
      out.status === "failed" || out.status === "unverifiable_here",
      `unclassified non-pass for ${JSON.stringify(measurement)}: status=${out.status}`
    );
    assert.equal(
      out.status === "unverifiable_here",
      Boolean(out.unverifiable_here),
      "status and flag must agree, or downstream readers get two different answers"
    );
  }
});

// --- Category: an absent critic is never a satisfied critic ------------------

test("no degenerate challenge panel earns a clean verified verdict", () => {
  // The Tier 1 defect was one member of this family: `null` fell through to
  // "verified". These are the other shapes an unrun, broken, or empty
  // challenge can take. None of them is a review, so none may read as one.
  const verification = { verified: true, all_weak: false };
  const degenerate = [
    null,
    undefined,
    [],
    {},
    { challenges: [] },
    { challenges: null },
    { challenges: undefined },
    [{}],
    [{ verdict: null }],
    [{ verdict: undefined }],
    [{ verdict: "" }],
  ];

  for (const panel of degenerate) {
    const verdict = resolveVerdict(verification, panel);
    assert.notEqual(
      verdict,
      "verified",
      `panel ${JSON.stringify(panel)} produced a clean "verified" without a challenge having run`
    );
  }
});

test("a challenge that ran and approved still earns verified, so the rule above is not blanket refusal", () => {
  const verification = { verified: true, all_weak: false };
  assert.equal(resolveVerdict(verification, [{ verdict: "sound", lineage_id: "deterministic" }]), "verified");
});

test("unverified work cannot be rescued by any panel", () => {
  // Whatever the challengers say, failed citation verification is dispositive.
  // A conclusion whose quotes are not in the corpus is not redeemable by
  // approval, because approval is not evidence.
  const panels = [
    [{ verdict: "sound" }],
    [{ verdict: "sound" }, { verdict: "sound" }],
    null,
    [],
  ];
  for (const panel of panels) {
    assert.equal(resolveVerdict({ verified: false, all_weak: false }, panel), "unverified");
  }
});
