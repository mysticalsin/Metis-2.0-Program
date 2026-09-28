# M2-0005 baseline evidence for 2bf21f1c plus M2-0001

Retrieval date: 2026-09-28. This record is intentionally not a LOCALLY_TESTED pass record yet: the runner was instructed not to run repository tests, scripts, or the app, and only the lead may file CI-artifact evidence records or dispatch workflows.

## Scope verdict

- OBSERVED: M2-0005 requires the single scope path `docs/metis-2.0/evidence/baseline-2bf21f1c.md` and depends on M2-0001 and M2-0190. Source: `docs/metis-2.0/ledger/tickets/M2-0005.md:15-27`.
- OBSERVED: M2-0005 acceptance requires exit codes/counts for `npm run typecheck`, root/proxy/operator `npm test`, `npm run check:skips`, `npm run check:bugs`, `license-server` `node --test`, and `swift test`; skip reconciliation; failing-test ownership; a worktree of `2bf21f1c`; and the M2-0001/M2-0190 isolation path. Source: `docs/metis-2.0/ledger/tickets/M2-0005.md:33-45`.
- OBSERVED: The program baseline is AskToto-Mantu `origin/main` at `2bf21f1c` (v1.9.6). Source: `docs/metis-2.0/PLAN.md:3-11`.
- OBSERVED: The program rule says no agent runs repository tests until M2-0001 canary passes, then only in CI, the isolated QA macOS user, or the owner account under the OS sandbox profile. Source: `docs/metis-2.0/PLAN.md:33-36`.
- OBSERVED: Test isolation must cover children, Swift, `license-server`, and wrangler because the in-process tripwire misses those. Source: `docs/metis-2.0/DECISIONS.md:40-40`.
- OBSERVED: LOCALLY_TESTED evidence needs a CI run ID on the PR head. Source: `docs/metis-2.0/DECISIONS.md:43-43`.
- OBSERVED: Historical baton state records `m2/integration = e323151c (origin/main 2bf21f1c + M2-0001 via PR #201)`. Source: `_relay/archive/2026-09-27-195219-claude-code.md:7-9`.
- OBSERVED: The same baton says M2-0001 was merged via PR #201 and that full-suite evidence at that time was local/sandbox-limited, not the final M2-0005 baseline. Source: `_relay/archive/2026-09-27-195219-claude-code.md:16-30`.
- OBSERVED: D-28 then restricted tests to CI only, and Actions budget prevented starting jobs at that moment. Source: `_relay/archive/2026-09-27-195219-claude-code.md:33-35`.
- OBSERVED: The current worktree HEAD is `551ac6afc3521eef15f4a25f2f1e633b4b8aca96`, not `2bf21f1c` or `e323151c`. Source: command output, `git rev-parse HEAD`, retrieved 2026-09-28.
- OBSERVED: This worktree had no `origin/main...HEAD` diff before this file was added. Source: command output, `git diff --name-status origin/main...HEAD | wc -l` returned `0`, retrieved 2026-09-28.
- OBSERVED: The scoped evidence file was absent before this edit. Source: command output, `find . -maxdepth 5 ... -name baseline-2bf21f1c.md` returned no match, retrieved 2026-09-28.

## Command inventory to be captured from CI/QA artifacts

| Gate | Required command | Code source for command | Target run result |
|---|---|---|---|
| Typecheck | `npm run typecheck` | OBSERVED: `package.json` on `origin/m2/integration` chains `tsconfig.node.json`, `tsconfig.web.json`, `check-test-types.mjs`, `operator/tsconfig.json`, and `operator/client/tsconfig.json`. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:package.json`, lines 31-33 in output, retrieved 2026-09-28. | BLOCKED_EXTERNAL: CI/QA artifact with exit code, stdout/stderr tail, and counts is not available to this runner. |
| Root/proxy/operator tests | `npm test` | OBSERVED: `npm test` chains `vitest run`, `npm run test:proxy`, and `npm run test:operator`; proxy and operator each use their own Vitest configs. Source: same command output, lines 33-38, retrieved 2026-09-28. | BLOCKED_EXTERNAL. |
| Skip gate | `npm run check:skips` | OBSERVED: script key points to `node scripts/check-skipped-tests.mjs`. Source: same command output, line 85, retrieved 2026-09-28. | BLOCKED_EXTERNAL. |
| Bug ledger gate | `npm run check:bugs` | OBSERVED: script key points to `node scripts/check-bug-ledger.mjs`. Source: same command output, line 79, retrieved 2026-09-28. | BLOCKED_EXTERNAL. |
| License server | `cd license-server && node --test` under M2-0190 isolation | OBSERVED: `license-server/package.json` wraps `node --test` with `../scripts/hermetic/run-with-sandbox.mjs`. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:license-server/package.json`, lines 11-14 in output, retrieved 2026-09-28. | BLOCKED_EXTERNAL. |
| Swift package | `cd native-app/MetisKit && swift test` under M2-0190 isolation | OBSERVED: MetisKit defines library and test targets. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:native-app/MetisKit/Package.swift`, lines 10-19 in output, retrieved 2026-09-28. | BLOCKED_EXTERNAL. |

## Prior evidence that must not be treated as this baseline

- OBSERVED: K09 found a later `metis-r11-work` hermetic run with `00-typecheck` PASS exit 0, `00b-check-bugs` PASS, root Vitest PASS with 545 files / 6734 total / 6703 passed / 0 failed / 31 pending, proxy 28/28 PASS, and operator 1031/1031 PASS. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:141-154`.
- OBSERVED: K09 also states that run did not run `swift test` for MetisKit or native-app builds. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:41-41`.
- OBSERVED: SRC-REVERIFY says CI run `36269153417` was green on an exact commit, but excluded `license-server` and native Swift; therefore baseline checks on the complete tree were not fully met. Source: `docs/metis-2.0/review/SRC-REVERIFY.md:211-214`.
- DERIVED: The K09 and SRC-REVERIFY receipts are useful comparison inputs, but they do not satisfy M2-0005 because the ticket asks for the `2bf21f1c` plus M2-0001 worktree under the hermetic harness, including `license-server` and Swift.

## Skip-count reconciliation

- OBSERVED: The ticket records the unresolved discrepancy as `25 vs 31 vs 1`. Source: `docs/metis-2.0/ledger/tickets/M2-0005.md:29-39`.
- OBSERVED: `31` is a measured pending count from the later `metis-r11-work` root Vitest receipt: 6734 total / 6703 passed / 0 failed / 31 pending. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:147-154`.
- OBSERVED: `25` appears in two prior contexts: K09 says a Phase-1 critic reported 25 unexplained desktop-test skips, and K09's earlier red-state receipt recorded 6701 passed / 1 failed / 25 skipped. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:41-41` and `docs/metis-2.0/review/lanes/K09-prior-execution.md:154-154`.
- OBSERVED: `1` was not a full-suite measured skip count; L11 describes it as the skip gate's hard-coded darwin baseline during that audit, then says the project's clean-machine receipt showed 25 skips. Source: `docs/metis-2.0/review/lanes/L11-build-ci-quality.md:13-20` and `docs/metis-2.0/review/lanes/L11-build-ci-quality.md:136-144`.
- OBSERVED: The current `origin/m2/integration` skip checker no longer uses `1`; its declared platform baselines are `win32: 16`, `darwin: 2`, and `linux: 19`. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:scripts/check-skipped-tests.mjs`, lines 86-89 in output, retrieved 2026-09-28.
- OBSERVED: The current skip checker counts only statuses `pending` or `skipped` from a Vitest JSON report, and fails if the count is above or below the platform baseline. Source: same command output, lines 117-156, retrieved 2026-09-28.
- OBSERVED: A separate operator-suite Windows-only skip exists at `operator/scripts/wrangler-local-sandbox.contract.test.ts`: one `it.skipIf(process.platform === 'win32')`. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:operator/scripts/wrangler-local-sandbox.contract.test.ts`, lines 40-46 in output, retrieved 2026-09-28.
- DERIVED: The discrepancy is not three measurements of the same thing. `31` is a patched `metis-r11-work` root-suite pending count, `25` is an older/Phase-1 desktop skip count and red-state receipt, and `1` is a stale darwin skip-gate baseline from the L11 audit rather than the whole-suite observed count. The operator Windows-only single skip is another way a standalone `1 skipped` can appear outside the root-suite inventory, so any baseline report must record suite and OS per count.
- UNKNOWN: The exact per-test skip inventory for the required `2bf21f1c + M2-0001 + M2-0190` run is not available without the CI/QA JSON reports.

## Failing tests and ownership

- OBSERVED: The only specific failed test file named in the prior K09 receipt is `onboarding-hero-video.test.ts` in an earlier red state; K09 says the later patched run was green. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:154-158`.
- UNKNOWN: Failing test IDs for the required M2-0005 baseline are unavailable until the lead retrieves or produces the target CI/QA artifacts.
- LEAD_ACTION: Retrieve the CI/QA artifact bundle for the run of `2bf21f1c + M2-0001` under M2-0190 isolation and record each failing test ID with its owning ticket or file a new ticket before accepting M2-0005.

## Reviewer feedback disposition

- OBSERVED: `src/main/emergency-force-quit.test.ts` is not present on `origin/m2/integration`; `git show origin/m2/integration:src/main/emergency-force-quit.test.ts` failed with `path ... exists on disk, but not in 'origin/m2/integration'`. Source: command output, retrieved 2026-09-28.
- OBSERVED: `src/main/llm/local-runtime.test.ts` on `origin/m2/integration` contains the real-sidecar integration block and skips it only when required local binary/model files are missing. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:src/main/llm/local-runtime.test.ts`, lines 241-260 in output, retrieved 2026-09-28.
- OBSERVED: `src/main/mcp/mcpClient.audit.test.ts` on `origin/m2/integration` contains request timeout/audit assertions, but no redirect SSRF assertions in the inspected first 131 lines. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:src/main/mcp/mcpClient.audit.test.ts`, lines 1-131 in output, retrieved 2026-09-28.
- DERIVED: Restoring or justifying removed/weakened product tests is outside M2-0005's scope path and requires the correct product-code branch/base, not this private evidence-doc worktree.
- LEAD_ACTION: Assign the reviewer-reported test removals/weakenings to the owning product branch or file a new restoration ticket; do not resolve them inside M2-0005 unless the lead changes scope.

## Required lead actions before this can become accepted LOCALLY_TESTED evidence

LEAD_ACTION: Add `docs/metis-2.0/evidence/baseline-2bf21f1c.md` to git despite any local ignore or generated-doc exclusion, then confirm it appears in `git diff origin/main...HEAD`.

LEAD_ACTION: Produce or retrieve the hermetic CI/QA run for `2bf21f1c + M2-0001` only, not raw `2bf21f1c`, with M2-0190 isolation enabled for `license-server`, Swift, and wrangler-touching tests.

LEAD_ACTION: Attach or cite the CI/QA artifact identifiers, run IDs, commit SHAs, OS, runner image, retrieval date, exit code, total/pass/fail/skip counts, and failing-test IDs for every required gate listed in this file.

LEAD_ACTION: File evidence records from those CI artifacts under the program evidence system; this runner did not do so because only the lead may file CI-artifact evidence records.

LEAD_ACTION: If any target-baseline failures exist, assign each failing test to an owning ticket or file a new ticket, then update this file with those IDs and artifact anchors.

## Acceptance status

- BLOCKED_EXTERNAL: Exit codes and counts for the required target run are unavailable to this runner.
- BLOCKED_EXTERNAL: Exact skip inventory by suite and OS is unavailable to this runner.
- BLOCKED_EXTERNAL: Failing-test list for the required target run is unavailable to this runner.
- OBSERVED: This runner did not run repository tests, scripts, or the app, by instruction and by D-28 constraints.
- DERIVED: M2-0005 is not ready to mark SHIP until the lead actions above are completed and the artifact data replaces the BLOCKED_EXTERNAL rows.
