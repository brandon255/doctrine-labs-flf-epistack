# FLF Epistemic Stack — a gift

A small, runnable tool that answers one question about a pile of evidence:
**how many times was the world actually observed here?**

Not how many things were cited. Those are different numbers, and they differ by
more than people expect.

```
21 excerpts cited, drawn from 8 documents, tracing to 3 independent lineage(s).
Treat as 3 independent source(s), not 21.
```

A gift to the Future of Life Foundation.

**Instructions (three paths):** [`docs/outreach/FLF_INSTRUCTIONS.md`](docs/outreach/FLF_INSTRUCTIONS.md).

**Read the frozen transcripts first — no install required.** Every case, every job,
and the recursive self-audit are captured as readable transcripts in
[`docs/transcripts/`](docs/transcripts/). That is the primary artifact for a reviewer
who wants to see the tool think without installing anything. This README is for
someone who wants to run it themselves.

**Methodology and design rationale: [`SPEC.md`](SPEC.md).** Start there if you want
the reasoning. Start below if you want to run it.

---

## Two ways to look at it

| Path | What you see | What you install | Time |
|---|---|---|---|
| **Read the frozen transcripts** at `docs/transcripts/` | Full adjudication runs end to end — propose, verify, challenge, resolve — plus the self-audit catching the author's own overstatement | Nothing | 5 minutes |
| **Run it yourself** (below) | The same engine, against the same cases, on your machine | Node 20+ only (Ollama optional) | 30 seconds to first output |

The tool is built so the half that does the epistemic work — the three-level
independence model, citation verification, and the eight mechanical challenger
checks — runs with **zero dependencies and no model installed**. The LLM half
(propose + challenge) is optional, and is what the frozen transcripts cover for
anyone who doesn't want to pull a 5GB model.

---

## Side-by-side

Post-retrieval verification layer — not a competitor to the finders. Blanks in our
row are real. Full comparison and sources: [`docs/PRIOR_ART.md`](docs/PRIOR_ART.md).

| Capability | Elicit | Scite | Iris.ai | Scriptorium | **FLF Epistemic Stack** |
|---|---|---|---|---|---|
| Find papers | ✓ (138M) | – | ✓ | uses others | – |
| Classify citations | – | ✓ (1.2B) | – | – | – |
| Link claim → source sentence | ✓ | ✓ | ✓ | ✓ | ✓ |
| Refuse unsupported output | partial | – | – | ✓ | ✓ |
| Resolve lineage (claim/doc/observation) | – | – | – | – | ✓ |
| Report independent count, not citation count | – | – | – | – | ✓ |
| Challenger structurally independent of proposer | – | – | – | – | ✓ |
| Local-first, zero-network | – | – | – | partial | ✓ |

---

## Run it

```bash
node scripts/epistemic-run.js covid
```

Node 20+. Zero runtime dependencies, no install step, no API key, no network.

```bash
npm run epistemic:all   # all three cases
npm test                # 188 tests, no network
npm start               # local UI at http://127.0.0.1:4318
npm run audit:self      # the same counting, applied to our own adjudicator
```

`audit:self` is worth thirty seconds. It reads the models installed on your machine,
resolves each to its base weights, and reports how many *independent* judges you
actually have. On the development machine: 8 models, 5 lineages, 1.6x inflation —
`hermes3` is a fine-tune of `llama3.1`, so choosing it to challenge `llama3.1` buys
nothing. Same error as citing one paper twice, one level up.

Or double-click `RUN-EPISTACK.command` (Mac) / `RUN-EPISTACK.bat` (Windows). The
runner checks Node and Ollama, starts the server, opens a browser, and tells you
plainly what is installed and what is missing.

---

## The idea: independence has three levels

Counting citations overstates how much you know. Counting documents still overstates
it, because two judges watching the same debate are not two independent witnesses.

| Level | Unit | What you miss if you stop here |
|---|---|---|
| 1 — claim | one excerpt | Every quotation counts as a source |
| 2 — document | one PDF, one blog post | Two accounts of one event look independent |
| 3 — lineage | one underlying event or observation set | — |

**The headline number is level 3**, the most conservative count available. Levels 1
and 2 are always shown underneath, because the gap between them is the interesting
part.

## The cases

Same engine, deliberately different shapes of question.

| Case | Excerpts | Documents | Lineages | Inflation |
|---|---|---|---|---|
| `covid` | 21 | 8 | **3** | 7x |
| `lhc` | 9 | 5 | **3** | 3x |
| `eggs` | 9 | 5 | **5** | 1.8x |
| `self` | measurement evidence — see below | | | |

The inflation factor turns out to describe the *shape* of a dispute. COVID is dense
discourse orbiting one debate — three of its four derivation edges point at a single
blog post. LHC is a dependency chain where everything converges on one 2008 safety
report. Eggs has no declared derivations at all: genuinely distributed evidence.

**`self` is the recursive one.** The tool runs against claims about its own author,
using a second evidence kind: measurements, where a block declares a whitelisted
read-only command and the value it claims that command returns, and the verifier
re-runs it. Six of the blocks are real and re-runnable (`git log`, `npm test`). Two are
deliberately flawed — a rarity funnel that multiplies correlated prevalences as if
independent. On the first run the mechanical challenger raised three objections against
the funnel and none against the defensible measurements.

That is the demo we wanted: not *our tool says we're great*, but *our tool caught its
own author overstating*, by the same mechanism it uses to catch 21 excerpts posing as
21 independent sources. One lineage counted several times.

Three of that case's measurements read a second repository that won't exist on your
machine. They report **`unverifiable_here`** and print `?` instead of `!`. That is a
deliberate third state alongside verified and failed, and it is the same discipline as
everything else here: *"I could not check this"* and *"this is false"* are different
findings, and a tool that renders them identically has thrown away the distinction it
was built to preserve. Unchecked never counts as verified. Point at a copy with
`EPISTACK_ROOT_COREOS=/path`, or leave them unchecked — the case's finding does not
depend on them.

`sample` is a tiny worked example you can point at evidence of your own.

## How a model judgment earns its place

Anything a model concludes here goes through four stages before a human sees it as
anything more than a suggestion.

1. **Propose** — a conclusion plus reasoning steps, each citing evidence ids and
   quoting the text it leans on.
2. **Verify** — every citation checked against the corpus *mechanically*. Does the
   block exist? Does the quote actually appear in it? No model is involved in this
   step. Shown work that cannot be checked is decoration.
3. **Challenge** — a graded panel argues against the conclusion:
   - A **deterministic challenger** always runs. Eight structural checks computed from
     the corpus and the proposal — citation coverage, whether the claimed number of
     independent sources matches the cited spread, whether the whole argument rests on
     one lineage, counter-evidence walked past, confidence out of proportion to the
     evidence, unquoted steps, quotes all drawn from a single block, and whether a
     quantitative claim actually follows from the cited measurements. No model, so it
     shares no weights, no training data and no priors with the proposer. It is the only
     challenger whose independence is guaranteed, and **it needs nothing installed** —
     this is the half of the protocol that runs cold on any machine with Node.
   - A **cross-lineage model challenger** joins when one is available, seeing the
     conclusion but **not** the reasoning — blind, because a model shown its own
     reasoning defends it. Selected through `models/registry.json`, which knows that
     `hermes3` is `llama3.1` underneath and refuses it.

   Every record reports an `independence_grade` — a straight count of independent
   lineages on the panel — and the verdict counts objecting **lineages** rather than
   objections. A challenge that never ran returns `verified_unchallenged`, not `verified`.
4. **Resolve** — you accept, reject, or rerun, and you are offered the chance to join
   the panel as its own lineage. You are the only challenger in the protocol that is not
   a model: no shared weights, no shared pretraining, different substrate entirely. So
   the questions are three — do you accept the load-bearing assumption the model
   declared, which objection do you find most serious, and what would change your mind.

   It never blocks. Accept works whether or not you answer, at a lower grade, and the UI
   tells you which grade your answer would actually reach rather than promising the top
   of the scale. Two clicks is enough, because *which objection is most serious* cannot
   be answered without having read the objections.

   Every question is about the structure of the argument, never the subject matter. A
   tool that declines to take a position on COVID origins should not extract one from
   you. Accepting writes a file under `decisions/` and touches nothing in the corpus.

Stage 3 originally ran the challenger on the *proposer's own model*. We caught it with
this tool's own framework — two calls, one lineage, reported as two — and
`docs/A1_CHALLENGER_INDEPENDENCE.md` is the full account of finding and fixing it.

```bash
node scripts/adjudicate-run.js eggs crux
```

Five jobs share this one path: `lineage`, `crux`, `gap`, `rhetoric`, `settled`.

The first time we ran this, it returned UNVERIFIED on a conclusion that was correct —
the model had cited a document id where an evidence id was required. We think that
rejection is the feature. A right answer with unverifiable work does not pass.

## What runs without a model, and what doesn't

This split is deliberate, and it is the answer to "do I have to install a 5GB model
to evaluate this?" You do not.

**Runs cold — Node 20+ and nothing else:**

- The three-level independence model and the citation inflation factor
- Citation verification — every quote checked mechanically against the corpus
- All **eight** mechanical challenger checks (C1–C8), including the measurement-validity
  check that caught the author's own overstatement
- Measurement evidence — commands re-run from a read-only whitelist, values compared
- Every case report and the full test suite (188 tests, no network)

**Needs a local model:**

- Stage 1 (propose) and the *model* half of stage 3 (challenge)
- The alias proposer and evidence chat

If you want the LLM half, install [Ollama](https://ollama.com):

```bash
brew install ollama     # Mac; Windows: download from ollama.com
ollama serve            # in another terminal
ollama pull llama3.1    # one time, ~5GB
```

**Don't want to install 5GB?** [`docs/transcripts/`](docs/transcripts/) has the full
runs already captured — propose, verify, challenge, resolve, verbatim. That is the
intended path for a reviewer.

**Local only, enforced in code.** A non-local endpoint is refused, not warned about.
An epistemic tool that ships your evidence base to a third party has an unexamined
trust dependency sitting at its centre.

## Where the human judgment lives

Document identity is derived mechanically from source URLs. **Lineage is a human
call**, declared in `docs/epistemic/<case>/source_registry.json` along with the
reason for each grouping.

The registry never auto-merges. A document with no declared lineage becomes its own
lineage, because over-collapsing manufactures false independence in the opposite
direction and that error is worse.

If you think two documents we grouped should be separate, edit one field and rerun.
Your number changes, our reasoning stays readable, and the disagreement now lives at
a specific line rather than in the air.

## What this is not

- It does not settle COVID origins, LHC safety, or egg nutrition, and on COVID it
  deliberately holds no position. It tells you how independent your evidence is for
  whatever view you hold.
- Evidence blocks are hand-curated. This is a reasoning tool, not a crawler.
  Automated ingestion is the biggest thing not built — see `SPEC.md` §8.
- Four of the five assessment jobs run and produce verified output but have not had
  their output quality reviewed case by case. Wired is not the same as done, and
  gaps are listed in `SPEC.md` §8 and `docs/DEFECT_REGISTER.md`.

## Where to look

| Concern | File |
|---|---|
| **Frozen transcripts (no install)** | **`docs/transcripts/`** |
| **Bugs we shipped and what caught them** | **`docs/DEFECT_REGISTER.md`** |
| Where the method is weak by design | `docs/FAILURE_MODES.md` |
| Methodology and rationale | `SPEC.md` |
| Three-level resolution | `src/epistemic/genealogy.js` |
| Document and lineage identity | `src/epistemic/source_identity.js` |
| Adjudication protocol | `src/epistemic/adjudicate.js` |
| Citation verifier | `verifyCitations()` in `adjudicate.js` |
| Mechanical challenger (C1–C8) | `src/epistemic/mechanical_challenge.js` |
| Measurement evidence | `src/epistemic/measure.js` |
| Assessment jobs | `src/epistemic/jobs.js` |
| Lineage judgments (COVID) | `docs/epistemic/covid/source_registry.json` |
| Generated reports | `docs/epistemic/*/RUN_OUTPUT.md` |
| Known defects and what caught them | `docs/DEFECT_REGISTER.md` |

## Who built this

Brandon Flores — industrial designer, 16 years shipping physical products (concept to consumer); ~6 months building software. Not a senior engineer, not a virologist. What I bring is a designer's habit: take a fuzzy worry — *"are these sources really independent?"* — and turn it into one command that asks as little interpretation as possible of the person reading the output.

This repo is a Doctrine Labs gift: one epistemic slice, given freely.

brandon@doctrinelabs.com

## License

MIT. Fork it, change it, fold it into your own work. No strings.
