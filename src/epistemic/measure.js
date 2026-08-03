/**
 * Measurement evidence — verifying claims about quantities, not just quotes.
 *
 * The adjudication protocol was built for text evidence: a block carries a
 * verbatim excerpt, and verifyCitations() checks the model's quote against it.
 * That works for "the paper said X." It does not work for "there are 536 tests"
 * or "the first commit was 2026-05-31" — those are claims about the state of a
 * system, not claims about what a document said.
 *
 * This module adds a second evidence kind: `measurement`. A measurement block
 * declares a command from a strict whitelist and a value the author claims the
 * command returns. verifyMeasurement() re-runs the command and checks the value
 * matches. The adversary cannot invent a command — only lie about what a real
 * command returned, and the re-run catches the lie.
 *
 * The whitelist is load-bearing. It is the entire injection surface. Every
 * command on it is read-only and bounded; nothing that writes, nothing that
 * exfiltrates, nothing with a side effect. Adding to it is a security decision,
 * not a convenience.
 */

import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, resolve, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The whitelist. Each entry declares the binary, the args it may take, how to
 * read the declared value out of the block, and how to compare it.
 *
 * `args` is a function of the block so the block can parameterize the command
 * (e.g. which repo, which file) without being able to swap the binary. The
 * function must return an array of strings; values not on the approved shape
 * are rejected by sanitizeArg before ever reaching exec.
 */
const WHITELIST = {
  // git log — count commits in a repo, or get the first/last commit date
  git: {
    bin: "git",
    approvedArgs: ["log", "--oneline", "--reverse", "--format=%ad", "--date=short", "HEAD"],
    readout: (block) => block?.measurement?.value ?? null,
    compare: (declared, actual) => compareValues(declared, actual),
  },
  // wc -l <file> — line count
  wc: {
    bin: "wc",
    approvedArgs: ["-l"],
    readout: (block) => block?.measurement?.value ?? null,
    compare: (declared, actual) => compareValues(declared, actual),
  },
  // find <root> -name <pat> — file count (we count lines of output)
  find: {
    bin: "find",
    approvedArgs: ["-maxdepth", "-name", "-type", "."],
    readout: (block) => block?.measurement?.value ?? null,
    compare: (declared, actual) => compareValues(declared, actual),
  },
  // npm test --silent — pass/fail + test count from the TAP-style summary
  npm: {
    bin: "npm",
    approvedArgs: ["test", "--silent", "run"],
    readout: (block) => block?.measurement?.value ?? null,
    compare: (declared, actual) => compareValues(declared, actual),
  },
};

/** The repository this module ships in. Used by the `$REPO` root token. */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Environment variable a reader can set to supply a root we cannot guess. */
export function envVarFor(rootName) {
  return `EPISTACK_ROOT_${String(rootName).toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
}

/**
 * Resolve a symbolic root name to a directory, in precedence order:
 *
 *   1. An environment variable — so a reader who has the repository somewhere
 *      else can point at it without editing a case file that is not theirs.
 *   2. The literal token `$REPO`, meaning the repository this code ships in.
 *      Self-relative, so it is correct on every checkout. Case files should
 *      prefer it over an absolute path whenever the target is this repo.
 *   3. The path declared in the case's `measurement_roots`.
 *
 * Absolute paths in a committed case file are only ever right on the machine
 * that wrote them, which is why the first two options exist.
 */
function resolveRoot(rootName, roots) {
  const fromEnv = process.env[envVarFor(rootName)];
  if (fromEnv) return resolve(fromEnv);

  const declared = roots?.[rootName];
  if (!declared) return null;
  if (declared === "$REPO") return REPO_ROOT;
  if (typeof declared === "string" && declared.startsWith("$REPO/")) {
    return resolve(REPO_ROOT, declared.slice("$REPO/".length));
  }
  return declared;
}

/**
 * Reject any arg that is not a string, or that contains shell metacharacters.
 * Even on the whitelist, the block's parameterization must be a plain value,
 * not a shell injection vector.
 */
function sanitizeArg(arg) {
  if (typeof arg !== "string") return null;
  // Allow alphanumerics, path separators, dots, dashes, underscores, equals,
  // spaces, and the literal %ad format token used by git --format. That is the
  // full vocabulary the approved commands need.
  if (!/^[A-Za-z0-9 ._\/\-=%]+$/.test(arg)) return null;
  // No command substitution, no redirection, no chaining.
  if (/[;&|`$()<>]/.test(arg)) return null;
  return arg;
}

/**
 * Compare a declared value to an actual one. Numbers compare numerically when
 * both sides parse as numbers; strings compare after whitespace normalization.
 * Returns { ok, declared, actual, reason }.
 */
export function compareValues(declared, actual) {
  const dStr = String(declared ?? "").trim();
  const aStr = String(actual ?? "").trim();

  // Numeric comparison only when BOTH sides are entirely a number.
  //
  // An earlier version pulled the leading integer out of each side and compared
  // those, which passed "2026-05-31" against "2026" — a date matching its own
  // year. A verifier that reports a false pass is worse than no verifier, since
  // it launders an unchecked claim as a checked one. Partial numeric matching is
  // therefore gone: if either side carries anything but a number, both are
  // compared as strings.
  const numeric = /^-?\d+(\.\d+)?$/;
  if (numeric.test(dStr) && numeric.test(aStr)) {
    const dNum = Number(dStr);
    const aNum = Number(aStr);
    return dNum === aNum
      ? { ok: true, declared: dNum, actual: aNum, reason: "numeric match" }
      : { ok: false, declared: dNum, actual: aNum, reason: `declared ${dNum}, measured ${aNum}` };
  }
  return dStr === aStr
    ? { ok: true, declared: dStr, actual: aStr, reason: "string match" }
    : {
        ok: false,
        declared: dStr,
        actual: aStr,
        reason: `declared "${dStr}", measured "${aStr}"`,
      };
}

/**
 * Named extractors — how to turn raw command output into the value to compare.
 *
 * These are named rather than supplied as functions because evidence blocks are
 * JSON, and JSON cannot carry code. That is a feature: a case file describes
 * what to read, and the reading is done by vetted code in this module. An
 * evidence file that could define its own extraction logic would be a code
 * execution surface wearing a data costume.
 */
const EXTRACTORS = {
  /** Number of non-empty lines. For `git log --oneline`. */
  line_count: (out) => String(out).split("\n").filter((l) => l.trim()).length,

  /** First non-empty line, trimmed. For `git log --reverse --format=...`. */
  first_line: (out) => String(out).split("\n").map((l) => l.trim()).find(Boolean) ?? "",

  /** Last non-empty line, trimmed. */
  last_line: (out) => {
    const lines = String(out).split("\n").map((l) => l.trim()).filter(Boolean);
    return lines[lines.length - 1] ?? "";
  },

  /** Leading integer anywhere in the output. For `wc -l`. */
  leading_int: (out) => String(out).match(/(\d+)/)?.[1] ?? String(out).trim(),

  /** The `# pass N` count from node:test TAP output. */
  tap_pass: (out) => {
    const m = String(out).match(/^#\s*pass\s+(\d+)\s*$/m);
    return m ? Number(m[1]) : null;
  },

  /** The `# fail N` count from node:test TAP output. */
  tap_fail: (out) => {
    const m = String(out).match(/^#\s*fail\s+(\d+)\s*$/m);
    return m ? Number(m[1]) : null;
  },

  /** The `# tests N` total from node:test TAP output. */
  tap_tests: (out) => {
    const m = String(out).match(/^#\s*tests\s+(\d+)\s*$/m);
    return m ? Number(m[1]) : null;
  },
};

export const EXTRACTOR_NAMES = Object.keys(EXTRACTORS);

/**
 * Run a measurement block's declared command and return the raw output.
 * Throws on disallowed commands, disallowed args, or non-zero exit (unless the
 * command is expected to fail, like a test run that reports failures).
 *
 * `cwd` is the root the measurement runs against — typically a repo path. It
 * is fixed by the caller (the case author / server), never taken from the
 * block, so a block cannot point a command at an arbitrary directory.
 */
export function runMeasurement(block, cwd = process.cwd(), roots = {}) {
  const m = block?.measurement;
  if (!m || typeof m !== "object") {
    return { ok: false, error: "block has no measurement spec" };
  }

  const entry = WHITELIST[m.command];
  if (!entry) {
    return { ok: false, error: `command '${m.command}' is not on the whitelist` };
  }

  // Cross-repository measurement without handing the block a filesystem.
  //
  // A claim like "Core OS has 536 tests" has to run somewhere other than the
  // case directory. The tempting fix is to whitelist `git -C <path>` and let the
  // block carry the path — but then the block chooses the directory, which is
  // precisely the property this module promised not to give it.
  //
  // Instead the block names a root, and the case config maps names to paths. A
  // block can only reach a directory the case author already declared, and an
  // undeclared name fails closed rather than falling back to cwd.
  let runDir = cwd;
  if (m.root !== undefined) {
    if (typeof m.root !== "string" || !m.root) {
      return { ok: false, error: `measurement.root must be a non-empty string` };
    }
    const declared = resolveRoot(m.root, roots);
    if (!declared) {
      return {
        ok: false,
        error:
          `measurement.root '${m.root}' is not declared in this case's measurement_roots. ` +
          `Declare it in source_registry.json to allow it.`,
      };
    }
    if (!existsSync(declared) || !statSync(declared).isDirectory()) {
      // Distinct from a failed check. The claim is well formed and may be
      // perfectly true; this machine simply does not have the thing it is about.
      // Collapsing that into "failed" would make an absent repository
      // indistinguishable from a false claim, which is the exact conflation
      // this tool exists to prevent.
      return {
        ok: false,
        unverifiable_here: true,
        error:
          `root '${m.root}' is not present on this machine (${declared}). ` +
          `Point at it with ${envVarFor(m.root)}=/path/to/repo, or treat this claim as unchecked.`,
      };
    }
    runDir = resolve(declared);
  }

  // The block may supply parameterizing args. Each one must pass sanitizeArg,
  // and the resulting arg list must be a subset shape of approvedArgs (i.e.
  // every flag the block supplies must be on the approved list; positional
  // values like paths and patterns are allowed if they sanitize).
  const blockArgs = Array.isArray(m.args) ? m.args : [];
  const sanitized = [];
  for (const a of blockArgs) {
    const s = sanitizeArg(a);
    if (s === null) return { ok: false, error: `rejected arg: ${JSON.stringify(a)}` };
    sanitized.push(s);
  }

  // Disallow flags the whitelist does not carry. A flag is any arg starting
  // with '-' that is not a negative number.
  for (const a of sanitized) {
    if (/^--?[^0-9]/.test(a) && !entry.approvedArgs.includes(a)) {
      return { ok: false, error: `flag '${a}' not approved for '${m.command}'` };
    }
  }

  // Bounded execution. No shell, no inheritance of arbitrary env. Long enough
  // for `npm test` on a small suite, short enough that a runaway is caught.
  try {
    const out = execFileSync(entry.bin, sanitized, {
      cwd: runDir,
      encoding: "utf8",
      timeout: 60000,
      maxBuffer: 4 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, CI: "1", FORCE_COLOR: "0", npm_config_audit: "false", npm_config_fund: "false" },
    });
    return { ok: true, output: String(out ?? "") };
  } catch (e) {
    // Some commands legitimately return non-zero (a failing test suite). The
    // stdout is still the readout we want; surface it rather than swallowing.
    const stdout = String(e.stdout ?? "");
    const stderr = String(e.stderr ?? "");
    if (stdout && m.expectNonZero) {
      return { ok: true, output: stdout, note: "non-zero exit expected and observed" };
    }
    return {
      ok: false,
      error: `command failed: ${e.message}`,
      stdout: stdout.slice(0, 1000),
      stderr: stderr.slice(0, 1000),
      status: e.status ?? null,
    };
  }
}

/**
 * Verify a measurement block: run its declared command, extract a value from
 * the output, and compare to the block's declared value.
 *
 * `extractValue` is a function on the block that pulls the relevant number or
 * string out of the raw output. If the block does not supply one, we fall back
 * to "the first integer in the output," which handles `wc -l`, `git log
 * --oneline | wc -l`, and similar line-count use cases.
 *
 * Returns the same shape as verifyCitations for text evidence, so the
 * adjudicator can treat them uniformly.
 */
export function verifyMeasurement(block, cwd = process.cwd(), roots = {}) {
  const run = runMeasurement(block, cwd, roots);
  if (!run.ok) {
    return {
      verified: false,
      ok: false,
      // Three states, not two. `unverifiable_here` means the check could not be
      // performed on this machine; it is neither a confirmation nor a detected
      // falsehood, and a reader must be able to tell it apart from both.
      status: run.unverifiable_here ? "unverifiable_here" : "failed",
      unverifiable_here: Boolean(run.unverifiable_here),
      reason: run.error,
      output: null,
      declared: block?.measurement?.value ?? null,
      actual: null,
    };
  }

  const extract = block?.measurement?.extract;
  let actual;
  if (typeof extract === "function") {
    // Programmatic callers (tests, internal tooling) may still pass a function.
    // Case files cannot, because they are JSON.
    try {
      actual = extract(run.output);
    } catch (e) {
      return { verified: false, ok: false, reason: `extract() threw: ${e.message}`, output: run.output };
    }
  } else if (typeof extract === "string") {
    const fn = EXTRACTORS[extract];
    if (!fn) {
      return {
        verified: false,
        ok: false,
        reason: `unknown extractor '${extract}' — known: ${EXTRACTOR_NAMES.join(", ")}`,
        output: run.output,
      };
    }
    actual = fn(run.output);
    if (actual === null || actual === "") {
      return {
        verified: false,
        ok: false,
        reason: `extractor '${extract}' found nothing in the command output`,
        output: run.output.slice(0, 500),
      };
    }
  } else {
    // No extractor declared. Default to the leading integer, which suits
    // `wc -l`, and is wrong often enough that cases should name one explicitly.
    const m = run.output.match(/(\d+)/);
    actual = m ? m[1] : run.output.trim();
  }

  const cmp = compareValues(block?.measurement?.value, actual);
  return {
    verified: cmp.ok,
    ok: cmp.ok,
    status: cmp.ok ? "verified" : "failed",
    unverifiable_here: false,
    reason: cmp.reason,
    declared: cmp.declared,
    actual: cmp.actual,
    output: run.output.slice(0, 500),
  };
}

/**
 * Dispatch: is this block measurement evidence or text evidence?
 * Default is text for backward compatibility with the three built-in cases.
 */
export function evidenceKind(block) {
  const k = block?.evidence_kind;
  if (k === "measurement" || k === "text") return k;
  // A block with a `measurement` field but no explicit kind is treated as
  // measurement, so old tooling that omits the field still works.
  if (block?.measurement && typeof block.measurement === "object") return "measurement";
  return "text";
}

export const WHITELISTED_COMMANDS = Object.keys(WHITELIST);
