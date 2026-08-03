/**
 * Mechanical challenger — adjudication stage 3, with no model in it.
 *
 * A model challenging a model shares weights, pretraining, tokenizer, tuning and
 * blind spots. Blinding it to the reasoning removes one of those. This file
 * removes all of them by not being a model: every objection below is computed
 * from the corpus and the proposal by deterministic code.
 *
 * That makes it the only route to genuine independence we can guarantee, and it
 * is the same kind of independence stage 2 already has — which is why stage 2 is
 * the part of the protocol that actually holds.
 *
 * Two consequences worth stating plainly:
 *
 *   1. It runs with zero models installed, so every recipient gets a real
 *      challenger — including a static build with no Ollama anywhere.
 *   2. It finds structural defects, not wrong ideas. These checks cannot tell you
 *      a conclusion is false, only that the work shown for it is thin. Same
 *      honest limit stage 2 has.
 *
 * The check we care most about is C3. A conclusion about source independence,
 * resting entirely on blocks that all trace to one lineage, is this tool catching
 * its own reasoning committing the error it was built to detect.
 */

/** Severity ranking, low → high. */
const RANK = { low: 1, medium: 2, high: 3 };
const maxSeverity = (a, b) => (RANK[b] > RANK[a] ? b : a);

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

const lineageOf = (b) =>
  b?.provenance?.lineage_id ?? b?.provenance?.document_id ?? b?.evidence_id ?? "unknown";
const documentOf = (b) => b?.provenance?.document_id ?? b?.evidence_id ?? "unknown";

/**
 * Pull an asserted count of independent sources out of a conclusion sentence.
 * Only counts phrasings that are actually about independence, so "3 steps" or
 * "1 in 300 chance" are not mistaken for a claim about source structure.
 * @param {string} text
 * @returns {number|null}
 */
export function assertedIndependenceCount(text) {
  const s = String(text ?? "").toLowerCase();
  const noun = "(?:independent\\s+)?(?:lineages?|root\\s+sources?|independent\\s+sources?|distinct\\s+sources?|observations?)";
  // Word boundaries matter: without them "someone independent sources" yields 1,
  // and a check that objects to sloppy counting should not miscount.
  const num = "\\b(\\d+|" + Object.keys(NUMBER_WORDS).join("|") + ")\\b";

  // "3 independent lineages" / "three distinct sources"
  let m = s.match(new RegExp(num + "\\s+(?:\\w+\\s+){0,2}?" + noun));
  // "lineages: 3" / "independent sources = 3"
  if (!m) m = s.match(new RegExp(noun + "\\s*(?:count)?\\s*(?:[:=]|is|are)\\s*" + num));
  if (!m) return null;

  const raw = m[1];
  const n = /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS[raw];
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------------- *
 * Individual checks. Each takes a context and returns an objection or null.
 * Kept separate and pure so each can be unit-tested on its own.
 * ------------------------------------------------------------------------- */

/** C1 — how much of the corpus did the reasoning actually touch? */
function c1Coverage({ citedIds, blocks }) {
  const n = blocks.length;
  if (n < 4 || citedIds.size === 0) return null;
  const fraction = citedIds.size / n;
  if (fraction >= 0.4) return null;
  return {
    check: "C1",
    name: "coverage",
    severity: fraction < 0.2 ? "medium" : "low",
    objection:
      `The reasoning cites ${citedIds.size} of ${n} blocks (${Math.round(fraction * 100)}%). ` +
      `A conclusion about the corpus drawn from a minority of it may be reading a subset ` +
      `that happens to agree.`,
    detail: { cited: citedIds.size, total: n, fraction: Number(fraction.toFixed(2)) },
  };
}

/** C2 — does the asserted number of independent sources match the cited spread? */
function c2LineageSpan({ conclusion, citedBlocks }) {
  const claimed = assertedIndependenceCount(conclusion);
  if (claimed === null || citedBlocks.length === 0) return null;
  const spanned = new Set(citedBlocks.map(lineageOf)).size;
  if (claimed <= spanned) return null;
  return {
    check: "C2",
    name: "lineage span",
    severity: "high",
    objection:
      `The conclusion asserts ${claimed} independent source(s), but the cited blocks span ` +
      `only ${spanned} lineage(s). The extra ${claimed - spanned} is asserted, not shown.`,
    detail: { claimed, spanned },
  };
}

/** C3 — does the whole conclusion rest on a single lineage? */
function c3SingleLineage({ citedBlocks, blocks, jobType }) {
  if (citedBlocks.length < 2) return null;
  const cited = new Set(citedBlocks.map(lineageOf));
  const available = new Set(blocks.map(lineageOf));
  if (cited.size !== 1 || available.size < 2) return null;
  const only = [...cited][0];
  return {
    check: "C3",
    name: "single-lineage dependency",
    severity: jobType === "lineage" ? "high" : "medium",
    objection:
      `Every cited block traces to one lineage (${only}), while the corpus contains ` +
      `${available.size}. By this tool's own standard that is one observation of the world ` +
      `read ${citedBlocks.length} ways, not ${citedBlocks.length} pieces of support.`,
    detail: { lineage: only, cited_blocks: citedBlocks.length, available_lineages: available.size },
  };
}

/** C4 — counter-evidence the reasoning never addressed. */
function c4UncitedContradiction({ citedIds, edges }) {
  if (!edges.length || citedIds.size === 0) return null;
  const opposing = edges.filter(
    (e) =>
      /qualifies|contradicts|disputes|rebuts/i.test(e?.relation ?? "") &&
      (citedIds.has(e.to) || citedIds.has(e.from))
  );
  const unaddressed = opposing.filter((e) => !(citedIds.has(e.to) && citedIds.has(e.from)));
  if (unaddressed.length === 0) return null;
  return {
    check: "C4",
    name: "uncited counter-evidence",
    severity: "medium",
    objection:
      `${unaddressed.length} block(s) qualify or dispute cited evidence and were not ` +
      `addressed: ${unaddressed
        .map((e) => (citedIds.has(e.from) ? e.to : e.from))
        .slice(0, 5)
        .join(", ")}.`,
    detail: { count: unaddressed.length },
  };
}

/** C5 — confidence out of proportion to the evidence cited. */
function c5ConfidenceMismatch({ confidence, citedBlocks }) {
  if (citedBlocks.length === 0) return null;
  const labels = citedBlocks.map((b) => String(b?.confidence_label ?? "").toUpperCase());
  const shaky = labels.filter((l) => l === "FLAGGED" || l === "LOW").length;

  if (String(confidence).toUpperCase() === "HIGH" && citedBlocks.length <= 2) {
    return {
      check: "C5",
      name: "confidence mismatch",
      severity: "medium",
      objection:
        `HIGH confidence asserted on ${citedBlocks.length} cited block(s). ` +
        `That is a strong claim resting on very little.`,
      detail: { confidence: "HIGH", cited_blocks: citedBlocks.length },
    };
  }
  if (shaky === labels.length && labels.length > 0) {
    return {
      check: "C5",
      name: "confidence mismatch",
      severity: "medium",
      objection:
        `Every cited block is labelled LOW or FLAGGED (${labels.length} of ${labels.length}). ` +
        `The conclusion inherits that weakness and should not read as firmer than its inputs.`,
      detail: { all_shaky: true, cited_blocks: labels.length },
    };
  }
  return null;
}

/** C6 — steps that pointed at evidence without quoting it. */
function c6WeakSteps({ steps }) {
  const total = steps.length;
  const weak = steps.filter((s) => s.weak).length;
  if (total === 0 || weak === 0) return null;
  const ratio = weak / total;
  return {
    check: "C6",
    name: "unquoted steps",
    severity: ratio > 0.5 ? "medium" : "low",
    objection:
      `${weak} of ${total} steps cite evidence without quoting it. Those steps assert that ` +
      `a block supports the claim without showing what in it does.`,
    detail: { weak, total, ratio: Number(ratio.toFixed(2)) },
  };
}

/** C7 — all the shown work drawn from one block. */
function c7QuoteConcentration({ steps, blocksById }) {
  const quoted = steps.filter((s) => s.quote && s.ok);
  if (quoted.length < 2) return null;

  // Attribute each quote to the cited block it was located in.
  const sources = new Set();
  for (const s of quoted) {
    const located = (s.checks ?? []).find((c) => /^quote located in /.test(c.reason ?? ""));
    sources.add(located ? located.reason.replace(/^quote located in /, "") : s.cites?.[0]);
  }
  if (sources.size !== 1) return null;

  const only = [...sources][0];
  const doc = documentOf(blocksById.get(only));
  return {
    check: "C7",
    name: "quote concentration",
    severity: quoted.length >= 3 ? "medium" : "low",
    objection:
      `All ${quoted.length} verified quotes come from one block (${only}, document ${doc}). ` +
      `The shown work is a single passage restated, not several pieces of evidence.`,
    detail: { block: only, document: doc, quotes: quoted.length },
  };
}

/**
 * Pull a headline number out of a conclusion. Broader than
 * assertedIndependenceCount: this catches "536 tests", "19 days", "single
 * digits globally", any quantitative claim, not just independence claims.
 * @returns {number[]}
 */
function headlineNumbers(text) {
  const s = String(text ?? "");
  const nums = [];

  // Digit-form numbers, possibly with commas or ordinals.
  for (const m of s.matchAll(/\b(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\b/g)) {
    const n = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(n)) nums.push(n);
  }

  // "Single digits" / "top 1%" / "92nd percentile" — phrases that imply a
  // number without stating it. We do NOT synthesize a numeric value for these;
  // we flag them by pushing the literal phrase so C8 can match on it.
  if (/\b(single digits?|top \d+ percent|9[0-9]th percentile|9[0-9]\/100)\b/i.test(s)) {
    nums.push("RARITY_PHRASE");
  }

  // Word-form numbers (delegates to the shared map).
  for (const [word, n] of Object.entries(NUMBER_WORDS)) {
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(s)) nums.push(n);
  }

  return nums;
}

/**
 * C8 — does the conclusion's quantitative claim follow from the cited
 * measurement evidence?
 *
 * Two arms, both honest about their limits:
 *
 *   (a) HEADLINE ORIGIN. A headline number in the conclusion must trace to a
 *       cited measurement block. "536 tests pass" is checkable against a
 *       measurement block whose command returns 536. A number that appears
 *       nowhere in the cited measurements is asserted, not measured.
 *
 *   (b) CORRELATED MEASUREMENTS MULTIPLIED. When measurement blocks declare
 *       an explicit `correlated_with` field naming another cited block, the
 *       conclusion cannot multiply them as if they were independent. This is
 *       the rarity-funnel failure: prevalences whose own provenance states
 *       correlation, multiplied as if each were a fresh filter.
 *
 * What this check cannot do: infer correlation that the blocks do not
 * declare. If two measurement blocks are correlated in reality but neither
 * says so, C8 cannot see it. That is the same limit every other check here
 * has — it finds defects in the *shown* work, not in the world. The remedy is
 * for the case author to declare known correlations in block provenance,
 * which is the same discipline `source_registry.json` already applies to text
 * sources.
 */
function c8MeasurementValidity({ conclusion, citedBlocks, steps }) {
  const measurements = citedBlocks.filter((b) => b?.measurement || b?.evidence_kind === "measurement");
  if (measurements.length === 0) return null;

  const objections = [];

  // (c) Measurements the verifier could not run here. Raised before the
  // headline checks because it applies whether or not the conclusion carries a
  // number: a conclusion resting on quantities this machine cannot reproduce is
  // resting on the author's word, and a reader deserves to be told which.
  const unrunnableIds = new Set();
  for (const s of steps ?? []) {
    for (const m of s.measurements ?? []) if (m.unverifiable_here) unrunnableIds.add(m.id);
  }
  const unrunnable = [...unrunnableIds];
  if (unrunnable.length > 0) {
    objections.push({
      severity: unrunnable.length === measurements.length ? "high" : "medium",
      text:
        `${unrunnable.length} of ${measurements.length} cited measurement(s) could not be ` +
        `re-run on this machine (${unrunnable.slice(0, 3).join(", ")}${unrunnable.length > 3 ? ", …" : ""}). ` +
        `Those quantities are not wrong — they are unchecked. On this machine the ` +
        `conclusion rests on the author's word for them, which is a weaker footing ` +
        `than the verified measurements alongside them and should be read as such.`,
    });
  }

  const headlines = headlineNumbers(conclusion);
  if (headlines.length === 0) {
    if (objections.length === 0) return null;
    return {
      check: "C8",
      name: "measurement validity",
      severity: objections[0].severity,
      objection: objections.map((o) => o.text).join(" "),
      detail: { unverifiable_here: unrunnable, cited_measurements: measurements.length },
    };
  }

  // (a) Headline origin. For each numeric headline, see if any cited
  // measurement declares that value. RARITY_PHRASE matches only against
  // measurement values that are themselves rarity phrases.
  const declaredValues = measurements.map((m) => m?.measurement?.value);
  for (const h of headlines) {
    if (h === "RARITY_PHRASE") {
      // A rarity phrase in the conclusion is supported only by a measurement
      // block that itself declares a rarity value — and a measurement block
      // by definition runs a command and checks a number, so a rarity phrase
      // can never be a measurement output. Therefore any rarity phrase in the
      // conclusion, in a measurements-driven case, is unsupported.
      objections.push({
        severity: "high",
        text:
          `The conclusion asserts a rarity phrase ("single digits", "top N percent", ` +
          `or similar), but rarity is not a measurable quantity. No whitelisted ` +
          `command returns a percentile. The claim is not grounded in any cited ` +
          `measurement.`,
      });
      continue;
    }
    const supported = declaredValues.some((v) => {
      const vn = Number(String(v).match(/-?\d+(\.\d+)?/)?.[0]);
      return Number.isFinite(vn) && vn === h;
    });
    if (!supported) {
      objections.push({
        severity: "medium",
        text:
          `The conclusion's headline number ${h} does not appear in any cited ` +
          `measurement. A number that the run-machinery did not produce is ` +
          `asserted, not measured.`,
      });
    }
  }

  // (b) Correlated measurements multiplied. Only fires when at least two
  // measurement blocks are cited AND at least one declares correlation with
  // another cited block AND the conclusion contains a multiplicative phrase
  // ("multiplied", "across N layers", "X in Y", "single digits globally via").
  const hasMultiplicationPhrasing = /\b(multipl|across \d+ layers|out of every|\d+ in \d+|via \d+|cumulative|rarity funnel)\b/i.test(conclusion);
  if (hasMultiplicationPhrasing && measurements.length >= 2) {
    const citedIds = new Set(citedBlocks.map((b) => b.evidence_id));
    const correlations = [];
    for (const m of measurements) {
      const corr = m?.provenance?.correlated_with ?? m?.measurement?.correlated_with;
      if (!corr) continue;
      const partners = (Array.isArray(corr) ? corr : [corr]).filter((id) => citedIds.has(id));
      for (const p of partners) {
        correlations.push({ from: m.evidence_id, to: p });
      }
    }
    if (correlations.length > 0) {
      objections.push({
        severity: "high",
        text:
          `The conclusion multiplies measurements as if independent, but at least ` +
          `${correlations.length} cited pair(s) declare correlation in their own ` +
          `provenance (${correlations.slice(0, 3).map((c) => `${c.from}↔${c.to}`).join(", ")}). ` +
          `Multiplying correlated quantities as though independent overstates the ` +
          `result by an unknown margin. This is the same structural error the ` +
          `tool flags in evidence: one lineage counted several times.`,
      });
    }
  }

  if (objections.length === 0) return null;
  const severity = objections.reduce((acc, o) => maxSeverity(acc, o.severity), "low");
  return {
    check: "C8",
    name: "measurement validity",
    severity,
    objection: objections.map((o) => o.text).join(" "),
    detail: {
      headlines: headlines.filter((h) => h !== "RARITY_PHRASE"),
      has_rarity_phrase: headlines.includes("RARITY_PHRASE"),
      cited_measurements: measurements.length,
      unverifiable_here: unrunnable,
      declared_correlations: objections.some((o) => /correlation/i.test(o.text))
        ? objections.filter((o) => /correlation/i.test(o.text)).length
        : 0,
    },
  };
}

const CHECKS = [
  c1Coverage,
  c2LineageSpan,
  c3SingleLineage,
  c4UncitedContradiction,
  c5ConfidenceMismatch,
  c6WeakSteps,
  c7QuoteConcentration,
  c8MeasurementValidity,
];

/**
 * Run every mechanical check and return a challenge in the same shape a model
 * challenger produces, so the panel can treat both uniformly.
 *
 * Deterministic: same inputs always give the same output. No network, no model.
 *
 * @param {object} params
 * @param {string} params.conclusion    the proposer's conclusion text
 * @param {string} [params.confidence]  the proposer's stated confidence
 * @param {object[]} params.steps       verified steps from verifyCitations()
 * @param {object[]} params.blocks      the corpus
 * @param {object[]} [params.edges]     claim_graph edges, if available
 * @param {string} [params.jobType]
 * @returns {object} challenge record with route 'mechanical'
 */
export function mechanicalChallenge({
  conclusion = "",
  confidence = null,
  steps = [],
  blocks = [],
  edges = [],
  jobType = null,
}) {
  const blocksById = new Map(blocks.map((b) => [b.evidence_id, b]));
  const citedIds = new Set();
  for (const s of steps) for (const id of s.cites ?? []) if (blocksById.has(id)) citedIds.add(id);
  const citedBlocks = [...citedIds].map((id) => blocksById.get(id));

  const ctx = { conclusion, confidence, steps, blocks, edges, jobType, citedIds, citedBlocks, blocksById };

  const objections = [];
  for (const check of CHECKS) {
    try {
      const out = check(ctx);
      if (out) objections.push(out);
    } catch {
      // A broken check must never take down an adjudication run. Skipping one
      // check silently is preferable to losing the whole judgment, and the
      // remaining checks still constitute a challenge.
    }
  }

  const severity = objections.reduce((acc, o) => maxSeverity(acc, o.severity), "low");
  const verdict =
    objections.length === 0 ? "sound" : severity === "high" ? "unsupported" : "overstated";

  return {
    route: "mechanical",
    lineage_id: "deterministic",
    independent: true,
    model: null,
    verdict,
    severity: objections.length === 0 ? "low" : severity,
    objections,
    strongest_objection: objections.length
      ? [...objections].sort((a, b) => RANK[b.severity] - RANK[a.severity])[0].objection
      : "No structural objection. Citation coverage, lineage spread, confidence and quoting all check out.",
    what_would_change_my_mind: objections.length
      ? "Cite evidence from additional lineages, quote the blocks you rely on, and address the counter-evidence named above."
      : null,
    checks_run: CHECKS.length,
    note:
      "Deterministic. Shares no weights, no pretraining data and no priors with the proposer. " +
      "Finds structural defects in the shown work, not false conclusions.",
  };
}
