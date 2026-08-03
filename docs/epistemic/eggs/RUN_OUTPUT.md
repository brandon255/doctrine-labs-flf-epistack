# Epistemic case report

**Case:** `docs/epistemic/eggs`
**Loaded:** evidence_blocks.json

_Regenerate with_ `node scripts/epistemic-run.js eggs`.

## Assessment (auto)

9 excerpts cited, drawn from 5 documents, tracing to 5 independent lineage(s). Treat as 5 independent source(s), not 9.

| Level | Count | What it counts |
|-------|-------|----------------|
| 1 — claims | 9 | Excerpts cited |
| 2 — documents | 5 | Distinct bibliographic sources |
| 3 — lineages | **5** | **Independent observations of the world** |

Citation inflation factor: **1.8x** — the corpus *looks* 9 sources deep and is 5.

| Metric | Value |
|--------|-------|
| Documents with multiple excerpts | 3 |
| Lineages spanning multiple documents | 0 |
| Graph edges (total) | 14 |

## Level 3 — independent lineages

- **`flf-epistack-brief-eggs`** — 2 excerpt(s) across 1 document(s)
  - `flf-epistack-competition-brief-eggs` (framing)
- **`lesser-industry-funding-2007`** — 2 excerpt(s) across 1 document(s)
  - `lesser-plos-med-2007-funding-bias` (primary_analysis)
- **`doctrine-labs-inference`** — 1 excerpt(s) across 1 document(s)
  - `doctrine-labs-eggs-gap-note` (inference)
- **`zhong-pooled-cohort-2019`** — 3 excerpt(s) across 1 document(s)
  - `zhong-jama-2019-pooled-cohort` (primary_analysis)
- **`us-dietary-guidelines-2015`** — 1 excerpt(s) across 1 document(s)
  - `us-dga-2015-advisory-report` (guideline)

## Level 2 — documents

- `flf-epistack-competition-brief-eggs` | correlated — **2 excerpts, one source**: eggs-seed-001, eggs-seed-002
- `lesser-plos-med-2007-funding-bias` | correlated — **2 excerpts, one source**: eggs-seed-003, eggs-primary-funding-plos-4
- `doctrine-labs-eggs-gap-note` | independent: eggs-seed-004
- `zhong-jama-2019-pooled-cohort` | correlated — **3 excerpts, one source**: eggs-primary-jama-half-egg-1, eggs-primary-jama-cholesterol-adjust-2, eggs-primary-jama-pooled-cohort-5
- `us-dga-2015-advisory-report` | independent: eggs-primary-dga-2015-3

## Blocks

- `eggs-seed-001` | MEDIUM | correlated | Dietary guidelines have shifted egg recommendations multiple times over decades (FLF case framing).
- `eggs-seed-002` | FLAGGED | correlated | Observational studies linking egg consumption to cardiovascular outcomes often share overlapping cohorts (genealogy hypo...
- `eggs-seed-003` | LOW | correlated | Industry-funded nutrition research may correlate with favorable outcomes for funded foods (general epidemiology concern)...
- `eggs-seed-004` | LOW | independent | Gap closed: JAMA 2019 and related primaries ingested as eggs-primary-* (former MISSING validation task).
- `eggs-primary-jama-half-egg-1` | HIGH | correlated | Zhong et al. (JAMA 2019) found each additional half egg per day associated with higher incident CVD (adjusted HR 1.06) a...
- `eggs-primary-jama-cholesterol-adjust-2` | HIGH | correlated | In the same JAMA 2019 analysis, egg-CVD and egg-mortality associations were no longer significant after adjusting for to...
- `eggs-primary-dga-2015-3` | MEDIUM | independent | The 2015–2020 Dietary Guidelines Advisory Committee recommended dropping the specific dietary cholesterol limit, reflect...
- `eggs-primary-funding-plos-4` | HIGH | correlated | Lesser et al. (PLOS Medicine 2007) found industry-funded beverage nutrition articles were approximately four to eight ti...
- `eggs-primary-jama-pooled-cohort-5` | HIGH | correlated | Zhong et al. pooled 29,615 participants from NHANES and REGARDS — a single pooled analysis, not independent cohorts — fo...

## same_document edges (one source, restated)

- eggs-seed-001 <-> eggs-seed-002 (Both excerpted from flf-epistack-competition-brief-eggs (2 excerpts). One source, not 2.)
- eggs-primary-funding-plos-4 <-> eggs-seed-003 (Both excerpted from lesser-plos-med-2007-funding-bias (2 excerpts). One source, not 2.)
- eggs-primary-jama-cholesterol-adjust-2 <-> eggs-primary-jama-half-egg-1 (Both excerpted from zhong-jama-2019-pooled-cohort (3 excerpts). One source, not 3.)
- eggs-primary-jama-cholesterol-adjust-2 <-> eggs-primary-jama-pooled-cohort-5 (Both excerpted from zhong-jama-2019-pooled-cohort (3 excerpts). One source, not 3.)
- eggs-primary-jama-half-egg-1 <-> eggs-primary-jama-pooled-cohort-5 (Both excerpted from zhong-jama-2019-pooled-cohort (3 excerpts). One source, not 3.)

## Human review required

- Blocks with confidence FLAGGED or LOW need promotion before use in argument.
- Documents sharing a lineage must not be counted as independent confirmations.
- Lineage assignments are judgments. Check `source_registry.json` and override where you disagree.
- Missing or unverifiable sources should be demoted, not silently dropped.

## Steering log

- Ingest events: `steering_log.jsonl` in case folder.

