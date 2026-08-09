/**
 * parsers/pdf.js — extract text from a PDF buffer and turn it into
 * evidence blocks.
 *
 * Strategy (no OCR — text-layer only):
 *   1. Extract text using pdf-parse.
 *   2. Split into sentences using a permissive regex.
 *   3. Group every N sentences into one evidence block (default N=5).
 *   4. The filename + first-page URL (if detectable) becomes the
 *      source identifier and provenance.context.
 *
 * Limitations (documented, not hidden):
 *   - Scanned PDFs (image-only) yield zero text and return an error.
 *     The UI is told to run OCR upstream if they need that.
 *   - Tables, figures, and multi-column layouts may parse out of order.
 *     For citation-graph purposes that's usually fine — we just need
 *     claims, not perfect reading order.
 */

import { createHash } from "node:crypto";

/**
 * @typedef {object} ParseResult
 * @property {boolean} ok
 * @property {object[]} [blocks]
 * @property {string}   [error]
 * @property {string}   [hint]
 * @property {string}   [text_excerpt]
 */

/**
 * @param {Buffer} buffer
 * @param {string} [filename]
 * @param {object}  [opts]
 * @param {number}  [opts.sentencesPerBlock=5]
 * @returns {Promise<ParseResult>}
 */
export async function parsePdfEvidence(buffer, filename = "uploaded.pdf", opts = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { ok: false, error: "empty PDF buffer" };
  }
  const sentencesPerBlock = Math.max(1, Math.min(50, opts.sentencesPerBlock ?? 5));

  let text;
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    text = (result.text ?? "").trim();
  } catch (e) {
    return {
      ok: false,
      error: `PDF parse failed: ${e.message}`,
      hint: "Scanned/image-only PDFs require OCR upstream. We only read the text layer.",
    };
  }

  if (!text || text.length < 50) {
    return {
      ok: false,
      error: "PDF has no extractable text",
      hint: "This looks like a scanned PDF. Run OCR (e.g. Adobe, Apple Preview → 'Export as Text') before uploading.",
    };
  }

  // Split into sentences. Permissive: period/exclamation/question followed by
  // whitespace + capital, OR paragraph break.
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z(])|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20); // skip fragments

  if (sentences.length === 0) {
    return { ok: false, error: "could not extract sentences from PDF text" };
  }

  // Stable identifier for the document = sha1 of the buffer (first 12 chars).
  // This means the same PDF uploaded twice produces the same lineage root.
  const digest = createHash("sha1").update(buffer).digest("hex").slice(0, 12);
  const docId = `pdf-${digest}`;
  const fileLabel = filename.replace(/\.pdf$/i, "");

  const blocks = [];
  for (let i = 0; i < sentences.length; i += sentencesPerBlock) {
    const slice = sentences.slice(i, i + sentencesPerBlock);
    const claim = slice.join(" ").slice(0, 1500);
    blocks.push({
      evidence_id: `pdf-${digest}-${Math.floor(i / sentencesPerBlock) + 1}`,
      timestamp: new Date().toISOString(),
      claim,
      source: {
        type: "document",
        identifier: docId,
        root_source_id: docId,
      },
      provenance: {
        captured_by: "user-upload",
        captured_at: new Date().toISOString(),
        context: `PDF upload: ${fileLabel}.pdf`,
      },
      confidence_label: "MEDIUM",
    });
  }

  return {
    ok: true,
    blocks,
    text_excerpt: sentences.slice(0, 2).join(" "),
  };
}