# Runtime evidence (lead-collected, 2026-09-26)

Collected on Tony's Mac by the lead session. Raw observations; no secrets, account ids or meeting content.

## Installed app
- `/Applications/Metis.app` CFBundleShortVersionString `1.9.6`, CFBundleIdentifier `com.mantu.asktoto`.
- userData `~/Library/Application Support/asktoto`: `local-llm/` 3.3G, `asr-models/` 640M, `SingletonLock -> Totos-Mac.local-9125`.

## Processes (`/bin/ps -axo pid,ppid,%cpu,%mem,rss,etime,command`, ~08:20Z)
```
5489 ppid=1    cpu=0.1 rssMB=8   up=14:20:46 .../Resources/llama/mac/arm64/llama-server -m .../local-llm/models/qwen...
8347 ppid=1    cpu=0.1 rssMB=8   up=14:11:26 .../Resources/llama/mac/arm64/llama-server -m .../local-llm/models/qwen...
1477 ppid=1    chrome_crashpad_handler (up 14:28:14)   8081 ppid=1 chrome_crashpad_handler (up 14:11:55)
9125 ppid=1    cpu=3.5 rssMB=125 up=14:05:00 /Applications/Metis.app/Contents/MacOS/Metis
9157 ppid=9125 cpu=1.2 rssMB=100 Metis Helper (Renderer)
```
Verifier (B3-RC5) additionally measured `footprint` phys_footprint ≈3124 MB per orphaned llama-server; each orphan's pgid equals the pid of a dead Métis main process (sessions started 17:47Z and 18:03Z on 2026-09-25).

## audit.log (`userData/logs/audit.log`, 11.9k lines, 2026-08-10 → 2026-09-26)
Event counts: capture.failed 5394, brain.ingest 4453, llm.call 1074, local.runtime.stop 108, local.runtime.start 62, app.started 48, app.crash 19, boot-early-death 10, unhandledRejection 5, render-process-gone 1, app.unresponsive 1.

2026-09-25 app.started (UTC): 12:30:36, 16:38:15, 17:00:10, 17:32:31, 17:42:13, 17:47:07, 18:03:25, 18:10:20 — no clean-shutdown event type exists in logger.ts, so absence is not evidence by itself.

```
2026-09-25T12:13:52.075Z app.crash kind=render-process-gone reason=killed exitCode=15
2026-09-25T12:13:56.980Z app.unresponsive kind=overlay
2026-09-25T17:54:52.196Z llm.call provider=local ttaMs=41282
2026-09-25T18:04:09.838Z llm.call provider=local ttaMs=29637
```
unhandledRejection "Failed to get sources." at 2026-08-10, 08-24, 09-04, 09-07, 09-16 (process did not die — see B3-RC1).

## Crash artefacts
- `userData/crash-*.log` ×5: boot-early-death records referencing v1.8.9 pids (Sep 20–24).
- `userData/Crashpad/pending/`: d007c83d (2026-07-30, v1.3.0 VideoCaptureService dyld/code-signature policy), f7f9b411 (2026-08-04, v1.3.0 browser), a858ba85 (2026-09-24, v1.8.9 browser).

## Meetings folder (OneDrive)
- Resolved folder `~/Library/CloudStorage/OneDrive-MantuGroup/Métis Meetings`: 59 `.md` meetings (+ `.brain/`), 6 flagged `compressed,dataless`.
- Reading any dataless file fails with `TimeoutError errno=60` after ~0.6 s, sandboxed and unsandboxed → OneDrive File Provider is not hydrating. recall.ts maps a thrown read to an "Unavailable" stub row.

## Brain index quarantine (`.brain/index.corrupt-*.json`, 180 files)
Per day: Aug-22 1, Sep-05 2, Sep-06 7, Sep-07 1, Sep-09 2, Sep-20 46, Sep-21 4, Sep-22 4, **Sep-23 62**, **Sep-26 2** (08:37:08Z and 09:05:05Z — during this session's review workflow).
Mechanism (L03-01 verifier): non-app node/vitest processes resolve the real OneDrive meetings folder via the detectOneDrive fallback, fail to decrypt index.json with a different key, and quarantine it; the app then rebuilds and re-ingests. **Rule until fixed: no agent runs repo tests or code on this Mac without a hermetic HOME/userData.**

## Codex CLI
`codex exec` → "You've hit your usage limit … try again at Sep 29th, 2026 7:33 PM."

## Freeze root cause — first-hand spindump verification (lead, 2026-09-26)
`/Library/Logs/DiagnosticReports/Metis_2026-09-25-135445_Totos-Mac.spin`: Command Metis, Version 1.9.6, PID 1468, Reason "Slow response to HID event", Duration 85.55 s (HID event started 79.0 s before sampling), 68 samples.
Thread 0x2fd8 `CrBrowserMain` (main thread): `-[NSMenuTrackingSession startRunningMenuEventLoop:]` (tray menu open, 68/68) → `uv__run_timers` → `node::Environment::RunTimers` (67/68) → JS → `uv_fs_read` (synchronous) → kernel `apfs_materialize_dataless_file_ext` → `lck_mtx_sleep` (≈50/68 samples, in repeated bursts 1-5, 6-15, …).
Meaning: a main-process JS timer performs synchronous reads of OneDrive cloud-only (dataless) files; while OneDrive materializes them the Electron main thread is blocked — tray, hotkeys, IPC (History), `activate`/reopen all stop. A second spindump `Metis_2026-09-24-173549_Totos-Mac.spin` (same reason) contains `apfs_materialize_dataless` 3 times.
Corroboration: main.log 2026-09-25 13:47:07.905 → 13:52:31.490 local, a 5 m 23.6 s gap with no main-process log lines, immediately after `net::ERR_INTERNET_DISCONNECTED`.
Compounding: in the Hide layout (Tony's layout per main.log "park hide"), `app.on('activate')` only calls `win.showInactive()` on an already-"visible" opacity-0 8×2 hairline → reopen is a visible no-op even when the main thread is free.
