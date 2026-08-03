#!/usr/bin/env node
/**
 * Verify the defect register against the test suite.
 *
 * The register claims that every defect it describes is now guarded by a named
 * test. Without a check, that claim is exactly the kind of unfalsifiable
 * self-report the rest of this repository refuses to accept from anyone else.
 *
 * So: parse the guard names out of the register, confirm each one exists in
 * test/, and confirm the suite passes. A deleted or renamed guard breaks this
 * script, which is the point — the register cannot quietly drift into fiction.
 *
 *   node scripts/verify-register.js
 *
 * Exits non-zero when a claimed guard is missing, so it can gate a release.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTER = join(ROOT, "docs/DEFECT_REGISTER.md");
const TEST_DIR = join(ROOT, "test");

/**
 * Pull guard names out of the register.
 *
 * Format, one or more per entry, backticked and comma-or-middot separated:
 *   - **Guard:** `test name`
 *   - **Guards:** `test name` · `other test name`
 */
export function parseGuards(markdown) {
  const guards = [];
  const lineRe = /^\s*[-*]\s*\*\*Guards?:\*\*\s*(.+)$/gm;
  let m;
  while ((m = lineRe.exec(markdown)) !== null) {
    // A guards line may wrap onto the following line in the source.
    let payload = m[1];
    const rest = markdown.slice(lineRe.lastIndex);
    const continuation = rest.match(/^\n\s{2,}(`[^\n]*)/);
    if (continuation) payload += " " + continuation[1];

    for (const g of payload.matchAll(/`([^`]+)`/g)) {
      const name = g[1].trim();
      if (name) guards.push(name);
    }
  }
  return guards;
}

/** Every `test("...")` name declared anywhere in test/. */
export function collectTestNames(testDir) {
  const names = new Map();
  for (const file of readdirSync(testDir).filter((f) => f.endsWith(".test.js"))) {
    const src = readFileSync(join(testDir, file), "utf8");
    for (const m of src.matchAll(/^test\(\s*(["'`])((?:\\.|(?!\1).)*)\1/gm)) {
      names.set(m[2], file);
    }
  }
  return names;
}

function main() {
  const markdown = readFileSync(REGISTER, "utf8");
  const guards = parseGuards(markdown);
  const known = collectTestNames(TEST_DIR);

  if (guards.length === 0) {
    console.error("No guards found in the register. Either the format changed or the claims are gone.");
    process.exit(1);
  }

  console.log(`Defect register: ${guards.length} claimed guard(s)\n`);

  const missing = [];
  for (const g of guards) {
    const file = known.get(g);
    if (file) console.log(`  ok      ${g}  →  test/${file}`);
    else {
      console.log(`  MISSING ${g}`);
      missing.push(g);
    }
  }

  if (missing.length) {
    console.error(
      `\n${missing.length} claimed guard(s) do not exist. The register is asserting ` +
        `protection that is not there — fix the test or fix the claim.`
    );
    process.exit(1);
  }

  // A guard that exists but fails protects nothing.
  console.log("\nAll guards exist. Running the suite to confirm they pass…\n");
  let out;
  try {
    out = execFileSync("npm", ["test"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
  const pass = Number(out.match(/^#\s*pass\s+(\d+)\s*$/m)?.[1] ?? NaN);
  const fail = Number(out.match(/^#\s*fail\s+(\d+)\s*$/m)?.[1] ?? NaN);

  if (!Number.isFinite(pass) || !Number.isFinite(fail)) {
    console.error("Could not read a pass/fail count from the suite output.");
    process.exit(1);
  }

  console.log(`Suite: ${pass} passing, ${fail} failing.`);
  if (fail > 0) {
    console.error("\nThe suite is not green, so the register's guarantees are not currently held.");
    process.exit(1);
  }

  console.log(
    `\nRegister verified: ${guards.length} defect guard(s) present and passing. ` +
      `Every "we fixed this" in docs/DEFECT_REGISTER.md is checkable, not asserted.`
  );
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
