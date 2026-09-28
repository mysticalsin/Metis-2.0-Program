# P3 — GitHub correlation: github.com/mysticalsin/AskToto-Mantu

Method: `gh` (network re-enabled per task instruction after the sandboxed `gh auth status` failed on
keyring access — see Appendix A) against the live repo, cross-checked line-by-line against the
read-only local checkout at `/Users/<redacted-user>/AI-Brain-build/metis-2.0` (origin/main **2bf21f1c**, v1.9.6,
2026-09-23). No tests were run, no code was executed, nothing was commented/labeled/closed/merged.
Raw `gh` output is cached under `/private/tmp/claude-501/.../scratchpad/{issues,prs,diffs}/*` for
this session. All 18 open issues and all 20 open PRs in #156-#200 were read; diffs for #186-#194 were
read in full (or, for #193, via the GitHub Files API — its unified diff exceeds GitHub's 20,000-line
cap).

**Headline correction to the prior review pass (`plan-inputs/GIT-STATE.json`):** its per-PR
`recommendation` for #189 ("PRIORITIZE... rebase and fast-track") is now stale. Git ancestry proof
(below) shows the fix #189 proposes **already shipped to `main` independently**, via PR #195
(merged 2026-09-23T00:57Z), three days after #189 was opened and unrelated to it. This report's
dispositions are based on what is actually on `main` today, checked with `git merge-base
--is-ancestor`, not on PR titles or prior-lane assumptions.

---

## A. The dock-lane PRs are a separate, abandoned lineage — not integrated into `main`

This is the single biggest fact shaping every disposition below, so it goes first.

`main` at 2bf21f1c reached its current state through **PR #195 "Métis 1.9.6 release candidate"**
(`codex/metis-v2-command-sidecar` → main, merged 2026-09-23T00:57:08Z) plus #198/#199 on top. That
lineage independently built its own command/wake/Cap2 feature set and, along the way, already:

- Landed the exact force-quit/sidecar-teardown fix that PR **#189** proposes (see §C.3).
- Added `metis-command-*` / wake-session files, then **removed** `CommandListeningPill` from `App.tsx`
  ("isolate transcription from desktop actions", commit `4e2bfaa1`) — leaving the component file
  itself as dead code (also independently flagged as `CODE-FINDINGS.json` → `L12-arch-graph` →
  `F4-unwired-command-mic-feature`, verified: `grep -c CommandListeningPill src/renderer/src/App.tsx` = 0).
- Kept the existing **`RightEdgeSidecar.tsx`** as the shipping right-edge surface.

The **dock-lane** PRs (#187, #188, #189, #190, #191, #192, #193, #194) all descend from a *different*
branch, `codex/review-release-1.9.1` (or `release/1.9.1`), which introduces a competing
**`DockPanel.tsx`** surface. I confirmed directly that it never reached `main`: `src/renderer/src/
components/DockPanel.tsx` **does not exist** in the checkout at all. A naive `git log --all --grep
dock` is misleading here because *both* lineages use "right-edge dock" language in commit messages —
e.g. `e800ac85 "feat: finish right-edge Metis dock"` **is** an ancestor of HEAD, but `git show --stat`
on it shows the file it actually touches is `RightEdgeSidecar.tsx`, not `DockPanel.tsx`: it's `main`'s
own, separate "finish the dock" work on the shipping surface, not the dock-lane branch. The
dock-panel-introducing commits proper (`12c61de2 "Merge origin/main into the dock lane"`, `e6d4819d
"Recover the force-quit test file the lineage dropped"`, and everything unique to
`claude/dock-three-fixes`) fail `git merge-base --is-ancestor <sha> HEAD` — they are not on `main`.

This is not a new discovery on my part — the kit's own planning docs already flagged it as an open,
undecided fork:

- `KIT-REQUIREMENTS.json` → `K09-prior-execution` → **K09-R10**: *"Decide shipping line/version: main
  1.9.6 RightEdgeSidecar vs. PR #194 1.9.8 DockPanel"* (priority MUST, status NOT_STARTED, external
  dependency: **Tony's decision**).
- `K09-R27` (the next scheduled right-edge work, TASK-028.A) is scoped **against `RightEdgeSidecar.tsx`**
  and depends on K09-R10 — i.e. the plan already leans toward keeping the shipping line, not merging
  the dock lane.
- `PRIOR-EXECUTION.json` blockers: *"Shipping line undecided: main carries 1.9.6 RightEdgeSidecar while
  the customer feed also has a v1.9.8 DockPanel draft from PR #194 — blocks TASK-027.A/028.A scope."*

**Current CI, checked live just now, agrees with treating the dock lane as abandoned, independent of
the product question:** `Quality checks (ubuntu-latest)` and `Quality checks (windows-latest)` are
**FAILING right now** on #187, #188, #189, #190, #191, #192, #193 (run
`35540544117`, e.g. https://github.com/mysticalsin/AskToto-Mantu/actions/runs/35540544117). #194 is
the one exception — full green — but is `mergeStateStatus: DIRTY` / `CONFLICTING` against current
`main` (opened 2026-09-21, main has moved since) and its own body admits it cannot publish a
`v2.0.0` tag because Apple signing secrets (`APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, etc.) are not
configured — consistent with this program's "Apple public signing is out of scope" constraint. None
of the 20 open PRs have a single human/bot code review recorded (`reviewDecision` is null and
`reviews` is `[]` on every one).

**Recommendation:** don't merge any of #187/188/190/191/192/193/194 as-is. Get Tony's K09-R10 decision
first. If RightEdgeSidecar stays the line (what the plan already assumes), close #187/188/191/193/194
as **superseded-by-ticket** and hand their *specific, verified-good* fixes to new tickets against
`RightEdgeSidecar`/`GraphView`/`intelligence.ts` (listed per-PR below) rather than resurrecting a
five-months-stale, currently-CI-red branch stack.

---

## B. Issues — all 18 open, read in full

| # | Title (short) | Filed | Area | Disposition | Why |
|---|---|---|---|---|---|
| 104 | Operator router regex unterminated | 09-02 | Operator SPA | **fixed-close** | `operator/src/spa/client.ts:4` now `PATHNAME_STRIP_JS = 'location.pathname.replace(/^\\//, "")'` — correctly escaped. Verified in current source, not the generated bundle. |
| 105 | Operator nav shows 8 extra items, not the 7-item lock | 09-02 | Operator SPA | **fixed-close** (design evolved) | `operator/src/nav.ts` is now a 3-section, 11-item structured nav (Analytics/Fleet/Ops) with an explicit `FORBIDDEN_NAV = ['scale','change','console','dashboards','seo']` guard. The complained-about items (SEO/Pages/Insights/Profiles/Cohorts/Dashboards/References) are gone; the *shape* changed from the literal "7 items" Tony locked, so flag for a quick nav-count eyeball, not a re-open. |
| 106 | Operator Overview not the 10 Bklit KPI cards | 09-02 | Operator SPA | **needs-repro** | `overview-cards.ts` exists and is actively maintained (see #117 below), but I can't confirm the exact "10 Bklit mini card" layout without rendering it — Operator's entire file structure was rewritten (single `ui.ts`/`dashboard.ts` → `routes/`, `render/`, `connectors/`, `world/`, split `spa/css-*.ts`) since this issue was filed, so a visual QA pass against the live Worker is the only reliable check. |
| 107 | Operator pages not pixel-perfect vs OpenPanel demo; map was unreachable | 09-02 | Operator SPA | **needs-repro** | Root blocker (the #104 router) is fixed, so the pages are reachable now; pixel-perfect-vs-reference is a visual QA question, not a code-read one. |
| 108 | Operator Keys: no rotate/revoke; CF is paste not login-redirect | 09-02 | Operator SPA | **map-to-ticket** | `operator/src/keys.ts` exists and Cloudflare has its own `cloudflare-connect.ts` / `connectors/oauth.ts` modules now — real OAuth plumbing exists that didn't in the Sep-2 build, but rotate/revoke UI rows need a live walk to confirm. Map to a TASK/UC covering Operator Keys UX rather than closing blind. |
| 110 | Operator light-theme GEO/REFERRALS/PATHS pills solid-black | 09-02 | Operator SPA | **needs-repro** | CSS was split into per-page files (`spa/css-realtime.ts` etc.) since filing; the specific `.tab.on` / `#0a0a0b` on `#18181b` hardcode cited no longer exists as a single file to grep confidently — needs a live light-theme screenshot. |
| 111 | Operator dark-mode KPI cards invisible (white-on-white) | 09-02 | Operator SPA | **needs-repro** | Same rewrite caveat as #110; `css-overview.ts` now owns this surface. |
| 113 | Operator THEME toggle 3-state no-op middle state | 09-02 | Operator SPA | **likely-fixed, needs-repro** | Theme model was redesigned: `operator/src/theme-preference.ts` now types `ThemePreference = 'light'\|'dark'\|'system'` with a real cookie-backed resolver (`readThemeCookie`, `resolveMapTheme`) — the old client-side `cur === 'dark' ? 'light' : cur === 'light' ? '' : 'dark'` (whose `''` state silently repainted default-light CSS) is very unlikely to survive this redesign, but I did not find the client-side click-handler equivalent in the non-generated source to confirm byte-for-byte, so calling it "needs-repro" rather than fixed-close. |
| 115 | Operator Notifications status filters inert | 09-02 | Operator SPA | **needs-repro** | The exact `#crm-table`/`#nt-table` mismatch cited lives in the pre-rewrite `ui.ts`/`spa/client.ts`; current code has dedicated `routes/` per page. Needs a live filter click-test. |
| 117 | Operator Live-now shows +47900% on 0 seats | 09-02 | Operator SPA | **fixed-close** | `overview-cards.ts:36` `trend()` now explicitly guards `if (current === 0) return null`, `if (a < 1) return null` (tiny-prior blowup), and caps `Math.abs(pct) > 400 → null`. This is a direct, verified fix of the exact reported defect plus the general problem class. |
| 118 | Operator Unique-seats (0) vs map marker (2 Canada) mismatch | 09-02 | Operator SPA | **map-to-ticket** | Root cause named in the issue (`live30` seat-window filter vs. `map.countries` all-time aggregation — two different windows, two different numbers) is a real data-model gap, not a rendering bug; `dashboard.ts`/`overview-cards.ts` still compute `liveNow`/`live30` as time-windowed and map data separately in current source. Worth a dedicated ticket to unify the two aggregations rather than a quick patch. |
| 119 | Operator sparkline is dashed placeholder, not solid Shoey bars | 09-02 | Operator SPA | **needs-repro** | Depends on #118's series-source bug (`live30Series` vs `liveSeries`) being fixed first; `charts.ts`/`render/` were restructured, needs a live check. |
| 124 | 1.8.3: first-run leftover slab at Y=39 instead of Hide 8×2 @ Y=0 | 09-02 | Main app / island geometry | **map-to-ticket** (not fixed-close) | This exact 1.8.3 repro can't be confirmed fixed without running the packaged app (forbidden here), but the underlying bug *class* — leftover Y=39 slabs after a chrome/state transition — recurs repeatedly in `src/main/island/geometry.ts` and `src/main/index.ts` comment trail (I count 7+ distinct "Tony live: N×M at Y=39" citations across different transitions, each patched individually: 560×103, 880×816, 8×44, ...). That pattern — targeted patches per-repro instead of one invariant — is itself worth a ticket ("no single test asserts *all* park transitions land at `y=0`"), separate from confirming this specific 1.8.3 instance. |
| 183 | P0 Nova-3 WS omits `language` (defaults EN); CLOUD_ONLY blocks local FR fallback | 09-14 | Main app / speech | **fixed-close** | `src/shared/cloud-stt-language.ts` is new, dedicated code: its own docstring states the exact bug ("Deepgram defaults `language=en` when omitted... under CLOUD_ONLY there is no Whisper/Parakeet adaptive follow to recover") and implements auto/multi (`language=multi`+`detect_language=true`), explicit-language mapping (French → `fr-CA`), and a mid-meeting sticky-pin. This is a direct, verified fix of the named root cause. |
| 184 | P0 QA-tip boot-hang (V8 CompileModule) + AX -25204, tips 589a5ab/613ba4c | 09-14 | Main app / boot | **fixed-close, exact duplicate of #185** | Same title, same body, filed 12 seconds apart by the same author — an accidental double-file. The FITO-185 series (`/Users/<redacted-user>/AI-Brain-build/metis-2.0/runs/FITO-185-{X,Y,Z,AA,AB}-*.md`, all dated the next day, 2026-09-15, on the same `release/1.9.1` branch) is the direct engineering response: FITO-185-Z/AA/AB measure Act1 first-paint down from a broken/hung boot to 0.525-0.579s with 3436/3464 tests passing, and AB explicitly fixes a `createTray`/`registerIpc` double-fire crash class latent since the hoist landed. Close both as one, cross-ref the FITO-185 series as the fix evidence. |
| 185 | (duplicate of #184) | 09-14 | Main app / boot | **fixed-close, duplicate** | See #184. |
| 196 | P1 Dig 1.9.8: onboard-cta Next does not advance Act2 demo | 09-21 | Main app / onboarding | **needs-repro, has a ticket** | Directly named in `KIT-REQUIREMENTS.json` → `K05-master-s22-31` → **F-14**: *"Onboarding/right-edge failures (#196/#197) must reproduce-then-close"*, and `K07-kit-other` → **K07-SEQ-01**: *"P1 fixes (TASK-027.A right-edge/#196#197, TASK-028.A right-edge geometry) must ship independent of and before Hindsight/agent-expansion provisioning."* Already tracked; don't duplicate the ticket, just keep it moving. |
| 197 | P1 Dig packaged app honors stale `ELECTRON_RENDERER_URL` → black screen | 09-21 | Main app / onboarding | **needs-repro, has a ticket** | Same F-14/K07-SEQ-01 tracking as #196. The concrete ask ("packaged builds should ignore `ELECTRON_RENDERER_URL` unless an explicit dig/dev flag is set") is a small, well-scoped fix — good candidate to knock out inside TASK-027.A rather than leaving it as a standalone repro task. |

**Operator cluster note (#104-#119):** all ten were filed against a Sep-2 build where Operator was a
handful of monolithic files (`ui.ts`, `charts.ts`, `dashboard.ts`, one `css.ts`). At HEAD, Operator has
been rewritten into `routes/*`, `render/*`, `connectors/*`, `world/*`, and per-page `spa/css-*.ts`
files — a real architectural change, not a coincidence of file moves. I directly verified 3 of the 10
cited defects are fixed at the named mechanism (#104, #105, #117); the rest most plausibly are too,
but pixel/behavior parity needs a live walk against the deployed Worker, which is outside a read-only
code review. Recommend one QA pass against the current deploy covering all of #106-#111/#115/#118/#119
in one session rather than issue-by-issue.

---

## C. Pull requests — all 20 open in #156-#200

### C.1 Quick merges (clean, small, green, no product ambiguity)

| PR | Title | Base | Files | CI | Disposition |
|---|---|---|---|---|---|
| **#167** | test: ignore Windows EBUSY cleaning cli-setup temp dir | main | 1 | green (8 success) | **merge** — trivial, test-only, `MERGEABLE`/`CLEAN` isn't quite true (`mergeStateStatus: CLEAN`... actually listed `MERGEABLE`/`CLEAN`), fixes a real CI flake (Windows Defender holding a just-written `.cmd`), zero risk. |
| **#186** | fix(test): CRLF-safe right-edge placement contract | main | 1 | green (10 success) | **merge** — read the whole 13-line diff: normalizes `\r\n`→`\n` before `indexOf` in a test helper only. No product code touched. Exactly what it says. |
| **#200** | Fix Windows Bash advice tests + packaged UI smoke timing | main | 3 | green (10 success) | **merge** — test/smoke-harness hardening only (stdin-feeds Bash instead of building an escaped command line; waits for onboarding-appearance selection to settle in packaged smoke). Author's own verification table cites a real Windows NSIS install/launch/hash-match run. |

### C.2 Rebase-then-merge (real fix, stale/conflicting base only)

| PR | Title | Base (age vs main) | Disposition |
|---|---|---|---|
| **#168** | fix(operator): deploy/smoke scripts break on paths with spaces | `feat/operator-wow` (272 commits behind) | **rebase-then-merge**. Root cause is real and still present: `import.meta.url` is percent-encoded, so comparing it to a raw `process.argv[1]` breaks on any path containing a space — a plausible real-world hit given this program's own working paths (`Chief of Staff/...`). Fix (`fileURLToPath` decode, matching `migrate.mjs`'s existing pattern) is a one-line correctness fix with contract tests. Retarget to `main`. |
| **#176** | fix(win): afterPack `--post-sign` when Authenticode already signed extras | main (CONFLICTING) | **rebase-then-merge**. Explains a real Windows release failure (`llama-server.exe: expected 9216 bytes, got 25360` — electron-builder 26 now signs PE extras during pack, so the old pre-sign byte/hash gate false-positives). Small, test-pinned. Coordinate with the in-flight Windows-signing worktree before rebasing (per `GIT-STATE.json`) since both touch `after-pack.mjs`. |
| **#179** | Métis 1.9.0 — transcript quality, multi-speaker naming, 8GB RAM safety | main (CONFLICTING) | **rebase-then-merge, re-validate**. Substantive, not obviously duplicated by later work (main is at 1.9.6 with different transcript/ASR code than this branch's baseline); CI currently shows 6 failing checks against its stale base, so it needs a real rebase and re-run, not a blind merge — the 6 failures could be genuine regressions or pure staleness and I can't tell which without running it. |

### C.3 Supersede-by-ticket (real content already landed elsewhere, or route abandoned)

| PR | Title | Verdict | Evidence |
|---|---|---|---|
| **#189** | Make the force-quit contract match the force-quit code | **supersede-by-ticket — already on `main`, independently** | I read the full diff: it adds `EMERGENCY_FORCE_QUIT_GRACE_MS = 4000`, a `stopSidecarsForHardExit()` teardown, and the same bounded-grace `forceQuitMétis()` shape to `src/main/index.ts`, plus a behavioral `emergency-force-quit.test.ts` (125 lines) that runs the real function against a fake clock. **All three already exist at HEAD 2bf21f1c**, byte-identical in mechanism (`EMERGENCY_FORCE_QUIT_GRACE_MS = 4000` at `index.ts:4160`, `stopSidecarsForHardExit()` at `:4169`, `forceQuitMétis()` at `:4195`) — landed via PR #195 (`codex/metis-v2-command-sidecar`, merged 2026-09-23T00:57Z), independent of and 3 days later than this PR. HEAD's own `emergency-force-quit.test.ts` is 131 lines (PR #194's body independently confirms this: "superseding the 125-line copy recovered from #189"). Close #189; no code to bring over. **What #189 does *not* fix, and remains a real open gap at HEAD**: the `onFatal()` "Relaunch Métis" path (`index.ts:3559-3579`) still does `app.relaunch(); app.exit(0)` with **no** call to `stopSidecarsForHardExit()` — I verified this directly at HEAD. That's a live, unaddressed orphan-sidecar path (matches `BUG-ROOT-CAUSES.json` B2/F1 verifier's "ADDITIONAL PATH THE HYPOTHESIS MISSED"). Also unaddressed by anything on `main` or any open PR: `CODE-FINDINGS.json` L02-F2 — teardown only stops `screenPreprocess`/`localRuntime`/`fmRuntime`, never Parakeet/Whisper-import/speaker-embedding utilityProcess children — and there is still no boot-time reaper for a *externally* SIGKILLed (Force Quit / Activity Monitor) session, which per `BUG-ROOT-CAUSES.json` B3-RC5 verification is the actual, uncatchable mechanism behind the live orphaned-llama-server evidence (two orphans at ~3.1GB phys_footprint each, 2026-09-25). **Recommend a new ticket**: "boot-time sidecar reaper + close the onFatal-relaunch gap" — this is `KIT-REQUIREMENTS.json` **K09-R30**, already written and marked `NOT_STARTED`, `new_vs_r11: true`. |
| **#187** | Intelligence: notes are nodes in Relationships | **supersede-by-ticket — real, unmerged, still-live bug fix; extract it** | Verified at HEAD: `intelligence/src/lib/brainAdapter.ts:485` still literally comments *"Meetings are dropped from the DISPLAY graph (61 meeting nodes would drown the entity structure)"* — Tony's exact complaint ("I don't see the nodes or note in relationships") is **still live at 2bf21f1c**. This PR's fix (notes-as-square-nodes, default-on toggle, account/sector-filter-aware, three-way empty-state message) is real and targeted, but it's built against `codex/review-release-1.9.1` / the abandoned dock lane and carries 53 files of unrelated dock/Cap4 diff riding along, and CI is currently red. **Don't merge the branch; re-implement the `brainAdapter.ts`/`GraphView.tsx` piece alone against current `main`** as a scoped ticket — the diff is small and self-contained enough (`intelligence/src/lib/brainAdapter.ts`, `intelligence/src/views/GraphView.tsx`, plus the `EmptyState` three-cause copy) to lift cleanly. |
| **#188** | Right-edge dock: its own DockPanel | **supersede-by-ticket — blocked on K09-R10** | Real, well-argued UI work, but it's the dock-lane's `DockPanel.tsx`, which per §A is not the shipping line pending Tony's decision. Also fixes a real `tsc` break (`OVERLAY_BAR_REST` `as const` narrowing `revealedWidth` to literal `880`) — but that break only exists *inside* the dock-lane's own geometry changes, not on `main` (`main`'s `geometry.ts` has no `DockPanel`/380-width caller, so the type error doesn't reproduce there). No action until K09-R10 resolves; if RightEdgeSidecar is kept, close as superseded and salvage only the composer/tool-row UX ideas into a RightEdgeSidecar ticket. |
| **#190** | Unblind the content-protection audit (6 red tests) | **supersede-by-ticket, self-superseded by #192** | Verified by diff comparison: #190's own body says it deliberately leaves the `QA_TIP.txt` packaged-build gate unfixed ("flagged rather than edited... the owning agent's decision to make"). #192, built on the exact same base, contains **every line of #190's fix plus** the missing `isPackagedBuild()` gate #190 flagged. Confirmed at HEAD: the whole Cap3 `QA_TIP` force-paint feature (`intelligence.ts` `cap3QaForcePaint`) **does not exist on `main` at all** — `grep -c QA_TIP src/main/intelligence.ts src/main/content-protection.contract.test.ts` = 0 both files. So this isn't "fixed at HEAD," it's "the buggy feature was never merged" — different disposition than #189. Close #190 in favor of #192; if/when Cap3's dashboard QA force-paint ships for real, #192's diff is the one to bring, not #190's. |
| **#192** | fix(metis): Cap3 QA_TIP force-paint gated to unpackaged builds | **supersede-by-ticket — good fix, wrong branch** | Confirmed superset of #190 (see above): adds `isPackagedBuild()` gate matching the existing `devEnv()`/`ASKTOTO_DISABLE_CP` fail-closed pattern, plus tests asserting a packaged build with a smuggled `QA_TIP.txt` keeps content-protection on. Same base-staleness/CI-red problem as the rest of the cluster. Keep this diff on file: **the day Cap3's Intelligence dashboard QA force-paint code actually merges to `main`, this exact gate must land with it** — don't let a future merge of the dock lane reintroduce #190's un-gated version instead. |
| **#191** | Cap4: Bar-DNA glass DockPanel (design iteration) | **supersede** | PR #194's own body names this as an earlier design iteration "carried forward more completely" into the dock-lane's later state; `CONFLICTING` against `main`; blocked on the same K09-R10 decision as #188. Close, no salvage needed beyond what #188/#194 already carry. |
| **#193** | Cap4: Apple-smooth dock motion | **supersede, needs its own re-review if K09-R10 ever picks DockPanel** | Largest open diff (100 files per `gh pr view`, 220 per the paginated Files API — `gh pr diff` itself refuses it at >20,000 lines). Based on `release/1.9.1`, 86 commits behind main. Motion/spring-timing polish only matters if DockPanel ships; until K09-R10 resolves, don't sink re-review time into it. |
| **#194** | Métis 2.0 — the right-edge dock lane, merged onto main | **supersede-by-ticket for now; the reconciliation point *if* DockPanel is chosen** | This is the best-documented candidate (own handoff doc, evidence files, an honest PR-consolidation table naming #187/#188/#190/#192 as contained and #189 as "one real gap, already superseded on main"). All release gates the author could run locally are reported green (`typecheck` 0, `npm test` 6417/6417, `build` 0, `audit --audit-level=critical` 0 vuln, version-parity OK) and CI confirms it independently (`Quality checks` ubuntu+windows, `Operator Worker`, `Security & supply chain` all SUCCESS on the live PR right now). But: (a) `mergeStateStatus: DIRTY`/`CONFLICTING` — `main` has moved since 2026-09-21 and it needs a fresh rebase regardless; (b) it cannot publish a release tag without Apple signing secrets configured (explicitly out of scope per this program's ground rules — not a defect in the PR); (c) most importantly, **it still needs the K09-R10 product decision**, because merging it replaces `RightEdgeSidecar` with `DockPanel` app-wide. Don't merge blind. If Tony picks DockPanel, this is the branch to rebase and land; if he keeps RightEdgeSidecar, close it and salvage only specific fixes (the force-quit test recovery — moot, already superseded elsewhere — and the QA-tip content-protection gate, per #192 above). |

### C.4 Other open PRs (156-161, not in the closely-read 186-194 set, disposition from metadata + spot code checks)

| PR | Title | Base (staleness) | Disposition | Rationale |
|---|---|---|---|---|
| **#156** | Nightly cleanup: dead overlay leftovers + smaller boot chunk | main, CONFLICTING | **close-stale** | Deletes `ControlBar`/`RecordingIndicator`/`Logo`/`whisper-worklet.ts` as dead code — but the overlay was rewritten substantially since (the Jarvis-orb / Kinetic-grid work referenced by #160, plus the dock lane), so this predates a large rewrite of the exact files it touches. Worth re-running the same dead-code sweep fresh against current `main` rather than rebasing a 20-day-old diff. |
| **#157** | G Mantu Intelligence: OneDrive scan+connect and Connections | `fix/settings-orb-stability-20260905` (337 behind), Draft | **rebase, re-validate** | Real, substantial feature (OneDrive folder auto-detect + Connections graph edges), author's own body says "READY TO MERGE no." CI already shows failures against its stale base. Worth retargeting to main and re-checking scope against whatever the current Intelligence/Connections surface already covers (it may now overlap with #187's brainAdapter notes-as-nodes work — check both before landing either). |
| **#159** | fix(settings): no sideways scroll on Audio/AI (Win) | `fix/settings-orb-stability-20260905` (337 behind), Draft | **supersede — likely stale** | `Settings.tsx` has been rewritten repeatedly since (per `GIT-STATE.json`, via #160/#164/#179); the specific `overflow-y-auto`/flex-shrink condition this targets very likely doesn't reproduce identically anymore. Re-file if a live check on current Settings still shows sideways scroll. |
| **#160** | Tony locks: Jarvis orb fill, Bar-only rest cards, minimize on Done | same base, Draft, 75 files | **close** | GIT-STATE.json's own audit found this head branch already merged to main via #164 (2026-09-06); this PR is a stale duplicate of already-shipped work. I did not re-verify #164's merge independently (out of scope for this pass) but the finding is specific and checkable (`git log --all --grep`), so flagging as close pending a 30-second confirm rather than re-deriving it. |
| **#161** | fix(operator): heartbeat ships default Operator URL for seat/license reporting | branched off #160 tip, CONFLICTING | **rebase onto main directly** | Small, focused (`DEFAULT_OPERATOR_URL` fallback when Settings/env URL is empty, ingest secret still required — no secret baked in). Its base branch's content already landed via #164, so retarget straight to main rather than resolving through the stale intermediate branch. |
| **#178** | fix: Windows cross-pack DOA + 1.8.9 unsigned pack | main, CONFLICTING, Draft | **supersede** | Windows packaging has moved on substantially since (electron-builder version bump implied by #176's Authenticode-timing fix, plus whatever the in-flight Windows-signing worktree is doing); re-derive current Windows-pack state before trusting a 3-week-old packaging diff. |

---

## D. Cross-cutting corrections worth flagging to the plan owner directly

1. **`GIT-STATE.json`'s #189 recommendation is stale as of today** (see §C.3) — its "prioritize and
   fast-track" advice would have the team re-implement a fix that already shipped, while missing the
   two gaps (`onFatal` relaunch path; non-llama sidecar families) that are *actually* still open. This
   report's disposition table should replace it in any downstream plan.
2. **Real, still-open orphan-sidecar surface, precisely scoped**: `onFatal()`'s "Relaunch Métis" button
   (`src/main/index.ts:3559-3579`) and any *external* SIGKILL/Force-Quit (uncatchable by definition,
   per `BUG-ROOT-CAUSES.json` B3-RC5's own experiment) are the two paths no code on `main` or in any
   open PR addresses. This is `KIT-REQUIREMENTS.json` **K09-R30** verbatim — a real, already-written,
   `NOT_STARTED` requirement, not something this pass is inventing.
3. **K09-R10 (RightEdgeSidecar vs. DockPanel) blocks real, already-good work from landing.** PR #187's
   Relationships-graph fix addresses a bug Tony named directly and is still live at HEAD; it's stuck
   behind an unrelated architecture decision purely because of which branch it was built on. Recommend
   decoupling: get the K09-R10 decision, then have someone re-port #187's `brainAdapter.ts`/
   `GraphView.tsx` diff onto whichever line wins, rather than waiting on the whole dock-lane question.
4. **`CommandListeningPill.tsx` is confirmed dead code at HEAD** (0 importers in `App.tsx`), matching
   `CODE-FINDINGS.json`'s `L12-arch-graph` → `F4-unwired-command-mic-feature` exactly — independent
   confirmation, no new finding, but worth citing as corroboration that lane's dead-code sweep is
   accurate.
5. **Operator (#104-#119) needs one fresh QA pass, not ten issue-by-issue re-checks.** The sub-app was
   rewritten wholesale between filing and HEAD; I verified 3 of 10 cited defects are concretely fixed
   by the exact named mechanism, and the file layout no longer matches any of the other seven issues'
   "suspected files" lists closely enough to grep with confidence either way.

---

## Appendix A — access note

`gh auth status` failed inside the Bash sandbox with `Failed to log in to github.com account
mysticalsin (keyring): The token in keyring is invalid` — this is the sandbox blocking macOS Keychain
access, not an actual auth problem (confirmed: the same command succeeds immediately with
`dangerouslyDisableSandbox: true`, showing a valid `repo`-scoped token). All `gh` calls in this task
ran with the sandbox disabled for that reason only, per the task's own instruction to do so on a
network/credential failure; every call was read-only (`issue view`, `pr view`, `pr diff`, `pr list`,
`issue list`, `api .../pulls/193/files`).

## Appendix B — what this report is not

No repo tests were run, no `node`/`electron`/`npm test`/`vitest` was executed on this Mac, per the
program's hard rule (test processes have twice quarantined Tony's real OneDrive brain index today).
Every "fixed at HEAD" claim above is a direct source-code read (file/line cited), not a test run or a
live app walk. Every "needs-repro" claim is exactly that — I found no code-level evidence either way
and a live walk against the current build is the only way to close it.
