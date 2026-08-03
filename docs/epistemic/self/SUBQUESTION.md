# Self case — does the evidence support the claim of exceptional output?

**Sub-question:** Does the available evidence support the claim that the builder's
output over the ten-week window from 2026-05-31 to 2026-08-02 is exceptional?

**Case type:** bring-your-own-case, **evidence kind:** measurement.

This is the recursive demo. The FLF Epistemic Stack was built to adjudicate contested
claims with independent evidence. A claim about the builder's own output is a contested
claim with independent evidence — every measurement below re-runs against the
companion repositories. Running the stack on its own author is the test of whether the
framework generalises past its three text-evidence cases.

**Honest framing, fixed in advance:** the run is expected to flag the rarity funnel.
We do not ship "our tool says we're great." We ship "our tool caught our own
overstatement, and here is the run log."

## How to run

```bash
node scripts/epistemic-run.js self            # cold: no model needed
node scripts/adjudicate-run.js self lineage   # full protocol: needs Ollama
```

## How measurements reach another repository

A claim like *"Core OS has 536 tests"* has to run somewhere other than this case
directory. The block does **not** carry a path. It names a root, and
`source_registry.json` declares what that name maps to:

```json
"measurement_roots": {
  "coreos": "/absolute/path/to/doctrine-labs",
  "epistack": "/absolute/path/to/doctrine-labs-flf-epistack"
}
```

A block can only reach a directory the case author already declared, and an
undeclared name fails closed rather than falling back to the current directory.
The paths are machine-specific: on a fresh checkout they need editing, and until
they are, those measurements fail. That is the intended behaviour — a
measurement that cannot run should not quietly pass.

## What the case contains

| Block | Kind | Verifies? |
|---|---|---|
| Core OS commit count | measurement, root `coreos` | yes — 94 |
| Core OS test count | measurement, root `coreos` | yes — 536 |
| Core OS first commit date | measurement, root `coreos` | yes — 2026-05-31 |
| Epistack commit count | measurement, root `epistack` | yes — 8 |
| Epistack test count | measurement, root `epistack` | yes — 165 |
| Nineteen-day span | text, two providers | quoted |
| **Rarity funnel** | measurement | **no — deliberately flawed** |
| **Correlation companion** | measurement | **no — deliberately flawed** |

## The result the case exists to produce

Eight excerpts resolve to seven documents and **four lineages**. Three of those
Core OS measurements read one working tree at one commit, so "94 commits *and*
536 tests *and* a May 31 start" is one observation of the world described three
times — not three independent facts about productivity.

The tool deflates its own author's most flattering framing using exactly the
mechanism it uses on the COVID corpus. That is the point of including it.
