---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 19
agent: claude-code
updated: 2026-10-02 02:45 EDT
status: in-progress (full autopilot; signing excluded; IMPLEMENTER=mixed OD-40; early build behind the soak OD-41)
branch: m2/integration = b5d3b8b9; main = 009ab850 (milestone #396); program repo PUBLIC temporarily (OD-37)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; merged to main after CI + packaged smoke green. Signing excluded.

## Current state
- Ledger: 94 DONE, 100 ENGINEERING_COMPLETE, 332 TODO (30 READY, 6 running, 295 not started), 3 BLOCKED_EXTERNAL, 1 CANCELLED.
- 1.9.7 bump M2-0498: open deps M2-0032 (READY #419, CI running), M2-0495 (READY #377), M2-0520 (in review rounds) -> M2-0433, M2-0530 (OD-42 window warm-up launch, launched 06:30Z, first in .merge-first). M2-0518, M2-0529, M2-0505, M2-0491 merged.
- Milestone #429 red on the ST-1 window gate (5f0fe601) until M2-0530 lands; it then moves to the next green integration head.
- Overnight throughput (2 merges in 9 h) was the host asleep (pmset: clamshell sleep on battery); the queue ran only in ~45 s maintenance wakes. Not a code defect: no timeout patch.
- STUCK triage: M2-0410 revert guard was a move (pinnedBridgeCall moved to golden-flows/right-edge-hide-rows.mjs; pinnedExpression was only in its doc comment) -> allow-removal for that one identifier + lead ruling to port integration's History-seeding changes on the re-sync; retried. M2-0205 (16 rounds; ingest-completion.test.ts:308/:332, ingest-team.test.ts:122) under read-only diagnosis for a lead ruling.

## Next steps (in order)
1. Watch M2-0032, M2-0495, M2-0520 -> M2-0433, M2-0530 -> M2-0498 bump (installer hold) -> milestone #429 -> qa-candidate on main -> evidence lanes -> owner ACCEPT.
2. M2-0205: write state/M2-0205.lead from the diagnosis (sync first: 30 behind), then retry (touch state/M2-0205.retried; rm state/M2-0205.status).
3. M2-0410: confirm the re-synced head keeps every integration identifier (revert guard) and goes READY.
4. When M2-0404 slice 1 merges ("slice merged"): rm state/M2-0404.kind so slice 2 (ratchet) is classified Behaviour change.
5. Known-flake removals: RE-HIDE-3 after 10 green macOS runs; HIST rows when M2-0528 merges.
6. Owner items: keep the Mac awake overnight (on power, lid open); OneDrive reset; earlier list (shift 16 archive).

## Decisions made (don't relitigate)
D-28 CI only; OD-12..OD-42 (OD-42: one unmeasured warm-up launch before ST-1 window rows); PD-12 soak gate; never re-run qa-candidate.yml (build once by design); RELEASE-GATE lane rule (delete the file to revert).

## Watch out
- Program repo is PUBLIC: nothing secret/personal/meeting-related.
- Before blaming code for a gap in queue.log, check `pmset -g log` for Sleep/DarkWake in that window.
- Queue scripts: re-runnable patch scripts -> .fixN + mv, logs/*.pre-* backups, every tests/*.sh (23 suites green).
- Shell: bash script files, not zsh (word splitting; `$H:s` is a zsh modifier — write `${H}:path`); mktemp needs $TMPDIR.
- gh inside the sandbox fails TLS (x509 OSStatus); read PR state from git where possible.
- Codex liveness: wait on the attack PID; never touch a statedir .lock while one runs.
