Worked for 10m 42s
ChatGPT said:
Métis 2.0 — independent engineering audit

Verdict: stabilize first, but do not close either owner-reported bug on the strength of these reports. B2 establishes credible lifecycle and retry-policy defects. B1 identifies worthwhile fixes, but overstates its central diagnosis and proposes an API that Electron does not document.

Audit boundary: this assessment is based on the brief, B1, and B2, supplemented by primary Electron, Node.js, Apple, and Microsoft sources. I have not executed Métis, inspected the raw dumps, or independently checked the repository. Métis file:line references below are those reported against 2bf21f1c; the supplied documents do not identify the bundled Electron/Chromium/Node versions. Current upstream behavior is therefore a cross-check, not proof of the installed binary’s behavior. 
B1-history-freeze

Severity denotes impact; confidence denotes evidential strength. A potentially catastrophic mechanism can still have low confidence.

1. Are the History-freeze root causes correct and complete?

Severity: P0 for the reported user-blocking failure. Confidence: high in the recovery gaps; medium-low that B1 has identified the dominant initiating cause.

B1’s central explanation is not established

The dirty-review navigation guard at src/renderer/src/App.tsx:915–921 is a credible suspect. However, the claim that window.confirm() has “nothing for the native dialog to attach to” does not follow from the app being frameless, transparent, or an accessory app. B1 provides a reproduction procedure, but no recorded run, thread sample, or dialog inspection establishing that mechanism. 
B1-history-freeze

More importantly, current Electron source explicitly obtains the owning BrowserWindow and passes it to dialog.showMessageBox(parent, options) for JavaScript dialogs. The report’s analogy to the previously unparented PDF dialog is therefore insufficient. An incorrectly positioned or inaccessible sheet remains possible, but it needs evidence from Métis’s shipped Electron version. Replacing confirm() with IPC to the same parented dialog API is not automatically a different native-window mechanism. 
GitHub

Two further corrections matter:

webContents.isResponsive() is not a documented Electron API. B1’s proposed contract test could enforce a nonexistent method. Use tracked responsiveness events and an application-level health protocol unless the exact bundled types prove a supported alternative. 
B1-history-freeze
 
Electron
A blocked dialog does not establish that unresponsive will fire. Current Electron’s native implementation filters that event using Chromium’s ignore state, visibility, and renderer initialization. A recovery design dependent solely on this event has incomplete coverage. 
GitHub
The two recovery defects are credible—but they are amplifiers

src/main/index.ts:2722–2726 only logs an unresponsive overlay. ensureWindow() at :3472–3482 treats “not destroyed” as sufficient, and second-instance at :8785–8797 treats “visible” as sufficient. Those are legitimate failure-containment defects. They do not establish what initially failed. 
B1-history-freeze
 
B1-history-freeze

Also, render-process-gone reason=killed followed by unresponsive five seconds later does not prove that a newly loaded renderer became stuck in confirm(). The sequence needs renderer PID, window generation, navigation, and deliberate-recovery correlation. Electron distinguishes killed, crashed, out-of-memory, and launch-failed outcomes; the modal theory does not explain the recorded process termination by itself. 
METIS-STATUS-BRIEF
 
Electron

Ranked alternatives that deserve investigation

These are ranked by diagnostic priority, not claimed prevalence.

Rank	Alternative	Severity / confidence	Concrete discriminator
1	The app is alive and responsive but never restores an interactive window. A parked overlay, stale click-through state, wrong bounds, missing focus, or draggable hit region can look like a freeze.	P1 / medium	During failure, record main and renderer heartbeats, expanded/parked state, bounds, focusability, and input delivery. Test the actual reveal path around index.ts:3472–3482,8785–8797.
2	History is waiting on cloud-backed storage, not a dead renderer. The six OneDrive failures are an actual environmental defect, not a hypothetical scalability concern.	P1 / medium	Separate click → guard → view mount → IPC → enumeration/stat/read → response → render timings. Repeat with the identical library fully local.
3	Crash recovery reloads an unusable packaged renderer. Wrong renderer URL, failed preload, missing assets, or failed initialization can leave a live native window with no usable application.	P0 / medium	At index.ts:2737–2783, require successful load and application-ready acknowledgement, with build identity and renderer generation.
4	Main-process blocking or starvation. Native synchronous dialogs or CPU-heavy callbacks can prevent tray/relaunch/recovery dispatch; stalled filesystem work can separately starve the worker pool.	P0 / low-medium	Sample main and renderer separately during failure. Do not infer main-thread health from “async filesystem APIs” alone.
5	React/application-state failure or IPC backlog. History may mount incorrectly, receive stale search results, retain a blocking overlay, or never clear loading state.	P1 / low-medium	Trace a navigation request through application commit, not just DOM readiness or a preload heartbeat.
6	GPU/compositor or memory-pressure failure. The transparent overlay may stop presenting correctly while JavaScript remains responsive.	P1 / low	Correlate GPU-process events, compositor traces, memory pressure, and native window state; perform a controlled visual-effects A/B test.

The first alternative has concrete platform mechanisms: Electron click-through windows can discard mouse input, and draggable regions suppress pointer events unless controls are excluded with app-region: no-drag. These are hypotheses to inspect, not findings that Métis currently misconfigures them. 
Electron
+1

For macOS, B1 also overgeneralizes relaunch delivery. Finder/Launch Services reopening and command-line second-instance handling are not interchangeable; activate is an important path. Fixing only second-instance is insufficient without testing how Tony actually reopens the application. 
Electron

Finally, B1 gets the storage reasoning partly wrong. await Promise.all(...) does not itself block the main JavaScript thread; synchronous decrypt/parse work after reads can. A per-file cache also does not imply that changing one file forces every unchanged file to be decrypted again. The uncapped work and full-library enumeration remain defects, but their mechanism must be described accurately. 
B1-history-freeze
 
Node.js

Evidence that would prove me wrong: a packaged-build trace consistently showing the dirty-review guard entering an inaccessible native dialog, sampled threads confirming the wait, and the failure disappearing under a narrowly controlled modal replacement while storage, activation, and resource conditions remain unchanged. That would justify promoting the modal explanation to high confidence.

2. Are the “very heavy on the PC” conclusions correct and complete?

Severity: P1; P0 if tied to meeting loss or machine-wide unusability. Confidence: high in the orphaning and retry defects; medium in their share of total impact; low for Windows-specific attribution.

B2’s strongest findings survive scrutiny

The reported orphaned llama-server processes and the cleanup paths at src/main/index.ts:9461–9518 support a genuine ownership defect. The retry logic at src/main/brain/ingest.ts:2373–2393,2580–2598 supports a genuine policy defect. These should be fixed regardless of whether they explain every symptom. 
B2-resource-heavy
 
B2-resource-heavy

But several conclusions are too strong:

“Every boot” is conditional. B2 itself says the resume path requires idx.backfillRequested. Approximately 20 ingest events in 200 ms establish an event burst, not 20 simultaneous inference operations. The 30–41-second time-to-answer also does not isolate model-loading time from queueing, prompt processing, or generation. Instrument those phases independently. 
B2-resource-heavy

A 3.3 GB GGUF is not a measured 3.3 GB incremental resident-memory charge. Loading mode, GPU offload, KV cache, projector allocation, and shared file-backed pages affect the footprint. Conversely, total memory can exceed the model file size substantially. The relevant controls exist in llama.cpp, but their configured values in this binary were not supplied. 
B2-resource-heavy
 
GitHub

“One persistent BrowserWindow” does not establish an efficient or resilient architecture. It counts native windows, not processes, retained buffers, timers, listeners, or coupled failure domains. Similarly, B2 supplies no measurement establishing that native vibrancy would outperform this particular CSS implementation. 
B2-resource-heavy

What the investigation is missing
Rank	Missing investigation	Severity / confidence	Required evidence
1	Combined ML resource contention: local LLM, ASR, speaker embedding, vision, and any wake detector running together.	P1 / medium hypothesis	Per-process CPU, private memory, GPU allocation, thread counts, model settings, and simultaneous workload traces. Test active meetings, not only idle.
2	Accumulation within one app session: duplicate watchers, repeated subscriptions, audio buffers, retained transcripts, and stale jobs after renderer recovery or device changes.	P1 / medium hypothesis	Repeat meeting/recovery/sleep cycles; graph live handles, listeners, worker generations, buffers, and retained memory after settling.
3	Storage and scheduler contention: OneDrive hydration attempts competing with ingest, consolidation, imports, and local persistence.	P1 / medium; storage failures observed	Actual in-flight operations, queue age, worker-pool pressure, read timeouts, retry counts, and disk activity by phase.
4	Rendering while “hidden”: an 8×2 parked window is not necessarily a suspended application.	P1 if measured / medium hypothesis	Compare expanded, parked, truly hidden, and reduced-motion states at realistic DPI/display configurations.
5	Windows-specific overhead: PowerShell polling, repeated helper launches, model-file scanning, GPU backend behavior, and enterprise endpoint controls.	P1 if measured / low	Packaged Windows traces on a representative managed laptop. No Windows measurements are supplied.

The rendering issue has a specific trap: with backgroundThrottling:false, Electron documents that page visibility can remain visible even when the window is hidden or occluded. A renderer that pauses work only on document.visibilityState === 'hidden' can therefore fail to pause. 
Electron

Do not exempt utilityProcess children from hard-kill tests. B2 correctly labels their stronger lifecycle behavior assumed, not verified. Nor does “per-command process” mean negligible cost: repeated short-lived launches can dominate startup, and unconsumed stdout/stderr can block a child on a full pipe. 
B2-resource-heavy
 
Node.js

The old six-second permission-denied capture loop should remain a regression test, not be presented as an open defect. However, fixing that path does not explain away the separate Failed to get sources rejection records. 
B2-resource-heavy
 
METIS-STATUS-BRIEF

Evidence that would prove me wrong: matched before/after profiles on the owner’s Mac and a representative Windows machine showing that supervision and retry-policy changes remove essentially all excess CPU, memory pressure, and startup contention, with no remaining accumulation or active-meeting regression.

3. Critique each proposed 1.9.7 fix

Overall severity: P0 for introducing unsafe recovery or process termination. Confidence: high in the design concerns; implementation-dependent in their applicability.

Fix 1 — Replace renderer-native dialogs

P1 preventive fix; high confidence in the direction, medium confidence that it fixes the reported freeze.

Use one asynchronous navigation-guard service, not nine independently rewritten conditionals. It must serialize competing navigation requests and preserve a clear contract: Save, Discard, or Cancel. Cancel must preserve the recap and current view.

An in-DOM modal must also force the overlay into an expanded, interactive state, trap keyboard focus, restore focus, and survive layout changes. Being in the DOM does not prevent clipping inside a parked window.

Use AST-aware linting plus behavioral tests; literal grep misses bare confirm(), aliases, and computed property access. B1’s inventory itself alternates between six/eight sites while enumerating nine locations—regenerate it from the code. 
B1-history-freeze

Crucially, do not implement B1’s test as “dirty recap → click History → automatically reach History within two seconds.” The correct behavior is to display the decision, preserve data while the user deliberates, and navigate only after the selected resolution. 
B1-history-freeze

Fix 2 — Recover after 8–10 seconds of unresponsiveness

P0 if implemented as unconditional reload; high confidence.

The missing prerequisite is durable draft recovery. Once the renderer is wedged, asking it to save is unreliable. Persist recap revisions continuously to a local, protected journal outside the OneDrive folder; distinguish “edited” from “durably saved.”

Require zero loss of acknowledged revisions. Define the maximum exposure for unacknowledged keystrokes explicitly.

Implement one generation-aware recovery controller:

starting → healthy → suspect → recovering → healthy / safe mode

It should coalesce repeated events, reject stale heartbeat responses, cancel obsolete timers, and prevent its own deliberate renderer termination from initiating a second recovery. An initial policy could allow two recovery attempts per ten minutes, then expose a minimal safe-mode surface with background inference disabled.

A plain loadURL() is not equivalent to replacing a stuck process. Electron documents forcefullyCrashRenderer() followed by reload as a recovery mechanism, while warning that shared renderer processes can affect other WebContents. Select the mechanism against the actual process topology. 
Electron

Do not label recovery successful at did-finish-load; require application initialization, restored draft state, and a successful interaction probe.

Also test capture ownership. A renderer restart must either preserve ongoing recording or produce an explicit, recoverable recording discontinuity. Neither report establishes that guarantee. For 2.0, recovery must never blindly replay previously authorized external actions.

Finally, a main-process timer cannot recover a blocked main event loop. The in-app emergency shortcut has the same limitation because its handler is also in that process. 
B2-resource-heavy

Fix 3 — Make relaunch consult responsiveness

P1; high confidence that the proposed API and routing need correction.

Replace the nonexistent method with maintained health state plus a bounded probe. Route macOS activation/reopen, actual second-instance launches, tray commands, and explicit shortcuts through a single reveal-or-recover controller.

A healthy reveal should restore the expanded layout, cancel pending re-parking, repair off-screen bounds, restore appropriate input behavior, and show the window. Explicit user reopening may justify focus; background activity should not steal it. showInactive() alone is not a complete reopening policy.

Test actual Finder/Spotlight and packaged Windows launch behavior—not only a mocked second-instance callback.

Fix 4 — PID registry and Windows Job Objects

P1 lifecycle fix; P0 if the reaper can kill an unrelated process. High confidence.

A registry is cleanup insurance, not parent-death supervision. Reaping on next launch leaves the machine burdened until the user returns.

Executable-path matching alone is insufficient: the same executable can legitimately run again under a reused PID. Record and verify owner and child PID plus OS process creation identity, installation/profile identity, and a per-session nonce where available. Electron’s process metrics explicitly document PID reuse; Windows exposes process creation time through GetProcessTimes. 
Electron
+1

Acquire the appropriate application lock before modifying the registry. Write it atomically. Treat unreadable, corrupt, or ambiguous entries as a diagnostic problem—not permission to kill. Account for the crash window between spawning and recording the child.

The existing orphaned processes predate the proposed registry; that migration needs separately attributable cleanup. Never sweep by generic names such as powershell, node, or llama-server.

Windows: use a private Job Object with JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE, but remember that it triggers when the last job handle closes, not when a vaguely defined “parent process handle” closes. Do not leak or inherit a retaining job handle into children. 
Microsoft Learn

Prefer creation-time assignment using PROC_THREAD_ATTRIBUTE_JOB_LIST on supported systems. A create-suspended → assign → resume sequence prevents the child executing before assignment, but still requires handling parent death between creation and assignment. Test nested-job constraints, assignment failures, and descendants attempting to break away. 
Microsoft Learn
+1

macOS: add a small native guardian or equivalent ownership mechanism using a lifetime pipe or kqueue process-exit observation. A guardian can terminate its owned process group when the application dies; simply creating a process group does not propagate parent death. Ensure descendants cannot retain the pipe’s writer and suppress EOF. This is a design to validate, not a kernel guarantee equivalent to Windows Jobs. 
Apple Developer
+1

Run hard-kill tests against actual helpers, descendants, and utilityProcess hosts. Verify exit and released resources, not merely a successful .kill() call.

Fix 5 — Preserve exhaustion and load local models lazily

P1; high confidence.

Separate scheduling reason from retry permission:

Automatic resume may continue genuinely interrupted eligible work.
Automatic maintenance must respect backoff and exhaustion.
Explicit Retry may reset selected exhausted work.

Apply this policy to all callers, not just boot. B2’s own cited comment also names the dashboard-open path as non-backoff-respecting. Fixing boot while dashboard opening revives exhausted work leaves the policy defect intact. 
B2-resource-heavy

Make model startup single-flight across backfill, reconciliation, consolidation, and interactive requests. Persist job identities and completion state so a crash after completion but before acknowledgement does not duplicate extraction or downstream writes.

“Lazy” also needs resource ownership: one model runtime per intended configuration, bounded concurrency, an idle unload policy, and no silent cloud-to-local fallback merely because a network request failed.

Classify unavailable OneDrive content separately from permanently invalid input. Repeated storage failures should not consume the same budget as six genuine extraction attempts.

Fix 6 — Cap reads and add timeouts

P1; high confidence.

A per-call limit is insufficient if every search keystroke creates another limited pool. Use global admission control, shared in-flight reads, bounded queues, cancellation of obsolete searches, and short-lived failure caching.

A timeout is not cancellation. Promise.race() only stops waiting, and Node documents that aborting readFile does not abort individual OS requests. Releasing a concurrency permit while the underlying read remains stuck can create an unbounded pile of “timed-out” operations. 
nodejs.org

Reserve capacity for local draft persistence; cloud reads must not occupy every available filesystem worker. Isolating provider-dependent reads in a supervised utility process is worth considering where true isolation is needed.

History should display local/cached metadata and unavailable rows without requiring all cloud content to hydrate. Opening online-only files can trigger downloading, so a directory listing should not silently become a bulk-content download operation. 
Microsoft Support

For 2.0, keep the incremental index on local application storage, preserve the source files, and implement reconciliation for external edits, deletions, and availability changes. An unavailable source is not a deleted meeting.

Fix 7 — Enforce resource budgets

P1 release gate; high confidence in the need, low confidence in feasibility until measured.

The brief specifies Mac/Windows idle RSS budgets, while B2 labels the Mac budget “native Mac” and says helpers/GPU are counted separately. Those descriptions do not yet form a reproducible accounting contract for an Electron application. 
METIS-STATUS-BRIEF
 
B2-resource-heavy

Keep the requested targets, but define process scope, measurement API, model state, wake-detector state, hardware, power mode, and sampling window. Publish component breakdowns and the total.

Electron specifically cautions that macOS memory compression makes resident-set interpretation problematic. Preserve the requested RSS series, but supplement it with private/footprint and system-pressure measures rather than silently substituting a more favorable metric. 
Electron

Evidence that would prove these concerns wrong: implementation-level proof that the proposed patch already provides durable revisions, generation-safe recovery, complete activation routing, identity-safe supervision, globally bounded storage work, and reproducible budget accounting—followed by the fault tests in question 6.

4. Is stabilization before refactoring the right order?

Severity: P1 program risk. Confidence: high on sequencing; low on the November forecast without the dependency map.

Yes—before broad refactoring, not before every small structural change. Extracting a narrowly scoped recovery controller or sidecar supervisor to implement a safe fix is appropriate. Reorganizing thousands of lines first is not.

The current proposal serializes extensive review, planning, stabilization, foundation refactoring, and feature waves. With 65 calendar days from September 26 to November 30, that creates a substantial integration tail. The brief also reports 20 open, often overlapping PRs and an earlier attempt with 29 blockers. 
METIS-STATUS-BRIEF

I would replace that sequence with this gate-based plan:

Period	Primary objective	Exit condition
September 26–October 2	Baseline evidence, narrow stabilization, and external-access requests in parallel.	Packaged candidate passes core failure tests; remaining risks explicitly dispositioned.
October 3–16	Extract only boundaries required by the next integrated feature slices.	Working packaged paths through capture, persistence, recovery, and selected 2.0 capabilities.
October 17–November 13	Deliver feature slices behind controlled flags.	Each accepted requirement has merged code and evidence from the integrated build.
November 14–23	Feature freeze, compatibility, migration, recovery, and soak testing.	No release-blocking defects; rollback and blocked-capability behavior verified.
November 24–30	Owner acceptance, permitted distribution validation, documentation, and launch film.	Demonstrated behavior matches the release and its readiness claims.

This is a proposed schedule, not a forecast that all work fits.

Build the dependency graph from the actual r11 and v6 kits immediately; those kits were not supplied here, so their completeness, overlap, and critical path cannot be audited from task counts alone. Start Entra/Teams, Dust, Jev/Laya, privacy, and Windows-signing unblocks now—not after implementation. 
METIS-STATUS-BRIEF

Retain the brief’s distinction for externally blocked work, but use two statuses: engineering validation complete and real-environment validation blocked. A connector awaiting its real account cannot be called end-to-end validated.

Evidence that would prove me wrong: a dependency-resolved plan with measured integrated throughput, early resolution of external prerequisites, and enough reserved acceptance time demonstrating that the original serial program is genuinely faster and safer.

5. What is the single biggest program risk?

Severity: P0 for release readiness. Confidence: high.

False closure: treating persuasive review documents and passing local tests as proof that the packaged product works.

The most revealing example is B1’s confident recommendation for webContents.isResponsive(). Additional reviewers or a grep-based contract could repeat and formalize that error rather than catch it. Meanwhile, B2 expressly says it did not profile the packaged GUI and cannot confirm the resource-budget violation. 
B1-history-freeze
 
B2-resource-heavy

This week, establish one immutable release evidence record linking:

requirement or defect → reproduction → commit → packaged artifact hash → environment → executed test → result → reviewer

A single release owner should reject closure lacking that chain. Separate implemented, unit-tested, packaged-tested, and validated on the affected environment.

The first two entries should be the owner’s actual bugs, reproduced on the same build that is then patched. A renderer-recovery success event must include restored application state; a resource-fix claim must include the complete attributable process population.

The brief establishes branch verification and tag-triggered release behavior, but not this packaged-evidence chain. 
METIS-STATUS-BRIEF

Evidence that would prove me wrong: an existing, functioning acceptance system in which every closed item already has reproducible packaged-build evidence, independent execution, and explicit unresolved-environment status—and recent defects demonstrate that this system catches false positives.

6. What measurements and tests are required before calling the bugs fixed?

Severity: P0 acceptance gate. Confidence: high in the required coverage; numerical thresholds below are proposed acceptance targets, not observed results.

Common test conditions

Use the installed 1.9.6 artifact as a baseline and an immutable candidate as the comparison. Record commit, artifact hash, Electron/Chromium/Node versions, helper versions, OS, hardware, display arrangement, power state, permissions, provider settings, and storage availability.

Run both upgrades with existing user data and clean-profile installs. A development-server success does not close a packaged-application defect.

History: required acceptance evidence
Test	Required outcome
Clean and dirty recap navigation across every entry point	Decision UI appears promptly; Save/Discard/Cancel behave correctly; Cancel preserves edits. Leaving the decision open for 30 seconds must not trigger destructive recovery.
Repeated navigation/reopening	At least 100 mixed sequences per target OS across relevant layouts, with zero unrecoverable failures. Include actual macOS reopen and Windows executable/shortcut paths.
OneDrive/local fixture matrix	The 59-file shape, six unavailable files, slow hydration, provider offline, malformed content, and a large synthetic library all produce usable or explicitly degraded results—not indefinite loading.
Latency	Proposed p95: input acknowledgement ≤100 ms; cached History content ≤300 ms; usable degraded view ≤2 seconds when sources fail. Measure navigation after the user’s decision, not before it.
Main-process responsiveness	Proposed search/list workload target: p99 event-loop delay <50 ms, with no unexplained >250 ms stalls. Record synchronous CPU work separately from filesystem wait.
Fault injection	Test renderer busy-loop, renderer termination, failed preload/load, main-process stall, and unavailable storage. Each follows a documented recovery/degraded path without repeated restart loops.
Recovery safety	Restore every acknowledged recap revision. Verify ongoing recording behavior and absence of duplicated capture or agent actions.
Visibility/input matrix	Sleep/wake, lock/unlock, monitor unplug, DPI changes, fullscreen/Spaces or virtual desktops, and parked/expanded transitions remain recoverable through an explicit reveal action.

Correlate the History click with a request ID through every stage. During a freeze, collect native thread samples or dumps from both main and renderer before resetting the state. Add renderer generation and deliberate-recovery markers so the existing killed → unresponsive sequence becomes interpretable.

Resource usage: required acceptance evidence

Hard-kill supervision: run at least 20 cycles per target OS with each actual sidecar active. Kill only the Electron main process—not a whole process tree that hides the defect. Verify owned sidecars and descendants exit within a defined bound, proposed at five seconds, without relaunching Métis. Then verify relaunch does not duplicate runtimes.

Test termination during model startup, registry writing, job assignment, active inference, and import. Exercise malformed manifests, PID-reuse fixtures, generic-binary collisions, and supervision failures. Prove unrelated processes survive.

Startup retry behavior: seed eligible, backed-off, exhausted, unavailable-source, and completed-but-unacknowledged jobs. Relaunch repeatedly. Exhausted jobs stay exhausted; completed work is not duplicated; automatic startup does not load local models contrary to policy.

CPU: measure the complete attributable population over five minutes using CPU-time deltas:

one-core CPU %
=
100
×
∑
Δ
(
user CPU seconds
+
system CPU seconds
)
Δ
wall seconds
one-core CPU %=100×
Δwall seconds
∑Δ(user CPU seconds+system CPU seconds)
	​


The requested 1% budget permits at most three CPU-seconds across the entire population over 300 seconds. Include the wake detector and measurement overhead; do not normalize by total machine core count.

Memory and longevity: report requested RSS budgets alongside platform-appropriate private-memory and pressure measures. Include Electron helpers and owned sidecars, while identifying shared-memory accounting limitations. Measure cold start, settled idle, first inference, active transcription, post-meeting settling, and post-recovery—not just a favorable idle snapshot. Windows exposes working-set and other memory counters suitable for this breakdown. 
Microsoft Learn

Require an eight-hour idle run and at least one hour of representative meeting activity, including a simultaneous History interaction. After repeated cycles, retained resources should reach a stable plateau; no unbounded growth in processes, handles, buffers, or jobs.

Rendering and permissions: compare parked versus truly hidden states, normal versus reduced motion, and permission granted versus denied. Preserve the fixed capture-permission gate as a regression case. Do not solve resource usage by disabling recording functionality or enterprise protection controls.

Evidence that would prove me wrong: a smaller test set backed by existing production telemetry and demonstrated fault coverage that establishes the same properties. Unit tests, a single clean launch, or “no crash log appeared” would not suffice.

7. Where do we stand, as an outside auditor?

Severity: P1 overall readiness risk, with unresolved P0 failure paths. Confidence: medium because the evidence is report-based. Métis appears to be a substantial implemented product with real lifecycle and retry-policy defects, but neither owner-reported symptom has yet been closed by reproducible packaged-build evidence. B2 offers credible first fixes; B1’s initiating-cause confidence is overstated, its responsiveness API recommendation is unsupported, and both reports leave important recovery and platform behavior unverified. Stabilization before broad refactoring is correct, provided the patch protects drafts, verifies process ownership, and demonstrates recovery rather than merely requesting reloads. November 30 remains a target, not an evidence-backed delivery forecast, given the reported feature scope, overlapping PRs, and external blockers. A reproducible, cross-platform candidate passing the gates above—plus a dependency-resolved plan with real integrated throughput—would overturn that assessment. 
METIS-STATUS-BRIEF
 
METIS-STATUS-BRIEF

Ranked top-10 actions for this week

Execution window: September 26–October 2, 2026. These are ranked by risk reduction; independent work can proceed in parallel.

Rank	Priority	Action	Evidence required by week’s end
1	P0	Establish a frozen baseline and capture the owner’s failure. Instrument History navigation, renderer generations, activation, readiness, and complete process ownership.	An attributable failure trace—or a documented unsuccessful reproduction matrix—not another unsupported causal narrative.
2	P0	Make recap recovery durable before enabling automatic renderer resets. Define capture continuity and acknowledged-save semantics.	Fault-injection results proving acknowledged edits survive and recording behavior is explicit.
3	P1	Stop automatic exhaustion resets and unintended startup inference. Audit boot, dashboard, reconciliation, and consolidation callers.	Repeated-launch tests with exhausted fixtures; no unauthorized local-model start or duplicate completed work.
4	P1 / P0 safety	Implement actual sidecar ownership. Windows creation-time Job assignment where supported; validated macOS parent-death supervision; identity-safe registry fallback.	Kill-main-without-relaunch tests, including descendants, startup races, and unrelated-process survival.
5	P1	Replace native renderer dialogs through one asynchronous guard. Correct the inventory and test all decision outcomes.	Packaged navigation tests proving Cancel preserves data and every supported History entry point remains usable.
6	P0	Implement one bounded, generation-aware reveal/recovery controller. Remove the unsupported API assumption and cover real activation paths.	Busy-loop, renderer-death, startup-failure, and reopen tests; safe-mode fallback; no reload storm.
7	P1	Bound storage work globally and make cloud failures nonblocking for History. Protect local draft writes from provider stalls.	Unavailable/slow-source tests showing usable degraded results and bounded actual in-flight work.
8	P1	Profile the packaged candidate on Mac and Windows. Include active meetings, wake detection, parked rendering, and repeated recovery.	Before/after CPU, memory, GPU, queue, and process-lifetime evidence with an explicit accounting boundary.
9	P1	Retire integration uncertainty. Triage overlapping PRs, assign boundary owners, map actual kit dependencies, and start every external unblock.	One dependency-backed release plan; each requirement tied to evidence or a named blocker and exact unblock step.
10	P0 release gate	Run the 1.9.7 acceptance gate and release only the tested artifact. Keep migrations, rollback, and blocked capabilities explicit.	Artifact hashes, packaged test results, owner-machine verification, and an accurate residual-risk decision—not a blanket “both bugs fixed.”
ChatGPT can make mistakes. Check important info.
Latest response




Pro