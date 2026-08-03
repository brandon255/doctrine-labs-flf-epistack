# A1 — Challenger independence: full scope

**Drafted:** 2026-08-02 · **P0–P4 and P8 built:** 2026-08-03 · **Status: mitigated, honestly reported**

Failure mode #1 in `FAILURE_MODES.md`. Was the highest-severity unmitigated flaw.

Brandon's framing — *there is more than one way to arrive at the number 1* — is the right
one and it changed the design. The original proposal was "use a different model." That is
one route of at least seven, it is not the strongest one, and on its own it would have let us
overstate our independence in a new way rather than fix the old one.

## Build status

| Phase | What | State |
|---|---|---|
| **P0** | `verified_unchallenged` — an unrun challenge is no longer a passed one | **BUILT** |
| **P1** | `models/registry.json` + `src/epistemic/model_identity.js` + `independence_grade` | **BUILT** |
| **P2** | Mechanical challenger, checks C1–C7, zero models required | **BUILT** — `src/epistemic/mechanical_challenge.js` |
| **P3** | `challenge_panel` + lineage-aware verdict aggregation | **BUILT** — `src/epistemic/adjudicate.js` |
| **P4** | Cross-lineage model challenger, auto-selected | **BUILT** — `pickChallenger()` |
| **P5** | Human anti-passivity gate — the human as a third lineage | **BUILT** — `recordHumanPosition()`, stage 4 UI, `decisions/` |
| **P8** | Self-audit of our own model shelf | **BUILT** — `npm run audit:self` |
| P6 | Evidence holdout (R3) | not built |
| P7 | Self-consistency (R6) + cross-case control (R7) | not built |

### The independence ladder

Grade is a straight count of independent lineages on the panel: `none` at zero,
`weak` at one, `moderate` at two, `strong` at three.

An earlier cut required an independent *model* before the grade could pass `weak`,
which meant a machine with a single model could never exceed `weak` no matter what the
human contributed. That undervalued the strongest challenger available — the human
shares no weights, no pretraining corpus and no substrate, where a second model still
shares an unmeasurable amount of level 4. Counting lineages fixes it and is simpler.

The panel also reports `grade_with_your_position`, so the UI states the payoff it can
actually deliver rather than promising `strong` on a machine where the honest answer
is `moderate`.

Test suite went from 69 to 119. First live run of the panel is recorded at
`docs/validation/A1_PANEL_LIVE_RUN.md` — the mechanical challenger found four structural
defects that the model challenger missed, which is the argument for P2 in one artifact.

**What "mitigated" means here, precisely.** The adjudicator now has one guaranteed-independent
challenger that shares nothing with the proposer, and picks a second challenger from a
different verified weight lineage when one is installed. Every record states which grade of
independence it actually had. What is *not* fixed, and is not fixable, is level 4 — shared
pretraining corpora. See §8.

---

## 1. The problem, stated in our own vocabulary

The stack's headline contribution is a three-level independence model: **claim → document
→ lineage**, where the honest count is lineages, because two documents drawing on one
generative event are one observation read twice.

Apply that to our own adjudicator:

| Level | In the corpus | In our adjudication |
|---|---|---|
| 1 — claim | one excerpt | one reasoning step / one objection |
| 2 — document | one PDF, one post | one model **call** — proposer, challenger |
| 3 — lineage | one underlying event | one set of **model weights** |

Stage 1 and stage 3 are two documents. They are **one lineage.** We currently report a
2 and possess a 1.

This is not an analogy. It is the same failure the tool was built to detect, committed by
the tool, and it is detectable *by the tool*. That fact turns out to be the most valuable
thing in this whole item — see §7.

### What blinding actually bought us

Stage 3 withholds the proposer's reasoning from the challenger. That is real and worth
keeping: a model shown its own argument defends it. But it removes exactly one correlation
out of many.

| Shared between proposer and challenger | Removed by blinding? |
|---|---|
| The specific argument just made | **Yes** |
| Model weights | No |
| Pretraining corpus | No |
| Tokenizer and representation geometry | No |
| Instruction-tuning and RLHF preferences | No |
| Refusal and hedging patterns | No |
| Systematic blind spots on the topic | No |

One of seven. Hence "framing mitigation, not a real one" in the current writeup.

### A second, smaller bug found while scoping this

`resolveVerdict()` in `adjudicate.js` falls through to `"verified"` when `challenge` is
null. `challenge` is null when the challenge **call threw** — a timeout, a crash, Ollama
going away mid-run. So a judgment that was never challenged at all currently receives the
same verdict as one that was challenged and survived.

That is a one-line fix (`verified_unchallenged`) and it should land regardless of which
route below you pick.

---

## 2. Independence is a gradient, not a switch

Before listing routes: the thing that makes this interesting is that **"different model"
does not mean "independent."** Your own machine proves it.

### Your shelf, run through our own framework

```
mistral:7b-instruct       4.4 GB    Mistral AI
hermes3:latest            4.7 GB    NousResearch
qwen2.5-14b-64k           9.0 GB    Alibaba, context-extended
gemma4e-64k               9.6 GB    Google, context-extended
gemma4:e4b                9.6 GB    Google
qwen2.5:14b               9.0 GB    Alibaba
llama3.1:8b               4.9 GB    Meta
```

Seven models. Pick `hermes3` as your "independent" challenger against `llama3.1` and you
have gained **nothing at the weight level.** Hermes 3 is a supervised fine-tune of Llama
3.1 8B by NousResearch — confirmed in their technical report, and confirmed locally by
`ollama show`, which reports identical architecture (`llama`), identical parameter count
(8.0B), identical context (131072), identical embedding width (4096), and — the tell —
ships it under the **Meta Llama 3 Community License**. A NousResearch model carrying
Meta's license because it is derivative.

That is a `derives_from` edge. We already have that relation in `source_registry.json` for
evidence. It applies unchanged to models.

Resolve the whole shelf:

| Model tag | Base lineage | Relation |
|---|---|---|
| `llama3.1:8b` | **llama-3.1** | base |
| `hermes3:latest` | **llama-3.1** | `derives_from` — SFT + DPO fine-tune |
| `mistral:7b-instruct` | **mistral-7b** | base |
| `qwen2.5:14b` | **qwen-2.5** | base |
| `qwen2.5-14b-64k` | **qwen-2.5** | `derives_from` — context extension |
| `gemma4:e4b` | **gemma-4** | base |
| `gemma4e-64k` | **gemma-4** | `derives_from` — context extension |

**7 documents → 4 lineages. 1.75x inflation.**

The tool run on its own model shelf reports the same shape it reports on the COVID corpus.
Nobody has to be told the framework generalizes; they can watch it.

One honest subtlety worth encoding: `ollama show` reports `mistral:7b-instruct` as
architecture `llama`. That is llama.cpp's *architecture family* label, not a weight
lineage — Mistral uses a Llama-style transformer but was pretrained independently by a
different organisation. **Architectural similarity is not derivation.** The registry has to
distinguish those or it will merge lineages that are genuinely separate, which is the
mirror-image error of the one we are fixing.

### The level we cannot resolve

Llama, Mistral, Qwen and Gemma were all pretrained on heavily overlapping public web
corpora. None of the four disclose their training data. So there is a **level 4** —
pretraining-corpus lineage — that exists, matters, and is **not resolvable with available
information.**

We should say that plainly rather than let "4 lineages" imply four independent minds. Four
distinct weight lineages is a real and checkable claim. Four independent epistemic
positions is not, and we cannot verify it. This is genuine out-of-model error, and it is
the same species of uncertainty as item A7 in the ledger.

---

## 3. The routes

Seven ways to get independence. Graded by **what they stop sharing** with the proposer.

---

### R0 — Blind to reasoning · BUILT

Challenger sees the conclusion, not the work.

- **Stops sharing:** the specific argument
- **Still shares:** weights, corpus, priors, everything else
- **Cost:** none, already paid
- **Independence:** minimal — but keep it, it composes with everything below

---

### R1 — Different weight lineage

Route stage 3 to a model from a different base lineage.

- **Stops sharing:** weights, tokenizer, instruction tuning, most blind spots
- **Still shares:** pretraining corpus overlap (level 4, unresolvable)
- **Cost:** small code. Large runtime — a second 14B model on a laptop roughly doubles an
  already slow run. You have 64 GB, so it is comfortable *for you*; it will not be for
  every recipient.
- **Independence:** moderate. Real, and honestly the most people mean by "independent"
- **Requires:** the model registry from §4, or we cannot tell `hermes3` from `mistral`

---

### R2 — Mechanical challenger · no model at all

Deterministic structural objections computed from the corpus and the proposal. **This is
the strongest route available and I do not think it is close.**

It shares *nothing* with the proposer — not weights, not corpus, not priors, not a
training process. It is the same kind of independence stage 2 already has, which is why
stage 2 is the part of this protocol that actually holds.

Concrete checks, all computable from data we already have:

| # | Check | Objection it raises |
|---|---|---|
| C1 | **Coverage** — cited K of N blocks | A corpus-wide conclusion drawn from 3 of 21 blocks |
| C2 | **Lineage span** — conclusion asserts N lineages; cited blocks span M | Asserting past the shown work. Exactly checkable, we have `lineage_id` on every block |
| C3 | **Single-lineage dependency** — all cited blocks trace to one lineage | *The tool's own core finding, applied to the tool's own reasoning* |
| C4 | **Uncited contradiction** — `qualifies` edges in `claim_graph.json` pointing at cited blocks that the reasoning never addressed | Ignored counter-evidence |
| C5 | **Confidence mismatch** — HIGH confidence on two blocks, or on all-FLAGGED blocks | Overclaiming |
| C6 | **Weak-step ratio** — already computed, currently only shown | Surface it as an objection, not a footnote |
| C7 | **Quote concentration** — every quote from one block | The shown work is one source read several ways |

- **Stops sharing:** everything
- **Cost:** medium. Pure functions, fully unit-testable, no LLM in the test suite
- **Independence:** **strong — the only genuinely independent route we can guarantee**
- **The sleeper benefit:** it runs with **zero models installed.** Every recipient gets a
  real challenger, including the static demo URL (A3). Right now a judge who won't install
  Ollama sees no adjudication at all. With R2 they see verification *and* challenge, both
  deterministic, on a web page.

C3 deserves emphasis. A conclusion about source independence, resting entirely on blocks
that all trace to one lineage, is the tool catching its own reasoning committing the error
it was built to detect. That check is four lines of code and it is the best single
argument in the whole submission.

---

### R3 — Evidence holdout · causal test

Remove the blocks the proposal leaned on hardest. Re-run the proposer. Compare.

This does not ask a second opinion. It asks whether the evidence was doing any work.

| Outcome | Reading |
|---|---|
| Conclusion unchanged, cites different real evidence | Overdetermined — genuinely robust |
| Conclusion unchanged, cites nothing new | **Came from priors, not the corpus.** The serious finding |
| Conclusion flips | Evidence was load-bearing. Healthy |
| Degrades to "insufficient evidence" | Best outcome. The model noticed |

- **Stops sharing:** nothing about the model — but it tests *reading vs reciting*, which no
  second opinion can
- **Cost:** medium code, one extra model call
- **Independence:** structural rather than perspectival. Complements R1/R2, doesn't replace
- **Note:** this is the same logic as the baseline ablation already in
  `docs/validation/BASELINE_COMPARISON.md`, turned inward. Consistent methodology, and we
  can say so.

---

### R4 — Inverted framing

Ask the same model to argue the opposite conclusion with equal effort. If it builds an
equally strong case either way, the corpus does not determine the answer.

- **Stops sharing:** nothing structural
- **Cost:** small
- **Independence:** low. But it is a good *robustness* probe and nearly free
- **Honest risk:** models are agreeable and will argue anything. May produce noise

---

### R5 — Human challenge with an anti-passivity gate

Stage 4 exists but is currently accept / override / rerun — a rubber stamp with three
buttons. The human is the one genuinely independent lineage in the entire protocol and we
are wasting them.

Make acceptance cost something: before accepting, the human states **what would change
their mind.** That answer goes on the record next to the model's.

- **Stops sharing:** everything. Different substrate entirely
- **Cost:** small — UI plus a record field
- **Independence:** **maximal**
- **Why this is the right call for us specifically:** it is already Core OS doctrine.
  `CLAUDE.md`: *"Stage advancement happens only via the engine's approve() control channel
  after an anti-passivity answer."* The epistemic stack currently does not honour the
  house rule. Gate 1 of `NORTH_STAR.md` — does this prepare the human to think better —
  and the whole "educate, don't direct" doctrine from `MISSION.md` both point here.

This is the route most aligned with what Doctrine Labs claims to be, and it is the
cheapest one on the list.

---

### R6 — Self-consistency across samples

Run the proposer N times at temperature. Measure conclusion variance.

- **Stops sharing:** nothing
- **Cost:** small code, N× runtime
- **Independence:** none — this measures *stability*, not independence
- **Worth it because:** it closes failure mode #8 (single-sample non-determinism), which is
  currently also unmitigated. Different problem, adjacent fix. Do not let it be counted as
  independence.

---

### R7 — Cross-case control

Run the same job against a case with a known-different answer. Eggs is 1.8x inflation;
COVID is 7x. A challenger that reports "highly correlated" on both is not reading.

- **Cost:** small — the cases already exist
- **Independence:** none. This is a **calibration check on the challenger itself**
- **Value:** it is how we would *prove* R1 or R2 works rather than assert it

---

## 4. Architecture

Three pieces. The first is required by everything else.

### 4.1 Model registry — `models/registry.json`

Deliberately the same shape as `source_registry.json`, because it is the same problem.

```json
{
  "hermes3": {
    "model_id": "hermes3",
    "publisher": "NousResearch",
    "lineage_id": "llama-3.1",
    "lineage_role": "fine-tune",
    "derives_from": ["llama3.1"],
    "derivation_basis": "Hermes 3 Technical Report: 'created by fine-tuning Llama 3.1 8B, 70B and 405B'. Local ollama show reports architecture llama, 8.0B, 131072 ctx, 4096 embed, under META LLAMA 3 COMMUNITY LICENSE.",
    "independence_note": "Not independent of llama3.1 at the weight level. Usable as a challenger only when nothing better is installed, and must be labelled correlated when it is."
  },
  "mistral": {
    "model_id": "mistral",
    "publisher": "Mistral AI",
    "lineage_id": "mistral-7b",
    "lineage_role": "base",
    "derives_from": [],
    "independence_note": "ollama reports architecture 'llama' — that is llama.cpp's architecture family, not derivation. Pretrained independently by a different organisation.",
    "shared_pretraining_unresolvable": true
  }
}
```

Rules, mirroring the evidence registry:

- Unknown model → **its own lineage, flagged unverified.** Never silently merged
- `derives_from` is human-declared with a cited basis, never inferred
- Every record carries the level-4 caveat so no consumer reads "4 lineages" as "4 minds"

**This is the keystone.** Without it, R1 is guesswork and we could ship `hermes3` as an
independent challenger against `llama3.1` and be wrong in exactly the way we accuse others
of being wrong.

### 4.2 Challenge panel

`challenge` (one object) becomes `challenge_panel` (many, each with provenance):

```json
{
  "challenges": [
    { "route": "mechanical",  "lineage_id": "deterministic", "verdict": "overstated",
      "severity": "medium", "objection": "All 4 cited blocks trace to lineage wilf-miller-debate-2024-02 (check C3)." },
    { "route": "cross_lineage_model", "model": "qwen2.5:14b", "lineage_id": "qwen-2.5",
      "verdict": "sound", "severity": "low" },
    { "route": "blind_same_model", "model": "llama3.1:8b", "lineage_id": "llama-3.1",
      "verdict": "sound", "severity": "low" },
    { "route": "human", "lineage_id": "human", "verdict": null,
      "what_would_change_my_mind": "<pending>" }
  ],
  "documents": 4,
  "lineages": 3,
  "inflation_factor": 1.33,
  "proposer_lineage": "llama-3.1",
  "independence_grade": "moderate",
  "unresolvable": "shared pretraining corpora across llama-3.1 and qwen-2.5 (level 4)"
}
```

Note the panel counts its own lineages, and the `blind_same_model` challenge shares
`llama-3.1` with the proposer — so it contributes a document and **no** lineage.

**Independence grade:**

| Grade | Condition |
|---|---|
| `none` | Only challenges sharing the proposer's lineage. **Today's state** |
| `weak` | A second lineage, or mechanical alone |
| `moderate` | Mechanical + at least one distinct model lineage |
| `strong` | Mechanical + distinct model lineage + human answered |

### 4.3 Verdict aggregation

Count **independent lineages of objection**, not objections. Two challenges from one
lineage agreeing is one voice repeated — which is the tool's entire thesis.

```
verification fails            → unverified          (unchanged, hard gate)
all steps weak                → unsubstantiated     (unchanged)
no challenge ran / errored    → verified_unchallenged   ← fixes the §1 bug
≥2 lineages object            → contested
1 lineage objects, high sev   → contested
1 lineage objects, low/med    → verified_with_caveat
no objections                 → verified            + independence_grade always shown
```

`verified` at grade `none` and `verified` at grade `strong` must never render identically.
Same word, different amount of evidence behind it — precisely the confusion the tool
exists to eliminate.

---

## 5. Build order

| Phase | What | Size | Why here |
|---|---|---|---|
| **P0** | `verified_unchallenged` fix | XS | Real bug, one line, independent of everything |
| **P1** | Model registry + role recording + `independence_grade` | S | Makes today's output honest with no new capability. Unblocks R1 |
| **P2** | Mechanical challenger (R2, checks C1–C7) | M | Strongest independence, only route guaranteed available, works with zero models, fully unit-testable |
| **P3** | Panel structure + lineage-aware verdict | M | Needed before more routes are meaningful |
| **P4** | Cross-lineage model challenger (R1) | S code / L runtime | Now safe, because P1 can tell derivation from independence |
| **P5** | Human anti-passivity gate (R5) | S | Maximal independence, cheapest route, best doctrine fit |
| **P6** | Evidence holdout (R3) | M | Causal test — reading vs reciting |
| **P7** | Self-consistency (R6) + cross-case control (R7) | M | Closes failure mode #8; validates that P2/P4 work |
| **P8** | Self-audit (§7) | S | Trivial once P3 exists. The memorable part |

P0–P3 is the honest core. **If we only did P0, P1, P2 and P3, the flaw would be closed** —
not because we added a second model, but because we added a genuinely independent
challenger and stopped overstating what we have.

Everything from P4 down is upside.

---

## 6. What each phase does to the cover note

Currently the cover note leads with this flaw as the thing we would most want pointed out.
That is disarming and I would not throw it away — but it changes shape as we build:

| After | The line becomes |
|---|---|
| P0–P1 | "We found we were inflating our own independence count. We now measure and report it. Grade `none` on a single-model install, and we say so." |
| P2–P3 | "The challenger that shares nothing with the proposer is the deterministic one. Model challenges are graded by weight lineage and counted the way we count evidence." |
| P4–P5 | "Proposer and challenger run on different weight lineages, and the human's independent position is on the record. Level 4 — shared pretraining — remains unresolvable and we say so." |

Every version is honest. The last one is a stronger tool; the first is a more disarming
letter. **My read: P0–P3 gives you both** — a fixed tool *and* the story of catching
yourself twice, on the corpus and then on your own adjudicator. That is a better narrative
than either "here's a flaw I didn't fix" or "here's a tool with no flaws."

---

## 7. The recursive move

Once the panel exists, an adjudication record **is** an evidence corpus:

| Corpus concept | Adjudication concept |
|---|---|
| evidence block | one challenge |
| `document_id` | the model call |
| `lineage_id` | the base weights |
| `derives_from` | fine-tune / context-extension relation |

So `resolveGenealogy()` runs on it **unchanged.** No new engine. The tool audits its own
adjudicator with the function it already ships, and emits the same report shape it emits
for COVID.

Two things fall out for free:

1. **`npm run audit:self`** — point the engine at your installed models and print the
   lineage report. On your shelf today: **7 models, 4 lineages, 1.75x inflation.** One
   command, live, on the recipient's own machine, with their own models.
2. The adjudication panel in the UI shows its own inflation factor next to the corpus's.

The argument this makes is one I do not think anyone else in that competition will make:
*we applied our method to our own method, it found a real defect, and here is the defect
and the fix.* That is not a demo. It is the method working, observed.

It also raises a question I cannot resolve and would rather put in front of FLF than
answer badly: **at what point does this recursion stop?** Who audits the auditor's
auditor? Our answer is that it stops at the human, which is why R5 matters more than its
size suggests — the human is the only lineage in the stack that is not another instance of
the thing being checked.

---

## 8. What this still will not fix

- **Level 4 is unresolvable.** Shared pretraining corpora across all open models. Not
  disclosed, not measurable. We name it; we cannot close it.
- **Mechanical checks find structural defects, not wrong ideas.** C1–C7 cannot tell you a
  conclusion is false, only that its shown work is thin. That is the same limit stage 2
  already has, honestly stated.
- **A second model is one more opinion, not truth.** Two lineages agreeing is weak
  corroboration, exactly as the tool says about two judges at one debate. The panel must
  never let agreement read as proof.
- **More routes cost runtime.** Full panel on a laptop is slow. Needs to be configurable,
  with a fast default and an opt-in thorough mode.

---

## 9. Decisions

Five of these got settled by Brandon's go-ahead on 2026-08-03 and by building. Three are
still open and are genuinely his call.

**Settled:**

1. ~~**Is P0–P3 the right definition of "closed"?**~~ **Yes** — Brandon agreed. Built, plus
   P4 and P8 because they turned out to be small once P1 existed.
2. ~~**Does the mechanical challenger outrank the second model?**~~ **Yes**, and the first
   live run settled it empirically rather than by argument: four structural objections from
   the mechanical challenger, none of which the model challenger found
   (`docs/validation/A1_PANEL_LIVE_RUN.md`).
3. ~~**Which mechanical checks matter most?**~~ All seven shipped. C3 justified itself
   immediately by catching the proposer resting a lineage-independence conclusion on one
   lineage. Cut candidates if any: C6 and C7 are the softest.
5. ~~**Ship `npm run audit:self`?**~~ **Shipped.** It names Hermes 3 as non-independent,
   which is true, verifiable, and the most persuasive thing in the repo.
6. ~~**Cover note: fix quietly, or narrate?**~~ **Narrated.** The cover note now leads the
   limitations section with finding and fixing this, rather than confessing it unfixed.

4. ~~**R5 human gate — required before accept, or optional?**~~ **Built as a
   non-blocking offer** (Brandon, 2026-08-03). Accept always works; recording a position
   is the route to a higher grade, and the UI names the grade it would actually reach.

   Two things made the friction argument mostly dissolve. First, the adjudication section
   is hidden entirely when Ollama is unreachable, so an evaluator without a model never
   reaches stage 4 — the exposed surface is one moment, for the subset who installed
   something. Second, anti-passivity does not require prose. *Which objection is most
   serious* cannot be answered without reading the objections, so two clicks satisfy the
   house rule from `CLAUDE.md` where a blank text box would mostly just stall people.

   Every question is about the **structure of the argument** — the load-bearing
   assumption, which objection bites, what would change your mind — and never about the
   subject matter. That is not only a UX choice. A tool that declines to take a position
   on COVID origins has no business extracting one from its user, and on a politically
   legible question the risk runs toward people with *strong* views declining to record
   them, not toward people having no view.

   Gate is on Accept only. Rejecting a machine conclusion is already an act of independent
   judgment; passivity only hides inside acceptance.

**Still open — your call:**

7. **Default panel on a slow machine** — mechanical only, with the model challenger opt-in?
   Right now both run by default; two calls took 60s on the dev machine, but an older
   machine could make the first click feel broken. The `mechanicalOnly` option exists and is
   not wired to any UI.
8. **P6–P7 before shipping, or leave as named roadmap?** Evidence holdout and
   self-consistency are the two remaining routes with real diagnostic value.

---

## Sources

- Hermes 3 derivation: [Hermes 3 Technical Report, NousResearch](https://nousresearch.com/wp-content/uploads/2024/08/Hermes-3-Technical-Report.pdf) — *"created by fine-tuning Llama 3.1 8B, 70B and 405B"*; SFT then DPO
- Local confirmation: `ollama show hermes3:latest` — architecture `llama`, 8.0B, 131072 ctx, 4096 embed, META LLAMA 3 COMMUNITY LICENSE
- Current implementation: `src/epistemic/adjudicate.js` (stages), `src/epistemic/llm.js` (model resolution), `src/epistemic/genealogy.js` (the engine reused in §7)
- Existing writeup: `docs/FAILURE_MODES.md` §1
