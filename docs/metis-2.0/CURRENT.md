# CURRENT

## Refactor lessons and method (M2-0443, M2-0059 remainder)

- Numbered lessons log: [`lessons/`](lessons/README.md) (template: [`lessons/TEMPLATE.md`](lessons/TEMPLATE.md); first lesson: [`lessons/LESSON-001.md`](lessons/LESSON-001.md), from M2-0047). Every accepted refactor slice adds the next `LESSON-NNN` and updates this file.
- Refactoring-skill identity (D-15): OPEN as of 2026-09-29. `DECISIONS.md:129` lists D-15 with status OPEN, deadline 2026-10-05 and default "software-architecture-engineer v1.4.0 plus Stark v9.3.0 substitute for it"; `BLOCKERS.md:25` (B-09) asks the owner to name the promised skill or confirm the substitution. No owner answer is on file (UNKNOWN beyond those files).
- Until the owner answers, the SAE v1.4.0 + Stark v9.3.0 default is the working method (ASSUMED, per D-15). Ponytail is complementary guidance only (`ledger/tickets/M2-0059.md`, Summary).
- LEAD_ACTION: after 2026-10-05, if the owner has not named another skill, set D-15 to DECIDED (default applied) in `DECISIONS.md`, close B-09 in `BLOCKERS.md`, and update this section from "OPEN" to the decision, citing D-15. If the owner names a skill, record its name, location and version here instead.

# Engineering source graph (M2-0377)

- Decision (PROPOSED, 2026-09-28): adopt neither code-review-graph nor Graphify for engineering context yet; baseline is direct scoped search; no Python graph tooling in the Métis installer. See `adr/ADR-025-engineering-graph.md`.
- Open: pinned-commit source review (network), before/after measurement (`evidence/eng-efficiency.md`, all cells UNKNOWN), the no-developer-metric regression test (`tools/eng-graph/README.md`), independent validator. Each is a LEAD_ACTION in the ADR §7.
