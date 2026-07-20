/**
 * Epistemic ingest steering log — human review trail (FLF D5).
 */

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * @param {string} caseDir
 * @param {object} event
 */
export function appendSteeringLog(caseDir, event) {
  const p = join(caseDir, "steering_log.jsonl");
  const row = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  appendFileSync(p, `${JSON.stringify(row)}\n`, "utf8");
  return row;
}

/**
 * @param {string} caseDir
 * @returns {object[]}
 */
export function readSteeringLog(caseDir) {
  const p = join(caseDir, "steering_log.jsonl");
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/**
 * Log automated ingest pass (system); human promotions appended separately.
 * @param {object} params
 */
export function logIngestSteering(caseDir, { loadedFrom, summary, block_count }) {
  return appendSteeringLog(caseDir, {
    actor: "system",
    action: "epistemic_ingest",
    loaded_from: loadedFrom,
    block_count,
    assessment_line: summary.assessment_line,
    note: "Automated genealogy pass. FLAGGED/LOW blocks require human promotion before argument use.",
  });
}
