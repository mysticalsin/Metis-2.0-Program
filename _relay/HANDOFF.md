---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 23
agent: claude-code
updated: 2026-10-02 20:25 EDT
status: in-progress (OD-45/OD-47: 1.9.7 first, 2.0 builds now and lands after; OD-48 stacked swarm staged; signing excluded)
branch: m2/integration fd312505 (M2-0537 merged; qa-candidate.yml REJECTED by GitHub — M2-0542 fixing); main = milestone 2d2a85e8
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship stable 1.9.7 first (OD-45; owner ACCEPT), then Métis 2.0 = the v6 kit (byte-identical to the owner's
Metis-Upgrade-v6-BRAG-Hindsight zip; r11/v5 nested) merged to main and owner-accepted by 2026-11-30, freeze M2-0210 on 11-15.
Every release check preserved. Goal registered in the vault (_agent_state/mantu-goal/goal-2026-10-02-metis-2-0-ship.json).

## Current state
- Decisions today: OD-47 (FOCUS lifted, build 2.0 now, merge deferral DEFER-OFFPATH stays), OD-48 (stacked swarm), OD-49 (M2-0202
  ships in 1.9.7), OD-50 (no cuts; checkpoint: M2-0132 merged by 11-08 else bring D-14 list).
- RELEASE-GATE = M2-0046 (whole 1.9.7 closure critical: M2-0495/0496/0497/0498/0500/0503/0202/0433/0520/0538/0542).
  .merge-first: M2-0542, M2-0495, M2-0538, M2-0202, M2-0503, M2-0500. PARALLEL 8, IMPLEMENTER mixed.
- M2-0537 merged 00:04Z but its job-level `env: TMPDIR: ${{ runner.temp }}` makes GitHub reject qa-candidate.yml (run 37080507880,
  0 jobs). No QA candidate check runs anywhere. M2-0542 (P0, first) fixes it + a workflow-context contract test. M2-0495, M2-0500,
  M2-0503 are lead holds (STUCK + .retried, release line in the status) until M2-0542 merges; list in state/.hold-for-0542.
- M2-0538 depends on M2-0542; lead ruling: keep the QA app out of the owner's login keychain (mock keychain), drop the
  `security delete-generic-password` cleanup.
- M2-0495: harness now reports page-discovery reasons and bounds CDP steps (ruling 23:50Z); READY at f3b499f7, held (above).
- Filed today: M2-0539 (ST-1 window first launch >250 ms), M2-0540 (History slow capture timeout), M2-0541 (verify-move ENOBUFS)
  — all building; M2-0538 linked; M2-0500/0503/0202 linked to M2-0046.
- Queue scripts staged, not installed: ledger.py/lib.sh/ticket.sh.fix31 (OD-48 stacking; tests/stack-build.sh 15/15; Codex attack r1
  REVISE fixed, r2 running) and the merge-lane batch (generator scratchpad lane-patch.py -> merge.sh/lib.sh/milestone.sh.fix32:
  repeat-bounce -> lead hold, infra regex, milestone lookup failure, invalid_workflows in pr_checks; tests/lane-bounce.sh) — generate
  fix32 only AFTER fix31 is installed (both edit lib.sh).

## Next steps (in order)
1. Codex attack r2 on fix31 -> SHIP -> install (mv, logs/*.pre-* backups), touch codex-queue/STACK-BUILD, PARALLEL 16.
2. Generate fix32 from the live files, run all tests/*.sh, Codex attack, install. It must land before the next milestone (after
   10-03 10:37Z) or main inherits the rejected qa-candidate.yml.
3. M2-0542 merged -> release the holds in state/.hold-for-0542 (restore each READY line from its STUCK text, rm .retried).
4. M2-0538 -> 3 strict runs on the owner runner -> lead-recorded strict PASS -> release M2-0520 -> M2-0433 -> M2-0496/0497 ->
   M2-0498 bump -> installer hold -> qa-candidate on main -> evidence -> owner ACCEPT -> delete DEFER-OFFPATH -> swap Mac apps.
5. Owner item open: Mac sleep cost ~10 lane-h in 2 days (lid closed); recommended keep awake on power, or move merge.sh/milestone.sh
   to an always-on host (GitHub-API only, D-28 safe).

## Decisions made (don't relitigate)
D-28 CI only (OD-46: strict ST-1 jobs on the owner runner only); OD-12..OD-50; never re-run qa-candidate.yml (build once).

## Watch out
- Program repo is PUBLIC: nothing secret/personal/meeting-related.
- A workflow GitHub rejects creates no check runs: pr_checks cannot see it until fix32 (invalid_workflows) is installed.
- Codex: `export PATH=/Users/tony/AI-Brain-build/tools/codex-shim:$PATH` before rf-codex.sh; allowed_domains chatgpt.com.
- Review diffs in full; check edits outside scope_paths (gate_guard holds .github/workflows + scripts/ci edits out of scope).
