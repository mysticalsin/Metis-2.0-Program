---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 9
agent: claude-code
updated: 2026-09-28 13:10 EDT
status: in-progress (full autopilot; signing excluded)
branch: public m2/integration (green Build & Test; packaged smoke red only on known rows); main not yet merged; private main (metis-prog-main)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level, HeyClicky-parity + owner asks (r11 MASTER, v6), well-structured code; merges incl. m2/integration -> main after CI + packaged smoke are green (owner directive); signing excluded.

## Current state
- Ledger: M2-0001..M2-0411 (175 new from the 2026-09-28 capability audit, review/audits/2026-09-28-capability-gap-audit.json). Decisions OD-13..OD-17 in DECISIONS.md.
- Worker: launchd com.tony.metis-codex-queue -> service.sh -> queue.sh 3 (guard.sh, merge.sh + milestone.sh in background, launches). OD-14: codex-queue/IMPLEMENTER=claude (headless Sonnet via tools/claude-build.sh, --permission-mode default + allowlist; audited) until the Codex quota resets Oct 3 3:21 PM (CODEX-DOWN auto-expires) — then rm IMPLEMENTER and restart the queue loop.
- FOCUS mode (codex-queue/FOCUS): only the landing path launches — M2-0031 (History freeze; ST-1 fifo repro still FAILS: loop stalls with 6 FIFOs; plan in state/M2-0031.lead v4), M2-0232 (HIST rows; owner tool also pushes -> WAIT_OWNER), M2-0231 + M2-0233 merged. When integration smoke is green: milestone.sh merges main; then rm FOCUS.
- Gates: per-PR packaged smoke (ready_for_review), failset baseline (state/.smoke-failset) + owned rows (state/<ID>.owns), post-merge smoke STOP on growth, revert guard, hygiene (paths too), READY pins reviewed SHA, WAIT_OWNER for the owner's tool (OD-15), known-flakes.txt, red run off (RED-RUN file re-enables).

## Next steps (in order)
1. Watch M2-0031 against ST-1 (QA candidate job "ST-1 fifo stall row (macOS)"); give Claude a diff-level plan if it stalls again.
2. When M2-0231/0232/0031 are merged and integration smoke is green: confirm milestone.sh merged main (rm state/.milestone-last if needed); then rm codex-queue/FOCUS and consider queue.sh 4.
3. Lead actions after main has the workflows: dispatch evidence runs listed in codex-queue/LEAD-ACTIONS.txt (M2-0005/0013/0016/0018/0019/0023/0194).
4. Oct 3 after 3:21 PM: switch back to Codex (OD-13): rm codex-queue/IMPLEMENTER, restart queue loop.

## Decisions made (don't relitigate)
- D-28 CI only; OD-12 Electron app is the product (OD-16 adds native Mac parity in 2.0); OD-14 Claude implements until Oct 3; OD-15 owner's tool may push to ticket branches (adopt + full gates); OD-16 CF key out of all installers, FR+EN, developer skills in 2.0; OD-17 MASTER 4.3 voice tiers, D-24 facts-only (derived built, off), D-5 self-hosted Hindsight.

## Watch out
- Private main was force-reset to 90ed28f twice (09-27 04:35Z, 09-28 05:05Z); guard.sh heals rewinds. Owner has not said whether that is his tool.
- Sandboxed vs unsandboxed $TMPDIR differ; keep lead scripts under codex-queue/.
- RTK hook rewrites `git show ref:path`; use git cat-file -p in a script.
- Edit running queue scripts only via .new + mv; restart queue.sh (kill it + the service sleep) to pick up queue.sh changes.
