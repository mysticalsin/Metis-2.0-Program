# M2-0535: Surface a first-Listen Whisper load error

Base `origin/m2/integration` @ `0499fffb`; nothing was run (D-28). [verified] = read there; [inferred] = reasoned from code.

## Problem
If the Whisper model fails to load on the first Listen, no error appears. The loading row (and "Waiting for speech…") stays up indefinitely with zero lines. [verified App.tsx:3532-3535, Copilot.tsx:247/284/309] It matches M2-0495's 120 s zero-line smoke. [inferred]

## Root cause
At `src/renderer/src/lib/listen.ts:1421`, the worker `'error'` branch returns early on `pendingWhisperEpochRef.current !== sessionEpochRef.current` for every error. [verified]
- `pendingWhisperEpochRef` starts at 0 (:970) and is written only at :1368, which `pump()` cannot reach before 'ready' (:1227).
- `start()` increments the epoch (:2225), clears the error (:2262) and sets loading (:2462).
- A load failure has no window behind it (whisper.worker.ts:260-270), so the epochs differ and the handler returns before `armNetworkRetry`/`setState` (:1424/:1431).
- The same drop hits prewarm reuse, cold start, Parakeet fallback (:2418-2431, :1545-1565) and network `retry()` (:1591-1603). [verified]
- Companion gap: cloud, Parakeet and Apple set `readyRef` true (:2379/:2415/:2446), and Stop keeps it set. A new Whisper worker can therefore start "ready". [verified]

## Source paths
- `src/renderer/src/lib/listen.ts` (fix)
- `src/renderer/src/lib/listen.stop-drain.test.ts` (tests)
- Read-only: `src/renderer/src/lib/whisper.worker.ts`, `src/shared/bundle-response.ts`
- Not involved [verified]: `src/main/whisper-asr-host.ts`, `src/main/whisper-import.ts`, `whisper-worklet*.ts`

## Fix
1. Change :1421 to `if (readyRef.current && pendingWhisperEpochRef.current !== sessionEpochRef.current) return`.
   - Per-window errors keep the guard.
   - Retired workers are still dropped at :1383.
   - Keep `readyRef.current` and `decodeNoteRef.current = ` in the branch, because they are anchors for `asr-decode-failure.mqa193.test.ts:140-146`.
2. In `ensureWorker`, set `readyRef.current = false` right after `new Worker(...)` (:1381). [inferred safe: that path creates a fresh worker]

Expected [inferred]: packaged builds show `BUNDLE_REPAIR`, loading false.

## Tests
GitHub Actions only, never the owner's Mac (D-28). In `listen.stop-drain.test.ts`:
- Call `render('whisper').start(...)` directly, because the `start()` helper auto-emits 'ready' (:271-280).
- `emit` accepts `message` (:213-221).

Must fail first:
- **T1:** The prewarmed worker (:859-957) emits `BUNDLE_REPAIR` before 'ready'. Expect that error, loading false, `listening` true.
- **T2:** T1 plus one queued window. Expect the error not to be `DROPPED_MSG`, and no 'audio' posted.
- **T3:** `'Failed to fetch'` before 'ready'. Expect a new worker gets 'init' and the error is `RECONNECTING_MSG`. Then `BUNDLE_REPAIR` on that worker is surfaced.
- **T4:** `parakeetStatus` rejects; Whisper fallback hits a load error. Expect it surfaced.
- **T6:** A Parakeet session, Stop, then a Whisper start with a load error. Expect it surfaced, and no 'audio' posted before 'ready'.

Must stay green:
- **T5:** Session 2 reuses a ready worker, and an error arrives before its first window. Expect error null.
- Existing: `listen.partial-caption.test.ts:375-412`, `listen.stop-drain.test.ts`, `listen.test.ts`, `whisper.worker.test.ts`, `asr-decode-failure.mqa193.test.ts`, `listen.instant-start.contract.test.ts`, typecheck.

## Landing
- Branch `m2/M2-0535-first-listen-whisper-init` already exists at `0499fffb` [verified].
- Two commits: tests (red), then fix (green).
- One PR into `m2/integration`, titled `fix: surface a first-Listen Whisper load error [M2-0535]`.
- Checks:
  - Build & Test runs on push (build.yml:11-14).
  - Packaged smoke runs on ready-for-review (packaged-smoke.yml:14-17).
  - The QA candidate self-test triggers only on its path list, which excludes `listen.ts` (qa-candidate.yml:21-40). If it runs, it must pass.
- Nothing skipped, weakened or re-run to green; independent review required.
- Leave `package.json`, `package-lock.json`, workflows and release scripts untouched.

## Out of scope
- A silent load hang, since there is no load timeout (whisper.worker.ts:174-199)
- The no-'ready' hang after `failAdmittedCapture` (:2665)
- The 180 s Stop drain after a failed load (:83)
- `NETWORK_ERR` misclassification (dev only)
- The uncaught async IIFE in `start()`
- 2.0 features

## Done when
- T1-T4 and T6 go red then green in Actions, and T5 plus the existing tests stay green on both commits.
- Diff touches only the two files.
- All checks green, review approved, PR merged.
- The next M2-0495 smoke shows lines within 120 s, or `BUNDLE_REPAIR` with no loading row. If it logs neither "ASR load failed" nor an engine line, open the silent-hang item.

## Handoff
- Allocated to the owner's Ultron fleet by the lead under OD-45 (2026-10-02). The Codex queue never launches this ticket (ledger: IN_PROGRESS, claimed by Ultron).
- When the PR is open, the lead registers it with the merge lane after an independent review; the lane applies the same checks as every PR and records the merge in the ledger.

