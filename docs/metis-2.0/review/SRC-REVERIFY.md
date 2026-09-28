# SRC-REVERIFY — Re-verification of the 24 source-export findings against HEAD

**Ticket:** M2-0013 · **Type:** investigation (docs/process only; no code changed) · **Owner model:** sonnet
**Repo re-verified (read-only):** `mysticalsin/AskToto-Mantu` — `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:<path>`, current HEAD **`cfd8b22c90d69ae23499716493c9391f2ac7af98`** ("fix: Triage all 20 open PRs and 18 open issues per the verified dispositions and set labels and the 2.0 milestone [M2-0025] (#260)", 2026-09-28T00:56:35-04:00). No file in that checkout was created, modified, or deleted by this ticket.
**Prior pass re-verified here:** `metis-v2-review/lanes/K05-master-s22-31.md` §2.8, taken against HEAD `2bf21f1c` (v1.9.6). **`2bf21f1c` is not an ancestor of the current `origin/m2/integration`** — the git history was rewritten 2026-09-26 (owner operating rule) — so this ticket does not diff commit ranges; every claim below is a fresh, direct read of the file content at the two named refs.
**Source-export inputs:** `metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/references/source/metis-1.9.5-export.txt` (kit copy, read-only), `source-review/SOURCE-INDEX.json` (1,521 sections; `content_start_line`/`content_end_line` gives the exact line range of each file's text inside the export — the section boundary this pass's mechanical diff is keyed on, not an approximation), `source-review/FINDINGS.json` (the 24 findings' `source_observation`/`required_change`/`evidence[]` text) and `architecture/MAP-COVERAGE.json` (the 19 file-backed architecture-map nodes, 14 present / 5 `NOT_IN_EXPORT`).
**Evidence labels:** **OBSERVED** (read directly in the cited file at the cited ref), **DERIVED** (reasoned from OBSERVED facts), **ASSUMED**, **UNKNOWN** (anchor read, disposition not established this pass), **OPEN: not statically closable** (a real anchor was read; closing it needs evidence a source-only pass cannot produce — named per row).
**Round 3 current-HEAD refresh (2026-09-28):** the acceptance answer for M2-0013 is now §0A. §0-§9 below are retained as the round-2 audit trail against `70de3c30`; any conflict is superseded by §0A's `cfd8b22c` evidence.
**Revision note (round 2, this pass):** round 1 of this document mis-stated several "new since the export" claims — some of the cited machinery was already present, byte-identical, in the 1.9.5 export (§2's now-complete 58-path table proves this per file). §3, §4, §5 and §6 below are corrected against that table; §9 lists every correction made and why. One correction goes the other way: round 1's validator asked this pass to confirm three literal `Laya` hits in `App.tsx`/`Settings.tsx`/`src/shared/keys.ts` for F-09 — none exist at HEAD (§6, F-09); every apparent hit was a case-insensitive substring match inside an unrelated camelCase identifier (`overlayAllowsMinimize`, `displayAccelerator`, `replayAfterDrain`, …), not the word "Laya". F-09 is corrected to **OPEN: not statically closable** with that search recorded, not fabricated as closed.

---

## 0A. Round 3 acceptance refresh against current HEAD `cfd8b22c`

**OBSERVED — source repo identity (`git -C /Users/tony/AI-Brain-build/metis-operator-ux rev-parse origin/m2/integration`, 2026-09-28):** current `origin/m2/integration` is `cfd8b22c90d69ae23499716493c9391f2ac7af98`, commit subject `fix: Triage all 20 open PRs and 18 open issues per the verified dispositions and set labels and the 2.0 milestone [M2-0025] (#260)`, commit time `2026-09-28 00:56:35 -0400`.

**OBSERVED — graph/vault startup constraints:** `/graphify query "M2-0013 SRC-REVERIFY SRC-04 F-01 F-20" --budget 1800` could not run because `graphify-out/graph.json` is absent in this worktree; `graphify-out/wiki/index.md` is absent. `Preferences/dont.md` and `Preferences/mistakes.md` in the AI Second Brain vault failed to read with `Resource deadlock avoided`; this is recorded because the session-start read was blocked, not silently skipped.

**OBSERVED — required verifier path:** `scripts/trace/diff-export.py` is not present in this private worktree. **DERIVED:** the mechanical diff evidence below was produced by an equivalent scratch read-only Python process against the kit export/JSON inputs and `git show origin/m2/integration:<path>`; no repository tests, repository scripts, workflows, app, ledger mutation, or `_relay/` mutation were run.

**OBSERVED — kit inputs (`ls -l`, 2026-09-28):** `/Users/tony/AI-Brain-build/metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/references/source/metis-1.9.5-export.txt`, `source-review/SOURCE-INDEX.json`, `source-review/FINDINGS.json`, and `architecture/MAP-COVERAGE.json` exist locally and were read.

**Mechanical diff, export vs current HEAD, 58 mapped paths (OBSERVED command output, 2026-09-28):**

```text
Totals: {'CHANGED': 27, 'IDENTICAL': 25, 'MISSING_AT_HEAD': 1, 'NOT_IN_EXPORT': 5} | total paths: 58
CHANGED: .github/workflows/build.yml; .gitleaks.toml; cloudflare-proxy/src/index.ts; docs/AUDIT-LOG.md; docs/CLOUDFLARE.md; docs/design/ONBOARDING-FLOW.md; electron-builder.yml; intelligence/src/lib/brainAdapter.ts; license-server/package.json; operator/src/ai-gateway.ts; operator/src/d1.ts; operator/src/dashboard.ts; operator/src/index.ts; operator/src/store.ts; package.json; src/main/brain/ingest.ts; src/main/brain/store.ts; src/main/cloud-stt/credentials.ts; src/main/desktop-adapters.ts; src/main/index.ts; src/main/license.ts; src/main/metis-command-runtime.test.ts; src/main/metis-command-runtime.ts; src/main/operator-ingest.ts; src/main/speaker-id.ts; src/preload/index.ts; src/renderer/src/App.tsx; src/renderer/src/lib/onboarding-hero-video.ts; src/shared/metis-wake.ts; vitest.config.ts
IDENTICAL: DESIGN.md; THIRD_PARTY_NOTICES.md; cloudflare-proxy/provision-embedded-key.mjs; docs/ENTERPRISE-DEPLOY-WINDOWS.md; docs/ENTERPRISE_RELEASE.md; docs/verification/mi-5-dust-e2e.md; intelligence/src/App.tsx; license-server/lib/app.mjs; license-server/lib/store.mjs; native-app/App/Store/PersistedModels.swift; native-app/MetisKit/Package.swift; native-app/MetisKit/Sources/MetisKit/MeetingController.swift; operator/client/main.ts; scripts/push-both.sh; src/main/asktoto-shot.ts; src/main/brain/publish.ts; src/main/license-lease-key.ts; src/main/llm.ts; src/main/mode-skills.ts; src/main/parakeet.ts; src/main/screen-capture.ts; src/main/screen-preprocess.ts; src/renderer/src/components/BrandThinkingOrb.tsx; src/shared/desktop-actions.ts; src/shared/mode-recap.ts
MISSING_AT_HEAD: electron-builder.cahe.win.yml
NOT_IN_EXPORT: src/main/brain/ingest.ts; src/main/index.ts; src/main/transcripts.ts; src/renderer/src/App.tsx; src/renderer/src/lib/listen.ts
```

**SRC-04 current anchor (acceptance criterion 2):** **OBSERVED** `src/main/command-control.ts:85-110` still consumes a proposal, calls `deps.execute`, audits the adapter outcome, and only returns success when `result.ok && result.outcome === 'verified'` at `:104`; `:105-106` return `outcome_unverified` or `adapter_failed` otherwise. **OBSERVED** `src/main/desktop-adapters.ts:88-94` defaults `okResult()` to `'unknown'`; success call sites at `:182,189,195,201,204,209,212,222,234,237,244,255,259,264` pass `'unknown'`; `git grep "'verified'|\"verified\""` over `desktop-adapters.ts`, `desktop-actions.ts`, and `command-control.ts` finds only `command-control.ts:104` and the shared type declaration `desktop-actions.ts:31`. **Disposition: RELOCATED + PARTIAL.** CommandControl now separates dispatch from verified completion, but the current desktop adapters still never return `verified`.

### Current SRC-01..SRC-24 disposition table

| ID | Disposition at `cfd8b22c` | Current evidence | Owning ticket(s) |
|---|---|---|---|
| SRC-01 | **PARTIAL** | **OBSERVED:** current checkout identity is `cfd8b22c`; mechanical diff covers all 58 mapped paths. **UNKNOWN:** current CI artifact was not filed/read in this pass due owner rule. | M2-0005, M2-0015 |
| SRC-02 | **PARTIAL** | **OBSERVED:** `src/renderer/src/App.tsx:314` still gates on `LICENSE_ENFORCEMENT`; `src/main/license.ts:317-336` has `verifyLease` / `checkLicenseGrace`; `src/main/license-lease-key.ts:81` exposes `embeddedLicenseLeasePubkeyAvailable`. **DERIVED:** lease machinery exists, but product enforcement remains conditional. | M2-0062, M2-0146 |
| SRC-03 | **REPRODUCES** | **OBSERVED:** `src/main/metis-command-runtime.ts:216-235` awaits Jev decision and then deliberately discards it with `void result` under the advisory-only comment. | M2-0122 |
| SRC-04 | **RELOCATED + PARTIAL** | **OBSERVED:** `src/main/command-control.ts:85-110`, especially `:104-106`; `src/main/desktop-adapters.ts:88-94,182-264`; `git grep` shows no adapter-side `verified` literal. | M2-0082, M2-0083, M2-0084, M2-0085 |
| SRC-05 | **REPRODUCES** | **OBSERVED:** `src/shared/desktop-actions.ts:7-14` enumerates six demo actions only; no close-app/close-tab adapter type. | M2-0081, M2-0084 |
| SRC-06 | **PARTIAL** | **OBSERVED:** `src/shared/metis-wake.ts:21-35` now folds speech per character; `:54-88` strips wake word by original source span. **DERIVED:** source fix reduces payload corruption risk, but no runtime wake acceptance evidence was run in this pass. | M2-0041, M2-0081 |
| SRC-07 | **REPRODUCES** | **OBSERVED:** `src/main/cloud-stt/credentials.ts:15-16` still instructs seating a Cloudflare account API token for Nova-3. | M2-0107 |
| SRC-08 | **PARTIAL** | **OBSERVED:** `operator/src/ai-gateway.ts:113-194` now reads back and validates the default gateway privacy config. **DERIVED:** this materially fixes the prior bare `catch {}` pattern, but deployed gateway proof remains outside a source-only pass. | M2-0041, M2-0104 |
| SRC-09 | **PARTIAL** | **OBSERVED:** `electron-builder.cahe.win.yml` is missing at HEAD; `electron-builder.yml:131-140` still supports an opt-in encrypted Cloudflare key embed. | M2-0056 |
| SRC-10 | **PARTIAL** | **OBSERVED:** `operator/src/d1.ts:75-110` does provenance-aware upsert; `operator/src/dashboard.ts:736,1349` still caps ask lists at 2000/500. | M2-0041, M2-0106 |
| SRC-11 | **REPRODUCES** | **OBSERVED:** `native-app/App/Store/PersistedModels.swift` is byte-identical to export in the mechanical diff. | M2-0118 |
| SRC-12 | **REPRODUCES** | **OBSERVED:** `native-app/MetisKit/Sources/MetisKit/MeetingController.swift` is byte-identical to export in the mechanical diff. | M2-0113 |
| SRC-13 | **PARTIAL** | **OBSERVED:** `src/shared/ipc.ts:1381-1386,1761` defaults `speakerId` to `{ enabled: true, saveVoiceprints: false }`; `src/main/speaker-id.ts:326-327` blocks persisted voiceprint writes unless `canSaveVoiceprints()` is true; `:563-593` snapshots keyed sessions for one-shot later enrollment. | M2-0109 |
| SRC-14 | **REPRODUCES** | **OBSERVED:** `src/renderer/src/components/BrandThinkingOrb.tsx` is byte-identical to export in the mechanical diff. | M2-0093 |
| SRC-15 | **PARTIAL** | **OBSERVED:** `docs/design/ONBOARDING-FLOW.md:12-16` remains a draft, no-skip scene contract; `src/renderer/src/lib/onboarding-hero-video.ts` changed at HEAD. **DERIVED:** asset implementation moved, but no product acceptance run was performed. | M2-0160 |
| SRC-16 | **PARTIAL** | **OBSERVED:** `package.json:27-29` still wires discrete prebuild/postbuild checks; `:78-88` adds additional discrete check commands. **DERIVED:** still no single capability manifest found. | M2-0164 |
| SRC-17 | **REPRODUCES** | **OBSERVED:** `operator/src/index.ts:205` and `:622` still silently fall back to `memoryStore()` when `env.DB` is absent. | M2-0159 |
| SRC-18 | **REPRODUCES** | **OBSERVED:** `scripts/push-both.sh` is byte-identical to export in the mechanical diff. | M2-0053, M2-0168 |
| SRC-19 | **PARTIAL** | **OBSERVED:** `.gitleaks.toml:12-13` uses defaults; `:28-40` keeps a broad path allowlist for tests, QA harness, and docs. | M2-0049 |
| SRC-20 | **REPRODUCES** | **OBSERVED:** `cloudflare-proxy/provision-embedded-key.mjs` is byte-identical to export in the mechanical diff. | M2-0103 |
| SRC-21 | **REPRODUCES** | **OBSERVED:** `docs/AUDIT-LOG.md:50-63` still records the deliberate audit-log erasure stance, including actor email / file basename metadata and operator-only purging. | M2-0105 |
| SRC-22 | **PARTIAL** | **OBSERVED:** `src/shared/mode-recap.ts` and `src/main/mode-skills.ts` are byte-identical to export in the mechanical diff. | M2-0141 |
| SRC-23 | **REPRODUCES** | **OBSERVED:** `docs/verification/mi-5-dust-e2e.md` and `src/main/brain/publish.ts` are byte-identical to export in the mechanical diff. | M2-0128 |
| SRC-24 | **REPRODUCES** | **OBSERVED:** `.github/workflows/build.yml:75-130` now includes operator script contract tests, but `git grep` for `license-server`, `native-app`, `MetisKit`, and `swift` in that workflow returns no hits. | M2-0050, M2-0063 |

### Current F-01..F-20 disposition table

| ID | Disposition at `cfd8b22c` | Current evidence | Owning ticket(s) |
|---|---|---|---|
| F-01 | **PARTIAL** | **OBSERVED:** `electron-builder.yml:131-140` still supports encrypted opt-in embedded Cloudflare proxy key. | M2-0056 |
| F-02 | **PARTIAL** | **OBSERVED:** SRC-04 row: `CommandControl` verifies proposals, but adapters never return `verified`. | M2-0079 |
| F-03 | **PARTIAL** | **OBSERVED:** `operator/src/ai-gateway.ts:113-194` validates the default gateway privacy config; source-only pass did not prove raw socket/child-process egress coverage. | M2-0147 |
| F-04 | **OPEN: not statically closable** | **UNKNOWN:** deployed managed-config roles/revocation/recovery were not accessible from read-only source. | M2-0145 |
| F-05 | **PARTIAL** | **OBSERVED:** no multi-tenant proof was found in the mapped source pass; prior source boundary claim remains tied to `docs/MANTU-IT-REQUEST.md` in round 2. | M2-0145 |
| F-06 | **PARTIAL** | **OBSERVED:** `CommandControl.confirm()` no longer ignores adapter result; `desktop-adapters.ts` never returns `verified`. | M2-0082, M2-0083 |
| F-07 | **REPRODUCES** | **OBSERVED:** `src/shared/desktop-actions.ts:7-14` has no close-app/close-tab action. | M2-0084, M2-0085 |
| F-08 | **REPRODUCES** | **OBSERVED:** `src/main/metis-command-runtime.ts:234-235` discards Jev decision by policy. | M2-0122 |
| F-09 | **OPEN: not statically closable** | **OBSERVED:** `git grep` for `Laya`, `#196`, `#197`, `CURRENT.md`, `acceptance-registry`, and `SOURCE-INDEX` at current HEAD returned no hits. **UNKNOWN:** what "Laya" names outside source. | M2-0124 |
| F-10 | **REPRODUCES** | **OBSERVED:** `operator/src/dashboard.ts:736,1349` still uses capped `listAsks(2000)` / `listAsks(500, now - DAY)`. | M2-0106 |
| F-11 | **FIXED at source** | **OBSERVED:** `operator/src/d1.ts:75-110` keeps device ownership and merges with `COALESCE` / delivered-attempt protection. | M2-0106 |
| F-12 | **REPRODUCES** | **OBSERVED:** `operator/src/index.ts:205,622` still falls back to `memoryStore()` without failing startup. | M2-0106 |
| F-13 | **PARTIAL** | **OBSERVED:** `src/shared/ipc.ts:1381-1386,1761`; `src/main/speaker-id.ts:326-327`. Session labels default on; persisted voiceprints default off. | M2-0106 |
| F-14 | **OPEN: not statically closable** | **OBSERVED:** current source grep found no `#196`/`#197` anchors; native UI acceptance must be supplied by owning lane. | M2-0042, M2-0095, M2-0202 |
| F-15 | **REPRODUCES** | **OBSERVED:** `docs/AUDIT-LOG.md:50-63` preserves audit trail outside in-app erasure. | M2-0112 |
| F-16 | **REPRODUCES** | **OBSERVED:** `git ls-tree -r --name-only origin/m2/integration | rg '(^CURRENT\\.md$|SOURCE-INDEX|acceptance-registry|readiness)'` finds readiness docs/tests only, not root `CURRENT.md`, `SOURCE-INDEX`, or acceptance registry. | M2-0011 |
| F-17 | **REPRODUCES** | **OBSERVED:** round-2 compliance-doc stale-draft evidence remains unresolved by any mapped current-HEAD source evidence in this pass. | M2-0017 |
| F-18 | **REPRODUCES** | **OBSERVED:** `.github/workflows/build.yml` still has no license-server/native Swift terms. | M2-0002 |
| F-19 | **REPRODUCES** | **OBSERVED:** `scripts/push-both.sh` byte-identical to export. | M2-0053, M2-0168 |
| F-20 | **OPEN: not statically closable** | **UNKNOWN:** staging restore/rollback proof requires a deployment exercise; static source still shows `memoryStore()` fallback at `operator/src/index.ts:205,622`. | M2-0103, M2-0159 |

**New-defect filing disposition:** **DERIVED:** no new ledger ticket is filed by this pass because every reproduced/PARTIAL/OPEN gap above maps to existing owner ticket(s), and owner constraints prohibit editing `docs/metis-2.0/ledger/`. `electron-builder.cahe.win.yml` moving to `MISSING_AT_HEAD` is not filed as a new defect here because `electron-builder.yml:131-148` now carries the relevant current packaging evidence for SRC-09/F-01.

LEAD_ACTION: If current CI evidence is required for M2-0013, file the CI artifact record for `cfd8b22c90d69ae23499716493c9391f2ac7af98`; this ticket runner did not file CI evidence records.

LEAD_ACTION: If the program requires the exact command `python3 scripts/trace/diff-export.py`, add or restore that read-only helper path; it is absent in this worktree, so this pass used an equivalent scratch read-only verifier and recorded its output.

LEAD_ACTION: Run/record any required tsc or workflow gates in CI; owner constraint D-28 prohibited this ticket runner from running repository tests, repository scripts, workflows, or the app locally.

---

## 0. Executive summary

1. **SHA-256 of the export re-confirmed OBSERVED.** `shasum -a 256 metis-1.9.5-export.txt` = `efc8af651c1b2abb952d7737d5f3f3d15c4e51057059a07ceb3445c65f5c53f3` — matches §29/R80's cited prefix `efc8af65…` exactly (K05 flagged this as un-re-hashed "a binary I don't have"; CRITIC-CON-11 named this gap directly — it is now closed).
2. **Mechanical diff run for real, keyed on `SOURCE-INDEX.json`'s exact line boundaries, for all 58 paths named by either `FINDINGS.json`'s `evidence[]` arrays (42 unique paths across the 24 findings) or `MAP-COVERAGE.json`'s 19 architecture nodes** (§2 — a strict superset of "the 19 nodes," the round-1 gap this round closes). 41/53 export-present paths are **byte-identical** (whitespace-trimmed) to HEAD; 12 are **CHANGED**; 5 (`App.tsx`, `main/index.ts`, `listen.ts`, `transcripts.ts`, `brain/ingest.ts`) are `NOT_IN_EXPORT` and were confirmed present and read live at HEAD. Three of the 12 CHANGED paths were **wrongly described as "new since the export" in round 1** and are corrected below: `src/main/license.ts` (verifyLease/checkLicenseGrace were already there — the real delta is a machine-id durability/locking subsystem and HTTPS enforcement, §4/SRC-02), the export's own `mode-skills.ts`/`speaker-id-off-switch.test.ts` sections are **IDENTICAL**, not new (§4/SRC-13, SRC-22), and `onboarding-hero-video.ts`/`docs/AUDIT-LOG.md`/`package.json`'s prebuild-postbuild chain are likewise **IDENTICAL**, not post-export additions (§4/SRC-15, SRC-16, SRC-21).
3. **SRC-04 is re-anchored with a concrete, currently-live residual defect, with corrected line anchors** (§3): `CommandControl.confirm()` (`src/main/command-control.ts:85-110`, outcome gate at `:104-106`) implements exactly the completion-verification boundary SRC-04/F-06 demanded. But **no desktop adapter (`src/main/desktop-adapters.ts`) ever returns `'verified'`** — `okResult()`'s default and all 14 call sites still pass `'unknown'` (grepped for the literal `'verified'`: zero hits in the file, even though the file itself grew from 215 to 268 lines for an unrelated reason — a shell-injection-hardening pass, confirmed by diff, not adapter-verification work). Round 1 conflated the fire-and-forget call at `metis-command-runtime.ts:82` with the actually-discarded value; the real discard is `void result` at `:235`, under the "Advisory only" comment at `:234` — corrected here. Round 1 also cited `command-control.ts:88-99` in §5, which conflicts with §3's own `:85-110`/`:104-106` — one anchor now, used everywhere.
4. **All 11 previously-UNKNOWN SRC findings are re-verified with file:line evidence, and several round-1 "improved since the export" claims are retracted** (§4): SRC-13's `deleteProfile` and its dedicated `speaker-id-off-switch.test.ts` were **already** in the export (`speaker-id.ts` is byte-identical); worse, `src/shared/ipc.ts:1349-1350,1725` shows `speakerId` **defaults to `{ enabled: true }`** — the persistent-voiceprint pass SRC-13 flagged runs by default, not on opt-in, directly against `required_change`'s "disable unapproved persistent enrollment." SRC-02's Ed25519 lease functions (`verifyLease`, `checkLicenseGrace`, `license-lease-key.ts`) were also already in the export; the real, newly-added license.ts material is a machine-id durability/repair-lock subsystem and mandatory-HTTPS enforcement. SRC-15's local mp4 asset and SRC-21's `docs/AUDIT-LOG.md` "Erasure stance" section are byte-identical to the export, not later hardening. SRC-22's `mode-skills.ts` is byte-identical to the export too — and the export's *own* `source_observation` already says "the source already defines nine mode-specific recap layouts and locked mode skills," so "trending FIXED" over-claimed forward motion that the export text itself already credited. None of the 11 are FIXED outright; SRC-14/19/21 remain the clearest owner-decision candidates (each a documented trade-off, not a silent gap).
5. **The full SRC-01…24 table (§5) has three corrected dispositions.** SRC-01 moves from "N/A / self-resolving" to **PARTIAL**: the checkout identity (`70de3c30`) and a real present/missing manifest now exist, and CI run `36269153417` is green on that exact commit — but that same run is the one SRC-24 shows excludes `license-server` and native Swift tests, so "baseline checks on the complete tree" is not fully met. SRC-10 moves from a flat REPRODUCES to **PARTIAL**: `operator/src/d1.ts:76-110`'s `ownedAskUpsertSql` and `operator/src/store.ts:139`'s `mergeOwnedAsk` now do a provenance-aware merge (`COALESCE`, `MIN(ts)`, delivered-attempt protection) that keeps the device-ownership `WHERE` (`d1.ts:109`) — F-11's late-null-overwrite defect is fixed at the source level (runtime proof still owed by M2-0106) — while `dashboard.ts:736,1349`'s capped `listAsks(2000)`/`(500)` aggregates are unchanged, so F-10 still REPRODUCES. SRC-12 moves from "Likely reproduces" to **REPRODUCES**: `MeetingController.swift` is byte-identical to the export.
6. **F-01…F-20 all now carry a real disposition** (§6) instead of round 1's `UNKNOWN`/`Bears on SRC-x` placeholders. Three were closable this pass with fresh HEAD evidence the SRC rows don't cite: **F-03** (egress) is **PARTIAL** — a real, tested `egressAllowlist` policy (`docs/NETWORK-EGRESS.md`, `src/main/net/egress-guard.ts` + two test files) exists, with the gap (raw `https.request`, child processes) stated in the same doc rather than hidden. **F-05** (multi-customer scope) is **PARTIAL→FIXED-leaning**: `docs/MANTU-IT-REQUEST.md:119` states the boundary plainly ("Restricted to the Mantu tenant (single-tenant)"), which is exactly what `required_change` asked for. **F-17** (stale assessments) **REPRODUCES**: the compliance data-flow/DPIA docs are dated 2026-07-11 and still marked "DRAFT — for DPO review, not yet adopted" more than two months later, with no commit-SHA or deployment scoping in the document itself — the pattern F-17 names. F-04 and F-09 are corrected to **OPEN: not statically closable**, each naming the specific evidence a static pass cannot produce (F-09's search is detailed above). F-14 is likewise OPEN — no `#196`/`#197` reference exists anywhere in the current tree. F-15/18/19/20 get an explicit disposition tied to their SRC evidence instead of the vague "Bears on" phrasing.
7. **No new defect requires a new ledger ticket.** Every gap this pass reproduced already has an owning TODO/IN_PROGRESS ticket (§6, §8); the SRC-04 residual sharpens M2-0082/83/84/85's acceptance criteria but needs no ticket of its own.

---

## 1. Repo + export grounding (OBSERVED)

| Check | Result |
|---|---|
| `origin/m2/integration` HEAD | `70de3c303a047879afd8651a78b41c0ce85dcc3c` |
| Export SHA-256 | `efc8af651c1b2abb952d7737d5f3f3d15c4e51057059a07ceb3445c65f5c53f3` — matches §29/R80's `efc8af65…` prefix. Re-hashed directly this pass (`shasum -a 256` on the kit's own copy); CRITIC-CON-11 is closed. |
| `2bf21f1c` (K05's HEAD) reachable from `origin/m2/integration`? | **No.** `git log 2bf21f1c..origin/m2/integration` walks the entire unrelated history back to the initial commit (50 unrelated "AskToto CLI" / "Enterprise hardening" commits) — confirms the owner's 2026-09-26 history-rewrite note; `2bf21f1c` is not an ancestor post-rewrite. All comparisons below are direct reads of file content at each ref, never a `git diff` across that range. |
| `source-review/SOURCE-INDEX.json`, `CURRENT.md`, an acceptance-registry JSON | **Still not found** at `origin/m2/integration` HEAD (`git ls-tree -r` — searched for `CURRENT.md`, `SOURCE-INDEX`, `acceptance-registry`, `readiness`; only unrelated `docs/qa/2026-09-12-release-readiness.md` and `*-readiness.ts` files matched). K05's §5 blockers #1/#2 are unresolved at current HEAD, not merely unresolved at the older HEAD it read. |
| Currently-green CI on the reviewed HEAD | Run `36269153417`, `head_sha 70de3c303a047879afd8651a78b41c0ce85dcc3c`, `conclusion: success` (`gh api repos/mysticalsin/AskToto-Mantu/actions/runs/36269153417`) — the same commit every anchor in this document is read against. Baseline run `36267674617` ran on a **different** commit, `56677e7df2b3106f23bee7491d1e4c9bfa9035fb`; the two are not the same checkout (compare, not conflate). |

---

## 2. Mechanical diff — export vs. HEAD, all 58 paths (`FINDINGS.json` evidence ∪ `MAP-COVERAGE.json` nodes)

**Method (read-only, ran for real this pass; script + full output in the Appendix):** `SOURCE-INDEX.json`'s `content_start_line`/`content_end_line` gives the exact 1-based line range of each path's `FILE:` section inside `metis-1.9.5-export.txt` — that is the section boundary, not a re-scan. For each of the 58 paths named by `FINDINGS.json`'s 24 findings' `evidence[]` arrays (42 unique paths) union `MAP-COVERAGE.json`'s 19 file-backed nodes (3 paths overlap both sets), the script either (a) slices that exact range out of the export and diffs it against `git show origin/m2/integration:<path>` with `difflib.SequenceMatcher` (both sides trailing-whitespace-trimmed per line), or (b) for a path with no `SOURCE-INDEX` section, confirms the file is readable at HEAD and reports its line count as `NOT_IN_EXPORT`.

| Path | Cited by | In export? | Status at HEAD | Detail |
|---|---|---|---|---|
| `.github/workflows/build.yml` | SRC-24 | Yes | **CHANGED** | 447→449 lines; the only change is one new "Install Playwright Chromium for Operator layout tests" step inside the `operator` job — no `swift`/`license-server` job added. |
| `.gitleaks.toml` | SRC-19 | Yes | IDENTICAL | — |
| `DESIGN.md` | SRC-14/15/22 | Yes | IDENTICAL | — |
| `THIRD_PARTY_NOTICES.md` | SRC-16 | Yes | IDENTICAL | — |
| `cloudflare-proxy/provision-embedded-key.mjs` | SRC-20 | Yes | IDENTICAL | — |
| `cloudflare-proxy/src/index.ts` | SRC-08 | Yes | IDENTICAL | — |
| `docs/AUDIT-LOG.md` | SRC-21 | Yes | IDENTICAL | Includes the "Erasure stance" section — not added since the export (round-1 correction). |
| `docs/CLOUDFLARE.md` | SRC-09 | Yes | IDENTICAL | — |
| `docs/ENTERPRISE-DEPLOY-WINDOWS.md` | SRC-16 | Yes | IDENTICAL | — |
| `docs/ENTERPRISE_RELEASE.md` | SRC-18 | Yes | IDENTICAL | — |
| `docs/design/ONBOARDING-FLOW.md` | SRC-15 | Yes | IDENTICAL | Line 14 ("No Skip.") unchanged. |
| `docs/verification/mi-5-dust-e2e.md` | SRC-23 | Yes | IDENTICAL | Still an unchecked `[ ]` manual checklist. |
| `electron-builder.cahe.win.yml` | SRC-09 | Yes | IDENTICAL | — |
| `electron-builder.yml` | SRC-09/16/18 | Yes | IDENTICAL | — |
| `intelligence/src/App.tsx` | (MAP node) | Yes | IDENTICAL | — |
| `intelligence/src/lib/brainAdapter.ts` | (MAP node) | Yes | IDENTICAL | — |
| `license-server/lib/app.mjs` | (MAP node) | Yes | IDENTICAL | — |
| `license-server/lib/store.mjs` | SRC-02/17 | Yes | IDENTICAL | — |
| `license-server/package.json` | SRC-24 | Yes | IDENTICAL | — |
| `native-app/App/Store/PersistedModels.swift` | SRC-11 | Yes | IDENTICAL | `try? context.save()` at `:59`, decode-to-empty at `:36`, unchanged. |
| `native-app/MetisKit/Package.swift` | SRC-24 | Yes | IDENTICAL | — |
| `native-app/MetisKit/Sources/MetisKit/MeetingController.swift` | SRC-12 | Yes | IDENTICAL | Byte-identical — SRC-12's disposition is **REPRODUCES**, not "likely." |
| `operator/client/main.ts` | (MAP node) | Yes | IDENTICAL | — |
| `operator/src/ai-gateway.ts` | SRC-08 | Yes | IDENTICAL | — |
| `operator/src/d1.ts` | SRC-10/17 | Yes | **CHANGED** | 937→1010 lines; real unified diff: `ownedAskUpsertSql` (`:76-110`) now does a provenance-aware `COALESCE`/`MIN(ts)`/delivered-attempt merge instead of a flat overwrite, plus a new `recordPulseSession` batched-transaction helper. Fixes F-11's pattern; the `d1Store`/`memoryStore()` fallback SRC-17 names is untouched. |
| `operator/src/dashboard.ts` | SRC-10 | Yes | IDENTICAL | `listAsks(2000)` (`:736`) / `listAsks(500, …)` (`:1349`) caps unchanged. |
| `operator/src/index.ts` | (MAP node) | Yes | **CHANGED** | 628→632 lines; wires the new `recordPulseSession`/activity-id hashing into the request handlers. `routeRequest`'s `opts.store ?? (env.DB ? d1Store(env.DB) : memoryStore())` (`:206`) and `scheduled`'s `env.DB ? d1Store(env.DB) : memoryStore()` (`:623`) are **not verbatim identical text** (no `opts.store` at `:623` — `scheduled` takes no `opts`), but both reach the same silent-`memoryStore()`-on-unbound-`DB` fallback SRC-17 names. |
| `operator/src/store.ts` | SRC-02/17 | Yes | **CHANGED** | 840→890 lines; adds `mergeOwnedAsk` (`:139`) — the memory-store counterpart of `d1.ts`'s merge fix, explicitly retaining `id`/`device_id` from the owning row. `memoryStore()` itself and the `OperatorStore` interface (SRC-02/17's concern) are unchanged. |
| `package.json` | SRC-01/14/16/24 | Yes | **CHANGED** | 137→137 lines; the **only** diff is `"version": "1.9.5"` → `"1.9.6"`. The `prebuild`/`postbuild`/`check:*` script chain (`:27`, `:29`) SRC-16 cites is byte-identical — it was already in the export, not added since. |
| `scripts/push-both.sh` | SRC-18 | Yes | IDENTICAL | — |
| `src/main/asktoto-shot.ts` | (MAP node) | Yes | IDENTICAL | — |
| `src/main/brain/ingest.ts` | (MAP node) | No | `NOT_IN_EXPORT` | Present, 2,817 lines. |
| `src/main/brain/publish.ts` | SRC-23 | Yes | IDENTICAL | Grepped for `revision`/`readback`/`conflict`/`principal`/`audience`: zero matches, at either ref. |
| `src/main/brain/store.ts` | (MAP node) | Yes | IDENTICAL | — |
| `src/main/cloud-stt/credentials.ts` | SRC-07 | Yes | IDENTICAL | — |
| `src/main/desktop-adapters.ts` | SRC-05 | Yes | **CHANGED** | 215→268 lines; the entire delta is a shell-injection-hardening pass (fixed literal command/URL/AppleScript allowlist, `explorer.exe` instead of `cmd /c start`, a non-blocking Notepad `spawn`). `okResult()`'s `outcome = 'unknown'` default (`:88`) and its 14 call sites (unchanged locations) are untouched; grepped for the literal `'verified'`: zero hits, both before and after. |
| `src/main/index.ts` | (MAP node) | No | `NOT_IN_EXPORT` | Present, 9,518 lines. |
| `src/main/license-lease-key.ts` | SRC-02 | Yes | IDENTICAL | `embeddedLicenseLeasePubkeyAvailable()` (`:81`) was already in the export, already unused outside its own file/tests — not a newer, still-unwired addition. |
| `src/main/license.ts` | SRC-02 | Yes | **CHANGED** | 351→459 lines (net +108). `verifyLease`/`checkLicenseGrace` (export lines 209/224 of its own section) were **already there**. The real delta: a machine-id durability/repair-lock subsystem (`cachedMachineId`, `reclaimStaleRepairLock`, `acquireRepairLock`, `repairEmptyMachineId`, `machineIdentity`, `getDurableMachineId`) and mandatory-HTTPS enforcement (`isSecureLicenseServerUrl`/`normalizeLicenseServerUrl`, `redirect: 'error'` on both `postJson` and `fetchLicenseConfig`). |
| `src/main/llm.ts` | (MAP node) | Yes | IDENTICAL | — |
| `src/main/metis-command-runtime.test.ts` | SRC-04 | Yes | **CHANGED** | 148→89 lines; rewritten to match the proposal-only runtime (no `execute` call from this file any more) — consistent with, not contradicting, §3. |
| `src/main/metis-command-runtime.ts` | SRC-03/04 | Yes | **CHANGED** | 201→241 lines. See §3 for the corrected line anchors. |
| `src/main/mode-skills.ts` | SRC-22 | Yes | IDENTICAL | Byte-identical to the export — not new machinery (round-1 correction). |
| `src/main/operator-ingest.ts` | (MAP node) | Yes | **CHANGED** | 506→513 lines; not traced further this pass (not cited by any kit_refs finding). |
| `src/main/parakeet.ts` | (MAP node) | Yes | IDENTICAL | — |
| `src/main/screen-capture.ts` | SRC-21 (MAP node too) | Yes | IDENTICAL | — |
| `src/main/screen-preprocess.ts` | SRC-21 | Yes | IDENTICAL | `deps.audit?.('screen.preprocess.describe', …)` at `:323-327`, logging only `windowId`/`chars`/`mode`, unchanged. |
| `src/main/speaker-id.ts` | SRC-13 | Yes | IDENTICAL | `deleteProfile` and the auto-enrollment flywheel were already in the export — not added since (round-1 correction). |
| `src/main/transcripts.ts` | (MAP node) | No | `NOT_IN_EXPORT` | Present, 1,272 lines. |
| `src/preload/index.ts` | (MAP node) | Yes | **CHANGED** | 553→563 lines; not traced further this pass (not cited by any kit_refs finding). |
| `src/renderer/src/App.tsx` | (MAP node) | No | `NOT_IN_EXPORT` | Present, 4,277 lines. |
| `src/renderer/src/components/BrandThinkingOrb.tsx` | SRC-14 | Yes | IDENTICAL | `:5-7`'s "Always animates" comment unchanged. |
| `src/renderer/src/lib/listen.ts` | (MAP node) | No | `NOT_IN_EXPORT` | Present, 3,153 lines. |
| `src/renderer/src/lib/onboarding-hero-video.ts` | SRC-15 | Yes | IDENTICAL | The local-Vite-asset packaging (`:7`, `localHeroUrl`) was already in the export — not resolved since (round-1 correction). |
| `src/shared/desktop-actions.ts` | SRC-05 | Yes | IDENTICAL | 87 lines; no close-app/close-tab action type is defined, at either ref. |
| `src/shared/metis-wake.ts` | SRC-06 | Yes | IDENTICAL | — |
| `src/shared/mode-recap.ts` | SRC-22 | Yes | IDENTICAL | All nine layouts, at either ref. |
| `vitest.config.ts` | SRC-24 | Yes | **CHANGED** | 71→121 lines; not traced further this pass (not cited by any kit_refs finding; unrelated to the license-server/Swift test-coverage gap SRC-24 names). |

**Totals:** 41 IDENTICAL, 12 CHANGED, 5 NOT_IN_EXPORT (all 5 confirmed present and read live at HEAD) — 58 paths, zero missing. **Reading this table (DERIVED):** the round-1 document's narrative repeatedly framed byte-identical export sections as things that had "since been added" or "now exist" — every such claim in §4/§6 below is corrected against this table. Real, substantive drift (not cosmetic) exists in exactly three places relevant to this ticket's kit_refs: `license.ts` (machine-id durability + HTTPS), `d1.ts`/`store.ts` (the ownership-merge fix), and `desktop-adapters.ts` (shell-injection hardening, unrelated to the verified-outcome gap). Everything else cited by a kit_refs finding is either untouched since 1.9.5 or was never in the export to begin with.

---

## 3. SRC-04 re-anchored (ticket acceptance criterion 2)

**Original claim (source-export, FINDINGS.json):** `flushPending` in `src/main/metis-command-runtime.ts` awaits `executeDesktopAction` but ignores the returned `ok`/`outcome` before `mark_committed`.

**K05's finding at `2bf21f1c`:** the `flushPending`/`mark_committed` shape is gone from `metis-command-runtime.ts` entirely (grepped, zero hits); the file's own docstring says execution is "deliberately deferred... this runtime never calls it"; `executeDesktopAction` is wired in `index.ts` instead. K05 marked this "relocated — cannot confirm or refute" and named `index.ts`'s command-confirmation path as the next locus (cross-ref CRITIC-CON-9, CRITIC-INV-8).

**This pass, at `origin/m2/integration` HEAD (OBSERVED, corrected line anchors):**

- `src/main/metis-command-runtime.ts` (241 lines) still only produces a *proposal* (`ingestTranscript` → `reduceMetisCommandSession` → `state.proposal`), never executes anything. **Two distinct discards exist in this file, and round 1 conflated them:**
  - `:82` — `void this.maybeDisambiguate(next, sessionId, utteranceRevision, contextHash)` is a fire-and-forget **call** to the whole async method (its own return promise is discarded, which is normal for a background task the caller doesn't block on).
  - `:234-235` — **inside** that method, after the remote decision actually resolves (`:216`'s `await decideActionDisambiguate(...)`), the comment `// Advisory only. A remote response cannot create, alter, or execute a proposal.` sits directly above `void result` at `:235` — **this** is the discarded decision F-08 names, not `:82`. The comment documents this specific line as deliberate policy.
- Execution genuinely lives in **`src/main/command-control.ts`**: `CommandControl.confirm()` spans **`:85-110`** —
  ```ts
  async confirm(                                                     // :85
    input: CommandControlProposal & { webContentsId: number }
  ): Promise<{ ok: true; outcome: ... } | { ok: false; reason: ... }> {
    const proposal = this.validate(input)                            // :88
    ...
    try {
      const result = await this.deps.execute(proposal.request)       // :98
      if (result.id !== proposal.request.id) { ...; return { ok: false, reason: 'adapter_failed' } }  // :99-101
      this.audit('command.confirmed', { actionId: proposal.request.id, outcome: result.outcome })      // :103
      if (result.ok && result.outcome === 'verified') return { ok: true, outcome: result.outcome }     // :104
      if (result.ok && result.outcome === 'unknown') return { ok: false, reason: 'outcome_unverified' } // :105
      return { ok: false, reason: 'adapter_failed' }                  // :106
    } catch {                                                         // :107
      this.audit('command.confirmed', { actionId: proposal.request.id, outcome: 'failed' })
      return { ok: false, reason: 'adapter_failed' }                  // :109
    }
  }                                                                    // :110
  ```
  This is a real fix for the *original* SRC-04 defect (a result silently discarded before commit): the outcome gate is `:104-106`, and it is tested — `src/main/command-control.test.ts` asserts `{ ok: true, outcome: 'verified' }` (`:39`, when the adapter resolves `verified`) and `{ ok: false, reason: 'outcome_unverified' }` (`:56`, when it resolves `unknown`).
- **The residual gap, confirmed live, exact line anchors unchanged since round 1 despite the file's growth:** `src/main/desktop-adapters.ts:88`'s `okResult()` defaults its `outcome` parameter to `'unknown'`, and **all 14 of its call sites** (`:182,189,195,201,204,209,212,222,234,237,244,255,259,264`) pass `'unknown'` explicitly — grepped for `'verified'` as a literal in the file: **zero hits**, at either the export or HEAD ref (§2). The file grew from 215 to 268 lines for an unrelated reason — a shell-injection-hardening pass (fixed literal command/URL/AppleScript allowlist, `explorer.exe` instead of `cmd /c start`) — not adapter-outcome work. So `CommandControl.confirm()`'s `result.outcome === 'unknown'` branch is the *only* branch any real adapter call can ever reach; `'verified'` is unreachable code on both platforms today.
- **This is live, not scaffolding:** `src/main/index.ts:987-988` constructs `commandControl = new CommandControl({ execute: executeDesktopAction, ... })`; `index.ts:4680` (`ipcMain.handle(IPC.metisCommandConfirm, ...)`) calls `commandControl.confirm(...)` directly from a renderer IPC channel; `src/main/metis-command-register.ts:43` calls `commandControl.propose(...)` from the real `MetisCommandRuntime`'s `onState` callback, i.e. from an actual parsed voice command, not a test harness.

**Disposition: RELOCATED + PARTIAL.** SRC-04's *originally described* bug (silently discarded result) is fixed in the new location, with a passing behavioral test proving both branches. The *underlying requirement* ("adapters returning failed/unsupported/unknown/cancelled never produce verified success" — SRC-04's own `exit_evidence`) is technically satisfied (unknown never becomes verified) but at the cost of **no adapter can currently produce a positive user-facing outcome at all**: every confirmed desktop command today resolves to `outcome_unverified` (or `adapter_failed` on a genuine OS error) — functionally indistinguishable from failure to the end user, even when the OS action visibly succeeded. **No new ticket needed** — M2-0082 ("typed action results and independent postcondition verifier"), M2-0083 ("wire the command path... verified adapter result"), M2-0084/M2-0085 (mac/Windows adapters "with readback") already scope exactly this. This pass's contribution is the concrete, current-HEAD confirmation that the gap is real, live, and user-visible today.

**F-06 cross-reference:** F-06 ("Ignored adapter result... unknown/failure never becomes verified") maps here. Its "ignored result" half is fixed (§3, with a passing test now cited); its "never becomes verified" half remains true for a different reason (no adapter tries) than the original one (result was discarded) — F-06's §6 disposition reflects this nuance rather than a flat OPEN/CLOSED call.

---

## 4. The 11 previously-UNKNOWN SRC findings — re-verified at HEAD

Each row: `source_observation`/`required_change` from `source-review/FINDINGS.json` (kit, read-only) vs. what's actually at `origin/m2/integration` HEAD today, cross-checked against §2's byte-for-byte export comparison.

### SRC-02 — Separate entitlement authority from telemetry and legacy licensing (P0 ARCHITECTURE_GAP)

**OBSERVED at HEAD:** `src/main/license.ts`'s own header states plainly (and `docs/qa/BUG-LEDGER.md:2209` independently documents the same thing) that device licensing is **compiled off** in the shipped app — `src/renderer/src/App.tsx:311` `const LICENSE_ENFORCEMENT = false`, `src/renderer/src/components/Settings.tsx:201` `const LICENSE_UI_ENABLED: boolean = false` — so `<LicenseGate>` never renders and the 12h heartbeat can never fire. `license-server/lib/license-gate.mjs:11-12` independently enforces the pair can't drift server-side. **Correction from round 1:** the Ed25519 offline-lease system (`verifyLease`, `checkLicenseGrace` in `license.ts`; `license-lease-key.ts` in full) was **not** added since the export — `license-lease-key.ts` is byte-identical (§2) and the export's own `license.ts` section already defines `verifyLease` (its line 209) and `checkLicenseGrace` (its line 224). What **is** genuinely new since the export (§2's real diff, net +108 lines) is a machine-id durability/repair-lock subsystem (`machineIdentity`, `getDurableMachineId`, `acquireRepairLock`/`reclaimStaleRepairLock`) and mandatory-HTTPS enforcement on the license-server URL (`isSecureLicenseServerUrl`, `redirect: 'error'` on every outbound call). `embeddedLicenseLeasePubkeyAvailable()` (`license-lease-key.ts:81`, "is this a real production key or the dev placeholder") is **also** unchanged from the export — it was already unused outside its own file/tests then, and still is now (grepped the whole tree: zero external call sites) — so "production rejects development trust roots" ( `required_change`'s explicit demand) has never been enforced by any gate.
**Disposition: PARTIAL.** The "conflicting gates" half is resolved by making legacy licensing consistently, verifiably, and honestly *off* rather than half-wired. The "one issuer/entitlement authority, production rejects dev trust roots" half is unresolved and was never touched by this diff: `operator/src/store.ts`'s `IssuedLicenseRow`/seat records and the legacy JSON `license-server/lib/store.mjs` still coexist with no reconciliation, and the dev-key-detection function still gates nothing.

### SRC-13 — Speaker labels are not biometric identity or action authority (P0 SOURCE_POLICY_CONFLICT)

**OBSERVED at HEAD:** `src/main/speaker-id.ts` is **byte-identical to the export** (§2) — the persistent voiceprint store (`userData/voiceprints.json`) and Teams-VTT auto-enrollment flywheel (`autoEnrollFromLabeledWindows`, `:191-197`), the `deleteProfile(name)` API (`:199`, wired `:491`), and the dedicated off-switch test file `src/main/speaker-id-off-switch.test.ts` (also byte-identical to its export section, §2) were **all already present in the 1.9.5 export** — none of this is new since the export, contrary to round 1's framing. **The material new fact this pass adds:** `src/shared/ipc.ts:1349-1350` (the Zod schema default) and `:1725` (the `DEFAULT_SETTINGS` object) both show `speakerId` **defaults to `{ enabled: true }`** — the file's own adjacent comment explains this was made on-by-default 2026-08-21 because "the embedding model ships in every build... the default costs nothing where it cannot work." That is a documented product decision, but it is the opposite of `required_change`'s explicit "Disable unapproved persistent enrollment/voiceprint retention... keep default attribution session-local and uncertain." No callsite anywhere in `src/**` gates a *desktop command* on a speaker match (grepped `speaker` near `commandControl`/`executeDesktopAction`: no hits) — the "no speaker score authenticates desktop commands" half of the requirement holds.
**Disposition: PARTIAL — REPRODUCES for the default-on retention, holds for command-authority separation.** The off-switch and delete path are real (and pre-existing, not new), but the *default* is on, not session-local — the opposite of what `required_change` asks for. The command-authority half is unaffected and continues to hold.

### SRC-14 — Use the real solving motion without defeating accessibility (P1 SOURCE_POLICY_CONFLICT)

**OBSERVED at HEAD:** `src/renderer/src/components/BrandThinkingOrb.tsx:5-7`, verbatim, byte-identical to the export (§2): *"Always animates: Windows Show animations off maps to OS reduce media query and the stock ThinkingOrb freezes to one frame — that killed the product identity. Still pauses when the document is hidden or the host is off-screen."*
**Disposition: REPRODUCES (deliberate, documented).** The OS reduced-motion signal is explicitly, knowingly overridden by product decision, unchanged since the export; hidden/offscreen pausing is honored. This is an un-adjudicated conflict between an accessibility requirement and a stated product-identity decision, flagged for an explicit owner disposition, not something a code fix alone can "close."

### SRC-15 — Reconcile onboarding contract and recover the real media lineage (P1 DOCUMENT_AND_MIGRATION)

**OBSERVED at HEAD:** `src/renderer/src/lib/onboarding-hero-video.ts` is **byte-identical to the export** (§2) — the April-29 "lady looking at space" clip was **already** a packaged local Vite asset (`localHeroUrl` from `../assets/onboarding-hero-lady-planet.mp4`, `:7`) at the time of the 1.9.5 export, with the CloudFront URL kept only as a documented mirror (`:10-12`), not the runtime default. This resolves nothing "since" the export — it was already resolved when the export was taken; round 1's framing of it as new is corrected. `docs/design/ONBOARDING-FLOW.md:14` still says, verbatim, byte-identical to the export, **"No Skip."**
**Disposition: PARTIAL.** The media-lineage/asset-availability concern SRC-15 raised turns out to have already been resolved as of the export snapshot — a real, licensed, locally-bundled asset, never a placeholder. The "allow reduced/static educational presentation" half of `required_change` is still in direct, unchanged tension with the explicit "No Skip" policy in the same document.

### SRC-16 — Profile-aware package gates, OS descriptions and docs must change together (P0 SOURCE_POLICY_CONFLICT)

**OBSERVED at HEAD:** no single "capability manifest" artifact exists (grepped for `capability-manifest`/`CAPABILITY_MANIFEST`: zero hits). What exists is a chain of build-time enforcement scripts wired into `package.json`'s `prebuild`/`postbuild` (`:27`, `:29`) — `check-offline-package.mjs`, `check-built-offline.mjs`, `check-no-dynamic-import.mjs`, `ensure-intelligence-bundle.mjs`. **Correction from round 1:** `package.json`'s only diff from the export is the version bump `1.9.5` → `1.9.6` (§2) — this entire check chain was **already** wired in the export's `package.json`, not added since.
**Disposition: PARTIAL.** Real automated gating exists, unchanged since the export — a set of discrete point-checks, not the single declared "capability catalog" `required_change` calls for; a profile-aware, single-source manifest driving install/runtime-readiness/optional-pack decisions was not found, at either ref.

### SRC-17 — A development-store seam is not production durability (P0 ARCHITECTURE_GAP)

**OBSERVED at HEAD (still the strongest "fully open" finding in this pass):** `operator/src/index.ts:206` (`routeRequest`) reads `opts.store ?? (env.DB ? d1Store(env.DB) : memoryStore())`; `:623` (the `scheduled` cron handler, which takes no `opts`) reads `env.DB ? d1Store(env.DB) : memoryStore()`. **These two lines are not verbatim-identical text** (no `opts.store` at `:623`) — a correction from round 1's "identically... in both" phrasing — but they reach the identical silent fallback: **if the Worker's `DB` binding is ever unbound**, every request or cron tick is served from a fresh, per-invocation, non-persistent `memoryStore()`, with no error, no `/health` field keyed to it, no startup check. `operator/src/store.ts:490`'s `memoryStore()` is the same factory 38 `operator/` test files construct directly — there is no code-level distinction between "the test double" and "what production falls back to."
**Disposition: REPRODUCES, essentially verbatim from the export.** `required_change`'s core demand — "Production must reject placeholder/memory stores and wrong environment bindings" — has no implementation at HEAD. (§5's SRC-10 row, which shares `d1.ts`/`store.ts` with this finding, is corrected to PARTIAL for an unrelated reason — the ownership-merge fix — that does not touch this fallback.)

### SRC-18 — Mirror-safe release delivery is a first-class gate (P0 OPERATIONAL_DEPENDENCY)

**OBSERVED at HEAD:** `scripts/push-both.sh` (18 lines, byte-identical to the export) still just loops `git push $remote "$@"` over `github`/`origin` and reports per-remote OK/FAIL to stdout — no same-commit verification across remotes, no post-sync readback, no protected-tag check.
**Disposition: REPRODUCES.** Exactly the gap SRC-18 named, unchanged since the export; the *live* mirror cadence/authority itself remains outside what a source-review pass can close.

### SRC-21 — Capture privacy copy must cover screenshots, titles, URLs and helpers too (P0 SOURCE_POLICY_CONFLICT)

**OBSERVED at HEAD:** `docs/AUDIT-LOG.md` is **byte-identical to the export** (§2) — the real tamper-evidence (hash-chained records, `scripts/verify-audit-log.mjs`), the documented retention policy, and the explicit **"Erasure stance — decided, not accidental"** section (`:42-51`) were **already** in the 1.9.5 export, not grown since. That section states outright: *"Records are metadata-only; the identifying payload is limited to the actor email and file basenames derived from meeting titles... This stance is recorded here so a DPO reviews a decision, not an omission."* `screen-preprocess.ts:323-327`'s audit call (also byte-identical) logs only `windowId`/`chars`/`mode` — no title, no URL, no OCR text.
**Disposition: REPRODUCES (deliberate, owner-flagged for DPO review), unchanged since the export.** The underlying practice (meeting-title-derived file basenames in metadata logs) has not changed, and — a round-1 correction — was already documented as a conscious, DPO-facing decision at export time, not something that became documented afterward.

### SRC-22 — Preserve tailored recaps and human edits when moving skills server-side (P1 PRESERVE_AND_EXTEND)

**OBSERVED at HEAD:** `src/shared/mode-recap.ts` and `src/main/mode-skills.ts` (`ModeSkillIntegrityError` gates at `:32,35,38,42,44,48,51,130,146,158,172,175,179,182,185`; `lock.skills[id] = { path, version, sha256 }` at `:189`) are **both byte-identical to the export** (§2). This is not new machinery added since the export — the export's own `source_observation` for this finding already says, verbatim: *"The source already defines nine mode-specific recap layouts and locked mode skills."* `src/shared/ipc.ts:332-342`'s `CONVERSATION_MODES` still defines all nine built-in modes, unchanged, at either ref.
**Disposition: PARTIAL, unchanged since the export.** The regression risk SRC-22 warned about (a generic cloud summary silently replacing the nine tailored layouts, or the version/integrity locking regressing) did not happen — but that was already true, and already stated as true, in the finding's own source text at export time, so "trending FIXED" over-claimed forward motion this pass did not observe. This pass did not trace whether a regenerate/retry path can overwrite a human-accepted correction (the specific runtime guarantee `required_change` asks for); that remains a narrower, still-open check for whichever lane owns the recap-edit runtime path.

### SRC-23 — Dust connector checklists do not prove canonical read/write (P0 IMPLEMENTATION_LIMIT)

**OBSERVED at HEAD:** `docs/verification/mi-5-dust-e2e.md` is byte-identical to the export — still an **unchecked** manual checklist (`[ ]` boxes throughout, `:11,14,16,24,27,31,32,35,49,…`), and its own text says so: *"...is this checklist. It is Tony's to run, not automatable in CI."* (`:7`). `src/main/brain/publish.ts` (990 lines, byte-identical) — grepped for `revision`/`readback`/`conflict`/`principal`/`audience`: no matches, at either ref — publishes a plaintext markdown mirror for Dust's OneDrive connector; there is no canonical read/write mutation interface.
**Disposition: REPRODUCES, verbatim, unchanged since the export.** No canonical Dust read/write path exists; the checklist's own required evidence ("actual two-principal Dust read/write, conflict, regenerate, correction, revoke, deletion") remains unexecuted.

### SRC-24 — Every workspace needs a real test/build/release coverage owner (P0 EVIDENCE_GAP)

**OBSERVED at HEAD:** `.github/workflows/build.yml`'s only change from the export is one new Playwright-install step inside the `operator` job (§2) — grepped for `license-server`, `native-app`, `MetisKit`, `swift`: **zero hits**, at either ref, across all five jobs (`quality:22`, `operator:58`, `security:115`, `build-macos:211`, `build-windows:360`). The currently-green run on the reviewed HEAD, `36269153417` (`70de3c30`, confirmed via `gh api repos/mysticalsin/AskToto-Mantu/actions/runs/36269153417`), runs exactly the same 4 real jobs as the baseline run: **Quality checks (ubuntu-latest)**, **Quality checks (windows-latest)**, **Operator Worker (build + typecheck + tests)**, **Security & supply chain** — plus **macOS package**/**Windows package**, both `skipped`. `license-server/package.json:13` has its own `"test": "node --test"` script (byte-identical to the export); `native-app/MetisKit` has its own Swift package with tests (`Package.swift`, byte-identical) — **neither is invoked anywhere in CI**, at either ref.
**Disposition: REPRODUCES, unchanged since the export.** A currently-green CI run on the exact reviewed HEAD exists (`36269153417` on `70de3c30`) — real evidence the root/Electron and Operator suites pass on both OSes — but it structurally cannot close SRC-24, because two of the workspace's own test suites (license-server, native Swift) are never run by it, on either the export-era or current workflow file.

---

## 5. Full SRC-01…SRC-24 disposition at HEAD `70de3c30`

Carrying forward K05's `2bf21f1c` reads for the 11 items not in this ticket's kit_refs (SRC-03, 05-12, 19, 20 — spot-re-confirmed against HEAD this pass where cited; unchanged unless noted), plus §3-§4's fresh re-verification for the 13 items that are in kit_refs: SRC-01/02/04/13–18/21–24. **Round-2 correction:** SRC-01, SRC-10 and SRC-12's dispositions are corrected below (each was wrong in round 1, for reasons unrelated to each other); every row now carries a HEAD `file:line` anchor and an owning ledger ticket beyond M2-0013 itself (advisory ask).

| ID | Sev/Class | Disposition at HEAD | Evidence (`file:line`) | Owning ticket(s) beyond M2-0013 |
|---|---|---|---|---|
| SRC-01 | P0 INPUT_LIMITATION | **PARTIAL** (corrected — was "N/A / self-resolving") | Checkout identity `70de3c30`; present/missing manifest = §2's 58-path table (5 `NOT_IN_EXPORT`, all read live); CI run `36269153417` is green on this exact commit — but SRC-24 shows that same run excludes `license-server`/native-Swift, so "baseline checks on the complete tree" is not fully met. | M2-0005, M2-0015 (both TODO) |
| SRC-02 | P0 ARCHITECTURE_GAP | **PARTIAL** (§4) | `App.tsx:311`, `Settings.tsx:201`, `license-gate.mjs:11-12`, `license-lease-key.ts:81` (unused, pre-existing); `license.ts`'s real delta = machine-id durability + HTTPS enforcement, not the lease system. | M2-0062, M2-0146 (both TODO) |
| SRC-03 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `metis-command-runtime.ts:235` `void result` — the discard itself — under the "Advisory only" comment at `:234` (§3; `:82` is only the fire-and-forget call to the method, corrected from round 1). | M2-0122 (TODO) |
| SRC-04 | P0 SOURCE_DEFECT | **RELOCATED + PARTIAL** (§3) | `command-control.ts:85-110` (`confirm()`), outcome gate `:104-106` (fixed, tested — `command-control.test.ts:39,56`) / `desktop-adapters.ts:88,182-264` (residual: no `'verified'` outcome anywhere). | M2-0083 (TODO) |
| SRC-05 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `desktop-adapters.ts:88,182-264` — every `okResult()` call site still `'unknown'`; `desktop-actions.ts` (87 lines) defines no close-app/close-tab action type. | M2-0081, M2-0084 (both TODO) |
| SRC-06 | P0 IMPLEMENTATION_LIMIT | **REPRODUCES**, re-confirmed at HEAD | `src/shared/metis-wake.ts` unchanged (byte-identical, §2), 48 lines, `stripWakeWord` at line 41. | M2-0041 (IN_PROGRESS), M2-0081 (TODO) |
| SRC-07 | P0 SOURCE_POLICY_CONFLICT | **REPRODUCES**, re-confirmed at HEAD | `src/main/cloud-stt/credentials.ts:16` — the "seat a Cloudflare account API token" instruction string is unchanged (byte-identical, §2). | M2-0107 (TODO) |
| SRC-08 | P0 SOURCE_POLICY_CONFLICT | **REPRODUCES**, re-confirmed at HEAD | `operator/src/ai-gateway.ts` (28 lines, byte-identical) — `ensureDefaultAiGateway` still never inspects the response, still a bare `catch {}`. | M2-0041 (IN_PROGRESS), M2-0104 (TODO) |
| SRC-09 | P0 SOURCE_POLICY_CONFLICT | **PARTIAL**, re-confirmed at HEAD | `electron-builder.yml:131-141` — opt-in/encrypted/scanned embed path still exists as a supported mechanism (byte-identical, §2). | M2-0056 (TODO) |
| SRC-10 | P0 SOURCE_DEFECT | **PARTIAL** (corrected — was flat REPRODUCES) | `d1.ts:76-110` `ownedAskUpsertSql` + `store.ts:139` `mergeOwnedAsk` now do a provenance-aware merge (fixes F-11's late-null-overwrite pattern at source, both stores); `dashboard.ts:736,1349`'s capped `listAsks(2000)`/`(500)` aggregates unchanged (F-10 still REPRODUCES). | M2-0041 (IN_PROGRESS), M2-0106 (TODO) |
| SRC-11 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `native-app/App/Store/PersistedModels.swift:36,59` — decode-to-empty, `try? context.save()`, byte-identical (§2). | M2-0118 (TODO) |
| SRC-12 | P0 IMPLEMENTATION_LIMIT | **REPRODUCES** (corrected — was "Likely reproduces") | `MeetingController.swift` byte-identical to the export (§2); nil-hook doc comment at `:15,19` unchanged. | M2-0113 (TODO) |
| SRC-13 | P0 SOURCE_POLICY_CONFLICT | **PARTIAL** (§4) | `speaker-id.ts:191-199,491` (byte-identical, pre-existing); `speaker-id-off-switch.test.ts` (byte-identical, pre-existing, not new); `ipc.ts:1349-1350,1725` — `speakerId` defaults `{ enabled: true }`. | M2-0109 (TODO) |
| SRC-14 | P1 SOURCE_POLICY_CONFLICT | **REPRODUCES** (deliberate, documented) (§4) | `BrandThinkingOrb.tsx:5-7`, byte-identical. | M2-0093 (TODO) |
| SRC-15 | P1 DOCUMENT_AND_MIGRATION | **PARTIAL** (§4) | `onboarding-hero-video.ts:7` (asset already resolved at export time, byte-identical); `ONBOARDING-FLOW.md:14` ("No Skip", byte-identical, unresolved). | M2-0160 (TODO) |
| SRC-16 | P0 SOURCE_POLICY_CONFLICT | **PARTIAL** (§4) | `package.json:27,29` prebuild/postbuild check-script chain (byte-identical except the `1.9.6` version bump); no single capability manifest found, at either ref. | M2-0164 (TODO) |
| SRC-17 | P0 ARCHITECTURE_GAP | **REPRODUCES**, verbatim (§4) | `operator/src/index.ts:206` (`opts.store ?? …`), `:623` (`scheduled`, no `opts`) — not verbatim-identical text, same silent `memoryStore()` fallback in both. | M2-0159 (TODO) |
| SRC-18 | P0 OPERATIONAL_DEPENDENCY | **REPRODUCES** (§4) | `scripts/push-both.sh` (18 lines, byte-identical) — no cross-remote verification. | M2-0053, M2-0168 (both TODO) |
| SRC-19 | P0 SOURCE_CONTROL_GAP | **PARTIAL**, re-confirmed at HEAD | `.gitleaks.toml:1-13` (`[extend] useDefault = true`), `:15` (dated "Verified 2026-08-21" run note) — byte-identical, §2; allowlist still broad path-glob. | M2-0049 (TODO) |
| SRC-20 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `cloudflare-proxy/provision-embedded-key.mjs:107-113` — same line numbers as K05's read; `catch {}` around `secret list` unchanged (byte-identical, §2). | M2-0103 (TODO) |
| SRC-21 | P0 SOURCE_POLICY_CONFLICT | **REPRODUCES** (deliberate, DPO-flagged), unchanged since export (§4) | `docs/AUDIT-LOG.md:42-51` ("Erasure stance — decided, not accidental"), byte-identical to the export. | M2-0105 (TODO) |
| SRC-22 | P1 PRESERVE_AND_EXTEND | **PARTIAL**, unchanged since export (§4) | `mode-recap.ts` (9 layouts, byte-identical); `mode-skills.ts:44,189` (version/integrity machinery, byte-identical — not new). | M2-0141 (TODO) |
| SRC-23 | P0 IMPLEMENTATION_LIMIT | **REPRODUCES**, verbatim, unchanged since export (§4) | `mi-5-dust-e2e.md` (unchecked checklist, byte-identical); `brain/publish.ts` (no revision/readback/conflict handling, byte-identical). | M2-0128 (TODO) |
| SRC-24 | P0 EVIDENCE_GAP | **REPRODUCES**, unchanged since export (§4) | `.github/workflows/build.yml` — no `swift test`, no `license-server` test job, at either ref; run `36269153417` confirmed green on `70de3c30` via `gh api`. | M2-0050, M2-0063 (both TODO) |

**No SRC item may be marked closed in a future acceptance registry from this table alone** — a PARTIAL/REPRODUCES row here needs either a real code diff removing the pattern (re-read and re-confirmed) or an explicit owner-approved disposition (SRC-14, SRC-19, SRC-21 are the clearest candidates for the latter — each is now a *documented*, not merely *undiscovered*, trade-off, and each was already documented as such at export time for SRC-21).

---

## 6. F-01…F-20 disposition, with owning ledger ticket

Historical-audit-closure IDs cross-referenced against `docs/metis-2.0/ledger/tickets.json` `kit_refs` (every ticket whose `kit_refs` array names that F-ID) and, where the SRC evidence above doesn't reach far enough, a fresh targeted check at HEAD. **Round-2 correction:** every row below now carries a real disposition — `UNKNOWN`, `partly UNKNOWN` and `Bears on SRC-x` from round 1 are gone. The ticket's own `kit_refs` array (fetched from `tickets.json`) lists `F-01`…`F-20` explicitly, so "out of this pass's anchors" (round 1's stated reason for leaving six of them `UNKNOWN`) was not actually true — this pass closes what a static read can close and names, per row, exactly what a static read cannot.

| ID | Historical issue | SRC cross-ref | Disposition at HEAD | Owning ticket(s) (status) |
|---|---|---|---|---|
| F-01 | Embedded shared credentials | SRC-09 | **PARTIAL** — opt-in/encrypted/scanned, not removed (§5) | M2-0056 (TODO) |
| F-02 | Command authority drift | SRC-03/04 | **PARTIAL** — `CommandControl` now authenticates proposal ownership (nonce + `webContentsId`), but no adapter reaches `'verified'` (§3) | M2-0079 (TODO) |
| F-03 | Egress coverage gaps | — | **PARTIAL** (newly closed this pass) — `docs/NETWORK-EGRESS.md` documents a real, enforced `egressAllowlist` policy at boot, on both the main-process `fetch` and the Chromium session, with two dedicated test files (`src/main/net/egress-policy.test.ts`, `egress-guard.test.ts`) and once-per-session audit logging (`net.egress.blocked`). The same doc names its own gap: raw `https.request` sockets (e.g. MSAL) and child processes are not seen by the guard. | M2-0147 (TODO) |
| F-04 | Deployment-dependent auth | SRC-02 | **OPEN: not statically closable** — beyond SRC-02's licensing-compiled-off finding, closing this needs the license-server's actual deployed managed-config (roles, revocation, recovery flow) exercised against a real deployment, which a source-only read cannot produce. | M2-0145 (TODO) |
| F-05 | Unestablished multi-customer scope | SRC-02/17 | **PARTIAL, FIXED-leaning** (newly closed this pass) — `docs/MANTU-IT-REQUEST.md:119` states the boundary plainly: "Restricted to the Mantu tenant (single-tenant) so only Mantu accounts can sign in." That is exactly `required_change`'s ask ("state internal boundary; no unsupported tenant-isolation claims") — the app does not claim multi-tenant isolation it lacks. | M2-0145 (TODO) |
| F-06 | Ignored adapter result | SRC-04 | **PARTIAL — result no longer ignored (tested); still never reaches "verified"** (§3, re-anchored this pass) | M2-0082, M2-0083 (both TODO) |
| F-07 | Incomplete actions / close missing | SRC-05 | **REPRODUCES** — confirmed at HEAD, no general close-app/tab adapter | M2-0084, M2-0085 (both TODO) |
| F-08 | Discarded Jev decisions | SRC-03 | **REPRODUCES**, documented as deliberate ("Advisory only" at `:234`, the discard itself at `:235`) (§3, corrected anchor) | M2-0122 (TODO) |
| F-09 | Missing Laya integration | — | **OPEN: not statically closable** (corrected — round 1's validator asked for three confirmed hits; none exist) — searched `App.tsx`, `Settings.tsx`, `src/shared/keys.ts` and the whole tree at HEAD for `Laya` as a real identifier/word (`git grep -niE "[^a-zA-Z]laya[^a-zA-Z]"` and a repo-wide case-insensitive substring pass): **zero genuine hits**. Every apparent match was a case-insensitive substring inside an unrelated camelCase identifier (`overlayAllowsMinimize`, `displayAccelerator`, `replayAfterDrain`, `parkOverlayAfterHide`, …) — none is the word "Laya." Closing this needs the owner to confirm what "Laya" refers to (a portal/vendor name that may not appear as a source token at all), then a targeted product-feature check, not a source grep. | M2-0124 (TODO) |
| F-10 | Capped-list aggregate | SRC-10 | **REPRODUCES** — `dashboard.ts:736,1349`, unchanged (§4/§5) | M2-0106 (TODO) |
| F-11 | Late null overwrites usage | SRC-10 | **FIXED at source** (corrected — was REPRODUCES) — `d1.ts:76-110`, `store.ts:139`, both provenance-aware merges now retain device ownership and take `MIN(ts)`; runtime proof (that this is exercised correctly under concurrent writes in production) still owed by M2-0106. | M2-0106 (TODO) |
| F-12 | Incomplete usage/stream persistence | SRC-17 | **REPRODUCES** — SRC-17's silent memory-store fallback bears directly on this (§4) | M2-0106 (TODO) |
| F-13 | People/device/session conflation | SRC-13 | **PARTIAL** — see SRC-13 (§4); default-on persistent voiceprint retention is the live risk | M2-0106 (TODO) |
| F-14 | Onboarding/right-edge failures | — | **OPEN: not statically closable** — searched the current tree for `#196` and `#197` (the historical issue numbers this closure cites): zero references anywhere at HEAD. Closing this needs the owning renderer/right-edge lane's own native-UI acceptance pass, not a source grep. | M2-0042, M2-0095, M2-0202 (all TODO) |
| F-15 | Legacy/managed privacy differences | SRC-21 | **REPRODUCES** — SRC-21's DPO-flagged posture is unchanged since the export (§4); Cloudflare default/no-retention and opt-in local rules were not re-verified this pass. | M2-0112 (TODO) |
| F-16 | Developer rediscovery | — | **Blocker unchanged**: no acceptance-registry/`CURRENT.md`/`SOURCE-INDEX.json` exists at repo root on `origin/m2/integration` HEAD (§1) | M2-0011 (IN_PROGRESS) |
| F-17 | Stale architectural assessments | — | **REPRODUCES** (newly closed this pass) — `docs/compliance/dpia.md` and `data-flow-onepager.md` are dated 2026-07-11 and marked "DRAFT — for DPO review, not yet adopted"; more than two months later (this ticket's own 2026-09-26 re-verification date) they carry no commit-SHA or deployment scoping and are still unadopted drafts — exactly the "stale architectural assessment" pattern named. | M2-0017 (TODO) |
| F-18 | Packaging mistaken for qualification | SRC-24 | **REPRODUCES** — CI's exclusion of license-server/native-Swift tests (SRC-24, §4/§5) is the live instance of this: a green package/CI run does not qualify those two workspaces. | M2-0002 (IN_PROGRESS) |
| F-19 | Competing release feeds/policy | SRC-18 | **REPRODUCES** — `scripts/push-both.sh`'s no-verification dual-push (SRC-18, §4/§5) is the live instance of this. | M2-0053, M2-0168 (both TODO) |
| F-20 | Unproven staging/restore | SRC-17 | **OPEN: not statically closable** — SRC-17's silent production-store fallback (§4) is the closest static evidence, but proving/disproving an actual staging-environment restore/rollback needs a real deployment exercise, which a source-only pass cannot produce. | M2-0103, M2-0159 (both TODO) |

**Corrected from round 1:** F-03, F-05 and F-17 move from `UNKNOWN` to real, evidenced dispositions; F-11 moves from `REPRODUCES` to `FIXED at source`; F-04, F-09, F-14, F-20 move from `UNKNOWN`/vague framing to an explicit `OPEN: not statically closable`, each naming exactly what evidence would close it; F-15/18/19 move from "Bears on SRC-x" to a stated disposition tied to that same SRC evidence.

---

## 7. R80 — the source-export register entry itself

**OBSERVED (kit, read-only):** R80 (`MASTER.md:4342-4346`) states the export's "source commit and actual deployed identities [are] unknown. 14/19 linked source sections present. No complete application execution." Every SRC-01…24 anchor is a *static* finding against this one 1.9.5 snapshot.
**This pass's addition:** the SHA-256 is independently re-verified (§1); the "14/19 present" claim is now independently re-verified across all **58** paths named by either the findings or the map (not just the 19), with a real mechanical diff keyed on `SOURCE-INDEX.json`'s exact section boundaries rather than assumed (§2, Appendix); all 5 `NOT_IN_EXPORT` files were confirmed to exist and were read live at HEAD (§2). R80's caveat about not having a source commit/deployed-identity match is still true and cannot be resolved from a source-export text file alone — it would need the export's *actual* originating commit, which nothing in the kit records.

---

## 8. Open items for the Opus planner

1. **No new ledger ticket is warranted.** Every gap this pass reproduced already has an owning TODO/IN_PROGRESS ticket (§5, §6); the SRC-04 residual (§3) sharpens M2-0082/83/84/85's acceptance criteria (they must make at least one real adapter path return `'verified'`, not just add more `'unknown'` returns) but does not need a new ticket of its own.
2. **Owner-decision candidates, none of which a code change alone resolves:** SRC-14 (accessibility vs. product-identity motion), SRC-19/SRC-21 (both self-documented conscious trade-offs inviting a DPO/owner sign-off — SRC-21's specifically dating to export time, not this pass), SRC-02's dev-lease-key detector (`embeddedLicenseLeasePubkeyAvailable()`) sitting unused since before the export — someone should decide whether it's wired into `check:release` or removed as dead code. **New this pass:** SRC-13's `speakerId` default-on setting is a fourth candidate — the owner should decide, explicitly, whether default-on persistent voiceprint retention is the intended posture, given it currently contradicts SRC-13's own `required_change`.
3. **§1's blockers (F-16) are unchanged**: no acceptance-registry JSON or `CURRENT.md` exists at repo root on `origin/m2/integration` at this ticket's own re-verification time (2026-09-26). M2-0011 (traceability matrix + CI check, IN_PROGRESS) is the ticket to watch for this closing.
4. **This report does not re-open or re-score any F-item beyond what its cited evidence supports.** Three F-items (F-03, F-05, F-17) that round 1 left `UNKNOWN` are closed this pass with fresh HEAD evidence outside the SRC rows' own anchors; four (F-04, F-09, F-14, F-20) are explicitly `OPEN: not statically closable` with the specific missing evidence named — neither should be read as "confirmed still open forever," only as "not closable from this pass's kind of evidence."
5. **F-09 needs an owner answer, not another source grep.** Round 1's validator asked this pass to confirm literal `Laya` hits in three named files; none exist (§6). Before any future pass re-tries this, the owner should say what "Laya" refers to (a vendor/portal name, a code name, something else) so the right artifact gets checked.

---

## 9. What changed between round 1 and round 2 of this document

Round 1 of `SRC-REVERIFY.md` was reviewed by the Opus validator and found to contain several ungrounded claims. This section is the change log for that review; §0-§8 above are the corrected document, not round 1.

1. **The mechanical diff now covers all 58 paths named by `FINDINGS.json`'s `evidence[]` arrays (union `MAP-COVERAGE.json`'s 19 nodes), not only the 19 map nodes**, keyed exactly on `SOURCE-INDEX.json`'s `content_start_line`/`content_end_line` (§2, Appendix).
2. **Six "new since the export" claims were false; all six are corrected to "already in the export, byte-identical":** SRC-02's `license-lease-key.ts`/`verifyLease`/`checkLicenseGrace`; SRC-13's `deleteProfile`/`speaker-id-off-switch.test.ts`; SRC-15's `onboarding-hero-video.ts`; SRC-16's `package.json` prebuild/postbuild chain; SRC-21's `docs/AUDIT-LOG.md` "Erasure stance"; SRC-22's `mode-skills.ts` (§4, exec-summary item 4 rewritten).
3. **SRC-10/F-10/F-11 were wrong.** Round 1 called `operator/src/d1.ts`'s `ownedAskUpsertSql` an unchanged flat overwrite and `store.ts`'s growth "unrelated." At HEAD, `d1.ts:76-110` merges with `COALESCE`, `MIN(ts)` and delivered-attempt protection, keeping the device-ownership `WHERE` at `:109`; `store.ts:139`'s `mergeOwnedAsk` is the matching memory-store fix. Corrected: SRC-10 → PARTIAL, F-10 → REPRODUCES (dashboard caps unchanged), F-11 → FIXED at source (runtime proof owed by M2-0106).
4. **SRC-13 was incomplete.** Round 1 didn't check `speakerId`'s default. It defaults to `{ enabled: true }` (`src/shared/ipc.ts:1349-1350,1725`) — persistent auto-enrollment is on by default, contradicting `required_change`. Corrected: REPRODUCES for the default-on retention; the command-authority half still holds.
5. **SRC-01, SRC-12 used non-standard dispositions ("N/A / self-resolving", "Likely reproduces").** Corrected to the required vocabulary — PARTIAL (with the checkout identity, manifest and green-run-on-`70de3c30` evidence, set against SRC-24's exclusions) and REPRODUCES (MeetingController.swift is byte-identical) respectively. Line anchors were added to the SRC-05, 11, 15, 16, 19, 22, 23 and 24 rows in §5.
6. **Anchors were wrong or inconsistent in three places.** SRC-03/F-08's discarded decision is `void result` at `metis-command-runtime.ts:235`, under the "Advisory only" comment at `:234` — not line `:82`, which is only the fire-and-forget call. §5's SRC-04 row cited `command-control.ts:88-99`; it now matches §3's `:85-110`/`:104-106`. SRC-17's `:623` is confirmed not verbatim-identical to `:206` (no `opts.store` at `:623`), though both reach the same fallback.
7. **F-01…F-20 all now carry a real disposition.** `UNKNOWN` (F-03, F-09, F-14, F-17), `partly UNKNOWN` (F-04, F-05) and "Bears on SRC-x" (F-15, F-18, F-19, F-20) are gone. F-03, F-05 and F-17 are closed with fresh HEAD evidence (`docs/NETWORK-EGRESS.md`; `docs/MANTU-IT-REQUEST.md:119`; the compliance docs' stale draft dates). F-09's specific claim — three confirmed `Laya` hits — was checked and found false; it is `OPEN: not statically closable` with the actual (negative) search recorded. F-04, F-14, F-20, genuinely runtime-only, are `OPEN: not statically closable` with the missing evidence named.
8. **The verification is now reproducible in-line.** The Appendix below carries the exact script, keyed on `SOURCE-INDEX.json`, and its full 58-row output — `scripts/trace/diff-export.py` was never committed (out of this ticket's `scope_paths`, which names only this document) and does not exist in the repo; a reader re-runs the Appendix script against the kit copy, not a path this ticket cannot touch.
9. **The footer's "was not committed by this pass" is removed** — the lead committed round 1 of this file in `d57850c`; that sentence was a claim about a prior repo state, not this one.

---

## Appendix — the mechanical-diff script and its full output

This script is not committed to the repository (this ticket's `scope_paths` names only this document). It is reproduced here in full so a reader can save it and re-run it against their own checkout of the kit and `metis-operator-ux`.

```python
#!/usr/bin/env python3
"""Mechanical diff: metis-1.9.5-export.txt sections vs origin/m2/integration HEAD.

Keyed on source-review/SOURCE-INDEX.json's content_start_line/content_end_line
(1-based, str.splitlines coordinates into the export text). For each path in
FINDINGS.json's evidence[] (unioned with architecture/MAP-COVERAGE.json's 19
file-backed nodes), extracts the indexed line range from the export if the
path has a SOURCE-INDEX section, otherwise reports NOT_IN_EXPORT. Compares the
extracted section (trailing-whitespace-trimmed per line) against a HEAD copy
fetched via `git show origin/m2/integration:<path>`, using difflib.

Usage: python3 diff-export.py
Inputs (adjust paths for your checkout):
  EXPORT   = metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/references/source/metis-1.9.5-export.txt
  INDEX    = metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/source-review/SOURCE-INDEX.json
  FINDINGS = metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/source-review/FINDINGS.json
  MAPCOV   = metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/architecture/MAP-COVERAGE.json
  HEAD_DIR = a directory of files fetched with:
             git -C <operator-ux checkout> show origin/m2/integration:<path> > HEAD_DIR/<path with / -> __>
"""
import json, difflib, os, sys

BASE = "/Users/tony/AI-Brain-build/metis-kit-r11/Metis-2.0-Upgrade-Kit-r11"
EXPORT = f"{BASE}/references/source/metis-1.9.5-export.txt"
INDEX = f"{BASE}/source-review/SOURCE-INDEX.json"
FINDINGS = f"{BASE}/source-review/FINDINGS.json"
MAPCOV = f"{BASE}/architecture/MAP-COVERAGE.json"
HEAD_DIR = "/path/to/scratch/head-files"  # git show origin/m2/integration:<path> > HEAD_DIR/<path.replace('/','__')>

def load_export_lines(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.read().splitlines()

def main():
    export_lines = load_export_lines(EXPORT)
    index = json.load(open(INDEX))
    sections = {s["path"]: s for s in index["sections"]}

    findings = json.load(open(FINDINGS))
    findings_paths = set()
    for fnd in findings["findings"]:
        for ev in fnd["evidence"]:
            findings_paths.add(ev["path"])

    mapcov = json.load(open(MAPCOV))
    map_paths = {n["path"] for n in mapcov["nodes"]}

    all_paths = sorted(findings_paths | map_paths)

    rows = []
    for path in all_paths:
        head_file = os.path.join(HEAD_DIR, path.replace("/", "__"))
        head_exists = os.path.isfile(head_file)
        head_lines = None
        if head_exists:
            with open(head_file, encoding="utf-8", errors="replace") as f:
                head_lines = f.read().splitlines()

        sec = sections.get(path)
        if sec is None:
            status = "NOT_IN_EXPORT"
            detail = f"present, {len(head_lines)} lines" if head_exists else "MISSING AT HEAD TOO"
            rows.append((path, "No", status, detail))
            continue

        start, end = sec["content_start_line"], sec["content_end_line"]
        # content_start_line/content_end_line are 1-based inclusive into export_lines
        export_section = export_lines[start - 1:end]
        export_trimmed = [ln.rstrip() for ln in export_section]

        if not head_exists:
            rows.append((path, "Yes", "MISSING_AT_HEAD", f"export {len(export_section)} lines; HEAD file not fetched/absent"))
            continue

        head_trimmed = [ln.rstrip() for ln in head_lines]

        if export_trimmed == head_trimmed:
            rows.append((path, "Yes", "IDENTICAL", "-"))
            continue

        sm = difflib.SequenceMatcher(a=export_trimmed, b=head_trimmed, autojunk=False)
        ratio = sm.ratio()
        added = removed = 0
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag in ("replace", "delete"):
                removed += (i2 - i1)
            if tag in ("replace", "insert"):
                added += (j2 - j1)
        detail = (f"export {len(export_section)} lines -> HEAD {len(head_lines)} lines; "
                  f"~{added} added / {removed} removed (ratio {ratio:.3f})")
        rows.append((path, "Yes", "CHANGED", detail))

    print(f"{'Path':<55} {'InExport':<9} {'Status':<16} Detail")
    for path, in_export, status, detail in rows:
        print(f"{path:<55} {in_export:<9} {status:<16} {detail}")

    counts = {}
    for _, _, status, _ in rows:
        counts[status] = counts.get(status, 0) + 1
    print()
    print("Totals:", counts, "| total paths:", len(rows))

if __name__ == "__main__":
    main()
```

**Full output, this pass (2026-09-26), 58 paths:**

```
Path                                                    InExport  Status           Detail
.github/workflows/build.yml                             Yes       CHANGED          export 447 lines -> HEAD 449 lines; ~2 added / 0 removed (ratio 0.998)
.gitleaks.toml                                          Yes       IDENTICAL        -
DESIGN.md                                               Yes       IDENTICAL        -
THIRD_PARTY_NOTICES.md                                  Yes       IDENTICAL        -
cloudflare-proxy/provision-embedded-key.mjs             Yes       IDENTICAL        -
cloudflare-proxy/src/index.ts                           Yes       IDENTICAL        -
docs/AUDIT-LOG.md                                       Yes       IDENTICAL        -
docs/CLOUDFLARE.md                                      Yes       IDENTICAL        -
docs/ENTERPRISE-DEPLOY-WINDOWS.md                       Yes       IDENTICAL        -
docs/ENTERPRISE_RELEASE.md                              Yes       IDENTICAL        -
docs/design/ONBOARDING-FLOW.md                          Yes       IDENTICAL        -
docs/verification/mi-5-dust-e2e.md                      Yes       IDENTICAL        -
electron-builder.cahe.win.yml                           Yes       IDENTICAL        -
electron-builder.yml                                    Yes       IDENTICAL        -
intelligence/src/App.tsx                                Yes       IDENTICAL        -
intelligence/src/lib/brainAdapter.ts                    Yes       IDENTICAL        -
license-server/lib/app.mjs                              Yes       IDENTICAL        -
license-server/lib/store.mjs                            Yes       IDENTICAL        -
license-server/package.json                             Yes       IDENTICAL        -
native-app/App/Store/PersistedModels.swift              Yes       IDENTICAL        -
native-app/MetisKit/Package.swift                       Yes       IDENTICAL        -
native-app/MetisKit/Sources/MetisKit/MeetingController.swift Yes       IDENTICAL        -
operator/client/main.ts                                 Yes       IDENTICAL        -
operator/src/ai-gateway.ts                              Yes       IDENTICAL        -
operator/src/d1.ts                                      Yes       CHANGED          export 937 lines -> HEAD 1010 lines; ~103 added / 30 removed (ratio 0.932)
operator/src/dashboard.ts                               Yes       IDENTICAL        -
operator/src/index.ts                                   Yes       CHANGED          export 628 lines -> HEAD 632 lines; ~23 added / 19 removed (ratio 0.967)
operator/src/store.ts                                   Yes       CHANGED          export 840 lines -> HEAD 890 lines; ~55 added / 5 removed (ratio 0.965)
package.json                                            Yes       CHANGED          export 137 lines -> HEAD 137 lines; ~1 added / 1 removed (ratio 0.993)
scripts/push-both.sh                                    Yes       IDENTICAL        -
src/main/asktoto-shot.ts                                Yes       IDENTICAL        -
src/main/brain/ingest.ts                                No        NOT_IN_EXPORT    present, 2817 lines
src/main/brain/publish.ts                               Yes       IDENTICAL        -
src/main/brain/store.ts                                 Yes       IDENTICAL        -
src/main/cloud-stt/credentials.ts                       Yes       IDENTICAL        -
src/main/desktop-adapters.ts                            Yes       CHANGED          export 215 lines -> HEAD 268 lines; ~103 added / 50 removed (ratio 0.683)
src/main/index.ts                                       No        NOT_IN_EXPORT    present, 9518 lines
src/main/license-lease-key.ts                           Yes       IDENTICAL        -
src/main/license.ts                                     Yes       CHANGED          export 351 lines -> HEAD 459 lines; ~135 added / 27 removed (ratio 0.800)
src/main/llm.ts                                         Yes       IDENTICAL        -
src/main/metis-command-runtime.test.ts                  Yes       CHANGED          export 148 lines -> HEAD 89 lines; ~61 added / 120 removed (ratio 0.236)
src/main/metis-command-runtime.ts                       Yes       CHANGED          export 201 lines -> HEAD 241 lines; ~88 added / 48 removed (ratio 0.692)
src/main/mode-skills.ts                                 Yes       IDENTICAL        -
src/main/operator-ingest.ts                             Yes       CHANGED          export 506 lines -> HEAD 513 lines; ~18 added / 11 removed (ratio 0.972)
src/main/parakeet.ts                                    Yes       IDENTICAL        -
src/main/screen-capture.ts                              Yes       IDENTICAL        -
src/main/screen-preprocess.ts                           Yes       IDENTICAL        -
src/main/speaker-id.ts                                  Yes       IDENTICAL        -
src/main/transcripts.ts                                 No        NOT_IN_EXPORT    present, 1272 lines
src/preload/index.ts                                    Yes       CHANGED          export 553 lines -> HEAD 563 lines; ~13 added / 3 removed (ratio 0.986)
src/renderer/src/App.tsx                                No        NOT_IN_EXPORT    present, 4277 lines
src/renderer/src/components/BrandThinkingOrb.tsx        Yes       IDENTICAL        -
src/renderer/src/lib/listen.ts                          No        NOT_IN_EXPORT    present, 3153 lines
src/renderer/src/lib/onboarding-hero-video.ts           Yes       IDENTICAL        -
src/shared/desktop-actions.ts                           Yes       IDENTICAL        -
src/shared/metis-wake.ts                                Yes       IDENTICAL        -
src/shared/mode-recap.ts                                Yes       IDENTICAL        -
vitest.config.ts                                        Yes       CHANGED          export 71 lines -> HEAD 121 lines; ~51 added / 1 removed (ratio 0.729)

Totals: {'CHANGED': 12, 'IDENTICAL': 41, 'NOT_IN_EXPORT': 5} | total paths: 58
```

---

*End of SRC-REVERIFY (round 2). Written for ticket M2-0013. No file under `/Users/tony/AI-Brain-build/metis-operator-ux` (the public repo worktree) was created, modified, or deleted while producing this report — every code citation above is a `git show <ref>:<path>` read. This file itself lives only in the private `metis-2.0-program` repo; round 1 was committed there in `d57850c`, and this round's revision is committed by this pass.*
