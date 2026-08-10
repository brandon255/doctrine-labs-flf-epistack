# Reviewer Network — summer-2026

**Panel size:** 7 reviewers
**Shared-domain edges:** 12 of 21 possible
**Panel density:** 57.1%

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
| Existential Safety | 3 |
| Risk Assessment | 3 |
| Current Harms | 3 |
| Governance & Accountability | 3 |
| Safety Frameworks | 2 |
| Information Sharing | 1 |

## Domain clusters (3+ reviewers sharing a domain)

- **Existential Safety** — 3 reviewers: s26-david-krueger, s26-stuart-russell, s26-yi-zeng
- **Risk Assessment** — 3 reviewers: s26-david-krueger, s26-sharon-li, s26-tegan-maharaj
- **Current Harms** — 3 reviewers: s26-sharon-li, s26-tegan-maharaj, s26-sneha-revanur
- **Governance & Accountability** — 3 reviewers: s26-sneha-revanur, s26-robert-trager, s26-yi-zeng

## Edges (shared-domain)

- s26-david-krueger ↔ s26-sharon-li via Risk Assessment
- s26-david-krueger ↔ s26-tegan-maharaj via Risk Assessment
- s26-david-krueger ↔ s26-stuart-russell via Existential Safety
- s26-david-krueger ↔ s26-yi-zeng via Existential Safety
- s26-sharon-li ↔ s26-tegan-maharaj via Risk Assessment, Current Harms
- s26-sharon-li ↔ s26-sneha-revanur via Current Harms
- s26-tegan-maharaj ↔ s26-sneha-revanur via Current Harms
- s26-sneha-revanur ↔ s26-robert-trager via Governance & Accountability
- s26-sneha-revanur ↔ s26-yi-zeng via Governance & Accountability
- s26-stuart-russell ↔ s26-robert-trager via Safety Frameworks
- s26-stuart-russell ↔ s26-yi-zeng via Existential Safety
- s26-robert-trager ↔ s26-yi-zeng via Governance & Accountability

_Regenerate with_ `node scripts/eval-reviewer-network.js`.
