# Provenance Genealogy Layer — a runnable epistemic demo

**Future of Life Foundation — Epistemic Case Study competition**
Brandon Flores · Doctrine Labs

This is a small, self-contained slice of a larger local-first system (Core OS). It exists so you can **run one command and read the result** without cloning a large private repo or trusting a screenshot.

---

## The problem it addresses

When you collect evidence for a contested question, it is easy to count *blocks of evidence* and mistake that for *independent confirmation*. But several blocks can trace back to **the same original source**. Five citations that all quote one report is one source wearing five hats — not five roots.

Existing safeguards I already had (an integrity ledger for tampering, human approval gates for rubber-stamping) did **not** catch this. Neither one asks: *how many distinct roots are actually under these blocks?*

This layer answers exactly that question, and prints one honest line:

> `N blocks cited; M distinct roots; K correlated cluster(s) detected — treat as M independent sources, not N.`

---

## Run it (no dependencies, Node 20+)

There is nothing to install — the code has zero runtime dependencies.

```bash
npm run epistemic:covid
```

Other cases:

```bash
npm run epistemic:lhc
npm run epistemic:eggs
npm run epistemic:all
```

## What you should see (COVID-19 origins case)

```
21 blocks cited; 19 distinct roots; 1 correlated cluster(s) detected — treat as 19 independent sources, not 21.
```

The command prints a full Markdown report plus a JSON summary. The three FLF starting cases are included:

| Case | Question | Result |
|------|----------|--------|
| `covid` | COVID-19 origins (Wilf–Miller debate) | 21 blocks → **19 distinct roots**, 1 correlated cluster |
| `lhc`   | Do LHC collisions risk black holes? | 9 blocks → **6 distinct roots**, 2 correlated clusters |
| `eggs`  | Are eggs bad for you? | 9 blocks → **6 distinct roots**, 2 correlated clusters |

---

## How it works (three steps)

1. **Evidence blocks** — each claim is stored as a structured block with a citation (`docs/epistemic/<case>/evidence_blocks.json`).
2. **Root tagging** — each block carries a `root_source_id`. Blocks that trace to the same origin share that id.
3. **Genealogy resolve** — the resolver groups blocks by root into clusters, counts **distinct roots**, and reports the gap between "blocks" and "independent sources."

Core logic:

- `src/epistemic/genealogy.js` — clusters blocks by root, counts distinct roots
- `src/epistemic/ingest.js` — loads a case, runs the resolve, builds the report
- `src/epistemic/report.js` — renders the human-readable assessment
- `scripts/epistemic-run.js` — the command-line entry point

---

## Honest limits (what this is *not*)

- Matching is by **explicit identifier** (`root_source_id`), not semantic similarity. Two sources that are secretly correlated but tagged differently will not be caught automatically — a human still assigns roots during ingest.
- The case data is **human-curated**, not scraped. This is a reasoning tool, not a crawler.
- It does **not** settle COVID origins, black-hole risk, or egg nutrition. It measures *how independent your evidence actually is* for whatever position you hold.

---

## Who built this

Brandon Flores — industrial designer (~16 years shipping physical product), roughly six months into software. I am not claiming to be a senior engineer or a domain scientist. The wedge is a designer's instinct: reduce a fuzzy epistemic worry ("are these sources really independent?") to one command with the **least interpretation** required of the reader.
