/**
 * parsers/markdown.js — parse Markdown evidence lists into evidence blocks.
 *
 * Recognised shapes (deliberately lenient — people paste from many tools):
 *
 *   ## Title (optional heading)
 *   - [MEDIUM] The claim text goes here. https://example.com/source
 *   - **HIGH** Another claim. [Source name](https://example.com)
 *   - Just a bullet with a claim and a URL in it: https://nytimes.com/article
 *   - Or a citation block:
 *       > The verbatim quote
 *       Source: https://example.com
 *
 * Each bullet becomes one evidence block. The first bracketed label
 * ([HIGH]/[MEDIUM]/[LOW] or **HIGH** etc.) becomes confidence_label.
 * The first URL becomes the source identifier (hostname) and
 * provenance.context.
 *
 * If no URL is found, the bullet still becomes a block; it just won't
 * trace to a real lineage (the engine treats it as a fresh root).
 */

/**
 * @typedef {object} ParseResult
 * @property {boolean} ok
 * @property {object[]} [blocks]
 * @property {string}   [error]
 * @property {string}   [hint]
 */

const LABEL_RE = /^(?:\*\*\[?|\[)(HIGH|MEDIUM|LOW)(?:\]?\*\*|\])\s*/i;
const URL_RE = /https?:\/\/[^\s)\]]+/i;
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i;

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function deriveClaimAndLabel(rawLine) {
  let line = rawLine.trim();

  // Strip leading bullet markers (-, *, +, 1., etc.)
  line = line.replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, "");

  let label = null;
  const labelMatch = line.match(LABEL_RE);
  if (labelMatch) {
    label = labelMatch[1].toUpperCase();
    line = line.slice(labelMatch[0].length);
  }

  // Pull the first markdown link or bare URL as the source.
  let url = null;
  let displayUrl = null;
  const mdMatch = line.match(MARKDOWN_LINK_RE);
  if (mdMatch) {
    url = mdMatch[2];
    displayUrl = mdMatch[1];
  } else {
    const urlMatch = line.match(URL_RE);
    if (urlMatch) {
      url = urlMatch[0];
      displayUrl = url;
    }
  }

  // Claim = line with the URL/markdown link removed, trimmed.
  let claim = line;
  if (mdMatch) {
    claim = line.replace(MARKDOWN_LINK_RE, "").trim();
  } else if (url) {
    claim = line.replace(url, "").trim();
  }
  // Strip trailing punctuation/colon noise
  claim = claim.replace(/[\s\-–—:]+$/, "").trim();

  return { claim, label, url, displayUrl };
}

/**
 * @param {string} text
 * @returns {ParseResult}
 */
export function parseMarkdownEvidence(text) {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, error: "empty input", hint: "Paste Markdown or drop a .md file." };
  }

  const lines = text.split(/\r?\n/);
  const blocks = [];
  let inQuote = false;
  let quoteBuffer = [];
  let quoteUrl = null;
  let index = 0;

  const flushQuote = () => {
    if (quoteBuffer.length === 0) return;
    const claim = quoteBuffer.join(" ").trim();
    if (claim) {
      const host = quoteUrl ? hostnameOf(quoteUrl) : null;
      blocks.push({
        evidence_id: `md-${++index}`,
        timestamp: new Date().toISOString(),
        claim: claim.slice(0, 1000),
        source: {
          type: "document",
          identifier: host ?? `md-doc-${index}`,
          ...(host ? { root_source_id: host } : {}),
        },
        provenance: {
          captured_by: "user-upload",
          captured_at: new Date().toISOString(),
          context: quoteUrl ?? "(user-uploaded; no URL provided)",
        },
        confidence_label: "MEDIUM",
      });
    }
    quoteBuffer = [];
    quoteUrl = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip headings and blank lines (but blank lines close a quote block).
    if (!line) {
      if (inQuote) {
        flushQuote();
        inQuote = false;
      }
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) {
      if (inQuote) { flushQuote(); inQuote = false; }
      continue;
    }

    // Inside a blockquote: accumulate until blank line.
    if (/^>/.test(line)) {
      inQuote = true;
      const stripped = line.replace(/^>\s?/, "").trim();
      const urlMatch = stripped.match(URL_RE);
      if (urlMatch) {
        quoteUrl = urlMatch[0];
      } else if (/^source\s*:/i.test(stripped)) {
        const u = stripped.replace(/^source\s*:/i, "").trim().match(URL_RE);
        if (u) quoteUrl = u[0];
        continue;
      } else {
        quoteBuffer.push(stripped);
      }
      continue;
    }

    // Plain bullet / line item.
    const { claim, label, url } = deriveClaimAndLabel(line);
    if (!claim) continue;

    const host = url ? hostnameOf(url) : null;
    blocks.push({
      evidence_id: `md-${++index}`,
      timestamp: new Date().toISOString(),
      claim: claim.slice(0, 1000),
      source: {
        type: "document",
        identifier: host ?? `md-doc-${index}`,
        ...(host ? { root_source_id: host } : {}),
      },
      provenance: {
        captured_by: "user-upload",
        captured_at: new Date().toISOString(),
        context: url ?? "(user-uploaded; no URL provided)",
      },
      confidence_label: label ?? "MEDIUM",
    });
  }

  if (inQuote) flushQuote();

  if (blocks.length === 0) {
    return {
      ok: false,
      error: "no evidence bullets found",
      hint: "Each bullet (- or *) on its own line is one evidence. Include a URL or hostname for source tracking.",
    };
  }

  return { ok: true, blocks };
}