# SRC-REVERIFY — Re-verification of the 24 source-export findings against HEAD

**Ticket:** M2-0013 · **Type:** investigation (docs/process only; no code changed) · **Owner model:** sonnet
**Repo re-verified (read-only):** `mysticalsin/AskToto-Mantu` — `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:<path>`, HEAD **`70de3c303a047879afd8651a78b41c0ce85dcc3c`** ("Merge pull request #205: agent rules for the Métis 2.0 program [M2-0024]", 2026-09-26T16:20:02-04:00). No file in that checkout was created, modified, or deleted by this ticket.
**Prior pass re-verified here:** `metis-v2-review/lanes/K05-master-s22-31.md` §2.8, taken against HEAD `2bf21f1c` (v1.9.6). **`2bf21f1c` is not an ancestor of the current `origin/m2/integration`** — the git history was rewritten 2026-09-26 (owner operating rule) — so this ticket does not diff commit ranges; every claim below is a fresh, direct read of the file content at the two named refs.
**Source-export inputs:** `metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/references/source/metis-1.9.5-export.txt` (kit copy, read-only), `source-review/SOURCE-INDEX.json` (1,521 sections; `content_start_line`/`content_end_line` gives the exact line range of each file's text inside the export — the section boundary this pass's mechanical diff is keyed on, not an approximation), `source-review/FINDINGS.json` (the 24 findings' `source_observation`/`required_change`/`evidence[]` text) and `architecture/MAP-COVERAGE.json` (the 19 file-backed architecture-map nodes, 14 present / 5 `NOT_IN_EXPORT`).
**Evidence labels:** **OBSERVED** (read directly in the cited file at the cited ref), **DERIVED** (reasoned from OBSERVED facts), **ASSUMED**, **UNKNOWN** (anchor read, disposition not established this pass), **OPEN: not statically closable** (a real anchor was read; closing it needs evidence a source-only pass cannot produce — named per row).
**Revision note (round 1 → round 2):** round 1 of this document mis-stated several "new since the export" claims — some of the cited machinery was already present, byte-identical, in the 1.9.5 export (§2's now-complete 58-path table proves this per file). §3, §4, §5 and §6 were corrected against that table in round 2; §9 lists every round-1→round-2 correction and why. Round 1's validator asked round 2 to confirm three literal `Laya` hits in `App.tsx`/`Settings.tsx`/`src/shared/keys.ts` for F-09 — none exist at HEAD; every apparent hit was a case-insensitive substring match inside an unrelated camelCase identifier (`overlayAllowsMinimize`, `displayAccelerator`, `replayAfterDrain`, …), not the word "Laya" — and round 2 corrected F-09 to **OPEN: not statically closable**, asking the owner what "Laya" refers to.
**Revision note (round 2 → round 3, this pass):** round 2 was itself reviewed by the Opus validator and found to contain one overcorrection and several remaining gaps; §0, §5, §6 and §8 below are corrected against that review, §5's anchors are completed, a factual-slip pass fixes five wrong claims, and the Appendix script is rewritten to be re-runnable as-is — §10 lists every round-2→round-3 correction and why. The overcorrection: round 2's F-09 conclusion (above) is itself wrong — a repo-wide, word-bounded `git grep -i -w laya` at HEAD still returns zero hits, Jev is the only wired decision provider, off by default, in Laya's place (`src/main/metis-command-register.ts:22,49`'s `jevEnabled`, defaulting false until the heartbeat's `decisionProviders.jev` switches it on; `src/main/metis-decide-client.ts`'s `/v1/decide` client), and the ledger already defines what Laya is and tracks its absence (M2-0124, "Qualify the Laya alternative behind /v1/decide without any Jev dependency") — so a source-only pass *can* close this as **REPRODUCES** (Laya integration confirmed missing, not merely undefined) without an owner definition. The "owner should say what Laya refers to" question is dropped throughout (§6, §8).

---

## 0. Executive summary

1. **SHA-256 of the export re-confirmed OBSERVED.** `shasum -a 256 metis-1.9.5-export.txt` = `efc8af651c1b2abb952d7737d5f3f3d15c4e51057059a07ceb3445c65f5c53f3` — matches §29/R80's cited prefix `efc8af65…` exactly (K05 flagged this as un-re-hashed "a binary I don't have"; CRITIC-CON-11 named this gap directly — it is now closed).
2. **Mechanical diff run for real, keyed on `SOURCE-INDEX.json`'s exact line boundaries, for all 58 paths named by either `FINDINGS.json`'s `evidence[]` arrays (42 unique paths across the 24 findings) or `MAP-COVERAGE.json`'s 19 architecture nodes** (§2 — a strict superset of "the 19 nodes," the round-1 gap this round closes). 41/53 export-present paths are **byte-identical** (whitespace-trimmed) to HEAD; 12 are **CHANGED**; 5 (`App.tsx`, `main/index.ts`, `listen.ts`, `transcripts.ts`, `brain/ingest.ts`) are `NOT_IN_EXPORT` and were confirmed present and read live at HEAD. Several things round 1 described as "new since the export" are corrected below, and most of them turn out to be **IDENTICAL**, not CHANGED: `mode-skills.ts` and `speaker-id-off-switch.test.ts` are byte-identical (§4/SRC-13, SRC-22); `onboarding-hero-video.ts` and `docs/AUDIT-LOG.md` are byte-identical (§4/SRC-15, SRC-21); `package.json` *is* one of the 12 CHANGED paths, but its only diff is the version string — the prebuild/postbuild chain SRC-16 cites is byte-identical within that CHANGED file (§4/SRC-16). Exactly one of the 12 CHANGED paths was genuinely mis-described: `src/main/license.ts` (`verifyLease`/`checkLicenseGrace` were already there — the real delta is a machine-id durability/locking subsystem and HTTPS enforcement, §4/SRC-02).
3. **SRC-04 is re-anchored with a concrete, currently-live residual defect, with corrected line anchors** (§3): `CommandControl.confirm()` (`src/main/command-control.ts:85-111`, outcome gate at `:104-106`) implements exactly the completion-verification boundary SRC-04/F-06 demanded. But **no desktop adapter (`src/main/desktop-adapters.ts`) ever returns `'verified'`** — `okResult()`'s default and all 14 call sites still pass `'unknown'` (grepped for the literal `'verified'`: zero hits in the file, even though the file itself grew from 215 to 268 lines for an unrelated reason — a shell-injection-hardening pass, confirmed by diff, not adapter-verification work). Round 1 conflated the fire-and-forget call at `metis-command-runtime.ts:82` with the actually-discarded value; the real discard is `void result` at `:235`, under the "Advisory only" comment at `:234` — corrected here. Round 1 also cited `command-control.ts:88-99` in §5, which conflicts with §3's own `:85-111`/`:104-106` — one anchor now, used everywhere.
4. **All 11 previously-UNKNOWN SRC findings are re-verified with file:line evidence, and several round-1 "improved since the export" claims are retracted** (§4): SRC-13's `deleteProfile` and its dedicated `speaker-id-off-switch.test.ts` were **already** in the export (`speaker-id.ts` is byte-identical); worse, `src/shared/ipc.ts:1348-1350,1725` shows `speakerId` **defaults to `{ enabled: true }`** — the persistent-voiceprint pass SRC-13 flagged runs by default, not on opt-in, directly against `required_change`'s "disable unapproved persistent enrollment." SRC-02's Ed25519 lease functions (`verifyLease`, `checkLicenseGrace`, `license-lease-key.ts`) were also already in the export; the real, newly-added license.ts material is a machine-id durability/repair-lock subsystem and mandatory-HTTPS enforcement. SRC-15's local mp4 asset and SRC-21's `docs/AUDIT-LOG.md` "Erasure stance" section are byte-identical to the export, not later hardening. SRC-22's `mode-skills.ts` is byte-identical to the export too — and the export's *own* `source_observation` already says "the source already defines nine mode-specific recap layouts and locked mode skills," so "trending FIXED" over-claimed forward motion that the export text itself already credited. None of the 11 are FIXED outright; SRC-14/19/21 remain the clearest owner-decision candidates (each a documented trade-off, not a silent gap).
5. **The full SRC-01…24 table (§5) has three corrected dispositions.** SRC-01 moves from "N/A / self-resolving" to **PARTIAL**: the checkout identity (`70de3c30`) and a real present/missing manifest now exist, and CI run `36269153417` is green on that exact commit — but that same run is the one SRC-24 shows excludes `license-server` and native Swift tests, so "baseline checks on the complete tree" is not fully met. SRC-10 moves from a flat REPRODUCES to **PARTIAL**: `operator/src/d1.ts:76-110`'s `ownedAskUpsertSql` and `operator/src/store.ts:139`'s `mergeOwnedAsk` now do a provenance-aware merge (`COALESCE`, `MIN(ts)`, delivered-attempt protection) that keeps the device-ownership `WHERE` (`d1.ts:109`). F-11's late-null-overwrite defect is **FIXED**, and behaviour-tested, not merely fixed-at-source: `operator/src/ask-ingest-integrity.test.ts` runs the merge for both a `memoryStore()` and a real `node:sqlite`-backed `d1Store` (`testStore()` at `:66-72`) — combined write-order survival (`:118`), a rating kept after a late Worker meter write (`:134`), MQA-346 delivered-failover isolation (`:145`), and a losing device never overwriting the winning Ask (`:193`) — all green in CI run `36269153417` (`✓ src/ask-ingest-integrity.test.ts (27 tests)`); `security-harden.test.ts:75-76` independently confirms a cross-device overwrite returns 403. SRC-10 itself stays **PARTIAL**: `d1.ts:105`'s default `COALESCE(excluded.x, asks.x)` takes the latest *non-null* value, not a cumulative maximum, so SRC-10's own "1/15/30 → 30" exit evidence is unmet and untested (an out-of-order lower non-null value still overwrites a higher one); and `dashboard.ts:736,1349`'s capped `listAsks(2000)`/`(500)` aggregates are unchanged, so F-10 still REPRODUCES. SRC-12 moves from "Likely reproduces" to **REPRODUCES**: `MeetingController.swift` is byte-identical to the export.
6. **F-01…F-20 all now carry a real disposition** (§6) instead of round 1's `UNKNOWN`/`Bears on SRC-x` placeholders. Three were newly dispositioned this pass with fresh HEAD evidence the SRC rows don't cite — "newly dispositioned" is not "newly closed": **F-03** (egress) is **PARTIAL** — a real, tested `egressAllowlist` policy (`docs/NETWORK-EGRESS.md`, `src/main/net/egress-guard.ts` + two test files) exists, but the policy is opt-in, not a default: the same doc states plainly, "Absent key: no restriction (today's behavior for every install)" (`:69`) — the guard only runs when managed config sets `egressAllowlist`. Its documented gap when configured (raw `https.request`, child processes) is separate from that. **F-05** (multi-customer scope) is **FIXED**: `docs/MANTU-IT-REQUEST.md:119` states the boundary plainly ("Restricted to the Mantu tenant (single-tenant)"), exactly what `required_change` asked for, and it is enforced, not merely documented — `src/main/auth.ts:113,121`'s `TENANT_GUID_RE` rejects the `common`/`organizations`/`consumers` multi-tenant aliases the `:113` comment names, `auth.test.ts:125` behaviorally tests that rejection, and `docs/security/AUDIT-10.md:17`/`AUDIT-20.md:17` independently confirm there is no multi-tenant SQL to isolate in the first place. **F-17** (stale assessments) **REPRODUCES**: the compliance data-flow/DPIA docs are dated 2026-07-11 and still marked "DRAFT — for DPO review, not yet adopted" more than two months later, with no commit-SHA or deployment scoping in the document itself — the pattern F-17 names. F-09, corrected in round 3, is **REPRODUCES** — Laya integration is confirmed missing by a repo-wide, word-bounded search, not merely undefined (§6, §10). F-04 remains **OPEN: not statically closable**, naming the specific evidence a static pass cannot produce. F-14, corrected in round 3, is **PARTIAL** — GitHub issues #196 and #197 are both still open on the tracker, both filed against the **1.9.8** tip `ac1a62d8e3`, not this ticket's `origin/m2/integration` **1.9.6** line. #197's fix is a real change from the build the issue names, not just a HEAD-in-isolation read: `ac1a62d8e3:src/main/index.ts:2065` read `process.env['ELECTRON_RENDERER_URL']` directly, HEAD's `:2064` reads the same value only through `devEnv()` (`src/main/dev-env.ts:33-35`, also read exclusively at `:1491`) — even though the tracker issue itself remains open. #196 (the Act-2 demo `onboard-cta` Next button not advancing) is **neither reproduced nor refuted at HEAD**: `OnboardingDemoScene.tsx` and its demo helpers (`lib/onboarding-demo.ts`, `synthetic-cursor.ts`, `onboarding-demo-guard.ts`) are blob-identical between `ac1a62d8e3` and HEAD — the Next handler itself (`onClick` at `:287-291` calling `advance()` at `:131-136`) did not change — but its host, `OnboardingExperience.tsx`, is a different blob at each ref, so a static read cannot settle whether the reported freeze still occurs; closing #196 needs the native-UI acceptance pass **M2-0042** owns, not a source grep. F-15/18/19/20 get an explicit disposition tied to their SRC evidence instead of the vague "Bears on" phrasing.
7. **One new defect needs a new ledger ticket.** Every other gap this pass reproduced already has an owning TODO/IN_PROGRESS ticket (§6, §8), and the SRC-04 residual sharpens M2-0082/83/84/85's acceptance criteria without a ticket of its own — but SRC-13's default-on persistent voiceprint retention (`src/shared/ipc.ts:1348-1350,1725`) is not covered by M2-0109's acceptance, which names only "Speaker labels never treated as identity or authority" and says nothing about the retention default. §8 proposes the ticket; **M2-0220** is filed in `tickets.json` with `needs_decision: [D-31]` for the owner's call on the default.

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
| `src/main/desktop-adapters.ts` | SRC-05 | Yes | **CHANGED** | 215→268 lines; the entire delta is a shell-injection-hardening pass (fixed literal command/URL/AppleScript allowlist, `explorer.exe` instead of `cmd /c start`, a non-blocking Notepad `spawn`). `okResult()` itself moved — export `:56` (15 call sites) to HEAD `:88` (14 call sites), not unchanged locations — but its `outcome = 'unknown'` default is untouched at both; grepped for the literal `'verified'`: zero hits, both before and after. |
| `src/main/speaker-id-off-switch.test.ts` | SRC-13 | Yes | IDENTICAL | Has its own `SOURCE-INDEX` section (header `145864`, content `145866-146146`, 281 lines) — it simply sits outside the 58-path set this pass's script keys on (add-on check, this round, using the same slice method): byte-identical (whitespace-trimmed). |
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

**Totals (the 58 formally-scoped paths — `FINDINGS.json` `evidence[]` ∪ `MAP-COVERAGE.json` nodes):** 41 IDENTICAL, 12 CHANGED, 5 NOT_IN_EXPORT (all 5 confirmed present and read live at HEAD) — 58 paths, zero missing. The table's 59th row (`speaker-id-off-switch.test.ts`) is a round-3 add-on outside that formal set — SRC-13's own `evidence[]` cites only `speaker-id.ts` — kept here because §4/SRC-13's prose leans on it. **Reading this table (DERIVED):** the round-1 document's narrative repeatedly framed byte-identical export sections as things that had "since been added" or "now exist" — every such claim in §4/§6 below is corrected against this table. Real, substantive drift (not cosmetic) exists in exactly three places relevant to this ticket's kit_refs: `license.ts` (machine-id durability + HTTPS), `d1.ts`/`store.ts` (the ownership-merge fix), and `desktop-adapters.ts` (shell-injection hardening, unrelated to the verified-outcome gap). Everything else cited by a kit_refs finding is either untouched since 1.9.5 or was never in the export to begin with.

---

## 3. SRC-04 re-anchored (ticket acceptance criterion 2)

**Original claim (source-export, FINDINGS.json):** `flushPending` in `src/main/metis-command-runtime.ts` awaits `executeDesktopAction` but ignores the returned `ok`/`outcome` before `mark_committed`.

**K05's finding at `2bf21f1c`:** the `flushPending`/`mark_committed` shape is gone from `metis-command-runtime.ts` entirely (grepped, zero hits); the file's own docstring says execution is "deliberately deferred... this runtime never calls it"; `executeDesktopAction` is wired in `index.ts` instead. K05 marked this "relocated — cannot confirm or refute" and named `index.ts`'s command-confirmation path as the next locus (cross-ref CRITIC-CON-9, CRITIC-INV-8).

**This pass, at `origin/m2/integration` HEAD (OBSERVED, corrected line anchors):**

- `src/main/metis-command-runtime.ts` (241 lines) still only produces a *proposal* (`ingestTranscript` → `reduceMetisCommandSession` → `state.proposal`), never executes anything. **Two distinct discards exist in this file, and round 1 conflated them:**
  - `:82` — `void this.maybeDisambiguate(next, sessionId, utteranceRevision, contextHash)` is a fire-and-forget **call** to the whole async method (its own return promise is discarded, which is normal for a background task the caller doesn't block on).
  - `:234-235` — **inside** that method, after the remote decision actually resolves (`:216`'s `await decideActionDisambiguate(...)`), the comment `// Advisory only. A remote response cannot create, alter, or execute a proposal.` sits directly above `void result` at `:235` — **this** is the discarded decision F-08 names, not `:82`. The comment documents this specific line as deliberate policy.
- Execution genuinely lives in **`src/main/command-control.ts`**: `CommandControl.confirm()` spans **`:85-111`** —
  ```ts
  async confirm(                                                     // :85
    input: CommandControlProposal & { webContentsId: number }
  ): Promise<{ ok: true; outcome: ... } | { ok: false; reason: ... }> {
    const proposal = this.validate(input)                            // :88
    ...
    try {
      const result = await this.deps.execute(proposal.request)       // :98
      if (result.id !== proposal.request.id) { ...; return { ok: false, reason: 'adapter_failed' } }  // :99-102
      this.audit('command.confirmed', { actionId: proposal.request.id, outcome: result.outcome })      // :103
      if (result.ok && result.outcome === 'verified') return { ok: true, outcome: result.outcome }     // :104
      if (result.ok && result.outcome === 'unknown') return { ok: false, reason: 'outcome_unverified' } // :105
      return { ok: false, reason: 'adapter_failed' }                  // :106
    } catch {                                                         // :107
      this.audit('command.confirmed', { actionId: proposal.request.id, outcome: 'failed' })
      return { ok: false, reason: 'adapter_failed' }                  // :109
    }                                                                    // :110
  }                                                                    // :111
  ```
  This is a real fix for the *original* SRC-04 defect (a result silently discarded before commit): the outcome gate is `:104-106`, and it is tested — `src/main/command-control.test.ts` asserts `{ ok: true, outcome: 'verified' }` (`:39`, when the adapter resolves `verified`) and `{ ok: false, reason: 'outcome_unverified' }` (`:56`, when it resolves `unknown`).
- **The residual gap, confirmed live, exact line anchors unchanged since round 1 despite the file's growth:** `src/main/desktop-adapters.ts:88`'s `okResult()` defaults its `outcome` parameter to `'unknown'`, and **all 14 of its call sites** (`:182,189,195,201,204,209,212,222,234,237,244,255,259,264`) pass `'unknown'` explicitly — grepped for `'verified'` as a literal in the file: **zero hits**, at either the export or HEAD ref (§2). The file grew from 215 to 268 lines for an unrelated reason — a shell-injection-hardening pass (fixed literal command/URL/AppleScript allowlist, `explorer.exe` instead of `cmd /c start`) — not adapter-outcome work. So `CommandControl.confirm()`'s `result.outcome === 'unknown'` branch is the *only* branch any real adapter call can ever reach; `'verified'` is unreachable code on both platforms today.
- **This is live, not scaffolding:** `src/main/index.ts:987-988` constructs `commandControl = new CommandControl({ execute: executeDesktopAction, ... })`; `index.ts:4680` (`ipcMain.handle(IPC.metisCommandConfirm, ...)`) calls `commandControl.confirm(...)` directly from a renderer IPC channel; `src/main/metis-command-register.ts:43` calls `commandControl.propose(...)` from the real `MetisCommandRuntime`'s `onState` callback, i.e. from an actual parsed voice command, not a test harness. (`metis-command-register.ts` is not one of §2's 58 formally-scoped paths — it is cited by SRC-04 in prose, not in `FINDINGS.json`'s `evidence[]` — but a direct check shows it CHANGED against the export too: 37→60 lines.)

**Disposition: RELOCATED + PARTIAL.** SRC-04's *originally described* bug (silently discarded result) is fixed in the new location, with a passing behavioral test proving both branches. The *underlying requirement* ("adapters returning failed/unsupported/unknown/cancelled never produce verified success" — SRC-04's own `exit_evidence`) is technically satisfied (unknown never becomes verified) but at the cost of **no adapter can currently produce a positive user-facing outcome at all**: every confirmed desktop command today resolves to `outcome_unverified` (or `adapter_failed` on a genuine OS error) — functionally indistinguishable from failure to the end user, even when the OS action visibly succeeded. **No new ticket needed** — M2-0082 ("typed action results and independent postcondition verifier"), M2-0083 ("wire the command path... verified adapter result"), M2-0084/M2-0085 (mac/Windows adapters "with readback") already scope exactly this. This pass's contribution is the concrete, current-HEAD confirmation that the gap is real, live, and user-visible today.

**F-06 cross-reference:** F-06 ("Ignored adapter result... unknown/failure never becomes verified") maps here. Its "ignored result" half is fixed (§3, with a passing test now cited); its "never becomes verified" half remains true for a different reason (no adapter tries) than the original one (result was discarded) — F-06's §6 disposition reflects this nuance rather than a flat OPEN/CLOSED call.

---

## 4. The 11 previously-UNKNOWN SRC findings — re-verified at HEAD

Each row: `source_observation`/`required_change` from `source-review/FINDINGS.json` (kit, read-only) vs. what's actually at `origin/m2/integration` HEAD today, cross-checked against §2's byte-for-byte export comparison.

### SRC-02 — Separate entitlement authority from telemetry and legacy licensing (P0 ARCHITECTURE_GAP)

**OBSERVED at HEAD:** `src/main/license.ts`'s own header states plainly (and `docs/qa/BUG-LEDGER.md:2209` independently documents the same thing) that device licensing is **compiled off** in the shipped app — `src/renderer/src/App.tsx:311` `const LICENSE_ENFORCEMENT = false`, `src/renderer/src/components/Settings.tsx:201` `const LICENSE_UI_ENABLED: boolean = false` — so `<LicenseGate>` never renders and the 12h heartbeat can never fire. `license-server/lib/license-gate.mjs:11-12` independently enforces the pair can't drift server-side. **Correction from round 1:** the Ed25519 offline-lease system (`verifyLease`, `checkLicenseGrace` in `license.ts`; `license-lease-key.ts` in full) was **not** added since the export — `license-lease-key.ts` is byte-identical (§2) and the export's own `license.ts` section already defines `verifyLease` (its line 209) and `checkLicenseGrace` (its line 224). What **is** genuinely new since the export (§2's real diff, net +108 lines) is a machine-id durability/repair-lock subsystem (`machineIdentity`, `getDurableMachineId`, `acquireRepairLock`/`reclaimStaleRepairLock`) and mandatory-HTTPS enforcement on the license-server URL (`isSecureLicenseServerUrl`, `redirect: 'error'` on every outbound call). `embeddedLicenseLeasePubkeyAvailable()` (`license-lease-key.ts:81`, "is this a real production key or the dev placeholder") is **also** unchanged from the export — it was already unused outside its own file/tests then, and still is now (grepped the whole tree: zero external call sites) — so "production rejects development trust roots" ( `required_change`'s explicit demand) has never been enforced by any gate.
**Disposition: PARTIAL.** The "conflicting gates" half is resolved by making legacy licensing consistently, verifiably, and honestly *off* rather than half-wired. The "one issuer/entitlement authority, production rejects dev trust roots" half is unresolved and was never touched by this diff: `operator/src/store.ts`'s `IssuedLicenseRow`/seat records and the legacy JSON `license-server/lib/store.mjs` still coexist with no reconciliation, and the dev-key-detection function still gates nothing.

### SRC-13 — Speaker labels are not biometric identity or action authority (P0 SOURCE_POLICY_CONFLICT)

**OBSERVED at HEAD:** `src/main/speaker-id.ts` is **byte-identical to the export** (§2) — the persistent voiceprint store (`userData/voiceprints.json`) and Teams-VTT auto-enrollment flywheel (`autoEnrollFromLabeledWindows`, `:191-197`), the `deleteProfile(name)` API (`:199`, wired `:491`), and the dedicated off-switch test file `src/main/speaker-id-off-switch.test.ts` (also byte-identical to its export section, §2) were **all already present in the 1.9.5 export** — none of this is new since the export, contrary to round 1's framing. **The material new fact this pass adds:** `src/shared/ipc.ts:1348-1350` (the Zod schema default) and `:1725` (the `DEFAULT_SETTINGS` object) both show `speakerId` **defaults to `{ enabled: true }`** — the file's own adjacent comment explains this was made on-by-default 2026-08-21 because "the embedding model ships in every build... the default costs nothing where it cannot work." That is a documented product decision, but it is the opposite of `required_change`'s explicit "Disable unapproved persistent enrollment/voiceprint retention... keep default attribution session-local and uncertain." No callsite anywhere in `src/**` gates a *desktop command* on a speaker match (grepped `speaker` near `commandControl`/`executeDesktopAction`: no hits) — the "no speaker score authenticates desktop commands" half of the requirement holds.
**Disposition: PARTIAL — REPRODUCES for the default-on retention, holds for command-authority separation.** The off-switch and delete path are real (and pre-existing, not new), but the *default* is on, not session-local — the opposite of what `required_change` asks for. The command-authority half is unaffected and continues to hold. **Filed as M2-0220** (needs_decision **D-31**) — no existing ticket's acceptance covers the retention default; M2-0109 covers only the command-authority half.

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

**OBSERVED at HEAD (still the strongest "fully open" finding in this pass):** `operator/src/index.ts:206` (`routeRequest`) reads `opts.store ?? (env.DB ? d1Store(env.DB) : memoryStore())`; `:623` (the `scheduled` cron handler, which takes no `opts`) reads `env.DB ? d1Store(env.DB) : memoryStore()`. **These two lines are not verbatim-identical text** (no `opts.store` at `:623`) — a correction from round 1's "identically... in both" phrasing — but they reach the identical silent fallback: **if the Worker's `DB` binding is ever unbound**, every request or cron tick is served from a fresh, per-invocation, non-persistent `memoryStore()`, with no error, no `/health` field keyed to it, no startup check. `operator/src/store.ts:490`'s `memoryStore()` is the same factory **33** `operator/` test files construct directly (recounted this pass — round 2's "38" was wrong) — there is no code-level distinction between "the test double" and "what production falls back to."
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
| SRC-01 | P0 INPUT_LIMITATION | **PARTIAL** (corrected — was "N/A / self-resolving") | Checkout identity `70de3c30`; `package.json:3` (`"version": "1.9.6"`); present/missing manifest = §2's 58-path table (5 `NOT_IN_EXPORT`, all read live); CI run `36269153417` is green on this exact commit — 4 of the workflow's 5 defined jobs run for real (Quality checks × ubuntu/windows, Operator Worker, Security & supply chain), with the macOS/Windows package jobs both `skipped` (`build.yml:22,58,115,211,360`) — but SRC-24 shows that same run excludes `license-server`/native-Swift, so "baseline checks on the complete tree" is not fully met. | M2-0005, M2-0015 (both TODO) |
| SRC-02 | P0 ARCHITECTURE_GAP | **PARTIAL** (§4) | `App.tsx:311`, `Settings.tsx:201`, `license-gate.mjs:11-12`, `license-lease-key.ts:81` (unused, pre-existing); `license.ts`'s real delta = machine-id durability + HTTPS enforcement, not the lease system. | M2-0062, M2-0146 (both TODO) |
| SRC-03 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `metis-command-runtime.ts:235` `void result` — the discard itself — under the "Advisory only" comment at `:234` (§3; `:82` is only the fire-and-forget call to the method, corrected from round 1). | M2-0122 (TODO) |
| SRC-04 | P0 SOURCE_DEFECT | **RELOCATED + PARTIAL** (§3) | `command-control.ts:85-111` (`confirm()`), outcome gate `:104-106` (fixed, tested — `command-control.test.ts:39,56`) / `desktop-adapters.ts:88,182-264` (residual: no `'verified'` outcome anywhere). | M2-0083 (TODO) |
| SRC-05 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `desktop-adapters.ts:88,182-264` — every `okResult()` call site still `'unknown'`; `desktop-actions.ts` (87 lines) defines no close-app/close-tab action type. | M2-0081, M2-0084 (both TODO) |
| SRC-06 | P0 IMPLEMENTATION_LIMIT | **REPRODUCES**, re-confirmed at HEAD | `src/shared/metis-wake.ts` unchanged (byte-identical, §2), 48 lines, `stripWakeWord` at line 41. | M2-0041 (IN_PROGRESS), M2-0081 (TODO) |
| SRC-07 | P0 SOURCE_POLICY_CONFLICT | **REPRODUCES**, re-confirmed at HEAD | `src/main/cloud-stt/credentials.ts:16` — the "seat a Cloudflare account API token" instruction string is unchanged (byte-identical, §2). | M2-0107 (TODO) |
| SRC-08 | P0 SOURCE_POLICY_CONFLICT | **REPRODUCES**, re-confirmed at HEAD | `operator/src/ai-gateway.ts:14-23` (28 lines total, byte-identical) — `ensureDefaultAiGateway`'s `fetchImpl(...)` result is never inspected, and the bare `catch {}` at `:21` swallows any failure. | M2-0041 (IN_PROGRESS), M2-0104 (TODO) |
| SRC-09 | P0 SOURCE_POLICY_CONFLICT | **PARTIAL**, re-confirmed at HEAD | `electron-builder.yml:131-141` — opt-in/encrypted/scanned embed path still exists as a supported mechanism (byte-identical, §2). | M2-0056 (TODO) |
| SRC-10 | P0 SOURCE_DEFECT | **PARTIAL** (corrected — was flat REPRODUCES) | `d1.ts:76-110` `ownedAskUpsertSql` + `store.ts:139` `mergeOwnedAsk` now do a provenance-aware merge — **fixes F-11's late-null-overwrite pattern, behaviour-tested for both stores** (`ask-ingest-integrity.test.ts:118,134,145,193`; `security-harden.test.ts:75-76`; green in CI run `36269153417`) — via `d1.ts:105`'s default `COALESCE(excluded.x, asks.x)`, which takes the latest *non-null* value, not a cumulative maximum, so SRC-10's own monotonic-counter exit evidence ("1/15/30 → 30") is still unmet and untested; `dashboard.ts:736,1349`'s capped `listAsks(2000)`/`(500)` aggregates unchanged (F-10 still REPRODUCES). | M2-0041 (IN_PROGRESS), M2-0106 (TODO) |
| SRC-11 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `native-app/App/Store/PersistedModels.swift:36,59` — decode-to-empty, `try? context.save()`, byte-identical (§2). | M2-0118 (TODO) |
| SRC-12 | P0 IMPLEMENTATION_LIMIT | **REPRODUCES** (corrected — was "Likely reproduces") | `MeetingController.swift` byte-identical to the export (§2); nil-hook doc comment at `:15,19` unchanged. | M2-0113 (TODO) |
| SRC-13 | P0 SOURCE_POLICY_CONFLICT | **PARTIAL** (§4) | `speaker-id.ts:191-199,491` (byte-identical, pre-existing); `speaker-id-off-switch.test.ts` (byte-identical, pre-existing, not new); `ipc.ts:1348-1350,1725` — `speakerId` defaults `{ enabled: true }`. | M2-0109 (TODO), M2-0220 (TODO) |
| SRC-14 | P1 SOURCE_POLICY_CONFLICT | **REPRODUCES** (deliberate, documented) (§4) | `BrandThinkingOrb.tsx:5-7`, byte-identical. | M2-0093 (TODO) |
| SRC-15 | P1 DOCUMENT_AND_MIGRATION | **PARTIAL** (§4) | `onboarding-hero-video.ts:7` (asset already resolved at export time, byte-identical); `ONBOARDING-FLOW.md:14` ("No Skip", byte-identical, unresolved). | M2-0160 (TODO) |
| SRC-16 | P0 SOURCE_POLICY_CONFLICT | **PARTIAL** (§4) | `package.json:27,29` prebuild/postbuild check-script chain (byte-identical except the `1.9.6` version bump); no single capability manifest found, at either ref. | M2-0164 (TODO) |
| SRC-17 | P0 ARCHITECTURE_GAP | **REPRODUCES**, verbatim (§4) | `operator/src/index.ts:206` (`opts.store ?? …`), `:623` (`scheduled`, no `opts`) — not verbatim-identical text, same silent `memoryStore()` fallback in both. | M2-0159 (TODO) |
| SRC-18 | P0 OPERATIONAL_DEPENDENCY | **REPRODUCES** (§4) | `scripts/push-both.sh:10-17` (18 lines total, byte-identical) — the `for remote in github origin` loop pushes each remote independently with no cross-remote verification. | M2-0053, M2-0168 (both TODO) |
| SRC-19 | P0 SOURCE_CONTROL_GAP | **PARTIAL**, re-confirmed at HEAD | `.gitleaks.toml:1-13` (`[extend] useDefault = true`), `:15` (dated "Verified 2026-08-21" run note) — byte-identical, §2; allowlist still broad path-glob. | M2-0049 (TODO) |
| SRC-20 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `cloudflare-proxy/provision-embedded-key.mjs:107-113` — same line numbers as K05's read; `catch {}` around `secret list` unchanged (byte-identical, §2). | M2-0103 (TODO) |
| SRC-21 | P0 SOURCE_POLICY_CONFLICT | **REPRODUCES** (deliberate, DPO-flagged), unchanged since export (§4) | `docs/AUDIT-LOG.md:42-51` ("Erasure stance — decided, not accidental"), byte-identical to the export. | M2-0105 (TODO) |
| SRC-22 | P1 PRESERVE_AND_EXTEND | **PARTIAL**, unchanged since export (§4) | `mode-recap.ts` (9 layouts, byte-identical); `mode-skills.ts:44,189` (version/integrity machinery, byte-identical — not new). | M2-0141 (TODO) |
| SRC-23 | P0 IMPLEMENTATION_LIMIT | **REPRODUCES**, verbatim, unchanged since export (§4) | `docs/verification/mi-5-dust-e2e.md:7` ("It is Tony's to run, not automatable in CI", unchecked checklist, byte-identical); `src/main/brain/publish.ts` (no revision/readback/conflict handling, byte-identical). | M2-0128 (TODO) |
| SRC-24 | P0 EVIDENCE_GAP | **REPRODUCES**, unchanged since export (§4) | `.github/workflows/build.yml:22,58,115,211,360` (all five jobs, grepped for `swift`/`license-server`: zero hits at either ref); `license-server/package.json:13` (`"test": "node --test"`, never invoked in CI); run `36269153417` confirmed green on `70de3c30` via `gh api`. | M2-0005, M2-0050, M2-0063 (all TODO) |

**No SRC item may be marked closed in a future acceptance registry from this table alone** — a PARTIAL/REPRODUCES row here needs either a real code diff removing the pattern (re-read and re-confirmed) or an explicit owner-approved disposition (SRC-14, SRC-19, SRC-21 are the clearest candidates for the latter — each is now a *documented*, not merely *undiscovered*, trade-off, and each was already documented as such at export time for SRC-21).

---

## 6. F-01…F-20 disposition, with owning ledger ticket

Historical-audit-closure IDs cross-referenced against `docs/metis-2.0/ledger/tickets.json` `kit_refs` (every ticket whose `kit_refs` array names that F-ID) and, where the SRC evidence above doesn't reach far enough, a fresh targeted check at HEAD. **Round-2 correction:** every row below now carries a real disposition — `UNKNOWN`, `partly UNKNOWN` and `Bears on SRC-x` from round 1 are gone. The ticket's own `kit_refs` array (fetched from `tickets.json`) lists `F-01`…`F-20` explicitly, so "out of this pass's anchors" (round 1's stated reason for leaving six of them `UNKNOWN`) was not actually true — this pass closes what a static read can close and names, per row, exactly what a static read cannot.

| ID | Historical issue | SRC cross-ref | Disposition at HEAD | Owning ticket(s) (status) |
|---|---|---|---|---|
| F-01 | Embedded shared credentials | SRC-09 | **PARTIAL** — opt-in/encrypted/scanned, not removed (§5) | M2-0056 (TODO) |
| F-02 | Command authority drift | SRC-03/04 | **PARTIAL** — `CommandControl` now authenticates proposal ownership (nonce + `webContentsId`), but no adapter reaches `'verified'` (§3) | M2-0079 (TODO) |
| F-03 | Egress coverage gaps | — | **PARTIAL** (newly dispositioned this pass) — `docs/NETWORK-EGRESS.md` documents a real, enforced `egressAllowlist` policy, on both the main-process `fetch` and the Chromium session, with two dedicated test files (`src/main/net/egress-policy.test.ts`, `egress-guard.test.ts`) and once-per-session audit logging (`net.egress.blocked`) — **but the policy is opt-in, not a default**: `docs/NETWORK-EGRESS.md:69`, "Absent key: no restriction (today's behavior for every install)" — the guard runs only when managed config sets `egressAllowlist`. Even when configured, the same doc names its own gap: raw `https.request` sockets (e.g. MSAL) and child processes are not seen by the guard. | M2-0147 (TODO) |
| F-04 | Deployment-dependent auth | SRC-02 | **OPEN: not statically closable** — beyond SRC-02's licensing-compiled-off finding, closing this needs the license-server's actual deployed managed-config (roles, revocation, recovery flow) exercised against a real deployment, which a source-only read cannot produce. | M2-0145 (TODO) |
| F-05 | Unestablished multi-customer scope | SRC-02/17 | **FIXED** (newly dispositioned this pass) — `docs/MANTU-IT-REQUEST.md:119` states the boundary plainly: "Restricted to the Mantu tenant (single-tenant) so only Mantu accounts can sign in." That is exactly `required_change`'s ask ("state internal boundary; no unsupported tenant-isolation claims"), and it is enforced, not just claimed: `src/main/auth.ts:113` (comment naming the `common`/`organizations`/`consumers` multi-tenant aliases) and `:121` (`TENANT_GUID_RE`, GUID-only) reject anything but the single configured tenant GUID; `src/main/auth.test.ts:125` behaviorally tests that rejection; `docs/security/AUDIT-10.md:17` and `AUDIT-20.md:17` independently confirm there is no multi-tenant SQL to isolate. | M2-0145 (TODO) |
| F-06 | Ignored adapter result | SRC-04 | **PARTIAL — result no longer ignored (tested); still never reaches "verified"** (§3, re-anchored this pass) | M2-0082, M2-0083 (both TODO) |
| F-07 | Incomplete actions / close missing | SRC-05 | **REPRODUCES** — confirmed at HEAD, no general close-app/tab adapter | M2-0084, M2-0085 (both TODO) |
| F-08 | Discarded Jev decisions | SRC-03 | **REPRODUCES**, documented as deliberate ("Advisory only" at `:234`, the discard itself at `:235`) (§3, corrected anchor) | M2-0122 (TODO) |
| F-09 | Missing Laya integration | — | **REPRODUCES** (corrected in round 3 — round 2 called this `OPEN: not statically closable` and asked the owner to define "Laya"; that question is dropped) — a repo-wide, word-bounded `git grep -i -w laya` at HEAD (`70de3c30`) returns **zero hits**; every earlier apparent match (`overlayAllowsMinimize`, `displayAccelerator`, `replayAfterDrain`, `parkOverlayAfterHide`, …) was a case-insensitive *substring* inside an unrelated camelCase identifier, not the word "Laya." Jev is the only wired decision provider, off by default — `src/main/metis-command-register.ts:22,49` (`jevEnabled`, defaulting false until the heartbeat's `decisionProviders.jev` switches it on), `src/main/metis-decide-client.ts` (the `/v1/decide` client) — and the ledger already defines and tracks Laya's absence: M2-0124 is literally "Qualify the Laya alternative behind `/v1/decide` without any Jev dependency." A source-only pass can close this: Laya integration is confirmed missing, not merely undefined. | M2-0124 (TODO) |
| F-10 | Capped-list aggregate | SRC-10 | **REPRODUCES** — `dashboard.ts:736,1349`, unchanged (§4/§5) | M2-0106 (TODO) |
| F-11 | Late null overwrites usage | SRC-10 | **FIXED** (corrected — was REPRODUCES) — `d1.ts:76-110`'s `ownedAskUpsertSql` and `store.ts:139`'s `mergeOwnedAsk` are provenance-aware merges that retain device ownership (`d1.ts:109`'s `WHERE`) and take `MIN(ts)`; every column without a bespoke rule falls through to `d1.ts:105`'s default, `COALESCE(excluded.x, asks.x)` — the latest *non-null* value wins, so a late null can no longer erase a stored value, which closes exactly the late-null-overwrite pattern F-11 named. This is behaviour-tested, not merely source-read: `operator/src/ask-ingest-integrity.test.ts` (`testStore()` at `:66-72`, covering both `memory` and a real `node:sqlite`-backed `d1` store) proves combined write-order survival (`:118`), a rating kept after a late Worker meter write (`:134`), MQA-346 delivered-failover isolation (`:145`), and a losing device never overwriting the winning Ask (`:193`) — all green in CI run `36269153417` (`✓ src/ask-ingest-integrity.test.ts (27 tests)`); `security-harden.test.ts:75-76` independently confirms a cross-device overwrite returns 403. MASTER §23's required closure for this finding ("Provenance-aware merge with device ownership retained") is met. **This is narrower than SRC-10 itself**: SRC-10's own cumulative-monotonic exit evidence ("1/15/30 is 30") asks for a maximum-style aggregate, which `COALESCE`'s latest-non-null-wins semantics does not provide — an out-of-order non-null write (e.g. `15` arriving after `30`) still overwrites the higher value, and that specific case remains untested. SRC-10 stays PARTIAL for that reason and for `dashboard.ts`'s unrelated capped aggregates (F-10). | M2-0106 (TODO) |
| F-12 | Incomplete usage/stream persistence | SRC-17 | **REPRODUCES** — SRC-17's silent memory-store fallback bears directly on this (§4) | M2-0106 (TODO) |
| F-13 | People/device/session conflation | SRC-13 | **PARTIAL** — see SRC-13 (§4); default-on persistent voiceprint retention is the live risk | M2-0106 (TODO), M2-0220 (TODO) |
| F-14 | Onboarding/right-edge failures | — | **PARTIAL** (corrected in round 3 — round 2's tree grep for `#196`/`#197` found nothing because those are tracker issue numbers, not source tokens) — `gh issue view 196` and `gh issue view 197` (`--repo mysticalsin/AskToto-Mantu`) show **both still OPEN**, both filed against the **1.9.8** tip `ac1a62d8e3`, not this ticket's `origin/m2/integration` **1.9.6** line. #197 ("packaged app honors stale `ELECTRON_RENDERER_URL`") is **fixed at the source, and provably a real change from the build it was filed against**: `ac1a62d8e3:src/main/index.ts:2065` read `process.env['ELECTRON_RENDERER_URL']` directly; HEAD's `src/main/index.ts:2064` reads the same value only through `devEnv()` (`src/main/dev-env.ts:33-35`, returns `undefined` when packaged, read exclusively at `:1491,2064`) — the tracker issue is simply not closed to match. #196 ("onboard-cta Next does not advance" in the Act-2 demo) is **neither reproduced nor refuted at HEAD**: `OnboardingDemoScene.tsx` and its demo helpers (`lib/onboarding-demo.ts`, `synthetic-cursor.ts`, `onboarding-demo-guard.ts`) are blob-identical between `ac1a62d8e3` and HEAD — the Next handler itself is present and unchanged (`:287-291`'s `onClick` calls `advance()` at `:131-136`) — but its host, `OnboardingExperience.tsx`, is a different blob at each ref, so the Next path not changing does not settle whether the reported on-screen freeze still occurs; closing #196 needs the native-UI acceptance pass **M2-0042** owns, not a source grep. | M2-0042, M2-0095, M2-0202 (all TODO) |
| F-15 | Legacy/managed privacy differences | SRC-21 | **REPRODUCES** — SRC-21's DPO-flagged posture is unchanged since the export (§4); Cloudflare default/no-retention and opt-in local rules were not re-verified this pass. | M2-0112 (TODO) |
| F-16 | Developer rediscovery | — | **REPRODUCES**: no acceptance-registry/`CURRENT.md`/`SOURCE-INDEX.json` exists at repo root on `origin/m2/integration` HEAD (§1) | M2-0011 (IN_PROGRESS) |
| F-17 | Stale architectural assessments | — | **REPRODUCES** (newly dispositioned this pass) — `docs/compliance/dpia.md` and `data-flow-onepager.md` are dated 2026-07-11 and marked "DRAFT — for DPO review, not yet adopted"; more than two months later (this ticket's own 2026-09-26 re-verification date) they carry no commit-SHA or deployment scoping and are still unadopted drafts — exactly the "stale architectural assessment" pattern named. | M2-0017 (TODO) |
| F-18 | Packaging mistaken for qualification | SRC-24 | **REPRODUCES** — CI's exclusion of license-server/native-Swift tests (SRC-24, §4/§5) is the live instance of this: a green package/CI run does not qualify those two workspaces. | M2-0002 (IN_PROGRESS) |
| F-19 | Competing release feeds/policy | SRC-18 | **REPRODUCES** — `scripts/push-both.sh`'s no-verification dual-push (SRC-18, §4/§5) is the live instance of this. | M2-0053, M2-0168 (both TODO) |
| F-20 | Unproven staging/restore | SRC-17 | **OPEN: not statically closable** — SRC-17's silent production-store fallback (§4) is the closest static evidence, but proving/disproving an actual staging-environment restore/rollback needs a real deployment exercise, which a source-only pass cannot produce. | M2-0103, M2-0159 (both TODO) |

**Corrected from round 1 (by round 2):** F-03, F-05 and F-17 move from `UNKNOWN` to real, evidenced dispositions; F-11 moves from `REPRODUCES` to `FIXED at source`; F-04, F-09, F-14, F-20 move from `UNKNOWN`/vague framing to an explicit `OPEN: not statically closable`, each naming exactly what evidence would close it; F-15/18/19 move from "Bears on SRC-x" to a stated disposition tied to that same SRC evidence.
**Corrected from round 2 (by round 3, §10):** F-09 moves from `OPEN: not statically closable` to `REPRODUCES`; F-14 moves from `OPEN: not statically closable` to `PARTIAL`; F-05 moves from the non-standard `PARTIAL, FIXED-leaning` to `FIXED`; F-03's and F-17's "newly closed" wording is corrected to "newly dispositioned"; F-11 moves to a plain `FIXED`, behaviour-tested by `ask-ingest-integrity.test.ts`/`security-harden.test.ts` (SRC-10 keeps the untested cumulative-monotonic gap); F-16's non-standard "Blocker unchanged" is restated as `REPRODUCES`.

---

## 7. R80 — the source-export register entry itself

**OBSERVED (kit, read-only):** R80 (`MASTER.md:4342-4346`) states the export's "source commit and actual deployed identities [are] unknown. 14/19 linked source sections present. No complete application execution." Every SRC-01…24 anchor is a *static* finding against this one 1.9.5 snapshot.
**This pass's addition:** the SHA-256 is independently re-verified (§1); the "14/19 present" claim is now independently re-verified across all **58** paths named by either the findings or the map (not just the 19), with a real mechanical diff keyed on `SOURCE-INDEX.json`'s exact section boundaries rather than assumed (§2, Appendix); all 5 `NOT_IN_EXPORT` files were confirmed to exist and were read live at HEAD (§2). R80's caveat about not having a source commit/deployed-identity match is still true and cannot be resolved from a source-export text file alone — it would need the export's *actual* originating commit, which nothing in the kit records.

---

## 8. Open items for the Opus planner

1. **One new ledger ticket is warranted: M2-0220.** Every other gap this pass reproduced already has an owning TODO/IN_PROGRESS ticket (§5, §6); the SRC-04 residual (§3) sharpens M2-0082/83/84/85's acceptance criteria (they must make at least one real adapter path return `'verified'`, not just add more `'unknown'` returns) without a ticket of its own. But SRC-13's default-on persistent voiceprint retention (`src/shared/ipc.ts:1348-1350` schema default, `:1725` `DEFAULT_SETTINGS`) is covered by no existing acceptance criterion — M2-0109's own acceptance (its only `SRC-13` reference) is limited to "Speaker labels never treated as identity or authority," nothing about the retention default. Proposed ticket: **title** "Fresh-install speaker-ID default must not persist a voiceprint without explicit opt-in"; **acceptance** — a fresh install with no explicit opt-in writes no persistent voiceprint (including the operator's own profile); persistent enrollment happens only after an explicit, approved opt-in; an existing `voiceprints.json` from the old default migrates without a destructive surprise; a behaviour test proves the fresh-default case persists nothing; **needs_decision** — the owner's call on whether default-on retention (a 2026-08-21 product decision, MQA-235/Plaud parity, documented in `ipc.ts`'s own adjacent comment) is intended, or must become opt-in. **M2-0220** is filed in `tickets.json`, with a new **D-31** in `DECISIONS.md` for the `needs_decision` dependency (`docs/metis-2.0/ledger/tickets.json`, `docs/metis-2.0/DECISIONS.md`).
2. **Owner-decision candidates, none of which a code change alone resolves:** SRC-14 (accessibility vs. product-identity motion), SRC-19/SRC-21 (both self-documented conscious trade-offs inviting a DPO/owner sign-off — SRC-21's specifically dating to export time, not this pass), SRC-02's dev-lease-key detector (`embeddedLicenseLeasePubkeyAvailable()`) sitting unused since before the export — someone should decide whether it's wired into `check:release` or removed as dead code. SRC-13's `speakerId` default-on setting is a fourth candidate, now tracked as **D-31** (item 1 above) rather than left as a loose note.
3. **§1's blockers (F-16) are unchanged**: no acceptance-registry JSON or `CURRENT.md` exists at repo root on `origin/m2/integration` at this ticket's own re-verification time (2026-09-26). M2-0011 (traceability matrix + CI check, IN_PROGRESS) is the ticket to watch for this closing.
4. **This report does not re-open or re-score any F-item beyond what its cited evidence supports.** Three F-items (F-03, F-05, F-17) were newly dispositioned this pass with fresh HEAD evidence outside the SRC rows' own anchors — F-05 to FIXED, F-03 to PARTIAL (opt-in, not default), F-17 to REPRODUCES; two more (F-09, F-14) are corrected in round 3 to real dispositions (REPRODUCES and PARTIAL respectively, §6, §10) after round 2 left them as an open owner-question; F-04 and F-20 remain `OPEN: not statically closable` with the specific missing evidence named — read as "not closable from this pass's kind of evidence," never as "confirmed still open forever."
5. **F-09 is closed by this pass, not deferred to the owner.** Round 1's validator asked round 2 to confirm literal `Laya` hits in three named files; none exist. Round 2 then asked the owner what "Laya" refers to before closing it — but the ledger already answers that (M2-0124: "Qualify the Laya alternative behind `/v1/decide` without any Jev dependency"), and a repo-wide, word-bounded search independently confirms the integration is missing. §6 disposes F-09 as **REPRODUCES**; no owner question remains open here.

---

## 9. What changed between round 1 and round 2 of this document

Round 1 of `SRC-REVERIFY.md` was reviewed by the Opus validator and found to contain several ungrounded claims. This section is the change log for that review; §0-§8 above are the corrected document, not round 1.

1. **The mechanical diff now covers all 58 paths named by `FINDINGS.json`'s `evidence[]` arrays (union `MAP-COVERAGE.json`'s 19 nodes), not only the 19 map nodes**, keyed exactly on `SOURCE-INDEX.json`'s `content_start_line`/`content_end_line` (§2, Appendix).
2. **Six "new since the export" claims were false; all six are corrected to "already in the export, byte-identical":** SRC-02's `license-lease-key.ts`/`verifyLease`/`checkLicenseGrace`; SRC-13's `deleteProfile`/`speaker-id-off-switch.test.ts`; SRC-15's `onboarding-hero-video.ts`; SRC-16's `package.json` prebuild/postbuild chain; SRC-21's `docs/AUDIT-LOG.md` "Erasure stance"; SRC-22's `mode-skills.ts` (§4, exec-summary item 4 rewritten).
3. **SRC-10/F-10/F-11 were wrong.** Round 1 called `operator/src/d1.ts`'s `ownedAskUpsertSql` an unchanged flat overwrite and `store.ts`'s growth "unrelated." At HEAD, `d1.ts:76-110` merges with `COALESCE`, `MIN(ts)` and delivered-attempt protection, keeping the device-ownership `WHERE` at `:109`; `store.ts:139`'s `mergeOwnedAsk` is the matching memory-store fix. Corrected: SRC-10 → PARTIAL, F-10 → REPRODUCES (dashboard caps unchanged), F-11 → FIXED at source (runtime proof owed by M2-0106).
4. **SRC-13 was incomplete.** Round 1 didn't check `speakerId`'s default. It defaults to `{ enabled: true }` (`src/shared/ipc.ts:1348-1350,1725`) — persistent auto-enrollment is on by default, contradicting `required_change`. Corrected: REPRODUCES for the default-on retention; the command-authority half still holds.
5. **SRC-01, SRC-12 used non-standard dispositions ("N/A / self-resolving", "Likely reproduces").** Corrected to the required vocabulary — PARTIAL (with the checkout identity, manifest and green-run-on-`70de3c30` evidence, set against SRC-24's exclusions) and REPRODUCES (MeetingController.swift is byte-identical) respectively. Line anchors were added to the SRC-05, 11, 15, 16, 19, 22, 23 and 24 rows in §5.
6. **Anchors were wrong or inconsistent in three places.** SRC-03/F-08's discarded decision is `void result` at `metis-command-runtime.ts:235`, under the "Advisory only" comment at `:234` — not line `:82`, which is only the fire-and-forget call. §5's SRC-04 row cited `command-control.ts:88-99`; it now matches §3's `:85-111`/`:104-106`. SRC-17's `:623` is confirmed not verbatim-identical to `:206` (no `opts.store` at `:623`), though both reach the same fallback.
7. **F-01…F-20 all now carry a real disposition.** `UNKNOWN` (F-03, F-09, F-14, F-17), `partly UNKNOWN` (F-04, F-05) and "Bears on SRC-x" (F-15, F-18, F-19, F-20) are gone. F-03, F-05 and F-17 are closed with fresh HEAD evidence (`docs/NETWORK-EGRESS.md`; `docs/MANTU-IT-REQUEST.md:119`; the compliance docs' stale draft dates). F-09's specific claim — three confirmed `Laya` hits — was checked and found false; it is `OPEN: not statically closable` with the actual (negative) search recorded. F-04, F-14, F-20, genuinely runtime-only, are `OPEN: not statically closable` with the missing evidence named.
8. **The verification is now reproducible in-line.** The Appendix below carries the exact script, keyed on `SOURCE-INDEX.json`, and its full 58-row output — `scripts/trace/diff-export.py` was never committed (out of this ticket's `scope_paths`, which names only this document) and does not exist in the repo; a reader re-runs the Appendix script against the kit copy, not a path this ticket cannot touch.
9. **The footer's "was not committed by this pass" is removed** — the lead committed round 1 of this file in `d57850c`; that sentence was a claim about a prior repo state, not this one.

---

## 10. What changed between round 2 and round 3 of this document

Round 2 of `SRC-REVERIFY.md` was reviewed by the Opus validator and found to contain one overcorrection and several remaining gaps. This section is the change log for that review; §0-§8 above are the corrected document, not round 2.

1. **F-09 reverses round 2's own correction.** Round 2 checked round 1's claim of three literal `Laya` hits, found none, and concluded `OPEN: not statically closable`, asking the owner to define "Laya." A repo-wide, word-bounded `git grep -i -w laya` at HEAD still returns zero hits, but Jev is the only wired decision provider, off by default, in Laya's place (`metis-command-register.ts:22,49`, defaulting false until the heartbeat's `decisionProviders.jev` switches it on; `metis-decide-client.ts`'s `/v1/decide` client) and the ledger already defines and tracks Laya (M2-0124, "Qualify the Laya alternative behind `/v1/decide` without any Jev dependency") — so this pass closes F-09 as **REPRODUCES** and drops the owner question everywhere it appeared (§0, §6, §8).
2. **F-14 gets the tracker's real state, not a tree grep for issue numbers.** `gh issue view 196|197 --repo mysticalsin/AskToto-Mantu` shows both **OPEN**. #197 ("packaged app honors stale `ELECTRON_RENDERER_URL`") is fixed at the source (`dev-env.ts:33-35`'s `devEnv()` gate, read exclusively at `index.ts:1491,2064`) though the tracker issue itself is not closed to match; #196 ("onboard-cta Next does not advance," the Act-2 demo) is **neither reproduced nor refuted at HEAD** — `OnboardingDemoScene.tsx:287-291`'s Next handler (calling `advance()` at `:131-136`) is present and unchanged, but both #196 and #197 were filed against the **1.9.8** tip `ac1a62d8e3`, not this ticket's `origin/m2/integration` **1.9.6** line, so confirming the reported on-screen freeze needs the native-UI acceptance pass **M2-0042** owns, not a source read. Corrected: F-14 `OPEN: not statically closable` → **PARTIAL**.
3. **SRC-13 needed a new ledger ticket, and round 2 said it didn't.** M2-0109's acceptance — the only ticket `kit_refs` names against SRC-13 — covers solely "Speaker labels never treated as identity or authority"; nothing in the ledger covered the default-on retention SRC-13's own `required_change` flags. **M2-0220** is filed (`docs/metis-2.0/ledger/tickets.json`), with **D-31** opened in `docs/metis-2.0/DECISIONS.md` for the owner's call on the default.
4. **F-03's egress policy is opt-in, and "newly closed this pass" overstated three rows.** `docs/NETWORK-EGRESS.md:69`: "Absent key: no restriction (today's behavior for every install)" — a default install enforces nothing. F-03, F-05 and F-17's summary wording is corrected from "newly closed this pass" to "newly dispositioned," which does not imply the underlying gap is shut.
5. **F-05 gets a real disposition instead of `PARTIAL, FIXED-leaning`.** Stronger evidence exists at HEAD than round 2 cited: `auth.ts:113,121`'s `TENANT_GUID_RE` rejects the `common`/`organizations`/`consumers` aliases by construction, `auth.test.ts:125` tests that rejection, and `docs/security/AUDIT-10.md:17`/`AUDIT-20.md:17` confirm no multi-tenant SQL exists to isolate. Corrected: **FIXED**, with those anchors.
6. **§5's anchor-less rows now carry a HEAD `file:line`.** SRC-01 (`package.json:3`, `build.yml:22,58,115,211,360`), SRC-08 (`ai-gateway.ts:14-23`, bare `catch` at `:21`), SRC-18 (`push-both.sh:10-17`), SRC-23 (`mi-5-dust-e2e.md:7`), SRC-24 (`build.yml:22,58,115,211,360`, `license-server/package.json:13`); M2-0005 added to SRC-24's owning tickets (its `kit_refs` already lists `SRC-24`).
7. **Five factual slips are fixed.** §0 item 2's "three CHANGED paths" sentence in fact named mostly IDENTICAL files (`mode-skills.ts`, `speaker-id-off-switch.test.ts`, `onboarding-hero-video.ts`, `docs/AUDIT-LOG.md` are IDENTICAL; only `license.ts` was genuinely mis-described, and `package.json`'s CHANGED status is a version-string diff, not the prebuild/postbuild chain) — rewritten. §2's `desktop-adapters.ts` row said "(unchanged locations)"; `okResult()` moved from the export's `:56` (15 call sites) to HEAD's `:88` (14 call sites) — corrected. `speaker-id-off-switch.test.ts` gets its own §2 row (it has a `SOURCE-INDEX` section, `content_start_line`/`content_end_line` `145866-146146`, 281 lines, IDENTICAL — same slice method as every other row), since it sits outside the 58 formally-scoped paths. `CommandControl.confirm()` is `:85-111`, not `:85-110` (the code-block's own closing-brace comments were off by one). SRC-17's "38 `operator/` test files construct `memoryStore()` directly" is **33** at `70de3c30` (recounted directly, not assumed).
8. **The Appendix script is rewritten to be re-runnable as-is.** It now takes `<kit_dir> <repo> <ref>` as argv and reads HEAD content live via `subprocess.run(['git','-C',repo,'show',f'{ref}:{path}'])`, distinguishing an absent path (`git`'s `does not exist` fatal) from a genuine read failure (raised, not silently treated as absent). Independently re-run this pass: byte-for-byte identical output to round 2's stored table, same totals (41 IDENTICAL / 12 CHANGED / 5 NOT_IN_EXPORT over 58 paths).
9. **F-11 is fully FIXED, not merely fixed-and-unverified.** `operator/src/ask-ingest-integrity.test.ts` (`testStore()` at `:66-72`, covering both `memory` and a real `node:sqlite`-backed `d1` store) behaviourally proves the `d1.ts:105` `COALESCE(excluded.x, asks.x)` merge — combined write-order survival (`:118`), a rating kept after a late Worker meter write (`:134`), MQA-346 delivered-failover isolation (`:145`), and a losing device never overwriting the winning Ask (`:193`) — all green in CI run `36269153417` (`✓ src/ask-ingest-integrity.test.ts (27 tests)`); `security-harden.test.ts:75-76` independently confirms a cross-device overwrite returns 403. F-11 is corrected from round 2's own wording — "**FIXED at source** (corrected — was REPRODUCES) ... runtime proof (that this is exercised correctly under concurrent writes in production) still owed by M2-0106" — to plain **FIXED**, meeting MASTER §23's required closure ("Provenance-aware merge with device ownership retained"). SRC-10 stays **PARTIAL** — not because the merge is untested, but because `COALESCE`'s latest-non-null-wins semantics is not a cumulative maximum (SRC-10's own "1/15/30 is 30" exit evidence remains untested and unmet) and `dashboard.ts`'s capped aggregates (F-10) are unchanged. F-16's "Blocker unchanged" is restated as **REPRODUCES** to match the rest of the table's vocabulary. `metis-command-register.ts` (SRC-04's live-wiring citation, §3) is noted as CHANGED against the export (37→60 lines) though it sits outside the 58 formally-scoped paths.

---

## Appendix — the mechanical-diff script and its full output

This script is not committed to the repository (this ticket's `scope_paths` names only this document). It is reproduced here in full, re-runnable as-is with three positional arguments — no pre-fetch step, no scratch directory to populate by hand.

```python
#!/usr/bin/env python3
"""Mechanical diff: metis-1.9.5-export.txt sections vs a live git ref.

Keyed on source-review/SOURCE-INDEX.json's content_start_line/content_end_line
(1-based, str.splitlines coordinates into the export text). For each path in
FINDINGS.json's evidence[] (unioned with architecture/MAP-COVERAGE.json's 19
file-backed nodes), extracts the indexed line range from the export if the
path has a SOURCE-INDEX section, otherwise reports NOT_IN_EXPORT. Compares the
extracted section (trailing-whitespace-trimmed per line) against
`git -C <repo> show <ref>:<path>`, read live, using difflib. Every path is
read exactly once; nothing is fetched or staged up front.

Usage: python3 diff-export.py <kit_dir> <repo> <ref>
  kit_dir = .../Metis-2.0-Upgrade-Kit-r11 (holds references/source, source-review, architecture)
  repo    = a local checkout of mysticalsin/AskToto-Mantu (any clone; read-only)
  ref     = the git ref to read content from, e.g. origin/m2/integration
"""
import json, difflib, subprocess, sys

def load_export_lines(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.read().splitlines()

def read_at_ref(repo, ref, path):
    """(exists, lines). exists=False means the path is genuinely absent at ref
    (git's 'does not exist' fatal); any other non-zero exit is a read failure
    and raises, so an absent path is never conflated with a broken read."""
    proc = subprocess.run(
        ["git", "-C", repo, "show", f"{ref}:{path}"],
        capture_output=True, text=True, errors="replace"
    )
    if proc.returncode != 0:
        if "does not exist" in proc.stderr:
            return False, None
        raise RuntimeError(f"git show {ref}:{path} failed (exit {proc.returncode}): {proc.stderr.strip()}")
    return True, proc.stdout.splitlines()

def main():
    if len(sys.argv) != 4:
        sys.exit("usage: diff-export.py <kit_dir> <repo> <ref>")
    kit_dir, repo, ref = sys.argv[1], sys.argv[2], sys.argv[3]

    export_lines = load_export_lines(f"{kit_dir}/references/source/metis-1.9.5-export.txt")
    index = json.load(open(f"{kit_dir}/source-review/SOURCE-INDEX.json"))
    sections = {s["path"]: s for s in index["sections"]}

    findings = json.load(open(f"{kit_dir}/source-review/FINDINGS.json"))
    findings_paths = set()
    for fnd in findings["findings"]:
        for ev in fnd["evidence"]:
            findings_paths.add(ev["path"])

    mapcov = json.load(open(f"{kit_dir}/architecture/MAP-COVERAGE.json"))
    map_paths = {n["path"] for n in mapcov["nodes"]}

    all_paths = sorted(findings_paths | map_paths)

    rows = []
    for path in all_paths:
        head_exists, head_lines = read_at_ref(repo, ref, path)

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
            rows.append((path, "Yes", "MISSING_AT_HEAD", f"export {len(export_section)} lines; absent at {ref}"))
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

Invocation used for this pass: `python3 diff-export.py /Users/tony/AI-Brain-build/metis-kit-r11/Metis-2.0-Upgrade-Kit-r11 /Users/tony/AI-Brain-build/metis-operator-ux 70de3c303a047879afd8651a78b41c0ce85dcc3c`. Pinned to the exact commit this pass's anchors were read against, not the moving `origin/m2/integration` ref — the branch has since advanced well past this commit, so re-running against the branch name would diff a different tree than the one this document describes.

**Full output, this pass (2026-09-26), 58 paths — independently re-run against the rewritten script above (round 3), byte-for-byte identical to round 2's stored output:**

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

*End of SRC-REVERIFY (round 3). Written for ticket M2-0013. No file under `/Users/tony/AI-Brain-build/metis-operator-ux` (the public repo worktree) was created, modified, or deleted while producing this report — every code citation above is a `git show <ref>:<path>` read. This file itself lives only in the private `metis-2.0-program` repo; round 1 was committed there in `d57850c`, round 2 in `8876e1c`, and this round's revision is committed by this pass on a dedicated ticket branch (`m2-0013-src-reverify-round3`) via a draft PR into `main`, not a direct push.*
