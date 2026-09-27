---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 5
agent: claude-code
updated: 2026-09-27 01:30 EDT
status: in-progress (usage limit reached mid-shift)
branch: private main (worktree ~/AI-Brain-build/metis-prog-main); public m2/integration = 5993c7e3
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Deliver Métis 2.0 by 2026-11-30: every ledger ticket (224, docs/metis-2.0/ledger/tickets.json) at its evidence level with Opus validation; external items BLOCKED-visible; launch film; owner signs off milestone PRs into main.

## Current state
- Operating model OD-13 (owner, 2026-09-27): Codex implements, Claude plans/challenges/validates; Opus owns design/animation. Runner script implements it (codexDriver + /Users/tony/AI-Brain-build/tools/codex-build.sh). OD-12: Métis is the Electron desktop app; no HTML prototype sites; no visible browsers on the owner's Mac.
- Owner answered D-4, D-6, D-9 (CI runners), D-11, D-12, D-13 (DECISIONS.md).
- DONE this shift (merged, squash): M2-0006, 0017, 0056, 0120 (ENG-COMPLETE, D-6 now answered → update ADR-019 then DONE), 0147, 0203, 0212 (+ private #8), 0010, 0041, 0187, 0204.
- Rocket-fuel engagement 1 (~/AI-Brain-build/metis-rf/.rocket-fuel): plan APPROVED meet-r8. Rock 2 DONE 96/100 (rf/rock-2-future-schema f81f2618, run 36291770360). Rock 1 DONE 90/100 (rf/rock-1-preserve-unreadable-index 7b017a94, run 36293541999; behavioural red 36292707895). Engagement refine round 1 launched (label engagement-refine-1) — result unread.
- Workflows possibly still running/stopped: wf_3a1f49e4-97d (batch 4), wf_6f56322b-801 (5), wf_858cce22-1e4 (6), wf_33710872-a3a (7), wf_62e09923-d63 (8, first Codex-implements batch). Resume each with Workflow({scriptPath: <runner>, resumeFromRunId}).

## Next steps (in order)
1. Read each batch journal (…/subagents/workflows/<wf>/journal.jsonl); merge READY_TO_MERGE PRs (squash, clean message, check private refs); mark DONE in ledger; carry CHANGES_REQUIRED tickets (carry files: scratchpad/carry/<id>.json).
2. Rocket-fuel: read codex/engagement-refine-1.last.txt; review diff; commit/push; re-run BOTH rock proofs (ROCKS.md); record G5.5; then G6 presentation to owner (scorecard, proofs, diff stat, meeting trend, residual deductions) → only after owner approval open PR rf/rock-1 → m2/integration.
3. Ready tickets next (Codex-implements): M2-0025, 0053, 0021, 0092, 0102, 0216 (after Rock 1 merges), 0031 (after 0030).
4. Private docs PRs #1,2,3,5,6,7,9 awaiting validation/merge.

## Decisions made (don't relitigate)
- D-28 CI only; merges to m2/integration after Opus PASS + green CI (lead squash-merges); milestones → main by owner; OD-12; OD-13; D-4/6/9/11/12/13 answered.

## Watch out
- Never push tags or pre-rewrite refs. Never git stash. Program docs never in the public repo.
- SendMessage to a workflow agent id resumes a SEPARATE copy (caused a double writer on M2-0101).
- rf-codex build briefs need a line starting "Proof:"; Codex cannot run tests — CI is its feedback.
- Leftover harmless dir ~/AI-Brain-build/tools/codex-smoke (delete was denied).
