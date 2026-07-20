// Evidence blocks (Schema D) - unified provenance for integrity ledger + FLF import.

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { recordIntegrity } from "./integrity.js";
import { isValidLabel } from "./confidence.js";

const SCHEMA_PATH = new URL("../config/schemas/evidence_block.schema.json", import.meta.url);

export const SOURCE_TYPES = [
  "user_statement",
  "document",
  "api_response",
  "calculation",
  "external_source",
  "agent_inference",
];

export const CAPTURED_BY = ["user", "agent", "system"];

export function loadEvidenceBlockSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
}

/** Validate required Schema D fields (deterministic, no external validator dep). */
export function validateEvidenceBlock(block) {
  if (!block || typeof block !== "object") throw new Error("REJECTED: EvidenceBlock must be an object.");
  for (const k of ["evidence_id", "timestamp", "claim", "source", "provenance", "confidence_label"]) {
    if (block[k] === undefined || block[k] === null || block[k] === "") {
      throw new Error(`REJECTED: EvidenceBlock missing "${k}".`);
    }
  }
  if (!SOURCE_TYPES.includes(block.source.type)) {
    throw new Error(`REJECTED: invalid source.type "${block.source.type}".`);
  }
  if (!block.source.identifier) throw new Error("REJECTED: source.identifier required.");
  if (!CAPTURED_BY.includes(block.provenance.captured_by)) {
    throw new Error(`REJECTED: invalid provenance.captured_by.`);
  }
  if (!block.provenance.captured_at) throw new Error("REJECTED: provenance.captured_at required.");
  if (!isValidLabel(block.confidence_label)) {
    throw new Error(`REJECTED: invalid confidence_label "${block.confidence_label}".`);
  }
  return block;
}

/**
 * @param {object} partial
 * @returns {object} validated EvidenceBlock
 */
export function createEvidenceBlock(partial) {
  const block = {
    evidence_id: partial.evidence_id ?? randomUUID(),
    timestamp: partial.timestamp ?? new Date().toISOString(),
    claim: String(partial.claim ?? "").trim(),
    source: {
      type: partial.source?.type ?? "system",
      identifier: String(partial.source?.identifier ?? "core-os"),
      ...(partial.source?.root_source_id
        ? { root_source_id: String(partial.source.root_source_id) }
        : {}),
      ...(partial.source?.excerpt ? { excerpt: String(partial.source.excerpt) } : {}),
    },
    provenance: {
      captured_by: partial.provenance?.captured_by ?? "system",
      captured_at: partial.provenance?.captured_at ?? new Date().toISOString(),
      ...(partial.provenance?.context ? { context: String(partial.provenance.context) } : {}),
      ...(partial.provenance?.prior_evidence_ids?.length
        ? { prior_evidence_ids: partial.provenance.prior_evidence_ids }
        : {}),
    },
    confidence_label: String(partial.confidence_label ?? "HIGH").toUpperCase(),
    ...(partial.corroboration ? { corroboration: partial.corroboration } : {}),
    ...(partial.tags?.length ? { tags: partial.tags } : {}),
  };
  if (!block.claim) throw new Error("REJECTED: EvidenceBlock claim is required.");
  return validateEvidenceBlock(block);
}

/** Append hash-chained ledger entry wrapping a validated evidence block. */
export function recordEvidenceBlock(partial, { ledgerPath, op = "evidence_block" } = {}) {
  const evidence = createEvidenceBlock(partial);
  return recordIntegrity({ op, evidence }, ledgerPath);
}

/** Vault write → evidence block (PS-1 integration). */
export function recordVaultWriteEvidence(meta, { contentSha256, ledgerPath } = {}) {
  return recordEvidenceBlock(
    {
      claim: `Secure vault write: stage ${meta.stage}, tier ${meta.tier}`,
      source: { type: "document", identifier: meta.file ?? meta.stage },
      provenance: {
        captured_by: "system",
        captured_at: meta.ts ?? new Date().toISOString(),
        context: JSON.stringify({
          stage: meta.stage,
          tier: meta.tier,
          label: meta.label,
          contentSha256,
          encrypted: meta.encrypted,
        }),
      },
      confidence_label: meta.label ?? "HIGH",
      tags: ["vault", meta.stage, meta.tier].filter(Boolean),
    },
    { ledgerPath },
  );
}
