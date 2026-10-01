---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 17
agent: claude-code
updated: 2026-09-30 23:19 EDT
status: in-progress (full autopilot; signing excluded; IMPLEMENTER=mixed OD-40; early build behind the soak OD-41)
branch: m2/integration = ab492b28; main = 009ab850 (milestone #396); program repo PUBLIC temporarily (OD-37)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; merged to main after CI + packaged smoke green. Signing excluded.

## Current state
- Queue: 43 READY (merge lane is the bottleneck), 1 STUCK, few startable tickets (the rest wait on dependencies). Next milestone due after 2026-10-01 20:12Z (snapshot PR from m2/milestone).
- 1.9.7 bump M2-0498: 11/19 deps done; open M2-0431, M2-0433 (waits M2-0518/0519/0520), M2-0193 (last slice; WAIT_OWNER re-review), M2-0032/0512/0514 (wait M2-0193), M2-0495/M2-0505 (QA-candidate reds need a sync: never re-run QA candidate).
- Disk: the Mac hit ENOSPC ~01:15Z (cause OUTSIDE AI-Brain-build, which is flat at 92 GB); still draining slowly. Owner notified. Queue writers pause below 5 GiB (disk_low).
- Installed and Codex-attacked to SHIP this shift (codex-queue/tests/*.sh: 20 suites green):
  - CI judgement: vitest_fails, known_flakes_only (per job), smoke_failset_parse (harness failure categories), ci_key_failures in feedback.
  - Milestone snapshot branch m2/milestone; shared PR-check rule in lib.sh.
  - Train boarding (known-flake cars board, stale infra reds re-run once behind the base, scans 24).
  - Build-once (QA candidate): never re-run; restart_pr_checks (close/reopen once per head); orphans_red bounds a cancelled orphan (15-min grace after restart, 60 min by run updatedAt or first sight).
  - disk_low guards in merge, ticket, milestone, watch-integration, guard.
  - Red-train blame by file names in failing test titles.

## Next steps (in order)
1. If the disk keeps draining: the queue pauses at 5 GiB; owner must free space (Storage settings). Candidates the owner may approve: merged-ticket worktrees (~5 GB), old release build dirs in AI-Brain-build (~38 GB).
2. Watch trains: expect fewer all-solo reds (log "touched <file> and go solo").
3. M2-0193 last slice re-review; M2-0495/M2-0505 sync; M2-0205 (lead ruling in state/M2-0205.lead, retried 00:51Z).
4. Known-flake removals: RE-HIDE-3 row after 10 green macOS runs; intelligence-index line when M2-0527 merges; HIST rows when M2-0528 merges.
5. service.sh's running loop predates its 2026-09-29 edits; restart it only when no merge pass is running.
6. After M2-0498: installer hold -> milestone -> qa-candidate on main -> evidence lanes -> owner ACCEPT -> promote. Owner items unchanged (see shift 16 archive).

## Decisions made (don't relitigate)
D-28 CI only; OD-12..OD-41 in DECISIONS.md; PD-12 soak gate; never re-run qa-candidate.yml (build once by design).

## Watch out
- Program repo is PUBLIC: nothing secret/personal/meeting-related.
- Queue scripts: edit via re-runnable patch scripts -> .fixN + mv, logs/*.pre-* backups, run every tests/*.sh; tests may only arrange state the production code creates.
- Codex attack liveness: pgrep -lf, never ps|grep; never remove a statedir .lock while one runs.
- Never name scratch scripts after stdlib modules (inspect.py shadowed Python's).
