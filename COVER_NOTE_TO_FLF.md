# A finished build, as a gift

**To:** Future of Life Foundation — Epistemic Case Study team
**From:** Brandon Flores, Doctrine Labs
**Re:** Continuing the build

---

I kept building after the deadline. Here it is, finished, and you own it.

## Before anything else — you don't have to install a thing

I assume you are looking at a stack of these and have minutes, not hours. So the
primary artifact is not the code, it's the transcripts.

**[`docs/transcripts/`](docs/transcripts/)** has every case and every job captured end
to end — the model's proposal, the mechanical citation check, the challenge panel, the
verdict. Verbatim, including the runs that failed. Five minutes of reading, nothing
installed, no 5GB model download.

The transcripts are the no-install demo — read them instead of installing anything.

And if you do want to run it: the half of the tool that does the actual epistemic work
— the three-level independence model, citation verification, and all eight mechanical
challenger checks — needs **Node and nothing else**. The local model is optional and
only drives the proposal and one of the two challengers. That split is deliberate; I
did not want the interesting part gated behind a download.

## The short version

I built a tool to detect correlated evidence being treated as independent. Then I ran
it on my own COVID corpus.

It reported **19 independent sources**. There are three.

Judge Will's 27-page decision had been entered as three separate sources, because I had
pulled three excerpts from it and given each its own identifier. Weissman's single post
had become four. Scott Alexander's, three. Every individual excerpt was accurate and
correctly attributed. The corpus was only wrong about the number that actually matters:
how many times the world had been observed.

That failure is the reason the rest of this exists, and I lead with it because I think
it is the most useful thing I can tell you. The error is not exotic. It is the default
outcome of building an evidence base one quotation at a time, which is how everyone
builds one — including LLM pipelines, which are very good at producing many
well-attributed excerpts and have no way of noticing that forty citations are eight
documents.

## What's in it

**A three-level independence model.** Claims, documents, and lineages are different
units, and tooling that collapses them overcounts every time. The headline number is
the most conservative one — lineages — with the other two always visible underneath.

| Case | Excerpts | Documents | Lineages | Inflation |
|---|---|---|---|---|
| COVID | 21 | 8 | **3** | 7x |
| LHC | 9 | 5 | **3** | 3x |
| Eggs | 9 | 5 | **5** | 1.8x |

The inflation factor turned out to describe the *shape* of each dispute, which I did not
anticipate. COVID is dense discourse orbiting one debate, with three of its four
derivation edges pointing at a single blog post. LHC is a dependency chain converging on
one 2008 safety report — the public reassurance is real, but it is one assessment with a
long shadow rather than many converging ones. Eggs has no declared derivations at all.

**An adjudication protocol.** I wanted model judgment in the loop without asking anyone
to trust an unexplained output. Four stages: the model proposes with cited work; every
citation is verified *mechanically* against the corpus with no model involved; a second
call sees the conclusion but not the reasoning and argues the strongest case against;
the human accepts, overrides, or reruns.

The second stage is the one I would point you at. Shown work that cannot be checked is
decoration, so it gets checked — quotes must actually appear in the blocks they cite.
The third is blind on purpose, because a model shown its own reasoning defends it.

The first live run returned UNVERIFIED on a conclusion that was *correct*. The model had
cited a document id where an evidence id was required, and the verifier rejected it
anyway. I think that rejection is the feature.

I then ran all five jobs against all three cases and wrote down what happened. Nine of
fifteen passed. Every single failure was a non-verbatim quote — across all fifteen runs
the model never once invented a block id. So the honest reading is "conclusions largely
sound, quoting sloppy" rather than "model unreliable", and I have kept the strict rule
anyway, because a verifier that accepts paraphrase cannot tell accurate paraphrase from
convenient paraphrase.

I also ran an ablation: the same model, same evidence, same question, with the
scaffolding removed. It overcounted independent sources on all three cases. Not
catastrophically — 7 rather than 21 on COVID — but consistently, because a document
boundary is not visible in text that never mentioned it.

**Then I pointed it at myself.** There is a fourth case now, `self`, and it uses a
second kind of evidence: measurements. A block declares a command from a read-only
whitelist and the value it claims that command returns; the verifier re-runs the command
and checks. That covers claims text evidence can't — *"536 tests pass"* is a claim about
the state of a system, not about what a document said.

Six of its blocks are real and re-runnable. Two are deliberately wrong: a rarity funnel
that multiplies eleven correlated prevalences as if each were an independent filter, to
conclude something flattering about me. The mechanical challenger raised three objections
against it — the rarity phrase isn't a measurable quantity, the headline number appears
in no cited measurement, and the multiplied quantities declare their own correlation. It
raised none against the defensible measurements.

I include this because the alternative — a tool whose author only ever points it at other
people's reasoning — would be the less interesting artifact. It is the same error the
COVID corpus made, in the same shape: one lineage counted several times. I just happened
to be the one making it.

### The bugs, not just the build

`docs/DEFECT_REGISTER.md` lists the defects we wrote into this tool, tiered by what each
would have cost you rather than by how hard it was to fix. Two of them were Tier 1 —
the tool reporting *verified* for something it had not verified, which is worse than
having no verifier, because a reader shown a green check has been actively disarmed.

I include it because the alternative is a submission that asks you to take its
correctness on faith, and the rest of this repository argues that a conclusion with no
shown work is an assertion rather than a conclusion. It would be incoherent to make that
argument and then hand you a package with its own history sanded off.

The register is checkable rather than confessional. Every entry names the test that now
guards it, and `npm run verify:register` re-reads the document, extracts those names, and
confirms each exists and passes — exiting non-zero if not. Delete a guard and the
register stops verifying. *"We caught and fixed this"* is a measurement here, not a
memory, which is the same standard the tool applies to everyone else's claims.

**One thing you'll see and should not misread.** Three of that case's measurements read a
second repository, Core OS, which is private and won't be on your machine. Those report
`unverifiable_here` and print with a `?` rather than a `!`. That is a third state, on
purpose: a measurement this machine cannot run has not been shown false, only left
unchecked, and it does not count toward the verified total either. Collapsing "I couldn't
check this" into "this is wrong" would be the same category error the tool exists to
catch, so it refuses to make it. If you want those three checked, either point at a copy
with `EPISTACK_ROOT_COREOS=/path/to/repo`, or take them as unchecked — which is the
honest default and costs you nothing, since the case's finding does not rest on them.

## How to run it

```bash
git clone https://github.com/brandon255/doctrine-labs-flf-epistack.git
cd doctrine-labs-flf-epistack
node scripts/epistemic-run.js covid
```

Node 20+ and nothing else. No install, no dependencies, no API key, no network. 188 tests
run offline. There is a one-click runner for Mac and Windows, and a local UI at
`npm start`.

Ollama is optional and only needed for the proposal step and the model challenger. Skip
it and the deterministic engine still runs every check; `docs/transcripts/` covers what
you'd have seen.

The methodology, the design tradeoffs, and an explicit list of what I did *not* build
are in [`SPEC.md`](SPEC.md). About five pages.

## What I'm not claiming

The tool takes no position on COVID origins, LHC safety, or eggs. On COVID it holds no
position deliberately. It describes the structure of an evidence base, not the world.

Evidence blocks are still hand-curated — automated ingestion is the largest gap and I
say so in the spec rather than letting you find it. Four of five assessment jobs run and
produce verified output but have not had their output reviewed case by case; I call
those wired rather than done, and track the difference in `SPEC.md` §8 and `docs/DEFECT_REGISTER.md`.

`docs/FAILURE_MODES.md` lists eight ways this breaks, with severities.

The one worth telling you about is the one I turned the tool on myself to find. The
adversarial challenger used to run on the same model as the proposer — so by my own
framework I was reporting one lineage as two, inside the very machinery that exists to
catch that error. Two calls, one source, counted as two.

It is fixed, and how it got fixed is the part I would want you to look at. The challenger
is now a graded panel. A **deterministic** challenger always runs — eight structural checks
computed from the corpus, no model, so it shares no weights, no training data and no priors
with the proposer. That turned out to be *stronger* than my first instinct of "use a
different model," and it works on a machine with no models installed at all. A second,
cross-lineage model challenger joins when one is available, selected through a model lineage
registry with the same structure as the evidence registry — because it is the same problem
one level up. `hermes3` gets rejected as a challenger for `llama3.1`: different name,
different publisher, same weights underneath.

On its first live run the deterministic challenger caught the model resting a conclusion
*about source independence* entirely on a single lineage — committing the exact error it had
been asked to detect. The model challenger missed that.
(`docs/validation/A1_PANEL_LIVE_RUN.md`)

The third lineage on that panel is you. Stage 4 used to be three buttons that set a variable
and printed "on the record" while writing nothing anywhere, which is its own small dishonesty
and is also fixed. It now asks three questions about the *structure* of the argument — do you
accept the load-bearing assumption the model declared, which objection do you find most
serious, what would change your mind — and records the answer as a challenge alongside the
machines. You are the only challenger in the protocol that isn't a model.

It does not block. Accept works whether or not you answer, at a lower grade, and the interface
tells you which grade your answer would actually reach rather than promising the top of the
scale. Notice also what it never asks: nothing about COVID origins. A tool that declines to
hold a position on the subject has no business extracting one from the person using it.

`npm run audit:self` points the engine's counting at your own model shelf. On mine: 8 models,
5 independent weight lineages, 1.6x inflation. What it cannot resolve, and says so, is that
every one of those models was pretrained on overlapping corpora nobody discloses. Distinct
weight lineages is checkable. Independent minds is not, and I don't claim it.

I'm an industrial designer, sixteen years shipping physical product, about six months
into software. Not a senior engineer, not a researcher. The infrastructure is real and
tested. The domain expertise is not claimed, and where the tool touches virology or
particle physics it deliberately says nothing.

## Why I'm sending it

**It's a gift.** No strings. MIT, public repo — fork it, change it, fold it into your
own work, ignore it. Whatever serves the mission.

**And it's one slice of something larger.** I call it Core OS: local-first AI
infrastructure built on three commitments that I think matter for safety in practice
rather than in principle. Data stays local, and that's enforced in code — this tool
refuses a non-local model endpoint rather than warning about it. Writes pass through
human gates. Every claim carries an honest label, so built and planned never blur
together.

## The open door

If the local-first posture or the human-gate thesis is interesting to you, I'd value a
conversation. Not a pitch and not a job application — a real one. I'd also genuinely
like to know where you think this approach breaks. There are four open questions in
§8 of the spec that I could not resolve on my own, including whether the blind
challenge is actually better than an informed one. I reasoned my way there; I never
measured it.

**brandon@doctrinelabs.com**

Thank you for running the competition. It made me finish a slice I had been circling for
months, and then it made me find a real bug in my own work. Whatever you do with this, I
hope it's useful.

Brandon
