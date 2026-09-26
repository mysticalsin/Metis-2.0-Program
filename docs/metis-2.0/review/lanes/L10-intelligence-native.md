# Lane L10 — intelligence-native — AUDIT report

Reviewer: senior staff engineer (AUDIT mode, read-only). Repo: `/Users/tony/AI-Brain-build/metis-2.0`
(read-only checkout of `origin/main` @ `2bf21f1c`, v1.9.6). Lane scope: `intelligence/` (9.3K LOC
standalone Vite/React sub-app), `native-app/` (MetisKit Swift package + SwiftUI shell + XcodeGen),
`native/` (mac-helper Swift sidecar), `resources/` (binary asset manifest), `skills/`.

No edits were made anywhere in the repo or any kit directory. All line numbers below were read directly
from the files cited; none are invented.

---

## 0. Executive summary

This lane is the healthiest part of the codebase I could observe: both the TypeScript sub-app
(`intelligence/`) and the Swift code are unusually well-commented, with inline "why" rationale for
almost every non-obvious decision, no force-unwraps, and (in `intelligence/src/lib/`) 100% paired
test coverage. The security posture of the Electron↔dashboard boundary (`src/main/intelligence.ts`,
`src/preload/intelligence.ts`) is genuinely careful (Private View, single-document IPC gate, denied
navigation, sandboxed contextIsolation preload).

The real problems are structural, not sloppy-code problems:

1. **The Swift/native "kit blocker" is real and worse than "no CI"**: MetisKit (the shared logic core —
   824 LOC, 26 passing tests) is never run by any CI job despite `native-app/README.md` explicitly
   claiming it "builds and tests on Linux/CI too." The SwiftUI app shell (`native-app/App/`, 1291 LOC,
   0 tests) is never even *compiled* by CI — the only script that can build it (`build-native-mac.mjs`)
   is wired to a manual-only npm command. (§2)
2. **The intelligence dashboard and the Electron overlay maintain two independently-drifted copies**
   of the same "Update Intelligence" feature (component + state machine), with no shared package and
   no equivalence test between them. (§4)
3. **The one place in `intelligence/` that breaks the codebase's own strong test discipline is the
   `views/` and `components/` directories** — real business logic (deal-risk classification, going-cold
   fade rules, ROI-scope merging, cross-community bridge detection's *caller*) is written inline in
   1000-line view files with zero tests, right next to a `lib/` folder where the identical class of
   logic is 100% tested. (§3)
4. `native/mac-helper/main.swift` (the shipped OCR/transcribe/screen-metrics/frontmost-watcher sidecar)
   *is* compiled and architecture-checked in CI, which is better than I expected going in — but it has
   zero behavioral tests, and the TypeScript module that talks to it says outright, in its own header
   comment, that it was written without ever compiling the Swift side. (§5)

None of this lane's findings are the direct, proven cause of Tony's two bug reports ("heavy on the PC",
"History sometimes doesn't reopen") — those symptoms trace mostly to the local-LLM/sidecar-lifecycle
code in `src/main/llm/` and `src/main/index.ts`, which is outside this lane. Where this lane's code
*could* plausibly contribute, I've labeled it DERIVED/plausible, not OBSERVED-causal.

---

## 1. Architecture map (what's actually here)

```
intelligence/                 standalone Vite+React+TS workspace (own package.json, own npm install)
  package.json                name: "deal-psychology-dashboard" (leftover from the single-deal prototype — see §6)
  src/lib/*.ts (+ .test.ts)    pure logic: brainAdapter, bridges, connections, ledgerstats, momentum,
                               slug, sha256, status-refresh, intelligence-update, stand-snapshot —
                               EVERY file here has a paired *.test.ts (11 test files for 11-ish modules)
  src/views/*.tsx              10 route views (GraphView 941 LOC is the largest), 0 test files, 3467 LOC
  src/components/*.tsx         9 shared components, 0 test files, 711 LOC
  scripts/build-data.mjs       dev-only generator of public/data.json from Tony's own vault
                               (hardcoded to bidId 'latam-sap-ams' and a literal OneDrive path) — never
                               shipped; gitignored output; confirmed unreachable from the packaged app
                               (useDashboardData.ts throws rather than falling back to it under file://)
  scripts/going-cold.smoke.mjs "npm run smoke" in intelligence/package.json — never invoked by any CI
                               job or root script (confirmed by grep across .github/workflows + package.json)

native-app/                    a SEPARATE, not-yet-shipped product ("roadmap steps 1-4"), not an Electron
                               port — native SwiftUI + Apple Intelligence + App Intents/Siri
  MetisKit/                    Swift package, platform-neutral core, `swift test` = 26 green tests
    Sources/MetisKit/*.swift   824 LOC: Intelligence.swift, MeetingController.swift, MeetingIntents.swift,
                               MeetingModels.swift, Onboarding.swift, SpeechTranscription.swift
    Tests/MetisKitTests/*.swift 358 LOC, 26 `func test...` (verified by grep, matches README's claim)
  App/                          SwiftUI shell depending on MetisKit, 1291 LOC, 0 test files
    AudioCapture.swift, ContentView.swift, MetisApp.swift, History/, Onboarding/, Permissions/,
    Settings/, Store/, UI/
  project.yml                   xcodegen spec; `cd native-app && xcodegen generate && open Metis.xcodeproj`

native/mac-helper/main.swift   SHIPPED sidecar (309 LOC, single file, compiled by scripts/build-mac-helper.mjs,
                               invoked from src/main/mac-helper.ts). watch-frontmost / ocr / transcribe /
                               screen-metrics subcommands. No test file anywhere in the repo for this file.

resources/                     asset MANIFEST only in this checkout (asr/, local-llm/, models/, ort/ are
                               0 bytes locally — populated at build time by scripts/fetch-*.mjs against
                               sha256 pins in runtime-assets-manifest.json). Matches runtime evidence E1's
                               installed sizes (local-llm 3.3 GB, asr-models 640 MB) — those are fetched,
                               not committed.

skills/                        prompt-only Markdown mode files (caveman, humanizer, modes/*) — no code,
                               nothing to review on the five axes; not discussed further.
```

**How the Intelligence dashboard is embedded (traced end to end):**
- Build: root `package.json` `predist`/`prebuild` → `scripts/ensure-intelligence-bundle.mjs` →
  `npm run build:intelligence` = `cd intelligence && npm ci --prefer-offline && npm run build` (`tsc -b`
  then `vite build`), output `intelligence/dist/`.
- Package: `electron-builder.yml:76-77` copies `intelligence/dist` → `Resources/intelligence` in the
  packaged app.
- Load: `src/main/intelligence.ts:43-50` resolves `index.html` by trying, in order, the packaged path,
  the `out/` dev path, and the `electron .` dev path — falls back to a clear user-facing error
  ("run `npm run build:intelligence`") rather than a blank window if none exist (`openIntelligenceWindow`,
  line 117-122). This is exactly the "forgotten `build:intelligence` left Tony with a red banner" bug the
  file's own top comment (line 4-5) documents fixing.
- Security: dedicated `BrowserWindow` (not the overlay), `sandbox: true`, `contextIsolation: true`,
  `nodeIntegration: false`, Private View mirrored (`intelCpOn()`, line 13-14), all renderer-initiated
  navigation denied (`will-navigate` → `preventDefault()`, line 165), external links forced to the real
  browser (line 157-159), and `isIntelligenceSender()` (line 34-41) double-checks the sender's *document
  URL* on top of the webContents identity check before any IPC handler in `index.ts` trusts it. This is
  genuinely careful work — no finding here.
- Preload: `src/preload/intelligence.ts` exposes exactly four calls (`getData`, `getStatus`, `backfill`,
  `runPass`, `fieldDecision`) — a deliberately tiny surface, with a documented reason (line 10-14) for
  using string channel literals instead of importing the shared zod IPC module (avoids a shared Rollup
  chunk a sandboxed preload can't `require()`). No finding here either.

---

## 2. Swift/native CI — the confirmed blocker

**Claim under test:** "absence of CI for swift/native (kit blocker)".

**Verification method:** grepped every `.github/workflows/*.yml` (`build.yml`, `release.yml`,
`cahe-windows.yml`, `windows-signing-identity-preflight.yml`) and every `.mjs`/`.sh`/`.json` in the repo
for `swift test`, `swift build`, `xcodebuild`, `xcodegen`, `MetisKit`, `native-app`.

**Result — confirmed, with an important nuance (three different truths for three different pieces):**

| Piece | Built in CI? | Tested in CI? | Evidence |
|---|---|---|---|
| `native/mac-helper/main.swift` (shipped sidecar) | **Yes** — compiled for both `arm64`/`x86_64` slices via `scripts/build-mac-helper.mjs` (`xcrun swiftc -O ...`), called from `predist` in `package.json`, which `build-macos` in `.github/workflows/build.yml:211-350` runs via `npm run dist`. Arch + embedded-Speech-privacy-plist checked by `scripts/check-mac-helper.mjs`. | **No** — no unit/behavioral test exists or runs for it anywhere. | `scripts/build-mac-helper.mjs:1-113`, `scripts/check-mac-helper.mjs:1-66`, `.github/workflows/build.yml` grep hits at lines 211-350 |
| `native-app/MetisKit` (shared logic package, 26 tests) | **No** — `grep -n "MetisKit\|swift test\|swift build\|swiftpm" .github/workflows/*.yml` returns **zero** matches. | **No** — same. | grep run against all four workflow files, zero hits |
| `native-app/App` (SwiftUI shell) | **No** — the only script capable of building it, `scripts/build-native-mac.mjs`, runs `xcodegen generate` then `xcodebuild ... build` (line 121-148), and is reachable only via `npm run build:native-mac` / `npm run package:native-mac:local` in `package.json`. Neither string appears anywhere in `.github/workflows/*.yml` (grep confirmed). | **No** — `build-native-mac.mjs` never passes `test` as the xcodebuild action (line 145: `'build'`, not `'test'`), so even a manual run doesn't exercise tests. | `scripts/build-native-mac.mjs:99-170`, workflow grep |

**Why this matters more than a generic "add CI" note:** `native-app/README.md:3-4` states, as a
present-tense fact: *"`MetisKit` builds + **26 tests green** — and now builds and tests **on Linux/CI**
too (Swift 6.0.3), not only the macOS SDK."* I verified the test count is accurate — `grep -c "func test"`
across the three test files sums to exactly 26 — so someone really did run `swift test` locally and it
passed. But there is no CI job anywhere in this repository that would re-run it. This is a **documentation
claim that is false about *this* repository's automation**: anyone reading the README (a new engineer, a
release-readiness reviewer for v2.0) would reasonably conclude MetisKit changes are guarded by CI. They
are not. A regression in `MeetingController.swift`, `Intelligence.swift`, or `Onboarding.swift` — all of
which the (unshipped, but roadmap-committed) native app depends on for 100% of its meeting/AI logic —
can land on `main` with the local test suite silently broken and nothing catching it.

**Fix direction:** add a `metiskit` job to `.github/workflows/build.yml` running `swift test` inside
`native-app/MetisKit` (macos-latest at minimum; if the Linux/CI claim in the README is literally true for
Swift 6.0.3, an `ubuntu-latest` job is cheaper and should be tried first, with a macOS fallback if any
Apple-only API leaks past the `#if canImport` guards). Separately, add a compile-only job for
`native-app/App` (`xcodegen generate && xcodebuild -scheme Metis -destination 'generic/platform=macOS'
build`) gated the same way `build-macos` is (only on push-to-main/PR/dispatch, per the existing cost-gate
comment at `build.yml:213-224`), so the SwiftUI shell can't silently rot while roadmap work continues.
This should NOT be folded into the release-critical `build-macos`/`dist` chain — it's unshipped code and
its own failures shouldn't block the Electron release pipeline; it needs an independent, non-blocking-at-
first gate.

---

## 3. `intelligence/` — testability gap in `views/` and `components/`

**Observed:** `intelligence/src/lib/*.ts` has a `.test.ts` file for essentially every module (11 test
files: `brainAdapter`, `bridges`, `connections`, `dashboard-state.contract`, `intelligence-update` ×2,
`ledgerstats`, `momentum`, `slug`, `stand-snapshot`, `status-refresh`). **`intelligence/src/views/`
(3467 LOC across 10 files) and `intelligence/src/components/` (711 LOC across 9 files) have zero test
files between them** (confirmed by `find intelligence/src -type f` — no `views/*.test.tsx` or
`components/*.test.tsx` exist).

This wouldn't be worth flagging if the views were pure JSX. They aren't — real, non-trivial business
logic is written and left untested directly inside view components, in exactly the style the `lib/`
directory shows the team otherwise disciplined about extracting and testing:

- `intelligence/src/views/GraphView.tsx:115-128` — `mergeSummaries()`, merging per-currency deal totals
  and band counts across every account summary. Untested.
- `intelligence/src/views/GraphView.tsx:204-210` — `nodeVisible()`, the combined AND-filter (account ∩
  sector ∩ community ∩ win-band) that decides what's actually drawn on the canvas. Untested.
- `intelligence/src/views/GraphView.tsx:59-109` — `buildNodeItem`/`buildEdgeItem`/`edgeFade`/`edgeKey`,
  which encode the going-cold opacity rules (line 51: fresh=1, cooling=0.72, cold=0.42) and the
  EXTRACTED-vs-inferred edge styling. Untested.
- `intelligence/src/views/DealView.tsx:79` — `dealRisk(commitments, node)`, the function that classifies
  a deal's structural relationship risk. Untested.

**Why this is a real (not cosmetic) finding:** every one of these functions is exactly the shape of logic
the codebase's own convention (100% of `lib/`) says belongs in a tested module. The going-cold fade
thresholds, the AND-filter semantics, and the deal-risk classification are the kind of "quiet regression"
that a view refactor (moving JSX around, renaming a prop) can silently break without any test noticing —
and `GraphView.tsx` in particular is the single largest file in the lane (941 lines) and the one the audit
brief called out by name for performance.

**Fix direction:** extract `mergeSummaries`, `nodeVisible`, `buildNodeItem`/`buildEdgeItem`/`edgeFade`, and
`DealView`'s `dealRisk`/`personNodeId`/`accountNodeId` into `intelligence/src/lib/graph-view.ts` and
`intelligence/src/lib/deal-view.ts` respectively, with `.test.ts` files mirroring the existing ones. Low
risk (pure functions, no React), mechanical, and it's the one refactor in this lane that would bring
`views/` up to the standard `lib/` already sets.

---

## 4. GraphView performance — what's solid, what's unverified, what's a real gap

The audit brief specifically asked me to focus here, so I read the whole 941-line file plus its data
source (`intelligence/src/lib/useDashboardData.ts`) end to end.

**What's already well-engineered (no finding):**
- The vis-network `Network`/`DataSet` pair is created **once**, in a mount-only effect
  (`GraphView.tsx:243-308`, deliberately empty deps array with a documented reason at line 305-307).
  Data changes are reconciled in place via `DataSet.update()`/`.remove()` (line 314-357) instead of
  destroying and rebuilding the canvas — the file's own comments (line 214-215, 310-313) describe exactly
  the flicker/pan-reset bug this replaced.
- `graphSignature` (line 216-222) is a cheap content hash so a poll tick that reloads an *equivalent*
  graph into a new object is a no-op, not a re-render trigger.
- Physics is disabled after first stabilization (line 277-279) and only re-enabled when a real new
  node/edge id arrives (line 343-355), not on every metadata tweak (freshness/band changes flow through
  `DataSet.update()` with physics left off).
- The polling layer (`useDashboardData.ts`) separates a **cheap status poll** (2s interval,
  single-flighted so overlapping requests coalesce — `status-refresh.ts:20-48`) from a **full data
  reload**, which only fires on an actual revision change, a backfill/ingest/index transition settling, or
  a 30-minute staleness floor (`shouldReloadForBrainStatus`, `status-refresh.ts:87-105`). This is a
  sensible design — it does not reload the whole dashboard (and hence rebuild-reconcile the graph) on
  every 2s tick.

**Real gap (P2, unverified — not "confirmed broken"):** the live re-stabilization path
(`GraphView.tsx:343-355`) re-enables `forceAtlas2Based` physics with **no iteration or time cap**, unlike
the constructor's bounded `stabilization: { iterations: 200, fit: true }` (line 268). It runs until
vis-network's own `'stabilized'` event fires, whatever that takes for the current node/edge count and
density. There is no test (nor any dataset in the repo) exercising this at a realistic multi-account,
multi-deal, multi-person scale, so its CPU behavior under real growth is unverified either way — I did
not find evidence it *is* a problem, only that nothing prevents it from becoming one, and nothing would
tell you if it had.

**Relation to Tony's "heavy on the PC" report (DERIVED, not confirmed):** the Intelligence window is
opened on demand (`openIntelligenceWindow`, not launched at boot), so it is very unlikely to be the
primary cause of E1/E2's steady-state weight (that's dominated by the always-running local-LLM sidecar,
which is a different lane). It is a plausible secondary contributor *only* in the specific case where a
user has the window open while a backfill burst lands (E4's ~20-ingest bursts within 200ms) and the
resulting single revision-change reload triggers one uncapped resimulation — a real but narrow window,
not the steady-state drain E1 describes.

**Minor (P3):** the "Relationship risk" (line 662) and "Connectors" (line 693, though `findBridges`
itself is called with `limit = 6` at line 200/60) sidebar lists render every matching node with no cap —
"Going cold" is explicitly `.slice(0, 6)` (line 629) but "Relationship risk" is not. At realistic scale
(hundreds of single-threaded deals) this is an unbounded scrollable DOM list, not a crash risk, just an
inconsistency with the pattern the rest of the sidebar follows.

**`lib/bridges.ts` complexity (no finding):** `findBridges` (`bridges.ts:60-102`) is O(V+E) — one pass to
build an undirected adjacency map, one pass over nodes checking neighbor community membership via a
`Map`/`Set`, then a single sort of the (typically small) bridge list. This scales fine.

---

## 5. `native/mac-helper` and the Electron↔Swift coupling

`native/mac-helper/main.swift` (309 LOC) is the one piece of Swift in this lane that actually ships to
users today (via `electron-builder.yml:187-192`, `Resources/mac-helper`). Four subcommands: `watch-frontmost`
(long-running, `RunLoop.main.run()`, line 57-69), `ocr` (one-shot Vision text recognition, line 85-135),
`transcribe` (one-shot on-device `SFSpeechRecognizer`, line 144-214), `screen-metrics` (one-shot
`NSScreen` enumeration for notch/menu-bar geometry, line 246-286).

**Code quality:** clean. No force-unwraps or `try!`/`as!` anywhere in this lane's Swift (`native/`,
`native-app/App/`, `native-app/MetisKit/Sources`) — I grepped for both patterns and found none. The
`transcribe` subcommand's run-loop-pump-with-deadline pattern (line 161-179, 200-207) for waiting on an
undocumented-queue completion handler is a genuinely careful choice, with the reasoning for *not* using a
semaphore spelled out in the comment (avoids a main-thread deadlock risk).

**Coupling to Electron (the thing this lane was asked to focus on):** `src/main/mac-helper.ts` is the
one-way gateway — it resolves the binary path per packaged-vs-dev run (`macHelperPath()`, line 71-74),
degrades to `null`/`false` on any missing-helper or spawn/timeout/malformed-JSON failure (documented
contract at line 17-19, enforced at every `settle(null)` call site), and validates the JSON payload
against a `zod` schema (`ScreenMetricsResultSchema`, line 100-110) before trusting it. This is a sound,
defensive boundary — a broken or missing Swift binary degrades a feature, it doesn't crash anything.

**The one thing worth calling out explicitly:** `src/main/mac-helper.ts:21-24`'s own header comment says,
verbatim: *"this VM has no macOS/Xcode/Swift toolchain, so the Swift side of screen-metrics
(native/mac-helper/main.swift) is written and reasoned about but NOT compiled or run here. It needs a
real on-Mac build + manual QA pass ... before it can be trusted in production."* That comment is itself
first-hand evidence of the exact gap §2 diagnoses from the outside: Swift changes in this lane get written
and merged without their author ever having compiled them. The macOS CI job (§2's table) does compile
`main.swift` before packaging, which catches syntax/type errors — but there is still no behavioral test
of, e.g., the OCR box-sorting math (`buildOcrContext`, `mac-helper.ts:178-189`, which reads the *paired*
Swift-side box coordinates) or the notch-width arithmetic (`main.swift:252-261`) against a known-good
fixture.

**`watch-frontmost` lifecycle (context, not a lane-specific defect):** the long-running child this
subcommand starts is torn down by `screenPreprocess.stop()` on both the normal `will-quit` path
(`src/main/index.ts:9497-9502`) and the hard-exit path used by the emergency force-quit accelerator
(`stopSidecarsForHardExit`, `index.ts:4160-4171`). Both paths require the Electron main process to still
be alive and running its own JS to fire the kill — neither can help if the whole app is SIGKILL'd
externally (Activity Monitor, `killall`, an OS-level force-quit) or if `will-quit` never gets a chance to
run because the main process itself is wedged. That structural limitation is the same shape as runtime
evidence E2's orphaned `llama-server` processes, but E2's specific processes are a different subsystem
(`src/main/llm/`, outside this lane) — I'm noting the shared failure mode here because `native/` was in
my scope, but the fix (a reaper independent of the Electron process, or an OS-level launchd/job-object
watchdog) is an Electron-main-process/process-lifecycle concern, not a `native/` code change.

---

## 6. `native-app/App` (SwiftUI shell) — roadmap code, read honestly

This is explicitly unshipped, WIP code (`native-app/README.md` calls it "roadmap steps 1-4 in progress");
I read it to characterize what "done" would need to mean for v2.0, not to imply it's broken in production
(it has no production users yet).

**Reviewed for quality — genuinely good:** `MeetingController.swift` (97 LOC) is a clean, well-isolated
`@Observable @MainActor` class with a documented reason for every non-obvious choice (e.g., `[weak self]`
in the transcript-drain task at line 52-57, idempotent `startRecording`/`stopRecording` guards at line 78,
84). `PermissionsService.swift` correctly handles the macOS "Screen Recording grant only applies on next
launch" nuance (line 58-60) with an explicit relaunch helper (`AppRelaunch.relaunch()`, line 111-121).

**Two silent-failure spots worth flagging preventively (P2, since this is pre-ship code — the value is
catching the pattern before it reaches users, not reporting a live incident):**
- `native-app/App/Store/PersistedModels.swift:59` — `try? context.save()` inside `MeetingStore.save()`.
  If SwiftData's save throws (disk full, schema migration issue), the function still returns a non-nil
  `StoredMeeting` and the UI proceeds as if the meeting were safely persisted — there is no error surfaced
  anywhere up the call chain (`ContentView.swift:185` calls `MeetingStore.save(...)` and ignores its
  return value entirely).
- `native-app/App/ContentView.swift:184,189` — `try? await controller.stopRecording()` /
  `try? await controller.startRecording()` inside `toggleRecording()` (line 181-193). If audio start/stop
  throws (e.g., `AVAudioEngine.start()` failing), the Record button still flips state and `errorText` (the
  state var the UI already has, and does use for the three AI actions via `run()`, line 201-209) is never
  set for this specific failure — the user would see "Stop"/"Record" toggle with no transcript and no
  visible reason why.

Both are exactly the "looks like it worked, actually silently failed" shape behind Tony's Electron bug
reports (E3: repeated force-quits with no clean-shutdown event in between; E6: crash records after a
render-process-gone event). Flagging now, while this is still pre-ship roadmap code, is cheaper than
finding it again after native ships.

---

## 7. Small hygiene items (P3)

- `intelligence/package.json:2` — `"name": "deal-psychology-dashboard"`. This is the literal name of the
  single-deal prototype this sub-app started as (see `intelligence/scripts/build-data.mjs:14`, still
  hardcoded to `bidId = 'latam-sap-ams'` and a literal path under Tony's own OneDrive vault). The script
  is dev-only, its output is gitignored, and it's provably unreachable from the packaged app
  (`useDashboardData.ts:54-56` throws rather than falling back to `data.json` under `file://`) — so this
  is not a shipped-code risk, just a naming/hygiene cleanup worth doing as part of the v2.0 pass so the
  package name matches what the sub-app actually is now (a general multi-account/deal dashboard, not a
  single-deal one).
- `intelligence/package.json:11` (`"smoke": "node --experimental-strip-types scripts/going-cold.smoke.mjs"`)
  is never invoked by any CI job or root `package.json` script (grep confirmed against both). A written
  smoke test nobody runs is worse than no smoke test — it invites false confidence the next time someone
  sees it in the file list.

---

## Coverage ledger (what I did and didn't inspect)

**Inspected directly, line-by-line:** `scripts/ensure-intelligence-bundle.mjs` (full); `src/main/intelligence.ts`
(full); `src/preload/intelligence.ts` (full); `intelligence/src/views/GraphView.tsx` (full, all 941 lines);
`intelligence/src/lib/useDashboardData.ts`, `status-refresh.ts`, `bridges.ts` (full); `intelligence/src/lib/intelligence-update.ts`
and its renderer-side counterpart (diffed); `intelligence/src/components/IntelligenceUpdateButton.tsx` and its
renderer-side counterpart (diffed); `intelligence/scripts/build-data.mjs` (partial, ~150 lines, enough to
confirm its scope/hardcoding); `native-app/MetisKit/Sources/MetisKit/MeetingController.swift`,
`SpeechTranscription.swift` (full); `native-app/App/AudioCapture.swift`, `ContentView.swift`,
`Store/PersistedModels.swift`, `Permissions/PermissionsService.swift` (full); `native/mac-helper/main.swift`
(full, all 309 lines); `src/main/mac-helper.ts` (full); `src/main/foreground-watcher.ts` (partial —
lifecycle/spawn logic, ~115 of 245 lines); relevant slices of `src/main/index.ts` (quit/force-quit sidecar
teardown, ~120 lines across three locations); `package.json` (all scripts); `electron-builder.yml`
(extraResources sections); every file under `.github/workflows/` (grepped in full, `build.yml` partially
read in full for the macOS job).

**Inspected by listing/wc/grep only (not read line-by-line):** `intelligence/src/views/AccountsView.tsx`,
`BriefingView.tsx`, `CoachingView.tsx`, `ConnectionsView.tsx`, `DealView.tsx` (except the `dealRisk`
function signature and neighboring function list, which I did read), `EmbedView.tsx`, `MeetingsView.tsx`,
`PeopleView.tsx`, `StatsView.tsx`; `intelligence/src/components/*.tsx` other than `IntelligenceUpdateButton.tsx`;
`native-app/MetisKit/Sources/MetisKit/Intelligence.swift` (head only), `MeetingIntents.swift`,
`MeetingModels.swift`, `Onboarding.swift` (322 LOC, not read in full — flagged as clean by grep for
force-unwraps only); `native-app/MetisKit/Tests/*.swift` (grepped for test count/names, not read for
assertion quality); `native-app/App/History/HistoryView.swift`, `MetisApp.swift`, `Onboarding/OnboardingView.swift`,
`Settings/SettingsView.swift`, `UI/MetisMark.swift`, `UI/Theme.swift`; `native-app/docs/QA-CHECKLIST.md`.

**Not inspected at all:** `intelligence/node_modules/`, `intelligence/dist/` (build output),
`native-app/MetisKit/.build/` (build cache), `skills/` sub-Markdown files beyond confirming they are
prompt-only content with no code; `resources/graphify_runner.py` (Python, arguably out of a
TS/Swift-focused lane and the file's content wasn't reviewed).

**Constraint compliance:** no repo file was edited, no git state-changing command was run, no `npm install`
was run, no meeting/transcript content was read (only file/directory listings and sizes), no credential or
key files (`key-*.bin`, `secret-key.bin`, `Cookies`, `identity.json`) were opened. The only path outside
`/Users/tony/AI-Brain-build/metis-2.0` I read from was `intelligence/scripts/build-data.mjs`'s *literal
string constant* naming a vault directory path — I did not open or read anything under that path.

---

## Findings summary (severity-ordered)

| # | Sev | Axis | File:line | Title |
|---|---|---|---|---|
| 1 | P1 | testability/architecture | `native-app/README.md:3-4`; confirmed via `.github/workflows/*.yml` (no hits) | MetisKit's 26 tests never run in CI despite README's explicit CI claim |
| 2 | P1 | architecture/reliability | `scripts/build-native-mac.mjs:99-170`; `package.json` scripts | native-app/App (SwiftUI shell) is never built by any CI job, and the one script that can build it never runs tests |
| 3 | P2 | architecture | `intelligence/src/components/IntelligenceUpdateButton.tsx` vs `src/renderer/src/components/IntelligenceUpdateButton.tsx`; `intelligence/src/lib/intelligence-update.ts` vs `src/renderer/src/lib/intelligence-update.ts` | Same feature duplicated across two apps with no shared package; already behaviorally diverged |
| 4 | P2 | testability | `intelligence/src/views/GraphView.tsx:115-128,204-210,59-109`; `DealView.tsx:79` | Real business logic embedded untested in views/, breaking the lib/ discipline the rest of the codebase follows |
| 5 | P2 | performance | `intelligence/src/views/GraphView.tsx:343-355` | Uncapped re-stabilization physics on incremental graph growth; unverified at scale |
| 6 | P2 | correctness/reliability | `native-app/App/Store/PersistedModels.swift:59`; `native-app/App/ContentView.swift:184,189` | Silent `try?` swallowing of persistence/audio errors in the unshipped native app — same failure shape as Tony's existing bug reports, worth fixing before it ships |
| 7 | P3 | testability | `native/mac-helper/main.swift` (whole file); `src/main/mac-helper.ts:21-24` | Shipped Swift sidecar is compiled+arch-checked in CI but has zero behavioral tests; consuming module's own comment admits the Swift side was never compiled by its author |
| 8 | P3 | maintainability | `intelligence/package.json:2`; `intelligence/scripts/build-data.mjs:14` | Package name + dev script are single-deal-prototype leftovers |
| 9 | P3 | testability | `intelligence/package.json:11` | `npm run smoke` (going-cold.smoke.mjs) never invoked anywhere |
| 10 | P3 | performance/consistency | `intelligence/src/views/GraphView.tsx:658-679` | "Relationship risk" sidebar list has no cap unlike its sibling "Going cold" list |
