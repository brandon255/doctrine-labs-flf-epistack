#!/usr/bin/env node
/**
 * Export HOW_IT_WORKS_FOR_ALI.md → PDF for email attachment.
 * Uses doctrine-labs zero-dep multipage PDF builder (sibling repo).
 *
 *   node scripts/export-how-it-works-pdf.js
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_MD = join(ROOT, "docs/outreach/HOW_IT_WORKS_FOR_ALI.md");
const OUT_PDF = join(ROOT, "docs/outreach/HOW_IT_WORKS_FOR_ALI.pdf");
const DL_PDF = join(ROOT, "..", "doctrine-labs", "src", "pdf_multipage.js");

if (!existsSync(DL_PDF)) {
  console.error(`Need doctrine-labs sibling at ${DL_PDF}`);
  process.exit(1);
}

const { buildMultipagePdf } = await import(pathToFileURL(DL_PDF).href);

function mdToLines(md) {
  const out = [];
  for (const raw of md.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (line.startsWith("# ")) {
      out.push({ text: line.slice(2), size: 16, gap: 10 });
      continue;
    }
    if (line.startsWith("## ")) {
      out.push({ text: "", size: 10, gap: 6 });
      out.push({ text: line.slice(3), size: 13, gap: 8 });
      continue;
    }
    if (line.startsWith("### ")) {
      out.push({ text: line.slice(4), size: 11, gap: 6 });
      continue;
    }
    if (line.startsWith("---")) {
      out.push({ text: "", size: 9, gap: 8 });
      continue;
    }
    if (line.startsWith("|") && line.includes("|")) {
      // Flatten tables to a single readable line
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      out.push({ text: cells.join("  ·  "), size: 9, gap: 3 });
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      out.push({ text: "• " + line.slice(2).replace(/\*\*/g, ""), size: 10, gap: 3 });
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      out.push({ text: line.replace(/\*\*/g, ""), size: 10, gap: 3 });
      continue;
    }
    if (line.trim() === "") {
      out.push({ text: "", size: 9, gap: 4 });
      continue;
    }
    // Strip markdown bold/backticks for PDF Helvetica
    const plain = line
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    // Wrap long lines
    const max = 92;
    let rest = plain;
    while (rest.length > max) {
      let cut = rest.lastIndexOf(" ", max);
      if (cut < 40) cut = max;
      out.push({ text: rest.slice(0, cut), size: 10, gap: 3 });
      rest = rest.slice(cut).trimStart();
    }
    if (rest) out.push({ text: rest, size: 10, gap: 3 });
  }
  return out;
}

/** Chunk line objects into pages (~46 content lines each). */
function chunkLines(lines, perPage = 42) {
  const pages = [];
  for (let i = 0; i < lines.length; i += perPage) {
    pages.push({ lines: lines.slice(i, i + perPage) });
  }
  return pages.length ? pages : [{ lines: [{ text: "(empty)", size: 10, gap: 4 }] }];
}

const md = readFileSync(SRC_MD, "utf8");
const lines = mdToLines(md);
const pdf = buildMultipagePdf(chunkLines(lines), {
  title: "How the FLF Epistemic Stack works",
  author: "Brandon Flores / Doctrine Labs",
});
writeFileSync(OUT_PDF, pdf);
console.log(`Wrote ${OUT_PDF} (${pdf.length} bytes, ~${chunkLines(lines).length} pages)`);
