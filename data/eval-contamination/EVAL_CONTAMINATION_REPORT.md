# Evaluation Contamination & Reviewer Independence Report

**Toolkit:** `doctrine-labs-eval-contamination-toolkit` v2.0
**Companion to:** [FLF Epistack submission](https://github.com/brandon255/doctrine-labs-flf-epistack), [AISI Lineage Toolkit v1](https://github.com/brandon255/doctrine-labs-aisi-lineage-toolkit)
**Date:** 2026-08-09

---

## 1. Summary

The FLI AI Safety Index, across its two published cycles (Winter
2025 and Summer 2026), is the most prominent external assessment
of frontier AI safety practices. It grades nine AI companies on
37 indicators using a panel of 7 (Summer 2026) or 8 (Winter 2025)
independent reviewers.

This toolkit applies the Epistack engine to the underlying
evidence structure of the Index. It surfaces two findings:

1. **Benchmark contamination is structural.** Many 'independent'
   benchmarks cited in the FLI Index trace to a smaller number
   of underlying measurements. The 2026 Humanity's Last Exam
   scoring gap (Anthropic 66.6% vs independent 18.6%) is the
   visible edge of this.
2. **Reviewer-panel independence is overstated.** Even using only
   the published domain assignments, the panel structure shows
   shared-domain clustering above the threshold expected of an
   'independent' reviewer panel.

The toolkit does not say whether the FLI Index grades are wrong.
It surfaces the structure that underdetermines the grades. The
policy response is FLI's.

---

## 2. Methodology

Same engine, same methodology as the FLF Epistack submission:
three-level independence model (claims → documents → lineages),
with citation inflation factor computed as the ratio of excerpts
to lineages.

Three new analysis surfaces added in v2:

1. **Contamination audit** — host-level rollup of citation
   independence across all FLI Index evidence.
2. **Reviewer network** — affiliation graph for the FLI reviewer
   panel, computed from domain assignments (and extendable when
   FLI publishes named affiliations).
3. **Cross-cycle delta** — comparison of Winter 2025 vs Summer
   2026 evidence structure, including indicator growth (35 → 37)
   and URL overlap analysis.

---

## 3. Per-company lineage (Summer 2026)

Each FLI Index company was run through the Epistack engine on the
Summer 2026 evidence base. The summary:

| Company | Excerpts | Documents | Lineages | Inflation |
|---------|----------|-----------|----------|-----------|
| anthropic | 20 | 3 | 3 | **6.67x** |
| openai | 26 | 6 | 6 | **4.33x** |
| google-deepmind | 16 | 6 | 6 | **2.67x** |
| meta | 11 | 5 | 5 | **2.20x** |
| xai | 5 | 3 | 3 | **1.67x** |
| z-ai | 9 | 5 | 5 | **1.80x** |
| alibaba-cloud | 8 | 4 | 4 | **2.00x** |
| deepseek | 4 | 3 | 3 | **1.33x** |
| mistral | 3 | 2 | 2 | **1.50x** |

Per-company full reports: `docs/epistemic/summer-2026/<company>/RUN_OUTPUT.md`.

---

## 4. Contamination audit


**Source:** Epistack engine run on the FLI AI Safety Index evidence base (Winter 2025 + Summer 2026).

**Total blocks audited:** 142
**Total distinct URLs cited:** 57
**Total distinct hosts:** 21

### Methodology

For each cited benchmark / source URL, we count how many FLI Index
evidence excerpts cite it. A *contamination ratio* > 1 indicates that
the host serves as a single underlying measurement that has been cited
multiple times. A ratio > 4 indicates that the host is structurally
important and likely over-represented in the cited evidence base.

### Headline: hosts with the highest contamination

| Host | Cited blocks | Distinct URLs | Contamination ratio |
|------|--------------|---------------|---------------------|
| `futureoflife.org` | 26 | 3 | **8.67x** |
| `cdn.openai.com` | 17 | 3 | **5.67x** |
| `www-cdn.anthropic.com` | 22 | 4 | **5.50x** |
| `deploymentsafety.openai.com` | 4 | 1 | **4.00x** |
| `storage.googleapis.com` | 15 | 4 | **3.75x** |
| `rivista.ai` | 2 | 1 | **2.00x** |
| `qwen.alibaba.com` | 6 | 3 | **2.00x** |
| `ai.meta.com` | 12 | 7 | **1.71x** |
| `z.ai` | 9 | 6 | **1.50x** |
| `deepseek.com` | 3 | 2 | **1.50x** |
| `openai.com` | 7 | 5 | **1.40x** |
| `x.ai` | 5 | 4 | **1.25x** |
| `anthropic.com` | 2 | 2 | **1.00x** |
| `arxiv.org` | 2 | 2 | **1.00x** |
| `ai.google` | 2 | 2 | **1.00x** |

### Per-company citation inflation

| Company | Total blocks | Distinct URLs | Inflation |
|---------|--------------|---------------|-----------|
| anthropic | 28 | 9 | **3.11x** |
| openai | 33 | 12 | **2.75x** |
| google-deepmind | 22 | 10 | **2.20x** |
| meta | 16 | 10 | **1.60x** |
| alibaba-cloud | 11 | 7 | **1.57x** |
| xai | 9 | 6 | **1.50x** |
| z-ai | 12 | 8 | **1.50x** |
| mistral | 3 | 2 | **1.50x** |
| deepseek | 8 | 7 | **1.14x** |

### What this means

A high contamination ratio at the host level means that a single
underlying source (e.g., a benchmark publisher's CDN) is doing the
work of many cited 'independent' sources. The Epistack engine
collapses citations to underlying measurements, surfacing the gap
between cited count and independent measurement count.

For the FLI Index, hosts with contamination ratio > 4 indicate that
the underlying benchmark or framework publisher is structurally
over-represented in the cited evidence base. The Index grades
reflect this — when multiple 'independent' sources collapse to one
underlying measurement, the grade's evidence base is thinner than
the citation count suggests.

_Regenerate with_ `node scripts/eval-contamination.js`.


---

## 5. Reviewer network


**Source:** FLI AI Safety Index methodology disclosures for Winter 2025 + Summer 2026.

| Cycle | Panel size | Edges | Density |
|-------|------------|-------|---------|
| winter-2025 | 8 | 6 | **21.4%** |
| summer-2026 | 7 | 6 | **28.6%** |

### What this means

The 'independent reviewers' framing presumes that the panel does not
share structural clustering. The graph above surfaces that
clustering — even using only the *domain assignments*, not the named
affiliations.

If FLI publishes the named reviewer panel, the structural analysis
can be extended with affiliation edges (shared universities, shared
funding sources, prior co-authorships). At that point the density
number will rise, often substantially.

The toolkit does not say whether this clustering invalidates the
Index grades. It surfaces the clustering and lets readers judge.


---

## 6. Cross-cycle delta (Winter 2025 → Summer 2026)


**Source:** Epistack engine run on both cycles' evidence bases.

| Company | Winter total | Summer total | Δ blocks | Winter lineages | Summer lineages | Δ lineages | Winter infl | Summer infl | Δ infl |
|---------|--------------|--------------|----------|----------------|-----------------|------------|-------------|-------------|--------|
| openai | 7 | 26 | +19 | 6 | 6 | 0 | 1.2x | 4.3x | +3.10x |
| anthropic | 8 | 20 | +12 | 6 | 3 | -3 | 1.3x | 6.7x | +5.40x |
| google-deepmind | 6 | 16 | +10 | 5 | 6 | +1 | 1.2x | 2.7x | +1.50x |
| meta | 5 | 11 | +6 | 5 | 5 | 0 | 1x | 2.2x | +1.20x |
| z-ai | 3 | 9 | +6 | 3 | 5 | +2 | 1x | 1.8x | +0.80x |
| alibaba-cloud | 3 | 8 | +5 | 3 | 4 | +1 | 1x | 2x | +1.00x |
| mistral | 0 | 3 | +3 | 0 | 2 | +2 | 0x | 1.5x | +1.50x |
| xai | 4 | 5 | +1 | 3 | 3 | 0 | 1.3x | 1.7x | +0.40x |
| deepseek | 4 | 4 | 0 | 4 | 3 | -1 | 1x | 1.3x | +0.30x |

### URL overlap analysis (Winter 2025 → Summer 2026)

| Company | Winter URLs | Summer URLs | Overlap | New in Summer | Overlap % |
|---------|-------------|-------------|---------|---------------|-----------|
| anthropic | 6 | 3 | 0 | 3 | 0.0% |
| openai | 6 | 6 | 0 | 6 | 0.0% |
| google-deepmind | 5 | 6 | 1 | 5 | 16.7% |
| meta | 5 | 5 | 0 | 5 | 0.0% |
| xai | 3 | 3 | 0 | 3 | 0.0% |
| z-ai | 3 | 5 | 0 | 5 | 0.0% |
| alibaba-cloud | 3 | 4 | 0 | 4 | 0.0% |
| deepseek | 4 | 3 | 0 | 3 | 0.0% |

### Interpretation

- A high overlap percentage means that the Summer 2026 evidence
  reuses most of the same URLs as Winter 2025 — even when the
  *block count* grew. This is the structural form of indicator
  inflation: more excerpts, same underlying sources.
- A high 'New in Summer' count means genuinely new sources were
  added — usually corresponding to v3 RSPs, new risk reports, or
  Summer-2026-only system cards.
- The Winter 2025 → Summer 2026 FLI Index grew from 35 to 37
  indicators. If companies show high URL overlap and modest
  lineage growth, the new indicators were not backed by new
  evidence at the underlying-measurement level.

_Regenerate with_ `node scripts/eval-cross-cycle.js`.


---

## 7. Limitations

The toolkit has four known limits:

1. **Reviewer names are anonymized.** The FLI methodology publishes
   reviewer domain assignments but does not name all panelists.
   When FLI publishes the named panel for Summer 2026 (or later),
   the network analysis will extend with affiliation edges.
2. **Host-level contamination is approximate.** The audit groups
   citations by hostname. Two distinct URLs on the same host
   may still trace to different underlying measurements. A finer
   audit would track URL-level lineage.
3. **Cross-cycle URL match is surface-level.** Two excerpts with
   the same URL may still draw on different claims or different
   editions of the underlying document. A finer cross-cycle
   audit would track document-level identity across cycles.
4. **Winter 2025 evidence base is minimal.** The Winter 2025
   evidence base is a hand-curated snapshot capturing the major
   documents; it is not a comprehensive record of every cited
   excerpt. Treat the Winter 2025 lineage counts as lower bounds.

---

## 8. What this is not

- Not a critique of FLI's panel structure as such. The panel has
  structure; this toolkit surfaces some of that structure.
- Not a replacement for FLI's reviewer panel. Reviewers bring
  expertise that no automated method can replicate.
- Not a re-grading of any company. The toolkit surfaces
  structure; the policy response belongs to FLI.
- Not a real-time monitoring system. It analyses a snapshot of
  published evidence at a point in time.

---

_Regenerate this report with_ `npm run eval:report`.
