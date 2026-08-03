# Epistemic case report

**Case:** `docs/epistemic/covid`
**Loaded:** evidence_blocks.json

_Regenerate with_ `node scripts/epistemic-run.js covid`.

## Assessment (auto)

21 excerpts cited, drawn from 8 documents, tracing to 3 independent lineage(s). Treat as 3 independent source(s), not 21.

| Level | Count | What it counts |
|-------|-------|----------------|
| 1 — claims | 21 | Excerpts cited |
| 2 — documents | 8 | Distinct bibliographic sources |
| 3 — lineages | **3** | **Independent observations of the world** |

Citation inflation factor: **7x** — the corpus *looks* 21 sources deep and is 3.

| Metric | Value |
|--------|-------|
| Documents with multiple excerpts | 6 |
| Lineages spanning multiple documents | 1 |
| Graph edges (total) | 52 |

## Level 3 — independent lineages

- **`wilf-miller-debate-2024-02`** — 16 excerpt(s) across 6 document(s)
  - `flf-epistack-competition-brief` (derivative_summary)
  - `rootclaim-debate-results-2024-02` (participant)
  - `vantreuren-covid-debate-decision-2024` (judge)
  - `stansifer-covid-debate-decision-2024` (judge)
  - `astralcodexten-rootclaim-debate-review` (observer)
  - `rootclaim-response-to-acx-2024-05` (participant)
- **`doctrine-labs-inference`** — 1 excerpt(s) across 1 document(s)
  - `doctrine-labs-crux-hypothesis` (inference)
- **`weissman-bayesian-analysis-2024`** — 4 excerpt(s) across 1 document(s)
  - `weissman-inconvenient-probability-v511` (independent_analysis)

## Level 2 — documents

- `flf-epistack-competition-brief` | correlated — **3 excerpts, one source**: covid-seed-001, covid-seed-002, covid-seed-004
- `rootclaim-debate-results-2024-02` | correlated — **3 excerpts, one source**: covid-seed-003, covid-primary-rootclaim-format-critique-1-14, covid-primary-rootclaim-format-critique-2-15
- `doctrine-labs-crux-hypothesis` | independent: covid-seed-005
- `vantreuren-covid-debate-decision-2024` | correlated — **3 excerpts, one source**: covid-primary-will-decision-doc-1, covid-primary-will-decision-bayes-2, covid-primary-will-decision-inconsistency-3
- `stansifer-covid-debate-decision-2024` | correlated — **3 excerpts, one source**: covid-primary-eric-decision-pdf-4, covid-primary-eric-decision-genetics-5, covid-primary-eric-decision-probability-6
- `weissman-inconvenient-probability-v511` | correlated — **4 excerpts, one source**: covid-primary-weissman-prior-sensitivity-7, covid-primary-weissman-wuhan-geographic-prior-8, covid-primary-weissman-oom-spread-9, covid-primary-weissman-conclusion-10
- `astralcodexten-rootclaim-debate-review` | correlated — **3 excerpts, one source**: covid-primary-sa-verdict-11, covid-primary-sa-oom-spread-12, covid-primary-sa-rootclaim-method-13
- `rootclaim-response-to-acx-2024-05` | independent: covid-primary-rootclaim-probabilistic-failure-16

## Declared derivations

Where one document's reasoning is built on another's. These are not independent.

- `vantreuren-covid-debate-decision-2024` derives from `weissman-inconvenient-probability-v511`
  - Author states in the decision: 'In my Bayesian analysis, modeled after Michael Weissman's analysis'.
- `weissman-inconvenient-probability-v511` derives from `astralcodexten-rootclaim-debate-review`
  - The odds-spread claim cites estimates 'presented on Scott Alexander's blog'; that portion is not independent of the ACX collection.
- `rootclaim-response-to-acx-2024-05` derives from `astralcodexten-rootclaim-debate-review`
  - Written as a direct rebuttal to the ACX review.
- `flf-epistack-competition-brief` derives from `astralcodexten-rootclaim-debate-review`
  - The brief's COVID framing and the 23-orders-of-magnitude figure summarise the ACX review.

## Blocks

- `covid-seed-001` | MEDIUM | correlated | Two expert judges ruled decisively for zoonosis in the Wilf–Miller COVID origins debate (FLF case summary).
- `covid-seed-002` | MEDIUM | correlated | Six independent Bayesian analyses of the same COVID origins evidence reportedly spanned 23 orders of magnitude in their ...
- `covid-seed-003` | MEDIUM | correlated | Rootclaim argued debate structure favored the debater with more memorized issue-specific knowledge (per FLF footnote cit...
- `covid-seed-004` | HIGH | correlated | The public debate record is difficult to navigate without significant background expertise (FLF case framing).
- `covid-seed-005` | FLAGGED | independent | Crux identification: if prior choice on geographic clustering of early cases shifts posterior odds by orders of magnitud...
- `covid-primary-will-decision-doc-1` | HIGH | correlated | Judge Will explicitly framed his vote as a truth-seeking determination, not a procedural debate judgment.
- `covid-primary-will-decision-bayes-2` | HIGH | correlated | Judge Will's Bayesian computation placed the posterior probability of lab leak at approximately 1-in-300 (~0.3%).
- `covid-primary-will-decision-inconsistency-3` | HIGH | correlated | Judge Will identified internal inconsistency and selective evidence presentation as the primary reasons he discounted th...
- `covid-primary-eric-decision-pdf-4` | HIGH | correlated | Judge Eric's primary evidentiary basis was epidemiological proximity of the earliest cases to the Huanan Seafood Market ...
- `covid-primary-eric-decision-genetics-5` | HIGH | correlated | Judge Eric held that anomalous genetic features of SARS-CoV-2 (including the furin cleavage site) were insufficient to o...
- `covid-primary-eric-decision-probability-6` | HIGH | correlated | Eric's prior probabilities placed the annual lab-leak risk (1/17,000) roughly twice as high as the annual zoonotic-at-HS...
- `covid-primary-weissman-prior-sensitivity-7` | HIGH | correlated | Weissman identifies prior uncertainty as asymmetrically more damaging to inference than likelihood uncertainty — large B...
- `covid-primary-weissman-wuhan-geographic-prior-8` | HIGH | correlated | Weissman's key geographic crux: the pandemic starting in Wuhan constitutes a ~100x Bayes factor favoring lab leak over z...
- `covid-primary-weissman-oom-spread-9` | HIGH | correlated | Even among analysts using the same Bayesian framework on the same evidence, prior odds estimates at the equivalent stage...
- `covid-primary-weissman-conclusion-10` | HIGH | correlated | Weissman concludes that after uncertainty-discounting, only a prior of less than 1-in-1,300,000 for lab leak would preve...
- `covid-primary-sa-verdict-11` | HIGH | correlated | Scott Alexander updated from near-even odds to 90% zoonosis after reviewing the full debate, representing a substantial ...
- `covid-primary-sa-oom-spread-12` | HIGH | correlated | When analysts quantified the debate evidence Bayesian-style, their numerical outputs spanned 23 orders of magnitude in t...
- `covid-primary-sa-rootclaim-method-13` | HIGH | correlated | Scott Alexander identifies Rootclaim's systematic Bayesian quantification as not replicably workable in practice due to ...
- `covid-primary-rootclaim-format-critique-1-14` | HIGH | correlated | Rootclaim's primary structural critique is that live oral debate systematically advantages the side with superior recall...
- `covid-primary-rootclaim-format-critique-2-15` | HIGH | correlated | Rootclaim argues that without iterative judge feedback during the debate, they wasted time on non-crux evidence and coul...
- `covid-primary-rootclaim-probabilistic-failure-16` | HIGH | independent | Rootclaim contends that the judges committed a single identifiable probabilistic inference error — treating HSM workers ...

## same_document edges (one source, restated)

- covid-seed-001 <-> covid-seed-002 (Both excerpted from flf-epistack-competition-brief (3 excerpts). One source, not 3.)
- covid-seed-001 <-> covid-seed-004 (Both excerpted from flf-epistack-competition-brief (3 excerpts). One source, not 3.)
- covid-seed-002 <-> covid-seed-004 (Both excerpted from flf-epistack-competition-brief (3 excerpts). One source, not 3.)
- covid-primary-rootclaim-format-critique-1-14 <-> covid-primary-rootclaim-format-critique-2-15 (Both excerpted from rootclaim-debate-results-2024-02 (3 excerpts). One source, not 3.)
- covid-primary-rootclaim-format-critique-1-14 <-> covid-seed-003 (Both excerpted from rootclaim-debate-results-2024-02 (3 excerpts). One source, not 3.)
- covid-primary-rootclaim-format-critique-2-15 <-> covid-seed-003 (Both excerpted from rootclaim-debate-results-2024-02 (3 excerpts). One source, not 3.)
- covid-primary-will-decision-bayes-2 <-> covid-primary-will-decision-doc-1 (Both excerpted from vantreuren-covid-debate-decision-2024 (3 excerpts). One source, not 3.)
- covid-primary-will-decision-bayes-2 <-> covid-primary-will-decision-inconsistency-3 (Both excerpted from vantreuren-covid-debate-decision-2024 (3 excerpts). One source, not 3.)
- covid-primary-will-decision-doc-1 <-> covid-primary-will-decision-inconsistency-3 (Both excerpted from vantreuren-covid-debate-decision-2024 (3 excerpts). One source, not 3.)
- covid-primary-eric-decision-genetics-5 <-> covid-primary-eric-decision-pdf-4 (Both excerpted from stansifer-covid-debate-decision-2024 (3 excerpts). One source, not 3.)
- covid-primary-eric-decision-genetics-5 <-> covid-primary-eric-decision-probability-6 (Both excerpted from stansifer-covid-debate-decision-2024 (3 excerpts). One source, not 3.)
- covid-primary-eric-decision-pdf-4 <-> covid-primary-eric-decision-probability-6 (Both excerpted from stansifer-covid-debate-decision-2024 (3 excerpts). One source, not 3.)
- covid-primary-weissman-conclusion-10 <-> covid-primary-weissman-oom-spread-9 (Both excerpted from weissman-inconvenient-probability-v511 (4 excerpts). One source, not 4.)
- covid-primary-weissman-conclusion-10 <-> covid-primary-weissman-prior-sensitivity-7 (Both excerpted from weissman-inconvenient-probability-v511 (4 excerpts). One source, not 4.)
- covid-primary-weissman-conclusion-10 <-> covid-primary-weissman-wuhan-geographic-prior-8 (Both excerpted from weissman-inconvenient-probability-v511 (4 excerpts). One source, not 4.)
- covid-primary-weissman-oom-spread-9 <-> covid-primary-weissman-prior-sensitivity-7 (Both excerpted from weissman-inconvenient-probability-v511 (4 excerpts). One source, not 4.)
- covid-primary-weissman-oom-spread-9 <-> covid-primary-weissman-wuhan-geographic-prior-8 (Both excerpted from weissman-inconvenient-probability-v511 (4 excerpts). One source, not 4.)
- covid-primary-weissman-prior-sensitivity-7 <-> covid-primary-weissman-wuhan-geographic-prior-8 (Both excerpted from weissman-inconvenient-probability-v511 (4 excerpts). One source, not 4.)
- covid-primary-sa-oom-spread-12 <-> covid-primary-sa-rootclaim-method-13 (Both excerpted from astralcodexten-rootclaim-debate-review (3 excerpts). One source, not 3.)
- covid-primary-sa-oom-spread-12 <-> covid-primary-sa-verdict-11 (Both excerpted from astralcodexten-rootclaim-debate-review (3 excerpts). One source, not 3.)
- covid-primary-sa-rootclaim-method-13 <-> covid-primary-sa-verdict-11 (Both excerpted from astralcodexten-rootclaim-debate-review (3 excerpts). One source, not 3.)

## same_lineage edges (shared underlying event)

- astralcodexten-rootclaim-debate-review <-> flf-epistack-competition-brief (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- astralcodexten-rootclaim-debate-review <-> rootclaim-debate-results-2024-02 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- astralcodexten-rootclaim-debate-review <-> rootclaim-response-to-acx-2024-05 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- astralcodexten-rootclaim-debate-review <-> stansifer-covid-debate-decision-2024 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- astralcodexten-rootclaim-debate-review <-> vantreuren-covid-debate-decision-2024 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- flf-epistack-competition-brief <-> rootclaim-debate-results-2024-02 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- flf-epistack-competition-brief <-> rootclaim-response-to-acx-2024-05 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- flf-epistack-competition-brief <-> stansifer-covid-debate-decision-2024 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- flf-epistack-competition-brief <-> vantreuren-covid-debate-decision-2024 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- rootclaim-debate-results-2024-02 <-> rootclaim-response-to-acx-2024-05 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- rootclaim-debate-results-2024-02 <-> stansifer-covid-debate-decision-2024 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- rootclaim-debate-results-2024-02 <-> vantreuren-covid-debate-decision-2024 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- rootclaim-response-to-acx-2024-05 <-> stansifer-covid-debate-decision-2024 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- rootclaim-response-to-acx-2024-05 <-> vantreuren-covid-debate-decision-2024 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)
- stansifer-covid-debate-decision-2024 <-> vantreuren-covid-debate-decision-2024 (Both draw on wilf-miller-debate-2024-02. Agreement between them is weak corroboration.)

## Human review required

- Blocks with confidence FLAGGED or LOW need promotion before use in argument.
- Documents sharing a lineage must not be counted as independent confirmations.
- Lineage assignments are judgments. Check `source_registry.json` and override where you disagree.
- Missing or unverifiable sources should be demoted, not silently dropped.

## Steering log

- Ingest events: `steering_log.jsonl` in case folder.

