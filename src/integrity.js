import { existsSync, readFileSync, appendFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname } from "node:path";
import { sha256 } from "./crypto.js";
import { PATHS } from "./paths.js";

// Fixes RT-15: "verifiable" archives now have a real integrity mechanism — an
// append-only, hash-chained ledger. Each entry hashes (prevHash + canonical
// payload), so any retroactive edit breaks the chain and is detectable.
// This is the cross-platform replacement for `chattr +a` (fixes RT-09/RT-13).

const GENESIS = "0".repeat(64);

// Stable, recursively key-sorted JSON so the same logical entry always hashes
// identically — and so nested fields are actually covered by the hash (the
// replacer-array form drops them).
function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
    .join(",")}}`;
}

function lastHash(ledgerPath) {
  if (!existsSync(ledgerPath)) return GENESIS;
  const lines = readFileSync(ledgerPath, "utf8").trim().split("\n").filter(Boolean);
  if (lines.length === 0) return GENESIS;
  return JSON.parse(lines[lines.length - 1]).hash;
}

/**
 * Append a tamper-evident record. The payload is hashed in the chain; if you
 * want the payload itself secret, hash a digest of the encrypted blob instead.
 */
export function recordIntegrity(payload, ledgerPath = PATHS.ledger) {
  if (!existsSync(dirname(ledgerPath))) mkdirSync(dirname(ledgerPath), { recursive: true });
  const prevHash = lastHash(ledgerPath);
  const body = {
    ts: new Date().toISOString(),
    prevHash,
    payload,
  };
  const hash = sha256(prevHash + canonical(payload));
  const entry = { ...body, hash };
  appendFileSync(ledgerPath, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

/** Recompute the whole chain and report the first break, if any. */
export function verifyChain(ledgerPath = PATHS.ledger) {
  if (!existsSync(ledgerPath)) return { ok: true, entries: 0 };
  const lines = readFileSync(ledgerPath, "utf8").trim().split("\n").filter(Boolean);
  let prevHash = GENESIS;
  for (let i = 0; i < lines.length; i += 1) {
    const entry = JSON.parse(lines[i]);
    if (entry.prevHash !== prevHash) {
      return { ok: false, brokenAt: i, reason: "prevHash mismatch", entries: lines.length };
    }
    const expected = sha256(prevHash + canonical(entry.payload));
    if (expected !== entry.hash) {
      return { ok: false, brokenAt: i, reason: "payload altered", entries: lines.length };
    }
    prevHash = entry.hash;
  }
  return { ok: true, entries: lines.length, head: prevHash };
}

export function initLedger(ledgerPath = PATHS.ledger) {
  if (!existsSync(dirname(ledgerPath))) mkdirSync(dirname(ledgerPath), { recursive: true });
  if (!existsSync(ledgerPath)) writeFileSync(ledgerPath, "", "utf8");
}

/**
 * Fix a broken hash chain by recomputing prevHash/hash from payloads.
 * Use when verifyChain fails with prevHash mismatch (e.g. concurrent appends).
 * Backs up the original file before rewriting.
 */
export function repairChain(ledgerPath = PATHS.ledger) {
  if (!existsSync(ledgerPath)) {
    initLedger(ledgerPath);
    return { ok: true, entries: 0, repaired: 0, backup: null };
  }
  const raw = readFileSync(ledgerPath, "utf8").trim();
  if (!raw) return { ok: true, entries: 0, repaired: 0, backup: null };

  const before = verifyChain(ledgerPath);
  if (before.ok) return { ok: true, entries: before.entries, repaired: 0, backup: null };

  const lines = raw.split("\n").filter(Boolean);
  const backup = `${ledgerPath}.bak-${Date.now()}`;
  copyFileSync(ledgerPath, backup);

  let prevHash = GENESIS;
  const fixed = [];
  for (const line of lines) {
    const entry = JSON.parse(line);
    const payload = entry.payload;
    const hash = sha256(prevHash + canonical(payload));
    fixed.push(
      JSON.stringify({
        ts: entry.ts,
        prevHash,
        payload,
        hash,
      }),
    );
    prevHash = hash;
  }
  writeFileSync(ledgerPath, `${fixed.join("\n")}\n`, "utf8");
  const after = verifyChain(ledgerPath);
  return {
    ok: after.ok,
    entries: after.entries,
    repaired: lines.length,
    backup,
    brokenAt: before.brokenAt,
    reason: before.reason,
  };
}
