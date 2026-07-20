// Fixes RT-08: confidence labels are validated at the write boundary. An
// unlabeled or invalid record is REJECTED, not "asked for politely" in a prompt.

export const LABELS = ["HIGH", "MEDIUM", "LOW", "FLAGGED"];

const LABEL_RE = /\[CONFIDENCE:\s*(HIGH|MEDIUM|LOW|FLAGGED)\s*\]/i;

/** Returns the uppercase label found in text, or null. */
export function extractLabel(text) {
  const m = String(text).match(LABEL_RE);
  return m ? m[1].toUpperCase() : null;
}

export function isValidLabel(label) {
  return typeof label === "string" && LABELS.includes(label.toUpperCase());
}

/**
 * Ensure a record carries a valid confidence label.
 * @param {string} text content (may already embed the tag)
 * @param {string} [explicit] optional label passed by the caller
 * @returns {{ label: string, text: string }} text guaranteed to contain the tag
 * @throws if no valid label can be established
 */
export function requireLabel(text, explicit) {
  const embedded = extractLabel(text);
  const chosen = explicit ? String(explicit).toUpperCase() : embedded;
  if (!isValidLabel(chosen)) {
    throw new Error(
      `REJECTED: write is missing a valid confidence label. Expected one of ${LABELS.join(
        ", ",
      )} as [CONFIDENCE: X].`,
    );
  }
  const tag = `[CONFIDENCE: ${chosen}]`;
  const out = embedded ? String(text) : `${String(text).trimEnd()}\n${tag}`;
  return { label: chosen, text: out };
}
