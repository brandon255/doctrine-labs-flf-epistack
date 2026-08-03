# Defect register

Bugs we wrote into this tool, what each would have cost you, and what caught it.

This is not the same document as [`FAILURE_MODES.md`](FAILURE_MODES.md). That one is
prospective and about the *method* — where the approach is weak by design, written before
anyone attacks it. This one is retrospective and about the *code* — places we were
actually wrong, found and fixed during the build.

## Why ship this at all

A submission that reads *"here is the finished thing, everything works"* asks you to take
its correctness on faith. It offers no way to be wrong. The rest of this repository exists
to reject exactly that shape of claim — a conclusion with no shown work is not a
conclusion, it is an assertion. It would be incoherent to argue that and then hand over a
package with its own history sanded off.

So the register is here for the same reason the adjudication protocol makes a model show
its reasoning: **the interesting question is never whether a system produced a clean
answer, it is whether the system can be caught when it produces a dirty one.** Every entry
below is a case where it was.

## Why you can believe it

A list of self-reported mistakes is worth very little. Anyone can write a humble-sounding
document, and a tool that flags performed candour in other people's writing should expect
the same test applied to its own.

So no entry is a self-report. **Every defect below names the test that now guards it**,
and `npm run verify:register` re-reads this file, extracts those test names, and confirms
each one exists in the suite and passes. If someone deletes a guard, the register stops
verifying. The claim *"we caught and fixed this"* is a measurement, not a memory.

```bash
npm run verify:register
```

---

## Tier 1 — Would have produced a false confirmation

The worst class. The tool reports *verified* for something it did not verify. This is
worse than having no verifier at all: a reader who knows there is no check applies their
own scepticism, while a reader shown a green check has been actively disarmed. An
unchecked claim laundered into a checked one is the specific harm this project exists to
prevent, and we shipped it twice.

### 1.1 An unrun challenge scored the same as a passed one

`resolveVerdict` fell through to `verified` whenever the challenge was absent. A challenge
call that timed out, threw, or never ran produced exactly the same verdict as one that ran
and found nothing wrong.

Adversarial review is the entire second half of the protocol. Silently treating *"the
critic never showed up"* as *"the critic approved"* meant the strongest verdict the tool
could emit was reachable by breaking the thing that earns it. Worse, the failure was
quiet: an unreachable model does not announce itself in the output.

There is now a distinct `verified_unchallenged` verdict, so the absence of a challenge is
a visible state rather than an invisible pass.

- **Guard:** `an unrun challenge is not a passed challenge`
- **Found by:** reading `resolveVerdict` while writing the A1 independence scope, not by a
  failing test. It had no failing test — that was the problem.

### 1.2 A date matched its own year

`compareValues` pulled the leading integer out of each side before comparing, so a
declared value of `2026-05-31` passed against a measured value of `2026`. The measurement
machinery reported a verified match for two values that are not the same value.

The whole promise of measurement evidence is that a claim about a quantity gets re-run
rather than believed. A comparison that returns true on a prefix does not re-run the
claim; it agrees with it. Numeric comparison now happens only when *both* sides are
entirely numeric, and partial matching is gone.

- **Guard:** `a date does not falsely match its own year`
- **Found by:** writing tests for a feature that already appeared to work.

---

## Tier 2 — Would have destroyed a distinction the tool exists to make

No false green. These are worse than cosmetic and better than Tier 1: the output is not a
lie, but a difference the tool sells the reader on has been flattened into sameness.

### 2.1 Unchecked was rendered as false

The `self` case measures two repositories. One of them is private and will not exist on a
reader's machine. On a foreign checkout every measurement failed, and they all failed the
same way — so the two deliberately-false blocks were indistinguishable from the five true
ones whose repository simply was not there.

The demo inverted. A case built to show the tool confirming real numbers and catching a
planted lie instead showed everything equally broken, and a reader had no way to recover
which was which. For a tool whose entire pitch is separating grades of evidential support,
rendering *"I could not check this"* and *"this is false"* as one red line throws away the
distinction it was built to preserve.

There is now a third verification state, `unverifiable_here`, which prints `?` rather than
`!`, gets its own section in the record, and still never counts as verified — because
unchecked is not confirmed.

- **Guards:** `an absent root reports unverifiable_here, not a failed check` ·
  `a genuine mismatch is failed, and is not confused with unverifiable`
- **Found by:** cloning the repository into a scratch directory and running it as a
  stranger would. No unit test would have found this, because every unit test ran on the
  machine where the paths resolved.

### 2.2 The mechanical challenger went quiet exactly when it should have spoken

The measurement-validity check returned early when a conclusion contained no headline
number. That guard was written for a sensible reason — no quantity to check, nothing to
say — but it also meant that a conclusion resting entirely on measurements that could not
be run produced no objection at all, as long as it was phrased without a figure.

Silence read as approval. The check now raises the unrunnable objection regardless of how
the conclusion is worded.

- **Guard:** `C8 raises the unrunnable objection even with no number in the conclusion`
- **Found by:** running the `self` case on a simulated foreign machine and noticing the
  challenger had nothing to say about it.

---

## Tier 3 — Would have misled about scale, not about truth

Real defects, correctly categorised as small. Nothing here would have caused a reader to
believe a false thing about the evidence — only to lose confidence in the care taken,
which is its own cost but a different one.

### 3.1 One absent repository counted four times

The measurement-validity check counted occurrences rather than measurements, so a single
missing repository cited across four reasoning steps printed the line *"4 of 2 cited
measurements could not be re-run."*

Trivial to fix and impossible to defend. A tool whose headline contribution is *"the same
source cited many times is still one source"* had, in its own diagnostic output, counted
one thing several times.

- **Guard:** `C8 counts one absent root once, however many steps cite it`
- **Found by:** reading the tool's own output during an end-to-end run.

### 3.2 Digits pulled out of a commit hash

Before named extractors existed, measurement values were parsed by taking the first
integer found anywhere in the command output. For `git log --oneline` that meant reading
digits out of a commit SHA and comparing them to a declared line count.

Extraction is now named — a block references a vetted extractor such as `line_count` or
`tap_pass`, and an unknown name is rejected rather than silently defaulted.

- **Guards:** `extractor line_count counts lines rather than reading digits out of a hash` ·
  `an unknown named extractor is rejected rather than silently defaulted`
- **Found by:** a measurement passing with a number nobody could account for.

---

## The one that is not in a tier

The original design ran the blind challenge on the same model, and usually the same
weights, as the proposal. That is not a coding defect — it is a design error, and a
central one, so it is written up at length as entry 1 of
[`FAILURE_MODES.md`](FAILURE_MODES.md) rather than summarised here.

It belongs in a register of *"where we were wrong"* even so, and it is the most serious
item on any such list: a stack whose headline finding is *"two judges watching one debate
are not two witnesses"* was adjudicating with two calls to one model and reporting a two
while holding a one. The fix — a deterministic challenger sharing no weights with the
proposer, plus lineage-aware model selection — is the largest single piece of work in
this repository.

- **Guard:** `pickChallenger refuses hermes3 as a challenger for llama3.1`

---

## Guards catch the bug we hit. Category checks catch the family.

Every guard above is an example test: it pins the exact defect we made. That is worth
having and it is not enough, because the real defect was never *"a date matches its own
year"* — it was *"a partial match is reported as a match"*, and that family has members we
have not met.

So `test/invariants.test.js` asserts properties over a generated space of inputs rather
than remembered examples. Two matter most, and each is the general form of a Tier 1
defect above:

- **No partial match is ever equality.** Several hundred prefix pairs, both directions,
  numeric and not. Generalises 1.2.
- **No degenerate challenge panel earns a clean verdict.** Eleven shapes an unrun, empty,
  or broken challenge can take — `null`, `[]`, `[{}]`, `[{verdict: null}]` and the rest.
  Generalises 1.1.

Both are paired with an opposite-direction test, because a comparator that refuses
everything and a verdict function that never says `verified` would satisfy the rules above
while being useless.

**These were checked by reintroducing the defects.** With both Tier 1 bugs put back, the
category tests failed alongside the specific guards — so they are not decorative. More to
the point, a *third* false-pass was then planted that no existing guard was written for:
numeric prefixes counting as equal, so `536` would match `5360`. It passed all 187 other
tests, **including the date guard**, and was caught only by the category check. That is
the difference between a test that remembers a mistake and a test that describes a
mistake's shape.

## What this list is not

It is not complete, and claiming otherwise would be the same unfalsifiable move the
register exists to avoid. It covers defects we found. Defects we did not find are, by
construction, absent — and the honest thing to say about them is that they exist and we
do not know what they are.

It is also not a claim that finding these makes the tool good. Two Tier 1 defects in a
verification tool is a poor showing, and the correct response to that number is not
applause for candour. What is defensible is narrower: each one was caught by a mechanism
still in place, each one has a guard that still runs, and the mechanisms that caught them
are described precisely enough that you can judge whether they would catch the next one.
