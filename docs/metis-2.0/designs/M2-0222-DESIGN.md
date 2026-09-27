# M2-0222 design: keep the MCP metadata/DNS-rebinding refusal on every proxy route

Designer: Opus. Base: `56292fb6` (m2/integration, post-rewrite, includes M2-0147). Branch `m2/M2-0222-mcp-proxy-guard`.
Status: design only. The implementer (Sonnet) follows this file. Finding: RF-AUDIT-R3-R1. Depends on M2-0147.

## 0. Why this design, in one paragraph

M2-0147 pins one MCP session's endpoint address inside the socket's own `lookup`. That only works when this process
dials the socket. When a proxy dials, the proxy resolves the host name itself, so neither the refusal nor the pin
applies. M2-0147 accepted that because the proxy is "its own network". That is false for a proxy running on this host,
such as a local PAC listener, Fiddler or a dev proxy, whose dial IS this host's dial. It also leaves DNS rebinding
fully open behind any proxy. The gap is wider than the audit says. It covers the **system** route (every host goes
through `ProxyAgent`), and also every host on the **env** route that is not in NO_PROXY, because `EnvHttpProxyAgent`
tunnels those through its own `ProxyAgent` and that `ProxyAgent` replaces `connect`, so `lookup` never runs.
Passing `lookup` to `ProxyAgent` fixes nothing for the same reason.

A proxied connection can be made sound in only two ways. (1) Give the proxy an address this process has already
checked: `CONNECT <address>:<port>`. The proxy then dials exactly that address and resolves nothing. (2) Refuse. Both
need the same undici hook, so they cost the same. Refusing would break Plane over the corporate proxy, the case
M2-0147 routed MCP through the proxy to keep. So we **pin the tunnel**. We do it with one hook that undici applies only
to proxied origins, on both the env and system routes: the pool `factory`. ProxyAgent hands each tunnelled pool its
tunnel as a connector *function*. We wrap that function so the tunnel targets the address `lookup` returns. The same
memoized per-session lookup does the resolving, so the refusal, the single resolution and the error message are
identical on every route. TLS still names and verifies the host (SNI, certificate, Host header). Only the tunnel's
destination changes. SOCKS proxies are sent the host name and cannot be pinned, so a pinned session refuses them
explicitly.

## 1. Invariants

**INV-PIN-EVERY-HOP.** `routeDispatcher(lookup)` sends every connection it opens to an address that `lookup` returned,
whoever dials it:
- A socket this process dials itself (the direct route, and the env route's NO_PROXY hosts) resolves through `lookup`
  at connect time. This is M2-0147's mechanism, unchanged.
- A tunnel a proxy opens (the system route, and every other host on the env route) is requested as
  `CONNECT <address>:<port>`, where the address comes from `lookup`. The proxy never sees a host name to resolve.
- A proxy that can only be sent the host name (a SOCKS URL in `http_proxy`/`HTTP_PROXY`/`https_proxy`/`HTTPS_PROXY`)
  is never used unpinned. `routeDispatcher(lookup)` throws `UnpinnableProxyError`.

**INV-TLS-NAME.** Pinning changes where a connection goes, never who it is verified as. SNI, the certificate check and
the request's Host header keep the endpoint's host name.

**INV-GLOBAL-UNCHANGED.** `routeDispatcher()` with no `lookup` (the shared global dispatcher) builds the same
dispatchers it builds today. For every non-MCP request the proxy still resolves, and boot never throws, SOCKS
included.

**INV-MCP-PIN (M2-0147, now route-independent).** One `withClient` call resolves the endpoint host **once**. It refuses
the host if **any** answer is a cloud-metadata address (IPv4-mapped answers are normalized first). Every connection in
the session, local socket or proxy tunnel, targets that one pinned answer. A failed or stalled resolution dials and
tunnels nothing, and the existing abort timer bounds it.

**INV-ACTIONABLE.** The user sees the same cloud-metadata message on every route. Two more failures each get their own
message and are never reported as a bad API key or a server that is down: a proxy refusing the pinned tunnel, and a
SOCKS route.

**INV-ROUTE (M2-0147, unchanged).** `net/install-proxy.ts` is the only owner of routing. The global dispatcher and
every `routeDispatcher(lookup)` come from one function reading one `route` state, including after the late PAC
upgrade.

**Recorded behaviour change.** An MCP endpoint behind a proxy now needs two things: this device must resolve the
endpoint's name, and the proxy must allow CONNECT to its addresses. Networks where only the proxy resolves public
names (strict split-horizon DNS), and proxies that allow CONNECT only by domain with no TLS inspection, will now refuse
MCP where they used to allow it. The user sees "Could not reach …" in the first case and "The network proxy refused …"
in the second. `docs/NETWORK-EGRESS.md` states this for IT (see 2.3).

## 2. Code changes per file

### 2.1 `src/main/net/install-proxy.ts`

Imports:

```ts
import type { LookupAddress } from 'node:dns'
import { isIPv6, type LookupFunction } from 'node:net'
import {
  Agent,
  EnvHttpProxyAgent,
  Pool,
  ProxyAgent,
  setGlobalDispatcher,
  type buildConnector,
  type Dispatcher
} from 'undici'
```

New exported error class, next to `Route`:

```ts
/** Raised by routeDispatcher(lookup) when the route's proxy can only be sent the host name, never an address, so it
 *  would resolve the host itself and `lookup` could not hold it. Today that is a SOCKS proxy on the env route. */
export class UnpinnableProxyError extends Error {}
```

Replace `routeDispatcher`, and keep its "`setGlobalDispatcher` is deliberately NOT called here" paragraph as it is:

```ts
/**
 * A dispatcher on the CURRENT route (`route`, above). Given a `lookup`, every connection it opens goes to an
 * address `lookup` returned, whoever dials it:
 *   - a socket this process dials itself (the direct route, and NO_PROXY hosts on the env route) resolves
 *     through `lookup` at connect time;
 *   - a tunnel a proxy opens (the system route, and every other host on the env route) is requested as
 *     `CONNECT <address>:<port>`, so the proxy dials that address and resolves nothing itself.
 * A SOCKS proxy is sent the host name and cannot be held to an address, so it is refused with
 * UnpinnableProxyError rather than used unpinned. Without `lookup` (the shared global dispatcher) proxies
 * resolve as usual.
 *
 * (keep the existing setGlobalDispatcher paragraph)
 */
export function routeDispatcher(lookup?: LookupFunction): Dispatcher {
  const connect = lookup && { lookup }
  const factory = lookup && pinnedTunnelFactory(lookup)
  switch (route.kind) {
    case 'env':
      // (keep the existing env comment)
      if (lookup && envProxyIsSocks()) {
        throw new UnpinnableProxyError('a SOCKS proxy is sent the host name, so the pinned address cannot be kept')
      }
      return new EnvHttpProxyAgent({ connect, factory })
    case 'system':
      return new ProxyAgent({ uri: route.proxy, factory })
    case 'direct':
      // (keep the existing keep-alive comment)
      return new Agent({ keepAliveTimeout: 30_000, keepAliveMaxTimeout: 60_000, connect })
  }
}

/** Whether the HTTP or HTTPS proxy EnvHttpProxyAgent reads from the environment (in its own precedence,
 *  lowercase first) is a SOCKS proxy, which undici tunnels by host name outside the pool factory. */
function envProxyIsSocks(): boolean {
  const { env } = process
  return [env.http_proxy ?? env.HTTP_PROXY, env.https_proxy ?? env.HTTPS_PROXY].some((proxy) => /^socks5?:/i.test(proxy ?? ''))
}

/**
 * The pool factory for a proxying dispatcher. ProxyAgent builds each tunnelled origin's pool with the tunnel as a
 * connector FUNCTION, and that tunnel is aimed here at the address `lookup` resolves. A pool that dials its own
 * socket (EnvHttpProxyAgent's NO_PROXY hosts) gets connector OPTIONS that already carry `lookup`, and is built
 * unchanged.
 */
function pinnedTunnelFactory(lookup: LookupFunction): NonNullable<Agent.Options['factory']> {
  return (origin, options) => {
    const pool = options as Pool.Options // undici types factory options as `Object`; they are the pool's options
    const { connect } = pool
    return new Pool(origin, typeof connect === 'function' ? { ...pool, connect: pinnedTunnel(connect, lookup) } : pool)
  }
}

/**
 * `tunnel`, opened to an address `lookup` resolves for the origin instead of to its host name. Only the target
 * changes: `servername` (SNI and the certificate check) and the request's Host header still name the host. IPv4
 * is preferred because a corporate proxy may have no IPv6 route, and every answer has already passed `lookup`'s
 * own checks.
 */
function pinnedTunnel(tunnel: buildConnector.connector, lookup: LookupFunction): buildConnector.connector {
  return (options, callback) =>
    lookup(options.hostname, { all: true }, (error, answer) => {
      if (error) return callback(error, null)
      const addresses = answer as LookupAddress[] // `all: true` always answers a list
      const { address } = addresses.find((a) => a.family === 4) ?? addresses[0]
      const host = isIPv6(address) ? `[${address}]` : address
      tunnel({ ...options, hostname: address, host: options.port ? `${host}:${options.port}` : host }, callback)
    })
}
```

Facts checked against undici 7.29.1 source (record them in the PR, not in code comments):
- `ProxyAgent` builds each tunnelled origin's pool with `opts.factory` (its `agentFactory`) and passes the tunnel as
  `options.connect` (a function). The tunnel sends `CONNECT <options.host>` (plus the default port when
  `options.port` is empty) with `Host: <options.host>`. It then runs TLS with `options.servername`.
- `EnvHttpProxyAgent` passes the same options (including `factory` and `connect`) to its NO_PROXY `Agent` and to its
  `ProxyAgent`s. The NO_PROXY pools receive `connect` as the `{ lookup }` object and pass through unchanged.
- The Client derives `servername` from the request's Host header. ProxyAgent sets that header from the origin, so the
  host name survives the rewrite. For an IP-literal origin, `servername` is null, which is correct.
- For `socks:`/`socks5:` URIs, ProxyAgent returns a `Socks5ProxyAgent`. That agent builds its own pools and sends
  the host name, and neither `factory` nor `clientFactory` is consulted. Hence the explicit refusal.
- `new ProxyAgent({ uri, factory: undefined })` and `new EnvHttpProxyAgent({ connect: undefined, factory: undefined })`
  build exactly today's global dispatchers (defaults apply for `undefined`). EnvHttpProxyAgent already uses the
  `{ ...opts, uri }` object form internally.
- A connector error (a `lookup` refusal) goes `handleConnectError` → `onError` → every pending request fails with
  that same error. M2-0147's direct-route refusal relies on this same path.

### 2.2 `src/main/mcp/mcpClient.ts`

- Import: `import { routeDispatcher, UnpinnableProxyError } from '../net/install-proxy'`.
- `classifyError`: add two chain-walking branches **directly after** the cloud-metadata branch:

```ts
  if (errorChain(e).some((c) => c instanceof UnpinnableProxyError)) {
    return `${label} can't be reached through a SOCKS proxy: the address it connects to can't be checked. Use an HTTP proxy instead.`
  }
  // undici's own refusal shape when the proxy answers CONNECT with anything but 200.
  if (errorChain(e).some((c) => /^Proxy response \(\d+\)/.test(c.message))) {
    return `The network proxy refused the connection to ${label} at ${endpointUrl}. Ask IT to allow it through the proxy.`
  }
```

- Comment-only edits so the prose matches the new invariant. No logic changes.
  - Lines 51-55 ("Three layers …"): the sessionLookup layer covers "every address the session dials, or asks a
    proxy to tunnel to".
  - `sessionLookup` doc: "Node's `net` calls this … and install-proxy's pinned tunnel calls it with `{ all: true }`.
    Both forms are handled." Delete the sentence "IP-literal hosts never reach `lookup` at all". A pinned tunnel does
    call it for an IP literal, and `lookup` returns the literal unchanged (validateEndpointUrl has already refused
    metadata literals).
  - `withClient` (lines 235-240): "routeDispatcher builds it on the SAME route as the global dispatcher, and aims that
    route's proxy tunnels at the same pinned answer. Pinning therefore never bypasses a corporate proxy, and the proxy
    never re-resolves the host."
- `withClient`'s structure, `sessionLookup`, `resolveAllowed` and `validateEndpointUrl` are untouched.
  `routeDispatcher` can now throw. It is called inside `withClient`, which both callers already wrap in `try`, so
  no new handling is needed.

### 2.3 `docs/NETWORK-EGRESS.md` (IT-facing, the "document it explicitly" half)

Add a short subsection after "Hosts by purpose", titled "MCP connections through a proxy". Two to four sentences:
- The app resolves an MCP push endpoint on the device and refuses it if any answer is a cloud-metadata address.
- It then asks the proxy for a tunnel to that address (for example `CONNECT 203.0.113.7:443`), not to the name, and
  TLS inside the tunnel still presents and verifies the host name (SNI).
- So the device must be able to resolve the endpoint, and the proxy must allow CONNECT to its addresses.
- SOCKS proxies are not used for MCP.

No product names beyond the ones already in the table. Use a documentation IP address only.

### 2.4 Files explicitly NOT changed

`egress-guard.ts`, `egress-policy.ts`, `proxy-url.ts`, `validateEndpointUrl`, `mcpClient.audit.test.ts`, anything
under `operator/`.

## 3. What NOT to do

- Do not pass `lookup` to ProxyAgent (`connect`, `proxyTls`, `requestTls`). ProxyAgent replaces `connect` for
  tunnelled origins, and the other two configure the socket to the proxy, not the target.
- Do not do a local "check" resolution while still sending CONNECT by host name. That is two resolutions, which is
  the TOCTOU M2-0147 removed.
- Do not compose `interceptors.dns` onto the session dispatcher. It rewrites the origin to an IP *before* NO_PROXY
  matching, so NO_PROXY host entries stop matching on the env route. Its TTL re-lookup and "storage full → original
  origin" paths also fail open.
- Do not use `clientFactory` with an async compose interceptor to rewrite the CONNECT request. Its failure path needs
  the new-API handler controller (or the deprecated `onError`), and the connector callback above has neither problem.
- Do not refuse MCP over proxies. It is equally complex and it breaks Plane on managed networks.
- Do not reimplement NO_PROXY matching, and do not inspect `getGlobalDispatcher()` with `instanceof`.
- Do not put the factory on the direct route, and do not move the NO_PROXY/direct pin from `connect.lookup` into the
  factory. Leave M2-0147's path exactly as it is.
- Do not change what `routeDispatcher()` without `lookup` builds, beyond the equivalent `{ uri }` object form.
- Do not export `pinnedTunnelFactory`, `pinnedTunnel` or `envProxyIsSocks` for tests. Every test goes through
  `connectMcp`, `routeDispatcher` or `installProxyAwareFetch`.
- Do not add source-text or regex-over-source tests. Do not use fake timers in the socket-level tests.
- Do not let the test proxy's own DNS decide pass or fail. Assert on the CONNECT targets it recorded.
- No TODOs, no commented-out code, no widening of the existing `dispatcher` cast in `withClient`.

## 4. Tests: red first, then implementation

### 4.1 `src/main/mcp/mcpClient.test.ts` (new describe, real sockets end to end)

File-level additions (hoisted):
- `const resolveProxy = vi.hoisted(() => vi.fn<(url: string) => Promise<string>>())`.
- `vi.mock('electron', () => ({ session: { defaultSession: { resolveProxy: (url: string) => resolveProxy(url) } } }))`.
- `vi.mock('../logger', () => ({ mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }, auditLog: vi.fn() }))`.
  This matches install-proxy.test.ts and keeps the logger away from the mocked electron. No existing test asserts
  on logs.
- `import { installProxyAwareFetch } from '../net/install-proxy'`. It is the same module instance mcpClient uses, so
  it shares the same `route`.

Helpers (test-local, not exported from production):
- `startConnectProxy(refuse?: number)`: an `http.createServer()` with a `'connect'` handler on 127.0.0.1:0.
  - Returns `{ url, targets, close }`. `targets` records each CONNECT `req.url` exactly as requested.
  - With `refuse` set, it answers `HTTP/1.1 <refuse> Refused\r\n\r\n` and ends the socket.
  - Otherwise it `net.connect`s to the requested host and port (strip IPv6 brackets), writes
    `HTTP/1.1 200 Connection Established\r\n\r\n`, forwards `head`, and pipes both ways. Each side destroys the other
    on error.
  - `close()` destroys every tracked socket, then closes the server.
- `useRoute({ system?, env?, noProxy? })`: delete `HTTP_PROXY`, `http_proxy`, `HTTPS_PROXY`, `https_proxy`,
  `ALL_PROXY`, `all_proxy`, `NO_PROXY` and `no_proxy`. Then set `HTTP_PROXY = env` and `NO_PROXY = noProxy` when
  given. Then set `resolveProxy.mockResolvedValue(system ? \`PROXY ${new URL(system).host}\` : 'DIRECT')` and
  `await installProxyAwareFetch()`. The describe saves these env keys in `beforeAll` and restores them in
  `afterAll`, and `afterEach(() => useRoute({}))` puts the route back to direct.

The describe is `mcpClient — the metadata refusal and the DNS pin hold on every proxy route (M2-0222)`. It shares
one `startMockMcp()` and one `startConnectProxy()` across its tests, and each test reads `proxy.targets` and
`mock.requests()` as deltas.

```ts
const ROUTES = [
  { slug: 'direct', tunnels: false, use: () => useRoute({}) },
  { slug: 'env-noproxy', tunnels: false, use: () => useRoute({ env: proxy.url, noProxy: 'mcp.test' }) },
  { slug: 'env', tunnels: true, use: () => useRoute({ env: proxy.url }) },
  { slug: 'system', tunnels: true, use: () => useRoute({ system: proxy.url }) }
]
```

| Test | Assertions | Pre-fix |
|---|---|---|
| X1 `it.each(ROUTES)` `$slug: refuses a host resolving to a cloud-metadata address before any tunnel or request` | Host `metadata-${slug}.mcp.test` answers `[['169.254.169.254']]`. `ok` is false, the error matches `/cloud metadata/i`, and no new `proxy.targets` or `mock.requests()` | direct and env-noproxy GREEN (regression guard); env and system RED (the proxy gets `CONNECT metadata-….mcp.test:PORT`) |
| X2 `it.each(ROUTES)` `$slug: dials, or tunnels to, only the address it pinned, consulting the resolver once` | Host `rebind-${slug}.mcp.test` answers `[['127.0.0.1'], ['169.254.169.254']]`. `ok` is true, `tools` contains `push_meeting_recap`, `dnsCallCount === 1`, and `[...new Set(newTargets)]` equals `tunnels ? [\`127.0.0.1:${mockPort}\`] : []` | direct and env-noproxy GREEN; env and system RED (the target is the host name, which the test proxy cannot resolve) |
| X3 `system: tunnels to the IPv4 answer when the host also has an IPv6 one` | Host `dual-system.mcp.test` answers `[['::1', '127.0.0.1']]`. `ok` is true, and the new targets are exactly `[\`127.0.0.1:${mockPort}\`]` | RED |
| X4 `system: a proxy that refuses the pinned tunnel is named in the error, not the API key or the server` | A second `startConnectProxy(403)`, closed in `finally`. Host `refused-system.mcp.test` answers `[['127.0.0.1']]`. The error matches `/proxy refused/i` and not `/API key\|server is running/i`, and that proxy's targets equal `[\`127.0.0.1:${mockPort}\`]` | RED |
| X5 `env: a SOCKS proxy is refused with an actionable message and sends nothing` | `useRoute({ env: 'socks5://127.0.0.1:1' })`. Host `socks-env.mcp.test` answers `[['127.0.0.1']]`. The error matches `/SOCKS/`, and there are no new `mock.requests()` | RED (today: ECONNREFUSED, "Could not reach") |

The existing M1-M5 tests run on the default direct route and stay green unchanged. connectMcp and pushToMcp share
`withClient`, so connectMcp per route is enough. Do not duplicate the matrix for pushToMcp.

### 4.2 `src/main/net/install-proxy.test.ts`

- **In the fix commit**, `FakeProxyAgent` becomes
  `constructor(opts: { uri: string; factory?: unknown }) { this.uri = opts.uri }` with `readonly uri: string`. The
  three MQA-190 tests and P3/P4 keep asserting `.uri` unchanged. Do not change this fake in the red commit: it
  would turn MQA-190 red for the wrong reason.
- New P5 `env proxy that is SOCKS: boot still installs the global dispatcher; a pinned session is refused`:
  - Set `process.env.HTTPS_PROXY = 'socks5://127.0.0.1:1080'` and `await installProxyAwareFetch()`.
  - `setGlobalDispatcher` was called once with a `FakeEnvHttpProxyAgent`.
  - `expect(() => routeDispatcher(lookup)).toThrow(/SOCKS/)`. Match on the message, not the class, so the red commit
    still type-checks.
  - Pre-fix: RED (no throw).
- P1-P4 stay as they are. The route behaviour is proven over real sockets in 4.1. Do not add `factory`-shape
  assertions.

### 4.3 CI evidence (PR evidence table)

- Commit 1 (tests only): run URL plus the exact RED list: X1[env], X1[system], X2[env], X2[system], X3, X4, X5, P5.
  List the GREEN regression guards too: X1/X2 for direct and env-noproxy. If a guard is red on commit 1, stop: the
  route helper is wrong, not the product.
- Head: run URLs for Quality checks (ubuntu and windows), Operator Worker and Security.
- Not run (no CI environment exists for these): a live corporate proxy (TLS-inspecting and domain-ACL) accepting
  `CONNECT <ip>:443` for a hosted MCP endpoint; a split-horizon DNS network.

## 5. Acceptance amendments (proposed)

1. **AC1 →** "On the direct, env (NO_PROXY and proxied) and system routes, a host that resolves in this process to a
   169.254.0.0/16 or other cloud-metadata address is refused with the cloud-metadata message before any request or
   proxy tunnel (X1). A benign host is resolved once per session and is dialled, or tunnelled via
   `CONNECT <pinned address>:<port>`, only at that address, while TLS keeps the host name (X2, X3). A SOCKS env proxy
   is refused for MCP with an actionable message, and boot is unaffected (X5, P5). A proxy that refuses the pinned
   tunnel is named in the error (X4)."
2. **AC2 →** "Behaviour tests per route over real sockets: a real CONNECT proxy and the real Streamable HTTP mock
   (X1-X5), plus P5."
3. **Scope paths:** add `docs/NETWORK-EGRESS.md` (2.3).
4. **Verification / evidence:** D-28 CI evidence (the red run on commit 1, green at head) and
   `npx tsc --noEmit -p tsconfig.node.json`. Replace `LOCALLY_TESTED` with the CI runs.
5. **Ledger note on M2-0147:** its INV-MCP-PIN bullet "through a proxy, the proxy resolves and dials … routing is
   unchanged" is superseded by INV-PIN-EVERY-HOP.

## 6. Risks and residuals

- **Behaviour change (accepted, documented).** Proxied MCP now needs local DNS for the endpoint, and needs the proxy
  to allow CONNECT to IPs. TLS-inspecting proxies categorize by SNI and are unaffected. Domain-ACL proxies without
  inspection may refuse, and X4's message tells the user it was the proxy. This is the price of any sound fix: the
  only alternative is refusing proxied MCP entirely.
- **undici coupling.** The fix relies on ProxyAgent building tunnelled pools through `factory`, with the tunnel as
  `connect`. X2 and X3 assert the recorded CONNECT target, so an undici upgrade that changes this turns CI red and
  can never silently unpin. If a green-phase run fails in the tunnel path, stop and report. Do not switch to
  `interceptors.dns` or to a pre-check (§3).
- **R1 (pre-existing, not fixed here; propose a ticket).** On the system route the PAC is resolved once, for
  `dust.tt`, and applied to every host. A localhost or LAN MCP endpoint (BidStack) on a PAC machine is therefore sent
  to the proxy, which cannot reach it. The fix is to resolve the PAC per endpoint (`session.resolveProxy(endpoint)`),
  a routing change outside this ticket.

## 7. Commits (conventional, `[M2-0222]`, body says why, trailer per the operating rules)

1. `test(mcp): refuse metadata hosts and keep the DNS pin on every proxy route, red first [M2-0222]`
   (4.1 plus P5 only).
2. `fix(net): aim MCP proxy tunnels at the pinned address and refuse SOCKS for pinned sessions [M2-0222]`
   (install-proxy.ts, mcpClient.ts, the FakeProxyAgent constructor, NETWORK-EGRESS.md).

## 8. Size estimate

About 45 production lines (install-proxy ~35 including docs, mcpClient ~8 plus comment edits), ~6 doc lines and
~170 test lines. Risk: medium, concentrated in `pinnedTunnel`, and X2/X3 pin it over real sockets on both OSes.
