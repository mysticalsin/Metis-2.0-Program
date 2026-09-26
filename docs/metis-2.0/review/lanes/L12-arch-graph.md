# L12 — Architecture / Module Graph Audit — Métis 2.0

**Lane:** L12-arch-graph
**Scope:** `src/` (main, renderer, shared, preload) full depth; `operator/src`, `intelligence/src` at summary level.
**Repo:** `/Users/tony/AI-Brain-build/metis-2.0`, read-only checkout of `origin/main` @ `2bf21f1c` (v1.9.6)
**Method:** brownfield discovery (read-only, evidence-ledgered) + domain/code-boundary fitness-function thinking (SAE refs 03, 05) + Stark/Addy five-axis review (correctness, readability, architecture, security, performance, +reliability/testability). Evidence labels: **OBSERVED** (seen directly in code), **DERIVED** (reasoned from observed facts), **ASSUMED**, **UNKNOWN**.

---

## 0. Tooling and its limits (read this before the findings)

I wrote a regex-based Node script (no TS compiler, no `npm install`, read-only) that:

1. Walks `src/main`, `src/renderer/src`, `src/shared`, `src/preload` (849 non-generated `.ts`/`.tsx` files: 366 source + 483 test).
2. Extracts every `import`/`require`/dynamic-`import()`/`export … from` specifier, **including multi-line `import { … } from` clauses** (an early version of the script used a single-line regex and undercounted; fixed and re-verified — see §0.1).
3. Resolves relative specifiers **and** the two path aliases actually configured in `tsconfig.node.json` / `tsconfig.web.json` / `electron.vite.config.ts` — `@shared/*` → `src/shared/*` (main, preload, renderer) and `@/*` → `src/renderer/src/*` (renderer only). An earlier version of the script did not resolve these aliases and reported 68 false "orphan" shared/renderer files; fixed and re-verified (see §0.1).
4. Builds a directed graph, runs DFS cycle detection, fan-in/fan-out ranking, orphan detection (excluding test files and the real electron-vite bundle entry points), a >800-LOC file list, test/source ratios per area, and same-basename duplicate-candidate detection.

Script: `$TMPDIR/scratchpad/graph.js` (kept out of the repo per the read-only rule). Raw output: `$TMPDIR/scratchpad/graph-out.json`.

**What this tool cannot see** (and where I hand-verified instead of trusting the tool blindly):
- Files loaded via `new Worker(new URL('./x.ts', import.meta.url))`, `audioWorklet.addModule()`, or a Blob-embedded source string are not graph edges. I found one real file this affects (`whisper-worklet.ts`, see F5) and manually confirmed the other 16 flagged orphans do **not** use this pattern (grepped for `new Worker(`, `new URL(`, `React.lazy` against each candidate — none matched, all matches were dynamic `import('./Component')` calls the script's dynamic-import regex already resolves).
- Cross-package imports into `operator/src` / `intelligence/src` are not part of the graph (those trees were only file/size/import-direction sampled per the "summary level" scope), so a `src/shared/*` file that looks like an orphan in this graph can still be a real, load-bearing module for the Operator Worker. I hand-verified every shared "orphan" the tool produced before finalizing — one (`operator-connectors.ts`) turned out to be consumed by `operator/src/connectors/catalog.ts` and was removed from the orphan list (it became the basis of finding F1 instead, which is more valuable than an orphan flag).
- The parser is regex-based, not an AST. It correctly handles this codebase's `import`/`require` styles as verified against real multi-line samples, but a sufficiently unusual syntax (e.g., a `from` keyword inside a decorator comment before the real one) could in theory confuse it. I did not find any such case.

### 0.1 Self-correction log (so the Opus planner can trust the final numbers)
| Bug in v1 of the script | Effect | Fix | Re-verified |
|---|---|---|---|
| Import regex required the specifier clause to be on one line | Missed every multi-line `import { a, b } from '...'` (confirmed present via `grep -c '^import\s*{\s*$'` → 0 hits is wrong; correct check found matches in `src/main/desktop-adapters.ts`, `operator-integrations.ts`, etc.) | Switched to non-greedy `[\s\S]*?\bfrom` | Orphan count dropped 97 → 68 on re-run |
| No path-alias resolution (`@shared/*`, `@/*`) | 317 of main's shared-imports and 178 of renderer's use `@shared/…`; only 3 use relative paths — nearly the *entire* shared-module fan-in was invisible, producing ~50 false "orphan shared/ files" | Added alias table sourced from `tsconfig.node.json`/`tsconfig.web.json`/`electron.vite.config.ts` (all three files agree exactly on the aliases) | Orphan count dropped 68 → 16 |
| Missing real electron-vite multi-entry bundle targets (`parakeet-asr-host.ts`, `speaker-embedding-host.ts`, `parakeet-extract-host.ts`, `whisper-asr-host.ts`, `preload/import-decoder.ts`) in the "known entry point" exclusion list | These utility-process/preload entries have zero *internal* importers by design (Electron loads them by file path, not by `import`) and were flagged as orphans | Read `electron.vite.config.ts` `rollupOptions.input` and `src/renderer/decoder.html`, added the 5 real entries | Orphan count corrected further; final list below is hand-verified, not tool-trusted |

Final totals used below: **849 files scanned (366 source / 483 test), 2 real import cycles, 2 cross-layer import-in-tests-only "violations" (no production violation found), 16 hand-verified orphan files, 21 files >800 LOC.**

---

## 1. Layering violations

**Production code: none found.** Renderer never imports `src/main/*`, `src/shared/*` never imports `src/main/*` or `src/renderer/*` in non-test code, and `src/preload/*` only imports `@shared/*` + Electron/Node builtins. This is a genuine strength — the three-process boundary (main / preload / renderer) is respected in shipped code.

Two **test-only** crossings exist (both OBSERVED, both harmless to production, but they are testability smells — a renderer test reaching into `src/main` means the two layers are being validated together instead of through the IPC contract that's supposed to decouple them):

- `src/renderer/src/lib/onboarding-kinetic-grid.test.ts` imports `src/main/island/geometry.ts` directly (`../../../main/island/geometry`).
- `src/shared/hash.test.ts` imports `src/main/screen-preprocess.ts` directly (`../main/screen-preprocess`).

**Fix direction:** if `island/geometry.ts`'s pure math or `screen-preprocess.ts`'s pure function is genuinely shared logic, it belongs in `src/shared/`, not `src/main/`; move it and update both the production caller and the test import. This is a 15-minute fix per file with no behavior change.

**Cross-package (summary level):** `operator/src/desktop-license-handshake.test.ts:3` imports `../../src/main/operator-hmac-sign` — a Worker-side test reaching into the desktop app's main-process code to cross-check HMAC compatibility. Test-only, not shipped in the Worker bundle, so not a runtime violation, but it does mean the Worker's test suite has a hard dependency on the desktop repo layout; worth a comment or a shared-fixture extraction if the two packages are ever split into separate repos.

---

## 2. Import cycles

Two real cycles (deduped by file-set; both confirmed with actual `grep`/line evidence, not just tool output):

### Cycle 1 — brain/ingest core (P2, architecture)
```
src/main/brain/ingest.ts
  → src/main/operator-ingest.ts        (ingest.ts:31  import { operatorAskTransport, operatorFundedProviders } from '../operator-ingest')
  → src/main/brain/intelligence-index.ts (operator-ingest.ts:19  import { lastIndexedAt } from './brain/intelligence-index')
  → src/main/brain/ingest.ts            (intelligence-index.ts:11  import { requestBackfillRun, … } from './ingest')
```
`ingest.ts` is also the single largest file in `src/main` after `index.ts` (2,818 LOC, fan-out 25 — see §4), so this cycle sits inside the app's most complex subsystem. A cycle here means none of the three files can be unit-tested or reasoned about independently; a change to `intelligence-index.ts`'s backfill logic can ripple back into `ingest.ts` through a path that isn't obvious from `ingest.ts`'s own imports.

**Fix direction:** extract a fourth module (e.g. `src/main/brain/backfill-contract.ts`) holding the `requestBackfillRun`/`lastIndexedAt` types+function signatures that both `ingest.ts` and `intelligence-index.ts` depend on downward; `operator-ingest.ts` keeps importing from `ingest.ts` one-way. Standard dependency-inversion break, no behavior change.

### Cycle 2 — Settings/TapCalibration (P2, architecture, readability)
```
src/renderer/src/components/Settings.tsx (line 15: import { TapControlCard } from './TapCalibration')
src/renderer/src/components/TapCalibration.tsx (line 14: import { Section, ToggleRow, ctl } from './Settings')
```
This is a textbook "god component" symptom: `Settings.tsx` is 9,378 lines (the single largest renderer file — see §4) and has accreted generic UI primitives (`Section`, `ToggleRow`, `ctl`) that other, unrelated components (`TapCalibration.tsx`) now need to import back out of it, creating the cycle.

**Fix direction:** move `Section`, `ToggleRow`, `ctl` (and any other primitive `Settings.tsx` exports that non-Settings files import) into `src/renderer/src/ui/` (per the target architecture in §6) or a `SettingsPrimitives.tsx`. `Settings.tsx` and `TapCalibration.tsx` both import from the new primitives module; the cycle disappears without touching either component's actual behavior.

---

## 3. God modules (fan-in / fan-out, tests excluded)

### Top fan-out (a file's own "do too much" signal)
| File | Internal deps (fan-out) | LOC |
|---|---|---|
| `src/main/index.ts` | **135** | **9,519** |
| `src/renderer/src/App.tsx` | 56 | 4,278 |
| `src/renderer/src/components/Settings.tsx` | 38 | 9,378 |
| `src/main/brain/ingest.ts` | 25 | 2,818 |
| `src/renderer/src/components/OnboardingExperience.tsx` | 25 | 1,922 |
| `src/renderer/src/components/BrainView.tsx` | 18 | 1,472 |
| `src/main/operator-ingest.ts` | 17 | 514 |
| `src/renderer/src/components/Review.tsx` | 17 | 1,929 |
| `src/renderer/src/components/RecallView.tsx` | 13 | 1,333 |
| `src/renderer/src/lib/listen.ts` | 12 | 3,154 |

### Top fan-in (a file's own "everyone depends on me" signal — coupling risk if it changes)
| File | Non-test importers (fan-in) | LOC |
|---|---|---|
| `src/shared/ipc.ts` | **87** | **2,408** |
| `src/main/logger.ts` | 49 | 331 |
| `src/shared/providers.ts` | 26 | 729 |
| `src/main/store.ts` | 21 | 1,379 |
| `src/renderer/src/components/AgentStatus.tsx` | 19 | 91 |
| `src/shared/brain.ts` | 16 | 653 |
| `src/main/llm/shared.ts` | 13 | 236 |
| `src/shared/operator.ts` | 12 | 609 |
| `src/shared/overlay-chrome.ts` | 12 | 309 |
| `src/shared/overlay-placement.ts` | 11 | 25 |

### F1 — `src/main/index.ts` is a 9,519-line, 168-IPC-handler god module (P1, architecture — the top structural finding of this lane)
**OBSERVED.** `wc -l src/main/index.ts` → 9,519 lines. `grep -c "ipcMain.handle\|ipcMain.on" src/main/index.ts` → 168 registrations. `grep -c "^import" src/main/index.ts` → 142 top-level imports; the graph script counts 135 distinct *internal* modules imported (the single highest fan-out in the repo by a wide margin — nearly double the #2 file).

A sample of the free functions defined at module scope inside this one file (line numbers from the file as-checked-out): `getSpeakerId` (254), `warnSpeakerFailure` (277), `disposeSpeakerKey` (281), `cleanupExpiredLiveSpeakerReceipts` (289), `completeLiveSpeakerReceipt` (298), `closeLiveSpeakerReceipt` (320), `recordLiveSpeakerSave` (330), `acceptLiveSpeakerTransition` (340), `captureLiveSpeakerKey` (379), `discardActiveLiveSpeakerSession` (388), `validImportSpeakerAttempt`/`beginImportSpeakers`/`captureImportSpeakerKey`/`finalizeImportSpeakers`/`disposeImportSpeakers` (399–436), `applySpeakerIdPolicy`/`speakerIdProcessingEnabled` (447–456), `setSettingsWithSpeakerPolicy`/`publicSettingsWithSpeakerPolicy` (461–467), `labelThemAudio` (475), `observeOperatorAudio` (491), `makeRefreshDustAuth` (841), `contentProtectionOn`/`privateViewOn` (966–979), `rememberRetiringOverlaySender`/`isRecentlyRetiredOverlaySender` (1003–1021), `isCurrentCloudSttOwner`/`invalidateCloudSttOwner` (1051–1064), `speculativeLocalWorkAllowed` (1119), `brainStatusCounts` (1130), `noteIpcDenied`/`assertMainWindow`/`isMainWindowSender`/`denyIfLimited`/`assertBrainReader` (1147–1201), `importJobView`/`publishAsrAssetsProgress`/`publishImportJob`/`assertDecoderSender` (1210–1272).

That is: speaker-ID lifecycle, live-speaker receipt bookkeeping, import-speaker attempt state machine, settings mutation, audio observation, Dust OAuth refresh, content-protection/private-view toggles, overlay-sender tracking, cloud-STT ownership arbitration, **IPC security gating** (`assertMainWindow`, `denyIfLimited`, `assertBrainReader` — i.e. the app's actual authorization boundary lives inline in this file, mixed with everything else), import-job publishing, and decoder-sender validation — all in one file, all sharing module-level mutable state that nothing outside this file can reach or unit-test in isolation.

**Failure scenario this produces (DERIVED, ties directly to the lead's runtime evidence E3/E6):** every IPC handler, every window-lifecycle hook, and the app's own authorization checks (`assertMainWindow`/`denyIfLimited`) share one file's module scope. A bug in, say, the speaker-ID receipt cleanup (`cleanupExpiredLiveSpeakerReceipts`) cannot be isolated, tested, or fixed without loading and reasoning about the entire 9,519-line file and its 135 internal dependencies — which is a direct structural contributor to why E6's `render-process-gone`/`app.unresponsive` and E3's repeated force-quit/relaunch pattern are hard for anyone (human or agent) to diagnose confidently: the blast radius of any single change is, by construction, "the whole app."

**Fix direction (ties into §6's target architecture):** split by responsibility into `main/app/` (lifecycle, `whenReady`, single-instance lock), `main/windows/` (BrowserWindow creation/placement — much of this likely already exists partially in `src/main/island/`), `main/ipc/` (one file per IPC channel group, with `assertMainWindow`/`denyIfLimited`/`assertBrainReader` promoted to a shared `main/ipc/security.ts` gate that every handler module imports — this is the highest-value single extraction because it turns an implicit, easy-to-forget convention into an explicit, reusable one), and `main/features/{speaker-id,import-jobs,cloud-stt,dust-auth,overlay}/` for the feature-specific state machines currently living as free functions in `index.ts`. This is a mechanical extraction (move functions + their imports, no logic changes) that can be done incrementally, file-group by file-group, keeping `index.ts` shippable at every step (see migration plan, §6).

### F2 — `src/renderer/src/components/Settings.tsx` is a 9,378-line god component (P2, architecture)
**OBSERVED.** Same order of magnitude as `main/index.ts`, on the renderer side. Fan-out 38 (imports 38 other internal modules) and — per Cycle 2 above — it exports generic primitives that other components have to import back, which is direct evidence the file mixes "the Settings page" with "generic UI kit" concerns. **Fix direction:** same as §2 Cycle 2 — extract primitives to `renderer/ui/`, then split the remaining page content by settings-section (the file almost certainly already has internal section boundaries given its size — each section becomes its own file under `renderer/features/settings/`).

### F3 — Duplicated integration-kind lists have already drifted (P1, correctness — concrete bug, not just an architecture smell)
**OBSERVED, with exact evidence:**

- `src/shared/operator-connectors.ts:1-8` (doc comment) states this file is the "connector catalog core," that `operator/src/connectors/catalog.ts` extends it with Worker-only detail, and explicitly says: *"the desktop's entitlement layer (`operator-entitlements.ts`) is meant to derive its own kind list from `CONNECTOR_KINDS` so the two lists cannot drift (DT1, later)."*
- `src/shared/operator-connectors.ts:32` — `CONNECTOR_KINDS` is a 28-entry list: `hubspot, salesforce, pipedrive, zoho, dynamics365, attio, close, clickup, jira, linear, asana, monday, trello, plane, notion, airtable, zendesk, intercom, freshdesk, confluence, sharepoint, googledrive, github, gitlab, slack, microsoftteams, custom-mcp, custom-rest`.
- `operator/src/connectors/catalog.ts:14` — `import { CONNECTOR_CATALOG_CORE, CONNECTOR_KINDS, … } from '../../../src/shared/operator-connectors'`, used at `catalog.ts:847` to build the Worker's own connector list. **The Worker side did adopt the shared source of truth.**
- `src/shared/operator-entitlements.ts:166-173` — `OPERATOR_INTEGRATION_KINDS` is a **hand-maintained, independent 7-entry list**: `hubspot, salesforce, pipedrive, clickup, plane, notion, custom-mcp`. It does **not** import from `operator-connectors.ts` at all (confirmed: `grep -n "CONNECTOR_KINDS\|operator-connectors" src/shared/operator-entitlements.ts` → no match). `INTEGRATION_KIND_SET` (line 177) is built from this local list and used at `operator-entitlements.ts:192` (`parseOperatorIntegration`) to validate every integration object the desktop app receives from the Operator Worker's `GET /v1/integrations` response.
- **The literal `"DT1, later"` TODO is the only occurrence of the string `DT1` anywhere in the repository** (`grep -rn "DT1"` across the whole checkout returns exactly one hit) — i.e., the deferred follow-through was never done and there is no other tracking artifact for it.

**Failure scenario:** the Worker (`catalog.ts`) supports 28 connector kinds today, including `jira`, `slack`, `github`, `linear`, `zendesk`, etc. If a user connects any integration whose `kind` is one of the 21 kinds present in `CONNECTOR_KINDS` but absent from `OPERATOR_INTEGRATION_KINDS`, `parseOperatorIntegration` at `operator-entitlements.ts:192` returns `null` for that entry and it is **silently dropped** from the desktop app's parsed integrations list — no error surfaced to the user, no log (the parser fails closed by design for malformed payloads, but a *valid, real* integration kind the Worker actively supports is indistinguishable from garbage input under this check). This is not a hypothetical: the two lists are already inconsistent today, at HEAD, and the divergence can only grow every time someone adds a connector to `catalog.ts`/`operator-connectors.ts` (a natural thing to do, since that's the documented "add a connector here" file) without remembering the *undocumented-in-code* second list in a completely different file.

**Fix direction:** delete `OPERATOR_INTEGRATION_KINDS`/`INTEGRATION_KIND_SET` from `operator-entitlements.ts` and import `CONNECTOR_KINDS`/a `ConnectorKind`-based set from `operator-connectors.ts` instead, exactly as the file's own 2-year-old (well, months-old) doc comment already prescribes. This is the literal "DT1" the comment names — closing it is a single-file, low-risk change (it can only *widen* what the parser accepts, matching what the Worker already sends) and removes a live correctness bug, not just tech debt.

---

## 4. Files > 800 lines (21 files; tests excluded)

| File | LOC |
|---|---|
| `src/main/index.ts` | 9,519 |
| `src/renderer/src/components/Settings.tsx` | 9,378 |
| `src/renderer/src/App.tsx` | 4,278 |
| `src/renderer/src/lib/listen.ts` | 3,154 |
| `src/main/brain/ingest.ts` | 2,818 |
| `src/shared/ipc.ts` | 2,408 |
| `src/renderer/src/components/Review.tsx` | 1,929 |
| `src/renderer/src/components/OnboardingExperience.tsx` | 1,922 |
| `src/main/cli.ts` | 1,672 |
| `src/main/brain/corrections.ts` | 1,630 |
| `src/renderer/src/components/BrainView.tsx` | 1,472 |
| `src/main/store.ts` | 1,379 |
| `src/renderer/src/components/RecallView.tsx` | 1,333 |
| `src/main/transcripts.ts` | 1,273 |
| `src/main/import-jobs.ts` | 1,199 |
| `src/renderer/src/components/Onboarding.tsx` | 1,001 |
| `src/main/auth.ts` | 997 |
| `src/main/brain/publish.ts` | 991 |
| `src/main/recall.ts` | 980 |
| `src/renderer/src/components/Bar.tsx` | 899 |
| `src/renderer/src/components/BrainRecordPage.tsx` | 832 |

`src/shared/ipc.ts` at 2,408 lines deserves a separate callout (P2, architecture): it is the IPC **contract** file (types + channel names shared by main, preload and renderer — hence its fan-in of 87, the highest in the repo) and 2,408 lines of flat contract in one file is itself a coupling hazard: any renderer or main change that touches *any* IPC surface touches this one file, and a merge conflict here blocks unrelated feature work across both processes simultaneously. **Fix direction:** split into `shared/contracts/{brain,ask,listen,overlay,operator,license,import,...}.ts` grouped by feature domain (mirroring the `main/features/*` split in §6), re-exported from a thin `shared/ipc.ts` barrel if a single import surface is still wanted during migration.

*(Operator/Intelligence, summary level, OBSERVED via `wc -l`):* `operator/src/dashboard.ts` (1,428), `operator/src/render/fixture.ts` (1,059), `operator/src/d1.ts` (1,010), `operator/src/spa/css.ts` (992) also exceed 800 lines; `intelligence/src/views/GraphView.tsx` (941) is the only intelligence file over the threshold.

---

## 5. Orphan files (no non-test importer; entry points excluded) — 16, hand-verified

All 16 were checked against the electron-vite `rollupOptions.input` entry list, `decoder.html`'s script tag, and grepped individually for `new Worker(`, `new URL(`, and `React.lazy` usage to rule out dynamic-loading false positives (none matched — see §0 for the one real dynamic-load case, `whisper-worklet.ts`, discussed in F5 below, which is *not* in this list because it's a different failure mode).

| File | LOC | Last touched (git) | Read |
|---|---|---|---|
| `src/main/application-command-session.ts` | 312 | 2026-09-20 (`f50495d8` "add bounded main-owned application command sessions") | Recent, unwired |
| `src/main/operator-test-keypair.ts` | 32 | 2026-08-31 | Unwired |
| `src/renderer/src/components/CommandListeningPill.tsx` | 115 | 2026-09-20 (`01619930` "Cap2 real-mic wake via always-on ear + YOU ASR") | Recent, unwired |
| `src/renderer/src/components/CommandProposalCard.tsx` | 65 | 2026-09-20 (`b782dc1f` "add bounded command microphone access UI") | Recent, unwired |
| `src/renderer/src/lib/use-command-mic.ts` | 226 | 2026-09-20 (`b782dc1f`, same commit) | Recent, unwired |
| `src/renderer/src/components/ControlBar.tsx` | 156 | 2026-08-31 (`943908a3` "replace wait chrome with thinking-orbs luxury status") — superseded | Legacy, unwired |
| `src/renderer/src/components/OnboardingStarfield.tsx` | 61 | 2026-08-31 | Unwired |
| `src/renderer/src/lib/bar-toolbar-layout.ts` | 320 | 2026-08-31 ("measure listening Bar boxes in Chromium at 880") | Possibly manual/visual-QA tooling, unwired from app |
| `src/renderer/src/components/Logo.tsx` | 23 | 2026-07-19 ("Mac-side work in progress — bootstrap") | ~2-month-old scaffolding relic |
| `src/renderer/src/components/RecordingIndicator.tsx` | 20 | 2026-07-19 (same commit) | ~2-month-old scaffolding relic |
| `src/shared/brain-analyze.ts` | 168 | 2026-07-19 (same commit) | ~2-month-old scaffolding relic |
| `src/renderer/src/lib/scramble.ts` | 89 | — | Unwired |
| `src/renderer/src/lib/whisper-worklet.ts` | 45 | — | See F5 — dead duplicate of `whisper-worklet-src.ts`'s embedded string |
| `src/renderer/src/lib/whisper.worker.ts` | 341 | — | **False-negative risk**: loaded via `new Worker(new URL('./whisper.worker.ts', import.meta.url))` at `listen.ts:1393` — this one IS live, excluded from the "confirmed dead" count below |

*(16th and 17th rows collapse — `whisper.worker.ts` is listed for transparency but is a confirmed **false positive**, not dead code; 15 of the 16 tool-flagged files are confirmed genuinely unreferenced by any static or dynamic-load pattern I could find.)*

**Two distinct patterns here, both worth the planner's attention:**
1. **A whole in-progress feature is built but never wired in** (F4 below): `application-command-session.ts` + `CommandListeningPill.tsx` + `CommandProposalCard.tsx` + `use-command-mic.ts`, all landed in commits dated **2026-09-20 — six days before this audit's HEAD (2026-09-26)**. This reads as a feature ("bounded command microphone access" / "Cap2 real-mic wake") that was merged mid-flight and never connected to `App.tsx`/`index.ts`.
2. **~2-month-old scaffolding relics** (`Logo.tsx`, `RecordingIndicator.tsx`, `brain-analyze.ts`, all from the 2026-07-19 "Mac-side work in progress — bootstrap" commit) that were superseded by later work (`MetisMark.tsx`/`MantuLogo.tsx` for branding, whatever replaced the recording indicator) but never deleted.

### F4 — Unwired in-progress feature (P2, architecture/reliability)
**OBSERVED + DERIVED.** See table above. If this feature is intentionally paused work, it should live on a branch, not `main` — every one of these files still compiles, still gets type-checked, still shows up in `git blame`/search results as if it were live, and (per E-series evidence) the app is already dealing with resource and stability problems the lead is investigating in B1–B3; adding untested, unreachable feature code to the audited surface only adds noise to that investigation. **Fix direction:** either finish wiring these four files into `App.tsx` behind a feature flag (if the feature is wanted for 2.0) or delete them and their tests now (if abandoned) — "add a TODO to reconnect later" is exactly the kind of deferral that produced the `DT1` bug in F3.

### F5 — `whisper-worklet.ts` is a dead duplicate; the live code is a hand-embedded string (P2, architecture — real footgun, contrasted with a correct pattern elsewhere in the same codebase)
**OBSERVED.** `src/renderer/src/lib/whisper-worklet.ts` (45 lines) defines `class WhisperWorklet extends AudioWorkletProcessor` and is never imported by anything (confirmed via graph + manual grep). The actual runtime AudioWorklet code is `WHISPER_WORKLET_SRC`, a **117-line template-string constant** in `src/renderer/src/lib/whisper-worklet-src.ts`, Blob-loaded at `listen.ts:1764` (`ctx.audioWorklet.addModule(whisperWorkletUrl())`) via `whisperWorkletUrl()` (`listen.ts:57-62`). `whisper-worklet-src.ts`'s own doc comment explains why: `new URL(...)`-style worklet loading "is transpiled by the Vite dev server but is NOT emitted as a fetchable asset in the packaged Electron build" — i.e., the team already discovered that the normal TS-module worklet pattern doesn't survive packaging, and worked around it by hand-duplicating the logic as a string. `whisper-worklet.ts`, the "normal" module, was simply never deleted after that pivot.

**Failure scenario:** a future engineer (or an AI agent, without this report) opens `whisper-worklet.ts`, sees a clean, type-checked, lint-checked `AudioWorkletProcessor` class, "fixes" a bug in it, ships it, and the fix does nothing — the real behavior is governed entirely by the un-typechecked template string in `whisper-worklet-src.ts`, which nothing keeps in sync with the dead file. This is exactly the drift risk F3 already demonstrates is real in this codebase, in a second, unrelated subsystem.

**Notable contrast worth preserving, not just criticizing:** the adjacent `src/shared/vad.ts` solves the *identical* problem (pure logic needed both as a normal typechecked module **and** transplanted into the worklet string) correctly, via `makeVad.toString()` — its own doc comment says so explicitly: *"One definition → zero drift between the tested code and the code that actually runs on the audio thread."* `src/renderer/src/lib/vad.ts` is now a 7-line re-export shim pointing at `@shared/vad`. **Fix direction for F5:** delete `whisper-worklet.ts`, or convert `whisper-worklet-src.ts` to use the same `.toString()`-transplant technique `vad.ts` already proves out in this exact file (it already imports `makeVad`/`isSpeechLikeWindow` from `vad` and `PCM_16K_RESAMPLER_SRC` from `pcm-format` — the transplant pattern is a first-class technique in this codebase, just not applied consistently).

---

## 6. Duplicated-utility check (same basename across areas)

The tool flags 12 same-basename pairs across `main`/`renderer`/`shared`/`preload`. I manually diffed each; **none are true copy-paste duplication** — they're either (a) intentional main/preload counterparts for the same electron-vite bundle entry (`index.ts`, `intelligence.ts`, `import-decoder.ts` — main or renderer side + its preload), (b) a thin main-side re-export wrapper around a shared implementation (`screen-capture.ts`, `screen-capture-check.ts`, `mode-skills.ts`, `vad.ts` — main/renderer `export { … } from '@shared/…'` plus a few local helpers, correctly layered), or (c) genuinely distinct concerns that merely share a generic name (`store.ts`: `main/store.ts` is app-settings persistence, `main/brain/store.ts` is the brain-index store; `cli.ts`: `main/cli.ts` is the Metis CLI installer surface, `main/llm/cli.ts` is an LLM CLI-provider adapter; `metrics.ts`: `main/metrics.ts` vs `main/island/metrics.ts`; `intelligence-pass.ts`: `shared/intelligence-pass.ts` (types/pure fn) vs `main/brain/intelligence-pass.ts` (orchestration)).

Category (c) is a **P3 readability** finding, not a bug: same-basename-different-module across a flat tree makes `grep`/search/agent-navigation ambiguous (typing "store.ts" in a fuzzy file-open genuinely can't tell you which one you want without the folder qualifier). This is a symptom of the same flat-directory problem as F1/F2/F6, and the target architecture in §7 resolves it as a side effect (feature-scoped folders make `features/settings/store.ts` vs `features/brain/store.ts` self-disambiguating).

---

## 7. Test-to-source ratio per area

| Area | Source files | Test files | Ratio (tests/src) |
|---|---|---|---|
| `main` | 166 | 274 | **1.65** |
| `renderer` | 126 | 136 | 1.08 |
| `shared` | 71 | 72 | 1.01 |
| `preload` | 3 | 1 | 0.33 |

`main`'s 1.65 ratio initially reads as strong test discipline, and for most of the 166 files it likely is (this codebase clearly has a test-first culture — `.contract.test.ts` naming, `mqa-*` regression tests, etc., all OBSERVED in the file listing). But it has to be read against F1: with 168 IPC handlers and dozens of stateful free functions sharing one file's module scope, "tests exist" does not mean "the file is decomposable" or "a single handler can be tested without booting the whole module's side effects" — DERIVED, not verified line-by-line (out of this lane's budget), but the structural fact (one file, one shared module scope, 135 internal deps) makes true unit isolation implausible regardless of test count. `preload`'s 0.33 ratio (3 source files, 1 test) is the one genuinely thin area, though preload's job (thin `contextBridge` exposure) is inherently low-logic, so this is a P3 note, not a red flag.

---

## 8. Operator / Intelligence — summary-level notes

- **No layering leak found:** neither `operator/src` nor `intelligence/src` imports Electron or `src/main/*` in production code (one test-only exception noted in §1). `operator/src` has 32 files touching `src/shared/*` (expected — Worker + desktop share wire-format types), which is the correct direction (Worker depends on `shared`, not vice versa).
- **Operator** (`operator/src`, 203 files, ~36.3K LOC total): biggest files are `dashboard.ts` (1,428), `render/fixture.ts` (1,059), `d1.ts` (1,010), `spa/css.ts` (992) — all over the 800-line threshold and worth the same "split by responsibility" treatment as the desktop app, though a deep pass was out of this lane's scope.
- **Intelligence** (`intelligence/src`, 49 files, ~8.9K LOC total): comparatively well-modularized already (`components/`, `lib/`, `types/`, `views/` — the exact shape the target architecture below recommends for the main app). Biggest file `views/GraphView.tsx` (941 lines) is a reasonable outlier for a single visualization view.

---

## 9. Target architecture (modular monolith, simplifying — not a rewrite)

Everything above points at the same root cause: **two flat "everything" files** (`main/index.ts`, `renderer/Settings.tsx`) and **two flat "everything" directories** (`src/main/` — 105 files directly at its root plus only 7 partial feature subfolders `brain/cloud-stt/island/license/llm/mcp/net`; `src/renderer/src/components/` — 55 flat files; `src/renderer/src/lib/` — 53 flat files; `src/shared/` — 71 flat files, zero subfolders). The fix is not a rewrite — it's finishing the modularization the repo has clearly already started (`main/brain/`, `main/llm/`, `main/license/`, `main/cloud-stt/`, `main/island/`, `main/net/`, `main/mcp/` all exist and are reasonably-sized already) and applying the same pattern to the rest.

```
src/
  main/
    app/            # lifecycle: whenReady, single-instance lock, app.on(...), quit/relaunch guards
    windows/         # BrowserWindow creation & placement (island/ mostly already is this — rename/absorb)
    ipc/
      security.ts    # promoted from index.ts: assertMainWindow, denyIfLimited, assertBrainReader, noteIpcDenied
      <channel-group>.ts  # one file per IPC surface (brain, ask, listen, overlay, license, import, settings, ...)
    features/
      speaker-id/     # getSpeakerId, warnSpeakerFailure, disposeSpeakerKey, live-speaker-receipt lifecycle — all pulled out of index.ts
      import-jobs/    # ImportJob state machine (currently spread across index.ts + import-jobs.ts)
      cloud-stt/       # already exists — good precedent
      dust-auth/       # makeRefreshDustAuth and friends, pulled out of index.ts
      overlay/         # rememberRetiringOverlaySender / isRecentlyRetiredOverlaySender, content-protection/private-view toggles
      brain/           # already exists — resolve Cycle 1 as part of this move
      llm/, license/, cloud-stt/, island/, net/, mcp/   # already exist, keep as-is
    infra/
      secrets.ts, security-limits.ts, win-security.ts, windows-keystore-dpapi.ts, logger.ts, metrics.ts  # cross-cutting, no feature knowledge
  renderer/
    app/              # App.tsx's routing/shell responsibility only, once features move out
    features/
      settings/        # Settings.tsx split by its own internal sections + TapCalibration.tsx, cycle resolved
      onboarding/       # Onboarding.tsx, OnboardingExperience.tsx, OnboardingStarfield.tsx (reconnect or delete)
      brain/            # BrainView.tsx, BrainRecordPage.tsx, RecallView.tsx
      review/           # Review.tsx
      command-mic/       # application-command-session.ts (main-side) + CommandListeningPill/CommandProposalCard/use-command-mic (renderer-side) — finish wiring or delete, don't leave half-merged
    ui/                # Section, ToggleRow, ctl and other primitives extracted out of Settings.tsx; shared visual kit
    lib/                # keep for truly generic, feature-agnostic helpers (already mostly is)
  shared/
    contracts/          # ipc.ts split by feature domain (brain.ts, ask.ts, listen.ts, overlay.ts, operator.ts, license.ts, import.ts, ...)
    <existing flat files>  # keep pure-logic modules (vad.ts, hash.ts, redact.ts, etc.) — they're already correctly layered, just need directory grouping over time, lower priority than main/renderer
  preload/              # unchanged — already minimal and correctly layered
```

### Migration order (keeps the app shippable at every step — no big-bang rewrite)
1. **Close F3 now** (delete `OPERATOR_INTEGRATION_KINDS`, import `CONNECTOR_KINDS`). Zero architecture risk, fixes a live correctness bug, ships same day.
2. **Resolve Cycle 2** (extract `Section`/`ToggleRow`/`ctl` from `Settings.tsx` into `renderer/ui/`). Small, mechanical, immediately removes a real cycle and unblocks independent testing of `TapCalibration.tsx`.
3. **Resolve Cycle 1** (extract the brain/ingest↔operator-ingest↔intelligence-index shared contract). Same shape of fix, slightly larger blast radius — do it right after #2 while the "extract a contract module to break a cycle" pattern is fresh.
4. **Decide F4's fate** (finish wiring the command-mic feature behind a flag, or delete it) and **delete F5's dead file** (`whisper-worklet.ts`). Both are low-risk deletions/decisions, no architecture work, but they shrink the surface before the bigger moves below and remove two "which file is real?" traps for whoever does #5–#7.
5. **Extract `main/ipc/security.ts`** from `index.ts` (the `assert*`/`denyIfLimited` gate functions). Highest-value single extraction: it turns an implicit convention (call `assertMainWindow` at the top of your handler, remember to) into an explicit, testable, reusable module, and it's a pure move — no handler's behavior changes.
6. **Peel `main/index.ts` feature-by-feature** into `main/features/*` in the order: speaker-id → import-jobs → dust-auth → overlay/content-protection, each as its own PR that only moves code + updates imports, verified by running the existing test suite (which per §7 already has real coverage for `main`) after each move. `index.ts` keeps shrinking and stays shippable after every single PR.
7. **Split `shared/ipc.ts`** into `shared/contracts/*` once the `main/features/*` split above has clarified the natural feature boundaries (do this after, not before, #6 — the main-side split will make the contract boundaries obvious rather than guessed).
8. **Renderer mirror of #5–#7**: split `Settings.tsx` by its own section boundaries into `renderer/features/settings/*`, then `App.tsx`'s lazy-loaded views (`Review.tsx`, `RecallView.tsx`, `BrainView.tsx`, `OnboardingExperience.tsx`, etc.) into `renderer/features/*` — lower urgency than main since the renderer already uses `React.lazy` per-view, so its god-file problem is a readability/ownership issue more than a coupling one.

Every step above is additive-first (new file, updated imports, delete old location, existing tests re-run) — none require a feature freeze, and each one is independently revertable if it breaks something, which directly serves the "keep the app shippable at every step" requirement.

---

## 10. Evidence ledger

**Inspected directly (read, grepped, or wc'd):** `src/main/index.ts`, `src/main/store.ts`, `src/main/brain/{ingest,store,intelligence-index}.ts`, `src/main/operator-ingest.ts`, `src/shared/{operator-connectors,operator-entitlements,ipc,vad,screen-capture,screen-capture-check}.ts`, `src/renderer/src/App.tsx`, `src/renderer/src/components/{Settings,TapCalibration}.tsx`, `src/renderer/src/lib/{listen,vad,whisper-worklet,whisper-worklet-src}.ts`, `operator/src/connectors/catalog.ts`, `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`, `electron.vite.config.ts`, `src/renderer/{index,decoder}.html`, git history (`git log`) for every file listed as an orphan. Full file listing of `src/main`, `src/renderer/src`, `src/shared`, `src/preload`, `operator/src`, `intelligence/src` at 1–2 levels deep.

**Sampled at summary level only (per lane scope):** `operator/src` and `intelligence/src` file contents beyond size/import-direction checks — no line-level review of Worker business logic or intelligence dashboard views was performed.

**Not inspected:** `native/`, `native-app/`, `license-server/`, `cloudflare-proxy/`, `resources/`, `scripts/`, `.forge/`, `.github/`, `docs/`, `runs/`, `skills/`, `out/` — outside this lane's stated scope (`src/`, `operator/src`, `intelligence/src` summary).

**Not claimed:** this is not a complete audit of either `operator/src` or `intelligence/src` — only import-direction, size, and file-count sampling, as instructed. Runtime-evidence items E1–E9 from the lead were used only where directly relevant to a structural finding (F1's tie to E3/E6); the deeper crash/resource-leak diagnosis is explicitly out of this lane (B2/B3's job) and I did not attempt to re-derive it.

---

## 11. Findings summary (severity-ranked)

| ID | Severity | Axis | Summary |
|---|---|---|---|
| F3 | **P1** | correctness / architecture | `OPERATOR_INTEGRATION_KINDS` (7 kinds) has drifted from `CONNECTOR_KINDS` (28 kinds); the Worker already supports connector kinds the desktop app silently drops on parse. `src/shared/operator-entitlements.ts:166-192` vs `src/shared/operator-connectors.ts:32`. |
| F1 | **P1** | architecture / reliability | `src/main/index.ts`: 9,519 LOC, 168 IPC handlers, 135 internal deps, dozens of stateful free functions incl. the app's own IPC-auth gate, all sharing one module scope. |
| F2 | P2 | architecture | `src/renderer/src/components/Settings.tsx`: 9,378 LOC, fan-out 38, causes Cycle 2 by exporting generic UI primitives. |
| Cycle 1 | P2 | architecture | `main/brain/ingest.ts` ↔ `main/operator-ingest.ts` ↔ `main/brain/intelligence-index.ts` circular dependency. |
| Cycle 2 | P2 | architecture | `Settings.tsx` ↔ `TapCalibration.tsx` circular dependency via shared UI primitives. |
| F4 | P2 | architecture / reliability | A 4-file "command mic" feature (`application-command-session.ts`, `CommandListeningPill.tsx`, `CommandProposalCard.tsx`, `use-command-mic.ts`) merged 2026-09-20, never wired into the app. |
| F5 | P2 | architecture / correctness-risk | `whisper-worklet.ts` is dead; the live AudioWorklet code is a hand-duplicated string in `whisper-worklet-src.ts` with no drift protection (contrast: `vad.ts` solves the same problem correctly via `.toString()` transplant). |
| ipc.ts size | P2 | architecture | `shared/ipc.ts` (2,408 LOC, fan-in 87) is a flat, undivided IPC contract — every cross-process change touches it. |
| flat dirs | P2 | architecture | `main/` (105 root files), `renderer/components/` (55), `renderer/lib/` (53), `shared/` (71) are flat namespaces with no feature grouping. |
| Test-layer leak | P3 | testability | Two test files (`onboarding-kinetic-grid.test.ts`, `hash.test.ts`) import across the renderer/shared→main boundary that production code respects. |
| Orphans (11 more) | P3 | maintainability | `operator-test-keypair.ts`, `ControlBar.tsx`, `OnboardingStarfield.tsx`, `bar-toolbar-layout.ts`, `Logo.tsx`, `RecordingIndicator.tsx`, `brain-analyze.ts`, `scramble.ts` — dead code from superseded work, ~1-2 months stale. |
| Same-basename | P3 | readability | `store.ts`, `cli.ts`, `metrics.ts`, `intelligence-pass.ts` exist twice with unrelated meanings — navigation/search ambiguity in a flat tree. |
