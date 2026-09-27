# M2-0007 design: packaged smoke lanes on the hosted macOS and Windows runners

Designer: Opus. Base: `56292fb6` (= `origin/m2/integration`). Branch: `m2/M2-0007-ci-packaged-lanes`.
Status: design only. The implementer (Sonnet) follows this file. Line anchors are at `56292fb6`.
Decisions used: D-9 (ANSWERED_CHANGED 2026-09-27: the QA hosts are the GitHub-hosted `macos-latest` and
`windows-latest` runners, with no QA user on the owner's Mac) and D-28 (tests and the app run in CI only).
Evidence labels: OBSERVED, DERIVED, ASSUMED, UNKNOWN (AGENTS.md section 4).

## 0. Why this design, in one paragraph

D-9 replaces the ticket's physical QA hosts with ephemeral hosted runners. A fresh runner VM has no
Métis install, no owner data, no owner Keychain and no owner TCC grants, so every run is isolated by
construction. The ticket therefore becomes one new workflow, `packaged-smoke.yml`, plus two small
dependency-light modules. On each OS the workflow builds the unsigned app with the chain CI already
proves (`npm run dist`, `npm run dist:win`), with no repository secret. It installs the app from the
shipped installer (DMG or NSIS Setup) into a fresh directory and runs `scripts/qa/packaged-smoke.mjs`
against a fresh `ASKTOTO_USERDATA` profile. The smoke checks, in order, that the process starts, that the
renderer reports `app.renderer.ready`, that the app survives 3 s without `app.crash` or `app.unresponsive`,
and that it quits cleanly through its own Quit path (exit 0, `app.shutdown.clean` audited,
`run-state.json` clean). It then checks that nothing the app started (descendants of main, plus anything
executing from the install root) is alive 5 s after main exits. Each job uploads a content-free JSON
report and the sha256 of the installer it tested. No `build.yml`, `release.yml`, `qa-candidate.yml`
or product-code change is needed.

## 1. Invariants

**INV-1 (isolation by construction).** The smoke runs only on hosted runners (D-9, D-28). Each run uses
a fresh install directory under `$RUNNER_TEMP` and a fresh `mkdtemp` profile passed as
`ASKTOTO_USERDATA` (index.ts:895). Nothing is ever launched on the owner's Mac. The owner's primary
account is never a QA host.

**INV-2 (no secrets, no certificate).** The workflow references no repository secret. The only
credential is the job's own read-only `github.token`, used to download the reviewed ffmpeg release
asset, which `predist` verifies against `resources/ffmpeg/manifest.json`. macOS output carries only
electron-builder's ad-hoc signature (`dist`: `-c.mac.identity=null`, `ASKTOTO_ADHOC_SIGN=1`; arm64
cannot execute unsigned code at all). Windows output is unsigned. `permissions: contents: read`.

**INV-3 (never on tags; never the release path).** Triggers are `push` on any branch whose change
touches the lane's own files, and `workflow_dispatch`. `tags-ignore: ['**']` makes the tag exclusion
explicit. `release.yml`, `build.yml` and `qa-candidate.yml` are unchanged.

**INV-4 (uninstrumented app lifecycle).** The app is spawned directly, as `check-packaged-launch.mjs`
does. The only extra argument is `--remote-debugging-port=<free port>`, which starts Chromium's DevTools
HTTP server and changes nothing in the app's lifecycle. Playwright's `_electron.launch` is forbidden:
its loader (OBSERVED, `node_modules/playwright-core/lib/server/electron/loader.js`, 1.61.1) rewrites
`app.whenReady`/`app.isReady`, swallows the `ready` event and appends `--disable-breakpad`,
`--disable-hang-monitor`, `--use-mock-keychain` and `--password-store=basic`. That removes the Crashpad
handler and the hang monitor, both of which this smoke must observe.

**INV-5 (clean quit = the product's own Quit).** The quit request is `window.toto.quit()` evaluated in
the overlay renderer over CDP. That is the Settings "Quit" IPC: `IPC.windowQuit` (index.ts:8741)
sets `quitFlushDone` and calls `app.quit()`, the same call the tray "Quit Métis" item makes
(index.ts:4449). It reaches `before-quit` (9489) and then `will-quit` (9501), whose last step is
`observability.shutdownClean` (9561). Hard kills (SIGKILL, `taskkill /F`, `Stop-Process`) are never a
quit. Neither are WM_CLOSE or `taskkill` without `/F`: those only close windows, and the app stays in
the tray by design (`window-all-closed` is a no-op, 9475).

**INV-6 (ownership is structural, never by name).** A process is *owned* when it is the main process,
a transitive descendant of main (a child must not have started before its parent, which defeats stale
Windows parent ids and PID reuse), or when its executable lies inside the canonical install root
(`realpathSync.native`, path-boundary-safe, case-insensitive on win32). Process identity is
`(pid, startedMs)`. Nothing is ever selected or killed by name (`Metis*`, `llama-server`,
`powershell`, `chrome_crashpad_handler`).

**INV-7 (clean root before launch).** Before launch no process may execute from the install root. The
root is freshly created, so anything running from it later was started by this run. That makes the
root rule in INV-6 sound. A busy root fails the run as `install_root_busy`.

**INV-8 (no vacuous pass).** At the moment of the quit request, the owned set must contain main plus at
least one other process: Electron always runs a renderer once `app.renderer.ready` has fired. An empty
or main-only census fails as `census_vacuous`. It proves on every run that the census works on that OS.
A pass requires that every stage completed through the survivor check. An observation that stopped
early with no recorded cause fails as `smoke_incomplete`.

**INV-9 (content-free report).** The report holds only: schema version, verdict, fixed failure codes,
the `version`/`platform`/`arch` fields of `app.started`, counts of an allowlisted set of lifecycle event
names, timings, the exit code and signal, two shutdown booleans, and process *role* counts. A role is
the executable basename, plus the Chromium `--type` on Windows. The report never holds paths, command
lines, environment values, audit details or free text. `SHA256SUMS.txt` holds the installer hash with
a relative file name.

**INV-10 (always report, always clean up).** The script writes the report on every path, whether it
passes, fails or throws. Before exiting it SIGKILLs every owned process still alive, re-verified by
`(pid, startedMs)` against a fresh table, and removes the profile (best effort). Exit codes: 0 pass,
1 fail, 2 usage or unsupported platform.

## 2. What this lane proves, and what it does not

| Proves (per OS, per run) | Does not prove (owner) |
|---|---|
| The shipped installer installs and the installed app starts on a clean host | TCC-dependent capture on macOS (hosted runners grant no mic/screen TCC; the M2-0187 stable identity helps only on a persistent host) |
| The renderer bridge/root is ready (`app.renderer.ready`), with 3 s survival and no `app.crash`/`app.unresponsive` | Hard-kill supervision (HK-M/HK-W: M2-0028, M2-0029) |
| Clean quit through the product's Quit path: exit 0, `app.shutdown.clean`, `run-state.json` `clean: true` (M2-0006) | Sidecars that a fresh profile never starts (llama-server, fm serve, ffmpeg import); M2-0009 notes that a fresh profile never starts llama-server |
| Zero owned processes alive 5 s after main exits, including the Crashpad handler and Electron helpers | Real dataless or placeholder files (no cloud sign-in on hosted runners: ST-1/ST-1-W) |
| The census works on that OS (INV-8) | The x64 slice of the universal macOS build (the runner is arm64) |
| The bytes tested, by sha256 | Resource baselines (M2-0009), GPU/DPI/battery/EDR (M2-0195, M2-0196) |

Descendants that were spawned after the at-quit snapshot, and processes that daemonised out of the
tree to somewhere outside the install root, are not visible to this census. Complete ownership is the
job of the sidecar registry (M2-0027). The census only needs to be sound for what it reports.

## 3. Changes per file

Four new files. No existing file changes.

### 3.1 `scripts/qa/owned-processes.mjs` (NEW, about 110 lines, node builtins only)

Header comment: the ownership rule from INV-6 and the identity rule `(pid, startedMs)`, stated as
invariants. It must not reference program documents. Ticket ids are fine.

```js
/** @typedef {{ pid: number, ppid: number, startedMs: number, exe: string | null, role: string }} ProcessEntry */

export function parseProcessTable(platform, output)   // 'darwin' | 'win32' → ProcessEntry[]
export function listProcesses(platform)                // runs the platform query (sync), returns parseProcessTable(...)
export function isInside(root, path, platform)         // true iff path is strictly below root
export function ownedProcesses(table, { mainPid, installRoot, platform })
export function survivors(owned, table, { installRoot, platform })
export function roleCounts(entries)                    // { [role]: count }, keys sorted
```

- **darwin query:** `execFileSync('/bin/ps', ['-axo', 'pid=,ppid=,lstart=,comm='], { env: { ...process.env, LC_ALL: 'C' }, encoding: 'utf8' })`.
  Each row is `pid ppid <Day Mon DD HH:MM:SS YYYY> <executable path to end of line>`. Match
  `/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(\S+)\s+(\d+)\s+(.+)$/` and parse `Mon DD YYYY HH:MM:SS`
  with `Date.parse`. Skip rows that do not match or that parse to NaN; never guess. `role =
  path.posix.basename(exe)`. On macOS `comm` is the executable path as launched: DERIVED, and INV-8
  plus the role counts in the report expose it if that is ever wrong.
- **win32 query:** absolute `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`, the same
  resolution as `check-packaged-launch.mjs`, with `-NoProfile -NonInteractive -Command`:
  ```
  [Console]::OutputEncoding = [Text.Encoding]::UTF8;
  Get-CimInstance Win32_Process | ForEach-Object { [pscustomobject]@{
    pid = $_.ProcessId; ppid = $_.ParentProcessId;
    started = if ($_.CreationDate) { [DateTimeOffset]::new($_.CreationDate).ToUnixTimeMilliseconds() } else { 0 };
    exe = $_.ExecutablePath; cmd = $_.CommandLine } } | ConvertTo-Json -Compress
  ```
  `ConvertTo-Json` emits an object rather than an array when there is exactly one row, so accept both.
  `exe` may be null (protected processes): keep the row with `exe: null` and role `unknown`. A null
  `exe` is never inside a root. Role = `path.win32.basename(exe)`, plus ` (<type>)` when
  `cmd` contains `--type=<type>`. The parser drops `cmd` right after extracting the type, so a command
  line never leaves this function.
- **`isInside`:** use `path.posix` or `path.win32` according to the `platform` argument, not the host,
  so the win32 rules are unit-tested on the ubuntu leg. Compute `relative(root, path)`. The path is
  inside when that is non-empty, does not start with `..` and is not absolute. On win32 lowercase both
  sides first; `path.win32` already accepts either separator.
- **`ownedProcesses`:** the main entry (when `mainPid` is not null), then breadth-first descendants
  through a `ppid → children` map. A child is followed only when `child.startedMs >= parent.startedMs`,
  which stops stale Windows parent ids from adopting older processes. Then add every entry whose `exe`
  is inside `installRoot`. Deduplicate by `(pid, startedMs)`. With `mainPid: null` the result is the
  root residents only, which is the INV-7 precondition.
- **`survivors`:** entries of `table` that equal an owned entry by `(pid, startedMs)`, or whose `exe` is
  inside `installRoot`.

### 3.2 `scripts/qa/packaged-smoke.mjs` (NEW, about 200 lines)

Usage: `node scripts/qa/packaged-smoke.mjs <installed app> <report.json>`. On darwin the argument is the
`.app` bundle. The install root is `realpathSync.native(app)` and the executable is
`<root>/Contents/MacOS/<basename(root, '.app')>`. On win32 the argument is the `.exe`. The executable
is `realpathSync.native(exe)` and the root is `dirname(executable)`. Any other platform, or missing
arguments, exits 2 with usage and writes nothing. Use the same main guard as `provenance.mjs`
(`import.meta.url === pathToFileURL(process.argv[1]).href`).

Header comment: what the smoke proves (the section 2 left column) and INV-4/INV-5 as invariants,
including why `_electron.launch` is not used. No history narrative and no program-document references.

Constants, each with a one-line invariant comment:

```js
const READY_TIMEOUT_MS = 150_000   // a cold first launch on a hosted runner; the same budget as check-packaged-launch
const SURVIVAL_MS = 3_000          // the window check-packaged-launch requires after app.renderer.ready
const QUIT_TIMEOUT_MS = 30_000     // before-quit defers at most 2 s (live meeting only); will-quit is synchronous
const SURVIVOR_BOUND_MS = 5_000    // owned processes must be gone within 5 s of main exiting (M2-0028, M2-0029)
const AUDIT_POLL_MS = 250
const CENSUS_POLL_MS = 500
export const LIFECYCLE_EVENTS = Object.freeze(['app.started', 'app.renderer.ready', 'app.stall', 'app.crash', 'app.unresponsive', 'app.shutdown.clean'])
```

Pure, exported, unit-tested:

```js
export function parseAuditLog(text)       // JSON-lines → records; blank and malformed lines skipped (audit transport format is '{text}', logger.ts)
export function isOverlayUrl(url)         // file: URL whose pathname ends with '/renderer/index.html' (overlayRendererUrl, index.ts:2067)
export function smokeVerdict(observation) // → { result: 'pass' | 'fail', failures: string[] }
export function smokeReport(observation) // → the schema-1 report (INV-9), including the verdict
```

The observation is a plain object that the orchestration fills in as it goes:

```js
{
  installRootBusy: false, launchFailed: false, error: false,
  mainPid: null, readyMs: null, exitedEarly: false,
  ownedAtQuit: null,                 // ProcessEntry[] | null
  quitRequested: false, quitDelivered: false,
  exit: null, exitMs: null,          // { code, signal } | null; ms from quit request to exit
  audit: [],                         // parsed records, read once at the end
  marker: null,                      // run-state.json clean === true, or false when absent or unreadable
  survivors: null, survivorsGoneMs: null
}
```

`smokeVerdict` failure codes, one per defect, in this order:

| Code | Condition |
|---|---|
| `install_root_busy` | `installRootBusy` |
| `launch_failed` | `launchFailed` (the spawn `error` event) |
| `smoke_error` | `error` (an unexpected exception; its message goes to stderr only) |
| `app_reported_crash` | any `app.crash` or `app.unresponsive` record |
| `exited_early` | `exitedEarly` (main exited before the quit request) |
| `renderer_not_ready` | `mainPid !== null && readyMs === null && !exitedEarly` (the app was spawned, never reported ready and did not exit) |
| `census_vacuous` | `ownedAtQuit` is set and lacks `mainPid`, or has fewer than 2 entries |
| `quit_request_failed` | `quitRequested && !quitDelivered` |
| `quit_timeout` | `quitDelivered && exit === null` |
| `exit_not_clean` | `quitDelivered && exit` and (`exit.code !== 0` or `exit.signal`) |
| `shutdown_not_recorded` | `quitDelivered && exit` and (no `app.shutdown.clean` record or `marker !== true`) |
| `processes_survived` | `survivors?.length > 0` |
| `smoke_incomplete` | none of the above, but `survivors === null` |

`result` is `'pass'` only when `failures` is empty.

`smokeReport(observation)` returns exactly this shape:

```json
{
  "schema": 1,
  "result": "pass",
  "failures": [],
  "app": { "version": "1.9.7", "platform": "darwin", "arch": "arm64" },
  "events": { "app.started": 1, "app.renderer.ready": 1, "app.stall": 0, "app.crash": 0, "app.unresponsive": 0, "app.shutdown.clean": 1 },
  "timingsMs": { "ready": 8123, "exit": 1450, "survivorsGone": 300 },
  "exit": { "code": 0, "signal": null },
  "shutdown": { "audited": true, "marker": true },
  "processes": { "atQuit": { "Metis": 1, "Metis Helper (GPU)": 1, "Metis Helper (Renderer)": 1, "chrome_crashpad_handler": 1 }, "survivors": {} }
}
```

`app` is taken from the first `app.started` record's `version`, `platform` and `arch` fields only, and
is `null` when that record is missing. Timings and process maps are `null` for stages that did not run.

Orchestration (not exported; the workflow exercises it end to end on both OS):

1. Canonicalise the root and the executable. Check INV-7 with
   `ownedProcesses(listProcesses(p), { mainPid: null, installRoot, platform: p })`. If anything is
   running from the root, set `installRootBusy` and finish.
2. Create `profile = mkdtempSync(join(tmpdir(), 'metis-smoke-'))`. Get a free loopback port with
   `net.createServer().listen(0, '127.0.0.1')`, read the port and close the server.
3. Call `spawn(executable, ['--remote-debugging-port=' + port], { env, stdio: 'ignore' })`. `env` is
   `{ ...process.env, ASKTOTO_USERDATA: profile }` with every `/_API_KEY$/i` key deleted, the same
   rule as `check-packaged-launch.mjs`: a provider key changes startup routing. Use `stdio: 'ignore'`
   so an unread pipe can never block the app. Record `error` → `launchFailed`, and `exit` →
   `{ code, signal }` plus its timestamp.
4. Every `AUDIT_POLL_MS` until `READY_TIMEOUT_MS`, read `<profile>/logs/audit.log`, treating ENOENT as
   empty. Stop on a crash or unresponsive record, on exit (`exitedEarly`) or on `app.renderer.ready`
   (`readyMs`). Then keep polling the same conditions for `SURVIVAL_MS`.
5. Take `ownedAtQuit = ownedProcesses(listProcesses(p), { mainPid: child.pid, installRoot, platform: p })`.
   Stop without requesting a quit when INV-8 fails.
6. Request the quit and set `quitRequested`. Call `chromium.connectOverCDP('http://127.0.0.1:' + port, { timeout: 30_000 })`
   (`import { chromium } from 'playwright'`, the declared devDependency; no browser download is
   needed). Pick the first page for which `isOverlayUrl(page.url())` is true and
   `await page.evaluate(() => { void window.toto.quit() })`. Do not await the IPC promise, and never call
   `browser.close()`: its semantics on a CDP-attached browser are not the app's Quit. The connection
   ends when the app exits. If there is no such page or the call throws, `quitDelivered` stays false.
7. Wait up to `QUIT_TIMEOUT_MS` for the exit → `exitMs`.
8. If main exited, poll `survivors(ownedAtQuit, listProcesses(p), …)` every `CENSUS_POLL_MS` until the
   list is empty (`survivorsGoneMs`) or `SURVIVOR_BOUND_MS` passes, then record the last list.
9. Read `run-state.json` (`clean === true` → `marker`) and parse the audit log once.
10. `finally`, whatever happened:
    - List processes again and SIGKILL, via `process.kill(pid, 'SIGKILL')` (TerminateProcess on
      win32), every entry of `survivors(ownedAtQuit ?? [], table, …)` ∪
      `ownedProcesses(table, { mainPid, installRoot, platform })`.
    - Remove the profile (`rmSync`, recursive and forced, best effort).
    - Write the report (`mkdirSync` of its parent), print it to stdout and `process.exit(result === 'pass' ? 0 : 1)`.

An unexpected throw sets `error`. Its message goes to stderr only; the report carries the code alone.

### 3.3 `.github/workflows/packaged-smoke.yml` (NEW)

Action pins are copied from `qa-candidate.yml`, and so are the provisioning steps (the steps named
"Provision the reviewed ffmpeg sidecar(s)" at lines 79 and 183). The provisioning is duplicated rather than extracted into a composite action on purpose.
An extraction would change two shipped lanes, which belongs to its own ticket.

```yaml
name: Packaged smoke

# Builds the unsigned app on the hosted macOS and Windows runners with no repository secret (macOS
# carries electron-builder's ad-hoc signature, Windows is unsigned), installs it from the shipped
# installer into a fresh directory, and runs scripts/qa/packaged-smoke.mjs on a fresh profile: the app
# starts, its renderer reports ready, it quits cleanly through its own Quit path, and nothing it started
# is alive 5 s after it exits. Each job uploads a content-free report and the tested installer's sha256.
#
# Runs when a push on any branch changes this lane, and on demand for any branch once this file is on
# the default branch: gh workflow run packaged-smoke.yml --ref <branch>. Never on tags. Both hosted
# runners give the app a real window session, so no virtual display is needed.
on:
  push:
    branches: ['**']
    tags-ignore: ['**']
    paths:
      - .github/workflows/packaged-smoke.yml
      - scripts/qa/owned-processes.mjs
      - scripts/qa/packaged-smoke.mjs
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: packaged-smoke-${{ github.ref }}
  cancel-in-progress: true

defaults:
  run:
    shell: bash

jobs:
  mac:
    name: Packaged smoke (macOS)
    runs-on: macos-latest
    timeout-minutes: 120
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      # predist's check-ffmpeg-sidecar.mjs verifies each binary against resources/ffmpeg/manifest.json
      # before running it, so trust comes from that hash, not from the download or from Gatekeeper.
      - name: Provision the reviewed ffmpeg sidecars
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh release download ffmpeg-sidecar-v1 --repo "$GITHUB_REPOSITORY" --pattern 'ffmpeg-darwin-*' --dir resources/ffmpeg
          for arch in arm64 x64; do
            mkdir -p "resources/ffmpeg/darwin-$arch"
            mv "resources/ffmpeg/ffmpeg-darwin-$arch" "resources/ffmpeg/darwin-$arch/ffmpeg"
            chmod +x "resources/ffmpeg/darwin-$arch/ffmpeg"
            xattr -d com.apple.quarantine "resources/ffmpeg/darwin-$arch/ffmpeg" 2>/dev/null || true
          done
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.22.3
          cache: npm
      - run: npm ci
      # Same key as build.yml and qa-candidate.yml. fetch-models.mjs reuses cached files only after its
      # exact manifest gate.
      - uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4
        with:
          path: |
            resources/models
            resources/asr
            resources/ort
            resources/llama
            resources/local-llm
          key: runtime-assets-${{ runner.os }}-${{ hashFiles('scripts/fetch-models.mjs', 'resources/runtime-assets-manifest.json') }}-${{ hashFiles('scripts/fetch-llama-server.mjs') }}-${{ hashFiles('scripts/fetch-local-model.mjs', 'scripts/local-model-assets.mjs') }}
      - name: Build the unsigned app
        run: npm run dist
      - name: Install from the DMG into a fresh directory
        run: |
          mkdir -p smoke-report
          shasum -a 256 release/Metis-*.dmg > smoke-report/SHA256SUMS.txt
          volume="$RUNNER_TEMP/volume"
          hdiutil attach -nobrowse -readonly -mountpoint "$volume" release/Metis-*.dmg > /dev/null
          ditto "$volume/Metis.app" "$RUNNER_TEMP/smoke/Metis.app"
          hdiutil detach "$volume" > /dev/null
      - name: Launch, quit cleanly, and check that nothing survives
        id: smoke
        timeout-minutes: 10
        run: node scripts/qa/packaged-smoke.mjs "$RUNNER_TEMP/smoke/Metis.app" smoke-report/packaged-smoke.json
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        if: ${{ !cancelled() && steps.smoke.outcome != 'skipped' }}
        with:
          name: packaged-smoke-macos
          path: smoke-report/
          if-no-files-found: error
          retention-days: 14

  windows:
    name: Packaged smoke (Windows)
    runs-on: windows-latest
    timeout-minutes: 90
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      - name: Provision the reviewed ffmpeg sidecar
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh release download ffmpeg-sidecar-v1 --repo "$GITHUB_REPOSITORY" --pattern 'ffmpeg-win32-x64.exe' --dir resources/ffmpeg
          mkdir -p resources/ffmpeg/win32-x64
          mv resources/ffmpeg/ffmpeg-win32-x64.exe resources/ffmpeg/win32-x64/ffmpeg.exe
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.22.3
          cache: npm
      - run: npm ci
      - uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4
        with:
          path: |
            resources/models
            resources/asr
            resources/ort
            resources/llama
            resources/local-llm
          key: runtime-assets-${{ runner.os }}-${{ hashFiles('scripts/fetch-models.mjs', 'resources/runtime-assets-manifest.json') }}-${{ hashFiles('scripts/fetch-llama-server.mjs') }}-${{ hashFiles('scripts/fetch-local-model.mjs', 'scripts/local-model-assets.mjs') }}
      # No signing secret reaches this job, so electron-builder leaves the installers unsigned.
      - name: Build the unsigned installers
        run: npm run dist:win
      - name: Record the installer's sha256
        run: |
          mkdir -p smoke-report
          sha256sum release/Metis-Setup-*.exe > smoke-report/SHA256SUMS.txt
      - name: Install the Setup silently into a fresh directory
        shell: pwsh
        run: |
          $ErrorActionPreference = 'Stop'
          $setup = Get-Item release/Metis-Setup-*.exe
          $install = Start-Process -FilePath $setup.FullName -ArgumentList '/S', "/D=$env:RUNNER_TEMP\smoke" -Wait -PassThru
          if ($install.ExitCode -ne 0) { throw "Setup exited with $($install.ExitCode)." }
      - name: Launch, quit cleanly, and check that nothing survives
        id: smoke
        timeout-minutes: 10
        run: node scripts/qa/packaged-smoke.mjs "$RUNNER_TEMP/smoke/Metis.exe" smoke-report/packaged-smoke.json
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        if: ${{ !cancelled() && steps.smoke.outcome != 'skipped' }}
        with:
          name: packaged-smoke-windows
          path: smoke-report/
          if-no-files-found: error
          retention-days: 14
```

Notes that stay in this design only, not in the YAML:
- `dist` and `dist:win` already end with the existing launch gates, which run on `release/` and
  SIGKILL their own launch. Their processes run outside the smoke's root and are not descendants of the
  smoke's main, so they cannot be attributed to the smoke (INV-6, INV-7).
- The DMG is the primary macOS install medium. The zip and the Windows Portable stay covered by
  `qa-candidate.yml`'s install-and-launch jobs (M2-0187).

### 3.4 Unchanged, on purpose

`build.yml`, `release.yml`, `qa-candidate.yml`, `promote-candidate.yml`, `check-packaged-launch.mjs`,
`scripts/qa/quit-app.mjs`, `package.json` and everything under `src/`.

## 4. Tests, red first (CI only, D-28)

Vitest `.test.ts` files that import the `.mjs` modules directly, following the pattern of
`scripts/after-pack.test.ts`. They are covered by the `scripts/**/*.test.ts` include. Every test uses
fixtures or a real `spawnSync` of the CLI. None is a regex over source text, none uses `it.skip` or
platform-conditional `runIf` (`check:skips` baselines stay unchanged), and none spawns the app.
Fixture paths are neutral (`/opt/smoke/...`, `D:\a\_temp\smoke\...`), never a user home.

**`scripts/qa/owned-processes.test.ts`**
1. darwin rows yield pid, ppid, finite `startedMs` (a row 1 s later has a larger value) and the full
   executable path with spaces and parentheses (`.../Metis Helper (Renderer).app/Contents/MacOS/Metis Helper (Renderer)`).
   The role is that basename.
2. darwin rows that are blank, lack a start time or have an unparseable date are skipped.
3. win32 output parses both as an array and as a single object. `started` is kept. A Chromium child's
   role reads `Metis.exe (renderer)`. The command line is not present on any returned entry. A null
   `ExecutablePath` gives `exe: null` and role `unknown`.
4. `isInside` respects the path boundary (`/opt/smoke/Metis.app-old/x` is not inside
   `/opt/smoke/Metis.app`), is case-insensitive and accepts either separator on win32
   (`D:\A\_TEMP\SMOKE\metis.exe` is inside `d:/a/_temp/smoke`), and treats the root itself as not inside.
5. `ownedProcesses` includes main, a grandchild, and a root resident whose parent is pid 1 (the
   Crashpad shape). It excludes a same-named `llama-server` outside the root that is not a descendant,
   and a process whose recorded parent id equals main's pid but which started before main.
6. `ownedProcesses` with `mainPid: null` returns root residents only.
7. `survivors` does not count a PID reused with a different start time, counts an owned process that is
   still present, counts a new process under the root, and ignores unrelated processes.
8. `roleCounts` counts per role with sorted keys.

**`scripts/qa/packaged-smoke.test.ts`**
1. `parseAuditLog` returns records from JSON lines and skips blank and malformed lines.
2. `isOverlayUrl` accepts the overlay's `file:` URL with a query (`?exclusiveOnboarding=1`) and rejects
   `devtools:`, `about:blank` and another `file:` page.
3. `smokeVerdict`, table-driven. A complete good observation passes. Each single defect in the
   section 3.2 table yields exactly its code: crash and unresponsive both map to `app_reported_crash`,
   a missing main and a main-only census both map to `census_vacuous`, and a non-zero code and a signal
   both map to `exit_not_clean`. An observation that stopped before the survivor check with no
   recorded cause fails as `smoke_incomplete`.
4. `smokeReport` returns exactly the schema-1 key set. Build an observation whose process entries carry
   absolute paths and whose audit records carry extra fields (`bootId`, a `message` holding a
   path-shaped string). None of those strings appear in `JSON.stringify(report)`. `app` carries only
   version/platform/arch, and `events` holds only `LIFECYCLE_EVENTS`.
5. The CLI with no arguments exits 2, prints usage and writes no report (`spawnSync(process.execPath, [script])`).

**Order.**
- Commit 1 holds the two test files only. Pushing it gives a red *Build & Test* run on both Quality
  legs, because the modules do not exist yet. Record that run URL as the red run.
- Commit 2 holds the two modules and the workflow. Pushing it gives a green *Build & Test* run and a
  green *Packaged smoke* run with both jobs, and the `packaged-smoke-macos` and
  `packaged-smoke-windows` artifacts. Download both reports with
  `gh run download <id> --repo mysticalsin/AskToto-Mantu` and check that each says
  `"result": "pass"`. The PR quotes each report's `result`, `events`, `timingsMs` and
  `processes.atQuit` role names, not the files themselves.
- Local checks: only `npx tsc --noEmit -p tsconfig.node.json` and `-p tsconfig.web.json`. They are
  unaffected, but run them for the evidence table. Nothing else runs on the Mac.

## 5. What not to do

- Do not use Playwright's `_electron.launch` or `electronApplication.close()` (INV-4).
- Do not quit with SIGKILL, `taskkill /F`, `Stop-Process`, WM_CLOSE or `taskkill` without `/F` (INV-5).
  Do not add a product quit hook, a `--quit` argument or an env backdoor. Do not touch `src/`.
- Do not select, count or kill processes by name. Do not reuse or edit `scripts/qa/quit-app.mjs`: it
  swallows failures by design.
- Do not add an allowlist of tolerated survivors, raise `SURVIVOR_BOUND_MS` or the other bounds, or
  drop a failure code to get green.
- Do not write paths, command lines, environment values, audit details or error messages into the
  report, the step summary or the PR. Comments in the public repo cite ticket ids, never
  program-document sections.
- Do not edit `build.yml`, `release.yml`, `qa-candidate.yml` or `promote-candidate.yml`. Do not add
  `pull_request`, `schedule` or tag triggers. Do not add a Linux leg or `xvfb`.
- Do not reference any repository secret or signing identity, including `QA_MAC_SIGNING` and the
  QA-identity variant.
- Do not make the smoke a required check, and do not add it to `build.yml` `needs:`.
- Do not run the app, `node` on repository files, `npm test` or `npm run dist` on the Mac (D-28).
- Do not pre-build resource sampling (M2-0009), HK kill cycles (M2-0028/0029) or profile seeding here.

## 6. Risks and stop conditions

| Item | Label | What happens |
|---|---|---|
| Hosted runners give the app a window session (renderer-ready on macOS, a real window on Windows) | OBSERVED: qa-candidate run 36287562256; `build-mac` runs `dist` including the macOS launch gate, `build-win` runs `dist:win` including the window gate, and both smoke jobs are green | none |
| DMG install via `hdiutil`/`ditto` and NSIS `/S /D=` | OBSERVED: same run, smoke jobs | none |
| CDP attaches to the packaged overlay although `webPreferences.devTools` is off in packaged builds | DERIVED: Electron starts the DevTools HTTP server from the `--remote-debugging-port` switch; the repo's QA harness (`scripts/qa/e2e-workflows.mjs`) drives the app over CDP | **Stop** if `quit_request_failed` appears on both OS. Report the run URL. The lead chooses between SIGTERM on macOS (OBSERVED by the RC5 verifier to reach `before-quit` and `will-quit` on Electron 43.6.0) and a product-level quit request for Windows, which needs an owner decision |
| `app.renderer.ready` fires on windows-latest | DERIVED: emission is unconditional (index.ts:2821) | **Stop** on `renderer_not_ready` (Windows only) and report |
| The Crashpad handler exits after its last client | OBSERVED on macOS (RC5 verifier probe); UNKNOWN on Windows | **Stop** on `processes_survived` or `shutdown_not_recorded` with the unchanged product. It is a product finding: report the survivor roles and the run URL, and do not weaken the check |
| `ps -o comm` prints the executable path as launched | DERIVED | INV-8 and the role counts expose a mismatch. Stop if the census is vacuous |
| `workflow_dispatch` works only once the file is on the default branch | DERIVED (GitHub documented behaviour) | Until then the path-scoped push trigger is the lane's only entry, which suffices for this ticket |
| A push is rejected, or the red run is not red | none | Stop and report |

## 7. Acceptance amendments (for the lead; the ledger is not edited here)

D-9 moves the QA host from a physical account to the hosted runners, so the ticket's acceptance,
scope, verification and blocker no longer match. Proposed replacement:

**Title:** Provision the packaged smoke lanes on the hosted macOS and Windows runners (D-9).
**type:** `ci` (was `external`); clear `external_blocker`.
**scope_paths:** `.github/workflows/packaged-smoke.yml`, `scripts/qa/owned-processes.mjs`,
`scripts/qa/owned-processes.test.ts`, `scripts/qa/packaged-smoke.mjs`, `scripts/qa/packaged-smoke.test.ts`.

**acceptance:**
1. `packaged-smoke.yml` builds the unsigned app on `macos-latest` (`npm run dist`, ad-hoc signature, no
   certificate) and on `windows-latest` (`npm run dist:win`, unsigned) and references no repository
   secret. It runs on a push on any branch that changes the lane's files and on `workflow_dispatch`,
   never on tags. `release.yml`, `build.yml` and `qa-candidate.yml` are unchanged.
2. Each job installs from the shipped installer (DMG; NSIS Setup `/S`) into a fresh directory and runs
   the smoke on a fresh `ASKTOTO_USERDATA` profile with this bar:
   - `app.renderer.ready` within 150 s, then 3 s with no `app.crash` or `app.unresponsive`;
   - a clean quit through the app's own Quit IPC within 30 s: exit 0, `app.shutdown.clean` audited and
     `run-state.json` `clean: true`;
   - zero owned processes (descendants of main plus residents of the install root, identified by pid
     and start time) alive 5 s after main exits;
   - a non-vacuous census.
3. Each job uploads `packaged-smoke-<os>` holding the schema-1 content-free report and the tested
   installer's `SHA256SUMS.txt`, including when the smoke fails.
4. The census, verdict and report logic have behaviour tests that were red first in Build & Test.
5. Access verified: the lane ran its census once on each runner (the green run on the PR head).

**verification:** push to the ticket branch, then check that *Packaged smoke* is green on both jobs.
Once the file is on main, run `gh workflow run packaged-smoke.yml --ref <branch>`.
**required_evidence:** `HOST_CONFIGURED`: the Packaged smoke run URL with both reports, plus the Build &
Test red and green URLs (`LOCALLY_TESTED`).

**Removed or moved (each needs a lead decision):**
- The separate macOS user, the bootstrap script and the owner-account fallback rule are dropped by D-9.
  The rule that the owner's account is never a QA host stays an invariant, enforced by D-28.
- The TCC grant runbook is dropped. Hosted runners cannot hold persistent TCC grants. TCC-dependent
  packaged suites (capture, RV with screen recording) have no lane. This is a residual for the lead.
- `seed-profile.mjs` (the representative synthetic profile) should move to its first consumer, M2-0009
  or M2-0008. Real dataless and placeholder files cannot exist on hosted runners (no cloud sign-in), so
  the ST-1/ST-1-W real-dataless rows stay unhosted.
- The `windows-qa.yml` install-by-sha256 part is already delivered by `qa-candidate.yml` `smoke-win`
  (M2-0187), so it is dropped as a duplicate.
- The managed Windows 11 laptop (ST-1-W, HK-W, census, GPU/DPI/battery/EDR) stays with M2-0195 and
  M2-0196.

**Finding coverage (honest):**
- K09-R12 and K09-R13: the provisioning half is closed by the hosted runners and this lane (a clean
  host, a temp userData and a process-tree census on the installed Setup and DMG app). The baselines
  (startup memory and CPU, capture latency, size, temp peak, GPU) remain with M2-0009 and M2-0195.
- CHATGPT-A8: partial (process-lifetime evidence for a clean quit on both OS).
- CRITIC-INV-12: partial (the first Windows packaged runtime evidence).

**Downstream references to re-point** (their env still says "QA account" or "profile from M2-0007"):
- M2-0001 ("next run is on the isolated QA account");
- M2-0008 and M2-0009 (the representative profile);
- M2-0042 ("packaged onboarding smoke");
- M2-0202 ("QA account");
- ARCHITECTURE §6.1 (HK-M, ST-1 env) and §7.1 (the QA macOS user and managed Windows laptop rows).

`owned-processes.mjs` is the ownership primitive that M2-0009's census and the HK suites
(M2-0028/0029) can import. It carries no resource sampling.

## 8. Commit and PR plan

1. `test(qa): specify the packaged smoke's census, verdict and report [M2-0007]`: the two test files.
   The body says why: the lane's pass/fail logic is pinned before it exists.
2. `ci(qa): add packaged smoke lanes on the hosted macOS and Windows runners [M2-0007]`: the two
   modules and the workflow. The body covers D-9, INV-4/INV-5 (why not `_electron.launch`, why the
   Quit IPC) and INV-6 (ownership).
3. Each commit ends with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
4. Open a draft PR into `m2/integration` titled `ci(qa): packaged smoke lanes on hosted macOS and Windows runners [M2-0007]`
   using the template:
   - kit refs: none;
   - findings: K09-R12, K09-R13, CHATGPT-A8, CRITIC-INV-12 (partial, as in section 7);
   - evidence table: tsc (local), the Build & Test red and green URLs, the Packaged smoke URL with the
     two artifact names and each report's `result`;
   - not run: anything local (D-28), the x64 slice, TCC-dependent suites, real dataless files,
     managed-laptop items.
