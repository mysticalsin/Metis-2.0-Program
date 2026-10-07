---
project: Metis 2.0 program
shift: 32
agent: codex
updated: 2026-10-07T23:55:35Z
status: isolation_takeover_started; test_only_commit_local; scoped_cloud_publication_approval_pending
---

# Current state

The owner explicitly approved Codex taking over Claude's unfinished work toward2.0, resolving the pending M2-0538 QA-isolation takeover question. The updated goal additionally reaffirms end-to-end tested EXE/DMG delivery and the full ZIP scope. Neither statement silently clears confidentiality, candidate acceptance, unrelated source reservations or release gates.

Source checkout: /Users/tony/dev/metis-v2-integration-20261007. Local branch m2/M2-0538-codex-owner-isolation, HEAD3cfad0c2d06c96ba7b19b05d7d941ac3bf486b27. Only scripts/ci/qa-owner-isolation.contract.test.ts was added,111lines. All existing production and tests remain unchanged from28dc2a02495212ae09e03f59b713ab57ad45755e. Clean working tree at commit readback. This new branch has not been pushed and has no CI run or PR.

Fresh remote readback: main723a454a170b93b8c5f2b543b2cc2aa6409645ef, version1.9.7. Existing PR464 remains OPEN/DRAFT/CONFLICTING against m2/integration atc3261d36e0042480b8ea0f92a4394338b6138df5; its branch is preserved unchanged.

Previous baton is archived byte-exact at _relay/archive/2026-10-07-2354-codex.md, SHA256d4dd22585084bafc472ced5a7a06f8adb967752391ae50bc27bc7bba469238ab. It preserves historical source reviews, reservations and gates. Never push this private program repo: its remote was observed public.

# Done this shift

## Verified downloader correction carried forward

Public branch m2/M2-0538-codex-artifact-delivery ends at28dc2a0. Two-file scope:15-line test plus22 action pin/comment replacements. Test-onlyaeac664565a699e2b9bff01e27ee3701b57930c2 produced genuine expected assertion failures on both platforms in Build37671394300; the later cancelled run is not a whole-run PASS.

Correction Build37672698431 attempt2 SUCCESS: Linux root9,349pass/28declared skips; Windows9,342pass/34declared skips. Downloader contract and all40 existing QA-workflow tests passed. Security, lint and license jobs passed. Attempt1 Operator install timed out; primary read the actual logs and requested one affected-job retry. Retried Operator112978226527 passed1,201Operator and176scripts-contract tests plus staging-only dry assertions. Migration, deployment and smoke did not execute. Native and installers were skipped, not qualified. Isolation-canary37672698863 and ProgramVelocity37672698525 passed. No PR, merge, owner-Mac execution or release.

## Bounded isolation takeover

Approved private plan: /Users/tony/.claude/plans/metis-owner-qa-isolation-20261007.md.
Private receipts: source .rocket-fuel/owner-isolation/{CONTRACT.md,plan-review.md,ROCKS.md}.
Method: Rocket Fuel adapted to owner-approved Codex fallback after Claude low credit. Do not claim Claude review or a new CLI receipt.

Six targets: R1 fixed-QA-keychain fail-closed observation; R2 strict profile on every current retry/launch; R3 bounded physical roots without private-queue exceptions; R4 real hosted synthetic Seatbelt proof; R5 QA-identity/provenance-bound restricted flags; R6 truthful immutable launch reporting.

Independent plan reviewer isolation_st1_review returned APPROVED after corrections to keychain status handling and candidate-replaceable postcheck helpers. candidate_stability_review separately verified the direct-search C design and disposable hosted fixtures. No keychain query, compiler, repository runtime or app ran locally.

Sole source author owner_isolation_builder added13 workflow regression cases and stopped. Source SHA256af11abf92b3c748da5c012fad16cfeaba3e8d9e806ba9cf789b2524b3fba60be; Git blob5c11a03e6b4429a39d4df61db5bfef62e6dbde9a. Independent reviewer verified exact bytes, scoped job/step binding, Vitest inclusion, production unchanged and no private content. APPROVED only for hosted-red readiness. Static expectation1pass/12fail is NOT an observed result. Whitespace passed; formatter/runtime unverified. Local commit3cfad0c2 contains only this test with public no-reply metadata and hooks disabled.

# Blockers

1. New branch publication awaits the written QA-isolation CI exception requested this turn. The earlier exception covered downloader pin/test only. Four confidentiality lists remain datedJune6. Takeover approval resolves source authority, not this distinct public-output gate. No answer to the new exception question has been received.
2. Actual red, R1-R6 implementation, independent final-source review and hosted green remain undone. Do not apply production fixes before the preserved regression is observed failing in CI.
3. No owner-candidate admission. Same-repository PRs, including drafts, automatically schedule unsafe current owner-Mac jobs. No PR until exact-source and hosted isolation review passes and candidate-admission rules are satisfied.
4. Full2.0 remains unfinished: source integration, all requested features, portal, native/Mac/Windows installers, real-device qualification and releases are separate gates.

# Next steps

1. Read the owner's pending exception reply. Do not repeat the resolved takeover/GitHub-access questions. If approved, log the exact scope, guard the final test diff/metadata, then push only3cfad0c2 on m2/M2-0538-codex-owner-isolation via the existing authenticated CLI, no PR/tag. Observe actual hosted failures and keep the exact regression unchanged.
2. Resume owner_isolation_builder only after real red. One writer, independent reviewers. Preserve downloader fix, retries,45-minute budgets, hard retry verification, report-only policies, Windows variants, History and OD66 reporting.
3. Implement the approved plan. Keychain helper uses checked noUI, captured nonempty healthy search list, direct per-keychain SearchCreate/SearchCopyNext statuses, fixed service, no overrides/data/attributes, immediately released internal reference. Protect compiled helper/control directory and rename ancestors; outside postcheck checks immutable recorded absolute path and digest without reloading a script from writable checkout. Hosted fixtures must not mutate global keychain defaults/search lists.
4. Implement strict OS-home binding, separate hosted-fixture route, synthetic-only strict probes, owned cleanup, verified-QA-only compatibility flags and truthful lifecycle evidence. Do not change production encryption or default launch arguments.
5. Independent exact-source review, scoped guard, cloud green with actual Seatbelt and genuine disposable-keychain proofs. Root reads logs. Then candidate admission and the remaining full2.0 program gates.

# Decisions made, do not relitigate

- D28: no repository tests/scripts/apps/imports/builds on this local Mac. Narrow no-emit TypeScript exception remains. Runtime proof belongs in CI.
- Existing authenticated GitHub CLI is owner-approved and works. Old integration403 is not a current CLI blocker. Do not retry denied browser access or change credentials/scopes/global auth.
- Owner approved Codex fallback and bounded isolation takeover, not fabricated Claude/Opus review.
- Preserve current main and PR464 while repairing separately. No version bump, direct-main push, tag, release or deployment in this patch.
- No workspace/temp exception within protected home/queue trees. Actual OS-home identity is required on owner route; synthetic route cannot admit restricted owner launches.
- Environment markers are configuration, not OS proof. Canary evidence is narrow filesystem denial; keychain checks are status-only observations, not universal isolation.

# Watch out

Archived baton retains occupied PR539/540/541/470 controllers, held S5/S6/adapter/S7 lanes, M2-0065.1 and other reservations, program STOP bytes, exact29-row release gates, owner acceptance, version-last policy and1.9.7→1.9.9→2.0 train. Those snapshots are historical, not newly verified or silently transferred.

Private relay metadata stays local. Commit only handoff+archive under the common gitadmin lock with hooks disabled; release only exact owned bytes. Never publish private program or .rocket-fuel material.
