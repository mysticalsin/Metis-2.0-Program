# L01 — Main Process Lifecycle Audit (Métis / asktoto, v1.9.6, origin/main @ 2bf21f1c)

Reviewer scope: `src/main/index.ts` (9,518 lines, read in full), `boot-sentinel.ts`, `renderer-readiness.ts`,
`overlay-workspace-pinning.ts`, `onboarding-exit-fallback.ts`, `updater.ts`, `logger.ts`, `metrics.ts`, plus the
minimum adjacent reads needed to close out a lifecycle claim with evidence: `llm/local-runtime.ts`,
`llm/fm-runtime.ts`, `screen-preprocess.ts`, `mac-helper.ts`, `ffmpeg-decoder.ts`. Read-only; no repo state changed.

Method: Addy/Stark five-axis review (correctness, readability, architecture, security, performance, +
reliability/testability where relevant), SAE brownfield-discovery discipline (evidence labels, vertical-slice
tracing of real exit/crash paths rather than a file-by-file skim), SAE domain-boundary discipline for the
decomposition map. Evidence labels used throughout: **OBSERVED** (seen directly in code/logs), **DERIVED**
(reasoned from OBSERVED facts), **ASSUMED**, **UNKNOWN**.

---

## 0. Executive summary

Both of Tony's bug reports trace to concrete, evidenced gaps in this lane, not to bad luck:

1. **"When I click on History sometimes it just doesn't open the app again; it's running but it freezes or
   crashes."** → The single-instance-lock model (`index.ts:8785-8797`) has no liveness check: a **wedged but
   not-exited** first instance keeps the OS-level lock forever, so a second launch's `app.requestSingleInstanceLock()`
   correctly fails and the second process just calls `app.quit()` on itself — nothing ever reaches the frozen
   instance, because Electron's `second-instance` delivery itself needs the *first* process's JS event loop to be
   free, which is exactly what's stuck. Separately, the overlay renderer's own `'unresponsive'` handler
   (`index.ts:2722-2726`) never attempts recovery — it only logs. The only escape hatch is an undiscoverable global
   shortcut (Cmd+Option+Esc, `forceQuitMétis`, `index.ts:4195-4224`) that itself depends on the *main* process
   still running JS, and is not surfaced anywhere in the UI. **P0.**

2. **"It's very heavy on the PC"** + the orphaned `llama-server` processes (E2). → Sidecar cleanup
   (`localRuntime.stop()`, `fmRuntime.stop()`, `screenPreprocess.stop()`) is 100% JS-event-driven, wired only into
   `will-quit` (`index.ts:9461-9518`) and the app's own emergency-force-quit path (`index.ts:4169-4193`). **Neither
   fires on an external `SIGKILL`** (Activity Monitor "Force Quit", `kill -9`, an OS/AV watchdog killing a hung
   process) **nor on a native crash that bypasses the JS event loop**, and there is **no boot-time reaping** of a
   stray sidecar left by a previous run. Given E3 (8 `app.started` events in one day with zero clean-shutdown
   events between them — i.e., repeated force-quit/crash/relaunch), this is not a hypothetical: it is the
   confirmed, everyday mechanism that produces exactly the orphaned, RAM-holding `llama-server` processes E2
   observed. A third, previously unflagged instance of the same pattern exists for the audio-import ffmpeg
   decoder (`ffmpeg-decoder.ts`) — see Finding 2. **P0.**

`registerIpc()` — one 4,147-line function (`index.ts:4624-8771`) holding ~160 `ipcMain.handle` + 4 `ipcMain.on`
registrations across a dozen unrelated domains — is the concrete #1 refactor target, and `index.ts` as a whole
(9,518 lines, 142 top-level imports touching 15+ subsystems) is the textbook "God module" the brownfield-discovery
method warns about. A full decomposition map is in §4.

Positive findings, stated up front so they aren't lost under the P0s: webPreferences on the main window are
correctly hardened (`sandbox:true, contextIsolation:true, nodeIntegration:false, webSecurity:true`,
`index.ts:2609-2617`); IPC sender validation is **near-total** — 161/163 handlers gate on `assertMainWindow` /
`assertBrainReader` / `assertDecoderSender` / `isDecoderSender` etc. within their first lines, the two apparent
exceptions actually gate via `isDecoderSender` one line later (false positive in my own sweep, verified by hand);
`boot-sentinel.ts` (the MQA-175 native-crash detector) is a small, dependency-free, well-reasoned module with no
findings; the historical background-screen-capture retry loop (E5) appears **already fixed** at HEAD (§5.2).

---

## 1. Lifecycle map as it actually runs (vertical slice, boot → quit)

- **Registration guard** (`index.ts:8783-8797`): `protocol.registerSchemesAsPrivileged` → `app.requestSingleInstanceLock()`.
  Failure path is a bare `app.quit()` with no message to the user (no dialog, no stderr message a packaged GUI
  app's user would ever see). Success path registers `second-instance` then chains `app.whenReady().then(...)`.
- **`second-instance`** (`index.ts:8788-8797`): calls `ensureWindow()` (self-heals a null `win` from a
  boot-time `createWindow()` throw) then `showInactive()`. Depends entirely on the *existing* process's event
  loop being free to run this callback — see Finding 1.
- **`whenReady` boot sequence** (`index.ts:8798-9433`, ~635 lines in one closure): exclusive-onboarding fast path →
  `installProxyAwareFetch` → egress guard → CLI prewarm → embedded-key seeding → env→settings promotion → local
  model provisioning (fire-and-forget + a 4s-delayed re-check) → Windows AUMID/cwd hardening → login-item
  reconciliation → dock icon (dev only) → crash-log pruning → **`beginBootWatch`** (MQA-175 native-crash sentinel)
  → `uncaughtException`/`unhandledRejection` wiring → self-test escape hatch → orphaned-temp-file sweep →
  orphaned-draft recovery → retention sweep (+ 6h interval) → `runStep`-wrapped: display-media handler,
  permission handlers, `asr-model://` protocol, Dust keep-warm (+ 10 min interval), license heartbeat (+ 12h
  interval), graph-purge, **`createTray` → `registerShortcuts` → `registerIpc` → `createWindow`** (this exact
  order is load-bearing and commented as such — IPC must exist before `loadURL` can race it) → boot-watch clear
  fan-out (`registerIpc` step, `createWindow` step, `setImmediate`, `unlock-screen`, and a 15s MQA-175 timer that
  also runs brain consolidation) → `app.on('activate', ...)`.
- **Quit paths, enumerated:**
  - `window-all-closed` (`index.ts:9435-9437`): deliberate no-op — overlay app, tray-owned lifetime. Correct for
    the product shape.
  - `before-quit` (`index.ts:9449-9459`): if a meeting is recording (`recordingPowerSaveBlockerId !== null`) and
    the renderer hasn't already flushed (`quitFlushDone`), `preventDefault()`, ask the renderer to `reset`
    (which saves), then unconditionally `app.quit()` again after a **fixed 2s** timeout regardless of whether the
    save actually finished. This is a reasonable, bounded best-effort — but it is exactly the scenario that
    matters most (a live meeting) and gives no way to know from the audit trail whether the 2s was enough on a
    slow disk. Not a P0 on its own; flagged for the transcript/brain lane to correlate against `transcript.saved`
    timing.
  - `will-quit` (`index.ts:9461-9518`): clears `notifTimer`, drains `backgroundTimers`, then in strict, individually
    try/caught order: `screenPreprocess.stop()` → `localRuntime.stop()` (SIGKILL the llama-server sidecar) →
    `fmRuntime.stop()` (SIGKILL the Apple fm-serve sidecar). **Ffmpeg import-decoder children are not in this
    list — Finding 2.**
  - `forceQuitMétis()` / `stopSidecarsForHardExit()` (`index.ts:4164-4212`): the user-facing "nuclear option"
    behind the Cmd+Option+Esc shortcut. First press does a graceful `app.quit()` with a 4s watchdog; second
    press (or watchdog timeout) repeats the **same three-sidecar kill list** via `app.exit(0)`, which never fires
    `will-quit`. Comment at `4164-4168` explicitly documents this is a deliberate copy, not a shared helper,
    because tests pin the exact call sequence in each location — a real duplication-of-critical-logic smell, see
    Finding 6.
  - **What is not covered at all:** an external `SIGKILL`/Force Quit/Task Manager kill, a native crash that
    unwinds past V8 (the exact MQA-175 class `boot-sentinel.ts` exists to detect on the *next* boot, but which
    still leaves *this* boot's children behind), and any OS reboot/logout race that kills the process before
    `will-quit` completes its synchronous body.

---

## 2. Findings

### Finding 1 — P0 — Correctness/Reliability — Single-instance lock has no liveness check; a wedged instance permanently swallows relaunches

- **File:** `src/main/index.ts:8785-8797`
- **Evidence (OBSERVED):**
  ```
  8785  if (!app.requestSingleInstanceLock()) {
  8786    app.quit()
  8787  } else {
  8788    app.on('second-instance', () => {
  8789      const w = ensureWindow()
  8790      if (!w) return
  8791      if (!w.isVisible()) w.showInactive()
  8792    })
  ```
- **Reasoning (DERIVED):** Electron's single-instance lock is a pure OS-process-existence check (a lock
  file/socket the OS itself arbitrates) — it has no concept of "is the lock holder's JS event loop actually
  responsive". `second-instance` is delivered as an IPC message that the *lock-holding* process's own main thread
  must dequeue and run; if that thread is wedged (an infinite loop, a deadlocked synchronous native call, a
  blocked promise chain), the message is queued forever and the callback above never executes. Meanwhile the
  *second* launch, having failed to acquire the lock, takes the `app.quit()` branch at line 8786 with **zero
  user-facing feedback** — no dialog, no notification, nothing. From the user's point of view: they click the
  dock icon / launch icon, nothing visibly happens, and the existing (frozen) window is still there. This is
  Tony's bug report #2 verbatim, and E9 (`SingletonLock` present) is consistent with it.
- **Failure scenario:** Main process enters a synchronous stall (e.g., a slow/blocked sync IPC handler,
  `readEvalMetrics`'s full-file sync read under load — Finding 3 — or any of the ~160 handler bodies doing
  unbounded synchronous work) exactly while History (or anything else) is clicked. The renderer's own
  `'unresponsive'` handler may or may not fire (it only fires for *renderer* stalls, not main-process stalls —
  see Finding 1b). User relaunches from the dock/Start Menu → silently no-ops. User has no visible signal that
  anything happened, and no in-UI guidance toward the one working escape hatch (Cmd+Option+Esc).
- **Fix direction:** This is an architectural gap Electron itself does not solve for you. A realistic fix is a
  **liveness heartbeat**: the lock-holder periodically writes a timestamp (or answers a ping over the existing
  IPC channel) the *next launch* can check with a bounded timeout before deciding "the holder is alive, just
  defer to it" vs. "the holder is unresponsive — kill it and take over." A second-instance launch that gets no
  heartbeat response within e.g. 2-3s should be allowed to (a) tell the user plainly ("Métis appears to be stuck
  — restarting it…"), (b) `taskkill`/`SIGKILL` the stale PID (recorded in the boot-sentinel-style sentinel file
  or the lock file itself), and (c) proceed to boot normally, which also lets boot-sentinel's own recovery path
  do its job. This is a real design decision (killing another live process is not free), so it belongs in a
  planning pass with product sign-off on the timeout/UX, not a one-line patch.

### Finding 1b — P0 — Reliability — `'unresponsive'` renderer state has no recovery path, only a log line

- **File:** `src/main/index.ts:2719-2730`, `4153-4224`
- **Evidence (OBSERVED):**
  ```
  2719  // A renderer that is wedged (event loop stuck) never fires render-process-gone below, so the island can
  2720  // sit blank with no trace in any log. Record it, and record the recovery. No automatic reload: ...
  2722  win.on('unresponsive', () => {
  2723    if (win !== self) return
  2724    mainLog.warn('[renderer-unresponsive] overlay renderer stopped responding')
  2725    auditLog('app.unresponsive', { kind: 'overlay' })
  2726  })
  ```
  and, separately:
  ```
  4153  // itself is unresponsive, macOS's native Option+Command+Escape remains the recovery path.
  ```
- **Reasoning:** The developers are aware of this gap (the comments say so directly) and built the emergency
  global shortcut as the mitigation. But: (1) that shortcut is never surfaced in the UI — there is no toast, no
  tray-menu hint, nothing that tells a stuck user it exists; (2) it is macOS-only (`registerEmergencyForceQuitShortcut`,
  `index.ts:4214-4224`, gated on `process.platform !== 'darwin'` → `return false`) — **Windows has no equivalent
  escape hatch at all**, and E1/E6 show this is a cross-platform product; (3) even on macOS, a `globalShortcut`
  callback still has to run on the *main* process's event loop — if the hang is in main (not just the renderer),
  this shortcut is unreliable too, and the user is left with only the OS-level Force Quit, which produces
  Finding 2's orphaned sidecar.
- **Failure scenario:** E6's own sequence — `render-process-gone reason=killed exitCode=15` followed 5s later by
  `app.unresponsive kind=overlay` — is consistent with the reload-after-crash path (`index.ts:2737-2783`) itself
  producing a renderer that then hangs, with no escalation beyond another log line.
- **Fix direction:** At minimum, after N consecutive `unresponsive` events (or one `unresponsive` lasting past a
  bounded grace period), destroy and recreate the `BrowserWindow` (the codebase already has the exact recreation
  logic for the crash-recovery path at `2737-2783` — reuse it) rather than only logging. Surface the escape hatch
  in the UI (tray menu item "Métis is unresponsive — force restart", shown conditionally once `app.unresponsive`
  fires) and add a Windows-equivalent recovery affordance (the accelerator gate at `4215` currently returns
  `false` unconditionally off darwin with no substitute).

### Finding 2 — P0 — Reliability/Performance — Child-process cleanup is JS-event-only; no OS-level safety net, no boot-time reaping, and one whole sidecar class (ffmpeg import decoder) is missing from even the JS-level list

- **Files:** `src/main/index.ts:4164-4212` (`stopSidecarsForHardExit`, `forceQuitMétis`), `9461-9518` (`will-quit`),
  `src/main/llm/local-runtime.ts:342-491, 625-639` (`spawn`/`stop`), `src/main/llm/fm-runtime.ts` (same pattern,
  confirmed via grep: `spawn` at 174/285, `kill('SIGKILL')` at 187/320/373), `src/main/ffmpeg-decoder.ts:37,57,110,192`
  (`spawn`, `kill('SIGTERM')`).
- **Evidence (OBSERVED) — the covered sidecars:**
  ```
  9504  // Kill the llama-server sidecar synchronously (SIGKILL, F3 hardening) — without this an on-device
  9505  // suggest/summary/vision sidecar could outlive the app the user just quit.
  9506  try {
  9507    localRuntime.stop()
  ...
  9511  // Same F3 contract for the Apple fm-serve sidecar (macOS 27+ text engine) ...
  9513  try {
  9514    fmRuntime.stop()
  ```
  Both `will-quit` and `stopSidecarsForHardExit` (the copy used by the emergency-quit / watchdog-exit path) cover
  exactly these two sidecars plus `screenPreprocess.stop()` (which stops a *watcher*, not a spawned process, on
  Windows; harmless on mac).
- **Evidence (OBSERVED) — the uncovered sidecar:** `ffmpeg-decoder.ts` spawns a real ffmpeg child process
  (`spawn(` at lines 37 and 110) for the audio-import decode path (`index.ts:1408`, `startFfmpegDecode`). Its own
  `cancel()` (`kill('SIGTERM')` at lines 57/192) is only ever invoked from `closeImportDecoder()`
  (`index.ts:1317-1354`), which is called from job-completion/error paths and from explicit IPC (`8384-8405`) —
  **never** from `will-quit` or `stopSidecarsForHardExit`. Grepping both quit-path function bodies for
  `ffmpegDecoders`/`decoderWin` returns nothing.
  ```
  1408  const decoder = startFfmpegDecode(ffmpeg, job.sourcePath, skipThrough, { ... })
  1432  ffmpegDecoders.set(job.jobId, decoder)
  ```
- **Reasoning (DERIVED — the architectural root cause behind E2):** `child_process.spawn()` on both macOS and
  Windows does **not** die when its parent dies unless something explicitly arranges that (a process group +
  group-kill, a Windows Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, or an OS-level supervisor). Nothing
  in this codebase does that — every kill is a JS-level `child.kill('SIGKILL'/'SIGTERM')` triggered by an
  Electron lifecycle *event*. Every one of those events (`will-quit`, `before-quit`, the emergency-quit path)
  requires the main process's JS event loop to run to completion. None of them fire when: (a) the user or the OS
  sends `SIGKILL` directly to the Metis process (Activity Monitor "Force Quit", Task Manager "End task", `kill
  -9`), (b) the main process suffers a native crash that unwinds past V8 (exactly the class `boot-sentinel.ts`'s
  own doc comment describes for MQA-175 — "the process simply vanishes: no window, no dialog, no crash-*.log, no
  app.crash audit line"), or (c) the OS terminates a genuinely deadlocked process from outside. Given E3 shows 8
  `app.started` events in a single day with **no clean-shutdown events between them**, this is not a rare edge
  case for this install — it is the dominant real-world exit pattern that day, and it is the precise, complete
  explanation for E2's two orphaned `llama-server` processes (ppid=1, alive far longer than the current main
  process's own uptime: the previous Metis processes died by exactly one of the three uncovered paths above,
  each time leaving its `llama-server` behind). There is also **no boot-time reconciliation**: nothing at launch
  scans for a stray `llama-server`/`fm-serve` process from a previous run and reaps it (`grep -rn "orphan"` across
  `index.ts`/`local-runtime.ts`/`fm-runtime.ts` finds only the comments *about* this risk, never a scan/kill).
  `local-runtime.ts`'s own `maybeAutoRestart` restart-budget logic (`493-509`) only governs a crash *within* the
  current process's session; it has no bearing on a sidecar orphaned by a *previous* process.
- **Failure scenario:** Any Force Quit, crash, or OS-level kill during a normal session → the 3.3GB qwen GGUF
  `llama-server` process (and/or the fm-serve loopback server, and/or, newly identified here, an in-flight
  ffmpeg decode) keeps running indefinitely, holding RAM/CPU, until the machine reboots or the user manually
  finds and kills it in Activity Monitor. Repeat this across "8 force-quit/relaunch cycles in one day" (E3) and
  you get exactly E2's observed state — this directly substantiates Tony's "it's very heavy on the PC" report:
  it is not (only) that Metis itself is heavy, it is that **dead Metis processes' sidecars keep running forever**
  and accumulate across restarts.
- **Fix direction:** Two layers, both real work, not a one-liner:
  1. **OS-level containment** (removes the dependency on any JS event firing at all): on macOS, put each spawned
     sidecar in its own process group (`detached: true` + `proc.unref()` is the *wrong* direction — that would
     make orphaning worse; instead use `setpgid`-equivalent + track the pgid, or simpler, wrap sidecar launch so
     that killing the *main* process's process group also delivers to children — macOS has no `PR_SET_PDEATHSIG`,
     but a lightweight supervisor pattern (spawn a tiny always-alive watchdog that polls `process.ppid` and
     self-kills + kills its sibling when the parent PID changes/dies) is a well-known, cheap answer for exactly
     this gap. On Windows, assign each sidecar to a Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` — this
     is the textbook fix and Windows supports it natively.
  2. **Boot-time reaping** (catches whatever layer 1 misses, and is a much smaller change to ship first): on
     every launch, before starting a new `llama-server`/`fm-serve`, check for and kill any process matching the
     known sidecar binary path that isn't this session's own child (e.g., record the PID + a session nonce
     alongside `local-runtime.ts`'s existing port-line file, and reap anything stale at `beginBootWatch()` time,
     right next to the existing MQA-175 sentinel). This is a self-contained, testable, low-risk change that
     directly targets E2 and should ship first.
  3. Add `closeImportDecoder`-equivalent cleanup (or a blunt `ffmpegDecoders.forEach(d => d.cancel())`) into
     both `will-quit` and `stopSidecarsForHardExit` — a small, immediate, low-risk fix for the ffmpeg gap
     specifically.

### Finding 3 — P1 — Performance — Synchronous full-file read+parse of the audit log on the main thread, on every metrics fetch

- **File:** `src/main/metrics.ts:107-126`, `src/main/logger.ts:35` (5MB rotation size)
- **Evidence (OBSERVED):**
  ```
  107  export function readEvalMetrics(maxLines = 10_000): EvalMetrics {
  108    try {
  109      const path = join(app.getPath('userData'), 'logs', 'audit.log')
  110      if (!existsSync(path)) return aggregateMetrics([])
  111      const lines = readFileSync(path, 'utf8').trim().split('\n')
  112      const recent = lines.slice(-maxLines)
  ...
  117        records.push(JSON.parse(line) as AuditRecord)
  ```
  `readFileSync` reads the **entire** file (up to the 5MB rotation cap, `logger.ts:35`) into memory before
  slicing to the last 10,000 lines — the slice happens after the full read, not instead of it.
- **Reasoning:** This runs synchronously on the main process's single JS thread, blocking every other pending
  IPC handler, timer callback, and native event dispatch for the duration of the read + `split` + up-to-10k
  `JSON.parse` calls. Given the audit log's real observed volume (E4's ~20-event bursts per launch, E5's
  historical 5394-event spam, E8's 62+108 sidecar-lifecycle events), a 5MB file is a realistic steady state, and
  a synchronous multi-MB read on a slow/network/AV-scanned disk is a genuine, measurable stall — exactly the kind
  of main-thread block that can make the whole overlay look "frozen" for the read's duration, compounding
  Finding 1b.
- **Fix direction:** Either move this to a `worker_thread`, or — simpler and sufficient for "last N lines" —
  read the file from the end with a bounded reverse-seek/tail instead of loading the whole thing, since the
  function only ever wants the tail. This is a self-contained, low-risk fix.

### Finding 4 — P1 — Architecture — `registerIpc()` is a single 4,147-line function covering ~12 unrelated domains

- **File:** `src/main/index.ts:4624-8771`
- **Evidence (OBSERVED):** `grep -c "ipcMain\.handle("` → 160; `grep -c "ipcMain\.on("` → 4; all 164 registrations
  live inside the one function body between the `function registerIpc(): void {` at line 4624 and its closing
  `}` at line 8771 — confirmed by `grep -n "^}"` finding no other top-level function boundary in that range.
  Grouping the handled `IPC.*` names by lexical prefix gives a concrete sense of how many domains share this one
  scope: `brain*` (18 handlers), `import*` (13), `recall*` (12), `window*` (10), `mcp*` (8), `dust*` (7),
  `cloud*` (6), `cli*` (6), `member*` (5), `license*` (4), `graphify*` (4), `update*` (3), `settings*` (3),
  `save*` (3), `permissions*` (3), `parakeet*` (3), `outlook*` (3), `operator*` (3), `open*` (3), `local*` (3),
  `auth*` (3), `asr*` (3), `ask*` (3), plus ~30 more single/double-count prefixes (`time`, `screen`, `onboarding`,
  `metis`, `speaker`, `shortcut`, `calendar`, `apple`, `answer`, …).
- **Reasoning (DERIVED, per SAE 05-domain-and-code-boundaries):** "Prefer vertical capability modules over one
  giant services directory... keep one authoritative business rule." This function is the inverse of that: brain
  ingestion, MCP push, Dust auth, CLI provider management, licensing, audio import, meeting recall/export, ASR
  model management, calendar/Outlook writes, and window/app control all share one closure scope, one set of
  module-level mutable variables (`win`, `tray`, `decoderWin`, `ffmpegDecoders`, `importJobs`, `speakerIdInstance`,
  …), and one 4,147-line function body. This makes it effectively impossible to: (a) unit-test one domain's IPC
  surface without dragging in every other domain's module-load side effects (electron-log singleton, license
  store, MCP client, etc.), (b) reason about which handlers can run concurrently or share state, (c) safely
  change one domain (e.g., licensing) without a reviewer needing to hold the other 11 domains' invariants in
  their head, since nothing enforces a boundary between them. It is also the direct cause of the sender-validation
  sweep in this review needing to check 163 call sites individually instead of trusting a single shared
  middleware/wrapper per domain module.
- **Fix direction:** This is genuinely the "#1 refactor target" the brief calls out, and it is large enough that
  it needs its own planning pass, not a quick pass in this report. See §4 for the concrete per-domain module
  boundaries this review identified, with line ranges, as the starting decomposition map for that plan.

### Finding 5 — P1/P2 — Architecture/Readability — `index.ts` as a whole is a 9,518-line God Module with 142 scattered top-level imports

- **File:** `src/main/index.ts` (whole file)
- **Evidence (OBSERVED):** 142 `^import ` statements, the last at line 832 — but they are **not** contiguous:
  import statements are interleaved with executable module-level code (e.g., the entire "Speaker session
  ownership" feature block, lines 249-501, sits between two stretches of imports). The imports pull from at
  least 15 distinct subsystem directories/files: `./llm/*` (9+ modules), `./brain/*` (4+), `./mcp/*` (3+),
  `./cloud-stt/*`, `./island/*` (3+), `./cahe-edition`, `./cahe-embedded-key`, `./embedded-cloudflare-key`,
  `./outlook-write`, `./dustcli`, `./dust-cli-chat`, `./cli`, `./updater`, `./license*`-adjacent, `./mac-helper`,
  `./speaker-id`, `./screen-preprocess`, `./foreground-watcher`, `./import-audio*`, `./ffmpeg-decoder`,
  `./asr-*` (5+), `@shared/*` (10+), and more.
- **Reasoning:** Beyond `registerIpc()` (Finding 4), the rest of `index.ts` (lines 1-4623, 8772-9518, ~4,900
  lines) still holds: the speaker-session state machine, Dust auth refresh, IPC security guards, the entire
  import-job/ffmpeg-decoder orchestration, CLI session verification, the full onboarding/exclusive-window
  geometry state machine, `createWindow` itself, overlay resize/placement/cursor-watch runtime, window-mode
  transitions, crash reporting (`persistCrash`/`onFatal`), screen-capture + vision-check, background
  screen-preprocess wiring, display-geometry runtime, app-lifecycle + shortcuts, meeting notifications, tray,
  power-save-block bookkeeping, and the boot sequence itself — none of which is lifecycle in the narrow sense,
  and all of which currently has no choice but to live in one file because that's where `win`/`tray`/etc. are
  declared. A 9,518-line single-file module is unreadable end-to-end by construction (this review needed
  targeted greps and 15+ separate reads to build a mental map that a well-factored tree would make discoverable
  from directory structure alone), and it makes "read all of it" a genuinely multi-hour task for a human
  reviewer or a new engineer joining the project — a real, measurable cost distinct from any single bug.
- **Fix direction:** See §4 — the decomposition map below is the concrete starting point.

### Finding 6 — P2 — Testability/Maintainability — Hard-exit cleanup sequence is duplicated, not shared, "because tests pin it"

- **File:** `src/main/index.ts:4164-4212` vs. `9461-9518`
- **Evidence (OBSERVED):**
  ```
  4164  /** Kill what outlives the process when it dies without `will-quit`. ...
  4167  *  Deliberately a copy rather than a shared helper — several source-contract tests pin these exact calls
  4168  *  inside the `will-quit` handler body, and each step keeps its own try so one throw cannot skip a kill. */
  4169  function stopSidecarsForHardExit(): void {
  ```
- **Reasoning:** The two cleanup sequences (`stopSidecarsForHardExit()` and the body of the `will-quit` handler)
  are near-identical in intent (kill `screenPreprocess`, `localRuntime`, `fmRuntime`, clear the boot watch) but
  are maintained as two separate, hand-synchronized copies specifically because the test suite asserts on the
  literal source text of the `will-quit` handler body rather than on the *behavior* of a shared, injectable
  cleanup function. This is a real risk multiplier for exactly the class of bug this lane exists to catch: a
  future change that adds a fourth sidecar (as Finding 2 argues the ffmpeg decoder already should have been)
  only needs to be added to *one* of the two copies to pass the existing tests, while silently leaving the other
  hard-exit path un-fixed — which is very plausibly how the ffmpeg-decoder gap in Finding 2 happened in the
  first place. This is as much a test-design finding as a code finding: tests that pin an implementation's exact
  call sequence (rather than injecting a fake sidecar registry and asserting all registered sidecars got a
  `.stop()`) actively encourage this duplication.
- **Fix direction:** Introduce a small `sidecarRegistry: Array<{ name: string; stop: () => void }>` that both
  `will-quit` and `stopSidecarsForHardExit` iterate over identically; rewrite the pinning tests to assert against
  an injected fake registry's call log instead of the handler's source text. This turns "add a sidecar" into a
  one-line registration instead of a two-file edit, and directly closes the ffmpeg gap from Finding 2 as a side
  effect.

### Finding 7 — P2 — Performance (contributing factor, not sole cause) — Overlay window is structurally always-on, always-composited, never throttled

- **File:** `src/main/index.ts:2609-2618` (`webPreferences.backgroundThrottling: false`), `2512-2519`
  (`setAlwaysOnTop(true, 'screen-saver')`), `overlay-workspace-pinning.ts:8-15` (`setVisibleOnAllWorkspaces`)
- **Evidence (OBSERVED):**
  ```
  2609  webPreferences: {
  ...
  2615    backgroundThrottling: false,
  ```
  ```
  2512  function applyOverlayAlwaysOnTop(w: BrowserWindow): void {
  2514    w.setAlwaysOnTop(true, 'screen-saver')
  2515    pinWindowOnAllWorkspaces(w)
  ```
- **Reasoning:** Each of these is individually a deliberate, documented, reasonable choice for an always-visible
  meeting overlay (no throttling so the ASR/island UI never stalls in the background; `screen-saver`-level
  always-on-top plus all-workspaces pinning so the overlay is reachable from any Space/full-screen app). But
  their *combination*, held for the app's entire runtime regardless of whether the overlay is actively in a
  meeting or sitting idle as a parked pill, means Chromium keeps compositing and running this renderer at full
  rate continuously, at the OS's highest window level, on every desktop — for an app whose steady-state job (per
  Tony's own description) is mostly "sit there doing nothing." Combined with the resident local LLM sidecar (3.3GB
  GGUF, E1) and ASR models (640MB, E1) that this same lifecycle keeps warm, this is a real, structural
  contributor to "very heavy on the PC" distinct from the orphan-process issue in Finding 2 — it applies even to
  a single, cleanly-running instance.
- **Fix direction:** This is a product/perf trade-off, not a bug — flagging for the planning pass rather than
  prescribing a fix. The codebase already has the building blocks for a middle ground (`island/cursor-watch.ts`'s
  proximity/hover detection already gates other UI behavior) — the same signal could gate `backgroundThrottling`
  and the always-on-top level when the overlay has been parked/idle for some minutes, un-throttling the instant
  the cursor approaches or a meeting starts.

### Finding 8 (verification, not a defect) — Background screen-capture retry loop (E5) — appears already fixed at HEAD

- **Files:** `src/main/index.ts:3893-3896`, `src/main/screen-preprocess.ts:190-206`
- **Evidence (OBSERVED):** `eligible()` (`screen-preprocess.ts:198-202`) requires `captureAllowed()`
  (`screen-preprocess.ts:196`), which is `!deps.screenCaptureGranted || deps.screenCaptureGranted()`; `index.ts`
  wires `screenCaptureGranted: () => systemPreferences.getMediaAccessStatus('screen') === 'granted'` on darwin
  (`3893-3896`). The comments at both sites cite "MQA-209" as the fix for exactly this failure mode ("a
  background loop that runs before the grant exists raises the system dialog with nothing on screen that asked
  for it" / "never let this background loop be the thing that asks for Screen Recording").
- **Reasoning:** If this gating is correctly wired (and it reads as correctly wired — `eligible()` is the single
  gate `canRun()` and `refresh()` both consume), a session with Screen Recording permission off should now see
  `canRun() === false` and the background loop should never fire, so it should not reproduce the 5394-event
  `capture.failed` spam E5 describes. The Aug-2026 dates on that evidence predate this apparent fix.
- **Caveat (UNKNOWN):** I did not execute the app or step through `refresh()`'s call sites exhaustively (out of
  lane — `screen-preprocess.ts` is not in my assigned file list beyond what's needed to close out E5, and a full
  audit of its ~445 lines belongs to whichever lane owns capture/screen features). Recommend a live repro with
  Screen Recording explicitly denied, on both a fresh profile and a profile with `backgroundScreenContext: true`
  already set, before closing this out for good.

### Finding 9 (low-confidence, DERIVED) — `local.runtime.start` (62) vs. `local.runtime.stop` (108) audit-count gap

- **File:** `src/main/llm/local-runtime.ts:493-509` (`maybeAutoRestart`), `587-622` (`start`, model-switch stop),
  `632-638` (`stop`)
- **Reasoning:** `stop()` only audits `'local.runtime.stop'` when `wasRunning` was true, and `start()`'s
  model-switch branch (`609-610`) explicitly emits one extra `'local.runtime.stop'` (`reason: 'model_switch'`)
  for every model switch, without a paired `'local.runtime.start'` failing to also occur (a switch always issues
  its own start right after). This alone does not obviously produce a 46-event surplus of stops over starts.
  Plausible (not confirmed) contributors: `stopSidecarsForHardExit`/`will-quit` calling `localRuntime.stop()`
  while the sidecar was merely `'starting'` (still counts as `wasRunning` per `632-634`'s `state === 'running' ||
  state === 'starting'` check) during one of E3's 8 same-day relaunches, each contributing a stop with no
  matching start (because the start never reached the success branch that emits `'local.runtime.start'`, e.g. it
  was killed mid-spawn by a quit). I was not able to fully reconcile the exact 62/108 figures from static reading
  alone — flagging as **DERIVED, low confidence**, worth a targeted audit-log timeline reconstruction rather than
  a code claim.

---

## 3. Security notes (axis coverage, no separate findings beyond the above)

- BrowserWindow `webPreferences` on the one privileged window (`createWindow`, `index.ts:2609-2617`):
  `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`, `devTools:
  DEVTOOLS_ENABLED` (gated off in packaged builds via `devToolsEnabled()`/`isPackagedBuild()` per the top-of-file
  comment at `26-33`). **No finding** — this is correct, enterprise-appropriate configuration.
- IPC sender validation: swept all 163 `ipcMain.handle`/`ipcMain.on` registrations programmatically for a guard
  call (`assertMainWindow`/`assertBrainReader`/`assertDecoderSender`/`isDecoderSender`/`isMainWindowSender`/
  `denyIfLimited`/`isRecentlyRetiredOverlaySender`) within the first 3 lines of the handler body. 161/163 matched
  immediately; the 2 apparent misses (`importDecoderReady`, `importDecoderSourceAck`, `index.ts:8350,8361`) were
  hand-verified to gate via `isDecoderSender(e)` as their very first statement — a naming mismatch in my sweep
  script, not a real gap. **No finding** — sender validation coverage is thorough and consistent.
- `will-quit`'s `window-open-handler`/`will-navigate` guards (`2703-2709`) correctly deny external navigation and
  route `https://` links through `shell.openExternal` instead of letting them load in the privileged renderer.
  **No finding.**
- Windows-specific hardening: `process.chdir(app.getPath('userData'))` before any spawn on win32
  (`index.ts:8891-8898`) to close a planted-binary-in-cwd attack surface — a genuinely good, specific piece of
  defensive engineering, called out here as a positive. **No finding.**

---

## 4. Decomposition map — `index.ts` → cohesive modules (the #1 refactor target)

Line ranges below are as read at HEAD (2bf21f1c). This is a starting map for a planning pass, not a mechanical
extraction list — several clusters share module-level mutable state (`win`, `tray`, `ipcRegistered`) that a real
extraction has to thread through explicitly (constructor injection or a small `AppContext` object) rather than
capture ambiently, which is exactly the kind of decision SAE's domain-boundary discipline says needs its own
design pass, not a blind cut-and-paste.

| Cluster (responsibility) | Current lines | Proposed module | Notes |
|---|---|---|---|
| Speaker session ownership (live + import speaker-ID lifecycle) | 249-501 | `src/main/session/speaker-session.ts` | Self-contained state machine; touches `speakerIdInstance` only. Good extraction candidate, low risk. |
| Dust auth keep-warm/refresh | 841-965 | `src/main/dust/dust-session-refresh.ts` | `makeRefreshDustAuth` + friends. |
| Content-protection / private-view | 966-1002 | `src/main/privacy/content-protection.ts` | Small, pure-ish predicates. |
| Overlay sender retirement + cloud-STT ownership | 1003-1118 | `src/main/cloud-stt/stt-ownership.ts` | |
| **IPC security guards** | 1119-1210 | `src/main/ipc/ipc-guards.ts` | `assertMainWindow`, `isMainWindowSender`, `denyIfLimited`, `assertBrainReader`. Isolating this lets it be unit-tested directly instead of only indirectly via `registerIpc`'s 160 call sites. |
| Import-job orchestration + ffmpeg/decoder-window pipeline | 1210-1826 | `src/main/import/import-decoder-pipeline.ts` | Owns the `spawn()` at 1426(ffmpeg) and the hidden `decoderWin` BrowserWindow. **Must** get a `stopAll()` wired into both quit paths (Finding 2/6). |
| CLI session verify/retire | 1827-1914 | `src/main/cli/cli-session-lifecycle.ts` | |
| Public-settings projection | 1915-2048 | `src/main/settings/public-settings.ts` | |
| Onboarding / exclusive-window geometry state machine | 2049-2520 | `src/main/onboarding/exclusive-onboarding-window.ts` | Largest single non-IPC cluster (~470 lines); genuinely complex, needs its own careful extraction plan. |
| **`createWindow` + BrowserWindow construction** | 2521-2867 | `src/main/window/main-window.ts` | The lifecycle-critical piece; keep small and dependency-light so it stays easy to reason about in isolation. |
| Overlay resize/placement/cursor-watch runtime | 2868-3423 | `src/main/window/overlay-runtime.ts` | Owns `overlayCursorWatchTimer`/`exclusiveBoundsWatchTimer`. |
| Window-mode transitions, `ensureWindow`/`showForAsk`/`sendHotkey` | 3424-3538 | `src/main/window/window-mode.ts` | |
| Crash reporting glue (`persistCrash`/`onFatal`) | 3539-3582 | `src/main/crash/crash-reporting.ts` | Pairs naturally with `boot-sentinel.ts`. |
| Screen capture (screenshot + vision-check) | 3583-3855 | `src/main/capture/screen-capture-runtime.ts` | |
| Background screen-preprocess wiring | 3856-3923 | (glue only — `screen-preprocess.ts` already owns the logic) | Keep as a thin wiring file, e.g. `src/main/capture/screen-preprocess-wiring.ts`. |
| Display-geometry runtime (`moveBy`, `registerScreenListeners`, topology reanchor) | 3924-4104 | `src/main/window/display-geometry-runtime.ts` | |
| **App lifecycle + shortcuts + force-quit** | 4105-4326 | `src/main/lifecycle/app-lifecycle.ts` | Core of this lane: `toggleVisible`, `stopSidecarsForHardExit`, `forceQuitMétis`, `registerShortcuts`. Should own the sidecar registry from Finding 6. |
| Meeting notifier | 4327-4393 | `src/main/notifications/meeting-notifier.ts` | Owns `notifTimer`. |
| Tray | 4394-4477 | `src/main/lifecycle/tray.ts` | |
| Power-save-block bookkeeping | 4478-4527 | `src/main/lifecycle/power-save.ts` | |
| **`registerIpc()` — split by IPC namespace** | 4624-8771 | see sub-rows below | The 4,147-line monolith (Finding 4). |
| — `ask*`, LLM streaming/hedge/routing handlers | (within 4624-8771; ask cluster ~6800-7700 by IPC-name grep) | `src/main/ipc/ask-ipc.ts` | |
| — `brain*` (18 handlers) | (within 4624-8771) | `src/main/ipc/brain-ipc.ts` | |
| — `import*` (13 handlers) | (within 4624-8771) | `src/main/ipc/import-ipc.ts` | Thin wrapper over the import-decoder-pipeline module above. |
| — `recall*` (12 handlers) | (within 4624-8771) | `src/main/ipc/recall-ipc.ts` | |
| — `mcp*` (8 handlers) | (within 4624-8771) | `src/main/ipc/mcp-ipc.ts` | |
| — `dust*` (7 handlers) | (within 4624-8771) | `src/main/ipc/dust-ipc.ts` | |
| — `cli*` (6 handlers) | (within 4624-8771) | `src/main/ipc/cli-ipc.ts` | |
| — `license*`/`member*` (9 handlers) | (within 4624-8771) | `src/main/ipc/license-ipc.ts` | |
| — `settings*`/`permissions*` (6 handlers) | (within 4624-8771) | `src/main/ipc/settings-ipc.ts` | |
| — `asr*`/`parakeet*` (6 handlers) | (within 4624-8771) | `src/main/ipc/asr-ipc.ts` | |
| — `auth*` (3 handlers) | (within 4624-8771) | `src/main/ipc/auth-ipc.ts` | |
| — `calendar*`/`outlook*` (4 handlers) | (within 4624-8771) | `src/main/ipc/calendar-outlook-ipc.ts` | |
| — `update*` (3 handlers) | (within 4624-8771) | `src/main/ipc/update-ipc.ts` | Thin wrapper over `updater.ts`, already clean. |
| — `operator*` (3 handlers) | (within 4624-8771) | `src/main/ipc/operator-ipc.ts` | |
| — `window*` (10 handlers) + `openMailDraft` | (within 4624-8771) | `src/main/ipc/window-control-ipc.ts` | Stays closest to the core lifecycle module. |
| Custom-protocol registration + single-instance-lock + `whenReady` boot sequence | 8772-9433 | `src/main/lifecycle/app-bootstrap.ts` | This becomes the new, slim `index.ts`'s main body — the actual lifecycle entry point, finally readable end-to-end once everything above is extracted. |
| `window-all-closed`/`before-quit`/`will-quit` | 9435-9518 | `src/main/lifecycle/quit-flow.ts` | Pairs with `app-lifecycle.ts`; should consume the shared sidecar registry from Finding 6 rather than duplicating the kill list. |

**Sizing check:** the above turns one 9,518-line file into roughly 30 modules averaging ~300 lines each (the
onboarding-geometry and IPC-domain modules will run larger, 400-700 lines, which is still an order of magnitude
more reviewable than the current single file). This is consistent with the "vertical capability modules" guidance
in the domain-boundaries method, and is exactly the shape a "full team of senior developers" would expect to find
walking into this codebase.

---

## 5. Coverage ledger

**Inspected in full:** `index.ts` (all 9,518 lines, in ~15 targeted reads plus programmatic line-range sweeps for
structural facts — function boundaries, `ipcMain.*` registrations, guard-call adjacency, sidecar-cleanup call
sites — that would have been unreliable to eyeball at this size), `boot-sentinel.ts`, `renderer-readiness.ts`,
`overlay-workspace-pinning.ts`, `onboarding-exit-fallback.ts`, `updater.ts`, `logger.ts`, `metrics.ts`.

**Inspected partially, to close out specific evidence items (not a full lane review of these — flagging for
whichever lane owns them):** `llm/local-runtime.ts` (spawn/stop/health/restart logic, ~340 of 671 lines),
`llm/fm-runtime.ts` (spawn/kill call sites only), `screen-preprocess.ts` (eligibility gating, ~220 of 445 lines),
`mac-helper.ts` (OCR/screen-metrics spawn helpers, ~250 of file), `ffmpeg-decoder.ts` (spawn/kill call sites, all
196 lines quickly).

**Not inspected (out of lane):** the internals of `brain/*`, `mcp/*`, `cloud-stt/*`, `island/geometry.ts` (only
its exported surface as consumed by `index.ts`), `store.ts`, `license*.ts`, `auth.ts`, `import-jobs.ts`,
`recall.ts`, `dustcli.ts`, `cli.ts` — these are called extensively from `registerIpc()` but their own
correctness is each other lane's job; this review only establishes that the lifecycle *wiring* around them
(sender validation, boot ordering, quit-path cleanup) is sound or not, per the findings above.

**Confidence:** Findings 1, 1b, 2, 3, 4, 5, 6 are OBSERVED-grounded with exact file:line citations and were
independently confirmed by re-reading the cited ranges. Finding 7 is a product/architecture trade-off flag, not
a defect claim. Finding 8 is a verification note that partially closes out E5. Finding 9 is explicitly flagged
low-confidence and should not be treated as a closed root-cause without a timeline reconstruction from real
audit-log data.
