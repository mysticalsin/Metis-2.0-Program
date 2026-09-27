# Ledger index

213 tickets (212 active, 1 cancelled), grouped by wave (`W0`..`W9`, see `PLAN.md` for wave definitions). Full ticket fields, acceptance and verification checklists live in `ledger/tickets/<id>.md`. Schema: `ledger/tickets.json`.

## W0 (23 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0001](tickets/M2-0001.md) | Make every test process hermetic: per-run HOME/APPDATA/TMPDIR/userData sandbox and a loud tripwire on real-profile paths | safety | sonnet | m3 | _none_ | no | TODO |
| [M2-0002](tickets/M2-0002.md) | Establish the release evidence chain and readiness labels (ADR-017) and make the ledger reject closure without evidence | process | opus | m3 | M2-0001 | no | TODO |
| [M2-0003](tickets/M2-0003.md) | Stop foreign-key and keystore failures from quarantining the brain index: ownership stamp plus decrypt-failure taxonomy | safety | sonnet | m3 | M2-0001 | no | TODO |
| [M2-0004](tickets/M2-0004.md) | Run selftest.ts against a dedicated throwaway userData, never the live profile | safety | sonnet | m4 | M2-0001 | no | TODO |
| [M2-0005](tickets/M2-0005.md) | Record the real verification baseline at HEAD 2bf21f1c under the hermetic harness and explain the skip-count discrepancy | investigation | sonnet | m4 | M2-0001, M2-0190 | no | TODO |
| [M2-0006](tickets/M2-0006.md) | Ship observability v1: clean-shutdown marker, stall monitor, reveal/renderer/sidecar events and History request timings | infra | sonnet | m3 | M2-0001 | no | TODO |
| [M2-0007](tickets/M2-0007.md) | Provision the isolated macOS QA environment and the Windows test lanes for packaged tests | external | sonnet | m3 | _none_ | yes | TODO |
| [M2-0008](tickets/M2-0008.md) | Reproduce the History freeze and the no-reopen failure on the unmodified packaged 1.9.6 with OS-level slow-file fixtures, and capture main and renderer samples (part a) | investigation | opus | m3 | M2-0007, M2-0002 | no | TODO |
| [M2-0009](tickets/M2-0009.md) | Measure the per-process resource baseline on 1.9.6 against MASTER section 7 budgets and ship the census tool every release gate reuses | investigation | sonnet | m3 | M2-0007 | no | TODO |
| [M2-0010](tickets/M2-0010.md) | Give the owner a safe one-off cleanup for today's orphaned llama-server processes | process | sonnet | m3 | _none_ | yes | TODO |
| [M2-0011](tickets/M2-0011.md) | Generate the traceability matrix from the ledger and the canonical ID inventory, with a CI check | process | sonnet | m2 | _none_ | no | TODO |
| [M2-0012](tickets/M2-0012.md) | Issue the owner decision packet and start every external unblock request on day one | process | opus | m2 | M2-0011 | yes | TODO |
| [M2-0014](tickets/M2-0014.md) | Audit Operator production reality: deployed version, off-main ACCESS-bypass commits, D1 schema and data scripts | investigation | sonnet | m2 | _none_ | yes | TODO |
| [M2-0022](tickets/M2-0022.md) | Record the shipping right-edge line (decided 2026-09-24: main 1.9.6 RightEdgeSidecar) and close or salvage the dock-lane PRs #187-#194 | process | opus | m2 | _none_ | no | TODO |
| [M2-0023](tickets/M2-0023.md) | Run independent audits of the plan and ledger: ChatGPT now, Codex after its quota resets | process | opus | m2 | M2-0011 | yes | TODO |
| [M2-0024](tickets/M2-0024.md) | Publish the program docs PR: PLAN, ARCHITECTURE, DECISIONS, BLOCKERS, TRACEABILITY and the ledger | docs | sonnet | m2 | M2-0011, M2-0012 | no | TODO |
| [M2-0025](tickets/M2-0025.md) | Triage all 20 open PRs and 18 open issues per the verified dispositions and set labels and the 2.0 milestone | process | sonnet | m4 | _none_ | no | TODO |
| [M2-0188](tickets/M2-0188.md) | Own integration: merge queue for hot files, declared landing order, agent concurrency caps and the release/1.9.x branch | process | opus | m2 | _none_ | no | TODO |
| [M2-0189](tickets/M2-0189.md) | Get the one-page policy approval: entitlement authority (C-03/C-08/C-16), gateway log policy (C-18), default speech route and the no-content-retention wording | process | opus | m3 | M2-0012 | yes | TODO |
| [M2-0190](tickets/M2-0190.md) | Extend test isolation beyond vitest (swift test, license-server, scripts/qa, wrangler) and define the OS sandbox profile for any owner-account run | safety | sonnet | m4 | M2-0001 | no | TODO |
| [M2-0195](tickets/M2-0195.md) | Record the Windows 1.9.6 baseline on a managed Windows 11 laptop: freeze, heaviness, orphaned sidecars and OneDrive placeholders | investigation | sonnet | m3 | M2-0007, M2-0009 | yes | TODO |
| [M2-0196](tickets/M2-0196.md) | Classify which packaged gates the GitHub windows-latest runner can really run, and assign the rest to the physical Windows device | investigation | sonnet | m3 | M2-0007 | no | TODO |
| [M2-0197](tickets/M2-0197.md) | Measure delivery velocity, re-forecast at each gate and record the owner-approved degrade order | process | opus | m3 | M2-0002, M2-0011 | yes | TODO |

## W1 (19 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0026](tickets/M2-0026.md) | Route every exit path through one ordered sidecar stopAll(), including the onFatal relaunch path and the ffmpeg decoder | fix | sonnet | m3 | M2-0001, M2-0006 | no | TODO |
| [M2-0027](tickets/M2-0027.md) | Add the identity-safe sidecar registry and boot reaper, including the legacy llama-server orphan rule | fix | sonnet | m3 | M2-0026, M2-0007 | no | TODO |
| [M2-0028](tickets/M2-0028.md) | Add mac-helper 'supervise' mode so owned sidecars die within 5 s of any main-process death (HK-M) | fix | sonnet | m3 | M2-0027, M2-0007 | no | TODO |
| [M2-0029](tickets/M2-0029.md) | Prove Windows sidecar ownership with HK-W and add supervise.exe only if the libuv job does not cover descendants | investigation | sonnet | m5 | M2-0027, M2-0007 | no | TODO |
| [M2-0030](tickets/M2-0030.md) | Introduce the storage gateway core: async-only, one global in-flight cap under the libuv pool, dataless-aware classification and injected paths | fix | sonnet | m3 | M2-0001 | no | TODO |
| [M2-0031](tickets/M2-0031.md) | Move every main-thread .brain and meetings-root reader on the verified stall path (brainStatus IPC, boot block, History-open backfill, extraction, draft recovery) onto the storage gateway | fix | sonnet | m3 | M2-0030, M2-0003 | no | TODO |
| [M2-0032](tickets/M2-0032.md) | Render explicit 'not downloaded' and degraded rows in History instead of indefinite loading | design | opus | m3 | M2-0193 | no | TODO |
| [M2-0033](tickets/M2-0033.md) | Enforce one retry/exhaustion policy for every backfill caller and add the boot quiet period for model-bound maintenance | fix | sonnet | m3 | M2-0001, M2-0006 | no | TODO |
| [M2-0035](tickets/M2-0035.md) | Cache local-model integrity verification instead of re-hashing about 2.9 GB before every cold spawn | fix | sonnet | m3 | M2-0001 | no | TODO |
| [M2-0036](tickets/M2-0036.md) | Route every reopen path through one reveal() and make an explicit reopen leave the Hide/Island park state | fix | sonnet | m3 | M2-0006, M2-0007 | no | TODO |
| [M2-0037](tickets/M2-0037.md) | Bound the render-process-gone reload loop and replace the blocking onFatal dialog | fix | sonnet | m3 | M2-0006 | no | TODO |
| [M2-0046](tickets/M2-0046.md) | Qualify and release 1.9.7 from the tested artifact only, with explicit residual risks | ci | opus | m3 | M2-0001, M2-0002, M2-0003, M2-0006, M2-0007, M2-0008, M2-0009, M2-0026, M2-0027, M2-0030, M2-0031, M2-0032, M2-0033, M2-0035, M2-0036, M2-0037, M2-0053, M2-0187, M2-0191, M2-0192, M2-0193, M2-0194 | yes | TODO |
| [M2-0187](tickets/M2-0187.md) | Build each candidate once, test those exact bytes and promote the same bytes (QA-candidate and owner-channel prerelease lane) | ci | sonnet | m3 | _none_ | yes | TODO |
| [M2-0191](tickets/M2-0191.md) | Detect cloud-only files before any read: mac-helper stat-flags (SF_DATALESS) and Windows placeholder attributes (split from M2-0067) | fix | sonnet | m3 | M2-0001 | no | TODO |
| [M2-0192](tickets/M2-0192.md) | Add an out-of-process stall sampler: when the run/alive heartbeat is more than 10 s stale, sample the main process and save a content-free bundle | infra | sonnet | m3 | M2-0006, M2-0191 | no | TODO |
| [M2-0193](tickets/M2-0193.md) | Move History list and search onto the storage gateway: never hydrate on list or search, LRU cache, cancellable search (split from M2-0030) | fix | sonnet | m3 | M2-0030, M2-0031, M2-0191 | no | TODO |
| [M2-0194](tickets/M2-0194.md) | Re-run the freeze and reopen matrix on a packaged build of HEAD with observability v1 and the stall sampler, and attribute every stall (M2-0008 part b) | investigation | opus | m3 | M2-0008, M2-0006, M2-0192, M2-0187 | no | TODO |
| [M2-0198](tickets/M2-0198.md) | Hold the 1.9.7 five-day owner soak checkpoint before any W3 change moves or edits the code 1.9.7 fixed | process | opus | m5 | M2-0046 | yes | TODO |
| [M2-0199](tickets/M2-0199.md) | Close the owner's bugs only on owner-machine evidence: 10 working days with zero stalls over 5 s, zero orphans after unclean exits and zero reveal no-ops | process | opus | m5 | M2-0198, M2-0192 | yes | TODO |

## W2 (14 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0047](tickets/M2-0047.md) | Add architecture fitness functions (dependency-cruiser plus check-architecture ratchet), report-only for 3 days then enforced | ci | sonnet | m4 | M2-0001 | no | TODO |
| [M2-0048](tickets/M2-0048.md) | Wire check:skips into CI with reconciled per-OS baselines and declare the browser-QA skips | ci | sonnet | m4 | M2-0005, M2-0047 | no | TODO |
| [M2-0049](tickets/M2-0049.md) | Pin GitHub Actions by SHA, add permissions blocks, scan docs for secrets, add Dependabot and CODEOWNERS | ci | sonnet | m4 | M2-0048, M2-0053 | no | TODO |
| [M2-0050](tickets/M2-0050.md) | Run MetisKit swift test, build the native App and add mac-helper behavioural tests in CI | ci | sonnet | m4 | M2-0049, M2-0190 | no | TODO |
| [M2-0051](tickets/M2-0051.md) | Run the license-server test suite in CI | ci | sonnet | m4 | M2-0050, M2-0190 | no | TODO |
| [M2-0052](tickets/M2-0052.md) | Adopt a minimal lint and format baseline with a ratchet | ci | sonnet | m4 | M2-0047, M2-0051 | no | TODO |
| [M2-0053](tickets/M2-0053.md) | Publish Windows and macOS releases independently in release.yml | ci | sonnet | m4 | _none_ | no | TODO |
| [M2-0054](tickets/M2-0054.md) | Replace chained release npm scripts with a step-diagnosable release orchestrator | ci | sonnet | m4 | M2-0053 | no | TODO |
| [M2-0055](tickets/M2-0055.md) | Remove hardcoded agent-session scratch paths from Operator preview and gate scripts and fix paths with spaces | ci | sonnet | m4 | _none_ | no | TODO |
| [M2-0056](tickets/M2-0056.md) | Fail release builds when any embedded credential family is still a dev placeholder | ci | sonnet | m4 | _none_ | no | TODO |
| [M2-0057](tickets/M2-0057.md) | Sanitize the prior-execution handoff documents before any copy enters the repository | process | sonnet | m4 | _none_ | yes | IN_PROGRESS |
| [M2-0058](tickets/M2-0058.md) | Procure and wire the Windows code-signing identity and timestamp service into the release pipeline | external | sonnet | m10 | _none_ | yes | TODO |
| [M2-0103](tickets/M2-0103.md) | Provision the isolated Operator staging Worker and D1 with least-privilege server credentials (TASK-012) | external | sonnet | m7 | M2-0014 | yes | TODO |
| [M2-0212](tickets/M2-0212.md) | Prove the BRAG/Hyperframes film toolchain on this setup with a 5-second 4K render | video | opus | m11 | _none_ | no | TODO |

## W3 (45 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0013](tickets/M2-0013.md) | Re-verify the 11 UNKNOWN source findings, re-anchor SRC-04 and disposition F-01 to F-20 against HEAD | investigation | sonnet | m5 | _none_ | no | TODO |
| [M2-0015](tickets/M2-0015.md) | Pin the actual system: sanitized baseline and source register for every workspace, client and deployment (TASK-001) | investigation | sonnet | m5 | M2-0005, M2-0014, M2-0013 | no | TODO |
| [M2-0016](tickets/M2-0016.md) | Lock the full PRD, threat model and coverage map (TASK-002) after the one-page policy approval; gates no other ticket | process | opus | m5 | M2-0189, M2-0013, M2-0011 | yes | TODO |
| [M2-0017](tickets/M2-0017.md) | Reconcile in-repo 2.0 design docs and prior audits with the kit and mark superseded documents | docs | sonnet | m5 | _none_ | no | TODO |
| [M2-0018](tickets/M2-0018.md) | Complete the targeted review of the code areas no lane covered and file every finding as a ticket | investigation | sonnet | m5 | M2-0011 | no | TODO |
| [M2-0019](tickets/M2-0019.md) | Run the kit's own proof suites in scratch copies and decide port, reimplement or vendor for each behavior-core module | investigation | opus | m5 | M2-0190 | no | TODO |
| [M2-0020](tickets/M2-0020.md) | Pin the Hindsight upstream identity: release, commit, client SDK version, API schema and image digest (HMSTEP-01) | investigation | sonnet | m5 | _none_ | no | TODO |
| [M2-0021](tickets/M2-0021.md) | Commit the sanitized runtime evidence and review reports under docs/metis-2.0/review | docs | sonnet | m5 | _none_ | no | TODO |
| [M2-0034](tickets/M2-0034.md) | Size extraction windows to the local runtime's per-slot context so records stop failing deterministically | fix | sonnet | m5 | M2-0033, M2-0198 | no | TODO |
| [M2-0038](tickets/M2-0038.md) | Separate the App Nap latch from boot-sentinel deletion and add a brain-resume marker | fix | sonnet | m5 | M2-0006, M2-0198 | no | TODO |
| [M2-0039](tickets/M2-0039.md) | Throttle parked orb animation and overlay cursor polling without relying on Page Visibility (ADR-018, measure first) | fix | opus | m5 | M2-0009, M2-0198 | no | TODO |
| [M2-0040](tickets/M2-0040.md) | Replace all nine native renderer dialogs with one async navigation-guard service (Save / Discard / Cancel) | design | opus | m5 | M2-0001, M2-0036 | no | TODO |
| [M2-0041](tickets/M2-0041.md) | Land the validated kit patches (metis-r11-scoped 16 files, SOURCE-UPDATE 4 files) and retire media-repair.patch | fix | sonnet | m5 | M2-0001, M2-0005 | no | TODO |
| [M2-0042](tickets/M2-0042.md) | Close #196/#197: verify the packaged ELECTRON_RENDERER_URL guard and fix the onboarding Act2 'Next' without unconditional advance (TASK-027.A) | fix | sonnet | m5 | M2-0001, M2-0007, M2-0198 | no | TODO |
| [M2-0043](tickets/M2-0043.md) | Keep Nova-3 final transcript text when the words array is empty | fix | sonnet | m5 | M2-0001 | no | TODO |
| [M2-0044](tickets/M2-0044.md) | Give Windows a live screen-capture eligibility gate so the background capture loop cannot spin | fix | sonnet | m5 | M2-0001, M2-0007, M2-0198 | no | TODO |
| [M2-0045](tickets/M2-0045.md) | Restore the desktop integration-kind allowlist to the Worker connector catalog and pin their parity | fix | sonnet | m5 | M2-0001 | no | TODO |
| [M2-0059](tickets/M2-0059.md) | Govern the refactor as bounded strangler slices and record the supplied refactoring skill (TASK-061) | process | opus | m5 | M2-0047 | yes | TODO |
| [M2-0060](tickets/M2-0060.md) | Extract AppContext, ipc/security.ts and a typed registerHandler from index.ts as pure moves | refactor | sonnet | m5 | M2-0047, M2-0198 | no | TODO |
| [M2-0061](tickets/M2-0061.md) | Create a zod-free shared/contracts/channels.ts, import it in every preload and delete the dead local-ai channels | refactor | sonnet | m5 | M2-0060 | no | TODO |
| [M2-0062](tickets/M2-0062.md) | Drive SettingsPatch and the runtime strip from one SERVER_AUTHORITATIVE_SETTINGS_KEYS constant | fix | sonnet | m5 | M2-0061, M2-0198 | no | TODO |
| [M2-0063](tickets/M2-0063.md) | Add golden and negative contract fixtures shared with Swift and fix the TranscriptLine you/me speaker drift | refactor | sonnet | m5 | M2-0061, M2-0050 | no | TODO |
| [M2-0064](tickets/M2-0064.md) | Define the shared contracts m6 consumes (speech, command, capability, action result, events) with migration and golden fixtures (TASK-005) | feature | sonnet | m5 | M2-0063 | no | TODO |
| [M2-0065](tickets/M2-0065.md) | Extract lifecycle, process infra and window factories out of index.ts and split preload into api.ts plus bootstrap | refactor | sonnet | m5 | M2-0060, M2-0028, M2-0036, M2-0198 | no | TODO |
| [M2-0066](tickets/M2-0066.md) | Build the durable local journal with acknowledged saves, dual-writing with the folder autosave draft (C3) | feature | sonnet | m5 | M2-0060, M2-0003, M2-0007, M2-0031, M2-0198 | no | TODO |
| [M2-0067](tickets/M2-0067.md) | Add the device-local meetings index so History renders without touching cloud content (C5) | feature | sonnet | m5 | M2-0193, M2-0198 | no | TODO |
| [M2-0068](tickets/M2-0068.md) | Peel registerIpc part 1: history, recall and brain handlers into features with behavioural tests; break the brain ingest cycle | refactor | sonnet | m5 | M2-0060, M2-0031, M2-0198 | no | TODO |
| [M2-0069](tickets/M2-0069.md) | Peel registerIpc part 2: import, settings and licensing handlers, with an async import-job store and a stoppable decoder pipeline | refactor | sonnet | m10 | M2-0068, M2-0062, M2-0198 | no | TODO |
| [M2-0070](tickets/M2-0070.md) | Peel registerIpc part 3: integrations and remaining handlers; delete dead files and channels; registerIpc removed | refactor | sonnet | m10 | M2-0069, M2-0198 | no | TODO |
| [M2-0071](tickets/M2-0071.md) | Split Settings.tsx: UI primitives to ui/ and sections to features/settings, testing DustSetup and AgentPicker first | refactor | sonnet | m10 | M2-0047, M2-0040 | no | TODO |
| [M2-0072](tickets/M2-0072.md) | Decompose App.tsx into hooks and move live-transcript state out of the root render path | refactor | sonnet | m5 | M2-0040, M2-0198 | no | TODO |
| [M2-0073](tickets/M2-0073.md) | Register every main-process timer with the background scheduler (FF-14) | refactor | sonnet | m5 | M2-0033, M2-0065, M2-0198 | no | TODO |
| [M2-0074](tickets/M2-0074.md) | Burn down synchronous fs on boot and hot paths and bound corruption-snapshot and temp-file growth | refactor | sonnet | m10 | M2-0031, M2-0047, M2-0198 | no | TODO |
| [M2-0075](tickets/M2-0075.md) | Virtualize the unbounded History, Review, Brain and relationship lists | fix | sonnet | m5 | M2-0072, M2-0198 | no | TODO |
| [M2-0076](tickets/M2-0076.md) | Surface silent fail-closed states (unreadable settings, degraded index) to the user | fix | sonnet | m5 | M2-0072, M2-0198 | no | TODO |
| [M2-0077](tickets/M2-0077.md) | Give SignInWall, LicenseGate and onboarding dialogs dialog semantics and focus traps | fix | sonnet | m5 | M2-0072 | no | TODO |
| [M2-0078](tickets/M2-0078.md) | Centralize the duplicate warning-amber tokens and delete stale fallback literals | design | opus | m10 | M2-0071 | no | TODO |
| [M2-0101](tickets/M2-0101.md) | Design the simplified four-destination Settings inventory and task flows (TASK-008) | design | opus | m5 | _none_ | no | TODO |
| [M2-0200](tickets/M2-0200.md) | Gate every train build on a packaged resource census against the 1.9.7 baseline (fail on a >10% regression or any section 7 budget breach) | ci | sonnet | m5 | M2-0009, M2-0046 | no | TODO |
| [M2-0201](tickets/M2-0201.md) | Produce DESIGNED prototypes of the 2.0 surfaces in W3 so m6-m10 implementation starts from approved designs | design | opus | m5 | _none_ | no | TODO |
| [M2-0202](tickets/M2-0202.md) | Ship the right-edge P1 repairs (TASK-028.A, defects D1-D11) on main's RightEdgeSidecar in the first train after 1.9.7 | design | opus | m5 | M2-0022, M2-0007, M2-0036, M2-0198 | no | TODO |
| [M2-0203](tickets/M2-0203.md) | Fix Relationships so notes appear as nodes again (re-implement PR #187 at brainAdapter.ts:485, account and sector filters aware) | fix | sonnet | m5 | M2-0001 | no | TODO |
| [M2-0204](tickets/M2-0204.md) | Keep numeral start offsets in extractNumerals and sort by them (split from M2-0113) | fix | sonnet | m5 | M2-0001 | no | TODO |
| [M2-0205](tickets/M2-0205.md) | Move the ingest ledger from .brain/index.json to userData through expand then switch (split from M2-0067) | feature | sonnet | m5 | M2-0003, M2-0031, M2-0198 | no | TODO |
| [M2-0206](tickets/M2-0206.md) | Owner-channel build T1 (version 1.9.9) at the m5 exit: journal dual-write, meetings index, ledger expand and switch, and the deferred 1.9.x fixes | ci | opus | m5 | M2-0187, M2-0200, M2-0198, M2-0060, M2-0061, M2-0063, M2-0064, M2-0065, M2-0066, M2-0067, M2-0205, M2-0029, M2-0034, M2-0038, M2-0039, M2-0040, M2-0041, M2-0042, M2-0043, M2-0044, M2-0045, M2-0202, M2-0203, M2-0204 | yes | TODO |

## W4 (24 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0079](tickets/M2-0079.md) | Own command sessions and capture generations in main and decide the capture owner by spike (ADR-015) | feature | sonnet | m6 | M2-0064, M2-0065 | no | TODO |
| [M2-0080](tickets/M2-0080.md) | Repair the trusted audio broker with requested-only tracks and bounded queues (TASK-017) | feature | sonnet | m6 | M2-0079 | no | TODO |
| [M2-0081](tickets/M2-0081.md) | Implement opt-in on-device wake detection and immediate local Stop authority (TASK-019) | feature | sonnet | m6 | M2-0080 | no | TODO |
| [M2-0082](tickets/M2-0082.md) | Build the capability registry, typed action results and independent postcondition verifier (HeyClicky verified actions) | feature | sonnet | m6 | M2-0064, M2-0079 | no | TODO |
| [M2-0083](tickets/M2-0083.md) | Wire the command path end to end: recognizer, runtime, proposal preview, Confirm/Cancel card and verified adapter result | feature | sonnet | m6 | M2-0081, M2-0082 | no | TODO |
| [M2-0084](tickets/M2-0084.md) | Implement qualified macOS app, window, note and camera adapters with readback | feature | sonnet | m6 | M2-0082, M2-0007, M2-0028 | no | TODO |
| [M2-0085](tickets/M2-0085.md) | Implement Windows adapters with UI Automation and SendInput plus readback (TASK-033.WIN) | feature | sonnet | m6 | M2-0082, M2-0007 | no | TODO |
| [M2-0086](tickets/M2-0086.md) | Implement browser actions with explicit account and tab scope and injection refusal | feature | sonnet | m6 | M2-0082 | no | TODO |
| [M2-0087](tickets/M2-0087.md) | Deliver click-to-talk, interruptible spoken replies and stale-audio fences (CXSTEP-03) | feature | sonnet | m6 | M2-0080, M2-0081 | no | TODO |
| [M2-0088](tickets/M2-0088.md) | Bind context to the selected window, field and source and add non-controlling screen guidance (CXSTEP-04/05) | design | opus | m6 | M2-0082 | no | TODO |
| [M2-0089](tickets/M2-0089.md) | Own foreground input, let the human take over instantly and recover from interruptions (CXSTEP-07) | feature | sonnet | m6 | M2-0082 | no | TODO |
| [M2-0090](tickets/M2-0090.md) | Execute bounded multi-step plans and safe verbatim dictation into the exact intended field (CXSTEP-09/10) | feature | sonnet | m6 | M2-0082, M2-0089 | no | TODO |
| [M2-0091](tickets/M2-0091.md) | Journal operations with resource fencing so crashes and timeouts never replay or lose effects | feature | sonnet | m6 | M2-0066, M2-0082 | no | TODO |
| [M2-0092](tickets/M2-0092.md) | Qualify the thinking-orbs, border-beam and voice-glow dependencies (versions, licences, security) before adoption | infra | opus | m6 | _none_ | no | TODO |
| [M2-0093](tickets/M2-0093.md) | Implement the section 5.11 ARMED orb and the expanded pill, caption, beam and voice glow; reconcile the three voice/orb/bar designs (TASK-030) | design | opus | m6 | M2-0079, M2-0022, M2-0092, M2-0201 | no | TODO |
| [M2-0094](tickets/M2-0094.md) | Unify buttons, voice and text into one visible task card with receipt-driven progress (CXSTEP-08) | design | opus | m6 | M2-0082, M2-0093, M2-0201 | no | TODO |
| [M2-0095](tickets/M2-0095.md) | Requalify right-edge and expanded input with the completed command session under one geometry authority (TASK-028.B) | design | opus | m6 | M2-0202, M2-0072, M2-0007, M2-0079 | no | TODO |
| [M2-0096](tickets/M2-0096.md) | Add the global show/hide shortcut and a separate command-voice toggle without disturbing note-taking (NK, v4 owner correction) | feature | sonnet | m6 | M2-0036, M2-0079, M2-0066, M2-0007 | no | TODO |
| [M2-0097](tickets/M2-0097.md) | Make keyboard-first notes durable on the journal and keep human notes authoritative (EXP-02) | feature | sonnet | m6 | M2-0066, M2-0096 | no | TODO |
| [M2-0098](tickets/M2-0098.md) | Enable renderer health monitoring and journal-gated automatic recovery with SAFE_MODE (ADR-004) | feature | sonnet | m6 | M2-0066, M2-0036, M2-0065, M2-0007 | no | TODO |
| [M2-0099](tickets/M2-0099.md) | Extend the registry with named agents, isolated context and exact routing (section 32) | feature | sonnet | m6 | M2-0079, M2-0064, M2-0042, M2-0202 | no | TODO |
| [M2-0100](tickets/M2-0100.md) | Design the named orbs and compact Agent Home with accessibility and scale limits | design | opus | m6 | M2-0099, M2-0093, M2-0201, M2-0042, M2-0202 | no | TODO |
| [M2-0178](tickets/M2-0178.md) | Build the launch-film claim register and truth/readiness gate from verified evidence only | video | opus | m6 | M2-0002, M2-0011 | no | TODO |
| [M2-0207](tickets/M2-0207.md) | Owner-channel build T2 at the m6 exit: interaction core behind flags | ci | opus | m6 | M2-0206, M2-0079, M2-0080, M2-0083, M2-0096, M2-0097, M2-0098 | yes | TODO |

## W5 (18 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0102](tickets/M2-0102.md) | Qualify the exact Cloudflare speech hosting and privacy route (TASK-011) | external | sonnet | m7 | _none_ | yes | TODO |
| [M2-0104](tickets/M2-0104.md) | Disable speech content logs and caches server-side, with readiness states, before any capture test (TASK-013) | feature | sonnet | m7 | M2-0102, M2-0103 | no | TODO |
| [M2-0105](tickets/M2-0105.md) | Make diagnostics and metering projections content-free with finite retention (TASK-015) | feature | sonnet | m7 | M2-0006, M2-0064 | no | TODO |
| [M2-0106](tickets/M2-0106.md) | Repair identity and authoritative metering end to end (TASK-034) | feature | sonnet | m9 | M2-0064, M2-0105 | no | TODO |
| [M2-0107](tickets/M2-0107.md) | Implement the authenticated speech-session broker and remove device-side organization credentials (TASK-014) | feature | sonnet | m7 | M2-0104, M2-0064 | no | TODO |
| [M2-0108](tickets/M2-0108.md) | Connect the real Cloudflare Nova-3 realtime transport through the server relay (TASK-016) | feature | sonnet | m7 | M2-0107, M2-0105 | no | TODO |
| [M2-0109](tickets/M2-0109.md) | Harden segment revision, per-track reconnect and stream finalization (TASK-018) | feature | sonnet | m7 | M2-0080, M2-0064 | no | TODO |
| [M2-0110](tickets/M2-0110.md) | Split listen.ts into per-engine modules now that speech is being changed anyway | refactor | sonnet | m7 | M2-0109 | no | TODO |
| [M2-0111](tickets/M2-0111.md) | Prove the first complete synthetic Cloudflare speech path and inspect every sink (TASK-020) | investigation | sonnet | m7 | M2-0108, M2-0109, M2-0081 | no | TODO |
| [M2-0112](tickets/M2-0112.md) | Make Cloudflare-hosted speech the actual fresh-profile default on every platform | fix | sonnet | m7 | M2-0107 | no | TODO |
| [M2-0113](tickets/M2-0113.md) | Build the transcript fidelity and speech latency qualification harness (TASK-053) | feature | sonnet | m7 | M2-0111 | no | TODO |
| [M2-0114](tickets/M2-0114.md) | Deliver the live meeting experience boundaries: quiet assistance, audience-safe output and truthful capture recovery (EXP-01/03/07) | design | opus | m7 | M2-0066, M2-0109, M2-0094, M2-0201 | no | TODO |
| [M2-0115](tickets/M2-0115.md) | Build hardware qualification and the reviewed local model catalog, and reconcile the 3.3 GB model directory (TASK-021) | feature | sonnet | m7 | M2-0064, M2-0009 | no | TODO |
| [M2-0116](tickets/M2-0116.md) | Enforce local model load, resource and fallback rules (TASK-025) | feature | sonnet | m7 | M2-0115, M2-0033 | no | TODO |
| [M2-0117](tickets/M2-0117.md) | Implement the four-destination Settings with legacy-key migration and optional local model controls (TASK-022) | design | opus | m7 | M2-0101, M2-0115, M2-0201 | no | TODO |
| [M2-0118](tickets/M2-0118.md) | Build the native Mac foundation with genuine capture, Keychain and shared contract fixtures (TASK-029) | feature | sonnet | m7 | M2-0063, M2-0064, M2-0050 | no | TODO |
| [M2-0208](tickets/M2-0208.md) | Automate the 12 golden flows and run them nightly on the latest lane build from m7 | ci | sonnet | m7 | M2-0187, M2-0207 | no | TODO |
| [M2-0209](tickets/M2-0209.md) | Owner-channel build T3 at the m7 exit: speech broker, Cloudflare realtime path and segment revision | ci | opus | m7 | M2-0207, M2-0208, M2-0107, M2-0108, M2-0109, M2-0110, M2-0112 | yes | TODO |

## W6 (26 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0119](tickets/M2-0119.md) | Decide and scaffold the server intelligence plane: hosting, region, managed Postgres and a local compose profile (ADR-014) | design | opus | m8 | M2-0020 | yes | TODO |
| [M2-0120](tickets/M2-0120.md) | Lock canonical knowledge, provenance and storage authority (TASK-007) | design | opus | m8 | _none_ | yes | TODO |
| [M2-0121](tickets/M2-0121.md) | Establish cross-surface Entra and service identity (TASK-006) | external | sonnet | m9 | M2-0064 | yes | TODO |
| [M2-0122](tickets/M2-0122.md) | Apply Jev decisions instead of discarding them: DecisionProvider interface with generation-checked application | feature | sonnet | m8 | M2-0064, M2-0079 | no | TODO |
| [M2-0123](tickets/M2-0123.md) | Add the Operator /v1/decide route with the Jev vendor secret held in the Operator vault | external | sonnet | m8 | M2-0122, M2-0103 | yes | TODO |
| [M2-0124](tickets/M2-0124.md) | Qualify the Laya alternative behind /v1/decide without any Jev dependency (TASK-032) | external | sonnet | m8 | M2-0123, M2-0119 | yes | TODO |
| [M2-0125](tickets/M2-0125.md) | Implement the governed canonical knowledge service against the local compose profile (TASK-035) | feature | sonnet | m8 | M2-0120, M2-0119, M2-0121 | no | TODO |
| [M2-0126](tickets/M2-0126.md) | Build deterministic wiki and graph projections with incremental atomic refresh (TASK-036) | feature | sonnet | m8 | M2-0125 | no | TODO |
| [M2-0127](tickets/M2-0127.md) | Build the authorized evidence context builder (TASK-037) | feature | sonnet | m8 | M2-0126 | no | TODO |
| [M2-0128](tickets/M2-0128.md) | Deploy and connect the Dust knowledge read tools over remote MCP (TASK-038) | external | sonnet | m8 | M2-0127, M2-0121, M2-0042, M2-0202 | yes | TODO |
| [M2-0129](tickets/M2-0129.md) | Implement real Dust writes and reviewed corrections with compare-and-swap and idempotency (TASK-039) | feature | sonnet | m8 | M2-0128 | no | TODO |
| [M2-0130](tickets/M2-0130.md) | Rework Mantu Intelligence into an evidence-first workspace (TASK-040) | design | opus | m8 | M2-0127, M2-0101, M2-0201 | no | TODO |
| [M2-0131](tickets/M2-0131.md) | Calibrate Jev profiles, integrate classifications into Intelligence and prove the rollout (JVSTEP-06/09/10) | feature | sonnet | m8 | M2-0123, M2-0130 | no | TODO |
| [M2-0132](tickets/M2-0132.md) | Close knowledge synchronization, correction and deletion loops across every projection (TASK-041) | feature | sonnet | m8 | M2-0129, M2-0126 | no | TODO |
| [M2-0133](tickets/M2-0133.md) | Run the pinned private Hindsight service in the compose profile and bind identity and bank generation (HMSTEP-03/04) | feature | sonnet | m8 | M2-0020, M2-0119, M2-0121, M2-0042, M2-0202 | no | TODO |
| [M2-0134](tickets/M2-0134.md) | Project approved canonical records into Hindsight with revision-safe retain and outbox reconciliation (HMSTEP-02/05) | feature | sonnet | m8 | M2-0133, M2-0125, M2-0042, M2-0202 | no | TODO |
| [M2-0135](tickets/M2-0135.md) | Implement bounded source-linked recall and optional grounded reflection (HMSTEP-06/10) | feature | sonnet | m8 | M2-0134, M2-0127, M2-0042, M2-0202 | no | TODO |
| [M2-0136](tickets/M2-0136.md) | Implement correction, tombstone and purge fences with no resurrection (HMSTEP-07) | feature | sonnet | m8 | M2-0134, M2-0132, M2-0042, M2-0202 | no | TODO |
| [M2-0137](tickets/M2-0137.md) | Wire the memory UX, failure independence and accounting into Métis (HMSTEP-08/11, HSAC) | design | opus | m8 | M2-0135, M2-0117, M2-0042, M2-0202, M2-0201 | no | TODO |
| [M2-0138](tickets/M2-0138.md) | Execute the Hindsight live proof A-H with two real test identities | external | sonnet | m8 | M2-0136, M2-0137, M2-0096, M2-0042, M2-0202 | yes | TODO |
| [M2-0139](tickets/M2-0139.md) | Define centrally governed skill contracts and runtime boundaries (TASK-009) | design | opus | m8 | M2-0064, M2-0120 | no | TODO |
| [M2-0140](tickets/M2-0140.md) | Implement versioned server skill authoring and publishing in Operator (TASK-042) | feature | sonnet | m8 | M2-0139, M2-0103 | no | TODO |
| [M2-0141](tickets/M2-0141.md) | Implement contextual server skill execution with scoped permissions and budgets (TASK-043) | feature | sonnet | m8 | M2-0140, M2-0127, M2-0106 | no | TODO |
| [M2-0142](tickets/M2-0142.md) | Connect the user skill catalog, artifacts and versioned run receipts (TASK-044) | design | opus | m8 | M2-0141, M2-0117 | no | TODO |
| [M2-0143](tickets/M2-0143.md) | Make suggestions and routines explicit, durable and quiet during calls (CXSTEP-14) | feature | sonnet | m8 | M2-0141, M2-0099, M2-0042, M2-0202 | no | TODO |
| [M2-0144](tickets/M2-0144.md) | Fix Plane OAuth redirect handling, derive the ClickUp workspace from the connected account and parallelize Dust project discovery | fix | sonnet | m8 | M2-0001 | no | TODO |

## W7 (16 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0145](tickets/M2-0145.md) | Fix Operator correctness: unroutable brokered MCP endpoint, per-device HMAC binding and the proxy body cap | fix | sonnet | m9 | M2-0103 | no | TODO |
| [M2-0146](tickets/M2-0146.md) | Decide the entitlement authority and implement licensing precedence (ADR-016) | external | sonnet | m9 | M2-0062 | yes | TODO |
| [M2-0147](tickets/M2-0147.md) | Fix the desktop security findings: pinned PowerShell path, MCP DNS-rebinding pin, CLI shell-string and metacharacter validation, tenant rotation | fix | sonnet | m9 | M2-0001 | no | TODO |
| [M2-0148](tickets/M2-0148.md) | Reconcile interaction-session privacy, permissions and actual consumption (CXSTEP-16) | feature | sonnet | m9 | M2-0082, M2-0106 | no | TODO |
| [M2-0149](tickets/M2-0149.md) | Close no-content-retention and drift-evidence gates across every speech and follow-on route (TASK-057) | feature | sonnet | m9 | M2-0111, M2-0106 | no | TODO |
| [M2-0150](tickets/M2-0150.md) | Complete governance, subject rights and sharing qualification and add the multi-seat/Teams compliance track (TASK-058) | external | sonnet | m9 | M2-0132, M2-0149 | yes | TODO |
| [M2-0151](tickets/M2-0151.md) | Qualify Teams, Zoom and Meet APIs, capture permissions and legal prerequisites (TASK-010) | external | sonnet | m9 | M2-0121, M2-0120 | yes | TODO |
| [M2-0152](tickets/M2-0152.md) | Build the Teams personal tab and meeting side panel with SSO behind a flag (TASK-046) | design | opus | m9 | M2-0121, M2-0101 | yes | TODO |
| [M2-0153](tickets/M2-0153.md) | Implement enrolled meeting discovery and actual-start events (TASK-047) | feature | sonnet | m9 | M2-0151, M2-0152 | yes | TODO |
| [M2-0154](tickets/M2-0154.md) | Implement single-occurrence join coordination and admission handling (TASK-048) | feature | sonnet | m9 | M2-0153 | no | TODO |
| [M2-0155](tickets/M2-0155.md) | Build the Teams media receiver and connect consent-aware media to Cloudflare speech (TASK-049/050) | external | sonnet | m9 | M2-0154, M2-0107 | yes | TODO |
| [M2-0156](tickets/M2-0156.md) | Qualify post-meeting Microsoft transcript access and Zoom/Meet adapters (TASK-051) | external | sonnet | m9 | M2-0151 | yes | TODO |
| [M2-0157](tickets/M2-0157.md) | Publish meeting knowledge and skill outputs to the right audience (TASK-052) | feature | sonnet | m9 | M2-0132, M2-0141, M2-0154 | no | TODO |
| [M2-0158](tickets/M2-0158.md) | Repair portal totals, speech controls and data-health UX and add the missing portal surfaces inside the existing chrome (TASK-045) | design | opus | m9 | M2-0106, M2-0201 | no | TODO |
| [M2-0159](tickets/M2-0159.md) | Exercise production operations, staging and recovery: restore drills, drift alarms, kill switches and rotation runbooks (TASK-062) | external | sonnet | m9 | M2-0103, M2-0149, M2-0106 | yes | TODO |
| [M2-0213](tickets/M2-0213.md) | Pre-produce the launch film before the freeze: storyboard variants per claim state, non-product scenes and the scratch-edit plan (split from M2-0180) | video | opus | m11 | M2-0212, M2-0178 | no | TODO |

## W8 (19 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0160](tickets/M2-0160.md) | Repair onboarding and migration: privacy-ready Cloudflare setup, optional non-blocking downloads and the Tony welcome slot (TASK-027.B, OBU-01..05) | design | opus | m10 | M2-0112, M2-0117, M2-0042, M2-0007, M2-0163, M2-0201 | yes | TODO |
| [M2-0161](tickets/M2-0161.md) | Decide and design native Mac onboarding and UI parity (5-scene vs 8-scene topology) | design | opus | m10 | M2-0118, M2-0160 | no | TODO |
| [M2-0162](tickets/M2-0162.md) | Provision signed manifests and R2 asset delivery under one capability manifest (TASK-023) | external | sonnet | m10 | M2-0115, M2-0103 | yes | TODO |
| [M2-0163](tickets/M2-0163.md) | Implement optional component lifecycle and installation (TASK-024) | feature | sonnet | m10 | M2-0162 | no | TODO |
| [M2-0164](tickets/M2-0164.md) | Produce the genuinely lean cloud-first core package (TASK-026) | feature | sonnet | m10 | M2-0163, M2-0108, M2-0116 | no | TODO |
| [M2-0165](tickets/M2-0165.md) | Qualify optional local packs on actual device classes (TASK-059) | external | sonnet | m10 | M2-0163, M2-0116, M2-0113, M2-0007 | yes | TODO |
| [M2-0166](tickets/M2-0166.md) | Tune speed and footprint against the recorded baseline and meet the section 7 budgets (TASK-060) | fix | sonnet | m10 | M2-0164, M2-0093, M2-0113, M2-0039 | no | TODO |
| [M2-0167](tickets/M2-0167.md) | Contract the ledger and journal migrations: stop reading the legacy ledger and remove folder autosave drafts | refactor | sonnet | m10 | M2-0066, M2-0206, M2-0205 | no | TODO |
| [M2-0168](tickets/M2-0168.md) | Verify install, migrate, update and recover the signed artifact, including update-feed continuity (FLOW-09) | feature | sonnet | m10 | M2-0164, M2-0053, M2-0022, M2-0167, M2-0058 | no | TODO |
| [M2-0169](tickets/M2-0169.md) | Verify summaries, knowledge and sync without cloud content copies (TASK-054) | investigation | sonnet | m10 | M2-0132, M2-0113, M2-0149, M2-0141, M2-0109 | no | TODO |
| [M2-0170](tickets/M2-0170.md) | Run the real cross-platform Cloudflare-to-action-to-portal journeys on packaged clients (TASK-056) | investigation | sonnet | m10 | M2-0160, M2-0093, M2-0084, M2-0085, M2-0086, M2-0106, M2-0158, M2-0113, M2-0169, M2-0123, M2-0111, M2-0007 | yes | TODO |
| [M2-0171](tickets/M2-0171.md) | Implement the machine-checkable release decision and section 27 contract linter on the release commit | ci | sonnet | m10 | M2-0002, M2-0011 | no | TODO |
| [M2-0172](tickets/M2-0172.md) | Bring engineering docs, runbooks and architecture docs to 2.0 reality | docs | sonnet | m10 | M2-0171 | no | TODO |
| [M2-0173](tickets/M2-0173.md) | Build, freeze and qualify the immutable 2.0 candidate family from rc1 (TASK-063); Windows signing is the separate step M2-0211 | ci | opus | m10 | M2-0210, M2-0171 | no | TODO |
| [M2-0174](tickets/M2-0174.md) | Verify and publish the already-signed Windows candidate without rebuilding (TASK-064) | external | sonnet | m10 | M2-0211 | yes | TODO |
| [M2-0175](tickets/M2-0175.md) | Finalize native Mac QA and record the Apple publication decision as out of scope (TASK-065) | external | sonnet | m10 | M2-0118, M2-0173 | yes | TODO |
| [M2-0186](tickets/M2-0186.md) | Apple public signing, notarization and public Mac DMG publication (excluded from the program) | process | opus | m10 | _none_ | no | CANCELLED |
| [M2-0210](tickets/M2-0210.md) | Freeze 2.0 features on 2026-11-15 and qualify rc1 with a 72 h owner soak | ci | opus | m10 | M2-0001, M2-0002, M2-0003, M2-0004, M2-0005, M2-0006, M2-0007, M2-0008, M2-0009, M2-0010, M2-0011, M2-0012, M2-0013, M2-0014, M2-0015, M2-0016, M2-0017, M2-0018, M2-0019, M2-0020, M2-0021, M2-0022, M2-0023, M2-0024, M2-0025, M2-0026, M2-0027, M2-0028, M2-0029, M2-0030, M2-0031, M2-0032, M2-0033, M2-0034, M2-0035, M2-0036, M2-0037, M2-0038, M2-0039, M2-0040, M2-0041, M2-0042, M2-0043, M2-0044, M2-0045, M2-0046, M2-0047, M2-0048, M2-0049, M2-0050, M2-0051, M2-0052, M2-0053, M2-0054, M2-0055, M2-0056, M2-0057, M2-0058, M2-0059, M2-0060, M2-0061, M2-0062, M2-0063, M2-0064, M2-0065, M2-0066, M2-0067, M2-0068, M2-0069, M2-0070, M2-0071, M2-0072, M2-0073, M2-0074, M2-0075, M2-0076, M2-0077, M2-0078, M2-0079, M2-0080, M2-0081, M2-0082, M2-0083, M2-0084, M2-0085, M2-0086, M2-0087, M2-0088, M2-0089, M2-0090, M2-0091, M2-0092, M2-0093, M2-0094, M2-0095, M2-0096, M2-0097, M2-0098, M2-0099, M2-0100, M2-0101, M2-0102, M2-0103, M2-0104, M2-0105, M2-0106, M2-0107, M2-0108, M2-0109, M2-0110, M2-0111, M2-0112, M2-0113, M2-0114, M2-0115, M2-0116, M2-0117, M2-0118, M2-0119, M2-0120, M2-0121, M2-0122, M2-0123, M2-0124, M2-0125, M2-0126, M2-0127, M2-0128, M2-0129, M2-0130, M2-0131, M2-0132, M2-0133, M2-0134, M2-0135, M2-0136, M2-0137, M2-0138, M2-0139, M2-0140, M2-0141, M2-0142, M2-0143, M2-0144, M2-0145, M2-0146, M2-0147, M2-0148, M2-0149, M2-0150, M2-0151, M2-0152, M2-0153, M2-0154, M2-0155, M2-0156, M2-0157, M2-0158, M2-0159, M2-0160, M2-0161, M2-0162, M2-0163, M2-0164, M2-0165, M2-0166, M2-0167, M2-0168, M2-0169, M2-0170, M2-0171, M2-0178, M2-0187, M2-0188, M2-0189, M2-0190, M2-0191, M2-0192, M2-0193, M2-0194, M2-0195, M2-0196, M2-0197, M2-0198, M2-0199, M2-0200, M2-0201, M2-0202, M2-0203, M2-0204, M2-0205, M2-0206, M2-0207, M2-0208, M2-0209 | yes | TODO |
| [M2-0211](tickets/M2-0211.md) | Sign the frozen Windows candidate with the provisioned identity, verify signatures and timestamps, and re-run the Windows smoke on the signed bytes (split from M2-0173) | ci | sonnet | m10 | M2-0173, M2-0058 | yes | TODO |

## W9 (9 tickets)

| ID | Title | Type | Owner | Milestone | Deps | External blocker | Status |
|---|---|---|---|---|---|---|---|
| [M2-0176](tickets/M2-0176.md) | Prove the full meeting to knowledge to Dust to skill to portal journey (TASK-055) | investigation | sonnet | m12 | M2-0155, M2-0129, M2-0142, M2-0158, M2-0157 | yes | TODO |
| [M2-0177](tickets/M2-0177.md) | Execute the 12 golden flows and the full behaviour, abuse, accessibility and performance qualification on the frozen candidate | investigation | sonnet | m12 | M2-0170, M2-0176, M2-0173, M2-0208 | no | TODO |
| [M2-0179](tickets/M2-0179.md) | Capture authentic product footage from the frozen 2.0 candidate using synthetic meetings | video | opus | m11 | M2-0178, M2-0210, M2-0213 | no | TODO |
| [M2-0180](tickets/M2-0180.md) | Conform and render the 60-second hero film from verified captures with the BRAG/Hyperframes workflow | video | opus | m11 | M2-0179, M2-0213, M2-0173 | no | TODO |
| [M2-0181](tickets/M2-0181.md) | Re-edit the 30-second vertical and 20-second teaser cutdowns | video | opus | m11 | M2-0180 | no | TODO |
| [M2-0182](tickets/M2-0182.md) | Review every render frame by frame against LFAC-01..12 and hand off privacy-safe masters | video | opus | m11 | M2-0181 | yes | TODO |
| [M2-0183](tickets/M2-0183.md) | Deliver the final re-audit, the section 27 evidence linter run and the resumable handoff (TASK-066) | process | opus | m12 | M2-0177, M2-0182, M2-0023, M2-0185, M2-0172, M2-0174, M2-0175 | no | TODO |
| [M2-0184](tickets/M2-0184.md) | Obtain Opus final program validation and the owner's sign-off on the installed 2.0 build | external | opus | m12 | M2-0183 | yes | TODO |
| [M2-0185](tickets/M2-0185.md) | Run the pre-registered competitive and operational qualification against legitimate competitor trials (EXP-12) | investigation | sonnet | m12 | M2-0009, M2-0113, M2-0173 | yes | TODO |

