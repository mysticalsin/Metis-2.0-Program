---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 3
agent: claude-code
updated: 2026-09-26 12:00 EDT
status: in-progress
branch: docs/metis-2.0-program (worktree ~/AI-Brain-build/metis-v2-program); integration branch m2/integration
head: m2/integration = e323151c (origin/main 2bf21f1c + M2-0001 via PR #201)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Deliver Métis 2.0 (docs/metis-2.0/GOAL.json; deadline 2026-11-30). Plan: docs/metis-2.0/PLAN.md; 213 tickets in docs/metis-2.0/ledger/tickets.json (921/921 kit ids, 78/78 findings mapped). Done when every ticket reaches its evidence level with Opus validation and the owner signs off.

## Current state
- M2-0001 (test isolation) merged into m2/integration via PR #201 (e323151c). Evidence: RED on main wrote into a seeded fake OneDrive; branch leaves it byte-identical; full suite matches main's sandbox-only failures, all of which pass outside the agent sandbox.
- History-freeze root cause OBSERVED: spindump Metis_2026-09-25-135445 shows the main thread in a JS timer doing synchronous reads blocked in apfs_materialize_dataless_file_ext (OneDrive cloud-only files), 85 s. Reopen in Hide layout is a visible no-op. Heavy-on-PC: orphaned llama-server ≈3.1 GB each (CONFIRMED).
- Program docs (PLAN, ARCHITECTURE, DECISIONS, BLOCKERS, TRACEABILITY, ledger, review/, kit/, designs/) exist uncommitted in this worktree, waiting on the public-readiness verdict.
- Ticket worktrees ~/AI-Brain-build/metis-wt-M2-{0003,0006,0035,0043,0045} on branches m2/M2-*, base 4cf7c2dd. Only M2-0003 has work: WIP commit e2adbadf (untested, do not merge); design in docs/metis-2.0/designs/M2-0003-DESIGN.md.

## Done this shift
- Plan workflow wf_0b1fe997-ce5 (validation PASS_WITH_FIXES); W0 hermetic workflow; PR #201; m2/integration branch; ChatGPT audits 1+2 (review/chatgpt-audit-*.md).

## Tests actually run
- Up to 12:00 EDT, sandboxed with fake HOME on the M2-0001 config: full root suite (534 pass / 8 sandbox-only fails), those 8 outside the sandbox (all pass), typecheck exit 0. Real .brain quarantine count stayed 180 (no new files). Since D-28 (below): none.

## Executed side effects — do NOT repeat blindly
- Pushed: codex/operator-ux-rock-1, wip/windows-artifact-signing-snapshot, m2/w0-test-isolation, m2/integration.
- PR #201 opened, commented, retargeted to m2/integration, merged (e323151c).
- ChatGPT uploads (owner-approved permission rule): status brief, B1/B2/B3 reports, runtime evidence, follow-up.

## Blockers
- D-28 (owner, 2026-09-26): tests run ONLY in CI. GitHub Actions is out of budget ("The job was not started because an Actions budget is preventing further use."), so no ticket can be tested until CI runs.
- Owner asked to make the repo public (free Actions). Public-readiness audit wf_aea16745-b30 running → ~/AI-Brain-build/metis-v2-review/public-audit/PUBLIC-READINESS.md. Do NOT change visibility before the owner confirms the verdict.
- Codex quota until 2026-09-29 19:33. OneDrive not hydrating (6 dataless meetings fail ETIMEDOUT).

## Next steps (in order)
1. Read PUBLIC-READINESS.md; present GO/NO-GO and remediation to the owner; act only on explicit confirmation.
2. Once CI runs: re-launch the ticket runner (script metis-ticket-runner) in CI-only mode — agents push branches and iterate on `gh run view`, never run tests locally.
3. Commit + push the program docs branch and open the m2 milestone PR (M2-0024) to main for owner review.

## Decisions made (don't relitigate)
- Merge flow: validated ticket PRs merge into m2/integration; owner reviews milestone PRs into main — Tony, 2026-09-26.
- D-28: CI only — Tony, 2026-09-26.
- Outcome eng-complete + BLOCKED-visible; deadline 2026-11-30; only Apple public signing out of scope; Opus validates and owns design/animation; launch video at the end — Tony.


## PURGE STATUS (2026-09-26 ~21:10 UTC) — read before any git push
- Owner chose: finish the history purge and keep the repo public. Rewritten mirror: ~/AI-Brain-build/purge/remote-mirror.git (git filter-repo removed docs/cluely-mantu-build-brief.md, docs/planning/PLAN-v5-providers-cluely-ui.md, docs/superpowers/specs/2026-06-29-cluely-replica-design.md; commit map in filter-repo/commit-map; old main 2bf21f1c -> new 22d1fbad). Backup of the pre-purge remote: ~/AI-Brain-build/purge/backup-before-purge-2026-09-26.bundle (sha256 fc21fca54a929881fe2637b856f08c1a3111ce594a062dd838fc7e0d3543b33b).
- Done: 59 branches force-pushed with rewritten history. Pending: 49 branches (main, release/*, fix/*, cursor/*) blocked by 5 rulesets, and 27 tags (release.yml would fire). Waiting for the owner to disable the rulesets + release.yml, then push `refs/heads/*` and `refs/tags/*` from the mirror, verify every ref, owner re-enables.
- NEVER push from an old clone or old worktree ref: it would re-publish the purged files. Every local clone/worktree must be re-synced to the rewritten history (commit-map translation) before pushing; other machines/agents must re-clone.
- After the push: owner submits ~/AI-Brain-build/purge/notes/GITHUB-SUPPORT-REQUEST.md (refs/pull + cached views).
- Security (owner action): revoke the Cahê Kimi key embedded in release v1.2.0's Metis-Windows-Cahe-Setup-1.2.0.exe (public download) and delete that asset.
- Program docs live ONLY in this private repo (mysticalsin/Metis-2.0-Program, local clone ~/AI-Brain-build/metis-2.0-program); ignore the stale git-excluded copy under ~/AI-Brain-build/metis-v2-program/docs/metis-2.0. The public repo carries AGENTS.md, CLAUDE.md, .cursor rule and PR template (PR #205 into m2/integration); `_relay/` is git-ignored there.
- Local re-sync done: 11 mapped local branches/worktrees moved to rewritten commits (tree-identical, soft reset). Two local-only branches stay on pre-rewrite history and must NEVER be pushed: m2/w0-hermetic-tests (superseded) and m2/M2-0003-wip-scratch (reference only).
- Ticket runner wf_32ea0bc9-6bc (CI-only): M2-0003, M2-0006, M2-0035, M2-0043, M2-0045, M2-0041; PRs #202-#204 carried over. Next batch after M2-0006 merges: M2-0030 (storage gateway, freeze critical path), M2-0026, M2-0033, M2-0004, M2-0037, M2-0038.
- Owner actions open: disable 5 rulesets + release.yml so the remaining 49 branches and 27 tags can be pushed; revoke the Cahê Kimi key and delete the v1.2.0 Cahê asset; send GITHUB-SUPPORT-REQUEST.md after the push; Mantu sign-off on licence/ownership (auditor B2).

## Watch out
- The agent Bash sandbox allows writes under /Users/tony, so it does NOT protect OneDrive data.
- Never use git stash in worktrees (shared stack). Never push tags.
- 62 quarantines on 09-23 attributed to test runs is DERIVED, not proven (M2-0003 / CRITIC-INV-2); today's 2 coincide with agent test runs.
