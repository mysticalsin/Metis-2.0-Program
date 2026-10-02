---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 21
agent: claude-code
updated: 2026-10-02 14:35 EDT
status: in-progress (full autopilot; signing excluded; IMPLEMENTER=mixed OD-40; early build behind the soak OD-41)
branch: m2/integration moving (M2-0531, M2-0032 merged today); main = milestone snapshot 2d2a85e8
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; merged to main after CI + packaged smoke green. Signing excluded.

## Current state
- 1.9.7 bump M2-0498 open deps: M2-0495 (sent back with a verified ruling), M2-0433 <- M2-0520 (held) <- M2-0532, M2-0533.
- Strict ST-1 (OD-21) still fails on hosted runners. Run 37008199760 (integration + M2-0531), reports + CPU profiles analysed and
  verified by two workflows: fifo FAIL (exercised under OD-43), control FAIL; first writes 904-1346 ms, loop blocks 400-1210 ms at boot;
  mostly native window construction (View ~580 ms) and an unprofiled block near renderer-ready (~570 ms); onboarded launches fail too
  (8/8); movable JS ~65-235 ms at boot and ~350 ms on the first History call. The harness under-measures boot (sample 0 always 0).
- Filed (fa55076): M2-0532 (ST-1 harness measurement; sent back 18:10Z: Node's histogram reset drops the next interval — use the
  never-reset whole-run max per sample), M2-0533 (boot + History trims; in CI rounds, last red only a baseline count to lower),
  M2-0534 (P1, synthetic row History after idle). M2-0520 amended (contract-test parity; synthetic stays report-only).
- M2-0495: the capture smoke's driver cannot click Stop (seeded profile uses the right-edge sidecar, whose button is "Stop meeting");
  zero live lines remains open (leading suspect: the sandboxed audio service cannot read the WAV) — the ruling makes a red self-explaining
  (app logs uploaded, one DIAG line). Disabling the audio-service sandbox for QA only would need evidence + owner approval.
- Queue fixes today (all Codex-attacked to SHIP, 26 suites green): critical_on_base, st1_summary, window_gate_only (OD-44),
  restart-wait (after a spent build-once restart, wait while a newer run works).

## Next steps (in order)
1. Watch M2-0532/M2-0533 -> merge; then measure fifo/control over >= 3 QA runs with the corrected harness (artifacts:
   gh run download outside the sandbox, parse with python only).
2. Bring the owner the strict-gate decision with those numbers: larger/dedicated macOS runner (keeps OD-21; check availability and
   cost) vs starting the strict window at first show with boot covered by the window gate (changes OD-21).
3. M2-0495: watch for the DIAG line; if it shows a fake device with zero input, ask the owner about the QA-only audio-sandbox switch.
4. Then M2-0520 (release the hold), M2-0433, M2-0498 bump -> installer hold -> qa-candidate on main -> evidence lanes -> owner ACCEPT.
5. Owner items: OneDrive reset (log loop recurred twice today; cleared with approval); keep the host awake and powered overnight.

## Decisions made (don't relitigate)
D-28 CI only; OD-12..OD-44; PD-12 soak gate; never re-run qa-candidate.yml (build once); RELEASE-GATE lane rule.

## Watch out
- Program repo is PUBLIC: nothing secret/personal/meeting-related.
- Codex attacks: allowed_domains chatgpt.com and inline every file in the brief. gh: read-only use outside the sandbox only.
- A READY ticket is sent back by writing state/<ID>.lead + .feedback and "NEEDS_SYNC <repo> <pr>" to its status.
- Shell: bash script files; rtk rewrites find/grep (use /usr/bin/*); zsh `$H:s` and `=word` traps.
