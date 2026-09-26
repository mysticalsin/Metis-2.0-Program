# Lane B3 — Crash & Stability Root-Cause Report

**Repo**: `/Users/tony/AI-Brain-build/metis-2.0` (read-only checkout, `origin/main` @ `2bf21f1c`, v1.9.6)
**Installed app on Tony's Mac**: `/Applications/Metis.app` = 1.9.6 (same as HEAD)
**Scope**: E6/E7 — crashes and false crash detection. Boot-sentinel, unhandled-rejection path, render-process-gone, app.unresponsive, safe_start, createWindow_retry, minidumps, DiagnosticReports, global error handling, crash-recovery UX.
**Method**: reproduce → root cause → regression test → surgical fix (per `14-reliability-and-recovery.md`, `27-operational-playbooks.md`, `software-delivery.md`).

**Evidence legend**: **OBSERVED** = seen directly in code/logs/binary. **DERIVED** = reasoned from OBSERVED facts (code paths traced by hand, no runtime instrumentation). **ASSUMED** = plausible but unverified. **UNKNOWN** = genuinely undetermined from what's available in this read-only lane.

---

## 0. Executive summary

Tony's two complaints — "heavy on the PC" and "when I click on History sometimes it just doesn't open the app again; it's running but it freezes or crashes" — are **not one bug**. They are the visible symptom of four independent gaps in the crash/recovery design that compound each other:

1. **`app.crash` audit records lie about what actually happened.** An `unhandledRejection` is logged as `app.crash` but Node's default behavior (process death) is explicitly suppressed by the very act of registering the handler — the process **keeps running**. E6's "6× unhandledRejection" are not 6 crashes; they are 6 handled errors with a misleading label. This is the literal "false crash detection" the task asked about (§2).
2. **A renderer that dies gets reloaded unconditionally, with no crash-loop breaker.** `render-process-gone` always calls `self.loadURL(...)` again, regardless of `reason`, regardless of how many times it just happened. E6's own timeline — `render-process-gone reason=killed` immediately followed 5s later by `app.unresponsive` — is this loop in action: reload → immediately wedge again (§4).
3. **`ensureWindow()` (the `createWindow_retry` path) fails silently.** If `createWindow()` throws twice in a row, the app is left running (tray icon alive, sidecars alive) with **no window and no user-facing signal at all** — only an audit-log line nobody but this report reads. This is the exact shape of "it's running but it just freezes" (§5).
4. **Nothing reaps orphaned sidecars, and nothing converts SIGTERM into a clean quit.** Every cleanup path (`before-quit` / `will-quit` / the emergency-quit hotkey) requires the JS event loop to run. A hard kill (Activity Monitor Force Quit, `kill -9`, or a plain `SIGTERM` with no handler installed) skips all of it, which is exactly why `E2` found two orphaned `llama-server` processes and orphaned `chrome_crashpad_handler` processes with `ppid=1` (§6).

The `boot-sentinel.ts` mechanism (E6's `boot-early-death` / `safe_start`) is well-engineered for the one native-crash class it documents (MQA-175), but a structural change (multiple racing `clearBootWatchOnce` call sites) means the sentinel's protected window now closes **before** the 15-second-delayed brain-resume step it was built to catch — so the mechanism may no longer be catching what it says it catches, and it cannot distinguish a genuine sub-second native crash from an impatient force-quit in the same window (§3).

None of this requires new subsystems. Every fix below is a small, local change to code that already exists and is already partially tested.

---

## 1. Boot sequence map (read once, cited throughout)

`app.whenReady().then(async () => { ... })` in `src/main/index.ts` runs, in this order, with no top-level `await` between the marked points (confirmed by grepping every `await` in the range and checking each is inside a function *definition* — e.g. an `ipcMain.handle` callback or `setDisplayMediaRequestHandler` callback — registered for later invocation, not executed inline during boot):

```
8798  app.whenReady().then(async () => {
8799    initLogging()
8805-8813 (optional) exclusive-onboarding fast path: createTray/registerIpc/createWindow
8814    await installProxyAwareFetch()          <- the only boot-blocking await before the sentinel
 ...    egress guard, CLI prewarm, embedded-key imports, local-model provision (fire-and-forget `void`)
8929    const earlyDeath = beginBootWatch(...)  <- SENTINEL WRITTEN (userData/boot-incomplete.json)
8931    setBootPowerSaveBlock(true)
8936    clearBootWatchOnce()  defined (idempotent, first caller wins)
8946    if (earlyDeath) persistCrash('boot-early-death', ...)
8949-8950 process.on('uncaughtException'/'unhandledRejection', onFatal)
 ...    self-test gate, dotenv, sweepStaleTempFiles, recoverOrphanDrafts, retention sweep (all fire-and-forget or gated off in packaged builds)
9281    runStep('createTray', createTray)
9282    runStep('registerShortcuts', registerShortcuts)
9287    runStep('registerIpc', registerIpc)
9288    clearBootWatchOnce('registerIpc')        <- SENTINEL CLEARED (typically <50ms after write)
9289    runStep('createWindow', createWindow)
9291    clearBootWatchOnce('createWindow')       <- no-op, already closed
9294    setImmediate(() => clearBootWatchOnce('setImmediate'))   <- no-op
9296    powerMonitor.on('unlock-screen', ... clearBootWatchOnce('unlock-screen'))  <- no-op unless boot paused on a locked screen
9348    setTimeout(() => { ... brain resume/backfill/reconcile ... clearBootWatchOnce('mqa-175') }, 15_000)  <- no-op, already closed
```

`beginBootWatch` (`src/main/boot-sentinel.ts:89-121`) writes `boot-incomplete.json` synchronously (`writeFileSync`, mode `0o600`) before any of this runs, and `endBootWatch` (`boot-sentinel.ts:123-129`) removes it. `describeEarlyDeath` (`boot-sentinel.ts:132-138`) formats the record for the crash log. The file's own doc comment (`boot-sentinel.ts:9-19`) states the mechanism exists because a native C++ exception (`MQA-175`: OSCrypt on a sync-mangled `.brain/index.json`) unwinds past V8 and leaves **no trace** unless the *next* launch finds the stale sentinel.

---

## 2. `unhandledRejection` → `app.crash` is a false-positive generator (P1)

**File:line**: `src/main/index.ts:3559-3581` (`onFatal`), called from `index.ts:8949-8950`.

```ts
function onFatal(kind: 'uncaughtException' | 'unhandledRejection', err: unknown): void {
  const detail = err instanceof Error ? err.stack || err.message : String(err)
  persistCrash(kind, detail, err instanceof Error ? err.message : String(err))
  if (kind !== 'uncaughtException' || fatalHandled) return   // <-- unhandledRejection stops HERE
  fatalHandled = true
  ... dialog.showMessageBoxSync(...) offering a one-time relaunch ...
}
```

`persistCrash` (`index.ts:3539-3552`) always calls `auditLog('app.crash', { kind, message })`.

**OBSERVED**: for `kind === 'unhandledRejection'`, the function returns immediately after `persistCrash` — there is no `app.exit`, no `app.relaunch`, nothing that ends the process. Node.js's own default behavior for an unhandled rejection (crash/terminate) only happens when **no** `unhandledRejection` listener is registered; registering this handler is precisely what suppresses that default. So every one of E6's "6× unhandledRejection 'Failed to get sources.'" **did not crash the app** — the process kept running, the user very likely saw a failed screen-capture (silently, since nothing surfaces this to the renderer either) and continued using Métis.

**Why this matters beyond pedantry**: the audit log is the *only* crash telemetry this zero-upload app has (`crashReporter.start({ uploadToServer: false })`, `index.ts:944`). If `app.crash` conflates "the process died" with "a promise rejected and was logged," every downstream count (E6's tallies, any future dashboard, this very review) over-counts real crashes and under-counts real hangs (a `kind=uncaughtException` after the first one in a session is *also* silently swallowed by the `fatalHandled` latch — see §7 — so a *second* genuine fatal error in one session produces **no** `app.crash`-with-dialog and looks, to the user, exactly like a freeze).

**Fix**: split the audit taxonomy. Keep `app.crash` for events that actually end the process (`uncaughtException` with no continue, `render-process-gone`, `boot-early-death`). Rename the handled, non-fatal path to `app.error.recovered` (or add a boolean field `fatal: false`) so any future audit read (or a "why did Métis crash 9 times" support answer) doesn't count events the process visibly survived.

**Regression test**: add to `crash-capture.test.ts` — a source-contract assertion that the `unhandledRejection` branch of `persistCrash`'s call site uses a distinct audit `kind`/field from the `uncaughtException` branch (grep the two call sites and assert they differ), so a future edit can't silently re-merge them. A behavioral test (extract `onFatal` for injection, per §8's testability note) should assert: given a rejection, the process is not asked to exit and the audit event is *not* `app.crash` verbatim.

---

## 3. Boot-sentinel: the watched window no longer covers the step it was built for (P1)

**Files**: `boot-sentinel.ts` (whole file), `index.ts:8929-8946` (open), `index.ts:9287-9296` (the four near-instant `clearBootWatchOnce` callers), `index.ts:9348-9408` (the 15s-delayed brain resume + `safe_start`).

### 3a. Is "force-quit before `registerIpc`" a real false-positive path? — Narrow but real (DERIVED)

Every `await` between `beginBootWatch` (`8929`) and `registerIpc`'s `runStep` (`9287`) lives inside a function **definition** that runs later (an `ipcMain.handle` callback, `setDisplayMediaRequestHandler`'s handler, `runSelfTest` gated off in packaged builds by `devEnv('ASKTOTO_SELFTEST')`). Everything actually *executed* in that span is synchronous: `mkdirSync`/`readdirSync`/`writeFileSync` calls (crash-log pruning, `app.dock.hide()`), tray/shortcut registration. In the ordinary case this window is low tens of milliseconds — too narrow for a user-initiated Force Quit to land in reliably.

It stops being narrow, and becomes a real false-positive vector, when any of that synchronous work is slow: `userData` on a throttled/AV-scanned/virtualized filesystem, a slow `Tray` icon load, or a slow native call inside `createTray`/`registerShortcuts` (both are `runStep`-wrapped but *not timed or budgeted* — a single slow native call anywhere in this list silently extends the sentinel's open window with nothing watching for it). **This is the one piece of the task's hypothesis that is directly confirmed**: yes, a hang or a slow synchronous step here, followed by a hard kill, is indistinguishable in the sentinel's data from a genuine `MQA-175`-class native crash.

### 3b. The bigger, previously-undocumented finding: the sentinel closes before the danger it names (DERIVED, high confidence)

Read the comments in place: `index.ts:9290` says *"createWindow completed → past kill zone; clear sentinel (**brain stays on 15s**)"*, and `index.ts:9403-9404` says *"Power-save stays until here so the 15s brain step is not App-Napped; sentinel **may already have been cleared earlier**"*.

Trace `clearBootWatchOnce` (`index.ts:8936-8945`): it is guarded by a module-local `bootWatchClosed` flag — **first caller wins, every later caller is a no-op**. The callers, in the order they actually fire on a normal boot:

1. `registerIpc` (`9288`) — fires almost immediately.
2. `createWindow` (`9291`) — no-op, already closed.
3. `setImmediate` (`9294`) — no-op.
4. `unlock-screen` (`9296`) — no-op (unless the screen was locked mid-boot).
5. the 15-second timer's `finally` (`9406`) — no-op.

So on essentially every real boot, **the sentinel is cleared within milliseconds of `registerIpc`**, not at the 15-second mark. But the code the sentinel's own doc comment names as the reason it exists — the `.brain/index.json` OSCrypt decrypt inside `resumeBackfillIfPending()`/`reconcileMeetingsInBackground()` (`index.ts:9362-9367`) — only runs **15 seconds later**, wrapped by the *already-closed* `clearBootWatchOnce('mqa-175')`. If that exact native crash (the one this whole file exists to catch) happens today, at HEAD, during that 15-second-delayed brain resume, `boot-incomplete.json` is **already gone**. The next launch will see no stale sentinel, report no `earlyDeath`, and the crash will vanish exactly as it did before `boot-sentinel.ts` existed — silently, with no `app.crash` line, no dialog, nothing.

This is a regression risk in the opposite direction from the task's hypothesis: not only can the sentinel over-report (§3a), the multi-clear-site design as it stands under-reports the one crash class it was purpose-built for, because "past the kill zone" (the comment's claim) and "past the code that actually kills" (the brain resume) are now two different points in time and only the first one gates the sentinel.

**Fix**: don't clear the sentinel until the *last* dangerous step finishes, not the first convenient one. Concretely: keep `clearBootWatchOnce('registerIpc'/'createWindow'/...)` for UI responsiveness purposes (they can still drive `setBootPowerSaveBlock(false)` early since App Nap is the real reason those exist) but gate the **file removal** itself on the 15-second brain-resume `finally` alone — i.e., separate "stop blocking App Nap" from "the sentinel file is safe to delete." Two independent booleans, not one shared `bootWatchClosed`.

**Regression test**: extend `boot-sentinel.crash-dumps.test.ts` (or a new `boot-sentinel.window.test.ts`) with a source-contract test asserting that the call to `endBootWatch`/`clearBootWatchOnce` reachable from the 15-second timer's `finally` block is not already gated by the same flag as the `registerIpc` call — i.e. assert they are structurally two different guards. A behavioral version: simulate `beginBootWatch` → `registerIpc`-equivalent clear → then a thrown error inside the brain-resume step → assert the sentinel file is still absent/present as intended by the design decision made above (this pins the fix, not just today's behavior).

### 3c. The sentinel can't tell "died in 50ms" from "user force-quit in 50ms" (P2, DERIVED)

`BootRecord`/`EarlyDeath` (`boot-sentinel.ts:29,34`) carry `startedAt`, `pid`, `version`, `consecutive` — no record of *how long* the previous run had been up before it died. A native crash 50ms after launch and a user mashing Cmd+Q 50ms after launch (because the icon looked wrong, or out of habit) produce byte-identical sentinel evidence. `describeEarlyDeath` (`boot-sentinel.ts:132-138`) can't and doesn't distinguish them, and neither can `safe_start`'s decision to skip brain resume on the *next* boot.

**Fix**: have `beginBootWatch` also read `Date.now() - Date.parse(previous.startedAt)` if determinable some other way is not possible from inside the dying process (it isn't — that's the whole design constraint) — but the **next** boot's own diagnosis can at least log the *previous run's total session length from `app.started` to the next `app.started`* (already computable from `audit.log`, no code change to the sentinel itself needed) so a human (or an automated triage) reading the log isn't left guessing. This is a diagnostics improvement, not a correctness fix — flag as P2 / nice-to-have rather than blocking.

### 3d. `safe_start` is a reasonable, narrowly-scoped circuit breaker — and per §3b, likely dormant

`index.ts:9356-9358`:
```ts
if (earlyDeath) {
  mainLog.warn(`[boot] safe start — skipping the brain backfill/reconcile resume: ${describeEarlyDeath(earlyDeath)}`)
  auditLog('app.crash', { kind: 'safe_start', consecutive: earlyDeath.consecutive })
}
```
This is the right shape for a circuit breaker (skip exactly the subsystem correlated with the previous death, nothing else) — the design intent is sound. Its practical value is bounded by §3b: since the sentinel is normally cleared long before this code runs, `earlyDeath` here almost always reflects a death from *before* `registerIpc` on the *previous* launch, not a brain-resume death — which is a different (and per §3a, narrower) failure class than what the surrounding comments describe this mechanism as protecting against. E6's own numbers are consistent with this: **9** `boot-early-death` records vs only **2** `safe_start` records in the same window — meaning most of those 9 "early deaths" were followed by *another* death before the 15-second mark was ever reached (a re-crash loop), not by a clean skip-and-continue. That pattern (repeated early death, most without a following safe-start) is itself worth flagging to whoever owns telemetry: it looks like a boot-time crash loop, not isolated incidents.

---

## 4. `render-process-gone`: unconditional reload, zero crash-loop protection (P0)

**File:line**: `index.ts:2737-2783`.

```ts
win.webContents.on('render-process-gone', (_e, details) => {
  if (win !== self) return
  ...
  mainLog.error(`[renderer-gone] reason=${details.reason} exitCode=${details.exitCode}`)
  auditLog('app.crash', { kind: 'render-process-gone', reason: details.reason, exitCode: details.exitCode })
  ...
  self.loadURL(overlayRendererUrl())     // <-- 2782, unconditional, every time, no counter
})
```

**OBSERVED**: there is no check on `details.reason` (Electron's enum includes `'crashed' | 'killed' | 'oom' | 'launch-failed' | 'integrity-failure' | 'abnormal-exit'`), no counter of how many times this has fired for this window instance, no backoff, and no ceiling after which the code gives up and shows the user something instead of silently reloading forever. Compare to `ensureWindow`'s comment about "self-heal... instead of leaving window-dependent hotkeys dead for the process lifetime" — the intent to self-heal is consistent house style, but here it's applied with no loop-breaker at all.

**This matches E6's own timeline directly**: `render-process-gone reason=killed exitCode=15` at `2026-09-25T12:13:52Z`, then `app.unresponsive kind=overlay` **5 seconds later**. Read against this code: the renderer died, `loadURL` fired immediately, and whatever loaded next became unresponsive within 5 seconds — either the same underlying condition recurred instantly (a poison piece of persisted renderer state, e.g. a huge/corrupt in-memory reconstruction on mount) or the reload itself is racing the same resource pressure that killed the first one (E1: 3.3GB local-LLM dir + E2's orphaned `llama-server` processes competing for RAM — **ASSUMED** correlation, not proven from what's in this lane; flagged for the resource/perf lane to confirm with RAM telemetry).

`exitCode=15` on `reason=killed` is consistent with the child having received signal 15 (`SIGTERM`) — **DERIVED**, not proven without symbolication; Electron's `'killed'` reason covers "terminated by a signal," and 15 is `SIGTERM`'s numeric value on Darwin. Chromium's own out-of-memory renderer killer, or macOS memory-pressure jetsam, are both plausible senders — **UNKNOWN** which, from this lane's evidence alone.

**Fix**: add a bounded reload budget local to this handler (e.g., a small in-memory counter + timestamp window, reset on a *successful* `did-finish-load` + some minimum live time) — after N reloads within M seconds, stop reloading automatically and instead show a real recovery surface: a minimal native `dialog.showMessageBox` ("Métis' display crashed repeatedly — reload / quit") or, better, load a tiny static `error.html` that offers a manual "Reload" button and a "Quit" button, so the failure mode becomes *visible and actionable* instead of an invisible loop. Log `details.reason`/`details.exitCode` distribution over time (already partially done via `auditLog`) so a `reason==='oom'` cluster is distinguishable from `reason==='crashed'`.

**Regression test**: a unit test around a small extracted `shouldAutoReload(history: {ts:number}[], now:number): boolean` helper (pull the threshold logic out of the inline handler so it's testable without a real `BrowserWindow`) — assert it returns `true` for the first few closely-spaced events and `false` once the budget is exceeded, and that it resets after a live gap. This also gives QA a place to write "3 render-process-gone events in 10s → recovery UI shown" as a deterministic test rather than needing a real crashing renderer.

---

## 5. `ensureWindow()` / `createWindow_retry`: silent, unbounded, user-invisible failure (P0)

**File:line**: `index.ts:3468-3482` (`ensureWindow`), call sites at `index.ts:3517` (`sendHotkey`), `3975` (`moveBy`), `4111` (`toggleVisible`), `8792` (`second-instance`).

```ts
function ensureWindow(): BrowserWindow | null {
  if (win && !win.isDestroyed()) return win
  win = null
  try {
    createWindow()
  } catch (e) {
    mainLog.error('[recover] createWindow retry failed:', e)
    auditLog('app.crash', { kind: 'boot_step', step: 'createWindow_retry' })
  }
  return win
}
```

Every caller does `const w = ensureWindow(); if (!w) return` (e.g. `4111-4112`, `3975-3976`, `8792-8793`). **OBSERVED**: if `createWindow()` throws (its own comment at `2660-2665` names "a rare GPU/compositor-specific native call failure" as the known trigger, and E6's evidence independently shows `boot_step createWindow_retry` actually fired on Tony's machine), the failure is caught, logged to a log file and an audit line **nobody but this review reads**, and every caller silently no-ops. There is no dialog, no native notification, no tray-menu indication, no retry-with-backoff, no "click again in a second" — just permanent silence. The app is still running (tray icon, background timers, any local-LLM sidecar already spawned), which from the user's chair is indistinguishable from "the app is frozen."

**This is the strongest single candidate for Tony's bug report #2** ("when I click on History sometimes it just doesn't open the app again; it's running but it freezes or crashes"): a hotkey/tray/relaunch action calls `ensureWindow()`, `createWindow()` throws (again, for whatever persistent reason caused the first throw — a one-shot retry does nothing against a *persistent* cause), and the user is left with a running-but-silent process with no way back short of finding and force-quitting it in Activity Monitor — which is exactly what E3's audit log shows happening, repeatedly, in one day.

**Fix**: (1) after a second consecutive `ensureWindow()` failure in the same session, surface a native OS notification or a `dialog.showMessageBox` telling the user Métis cannot open its window and offering "Relaunch" (same `app.relaunch(); app.exit(0)` pattern `onFatal` already uses for `uncaughtException` — this code should call the *same* helper, not reinvent it). (2) log the actual thrown error's message/stack in the `app.crash` audit line (today it logs only `{ kind: 'boot_step', step: 'createWindow_retry' }` — the *cause* is thrown away at the audit layer even though `mainLog.error` has it, so any future review of `audit.log` alone — which is the only thing this lane's evidence pack included — can see *that* it failed but never *why*).

**Regression test**: inject a `createWindow` that throws a labeled error via a test seam (the module doesn't currently expose one for `createWindow`/`ensureWindow` — worth adding a thin `_test` export mirroring the pattern already used in `screen-preprocess.ts:130-134`), and assert: (a) the first failure is silent as today (matches existing behavior, don't regress the "one throw doesn't nag" case), (b) a second failure within N minutes triggers the user-facing path, (c) the audit record includes the underlying error message.

---

## 6. Hard-kill leaves orphans: no SIGTERM handler, no boot-time reaper (P1)

**Files**: `index.ts:4160-4193` (`stopSidecarsForHardExit`, called from the app's own emergency-quit hotkey), `index.ts:9449-9459` (`before-quit`), `index.ts:9461-9479+` (`will-quit`, which also calls `endBootWatch` + the sidecar stops), `src/main/llm/local-runtime.ts:362-366` (the `spawn()` call with no `detached` flag), `index.ts` — **no `process.on('SIGTERM'/'SIGINT', ...)` anywhere** (confirmed by grep: the only two `process.on(...)` registrations in the whole file are the `uncaughtException`/`unhandledRejection` pair at `8949-8950`).

**OBSERVED chain**:
1. `local-runtime.ts:362` spawns `llama-server` via plain `child_process.spawn(binaryPath, args, { stdio, windowsHide, env })` — no `detached: true`, no linkage of the child's life to the parent beyond the parent's own JS explicitly calling `.kill()` on it (`local-runtime.ts:387` for one failure path, and the `stop()`/`stopSidecarsForHardExit` paths for normal shutdown).
2. Every cleanup path that kills this child — `stopSidecarsForHardExit` (`4169-4193`), `will-quit`'s own sidecar teardown (comments at `9478,9498,9511-9512` name `localRuntime`/foreground-watcher/`fm-serve` explicitly) — is **JS code that only runs if the event loop is still running**. `before-quit`/`will-quit` are Electron *application-level* lifecycle events (they fire for `app.quit()`, Cmd+Q, the Dock "Quit" menu item), not OS-signal handlers.
3. There is no `process.on('SIGTERM', ...)` to convert an external termination request into `app.quit()`. Node's default action for an unhandled `SIGTERM` is immediate process termination — none of the cleanup above gets a chance to run. A `SIGKILL` (Activity Monitor "Force Quit", `kill -9`) can *never* be caught by any process, by definition, so no code fix helps there.
4. Since the child was never `detached`, when the parent dies (by either path above) without killing it first, it does not die with the parent — it is simply reparented to `launchd`/init, which is precisely **E2's observation**: two `llama-server` processes with `ppid=1`, alive 14+ hours after their Metis process should have been gone, plus orphaned `chrome_crashpad_handler` processes (Crashpad's own out-of-process handler, spawned by `crashReporter.start()`, has the identical no-detached-cleanup-only-on-graceful-exit shape).
5. There is **no boot-time reaper** — nothing at the top of `app.whenReady()` scans for and kills stale `llama-server`/`chrome_crashpad_handler` processes left over from a previous hard-kill (confirmed by grep: cleanup vocabulary — "orphan"/"reap"/"stale process" — appears only in comments describing the *graceful*-quit paths, never as a boot-time action).

**Why this is P1, not just cosmetic**: E1 shows the local model is a 3.3GB GGUF; two orphaned `llama-server` instances plus a fresh one from the new launch means up to 3× that model's resident memory competing for RAM at once, on top of Chromium's own footprint — directly feeding Tony's "heavy on the PC" complaint, and plausibly feeding the render-process-gone/unresponsive pattern in §4 (memory pressure → OS/Chromium kills a process → reload → immediately under pressure again → unresponsive). This is the connective tissue between E1, E2, E3, E6, E8, and E9 in one mechanism: **hangs cause hard-kills, hard-kills orphan sidecars, orphaned sidecars cause the next launch to be under more memory pressure, which makes the next launch more likely to hang** — a slow-building vicious cycle across the 8-relaunch day in E3.

**Fix** (two independent, additive changes, do both):
- **(a) Convert catchable termination signals into the existing clean-quit path**: `process.on('SIGTERM', () => app.quit())` (and `SIGINT` for dev/CI parity) near the two existing `process.on` registrations (`8949-8950`). This does nothing for `SIGKILL` (impossible by design) but recovers the entire graceful-shutdown path for `SIGTERM` — which covers `kill <pid>` without `-9`, many process-manager/OS-shutdown paths, and (per the "false-positive" concern in §3a) also means an OS-initiated *soft* termination during boot correctly clears the sentinel instead of looking like a native crash on the next launch.
- **(b) Add a boot-time sidecar reaper**: before or alongside `provisionLocalModel`/`ensureLocalModel` in the boot sequence, look for a previous session's `llama-server`/`chrome_crashpad_handler` processes that this app's own `userData`/lockfile can positively identify as *this app's* orphans (e.g., match on the binary path under this app's `Contents/Resources`, or have `local-runtime.ts` write its own child's pid to a small file next to `boot-incomplete.json` and have `beginBootWatch`'s caller check-and-kill any stale pid found there whose parent is no longer this app) and terminate them before spawning a new one. This is the direct fix for E2 and a meaningful dent in "heavy on the PC."

**Regression test**: (a) is a one-line, straightforwardly testable source-contract assertion ("`process.on('SIGTERM'` exists and calls `app.quit`"). (b) needs an integration-style test using a fake pidfile + a spawned no-op sleeper process standing in for `llama-server`, asserting the reaper kills a process it can prove is stale and does *not* kill an unrelated process that merely shares a port or name.

---

## 7. `onFatal`'s one-time dialog latch (P2)

**File:line**: `index.ts:3554,3562-3563`.

```ts
let fatalHandled = false
function onFatal(kind: ..., err: unknown): void {
  ...
  if (kind !== 'uncaughtException' || fatalHandled) return
  fatalHandled = true
  ... dialog ...
}
```

**OBSERVED**: `fatalHandled` is a module-level boolean, set once, never reset. By design ("offer a ONE-TIME relaunch"), the *first* `uncaughtException` in a session gets a dialog; every subsequent one, for the rest of that session — including a completely unrelated fault an hour later — is logged to `crash-*.log`/`audit.log` only. Combined with §2 (the same silent-logging path for every `unhandledRejection`, always), a session that has already shown one crash dialog and had the user click "Continue" has, from that point on, **zero user-facing signal for any further fatal error**, main-process-wide. If a second, different `uncaughtException` later leaves some subsystem in a broken state (e.g. an IPC handler that half-completed), the user experiences exactly "it's running but it's acting broken" with nothing in the UI explaining why.

**Fix**: the "don't nag on every transient error" intent is reasonable, but a hard one-shot latch for the *entire process lifetime* is too coarse. Rate-limit instead of latching: allow one dialog, then require e.g. 10 minutes of quiet before allowing another (a timestamp check, not a boolean), so a genuinely deteriorating session still gets a second chance to tell the user something is wrong.

**Regression test**: unit-test the (extracted, testable) gating predicate directly: first call → show; immediate second call → suppressed; second call after the cooldown window (with an injected clock) → show again.

---

## 8. `app.unresponsive` (kind=overlay): logged, never escalated (P2)

**File:line**: `index.ts:2719-2730`.

```ts
win.on('unresponsive', () => {
  if (win !== self) return
  mainLog.warn('[renderer-unresponsive] overlay renderer stopped responding')
  auditLog('app.unresponsive', { kind: 'overlay' })
})
win.on('responsive', () => {
  if (win !== self) return
  mainLog.info('[renderer-responsive] overlay renderer recovered')
})
```

The comment directly above (`2719-2721`) explains the deliberate choice not to auto-reload here ("Chromium recovers most stalls on its own, and a forced reload mid-meeting would drop the live transcript") — a legitimate, considered trade-off, not an oversight. But there is no *ceiling*: if the renderer never fires `'responsive'` again, the overlay sits wedged forever with nothing beyond a log line the user never sees. E6's own evidence — `app.unresponsive` firing 5 seconds after a `render-process-gone` reload — is a case where the "usually recovers on its own" assumption did not hold.

**Fix**: keep the no-auto-reload default (correct for the in-meeting case), but add a bounded escalation: if `'unresponsive'` has been the last-known state for more than e.g. 15-20 seconds with no `'responsive'` in between, surface a small, dismissible native notification ("Métis isn't responding — click to reload") rather than nothing. This preserves the "don't drop a live transcript" intent (it's a prompt, not an automatic action) while closing the "silently frozen forever" gap.

**Regression test**: extract the unresponsive/responsive state machine into a tiny, clock-injectable helper (`createUnresponsiveWatch(onEscalate, thresholdMs, now)`), and test: no escalation before the threshold, escalation once past it, no escalation if `'responsive'` arrives first, and no double-escalation on repeated late `'unresponsive'` events.

---

## 9. Minidump forensics (E7) — what `file`/`strings` can and cannot show

Per the task's ground rule: **no symbolication is available in this lane** (no `minidump-2-core`/breakpad tooling, no debug symbols). Everything below is limited to what `file` and `strings` can recover: the minidump's own module list and any plaintext embedded in it (env vars, argv, and — rarely — a pre-crash diagnostic string written before the crash, e.g. a dyld error). **No stack trace, no faulting thread, no register state, no exception code was recoverable this way.**

Three pending dumps exist, read-only, in `~/Library/Application Support/asktoto/Crashpad/pending/` (matches E7 exactly):

| File | mtime (local) | Size / streams | `_version` embedded | Process identified |
|---|---|---|---|---|
| `d007c83d-1b4d-4f87-9d99-de55e887719a.dmp` | 2026-07-30 17:18 | 14.2K / 8 streams | **1.3.0** | `Metis Helper` utility process, `--type=utility --utility-sub-type=video_capture.mojom.VideoCaptureService` |
| `f7f9b411-5ca1-41c6-94a6-5c0393a849fc.dmp` | 2026-08-04 21:51 | 1.6M / 9 streams | **1.3.0** | Unidentified from argv (no `--type=` string recovered); module list consistent with the main "Metis" process |
| `a858ba85-1039-4af2-8fbb-851cd26d71f6.dmp` | 2026-09-24 14:15 | 1.3M / 9 streams | **1.8.9** | Unidentified from argv; module list (`Metis`, `Electron Framework`, `Squirrel`, `ReactiveObjC`, `Mantle`, `libffmpeg.dylib`) consistent with the main process |

**None of the three is from the current HEAD build (1.9.6)** — the closest, `a858ba85`, is from 1.8.9. Treat all three as historical evidence about *classes* of crash this app has hit, not proof of a still-live bug at HEAD.

**The one genuinely actionable find** — `d007c83d` (Jul 30, `Metis Helper`/VideoCaptureService) — carries its crash reason **in plaintext**, because it's a dyld-level launch failure that gets written before any of the app's own frameworks (and hence any symbol table) even load:

```
Library not loaded: @rpath/Electron Framework.framework/Electron Framework
  Referenced from: <...> /Applications/Metis.app/Contents/Frameworks/Metis Helper.app/Contents/MacOS/Metis Helper
  Reason: tried: '/Applications/Metis.app/Contents/Frameworks/Electron Framework.framework/Electron Framework'
  (code signature in '.../Electron Framework' not valid for use in process: library load denied by system policy), ...
```

**OBSERVED, verbatim from the dump.** This is macOS Library Validation refusing to let the `Metis Helper` (video-capture utility) process load the main `Electron Framework` dylib because its code signature failed validation for that process — a packaging/code-signing defect, not a JS bug, and not something any of the JS-level error handling in this report could ever catch (the crashing process never got far enough to run any Métis code). A utility-process launch failure of exactly this kind is a very plausible *upstream* cause of some historical `desktopCapturer`/`getSources` failures (the utility process backing screen/video capture failing to even start would surface to the browser process as a capture-source failure) — **DERIVED, plausible, not proven**: I found no matching "Library not loaded" string in the two later (Aug/Sep) dumps to confirm recurrence past July 30.

**Cross-check against HEAD**: `build/entitlements.mac.plist` at HEAD already sets `com.apple.security.cs.disable-library-validation: true`, and `electron-builder.yml:210-212` sets `hardenedRuntime: true` with `entitlements`/`entitlementsInherit` pointing at it (inherited entitlements apply to nested helper apps like `Metis Helper`). **This strongly suggests the 1.3.0 build that produced `d007c83d` was missing this entitlement (or had a broken signing step), and HEAD's config should not reproduce it** — but this is a packaging/CI concern, not something provable by reading source; it should be verified by an actual `codesign --verify --deep` + launch test on a freshly-built, freshly-notarized 1.9.6 `.dmg`, ideally as a release gate (out of scope for this read-only lane; flagging for the packaging/release lane).

The other two dumps yielded only standard system-framework names (`AssertionServices`, `CrashReporterSupport`, `ANEClientSignals` — always-loaded macOS frameworks, not evidence of anything Métis-specific) and no exception/signal/assertion string — genuinely unsymbolicated, exactly as the task's ground rule anticipated.

**No macOS Crash Reporter `.ips` files exist** for Metis/Electron/AskToto anywhere under `~/Library/Logs/DiagnosticReports/` or its `Retired/` subfolder (checked both, zero matches). This means every crash this app has had that macOS's own crash reporter would normally catch either (a) was caught by Crashpad first (the three dumps above) and macOS's own reporter never engaged, or (b) genuinely didn't happen at the native-crash-reporter level (i.e., the observed "crashes" in `audit.log` are almost entirely the JS-level `app.crash` events from §2/§4/§5, not native OS-level crashes) — **DERIVED**, and consistent with this report's overall finding that most of what `audit.log` calls "crashes" are handled JS errors or renderer subprocess deaths, not native segfaults.

Minor, low-severity hygiene note (P3): `crashReporter.start({ uploadToServer: false })` (`index.ts:944`, confirmed by `crash-capture.test.ts:14-16`) means dumps are never uploaded and — per the empty `Crashpad/completed/` folder — never locally rotated either; they accumulate in `pending/` indefinitely (3 files over ~2 months here). Not a stability bug, but worth a periodic local prune (mirroring the existing `crash-*.log` keep-5 pruning at `index.ts:8913-8923`) so this doesn't grow unbounded over a long-lived install.

---

## 10. Proposed crash-resilience design (summary of §2–§8, ordered by leverage)

1. **Fix the audit taxonomy first** (§2) — cheap, zero behavior risk, and every other fix's regression tests benefit from `app.crash` meaning "the process actually died."
2. **Bound the render-process-gone reload loop and give it a visible failure surface** (§4) — directly targets the observed E6 sequence and is the highest-confidence fix for "it's running but it freezes."
3. **Give `ensureWindow()` a user-facing failure path after repeated retries** (§5) — directly targets Tony's #2 bug report; reuse the existing `onFatal` relaunch-dialog helper rather than adding a new one.
4. **SIGTERM → `app.quit()`, plus a boot-time orphan reaper** (§6) — breaks the hang→orphan→resource-pressure→hang cycle across E1/E2/E3/E8/E9; addresses "heavy on the PC" as a side effect.
5. **Separate "stop blocking App Nap" from "the boot sentinel is safe to delete"** (§3b) — restores the sentinel's original purpose without changing its false-positive-prone-but-narrow window in §3a; do this before trusting `boot-early-death`/`safe_start` counts for anything.
6. **Rate-limit (don't latch) the fatal-exception dialog, and add a bounded unresponsive-escalation notice** (§7, §8) — closes the "second failure in a session is invisible" gap.
7. **Packaging/release lane**: verify HEAD's code-signing actually satisfies Library Validation for `Metis Helper` end-to-end on a real notarized build (§9) — not fixable from source alone, but cheap to verify and would close off a whole historical crash class if still latent.

None of these require new architecture, new dependencies, or a redesign of the boot sequence — every fix is a small, local, testable change to a function that already exists.

---

## 11. Direct answers to the lane brief's questions

- **Is `boot-early-death` a real crash or a false positive from a force-quit before `registerIpc`?** Both are possible with today's code, but the far more consequential finding is structural, not timing: the sentinel's *close* point (near-instant, at `registerIpc`) has drifted away from the *dangerous* work it exists to bracket (the 15-second-delayed brain resume) — see §3b. Fix that first; it changes what "boot-early-death" even means before the false-positive-timing question is worth tuning further.
- **The "Failed to get sources." unhandledRejection path**: fixed at the call-site level by `getScreenSourcesWithRetry` (`screen-capture.ts:33-49`, three attempts + backoff, wraps both `desktopCapturer.getSources` call sites at `index.ts:3613-3620` and `index.ts:9112-9119`) — but even where unguarded, `unhandledRejection` never actually crashes the process (§2); the real bug is the misleading `app.crash` label, not a live crash risk from this specific string today.
- **render-process-gone handling — reload, recreate, or nothing?** Reload — unconditionally, every time, forever, with no reason check and no loop breaker (§4). This is a genuine gap, not a "nothing happens" gap.
- **app.unresponsive for the overlay?** Logged only; deliberately no auto-action (reasonable, to protect a live transcript), but with no ceiling/escalation if the stall never clears on its own (§8).
- **safe_start mode?** A well-scoped circuit breaker in intent, likely dormant in practice because of §3b — verify after fixing §3b before trusting its 2-vs-9 count as meaningful.
- **createWindow_retry?** This is `ensureWindow()` (§5) — the single strongest candidate for Tony's "click and nothing happens" report, because its failure path is completely silent to the user.
- **Global error handling (`process.on('uncaughtException'/'unhandledRejection')`)?** Present, registered exactly once (`index.ts:8949-8950`), reasonable default (keep-alive, one-time relaunch offer) — but the offer is spent forever after the first incident (§7), and there's no signal handler for external termination at all (§6).
- **Crash-recovery UX overall?** The consistent pattern across §4/§5/§7/§8 is: *the recovery logic exists and is usually sound, but every failure path terminates in a log line and nothing the user can see.* That's the single throughline of this entire lane.

---

## 12. Open items for the Opus planner / other lanes

- **Resource/perf lane**: confirm or refute the RAM-pressure hypothesis linking E1 (3.3GB local model) + E2 (orphaned sidecars) to the render-process-gone/unresponsive pattern in §4 — this lane found the code-level mechanism but not memory telemetry to prove the trigger.
- **Packaging/release lane**: verify Library Validation / code-signing for `Metis Helper` end-to-end on a real notarized 1.9.6 build (§9) — cannot be verified from a read-only source checkout.
- **E5 (capture.failed × 5394, "Screen Recording permission is off", phase=bg-screen)**: at HEAD this loop is correctly gated off by `captureAllowed()`/`screenCaptureGranted()` (`screen-preprocess.ts:196,198-202`, wired live via `systemPreferences.getMediaAccessStatus('screen')` at `index.ts:3893-3896`) — if permission is truly off, `eligible()` returns `false` and `getScreenshot('bg-screen')` is never called. This evidence is almost certainly from **before** the `cb5b4ef0` (2026-08-19) "close 6 defects in the screen-ask path" fix landed; whichever lane owns E5 should confirm the exact date against that commit rather than re-diagnose it as a live bug at HEAD.
