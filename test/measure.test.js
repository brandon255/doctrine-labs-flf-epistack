import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  runMeasurement,
  verifyMeasurement,
  evidenceKind,
  WHITELISTED_COMMANDS,
} from "../src/epistemic/measure.js";
import { validateEvidenceBlock } from "../src/evidence_block.js";

const REPO = process.cwd();

test("WHITELISTED_COMMANDS exposes the approved binaries", () => {
  assert.ok(WHITELISTED_COMMANDS.includes("git"));
  assert.ok(WHITELISTED_COMMANDS.includes("wc"));
  assert.ok(WHITELISTED_COMMANDS.includes("find"));
  assert.ok(WHITELISTED_COMMANDS.includes("npm"));
});

test("evidenceKind defaults to text for backward compatibility", () => {
  assert.equal(evidenceKind({}), "text");
  assert.equal(evidenceKind({ evidence_kind: "text" }), "text");
});

test("evidenceKind detects measurement from explicit field", () => {
  assert.equal(evidenceKind({ evidence_kind: "measurement" }), "measurement");
});

test("evidenceKind infers measurement from the presence of a measurement field", () => {
  assert.equal(evidenceKind({ measurement: { command: "wc", args: ["-l"] } }), "measurement");
});

test("runMeasurement rejects a command not on the whitelist", () => {
  const out = runMeasurement({
    measurement: { command: "rm", args: ["-rf", "/"], value: 0 },
  });
  assert.equal(out.ok, false);
  assert.match(out.error, /not on the whitelist/);
});

test("runMeasurement rejects shell metacharacters in args", () => {
  const out = runMeasurement({
    measurement: { command: "git", args: ["log; rm -rf /"], value: 0 },
  });
  assert.equal(out.ok, false);
  assert.match(out.error, /rejected arg/);
});

test("runMeasurement rejects unapproved flags", () => {
  const out = runMeasurement({
    measurement: { command: "git", args: ["--exec=/bin/pwn", "log"], value: 0 },
  });
  assert.equal(out.ok, false);
  assert.match(out.error, /not approved/);
});

test("verifyMeasurement confirms a correct line count via wc -l", () => {
  // wc -l on a known file returns "   N filename"; the default extractor pulls
  // the leading integer. This is the cleanest round-trip the whitelist supports.
  if (!existsSync("package.json")) return;
  const actual = Number(
    execFileSync("wc", ["-l", "package.json"], { cwd: REPO, encoding: "utf8" })
      .trim()
      .split(/\s+/)[0]
  );
  const out = verifyMeasurement({
    evidence_kind: "measurement",
    measurement: {
      command: "wc",
      args: ["-l", "package.json"],
      value: actual,
      expectNonZero: true,
    },
  });
  assert.equal(out.verified, true, `expected verify ok; reason was: ${out.reason}`);
  assert.equal(Number(out.actual), actual);
});

test("verifyMeasurement catches a wrong commit count", () => {
  const out = verifyMeasurement({
    evidence_kind: "measurement",
    measurement: {
      command: "git",
      args: ["log", "--oneline"],
      value: 99999,
      expectNonZero: true,
    },
  });
  assert.equal(out.verified, false);
  assert.match(out.reason, /declared/);
});

test("verifyMeasurement handles a block with no measurement spec", () => {
  const out = verifyMeasurement({ evidence_kind: "text" });
  assert.equal(out.verified, false);
  assert.match(out.reason, /no measurement/);
});

test("validateEvidenceBlock accepts a well-formed measurement block", () => {
  const block = {
    evidence_id: "m-ok",
    evidence_kind: "measurement",
    timestamp: "2026-08-03T00:00:00.000Z",
    claim: "There are N commits.",
    source: { type: "calculation", identifier: "repo:git-log", root_source_id: "repo-state" },
    measurement: { command: "git", args: ["log", "--oneline"], value: 8 },
    provenance: { captured_by: "user", captured_at: "2026-08-03T00:00:00.000Z" },
    confidence_label: "HIGH",
  };
  assert.equal(validateEvidenceBlock(block), block);
});

test("validateEvidenceBlock rejects a measurement block with no declared value", () => {
  const block = {
    evidence_id: "m-novalue",
    evidence_kind: "measurement",
    timestamp: "2026-08-03T00:00:00.000Z",
    claim: "Unfalsifiable.",
    source: { type: "calculation", identifier: "repo:git-log" },
    measurement: { command: "git", args: ["log"] },
    provenance: { captured_by: "user", captured_at: "2026-08-03T00:00:00.000Z" },
    confidence_label: "HIGH",
  };
  assert.throws(() => validateEvidenceBlock(block), /measurement\.value required/);
});

test("validateEvidenceBlock rejects a measurement block with no command", () => {
  const block = {
    evidence_id: "m-nocmd",
    evidence_kind: "measurement",
    timestamp: "2026-08-03T00:00:00.000Z",
    claim: "No command.",
    source: { type: "calculation", identifier: "repo:x" },
    measurement: { value: 8 },
    provenance: { captured_by: "user", captured_at: "2026-08-03T00:00:00.000Z" },
    confidence_label: "HIGH",
  };
  assert.throws(() => validateEvidenceBlock(block), /measurement\.command required/);
});

test("a date does not falsely match its own year", () => {
  // Regression: compareValues used to pull the leading integer from each side,
  // so declared "2026-05-31" passed against measured "2026". A verifier that
  // reports a false pass launders an unchecked claim as a checked one.
  const out = verifyMeasurement({
    evidence_kind: "measurement",
    measurement: {
      command: "git",
      args: ["log", "--reverse", "--format=%ad", "--date=short"],
      extract: () => "2026",
      value: "2026-05-31",
    },
  });
  assert.equal(out.verified, false, "a year must not satisfy a full date");
});

test("extractor line_count counts lines rather than reading digits out of a hash", () => {
  const actual = Number(
    execFileSync("git", ["log", "--oneline"], { cwd: REPO, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean).length
  );
  const out = verifyMeasurement({
    evidence_kind: "measurement",
    measurement: {
      command: "git",
      args: ["log", "--oneline"],
      extract: "line_count",
      value: actual,
      expectNonZero: true,
    },
  });
  assert.equal(out.verified, true, `expected ok; got: ${out.reason}`);
});

test("an unknown named extractor is rejected rather than silently defaulted", () => {
  const out = verifyMeasurement({
    evidence_kind: "measurement",
    measurement: { command: "git", args: ["log", "--oneline"], extract: "nope", value: 1 },
  });
  assert.equal(out.verified, false);
  assert.match(out.reason, /unknown extractor/);
});

// --- The third verification state ------------------------------------------
//
// A measurement can be confirmed, contradicted, or unrunnable. Folding the
// third into the second would tell a reader that an absent repository is a
// caught lie, which is precisely the conflation this tool exists to prevent.

test("an absent root reports unverifiable_here, not a failed check", () => {
  const out = verifyMeasurement(
    {
      evidence_kind: "measurement",
      measurement: { root: "gone", command: "git", args: ["log"], value: 1 },
    },
    process.cwd(),
    { gone: "/nonexistent/definitely/not/here" }
  );
  assert.equal(out.verified, false, "unchecked must never count as confirmed");
  assert.equal(out.status, "unverifiable_here");
  assert.equal(out.unverifiable_here, true);
});

test("a genuine mismatch is failed, and is not confused with unverifiable", () => {
  const out = verifyMeasurement(
    {
      evidence_kind: "measurement",
      measurement: { root: "here", command: "git", args: ["log", "--oneline"], extract: "line_count", value: 999999 },
    },
    "/tmp",
    { here: REPO }
  );
  assert.equal(out.verified, false);
  assert.equal(out.status, "failed");
  assert.equal(out.unverifiable_here, false, "a wrong number is wrong, not unchecked");
});

test("an undeclared root stays a hard failure, not merely unverifiable", () => {
  // Fails closed for a different reason: the case never authorised this root.
  // Treating it as 'unchecked' would soften a security boundary into a shrug.
  const out = verifyMeasurement(
    { evidence_kind: "measurement", measurement: { root: "nope", command: "git", args: ["log"], value: 1 } },
    process.cwd(),
    {}
  );
  assert.equal(out.status, "failed");
  assert.notEqual(out.unverifiable_here, true);
});

test("$REPO resolves to this repository on any checkout", () => {
  const actual = execFileSync("git", ["log", "--oneline"], { cwd: REPO, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean).length;
  const out = verifyMeasurement(
    {
      evidence_kind: "measurement",
      measurement: { root: "self", command: "git", args: ["log", "--oneline"], extract: "line_count", value: actual },
    },
    "/tmp",
    { self: "$REPO" }
  );
  assert.equal(out.verified, true, `expected $REPO to resolve; got: ${out.reason}`);
});

test("an environment variable overrides a declared path that is not there", () => {
  const actual = execFileSync("git", ["log", "--oneline"], { cwd: REPO, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean).length;
  process.env.EPISTACK_ROOT_ELSEWHERE = REPO;
  try {
    const out = verifyMeasurement(
      {
        evidence_kind: "measurement",
        measurement: {
          root: "elsewhere",
          command: "git",
          args: ["log", "--oneline"],
          extract: "line_count",
          value: actual,
        },
      },
      "/tmp",
      { elsewhere: "/some/path/only/the/author/has" }
    );
    assert.equal(out.verified, true, `env override should win; got: ${out.reason}`);
  } finally {
    delete process.env.EPISTACK_ROOT_ELSEWHERE;
  }
});

test("a rooted measurement fails closed when the root is not declared", () => {
  const out = verifyMeasurement(
    {
      evidence_kind: "measurement",
      measurement: { root: "somewhere", command: "git", args: ["log"], value: 1 },
    },
    process.cwd(),
    {} // no declared roots
  );
  assert.equal(out.verified, false);
  assert.match(out.reason, /not declared/);
});

test("a rooted measurement runs in the declared root", () => {
  const actual = Number(
    execFileSync("git", ["log", "--oneline"], { cwd: REPO, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean).length
  );
  const out = verifyMeasurement(
    {
      evidence_kind: "measurement",
      measurement: {
        root: "here",
        command: "git",
        args: ["log", "--oneline"],
        extract: "line_count",
        value: actual,
        expectNonZero: true,
      },
    },
    "/tmp", // cwd deliberately wrong; the root must win
    { here: REPO }
  );
  assert.equal(out.verified, true, `expected ok; got: ${out.reason}`);
});

test("verifyMeasurement uses default integer extraction when no extract() is supplied", () => {
  // wc -l on package.json returns "  N package.json"; the default extractor
  // pulls the leading integer.
  if (!existsSync("package.json")) return; // skip if running somewhere odd
  const out = verifyMeasurement({
    evidence_kind: "measurement",
    measurement: {
      command: "wc",
      args: ["-l", "package.json"],
      value: 99999, // deliberately wrong; we only care that extraction runs
      expectNonZero: true,
    },
  });
  // It will fail the comparison, but `actual` should be a real integer, not null.
  assert.equal(out.verified, false);
  assert.ok(Number.isFinite(Number(out.actual)), `actual should be a number, got ${out.actual}`);
});
