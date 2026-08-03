# Epistemic case report

**Case:** `docs/epistemic/sample`
**Loaded:** evidence_blocks.json

_Regenerate with_ `node scripts/epistemic-run.js sample`.

## Assessment (auto)

3 excerpts cited, drawn from 2 documents, tracing to 2 independent lineage(s). Treat as 2 independent source(s), not 3.

| Level | Count | What it counts |
|-------|-------|----------------|
| 1 — claims | 3 | Excerpts cited |
| 2 — documents | 2 | Distinct bibliographic sources |
| 3 — lineages | **2** | **Independent observations of the world** |

Citation inflation factor: **1.5x** — the corpus *looks* 3 sources deep and is 2.

| Metric | Value |
|--------|-------|
| Documents with multiple excerpts | 1 |
| Lineages spanning multiple documents | 0 |
| Graph edges (total) | 1 |

## Level 3 — independent lineages

- **`acme-coating-report-2024`** — 2 excerpt(s) across 1 document(s)
  - `acme-coating-report-2024` (unknown)
- **`independent-lab-study-2023`** — 1 excerpt(s) across 1 document(s)
  - `independent-lab-study-2023` (unknown)

## Level 2 — documents

- `acme-coating-report-2024` | correlated — **2 excerpts, one source**: sample-1, sample-2
- `independent-lab-study-2023` | independent: sample-3

## Blocks

- `sample-1` | HIGH | correlated | EXAMPLE ONLY. A primary report concludes that the new bridge coating lasts twenty years.
- `sample-2` | MEDIUM | correlated | EXAMPLE ONLY. A news article repeats the twenty-year figure for the bridge coating.
- `sample-3` | HIGH | independent | EXAMPLE ONLY. A separate lab, funded and run independently, measured a fifteen-year coating life.

## same_document edges (one source, restated)

- sample-1 <-> sample-2 (Both excerpted from acme-coating-report-2024 (2 excerpts). One source, not 2.)

## Human review required

- Blocks with confidence FLAGGED or LOW need promotion before use in argument.
- Documents sharing a lineage must not be counted as independent confirmations.
- Lineage assignments are judgments. Check `source_registry.json` and override where you disagree.
- Missing or unverifiable sources should be demoted, not silently dropped.

## Steering log

- Ingest events: `steering_log.jsonl` in case folder.

