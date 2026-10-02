---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 20
agent: claude-code
updated: 2026-10-02 08:55 EDT
status: in-progress (full autopilot; signing excluded; IMPLEMENTER=mixed OD-40; early build behind the soak OD-41)
branch: m2/integration moving (M2-0530, M2-0504, M2-0410 merged today); main = milestone snapshot 2d2a85e8 (#429, merged 10:37Z)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; merged to main after CI + packaged smoke green. Signing excluded.

## Current state
- Milestone #429 merged into main (snapshot 2d2a85e8). M2-0530 (OD-42 window warm-up) merged into integration.
- 1.9.7 bump M2-0498 open deps: M2-0032 (READY #419; red only on a window-gate outlier, 351.9 ms among 87-125 ms -> OD-44 restart),
  M2-0495 (own file-capture smoke red: audit event yes, no live lines, no saved meeting), M2-0433 <- M2-0520 <- M2-0531.
- M2-0520 (M2-0433 slice S6, makes fifo/control blocking) HELD by the lead (STUCK + retried marker + state/M2-0520.lead): its
  precondition (a lead-recorded strict PASS of fifo and control on one QA self-test) is unmet. Run 36991557510: fifo NOT_EXERCISED.
- Root cause (verified in code): since M2-0193 (f15afa58) the storage gateway never opens a non-regular file, so no FIFO keeps a
  reader. OD-43 (owner): exercised = refused without opening; a FIFO with a reader at the end is a FAIL. M2-0531 filed P0 (also: the
  harness exits before stdout flushes, so job logs cut the report at 64 KiB); launched 11:55Z, first in .merge-first.
- Still open after M2-0531: the boot burst (first write 373 ms, loop 307 ms at ~1-2 s; control rows earlier 952-1201 ms) can fail
  strict ST-1 on hosted runners; control passed once (run 36991557510).
- Queue fixes installed today (Codex-attacked to SHIP, 26 suites green): critical_on_base (fix25: off-path PRs and trains wait for a
  READY critical PR on the same base), st1_summary (fix26: ST-1 failures feed verdict/criteria/worst samples), window_gate_only
  (fix27: OD-44 one restart per head when the window gate is the only red and failed on time alone).
- Overnight stalls were the host asleep (clamshell, battery) — not code.

## Next steps (in order)
1. Watch M2-0531 -> merge; then lead: run/inspect a QA self-test of integration with fifo+control; record strict PASS (or file the
   boot-burst fix) before releasing M2-0520 (rm state/M2-0520.status; the lead file explains the hold).
2. M2-0032: expect "closed and reopened #419" (OD-44) and a fresh run; M2-0495: implementer round on the file-capture smoke.
3. M2-0433 after M2-0520; then M2-0498 bump -> installer hold -> qa-candidate on main -> evidence lanes -> owner ACCEPT.
4. Known flakes: HIST rows stay until a few green Windows smoke runs after M2-0528; RE-HIDE-3 after 10 green macOS runs.
5. Owner items: keep the host awake overnight; OneDrive reset; earlier list (shift 16 archive).

## Decisions made (don't relitigate)
D-28 CI only; OD-12..OD-44 (OD-43 fifo exercised = refused without opening; OD-44 window-gate-only red = one new run per head);
PD-12 soak gate; never re-run qa-candidate.yml (build once); RELEASE-GATE lane rule (delete the file to revert).

## Watch out
- Program repo is PUBLIC: nothing secret/personal/meeting-related.
- Codex attacks from this sandbox: allowed_domains chatgpt.com, and inline every file in the brief (Codex's own shell sandbox cannot
  start here; running unsandboxed was denied).
- gh fails TLS inside the sandbox; the queue (launchd) fetches logs to logs/<ID>.infra-<run>.txt — read those.
- Before blaming code for a gap in queue.log, check `pmset -g log` for Sleep/DarkWake.
- Shell: bash script files (zsh: no word splitting, `$H:s` modifier, `=word` expansion).
