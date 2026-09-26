# Lane L09 — operator-cloud

Repo: `/Users/tony/AI-Brain-build/metis-2.0` (read-only checkout, origin/main `2bf21f1c`, v1.9.6)
Reviewer: staff-engineer audit pass, AUDIT mode (brownfield discovery + domain-boundary method skimmed; five-axis review: correctness, readability, architecture, security, performance/reliability/testability).
Scope: `operator/` (`src`, `client`, `scripts`, `wrangler.jsonc`, `schema.sql`, `schema-alter.sql`), `cloudflare-proxy/`, `license-server/`.

## 0. Overall read

This is, like the main-process security lane (L05), a heavily self-documented codebase: nearly every non-trivial function in `operator/src/` carries a comment explaining the exact threat or race it closes, and a lot of that documentation is accurate and matches the code. The HMAC device-auth path (`hmac.ts`/`device-auth.ts`), the Cloudflare Access + session-cookie stack (`access.ts`), the vault/prompt AES-GCM + Ed25519 primitives (`crypto.ts`), the SSE secret-leak guard in the streaming Ask proxy (`ask.ts`), and `cloudflare-proxy/src/index.ts` (a two-route forwarding shim with constant-time auth and a deliberately-never-relayed-upstream-error policy) are all genuinely careful, correct engineering. I ran the full local test suites for `operator/` and `license-server/` rather than trusting the diff; both are effectively green (see §2). The findings below are the real gaps, plus one significant architecture/wiring defect (F1) that survived that level of scrutiny.

I did not pad this with generic advice. Every finding cites file:line and, for the two headline items, I ran code (tests, and cross-file greps across every layer that touches the behavior) rather than inferring from one file in isolation.

---

## 1. Findings (most severe first)

### F1 — P1 / architecture + correctness: "brokered" MCP connector integrations ship a dead seat-facing endpoint — `POST /v1/mcp/:id` is never routed

**Files:** `operator/src/routes/mcp-gateway.ts:1-7`, `operator/src/routes/integrations-seat.ts:250-260`, `operator/src/routes/integrations.ts:270,298`, `operator/src/routes/connectors-oauth.ts:240-246`, `operator/schema-alter.sql:206`, `operator/src/connectors/gateway-token.ts:1-145`, `operator/src/index.ts:204-298` (full router)
**Evidence label:** OBSERVED at every layer below (four independent code paths agree; I read the full request router and confirmed the endpoint cannot be reached by construction, not just "wasn't found by grep").

`GET /v1/integrations` (wired in `index.ts:282-285`, handled by `handleIntegrationsSeat` in `integrations-seat.ts`) delivers each entitled seat's active connector integrations. For any integration whose `extra.mode !== 'direct'` it takes the `else` branch at `integrations-seat.ts:250-260`:

```ts
delivered.push({
  id: row.id,
  kind: row.kind,
  label: row.label,
  transport: extra.transport ?? 'rest',
  mode: 'brokered',
  endpoint: `/v1/mcp/${row.id}`,
  gatewayToken: await mintGatewayToken(env.OPERATOR_INGEST_SECRET, deviceId, row.id, now),
  scopes: parseIntegrationScope(row.scope_json)
})
```

i.e. the desktop client is told: *call `POST /v1/mcp/<id>` with `Authorization: Bearer <gatewayToken>`*. I then checked every place that could make that endpoint reachable:

- **`index.ts`'s router** (`routeRequest`, lines 204-298, quoted in full above in my working notes) dispatches on `/health`, public asset paths, `/logout`, console/admin paths (`isConsolePath`/`isAdminApiPath`, i.e. `/` and `/v1/admin/*`), and six explicit `url.pathname === '/v1/...'` equality checks (`ingest`, `heartbeat`, `skills/manifest`, `use`, `ask`, `integrations`). There is no case for `/v1/mcp/*`, and a path of that shape matches none of the above, so it falls straight through to the final line: `return json({ ok: false, error: 'not found' }, 404)`. This is true **regardless of what the route registry contains**, because `/v1/mcp/:id` is not under `/v1/admin` and is not one of the six literal paths — `matchRoute`/the admin registry is never even consulted for it.
- **`routes/mcp-gateway.ts`** — the module whose own doc-comment claims "the seat-facing POST /v1/mcp/:id is dispatched from index.ts" — is an empty stub: `registerMcpGatewayRoutes(): void { /* Intentionally empty until the feature lands. */ }`. Its own comment is stale/wrong about the current state of `index.ts`.
- **`connectors/gateway-token.ts`** implements a complete, correct HKDF-derived HMAC bearer-token scheme (`mintGatewayToken`/`verifyGatewayToken`, claims `{device, connection, iat, exp}`, 1-hour TTL, constant-time compare) for exactly this purpose. `grep -rln "verifyGatewayToken" src/` (excluding this file itself) turns up only `gateway-token.test.ts` and `integrations-seat.test.ts` — **it is never called from any request handler.** The token this route mints is verified nowhere in production.
- **This is not a rare configuration.** `mode: 'brokered'` is the default at three independent layers, not an edge case an admin has to opt into:
  1. `routes/integrations.ts:270`: `mode: body.mode === 'direct' ? 'direct' : 'brokered'` — any admin-console "add connector" call that doesn't explicitly send `mode: 'direct'` (including simply omitting the field) creates a brokered row.
  2. `routes/connectors-oauth.ts:244`: the OAuth authorization-code callback — the path every catalog OAuth connector (the vendor-consent-page flow) goes through — **hardcodes** `mode: 'brokered'` unconditionally on every successful connection.
  3. `schema-alter.sql:206`: `ALTER TABLE integrations ADD COLUMN mode TEXT NOT NULL DEFAULT 'brokered'` — the column itself defaults to brokered at the D1 schema level.

Net effect: turn on any OAuth-based connector (Zoho, Microsoft, or any future auth-code catalog entry) through the admin console's own "connect" flow, or create one without explicitly forcing `direct` mode, and every entitled seat's desktop client will be told to call an endpoint that 404s, forever. The mint-a-bearer-token machinery, the audit rows (`integration-delivered`), and the seat-side polling all run and appear to work — the failure is silent from the Worker's perspective (a 404 is a normal, logged response, not an error state anyone monitors) and only visible as a broken feature on the desktop.

**Fix direction:** either wire the real gateway (verify `Authorization: Bearer` with `verifyGatewayToken`, look up the integration row, re-check license/approval/tier/scope as the module's own doc-comment describes, then proxy to the connector) into `index.ts`'s explicit `/v1/*` dispatch list and `routes/mcp-gateway.ts`, or — if B3 genuinely isn't ready — stop shipping `mode: 'brokered'` as the default in `integrations.ts` and `connectors-oauth.ts` until the gateway route exists, so `GET /v1/integrations` never hands a seat an endpoint that cannot answer.

---

### F2 — P1 / process + reliability: `license-server/` has **zero CI coverage** despite a large, currently-green local test suite

**Files:** `.github/workflows/build.yml` (all jobs), `package.json` (root), `license-server/package.json`
**Evidence label:** OBSERVED (absence confirmed by full-file read of every workflow + root `package.json`) + OBSERVED (ran the suite myself).

`.github/workflows/build.yml` defines five jobs: `quality`, `operator`, `security`, `build-macos`, `build-windows`. `operator/` has its own dedicated CI job (typecheck + `vitest run --config operator/vitest.config.ts` + a "generated bundle is not stale" gate) and `cloudflare-proxy/` is chained into the root `npm test` via `test:proxy` (root `package.json`'s `test` script: `... && npm run test:proxy && npm run test:operator`), which the `quality` job runs. **`license-server` appears nowhere**: not in any workflow file (`grep -rn "license-server" .github/workflows/` → no matches), not in root `package.json`'s scripts, and root `package.json` declares no `workspaces` field, so root `npm ci`/`npm audit`/`npm test` never touch `license-server/package-lock.json` or its dependency tree at all. `license-server/package.json`'s own `"test": "node --test"` is never invoked by anything in `.github/`.

This is not a paper gap — `license-server/` has substantial test coverage that would have caught real regressions: `server.test.mjs` (947 lines), `ops.test.mjs`, `v1.test.mjs`, `mqa284-client-contract.test.mjs`, `dependency-compat.test.mjs`, `lib/csv.test.mjs` (141 tests total). I ran all six files myself (`node --test`, Node 22.22.3): every one passes standalone —

```
lib/csv.test.mjs               6/6 pass
dependency-compat.test.mjs     5/5 pass
mqa284-client-contract.test.mjs 5/5 pass
ops.test.mjs                   24/24 pass
server.test.mjs + v1.test.mjs  101/101 pass (combined run)
```

(Inside this sandbox, `node --test` initially failed every network-bound test with `EPERM: operation not permitted 0.0.0.0` — a sandbox local-port-binding restriction, not a real defect; re-run with the sandbox bypassed for this one read-only command, all 141 pass. I flag this so the number "0 failures" isn't mistaken for something the sandbox produced by accident.) So: this is a server the task brief itself flags as revenue-critical ("Standalone license/seat-cap phone-home server... deployed independently of the Electron app"), with real, currently-passing coverage for exactly the things that matter (offline Ed25519 lease issuance/verification, admin trial minting, the anti-spoofing X-Forwarded-For lockout test, the MQA-284 client-contract shape test), and none of it runs automatically. A regression here — in seat-cap enforcement, in the admin bearer-token brute-force lockout, in the offline-lease signature check — would only be caught if someone remembers to run it by hand.

**Fix direction:** add a `license-server` job to `build.yml` (own `npm ci` inside `license-server/`, then `npm test`), and fold `npm audit --audit-level=critical`/`=high` for its own `package-lock.json` into the existing `security` job (or a new one) the same way the root project's dependency audit already runs. This is a small, mechanical CI addition — the tests already exist and already pass.

---

### F3 — P2 / security architecture (tenant isolation): the legacy no-license HMAC path authenticates "knows the shared ingest secret," not "is device X" — no per-device binding

**Files:** `operator/src/device-auth.ts:41-50` (`verifyDeviceRequest`), `operator/src/hmac.ts:42-77` (`verifyIngestHmac`)
**Evidence label:** OBSERVED (Worker-side code) + DERIVED, cross-referenced against `src/shared/operator.ts:34-45` (out of this lane's file scope, read only to establish where the fallback secret comes from — flagging for L05/main-lane cross-reference, not re-litigating that lane).

`verifyDeviceRequest` (`device-auth.ts:48-51`) selects protocol on header presence: `if (licenseHeader === null) return verifyIngestHmac(request, bodyText, serverSecret, store, now)` — the "legacy fleet HMAC" path, used whenever a device has no per-device Operator license token configured. `verifyIngestHmac` (`hmac.ts:42-77`) then authenticates a request against a **single, Worker-wide** secret (`env.OPERATOR_INGEST_SECRET`): the `deviceId` in this path is simply the value of the `X-Operator-Device` header (validated only for shape via `DEVICE_ID_RE`, `hmac.ts:40`) — it is **not itself cryptographically bound to the caller**. Anyone who can compute a valid HMAC over `(ts, nonce, deviceId, bodyHash)` with the one shared secret can present *any* `deviceId` string and have it accepted as that device, for `/v1/ingest`, `/v1/heartbeat`, `/v1/skills/manifest` (unauthenticated-content anyway), `/v1/use` and `/v1/ask` — i.e. this is the path that gates access to Operator-funded LLM keys and to a device's own ask history.

I read `src/shared/operator.ts:34-45` only to establish how exploitable this is in practice: `resolveOperatorCredential` falls back to this shared secret (`env.METIS_OPERATOR_INGEST_SECRET`) only when the device has **no** saved `operatorLicenseToken`/`operatorIngestSecret`, and that env var is read from the *running process's own environment* — I found no reference to it in `electron-builder.yml`'s `extraResources`/env-injection blocks, so it is very unlikely to be embedded in an end-user's packaged install by default (a real customer's Mac would have to have that OS env var explicitly set, which packaged consumer installs don't do). In other words: **this is not "any Métis user can impersonate any other user's device."** It is exploitable only by whoever holds `OPERATOR_INGEST_SECRET` itself (Tony's own dev/CI/build environment, or anyone who obtains a copy of that Wrangler secret through some other compromise) — but for that population, the Worker provides **zero** compensating device-isolation control on this path: knowing the one shared secret is sufficient to read/write ingest data as, and spend Operator-funded provider budget under, any `deviceId` of the caller's choosing. This is worth closing before wider enterprise rollout (the v2.0 "enterprise readiness" goal), since it means the blast radius of that one secret leaking is "every device in the fleet," not "the specific device it was scoped to."

**Fix direction:** either retire the legacy no-license path entirely once real licenses are universally required (the code comments already suggest this is the intended end-state — "Header presence selects the protocol: a bad licence must never fall back to legacy fleet HMAC"), or bind it to something device-specific (e.g. require the desktop to also present its `hashOperatorId(machineId)` pre-registered against a seat row before the legacy path can write to a *different* device's row than the one it first ever reported — today `upsertSeat`'s primary key is the same self-asserted `device_id`, so there is no such check).

---

### F4 — P2 / correctness (rate-limit bypass under concurrency): `hitRate` is a non-atomic read-then-write, not a compare-and-swap

**File:** `operator/src/d1.ts:279-296`
**Evidence label:** OBSERVED.

```ts
async hitRate(deviceId, now, windowMs, max) {
  const cur = await db.prepare('SELECT window_start, count FROM rate_limits WHERE device_id = ?').bind(deviceId).first(...)
  if (!cur || now - cur.window_start > windowMs) { ... INSERT ... ON CONFLICT DO UPDATE ...; return false }
  const next = cur.count + 1
  await db.prepare('UPDATE rate_limits SET count = ? WHERE device_id = ?').bind(next, deviceId).run()
  return next > max
}
```

This is a plain SELECT followed by an unconditional UPDATE with the value computed from the SELECT — there is no `WHERE count = ?` guard and no D1 transaction wrapping the pair. Two requests from the same device (or the same admin, for the admin-mutation limiter at `index.ts:247-252`, which calls this same primitive) that arrive close enough together both read the same `cur.count`, both compute the same `next = cur.count + 1`, and both write that same value — the second increment is lost. Under genuine concurrency (a burst, or a client that fires several requests in parallel rather than serially — which is exactly the traffic shape a client trying to defeat the limiter, or one of the `capture.failed`-style retry storms the lead's runtime evidence (E5) describes on the desktop side, would produce) this under-counts real request volume, so the configured caps in `index.ts`'s `RATE_LIMITS` (heartbeat 5, ingest 60, use 120, ask 120, manifest 5, integrations 10 per minute) are **softer than they read** — a burst of N simultaneous requests can land as fewer than N counted hits.

**Fix direction:** make the increment itself atomic, e.g. `UPDATE rate_limits SET count = count + 1 WHERE device_id = ? AND window_start = ?` read back via `RETURNING count` (D1/SQLite supports `RETURNING`), or an `INSERT ... ON CONFLICT DO UPDATE SET count = count + 1` keyed on a rounded window boundary rather than a first-writer-wins `window_start`, which removes the separate read entirely.

---

### F5 — P2 / performance: every authenticated request pays an extra unconditional D1 write to prune the nonce table

**File:** `operator/src/d1.ts:270-277`
**Evidence label:** OBSERVED.

```ts
async takeNonce(nonce, ts) {
  const result = await db.prepare('INSERT INTO nonces (nonce, ts) VALUES (?, ?) ON CONFLICT(nonce) DO NOTHING').bind(nonce, ts).run()
  if (result?.meta?.changes !== 1) return true
  await db.prepare('DELETE FROM nonces WHERE ts < ?').bind(ts - NONCE_TTL_MS).run()
  return false
}
```

`takeNonce` runs on **every** HMAC-verified request (`heartbeat`, `ingest`, `use`, `ask`, and the OAuth-callback `state` nonce via `verifyOAuthState`). The insert-with-conflict-check is the correct atomic replay guard. But the cleanup `DELETE FROM nonces WHERE ts < ?` fires unconditionally after every single successful (non-replayed) request — this is a second D1 write per request purely for table hygiene, on the hottest paths in the Worker (`/v1/ask` and `/v1/use`, which are already doing a provider round-trip). At any real fleet scale this doubles D1 write volume for no functional benefit beyond keeping the table small; the cleanup is idempotent and time-based, so it does not need to run on every request to be correct — it only needs to run often enough that the table doesn't grow unbounded.

**Fix direction:** move the sweep to the existing retention cron (`retention.ts`, already runs daily via the `scheduled` handler in `index.ts:622-629` and already owns `mcp_calls`/`integration_grants` pruning) instead of doing it inline on the request's own critical path, or gate it behind a cheap probabilistic check (e.g. only sweep on ~1% of calls, or when `nonce`'s low bits hit a threshold) so the amortized cost stays low without adding a cron dependency to every request.

---

### F6 — P3 / reliability: `cloudflare-proxy`'s `/v1/chat/completions` has no request-body size cap before forwarding upstream

**File:** `cloudflare-proxy/src/index.ts:392-398`
**Evidence label:** OBSERVED (this file) + DERIVED (comparison to the sibling proxy in `operator/`).

```ts
upstream = await fetch(upstreamUrl, {
  method: 'POST',
  headers: upstreamHeaders,
  body: await request.text()
})
```

`operator/src/use.ts`'s `readUseBody` enforces a 6 MB cap (`REQUEST_BODY_CAP_BYTES`) both via `Content-Length` and a running byte count while streaming the body, before it ever reaches JSON parsing or a provider call. `cloudflare-proxy/src/index.ts` — the sibling Worker that forwards to the same Cloudflare AI endpoint on the operator's own account credential — reads the entire request body with `await request.text()` with no analogous cap. A caller holding a valid `METIS_PROXY_KEY` (or one that leaked) can send an arbitrarily large body; it gets buffered and forwarded to `api.cloudflare.com` on the operator's account, at the operator's expense, bounded only by the Workers platform's own request-size ceiling rather than an application-level limit this Worker chose. Low severity because it requires a valid proxy key (this Worker is explicitly "the gate that stops this being an open relay," and that gate is intact), but it's a real, correctable gap relative to the equivalent code one directory over.

**Fix direction:** check `Content-Length` (and/or stream-count bytes) before calling `fetch`, mirroring `operator/src/use.ts#readUseBody`'s cap, and return 413 the same way.

---

## 2. Test-suite status (ran, not assumed)

Per the brownfield-discovery method note ("a test file is evidence of intended verification, not of a passing run"), I ran both suites rather than citing their existence.

- **`operator/` full suite** (`vitest run --config operator/vitest.config.ts`): **1000 passed, 2 skipped, 1 failed** out of 94 files. The one failure (`src/render/pages/overview.layout.test.ts`) is a Playwright `chromium.launch()` crash (`bootstrap_check_in ... Permission denied`, `sandbox_extension_issue_file_to_process failed`) — this is the tool sandbox blocking a headless-Chromium launch, not a product defect; every other test, including every security/HMAC/D1/routing test, passes.
- **`license-server/` full suite** (`node --test`, all 6 `*.test.mjs`/`lib/*.test.mjs` files): **141/141 pass** when run outside the sandbox's local-port-binding restriction (see F2 for why the in-sandbox run showed spurious `EPERM` failures).

### 2a. GitHub issues #104–#119 — reproduction status

I do not have working GitHub access in this environment to read the issue bodies directly: `git remote -v` shows `origin = https://github.com/mysticalsin/AskToto-Mantu.git`, `gh auth status` reports an invalid/expired keyring token, and an unauthenticated `curl` to the REST API returns `404` (consistent with a private repo an anonymous request cannot see). I was not able to obtain the actual issue text for any of #104–#119, so for the ones I could not otherwise corroborate in-repo, my status is **UNKNOWN**, not "does not reproduce" — I want to be explicit about that distinction rather than imply I confirmed something I could not read.

What I *could* do: the repo itself names four of these issues directly in regression-test `describe()` blocks, which lets me check their current status against the code and a live test run rather than guessing from the issue title alone:

| Issue | Test | File | Status (ran) |
|---|---|---|---|
| **#104** "router regex unterminated" | `describe('hashed SPA router (#104)', ...)` | `operator/src/spa/router.test.ts` | **PASSES.** This is about the *shipped, esbuild-bundled* client JS (`operator/src/spa/client.generated.ts`), not the server route table in `routes/registry.ts` (whose regexes I separately audited — every `pattern: /.../ ` in `routes/*.ts` is well-formed and properly `$`-anchored). The test asserts the exact 5-character regex literal `/^\//` survives bundling intact (a known esbuild/minifier failure mode is doubling or dropping the escape on a literal containing `\/`), and separately that `operator/src/spa/client-bundle.contract.test.ts` — which rebuilds the client from source with a fresh `esbuild` call and diffs it against the committed `client.generated.ts` — matches byte-for-byte. Both pass: **not reproducing at HEAD**, and the committed generated bundle is not stale.
| **#105** "product sidebar" | `describe('product sidebar (#105)', ...)` | `operator/src/ui.console.test.ts:79` | **PASSES.**
| **#112** (aka **#182**) "portalPathSpend honesty" | `describe('portalPathSpend honesty (#182 / #112)', ...)` | `operator/src/dashboard.tokens.honesty.test.ts:16` | **PASSES.**
| **#119** "Unique seats sparkline is solid 30-min bars" | `describe('#119 Unique seats sparkline is solid 30-min bars', ...)` | `operator/src/charts.bars.test.ts:4` | **PASSES.**

For **#106–#111 and #113–#118** I found no issue-numbered `describe()` block, comment, or `docs/qa/BUG-LEDGER.md` entry (that ledger is keyed by an unrelated `MQA-NNN` internal id scheme, not GitHub issue numbers) that names them, and I have no way to fetch the GitHub issue bodies to know what dashboard defect each one even describes. I looked for, and did not find, any currently-failing dashboard test, any dashboard-rendering TODO/FIXME, or any other in-repo signal pointing at an unresolved defect in that range — but the honest status for these eight is **UNKNOWN (no repo-side evidence either way; issue text unreachable)**, not "confirmed fixed." Whoever holds working GitHub access to this private repo should pull the actual issue bodies for #106–111/#113–118 and re-run this check against them specifically.

---

## 3. Things that are good and I want to say so explicitly (not padding — this changes what to prioritize)

- `operator/src/access.ts`'s Cloudflare Access JWT verification (`verifyAccessJwt`) checks `alg`, `kid`-matched JWKS lookup, `aud`, `exp`, `nbf`, and `iss` — every claim CF Access documents as mandatory — and fails closed on any parse error. Session tokens are HMAC-signed with a key HKDF-derived from `OPERATOR_PROMPT_KEY` (so a session-cookie compromise doesn't leak the prompt-encryption key or vice versa), timing-safe compared, and re-validated against the *current* `ADMIN_EMAILS` allowlist on every use — an admin removed from that list loses access to already-minted sessions immediately, not just to new logins.
- `operator/src/ask.ts`'s streaming SSE proxy actively scans its own output for the literal secret/cipher/iv bytes before forwarding any chunk to the seat (`leaked()`, `queueText`'s tail-buffering against a provider secret splitting across two chunks) — a genuinely non-trivial defense against a misbehaving/compromised upstream provider echoing the credential back.
- D1 access throughout `d1.ts` is 100% parameterized (`bind(...)`); the one dynamically-built SQL string (`ownedAskUpsertSql`) builds its column list from a fixed `ASK_BASE_COLUMNS` constant, never from request input — no injection surface found.
- `cloudflare-proxy/src/index.ts` is a rare thing: a small, single-purpose file that says exactly what it does and does nothing else. Constant-time multi-key auth (`matchesAnyKey` never short-circuits, so timing can't reveal which/how-many keys are configured), upstream errors are re-stated in this Worker's own words rather than relayed (closing a real credential-leak path many proxies get wrong), and the CF-account gateway id is fixed server-side so a caller can't redirect traffic to a gateway with weaker guardrails.
- `license-server`'s admin surface has a proper brute-force lockout (separate closure/Map from the public-endpoint rate limiter, by design, so the two can't interfere) and its backup-download route (`/admin/backups/:name`) is made path-traversal-safe by exact-shape matching (`isSafeBackupName`) rather than a `..`-blacklist.

---

## 4. Scope notes / what I did not do

- Did not touch `intelligence/` sub-app, `native/`/`native-app/` Swift helper, or the desktop `src/main` files beyond the three narrow cross-references in F3 (which stay a Worker-side finding; I did not re-review L05's territory).
- Did not run `npm install`/`wrangler dev`/any live D1 or Cloudflare Access call — all evidence above is from static reading plus the two local test runs (`vitest`, `node --test`), both read-only.
- Did not attempt to fetch the actual GitHub issue bodies for #106–111/#113–118 beyond the one unauthenticated `curl` probe recorded in §2a; that gap is explicit, not silently skipped.
