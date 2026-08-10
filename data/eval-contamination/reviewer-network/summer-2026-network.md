# Reviewer Network — summer-2026

**Panel size:** 7 reviewers
**Shared-domain edges:** 6 of 21 possible
**Panel density:** 28.6%

## Methodology

The FLI Index methodology publishes reviewer domain assignments but
does not name all reviewers. We build the structural graph from
domain assignments alone: two reviewers are connected if they
share at least one domain.

A density above 30% indicates the panel is structurally clustered
around shared domains. The 'independent' framing presumes
density below that.

## Per-domain reviewer counts

| Domain | Reviewer count |
|--------|----------------|
| Risk Assessment | 2 |
| Existential Safety | 2 |
| Current Harms | 2 |
| Information Sharing | 2 |
| Safety Frameworks | 2 |
| Governance & Accountability | 2 |

## No domain has 3+ reviewers

The panel structure is balanced across domains (no single domain has 3+ reviewers).

## Edges (shared-domain)

- s26-r1 ↔ s26-r4 via Risk Assessment
- s26-r1 ↔ s26-r5 via Existential Safety
- s26-r2 ↔ s26-r6 via Current Harms
- s26-r2 ↔ s26-r7 via Information Sharing
- s26-r3 ↔ s26-r5 via Governance & Accountability
- s26-r3 ↔ s26-r6 via Safety Frameworks

_Regenerate with_ `node scripts/eval-reviewer-network.js`.
