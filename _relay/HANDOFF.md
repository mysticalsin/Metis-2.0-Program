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


## PURGE STATUS — COMPLETE (2026-09-26 23:50 UTC)
- All 108 branches and 27 tags carry the rewritten history (verified: 0 mismatched refs vs ~/AI-Brain-build/purge/remote-mirror.git; main = 22d1fbad). Rulesets and release.yml were disabled only for the push and are active again; no release run fired.
- GitHub Support ticket submitted from the owner's account (PR-ref dereference, cache removal, server-side GC). Watch the owner's email for GitHub's reply.
- Owner revoked the Cahê Kimi key. CAHE_KIMI_JSON never existed as a GitHub secret. Cahê release assets deleted; edition removal is ticket M2-0214.
- Mantu licence/ownership sign-off: Gmail draft created in the owner's mailbox (no recipient; owner chooses and sends). Copy: docs/metis-2.0/owner-requests/MANTU-LICENCE-SIGNOFF-DRAFT.md.
- NEVER push from a clone/ref predating the rewrite. Local-only pre-rewrite branches m2/w0-hermetic-tests and m2/M2-0003-wip-scratch must never be pushed. Any other machine or agent clone must be re-cloned.

## Watch out
- The agent Bash sandbox allows writes under /Users/tony, so it does NOT protect OneDrive data.
- Never use git stash in worktrees (shared stack). Never push tags.
- 62 quarantines on 09-23 attributed to test runs is DERIVED, not proven (M2-0003 / CRITIC-INV-2); today's 2 coincide with agent test runs.
