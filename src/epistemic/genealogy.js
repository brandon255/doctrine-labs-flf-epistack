/**
 * Provenance genealogy: three-level independence resolution for evidence blocks.
 *
 * The question this answers is not "how many things were cited" but "how many
 * times did the world get observed". Those differ by a large factor in practice,
 * and the gap is where false confidence comes from.
 *
 *   Level 1  claim     — one excerpt (evidence_id)
 *   Level 2  document  — one bibliographic unit (document_id)
 *   Level 3  lineage   — one underlying generative event (lineage_id)
 *
 * The headline count is level 3. Levels 1 and 2 remain available as drill-down.
 * We report the most conservative number because the failure mode we care about
 * is overstating independence, and every intermediate count does exactly that.
 */

import { createHash } from "node:crypto";
import { resolveDocumentId, resolveLineageId, indexByDocumentId } from "./source_identity.js";

/** @typedef {'independent' | 'correlated' | 'unknown'} IndependenceClass */

/**
 * Legacy single-level root key. Retained because the alias tooling and older
 * fixtures still address blocks this way.
 * @param {object} block
 * @param {object} [aliases]
 */
export function rootKeyForBlock(block, aliases = {}) {
  const id = block.source?.root_source_id ?? block.source?.identifier;
  if (!id || typeof id !== "string") return "unknown-root";
  const norm = id.trim().toLowerCase();
  const canonical = aliases[norm] ?? aliases[id] ?? norm;
  return String(canonical).trim().toLowerCase();
}

/**
 * Stable cluster id from any key (deterministic, so demos reproduce exactly).
 * @param {string} key
 */
export function clusterIdFromRoot(key) {
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 12);
  return `cluster-${hash}`;
}

/**
 * Group block ids by a key function.
 * @param {object[]} blocks
 * @param {(b: object) => string} keyFn
 * @returns {Map<string, string[]>}
 */
function groupBy(blocks, keyFn) {
  const map = new Map();
  for (const block of blocks) {
    const key = keyFn(block);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(block.evidence_id);
  }
  return map;
}

/**
 * Build cluster records from a grouping.
 * @param {Map<string, string[]>} groups
 * @param {string} level
 */
function clustersFrom(groups, level) {
  const out = [];
  for (const [key, memberIds] of groups) {
    out.push({
      cluster_id: clusterIdFromRoot(`${level}:${key}`),
      level,
      root_source_id: key,
      member_ids: [...memberIds],
      independence_class: memberIds.length === 1 ? "independent" : "correlated",
      block_count: memberIds.length,
    });
  }
  return out;
}

/**
 * Resolve genealogy across all three levels.
 *
 * @param {object[]} blocks
 * @param {object} [opts]
 * @param {object} [opts.aliases]  legacy alias map, applied at document level
 * @param {object} [opts.registry] source_registry.json "documents" map
 * @returns {object}
 */
export function resolveGenealogy(blocks, { aliases = {}, registry = {} } = {}) {
  if (!Array.isArray(blocks)) throw new Error("REJECTED: blocks must be an array.");

  const byDocId = indexByDocumentId(registry);

  const annotated = blocks.map((block) => {
    const { document_id, basis } = resolveDocumentId(block, registry);
    const aliased = aliases[document_id] ?? document_id;
    const { lineage_id, declared } = resolveLineageId(aliased, registry);
    const entry = byDocId[aliased] ?? {};

    return {
      ...block,
      source: { ...block.source, document_id: aliased },
      provenance: {
        ...block.provenance,
        document_id: aliased,
        lineage_id,
        document_basis: basis,
        lineage_declared: declared,
        lineage_role: entry.lineage_role ?? "unknown",
        derives_from: entry.derives_from ?? [],
      },
    };
  });

  const claimGroups = groupBy(annotated, (b) => b.evidence_id);
  const docGroups = groupBy(annotated, (b) => b.provenance.document_id);
  const lineageGroups = groupBy(annotated, (b) => b.provenance.lineage_id);

  const documentClusters = clustersFrom(docGroups, "document");
  const lineageClusters = clustersFrom(lineageGroups, "lineage");

  // Stamp each block with its document-level independence class.
  for (const cluster of documentClusters) {
    for (const block of annotated) {
      if (block.provenance.document_id === cluster.root_source_id) {
        block.provenance.independence_class = cluster.independence_class;
      }
    }
  }

  // Edges: blocks sharing a document are the same source restated.
  const edges = [];
  for (const cluster of documentClusters) {
    if (cluster.member_ids.length < 2) continue;
    const sorted = [...cluster.member_ids].sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        edges.push({
          from: sorted[i],
          to: sorted[j],
          relation: "same_document",
          note: `Both excerpted from ${cluster.root_source_id} (${cluster.block_count} excerpts). One source, not ${cluster.block_count}.`,
        });
      }
    }
  }

  // Edges: documents sharing a lineage are readings of one shared event.
  for (const cluster of lineageClusters) {
    const docsInLineage = [
      ...new Set(
        annotated
          .filter((b) => b.provenance.lineage_id === cluster.root_source_id)
          .map((b) => b.provenance.document_id)
      ),
    ].sort();
    if (docsInLineage.length < 2) continue;
    for (let i = 0; i < docsInLineage.length; i++) {
      for (let j = i + 1; j < docsInLineage.length; j++) {
        edges.push({
          from: docsInLineage[i],
          to: docsInLineage[j],
          relation: "same_lineage",
          level: "document",
          note: `Both draw on ${cluster.root_source_id}. Agreement between them is weak corroboration.`,
        });
      }
    }
  }

  // Edges: explicit derivation declared in the registry.
  const derivationEdges = [];
  for (const entry of Object.values(registry)) {
    for (const parent of entry?.derives_from ?? []) {
      derivationEdges.push({
        from: entry.document_id,
        to: parent,
        relation: "derives_from",
        level: "document",
        note: entry.derivation_basis ?? "Declared derivation.",
      });
    }
  }
  const seenDerivation = new Set();
  for (const e of derivationEdges) {
    const key = `${e.from}|${e.to}`;
    if (seenDerivation.has(key)) continue;
    seenDerivation.add(key);
    edges.push(e);
  }

  const claimCount = claimGroups.size;
  const documentCount = docGroups.size;
  const lineageCount = lineageGroups.size;
  const correlatedDocuments = documentClusters.filter((c) => c.block_count > 1).length;
  const multiDocLineages = lineageClusters.filter((c) => {
    const docs = new Set(
      annotated.filter((b) => b.provenance.lineage_id === c.root_source_id).map((b) => b.provenance.document_id)
    );
    return docs.size > 1;
  }).length;

  const assessment_line =
    `${claimCount} excerpts cited, drawn from ${documentCount} documents, ` +
    `tracing to ${lineageCount} independent lineage(s). ` +
    `Treat as ${lineageCount} independent source(s), not ${claimCount}.`;

  return {
    blocks: annotated,
    // Document-level clusters remain the default `clusters` view for
    // compatibility with existing report and UI code.
    clusters: documentClusters,
    documentClusters,
    lineageClusters,
    edges,
    summary: {
      block_count: blocks.length,
      claim_count: claimCount,
      document_count: documentCount,
      lineage_count: lineageCount,
      // Headline. Conservative by design: the level-3 count.
      independent_root_count: lineageCount,
      correlated_document_count: correlatedDocuments,
      correlated_lineage_count: multiDocLineages,
      inflation_factor: lineageCount > 0 ? Number((claimCount / lineageCount).toFixed(1)) : null,
      assessment_line,
    },
  };
}

/**
 * Merge auto-generated genealogy edges into a claim graph (dedupe by from+to+relation).
 * @param {object} graph
 * @param {object[]} genealogyEdges
 */
export function mergeGenealogyEdges(graph, genealogyEdges) {
  const base = {
    subquestion: graph?.subquestion ?? "unknown",
    version: graph?.version ?? "0.0",
    nodes: graph?.nodes ?? [],
    edges: [...(graph?.edges ?? [])],
  };
  const seen = new Set(base.edges.map((e) => `${e.from}|${e.to}|${e.relation}`));
  for (const edge of genealogyEdges) {
    const key = `${edge.from}|${edge.to}|${edge.relation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    base.edges.push(edge);
  }
  return base;
}
