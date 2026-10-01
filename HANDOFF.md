# FLF Epistemic Stack

Built for the Future of Life Foundation Epistemic Case Study Competition (summer 2026).

They were looking for compounding, multi-user knowledge bases — protocols, views, participation. I was looking at a different cut of the same problem: **after you have the corpus, how many times was the world actually observed?** Citation count and independent-observation count are different numbers. They differ by more than people expect.

The name stays. The instrument is MIT. Take it.

## What it does

```
21 excerpts cited, drawn from 8 documents, tracing to 3 independent lineage(s).
Treat as 3 independent source(s), not 21.
```

Three-level independence (claim / document / lineage). Mechanical citation verify. A challenger that is not a second model — it is deterministic code, so its independence from the proposer is a property of the implementation.

It does not settle COVID, LHC safety, or eggs. It tells you how independent your evidence is for whatever view you hold.

## Run it

No install, no API key, no network. Node 20+.

```bash
git clone https://github.com/brandon255/doctrine-labs-flf-epistack
cd doctrine-labs-flf-epistack
node scripts/epistemic-run.js covid
```

Or read the frozen transcripts in [`docs/transcripts/`](docs/transcripts/) with nothing installed.

The tool caught its own author's overcount. The original July writeup claimed 19 independent COVID sources. There are three. That document is still in the repo, unedited, as [`SUBMISSION.md`](SUBMISSION.md). The corrected model is [`SPEC.md`](SPEC.md).

## The suite

Same engine, three surfaces:

1. **[FLF Epistemic Stack](https://github.com/brandon255/doctrine-labs-flf-epistack)** (this repo) — independence counting on the contest cases. COVID 21 excerpts → 3 lineages.
2. **[FLI Index Lineage Toolkit](https://github.com/brandon255/doctrine-labs-fli-index-lineage)** — same count on a published scoreboard. Highest-graded companies, highest citation inflation.
3. **[Eval Contamination Toolkit](https://github.com/brandon255/doctrine-labs-flf-eval-contamination-toolkit)** — same count on benchmarks and reviewer-panel independence.

I did not discover the problem. Greenberg (2009) named citation distortion. The Cochrane Handbook (Chapter 5 / MECIR C42) requires collating multiple reports so the *study*, not the report, is the unit of interest, and notes there is still no fully automated recommended tool for reconciling them. This is a working cut at that layer: post-retrieval, local-first, auditable.

## Who to talk to

Brandon Flores, Doctrine Labs — brandon@bmflores.com

MIT. Fork it, fold it in, ignore the contest wrapping. The useful part is the count.
