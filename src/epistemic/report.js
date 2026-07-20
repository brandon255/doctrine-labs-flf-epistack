/**
 * Human-readable assessment reports for epistemic case studies.
 */

/**
 * @param {object} params
 * @param {string} params.caseDir
 * @param {string} params.loadedFrom
 * @param {object} params.genealogy
 * @param {object} params.mergedGraph
 */
export function formatCaseReport({ caseDir, loadedFrom, genealogy, mergedGraph }) {
  const { summary, clusters, blocks } = genealogy;
  const lines = [
    `# Epistemic case report`,
    ``,
    `**Case:** ${caseDir}`,
    `**Loaded:** ${loadedFrom}`,
    `**Generated:** ${new Date().toISOString()}`,
    ``,
    `## Assessment (auto)`,
    ``,
    summary.assessment_line,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Blocks | ${summary.block_count} |`,
    `| Clusters | ${summary.cluster_count} |`,
    `| Independent roots | ${summary.independent_root_count} |`,
    `| Correlated clusters | ${summary.correlated_cluster_count} |`,
    `| Graph edges (total) | ${mergedGraph.edges?.length ?? 0} |`,
    ``,
    `## Clusters`,
    ``,
  ];

  for (const c of clusters) {
    lines.push(
      `- **${c.cluster_id}** | root \`${c.root_source_id}\` | ${c.independence_class} | ${c.block_count} block(s): ${c.member_ids.join(", ")}`,
    );
  }

  lines.push(``, `## Blocks`, ``);
  for (const b of blocks) {
    lines.push(
      `- \`${b.evidence_id}\` | ${b.confidence_label} | ${b.provenance.independence_class} | ${b.claim.slice(0, 120)}${b.claim.length > 120 ? "..." : ""}`,
    );
  }

  const sameClusterEdges = (mergedGraph.edges ?? []).filter((e) => e.relation === "same_cluster");
  if (sameClusterEdges.length) {
    lines.push(``, `## same_cluster edges (genealogy)`, ``);
    for (const e of sameClusterEdges) {
      lines.push(`- ${e.from} <-> ${e.to}${e.note ? ` (${e.note})` : ""}`);
    }
  }

  lines.push(
    ``,
    `## Human review required`,
    ``,
    `- Blocks with confidence FLAGGED or LOW need promotion before use in argument.`,
    `- Correlated clusters must not be counted as independent confirmations.`,
    `- Missing or unverifiable sources should be demoted, not silently dropped.`,
    ``,
    `## Steering log`,
    ``,
    `- Ingest events: \`steering_log.jsonl\` in case folder (FLF D5 human review trail).`,
    ``,
  );

  return lines.join("\n");
}
