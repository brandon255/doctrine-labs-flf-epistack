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
 * Load an optional alias map (aliases.json) declaring that different source
 * identifiers trace to the same root. Human-declared or model-proposed. Keys
 * and values are normalized to lowercase. Missing file returns an empty map,
 * so behavior is unchanged when no aliases are provided.
 * @param {string} caseDir
 */
export function loadAliases(caseDir) {
  const p = join(caseDir, "aliases.json");
  if (!existsSync(p)) return {};
  const raw = JSON.parse(readFileSync(p, "utf8"));
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    out[String(k).trim().toLowerCase()] = String(v).trim().toLowerCase();
  }
  return out;
}

/**
 * Load the case source registry, which declares document- and lineage-level
 * identity for each source URL. Without it, independence is counted at the
 * excerpt level and is overstated. Missing file returns an empty map.
 * @param {string} caseDir
 */
export function loadSourceRegistry(caseDir) {
  const p = join(caseDir, "source_registry.json");
  if (!existsSync(p)) return {};
  const raw = JSON.parse(readFileSync(p, "utf8"));
  return raw.documents ?? {};
}

/**
 * Symbolic directory names that measurement blocks in this case may run in.
 *
 * Kept separate from loadSourceRegistry because that function's return value is
 * the document map, which genealogy consumes directly. Roots live in the same
 * file because they are a property of the case, and a case author editing
 * provenance should see the directories the case can reach in the same place.
 *
 * Absent file or absent key returns {}, which makes every rooted measurement
 * fail closed rather than silently running somewhere unintended.
 * @param {string} caseDir
 */
export function loadMeasurementRoots(caseDir) {
  const p = join(caseDir, "source_registry.json");
  if (!existsSync(p)) return {};
  const raw = JSON.parse(readFileSync(p, "utf8"));
  const roots = raw.measurement_roots;
  if (!roots || typeof roots !== "object") return {};
  return roots;
}

/**
 * Run full ingest pipeline for a case study directory.
 * @param {string} caseDir
 * @param {{ emitJson?: boolean }} opts
 */
export function runCaseStudy(caseDir, { emitJson = false, syncGraph = false } = {}) {
  const { blocks, loadedFrom } = loadCaseBlocks(caseDir);
  const seedGraph = loadClaimGraph(caseDir);
  const aliases = loadAliases(caseDir);
  const registry = loadSourceRegistry(caseDir);
  const genealogy = resolveGenealogy(blocks, { aliases, registry });
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
    // Symbolic directory names measurement blocks in this case may run in.
    // Surfaced here so callers can pass them to adjudicate(); a block names a
    // root, never a path, so it cannot reach a directory the case author has
    // not declared.
    measurement_roots: loadMeasurementRoots(caseDir),
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
