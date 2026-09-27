# M2-0026 design: one ordered stopAll() for every exit path (will-quit, emergency hard exit, onFatal relaunch), SIGKILL ffmpeg cancel, QA-only fault hook

Designer: Opus. Base: `56292fb6` (m2/integration head, post-rewrite). Branch `m2/M2-0026-sidecar-stopall`.
Worktree `metis-wt-M2-0026`. No remote branch and no PR exist yet (checked with `gh`).
Status: design only. The implementer (Sonnet) follows this file.
Findings: B2-F1, B3-RC5, L01-F2, L01-F6, L02-F2, L02-F6, L02-REFACTOR-2, GH-PR-189, K09-R30. Decisions: PD-02,
ADR-001, ADR-003. Interface inherited from M2-0187 design §9 A2 (the `METIS_QA_IDENTITY` define).

## 0. Why this design, in one paragraph

Sidecars outlive Métis whenever an exit path skips the teardown someone wrote by hand. Two JS paths call
`app.exit()`, and `app.exit()` skips `before-quit` and `will-quit`:
- the emergency hard exit, which carries a copy of the teardown (`stopSidecarsForHardExit`, `index.ts:4195`);
- onFatal's "Relaunch Métis" (`index.ts:3601-3602`), which carries none. This orphans a 3.1 GB llama-server
  every time (B2-F1 CONFIRMED).

Neither list includes the ffmpeg import decoder. The fix is structural and small:
- index.ts declares **one** ordered list of owned child-process families, once, through `createStopAll`
  (new `infra/process/stop-all.ts`).
- A new `lifecycle/exit-paths.ts` owns the three ways the process ends on purpose. It registers the **first**
  `will-quit` listener, and it holds the only two `app.exit()` calls in `src/main`, each immediately after
  `stopAll()`.
- `stopAll` only sends signals and never waits, so no exit path can hang on it.
- The ffmpeg decoder's `cancel()` becomes a synchronous SIGKILL of **both** of its children. That departs from
  the acceptance's "SIGTERM, SIGKILL after 2 s", because an escalation timer never fires on an exit path, and
  exit paths are the ones this ticket is about.
- utilityProcess hosts (Parakeet, Whisper, speaker embedding) stay out of the list. Electron ends them on quit
  and on exit alike (ADR-003: "utilityProcess left to Chromium but always tested"). Their release functions are
  async and owner-arbitrated. The packaged census checks them. **This departs from the lead note**, which asked
  for them in `stopAll()` (see §5 and §6 A1).
- The packaged proof needs a way to inject a real `uncaughtException`. Following M2-0187 A2, only the
  QA-identity build compiles in a SIGUSR2 fault hook, behind a Vite `define` keyed on `METIS_QA_IDENTITY=1`
  (M2-0027 reuses the same constant). `check-packaged-runtime.mjs` fails any package whose hook presence
  does not match its identity.
- A census script proves 0 surviving owned processes after the onFatal relaunch, and again after a
  SIGTERM-driven will-quit.
- Every old source-text pin on these handlers is deleted. Behaviour tests with real stand-in child processes
  replace them (FF-07).

## 1. Invariants

**INV-LIST (one list).** On exit, owned child processes are torn down in one place only: `stopAllSidecars()`,
built once in index.ts by `createStopAll([...])`. No exit path names a sidecar directly. The order is:

| # | name | stops | processes |
|---|---|---|---|
| 1 | `screen-preprocess` | `screenPreprocess.stop()` | the foreground watcher it owns: `metis-mac-helper watch-frontmost` (macOS) or the pinned PowerShell watcher (Windows) |
| 2 | `import-decoders` | `decoder.cancel()` for each running ffmpeg decode | ffmpeg decode + ffmpeg duration probe |
| 3 | `local-runtime` | `localRuntime.stop()` | llama-server |
| 4 | `fm-runtime` | `fmRuntime.stop()` | `/usr/bin/fm serve` |

The order puts producers of local-model work (screen pre-analysis, imports) before the runtimes they feed.

**INV-MEMBER (what belongs in the list).** A family is listed when all three hold:
- this app spawns it with `child_process`;
- the OS does not end it together with the app;
- it can outlive the request that started it.

Per-request commands stay out: mac-helper OCR, screen-metrics and stat-flags, Apple Speech one-shots, the
`fm available` probe, CLI asks and installers. They are bounded by their own SIGKILL timeouts or by the request,
and they are "command" ownership in C1 (M2-0027/0028). utilityProcess hosts stay out too, because Chromium owns
them (ADR-003).

**INV-EXIT (every exit path).** Every `app.exit()` in `src/main` lives in `lifecycle/exit-paths.ts`, and each
one is immediately preceded by `stopAll()`. Every `app.quit()` reaches `will-quit`, and the first `will-quit`
listener runs `stopAll()`. Nothing else in `src/main` calls `app.exit()`. The implementer confirms this with
`grep -rn "app\.exit(" src/main` after the change: the only hits are in `exit-paths.ts`.

**INV-FIRST (listener order).** index.ts calls `installExitPaths` at module top level. That puts its `will-quit`
listener ahead of index.ts's own handler (`:9501`) and ahead of every runtime-registered listener (transcripts,
auth, updater). So a throwing listener can never skip the sidecar kill, and the M2-0006 clean-shutdown marker is
still written after the sidecars are stopped.

**INV-BOUNDED.** `stopAll()` is synchronous. It only signals:
- SIGKILL for llama-server, fm serve and ffmpeg;
- SIGTERM for the foreground watcher, which installs no handler (`native/mac-helper/main.swift` has no signal
  code);
- TerminateProcess for all of them on Windows.

It never awaits a child. So it finishes in bounded time with a wedged renderer or a hung child, and it can run
inside `will-quit` and directly before `app.exit()`.

**INV-ISOLATED.** Each family's `stop()` runs in its own try. A throw is logged as
`[stop-all] <name> failed to stop` and never skips a later family. The hard exit still exits if closing the
boot watch throws.

**INV-IDEMPOTENT.** `stopAll()` holds no state. Every family `stop()` is idempotent, so a second run is harmless.
That covers `will-quit` followed by the emergency watchdog, and a second emergency press.

**INV-QUIET-BEFORE-QUIT.** `before-quit` never stops a sidecar. A live meeting may still flush for 2 s, and the
quit can be deferred or cancelled.

**INV-FFMPEG.** `FfmpegDecoder.cancel()` aborts one `AbortController`. Node then SIGKILLs every ffmpeg the decode
started (the decode and its duration probe) at once. A duration probe abandoned at its 5 s deadline is SIGKILLed
too. After `cancel()`, `completed` settles and `onError` is not called.

**INV-QA-HOOK.** `QA_IDENTITY_BUILD` is a compile-time literal:
- It is `true` only when `METIS_QA_IDENTITY=1` is set on the `npm run build` inside `dist:qa-identity`.
- The SIGUSR2 fault hook runs only under `if (QA_IDENTITY_BUILD)`, so rollup drops it from every other bundle.
- `check-packaged-runtime.mjs` fails a package whose main bundle carries the hook marker unless the packaged
  `package.json` name is `asktoto-qa`.
- It also fails an `asktoto-qa` package that lacks the hook.

**INV-NO-REFUTED (PD-02).** No `process.on('SIGTERM')`, no `detached`, no `process.on('exit')` or
`app.on('quit')` backstop. The SIGUSR2 hook is not a termination handler, and shipping bytes never contain it.

## 2. Exit-path inventory (what reaches stopAll, and how it is proven)

| Exit path | How the process ends | Sidecars stopped by | Proof |
|---|---|---|---|
| Tray "Quit Métis", Cmd+Q, Settings Quit (`IPC.windowQuit`), "Restart" after a Screen Recording grant (`IPC.windowRelaunch`: relaunch + quit), selftest, second instance | `app.quit()` → `before-quit` (may defer 2 s for a live meeting) → `will-quit` | first `will-quit` listener → `stopAll()` | E1 |
| Update "Restart & install" (`IPC.updateInstall`) | electron-updater `quitAndInstall`. Windows/Linux: `BaseUpdater` calls `app.quit()` (OBSERVED in `node_modules/electron-updater/out/BaseUpdater.js:13-22`). macOS: Electron's native `autoUpdater.quitAndInstall()` closes the windows and quits (Electron docs; ASSUMED) → `will-quit` | same | E1 (the real update restart is not run: R3) |
| `autoInstallOnAppQuit` | installs during a normal quit | same | E1 |
| External SIGTERM / SIGINT / SIGHUP | Electron maps these to `app.quit()` → `will-quit` (B3-RC5 experiment on Electron 43.6.0) | same | packaged phase 2 (SIGTERM) |
| macOS logout or shutdown | NSApplication terminate → quit → `will-quit` | same | not run (R3) |
| Emergency quit (Cmd+Ctrl+Esc, tray "Force Quit Métis"), polite part | `app.quit()` → `will-quit` | same | F1 |
| Emergency quit after the 4 s grace, or a second press | `app.exit(0)`, which skips `will-quit` | `hardExit`: `stopAll()`, then close the boot watch, then `app.exit(0)` | F3, F4, F5 |
| onFatal "Relaunch Métis" | `app.relaunch(); app.exit(0)`, which skips `will-quit` | `exitAndRelaunch`: `stopAll()` first | E3 + packaged phase 1 |
| Force Quit / `kill -9` / native crash / OS watchdog | uncatchable; no JS runs | nothing can run here | M2-0027 (reaper), M2-0028 (supervise) |
| Windows logoff or shutdown | the OS ends every user process | n/a | n/a |

A renderer crash or GPU crash is not an exit (M2-0037). An `unhandledRejection` never offers a relaunch.

## 3. Code changes per file

### 3.1 `src/main/infra/process/stop-all.ts` (NEW; the directory is new)

```ts
/**
 * The one teardown of the child processes this app owns. Every exit path runs it (lifecycle/exit-paths.ts):
 * will-quit, the emergency hard exit and the relaunch after a fatal error. It only sends signals and never
 * waits, so it finishes in bounded time even when a renderer or a child is hung, and running it again is
 * harmless.
 */

/** A family of child processes the OS does not end together with this app. */
export interface OwnedChildren {
  /** Stable name for the failure log. */
  readonly name: string
  /** Signal every live child of the family to terminate. Synchronous and idempotent; never starts one. */
  readonly stop: () => void
}

/**
 * Build stopAll(): stop each family in list order. A family whose stop() throws is reported through onError
 * and never keeps a later family running.
 */
export function createStopAll(
  families: readonly OwnedChildren[],
  onError: (name: string, error: unknown) => void
): () => void {
  return () => {
    for (const { name, stop } of families) {
      try {
        stop()
      } catch (error) {
        onError(name, error)
      }
    }
  }
}
```

It imports nothing. That respects `infra ↛ features` (ARCHITECTURE §2.3): the list, which names app features,
is composed in index.ts.

### 3.2 `src/main/lifecycle/exit-paths.ts` (NEW; M2-0037's branch also creates `lifecycle/`)

```ts
/**
 * Every deliberate way this process ends, each routed through one stopAll() (infra/process/stop-all.ts).
 *
 * app.quit() reaches will-quit, where the listener installed here stops every owned child. app.exit() skips
 * before-quit and will-quit, so the two paths that call it, the emergency hard exit and the relaunch after a
 * fatal error, run stopAll() themselves, immediately before app.exit(). This module holds the only
 * app.exit() calls in src/main. Nothing here waits for a child: SIGKILL needs no confirmation, and a quitting
 * process must never hang on one.
 */

/** The part of Electron's `app` the exit paths drive. */
export interface ExitApp {
  on(event: 'will-quit', listener: () => void): unknown
  quit(): void
  exit(exitCode: number): void
  relaunch(): void
}

export interface ExitPathDeps {
  /** Stop every owned child process. */
  stopAll: () => void
  /** Mark this exit as deliberate, so the next boot does not count it as an early death. */
  closeBootWatch: () => void
  warn: (...args: unknown[]) => void
}

export interface ExitPaths {
  /** The emergency quit (Cmd+Ctrl+Esc and the tray item). It is polite first: before-quit still flushes a live
   *  meeting. It exits hard after the grace, or at once on a second press. */
  forceQuit: () => void
  /** Exit now and start a fresh instance (onFatal's "Relaunch Métis"). A fatal is not a deliberate exit, so the
   *  boot watch stays open: a fatal during boot still counts as an early death. */
  exitAndRelaunch: () => void
}

/** before-quit gives a live meeting 2 s to flush, so the emergency quit stays polite for longer than that. Past
 *  it, politeness is the bug: a wedged renderer never answers the flush and can keep the quit from completing. */
const EMERGENCY_FORCE_QUIT_GRACE_MS = 4000

/**
 * Register the will-quit teardown and build the two app.exit() paths. index.ts calls this once, at module top
 * level, so this will-quit listener is the first: a throwing listener registered later cannot skip it.
 */
export function installExitPaths(app: ExitApp, { stopAll, closeBootWatch, warn }: ExitPathDeps): ExitPaths {
  app.on('will-quit', () => stopAll())

  const hardExit = (): void => {
    stopAll()
    try {
      closeBootWatch()
    } catch (error) {
      warn('[force-quit] closing the boot watch failed', error)
    }
    app.exit(0)
  }

  let watchdog: NodeJS.Timeout | null = null
  return {
    forceQuit: () => {
      // A second press means the first one did not get the process down. Stop asking.
      if (watchdog) {
        warn('[lifecycle] emergency quit pressed again — exiting now')
        hardExit()
        return
      }
      warn('[lifecycle] emergency graceful quit requested')
      app.quit()
      watchdog = setTimeout(() => {
        warn('[lifecycle] graceful quit did not complete — forcing exit')
        hardExit()
      }, EMERGENCY_FORCE_QUIT_GRACE_MS)
      // The watchdog must never be the handle that keeps a quitting process alive.
      watchdog.unref()
    },
    exitAndRelaunch: () => {
      stopAll()
      app.relaunch()
      app.exit(0)
    }
  }
}
```

- The log lines are the existing ones, so field logs stay comparable.
- `EMERGENCY_FORCE_QUIT_GRACE_MS` stays module-private. The tests pin the behaviour window: no hard exit at
  2 000 ms, a hard exit by 5 000 ms.
- Type note: Electron's `App` is assignable to `ExitApp`. It has a `will-quit` overload, and its `exit`
  parameter is optional. Confirm with `npx tsc --noEmit -p tsconfig.node.json`. If TypeScript picks the wrong
  overload, use `type ExitApp = Pick<App, 'on' | 'quit' | 'exit' | 'relaunch'>` with `import type { App } from
  'electron'`. It is a type-only import and the test fake is unchanged.

### 3.3 `src/main/index.ts` (declaration + call-site swaps; hot file, M2-0188 order)

1. **Imports**, next to `import { createScreenPreprocess … } from './screen-preprocess'` (`:506`):
   ```ts
   import { createStopAll } from './infra/process/stop-all'
   import { installExitPaths } from './lifecycle/exit-paths'
   import { QA_IDENTITY_BUILD, installQaFaultHook } from './qa-identity'
   ```

2. **onFatal (`:3600-3603`).** Replace
   ```ts
       if (choice === 0) {
         app.relaunch()
         app.exit(0)
       }
   ```
   with `if (choice === 0) exitAndRelaunch()`. Nothing else in onFatal changes. M2-0037 converts the dialog to
   async later and keeps this exact call.

3. **Force-quit block (`:4182-4238`).** Keep the accelerator comment and constant (`:4176-4180`). Delete, from
   the "`before-quit` gives a live meeting 2s" comment through the end of `forceQuitMétis`:
   - `EMERGENCY_FORCE_QUIT_GRACE_MS` and its comment;
   - `let emergencyQuitWatchdog`;
   - `stopSidecarsForHardExit` and its doc comment;
   - `forceQuitMétis`.

   Insert in their place:
   ```ts
   // Every child process this app spawns that the OS does not end with it, in teardown order: the producers of
   // local-model work (screen pre-analysis, which owns the foreground watcher, and import decodes) before the
   // runtimes they feed. utilityProcess hosts (Parakeet, Whisper, speaker embedding) are not here: Electron ends
   // them on quit and exit alike (ADR-003), and the packaged census checks it.
   const stopAllSidecars = createStopAll(
     [
       { name: 'screen-preprocess', stop: () => screenPreprocess.stop() },
       { name: 'import-decoders', stop: () => ffmpegDecoders.forEach((decoder) => decoder.cancel()) },
       { name: 'local-runtime', stop: () => localRuntime.stop() },
       { name: 'fm-runtime', stop: () => fmRuntime.stop() }
     ],
     (name, error) => mainLog.warn(`[stop-all] ${name} failed to stop`, error)
   )

   const { forceQuit: forceQuitMétis, exitAndRelaunch } = installExitPaths(app, {
     stopAll: stopAllSidecars,
     closeBootWatch: () => {
       setBootPowerSaveBlock(false)
       endBootWatch(app.getPath('userData'))
     },
     warn: (...args) => mainLog.warn(...args)
   })
   ```
   - Keeping the binding name `forceQuitMétis` leaves `registerEmergencyForceQuitShortcut` (`:4243`), the tray
     item (`:4447`) and the c-main-fixes registration pin unchanged.
   - The order at module evaluation is safe. `screenPreprocess` (`:3886`) and `ffmpegDecoders` (`:1120`) are
     declared earlier, and the list reads them lazily. `onFatal` (`:3585`) refers to `exitAndRelaunch`, which
     is declared later, but it can only run after `whenReady` has registered the process handlers. By then the
     module top level has finished. `setBootPowerSaveBlock` and `endBootWatch` are hoisted function
     declarations or imports.

4. **will-quit handler (`:9501`).**
   - Delete the three sidecar steps and their comments: the screen-preprocess step (`:9537-9543`), the
     `localRuntime.stop()` step and the `fmRuntime.stop()` step (`:9544-9557`).
   - Replace the two comment lines at `:9517-9518` ("Each cleanup step is independent … the worse failure.")
     with:
     ```ts
     // Each cleanup step is independent (its own try), so one throw never skips the rest. Owned sidecars are
     // already stopped: installExitPaths registered the first will-quit listener (lifecycle/exit-paths.ts).
     ```
   - The M2-0006 `shutdownClean` step stays last, unchanged.

5. **whenReady (after `:8981`, the two `process.on(...)` fatal handlers):**
   ```ts
   // QA-identity builds only (compiled out of every other bundle): the packaged exit-path proof sends SIGUSR2
   // to raise a real uncaughtException through onFatal.
   if (QA_IDENTITY_BUILD) installQaFaultHook()
   ```

6. **Comment only (`:1428-1429`, ffmpeg `onError`):** replace "cancel() sends SIGTERM so it can't leak as an
   orphaned OS process" with "cancel() kills it so it cannot leak as an orphaned OS process". The code is
   unchanged.

Net: about 75 lines removed and 30 added. No other line of index.ts changes.

### 3.4 `src/main/ffmpeg-decoder.ts` (L02-F6, L01-F2 ffmpeg part)

- **Interface doc:**
  ```ts
  export interface FfmpegDecoder {
    /** Kill the decode and its duration probe at once (SIGKILL). Idempotent; `completed` then settles without
     *  calling onError. */
    cancel(): void
    completed: Promise<void>
  }
  ```
- **`probeDurationSeconds(executable, sourcePath, signal: AbortSignal)`:**
  - spawn options gain `signal, killSignal: 'SIGKILL'`;
  - the deadline body becomes `child.kill('SIGKILL'); finish(null)`, which drops the `!child.killed` guard,
    since `kill` on an exited child is a no-op;
  - add one doc sentence: "A probe abandoned at its deadline is SIGKILLed, so a probe stuck reading a
    cloud-only file never outlives the import."
- **`startFfmpegDecode`:**
  ```ts
  // cancel() aborts this, and Node SIGKILLs every ffmpeg this decode started: the decode and its duration
  // probe. SIGKILL, not SIGTERM: ffmpeg writes only into our pipe, so a graceful stop has nothing to flush, and
  // SIGTERM is only a request that a child blocked in write() on an unread pipe may never act on. It is also
  // the only signal that still works on the exit paths, where no escalation timer would ever fire.
  const abort = new AbortController()
  ```
  - The decode `spawn` gains `signal: abort.signal, killSignal: 'SIGKILL'`.
  - `probeDurationSeconds(executable, sourcePath, abort.signal)`.
  - Delete `let cancelled = false`. Replace its three reads with `abort.signal.aborted`: after the probe, after
    `await close`, and in the outer `.catch`.
  - `cancel: () => abort.abort()`.
- Why no other change is needed:
  - On abort, Node emits `'error'` (AbortError) on each child. Both already have a synchronous `'error'`
    listener. The probe's listener resolves `null`. The decode's listener records `spawnError`, and
    `once(child, 'close')` rejects. The outer catch then sees `aborted` and skips `onError`.
  - MQA-063's spawn-failure path is unchanged.
- The early `IMPORT_NOT_MEDIA` return keeps its no-op `cancel`.

### 3.5 `src/main/qa-identity.ts` (NEW)

```ts
declare const __METIS_QA_IDENTITY__: boolean

/**
 * True only in the QA-identity build: package.json's dist:qa-identity sets METIS_QA_IDENTITY=1, which
 * electron.vite.config.ts compiles in as a literal. Every branch it guards is dropped from shipping bytes, and
 * scripts/check-packaged-runtime.mjs proves it on each package.
 */
export const QA_IDENTITY_BUILD: boolean = __METIS_QA_IDENTITY__

/**
 * QA-identity builds only. SIGUSR2 raises a real uncaughtException, so the packaged exit-path proof
 * (scripts/qa/fault-fatal-relaunch.mjs) drives onFatal exactly as a production fault would.
 */
export function installQaFaultHook(): void {
  process.on('SIGUSR2', () => {
    throw new Error('METIS_QA_FAULT_HOOK: injected uncaughtException')
  })
}
```

- It sits beside `dev-env.ts`, which is the same kind of gate: one decision in one place.
- It imports nothing, so a scripts test can import it.
- In the shipping build, `QA_IDENTITY_BUILD` is the literal `false`. Rollup folds `if (QA_IDENTITY_BUILD)` away
  and then drops the unreferenced `installQaFaultHook` together with its marker string. The packaged gate
  (§3.7) proves the result on real bytes, in both directions.
- SIGUSR2 is unused by Node (the inspector uses SIGUSR1) and by Electron's POSIX shutdown handler (SIGINT,
  SIGTERM, SIGHUP). That is ASSUMED. The packaged proof fails loudly if the signal does not reach onFatal: no
  dialog appears.

### 3.6 `electron.vite.config.ts`, `vitest.config.ts`, `package.json`

- **`electron.vite.config.ts`.** Add a separate constant next to `MAC_UNIVERSAL`. Do not touch the
  `MAC_UNIVERSAL` or `bytecode: !MAC_UNIVERSAL` lines, which `release-gates.test.ts:116-117` pins.
  ```ts
  // The QA-identity build and no other (package.json dist:qa-identity sets METIS_QA_IDENTITY=1). Compiled in as
  // a literal, so every branch guarded by QA_IDENTITY_BUILD (src/main/qa-identity.ts) is dropped from shipping
  // bytes; scripts/check-packaged-runtime.mjs verifies that on every package.
  const QA_IDENTITY = process.env.METIS_QA_IDENTITY === '1'
  ```
  Add `define: { __METIS_QA_IDENTITY__: JSON.stringify(QA_IDENTITY) }` to the `main` block, beside `build`.
- **`vitest.config.ts`.** Add `define: { __METIS_QA_IDENTITY__: 'false' }` to `vitestConfig`, with the comment
  "Tests see the shipping value; the QA branch is exercised directly (scripts/lib/qa-fault-hook.test.ts)."
  - ASSUMED: vitest 4.1 applies top-level `define` to modules under test.
  - Q5 imports `qa-identity.ts`. If the define is missing, Q5 fails with a ReferenceError in CI. In that case,
    stop and report rather than inventing a workaround.
- **`package.json`, `dist:qa-identity` only.** Replace `ASKTOTO_MAC_UNIVERSAL=1 npm run build` with
  `METIS_QA_IDENTITY=1 ASKTOTO_MAC_UNIVERSAL=1 npm run build`. The new variable must come **first**:
  `release-gates.test.ts:128` requires the substring `ASKTOTO_MAC_UNIVERSAL=1 npm run build` in every
  universal chain. No other script changes. `qa-candidate.yml` already runs `npm run dist:qa-identity`.

### 3.7 `scripts/lib/qa-fault-hook.mjs` (NEW) and `scripts/check-packaged-runtime.mjs`

```js
import { extractFile, listPackage } from '@electron/asar'

/** The string only the QA fault hook (src/main/qa-identity.ts) puts into a main-process bundle. */
export const QA_FAULT_MARKER = 'METIS_QA_FAULT_HOOK'
/** The packaged package.json name of the QA-identity variant (build/qa-identity.electron-builder.yml extraMetadata). */
export const QA_IDENTITY_PACKAGE_NAME = 'asktoto-qa'

/**
 * Fail unless the packaged main process carries the QA fault hook exactly when the package is the QA identity:
 * a shipping package must never contain it, and a QA package without it cannot run the packaged exit-path proof.
 */
export function assertQaFaultHookMatchesIdentity(archive) {
  const qaIdentity = JSON.parse(extractFile(archive, 'package.json').toString('utf8')).name === QA_IDENTITY_PACKAGE_NAME
  const mainFiles = listPackage(archive)
    .map((entry) => entry.replace(/\\/g, '/').replace(/^\/+/, ''))
    .filter((entry) => /^out\/main\/.+\.(?:c?js|jsc)$/.test(entry))
  const carriesHook = mainFiles.some((entry) => extractFile(archive, entry).includes(QA_FAULT_MARKER))
  if (carriesHook !== qaIdentity) {
    throw new Error(
      qaIdentity
        ? 'The QA-identity package lacks the QA fault hook. Build it with METIS_QA_IDENTITY=1 (package.json dist:qa-identity).'
        : 'A shipping package carries the QA fault hook. Only dist:qa-identity may set METIS_QA_IDENTITY=1.'
    )
  }
  return { qaIdentity }
}
```

- The implementer mirrors `verifyPackagedDependencyPruning`'s handling of asar paths (`:130-160`). The host's
  separator is normalized before matching, and `extractFile` takes the normalized relative path. Check that
  Windows `listPackage` output round-trips through `extractFile` the same way the existing code does.
- Also match `.jsc`. The Windows bundle is V8 bytecode, and a one-byte string literal is serialized verbatim in
  the code cache (ASSUMED). The load-bearing proof is macOS, where both variants ship plain JS.
- **`check-packaged-runtime.mjs`.** Import the function. Just before the final `console.log`, for both targets:
  ```js
  const { qaIdentity } = assertQaFaultHookMatchesIdentity(join(resourcesRoot, 'app.asar'))
  console.log(`[check:packaged-runtime] OK ${qaIdentity ? 'the QA-identity package carries' : 'the shipping package lacks'} the QA fault hook`)
  ```
  No new flag is needed. `after-pack.mjs` runs this script for every sub-build of every chain, and the
  `dist*` chains run it again post-sign. So every package is checked against its own identity.

### 3.8 `scripts/qa/fault-fatal-relaunch.mjs` (NEW, QA account only, never run by an agent on the owner's account)

**Contract:**

```
node scripts/qa/fault-fatal-relaunch.mjs --zip <Metis-QA-<v>.zip> --sha256 <hex> [--port 9334] [--out <evidence.json>]
exit 0 PASS · 1 FAIL (a survivor, a stray, no relaunch, no dialog) · 2 PRECONDITION (not run: wrong host/identity/state)
```

**Exported pure helpers** (unit-tested in §4.5). The main flow runs only when the script is executed directly:
`if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()`.

```js
/** One row of `ps -axo pid=,ppid=,lstart=,command=` under LC_ALL=C. lstart has a fixed shape, which anchors the
 *  split between the start time and a command that may contain spaces. */
const PS_ROW = /^\s*(\d+)\s+(\d+)\s+(\w{3} \w{3} [ \d]\d \d\d:\d\d:\d\d \d{4})\s+(.*)$/
export function parsePs(text)                      // → [{ pid, ppid, started, command }]
export function descendantsOf(processes, rootPid)  // every process below rootPid, any depth, root excluded
export function survivors(before, now)             // entries of `before` alive in `now` with the same pid AND start time
export function classify(command, bundle)          // content-free class, never the command itself (below)
export function strays(now, bundle)                // ppid 1, classified, not 'main': orphans from the bundle or fm serve
```

`classify` returns one of these classes:
- `llama-server` for `<bundle>/Contents/Resources/llama/`
- `mac-helper` for `…/Resources/mac-helper/`
- `ffmpeg` for `…/Resources/ffmpeg/`
- `fm-serve` for a command starting `/usr/bin/fm serve`
- `utility-process` for a command containing `--utility-sub-type=node.mojom.NodeService`
- `electron-helper` for any other `--type=` process inside the bundle
- `main` for `<bundle>/Contents/MacOS/`
- `other` for anything else

**`main()` flow:**
1. Refuse (exit 2) unless `process.platform === 'darwin'`.
2. Hash the zip. Refuse unless its sha256 equals `--sha256`.
3. `ditto -x -k` the zip into a fresh `mkdtemp(os.tmpdir())` directory.
4. Refuse unless `plutil -extract CFBundleIdentifier raw <app>/Contents/Info.plist` is
   `com.mantu.asktoto.qa`. Never run against the shipping identity: without the hook, SIGUSR2's default action
   would kill main.
5. Refuse if any `Metis QA` main process is already running.
6. Refuse unless `osascript -e 'tell application "System Events" to count processes'` succeeds. The hint is: the
   runner needs Accessibility (M2-0007 TCC runbook).
7. **Phase 1, onFatal relaunch:**
   1. Launch with `open -n -a <app> --args --remote-debugging-port=<port>`.
   2. Resolve the main pid: a `main`-class process, no `--type=`, newest start, found within 30 s.
   3. Connect with `playwright-core` `chromium.connectOverCDP`. On the page that exposes `window.toto`,
      evaluate `window.toto.localPrewarm('M2-0026 fault proof')`.
   4. Wait up to 120 s for an `llama-server` descendant of main. If none appears, exit 2: the seeded profile
      needs the local LLM on with its model present (M2-0007).
   5. Snapshot `descendantsOf(ps, main)`.
   6. `process.kill(main, 'SIGUSR2')`.
   7. Click "Relaunch Métis" with System Events: `click button "Relaunch Métis" of window 1 of (first process
      whose unix id is <pid>)`. Retry every 500 ms for up to 15 s. If it never succeeds, FAIL "no fatal dialog".
   8. Wait up to 15 s for the old main to exit, then sleep 10 s.
   9. Take the census: `survivors(snapshot, ps)` and `strays(ps, bundle)`.
   10. A relaunched `main` must exist, started after the old one. Otherwise FAIL "no relaunch".
8. **Phase 2, SIGTERM → will-quit, on the relaunched instance:**
   1. Reconnect CDP. `app.relaunch()` reuses argv, so `--remote-debugging-port` carries over. Prewarm again and
      wait up to 120 s for llama-server. If it does not appear, record `llamaServer: false` and continue.
   2. Snapshot, then `process.kill(newMain, 'SIGTERM')`.
   3. Wait up to 20 s for the exit, sleep 10 s, and take the census again.
9. Write the evidence and remove the extraction directory. The script never kills anything except the two
   signals above to the QA main it started. Survivors are reported by pid and class for a human to look at.

**Evidence JSON.** It is content-free: no paths, no command lines.

```json
{ "ticket": "M2-0026", "candidate": { "zipSha256": "…", "bundleId": "com.mantu.asktoto.qa", "version": "…" },
  "phases": [
    { "path": "onFatal-relaunch", "owned": { "llama-server": 1, "electron-helper": 3, "mac-helper": 1 },
      "oldMainExitMs": 900, "survivors": [], "strays": [], "relaunched": true },
    { "path": "sigterm-will-quit", "owned": { … }, "llamaServer": true, "survivors": [], "strays": [] } ],
  "result": "PASS" }
```

### 3.9 Comment and bookkeeping edits

- `src/main/llm/fm-runtime.ts:368`: "Wired into will-quit beside localRuntime.stop()." becomes "Every exit path
  stops it through the stopAll() list in index.ts."
- `scripts/check-skipped-tests.mjs`:
  - `BASELINE.win32` goes from `12` to `13`, for D1, which is POSIX-only.
  - Append to the `ffmpeg-decoder.test.ts` reason: " The cancel test's SIGTERM-immune stand-in is a POSIX shell
    script; Windows has no signals to ignore (kill is TerminateProcess), so it runs on linux and darwin only."
  - This script is not in CI. Keep it truthful anyway, as M2-0191 did.

### 3.10 Source-text pins removed (FF-07; "the source-text pins for these handlers are replaced")

| File | Change | Replaced by |
|---|---|---|
| `src/main/emergency-force-quit.test.ts` | **delete** (it evaluates `index.ts` function text in a `vm`) | F1-F6 |
| `src/main/c-main-fixes.contract.test.ts` | in `describe('emergency force quit remains available…')`: from test 1, delete the comment, the `quitFn` slice and its two `expect`s (`:107-114`), keep the registration and tray-label pins (the label pin is `:115`), and retitle it "registers Ctrl+Cmd+Esc on macOS outside user-configurable shortcuts"; delete test 2 (`:118-138`) and test 3 (`:140-161`). At `:70`, change "(SIGTERM to the still-alive ffmpeg child)" to "(kill the still-alive ffmpeg child)" | F1-F5, E3 |
| `src/main/will-quit-guard.test.ts` | delete tests 3 and 4 (sidecar kill independence, fm in its own try); in test 2, end the segment at `handler.indexOf('if (notifTimer)')` instead of `localRuntime.stop()`, and update its comment and the slice comment (`:20-22`) | E1, S2 |
| `src/main/llm/local-runtime.test.ts` | delete `describe('will-quit wiring (index.ts) — F3')` (`:241-253`); its imports stay in use | E1 |

`will-quit-guard.test.ts` tests 1-2 and the rest of `c-main-fixes` are pins on other concerns: the MQA
`globalShortcut` crash guard and the shortcut registration. They stay. Converting them belongs to the ticket that
extracts those handlers (M2-0065). The `mqa-175` will-quit slice (`setBootPowerSaveBlock(false)`,
`endBootWatch(`) still matches, because those steps stay at the top of the handler.

### 3.11 Files explicitly NOT changed

| File | Why not |
|---|---|
| `src/main/mac-helper.ts`, `src/main/foreground-watcher.ts` | The watcher's `stop()` already cancels restarts and kills its child, and it is idempotent. It is owned by, and stopped through, `screen-preprocess`. |
| `src/main/llm/local-runtime.ts` | `stop()` already SIGKILLs synchronously, is idempotent, and bumps `startGeneration`, so a start in flight cannot continue into a fresh spawn. |
| `src/main/screen-preprocess.ts` | Its `stop()` is already idempotent. |
| `parakeet.ts`, `whisper-import.ts`, `speaker-embedding-client.ts` | Chromium-owned (ADR-003). See §5. |
| `.github/workflows/*`, `scripts/after-pack.mjs` | Hot files. The gate already runs in every packaging chain through afterPack. |
| `native/mac-helper/main.swift` | M2-0027's order. Nothing is needed here. |

## 4. Tests: red first, then implementation

D-28 applies: nothing runs locally except `git`, `gh` and `npx tsc --noEmit -p tsconfig.node.json`
(`-p tsconfig.web.json` is not needed, since no renderer file changes).
- **Commit 1** holds tests plus the skip-baseline bookkeeping only. Push it alone and record the Quality-checks
  run URL. The failing set must equal the RED rows below, and nothing else may fail.
- **Commits 2-5** are the implementation. At head, both OSes must be green, compared against baseline run
  36267674617.

Stand-in child used by §4.1-4.2:
`spawn(process.execPath, ['-e', 'setInterval(() => {}, 1 << 30)'], { stdio: 'ignore', windowsHide: true })`.
It is a real OS process that runs until it is killed, on every platform. `exited(child)` resolves at once when
`exitCode` or `signalCode` is set; otherwise it waits on `once(child, 'exit')`. Every test file kills leftover
children in `afterEach`.

### 4.1 `src/main/infra/process/stop-all.test.ts` (NEW)

| Test | Pre-fix |
|---|---|
| S1 `stops every family once, in list order` (spy families record `a,b,c`) | RED (module missing) |
| S2 `reports a family whose stop throws and still stops every family after it` (`b` throws; `onError` gets `('b', error)`; `c` stopped) | RED |
| S3 `can run again: a second run stops every family again without throwing` (`a,b,c,a,b,c`) | RED |

### 4.2 `src/main/lifecycle/exit-paths.test.ts` (NEW; replaces `emergency-force-quit.test.ts`)

The harness spawns three stand-in children and wraps each as a family whose `stop` is `child.kill('SIGKILL')`.
It uses the **real** `createStopAll` and a `FakeApp extends EventEmitter`:
- `quit()` records `'quit'` and never emits `will-quit`. That is the wedged quit the emergency path exists for.
- `relaunch()` records `'relaunch'`.
- `exit(code)` records `` `exit:${code}` `` and stores `liveAtExit`, the number of children with
  `killed === false` at that moment.
- `closeBootWatch` is a `vi.fn` that pushes `'bootWatch'` into the same `calls` array.
- Optionally, a first family `broken` throws.

Fake timers: `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })`. Only these two are faked, so child
`exit` events and `nextTick` stay real.

| Test | Pre-fix |
|---|---|
| E1 `will-quit stops every owned child`: `app.emit('will-quit')`, every child exits, `calls` stays empty | RED (module missing) |
| E3 `exitAndRelaunch stops every owned child before it exits, then relaunches`: `calls` equals `['relaunch','exit:0']`, `liveAtExit === 0`, the boot watch is not closed, every child exits | RED |
| F1 `forceQuit asks politely first`: `calls` equals `['quit']`, no child signalled, no exit | RED |
| F2 `stays polite through before-quit's own 2 s flush window`: after 2 000 ms, no exit and no child signalled | RED |
| F3 `hard-exits once the polite quit has plainly failed`: by 5 000 ms `calls` equals `['quit','bootWatch','exit:0']`, `liveAtExit === 0`, every child exits | RED |
| F4 `a second press exits at once`: press, advance 100 ms, press again; `exit:0` is present with `liveAtExit === 0` before the grace | RED |
| F5 `a throwing child kill or boot-watch close never keeps the process up`: `broken` family plus a throwing `closeBootWatch`; after 5 000 ms `exit:0`, and every real child exits | RED |
| F6 (own describe, real timers) `the watchdog never keeps a quitting process alive`: the count of `'Timeout'` in `process.getActiveResourcesInfo()` is unchanged by `forceQuit()` | RED |

E1 and E3 prove the acceptance line "every exit path stops every registered child" at the OS level. F3-F5 prove
it for the emergency hard exit.

### 4.3 `src/main/ffmpeg-decoder.test.ts` (one new describe, `describe.skipIf(process.platform === 'win32')`)

| Test | Pre-fix |
|---|---|
| D1 `cancel kills the decode and its duration probe at once, even an ffmpeg that ignores SIGTERM` | RED on ubuntu (see below); skipped on windows |

D1 setup:
- Write a stand-in "ffmpeg" into a mkdtemp directory with mode `0o755`:
  `#!/bin/sh\ntrap '' TERM\necho $$ >> '<dir>/pids'\nexec sleep 600\n`. An ignored signal disposition survives
  `exec`.
- The source file carries a WAV header (`RIFF….WAVE` plus padding), so `sniffMediaFile` passes.

D1 steps:
1. Start the decode, then poll until `pids` has 2 lines (decode + probe, 2 s cap).
2. Call `cancel()`.
3. `Promise.race([completed → 'settled', 3 s → 'hung'])` must give `'settled'`.
4. Each pid is gone within 2 s: poll `process.kill(pid, 0)` until it throws ESRCH.
5. `onError` was not called.

Why it is RED before the fix: SIGTERM is ignored, the probe is never cancelled, and `completed` only settles at
the probe's 5 s deadline. `afterEach` SIGKILLs every listed pid. The MQA-063 and non-media tests stay green
unchanged.

### 4.4 `scripts/lib/qa-fault-hook.test.ts` (NEW)

Fixture: `createPackage(src, dest)` from `@electron/asar` (3.4.1). It packs a temp directory holding a
`package.json` `{ name }` and an `out/main/index.js` that does or does not contain the marker.

| Test | Pre-fix |
|---|---|
| Q1 `a shipping package without the hook passes` (`name: 'asktoto'`) | RED (module missing) |
| Q2 `a shipping package whose main bundle carries the hook fails` | RED |
| Q3 `the QA-identity package with the hook passes` (`name: 'asktoto-qa'`) | RED |
| Q4 `a QA-identity package without the hook fails` | RED |
| Q5 `the hook the QA build compiles in raises the marker this gate looks for`: import `installQaFaultHook` from `src/main/qa-identity.ts`, install, `expect(() => process.emit('SIGUSR2')).toThrow(QA_FAULT_MARKER)`, then remove exactly the listener it added | RED |

Q5 ties the two constants through behaviour and never reads source text. Q1-Q4 prove the gate logic in PR CI.
`build-macos` runs on real bytes only for PRs into main, and the qa-candidate lane runs on real bytes too.

### 4.5 `scripts/qa/fault-fatal-relaunch.test.ts` (NEW; imports the script's pure helpers)

| Test | Pre-fix |
|---|---|
| P1 `parsePs reads pid, ppid, start time and a command with spaces, including a space-padded day` | RED (module missing) |
| P2 `descendantsOf finds grandchildren and nothing outside the tree` | RED |
| P3 `survivors ignores a reused pid (same pid, different start time)` | RED |
| P4 `strays counts an orphan from the bundle and an orphaned fm serve, never the relaunched main or its children` | RED |
| P5 `classify returns content-free classes for every owned kind and never the command` | RED |

### 4.6 CI evidence (PR evidence table)

- Commit 1: run URL plus the exact RED list.
  - ubuntu: S1-S3, E1, E3, F1-F6, D1, Q1-Q5, P1-P5. Suite-level import failures count as the file's RED.
  - windows: the same list without D1, which is skipped.
- Head: run URLs for Quality checks (ubuntu and windows), Operator Worker and Security. Compare with
  36267674617: no test outside this ticket may change state. The only deletions are the pins in §3.10.
- `npx tsc --noEmit -p tsconfig.node.json` must be clean locally. It covers the two new modules, `qa-identity.ts`
  and `electron.vite.config.ts`.

## 5. What NOT to do

- Do not add `process.on('SIGTERM')`, `detached`, `process.on('exit')` or `app.on('quit')` (PD-02). SIGTERM
  already reaches `will-quit` (B3-RC5), and every JS exit path is routed explicitly.
- Do not call `stopAll()` from `before-quit`. A live meeting may still flush, and the quit can be cancelled.
- Do not make `stopAll()` async, and do not wait for exit confirmations. `will-quit` is synchronous,
  `app.exit()` follows at once, and SIGKILL needs no wait.
- Do not add the utilityProcess release functions to the list. `parakeetRelease` and `stopWhisperHost` do kill
  synchronously. `releaseSpeakerEmbedding` first awaits the other owner's in-flight work (OBSERVED,
  `speaker-embedding-client.ts:265-287`), and at exit that wait never ends. Adding only two of the three would be
  inconsistent. Electron ends every utilityProcess on quit and on exit, in `PostMainMessageLoopRun` (ASSUMED from
  Electron source; PROVIDED on macOS per ARCHITECTURE C1). If a census ever shows a surviving utility host after
  a JS exit, add a **synchronous** kill export per host module to the list. Never add the async release
  functions.
- Do not add a 2 s SIGTERM-then-SIGKILL timer to ffmpeg. On the exit paths it never fires, and in-session
  SIGTERM buys nothing for a pipe-only decoder.
- Do not add a runtime "shutting down" latch to local-runtime or fm-runtime. See R2.
- Do not trigger the QA fault by environment variable, IPC channel or marker file:
  - an env var is a planted-variable crash primitive, and the relaunched instance would inherit it and crash-loop;
  - an IPC channel adds surface;
  - a marker file adds polling.
- Do not use a separate QA main entry instead of the define. M2-0027 gates its legacy rule on the same
  `QA_IDENTITY_BUILD` constant (M2-0187 A2).
- Do not put `METIS_QA_IDENTITY=1` after `ASKTOTO_MAC_UNIVERSAL=1`, and do not edit the `MAC_UNIVERSAL` lines in
  `electron.vite.config.ts`. `release-gates.test.ts` pins both.
- Do not keep or add source-text tests. Do not re-pin the will-quit body or the composition of the list in
  index.ts:
  - the list is proven by the packaged census;
  - its order and isolation are proven by S1-S3;
  - its completeness for future sidecars belongs to the C1 supervisor (FF-10, M2-0027/0028).
- Do not export test-only helpers. `EMERGENCY_FORCE_QUIT_GRACE_MS` stays private.
- Do not touch `mac-helper.ts`, `foreground-watcher.ts`, `local-runtime.ts`, the utilityProcess modules,
  workflows or `after-pack.mjs`.
- Do not run any test, the QA script, the app or a build on this Mac (D-28). The packaged proof runs on the QA
  account, by the QA runner, after the change is on main.
- Do not print command lines, paths or user names from the census script. Report classes and pids only.

## 6. Acceptance amendments (for the orchestrator to apply to the ledger)

- **A1 (list).** Replace AC1 with: "One ordered list, declared once in index.ts through `createStopAll`
  (`infra/process/stop-all.ts`), covers, in this order:
  - screen-preprocess (which owns the mac-helper watch-frontmost and Windows PowerShell foreground watchers);
  - the ffmpeg import decoders (decode and duration probe);
  - localRuntime (llama-server);
  - fmRuntime (fm serve).

  utilityProcess hosts are Chromium-owned (ADR-003). The packaged census checks them, and they are not in the
  list." This departs from the lead note, which asked for the utilityProcess ASR in `stopAll()`. The reasons
  are in §5.
- **A2 (paths).** Replace AC2 with: "will-quit and the paths that reach it all run `stopAll()` before the process
  ends. Those paths are every `app.quit()`, the update install, and an external SIGTERM. The emergency hard exit
  (grace and second press) and onFatal Relaunch run it too. `lifecycle/exit-paths.ts` holds the only
  `app.exit()` calls in `src/main`, each directly after `stopAll()`."
- **A3 (ffmpeg).** Replace AC3 with: "ffmpeg cancel kills the decode and its duration probe with SIGKILL at once,
  and a duration probe abandoned at its deadline is SIGKILLed too (D1)." This replaces "escalates SIGTERM to
  SIGKILL after 2 s": the timer can never fire on the exit paths, and SIGTERM has nothing to flush.
- **A4 (tests).** Replace AC4 with: "Behavioural tests with spawned stand-in children prove that every exit path
  stops every listed child before exit (S1-S3, E1, E3, F1-F6, D1). `emergency-force-quit.test.ts` and the
  index.ts source pins for these handlers are deleted (FF-07). Those pins are: c-main-fixes emergency tests 2-3
  and the force-quit slice of test 1, will-quit-guard tests 3-4, and local-runtime.test.ts 'will-quit wiring'."
- **A5.** AC5 is unchanged. Append ", and no `process.on('exit')` or `app.on('quit')` backstop".
- **A6 (packaged).** Replace AC6 with:
  - "The QA-identity build alone compiles in a SIGUSR2 fault hook: the `__METIS_QA_IDENTITY__` define from
    `METIS_QA_IDENTITY=1` on `dist:qa-identity`, per M2-0187 A2.
  - `check-packaged-runtime.mjs` fails every package whose main bundle carries the hook unless its packaged name
    is `asktoto-qa`, and fails an `asktoto-qa` package that lacks it (Q1-Q5).
  - On the QA account, `scripts/qa/fault-fatal-relaunch.mjs` checks the candidate zip's sha256. It then brings up
    llama-server, injects the fault and clicks Relaunch. 10 s after the old main exits it finds 0 surviving owned
    processes (identified by pid plus start time) and 0 orphans from the bundle.
  - A second phase proves the same for SIGTERM → will-quit."
- **A7 (module).** Replace AC7 with: "Logic lives in two new modules, `infra/process/stop-all.ts` and
  `lifecycle/exit-paths.ts`. The index.ts changes are the list declaration, one `installExitPaths` call, the QA
  hook call and call-site swaps. They land through the merge queue in the declared order (M2-0188), after
  M2-0004."
- **A8 (scope).**
  - Add:
    - `src/main/lifecycle/exit-paths.ts` and its test;
    - `src/main/qa-identity.ts`;
    - `electron.vite.config.ts`, `vitest.config.ts`, `package.json` (`dist:qa-identity`);
    - `scripts/lib/qa-fault-hook.mjs` and its test, `scripts/check-packaged-runtime.mjs`;
    - `scripts/qa/fault-fatal-relaunch.mjs` and its test, `scripts/check-skipped-tests.mjs`;
    - `src/main/ffmpeg-decoder.test.ts`;
    - the pin files in §3.10.
  - Remove: `src/main/mac-helper.ts`, `src/main/foreground-watcher.ts`, `src/main/llm/local-runtime.ts`
    (unchanged).
  - Keep `src/main/llm/fm-runtime.ts` (comment only).
- **A9 (verification).**
  - CI (D-28): `npx vitest run src/main/infra/process/stop-all.test.ts src/main/lifecycle/exit-paths.test.ts
    src/main/ffmpeg-decoder.test.ts scripts/lib/qa-fault-hook.test.ts scripts/qa/fault-fatal-relaunch.test.ts`,
    as part of Quality checks on ubuntu and windows.
  - Packaged: `node scripts/qa/fault-fatal-relaunch.mjs --zip … --sha256 …` on the QA account, with a
    QA-identity candidate built from main.
  - `src/main/emergency-force-quit.test.ts` leaves the verification list, because it is deleted.
- **A10 (evidence).** Replace `LOCALLY_TESTED` with the D-28 CI evidence: the red run (commit 1) and the green
  runs at head. `LIVE_VERIFIED` comes after merge.
  - It depends on M2-0007: the QA account, a seeded profile with the local model, and Accessibility for the
    runner.
  - It also needs a qa-candidate run from main.
  - Until then the ticket can close only as ENGINEERING_COMPLETE.

## 7. Commits, CI and PR

Conventional commits. Each subject ends `[M2-0026]`, each body says why, and the last line is the operating-rule
co-author line.
1. `test(lifecycle): pin sidecar teardown on every exit path red-first [M2-0026]`. This is §4.1-4.5, the
   `check-skipped-tests.mjs` baseline and the reason text. Push it alone.
2. `fix(lifecycle): route will-quit, the emergency exit and the fatal relaunch through one stopAll() [M2-0026]`.
   This is §3.1-3.3 (except item 5) plus the §3.10 pin removals, which must go in this same commit or CI goes red,
   and the fm-runtime comment.
3. `fix(import): cancel kills the ffmpeg decode and its duration probe with SIGKILL [M2-0026]`. This is §3.4, the
   index.ts `onError` comment and the c-main-fixes `:70` comment.
4. `build(qa): compile the fatal-fault hook into the QA-identity build only and gate every package on it
   [M2-0026]`. This is §3.5-3.7 and §3.3 item 5.
5. `test(qa): add the packaged onFatal-relaunch census script [M2-0026]`. This is §3.8.

Draft PR into `m2/integration`, titled `fix(lifecycle): route every exit path through one ordered sidecar
stopAll() [M2-0026]`. Use the repo template:
- ticket id;
- finding ids;
- evidence table: the red run, the head runs, the local `tsc` result;
- not-run list:
  - the packaged proof (post-merge, QA account);
  - a real update-install restart and macOS logout;
  - a Windows packaged relaunch;
  - SIGKILL and native-crash paths, which belong to M2-0027/0028.

The PR text quotes no program document, only ids.

## 8. Consumer notes (non-normative)

- **M2-0027:** gate the legacy llama rule on `QA_IDENTITY_BUILD` from `src/main/qa-identity.ts`. The registry
  records and `stopAll` stops; neither calls the other. Its REAP census can reuse this script's `parsePs`,
  `survivors` and `classify` once a second consumer exists. Extract them then, not now.
- **M2-0028:** when `stop()` becomes a process-group kill, the list entries stay as they are, because they call
  `localRuntime.stop()` and `fmRuntime.stop()`.
- **M2-0037:** onFatal's relaunch branch is exactly `exitAndRelaunch()`. Keep it when the dialog becomes an async
  `showMessageBox`. The census script clicks the same button label.
- **M2-0192:** if the stall sampler runs as a long-lived owned child, it gets a list entry.
- **M2-0069:** its import pipeline `stop()` replaces the `import-decoders` entry.
- **M2-0065:** when the will-quit handler moves into `lifecycle/`, fold it into `exit-paths.ts`. INV-FIRST then
  becomes local instead of a call-order rule in index.ts.
- **M2-0047:** `emergency-force-quit.test.ts` stops reading `index.ts` (FF-07 baseline minus one file).
  `qa-identity.ts` is reachable from `index.ts` (FF-03).
- **M2-0007:** the TCC runbook needs Accessibility for the runner (System Events GUI scripting). The seeded
  profile needs the local LLM on with its model downloaded.

## 9. Known limits and residuals

- **R1.** A SIGKILL, Force Quit, native crash or watchdog kill still orphans sidecars. No JS runs on those
  paths. This is M2-0027 (reaper) and M2-0028 (supervise); this ticket does not change it.
- **R2.** A local-runtime `start()` that reached `spawn` in the milliseconds between `stopAll()` and process end
  would orphan its child.
  - No known path gets there: timers are cleared, windows are closed, and a cold start first spends seconds
    hashing the model.
  - A terminal latch in both runtimes would be new API for a window no test can hit. M2-0028 closes it at the
    OS level.
- **R3.** macOS logout and the update-install restart are `will-quit` paths by Electron's contract, but neither
  is run here.
- **R4.** The Windows onFatal relaunch has no packaged proof: there is no Windows QA identity (M2-0187 A3). The
  code path is shared with macOS, and E3 runs on windows CI.
- **R5.** utilityProcess teardown on Windows is ASSUMED (ARCHITECTURE C1). HK-W and the census are M2-0029.

## 10. Size estimate

About 150 production lines:
- `exit-paths` about 70;
- `stop-all` about 25;
- `qa-identity` about 15;
- ffmpeg-decoder about 12 changed;
- index.ts about 75 removed and 30 added;
- configs about 6;
- `qa-fault-hook.mjs` about 30.

About 190 lines for the QA script, and about 420 test lines. About 300 lines of source-text tests are deleted.
Risk is medium:
- The runtime change is small and mechanical.
- The new surface is the define plus the packaged gate, and the gate fails closed in both directions.
- If CI shows the define is not applied under vitest (Q5 ReferenceError), or that rollup keeps the hook in a
  shipping bundle (the gate fails in `build-macos` or `qa-candidate`), stop and report rather than loosening the
  gate.
