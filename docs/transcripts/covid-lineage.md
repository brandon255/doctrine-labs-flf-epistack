# Transcript — `covid` · lineage

> Captured so this can be read without installing anything. Verbatim, including failures. Regenerate with `node scripts/freeze-transcripts.js covid lineage`.

| Field | Value |
|---|---|
| Case | `covid` |
| Job | `lineage` — Flag correlated evidence being treated as independent |
| Question | Which evidence blocks in this corpus trace back to the same underlying source or event, and should therefore NOT be counted as independent confirmations of each other? |
| Captured | 2026-08-03T21:41:24.727Z |
| Wall time | 97.8s |
| Proposer | `llama3.1:8b` (lineage `llama-3.1`) |
| Model challenger | `qwen2.5:14b` (lineage `qwen-2.5`) |
| Mechanical challenger | always runs, lineage `deterministic` |

**Corpus:** 21 excerpts cited, drawn from 8 documents, tracing to 3 independent lineage(s). Treat as 3 independent source(s), not 21.

---

## The record

``````
## lineage — CONTESTED

**Question:** Which evidence blocks in this corpus trace back to the same underlying source or event, and should therefore NOT be counted as independent confirmations of each other?

**Conclusion:** Blocks covid-seed-001 and covid-seed-002 should not be counted as independent confirmations of each other because they both quote the same document, FLF case summary.

**Load-bearing assumption:** The FLF case summary is a single document that contains both pieces of information.

### Shown work (1/1 steps verified)

PASS — step 1. Both blocks cite the same document (FLF case summary) and report on the same underlying datum.
   cites: covid-seed-001, covid-seed-002
   quote: "Two expert judges ruled decisively for zoonosis in the Wilf–Miller COVID origins debate (FLF case summary)."
   quote located in covid-seed-001

### Challenge panel — independence: MODERATE

2 challenge(s), of which 2 independent lineage(s). Proposer lineage: llama-3.1.

[INDEPENDENT] mechanical — unsupported / high
   lineage: deterministic
   Every cited block traces to one lineage (wilf-miller-debate-2024-02), while the corpus contains 3. By this tool's own standard that is one observation of the world read 2 ways, not 2 pieces of support.
   - C1 coverage [medium]: The reasoning cites 2 of 21 blocks (10%). A conclusion about the corpus drawn from a minority of it may be reading a subset that happens to agree.
   - C3 single-lineage dependency [high]: Every cited block traces to one lineage (wilf-miller-debate-2024-02), while the corpus contains 3. By this tool's own standard that is one observation of the world read 2 ways, not 2 pieces of support.
   - C4 uncited counter-evidence [medium]: 3 block(s) qualify or dispute cited evidence and were not addressed: covid-seed-003, covid-primary-weissman-oom-spread-9, covid-primary-eric-decision-pdf-4.
   - C5 confidence mismatch [medium]: HIGH confidence asserted on 2 cited block(s). That is a strong claim resting on very little.

[INDEPENDENT] cross_lineage_model (qwen2.5:14b) — overstated / medium
   lineage: qwen-2.5
   The conclusion dismisses the possibility that both blocks could independently confirm each other despite quoting the same document. If both judges' decisions were based on thorough analysis and independent reasoning, their agreement might still be significant.

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
  "job_type": "lineage",
  "question": "Which evidence blocks in this corpus trace back to the same underlying source or event, and should therefore NOT be counted as independent confirmations of each other?",
  "started_at": "2026-08-03T21:41:24.727Z",
  "completed_at": "2026-08-03T21:43:02.522Z",
  "model": "llama3.1:8b",
  "proposer_lineage": "llama-3.1",
  "conclusion": "Blocks covid-seed-001 and covid-seed-002 should not be counted as independent confirmations of each other because they both quote the same document, FLF case summary.",
  "confidence": "HIGH",
  "assumption": "The FLF case summary is a single document that contains both pieces of information.",
  "reasoning": [
    {
      "index": 1,
      "step": "Both blocks cite the same document (FLF case summary) and report on the same underlying datum.",
      "cites": [
        "covid-seed-001",
        "covid-seed-002"
      ],
      "quote": "Two expert judges ruled decisively for zoonosis in the Wilf–Miller COVID origins debate (FLF case summary).",
      "ok": true,
      "weak": false,
      "checks": [
        {
          "cite": "covid-seed-001",
          "ok": true,
          "reason": "block exists"
        },
        {
          "cite": "covid-seed-002",
          "ok": true,
          "reason": "block exists"
        },
        {
          "ok": true,
          "reason": "quote located in covid-seed-001"
        }
      ]
    }
  ],
  "verification": {
    "verified": true,
    "verified_steps": 1,
    "weak_steps": 0,
    "total_steps": 1,
    "failures": []
  },
  "challenge_panel": {
    "challenges": [
      {
        "route": "mechanical",
        "lineage_id": "deterministic",
        "independent": true,
        "model": null,
        "verdict": "unsupported",
        "severity": "high",
        "objections": [
          {
            "check": "C1",
            "name": "coverage",
            "severity": "medium",
            "objection": "The reasoning cites 2 of 21 blocks (10%). A conclusion about the corpus drawn from a minority of it may be reading a subset that happens to agree.",
            "detail": {
              "cited": 2,
              "total": 21,
              "fraction": 0.1
            }
          },
          {
            "check": "C3",
            "name": "single-lineage dependency",
            "severity": "high",
            "objection": "Every cited block traces to one lineage (wilf-miller-debate-2024-02), while the corpus contains 3. By this tool's own standard that is one observation of the world read 2 ways, not 2 pieces of support.",
            "detail": {
              "lineage": "wilf-miller-debate-2024-02",
              "cited_blocks": 2,
              "available_lineages": 3
            }
          },
          {
            "check": "C4",
            "name": "uncited counter-evidence",
            "severity": "medium",
            "objection": "3 block(s) qualify or dispute cited evidence and were not addressed: covid-seed-003, covid-primary-weissman-oom-spread-9, covid-primary-eric-decision-pdf-4.",
            "detail": {
              "count": 3
            }
          },
          {
            "check": "C5",
            "name": "confidence mismatch",
            "severity": "medium",
            "objection": "HIGH confidence asserted on 2 cited block(s). That is a strong claim resting on very little.",
            "detail": {
              "confidence": "HIGH",
              "cited_blocks": 2
            }
          }
        ],
        "strongest_objection": "Every cited block traces to one lineage (wilf-miller-debate-2024-02), while the corpus contains 3. By this tool's own standard that is one observation of the world read 2 ways, not 2 pieces of support.",
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
        "strongest_objection": "The conclusion dismisses the possibility that both blocks could independently confirm each other despite quoting the same document. If both judges' decisions were based on thorough analysis and independent reasoning, their agreement might still be significant.",
        "cites": [
          "covid-seed-001",
          "covid-seed-002"
        ],
        "what_would_change_my_mind": "Evidence showing that Judge Will's decision was heavily influenced by the same selective evidence presentation issues identified in Judge Eric's ruling, undermining their independence.",
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
    "strongest_objection": "The conclusion dismisses the possibility that both blocks could independently confirm each other despite quoting the same document. If both judges' decisions were based on thorough analysis and independent reasoning, their agreement might still be significant.",
    "cites": [
      "covid-seed-001",
      "covid-seed-002"
    ],
    "what_would_change_my_mind": "Evidence showing that Judge Will's decision was heavily influenced by the same selective evidence presentation issues identified in Judge Eric's ruling, undermining their independence.",
    "verdict": "overstated",
    "severity": "medium"
  },
  "challenge_error": null,
  "verdict": "contested",
  "human_decision": null
}
```

</details>
