**Exposure status: no active unauthenticated exposure is established. `/v1/decide` was live in production as of 2026-09-24 and can plausibly be reached from the internet without a Cloudflare Access login, but the Worker's device HMAC or licence gate still guards it. The real residual risk is anyone holding the fleet-wide `OPERATOR_INGEST_SECRET`. Three read-only external checks (section 5) are still needed to rule out a wider Access bypass.**

# D-8 security review: the three off-main commits in the production Operator build

Deliverable for ticket M2-0521 (finding refs D-8, M2-0014, OPERATOR-REALITY). Written 2026-09-29, read-only.

Labels:
- **OBSERVED**: directly read, with its source cited.
- **DERIVED**: a conclusion drawn from cited observations.
- **ASSUMED**: inferred from partial evidence.
- **UNKNOWN**: cannot be known here.
- **BLOCKED_EXTERNAL**: needs an outside account; the exact read-only step is given.
- **RECOMMENDATION**: a proposal for the owner, not a fact.

`OR:n` means `docs/metis-2.0/review/OPERATOR-REALITY.md` line n. `SR:n` means `docs/metis-2.0/review/prior-exec/tasks/TASK-001/service-register.md` line n.

**Method and its limit.** This review ran as a headless pipeline step. The session's permission sandbox refused every read of the public clone `/Users/tony/AI-Brain-build/metis-operator-ux`: both `git -C … show --stat 926036a0` and `git -C … show origin/m2/integration:operator/src/access.ts` returned `This command requires approval`, and `ls` on the clone returned `blocked … may only list files in the allowed working directories`. So every statement below about commit contents is a **secondary observation**: it comes from in-repo records that cite `git show`, `git grep` or `gh api` output on those exact SHAs (mainly OPERATOR-REALITY, which M2-0014 produced from the public clone). No claim about commit contents was invented. The first-hand diff read is listed as a LEAD_ACTION in section 7.

No deploy, no `wrangler` command, no network request and no production request was made. The document contains no secret values, hostnames, account identifiers or personal data. Secrets appear by name only.

## 1. The three commits

The chain on `origin/metis-2.0-inventory` is `3955000e` → `9b4446c8` → `926036a0`, all dated 2026-09-20.
- OBSERVED (OR:25-28, OR:34) for the commit list and timestamps.
- OBSERVED (OR:43) that `3955000e` is the post-rewrite parent in the rewritten chain.

A 2026-09-26 history rewrite changed the hashes but not the content:
- OBSERVED (OR:39-42): the pre-rewrite hashes map to post-rewrite hashes with identical trees, proved with `gh api … .tree.sha`. The mapping is `9568d21` → `926036a0` and `6547aca1` → `9b4446c8`.

### 1.1 `3955000e`: docs only

- **What it changes.** OBSERVED (OR:26, from `git log origin/main..origin/metis-2.0-inventory --oneline`): docs only. UNKNOWN: the exact file list, because no in-repo record quotes `git show --stat 3955000e`. See LEAD_ACTION 1.
- **Bypass relevance.** DERIVED (OR:26): none. A docs-only commit changes no Worker code, so it adds no route, credential or data path.
- **Does production run it?** DERIVED (OR:43; SR:11,51; OR:39): yes, as an ancestor of the deployed stamp `9568d21`, which has the same tree as `926036a0`. It has no runtime effect.

### 1.2 `9b4446c8`: "feat(operator): Cap1 portal Jev vault + /v1/decide (typesafe_jev)"

- **What it changes.** OBSERVED (OR:27, OR:38): the subject line above; timestamp 2026-09-20 13:02:50-04:00.
- **What it adds**, per the cited source lines at `9b4446c8`/`926036a0`:
  - OBSERVED (OR:51-52, OR:55-56, OR:94): the Worker route `/v1/decide` (`operator/src/decide.ts`). It forwards to the vendor endpoint `https://api.typesafe.ai/v1/systemone`.
  - OBSERVED (OR:65): the Jev key vault (`operator/src/vault.ts`), with `JEV_PINNED_VERSION: string | null = null` at `vault.ts:27`.
  - OBSERVED (OR:65): portal kill switches in `operator/src/routes/settings-store.ts:54-56` that default to enabled (`jevEnabled: true, jevDesktop: true, jevIntel: true`).
- **Schema.** OBSERVED (OR:96): no schema-file change.
- **Portal route and UI surface.** UNKNOWN: the exact admin-portal route and UI added for storing the Jev key. ASSUMED: it sits behind the same Cloudflare Access admin stack as the rest of the portal, because no record says otherwise. See LEAD_ACTION 1.
- **Does production run it?** DERIVED (SR:11,51,59; OR:42): yes. `6547aca1` (= `9b4446c8`) is one of the two `operator/` commits in the live build, and it is an ancestor of the live stamp `9568d21`.

### 1.3 `926036a0`: "fix(operator): ACCESS bypass /v1/decide + Cap1 vault-decide proof"

- **What it changes.** OBSERVED (OR:28, OR:34; `git show --stat 926036a0` as cited there): it touches `operator/src/access.ts` and `docs/design/METIS-2.0-VAULT-DECIDE.md`.
- **What the `access.ts` change does:**
  - DERIVED (OR:48, OR:60): it adds `/v1/decide` to `ACCESS_BYPASS_PATHS`.
  - OBSERVED (OR:48, `git grep -n ACCESS_BYPASS_PATHS origin/main`): no production code reads that array; only docs and tests reference it.
  - DERIVED (OR:49-50): the array documents intent. The control that is actually enforced is the Cloudflare Zero Trust Access **Bypass policy** that the owner configures by hand in the dashboard (`docs/operator/ACCESS-BYPASS-INTEGRATIONS.md` @origin/main).
- **Other contents.** UNKNOWN: whether the `access.ts` hunk contains anything beyond that array entry. See LEAD_ACTION 1.
- **Does production run it?** OBSERVED (SR:11, SR:51, SR:53): production version `5ef9fc5a-…` was deployed 2026-09-20T17:14:07Z, stamped `OPERATOR_VERSION="9568d21"`, and was still current on 2026-09-24. OBSERVED (OR:39): `9568d21` has the identical tree to `926036a0`.
  - DERIVED: production ran this commit's tree as of 2026-09-24.
  - ASSUMED (OR:13; `operator/scripts/deploy.mjs:103,162-163` @origin/main as cited there): the deployed bytes match that tree. The deploy script only warns against `--allow-dirty` and does not block it.
  - UNKNOWN / BLOCKED_EXTERNAL: whether it is still live today (section 5).

## 2. The exact bypass condition at `/v1/decide`

"Bypass" here means bypassing **Cloudflare Access (the human SSO login)**. It does not mean bypassing Worker authentication.

- **What the bypass removes.** DERIVED (OR:49-50, OR:77-79): if the owner applied a Zero Trust Bypass policy for `/v1/decide`, requests to that path reach the Worker without the Access login redirect. OBSERVED (SR:137): the portal root answered with a redirect to the Access login on 2026-09-24, so Access wraps the host by default. BLOCKED_EXTERNAL: whether the bypass is applied, and whether it covers exactly `/v1/decide` or a wider pattern.
- **From where.** DERIVED (SR:38, SR:47): from anywhere on the public internet. The Worker is served on its `workers.dev` host (production host = `DEPLOYED_URLS.production`, `operator/scripts/deploy.mjs:43`), and there is no IP allowlist or network restriction in the config.
- **With what credential.** OBSERVED (OR:51, `operator/src/index.ts` @926036a0): `/v1/decide` goes through the same shared gate as `/v1/ask`, `/v1/use` and `/v1/ingest`. That gate calls `verifyDeviceRequest(request, bodyText, env.OPERATOR_INGEST_SECRET, store, now)` and returns on `!hmac.ok` **before** `handleDecide` runs. Two credentials satisfy it:
  1. **Licence path.** A per-device Operator licence token, plus HMAC and a single-use nonce. OBSERVED (docs/metis-2.0/review/PUBLIC-READINESS.md:45; OR:53).
  2. **Legacy fleet path.** When no licence header is present, device auth falls back to an HMAC under the one Worker-wide `OPERATOR_INGEST_SECRET`. OBSERVED (OR:53, citing `operator/src/device-auth.ts:39-51` and `index.ts:273` @origin/main; docs/metis-2.0/review/lanes/L09-operator-cloud.md:78-81). On this path the device ID is self-asserted and only shape-checked. OBSERVED (L09-operator-cloud.md:81).
- **Gates inside the handler.** OBSERVED (OR:52, `operator/src/decide.ts` @926036a0), in order:
  - seat approval (`seatAuthorizedForKeys`, else `SEAT_NOT_APPROVED`)
  - vault-key presence (`decryptVault`/`decodeVaultPlaintext`)
  - the fixed `DECIDE_TEMPLATES` allowlist
  - `PAYLOAD_JSON_CAP = 8_000`
  - a clamped upstream deadline
  - secret redaction on vendor refusal (`providerRefusedPayload`)
  - a `decide` rate-limit bucket
- **With no credential.** DERIVED (OR:51, OR:60): an unauthenticated request gets the Worker's auth rejection and never reaches the vendor or the vault. **Nobody can reach `/v1/decide` with no credential.**
- **The real weakness.** DERIVED (OR:54; L09-operator-cloud.md:81): anyone holding `OPERATOR_INGEST_SECRET` can sign requests as **any** shape-valid device ID, including the ID of an approved seat. That defeats the seat-approval gate on the legacy path.
- **Where that secret lives.**
  - OBSERVED (docs/metis-2.0/review/lanes/L09-operator-cloud.md:83; PUBLIC-READINESS.md:45): it is not embedded in the packaged app or in the repository.
  - OBSERVED (OR:70, `src/shared/operator.ts:34-45` @origin/main): a desktop seat can hold it as a saved `operatorIngestSecret` setting.
  - DERIVED: any machine configured with the legacy secret holds a fleet-wide `/v1/decide` credential.
  - UNKNOWN: how many seats do.

## 3. Data and actions exposed through the route

- **Action: a vendor call billed to the owner's Jev account.** DERIVED (OR:52, OR:55-56): an authenticated caller makes the Worker decrypt the stored Jev/TypeSafe key and call the vendor with a caller-supplied `payload` (up to 8,000 chars) under one of the allowlisted templates.
- **Is the Jev secret disclosed?**
  - DERIVED (OR:52): no disclosure path is identified. The key is used server-side and vendor refusals are redacted.
  - UNKNOWN: whether any non-refusal error path echoes upstream headers. This needs the first-hand read (LEAD_ACTION 1).
- **Vault exposure.** DERIVED (OR:52, SR:52): `OPERATOR_VAULT_KEY` is set in production and is used only to decrypt inside the handler. No route in these commits is recorded as returning vault plaintext.
- **D1 exposure.** OBSERVED (OR:58-59, `decide.ts:252-261` @926036a0): the handler writes only an audit row and an event whose detail is the template name, plus rate-limit rows. DERIVED: it writes no prompt or result content to D1, and D1 content is not readable through this route.
- **Third-party data flow.** DERIVED (OR:57): the desktop `action_disambiguate` path would forward spoken or typed command text to the vendor. OBSERVED (OR:73, `src/main/index.ts:2619-2623` @origin/main): that desktop path is dormant on main (`jevEnabled` is never wired true). UNKNOWN: whether any installed build calls `/v1/decide`.
- **Cost and availability.** DERIVED (OR:61; L09-operator-cloud.md:89): the `decide` rate limit uses a non-atomic read-then-write, so concurrent requests can exceed it and spend vendor quota.
- **Unready controls.** OBSERVED (OR:65): kill switches default ON, the vendor version is unpinned, the payload is untyped and not bound to candidates, and there are no budgets or circuit breakers. DERIVED (OR:65): the route does not meet M2-0123 acceptance.
- **Public source.** OBSERVED (PUBLIC-READINESS.md:45): the off-main source is publicly readable, so an attacker needs no private knowledge of the gate. That does not weaken the gate.

## 4. Threat assessment (CVSS-style reasoning, no exploit steps)

| Factor | Assessment | Basis |
|---|---|---|
| Attack vector | Network. The route is reachable from the internet if the Access Bypass policy is applied. | DERIVED §2; BLOCKED_EXTERNAL for the policy scope |
| Attack complexity | High for an outsider: it needs a valid licence (licence path) or the fleet secret (legacy path), neither of which is public. | DERIVED §2 |
| Privileges required | High (fleet secret) or Low (a legitimate seat's licence acting within its own seat) | DERIVED §2 |
| User interaction | None | DERIVED |
| Confidentiality | Low. No vault, D1 or secret disclosure path is identified. Caller-supplied content goes to a third-party vendor. | DERIVED §3 |
| Integrity | Low. Only audit, event and rate-limit rows are written. | OBSERVED OR:58 |
| Availability / cost | Low to medium. Vendor quota spend is possible beyond the non-atomic rate limit. | DERIVED §3 |
| Overall | **Medium** from an outside attacker. It becomes **High** if `OPERATOR_INGEST_SECRET` is ever exposed, because the holder can impersonate any seat and spend the Jev account without limit. | DERIVED; this matches PUBLIC-READINESS.md:45 ("Real severity: medium … a governance gate") |

**Blast radius:**
- **Vault.** Used, not disclosed.
- **D1.** Metadata writes only.
- **Jev secret.** Not disclosed, but usable by any fleet-secret holder.
- **Beyond the route.** The same fleet secret also opens `/v1/ask`, `/v1/use` and `/v1/ingest` (OR:51). So a leaked fleet secret is already a High-severity problem on main, independent of D-8 (M2-0145).

**Is anything exposed right now?**
- DERIVED: no unauthenticated exposure is established.
- UNKNOWN: whether the route is still live today, whether the Access Bypass policy is scoped exactly to `/v1/decide`, and whether any legacy-secret seat or leak exists.
- **Governance exposure (DERIVED, OR:66-67, OR:109-111):** unreviewed code is serving production. That is a present fact as of 2026-09-24, and it is what D-8 is about.

## 5. Read-only checks still needed (owner or scoped read-only token)

- BLOCKED_EXTERNAL (SR:63): `npx wrangler deployments list --name metis-operator`. This confirms whether version `5ef9fc5a-…` (stamp `9568d21`) is still the one deployed.
- BLOCKED_EXTERNAL (OR:77-78): Zero Trust dashboard → Access → Applications → Métis Operator → Policies, read-only view (or `GET /accounts/{account_id}/access/apps/{app_id}/policies`). This confirms whether the Bypass policy path scope is exactly `/v1/decide` plus the documented integration paths, with no wildcard.
- BLOCKED_EXTERNAL (OR:79): `curl -sI https://<DEPLOYED_URLS.production>/v1/decide`.
  - A `401` JSON response means Worker auth is answering (bypass applied, gate holding).
  - A `302` to the Access login means Access still wraps the route.
  - Any `2xx` without credentials would be an **active exposure**: stop and escalate.

## 6. Options for the owner

**Option A: revert the bypass and redeploy the Worker from main.**
- **How:**
  - Remove the Access Bypass policy entry for `/v1/decide`.
  - Once the owner lifts the D-8 deploy hold, deploy the `origin/main` Worker, which has no `/v1/decide` (SR:60; OR:67).
- **Pros:**
  - Production returns to reviewed code.
  - The route and the vendor data flow disappear.
  - Main's two newer `operator/` integrity commits (`4b7c4d8d`, `26c039fb`) finally reach production (OR:62).
  - No user impact is expected, because main's desktop decide path is dormant (OR:73).
- **Cons:**
  - Cap1 decide capability is lost until M2-0123 rebuilds it.
  - Main's deploy script is still human-run and not enforced from `origin/main` (OR:109-111; follow-up in OR:133).
  - Main's `schema`/`settings-store` differences need confirming against live D1 (OR:83-101; SR:52).

**Option B: merge through a reviewed PR with specific fixes.**
- **How:** cherry-pick exactly `9b4446c8` and `926036a0` into the program integration branch, preserving `4b7c4d8d` and `26c039fb` (OR:66). This is a 33-file two-way reconciliation, not a fast-forward (OR:63).
- **Fixes required before merge:**
  - Kill switches default **OFF**.
  - Pin the vendor version.
  - Typed, candidate-bound payloads with budgets and circuit breakers (M2-0123).
  - Accept only licence-path credentials on `/v1/decide`, with no legacy fleet HMAC (M2-0145).
  - An atomic rate limit (L09 F4).
  - Supplier assurance and no-retention evidence for the vendor (M2-0149).
  - Keep `ACCESS_BYPASS_PATHS` and the dashboard policy in lock-step, with a test.
  - A staging test (staging does not exist, SR:12).
- **Pros:** keeps the capability, and production code becomes reviewed.
- **Cons:** the most work; it depends on M2-0123, M2-0145, M2-0149 and on staging existing (M2-0103). Production keeps running unreviewed code until the merge lands.

**Option C: keep as-is with compensating controls.**
- **How:**
  - Turn the portal-wide Jev kill switch OFF, so `/v1/decide` refuses before any vendor call. DERIVED (OR:95); the switch's actual effect needs the first-hand read.
  - Narrow the Access Bypass policy to the exact path.
  - Confirm no seat still uses the legacy `operatorIngestSecret`. Rotate `OPERATOR_INGEST_SECRET` if any exposure is suspected.
  - Watch `decide` audit events.
- **Pros:** fastest, with no deploy.
- **Cons:**
  - Production stays on an unreviewed, off-main build that lacks main's integrity fixes.
  - Drift grows.
  - It violates MASTER §20.4.2 reviewable-deploy intent (docs/metis-2.0/review/prior-exec/tasks/TASK-002/prd-lock.md:189).

**RECOMMENDATION.**
1. **Now:** apply Option C's kill-switch-OFF and policy-scope check as an interim control. It is an owner portal action and needs no deploy.
2. **Then:** take **Option A** (revert to main's Worker) as the durable fix once the owner lifts the D-8 hold.
3. **Later:** reintroduce `/v1/decide` only through Option B's reviewed PR under M2-0123.

Do **not** merge `9b4446c8`/`926036a0` unchanged. This matches OR:80.

If the `curl` check in section 5 returns `2xx` without credentials, skip ahead: an urgent revert (Option A) becomes the recommendation immediately.

## 7. Lead and owner steps

LEAD_ACTION: from the public clone, run `git show --stat 3955000e`, `git show 9b4446c8 -- operator/` and `git show 926036a0 -- operator/src/access.ts`, and attach the output. This turns section 1's secondary observations into first-hand ones and resolves the three UNKNOWNs in sections 1.1-1.3 and 3. This session's sandbox refused those reads.
LEAD_ACTION: relay the exposure-status line at the top of this document to the owner with the D-8 decision request, and ask the owner to run the three read-only checks in section 5.
LEAD_ACTION: if the section 5 `curl` returns `2xx` without credentials, ask the owner for an urgent D-8 ruling the same day.
LEAD_ACTION: keep D-8 `ANSWERED_PARTIAL` in `docs/metis-2.0/DECISIONS.md` until the owner rules on this document's findings; the "no Operator deploy from main" hold stays in force.
LEAD_ACTION: dispatch the independent Opus review of this document (ticket verification).
