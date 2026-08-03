# Transcript — `covid` · settled

> Captured so this can be read without installing anything. Verbatim, including failures. Regenerate with `node scripts/freeze-transcripts.js covid settled`.

| Field | Value |
|---|---|
| Case | `covid` |
| Job | `settled` — Distinguish what the debate settled from what it merely performed settling |
| Question | Which questions in this corpus were actually settled by evidence, and which merely had the appearance of settlement — closed by authority, exhaustion, or rhetorical victory rather than by resolving the underlying uncertainty? |
| Captured | 2026-08-03T21:48:15.612Z |
| Wall time | 76.1s |
| Proposer | `llama3.1:8b` (lineage `llama-3.1`) |
| Model challenger | `qwen2.5:14b` (lineage `qwen-2.5`) |
| Mechanical challenger | always runs, lineage `deterministic` |

**Corpus:** 21 excerpts cited, drawn from 8 documents, tracing to 3 independent lineage(s). Treat as 3 independent source(s), not 21.

---

## The record

``````
## settled — CONTESTED

**Question:** Which questions in this corpus were actually settled by evidence, and which merely had the appearance of settlement — closed by authority, exhaustion, or rhetorical victory rather than by resolving the underlying uncertainty?

**Conclusion:** The evidence corpus contains both settled and non-settled questions. Settled questions include the origin of SARS-CoV-2, with multiple judges concluding zoonosis as the most likely origin. Non-settled questions include the role of prior probabilities in Bayesian analysis, with Weissman's conclusion being at odds with the results of Judges Will and Eric.

**Load-bearing assumption:** The judges' conclusions are based on a thorough examination of the evidence

### Shown work (2/2 steps verified)

PASS — step 1. Multiple judges concluded that zoonosis is the most likely origin of SARS-CoV-2
   cites: covid-primary-will-decision-doc-1, covid-primary-eric-decision-pdf-4
   quote: "I viewed this debate as a truth-seeking exercise with my vote reflecting what I found to be the most plausible origin of SARS-CoV-2, subject to the constraint t…"
   quote located in covid-primary-will-decision-doc-1
PASS — step 2. Weissman's conclusion is at odds with Judges Will and Eric
   cites: covid-primary-weissman-conclusion-10, covid-primary-will-decision-bayes-2, covid-primary-eric-decision-probability-6
   quote: "Unless one has priors of less than about 1/1,300,000, the result favors LL over ZW."
   quote located in covid-primary-weissman-conclusion-10

### Challenge panel — independence: MODERATE

2 challenge(s), of which 2 independent lineage(s). Proposer lineage: llama-3.1.

[INDEPENDENT] mechanical — overstated / medium
   lineage: deterministic
   1 block(s) qualify or dispute cited evidence and were not addressed: covid-seed-001.
   - C1 coverage [low]: The reasoning cites 5 of 21 blocks (24%). A conclusion about the corpus drawn from a minority of it may be reading a subset that happens to agree.
   - C4 uncited counter-evidence [medium]: 1 block(s) qualify or dispute cited evidence and were not addressed: covid-seed-001.

[INDEPENDENT] cross_lineage_model (qwen2.5:14b) — overstated / medium
   lineage: qwen-2.5
   The conclusion that the origin of SARS-CoV-2 is settled based on judges' decisions may be premature. Judge Will's Bayesian analysis and prior probabilities, as well as Weissman's critique, suggest significant uncertainty and sensitivity to initial assumptions.

> Independence is moderate. Two ways up: record your own
> position (→ strong, in the UI at 'npm start'), or install a
> model from a different weight lineage — see models/registry.json.


### Your move

Accept, override, or rerun. Nothing has been written to the corpus.

You are the only challenger available here that is not a model. Recording a
position is the one thing that raises independence to 'strong' — in the local
UI at 'npm start', stage 4.
``````

## Machine-readable

<details><summary>Full JSON record</summary>

```json
{
  "job_type": "settled",
  "question": "Which questions in this corpus were actually settled by evidence, and which merely had the appearance of settlement — closed by authority, exhaustion, or rhetorical victory rather than by resolving the underlying uncertainty?",
  "started_at": "2026-08-03T21:48:15.612Z",
  "completed_at": "2026-08-03T21:49:31.757Z",
  "model": "llama3.1:8b",
  "proposer_lineage": "llama-3.1",
  "conclusion": "The evidence corpus contains both settled and non-settled questions. Settled questions include the origin of SARS-CoV-2, with multiple judges concluding zoonosis as the most likely origin. Non-settled questions include the role of prior probabilities in Bayesian analysis, with Weissman's conclusion being at odds with the results of Judges Will and Eric.",
  "confidence": "MEDIUM",
  "assumption": "The judges' conclusions are based on a thorough examination of the evidence",
  "reasoning": [
    {
      "index": 1,
      "step": "Multiple judges concluded that zoonosis is the most likely origin of SARS-CoV-2",
      "cites": [
        "covid-primary-will-decision-doc-1",
        "covid-primary-eric-decision-pdf-4"
      ],
      "quote": "I viewed this debate as a truth-seeking exercise with my vote reflecting what I found to be the most plausible origin of SARS-CoV-2, subject to the constraint that I would rely on (to the greatest degree possible) claims made by the debaters.",
      "ok": true,
      "weak": false,
      "checks": [
        {
          "cite": "covid-primary-will-decision-doc-1",
          "ok": true,
          "reason": "block exists"
        },
        {
          "cite": "covid-primary-eric-decision-pdf-4",
          "ok": true,
          "reason": "block exists"
        },
        {
          "ok": true,
          "reason": "quote located in covid-primary-will-decision-doc-1"
        }
      ]
    },
    {
      "index": 2,
      "step": "Weissman's conclusion is at odds with Judges Will and Eric",
      "cites": [
        "covid-primary-weissman-conclusion-10",
        "covid-primary-will-decision-bayes-2",
        "covid-primary-eric-decision-probability-6"
      ],
      "quote": "Unless one has priors of less than about 1/1,300,000, the result favors LL over ZW.",
      "ok": true,
      "weak": false,
      "checks": [
        {
          "cite": "covid-primary-weissman-conclusion-10",
          "ok": true,
          "reason": "block exists"
        },
        {
          "cite": "covid-primary-will-decision-bayes-2",
          "ok": true,
          "reason": "block exists"
        },
        {
          "cite": "covid-primary-eric-decision-probability-6",
          "ok": true,
          "reason": "block exists"
        },
        {
          "ok": true,
          "reason": "quote located in covid-primary-weissman-conclusion-10"
        }
      ]
    }
  ],
  "verification": {
    "verified": true,
    "verified_steps": 2,
    "weak_steps": 0,
    "total_steps": 2,
    "failures": []
  },
  "challenge_panel": {
    "challenges": [
      {
        "route": "mechanical",
        "lineage_id": "deterministic",
        "independent": true,
        "model": null,
        "verdict": "overstated",
        "severity": "medium",
        "objections": [
          {
            "check": "C1",
            "name": "coverage",
            "severity": "low",
            "objection": "The reasoning cites 5 of 21 blocks (24%). A conclusion about the corpus drawn from a minority of it may be reading a subset that happens to agree.",
            "detail": {
              "cited": 5,
              "total": 21,
              "fraction": 0.24
            }
          },
          {
            "check": "C4",
            "name": "uncited counter-evidence",
            "severity": "medium",
            "objection": "1 block(s) qualify or dispute cited evidence and were not addressed: covid-seed-001.",
            "detail": {
              "count": 1
            }
          }
        ],
        "strongest_objection": "1 block(s) qualify or dispute cited evidence and were not addressed: covid-seed-001.",
        "what_would_change_my_mind": "Cite evidence from additional lineages, quote the blocks you rely on, and address the counter-evidence named above.",
        "checks_run": 8,
        "note": "Deterministic. Shares no weights, no pretraining data and no priors with the proposer. Finds structural defects in the shown work, not false conclusions."
      },
      {
        "route": "cross_lineage_model",
        "model": "qwen2.5:14b",
        "lineage_id": "qwen-2.5",
        "lineage_verified": true,
        "independent": true,
        "selection_reason": "different verified weight lineage from the proposer (qwen-2.5 vs llama-3.1)",
        "independence_note": null,
        "strongest_objection": "The conclusion that the origin of SARS-CoV-2 is settled based on judges' decisions may be premature. Judge Will's Bayesian analysis and prior probabilities, as well as Weissman's critique, suggest significant uncertainty and sensitivity to initial assumptions.",
        "cites": [
          "covid-primary-will-decision-bayes-2",
          "covid-primary-weissman-prior-sensitivity-7",
          "covid-primary-weissman-conclusion-10"
        ],
        "what_would_change_my_mind": "Evidence showing a consensus among independent Bayesian analyses with consistent prior probabilities and likelihoods, or a resolution of the methodological issues highlighted by Weissman and Rootclaim.",
        "verdict": "overstated",
        "severity": "medium"
      }
    ],
    "documents": 2,
    "lineages": 2,
    "independent_lineages": 2,
    "inflation_factor": 1,
    "proposer_lineage": "llama-3.1",
    "independence_grade": "moderate",
    "has_human": false,
    "grade_with_your_position": "strong",
    "unresolvable": "Level 4 — shared pretraining corpora across open models — is real and not resolvable, because no major open model discloses its training data. Distinct weight lineages are a checkable claim; independent minds are not."
  },
  "challenge": {
    "route": "cross_lineage_model",
    "model": "qwen2.5:14b",
    "lineage_id": "qwen-2.5",
    "lineage_verified": true,
    "independent": true,
    "selection_reason": "different verified weight lineage from the proposer (qwen-2.5 vs llama-3.1)",
    "independence_note": null,
    "strongest_objection": "The conclusion that the origin of SARS-CoV-2 is settled based on judges' decisions may be premature. Judge Will's Bayesian analysis and prior probabilities, as well as Weissman's critique, suggest significant uncertainty and sensitivity to initial assumptions.",
    "cites": [
      "covid-primary-will-decision-bayes-2",
      "covid-primary-weissman-prior-sensitivity-7",
      "covid-primary-weissman-conclusion-10"
    ],
    "what_would_change_my_mind": "Evidence showing a consensus among independent Bayesian analyses with consistent prior probabilities and likelihoods, or a resolution of the methodological issues highlighted by Weissman and Rootclaim.",
    "verdict": "overstated",
    "severity": "medium"
  },
  "challenge_error": null,
  "verdict": "contested",
  "human_decision": null
}
```

</details>
