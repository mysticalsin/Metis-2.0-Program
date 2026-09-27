---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 4
agent: claude-code
updated: 2026-09-26 22:30 EDT
status: in-progress
branch: private main (worktree ~/AI-Brain-build/metis-prog-main); public integration branch m2/integration
head: m2/integration = 3afebbdf (CI Build & Test run 36285790609 success)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Deliver Métis 2.0 (GOAL.json; deadline 2026-11-30): every ledger ticket (docs/metis-2.0/ledger/tickets.json, 216 tickets) at its evidence level with Opus validation; external items BLOCKED-visible; launch film at the end; owner signs off milestone PRs into main.

## Current state
- Ledger: 16 DONE (M2-0001/0002/0003/0010/0024/0035/0041/0043/0045/0187/0191/0204 + earlier), ~18 IN_PROGRESS, ~180 TODO.
- m2/integration 3afebbdf = main 22d1fbad + PRs #201 #205 #207 #204 #202 #203 #210 #212 #213 #214 #206. CI green.
- Batch 3 (workflow wf_e6165560-85e) still running: M2-0006 #208, M2-0017 #215, M2-0144 #216, M2-0120 #217, M2-0147 #218 (public); M2-0022 #3, M2-0057 #6, M2-0188 #5, M2-0101 (private docs).
- Batch 4 (wf_3a1f49e4-97d) running: M2-0030 (P0 storage gateway, Opus design first), M2-0004, M2-0056, M2-0055, M2-0203, carry-overs M2-0011 #211, M2-0190 #209, M2-0013 private #2.
- Rocket-fuel engagement 1 (Codex = Integrator) in ~/AI-Brain-build/metis-rf/.rocket-fuel (git-ignored): brain-index safety Rocks 1-2 (preserve undecryptable index before explicit rebuild; refuse future-schema). Same Page Meeting hit MAX_ROUNDS=5 (all REVISE, converging 6→2 blockers); round-5 findings applied; waiting on owner deadlock call. Codex audit-r2 of #213/#214/#206 running (audit-r2.last.txt).

## Done this shift
- Merged #210 #212 #213 (validated), #214 #206 (lead), private #4. Ledger/baton re-landed on private main (b8f20bc, 094bb4b) — they had been committed on a docs branch of the shared clone.
- Runner script: carry mode (t.carry_file/t.carry_round), docs tickets in their own private-repo worktree + PR into main, docs-aware integrate.

## Tests actually run
- None locally (D-28). CI: integration tip run 36285790609 success; per-ticket red/green runs are in each PR body.

## Executed side effects — do NOT repeat blindly
- Merges listed above. Pushed private main 094bb4b (+ batch 4 claims commit if pushed). Branches+worktrees created: m2/M2-{0030,0004,0056,0055,0203}-* at 3afebbdf.

## Blockers
- Rocket-fuel build gate needs owner deadlock call (acknowledge unreviewed revision or allow one Integrator confirmation read).
- Shared private clone ~/AI-Brain-build/metis-2.0-program is checked out on m2-0020-hindsight-pin-round2 with batch-3 WIP uncommitted; its local branch carries 5 misplaced lead commits (71adb41..8cae2a6). After batch 3 ends: move WIP to owning branches, `git switch main`, reset local m2-0020 branch to origin's (a1a820f). Never push that local branch as is.
- M2-0020 (Hindsight pin, private PR #1) needs a carry run after the shared clone is fixed (carry file in session scratchpad; regenerate from wf_635af830-809 journal validate:M2-0020:4).
- Owner items: Mantu licence sign-off (Gmail draft, owner sends); GitHub Support reply pending; QA_MAC_SIGNING secret (B-05) for signed QA candidate.

## Next steps (in order)
1. On each batch completion: read journal, merge READY_TO_MERGE PRs whose head CI is green (lead merges), mark DONE in ledger with PR/merge sha, relaunch CHANGES_REQUIRED leftovers in carry mode.
2. Fix the shared private clone (Blockers #2), then carry-run M2-0020.
3. Next ready tickets: M2-0014, M2-0047, M2-0021, M2-0092, M2-0212 (film toolchain spike, Opus); M2-0031 after M2-0030; M2-0214 Cahê removal after M2-0006.
4. Rocket-fuel: after owner call, Rocks 1-2 built by Codex (workspace-write), Level 10 via .rocket-fuel/bin/ci-proof.sh + branch-grep.sh, G6 owner approval before merge.

## Decisions made (don't relitigate)
- D-28 CI only (no tests/app on any Mac); merges: tickets → m2/integration after Opus PASS + green CI, milestones → main by owner review; repo public; history purge done; Cahê edition removed (D-30); Codex audits via rocket-fuel; only Apple public signing out of scope.

## Watch out
- Never push tags or pre-rewrite refs (m2/w0-hermetic-tests, m2/M2-0003-wip-scratch). Never git stash. Program docs never in the public repo.
- Docs agents must never switch branches in the shared private clone (runner now enforces own worktree).
- rtk hook mangles git diff/log output: use python subprocess or --format.
