/**
 * Source identity: three-level resolution of "where did this come from?"
 *
 * Level 1  claim     — one excerpt. Keyed by evidence_id.
 * Level 2  document  — one bibliographic unit (a PDF, a blog post). Keyed by document_id.
 * Level 3  lineage   — one underlying generative event or observation set. Keyed by lineage_id.
 *
 * Independence must be counted at level 3. Counting at level 1 overstates the
 * number of sources by however many excerpts you happened to pull per document;
 * counting at level 2 still treats two judges watching the same debate as
 * independent witnesses.
 */

/** Hosts whose URLs carry no derivable identity and require a registry entry. */
const OPAQUE_HOSTS = new Set([
  "tinyurl.com",
  "bit.ly",
  "t.co",
  "goo.gl",
  "ow.ly",
  "drive.google.com",
  "docs.google.com",
]);

/**
 * Pull the first http(s) URL out of a free-text provenance context string.
 * @param {string} text
 * @returns {string|null}
 */
export function extractUrl(text) {
  if (typeof text !== "string") return null;
  const match = text.match(/https?:\/\/[^\s)"'\]]+/);
  return match ? match[0].replace(/[.,;]+$/, "") : null;
}

/**
 * Reduce a URL to a stable, human-legible document id.
 * Returns null when the host is opaque (shorteners), since the URL then
 * carries no information about what the document actually is.
 * @param {string} url
 * @returns {string|null}
 */
export function documentIdFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (OPAQUE_HOSTS.has(host)) return null;

  const hostSlug = host.replace(/\.(com|org|net|io|gov|edu)$/i, "").replace(/[^a-z0-9]+/gi, "-");

  const pathSlug = parsed.pathname
    .replace(/\.(pdf|html?|txt)$/i, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/^(p|r|posts?|blog)\//i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();

  const combined = pathSlug ? `${hostSlug}-${pathSlug}` : hostSlug;
  return combined.replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

/**
 * Resolve a block to its document id.
 *
 * Order of authority:
 *   1. An explicit registry entry matched by URL (handles shorteners and
 *      lets a human override a bad automatic derivation).
 *   2. Derivation from the URL found in provenance.context.
 *   3. The block's existing source.identifier, as a last resort.
 *
 * @param {object} block
 * @param {object} [registry] map of url -> { document_id, ... }
 * @returns {{ document_id: string, basis: 'registry'|'url'|'fallback', url: string|null }}
 */
export function resolveDocumentId(block, registry = {}) {
  const context = block?.provenance?.context ?? "";
  const url = extractUrl(context);

  if (url) {
    const byUrl = registry[url] ?? registry[url.replace(/\/$/, "")];
    if (byUrl?.document_id) {
      return { document_id: byUrl.document_id, basis: "registry", url };
    }
    const derived = documentIdFromUrl(url);
    if (derived) return { document_id: derived, basis: "url", url };
  }

  const explicit = block?.source?.identifier;
  const byIdentifier = registry[explicit];
  if (byIdentifier?.document_id) {
    return { document_id: byIdentifier.document_id, basis: "registry", url };
  }

  return { document_id: explicit ?? "unknown-document", basis: "fallback", url };
}

/**
 * Resolve a document id to its lineage id using the registry.
 * Documents with no declared lineage are their own lineage — we never
 * silently merge, because over-collapsing fakes independence in the
 * opposite direction.
 *
 * @param {string} documentId
 * @param {object} [registry] map keyed by url or document_id
 * @returns {{ lineage_id: string, declared: boolean }}
 */
export function resolveLineageId(documentId, registry = {}) {
  for (const entry of Object.values(registry)) {
    if (entry?.document_id === documentId && entry.lineage_id) {
      return { lineage_id: entry.lineage_id, declared: true };
    }
  }
  return { lineage_id: documentId, declared: false };
}

/**
 * Build a registry index keyed by document_id, for lookups that already
 * know the document.
 * @param {object} registry
 */
export function indexByDocumentId(registry = {}) {
  const out = {};
  for (const entry of Object.values(registry)) {
    if (entry?.document_id) out[entry.document_id] = entry;
  }
  return out;
}
