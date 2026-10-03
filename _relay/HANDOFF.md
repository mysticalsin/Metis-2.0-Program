---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 24
agent: claude-code
updated: 2026-10-03 10:45 EDT
status: in-progress (1.9.7 first; 2.0 builds now, lands after 1.9.7 ACCEPT; OD-48 stacked swarm live; signing excluded)
branch: m2/integration moving; main = milestone #460 (2756cefd) green; program main 0cdac01
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Stable 1.9.7 first (OD-45; owner ACCEPT), then Métis 2.0 = the v6 kit plus OD-56 additions, merged to main and owner-accepted by
2026-11-30, freeze M2-0210 on 11-15 (checkpoint 11-08, OD-50). Every release check preserved.

## Current state
- Decisions today: OD-47..OD-56 (stacked swarm; M2-0202 all 7 slices in 1.9.7 = OD-51; Mac awake to ~10-09 = OD-52; Setup only, no
  Portable = OD-53; synthetic-dataless PASS required = OD-54; soak counts prove OD-36 = OD-55; reference behaviour into 2.0 = OD-56).
- Merged since yesterday: M2-0542 (qa-candidate.yml valid again), M2-0418, M2-0534, M2-0540, M2-0195, M2-0537, M2-0202.1, M2-0544.
- Owner-runner strict ST-1 run 37122941816 is INVALID-ENVIRONMENT: Chromium helpers cannot sandbox_apply inside owner-account.sb
  (nested Seatbelt), app crashed at ~16 s. Fix: M2-0538 (ST1_CHROMIUM_SANDBOX=off -> --no-sandbox, outer sandbox kept) + M2-0543
  (never score a dead/unready candidate; READY #467). M2-0520 depends on both; its lead hold stays until a valid strict PASS.
- Valid strict measurement protocol: after M2-0538 + M2-0543 merge, drain the queue (PARALLEL 0, wait for .running to clear), then
  dispatch the two owner-runner rows one at a time; accept only renderer-ready, alive-to-end, quiet-witness runs.
- 1.9.7 paperwork committed (0cdac01): releases/1.9.7.gates.json (pre-registered), evidence/release-1.9.7/growth-rule-registration.md,
  D-34 (release/1.9.x cut at the provenance commit), SCHEMA owner-runner section, releases/1.9.7.md skeleton; M2-0458 is 1.9.7 work.
- Queue scripts installed today: fix31 stacking, fix32 lane fixes, fix33 baseline-only stack resolution, fix34 critical-path over-
  PARALLEL launches (queue.sh restarted 01:20Z), fix35 PR base for stacked tickets, fix36 base-rejected workflows wait, fix37 sliced
  dependencies stack only on their last slice. PARALLEL 17. STACK-BUILD on.
- M2-0249 parked until M2-0060.3 (built on slice 1 only); M2-0256 re-sliced (3 slices); M2-0539 scoped to acceptance 1+4.

## Next steps (in order)
1. Merge M2-0543 (#467) and M2-0538 (rulings 00:10Z/02:05Z/14:20Z), then the valid strict-measurement protocol above; record the lead
   strict PASS and release M2-0520 -> M2-0433 (set EC with run ids) -> M2-0496/0497 -> M2-0458 -> M2-0202 slices 3-7 -> M2-0498 bump.
2. Readiness audit lead items still open (scratchpad readiness-197.md): N12 program-repo CI callers; N8/N10 runs 37090250380 /
   37090252167 results -> evidence records; K2 cut; Q1-Q11 after the cut; P1-P3 publish (owner ACCEPT first).
3. Owner items: whether to clear the 26 "Metis QA" crash reports (macOS stops saving new ones at 25); the 160 old absolute paths in
   this repo (owner's call).

## Decisions made (don't relitigate)
D-28 CI only (OD-46 owner-runner jobs only); OD-12..OD-56; D-34; never re-run qa-candidate.yml by hand (build once); CI re-runs are
the queue's job (rerun_infra), never manual.

## Watch out
- Program repo is PUBLIC: run the leak guard before every push (push scripts abort on absolute local paths and email addresses).
- Attack briefs must include every use site of a changed variable or contract (missed $BASE in ensure_pr once).
- Codex: put the codex-shim directory first on PATH before rf-codex.sh; allowed_domains chatgpt.com.
