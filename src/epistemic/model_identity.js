/**
 * Model identity: the same three-level resolution we apply to evidence, applied
 * to the models doing the adjudicating.
 *
 *   Level 1  call     — one invocation (a proposal, a challenge)
 *   Level 2  model    — one model tag, e.g. "hermes3:latest"
 *   Level 3  lineage  — one set of base weights, e.g. "llama-3.1"
 *
 * Why this file exists: adjudication stage 3 challenges stage 1. If both run on
 * the same weights we have two calls and one lineage, which is precisely the
 * error the rest of this stack exists to detect. Picking a challenger honestly
 * requires knowing which model tags actually differ, and names do not tell you
 * — `hermes3` is a fine-tune of `llama3.1`.
 *
 * ONE DELIBERATE ASYMMETRY vs source_identity.js. There, an undeclared document
 * becomes its own lineage. Here, an unrecognised model becomes its own lineage
 * too BUT is flagged `verified: false`, and an unverified challenger cannot lift
 * the panel above grade `weak`. The reason is incentive: on the evidence side we
 * are counting someone else's independence, and over-merging would fake
 * correlation. Here we are counting *our own*, and the temptation runs the other
 * way — toward crediting ourselves with independence we have not established.
 *
 * Level 4 — shared pretraining corpora across all open models — is real, matters,
 * and is not resolvable, because no major open model discloses its training data.
 * Nothing here should be read as "N independent minds".
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REGISTRY_PATH = join(HERE, "..", "..", "models", "registry.json");

let cached = null;

/**
 * Load the model registry. Cached, since it never changes within a run.
 * A missing registry is not fatal: everything degrades to unverified lineages,
 * which reports less independence rather than silently inventing some.
 * @param {string} [path]
 * @returns {object}
 */
export function loadModelRegistry(path = DEFAULT_REGISTRY_PATH) {
  if (path === DEFAULT_REGISTRY_PATH && cached) return cached;
  let registry = {};
  try {
    if (existsSync(path)) {
      const raw = JSON.parse(readFileSync(path, "utf8"));
      registry = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
    }
  } catch {
    registry = {};
  }
  if (path === DEFAULT_REGISTRY_PATH) cached = registry;
  return registry;
}

/** Drop an Ollama tag suffix: "llama3.1:8b" -> "llama3.1". */
export function baseTag(model) {
  return String(model ?? "").trim().split(":")[0].toLowerCase();
}

/**
 * Resolve a model tag to its weight lineage.
 *
 * Matching is longest-prefix on the pre-colon tag so that `llama3.1:8b`,
 * `llama3.1:70b` and `llama3.1` all resolve through one entry, while
 * `llama3.1-custom` still prefers a dedicated entry if one exists. Longest
 * first matters: `qwen2.5-14b-64k` must not be captured by `qwen2.5`.
 *
 * @param {string} model
 * @param {object} [registry]
 * @returns {{ model_id: string, lineage_id: string, lineage_role: string,
 *             publisher: string|null, derives_from: string[], verified: boolean,
 *             note: string|null }}
 */
export function resolveModelLineage(model, registry = loadModelRegistry()) {
  const tag = baseTag(model);
  if (!tag) {
    return {
      model_id: "unknown",
      lineage_id: "unknown-model",
      lineage_role: "unknown",
      publisher: null,
      derives_from: [],
      verified: false,
      note: "no model name supplied",
    };
  }

  const keys = Object.keys(registry).sort((a, b) => b.length - a.length);
  const hit = keys.find((k) => tag === k.toLowerCase() || tag.startsWith(k.toLowerCase()));

  if (!hit) {
    return {
      model_id: tag,
      lineage_id: `unverified-${tag}`,
      lineage_role: "unknown",
      publisher: null,
      derives_from: [],
      verified: false,
      note:
        `'${tag}' is not in models/registry.json, so its base weights are unknown. ` +
        `It is counted as its own lineage but marked unverified, and cannot raise the ` +
        `independence grade above 'weak'. Add an entry with a cited basis to change that.`,
    };
  }

  const e = registry[hit];
  return {
    model_id: e.model_id ?? hit,
    lineage_id: e.lineage_id ?? `unverified-${hit}`,
    lineage_role: e.lineage_role ?? "unknown",
    publisher: e.publisher ?? null,
    derives_from: Array.isArray(e.derives_from) ? e.derives_from : [],
    verified: e.lineage_verified !== false,
    note: e.independence_note ?? null,
  };
}

/**
 * Do two model tags share a weight lineage?
 * Unverified lineages are treated as POSSIBLY shared — the honest reading of
 * "we do not know" when the question is whether we have independence.
 * @param {string} a
 * @param {string} b
 * @param {object} [registry]
 */
export function shareLineage(a, b, registry = loadModelRegistry()) {
  const la = resolveModelLineage(a, registry);
  const lb = resolveModelLineage(b, registry);
  if (la.lineage_id === lb.lineage_id) return true;
  return !la.verified || !lb.verified ? null : false;
}

/**
 * Group a list of installed model tags by lineage and report the inflation
 * factor — the same calculation genealogy.js performs on evidence, pointed at
 * the model shelf instead.
 *
 * @param {string[]} models
 * @param {object} [registry]
 * @returns {{ model_count: number, lineage_count: number, inflation_factor: number,
 *             lineages: Array<{lineage_id: string, models: string[], verified: boolean}>,
 *             unverified: string[] }}
 */
export function summarizeModelShelf(models = [], registry = loadModelRegistry()) {
  const byLineage = new Map();
  const unverified = [];

  for (const m of models) {
    const info = resolveModelLineage(m, registry);
    if (!info.verified) unverified.push(m);
    if (!byLineage.has(info.lineage_id)) {
      byLineage.set(info.lineage_id, { lineage_id: info.lineage_id, models: [], verified: info.verified });
    }
    byLineage.get(info.lineage_id).models.push(m);
  }

  const lineages = [...byLineage.values()].sort((a, b) => b.models.length - a.models.length);
  const model_count = models.length;
  const lineage_count = lineages.length;

  return {
    model_count,
    lineage_count,
    inflation_factor: lineage_count > 0 ? Number((model_count / lineage_count).toFixed(2)) : 0,
    lineages,
    unverified,
  };
}

/**
 * Pick the best available challenger for a given proposer: a model from a
 * different, verified lineage. Returns null when nothing installed qualifies,
 * which callers must report rather than paper over.
 *
 * Preference order:
 *   1. verified lineage different from the proposer's (hard requirement)
 *   2. canonical base weights over a fine-tune or a local context retag, since a
 *      retag can carry a modified context window and is not the published model
 *   3. larger model — a crude but reasonable proxy for quoting more faithfully,
 *      paraphrase being the dominant validation failure rather than fabrication
 *
 * @param {string} proposerModel
 * @param {string[]} available
 * @param {object} [registry]
 * @returns {{ model: string, lineage_id: string, reason: string }|null}
 */
export function pickChallenger(proposerModel, available = [], registry = loadModelRegistry()) {
  const proposer = resolveModelLineage(proposerModel, registry);

  const candidates = available
    .filter((m) => m !== proposerModel)
    .map((m) => ({ model: m, info: resolveModelLineage(m, registry) }))
    .filter(({ info }) => info.verified && info.lineage_id !== proposer.lineage_id);

  if (candidates.length === 0) return null;

  const sizeOf = (tag) => {
    const m = String(tag).match(/(\d+(?:\.\d+)?)\s*b\b/i);
    return m ? Number(m[1]) : 0;
  };
  const isBase = ({ info }) => (info.lineage_role === "base" ? 0 : 1);

  candidates.sort(
    (a, b) => isBase(a) - isBase(b) || sizeOf(b.model) - sizeOf(a.model)
  );

  const best = candidates[0];
  return {
    model: best.model,
    lineage_id: best.info.lineage_id,
    reason:
      `different verified weight lineage from the proposer ` +
      `(${best.info.lineage_id} vs ${proposer.lineage_id})`,
  };
}
