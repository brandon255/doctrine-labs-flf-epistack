# Baseline comparison — same model, with and without the scaffolding

The tempting baseline is an off-the-shelf deep research tool. We did not use one,
because a frontier model beating a local 8B would tell you about model size rather
than about method, and the method is the thing we are claiming.

So the baseline is the *same* `llama3.1:8b`, given the *same* evidence excerpts,
asked the same question — with no document identity, no lineage registry, and no
adjudication. Any gap is attributable to the scaffolding.

> How many independent sources support the claims in this evidence base? Give a specific number, then briefly justify it.

## Result

| Case | Excerpts given | Unscaffolded answer | This stack | Ground truth |
|---|---|---|---|---|
| covid | 21 | 7 | **3** | 3 |
| lhc | 9 | 6 | **3** | 3 |
| eggs | 9 | 7 | **5** | 5 |

"Ground truth" is the lineage count from `source_registry.json`, where every
grouping carries a written reason. It is a human judgment, not an oracle — but it is
an *auditable* one, and a reader who disagrees can edit one field and rerun.

**The unscaffolded model overcounted on 3 of 3 cases.**

This is the expected failure and the reason the stack exists. Given a list of
excerpts, a model counts excerpts. It has no way to notice that three of them are
one PDF, because that fact is not in the text it was given — it lives in the source
metadata, which is exactly what the registry supplies and a raw prompt does not.

The gap is not a reasoning failure. It is an input failure, and no amount of model
scale fixes it. That is the argument for the scaffolding.

## What the unscaffolded model actually said

### covid — answered 7, actual 3

```
I count 7 independent sources supporting the claims in this evidence base:

1. FLF-epistemic-competition-case-covid (multiple references)
2. Rootclaim-debate-structure-claim
3. Doctrine-labs-crux-hypothesis-001
4. Will-decision-doc
5. Eric-decision-pdf
6. Weissman-prior-sensitivity
7. Sa-verdict

I justify this count by considering each source as a separate entity that provides independent support for the claims in the evidence base. While some sources (e.g., FLF-epistemic-competition-case-covid) are referenced multiple times, they are still considered a single source since they provide a unified perspective on the topic.

The other references (8-21) appear to be secondary or follow-up discussions that build upon or critique the primary sources listed above. They do not provide independent support for the claims in the evidence base and are therefore not counted as separate sources.
```

### lhc — answered 6, actual 3

```
There are 6 independent sources that support the claims in this evidence base:

1. [5] LSAG states the LHC reproduces collisions at energies less than those reached in the atmosphere by cosmic rays that have bombarded Earth for billions of years.
2. [7] LSAG concludes there is no basis for any conceivable threat from the LHC, reaffirming the 2003 LHC Safety Study Group.
3. [9] CERN's public safety page states Nature has already performed LHC-like collision rates on Earth and astronomical bodies without hazardous consequences.

These three sources are independent because they come from different authors or organizations: LSAG (a group of experts) and CERN (the organization operating the LHC).

The other four sources are not entirely independent, as they either:

* Restate the same official risk assessment without independent analysis ([2])
* Are based on the same primary source ([4] is a validation task that ingested LSAG excerpts)
* Present alternative perspectives or criticisms of the LSAG's conclusions ([3], [6], and [8]).

Therefore, I count 6 independent sources that support the claims in this evidence base.
```

### eggs — answered 7, actual 5

```
There are 7 independent sources that support the claims in this evidence base.

Here's why:

* Sources [1], [2], and [4] are all related to the same case framing (FLF-epistemic-competition-case-eggs) or validation task, so they can be considered as a single source.
* Source [3] is a general epidemiology concern that may be relevant to the evidence base, but it's not directly supporting any specific claim in this context.
* Sources [5], [6], and [7] are all related to the same JAMA 2019 study by Zhong et al. and its implications for dietary guidelines, so they can be considered as a single source.
* Source [8] is an independent study that examines industry funding bias in nutrition research, but it's not directly supporting any specific claim about eggs or cholesterol.
* Source [9] is another analysis of the same JAMA 2019 study by Zhong et al., so it can be considered as a single source.

Therefore, there are only 4 truly independent sources that support the claims in this evidence base: [5], [6], [7], and [8].
```

## Caveats

- One sample per case at temperature 0.2. Indicative, not a benchmark.
- The baseline prompt is deliberately plain. A prompt engineer could improve it, and
  a fairer future version would compare against a *tuned* unscaffolded prompt.
- This measures one desideratum — independence counting — not the whole stack.
- Generated by `node scripts/baseline-compare.js`.

