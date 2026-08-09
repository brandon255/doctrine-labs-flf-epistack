/**
 * parsers/json.js — accept user-supplied JSON evidence blocks and hydrate
 * them for the Epistack engine.
 *
 * The engine expects an array of evidence blocks, each with at least:
 *   - evidence_id (string)
 *   - claim      (string)
 *   - source     ({ type, identifier, root_source_id? })
 *   - confidence_label (HIGH | MEDIUM | LOW)
 *
 * Users will paste/drag JSON. We accept three shapes:
 *   1. { blocks: [...] }   — wrapped (matches the on-disk file shape)
 *   2. [...]               — bare array
 *   3. { evidence_blocks: [...] } — alternate wrapped
 *
 * Missing required fields get filled with safe defaults; unknown fields
 * are preserved. Validation errors are surfaced with a precise message
 * so the UI can show them inline.
 */

/**
 * @typedef {object} ParseResult
 * @property {boolean} ok
 * @property {object[]} [blocks]
 * @property {string}   [error]
 * @property {string}   [hint]
 */

const REQUIRED_FIELDS = ["claim"];
const SOURCE_FIELDS = ["type", "identifier"];

function isObject(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function hydrateBlock(raw, index) {
  if (!isObject(raw)) {
    throw new Error(`block #${index + 1} is not an object`);
  }
  const block = { ...raw };

  if (!block.evidence_id) {
    block.evidence_id = `uploaded-${index + 1}`;
  }
  if (!block.timestamp) {
    block.timestamp = new Date().toISOString();
  }

  for (const field of REQUIRED_FIELDS) {
    if (!block[field] || typeof block[field] !== "string") {
      throw new Error(`block #${index + 1} is missing required field "${field}" (string)`);
    }
  }

  if (!isObject(block.source)) {
    block.source = {};
  }
  for (const field of SOURCE_FIELDS) {
    if (block.source[field]) continue;
    // Try to derive identifier from provenance.context URL.
    if (field === "identifier" && typeof block.provenance?.context === "string") {
      const m = block.provenance.context.match(/^https?:\/\/([^/]+)/);
      if (m) {
        block.source.identifier = m[1];
        continue;
      }
    }
    block.source[field] = field === "identifier" ? `uploaded-doc-${index + 1}` : "document";
  }

  if (!block.provenance) {
    block.provenance = {
      captured_by: "user-upload",
      captured_at: new Date().toISOString(),
      context: "(user-uploaded; no URL provided)",
    };
  }
  // Normalize provenance.context to a string for the engine's URL extractor.
  if (isObject(block.provenance.context)) {
    block.provenance.context = block.provenance.context.url
      ?? block.provenance.context.uri
      ?? JSON.stringify(block.provenance.context);
  }
  if (!block.provenance.context) {
    block.provenance.context = "(user-uploaded; no URL provided)";
  }

  if (!block.confidence_label) {
    block.confidence_label = "MEDIUM";
  }

  return block;
}

/**
 * @param {string} text
 * @returns {ParseResult}
 */
export function parseJsonEvidence(text) {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, error: "empty input", hint: "Paste JSON or drop a .json file." };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `invalid JSON: ${e.message}`, hint: "Check for trailing commas or quotes." };
  }

  let blocks;
  if (Array.isArray(parsed)) {
    blocks = parsed;
  } else if (isObject(parsed)) {
    if (Array.isArray(parsed.blocks)) blocks = parsed.blocks;
    else if (Array.isArray(parsed.evidence_blocks)) blocks = parsed.evidence_blocks;
    else if (Array.isArray(parsed.evidence)) blocks = parsed.evidence;
    else {
      return {
        ok: false,
        error: "JSON is not an array of evidence blocks",
        hint: 'Expected: [{ "claim": "...", "source": {...} }, ...] or { "blocks": [...] }',
      };
    }
  } else {
    return { ok: false, error: "JSON must be an array or an object with a blocks[] field" };
  }

  if (blocks.length === 0) {
    return { ok: false, error: "array is empty", hint: "Add at least one evidence block." };
  }

  try {
    const hydrated = blocks.map((b, i) => hydrateBlock(b, i));
    return { ok: true, blocks: hydrated };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}