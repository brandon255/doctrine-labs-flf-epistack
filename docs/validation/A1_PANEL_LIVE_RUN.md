# Validation — first live run of the challenge panel

**Date:** 2026-08-03 · **Case:** covid · **Job:** lineage · **Command:** `npm run adjudicate covid lineage`

This is the first end-to-end run of the challenge panel built for A1. It is recorded because
it makes the case for the mechanical challenger better than the design document does: on a
single run, the deterministic challenger found four structural defects and the cross-lineage
model challenger found a fifth, different one. A same-lineage model challenger — what we
shipped before — found none of the four.

## Panel composition

| Role | Who | Lineage | Independent? |
|---|---|---|---|
| Proposer | `llama3.1:8b` | `llama-3.1` | — |
| Challenger 1 | mechanical, no model | `deterministic` | yes, by construction |
| Challenger 2 | `qwen2.5:14b`, blind to the reasoning | `qwen-2.5` | yes, verified different weights |

**Independence grade: moderate** — two independent lineages. Grade `strong` needs a third,
which the human supplies by recording a position at stage 4; that was built shortly after
this run. Total wall time for both model calls: 60 seconds.

## What the proposer said

> Blocks `covid-seed-001` and `covid-seed-002` should not be counted as independent
> confirmations of each other because they both report the same underlying datum from the
> FLF case summary.

Load-bearing assumption it declared: *the excerpts are exact quotes from the same document.*

## What mechanical verification said

**0 of 2 steps verified.** Both steps cited real blocks and then quoted text that does not
appear in them — one quote was `"...from the FLF case summary."`, which is the model
describing the corpus rather than quoting it.

This is the same failure mode the earlier validation sweep found to dominate: **paraphrase,
not fabrication.** The blocks were real and the conclusion is arguably right. The work shown
for it was not checkable, so it does not pass.

## What the mechanical challenger said — `unsupported` / high

Four objections, none of which require a model:

| Check | Severity | Objection |
|---|---|---|
| **C3** single-lineage dependency | high | Every cited block traces to one lineage (`wilf-miller-debate-2024-02`) while the corpus contains 3. "By this tool's own standard that is one observation of the world read 2 ways, not 2 pieces of support." |
| **C1** coverage | medium | Cites 2 of 21 blocks (10%). A conclusion about the corpus drawn from a tenth of it may be reading a subset that happens to agree. |
| **C4** uncited counter-evidence | medium | 3 blocks qualify or dispute the cited evidence and were never addressed: `covid-seed-003`, `covid-primary-weissman-oom-spread-9`, `covid-primary-eric-decision-pdf-4`. |
| **C5** confidence mismatch | medium | HIGH confidence asserted on 2 cited blocks. |

C3 is the one worth dwelling on. The job was *find evidence being wrongly treated as
independent.* The model answered by citing two blocks that both trace to a single lineage —
committing, inside its own reasoning, the exact error it had been asked to detect. A
deterministic check caught that. A model asked "is this argument sound?" did not.

## What the cross-lineage model challenger said — `overstated` / medium

> The conclusion dismisses the potential value of independent confirmation without
> considering that different analyses or interpretations might still offer unique insights,
> even if they reference the same underlying datum.

A substantively different objection from any of the four above — it argues about the
*concept*, not the structure. That is the case for keeping a model on the panel alongside the
mechanical checks rather than instead of it: they fail in different directions.

## Verdict

`unverified` — mechanical citation verification is a hard gate and nothing downstream can
argue past it.

On a re-run where verification passed, the same panel returned **`contested`**, because two
*independent* lineages both objected. Under the old single-challenger logic that same
situation would have returned `verified_with_caveat` at worst, and if the challenge call had
timed out it would have returned plain `verified`.

## What this run demonstrates

1. **The mechanical challenger earns its place.** Four objections, zero models, deterministic,
   available on a machine with no Ollama at all.
2. **Blind same-lineage challenging was weak.** The objections that mattered most were
   structural, and asking a model to introspect on structure did not surface them.
3. **Two lineages disagree in different registers.** Not redundant.
4. **The tool's own thesis applies to the tool.** C3's wording is not decoration; it is the
   engine's standard turned on the engine's own reasoning, and it failed the test.

Reproduce: `npm run adjudicate covid lineage` · audit the shelf: `npm run audit:self`
