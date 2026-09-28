# M2-0005 baseline evidence for 2bf21f1c plus M2-0001

Retrieval date: 2026-09-28.

This record is not a LOCALLY_TESTED pass record. OBSERVED: the ticket-run instruction forbids this runner from running repository tests, repository scripts, or the app, and says only the lead can file evidence records from CI artifacts, dispatch workflows, or run Codex audits. Source: owner instruction in this ticket-run request, retrieved 2026-09-28.

## Scope and provenance

- OBSERVED: M2-0005 has the single scope path `docs/metis-2.0/evidence/baseline-2bf21f1c.md` and depends on M2-0001 and M2-0190. Source: `docs/metis-2.0/ledger/tickets/M2-0005.md:15-27`.
- OBSERVED: M2-0005 requires exit codes and counts for `npm run typecheck`, root/proxy/operator `npm test`, `npm run check:skips`, `npm run check:bugs`, `license-server` `node --test`, and `swift test`; skip reconciliation; failing-test ownership; a worktree of `2bf21f1c`; and the M2-0001/M2-0190 isolation path. Source: `docs/metis-2.0/ledger/tickets/M2-0005.md:33-45`.
- OBSERVED: The program baseline is AskToto-Mantu `origin/main` at `2bf21f1c` (v1.9.6). Source: `docs/metis-2.0/PLAN.md:3-11`.
- OBSERVED: Program policy says no agent runs repository tests until M2-0001's canary passes, and then only in CI, on the isolated QA macOS user, or on the owner's account under the OS sandbox profile. Source: `docs/metis-2.0/PLAN.md:33-36`.
- OBSERVED: Test isolation must cover children, Swift, `license-server`, and wrangler because the in-process tripwire misses those. Source: `docs/metis-2.0/DECISIONS.md:40-40`.
- OBSERVED: LOCALLY_TESTED evidence needs a CI run ID on the PR head. Source: `docs/metis-2.0/DECISIONS.md:43-43`.
- OBSERVED: This review worktree HEAD is `d94539e2016105950f28097ad7d5d7eeb39d5ef9`. Source: command output, `git rev-parse HEAD`, exit 0, retrieved 2026-09-28.
- OBSERVED: The merge-base of this review worktree and `origin/main` is `551ac6afc3521eef15f4a25f2f1e633b4b8aca96`. Source: command output, `git merge-base origin/main HEAD`, exit 0, retrieved 2026-09-28.
- DERIVED: The prior claim that the current worktree HEAD was `f7c86b91abddb57285d7f1916df6ffc7ed05cb59` was wrong; that SHA is the parent commit, not this review worktree HEAD. Source: command output, `git rev-parse HEAD` and `git rev-parse HEAD^`, exit 0, retrieved 2026-09-28.
- OBSERVED: `git status --short` printed no paths before this patch. Source: command output, `git status --short`, exit 0, retrieved 2026-09-28.

## Source snapshot read-only inventory

- OBSERVED: The target source snapshot exposed by `origin/m2/integration:package.json` wires `npm run typecheck` to `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json && node scripts/check-test-types.mjs && tsc --noEmit -p operator/tsconfig.json && tsc --noEmit -p operator/client/tsconfig.json`. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:package.json | nl -ba`, lines 31-33, retrieved 2026-09-28.
- OBSERVED: The same source snapshot wires `npm test` to `node scripts/lock-mode-skills.mjs --check && vitest run && npm run test:proxy && npm run test:operator`, with proxy and operator suites using their own Vitest configs. Source: command output, same `package.json` read, lines 33-38, retrieved 2026-09-28.
- OBSERVED: The same source snapshot exposes `check:bugs` as `node scripts/check-bug-ledger.mjs` and `check:skips` as `node scripts/check-skipped-tests.mjs`. Source: command output, same `package.json` read, lines 78-86, retrieved 2026-09-28.
- OBSERVED: `license-server/package.json` in the same source snapshot wires its `test` script to `node ../scripts/hermetic/run-with-sandbox.mjs -- node --test`. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:license-server/package.json`, retrieved 2026-09-28.
- OBSERVED: The source snapshot contains `native-app/MetisKit/Package.swift`, `tsconfig.node.json`, `tsconfig.web.json`, `operator/tsconfig.json`, `operator/client/tsconfig.json`, `src/main/llm/local-runtime.test.ts`, and `src/main/mcp/mcpClient.audit.test.ts`; it did not list `src/main/emergency-force-quit.test.ts` in the exact-path query. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux ls-tree -r --name-only origin/m2/integration | rg '(^|/)(tsconfig\\.(node|web)\\.json|operator/tsconfig\\.json|operator/client/tsconfig\\.json|src/main/emergency-force-quit\\.test\\.ts|src/main/llm/local-runtime\\.test\\.ts|src/main/mcp/mcpClient.audit\\.test\\.ts|native-app/MetisKit/Package\\.swift)$'`, exit 0, retrieved 2026-09-28.
- OBSERVED: `scripts/check-skipped-tests.mjs` in the source snapshot declares platform skip baselines `{ win32: 16, darwin: 2, linux: 19 }`. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:scripts/check-skipped-tests.mjs | nl -ba`, lines 86-88, retrieved 2026-09-28.
- OBSERVED: `scripts/check-skipped-tests.mjs` produces a Vitest JSON report if none is supplied, reads `pending` or `skipped` assertions, compares the count to the current platform baseline, and fails on unexplained skips. Source: command output, same script read, lines 97-157, retrieved 2026-09-28.
- OBSERVED: `scripts/check-test-types.mjs` in the source snapshot enforces `BASELINE = 10` for `tsconfig.tests.json` diagnostics. Source: command output, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:scripts/check-test-types.mjs`, retrieved 2026-09-28.

## Required gate results

| Gate | Required command | Exit code | Counts | Status and source |
|---|---|---:|---|---|
| Typecheck | `npm run typecheck` | UNAVAILABLE | UNAVAILABLE | BLOCKED_EXTERNAL: this runner was forbidden from running repository scripts/tests; accepted LOCALLY_TESTED evidence requires a CI run ID on the PR head. Sources: owner instruction retrieved 2026-09-28; `docs/metis-2.0/DECISIONS.md:43-43`. |
| Root tests | `vitest run` as part of `npm test` | UNAVAILABLE | UNAVAILABLE | BLOCKED_EXTERNAL for the same reason. The source wiring is OBSERVED in `origin/m2/integration:package.json` lines 33-38 from the read-only `git show` command above. |
| Proxy tests | `npm run test:proxy` as part of `npm test` | UNAVAILABLE | UNAVAILABLE | BLOCKED_EXTERNAL for the same reason. Source wiring: `origin/m2/integration:package.json` lines 35-36 from the read-only `git show` command above. |
| Operator tests | `npm run test:operator` as part of `npm test` | UNAVAILABLE | UNAVAILABLE | BLOCKED_EXTERNAL for the same reason. Source wiring: `origin/m2/integration:package.json` lines 37-38 from the read-only `git show` command above. |
| Skip gate | `npm run check:skips` | UNAVAILABLE | UNAVAILABLE | BLOCKED_EXTERNAL: command would run a repository script and may run Vitest if no report is supplied. Sources: owner instruction retrieved 2026-09-28; `scripts/check-skipped-tests.mjs` read-only source lines 97-157 from the command above. |
| Bug ledger gate | `npm run check:bugs` | UNAVAILABLE | UNAVAILABLE | BLOCKED_EXTERNAL: command is a repository script. Source wiring: `origin/m2/integration:package.json` lines 78-86 from the read-only `git show` command above. |
| License server | `cd license-server && node --test` under M2-0190 isolation | UNAVAILABLE | UNAVAILABLE | BLOCKED_EXTERNAL: required run must use M2-0190 isolation; this runner cannot execute repository tests. Source for isolation need: `docs/metis-2.0/DECISIONS.md:40-40`. |
| Swift package | `cd native-app/MetisKit && swift test` under M2-0190 isolation | UNAVAILABLE | UNAVAILABLE | BLOCKED_EXTERNAL: required run must use M2-0190 isolation; this runner cannot execute repository tests. Source for isolation need: `docs/metis-2.0/DECISIONS.md:40-40`. |

LEAD_ACTION: Produce or retrieve the hermetic CI/QA artifact bundle for `2bf21f1c + M2-0001` only, not raw `2bf21f1c`, with M2-0190 isolation enabled for `license-server`, Swift, child processes, and wrangler-touching tests.

LEAD_ACTION: Add artifact identifiers, CI run IDs, commit SHAs, OS, runner image, retrieval date, exit code, stdout/stderr tail, total/pass/fail/skip counts, and failing-test IDs for every required gate in the table above.

LEAD_ACTION: File the CI-artifact evidence records under the program evidence system; this runner did not do that because only the lead may file CI-artifact evidence records.

## Prior evidence that must not be treated as this baseline

- OBSERVED: K09 found a later `metis-r11-work` hermetic run with `00-typecheck` PASS exit 0, `00b-check-bugs` PASS, root Vitest PASS with 545 files / 6734 total / 6703 passed / 0 failed / 31 pending, proxy 28/28 PASS, and operator 1031/1031 PASS. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:141-154`.
- OBSERVED: K09 states that `metis-r11-work` still did not run `swift test` for MetisKit or native-app builds. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:41-41`.
- OBSERVED: SRC-REVERIFY says CI run `36269153417` was green on an exact commit, but excluded `license-server` and native Swift; therefore baseline checks on the complete tree were not fully met. Source: `docs/metis-2.0/review/SRC-REVERIFY.md:211-214`.
- DERIVED: These prior receipts are comparison evidence only. They do not satisfy M2-0005 because M2-0005 asks for `2bf21f1c + M2-0001` under the hermetic harness, including `license-server` and Swift. Source: `docs/metis-2.0/ledger/tickets/M2-0005.md:33-45`, `docs/metis-2.0/review/lanes/K09-prior-execution.md:141-154`, and `docs/metis-2.0/review/SRC-REVERIFY.md:211-214`.

## Skip-count reconciliation

- OBSERVED: M2-0005 records the unresolved discrepancy as `25 vs 31 vs 1`. Source: `docs/metis-2.0/ledger/tickets/M2-0005.md:29-39`.
- OBSERVED: `31` is the pending count from the later `metis-r11-work` root Vitest receipt: 6734 total / 6703 passed / 0 failed / 31 pending. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:147-154`.
- OBSERVED: `25` appears in two prior contexts: K09 says a Phase-1 critic reported 25 unexplained desktop-test skips, and K09's earlier red-state receipt recorded 6701 passed / 1 failed / 25 skipped. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:41-41` and `docs/metis-2.0/review/lanes/K09-prior-execution.md:154-154`.
- OBSERVED: `1` was not a full-suite measured skip count in the current source snapshot. L11 describes it as the skip gate's hard-coded darwin baseline during that audit, then says the project's clean-machine receipt showed 25 skips. Source: `docs/metis-2.0/review/lanes/L11-build-ci-quality.md:13-20` and `docs/metis-2.0/review/lanes/L11-build-ci-quality.md:136-144`.
- OBSERVED: The current read-only source snapshot for `origin/m2/integration` now declares skip baselines `{ win32: 16, darwin: 2, linux: 19 }`, not darwin `1`. Source: command output, `scripts/check-skipped-tests.mjs` read-only source lines 86-88, retrieved 2026-09-28.
- DERIVED: The discrepancy is not three measurements of the same suite on the same OS. `31` is a patched `metis-r11-work` root-suite pending count; `25` is an older/Phase-1 desktop skip count and red-state receipt; `1` is a stale darwin skip-gate baseline from the L11 audit, not a whole-suite observed count. The current source snapshot has since moved the platform baselines again to 16/2/19, which further proves that a valid baseline must report suite, OS, commit, and artifact source for each count. Sources: `docs/metis-2.0/ledger/tickets/M2-0005.md:35-39`, `docs/metis-2.0/review/lanes/K09-prior-execution.md:41-41`, `docs/metis-2.0/review/lanes/K09-prior-execution.md:147-154`, `docs/metis-2.0/review/lanes/L11-build-ci-quality.md:13-20`, and read-only source lines 86-88 of `scripts/check-skipped-tests.mjs`.
- UNKNOWN: The exact per-test skip inventory for the required `2bf21f1c + M2-0001 + M2-0190` run is unavailable without the CI/QA JSON reports. Source: no target-run CI/QA artifact is cited in this file.

LEAD_ACTION: Attach the Vitest JSON report or parsed skip inventory for each required suite and OS from the `2bf21f1c + M2-0001 + M2-0190` run.

## Failing tests and ownership

- OBSERVED: The only specific failed test file named in the prior K09 receipt is `onboarding-hero-video.test.ts` in an earlier red state; K09 says the later patched run was green. Source: `docs/metis-2.0/review/lanes/K09-prior-execution.md:154-158`.
- UNKNOWN: Failing test IDs for the required M2-0005 target run are unavailable until the lead retrieves or produces the target CI/QA artifacts. Source: no target-run CI/QA artifact is cited in this file.

LEAD_ACTION: For any failing tests in the target CI/QA artifacts, record each failing test ID here with its owning ticket or file a new ticket before accepting M2-0005.

## TypeScript check disposition

- OBSERVED: The public source wiring for `npm run typecheck` includes TypeScript project checks for `tsconfig.node.json`, `tsconfig.web.json`, `operator/tsconfig.json`, and `operator/client/tsconfig.json`, plus the test-type ratchet script. Source: read-only `origin/m2/integration:package.json` lines 31-33 from the command above.
- OBSERVED: The public source snapshot contains the four TypeScript project config paths needed by the wired command. Source: `ls-tree` exact-path command output cited in "Source snapshot read-only inventory", retrieved 2026-09-28.
- BLOCKED_EXTERNAL: The compiler checks were not executed by this runner because the owner instruction forbids repository tests/scripts/app runs, and `npm run typecheck` includes a repository script (`node scripts/check-test-types.mjs`). Source: owner instruction retrieved 2026-09-28; read-only `origin/m2/integration:package.json` lines 31-33 from the command above.

LEAD_ACTION: Run `npm run typecheck` in the approved CI/QA environment and attach the compiler output showing the TypeScript project checks and `check-test-types.mjs` status.

## Acceptance status

- BLOCKED_EXTERNAL: Exit codes and counts for the required target run are unavailable to this runner. Source: required gate list `docs/metis-2.0/ledger/tickets/M2-0005.md:35-45`; no target-run CI/QA artifact is cited in this file.
- DERIVED: The skip-count discrepancy is explained from checked-in review evidence and read-only source snapshots, but the exact target-run skip inventory remains BLOCKED_EXTERNAL until artifacts are attached. Sources: "Skip-count reconciliation" rows above.
- BLOCKED_EXTERNAL: The failing-test list for the required target run is unavailable to this runner. Source: no target-run CI/QA artifact is cited in this file.
- OBSERVED: This edit happened in a review worktree whose HEAD is `d94539e2016105950f28097ad7d5d7eeb39d5ef9`; it is not proof that the required `2bf21f1c + M2-0001` CI/QA run happened. Source: command output, `git rev-parse HEAD`, exit 0, retrieved 2026-09-28.
- DERIVED: M2-0005 cannot be accepted as LOCALLY_TESTED from this worktree alone. The document now records the real blocked baseline state and the corrected provenance SHA, but the required CI/QA artifacts are still missing from this runner's available evidence. Sources: `docs/metis-2.0/ledger/tickets/M2-0005.md:33-49`, `docs/metis-2.0/DECISIONS.md:43-43`, and owner instruction retrieved 2026-09-28.
