/**
 * Adjudication protocol — how a model judgment earns its place in this stack.
 *
 * Every LLM conclusion in the epistemic stack passes through four stages:
 *
 *   1. PROPOSE   The model states a conclusion and shows its work as discrete
 *                steps, each citing evidence ids and quoting the text it relies on.
 *   2. VERIFY    Every citation is checked mechanically against the corpus.
 *                No model is involved. A step that cites a block that does not
 *                exist, or quotes text that is not in that block, fails. Shown
 *                work that cannot be checked is decoration, so we check it.
 *   3. CHALLENGE A panel argues against the conclusion. Always a deterministic
 *                mechanical challenger, which shares nothing with the proposer;
 *                plus, when a suitable model is installed, a blind model
 *                challenger from a DIFFERENT weight lineage. Blind because a
 *                model shown its own reasoning defends it.
 *   4. RESOLVE   The human accepts, overrides, or reruns. Everything above is
 *                on the record either way.
 *
 * Stage 3 used to be a single model call using the proposer's own weights. That
 * gave us two calls and one lineage — the exact error the rest of this stack
 * exists to detect, committed by the adjudicator. The panel counts its own
 * lineages the same way genealogy.js counts evidence, and every record carries
 * an `independence_grade` so `verified` at grade `none` can never be mistaken for
 * `verified` at grade `strong`.
 *
 * Nothing here writes to the corpus. Callers persist an accepted verdict
 * themselves, which keeps the judgment and its consequences separable.
 */

import { callLlm, getLlmStatus } from "./llm.js";
import { mechanicalChallenge } from "./mechanical_challenge.js";
import { resolveModelLineage, pickChallenger } from "./model_identity.js";
import { verifyMeasurement, evidenceKind } from "./measure.js";

/** Collapse text for tolerant comparison: case, whitespace, and smart quotes. */
export function normalizeForMatch(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** All text a block can legitimately be quoted from. */
function quotableText(block) {
  return [block?.claim, block?.source?.excerpt, block?.provenance?.context]
    .filter(Boolean)
    .map(normalizeForMatch)
    .join(" \u2016 ");
}

/**
 * Is `quote` present in `haystack`? Ellipsis is allowed: each fragment must
 * appear, in order, so an elided quote cannot silently reorder the source.
 */
export function quoteAppearsIn(quote, haystack) {
  const norm = normalizeForMatch(quote);
  if (!norm) return false;
  const fragments = norm
    .split(/\s*(?:\.\.\.|\u2026)\s*/)
    .map((f) => f.trim())
    .filter((f) => f.length >= 8);
  if (fragments.length === 0) return false;

  let searchPos = 0;
  for (const fragment of fragments) {
    const at = haystack.indexOf(fragment, searchPos);
    if (at === -1) return false;
    searchPos = at + fragment.length;
  }
  return true;
}

/**
 * Check every reasoning step against the corpus. Deterministic and pure.
 *
 * @param {Array<{step: string, cites?: string[], quote?: string}>} reasoning
 * @param {object[]} blocks
 * @returns {{ verified: boolean, steps: object[], verified_count: number, total: number, failures: string[] }}
 */
export function verifyCitations(reasoning, blocks, cwd, roots = {}) {
  const byId = new Map(blocks.map((b) => [b.evidence_id, b]));
  const steps = [];
  const failures = [];

  for (const [i, step] of (reasoning ?? []).entries()) {
    const cites = Array.isArray(step?.cites) ? step.cites : [];
    const checks = [];

    if (cites.length === 0) {
      checks.push({ ok: false, reason: "step cites no evidence" });
    }

    // Every cited id must resolve. Citing a block that does not exist is the
    // failure mode we care most about, so one bad id fails the step even if
    // its siblings are fine.
    const resolved = [];
    for (const id of cites) {
      const block = byId.get(id);
      if (block) {
        resolved.push({ id, block });
        checks.push({ cite: id, ok: true, reason: "block exists" });
      } else {
        checks.push({ cite: id, ok: false, reason: `no block with evidence_id '${id}'` });
      }
    }

    // A step carries one quote but may cite several blocks, so the quote is
    // checked against the cited set rather than against each block in turn.
    // Checking it per-block would mark a correct quote as failing everywhere
    // it does not appear, which is most places.
    //
    // Measurement evidence (evidence_kind: "measurement") is not quoted — it
    // is re-run. A measurement block declares a command on the whitelist and
    // a value it claims the command returns; verifyMeasurement re-runs the
    // command and compares. A measurement block does not need a quote to pass;
    // it needs the re-measurement to agree.
    let quoteOk = true;
    let weak = false;
    const measurementResults = [];
    const citedMeasurements = resolved.filter(({ block }) => evidenceKind(block) === "measurement");
    const citedText = resolved.filter(({ block }) => evidenceKind(block) === "text");

    if (citedMeasurements.length > 0) {
      for (const { id, block } of citedMeasurements) {
        const m = verifyMeasurement(block, cwd, roots);
        measurementResults.push({ id, ...m });
        if (m.unverifiable_here) {
          checks.push({
            cite: id,
            ok: false,
            unverifiable_here: true,
            reason: `measurement not checkable here: ${m.reason}`,
          });
        } else if (!m.ok) {
          checks.push({ cite: id, ok: false, reason: `measurement mismatch: ${m.reason}` });
        } else {
          checks.push({ cite: id, ok: true, reason: `measurement verified: declared ${m.declared} = measured ${m.actual}` });
        }
      }
      // A measurement we could not run has not been confirmed, so the step does
      // not pass. But the record keeps the two apart, because "unchecked here"
      // and "checked and wrong" warrant different responses from a reader.
      quoteOk = measurementResults.every((m) => m.ok);
    }

    if (step?.quote) {
      // Quote check applies only to text-kind blocks. A step that cites a
      // measurement block would spuriously fail a quote check against text it
      // was never asked to quote, so restrict the search to cited text blocks.
      const hit = citedText.length > 0
        ? citedText.find(({ block }) => quoteAppearsIn(step.quote, quotableText(block)))
        : null;
      quoteOk = quoteOk && Boolean(hit || citedMeasurements.length > 0);
      if (citedText.length > 0) {
        checks.push(
          hit
            ? { ok: true, reason: `quote located in ${hit.id}` }
            : { ok: false, reason: "quote does not appear in any cited block" }
        );
      }
    } else if (citedText.length > 0 && citedMeasurements.length === 0) {
      // Not fabrication, but not shown work either. Passing these silently
      // would let a model earn a clean verdict by quoting nothing at all.
      // Measurement-only steps are exempt: their work is the re-run.
      weak = true;
      checks.push({ ok: true, weak: true, reason: "no quote given — citation asserted, not shown" });
    }

    const allCitesResolve = cites.length > 0 && resolved.length === cites.length;
    const ok = allCitesResolve && quoteOk;
    if (!ok) {
      failures.push(`step ${i + 1}: ${checks.filter((c) => !c.ok).map((c) => c.reason).join("; ")}`);
    }
    steps.push({
      index: i + 1,
      step: step?.step ?? "",
      cites,
      quote: step?.quote ?? null,
      ok,
      weak: ok && weak,
      checks,
      ...(measurementResults.length > 0 ? { measurements: measurementResults } : {}),
    });
  }

  const total = steps.length;
  const verified_count = steps.filter((s) => s.ok).length;
  const weak_count = steps.filter((s) => s.weak).length;

  // Measurements this machine could not run, surfaced at the top level rather
  // than left for a reader to reconstruct from per-step checks. A reader on a
  // machine that lacks a referenced repository should be told that plainly, not
  // shown a wall of failures indistinguishable from detected falsehoods.
  // Keyed by measurement id, not by occurrence: one absent repository cited in
  // four steps is one thing a reader has to go get, not four.
  const unrunnableById = new Map();
  for (const s of steps) {
    for (const m of s.measurements ?? []) {
      if (!m.unverifiable_here) continue;
      const seen = unrunnableById.get(m.id);
      if (seen) seen.steps.push(s.index);
      else unrunnableById.set(m.id, { id: m.id, reason: m.reason, steps: [s.index] });
    }
  }
  const unverifiable_here = [...unrunnableById.values()];

  return {
    verified: total > 0 && verified_count === total,
    // Every step passed, but none of them actually quoted anything. The
    // citations are real; the reasoning is still unevidenced.
    all_weak: total > 0 && weak_count === total,
    steps,
    verified_count,
    weak_count,
    total,
    failures,
    unverifiable_here,
    unverifiable_here_count: unverifiable_here.length,
  };
}

/** Pull the first JSON object or array out of a model response. */
export function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const opener = candidate[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === opener) depth++;
    else if (ch === closer) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** Compact digest of blocks for prompting — enough to cite, small enough to fit. */
function blockDigest(blocks, limit = 60) {
  return blocks.slice(0, limit).map((b) => ({
    evidence_id: b.evidence_id,
    claim: b.claim,
    excerpt: b.source?.excerpt ?? null,
    document_id: b.provenance?.document_id ?? b.source?.identifier ?? null,
    confidence: b.confidence_label,
  }));
}

/**
 * Build the corpus section of a prompt.
 *
 * Models reliably confuse document_id with evidence_id and then "cite" a
 * document, which fails verification even when the underlying judgment is
 * sound. Listing the citable ids separately and up front removes the ambiguity.
 */
function corpusPrompt(blocks) {
  const ids = blocks.map((b) => b.evidence_id);
  return [
    `CITABLE evidence_id VALUES — the "cites" array may contain ONLY these strings:`,
    ids.map((id) => `  ${id}`).join("\n"),
    ``,
    `Note: each block also has a document_id. Those are NOT citable. Several`,
    `blocks can share one document_id; that is the point of this corpus. If you`,
    `want to say two blocks share a document, cite the two evidence_id values`,
    `and name the document in the step text.`,
    ``,
    `CORPUS:`,
    JSON.stringify(blockDigest(blocks), null, 1),
  ].join("\n");
}

const PROPOSER_RULES = `You are making a judgment about an evidence corpus. Reply with JSON only.

Required shape:
{
  "conclusion": "<one or two sentences stating what you concluded>",
  "reasoning": [
    { "step": "<what this step establishes>",
      "cites": ["<evidence_id>", ...],
      "quote": "<text copied EXACTLY from one cited block>" }
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "assumption": "<the load-bearing assumption you are making>"
}

Hard rules:
- Every reasoning step MUST cite at least one real evidence_id from the corpus below.
- Every "quote" MUST be copied verbatim from the block you cite. Your quotes are
  checked automatically against the corpus. An invented or paraphrased quote fails
  the step and the whole judgment is marked unverified.
- Use "..." if you need to elide the middle of a quote. Keep fragments exact.
- If the evidence does not support a conclusion, say so in "conclusion" and give
  the steps that show why. An honest refusal passes; a confident guess fails.
- Do not cite evidence ids that are not listed below.`;

const CHALLENGER_RULES = `You are a red-team reviewer. You are shown a conclusion someone drew from an
evidence corpus. You are deliberately NOT shown their reasoning, so you cannot be
led by it. Build the strongest honest case against the conclusion. Reply with JSON only.

Required shape:
{
  "strongest_objection": "<the best argument that this conclusion is wrong or overstated>",
  "cites": ["<evidence_id>", ...],
  "what_would_change_my_mind": "<what evidence would settle this>",
  "verdict": "sound" | "overstated" | "unsupported",
  "severity": "low" | "medium" | "high"
}

Hard rules:
- Argue from the corpus below, not from outside knowledge.
- If the conclusion is actually well-supported, say verdict "sound" and explain
  what would have to be true for it to fail. Do not manufacture an objection.
- Do not cite evidence ids that are not listed below.`;

/**
 * Run the full protocol for one judgment.
 *
 * @param {object} params
 * @param {string} params.question   the judgment being asked for
 * @param {string} params.jobType    e.g. 'lineage' | 'alias' | 'crux' | 'gap'
 * @param {object[]} params.blocks   evidence blocks available for citation
 * @param {string} [params.instructions] job-specific guidance for the proposer
 * @param {object[]} [params.edges]  claim_graph edges, used by mechanical check C4
 * @param {object} [params.opts]     { model, challengerModel, temperature, mechanicalOnly }
 * @returns {Promise<object>} adjudication record
 */
export async function adjudicate({
  question,
  jobType,
  blocks,
  instructions = "",
  edges = [],
  cwd,
  measurementRoots = {},
  opts = {},
}) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error("REJECTED: adjudicate requires a non-empty blocks array.");
  }

  const digest = corpusPrompt(blocks);
  const started_at = new Date().toISOString();

  // --- 1. PROPOSE -----------------------------------------------------------
  const proposeRes = await callLlm({
    messages: [
      { role: "system", content: PROPOSER_RULES },
      {
        role: "user",
        content: `JUDGMENT REQUESTED (${jobType}): ${question}\n\n${instructions}\n\n${digest}`,
      },
    ],
    model: opts.model,
    temperature: opts.temperature ?? 0.2,
    max_tokens: 1200,
  });

  const proposal = extractJson(proposeRes.text);
  if (!proposal) {
    return {
      job_type: jobType,
      question,
      started_at,
      verdict: "unparseable",
      error: "proposer did not return usable JSON",
      raw_proposal: proposeRes.text.slice(0, 2000),
      model: proposeRes.model,
    };
  }

  // --- 2. VERIFY (deterministic) -------------------------------------------
  const verification = verifyCitations(
    proposal.reasoning ?? [],
    blocks,
    cwd ?? opts.cwd,
    Object.keys(measurementRoots).length ? measurementRoots : (opts.measurementRoots ?? {})
  );

  // --- 3. CHALLENGE PANEL ---------------------------------------------------
  const proposerLineage = resolveModelLineage(proposeRes.model);
  const challenges = [];

  // 3a. Mechanical. Always runs, needs no model, shares nothing with the
  // proposer. This is the only route to independence we can guarantee.
  challenges.push({
    ...mechanicalChallenge({
      conclusion: proposal.conclusion ?? "",
      confidence: proposal.confidence ?? null,
      steps: verification.steps,
      blocks,
      edges,
      jobType,
    }),
    independent: true,
  });

  // 3b. Blind model challenger, preferring a different weight lineage.
  let challengeError = null;
  if (!opts.mechanicalOnly) {
    const chosen = await chooseChallengerModel(proposeRes.model, opts);
    try {
      const challengeRes = await callLlm({
        messages: [
          { role: "system", content: CHALLENGER_RULES },
          {
            role: "user",
            content:
              `CONCLUSION UNDER REVIEW: ${proposal.conclusion}\n\n` +
              `(The reasoning behind it is withheld from you by design.)\n\n` +
              digest,
          },
        ],
        model: chosen.model,
        temperature: opts.temperature ?? 0.3,
        max_tokens: 800,
      });
      const parsed = extractJson(challengeRes.text);
      const lineage = resolveModelLineage(challengeRes.model);
      const distinct = lineage.lineage_id !== proposerLineage.lineage_id;
      challenges.push({
        route: distinct ? "cross_lineage_model" : "blind_same_lineage_model",
        model: challengeRes.model,
        lineage_id: lineage.lineage_id,
        lineage_verified: lineage.verified,
        // A challenge only counts as independent if it is a *verified* different
        // lineage. "We do not know what this model is built on" is not grounds
        // for crediting ourselves with a second opinion.
        independent: distinct && lineage.verified,
        selection_reason: chosen.reason,
        independence_note: distinct
          ? lineage.note ?? null
          : `Shares weight lineage '${lineage.lineage_id}' with the proposer. ` +
            `Counted as a second call, NOT a second source.`,
        ...(parsed ?? { verdict: null, raw: challengeRes.text.slice(0, 1000) }),
      });
    } catch (e) {
      challengeError = e.message;
    }
  }

  const panel = summarizePanel(challenges, proposerLineage.lineage_id);

  // --- 4. RESOLVE (verdict for the human, not by the human yet) ------------
  const verdict = resolveVerdict(verification, panel);

  return {
    job_type: jobType,
    question,
    started_at,
    completed_at: new Date().toISOString(),
    model: proposeRes.model,
    proposer_lineage: proposerLineage.lineage_id,
    conclusion: proposal.conclusion ?? null,
    confidence: proposal.confidence ?? null,
    assumption: proposal.assumption ?? null,
    reasoning: verification.steps,
    verification: {
      verified: verification.verified,
      verified_steps: verification.verified_count,
      weak_steps: verification.weak_count,
      total_steps: verification.total,
      failures: verification.failures,
      unverifiable_here: verification.unverifiable_here,
      unverifiable_here_count: verification.unverifiable_here_count,
    },
    challenge_panel: panel,
    // Kept for readers and records written before the panel existed: the model
    // challenge, or the mechanical one when no model challenge ran.
    challenge: challenges.find((c) => c.route.endsWith("model")) ?? challenges[0] ?? null,
    challenge_error: challengeError,
    verdict,
    // Human has not acted yet. Callers surface this and record the decision.
    human_decision: null,
  };
}

/**
 * Choose which model challenges the proposal. Prefers a different verified
 * weight lineage; falls back to the proposer's own model and says so, because a
 * correlated challenger that is labelled correlated is honest, while a
 * correlated challenger presented as independent is the bug we are fixing.
 *
 * @param {string} proposerModel
 * @param {object} opts
 * @returns {Promise<{ model: string|undefined, reason: string }>}
 */
async function chooseChallengerModel(proposerModel, opts = {}) {
  if (opts.challengerModel) {
    return { model: opts.challengerModel, reason: "explicitly requested by caller" };
  }
  try {
    const status = await getLlmStatus();
    const picked = pickChallenger(proposerModel, status?.models ?? []);
    if (picked) return { model: picked.model, reason: picked.reason };
    return {
      model: opts.model,
      reason:
        "no installed model has a different verified weight lineage — " +
        "falling back to the proposer's model and grading independence down",
    };
  } catch {
    return { model: opts.model, reason: "model list unavailable; using the proposer's model" };
  }
}

/**
 * The independence ladder is a straight count of independent lineages, not a
 * checklist of required challenger types.
 *
 * An earlier version required an independent *model* before the grade could pass
 * `weak`, which meant a machine with one model could never exceed `weak` no
 * matter what the human contributed. That undervalued the strongest challenger on
 * the panel — the human shares no weights, no pretraining corpus and no
 * substrate, where a second model still shares an unmeasurable amount of level 4.
 *
 * @param {number} n independent lineages
 */
export function gradeForCount(n) {
  if (n >= 3) return "strong";
  if (n === 2) return "moderate";
  if (n === 1) return "weak";
  return "none";
}

/**
 * Count the panel's own independence the way genealogy.js counts evidence:
 * calls are documents, lineages are lineages.
 *
 * @param {object[]} challenges
 * @param {string} [proposerLineage]
 */
export function summarizePanel(challenges = [], proposerLineage = null) {
  const documents = challenges.length;
  const lineages = new Set(challenges.map((c) => c.lineage_id ?? "unknown"));
  const independent = new Set(
    challenges.filter((c) => c.independent).map((c) => c.lineage_id ?? "unknown")
  );
  const hasHuman = challenges.some((c) => c.route === "human");

  return {
    challenges,
    documents,
    lineages: lineages.size,
    independent_lineages: independent.size,
    inflation_factor: lineages.size > 0 ? Number((documents / lineages.size).toFixed(2)) : 0,
    proposer_lineage: proposerLineage,
    independence_grade: gradeForCount(independent.size),
    has_human: hasHuman,
    // Lets the UI state the actual payoff instead of promising `strong`
    // everywhere, which would be false on a single-model machine.
    grade_with_your_position: hasHuman ? null : gradeForCount(independent.size + 1),
    unresolvable:
      "Level 4 — shared pretraining corpora across open models — is real and not " +
      "resolvable, because no major open model discloses its training data. Distinct " +
      "weight lineages are a checkable claim; independent minds are not.",
  };
}

/* ------------------------------------------------------------------------- *
 * Stage 4 — the human as a challenger.
 *
 * The human is the only lineage in this protocol that is not another instance
 * of the thing being checked: different substrate, no shared weights, no shared
 * pretraining. They are also the lineage we were wasting, because stage 4 used
 * to be three buttons and a congratulatory banner.
 *
 * Two rules shape the design.
 *
 * It never blocks. Accept always works. Recording a position is an offer with a
 * visible payoff — it is the only route to independence grade `strong` — rather
 * than a toll charged for permission.
 *
 * Anti-passivity does not require prose. It requires that the answer be
 * unguessable without engagement. "Which objection is most serious" cannot be
 * answered without reading the objections, so two clicks satisfy the house rule
 * from CLAUDE.md while a blank text box would mostly just stall people.
 *
 * Everything asked is about the STRUCTURE of the argument — the load-bearing
 * assumption, which objection bites, what would change your mind. Never about
 * the domain. A tool that refuses to take a position on COVID origins must not
 * turn around and extract one from its user.
 * ------------------------------------------------------------------------- */

/**
 * Did the human actually engage, or just click through?
 * Any one of the three answers counts; none of them can be produced without
 * having read the record.
 * @param {object|null} position
 */
export function isSubstantive(position) {
  if (!position) return false;
  const text = String(position.what_would_change_my_mind ?? "").trim();
  return Boolean(
    position.assumption ||
      position.strongest_objection ||
      // A one-word throwaway is not a position. Nor is it worth being strict about.
      text.length >= 12
  );
}

/**
 * Turn a human position into a challenge in the same shape the mechanical and
 * model challengers produce, so the panel treats all three uniformly.
 *
 * @param {object} position
 * @param {object[]} [challenges] existing panel, used to inherit the severity of
 *                                an objection the human endorsed
 * @returns {object} challenge with route 'human'
 */
export function humanChallengeFrom(position, challenges = []) {
  const endorsedCode = position?.strongest_objection ?? null;
  const endorsed =
    endorsedCode && endorsedCode !== "none"
      ? challenges
          .flatMap((c) => c.objections ?? [])
          .find((o) => o.check === endorsedCode)
      : null;

  let verdict = "sound";
  let severity = "low";
  let objection = null;

  if (position?.assumption === "reject") {
    // The conclusion rests on the assumption. Rejecting it is not a caveat.
    verdict = "unsupported";
    severity = "high";
    objection = "The human does not accept the load-bearing assumption the conclusion rests on.";
  } else if (endorsedCode && endorsedCode !== "none") {
    verdict = "overstated";
    severity = endorsed?.severity ?? "medium";
    objection = endorsed
      ? `The human independently judges this the most serious objection: ${endorsed.objection}`
      : `The human endorses objection ${endorsedCode} as the most serious.`;
  } else if (position?.assumption === "unsure") {
    verdict = "overstated";
    severity = "low";
    objection = "The human is unsure whether the load-bearing assumption holds.";
  }

  const text = String(position?.what_would_change_my_mind ?? "").trim();

  return {
    route: "human",
    lineage_id: "human",
    // Different substrate entirely. This is the strongest independence claim in
    // the protocol, and the only one that does not bottom out in model weights.
    independent: true,
    model: null,
    verdict,
    severity,
    objections: objection
      ? [{ check: "H1", name: "human judgment", severity, objection }]
      : [],
    strongest_objection: objection ?? "The human read the work and raised no objection.",
    what_would_change_my_mind: text || null,
    assumption_response: position?.assumption ?? null,
    endorsed_objection: endorsedCode,
    answered_at: position?.answered_at ?? new Date().toISOString(),
    note:
      "Recorded by a person, not generated. Shares no weights, no training data and " +
      "no priors with any model on the panel.",
  };
}

/**
 * Fold a human position into an adjudication record: add them to the panel,
 * re-grade independence, and re-resolve the verdict.
 *
 * The human's *decision* (accept / reject) and the protocol's *verdict* are
 * deliberately separate. A person may accept a contested conclusion — that is
 * their prerogative, and the record shows they did it knowingly rather than
 * hiding the disagreement.
 *
 * Pure: returns a new record, mutates nothing.
 *
 * @param {object} record   an adjudication record
 * @param {object} position { decision, assumption, strongest_objection,
 *                            what_would_change_my_mind }
 * @returns {object} updated record
 */
export function recordHumanPosition(record, position) {
  const substantive = isSubstantive(position);
  const existing = (record.challenge_panel?.challenges ?? []).filter((c) => c.route !== "human");
  const challenges = substantive
    ? [...existing, humanChallengeFrom(position, existing)]
    : existing;

  const panel = summarizePanel(
    challenges,
    record.challenge_panel?.proposer_lineage ?? record.proposer_lineage ?? null
  );

  return {
    ...record,
    challenge_panel: panel,
    verdict: resolveVerdict(record.verification ?? { verified: true }, panel),
    human_decision: position?.decision ?? null,
    human_position: substantive
      ? {
          assumption: position.assumption ?? null,
          strongest_objection: position.strongest_objection ?? null,
          what_would_change_my_mind:
            String(position.what_would_change_my_mind ?? "").trim() || null,
          answered_at: position.answered_at ?? new Date().toISOString(),
        }
      : null,
    // Named so the record cannot quietly imply engagement that did not happen.
    human_engaged: substantive,
  };
}

/**
 * Accept a panel, a legacy single challenge, or nothing, and return a flat list
 * of challenges that actually reached a verdict.
 *
 * An unparseable challenger response (`{ raw: "..." }`) has no verdict and is
 * therefore not a challenge — counting it as one is how a failed call used to
 * masquerade as a passed review.
 *
 * @param {object|object[]|null} panel
 * @returns {object[]}
 */
export function normalizePanel(panel) {
  if (!panel) return [];
  const list = Array.isArray(panel)
    ? panel
    : Array.isArray(panel.challenges)
      ? panel.challenges
      : [panel];
  return list.filter((c) => c && c.verdict);
}

/**
 * Combine mechanical verification with the challenge panel into one verdict.
 *
 * Verification is the hard gate: unverifiable citations cannot be argued past.
 * Beyond that, we count *independent lineages* of objection rather than
 * objections, because two challenges sharing a weight lineage are one voice
 * repeated — which is this tool's entire thesis, applied to itself.
 *
 * @param {object} verification
 * @param {object|object[]|null} panel  a challenge panel, a single challenge, or null
 */
export function resolveVerdict(verification, panel) {
  if (!verification.verified) return "unverified";
  // Real citations, no quotes anywhere. The model pointed at blocks without
  // showing what in them supports the claim, which is the polite version of
  // not showing work. It does not get a clean verdict.
  if (verification.all_weak) return "unsubstantiated";

  const challenges = normalizePanel(panel);

  // Nothing challenged this. Previously this returned "verified", so a challenge
  // call that timed out scored identically to one that ran and found nothing.
  if (challenges.length === 0) return "verified_unchallenged";

  const objecting = challenges.filter(
    (c) => c.verdict === "unsupported" || c.verdict === "overstated"
  );
  if (objecting.length === 0) return "verified";

  // Two genuinely separate sources of objection is the strongest signal available.
  const objectingLineages = new Set(objecting.map((c) => c.lineage_id ?? "unknown"));
  if (objectingLineages.size >= 2) return "contested";

  if (objecting.some((c) => c.verdict === "unsupported")) return "contested";
  if (objecting.some((c) => c.verdict === "overstated" && c.severity === "high")) return "contested";
  return "verified_with_caveat";
}

/**
 * Render an adjudication record as human-readable text. Used by the CLI and
 * as the basis for the UI panel, so both show the same thing.
 * @param {object} record
 */
export function formatAdjudication(record) {
  const lines = [
    `## ${record.job_type} — ${record.verdict.toUpperCase().replace(/_/g, " ")}`,
    ``,
    `**Question:** ${record.question}`,
    ``,
  ];

  if (record.verdict === "unparseable") {
    lines.push(`The model did not return usable output.`, ``, `> ${record.error}`, ``);
    return lines.join("\n");
  }

  lines.push(`**Conclusion:** ${record.conclusion}`, ``);
  if (record.assumption) lines.push(`**Load-bearing assumption:** ${record.assumption}`, ``);

  const weakNote = record.verification.weak_steps
    ? `, ${record.verification.weak_steps} cited without quoting`
    : "";
  lines.push(
    `### Shown work (${record.verification.verified_steps}/${record.verification.total_steps} steps verified${weakNote})`,
    ``
  );
  for (const s of record.reasoning) {
    const flag = !s.ok ? "FAIL" : s.weak ? "WEAK" : "PASS";
    lines.push(`${flag} — step ${s.index}. ${s.step}`);
    if (s.cites.length) lines.push(`   cites: ${s.cites.join(", ")}`);
    if (s.quote) lines.push(`   quote: "${s.quote.slice(0, 160)}${s.quote.length > 160 ? "…" : ""}"`);
    for (const c of s.checks.filter((c) => c.ok && /^quote located in/.test(c.reason || ""))) {
      lines.push(`   ${c.reason}`);
    }
    for (const c of s.checks.filter((c) => !c.ok)) {
      lines.push(`   ${c.unverifiable_here ? "?" : "!"} ${c.reason}`);
    }
  }

  // Say plainly when a step did not pass because this machine lacks the thing
  // being measured. Without this, an absent repository reads exactly like a
  // caught lie, and the reader draws the wrong conclusion about the claim.
  const unrunnable = record.verification.unverifiable_here ?? [];
  if (unrunnable.length) {
    lines.push(
      ``,
      `### ${unrunnable.length} measurement(s) could not be checked on this machine`,
      ``,
      `These are marked \`?\` above, not \`!\`. The distinction matters: a measurement`,
      `this machine cannot run has not been shown false, only left unchecked. It does`,
      `not count toward the verified total either — unchecked is not confirmed.`,
      ``
    );
    for (const u of unrunnable) {
      const where = (u.steps ?? []).length ? ` (step ${u.steps.join(", ")})` : "";
      lines.push(`   ? ${u.id}${where} — ${u.reason}`);
    }
  }

  const panel = record.challenge_panel;
  if (panel?.challenges?.length) {
    lines.push(
      ``,
      `### Challenge panel — independence: ${panel.independence_grade.toUpperCase()}`,
      ``,
      `${panel.documents} challenge(s), of which ${panel.independent_lineages ?? 0} ` +
        `independent lineage(s)` +
        (panel.inflation_factor > 1 ? ` — ${panel.inflation_factor}x inflation` : ``) +
        `. Proposer lineage: ${panel.proposer_lineage ?? "unknown"}.`,
      ``
    );

    for (const c of panel.challenges) {
      const tag = c.independent ? "INDEPENDENT" : "CORRELATED";
      const who = c.model ? `${c.route} (${c.model})` : c.route;
      lines.push(`[${tag}] ${who} — ${c.verdict ?? "no verdict"} / ${c.severity ?? "?"}`);
      if (c.lineage_id) lines.push(`   lineage: ${c.lineage_id}`);
      if (c.strongest_objection) lines.push(`   ${c.strongest_objection}`);
      for (const o of c.objections ?? []) {
        lines.push(`   - ${o.check} ${o.name} [${o.severity}]: ${o.objection}`);
      }
      if (c.independence_note) lines.push(`   ! ${c.independence_note}`);
      lines.push(``);
    }

    if (panel.grade_with_your_position) {
      lines.push(
        `> Independence is ${panel.independence_grade}. Two ways up: record your own`,
        `> position (→ ${panel.grade_with_your_position}, in the UI at 'npm start'), or install a`,
        `> model from a different weight lineage — see models/registry.json.`,
        ``
      );
    }
  } else if (record.challenge) {
    // Legacy record written before the panel existed.
    lines.push(``, `### Blind challenge`, ``);
    lines.push(`**Verdict:** ${record.challenge.verdict ?? "?"} (severity: ${record.challenge.severity ?? "?"})`);
    if (record.challenge.strongest_objection) {
      lines.push(``, `**Strongest objection:** ${record.challenge.strongest_objection}`);
    }
    if (record.challenge.what_would_change_my_mind) {
      lines.push(``, `**Would be settled by:** ${record.challenge.what_would_change_my_mind}`);
    }
  }

  if (record.challenge_error) {
    lines.push(``, `! Model challenge failed: ${record.challenge_error}`, ``);
  }

  lines.push(``, `### Your move`, ``);

  if (record.human_decision) {
    lines.push(
      `${record.human_decision.toUpperCase()} by you.` +
        (record.human_engaged
          ? ` Your position is on the panel as its own lineage.`
          : ` No position recorded, so independence did not rise.`)
    );
    if (record.human_position?.what_would_change_my_mind) {
      lines.push(``, `Would change your mind: ${record.human_position.what_would_change_my_mind}`);
    }
  } else {
    lines.push(
      `Accept, override, or rerun. Nothing has been written to the corpus.`,
      ``,
      `You are the only challenger available here that is not a model. Recording a`,
      `position is the one thing that raises independence to 'strong' — in the local`,
      `UI at 'npm start', stage 4.`
    );
  }
  lines.push(``);

  return lines.join("\n");
}
