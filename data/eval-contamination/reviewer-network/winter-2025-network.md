# Reviewer Network — winter-2025

**Panel size:** 8 reviewers
**Shared-domain edges:** 17 of 28 possible
**Panel density:** 60.7%

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
| Risk Assessment | 4 |
| Existential Safety | 3 |
| Safety Frameworks | 3 |
| Governance & Accountability | 3 |
| Current Harms | 3 |
| Information Sharing | 2 |

## Domain clusters (3+ reviewers sharing a domain)

- **Existential Safety** — 3 reviewers: w25-stuart-russell, w25-david-krueger, w25-yi-zeng
- **Safety Frameworks** — 3 reviewers: w25-stuart-russell, w25-dylan-hadfield-menell, w25-jessica-newman
- **Risk Assessment** — 4 reviewers: w25-david-krueger, w25-dylan-hadfield-menell, w25-sharon-li, w25-tegan-maharaj
- **Governance & Accountability** — 3 reviewers: w25-jessica-newman, w25-sneha-revanur, w25-yi-zeng
- **Current Harms** — 3 reviewers: w25-sneha-revanur, w25-sharon-li, w25-tegan-maharaj

## Edges (shared-domain)

- w25-stuart-russell ↔ w25-david-krueger via Existential Safety
- w25-stuart-russell ↔ w25-dylan-hadfield-menell via Safety Frameworks
- w25-stuart-russell ↔ w25-jessica-newman via Safety Frameworks
- w25-stuart-russell ↔ w25-yi-zeng via Existential Safety
- w25-david-krueger ↔ w25-dylan-hadfield-menell via Risk Assessment
- w25-david-krueger ↔ w25-sharon-li via Risk Assessment
- w25-david-krueger ↔ w25-tegan-maharaj via Risk Assessment
- w25-david-krueger ↔ w25-yi-zeng via Existential Safety
- w25-dylan-hadfield-menell ↔ w25-jessica-newman via Safety Frameworks
- w25-dylan-hadfield-menell ↔ w25-sharon-li via Risk Assessment
- w25-dylan-hadfield-menell ↔ w25-tegan-maharaj via Risk Assessment
- w25-jessica-newman ↔ w25-sneha-revanur via Governance & Accountability, Information Sharing
- w25-jessica-newman ↔ w25-yi-zeng via Governance & Accountability
- w25-sneha-revanur ↔ w25-sharon-li via Current Harms
- w25-sneha-revanur ↔ w25-tegan-maharaj via Current Harms
- w25-sneha-revanur ↔ w25-yi-zeng via Governance & Accountability
- w25-sharon-li ↔ w25-tegan-maharaj via Risk Assessment, Current Harms

_Regenerate with_ `node scripts/eval-reviewer-network.js`.
