# Métis 2.0 program docs

Program: engineering-complete delivery of the r11 kit, the v6 BRAG-Hindsight kit (and its v5 baseline), and
Tony's two P0 bug fixes, as an enterprise-grade refactor of Métis (`asktoto` / `com.mantu.asktoto`), by
2026-11-30. Owner: Tony. Plan owner: Opus (plans and validates every deliverable). Implementers: Sonnet
agents in isolated worktrees, one ledger ticket at a time.

## Index

| File | What it is |
|---|---|
| [`GOAL.json`](GOAL.json) | The single machine-readable statement of the goal, deadline and done-criteria. |
| [`PLAN.md`](PLAN.md) | Master plan: milestones, waves, ledger summary, operating model. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Governing target architecture (software-architecture-engineer DESIGN/EVOLVE). |
| [`DECISIONS.md`](DECISIONS.md) | Owner decisions, program decisions, ADR index, open decision register (D-1..D-29). |
| [`BLOCKERS.md`](BLOCKERS.md) | Every ticket with an external blocker, grouped by owner role, with the exact unblock step. |
| [`TRACEABILITY.md`](TRACEABILITY.md) / [`TRACEABILITY.json`](TRACEABILITY.json) | Every ID in the kit/registry inventory mapped to the ledger tickets that cover it. |
| [`ledger/INDEX.md`](ledger/INDEX.md) | All 213 tickets, grouped by wave, with type/owner/milestone/deps/blocker/status. |
| [`ledger/tickets.json`](ledger/tickets.json) | The ledger's source of truth (schema v2). |
| [`ledger/tickets/`](ledger/tickets/) | One file per ticket: full fields, acceptance and verification as checklists, plus `## Log` and `## Validation (Opus)`. |
| [`evidence/`](evidence/SCHEMA.md) | ADR-017: the evidence record schema, readiness labels, host labels and closure rules (M2-0002); `evidence/records/<ticket>.jsonl` holds the append-only records themselves. |
| [`review/`](review/) | Redacted copies of the review lane reports, coverage/prep notes, runtime evidence and the ChatGPT audit that this plan was built from. |
| [`kit/`](kit/) | Text-only reference copies of the r11, v6 and v5 input kits, for agents that only see this repo. |

## Conventions (see `AGENTS.md` at the repo root for the full text)

- **Ticket IDs**: `M2-0001`.. defined in `ledger/`. Each lists the kit references it satisfies (`TASK-027`,
  `UC-014`, `OBU-02`, `HMSTEP-05`, …) and the review findings it closes (`L01-F3`, `B2-F1`, …). Never
  renumbered or deleted — cancelled tickets are marked `CANCELLED` with a reason (see `M2-0186`).
- **Branches**: `m2/M2-0001-short-slug` for program work, `fix/<slug>` for hotfixes, off `main`.
- **Commits**: conventional commits carrying the ticket id, e.g. `fix(recall): cap read concurrency [M2-0012]`.
- **Pull requests**: one ticket per PR targeting `main`; stays in draft until Opus validation is recorded on
  the ticket.
- **Evidence levels** (Stark v9.3.0): `DESIGNED`, `LOCALLY_TESTED`, `HOST_CONFIGURED`, `LIVE_VERIFIED`,
  `ACCEPTED`, `MEASURED` — distinct and unordered; see [`evidence/SCHEMA.md`](evidence/SCHEMA.md). Claim
  labels (software-architecture-engineer): `OBSERVED`, `PROVIDED`, `DERIVED`, `ASSUMED`, `PROPOSED`,
  `UNKNOWN`. Anything needing an outside account or owner is `BLOCKED_EXTERNAL` with the exact unblock step.
- **Where tests may run.** No repository test runs on any developer machine until M2-0001's hermetic canary has
  passed in CI; afterwards full suites run in CI, targeted runs on the isolated QA macOS user (AGENTS.md §3).
- **No fakes in production paths.** No mock metrics, stub endpoints, guessed model IDs, placeholder receipts.
- **No secrets, tokens, account IDs or personal emails** anywhere under `docs/`, `_relay/`, commits or PR text
  — see `review/REDACTIONS.md` for what was scrubbed when these docs were assembled.

Start every session by reading `_relay/HANDOFF.md`, then this file, then only the ledger ticket you are
assigned. Do not reload the whole plan or kit for every subtask.

## Ticket status (M2-0002, ADR-017)

| Status | Meaning | What `scripts/evidence/check.mjs` enforces |
|---|---|---|
| `TODO` | Not started. | — |
| `IN_PROGRESS` | Claimed. | Every direct dependency is ready (`ENGINEERING_COMPLETE`, `DONE`, `DEFERRED` or `BLOCKED_EXTERNAL`). An estimate over 12h needs slices of at most 10h each. |
| `ENGINEERING_COMPLETE` | The work is done and its own (`DESIGNED`/`LOCALLY_TESTED`) evidence passed, but closure waits on an external blocker — its own, or one inherited from a capping ancestor. | At least one PASS record; a PASS record for every in-house required level; its own or an inherited external blocker; every latest record lists each capping ancestor's id in `inherited_block`. |
| `BLOCKED_EXTERNAL` | Cannot proceed without an outside owner. | `external_blocker` names the owner role, the exact unblock step, `needed_by` and `raised_on`. |
| `DEFERRED` | Shipped flag-off (`flag` names the flag), under the owner's dated approval (an `ACCEPTED` record) per the degrade order D-14. | Non-null `flag`; a latest `ACCEPTED` record with `result: PASS`. |
| `DONE` | Every level in `required_evidence` has a latest PASS record, validated by a session other than the implementer's, with no unresolved inherited block. | A PASS record per required level; no `ENGINEERING_COMPLETE`/`BLOCKED_EXTERNAL` ancestor remains (the sole exception is the ticket flagged `closes_program`, whose records instead list every such ancestor with its unblock step — the program sign-off, M2-0184, per PD-27). |
| `CANCELLED` | Will not be done. Never deleted. | Non-empty `reason`. |

## Dependencies and decisions (M2-0002, ADR-017)

`depends_on` lists **artifact** dependencies: work this ticket's own deliverable is built on. A ticket
enters the ready queue only once each is `ENGINEERING_COMPLETE`, `DONE`, `DEFERRED` or `BLOCKED_EXTERNAL`.
While an artifact dependency is `BLOCKED_EXTERNAL`, the downstream ticket can close only as
`ENGINEERING_COMPLETE` — never `DONE` — and its records carry `inherited_block` for it; it may become
`DONE` once the upstream itself reaches `DONE` **and** the affected verification is re-run, meaning a new
record at each required level with no `inherited_block` left on it.

`needs_decision` lists open `D-x` decisions this ticket's work depends on, tracked in the top-level
`decisions` register (`OPEN` / `ANSWERED_AS_DEFAULT` / `ANSWERED_CHANGED`; the human-readable register
stays `DECISIONS.md`). A decision **never caps closure** the way an artifact dependency does: work
proceeds on the decision's recorded default, and the record that relies on it must say so by listing the
decision id in `assumed_decisions` (an `OPEN` decision not listed there is an "unlabelled assumption" —
rule L12). If the register later answers a decision differently from the default a closed ticket's
evidence assumed (`ANSWERED_CHANGED`), the check lists that ticket for re-validation (rule L13) — it clears
once a fresh record at that level no longer assumes the stale answer.
