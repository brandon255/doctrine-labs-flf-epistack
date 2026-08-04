# Epistemic case report

**Case:** `docs/epistemic/self`
**Loaded:** evidence_blocks.json

_Regenerate with_ `node scripts/epistemic-run.js self`.

## Assessment (auto)

8 excerpts cited, drawn from 7 documents, tracing to 4 independent lineage(s). Treat as 4 independent source(s), not 8.

| Level | Count | What it counts |
|-------|-------|----------------|
| 1 — claims | 8 | Excerpts cited |
| 2 — documents | 7 | Distinct bibliographic sources |
| 3 — lineages | **4** | **Independent observations of the world** |

Citation inflation factor: **2x** — the corpus *looks* 8 sources deep and is 4.

| Metric | Value |
|--------|-------|
| Documents with multiple excerpts | 1 |
| Lineages spanning multiple documents | 2 |
| Graph edges (total) | 8 |

## Level 3 — independent lineages

- **`coreos-repo-state`** — 3 excerpt(s) across 3 document(s)
  - `coreos-repo-commit-count` (measurement)
  - `coreos-repo-test-count` (measurement)
  - `coreos-repo-first-commit` (measurement)
- **`epistack-repo-state`** — 2 excerpt(s) across 2 document(s)
  - `epistack-repo-transcript-file-count` (measurement)
  - `epistack-repo-test-count` (measurement)
- **`provider-timestamps`** — 1 excerpt(s) across 1 document(s)
  - `provider-issued-timestamps` (independent_analysis)
- **`subject-assertion`** — 2 excerpt(s) across 1 document(s)
  - `builder-self-assertion` (participant)

## Level 2 — documents

- `coreos-repo-commit-count` | independent: self-commits-coreos
- `coreos-repo-test-count` | independent: self-tests-coreos
- `coreos-repo-first-commit` | independent: self-first-commit
- `epistack-repo-transcript-file-count` | independent: self-commits-epistack
- `epistack-repo-test-count` | independent: self-tests-epistack
- `provider-issued-timestamps` | independent: self-19-day-span
- `builder-self-assertion` | correlated — **2 excerpts, one source**: self-rarity-funnel-FLAWED, self-lineage-correlation-FLAWED

## Declared derivations

Where one document's reasoning is built on another's. These are not independent.

- `coreos-repo-test-count` derives from `coreos-repo-commit-count`
  - Declared derivation.
- `coreos-repo-first-commit` derives from `coreos-repo-commit-count`
  - Declared derivation.
- `epistack-repo-test-count` derives from `epistack-repo-transcript-file-count`
  - Declared derivation.

## Blocks

- `self-commits-coreos` | HIGH | independent | Core OS has 94 commits under version control.
- `self-tests-coreos` | HIGH | independent | Core OS has 536 passing automated tests.
- `self-first-commit` | HIGH | independent | The first Core OS commit is dated 2026-05-31.
- `self-commits-epistack` | HIGH | independent | docs/transcripts/ contains 26 files (25 frozen adjudication runs plus the README index).
- `self-tests-epistack` | HIGH | independent | The FLF Epistemic Stack has 188 passing automated tests with zero runtime dependencies.
- `self-19-day-span` | HIGH | independent | Nineteen days elapsed between the first dated user-attested artifact and the first Core OS commit.
- `self-rarity-funnel-FLAWED` | LOW | correlated | The builder ranks in the single digits globally via eleven multiplicative prevalence layers.
- `self-lineage-correlation-FLAWED` | LOW | correlated | Trait A (prevalence ~3%) multiplied by correlated Trait B within that group (300% more likely) yields a jo...

## same_document edges (one source, restated)

- self-lineage-correlation-FLAWED <-> self-rarity-funnel-FLAWED (Both excerpted from builder-self-assertion (2 excerpts). One source, not 2.)

## same_lineage edges (shared underlying event)

- coreos-repo-commit-count <-> coreos-repo-first-commit (Both draw on coreos-repo-state. Agreement between them is weak corroboration.)
- coreos-repo-commit-count <-> coreos-repo-test-count (Both draw on coreos-repo-state. Agreement between them is weak corroboration.)
- coreos-repo-first-commit <-> coreos-repo-test-count (Both draw on coreos-repo-state. Agreement between them is weak corroboration.)
- epistack-repo-test-count <-> epistack-repo-transcript-file-count (Both draw on epistack-repo-state. Agreement between them is weak corroboration.)

## Human review required

- Blocks with confidence FLAGGED or LOW need promotion before use in argument.
- Documents sharing a lineage must not be counted as independent confirmations.
- Lineage assignments are judgments. Check `source_registry.json` and override where you disagree.
- Missing or unverifiable sources should be demoted, not silently dropped.

## Steering log

- Ingest events: `steering_log.jsonl` in case folder.

