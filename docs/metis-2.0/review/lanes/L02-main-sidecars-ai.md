# L02 — main/sidecars/AI lane review (Métis 2.0, r11/v6 kit)

Reviewer: staff-engineer AUDIT pass (read-only). Repo: `/Users/<redacted-user>/AI-Brain-build/metis-2.0` @ `2bf21f1c` (v1.9.6).
Method: SAE brownfield-discovery + domain-boundaries (AUDIT mode), Stark/Addy five-axis review. No files modified; no destructive git ops run.

Evidence labels used throughout: **OBSERVED** (seen directly in code/tests), **DERIVED** (reasoned from OBSERVED facts + the lead's runtime evidence E1–E9), **ASSUMED**, **UNKNOWN**. Runtime evidence items E1–E9 are the lead's, quoted from the task brief; I did not re-collect them.

## 0. Top-line verdict

This is **not** a sloppy codebase. It is a heavily, iteratively hardened one — nearly every module in this lane carries multiple "MQA-NNN" / "F-number" comments documenting a *specific prior field bug* and the fix for it (dead keys, restart storms, shutdown-race SIGTRAPs, Windows grandchild orphaning, etc.), and several of those fixes are pinned by source-contract tests that read the handler body as a string and assert invariants about it (e.g. `will-quit-guard.test.ts`). The circuit-breaker/exhaustion/hedge/retry stack (`provider-health.ts`, `exhaustion.ts`, `hedge.ts`, `retry.ts`) is genuinely well-designed: fail-open, advisory-only cooldowns, self-healing on read, reason-specific windows, no persisted state to go stale.

The real defects in this lane are narrow and structural, not sprayed everywhere: **the sidecar-lifecycle hardening that clearly exists for `local-runtime.ts` (llama-server) and `fm-runtime.ts` (Apple `fm serve`) was never extended to cover an OS-level force-quit/crash of the main process, and was only partially extended to the three `utilityProcess`-based ASR sidecars.** That gap lines up almost exactly with the lead's runtime evidence (E2, E3, E8) and is the headline finding below. E4's cold-start number also has a concrete, citable mechanical explanation in this code, not just "it's slow."

## 1. Architecture map (this lane)

Five independent sidecar families, each with its own lifecycle manager:

| Sidecar | Manager (this lane) | Mechanism | Long-lived? |
|---|---|---|---|
| `llama-server` (Métis Local LLM) | `src/main/llm/local-runtime.ts` | `child_process.spawn` | Yes — 15 min idle-stop |
| Apple `fm serve` (macOS 27+ Foundation Models) | `src/main/llm/fm-runtime.ts` | `child_process.spawn` | Yes — 15 min idle-stop |
| Parakeet ASR (sherpa-onnx, live) | `src/main/parakeet.ts` | `electron.utilityProcess.fork` | Generation-scoped, released explicitly |
| Whisper ASR (transformers.js, import) | `src/main/whisper-import.ts` | `electron.utilityProcess.fork` | Per-import-job, released at job end |
| Speaker embedding (sherpa-onnx) | `src/main/speaker-embedding-client.ts` | `electron.utilityProcess.fork` | Generation-scoped, owner-arbitrated (`live`/`import`) |
| Windows/macOS foreground watcher | `src/main/foreground-watcher.ts` (adjacent; not in file list but wired through `mac-helper.ts`) | `child_process.spawn` (powershell / `metis-mac-helper watch-frontmost`) | Long-lived, owned by `screen-preprocess.ts` (other lane) |
| Swift `metis-mac-helper` (OCR / screen-metrics) | `src/main/mac-helper.ts` | `child_process.spawn`, spawn-per-call | No — one-shot, timeout+SIGKILL |
| ffmpeg (import decode) | `src/main/ffmpeg-decoder.ts` | `child_process.spawn`, spawn-per-import | No — one-shot |
| Windows/macOS archive extract (Node install, Parakeet Windows archive) | `managed-node.ts`, `parakeet-extract.ts` | `child_process.spawn` / `utilityProcess.fork` | No — one-shot |

Provider routing/failover sits in `src/main/llm/`: `local-routing.ts` (eligibility precedence), `provider-health.ts` (auth-failure cooldown / circuit breaker), `exhaustion.ts` (rate-limit / quota / usage-cap classifier), `usage-headroom.ts` (pre-emptive header-based budget), `hedge.ts` (race-two-providers), `retry.ts` (transient classifier + backoff). `local.ts` and `llm.ts` are the dispatch seam that ties a request to one of these strategies, wrapped by `enterprise-client.ts` (not in this lane's file list, referenced only).

## 2. Findings

### F1 — [P0] [correctness/reliability] No orphan detection/reaping for `llama-server` / `fm serve` sidecars across an ungraceful exit — root cause of E2 and a direct contributor to Tony's "very heavy on the PC" report

**Evidence:** OBSERVED + DERIVED.

- `local-runtime.ts:224-234` keeps all sidecar identity (`child: ChildProcess | null`, `port`, `state`, `startGeneration`) as **module-scope, in-memory-only** state. There is no PID file, no marker in `userData`, nothing written to disk that would let a *later* process instance discover "a previous Métis launch's llama-server (PID X) is still alive."
- The only two places that ever kill the sidecar are `stopSidecarsForHardExit()` (`index.ts:4169-4193`, reached via the emergency-quit escape hatch / its 4s watchdog) and the `will-quit` handler (`index.ts:9461-9518`). Both run **inside the same process instance** that spawned the child, and both depend on Electron's JS event loop still being alive.
- `spawn()` calls in `local-runtime.ts:362` and `fm-runtime.ts:285` pass no `detached` option, so on POSIX the child shares the parent's process group; per the module doc comment at `local-runtime.ts:1-12`, the API key is intentionally passed via env, not argv — there is no other cross-instance handle either.
- An OS-level force-quit (Activity Monitor "Force Quit", `kill -9 <pid>`) or a native crash (the class `index.ts:8924-8929`'s own comment describes: *"A native C++ exception… unwinds past V8 entirely, so nothing in this process ever runs again"*) terminates the main process **without running any JS**, so neither `will-quit` nor `stopSidecarsForHardExit` ever executes. The child is reparented to PID 1 and keeps running with its GGUF still mapped.
- Nothing anywhere in this lane (`grep -rn "orphan\|pidfile\|reap"` across `src/main`) implements a startup-time scan/kill of a stale sidecar from a previous launch. The only "orphan" handling that exists is for **temp files** (`transcripts.ts:428`, `index.ts:8965`) and **crash-recovery drafts** (`transcripts.ts:978-991`) — never for sidecar *processes*.

**This is E2, mechanically, not speculatively**: E2 reports two orphaned `llama-server` processes (`ppid=1`) surviving 14+ hours across relaunches, plus orphaned `chrome_crashpad_handler` processes (the Chromium infrastructure every spawned Electron-family process — including `utilityProcess` children — brings with it). E3's audit trail (8 `app.started` events in one day, zero clean-shutdown events between them) independently corroborates that force-quit/relaunch, not `will-quit`, is the dominant shutdown path in the field — which is exactly the path this code has no coverage for.

**Failure scenario:** User force-quits Métis (or it crashes — E6 shows `render-process-gone reason=killed exitCode=15` followed 5s later by `app.unresponsive`, itself a plausible trigger for a user force-quit) while `llama-server` is loaded (up to ~5.6 GB private RSS for the 4B model with GPU offload, per `local-models.ts:129-133`'s own measured figures). The sidecar survives. User relaunches; a **second** `llama-server` spawns for the new session; the first is never found or killed. Repeat across 8 launches/day (E3) and RAM/CPU pressure compounds — directly explaining bug report #1 ("very heavy on the PC") independent of anything the *new* process itself does wrong.

**Fix direction:** Persist a small sidecar-registry file in `userData` (PID + spawn time + resourcesPath fingerprint, written right after a successful `spawnAndWaitHealthy`, removed on `stop()`) for each of `llama-server` and `fm serve`. At boot, before any new spawn, read it and — if the recorded PID is still alive and its command line matches the expected binary path — kill it (SIGKILL) and log `local.runtime.reaped_orphan`. This is the same shape `boot-sentinel.ts` already uses for its own crash-consecutive-count tracking (`pid: process.pid` at `boot-sentinel.ts:114`) — the pattern exists in-repo, it just was never applied to sidecars.

---

### F2 — [P1] [architecture/reliability] `will-quit` / `stopSidecarsForHardExit` cover 2 of 5 sidecar families; Parakeet, Whisper-import and speaker-embedding `utilityProcess` children are not explicitly killed on quit

**Evidence:** OBSERVED.

- `index.ts:9461-9518` (`will-quit`) explicitly, independently (`own try` per step, by design — see the comment at `index.ts:4167-4168` and `index.ts:9477-9478`) stops: `screenPreprocess` (which owns the foreground watcher), `localRuntime` (llama-server), `fmRuntime` (fm serve). It does **not** call `parakeetRelease()`, `stopWhisperHost()`, or `releaseSpeakerEmbedding(...)`.
- `stopSidecarsForHardExit()` (`index.ts:4169-4193`, the emergency-quit hard path) stops the exact same three and nothing else.
- This is a **deliberate, tested pattern** for the two it does cover: `src/main/will-quit-guard.test.ts` is a source-contract test that reads `index.ts` as a string and asserts, line-order and try/catch-wrapping, that `localRuntime.stop()` and `fmRuntime.stop()` each sit in the handler in their own independent `try` block (see `will-quit-guard.test.ts:42-61`, docstring: *"an orphaned unauthenticated loopback server is worse"*). No equivalent test exists for the ASR sidecars — `grep` for `parakeet|whisper|speakerEmbedding` across `will-quit-guard.test.ts` and `emergency-force-quit.test.ts` returns zero matches.
- `parakeet.ts`'s and `speaker-embedding-client.ts`'s own generation/termination machinery (`terminateGeneration`, the 5s `exitTimer` that can flip a generation into `'blocked'` state — `parakeet.ts:176-192`, `speaker-embedding-client.ts:137-153`) shows the authors are well aware these children can fail to exit promptly; that awareness was never wired into the app-quit path.

**Why this matters despite Electron's own utilityProcess teardown:** on the graceful `will-quit` path, Electron's own process supervision *usually* tears down `utilityProcess` children as part of normal shutdown, so this gap is lower-probability than F1 on that path. But E2's own evidence lists orphaned `chrome_crashpad_handler` processes alongside `llama-server` — crashpad handlers are exactly the kind of Chromium-infrastructure process a `utilityProcess` child (and its own crash reporter) brings with it, which is consistent with (not proof of) `utilityProcess` children also surviving an abrupt exit, same as F1. Regardless of confidence on the crash path, on the **graceful** path this is a plain inconsistency: the codebase clearly considers "an orphaned sidecar outliving the app the user just quit" a bug worth its own try/catch and its own regression test for 2 of 5 sidecar types, and simply never finished the job for the other 3.

**Fix direction:** Add `parakeetRelease()`, `stopWhisperHost()`, and `releaseSpeakerEmbedding('live')`/`('import')` calls to both `will-quit` and `stopSidecarsForHardExit`, each in its own `try`, and extend `will-quit-guard.test.ts`'s source-contract pattern to pin them the same way it pins the other two.

---

### F3 — [P1] [performance/correctness] Boot-time local-model prewarm exists but is gated on a signal that doesn't cover background ingest — plausible mechanical explanation for E4's 30–41 s cold start

**Evidence:** OBSERVED (mechanism) + DERIVED (this being the actual cause on Tony's machine — not independently confirmed against his `settings.json`).

- `ensureLocalRuntimeStarted` (`local.ts:56-83`) is the only path that spawns `llama-server`; it is called reactively, from whatever request first needs it. The model is **never** resident before that.
- A boot-time prewarm *does* exist: `index.ts:8858-8885`, `warmLocalIfReady()`, called both after `provisionLocalModel(...).then(...)` resolves and via a `setTimeout(warmLocalIfReady, 4000)` backstop.
- `warmLocalIfReady` gates on `localPrewarmEligible(...)` (`local-routing.ts:185-214`), which returns `true` only when: `useFor.suggest` is on, **or** (`resilience.hedge` and `localLlm.fallback` are both on), **or** (`localLlm.fallback` is on and no cloud provider is ready). All three conditions are about the **live "suggest" / hedge-race** use case.
- Separately, `brain/ingest.ts`'s `extractConcurrency()` (`ingest.ts:~1395-1408`, its own comment: *"Local is a two-slot sidecar… three concurrent local extractions serialize on ONE slot"*) shows that **background extraction** can independently route to `provider === 'local'` as its **primary** provider (`pickProviderCandidates(s)[0]?.provider === 'local'`), completely independent of `useFor.suggest`.
- `localPrewarmEligible` never consults that ingest-routing snapshot. So: on a profile where local is the effective primary for background extraction but `useFor.suggest` is off, hedge is off, and a cloud provider is otherwise configured (`cloudReady === true`), `localPrewarmEligible` correctly (per its own narrow contract) returns `false`, and the 4s-backstop prewarm never fires.
- E4's own sequence — `brain.consolidation` + a burst of ~20 `brain.ingest` jobs within 200 ms of launch, *then* `local.runtime.start`, *then* `llm.call provider=local ttaMs 41282`/`29637` — is exactly what you'd see if the first local-routed extraction in that burst is the thing that cold-starts the sidecar, because nothing warmed it first.

I did **not** confirm Tony's actual `settings.json` values for `localLlm.useFor.suggest` / `localLlm.fallback` / which cloud providers are configured, so I cannot certify this is *the* cause rather than *a* plausible one — flagging as DERIVED and recommending the planner correlate against Tony's real settings + the `local.model.download_start`/`local.runtime.start` reason fields in his audit.log before committing to a fix.

**Fix direction:** Either (a) add a fourth eligibility branch to `localPrewarmEligible` that also fires when the ingest/extraction routing snapshot would pick `local` first, or (b) have `brain/ingest.ts`'s own boot-time reconciliation call `ensureLocalRuntimeStarted`/`prewarmLocal` itself before it starts firing extraction jobs, rather than relying on the generic suggest-shaped prewarm to have already covered it.

---

### F4 — [P2] [performance] `verifyIntegrity()` re-hashes the full model file(s) synchronously, sequentially, before every cold spawn — adds real, uncounted latency on top of E4's number

**Evidence:** OBSERVED.

- `local.ts:66-68`: on every `state === 'stopped'` (cold start) **or** model-switch (`getActiveModelKey() !== paths.gguf`), `verifyIntegrity(modelId)` runs *before* `localRuntime.start(...)` is even called.
- `local-models.ts:452-475` (`hashFile`/`verifyFileChecksum`) streams the entire file through SHA-256. For the 4B model (`local-models.ts:86`, `2912109728` bytes ≈ 2.71 GiB GGUF) plus its 672 MB mmproj (when vision is loaded), that is up to ~3.4 GB of sequential disk read + hashing, done **before** the `llama-server` process is even spawned — not overlapped with the spawn/model-mmap time that `HEALTH_BUDGET_MS`/`PORT_LINE_BUDGET_MS` (`local-runtime.ts:51-62`) already budget for and that E4 measures.
- There is no cache of "this exact (path, size, mtime) was already verified this session" — a repeat cold start of the *same, unchanged* on-disk bytes (e.g., idle-stop then a later request re-triggers a cold start with the same model) re-pays the full hash cost every time.
- This is a genuine, deliberate security control (protects against a corrupted/tampered GGUF reaching `llama-server`) — the fix is to stop paying its cost serially, not to remove it.

**Fix direction:** Cache `{path, size, mtime, verifiedAt}` per model file for the life of the process and skip re-hashing when all three match; alternatively, kick off `verifyIntegrity` and the `spawn()` concurrently and only gate the health-poll (not the process start) on the hash result — a corrupted file will still be caught before any real inference request reaches it, since `spawnAndWaitHealthy`'s health poll already takes multiple seconds.

---

### F5 — [P2] [reliability/observability] Unexplained `local.runtime.start` (62) vs `local.runtime.stop` (108) asymmetry (E8) — flagged as UNKNOWN, not resolved by static review

**Evidence:** OBSERVED (code) + UNKNOWN (root cause of the specific 62 vs 108 numbers).

Every `local.runtime.stop` audit-log call site I found is guarded so it only fires when the runtime *was* `'running'`/`'starting'` (`local-runtime.ts:632-638`'s `stop()`; the model-switch branch at `local.ts`→`local-runtime.ts:607-611`; `fm-runtime.ts:369-378`'s `stop()`). Every one of those states is only reachable after a matching, earlier `local.runtime.start` log line (`local-runtime.ts:557`, `fm-runtime.ts:349`). I could not find a code path that logs `stop` without a logically-prior `start` in the *same* engine, nor a path that double-logs `stop` for one transition. Two engines (llama via `local-runtime.ts`, Apple via `fm-runtime.ts`) write to the **same** `local.runtime.start`/`local.runtime.stop` event names, distinguished only by an `engine` field (`fm-runtime.ts:154`, `:276`, `:349`, `:377`), which means the raw aggregate counts in E8 mix both sidecars and cannot be interpreted without segmenting by `engine`/`reason`.

**Recommendation, not a fix:** before any code change here, replay the actual audit.log rows for `local.runtime.start`/`local.runtime.stop`, segmented by `engine` and `reason`, and pair them chronologically per engine. If a genuine unpaired-stop pattern survives that segmentation, it points at either (a) idle-stop timers surviving across what should have been a clean generation boundary, or (b) a stop counted for a session whose matching start happened in a *prior* audit.log rotation/launch not covered by the 62-start window quoted in E8. I do not have enough evidence to assert either.

---

### F6 — [P3] [reliability] `ffmpeg-decoder.ts` cancel path uses SIGTERM only, no SIGKILL escalation — inconsistent with the rest of the lane's kill hardening

**Evidence:** OBSERVED.

- `ffmpeg-decoder.ts:190-193` (`cancel()`): `if (!child.killed) child.kill('SIGTERM')` — no follow-up timer to SIGKILL if the process doesn't honor SIGTERM.
- Contrast with the same file's own `probeDurationSeconds` (`ffmpeg-decoder.ts:56-59`, SIGTERM then relies on the 5s timeout to just give up on waiting, not to escalate the signal) and with `mac-helper.ts`'s OCR/screen-metrics paths (`mac-helper.ts:141-144`, `:217-220`: hard `SIGKILL` after a timeout), and `dustcli.ts`/`cli.ts`'s Windows process-tree cascade-kill (`killWindowsProcessTree`) built specifically because a plain SIGTERM was observed to orphan a grandchild.
- Low real-world probability (bundled LGPL ffmpeg reliably honors SIGTERM) but it is the one spawn-and-cancel path in this lane without a kill escalation backstop, and import cancellation is a user-triggered, not-rare action.

**Fix direction:** Arm a short (~2s) SIGKILL escalation timer alongside the SIGTERM in `cancel()`, cleared on `close`, mirroring the pattern already used for the OCR/screen-metrics one-shot spawns in the same lane.

---

### F7 — [P3] [performance] `local-model-download.ts` retries a failed chunk immediately, with no backoff, unlike every other network-retry path in this lane

**Evidence:** OBSERVED.

- `local-model-download.ts:264-284`: `for (let attempt = 1; attempt <= MAX_ATTEMPTS && !ok; attempt++)` retries `downloadOne` with no delay between attempts.
- Every other retry surface in this lane (`retry.ts`'s `nextBackoff`, used by the cloud/CLI providers) uses exponential backoff with jitter specifically to avoid hammering a struggling network/proxy. A large (up to ~2.9 GB) multi-GB model download failing due to a flaky corporate proxy or a transient CDN 5xx gets three rapid-fire retries instead of easing off.

**Fix direction:** Reuse `nextBackoff` (already imported nowhere in this file today) between attempts, honoring any `Retry-After`-shaped signal if the HTTP layer ever surfaces one for this endpoint.

## 3. What I checked and found solid (worth stating, not just the bugs)

- `HedgeRace` (`hedge.ts`), `provider-health.ts`'s cooldown map, and `exhaustion.ts`'s classifier are correctly fail-open, advisory-only, and self-healing on read — no correctness issues found in the concurrency/state-machine logic on inspection.
- `parakeet.ts` and `speaker-embedding-client.ts`'s generation/epoch machinery correctly prevents a request from being enqueued into a dying generation, and correctly bounds in-flight PCM bytes and request counts (`MAX_QUEUED_PCM_BYTES`, `MAX_PENDING_REQUESTS`) — a real concurrency-limit / backpressure control, present in both ASR sidecars that need it (Whisper's import path is naturally serialized by its caller, so the same guard would be redundant there, and its absence there is not a bug).
- `local-model-download.ts`'s download-then-verify-then-atomic-rename sequence (content-length pre-check → `.partial` write → size check → SHA-256 check → `renameSync`) is correct and matches the module's own stated threat model (never let a half-written or tampered file be mistaken for a usable model).
- `command-control.ts`'s propose/confirm/cancel nonce protocol uses `timingSafeEqual` correctly and consumes the proposal before executing (no double-execute race).
- `application-catalog.ts` is explicitly guarded by its own test (`application-catalog.test.ts`) to never call `exec`/`execFile`/`spawn`/`fork` — application open/focus/quit goes through a non-shell-out path; "quit" in `application-command-session.ts` targets a *third-party* app, never Métis itself.

## 4. Coverage ledger

Read in full: `local-runtime.ts`, `fm-runtime.ts`, `local.ts`, `local-routing.ts`, `local-models.ts`, `local-model-download.ts`, `local-model-provisioning.ts`, `managed-node.ts`, `parakeet.ts`, `parakeet-extract.ts`, `whisper-import.ts`, `whisper-asr-host.ts`, `speaker-embedding-client.ts`, `mac-helper.ts`, `ffmpeg-decoder.ts`, `foreground-watcher.ts` (adjacent), `exhaustion.ts`, `provider-health.ts`, `hedge.ts`, `retry.ts`, `usage-headroom.ts`, `llm.ts`, `personas.ts`, `polish.ts`, `command-control.ts`, `metis-command-runtime.ts`, `metis-decide-client.ts`, plus the relevant slices of `index.ts` (boot sequence, will-quit, force-quit, extraction concurrency call site).

Not read in full (skimmed or grep-only, lower priority given no spawn/child_process surface and no findings surfaced): `mode-skills.ts`, `metis-command-register.ts`, `application-catalog.ts`/`application-catalog-view.ts`/`application-discovery.ts`/`application-intents.ts`, `speaker-embedding-host.ts`/`speaker-embedding-protocol.ts`/`speaker-cluster.ts`/`speaker-id.ts` (the in-child model logic, as opposed to the main-process client), `local-runtime.concurrency.test.ts` and the other `*.test.ts` files (beyond confirming what `will-quit-guard.test.ts` and `application-catalog.test.ts` assert). `scripts/tar-bz2-extract.mjs` (a build script, not app runtime) was not reviewed. Explicitly out of lane and not reviewed: `screen-preprocess.ts` (E5's capture-retry-loop evidence lives there, not in this lane's file list).

Never opened: any credential file, `key-*.bin`, `secret-key.bin`, `Cookies`, `identity.json`, or meeting/transcript content.
