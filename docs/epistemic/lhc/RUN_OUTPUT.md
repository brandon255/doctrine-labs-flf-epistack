# Epistemic case report

**Case:** `docs/epistemic/lhc`
**Loaded:** evidence_blocks.json

_Regenerate with_ `node scripts/epistemic-run.js lhc`.

## Assessment (auto)

9 excerpts cited, drawn from 5 documents, tracing to 3 independent lineage(s). Treat as 3 independent source(s), not 9.

| Level | Count | What it counts |
|-------|-------|----------------|
| 1 — claims | 9 | Excerpts cited |
| 2 — documents | 5 | Distinct bibliographic sources |
| 3 — lineages | **3** | **Independent observations of the world** |

Citation inflation factor: **3x** — the corpus *looks* 9 sources deep and is 3.

| Metric | Value |
|--------|-------|
| Documents with multiple excerpts | 3 |
| Lineages spanning multiple documents | 1 |
| Graph edges (total) | 22 |

## Level 3 — independent lineages

- **`cern-lsag-safety-assessment-2008`** — 6 excerpt(s) across 3 document(s)
  - `flf-epistack-competition-brief-lhc` (derivative_summary)
  - `lsag-safety-report-2008` (primary_assessment)
  - `cern-lhc-safety-public-page` (derivative_summary)
- **`plaga-critique-2008`** — 2 excerpt(s) across 1 document(s)
  - `plaga-residual-risk-2008` (critique)
- **`doctrine-labs-inference`** — 1 excerpt(s) across 1 document(s)
  - `doctrine-labs-lhc-gap-note` (inference)

## Level 2 — documents

- `flf-epistack-competition-brief-lhc` | correlated — **2 excerpts, one source**: lhc-seed-001, lhc-seed-002
- `plaga-residual-risk-2008` | correlated — **2 excerpts, one source**: lhc-seed-003, lhc-primary-plaga-residual-4
- `doctrine-labs-lhc-gap-note` | independent: lhc-seed-004
- `lsag-safety-report-2008` | correlated — **3 excerpts, one source**: lhc-primary-lsag-cosmic-1, lhc-primary-lsag-conclusion-2, lhc-primary-lsag-mbh-3
- `cern-lhc-safety-public-page` | independent: lhc-primary-cern-popular-5

## Declared derivations

Where one document's reasoning is built on another's. These are not independent.

- `cern-lhc-safety-public-page` derives from `lsag-safety-report-2008`
  - The public page summarises the LSAG report and cites it as its basis.
- `plaga-residual-risk-2008` derives from `lsag-safety-report-2008`
  - Written as a critique of the LSAG safety argument.
- `flf-epistack-competition-brief-lhc` derives from `cern-lhc-safety-public-page`
  - The brief poses the question by quoting CERN's public FAQ.

## Blocks

- `lhc-seed-001` | MEDIUM | correlated | CERN and the LHC Safety Assessment Group concluded that LHC collisions pose no conceivable danger (FLF case summary).
- `lhc-seed-002` | MEDIUM | correlated | Public summaries of LHC safety often restate the same official risk assessment without independent analysis (FLF framing...
- `lhc-seed-003` | FLAGGED | correlated | Critics argued cosmic-ray analogy may not transfer to controlled collider conditions (hypothesis — needs primary cite).
- `lhc-seed-004` | LOW | independent | Gap closed: LSAG primary excerpts ingested as lhc-primary-lsag-* (former MISSING validation task).
- `lhc-primary-lsag-cosmic-1` | HIGH | correlated | LSAG states the LHC reproduces collisions at energies less than those reached in the atmosphere by cosmic rays that have...
- `lhc-primary-lsag-conclusion-2` | HIGH | correlated | LSAG concludes there is no basis for any conceivable threat from the LHC, reaffirming the 2003 LHC Safety Study Group.
- `lhc-primary-lsag-mbh-3` | HIGH | correlated | LSAG argues microscopic black holes produced at the LHC would present no conceivable danger, including via accretion con...
- `lhc-primary-plaga-residual-4` | FLAGGED | correlated | Astrophysicist Rainer Plaga argued that at the present stage of knowledge a residual risk from micro-black-hole producti...
- `lhc-primary-cern-popular-5` | MEDIUM | independent | CERN's public safety page states Nature has already performed LHC-like collision rates on Earth and astronomical bodies ...

## same_document edges (one source, restated)

- lhc-seed-001 <-> lhc-seed-002 (Both excerpted from flf-epistack-competition-brief-lhc (2 excerpts). One source, not 2.)
- lhc-primary-plaga-residual-4 <-> lhc-seed-003 (Both excerpted from plaga-residual-risk-2008 (2 excerpts). One source, not 2.)
- lhc-primary-lsag-conclusion-2 <-> lhc-primary-lsag-cosmic-1 (Both excerpted from lsag-safety-report-2008 (3 excerpts). One source, not 3.)
- lhc-primary-lsag-conclusion-2 <-> lhc-primary-lsag-mbh-3 (Both excerpted from lsag-safety-report-2008 (3 excerpts). One source, not 3.)
- lhc-primary-lsag-cosmic-1 <-> lhc-primary-lsag-mbh-3 (Both excerpted from lsag-safety-report-2008 (3 excerpts). One source, not 3.)

## same_lineage edges (shared underlying event)

- cern-lhc-safety-public-page <-> flf-epistack-competition-brief-lhc (Both draw on cern-lsag-safety-assessment-2008. Agreement between them is weak corroboration.)
- cern-lhc-safety-public-page <-> lsag-safety-report-2008 (Both draw on cern-lsag-safety-assessment-2008. Agreement between them is weak corroboration.)
- flf-epistack-competition-brief-lhc <-> lsag-safety-report-2008 (Both draw on cern-lsag-safety-assessment-2008. Agreement between them is weak corroboration.)

## Human review required

- Blocks with confidence FLAGGED or LOW need promotion before use in argument.
- Documents sharing a lineage must not be counted as independent confirmations.
- Lineage assignments are judgments. Check `source_registry.json` and override where you disagree.
- Missing or unverifiable sources should be demoted, not silently dropped.

## Steering log

- Ingest events: `steering_log.jsonl` in case folder.

