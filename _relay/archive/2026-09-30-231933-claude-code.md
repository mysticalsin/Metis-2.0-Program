---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 16
agent: claude-code
updated: 2026-09-30 17:50 EDT
status: in-progress (full autopilot; signing excluded; IMPLEMENTER=mixed OD-40; early build behind the soak OD-41)
branch: m2/integration = 629e28c8; main = 009ab850 (milestone #396, 41 commits, 20:12Z); program repo PUBLIC temporarily (OD-37)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; merged to main after CI + packaged smoke green. Signing excluded.

## Current state
- Ledger 528 tickets, 368 unfinished (~2,479 h). Queue: 6 running, 47 READY, 1 STUCK (M2-0205, lead ruling in state/M2-0205.lead; service retry pending).
- 1.9.7 bump M2-0498: 12/19 deps done. Open: M2-0431 (slice 2 READY, 2 unlisted Windows HIST rows red), M2-0193 (slice 4/4 running), M2-0495/M2-0505 (READY; stale QA-build infra reds re-run by lead 21:0xZ), M2-0433 (waits M2-0516/0518/0519/0520), M2-0032/0512/0514 (wait M2-0193).
- Main: milestone #396 merged by milestone.sh; resource-census.yml dispatched on main (run 36773284514, M2-0009 evidence); candidate-scenarios.yml registered on main (Rock 3 precondition met; M2-0524 still waits M2-0495).
- Queue fixes installed today (codex-queue/tests/*.sh: 16 suites, 128/128 PASS):
  - vitest_fails + known_flakes_only (per failed job; unhandled-error guard): no more false STOPs from harness rows.
  - ci_key_failures heads CI feedback (failing tests + architecture-baseline differences; 36 tickets had failed the baseline 69 times blind).
  - milestone.sh: PR head = snapshot branch m2/milestone (fast-forward push), judged by merge.sh's shared rule (pr_checks/pending_checks/rerun_infra now in lib.sh).
  - Train boarding: known-flake-only smoke reds board; stale infra/known-flake reds of PRs behind the base re-run once; verdicts cached per run attempt (state/.verdict-<run>); boarding scans 24.
  - is_infra_flake: tagged-script network FAIL lines and Go network errors are infrastructure.
- Codex attack trend on these: r1 REVISE, r2 REVISE (rebutted with evidence + guard), r3 REVISE (no-run-id red; fixed), r4 RUNNING (codex-queue/.rocket-fuel/codex/attack-cijudge-r4.last.txt).
- M2-0528 filed (deflake Windows HIST-dirty-discard/save-recent) + those rows listed in codex-queue/known-smoke-flakes.txt; M2-0527 running (intelligence-index deflake).

## Next steps (in order)
1. Read attack-cijudge-r4.last.txt; fix any blocker via a .fix copy + mv (backups logs/*.pre-*), rerun every tests/*.sh, attack again until SHIP.
2. Watch the next train build: it should board up to 4 cars (log "train #N: K PRs ... squashed"); look for "re-ran once (behind the base)".
3. M2-0205 retry: confirm its next CI feedback starts with "Architecture baseline differences"; if it sticks again, slice it.
4. Known-flake removals: RE-HIDE-3 row after 10 green macOS smoke runs (M2-0526 merged); intelligence-index line when M2-0527 merges; HIST rows when M2-0528 merges.
5. After M2-0498 merges: installer hold is automatic; milestone (snapshot PR) -> qa-candidate on main -> evidence lanes (HK-M 20/20) -> owner ACCEPT -> promote.
6. Owner items: M2-0012, M2-0522 (Jev kill switch + redeploy), M2-0498 questions, D-3/D-13/D-29, M2-0058 signing budget, M2-0014, M2-0214 key, GitHub support request, soak after 1.9.7, M2-0480 at the end.

## Decisions made (don't relitigate)
D-28 CI only; OD-12..OD-41 in DECISIONS.md; PD-12 soak gate stays; rocket-fuel engagement 2 G6 approved (Rock 1+2 DONE, Rock 3 = M2-0524).

## Watch out
- Program repo is PUBLIC: nothing secret/personal/meeting-related.
- Queue scripts: edit via .fix + mv (re-runnable patch scripts read live), keep logs/*.pre-* backups, run every tests/*.sh; zsh does not word-split and macOS bash 3.2 mis-scans quotes inside "$( "..." )" (use single-quoted sed scripts).
- Check Codex attack liveness with pgrep -lf, never ps|grep; high-effort attacks take 30-70 min; never remove a statedir .lock while one runs.
- Take ledger.lock and run ledger.py check (abort on ^cycle / slice_current) before every ledger push.
