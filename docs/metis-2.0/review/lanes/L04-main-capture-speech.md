# Lane L04 — Main-Process Capture & Speech (Métis / asktoto v1.9.6, origin/main @ 2bf21f1c)

**Reviewer lane:** L04-main-capture-speech
**Scope:** `src/main/screen-capture.ts`, `screen-capture-check.ts`, `screen-preprocess.ts`, `asktoto-shot.ts`, `apple-speech.ts`, `asr-*.ts`, `cloud-stt/`, `listening-state-ipc.ts`, `foreground-watcher.ts`, `platform-perms.ts`, `island/`, `calendar.ts`, `act1-dom-probe.ts`, `import-audio.ts`, `whisper-import.ts`.
**Method:** brownfield discovery (read-only, vertical-slice tracing, git-history corroboration) + five-axis review (correctness, readability, architecture, security, performance/reliability/testability). Evidence labels: **OBSERVED** (seen directly in code/git history), **DERIVED** (reasoned from observed facts), **ASSUMED**, **UNKNOWN**.
**Cross-lane note:** this repo already has sibling audits `B1-history-freeze.md` and `B2-resource-heavy.md` in this same directory. Where my lane's files overlap theirs (mainly `foreground-watcher.ts` and `screen-preprocess.ts`'s E5 loop) I cross-reference rather than duplicate their findings, and focus on what they did not already cover.

No file in `/Users/<redacted-user>/AI-Brain-build/metis-2.0` or any kit directory was modified. All file:line references were read directly from the checkout.

---

## 0. Coverage ledger

| File | Depth | Notes |
|---|---|---|
| `screen-capture.ts` | full read | |
| `screen-capture-check.ts` | full read | |
| `screen-preprocess.ts` | full read (445 lines) | plus git history of the file |
| `foreground-watcher.ts` | full read | plus `mac-helper.ts` spawn spec + `native/mac-helper/main.swift` grep |
| `platform-perms.ts` | full read | |
| `apple-speech.ts` | full read | |
| `asktoto-shot.ts` | full read | |
| `listening-state-ipc.ts` | full read | |
| `calendar.ts` | full read | |
| `act1-dom-probe.ts` | full read | |
| `import-audio.ts` | full read | |
| `whisper-import.ts` | full read (500 lines) | |
| `asr-bundled-ensure.ts` | full read | |
| `asr-model-download.ts` | full read | |
| `asr-manifest.ts`, `asr-model-manifest.ts`, `asr-model-path.ts`, `asr-model-protocol.ts` | full read (all small) | |
| `cloud-stt/adapter.ts` | full read | plus `adapter.test.ts` grep for coverage gaps |
| `cloud-stt/credentials.ts` | full read | |
| `cloud-stt/live-session.ts` | full read | |
| `cloud-stt/session-replacement.ts`, `cloud-stt/pcm.ts` | full read (small) | |
| `island/cursor-watch.ts` | full read | plus call site in `index.ts` |
| `island/metrics.ts` | full read | |
| `island/exclusive-bounds-repair.ts` | full read | |
| `island/geometry.ts` | **not read** (30KB pure geometry/rect math) — sampled only via its exports used by files above. Lowest relevance to this lane's "capture/speech" focus; flagging as **not-inspected** rather than claiming coverage. |
| `index.ts` (out of lane) | **selectively grepped/read**, ~120 lines total across ~8 targeted excerpts | Only to verify how in-lane exports are wired (E5/E6 verification, `will-quit` teardown, IPC handler wrapping). Not reviewed as a file in its own right — that is a different lane's job. |
| `import-jobs.ts` (out of lane) | **selectively grepped/read**, ~40 lines | Only to verify the concurrency invariant `whisper-import.ts`'s module state depends on. |

---

## 1. Runtime-evidence verification (the task's explicit ask)

### 1.1 E5 — background `capture.failed` loop while Screen Recording permission is off

**Already verified independently by `B2-resource-heavy.md`'s F3, reaching the identical conclusion I reached before reading that file: FIXED at HEAD, macOS only.** I re-derive it here because the task asked this lane specifically, and to add the one gap that report did not check.

- `screen-preprocess.ts:147` — `REFRESH_INTERVAL_MS = 6000`, the exact 6-second cadence E5 describes.
- `screen-preprocess.ts:196` — `captureAllowed = () => !deps.screenCaptureGranted || deps.screenCaptureGranted()`.
- `screen-preprocess.ts:198-202` — `eligible()` requires `captureAllowed()`.
- `screen-preprocess.ts:259-260` — `describeForWindow`'s first line is `if (!eligible()) return`, before `getScreenshot('bg-screen')` is ever called (`:272`).
- `index.ts:3893-3896` (out-of-lane wiring, read for context) — `screenCaptureGranted` is supplied **only for `darwin`**: `process.platform === 'darwin' ? () => systemPreferences.getMediaAccessStatus('screen') === 'granted' : undefined`.
- Git history (OBSERVED): commit `cb5b4ef0` (2026-08-19, "fix(screen): close 6 defects…") ledger entry **MQA-179** — *"macOS: the reader captured every 6 s while Settings said it could not run… Readiness is now derived from the engine's own `canRun()`"* — and commit `9ac9b990` (same date) introduces the `MQA-209` rule cited in `screen-preprocess.ts:96-101`'s comment: the loop must never be what raises the TCC prompt, so it now requires the grant to **already** exist.

**Conclusion (macOS): CONFIRMED FIXED at HEAD.** When Screen Recording is off, `eligible()` is false, the timer still ticks every 6s but `describeForWindow` returns on its first line — no `getScreenshot` call, no `capture.failed` audit record, no repeat of E5's x5394 pattern.

**NEW gap this lane found (not in B2): the fix is macOS-only; Windows has no equivalent gate.**

- `platform-perms.ts:1-7` (module header, OBSERVED) documents that **Windows also has a persistent, revocable, per-app screen-capture privacy toggle**: *"screen recording is per-capture via desktopCapturer (user must approve each app in Settings → Privacy)."*
- `index.ts:3893-3896` wires `screenCaptureGranted` as `undefined` for every non-darwin platform — there is no Windows branch at all, not even one that reads `platform-perms.ts`'s own `windowsScreenStatus()` / cached `screenProbeResult`.
- `screen-preprocess.ts:196` — `captureAllowed = () => !deps.screenCaptureGranted || deps.screenCaptureGranted()`. When `deps.screenCaptureGranted` is `undefined` (every non-darwin platform), `!undefined` is `true`, so `captureAllowed()` unconditionally returns `true` on Windows regardless of whether the OS has actually denied Métis screen-capture access.
- Consequence: if a Windows user has denied Métis's screen-recording privacy toggle (the exact per-app permission `platform-perms.ts` itself documents), and `backgroundScreenContext` is on, and the local model or OCR path is ready, and the foreground watcher is healthy, `eligible()` stays `true` forever on Windows. `onRefreshTick` → `describeForWindow` → `getScreenshot('bg-screen')` will call `desktopCapturer.getSources()` every `REFRESH_INTERVAL_MS` (6s), it will keep failing, and `index.ts`'s `getScreenshot()` catch block (`auditLog('capture.failed', {reason, phase: 'bg-screen'})`, unconditional on all platforms) will keep writing an audit record every 6 seconds — **the exact E5 pattern, reproduced on Windows**, because the platform-specific fix that closed it for macOS was never mirrored for Windows.

**Severity: P1** (this is precisely the defect the runtime evidence flagged as historically catastrophic — x5394 log lines — just gated to a different platform than the one Tony's Mac evidence was collected on).
**Evidence label: DERIVED** (the code-level gap is OBSERVED; I have no Windows runtime log confirming it fires in practice — that would need a Windows box with Métis screen-capture denied).
**Fix direction:** give Windows the same live-status callback macOS has. `platform-perms.ts` already exposes `windowsScreenStatus()` (reads the cached `screenProbeResult`, itself kept honest by `noteScreenCaptureOutcome` on every real capture — MQA-110). Wire `screenCaptureGranted: process.platform === 'win32' ? () => windowsScreenStatus() === 'granted' : (darwin case)` into the `createScreenPreprocess(...)` call in `index.ts`. Caveat to flag to whoever picks this up: unlike macOS's live TCC read, Windows' status is probe-derived and defaults to `'unknown'` until a capture has actually been attempted (`platform-perms.ts:86-91`) — decide explicitly whether `'unknown'` should gate the loop closed (safer, matches "never guess granted") or open (matches today's *de facto* behavior); the safer reading (`'unknown'` treated as not-yet-provably-granted, i.e. gate closed) is consistent with `platform-perms.ts:90`'s own comment ("never assume 'granted'").

### 1.2 E6 — `desktopCapturer.getSources()` rejection escaping as `unhandledRejection` ("Failed to get sources.")

**Not covered by B1 or B2** (grepped both; B2 mentions "E6" only as a crash-count citation, not this mechanism). This is this lane's own finding.

**Conclusion: CONFIRMED FIXED at HEAD for every code path this lane could trace, via defense in depth landed 2026-07-06 (commit `55e202fc`, "Fix the visible/invisible toggle + a second Listen-start crash").**

There are exactly three call sites of `desktopCapturer.getSources()` in `src/main` (OBSERVED, exhaustive grep):

1. **`index.ts:9113`** (system-audio loopback grant, inside `session.defaultSession.setDisplayMediaRequestHandler`'s callback) — the one E6's message literally documents in its own inline comment (`index.ts:9091-9095`: *"getSources can BOTH return empty transiently … AND reject outright with 'Failed to get sources.' … This callback is async, so a reject escapes as a fatal unhandledRejection and crashes the app on Listen start."*). This is now guarded **three layers deep**:
   - `getScreenSourcesWithRetry` itself (`screen-capture.ts:33-49`, in this lane) never rethrows — every attempt is wrapped in its own `try/catch`, and it resolves to `[]` after exhausting `attempts`.
   - The `callback()` call that reports the result back to Electron is wrapped in a `respond()` helper (`index.ts:9020-9027`) that itself try/catches, because Electron can synchronously throw *inside* that callback for a malformed response shape.
   - The whole async handler body is wrapped in an outer `try { await handleDisplayMedia(...) } catch (err) { … respond({}) }` (`index.ts:9028-9034`, comment: *"Absolute backstop: nothing in the loopback grant path may escape as an unhandledRejection."*).
2. **`index.ts:3614`** (real screen-ask/vision capture, inside `captureScreenshotOnce`) — also routed through `getScreenSourcesWithRetry` (same guarantee as above), and every caller of the function that wraps it (`getScreenshot()`) is itself invoked either from `ipcMain.handle(...)` handlers (`index.ts:4769`, `6794`) or from a `.catch()`-guarded fire-and-forget (`prewarmCapture`, `index.ts:3744-3746`). `ipcMain.handle` is Electron-internal-safe: a rejected promise returned from its handler is caught by Electron itself and serialized back to the renderer as an `invoke()` rejection — it does not escape to the process-level `unhandledRejection` handler. (DERIVED from Electron's documented `ipcMain.handle` contract; not independently re-verified against Electron's own source in this review.)
3. **`platform-perms.ts:56-66`** (`probeScreenCapture`) — already wrapped in its own `try/catch`, resolves `false`/`'denied'` on any error, never throws.

**Open question flagged, not resolved (evidence label: UNKNOWN):** the runtime evidence (E6) lists crash records dated **Aug 10 → Sep 16, 2026**, i.e. *after* the July 6 fix. Two explanations are consistent with the code as read, and I could not distinguish between them without the raw `audit.log`'s per-record app-version field (which was not handed to this lane and which the hard rules say not to go digging through meeting-adjacent user data for beyond what the lead already extracted):
   - (a) `audit.log`/crash-log accumulation is **not reset on app update** — those Aug/Sep entries could be artifacts of whatever *older* build was actually running at each timestamp, not evidence against the July 6 fix at HEAD; or
   - (b) there is a fourth, not-yet-found call path to the same Chromium error message that this review's exhaustive-grep did not surface (ASSUMED unlikely, since the grep for `desktopCapturer` and `getSources(` across `src/main` was exhaustive, but a dynamically constructed call or a path through a dependency's own internal capturer use cannot be fully ruled out by grep alone).
   **Recommendation to the lead/planner:** before closing E6 as fully resolved, check one Aug/Sep `app.crash` record's paired `app.started`/version metadata (if `audit.log` carries a build/version stamp) against `1.9.6`/HEAD's commit range. If those crashes trace to pre-`55e202fc` builds, E6 is fully closed; if any trace to a build at or after `55e202fc`, there is a real fourth path still to find.

**Severity of this section: P2 informational** (verification work, not a new defect at HEAD as far as this lane could trace) — but recorded as a finding so the planner does not have to redo the git archaeology.

### 1.3 Foreground-watcher orphan risk — cross-reference only, not duplicated

`foreground-watcher.ts` spawns a persistent child process (`powershell.exe` on Windows tight-looping `GetForegroundWindow`, or the bundled `metis-mac-helper watch-frontmost` Swift sidecar on macOS — `mac-helper.ts:82-85`). I confirmed (OBSERVED) that:
- Its only teardown path is `stop()` → `child.kill()`, called from `screenPreprocess.stop()`, called from `app.on('will-quit', …)` (`index.ts:9500-9502`) — a JS-level Electron lifecycle event that does not fire on `SIGKILL`, a native crash, or `app.exit()`.
- `native/mac-helper/main.swift` has **zero** occurrences of `ppid`/`getppid`/parent-death monitoring (`kqueue` `EVFILT_PROC`/`NOTE_EXIT`) — confirmed by grep across the whole file. The Swift sidecar has no self-termination-on-orphan logic of its own.

This is the identical mechanism `B2-resource-heavy.md`'s **F1 (P0)** already documents for `llama-server`/`fm serve`, and that report's table already lists both the macOS and Windows foreground-watcher processes as two more instances of the same gap, with the same proposed fix (PID registry + reap-on-next-launch, or a Windows Job Object). I am not re-opening this as a separate L04 finding — it is the same root cause, same fix, and B2 owns it. Noted here only so the planner does not have to cross-check that this lane's file was actually covered.

---

## 2. Findings (this lane's own, ranked by severity)

### F-L04-1 (P1, correctness) — Cloud STT Nova-3 normalizer discards real transcript text instead of the behavior its own comment documents

**File:** `src/main/cloud-stt/adapter.ts:404-413`

```ts
if (!words.length) {
  const transcript = typeof alt?.transcript === 'string' ? alt.transcript : ''
  if (!isFinal) {
    return { finals: [], interimText: transcript, finished: false }
  }
  if (!transcript.trim()) {
    return { finals: [], interimText: '', finished: false }
  }
  // Final without word timings — keep text, refuse invented precise attribution.
  throw new CloudSttError('INVALID_STT_TIME')
}
```

**Evidence (OBSERVED):** the comment on the line immediately above the `throw` says the intent is to *"keep text, refuse invented precise attribution"* — i.e., accept the final transcript text without inventing per-word start/end times. The implementation does the opposite: it throws, discarding the text entirely. The only caller, `live-session.ts`'s `onMessage` (`:371-442`), wraps every normalize call in `try { … } catch (e) { mainLog.warn('[cloud-stt] normalize skipped', …) }` — so this `CloudSttError` is swallowed as a warning log line, and `handlers.onFinal` is never called for that segment. The spoken content in that message is gone from the meeting transcript, permanently, with no user-visible signal beyond a `mainLog.warn` line no one is watching live.

**Failure scenario:** Deepgram/Nova-3 (via Cloudflare AI Gateway) sends a `Results` message with `is_final: true`, a non-empty `channel.alternatives[0].transcript`, but an empty or missing `words` array — a shape the Deepgram wire protocol can legitimately produce (e.g., certain punctuation-only finalization events, or configurations where word-level output is suppressed). Whenever that happens during a CLOUD_ONLY / enterprise-live Listen session, that piece of real spoken content is silently dropped from the saved meeting instead of being kept (as the author's own comment says it should be).

**Why this matters for this product specifically:** Métis is a meeting note-taker; losing a segment of the actual transcript is a correctness failure at the core of the feature, not a cosmetic bug. It is scoped to the CLOUD_ONLY / enterprise-live Nova-3 path (opt-in, not the default local Whisper/Parakeet Listen path most users are on), which is why this is P1 rather than P0.

**Test gap (confirmed, OBSERVED):** grepped `adapter.test.ts` for `normalizeNova3ResultsMessage` — there are 4 existing test cases (final-with-words, interim, control-message, multi-speaker split) and **none** exercise "final, non-empty transcript, no words," so this path has never been asserted either way.

**Fix direction:** honor the comment — for `isFinal && !words.length && transcript.trim()`, emit one `CloudSttFinalSegment` carrying the transcript text with `cluster: 'unknown'` (no diarization to invent) and a start/end computed from `opts.streamOffsetMs`/`scope` bookkeeping already available to the caller (e.g., `startMs = endMs = streamOffsetMs`, clearly documented as "no precise timing available"), rather than throwing. Add the missing test case first (TDD) so the fix is pinned.

### F-L04-2 (P2, reliability) — No reconnect/backoff when a single cloud-STT track (mic or remote) drops mid-session

**File:** `src/main/cloud-stt/live-session.ts:304-369` (`attachWs`), class fields `:91-104`

**Evidence (OBSERVED):** `CloudSttLiveSession` opens two independent WebSocket tracks (`'you'` / `'them'`) via `Promise.all` in `start()` (`:131`). Once both are open, each track's `error`/`close` handling (`:347-367`) is: if already `settled` (i.e., the initial connect succeeded) and not `this.closing`, the only action is `this.handlers.onError?.(...)` — the dead track is left in `this.tracks` with `open: false` and is never re-dialed. `pushFloat32` (`:150-161`) checks `track?.open` and just silently no-ops for that channel from then on.

**Failure scenario:** a transient network blip drops the "them" (remote/system-audio) WebSocket 10 minutes into a 45-minute meeting while the "you" (mic) track stays healthy. The renderer gets one `onError` callback; nothing in this module retries or re-establishes the "them" track. Unless the renderer's own error handling explicitly restarts the *entire* Listen session (out of this lane's file scope to confirm), the rest of that meeting's remote-party audio is transcribed as nothing, and the person only finds out when they read back a transcript with a large silent gap on one side.

**Contrast with the rest of this lane:** `foreground-watcher.ts` (same author, same lane) has an explicit, bounded self-restart policy for its own child process (`MAX_RESTARTS = 5`, `RESTART_BACKOFF_MS = 2000`, `foreground-watcher.ts:131-132,174-222`) — the pattern this module is missing exists right next to it in the same codebase.

**Fix direction:** give `attachWs`'s non-settled-but-mid-session error/close path a bounded reconnect (mirroring `foreground-watcher.ts`'s restart-budget shape): re-run `openTrack` for just that channel, up to a small attempt cap, before giving up and calling `handlers.onError`. Needs a regression test asserting (a) a single-track drop mid-session triggers a reconnect attempt, and (b) the other track is unaffected throughout.

### F-L04-3 (P2, architecture/testability) — `whisper-import.ts`'s language-follow state is module-level global, safe today only because of an un-enforced external invariant

**Files:** `src/main/whisper-import.ts:291-306` (module `let` state: `userLanguage`, `activeLang`, `switchRun`, `windowCount`, `probePinned`, `reprobeRun`); `src/main/import-jobs.ts:146` (`MAX_CONCURRENT_DECODES = 1`, out of lane, read only to verify this dependency), `:239-243` (constructor clamps `maxConcurrent` to `Math.min(1, …)`)

**Evidence (OBSERVED):** the language-follow machine (`resetLanguageFollow`, `followLanguage`, `nextDecodeOptions`, `probeLanguage`, `reprobeForSwitch`) is entirely module-level mutable state, not scoped to a job/session object. Its own doc comment (`whisper-import.ts:296-298`) says *"Call once per job, at decode start … module state survives across import jobs on the same running main process, and without this a new job would inherit the previous job's converged language."* This design is only correct because `import-jobs.ts` currently hard-clamps decode concurrency to exactly 1 (confirmed intentional — `MAX_CONCURRENT_DECODES = 1` is an explicit constant, not a computed default, and the constructor additionally clamps any injected `deps.concurrency` down to 1 regardless of what is passed). **This is not a live bug at HEAD** — I verified the clamp is unconditional — but it is a fragile, cross-file invariant with no compiler-enforced link between the two files: a future change to `import-jobs.ts` that relaxes `MAX_CONCURRENT_DECODES` above 1 (e.g., to parallelize import throughput) would silently corrupt every concurrent job's detected language, output tier note, and repetition-collapse state, with no type error and no assertion firing — only a confusing field bug report resembling "my French meeting import came back partly in English."

**Fix direction:** either (a) add a runtime assertion inside `whisper-import.ts` (e.g., a module-level in-flight-job counter that throws if a second `resetLanguageFollow` fires before the prior job's transcription stream completes) so the coupling is self-defending instead of silent, or (b) the more structurally sound fix: turn the follow-machine into a small class/closure instantiated per job (as `createScreenPreprocess` already does for a comparable amount of engine state in this same lane), removing the cross-file invariant entirely. (b) is the more "elegant" fix per this review's standing bar, but is a larger, cross-file change or `import-jobs.ts`'s calling contract, so I flag it as a refactor opportunity (§3) rather than a fix to force through this pass.

### F-L04-4 (P3, performance note) — Apple Speech spawns one helper process per audio window, no warm-process reuse

**File:** `src/main/apple-speech.ts:82-144`

**Evidence (OBSERVED):** `appleSpeechTranscribe` is the live-Listen transcription entry point for the (opt-in) Apple Speech engine. Every call `writeFileSync`s a fresh temp WAV (`:85-91`, synchronous, on the main thread) and `spawn()`s a brand-new `metis-mac-helper transcribe` process (`:100`), which is killed and its temp file unlinked once that one window's result comes back. This contrasts with the two other live engines in this codebase: Whisper's import path keeps one long-lived `utilityProcess` host alive across a whole job (`whisper-import.ts:151-248`), and Parakeet (referenced, not in this lane) uses a comparable persistent host. If Apple Speech is selected as the *live* Listen engine (this function's own comment says it exists for "live Listen's streaming windows"), a meeting generates one process spawn + one synchronous file write + one process teardown **per transcription window** for the whole meeting, rather than once per meeting.

**Why P3 not higher:** this is opt-in (not the default ASR engine), self-cleans within its own 15s timeout even if killed abnormally (unlike the persistent sidecars B2 flags), and macOS process-spawn cost (~10-30ms typically for a small native binary) is unlikely to be the dominant contributor to "heavy on the PC" relative to what B2 already identified (orphaned `llama-server`/`fm serve`). Flagging as a measured-but-unverified performance note (DERIVED, not profiled in this review) rather than a confirmed hotspot.

**Fix direction (if profiling confirms it matters):** extend the existing `metis-mac-helper` sidecar model (already used for `watch-frontmost`, a long-lived process) with a persistent `transcribe-stream` subcommand analogous to the Whisper `utilityProcess` host, so one process serves a whole Listen session instead of one per window.

### F-L04-5 (P3, minor) — Overlay cursor-watch poll runs continuously at ~41 Hz whenever onboarding is done, on macOS and Windows

**Files:** `src/main/island/cursor-watch.ts:46` (`CURSOR_WATCH_INTERVAL_MS = 24`); wiring at `index.ts:3095-3101` (`startOverlayCursorWatch`)

**Evidence (OBSERVED):** `setInterval(() => tickOverlayCursorWatch(), 24)` runs continuously — not just while the overlay bar is revealed, but any time `shouldWatchOverlayCursor()` (`cursor-watch.ts:165-173`) is true, which reduces to "onboarding is done and the current layout uses hover" — the normal steady state of the app for most of a session on macOS/Windows. Each tick calls `screen.getCursorScreenPoint()` plus pure rect math; it is well-gated (self-stops via `tickOverlayCursorWatch`'s own re-check of `overlayCursorWatchWanted()`, and the timer is `.unref()`'d so it never blocks process exit). This is a genuinely minor, well-engineered poll — flagged only because the review's brief explicitly asked for "polling intervals and their cost," and an always-on ~41 Hz native call for the entire session, while individually cheap, is one more entry in the same category of continuous background cost as the (already-fixed) 6s screen-preprocess tick and the foreground-watcher's own idle loop.

**Severity: P3.** No fix recommended without a profiled measurement showing it exceeds the "hidden idle CPU ≤1% of one logical core" budget the sibling report (`B2-resource-heavy.md` F5) already flags as unmeasured for this app; this is one more data point for that same measurement pass rather than a new action item.

---

## 3. Refactor opportunities

1. **Give Windows a live screen-capture-permission signal and wire it into `screen-preprocess.ts`'s `captureAllowed()`**, closing the platform gap in F-section 1.1. Files: `platform-perms.ts` (already has `windowsScreenStatus()`), `index.ts`'s `createScreenPreprocess(...)` call (`:3860-3897`). Risk: low — the darwin branch is the exact template to copy; the only judgment call is how to treat Windows' `'unknown'` state (recommend: gate closed, i.e. treat only `'granted'` as allowed).
2. **Scope `whisper-import.ts`'s language-follow machine to a per-job object instead of module-level `let`s** (F-L04-3). Files: `whisper-import.ts`, call sites in `index.ts`'s `initializeImportJobs`. Risk: medium — touches the public function signatures (`resetLanguageFollow`, `followLanguage`, `nextDecodeOptions`, `probeLanguage`, `reprobeForSwitch`, `finalizeDecodedText`) and their existing unit tests (`whisper-import.test.ts`), but is a mechanical "close over state instead of module scope" change with no behavior difference at `MAX_CONCURRENT_DECODES = 1`.
3. **Add a bounded reconnect to `cloud-stt/live-session.ts`'s per-track error/close handling** (F-L04-2), reusing the restart-budget shape already proven in `foreground-watcher.ts` in the same lane. Files: `cloud-stt/live-session.ts`. Risk: medium — WebSocket reconnect logic is easy to get subtly wrong (must not double-open a track, must respect `this.closing`/`this.closed`); needs its own focused test pass, not a quick patch.

---

## 4. Test gaps (confirmed by direct inspection, not assumed)

- `cloud-stt/adapter.test.ts` has no case for `normalizeNova3ResultsMessage` given `{ is_final: true, channel: { alternatives: [{ transcript: '<non-empty>', words: [] }] } }` — the exact shape that triggers F-L04-1. Add it as the first step of that fix.
- `cloud-stt/live-session.test.ts` — not read line-by-line in this pass, but the described behavior (F-L04-2: no reconnect on a mid-session single-track drop) implies there is no test asserting either "reconnect happens" (it doesn't) or "reconnect deliberately does not happen" (i.e., no test currently pins today's silent-drop behavior as intentional either) — worth confirming directly before treating F-L04-2 as unowned.
- No test in this lane's files exercises `screen-preprocess.ts`'s `eligible()`/`captureAllowed()` under a simulated Windows `screenCaptureGranted` dependency, because that dependency does not exist yet for Windows (F-section 1.1) — a test should be added alongside the fix, not before it.
- `foreground-watcher.test.ts` (not fully read in this pass) almost certainly covers the restart-budget logic already (the module is well-tested per its own comments), but per B2's F1, there is no test anywhere confirming the spawned child is reaped when the *parent* dies ungracefully — that gap is owned by B2, not re-litigated here.

---

## 5. Architecture notes (for the Opus planner)

This lane's code is, on the whole, unusually well-engineered for a codebase this size: extensive dependency injection for testability (`screen-preprocess.ts`, `act1-dom-probe.ts`, `foreground-watcher.ts` are all Electron-free at their core and fully unit-testable), hash-pinned + resumable model downloads with disk-headroom pre-flight checks (`asr-model-download.ts`, `asr-bundled-ensure.ts`), a real security posture on the `asr-model://` custom protocol (symlink-escape guard via realpath comparison, path-traversal rejection before resolution — `asr-model-path.ts`, `asr-model-protocol.ts`), and a consistently applied MQA-numbered fix ledger in comments that made git-archaeology verification of the runtime evidence (§1) tractable rather than speculative. The specific defects found (F-L04-1 through 5) are all narrow and locally fixable; none of them indicate a systemic architecture problem in this lane specific to capture/speech. The one recurring *pattern* worth calling out to the planner: this lane has at least three instances of "a background/continuous mechanism with a well-designed bounded-retry or gating policy sitting right next to another background mechanism that lacks the equivalent policy" — `foreground-watcher.ts`'s restart budget vs. `cloud-stt/live-session.ts`'s no-restart (F-L04-2), and macOS's live permission gate vs. Windows' absent one in `screen-preprocess.ts` (§1.1). That suggests the fix is as much "go find the other places this same shape needs the policy that already exists elsewhere in the file tree" as it is inventing anything new.
