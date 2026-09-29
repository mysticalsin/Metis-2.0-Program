---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 12
agent: claude-code
updated: 2026-09-29 16:45 EDT
status: in-progress (full autopilot; signing excluded)
branch: public main = df205007 (now ruleset-protected, OD-29); m2/integration = 5ef4422e; private main (metis-prog-main)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; HeyClicky parity plus the owner's asks (r11 MASTER, v5/v6); well-structured code; merged to main after CI and packaged smoke are green. Signing is excluded.

## Current state
- Ledger: 472 tickets. Run `python3 codex-queue/ledger.py check`; the only notes left are wave order and 13 post-freeze closure rows.
- Worker: launchd com.tony.metis-codex-queue -> service.sh -> queue.sh. PARALLEL=6, and ticket.sh renices itself +10 (the owner's Mac hit load ~45 with swap). Claude implements (Sonnet; Opus when owner_model=opus) and Opus reviews.
- **Merge train (live):** train 1 landed 4 PRs tree-identical at 19:53Z. Train 2 went red on the architecture ratchet (a stale baseline count in M2-0247). A red train now blames only the cars that touch the files the failure names (plus the baseline on ratchet failures). Blamed cars go solo (state/<ID>.solo); the others ride the next train. The ledger record runs at the end of the pass, and a safety net records any MERGED ticket still open in the ledger.
- **Flakes:** known-smoke-flakes.txt (Windows packaged-asr; root-cause ticket M2-0445).
- **Owner decisions 2026-09-29:**
  - OD-26: hosted runners count as the live host.
  - OD-27: raise the private Actions budget. The owner does this in GitHub billing. Pending: then dispatch traceability.yml and the other private runs.
  - OD-28: OBU-03 exception for the M2-0429 Repair.
  - OD-29: main ruleset 24204320 (PR + 5 core checks).
- **Critical path (the 1.9.7 soak M2-0198 gates 279 W3+ tickets):** six P0s -> 1.9.7 (M2-0046) -> the owner's 5-day soak -> W3.
  - Merged: M2-0429 meeting audio.
  - M2-0428 right-edge hide: rework PASS (root cause: main never told the page about a surface change); now resolving conflicts.
  - M2-0430 write-up: lead-reviewed PASS; resolving conflicts.
  - M2-0431 flashing: waits on M2-0428.
  - M2-0433 strict ST-1 and M2-0193 History: implementing. M2-0032 follows M2-0193.

## Done this shift
- EC triage (57 tickets; logs/ec-triage-result-2026-09-29.json). M2-0422 DONE (boot stretch 652/916 ms). M2-0016 DESIGNED docs committed. M2-0442 citations fixed. M2-0009 resource census dispatched (run 36620887469). New tickets M2-0445..M2-0472 (M2-0447+ from the gap drafts; logs/gap-tickets-*.json).

## Next steps (in order)
1. Watch trains and review P0 PRs when READY (M2-0428, M2-0430, M2-0431, M2-0433, M2-0193, M2-0032). Cut 1.9.7 per D-13 when all six are closed.
2. M2-0009: when run 36620887469 is green, check the artifacts contain darwin/win32 cold-start + settled-idle JSON, commit evidence/resource-baseline.md + raw, record MEASURED (hosted-runner kind once M2-0466 lands).
3. After the owner raises the private budget: dispatch traceability.yml (M2-0011, M2-0442) and the kit checks.
4. Remove the known-smoke-flakes entry when M2-0445 merges.

## Decisions made (don't relitigate)
D-28 CI only; OD-12 Electron; OD-14/19 Claude implements+reviews; OD-15 owner tool pushes adopted; OD-21..OD-29 (see DECISIONS.md). PD-12 soak gate stays (narrowing frees only 1 ticket).

## Watch out
- Edit queue scripts via .new + mv. Bash 3.2: no apostrophe inside "${VAR:-..}"; guard empty arrays.
- zsh does not word-split: parse in bash. After any ledger dependency edit, read the FULL ledger.py check (a freeze edge created a cycle once).
- Take codex-queue/ledger.lock for every private-main push. Private main gets reset by the owner's Windows PC clone; guard.sh heals it.
