# Ship status — FLFBuild

Status of the gift build against the Future of Life Foundation competition brief.
Source of truth for scope. Update as items land.

- Competition brief: `docs/competition/FLF_COMPETITION_BRIEF.txt`
- Judging criteria: `docs/competition/FLF_JUDGING_CRITERIA.txt`

Labels: **BUILT** runnable and tested · **WIRED** runs but output not validated per case ·
**PARTIAL** structure exists, automation missing · **MISSING** not started

---

## 1. The fourteen desiderata

FLF splits the stack into ingestion, structure, and assessment. These fourteen bullets
are their spec, quoted from the brief.

### Ingestion — turning a messy evidence base into something reasonable over

| # | Desideratum | Status | Where |
|---|---|---|---|
| 1 | Extract and attribute claims to sources, with provenance metadata | PARTIAL | `source_identity.js`, `source_registry.json` — identity resolution is real and tested; text claim extraction is hand-curated; **measurement claim extraction is BUILT** via `measure.js` (re-runs the command, no human in the verify loop) |
| 2 | Identify when the same claim appears across sources in different forms | PARTIAL | `alias_proposer.js` + lineage model catch same-root; semantic near-duplicates not yet |
| 3 | Search for resources bearing on topics and subtopics | MISSING | No retrieval layer |
| 4 | Capture metadata tags (methodology, deference, assumptions) | PARTIAL | `tags` field hand-applied; `lineage_role` automated via registry; **correlated-measurement declarations** auto-enforced by C8 |

### Structure — making the shape of the argument navigable

| # | Desideratum | Status | Where |
|---|---|---|---|
| 5 | Resolve inference structure (what supports what) | PARTIAL | `claim_graph.json` has supports/qualifies edges, hand-authored. No resolver |
| 6 | Represent discourse structure (who addresses which sub-question) | MISSING | One sub-question per case; no multi-thread model |
| 7 | Capture "similar but not identical" claims | MISSING | — |
| 8 | Track how structure evolves over time | PARTIAL | `steering_log.jsonl` records ingest and promotion events |

### Assessment — deciding what to believe

| # | Desideratum | Status | Where |
|---|---|---|---|
| 9 | Identify rhetorical moves carrying more persuasive than evidential weight | WIRED | `jobs.js` → `rhetoric` |
| 10 | **Flag correlated evidence being treated as independent** | **BUILT** | `genealogy.js` three-level model for text evidence + `measure.js` + C8 mechanical check for measurement evidence. The strongest piece |
| 11 | Identify cruxes | WIRED | `jobs.js` → `crux`. Validated once on eggs |
| 12 | Surface what's missing | WIRED | `jobs.js` → `gap` |
| 13 | Confidence calibration accounting for out-of-model error | PARTIAL | Labels exist (HIGH/MEDIUM/LOW/FLAGGED); no calibration framework |
| 14 | Distinguish settled from *performed* settling | WIRED | `jobs.js` → `settled` |

**Score: 1 BUILT · 4 WIRED · 6 PARTIAL · 3 MISSING**

---

## 2. Cross-cutting contributions (not on FLF's list)

These are ours. Both are candidates for the insight-contribution criterion.

### Three-level independence model — BUILT

Independence must be counted at the level of underlying observations, not citations.

| Level | Unit | Failure if you stop here |
|---|---|---|
| 1 claim | one excerpt | Counts every quote as a source |
| 2 document | one bibliographic unit | Two judges watching one debate look independent |
| 3 lineage | one generative event | — headline count |

Live numbers:

| Case | Excerpts | Documents | Lineages | Inflation |
|---|---|---|---|---|
| COVID | 21 | 8 | 3 | 7x |
| LHC | 9 | 5 | 3 | 3x |
| Eggs | 9 | 5 | 5 | 1.8x |

The inflation factor characterises the *shape* of a dispute: high means lots of
discourse orbiting one event, low means genuinely distributed evidence.

Found by running the tool on our own corpus, where it reported 19 independent
sources for COVID when there are 3. That failure is part of the submission story.

### Adjudication protocol — BUILT

Every model judgment in the stack passes four stages:

1. **Propose** — conclusion plus discrete reasoning steps, each citing evidence ids and quoting text
2. **Verify** — every citation checked mechanically against the corpus, no model in the loop
3. **Challenge** — a second call sees the conclusion but *not* the reasoning, and argues against it
4. **Resolve** — human accepts, overrides, or reruns; everything on the record

Stage 2 is what stops shown work from being theater. Stage 3 is blind because a model
shown its own reasoning defends it. FLF listed "a protocol" as one of three shapes they
wanted; this is one.

`src/epistemic/adjudicate.js` · `npm run adjudicate <case> <job>` · `POST /api/adjudicate`

### Measurement evidence and the recursive self case — BUILT

Evidence was text-only: a block carried a verbatim excerpt, and the verifier checked
the model's quote against it. That works for "the paper said X." It does not work for
"there are 536 tests" or "the first commit was 2026-05-31" — claims about the state of
a system, not about what a document said.

`measure.js` adds a second evidence kind. A block declares a command from a strict
read-only whitelist (`git`, `wc`, `find`, `npm test`) and a value the author claims the
command returns. The verifier re-runs the command and checks the value matches. The
adversary cannot inject a command — only lie about what a real command returned, and
the re-run catches the lie.

Four design constraints worth naming, all found by running it rather than by reasoning
about it:

- **Blocks name a root, never a path.** A claim about another repository has to run
  somewhere other than the case directory. Whitelisting `git -C <path>` would have let
  the block choose the directory, which is the property the module promised not to give
  it. Instead the case's `source_registry.json` declares `measurement_roots` as symbolic
  names, and a block references one. An undeclared name fails closed.
- **Comparison is all-or-nothing numeric.** The first version pulled the leading integer
  out of each side before comparing, so a declared `2026-05-31` passed against a measured
  `2026` — a date matching its own year. A verifier that reports a false pass is worse
  than no verifier, because it launders an unchecked claim as a checked one. Partial
  numeric matching is gone.
- **Extraction is named, not supplied.** Case files are JSON and cannot carry functions,
  so a block names an extractor (`line_count`, `tap_pass`, `first_line`, …) that vetted
  code implements. An evidence file able to define its own extraction logic would be a
  code-execution surface wearing a data costume.
- **Verification has three states, not two.** Found by cloning the repo to a scratch
  directory and running it as a stranger would: every measurement failed, and the two
  deliberately-false blocks were indistinguishable from the five true ones whose
  repository simply wasn't there. The demo inverted. A tool built to separate grades of
  evidential support cannot render *"I could not check this"* and *"this is false"* as
  the same red line. `unverifiable_here` is now a distinct status, prints `?` rather than
  `!`, gets its own section in the record, and is raised by C8 as its own objection —
  while still never counting as verified, because unchecked is not confirmed. Two
  supporting fixes came with it: the `$REPO` root token, so a case can measure the
  repository it ships in and be correct on every checkout, and `EPISTACK_ROOT_<NAME>`,
  so a reader who does have an external repository can point at it without editing a
  case file that isn't theirs.

C8 (eighth mechanical check) closes the loop on the headline failure mode of multiplied
measurements: a conclusion that multiplies correlated quantities as if independent. It
catches both (a) headline numbers that appear in no cited measurement, and (b) declared
correlations in provenance (`correlated_with`) being multiplied as if fresh filters.

The recursive demo: the stack runs on its own author. `docs/epistemic/self/` carries
five real measurement blocks drawn from the production record, plus two deliberately
flawed rarity-funnel blocks. Live results:

| Block | Declared | Measured | |
|---|---|---|---|
| Core OS commits | 94 | 94 | verified |
| Core OS tests | 536 | 536 | verified |
| Core OS first commit | 2026-05-31 | 2026-05-31 | verified |
| Epistack commits | 8 | 8 | verified |
| Epistack tests | 165 | 165 | verified |
| Rarity funnel | "single digits globally" | — | **rejected** |
| Correlation companion | <1% | — | **rejected** |

The independence model also deflates the flattering reading on its own: eight excerpts
resolve to seven documents but only **four lineages**, because three Core OS
measurements read one working tree at one commit. "94 commits *and* 536 tests *and* a
May 31 start" is one observation of the world described three ways — the same error the
COVID corpus made, committed by the author about himself.

We do not ship "our tool says we're great." We ship "our tool caught our own
overstatement."

`src/epistemic/measure.js` · `src/epistemic/mechanical_challenge.js` (C8) · `docs/epistemic/self/`

---

## 3. Engineering

| Item | Status |
|---|---|
| Test suite | BUILT — 188 passing, from zero this session |
| Frozen transcripts (no-install review path) | BUILT — 25 runs captured, `docs/transcripts/` |
| Screencast | PLANNED — shot list written, `docs/SCREENCAST_SCRIPT.md`; Brandon records |
| Zero runtime dependencies | BUILT — Node built-ins only |
| Local-only LLM guard | BUILT — non-local base_url refused in code |
| One-click runner (Mac + Windows) | BUILT — `RUN-EPISTACK.command` / `.bat` |
| Local server | BUILT — `127.0.0.1:4318`, zero-dep |
| Portable artifacts | BUILT — `RUN_OUTPUT.md` committed, path-relative |
| Deterministic output | BUILT — tested for run-to-run stability |
| Measurement evidence (BYOC) | BUILT — `measure.js`, C8 check, self case as recursive demo |

---

## 4. Remaining to ship

Ordered by leverage against the judging criteria.

### Blocking

| # | Item | Status |
|---|---|---|
| S1 | **Methodology spec (≤10 pages)** | **DONE** — `SPEC.md`, ~5 pages. Judges' note: *"Read for the spec, not the polish"* |
| S2 | **Baseline comparison** | **DONE** — `docs/validation/BASELINE_COMPARISON.md`. Ablation against the same model without scaffolding; it overcounted 3/3 |
| S3 | **Validate the four WIRED jobs** across all three cases | **DONE** — `docs/validation/JOB_VALIDATION.md`, 15 runs, every job × every case |
| S4 | **README rewrite** | **DONE** — rewritten for the three-level model and the adjudication protocol |

### High value

| # | Item | Status |
|---|---|---|
| S5 | **UI navigability pass** | Partial — adjudication panel landed; guided tour and first-run orientation still open |
| S6 | **Corpus depth** | Not done. 21/9/9 blocks, one sub-question per case. Thin for "worked example" |
| S7 | **Adversarial robustness writeup** | **DONE** — `docs/FAILURE_MODES.md`, 8 modes with severities, plus a live injection red team |
| S8 | **Retrofit alias proposer + chat onto adjudication** | Partial — UI panel wired at `POST /api/adjudicate`; the two older LLM features still bypass the protocol |

### Delivery

| # | Item | Status |
|---|---|---|
| S9 | Cover note to FLF | **DONE** — `COVER_NOTE_TO_FLF.md`, rewritten to lead with the self-caught bug |
| S10 | Public repo push | Not done |
| S11 | Demo URL (static fallback for judges who won't run local LLM) | Not done |
| S12 | Zip fallback | Not done |

---

## 5. Known gaps and honest caveats

Full catalogue with severities: `docs/FAILURE_MODES.md`.

- ~~**The challenger shares weights with the proposer.**~~ **FIXED 2026-08-03.** Stage 3 is now a graded panel: a deterministic mechanical challenger (7 checks, no model, guaranteed independent) plus an auto-selected cross-lineage model challenger via `models/registry.json`. Every record carries an `independence_grade`; `verified_unchallenged` is now distinct from `verified`; the verdict counts objecting lineages rather than objections. Design: `docs/A1_CHALLENGER_INDEPENDENCE.md` · evidence: `docs/validation/A1_PANEL_LIVE_RUN.md` · self-audit: `npm run audit:self`. **P5 also built:** stage 4 is now a non-blocking human anti-passivity gate — three structural questions, human recorded as a third lineage, decisions persisted to `decisions/`. Fixed a related dishonesty: stage 4 previously printed "on the record" while writing nothing. **Residue that cannot be closed:** shared pretraining corpora across all open models (level 4).
- On `llama3.1:8b` most validation runs failed mechanical verification — but every failure was non-verbatim quoting, and the model never once invented a block id. Conclusions largely sound, quoting sloppy.
- Corpora are hand-curated. Ingestion does not scale without a human, which is the weakest point against FLF's scalability criterion.
- Lineage assignment is a judgment call. Human-declared in `source_registry.json` and deliberately never auto-merged, which makes it auditable rather than trustworthy.
- Verification checks that citations are real, not that reasoning is valid. `verified` means the work shown is real, not that the conclusion follows.
- Evidence text goes into model context unescaped. Three injection payloads were resisted, but that is model refusal, not a boundary.
- The July 19 deadline has passed. This build targets the continuation-funding conversation, not the prize.
