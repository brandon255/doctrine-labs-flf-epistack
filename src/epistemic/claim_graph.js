/**
 * Claim graph helpers - sync nodes from blocks, merge discourse + genealogy edges.
 */

import { mergeGenealogyEdges } from "./genealogy.js";

/**
 * @param {object[]} blocks
 * @param {object} seedGraph existing claim_graph.json
 * @param {object[]} genealogyEdges from resolveGenealogy
 */
export function buildMergedClaimGraph(blocks, seedGraph, genealogyEdges) {
  const roles = inferRoles(blocks);
  const nodes = blocks.map((b) => ({
    id: b.evidence_id,
    role: roles[b.evidence_id] ?? "evidence",
  }));

  const manual = [...(seedGraph?.edges ?? [])];
  const base = {
    subquestion: seedGraph?.subquestion ?? "covid-origins-crux-navigation",
    version: "0.3-ingest",
    nodes,
    edges: dedupeEdges(manual),
  };
  return mergeGenealogyEdges(base, genealogyEdges);
}

function dedupeEdges(edges) {
  const seen = new Set();
  const out = [];
  for (const e of edges) {
    const key = `${e.from}|${e.to}|${e.relation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

/** @param {object[]} blocks */
function inferRoles(blocks) {
  const roles = {};
  for (const b of blocks) {
    const id = b.evidence_id;
    const tags = b.tags ?? [];
    if (id.startsWith("covid-seed-")) {
      if (tags.includes("meta")) roles[id] = "meta_outcome";
      else if (tags.includes("crux-candidate")) roles[id] = "crux_hypothesis";
      else if (tags.includes("problem-statement")) roles[id] = "problem_statement";
      else roles[id] = "seed";
    } else if (id.startsWith("lhc-seed-")) {
      if (tags.includes("missing")) roles[id] = "gap_closed";
      else if (tags.includes("crux-candidate")) roles[id] = "crux_hypothesis";
      else roles[id] = "seed";
    } else if (id.startsWith("eggs-seed-")) {
      if (tags.includes("missing")) roles[id] = "gap_closed";
      else roles[id] = "seed";
    } else if (tags.includes("primary")) {
      if (b.source?.identifier?.includes("will")) roles[id] = "judge_will";
      else if (b.source?.identifier?.includes("eric")) roles[id] = "judge_eric";
      else if (b.source?.identifier?.includes("weissman")) roles[id] = "weissman";
      else if (b.source?.identifier?.includes("sa-")) roles[id] = "scott_alexander";
      else if (b.source?.identifier?.includes("rootclaim")) roles[id] = "rootclaim";
      else roles[id] = "primary";
    } else roles[id] = "evidence";
  }
  return roles;
}
