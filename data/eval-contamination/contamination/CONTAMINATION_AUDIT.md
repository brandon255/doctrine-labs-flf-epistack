# Contamination Audit — Benchmark Citation Independence

**Source:** Epistack engine run on the FLI AI Safety Index evidence base (Winter 2025 + Summer 2026).

**Total blocks audited:** 142
**Total distinct URLs cited:** 57
**Total distinct hosts:** 21

## Methodology

For each cited benchmark / source URL, we count how many FLI Index
evidence excerpts cite it. A *contamination ratio* > 1 indicates that
the host serves as a single underlying measurement that has been cited
multiple times. A ratio > 4 indicates that the host is structurally
important and likely over-represented in the cited evidence base.

## Headline: hosts with the highest contamination

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

## Per-company citation inflation

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

## What this means

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
