/**
 * Epistemic case-study ingest - load seeds, validate, resolve genealogy, emit report.
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { validateEvidenceBlock } from "../evidence_block.js";
import { resolveGenealogy } from "./genealogy.js";
import { formatCaseReport } from "./report.js";
import { buildMergedClaimGraph } from "./claim_graph.js";
import { logIngestSteering } from "./steering_log.js";

const BLOCKS_FILES = ["evidence_blocks.json", "evidence_blocks.seed.json"];

/**
 * @param {string} caseDir absolute or relative path to case folder
 */
export function loadCaseBlocks(caseDir) {
  let raw = null;
  let loadedFrom = null;
  for (const name of BLOCKS_FILES) {
    const p = join(caseDir, name);
    if (existsSync(p)) {
      raw = JSON.parse(readFileSync(p, "utf8"));
      loadedFrom = name;
      break;
    }
  }
  if (!raw) {
    throw new Error(`REJECTED: no evidence_blocks.json or evidence_blocks.seed.json in ${caseDir}`);
  }
  const blocks = raw.map((b) => validateEvidenceBlock(b));
  return { blocks, loadedFrom };
}

export function loadClaimGraph(caseDir) {
  const p = join(caseDir, "claim_graph.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

/**
 * Run full ingest pipeline for a case study directory.
 * @param {string} caseDir
 * @param {{ emitJson?: boolean }} opts
 */
export function runCaseStudy(caseDir, { emitJson = false, syncGraph = false } = {}) {
  const { blocks, loadedFrom } = loadCaseBlocks(caseDir);
  const seedGraph = loadClaimGraph(caseDir);
  const genealogy = resolveGenealogy(blocks);
  const mergedGraph = seedGraph
    ? buildMergedClaimGraph(blocks, seedGraph, genealogy.edges)
    : buildMergedClaimGraph(blocks, { subquestion: "unknown", edges: [] }, genealogy.edges);

  if (syncGraph) {
    writeFileSync(
      join(caseDir, "claim_graph.json"),
      `${JSON.stringify(mergedGraph, null, 2)}\n`,
      "utf8",
    );
    logIngestSteering(caseDir, {
      loadedFrom,
      summary: genealogy.summary,
      block_count: blocks.length,
    });
  }

  const report = formatCaseReport({
    caseDir,
    loadedFrom,
    genealogy,
    mergedGraph,
  });

  const result = {
    caseDir,
    loadedFrom,
    blocks: genealogy.blocks,
    clusters: genealogy.clusters,
    summary: genealogy.summary,
    claim_graph: mergedGraph,
    report_markdown: report,
  };

  if (emitJson) return result;
  return result;
}

/**
 * CLI-friendly text output.
 * @param {string} caseDir
 */
export function runCaseStudyCli(caseDir) {
  const result = runCaseStudy(caseDir);
  return result.report_markdown;
}
