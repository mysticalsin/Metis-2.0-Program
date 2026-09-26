# Métis 2.0: architecture

| Field | Value |
|---|---|
| Status | Governing design for the program (adopted by M2-0059). Refined on 2026-09-26 from `plan-work/ARCHITECTURE-TARGET.md` after two independent premortem critiques; the changes are listed in §0.1 |
| Method | software-architecture-engineer v1.4.0, **DESIGN + EVOLVE** mode; infrastructure-fit posture **RETAIN** (desktop, Operator) + **AUGMENT** (server intelligence plane) |
| Baseline | `origin/main` 2bf21f1c (v1.9.6), read-only checkout `/Users/tony/AI-Brain-build/metis-2.0` |
| Companion documents | [PLAN.md](PLAN.md) (waves, gates, 1.9.7), [DECISIONS.md](DECISIONS.md) (ADR-lite log and the D-1..D-29 register), [BLOCKERS.md](BLOCKERS.md), `ledger/tickets.json` (213 tickets, schema v2) |
| Execution | **Nothing in the repo was run.** Only read-only `grep`, `sed` and `git rev-parse` against the checkout. Every runtime test in this document is **NOT_RUN**. |
| Readiness | **DESIGN_READY** for desktop milestones m3–m7 (stabilization, CI fitness, foundation, interaction core, speech). **DESIGN_BLOCKED** for the live server intelligence plane (memory, knowledge API, Laya, Teams media) pending D-5, D-6 and the Entra/Teams/Azure owners; engineering proceeds against a local compose profile. **RELEASE_BLOCKED** until the 1.9.7 gates pass on the tested bytes. |

**Evidence labels.** OBSERVED means read directly in code, logs or on disk, by this lane or by a named lane or verifier (cited). PROVIDED means stated by an input document. DERIVED means reasoned from OBSERVED facts. ASSUMED means believed but not verified; each one names its verification step. PROPOSED means a design choice made here. UNKNOWN means evidence is missing.

**Stark evidence levels** for components: DESIGNED → LOCALLY_TESTED → HOST_CONFIGURED → LIVE_VERIFIED → ACCEPTED → MEASURED. Every component in this document is at **DESIGNED**. Stark treats the six levels as distinct evidence classes, not a ladder: each ticket lists the set it needs in `required_evidence`.

---

## 0. The decision in plain language

Métis is one Electron app that does too much in two giant files. The two bugs Tony reported come from one self-reinforcing loop, not from a single defect:

1. The main process sometimes reads meeting files **synchronously** from the OneDrive folder. When a file is "dataless" (cloud-only), macOS blocks the thread while it tries to download the file. That froze the whole app for 45 s, 85 s and about 5 min 24 s on 2026-09-24/25. During a stall nothing can run: not the reopen handler, not the tray, not IPC.
2. Tony force-quits. Sidecars are cleaned up only by JavaScript quit events, and a force-quit skips those, so each force-quit leaves behind a **3.1 GB** `llama-server`.
3. On relaunch, background work (reconcile every 60 s, consolidation, backfill resume, and a re-ingest after test processes quarantined the brain index) cold-starts the local model. It can revive exhausted jobs, and the machine gets heavy again.
4. Separately, when the overlay is parked in the "hide" layout, a reopen is a **visible no-op by design**. So "it doesn't open again" is also true when the app is healthy.

The target architecture breaks every link in that loop with a few small, owned mechanisms inside the existing app. It does not rewrite anything or add a service:

- **Kill-safe runtime.** Killing Métis at any moment must be safe: sidecars die with it, acknowledged edits survive, and the next boot does not start a storm.
- **No cloud-content I/O on the main thread.** One storage gateway is the only code that touches the meetings folder. It is async-only, has a global admission limit and knows about dataless files. History reads a local index and never hydrates cloud files.
- **One reveal-or-recover controller** handles every reopen path. **One background scheduler** owns every timer and the retry and exhaustion policy.
- **A modular monolith** (`main/{app,lifecycle,windows,ipc,features/*,infra/*}`, `renderer/{app,features/*,ui/*}`, `shared/contracts/*`) is reached through a strangler migration, with CI fitness functions that keep the old shape from growing back.
- The **2.0 intelligence features** (Jev/Laya decisions, Hindsight memory, the governed knowledge API, Teams) sit **server-side behind Operator and Entra**. The desktop stays a thin, key-less client of them.

Facts this rests on are in §1. Assumptions that could overturn a decision are marked ASSUMED, each with its verification step and owning ticket (§6.4). Non-goals are in §2.9.

### 0.1 What changed in this refinement (2026-09-26)

| # | Change | Why | Tickets |
|---|---|---|---|
| 1 | Storage admission is **one global cap** on in-flight meetings-root operations (content plus metadata) of at most *effective libuv pool size − 2*, with content and metadata as priority lanes under it | 2 content + 4 metadata permits = 6 against a pool of 4; stat/readdir on dataless File Provider directories may block too (ASSUMED) | M2-0030, ADR-021 |
| 2 | **Dataless detection ships in 1.9.7** (mac-helper `stat-flags`, Windows placeholder attributes), so History list/search never read a cloud-only file | Without it 1.9.7 cannot know a file is dataless before reading it | M2-0191, M2-0193 |
| 3 | Stall tests use **OS-level fixtures** (kernel-blocking FIFOs, real dataless files on a QA cloud account, network off) instead of a JS delay shim; ST-1 also asserts a settings write and a `dns.lookup` finish in < 250 ms; failure triggers C10 automatically | A JS shim cannot pin a libuv thread and cannot be loaded into a packaged app if the NODE_OPTIONS fuse is off | M2-0008, M2-0030, M2-0031 |
| 4 | The freeze fix is ordered around the **verified** path: gateway core → `.brain`/timer/IPC readers → History | History list/search measured non-blocking (8 ms at N=59); the spindump path is synchronous `.brain` reads in timers and IPC | M2-0030 → M2-0031 → M2-0193 |
| 5 | **Out-of-process stall sampler** (mac-helper `stall-watch`) samples main when the `run/alive` heartbeat is > 10 s stale | A blocked main cannot report its own stall; one natural freeze has no stack | M2-0192, ADR-023 |
| 6 | C1 no longer uses `detached:true`; the wrapper calls `setpgid` itself | Resolves the contradiction with M2-0026 ("no detached flag") | M2-0026, M2-0028 |
| 7 | A ledger that is foreign-key, keystore-unavailable, read-only or dataless **suspends model-bound brain work** (`ledger_unavailable`) | Otherwise the in-memory empty index makes every boot re-extract every meeting: a new heaviness loop | M2-0003, M2-0031, M2-0033 |
| 8 | **Verification is part of the architecture** (§7): isolated QA macOS user, QA-identity build variant, OS sandbox for any owner-account run, CI honeypot, Windows lanes, build-once candidate lane, owner-channel trains, feature freeze | Test processes quarantined the owner's brain index twice on 09-26; `release.yml` cannot publish 1.9.7 or keep "same sha256 as tested" | M2-0001, M2-0187, M2-0190, M2-0206..0210 |
| 9 | FF-14 (timers) is narrowed to background, model-bound and network work; UI timers stay local | Simplicity; cursor-watch and the stall monitor are not background work | M2-0073 |
| 10 | The ingest-ledger **contract** step waits for the T1 build plus ≥ 14 owner days, else moves to 2.0.1 | "One release on the new ledger" was impossible in the original schedule | M2-0205, M2-0167 |


---

## 1. Current architecture as observed (v1.9.6 @ 2bf21f1c)

### 1.1 Process topology

| Process | Spawned by / how | Lifetime owner today | Cleanup on SIGKILL / crash of main | Evidence |
|---|---|---|---|---|
| Electron main (`Metis`) | OS; LSUIElement accessory app, `app.dock.hide()` | Single-instance lock; tray-owned lifetime (`window-all-closed` is a no-op) | n/a | OBSERVED (L01; `electron-builder.yml:227`, `index.ts:8994` per B1 verifier) |
| Overlay renderer | `new BrowserWindow` `index.ts:2580`; sandbox, contextIsolation, `backgroundThrottling:false` (`:2615`), always-on-top `screen-saver`, all workspaces | Main (`render-process-gone` auto-reloads with no budget; `unresponsive` only logs, by deliberate test-pinned design) | Chromium | OBSERVED (L01, B3 verifier; this lane grep) |
| Decoder window (hidden) | `index.ts:1453`, `backgroundThrottling:false` (`:1462`) | Import pipeline | Chromium | OBSERVED |
| PDF window (transient) | `index.ts:8446` | Recap PDF export | Chromium | OBSERVED |
| Intelligence window | `intelligence.ts:128`, separate 4-call preload, navigation denied | On demand | Chromium | OBSERVED (L10) |
| Parakeet / Whisper / speaker-embedding / Parakeet-extract hosts | `utilityProcess.fork` (`parakeet.ts:123`, `whisper-import.ts:178`, `speaker-embedding-client.ts:97`, `parakeet-extract.ts:27`) | Generation + termination barrier per client | **Reaped by Chromium when main dies** on macOS (PROVIDED, verifier follow-up). Windows is UNKNOWN. | OBSERVED (spawn sites), PROVIDED (reaping) |
| `llama-server` (local LLM, Qwen GGUF) | `child_process.spawn` `llm/local-runtime.ts:362`, not detached, `--port 0` + per-session key; single-flight `startPromise` (`:238`), start generations, 15-min idle stop (`:64`) | JS only: `will-quit` (`index.ts:9461`), `stopSidecarsForHardExit` (`:4169`, Cmd+Ctrl+Esc, darwin only) | **Orphans.** Two observed with ppid=1, **phys_footprint ≈ 3,124 MB each**. Each orphan's pgid equals the pid of a dead main. The `onFatal` "Relaunch" path (`app.relaunch(); app.exit(0)`, `:3575`) also orphans. | OBSERVED (RUNTIME-EVIDENCE; B2-F1 CONFIRMED ×2; B3-RC5) |
| `fm serve` (Apple `/usr/bin/fm`, unauthenticated loopback) | `spawn` `llm/fm-runtime.ts:285` | Same JS-only paths | Orphans (same mechanism) | OBSERVED (code), DERIVED (orphaning) |
| mac-helper `watch-frontmost` (Swift, long-running) / PowerShell foreground watcher (Windows) | `mac-helper.ts:128`, `foreground-watcher.ts:195` | Restart budget in watcher | Not in any quit list | OBSERVED (B2), DERIVED |
| mac-helper `ocr` / `transcribe` / `screen-metrics` (per command) | `mac-helper.ts:204`, `apple-speech.ts:100` | Per call | Short-lived | OBSERVED |
| ffmpeg import decoder | `ffmpeg-decoder.ts:37,110` | `closeImportDecoder()` only; **absent from both quit lists** | Orphans | OBSERVED (L01 F2) |
| Managed Node / Dust CLI / CLI installers | `managed-node.ts:187`, `dustcli.ts`, `cli.ts` | Per command | Short-lived | OBSERVED (B2 "ruled out as continuous") |
| `chrome_crashpad_handler` | Chromium | Chromium | Two observed alive with ppid=1 (small RSS) | OBSERVED; impact UNKNOWN (low) |

There are 17 non-test files in `src/main` that import `child_process` (OBSERVED, this lane). No spawn goes through a shared owner.

### 1.2 Data stores

| Store | Location | Format / protection | Owner module(s) | Notes |
|---|---|---|---|---|
| Settings | `userData/settings.json` | ATKENC envelope | `main/store.ts` (1,379 LOC) | Renderer patches are stripped by three unlinked key arrays (`index.ts:4843–4883`). OBSERVED (L08 F1) |
| Audit log | `userData/logs/audit.log` | Hash-chained JSONL, synchronous append, 5 MB rotation | `main/logger.ts` | No clean-shutdown event type exists. `app.crash` is also written for non-fatal events. OBSERVED (B3-RC1, logger.ts) |
| Boot sentinel | `userData/boot-incomplete.json` | JSON | `boot-sentinel.ts` | Always cleared at `registerIpc` (21/21 records). OBSERVED (B3-RC4 verifier) |
| Local models | `userData/local-llm` (3.3 G), `asr-models` (640 M) | GGUF / ONNX | `llm/*`, `asr-*` | OBSERVED |
| Meetings | OneDrive `…/Métis Meetings/*.md` (or Documents) | Optional ATKENC2 per file | `transcripts.ts`, `recall.ts` | 59 files, **6 `compressed,dataless`**; reading them fails with ETIMEDOUT after about 0.6 s today. Spindumps show sync reads blocked for 45–85 s in `apfs_materialize_dataless_file_ext`. OBSERVED |
| Autosave drafts | **Meetings folder** `.autosave-draft-*.md`, every 60 s | Same as meetings | `transcripts.ts:890–1021` (`recoverOrphanDrafts`) | The live transcript otherwise lives only in renderer React state. OBSERVED (this lane; `index.ts:9439` comment) |
| Brain | `…/Métis Meetings/.brain/` (`index.json` ingest ledger, `graph.json`, `meetings/*.json`, `entities/*`, `corrections.json`) | ATKENC envelope, device-local key | `brain/store.ts`, `brain/ingest.ts` | 180 `index.corrupt-*.json` quarantines, 18 orphan `.tmp` files. Mechanism: **test processes** resolve the real OneDrive folder, fail to decrypt with a different key, and quarantine the index. The app then re-ingests. OBSERVED (L03-01, RUNTIME-EVIDENCE) |
| Wiki projection | `…/Métis Meetings/wiki/` | **Plaintext** by design | `brain/publish.ts` | Gated by `publishBrainPages`. OBSERVED (MASTER §17.2) |
| Secrets | OS keychain / safeStorage; file keystore on packaged mac (`ASKTOTO_LOCAL_KEYSTORE=1`) | AES-GCM with KEK, one store per credential family | `secrets.ts`, `mcpSecrets.ts`, `license/secret-store.ts`, `dust-secret-store.ts` | Per-family isolation is intentional. OBSERVED (L05) |
| Operator | Cloudflare D1 | SQL | `operator/src/d1.ts` | Production runs an off-main build with an ACCESS bypass. PROVIDED (K09) |
| License server | Fly.io / Docker | Separate Express app | `license-server/` | Not in root CI. OBSERVED (L09) |

### 1.3 IPC surface

- **164** `ipcMain.handle/on` registrations, all in `src/main/index.ts` (OBSERVED, this lane). About 160 of them sit inside one 4,147-line `registerIpc()` (`:4624–8771`, L01 F4).
- **213** channel names and **59** zod schemas in `shared/ipc.ts` (2,408 LOC, fan-in 87). The preload API exposes about 140 functions through an allowlist with no generic `invoke` passthrough (OBSERVED, L08).
- Sender validation covers essentially every handler (161/163 match immediately; the other 2 were hand-verified). The guards (`assertMainWindow`, `denyIfLimited`, `assertBrainReader`) are free functions inside `index.ts` (OBSERVED, L01 §3, L12 F1).
- Drift already exists: two preloads hard-code channel literals with no parity test (L08 F3). Five dead `local-ai:*` channels are string-pinned by a test (L08 F4). TS `speaker:'you'` vs Swift `.me` (L08 F2) has drifted but is latent.

### 1.4 Cloud services (desktop egress)

Operator Worker (HMAC device API `/v1/ingest|heartbeat|use|ask|skills/manifest|integrations`; admin behind Cloudflare Access), the `cloudflare-proxy` AI relay Worker, the license server, Dust (OAuth plus bundled CLI), direct LLM providers, Cloudflare AI Gateway / speech, Microsoft Graph (calendar/Outlook), ClickUp/Plane MCP (OAuth), Hugging Face (ASR model download), GitHub (update feed). An egress guard and proxy exist in `main/net/`. (OBSERVED: L05, L09, and a hostname grep by this lane.) Not implemented at all: Laya, a `/v1/decide` route, Teams bot, `knowledge.*` MCP tools, Hindsight (OBSERVED absent, K02/K03/K06).

### 1.5 Trust boundaries today

| # | Boundary | Control today | Gap |
|---|---|---|---|
| TB1 | Renderer ↔ main | sandbox + contextIsolation + allowlisted preload + zod + sender guards | Guards are a convention inside a 9.5k-line file. Settings authority lives outside the type system (L08 F1). |
| TB2 | Main ↔ sidecars | llama-server loopback + per-session key; utilityProcess MessagePort; mac-helper JSON validated by zod | `fm serve` is an unauthenticated loopback (same-user threat model). Sidecars are not owned at OS level. |
| TB3 | Main ↔ file system | Atomic `writeSaved`, envelope crypto, basename guards | Cloud-provider files are read synchronously on main. A key mismatch is treated as corruption. The ledger sits in a synced folder. |
| TB4 | Desktop ↔ cloud | HMAC + nonce + skew to Operator; Access JWT for admin; egress guard | Device-side org Cloudflare token path (SRC-07/08, reproduces at HEAD per K05). Off-main production Operator build. |
| TB5 | OS permissions (mic, screen, accessibility) | TCC identity; macOS capture gate (MQA-209) | Windows gate missing (L04) |
| TB6 | **Dev/test ↔ user data** | none | **Test processes touched Tony's real OneDrive brain** (quarantines on 09-26 during this review). OBSERVED |
| TB7 | Supply chain / CI | gitleaks pinned by digest, audit gates, bug ledger | Actions not pinned to SHAs, no `permissions:` blocks, `docs/**.md` unscanned, `check:skips` not in CI (L11) |

### 1.6 Code shape

- 366 source and 483 test files (L12). God files: `main/index.ts` **9,519 LOC** (fan-out 135, 164 IPC registrations); `renderer/components/Settings.tsx` **9,378**; `App.tsx` 4,278; `lib/listen.ts` 3,154; `brain/ingest.ts` 2,818; `shared/ipc.ts` 2,408. In total **21 files exceed 800 LOC** (OBSERVED, L12).
- Two import cycles (brain ingest ↔ operator-ingest ↔ intelligence-index; Settings ↔ TapCalibration), 15 confirmed dead files, and one unwired 4-file command-mic feature (L12).
- There are **no production layering violations**: renderer, shared and preload are clean (L12). This is a strength and must be preserved.
- **481 synchronous fs calls in 53 `src/main` files** (OBSERVED, this lane's grep of `*Sync(` calls, test files excluded).
- **9 native renderer dialogs** (`window.confirm/alert`) across App.tsx, Review.tsx and Settings.tsx (OBSERVED).
- **51 test files in `src/main` read `index.ts` as text** (this lane's grep for `readFileSync(join(__dirname, 'index.ts')`). L11 counts 36 among `*.contract.test.ts`. These tests exist because `index.ts` "boots Electron at import" and has "no injectable seams" (the tests say so themselves).
- 7 `src/main` files use `setInterval` (8 calls in `index.ts`). Background cadences are scattered: 60 s reconcile, a 15 s boot block, intelligence-index slots, a 10-min Dust keep-warm, a 12 h license heartbeat, a 6 h retention sweep (OBSERVED).
- No lint or format tooling exists. CI is well-commented, and the bug ledger and type ratchet work (L11).

### 1.7 The observed failure loop (DERIVED from OBSERVED links)

```text
 sync read of dataless OneDrive file on main timer (spindump: uv__run_timers → uv_fs_read → apfs_materialize_dataless_file_ext)
        │  main thread blocked 45 s … 5 min 24 s   → activate / tray / IPC cannot dispatch  → "running but frozen"
        ▼
 user Force Quit (SIGKILL)  ──► llama-server / fm serve / ffmpeg orphaned (no OS ownership)  → +3.1 GB each ("heavy")
        │                   └─► no clean-shutdown marker; boot sentinel already cleared
        ▼
 relaunch → +15 s boot block: resume backfill (un-exhausts, B2-F2 PARTIAL) + 60 s reconcile + intelligence catch-up
        │   + .brain/index.json quarantined by foreign-key test processes → whole vault looks un-ingested (L03-01)
        ▼
 local-model cold start (ttaMs 29–41 s) + ingest burst ────────────────────────────────► back to top (heavier machine)

 independent: Hide layout parks overlay as a visible, opacity-0, click-through 8×2 hairline;
              activate → win.showInactive() is a no-op → "doesn't open the app again" even when healthy (B1-RC3 verifier)
```

Refuted as root causes, and not to be built on: the `window.confirm` "invisible sheet" theory (Electron 43 parents the sheet: B1-RC1 REFUTED ×2); a renderer reload loop (only one `render-process-gone` in all history: B3-RC2 REFUTED); `webContents.isResponsive()` (**the API does not exist** in Electron 43.6.0); SIGTERM handlers and `detached` flags as orphan fixes (Electron already maps SIGTERM to `app.quit()`; B3-RC5 verifier experiment).

### 1.8 What is already right (RETAIN; do not re-litigate)

Renderer hardening and the allowlisted preload; zod validation with real bounds; near-total sender validation; `boot-sentinel.ts`; atomic `writeSaved`; the two brain write-serialization lanes (`updateIndex`, `withEntityLock`); the circuit-breaker, hedge and exhaustion stack in `llm/` (pure functions); single-flight, generation-guarded `local-runtime` with an idle stop; the per-credential secret stores; the egress guard; the hash-chained audit log; the dependency-injected engines (`screen-preprocess`, `foreground-watcher`); the modular `intelligence/` sub-app; the `vad.ts` `.toString()` transplant pattern; the bug-ledger gate; the type-error ratchet; CI cost gates; the Operator generated-bundle drift gate; and the nine recap layouts (MASTER §30.1).

---

## 2. Target architecture for 2.0

### 2.1 Principles (each traceable to evidence)

| # | Principle | Why (evidence) |
|---|---|---|
| P1 | **Kill-safe first.** Any process may die at any instant. Owned children die with it, acknowledged user data survives, and the next boot is calm. Crash recovery is the tested normal path. | Force-quit is the dominant real exit (8 starts on 09-25, no clean-shutdown marker); orphans are CONFIRMED |
| P2 | **The main event loop is sacred.** No blocking I/O against user-content roots, no unbounded CPU. Stalls are detected after the fact and attributed. | Spindump-verified main stalls |
| P3 | **One owner per cross-cutting concern.** Spawning goes through the supervisor, meetings-root I/O through the gateway, background timers through the scheduler, and reveal/recover through the controller. | Duplicated kill lists (L01 F6), 5 unaligned backfill callers (B2-F2), 5 reveal paths (B1 verifier) |
| P4 | **Modular monolith.** Vertical feature modules with explicit public APIs, no new network hops on the desktop, and new processes only through the admission contract (§2.7). | SAE 05/19; MASTER §30.1 "no new agent framework, vector DB, second credential store …" |
| P5 | **Contracts are code.** Runtime-validated schemas, zod-free channel constants, and golden fixtures shared with Swift. Enforcement is derived from one source. | L08 F1–F3 drift |
| P6 | **Model output never grants authority.** The command session, policy and approval live in trusted main or native code. Jev/Laya/Hindsight propose; the host verifies. | MASTER §3.3, §4, §10.2, §35.2; SAE 36 |
| P7 | **Organizational secrets and shared knowledge are server-side.** The desktop holds device credentials only. | D07, D13, SRC-07/08/09 |
| P8 | **Measure, don't assert.** Every closure needs packaged-artifact evidence, and readiness uses Stark levels. | ChatGPT §5 ("false closure" is the biggest program risk) |

### 2.2 Desktop container view (target)

```text
┌──────────────────────────── Electron main (composition root: index.ts ≤ 300 LOC) ─────────────────────────────┐
│ app/        AppContext (explicit deps), bootstrap sequence, single-instance, boot sentinel, session markers       │
│ lifecycle/  quit-flow · reveal-or-recover controller · renderer health (generations) · journal recovery hook      │
│ windows/    overlay presenter (park/reveal geometry) · intelligence · decoder · pdf  (only place for BrowserWindow)│
│ ipc/        security.ts (guards) · register.ts (typed registerHandler: channel+schema+guard) · per-feature wiring   │
│ features/   history · meetings · journal · notes · brain · import · speech · capture/audio-broker · command ·      │
│             decision · actions · settings · licensing · operator · integrations(dust,mcp,graph) · local-ai ·        │
│             updates · onboarding · memory(client) · intelligence(bridge)                                          │
│ infra/      process(supervisor, registry, reaper) · storage(gateway, paths, meetings index, ledger) · scheduler ·   │
│             observability(audit log, events, stall monitor, metrics) · secrets · net(egress, proxy) · platform     │
└───────▲───────────────▲─────────────────────────────▲───────────────────────────────▲───────────────────────────┘
        │ preload (typed api from shared/contracts; channels.ts is zod-free)          │ supervised children
 ┌──────┴───────┐  ┌────┴───────────┐  ┌──────────────┴──────┐        ┌────────────────┴──────────────────────────┐
 │ overlay      │  │ intelligence   │  │ decoder (hidden)    │        │ mac: mac-helper `supervise` → llama-server,│
 │ renderer     │  │ renderer       │  │ renderer            │        │      fm serve, watch-frontmost, ffmpeg     │
 │ app/features │  │ (existing      │  │                     │        │ win: libuv job (ASSUMED) or supervise.exe  │
 │ /ui          │  │  workspace)    │  │                     │        │ utilityProcess ASR/embedding (Chromium)    │
 └──────────────┘  └────────────────┘  └─────────────────────┘        └────────────────────────────────────────────┘
 Local stores (userData): settings · audit log · journal/ · index/meetings-index · index/ingest-ledger · run/ (session, sidecars)
 User knowledge (meetings root, possibly OneDrive): *.md meetings · .brain entities/graph/corrections · wiki/ projection
```

### 2.3 Code layout and dependency rules (enforced by FF-01…FF-03)

```text
src/main/{index.ts, app/, lifecycle/, windows/, ipc/, features/<name>/{index.ts (public API), ipc.ts, *.ts}, infra/<name>/}
src/preload/{api.ts, index.ts (contextBridge only), intelligence.ts, import-decoder.ts}
src/renderer/src/{app/, features/<name>/, ui/, lib/}
src/shared/contracts/{channels.ts, <domain>/schema.ts, <domain>/__fixtures__/golden/*.json, index.ts}
src/shared/domain/<pure logic, moved lazily: vad, grounding, prompts, …>
```

| From → To | Allowed |
|---|---|
| renderer → | `shared/*` only (no `main`, no `preload` internals) |
| preload → | `shared/contracts/channels.ts`, `shared/contracts/*` types, electron |
| shared/contracts → | `zod` only |
| main/infra → | `shared/*`, other `infra` (acyclic); never `features/*` |
| main/features/X → | `infra/*`, `shared/*`, **`features/Y/index.ts` only** (public API; no deep imports) |
| main/ipc → | `features/*/ipc.ts`, `ipc/security.ts`, `shared/contracts` |
| main/app, lifecycle, windows → | anything in main (composition layer), but only through public APIs |
| tests → | same rules as production, except explicit fixture helpers |

`AppContext` is a plain object built in `app/` (window accessors, settings store, audit logger, supervisor, gateway, scheduler, clock). It is passed explicitly to `register(ctx)` functions. It is **not** a DI container and **not** an event bus (PROPOSED; SAE 05: "an interface where change pressure exists, not because a diagram says hexagonal").

### 2.4 Component designs

#### C1. Process supervisor (sidecar ownership)

**Contract.** `supervisor.spawn({name, cmd, args, env, stdio, ownership:'owned'|'command'}) → SupervisedChild`. It is the only spawn entry point (FF-10). Guarantees (PROPOSED acceptance targets):

- (a) After main dies by any means, owned sidecars and their descendants exit within **5 s**.
- (b) `stopAll()` is one ordered list used by `will-quit`, the hard-exit path **and** the `onFatal` relaunch path. This fixes the ffmpeg gap and the `app.exit` gap.
- (c) It never kills a process it cannot prove it owns.

**macOS: guardian as a mode of the existing `mac-helper`** (PROPOSED; the helper already ships, is arch-checked in CI and is "designed to plug into existing main-process seams"). `mac-helper supervise --parent <mainPid> -- <cmd…>`:
1. `setpgid(0,0)` inside the wrapper, so the wrapper and its sidecar form one process group and pgid = wrapper pid. Main spawns the wrapper **without** `detached` (the wrapper owns its group; this matches M2-0026's rule of no `detached` flags).
2. `posix_spawn` the sidecar, which inherits the wrapper's stdout/stderr file descriptors directly. There is no re-buffering, so `local-runtime`'s port-line parsing is unchanged.
3. `kqueue EVFILT_PROC NOTE_EXIT` on `mainPid`. Immediately after arming, check `getppid() == mainPid`, which closes the race where main dies before the kqueue is armed.
4. When main exits: `killpg(SIGTERM)`, wait 2 s, `killpg(SIGKILL)`, exit. When the sidecar exits: exit with its status, so the existing exit handlers keep working. SIGTERM and SIGINT are forwarded.
5. `stop()` in `local-runtime`/`fm-runtime` becomes `process.kill(-pgid, 'SIGKILL')`. Killing only the wrapper would orphan the child, so this change is mandatory.

No pipe is shared with sidecars, so a descendant cannot hold a writer open and suppress EOF (ChatGPT fix 4). The wrapper can only signal its own process group, which makes PID reuse impossible: the wrapper is the sidecar's parent and holds it until reaped.

**Windows.** libuv puts every non-detached `uv_spawn` child into a global job with `KILL_ON_JOB_CLOSE`, created suspended and resumed after assignment. It also sets `SILENT_BREAKAWAY_OK`, so **grandchildren escape the job**. This is **ASSUMED** from libuv source knowledge and not verified against Electron 43's bundled libuv. Verification: the Windows hard-kill test HK-W. If direct children die and no owned sidecar has children that matter (for example `llama-server.exe` and the PowerShell watcher, which are spawned directly), **no new Windows component is built**. If the test fails, or descendants matter (for example cmd shims), add a `supervise.exe` with the same CLI contract. It would create a private job without breakaway, use `PROC_THREAD_ATTRIBUTE_JOB_LIST`, and exit when the parent handle is signalled, which closes the job and kills the tree. Note that this binary would also need signing, and Windows signing is itself blocked.

**utilityProcess hosts** stay Chromium-owned. They are reaped on macOS (PROVIDED); on Windows this is UNKNOWN. They are included in every hard-kill census and never assumed.

**Identity-safe registry (fallback net).** Each session writes only its own append-only file, `userData/run/sidecars-<sessionId>.json`, so no cross-process lock is needed. Every entry records a before-spawn intent and then `{name, pid, pgid, osStartTime, exeRealpath, argsFingerprint}`. OS start time comes from mac-helper `proc_pidinfo` or Windows `GetProcessTimes`. The boot reaper runs while the single-instance lock is held. It kills an entry only when **pid alive ∧ start time equal ∧ exe realpath equal**. Corrupt or ambiguous entries are logged (`sidecar.reap.skipped`), never killed. Resolved session files are then deleted.

**Legacy net** for pre-1.9.7 orphans, which have no registry. For `llama-server` only, a process is killed when all of these hold: exe realpath equals this bundle's `Resources/llama/.../llama-server`, args contain `-m <this userData>/local-llm/`, `ppid == 1`, and it started before the current main. Each kill is audited `sidecar.reaped{reason:'legacy-orphan'}`. The rule is never applied to `/usr/bin/fm` (a system binary other tools may run) and never matches by name alone.

**Failure behaviour.** If the wrapper is missing or fails to start, the sidecar is spawned directly, `sidecar.unsupervised` is audited and the registry still covers it. A feature flag `supervision=off` restores today's spawn exactly.

**Delivery.** One ordered `stopAll()` for every exit path including `onFatal` Relaunch (M2-0026, 1.9.7); registry + reaper + legacy rule (M2-0027, 1.9.7); `supervise` (M2-0028) ships default-on in 1.9.7 **only if HK-M passes 20/20 on the 1.9.7 candidate**, otherwise flag-off with the residual stated; Windows HK-W and `supervise.exe` decision (M2-0029, T1). `native/mac-helper/main.swift` changes land in the order M2-0027 → M2-0191 → M2-0192 → M2-0028 → M2-0084 through the merge queue (M2-0188).

#### C2. Reveal-or-recover controller (+ renderer health)

**One function, `reveal(reason, {focus})`,** is called by every entry point: macOS `activate` (reopen), `second-instance`, tray Show, the global hotkey, notification click, and the command wake surface. Today there are five divergent snippets (`index.ts:9410`, `:8785`, `:3472`, tray, hotkeys).

- **Presenter states:** `PARKED(hide|island|bar)`, `REVEALED`, `HIDDEN`. A reveal leaves the park state: it restores the interactive layout, cancels pending re-park, repairs off-screen bounds, disables click-through, and calls `showInactive()` (or `show()+focus()` if `focus` is set, which is the case for explicit user reopen). This fixes the OBSERVED hide-park no-op.
- **Owner decision needed.** The current code deliberately keeps Hide/Island parked on `activate` because first launch must not open Settings (comment at `index.ts:9413`). The controller distinguishes `boot-activate` from `os-reopen` by boot phase. PROPOSED: an explicit reopen reveals.
- **Renderer health states:** `STARTING(gen) → HEALTHY → SUSPECT → RECOVERING → HEALTHY | SAFE_MODE`.
  - Every `loadURL` or window recreation increments `rendererGeneration`.
  - The renderer sends `renderer:hello{gen, buildId}` after app initialization, not at `did-finish-load`.
  - It sends a `renderer:heartbeat{gen, seq}` every 2 s. With `backgroundThrottling:false` this is not throttled, and the cost is negligible.
  - Main sends `ping{gen, nonce}` and expects a `pong` within 1 s.
  - Acks from stale generations are ignored. A deliberate termination is tagged so its `render-process-gone` does not trigger a second recovery.
- **Recovery policy (PROPOSED; enabled only at m6, after C3 is proven):**
  - SUSPECT means no heartbeat for 6 s, or `unresponsive`.
  - Escalate after 10 s, or after 30 s while a capture session is active.
  - Recovery is `forcefullyCrashRenderer()` then reload. This API exists in Electron 43 (B1 verifier, `electron.d.ts:18129`); `isResponsive()` does not.
  - Success means `hello` for the new generation, the journal restored, and a `pong`. It does not mean `did-finish-load`.
  - Budget: 2 automatic recoveries per 10 min, then SAFE_MODE, which is a parented native `dialog.showMessageBox` (Reload / Quit / Open meetings folder / Copy diagnostics). Native dialogs work here, as the B1-RC1 verifier showed.
  - An active capture yields an explicit `capture.discontinuity{captureGeneration, fromTs, toTs}` and does not auto-resume. Whether to resume automatically is an owner decision.
  - This **supersedes** the `bank-grade-hardening.contract.test.ts:36–45` "no reload" pin through ADR-004. That pin existed because the transcript lived only in React state; C3 removes that reason.
- **1.9.7 specifics:** the tray gains a user-invoked "Restart Métis window", **disabled while capture is active** because 1.9.7 has no journal and the live transcript exists only in renderer state (M2-0036). The navigation guard (M2-0040, T1) calls `reveal()` and expands the overlay before showing its in-DOM sheet, because a modal inside the parked 8×2 window is invisible.
- **Out of scope for the controller:** a blocked *main* thread. No in-process timer can fix it (ChatGPT §3). That case is handled by prevention (C4, FF-05), detection (C9 stall events and the previous-session marker) and **kill-safety** (C1 + C3). Chromium's POSIX single-instance ACK timeout (20 s, SIGKILLs a hung holder; PROVIDED by the verifier follow-up) is left as is.

#### C3. Durable local journal (EVOLVE the autosave-draft mechanism)

- **Where:** `userData/journal/<sessionOrNoteId>/seg-<n>.jnl`, append-only, encrypted with the existing envelope. The journal moves **out of the OneDrive folder**. Records are `{seq, kind:'transcript-final'|'recap-rev'|'note-rev', revId, payload}`.
- **What:** final transcript lines (batched, at most every 2 s), recap editor revisions and keyboard-first note revisions (NK, EXP-02) after a 500 ms debounce, then fsync.
- **Acknowledgement:** the renderer shows "edited" vs "saved locally" from acks. Invariant: **zero loss of acknowledged revisions**; the exposure for unacknowledged keystrokes is at most about 1 s.
- **Lifecycle:** after a canonical save to the meetings root succeeds through C4, the segment is compacted and deleted. At boot, `recoverOrphanDrafts` logic, reused and not rewritten, promotes unfinished sessions. The journal is capped at 64 MiB and the oldest *completed* sessions are purged first.
- **Policy:** the journal **obeys the active retention profile** (MASTER §30.3: "crash recovery obeys the active retention policy instead of silently journaling raw transcripts"). Where local content retention is disallowed, the journal is off and C2 never auto-recovers; it asks instead.
- **Failure behaviour:** on a write failure (disk full) the UI shows "not saved locally", `journal.degraded` is audited and auto-recovery is disabled.

#### C4. Storage gateway (global admission control)

- **Scope:** the only module that may open, read, stat or list under the meetings root (FF-05b). It is async-only.
- **Admission (refined, ADR-021):** **one global cap** on in-flight meetings-root operations, content plus metadata, of at most *effective pool size − 2* (2 at the default pool of 4). `cloud-content` and `metadata` are priority lanes under that single cap, not separate budgets, because stat/readdir on a dataless File Provider directory may also block in the kernel (ASSUMED; M2-0008 records it). `local` (userData) is outside the cap. At least two pool threads therefore stay free for settings writes, audit appends, journal writes and `dns.lookup` whatever the cloud does. `app.started` records the effective `UV_THREADPOOL_SIZE` (M2-0006); ADR-021 decides, from measurement, whether to raise it (Info.plist `LSEnvironment` on macOS; set before first pool use on Windows).
- **Semantics:**
  - A permit is held until the OS operation **settles**. Deadlines release the *caller*, not the permit, because "a timeout is not cancellation" (ChatGPT fix 6).
  - When permits are exhausted the gateway returns `degraded` immediately instead of queueing without bound.
  - In-flight reads of the same file are shared (one promise per `(path, mtime, size)`).
  - A failure cache holds dataless or unavailable results for 60 s.
  - Superseded searches are cancelled at the queue level through an `AbortSignal`.
  - Classification is `ok | dataless | unavailable | timeout | corrupt | foreign-key | unknown` (`unknown` = the dataless probe failed; treated as cloud-only for list and search). Unavailable content is never a deleted meeting.
- **Dataless awareness (1.9.7, M2-0191):** list and search never hydrate. A batched mac-helper `stat-flags` query returns `SF_DATALESS` per path without opening files; Node's `fs.Stats` does not expose `st_flags`, and a `blocks==0` heuristic misreads APFS-compressed local files, so it is rejected. Windows placeholders (`FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS`, `RECALL_ON_OPEN`, `OFFLINE`) are read by attribute in one batched query per listing; the cost is UNKNOWN until measured on the managed Windows laptop, and if it is too slow placeholders are classified `unknown` and never read. A failed probe classifies `unknown`, which list/search treat as cloud-only. Only an explicit user open hydrates, one file at a time, with progress.
- **Proof (ST-1):** on the lane-built candidate, with at least six kernel-blocking FIFO fixtures placed as meeting and `.brain` files plus real dataless files on the QA cloud account: main p99 event-loop delay < 50 ms, no `app.stall` > 250 ms, and a userData settings write and a `dns.lookup` each complete in < 250 ms. ST-1-W runs on the Windows laptop with OneDrive placeholders.
- **Path safety:** paths come in as meeting IDs or relative paths, and the gateway checks realpath containment under the root. Resolution of the meetings root (`detectOneDrive`) moves into `infra/storage/paths.ts` and is **injected**; tests can never fall back to the real OneDrive folder (C13).
- **Conditional later (C10):** move content reads into a supervised `utilityProcess` storage worker **only if** ST-1 still shows a main stall over 250 ms or the settings-write / `dns.lookup` criterion fails. The trigger is automatic: a failed criterion puts C10 into the 1.9.7 closure. M2-0008 also records whether a kernel-blocked hydration can be interrupted at all, which bounds what C10 could achieve.
- **Migration order (verified path first):** gateway core (M2-0030) → every `.brain` and meetings-root reader reachable from main timers and IPC: the `brainStatus` handler, the 15 s boot block (`resumeBackfillIfPending`, `catchUpIntelligenceIndexIfNeeded`, `runConsolidationIfDue`), `requestBackfill` on History open, `runExtractionStage`, `recoverOrphanDrafts` (M2-0031) → History list/search with LRU and cancellation (M2-0193).

#### C5. Device-local meetings index and ingest ledger

- **Meetings index:** `userData/index/meetings-index` (envelope-encrypted JSON). Each entry is `{id, relPath, size, mtimeMs, title, date, durationMin, participantCount, availability, parseVersion, lastSeenAt}`.
  - **Write-through:** the app updates the index whenever it writes a meeting.
  - **Reconcile:** a metadata-only listing through C4 runs every 60 s while active and every 10 min while parked. Bodies are read only when `(size, mtime)` changes and the file is local.
  - **History** renders from the index alone, including "in OneDrive – not downloaded" rows. Proposed targets: p95 ≤ 300 ms, and a degraded view in ≤ 2 s.
  - **Search:** metadata search is instant. Full-text search streams local bodies through C4, with cancellation.
  - The index is derived and rebuildable; a corrupt index is rebuilt from a listing.
- **Ingest ledger:** moves from `.brain/index.json` (a synced folder, device-key encrypted, possibly dataless) to `userData/index/ingest-ledger` through expand → switch → contract (§4). The ledger is inherently **per-device** state. Entities, graph, corrections and wiki stay in the meetings root because they are knowledge, and knowledge placement is §17.3's decision.
- **Decrypt-failure taxonomy:** `unparseable` (really corrupt) is quarantined, keeping at most 5 snapshots. `foreign-key` or `keystore-unavailable` means the file is **not** touched and the ledger opens read-only, is audited `brain.ledger.foreign_key`, and is retried later. This removes the quarantine storm even if a foreign process runs.
- **No new heaviness loop:** while the ledger is foreign-key, keystore-unavailable, read-only or dataless, the scheduler suspends backfill, ingest, consolidation and the intelligence catch-up (`deferredReason: ledger_unavailable`) and never runs them against the in-memory empty index; data health shows the state (M2-0003, M2-0031, M2-0033). Two installs sharing one `.brain` flip the ownership stamp; neither quarantines nor re-ingests, and the remaining risk is a stated 1.9.7 residual until the ledger moves (M2-0205).
- **Tickets:** meetings index M2-0067 (m5); ledger expand/switch M2-0205 (m5); contract M2-0167 only after T1 has ≥ 14 owner-machine days, else 2.0.1.
- **Multi-device (ASSUMED impact):** two devices each ingest the same meeting. Entity merges must be idempotent by `(meetingId, sourceVersion)`. They are designed that way today but this is unverified; test BR-MD.
- **Simpler alternative rejected:** keep scanning the folder on each History open. The per-file `(mtime, size)` cache (OBSERVED, `recall.ts:117–165`) already makes repeat scans cheap, but the first scan and every change still touch cloud content from the History path, and the ledger's location alone reproduces the quarantine loop.

#### C6. Background-work scheduler (consolidates existing timers)

- **API:** `scheduler.register({kind, class:'interactive'|'user-visible'|'maintenance', needs:['localModel'|'network'|'storage'], cadence|trigger, singleFlightKey, retryPolicy, budget})`. Background, model-bound and network timers live only here (FF-14); UI timers such as cursor-watch and the stall monitor stay local (refined for simplicity, M2-0073).
- **Retry and exhaustion policy (one function for all callers)** (ChatGPT fix 5; B2-F2 corrected by the verifier to "every automatic caller clears exhaustion except reconcile"):
  - An **automatic resume** may continue genuinely interrupted eligible work.
  - **Maintenance** respects backoff and exhaustion.
  - **Only an explicit user Retry** resets exhaustion; that is the only code path allowed to call "unexhaust".
  - `unavailable`/`dataless` failures do **not** consume attempts; they wait for an availability change.
  - Completion identities are persisted in the ledger (existing `ingested[file]`), so a crash after completion does not duplicate work.
- **Model admission:** the local runtime stays single-flight (RETAIN `local-runtime.ts`). Maintenance may start it only if the user opted into local processing, never during the **120 s boot quiet period**, and never after an unclean previous shutdown until the first user interaction. At most **one model-bound maintenance job** runs at a time, and interactive requests pre-empt maintenance. There is no silent fallback from cloud to local (ChatGPT; D14).
- **Safe start:** the existing `earlyDeath` skip becomes one scheduler mode instead of an inline branch.

#### C7. `shared/contracts/*` (restructure; no runtime component)

- **Layout:** the L08 layout plus `command/`, `decision/`, `capability/`, `events/` for 2.0.
- **`channels.ts`** is zod-free, so the sandboxed preloads can import real constants (this fixes the L08 F3 chunk-split constraint).
- **`settings/server-authoritative.ts`** holds one `as const` key list. It drives both the `SettingsPatch` type and the runtime strip (fixes L08 F1).
- **The `@shared/ipc` barrel is kept** during migration, so there is zero call-site churn.
- **Golden fixtures:** each cross-platform schema carries `__fixtures__/golden/*.json` and `__fixtures__/negative/*.json`.
  - The vitest side runs `schema.safeParse` over every fixture.
  - `scripts/sync-contract-fixtures.mjs` mirrors the fixtures into `native-app/MetisKit/Tests/MetisKitTests/Fixtures/contracts/`, and a CI drift check fails on any difference.
  - The Swift side decodes every golden fixture and rejects every negative one.
  - The first fixture pins `speaker:"you"`, and the Swift side must choose between renaming the case and an explicit `CodingKeys` mapping (ADR-009).
- **JSON Schema generation** is deferred: zod is ^3.23.8, and adding `zod-to-json-schema` or moving to zod 4 is not needed while the fixtures already give parity.

#### C8. IPC registration layer

`registerHandler(channel, {schema, guard:'main'|'intelligence'|'decoder', handler})` lives in `main/ipc/register.ts`, and the guards move to `main/ipc/security.ts` as a pure move (L12 step 5). A handler without a schema or guard does not compile. A test enumerates `IPC.*` channels, registered handlers and preload exposures, and fails on dead channels (L08 F4 found 5) or on an exposure with no handler. `preload/index.ts` is split into `api.ts` plus a bootstrap, so all ~140 bindings can get behavioural wire tests (L08 F7).

#### C9. Observability (extend what exists)

The hash-chained audit log is retained for low-frequency lifecycle and security events. High-frequency operational signals go to an in-memory ring flushed every 5 min and at shutdown. Everything is content-free (§16.5): no titles, transcripts, paths or emails.

| Event | Fields | Purpose |
|---|---|---|
| `app.started` (extended) | `bootId, prevBootId, prevShutdown: clean\|unclean\|unknown, prevLastAliveAt, version, buildId, uvThreadpoolSize` | Replaces the non-evidence "no clean-shutdown between starts"; records the effective pool size for ADR-021 |
| `app.shutdown.clean` | `bootId, uptimeS, reason` | Written at the end of `will-quit` |
| `run/alive` marker | async rewrite every 10 s | The next boot can bound the length of the final stall |
| `app.stall` | `bootId, durationMs, phase?, timerKind?` | Post-hoc: a 1 s interval timer firing ≥ 1 s late, plus a `monitorEventLoopDelay` p99 summary every 5 min |
| `renderer.generation` / `renderer.health` | `gen, reason, state` | Makes "killed → unresponsive" sequences interpretable |
| `reveal` | `reason, presenterFrom, healthState, outcome, ms` | Proves the reopen fix |
| `sidecar.spawn/exit/reaped/unsupervised/reap.skipped` | `name, pid, pgid, sessionId, supervised, reason` | Proves ownership |
| `storage.summary` | per-class counts of `ok/dataless/unavailable/timeout/degraded`, p95 ms | Bounded (aggregated per minute) |
| `scheduler.job` | `kind, class, outcome, attempt, exhausted, deferredReason` | Proves the exhaustion policy |
| `app.crash` (fixed) | adds `fatal: boolean`; non-fatal kinds become `app.error.recovered` | B3-RC1 mislabel |
| `journal.ack/degraded/recovered` | `session, seq ranges` | C3 proof |
| `app.stall.sampled` | `bootId, stalledMs` (bundle path is userData-relative) | Written after the out-of-process sampler captured a stalled main (M2-0192) |

**Out-of-process stall sampler (M2-0192, ADR-023).** A mode of the existing mac-helper, `stall-watch --pid <main> --alive <path>`, runs as an owned sidecar, checks the `run/alive` marker every 5 s and, when it is more than 10 s stale, runs `/usr/bin/sample <pid> 5` once per stall (at most once per 10 minutes). The bundle keeps stacks and symbols only; home paths, user names and file names are redacted; at most 10 bundles are kept. Windows has no sampler; the next boot bounds the stall window from `prevLastAliveAt`. The tray's "Copy diagnostics summary" exports content-free counters so the owner can hand over closure evidence without devtools (M2-0006).

History requests carry a `requestId` through click → IPC → gateway → render, with timings per stage (ChatGPT action 1). The diagnostics runbook gives the no-devtools path for thread samples on macOS: `/usr/bin/sample <pid> 10` for both main and renderer PIDs, and it collects OS-generated `.spin`/`.hang` reports from `/Library/Logs/DiagnosticReports` into the content-free support bundle, with user consent. No new telemetry vendor is added (see §2.7, C9 alternatives).

#### C10. Security boundaries (target)

| # | Boundary | Target control | Change vs today |
|---|---|---|---|
| SB1 | Renderer ↔ main | RETAIN sandbox, contextIsolation and allowlist; typed preload generated from contracts; typed registration (C8) | Guards and schemas become mandatory by type (FF-09) |
| SB2 | Settings authority | One `SERVER_AUTHORITATIVE_SETTINGS_KEYS` drives the type and the strip (FF-13); licensing precedence decided by ADR-016 | Removes three unlinked arrays |
| SB3 | Command authority | The main-owned command session and capture generation (§4.2) is the only source of action authority. The renderer is a capture device and view. Approvals are bound to exact action, target, snapshot and expiry. | New (§2.5) |
| SB4 | Sidecars | Supervisor kills only its own groups; per-session keys (llama); `fm serve` loopback accepted under the same-user threat model, idle-stopped | Adds OS-level ownership |
| SB5 | File system | Gateway realpath containment; journal, index and ledger in userData under the envelope; foreign-key never resets; plaintext wiki only through explicit, audience-visible sharing (§17.2) | Adds admission and taxonomy |
| SB6 | Secrets | RETAIN per-family stores; **no org keys on the device** (speech through Operator session broker; SRC-07/08/09); build-time provisioned-secret check for every embedded credential family (L05) | Closes SRC-07/08/09 |
| SB7 | Network | RETAIN egress guard; per-profile allowlists; TLS verification never disabled (§30.3) | — |
| SB8 | Desktop ↔ Operator | RETAIN HMAC, nonce and skew; add a staging Worker/D1; resolve the off-main ACCESS-bypass build (owner) | Owner decision |
| SB9 | Server plane | Entra-validated APIs; tenant/principal-scoped memory; Operator stores metadata only (§16.6); Hindsight is a derived store with approved retention (§35.1) | New, BLOCKED |
| SB10 | Dev/test ↔ user data | Hermetic test harness (C13/FF-12); production foreign-key guard (C5) | New |
| SB11 | Supply chain | SHA-pinned actions, `permissions:` blocks, docs secret scan, Swift CI, SBOM (L11/L10) | m4 |

### 2.5 How 2.0 features attach

| Feature (kit IDs) | Desktop attachment | Contracts | Server side | Trust notes | Milestone / status |
|---|---|---|---|---|---|
| **Command session + voice/orb/bar** (MASTER §4–6, M2-CMD, CXSTEP/CXAC) | `features/command` owns the §4.2 state machine (OFF…CANCELLED) with a monotonic session and capture generation. `features/capture/audio-broker` owns capture authority: the renderer's `getUserMedia` stream is accepted only for a session main opened (wake event or trusted gesture), and frames from stale generations are dropped. The wake detector runs on-device in a utilityProcess, opt-in (§4.1). The renderer (`features/bar`) renders the orb, beam and glow from a sanitized scalar level (§6.1). | `contracts/command`, `contracts/capability` (Swift mirror) | Operator speech session broker (no device token) | Local Stop p95 ≤ 100 ms; remote stop is a separate acknowledgement (§4.5) | m6; the capture-owner choice (renderer device vs native helper) is ADR-015 with a spike |
| **HeyClicky verified actions** (CXCAP, HC) | `features/actions`: capability registry filtered by platform and permission before any model call; adapters (native, browser, MCP); postcondition verifier; typed result `attempted/verified/failed/cancelled/unsupported/unknown` (§3.3); receipts through C9 and Operator (metadata) | `contracts/capability`, `contracts/action-result` | Receipts ledger in Operator | Never a broad `exec` tool (§1.3); graceful close before force (§4.4) | m6 |
| **Jev / Laya decision service** (§10, M2-DEC, JVSTEP/JVAC) | `features/decision`: a `DecisionProvider` interface with `Deterministic` (local) and `Operator` (HTTP to `/v1/decide`). Applies a result only if the generation, snapshot, target and policy are still current (§10.2). This closes SRC-03, the "void result". | `contracts/decision` (`metis.decision.v1`) | **Operator `/v1/decide`** routes to the Jev vendor API (secret in the Operator vault) or a hosted **Laya service** (Python/Torch container, §10.3). No silent vendor fallback. | The desktop never holds vendor keys (D07) | Operator route m8 (engineering); Laya BLOCKED on vendor/hosting (K02/K04) |
| **Hindsight memory** (§35, HM/HMUC/HMSTEP, HSAC, v6 upstream binding) | `features/memory`: a thin client of the Métis knowledge+memory API. Recall only when the request needs prior context (§35.6); a bounded evidence packet; failure degrades to "memory unavailable" and never blocks Stop, capture or notes | `contracts/memory` | **Knowledge+memory service** on the approved container platform with managed Postgres and a vector extension. Hindsight API/worker is private (self-hosted, not Vectorize Cloud by default). Operator stores metadata and purge ledger only. | A derived store with approved retention, region and keys (§35.1); tenant/principal scoping in the gateway (SAE 20/41) | m8 engineering against a local compose profile; LIVE BLOCKED: upstream identity unpinned (HMSTEP-01), hosting/region/Postgres not approved |
| **Mantu Intelligence** (§17, TASK-035–041) | RETAIN the `intelligence/` sub-app and sandboxed window; brain IPC through C8; `publish.ts` exporter retained | `contracts/knowledge` | Entra-protected **knowledge API** in the same service (§17.3 state (a)) over the approved M365 location; Dust via remote MCP `knowledge.search/get/propose_update/commit_change` with CAS and idempotency | The authority hierarchy of §17.1; generated pages are never write targets (§17.2) | m8; BLOCKED on TASK-007 canonical store decision + Entra |
| **Operator / identity / usage** (§12–13, TASK-034/045) | `features/operator` (client, queue), `features/licensing` (ADR-016 precedence) | `contracts/operator`, `contracts/usage` | RETAIN the Worker + D1; targeted fixes only (MCP gateway route, rate limiting and nonce atomicity, `/v1/decide`); staging environment | Metadata-only ledger (D10, D13) | m9 |
| **Teams** (§15, TASK-046–052) | None beyond the knowledge client. Local actions still need local session authority (§3.1.1). | `contracts/meeting-occurrence` | Teams personal tab/panel + join coordinator (Entra) + **Azure/.NET media receiver** (separate deployable) | Explicit enrollment; no lobby bypass (D21) | BLOCKED (Entra/Teams/Azure); engineering behind flags m9 |
| **Keyboard-first notes** (v4/v5 NK/NKAC, EXP-02) | `features/notes` on top of **C3** (every acknowledged note revision is durable); global show/hide shortcut via the reveal controller | `contracts/notes` | Canonical store per §17 | Human notes are never overwritten by generation (EXP-02) | m6 |
| **Onboarding / install / update** (§14, §34, OBU, TASK-021–027) | `features/onboarding` retains the existing scene order (LESSON-010); one **capability manifest** governs build, install, readiness and the optional model catalog (§30.2 checkpoint 5); no hidden first-run model transfer (D04/D12) | `contracts/capability` | R2 immutable components (§3.1) | Windows publish independent of Mac (§20.5; fix `release.yml` `needs`) | m10 |

### 2.6 Server and cloud plane (infrastructure fit)

| Workload | Posture | Binding status (SAE 30) | Blocker / unblock step |
|---|---|---|---|
| Operator control plane (device API, admin, ledger, `/v1/decide` router, speech session broker) | **RETAIN** Cloudflare Worker + D1 | NATIVE (existing) | Create the staging Worker/D1 (`wrangler.jsonc:51` placeholder); owner decides on the off-main ACCESS-bypass commits |
| Knowledge API + Hindsight memory + (optionally) Laya | **AUGMENT**: one approved container platform, separate services, managed Postgres + vector | UNKNOWN (no platform, region or keys approved) | Tony approves the hosting boundary, region and managed Postgres (K09 open decision); pins the Hindsight release/commit/schema (HMSTEP-01) |
| Laya decision runtime | AUGMENT (container, Python/Torch; not a Worker, §10.3) | UNKNOWN | Vendor/hosting relationship + checkpoint licence review |
| Teams media receiver | AUGMENT (Azure/.NET) | EXTERNAL, BLOCKED | Entra tenant admin consent, Teams admin approval, Azure subscription + calling-media approval |
| License server | RETAIN, pending ADR-016 (deprecate vs keep) | NATIVE | Owner answers C-16 (entitlement authority) |

Do-not-build on the server: no Neo4j, no second canonical knowledge database, no queue broker. Metadata job tables are enough until measured (SAE 13), and hosted Vectorize Cloud needs its own commercial decision.

### 2.7 Component admission register

Every new or changed runtime component names its requirement, the simpler alternative and why it is insufficient, its owner, its failure behaviour and its exit path (SAE §5). "Owner" is the engineering module owner. The human operational owner is **Tony** (PROVIDED, program owner) unless he delegates, and is UNKNOWN for server services until he names one.

| ID | Component | Decision | Requirement / evidence | Simpler alternative → why insufficient | Owner | Failure / overload behaviour | Exit / rollback |
|---|---|---|---|---|---|---|---|
| C1 | Supervisor (`mac-helper supervise` mode, `SidecarRegistry`, reaper) | ADD (mode in existing binary, one JS module) | B2-F1 CONFIRMED; 3.1 GB orphans; MASTER §7 memory goals | (a) Boot reaper only: the machine stays heavy until next launch, it cannot cover descendants, and it risks PID reuse. (b) Improve the JS quit lists: never runs on SIGKILL or a native crash. | Lifecycle module (integrator) | Wrapper unavailable → direct spawn + `sidecar.unsupervised` + registry net; ambiguous registry entry → skip and log, never kill | Flag `supervision=off` restores today's spawn exactly |
| C2 | Reveal-or-recover controller | ADD (replaces 5 ad hoc paths; net deletion) | Owner bug #2; hide-park no-op (verifier); ChatGPT fixes 2–3 | (a) Patch `activate` only: the other entry points keep diverging. (b) `isResponsive()`: does not exist. | Lifecycle module | Controller error → legacy `showInactive()` + audit; recovery budget exceeded → SAFE_MODE dialog | Flag `reveal=legacy`; auto-recovery flag off by default until m6 |
| C3 | Local journal | EVOLVE autosave-draft (relocate + finer grain + acks) | Zero loss of acknowledged revisions (ChatGPT); the reason for B1-RC2's pin; EXP-02 | (a) The 60 s autosave into the OneDrive folder loses up to 60 s and churns sync. (b) Save-on-quit does not run on kill. | Meetings/notes module | Write failure → "not saved locally", auto-recovery disabled; retention-disallowed profile → journal off | Dual-write for one release; flag to the folder-draft path |
| C4 | Storage gateway | ADD module (in-process) | Spindump-verified main stalls; dataless files OBSERVED; ChatGPT fix 6 | (a) Per-call concurrency caps: not global, and every keystroke spawns a pool. (b) `Promise.race` timeouts: not cancellation, and permits leak. | Storage infra | Permits exhausted → `degraded` result + explicit unavailable rows; never blocks main | Limits are tunable; bypass flag to direct async fs (still off-main) |
| C5 | Meetings index + device ledger | ADD (derived index) / MOVE (ledger) | History must not hydrate cloud content; 180 quarantines; ChatGPT "local index" | (a) Scan the folder per open: touches cloud content and is O(n) on change. (b) Keep the ledger in the synced folder: foreign-key quarantines and dataless ledger reads. | Storage infra + brain | Corrupt index → rebuild from listing; foreign-key ledger → read-only, no reset | Index is deletable (derived); ledger keeps reading the legacy file until contract |
| C6 | Scheduler | CONSOLIDATE existing timers | B2-F2 across 4+ callers; boot storm; §7.1 interactive priority | Patch each caller: this is exactly how the policy drifted | Scheduler infra | Job throws → isolated backoff; scheduler disabled → no background work, core app unaffected | Flag `scheduler=legacy` during migration |
| C7 | Contracts package | RESTRUCTURE (build-time) | TASK-005; L08 F1–F3; TS/Swift drift | Keep `ipc.ts`: drift continues | Integrator (single owner of shared schemas, §30.2) | Compile/test time only | Barrel keeps `@shared/ipc` |
| C8 | Typed IPC registration | ADD thin module | 164 handlers; guards by convention | Status quo | Integrator | Schema reject → typed error to caller | None needed |
| C9 | Observability additions | EXTEND audit log + in-memory ring | Hypotheses cannot be told apart; missing clean-shutdown marker | Add a telemetry SDK/vendor: new processor, §16.5 privacy review, cost | Observability infra | Logging failure never blocks; high-frequency data aggregated | Event types are additive |
| C10 | Storage worker (`utilityProcess`) | **DEFER** (automatic trigger) | Only if ST-1 shows a main stall > 250 ms or the settings-write / `dns.lookup` < 250 ms criterion fails | C4 in-process | — | — | Not built unless triggered |
| C11 | Knowledge + memory service | ADD (server) | §17.3, §35, HM-*, HMUC | A device-only file memory fails "available while laptop sleeps" and Dust/Teams access | UNKNOWN (Tony to name) | Outage → memory/knowledge features unavailable; capture, Stop and notes unaffected | Disable the capability; the derived projection can be deleted, canonical records are unaffected |
| C12 | Operator `/v1/decide` + Laya service | ADD route + ADD service | §10, M2-DEC-01/02, SRC-03 | The desktop calling vendors directly violates D07 | Operator owner / UNKNOWN (Laya) | Deterministic path or an actionable "unavailable"; never a silent vendor switch | Capability switch off per task (§10.6) |
| C13 | Hermetic test harness + OS-level isolation | ADD (test infra) | Quarantines caused by tests (09-26, twice) | Tell agents not to run tests: unenforceable; in-process tripwire alone: child processes, swift test, license-server and wrangler bypass it | Integrator | Test touching a real path → hard fail; CI honeypot touch → job fails; owner-account runs only under the OS sandbox profile | None (permanent) |
| C14 | Fitness tooling (`dependency-cruiser` + `check-architecture.mjs` + `verify-move.mjs`) | ADD (dev only) | §3 | ESLint alone: cannot ratchet file growth, and graph rules are weaker | Integrator | CI fail with the exact rule + file | Remove the CI step |
| C15 | Stall sampler (`mac-helper stall-watch`) | EXTEND existing binary (a mode, not a new process type) | A blocked main cannot report itself; B1 closure needs attribution (M2-0199) | In-process `app.stall` only: silent during the stall it should explain | Observability infra | Marker unreadable or sampler failing → no bundle, audited; never signals main | Flag `diagnostics.stall_sampler=off` |
| C16 | Build-once candidate lane (`qa-candidate.yml`, `promote-candidate.yml`) | ADD (CI) | `release.yml` refuses macOS without Developer ID, refuses unsigned Windows, couples both jobs and rebuilds from the tag | Push a tag: produces no release and a different build | Release owner (Opus) | Promotion refuses bytes without a passing evidence record | Remove workflows; release.yml unchanged |

### 2.8 Quantitative model and budgets

| Quantity | Observed / provided | Target (PROPOSED unless noted) | Measurement |
|---|---|---|---|
| Orphaned sidecar memory | 2 × ≈3,124 MB phys_footprint (OBSERVED) | 0 owned processes alive 5 s after main death | Hard-kill census, 20 cycles per OS (ChatGPT §6) |
| Main-thread stalls | 45.75 s, 85.55 s (spindumps); ~5 m 24 s (log gap) (OBSERVED) | History list/search p99 event-loop delay < 50 ms; no unexplained stall > 250 ms | `monitorEventLoopDelay` + `app.stall` under the dataless fixture |
| History open | 59 files; cold list 8 ms at N=59, 27 ms at N=500 (verifier benchmark, OBSERVED) | Index view p95 ≤ 300 ms; degraded view ≤ 2 s when sources fail; input ack ≤ 100 ms | `requestId` stage timings |
| libuv pool | 4 threads default (ASSUMED: `UV_THREADPOOL_SIZE` unset) | ≤ pool − 2 in-flight meetings-root operations; settings write and `dns.lookup` < 250 ms with six blocked FIFOs | Gateway permit metrics; ST-1; `app.started.uvThreadpoolSize` |
| Hidden idle CPU | Unmeasured | ≤ 1 % of one logical CPU over 5 min, whole attributable population (MASTER §7), i.e. ≤ 3 CPU-s per 300 s | CPU-time deltas (ChatGPT formula) |
| Cloud-first idle memory | main 125 MB + renderer 100 MB RSS (ps, OBSERVED, compression caveat) | ≤ 350 MiB Windows process tree (MASTER §7). **Electron-Mac accounting contract UNKNOWN**: define it as the phys_footprint sum over main, helpers and owned sidecars, plus an RSS series (ChatGPT fix 7) | Census at cold, settled idle, first inference, active transcription, post-meeting, post-recovery |
| Boot background work | Local LLM tta 29–41 s at +15 s after boot (OBSERVED) | No maintenance model start in the first 120 s or after an unclean shutdown until first interaction | `scheduler.job` events |
| Journal I/O | n/a | ≤ 1 fsync per 500 ms of editing, transcript batch ≤ 2 s; ≤ 64 MiB | Journal metrics |
| Renderer heartbeat | n/a | 0.5 msg/s | Negligible |
| Reveal latency | n/a | Healthy reveal to interactive frame p95 ≤ 150 ms (aligned to §7 wake → frame) | `reveal.ms` |
| Regression between builds | n/a | No > 10 % regression in CPU-seconds/300 s or phys_footprint sum per state vs the 1.9.7 baseline; no §7 breach | Resource regression gate on every train (M2-0200) |
| Owner-machine stability | 3 natural freezes in 2 days (OBSERVED) | 10 working days with zero `app.stall` > 5 s, zero orphans after unclean exits, zero reveal no-ops | Owner-bug closure gate (M2-0199) |

### 2.9 Non-goals and the do-not-build list (desktop)

No rewrite or framework switch. No state-management library for `App.tsx` (hooks and a minimal context suffice). No DI container or event bus. No desktop database. SQLite for the index is a conditional-later option, triggered by more than 10,000 meetings or p95 search above 300 ms with the JSON index. No vector or graph database on the desktop, no second credential store, no duplicate microphone owner, no local graph runtime (§30.1). No bundling of optional models (D04). No automatic killing of a stalled *main*: the risk to a live meeting is too high, so kill-safety comes instead from C1 and C3. No generic "reap by name". No storage worker process until C10's trigger fires. Native Mac (SwiftUI, D02) proceeds in `native-app/` and shares contracts through fixtures. The Electron Mac product stays stable until a qualified migration.

---

## 3. Architecture fitness functions (CI-enforceable)

**Implementation (ADR-011).**
- **`dependency-cruiser`** (one devDependency; `.dependency-cruiser.cjs` reads the tsconfig aliases) handles the graph rules. Its known-violations baseline (`depcruise-baseline`, `--ignore-known`) is a native ratchet.
- **`scripts/check-architecture.mjs`** uses the TypeScript compiler API. `typescript` is already a dependency, so there is no new one. It keeps a `scripts/architecture-baseline.json` whose counts can only go down: if a count goes up the check fails, and if it goes down without updating the baseline it also fails. This mirrors the house pattern of `check-test-types.mjs`, and ADR-011 explains why ESLint's `max-lines` + suppressions cannot catch a 9,519-line file growing further.
- Both run in the `quality` job on ubuntu. **In m4 they run report-only for 3 days, then as a ratchet.**

| ID | Rule | Tool | Mode | Baseline at 2bf21f1c | Target |
|---|---|---|---|---|---|
| FF-01 | Layering (§2.3 table): renderer ↛ main; shared ↛ main/renderer; preload ↛ anything but `shared/contracts` + electron; `infra` ↛ `features`; `features/X` ↛ `features/Y` internals (only `features/Y/index.ts`); contracts ↛ anything but zod | depcruise | **Hard fail** for production code | 0 production violations (L12); 2 test-only crossings (`onboarding-kinetic-grid.test.ts`, `hash.test.ts`) | 0, including tests, by m5 |
| FF-02 | No import cycles | depcruise `no-circular` | Ratchet | 2 (L12 Cycles 1, 2) | 0 by m5 |
| FF-03 | No orphan modules (reachability from real entry points incl. electron-vite inputs, worker URLs) | depcruise `no-orphans` | Ratchet (warn) | 15 confirmed dead (L12) | 0 by m5 (delete or wire; decide command-mic F4) |
| FF-04 | File size: non-generated, non-test source ≤ **800 LOC**; files over the limit have a per-file ceiling that can only fall | check-architecture | New files hard fail; existing ratchet | 21 files > 800 (L12) | `main/index.ts` ≤ 2,000 by m5 end, ≤ 300 by m10; `Settings.tsx` ≤ 800 by m6; `registerIpc` gone by m5 |
| FF-05a | No synchronous fs (`*Sync(`) in `src/main` outside an allowlist (boot settings read, sentinel, crash writer, audit logger until C9 moves it) | check-architecture | Ratchet per file | **481 calls / 53 files** (OBSERVED) | ≤ allowlist only by m10 |
| FF-05b | **No `node:fs` import at all** in modules that handle meetings-root content; only `infra/storage/*` may touch the meetings root | depcruise (path rule) + check-architecture (call sites) | **Hard fail** from m3 for History/recall/ingest/store paths; for 1.9.7 a test fails on any new `*Sync` call under the meetings root anywhere in `src/main`, seeded by the M2-0031 inventory | `transcripts.ts` 41, `brain/store.ts` 25, `brain/ingest.ts` 18, `recall.ts`, `graphify.ts`, `publish.ts` (OBSERVED) | 0 outside the gateway by m5 |
| FF-06 | No `window.confirm/alert/prompt` (incl. bare, aliased or computed access, detected by AST not grep; ChatGPT fix 1) in `src/renderer`, `intelligence/src`; first shipped as M2-0040's own AST test, then adopted by check-architecture | check-architecture | New hard fail; ratchet | **9** (OBSERVED: App.tsx ×6, Review.tsx ×1, Settings.tsx ×2) | 0 by m5 (async navigation-guard service with Save/Discard/Cancel; Cancel preserves the recap) |
| FF-07 | No source-text contract tests: a test may not read a `src/**/*.ts(x)` file as text (`readFileSync`/`readFile` with a source path) unless the path is under `__fixtures__` | check-architecture | New hard fail; per-file ratchet | 51 test files read `index.ts` (OBSERVED); full baseline generated at m4 | Converted domain by domain as features are extracted (§4) |
| FF-08 | Contract/golden parity: each cross-platform schema has ≥ 1 golden + ≥ 1 negative fixture; vitest parses all; MetisKit decodes all; fixture mirror has no drift; preloads import `channels.ts` (no literals) | vitest + `swift test` job + sync script `git diff --exit-code` | Hard fail | 0 fixtures; the `you`/`me` drift exists | All cross-platform schemas by m6 |
| FF-09 | IPC: no `ipcMain.handle/on` outside `main/ipc/`; every registration has schema + guard (type-level); `IPC.*` ↔ handlers ↔ preload exposures have no dead or unhandled entries | check-architecture + unit test | Hard fail for new; ratchet | 164 in `index.ts`; 5 dead channels (L08 F4) | 0 outside `main/ipc` by m5 |
| FF-10 | Process chokepoint: `child_process` / `utilityProcess` only in `main/infra/process/*` | depcruise | Ratchet | 17 importer files + 4 fork sites (OBSERVED) | 1 directory by m5 |
| FF-11 | `new BrowserWindow` only in `main/windows/*`; a behavioural test over the factory asserts `sandbox:true, contextIsolation:true, nodeIntegration:false, webSecurity:true` | check-architecture + unit test | Hard fail | 4 sites (OBSERVED) | 1 directory by m5 |
| FF-12 | Hermetic tests: vitest `globalSetup` sets `HOME/USERPROFILE/APPDATA/LOCALAPPDATA/XDG_*` and the electron mock's `userData`/`documents` to a per-run `mkdtemp`. An fs guard throws on any path under the real home, `~/Library/CloudStorage`, `OneDrive*` or the real userData. `detectOneDrive` returns null under test. A canary test proves the guard fires. | vitest setup + canary | Hard fail, local and CI | None today; mock hard-codes `/tmp/asktoto-*` (L11) | m3 (prerequisite to running any test on Tony's Mac); reuse the reviewed MQA-348 work from `metis-r11-work` |
| FF-13 | Settings authority: `SettingsPatch` excludes every server-authoritative key; the runtime strip iterates the same constant; a test asserts the union covers all schema fields annotated authoritative | tsc + unit test | Hard fail | Three unlinked arrays (L08 F1) | m5 |
| FF-14 | No `setInterval` / recurring `setTimeout` for background, model-bound or network work outside `infra/scheduler` (UI timers such as cursor-watch and the stall monitor are allowlisted) | check-architecture | Ratchet | 7 files (OBSERVED) | 1 by m6 |
| FF-15 | Skipped-test ratchet actually runs (`check:skips` in CI with reconciled per-OS baselines) | existing script | Hard fail | Not wired; baseline stale (1 vs 25) (L11) | m4 |
| FF-16 | Pure-move PRs are mechanically pure: removed and added code are the same token multiset apart from import paths | `scripts/refactor/verify-move.mjs` (M2-0059) | Hard fail on PRs marked "pure move" | n/a | From m5 |

Release gates are separate from CI fitness and are not replaced by it: the resource budgets (§2.8), hard-kill, stall, reveal and exhaustion suites, and the release evidence chain (ADR-017). They run on packaged artifacts, not in unit CI.

---

## 4. Migration order (strangler, always shippable)

Rules: behaviour fixes, new capabilities and pure moves go in **separate** PRs (MASTER §18.1). Every step is reversible by revert or flag. Each extraction PR converts that domain's source-text tests into behavioural tests (FF-07). Nothing lands without the hermetic harness (FF-12). Shared contracts and release metadata have **one integrator** (§30.2).

### 4.1 Steps mapped to goal milestones

Refactors that move or edit code 1.9.7 fixed start only after the 1.9.7 five-day owner soak (M2-0198). The m5 exit is the **minimum seam set** (M2-0060, 0061, 0063, 0064, 0065, 0066, 0067, 0205); M2-0069, 0070, 0071 and 0074 are "peel when you touch it" after 10-18. Every owner-facing build between 1.9.7 and 2.0 is an owner-channel **train** built once by the lane (§7).

| # | Milestone | Step (small, reversible) | Kind | Shippable proof (NOT_RUN) | Rollback | Tickets |
|---|---|---|---|---|---|---|
| 1 | m3 1.9.7 (target 10-04) | **Hermetic tests + OS-level isolation**: vitest sandbox + tripwire; CI honeypot first run; QA account second; owner account only under the sandbox profile | Test infra | Canary + honeypot untouched; no new quarantine file | Revert | M2-0001, M2-0190 |
| 2 | m3 | **Observability v1** + out-of-process stall sampler + diagnostics summary | Additive | Events visible in a packaged run; SIGSTOP produces one bundle | Revert (additive) / flag | M2-0006, M2-0192 |
| 3 | m3 | **Supervisor v1**: one `stopAll()` (adds ffmpeg; fixes `onFatal` relaunch); identity-safe registry + reaper + legacy llama rule; `supervise` default-on **only if HK-M 20/20** | Fix | HK-M, REAP-1..5 | Flag off → registry-only | M2-0026, 0027, 0028 |
| 4 | m3 | **Storage v1**: gateway core with the global cap; dataless detection; `.brain`/timer/IPC readers; History list/search; degraded rows | Fix | ST-1 (FIFO + real dataless; settings write and `dns.lookup` < 250 ms), ST-1-W | Flag to previous async paths | M2-0030, 0191, 0031, 0193, 0032 |
| 5 | m3 | **Scheduler policy v1**: one retry/exhaustion function; explicit-retry-only unexhaust; unavailable ≠ attempt; 120 s quiet period; `ledger_unavailable` suspension; model-hash cache | Fix | EX-1..3 (unit + packaged) | Revert | M2-0033, 0003, 0035 |
| 6 | m3 | **Reveal v1**: one `reveal()`; explicit reopen leaves the park state (D-1 default); no automatic renderer reload; bounded reload loop | Fix | RV-1..4; renderer kill ×4 | Flag `reveal=legacy` | M2-0036, 0037 |
| 7 | m3 | **Build-once lane** and 1.9.7 promotion of the tested bytes | CI | Provenance sha256 = promoted sha256 | Remove workflows | M2-0187, 0046 |
| 8 | m4 CI (10-04) | Fitness tooling report-only → ratchet; `check:skips`; SHA-pinned actions + `permissions:`; docs secret scan; Swift and license-server CI; `release.yml` publication independent per OS | CI | CI green with baselines committed | Remove steps | M2-0047..0053 |
| 9 | m5 foundation (10-18) | `app/context.ts` + `ipc/security.ts` + `ipc/register.ts` (pure moves, `verify-move` checked) | Move | Existing tests + guard unit tests + packaged HK/RV/ST re-run | Revert | M2-0060 |
| 10 | m5 | `shared/contracts/channels.ts`, settings authority, transcript golden fixtures + Swift decode (m6-consumed contracts only; the rest land with their first consumer) | Fix + move | FF-08, FF-13 | Revert (barrel intact) | M2-0061..0064 |
| 11 | m5 | `lifecycle/*`, `infra/process`, `windows/*` extracted; `preload/api.ts` split | Move | FF-10, FF-11; behavioural lifecycle tests; packaged re-run | Revert | M2-0065 |
| 12 | m5 | **Journal v1** (C3), dual-writing with the folder draft; renderer acks | Evolve | JR-1..4 | Flag to the folder draft | M2-0066 |
| 13 | m5 | **Meetings index** + **ledger expand/switch** (C5) | Evolve | IX-1..3, BR-MD; History p95 on real dataless files | Index delete; ledger reads legacy | M2-0067, 0205 |
| 14 | m5 exit | **T1 owner-channel build (1.9.9)** with the deferred 1.9.x fixes, 028.A and notes-as-nodes | Release | Packaged suites + resource regression gate + Windows parity; owner installs | Previous build | M2-0206 |
| 15 | m5–m10 | Peel `registerIpc` by domain, Settings and App.tsx splits, sync-fs burn-down, timer registration (peel when touched after 10-18) | Move | Per-domain behavioural tests; FF-02/03/04/09/14 | Per-PR revert | M2-0068..0074 |
| 16 | m6 interaction (11-01) | Reveal-or-recover v2 (journal-gated, supersedes the no-reload pin by ADR-004); command session + audio broker; actions + verification; notes on the journal; right-edge 028.B | New | RC-1..6, CMD suite, CXAC | Flags per capability | M2-0079..0101 |
| 17 | m6 exit | **T2 owner-channel build** (interaction core behind flags) | Release | As step 14 | Previous build | M2-0207 |
| 18 | m7 speech (11-08) | Operator speech broker (no device token); `listen.ts` split only now; golden flows nightly | New + move | Speech suites; nightly flows | Flags | M2-0102..0118, 0208 |
| 19 | m7 exit | **T3 owner-channel build** | Release | As step 14 | Previous build | M2-0209 |
| 20 | m8–m9 (11-15) | Operator `/v1/decide`; knowledge + memory service against the compose profile; Hindsight client; Operator fixes; licensing precedence; Teams behind flags | New (server) | JVAC/HM/Operator suites (local, CI); LIVE BLOCKED where external | Capability switches | M2-0119..0159 |
| 21 | m10 freeze (11-15) | **Feature freeze + rc1** with a 72 h owner soak; only defect fixes afterwards | Gate | All suites, regression gate, golden flows | rc.N | M2-0210 |
| 22 | m10 (11-22) | Capability manifest, lean core, ledger/journal **contract** (only if T1 has ≥ 14 owner days), candidate freeze; Windows signed separately | Contract + release | Release gates; frozen hashes | Forward repair past the contract point | M2-0160..0173, 0211 |
| 23 | m11–m12 | No structural change; film from rc1/frozen captures; final regression + fitness at target values; sign-off | — | Full gate | — | M2-0174..0185 |

### 4.2 Rollback truth table (data-affecting steps)

| Step | Code rollback safe? | Data rollback? | Forward repair / point of no simple return |
|---|---|---|---|
| Journal relocation (12, 22) | Yes while dual-writing | Journal is local and derived until promoted; promoted meetings are normal files | Contract (20) removes folder drafts: rolling back to 1.9.6 then loses sub-60 s crash recovery only |
| Meetings index (13) | Yes | Derived; delete | None |
| Ledger move (13 expand/switch, 22 contract) | Yes: 1.9.6 reads the untouched legacy `.brain/index.json` and at worst re-reconciles (no LLM when cached extractions exist, per L03) | Legacy file never deleted by the app | Contract only after T1 (1.9.9) has ≥ 14 owner-machine days with zero ledger/journal defects, else 2.0.1 (M2-0167); 180 existing `index.corrupt-*` files are **never deleted silently** (user's folder); offer cleanup with consent |
| Supervisor (3) | Yes (flag) | None | None |
| Contracts split (9) | Yes (barrel) | None | Swift `you`/`me` choice: renaming the Swift case changes MetisKit's persisted data. Prefer the `CodingKeys` mapping (no migration) |
| Settings authority (9) | Yes | No data change | None |

### 4.3 What NOT to refactor (and why)

- **Keep as they are:** the preload allowlist and zod schemas (only relocate them); `boot-sentinel.ts`; `secrets.ts` and the per-family secret stores (isolation is the point, L05); the egress guard; the `llm/` breaker, hedge and exhaustion stack; `local-runtime` single-flight and generations (wrap policy around it, do not rewrite); `writeSaved` atomicity and both brain lock lanes; `state.ts` hooks; the `intelligence/` workspace; the audit hash chain; the bug-ledger and type-ratchet gates; CI cost gates; the nine recap layouts; `vad.ts`'s transplant pattern.
- **No restructuring:** `operator/`, `cloudflare-proxy/` and `license-server/` get only targeted fixes (L09 refactors: shared provider guard, rate-limit/nonce module). The license server's future is an ADR, not a refactor.
- **Not before its milestone:** `lib/listen.ts` (audio, high risk, until m7); the dock/`RightEdgeSidecar` renderer code until the owner chooses 1.9.6 or PR #194's 1.9.8 line (K09 blocker #11); the full `shared/ipc.ts` domain split beyond the three drift fixes, until the main-side boundaries are clear (L12's ordering); native `native-app/` beyond the contract fixtures and CI.
- **Not at all:** no pure file-move PRs mixed with behaviour fixes; no refactor for line count alone; no new abstraction for two-line similarities (§18.1); no deleting the duplicated Update-Intelligence feature without an equivalence test first (L10).

---

## 5. Architecture decision records

Status for all is **PROPOSED**. The reviewer is Opus (validation) and the approver is Tony where marked **[owner]**. Full bodies follow the SAE template; the table is the decision index the plan depends on.

| ADR | Title | Decision | Alternatives considered | Consequences |
|---|---|---|---|---|
| 001 | Kill-safe runtime as the stabilization principle | Design so SIGKILL at any instant is safe (C1 + C3 + C5 + C6), and treat recovery of a hung main as out-of-process (the user or the OS) | (a) An in-process watchdog to recover main: impossible when main is blocked. (b) An external process killing a stalled main: live-meeting risk | + Makes the dominant real exit path harmless. − Needs packaged hard-kill suites on both OSes |
| 002 | Modular monolith inside Electron | `main/{app,lifecycle,windows,ipc,features,infra}`, `renderer/{app,features,ui}`, `shared/contracts`; explicit `AppContext`; public feature APIs | (a) Split into services or processes: network cost, no independent scaling need. (b) Status quo: god files | + Testable seams end source-text tests. − About 20 move PRs; merge contention managed by one integrator |
| 003 | Sidecar ownership | macOS `mac-helper supervise` wrapper + process groups (the wrapper calls `setpgid`; no `detached`); Windows relies on the libuv job **if HK-W passes**, else `supervise.exe`; per-session identity-safe registry and reaper; utilityProcess left to Chromium but always tested | ChatGPT's (a) kqueue guardian as a *separate* long-lived process (more state); (b) a `getppid()` polling wrapper (latency, CPU); (c) reaper only (machine stays heavy) | + Group kill, no PID reuse, no shared pipe. − One extra tiny process per sidecar; `stop()` must kill the group |
| 004 | One reveal-or-recover controller | All reopen paths call `reveal()`; renderer generations + hello/heartbeat/ping; `forcefullyCrashRenderer`+reload recovery with budget and SAFE_MODE, **enabled at m6 after the journal**; supersedes `bank-grade-hardening` "no reload" pin **[owner: explicit reopen unparks Hide/Island]** | (a) Only fix `activate`. (b) `isResponsive()` (does not exist). (c) Keep log-only | + Fixes the deterministic no-op; recoverable renderer wedge. − Capture discontinuity must be explicit (owner decides auto-resume) |
| 005 | Durable local journal | EVOLVE autosave-draft into an append-only envelope-encrypted journal in userData with acks; obeys the retention profile | (a) Faster folder autosave (OneDrive churn). (b) Save-on-quit | + Zero loss of acknowledged revisions; enables ADR-004. − New local content store that must follow retention policy |
| 006 | Storage gateway with global admission control | The only meetings-root accessor; async; 2 content permits held until settle; degraded results; dataless-aware; no hydration on list/search; the utilityProcess worker is deferred (C10 trigger) | (a) Per-call caps. (b) A worker process now (more parts before evidence) | + Removes the verified stall class. − Every meetings-root caller migrates (FF-05b) |
| 007 | Device-local meetings index and ingest ledger | Index in userData (derived); ledger moved out of `.brain` via expand/switch/contract; foreign-key/keystore failures never quarantine | (a) Keep scanning. (b) Keep the ledger in OneDrive with better quarantine | + History independent of cloud state; stops quarantine storms. − Multi-device double ingest must stay idempotent (test BR-MD) |
| 008 | Background-work scheduler and exhaustion semantics | One registry for all timers; resume ≠ maintenance ≠ explicit retry; unavailable doesn't count as an attempt; model admission with a boot quiet period; interactive first | Patch each caller | + One policy; calmer boots. − Timer migration touches many modules (FF-14 ratchet) |
| 009 | Contracts package with golden fixtures shared with Swift | `shared/contracts/*`, zod runtime validation, zod-free `channels.ts`, golden + negative fixtures mirrored to MetisKit; JSON Schema generation deferred; `you`↔`.me` via `CodingKeys` | (a) A single schema source with codegen now (new toolchain). (b) Keep `ipc.ts` | + Drift fails CI. − Hand-written Swift types remain (fixtures guard them) |
| 010 | Typed IPC registration | `registerHandler(channel, {schema, guard, handler})`; guards in `ipc/security.ts`; preload `api.ts` split | Convention + review | + Security gate by construction; full preload wire tests |
| 011 | Fitness-function tooling | `dependency-cruiser` for the graph; `check-architecture.mjs` (TS AST, ratchet baseline) for per-file rules; ESLint/Biome adoption stays a separate L11 hygiene item | (a) ESLint only: `max-lines` suppressions cannot stop a suppressed 9.5k-line file from growing; weaker graph rules. (b) A regex script (L12 showed alias and multi-line pitfalls) | + House-style ratchets, one new devDependency. − Custom script to maintain (~300 LOC with its own tests) |
| 012 | Observability via the existing audit log + in-memory ring | Lifecycle, security and recovery events in the hash-chained log; high-frequency aggregated; content-free; correlation IDs (`bootId`, `rendererGeneration`, `captureGeneration`, `operationId`, `requestId`); no new vendor | Add a crash/telemetry SDK (new processor, §16.5 review) | + Discriminates the freeze hypotheses on packaged builds. − Diagnostics rely on the support bundle + consent |
| 013 | Hermetic tests + production foreign-key guard | Injected path resolution; test guard; `detectOneDrive` null under test; `foreign-key` ≠ corrupt | Human rule "don't run tests" | + Protects the owner's data. − All path consumers take injected roots |
| 014 | Server-side intelligence plane | Operator Worker stays the control/metadata plane; decisions, knowledge API, Hindsight (and Laya) run behind it in an approved container platform; desktop key-less **[owner: platform, region, Postgres, Hindsight pin, Laya vendor]** | (a) Desktop-embedded memory/Laya (weights in every install, violates D04/D07). (b) Worker-hosted Python (unsupported, §35.1) | + Satisfies D07/D13/§17.3. − New operational estate with an owner still to be named |
| 015 | Command authority owned by main | Main owns command sessions and capture generations; the renderer is a capture device and view only; wake detector on-device, opt-in; model output never authority; **spike decides** whether capture moves to a native helper on Windows/Mac Electron | (a) Renderer-owned authority (rejected by §4.1). (b) Native capture helper now (cost, signing) | + Meets §4.1 without a new process up front. − Spike outcome may add a helper at m6 |
| 016 | Settings and licensing authority | One `SERVER_AUTHORITATIVE_SETTINGS_KEYS`; `licensingMode` computed; precedence between Operator seat and the legacy license server **[owner: C-03/C-08/C-16]** | Keep two unlinked systems | + Removes a latent privilege-escalation trap. − Possible license-server deprecation path |
| 017 | Release evidence chain and readiness labels | Requirement → repro → commit → artifact hash → environment → executed test → result → reviewer; Stark levels; engineering-complete vs real-environment BLOCKED; Windows publish independent of Mac | Docs + local tests as closure | + Prevents "false closure" (ChatGPT §5). − Needs Mac QA host + Windows runner (K09 blockers) |
| 018 | Overlay idle posture | Measure first. If the §7 idle budget fails, gate `backgroundThrottling`, composited effects and always-on-top level on presenter state (parked or idle) using cursor-proximity signals that already exist; renderer pause logic must not rely on `visibilityState` (it stays "visible" with throttling off; ChatGPT) | Blanket disable (breaks ASR/overlay behaviour) | + Evidence-driven. − Conditional: may be a no-op |

| 019 | Canonical knowledge store (TASK-007) | Owned by M2-0120; decided by D-6 **[owner]** | See M2-0120 | See M2-0120 |
| 020 | Skill contracts and runtime boundaries (TASK-009) | Owned by M2-0139 | See M2-0139 | See M2-0139 |
| 021 | libuv pool sizing and global storage admission | One global cap ≤ effective pool − 2 on meetings-root operations; raise `UV_THREADPOOL_SIZE` only if measurement shows headroom is insufficient (M2-0030) | (a) Per-class budgets (6 permits vs 4 threads). (b) Raise the pool blindly (more threads pinned by the same stuck reads) | + Settings/audit/journal writes and DNS always have threads. − Throughput on healthy cloud folders is capped at 2 concurrent reads |
| 022 | Build-once candidate lane with a stable QA signing identity | `workflow_dispatch` builds once, records provenance, tests the bytes, promotes the same bytes; macOS QA identity is self-signed or Apple Development (never Developer ID); QA-identity variant for any run near owner data (M2-0187) | Push a tag through `release.yml` (cannot publish; rebuilds) | + "Tested bytes = shipped bytes". − Two extra workflows; the self-signed identity's TCC persistence is ASSUMED until verified |
| 023 | Out-of-process stall sampler | A mode of the existing mac-helper samples a stalled main (M2-0192) | In-process detection only; a telemetry vendor | + Attribution for the natural freezes. − One small owned sidecar; macOS only |

Revisit triggers (all ADRs): a new measured bottleneck, an owner decision reversal, a failed acceptance suite, or a platform change (Electron major, macOS File Provider behaviour, libuv job semantics).

---

## 6. Verification, readiness and open decisions

### 6.1 Critical invariants → tests (all NOT_RUN)

| ID | Invariant | Test (packaged build unless noted) | Env |
|---|---|---|---|
| HK-M / HK-W | Killing **main only** with SIGKILL (Force Quit / End task) → every owned sidecar and descendant exits ≤ 5 s; the next launch doesn't duplicate runtimes | 20 cycles/OS × {idle, model starting, active inference, import (ffmpeg), registry write in progress}; census by pid + start time; unrelated same-name processes survive | QA macOS account (hard date 09-29, M2-0007); windows-latest where M2-0196 says it can, else the managed Windows laptop |
| REAP-1..5 | Reaper kills only proven-owned entries | PID-reuse fixture, corrupt registry, foreign exe path, `/usr/bin/fm` not matched by the legacy rule, legacy llama orphan | Unit + packaged |
| ST-1 / ST-1-W | History and the `.brain` readers never block main on dataless, unavailable or kernel-blocked files | Representative profile (59 meetings, ~6 dataless, mostly-dataless `.brain`); ≥ 6 FIFO fixtures + real dataless files + network off/flapping; p99 loop delay < 50 ms; no `app.stall` > 250 ms; settings write and `dns.lookup` < 250 ms; degraded view ≤ 2 s; a dataless `.brain/index.json` for 5 min with no History interaction | QA macOS account with a test cloud account; managed Windows laptop with OneDrive placeholders |
| EX-1..3 | Exhausted stays exhausted across relaunch; completed-but-unacked work is not duplicated; no maintenance model start in quiet period / after unclean shutdown | Seeded ledgers × repeated relaunch | Hermetic |
| RV-1..4 | Explicit reopen reveals from Hide/Island/Bar; boot activate doesn't; tray/hotkey/second-instance share the path | Finder/Spotlight/Launchpad reopen, `open -n`, tray, hotkey; Windows shortcut/exe | Both OS |
| RC-1..6 (m6) | Renderer busy-loop / kill / failed preload → bounded recovery, restored journal, no reload storm, SAFE_MODE after budget, explicit capture discontinuity, no replayed actions | Fault injection | Both OS |
| JR-1..4 | Zero loss of acknowledged revisions across SIGKILL; retention-off profile disables the journal; cap enforced | Kill during edits/transcription | Hermetic |
| IX-1..3 / BR-MD | Index rebuild; foreign-key ledger read-only; two-device idempotent ingest | Fixtures | Hermetic |
| FF-* | §3 | CI | CI |
| RG | No resource regression > 10 % vs 1.9.7 and no §7 breach | Census compare per state | Every train, rc1 and the frozen candidate (M2-0200) |
| GF | The 12 golden flows | Scripted against the packaged app, synthetic data | Nightly from m7 (M2-0208); final run on the frozen candidate (M2-0177) |
| OWN | Owner bugs closed on owner evidence | 10 working days: zero `app.stall` > 5 s, zero orphans after unclean exits, zero reveal no-ops | Owner Mac (M2-0199) |

### 6.2 Readiness

- **DESIGN_READY:** C1–C9, C13–C16 and migration steps 1–15. They can be implemented now against hermetic tests and the build-once lane.
- **IMPLEMENTED_NOT_VALIDATED risk:** packaged suites need the QA macOS account (hard date 09-29) and the Windows lanes; until then tickets can reach ENGINEERING_COMPLETE only.
- **DESIGN_BLOCKED:** C11/C12 live bindings and Teams (§2.6 unblock steps; BLOCKERS.md).
- **RELEASE_BLOCKED:** until HK/ST/EX/RV pass on the 1.9.7 candidate bytes; the owner's bugs close only through M2-0199.

### 6.3 Owner decisions this design depends on

All are in the DECISIONS.md register with a default, reversibility class and needed-by date: D-1 explicit reopen unparks Hide/Island (ADR-004); D-2 capture after renderer recovery (ADR-004); D-3 journal under the enterprise retention profile (ADR-005); D-4 licensing precedence C-03/C-08/C-16 (ADR-016); D-5 hosting, region, managed Postgres, Hindsight pin, Laya (ADR-014); D-6 canonical knowledge store (ADR-019); D-7 shipping dock line (**decided 2026-09-24**: main 1.9.6 RightEdgeSidecar); D-8 off-main Operator ACCESS-bypass commits; D-9 QA environment; D-10 Windows signing route (**decided 2026-09-24**); D-11 default speech route; D-12 retention wording and gateway log policy; D-13 owner-channel prerelease policy.

### 6.4 ASSUMED items that could change a decision (each now has an owner)

| ASSUMED item | Verified by | Ticket |
|---|---|---|
| libuv's Windows job semantics in Electron 43 (decides whether `supervise.exe` is needed) | HK-W | M2-0029 |
| Chromium reaps utilityProcess hosts on Windows | HK-W census | M2-0029, M2-0195 |
| The libuv pool is at its default of 4 | `app.started.uvThreadpoolSize` in a packaged run | M2-0006, ADR-021 (M2-0030) |
| Whether a kernel-blocked hydrating read can be interrupted | Interruptibility rows of the repro matrix | M2-0008 |
| stat/readdir on dataless File Provider directories can block | FIFO/dataless repro rows | M2-0008, M2-0030 |
| 1.9.6 actually opens the FIFO fixtures (so they model the stall) | Repro matrix records opens | M2-0008 |
| Idempotent multi-device entity merges | BR-MD | M2-0205 |
| `mac-helper supervise` needs no extra entitlement | codesign + cold launch; BLOCKED with the exact diff otherwise | M2-0028 |
| A self-signed or Apple Development QA identity keeps TCC grants across builds | Grant once, rebuild, confirm | M2-0187, M2-0007 |
| Workflow-token tags do not re-trigger `release.yml` | Promotion dry run | M2-0187 |
| Windows placeholder attribute query is cheap enough per listing | Measurement on the Windows laptop | M2-0191 |
| `electron-builder --prepackaged` can re-pack signed Windows files without rebuilding app code | Sign-step dry run | M2-0211 |
| The windows-latest runner has an interactive desktop for UIA, SendInput, tray and hotkeys | Capability probe | M2-0196 |

---

## 7. Verification and release architecture

The owner's data was damaged by test processes twice on 2026-09-26, and the current release workflow cannot publish the stabilization build or guarantee that shipped bytes are tested bytes. Verification therefore has an architecture of its own.

### 7.1 Environments

| Environment | What runs there | Isolation | Tickets |
|---|---|---|---|
| CI (GitHub-hosted macOS, Ubuntu, windows-latest) | Full test suites, fitness functions, compose service suites, packaging builds; the first run of any new suite | Honeypot `~/Library/CloudStorage/OneDrive-Honeypot` must stay untouched; wrangler `--local` with credentials unset | M2-0001, M2-0190 |
| QA macOS user (owner's Mac by default; hard date 09-29) | Every packaged suite (HK-M, ST-1, EX, RV, RC, JR), the repro matrix, the census on the representative profile | Separate user: own Keychain, TCC and processes; test OneDrive or iCloud account for real dataless files; no owner sign-in | M2-0007 |
| Managed Windows 11 laptop | ST-1-W with OneDrive placeholders, HK-W, census, GPU/DPI/battery, EDR interaction | Standard enterprise image | M2-0007, M2-0195 |
| windows-latest (dispatch) | Install/launch and whatever the capability spike proves it can run | Runner | M2-0196 |
| Owner's primary account | Only promoted owner-channel builds (1.9.7, T1–T3, rc1) and, if unavoidable, a **QA-identity** variant with per-run consent | Unreleased shipping-identity candidates never run here; agent test commands only under the OS sandbox profile (deny read/write on `~/Library/CloudStorage`, the Métis userData, `~/Library/Keychains`, `~/.wrangler`) once D-28 is applied | M2-0187, M2-0190 |

### 7.2 Build-once lane and promotion (ADR-022)

`qa-candidate.yml` builds every target once from a named main commit and writes a provenance file (sha256 per asset, commit, run ID, runner image, Electron/Node versions, builder config hash). The same run produces the **QA-identity variant** (`com.mantu.asktoto.qa`, own userData and Keychain service, legacy reaper rule off, QA fault hooks compiled in). Packaged gates consume assets by sha256. `promote-candidate.yml` publishes exactly those bytes as an owner-channel prerelease under D-13, refuses bytes without a passing evidence record and never rebuilds. Version numbers only go up and never reuse 1.9.8: 1.9.7 → 1.9.9 (T1) → 2.0.0-beta.1 (T2) → 2.0.0-beta.2 (T3) → 2.0.0-rc.N → 2.0.0.

### 7.3 Evidence chain (ADR-017, schema v2)

One record per ticket per required level: requirement/defect → repro → commit → artifact sha256 → environment and host identity → command and exit code → result → implementer session → validator session. `LOCALLY_TESTED` needs a CI run ID on the PR head SHA; `LIVE_VERIFIED` needs harness output plus the lane sha256; `MEASURED` needs the raw measurement; `ACCEPTED` needs the owner's dated statement. Fix tickets record red-before and green-after runs. Records carry a status per kit reference, and TRACEABILITY is computed from them. A random 10 % of closed tickets is re-executed by a different model at every gate. Artifact dependencies cap closure (a ticket downstream of a BLOCKED_EXTERNAL artifact closes as ENGINEERING_COMPLETE); decision dependencies never cap.

### 7.4 Trains, freeze and closure

| Gate | Date | Content | Proof |
|---|---|---|---|
| 1.9.7 | target 10-04 | P0 closure only | Packaged suites on the tested bytes; owner promotes |
| 5-day soak | 10-09 | 1.9.7 as the owner's daily build | Diagnostics summary; W3 moves of fixed code start after it |
| T1 (1.9.9) | 10-18 | m5 seams, journal dual-write, index, ledger expand/switch, deferred 1.9.x fixes | Suites + regression gate + Windows parity |
| Owner-bug closure | 10-19 | B1/B2 | 10 working days of owner-machine evidence (M2-0199) |
| T2 | 11-01 | Interaction core behind flags | As T1 |
| T3 | 11-08 | Speech | As T1; golden flows nightly |
| Freeze + rc1 | 11-15 | Every ticket up to m10 resolved (DONE / ENGINEERING_COMPLETE / BLOCKED_EXTERNAL / DEFERRED); UI frozen | 72 h owner soak |
| Candidate freeze | 11-22 | Immutable family; Windows signing as a separate step | Frozen hashes; any rebuild invalidates acceptance |

---

## 8. Evidence ledger

- **Read by this lane:**
  - SAE `SKILL.md` §1–9 and modules 05/06/13/14/15/17/18/19/20/30/36; templates for component, ADR and migration.
  - MASTER.md lines 118–305, 305–360, 502–586, 915–975, 1536–1586, 1676–1712, 4296–4340, 5035–5122.
  - Lanes L01, L08, L11, L12 in full.
  - All root causes and verifier evidence in BUG-ROOT-CAUSES.json (B1 RC3 verifications in full).
  - CODE-FINDINGS lane summaries, architecture notes and refactors; COVERAGE-CRITIC.json in full; KIT-REQUIREMENTS summaries, decisions, conflicts and blockers; GIT-STATE branches/PRs (partial); RUNTIME-EVIDENCE.md; chatgpt-audit-1.md; chatgpt-followup-1.md; METIS-STATUS-BRIEF.md.
  - L03 quarantine sections.
- **Repo facts re-observed by this lane** (read-only grep/sed at 2bf21f1c):
  - Process and window spawn sites; 164 IPC registrations; 481/53 sync fs.
  - 9 native dialogs; 51 index.ts-reading tests; `backgroundThrottling:false` ×2.
  - `local-runtime` single-flight/generation/idle; autosave-draft location and cadence; 60 s reconcile timer; the `activate`/`ensureWindow`/`onFatal` code.
  - mac-helper subcommands; dependency versions (electron 43.6.0, zod ^3.23.8, typescript ^5.6.3, vitest ^4.1.11, react ^18.3.1).
- **Not inspected:** `native-app/` sources beyond L08/L10 citations; `operator/` internals; the in-repo 2.0 design docs (`docs/design/*`, COVERAGE-CRITIC item 15). Those docs may contain earlier decisions that conflict with this document and must be reconciled by the plan (UNKNOWN).
- **Refinement inputs (2026-09-26):** two independent premortem critiques of the ledger (dependency bottlenecks, 1.9.7 scope, hermeticity, repro fidelity, pool starvation, Windows, integration, evidence provenance, film); prior-execution OWNER-DECISIONS (shipping line and Windows signing route decided 2026-09-24); `release.yml` constraints as reported by the critique (`:147-154`, `:257`, `:313`, not re-read here).
- **Not run:** any test, build, app or repo code (hard rule).
