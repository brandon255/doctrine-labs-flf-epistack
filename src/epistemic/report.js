/**
 * Human-readable assessment reports for epistemic case studies.
 *
 * The report leads with the conservative (lineage-level) independence count and
 * shows the two levels above it as drill-down, so a reader can see exactly where
 * apparent corroboration collapses.
 */

/**
 * @param {object} params
 * @param {string} params.caseDir
 * @param {string} params.loadedFrom
 * @param {object} params.genealogy
 * @param {object} params.mergedGraph
 */
export function formatCaseReport({ caseDir, loadedFrom, genealogy, mergedGraph }) {
  const { summary, documentClusters = [], lineageClusters = [], blocks } = genealogy;

  // Report a repo-relative path so the artifact is portable and diffable
  // rather than carrying whoever's home directory generated it.
  const relativeCase = String(caseDir).replace(/^.*?(docs\/epistemic\/)/, "$1");

  const lines = [
    `# Epistemic case report`,
    ``,
    `**Case:** \`${relativeCase}\``,
    `**Loaded:** ${loadedFrom}`,
    ``,
    `_Regenerate with_ \`node scripts/epistemic-run.js ${relativeCase.split("/").pop()}\`.`,
    ``,
    `## Assessment (auto)`,
    ``,
    summary.assessment_line,
    ``,
    `| Level | Count | What it counts |`,
    `|-------|-------|----------------|`,
    `| 1 — claims | ${summary.claim_count} | Excerpts cited |`,
    `| 2 — documents | ${summary.document_count} | Distinct bibliographic sources |`,
    `| 3 — lineages | **${summary.lineage_count}** | **Independent observations of the world** |`,
    ``,
    `Citation inflation factor: **${summary.inflation_factor}x** — the corpus *looks* ` +
      `${summary.claim_count} sources deep and is ${summary.lineage_count}.`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Documents with multiple excerpts | ${summary.correlated_document_count} |`,
    `| Lineages spanning multiple documents | ${summary.correlated_lineage_count} |`,
    `| Graph edges (total) | ${mergedGraph.edges?.length ?? 0} |`,
    ``,
    `## Level 3 — independent lineages`,
    ``,
  ];

  for (const c of lineageClusters) {
    const docs = [
      ...new Set(
        blocks.filter((b) => b.provenance.lineage_id === c.root_source_id).map((b) => b.provenance.document_id)
      ),
    ];
    lines.push(
      `- **\`${c.root_source_id}\`** — ${c.block_count} excerpt(s) across ${docs.length} document(s)`
    );
    for (const d of docs) {
      const role = blocks.find((b) => b.provenance.document_id === d)?.provenance.lineage_role ?? "unknown";
      lines.push(`  - \`${d}\` (${role})`);
    }
  }

  lines.push(``, `## Level 2 — documents`, ``);
  for (const c of documentClusters) {
    const flag = c.block_count > 1 ? ` — **${c.block_count} excerpts, one source**` : ``;
    lines.push(`- \`${c.root_source_id}\` | ${c.independence_class}${flag}: ${c.member_ids.join(", ")}`);
  }

  const derivations = (mergedGraph.edges ?? []).filter((e) => e.relation === "derives_from");
  if (derivations.length) {
    lines.push(``, `## Declared derivations`, ``);
    lines.push(`Where one document's reasoning is built on another's. These are not independent.`, ``);
    for (const e of derivations) {
      lines.push(`- \`${e.from}\` derives from \`${e.to}\``);
      if (e.note) lines.push(`  - ${e.note}`);
    }
  }

  lines.push(``, `## Blocks`, ``);
  for (const b of blocks) {
    lines.push(
      `- \`${b.evidence_id}\` | ${b.confidence_label} | ${b.provenance.independence_class} | ${b.claim.slice(0, 120)}${b.claim.length > 120 ? "..." : ""}`
    );
  }

  const sameDoc = (mergedGraph.edges ?? []).filter((e) => e.relation === "same_document");
  if (sameDoc.length) {
    lines.push(``, `## same_document edges (one source, restated)`, ``);
    for (const e of sameDoc) {
      lines.push(`- ${e.from} <-> ${e.to}${e.note ? ` (${e.note})` : ""}`);
    }
  }

  const sameLineage = (mergedGraph.edges ?? []).filter((e) => e.relation === "same_lineage");
  if (sameLineage.length) {
    lines.push(``, `## same_lineage edges (shared underlying event)`, ``);
    for (const e of sameLineage) {
      lines.push(`- ${e.from} <-> ${e.to}${e.note ? ` (${e.note})` : ""}`);
    }
  }

  lines.push(
    ``,
    `## Human review required`,
    ``,
    `- Blocks with confidence FLAGGED or LOW need promotion before use in argument.`,
    `- Documents sharing a lineage must not be counted as independent confirmations.`,
    `- Lineage assignments are judgments. Check \`source_registry.json\` and override where you disagree.`,
    `- Missing or unverifiable sources should be demoted, not silently dropped.`,
    ``,
    `## Steering log`,
    ``,
    `- Ingest events: \`steering_log.jsonl\` in case folder.`,
    ``
  );

  return lines.join("\n");
}
