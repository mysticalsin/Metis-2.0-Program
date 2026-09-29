# LESSON-001: Fitness gates fail closed and never propose a raise

| Field | Value |
|---|---|
| Slice / ticket | M2-0047 (architecture fitness functions), the first refactor-program slice with an accepted status |
| Accepted on | UNKNOWN date. Status only: `ledger/tickets.json` M2-0047 is `ENGINEERING_COMPLETE` (OBSERVED, checked 2026-09-29) |
| Kind | tooling (gates for the refactor; no code moved) |
| Evidence level reached | DESIGNED at least. UNKNOWN whether LOCALLY_TESTED records exist: `evidence/records/` holds no M2-0047 file (OBSERVED, `ls evidence/records`). |

Why this slice: no seam slice (M2-0060 onward) is accepted yet; all are `TODO` in `ledger/tickets.json` (OBSERVED). M2-0047 is the first accepted slice the refactor depends on (`ledger/tickets/M2-0059.md`, `depends_on`). When the first pure-move slice is accepted, add LESSON-002 for it.

## What we did

Designed a two-part gate so god files cannot grow back while they are peeled: a dependency-cruiser layering check and a `check-architecture` ratchet with a committed baseline (`designs/M2-0047-DESIGN.md`, section 0).

## What worked

- OBSERVED: one committed baseline is the only record of accepted debt (`INV-ONE-BASELINE`, design section 1).
- OBSERVED: the only baseline the script ever prints is a lowered one, so a regression cannot be "fixed" by pasting a raise (`INV-NEVER-PROPOSE-A-RAISE`).
- OBSERVED: the ratchet fails on tool errors, unparseable output or a missing baseline instead of reading them as "0 violations" (`INV-FAIL-CLOSED`).

## What surprised us or went wrong

- OBSERVED: a lint `max-lines` suppression cannot stop a 9,565-line file reaching 9,600 (design section 0). A per-file count ratchet can.
- OBSERVED: under D-28 nothing runs on the owner's Mac, so every proof has to come from CI (`INV-CI-ONLY`). The local `tsc` projects do not cover `scripts/`.

## Rule for the next slice

Any new gate must fail closed, keep a single baseline, and print only lowered baselines; prove it from a CI run, not a local run.

## Source map and relay updates

- Source map (`ARCHITECTURE.md`) changed: no (this ticket only records the lesson)
- `CURRENT.md` continuation updated: yes, links this log
- Relay baton updated: LEAD_ACTION: add a line to `_relay/HANDOFF.md` pointing at `docs/metis-2.0/lessons/LESSON-001.md`
