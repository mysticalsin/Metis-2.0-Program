# L07 — Renderer Components — Audit Report

**Repo**: `/Users/tony/AI-Brain-build/metis-2.0` (read-only checkout, origin/main `2bf21f1c`, v1.9.6)
**Lane files**: `src/renderer/src/components/**` (115 files, 19,837 lines incl. tests) + `src/renderer/src/styles.css` (3,265 lines, the app's only stylesheet)
**Method**: brownfield-discovery (AUDIT mode) + domain-boundaries skim, Stark/Addy five-axis review. No graphify index existed for this repo; all claims below are from direct source reading (`grep`/`sed`/`wc` over the checked-out tree) plus the runtime evidence (E1–E9) supplied by the lead. No meeting/transcript *content* was read — only structure, counts and code.
**Stack fact relevant to every perf finding below**: `package.json` declares `react@^18.3.1`, `react-dom@^18.3.1`, `lucide-react`. There is **no** list-virtualization dependency anywhere in the tree (`react-window`, `react-virtualized`, `@tanstack/react-virtual` all absent) — confirmed by grep across `package.json` and the whole lane. Any "cap this list" fix below therefore has to either (a) keep the current ad-hoc slice/cap pattern, or (b) add a virtualization dependency; there is no existing in-house primitive to reuse.

---

## 1. Architecture notes

### 1.1 File-size / responsibility inventory (non-test .tsx, sorted by lines)

| File | Lines | Notes |
|---|---:|---|
| `Settings.tsx` | **9,377** | 418 KB. ~47% of all non-test lines in the lane. Single file, ~70 top-level functions/components. |
| `OnboardingExperience.tsx` | 1,921 | One component (`OnboardingExperience`, L1041–L1884 = 843 lines) drives the whole multi-act onboarding flow. |
| `Review.tsx` | 1,928 | Meeting-review screen: recap editor, next-steps/CRM push, transcript, recent-meetings rail. |
| `BrainView.tsx` | 1,471 | Intelligence dashboard: weekly chart, sector chart, deals, people, silence/promise trackers. |
| `Onboarding.tsx` | 1,000 | First-run wizard shell (provider picks, permission tiles). |
| `BrainRecordPage.tsx` | 831 | Single person/account/deal record page: aliases, commitments, merge candidates, meeting timeline. |
| `Bar.tsx` | 898 | The always-on floating overlay bar/pill (rec dot, tools cluster, answer panel host). |
| `RecallView.tsx` | 1,332 | "History" — the date-grouped meeting list + search + import queue + upcoming calendar. |
| `RightEdgeSidecar.tsx` | 430 | Side-docked agent panel. |
| `Copilot.tsx` | 319 | Live in-meeting Q&A panel. |
| `ReviewEntityStrip.tsx` | 266 | Entity chips (people/accounts/deals) surfaced during review. |

`Settings.tsx` is, on its own, larger than the next four files combined. That is the single biggest architecture problem in this lane — see §4 for a concrete split plan.

### 1.2 Things that are genuinely well built (so the findings below read in context)

- `MeetingRow` in `RecallView.tsx` (L472) is wrapped in `memo(...)`, takes only primitive/callback props, and the row-open button, rename button and connections-toggle are real `<button>` elements with `aria-label`/`aria-expanded`/`title` — this is correct, deliberate accessibility work, not an accident (see the in-code comment at RecallView.tsx:493–496 explaining why the Intelligence-status dot uses `role="img"` + `aria-label` instead of color alone).
- `Settings.tsx`'s tab bar (L6470–6505) implements the WAI-ARIA APG "tabs" pattern correctly: `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, `aria-controls`, and a real roving-tabindex + Left/Right arrow-key handler (L6483–6489), not just mouse clicks.
- rAF-driven animations that actually need to run continuously (`IdentityCard.tsx` L83–129, `BrandThinkingOrb.tsx` L54–85) both listen for `visibilitychange` / check `document.hidden` and cancel the frame loop when the window is hidden. `Settings.tsx`'s `MicLevelMeter` (L5149–5234) tears down its `AudioContext` + rAF loop correctly on unmount/device change.
- `styles.css`'s `prefers-reduced-motion` block (L2889–2914) is not a blanket "kill all animation" — it deliberately keeps a couple of *meaningful* liveness signals alive (the recording dot, the "agent is working" ring) via an opacity-only reduced variant, with a comment explaining why. That is above-average craft for this axis.
- `RecallView.tsx` already caps its first paint to `INITIAL_RENDER_CAP = 100` meetings (L465, L1164–1175) with an explicit "Show all N meetings" escape hatch — the right instinct, just not applied consistently elsewhere (§2.1).

---

## 2. Findings

### 2.1 [P1 · performance/architecture] No virtualization anywhere; several "could grow unbounded" lists render every row into the DOM with no cap

**Evidence (OBSERVED):**
- No virtualization library in `package.json` (checked above).
- `RecallView.tsx` L1159–1175: meeting list is capped at 100 rows on first paint, but the "Show all {totalCount} meetings" button (L1290–1298) removes the cap entirely and renders **every** meeting as a `MeetingRow` — no windowing. For a user who has been through the repeated-crash/relaunch cycle in E3 (8 launches in one day) and years of meetings, `totalCount` is not bounded by the code.
- `Review.tsx` L1861–1866: the "Full transcript" panel renders `speechLines.map((l, i) => ...)` with **no scroll container of its own** — the in-code comment at L1859–1860 states this on purpose ("No inner scroll: the transcript flows in full ... so the whole Overview + transcript is visible"). `speechLines` is one row per spoken turn; a normal 30–60 minute meeting with active back-and-forth easily produces several hundred to low-thousands of turns, all mounted as live DOM nodes the moment the section is expanded.
- `BrainView.tsx` L1328 (`deals.map(...)`) and L1349 (`people.map(...)`) render the **entire** deals/people arrays with no `.slice()` cap — unlike every sibling section in the same file (`mars.meetings.slice(0,6)` L1222, `silence` items `.slice(0,4)`/`.slice(0,2)` L1305/1310, `lint.slice(0,5)` L1444). The inconsistency is the tell: some lists in this exact file were already capped by whoever wrote it; `deals`/`people` were not.
- `BrainRecordPage.tsx` L810 (`meetings.map(...)`) — the per-record "Meeting timeline" is uncapped, two lines below a sibling list (`mergeCandidates.slice(0, 30)` at L724) that *is* capped in the same file.

**Failure scenario**: A long-tenure user (or, per E3/E6/E8, one who has been through many crash/relaunch cycles and accumulated a large `local-llm`/brain footprint) opens History → "Show all", or opens a long meeting's transcript, or opens a BrainRecordPage for a person/account they've met dozens of times over years. React mounts thousands of DOM nodes in one commit. This is a plausible renderer-side contributor to "it's very heavy on the PC" (Tony's bug report) and to the freezes described in E3/E6 (`render-process-gone reason=killed`, `app.unresponsive kind=overlay`) — a multi-thousand-node synchronous commit on the main renderer thread is exactly the shape of bug that produces a multi-second UI freeze culminating in "unresponsive" / Electron killing the renderer.

**Severity**: P1 (performance; plausible contributor to a P0 user-visible freeze, but I can't prove causation from static analysis alone — see "what would confirm this" below).

**Fix direction**: Add one virtualization primitive (`@tanstack/react-virtual` is the lightest, hook-based option, easiest to retrofit into `MeetingRow`'s flat list and the transcript list) and apply it consistently to: RecallView's meeting list (replace the binary cap/show-all with real windowing), Review.tsx's transcript panel (give it its own bounded-height scroll container + windowing instead of "flows in full"), BrainView's `deals`/`people` sections (mirror the `.slice()` pattern already used by sibling sections, or virtualize if unbounded is a real requirement), and BrainRecordPage's meeting timeline. **What would confirm this before spending the engineering budget**: instrument one of these views with React DevTools Profiler (or `performance.mark` around the commit) against an account with a few thousand meetings/turns — that turns this from DERIVED into OBSERVED and gives a real before/after number to fix against.

---

### 2.2 [P2 · architecture] `Settings.tsx` is one 9,377-line file; the internal structure already wants to be ~28 files

**Evidence (OBSERVED, exact line ranges from the file itself):**

The file already contains ~28 self-contained top-level function components, most only loosely coupled to their neighbors through `settings`/`patch` props. The largest are:

| Component | Lines | Span |
|---|---:|---|
| `Settings` (the exported orchestrator) | 1,285 | L6273–7558 |
| `DustSetup` | 948 | L4117–5065 |
| `AiSection` | 816 | L881–1697 |
| `CliIntegration` | 605 | L2487–3092 |
| `ProfileEditor` | ~350+ (to EOF) | L9308– |
| `AgentPicker` | 213 | L3904–4117 |
| `McpConnectionCard` | 290 | L3092–3382 |
| `ProductConnectCard` | 305 | L3382–3687 |

The `Settings()` orchestrator itself only owns 4 `useState` + 3 `useEffect` + 1 `useMemo` (checked directly) — its 1,285 lines are almost entirely JSX composing the other sections, i.e. it is not that the *state* is entangled, it is that the *file* is. That is the good news: this is a low-risk, mechanical extraction, not a rearchitecture.

**Concrete target file list** (new directory `src/renderer/src/components/settings/`):

- `settings/Settings.tsx` — the orchestrator (tab bar, search, tab routing) only; imports everything below.
- `settings/AiSection.tsx` — `AiSection`, `providerLimitLabel`, `recommendedProvider`, `prettyModel`, `ProviderTile`.
- `settings/ResilienceSection.tsx` — `ResilienceSection`, `FallbackOrderEditor`.
- `settings/LocalAiSection.tsx` — `LocalAiSection`, `AsrModelRow`, `CoreAsrAssetsRow`, `coreAsrAssetsView`, `coreAsrAssetsFailureStatus`, `StepBadge`, `WhisperQualityRow`, `asrImportModelDescription`.
- `settings/CliIntegration.tsx` — `CliIntegration`.
- `settings/IntegrationsCards.tsx` — `McpConnectionCard`, `ProductConnectCard`, `ClickupCard`, `PlaneCard`.
- `settings/OperatorLicenseCard.tsx` + `settings/LicenseSection.tsx` — `OperatorLicenseCard`, `LicenseSection`, `licenseErrorMessage`.
- `settings/AgentPicker.tsx`, `settings/DustSetup.tsx` — split as-is; `DustSetup` at 948 lines is itself a second-order refactor target once extracted (it likely has its own internal sub-sections worth a follow-up pass).
- `settings/AudioSection.tsx` — `getAudioChoices`, `AudioChoices`, `MicLevelMeter`, `MicPicker`.
- `settings/PersonalizationSection.tsx` — `ModePromptEditor`, `ContextDocs`, `PersonalizeModes`.
- `settings/DiagnosticsSection.tsx`, `settings/TimeSavedSettings.tsx`, `settings/IntelligenceTab.tsx`, `settings/GraphSection.tsx` + `OperatorMcpServersSection.tsx`, `settings/DangerZoneSection.tsx`, `settings/CalendarTab.tsx`, `settings/PermissionsSection.tsx` (+ `PermissionDot`, `screenRecordingJustGranted`), `settings/Shortcuts.tsx` (+ `KeyRecorder`, `KeyChips`, `keyEventToAccelerator`), `settings/ProfileEditor.tsx` — one file each, same pattern.
- `settings/SupportBundleSection.tsx`, `settings/UpdatesSection.tsx` — one file each.
- `settings/shared/controls.tsx` — the generic building blocks reused across sections: `Section`, `ToggleRow`, `Toggle`, `ExpandableSection`, `LazyTextarea`, `LazyInput`, `useLazyText`, `VocabCorrectionsTextarea`, `ManagedChip`, `VocabSuggestions`, `serializeAsrCorrections`/`parseAsrCorrections`/`sameAsrCorrections`.
- `settings/shared/helpers.ts` — pure functions with no JSX: `detectHint`, `isProfileUnlockError`, `fuzzyIncludes`, `searchSettingsTabs`, `settingsScrollClipsOverflowX`, `pickReadyProvider`.

**Fix direction**: this is a pure move/extract-function refactor (rename nothing, change no behavior) — safe to do file-by-file behind the existing `Settings.contract.test.ts` (34 KB, already exercises most of this) and the per-feature test files (`Settings.cloud-stt.test.tsx`, `Settings.local-models.test.tsx`, etc.) that already exist alongside it. Risk: **low**, because the tests already exist and are already scoped roughly one-per-section (see §5 test gaps for the one place this isn't true).

---

### 2.3 [P1 · accessibility] The two full-app "hard gates" (SignInWall, LicenseGate) and the onboarding flow carry no dialog semantics and no focus trap

**Evidence (OBSERVED):**
- `grep -rn 'role="dialog"\|aria-modal' components/*.tsx` → **zero matches** in the entire lane.
- `SignInWall.tsx` L33 doc-comment: *"Hard gate shown when Azure SSO is configured but the user is not signed in. **Blocks all app use.**"* — no `role="dialog"`, no `aria-modal="true"`, no `autoFocus` anywhere in the file.
- `LicenseGate.tsx` — same shape (a full-screen blocking license/key entry screen), same absence: no dialog role, no `aria-modal`, no `autoFocus` (checked directly).
- `OnboardingExperience.tsx`'s 843-line `OnboardingExperience` component (L1041–1884) drives a multi-act, full-screen, non-skippable-by-default flow with the same absence of dialog semantics.

**Failure scenario**: A screen-reader user hitting `SignInWall`/`LicenseGate` gets no signal that they are in a modal context (no "dialog" role announcement), and — depending on what `App.tsx` does with the rest of the tree while the gate is shown (out of this lane's file list; worth a quick check by whoever owns `App.tsx`) — keyboard/AT focus may not be contained to the gate at all, i.e. Tab could walk into inert background content that isn't actually usable yet.

**Severity**: P1 (accessibility correctness on the two screens every single user is forced through before they can use the app at all — not an edge case).

**Fix direction**: wrap both gates in a real `role="dialog" aria-modal="true"` container, move initial focus into the gate on mount (e.g. `autoFocus` on the first actionable control, matching the pattern MeetingRow already uses correctly elsewhere in this lane), and add a minimal focus trap (Tab/Shift+Tab wrap-around) — a handful of lines each, mechanical, low risk. Confirm with `App.tsx`'s owner whether the app tree is unmounted or merely visually covered while a gate is shown; if the latter, the missing trap is a real keyboard-escape bug, not just a screen-reader-quality gap.

---

### 2.4 [P2 · design-token consistency] Two independent "warning amber" colors, plus stale fallback literals the codebase's own comment already says to delete

**Evidence (OBSERVED):**
- `styles.css` L46–52: `--color-warn: #fac775;` is declared, with a comment stating: *"Was consumed in 5 components only via an inline `var(--color-warn, #fac775)` fallback — the token itself was never declared. One source of truth here; **the inline fallbacks can now be dropped**."* — i.e. the author already fixed the root cause and left a TODO-by-comment that was never followed through.
- The stale `var(--color-warn,#fac775)` fallback literal is still present in exactly 5 files today: `Answer.tsx` (L169,172,180,188), `Copilot.tsx` (L147,150,158,166), `Onboarding.tsx` (L251,256), `Review.tsx` (L979), `Bar.tsx` — confirmed by `grep -rln "color-warn,#fac775" components/`.
- Separately, `BrainView.tsx` L59 (`const MIXED_COLOR = '#e0af68'`) and `ReviewEntityStrip.tsx` L93 (`const WARN_COLOR = '#e0af68'`) each **independently hardcode the identical hex** as their own local constant rather than sharing one declaration — and `ReviewEntityStrip.tsx`'s own comment at L92 says *"Same 'mixed' amber BrainView uses for warning-tinted state"*, i.e. the author knew it was the same color and copy-pasted the literal instead of centralizing it. `#e0af68` is **not** the same value as the actual `--color-warn` token (`#fac775`) — so the codebase now has two different, undocumented "this is a warning" ambers in parallel.
- `OnboardingExperience.tsx` L898 and L1588 hardcode `bg-[#9A2BF0]` for two progress-bar fills. `styles.css` L27 declares `--color-accent: #7f00da` (later overridden contextually at L153 to `var(--cl-primary)`) — a *different* purple. The onboarding progress bars are visually close to but not tied to the app's actual accent token, so a future accent/theme change silently misses these two spots.

**Severity**: P2 (no functional bug, but exactly the kind of drift the task asked to check for, and it's cheap to fix because the comments already document the intended end state).

**Fix direction**: (1) delete the `,#fac775` fallback from the 5 files listed — `--color-warn` is unconditionally declared in `:root`, per the codebase's own comment. (2) Replace both `MIXED_COLOR`/`WARN_COLOR` locals with a single new token, e.g. `--color-mixed: #e0af68`, declared once in `styles.css` next to `--color-warn`, imported by both files. (3) Replace the two `#9A2BF0` literals in `OnboardingExperience.tsx` with `var(--color-accent)` (or confirm with design whether onboarding intentionally uses a fixed brand purple independent of the themeable accent, and if so document that as a token, e.g. `--color-onboarding-accent`, instead of a bare literal repeated twice).

---

### 2.5 [P3 · readability/consistency] Array-index React keys on two list types; `DealRow` is the one un-memoized row component in an otherwise memo-conscious lane

**Evidence (OBSERVED):**
- `RecallView.tsx` L453 `<CompactEventRow key={i} ...>` and L709 `key={`${t}-${i}`}` — index-derived keys for the "upcoming calendar events" strip. Low risk in isolation (short, rarely-reordered lists) but inconsistent with the rest of the file, which correctly keys on stable identity (`key={m.file}` L1265, `key={date}` L1257).
- `Review.tsx` L1866 `speechLines.map((l, i) => (<div key={i} ...>` — index key on the transcript lines (see §2.1 for the size problem with this same block; the key choice is a smaller, separate issue — safe today only because the array is immutable once the meeting is loaded).
- `BrainView.tsx` L309 `function DealRow({ ... })` — defined as a plain function, not `memo(...)`, while its sibling row components elsewhere in the lane (`MeetingRow` in RecallView.tsx, `ScreenFreshnessChip` in Bar.tsx) are. `DealRow` receives `accountIdByName` (a lookup object) and two callbacks (`onSetOutcome`, `openRecord`) as props; if any of those aren't referentially stable from the parent, every `deals` row re-renders on every BrainView re-render regardless of whether that row's own data changed.

**Severity**: P3 (no observed correctness bug; a real but minor consistency gap against the lane's own established pattern).

**Fix direction**: swap the index keys for stable identifiers where one exists (`CompactEventRow` — key on the event's own id/start-time if available; transcript lines could key on `` `${l.t}-${l.speaker}` `` since `t` is a monotonic timestamp). Wrap `DealRow` in `memo(...)` to match `MeetingRow`/`ScreenFreshnessChip`.

---

### 2.6 [P3 · performance, contextual] The always-visible overlay bar uses `backdrop-filter: blur(...)` continuously; flagged for awareness, not as a standalone bug

**Evidence (OBSERVED):** `styles.css` L260–305 apply `backdrop-filter: blur(var(--blur-bar)) saturate(...)` to `.bar`/`.panel` — the always-on-top floating toolbar that is the app's primary UI surface (rendered by `Bar.tsx`). `backdrop-filter` forces the compositor to resample everything visually behind the element on every repaint of that region, which is a known continuous GPU cost for an always-on-top translucent overlay in Electron, independent of any JS work — it is not gated by a CSS `@keyframes`/`infinite` animation (I found none tied to `.bar`/`.panel` themselves; the `infinite` animations elsewhere in the file are all correctly scoped to elements that only mount while their specific state is active — recording, listening, loading — see the "well built" list above).

**Severity**: P3 — flagging as a known cost of the product's actual design (an always-visible translucent overlay bar), not a coding defect. I have no in-app profiling evidence that this is *the* cause of "very heavy on the PC" (E1's 3.3 GB local-LLM + orphaned llama-server processes in E2 are far more likely primary causes, and those are main-process/lifecycle, not renderer). Listed here only because the task explicitly asked to check `backdrop-filter` usage, and because it's the one continuous-cost CSS effect in the lane that isn't already state-gated the way everything else is.

**Fix direction (if profiling ever points here)**: reduce blur radius or drop `backdrop-filter` in favor of a cheaper semi-opaque solid fill on lower-end/integrated GPUs, gated by a runtime capability check — not worth doing speculatively without a profile first.

---

## 3. Cross-lane pointer (not a finding in this lane, flagged for whoever owns it)

`Answer.tsx`/`Copilot.tsx` both render a `captureNotice` banner (Answer.tsx L166–190, Copilot.tsx L144+) whose *source* state (`captureError`) lives in `App.tsx` (outside this lane's file list — `App.tsx` is not under `components/`). E5's evidence shows `capture.failed` recurring roughly every 6 seconds while Screen Recording permission is off. If `captureError` in `App.tsx` is updated on every one of those retries (rather than de-duped to "still failing, no change"), that would force a re-render of `Answer`/`Copilot`/`Bar` roughly every 6 seconds indefinitely while permission stays off — worth a 5-minute check by the lane that owns `App.tsx`/main-process IPC wiring (likely L01/L02, which already documented the capture-retry loop itself).

---

## 4. Test gaps

- **Settings.tsx**: `Settings.contract.test.ts` (34 KB) plus 7 feature-scoped test files already exist and cover a good fraction of the file, but there is no test file at all for `DustSetup` (948 lines) or `AgentPicker` (213 lines) — both are large enough, and (per their names) integration-shaped enough, to be worth locking down with tests *before* the file-split in §2.2, so the split has a regression safety net for exactly the two biggest un-tested chunks.
- **RecallView.tsx / Review.tsx / BrainView.tsx**: no test exercises "many rows" (hundreds/thousands of meetings, deals, people, or transcript turns) — every test I found operates on small fixture arrays (a handful of items). Given §2.1, a test that asserts "N=2,000 rows renders under X ms" or, at minimum, "N=2,000 rows does not throw / does not exceed some DOM-node-count budget" would directly protect against the scenario in §2.1.
- **SignInWall.tsx / LicenseGate.tsx**: no test asserts focus placement or keyboard containment (matches §2.3 — there's nothing to test yet because the behavior doesn't exist).

---

## 5. Refactor opportunities (summary — see §2.2 for the detailed one)

1. **Split `Settings.tsx` into `settings/*`** — see §2.2 for the full file list. Low risk (pure extraction, existing tests). Highest-value single change in this lane for both readability and future review cost.
2. **Adopt one virtualization primitive and apply it to the four uncapped/all-render list sites** in §2.1 (RecallView show-all, Review transcript, BrainView deals/people, BrainRecordPage meeting timeline) — medium risk (new dependency, touches render logic on the app's most-used screens), high value if the profiling check in §2.1 confirms the freeze connection.
3. **Centralize the two duplicate-amber tokens and delete the 5 stale fallback literals** (§2.4) — trivial, no-risk, one-sitting cleanup; the codebase's own comment already specifies the intended end state.
4. **Add dialog semantics + focus trap to `SignInWall`/`LicenseGate`** (§2.3) — low risk, mechanical, meaningfully improves the accessibility of the two screens 100% of users pass through.
