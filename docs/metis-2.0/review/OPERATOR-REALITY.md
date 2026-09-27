# M2-0014 Operator Production Reality

Investigation deliverable for M2-0014. Labels: OBSERVED means directly read in this worktree or supplied by the driver session's public-repo forensic read; DERIVED means a conclusion from those observations; UNKNOWN means not knowable here; BLOCKED_EXTERNAL means owner-authorized Cloudflare access is required.

## 1. Deployed Worker version and commit

- BLOCKED_EXTERNAL (docs/metis-2.0/BLOCKERS.md:24,45): this worktree has no Cloudflare session or scoped token, so the deployed Worker version/commit cannot be verified here.
- OBSERVED (docs/metis-2.0/BLOCKERS.md:24): the owner-runnable read-only command is `wrangler deployments list`.
- OBSERVED (driver session, 2026-09-27): public repo `main` was at `22d1fbadea6493f8b0ab7b1b7ada3a4acb86331f` on 2026-09-23 at verification time.
- OBSERVED (driver session, 2026-09-27): an off-main status doc recorded a historical `/health` response on 2026-09-20 with version `2b26efa` and builtAt `2026-09-14T02:50:46.011Z`; that snapshot predates the Cap1 commits and is not current deployment evidence.
- UNKNOWN: today's deployed Worker version and commit until `wrangler deployments list` is run by the owner or with a scoped read-only token.

## 2. Security review and merge-or-revert recommendation

- OBSERVED (docs/metis-2.0/DECISIONS.md:110; docs/metis-2.0/BLOCKERS.md:147): D-8 is OPEN and asks whether to merge the off-main production Operator build through review or revert; the decision is security-escalated and affects tickets 0014, 0103, 0123, 0145 and 0159.
- OBSERVED (driver session, 2026-09-27): the off-main ACCESS-bypass commits are on `origin/metis-2.0-inventory`, not merged to `main`; `git merge-base --is-ancestor` confirmed they are not ancestors of `origin/main`.
- OBSERVED (driver session, 2026-09-27): commit `9b4446c8` adds `operator/src/decide.ts`, tests, `POST /v1/decide`, a `decide` rate-limit bucket, a heartbeat `decisionProviders.jev` flag, Keys UI support and a `typesafe_jev` vault provider; it does not change `operator/schema.sql` or `operator/schema-alter.sql`.
- OBSERVED (driver session, 2026-09-27): commit `926036a0` adds only `'/v1/decide'` to `ACCESS_BYPASS_PATHS`, whose existing comment says those paths must bypass Cloudflare Access because Worker auth is HMAC or public health/assets.
- OBSERVED (driver session, 2026-09-27): `/v1/decide` is wired into the same router branch as `/v1/ask`, `/v1/use`, `/v1/heartbeat`, `/v1/ingest` and `/v1/integrations`; that branch verifies the device HMAC through `verifyDeviceRequest(...)` before any handler runs.
- OBSERVED (driver session, 2026-09-27): an existing public-main doc, `docs/operator/ACCESS-BYPASS-INTEGRATIONS.md`, documents the same bypass-list pattern as the fix for `/v1/integrations` being incorrectly intercepted by Cloudflare Access before Worker HMAC auth could return its own response.
- OBSERVED (driver session, 2026-09-27): `handleDecide` adds further gates after router HMAC: vault-key presence, seat approval, portal and per-template kill switches, fixed template allowlist, 8000-byte payload cap, clamped upstream deadline and secret-redaction checks.
- DERIVED: adding `/v1/decide` to `ACCESS_BYPASS_PATHS` is not itself an authentication bypass; it moves browser/session-cookie Cloudflare Access aside for a device-HMAC route already authenticated by the Worker, matching the shipped `/v1/ask` and `/v1/use` pattern.
- DERIVED: the security concern is production provenance, not the one-line ACCESS entry alone: production appears to have accepted off-main commits that had not gone through the normal reviewed main/CI path.
- RECOMMENDATION: merge the off-main Operator commits only via a reviewed PR that runs the normal `build.yml` gate first, then deploy from the reviewed mainline path. Revert is the safer fallback if D-8's reviewer does not accept the HMAC/seat/kill-switch design or cannot reconcile the deployed artifact to the reviewed commits.
- BLOCKED_EXTERNAL / OWNER DECISION: this report does not execute a merge or revert; D-8 remains the owner/security-reviewer decision.
- OBSERVED (driver session, 2026-09-27): the SHA recorded in prior off-main docs as deploy target (`9568d21`) does not match the reachable `origin/metis-2.0-inventory` commit hashes; likely local rebasing/re-committing, but this cannot be confirmed without live Worker `/health` evidence.

## 3. Live D1 schema reconciliation

- BLOCKED_EXTERNAL (docs/metis-2.0/BLOCKERS.md:24,45): the live D1 table list requires owner-authorized read-only Cloudflare access.
- OBSERVED (docs/metis-2.0/BLOCKERS.md:24): the owner-runnable read-only command is `wrangler d1 execute <db> --command "SELECT name FROM sqlite_master"`.
- OBSERVED (driver session, 2026-09-27): current public-repo source defines 18 `CREATE TABLE` statements: `seats`, `asks`, `pulses`, `events`, `vault_keys`, `crm_sends`, `nonces`, `rate_limits`, `proposals`, `packs`, `audit`, `issued_licenses`, `sessions`, `groups`, `group_members`, `tiers`, `integrations`, `integration_grants`.
- OBSERVED (driver session, 2026-09-27): `operator/schema-alter.sql` only adds columns to existing tables and idempotently re-declares `pulses` and `crm_sends`; it defines zero net-new tables.
- OBSERVED (driver session, 2026-09-27): neither off-main Operator commit changes `operator/schema.sql` or `operator/schema-alter.sql`.
- DERIVED: current source accounts for 18 tables, not the 19 cited elsewhere; that is a minor, immaterial discrepancy for this ticket because the reported live/source gap is about roughly 28 live tables versus source.
- DERIVED: the off-main branch is not a plausible source-side explanation for a 28-live-table gap because it does not touch the schema files.
- UNKNOWN: whether production D1 has 28 tables, which extra tables exist, and whether any extra table stores prohibited content. That remains blocked on the read-only D1 query above.

## 4. deploy/migrate/backup/export review against MASTER section 16 and restore-drill requirement

- OBSERVED (docs/metis-2.0/kit/r11/spec/MASTER.md:1453-1455): MASTER §16.6 defines confidential content and prohibits writing it to Cloudflare-controlled application storage, response caches, payload logs, durable queues or diagnostic exports while permitting finite administrative metadata.
- OBSERVED (docs/metis-2.0/kit/r11/spec/MASTER.md:1471-1479): MASTER §16.6.2 requires no prompts, transcripts, recordings or inference results in D1/KV/R2/Durable Object/Queues, Worker logs, traces, support bundles, retries or user-approved knowledge copies.
- OBSERVED (docs/metis-2.0/kit/r11/spec/MASTER.md:1504-1508): MASTER §16.6.4 requires sentinel tests and configuration readback across controlled sinks, with drift detection against the approved live configuration.
- OBSERVED (docs/metis-2.0/kit/r11/spec/MASTER.md:1315): MASTER requires recovery objectives, backup ownership, retention and a restore drill, verified in a real isolated staging environment; file sync is not a tested backup strategy.
- OBSERVED (driver session, 2026-09-27): no public-repo GitHub workflow deploys Operator; `operator/scripts/deploy.mjs` is human-run, verifies tests/types/build/migration/smoke, and stamps `OPERATOR_VERSION` from the checked-out `HEAD`, but it does not enforce that production deploys come from `main` or another approved ref.
- DERIVED: deploy quality gates exist, but deploy provenance is not enforced; this is a real gap because it allowed production to be deployed from `metis-2.0-inventory` instead of reviewed `main`.
- OBSERVED (driver session, 2026-09-27): `operator/scripts/migrate.mjs` applies `schema.sql` then `schema-alter.sql`, treats duplicate additive columns as already-applied, retries only additive/idempotent statements for transient transport errors and refuses placeholder database IDs.
- DERIVED: no finding is filed against `migrate.mjs`.
- OBSERVED (driver session, 2026-09-27): `operator/scripts/backup.mjs` is a unit-tested command builder for D1 export/restore instructions; it explicitly avoids committing full D1 dumps and explains safe restore into a fresh D1 instance, but it has not been run against a real database and no restore drill has been rehearsed end to end.
- OBSERVED (docs/metis-2.0/BLOCKERS.md:85,87): the missing isolated Operator staging Worker/D1 blocks live staging and restore-drill work.
- OBSERVED (docs/metis-2.0/ledger/tickets.json:9304-9343): M2-0159 already tracks the actual isolated D1 restore drill, drift alarms, kill switches and rotation runbooks.
- DERIVED: no duplicate restore-drill ticket is needed; M2-0159 owns that execution, dependent on M2-0103.
- DERIVED: backup ownership/cadence/retention are not explicitly accepted by M2-0159, so a focused follow-up was filed.
- OBSERVED (driver session, 2026-09-27): `operator/src/export/tables.ts`'s export design is content-minimizing: `asks` has no stored prompt/response/content column, license and integration exports use last4 only, seats free text passes `looksLikeSecret`, and CSV/XLSX writers share formula-injection guarding.
- DERIVED: `operator/src/export/tables.ts` is a positive compliance finding for MASTER §16.6; no ticket is needed for that file.

## Follow-up tickets filed

- OBSERVED (docs/metis-2.0/ledger/tickets.json:12917-12955): `M2-0225` files the production deploy provenance guard for `operator/scripts/deploy.mjs`.
- OBSERVED (docs/metis-2.0/ledger/tickets.json:12957-12996): `M2-0226` files backup ownership, cadence, retention and recovery-objective documentation, linked to the staging/restore-drill chain.
