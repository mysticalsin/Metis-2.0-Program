# TASK-001 (part 2): service, client and tool register

- Observed: 2026-09-24, live checks between 04:01Z and 04:07Z (curl `date:` header `Thu, 24 Sep 2026 04:01:53 GMT`).
- Source baseline: `/Users/tony/AI-Brain-build/metis-2.0`, HEAD `2bf21f1ceefe117838325342574b57852e5cadcb`, branch `claude/metis-2.0-task-001`, package `1.9.6`. Read only. `GIT_OPTIONAL_LOCKS=0 git status --porcelain` printed 0 lines after all checks, and no `.wrangler`/`node_modules/.cache/wrangler` directory was created.
- Evidence labels: **VERIFIED** means the command or file:line is quoted. **ASSUMED** means inferred and not proven. **UNKNOWN** means not determined. **NOT_AVAILABLE** means the input could not be read, with the exact error.
- Redaction: the Cloudflare account ID shows only its last 4 characters. The D1 database_id also shows only its last 4 (it is committed in the source, but it is shortened here anyway). No secret values, tokens, certificate thumbprints or portal data were read or copied. Only secret names appear.
- MASTER §33 applies: a service answering, or a file existing, proves identity only. It is not a product or runtime acceptance pass.

## 0. Headline findings

1. **The live portal is not built from main.** Production `metis-operator` serves version `5ef9fc5a-0f9e-4bed-8907-c17776fcc3b3` (created 2026-09-20T17:14:06Z), stamped `OPERATOR_VERSION="9568d21"`. Commit `9568d21` exists only on remote branch `metis-2.0-inventory` and **is NOT an ancestor of main 2bf21f1c**. The merge base is `7e54a08`. In `operator/`, main and the live build differ by 33 files (+1142/−694). The live build has `/v1/decide` (`operator/src/decide.ts`), which main lacks. Main has later ask/pulse integrity and D1 store changes that the live build lacks. VERIFIED (see §2.1).
2. **Staging does not exist.** Worker `metis-operator-staging` returned `This Worker does not exist on your account. [code: 10007]`. No `metis-operator-staging` D1 appears in `wrangler d1 list`, and the staging `database_id` in config is still the placeholder `REPLACE_AFTER_D1_CREATE`. VERIFIED. The API gave an explicit answer; this is not a failed inventory (SRC-20).
3. **The live proxy code is older than main.** `metis-cloudflare-proxy` last uploaded code at 2026-08-21T17:28:38Z. Every later version is a "Secret Change". Main has since changed `cloudflare-proxy/src/index.ts` (+141 lines) and added `provision-embedded-key.mjs`. The code SHA running live is UNKNOWN because the proxy carries no version stamp.
4. **Live secret drift.** Production has a secret `OPERATOR_ADMIN_PASSWORD` that neither main nor `9568d21` references (0 `git grep` hits in each). `git log -S` shows it last touched in 2026-09-01/02 commits that dropped the homemade login. That it is a stale leftover is ASSUMED.
5. **Signing does not work yet.**
   - The Windows preflight fails with `CHAIN_UNTRUSTED` / `UntrustedRoot`.
   - The macOS release gate fails because `CSC_LINK`, `APPLE_ID` and `APPLE_TEAM_ID` are missing from the repo secrets.
   - This Mac has **0 valid code-signing identities**.
   - Every installed client is ad-hoc signed, with no TeamIdentifier.
   - All VERIFIED (§8).
6. **Installed clients are behind main.** `/Applications/Metis.app` is **1.8.9**. Main is 1.9.6. No native SwiftUI app (`com.mantu.metis.native`) is installed anywhere searched.

## 1. Cloudflare account identity

| Item | Value | Evidence |
|---|---|---|
| wrangler used | 4.131.1 (root `node_modules/wrangler`, lockfile pin `package.json:135 "wrangler": "4.131.1"`) | VERIFIED: `npx --no-install wrangler --version` from `operator/` |
| `operator/node_modules` | **absent**. `npx` resolved the root workspace `node_modules/.bin/wrangler` | VERIFIED: `ls -d operator/node_modules` gave "No such file or directory" |
| Auth | Logged in with an OAuth token for `<redacted-email>` (a personal Gmail account, not a Mantu/Amaris tenant) | VERIFIED: `npx wrangler whoami` (sandbox off, read-only) |
| Account | "<redacted-email>'s Account", ID `…<redacted-account-id>` (only account listed) | VERIFIED: `wrangler whoami` |
| Token scopes (names) | user/account read, workers/workers_kv/workers_routes/workers_scripts write, d1 write, pages write, ai write, secrets_store write, zone read, plus others (list truncated at 40 lines) | VERIFIED: `wrangler whoami` |
| Access team | `https://tony-walteur.cloudflareaccess.com` | VERIFIED: `operator/wrangler.jsonc` `vars.TEAM_DOMAIN`, the live var, and the portal 302 Location host |
| workers.dev subdomain | `tony-walteur.workers.dev` | VERIFIED: `operator/scripts/deploy.mjs:42-45` `DEPLOYED_URLS`, and the portal responding |
| AI Gateway identity | UNKNOWN. The live proxy has no `CF_AI_GATEWAY_ID` var (no vars in its version view), so it uses the account-default gateway per `cloudflare-proxy/src/index.ts:38-40`. wrangler 4.131.1 has no AI Gateway list subcommand (`wrangler --help`), and no API GET was made with raw credentials | VERIFIED (no var) / UNKNOWN (gateway id) |

## 2. Cloudflare Workers

Only two wrangler configs exist in the source. Command: `find . -path ./node_modules -prune -o -name 'wrangler*' -print` gave `operator/wrangler.jsonc` and `cloudflare-proxy/wrangler.jsonc`. Neither config has KV, R2, Durable Object, AI, Queue or service bindings. Neither declares `routes`, `custom_domains` or `workers_dev`, so both default to workers.dev. VERIFIED by reading both files.

### 2.1 metis-operator (production)

| Field | Source config (main 2bf21f1c) | Live |
|---|---|---|
| Worker name | `metis-operator` (`operator/wrangler.jsonc:2`) | exists. VERIFIED: `wrangler deployments list --name metis-operator` |
| main | `src/index.ts` | handlers `fetch, scheduled` (VERIFIED: `wrangler versions view`) |
| compatibility_date | `2026-08-31` | `2026-08-31` (VERIFIED) |
| Routes / custom domains | none declared, workers.dev only | `https://metis-operator.tony-walteur.workers.dev` answers (see §4). Live custom domains/routes: UNKNOWN (not queried) |
| Cron | `17 3 * * *` (`triggers.crons`) | scheduled handler present. Live trigger schedule UNKNOWN (no read-only list verb used) |
| D1 | binding `DB`, database_name `metis-operator`, id `…9f7c` | `env.DB` → D1 id `…9f7c` (VERIFIED) |
| Assets | binding `ASSETS`, dir `./public`, `run_worker_first: true` | `env.ASSETS` Assets (VERIFIED) |
| Plain vars | `TEAM_DOMAIN`, `OPERATOR_VERSION="<set by deploy>"` | `TEAM_DOMAIN` (Access team URL), `OPERATOR_VERSION="9568d21"`, `OPERATOR_BUILT_AT="2026-09-20T17:11:47.923Z"` (VERIFIED) |
| Secrets the source reads (names, `operator/src/routes/admin-ctx.ts:16-37`, `operator/README.md:239-245,298-324`) | required: `OPERATOR_INGEST_SECRET`, `OPERATOR_PROMPT_KEY`, `OPERATOR_SKILL_PRIVATE_KEY`. Optional: `OPERATOR_VAULT_KEY`, `OPERATOR_SESSION_SECRET`, `OPERATOR_SKILL_PUBLIC_KEY`, `POLICY_AUD`, `CF_OAUTH_CLIENT_ID`, `CF_OAUTH_CLIENT_SECRET`, `CF_OAUTH_AUTHORIZE_URL`, `CF_OAUTH_TOKEN_URL`, `CF_OAUTH_SCOPES`, `CF_ACCOUNT_ID`, `OAUTH_<KIND>_CLIENT_ID/SECRET` (GOOGLEDRIVE, ZOHO, SALESFORCE, DYNAMICS365, SHAREPOINT, MICROSOFTTEAMS) | set live (`wrangler secret list --name metis-operator`): `OPERATOR_ADMIN_PASSWORD`, `OPERATOR_INGEST_SECRET`, `OPERATOR_PROMPT_KEY`, `OPERATOR_SKILL_PRIVATE_KEY`, `OPERATOR_VAULT_KEY`, `POLICY_AUD` (VERIFIED). None of the optional OAuth/session/CF_* secrets are set |
| **Live identity** | n/a | **deployment 2026-09-20T17:14:07.482Z → version `5ef9fc5a-0f9e-4bed-8907-c17776fcc3b3` (100%), author <redacted-email>, source "Unknown (deployment)"** (VERIFIED) |

The live stamp compared with the source:

- `git log -1 9568d21` gives `9568d21ce7ab277d05a6ab34e79b76fc57713a2e`, 2026-09-20T13:04:50-04:00, "fix(operator): ACCESS bypass /v1/decide + Cap1 vault-decide proof". VERIFIED.
- `git merge-base --is-ancestor 9568d21 2bf21f1c` exits 1, so it is **not an ancestor**. `git branch -a --contains 9568d21` shows remote-only `metis-2.0-inventory`. The merge base is `7e54a08adc402bed7428517a5d4ca7091319ab98`. VERIFIED.
- The live build has 3 commits not on main, 2 of them touching `operator/` (`6547aca1`, `9568d21c`, both "Cap1 portal Jev vault + /v1/decide"). Main has 2 `operator/` commits not in the live build (`99c596f0` 2026-09-19, `fca1e6b5` 2026-09-22). VERIFIED: `git log 2bf21f1c..9568d21 -- operator/` and `git log 9568d21..2bf21f1c -- operator/`.
- `git diff --shortstat 9568d21 2bf21f1c -- operator/` gives "33 files changed, 1142 insertions(+), 694 deletions(-)". Among the differences, `decide.ts`/`decide.test.ts` are only in the live build, and `d1.ts`, `store.ts`, `ask.ts`, `index.ts` and `settings-store.ts` differ. VERIFIED.
- Consequence: redeploying main as-is would remove `/v1/decide` from production. That is ASSUMED from the diff and was not executed.

Deployment history, last 10 (VERIFIED, `wrangler deployments list --name metis-operator`), as created time → version:

| Created (UTC) | Version |
|---|---|
| 2026-09-07T21:16:05Z | `7c7faab8…` |
| 2026-09-08T01:01:59Z | `2407651e…` |
| 2026-09-08T03:02:48Z | `5dabf876…` |
| 2026-09-12T20:12:38Z | `878fec4a…` |
| 2026-09-14T00:28:08Z | `495593b4…` |
| 2026-09-14T00:53:42Z | `2244219f…` |
| 2026-09-14T01:31:09Z | `00f9a147…` |
| 2026-09-14T02:34:17Z | `cac46b8f…` |
| 2026-09-14T02:52:41Z | `c27a9b2e…` |
| 2026-09-20T17:14:07Z | `5ef9fc5a…` (current, 100%) |

### 2.2 metis-operator-staging

| Field | Source config | Live |
|---|---|---|
| Worker name | `env.staging.name = metis-operator-staging` | **does not exist**: `A request to the Cloudflare API (/accounts/…<redacted-account-id>/workers/scripts/metis-operator-staging/deployments) failed. This Worker does not exist on your account. [code: 10007]` (VERIFIED, exit 1) |
| D1 | binding `DB`, `metis-operator-staging`, id `REPLACE_AFTER_D1_CREATE` (placeholder) | not in `wrangler d1 list` (only `metis-operator` listed). VERIFIED |
| vars | `TEAM_DOMAIN`, `OPERATOR_ENV=staging`, `OPERATOR_VERSION` | n/a |
| URL | `https://metis-operator-staging.tony-walteur.workers.dev` (`deploy.mjs:44`) | `curl -sI` gives `HTTP/2 404`, `server: cloudflare` (VERIFIED) |

Note: `operator/scripts/deploy.mjs:48` defaults `env: 'staging'`, so a bare deploy targets an environment that does not exist. The consequence was not executed (ASSUMED).

### 2.3 metis-cloudflare-proxy

| Field | Source config (main) | Live |
|---|---|---|
| Worker name | `metis-cloudflare-proxy` (`cloudflare-proxy/wrangler.jsonc:4`) | exists. VERIFIED |
| compatibility_date | `2026-08-20` | `2026-08-20` (VERIFIED: `wrangler versions view 095ab3d2…`) |
| compatibility_flags | none | n/a |
| Bindings / vars | none. `CF_AI_GATEWAY_ID` var is commented out | none shown (VERIFIED) |
| Secrets the source reads (`cloudflare-proxy/src/index.ts:20-40`) | `CLOUDFLARE_API_TOKEN`, `CF_ACCOUNT_ID`, `METIS_PROXY_KEY` and/or `METIS_PROXY_KEYS` | set: `CF_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `METIS_PROXY_KEY`, `METIS_PROXY_KEYS` (VERIFIED: `wrangler secret list --name metis-cloudflare-proxy`) |
| Routes | none declared | `GET https://metis-cloudflare-proxy.tony-walteur.workers.dev/health` gives `200`. HEAD gives `405` (VERIFIED). The hostname is VERIFIED only by that response; it is not written in the source (README uses `<YOUR_SUBDOMAIN>`) |
| **Live identity** | n/a | **current version `095ab3d2-762d-433b-b7e4-2a5aaf5823f3` (100%), created 2026-08-25T05:38:38Z, source "Secret Change"**. The last code upload is version `3afc7f80-e234-4db5-bb69-72eabe2d33f7` at 2026-08-21T17:28:38Z (VERIFIED) |
| Live code SHA | n/a | UNKNOWN (no version stamp). ASSUMED ≈ `ddc9b78b`, committed 2026-08-21T13:28:15-04:00 (17:28:15Z), 23 s before that upload. Main has 3 later proxy commits (`5528b188`, `c6720ae6`, `14d79cdc`, all 2026-08-31). `git diff --stat ddc9b78b 2bf21f1c -- cloudflare-proxy/` gives 3 files, +366/−4 |

### 2.4 D1 `metis-operator`

| Field | Value | Evidence |
|---|---|---|
| id | `…9f7c` | VERIFIED: `wrangler d1 info metis-operator` |
| created_at | 2026-09-01T16:54:09.354Z | VERIFIED |
| region / jurisdiction | ENAM / null. Read replication disabled | VERIFIED |
| database_size | 4.56 MB | VERIFIED |
| num_tables (live) | **28** (`d1 info`). `d1 list` shows `0` in the same column, which is ASSUMED to be a list-endpoint artefact | VERIFIED |
| 24 h traffic | 75,069 read queries / 5 write queries | VERIFIED (aggregate counters only, no row content) |
| Tables defined in source | **19** in main: `asks audit crm_sends events group_members groups integration_grants integrations issued_licenses nonces operator_settings packs proposals pulses rate_limits seats sessions tiers vault_keys` (union of `CREATE TABLE IF NOT EXISTS` in `schema.sql` (18) and `schema-alter.sql`, plus runtime DDL `operator_settings` in `operator/src/routes/settings-store.ts`) | VERIFIED |
| Gap between 28 live and 19 in source | UNKNOWN. It could be D1-internal tables (`_cf_*`, `sqlite_sequence`) or leftover tables from older builds. Resolving it needs a `SELECT name FROM sqlite_master` through `wrangler d1 execute --remote`. That was not run because it is a query POST, outside this lane's read-only verbs (view/list/GET) | UNKNOWN |

### 2.5 Schema and migrations

- There is no `migrations/` directory and no `d1_migrations` workflow (`ls operator/migrations` gave "No such file or directory"). The schema is two idempotent SQL files applied statement by statement by `operator/scripts/migrate.mjs` (header lines 1-21), with `--remote`, `--local`, `--env staging` and `--dry-run` flags. VERIFIED.
- `operator/schema.sql`: 275 lines, 18 tables. Last changed by `84c03ea0` (2026-09-07, "G5–G11 Portal Ask SSE + Flash default + cost paths"). VERIFIED: `git log -- operator/schema.sql`.
- `operator/schema-alter.sql`: 225 lines. Its latest block is `CREATE TABLE IF NOT EXISTS operator_settings` (from line 220, task B6). Last changed by `84c03ea0` (2026-09-07). VERIFIED.
- Runtime DDL: `operator/src/connectors/data.ts` (`INTEGRATION_ALTERS`, 12 `ALTER TABLE integrations`) and `operator/src/routes/settings-store.ts` (`operator_settings`). VERIFIED.
- Live build compared with main: `schema.sql`, `schema-alter.sql` and `connectors/data.ts` are identical. `settings-store.ts` differs (+2/−22). VERIFIED: `git diff --stat 9568d21 2bf21f1c -- …`.
- Whether the live D1 has had every statement in main's files applied is UNKNOWN. Nothing records migration runs, and no query was executed.

## 3. Other deployables

| Service | Deploy target | Live identity | Evidence |
|---|---|---|---|
| license-server | Fly.io app `asktoto-license`, region `iad`, internal port 8420, volume `license_data` → `/app/data` (JSON file store `data/licenses.json`) | **NOT_AVAILABLE.** `fly` is outside this lane's sandbox-off CLI allowance. Inside the sandbox `fly version` failed with `Error: failed ensuring config directory perms: open /Users/tony/.fly/perms.2247035798: operation not permitted`. With a temporary `FLY_CONFIG_DIR` it printed `fly v0.4.69 darwin/arm64`; no auth or status call was made. Whether the app exists, and under which name (`fly.toml:5` says "rename before launch if this name is already taken"), is UNKNOWN | `license-server/fly.toml` |
| intelligence | Not a deployed service. A Vite/React workspace (`package.json` name `deal-psychology-dashboard`) bundled into the desktop app under `Resources/intelligence` | the installed `/Applications/Metis.app/Contents/Resources/intelligence` exists | `intelligence/README.md`; VERIFIED `ls` |
| Desktop auto-update feed | GitHub `mysticalsin/Metis-Releases` (public), provider github, `updaterCacheDirName: asktoto-updater` | `releases/latest` = **v1.6.6** (2026-08-26, assets `latest.yml` plus Windows `.exe` only, no `latest-mac.yml`). Newest entries: `v1.9.6-unsigned` Draft (created 2026-09-24T03:53:59Z), `v1.9.8` Draft, `v1.9.1` Draft, `v1.8.9` Draft, `v1.8.7`/`v1.8.4` Pre-release | VERIFIED: `Resources/app-update.yml` in the installed app; `gh api repos/mysticalsin/Metis-Releases/releases/latest`; `gh release list` |
| Source-repo releases | `mysticalsin/AskToto-Mantu` | `releases/latest` = **v1.8.9** (2026-09-09, 8 assets). `v1.8.9-unsigned-win`, `v1.8.4`, `v1.8.3`, `v1.7.0` and a "QA transfer (delete me)" draft also exist | VERIFIED: `gh api …/releases/latest`, `gh release list` |

## 4. Public portal probe

| URL | Result | Evidence |
|---|---|---|
| `https://metis-operator.tony-walteur.workers.dev` | `HTTP/2 302`, `server: cloudflare`, `location: https://tony-walteur.cloudflareaccess.com/cdn-cgi/access/login/metis-operator.tony-walteur.workers.dev?<query redacted>` | VERIFIED: `curl -sI` at 04:01:53Z. This is Cloudflare Access; no login was attempted |

## 5. Installed clients on this Mac

All installed bundles are Electron (`Contents/Frameworks/Electron Framework.framework` present) with `CFBundleIdentifier com.mantu.asktoto`, CFBundleName `Metis`, CFBundleDisplayName `Métis`, and `LSMinimumSystemVersion 12.0`. Each is a universal Mach-O (x86_64 + arm64). Evidence for every row: `PlistBuddy` on `Contents/Info.plist` and `codesign -dv`.

| Bundle | ShortVersion / Version | Bundle mtime (local) | Signature | Build label inside the bundle (self-reported, ASSUMED) |
|---|---|---|---|---|
| `/Applications/Metis.app` | **1.8.9 / 1.8.9** | 2026-09-07 22:02 | `adhoc,runtime` (hardened runtime), TeamIdentifier **not set**. `codesign --verify --deep --strict` exit 0 | none |
| `~/Applications/Metis.app` | 1.5.4 / 1.5.4 | 2026-08-19 19:46 | `adhoc,runtime`, TeamIdentifier not set | none |
| `~/Applications/Metis-18cf5b73-qa.app` | 1.9.1 / 1.9.1 | 2026-09-20 00:31 | `adhoc` (no runtime flag), TeamIdentifier not set | `QA_TIP_SHA` 18cf5b73 (ancestor of main), but `QA_TIP.txt` says `2eb2b612`, so the labels disagree |
| `~/Applications/Metis-7e54a08-qa.app` | 1.9.1 / 1.9.1 | 2026-09-20 00:31 | `adhoc`, TeamIdentifier not set | tip 7e54a08 (ancestor of main), branch `release/1.9.1`, "dmg-install-from-ci-artifact" run 35036118449 |
| `~/Applications/Metis-a694db9c-qa.app` | 1.9.1 / 1.9.1 | 2026-09-20 17:28 | `adhoc`, TeamIdentifier not set | tip a694db9c (**NOT** an ancestor of main). `TIP.txt` says 18cf5b73, a stale copy |

- Bundled helper in `/Applications/Metis.app`: `Contents/Resources/mac-helper/metis-mac-helper`, `Identifier=.metis-mac-helper.arm64`, `adhoc,linker-signed`, no TeamIdentifier. Source plist id `com.mantu.asktoto.mac-helper` (`native/mac-helper/Info.plist:6`). VERIFIED.
- Gatekeeper: `spctl -a -vv -t exec /Applications/Metis.app` gave **NOT_AVAILABLE**: `/Applications/Metis.app: internal error in Code Signing subsystem`. This was run inside the sandbox and may be a sandbox effect; it was not retried.
- **Native SwiftUI app: not installed.** Its source identity is `native-app/project.yml:16,39-46`: name `Metis`, `PRODUCT_BUNDLE_IDENTIFIER com.mantu.metis.native`, `MARKETING_VERSION "1.9.6"`, `CURRENT_PROJECT_VERSION "1"`, `CODE_SIGN_STYLE Automatic`. A bundle search (`find` depth ≤9 of `/Applications`, `~/Applications`, `~/AI-Brain-build`, `~/dev`, `/private/tmp`) found no bundle other than `com.mantu.asktoto` ones. `~/Library/Developer/Xcode/DerivedData` does not exist, and Spotlight (`mdfind kMDItemCFBundleIdentifier`) returned nothing. VERIFIED for those paths. Traces of past runs exist: `~/Library/Preferences/com.mantu.metis.native.plist`, `com.mantu.metis.native.qa.recap20260923.plist`, and `~/Library/Containers/com.mantu.metis.native.offlineprobe` (existence only, not opened).
- Build outputs that are not installed (versions from Info.plist; all `com.mantu.asktoto`, ad-hoc, no team): `~/AI-Brain-build/asktoto-release/mac-universal/Metis.app` 1.9.5; `~/dev/metis-pr195-ver/release/mac-universal/Metis.app` 1.9.6; `~/dev/metis-rf3/release/mac-universal/Metis.app` 1.9.8; `~/dev/metis-enterprise-audit-20260909/…/mac-arm64/Metis.app` 1.8.9. These were read only.
- `~/Library/Application Support`, existence only (contents not read):
  - `asktoto` EXISTS. The filesystem is case-insensitive, so `AskToto` resolves to the same entry.
  - `asktoto-dev` EXISTS (the unpackaged dev profile, `src/main/index.ts:897-899`).
  - `Metis Light` and `TotoWhisper` EXIST.
  - `Metis`, `Métis`, `com.mantu.asktoto`, `com.mantu.metis.native` and `com.mantu.metis` are absent.
  - Source shows userData follows CFBundleName, with migration from `Métis` and `AskToto` (`src/main/index.ts:914-925`), and `ASKTOTO_USERDATA` overrides it (`:891`). The packaged 1.8.9 app therefore apparently uses `asktoto`, not `Metis`; that is ASSUMED, not resolved.
- Running processes: NOT_AVAILABLE (`ps` gave `[rtk: Operation not permitted (os error 1)]` inside the sandbox).

## 6. Tools on this Mac

| Tool | Version / state | Evidence |
|---|---|---|
| Node expectation | `22.22.3` in `.nvmrc`, `.node-version`, `package.json` `engines.node`, and every `actions/setup-node` in workflows | VERIFIED |
| node | **v22.22.3** at `/Users/tony/.hermes/node/bin/node` (matches the expectation, but the binary is the Hermes-managed Node) | VERIFIED: `node --version`, `command -v node` |
| npm | 10.9.8 | VERIFIED |
| Engine warning | root `npm ci`: `@dust-tt/client@1.2.8` requires node `>=24.16.0` (EBADENGINE warning; install exit 0) | VERIFIED: `metis-2.0-exec/receipts/npm-ci.log` |
| wrangler | 4.131.1 local (root `node_modules`). No global `wrangler` on PATH. Upstream reports 4.137.0 available | VERIFIED |
| gh | 2.99.0 (2026-09-01). Logged in as **mysticalsin** (keyring), scopes `gist, read:org, repo, workflow` | VERIFIED: `gh --version`, `gh auth status` (sandbox off) |
| codex CLI | codex-cli 0.144.5 (`~/.local/bin/codex`). The sandbox warned that PATH aliases could not be created. No session started | VERIFIED |
| claude CLI | 2.1.281 (Claude Code) | VERIFIED |
| Xcode | Xcode 27.0, Build 27A266a (xcrun cache warning `Operation not permitted` from the sandbox) | VERIFIED: `xcodebuild -version` |
| swift | Apple Swift 6.4 (swiftlang-6.4.0.34.1), swift-driver 1.168.6, target arm64-apple-macosx27.2.0 | VERIFIED |
| Code-signing identities | **0 valid**. 1 matching but invalid identity, named `TotoWhisper Dev`. Keychains: login plus System | VERIFIED: `security find-identity -v -p codesigning` and `-p codesigning` (run in the sandbox; no error) |
| python3 | 3.14.6 (`/opt/homebrew/bin/python3`) | VERIFIED |
| ffmpeg | 8.1.1-tessus at `~/.local/bin/ffmpeg`. It is a **GPL** build (`--enable-gpl`). The app instead bundles an LGPL ffmpeg **7.1.1** sidecar (`resources/ffmpeg/manifest.json`), so the local binary is not a drop-in substitute | VERIFIED |
| whisper | whisper.cpp **1.8.6** via Homebrew (`whisper-cli`, `whisper-server`, `whisper-stream`; ggml 0.13.1 Metal/BLAS backends). No Python `whisper`, `faster_whisper` or `mlx_whisper` | VERIFIED: symlink `/opt/homebrew/bin/whisper-cli -> ../Cellar/whisper.cpp/1.8.6/…`, `importlib.find_spec` |
| git | 2.54.0 (Apple Git-157) | VERIFIED |
| fly | v0.4.69 (see §3) | VERIFIED version only |
| Homebrew | `brew list` NOT_AVAILABLE: `Operation not permitted @ dir_s_mkdir - /Users/tony/Library/Caches/Homebrew (Errno::EPERM)` | sandbox |

## 7. GitHub Actions runners

`runs-on` values from `.github/workflows/*.yml` (VERIFIED: grep plus a job map):

| Workflow | Job → runner |
|---|---|
| `build.yml` | `quality` → matrix `[ubuntu-latest, windows-latest]`; `operator` → ubuntu-latest; `security` → ubuntu-latest; `build-macos` → macos-latest; `build-windows` → windows-latest |
| `release.yml` | `release-quality` → matrix `[ubuntu-latest, windows-latest]`; `release-macos` → macos-latest; `release-windows` → windows-latest; `release-verify` → ubuntu-latest |
| `cahe-windows.yml` | `cahe-windows` → windows-latest |
| `windows-signing-identity-preflight.yml` | `identity` → **windows-2022** (dispatch only, main only, repo guard, line 21) |

- No workflow builds `native-app/`. A grep for `native-app|xcodebuild|xcodegen|swift build` in `.github/workflows/*.yml` matched nothing. No self-hosted runners, and no `environment:` keys. The repo has 0 environments (`gh api …/environments` gave `total_count 0`). VERIFIED.
- Main head CI: `build.yml` run `35872259580` on `2bf21f1c` gave **success** for all 6 jobs (Security & supply chain, Quality ubuntu, Quality windows, Operator Worker, macOS package, Windows package). VERIFIED: `gh run view --json`. This is a CI build result, not a signed-release or runtime acceptance.

## 8. Signing reality

### Windows

- Preflight run `35538932316` (workflow_dispatch on main, head `fff88c26`, 2026-09-20T21:30:47Z) ended **failure**.
- The failing step was step 5, "Check the configured identity without signing or publishing".
- The log shows `{"ok":false,"code":"CHAIN_UNTRUSTED",…,"chainStatusCodes":["UntrustedRoot"]}`, then `Process completed with exit code 1`. VERIFIED: `gh run view --json`, `--log-failed` (subject and thumbprint redacted).
- Earlier preflights `34723616509` (ffcbf911) and `34722312817` (0da2d800) on 2026-09-12 also failed. VERIFIED: `gh run list`.
- `fff88c26` is an ancestor of main. The preflight script, the workflow and `electron-builder.win.yml` are unchanged between `fff88c26` and `2bf21f1c` (empty `git diff --stat`), so the result still applies to main's preflight code. VERIFIED.
- Repo secrets present (names only): `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`, `WIN_CSC_EXPECTED_SUBJECT` (all 2026-09-07). VERIFIED: `gh secret list`.

### macOS

- Repo secrets present: `APPLE_APP_SPECIFIC_PASSWORD`, `CSC_KEY_PASSWORD`, `GH_TOKEN`.
- **Missing, but referenced by `release.yml`**: `CSC_LINK`, `APPLE_ID`, `APPLE_TEAM_ID`. VERIFIED: `gh secret list` compared with `grep secrets.` in workflows.
- Release run `35537817481` (tag v1.9.5, head fff88c26) job "macOS release" failed at step "Require Developer ID signing and notarization secrets before releasing". "Windows release" failed at "Run npm run release:build:win", and "Publish verified Mac + Windows release" was skipped. VERIFIED.
- The last 5 `release.yml` runs (v1.8.5 through v1.9.5) all ended **failure**. VERIFIED: `gh run list`.
- Locally there are 0 valid code-signing identities (§6), and every installed client is ad-hoc with no TeamIdentifier (§5).

### Other

- Referenced but absent from repo secrets: `CAHE_KIMI_JSON` (used by `cahe-windows.yml`). `GITHUB_TOKEN` is automatic. VERIFIED.

## 9. Unavailable and unknown inputs

| Item | Status | Exact error / reason |
|---|---|---|
| `metis-operator-staging` Worker | Does not exist (a positive API answer) | `This Worker does not exist on your account. [code: 10007]` |
| Live proxy code SHA | UNKNOWN | the Worker carries no version stamp; timestamp correlation only (§2.3) |
| Live D1 table list and applied-migration state | UNKNOWN | needs `wrangler d1 execute --remote` (query POST), not run in this read-only lane |
| Live routes, custom domains, cron schedule | UNKNOWN | no read-only wrangler verb used for them |
| AI Gateway id | UNKNOWN | no wrangler list verb; proxy uses the account default (no var) |
| license-server (Fly) live state | NOT_AVAILABLE | `Error: failed ensuring config directory perms: open /Users/tony/.fly/perms.2247035798: operation not permitted`; `fly` is not in this lane's sandbox-off allowance |
| Gatekeeper assessment | NOT_AVAILABLE | `/Applications/Metis.app: internal error in Code Signing subsystem` |
| Running Metis processes | NOT_AVAILABLE | `[rtk: Operation not permitted (os error 1)]` |
| Homebrew package list | NOT_AVAILABLE | `Operation not permitted @ dir_s_mkdir - /Users/tony/Library/Caches/Homebrew (Errno::EPERM)` |
| Native SwiftUI app install | Not installed (searched paths in §5) | n/a |
| userData dir the packaged 1.8.9 app actually uses | UNKNOWN (ASSUMED `asktoto`) | contents deliberately not read |

## 10. Commands run (read-only)

- Inside the sandbox:
  - `git log/show/grep/diff/merge-base/branch -a --contains/cat-file` in the source worktree.
  - `PlistBuddy`, `codesign -dv`, `codesign --verify --deep --strict`, `spctl -a`.
  - `security find-identity`, `find`, `mdfind`, `ls`.
  - Tool `--version` calls.
  - `curl -sI` / `curl -s -o /dev/null -w %{http_code}` against three workers.dev hosts (via `allowed_domains`).
- With the sandbox off (TLS), from `/Users/tony/AI-Brain-build/metis-2.0/operator` with `WRANGLER_SEND_METRICS=false npx --no-install wrangler`: `whoami`, `deployments list --name {metis-operator, metis-operator-staging, metis-cloudflare-proxy}`, `versions view 5ef9fc5a… --name metis-operator`, `versions view 095ab3d2… --name metis-cloudflare-proxy`, `secret list --name {metis-operator, metis-cloudflare-proxy}`, `d1 list`, `d1 info metis-operator`.
- With the sandbox off, `gh`: `auth status`, `secret list`, `variable list`, `api …/environments`, `run view 35538932316 [--json|--log-failed]`, `run view 35537817481 --json jobs`, `run view 35872259580 --json`, `run list --workflow …`, `release list` (both repos), and `api …/releases/latest` (both repos).
- Nothing was deployed, pushed, created, edited, dispatched or deleted. No npm script was run in the source worktree.
