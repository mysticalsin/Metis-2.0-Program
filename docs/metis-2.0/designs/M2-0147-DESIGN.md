# M2-0147 design: desktop security fixes (pinned PowerShell, MCP DNS pin, resolveBin as data, quoted-path validator, tenant rotation)

Designer: Opus. Base: `7dab8e89` (m2/integration, post-rewrite). Branch `m2/M2-0147-desktop-security-fixes`.
Status: design only. The implementer (Sonnet) follows this file. No PR or remote branch exists yet.
Findings: L05-F2, L05-F3, L05-F4, L05-F5, L05-F6, L05-REFACTOR-2. Kit: M2-SEC-02, F-03.

## 0. Why this design, in one paragraph

These are four small gaps. Three are easy: pin the PowerShell path, treat a tenant change the way a domain change is
already treated, and hand `bin` to the login shell as data instead of splicing it into shell code. F6 was misread.
`cmdShimSpawn` has two character sets on purpose: a strict one for free-text **arguments** and a narrow one for the
**resolved path**. The path is always embedded inside double quotes, so `C:\Program Files (x86)\…` and `C:\Users\R&D\…`
must keep working. `loginScriptPathSafe` already equals the path set. The real defects are different: the two checks
are separate copies that can drift, and the login script applies the cmd.exe rule to its **bash** branch too, where
`$` and backtick are live inside double quotes. F2 is the one real design problem. Pinning the resolved IP must not
bypass the corporate proxy or the managed egress allowlist, because Plane and ClickUp MCP are hosted and Mantu
machines reach them through the proxy. So the pin lives in a connect-time `lookup` on a per-session dispatcher.
`net/install-proxy.ts` builds that dispatcher on **the same route as the global one**. The request still goes through
`globalThis.fetch`, so the egress guard still applies. The separate, fail-open DNS pre-check goes away. The race and
all three of the verifier's easier bypasses close together: fail-open, an unnormalized mapped-v6 answer, and the
SDK's event-stream GET following redirects.

## 1. Invariants

**INV-PS.** No main-process module spawns PowerShell by a bare name. `license/device.ts` uses `WINDOWS_POWERSHELL`
for all three identity queries.

**INV-TENANT.** A persisted session is trusted only while its `tid` matches the configured tenant. The comparison is
`tenantMatches`, which folds case exactly like the sign-in gate at `auth.ts:855`. `expiryReason` enforces this, so
both `authStatus()`/`requireAuth()` (the IPC gate) and the background `revalidateSession()` sweep clear such a session.
The clear is audited as `auth.expired { reason: 'tenant' }`.

**INV-BIN-DATA.** `resolveBin` never builds shell text from `bin`. The login-shell script is a constant, and `bin`
reaches it only through an environment variable, expanded quoted.

**INV-QUOTED-PATH.** Every resolved path embedded in a command line or script is embedded inside double quotes and must
pass `isQuotablePath(path, dialect)`. This covers `cmdShimSpawn`'s bin, the login script's resolved bin and the login
script's managed launcher paths.
- `cmd`: rejects `"`, CR, LF and `%`. A quote or line break ends the token, and `%` expands even inside quotes.
- `bash`: rejects `"`, `$`, backtick, `\`, CR and LF. These stay live inside double quotes.

Free-text **arguments** keep the stricter `["\r\n&|^%<>()!]` rule in `cmdShimSpawn`. That rule is never applied to
paths.

**INV-MCP-PIN.** One `withClient` call is one MCP session, and it gets its own dispatcher from
`routeDispatcher(sessionLookup())`.
- On a connection this process dials itself, the endpoint host is resolved **once**, inside the socket's own `lookup`.
- If **any** answer is a cloud-metadata address, the connection is refused. IPv4-mapped IPv6 answers are normalized
  first.
- Otherwise every connection in the session dials that same pinned answer. A resolver that changes its answer is
  never asked a second time.
- A failed or stalled resolution dials nothing. It fails closed and is bounded by the existing abort timer.
- Through a proxy, the proxy resolves and dials. That is its own network, not this host's link-local metadata
  service, and routing is unchanged.

**INV-MCP-REDIRECT.** Every MCP request refuses redirects, including the SDK's event-stream GET, which never sees
`requestInit`. Every MCP request also goes through `globalThis.fetch`, so the managed egress allowlist
(`net/egress-guard.ts`) keeps applying.

**INV-ROUTE.** `net/install-proxy.ts` is the single owner of routing. The global dispatcher and any
`routeDispatcher(lookup)` are built by the same function from the same `route` state. That includes the late PAC
upgrade.

## 2. Code changes per file

### 2.1 `src/main/license/device.ts` (L05-F3)

Import `WINDOWS_POWERSHELL` from `'../win-security'`. Replace the three hand-built argument arrays with one helper:

```ts
/** Windows identity facts come from PowerShell, always the pinned System32 binary (see win-security.ts). */
function runPowerShell(command: string): string {
  return execText(WINDOWS_POWERSHELL, ['-NoProfile', '-NonInteractive', '-Command', command])
}

function winSerial(): string {
  const bios = runPowerShell('(Get-CimInstance -ClassName Win32_BIOS).SerialNumber')
  if (isUsableSerial(bios)) return bios
  return runPowerShell('(Get-ItemProperty -Path HKLM:\\SOFTWARE\\Microsoft\\Cryptography).MachineGuid')
}

function winModel(): string {
  return runPowerShell('(Get-CimInstance -ClassName Win32_ComputerSystem).Model')
}
```

Nothing else in the file changes. The import creates no cycle: `win-security → logger` only. Importing `logger` without
an electron mock is already safe (see `dust-secret-store.test.ts`).

### 2.2 `src/main/win-security.ts` (comment only)

The `WINDOWS_POWERSHELL` doc comment lists "foreground-watcher.ts and dust-secret-store.ts". That list is already
stale: it leaves out `dataless.ts`. Replace the enumeration with the invariant: "…so the invariant above holds
repo-wide: no main-process module spells a bare 'powershell.exe'." Do not change the code.

### 2.3 `src/main/auth.ts` (L05-F4)

```ts
/**
 * Why a cached session should no longer be trusted, or null if it's still valid. Validity = within the
 * max local age AND (when SSO is configured) still matching the allowed domain and the configured tenant.
 * The tenant compare is tenantMatches (case-folded, like the sign-in gate), and a session read from disk
 * without a string tid cannot prove its tenant. Anything past these bounds forces fresh interactive sign-in.
 */
function expiryReason(s: Session, cfg: AzureConfig | null): 'max_age' | 'domain' | 'tenant' | null {
  if (typeof s.at !== 'number' || Date.now() - s.at > MAX_SESSION_AGE_MS) return 'max_age'
  if (cfg && s.domain !== cfg.allowedDomain) return 'domain'
  if (cfg && (typeof s.tid !== 'string' || !tenantMatches(s.tid, cfg.tenantId))) return 'tenant'
  return null
}
```

- Also update the `loadSession` tail comment: "(Config re-validation, domain and tenant, needs cfg and runs in
  authStatus and the sweep.)". The `revalidateSession` doc says "config-domain match"; change it to "config domain +
  tenant match".
- Do **not** touch `probeRefreshToken`. Once the local check runs first, its 'unknown' classification of a tenant
  error no longer matters.
- Brick analysis (checked): a wrong Settings tenant on a sticky device already bricks through the domain path, and
  through max-age within 7 days. This change only makes it happen sooner and adds no new lockout class. A legitimate
  IT rotation (env/managed tier) now requires re-sign-in against the new tenant, which is what the finding asks for.

### 2.4 `src/main/cli.ts` (L05-F5, L05-F6, L05-REFACTOR-2)

**resolveBin (F5).** Replace line 243:

```ts
/** The login shell reads the binary name from this variable. The script is a constant, so `bin` is only
 *  ever data to the shell (expanded quoted), never syntax, whatever a future caller passes. */
const RESOLVE_BIN_VAR = 'METIS_RESOLVE_BIN'
const RESOLVE_BIN_SCRIPT = `command -v "$${RESOLVE_BIN_VAR}"`
…
const { stdout } = await execFileAsync(shell, ['-lc', RESOLVE_BIN_SCRIPT], {
  env: { ...process.env, [RESOLVE_BIN_VAR]: bin }
})
```

Why an environment variable and not `"$1"`: fish (a real macOS login shell) has no `$1`, so the positional form would
make every fish user's lookup fail. `"$VAR"` expands in sh, bash, zsh and fish alike. Leave `--` out: zsh's `command`
precommand does not reliably accept it, and a name starting with `-` just fails the lookup. That fails closed and
returns null.

**Shared quoted-path validator (F6 / REFACTOR-2).** Add it next to `isCmdShim`:

```ts
/** How a script embeds a resolved path: always inside double quotes. */
type QuotingDialect = 'cmd' | 'bash'

/**
 * Characters double quotes do not neutralize, per dialect. A resolved path is never free text, so what
 * quoting does neutralize stays launchable: spaces and & | ^ < > ( ) ! in cmd.exe (`C:\Users\R&D\…`,
 * `C:\Program Files (x86)\…`). cmd: a quote or line break ends the token; % expands even inside quotes.
 * bash: a quote or line break ends it; $ ` and \ stay live inside double quotes.
 */
const UNQUOTABLE: Record<QuotingDialect, RegExp> = { cmd: /["\r\n%]/, bash: /["$`\\\r\n]/ }

function isQuotablePath(path: string, dialect: QuotingDialect): boolean {
  return !UNQUOTABLE[dialect].test(path)
}
```

- `cmdShimSpawn`: replace `if (/["\r\n%]/.test(bin))` with `if (!isQuotablePath(bin, 'cmd'))`. Keep the error
  message. Shorten the comment above it to point at `isQuotablePath`. The free-text argument loop stays exactly as
  it is.
- Delete `loginScriptPathSafe`. In `invokeResolvedBinLines`, use
  `if (!isQuotablePath(bin, isWin ? 'cmd' : 'bash') || isWindowsDesktopAlias(bin)) return null`.
- In the `loginCliInvokeLines` managed branch, change the guard to
  `if (managed?.command && [managed.command, ...managed.args].every((p) => isQuotablePath(p, isWin ? 'cmd' : 'bash')))`.
  Those are also paths embedded quoted. An unsafe one falls through to the later branches, as an unsafe resolved bin
  already does.
- File header (lines 4-14): the bin path "is only guarded against the characters quoting cannot neutralize
  (isQuotablePath)". For resolveBin: "…via the login shell, with the name passed as an environment variable, never
  spliced into the script…".
- Update the stale test comment at `cli.test.ts:664` (`command -v <bin>`) to match the new script. Its
  `args[0] === '-lc'` routing still holds.

### 2.5 `src/main/net/install-proxy.ts` (enables INV-MCP-PIN without bypassing the proxy)

Keep the route, and build every dispatcher, the global one included, through one function:

```ts
import type { LookupFunction } from 'node:net'
import { Agent, EnvHttpProxyAgent, ProxyAgent, setGlobalDispatcher, type Dispatcher } from 'undici'

/** How main-process fetch reaches the network. Kept, not just applied, so routeDispatcher() can build
 *  another dispatcher that routes exactly like the global one. */
type Route = { kind: 'direct' } | { kind: 'env' } | { kind: 'system'; proxy: string }

let route: Route = { kind: 'direct' }

/**
 * A dispatcher on the current route. `lookup` resolves every connection this process dials to a target
 * itself: all of them on a direct route, the NO_PROXY hosts on the env route. Through a proxy the proxy
 * resolves and dials the target, so there is nothing local for `lookup` to apply to.
 */
export function routeDispatcher(lookup?: LookupFunction): Dispatcher {
  const connect = lookup && { lookup }
  switch (route.kind) {
    case 'env':
      return new EnvHttpProxyAgent({ connect })
    case 'system':
      return new ProxyAgent(route.proxy)
    case 'direct':
      // (move directAgent's keep-alive comment here)
      return new Agent({ keepAliveTimeout: 30_000, keepAliveMaxTimeout: 60_000, connect })
  }
}

function useRoute(next: Route): void {
  route = next
  setGlobalDispatcher(routeDispatcher())
}
```

- Delete `directAgent()`. Replace the four `setGlobalDispatcher(...)` calls with `useRoute({ kind: 'env' })`,
  `useRoute({ kind: 'system', proxy: systemProxy })` (inside `installSystemProxy`, which covers the late upgrade too),
  and `useRoute({ kind: 'direct' })` for both the deadline path and the DIRECT path.
- Global behaviour is unchanged: same classes, same keep-alive, same env handling. `EnvHttpProxyAgent({ connect:
  undefined })` is `EnvHttpProxyAgent()`.
- Checked in undici 7.29 source: `EnvHttpProxyAgent` passes `connect` to its NO_PROXY `Agent`. `ProxyAgent` replaces
  `connect` with its tunnel, so the lookup never touches proxied targets.

### 2.6 `src/main/mcp/mcpClient.ts` (L05-F2 plus the verifier's bypasses a/b/c)

1. **Imports.** Drop `isIP, isIPv6` and `promises as dns`. Add `import { lookup, type LookupAddress } from 'node:dns/promises'`,
   `import type { LookupFunction } from 'node:net'` and `import { routeDispatcher } from '../net/install-proxy'`.

2. **One predicate** (normalizes mapped v6, which is bypass b), replacing the two inline `BLOCKED_HOSTS || isLinkLocalIPv4`
   checks:

   ```ts
   /** A cloud-metadata host name or address, including an IPv4-mapped IPv6 spelling of one (the network
    *  stack routes that to the embedded IPv4 host). */
   function isCloudMetadataAddress(host: string): boolean {
     const ipv4 = ipv4MappedAddress(host) ?? host
     return BLOCKED_HOSTS.has(host) || BLOCKED_HOSTS.has(ipv4) || isLinkLocalIPv4(ipv4)
   }
   ```

3. **`validateEndpointUrl` becomes synchronous** and loses its DNS lookup, its 3 s race and its fail-open catch
   (bypass a). It keeps the scheme check, the bracket strip and `isCloudMetadataAddress(bareHost)` with the existing
   "points at a cloud metadata address" message. Doc comment: "A host name's addresses are checked where they are
   used, at connect time in sessionLookup, never here. A check on a separate resolution proves nothing about the
   address the socket later dials." Both callers drop their `await`.

4. **Connect-time pin:**

   ```ts
   /** Raised inside sessionLookup; classifyError turns it into the user-facing refusal. */
   class CloudMetadataAddressError extends Error {}

   async function resolveAllowed(hostname: string): Promise<LookupAddress[]> {
     const addresses = await lookup(hostname, { all: true })
     if (addresses.some((a) => isCloudMetadataAddress(a.address))) {
       throw new CloudMetadataAddressError(`${hostname} resolves to a cloud metadata address`)
     }
     return addresses
   }

   /**
    * The connect-time `lookup` for one MCP session. Each host is resolved once. The answer is refused if ANY
    * address is a cloud-metadata address; otherwise it is pinned and handed to every connection the session
    * opens. The address that passed the check is therefore the only address the session dials: a resolver
    * that changes its answer (DNS rebinding) is never asked twice, and a failed resolution dials nothing.
    */
   function sessionLookup(): LookupFunction {
     const pinned = new Map<string, Promise<LookupAddress[]>>()
     return (hostname, options, callback) => {
       let answer = pinned.get(hostname)
       if (!answer) {
         answer = resolveAllowed(hostname)
         pinned.set(hostname, answer)
       }
       answer.then(
         (addresses) =>
           options.all ? callback(null, addresses) : callback(null, addresses[0].address, addresses[0].family),
         (error: NodeJS.ErrnoException) => callback(error, '')
       )
     }
   }
   ```

   Node's `net` calls this with `all: true` under autoSelectFamily, which is the default on Node 22 and later, and
   with `all: false` otherwise. Both forms are handled. IP-literal hosts never reach `lookup`, and the literal check in
   step 3 covers them.

5. **`withClient`:**

   ```ts
   const dispatcher = routeDispatcher(sessionLookup())
   const transport = new StreamableHTTPClientTransport(new URL(endpointUrl), {
     requestInit: { headers: { Authorization: `Bearer ${apiKey}`, ...extraHeaders } },
     // Every SDK request goes through here, including its event-stream GET, which never sees requestInit.
     // Redirects are refused, not followed: validateEndpointUrl vets the configured URL and only that one,
     // and an MCP endpoint is a concrete JSON-RPC URL, never a redirector (a server that moved surfaces as
     // classifyError's "enter the final URL"). The global fetch, not undici's, so the managed egress
     // allowlist (net/egress-guard.ts, which forwards `dispatcher`) still applies.
     fetch: (url, init) => fetch(url, { ...init, redirect: 'error', dispatcher })
   })
   ```

   - In `finally`, after the existing `client.close()` try/catch, add its own
     `try { await dispatcher.destroy() } catch { /* best-effort */ }`. Destroy runs after close: closing the client
     aborts the event stream, so nothing is left in flight to cut off.
   - `redirect: 'error'` moves out of `requestInit`, so there is exactly one place.
   - Type note: `@types/node` 22 types `RequestInit.dispatcher` with undici-types 6.21, while `routeDispatcher`
     returns undici 7's `Dispatcher`. Run `npx tsc --noEmit -p tsconfig.node.json`. If it reports the skew, convert
     once at this line with a comment giving the reason. Runtime compatibility is proven: Node's fetch drives any
     legacy-handler `dispatch`, which undici 7 still validates and accepts (`lib/core/util.js` handler checks), and
     install-proxy already depends on it. Do not widen the cast anywhere else.

6. **`classifyError`:**

   ```ts
   /** `e` and its causes: fetch reports every network failure as TypeError('fetch failed') with the reason in `cause`. */
   function errorChain(e: unknown): Error[] {
     const chain: Error[] = []
     for (let c: unknown = e; c instanceof Error && !chain.includes(c); c = c.cause) chain.push(c)
     return chain
   }
   ```

   - New first branch: `if (errorChain(e).some((c) => c instanceof CloudMetadataAddressError)) return \`"${endpointUrl}" resolves to a cloud metadata address, which is never a valid ${label} endpoint.\``
     This is the same sentence the pre-check used to produce.
   - Move the redirect branch to just after the auth branch, and test it against the chain:
     `errorChain(e).some((c) => /redirect/i.test(c.message))`.
     Today it sits after the network branch and reads only the top-level message. fetch's refusal is
     `TypeError('fetch failed', { cause: Error('unexpected redirect') })`, so it always landed in "Could not reach".
     The branch has been unreachable since MQA-145, hidden by that ticket's source-regex test.
   - Do **not** fold cause text into `blob` for the other branches. A cause such as `connect ECONNREFUSED 127.0.0.1:4010`
     contains "401" and would be misread as an auth failure.

7. The header or the `BLOCKED_HOSTS` comment gets three lines naming the layers: `validateEndpointUrl` (scheme and
   literal host), `sessionLookup` (every dialled address, pinned per session), and the transport `fetch` (no redirects,
   egress allowlist kept).

### 2.7 Files explicitly NOT changed

- `net/egress-guard.ts`: it already forwards `dispatcher` (egress-guard.test.ts:301) and honours `redirect: 'error'`.
- `index.ts` and `operator-integrations.ts`: the `connectMcp`/`pushToMcp` signatures are unchanged.
- `installCli`'s `npm i -g ${pkg}`: `pkg` is a compile-time constant from a closed map and is already documented as
  such. It is out of scope.

## 3. What NOT to do

- Do not compare `s.tid !== cfg.tenantId`, as the finding suggested. Entra issues `tid` in lowercase and the portal
  GUID is often pasted in uppercase, so a raw compare signs every such user out (MQA-027 class).
- Do not tighten the resolved-path rule to `cmdShimSpawn`'s free-text argument set, as the F6 fix direction suggested.
  That breaks `Program Files (x86)` and `R&D` installs, which cli-win.test.ts:344 pins.
- Do not pass `bin` as `"$1"` (breaks fish). Do not rely on a TypeScript literal union alone, because that still
  builds shell text.
- Do not give MCP a plain direct `Agent`. It would bypass the corporate proxy, and Plane/ClickUp MCP would break on
  managed networks.
- Do not compose undici's `interceptors.dns` onto the global dispatcher. It rewrites the origin to an IP, which breaks
  NO_PROXY matching and proxy hostname policy.
- Do not detect the proxy with `instanceof` on `getGlobalDispatcher()`.
- Do not use undici's own `fetch` for MCP. It bypasses the egress allowlist wrapper at `globalThis.fetch` (F-03).
- Do not install the metadata lookup process-wide in install-proxy's global dispatcher. That is global blast radius,
  and a memoized pin is only correct per session.
- Do not keep any DNS pre-check in `validateEndpointUrl`. It means two resolutions, which is the TOCTOU itself, and
  it was fail-open.
- Do not keep or add source-text regex tests. Delete MQA-145's (2.6) and do not add a "no bare powershell.exe" grep
  test.
- Do not export test-only helpers. Every test below goes through an existing export or `routeDispatcher`.
- Do not change `cmdShimSpawn`'s command line (for example `/v:off`) in this ticket. See §6 R1.

## 4. Tests: red first, then implementation

D-28: nothing runs locally except `git`, `gh` and `npx tsc --noEmit -p tsconfig.node.json`. Red-first is shown in CI.
- **Commit 1** is tests only. Push it and record the Quality-checks run URL. The failing set must equal the RED rows
  below, with nothing else failing and nothing else newly failing on windows.
- **Commits 2 onwards** are the fixes: green on ubuntu and windows, compared with baseline run 36267674617.

### 4.1 `src/main/license/device.test.ts`

Mock `node:child_process` with `async (importOriginal) => ({ ...actual, execFileSync: fake })`. The fake records
`cmd` and answers by script. `Win32_BIOS` returns `To be filled by O.E.M.`, which forces the MachineGuid fallback.
MachineGuid returns a GUID and `Win32_ComputerSystem` returns a model.

| Test | Pre-fix |
|---|---|
| D1 `reads the Windows serial and model through the pinned System32 PowerShell, never a bare name`: `readHardwareIdentity('win32')` returns the GUID and model, there are 3 spawns, and every `cmd === WINDOWS_POWERSHELL` | RED |

### 4.2 `src/main/auth.test.ts` (new describe, own `beforeEach`)

Follow `signout-revocation.contract.test.ts`: `vi.resetModules()`, re-import `electron`, point `userData` at a temp
dir, and write the session with `encryptSecret`. Use domain `example.com`. Use two GUIDs: the file's `TENANT_GUID`
and `00000000-0000-4000-8000-000000000001`. Save and restore the `AZURE_*` / `ASKTOTO_*` env.

| Test | Pre-fix |
|---|---|
| A1 `clears a session whose tenant no longer matches the configured tenant on the next status check`: tid A, env tenant B gives `requireAuth()` false, `signedIn` false and the cleared handler called | RED |
| A2 `the background re-validation sweep clears it with no user action`: fake timers, env tenant A, `authStatus().signedIn` true (starts the sweep), set env tenant B, `advanceTimersByTimeAsync(10_000)`, cleared handler called **before** any further `authStatus()` | RED |
| A3 `folds case like the sign-in gate`: tid lowercase A, env tenant uppercase A, stays signed in | green (guards against the `!==` fix) |

### 4.3 `src/main/cli-resolve-bin.test.ts` (NEW; `describe.skipIf(process.platform === 'win32')`)

Real `/bin/sh`, the precedent being cli-win.test.ts:378's real-process test. `vi.mock('electron')`. Mock
`./cli-installer` like cli-setup-script.test.ts. Set `process.env.SHELL = '/bin/sh'` and restore it afterwards. HOME
is already hermetic.

| Test | Pre-fix |
|---|---|
| C1 `passes the binary name to the login shell as data, never as shell syntax`: `resolveBin('metis-no-such-cli;echo injected')` returns `null`. Pre-fix it returns `'injected'` | RED |
| C2 `still resolves a real binary through the login shell`: `resolveBin('sh')` matches `/^\/.+\/sh$/` | green (control: the variable plumbing works) |

### 4.4 `src/main/cli-setup-script.test.ts`

| Test | Pre-fix |
|---|---|
| C3 `Mac login never embeds a resolved path bash would expand inside double quotes`: `'/Users/x/$(id)/claude'` and a backtick variant give `['claude']` | RED |
| C4 `the shim launcher and the Windows login script refuse exactly the same path characters`: table. For `" \r \n %`, `cmdShimSpawn` throws **and** `loginCliInvokeLines(…, true, null, path)` does not embed it. For `& \| ( ) ^ < > !` and spaces, both accept and the login line is `call "<path>"` | green (the drift pin the acceptance asks for) |
| C5 `Windows login does not embed a managed launcher path cmd.exe would expand`: `managed.command = 'C:\\Users\\a%b\\Metis.exe'` gives `['call claude']` | RED |

cli-win.test.ts:325-360 (the cmdShimSpawn arg and bin rules) stays unchanged and green.

### 4.5 `src/main/mcp/mcpClient.test.ts`

Harness changes:
- `vi.mock('node:dns/promises')` passes through to the real module, except for hosts registered in a hoisted table.
  For those it returns a per-call answer queue (the last entry repeats) and counts calls.
- `startMockMcp(options: { requiredHeader?, intercept? })`. `intercept(req, res, body)` runs after auth and body
  parse, and returns true when it answered the request.
- A `requests` counter on the mock.
- A tiny `startTrap()` HTTP server with `hits` and a `firstHit` promise.
- Update the one existing `startMockMcp({ name, value })` call site.

| Test | Pre-fix |
|---|---|
| M1 `connects to the address it validated when the resolver later answers a metadata address`, for `connectMcp` and `pushToMcp` (separate hosts). Host `rebind.mcp.test` answers `127.0.0.1` first and `169.254.169.254` afterwards. Result ok, the tool is listed or received, and the resolver was called **exactly once**. The SDK's event-stream GET holds one socket, so tools/list needs a second connection; per-connection re-resolution would fail this. | RED (pre-fix connects via real DNS: ENOTFOUND) |
| M2 `refuses a host when any resolved address is a cloud metadata address, before any request is sent`: answer `['127.0.0.1','169.254.169.254']` gives an error matching `/cloud metadata/` and `requests` unchanged | RED |
| M3 `treats an IPv4-mapped IPv6 answer as the metadata address it maps to`: answer `::ffff:169.254.169.254` is refused | RED |
| M4 `refuses a redirect on the handshake without reaching its target, and says to use the final URL`: intercept answers the initialize POST with 307 to the trap. Error matches `/final URL/`, `trap.hits === 0` | RED (message is "Could not reach") |
| M5 `never follows a redirect on the SDK's event-stream GET`: intercept answers GET with 302 to the trap. On `tools/list`, await "GET answered" (capped at 2 s), then `Promise.race([trap.firstHit, delay(500)])`. Result ok, `trap.hits === 0`, and premise `getRedirects === 1` | RED (pre-fix follows) |

The existing literal-metadata, mapped-literal, `[::1]`, auth and extraHeaders tests all stay green. M5 is the only
test that uses a timing cap, and only in the red direction: a correct build never waits on luck.

### 4.6 `src/main/mcp/mcpClient.audit.test.ts`

Delete the MQA-145 describe (the source regex) and its now-unused `readFileSync`/`join` imports. M4 and M5 replace
it with behaviour tests. The MQA-065 tests stay green: the stubbed transport ignores `fetch`, and a real Agent is
created and destroyed with no network.

### 4.7 `src/main/net/install-proxy.test.ts`

Make `FakeEnvHttpProxyAgent` record `opts`. New describe `routeDispatcher — a second dispatcher that routes like the global one`:

| Test | Pre-fix |
|---|---|
| P1 DIRECT: `routeDispatcher(lookup)` is a `FakeAgent` whose `opts.connect.lookup === lookup` | RED (no export) |
| P2 env proxy (`HTTPS_PROXY` set): a `FakeEnvHttpProxyAgent` with `opts.connect.lookup === lookup` | RED |
| P3 system proxy answered promptly: a `FakeProxyAgent` with the proxy uri | RED |
| P4 PAC lands after the deadline: `routeDispatcher` follows the late upgrade to the proxy | RED |

The three existing MQA-190 tests stay green unchanged.

### 4.8 CI evidence (PR evidence table)

- Commit 1: run URL plus the exact RED list (D1, A1, A2, C1, C3, C5, M1-M5, P1-P4). C1 fails on ubuntu only, because
  windows skips it.
- Head: run URL, Quality checks (ubuntu and windows), Operator Worker, Security. List anything not run: the real
  Windows cmd.exe launch of a shim path containing `!`, and a live corporate-proxy MCP round-trip. Neither has a CI
  environment.

## 5. Acceptance amendments (proposed)

1. **Scope paths:** add `src/main/net/install-proxy.ts` (+test), `src/main/win-security.ts` (comment only),
   `src/main/mcp/mcpClient.audit.test.ts`, `src/main/cli-setup-script.test.ts`, `src/main/cli-resolve-bin.test.ts`
   (new) and `src/main/net/install-proxy.test.ts`.
2. **AC2 →** "Each MCP session resolves the endpoint host once, at connect time, and refuses it if any answer is a
   cloud-metadata address (IPv4-mapped included). Otherwise every connection in the session dials that same answer,
   and a failed resolution dials nothing (test with a resolver that changes answers, M1-M3). Every MCP request,
   including the SDK's event-stream GET, refuses redirects (M4, M5). Proxy routing and the egress allowlist are
   unchanged."
3. **AC3 →** "resolveBin passes the binary name to the login shell as an environment variable under a constant script
   (C1). `cmdShimSpawn` and the login script share one quoted-path validator (C4). The bash login script uses the bash
   rule (C3). The free-text argument rule stays stricter."
   F6 correction for the ledger: the two path checks were already equal. The finding compared the argument set with
   the path set.
4. **AC4 →** "A persisted session whose tid does not match the configured tenant (case-folded like the sign-in gate)
   is cleared by the IPC gate and by the background sweep, audited `auth.expired {reason:'tenant'}` (A1-A3)."
5. **Verification / evidence:** replace the `npx vitest run …` line and `LOCALLY_TESTED` with D-28 CI evidence: the
   red run URL (commit 1) and the green run URLs at head. Add `cli-resolve-bin.test.ts`, `cli-setup-script.test.ts`,
   `mcpClient.audit.test.ts` and `install-proxy.test.ts` to the list.

## 6. Residuals found while designing (for the ledger, not fixed here)

- **R1 (low).** cmd.exe honours `DelayedExpansion=1` from the `Command Processor` registry key, and `!VAR!` then
  expands inside double quotes. Neither `cmdShimSpawn` (`/d /s /c`) nor the `.cmd` login script disables it. That
  needs `/v:off` or `setlocal DisableDelayedExpansion`, plus a real Windows launch check. Proposed as its own ticket.
- **R2 (fixed here, record it).** `classifyError`'s redirect message had been unreachable since MQA-145. Its only
  cover was a source-regex test.

## 7. Commits (conventional, `[M2-0147]`, body says why, trailer per the operating rules)

1. `test(security): pin the desktop security findings red-first [M2-0147]`
2. `fix(license): spawn device-identity PowerShell by its pinned System32 path [M2-0147]`
3. `fix(auth): end a session when the configured tenant no longer matches it [M2-0147]`
4. `fix(cli): pass the binary name to the login shell as data; one quoted-path validator per dialect [M2-0147]`
5. `fix(mcp): pin the endpoint address per session at connect time and refuse every redirect [M2-0147]`
   (includes install-proxy's `routeDispatcher`)

## 8. Size estimate

About 120 production lines changed (mcpClient ~60, install-proxy ~25, cli ~20, device ~12, auth ~4) and ~330 test
lines. Risk: medium, all of it in 2.5/2.6. The rest is local. The Node 22 fetch + undici 7 dispatcher interop is
exercised for the first time by M1-M5 in CI. If a green-phase run fails there, stop and report rather than switching
MCP to undici's own fetch (see §3).
