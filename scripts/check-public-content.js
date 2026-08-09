#!/usr/bin/env node
/**
 * Hard filter for this public gift repo.
 * Exit 0 = clean. Exit 1 = forbidden personal / self-incriminating patterns found.
 *
 * Run: node scripts/check-public-content.js
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

const FORBIDDEN = [
  { id: "competence-vent", re: /don'?t know shit|I don'?t know how to use GitHub|not knowing how to use GitHub|did not yet know how to use GitHub|GitHub learning moment|asked how to save repos/i },
  { id: "personal-medical", re: /\bADHD\b|\bsobriety\b|\bAA meeting\b|\balcoholic\b/i },
  { id: "hard-ban-names", re: /\bLynn\b|Who'?s Who|landlord thread/i },
  { id: "money-distress", re: /\bI'?m broke\b|\bbehind on rent\b|cannot afford|out of money/i },
  { id: "profanity-author", re: /\bfucking\b|\bbullshit\b|\bwtf\b/i },
];

const SKIP_DIRS = new Set([".git", "node_modules"]);
const SKIP_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".DS_Store"]);
/** This script and FLF-supplied competition briefs (third-party text). */
const SKIP_FILES = new Set([
  "scripts/check-public-content.js",
  "docs/competition/FLF_JUDGING_CRITERIA.txt",
  "docs/competition/FLF_COMPETITION_BRIEF.txt",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name === ".DS_Store") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (SKIP_FILES.has(rel)) continue;
  if ([...SKIP_EXT].some((e) => rel.endsWith(e))) continue;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const { id, re } of FORBIDDEN) {
      if (re.test(lines[i])) {
        hits.push({ file: rel, line: i + 1, id, text: lines[i].slice(0, 160) });
      }
    }
  }
}

if (hits.length) {
  console.error(`PUBLIC CONTENT FILTER FAILED — ${hits.length} hit(s):\n`);
  for (const h of hits) {
    console.error(`  [${h.id}] ${h.file}:${h.line}`);
    console.error(`    ${h.text}`);
  }
  console.error("\nRule: professional, file-pertinent content only.");
  process.exit(1);
}

console.log("PUBLIC CONTENT FILTER OK — no forbidden personal patterns.");
process.exit(0);
