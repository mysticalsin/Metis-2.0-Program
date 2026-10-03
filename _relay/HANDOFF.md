---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 26
agent: claude-code
updated: 2026-10-03 18:10 EDT
status: in-progress (1.9.7 first; 2.0 builds now, lands after 1.9.7 ACCEPT; OD-48 stacked swarm live; signing excluded)
branch: m2/integration moving; main = milestone #460 green; program main 41c97ee
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Stable 1.9.7 first (OD-45; owner ACCEPT), then Métis 2.0 = the v6 kit plus OD-56 additions, merged to main and owner-accepted by
2026-11-30, freeze M2-0210 on 11-15 (checkpoint 11-08, OD-50). Every release check preserved.

## Current state
- Owner decisions today: OD-47..OD-64. New this shift: OD-58 Mac runner online per cut window (lead asks the day before each);
  OD-59 1.9.9 turns off only the NODE_OPTIONS and inspect fuses, RunAsNode stays on (D-36 OPEN for 2.0, needed by 11-01);
  OD-60 Laya deferred past 2.0 (M2-0312, M2-0570, M2-0571 DEFERRED; M2-0124 = former slice .1); OD-61 staging Cloudflare tokens in a
  protected 'staging' environment the owner fills; OD-62 OS-synthesized input counts for takeover; OD-63 one owner-runner camera
  job (M2-0572, scoped D-28 exception); OD-64 real-dataless History timings from daily 1.9.9 use (M2-0564). Lead: D-35 (M2-0456 is
  a 1.9.7 gate: it produces the right-edge-walkthrough row).
- Evidence chain (ADR-017) is live in the queue: fix38 (PR evidence block, OD-57 red-before for fix tickets), fix41 (red run
  survives the fix push), fix39 (merge side: block freshness, land guard, pre-fix38 runs grandfathered by run start <
  2026-10-03T17:48:54Z) and fix40 (ledger done files records/<ID>.jsonl and closes by L8/L9; holds rc 4). Codex SHIP on each;
  34/34 suites. First live Evidence check on a queue block passed (#482, run 37146142126).
- Ledger: decisions register; every EC/BLOCKED ticket has an unblock step; LEAD_ACTION and outside-evidence tickets carry
  external_blocker + engineering_first; gap review filed M2-0559..M2-0570 and amended 36 tickets so every outside-evidence row
  has a CI producer or an owner decision.
- 1.9.7 lane: M2-0552..0557 (census/freeze-repro harness fixes) building/READY; M2-0202 slice 3 READY #480 (gate-guard ruling:
  release.yml test-after-build allowed); M2-0520 lead hold until a valid strict PASS. PARALLEL 6.

## Next steps (in order)
1. Watch the first records filed by fix40 at merge (RECORD/HOLD lines in queue.log); any HOLD = record the blocker or repair.
2. Pre-fix41 fix tickets whose red run was cancelled: repair with scratchpad red-rerun.sh <ID> (only when no live run on the branch).
3. Merge M2-0543/M2-0538, then the valid strict measurement (PARALLEL 0, drain, dispatch the two owner-runner rows one at a time);
   lead strict PASS -> release M2-0520 -> M2-0433 -> M2-0496/0497 -> M2-0458 -> M2-0202 slices 4-7 -> M2-0456 -> M2-0498 bump.
4. Re-dispatch resource-census / freeze-repro on main after M2-0552..0557 reach main (N8/N10 records).
5. Phase 2 backfill: report count and CI cost to the owner before re-verifying closed fix tickets; state/.evidence-backfill lists
   grandfathered merges. Phase 3 ledger-check workflow dispatch-only.
6. Velocity forecast (gate m3) and FORECAST.md before 10-09. Ask the owner the day before T1 (about 10-17) for the OD-58 window.

## Decisions made (don't relitigate)
D-28 CI only (exceptions: OD-46 ST-1 rows, OD-63 one camera job); OD-12..OD-64; D-34, D-35; never re-run qa-candidate.yml by hand;
CI re-runs only the newest run (or a cancelled red run with no live sibling), marker set.

## Watch out
- Program repo is PUBLIC: grep every push for absolute local paths and email addresses before committing.
- hold_reason(): a ticket with external_blocker is held unless engineering_first is set.
- zsh does not word-split unquoted variables: never `set -- $var` in install loops; verify installed bytes against attacked bytes.
- Attack briefs: every use site, every enum value, and the target workflow's concurrency and needs: graph.
