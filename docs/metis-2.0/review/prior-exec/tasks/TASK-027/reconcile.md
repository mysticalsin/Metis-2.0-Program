# TASK-027.A / TASK-028.A reconciliation: two P1s and right-edge input

Prep lane, 2026-09-24. Read-only: no source file, branch, ref or remote was changed. No npm script or test was run in the source worktree (dependency install may be in flight there). All test results quoted come from the existing baseline receipt.

Legend: **VERIFIED** (command or file:line given) · **ASSUMED** · **UNKNOWN** · **NOT_AVAILABLE** (exact error quoted). A source finding is not a runtime pass (MASTER §33). None of the defects below has been reproduced in a running app yet.

## 0. Identities

| Item | Value | Evidence |
|---|---|---|
| Contract | MASTER rev 4.5. Packets: `read_task.py --task 27` and `--task 28`. MASTER lines 99, 230, 382-390 (§5.2-5.3), 483-495 (§5.10-5.11), 1301 (§15.1), 2291-2320, 4805-4850 (§33.5-33.7). Rows: EXP-05 :3938, EXP-10 :3978, SRC-07 :4080, SRC-09 :4104, SRC-11 :4128, SRC-14 :4164, SRC-22 :4260 | VERIFIED `grep -n` |
| Source | `/Users/tony/AI-Brain-build/metis-2.0`, HEAD = origin/main = `2bf21f1ceefe117838325342574b57852e5cadcb`, package `1.9.6` | VERIFIED `git rev-parse HEAD origin/main`; package.json:3 |
| Baseline tests (synthetic) | At 2bf21f1c: onboarding-boot 25/25, RightEdgeSidecar 14/14, command-mic-guard 2/2, right-edge-dismissal-lock 9/9, island/right-edge-placement 7/7, right-edge-placement.contract 5/5, dev-env-gates.contract 8/8, exclusive-bounds-repair 5/5, overlay-autohide 16/16, OnboardingExperience.mqa283 20/20. **OnboardingExperience.browser.test.ts: 6/6 SKIPPED** | VERIFIED `receipts/baseline-desktop.json` (parsed), `receipts/BASELINE-EXITS.txt` |

Rows SRC-07/09/11/22 bind TASK-027.B and TASK-028.B (credential broker, embedded credentials, native persistence, recap templates). They are out of scope for the narrow A repairs. Only one A-scope constraint comes from them: the 027.A patch must not add or touch credential, packaging-resource, persistence or recap code. SRC-14 and EXP-10 limit 028.A: it must not replace the rail with an improvised orb, since §5.11 orb-only ARMED belongs to TASK-030/028.B. EXP-05 acceptance (task study) is a 028.B/final-candidate gate.

## 1. Lineage map

| Ref | SHA | Pkg | #197 fix | #196 fix set | Evidence |
|---|---|---|---|---|---|
| Tip both issues were filed on | `ac1a62d8` (claude/dock-three-fixes) | 1.9.8 | no: raw reads at src/main/index.ts:1493-1494, 1501, 2065 | no: hide-only retire at act1-boot.js:16-21; HeroWelcome hides at OnboardingExperience.tsx:311 | VERIFIED `git show ac1a62d8:<path> \| grep -n` |
| Original #197 fix | `7d684b24b2f4a1944388d94dd1c6c5dedfe5cc1a`, parent ac1a62d8 | 1.9.8 | yes | n/a | VERIFIED `git cat-file -t` → commit; `git show` |
| Original #196 fix | `a4fa77eb92ad647d43e6c1e8357fcaad501c226e`, parent 7d684b24 | 1.9.8 | yes | only the zombie-Next removal (C1) | VERIFIED `git show` |
| Dock-lane tip = PR #194 head | `a105a258` (PR #194 OPEN, unmerged, base main) | 1.9.8 | yes | C1 plus eager demo import (12f44e46, by subject only). **No media guard (C2)**: `grep -c "continue without music"` = 0 | VERIFIED `gh pr view 194`; `git show a105a258:…` |
| Main integration | `fca1e6b5` "fix(metis): stabilize onboarding and preserve operator usage integrity", parent 55f8b06b, via **PR #199**, merged 2026-09-23T04:42:43Z, merge `bf2358e1` | n/a | yes | C1 + C2 + reveal restored + eager demo import | VERIFIED `gh api …/commits/fca1e6b5…/pulls`; `git show fca1e6b5` |
| origin/main | `2bf21f1c` | 1.9.6 | yes | yes (source) | VERIFIED |
| Tag v1.9.5 | `fff88c26` (= merge-base main / dock lane) | n/a | no | no; also **contains ecde883d, which skips the demo** | VERIFIED `git grep`/`git merge-base --is-ancestor` exit 0 |
| origin/codex/review-release-1.9.1 | `83d9d3fa` | 1.9.5 | no (fca1e6b5 not an ancestor, exit 1) | no | VERIFIED |
| Source-repo GitHub "Latest" | v1.8.9 → `4607dcd0` | n/a | no | no | VERIFIED `gh release list`, `git grep` |
| **Customer feed** `mysticalsin/Metis-Releases` Latest | v1.6.6 (source tag `7f4c6257`) | 1.6.6 | no: raw reads at v1.6.6 src/main/index.ts:776-784, 1502, 1524 | n/a (act1-boot.js does not exist there) | VERIFIED `gh release list --repo mysticalsin/Metis-Releases`; electron-builder.yml:319-330 names this feed |
| Feed draft v1.9.8 | built from a105a258 (release body), Mac DMG/zip | 1.9.8 | yes (local pack byte scan, below) | C1 only | VERIFIED `gh release view v1.9.8` |
| Feed draft v1.9.6-unsigned | built from main 2bf21f1c (release body; Build & Test run 35872259580), Windows Setup/Portable | 1.9.6 | ASSUMED yes (from source SHA; artifacts not scanned) | ASSUMED yes | VERIFIED metadata `gh release view v1.9.6-unsigned` |

Local clones and packs:
- `~/dev/metis-fix3` HEAD and local `claude/dock-three-fixes` are both `a4fa77eb`. The working tree is clean (`git status --porcelain` gives 0 lines). Its `origin/claude/dock-three-fixes` ref is stale at `fa36444f`; GitHub's head is `a105a258`. VERIFIED (git read-only commands).
- The only "PASS" for a4fa77eb ran under **electron-vite dev**, not a bundle. Its report is `/Users/tony/dev/metis-191-qa/bob-a4fa77eb/SMOKE-REPORT-a4fa77eb-DIG-FE.txt`: "Launch: electron-vite dev", "Pack Dig Metis.app: NOT YET". `04-demo-0.json` shows `"url": "http://localhost:5173/?exclusiveOnboarding=1"`. VERIFIED.
- The packaged app at `/Users/tony/agent-tools/metis-191/packs/a105a258/macos/dig/Metis.app` (Info.plist 1.9.8) exists. Its `app.asar` contains `devEnv("ELECTRON_RENDERER_URL")` at the decoder and `overlayRendererUrl` sites and no raw `process.env` form, per a python mmap scan. It also contains the a4fa77eb "zombie #act1-boot-next" comment (`grep -c -a` = 2). VERIFIED. This bundle can serve the dock-lane packaged proof.
- The packs directory holds only dock-lane SHAs (5373e122, a105a258, cf5ec686, f1a911e9, fa36444f). No local Mac package of main 2bf21f1c was found there (VERIFIED `ls`). Whether one exists elsewhere is UNKNOWN.

**Version-line hazard:** main is 1.9.6, but a 1.9.8 dock-lane draft sits on the customer feed. If v1.9.8 is ever published, a later 1.9.6 main build would not be offered as an update. That assumes electron-updater's default no-downgrade behavior; `allowDowngrade` was not inspected. The owner must choose the shipping line and version before 027.A is released (§6).

## 2. P1 #197: packaged app honors a stale `ELECTRON_RENDERER_URL`

**Issue:** VERIFIED `gh issue view 197`: OPEN, created 2026-09-21T09:19:46Z. One owner comment says the fix is on tip 7d684b24 and "Needs a Dig reseat on a pack that includes this tip".

**Symptom:** The packaged 1.9.8 Dig `Metis.app` was launched while the user session had `ELECTRON_RENDERER_URL=http://localhost:5173` (a launchctl leftover) and no Vite server running. The page loaded `http://localhost:5173/?exclusiveOnboarding=1` and failed to `chrome-error://chromewebdata/` with ERR_CONNECTION_REFUSED. Result: 0 windows and no MetisMark. The issue says this is the same class as the local `check:launch` renderer-ready 150 s FAIL.

**Root cause** (VERIFIED at ac1a62d8): `overlayRendererUrl()` read the override raw with no `app.isPackaged` gate, at `src/main/index.ts:2065` (`process.env['ELECTRON_RENDERER_URL'] ?? pathToFileURL(...)`). The import decoder did the same at `:1493-1494` and `:1501`. electron-vite sets this variable only for `dev`. A value left at user level (launchctl setenv on macOS, HKCU\Environment on Windows) reaches the packaged process.

**Fix:** Route both reads through `devEnv()`, which returns undefined in a packaged build. It is defined at src/main/dev-env.ts:33-35. It relies on `isPackagedBuild()` at :24-30, which fails closed if `app.isPackaged` throws.

| Where | Commit | Status | Evidence |
|---|---|---|---|
| Dock lane | 7d684b24 | only on claude/dock-three-fixes | VERIFIED `git branch -a --contains 7d684b24…` → `remotes/origin/claude/dock-three-fixes`; `git merge-base --is-ancestor 7d684b24… origin/main` → exit 1 |
| Main | fca1e6b5 (PR #199) | in origin/main | VERIFIED `git log -S"devEnv('ELECTRON_RENDERER_URL')" origin/main` → fca1e6b5 |
| Equivalence | functional, not a cherry-pick | I normalized the added and removed lines of both commits' `src/main/index.ts` hunks, dropping comments and restricting to the renderer-URL lines. `diff` exit 0: **IDENTICAL**. Only comments differ ("GH #197" vs "Packaged imports must ignore a stale user-level Vite URL"). The test hunk has the same assertions; its comment says MQA-339 instead of GH #197. Parents differ (ac1a62d8 vs 55f8b06b), so SHA/patch identity does not hold. | VERIFIED |
| Present on main | **YES** at src/main/index.ts:1491 (`const viteDev = devEnv('ELECTRON_RENDERER_URL')`), :1500-1501, :2064. The URL is consumed at :2782 and :2807. No other main-process reader exists: the other window loads are intelligence.ts:167 (`loadFile`) and index.ts:8451 (a `data:` URL). | VERIFIED `grep -rn` over src/main non-test files |
| Ledger | docs/qa/BUG-LEDGER.md:77 and :4635-4639 list MQA-339 as **OPEN**: "exact installed package launch/visual readback remains unverified". The ledger never cites GH #197. | VERIFIED `grep -n` |

**Gaps** (all VERIFIED):
- **G197-1:** The negative guard misses the dotted form. The regex at `src/renderer/src/lib/onboarding-boot.test.ts:201` is `/process\.env\[?['"]?ELECTRON_RENDERER_URL/`, and it does not match `process.env.ELECTRON_RENDERER_URL`, which is exactly the pre-fix decoder form (ac1a62d8 index.ts:1493). A `node -e` probe gives: dotted → false, bracket → true, destructured `const { ELECTRON_RENDERER_URL } = process.env` → false, `process.env?.` → false. The guard also scans only index.ts, and the positive assertion (:199) covers only `overlayRendererUrl`. **A decoder regression would pass the current suite.**
- **G197-2:** No behavioral test covers unset, unreachable or reachable-stale overrides. Only regex anchors exist, and no other test references the variable. The only other hit, `security-audit-10.contract.test.ts`, checks CSP in decoder.html.
- **G197-3:** `scripts/check-packaged-launch.mjs` inherits the caller's environment (:67 `{ ...process.env, ASKTOTO_USERDATA: profile }`, :203 on Windows), so whether it exposes #197 depends on the shell. Neither this script nor `scripts/e2e-smoke.mjs` runs in CI: `grep` of `.github/workflows/*.yml` for check:launch, e2e-smoke, ASKTOTO_MAC_LAUNCH_GATE and ELECTRON_RENDERER_URL returns nothing.
- **G197-4:** No packaged verification exists on any candidate.

**Narrow repair plan (027.A):** No production-code change is expected. Keep the devEnv correction and its development-mode behavior (MASTER §15.1). Change only tests and harness:
1. **Fix G197-1.** Replace the index.ts-only regex with a scan of every non-test file under `src/main`. Outside comments, the token `ELECTRON_RENDERER_URL` may appear only as `devEnv('ELECTRON_RENDERER_URL')`. Prove it red first: the new assertion must fail on `git show ac1a62d8:src/main/index.ts` and on a synthetic dotted-form mutant, and pass on main.
2. **Extend `src/main/dev-env-gates.contract.test.ts`.** When packaged, `devEnv('ELECTRON_RENDERER_URL')` must be undefined for unset, `http://127.0.0.1:1` and a live-server URL. When unpackaged, it must return the value (dev mode preserved).
3. **Add an explicit override mode** to `check-packaged-launch.mjs` (or a sibling script). The mode sets or deletes the variable itself instead of inheriting it. For the stale case it starts a 127.0.0.1 sentinel HTTP server that logs every request.

**Tests that must prove it.** Run each on the Windows final candidate and on the Mac QA candidate separately (MASTER §15.1):

| ID | Override | Pass criteria |
|---|---|---|
| T197-A | unset (variable deleted) | `app.renderer.ready` audit appears. The `act1-dom.json` expectedUrl starts with `file://` and ends `…/app.asar/out/renderer/index.html?exclusiveOnboarding=1` (Mac: the MQA-318 gate; Windows: the window appears and CDP shows the file URL) |
| T197-B | unreachable: `http://127.0.0.1:<closed port>` | Same as T197-A, no `chrome-error://` URL, exit 0 |
| T197-C | reachable stale: sentinel server | Same as T197-A, and the **sentinel logs 0 requests** for the whole run, including after an import opens the decoder (decoder URL `file://…/decoder.html`) |
| T197-D | dev mode | `electron-vite dev` with the variable pointed at the live dev server still loads it |

Receipts bind the artifact hash, build SHA, OS/profile, exact command, exit code, sentinel log and probe JSON.

## 3. P1 #196: Act 2 demo Next does not advance

**Issue:** VERIFIED `gh issue view 196`: OPEN, 0 comments.

**Symptom:** Packaged 1.9.8 Dig at ac1a62d8, clean environment, fresh profile. Act 1 passes. In the Act 2 demo, `button.onboard-cta` "Next" was clicked 12+ times. Each click registers (`pointer-events: auto`, not disabled), but the scene stays frozen on the renewal-timeline clip and Appearance is never reached.

**Original evidence:** NOT_AVAILABLE.
- Issue evidence folder: `ls: /Users/tony/dev/metis-191-qa/bob-ac1a62d8e3/: No such file or directory`.
- Issue pack: `ls: /Users/tony/agent-tools/metis-191/packs/ac1a62d8e3/macos/dig/Metis.app: No such file or directory`.

**Root cause:** Two source-level candidates exist. Neither is proven on the installed package; MQA-338 states "The historical installed 1.9.8 freeze has not been reproduced on the exact package" (BUG-LEDGER.md:4631).

- **C1, hidden duplicate Next.** The mechanism is VERIFIED; that it caused the observed failure is ASSUMED. At ac1a62d8:
  - The static boot chrome precedes `#root` in the DOM (src/renderer/index.html:124-128).
  - `#act1-boot-next { pointer-events: auto }` (index.html:99-100) survives the parent's hidden rule.
  - `retireBootChrome` only hides the chrome (act1-boot.js:16-21), and so does HeroWelcome (OnboardingExperience.tsx:311).
  - So `querySelector('button.onboard-cta')` returns the hidden static button first. Its handler (act1-boot.js:41-45) sets `__act1BootNextQueued` and dispatches `act1-boot-next`. The only listener is HeroWelcome's (OnboardingExperience.tsx:324), which unmounted after Act 1, so the click does nothing.

  This matches every reported detail: the selector, `pointer-events: auto`, not disabled, the frozen scene. It is visible only to a harness: a human pointer cannot hit a `display:none` element.
- **C2, a synchronous media throw swallows the transition.** The code path is VERIFIED; whether 1.9.8 actually threw is UNKNOWN. Demo Next calls `onPlayVideo()` before `advance()` (OnboardingDemoScene.tsx:288-290). At ac1a62d8 and still at a105a258, `playHero` calls `music.start()` and `playOnboardingVideo()` with no guard (ac1a62d8 OnboardingExperience.tsx:1058-1061). Any synchronous throw aborts the click before the scene advances.
- **Related bypass:** ecde883d "skip hung reveal/demo after story Continue" made the problem-scene Continue skip Reveal entirely. It is in v1.9.5 and was on main until fca1e6b5 restored `setScene('reveal')` (main OnboardingExperience.tsx:1539). MASTER line 230 forbids skipping the demo. VERIFIED `git log -S"skip to next act"`.

**Fix locations:**
- **Dock lane:** a4fa77eb covers C1: act1-boot.js removes the chrome instead of hiding it, HeroWelcome removes it, a post-hero effect removes leftovers, and source tests pin this. 12f44e46 restores the eager demo import (by subject; diff not inspected). a105a258 **still lacks the C2 guard**.
- **Main (fca1e6b5):**
  - C1: act1-boot.js:16-21 disables, then removes, the chrome; HeroWelcome removes it (OnboardingExperience.tsx:305-306); the post-hero effect removes leftovers (:1229).
  - C2: try/catch around music and video (:1053-1057).
  - Reveal restored (:1539); eager `OnboardingDemoScene` import (:79).
  - `git diff --stat origin/main origin/claude/dock-three-fixes` is empty for OnboardingDemoScene.tsx, lib/onboarding-demo.ts and index.html, and shows only act1-boot.js (16+/4−, the defensive variant). VERIFIED.
- **Present on main: YES, in source.** Main is a functional superset of a4fa77eb but not patch-identical. Ledger: MQA-338 is **OPEN** (BUG-LEDGER.md:76 and :4629-4633).
- **No unconditional advance on main.** Each Next moves exactly one beat (`demoPlaybackAfterNext`, lib/onboarding-demo.ts:250-252). Only the last beat leaves the tour (`demoNextLeavesTour`, :259-261). The existing browser test enforces four user-controlled beats. VERIFIED by reading.

**Gaps** (all VERIFIED):
- **G196-1:** The regression suite is opt-in. `OnboardingExperience.browser.test.ts:12` has `describe.skipIf(process.env.ASKTOTO_BROWSER_QA !== '1')`. All 6 cases were skipped at baseline, and CI skips them too: `build.yml` installs Playwright Chromium (:54-55) and runs `npm test` (:56) without that variable.
- **G196-2:** The suite mounts through a Vite dev server, not the bundled renderer. The only a4fa77eb pass was electron-vite dev.
- **G196-3:** The suite clicks with Playwright locators (real pointer). It never exercises the Dig-style programmatic `document.querySelector('button.onboard-cta').click()` path that reported the bug.
- **G196-4:** No packaged run exists on any candidate.

**Narrow repair plan (027.A):**
1. Change onboarding logic only if a bundled or packaged reproduction on main fails. Keep every required check: no demo skip, no auto-advance.
2. Make the browser regression mandatory in CI. Either set `ASKTOTO_BROWSER_QA=1` on the build.yml `npm test` step, or skip only when Chromium is genuinely absent and print the reason. Gate on process exit code and the vitest JSON `success` field, never on the failed-test count (transform and unhandled-error blind spots).
3. Add a bundled-renderer variant. After `electron-vite build`, load `out/renderer/index.html?exclusiveOnboarding=1` over `file://` with the same `window.toto` stub.
4. Port the C2 guard (the fca1e6b5 `playHero` hunk) to the dock lane only if the owner decides the 1.9.8 line ships.

**Tests that must prove it:**

| ID | What | Pass criteria |
|---|---|---|
| T196-A | Bundled renderer, Chromium | Act 1 → Next → Continue → 4× demo Next → heading "Where should Métis sit?". Four distinct beat texts observed. `#act1-boot-next` count is 0 after React mounts. The first `button.onboard-cta` match is the visible React Next, and a programmatic `.click()` on it advances (Dig parity) |
| T196-B | Same, variants | Reduced motion; compact 1100×640; `HTMLMediaElement.prototype.play` throwing. These are existing cases, now run on the bundle |
| T196-C | Red first | T196-A must fail on a pre-fix bundle. ac1a62d8 build: frozen scene on the Dig-parity click (C1). 55f8b06b or v1.9.5 build: Reveal skipped |
| T196-D | Packaged, combined with T197-A/B/C | Real CDP mouse events (`Input.dispatchMouseEvent` at element box centers) along the same path to Appearance. Per-click scene-text receipts (like bob-a4fa77eb/demo-advance.json) and screenshots. Sentinel logs 0 requests. No orphan audio or video after onboarding finishes (SRC-15 exit evidence). Run on the Windows final candidate and the Mac QA candidate separately |

## 4. TASK-028.A: right-edge geometry and input on main

**Scope:** Main's `RightEdgeSidecar` (placement `right-edge`, surface `edge-chat`, overlay-presentation.ts `resolveOverlayPresentation`). It is not PR #194's `DockPanel`: `git ls-tree` finds 0 DockPanel files on main, while the dock lane has `DockPanel.tsx` and a `'dock'` layout (its overlay-chrome.ts:16). VERIFIED. Which lineage is the "approved dock mode" (§5.3) is an owner decision (§6).

**Geometry authority today:** `src/main/island/geometry.ts:226-298`. Margin 12; tab 52×52; drawer 360 wide × min(560, workArea.height − 24) high; normalized Y per display; fallback to top-center when workArea.width < 384 DIP.

**Defects against the packet's verify criteria.** All come from reading the source; each needs before/after running-app evidence.

| # | Sev | Defect and evidence | Repair | Proving test |
|---|---|---|---|---|
| D1 | HIGH | **Typing disappears while anything streams.** The composer is disabled whenever `busy` (RightEdgeSidecar.tsx:57 `disabled={!available \|\| busy}`). `busy` is `capturing \|\| ask streaming \|\| suggest streaming` (App.tsx:3962, 4026), so repeated live-meeting suggestions disable it mid-typing. A disabled element drops focus and keystrokes go nowhere. The top-center Bar input has no `disabled` (Bar.tsx:542-556). Focus is never restored: App's `focusSignal` reaches only Bar (App.tsx:4102; Bar.tsx:342-343), and the dock ignores both `inputRef` and `focusSignal` (RightEdgeSidecar.tsx:200-206, 415-423) | Keep the input enabled. Block only submission while busy (`submit()` already returns when busy, :39-42). Pass `focusSignal` to the dock and focus synchronously | Component test: type while suggest streaming flips true→false→true; activeElement and the exact value are kept; Enter while busy does not submit. Packaged smoke: type 40 chars during a streaming fixture |
| D2 | HIGH | **Pointer departure collapses an active dock.** The only pins are update-ready, toast and a non-empty draft (overlay-chrome.ts:105-111; App.tsx:680-684). Leaving arms a 500 ms grace timer (overlay-autohide.ts:16, :98-103). Nothing pins a focused empty composer (click to type, then drift), IME start, a pending proposal (`commandState.proposalId`) or an unresolved answer error. Collapse unmounts the drawer (RightEdgeSidecar.tsx:252) without cancelling the unverified proposal; explicit close does cancel it (:218-222). No focus- or composition-based guard exists: `grep` for isFocused, focusin, compositionstart and activeElement over App.tsx, overlay-autohide.ts, cursor-watch.ts and main/index.ts finds none. MASTER §5.2 and §5.11 require the pin | Add `composerFocused`, `composing`, `pendingApproval` and `unresolvedError` inputs to `overlayHoverForced`. Keep the owner rule (overlay-chrome.ts:104) that listening and a standing answer do not pin | Truth-table unit test; reducer test that `set-forced` blocks the grace timer; renderer test: focus → leave → 600 ms → still open; proposal → leave → still open |
| D3 | MED | **The composer cannot hold multiline or long text.** It is a single-line `<input>` (RightEdgeSidecar.tsx:53-69) in a 40 px pill (styles.css:1960-1971). Shift+Enter cannot insert a newline, and long or unbroken text scrolls out of view | Auto-growing textarea (cap about 4 lines, then internal scroll). Enter submits only when not composing; Shift+Enter inserts a newline; keep `no-drag` | Shift+Enter newline; IME Enter; a 500-char unbroken string keeps `drawer-scroll` scrollWidth ≤ clientWidth; composer height ≤ cap at 100/150/200% |
| D4 | MED | **Focus on open is deferred to a frame.** Opening focuses via `requestAnimationFrame` (RightEdgeSidecar.tsx:202-206). rAF is throttled in an unfocused always-on-top window, as the codebase itself notes (window-drag.ts:81-85). §5.2 requires focus "without an animation delay". It also focuses on every open, including hover reveal | Focus synchronously in the user-gesture open paths (click, Enter, hotkey), not on hover. RightEdgeSidecar.test.tsx:325 pins the rAF string and must be updated | Click the tab → `activeElement` is the composer in the same task; hover reveal does not move focus |
| D5 | MED | **Composer and answer surfaces start window drags.** The root `useWindowDrag` covers the whole app (App.tsx:283, :3863) and excludes only `a, .no-drag, .drag, input, textarea, contenteditable` (window-drag.ts:123-127). The chat form (RightEdgeSidecar.tsx:45-52, with 14 px left padding at styles.css:1945-1955) and the answer body are not `no-drag`. Pressing the pill padding starts a drag instead of focusing the input. Selecting answer text moves the window (right-edge `moveBy` is vertical, index.ts:3982-3997) and blurs the composer (App.tsx:279-282) | Mark the chat form and body `no-drag`; a pointerdown on the pill focuses the input; the header stays the drag handle | Playwright: pointerdown + 10 px move on the pill padding → `windowMoveBy` not called and input focused; header drag → `moveBy` called; text selection in the body works |
| D6 | MED (ASSUMED) | **Small heights clip the composer.** `drawer-scroll` is `overflow:hidden` (styles.css:1820-1826), and none of the rows shrink: header min 48 (:1827), meeting 42 (:1909), body min 104 (:1995), actions about 49, pending/notice `flex: 0 0 auto`, composer about 64 (:1941). With meeting, notice, pending action and error all showing, that is about 470 px, more than a small drawer holds (for example about 336 DIP on a 768 px-high panel at 200%). The overflow is arithmetic only; not measured | Put notices and pending inside a scroll region (or cap them); body min-height 0; composer always last and visible | e2e-smoke at drawer heights 336, 408 and 560 with every row present: the composer and "Cancel pending action" rects lie fully inside the drawer |
| D7 | MED | **The action rail clips controls.** `.right-edge-sidecar__action-rail { overflow: hidden }` (styles.css:2062-2069), with fixed 38 px icons, a 70 px History button and no overflow menu. The e2e check covers the default size only. This breaks "do not hide essential controls" | Responsive grouping with a "More" menu (§5.3) | With every handler present (live meeting), at 100/150/200% and a larger text size, every action is reachable by pointer and keyboard |
| D8 | MED | **Geometry is split across three authorities.** (a) The renderer copies the constants (RightEdgeSidecar.tsx:7-8 vs geometry.ts:227-228). (b) The renderer chooses right-edge from settings alone (App.tsx:660-665), while main falls back to top-center below 384 DIP (geometry.ts:241-248). On such a display the renderer would draw the dock inside a top-center window (ASSUMED consequence). (c) Display reanchor (index.ts:4068-4076) and `moveBy` (:3982-3997) use `clampHeight` and the old width, not `rightEdgeSidecarBounds` (which `restoreBarWidth` uses, :3356-3364). After a monitor is removed or scale changes, the authority does not recompute the drawer | One shared module in src/shared for constants and the resolver. Main pushes the effective placement to the renderer. Reanchor and `moveBy` call `rightEdgeSidecarBounds` | Unit tests: negative-origin display, right-side taskbar, work area shrinking after monitor removal, narrow fallback with the renderer agreeing. Contract test: every right-edge `setBounds` path goes through the authority |
| D9 | LOW-MED | **The parked tab blocks input beyond the visible rail.** The parked window is 52×52 (geometry.ts:227-229, :292-295) around a 12 px visible rail (styles.css:1768-1781). Click-through is enabled only for layout `hide` (index.ts:3286-3298), so in Island layout about 40×52 transparent pixels still catch clicks (§5.10, EXP-10). `RIGHT_EDGE_HOVER_TARGET` (geometry.ts:234, 24 px) is unused in production, and the test titled "narrow hover target" asserts 52×52 (island/right-edge-placement.test.ts:56-62) | In 028.A, only shrink the native input region to the rail. The orb itself is TASK-030/028.B (§5.11) | Native click 20 px left of the rail reaches the app underneath (Windows and Mac) |
| D10 | MED | **The top-center Bar submits during IME composition.** Bar.tsx:550-552 handles Enter with no `isComposing` check; the dock has one (RightEdgeSidecar.tsx:61) | Add `!e.nativeEvent.isComposing` | keydown Enter with `isComposing` true → no submit |
| D11 | LOW (latent) | **Dock Escape ignores composition.** RightEdgeSidecar.tsx:258-264 has no `isComposing` check (App.tsx:3174 has one). Mitigated today: `canClose` goes false once the controlled draft is non-empty (App.tsx:683, :3956/:4020) | Add the guard for parity | Escape with `isComposing` → `onClose` not called |

**Risk R1 (not a proven defect):** The dismissal lock leaves `awaiting-leave` only on a renderer pointer-leave (right-edge-dismissal-lock.ts:24-25; App.tsx:854-866). If a shrinking window never delivers `mouseleave`, native hover stays ignored (App.tsx:872) until the user clicks the tab. Needs running-app evidence.

**Checked in source, no defect found (runtime UNKNOWN):**
- Only a non-composing Enter submits (RightEdgeSidecar.tsx:61).
- A drag swallows its trailing click (window-drag.ts:133-139), and submit/stop are `no-drag`, so I found no path where a drag executes a command.
- Long markdown/code: the body is the only scroller, with `overflow-wrap:anywhere`, `pre` overflow-x and fixed table layout (styles.css:1995-2036). e2e-smoke `verifyLongSidecarResponse` (scripts/e2e-smoke.mjs:738-773) checks this at one size only.
- 100/150/200% scaling, monitor removal and reduced motion: no source defect beyond D6-D9; UNKNOWN until measured.

**Packet verify criteria → coverage:**

| Criterion | Covered by |
|---|---|
| Long, multiline, unbroken text | D3, D6 |
| Markdown/code | existing e2e check plus D6 heights |
| Streaming | D1, D2 |
| Pointer departure | D2, R1 |
| Monitor removal | D8 |
| Reduced motion | existing CSS check (RightEdgeSidecar.test.tsx:313) plus runtime capture |
| 100/150/200% | D6, D7, D8 plus captures |
| Typing never disappears | D1, D2, D4 |
| Nothing executes via a drag-region accident | D5 plus the checked-OK path above |

All of these still need before/after running-app evidence on Windows and native Mac (§5.5).

## 5. Source-to-release patch mapping requirement

MASTER lines 99 and 230, §33.10 and TASK-027 "Preserve original-to-release patch mapping" require one mapping record per fix. It must hold even when no cherry-pick exists and SHAs differ. Each record carries:

1. GitHub issue ↔ ledger ID (currently **#196 ↔ MQA-338** and **#197 ↔ MQA-339**; the ledger never cites the issue numbers, and the issues never cite fca1e6b5).
2. The original commit(s): branch, SHA, parent, PR and PR state.
3. The integration commit(s) on the shipping line: SHA, parent, PR, merge SHA and merge time.
4. The equivalence method: normalized hunk diff, `git patch-id`, or a behavioral test when the patches differ. Record what differs (here: comments; C2 exists only on main).
5. The candidate: version, build SHA, CI run, artifact name and SHA-256, signer and timestamp.
6. The feed: repo, tag, draft/pre-release/latest state and published asset hash, read back after publishing.
7. The verification receipts (T196-*, T197-*) bound to that artifact hash.

| Fix | Original | Shipping-line integration | Equivalence | Candidate / feed |
|---|---|---|---|---|
| #197 | 7d684b24 on claude/dock-three-fixes, parent ac1a62d8, PR #194 OPEN | fca1e6b5 via PR #199 → merge bf2358e1 → main 2bf21f1c | IDENTICAL non-comment hunks (VERIFIED) | Dock lane: v1.9.8 draft (a105a258, bundle contains the fix, VERIFIED). Main: v1.9.6-unsigned draft (2bf21f1c, fix ASSUMED from source SHA). **Customer Latest v1.6.6 lacks the fix and has the raw reads.** Hashes not yet recorded |
| #196 | a4fa77eb (C1), parent 7d684b24; plus 12f44e46 (eager demo) | fca1e6b5 (C1 + C2 + reveal restored + eager demo) | Functional superset on main. The dock lane lacks C2 | As for #197; bundle not scanned for C2 |

Rules for 027.A:
- Do not merge PR #194 to obtain these fixes: main already has them.
- Do not assume cherry-picked ancestry.
- Update both issues and both ledger rows with the mapping.
- Close MQA-338/339 and the issues only after T196-D and T197-A/B/C pass on the exact candidate artifacts.

## 6. Blockers and decisions

| # | Item | Owner | Smallest unblock |
|---|---|---|---|
| B1 | No Mac package of main 2bf21f1c located; needed for T196-D and T197-A/B/C on Mac | Tony / release lane | Build an unsigned universal Mac package from 2bf21f1c in an isolated worktree (not the in-flight source worktree), or point to an existing one |
| B2 | Windows packaged proof needs a Windows host. The v1.9.6-unsigned draft installers exist (built from 2bf21f1c per the release body); no Windows runner is available to this lane | Tony | Name a Windows machine or runner and record the installer SHA-256 from the draft's SHA256SUMS.txt before testing |
| B3 | Shipping line and version are undecided: dock lane 1.9.8 (PR #194 OPEN, feed draft) vs main 1.9.6 (feed draft). This affects feed continuity and whether C2 must be ported | Tony | A one-line decision: which line ships 027.A and its version number |
| B4 | Original reproduction inputs NOT_AVAILABLE (evidence folder and ac1a62d8 pack, errors quoted in §3) | Tony / QA | Rebuild a bundle from ac1a62d8 (C1) and from 55f8b06b (demo skip) for T196-C |
| B5 | "Approved dock mode" lineage (RightEdgeSidecar on main vs DockPanel on PR #194) is unresolved (§5.3); it decides which component 028.A repairs | Tony | Confirm that 028.A targets main's RightEdgeSidecar (this plan assumes so) |
| B6 | Running-app evidence for 028.A (100/150/200%, monitor removal, IME, native hit-testing) needs real displays, Windows and a native Mac session; not possible in this sandboxed lane | Implementation lane | Run e2e-smoke/packaged captures on the B1/B2 hosts |

## 7. Adjacent observation (not 027.A/028.A scope)

`src/main/index.ts:2712` reads `process.env.ASKTOTO_DEBUG_RENDERER` raw, so it is honored in packaged builds. It mirrors renderer console warnings and errors into the main log. This is the same class of risk as #197 under the dev-env.ts header policy. Route it to the owning security/diagnostics task; do not widen 027.A. `ASKTOTO_MAC_LAUNCH_GATE` (:2792, :2798) is an intentional opt-in release diagnostic (MQA-318).
