#!/usr/bin/env node
/**
 * Point the tool at its own adjudicator.
 *
 * The stack's claim is that independence must be counted at the level of
 * underlying generative events, not at the level of things you can cite. Applied
 * to us: two model calls are two documents, and if they run on the same weights
 * they are one lineage. We were reporting a 2 and holding a 1.
 *
 * This reads the models actually installed on THIS machine, resolves each to its
 * base weights, and prints the same three-level report the engine prints for an
 * evidence corpus. No network beyond the local Ollama listing.
 *
 * Usage: npm run audit:self
 */

import { getLlmStatus } from "../src/epistemic/llm.js";
import {
  loadModelRegistry,
  resolveModelLineage,
  summarizeModelShelf,
  pickChallenger,
} from "../src/epistemic/model_identity.js";

const registry = loadModelRegistry();
const status = await getLlmStatus();
const installed = status?.models ?? [];

const out = [];
out.push("# Self-audit — the adjudicator's own independence", "");

if (!status?.ok) {
  out.push(
    `Ollama is not reachable, so there is no model shelf to audit.`,
    ``,
    `> ${status?.reason ?? "unknown reason"}`,
    ``,
    `This is not a failure of the tool. With no model installed, adjudication runs`,
    `with the mechanical challenger only — which is deterministic, shares nothing`,
    `with any proposer, and is the one genuinely independent challenger available.`,
    `Independence grade in that configuration is \`weak\`, and it is reported as weak.`,
    ``
  );
  console.log(out.join("\n"));
  process.exit(0);
}

if (installed.length === 0) {
  out.push("Ollama is running but no models are pulled. Nothing to audit.", "");
  console.log(out.join("\n"));
  process.exit(0);
}

const shelf = summarizeModelShelf(installed, registry);

out.push(
  `**${shelf.model_count} models installed → ${shelf.lineage_count} independent weight lineages` +
    ` → ${shelf.inflation_factor}x inflation**`,
  ``,
  `Same shape the engine reports for evidence: things you can name, versus things`,
  `that are actually different underneath.`,
  ``,
  `| Lineage | Models sharing it | Independent? |`,
  `|---|---|---|`
);

for (const l of shelf.lineages) {
  out.push(
    `| \`${l.lineage_id}\` | ${l.models.map((m) => `\`${m}\``).join(", ")} | ` +
      `${l.verified ? "yes" : "**unverified**"} |`
  );
}
out.push(``);

const derived = installed
  .map((m) => ({ model: m, info: resolveModelLineage(m, registry) }))
  .filter(({ info }) => info.derives_from.length > 0);

if (derived.length) {
  out.push(`## Declared derivations`, ``, `These look independent by name and are not.`, ``);
  for (const { model, info } of derived) {
    out.push(
      `- \`${model}\` → lineage \`${info.lineage_id}\` (${info.lineage_role}, ` +
        `from ${info.derives_from.map((d) => `\`${d}\``).join(", ")})`
    );
    if (info.note) out.push(`  - ${info.note}`);
  }
  out.push(``);
}

if (shelf.unverified.length) {
  out.push(
    `## Unverified provenance`,
    ``,
    `${shelf.unverified.map((m) => `\`${m}\``).join(", ")}`,
    ``,
    `These are not in \`models/registry.json\`, so their base weights are unknown.`,
    `Unlike the evidence side, an unverified model does **not** earn independent`,
    `standing here — when we are counting our own independence the temptation runs`,
    `toward overstating it, so unknown provenance caps the grade at \`weak\`.`,
    ``
  );
}

out.push(`## What this machine can actually adjudicate with`, ``);

const proposer = status.model ?? installed[0];
const proposerInfo = resolveModelLineage(proposer, registry);
const challenger = pickChallenger(proposer, installed, registry);

out.push(
  `- Proposer: \`${proposer}\` — lineage \`${proposerInfo.lineage_id}\``,
  challenger
    ? `- Challenger: \`${challenger.model}\` — lineage \`${challenger.lineage_id}\`, ${challenger.reason}`
    : `- Challenger: **none available.** No installed model has a different verified` +
      ` weight lineage, so the model challenge would be correlated with the proposer` +
      ` and is labelled as such.`,
  `- Mechanical challenger: always available, lineage \`deterministic\``,
  ``,
  `Resulting independence grade: **${challenger ? "moderate" : "weak"}**` +
    `${challenger ? " (strong once a human records their own position)" : ""}.`,
  ``
);

out.push(
  `## The level we cannot resolve`,
  ``,
  `Every model above was pretrained on heavily overlapping public web corpora, and`,
  `none of their publishers disclose training data. Distinct weight lineages is a`,
  `checkable claim. Independent minds is not, and we do not claim it.`,
  ``,
  `Full design: \`docs/A1_CHALLENGER_INDEPENDENCE.md\` · registry: \`models/registry.json\``,
  ``
);

console.log(out.join("\n"));
