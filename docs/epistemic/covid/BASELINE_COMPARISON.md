# COVID baseline comparison — full appendix (Jun 19, 2026)

**Sub-question:** What cruxes must a newcomer resolve before updating on COVID-19 origins?  
**Not in scope:** Picking zoonosis vs lab-leak.

**Source:** Perplexity runs pasted in `sources/PASTE_HERE.txt` (Prompt B baselines).

---

## Core OS genealogy run (same sub-question)

```
21 blocks cited; 19 distinct roots; 1 correlated cluster(s) detected — treat as 19 independent sources, not 21.
```

Full report: `RUN_OUTPUT.md` (21 blocks, 16 primary ingests)

**Demo cluster:** `covid-seed-001`, `002`, `004` share `flf-epistemic-competition-case-covid`.

---

## Baseline A — Claude (8 cruxes + meta-crux)

**Shape:** Long-form essay. Meta-crux on priors, then eight load-bearing junctions:

| # | Crux | One-line |
|---|------|----------|
| Meta | Base rate before evidence | Zoonosis history vs Wuhan/WIV coincidence |
| 1 | Huanan market clustering | Signal of origin vs ascertainment bias |
| 2 | Lineages A and B | Two spillovers vs single introduction artifacts |
| 3 | Furin cleavage site | Natural feature vs engineering signature |
| 4 | DEFUSE proposal | Blueprint vs coincidence |
| 5 | Missing animal progenitor | Absence of host vs China's clearance timeline |
| 6 | Raccoon-dog env. samples | Infected animal vs co-located DNA |
| 7 | Intelligence assessments | Independent reads vs correlated re-analysis |
| 8 | Chinese non-cooperation | Cover-up vs default opacity |

**Closing discipline:** State prior explicitly; ask how much each fact updates each hypothesis; weight near-decisive missing facts (infected animal, wild progenitor, WIV records) above suggestive circumstantial pile.

### Claude — LIMITATIONS (verbatim themes)

Claude's LIMITATIONS section is the strongest correlation-aware prose in either baseline:

- **Zoonosis side:** Worobey/Pekar/Crits-Christoph/Cell share author network and **same China CDC datasets** — multiple analyses, one constrained evidence pool.
- **Lab-leak side:** DEFUSE is **one document** re-cited across hearings and outlets; FCS/CGG/six-segment arguments trace to a **small advocate set** (DRASTIC, Chan, Wade, Quay, Ebright, Bloom).
- **Proximal Origin:** Early framing event; downstream consensus and media partly **downstream of one paper**, not independent.
- **Intelligence:** Agencies read **same public literature**; CIA 2025 shift reported as re-analysis, not new intel.
- **Bottleneck:** Both camps reason from **Chinese-controlled primary data** withheld or partial.
- **Incentives:** Shared funding/political roots masquerading as independent expert agreement.

**What Claude did not produce:** Atomic Schema D blocks, automated `root_source_id` count, or runnable `same_cluster` edges.

---

## Baseline B — Gemini (4 cruxes)

**Shape:** Shorter, four cruxes with symmetric "what would move a reasonable person" bullets:

| # | Crux |
|---|------|
| 1 | Spatial epidemiology — market origin vs superspreading |
| 2 | Furin cleavage site — natural vs insertion |
| 3 | Missing intermediate host — time vs anomaly |
| 4 | Institutional conduct — cover-up vs bureaucratic opacity |

### Gemini — LIMITATIONS (verbatim themes)

- **Huanan datasets:** Dozens of papers share **one China CDC collection**; inherited sampling bias if original collection was market-skewed.
- **DEFUSE:** Many lab-leak arguments trace to **one leaked proposal**; if misread or never executed, downstream pieces lose foundation.
- **Intelligence:** Agencies apply different weights to **same public pool**, not separate classified streams.

**What Gemini did not produce:** Structured blocks, root count, or ingest pipeline.

---

## Side-by-side uplift (honest)

| Capability | Claude | Gemini | Core OS |
|------------|--------|--------|---------|
| Crux navigation prose | **Strong** (8 + meta) | **Strong** (4) | Seeds + graph edges |
| Names correlation problem | Yes (LIMITATIONS) | Yes (LIMITATIONS) | **Auto cluster + count** |
| Atomic sourced blocks | No | No | **21 blocks** |
| Verbatim primary excerpts | Inline cites | Inline cites | **16 Schema D primaries** |
| Runnable independence report | No | No | **`npm run epistemic:covid`** |
| Human promotion path | N/A | N/A | **`npm run epistemic:promote`** |

**Honest verdict:** For a newcomer who only wants readable prose, baselines may still win. Core OS wins on **structure, primaries as atoms, automated genealogy, and judge-runnable commands** — not on essay quality or origins adjudication.

---

## What we are not claiming

- Baselines "failed" — they answered Prompt B well.
- Core OS prose matches Claude/Gemini depth — it does not yet.
- Genealogy resolves rhetorical correlation (same framing, different URLs) — only **identifier-level** clustering today.

*Re-run baselines: same Prompt B in Perplexity/Claude/Gemini; paste to `PASTE_HERE.txt`; compare to this table.*
