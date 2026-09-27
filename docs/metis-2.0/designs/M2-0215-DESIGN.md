# M2-0215 design: observability slice 2 (crash taxonomy, reveal, sidecar and History traces, allowlist projection)

Designer: Opus. Base: `56292fb6` (m2/integration, post-rewrite, includes M2-0006 slice 1). Branch
`m2/M2-0215-observability-slice-2`, worktree `metis-wt-M2-0215`. Status: design only. The implementer (Codex) follows
this file. Claude reviews the PR against §9. Findings: CHATGPT-A1, B3-RC1, B3-RC3, B3-RC4, B1-RC2, P7-INSTR, L06-F5,
L01-F9, L02-F5. Kit: M2-OPS-03, M2-PRIV-03. Depends on M2-0006 (merged).

## 0. Why this design, in one paragraph

Slice 1 made boots, stalls and shutdowns visible. Four gaps remain. (1) The log still cannot tell a failure that ended a
process from one that was handled. (2) Reopen, sidecar and History paths leave no trace, so the Rank 2 "activate is a
no-op in Hide" hypothesis and the E8 start/stop asymmetry are still inferences. (3) Nothing proves the events stay
content-free, and every `app.*` record carries the signed-in user's email today. (4) The owner has no way to hand over
closure evidence without devtools. The design adds one allowlist projection at the single choke point, `auditLog`,
for every lifecycle and diagnostic event. The event set is closed at compile time: an `app.*`, `sidecar.*`,
`history.*` or `reveal` event without an allowlist does not type-check. Around that sit four small, injectable
tracers: crash taxonomy, reveal, sidecar and History. index.ts only swaps call sites. The tray summary aggregates
counts from the audit trail on disk, not from memory, because a freeze's evidence lives in the session that was
force-quit, not in the one the owner is looking at.

## 1. Invariants

**INV-PROJECTED.** Every *observability event* passes `projectEvent` inside `auditLog` before it is serialized. An
observability event is any `AuditEvent` matching `app.*`, `sidecar.*`, `history.*` or `reveal`. Only fields on that
event's allowlist are written, and only when the value satisfies the field's kind. Everything else is dropped:
unknown keys, nested objects, arrays, and values of the wrong kind. `null` is kept and `undefined` is omitted. No
caller can bypass this, because the projection is applied in `auditLog` itself.

**INV-CLOSED-SET.** `OBSERVABILITY_EVENTS` is declared `satisfies { readonly [E in ObservabilityEvent]: EventFields }`.
Adding an `app.*`, `sidecar.*`, `history.*` or `reveal` name to the `AuditEvent` union without an allowlist entry
fails `tsc`, and so does an allowlist entry with no matching union member. Enum-kind fields are typed at call sites, so
passing an unlisted `kind`, `outcome`, `recoveryStatus` or `reason` literal also fails `tsc`.

**INV-CONTENT-FREE.** Field kinds admit only values that cannot carry a title, transcript text, path, URL or email:
booleans, safe integers, finite numbers, UUIDs, semver versions, ISO timestamps, closed enums, and `token`. A token is
a single identifier-shaped word, `/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/`, with no spaces, slashes or `@`. The one
free-text kind is `errorText`, used only for `message` on `app.crash` and `app.error.*`. It is scrubbed and capped:
secrets are redacted, and every URL, email, quoted span (`'…'`, `"…"`, `` `…` ``, `“…”`, `‘…’`) and path is replaced by
`<url>`, `<email>`, `<text>` or `<path>`. Paths include POSIX-absolute paths, `~/` paths, drive-letter and UNC paths,
and a path with spaces up to the next delimiter. Whitespace is then collapsed and the result is cut to **300 chars**.
*Stated residual:* unquoted prose that our own code interpolates into an `Error` message would survive. A grep at
design time found no throw site that interpolates meeting content. The full redacted detail stays in `main.log` and
`crash-*.log`, which the summary never reads.

**INV-UNATTRIBUTED.** Observability records carry no `actor`. Security and data events (`auth.*`, `transcript.*`,
`brain.*`, …) keep their actor exactly as today.

**INV-CRASH-TAXONOMY (B3-RC1).** `app.crash` records a failure that no code handled where it happened. Its `fatal`
field is decided in exactly one place, `crashDetail()`. `fatal` is `true` exactly when a process is known to be dead
when the record is written: `render-process-gone` (the renderer died) and `boot-early-death` (the previous main died).
`uncaughtException` and `unhandledRejection` are `fatal:false`, because registering the listener stops Node from
exiting. `renderer-error-boundary` and `boot` are also `fatal:false`. `app.error.*` records a failure that the site
caught, and names the recovery the site chose in `recoveryStatus`, which is one of `continued`, `retry_pending` or
`safe_start`.

**INV-TRACE-ONLY.** The reveal, sidecar and History tracers never change behaviour. They never swallow or alter a
result or an exception. A failure to read state, such as `liveOverlayLayout()` throwing before settings load, drops
that one field, never the reveal.

**INV-HISTORY-CORRELATED.** One History list request carries one `requestId` (UUID) from renderer to preload to IPC to
main and back. Main writes `received` (with `queueMs`) and `served` (with `mainMs`, `resultCount` and `outcome`). The
renderer reports `settled` (with `ipcMs`, `renderMs` and `outcome`). Main accepts a `settled` report only once, and
only for a `requestId` it received (bounded set, 32 entries). A renderer therefore cannot write arbitrary History
lines. Search requests are never traced.

**INV-SUMMARY-CONTENT-FREE.** The tray's "Copy diagnostics summary" output contains only counts, closed-enum keys,
well-formed event names, ISO timestamps (the window bounds) and the running app's version, platform and arch. It never
contains a path, not even `userData`, and never an actor, bootId, requestId or message.

## 2. Resolved tensions in the ticket

| Tension | Resolution |
|---|---|
| "messages ≤300 chars" vs "no field can carry titles/transcripts/paths/emails" | `errorText` scrub plus cap (INV-CONTENT-FREE). Paths, URLs, emails and quoted spans can never survive. The unquoted-prose residual is stated and not hidden. |
| `pgid` for sidecars | Node has no `getpgid`. Every sidecar today is a non-detached spawn that shares the main process's group. `pgid: null` means exactly that. M2-0028's supervisor leads its own group and fills in its pid. |
| "History clicks" vs scope (App.tsx owns the click) | The requestId is minted when RecallView issues the list request that opening History triggers. Clearing the search also triggers one. Click-to-mount inside App is not measured (§6). |
| `{view, listening}` live in App state, but the boundary wraps App | App records `{view, listening}` from its **render body** into a module-level note. An effect would hold the last *committed* view, which is wrong when a view switch is what crashed. |
| `ensureWindow` runs on every hotkey | It emits `reveal` only on its self-heal path (win null or destroyed). A healthy window returns before any tracing. |
| "UV_THREADPOOL_SIZE (the env value or 'default')" | The value is recorded verbatim as a token: the env value, or `'default'` when the variable is unset or empty. libuv's clamp rules are not re-implemented. |
| Counters for the summary | The summary is aggregated from the live `audit.log` at click time, not from in-memory counters. The session that froze and was force-quit is the one that holds the evidence. |

## 3. Exact changes per file

### 3.1 New `src/main/infra/observability/projection.ts`

This ticket creates the file. M2-0105 later extends it to every sink. Its imports: `import type { AuditEvent } from
'../../logger'`, `import type { RenderProcessGoneDetails } from 'electron'`, `OVERLAY_LAYOUTS` from
`@shared/overlay-chrome`, `RENDERER_VIEWS` from `@shared/renderer-view`, `redactSecrets` from `@shared/redact`, and
`CRASH_KINDS`, `RECOVERY_STATUSES` from `./crash-taxonomy`. It does not import `@shared/ipc`, which keeps logger's
import graph light.

```ts
/** Lifecycle and health events: projected through their allowlist, never attributed to a user. */
export type ObservabilityEvent = Extract<AuditEvent, `app.${string}` | `sidecar.${string}` | `history.${string}` | 'reveal'>
type FieldKind = 'flag' | 'int' | 'num' | 'ms' | 'id' | 'version' | 'isoTime' | 'token' | 'errorText' | readonly string[]
type EventFields = Readonly<Record<string, FieldKind>>
export const MAX_MESSAGE_CHARS = 300
export const REVEAL_REASONS = ['activate', 'second-instance', 'ensure-window'] as const
export const REVEAL_OUTCOMES = ['created', 'shown', 'already-visible', 'failed'] as const
export const SIDECAR_NAMES = ['llama-server', 'fm-serve'] as const
export const HISTORY_STAGES = ['received', 'served', 'settled'] as const
export const HISTORY_OUTCOMES = ['ok', 'failed', 'discarded'] as const
const RENDER_GONE_REASONS = ['clean-exit', 'abnormal-exit', 'killed', 'crashed', 'oom', 'launch-failed',
  'integrity-failure', 'memory-eviction'] as const satisfies readonly RenderProcessGoneDetails['reason'][]
export const OBSERVABILITY_EVENTS = { /* table below */ } as const satisfies { readonly [E in ObservabilityEvent]: EventFields }
type FieldValue<K> = K extends readonly (infer V)[] ? V : unknown
export type ObservabilityDetail<E extends ObservabilityEvent> = {
  readonly [F in keyof (typeof OBSERVABILITY_EVENTS)[E]]?: FieldValue<(typeof OBSERVABILITY_EVENTS)[E][F]> | null
}
export function isObservabilityEvent(event: AuditEvent): event is ObservabilityEvent   // Object.hasOwn
export function projectEvent(event: ObservabilityEvent, detail: Readonly<Record<string, unknown>>): Record<string, unknown>
```

Allowlist table. Every current emitter's fields are covered: run-observability, index.ts, act1-dom-probe and
markShutdownClean.

| Event | Fields (kind) |
|---|---|
| `app.started` | version (version), platform (token), arch (token), bootId (id), prevBootId (id), prevShutdown (`clean`/`unclean`/`unknown`), prevLastAliveAt (isoTime), uvThreadpoolSize (token) |
| `app.renderer.ready` | version, platform, arch |
| `app.act1.dom` | the 18 keys of `summarizeAct1Dom`: booleans → flag; `*Opacity`, `nextPointerEvents` → token; `videoReadyState`, `videoNetworkState`, `rootChildCount` → int; `videoCurrentTime` → num |
| `app.crash` | kind (CRASH_KINDS), fatal (flag), message (errorText), reason (RENDER_GONE_REASONS), exitCode (int), view (RENDERER_VIEWS), listening (flag) |
| `app.error.boot_step` | step (token), message (errorText), recoveryStatus (RECOVERY_STATUSES) |
| `app.error.window_create` | message (errorText), recoveryStatus |
| `app.error.early_death` | consecutive (int), recoveryStatus |
| `app.shutdown.clean` | bootId (id), uptimeS (num), reason (`will-quit`) |
| `app.stall` | bootId (id), durationMs (ms), phase (token), phaseMs (ms) |
| `app.stall.summary` | bootId (id), p99Ms (ms) |
| `app.unresponsive` | kind (`overlay`) |
| `app.responsive` | kind (`overlay`), stallMs (ms) |
| `app.recovery` | kind (`onboarding-replay-replacement-failed`, `onboarding-completion-handoff`) |
| `app.boot.watch_cleared` | earlyDeath (flag), reason (token) |
| `reveal` | reason (REVEAL_REASONS), isVisible (flag), parked (flag), layout (OVERLAY_LAYOUTS), outcome (REVEAL_OUTCOMES), ms (ms) |
| `sidecar.spawn` | name (SIDECAR_NAMES), pid (int), pgid (int) |
| `sidecar.exit` | name, pid, pgid, code (int), signal (token), uptimeMs (ms) |
| `history.request` | requestId (id), stage (HISTORY_STAGES), outcome (HISTORY_OUTCOMES), queueMs, mainMs, ipcMs, renderMs (ms), resultCount (int) |

Kinds:

| Kind | Admits |
|---|---|
| flag | `typeof v === 'boolean'` |
| int | `Number.isSafeInteger(v)` |
| num | finite number |
| ms | finite number ≥ 0, kept as is (no rounding: existing values must not change) |
| id | UUID only, `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` |
| version | `/^\d{1,4}\.\d{1,4}\.\d{1,6}(?:-[0-9A-Za-z.]{1,32})?$/` |
| isoTime | `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/` |
| token | `/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/` |
| enum | a string included in the list |
| errorText | any value, normalized then scrubbed |

errorText normalization: an `Error` becomes `` `${name}: ${message}` ``, a string stays as is, and anything else goes
through `String(v)`. The scrub runs in this order: `redactSecrets`, then URL `/\b[a-z][a-z0-9+.-]*:\/\/[^\s'"`<>]*/gi`
→ `<url>`, then email `/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g` → `<email>`, then quoted spans →
`<text>`, then path `/(?:\b[A-Za-z]:[\\/]|\\\\|~[\\/]|(?<![\w.])\/)[^'"`\n,;()<>]*/g` → `<path>`. The path rule is
greedy to the next delimiter on purpose, so an unquoted path with spaces never leaves a trailing file-name fragment.
Last, whitespace is collapsed to single spaces and the text is trimmed. If the text is longer than
`MAX_MESSAGE_CHARS`, keep the first 299 chars plus `…`. The helper stays module-private and is tested through
`projectEvent`.

The module header comment states INV-PROJECTED, INV-CONTENT-FREE and the residual. The comment for each schema entry
carries over the one-line meaning currently beside that name in logger.ts.

### 3.2 New `src/main/infra/observability/crash-taxonomy.ts`

```ts
export const CRASH_KINDS = ['uncaughtException', 'unhandledRejection', 'render-process-gone',
  'renderer-error-boundary', 'boot-early-death', 'boot'] as const
export type CrashKind = (typeof CRASH_KINDS)[number]
export const RECOVERY_STATUSES = ['continued', 'retry_pending', 'safe_start'] as const
/** Kinds recorded after the failing process died: the renderer, or the previous main. */
const FATAL_KINDS: ReadonlySet<CrashKind> = new Set(['render-process-gone', 'boot-early-death'])
/** The app.crash detail for `kind`; `fatal` is decided here and nowhere else (B3-RC1). */
export function crashDetail(kind: CrashKind, facts: Omit<ObservabilityDetail<'app.crash'>, 'kind' | 'fatal'> = {}):
  ObservabilityDetail<'app.crash'> { return { ...facts, kind, fatal: FATAL_KINDS.has(kind) } }
```

The import from `./projection` is type-only, so there is no runtime cycle. The header documents INV-CRASH-TAXONOMY,
including the meaning of each `recoveryStatus`:

- `continued`: the step's work did not happen and boot went on.
- `retry_pending`: there is no window now, and the next reveal retries.
- `safe_start`: this boot skips the brain resume because the previous launch died early.

### 3.3 New `src/main/infra/observability/reveal-trace.ts`

```ts
export type RevealReason = (typeof REVEAL_REASONS)[number]
export type RevealOutcome = (typeof REVEAL_OUTCOMES)[number]
/** The only BrowserWindow methods a reveal snapshot reads. */
export interface RevealWindow { isDestroyed(): boolean; isVisible(): boolean }
export interface RevealTraceOptions {
  audit: AuditSink
  window: () => RevealWindow | null
  /** The live overlay layout; may throw before settings load, and the event then omits `layout`. */
  layout: () => OverlayLayout
  /** Whether the overlay is resting parked (Hide/Island rest state). */
  parked: () => boolean
  now?: () => number          // default performance.now
}
export interface RevealTrace {
  /** Run `reveal` and audit what it did to the overlay window; returns its result or rethrows its error. */
  trace<T>(reason: RevealReason, reveal: () => T): T
}
export function createRevealTrace(opts: RevealTraceOptions): RevealTrace
```

Behaviour:

1. Take the snapshot `before = {live, visible}` (`live = w !== null && !w.isDestroyed()`; `visible = live && w.isVisible()`),
   plus `parked` and `layout` (read inside a try; drop the field on throw).
2. Start the clock and run `reveal` in `try`/`finally`.
3. In `finally`, snapshot `after` and audit `reveal {reason, isVisible: before.visible, parked, layout, outcome, ms}`.

The outcome is decided in this order:

1. The reveal threw, or no live window remains → `failed`.
2. There was no live window before → `created`.
3. The window was visible before → `already-visible`.
4. The window is visible after → `shown`.
5. Otherwise → `failed`.

`already-visible` with `parked:true` and `layout:'hide'` is exactly the Rank 2 signature. `already-visible` with
`layout:'bar'` is expected, because activate then opens Settings inside an already-visible window.

### 3.4 New `src/main/infra/observability/sidecar-events.ts`

```ts
export type SidecarName = (typeof SIDECAR_NAMES)[number]
/** The ChildProcess surface this module reads. */
export interface SidecarProcess {
  readonly pid?: number
  once(event: 'exit', listener: (code: number | null, signal: NodeJS.Signals | null) => void): unknown
}
/** Audit a sidecar's spawn and its exit, paired by pid. `pgid` is null: every sidecar today shares the main
 *  process's group (non-detached spawn; Node exposes no getpgid) — M2-0028's supervisor will lead its own. */
export function observeSidecar(name: SidecarName, child: SidecarProcess, audit: AuditSink, clock = () => performance.now()): void
```

If `pid === undefined` (spawn failed, and the runtime's own `error` path audits that), the function emits nothing. Otherwise
it emits `sidecar.spawn {name, pid, pgid: null}`, then on `once('exit')` it emits `sidecar.exit {name, pid, pgid: null,
code, signal, uptimeMs}`. An exit that lands after `app.shutdown.clean`, or never lands because the process exits
first, is expected. The header says so.

### 3.5 New `src/main/infra/observability/history-trace.ts`

```ts
export interface HistoryTracer {
  /** Serve one History list request; audits `received` and `served` when `rawTrace` is a valid HistoryTrace,
   *  otherwise just serves (BrainView/Review/Settings call recallList untraced). */
  traceList<T extends readonly unknown[]>(rawTrace: unknown, list: () => Promise<T>): Promise<T>
  /** Audit the renderer's `settled` report, once, and only for a requestId this tracer received. */
  settle(rawReport: unknown): void
}
export interface HistoryTracerOptions { audit: AuditSink; wallClock?: () => number; clock?: () => number }
const MAX_UNSETTLED = 32
export function createHistoryTracer(opts: HistoryTracerOptions): HistoryTracer
```

`traceList` is an `async` function, so a synchronous throw from `list` becomes a rejection. It parses the trace with
`HistoryTraceSchema.safeParse`. If the parse fails, it returns `list()`. Otherwise:

1. Remember the requestId in an insertion-ordered `Set`, evicting the oldest entry past 32.
2. Audit `{requestId, stage:'received', queueMs: Math.max(0, wallClock() - sentAt)}`.
3. Time `list()` on `clock`.
4. On success, audit `{requestId, stage:'served', outcome:'ok', mainMs, resultCount: result.length}`.
5. On failure, audit `{…, outcome:'failed', mainMs}` and rethrow.

`queueMs` uses both processes' wall clock (`Date.now`). Renderer and main share the OS clock, so this measures IPC queue
time plus main event-loop wait, which is the Rank 1 signal. `settle` parses with `HistorySettledSchema`. It audits
`{requestId, stage:'settled', outcome, ipcMs, renderMs}` only if `unsettled.delete(requestId)` returned true.

### 3.6 New `src/main/infra/observability/diagnostics-summary.ts`

```ts
export interface DiagnosticsIdentity { version: string; platform: string; arch: string }
export interface DiagnosticsSummary {
  kind: 'metis-diagnostics-summary'; schema: 1; generatedAt: string
  app: DiagnosticsIdentity
  window: { from: string | null; to: string | null; records: number }
  boots: { started: number; prevShutdown: Record<'clean' | 'unclean' | 'unknown', number> }
  stalls: { under2s: number; '2to5s': number; '5to30s': number; '30sPlus': number }
  crashes: { fatal: number; nonFatal: number; unclassified: number }
  reveals: Record<RevealOutcome, number>
  events: Record<string, number>
}
export function summarizeAuditTrail(lines: readonly string[], identity: DiagnosticsIdentity, generatedAt: Date): DiagnosticsSummary
/** Never rejects: an unreadable or missing trail yields a zero summary, which is still copied. */
export async function copyDiagnosticsSummary(opts: { auditTrailPath: string; identity: DiagnosticsIdentity;
  writeText: (text: string) => void; now?: () => Date }): Promise<void>
```

`summarizeAuditTrail` handles one line at a time:

- It parses the line with `JSON.parse`. A line that is not a plain object with a string `event` matching
  `/^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+){0,4}$/` (at most 64 chars) is skipped.
- `window.from` and `window.to` are the min and max of `ts` values that pass the isoTime check. `records` counts the
  lines that were counted.
- `events[name]++`. This count includes `brain.index.quarantined`, and later `sidecar.reaped` and `sidecar.unsupervised`.
- An `app.started` line adds to `boots.started`, and its `prevShutdown` is counted when it is in the enum.
- An `app.stall` line with a finite `durationMs` goes into a bucket: `<2000` → under2s, `<5000` → 2to5s, `<30000` →
  5to30s, else 30sPlus.
- An `app.crash` line counts as fatal for `fatal === true`, nonFatal for `fatal === false`, and unclassified otherwise.
  Records from before this ticket have no `fatal`.
- A `reveal` line's `outcome` is counted when it is in the enum.

No other value from the file is copied. `copyDiagnosticsSummary` reads the file with `readFile(path, 'utf8')` inside a
try (treating any error as `''`), splits it on `/\r?\n/`, and writes `JSON.stringify(summary, null, 2)`. Only the live
`audit.log` is read, and `window` tells the reader what it covers. Reading and parsing a 5 MB trail costs tens of ms on
a user click, which is acceptable.

### 3.7 New `src/shared/renderer-view.ts`

```ts
/** Every top-level view App renders; a renderer crash report names one of these. */
export const RENDERER_VIEWS = ['answer', 'copilot', 'settings', 'review', 'history', 'agenda', 'brain'] as const
export type RendererView = (typeof RENDERER_VIEWS)[number]
```

App.tsx's own `View` union stays as it is. The call `noteCrashContext({ view, … })` makes `tsc` enforce
`View ⊆ RendererView`.

### 3.8 New renderer libs

`src/renderer/src/lib/crash-context.ts`:

```ts
/** Record what App is rendering. Called from App's render body, not an effect: a render that throws never
 *  commits, so an effect would still hold the previous view — the wrong one when a view switch is what crashed. */
export function noteCrashContext(context: RendererCrashContext): void
/** The ErrorBoundary's report: the error plus the last noted context (absent before App first renders). */
export function crashReport(error: Error | null | undefined, componentStack: string | null | undefined): RendererCrashReport
```

`src/renderer/src/lib/history-trace.ts`:

```ts
export interface HistoryRequest {
  /** Sent with recallList so main can time the queue and work stages. */
  readonly trace: HistoryTrace
  /** The IPC resolved; renderMs is measured from here. */
  resolved(): void
  /** React committed and painted the list this request fetched: reports outcome 'ok'. */
  painted(): void
  /** The response was never shown (a newer request won, or History closed): reports 'discarded'. */
  discarded(): void
  /** The IPC rejected: reports 'failed'. */
  failed(): void
}
export interface HistoryRequestDeps { report: (settled: HistorySettled) => void; newId: () => string;
  wallClock: () => number; clock: () => number }
export function beginHistoryRequest(deps?: HistoryRequestDeps): HistoryRequest
```

The default deps are `window.toto.reportHistorySettled(s).catch(() => {})`, `crypto.randomUUID()`, `Date.now` and
`performance.now`. The first terminal call (`painted`, `discarded` or `failed`) reports and later calls do nothing.
`ipcMs` is measured from start to `resolved()`, or to the terminal call if `resolved()` never ran. `renderMs` is
measured from `resolved()` to `painted()`.

### 3.9 `src/shared/ipc.ts`

- Add `historySettled: 'history:settled'` to `IPC`, next to the `recall*` channels.
- Add these schemas and types next to `ListeningStatePayloadSchema`. `RENDERER_VIEWS` is imported from
  `./renderer-view`:

```ts
export const HistoryTraceSchema = z.object({ requestId: z.string().uuid(), sentAt: z.number().finite().positive() })
export type HistoryTrace = z.infer<typeof HistoryTraceSchema>
export const HistorySettledSchema = z.object({ requestId: z.string().uuid(),
  outcome: z.enum(['ok', 'failed', 'discarded']), ipcMs: z.number().finite().nonnegative(),
  renderMs: z.number().finite().nonnegative().optional() })
export type HistorySettled = z.infer<typeof HistorySettledSchema>
export const RendererCrashContextSchema = z.object({ view: z.enum(RENDERER_VIEWS), listening: z.boolean() })
export type RendererCrashContext = z.infer<typeof RendererCrashContextSchema>
export interface RendererCrashReport extends Partial<RendererCrashContext> { message: string; stack?: string;
  componentStack?: string }
```

### 3.10 `src/preload/index.ts`

- `recallList: (trace?: HistoryTrace): Promise<MeetingSummary[]> => ipcRenderer.invoke(IPC.recallList, trace)`
- add `reportHistorySettled: (settled: HistorySettled): Promise<void> => ipcRenderer.invoke(IPC.historySettled, settled)`
- `reportCrash: (report: RendererCrashReport): Promise<void> => ipcRenderer.invoke(IPC.rendererCrash, report)`. Keep
  the existing comment.

### 3.11 `src/renderer/src/main.tsx`

In `componentDidCatch`, replace the positional call with
`void window.toto.reportCrash(crashReport(error, info?.componentStack)).catch(() => {})`. Nothing else changes.

### 3.12 `src/renderer/src/App.tsx` (scope amendment: one import and one statement)

Right after `const setView = useCallback(…)` (line ~462), add the statement below, with a one-line comment pointing
at `crash-context.ts` for why it runs in render. Check that no early `return` precedes it.

```ts
noteCrashContext({ view, listening: listen.listening })
```

### 3.13 `src/renderer/src/components/RecallView.tsx`

This is the only place that mints a trace: the fetch-owner effect (`useEffect(…, [q])`, ~line 1096).

```ts
const query = q.trim()
const request = query ? null : beginHistoryRequest()
const p = query ? window.toto.recallSearch(query) : window.toto.recallList(request?.trace)
p.then((l) => {
  request?.resolved()
  if (!stale && seq === fetchSeqRef.current) {
    setItems(l)
    setDebouncedQ(q)
    if (request) {
      unpaintedRequestRef.current?.discarded()
      unpaintedRequestRef.current = request
    }
  } else request?.discarded()
})
  .catch(() => request?.failed())
  .finally(() => { if (!stale) setLoading(false) })
```

Also add:

- `const unpaintedRequestRef = useRef<HistoryRequest | null>(null)`, with the comment "The traced list request whose
  response is waiting to be painted."
- `useEffect(() => { unpaintedRequestRef.current?.painted(); unpaintedRequestRef.current = null }, [items])`.
- An unmount cleanup, `useEffect(() => () => unpaintedRequestRef.current?.discarded(), [])`.

`refreshList` and search stay untraced. The existing `seq`/`stale` guards and their comments are unchanged.

### 3.14 `src/main/logger.ts`

- Import `isObservabilityEvent`, `projectEvent`, and the types `ObservabilityDetail` and `ObservabilityEvent` from
  `./infra/observability/projection`.
- In the `AuditEvent` union, keep every existing member in place. Add these, each with a one-line comment:
  `'app.error.boot_step'`, `'app.error.window_create'`, `'app.error.early_death'`, `'reveal'`, `'sidecar.spawn'`,
  `'sidecar.exit'` and `'history.request'`. The union must still end right before `// Lazy actor resolver`, because
  `audit-event-coverage.contract.test.ts` slices on that line, and every new name gets a literal call site.
- Add a doc line above the union: "app.*, sidecar.*, history.* and reveal events are observability events: each needs
  an allowlist in infra/observability/projection.ts (tsc enforces it) and is written without an actor."
- Add the types:

```ts
/** What an event may carry: an observability event only its allowlisted fields. */
export type AuditDetail<E extends AuditEvent> = E extends ObservabilityEvent ? ObservabilityDetail<E> : Record<string, unknown>
export type AuditSink = typeof auditLog
```

- Change the signature to `export function auditLog<E extends AuditEvent>(event: E, detail?: AuditDetail<E>): void`.
  In the body:
  1. Compute `const observability = isObservabilityEvent(event)`.
  2. Set the fields to `projectEvent(event, detail ?? {})` when `observability` is true, and to `detail ?? {}`
     otherwise.
  3. Resolve the actor only when `!observability`.
  4. Leave the chain logic unchanged.

  If `tsc` cannot relate the deferred conditional type to `Readonly<Record<string, unknown>>`, widen it once through a
  typed local. Never use `any`.
- `auditLogPath()` is now also used in production by the summary. Replace the "Test seam:" wording with: "Where the
  audit trail lives for this process (userData/logs in the app, a scratch directory otherwise)."

### 3.15 `src/main/infra/observability/run-observability.ts`

- `audit: AuditSink` (the type is imported from `../../logger`).
- Add the option `uvThreadpoolSize?: string`, documented as: "UV_THREADPOOL_SIZE as this process started with it
  (ADR-021); absent or empty means libuv's default".
- Add `uvThreadpoolSize: opts.uvThreadpoolSize || 'default'` to the `app.started` detail. Touch nothing in the
  powerMonitor section (M2-0220 owns it).

### 3.16 `src/main/llm/local-runtime.ts` and `src/main/llm/fm-runtime.ts` (scope amendment: one import and one line each)

After `child = proc`, add `observeSidecar('llama-server', proc, auditLog)` in local-runtime (~line 371) and
`observeSidecar('fm-serve', proc, auditLog)` in fm-runtime (~line 288). Do not touch stop paths, the `fm available`
probe spawn, or anything M2-0026 changes.

### 3.17 `src/main/index.ts` (call-site swaps only)

1. **Imports.** Add these imports:
   - `crashDetail` and `type CrashKind` from `./infra/observability/crash-taxonomy`
   - `createRevealTrace` from `./infra/observability/reveal-trace`
   - `createHistoryTracer` from `./infra/observability/history-trace`
   - `copyDiagnosticsSummary` from `./infra/observability/diagnostics-summary`
   - `auditLogPath`, added to the existing `./logger` import
   - `RendererCrashContextSchema` and `type RendererCrashContext` from `@shared/ipc`. No History schema is imported
     here, because the tracer parses its own input.
2. **createWindow.** Pass `uvThreadpoolSize: process.env.UV_THREADPOOL_SIZE` to `startRunObservability`.
3. **render-process-gone.** Change the `app.crash` line to
   `auditLog('app.crash', crashDetail('render-process-gone', { reason: details.reason, exitCode: details.exitCode }))`.
   The sliced tests match other lines of this handler, so they keep passing.
4. **Reveal tracer.** Just above `ensureWindow`, at module scope and outside the `clampHeight`…`toggleVisible` region
   that overlay-placement lifts, add:

   ```ts
   const reveals = createRevealTrace({ audit: auditLog, window: () => win, layout: liveOverlayLayout, parked: () => islandResting })
   ```

5. **ensureWindow.** Keep the healthy fast path, and move the self-heal into the tracer:

   ```ts
   function ensureWindow(): BrowserWindow | null {
     if (win && !win.isDestroyed()) return win
     return reveals.trace('ensure-window', () => {
       win = null // a destroyed-but-non-null win is just as dead as null — treat it the same before recreating
       try {
         createWindow()
       } catch (e) {
         mainLog.error('[recover] createWindow retry failed:', e)
         auditLog('app.error.window_create', { message: e, recoveryStatus: 'retry_pending' })
       }
       return win
     })
   }
   ```

   Update the doc comment to say a heal is audited as `reveal` and a failed heal as `app.error.window_create`.
6. **persistCrash.** The signature becomes
   `persistCrash(kind: CrashKind, detail: string, shortMessage: string, context?: RendererCrashContext)`. The audit
   line becomes
   `auditLog('app.crash', crashDetail(kind, { message: redactSecrets(shortMessage), ...context }))`. The filename,
   redaction and dump are unchanged (crash-capture.test pins the filename).
7. **onFatal.** No change beyond what `persistCrash` implies: `kind` is already one of the two `CrashKind` literals.
   Leave everything after `persistCrash` alone, because M2-0037 rewrites it.
8. **buildTrayMenu.** Insert the entry below directly above `Force Quit Métis`. Keep the `Force Quit Métis` label and
   entry byte-identical, because c-main-fixes pins them.

   ```ts
   { label: 'Copy diagnostics summary', click: () => void copyDiagnosticsSummary({
       auditTrailPath: auditLogPath(),
       identity: { version: app.getVersion(), platform: process.platform, arch: process.arch },
       writeText: (text) => clipboard.writeText(text) }) },
   ```

9. **registerIpc.** Declare `const history = createHistoryTracer({ audit: auditLog })` before the Recall handlers.
   - recallList becomes `ipcMain.handle(IPC.recallList, (e, trace: unknown) => { assertMainWindow(e); return history.traceList(trace, () => (requireAuth() ? listMeetings() : Promise.resolve([]))) })`.
   - Add a handler directly after `IPC.recallOpen`:
     `ipcMain.handle(IPC.historySettled, (e, report: unknown) => { assertMainWindow(e); if (!requireAuth()) return; history.settle(report) })`.
   - Never place a handler between `IPC.rendererCrash` and `IPC.windowMoveBy`, because security-audit-10 slices that
     span.
10. **rendererCrash.** Keep the current body. Add `const context = RendererCrashContextSchema.safeParse(raw)` and call
    `persistCrash('renderer-error-boundary', …, message, context.success ? context.data : undefined)`. The
    `if (!requireAuth()) return` stays before `persistCrash`.
11. **second-instance.** Wrap the unchanged body:

    ```ts
    app.on('second-instance', () =>
      reveals.trace('second-instance', () => {
        …existing body…
      })
    )
    ```

    The text `if (!w.isVisible()) w.showInactive()` stays verbatim, because no-show-steals-focus pins it.
12. **boot-early-death.** `persistCrash('boot-early-death', …)` needs no other change: `fatal` comes from the taxonomy.
13. **runStep catch.** `auditLog('app.crash', { kind: 'boot_step', step: name })` becomes
    `auditLog('app.error.boot_step', { step: name, message: e, recoveryStatus: 'continued' })`.
14. **Safe start.** `auditLog('app.crash', { kind: 'safe_start', … })` becomes
    `auditLog('app.error.early_death', { consecutive: earlyDeath.consecutive, recoveryStatus: 'safe_start' })`.
15. **activate.** Use `app.on('activate', () => reveals.trace('activate', () => { …existing body… }))`. The text
    `else win.showInactive()` stays verbatim.
16. **whenReady .catch.** `auditLog('app.crash', crashDetail('boot', { message: redactSecrets(…) }))`.

After these edits, `rg "auditLog\('app\.crash'" src/main/index.ts` shows only the three `crashDetail` call sites:
render-process-gone, persistCrash and boot.

### 3.18 Test harness adaptations (existing tests, minimal)

- `src/main/audit-log-chain.test.ts`: the three `auditLog('app.crash', { probe })` writes become
  `auditLog('settings.changed', { probe })`, with a comment: "an attributed event: app.* is projected and would drop
  `probe`, leaving the tamper case nothing to edit". This change is required: the tamper test would otherwise edit
  nothing.
- `src/main/main-lifecycle.contract.test.ts` (MQA-172 harness): pass a fourth parameter,
  `new Function('app', 'win', 'ensureWindow', 'reveals', src)`, with `{ trace: (_reason: string, reveal: () => void) => reveal() }`.
  Every existing assertion stays as it is.

### 3.19 `docs/AUDIT-LOG.md`

In "What a record carries", change the actor clause to "the signed-in actor's email (security and data events)". Add
a short section, "Diagnostic events", that says:

- `app.*`, `reveal`, `sidecar.*` and `history.*` pass an allowlist projection and carry no actor.
- Messages are scrubbed and capped at 300 chars.
- The tray's "Copy diagnostics summary" copies counts only.

## 4. Tests, red first

Push the tests before the implementation. The red run must fail on the assertions named here, not only on missing
imports, wherever the module already exists. Record both run URLs in the PR.

| File | Cases | Red on parent because |
|---|---|---|
| `infra/observability/projection.test.ts` (new) | (a) For each event and field, a canonical valid value of the field's kind survives unchanged. This guards against a vacuous projection. (b) Unknown keys are dropped. (c) **The allowlist sweep:** for every field of every event and every sentinel (title, transcript sentence, POSIX, Windows, `~`, UNC path, `file://` and https URL, email, nested object, array), `JSON.stringify(projectEvent(…))` contains none of the markers `Board`, `Acme`, `acme`, `jane`, `budget`, `Meetings`, `@`. For `errorText` fields the bare title and transcript sentinels are excluded from the sweep, because that is the stated residual, and (d) covers them. (d) errorText with realistic shapes: ENOENT with a quoted POSIX path; EPERM with Windows paths; a `JSON.parse` snippet quoting transcript text; an unquoted email; an https URL with a title in the query; an unquoted spawn path with spaces; a `TypeError` object quoting a title. Each loses every marker and keeps its non-content prefix, for example `ENOENT: no such file or directory, open`. (e) `sk-…` keys are redacted. (f) The cap is exactly 300. (g) `null` is kept and `undefined` omitted. | the module does not exist |
| `logger.projection.test.ts` (new; same hermetic `node:os` tmpdir mock as audit-log-chain) | With `setAuditActor(() => 'jane.doe@acme-corp.com')`: (a) An `app.crash` written with an extra `title` and a path-bearing message has no `actor`, no `title`, and a scrubbed message. Cast the adversarial detail through `ObservabilityDetail<'app.crash'>`. (b) `settings.changed` keeps its actor and its detail unchanged. | the actor and title are written today |
| `infra/observability/crash-taxonomy.test.ts` (new) | `fatal` is true for exactly `render-process-gone` and `boot-early-death` and false for the other four kinds. Facts are preserved. Facts cannot override `kind` or `fatal`. | missing |
| `infra/observability/run-observability.test.ts` | The existing `app.started` expectation gains `uvThreadpoolSize: 'default'`. A new case: `'16'` is passed through verbatim. | the field is absent |
| `infra/observability/reveal-trace.test.ts` (new) | `created` (null window → window), `shown` (hidden → visible), `already-visible` with `parked:true, layout:'hide'`, `failed` (throws: audited, then rethrown; also "no window after"). A `layout` that throws gives an event without `layout` and the reveal still runs. The return value passes through. `ms` comes from the injected clock. `isVisible` and `parked` are the *before* state. | missing |
| `infra/observability/sidecar-events.test.ts` (new) | Spawn gives `{name, pid, pgid:null}`. Exit gives the same pid with `code`, `signal` and `uptimeMs`. An undefined pid gives no events. | missing |
| `infra/observability/history-trace.test.ts` (new) | A missing or invalid trace serves untraced with no audit. `received` has `queueMs` clamped at 0. `served` ok has `mainMs` and `resultCount`. `served` failed rethrows. `settle` is accepted once for a received id and ignored for an unknown id, a second settle, or an invalid report. After 33 requests the oldest id is no longer settleable. | missing |
| `infra/observability/diagnostics-summary.test.ts` (new) | It aggregates boots and prevShutdown, the stall buckets at their boundaries (1999/2000/4999/5000/29999/30000), crashes (fatal, nonFatal, unclassified), reveals, and `events`, including `brain.index.quarantined`. It skips malformed lines and bad event names. **Content-free:** lines carrying an actor email, a titled `brain.*` record and a path in a message produce JSON with no markers. `copyDiagnosticsSummary` writes that JSON. A missing file yields a zero summary and still writes. | missing |
| `renderer/src/lib/history-trace.test.ts` (new) | The trace is `{uuid, sentAt}`. `painted` reports `ok` with `ipcMs` and `renderMs`. `discarded` and `failed` report `ipcMs` without `renderMs`. Only the first terminal call reports. | missing |
| `renderer/src/lib/crash-context.test.ts` (new) | `crashReport` carries the last noted `{view, listening}`; with no note it carries neither. The message, stack and componentStack defaults hold. | missing |
| `shared/ipc.test.ts` | `HistoryTraceSchema` rejects a non-UUID. `HistorySettledSchema` rejects a negative ms and an unknown outcome. `RendererCrashContextSchema` rejects an unknown view. The existing channel-uniqueness test covers `history:settled`. | the schemas are missing |

All new tests are behaviour tests. Do not add any source-text test. The two harness edits in §3.18 keep existing tests
meaningful and add no new pins.

## 5. What not to do

- Do not change what any reveal does. Do not build `reveal()` (M2-0036), do not use `isResponsive()`, and do not add a
  reload on `unresponsive`.
- Do not touch `onFatal` after its `persistCrash` line or the dialog (M2-0037), and do not touch the render-process-gone
  reload.
- Do not add `stopAll`, a registry, supervision, `detached`, or a SIGTERM handler (M2-0026/27/28). Do not instrument
  other children (ffmpeg, the watchers, mac-helper, utilityProcess hosts). They join through the registry and
  supervisor.
- Do not project attributed events, and do not change their fields. M2-0105 extends projection to every sink.
- Do not add an in-memory ring, a telemetry SDK, an upload or a new dependency.
- Do not trace search requests, and never put a query, title, file name or folder into any event.
- Do not hash messages or content. A content hash is still content-derived (M2-0105).
- Do not change `recallList`'s return shape. Do not mint the requestId in App.tsx. Change nothing else in App.tsx beyond
  §3.12.
- Do not edit `act1-dom-probe.ts`. Do not round or rename any existing numeric field.
- Do not put `userData`, any path, a bootId, a requestId or an actor into the summary.
- Do not reorder IPC handlers across the `rendererCrash`…`windowMoveBy` span. Do not reword the pinned strings
  `if (!w.isVisible()) w.showInactive()`, `else win.showInactive()` or `label: 'Force Quit Métis'`. Do not move
  `reveals` into the `clampHeight`…`toggleVisible` region.
- Do not run any test, node script or the app on the Mac (D-28). Only `npx tsc --noEmit -p tsconfig.node.json` and
  `-p tsconfig.web.json` run locally.

## 6. Acceptance amendments (for the orchestrator to apply to the ledger)

1. `app.crash` carries `fatal`. It is true exactly for `render-process-gone` and `boot-early-death`, and it is decided
   in `crashDetail`. Uncaught exceptions and rejections stay `app.crash` with `fatal:false`. Handled failures emit:
   - `app.error.boot_step` (`continued`)
   - `app.error.window_create` (`retry_pending`)
   - `app.error.early_death` (`safe_start`)

   Messages are scrubbed of secrets, URLs, emails, quoted spans and paths, and are at most 300 chars.
2. `reveal` events record reason, isVisible (before), parked (before), layout, outcome (`created`, `shown`,
   `already-visible` or `failed`) and ms. `ensureWindow` emits only on its self-heal path.
3. `sidecar.spawn` and `sidecar.exit` record name, pid and pgid for `llama-server` and `fm-serve`. These are the two
   long-lived runtimes behind E2 and E8, and behind L01-F9 and L02-F5. `pgid` is `null` while a sidecar shares the main
   process's group, which is true of every direct spawn today, since Node has no getpgid. M2-0028 fills it.
4. The History `requestId` is minted when RecallView issues the list request that opening History, or clearing the
   search, triggers. The stages are `received` and `served` in main and `settled` in the renderer. Click-to-mount inside
   App is not measured: App.tsx is out of scope, and M2-0036 and M2-0040 own that path. Searches are not traced.
5. `{view, listening}` is recorded from App's render body. Scope gains `src/renderer/src/App.tsx` (one statement).
6. The allowlist projection covers every `app.*`, `sidecar.*`, `history.*` and `reveal` event, and `tsc` enforces that
   the set is complete. These records carry no actor. Other audit events are unchanged. The stated residual is
   unquoted prose that our own code puts in an Error message.
7. `uvThreadpoolSize` is the env value verbatim, or `'default'`.
8. "Copy diagnostics summary" aggregates the live `audit.log`, and its `window` field reports coverage. It copies
   counts only.
9. Scope additions:
   - `src/main/llm/local-runtime.ts`, `src/main/llm/fm-runtime.ts`
   - `src/renderer/src/App.tsx`
   - `src/shared/ipc.ts`, `src/shared/renderer-view.ts`
   - `src/renderer/src/lib/{crash-context,history-trace}.ts`
   - `src/main/audit-log-chain.test.ts`, `src/main/main-lifecycle.contract.test.ts`
   - `docs/AUDIT-LOG.md`

## 7. Coordination with in-flight work (merge-queue order decides; the second to land reconciles)

- **M2-0037 (#228).** `tsc` will force two changes to its branch:
  - `app.render_loop_halted` needs an allowlist entry (`reason` from RENDER_GONE_REASONS, `exitCode` int).
  - Its `app.crash {kind:'render-process-gone-reload-failed'}` is not a `CrashKind`. It is a handled failure, so it
    becomes an `app.error.*` event with a `recoveryStatus`. The vocabulary is extended by one value only if none fits.

  Its halted-dialog "Copy diagnostics" button copies the `userData` path, which violates INV-SUMMARY-CONTENT-FREE and
  M2-PRIV-03. It should call `copyDiagnosticsSummary` instead. Flag this to the lead now; it is not this ticket's edit.
  There will be an adjacent-line text conflict on the render-process-gone `app.crash` line, which is trivial to resolve.
- **M2-0220 (#230).** It edits run-observability's powerMonitor block and its test. This ticket edits the options, the
  `app.started` detail and one test expectation. The hunks do not overlap.
- **M2-0224 (#229).** It edits createWindow's readiness block. This ticket's createWindow edit is one option line in
  `startRunObservability`. The hunks do not overlap.
- **M2-0026 (in progress).** This ticket makes one-line insertions after `child = proc`. Stop paths are untouched. No
  M2-0026 function is used.
- **M2-0192 (stall-watch).** When it lands, it adds `'stall-watch'` to SIDECAR_NAMES and calls `observeSidecar`.
- **M2-0036.** `reveal()` keeps emitting through `createRevealTrace`. It extends REVEAL_REASONS (tray, hotkey,
  notification) and may add `healthState`.
- **M2-0105.** It extends `projection.ts` to every sink. This ticket owns creating the file.

## 8. Evidence and PR plan (CI only)

- **Commit 1**, `test(observability): pin content-free projection, crash taxonomy and trace behaviour [M2-0215]`: tests
  only. Push, then record the red run from `build.yml` (Quality checks ubuntu and windows).
- **Commit 2**, `feat(observability): allowlist projection, crash taxonomy, reveal/sidecar/History traces and diagnostics
  summary [M2-0215]`: the implementation, plus the §3.18 harness edits and the docs. Push, then record the green run.
  Compare it with the baseline, run 36267674617.
- Before each push, run `npx tsc --noEmit -p tsconfig.node.json` and `-p tsconfig.web.json` locally. Nothing else runs
  locally.
- Open a draft PR into `m2/integration` using the template. The evidence table lists the red and green run URLs. The
  not-run list covers the packaged-build proof of `reveal`, `sidecar.*` and `history.request` on a real Electron build,
  which is LIVE_VERIFIED work that belongs to the M2-0199 gate.
- The evidence target is LOCALLY_TESTED. The estimate stays at 8 h.

## 9. Review checklist for the Claude challenger

1. `tsc` fails if you add a dummy `'app.x'` to the union with no allowlist. Try it on a scratch edit and do not commit
   it.
2. `auditLog` is the only writer, and no observability record can gain an `actor`.
3. Every allowlist field matches the kind table. No `token` field is fed user data anywhere in the diff.
4. The errorText test covers every realistic shape in §4 (d). The cap is 300.
5. `crashDetail` is the only place that decides `fatal`. After the change, index.ts has no `app.crash` for `boot_step`
   or `safe_start`.
6. The reveal wrappers keep the pinned strings verbatim, and `ensureWindow`'s healthy path emits nothing.
7. The History settle path rejects unknown or repeated ids, and search is untraced.
8. The summary JSON contains no path, id, actor or message, and M2-0037's userData copy is flagged to the lead.
9. The diff has no source-text tests, no TODOs, no dead code, and no edits outside §6.9 scope plus the ticket's
   scope_paths.
