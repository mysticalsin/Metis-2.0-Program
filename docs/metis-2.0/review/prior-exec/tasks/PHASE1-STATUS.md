# Phase 1 status: TASK-001 to TASK-005 (completeness critic)

| Field | Value |
|---|---|
| Written | 2026-09-24T04:54Z by the Phase 1 critic lane (Claude). Checks ran 04:45Z to 04:54Z. |
| Contract | Kit r11, MASTER rev 4.5, sha256 `e5b3c51d6d8423b5…` = `plan/registry.json` `source_sha256` (re-verified, S16) |
| Source | `mysticalsin/AskToto-Mantu` main `2bf21f1ceefe117838325342574b57852e5cadcb`, package 1.9.6, worktree clean (re-verified, S1/S2) |
| Inputs judged | `tasks/TASK-001/{source-register.md,source-register.json,service-register.md}`, `tasks/TASK-002/prd-lock.md`, `tasks/TASK-003/source-map.md`, `tasks/TASK-004/{baselines.md,baselines.json}`, `tasks/TASK-005/contracts.md`. Context only: `receipts/*` (lead), `tasks/TASK-027/reconcile.md`, `tasks/WINDOWS-SIGNING/*`, `CURRENT.md` (not modified). |
| Deduplicated blockers | `/Users/tony/AI-Brain-build/metis-2.0-exec/BLOCKERS.md` |

Labels: **MET**, **PARTIAL**, **NOT_MET**, **PENDING_LEAD** for criteria. Evidence is `file:line` in the exec dir (abbreviations below) or a command I re-ran (S-numbers in section 3). Every lane claim I could not reproduce, or that has since changed, is downgraded in section 4. Nothing here is a product pass (MASTER §33.6); synthetic and source-presence results are marked as such.

File abbreviations: `sr` = TASK-001/source-register.md, `svc` = TASK-001/service-register.md, `pl` = TASK-002/prd-lock.md, `map` = TASK-003/source-map.md, `bl` = TASK-004/baselines.md, `ct` = TASK-005/contracts.md.

---

## 1. Verdict per task

| Task | Verdict | Closable now? | Why not |
|---|---|---|---|
| TASK-001 Pin the actual system | **PARTIAL** | No | Real baseline exits exist only as lead receipts (PENDING_LEAD) and 25 skips are unexplained; Forgejo mirror unverifiable (SRC-18); live D1 schema 28 vs 19 unresolved; HeyClicky reference identity (AGX-01/HC rows) not recorded; handoff sanitization defects; no §33 independent review. |
| TASK-002 Lock PRD, policies, lanes | **PARTIAL** (0.1.0-draft) | No | §25 coverage map and §27 evidence registry not generated; threat model not updated; tenant/provider discovery not run; not owner-approved; v1.9.6 lane state stale; no independent review. Blocks 12 direct dependents. |
| TASK-003 Source map and handoff | **PARTIAL** | No | Map and task index are good; numbered lessons, always-loaded security/retention rules and a relay with active task/next action are missing; no Hindsight call-site/pin record; no review. |
| TASK-004 Size, capture, hardware | **PARTIAL** | No | Bytes fully measured and tied to exact artifacts; startup/process-tree and capture latency NOT_RUN; Windows NOT_AVAILABLE; temporary sizes derived only. |
| TASK-005 Shared contracts | **PARTIAL** (design only) | No | Depends on TASK-002 (not closed, MASTER:1889). Contracts and golden fixtures exist only as a design plus scratchpad reference copies; nothing in the repository or CI. Blocks 24 direct dependents. |

---

## 2. Criterion tables

### 2.1 TASK-001 (packet: `read_task.py --task 1`, MASTER:1920)

| # | Criterion | Judgment | Evidence |
|---|---|---|---|
| D1 | Read repository instructions | MET | sr:31-147 (no AGENTS/CLAUDE.md; DESIGN.md gate, README, DEVELOPMENT, ENTERPRISE_RELEASE, SIGNING, PLATFORM-MAP, workflows, gitleaks). S21 re-checked: 0 tracked AGENTS/CLAUDE.md. |
| D2 | Recover referenced inputs, both named briefs, §2.5 missing-input register | PARTIAL | sr:418-430. R72 FOUND (sr:423). R73 Jev plan NOT_AVAILABLE, OneDrive search incomplete (sr:424). R74 found as outline only; content diff against MASTER not done (sr:425). |
| D3 | Map all shipping workspaces | MET | sr:149-167 (13 workspaces with build entry, version, test command, CI coverage). |
| D4 | Map approved GitHub UI lineages | PARTIAL | 26 open PRs with full head SHAs (sr:191-224; S-G1 re-verified #194 head `a105a258`). Which lineage is owner-approved is UNKNOWN (sr:429; reconcile.md B3/B5). |
| D5 | Full source and PR/branch SHAs | MET | sr:9-29, 195-233. S1, S3, S4 re-verified. |
| D6 | Dirty-file ownership | PARTIAL | 59 entries (sr:336-403). Two OneDrive-hosted worktrees unreadable (sr:365, 374); `~/AI-Brain-build` untracked count timed out (sr:338). S31 re-verified 3 clones' counts. |
| D7 | Exact installed clients | MET | svc:139-161. S19 re-verified `/Applications/Metis.app` 1.8.9 `com.mantu.asktoto`. Running processes NOT_AVAILABLE (svc:161). |
| D8 | Frontend/Worker versions | MET | Operator live version and stamp (svc:40-76; S-W1/S-W2 re-verified). Proxy code SHA UNKNOWN (no stamp, svc:100). |
| D9 | Database binding and schema | PARTIAL | D1 binding/id last-4 `9f7c` (svc:102-110); 28 live tables vs 19 in source unresolved (svc:113); no migration record (svc:122). |
| D10 | Cloudflare account and gateway identities | PARTIAL | Account last-4 `<redacted-account-id>` (svc:30). AI Gateway id UNKNOWN (svc:34). |
| D11 | Available authorized tools | MET | svc:163-183; sr:28-29. |
| D12 | Never infer the live portal version from main | MET | svc:11, 53-61: live = `9568d21`, not an ancestor of main (S5, S-W2 re-verified). |
| V1 | Sanitized baseline/source register retained | PARTIAL | Content is complete and labelled. Defects: (a) `metis-2.0-exec/.wrangler/cache/wrangler-account.json` holds the **full** Cloudflare account ID (only one 32-hex value in the exec dir, scan S30); created by the TASK-002 lane running wrangler from the exec dir (pl:273). (b) svc:29, :30, :53 print the personal login email unmasked (pl masks emails). (c) svc:130 feed row is stale (section 4). |
| V2 | Real baseline test exits | **PENDING_LEAD** | No lane produced exits (sr:167, sr:445). Lead receipts exist at `receipts/BASELINE-EXITS.txt` (typecheck 0; lock-mode-skills 0; desktop vitest first run exit 1 with 6,586 passed / 0 failed / 25 skipped and 1 file unloadable because the Electron binary was absent, rerun of that file 105/105; proxy 28/28; operator 1,002/1,002; license-server 101/101; bug-ledger 0). I cross-checked the JSON reports (S27). Still missing for SRC-01: `swift test` (MetisKit) not run, 25 skips not explained (files listed in section 5), receipts not yet folded into the TASK-001 register. |
| V3 | Explicit unavailable-input list | MET | sr:418-430, 441-447, 449-458; svc:222-236. |
| V4 | Existing user work untouched | MET | S1: worktree dirty 0. S31: `~/dev/metis-pr58` 41, `~/dev/metis-review-fix-1` 7, `~/dev/metis-portal` 4 dirty entries, equal to sr:361-366. |
| V5 | No secrets or private portal data copied | PARTIAL | S30: no tokens, keys or private-key blocks in any exec-dir file (including the 2.5 MB baseline JSON). The account-ID and email defects in V1 remain. |
| SRC-01 | Exact checkout + missing-vs-present manifest; baseline on complete tree with every skip explained | PARTIAL | Manifest MET (sr:169-179; S18 re-verified blobs, lines, sha256). Baseline part PENDING_LEAD (V2). |
| SRC-15 | Recover the real onboarding media lineage | PARTIAL | Retired clip and music lineage recorded (sr:65-73, 428); Tony recording NOT_PROVIDED (S20 manifest). |
| SRC-17 | Actual deployment ID, database and schema identity | PARTIAL | Deployment and D1 ids VERIFIED (svc:53, 106); schema identity unresolved (svc:113). |
| SRC-18 | Mirror-safe release delivery | NOT_MET | `MIRROR_DOCUMENTED_NOT_VERIFIABLE` (sr:405-416). |
| SRC-20 | Failed inventory is not an empty account | MET | Staging 10007 treated as a positive answer (svc:12); Fly failure kept as NOT_AVAILABLE with the exact error (svc:128). |
| SRC-24 | Real test/build/release owner per workspace | PARTIAL | Gaps mapped (sr:151-167, map:293-303): no CI for MetisKit `swift test`, license-server `node --test` or native-app build (S13). No owner assigned. |
| EXP-12 | Evidence-based qualification facts | PARTIAL | Identities recorded; signed Windows/native Mac receipts are later tasks. |
| AGX-01, HC-01/02/06/27/32, AGSTEP-01 | Actual reference sources, rights and pins | NOT_MET | 0 matches for "HeyClicky" or "HC-0" in TASK-001 files. The kit already holds the identity: `clicky-study/ARTIFACT.json` (HeyClicky 1.0.51 build 61, sha256 `0c7b2f7b…`, `executed: false`, original source not recovered). Only CodeNotch was recorded (sr:330). |
| OBU-01 | Onboarding baseline and source binding | PARTIAL | sr:57-73 (DESIGN.md No Skip / April-29 clip conflict with §34). |
| HMSTEP-01 | Qualify Hindsight source and runtime contract | NOT_MET | No Hindsight pin, dependency diff or API fixture anywhere in Phase 1 (S19: 0 tracked Hindsight files). |
| §33 | Independent Fable/Claude review of the deliverable | NOT_MET | No packet or review for any TASK-001 file. The Fable route is qualified on a different slice (`receipts/reviewer-qualification.md` §8). |

### 2.2 TASK-002 (MASTER:1941)

| # | Criterion | Judgment | Evidence |
|---|---|---|---|
| D1 | Reconcile prior findings with current source | MET | pl:111-128 bindings; 21 conflicts C-01..C-21 (pl:167-191); spot-checked S7, S9, S10, S11, S12. |
| D2 | Cloudflare speech is the fresh-install default | PARTIAL | Locked as policy P-01 (pl:148); source still defaults to local Parakeet, recorded as C-09 (pl:179; S7). Code change belongs to TASK-005/016/027.B. |
| D3 | Optional local speech and generation defined separately | MET | P-02 (pl:149), C-04/C-10 (pl:174, 180). |
| D4 | Exact no-content-retention claim | MET | pl:161-165 (§16.6/§16.6.5 wording; display gated on readiness, all routes UNREVIEWED). |
| D5 | Update the threat model | NOT_MET | pl:259 ("not produced"). |
| D6 | Scope, Windows release path, native Mac engineering vs public signing | PARTIAL | Lanes L1-L3, P-06/P-07 (pl:153-154, 232-235, 244-250). The written Windows release-path decision is not produced (pl:259); `tasks/WINDOWS-SIGNING/DECISION-BRIEF.md` exists as input. |
| D7 | Sanitized signing/tenant/provider prerequisite discovery | PARTIAL | Signing and Cloudflare Workers done (pl:232-238; svc:199-220). Entra, Teams, Dust, Jev/Laya and AI Gateway not performed (pl:260). |
| D8 | Generate §25 coverage map and §27 evidence registry, no prefilled passes | NOT_MET | pl:258. |
| V1 | Versioned PRD and route/policy decision record cover all 55 requirements and 112 use cases | PARTIAL | Version 0.1.0-draft (pl:5); all 55 M2 rows (pl:51-109) and 112 UC rows (pl:284-399); ID totals re-verified (S16, S17: 55 with the correct regex, 53 with the naive one, as pl:41 warns). Per-requirement route decisions and the §27 registry are absent; not owner-approved (pl:9). |
| V2 | Windows/shared gates mandatory; Apple hold explicit and never blocks Windows-only signing | MET (as written policy) | P-06 (pl:153), L3 (pl:235), §3.1 (pl:246-250). The mechanical coupling in release.yml is recorded as C-11 (pl:181; S12 re-verified `needs: [release-macos, release-windows]`). |
| SRC-01 | Source presence | MET | pl:117 (S18). |
| SRC-02, EXP-08 | Entitlement authority | NOT_MET (OPEN) | C-16 (pl:186); S11 `LICENSE_ENFORCEMENT = false`. |
| SRC-09 | Embedded credentials | PARTIAL | C-15 recorded (pl:185); final-artifact scan is a later task. |
| SRC-15 | Onboarding contract | PARTIAL | C-01, C-05 (pl:171, 175). |
| SRC-18 | Mirror | NOT_MET | C-13 UNKNOWN (pl:183). |
| SRC-19 | Secret-scan exclusions | PARTIAL | C-14 (pl:184; S9 re-verified `.gitleaks.toml:35,36,41`). Canary proof is later. |
| AGX-01, HC-01, AGSTEP-01 | Reference binding | PARTIAL | pl:124 (HC-01 binding noted; no adoption record). |
| HMSTEP-01 | Hindsight | PARTIAL | P-10 and L8 name the approval blockers (pl:157, 240); nothing pinned. |
| OBU-01..05 | §34 correction | PARTIAL | P-09 (pl:156); pl:49 warns OBU is not a registry family and must be added to §27. |
| §33 | Independent review | NOT_MET | pl:262. |

### 2.3 TASK-003 (MASTER:1962)

| # | Criterion | Judgment | Evidence |
|---|---|---|---|
| D1 | Evaluate structural-index tooling without a duplicate runtime graph | MET | map:25-33 (graphify 0.9.38 present, no `graphify-out`, runtime `src/main/graphify.ts` kept separate). |
| D2 | Bounded source-linked queries | MET | map:12-23 refresh recipe; map:230-245 area index. |
| D3 | Repository/worktree freshness | MET | map:10-23 (per-row last commit). S28/S29 re-verified 164 IPC registrations, 1,944 tracked files. |
| D4 | Task index | MET | map:305-371 (TASK-006..066). |
| D5 | Relay / CURRENT.md | PARTIAL | `CURRENT.md` exists (lead-owned, 6 lines) with phase but no active task or next action. Section 6 of this file supplies next actions; the lead should link it from CURRENT.md. |
| D6 | Numbered lessons | NOT_MET | No lessons file in the exec dir. |
| D7 | Security/retention rules always loaded | NOT_MET | No always-loaded rules file; adding an AGENTS.md is recorded only as an option (pl:191, C-21). |
| V1 | A resumed agent finds source, active task and next action without re-reading the repo | PARTIAL | Source: MET. Active task / next action: missing from map and CURRENT.md (now in section 6 here). |
| V2 | Tooling permissions and provenance recorded | MET | map:27-33. |
| V3 | Optional tooling cannot delay an urgent security fix | MET | Nothing in the map gates other work. |
| SRC-01 | Export gap | MET | map:278-291 (S18). |
| SRC-24 | Coverage owners | PARTIAL | map:293-303. |
| HM-01, HMSTEP-01 | Hindsight call sites and pin | PARTIAL | `.brain`, recall, Dust and Operator call sites mapped (map:105-121, 196-209); no Hindsight pin or dependency diff. |
| §33 | Independent review | NOT_MET | None. |

### 2.4 TASK-004 (MASTER:1979)

| # | Criterion | Judgment | Evidence |
|---|---|---|---|
| D1 | Compressed sizes | MET | bl:18-29. S23/S24 re-verified exact bytes and `shasum -a 256 -c` OK x4. |
| D2 | Unpacked sizes | MET | bl:31-43 (mac lstat walk; Windows 7z listing). |
| D3 | Temporary install sizes | PARTIAL | DERIVED/ASSUMED only (bl:38-43); APFS copy denied (bl:37). |
| D4 | Resource duplication | MET | bl:169-181; T4-F06 wasm exclusion gap re-verified (S14). |
| D5 | Startup/process-tree memory and CPU | NOT_MET (NOT_RUN) | bl:206-229; the reason is sound: shared bundle id with the real 1.8.9 install, unrelocated main.log and boot login-item reconcile (S15 re-verified `index.ts:889-891`, `:8899-8906`, `logger.ts:15-22`). |
| D6 | Current capture/stream latency | NOT_MET (NOT_RUN) | bl:231-252; capture paths inventoried; no harness exists. |
| D7 | Devices, architectures, accelerators, languages | PARTIAL | Mac host MET (bl:187-198); Windows NOT_AVAILABLE; accelerator presence only; languages UNKNOWN (bl:200-204). |
| D8 | No marketing names as measured properties | MET | bl:194, 204. |
| V1 | Reproducible baseline ties bytes and performance to exact artifact/profile/device | PARTIAL | Bytes: MET (bl:7-16, 280-297). Performance: NOT_RUN. |
| V2 | Explain what remains unmeasured | MET | bl:267-278. |
| V3 | 1.57 GB inventory not mislabeled | MET | bl:183-185, 257. |
| SRC-16 | Size waterfall and OS descriptions | PARTIAL | bl:185, 265 (T4-F10). |
| EXP-12 | Pre-registered qualification | PARTIAL | Exact artifacts pinned; performance slices not run. |
| HC-03 | Bundled execution payload | MET (observation level) | bl:171, 258-259. |

### 2.5 TASK-005 (MASTER:1993)

| # | Criterion | Judgment | Evidence |
|---|---|---|---|
| Dep | TASK-002 closed | NOT_MET | TASK-002 is a draft (2.2). MASTER:1889 lets design proceed; closure cannot. |
| D1 | Extend TS/Swift contracts: selected/allowed/ready, separate speech/generation, capture generation, track, epoch, revision, operation/attempt/step identity, typed outcomes | PARTIAL | Designed (ct:66-429; Appendix A.1-A.7, C.1). Not in the repository (ct:4). |
| D2 | Migration/default fixtures before UI labels | PARTIAL | Four golden fixtures (ct:2557-2955); not in the repository. |
| V1 | Golden cross-platform fixtures and negative tests: keep explicit legacy choices, no implicit local selection, fresh eligible profile Cloudflare-default without implying consent | PARTIAL (synthetic) | ct:113-126 (I2, I7, I8; SM-01..20, CS-01..09). I reproduced it: `tsc` exit 0, self-check rebuilt from `selfcheck.mts` = 366 pass / 0 fail, Swift recompiled = 124 pass / 0 fail, and all 11 reference-file sha256 values equal ct:557-2844 (S25, S26). Not in repo or CI; Swift parity covers speech selection only (ct:500). |
| SRC-02/03/04/06/11/16/17/21/24, EXP-02/07/09 | Closure refs | PARTIAL (contract only) | ct:504-525. S8, S26-S27 re-verified SRC-03 `void result`, SRC-04 anchors gone, F1/F3/F5/F7 source claims. |
| AGX-02/06/09, HC-04/07/10/11/16/24/26, AGSTEP-02 | Agent contracts | PARTIAL (contract only) | ct:410-429. |
| §33 | Independent review | NOT_MET | None. |

---

## 3. Spot-checks (claims re-run by this lane)

All commands were read-only. `gh` and `wrangler` ran with the sandbox disabled because of the documented TLS failure; wrangler ran from the session scratchpad with the worktree's binary, and I confirmed afterwards that no `.wrangler` directory exists in the worktree or `operator/`.

| # | Lane | Claim | Command (abridged) | Result | Verdict |
|---|---|---|---|---|---|
| S1 | all | HEAD = origin/main = 2bf21f1c, branch claude/metis-2.0-task-001, 0 dirty | `git rev-parse`, `git status --porcelain --untracked-files=all` | as claimed, dirty 0 | REPRODUCED |
| S2 | 001 | package 1.9.6, `.nvmrc` 22.22.3 | `node -p`, `cat .nvmrc` | as claimed | REPRODUCED |
| S3 | 001 | fff88c26 is an ancestor; main 53 commits ahead | `merge-base --is-ancestor`, `rev-list --count` | rc 0, 53 | REPRODUCED |
| S4 | 001/003 | 7d684b24 not an ancestor; only in `origin/claude/dock-three-fixes`; main has `devEnv('ELECTRON_RENDERER_URL')` at index.ts:1491, :2064 from fca1e6b5 | `merge-base`, `for-each-ref --contains`, `git grep`, `git log -S` | rc 1; that ref only; both lines; fca1e6b5 | REPRODUCED |
| S5 | 001 svc | 9568d21 not an ancestor; only `origin/metis-2.0-inventory`; merge base 7e54a08; operator diff 33 files +1142/-694; decide route only in 9568d21 | `merge-base`, `branch -a --contains`, `diff --shortstat`, `ls-tree` | as claimed; decide files 2 at 9568d21, 0 at HEAD | REPRODUCED |
| S6 | 001/003 | staging D1 placeholder at `operator/wrangler.jsonc:51` | `sed -n 51p` | `REPLACE_AFTER_D1_CREATE` | REPRODUCED |
| S7 | 002/005 | `ipc.ts:1629` provider cloudflare, `:1698` asrEngine parakeet, `:1700` cloudSttProvider unconfigured | `sed -n` | as claimed | REPRODUCED |
| S8 | 003/005 | `metis-command-runtime.ts:235 void result`; flushPending/mark_committed absent | `sed`, `git grep` | present; 0 hits | REPRODUCED |
| S9 | 001/002 | `.gitleaks.toml:35,36,41` allowlist tests and docs | `sed -n` | as claimed | REPRODUCED |
| S10 | 002/005 | Operator sends payload-log-off and skip-cache but not `cf-aig-collect-log: false` | `sed -n 226,234p operator/src/use.ts`; grep | line 232 returns only the two headers; no exact `cf-aig-collect-log'` key outside tests | REPRODUCED (pl cites :228-233; the return is at :232) |
| S11 | 002 | `App.tsx:311 LICENSE_ENFORCEMENT = false` | `sed -n 311p` | as claimed | REPRODUCED |
| S12 | 002 | release.yml:308-313 couples publication (`needs: [release-macos, release-windows]`) | `sed -n` | as claimed | REPRODUCED |
| S13 | 001/003 | no workflow runs swift, xcodebuild, license-server or native-app | `grep -nE` over workflows | 0 lines | REPRODUCED |
| S14 | 004 | `electron-builder.yml:57` wasm exclusion, absent from mac.files 147-160 | `sed`, `grep -c` | present at :57; 0 in 147-160 | REPRODUCED |
| S15 | 004 | ASKTOTO_USERDATA only moves userData; boot login-item reconcile; logger path override only for non-browser | `sed -n` on index.ts and logger.ts | as claimed | REPRODUCED |
| S16 | 002 | MASTER sha256 = registry source_sha256; 55/112/66/44/24 | `shasum`, python | as claimed | REPRODUCED |
| S17 | 002 | M2 regex trap (55 vs 53) | `grep -oE` both patterns | 55 / 53 | REPRODUCED |
| S18 | 001/003 | five export-gap files: blobs, line counts, sha256 prefixes | `git rev-parse HEAD:<f>`, `wc -l`, `shasum` | all equal to sr:173-177 and map:284-288 | REPRODUCED |
| S19 | 001 svc/002 | `/Applications/Metis.app` 1.8.9 `com.mantu.asktoto`; 0 Hindsight files; only Teams file is the logo | PlistBuddy, `git ls-files` | as claimed | REPRODUCED |
| S20 | 001 | welcome manifest NOT_PROVIDED | `cat` kit manifest | as claimed | REPRODUCED |
| S21 | 001/002 | no tracked AGENTS.md/CLAUDE.md | `git ls-files` | 0 | REPRODUCED |
| S22 | 003 | all 42 SRC evidence paths exist at HEAD | python over registry | 42, none missing | REPRODUCED |
| S23 | 004 | installer bytes 1,827,062,492 / 1,826,300,776 / 1,532,977,165 / 1,523,263,850; size gate 1.7/1.9 GiB | `stat -f %z`; `sed -n 30,34p scripts/check-release.mjs` | as claimed | REPRODUCED |
| S24 | 004 / lead | local upload bytes match SHA256SUMS; published SUMS equals the receipt copy | `shasum -a 256 -c SHA256SUMS.txt`; `cmp` | OK x4; identical | REPRODUCED |
| S25 | 005 | reference-file sha256 values in ct Appendix A/B; `tsc` exit 0; self-check 366/0 | `shasum`; `tsc -p`; esbuild rebuild of `selfcheck.mts` then run | 11/11 hashes equal; exit 0; 366/0 from a fresh rebuild | REPRODUCED |
| S26 | 005 | Swift golden parity 124/0 | Xcode toolchain `swiftc -swift-version 6` with a local module cache, then run on `speech-selection.v1.json` | pass=124 fail=0 | REPRODUCED |
| S27 | 005 / lead | F1/F3/F5/F7 source claims; lead baseline JSON counts | `sed` on store.ts:691-703, enterprise-live-profile.ts:46-51, command-control.ts:97-110; `git grep ingestTranscript`; python over `receipts/baseline-*.json` | as claimed; desktop 6,611/6,586/0 failed/25 pending, local-routing 105/105, operator 1,002/1,002, proxy 28/28 | REPRODUCED |
| S28 | 003 | 164 `ipcMain.handle/on`; preload exposes `toto` at :561 | `grep -c`, `grep -n` | as claimed | REPRODUCED |
| S29 | 003 | 1,944 tracked files; 18 tables in schema.sql | `git ls-files \| wc -l`; `grep -ci` | as claimed | REPRODUCED |
| S30 | all | exec dir holds no secrets or full account IDs | regex scan for tokens, PEM keys, 32-hex, emails | no tokens or keys; **one** full 32-hex account ID in `.wrangler/cache/wrangler-account.json`; 3 email occurrences at svc:29, :30, :53 | PARTIAL (defects recorded) |
| S31 | 001 | Tony's clones untouched | `git --no-optional-locks status --porcelain \| wc -l` on three clones | 41 / 7 / 4, equal to the register | REPRODUCED |
| S-G1 | 001/002 | Metis-Releases v1.9.6-unsigned state; /releases/latest; PR #194 head; main protection; CI run 35872259580 | `gh release view`, `gh api …/releases/latest`, `gh pr view 194`, `gh api …/branches/main`, `gh run view` | **published** prerelease 2026-09-24T04:14:36Z, assets dmg/zip/Portable/Setup/SHA256SUMS, no latest*.yml; latest v1.6.6; #194 head a105a258; main 2bf21f1c protected; run success on 2bf21f1c | REPRODUCED for sr; **pl and svc superseded** (section 4) |
| S-W1 | 001 svc/002 | live metis-operator deployment 2026-09-20T17:14:07Z, version 5ef9fc5a (100%) | `wrangler deployments list --name metis-operator` | as claimed | REPRODUCED |
| S-W2 | 001 svc/002 | live stamp OPERATOR_VERSION 9568d21, built 2026-09-20T17:11:47Z, compat 2026-08-31; staging code 10007 | `wrangler versions view 5ef9fc5a…`; `wrangler deployments list --name metis-operator-staging` | as claimed | REPRODUCED |

Result: 34 checks. 33 reproduced as stated; S30 found the two sanitization defects. The only claims I downgrade are state claims that were true when read and have since changed (section 4).

---

## 4. Downgraded or superseded lane claims

| Where | Lane claim | Current state | New label |
|---|---|---|---|
| pl:197-200, pl:232 (L0 row), pl:222 | v1.9.6-unsigned is a draft, only SHA256SUMS.txt attached, tag ref HTTP 404; CI artifacts must be uploaded before 2026-09-26T14:28Z | Published prerelease at 2026-09-24T04:14:36Z with 4 installers + SHA256SUMS, no latest*.yml, not Latest (S-G1); tag exists (sr:310). Lead receipt `receipts/RELEASE-v1.9.6-unsigned.md` records the upload, download-back verification and the owner decision. §2.4 conditions: 1 MET, 2 MET, 3 MET (title), 4 MET (S24 plus lead download-back), 5 UNKNOWN (Forgejo), 6 policy, 7 NOT_MET (docs PR). | SUPERSEDED |
| pl:182, pl:195 | Tony's decision ASSUMED | The lead receipt quotes an AskUserQuestion answer and a message from Tony (2026-09-23). This file cannot verify Tony's own words; it stays ASSUMED here, now with a lead-recorded source. | ASSUMED (lead-recorded) |
| svc:130 | Newest feed entry "v1.9.6-unsigned Draft" | Published prerelease (S-G1) | SUPERSEDED |
| sr:326, sr:436, sr:457 | Who published v1.9.6-unsigned is UNKNOWN | Lead receipt says the lead published it on Tony's recorded decision | ASSUMED (lead-recorded) |
| ct:543 | TASK-002 outputs NOT_AVAILABLE | `prd-lock.md` 0.1.0-draft exists (not closed) | SUPERSEDED (blocker still open: not closed) |
| ct:544, ct:33 (F4) | Deployed Operator `/v1/decide` UNKNOWN | Deployed build 9568d21 contains `operator/src/decide.ts` (S5; svc:11); main does not | SUPERSEDED: route exists only in the off-main deployment |
| bl:14 | Local files = CI artifacts: ASSUMED | Local upload bytes = published release bytes VERIFIED (S24 + lead download-back). Equality to the CI artifact zip contents is still ASSUMED (not downloaded). | Partly upgraded |
| reconcile.md B1 (context) | No Mac package of main 2bf21f1c located | `~/AI-Brain-build/release-1.9.6/upload/Metis-1.9.6.dmg` is the run-35872259580 build (sha256 `1687e2ca…`, S24). The real constraint is an isolated QA host (TASK-004 §9). | SUPERSEDED |

Consistent across lanes (no conflict): #197. The map says 7d684b24 is not in HEAD (map:332); the register adds that main has a code-site equivalent via fca1e6b5 (sr:232). Both are true (S4). TASK-027 work should use both facts.

---

## 5. Gaps no lane closed

1. **Baseline completeness (PENDING_LEAD).** Not in any baseline receipt: `cd native-app/MetisKit && swift test`; `npx vitest run --config operator/scripts/vitest.config.ts` as its own CI-equivalent run (7 operator/scripts files do appear in the operator report); `npm run build`; intelligence `lint` and `smoke`. The 25 skipped desktop tests are unexplained: OnboardingExperience.browser.test.ts (6), check-ffmpeg-sidecar.test.ts (4), win-security.test.ts (3), fetch-llama-server.test.ts (2), mac-helper-privacy.test.ts (2), ffmpeg-decoder.test.ts (2), mac-helper.test.ts (2), and one each in verify-signing, apple-speech, cli-win and llm/local-runtime (from `receipts/baseline-desktop.json`).
2. **Reference artifact identity (AGX-01/HC).** Add a TASK-001 row from kit `clicky-study/ARTIFACT.json`: identity, `executed: false`, study-only rights per HC-27, no redistribution.
3. **Hindsight (HMSTEP-01).** No upstream release pin, SDK/OpenAPI, dependency diff or API compatibility fixture.
4. **TASK-003 handoff pieces.** Numbered lessons, an always-loaded security/retention rules file, and a relay pointer from CURRENT.md to this file.
5. **TASK-002 closure artifacts.** §25 coverage map, §27 evidence registry (all NOT_TESTED, OBU-01..05 explicit), threat model, §16.6.1 route evidence record, written Windows release-path decision.
6. **Independent review (§33.5).** None of the seven Phase 1 files has a review packet.
7. **Security hygiene seen in passing.** Production `metis-operator` holds `OPERATOR_ADMIN_PASSWORD`, referenced by neither main nor 9568d21 (svc:14); the deployed build includes "ACCESS bypass /v1/decide" (svc:57), which needs security review under M2-SEC-02.
8. **R74 content diff.** The PRD doc was read at outline level only; its content has not been diffed against MASTER (sr:425).

---

## 6. Exact next actions (in order)

1. **Lead:** delete `/Users/tony/AI-Brain-build/metis-2.0-exec/.wrangler/` (tool cache holding the full account ID), mask the email at svc:29, :30, :53, and rerun the S30 scan. Run future wrangler calls from the scratchpad, not the exec dir.
2. **Lead:** fold `receipts/BASELINE-EXITS.txt` into the TASK-001 register. Explain each of the 25 skips (section 5.1). Run or record NOT_RUN with the exact error for `swift test` in `native-app/MetisKit` (swiftc works in this sandbox with `-module-cache-path` inside the scratchpad, S26), `operator/scripts/vitest.config.ts`, `npm run build`, and intelligence lint/smoke. Do this in an isolated worktree if the in-flight install is still running.
3. **Lead or Codex:** add the HeyClicky reference row to the TASK-001 register (section 5.2). Refresh the superseded rows in section 4 (pl §2.4 and L0, svc:130, ct:543-544, reconcile B1).
4. **Codex (TASK-002 slice 2):** generate the §25 coverage map and §27 evidence registry with every ID NOT_TESTED and OBU-01..05 explicit, the threat-model update, a §16.6.1 route evidence record (UNREVIEWED), and the Windows release-path decision citing `tasks/WINDOWS-SIGNING/DECISION-BRIEF.md`. Bump prd-lock to 0.2.0-draft.
5. **Lead:** run independent Fable/Claude reviews (`tools/dual_agent.py packet`, MASTER §33.5) on prd-lock.md and contracts.md first (they gate 12 and 24 tasks), then the TASK-001/003/004 registers.
6. **Tony:** answer, in your own words with a date: C-03, C-08, C-16, C-18 (pl:173, 178, 186, 188); the TASK-005 §13 items 1-5 (ct:527-537; the privacy owner decides items 3 and 5); the shipping line and dock lineage (reconcile B3/B5); then approve prd-lock. That closes TASK-002 and unblocks TASK-005.
7. **Tony:** state whether the Forgejo mirror is live and authoritative. If it is, push `v1.9.6-unsigned` to the Forgejo twin before the next 8 h sync (sr:326).
8. **Tony:** authorize two read-only probes: `fly status -a asktoto-license` (sandbox off) and `wrangler d1 execute metis-operator --remote --command "SELECT name FROM sqlite_master WHERE type='table'"` (a query POST, so it needs explicit authorization).
9. **Tony:** decide whether 9568d21's three off-main commits get a reviewed merge into main or a deliberate revert, before any Operator deploy from main. Confirm the stale `OPERATOR_ADMIN_PASSWORD` can be removed.
10. **Tony:** provide an isolated macOS QA account or VM (no `com.mantu.asktoto` install) and a Windows x64 test machine. Then run bl:215-227 and bl:246-251 for TASK-004 and the packaged P1 proofs for TASK-027/028.
11. **Codex, after step 6:** implement TASK-005 contracts on a branch in an isolated worktree (`src/shared/contracts/*`, golden fixtures, Swift mirror), invert `src/shared/asr-engine.contract.test.ts:38` visibly, and add CI jobs for MetisKit `swift test` and license-server `node --test` (SRC-24) in the same reviewed series.
12. **Codex:** TASK-003 completion (lessons file, always-loaded rules proposal; an AGENTS.md in the repo needs Tony's approval under the DESIGN.md gate) and the HMSTEP-01 Hindsight pin (read-only upstream research). The lead updates CURRENT.md to point here.
13. **Tony:** name the Entra tenant admin, Teams admin, Dust workspace admin, Jev/Laya account holders and the privacy/legal owner, so tenant/provider discovery can run (pl:260).

What this lane did not do: it modified no lane file, the kit, the source worktree, CURRENT.md or any clone; it made no remote write; it ran no npm script in the worktree.
