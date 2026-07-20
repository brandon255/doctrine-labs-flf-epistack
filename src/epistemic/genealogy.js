/**
 * Provenance genealogy: cluster resolution for Schema D evidence blocks.
 * Detects shared root_source_id / source.identifier equivalence.
 */

import { createHash } from "node:crypto";

/** @typedef {'independent' | 'correlated' | 'unknown'} IndependenceClass */

/**
 * Normalize a source identifier to a canonical root key.
 * Explicit root_source_id wins; else identifier string.
 * @param {object} block
 */
export function rootKeyForBlock(block, aliases = {}) {
  const id = block.source?.root_source_id ?? block.source?.identifier;
  if (!id || typeof id !== "string") return "unknown-root";
  const norm = id.trim().toLowerCase();
  const canonical = aliases[norm] ?? aliases[id] ?? norm;
  return String(canonical).trim().toLowerCase();
}

/**
 * Stable cluster id from root key (deterministic for reproducible demos).
 * @param {string} rootKey
 */
export function clusterIdFromRoot(rootKey) {
  const hash = createHash("sha256").update(rootKey).digest("hex").slice(0, 12);
  return `cluster-${hash}`;
}

/**
 * Annotate blocks with genealogy fields (non-destructive copy).
 * @param {object[]} blocks
 * @returns {{ blocks: object[], clusters: object[], edges: object[], summary: object }}
 */
export function resolveGenealogy(blocks, { aliases = {} } = {}) {
  if (!Array.isArray(blocks)) throw new Error("REJECTED: blocks must be an array.");

  const rootToIds = new Map();
  const annotated = blocks.map((block) => {
    const rootKey = rootKeyForBlock(block, aliases);
    const cluster_id = clusterIdFromRoot(rootKey);
    const root_source_id = rootKey;

    if (!rootToIds.has(rootKey)) rootToIds.set(rootKey, []);
    rootToIds.get(rootKey).push(block.evidence_id);

    return {
      ...block,
      source: { ...block.source, root_source_id },
      provenance: {
        ...block.provenance,
        cluster_id,
        independence_class: rootKey === "unknown-root" ? "unknown" : "independent",
      },
    };
  });

  const clusters = [];
  for (const [rootKey, memberIds] of rootToIds) {
    const independence_class = memberIds.length === 1 ? "independent" : "correlated";
    clusters.push({
      cluster_id: clusterIdFromRoot(rootKey),
      root_source_id: rootKey,
      member_ids: [...memberIds],
      independence_class,
      block_count: memberIds.length,
    });
    for (const block of annotated) {
      if (rootKeyForBlock(block, aliases) === rootKey) {
        block.provenance.independence_class = independence_class;
      }
    }
  }

  const edges = [];
  for (const cluster of clusters) {
    if (cluster.member_ids.length < 2) continue;
    const sorted = [...cluster.member_ids].sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        edges.push({
          from: sorted[i],
          to: sorted[j],
          relation: "same_cluster",
          note: `Shared root_source_id ${cluster.root_source_id}, ${cluster.block_count} blocks, not independent`,
        });
      }
    }
  }

  const distinctRoots = clusters.length;
  const correlatedClusters = clusters.filter((c) => c.block_count > 1).length;

  return {
    blocks: annotated,
    clusters,
    edges,
    summary: {
      block_count: blocks.length,
      cluster_count: clusters.length,
      independent_root_count: distinctRoots,
      correlated_cluster_count: correlatedClusters,
      assessment_line: `${blocks.length} blocks cited; ${distinctRoots} distinct roots; ${correlatedClusters} correlated cluster(s) detected. Treat as ${distinctRoots} independent sources, not ${blocks.length}.`,
    },
  };
}

/**
 * Merge auto-generated same_cluster edges into a claim graph (dedupe by from+to).
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
