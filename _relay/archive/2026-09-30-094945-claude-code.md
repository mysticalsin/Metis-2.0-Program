---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 14
agent: claude-code
updated: 2026-09-30 03:52 EDT
status: in-progress (full autopilot; signing excluded; rocket-fuel engagement 2 with Codex as Integrator)
branch: public main = df205007; m2/integration = 9c2fef0a; program repo Metis-2.0-Program is PUBLIC temporarily (OD-37; revert via M2-0480 at program end)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; HeyClicky parity plus the owner's asks (r11 MASTER, v5/v6); merged to main after CI and packaged smoke are green. Signing is excluded.

## Current state
- **Ledger:** 524 tickets. Critical path: 1.9.7 (M2-0046, FULL qualification, OD-31) → owner 5-day soak (M2-0198) → PD-12-gated W3+ → freeze 11-15 → ship 11-30.
- **Slicing is live (rocket-fuel Rock 1, installed ~08:00Z 09-30):** 103 tickets build one ≤8 h slice per PR (ledger `slices` + `slice_current`). `ledger.py done` advances the slice (idempotent per PR); merge.sh record() → lib.sh slice_advanced clears per-slice state only when the ledger push reached origin; a manual lead is archived as state/<ID>.lead.<slice> and the next slice gets an AUTO-SLICE lead. Tests: codex-queue/tests/{slice-progression,slice-record,pipe-has}.sh. Codex round-2 attack pending → then Rock 1 DONE.
- **Queue bug fixed live:** `| grep -q` under pipefail misread big CI logs (SIGPIPE) → real failures got flake reruns; lib.sh pipe_has now used for large producers (also installer_held and the honest-status marker scan).
- **Rock 2 (Codex building):** IMPLEMENTER=mixed (opus tickets: Claude builds, Codex reviews; sonnet: the reverse; fallback on 75; never self-review). Writes only .new files + tests/implementer-routing.sh; install after Level 10.
- **Rock 3:** M2-0524 journey scenario (2 slices, deps M2-0467/0494/0495). M2-0467 bounced once: its contract test expected the pre-M2-0499 qa-candidate ref guard (lead note in state/M2-0467.lead).
- **Filed today:** M2-0523 (HK-M RAM-floor parity test), M2-0524. M2-0460 step 1 done: 5 integration smoke runs, hosted mac memsize 7 GiB, ramFloorOverride 2 rows, HK-M 5/5 each.

## Next steps (in order)
1. Codex round-2 verdict on Rock 1 (.rocket-fuel/codex/attack-rock-1-r2.last.txt): fix any finding, then mark Rock 1 DONE.
2. Rock 2 Level 10: run every codex-queue/tests/*.sh by hand, read every .new diff, then install via mv; set IMPLEMENTER=mixed only after that.
3. Review P0 PRs as they go READY; after M2-0498 merges the installer hold is automatic (state/.installer-hold).
4. Milestone merge → qa-candidate on main → evidence lanes (HK-M 20/20 for M2-0028) → release/1.9.x + promote after owner ACCEPTED.
5. M2-0202 slice 7 needs M2-0418 merged first (hold by hand if not).
6. Owner items: D-8 Jev kill switch OFF + Access bypass scope check, then Operator redeploy (M2-0522); revoke the Kimi key (M2-0214); M2-0012; Neon account; repo private at the end (M2-0480).

## Decisions made (don't relitigate)
D-28 CI only; OD-12..OD-39 and D-5/6/8/14/15 in DECISIONS.md; PD-12 soak gate stays; rocket-fuel PLAN.md approved (meet-r4).

## Watch out
- The program repo is PUBLIC: nothing secret, personal or meeting-related may be pushed.
- Edit queue scripts via .new + mv (backups in codex-queue/logs/*.pre-rock1-*). Bash 3.2 quirks. zsh does not word-split: run loops in bash. Take ledger.lock and run ledger.py check (abort on ^cycle or slice_current) before every ledger push.
- Network drops happen: passes then fail silently in service.err.
