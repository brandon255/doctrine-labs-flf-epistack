# Transcript — `self` · rhetoric

> Captured so this can be read without installing anything. Verbatim, including failures. Regenerate with `node scripts/freeze-transcripts.js self rhetoric`.

| Field | Value |
|---|---|
| Case | `self` |
| Job | `rhetoric` — Identify rhetorical moves that carry more persuasive weight than evidential weight |
| Question | Which claims in this corpus carry more persuasive weight than evidential weight — that is, which are doing rhetorical work disproportionate to what they actually establish? |
| Captured | 2026-08-03T22:54:00.470Z |
| Wall time | 44.7s |
| Proposer | `llama3.1:8b` (lineage `llama-3.1`) |
| Model challenger | `qwen2.5:14b` (lineage `qwen-2.5`) |
| Mechanical challenger | always runs, lineage `deterministic` |
| Measurement roots | captured on the author's machine, where `coreos` resolves. On your checkout it will not, and those measurements report `unverifiable_here` — unchecked, not disproved. |

**Corpus:** 8 excerpts cited, drawn from 7 documents, tracing to 4 independent lineage(s). Treat as 4 independent source(s), not 8.

---

## The record

``````
## rhetoric — UNVERIFIED

**Question:** Which claims in this corpus carry more persuasive weight than evidential weight — that is, which are doing rhetorical work disproportionate to what they actually establish?

**Conclusion:** The claims in this corpus that carry more persuasive weight than evidential weight are the ones made by the builder, specifically regarding their global ranking and ADHD lineage correlation.

**Load-bearing assumption:** The claims made by the builder are not supported by credible evidence and should be viewed with skepticism.

### Shown work (0/2 steps verified)

FAIL — step 1. The builder's claims about their global ranking and ADHD lineage correlation rely on unverifiable assertions rather than evidence.
   cites: self-rarity-funnel-FLAWED, self-lineage-correlation-FLAWED
   quote: "The builder ranks in the single digits globally via eleven multiplicative prevalence layers. ...ADHD combined type (prevalence ~3%) multiplied by entrepreneuria…"
   ! measurement mismatch: declared "RARITY_PHRASE", measured "8"
   ! measurement mismatch: declared 1, measured 8
FAIL — step 2. These claims are not supported by any credible evidence, and their confidence levels are LOW.
   cites: self-rarity-funnel-FLAWED, self-lineage-correlation-FLAWED
   ! measurement mismatch: declared "RARITY_PHRASE", measured "8"
   ! measurement mismatch: declared 1, measured 8

### Challenge panel — independence: MODERATE

2 challenge(s), of which 2 independent lineage(s). Proposer lineage: llama-3.1.

[INDEPENDENT] mechanical — overstated / medium
   lineage: deterministic
   Every cited block traces to one lineage (subject-assertion), while the corpus contains 4. By this tool's own standard that is one observation of the world read 2 ways, not 2 pieces of support.
   - C1 coverage [low]: The reasoning cites 2 of 8 blocks (25%). A conclusion about the corpus drawn from a minority of it may be reading a subset that happens to agree.
   - C3 single-lineage dependency [medium]: Every cited block traces to one lineage (subject-assertion), while the corpus contains 4. By this tool's own standard that is one observation of the world read 2 ways, not 2 pieces of support.
   - C5 confidence mismatch [medium]: HIGH confidence asserted on 2 cited block(s). That is a strong claim resting on very little.

[INDEPENDENT] cross_lineage_model (qwen2.5:14b) — overstated / medium
   lineage: qwen-2.5
   The conclusion overemphasizes the claims made by the builder regarding their global ranking and ADHD lineage correlation, which are marked as having low confidence. The corpus does not provide substantial evidence to support these specific assertions beyond the builder's self-assertions.

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
  "job_type": "rhetoric",
  "question": "Which claims in this corpus carry more persuasive weight than evidential weight — that is, which are doing rhetorical work disproportionate to what they actually establish?",
  "started_at": "2026-08-03T22:54:00.470Z",
  "completed_at": "2026-08-03T22:54:45.148Z",
  "model": "llama3.1:8b",
  "proposer_lineage": "llama-3.1",
  "conclusion": "The claims in this corpus that carry more persuasive weight than evidential weight are the ones made by the builder, specifically regarding their global ranking and ADHD lineage correlation.",
  "confidence": "HIGH",
  "assumption": "The claims made by the builder are not supported by credible evidence and should be viewed with skepticism.",
  "reasoning": [
    {
      "index": 1,
      "step": "The builder's claims about their global ranking and ADHD lineage correlation rely on unverifiable assertions rather than evidence.",
      "cites": [
        "self-rarity-funnel-FLAWED",
        "self-lineage-correlation-FLAWED"
      ],
      "quote": "The builder ranks in the single digits globally via eleven multiplicative prevalence layers. ...ADHD combined type (prevalence ~3%) multiplied by entrepreneurial drive among ADHD adults (300% more likely) yields a joint prevalence under 1%. ",
      "ok": false,
      "weak": false,
      "checks": [
        {
          "cite": "self-rarity-funnel-FLAWED",
          "ok": true,
          "reason": "block exists"
        },
        {
          "cite": "self-lineage-correlation-FLAWED",
          "ok": true,
          "reason": "block exists"
        },
        {
          "cite": "self-rarity-funnel-FLAWED",
          "ok": false,
          "reason": "measurement mismatch: declared \"RARITY_PHRASE\", measured \"8\""
        },
        {
          "cite": "self-lineage-correlation-FLAWED",
          "ok": false,
          "reason": "measurement mismatch: declared 1, measured 8"
        }
      ],
      "measurements": [
        {
          "id": "self-rarity-funnel-FLAWED",
          "verified": false,
          "ok": false,
          "status": "failed",
          "unverifiable_here": false,
          "reason": "declared \"RARITY_PHRASE\", measured \"8\"",
          "declared": "RARITY_PHRASE",
          "actual": "8",
          "output": "c662755 Section 9: reference ICM Core execution stack (5/5 gates, tested not slideware)\n620acb8 Section 9: agentic AI that learns the human to strengthen the human\n68d3bc3 Section 9: AI in the loop for human enhancement; local-first posture\nc16ceac Add SUBMISSION.md: full competition write-up, linked from README\ncce5f1c Add optional alias map: scalable, relabel-resistant root resolution\nf7e3edb Add human-judgment transparency section, reading guide, and bring-your-own-case sample\nf2f67cd Rewrite"
        },
        {
          "id": "self-lineage-correlation-FLAWED",
          "verified": false,
          "ok": false,
          "status": "failed",
          "unverifiable_here": false,
          "reason": "declared 1, measured 8",
          "declared": 1,
          "actual": 8,
          "output": "c662755 Section 9: reference ICM Core execution stack (5/5 gates, tested not slideware)\n620acb8 Section 9: agentic AI that learns the human to strengthen the human\n68d3bc3 Section 9: AI in the loop for human enhancement; local-first posture\nc16ceac Add SUBMISSION.md: full competition write-up, linked from README\ncce5f1c Add optional alias map: scalable, relabel-resistant root resolution\nf7e3edb Add human-judgment transparency section, reading guide, and bring-your-own-case sample\nf2f67cd Rewrite"
        }
      ]
    },
    {
      "index": 2,
      "step": "These claims are not supported by any credible evidence, and their confidence levels are LOW.",
      "cites": [
        "self-rarity-funnel-FLAWED",
        "self-lineage-correlation-FLAWED"
      ],
      "quote": null,
      "ok": false,
      "weak": false,
      "checks": [
        {
          "cite": "self-rarity-funnel-FLAWED",
          "ok": true,
          "reason": "block exists"
        },
        {
          "cite": "self-lineage-correlation-FLAWED",
          "ok": true,
          "reason": "block exists"
        },
        {
          "cite": "self-rarity-funnel-FLAWED",
          "ok": false,
          "reason": "measurement mismatch: declared \"RARITY_PHRASE\", measured \"8\""
        },
        {
          "cite": "self-lineage-correlation-FLAWED",
          "ok": false,
          "reason": "measurement mismatch: declared 1, measured 8"
        }
      ],
      "measurements": [
        {
          "id": "self-rarity-funnel-FLAWED",
          "verified": false,
          "ok": false,
          "status": "failed",
          "unverifiable_here": false,
          "reason": "declared \"RARITY_PHRASE\", measured \"8\"",
          "declared": "RARITY_PHRASE",
          "actual": "8",
          "output": "c662755 Section 9: reference ICM Core execution stack (5/5 gates, tested not slideware)\n620acb8 Section 9: agentic AI that learns the human to strengthen the human\n68d3bc3 Section 9: AI in the loop for human enhancement; local-first posture\nc16ceac Add SUBMISSION.md: full competition write-up, linked from README\ncce5f1c Add optional alias map: scalable, relabel-resistant root resolution\nf7e3edb Add human-judgment transparency section, reading guide, and bring-your-own-case sample\nf2f67cd Rewrite"
        },
        {
          "id": "self-lineage-correlation-FLAWED",
          "verified": false,
          "ok": false,
          "status": "failed",
          "unverifiable_here": false,
          "reason": "declared 1, measured 8",
          "declared": 1,
          "actual": 8,
          "output": "c662755 Section 9: reference ICM Core execution stack (5/5 gates, tested not slideware)\n620acb8 Section 9: agentic AI that learns the human to strengthen the human\n68d3bc3 Section 9: AI in the loop for human enhancement; local-first posture\nc16ceac Add SUBMISSION.md: full competition write-up, linked from README\ncce5f1c Add optional alias map: scalable, relabel-resistant root resolution\nf7e3edb Add human-judgment transparency section, reading guide, and bring-your-own-case sample\nf2f67cd Rewrite"
        }
      ]
    }
  ],
  "verification": {
    "verified": false,
    "verified_steps": 0,
    "weak_steps": 0,
    "total_steps": 2,
    "failures": [
      "step 1: measurement mismatch: declared \"RARITY_PHRASE\", measured \"8\"; measurement mismatch: declared 1, measured 8",
      "step 2: measurement mismatch: declared \"RARITY_PHRASE\", measured \"8\"; measurement mismatch: declared 1, measured 8"
    ],
    "unverifiable_here": [],
    "unverifiable_here_count": 0
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
            "objection": "The reasoning cites 2 of 8 blocks (25%). A conclusion about the corpus drawn from a minority of it may be reading a subset that happens to agree.",
            "detail": {
              "cited": 2,
              "total": 8,
              "fraction": 0.25
            }
          },
          {
            "check": "C3",
            "name": "single-lineage dependency",
            "severity": "medium",
            "objection": "Every cited block traces to one lineage (subject-assertion), while the corpus contains 4. By this tool's own standard that is one observation of the world read 2 ways, not 2 pieces of support.",
            "detail": {
              "lineage": "subject-assertion",
              "cited_blocks": 2,
              "available_lineages": 4
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
        "strongest_objection": "Every cited block traces to one lineage (subject-assertion), while the corpus contains 4. By this tool's own standard that is one observation of the world read 2 ways, not 2 pieces of support.",
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
        "strongest_objection": "The conclusion overemphasizes the claims made by the builder regarding their global ranking and ADHD lineage correlation, which are marked as having low confidence. The corpus does not provide substantial evidence to support these specific assertions beyond the builder's self-assertions.",
        "cites": [
          "self-rarity-funnel-FLAWED",
          "self-lineage-correlation-FLAWED"
        ],
        "what_would_change_my_mind": "If there were additional, independent evidence corroborating the builder's claims about their global ranking and ADHD lineage correlation, then the conclusion would be better supported.",
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
    "strongest_objection": "The conclusion overemphasizes the claims made by the builder regarding their global ranking and ADHD lineage correlation, which are marked as having low confidence. The corpus does not provide substantial evidence to support these specific assertions beyond the builder's self-assertions.",
    "cites": [
      "self-rarity-funnel-FLAWED",
      "self-lineage-correlation-FLAWED"
    ],
    "what_would_change_my_mind": "If there were additional, independent evidence corroborating the builder's claims about their global ranking and ADHD lineage correlation, then the conclusion would be better supported.",
    "verdict": "overstated",
    "severity": "medium"
  },
  "challenge_error": null,
  "verdict": "unverified",
  "human_decision": null
}
```

</details>
