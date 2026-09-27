# TASK-003 — Métis 2.0 compact source map and numbered handoff

Generated 2026-09-24 by the TASK-003 lane. Kit: MASTER rev 4.5 (`registry.json` source_sha256 `e5b3c51d…1350`).
This is a navigation index, not a product result (MASTER §33): a file being present does not mean it passes at runtime.

**Evidence labels.** **V** = VERIFIED against the source worktree with the commands in §0 (every count, path and SHA below).
**A** = ASSUMED, meaning inferred from file names, header comments or kit task text and not traced through call graphs.
**U** = UNKNOWN. A **V[SRC-nn]** tag means the kit's `registry.json` source finding cites that path, and it is present at HEAD (§13).

## 0. Identity, freshness and how to refresh (V)

| Item | Value | Command |
|---|---|---|
| Worktree | `/Users/tony/AI-Brain-build/metis-2.0`, branch `claude/metis-2.0-task-001` | `git rev-parse --abbrev-ref HEAD` |
| HEAD | `2bf21f1ceefe117838325342574b57852e5cadcb` (2026-09-23, "Merge pull request #198 … codex/metis-review-fix-1") | `git log -1 --format='%H %cs %s'` |
| Dirty state | 0 porcelain entries at map time | `git status --porcelain \| wc -l` |
| Package | `asktoto` 1.9.6, main `./out/main/index.js`, node engine 22.22.3 | `package.json` |
| Tracked files | 1,944 in total, including 483 `*.test.ts(x)` under `src/` | `git ls-files \| wc -l` |
| Line counts | `wc -l` over `git ls-files` (code = ts/tsx/mjs/swift/css; tests = `*.test.*`, `Tests/`) | per-row commands in §1 |
| Freshness | Each row's "last" value is `git log -1 --format='%h %cs' -- <path>` | re-run it to detect drift |

Refresh recipe for a resumed agent. Run `git -C <worktree> log -1 --format='%h %cs' -- <dir>` for each row. When the result differs from the row, re-count that row only.
Do not rebuild the whole map.

## 1. Structural-index tooling evaluation (TASK-003 "Do", SRC-01/SRC-24)

- **graphify CLI:** 0.9.38 at `~/.local/bin/graphify` (V: `which graphify; graphify --version`).
- **Worktree index:** no `graphify-out/` in the worktree (V: `ls` gives "No such file or directory"). No index was built. Building one would write into the read-only source worktree, which this lane may not modify.
- **Next step:** if a structural index is wanted, build it into the exec dir, record its input SHA, and add it through TASK-061's graph update (A).
- **Runtime graph (not a dev index):** `src/main/graphify.ts` (496 lines) plus `resources/graphify_runner.py` are a product feature. They build a knowledge graph of the user's meetings. They must not be duplicated or repurposed as a developer index (MASTER TASK-003 "without creating a duplicate runtime graph").
- **Existing human maps:** `docs/PLATFORM-MAP.md` (86 lines, last d6734ec1 2026-08-30) and `docs/asktoto-architecture.md` (2,315 lines, last aa252660 2026-09-12). Both are secondary to this file and the source (A: freshness not audited).
- **Tooling permissions used:** read-only `git ls-files/log/show/grep/cat-file/merge-base/for-each-ref`, `wc`, `sed`, `grep` and `python3` over the kit JSON.
  No npm, no network, and nothing was written into the worktree.

## 2. Top-level modules (V: counts and last commit; responsibility V from README/headers unless marked A)

| Dir | Files | Code/test lines | Last | Responsibility | Areas/tasks (A unless V[SRC]) |
|---|---|---|---|---|---|
| `src/` | 899 | see §3–§6 | 2bf21f1c 09-23 | Electron desktop app (main, preload, renderer, shared) | all desktop tasks |
| `operator/` | 592 (271 are flags) | src 21,337 / 14,996 test; client 2,425 | fca1e6b5 09-22 | Cloudflare Worker "Operator" admin portal and seat API: D1, Access, `/v1/*` | metering/portal, skills, identity: 012,014,015,034,042,045,062 |
| `cloudflare-proxy/` | 8 | 422 / 518 | 14d79cdc 08-31 | Operator-deployed Worker that relays `/v1/chat/completions` and serves `/health` for Workers AI/Gateway | 011–016,020,057 V[SRC-08,20] |
| `license-server/` | 35 | 2,385 / 2,131 | 1a2fda7c 09-09 | Legacy self-hosted license/lease server (Node, JSON store, Docker/Fly) | identity/entitlement 006,034,062 V[SRC-02,17] |
| `intelligence/` | 65 | 7,235 / 1,725 | 3e463bb2 09-20 | Standalone Vite+React "Intelligence" dashboard, bundled into the desktop app | knowledge 036,040 |
| `native-app/` | 26 | 2,135 / 358 | 2c2a9083 09-22 | Native SwiftUI Mac app plus the `MetisKit` Swift package (XcodeGen `project.yml`) | 029,065 V[SRC-11,12,24] |
| `native/` | 2 | 308 / 0 | 5c521826 09-23 | `mac-helper` Swift sidecar for Electron (Vision OCR, frontmost watcher, Speech privacy plist) | actions 033, capture 021 |
| `scripts/` | 145 | 50 test files | 6970ebb5 09-23 | Build, package, sign, check, fetch and QA scripts; `qa/`, `evals/`, `lib/` | release 023,026,053,063,064 |
| `docs/` | 84 | 19,366 (md) | 5c521826 09-23 | Design, compliance, QA, security, operator runbooks | docs cited by V[SRC-09,15,16,18,21,23] |
| `.github/workflows/` | 4 | 1,036 | f3e90da1 09-22 | `build.yml` (quality, operator, security, build-macos, build-windows), `release.yml`, `cahe-windows.yml`, Windows signing preflight | 063,064 V[SRC-24] |
| `resources/` | 15 | 188 | 93135a7a 08-31 | Packaged runtime slots (asr, ffmpeg, local-llm, managed-node, ort, vcredist), `runtime-assets-manifest.json`, `graphify_runner.py` | local packs 021–026 |
| `build/` | 12 | 57 | dee09c9e 09-06 | Icons, mac/MAS entitlements, managed-config examples, `cloudflare-embed/` slot | 026,063,065 |
| `skills/` | 11 | 728 | 7cff4164 09-06 | Mode skill markdown (`modes/*`, `caveman`, `humanizer`), locked by `src/shared/mode-skills.lock.json` | skills 009,042–044 |
| `runs/` | 5 | 231 | 63fabe22 09-15 | FITO-185 onboarding run notes | 027 (history) |
| `.forge/` | 13 | 1,066 | a2d716b1 07-18 | Legacy QA probe scripts (`qa-*.mjs`) | 061 (cleanup candidate, A) |
| `.scratch/`, `.cursor/`, `__mocks__/` | 3/2/1 | 310/39/83 | 08-23…09-06 | Prototype scratch, Cursor env, vitest `electron` mock | 061 |
| Root config | — | — | — | `electron-builder{,.win,.cahe.win}.yml`, `electron.vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `.gitleaks.toml`, `DESIGN.md`, `THIRD_PARTY_NOTICES.md` | V[SRC-09,14,16,18,19,24] |

**Build entry points (V: `electron.vite.config.ts` L40–98).** Main: `src/main/index.ts`. Utility processes: `parakeet-asr-host.ts`, `speaker-embedding-host.ts`, `parakeet-extract-host.ts`, `whisper-asr-host.ts`.
Preloads: `src/preload/index.ts`, `intelligence.ts`, `import-decoder.ts`. Renderer: `src/renderer/index.html`, `decoder.html`.

**Test runners (V: `package.json`, `vitest.config.ts` L31–36).** `npm test` runs `lock-mode-skills --check`, then root vitest (`src/**`, `intelligence/src/**`, `scripts/**`, `eval/**`), then `test:proxy`, then `test:operator`.
Separate runners: license-server `node --test` and native `swift test` (MetisKit).

## 3. `src/main` (Electron main): 168 non-test files, 51,409 code / 55,363 test lines, last 2bf21f1c 09-23

Format: `file(lines)`. Responsibility comes from the file's header comment (V). Collaborators come from its imports (V where listed).
Test files are siblings named `*.test.ts` (V: 274 in total).

**Boot and app shell**
- `index.ts(9518)` is the main entry, last fca1e6b5 09-22. It holds window creation (`createWindow` L2521, `new BrowserWindow` L2580), 164 `ipcMain.handle/on` registrations and 110 distinct `./` import modules (every area below; V: `grep "from './" | sort -u`). `ELECTRON_RENDERER_URL` is handled at L1491 and L2064.
  Tests: `index-audit-fixes`, `main-lifecycle`, `c-main-fixes` and others. Areas: all. Oversized, so it is the prime TASK-061 target.
- Supporting modules: `boot-sentinel(137)`, `renderer-readiness(74)`, `selftest(153)`, `logger(330)`, `dev-env(52)`, `app-user-agent(9)`, `security-limits(91)`, `bounded-set(40)`, `platform-perms(113)`, `win-security(337)`, `foreground-watcher(245)`, `overlay-workspace-pinning(15)`, `act1-dom-probe(199)`, `onboarding-exit-fallback(22)`.

**Settings, persistence and history**
- `store.ts(1378)` handles settings load, migration and `getSettings`. Imports `secrets`, `net/egress-policy`, `shared/ipc`, `shared/providers`, `shared/dust-validate`, `win-security`. Areas: Settings 008/022.
- `secrets.ts(300)` is an AES-256-GCM encrypted-file backend.
- `transcripts.ts(1272)` covers transcript/notes I/O plus v1/v2 envelope at-rest encryption. Imports `secrets`, `meeting-path`, `shared/enterprise-live-profile`. Areas: 007,041,054,058.
- Also: `recall.ts(979)` (meeting-history search), `meeting-path(20)`, `time-saved-log(109)`, `metrics(126)` (local audit-log metrics).

**Speech and ASR** (tasks 016–020, 053; cloud default = Nova-3/Soniox WS)
- `cloud-stt/adapter(467)`, `live-session(564)`, `credentials(120)` V[SRC-07], `pcm(12)`, `session-replacement(34)`. live-session imports adapter, credentials, pcm, `net/egress-policy`, `shared/cloud-stt-*`. There are 4 tests in `cloud-stt/`.
- `listening-state-ipc(43)` is the main-owned listening identity.
- Local engines: `whisper-asr-host(167)`, `whisper-import(500)`, `parakeet(287)`, `parakeet-asr-host(137)`, `parakeet-extract{,-host}(67/34)`, `apple-speech(144)`.
- ASR model plumbing: `asr-bundled-ensure(487)`, `asr-manifest(43)`, `asr-model-{download(255),manifest(73),path(34),protocol(65)}`.
- Speakers: `speaker-id(587)` V[SRC-13], `speaker-cluster(181)`, `speaker-embedding-{client(288),host(113),protocol(16)}`.
- Import pipeline: `ffmpeg-decoder(196)`, `import-audio(155)`, `import-jobs(1198)`, `import-job-store(67)`, `import-magic(54)`, `import-memory-pressure(7)`, `import-recap(272)`, `import-recap-validation(69)`, `polish(121)`.

**Command and actions** (tasks 019, 031–033)
- `metis-command-register(60)` registers the command-session IPC and the singleton runtime. Imports `command-control`, `metis-command-runtime`, `shared/operator`.
- `metis-command-runtime(241)` V[SRC-03,04] turns trusted text into one proposal. Imports `metis-decide-client`, `shared/desktop-actions`, `shared/metis-command-*`. **L235 `void result` is still present at HEAD (V).** The SRC-04 anchors `flushPending`/`mark_committed` are absent at HEAD (V: `git grep` finds no match).
- `metis-decide-client(225)` calls portal `/v1/decide` (action_disambiguate, intel_rank/score). **No `/v1/decide` handler exists in `operator/src`** (V: `grep -rn v1/decide operator/src` finds none).
- `command-control(169)` holds proposal TTL/nonce state. Application layer: `application-{catalog(186),catalog-view(32),command-session(311),discovery(23),intents(89)}`.
- `desktop-adapters(268)` V[SRC-05] holds `executeDesktopAction` (L167). It is wired in `index.ts` L601/L988.
- Also: `mac-helper(249)`, `screen-capture(81)` V[SRC-21], `screen-capture-check(178)`, `screen-preprocess(445)` V[SRC-21], `asktoto-shot(42)`.

**Overlay geometry** (tasks 028, 030)
- `island/geometry(682)`, `island/metrics(103)`, `island/cursor-watch(173)`, `island/exclusive-bounds-repair(79)`. There are 8 tests in `island/`.

**LLM providers and routing**
- `llm.ts(50)` plus `llm/{anthropic(130),openai(314),dust(534),dust-attachments(50),enterprise-client(254),operator-ask(218),cli(19),shared(235),retry(121),hedge(151),exhaustion(205),provider-health(198),usage-headroom(145),think-strip(235),prewarm(62)}`.
- Also: `cli.ts(1671)` (claude-cli/codex-cli backends), `cli-installer(753)`, `managed-node(249)`, `personas(186)`.

**Local packs** (tasks 021–026, 059)
- `llm/{local(280),local-models(504),local-model-download(304),local-routing(304),local-runtime(671)}` (the llama-server sidecar), `llm/fm-runtime(396)` (Apple `fm serve`), `local-model-provisioning(13)`.

**Knowledge and Intelligence** (tasks 035–041, 054)
- `brain/store(639)` stores JSON under `<meetings>/.brain/`.
- `brain/ingest(2817)` is one of the five export-gap files. It imports `dustcli`, `llm/*`, `operator-ingest`, `store`, `transcripts`, `corrections`, `publish`, `shared/brain`, `shared/grounding`.
- `brain/corrections(1629)`.
- `brain/publish(990)` V[SRC-23] is the Dust-readable markdown mirror. Imports `transcripts`, `corrections`, `store`.
- Also in `brain/`: `context(236)` (Receipt Mode), `attention(121)`, `consolidate(140)`, `intelligence-{index(341),pass(32),pass-route(81),work(57)}`, `match-key-cache(62)`. There are 28 tests in `brain/`.
- Outside `brain/`: `intelligence.ts(169)` (dashboard window, content protection), `graphify.ts(496)`, `graph-transcript(174)` (Teams transcript via Graph).

**Dust** (tasks 038, 039)
- `dust-oauth(347)`, `dustcli(164)`, `dust-cli-chat(323)`, `dust-projects(127)`, `dust-secret-store(141)`, and `llm/dust*` (above). There are 13 Dust-named tests.

**Skills and modes** (tasks 009, 042–044)
- `mode-skills(231)` V[SRC-22], `operator-skill-key(39)`, `operator-skill-verify(53)` (Ed25519 pack verify).

**Operator client and metering** (tasks 015, 034, 045)
- `operator-ingest(513)` handles heartbeat and ingest. Imports `auth`, `license`, `operator-{crm,entitlements-state,hmac-sign,integrations,queue}`, `store`, `shared/operator*`.
- Also: `operator-queue(201)` (offline outbox), `operator-integrations(326)`, `operator-entitlements-state(102)`, `operator-license-activate(35)`, `operator-overlay(146)`, `operator-crm(117)`, `operator-hmac-sign(38)`, `operator-test-keypair(31)`, `cloudflare-connect(13)`.

**Identity and licensing** (tasks 006, 034)
- `auth.ts(996)` handles MSAL (`@azure/msal-node` ^5.3.0) sign-in with Calendars.Read. Imports `secrets`, `store`, `win-security`.
- Also: `calendar(122)`, `outlook-write(132)` (drafts only, never send).
- `license.ts(459)` V[SRC-02] imports `license-lease-*`, `license/*`, `shared/license-types`. Related: `license-lease-key(89)` V[SRC-02], `license-lease-verify(113)`, `license-trial(64)`.
- `license/{activate(184),airgap(60),client(78),device(164),install(100),jws(116),public-keys(12),secret-store(88),server-url(24)}` (7 tests).

**Integrations** (MCP, push-only)
- `mcp/{clickupOAuth(329),clickupPush(216),mcpClient(317),mcpSecrets(277),planeOAuth(268),pushQueue(351),write-tools(192)}`.

**Network**
- `net/{egress-guard(243),egress-policy(86),install-proxy(100),proxy-url(57)}`.

**Legacy embedded credentials and pilot edition** (V[SRC-09], 026/063; do not print file contents)
- `embedded-cloudflare-key(226)`, `embedded-cloudflare-crypto(64)`, `embedded-key-material.json`, `cahe-edition(91)`, `cahe-embedded-key(162)`.

**Updater** (tasks 063, 064)
- `updater.ts(431)` wraps `electron-updater` ^6.8.9 with an admin generic-feed override (L51–58). The default publish target is GitHub `mysticalsin/Metis-Releases` (V: `electron-builder.yml` L319–326).

## 4. `src/preload`: 4 files plus 1 test, 650 lines, last 2c2a9083 09-22

- `index.ts(563)` exposes `window.toto` (L561), with 167 `ipcRenderer` calls. Imports `shared/ipc`, `shared/providers`, `shared/recap-status`. Test: `live-identity.test.ts`.
- `intelligence.ts(43)` exposes `window.intelligence`. `import-decoder.ts(35)` exposes `window.importDecoder`. `index.d.ts(9)`.
  Every new IPC surface (speech broker, command approval, skills, knowledge) passes through here (A).

## 5. `src/renderer`: 147 non-test files, 44,293 code / 19,750 test lines, last 2bf21f1c 09-23

**Root**
- `App.tsx(4277)` is one of the five export-gap files. It imports Bar, OnboardingExperience (sync), RightEdgeSidecar, Panel, ControlPill, OverlayPeek, `lib/listen`, `lib/tap/*`, `state`, and lazy Settings/Review/RecallView/AgendaView/BrainView. 3 tests.
- Also: `main.tsx(83)`, `state.ts(776)` (3 tests), `styles.css(3265)`, `index.html(132)`, `public/act1-boot.js(61)`, `public/onboarding-boot-gate.js(13)`, `decoder.html`, `import-decoder.ts(93)`.

**Speech**
- `lib/listen.ts(3153)` is one of the five export-gap files and the capture/transcript hook (7 tests). Imports `shared/{ipc,transcript-filter,lang-id,enterprise-live-profile,speaker-names}`, `whisper-worklet-src`, `entity-casing`, `transcript`, `asr-offline`.
- Also: `lib/{whisper.worker(340),whisper-worklet-src(117),whisper-worklet(45),pcm-format(64),vad(7),asr-offline(12),use-command-mic(225),transcript(82),entity-casing(136)}`, `lib/tap/*` (9 files) and `TapCalibration.tsx(332)`.

**Right-edge dock, orb and bar** (tasks 028, 030)
- `components/Bar.tsx(898)` imports `lib/bar-pill-orb`, `lib/listen`, JarvisOrbButton, ObsidianOrb, AgentStatus, ModePicker, `shared/overlay-orb`, `shared/perception`.
- `RightEdgeSidecar.tsx(430)` (c8fa256d 09-23) imports Bar and `shared/ipc`. 2 tests plus `right-edge-placement` ×2.
- Other components: `ControlPill(51)`, `ControlBar(155)`, `OverlayPeek(45)`, `Panel(64)`, `JarvisOrbButton(128)`, `BrandThinkingOrb(98)` V[SRC-14], `ObsidianOrb(133)`, `CommandListeningPill(114)`, `CommandProposalCard(64)`, `Overlay{Chrome,Orb,Placement}Picker`.
- Libraries: `lib/{jarvis-orb(678),jarvis-orb-state(20),bar-pill-orb(155),bar-toolbar-layout(319),overlay-autohide(127),overlay-motion(75),overlay-placement-save(41),right-edge-dismissal-lock(38),window-drag(141),orb-first-frame(30)}`.

**Onboarding** (task 027; §34 Tony-only welcome)
- `OnboardingExperience.tsx(1921)`, `Onboarding.tsx(1000)`, `OnboardingAppearance(238)`, `OnboardingDemoScene(302)`, `OnboardingStarfield(60)`, `onboarding/KineticGrid(169)`, `SignInWall(248)`, `LicenseGate(191)`.
- `lib/onboarding-*` (16 files, including `onboarding-hero-video(88)` V[SRC-15], the retired-clip lineage). There are 20 onboarding tests under `lib/`.

**Settings and identity** (tasks 008, 022, 044)
- `Settings.tsx(9377)` has 8 tests and imports `../state`, `lib/{asr-offline,dust-live-check,onboarding-music,overlay-placement-save}`, the IdentitySection and Picker components, `shared/bundle-response`. It is the second-largest file, so it is a TASK-061 target.
- Also: `IdentityCard(256)`, `IdentitySection(45)`, `ModePicker(118)`, `ModeRecap(70)`.

**Knowledge and review UI** (tasks 040, 054)
- `BrainView(1471)`, `BrainRecordPage(831)`, `Review(1928)`, `ReviewEntityStrip(266)`, `RecallView(1332)`, `AgendaView(193)`, `TimeSavedView(147)`, `IntelligenceUpdateButton(47)`, `brain-{auto,refresh,status-refresh}.ts`, `lib/recap-write-coordinator(147)`.

**Ask and answer**
- `Answer(384)`, `Copilot(319)`, `Markdown(57)`, `CodeBlock(158)`, `QuickActions(100)`, `AgentStatus(90)`, plus toasts (`UpdateReadyToast(119)` and 4 others).

## 6. `src/shared`: 97 non-test files, 12,596 code / 9,048 test lines, last 7bd80e6a 09-20 (TASK-005 contract home, A)

- **IPC and Settings contract:** `ipc.ts(2407)` holds the zod `Settings` type (L1497) and `DEFAULT_SETTINGS` (L1628), with 3 tests. Also: `settings-bounds(65)`, `providers(728)`, `routing(113)`, `ask-routing(154)`, `answer-first(120)`, `prompts(372)`, `grounding(709)`, `question-type(159)`, `caveman-ask(123)`, `bundle-response(169)`.
- **Speech:** `cloud-stt-{language(186),line-map(80),provider(54)}`, `enterprise-live-profile(91)`, `vad(339)`, `silence(156)`, `lang-id(336)`, `transcript-{align(205),filter(76)}`, `speaker-{names(183),summary(31)}`, `talkstats(61)`, `asr-{hardware-preference(51),latency(27)}`, `metis-wake(48)` V[SRC-06] (text matching only).
- **Command:** `metis-command-{parse(110),proposal(48),session(155)}`, `desktop-actions(87)` V[SRC-05], `quick-actions(158)`, `accelerator(37)`.
- **Overlay:** `overlay-{chrome(308),orb(113),placement(24),presentation(55)}`, `perception(12)`.
- **Knowledge:** `brain(652)`, `brain-analyze(167)`, `intelligence-pass(82)`, `mode-recap(121)` V[SRC-22], `recap-status(16)`, `wrapup(98)`, `mars(203)`, `redact(103)`, plus `__fixtures__/golden/*` (12 pairs of transcripts and expected outputs).
- **Dust, skills and local:** `dust-validate(172)`, `mode-skills(188)` with `mode-skills.lock.json`, `local-ai(175)`, `managed-npm(26)`, `managed-node-manifest.json`, `cli-setup-status(51)`.
- **Operator and metering:** `operator(608)`, `operator-{connectors(378),entitlements(222),license(121),seat(130),vision(82),hmac(17)}`, `time-saved(127)`, `time-saved-events(115)`, `license-types(146)`. `operator/src/index.ts` imports `src/shared/operator*` and `question-type` directly (V).
- **Utilities:** `safe-url`, `sanitize-html`, `sha256`, `hash`, `demo-guard`, `encrypted-profile-recovery`, `screen-capture(-check)`, `meeting-duration`, `reset-time`, `onboarding-audio`.

## 7. `native-app/` and `native/` (tasks 029, 065)

- **App shell:** `App/{MetisApp(83),ContentView(210),AudioCapture(55)}.swift`, `App/Onboarding/OnboardingView(416)`, `App/Permissions/PermissionsService(121)`, `App/Settings/SettingsView(97)`, `App/Store/PersistedModels(62)` V[SRC-11], `App/History/HistoryView(85)`, `App/UI/{MetisMark,Theme}`. Last 2c2a9083 09-22.
- **MetisKit package:** `MetisKit/Package.swift` V[SRC-24] and `Sources/MetisKit/{Intelligence(162),MeetingController(97) V[SRC-12],MeetingIntents(107),MeetingModels(79),Onboarding(322),SpeechTranscription(57)}`.
  Tests: `Tests/MetisKitTests/{MetisKitTests,OnboardingModelTests,PersistenceCodableTests}.swift`. The runner is `swift test`.
- **Build and QA:** `project.yml` (XcodeGen, bundleIdPrefix `com.mantu.metis`), `README.md`, `docs/QA-CHECKLIST.md`. Built by `scripts/build-native-mac.mjs` (`npm run build:native-mac`). No CI job (V: no `native-app|xcode|swift` match in `.github/workflows/`).
- **`native/mac-helper`:** `main.swift(308)` and `Info.plist`. Built by `scripts/build-mac-helper.mjs` and gated by `check-mac-helper.mjs` in mac packaging (V: `electron-builder.yml` L187–189). The Electron side is `src/main/mac-helper.ts`.

## 8. `operator/` (Cloudflare Worker portal), last fca1e6b5 09-22

- **Entry:** `src/index.ts(632)` imports `access`, `ask`, `ask-meter`, `assets`, `crm`, `crypto`, `d1`, `device-auth`, `fleet`, `geo`, `http`, `keys`, `privacy`, `redact`, `retention`, `routes/{admin-core,admin-ctx,integrations-seat,registry}`, `store`, `tiers`, `use`.
- **Config:** `wrangler.jsonc` has D1 binding `DB`, `ASSETS`, and a cron `17 3 * * *`. The production D1 id is present (last 4 digits `9f7c`). Staging has **`database_id: "REPLACE_AFTER_D1_CREATE"` (L51)**. Access team domain is set in vars (V).
- **Data:** `src/d1.ts(1010)` V[SRC-10,17], `src/store.ts(890)` V[SRC-02,17], `schema.sql`, `schema-alter.sql`.
- **Dashboard:** `src/dashboard.ts(1428)` V[SRC-10], `overview-cards(238)`, `charts(282)`, `export/{csv,tables(463),xlsx(376)}`.
- **Seat API:** `use(452)` (`/v1/use`), `ask(563)` and `ask-meter(69)` (`/v1/ask`, `/v1/chat/completions`, `/v1/messages`), `/v1/ingest`, `/v1/heartbeat`, `/v1/integrations`, `/v1/skills/manifest`, `/v1/mcp/:id`, `/v1/users/me` (V: grep of `/v1/` literals).
- **Admin:** `routes/admin-core(447)` and `groups(623)`, `sessions`, `live`, `export`, `integrations`, `settings-store`, `connectors-oauth`, plus `/v1/admin/{licenses,keys,groups,skills/{draft,approve},tiers,realtime,dashboard,export,health,…}`.
- **Security and privacy:** `access(376)` (Cloudflare Access), `device-auth(99)`, `crypto(127)`, `hmac(77)`, `keys(221)`, `vault(89)`, `privacy(91)`, `redact(201)`, `retention(120)`, `ai-gateway(28)` V[SRC-08], `cloudflare(161)`, `cloudflare-connect(247)`.
- **Connectors:** `connectors/{catalog(866),oauth(422),probe(628),gateway-token(145),data(154)}`.
- **UI:** `render/**` (server-rendered pages, `fixture.ts` 1059), `spa/**` (CSS and a generated client bundle), `client/**` (browser TS, 12 pages), `world/**` (map).
- **Scripts:** `scripts/{deploy,migrate,backup,smoke,rewrap,seed-*,build-*}.mjs`, which have contract tests. `shoey-ref/` holds reference snapshots.
- **Tests:** 94 files (`operator/vitest.config.ts`), chained into `npm test`. CI job `operator` in `build.yml` L58.
- **Absent at HEAD (V by grep):** no `/v1/decide` handler, no speech-session broker route, and no Nova-3/Deepgram/Soniox references in `operator/src` or `cloudflare-proxy/src`.

## 9. `cloudflare-proxy/`, last 14d79cdc 08-31

- `src/index.ts(422)` V[SRC-08] routes `/v1/chat/completions` and `/health` and has no local imports. Test: `src/index.test.ts(518)` (vitest `test:proxy`).
- `provision-embedded-key.mjs(150)` V[SRC-20]. `wrangler.jsonc` has observability on, and secrets are set via `wrangler secret` (names only in comments). `README.md(261)`.

## 10. `license-server/`, last 1a2fda7c 09-09

- **Server:** `server.mjs(97)` → `lib/app.mjs(886)`, which imports `csv`, `lease`, `license-gate`, `license`, `webhooks`.
- **Library:** `lib/store.mjs(143)` V[SRC-02,17] (JSON store), `lib/{audit,backups,lease(103),license(190),license-gate,webhooks(226)}.mjs`.
- **Admin and scripts:** `admin/index.html(2192)`, `scripts/{generate-license,generate-lease-keypair,backup,restore}.mjs`.
- **Deploy:** `deploy/*`, `Dockerfile`, `fly.toml`, `docker-compose*.yml`.
- **Tests:** 6 `*.test.mjs` files run by `node --test` (`package.json` V[SRC-24]). **No CI job** (V: no `license-server` match in `.github/workflows/*.yml`).

## 11. `intelligence/` (dashboard sub-project), last 3e463bb2 09-20

- **App and views:** `src/App.tsx(137)` and `views/{Briefing(479),Deal(545),Graph(941),Stats(480),Accounts(305),People(276),Meetings,Connections,Coaching,Embed}View.tsx`.
- **Libraries:** `lib/{brainAdapter(651),stand-snapshot(426),connections(184),goingCold,momentum,ledgerstats,intelligence-update,status-refresh,useDashboardData}.ts`. `brainAdapter` imports `types/data`, `goingCold`, `slug`.
- **Tests:** 11 test files, run through the root vitest include. Build: `npm run build:intelligence` / `scripts/ensure-intelligence-bundle.mjs`. Hosted by `src/main/intelligence.ts` and `src/preload/intelligence.ts` (V: names; hosting path A).

## 12. Requirement area → primary files (quick index; A unless tagged)

| Area | Primary files |
|---|---|
| Speech | `src/main/cloud-stt/*`, `src/renderer/src/lib/listen.ts`, `src/shared/cloud-stt-*`, `enterprise-live-profile`, `vad`, `metis-wake`; local ASR `whisper-*`, `parakeet*`, `apple-speech`; server side absent (§8); native `SpeechTranscription.swift`, `AudioCapture.swift` |
| Command/actions | `src/main/metis-command-*`, `metis-decide-client`, `command-control`, `application-*`, `desktop-adapters`, `mac-helper`; `src/shared/metis-command-*`, `desktop-actions`; renderer `use-command-mic`, `CommandListeningPill`, `CommandProposalCard`; `native/mac-helper`; native `MeetingIntents.swift` |
| Onboarding | `OnboardingExperience.tsx`, `Onboarding.tsx`, `lib/onboarding-*`, `public/act1-boot.js`, `onboarding-boot-gate.js`, `src/main/onboarding-exit-fallback`, `act1-dom-probe`; native `OnboardingView.swift`, `MetisKit/Onboarding.swift`; docs `ONBOARDING-*.md` |
| Right-edge dock/orb/bar | `Bar.tsx`, `RightEdgeSidecar.tsx`, `JarvisOrbButton`, `BrandThinkingOrb`, `ObsidianOrb`, `lib/{jarvis-orb,bar-pill-orb,bar-toolbar-layout,overlay-*,right-edge-dismissal-lock}`, `src/main/island/*`, `src/shared/overlay-*`, `styles.css` |
| Intelligence/knowledge | `src/main/brain/*`, `graphify.ts`, `intelligence.ts`, `recall.ts`, `transcripts.ts`; `intelligence/`; renderer `BrainView`, `Review`, `RecallView`; `src/shared/brain`, `grounding` |
| Dust | `src/main/dust-*`, `dustcli`, `llm/dust*`, `brain/publish.ts`; `src/shared/dust-validate`; `docs/verification/mi-5-dust-e2e.md` |
| Skills | `skills/**`, `src/main/mode-skills`, `operator-skill-*`, `src/shared/mode-skills{,.lock.json}`, `mode-recap`; operator `/v1/skills/manifest`, `/v1/admin/skills/*`; `scripts/lock-mode-skills.mjs` |
| Metering/portal | `operator/**`; `src/main/operator-*`, `llm/operator-ask`, `metrics`, `time-saved-log`; `src/shared/operator*`, `time-saved*` |
| Identity/Entra | `src/main/auth.ts` (MSAL), `calendar`, `outlook-write`, `license*`, `license/*`; operator `access.ts`, `device-auth.ts`, `sessions.ts`; renderer `SignInWall`, `LicenseGate`, `IdentityCard`; `license-server/` |
| Teams | Only indirect code: `graph-transcript.ts`, `calendar.ts`, Teams strings in `shared/ipc`, `transcript-align`, `operator-connectors`. **No Teams app/bot/media code** (V: `git ls-files \| grep -i teams` finds only `operator/public/logos/microsoftteams.svg`) |
| Local packs | `src/main/llm/local*`, `fm-runtime`, `asr-model-*`, `asr-bundled-ensure`, `local-model-provisioning`; `resources/**`; `scripts/fetch-*`, `check-*`, `lib/local-model-inventory.mjs`; `src/shared/local-ai` |
| Updater/release | `src/main/updater.ts`, `electron-builder*.yml`, `.github/workflows/{build,release,cahe-windows,windows-signing-identity-preflight}.yml`, `scripts/{build-installers,sign-win,verify-signing,check-release*,check-update-metadata,push-both.sh,windows-signing-identity-preflight.*}`, `build/entitlements*` |

## 13. Kit source-finding anchors (V: all 42 cited paths present at HEAD, checked with `os.path.exists` over `registry.json` `source_findings[].evidence[].path`)

| SRC | Paths |
|---|---|
| 01 | `package.json` |
| 02 | `license-server/lib/store.mjs`, `operator/src/store.ts`, `src/main/license-lease-key.ts`, `src/main/license.ts` |
| 03 | `src/main/metis-command-runtime.ts` |
| 04 | `src/main/metis-command-runtime{,.test}.ts` |
| 05 | `src/main/desktop-adapters.ts`, `src/shared/desktop-actions.ts` |
| 06 | `src/shared/metis-wake.ts` |
| 07 | `src/main/cloud-stt/credentials.ts` |
| 08 | `cloudflare-proxy/src/index.ts`, `operator/src/ai-gateway.ts` |
| 09 | `docs/CLOUDFLARE.md`, `electron-builder.yml`, `electron-builder.cahe.win.yml` |
| 10 | `operator/src/d1.ts`, `operator/src/dashboard.ts` |
| 11 | `native-app/App/Store/PersistedModels.swift` |
| 12 | `native-app/MetisKit/Sources/MetisKit/MeetingController.swift` |
| 13 | `src/main/speaker-id.ts` |
| 14 | `DESIGN.md`, `package.json`, `src/renderer/src/components/BrandThinkingOrb.tsx` |
| 15 | `DESIGN.md`, `docs/design/ONBOARDING-FLOW.md`, `src/renderer/src/lib/onboarding-hero-video.ts` |
| 16 | `THIRD_PARTY_NOTICES.md`, `docs/ENTERPRISE-DEPLOY-WINDOWS.md`, `electron-builder.yml`, `package.json` |
| 17 | `license-server/lib/store.mjs`, `operator/src/d1.ts`, `operator/src/store.ts` |
| 18 | `docs/ENTERPRISE_RELEASE.md`, `electron-builder.yml`, `scripts/push-both.sh` |
| 19 | `.gitleaks.toml` |
| 20 | `cloudflare-proxy/provision-embedded-key.mjs` |
| 21 | `docs/AUDIT-LOG.md`, `src/main/screen-capture.ts`, `src/main/screen-preprocess.ts` |
| 22 | `DESIGN.md`, `src/main/mode-skills.ts`, `src/shared/mode-recap.ts` |
| 23 | `docs/verification/mi-5-dust-e2e.md`, `src/main/brain/publish.ts` |
| 24 | `.github/workflows/build.yml`, `license-server/package.json`, `native-app/MetisKit/Package.swift`, `package.json`, `vitest.config.ts` |

The paths come from the 1.9.5 export, and their contents may have changed by 1.9.6/HEAD (for example, the SRC-04 anchors are gone). Compare hashes before reusing export line anchors.

## 14. Reference export gap (BLOCKERS.md "omits five source files"; named in `architecture/index.html` and SRC-01)

The export is `references/source/metis-1.9.5-export.txt` (10.6 MB, 1,521 sections). All five omitted files are **PRESENT** in the worktree at HEAD 2bf21f1c (V: `test -f`, `wc -l`, `shasum -a 256`, `git log -1`):

| File | Lines | sha256 (first 16) | Last commit |
|---|---|---|---|
| `src/renderer/src/App.tsx` | 4,277 | `d4d8428cb0045178` | 2bf21f1c 2026-09-23 |
| `src/main/index.ts` | 9,518 | `4ea677ea5e86e416` | fca1e6b5 2026-09-22 |
| `src/renderer/src/lib/listen.ts` | 3,153 | `dd78b5dde883d63c` | 0e9134e4 2026-09-20 |
| `src/main/transcripts.ts` | 1,272 | `edf08dcc608d2557` | 5665b724 2026-09-14 |
| `src/main/brain/ingest.ts` | 2,817 | `030afc7debca84a3` | fea4ed13 2026-09-12 |

The input gap is closed for the checkout: real sources exist, so no stubs are needed. This does not verify wiring or the build. That is still a TASK-001/004 baseline item.
The kit's own 1.9.5 file hashes were not compared (U).

## 15. Test/CI coverage owners per workspace (SRC-24; V from `package.json` and `.github/workflows/build.yml`)

| Workspace | Runner | In `npm test` | CI job |
|---|---|---|---|
| `src/**`, `scripts/**`, `intelligence/src/**` | root vitest | yes | `quality` (build.yml L22) |
| `operator/` | vitest `operator/vitest.config.ts` | yes (`test:operator`) | `quality` plus `operator` (L58, client/world build) |
| `cloudflare-proxy/` | vitest own config | yes (`test:proxy`) | `quality` |
| `license-server/` | `node --test` | **no** | **none** (V) |
| `native-app/MetisKit` | `swift test` | **no** | **none** (V) |
| `native/mac-helper` | build/check scripts only | no | inside `build-macos` packaging (A) |
| Packaging | `build-macos` (L211), `build-windows` (L360), `release.yml` (release-quality, release-macos, release-windows, release-verify) | — | — |

## 16. Numbered handoff: TASK-006…066 primary files

Each line gives the tasks, the V[SRC] anchor sets from §13 (the kit cites them for that task), and then ASSUMED extra targets.
"New" means no existing code was found, and the location is U until the owning task decides.

1. **TASK-006** Entra and service identity: V[02,17,23]. A: `src/main/auth.ts`, `operator/src/{access,device-auth,sessions}.ts`, `src/shared/operator-seat.ts`, `src/main/dust-oauth.ts`, native Keychain sign-in; new Teams/bot app registration (U).
2. **TASK-007** Canonical knowledge authority: V[11,13,23]. A: `src/main/brain/{store,corrections}.ts`, `src/shared/brain.ts`, `src/main/transcripts.ts`, `docs/design/MANTU-INTELLIGENCE.md`; kit `memory/BINDINGS.md` §2 adapters.
3. **TASK-008** Settings inventory: V[14,15,22]. A: `Settings.tsx`, `src/shared/ipc.ts` (L1497/L1628), `src/main/store.ts`, `src/shared/settings-bounds.ts`, `native-app/App/Settings/SettingsView.swift`.
4. **TASK-009** Skill contracts: V[22]. A: `skills/**`, `src/shared/mode-skills{.ts,.lock.json}`, `scripts/lock-mode-skills.mjs`, `src/main/operator-skill-{verify,key}.ts`, `operator/src/routes/{registry,admin-core}.ts`.
5. **TASK-010** Meeting API qualification (mostly documentation): A: `src/main/{calendar,graph-transcript,auth}.ts`, `docs/compliance/*`, `docs/SPEAKER-INTELLIGENCE-PLAN.md`.
6. **TASK-011** Cloudflare route/privacy: V[07,08]. A: `docs/CLOUDFLARE.md`, `operator/src/{cloudflare,cloudflare-connect}.ts`; account/gateway settings are remote (U).
7. **TASK-012** Staging and server credentials: V[07,08,09,17,19,20]. A: `operator/wrangler.jsonc` (staging placeholder at L51), `operator/scripts/{deploy,migrate,smoke}.mjs`, `cloudflare-proxy/wrangler.jsonc`.
8. **TASK-013** Logs/caches off: V[08]. A: both `wrangler.jsonc` (`observability.enabled: true`), `operator/src/http.ts`, `cloudflare-proxy/src/index.ts`.
9. **TASK-014** Speech-session broker: V[02,07,08,09,20]. A: new route in `operator/src/routes/*` plus `operator/src/index.ts` (none exists), `src/main/cloud-stt/{credentials,live-session}.ts`, `src/shared/cloud-stt-provider.ts`, `src/preload/index.ts`.
10. **TASK-015** Content-free projections: V[10,19,21]. A: `src/main/{logger,operator-ingest,operator-queue,metrics}.ts`, `src/shared/redact.ts`, `operator/src/{redact,retention,privacy}.ts`.
11. **TASK-016** Nova-3 transport: V[07,08]. A: `src/main/cloud-stt/{adapter,live-session,pcm}.ts`, `src/shared/cloud-stt-*.ts`; new server relay (operator vs cloudflare-proxy is U).
12. **TASK-017** Audio broker: V[06,12,13]. A: `lib/listen.ts`, `lib/{whisper-worklet-src,pcm-format,use-command-mic}.ts`, `src/main/listening-state-ipc.ts`, `native-app/App/AudioCapture.swift`.
13. **TASK-018** Segment revision/reconnect: V[06,10,12,13,22]. A: `src/main/cloud-stt/{live-session,session-replacement}.ts`, `src/shared/{cloud-stt-line-map,transcript-align}.ts`, `lib/{listen,transcript}.ts`.
14. **TASK-019** Local wake and stop: V[04,05,06]. A: `src/main/{command-control,listening-state-ipc}.ts`, `lib/use-command-mic.ts`, `CommandListeningPill.tsx`; new local wake detector (U).
15. **TASK-020** Synthetic speech proof: V[07,08]. A: `src/main/cloud-stt/*.test.ts`, `scripts/qa/*`; evidence in the exec dir.
16. **TASK-021** Hardware and model catalog: V[16]. A: `src/main/llm/local-models.ts`, `src/main/asr-model-manifest.ts`, `src/shared/{asr-hardware-preference,local-ai}.ts`, `resources/runtime-assets-manifest.json`, `scripts/lib/local-model-inventory.mjs`.
17. **TASK-022** Local-model Settings: V[22]. A: `Settings.tsx`, `src/shared/ipc.ts`, `src/main/store.ts`, `src/main/llm/local-model-download.ts`, `src/main/asr-model-download.ts`.
18. **TASK-023** Signed manifests and R2: V[09,16]. A: `resources/runtime-assets-manifest.json`, `src/main/{asr-model-manifest,operator-skill-verify}.ts`, `src/main/llm/local-models.ts`; new R2/Worker (U).
19. **TASK-024** Component lifecycle: V[15,16]. A: `src/main/{asr-model-download,asr-bundled-ensure,parakeet-extract,parakeet-extract-host}.ts`, `src/main/llm/local-model-download.ts`, `scripts/{zip-extract,tar-bz2-extract}.mjs`.
20. **TASK-025** Model load rules: V[16]. A: `src/main/llm/{local-runtime,fm-runtime,local-routing,local}.ts`, `src/main/{import-memory-pressure,whisper-asr-host,parakeet-asr-host}.ts`.
21. **TASK-026** Lean core: V[09,15,16]. A: `package.json` prepack/predist/dist chains, `scripts/{fetch-*,check-*,embed-cloudflare-key}.mjs`, `resources/**`, `src/main/{embedded-cloudflare-*,cahe-*}.ts`.
22. **TASK-027** Onboarding and P1s: V[07,09,11,15,16,18]. A: `src/main/index.ts` (L1491/L2064), `OnboardingExperience.tsx`, `Onboarding.tsx`, `lib/onboarding-*.ts`, `public/{act1-boot,onboarding-boot-gate}.js`, `src/main/onboarding-exit-fallback.ts`, `src/main/store.ts`.
    **#197 lineage (V):** `7d684b24` "ignore stale ELECTRON_RENDERER_URL when packaged (GH #197)" touches `src/main/index.ts` and `src/renderer/src/lib/onboarding-boot.test.ts`. It is **not an ancestor of HEAD** and appears only in `refs/remotes/origin/claude/dock-three-fixes`. No `#196/#197` subject exists in HEAD history.
23. **TASK-028** Right-edge usability: V[14,22]. A: `RightEdgeSidecar.tsx`, `Bar.tsx`, `lib/{right-edge-dismissal-lock,bar-toolbar-layout,overlay-*}.ts`, `src/main/island/*`, `src/shared/overlay-*`, `styles.css`.
24. **TASK-029** Native Mac foundation: V[05,11,12,13,14,24]. A: `native-app/{App,MetisKit}/**`, `native-app/project.yml`, `scripts/build-native-mac.mjs`, `native/mac-helper/main.swift`.
25. **TASK-030** Orb, beam and caption: V[14,15]. A: `Bar.tsx`, `JarvisOrbButton.tsx`, `ObsidianOrb.tsx`, `lib/{jarvis-orb,bar-pill-orb}.ts`, `CommandListeningPill.tsx`, `src/shared/overlay-orb.ts`, `native-app/App/UI/*`.
26. **TASK-031** Jev gateway: V[03] (`void result` at L235). A: `src/main/metis-decide-client.ts`; new `/v1/decide` in `operator/src/routes/*` (absent, V); `operator/src/{vault,keys}.ts`.
27. **TASK-032** Laya alternative: V[03]. A: `metis-decide-client.ts`, `operator/src/{routes/*,tiers.ts}`, `Settings.tsx`; the serving environment is outside the repo (U).
28. **TASK-033** Native/browser actions: V[03,04,05,06,21]. A: `src/main/{application-*,command-control,mac-helper}.ts`, `native/mac-helper/main.swift`, `MeetingIntents.swift`, `CommandProposalCard.tsx`.
29. **TASK-034** Identity and metering: V[02,10,17,21]. A: `src/main/{operator-ingest,operator-queue}.ts`, `operator/src/{use,ask-meter,sessions,fleet}.ts`, `operator/schema*.sql`, `src/shared/operator*.ts`.
30. **TASK-035** Canonical knowledge service: V[11,23]. A: `src/main/brain/{store,corrections,ingest}.ts`; service host is U (BINDINGS.md says use the existing services); kit `memory/src/*.mjs`.
31. **TASK-036** Wiki/graph projections: V[23]. A: `src/main/graphify.ts`, `resources/graphify_runner.py`, `src/main/brain/intelligence-index.ts`, `intelligence/scripts/build-data.mjs`.
32. **TASK-037** Evidence context builder: V[22,23]. A: `src/main/brain/{context,match-key-cache}.ts`, `src/shared/grounding.ts`, `src/main/recall.ts`.
33. **TASK-038** Dust reads: V[23]. A: `src/main/llm/dust.ts`, `src/main/{dust-oauth,dust-projects,dustcli}.ts`, `operator/src/routes/mcp-gateway.ts`, `operator/src/connectors/*`.
34. **TASK-039** Dust writes: V[23]. A: `src/main/brain/corrections.ts`, `src/main/mcp/{write-tools,pushQueue}.ts`, `src/main/llm/dust.ts`.
35. **TASK-040** Intelligence workspace: V[03,22,23]. A: `intelligence/src/**`, `src/main/intelligence.ts`, `src/preload/intelligence.ts`, `BrainView.tsx`, `Review.tsx`, `metis-decide-client.ts` (intel_rank/intel_score).
36. **TASK-041** Sync/deletion loops: V[23]. A: `src/main/brain/{corrections,store}.ts`, `src/main/{graphify,transcripts}.ts`, `operator/src/retention.ts`.
37. **TASK-042** Server skill publishing: V[22]. A: `operator/src/routes/{registry,admin-core}.ts` (`/v1/admin/skills/{draft,approve}`), `operator/src/crypto.ts`, `src/main/operator-skill-verify.ts`, `skills/**`.
38. **TASK-043** Server skill execution: V[22]. A: new operator execution route (U), `src/main/mode-skills.ts`, `src/shared/mode-skills.ts`.
39. **TASK-044** Skill catalog and receipts: V[22]. A: `Settings.tsx`, `ModePicker.tsx`, `ModeRecap.tsx`, operator `/v1/skills/manifest`, `native-app/App/**`.
40. **TASK-045** Portal totals and UX: V[02,10,17]. A: `operator/src/{overview-cards,charts}.ts`, `operator/src/render/pages/*`, `operator/client/**`, `operator/src/{routes/export,export/*}.ts`.
41. **TASK-046** Teams surfaces: no existing code (V, §12). A: new Teams package (U), `src/main/auth.ts`, `operator/src/access.ts`.
42. **TASK-047** Meeting discovery: A: `src/main/{calendar,auth}.ts`; new subscription service (U).
43. **TASK-048** Join coordination: A: new service (U); no repo code.
44. **TASK-049** Teams media receiver: A: new Azure/.NET receiver outside this repo (U).
45. **TASK-050** Teams media to speech: A: the TASK-014 broker route, `src/shared/cloud-stt-*.ts`.
46. **TASK-051** Post-meeting alternatives: A: `src/main/{graph-transcript,calendar}.ts`, `operator/src/connectors/catalog.ts`.
47. **TASK-052** Audience-safe publishing: A: `src/main/brain/{publish,ingest}.ts`, `src/main/mcp/write-tools.ts`, `src/main/outlook-write.ts`.
48. **TASK-053** Fidelity/latency harness: V[06,12,13,24]. A: `scripts/qa/asr-fixtures/**`, `scripts/evals/**`, `scripts/bench-asr-ttfc.mjs`, `src/shared/asr-latency.ts`, `docs/asr/QUALITY.md`.
49. **TASK-054** Summaries without cloud copies: V[11,12,21,22,23]. A: `src/main/{import-recap,graphify,transcripts}.ts`, `src/main/brain/ingest.ts`.
50. **TASK-055** Full meeting/Dust/skill journey: V[14,23]. A: evidence only; `scripts/qa/e2e-workflows.mjs`.
51. **TASK-056** Cross-platform journeys: V[03,04,05,10,12,24]. A: `scripts/qa/**`; evidence only.
52. **TASK-057** No-retention gates: V[07,08,13,19,21,24]. A: `operator/src/{privacy,retention,redact}.ts`, `scripts/ci-secret-scan.contract.test.ts`.
53. **TASK-058** Governance/subject rights: V[11,13,21]. A: `docs/compliance/**`, `src/main/transcripts.ts`, `src/main/brain/corrections.ts`, `operator/src/retention.ts`.
54. **TASK-059** Local packs on devices: A: `src/main/llm/{local-*,fm-runtime}.ts`, `src/main/asr-*.ts`, `scripts/prove-local-ttft.mjs`, `scripts/evals/local-recap*`.
55. **TASK-060** Speed/footprint: V[14,16]. A: `electron.vite.config.ts` (lazy chunks), `App.tsx`, `lib/listen.ts`, `src/main/index.ts`.
56. **TASK-061** Refactoring: V[19,24]. A: oversized files `src/main/index.ts` (9,518), `Settings.tsx` (9,377), `App.tsx` (4,277), `lib/listen.ts` (3,153), `brain/ingest.ts` (2,817), `shared/ipc.ts` (2,407), `Review.tsx` (1,928), `OnboardingExperience.tsx` (1,921). The refactoring skill is NOT_PROVIDED (kit BLOCKERS). Refresh this map after each slice.
57. **TASK-062** Production ops: V[02,08,10,17,18,19,20,24]. A: `operator/scripts/{deploy,migrate,backup,smoke,rewrap}.mjs`, `operator/wrangler.jsonc`, `operator/schema*.sql`, `docs/operator/RUNBOOKS.md`.
58. **TASK-063** Build/sign/freeze: V[02,04,09,14,15,16,18,19,24]. A: `.github/workflows/release.yml`, `scripts/{build-installers,sign-win,verify-signing,check-release,check-release-secrets}.mjs`, `electron-builder.win.yml`, `build/entitlements*`.
59. **TASK-064** Windows publish: V[18]. A: `release.yml` (release-windows, release-verify), `scripts/windows-signing-identity-preflight.*`, `src/main/updater.ts`, `electron-builder.yml` publish (L319–326).
60. **TASK-065** Native Mac QA/publication: V[05,11,12,24]. A: `native-app/**`, `native-app/docs/QA-CHECKLIST.md`, `scripts/build-native-mac.mjs`, `build/entitlements.mas*.plist`.
61. **TASK-066** Final re-audit: V[01,18,24]. A: exec-dir evidence plus this map re-run against the final SHA.

## 17. Unknown / not available

- **Structural index:** no graphify-out. Tooling is available but was not run (§1).
- **Hosting and remote state:** the hosting location for new server components (speech broker, `/v1/decide`, canonical knowledge, Teams services, R2 manifests) is U. So is the deployed state of Operator, proxy and license-server; this lane made no remote calls.
- **Line anchors:** 1.9.5 export hash comparison against HEAD was not performed (U). The export line anchors may be stale, as shown by SRC-04.
- **Collaborator lists:** built from direct local imports only. Runtime IPC wiring between renderer and main was not traced per channel (A).
