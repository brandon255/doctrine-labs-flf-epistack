# Reviewer Network — winter-2025

**Panel size:** 8 reviewers
**Shared-domain edges:** 6 of 28 possible
**Panel density:** 21.4%

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

- w25-r1 ↔ w25-r2 via Risk Assessment
- w25-r2 ↔ w25-r7 via Existential Safety
- w25-r3 ↔ w25-r4 via Current Harms
- w25-r4 ↔ w25-r8 via Information Sharing
- w25-r5 ↔ w25-r6 via Safety Frameworks
- w25-r6 ↔ w25-r7 via Governance & Accountability

_Regenerate with_ `node scripts/eval-reviewer-network.js`.
