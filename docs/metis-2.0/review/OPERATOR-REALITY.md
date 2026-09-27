# M2-0014 Operator Production Reality

Investigation deliverable for M2-0014. Labels: OBSERVED means directly read in this worktree or supplied with a reproducible public-repo SHA/path/command citation; DERIVED means a conclusion from those observations; UNKNOWN means not knowable here; BLOCKED_EXTERNAL means owner-authorized Cloudflare access is required.

## 1. Deployed Worker version and commit

- BLOCKED_EXTERNAL (docs/metis-2.0/BLOCKERS.md:24,45): this worktree has no Cloudflare session or scoped token, so today's deployed Worker version/commit cannot be freshly verified here.
- OBSERVED (metis-2.0-exec/tasks/TASK-001/service-register.md:11,51,57-61): the best available production evidence was last verified on 2026-09-24 by owner-session `wrangler` live checks between 04:01Z and 04:07Z.
- OBSERVED (metis-2.0-exec/tasks/TASK-001/service-register.md:11): production Worker `metis-operator` version `5ef9fc5a-0f9e-4bed-8907-c17776fcc3b3` was created `2026-09-20T17:14:06Z`.
- OBSERVED (metis-2.0-exec/tasks/TASK-001/service-register.md:53): the same production deployment timestamp is recorded as `2026-09-20T17:14:07.482Z`.
- OBSERVED (metis-2.0-exec/tasks/TASK-001/service-register.md:51): production plain vars were `OPERATOR_VERSION="9568d21"` and `OPERATOR_BUILT_AT="2026-09-20T17:11:47.923Z"`.
- OBSERVED (metis-2.0-exec/tasks/TASK-001/service-register.md:14,52): TASK-001 also verified a stale production secret, `OPERATOR_ADMIN_PASSWORD`, that neither current `main` nor commits `926036a0`/`9b4446c8` reference.
- OBSERVED (operator/src/index.ts:212-224 @926036a0): `GET /health` publicly returns `version`/`builtAt` with no Cloudflare credentials.
- OBSERVED (operator/src/index.ts:212-224 @926036a0): the `/health` branch runs before device-auth checks and returns `{ ok, service, configured, version: env.OPERATOR_VERSION, builtAt: env.OPERATOR_BUILT_AT, env, d1, schema, lastIngestAt, lastCronAt }`.
- OBSERVED (docs/metis-2.0/BLOCKERS.md:24): the owner-runnable Cloudflare readback remains `wrangler deployments list`.
- OBSERVED (operator/src/index.ts:212-224 @926036a0): the credential-free owner-runnable deployment-stamp probe is `curl -s https://<operator-host>/health`.
- OBSERVED (docs/design/METIS-2.0-CAP1-FUSE-STATUS.md @633bc4fa): a 2026-09-20 about-13:13 ET `curl /health` snapshot returned version `2b26efa` and builtAt `2026-09-14T02:50:46.011Z`.
- DERIVED (`git log -1 --format='%H %cI %s' 926036a0`; `git log -1 --format='%H %cI %s' 9b4446c8`; docs/design/METIS-2.0-CAP1-FUSE-STATUS.md @633bc4fa): the `2b26efa` snapshot was taken after Cap1 commits `9b4446c8` and `926036a0` existed, but roughly one minute before the production deploy recorded in TASK-001.
- DERIVED (docs/design/METIS-2.0-CAP1-FUSE-STATUS.md @633bc4fa; metis-2.0-exec/tasks/TASK-001/service-register.md:11): the `2b26efa` snapshot shows the previous deploy was still live about nine minutes after the Cap1 code commits, not that the capture predated those commits.
- UNKNOWN: today's deployed Worker version and commit until `wrangler deployments list` or `curl -s https://<operator-host>/health` is rerun by the owner or with scoped read-only access.

## 2. Security review and merge-or-revert recommendation

- OBSERVED (docs/metis-2.0/DECISIONS.md:110; docs/metis-2.0/BLOCKERS.md:147): D-8 is OPEN and asks whether to merge the off-main production Operator build through review or revert; the decision is security-escalated and affects tickets 0014, 0103, 0123, 0145 and 0159.
- OBSERVED (`git log origin/main..origin/metis-2.0-inventory --oneline`): `origin/metis-2.0-inventory` has six commits not on `origin/main`, all dated 2026-09-20 by Tony Walteur.
- OBSERVED (`git log origin/main..origin/metis-2.0-inventory --oneline`): commit `3955000e` at 12:55:52-04:00 is docs-only.
- OBSERVED (`git log -1 --format='%H %cI %s' 9b4446c8`): commit `9b4446c8` at 13:02:50-04:00 is `feat(operator): Cap1 portal Jev vault + /v1/decide (typesafe_jev)`.
- OBSERVED (`git show --stat 926036a0`): commit `926036a0` touches `operator/src/access.ts` and `docs/design/METIS-2.0-VAULT-DECIDE.md`.
- OBSERVED (`git diff --shortstat 9f4bb1a5^ 9f4bb1a5`): commit `9f4bb1a5` changes 23 files with 1571 insertions and 2 deletions.
- OBSERVED (`git diff --shortstat 9f4bb1a5^ 9f4bb1a5`; `git show --stat 9f4bb1a5`): `9f4bb1a5` includes `src/main/metis-decide-client.ts`, `src/main/metis-decide-client.test.ts`, `src/main/desktop-adapters.ts`, `src/main/metis-command-runtime.ts` and `src/main/metis-command-register.ts`.
- DERIVED (`git diff --shortstat 9f4bb1a5^ 9f4bb1a5`; `git show --stat 9f4bb1a5`): `9f4bb1a5` is a desktop Electron main-process Cap2 feature, not an Operator/server change.
- OBSERVED (`git log origin/main..origin/metis-2.0-inventory --oneline`): commits `d85ce1b2` and `633bc4fa` are docs-only.
- DERIVED (`git log origin/main..origin/metis-2.0-inventory --oneline`): the branch carries three undeployed commits beyond the two Operator commits: desktop commit `9f4bb1a5` and docs-only commits `d85ce1b2` and `633bc4fa`.
- OBSERVED (`git log -1 --format='%H %cI %s' 926036a0`): post-rewrite `926036a0cdf1c3a46c67bab6cf39a685ac99888d` has timestamp `2026-09-20T13:04:50-04:00` and subject `fix(operator): ACCESS bypass /v1/decide + Cap1 vault-decide proof`.
- OBSERVED (metis-2.0-exec/tasks/TASK-001/service-register.md:57): pre-rewrite `9568d21ce7ab277d05a6ab34e79b76fc57713a2e` had the same timestamp and subject as `926036a0`.
- OBSERVED (`git diff --shortstat origin/main 926036a0 -- operator/`): the post-rewrite diff is 33 files changed, 694 insertions and 1142 deletions.
- OBSERVED (metis-2.0-exec/tasks/TASK-001/service-register.md:60): the pre-rewrite operator diff records the same 33-file, 1142/694 pair in the opposite direction.
- OBSERVED (`git log -1 --format='%H %cI %s' 9b4446c8`; metis-2.0-exec/tasks/TASK-001/service-register.md:59): post-rewrite `9b4446c8` matches pre-rewrite `6547aca1` by timestamp and subject.
- DERIVED (`git log -1 --format='%H %cI %s' 926036a0`; metis-2.0-exec/tasks/TASK-001/service-register.md:57): pre-rewrite `9568d21` equals post-rewrite `926036a0`.
- DERIVED (`git log -1 --format='%H %cI %s' 9b4446c8`; metis-2.0-exec/tasks/TASK-001/service-register.md:59): pre-rewrite `6547aca1` equals post-rewrite `9b4446c8`.
- DERIVED (`git log -1 --format='%H %cI %s' 926036a0`; metis-2.0-exec/tasks/TASK-001/service-register.md:57,59-60): the 2026-09-26 about-20:00 UTC public-repo history rewrite changed commit hashes without changing authorship, timestamps, subjects or diffs.
- DERIVED (metis-2.0-exec/tasks/TASK-001/service-register.md:51; `git log -1 --format='%H %cI %s' 926036a0`): production's `OPERATOR_VERSION="9568d21"` no longer resolves in the current public repo, so deploy guards and `smoke --expected-version` checks must use the proven mapping `9568d21` -> `926036a0` and `6547aca1` -> `9b4446c8`.
- OBSERVED (`git grep -n "ACCESS_BYPASS_PATHS" origin/main`): `ACCESS_BYPASS_PATHS` is defined in `operator/src/access.ts:45`, referenced in docs/tests, and not read by production code.
- DERIVED (`git grep -n "ACCESS_BYPASS_PATHS" origin/main`): the array is documentation-of-intent and a test fixture; the real bypass control is the manually configured Cloudflare Zero Trust Access policy.
- OBSERVED (docs/operator/ACCESS-BYPASS-INTEGRATIONS.md @origin/main): Cloudflare Zero Trust Bypass policy configuration is the operational control that lets Worker HMAC routes answer directly.
- OBSERVED (operator/src/index.ts @926036a0): `/v1/ingest`, `/v1/heartbeat`, `/v1/skills/manifest`, `/v1/use`, `/v1/ask`, `/v1/decide` and `/v1/integrations` route through one shared branch that calls `verifyDeviceRequest(request, bodyText, env.OPERATOR_INGEST_SECRET, store, now)` and returns on `!hmac.ok` before any individual handler runs; the `/v1/decide` dispatch to `handleDecide(...)` sits after that shared HMAC gate alongside `/v1/ask` and `/v1/use`.
- OBSERVED (operator/src/decide.ts @926036a0): once inside `handleDecide`, further gates run for seat approval (`seatAuthorizedForKeys`, `SEAT_NOT_APPROVED`), vault-key presence (`decryptVault`/`decodeVaultPlaintext`), the fixed `DECIDE_TEMPLATES` allowlist, the `PAYLOAD_JSON_CAP = 8_000` byte cap, the clamped upstream deadline (`DEFAULT_DEADLINE_MS`/`MAX_DEADLINE_MS`) and secret redaction (`providerRefusedPayload`).
- OBSERVED (operator/src/index.ts:273 @origin/main; operator/src/device-auth.ts:39-51 @origin/main): when the license header is absent, device auth falls back to legacy fleet HMAC using `env.OPERATOR_INGEST_SECRET`.
- DERIVED (operator/src/index.ts:273 @origin/main; operator/src/device-auth.ts:39-51 @origin/main; metis-v2-review/lanes/L09-operator-cloud.md): anyone holding `OPERATOR_INGEST_SECRET` can call HMAC-gated routes including `/v1/decide` as any shape-valid `X-Operator-Device`; `M2-0145` tracks the device-binding risk.
- OBSERVED (operator/src/decide.ts:1-9 @926036a0): `/v1/decide` forwards to `https://api.typesafe.ai/v1/systemone`.
- OBSERVED (operator/src/decide.ts @926036a0): the upstream body includes caller-supplied `parsed.payload`, capped by `PAYLOAD_JSON_CAP = 8_000`.
- DERIVED (operator/src/decide.ts @926036a0; docs/metis-2.0/kit/r11/spec/MASTER.md:1453-1479): `action_disambiguate` can forward spoken/typed command text to `api.typesafe.ai`, so supplier assurance and no-content-retention evidence belong under `M2-0149`.
- OBSERVED (operator/src/decide.ts:252 @926036a0): the audit call persists the template name and passes `null` for payload/result content.
- DERIVED (operator/src/decide.ts:252 @926036a0): `/v1/decide` does not write prompt/command content or upstream results to Operator storage through that audit call.
- DERIVED (operator/src/access.ts @926036a0; operator/src/device-auth.ts:39-51 @origin/main; operator/src/decide.ts @926036a0): adding `/v1/decide` to the Access bypass list is not itself an authentication bypass, but residual risk remains in the legacy fleet-wide HMAC fallback and third-party payload forwarding.
- DERIVED (metis-v2-review/lanes/L09-operator-cloud.md F4; operator/src/decide.ts @926036a0): the `decide` rate-limit bucket inherits the non-atomic `hitRate` read-then-write pattern already flagged in the L09 Operator lane review.
- OBSERVED (`git log origin/metis-2.0-inventory..origin/main --oneline -- operator/`): `main` has `4b7c4d8d fix(metis): stabilize onboarding and preserve operator usage integrity` and `26c039fb fix: harden metis desktop release candidate` that are not on the off-main branch.
- DERIVED (`git log origin/metis-2.0-inventory..origin/main --oneline -- operator/`; `git diff --shortstat origin/main 926036a0 -- operator/`): reconciliation is a 33-file bidirectional reconciliation, not a fast-forward branch merge or one-line redeploy of `main`.
- OBSERVED (docs/metis-2.0/ledger/tickets.json:7157-7220): `M2-0123` requires `/v1/decide` with typed candidate-bound requests, budgets, circuit breakers and content-privacy controls on transcript-derived requests.
- DERIVED (docs/metis-2.0/ledger/tickets.json:7157-7220; operator/src/decide.ts @926036a0): the off-main `decide.ts` does not meet `M2-0123` acceptance as written because it forwards caller payload to a third-party supplier and lacks the ticket's full typed candidate-bound/budget/circuit/privacy evidence.
- RECOMMENDATION (D-8; `git log origin/main..origin/metis-2.0-inventory --oneline`; `git log origin/metis-2.0-inventory..origin/main --oneline -- operator/`): scope any merge to exact commits `9b4446c8` and `926036a0`, optionally `9f4bb1a5` for Cap2 desktop, through a reviewed PR into this program's integration branch while preserving `4b7c4d8d` and `26c039fb`.
- BLOCKED_EXTERNAL (Cloudflare Zero Trust dashboard -> Access -> Applications -> Métis Operator -> Policies, read-only view): confirm the Bypass policy path scope exactly matches `ACCESS_BYPASS_PATHS` and does not wildcard-widen beyond it.
- BLOCKED_EXTERNAL (`GET /accounts/{account_id}/access/apps/{app_id}/policies`): the equivalent read-only Cloudflare API read can confirm the same Bypass policy scope.
- BLOCKED_EXTERNAL (`curl -sI https://<operator-host>/v1/decide`): `401` JSON means Worker HMAC/license auth is answering; `302` to Access login means Access still wraps the route and bypass is not applied.
- BLOCKED_EXTERNAL / OWNER DECISION: this report does not execute a merge or revert; D-8 remains the owner/security-reviewer decision.

## 3. Live D1 schema reconciliation

- BLOCKED_EXTERNAL (docs/metis-2.0/BLOCKERS.md:24,45): the live D1 table list requires owner-authorized read-only Cloudflare access.
- OBSERVED (operator/schema.sql @origin/main): `grep -n "CREATE TABLE" operator/schema.sql` returns exactly 18 `CREATE TABLE IF NOT EXISTS` statements.
- OBSERVED (operator/schema.sql @origin/main): the 18 `schema.sql` tables are `seats`, `asks`, `pulses`, `events`, `vault_keys`, `crm_sends`, `nonces`, `rate_limits`, `proposals`, `packs`, `audit`, `issued_licenses`, `sessions`, `groups`, `group_members`, `tiers`, `integrations` and `integration_grants`.
- OBSERVED (operator/schema-alter.sql:11,27,66,87,101,128,146,155,166,173,191,220 @origin/main): `schema-alter.sql` has 12 `CREATE TABLE IF NOT EXISTS` statements.
- OBSERVED (operator/schema-alter.sql:216-220 @origin/main): `operator_settings` is the only net-new table declared by `schema-alter.sql`.
- OBSERVED (operator/src/routes/settings-store.ts:43-46 @origin/main): runtime settings-store creation matches the `operator_settings` DDL appended to `schema-alter.sql`.
- DERIVED (operator/schema.sql @origin/main; operator/schema-alter.sql:216-220 @origin/main): source defines 19 distinct tables, not 18.
- OBSERVED (operator/src/decide.ts @926036a0): `/v1/decide` imports `readOperatorSettings` from `./routes/settings-store`.
- DERIVED (operator/src/decide.ts @926036a0; operator/src/routes/settings-store.ts:43-46 @origin/main): `operator_settings` backs `/v1/decide` portal-wide and per-template kill switches.
- OBSERVED (`git show --stat 9b4446c8`; `git show --stat 926036a0`): neither off-main Operator commit changes `operator/schema.sql` or `operator/schema-alter.sql`.
- DERIVED (`git show --stat 9b4446c8`; `git show --stat 926036a0`): the off-main branch is not a plausible source-side explanation for a 28-live-vs-source table gap because it does not touch the schema files.
- OBSERVED (metis-2.0-exec/tasks/TASK-001/service-register.md:110): the reported live 28-table figure came from `wrangler d1 info` `num_tables`.
- OBSERVED (docs/metis-2.0/BLOCKERS.md:24): the owner-runnable D1 verification should use `wrangler d1 execute <db> --command "SELECT type, name FROM sqlite_master WHERE type='table' ORDER BY name"`.
- DERIVED (metis-2.0-exec/tasks/TASK-001/service-register.md:110): `wrangler d1 info` `num_tables=28` is a different counting method from a `sqlite_master` query, and the live/source comparison must be like-for-like.
- UNKNOWN: whether production D1 has 28 tables, which extra tables exist, and whether any extra table stores prohibited content until the read-only D1 query is run.

## 4. deploy/migrate/backup/export review against MASTER section 16 and restore-drill requirement

- OBSERVED (docs/metis-2.0/kit/r11/spec/MASTER.md:1453-1455): MASTER §16.6 defines confidential content and prohibits writing it to Cloudflare-controlled application storage, response caches, payload logs, durable queues or diagnostic exports while permitting finite administrative metadata.
- OBSERVED (docs/metis-2.0/kit/r11/spec/MASTER.md:1471-1479): MASTER §16.6.2 requires no prompts, transcripts, recordings or inference results in D1/KV/R2/Durable Object/Queues, Worker logs, traces, support bundles, retries or user-approved knowledge copies.
- OBSERVED (docs/metis-2.0/kit/r11/spec/MASTER.md:1504-1508): MASTER §16.6.4 requires sentinel tests and configuration readback across controlled sinks, with drift detection against the approved live configuration.
- OBSERVED (docs/metis-2.0/kit/r11/spec/MASTER.md:1315): MASTER requires recovery objectives, backup ownership, retention and a restore drill, verified in a real isolated staging environment; file sync is not a tested backup strategy.
- OBSERVED (operator/scripts/deploy.mjs @origin/main): deploy is human-run, stamps `OPERATOR_VERSION` from checked-out `HEAD`, and does not enforce production deployment from a freshly fetched remote-reachable `origin/main`.
- OBSERVED (operator/scripts/deploy.mjs:103,162-163 @origin/main): `--allow-dirty` is described as never for production, but the code only checks `if (!dryRun && !allowDirty && gitIsDirty())`.
- DERIVED (operator/scripts/deploy.mjs:103,162-163 @origin/main; metis-2.0-exec/tasks/TASK-001/service-register.md:51): deploy quality gates exist, but production deploy provenance is not enforced.
- OBSERVED (operator/scripts/migrate.mjs @origin/main): migration applies `schema.sql` then `schema-alter.sql`, treats duplicate additive columns as already-applied, retries only additive/idempotent statements for transient transport errors and refuses placeholder database IDs.
- DERIVED (operator/scripts/migrate.mjs @origin/main): no finding is filed against `migrate.mjs`.
- OBSERVED (operator/schema.sql @origin/main): the `asks` table has `prompt_cipher`, `prompt_iv` and `preview` columns.
- OBSERVED (operator/src/index.ts:483-485 @origin/main): current ask writers set `prompt_cipher` and `prompt_iv` to `null` and write only `redactedPreview(...)`.
- OBSERVED (operator/src/privacy.ts:77-79 @origin/main): the ask projection for export/API response sets `prompt_cipher` and `prompt_iv` to `null` and exposes the redacted preview.
- UNKNOWN (operator/schema.sql @origin/main; operator/src/index.ts:483-485 @origin/main): repo source cannot prove whether existing live rows still contain historical non-null `prompt_cipher` or `prompt_iv` values.
- OBSERVED (operator/scripts/backup.mjs:11 @origin/main): `backup.mjs` documents D1 export as a full data dump that can include ciphertext Asks.
- DERIVED (operator/scripts/backup.mjs:11 @origin/main; docs/metis-2.0/kit/r11/spec/MASTER.md:1453-1479): if any live row still has non-null `prompt_cipher`, running backup would write ciphertext to a local export file, contradicting MASTER §16.6.
- OBSERVED (operator/src/export/tables.ts @origin/main): the export path uses last4-only credential/license fields, a `looksLikeSecret` guard for seat free text, and formula-injection guarding.
- DERIVED (operator/src/export/tables.ts @origin/main): `operator/src/export/tables.ts` is a positive compliance finding for the export path only, not evidence that legacy `asks` rows are clean.
- UNKNOWN (operator/scripts/backup.mjs @origin/main; docs/metis-2.0/ledger/tickets.json:9304-9344): unknown whether `backup.mjs` has ever been run against a real database; no restore-drill record exists in the repo or in `M2-0159`, which is TODO.
- OBSERVED (docs/metis-2.0/BLOCKERS.md:85,87): the missing isolated Operator staging Worker/D1 blocks live staging and restore-drill work.
- OBSERVED (docs/metis-2.0/ledger/tickets.json:9304-9344): `M2-0159` tracks the isolated D1 restore drill, drift alarms, kill switches and rotation runbooks.
- DERIVED (docs/metis-2.0/ledger/tickets.json:9304-9344): no duplicate restore-drill ticket is needed; `M2-0159` owns that execution, dependent on `M2-0103`.
- OBSERVED (docs/metis-2.0/ledger/tickets.json:8721-8760): `M2-0149` scope and acceptance cover privacy sentinels, configuration readback, supplier assurance, finite metadata retention and Worker payload lifetime.
- DERIVED (docs/metis-2.0/ledger/tickets.json:8721-8760; operator/schema.sql @origin/main): `M2-0149` does not explicitly mention `asks` schema cleanup for now-dead `prompt_cipher`/`prompt_iv` columns, so a follow-up may be needed if live ciphertext rows exist.
- OBSERVED (operator/schema.sql @origin/main): the content-free owner check for that unknown is `SELECT COUNT(*) FROM asks WHERE prompt_cipher IS NOT NULL`.
- DERIVED (docs/metis-2.0/ledger/tickets.json:12974-12995): backup ownership/cadence/retention are filed separately in `M2-0226`.

## Follow-up tickets filed

- OBSERVED (docs/metis-2.0/ledger/tickets.json:12932-12955): `M2-0225` files the production deploy provenance guard for `operator/scripts/deploy.mjs`.
- OBSERVED (docs/metis-2.0/ledger/tickets.json:12974-12995): `M2-0226` files backup ownership, cadence, retention and recovery-objective documentation before the restore drill.
