---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 15
agent: claude-code
updated: 2026-09-30 09:49 EDT
status: in-progress (full autopilot; signing excluded; queue IMPLEMENTER=mixed since 13:06Z, OD-40)
branch: m2/integration = 3a17f9fa; program repo Metis-2.0-Program PUBLIC temporarily (OD-37; revert M2-0480)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; merged to main after CI + packaged smoke green. Signing excluded.

## Current state
- Ledger 526 tickets: 378 unfinished (~2,579 h), 103 slice-driven (372 slices left). 1.9.7 (M2-0046, target 10-07..09) has ~40 open deps.
- Queue now: IMPLEMENTER=mixed (opus-owned: Claude Opus builds / Codex reviews; sonnet-owned: Codex builds / Claude Opus reviews; exit 75 -> other vendor; routing in codex-queue/route.sh + lib.sh model_*). Rollback: echo claude > codex-queue/IMPLEMENTER (backups logs/*.pre-rock2-*).
- Live queue improvements today (all attacked by Codex to SHIP, tests in codex-queue/tests/*.sh — run all, every one must PASS): slice automation (Rock 1), pipe_has (pipefail SIGPIPE), job-keyed flaky smoke rows, fail-fast CI proof + ci_* run-identity helpers, ledger_push_done (no stale local ledger commits), critical-chain rank (ledger.py rank; candidates + merge order), M2-0525 macOS path gate merged (queue 45 -> 9).
- 1.9.7 path: ST-1 chain M2-0516/0517 running (Claude Opus), M2-0193 slice 1 re-sync, M2-0431.2 READY #379 (lead-approved), census/scenario chain waits on READY M2-0467/0473/0486/0487 (first in state/.merge-first).
- M2-0526 (RE-HIDE-3 flake root cause) bounced 13:45Z: its own trace disproved the setMinimumSize theory; direction = roundedCorners:false (state/M2-0526.feedback).

## Next steps (in order)
1. Keep 1.9.7 critical path moving: review P0 PRs as they go READY; merge order state/.merge-first (1.9.7 unblockers first), rest by ledger rank.
2. Watch mixed-mode rounds (queue.log: fallback / no reviewer / codex usage limit).
3. M2-0526: confirm its next PR smoke geometry trace shows no 'frame' above the band before it merges; then remove the known-smoke-flakes row after 10 green runs.
4. After M2-0498 merges: installer hold is automatic; milestone -> qa-candidate on main -> evidence lanes (HK-M 20/20) -> owner ACCEPT -> promote.
5. Owner items (see the remaining-work report 2026-09-30): M2-0012, M2-0522 (Jev kill switch + redeploy), M2-0498 questions, D-3/D-13/D-29, M2-0058 signing budget, M2-0014, M2-0214 key, GitHub support request, soak after 1.9.7, M2-0480 at the end.
6. Pending owner answer: build post-soak tickets during the soak (merge after) to buy ~5 days — offered, not decided.

## Decisions made (don't relitigate)
D-28 CI only; OD-12..OD-40 in DECISIONS.md; PD-12 soak gate stays; rocket-fuel engagement 2 G6 approved (Rock 1+2 DONE, Rock 3 = M2-0524 waits on M2-0467 on main).

## Watch out
- Program repo is PUBLIC: nothing secret/personal/meeting-related.
- Queue scripts: edit via .new/.fix + mv, keep logs/*.pre-* backups, run every tests/*.sh; zsh does not word-split (use bash).
- Take ledger.lock and run ledger.py check (abort on ^cycle / slice_current) before every ledger push.
