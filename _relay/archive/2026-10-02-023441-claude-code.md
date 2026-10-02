---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 18
agent: claude-code
updated: 2026-10-01 12:45 EDT
status: in-progress (full autopilot; signing excluded; IMPLEMENTER=mixed OD-40; early build behind the soak OD-41)
branch: m2/integration = 7ac31ea1; main = 009ab850 (milestone #396); program repo PUBLIC temporarily (OD-37)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; merged to main after CI + packaged smoke green. Signing excluded.

## Current state
- 1.9.7 bump M2-0498: 15/19 deps done; open M2-0433 (waits M2-0518/M2-0520), M2-0032 (History design-evidence contrast fix, in work), M2-0495, M2-0505 (READY after a one-line baseline ruling; bounced once more on a SAPI timeout, now classified infra).
- M2-0519 merged with prewarm-view shipped; measured on its QA run: construct <= 221 ms, prewarm <= 242 ms in both chromes (thin margin on the cold first run).
- Queue: 39 READY, 1 STUCK; 25 merged today. Lane: RELEASE-GATE (codex-queue/RELEASE-GATE = M2-0498) — only critical-path in-flight PRs hold the lane; trains run again.
- Disk: the 4 fills tonight were OneDrive's SyncEngine error loop (~1.3 GiB/min of logs). OneDrive app + "OneDrive Sync Service" stopped 16:20Z with owner approval; owner to reset OneDrive / fix its sync issue. Queue pauses itself below 5 GiB (disk_low).
- Installed + Codex-attacked to SHIP since shift 17 (codex-queue/tests/*.sh: 22 suites green): build-once restart/orphan bounds incl. newer_run_working (bounded 2 h); pr_checks newest-by-job-id (no stale green behind a queued re-run); is_infra_flake (':' tags, fetch failed); critical-path lane protection; M2-0529 deflake filed + merged.
- Codex review thread rotated to 01a0f82d-39ed-7c02-a42e-876a684bc1e4 (old one refused resume).

## Next steps (in order)
1. Watch trains/merges; M2-0518, M2-0520 -> M2-0433 -> M2-0498 (installer hold) -> milestone (snapshot PR) -> qa-candidate on main -> evidence lanes -> owner ACCEPT.
2. Stuck tickets: lead rulings in state/<ID>.lead, then retry (service.sh's STUCK retry only runs when queue.sh returns — retry by hand: touch state/<ID>.retried; rm state/<ID>.status).
3. Known-flake removals: RE-HIDE-3 after 10 green macOS runs; intelligence-index line when M2-0527 merges; HIST rows when M2-0528 merges.
4. When OneDrive is back: watch ~/Library/Logs/OneDrive; if it grows fast the loop is back.
5. service.sh's running loop predates its 2026-09-29 edits; restart only when no merge pass runs.
6. Owner items unchanged (shift 16 archive) + OneDrive reset.

## Decisions made (don't relitigate)
D-28 CI only; OD-12..OD-41; PD-12 soak gate; never re-run qa-candidate.yml (build once by design); RELEASE-GATE lane rule (delete the file to revert).

## Watch out
- Program repo is PUBLIC: nothing secret/personal/meeting-related.
- Queue scripts: re-runnable patch scripts -> .fixN + mv, logs/*.pre-* backups, every tests/*.sh; tests may only arrange state production creates; model real workflow shapes (late job creation) in fixtures.
- Run shell experiments in bash, not zsh (word splitting) and use script files (bash 3.2 quote bug); mktemp needs $TMPDIR in the sandbox.
- Codex liveness: pgrep -lf; never touch a statedir .lock while one runs.
