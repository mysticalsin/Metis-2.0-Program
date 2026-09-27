---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 6
agent: claude-code
updated: 2026-09-27 03:40 EDT
status: in-progress
branch: private main (~/AI-Brain-build/metis-prog-main); public m2/integration = 202c0d90 (CI run 36305283772 green)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Deliver Métis 2.0 by 2026-11-30: every ledger ticket (227) at its evidence level with Opus validation; external items BLOCKED-visible; launch film; owner signs off milestone PRs into main.

## Current state
- Ledger: {'DONE': 36, 'IN_PROGRESS': 21, 'TODO': 168, 'ENGINEERING_COMPLETE': 1, 'CANCELLED': 1}
- P0 "heavy on PC": FIXED in integration (M2-0026 stopAll, #236). P0 History freeze: gateway core merged (M2-0030 #227); wiring into History/Recall = M2-0031 (batch 9, carries Codex audit-r4's six requirements).
- Operating model OD-13: Codex implements (tools/codex-build.sh), Claude plans/challenges, Opus validates; OD-12 desktop app only.
- Rocket-fuel engagement 1: Rocks 1+2 DONE (97/96), branch rf/rock-1-preserve-unreadable-index e9c7ceed; G6 PENDING — owner said "Fix M2-0225 first" (decrypt path must not create secret-key.bin; batch 9).
- Running workflows: batch 9 wf_74d92306-897 (M2-0225, 0031, 0011 carry, 0013 carry), batch 10 wf_78a905a0-511 (0227, 0226, 0053, 0005, 0021, 0102, 0092), batch 11 wf_c84cc805-0d5 (carries 0037, 0214, 0057, 0101, 0188, 0020), batch 8 wf_62e09923-d63 (0033, 0215, 0047, 0014).

## Next steps (in order)
1. On each batch completion: merge READY PRs one at a time with hygiene check, then run ci-proof on m2/integration; mark DONE; run tools/repo-guard.sh.
2. When M2-0225 merges: merge m2/integration into rf/rock-1 (ordinary merge), re-run both rock proofs (ROCKS.md), present G6 again to the owner.
3. After M2-0031 merges: Codex audit of the freeze fix path; then plan the 1.9.7 cut (D-13 publishing rules).
4. Held tickets: M2-0216 (after rocks), M2-0201 (after M2-0007 capture lane — merged; needs Electron capture design), M2-0025 (outward GitHub triage; needs owner OK).

## Decisions made (don't relitigate)
- D-28 CI only; OD-12; OD-13; D-4/6/9/11/12/13 answered; M2-0011: accept history, squash-merge (no force-push); private-repo rulesets unavailable (GitHub Pro) → repo-guard.sh.

## Watch out
- Merging several PRs back-to-back can break integration even when each passed (M2-0223 x M2-0007 → fixed #245). Always ci-proof integration after merges.
- ci-proof test-name patterns don't work for fast tests (vitest prints only slow ones); use test-proof.sh or run success.
- 2026-09-27T04:35Z external mirror push reset private main; restored (af39d16). Never trust a stale clone.
- Agents never add ledger tickets (lead files them); SendMessage to a workflow agent spawns a copy.
