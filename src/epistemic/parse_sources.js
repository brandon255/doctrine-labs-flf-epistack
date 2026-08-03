/**
 * Parse SOURCE/EXCERPT/CLAIM blocks from PASTE_HERE.txt or RAW.md primary sections.
 * Used by scripts/ingest-raw-sources.js
 */

const BLOCK_RE =
  /SOURCE:\s*(.+?)\s*\nURL:\s*(.+?)\s*\nEXCERPT:\s*"(.+?)"\s*\nCLAIM:\s*(.+?)\s*\nCONFIDENCE:\s*(\w+)/gs;

/**
 * @param {string} text
 * @returns {object[]}
 */
export function parsePrimaryBlocks(text) {
  const blocks = [];
  let i = 0;
  for (const m of text.matchAll(BLOCK_RE)) {
    const [, sourceId, url, excerpt, claim, confidence] = m;
    const conf = confidence.toUpperCase();
    const label = ["HIGH", "MEDIUM", "LOW", "FLAGGED"].includes(conf) ? conf : "MEDIUM";
    const id = sourceId.trim().replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    blocks.push({
      evidence_id: `covid-primary-${id}-${++i}`,
      timestamp: "2026-06-19T12:00:00.000Z",
      claim: claim.trim(),
      source: {
        type: url.includes("substack") || url.includes("astralcodexten") ? "document" : "document",
        identifier: sourceId.trim(),
        excerpt: excerpt.trim(),
        root_source_id: sourceId.trim(),
      },
      provenance: {
        captured_by: "user",
        captured_at: "2026-06-19T12:00:00.000Z",
        context: url.trim(),
      },
      confidence_label: label,
      tags: ["primary", "ingested-from-raw"],
    });
  }
  return blocks;
}

/**
 * Extract section between markers (case-insensitive).
 * @param {string} text
 * @param {string} start
 * @param {string[]} ends
 */
export function extractSection(text, start, ends) {
  const lower = text.toLowerCase();
  const s = lower.indexOf(start.toLowerCase());
  if (s === -1) return "";
  let end = text.length;
  for (const e of ends) {
    const idx = lower.indexOf(e.toLowerCase(), s + start.length);
    if (idx !== -1 && idx < end) end = idx;
  }
  return text.slice(s, end).trim();
}
