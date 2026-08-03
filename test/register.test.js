import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGuards, collectTestNames } from "../scripts/verify-register.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// The register asserts that each defect it describes is now guarded. That
// assertion is only worth something if it is checked, and the check is only
// worth something if it can fail. These tests cover the check.

test("parseGuards reads a single guard", () => {
  const md = "- **Guard:** `some named test`\n";
  assert.deepEqual(parseGuards(md), ["some named test"]);
});

test("parseGuards reads several guards from one line", () => {
  const md = "- **Guards:** `first test` · `second test`\n";
  assert.deepEqual(parseGuards(md), ["first test", "second test"]);
});

test("parseGuards reads a guards line that wraps", () => {
  // The register wraps at 90 columns, so a two-guard entry often spans lines.
  // A parser that silently dropped the continuation would under-report the
  // claims being checked, which fails safe in the wrong direction: fewer
  // claims checked, not more.
  const md = "- **Guards:** `first test` ·\n  `second test`\n";
  assert.deepEqual(parseGuards(md), ["first test", "second test"]);
});

test("parseGuards ignores backticked prose that is not a guard line", () => {
  const md = "Some paragraph mentioning `resolveVerdict` and `compareValues`.\n";
  assert.deepEqual(parseGuards(md), []);
});

test("collectTestNames finds this file's own tests", () => {
  const names = collectTestNames(join(ROOT, "test"));
  assert.equal(names.get("collectTestNames finds this file's own tests"), "register.test.js");
});

test("every guard the register claims actually exists", () => {
  // The end-to-end assertion, run as part of the ordinary suite rather than
  // only by the standalone script — so the register cannot rot unnoticed
  // between releases.
  const md = readFileSync(join(ROOT, "docs/DEFECT_REGISTER.md"), "utf8");
  const guards = parseGuards(md);
  const known = collectTestNames(join(ROOT, "test"));
  assert.ok(guards.length >= 5, `expected the register to claim guards; found ${guards.length}`);
  const missing = guards.filter((g) => !known.has(g));
  assert.deepEqual(missing, [], `register claims guards that do not exist: ${missing.join(", ")}`);
});

test("importing the verifier does not run it", () => {
  // The script is both a CLI and a module. If importing it executed main(),
  // this suite would recursively spawn `npm test`.
  assert.equal(typeof parseGuards, "function");
});
