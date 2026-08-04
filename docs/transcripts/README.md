# Transcripts — the tool running, without you installing it

A reviewer with a stack of submissions should not have to pull a five-gigabyte model to see whether this works. These are complete adjudication runs, captured verbatim from a real machine, including the ones that failed.

No screencast in this gift; transcripts are the demo.

## What you're looking at

Each transcript walks the four stages of the adjudication protocol: the model **proposes** a conclusion with cited reasoning; every citation is **verified** mechanically against the corpus with no model involved; a **challenge** panel argues against it; and a human **resolves**. The verdict and the independence grade at the top of each file are the outputs that matter.

The deterministic half of this — verification and the eight mechanical challenger checks — runs on any machine with Node and no model at all. Only the proposal and the model challenger need Ollama, which is the entire reason this folder exists.

## Run environment

| Field | Value |
|---|---|
| Captured | 2026-08-03T22:55:39.951Z |
| Proposer | `llama3.1:8b` (lineage `llama-3.1`) |
| Model challenger | `qwen2.5:14b` (lineage `qwen-2.5`) |
| Machine | Apple M1 Max, local only, no network calls |

## The runs

| Case | Job | Verdict | Independence | Time | Transcript |
|---|---|---|---|---|---|
| `covid` | crux | contested | moderate | 127s | [covid-crux.md](covid-crux.md) |
| `covid` | gap | contested | moderate | 98s | [covid-gap.md](covid-gap.md) |
| `covid` | lineage | contested | moderate | 98s | [covid-lineage.md](covid-lineage.md) |
| `covid` | rhetoric | contested | moderate | 88s | [covid-rhetoric.md](covid-rhetoric.md) |
| `covid` | settled | contested | moderate | 76s | [covid-settled.md](covid-settled.md) |
| `eggs` | crux | unverified | moderate | 48s | [eggs-crux.md](eggs-crux.md) |
| `eggs` | gap | unverified | moderate | 48s | [eggs-gap.md](eggs-gap.md) |
| `eggs` | lineage | unverified | moderate | 45s | [eggs-lineage.md](eggs-lineage.md) |
| `eggs` | rhetoric | contested | moderate | 50s | [eggs-rhetoric.md](eggs-rhetoric.md) |
| `eggs` | settled | contested | moderate | 48s | [eggs-settled.md](eggs-settled.md) |
| `lhc` | crux | unverified | moderate | 48s | [lhc-crux.md](lhc-crux.md) |
| `lhc` | gap | contested | moderate | 42s | [lhc-gap.md](lhc-gap.md) |
| `lhc` | lineage | unverified | moderate | 42s | [lhc-lineage.md](lhc-lineage.md) |
| `lhc` | rhetoric | contested | moderate | 47s | [lhc-rhetoric.md](lhc-rhetoric.md) |
| `lhc` | settled | contested | moderate | 54s | [lhc-settled.md](lhc-settled.md) |
| `sample` | crux | unverified | moderate | 25s | [sample-crux.md](sample-crux.md) |
| `sample` | gap | unverified | moderate | 28s | [sample-gap.md](sample-gap.md) |
| `sample` | lineage | contested | moderate | 31s | [sample-lineage.md](sample-lineage.md) |
| `sample` | rhetoric | contested | moderate | 28s | [sample-rhetoric.md](sample-rhetoric.md) |
| `sample` | settled | unverified | moderate | 30s | [sample-settled.md](sample-settled.md) |
| `self` | crux | contested | — | 38s | [self-crux.md](self-crux.md) |
| `self` | gap | unverified | — | 54s | [self-gap.md](self-gap.md) |
| `self` | lineage | contested | — | 67s | [self-lineage.md](self-lineage.md) |
| `self` | rhetoric | unverified | — | 45s | [self-rhetoric.md](self-rhetoric.md) |
| `self` | settled | unverified | — | 55s | [self-settled.md](self-settled.md) |

## How to read the failures

Of 25 runs, 0 errored and 11 returned an unverified verdict. Both are kept.

An unverified verdict usually means the model quoted a block non-verbatim — it paraphrased where the verifier demanded exact text. Across our earlier validation runs the model never once invented a block id, so the honest reading is *conclusions largely sound, quoting sloppy*. We kept the strict rule anyway: a verifier that accepts paraphrase cannot distinguish accurate paraphrase from convenient paraphrase.

That is also why an unverified run is not embarrassing to publish. The tool rejecting its own model's output is the tool working.

## Regenerating

```bash
ollama serve                              # in another terminal
node scripts/freeze-transcripts.js        # all cases, all jobs
node scripts/freeze-transcripts.js covid  # one case
```
