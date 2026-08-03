/**
 * Human promotion of evidence block confidence (FLF D5).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { validateEvidenceBlock } from "../evidence_block.js";
import { isValidLabel } from "../confidence.js";
import { appendSteeringLog } from "./steering_log.js";

/**
 * @param {string} caseDir
 * @param {string} evidenceId
 * @param {string} confidenceLabel
 * @param {string} [note]
 */
export function promoteBlockConfidence(caseDir, evidenceId, confidenceLabel, note = "") {
  const label = String(confidenceLabel).toUpperCase();
  if (!isValidLabel(label)) throw new Error(`REJECTED: invalid confidence_label "${label}".`);

  const blocksPath = join(caseDir, "evidence_blocks.json");
  if (!existsSync(blocksPath)) throw new Error(`REJECTED: no evidence_blocks.json in ${caseDir}`);

  const blocks = JSON.parse(readFileSync(blocksPath, "utf8"));
  const idx = blocks.findIndex((b) => b.evidence_id === evidenceId);
  if (idx === -1) throw new Error(`REJECTED: evidence_id "${evidenceId}" not found.`);

  const prior = blocks[idx].confidence_label;
  blocks[idx] = validateEvidenceBlock({ ...blocks[idx], confidence_label: label });
  writeFileSync(blocksPath, `${JSON.stringify(blocks, null, 2)}\n`, "utf8");

  appendSteeringLog(caseDir, {
    actor: "user",
    action: "promote_confidence",
    evidence_id: evidenceId,
    from: prior,
    to: label,
    note: note || "Human promotion",
  });

  return blocks[idx];
}
