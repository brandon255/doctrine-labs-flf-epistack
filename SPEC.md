# Counting Sources Honestly

**A methodology for provenance genealogy and audited model judgment in epistemic investigation.**

Doctrine Labs · Brandon Flores · August 2026
Submitted to the Future of Life Foundation.

---

## Start here

If you have five minutes:

```bash
git clone <repo> && cd doctrine-labs-flf-epistack
node scripts/epistemic-run.js covid
```

No install, no dependencies, no API key. Node 20+ and nothing else. Read the
`## Assessment (auto)` block at the top of the output.

If you have fifteen, add:

```bash
npm test                                    # 188 tests, no network
node scripts/adjudicate-run.js eggs crux    # requires Ollama; local model only
```

The most informative single file is `src/epistemic/genealogy.js`. The most
interesting idea is in §3. The most interesting failure is in §1.

---

## 1. The failure that produced this

We built a tool to detect correlated evidence being treated as independent. We ran
it on our own COVID corpus. It reported **19 independent sources**.

There are three.

Judge Will's 27-page decision had been entered as three separate sources, because
three excerpts had been pulled from it and each excerpt was given its own source
identifier. Michael Weissman's single Substack post had become four sources. Scott
Alexander's post, three. Rootclaim's blog, three. The corpus was not lying about
any individual fact. Every excerpt was accurate, correctly quoted, and correctly
attributed to a real document. The corpus was lying about *how many times the world
had been observed*, which is the only number that determines how much the evidence
should move you.

The error was not exotic. It is what happens by default when you build an evidence
base one quotation at a time, which is how everyone builds one — including LLM
pipelines, which are especially good at producing many well-attributed excerpts and
have no mechanism for noticing that forty citations are eight documents.

This document specifies the workflow we built in response, and is candid about
which parts of it are solid and which are scaffolding.

**The claim:** independence is the load-bearing quantity in evidence assessment,
it is routinely overcounted by a large factor, the overcount is mechanically
detectable, and the detection can be made auditable rather than asserted.

---

## 2. Scope, and what this is not

This addresses one bullet from the assessment layer of your brief — *"flag correlated
evidence being treated as independent"* — in depth, plus a general protocol for how
model judgments enter the stack at all.

It does **not** adjudicate COVID origins, LHC safety, or whether eggs are good for
you. On COVID it deliberately holds no position. The tool's output is a statement
about the *structure of the evidence base*, not about the world.

We think that restraint is load-bearing rather than modest. A tool that tells you
how much independent evidence exists is useful to people who disagree with each
other. A tool that tells you the answer is only useful to people who already agree
with it.

---

## 3. The three-level model

The central design decision. Independence is not one question but three, and
tooling that collapses them will overcount every time.

| Level | Unit | Identity key | What you miss if you stop here |
|---|---|---|---|
| **1 — claim** | one excerpt | `evidence_id` | Every quotation counts as a source |
| **2 — document** | one bibliographic unit | `document_id` | Two judges watching one debate look like two witnesses |
| **3 — lineage** | one generative event or observation set | `lineage_id` | — |

**We report level 3 as the headline.** Levels 1 and 2 are always shown as drill-down,
because the gap between them is itself informative, but the number that leads is the
most conservative one available.

That choice has a cost, discussed in §7. The reason it wins: the failure mode we are
trying to prevent is unearned confidence. Every intermediate count produces exactly
that failure. A tool whose errors are biased toward *understating* how much you know
is safe to hand to someone who disagrees with you.

### Deriving the levels

Level 2 is close to mechanical. A document is identified by its canonical URL, which
is usually already sitting in the provenance metadata. `documentIdFromUrl()` reduces
a URL to a stable, legible id and **refuses** to derive from link shorteners, which
carry no identity — those require an explicit registry entry rather than a guess.

Level 3 is a judgment. It is declared by a human in a per-case `source_registry.json`,
which also records author, date, medium, and the relationship each document has to its
lineage (`judge`, `participant`, `observer`, `independent_analysis`, `derivative_summary`).
The registry never auto-merges: a document with no declared lineage becomes its own
lineage. **Over-collapsing fakes independence in the opposite direction**, and we would
rather report too many lineages than silently fuse two genuinely separate observations.

### Declared derivation

Separately from lineage grouping, the registry records when one document's reasoning
is explicitly built on another's. These are found by reading, and each carries the
text that justifies it.

The clearest example is in Judge Will's decision, in his own words:

> "In my Bayesian analysis, **modeled after Michael Weissman's analysis** I concluded
> P0(LL) / P0(ZO) = 1.7E-3."

Will and Weissman reach opposite conclusions — Will lands at roughly 1-in-300 against
lab leak, Weissman lands in favour of it. Both used the same framework. That makes
their disagreement far more informative than it first appears, because the method is
held constant and the divergence must live entirely in the inputs. A reader who counts
them as two independent analyses learns the wrong lesson from their disagreement.

---

## 4. The adjudication protocol

The second design decision, and the one we would most like feedback on.

We wanted LLM judgment in the loop — for proposing lineage links, finding cruxes,
spotting gaps — without asking anyone to trust an unexplained model output. The usual
answers are unsatisfying. "Human reviews everything" doesn't scale, and your criteria
correctly penalise bottlenecking on a hand-designed human step. "Trust the model with
a confidence score" is not auditable. "Ask the model to show its reasoning" produces
plausible narration that may have nothing to do with what drove the output.

Our protocol has four stages.

**1. Propose.** The model returns a conclusion plus discrete reasoning steps. Each step
must cite specific `evidence_id` values and quote the text it relies on.

**2. Verify — deterministic, no model involved.** Every cited id must resolve to a real
block; one fabricated id fails the step even if its siblings are genuine. The quoted
text must then actually appear in one of those blocks. Quotes are normalised for case,
whitespace and smart punctuation; ellipsis is permitted but fragments must appear *in
order*, so an elided quote cannot silently reorder a source. A judgment with any failing
step is marked `unverified` regardless of how good the conclusion sounds.

A step carries one quote but may cite several blocks, so the quote is checked against
the cited set rather than against each block in turn — otherwise a correct quote would
be scored as failing everywhere it does not appear, which is most places.

There is a third state. A step can cite real blocks and quote nothing, which is not
fabrication but is not shown work either. Those steps are marked `weak`, and reasoning
where *every* step is weak resolves to `unsubstantiated` rather than `verified`. Without
that rule a model could earn a clean verdict by pointing at evidence and never saying
what in it supports the claim.

This stage is the whole point. Shown work that cannot be checked is decoration. Because
verification is pure and deterministic, it is also fully unit-tested without a model
running.

**3. Challenge — blind.** A second call sees the conclusion and the corpus but **not the
original reasoning**, and is asked to build the strongest honest case against. The
blindness is deliberate: a model shown its own reasoning defends it, which is the known
failure of self-critique. A model shown only a claim has to attack it. The challenger is
explicitly permitted to return `sound` and is told not to manufacture objections.

**4. Resolve.** The human accepts, overrides, or reruns. Verification is a hard gate —
a strong challenge can downgrade a verified conclusion, but no challenge can rescue one
that failed verification.

### It works, including when it shouldn't let something through

The first live run on COVID returned **UNVERIFIED** on a conclusion that was *correct*.
The model had identified two blocks that genuinely do share a source, but cited a
`document_id` where an `evidence_id` was required. The verifier rejected it. We fixed
the prompt to list citable ids explicitly; the rerun passed 2/2 with the same conclusion.

We consider the initial rejection the more important result. A right answer with
unverifiable work does not pass, and that property is what makes the audit worth
anything.

On the eggs case, the blind challenger connected the Lesser industry-funding study to
the Zhong pooled cohort analysis — an objection crossing two lineages that no human had
encoded. That is the protocol earning its cost.

---

## 5. The workflow, end to end

Human steps marked **[H]**. Everything else runs unattended.

1. **Collect** source documents for a sub-question. **[H]** — currently entirely manual.
   This is the least developed part of the system (§8).
2. **Excerpt** into evidence blocks: a claim, a verbatim excerpt, a source, provenance
   context including the URL, and a confidence label. **[H]** today.
3. **Resolve identity.** `node scripts/migrate-source-identity.js <case>` derives
   document ids from URLs and reports anything it cannot resolve rather than guessing.
4. **Declare lineage** in `source_registry.json`: which documents draw on the same
   underlying event, what role each plays, and which explicitly derive from which. **[H]**
   — the core judgment call, and deliberately human.
5. **Run genealogy.** `node scripts/epistemic-run.js <case>` produces the three-level
   count, the correlation edges, and a committed markdown artifact.
6. **Adjudicate.** `node scripts/adjudicate-run.js <case> <job>` runs an assessment job
   through the protocol in §4.
7. **Accept, override, or rerun.** **[H]** — logged to `steering_log.jsonl`.

### Where a second person picks up

Everything a later investigator needs to disagree with us lives in two files.
`source_registry.json` holds every lineage judgment with its stated basis;
`evidence_blocks.json` holds the excerpts. Someone who thinks Judge Will and Judge Eric
*should* count as independent edits one field and reruns. Their number changes, our
reasoning stays legible, and the disagreement is now located at a specific line rather
than a vibe.

### Path to hands-free

Steps 3, 5 and 6 are already unattended. Step 4 is the human core, and the adjudication
protocol is how it stops being a bottleneck: the model proposes lineage groupings with
verified citations and a blind challenge attached, and the human's job shifts from
authoring to reviewing — or to skipping review where they don't care, with the reasoning
still on record. Steps 1 and 2 are not automated and we do not claim they are.

---

## 6. Demonstrated across three cases

Your three cases have deliberately different shapes, and the model reads them
differently. This is the strongest evidence we have that it generalises.

| Case | Excerpts | Documents | Lineages | Inflation | Declared derivations |
|---|---|---|---|---|---|
| COVID | 21 | 8 | 3 | **7x** | 4 |
| LHC | 9 | 5 | 3 | **3x** | 3 |
| Eggs | 9 | 5 | 5 | **1.8x** | 0 |

**The inflation factor characterises the epistemic shape of a dispute.**

**COVID — 7x, dense discourse orbiting one event.** Sixteen of twenty-one excerpts trace
to the Wilf–Miller debate. Two judges, one losing participant writing twice, one observer
review, and a framing document all take the same fifteen hours as input. Three of the
four derivation edges point at Scott Alexander's write-up, which makes that single blog
post a hub the corpus is quietly dependent on. Separately, three different blocks report
the "23 orders of magnitude" figure; all three trace to one collection of estimates
gathered in that same post. A reader who saw three citations would reasonably think the
figure had been independently confirmed.

**LHC — 3x, a dependency chain to one assessment.** All three derivation edges converge
on the 2008 LSAG report. CERN's public safety page summarises it; the competition brief
summarises CERN's page; even Plaga's critique takes it as the thing being critiqued. The
public reassurance is real, but it is one assessment with a long shadow rather than many
converging assessments. For a question people treat as settled, that is the useful thing
to know, and it points precisely at where scrutiny would pay.

**Eggs — 1.8x, genuinely distributed.** Zero declared derivations. Five documents, five
lineages: a pooled cohort analysis, a guidelines report, and a methodological study on
funding bias that bears on how to weight the others. The one correlation the tool does
catch is that three headline claims all come from the single Zhong 2019 study. Notably,
a human analyst had already written that observation into a note in this corpus by hand
— the tool now finds it structurally instead of relying on someone noticing.

That the three numbers differ this much, and differ in ways that match each case's
character, is the argument that we're measuring something real rather than an artifact
of our curation.

### Does the scaffolding actually do anything?

Comparing against an off-the-shelf deep research tool would tell us mostly about model
size. So the baseline is the *same* `llama3.1:8b`, given the *same* excerpts, asked how
many independent sources support them — with no document identity, no registry, and no
adjudication. Whatever gap appears belongs to the method rather than the model.

| Case | Excerpts given | Unscaffolded | This stack |
|---|---|---|---|
| COVID | 21 | 7 | **3** |
| LHC | 9 | 6 | **3** |
| Eggs | 9 | 7 | **5** |

It overcounted every time. Not catastrophically — it clearly did some grouping on its
own, reaching 7 rather than 21 on COVID — but consistently, and in the same direction.

The reason matters more than the numbers. The unscaffolded model cannot tell that three
excerpts are one PDF, because that fact is not in the text it was shown. It lives in
source metadata. This is an input failure rather than a reasoning failure, and no amount
of model scale fixes it — a smarter model reading the same excerpts still cannot see a
document boundary that was never in its context.

Full runs and the model's own justifications: `docs/validation/BASELINE_COMPARISON.md`.

---

## 7. Design decisions and their costs

The tradeoffs, stated plainly.

**Reporting the most conservative count.** Cost: we will sometimes understate genuine
independence. Two judges reasoning separately on shared input are not *zero* additional
evidence, and our headline treats them as one lineage. We accept this because the
drill-down is always visible and because errors toward under-confidence are the safe
direction. **We are not certain this is right.** An alternative that reports a range
rather than a point estimate may be better, and we would welcome your view.

**Human-declared lineage.** Cost: it does not scale without a person, which is our
weakest position against your scalability criterion. Chosen because auto-merging
observations is the one error that would make output actively dangerous — it manufactures
the exact false independence the tool exists to detect, in reverse. The adjudication
protocol is the mitigation, not a full answer.

**Mechanical citation verification.** Cost: strictness. A model that paraphrases
accurately fails a step that a human reviewer would pass. We took the false-negative
tradeoff deliberately; a verifier that accepts paraphrase cannot distinguish accurate
paraphrase from confabulation.

**Blind challenge.** Cost: a challenger without the reasoning sometimes attacks a point
that was already addressed, producing noise. We judged that better than a challenger
that rationalises.

**Local-only models.** Enforced in code — a non-local endpoint is refused, not warned
about. Cost: quality is capped by what runs on the user's machine. Chosen because an
epistemic tool that ships your evidence base to a third party has an unexamined trust
dependency at its centre.

**Zero runtime dependencies.** Node built-ins only. Cost: we wrote our own JSON
extraction and quote matching. Chosen so that "clone and run" survives contact with a
judge's machine and with time.

---

## 8. What is not built, and what we are unsure about

### Not built

- **Automated ingestion.** Blocks are hand-curated. This is the largest gap and the one
  we would attack next.
- **Retrieval.** No search for sources bearing on a sub-question.
- **Semantic near-duplicate detection.** We catch same-root; we do not yet catch the same
  claim expressed two different ways.
- **Discourse structure.** One sub-question per case; no model of who is addressing what.
- **Confidence calibration.** Labels exist; a framework accounting for out-of-model error
  does not.

### What validation actually showed

All five jobs now run against all three cases, recorded in
`docs/validation/JOB_VALIDATION.md`. On `llama3.1:8b`, **9 of 15 runs passed** mechanical
verification: six unverified, five verified-with-caveat, four contested.

The spread is itself a result. A protocol that rubber-stamped its inputs would return one
verdict; this one returns four, and it fails its author's own tool a third of the time.

The failure breakdown matters more than the rate. **Every single failure was a
non-verbatim quote. Across all fifteen runs the model never once invented a block id and
never once cited nothing.** It wrote "the judge concluded roughly 1 in 300" where the
block says "I concluded that there is approximately a 1 in 300 chance" — substantively
right, not verbatim, and rejected.

So the honest reading is "conclusions largely sound, quoting sloppy", not "model
unreliable". We reject those runs anyway. A verifier that accepts paraphrase cannot
distinguish accurate paraphrase from convenient paraphrase, and stage 2 is only worth
having because it never has to make that judgment. The cost is real and we are paying it
in public rather than tuning the check until it passes.

A larger model quotes more faithfully, so this particular cost falls as models improve
while the guarantee stays fixed. That is the right direction for a check to age in.

### Genuine uncertainties

1. **Is lineage the right level to stop at?** There is arguably a fourth: two studies
   pooling overlapping cohorts share data without sharing an event. Zhong 2019 pools six
   prior cohorts, so even its single lineage is not a fresh observation of the world.
   We flag this in prose and do not model it.
2. **Does the inflation factor mean what we think?** We find the cross-case pattern
   compelling, but three cases is three cases.
3. **Is blind challenge better than informed challenge?** We reasoned our way here rather
   than measuring. A controlled comparison would settle it and we have not run one.
4. **Does the protocol survive a model optimised to pass it?** Verification checks that
   quotes are real, not that reasoning is honest. A sufficiently capable model could cite
   accurately in service of a bad conclusion. We think the blind challenger raises that
   cost; we cannot show it closes the hole.

### The hole we most want pointed out

`docs/FAILURE_MODES.md` catalogues eight ways this breaks, with severities. One deserves
naming here, because it is the sharpest thing an honest reader could say to us:

**The challenger used to share weights with the proposer — we found it, and fixed it.**
Both stages originally called the same model. Blinding the challenger to the reasoning
removed one correlation; it did nothing about shared priors, shared training data, or
shared blind spots. A stack whose entire thesis is *"two judges watching one debate are
not two witnesses"* was adjudicating with two calls to one model, reporting a lineage
count of two while holding one.

Stage 3 is now a **panel**, and it is graded:

- A **mechanical challenger** always runs — seven deterministic checks over the corpus and
  the proposal, no model involved, so it shares nothing with the proposer. This is the only
  challenger whose independence we can guarantee, and it needs no models installed at all.
- A **cross-lineage model challenger** is chosen automatically when one is available, via
  `models/registry.json` — the same structure as `source_registry.json`, because it is the
  same problem one level up. `hermes3` is rejected as a challenger for `llama3.1`: different
  name, different publisher, same weights.
- **The human is a third lineage**, and the only challenger in the protocol that is not a
  model — no shared weights, no shared pretraining, different substrate. Stage 4 offers
  three structural questions (do you accept the declared load-bearing assumption, which
  objection is most serious, what would change your mind) and never blocks: Accept works
  either way, at a lower grade. Anti-passivity is satisfied by choices that cannot be made
  without reading the record, rather than by demanding prose. Every question is about the
  argument's structure, never the subject matter — a tool that declines to hold a position
  on COVID origins should not extract one from its user.
- Every record reports an **`independence_grade`** — a count of independent lineages on
  the panel — so `verified` by one correlated challenger cannot be mistaken for `verified`
  by three independent ones. The verdict counts objecting **lineages** rather than
  objections.
- **`verified_unchallenged`** is now distinct from `verified`. A challenge call that times
  out used to score the same as one that ran and found nothing.

`npm run audit:self` runs this counting over the model shelf on your own machine. On ours:
8 models, 5 independent weight lineages, 1.6x inflation.

What remains, and cannot be fixed: every open model was pretrained on overlapping public
corpora that none of their publishers disclose. Distinct weight lineages is a checkable
claim. Independent minds is not, and we do not claim it. Full design and the six routes we
have not yet built: `docs/A1_CHALLENGER_INDEPENDENCE.md`.

We also red-teamed prompt injection through evidence text, since blocks carry untrusted
text straight into model context: `docs/validation/REDTEAM_INJECTION.md`. The model
resisted all three payloads, which we count as weak evidence at best. Model refusal is
not a security boundary, and nothing in the stack currently escapes or delimits evidence
text.

### Honest positioning

This was built by an industrial designer with roughly six months of software experience,
over a compressed period, using local models on a laptop. The infrastructure is real and
tested. The domain expertise is not claimed. Where this document sounds confident it is
about the code; where it concerns virology, particle physics, or nutrition, it takes no
position at all — by design.

---

## 9. Why we think this compounds

- **The artifacts are the interface.** `source_registry.json` is a bibliography with
  lineage assertions and stated reasons. It is diffable, forkable, and independently
  useful to someone who rejects our whole approach.
- **Disagreement is located, not diffused.** Every lineage judgment is one editable field
  with a written basis. Someone who disagrees changes a line and reruns.
- **The protocol is reusable.** Adding an assessment job is a question and a paragraph of
  guidance in `jobs.js`, not new plumbing. Five jobs share one audited path.
- **It scales with model quality.** Tested on `llama3.1:8b`, where the proposer is solid
  and the challenger is sometimes muddled. The protocol does not change with a better
  model; the outputs get better and the verifier stays exactly as strict.

---

## Appendix — where to look

| Concern | File |
|---|---|
| Three-level resolution | `src/epistemic/genealogy.js` |
| Document and lineage identity | `src/epistemic/source_identity.js` |
| Adjudication protocol | `src/epistemic/adjudicate.js` |
| Citation verifier (start here for §4) | `verifyCitations()` in `adjudicate.js` |
| Assessment jobs | `src/epistemic/jobs.js` |
| Lineage judgments, COVID | `docs/epistemic/covid/source_registry.json` |
| Generated artifacts | `docs/epistemic/*/RUN_OUTPUT.md` |
| Tests (69, no network) | `test/` |
| Every job on every case | `docs/validation/JOB_VALIDATION.md` |
| Baseline ablation | `docs/validation/BASELINE_COMPARISON.md` |
| Injection red team | `docs/validation/REDTEAM_INJECTION.md` |
| Where this breaks | `docs/FAILURE_MODES.md` |
| Known defects and failure modes | `docs/DEFECT_REGISTER.md` · `docs/FAILURE_MODES.md` |
