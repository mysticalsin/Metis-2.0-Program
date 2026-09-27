# Lane L06 — Renderer Core (Métis / asktoto, origin/main @ 2bf21f1c, v1.9.6)

**Scope (per lead's brief):** `src/renderer/src/App.tsx` (4,277 lines), `state.ts` (776 lines), `main.tsx`
(83 lines), `src/renderer/src/lib/**` (all — incl. `listen.ts`, 3,153 lines), `hooks` (see §0), `src/preload/**`
(all — `index.ts` 563 lines + 3 more files), `src/renderer/index.html` and entry points.

**Method:** brownfield/read-only discovery + five-axis review (correctness, readability, architecture,
security, performance; reliability/testability where relevant), per `03-brownfield-discovery.md` /
`05-domain-and-code-boundaries.md` / Stark's Addy-Osmani five-axis integration. Evidence labels:
**OBSERVED** (seen directly in this repo's code), **DERIVED** (reasoned from OBSERVED facts),
**ASSUMED**, **UNKNOWN**. Severity: P0 = user-visible hang/crash/data loss/security in normal use;
P1 = serious defect or major perf/resource waste; P2 = maintainability/structure with real cost;
P3 = minor.

Read-only throughout: no file in `/Users/<redacted-user>/AI-Brain-build/metis-2.0` or any kit directory was
edited, no `npm install`/build/git-state command was run. No meeting/transcript file content was read
(only counts/sizes, and none of that was needed for this lane). No secret/credential files were opened.

---

## 0. Coverage ledger

| Area | Inspected | Method |
|---|---|---|
| `App.tsx` (4,277 lines) | Full read of the import block, boot/auth/license section (~1-460), the effect cluster ~780-1300, the escape/hotkey/routing section ~2700-3200, the seven panel-body `useMemo`s ~3360-3620, one full `<Bar/>` call site ~4043-4090, file tail 4250-4277 | `Read` (targeted ranges) + `grep`/`awk` sweeps for every `useEffect`/`useState`/`useCallback`/`useMemo`/`useRef`/`useReducer`/`setInterval`/`setTimeout`/`addEventListener`/`requestAnimationFrame`/`window.toto.on*`/`lazy(`/`memo(`/`createContext` occurrence in the file |
| `state.ts` (776 lines) | Full read | `Read` |
| `main.tsx` (83 lines) | Full read | `Read` |
| `lib/listen.ts` (3,153 lines) | Targeted reads of the two `useEffect`s (devicechange watcher, system-audio recovery poll, lines 2070-2131), the cloud-STT/Parakeet engine-select branch (2280-2440), the `start()` re-entrancy guard (2133-2200); full-file `grep` sweep for every timer/listener/RAF/IPC-subscribe/`useState` site | `Read` (targeted) + `grep`/`wc` |
| `lib/state.useAutoResize`, `useAsk`, `useSettings`, `useAuth`, `usePermissions` | Full read (all in `state.ts`) | `Read` |
| `lib/jarvis-orb.ts` (678 lines, audio visualiser) | Read the RAF loop, `ResizeObserver`, visibility-pause and `dispose()` (lines 540-678) | `Read` |
| `lib/window-drag.ts` (141 lines) | Full read | `Read` |
| `lib/bar-toolbar-layout.ts` (319 lines) | Skimmed (pure layout-math constants/functions, no hooks/timers) | `grep` + partial read |
| `preload/index.ts` (563 lines) | Full read | `Read` |
| `preload/import-decoder.ts`, `preload/intelligence.ts`, `preload/live-identity.test.ts` | Not read this pass (small; low risk given `index.ts`'s consistent pattern) | — |
| `src/renderer/index.html` | Full read | `Read` |
| `hooks` | **Does not exist.** `find src/renderer/src -iname "*hook*"` returns nothing; there is no `src/renderer/src/hooks` directory in this checkout. All hook logic lives in `state.ts`, `lib/*.ts`, and inline inside `App.tsx`/`components/*.tsx`. Flagging so the lead knows this path in the brief has no target — **UNKNOWN/non-issue**, not a hidden defect. |
| Other `lib/*.ts` files (bar-pill-orb, overlay-autohide, overlay-motion, right-edge-dismissal-lock, recap-write-coordinator, transcript, sound, meeting-clock, entity-casing, onboarding-*, tap/*, whisper.worker.ts, whisper-worklet.ts, scramble, synthetic-cursor, etc.) | Not read line-by-line; touched only via `grep` for RAF/timer/listener patterns while building the cross-file inventory in §5 | `grep` |
| `components/*.tsx` (Bar, Settings, Review, RecallView, etc.) | **Out of lane** — referenced only twice, narrowly, to verify two App.tsx-side claims (whether `<Bar/>` is `memo`'d, and whether `ObsidianOrb`/`ThreeJS` loads eagerly through App's own import graph). Not otherwise reviewed; that is presumably a `components/` lane. | `grep` (2 files touched: `Bar.tsx` import list, `ObsidianOrb.tsx` header comment) |
| Cross-lane context | Read `B1-history-freeze.md` and `B2-resource-heavy.md` in full before writing findings, to avoid duplicating their (excellent, already-shipped) root-cause work and to correctly attribute the one finding that lives in *my* lane's files but was root-caused by B1. | `Read` |

This is a **sampled, targeted** audit of a very large surface (App.tsx + listen.ts alone are 7,430
lines), not an exhaustive line-by-line review of every effect/callback. Findings below are all backed
by direct file:line citations I re-read to confirm; anything I could not fully verify is labeled
UNKNOWN rather than asserted.

---

## 1. Architecture summary (what this lane's files actually are)

- **`main.tsx`** (83 lines): the entire renderer entry point. Mounts `<App/>` inside a single
  class-based `ErrorBoundary` (React `componentDidCatch`), rendered in `React.StrictMode`. On a caught
  render throw, it shows a `CrashCard` (its own `useAutoResize` so the crash card isn't clipped by
  whatever window geometry existed at crash time — a nice, deliberate touch, `main.tsx:16-47`) and
  reports `{message, stack, componentStack}` to main via `window.toto.reportCrash` (`main.tsx:66`).
  Clicking "Reload" just clears the boundary's local error state (`main.tsx:73`), which remounts the
  *same* `<App/>` element fresh (all its hooks re-initialize) — see finding F5.
- **`App.tsx`** (4,277 lines): **one single function component**, `export function App(): JSX.Element`,
  spanning line 267 to the file's last line 4277 (confirmed: no other top-level `function`/arrow
  component is declared in this file; everything after the lazy-import block at the top is inside this
  one function). It owns essentially all cross-cutting renderer state: settings/auth/license boot
  sequencing, the overlay's auto-hide/reveal/right-edge-dock state machine, window-drag wiring, the
  entire meeting lifecycle (start/pause/stop/autosave/recap), four independent `useAsk()` instances
  (ask, suggest, followup, coaching, booking, recapGen, speculative — 7 total `useAsk()` calls), hotkey
  dispatch, view routing (`view` state: bar/settings/history/brain/agenda/copilot/answer/review), and
  the seven per-view memoized "body" elements passed down to `<Panel/>`/`<Bar/>`. Concretely, in this
  one function: **47** `useEffect` calls, **65** `useCallback` calls, **33** `useRef` calls, **18**
  `useState` calls + **1** `useReducer`, **8** `useMemo` calls (all counts from a full-file `grep`, this
  pass).
- **`state.ts`** (776 lines): a well-factored set of standalone hooks (`useAutoResize`, `useAsk`,
  `useSettings`, `useAuth`, `usePermissions`) plus two extracted, dependency-injectable poll-loop
  functions (`startAuthRefreshLoop`, `startPermissionRefreshLoop`) that are already unit-testable
  independent of React (confirmed via `state.test.ts`, `state.auto-resize.test.ts`,
  `state.useAsk.test.ts`). This file is the one part of the "core" lane that already looks like the
  target end-state for the rest — see §6.
- **`lib/listen.ts`** (3,153 lines): a single exported `useListen()` hook implementing the *entire*
  audio/ASR pipeline: mic capture, system-audio loopback + its own permission-poll recovery loop, four
  interchangeable transcription engines (Whisper-in-worker, Parakeet-in-main, Apple Speech, cloud STT
  for Nova-3/Soniox), VAD, echo/operator-bleed detection, speaker-embedding/voiceprint upgrade, and a
  capture-admission/session-epoch bookkeeping layer that every one of those engines depends on. Despite
  its size, internally it is disciplined: cleanup is consistently paired (every `setInterval`/
  `addEventListener`/IPC-subscribe site I checked has a matching `clearInterval`/`removeEventListener`/
  unsubscribe — see §6), but it is a second, comparably-sized monolith next to `App.tsx`.
- **`preload/index.ts`** (563 lines): a flat `contextBridge.exposeInMainWorld('toto', api)` surface. No
  direct `ipcRenderer`/`require` exposure to the renderer, no `nodeIntegration`-style leak visible from
  this file. Every one-shot event subscription funnels through a single `sub()` helper
  (`preload/index.ts:76-80`) that always returns an unsubscribe closing over `removeListener` — the
  three ad-hoc exceptions (`dustInstallCli`, `cliInstall`, `onParakeetProgress`-style one-offs) each
  still pair their `ipcRenderer.on` with a `removeListener` in a `.finally()`/returned closure
  (`:123-131`, `:138-146`, `:202-206`). This file is clean; see §6.
- **`index.html`**: CSP is a real allowlist (no `unsafe-eval`, no wildcard `https:`), with an
  extensively commented rationale for every entry (why Cloudflare has no `connect-src` entry, why
  `media-src` pins one CloudFront host and not a wildcard). A `#boot-bed`/`#act1-boot-chrome` inline
  bed guarantees the frameless/transparent window never shows a black frame before React hydrates.
  No findings here beyond noting the design is deliberate and already hardened.

---

## 2. Findings

### F1 (P0, confirmed in this lane's file — root-caused by lane B1) — `guardReviewNav`'s blocking `window.confirm()` lives in App.tsx and is the mechanism behind "History sometimes doesn't open"

**OBSERVED**, re-verified directly in this pass:

```
App.tsx:915-921
const guardReviewNav = useCallback((proceed: () => void): boolean => {
  if (viewRef.current === 'review' && reviewDirtyRef.current && !window.confirm('You have unsaved changes to this recap. Discard them?')) {
    return false
  }
  proceed()
  return true
}, [])
```

This is the single chokepoint every History-open path in `App.tsx` routes through (`onBarHistory` at
`App.tsx:2732-2740`, the Escape-from-Review handler at `App.tsx:3143-3163`, the minimize/panel-toggle
guards). `window.confirm()` is a synchronous, renderer-thread-blocking native dialog; on Métis's
frameless/`transparent`/`always-on-top(screen-saver)`/no-Dock-icon overlay window (main-process
details, out of my lane, per B1) that dialog can render with nothing to visibly attach to, leaving the
renderer thread blocked forever with no error and no visible UI — exactly Tony's report ("running but
frozen"). **Full root-cause chain, main-process corroborating evidence, and the fix recommendation are
already written up in `lanes/B1-history-freeze.md` §2-3** (independently, from the main-process side:
`win.on('unresponsive', …)` has no recovery path, and `ensureWindow()`/`second-instance` never check
`webContents.isResponsive()`). I am not duplicating that analysis — I confirm the renderer-side half of
it lives exactly where cited (`App.tsx:915-921`, plus duplicated guard logic the same file's own
comments admit exists at **App.tsx:2765, 2792, 3143** — I did not re-verify those three secondary sites
line-by-line this pass; B1 did). **Action for the Opus planner:** this is one fix (ban
`window.confirm`/`alert`/`prompt` from the renderer; replace with an in-DOM confirm) that closes a
finding two lanes independently converged on — treat it as a single ticket, not two.

---

### F2 (P1) — Live-transcript state is co-located inside the 4,277-line God Component, so every transcribed word re-runs the entire `App()` function body during the app's core use case

**OBSERVED.** `useListen()` owns `const [lines, setLines] = useState<TranscriptLine[]>([])`
(`lib/listen.ts:804`) and calls `setLines` on every committed transcript line during a live meeting
(`lib/listen.ts:1021, 1034, 1048, 1102, 1481, 2342` — six call sites, the hot ones firing on ordinary
speech, not just session start/stop). `useListen(...)` is invoked directly inside `App()`'s body as
`const listen = useListen(...)` (`App.tsx:405`), **not** inside its own component. React has no way to
scope a `useState` update to "just this hook's logical owner" — a `setLines` call re-renders the entire
enclosing component, which here is the whole 4,277-line `App()` function: all **65** `useCallback`
factories, **8** `useMemo` dependency checks, and **47** effect dependency comparisons re-execute on the
JS thread, once per transcribed line (per `App.tsx:949-953`'s own comment, this can be several times a
second in an actively-talkative meeting — the *exact* moment this cost is paid most).

**Why this isn't as bad as it sounds, and why it still matters:** React's reconciliation plus the
seven per-view `useMemo`d "body" elements (`App.tsx:3377-3616`, e.g. `historyBody`, `settingsBody`)
mean the actual **DOM** work is well-contained — an unrelated view like Settings does not physically
re-paint on every transcript line. But the **JavaScript execution** cost of re-running the enclosing
function is not something `useMemo`/`memo` can skip; only moving the state itself out of the
God Component (or memoizing the component *below* it) avoids that. This is a renderer-JS-thread-level
contributor to "it's very heavy on the PC" that is distinct from — and additive to — B2's
process/sidecar-level findings; B2 explicitly scoped its review to main-process consumers and did not
cover this angle.

**Fix direction:** extract `useListen()`'s consumption into its own component boundary (e.g. a thin
`<MeetingSession/>` wrapper that owns `useListen()` and receives only the handful of callbacks App
needs to react to, such as `onQuestion`), or at minimum split `App()` into the smaller hooks in §4's
decomposition plan so the live-transcript state's owner is a much smaller function. **Regression test
direction:** a React Profiler-based test (or a simple render-count spy) asserting that appending N
transcript lines causes O(1) — not O(N) times the full-App-function-cost — JS execution, once the
extraction lands.

---

### F3 (P2) — `App.tsx` (4,277 lines, one function) and `lib/listen.ts` (3,153 lines, one hook) are both single-file monoliths with no internal module boundaries — the two biggest concrete decomposition targets in the renderer

**OBSERVED** (see §1's counts). Beyond the direct perf angle in F2, this has real, measurable
maintainability and blast-radius costs:

- **No state-management layer of any kind.** A full `grep -rn "createContext"` across
  `src/renderer/src` (excluding tests) finds exactly **one** hit outside `components/`:
  `components/Settings.tsx:482`, and that is a small icon-passing context local to Settings' own tab
  bar, not an app-wide store. `App.tsx` and `state.ts` define **zero** Context/Redux/Zustand/Jotai —
  every one of the ~19 pieces of top-level state in `App()` is prop-drilled by hand into whichever
  child view needs it. Concrete evidence: one `<Bar/>` call site alone
  (`App.tsx:4047` onward) threads more than 40 individual named props (`value`, `onChange`, `onSubmit`,
  `busy`, `listening`, `captureDegraded`, `captureHealth`, `noSpeechWarning`, `recognizerStatus`,
  `onTogglePause`, `onCapture`, `capturing`, `captureAccel`, `mode`, `onSetMode`, `hasAnswer`, `body`,
  `onBack`, `screenCapturedAt`, `onTranscript`, `transcriptShown`, `onNewMeeting`, `customModes`,
  `canPrewarm`, `thinkingOn`, `onToggleThinking`, `onSpotlightRef`, `spotlightReady`, `onHistory`, …,
  continuing past line 4090) — and `<Bar/>` is instantiated **three separate times** in `App.tsx`
  (confirmed via `onHistory={onBarHistory}` at lines **3979, 4043, 4084**) for different
  presentation branches, each needing its own near-complete copy of that prop list kept in sync by
  hand.
- **Test coverage already exists but is necessarily whole-app.** There ARE dedicated test files —
  `App.mic-only-visibility.test.ts`, `App.local-gates.test.ts`, `App.capture-permission.test.ts`,
  `app-recap-lifecycle.test.ts`, `app-listen-identity.test.ts`, `app-disregard.contract.test.ts`,
  `app-audit-fixes.contract.test.ts` (all `src/renderer/src/`) — which is a genuine positive (this is
  not an untested 4,277-line file). But because there is no smaller unit to import, every one of these
  tests must mount/exercise the *entire* `App` tree (full IPC mock surface, every lazy chunk) to test
  one narrow behavior (e.g. a single capture-permission edge case). A decomposition that extracts, say,
  the view-router or the autosave hook as its own module would let that behavior get a small, fast,
  isolated unit test instead, and would shrink how much of `App.tsx` any one feature change has to touch
  (today, nearly every feature touches the same one file, which is the classic monolith
  merge-conflict/blast-radius cost, not just a line-count aesthetic complaint).
- **`lib/listen.ts` is the same pattern at comparable scale** — one exported hook implementing five
  logically separate concerns (engine selection/dispatch, system-audio recovery, speaker voiceprint
  upgrade, VAD/echo detection, and the epoch/admission bookkeeping all of those depend on) in one
  3,153-line file, tested by three very large test files (`listen.test.ts` 35KB,
  `listen.stop-drain.test.ts` 56KB, `listen.partial-caption.test.ts` 14KB) that each necessarily also
  exercise the whole pipeline.

See §4 for a concrete, incremental (not big-bang) decomposition plan for both files.

---

### F4 (P2) — Crash reports carry no session context, so the app's own crash log cannot tell "crashed idle" from "crashed mid-meeting" — directly limits triaging the two bugs Tony reported

**OBSERVED.** `main.tsx`'s `ErrorBoundary.componentDidCatch` reports exactly
`window.toto.reportCrash(error?.message ?? '', error?.stack ?? '', info?.componentStack ?? '')`
(`main.tsx:66`), and the preload contract it calls is
`reportCrash: (message: string, stack?: string, componentStack?: string): Promise<void>`
(`preload/index.ts:447-448`) — three strings, no application-state payload at all.

**Why this matters given this lane's architecture:** `main.tsx` wraps the **entire** `<App/>` in one
top-level `ErrorBoundary` (`main.tsx:79-81`) — there is no per-view boundary around Settings, Review,
RecallView, BrainView, Copilot, Answer, or the onboarding experience. A render throw in *any* of those
(e.g. a bad prop shape reaching one of Settings' ~9,000 lines, sight-read only far enough to confirm
`usePermissions()`'s call site at `components/Settings.tsx:8789` — that file is `components/`, out of
my lane, but its size is directly relevant to how much surface funnels into this one boundary) unmounts
the *whole* app, including an in-progress meeting's live transcript (recoverable only from the ≤60-second-old
autosave snapshot, `App.tsx:956-981`) and every in-flight `useAsk()` stream. That is a reasonable,
deliberate trade-off (see §6 — the alternative, per-view boundaries, has its own costs), but it makes
the **crash telemetry** the team already leans on (E6's `app.crash`/`render-process-gone` audit-log
records, per the lead's runtime evidence) structurally unable to answer "how often does this happen
during a live meeting vs. idle" — exactly the kind of correlation needed to prioritize between Tony's
two bug reports. **Fix direction (small, low-risk):** add `{view, listening}` — both already local
`App()` state — to the `reportCrash` payload; `CrashCard`'s own `useAutoResize`-based render (already
resilient to a broken preload bridge, `main.tsx:20-24`) needs no change.

---

### F5 (P3, architecture note, not a confirmed defect) — the crash-recovery "Reload" button remounts `<App/>` fresh but is a soft remount, not a real reload — worth a deliberate check, not a rewrite

**OBSERVED.** `ErrorBoundary.render()` returns `this.props.children` (`main.tsx:72-74`) — the *same*
`<App/>` element reference across the error/no-error transition, so clicking "Reload" clears local
component state via `this.setState({ error: null })` and lets React remount the crashed subtree fresh
(all of `App()`'s hooks re-initialize: `useState`/`useRef` initial values, effects re-run). This is a
reasonable, cheap recovery — much faster than a full `location.reload()` — **and** module-scope mutable
state is not reset by it. I checked for exactly this hazard across the files in scope: `lib/listen.ts`
has exactly one module-level mutable (`let _workletUrl: string | null = null`, `listen.ts:59`), which is
a cached Blob URL for the Whisper AudioWorklet — reusing it across a remount is harmless/intentional
(it's a URL string, not a live handle). I did not find any module-scope `AudioContext`/`MediaStream`/
timer handle anywhere in the files reviewed this pass that would survive an `ErrorBoundary` remount and
leak. **This is a clean bill of health on the specific hazard I checked for**, not a general guarantee —
I did not exhaustively audit every `lib/*.ts` file's top-level scope (see §0's "not read this pass"
list), so flagging the *pattern* (module-scope state + a component-remount-only recovery path) as
something worth a standing lint/contract-test check (grep for `^let ` / mutable top-level `const {}` in
`lib/**` that hold live resource handles) rather than a one-time human read, given how easy it is for a
future change to introduce exactly this.

---

## 3. What I checked and found to be **solid** (explicitly, to avoid wasted future re-verification)

Given the size of this lane, it is worth recording what did **not** turn up a defect, with enough
specificity that a future pass doesn't re-spend budget re-checking these:

- **Lazy loading is real and already well-targeted.** `Settings`, `Review`, `RecallView`, `AgendaView`,
  `BrainView`, `Answer`, and `Copilot` are all `lazy()`-imported (`App.tsx:17-23`), with an explicit
  comment explaining why (`Answer`/`Copilot` pull in `streamdown`+`shiki`, which have no reason to
  parse before the user asks anything). `Bar` is `memo()`'d (`components/Bar.tsx:338`, confirmed) and
  `App.tsx` has multiple comments showing the team already tuned dependency arrays specifically to keep
  that memoization effective (`App.tsx:905, 2710, 3368`).
  Three.js (via `ObsidianOrb`→`jarvis-orb.ts`) is confirmed **dynamically** imported, not eager — I
  checked this specifically because it's a classic bundle-size trap, and `components/ObsidianOrb.tsx`'s
  own header comment states the design intent ("Three.js loads only when this orb mounts (dynamic
  import) — exclusive Act 1 must not pay WebGL parse/compile before the lady+planet poster paints") and
  the only import of `jarvis-orb.ts` from `ObsidianOrb.tsx` in the eager path is a `type`-only import
  (erased at compile time).
- **Effect/listener/timer cleanup discipline is consistently correct** in every site I sampled: the
  60s autosave interval (`App.tsx:956-981`), the global click/focus/keydown listeners
  (`App.tsx:1264-1271, 1888-1899, 3172-3180`), the license-gate boot timeout (`App.tsx:317-344`), the
  overlay-park fallback timer (`App.tsx:831-839`), `state.ts`'s four hooks (`useAutoResize`, `useAsk`,
  `useSettings`, `useAuth`, `usePermissions` — all return correct cleanup, all use a `cancelled` flag to
  guard async races), `lib/listen.ts`'s `devicechange` listener and system-audio recovery poll
  (`listen.ts:2081-2131`), and `lib/window-drag.ts`'s `pointermove`/`pointerup` listeners (with an
  explicit, correctly-reasoned comment on *why* the "moved" flag is cleared deterministically rather
  than via `rAF`, since a blurred always-on-top window's rAF can be throttled). I did not find a single
  unpaired `setInterval`/`addEventListener`/IPC-subscribe in any file I read this pass.
- **`jarvis-orb.ts`'s RAF loop (the audio visualiser) self-pauses on `document.visibilitychange`**
  (`jarvis-orb.ts:632-639`) and its `dispose()` (`:657-673`) correctly stops the RAF, disconnects its
  `ResizeObserver`, removes the visibility listener, and disposes every three.js geometry/material/the
  renderer itself — no leak found. (Whether `document.visibilityState` reliably reflects "overlay
  parked/hidden" for this specific frameless/always-on-top/`backgroundThrottling:false` window — the
  `backgroundThrottling:false` setting is in `src/main/index.ts`, cited by lane B2 — is **ASSUMED**
  correct based on Electron's documented behavior, not independently verified against a running
  instance in this sandboxed, read-only review.)
- **`preload/index.ts` has no obvious security gap**: no direct `ipcRenderer`/`require`/`process` exposure
  to the renderer, a single consistent `contextBridge.exposeInMainWorld('toto', api)` surface, and every
  channel subscription pairs its `ipcRenderer.on` with a `removeListener`.
- **`index.html`'s CSP** is a real, deliberately-scoped allowlist with no `unsafe-eval` and no wildcard
  `https:`, and its own comments show the team already reasoned through the Cloudflare/media-src
  tradeoffs rather than defaulting to something permissive.
- **The `if (!settings) return null` inside `settingsBody`'s `useMemo`** (`App.tsx:3377-3378`) is *not*
  a Rules-of-Hooks violation — I initially flagged this pattern for a closer look because seven more
  `useMemo` calls follow it lexically (`historyBody` etc., `App.tsx:3403-3616`), which would be a real
  bug if `App()` itself conditionally returned before them. It does not: the `return null` is scoped
  entirely inside the `useMemo`'s own callback (i.e., it makes `settingsBody` resolve to `null`, it does
  not exit `App()`), and the surrounding comment (`App.tsx:3370-3371`) shows this was already a
  deliberate, understood constraint ("Must sit above the early-return gates below — every hook in this
  component runs unconditionally before them"). No hooks-ordering bug here.

---

## 4. Decomposition plan (as requested by the brief)

Both plans are **incremental extraction**, not a rewrite — each step should land with the existing test
files (§0/§3) still green before the next step starts, per the brownfield-discovery method's "a rewrite
must earn its cost" guidance.

### `App.tsx` (4,277 lines → target: a few hundred lines of composition + ~5-6 extracted hooks)

1. **`useAppBoot()`** — settings/auth/license-gate boot sequencing, `bootSlow`/`bootError`
   (`App.tsx:285-365`). Already fairly self-contained; lowest risk, do it first.
2. **`useAppViewRouter()`** — `view` state, `guardReviewNav`, `reviewDirtyRef`, `viewRef`, the Escape
   keydown handler (`App.tsx:892-921, 3172-3180`). This directly isolates **F1**: once this is its own
   small module, replacing `window.confirm` with an in-DOM confirm is a contained, easily-reviewed,
   easily-tested change instead of a change to a 4,277-line file.
3. **`useOverlayPresentation()`** — the auto-hide/reveal/right-edge-dock wiring glue
   (`App.tsx:~795-940`); the underlying reducers (`overlay-autohide.ts`, `overlay-motion.ts`,
   `right-edge-dismissal-lock.ts`) are already pure and already extracted — this step just moves the
   remaining effect-wiring alongside them.
4. **`usePanelBodies()`** (or, better, small wrapper components co-located with each lazy import) — the
   seven `*Body` `useMemo` blocks (`App.tsx:3377-3616`). Moves the memoization boundary to sit next to
   the component it wraps instead of centralizing it in `App`.
5. **`useMeetingSession()`** — wraps `useListen()` + the autosave effect + `RecapWriteCoordinator`
   wiring + the seven `useAsk()` instances that relate to the meeting lifecycle. **Highest value, highest
   risk** (this is where **F2** lives, and most of both B1's and B2's cross-cutting concerns touch it) —
   do this **last**, once (1)-(4) are done and have shrunk the surface around it, and lean on
   `app-recap-lifecycle.test.ts`/`app-listen-identity.test.ts` as the regression harness while doing it.

### `lib/listen.ts` (3,153 lines → target: a small core + 3-4 engine/concern modules)

1. **Extract each transcription engine's branch** (Whisper-worker, Parakeet, Apple Speech, cloud STT
   Nova-3/Soniox — the branches inside `start()`, `listen.ts:~2130-2440` and beyond) into
   `lib/listen/engines/{whisper,parakeet,apple,cloud}.ts`, each exposing a small
   `{start(ctx), stop(), feed(samples)}` contract. This is the highest-leverage single move: it turns
   "one 3,153-line file" into "a small core + four independently-reasoned-about, independently-tested
   engine modules," and matches how the code already *behaves* (each engine branch is already fairly
   self-contained; it just isn't a separate file).
2. **Extract system-audio loopback recovery** (`listen.ts:2088-2131`, `armThemProbation`,
   `recoverSystemAudioRef`, the Windows-vs-macOS retry-pacing logic) into
   `lib/listen/system-audio-recovery.ts` — already close to self-contained.
3. **Extract speaker-embedding/voiceprint upgrade** (`canUpgradeSpeakerLabel`, the `speakerEmbed` calls
   inside the cloud-STT `onCloudSttFinal` handler, `listen.ts:2318-2349`) into
   `lib/listen/speaker-voiceprint.ts`.
4. **Keep the epoch/admission/channel bookkeeping** (`captureAdmissionIsOpen`, `sessionEpochRef`,
   `channels.current`) as the remaining `listen.ts` core — every engine and recovery path depends on it,
   so it is correctly the one thing that should stay central.

---

## 5. Cross-lane notes (for the Opus planner, not new findings of my own)

- **F1** above is the same defect B1 root-caused from the main-process side (`B1-history-freeze.md`
  §2, "Root cause #1"). One ticket, not two — the fix touches both this lane's file (`App.tsx`,
  `Review.tsx`) and B1's (`src/main/index.ts`'s `unresponsive` handler / `ensureWindow()`).
- **F2** (the live-transcript re-render cost) is a renderer-JS-thread-level contributor to "it's very
  heavy on the PC" alongside — not instead of — B2's process/sidecar-level findings (orphaned
  `llama-server`, the boot-time un-exhaust/retry storm, etc.). B2 explicitly scoped its review to
  process-level consumers and its own §5 "explicitly ruled out" list does not cover this; I am not aware
  of another lane covering it either. Worth including in the same "heavy" epic regardless of which lane
  originated it.
- B2's F5 (unmeasured idle-GPU/CPU cost of the always-on overlay's `backdrop-filter` + `infinite` CSS
  animations) is a `components/`+`styles.css` concern, out of my lane's files; I did not re-verify it,
  but note it is architecturally consistent with what I found here (a single persistent, never-throttled
  overlay window, confirmed from the renderer side via `jarvis-orb.ts`'s own visibility-pause logic
  existing specifically *because* nothing upstream throttles it for them).

---

## 6. Test gaps (for the planner, not full findings)

- No test I found asserts the O(1)-vs-O(N) re-render-cost property described in F2 (a Profiler-based
  or render-count-spy test would be new).
- No test currently exercises the `ErrorBoundary`'s "Reload" path end-to-end (mount `<App/>`, throw
  inside a child, click Reload, assert a fresh mount with no leaked timer/listener) — worth adding
  before any decomposition work touches `main.tsx`/`App.tsx`'s top level, as a safety net.
- `reportCrash`'s payload shape (F4) has no test pinning its current 3-string contract, so widening it
  to include `{view, listening}` is a safe, additive change with nothing to break.
