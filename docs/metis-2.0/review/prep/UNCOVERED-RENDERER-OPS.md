# P5 — Uncovered Renderer/Ops AUDIT (read-only)

Scope: renderer onboarding stack, `lib/tap/*`, `TapCalibration.tsx`, `whisper.worker.ts`, `work-progress.ts`,
`AgendaView.tsx`, `ImportQueue.tsx`, `TimeSavedView.tsx`, `recap-write-coordinator.ts`, `bar-pill-orb.ts`,
`UpdateReadyToast.tsx`, `outlook-draft-lifecycle.ts`, `RecordingConsentReminder.tsx`; `src/shared/{grounding,
prompts,lang-id,transcript-align,mars,cloud-stt-language,speaker-names,local-ai,ask-routing,answer-first,
wrapup}.ts`; `src/main/island/{geometry,cursor-watch}.ts`; `operator/scripts/{deploy,migrate,backup,gates,
rewrap}.mjs`, `operator/src/export/*`, `operator/src/routes/export.ts`, `docs/operator/ACCESS-BYPASS-
INTEGRATIONS.md`. Read against `metis-2.0` reference checkout (origin/main `2bf21f1c`, v1.9.6). No tests run,
no app launched (hard rule). All line numbers OBSERVED at that commit.

Cross-checked against `COVERAGE-CRITIC.json`'s `uncovered_code` list before starting — this lane's file set
matches that list's "renderer onboarding stack" / "other renderer code" / "operator" entries; findings below
are additive to, not overlapping with, `BUG-ROOT-CAUSES.json`'s B1/B2/B3 (which are main-process/window-
lifecycle scoped, not renderer-animation or extraction-logic scoped).

## Summary

Most of this surface is careful, well-documented, fail-closed-by-design code (grounding.ts's numeral
extraction, the tap/* DSP gates, recap-write-coordinator.ts's ordering guarantees, the export pipeline's
formula-injection guards) — no correctness bugs found there beyond finding F3. The concrete, verifiable
findings cluster in two places the first review's main-process-only scope structurally couldn't reach:
(1) renderer animation loops that gate on a Page Visibility signal this app's own Electron config
(`backgroundThrottling:false`) documentedly disables, so they never throttle while "parked" behind other
apps/Spaces — a second, renderer-side, additive contributor to Tony's "very heavy on the PC" report, distinct
from B2's sidecar-orphaning finding; and (2) a hardcoded, agent-session-specific absolute path baked into
committed operator CI/quality-gate tooling.

---

## F1 (P1) — Persistent Bar-orb animation loops never throttle while the overlay is occluded/backgrounded, because `backgroundThrottling:false` disables the only signal they check

**Where:** `src/renderer/src/lib/bar-pill-orb.ts:139-150` (`shouldRunOrbRaf`), `src/renderer/src/components/
BrandThinkingOrb.tsx:44-84` (the actual RAF loop consuming it), `src/renderer/src/lib/jarvis-orb.ts:592-611`
(the opt-in "obsidian" style's three.js particle-sphere RAF loop). Electron config: `src/main/index.ts:1462`
and `:2615`, both `new BrowserWindow({ ... backgroundThrottling: false ... })`.

**Mechanism:**
- `BrandThinkingOrb.tsx` (the default "jakub" pill orb shown in the Bar's `ControlPill`/`Bar.tsx`, i.e. the
  app's normal collapsed idle state) gates its `requestAnimationFrame` loop on
  `document.visibilityState !== 'hidden'` plus an `IntersectionObserver` on its own canvas. The
  IntersectionObserver only tells you whether the canvas is scrolled into *this window's own viewport* — for
  a small always-on-top overlay with no scrolling, that is always true; it says nothing about whether the
  native window itself is occluded by another app.
- `jarvis-orb.ts`'s `createJarvisOrb` (a three.js `WebGLRenderer` with up to 2000 particles + 8000 line
  segments + additive blending, mounted via `ObsidianOrb.tsx` whenever the user picks the "obsidian" orb
  style in Settings) gates its loop on `document.visibilityState === 'hidden'` alone — no
  IntersectionObserver at all (`start()`/`onVis()` at jarvis-orb.ts:592-611).
- Electron's own documented behavior: `backgroundThrottling` "also affects the Page Visibility API." With it
  set to `false` (as both overlay `BrowserWindow`s are, deliberately, per the block comment at
  `index.ts:4466-4472`, to keep the transcription worker from being deprioritized mid-meeting),
  `document.hidden`/`visibilityState` does **not** turn `'hidden'` merely because the window loses focus, is
  occluded by another app, or sits on an inactive macOS Space — it only changes on an explicit
  `win.hide()`/`win.minimize()`.
- Per `src/main/island/geometry.ts` (`hideParkRect`, `parkAfterExclusiveOnboarding`, `overlayRestSize`), the
  app's three chrome states (Bar/Hide/Island) are never implemented as `win.hide()` — "Hide" is an 8×2px
  *fully on-screen, opacity-0* hairline window (`OVERLAY_HIDE_PARK`), not a hidden one. So the window is
  essentially never actually `hidden` from Chromium's point of view during normal use.
- Net effect: whenever the overlay is resting in **Bar** layout (`ControlPill`'s default state — the classic
  idle pill, not Hide/Island, which correctly never mount this component per its own comment "Hide/Island
  never mount this"), its canvas RAF loop repaints at full, uncapped rate *forever*, regardless of whether
  Métis is the focused/visible app, is behind a full-screened Zoom/browser/IDE window, or the user has
  switched to a different macOS Space. The heavier three.js "obsidian" orb has the identical exposure with no
  IntersectionObserver mitigation at all, whenever a user has selected that style.

**Why this matters for the P0 "very heavy on the PC" report:** `BUG-ROOT-CAUSES.json`'s B2 lane scoped its
resource investigation to the **main process only** (its own overstatement-correction #2 notes "E8's start/
stop counts... include fm-engine events" but never measured renderer compositor cost) and its own
`COVERAGE-CRITIC.json` entry explicitly flags this gap ("a renderer performance trace (backdrop-filter,
three.js orb, starfield, whisper.worker.ts)... nobody quantified 'heavy'"). This finding is that trace's
missing renderer-side half: an always-on, GPU-compositing animation that the app's own explicit
`backgroundThrottling:false` setting guarantees never idles down, on every Mac, all day, independent of and
additive to B2's sidecar-orphaning leak.

**Fix direction:** gate the RAF loop on an explicit main→renderer "window occluded/not on active Space"
signal (Electron exposes window occlusion via `win.on('show'/'hide')` is not enough here — would need either
a periodic cheap main-process occlusion check reusing the existing cursor-watch timer's cadence, or
accept the IntersectionObserver's limits and instead drop the frame rate substantially, e.g. to 4-8fps, for
the idle "solving" mood when the window has been unfocused for N seconds via a `blur`/`focus` listener on
`window`, which unlike Page Visibility *is* delivered correctly regardless of `backgroundThrottling`). Apply
the same fix to `jarvis-orb.ts`.

---

## F2 (P2) — Main-process cursor-watch timer polls at ~42 Hz continuously during Hide/Island rest, the app's "get out of the way" states

**Where:** `src/main/island/cursor-watch.ts:46` (`CURSOR_WATCH_INTERVAL_MS = 24`), wired in
`src/main/index.ts:3098-3103` (`startOverlayCursorWatch`) and `:3105+` (`tickOverlayCursorWatch`).

**Mechanism:** whenever `shouldWatchOverlayCursor()` is true — i.e. onboarding is done and layout is Hide or
Island, which per `geometry.ts` are the app's default "resting"/minimized states most users spend most of
their time in — `setInterval(() => tickOverlayCursorWatch(), 24)` polls `screen.getCursorScreenPoint()` plus
runs the hit-test/decision state machine, forever, at ~42 times/second. The timer is `.unref()`'d (won't
block process exit) but that does not reduce its CPU/wakeup cost while the process is alive: at 24ms this is
~150,000 timer fires/hour, each a real syscall + JS execution, specifically during the states the product
design intends to be quietest (the whole point of Hide/Island rest is "get out of the way"). This defeats
macOS App Nap / timer-coalescing for the main process the entire time the overlay is resting, which — combined
with F1's renderer-side always-on paint loop — compounds the "heavy on the PC" complaint on battery in
particular (frequent short-interval timers are exactly what App Nap/Efficiency Mode is designed to suppress,
and this app defeats that by design).

**Note:** this is an intentional trade-off (the block comment says "No Accessibility / CGEvent tap required"),
not an oversight, but it is a real, measurable, continuous cost that the first review's main-process-only
scope never quantified. A native occlusion/mouse-move hook (the existing `mac-helper` Swift binary already
watches frontmost-app changes) or a materially longer interval combined with the OS's native top-edge
hot-corner APIs would remove a perpetual busy-poll from the identified "quiet" states.

---

## F3 (P2) — `extractNumerals()`'s final ordering step can silently misorder hits when a short numeral's text recurs earlier in the span

**Where:** `src/shared/grounding.ts:597-661` (`extractNumerals`), specifically the final line:
`return hits.sort((a, b) => span.indexOf(a.raw) - span.indexOf(b.raw))` (line 660).

**Mechanism:** `NumeralHit` (`grounding.ts:173`) carries only `{ value, unit, raw }` — the `start`/`fullStart`
offset computed inline during extraction (lines 618, 649) is discarded once the hit is pushed. To restore
transcript-reading-order across the two extraction passes (digit-based, then word-based, appended
afterward), the function re-derives each hit's position via `span.indexOf(a.raw)` — which always returns the
position of the **first** occurrence of that exact substring anywhere in the whole span, not the specific
occurrence this particular hit came from.

**Concrete failure scenario:** span = `"revenue reached 500k this quarter, headcount is 5"`. `extractNumerals`
correctly produces two hits: `{ raw: "500k", value: 500000 }` at its real early position, and `{ raw: "5",
value: 5 }` at its real late position (the standalone "5" at the end, which has no adjoining currency/percent/
magnitude suffix so its `raw` is the bare digit). The final sort computes `span.indexOf("500k")` (early,
correct) and `span.indexOf("5")` — but `"5"` is *also* a substring of `"500k"`, so `indexOf` returns the index
of the `5` **inside** `"500k"`, far earlier than the hit's real position. The sort therefore places the
headcount-5 hit *before* the 500k hit, even though it is stated well after it in the transcript — the
opposite of the function's own implicit contract ("Extract every numeric value... " in reading order, which
is the entire reason this sort exists rather than just concatenating the two passes).

**Impact:** `verifyNumericFact()` itself is unaffected (it only calls `.some()` over the hits, order-
independent), so this does not by itself flip a "verified"/"unverified" grounding verdict — but any consumer
that trusts array order to reflect document position (a "pin the Nth number" reconciliation UI, a
"claims-in-order" diff against `brain/corrections.ts` — which `COVERAGE-CRITIC.json` separately flags as
unaudited and central to the human-correction/JEV flow — or any future caller) gets silently wrong ordering
whenever a short bare numeral recurs as a substring of a longer one nearby, which is common in meeting
transcripts (e.g. any "5" near a "50", "500", "15", "25", etc., or a repeated exact figure like "300k...300k").

**Fix direction:** keep the already-computed offset on the hit (add `start`/`end` to `NumeralHit`, or sort by
a parallel array of the `start`/`fullStart` values already in scope at push time) and sort by that number
directly; never re-derive position from `String.indexOf` on content that can repeat.

---

## F4 (P2/P3) — Operator preview/gates CI tooling hardcodes a Claude-Code-sandbox-specific absolute path (with a stale session UUID) as its default scratch/output directory

**Where:** `operator/scripts/gates.mjs:35-38`, `operator/scripts/preview.mjs:35-38`,
`operator/scripts/preview-tokens.mjs:26`, `operator/scripts/preview-motion.mjs:28` (also referenced,
non-exhaustively checked, in `seed-local.mjs` and `screenshot.mjs`).

**Mechanism:**
```
const PREVIEW_DIR = '/private/tmp/claude-501/operator-preview'                      // gates.mjs:35, no env override at all
const SCRATCH_DIR =
  process.env.METIS_QA_SCRATCH ||
  '/private/tmp/claude-501/-Users-<redacted-user>-Library-CloudStorage-OneDrive-MantuGroup-Documents-Chief-of-Staff-Apps-Source-Metis-Portal/7883530c-5678-450a-aef0-46d1bc798bfd/scratchpad'
```
`preview-tokens.mjs` and `preview-motion.mjs` hardcode the same `OUT_DIR` with **no** environment-variable
override at all. This is a macOS-only path (`/private/tmp` doesn't exist as a meaningful mount on Linux CI),
tied to one specific past Claude Code agent session's sandbox directory naming (the session UUID
`7883530c-...` and the escaped absolute path of a Mantu Chief-of-Staff OneDrive folder are both baked in
verbatim) — not a portable `os.tmpdir()` or repo-relative `.tmp/` default. `gates.mjs`'s gate 2 (`style="` in
rendered preview HTML) and gate 5 (WCAG contrast, via `loadConsoleCss()`'s `esbuild-tmp` dir) both depend on
this exact path being creatable/writable; on any machine other than the one that session ran on — a CI
runner, a teammate's Mac, or Tony's own future session (a new Claude Code session gets a *different* sandbox
path each time) — this silently creates an oddly-named, meaningless directory tree under `/private/tmp`
rather than failing loudly, which is confusing but likely doesn't crash on POSIX (mkdir -p succeeds if
`/private/tmp` — real path of macOS's `/tmp` — is writable); on Linux CI it is more likely to simply create a
new, wrong, un-cleaned-up directory tree, silently decoupling the "gate" from whatever preview content was
actually intended.

**Why it matters:** the goal's own m4 milestone is "repo/CI hygiene" (2026-10-04); this is exactly that class
of defect, and it also leaks internal AI-tooling/session structure and Tony's local folder layout into
versioned, committed source that other engineers/CI will run.

**Fix direction:** replace both `PREVIEW_DIR`/`OUT_DIR` and the `SCRATCH_DIR` fallback with
`path.join(os.tmpdir(), 'metis-operator-preview')` (still overridable via `METIS_QA_SCRATCH`/a new
`METIS_QA_PREVIEW_DIR`), and add both scripts' scratch dirs to `.gitignore`'s existing pattern set if not
already covered.

---

## Reviewed, no defect found (coverage record)

- **`whisper.worker.ts`** (renderer ASR): CPU/GPU cost is real (continuous WASM/WebGPU decode of ~6s windows
  during an active meeting) but is confined to a dedicated Web Worker thread that only runs while `listen.ts`
  is actively feeding `'audio'` messages, and `listen.ts` (outside this lane's scope) terminates it on every
  meeting-end/teardown path we sampled (9 `.terminate()` call sites). No orphaning pattern found in the worker
  itself; not a "parked/hidden" persistent-background cost like F1.
- **`onboarding-starfield-engine.ts`**, **`components/onboarding/KineticGrid.tsx`**: both correctly gate their
  RAF loops on `document.hidden`/`visibilitychange` (`onboarding-starfield-engine.ts:247`,
  `KineticGrid.tsx:55,87,145`). Their GPU cost (WebGL1 + `UnrealBloomPass` postprocessing for the starfield) is
  real but transient — mounted only during first-run onboarding (`OnboardingStarfield.tsx`), not a persistent
  background cost.
- **`operator/src/export/{tables,csv,xlsx}.ts`, `operator/src/routes/export.ts`**: admin-only auth, rate
  limited (10/60s per admin), every export audited post-stream with true row counts, formula-injection guarded
  identically in both CSV and XLSX writers (`guardFormulaInjection`, shared from `tables.ts`), redaction is
  explicit per-column projection (never a raw store-row spread) with `looksLikeSecret` applied to seat
  free-text fields. No content-retention (§16) or injection issues found.
- **`docs/operator/ACCESS-BYPASS-INTEGRATIONS.md`**: cross-checked against `operator/src/access.ts`'s
  `ACCESS_BYPASS_PATHS` — the two are in sync (`/v1/ask` and `/v1/integrations` are present in code and
  correctly flagged in the doc as needing a manual Zero Trust dashboard click). This is the already-known K09
  blocker #9 (outside-account action, correctly marked BLOCKED with an exact unblock step) — no new defect.
- **`operator/scripts/{backup,migrate,deploy,rewrap}.mjs`**: all shell out via `spawnSync`/`execFileSync` with
  argument arrays (never a shell string), so no command-injection surface. `backup.mjs --restore` is
  explanation-first (prints the plan, requires `--yes` to execute) and correctly recommends D1 Time Travel over
  a full SQL restore. `migrate.mjs` seeds are idempotent (`INSERT OR IGNORE`) and its retry logic only retries
  provably-safe statement shapes.
- **`recap-write-coordinator.ts`, `outlook-draft-lifecycle.ts`**: both are careful, race-safe concurrency
  primitives (per-file write tails, generation tokens, session-scoped idempotency keys); no correctness issue
  found.
- **`RecordingConsentReminder.tsx`**: correctly avoids the settings-write feedback loop it documents in its own
  comment (does not arm the auto-dismiss timer in `requireIndicator` mode).
- **`lib/tap/{gates,calibrate,fft,onset,classify,features}.ts`, `TapCalibration.tsx`**: dense, carefully
  reasoned DSP with explicit tuning-invariant comments; sampled closely (gates.ts, calibrate.ts) without
  finding a defect. Not exhaustively verified against synthetic waveforms (would require running the existing
  test suite, out of scope under the no-execute hard rule).
- **`shared/{prompts,lang-id,transcript-align,mars,cloud-stt-language,speaker-names,local-ai,ask-routing,
  answer-first,wrapup}.ts`**: sized and skimmed for obvious defects (dangerous patterns, unguarded array
  access); nothing found, but not read line-by-line given the volume — flag for a follow-up pass if the plan
  wants full line coverage on these specifically.

---

## Not fully covered (time/scope-bounded)

`onboarding-*.ts`/`.tsx` beyond the RAF-gating check (the full state machines in `onboarding-demo.ts`,
`onboarding-boot.ts`, `onboarding-completion.ts`, `onboarding-music.ts`, `onboarding-portal.ts` were read for
dangerous patterns only, not full logic review); `work-progress.ts`, `AgendaView.tsx`, `TimeSavedView.tsx`
were read but not deeply cross-checked against their callers; `main/island/geometry.ts`'s ~40 pure functions
were read in full but not independently re-derived against every one of their own test files. A dedicated
follow-up pass on the 2.7k LOC `shared/*.ts` set (prompts.ts/lang-id.ts especially, both flagged elsewhere as
"the default answer path") would be the highest-value next increment if more budget opens up.
