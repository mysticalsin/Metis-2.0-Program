# Source register: sanitized baseline of every workspace, client and deployment (M2-0015 / TASK-001)

Ticket M2-0015. Deliverable for TASK-001 (kit refs M2-BASE-01, R01, R72, AGSTEP-01, AGUC-001, AGUC-002, AGX-01, COV-43, HC-01, SRC-01). Investigation only. Nothing was deployed, pushed, installed, run or modified, and no test, npm, node or app command was run (owner decision D-28).

## 0. How to read this register

Labels: **OBSERVED** = read directly in this worktree, or quoted from the in-repo sanitized prior-execution record with its file:line. **DERIVED** = conclusion from OBSERVED rows. **ASSUMED** = inferred, not proven. **UNKNOWN** = not knowable from here. **BLOCKED_EXTERNAL** = needs the owner's outside account, with the exact read-only step. `LEAD_ACTION:` lines are steps only the lead may do.

Freshness: every Cloudflare, GitHub and installed-client row is a copy of a 2026-09-24 (live checks 04:01Z to 04:07Z) or 2026-09-26 owner-session observation. This register did not re-run any of them. Read each as "was true on that date", not "is true now".

Sanitization rules applied: no secret values, no Cloudflare account ID or ID fragment, no D1 database ID or fragment, no personal email address, no personal workers.dev or Access team hostname (shown as a placeholder), no OneDrive tenant path, no local user name (paths shortened to `~`), no full Worker version UUID (8-character prefix only; the full value sits at the cited line). Secret names appear as names only. Section 9 records the scans.

Sources (all in this repo unless stated):
- P1 = `docs/metis-2.0/review/prior-exec/tasks/TASK-001/source-register.md`
- P2 = `docs/metis-2.0/review/prior-exec/tasks/TASK-001/service-register.md`
- K10 = `docs/metis-2.0/review/lanes/K10-git-github.md`
- OR = `docs/metis-2.0/review/OPERATOR-REALITY.md` on branch `origin/m2-0014-operator-reality` at 777843a (M2-0014 deliverable, read with `git show origin/m2-0014-operator-reality:docs/metis-2.0/review/OPERATOR-REALITY.md`; not yet on main)
- M = `docs/metis-2.0/kit/r11/spec/MASTER.md`

## 1. Program repository (this private repo): branches and worktrees

Commands (this worktree, 2026-09-28): `git worktree list`; `git for-each-ref --format='%(refname:short) %(objectname:short) %(committerdate:short)' refs/heads refs/remotes/origin`; `git status --short` (empty output). Every local branch has an identical `origin/` twin at the same SHA (OBSERVED, compared row by row), except `m2-0057-sanitize-prior-exec` (local only, 88106e2) and the `origin` alias ref (a9b9ecd, same as main).

Owner column: the program owner owns the repository. Each `m2-NNNN-*` branch is the working branch of pipeline ticket M2-NNNN (branch-name convention, DERIVED). Dirty state is OBSERVED only for this worktree. Other worktrees are outside this session's readable directory, so their dirty state is UNKNOWN here (see LEAD_ACTION below).

| Worktree path | Branch | SHA (short) | Dirty state | Owner |
|---|---|---|---|---|
| ~/AI-Brain-build/metis-wt-M2-0015 (this one) | m2-0015-pin-actual-system-sanitized | a9b9ecd | clean at start (OBSERVED `git status --short`); this deliverable is the only change | pipeline, ticket M2-0015 |
| ~/AI-Brain-build/metis-prog-main | main | a9b9ecd | UNKNOWN | program owner |
| ~/AI-Brain-build/metis-2.0-program | (detached HEAD) | 5bb0a34 | UNKNOWN | program owner |
| ~/AI-Brain-build/metis-prog-M2-0212 | m2-0212-film-toolchain | 5a3a2e4 | UNKNOWN | pipeline, ticket M2-0212 |
| ~/AI-Brain-build/metis-quarantine-M2-0092-Metis-2.0-Program | m2-0092-visual-deps | 607b3ea | UNKNOWN (directory name marks it quarantined) | pipeline, ticket M2-0092 |
| ~/AI-Brain-build/metis-wt-M2-0005 | m2-0005-record-real-verification-baseline | aa1f316 | UNKNOWN | pipeline, ticket M2-0005 |
| ~/AI-Brain-build/metis-wt-M2-0010 | m2-0010-orphan-cleanup-runbook | 2790c92 | UNKNOWN | pipeline, ticket M2-0010 |
| ~/AI-Brain-build/metis-wt-M2-0011 | m2-0011-generate-traceability-matrix-from | 57385f2 | UNKNOWN | pipeline, ticket M2-0011 |
| ~/AI-Brain-build/metis-wt-M2-0012 | m2-0012-issue-owner-decision-packet | d761570 | UNKNOWN | pipeline, ticket M2-0012 |
| ~/AI-Brain-build/metis-wt-M2-0013 | m2-0013-re-verify-11-unknown | 13f408e | UNKNOWN | pipeline, ticket M2-0013 |
| ~/AI-Brain-build/metis-wt-M2-0013-round3 | m2-0013-src-reverify-round3 | 5820c5c | UNKNOWN | pipeline, ticket M2-0013 |
| ~/AI-Brain-build/metis-wt-M2-0014 | m2-0014-operator-reality | 777843a | UNKNOWN | pipeline, ticket M2-0014 |
| ~/AI-Brain-build/metis-wt-M2-0019 | m2-0019-run-kit-s-own | b205f37 | UNKNOWN | pipeline, ticket M2-0019 |
| ~/AI-Brain-build/metis-wt-M2-0020 | m2-0020-hindsight-pin-round2 | e2b5bd8 | UNKNOWN | pipeline, ticket M2-0020 |
| ~/AI-Brain-build/metis-wt-M2-0021 | m2-0021-sanitized-evidence | 1325da8 | UNKNOWN | pipeline, ticket M2-0021 |
| ~/AI-Brain-build/metis-wt-M2-0022 | m2-0022-dock-disposition | 4c29948 | UNKNOWN | pipeline, ticket M2-0022 |
| ~/AI-Brain-build/metis-wt-M2-0023 | m2-0023-run-independent-audits-plan | 4c645e8 | UNKNOWN | pipeline, ticket M2-0023 |
| ~/AI-Brain-build/metis-wt-M2-0057 | m2-0057-owner-approval-blocker | 8cfafec | UNKNOWN | pipeline, ticket M2-0057 |
| ~/AI-Brain-build/metis-wt-M2-0101 | m2-0101-settings-design | c520ed8 | UNKNOWN | pipeline, ticket M2-0101 |
| ~/AI-Brain-build/metis-wt-M2-0102 | m2-0102-cf-speech-route | 6b28225 | UNKNOWN | pipeline, ticket M2-0102 |
| ~/AI-Brain-build/metis-wt-M2-0188 | m2-0188-integration-runbook | 8798a4d | UNKNOWN | pipeline, ticket M2-0188 |
| ~/AI-Brain-build/metis-wt-M2-0189 | m2-0189-policy-one-pager | b757b2e | UNKNOWN | pipeline, ticket M2-0189 |
| ~/AI-Brain-build/metis-wt-M2-0189c | m2-0189-policy-clean | 4e92ad6 | UNKNOWN | pipeline, ticket M2-0189 |
| ~/AI-Brain-build/metis-wt-M2-0194 | m2-0194-re-run-freeze-reopen | 4bc4d05 | UNKNOWN | pipeline, ticket M2-0194 |
| ~/AI-Brain-build/metis-wt-M2-0196 | m2-0196-classify-which-packaged-gates | 8198c22 | UNKNOWN | pipeline, ticket M2-0196 |
| ~/AI-Brain-build/metis-wt-M2-0201 | m2-0201-produce-designed-prototypes-2 | 676b72c | UNKNOWN | pipeline, ticket M2-0201 |
| ~/AI-Brain-build/metis-wt-M2-0262 | m2-0262-add-hm-flow-01 | 5228fb4 | UNKNOWN | pipeline, ticket M2-0262 |
| ~/AI-Brain-build/metis-wt-M2-0265 | m2-0265-close-m2-0120-acceptance | a556be5 | UNKNOWN | pipeline, ticket M2-0265 |
| ~/AI-Brain-build/metis-wt-M2-0331 | m2-0331-reconcile-single-memory-path | a2507fe | UNKNOWN | pipeline, ticket M2-0331 |
| ~/AI-Brain-build/metis-wt-M2-0377 | m2-0377-decide-engineering-source-graph | 2aa9b72 | UNKNOWN | pipeline, ticket M2-0377 |
| ~/AI-Brain-build/metis-wt-M2-0386 | m2-0386-publish-host-binding-table | 8a15aeb | UNKNOWN | pipeline, ticket M2-0386 |
| (no worktree) | m2-0057-sanitize-prior-exec | 88106e2 | not applicable (local-only ref, no working tree) | pipeline, ticket M2-0057 |

DERIVED: the worktree count and SHAs above are a point-in-time snapshot from 2026-09-28 and move whenever a ticket branch advances. Re-run the two commands to refresh.

LEAD_ACTION: from the program repository, run `git worktree list --porcelain` and, for each path above, `git -C <path> status --porcelain | wc -l`, and paste the counts into the Dirty state column (a read-only step; this session could not read other worktrees).

## 2. Public product repository (`mysticalsin/AskToto-Mantu`): source checkouts, branches and worktrees

Source: P1 section 1 and section 5, K10 sections 1 and 2 (observed 2026-09-24 to 2026-09-26). Not re-run here. Every row is a dated observation; tracking refs were stale when read (P1:334, no fetch was run).

### 2.1 Baseline source checkout

| Field | Value | Label and source |
|---|---|---|
| checkout | `~/AI-Brain-build/metis-2.0`, linked worktree of the operator-ux clone | OBSERVED P1:11-12 |
| branch / HEAD | `claude/metis-2.0-task-001` / 2bf21f1c (full SHA at P1:14) | OBSERVED P1:13-14 |
| public main | 2bf21f1c (same as HEAD), committed 2026-09-23, branch protected | OBSERVED P1:15-16 |
| dirty state | 0 files, tracked and untracked | OBSERVED P1:18 |
| package version | asktoto 1.9.6; native app MARKETING_VERSION 1.9.6 | OBSERVED P1:20-21 |
| drift from the MASTER anchor | tag v1.9.5 (fff88c26) is an ancestor of main; main is 53 commits ahead | OBSERVED P1:23 |
| the branch on GitHub | absent from all 103 origin heads; byte-identical to main | OBSERVED K10:37 |

### 2.2 Worktrees of the operator-ux clone

| Path | Branch | SHA | Dirty state | Owner | Source |
|---|---|---|---|---|---|
| ~/AI-Brain-build/metis-operator-ux | codex/operator-ux-rock-1 | 5e988489 | clean; upstream wrongly set to origin/main; all work is on GitHub | program owner (Codex tool prefix) | K10:17, K10:36 |
| ~/AI-Brain-build/metis-2.0 | claude/metis-2.0-task-001 | 2bf21f1c | clean | program owner (baseline for TASK-001) | K10:18, K10:37 |
| **~/AI-Brain-build/metis-win-signing** | claude/windows-artifact-signing | 2bf21f1c | **dirty, substantial**: 14 modified tracked files (release workflow, electron-builder config, package.json, signing and verification scripts and tests) plus 15 untracked files including a new signing-preflight workflow; a stray file named `NUL`; not on origin (a differently named `wip/windows-artifact-signing-snapshot` branch is) | program owner (Windows-signing lane, in flight) | K10:19, K10:38 |
| ~/AI-Brain-build/metis-v2-program | docs/metis-2.0-program | 2bf21f1c | dirty (1 untracked directory `docs/metis-2.0/`); not on origin | program owner (scratch) | K10:20, K10:39 |
| two detached scratch worktrees under the system temp directory | (detached) | 0b872d64 | prunable | another session | K10:21 |

**metis-win-signing is recorded here and untouched.** This register only quotes K10. No command in this ticket was run against that path, and no file in it was read, staged, cleaned or pruned (OBSERVED: this ticket's command list is in section 8). Any later ticket that needs it must copy the state through the owner, not edit in place.

### 2.3 Owner's other clones and worktrees (sanitized inventory)

Source: P1:332-403, observed 2026-09-24, read with `git --no-optional-locks`, no fetch. The full per-file dirty lists are in `docs/metis-2.0/review/prior-exec/tasks/TASK-001/source-register.json`. Counts below are dirty file counts as observed then.

| Group | Paths (under `~/dev` or `~/AI-Brain-build`) | Branch and SHA examples | Dirty state | Owner |
|---|---|---|---|---|
| Product-repo worktrees with real uncommitted source edits | `dev/metis-pr58` (41), `dev/metis-pr144-local` (17), `metis-ci-verify` (14), `dev/metis-review-fix-1` (7), `dev/metis-portal` (4), `dev/metis-183-pack` (2), `verify-v1.3.0-gate` (39 untracked QA scripts), `metis-1.2.0-rebase` (4), `metis-1.1.0` (1) | e.g. `dev/metis-pr58` overlay-68-show 811fed9e; `dev/metis-review-fix-1` codex/metis-review-fix-1 55f8b06b | dirty as counted | program owner (preserved, P1:402) |
| Product-repo worktrees, clean | `dev/metis-cap3-cp-gate` a5eb53dc, `dev/metis-dock-design` 57ba07af, `dev/metis-fix3` a4fa77eb, `dev/metis-fx3` a105a258 (holds the PR 194 head), `dev/metis-pr195-ver` 5bc7ce01, `dev/metis-voice-action-v1` 8f1c7b93, `dev/metis-rf3` ac1a62d8, `dev/metis-enterprise-audit-20260909` de418ae1, `asktoto-release-v13`, `asktoto-win-src`, `metis-1.5.4-build` 14e4e6d8, `metis-sec` 144f1a1e, `metis-tx-work` 36c8ec3f, `metis-183-show`, `metis-183-pack` (detached) 2eee2e1d | as listed | clean (or one untracked symlinked `node_modules`, P1:401) | program owner |
| Detached candidate worktrees | `dev/metis-fe-cand-12c295e9`, `dev/metis-fe-cand-2f06669e`, `dev/metis-fe-eye-*` (4), `dev/metis-fe-only-318e0ab2`, `dev/metis-fe-sot-d7307a22`, `dev/metis-glass`, `dev/metis-638`, `dev/metis-verify-2.0` e23160a2, `dev/metis-1.9.5-release-audit` 24ced518 | full SHAs in P1:339-368 | only an untracked `node_modules` symlink (or two untracked design notes) | program owner |
| Other product-repo clones | `dev/metis-cp`, `dev/metis-fq`, `dev/metis-notes-graph`, `dev/metis-operator-restore`, `asktoto-main` (0/-384 vs origin/main), `metis-2.0` (section 2.1) | P1:344, 356, 359, 360, 375 | mostly `node_modules` symlink or `operator/.wrangler/` untracked | program owner |
| Unrelated repositories under the same folder | CosyVoice, TotoWhisper (13 dirty), Wisp (13 dirty), holo-inspect, impeccable, mantu-presentation-center (38 dirty), neutts-air, tetris-go, thought-topology, a personal notes repo, two personal framework repos, and the parent `~/AI-Brain-build` repo itself (10 modified tracked files) | P1:338, 370-395 | as counted in P1 | program owner (not Métis 2.0 sources; recorded for completeness only) |
| **OneDrive-hosted worktrees** | `dev/metis-prove-b-src` and `~/AI-Brain-build/asktoto-cahe-build`; their git directories live inside the owner's OneDrive "Apps Source" folder | not readable | **UNREADABLE**: reads timed out (25 s and 90 s), files are dataless placeholders (P1:365, 374, 397) | program owner |

Owner decision D-21 (OPEN, due 2026-10-18; `docs/metis-2.0/DECISIONS.md:130`) asks whether those two OneDrive worktrees hold work to preserve. Until the owner answers, the default in that row applies: treated as holding nothing to preserve, agents never delete them, the owner may repair OneDrive sync. **ASSUMED**, not verified, because the contents cannot be read.

### 2.4 Remote branch inventory of the product repo

OBSERVED (K10:25, K10:47): 103 remote heads on 2026-09-26; only 5 are checked out anywhere locally. Naming clusters by author tool: `cursor/*` about 24, `claude/*` about 15, `codex/*` about 8, `fix/*` about 16, `feat/*` about 15, `release/*` 3, plus ad hoc names (K10:50). Branches relevant to 2.0 (K10:54-61): `metis-2.0-dock-lineage` (ahead 31, behind 58 of main), `metis-2.0-inventory` (holds the off-main production Operator commits, see section 4), `codex/review-release-1.9.1` (0/64), `feat/operator-wow` (0/272), `fix/settings-orb-stability-20260905` (0/337), `release/1.9.1` (0/86). The 103-line dump itself lives outside the repo (`git ls-remote --heads origin` in the operator-ux clone); rerunning it is the read-only refresh.

## 3. Installed client versions (owner's Mac)

OBSERVED 2026-09-24 (P2:139-161, `PlistBuddy` on `Contents/Info.plist` and `codesign -dv`). Not re-run here. The M2-0014 operator-reality report (OR) contains no installed-client rows; its scope is the Worker and D1, so these rows come from P2, which OR itself cites as its base.

All bundles are Electron, identifier `com.mantu.asktoto`, name Metis, minimum macOS 12.0, universal (x86_64 and arm64).

| Bundle | Version | Bundle time (local) | Signature | Note |
|---|---|---|---|---|
| /Applications/Metis.app | 1.8.9 | 2026-09-07 | ad-hoc, hardened runtime, no team identifier; deep strict verify exit 0 | the installed production client; 1.9.6 on main is newer |
| ~/Applications/Metis.app | 1.5.4 | 2026-08-19 | ad-hoc, no team | old copy |
| ~/Applications/Metis-18cf5b73-qa.app | 1.9.1 | 2026-09-20 | ad-hoc, no runtime flag | QA copy; embedded tip labels disagree (18cf5b73 vs a text file naming 2eb2b612) |
| ~/Applications/Metis-7e54a08-qa.app | 1.9.1 | 2026-09-20 | ad-hoc | QA copy from release/1.9.1 CI artifact |
| ~/Applications/Metis-a694db9c-qa.app | 1.9.1 | 2026-09-20 | ad-hoc | QA copy; tip a694db9c is not an ancestor of main; stale tip text file |

- OBSERVED (P2:151): bundled helper `metis-mac-helper` inside 1.8.9 is ad-hoc, linker-signed, no team identifier.
- OBSERVED (P2:153): the native SwiftUI app (`com.mantu.metis.native`, source version 1.9.6 build 1) is **not installed** in any searched location; only preference and container traces exist.
- OBSERVED (P2:154): uninstalled build outputs at 1.9.5, 1.9.6, 1.9.8 and 1.8.9 exist in local build folders.
- DERIVED (P2:19, P2:177): 0 valid code-signing identities on the Mac and every installed client is ad-hoc; signing is not working yet.
- UNKNOWN (P2:152, 233): Gatekeeper assessment and running Métis processes could not be read (sandbox errors quoted there).
- Update feed: OBSERVED (P2:130) provider github, repository `mysticalsin/Metis-Releases` (public); `releases/latest` = v1.6.6 (2026-08-26) with Windows assets only; drafts v1.8.9, v1.9.1, v1.9.8; published prerelease v1.9.6-unsigned (2026-09-24). Product repository releases: latest v1.8.9 (P2:131).
- Windows clients: no Windows machine was inspected. UNKNOWN.

## 4. Deployed Worker and D1 identity (from operator-reality)

Primary source: OR sections 1 and 3 on `origin/m2-0014-operator-reality`, which cite P2:11-16, 51-53, 102-113. Freshness: last owner-session read 2026-09-24. Today's identity is **BLOCKED_EXTERNAL** (below).

### 4.1 Operator Worker (production)

| Field | Value | Label and source |
|---|---|---|
| Worker name | `metis-operator` | OBSERVED P2:44 |
| deployed version | `5ef9fc5a…` (full UUID at P2:53 and OR:9), created 2026-09-20T17:14Z, 100 percent | OBSERVED OR:9-10, P2:53 |
| deploy stamp | plain var `OPERATOR_VERSION` = 9568d21; `OPERATOR_BUILT_AT` = 2026-09-20T17:11:47.923Z | OBSERVED OR:11, P2:51 |
| source of the stamp | commit 9568d21 is a pre-rewrite hash; post-rewrite equivalent 926036a0 has an identical tree; both exist only on the off-main branch `metis-2.0-inventory` | OBSERVED OR:39, OR:41 (tree identity checked with the GitHub API) |
| relation to main | the live build is not an ancestor of public main 2bf21f1c; `operator/` differs by 33 files (1142 insertions, 694 deletions in P2:60; OR:36 records the opposite direction); live has `/v1/decide`, main does not | OBSERVED P2:57-60, OR:36-37 |
| live secrets (names only) | OPERATOR_ADMIN_PASSWORD, OPERATOR_INGEST_SECRET, OPERATOR_PROMPT_KEY, OPERATOR_SKILL_PRIVATE_KEY, OPERATOR_VAULT_KEY, POLICY_AUD | OBSERVED P2:52 |
| stale secret | OPERATOR_ADMIN_PASSWORD is referenced by no source tree; that it is safe to delete is ASSUMED | OBSERVED OR:12; ASSUMED OR:13 |
| runtime config | compatibility date 2026-08-31, handlers fetch and scheduled, cron `17 3 * * *` in source, D1 binding `DB`, assets binding `ASSETS` | OBSERVED P2:45-50 |
| public probe | the workers.dev host answers HTTP 302 to the Cloudflare Access login (2026-09-24 04:01Z), so Access wraps the portal | OBSERVED P2:137 |
| today's deployed version | not re-checked | **BLOCKED_EXTERNAL**; read-only step: run `npx wrangler deployments list --name metis-operator` from `operator/`, or `curl -s https://<operator-host>/health` (returns version and builtAt, no credentials; host is `DEPLOYED_URLS.production` in `operator/scripts/deploy.mjs:43`), OR:16-17, 20 |
| staging Worker | `metis-operator-staging` **does not exist** (Cloudflare error code 10007); its D1 id in config is a placeholder; host returns HTTP 404 | OBSERVED P2:82-85 |
| D1 live-vs-source table gap | live count is 28 (`d1 info`); source defines 19 tables; the 9-table gap is unexplained | OBSERVED P2:110, 112; UNKNOWN cause. **BLOCKED_EXTERNAL**; read-only step: from `operator/` run `npx wrangler d1 execute metis-operator --remote --command "SELECT type, name FROM sqlite_master WHERE type='table' ORDER BY name"` and diff against the 19-name list in OR:93 (after dropping `_cf_` names and `sqlite_sequence`) |
| historical ciphertext in Asks | whether any live row still has a non-null `prompt_cipher` | UNKNOWN OR:117; read-only step OR:128 (`SELECT COUNT(*) FROM asks WHERE prompt_cipher IS NOT NULL`) |

### 4.2 D1 database

| Field | Value | Label and source |
|---|---|---|
| database name | `metis-operator` (binding `DB`) | OBSERVED P2:49, 106 |
| database ID | recorded in P2:49 and P2:106 as a shortened value; intentionally not copied into this register | sanitized |
| created | 2026-09-01T16:54:09Z | OBSERVED P2:107 |
| region / jurisdiction | ENAM / none; read replication disabled | OBSERVED P2:108 |
| size, 24 h traffic | 4.56 MB; 75,069 read queries, 5 write queries (aggregate counters only) | OBSERVED P2:109, 111 |
| migration level | UNKNOWN: no `migrations/` directory, schema is two idempotent SQL files applied by `operator/scripts/migrate.mjs`; nothing records which statements were applied live | OBSERVED P2:117; UNKNOWN P2:122 |

### 4.3 Other Cloudflare and hosting identities (sanitized)

| Identity | Value | Label and source |
|---|---|---|
| Account | one account, owned by a personal (non-organisation) login; account ID and email withheld | OBSERVED P2:29-30 (values redacted at source and here) |
| Access team | `https://<account-subdomain>.cloudflareaccess.com` (host withheld) | OBSERVED P2:32 |
| workers.dev subdomain | `<account-subdomain>.workers.dev` (withheld) | OBSERVED P2:33 |
| Gateway worker | `metis-cloudflare-proxy`; current version `095ab3d2…` created 2026-08-25, source "Secret Change"; last code upload 3afc7f80… on 2026-08-21; `/health` answers 200; live code SHA UNKNOWN (no version stamp; timestamp correlation points to ddc9b78b, ASSUMED) | OBSERVED P2:93-99; ASSUMED P2:100 |
| Gateway worker secrets (names only) | CF_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, METIS_PROXY_KEY, METIS_PROXY_KEYS | OBSERVED P2:97 |
| Gateway worker vs main | main has three later proxy commits (+366/-4 in 3 files) not live | OBSERVED P2:100 |
| AI Gateway ID | UNKNOWN. The proxy sets no gateway variable, so it uses the account default (`cloudflare-proxy/src/index.ts:38-40`). **BLOCKED_EXTERNAL**; read-only step: Cloudflare dashboard, AI, AI Gateway, list view (read only), record only the gateway name | OBSERVED P2:34 (no var); UNKNOWN id |
| Access bypass policy scope | whether the Bypass policy path scope equals `ACCESS_BYPASS_PATHS` | **BLOCKED_EXTERNAL**; read-only steps OR:77-79 |
| license-server | Fly.io app in region iad (config file `license-server/fly.toml`); live existence and state NOT_AVAILABLE (the `fly` CLI was sandbox-blocked); **BLOCKED_EXTERNAL**; read-only step: `fly status --app <app-name>` by the owner | OBSERVED P2:128 |
| intelligence workspace | not a deployed service; bundled into the desktop app | OBSERVED P2:129 |
| CI runners | GitHub-hosted only: ubuntu-latest, windows-latest, macos-latest, windows-2022 (preflight); no self-hosted runners; no environments; main head CI run green on 2bf21f1c (a build result, not a signed release) | OBSERVED P2:187-197 |
| Forgejo mirror | documented, not verifiable (SRC-18); no readable clone has a Forgejo remote | OBSERVED P1:405-416; **BLOCKED_EXTERNAL**, blocker text at P1:453 |

## 5. Unavailable inputs (MASTER section 2.5)

Source: M:215-225 (the section 2.5 table and rows) and P1:418-430. P1 status is 2026-09-24. This register did not search for any of these again.

| Input | Status | Detail and label | Read-only step or owner action |
|---|---|---|---|
| Original Claude master-plan artifact (R74) | FOUND but coverage unproven | OBSERVED P1:425: a private document titled as a PRD was read through the owner's connector, outline only, content not copied. ASSUMED to be the artifact R74 names (title says PRD). M:222 and BLOCKERS still say "not recovered", which P1 calls stale. No diff against MASTER exists, so full coverage of the artifact must not be claimed | Owner-authorized read of the document, then diff against MASTER (BLOCKED_EXTERNAL: needs the owner's account) |
| Separately promised refactoring skill | NOT_AVAILABLE, identity UNKNOWN | OBSERVED P1:426: no refactor file in the repo, no match in the R72 brief. Five installed skills were seen but none is identified as the promised one. Owner decision D-15 (OPEN, due 2026-10-05) proposes software-architecture-engineer v1.4.0 plus Stark v9.3.0 as a substitute, `DECISIONS.md:124` | Owner names the skill, or answers D-15. Do not apply a guessed skill (M:182) |
| Onboarding video asset | NOT_AVAILABLE (NOT_PROVIDED) | OBSERVED P1:428: the welcome-video manifest reads status NOT_PROVIDED, video null, fallback text welcome. Historical lineage only: an April clip and a CC0 Aria track in the app source (SRC-15 lineage, not the owner's recording) | Owner supplies the approved recording; setup already has a static or text path (M:213) |
| Desktop-control clip verification | FILE FOUND, contents unverified | OBSERVED P1:427: reference mp4 and orb and bar reference images are in the kit references folder (hashes at P1:427). Clip audio and the complete interaction sequence were not verified (M:224). UNKNOWN | Watch the clip end to end with audio and record the interaction sequence; capture uncut native behavior, do not substitute playback (M:224) |
| Jev integration plan (R73) | NOT_AVAILABLE | OBSERVED P1:424: not found in searched locations; OneDrive coverage partial | Owner supplies path or copy |
| Original conversation and revision-3 contract | NOT_AVAILABLE as raw input | OBSERVED P1:422, carried by MASTER section 25 | none needed if MASTER stands |

## 6. Reference artifact row: HeyClicky

Source: `docs/metis-2.0/kit/r11/clicky-study/ARTIFACT.json`, read in this worktree 2026-09-28 (OBSERVED, file lines 1-32). A second copy exists under `kit/v5/baseline/.../r11-kit/clicky-study/ARTIFACT.json` (same field names).

| Field | Value | Label |
|---|---|---|
| input file | HeyClicky.dmg, 373,328,455 bytes | OBSERVED ARTIFACT.json:2-3 |
| SHA-256 | 0c7b2f7b21cc5153e4a3146cdeaff704a67aaf37e08bf06a0117d108edb7b038 | OBSERVED ARTIFACT.json:4 |
| app | HeyClicky, bundle identifier com.humansongs.clicky, version 1.0.51 build 61, minimum macOS 14.2, menu-bar-only agent | OBSERVED ARTIFACT.json:5-14 |
| self-declared build | branch main-internal-release-build, short commit ddbd4191 (a claim inside the bundle, not verified) | OBSERVED ARTIFACT.json:15-18; the claim itself is ASSUMED unverified |
| architectures | x86_64, arm64 | OBSERVED ARTIFACT.json:19-22 |
| extracted contents | 192 regular files, 824,864,616 bytes, of which 589,486,538 are a bundled Codex runtime; 15 runtime skill files; 48 markdown resources | OBSERVED ARTIFACT.json:23-27 |
| what was done | not executed, no network endpoint called, original source project not recovered, system signing trust not checked | OBSERVED ARTIFACT.json:28-31 |
| role | reference study only; it is not a Métis source or deployment | DERIVED |
| unverified | signing trust, runtime behavior, upstream source | UNKNOWN; read-only step: owner-run `codesign -dv` on the mounted app, not done here |

## 7. Owner and lead steps

LEAD_ACTION: fill the Dirty state column of section 1 (commands in the LEAD_ACTION under that table).
LEAD_ACTION: record the owner's pasted `wrangler deployments list --name metis-operator` or `/health` output and the `sqlite_master` readback, then re-label section 4.1 rows from BLOCKED_EXTERNAL to OBSERVED (same step as the M2-0014 report).
LEAD_ACTION: after the M2-0014 branch merges, change the `OR` source line in this register from the branch reference to the merged path `docs/metis-2.0/review/OPERATOR-REALITY.md`.
LEAD_ACTION: answer D-21 (OneDrive worktrees), D-15 (refactoring skill) and record the owner's input for the onboarding video, the desktop-control clip and the Jev plan, then update section 5.
LEAD_ACTION: run the gitleaks scan on this file on the machine that has it installed (`gitleaks detect --no-git --source docs/metis-2.0/baseline`) and file the output as the evidence record; this session did not run it (see section 9).
LEAD_ACTION: dispatch the independent review of this register and mark M2-0015 status in the ledger; this register does not edit `docs/metis-2.0/ledger/`.

## 8. Commands run for this register (all read-only)

`git worktree list`; `git for-each-ref` over local and origin refs; `git status --short`; `git diff --stat main...origin/m2-0014-operator-reality`; `git show origin/m2-0014-operator-reality:docs/metis-2.0/review/OPERATOR-REALITY.md`; file reads of P1, P2, K10, M, ARTIFACT.json and DECISIONS.md. Nothing was run against `metis-win-signing` or any other worktree. No network access, no test, npm, node or app run.

## 9. Sanitization and scan record

- Design: the register was written so that it contains no email address, no account or database identifier, no full UUID, no token-shaped string and no personal hostname. Values from the sources were shortened or replaced by placeholders as stated in section 0.
- Manual review (OBSERVED, by search of this file while writing): the at-sign character does not appear; no 32-character hex account IDs; Worker versions appear only as 8-character prefixes; the only 64-character hex string is the HeyClicky installer SHA-256 (public artifact hash, not a secret).
- Not done: a run of gitleaks and of an email/ID regex against this file. gitleaks was not run inside this session, so the "scan clean" acceptance criterion is **not yet proven by tool output**. The lead runs it via the LEAD_ACTION in section 7.
