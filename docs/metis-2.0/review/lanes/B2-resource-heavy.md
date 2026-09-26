# Lane B2 — Resource-Heavy Root Cause Analysis (Métis / asktoto v1.9.6, origin/main @ 2bf21f1c)

**Reviewer lane:** B2-resource-heavy · **Bug:** "it's very heavy on the PC" (Mac + Windows)
**Method:** reproduce → root cause → regression test → surgical fix (SAE reliability/recovery + operational playbooks; Stark software-delivery loop). Evidence labels: **OBSERVED** (seen in code/logs), **DERIVED** (reasoned from observed facts), **ASSUMED**, **UNKNOWN**. Severity: P0 = user-visible hang/crash/data loss/security in normal use; P1 = serious defect / major resource waste; P2 = maintainability/structure with real cost; P3 = minor.

All file:line references below were read directly from `/Users/tony/AI-Brain-build/metis-2.0` (read-only). No files in the repo or any kit directory were modified.

---

## 1. Continuous resource consumer inventory

| Consumer | Spawn mechanism | Lifecycle owner | Reaped on graceful quit? | Reaped on crash/force-quit/SIGKILL? |
|---|---|---|---|---|
| `llama-server` (local LLM sidecar, Qwen GGUF ~3.3GB + mmproj ~1GB if vision) | `child_process.spawn`, `src/main/llm/local-runtime.ts:362` | `local-runtime.ts` module singleton | Yes — `will-quit` → `localRuntime.stop()` (`src/main/index.ts:9507`) | **No** — nothing but the `will-quit`/emergency-shortcut JS handlers ever calls `.kill()`; a SIGKILL to the main process skips all JS |
| `fm serve` (Apple Foundation Models sidecar, macOS 27+) | `child_process.spawn`, `src/main/llm/fm-runtime.ts:285` | `fm-runtime.ts` module singleton | Yes — `will-quit` → `fmRuntime.stop()` (`src/main/index.ts:9514`) | **No** — same gap as llama-server |
| `metis-mac-helper watch-frontmost` (mac foreground-window watcher) | `child_process.spawn` via `macWatcherSpawnSpec()`, `src/main/foreground-watcher.ts` | `screen-preprocess.ts` watcher handle | Yes — `will-quit` → `screenPreprocess.stop()` → `watcher.stop()` (`src/main/index.ts:9500`) | **No** — same gap |
| Windows PowerShell foreground watcher (`WATCHER_PS`, tight GetForegroundWindow loop) | `child_process.spawn`, `src/main/foreground-watcher.ts:69-100` | same as above | Yes, same path | **No** — same gap |
| `metis-mac-helper screen-metrics` | `child_process.spawn` via `mac-helper.ts:90` | one-shot, ~100ms, never polled (`src/main/island/metrics.ts:18-20`) | n/a (exits itself) | n/a (short-lived) |
| Parakeet ASR host (whisper/sherpa ONNX) | `electron.utilityProcess.fork`, `src/main/parakeet.ts:11` | `parakeet.ts` generation manager | Yes, has explicit termination/exit-timer handling | **ASSUMED lower risk** — Electron `utilityProcess` children are tracked by Chromium's own process launcher (job objects on Windows, process groups on POSIX), which is a materially different lifecycle guarantee than a bare `child_process.spawn`; not verified in this review (would need an on-machine kill -9 test) |
| Speaker-embedding host | `electron.utilityProcess.fork`, `src/main/speaker-embedding-client.ts:97` | same pattern as Parakeet | Yes | Same ASSUMED lower risk as above |
| ffmpeg decoder (audio import) | `child_process.spawn`, `src/main/ffmpeg-decoder.ts:37,110` | per-import-job, `SIGTERM`'d at job end (`ffmpeg-decoder.ts:57,192`) | Yes | **No** (same class as llama-server), but exposure window is only the duration of one import decode, not the whole app session — much lower impact |
| "managed node" (portable Node.js runtime) | `child_process.spawn` in `dust-cli-chat.ts:253,275`, resolved via `managed-node.ts:90` | **Not a persistent server** — spawned once per Dust CLI invocation/install action and exits when that command finishes | n/a | n/a — **ruled out as a continuous consumer**; it is a per-command runtime, not a background process |

**Root architectural gap (applies to every raw `child_process.spawn` sidecar above):** teardown is implemented entirely as Electron JS event handlers (`will-quit`, `before-quit`, and a duplicated `stopSidecarsForHardExit()` for the in-app emergency-quit shortcut). None of these run when the main process dies via `SIGKILL` — macOS "Force Quit" (Activity Monitor, ⌥⌘⎋), an OS-level watchdog kill, or a native crash (segfault/trap) all bypass the JS event loop entirely. This is **OBSERVED** directly in the runtime evidence: E2 shows two `llama-server` processes with `ppid=1` (i.e., re-parented to `launchd`/init after their parent died) still alive 14+ hours after the current Métis process started, and the module doc comments in `local-runtime.ts`/`fm-runtime.ts` themselves only ever describe `will-quit`-driven teardown — there is no PID registry, job-object binding, or parent-death watchdog anywhere in `src/main`.

---

## 2. Findings, ranked by estimated impact

### F1 (P0) — Sidecar processes are only reaped through a JS event that a hard kill skips entirely

**Evidence (OBSERVED, code):**
- `src/main/index.ts:9461-9518` — the *only* unconditional teardown path (`app.on('will-quit', ...)`): calls `screenPreprocess.stop()` (`:9500`), `localRuntime.stop()` (`:9507`), `fmRuntime.stop()` (`:9514`).
- `src/main/index.ts:4164-4193` — `stopSidecarsForHardExit()`, a hand-duplicated copy of the same three calls, wired only into the Cmd+Ctrl+Esc emergency-quit shortcut (`forceQuitMétis()`, `:4195-4212`), which itself only fires from a **registered global shortcut** — i.e. still inside the JS event loop, not from an external signal.
- `src/main/llm/local-runtime.ts:632-639` (`stop()`), `src/main/llm/fm-runtime.ts:369-378` (`stop()`) — the only functions that ever call `child.kill('SIGKILL')`.
- **No** call site anywhere in `src/main` registers a `process.on('SIGTERM'/'SIGINT')` handler that would fire on an OS kill signal sent to the *Electron* process (and even that would not help against `SIGKILL`, which cannot be caught by any process). No job-object (Windows) or process-group kill-propagation is configured on any `spawn()` call (none pass `detached`, and none is wrapped in a Windows Job Object via `child_process.spawn`'s `windowsHide`/`shell` options — `windowsHide: true` only hides the console window, it does not tie process lifetime to the parent).

**Evidence (OBSERVED, runtime, from the lead's collection):**
- E2: two orphaned `llama-server` processes (`ppid=1`), started ~14h20m and ~14h11m before the current Métis main process (up 14h05m) — i.e., left over from at least two earlier launches.
- E7: Crashpad pending minidumps on 2026-07-30, 08-04, 09-24 — confirms the app *does* crash in the wild (a crash is one of the two ways this teardown gap is triggered; a manual Force Quit via Activity Monitor/⌥⌘⎋ is the other, and Métis is an `LSUIElement` accessory app per `src/main/intelligence.ts:8435`, so a confused user reaching for Force Quit instead of the tray "Quit Métis" item is a very plausible path).
- E3 + E6: 8 `app.started` events in one day (2026-09-25) with zero clean-shutdown events between them, plus `render-process-gone reason=killed exitCode=15` and `app.unresponsive kind=overlay` — consistent with repeated hard kills, each one a fresh opportunity to orphan the running `llama-server`/`fm serve`/watcher processes.

**Mechanism:** Node's `child_process.spawn()` does not create any parent-death linkage by default on macOS or Linux; an orphaned child is simply re-parented to PID 1 and keeps running with whatever resources (RAM-resident GGUF model, open sockets) it had. Each surviving `llama-server` alone holds the ~3.3GB GGUF (E1) resident, plus up to ~1GB more if it had the mmproj (vision) loaded (see F2's `local-runtime.ts:29-34` comment: mmproj is loaded at spawn, never lazily). With E3's repeated-crash pattern, multiple such processes can and did accumulate simultaneously (E2 shows two at once) — this compounds directly into "it's very heavy," and because the leaked processes are `llama-server`/PowerShell/Swift binaries rather than anything visibly branded "Métis," a user checking Activity Monitor/Task Manager for "Metis" will not connect the RAM/CPU usage to the app they think they already quit.

**Confidence:** high (the code path is unambiguous — there is exactly one route to `.kill()` and it is entirely JS-event-gated; the runtime evidence of orphaned `ppid=1` processes directly confirms the predicted failure mode).

**Fix (surgical, no architecture rewrite):**
1. **PID registry + reap-on-next-launch** (closes the gap for both crash and hard-kill, cross-platform, and is the minimal fix that actually matches the evidence): when `local-runtime.ts`/`fm-runtime.ts`/`foreground-watcher.ts` spawn a child, write `{pid, binary, startedAt}` to a small JSON file under `userData` (e.g. `sidecars.json`), and remove the entry when `stop()` runs normally. At the very start of boot (before spawning any new sidecar), read that file: for every entry whose PID is still alive (`process.kill(pid, 0)` doesn't throw) AND whose owning Métis process is gone (there is only ever one Métis instance per `requestSingleInstanceLock()`, `index.ts:8785`, so if this is a fresh boot the previous owner is by definition gone), `SIGKILL` it and delete the entry. This is unit-testable as a pure read/reap function (mock `process.kill`, feed a fake registry) and converts "orphan lives until the user finds it in Activity Monitor" into "orphan dies on the very next launch."
2. **Where the platform allows a stronger guarantee, use it in addition:** on Windows, assign spawned sidecars to a Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` (available via a small native call or a package such as `windows-process-tree`'s job-object primitives) so the OS itself kills them when the Electron process handle closes for any reason, including `SIGKILL`-equivalent termination. macOS/Linux have no exact equivalent (no `PR_SET_PDEATHSIG` on Darwin), so (1) remains the primary mitigation there.

**Regression test:** a script/e2e test (not a vitest unit test — this is process-supervision behavior): spawn a stub "sidecar" through the real `local-runtime.ts` spawn path, `kill -9` the Electron main process, relaunch, and assert the stub PID is no longer alive. The PID-registry read/reap logic itself (step 1) should also get a plain vitest unit test with a faked `process.kill`.

---

### F2 (P1) — Every boot un-exhausts and retries every permanently-failed meeting extraction, forcing a cold local-LLM boot + ~20-job ingest burst on every single launch

**Evidence (OBSERVED, code):**
- `src/main/index.ts:9348` — 15 seconds after boot (`setTimeout(..., 15_000)`), the app unconditionally calls `resumeBackfillIfPending()` (`:9362`), `reconcileMeetingsInBackground()` (`:9367`), and `runConsolidationIfDue()` (`:9397`).
- `src/main/brain/ingest.ts:2373-2393` (`resumeBackfillIfPending`) calls `startBackfill()` with **no options** whenever `idx.backfillRequested` is true.
- `src/main/brain/ingest.ts:2531` (`startBackfill`) — the `respectRetryBackoff` option, when **not** passed (which is exactly the boot-resume call), skips *both* backoff gates:
  - `ingest.ts:2580-2589` — the per-file retry-after backoff window is only honored `options.respectRetryBackoff &&` ... (skipped when false/undefined).
  - `ingest.ts:2595-2598` — a record that already hit `MAX_INGEST_ATTEMPTS` (`= 6`, `ingest.ts:1577`) is normally left `exhausted` so the automatic hourly reconcile tick never retries it again; but `if (options.respectRetryBackoff) continue` means the **non**-backoff-respecting caller (boot resume) instead does `toUnexhaust.push(f)` — it clears the exhausted flag and re-queues the file.
  - The code's own comment at `ingest.ts:2569-2572` states this explicitly: *"only ever populated when respectRetryBackoff is FALSE (i.e. every caller other than the automatic reconcile tick: the Index/Retry button, the dashboard-open check, **boot resume**, a rebuild)"*.

**Evidence (OBSERVED, runtime):**
- E4: after each start, a burst of ~20 `brain.ingest(source=meetings)` events within 200ms, immediately followed by `local.runtime.start` and `llm.call provider=local` with `ttaMs` 41282 and 29637 (i.e., 30-41 **seconds** of local-LLM cold-boot/inference time), with **some `brain.ingest ok:false`** — i.e., some of those 20 jobs fail every time.
- E3: 8 `app.started` events in one day with no clean shutdown between them.

**Mechanism (DERIVED, high confidence — the un-exhaust behavior is directly in the code, the "every boot" repetition follows from combining it with E3's observed crash-loop):** A meeting transcript that fails extraction 6 times (bad encoding, oversized, model returning malformed JSON, etc.) is marked `exhausted` so the hourly automatic tick leaves it alone — but the **very next app launch** un-exhausts it and retries anyway, unconditionally, with no session-count or time-based backoff at all for this specific call site. Combined with E3's repeated force-quit/relaunch pattern, this produces a self-reinforcing cycle: (a) launch → 15s later, cold-boot the ~3.3GB local LLM and burn 30-41s + CPU/RAM re-processing ~20 meetings including permanently-failing ones → (b) the app is maximally loaded right when the user is trying to use it, which is a plausible trigger for another force-quit → (c) the force-quit orphans the just-spawned `llama-server` (F1) instead of stopping it → (d) relaunch repeats (a). This is a believable, code-verified mechanism connecting both of Tony's reports ("very heavy" and "sometimes doesn't reopen") to the same underlying pattern, though the review did not instrument a live session to directly time-correlate a specific force-quit to a specific ingest burst (that correlation is DERIVED, not directly OBSERVED in a single trace).

**Fix:** pass `respectRetryBackoff: true` (or a new, more precisely-named option) from `resumeBackfillIfPending()`'s boot-time call specifically for `exhausted` records — resuming *genuinely interrupted, not-yet-attempted* work on boot is correct and necessary (that is what `backfillRequested` means), but silently reviving records the system already gave up on after 6 real attempts is not "resuming interrupted work," it is ignoring the exhaustion budget every single time the app starts. A minimal change: keep `respectRetryBackoff`'s per-file time-window semantics separate from the `exhausted` un-exhaust behavior, and gate the un-exhaust specifically on an explicit user action (the "Index meetings"/Retry button) rather than on ordinary boot.

**Regression test:** a vitest test on `startBackfill()` (the test infrastructure already exists — see `ingest-resilience.test.ts`, `ingest-degradation.test.ts`): mark a fixture record `exhausted: true` with `attempts >= MAX_INGEST_ATTEMPTS`, call `resumeBackfillIfPending()` (or `startBackfill()` with the boot-resume options once fixed), and assert the record is **not** re-queued and remains `exhausted`.

---

### F3 (P2, verified fixed at HEAD) — Background screen-capture retry loop (E5) no longer fires when Screen Recording permission is off

The task asked to verify whether E5's loop ("`capture.failed` x5394, reason 'Screen Recording permission is off', phase `bg-screen`, roughly every 6s," dated Aug 2026) still exists at HEAD.

**Evidence (OBSERVED, code):**
- `src/main/screen-preprocess.ts:147` — `REFRESH_INTERVAL_MS = 6000` (matches E5's "roughly every 6s" exactly — this is the same timer).
- `src/main/screen-preprocess.ts:196` — `captureAllowed = () => !deps.screenCaptureGranted || deps.screenCaptureGranted()`.
- `src/main/screen-preprocess.ts:198-202` — `eligible()` requires `captureAllowed()` to be true.
- `src/main/screen-preprocess.ts:259-260` (`describeForWindow`) — `if (!eligible()) return` is the **first line**, before `getScreenshot('bg-screen')` (`:272`) is ever called.
- `src/main/index.ts:3893-3896` — `screenCaptureGranted` is wired on darwin to `() => systemPreferences.getMediaAccessStatus('screen') === 'granted'`, a live OS query, not a cached/stale flag.

**Conclusion:** at HEAD, when Screen Recording permission is off, `eligible()` is false and the 6-second timer's tick (`onRefreshTick` → `describeForWindow`) returns immediately without ever calling `getScreenshot`, so no `capture.failed` audit event is produced by this path any more. The code comments (`MQA-178`, `MQA-209`) confirm this was a deliberate, tracked fix. **This specific finding from the runtime evidence is stale relative to HEAD — no fix is needed here.** (The 6-second interval itself keeps ticking regardless of eligibility, but each tick that is ineligible costs one function call and nothing else — not a measurable resource cost.)

---

### F4 (P2) — `scheduleConsolidation()`'s hourly timer is dead code; boot-time consolidation check uses a different, undocumented cadence

**Evidence (OBSERVED, code):**
- `src/main/brain/consolidate.ts:120-138` — `scheduleConsolidation()` is exported, fully implemented, and its doc comment describes it as *"the hourly check that drives twice-daily (by default) consolidation."*
- `src/main/index.ts` — `scheduleConsolidation` is **never imported or called** anywhere (confirmed by grep across `src/main`); only `runConsolidationIfDue` is imported (`index.ts:533`) and called exactly once, in the 15-second post-boot block (`index.ts:9397`), with a comment there stating *"Hourly consolidation is demoted: the named slots [06:00/12:00/18:00] own the extract pass."*

**Impact:** low direct resource cost (this is unreachable code, not a running timer), but it is a correctness/maintainability hazard: the module-level documentation in `consolidate.ts` actively misdescribes the real schedule, which risks a future change re-wiring the stale hourly path (doubling the extraction cadence) or a reviewer trusting the comment over the actual call graph. **Fix:** delete `scheduleConsolidation()` (or update its doc comment to say it is retired/unused) and point future readers at the real scheduler (`scheduleIntelligenceIndex`, `index.ts:9389`).

---

### F5 (P3, architecture/measurement note, not a confirmed bug) — Always-on overlay window's GPU cost is unmeasured against the kit's own budgets

**Evidence (OBSERVED, code):**
- `src/main/index.ts:2580-2618` — the single persistent overlay `BrowserWindow` (`win`) is created with `transparent: chrome.transparent`, `backgroundThrottling: false`, and `applyOverlayAlwaysOnTop(win)` — i.e., it is deliberately never throttled and always on top, for the entire app session.
- `src/renderer/src/styles.css:255-261,267-273,1639-1652,1692-1693` — the bar/panel chrome uses `backdrop-filter: blur(...)` (a compositor-level, per-frame-recomputed effect when anything under or over it changes), and several `infinite` CSS animations exist (`work-progress-pulse`, `shimmer`, `pulse-dot`, `onboard-hero-kenburns` 28s, `cl-rainbow-spin` 2.6s, `aw-hidden-breathe` 4.2s) — none of these were traced to confirm which are mounted in the idle/parked (8×2) state versus only during an active meeting/onboarding.
- No native macOS vibrancy (`NSVisualEffectView`/Electron `vibrancy:` option) is used anywhere in `src/main` (confirmed by grep) — the "glass" look is implemented entirely via CSS `backdrop-filter` in the web layer, which is generally more GPU-expensive per frame than a native compositor-level vibrancy material.

**Why this is P3, not higher:** the review found only **one** persistent BrowserWindow (the overlay); the two other window types (`decoderWin` for audio import, `pdfWin` for PDF export) are correctly `destroy()`'d immediately after use (`index.ts:8455`), and the `Intelligence` dashboard window (`intelligence.ts:128,153-155,56`) is user-opened/closed and explicitly torn down on session end. So the "number of BrowserWindows kept alive while hidden" the task asked about is **1**, not a sprawl — this is a reasonably clean window architecture. The open question is purely whether that one window's continuous `backdrop-filter` + `backgroundThrottling:false` combination is within MASTER.md's "Hidden idle CPU ≤1% of one logical CPU averaged over 5 minutes" and "Animation responsiveness: no recurring long-task/jank regression" budgets (MASTER.md lines 567, 570) — this review did not profile a running instance (out of scope/no GUI available in this sandbox), so it cannot confirm a violation, only flag it as the natural next measurement per §7's own instruction to *"profile real orb/beam/voice effects, not only a static placeholder."*

**Recommendation:** add the idle-CPU and animation-jank measurements from MASTER.md §7 to the release checklist, specifically with the overlay parked (8×2, hidden state) for 5 minutes on both a notch MacBook and a budget Windows laptop, using the reference-hardware/OS/power-state disclosure the kit requires before enforcing the budget.

---

### F6 (P3) — Audit-log write volume was a real cost before F3's fix, now negligible; note for future budget review

**Evidence (OBSERVED, code):** `src/main/logger.ts:57-88` — the audit log is a rotated `electron-log` file transport, `maxSize: 5MB` (`:63`), with a hand-rolled tamper-evident hash chain appended to every record (`:90-138`) and up to `AUDIT_ARCHIVE_GENERATIONS = 20` retained generations (`:55`) — i.e., up to ~100MB retained on disk by design, which is an intentional compliance trade-off (documented at `:50-54`), not a bug. Before F3's permission-gate fix, the ~6-second `capture.failed` loop (E5, x5394 in the observed log) would have been writing one audit record (with its SHA-256 chain computation) roughly every 6 seconds for as long as Screen Recording stayed unauthorized — a real, continuous disk-write + hashing cost. **Since F3 confirms that specific loop no longer fires when permission is off, this specific cost is already resolved at HEAD**; flagged here only so the lead knows the audit-log-volume angle of E5 traces to the same fix as F3, not a separate open issue.

---

## 3. Measurement plan (aligned to MASTER.md §7, lines 554-585)

The kit's own budgets (MASTER.md:567-570) are the right acceptance gates for re-testing after F1/F2 land:

| Budget | Boundary | How to measure post-fix |
|---|---|---|
| Hidden idle CPU ≤1% of one logical CPU / 5 min | Total Métis processes, wake detector included | `ps`/Activity Monitor sampling of every process matching the app's sidecar binaries (llama-server, fm, mac-helper, powershell watcher, ffmpeg) + the Electron tree, parked/idle, 5-minute average — must include any orphan left from a prior crash, which F1's fix should make impossible to accumulate |
| Cloud-first idle memory ≤350MiB (Win) / ≤180MiB (native Mac) | No optional local models loaded; helpers/GPU-process counted separately | Same process enumeration, `provider=cloud` in settings, confirm **zero** `llama-server`/`fm serve` processes exist at all in this mode (today, F1's gap means a *stale* one from a previous local-mode session could still be resident even while the current session is set to cloud-first) |
| First useful cloud-first setup ≤90s | Reference device, documented bandwidth | Unaffected by this lane's findings |
| Animation responsiveness | No recurring long-task/jank at reference settings | Chrome DevTools performance trace on the parked overlay for 60s, checking whether the `backdrop-filter` layer recomposites every animation frame or is a one-time paint (F5) |

Record reference hardware/OS/display/power-state/network for every run per MASTER.md:556, and do not exclude a run just because a leftover orphaned sidecar from a previous crash made the number look bad — that IS the number this bug report is about.

---

## 4. Open questions for the Opus planner / lead

1. **F1 fix scope decision:** is a userData-scoped PID registry (cross-platform, matches the evidence exactly) acceptable, or does policy want the heavier Windows Job Object investment now too? This review recommends starting with the PID registry — it is the minimal change that converts every orphan class in the inventory (F1's table) from "lives forever" to "dies on next launch," which directly answers Tony's "heavy on the PC" report without a larger native-code investment.
2. **F2 fix scope decision:** should `exhausted` extractions ever auto-retry on a long timescale (e.g., once every 7 days) in case a later model/provider update fixes what was failing, or should un-exhausting be manual-only (Retry button)? This is a product call, not something this review can resolve from code alone.
3. This lane did not instrument a live GUI session (sandboxed, read-only checkout, no permission to run the packaged app) — F5's GPU/idle-CPU numbers are **UNKNOWN**, flagged as a measurement gap rather than a confirmed defect. Recommend a follow-up lane/pass with an actual on-device profiling run before closing out the "heavy" bug end-to-end.
4. Whether Electron `utilityProcess` (Parakeet, speaker-embedding) actually survives a `SIGKILL` to the main process better than raw `child_process.spawn()` sidecars is **ASSUMED**, not verified in this review (would need the same kill -9 test recommended for F1, run against those two specifically). If it turns out `utilityProcess` children ALSO orphan on a hard kill, F1's PID-registry fix should be extended to cover them too — the mechanism is identical either way.

---

## 5. Explicitly ruled out / not this lane's finding

- **"managed node" (portable Node.js runtime)** — confirmed NOT a continuous background consumer; it is spawned once per Dust CLI action (`dust-cli-chat.ts:253,275`, `cli-installer.ts:481,551,702`) and exits with that command.
- **BrowserWindow sprawl** — only one window (`win`, the overlay) is kept alive continuously; the other two window-creation sites (`decoderWin`, `pdfWin`) are correctly destroyed after use, and the Intelligence dashboard window is user-opened/closed.
- **Background screen-capture retry loop (E5)** — verified fixed at HEAD (F3); the 6-second timer's gate (`captureAllowed()`) already stops it from ever calling `getScreenshot` when permission is off.
- **`island/metrics.ts`'s mac-helper `screen-metrics` call** — one-shot, cached, never polled; not a continuous consumer.
