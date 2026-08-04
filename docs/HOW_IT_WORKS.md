# How this software works — a breakdown for Brandon

You asked for the tangled-bundle-of-Christmas-lights explanation. Here it is,
in plain language, in fabrication terms where it helps. No jargon without a
physical analogy next to it.

## The one-sentence version

The software reads a pile of evidence about a question, counts how many
**actual observations** sit under the pile (not how many citations), then
checks whether a conclusion drawn from that pile survives a challenge from
something that cannot share the author's blind spots.

That's it. Everything else is machinery to make those two sentences honest
and checkable.

---

## The shop-floor analogy

Think of it as a receiving inspection station on a loading dock. Three jobs,
in order:

1. **Sort incoming parts by lot.** Ten crates arrive. Some are from one heat
   number, some are from another. If you count crates you get 10. If you
   count heat numbers you might get 3. The number that matters for strength
   calculations is the heat number, not the crate count.
2. **Check the work order against the crates.** If the work order says
   "welded per WPS-123," verify WPS-123 actually shows up in the crates and
   says what the work order claims. A work order citing a procedure that
   isn't in the crate, or is in there but says the opposite, fails receiving.
3. **Have a second inspector sign off — one who didn't do the first
   inspection.** Same blueprint, same parts, different set of eyes. If the
   second inspector works from the same notes as the first, you paid for a
   rubber stamp. If they work blind, from the parts alone, you might catch
   what the first missed.

The software does all three. Each one is a separate module. The Christmas
lights are less tangled once you see the three stations.

---

## What each station is, in code

### Station 1 — Sort by lot: `genealogy.js`

This is the **three-level independence model.** Three counts, not one.

- **Level 1 — claim.** One excerpt, one quote. "The paper said X."
  Count: how many quotes are in the pile.
- **Level 2 — document.** One bibliographic unit. One paper, one report,
  one dataset.
  Count: how many distinct documents the quotes came from.
- **Level 3 — lineage.** One underlying observation of the world. One
  experiment, one survey, one batch of evidence collected at one time by
  one method. This is the heat number.
  Count: how many times the world was actually observed.

The headline number the tool reports is Level 3. Always. Because the failure
mode it exists to catch is overstating independence, and Level 3 is the most
conservative count.

**In shop terms:** the tool refuses to count three crates from one heat as
three lots. Three paraphrases of one paper are one document. Three follow-on
papers from one dataset are one lineage. One lineage counted several times
is the exact error COVID made and the exact error the tool caught in its
own author's self-case.

Code: `src/epistemic/genealogy.js`. About 250 lines. The core function is
`resolveLineageId(block)` which reads a block's source metadata and maps it
to the underlying observation.

### Station 2 — Check the work order: `adjudicate.js` → `verifyCitations()`

When a model (or a human) writes a conclusion, the tool makes them show
their work. A conclusion is not accepted as a verdict; it is a **proposal**
that has to earn its status.

The proposal has to come with **reasoning steps**, and each step has to
cite which evidence block it relies on and quote the exact passage it is
relying on. Then the verifier:

- Checks each cited block actually exists in the corpus (not invented).
- Checks the quote actually appears in that block (not paraphrased,
  not invented).
- If the block is a measurement block, re-runs the measurement and checks
  the declared value matches what the command actually returned.

A step that cites a block but doesn't quote it doesn't fail — but it's
flagged "weak," and a verdict that rests entirely on weak steps is
"unsubstantiated," which is its own distinct non-pass.

**In shop terms:** the inspector isn't taking the work order's word for
what the procedure says. They pull the procedure from the file and check
the words match. If the work order says "tensile 90 ksi" and the MTR says
"87 ksi," the work order fails receiving.

Code: `verifyCitations()` inside `src/epistemic/adjudicate.js`, lines 130-210
or so. About 80 lines of deterministic checking.

### Station 3 — The blind second inspector: the challenge panel

This is where the structural independence lives, and it's the part nobody
else in the field has.

The challenge panel has two seats, by design:

**Seat A — the mechanical challenger.** Always runs. Needs no model.
Deterministic code that looks at the proposal and the corpus and raises
objections. Eight checks, each one a separate function:

- **C1 — coverage.** Did the conclusion cite only a minority of the
  corpus? A conclusion about the whole pile drawn from a subset might be
  reading the part that happens to agree.
- **C2 — lineage span.** Did the conclusion cite blocks that span the
  independent lineages in the corpus, or only one?
- **C3 — single-lineage concentration.** Is the conclusion resting on
  many blocks that all trace to one lineage? That's one source cited
  several times.
- **C4 — uncited contradiction.** Is there a block in the corpus that
  contradicts the conclusion but was never addressed?
- **C5 — confidence mismatch.** Is the stated confidence out of proportion
  to what was cited?
- **C6 — weak steps.** Did every step cite without quoting, so the
  conclusion is asserted rather than shown?
- **C7 — quote concentration.** Are all the quotes drawn from a single
  block?
- **C8 — measurement validity.** If the conclusion rests on numbers, do
  those numbers appear in any cited measurement? And if measurements
  declare correlation with each other, is the conclusion multiplying them
  as if independent?

This challenger shares no weights, no training data, no priors with the
model that wrote the proposal — because it isn't a model. Its independence
is a property of the implementation, not a calibration we performed. **This
is the only seat on the panel whose independence we can guarantee.**

**Seat B — a model challenger, blind.** Runs if a second model is
available. Sees the conclusion but NOT the reasoning. Selected through
`models/registry.json`, which knows that `hermes3` and `llama3.1` share a
lineage (so using one to challenge the other is just two calls to one
family, not two independent reviewers) and refuses to credit independence
unless the lineages are genuinely different.

**In shop terms:** the second inspector works from the part and the
blueprint, not from the first inspector's notes. And if the second
inspector went to the same trade school as the first one, the shop
foreman marks the second sign-off as "same school, doesn't count as
independent" rather than rubber-stamping it.

Code: `src/epistemic/mechanical_challenge.js` for seat A (eight checks,
about 470 lines). `adjudicate.js` stage 3 for seat B (about 60 lines).

### Station 4 — The verdict and the human: `resolveVerdict()` + Stage 4

The verdict is computed, not declared. It depends on whether the citation
verification passed, whether any challenge objected, and how many
independent lineages objected if so.

- `unverified` — citation check failed. Dispositive. Cannot be rescued.
- `unsubstantiated` — every step cited without quoting.
- `verified_unchallenged` — citation check passed but no challenge ran.
  Not a clean pass.
- `verified` — citation check passed, challenges ran and found nothing.
- `contested` — citation check passed, two or more independent lineages
  objected.

Then the human comes in at Stage 4. The verdict is the machine's
recommendation; the human is the final lineage on the panel. Recording a
position raises the independence grade to "strong" because the human is a
lineage the model cannot share. That position is persisted to
`decisions/*.json` — so "on the record" is actually true, not just copy.

**In shop terms:** the inspection report says what the guges measured.
The release engineer signs the traveler. The signature is the last
operation, not the first, and it doesn't rewrite what the gauges said.

---

## The three levels of "is this true" the tool reports

This is the part that was new today, and it's worth separating because
they look the same on the surface but mean very different things.

- **verified** — the tool re-ran it and the numbers matched.
- **failed** — the tool re-ran it and the numbers did NOT match. The
  claim is contradicted by the measurement.
- **unverifiable_here** — the tool couldn't re-run it on this machine,
  because the repository the measurement points at isn't here. NOT the
  same as failed. The claim might be perfectly true; this machine just
  can't check it. Does NOT count toward the verified total.

Three states, not two. The third one exists because collapsing "I couldn't
check this" into "this is false" would be the same category error the
tool exists to catch in citations.

---

## What the tool does NOT do

This matters as much as what it does, for the portfolio and for the email.

- It does not find papers. (Elicit does.)
- It does not have a 1.2B-statement citation index. (Scite does.)
- It does not verify that a citation is real and accurately quoted at
  scale. (CiteAudit, CiteTracer, paper-verify do.)
- It does not adjudicate the underlying question. It does not settle
  COVID origins, LHC safety, or egg nutrition. It adjudicates the
  **evidential support** for a conclusion about those things.

The portfolio line for this is honest: **post-retrieval verification layer
for evidential independence.** Not a search engine. Not a fact-checker.
Not a debate settler. The thing that runs after you have the pile of
citations and before you trust the conclusion drawn from them.

---

## The Christmas lights, untangled

Three stations. Each one is a separate file. Each one does one job.

```
evidence_blocks.json
        |
        v
[Station 1: genealogy.js]
   groups blocks into documents into lineages
   reports "N lineages, not N citations"
        |
        v
[Station 2: adjudicate.js verifyCitations()]
   for each step in the proposal:
     - is the cited block real?
     - is the quote actually in it?
     - if measurement: re-run it, check the value
        |
        v
[Station 3: the challenge panel]
   seat A: mechanical_challenge.js  (always runs, no model)
   seat B: a different-lineage model, blind  (if available)
        |
        v
[Station 4: resolveVerdict() + human]
   compute the verdict from the record
   human is the final lineage, position persisted
```

That's the whole machine. Four stations, four files, one job per station.
When you get lost, come back to this diagram. The rest is implementation
detail.

---

## For the portfolio

The honest one-paragraph version for your builder profile:

> Built a post-retrieval evidence verification tool that resolves citation
> piles to their underlying observations using a three-level independence
> model (claim / document / lineage), then adjudicates conclusions drawn
> from the pile through a four-stage protocol (propose, verify, challenge,
> resolve). The challenge panel includes a deterministic mechanical
> reviewer whose independence from the proposer is a property of the
> implementation, not a calibration — the only seat on the panel whose
> independence can be structurally guaranteed. 188 tests, zero runtime
> dependencies, runs cold on any machine with Node 20. Three cases
> (COVID, LHC, eggs) plus a recursive fourth that adjudicates claims
> about the tool's own author and catches him overstating.

That paragraph is checkable. Every claim in it has a file path behind it.
That's the difference between a portfolio line and a brag.
