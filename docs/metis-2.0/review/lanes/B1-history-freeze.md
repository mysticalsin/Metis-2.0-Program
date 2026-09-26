# Lane B1 — History freeze/crash root-cause analysis

Repo: `/Users/tony/AI-Brain-build/metis-2.0` (read-only checkout, origin/main `2bf21f1c`, v1.9.6)
Bug: *"when I click on History sometimes it just doesn't open the app again. It's running but it just freezes or crashes."*

Method: reproduce → root cause → regression test → surgical fix (per `14-reliability-and-recovery.md`, `27-operational-playbooks.md`, `software-delivery.md`). Evidence labels: **OBSERVED** (seen in code/logs/live data), **DERIVED** (reasoned from observed facts), **ASSUMED**, **UNKNOWN**.

---

## 1. Architecture: what "History" actually is

**OBSERVED.** History is **not** a separate window, tray item, or hotkey. It is a `view` state (`'history'`) inside the single overlay `BrowserWindow` (module-level `win` in `src/main/index.ts`), rendered by `RecallView.tsx`. Confirmed entry points, all converging on one chokepoint:

| Entry point | File:line | Calls |
|---|---|---|
| Bar "History" button | `src/renderer/src/components/Bar.tsx:779` (`props.onHistory`) | `onBarHistory` |
| RightEdgeSidecar "History" button (edge-docked layout) | `src/renderer/src/components/RightEdgeSidecar.tsx:382-391` | `onBarHistory` |
| `onBarHistory` (App.tsx) | `src/renderer/src/App.tsx:2732-2740` | `guardReviewNav(() => setView('history'))` |
| Escape key while Review is open | `src/renderer/src/App.tsx:3143-3163` (`returnTo = pastMeeting ? 'history' : 'answer'`) | same dirty-check inline |
| Review's own "Recent meetings"/Done exits | `src/renderer/src/components/Review.tsx:429-430` (`confirmDiscardRecapEdit`) | same pattern, own copy |

There is **no tray menu item and no global hotkey for History** (confirmed by grepping `HotkeyAction`/tray `Menu.buildFromTemplate` in `src/main/index.ts:4127-4446` — History never appears there).

Data path when the panel actually opens: `RecallView.tsx` → `window.toto.recallList()` / `recallSearch()` (`src/preload/index.ts:321-322`, async `ipcRenderer.invoke`) → `ipcMain.handle(IPC.recallList/recallSearch, ...)` (`src/main/index.ts:8538-8545`) → `listMeetings()`/`searchMeetings()` in `src/main/recall.ts:237-244` / `:949-978`. All I/O here is `node:fs/promises` (async) — **no `ipcRenderer.sendSync`, no sync fs, anywhere on this path** (checked all of `src/preload`, `src/renderer`, `src/main` — zero hits).

Meetings-folder evidence (count/size only, no content read, per hard rules): on this Mac the real folder resolves (via `resolveMeetingsFolder`, `src/main/transcripts.ts:580-595`) to `~/Library/CloudStorage/OneDrive-MantuGroup/Métis Meetings` → **59 `.md` files, 892 KB total**. At this size, `Promise.all`-driven concurrent decrypt+parse of every file (recall.ts:239, :953) is not, by itself, enough work to explain a multi-second freeze — it is a *latent* scalability defect (§4), not the acute bug Tony is hitting today.

## 2. Root cause #1 (P0, HIGH confidence): renderer-blocking `window.confirm()` on a window with nothing for the native dialog to attach to

**OBSERVED — the mechanism.** `guardReviewNav`, which every History entry point routes through when Review is open with unsaved changes, calls the browser-native, **synchronous, blocking** `window.confirm()`:

```
src/renderer/src/App.tsx:915-921
const guardReviewNav = useCallback((proceed: () => void): boolean => {
  if (viewRef.current === 'review' && reviewDirtyRef.current && !window.confirm('You have unsaved changes to this recap. Discard them?')) {
    return false
  }
  proceed()
  return true
}, [])
```

Same pattern independently duplicated at `App.tsx:2765` (minimize guard), `App.tsx:2792` (panel-toggle guard), `App.tsx:3143` (Escape-from-Review guard), and `Review.tsx:429-430` (`confirmDiscardRecapEdit`, used by Review's in-panel Resume/Done/Recent-meetings buttons) — **six** independent `window.confirm`/`window.alert` call sites in the renderer (`App.tsx:916, 2765, 2792, 3143, 3411, 3532`; `Review.tsx:430`; `Settings.tsx:6347, 7524`).

**OBSERVED — why this specific app is exposed to the failure mode.** The overlay window this dialog is attached to is:
- `frame: false`, `transparent: true`, `resizable: false`, `skipTaskbar: true` (`src/main/index.ts:2580-2618`, the `BrowserWindow` constructor in `createWindow()`);
- forced to `setAlwaysOnTop(true, 'screen-saver')` — the highest normal NSWindowLevel category, above menus/dialogs/floating panels (`applyOverlayAlwaysOnTop`, `src/main/index.ts:2512-2519`, called at `:2633`);
- hosted in an app that runs with **no Dock icon** (LSUIElement/accessory app).

**OBSERVED — the team already documented this exact failure mode, for a different call site.** `src/main/index.ts:8434-8439` (inside the `recapPdf` IPC handler):

> "Métis is an LSUIElement (accessory) app — no Dock icon, not a normal foreground app. A dialog opened with no parent BrowserWindow has nothing to attach its sheet to and no window to activate, so it can silently fail to ever surface on screen: **the promise just hangs forever with no error and no visible dialog.** Anchoring it to `win` (already on screen) is what every other dialog in this file does — this one was the one exception."

Every *main-process* dialog in the file (`dialog.showMessageBox`/`showMessageBoxSync`/`showSaveDialog`/`showOpenDialog`, 14+ call sites, e.g. `index.ts:4904, 4931, 5097-5098, 6189, 6220, 6281, 6471, 8442-8443, 8501, 8516`) is anchored to `win` and is either explicitly synchronous-by-design (`showMessageBoxSync` at `:3565`, a deliberate, understood block) or `await`ed asynchronously — never left unparented. **The renderer's `window.confirm()`/`window.alert()` calls are the one place this lesson was never applied**: they are Chromium-native modal dialogs attached to the *same* frameless, `screen-saver`-level, accessory-app window the comment above warns about, invoked on exactly the path (History/Escape-from-Review) Tony reports.

**DERIVED — the freeze.** `window.confirm()` in Electron on macOS blocks the calling renderer's JS thread until the dialog is dismissed; this is Electron's own documented reason to avoid `window.alert/confirm/prompt` in production apps (they are implemented via a native sheet + a blocking round-trip to the browser process, and a known Electron/Chromium footgun is that an unparented or improperly-attached dialog can render off-window, behind an always-on-top host, or not surface at all — leaving the calling thread blocked with **no error, no timeout, no visible UI**, matching this file's own description almost verbatim). This reproduces *exactly* what Tony describes: the process is alive ("it's running"), the window paints its last good frame forever ("it just freezes"), there is no crash record for this path (no `app.crash`/`render-process-gone` entry — the renderer isn't crashing, it's blocked waiting on a dialog nobody can see or answer).

**Why "sometimes"**: the freeze only fires when (a) the user is in Review, (b) the recap has unsaved edits (`reviewDirtyRef.current`), and (c) they then hit History or Escape — a normal, but not universal, "wrap up this meeting → check something in History" workflow. That intermittency matches the report precisely.

### Repro
1. Start a meeting, let it end and land on Review.
2. Edit the recap text (any keystroke sets `recapDirty`/`reviewDirtyRef.current = true`).
3. Click the "History" button (Bar or RightEdgeSidecar) — or press Escape.
4. Observe: the panel does not switch; the app stops responding to any further input; Activity Monitor shows the process alive and using ~0% CPU (blocked, not looping) with no new lines in `userData/logs/audit.log` for this event. Only Force Quit recovers it.

### Regression test
Add a contract test (mirroring the existing `no-show-steals-focus.contract.test.ts` pattern that greps `index.ts` for banned APIs) that greps `src/renderer/**/*.tsx`/`*.ts` for `window.confirm(`, `window.alert(`, `window.prompt(` and fails the build if any are found — forcing all 8 current call sites onto a non-blocking path (an in-DOM React confirm modal, which is ordinary content and cannot get lost off-window, or an IPC round-trip to the main process's already-correct `dialog.showMessageBox(win, …)` pattern). A second, behavioral test: automate the repro above (Playwright/electron test harness) and assert the view actually transitions to `'history'` within e.g. 2 s of the click when Review is dirty.

---

## 3. Root cause #2 (P0/P1, HIGH confidence, direct code fact): no recovery from a wedged (unresponsive) renderer

**OBSERVED.** `render-process-gone` (an actual renderer *crash*) has a full recovery path — it resets state and reloads the window (`src/main/index.ts:2737-2783`, ending in `self.loadURL(overlayRendererUrl())` at `:2782`).

**OBSERVED.** `unresponsive` (a *wedged but alive* renderer — precisely what RC1 produces, and Chromium's own signal for "JS thread blocked") gets no such treatment:

```
src/main/index.ts:2722-2726
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

This is a pure log-and-wait: no timeout, no forced reload, no destroy-and-recreate. If the renderer never becomes responsive again (RC1's dialog is never answered because nobody can see it), the window is wedged **for the life of the process**. This matches E6's crash-log evidence exactly: `render-process-gone reason=killed exitCode=15` immediately followed 5 s later by `app.unresponsive kind=overlay` with no further recovery event after it in the log — i.e. even the crash-recovery reload's *own fresh renderer* can wedge again with nothing to unstick it.

### Repro
Trigger RC1 (or any other renderer-blocking call), wait past `unresponsive`; confirm no further audit events (`app.crash`, reload, etc.) are ever written for that window — only the user's Force Quit ends it.

### Regression test
A contract test on the `unresponsive` handler: after N seconds (bounded grace period, e.g. 8–10 s) with no matching `responsive` event, main **must** call the same recovery `self.loadURL(...)`/recreate path `render-process-gone` uses, and must write an `app.crash`-class audit event recording the forced recovery (so this failure mode becomes visible in `audit.log` instead of silent).

---

## 4. Root cause #3 (P1, HIGH confidence, direct code fact): relaunch/`second-instance` cannot detect or heal a wedged window

**OBSERVED.**

```
src/main/index.ts:3472-3482
function ensureWindow(): BrowserWindow | null {
  if (win && !win.isDestroyed()) return win
  win = null
  try { createWindow() } catch (e) { ... }
  return win
}
```

```
src/main/index.ts:8785-8797
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const w = ensureWindow()
    if (!w) return
    if (!w.isVisible()) w.showInactive()
  })
  ...
```

Neither check uses `webContents.isResponsive()` — the exact boolean Electron already exposes and that §3's own `unresponsive`/`responsive` handlers are wired to. A wedged-but-visible window (RC1+RC2's outcome) is `!isDestroyed()` and `isVisible()` both `true`, so:
- `ensureWindow()` returns the *same hung window* unchanged;
- the `showInactive()` call is skipped entirely (`!w.isVisible()` is `false`).

A relaunch attempt during the freeze is therefore a complete no-op — it neither refreshes the window nor gives the user any signal that the app is aware it's stuck. This is the precise mechanism behind "it's running but it just doesn't open the app again": the single-instance lock (E9, `SingletonLock` present) correctly routes the second launch attempt to the first (still-running) process's `second-instance` handler, and that handler correctly runs (main-process event loop is *not* necessarily blocked by RC1 — `window.confirm` blocks the renderer's thread; the main process can still service its own event loop and IPC), but `ensureWindow()` has no way to tell "alive" apart from "alive but wedged," so it does nothing useful.

### Repro
With the window wedged via RC1, launch a second instance of the app (or double-click the Dock/Spotlight icon). Observe: no visible change, no new window, no error — matching Tony's report verbatim.

### Regression test
A contract test asserting `ensureWindow()`/the `second-instance` handler branch on `win.webContents.isResponsive()`: when `false`, run the same forced-recovery path proposed for RC2 (reload/recreate) instead of `showInactive()`-on-an-already-visible-window.

---

## 5. Root cause #4 (P2, MEDIUM confidence — latent scalability/architecture defect, not today's acute trigger)

**OBSERVED.** `listMeetings()` (`src/main/recall.ts:237-244`) and `searchMeetings()` (`src/main/recall.ts:949-978`) both do:

```ts
const read = await Promise.all((await meetingFiles(folder)).map((f) => readMeeting(folder, f)))
```

— an **uncapped-concurrency**, full read+AES-GCM-decrypt+regex-parse (`searchMeetings` additionally does a full-text substring scan) of **every** meeting file in the folder, on **every** History open and **every** debounced search keystroke, on the **main process** (`ipcMain.handle(IPC.recallList/recallSearch, ...)`, `index.ts:8538-8545`). A per-file `(mtimeMs,size)` read cache (`recall.ts:117-165`) makes repeat calls on an unchanged library cheap, but the *first* call after any file changes (or the first call each session) still re-reads and re-decrypts the entire library synchronously-in-effect (all promises fire concurrently with no batching/queueing).

At Tony's current library (59 files / 892 KB) this is fast and **not** today's freeze — but it is architecturally the same shape of bug as RC1–RC3's underlying theme (unbounded work on the one process that also owns tray/hotkey/second-instance dispatch): as the meeting library grows (or after a bulk import), History-open latency degrades linearly with zero backpressure, and because it runs on the main process, a slow scan stalls the *whole app* (tray, hotkeys, second-instance), not just the History panel. Flagging as a v2.0 refactor target: replace the full-rescan-per-call pattern with an incremental, persisted index (append-only or SQLite) updated on write/delete, so History-open cost is O(changed files) instead of O(all files).

### Regression test
A performance/contract test that seeds N (e.g. 500–2000) synthetic `.md` meeting files in a temp folder and asserts `listMeetings()`/`searchMeetings()` complete within a fixed latency budget (e.g. <300 ms) and do not spike concurrent open-file-descriptor count past a bound — failing the build if the naive full-rescan pattern regresses past the budget as the corpus grows.

---

## 6. Ranked summary

| # | Root cause | Severity | Confidence | File:line |
|---|---|---|---|---|
| 1 | `window.confirm()` blocks on a frameless/`screen-saver`-level/accessory-app window with nothing for the dialog to attach to → invisible, unanswerable, permanent freeze | **P0** | High | `App.tsx:916,2765,2792,3143`; `Review.tsx:430`; `index.ts:2512-2519,2580-2618,8434-8439` |
| 2 | No recovery path for `unresponsive` (only `render-process-gone` self-heals) | **P0/P1** | High | `index.ts:2722-2726` vs `2737-2783` |
| 3 | `ensureWindow()`/`second-instance` never check `isResponsive()`, so relaunch cannot heal or even detect a wedged window | **P1** | High | `index.ts:3472-3482`, `8785-8797` |
| 4 | Unbounded, non-indexed full-library rescan on every History open/search, on the main process | **P2** | Medium (latent; not today's trigger at 59 files) | `recall.ts:237-244,949-978`; `index.ts:8538-8545` |

## 7. Surgical fix recommendation (for the Opus planner)

1. Ban `window.confirm`/`window.alert`/`window.prompt` from the renderer (contract test + lint rule); replace the 8 call sites with a small in-DOM confirm component (a normal React modal rendered inside the existing panel — cannot get lost off-window because it isn't a separate native surface). This alone removes the acute freeze.
2. Add a bounded-timeout forced-recovery path to `win.on('unresponsive', …)`, symmetric with the existing `render-process-gone` handler.
3. Make `ensureWindow()`/`second-instance` consult `webContents.isResponsive()` and route into the same forced-recovery path instead of silently returning/no-opping on a wedged window.
4. (v2.0 scope) Replace `recall.ts`'s full-rescan-per-call pattern with an incrementally maintained index.

None of these require touching orphaned-sidecar reaping, local-LLM cold-start, or the screen-capture retry loop (E2/E4/E5/E7/E8) — those are other lanes' territory; noted here only because they share the same audit.log evidence stream the lead supplied.
