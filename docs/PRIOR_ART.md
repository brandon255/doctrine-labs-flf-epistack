# Prior art — what exists, and where FLFBuild sits

Honest comparison, not marketing. Every claim labeled per
[`docs/claims/DISCIPLINE.md`](claims/DISCIPLINE.md) — PROVED (cited), BUILT (in this
repo, runnable), HYPOTHESIS (defensible but unproven).

## The short version

There is a great deal of software for **finding** papers and **linking** claims to sources.
There is almost none for **counting how many independent observations actually sit under a
pile of citations**, and none at all that does it with a challenger whose independence from
the proposer is structurally guaranteed rather than assumed.

FLFBuild sits at the **conclusion** end of the pipeline, not the **retrieval** end. It is
not a competitor to Elicit, Scite, or Iris.ai. It is the layer you run *after* those tools
hand you a corpus and *before* you trust the conclusion drawn from it.

## The closest academic precedent

**Greenberg (2009), "How citation distortions create unfounded authority," *BMJ* 339:b2680.**
[PROVED — [doi.org/10.1136/bmj.b2680](https://doi.org/10.1136/bmj.b2680)]

Greenberg constructed the complete citation network for one contested claim — that
β-amyloid causes inclusion-body myositis — and found **220,553 citation paths** supporting
a belief that traced to a handful of primary papers, several of which actually refuted it.
He named three distortions: citation bias (against refuting papers), amplification
(expansion without new data), and invention (hypothesis converting to fact through
citation alone).

This is the closest precedent because the core insight is identical to ours: **a citation
count is not a count of independent observations.** Our three-level model (claim /
document / lineage) is the formalization of what Greenberg demonstrated by hand for one
case in 2009.

What Greenberg did not do, and what no tool in the list below does either:

- He did not **automate** it. The analysis took months of manual network construction.
- He did not **adjudicate conclusions** drawn from the network. He exposed the network;
  the reader still had to judge whether a given conclusion followed.
- He did not **challenge the conclusion adversarially** with a process guaranteed to be
  independent of whoever wrote it.

Those three gaps are the work. [BUILT]

## What the existing tools do

### Elicit

[PROVED — [elicit.com](https://elicit.com)]

Sentence-level citations across up to 500 papers, PRISMA-compliant screening, structured
data extraction. Strongest at the **retrieval and synthesis** layer: it finds the papers
and links every AI claim to a sentence in a source.

**What it does not do:** count independent lineages. Elicit will tell you that 200 papers
support a claim, each citation verified against the source sentence. It will not tell you
that those 200 papers trace to 4 underlying observations, which is the only number that
matters for judging the claim's evidential weight.

### Scite

[PROVED — [scite.ai](https://scite.ai)]

Indexes 1.2B+ citation statements and classifies each as supporting, contradicting, or
mentioning. The market leader in **citation intelligence at scale**.

**What it does not do:** resolve lineage. Scite can tell you that 40 papers contradict a
claim and 300 support it. If 280 of those 300 supporting papers all derive from one 1998
study, Scite reports 300. We report 1. That distinction — 300 vs 1 — is the entire reason
this repository exists.

### Iris.ai

[PROVED — [iris.ai](https://iris.ai)]

Research mapping and traceable extraction for corporate R&D. Closest in spirit to
local-first, audit-trail-first work. Emphasis on traceability: every extracted claim links
back to its source.

**What it does not do:** adjudicate. Iris.ai will give you a defensible map. It does not
ask whether a conclusion drawn from that map survives a blind challenge from a process
that shares no lineage with the author.

### Scriptorium-cli, VaultLab, Deep-research-agent

[PROVED — [pypi.org/project/scriptorium-cli](https://pypi.org/project/scriptorium-cli/),
[pypi.org/project/vaultlab](https://pypi.org/project/vaultlab/),
[github.com/jakkapat-kingthong/Deep-research-agent](https://github.com/jakkapat-kingthong/Deep-research-agent)]

These three are closest on the **enforcement philosophy**. They share our position that
grounding belongs in the type system, not the prompt:

- Scriptorium refuses to ship a manuscript section with unresolved citations. Locator-level
  `[paper_id:page:N]` tokens, PRISMA-style audit trail.
- VaultLab flags hallucinated citations and refuses to ship unverified output.
- Deep-research-agent enforces grounding in the `Claim` schema — a `Claim` without
  `source_ids` cannot be parsed.

We agree, and we do the same: a conclusion with no cites fails verification. But all three
verify that **a citation resolves**. None of them verify that **the things being cited are
independent of each other**, which is a strictly harder problem and the one Greenberg
named.

## The one we are doing that nobody else does

This is the part I want to be careful about, because claiming novelty is exactly the shape
of assertion this tool exists to challenge.

**The challenger-independence layer.** Every tool above uses one model, or models from one
family, to both propose and verify. The self-preference bias this introduces is documented:
Panickssery et al. (2024), "LLM Evaluators Recognize and Favor Their Own Generations,"
*NeurIPS*, show a linear correlation between an LLM's ability to recognize its own output
and its tendency to score it higher. [PROVED — [arxiv.org/abs/2404.13076](https://arxiv.org/abs/2404.13076)]

Our mechanical challenger shares no weights, no training data, and no priors with the
proposer — because it is not a model. It is deterministic code. Its independence is not
a hypothesis we calibrated; it is a property of the implementation. [BUILT]

I cannot find another tool in this space that makes that claim, and the reason is
structural: most of them run on one hosted model and cannot materially do otherwise. We
run local-first, so we can put a deterministic process on the panel without asking
permission or paying for a second model.

**Hypothesis, stated as such:** the combination of (a) three-level lineage resolution,
(b) a structurally-independent challenger, and (c) the adjudication protocol that fuses
them, is not present in any shipped tool I could find as of August 2026. This is a
literature search, not an exhaustive audit, and "I could not find one" is weaker than
"none exists." [HYPOTHESIS]

## Side-by-side

| Capability | Elicit | Scite | Iris.ai | Scriptorium | **FLFBuild** |
|---|---|---|---|---|---|
| Find papers | ✓ (138M) | – | ✓ | uses others | – |
| Classify citations (support/contradict) | – | ✓ (1.2B) | – | – | – |
| Link claim → source sentence | ✓ | ✓ | ✓ | ✓ (page-level) | ✓ |
| Refuse unsupported output | partial | – | – | ✓ | ✓ |
| **Resolve lineage (claim/doc/observation)** | – | – | – | – | **✓** |
| **Report independent count, not citation count** | – | – | – | – | **✓** |
| **Challenger structurally independent of proposer** | – | – | – | – | **✓** |
| **Three verification states** | – | – | – | – | **✓** |
| Local-first, zero-network | – | – | – | partial | ✓ |
| Scale (papers indexed) | 138M | 1.2B statements | large | user-supplied | user-supplied |

The blanks in our row are real. We do not find papers. We do not have a 1.2B-statement
index. We work on a corpus you bring us. The honest framing is that we are a **post-
retrieval verification layer**, not a retrieval tool, and the comparison is interesting
because the capabilities are nearly disjoint.

## The defensible one-sentence position

> Elicit and Scite will tell you what was said and who said it. FLFBuild tells you how many
> of those somebodies were actually independent, and whether the conclusion survives a
> challenge from something that cannot share the author's blind spots.

That is not "we are better than Elicit." It is "we are the only thing doing the specific
job that Elicit's output is the input to."

## What this comparison does not claim

- **Not claiming superiority.** For building a literature review from scratch, Elicit is
  better. For checking whether a contested claim has held up, Scite is better. For
  mapping a field, Iris.ai is better. We are not in those races.
- **Not claiming first-mover on the insight.** Greenberg had the insight in 2009. We are
  the tool that ships the automation of it, plus the challenger layer he did not have.
- **Not claiming the absence of competitors I missed.** A literature search is not an
  exhaustive audit. If a reviewer finds a tool doing all four of our differentiators, the
  honest response is "we did not know, and here is how ours differs in detail" — not
  denial.

## Open questions worth chasing

1. **Has anyone shipped lineage resolution as a feature?** I found papers on citation
   genealogy as a research topic, but no shipped product exposing it to the user. Worth a
   deeper search before claiming novelty in a cover note.
2. **Greenberg's three distortions map cleanly onto our failure modes.** Citation bias ≈
   C3 (single-lineage concentration); amplification ≈ C1 (coverage from a minority);
   invention ≈ C5 (confidence out of proportion). Worth a short appendix drawing the map,
   because it positions our checks as the operational form of his analysis.
3. **The self-preference research strengthens the challenger-independence argument.** Cite
   Panickssery 2024 directly in the cover note rather than asserting "models favor their
   own output" — the citation exists and is strong.
