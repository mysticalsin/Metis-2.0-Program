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
  `ACCEPTED`, `MEASURED`. Claim labels (software-architecture-engineer): `OBSERVED`, `PROVIDED`, `DERIVED`,
  `ASSUMED`, `PROPOSED`, `UNKNOWN`. Anything needing an outside account or owner is `BLOCKED_EXTERNAL` with the exact unblock step.
- **Where tests may run.** No repository test runs on any developer machine until M2-0001's hermetic canary has
  passed in CI; afterwards full suites run in CI, targeted runs on the isolated QA macOS user (AGENTS.md §3).
- **No fakes in production paths.** No mock metrics, stub endpoints, guessed model IDs, placeholder receipts.
- **No secrets, tokens, account IDs or personal emails** anywhere under `docs/`, `_relay/`, commits or PR text
  — see `review/REDACTIONS.md` for what was scrubbed when these docs were assembled.

Start every session by reading `_relay/HANDOFF.md`, then this file, then only the ledger ticket you are
assigned. Do not reload the whole plan or kit for every subtask.
