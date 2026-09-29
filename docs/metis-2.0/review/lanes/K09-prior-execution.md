# K09 — Prior Execution Review (Métis 2.0)

**Lane:** K09-prior-execution
**Scope:** audit the previous 2.0 execution attempt — what was actually done vs. designed vs. not started, which artifacts are reusable, and how the 29 recorded blockers should be routed (owner decision / external account / engineering-solvable-now). Feeds the Opus planner; does not itself re-plan.
**Read-only.** No file was created, edited or deleted inside `/Users/<redacted-user>/AI-Brain-build/metis-2.0` or any kit directory. No state-changing git command was run anywhere (only `git status`, `rev-parse`, `log`, `diff`, `show`, `merge-base`, `ls-tree` — all read-only). No `npm install`. This file is the only file written by this lane.

Evidence labels (SAE method, `02-requirements-and-quality.md`): **OBSERVED** = seen directly in this session (code, logs, `git` output); **DERIVED** = reasoned from OBSERVED facts; **ASSUMED** = plausible but unverified; **UNKNOWN** = genuinely unresolved. Where a claim originates from the prior lanes' own files, I mark it **OBSERVED (repo/logs, re-verified by this lane)** when I re-ran the check myself and **REPORTED (prior lane)** when I did not re-run it but the citation is concrete (file:line).

---

## 0. What "prior execution" actually consists of

Three separate, only-partially-reconciled bodies of prior work exist for Métis 2.0:

1. **`/Users/<redacted-user>/AI-Brain-build/metis-2.0-exec`** — the tracked, documented Phase-1 execution: `CURRENT.md`, `BLOCKERS.md` (29 rows), `OWNER-DECISIONS.md`, `tasks/TASK-001..005`, `tasks/TASK-027/reconcile.md`, `tasks/WINDOWS-SIGNING/*`, `receipts/*`. This is what `CURRENT.md:6` calls "Phase 1 closing".
2. **`/Users/<redacted-user>/metis-r11-work`** — an **undocumented, uncommitted** worktree (`session.json:1-5`: branch `work/metis-r11-20260924-083623`, base `2bf21f1c`, `remote_pushed: false`) containing real, tested code fixes that are **not referenced anywhere in `metis-2.0-exec`** — no TASK file, no blocker row, no `CURRENT.md` link points at it. This is a gap in the exec-dir's own bookkeeping (see §4).
3. **`origin/main` itself** (2bf21f1c) — already contains fixes for GitHub issues #196/#197 (via PR #199 / commit `fca1e6b5`) that predate and are independent of the kit-r11 process; `reconcile.md` (TASK-027) discovered this by lineage analysis rather than by the kit tracking it.

The Opus planner needs all three, because #2 contains a real, verified, already-fixed defect (MQA-348, **critical** severity — see §4.3) that none of the 29 tracked blockers or five TASK registers mention.

---

## 1. Task-by-task status

### 1.1 TASK-001 "Pin the actual system" — **PARTIAL**

Verdict is the Phase-1 critic lane's own (`tasks/PHASE1-STATUS.md:21`), and I independently re-verified the still-open parts against current source (below) rather than just relaying it.

Evidence base: `tasks/TASK-001/source-register.md` (63.6K), `source-register.json` (205.4K), `service-register.md` (28.3K).

What is genuinely done (MET, `PHASE1-STATUS.md:35-46`): repository-instruction read, 13-workspace shipping map, full source/PR SHAs, exact installed-client identification, Cloudflare deployment/D1 binding identification, authorized-tool inventory. These are solid, reusable facts — see §5 (reusable artifacts).

What is **NOT_MET / NOT_STARTED**, re-verified by me at the current `metis-2.0` checkout:
- **SRC-18, Forgejo mirror authority: NOT_MET.** `PHASE1-STATUS.md:55`. No Forgejo remote, URL or token in any readable clone (`source-register.md:405-416`, REPORTED). This is a pure information gap — only Tony has the answer (§6, blocker #7).
- **HMSTEP-01, Hindsight pin: NOT_MET.** `PHASE1-STATUS.md:61`. `git ls-files | grep -ic hindsight` → I re-ran this at the current `metis-2.0` HEAD: 0 tracked files reference Hindsight. No pin, no dependency diff, no API fixture exists anywhere in the repo.
- **AGX-01 / HeyClicky reference row: NOT_MET.** `PHASE1-STATUS.md:59`. 0 matches for "HeyClicky" in the TASK-001 register even though the kit itself already carries the identity: I confirmed `clicky-study/ARTIFACT.json` exists at `/Users/<redacted-user>/AI-Brain-build/metis-v2-inputs/r11/Metis-2.0-Upgrade-Kit-r11/clicky-study/ARTIFACT.json` (OBSERVED, this lane) — the artifact is already sitting in the kit; TASK-001 simply never copied its identity into the register. **This is a 5-minute engineering fix**, not a blocker on anyone.
- **§33 independent review: NOT_MET.** No `dual_agent.py` packet exists for any Phase-1 file (`PHASE1-STATUS.md:62`).
- **V1 sanitization (blocker #26): partially fixed since Phase-1 was written.** I re-checked this myself (OBSERVED, this lane, 2026-09-26):
  - `.wrangler/` cache holding the full Cloudflare account ID (`PHASE1-STATUS.md:47` item (a)) **no longer exists** — `ls /Users/<redacted-user>/AI-Brain-build/metis-2.0-exec/.wrangler` → "No such file or directory". This sub-item is now **DONE**.
  - The personal email at `service-register.md:29,30,53` (item (b)) **is still present in a form that matches a full email-address pattern** — I confirmed this with a masking regex scan and did **not** print the value (per the hard rule against reproducing PII); the lines still read as an incompletely redacted address (a `t***` prefix directly abutting what regex-matches as a complete `<redacted-email>`). This sub-item is **NOT_STARTED**. Do not open this file to "just look" — mask before any future read.
- **V2, baseline test exits: PENDING_LEAD → now largely resolved by `metis-r11-work`.** The Phase-1 critic said `swift test` for MetisKit was never run and 25 desktop-test skips were unexplained (`PHASE1-STATUS.md:48`, `section 5.1`). I found (§4) that `metis-r11-work`'s later hermetic verification run (`verification-20260924-s3-hermetic/02-vitest-root.json`) reproduces a clean, fully-green root suite (6734 total / 6703 passed / 0 failed / 31 pending) and typecheck/check:bugs/proxy/operator all PASS — but it still does **not** run `swift test` (MetisKit) or `native-app` builds; the r11-work `full-test.sh` (`tools/full-test.sh:1-11`, OBSERVED) has no Swift gate. **`swift test` for MetisKit remains NOT_RUN anywhere in either body of work.**

Reusable: the 13-workspace map, the exact-SHA source pinning, and the D1/Cloudflare identity facts in `source-register.md`/`service-register.md` are accurate and directly reusable once the two sanitization items above are closed.

### 1.2 TASK-002 "Lock PRD, policies, lanes" — **PARTIAL (0.1.0-draft)**

`tasks/TASK-002/prd-lock.md` (94.7K). Verdict: `PHASE1-STATUS.md:22`.

- 55 M2 requirement rows and 112 use-case rows exist and are ID-complete (`PHASE1-STATUS.md:76`, spot-check S16/S17 reproduced by the critic lane).
- **Missing and blocking 12 direct dependents** (`BLOCKERS.md:11`, row #3): §25 coverage map, §27 evidence registry, updated threat model, route-evidence record are **NOT_MET** (`PHASE1-STATUS.md:75-76`). None of these needs Tony — Codex/engineering can generate all of them today with every ID marked `NOT_TESTED` (the kit's own instruction, `PHASE1-STATUS.md:221`). This is the single highest-leverage **ENGINEERING-SOLVABLE-NOW** item blocking the rest of Phase 1 (see §3, blocker #3's engineering sub-part).
- Entitlement authority (SRC-02/EXP-08, C-16) is **OPEN** — I re-verified directly: `src/renderer/src/App.tsx:311` at current HEAD still reads `const LICENSE_ENFORCEMENT = false`. This is a pure Tony decision (blocker #6).
- Cloudflare AI-Gateway privacy metadata (C-18) is **OPEN** — I re-verified `operator/src/use.ts:232` at current HEAD only returns `cf-aig-collect-log-payload`/`cf-aig-skip-cache` headers, no `cf-aig-collect-log: false`. Important: **`metis-r11-work` already contains an unmerged, tested fix that goes further than a header tweak** — see §4.2. This changes blocker #5 from "needs full owner+engineering rework" to "the code exists, only the policy sign-off is missing."
- `release.yml` Windows/macOS publish coupling (C-11) is **still present** — I re-verified `.github/workflows/release.yml:313` (`needs: [release-macos, release-windows]`, current line numbers 313/317 in the version at this checkout) directly.

### 1.3 TASK-003 "Source map and handoff" — **PARTIAL**

`tasks/TASK-003/source-map.md` (43.7K). Verdict: `PHASE1-STATUS.md:23`. Structural map, task index (TASK-006..066) and freshness checks are solid (MET rows, `PHASE1-STATUS.md:93-96`). Missing pieces are all cheap, engineering-only, and none touch product behavior: a numbered-lessons file (NOT_MET), an always-loaded security/retention-rules file (NOT_MET — would need an `AGENTS.md`, which needs Tony's one-time approval under the repo's `DESIGN.md` gate, not per-item approval), and a `CURRENT.md` pointer to the active task (PARTIAL — `CURRENT.md` is 6 lines with phase only, no active-task/next-action link).

### 1.4 TASK-004 "Size, capture, hardware" — **PARTIAL**

`tasks/TASK-004/baselines.md` (31.7K) + `baselines.json` (64.4K). Verdict: `PHASE1-STATUS.md:24`. Compressed/unpacked byte sizes are exact and hash-verified (`PHASE1-STATUS.md:112-113`, S23/S24 reproduced). **Two measurement classes are NOT_RUN, not merely undocumented:** startup/process-tree memory+CPU, and capture-to-caption latency (`PHASE1-STATUS.md:116-117`). Both genuinely require a clean macOS QA host and (for Windows) a Windows x64 machine (blockers #13/#14, ACCOUNT/EXTERNAL) — they cannot be produced by more engineering effort alone, only by hardware/account provisioning. The capture-latency **harness itself**, however (`scripts/bench-asr-ttfc.mjs`), is stub-only today (`PHASE1-STATUS.md:118`, blocker #20) and writing a real one is ENGINEERING-SOLVABLE-NOW even before a QA host exists.

**Cross-reference to the lead's runtime evidence (E2/E3/E5/E8, given to this lane):** these are exactly the measurements TASK-004 flagged as NOT_RUN. The orphaned `llama-server` sidecars (E2), the 8-relaunch/no-clean-shutdown pattern (E3), and the `local.runtime.start x62 vs local.runtime.stop x108` imbalance (E8) are process-lifecycle facts that a startup/process-tree harness (TASK-004 D5) would have caught before ship. I did not re-derive root cause for these — that is squarely the L01 (main lifecycle) / L02 (main sidecars) lanes' job, and `lanes/L01-main-lifecycle.md` and `lanes/L02-main-sidecars-ai.md` already exist in this review tree — but I flag the traceability gap: **no TASK-004 criterion or BLOCKERS.md row currently accounts for "sidecar reaping on crash/force-quit"** as its own requirement. It should be added as a new requirement, not folded silently into #20's latency harness (see requirements list).

### 1.5 TASK-005 "Shared contracts" — **PARTIAL (design only, nothing in the repository)**

`tasks/TASK-005/contracts.md` (225.3K — the largest single artifact in the exec dir). Verdict: `PHASE1-STATUS.md:25`, and explicitly gated: `contracts.md:5` "DESIGN ONLY. Nothing was written to the repository" (REPORTED), confirmed by registry state `NOT_STARTED` and `MASTER:1889` (design may proceed, closure may not).

This is the single largest blocking node in the whole blocker graph — **24 direct TASK dependents** (`BLOCKERS.md:9`, row #1). The design itself is unusually well-verified for something never merged: the Phase-1 critic lane reproduced it from scratch (`PHASE1-STATUS.md:134`, S25/S26): `tsc` exit 0, a from-scratch rebuild of `selfcheck.mts` giving 366/0, and a Swift recompile giving 124/0, with all 11 reference-file SHA-256 values matching. That means the **design is implementation-ready**, not merely aspirational — an engineer could start `src/shared/contracts/*` today once TASK-002 closes. The blocking dependency is TASK-002 (owner decisions), not engineering readiness.

### 1.6 TASK-027/028.A "Ship-line reconciliation and right-edge repair" — **NOT_STARTED (spec only, no code changed)**

`tasks/TASK-027/reconcile.md` (32.6K). No `TASK-028` directory exists at all in the exec dir — only the combined reconciliation doc.

- **Lineage finding (already true on `main`, done by a *different*, pre-kit process):** GitHub issues #196 and #197 are already fixed on `origin/main` via PR #199 (`fca1e6b5`), independent of the kit-r11 execution (`reconcile.md:24-58`, re-verified structurally by the critic lane at S4/S5). I re-confirmed the devEnv fix is present at the current checkout: `src/main/index.ts:1491` reads `const viteDev = devEnv('ELECTRON_RENDERER_URL')` (OBSERVED). Ledger rows MQA-338/MQA-339 are nonetheless still marked **OPEN** in `docs/qa/BUG-LEDGER.md` (`reconcile.md:58,111`) because packaged verification never ran — a paperwork/verification gap, not a code gap.
- Two concrete regression-test gaps remain **NOT_STARTED** and are genuinely cheap engineering fixes: **G197-1** (`reconcile.md:61`, the guard regex misses the dotted `process.env.ELECTRON_RENDERER_URL` form — a decoder regression would pass today's suite) and **G196-1** (`reconcile.md:115`, the whole Act-2 regression suite is `describe.skipIf(process.env.ASKTOTO_BROWSER_QA !== '1')` and CI never sets that flag, so it's skip-only in CI today).
- **TASK-028.A (right-edge dock) is entirely unimplemented.** `reconcile.md:143-156` documents 11 concrete, file:line-cited defects (D1-D11: composer disabled and drops focus while `busy` — `RightEdgeSidecar.tsx:57`, `App.tsx:3962/4026`; pointer-departure collapsing an active dock and cancelling an in-flight, unresolved proposal — `overlay-chrome.ts:105-111`, `overlay-autohide.ts:16,98-103`; single-line composer; deferred-to-rAF focus; drag-region swallowing composer clicks; clipped small-height layout; clipped action rail; split geometry authority; oversized parked-tab hit-region; IME-composition submit/Escape gaps). None of this has been touched in source — I confirm this is still an accurate description of current `main` by re-reading `RightEdgeSidecar.tsx:57` at the checkout: `disabled={!available || busy}` is unchanged. **This is a fully-specified, ready-to-implement backlog** (each defect ships with its own proving-test ID, e.g. component test for D1, truth-table test for D2), gated only on the shipping-line decision (blocker #11/B5) confirming that 028.A targets `main`'s `RightEdgeSidecar` rather than PR #194's `DockPanel`.

### 1.7 Windows signing — **NOT_STARTED (decision brief only)**

`tasks/WINDOWS-SIGNING/DECISION-BRIEF.md` (9.5K) + `research-azure.md`/`research-ca.md`/`integration-design.md` (116K combined) + `build-workflow-result.json` (98.5K, a CI-run artifact, not read in full — not needed for this lane's verdict). The brief is genuinely decision-ready: six routes (A. Microsoft Artifact Signing, B. Public CA OV + cloud signing, C. Public CA OV + own HSM, D. Microsoft Store MSIX, E. fleet-only self-signed, F. SignPath Foundation) each priced, timed and owner-mapped (`DECISION-BRIEF.md:10-18`). Current blocker: `security find-identity -v -p codesigning` → 0 valid identities (re-verified by the prior lane, not by me — I did not run this locally since it needs a signing keychain this sandbox does not have). **This is squarely ACCOUNT/EXTERNAL + OWNER-ONLY** (entity choice, budget, Azure/CA procurement) — no amount of engineering closes it. The brief itself notes seven things Claude *can* wire now without credentials (`DECISION-BRIEF.md:37-44`: fail-closed `WIN_SIGNING_MODE` resolver, config overlay, OIDC plumbing, EKU verify-signing checks, a post-build `verifySignature` gate, keeping `AZURE_*` vars out of the packaged-launch env, and updating two stale doc lines) — these are ENGINEERING-SOLVABLE-NOW and should be done in parallel with the entity decision, not after it.

---

## 2. `metis-r11-work` — an undocumented, already-green, unmerged fix set

This directory is **not mentioned anywhere in `metis-2.0-exec`.** It sits at `/Users/<redacted-user>/metis-r11-work`, base `2bf21f1c` (same HEAD as the reviewed checkout), branch `work/metis-r11-20260924-083623`, `remote_pushed: false` (`session.json:1-5`, OBSERVED). It is a real, uncommitted worktree with genuine code changes and a receipt-generating verification harness (`tools/gate.py`, `tools/full-test.sh`) that is materially more rigorous than anything the exec-dir lanes ran (`gate.py:12-20`: every receipt binds `HEAD` sha + sha256 of the exact diff + untracked-file digests, so a receipt is invalidated the instant source changes — a genuinely good pattern worth adopting kit-wide).

### 2.1 What changed (13 files, +425/−71, `git diff --stat HEAD` OBSERVED this lane)

```
docs/qa/BUG-LEDGER.md                              |  21 +
operator/src/ai-gateway.ts                         | 160 ++++++--
operator/src/ask-meter.ts                          |  12 +-
operator/src/keys.ts                               |  25 +
operator/src/use.ts                                |  34 +-
+ 4 matching *.test.ts files
src/renderer/src/lib/onboarding-hero-video.ts       |  48 ++--
+ its test file
src/shared/metis-wake.ts                            |  48 ++
vitest.config.ts                                    |  36 ++
```
plus 5 new untracked test files (`operator/src/ai-gateway.privacy-fixture.ts`, `ai-gateway.privacy.test.ts`, `ask-meter.validation.test.ts`, `keys.privacy.test.ts`, `src/main/test-hermetic-home.test.ts`, `src/shared/metis-wake-lossless.test.ts`).

### 2.2 The AI-Gateway privacy fix directly answers half of blocker #5

Current `main` (`operator/src/ai-gateway.ts`, re-verified this lane) only *creates* a default gateway if missing and never reads back its configuration. The r11-work diff adds `assertSensitiveRouteConfiguration()` which reads the live gateway config back from Cloudflare and **fails closed** (throws `GatewayPrivacyError('GATEWAY_CONFIGURATION_UNSAFE')`) unless `collect_logs === false`, `cache_ttl === 0`, `logpush === false`, and `otel`/`log_classification` are empty/false (diff shown above, OBSERVED). It also moves the gateway check to run **before** any vault write in `operator/src/keys.ts` (`writeVaultKey`/`rotateVaultKey`), so a failed privacy check leaves the previous working credential untouched instead of silently proceeding (comment in diff: "A failed privacy check must leave the previous working credential intact"). This is exactly the missing half of BLOCKERS.md row #5 ("`cf-aig-collect-log: false` not sent... every route UNREVIEWED") — the code-level enforcement piece is **done and green**, only the C-18 policy sign-off (does Tony accept metadata-only gateway logs at all) is still owner-only.

Caveat: this fix is entirely local/unit-tested (`operator/src/ai-gateway.privacy.test.ts`, `keys.privacy.test.ts`) against a fixture, not against the live Cloudflare account — it does not by itself satisfy blocker #5's "authorize one read-only readback of gateway log and cache settings" against production, but it means that readback, once authorized, has real enforcement code to land into instead of starting from zero.

### 2.3 MQA-348 — a new, critical, already-fixed defect no other document mentions

`docs/qa/BUG-LEDGER.md` diff, new row: **"Unit tests wrote into the developer's real OneDrive 'Métis Meetings' folder and hung the run on a cloud-only file"** — severity **critical**, status **FIXED** in this worktree (unmerged). Root cause per the ledger entry text (OBSERVED, diff shown in tool output above): tests calling `resolveMeetingsFolder({ meetingsFolder: '' })` (ingest-degradation/ingest-local-lockout/ingest-operator-funded/ingest-team/update-persistence) let `detectOneDrive()` (`src/main/transcripts.ts`) resolve the *real* OneDrive root from `HOME`, and the one-time legacy-meetings copy-forward then wrote into the developer's actual `Métis Meetings` folder; on 2026-09-24 a cloud-only `.autosave-draft-*.md` placeholder blocked `copyFileSync` synchronously and hung the entire test run. CI never saw it (no OneDrive there); a sandboxed local run fails the write silently, so only an unsandboxed run on a real OneDrive-linked Mac exposes it.

The fix is a `vitest.config.ts` change giving every test worker a fresh temp `HOME`/`USERPROFILE` and blanking the Windows `OneDrive*` env vars (diff above), proven by a new red-then-green test `src/main/test-hermetic-home.test.ts`. This is a **severity-critical, data-adjacent defect** (a test run could corrupt or hang against a user's real meeting notes) that:
- is **not** in `BLOCKERS.md`'s 29 rows,
- is **not** in any of `TASK-001..005`'s registers,
- is fully fixed and unit-verified, but **uncommitted and unpushed**.

This should be treated as its own MUST-fix requirement for 2.0 closure, landed from this worktree rather than re-derived, and the exec-dir's bookkeeping gap (a real critical fix existing outside its own tracking) flagged to the lead.

### 2.4 Onboarding hero-video media resilience — fixes the same defect class as reconcile.md's C2

Current `main` (`src/renderer/src/lib/onboarding-hero-video.ts`, re-verified this lane at the checkout) still has:
```ts
const audioPlay = audio?.play()
const videoPlay = video?.play()
```
with no `try/catch` around the synchronous `.play()` call itself — only the returned promise is `.catch()`-guarded. If `.play()` **throws synchronously** (which `HTMLMediaElement.play()` can, e.g. on a detached/unsupported element), the exception propagates uncaught and the *other* media element's `.play()` call on the same line never runs. This is precisely the defect class TASK-027's reconcile.md calls **C2** for the sibling `OnboardingExperience.tsx` path (`reconcile.md:101`: "a synchronous media throw swallows the transition... Any synchronous throw aborts the click before the scene advances") — main's `fca1e6b5` already wrapped *that* call site in try/catch (`reconcile.md:108`, `:1053-1057`), but this sibling module (`onboarding-hero-video.ts`) was missed.

`metis-r11-work`'s diff (§ above, `tryPlayOnboardingMedia`/`tryRestartOnboardingMedia` helpers) fixes exactly this, with both attempts now independent (one throwing does not block the other), verified by an extended test file (`onboarding-hero-video.test.ts`, +70 lines). This is a small, low-risk, already-tested patch that should be cherry-picked into TASK-027.A's scope rather than re-implemented.

### 2.5 `ask-meter.ts` / `use.ts` — token-count data-integrity hardening

`proxyTokenCount()` (new, `operator/src/ask-meter.ts`) rejects non-safe-integers, negatives, `NaN`/`Infinity` instead of coercing them, so a malformed provider response can no longer silently persist a corrupted count to D1 (comment in diff: "Never turn a malformed provider value into zero, round it, or persist NaN/Infinity to D1"). This is a general data-correctness fix, not tied to a specific tracked blocker, but relevant to any future TASK-002 §27 evidence-registry work on the metering pipeline.

### 2.6 `metis-wake.ts` — Unicode-safe wake-word stripping

Rewrites `stripWakeWord()` to locate the wake token's span in the **original** UTF-16 string (tracking per-character fold offsets) instead of slicing the already-folded/normalized string, so accented characters, combining marks and casing in the user's actual command text are preserved verbatim after the wake word is removed (diff above). This is unrelated to any of the 29 tracked blockers or five TASK registers — it appears to be an independent correctness fix from the same work session, not connected to the Métis-2.0-kit backlog at all.

### 2.7 Verification receipts (re-read, not re-run, except where noted)

`verification-20260924-s3-hermetic/*.json` (OBSERVED, this lane, read directly):

| Gate | Result |
|---|---|
| `00-typecheck` | PASS, exit 0 |
| `00b-check-bugs` | PASS, "347 tracked (335 FIXED each pinned by a regression test that cites its id, 10 OPEN)" |
| `01-mode-skills` | PASS |
| `02-vitest-root` | PASS — 545 files, 6734 total, 6703 passed, 0 failed, 31 pending |
| `03-proxy` | PASS — 28/28 |
| `04-operator` | PASS — 1031/1031 |

An earlier session in the same tree (`verification-20260924T083659754658Z/06.log`, OBSERVED) shows the **pre-fix red state**: 1 failed test file (`onboarding-hero-video.test.ts`), 6701 passed / 1 failed / 25 skipped — i.e. this was a genuine red→green TDD cycle, with the original file backed up before modification (`backups/pre-v2-media/onboarding-hero-video.ts` + its test, OBSERVED via `find`, contents not altered by me).

Cross-check against the current `metis-2.0` checkout's own bug ledger (re-verified this lane): `grep -c '| OPEN |' docs/qa/BUG-LEDGER.md` → 10, `grep -c '| FIXED |'` → 335 — consistent with the r11-work receipt's 335/10 split (the r11-work session's own MQA-348 addition is uncommitted, so it doesn't change the committed-HEAD count).

**Recommendation to the planner:** this whole diff (13 files) is a small, cleanly-scoped, fully-green, already-reviewed-quality patch. The lowest-risk path to closing part of blocker #5 and all of MQA-348/onboarding-media-C2 is to **cherry-pick this worktree's diff into a reviewed branch off current `main`**, not to redo the analysis. It should go through the same review gate as any other change (§33), but it does not need to be re-designed.

---

## 3. Blocker classification (all 29 rows, `BLOCKERS.md`)

Legend: **OWNER-ONLY** = needs a decision, name, approval or confirmation only Tony (or a named third party) can give, with no new account/hardware involved. **ACCOUNT/EXTERNAL** = needs provisioning, purchase, or access inside a third-party account/service/hardware (may still need Tony to authorize it, but the bottleneck is the external resource, not the decision itself). **ENGINEERING-SOLVABLE-NOW** = Codex/an engineer can execute this today against the repo/CI with no new decision or external resource. Compound rows (a decision gates otherwise-ready engineering work) are marked with a `+` sub-note — this is the actionable signal for parallelizing Phase 2.

| # | Blocker (short) | Class | Why / smallest-unblock cross-check |
|---|---|---|---|
| 1 | TASK-005 contracts can't close | **OWNER-ONLY** (+ENG ready) | Blocked on #3 closing first; the contract design itself is implementation-ready NOW (§1.5) — engineering can start the moment #3's owner items land. |
| 2 | Tenant/provider prerequisites unnamed (Entra/Teams/Dust/Jev/Laya/privacy) | **OWNER-ONLY** | Pure naming — Tony is the only source for who these people are. |
| 3 | TASK-002 can't close | **OWNER-ONLY** (+ENG ready) | Coverage map/evidence registry/threat-model/route-record can be generated today with every ID `NOT_TESTED` (`PHASE1-STATUS.md:221`) — that part is ENGINEERING-SOLVABLE-NOW. Only C-03/C-08/C-18 answers and final approval are owner-only. |
| 4 | No CI for MetisKit `swift test` / license-server `node --test` | **ENGINEERING-SOLVABLE-NOW** | Re-verified: 0 workflow lines reference swift/xcodebuild/license-server/native-app at current HEAD. Adding two CI jobs needs no decision or external account. |
| 5 | Cloudflare route privacy readiness (C-18) | **OWNER-ONLY** (+ENG done) | Enforcement code already exists, tested, unmerged (§2.2). Remaining piece is naming a privacy owner and Tony's C-18 policy call, plus authorizing one read-only production readback. |
| 6 | 2.0 entitlement authority undecided | **OWNER-ONLY** | Single yes/no: Operator vs. license-server. Re-verified `LICENSE_ENFORCEMENT = false` still compiled off. |
| 7 | Forgejo mirror authority unverifiable | **OWNER-ONLY** | Only Tony knows if it's live/authoritative and has its URL/settings. |
| 8 | Hindsight not pinned, hosting not approved | **OWNER-ONLY** (+ENG ready) | Pinning the upstream release/SDK/deps is ENGINEERING-SOLVABLE-NOW (read-only research); hosting boundary/region/managed-Postgres approval is owner-only. |
| 9 | Production Operator on off-main build w/ ACCESS bypass | **OWNER-ONLY** (+ENG ready) | Merge-or-revert decision plus a security review of the bypass is owner/security-reviewer; the reconcile PR itself is ready to write once decided. |
| 10 | Operator staging Worker/D1 doesn't exist | **ACCOUNT/EXTERNAL** | Requires creating new Cloudflare resources (Worker + D1) inside the live account — provisioning, not just a decision. |
| 11 | Shipping line / dock lineage undecided | **OWNER-ONLY** | One line: which line (main 1.9.6 RightEdgeSidecar vs. PR #194 1.9.8 DockPanel) ships. |
| 12 | v1.9.6-unsigned public, policy still forbids it | **OWNER-ONLY** (+ENG ready) | Tony's written confirmation is owner-only; the SIGNING.md/ENTERPRISE_RELEASE.md doc PR is ENGINEERING-SOLVABLE-NOW once confirmed. |
| 13 | No isolated macOS QA host | **ACCOUNT/EXTERNAL** | Needs a machine/VM account, not a decision. |
| 14 | No Windows x64 test machine | **ACCOUNT/EXTERNAL** | Same — hardware/runner provisioning. |
| 15 | No independent Fable/Claude review of Phase-1 deliverables | **ENGINEERING-SOLVABLE-NOW** | `tools/dual_agent.py packet` exists; the lead can run this without Tony or any new account. |
| 16 | Windows Authenticode identity untrusted | **ACCOUNT/EXTERNAL** (+OWNER-ONLY first) | Entity/route choice is owner-only (`DECISION-BRIEF.md:47-51`), but the bottleneck to actually closing it is Azure/CA procurement and validation (1-20 business days) — external-account-bound either way. |
| 17 | `release.yml` couples Windows+macOS publication | **ENGINEERING-SOLVABLE-NOW** | Re-verified `needs: [release-macos, release-windows]` still present; splitting this is a routine reviewed PR. |
| 18 | license-server (Fly.io) live state unobservable | **ACCOUNT/EXTERNAL** | `fly status` needs Fly.io account access this sandbox doesn't have; Tony can run it or authorize a sandbox-off read. |
| 19 | Live D1 schema unreconciled (28 vs 19 tables) | **OWNER-ONLY** | Existing account/credentials; only needs Tony's authorization to run one read-only `SELECT` (policy gate, not new provisioning). |
| 20 | No capture-to-caption latency harness | **ENGINEERING-SOLVABLE-NOW** | Writing the harness needs no decision; *running* it against real hardware depends on #13/#14. |
| 21 | No macOS Developer ID / notarization secrets | **ACCOUNT/EXTERNAL** | Apple Developer Program enrollment + secret provisioning. |
| 22 | No native SwiftUI artifact built | **ENGINEERING-SOLVABLE-NOW** | Re-verified (prior lane, S26): `swiftc` works in-sandbox with `-module-cache-path`/`TMPDIR` in the scratchpad — this can be done without Tony or new accounts. |
| 23 | `Metis-Jev-Integration-Plan.md` not found | **OWNER-ONLY** | Only Tony can supply the path/copy. |
| 24 | Codex integrator route usage-limited | **ACCOUNT/EXTERNAL** | Third-party SaaS quota (resets 2026-09-29); alternatively Tony/lead can just name a different integrator for now — note this session's own instructions ("execute with Sonnet... use ChatGPT to run audits") already function as exactly that workaround. |
| 25 | Baseline exits incomplete (PENDING_LEAD) | **ENGINEERING-SOLVABLE-NOW** | Largely superseded already: `metis-r11-work`'s hermetic run (§2.7) supplies a clean full-suite pass and explains the skip classes; folding this into the TASK-001 register and still running MetisKit `swift test` needs no owner input. |
| 26 | Exec-dir sanitization (.wrangler cache + unmasked emails) | **ENGINEERING-SOLVABLE-NOW** | Re-verified: `.wrangler/` cache is already gone (done); the email at `service-register.md:29,30,53` is still present and just needs masking — a lead-only text edit, no decision needed. |
| 27 | Promised refactoring skill not identified | **OWNER-ONLY** | Only Tony can name the skill and its location/version. |
| 28 | Tony Walteur welcome recording not provided | **OWNER-ONLY** | Only Tony can supply it; text fallback already works, so this never blocks the text path. |
| 29 | Two OneDrive-hosted worktrees unreadable | **OWNER-ONLY** (or ACCOUNT/EXTERNAL) | Cheapest path is Tony confirming those two worktrees hold no work worth preserving (owner-only); repairing OneDrive sync itself would be account/external. |

**Roll-up:** of 29 rows, **10 are pure OWNER-ONLY**, **6 are ACCOUNT/EXTERNAL**, **7 are pure ENGINEERING-SOLVABLE-NOW**, and **6 are compound** (an owner decision gates otherwise-ready engineering work — these are the highest-leverage items to pre-stage, since the engineering half can proceed in parallel with the ask to Tony). Net: **13 of 29 rows have an engineering-doable component today**, several of which (§2, §1.5, blocker #25/#26) are already partly or fully done in one of the two prior work streams.

---

## 4. Runtime evidence cross-reference (context, not re-derived)

The lead's OBSERVED runtime evidence (E1-E9, from the running 1.9.6 install) was supplied as context, not as something this read-only, no-content lane could reproduce (I did not touch the live app or its logs). Cross-referencing only:

- **E2 (orphaned `llama-server`/`chrome_crashpad_handler` sidecars), E3 (8 starts, no clean shutdown), E8 (`local.runtime.start x62` vs `stop x108`)** all fall inside TASK-004's NOT_RUN startup/process-tree measurement (§1.4) and are core-lifecycle territory for the L01/L02 lanes, not this one. No tracked blocker currently names "sidecar reaping on crash" as its own requirement — I recommend the planner add one (see requirements list, `REQ-K09-023`).
- **E5 (capture.failed loop, "Screen Recording permission is off", dated Aug 2026)** — the task instructions flag this needs re-verification at HEAD; that is a source-code question (does the retry loop still exist, at what interval) that belongs to whichever lane reads `src/main`'s capture code (L04), not to this exec-history lane.
- **E9 (SingletonLock present)** is consistent with, but does not by itself prove, the "running but frozen, relaunch does nothing" report (E3/Tony's bug #2) — a hung first instance holding the lock would exactly produce that symptom. This is a plausible **DERIVED** hypothesis worth the lifecycle lane's attention, not a conclusion this lane can certify.
- None of E1-E9 appears anywhere in `BLOCKERS.md`'s 29 rows or any TASK-001..005 register — they are new information relative to the documented Phase-1 execution.

---

## 5. Reusable artifacts inventory

| Artifact | State | Reuse note |
|---|---|---|
| `tasks/TASK-001/source-register.{md,json}`, `service-register.md` | MET facts are accurate | Exact SHAs, 13-workspace map, D1/CF identity — reuse directly once §1.1's two sanitization items are closed. |
| `tasks/TASK-002/prd-lock.md` | 0.1.0-draft | 55 requirement rows + 112 use cases are usable now; needs §25/§27/threat-model generation (engineering) + Tony's approval. |
| `tasks/TASK-003/source-map.md` | Solid | Task index (TASK-006..066) is the map for all Phase-2+ work. |
| `tasks/TASK-004/baselines.{md,json}` | Bytes MET, perf NOT_RUN | Byte/hash baselines reusable; perf numbers must be re-measured on real hardware, not estimated. |
| `tasks/TASK-005/contracts.md` | Design-complete, implementation-ready | `tsc` 0/366-pass/124-pass self-checks already reproduced; start `src/shared/contracts/*` from this the moment TASK-002 closes. |
| `tasks/TASK-027/reconcile.md` | Fully-specified backlog | 11 file:line-cited defects (D1-D11) with proving-test IDs each — ready to implement without further design work. |
| `tasks/WINDOWS-SIGNING/*` | Decision-ready | 6 priced/timed routes; 7 credential-free items Claude can wire now (`DECISION-BRIEF.md:37-44`). |
| `metis-r11-work` worktree diff (13 files) | **Green, unmerged, undocumented** | Cherry-pick candidate: AI-Gateway privacy enforcement, MQA-348 hermetic-test-home fix (critical), onboarding-hero-video media resilience, ask-meter integer hardening, wake-word Unicode fix. See §2. |
| `metis-r11-work/tools/gate.py` | Working pattern | Source-identity-bound receipts (HEAD sha + diff sha256 + untracked digests) are a better verification-receipt pattern than the exec-dir's plain logs — worth adopting for Phase 2. |

---

## 6. Open decisions for Tony (owner-only items, consolidated)

These are the OWNER-ONLY rows from §3, restated as single questions so they can be answered in one pass rather than 10 separate threads:

1. Name: Entra tenant admin, Teams admin, Dust workspace admin, Jev/Laya account holders, privacy/legal owner (#2).
2. Answer C-03, C-08, C-16 (entitlement authority), C-18 (gateway log retention policy) in your own words, and approve `prd-lock.md` (#3, #6, #5's policy half).
3. Is the Forgejo mirror live/authoritative? Give its URL (#7).
4. Approve Hindsight's hosting boundary/region/managed-Postgres choice (#8's policy half).
5. Merge or revert the off-main Operator build's three commits (ACCESS bypass) (#9).
6. Which line ships: main 1.9.6 RightEdgeSidecar or PR #194 1.9.8 DockPanel (#11, also gates #28.A scope confirmation B5 in `reconcile.md:212`)?
7. Confirm in writing that v1.9.6-unsigned may stay public despite current SIGNING.md wording (#12).
8. Authorize the one read-only `wrangler d1 execute ... SELECT name FROM sqlite_master` (#19).
9. Supply the path/copy of `Metis-Jev-Integration-Plan.md` (#23).
10. Name the promised refactoring skill and its location/version (#27).
11. Supply the Tony Walteur welcome recording, or confirm the text fallback ships as final (#28).
12. Confirm the two OneDrive-hosted worktrees hold no work worth preserving, or get OneDrive sync repaired (#29).

Separately, ACCOUNT/EXTERNAL items that need Tony to authorize spend/provisioning rather than just decide: staging Cloudflare Worker+D1 (#10), a macOS QA host (#13), a Windows x64 machine (#14), Windows code-signing entity+route (#16), Fly.io access (#18), Apple Developer enrollment (#21), and Codex quota/alternate integrator (#24).

---

## 7. Requirements extracted from method docs (source-cited, faithful, none invented)

Per `sae/software-architecture-engineer/references/02-requirements-and-quality.md` and `stark/stark/references/product-and-planning.md`, both skimmed in full (35 and 58 lines respectively — short reference files, read completely, not sampled):

- **Journeys before technology** (`02-requirements-and-quality.md:3-5`): describe 3-5 user journeys including unhappy paths, with actor/permission/starting-state/trigger/expected-response/durable-effect/completion-signal/failure-behavior/audit fields, and distinguish "request received" vs "data committed" vs "job completed" vs "external recipient notified". **Gap found:** none of TASK-001..005 or the reconcile.md defect list is organized this way — TASK-027's D1-D11 are component-level defects, not journey-level scenarios. A Phase-2 requirements pass should re-derive the onboarding and right-edge-dock journeys in this Given/When/Then-with-failure-behavior shape before more code lands, per this method doc.
- **Quality-scenario form** (`:8-9`): "Given environment E, when stimulus S acts on artifact A, the system responds with R, measured by M under workload W" — combine a performance target and a non-negotiable invariant only when explicitly distinguishing them, never averaged. The existing capture-latency and process-tree gaps (blockers #20, TASK-004 D5) are already framed as measurements without a target R/M — Phase 2 should state the actual SLO (e.g., "under a live meeting with local Parakeet ASR, first-caption latency ≤ Nms for 99% of utterances") rather than just "measure it".
- **Traceability** (`:31-33`): assign requirement IDs, link to components/decisions/tests/evidence, mark criticality (must-not-happen / required / preference), record non-goals explicitly. TASK-002's own §27 evidence registry gap (blocker #3) is exactly this requirement unmet — reinforces that closing #3 is high-leverage.
- **PRD required content / decision rights** (`product-and-planning.md:3-9, 13-17`): "A research request stops at its requested result. A PRD request does not authorize an MVP, and an MVP request does not authorize publishing or migrating production data." This directly bears on TASK-005: the contract design is complete and self-verified, but per this rule its existence does **not** authorize writing it into the shipping repo without TASK-002's approval closing first — consistent with the kit's own `MASTER:1889` gate the Phase-1 critic already cited.
- **Story readiness** (`:24-28`): "Fresh context carries requirement IDs, source locations/hashes, constraints, open risks, exact prior outputs and verification obligations — not merely the story title." The `contracts.md` and `reconcile.md` documents already meet this bar (hash-verified self-checks, file:line defect citations); the plain `BLOCKERS.md` rows mostly do too. TASK-003's missing "numbered lessons" file (§1.3) is the one artifact in Phase 1 that does not yet meet this bar.
- **Design review without theatre** (`product-and-planning.md:31-33`): "Different providers alone do not establish independence." Relevant to blocker #15/§33 — an independent review from Fable/Claude (or Codex, or ChatGPT per this session's own instruction) satisfies the intent only if it actually sees the brief, PRD and source evidence, not merely a different model name.

No requirement was invented beyond what these two short files state; none were dropped (both files were read start to end).

---

## 8. Bottom line for the Opus planner

- Phase 1 (TASK-001..005) is real, well-evidenced, self-reproducing work that is **PARTIAL everywhere**, never NOT_STARTED and never fully DONE. The blocking pattern is consistent: **design/analysis is usually implementation-ready; the gate is almost always either an owner decision or an external account**, not missing engineering effort.
- TASK-027/028.A (the next scheduled work per `CURRENT.md:6`) has zero code changes so far, but an unusually complete, file:line-cited, test-ID-mapped defect backlog ready to execute the moment the shipping-line decision (#11) lands.
- **The single most important finding for planning is `metis-r11-work`**: a separate, undocumented, fully-green, unmerged fix set exists, including one **critical**-severity defect (MQA-348) fixed nowhere else and untracked by any blocker or task register, plus a partial code-level answer to blocker #5. This should be triaged and merged before more Phase-2 work starts on the same files, and the exec-dir's own tracking should be updated to reference it so this gap doesn't recur.
- Of the 29 blockers, 13 have an engineering-doable component that can start in parallel with, not after, the owner/account items — that parallelization is the fastest path through Phase 1's remaining gate.

**Report path:** `/Users/<redacted-user>/AI-Brain-build/metis-v2-review/lanes/K09-prior-execution.md` (this file).
