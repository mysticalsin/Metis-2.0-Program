# M2-0194 HEAD Freeze/Reopen Matrix Attribution Record

Date: 2026-09-28
Worktree: `/Users/tony/AI-Brain-build/metis-wt-M2-0194`
Result: BLOCKED_EXTERNAL for LIVE_VERIFIED matrix execution; REVISE until the lead-run QA bundle exists.

## Source Register

| ID | Label | Source |
|---|---|---|
| S1 | OBSERVED | `docs/metis-2.0/ledger/tickets/M2-0194.md:31-47` says M2-0194 must re-run the M2-0008 matrix on a lane-built HEAD candidate, record sha256, collect `app.stall`, `reveal`, sidecar events and sampler bundles, attribute each stall, file any uncovered mechanism as a 1.9.7 blocker ticket, update ranking, and satisfy LIVE_VERIFIED. |
| S2 | OBSERVED | `docs/metis-2.0/ledger/tickets/M2-0008.md:34-45` defines the part-a rows and mechanisms: History open, brainStatus blocked `.brain`, macOS activate, second-instance reopen, dataless idle, network off/flapping, interrupt checks, OS-level fixtures, samples and OBSERVED/DERIVED ranking. |
| S3 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:scripts/qa/freeze-repro/run-matrix.sh`, lines 6-20 and 699-737, still describes and runs the M2-0008 1.9.6 matrix rows, not a M2-0194 HEAD observability matrix. Retrieval date: 2026-09-28. |
| S4 | OBSERVED | Same command as S3, lines 745-763, writes `M2-0008` bundle names and `M2-0008.evidence-import.json`; lines 547-550 hand off M2-0008 ranking/evidence filing only. Retrieval date: 2026-09-28. |
| S5 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:scripts/evidence/check.mjs`, lines 556-662 validates only the M2-0008 bundle shape, and lines 701-708 reject any `--ticket` value other than `M2-0008`. Retrieval date: 2026-09-28. |
| S6 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:src/main/infra/observability/projection.ts`, lines 120-142 define `app.stall`, `app.stall.summary`, `app.stall.sampled` and `app.stall.sample_failed`; lines 166-189 define `reveal`, `sidecar.spawn` and `sidecar.exit`. Retrieval date: 2026-09-28. |
| S7 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:src/main/infra/observability/history-trace.ts`, lines 35-77 audits `history.request` stages `received`, `served` and `settled` with queue/main/ipc/render timings. Retrieval date: 2026-09-28. |
| S8 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:src/main/infra/observability/stall-monitor.ts`, lines 124-145 emits a late heartbeat as `app.stall` with `phase`/`phaseMs` and periodic p99 summaries. Retrieval date: 2026-09-28. |
| S9 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:src/main/infra/observability/stall-sampler.ts`, lines 49-84 starts `stall-watch`, observes it as a sidecar, and audits sampled/failure outcomes at lines 55-63 and 84-96. Retrieval date: 2026-09-28. |
| S10 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:src/main/infra/observability/stall-bundle.ts`, lines 106-116 renders `metis stall bundle v1`; lines 151-164 collect, project, delete raw captures and retain bundles. Retrieval date: 2026-09-28. |
| S11 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:native/mac-helper/main.swift`, lines 43-49 and 341-408 define `stall-watch`, `/usr/bin/sample <pid> 5 10`, parent-only sampling, 5 s polling, stale threshold, 10 minute cooldown and `sampled`/`failed` stdout. Retrieval date: 2026-09-28. |
| S12 | OBSERVED | `docs/metis-2.0/ledger/tickets/M2-0030.md:41-49`, `M2-0031.md:45-50`, `M2-0033.md:41-49`, `M2-0036.md:38-45`, and `M2-0193.md:37-42` define the currently declared 1.9.7 coverage set named by M2-0194. |
| S13 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux rev-parse origin/m2/integration` returned `4f8cec873897e07d2c2a408df082331d37b83b59`; `git show --no-patch --format='%H%n%ci%n%s' origin/m2/integration` returned the same commit, date `2026-09-28 01:49:31 -0400`, subject `docs: Reproduce the History freeze and the no-reopen failure on the unmodified packaged 1.9.6 with OS-level slow-file fixtures, and capture main and renderer samples (part a) [M2-0008] (#250)`. Retrieval date: 2026-09-28. |
| S14 | BLOCKED_EXTERNAL | Owner constraint D-28 in the user request forbids running repository tests, scripts or the app locally; user request also reserves CI artifact evidence records, dispatch workflows and Codex audits for the lead. |

## Matrix Execution Status

| Acceptance item | Status | Evidence |
|---|---|---|
| Every repro row re-run on the lane-built candidate with candidate sha256 recorded | BLOCKED_EXTERNAL | S1 requires it; S3/S4 show the available public harness still records M2-0008/1.9.6 semantics; S14 forbids local execution. Candidate artifact sha256 is UNKNOWN in this worktree. |
| `app.stall`, `reveal`, sidecar events and sampler bundles collected | BLOCKED_EXTERNAL | S6-S11 show the event and bundle surfaces exist in code, but no live candidate bundle was available or runnable under S14. |
| Each stall attributed to timer kind, IPC channel or code path, or recorded as unattributed | BLOCKED_EXTERNAL | Attribution rubric below is DERIVED from S2 and S6-S11. No live stalls were OBSERVED in this worktree. |
| Uncovered mechanism filed as 1.9.7 blocker ticket | BLOCKED_EXTERNAL | S1 requires filing; user constraints reserve ledger/ticket edits to the lead. No new live mechanism can be claimed without the blocked QA run. |
| Hypothesis ranking updated with OBSERVED/DERIVED labels | PARTIAL_DERIVED | The ranking below is a scoped M2-0194 update. It intentionally contains no fabricated OBSERVED live rows because the run is blocked by S14. |

## Attribution Rubric for the Lead Run

| Repro row | Required attribution decision | Evidence fields to use | Coverage map |
|---|---|---|---|
| row-1-history-open | Timer/IPC/code path: History list/search or brain-status path; unattributed if no matching `history.request`/`app.stall`/bundle frame exists. | `history.request` `mainMs`, `ipcMs`, `renderMs` (S7); `app.stall.phase`, `phaseMs` (S8); stall bundle frame symbols (S10). | M2-0193 covers History list/search; M2-0031 covers brainStatus and `.brain` sync readers (S12). |
| row-2-brain-status-blocked-brain | Timer/code path: brainStatus poll, boot block or `.brain` reader; unattributed if no phase/frame tie. | `app.stall.phase`, `phaseMs` (S8); bundle frame symbols (S10); row timing from matrix JSONL (S3). | M2-0031 covers brainStatus, boot readers and `.brain` readers (S12). |
| row-3-macos-activate | IPC/reveal path: activate reveal attempt; unattributed if the handler never emits `reveal` and no stall explains it. | `reveal.reason=activate`, outcome/ms (S6); `app.stall` around the attempt (S8). | M2-0036 covers activate/reveal behaviour (S12). |
| row-4-second-instance-reopen | IPC/reveal path: second-instance reveal attempt; unattributed if no event and no stall explains it. | `reveal.reason=second-instance`, outcome/ms (S6); `sidecar.*` only if a sidecar blocks/restarts during the attempt (S6). | M2-0036 covers second-instance/reveal behaviour (S12). |
| row-5-dataless-brain-idle | Timer/code path: boot/resume/consolidation/intelligence `.brain` maintenance; unattributed if no stall or bundle tie. | `app.stall.phase`, `app.stall.summary`, bundle frame symbols (S8-S10), `app.started.prevShutdown`/`prevLastAliveAt` if previous boot died (S6). | M2-0031 covers `.brain` readers; M2-0033 covers repeated automatic maintenance/backfill triggers (S12). |
| row-9-network-off-flapping | Timer/code path: dataless hydration, storage gateway, history/search or `.brain` access; unattributed if no stall or no matching event. | `app.stall`, stall bundle, `history.request`, and matrix interrupt results (S3, S6-S10). | M2-0030 covers gateway admission and dataless classification; M2-0031 covers `.brain`; M2-0193 covers History list/search (S12). |

## Hypothesis Ranking Update

| Rank | Label | Hypothesis | M2-0194 state |
|---|---|---|---|
| 1 | DERIVED | Main-process stall from sync/dataless storage work remains the primary mechanism to test. | S2 establishes this as part-a scope; S6-S11 provide the HEAD observability needed to attribute it; no live M2-0194 observation exists under S14. |
| 2 | DERIVED | Healthy-main reopen no-op remains the primary non-stall reopen mechanism to test. | S2 names activate/second-instance rows; S6 gives `reveal` outcome fields; M2-0036 is the declared coverage ticket in S12. |
| 3 | DERIVED | History list/search can pin libuv or delay UI without a main-thread JS stall. | M2-0193 summary and acceptance in S12 cover this mechanism; S7 provides request-stage timing needed to separate IPC/render delay from main stall. |
| 4 | UNKNOWN | New mechanism outside M2-0030, M2-0031, M2-0033, M2-0036 or M2-0193. | Must remain UNKNOWN until the live matrix is run and a row is either attributed outside the coverage map or recorded unattributed. |

## Required Lead Actions

LEAD_ACTION: Build or select the lane-built HEAD candidate from `origin/m2/integration` or the intended M2-0194 HEAD, record the candidate artifact sha256 and provenance run id, and attach the content-free provenance artifact.
LEAD_ACTION: Dispatch the QA-account matrix on the packaged candidate with the M2-0194-capable harness: `bash scripts/qa/freeze-repro/run-matrix.sh --artifact <candidate sha256> --build-run-id <candidate run id> --app <installed candidate app> --profile-template <synthetic QA profile> --dataless-brain-index <evicted brain index> --dataless-meeting <evicted meeting> --implementer-session-id <opaque> --validator-session-id <opaque> --qa-account --collect-diagnostic-reports`.
LEAD_ACTION: Ensure the uploaded bundle contains `matrix.jsonl`, `interrupt-results.jsonl`, `app.stall` audit excerpts, `reveal` audit excerpts, `sidecar.spawn`/`sidecar.exit` audit excerpts, `app.stall.sampled`/`app.stall.sample_failed` excerpts, and `diagnostics/stalls/*.txt` bundle names only.
LEAD_ACTION: Run the evidence checker in the authorized CI/context after it supports this ticket: `node scripts/evidence/check.mjs --ticket M2-0194 --bundle <uploaded M2-0194 bundle>`.
LEAD_ACTION: File any live-observed mechanism outside M2-0030, M2-0031, M2-0033, M2-0036 or M2-0193 as a 1.9.7 blocker ticket before judging fixes.
LEAD_ACTION: File the LIVE_VERIFIED evidence record from the QA bundle and update the generated ledger/ticket status; do not edit `docs/metis-2.0/ledger/tickets.json` from this worktree.

## Local Verification

OBSERVED: `graphify query "M2-0194 freeze reopen matrix observability stall sampler attribution" --budget 1500` exited 1 with `graph file not found: /Users/tony/AI-Brain-build/metis-wt-M2-0194/graphify-out/graph.json`; `graphify-out/wiki/index.md` was absent. Retrieval date: 2026-09-28.
OBSERVED: `npx tsc --noEmit -p tsconfig.node.json`, `npx tsc --noEmit -p tsconfig.web.json`, and `npx tsc --noEmit -p tsconfig.tests.json` each exited 1 before compiling because `npx` attempted `https://registry.npmjs.org/tsc` and failed with `getaddrinfo ENOTFOUND registry.npmjs.org`; `node -e "require.resolve('typescript/bin/tsc')"` exited 1 with `MODULE_NOT_FOUND`. Retrieval date: 2026-09-28.

## Review Conclusion

OBSERVED: The codebase has the observability surfaces M2-0194 needs (S6-S11).
OBSERVED: The current public freeze harness and checker do not yet validate M2-0194 (S3-S5).
BLOCKED_EXTERNAL: The required packaged HEAD QA run, artifact sha256, sampler bundles and LIVE_VERIFIED evidence record are not present in this worktree and cannot be produced locally under S14.
DERIVED: The correct engineering result for this worktree is REVISE, not SHIP, until the lead-run bundle and M2-0194 checker support exist.
