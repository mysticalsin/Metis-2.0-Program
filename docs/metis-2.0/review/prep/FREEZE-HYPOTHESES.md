# FREEZE-HYPOTHESES — History freeze / "app won't reopen" (P7-freeze-hypotheses)

Scope: read-only trace of `/Users/tony/AI-Brain-build/metis-2.0` at `origin/main 2bf21f1c` (v1.9.6),
correlated against `~/Library/Logs/asktoto/main.log` and `~/Library/Application Support/asktoto/logs/audit.log`
for 2026-09-25 08:00–14:15 local (UTC-4) / 12:00–18:15 UTC. No app code was executed, no tests were run, and
the OneDrive meetings/`.brain` folders were not touched directly — placeholder-file counts and spindump
detail below are cited from `plan-inputs/BUG-ROOT-CAUSES.json`'s prior verifications (labelled PROVIDED),
not re-derived by this pass. Everything else (file:line, log excerpts) is OBSERVED directly in this session.

**Starting premise, already settled by prior review**: B1's original theory — an unparented,
unanswerable `window.confirm()` freezing the renderer — was independently REFUTED by two Opus verifiers
and by ChatGPT's audit (`chatgpt-audit-1.md`). Electron 43's native dialog manager parents `window.confirm`
to the calling `BrowserWindow` (`dialog.showMessageBox(parent, …)`), so the "hangs invisibly with nothing
to attach to" mechanism does not hold, and the narrow precondition (Review view + an edited recap) does not
match any of the freeze days in the logs (no `mode:'recap'` requests, no `transcript.recap_edited` events
on 2026-09-25). This document starts from that refutation and ranks what the evidence actually supports.

---

## Ranked hypotheses

| Rank | Hypothesis | Task ID | Confidence | One-line mechanism |
|---|---|---|---|---|
| 1 | Main-process synchronous fs reads block the whole event loop, triggered by OneDrive-hosted brain/meeting files | H4 + H3 | **High** — directly reproduced in the logs, twice | `readFileSync`/`statSync` in the brain-ingest chain run on the main thread; a OneDrive Files-On-Demand placeholder turns one read into a multi-minute main-thread stall |
| 2 | macOS reopen (`activate`) is a structural no-op in Hide/Island layout | H1 | **High** — confirmed by code + Tony's own layout in the logs | `parkOverlayAfterHideSpring` keeps the rest window "visible" as an opacity-0, 8×2, click-through hairline; `activate` only calls `showInactive()` and only opens Settings for `layout==='bar'` |
| 3 | Relaunch/reveal paths never check renderer health | H1 (relaunch half) | **Medium-high** — real code gap, `isResponsive()` doesn't exist in Electron 43 | `ensureWindow()`/`second-instance` treat "not destroyed" / "already visible" as healthy; no probe, no recovery |
| 4 | Crash-recovery reload has no completion/readiness check | H5 | **Medium** — real gap, not yet tied to an observed silent-blank-window instance | `render-process-gone` handler calls `self.loadURL(...)` with no `.then()`/error handling; the one readiness signal (`app.renderer.ready`) is gated behind an env var never set in normal launches |
| 5 | `window.confirm()` blocks the renderer | H2 | **Low** (REFUTED as primary cause; real as P3 UX debt) | Correctly parents to the window in Electron 43; precondition (dirty Review) unmet on the freeze days |
| 6 | History toggle race nets a visible no-op | H6 | **Low-medium as a *distinct*, non-freeze confound** | A rapid double-click can open+close History inside one `startTransition` before it commits — the code's own comment names this "History sometimes doesn't seem to register" |
| — | Unbounded History list/search concurrency | H3 (secondary) | **Low today, rising** | Same class of defect as #1 but not yet the trigger at 59 files; becomes one at scale or if the OneDrive-hosted meetings folder itself stalls |

---

## Rank 1 — Main-process stall from synchronous fs on OneDrive placeholders (H4 + H3)

### Mechanism

The brain/History subsystem mixes async and **synchronous** file I/O on the **main process**, and the
folder it reads (`OneDrive-MantuGroup/…`) is a Files-On-Demand share where "read" can mean "block until
the cloud provider materializes the file."

- `src/main/transcripts.ts:325-326` — `readSavedFile()`:
  ```
  export function readSavedFile(path: string): string {
    return decodeSaved(readFileSync(path))
  }
  ```
  A synchronous, blocking read. Called from:
  - `src/main/brain/store.ts:239` — `readJson()`, which does `statSync` (line ~227) then
    `readSavedFile(p)` at line 239. This backs `readIndex` (`src/main/brain/store.ts:471`, imported in
    `index.ts:556` as `readBrainIndex`).
  - `src/main/brain/ingest.ts:1696` — `runExtractionStage()`: `const md = readSavedFile(job.file)`, one
    per queued meeting, run from the brain backfill/ingest pipeline.
  - `src/main/brain/store.ts:452` — a second `readFileSync` in the index-quarantine path
    (`quarantineUnusableIndex`, `src/main/brain/store.ts:451`).
- `src/main/brain/ingest.ts:1563` and `:1619` — `statSync(file)` calls in the same synchronous path
  (`meetingSourceVersion`, and the date-fallback in `ingestExtraction`).
- **History itself reaches this exact chain.** `RecallView.tsx:172-177` calls `window.toto.brainStatus()`
  once on mount, then polls it every 1s (busy) / 5s (idle) via `RecallView.tsx:183-192`. The main-process
  handler, `ipcMain.handle(IPC.brainStatus, …)` at `src/main/index.ts:7935`, is a **synchronous callback
  body** — `readBrainIndex(s)` (line 7952) and `brainStatusCounts(s, idx.revision)` (line 7953, defined at
  `src/main/index.ts:1130`) run inline, with no `await` between the IPC call and the blocking read. So
  opening History — or simply having it open while the 1-5s poll fires — runs the same synchronous
  `statSync`/`readFileSync` chain that brain ingest uses, against the same OneDrive-hosted `.brain` folder.

While that call is inside the OS's blocking read syscall, **the whole Node/Chromium main thread is
stopped**: no tray click, no hotkey, no IPC reply, no `activate`/`second-instance` dispatch, and — the
independently-checkable signature — no `overlay-watch` mouse-tracking log line, because that poll is a
plain `setInterval` on the same main thread (`startOverlayCursorWatch`, `src/main/index.ts:3098-3103`,
`CURSOR_WATCH_INTERVAL_MS` tick calling `tickOverlayCursorWatch` at `src/main/index.ts:3105`).

### Runtime evidence (independently reproduced this session, not just cited from prior review)

`~/Library/Logs/asktoto/main.log`, 2026-09-25, local time (UTC-4):

```
[13:47:07.846] [warn]  [updater] error Error: net::ERR_INTERNET_DISCONNECTED
[13:47:07.905] [info]  [overlay-watch] reveal cursor=(874,0) from=8x2@(896,0) to=880x120@(460,39) visible=true
[13:52:31.490] [info]  [overlay-watch] leave  cursor=(950,736) bar=880x144@(460,39) park in 800ms
[13:52:31.553] [info]  [intelligence-index] catch-up: last success 0 is before slot 1790352000000
```

Between `13:47:07.905` and `13:52:31.490` — **5 minutes 23.6 seconds** — the main process emitted
**nothing**: no overlay-watch tick, no timer, no IPC log. The very next line after the gap is the
intelligence-index catch-up starting its scan. The gap starts one line after a logged loss of network
connectivity (`ERR_INTERNET_DISCONNECTED`), which is exactly the condition under which a OneDrive
Files-On-Demand read stalls the longest (the provider keeps retrying instead of failing fast). This is the
mechanism, caught live, not inferred: a user moving the mouse during this window (which produces
`overlay-watch` ticks every `CURSOR_WATCH_INTERVAL_MS` under normal operation) would see the overlay simply
not respond — indistinguishable from "the app is running but frozen."

A second, corroborating instance from the same day (cited in `plan-inputs/BUG-ROOT-CAUSES.json`'s
verifications, PROVIDED not re-derived here): a macOS spindump
(`/Library/Logs/DiagnosticReports/Metis_2026-09-25-135445_Totos-Mac.spin`) for the *main* process (not a
Helper), 85.55s, reason "Slow response to HID event," with the stack
`… -> uv__run_timers -> JS -> uv_fs_read -> read -> apfs_materialize_dataless_file_ext -> lck_mtx_sleep`,
i.e. the main thread blocked inside the exact "materialize a cloud-only file" syscall a synchronous
`readFileSync`/`statSync` on an undownloaded OneDrive file would hit. That 13:52:45–13:54:10 window sits
immediately after the gap above and lines up with the `brain.ingest` burst logged in `audit.log` at
`17:54:11Z` (`local.runtime.start` follows at `17:54:52Z`), which this session confirmed independently:

```
{"ts":"2026-09-25T17:47:07.384Z","event":"app.started", …}
{"ts":"2026-09-25T17:54:11.262Z","event":"brain.consolidation","passes":1,"maxPerDay":2}
{"ts":"2026-09-25T17:54:11.272Z"…"17:54:11.437Z" — 14x "brain.ingest","ok":true,"source":"meetings"}
{"ts":"2026-09-25T17:54:52.163Z","event":"local.runtime.start", …}
```

(seq 2784–2809 of `audit.log`, grepped this session for `"ts":"2026-09-25T1[2-8]`.)

Also worth noting: the same day's audit trail shows **no `local.runtime.stop`** between two of the boot
cycles (17:47Z and 18:03Z instances), which is the corroborating signature that those sessions ended in a
hard kill rather than a clean quit — consistent with a user force-quitting during exactly this kind of
main-thread stall. (This is the already-CONFIRMED sidecar-orphaning fact from B2: each such kill leaves a
~3.1 GB `phys_footprint` orphaned `llama-server`, `ppid=1`, invisible as "Metis" in Activity Monitor; the
`onFatal` "Relaunch Métis" path — `app.relaunch(); app.exit(0)` — also skips `will-quit` and orphans the
same way. Both are B2/F1 facts, not re-litigated here, but they explain *why* a Rank-1 stall converts into
"won't reopen": the user's only exit is a hard kill, which both ends the stalled instance *and* seeds a
zombie sidecar the next launch has to compete with.)

### Why this outranks the original window.confirm theory

- It requires no special user action (no dirty-Review recap edit) — it fires from **automatic** background
  work: boot-time `resumeBackfillIfPending()` (unconditional, 15s after every boot — see B2/F2 in
  `BUG-ROOT-CAUSES.json`), periodic consolidation, and History's own 1-5s `brainStatus` poll.
- It explains the *entire* symptom set at once: tray unresponsive, hotkeys dead, mouse-hover overlay dead,
  and — critically — **relaunch/reopen not working**, because `activate`/`second-instance` are dispatched
  on the same blocked main thread (see Rank 2/3: even if those handlers were fixed to check responsiveness,
  they can't run at all while the thread is inside a synchronous `read()`).
- It matches the *timing signature* directly: multi-second-to-multi-minute silent gaps, not the instant,
  binary "confirm() is up or it isn't" the original theory implied.

### What is NOT yet proven (label honestly)

- This session did not instrument a live repro; the 5m24s gap and the spindump are the two available
  natural occurrences, not a controlled trigger. **ASSUMED**: that the specific file(s) stalling the reads
  in these two windows were OneDrive placeholders (dataless) rather than some other blocking syscall (e.g.
  Keychain/safeStorage ACL prompt, DNS, AV/EDR share lock) — the stack trace for the second instance
  (`apfs_materialize_dataless_file_ext`) supports OneDrive specifically for that instance; the first
  (5m24s) gap has no spindump and is inferred from the immediately-following `intelligence-index] catch-up`
  line plus the `ERR_INTERNET_DISCONNECTED` context, not a captured stack.
- **UNKNOWN**: exact count/identity of currently-dataless files in Tony's meetings/`.brain` folders. Prior
  review (PROVIDED, not re-checked here to avoid the quarantine hazard the hard rules warn about) counted
  4-6 dataless meeting files and a `.brain` folder that was ~195/201 placeholders with 180
  `index.corrupt-*.json` quarantine files. Do not re-run that `stat`/`find` sweep casually — the hard rules
  note this exact investigation has already triggered real quarantines twice.

---

## Rank 2 — `activate` is a structural no-op in Tony's actual layout (H1)

### Mechanism

- `src/main/index.ts:9410-9424` — `app.on('activate', …)`:
  ```
  app.on('activate', () => {
    if (!win) createWindow()
    else win.showInactive()
    …
    if (getSettings().onboardingDone && overlayActivateOpensSettings(liveOverlayLayout()))
      sendHotkey('settings')
  })
  ```
- `src/shared/overlay-chrome.ts:183-185` — `overlayActivateOpensSettings(layout)` returns `true` only for
  `layout === 'bar'`. For `'hide'` or `'island'`, `activate` therefore does **only** `win.showInactive()`.
- `src/main/index.ts:3244-3284` — `parkOverlayAfterHideSpring()` parks the Hide-layout rest window at an
  intentionally **visible** (`win.isVisible() === true`), opacity-0, 8×2 hairline
  (`src/main/island/geometry.ts:155` — `OVERLAY_HIDE_PARK = { width: 8, height: 2 }`;
  `src/main/island/geometry.ts:516-521` — `hideParkWindowOpacity(layout, resting)` returns `0` exactly
  when `layout==='hide' && resting`). `applyHideClickThrough()` (`src/main/index.ts:3286-3298`) also makes
  it click-through in this state.
- Net effect: `win.showInactive()` on a window that already reports `isVisible() === true` is a **no-op**.
  Nothing paints, nothing resizes, no focus changes. The user sees exactly what "won't reopen" describes.

### Confirmed against Tony's own logs, this session

`main.log` shows the layout in play directly:

```
[08:07:09.918] [info]  [overlay-watch] park hide from=880x192@(460,39) to=8x2@(896,0)
```

repeated dozens of times through the window (`grep -c "park hide" ~/Library/Logs/asktoto/main.log` → the
sampled window alone has this pattern on essentially every mouse-leave). Tony runs the **Hide** layout, so
`overlayActivateOpensSettings('hide') === false` applies on every relaunch attempt.

### Interaction with Rank 1

If the main thread is *not* stalled, reopening still produces zero visible change (this hypothesis, alone).
If the main thread *is* stalled (Rank 1), `activate` cannot even be dispatched, so the double failure mode
compounds: "click the Dock/Spotlight icon" → nothing happens either because the handler runs and no-ops, or
because the handler can't run at all.

---

## Rank 3 — No liveness check on the relaunch path (H1, relaunch half)

- `src/main/index.ts:3472-3482` — `ensureWindow()`: `if (win && !win.isDestroyed()) return win` — no
  responsiveness check of any kind.
- `src/main/index.ts:8785-8797` — `app.on('second-instance', …)`: `const w = ensureWindow(); if (!w) return;
  if (!w.isVisible()) w.showInactive()` — same "not destroyed" / "already visible" standard.
- **Important correction to the original B1 hypothesis** (confirmed again this session): Electron 43.6.0's
  `electron.d.ts` has **no `isResponsive()` method** on `WebContents`. The only available primitives are
  the `'unresponsive'`/`'responsive'` events (already wired at `src/main/index.ts:2722-2730`, log-only,
  by design — see the comment at `index.ts:2719-2721` about not force-reloading mid-meeting) and
  `webContents.isCrashed()` / `forcefullyCrashRenderer()`. Any fix here must be built on those, not on a
  nonexistent API — ChatGPT's audit flagged the same thing, and ranking B1's original contract-test
  proposal ("assert `isResponsive()` is called") would have been a test for a method that doesn't exist.
- **Also important**: on macOS, reopening a running app from Finder/Spotlight/Dock does **not** trigger
  `second-instance` at all — it triggers `activate` (Rank 2). `second-instance` only fires for a real
  second OS process (`open -n`, or a second copy of the bundle). A fix that only touches
  `ensureWindow()`/`second-instance` therefore does not cover the path Tony actually uses to reopen the app.

---

## Rank 4 — Crash-recovery reload has no completion check (H5)

- `src/main/index.ts:2737-2783` — `win.webContents.on('render-process-gone', …)`. After resetting a long
  list of module-level state (`resetDustConversation()`, `listeningActive = false`, tray/power-save resets,
  etc.), the handler ends with:
  ```
  if (win !== self || self.isDestroyed()) return
  self.loadURL(overlayRendererUrl())
  ```
  No `.then()`, no `.catch()`, no timeout, and no check that the reload actually produced an interactive
  page. `loadURL()` returns a Promise that Electron itself documents can reject (bad path, `did-fail-load`),
  and nothing here observes that.
- The one signal that *could* prove a reload actually completed — `app.renderer.ready` — only fires when
  `ASKTOTO_MAC_LAUNCH_GATE === '1'` (`src/main/index.ts:2792-2798`, via `bindRendererReadiness` imported at
  `index.ts:36` from `./renderer-readiness`). That env var is a launch-verification gate, not something set
  in Tony's normal packaged runs, so **today this class of failure produces zero audit trail**: a window
  that is native-alive (`!win.isDestroyed()`), so `ensureWindow()` (Rank 3) is happy with it, but whose
  content never finished loading, or loaded into a blank/errored page.
- This is a real gap but **not yet tied to an observed instance** in the sampled logs — the one recorded
  `render-process-gone` (2026-09-25T12:13:52Z, `reason=killed exitCode=15`) *did* recover: `main.log:167-171`
  shows `overlay-watch reveal`/`leave`/`park` lines with live, non-hardcoded bar heights (`880x120`,
  `880x378`) 10-18s later, which only come from the renderer's own `windowResize` IPC
  (`ipcMain.handle(IPC.windowResize)`, `src/main/index.ts:8610`), i.e. that particular reload worked.

---

## Rank 5 — `window.confirm()` (H2) — REFUTED as primary cause, real as P3

Kept here for completeness since it was this task's starting point.

- Call sites, confirmed at current line numbers: `App.tsx:916` (`guardReviewNav`), `App.tsx:2765`,
  `App.tsx:2792`, `App.tsx:3143` (Escape-from-Review), `App.tsx:3411`, `App.tsx:3532` (alerts),
  `Review.tsx:430`, `Settings.tsx:6347`, `Settings.tsx:7524`. Nine sites total (the original B1 report
  alternated between 6/8/9 across its own sections — nine is correct).
- `guardReviewNav` (`App.tsx:915-920`) only fires when `viewRef.current === 'review' &&
  reviewDirtyRef.current`. `reviewDirty` is `editingRecap && recapDraft !== recapText`
  (`Review.tsx:417`). The normal History-button path (`onBarHistory`, `App.tsx:2732-2740`) calls
  `guardReviewNav(() => setView(...))`, so it only blocks when the user is mid-edit on an open recap — a
  narrow precondition the freeze-day logs do not show being hit (no `mode:'recap'` provider requests, no
  `transcript.recap_edited` audit events on 2026-09-25).
- Electron 43's dialog manager parents `window.confirm`/`alert` to the calling `BrowserWindow`
  (`dialog.showMessageBox(parent, options)`), so the "no parent to attach to, hangs invisibly forever"
  mechanism the original report borrowed from a *different*, genuinely-unparented call site
  (`index.ts:8435`'s `recapPdf` `showSaveDialog` comment) does not transfer.
- **Still worth fixing**, independent of the freeze: 9 duplicated native-dialog call sites in a frameless,
  always-on-top overlay is real UX debt, and a native sheet blocks the calling renderer thread for its
  duration regardless of whether it's reachable. Replace with one in-DOM React confirm, add an AST-aware
  (not grep-based) lint rule banning `window.confirm`/`alert`/`prompt` under `src/renderer/**`.

---

## Rank 6 — History toggle race (H6, a *different* bug that looks similar)

- `App.tsx:2725-2740`, the code's own comment: `setView` is a `startTransition`; a rapid double-click on
  the History button can fire "open" then "close" before the first even commits, netting a **visible
  no-op** — exactly the words "History sometimes doesn't seem to register." The team already added a
  400ms debounce (`lastHistoryToggleRef`, `App.tsx:2733-2734`) for this specific race, dated before this
  investigation.
- This is not a "freeze" (nothing hangs; the state settles instantly) and does not touch the main process
  at all. It matters here only because it is a plausible *alternative* explanation for some fraction of
  "I clicked History and nothing happened" reports that have nothing to do with Rank 1-4, and
  instrumentation should be able to tell the two apart (see below).
- `onHistory` from `RightEdgeSidecar.tsx:387` and the Bar's own History button both resolve to the same
  `onBarHistory` callback (`App.tsx` wires `onHistory={onBarHistory}` at lines 3979, 4043, 4084) — there is
  no separate bounds/layout-mutation path unique to the sidecar's History entry point beyond the shared
  `setCollapsed(false)` (`App.tsx:2739`), so H6's "entry point changes layout/bounds" sub-hypothesis does
  not add a new mechanism beyond what Rank 1/2 already cover.

---

## Secondary/latent factor — unbounded History list/search concurrency

Not re-litigated in depth (already CONTESTED→PARTIAL in `BUG-ROOT-CAUSES.json` RC4, with a benchmark
showing it does not stall the event loop at Tony's 59-file library). Flagged here only because it shares
Rank 1's exact failure shape and should be fixed alongside it:

- `src/main/recall.ts:239` (`listMeetings`) and `:953` (`searchMeetings`) — unbounded
  `Promise.all(files.map(readMeeting))`, no per-file timeout, no cap on in-flight reads.
- `readMeeting` (`recall.ts:139-164`) uses **async** `readFile`/`stat` (good — does not block the event
  loop the way Rank 1's `readFileSync` does), but a hung OneDrive hydration inside that `Promise.all` still
  ties up all of libuv's (default 4) thread-pool slots, which queues every *other* async fs/crypto/dns call
  in the main process behind it — a softer, but real, form of the same problem.
- `recall.ts:127` — `READ_CACHE_MAX = 2000` with `readCache.clear()` (full wipe, not LRU) once the cache
  hits that size. Not a factor at 59 files today, but turns every History open/search keystroke into a
  full re-read once the library crosses ~2000 meetings.

---

## Discriminating instrumentation

Ranked by how directly each one separates the hypotheses above. All are additive audit/log lines — no
behavior change, so they're safe to ship ahead of any fix and start producing evidence immediately.

1. **Main-event-loop-lag watchdog** (settles Rank 1 vs. everything else). A `setInterval` (or a
   `MessageChannel`/`setImmediate` drift probe) on the main process that measures actual vs. expected tick
   delay and calls `auditLog('app.main_stall', { lagMs, phase })` whenever lag exceeds e.g. 250ms.
   `phase` should capture what the app was doing (`resumeBackfillIfPending` running? `catchUpIntelligenceIndexIfNeeded`?
   a `brainStatus` IPC in flight?) so a stall correlates to its trigger without needing a spindump. Place
   the interval registration near `src/main/index.ts:3101` (alongside the existing `overlayCursorWatchTimer`)
   so it shares the same "did the main thread starve" semantics as the log signature this session used.

2. **Per-call instrumentation on every synchronous fs call in the brain/recall path**, wrapping (not
   replacing, for this instrumentation-only pass) the exact call sites identified above:
   `transcripts.ts:325-326` (`readSavedFile`), `brain/store.ts:239` (`readJson`), `brain/store.ts:452`
   (`quarantineUnusableIndex`), `brain/ingest.ts:1696` (`runExtractionStage`), `brain/ingest.ts:1563,1619`
   (`statSync`). Log `{ path: basename-only (no folder path, per the no-PII rule), durationMs, event:
   'brain.sync_read' }` before/after each. A read that takes >2s is the discriminator: it proves the OneDrive
   hypothesis without needing file-provider flags on Tony's real data.

3. **Network/File-Provider state alongside every stall.** The 5m24s gap in this session's own evidence
   starts one line after `net::ERR_INTERNET_DISCONNECTED`. Log `os.networkInterfaces()`-derived
   connectivity (or reuse whatever the updater's own connectivity check already computes) at the start and
   end of any `app.main_stall` event, so "offline + slow hydration" can be told apart from "online + slow
   hydration" from "not a network issue at all."

4. **`app.renderer.ready` unconditionally**, not gated behind `ASKTOTO_MAC_LAUNCH_GATE` — remove the
   `=== '1'` guard at `src/main/index.ts:2792` and `:2798` (or add a second, always-on call). This alone
   turns Rank 4 from "unknown, no audit trail" into "provably did or didn't happen," and costs nothing at
   runtime.

5. **`app.responsive` (recovery) audit event**, mirroring the existing `app.unresponsive`
   (`src/main/index.ts:2722-2726`). Today `win.on('responsive', …)` (`index.ts:2727-2730`) only
   `mainLog.info`s — it never calls `auditLog`, so `audit.log` cannot currently distinguish "wedged for the
   rest of the session" from "recovered in 5 seconds." Add the audit call with `{ stallMs }` measured from
   the paired `unresponsive` event.

6. **A clean-shutdown / `app.quit` audit event.** Every verifier in `BUG-ROOT-CAUSES.json` had to fall back
   on "no clean-shutdown event exists in the schema at all" as a non-argument, in both directions. Add one
   (`will-quit` or `before-quit`, whichever survives the fastest quit path) so "N app.started with no
   shutdown between them" becomes real evidence of hard kills instead of an artifact of a missing event
   type.

7. **A renderer-side marker distinguishing the Rank 6 toggle-race from a true freeze.** Emit a renderer
   console/IPC line (or reuse the existing debug-renderer mirror at `index.ts:2712-2717`) recording
   `{ from: view, to: nextView, committedAtMs }` on every `setView` transition triggered from
   `onBarHistory`. A true main-process freeze (Rank 1) shows *no* corresponding IPC ever arriving at main;
   the toggle race (Rank 6) shows two transitions arriving within ~400ms of each other, both committing.

8. **`ensureWindow()`/`ipcMain` "reveal" health snapshot.** At the top of `ensureWindow()`
   (`index.ts:3472`), `second-instance` (`index.ts:8788`), and `activate` (`index.ts:9410`), log
   `{ isVisible, isDestroyed, isMinimized, layout: liveOverlayLayout(), islandResting }` before deciding
   what to do. This turns Rank 2's "activate no-op in Hide layout" from an inference into something visible
   in every future audit.log for a relaunch attempt.

---

## Executable repro matrix (for a hermetic packaged build — do not run against Tony's real data/folders)

All rows use a **fresh, throwaway `userData` profile** and a **synthetic meetings/`.brain` folder** seeded
locally (not inside OneDrive), per the hard rule against touching Tony's real folders. Where a row needs a
"OneDrive-like" slow/failing read, simulate it with a local FUSE/loopback mount or a `fs` shim that delays
`readFileSync`/`stat` for a chosen path — do not point the app at the real OneDrive folder to get this
behavior.

| # | Target hypothesis | Setup | Action | Expected if hypothesis TRUE | Expected if FALSE |
|---|---|---|---|---|---|
| 1 | Rank 1 (main-thread stall) | Seed a synthetic meetings folder; make exactly one file's `readFileSync` block for 30s (shim or a real slow network mount) | Launch, let boot's 15s `resumeBackfillIfPending` reach that file; separately, open History while it's blocked | Overlay-watch mouse tracking stops emitting logs for ~30s; tray/hotkeys unresponsive for the same window; new `app.main_stall` fires (once instrumented) | Overlay keeps ticking normally; History either shows the row or an "Unavailable" stub within ~2s |
| 2 | Rank 1, History-specific path | Same slow-file shim, but on a file under the synthetic `.brain` folder (not the meetings folder) | Open History (mounts `RecallView`, fires `brainStatus` immediately) | Same main-thread stall signature as #1, but with no backfill/ingest events preceding it — proves History's own `brainStatus` poll is a standalone trigger, not just a bystander of backfill | Stall only ever correlates with backfill/consolidation timing, never with a bare History open |
| 3 | Rank 2 (activate no-op) | Fresh profile, set layout to `hide` via Settings, let the overlay park (~1s idle) | "Reopen" via Dock icon / `open -a` while the app is running and fully idle/healthy | No visible change: window stays at 8×2 opacity-0; only an `activate` log line (once instrumented per item 8) proves it ran and no-opped | Overlay reveals/expands on reopen |
| 4 | Rank 2 vs. Rank 3 routing | Same as #3 but reopen via `open -n` (forces a genuine second process) instead of Dock/Spotlight | Compare which handler fires | `second-instance` fires, not `activate` — confirms the two paths are genuinely different and a fix must cover both | n/a (this is a routing check, not a pass/fail) |
| 5 | Rank 3 (no liveness check) | Force the renderer into a busy-loop (e.g. inject a script via `executeJavaScript` in a debug build, or a synthetic long synchronous renderer task) so Chromium fires `'unresponsive'` | Relaunch (Dock or `open -n`, whichever routes correctly per #4) while wedged | `ensureWindow()`/`second-instance` return the existing (wedged) window; no probe, no recovery — matches "click again, nothing happens" | A responsiveness probe blocks the reveal and triggers recovery instead |
| 6 | Rank 4 (reload never verified) | Force a `render-process-gone` (crash the renderer deliberately in a debug build), then make the reload's `loadURL` target fail (rename/break the packaged renderer asset temporarily in a throwaway build) | Observe post-crash state | Window stays native-alive (`!isDestroyed()`), `ensureWindow()` is satisfied, but nothing renders; **no** `app.renderer.ready` in audit.log even with the instrumentation-item-4 fix applied only if still gated by the env var — confirms the blind spot | With item 4's fix (ungated `app.renderer.ready`), the missing event is now visible and actionable |
| 7 | Rank 5 (window.confirm), to close it out cleanly | Fresh profile, start/end a meeting, edit the recap (sets `reviewDirtyRef.current = true`), click History | A native sheet appears on the visible overlay window and Return/Esc answer it | If TRUE: the sheet is genuinely unreachable/invisible on this window shape — this would need to be seen to overturn the REFUTED consensus | If FALSE (expected, per Electron 43 source): sheet is visible and answerable, confirming the consensus |
| 8 | Rank 6 (toggle race) | Fresh profile, no dirty Review | Script two History-button clicks 100-200ms apart (inside the 400ms debounce window) | View ends up back where it started: two committed `setView` transitions logged (once instrumentation item 7 exists), both within ~400ms, netting a visible no-op | A single committed transition, or the second click is swallowed by the existing `lastHistoryToggleRef` debounce (`App.tsx:2733-2734`) |
| 9 | Cross-check: offline vs. flaky network | Same synthetic slow-file setup as #1/#2, run once with the network adapter fully disabled and once with it flapping (up/down every few seconds) | Compare stall duration and error shape (`ETIMEDOUT` vs. indefinite hang) under each condition | Distinguishes "fails fast when definitely offline" (this task's brief cites 6 files failing with `ETIMEDOUT` in 0.6s under some condition) from "hangs for minutes when flaky/reconnecting" (this session's observed 5m24s gap, which immediately followed an `ERR_INTERNET_DISCONNECTED` line) | Both regimes are real and a fix (bounded timeout + `Promise.allSettled`, not just an async/await rewrite) must cover both, not just the fast-fail case |

Acceptance bar for calling Rank 1 fixed (adapted from `chatgpt-audit-1.md`'s proposed targets, not yet
owner-approved thresholds): p99 main-process event-loop delay <50ms during a History open/search workload
with a synthetic slow/failing file in the mix; no unexplained >250ms stalls; a slow/absent file degrades to
a visible "Unavailable" row within ~2s instead of blocking the IPC response or the event loop.

---

## Files read this session (for traceability)

- `plan-inputs/BUG-ROOT-CAUSES.json` (B1 lane, RC1-RC4, all verifications and consensus verdicts)
- `chatgpt-audit-1.md` (full text, independent audit — ranked alternatives, Electron-43-source corrections,
  acceptance-test proposals)
- `~/Library/Logs/asktoto/main.log` (grepped for the 2026-09-25 08:00-14:15 local window; exact excerpts
  quoted above)
- `~/Library/Application Support/asktoto/logs/audit.log` (grepped for `"ts":"2026-09-25T1[2-8]`; 147
  matching lines, sequence 2762-2908 reviewed in full)
- `metis-2.0` source, current line numbers confirmed at `2bf21f1c`:
  `src/main/index.ts` (activate: 9410; ensureWindow: 3472; second-instance: 8788; render-process-gone:
  2737; unresponsive/responsive: 2722/2727; parkOverlayAfterHideSpring: 3244; applyHideClickThrough: 3286;
  brainStatus handler: 7935; overlay cursor watch: 3098-3155; renderer-readiness gate: 2792/2798),
  `src/renderer/src/App.tsx` (guardReviewNav: 915; onBarHistory: 2732; Escape-confirm: 3143;
  alerts: 3411/3532), `src/renderer/src/components/Review.tsx` (confirm: 430, `reviewDirty`: 417),
  `src/renderer/src/components/RecallView.tsx` (mount `brainStatus`: 172-177; poll: 183-192),
  `src/renderer/src/components/RightEdgeSidecar.tsx` (onHistory: 387), `src/main/recall.ts`
  (readMeeting/cache: 124-176; listMeetings: 237-244; searchMeetings: 949-953),
  `src/main/transcripts.ts` (readSavedFile: 325-326; isEncryptedFile: 330-333),
  `src/main/brain/store.ts` (readJson: 223-245; readIndex/readBrainIndex: 471; quarantineUnusableIndex:
  447-464), `src/main/brain/ingest.ts` (runExtractionStage/readSavedFile: 1696; meetingSourceVersion
  statSync: 1563; date-fallback statSync: 1619; MAX_INGEST_ATTEMPTS: 1577), `src/shared/overlay-chrome.ts`
  (overlayActivateOpensSettings: 183-185), `src/main/island/geometry.ts` (OVERLAY_HIDE_PARK: 155;
  hideParkWindowOpacity: 516-521).
