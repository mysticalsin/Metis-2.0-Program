---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 25
agent: claude-code
updated: 2026-10-03 13:40 EDT
status: in-progress (1.9.7 first; 2.0 builds now, lands after 1.9.7 ACCEPT; OD-48 stacked swarm live; signing excluded)
branch: m2/integration moving; main = milestone #460 green; program main f55b514
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Stable 1.9.7 first (OD-45; owner ACCEPT), then Métis 2.0 = the v6 kit plus OD-56 additions, merged to main and owner-accepted by
2026-11-30, freeze M2-0210 on 11-15 (checkpoint 11-08, OD-50). Every release check preserved.

## Current state
- Decisions: OD-47..OD-57 (OD-57: red-before runs on for `type: fix` tickets; owner mutes failure emails).
- Evidence chain (ADR-017): 0 of 211 tickets verified. Ledger normalised today: top-level `decisions` register (30 ids) at 26a08bf;
  `external_blocker.unblock_step` on all 101 EC/BLOCKED tickets (93 at 26a08bf, 8 lead-reviewed at f55b514).
- Evidence Rock 1 (queue writes the PR evidence block; staged as codex-queue/*.fix38, NOT installed): Codex attack round 2 = REVISE
  (type-less tickets skip the OD-57 repro; test-file pattern differs between red-run trigger and repro capture; marked section
  accepted without a closing fence). Generator revision in progress; then attack round 3.
- 1.9.7 lane: M2-0538 back with review changes; M2-0543 back to implementer after a packaged-smoke flake (M2-0551 race);
  M2-0458 READY #470, M2-0495 READY #377, M2-0550 READY #474, M2-0539 READY #441; M2-0551 building. M2-0520 lead hold stays until a
  valid strict PASS. PARALLEL 6 (hosted macOS runner capacity); restore after the cut.
- Readiness N8/N10 runs both failed: census 37090250380 (macOS prove-local-ttft exit 1; parked-bar-orb trace not established;
  Windows parked-idle CDP Browser.getWindowForTarget missing) and freeze-repro 37090252167 (macOS hosted bundle produced no PASS
  evidence; Windows passed). Diagnosis in progress; fix tickets to follow, linked to M2-0046.

## Next steps (in order)
1. Rock 1: finish the generator revision, Codex attack round 3 (read-only, code inlined), on SHIP install fix38 (regenerate, cmp,
   mv with logs/*.pre-* backups, run every tests/*.sh), confirm `ledger.py evidence-context <ID> state` is complete for open tickets.
2. File the census / freeze-repro fix tickets from the diagnosis; link to M2-0046; re-dispatch N8/N10 after they merge.
3. Merge M2-0543 and M2-0538, then the valid strict measurement (PARALLEL 0, drain, dispatch the two owner-runner rows one at a time);
   lead strict PASS -> release M2-0520 -> M2-0433 -> M2-0496/0497 -> M2-0458 -> M2-0202 slices 3-7 -> M2-0498 bump.
4. Rock 2 (merge.sh block freshness + land requirement; ledger done appends records), Phase 2 backfill (8 EC unblock steps name
   the backfill), Phase 3 ledger-check workflow.
5. Owner items: clear the 26 "Metis QA" crash reports?; the 160 old absolute paths in this repo; M2-0104 gateway readback needs an
   owner-granted read-only token.

## Decisions made (don't relitigate)
D-28 CI only (OD-46 owner-runner jobs only); OD-12..OD-57; D-34; never re-run qa-candidate.yml by hand; CI re-runs only the newest
run, no live sibling, marker set.

## Watch out
- Program repo is PUBLIC: grep every push for absolute local paths and email addresses before committing.
- `notes` is a list on 6 tickets; ledger edit scripts must handle list and string.
- Attack briefs must include every use site of a changed variable or contract.
- Codex: codex-shim directory first on PATH before rf-codex.sh; allowed_domains chatgpt.com.
