import { test } from "node:test";
import assert from "node:assert/strict";
import {
  verifyCitations,
  quoteAppearsIn,
  normalizeForMatch,
  extractJson,
  resolveVerdict,
  normalizePanel,
  summarizePanel,
  gradeForCount,
  isSubstantive,
  humanChallengeFrom,
  recordHumanPosition,
  formatAdjudication,
} from "../src/epistemic/adjudicate.js";

const BLOCKS = [
  {
    evidence_id: "b1",
    claim: "Judge Will concluded roughly a 1 in 300 chance of lab leak.",
    source: { excerpt: "I concluded that there is approximately a 1 in 300 chance that SARS-CoV-2 was the result of a lab leak." },
    provenance: { context: "https://example.com/will" },
    confidence_label: "HIGH",
  },
  {
    evidence_id: "b2",
    claim: "Weissman treats prior uncertainty as more damaging than likelihood uncertainty.",
    source: { excerpt: "highly uncertain priors can make fairly large likelihood ratios irrelevant" },
    provenance: { context: "https://example.com/weissman" },
    confidence_label: "HIGH",
  },
];

test("normalizeForMatch flattens case, whitespace and smart punctuation", () => {
  assert.equal(normalizeForMatch("  The\u2019s   QUICK\u2014fox  "), "the's quick-fox");
});

test("quoteAppearsIn matches an exact quote", () => {
  const hay = normalizeForMatch(BLOCKS[0].source.excerpt);
  assert.ok(quoteAppearsIn("approximately a 1 in 300 chance", hay));
});

test("quoteAppearsIn tolerates case and whitespace differences", () => {
  const hay = normalizeForMatch(BLOCKS[0].source.excerpt);
  assert.ok(quoteAppearsIn("APPROXIMATELY   A 1 IN 300   CHANCE", hay));
});

test("quoteAppearsIn honours ellipsis but preserves fragment order", () => {
  const hay = normalizeForMatch(BLOCKS[0].source.excerpt);
  assert.ok(quoteAppearsIn("I concluded that there is ... result of a lab leak", hay));
  // Reversed fragments must not match — elision cannot reorder a source.
  assert.equal(quoteAppearsIn("result of a lab leak ... I concluded that there is", hay), false);
});

test("quoteAppearsIn rejects a fabricated quote", () => {
  const hay = normalizeForMatch(BLOCKS[0].source.excerpt);
  assert.equal(quoteAppearsIn("I concluded it was definitely a lab leak", hay), false);
});

test("quoteAppearsIn rejects empty and trivially short quotes", () => {
  const hay = normalizeForMatch(BLOCKS[0].source.excerpt);
  assert.equal(quoteAppearsIn("", hay), false);
  assert.equal(quoteAppearsIn("a 1", hay), false);
});

test("verifyCitations passes a well-cited, accurately quoted step", () => {
  const out = verifyCitations(
    [{ step: "Will gave a numeric posterior.", cites: ["b1"], quote: "approximately a 1 in 300 chance" }],
    BLOCKS
  );
  assert.equal(out.verified, true);
  assert.equal(out.verified_count, 1);
});

test("verifyCitations fails a step citing a nonexistent block", () => {
  const out = verifyCitations(
    [{ step: "Invented support.", cites: ["b99"], quote: "anything" }],
    BLOCKS
  );
  assert.equal(out.verified, false);
  assert.match(out.failures[0], /no block with evidence_id 'b99'/);
});

test("verifyCitations fails a step whose quote is not in the cited block", () => {
  const out = verifyCitations(
    [{ step: "Misattributed quote.", cites: ["b2"], quote: "approximately a 1 in 300 chance" }],
    BLOCKS
  );
  assert.equal(out.verified, false);
  assert.match(out.failures[0], /quote does not appear in any cited block/);
});

test("verifyCitations fails a step that cites nothing", () => {
  const out = verifyCitations([{ step: "Trust me.", cites: [], quote: "whatever" }], BLOCKS);
  assert.equal(out.verified, false);
  assert.match(out.failures[0], /cites no evidence/);
});

test("verifyCitations accepts a real citation without a quote but marks it weak", () => {
  const out = verifyCitations([{ step: "Points at a block.", cites: ["b1"] }], BLOCKS);
  assert.equal(out.verified, true);
  assert.equal(out.steps[0].weak, true);
  assert.equal(out.weak_count, 1);
});

test("reasoning that never quotes anything is verified but unsubstantiated", () => {
  const out = verifyCitations(
    [{ step: "Points at a block.", cites: ["b1"] }, { step: "And another.", cites: ["b2"] }],
    BLOCKS
  );
  assert.equal(out.verified, true);
  assert.equal(out.all_weak, true);
  assert.equal(resolveVerdict(out, null), "unsubstantiated");
});

test("one real quote is enough to lift reasoning out of unsubstantiated", () => {
  const out = verifyCitations(
    [
      { step: "Points at a block.", cites: ["b1"] },
      { step: "Quotes one.", cites: ["b1"], quote: "approximately a 1 in 300 chance" },
    ],
    BLOCKS
  );
  assert.equal(out.all_weak, false);
  const clean = { challenges: [{ route: "mechanical", lineage_id: "deterministic", verdict: "sound" }] };
  assert.equal(resolveVerdict(out, clean), "verified");
});

// The old rule passed a step if any single citation checked out, which let a
// fabricated block id ride along beside a real one. Citing something that does
// not exist is the failure this whole protocol is for.
test("verifyCitations fails a step that cites a nonexistent block alongside a real one", () => {
  const out = verifyCitations(
    [{ step: "Mixed citations.", cites: ["b99", "b1"], quote: "approximately a 1 in 300 chance" }],
    BLOCKS
  );
  assert.equal(out.verified, false);
  assert.match(out.failures[0], /no block with evidence_id 'b99'/);
});

test("verifyCitations locates a quote across several cited blocks", () => {
  const out = verifyCitations(
    [{ step: "Two cites, one quote.", cites: ["b1", "b2"], quote: "approximately a 1 in 300 chance" }],
    BLOCKS
  );
  assert.equal(out.verified, true);
  assert.ok(out.steps[0].checks.some((c) => c.ok && c.reason === "quote located in b1"));
});

test("verifyCitations treats an empty reasoning array as unverified", () => {
  const out = verifyCitations([], BLOCKS);
  assert.equal(out.verified, false);
  assert.equal(out.total, 0);
});

test("extractJson reads a fenced JSON block", () => {
  assert.deepEqual(extractJson('here you go:\n```json\n{"a":1}\n```'), { a: 1 });
});

test("extractJson reads bare JSON surrounded by prose", () => {
  assert.deepEqual(extractJson('Sure. {"a": [1,2]} Hope that helps.'), { a: [1, 2] });
});

test("extractJson is not fooled by braces inside strings", () => {
  assert.deepEqual(extractJson('{"a":"a } brace","b":2}'), { a: "a } brace", b: 2 });
});

test("extractJson returns null on unusable input", () => {
  assert.equal(extractJson("no json at all"), null);
  assert.equal(extractJson('{"broken": '), null);
  assert.equal(extractJson(""), null);
});

test("resolveVerdict gates hard on mechanical verification", () => {
  const failed = { verified: false };
  assert.equal(resolveVerdict(failed, { verdict: "sound" }), "unverified");
});

test("resolveVerdict escalates on a serious challenge", () => {
  const ok = { verified: true };
  assert.equal(resolveVerdict(ok, { verdict: "unsupported" }), "contested");
  assert.equal(resolveVerdict(ok, { verdict: "overstated", severity: "high" }), "contested");
  assert.equal(resolveVerdict(ok, { verdict: "overstated", severity: "low" }), "verified_with_caveat");
  assert.equal(resolveVerdict(ok, { verdict: "sound" }), "verified");
});

// Regression: resolveVerdict used to fall through to "verified" whenever the
// challenge was absent, so a challenge call that timed out scored exactly the
// same as one that ran and found nothing wrong.
test("an unrun challenge is not a passed challenge", () => {
  const ok = { verified: true };
  assert.equal(resolveVerdict(ok, null), "verified_unchallenged");
  assert.equal(resolveVerdict(ok, []), "verified_unchallenged");
  assert.equal(resolveVerdict(ok, { challenges: [] }), "verified_unchallenged");
});

// An unparseable challenger reply has no verdict, so it is not a review.
test("an unparseable challenger response does not count as a challenge", () => {
  const ok = { verified: true };
  assert.equal(resolveVerdict(ok, { raw: "I think, hmm, maybe?" }), "verified_unchallenged");
});

test("verification failure still overrides everything in the panel", () => {
  const failed = { verified: false };
  const panel = { challenges: [{ route: "mechanical", lineage_id: "deterministic", verdict: "sound" }] };
  assert.equal(resolveVerdict(failed, panel), "unverified");
});

test("two objecting lineages contest; two objections from one lineage do not", () => {
  const ok = { verified: true };

  const twoLineages = {
    challenges: [
      { route: "mechanical", lineage_id: "deterministic", verdict: "overstated", severity: "low" },
      { route: "cross_lineage_model", lineage_id: "qwen-2.5", verdict: "overstated", severity: "low" },
    ],
  };
  assert.equal(resolveVerdict(ok, twoLineages), "contested");

  // Same lineage twice is one voice repeated — the tool's own thesis, applied
  // to the tool. Two low-severity objections from one lineage stay a caveat.
  const oneLineage = {
    challenges: [
      { route: "blind_same_lineage_model", lineage_id: "llama-3.1", verdict: "overstated", severity: "low" },
      { route: "blind_same_lineage_model", lineage_id: "llama-3.1", verdict: "overstated", severity: "low" },
    ],
  };
  assert.equal(resolveVerdict(ok, oneLineage), "verified_with_caveat");
});

test("a clean panel verifies, and a pending human verdict is not an objection", () => {
  const ok = { verified: true };
  const panel = {
    challenges: [
      { route: "mechanical", lineage_id: "deterministic", verdict: "sound", severity: "low" },
      { route: "cross_lineage_model", lineage_id: "qwen-2.5", verdict: "sound", severity: "low" },
      { route: "human", lineage_id: "human", verdict: null },
    ],
  };
  assert.equal(resolveVerdict(ok, panel), "verified");
});

/* ---- Stage 4: the human as a challenger --------------------------------- */

const RECORD = () => ({
  job_type: "lineage",
  question: "Which blocks share a root?",
  conclusion: "b1 and b2 are not independent.",
  assumption: "Both excerpts come from the same document.",
  proposer_lineage: "llama-3.1",
  verification: { verified: true, verified_steps: 2, total_steps: 2, weak_steps: 0 },
  challenge_panel: summarizePanel(
    [
      {
        route: "mechanical",
        lineage_id: "deterministic",
        independent: true,
        verdict: "overstated",
        severity: "medium",
        objections: [
          { check: "C1", name: "coverage", severity: "low", objection: "Cites 2 of 21 blocks." },
          { check: "C3", name: "single-lineage dependency", severity: "medium", objection: "All cited blocks are one lineage." },
        ],
      },
      {
        route: "cross_lineage_model",
        model: "qwen2.5:14b",
        lineage_id: "qwen-2.5",
        independent: true,
        verdict: "sound",
        severity: "low",
      },
    ],
    "llama-3.1"
  ),
  verdict: "verified_with_caveat",
  human_decision: null,
});

test("isSubstantive distinguishes engagement from clicking through", () => {
  assert.equal(isSubstantive(null), false);
  assert.equal(isSubstantive({ decision: "accepted" }), false);
  assert.equal(isSubstantive({ decision: "accepted", assumption: "accept" }), true);
  assert.equal(isSubstantive({ strongest_objection: "C3" }), true);
  // A one-word throwaway is not a position.
  assert.equal(isSubstantive({ what_would_change_my_mind: "idk" }), false);
  assert.equal(isSubstantive({ what_would_change_my_mind: "A second independent cohort." }), true);
});

test("the human is the only lineage that is not a model", () => {
  const c = humanChallengeFrom({ assumption: "accept" });
  assert.equal(c.route, "human");
  assert.equal(c.lineage_id, "human");
  assert.equal(c.independent, true);
  assert.equal(c.model, null);
  assert.equal(c.verdict, "sound");
});

test("rejecting the load-bearing assumption is not a caveat", () => {
  const c = humanChallengeFrom({ assumption: "reject" });
  assert.equal(c.verdict, "unsupported");
  assert.equal(c.severity, "high");
  assert.equal(c.objections[0].check, "H1");
});

test("unsure about the assumption registers as a mild objection", () => {
  const c = humanChallengeFrom({ assumption: "unsure" });
  assert.equal(c.verdict, "overstated");
  assert.equal(c.severity, "low");
});

test("endorsing an objection inherits that objection's severity and text", () => {
  const panel = RECORD().challenge_panel.challenges;
  const c = humanChallengeFrom({ assumption: "accept", strongest_objection: "C3" }, panel);
  assert.equal(c.verdict, "overstated");
  assert.equal(c.severity, "medium");
  assert.match(c.strongest_objection, /All cited blocks are one lineage/);
  assert.equal(c.endorsed_objection, "C3");
});

test("endorsing nothing while accepting the assumption raises no objection", () => {
  const c = humanChallengeFrom({ assumption: "accept", strongest_objection: "none" });
  assert.equal(c.verdict, "sound");
  assert.deepEqual(c.objections, []);
});

// The payoff that makes the gate an offer rather than a toll.
test("a substantive human position is the only route to grade strong", () => {
  const before = RECORD();
  assert.equal(before.challenge_panel.independence_grade, "moderate");

  const after = recordHumanPosition(before, {
    decision: "accepted",
    assumption: "accept",
    strongest_objection: "none",
  });
  assert.equal(after.challenge_panel.independence_grade, "strong");
  assert.equal(after.challenge_panel.lineages, 3);
  assert.equal(after.human_engaged, true);
});

test("clicking accept without engaging leaves the grade where it was", () => {
  const after = recordHumanPosition(RECORD(), { decision: "accepted" });
  assert.equal(after.challenge_panel.independence_grade, "moderate");
  assert.equal(after.human_engaged, false);
  assert.equal(after.human_position, null);
  // The decision is still recorded — it just does not buy independence.
  assert.equal(after.human_decision, "accepted");
  assert.equal(after.challenge_panel.challenges.some((c) => c.route === "human"), false);
});

test("a human objection plus a mechanical objection contests the conclusion", () => {
  const after = recordHumanPosition(RECORD(), {
    decision: "rejected",
    assumption: "reject",
  });
  // Two independent lineages objecting, one of them at high severity.
  assert.equal(after.verdict, "contested");
  assert.equal(after.human_decision, "rejected");
});

// Disposition and verdict are separate on purpose.
test("a human may accept a contested conclusion and the record shows both", () => {
  const contested = recordHumanPosition(RECORD(), {
    decision: "accepted",
    assumption: "reject",
  });
  assert.equal(contested.verdict, "contested");
  assert.equal(contested.human_decision, "accepted");
  assert.equal(contested.human_engaged, true);
});

test("recording a position twice replaces it rather than stacking humans", () => {
  const once = recordHumanPosition(RECORD(), { decision: "accepted", assumption: "accept" });
  const twice = recordHumanPosition(once, { decision: "rejected", assumption: "reject" });
  const humans = twice.challenge_panel.challenges.filter((c) => c.route === "human");
  assert.equal(humans.length, 1);
  assert.equal(humans[0].verdict, "unsupported");
  assert.equal(twice.challenge_panel.lineages, 3);
});

test("recordHumanPosition does not mutate the record it was given", () => {
  const before = RECORD();
  const snapshot = JSON.stringify(before);
  recordHumanPosition(before, { decision: "accepted", assumption: "reject" });
  assert.equal(JSON.stringify(before), snapshot);
});

test("a human position cannot rescue failed citation verification", () => {
  const rec = { ...RECORD(), verification: { verified: false } };
  const after = recordHumanPosition(rec, { decision: "accepted", assumption: "accept" });
  assert.equal(after.verdict, "unverified");
  // Their engagement still counts toward independence, it just does not launder the work.
  assert.equal(after.challenge_panel.independence_grade, "strong");
});

test("formatAdjudication marks failing steps visibly", () => {
  const record = {
    job_type: "lineage",
    question: "Do these share a root?",
    verdict: "unverified",
    conclusion: "They do.",
    assumption: "Both discuss the same debate.",
    reasoning: verifyCitations(
      [{ step: "Bad step.", cites: ["b99"], quote: "nope" }],
      BLOCKS
    ).steps,
    verification: { verified_steps: 0, total_steps: 1 },
    challenge: null,
  };
  const text = formatAdjudication(record);
  assert.match(text, /UNVERIFIED/);
  assert.match(text, /FAIL — step 1/);
  assert.match(text, /Nothing has been written to the corpus/);
});

test("normalizePanel accepts a panel, a bare challenge, an array, or nothing", () => {
  const c = { route: "mechanical", lineage_id: "deterministic", verdict: "sound" };
  assert.equal(normalizePanel({ challenges: [c] }).length, 1);
  assert.equal(normalizePanel([c]).length, 1);
  assert.equal(normalizePanel(c).length, 1);
  assert.equal(normalizePanel(null).length, 0);
});

test("summarizePanel counts calls as documents and weights as lineages", () => {
  const panel = summarizePanel(
    [
      { route: "mechanical", lineage_id: "deterministic", independent: true, verdict: "sound" },
      { route: "blind_same_lineage_model", lineage_id: "llama-3.1", independent: false, verdict: "sound" },
    ],
    "llama-3.1"
  );
  assert.equal(panel.documents, 2);
  assert.equal(panel.lineages, 2);
  // Two challenges, but the model one is correlated, so only one counts.
  assert.equal(panel.independent_lineages, 1);
  assert.equal(panel.independence_grade, "weak");
});

test("the grade is a count of independent lineages, not a checklist of types", () => {
  assert.equal(gradeForCount(0), "none");
  assert.equal(gradeForCount(1), "weak");
  assert.equal(gradeForCount(2), "moderate");
  assert.equal(gradeForCount(3), "strong");
  assert.equal(gradeForCount(9), "strong");
});

test("summarizePanel grades moderate with mechanical plus a distinct model lineage", () => {
  const challenges = [
    { route: "mechanical", lineage_id: "deterministic", independent: true, verdict: "sound" },
    { route: "cross_lineage_model", lineage_id: "qwen-2.5", independent: true, verdict: "sound" },
  ];
  const panel = summarizePanel(challenges, "llama-3.1");
  assert.equal(panel.independence_grade, "moderate");
  assert.equal(panel.has_human, false);
  assert.equal(panel.grade_with_your_position, "strong");
});

// A single-model machine must still be able to reward engagement. Promising
// `strong` there would be a lie, so the panel states the real payoff.
test("the offered payoff is honest on a machine with only one model", () => {
  const panel = summarizePanel(
    [{ route: "mechanical", lineage_id: "deterministic", independent: true, verdict: "sound" }],
    "llama-3.1"
  );
  assert.equal(panel.independence_grade, "weak");
  assert.equal(panel.grade_with_your_position, "moderate");
});

test("once the human is on the panel there is no further payoff to offer", () => {
  const panel = summarizePanel(
    [
      { route: "mechanical", lineage_id: "deterministic", independent: true, verdict: "sound" },
      { route: "human", lineage_id: "human", independent: true, verdict: "sound" },
    ],
    "llama-3.1"
  );
  assert.equal(panel.has_human, true);
  assert.equal(panel.grade_with_your_position, null);
  assert.equal(panel.independence_grade, "moderate");
});

test("summarizePanel refuses to credit an unverified model lineage", () => {
  const panel = summarizePanel(
    [
      { route: "mechanical", lineage_id: "deterministic", independent: true, verdict: "sound" },
      // Different lineage id, but provenance unverified, so independent=false.
      { route: "cross_lineage_model", lineage_id: "unverified-mystery", independent: false, verdict: "sound" },
    ],
    "llama-3.1"
  );
  assert.equal(panel.independence_grade, "weak");
});

test("summarizePanel always names the unresolvable level", () => {
  const panel = summarizePanel([], "llama-3.1");
  assert.equal(panel.independence_grade, "none");
  assert.match(panel.unresolvable, /pretraining/i);
});

test("formatAdjudication shows the panel grade and labels correlated challenges", () => {
  const text = formatAdjudication({
    job_type: "lineage",
    question: "How many independent sources?",
    verdict: "verified_with_caveat",
    conclusion: "Three.",
    reasoning: [],
    verification: { verified_steps: 1, total_steps: 1, weak_steps: 0 },
    challenge_panel: summarizePanel(
      [
        {
          route: "mechanical",
          lineage_id: "deterministic",
          independent: true,
          verdict: "overstated",
          severity: "medium",
          strongest_objection: "Every cited block traces to one lineage.",
          objections: [
            { check: "C3", name: "single-lineage dependency", severity: "medium", objection: "One lineage only." },
          ],
        },
        {
          route: "blind_same_lineage_model",
          model: "llama3.1:8b",
          lineage_id: "llama-3.1",
          independent: false,
          verdict: "sound",
          severity: "low",
          independence_note: "Shares weight lineage 'llama-3.1' with the proposer.",
        },
      ],
      "llama-3.1"
    ),
  });
  assert.match(text, /independence: WEAK/);
  assert.match(text, /\[INDEPENDENT\] mechanical/);
  assert.match(text, /\[CORRELATED\] blind_same_lineage_model/);
  assert.match(text, /C3 single-lineage dependency/);
  // Both routes up are offered: the human's position, or a second model lineage.
  assert.match(text, /record your own/);
  assert.match(text, /→ moderate/);
  assert.match(text, /different weight lineage/);
});

test("formatAdjudication reports a recorded human position", () => {
  const base = {
    job_type: "lineage",
    question: "q",
    conclusion: "c",
    proposer_lineage: "llama-3.1",
    verification: { verified: true, verified_steps: 1, total_steps: 1, weak_steps: 0 },
    reasoning: [],
    challenge_panel: summarizePanel(
      [{ route: "mechanical", lineage_id: "deterministic", independent: true, verdict: "sound" }],
      "llama-3.1"
    ),
  };
  const after = recordHumanPosition(base, {
    decision: "accepted",
    assumption: "accept",
    what_would_change_my_mind: "A second independent cohort reaching the same number.",
  });
  const text = formatAdjudication(after);
  assert.match(text, /ACCEPTED by you/);
  assert.match(text, /own lineage/);
  assert.match(text, /second independent cohort/);
  // The offer is gone once it has been taken.
  assert.equal(/record your own/.test(text), false);
});

test("formatAdjudication surfaces a failed model challenge instead of hiding it", () => {
  const text = formatAdjudication({
    job_type: "gap",
    question: "q",
    verdict: "verified_unchallenged",
    conclusion: "c",
    reasoning: [],
    verification: { verified_steps: 1, total_steps: 1, weak_steps: 0 },
    challenge_error: "LLM timed out after 300s",
  });
  assert.match(text, /Model challenge failed: LLM timed out/);
});

test("formatAdjudication reports an unparseable proposal without throwing", () => {
  const text = formatAdjudication({
    job_type: "alias",
    question: "q",
    verdict: "unparseable",
    error: "proposer did not return usable JSON",
  });
  assert.match(text, /did not return usable output/);
});
