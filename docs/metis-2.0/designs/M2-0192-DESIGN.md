# M2-0192 design: out-of-process stall sampler

Designer: Opus. Base: `56292fb6` (= `origin/m2/integration`). Branch: `m2/M2-0192-stall-sampler`.
Status: design only. The implementer (Sonnet) follows this file. Line anchors are at `56292fb6`.

## 0. Why this design, in one paragraph

A main thread blocked in the kernel (OBSERVED: `apfs_materialize_dataless_file_ext`, 45-85 s) cannot log
its own stall; `app.stall` (M2-0006) only appears after recovery and carries no stack, and the force-quit
freeze left nothing at all. So a second process has to look at main while it is stuck. The existing Swift
helper gains one long-running mode, `stall-watch`, that does three mechanical things and nothing else:
it stats `run-alive.json` every 5 s, runs `/usr/bin/sample` on its parent when that file has stopped
changing, and prints one word on stdout. Everything that needs judgement (redaction, naming, retention,
auditing, the flag) lives in TypeScript, because CI cannot compile or run Swift and cannot see a real
macOS process. The raw capture stays in a private directory until main is free again (or until the next
launch, if the user force-quit); main then projects it onto thread stacks and symbol names through an
allowlist that makes a leaked path or email impossible by construction, writes the bundle, deletes the
capture and audits `app.stall.sampled`. Healthy cost: one sleeping helper doing one `stat` per 5 s; main
gains no timer.

Evidence labels: OBSERVED, DERIVED, ASSUMED, UNKNOWN (AGENTS.md section 4).

## 1. Invariants

**INV-1 (out of process, no load on main).** Main never inspects itself. Its only new work is: at boot,
one `mkdir`, one `readdir` and one spawn; after a stall, reacting to one stdout line. No timer, poll or
interval is added to main. The helper's healthy cost is one `stat(2)` per 5 s (target, ASSUMED until the
QA run measures it: under 1 s CPU per hour, footprint under 10 MB).

**INV-2 (stale means "not seen to change for 20 s of awake time").** The helper samples only when the
marker's mtime has not changed for more than `--stale-after-ms` (= `ALIVE_INTERVAL_MS + 10_000` = 20 s)
of awake time since the helper last saw it change. Awake time is `CLOCK_UPTIME_RAW`, which stops during
sleep. The mtime is compared only for equality, never subtracted from a clock. An unreadable marker counts
as a change (no evidence, never a stall). Consequences, all DERIVED:
- A lid-close, a wall-clock step or a delayed helper poll can never produce a sample.
- A healthy marker is rewritten about every 10.0 s, so the staleness the helper sees at any poll stays
  under about 10.1 s. A sample needs a rewrite at least 10 s overdue, which is a real main-thread stall
  or a starved libuv pool (the bundle's stacks tell which).
- Detection latency is at most 30 s after main stops (20 s threshold plus up to 10 s of heartbeat phase
  and poll granularity).

**INV-3 (rate).** At most one sample per stall: the helper re-arms only after it sees the mtime change
again. At most one sample per 10 minutes of awake time, failed samples included. A sample run is bounded
to 60 s and killed after that.

**INV-4 (ownership).** The helper samples only the pid it was given, and only while that pid is its
parent (`getppid()`); it refuses to start otherwise. It never signals main. It exits within one 5 s poll
of main's death by any path (will-quit, `app.exit`, onFatal relaunch, SIGKILL, crash), because it is then
reparented. The one exception is deliberate: if main dies while a sample is in flight, the helper first
lets the sample finish (at most 60 s, `-mayDie` keeps the symbols) so the capture of the wedge that
preceded a force-quit survives. A clean quit kills it through `observability.shutdownClean`. It is spawned
without `detached` and is never restarted.

**INV-5 (raw captures are contained).** A raw capture exists only as
`userData/diagnostics/stalls/raw/<bootId>.<capturedAtMs>.<stalledMs>.sample`, in a 0700 directory. Only
`collectStallCaptures` reads it. No event, log line or export ever references it. It is deleted after one
projection attempt, whether that attempt succeeded or not. A failed or timed-out sample leaves no capture
(the helper unlinks the partial file). Anything else found in `raw/` is deleted.

**INV-6 (content-free by construction).** A bundle is built from an allowlist: only call-graph thread
headers and frame lines survive, each rebuilt from parsed fields (sample count, symbol, image, offset,
tree-drawing characters). The report header, thread names, queue labels, source `file:line`, the summary
sections and Binary Images are dropped. A symbol or image name that contains `/`, `\`, `@` or a control
character, or is longer than 512 characters, becomes `<redacted>`. The bundle header is generated from
the capture name (bootId, capture time, stalledMs), never copied. Therefore **no bundle contains `/`, `\`
or `@`**: no path and no email can survive, and a user name can only appear inside a path, which is
dropped. Symbol and image names come from the symbol tables of loaded code, not from user data.

**INV-7 (bounded).** At most 10 bundles (newest capture time kept). At most 512 KiB of stacks per bundle,
cut at a line boundary with a `[truncated]` line; the main thread is written first, so truncation never
drops it. A capture over 16 MiB is not read.

**INV-8 (audit).** Each capture outcome is audited exactly once: `app.stall.sampled {bootId, stalledMs,
bundle}` or `app.stall.sample_failed {bootId, reason:'bundle'}`. Each failed sample is audited once as
`app.stall.sample_failed {bootId, reason:'sample'}`. A helper that dies or cannot start before `stop()`
is audited once per boot as `reason:'watcher'`. A clean stop audits nothing. `bootId` is the boot that
stalled, which for a capture swept at the next launch is the previous boot. `bundle` is the file name
inside `userData/diagnostics/stalls/`, so no event carries a path.

**INV-9 (off means pre-ticket).** With no stall-watch command (every platform but macOS, a missing
helper, or flag `diagnostics.stall_sampler` off), `startRunObservability` spawns nothing, creates no
directory, sweeps nothing and emits no new event: it behaves exactly as at M2-0006.

**INV-10 (never fatal).** Nothing in the sampler can throw into boot or quit. `collectStallCaptures`
never rejects. Spawn and mkdir failures are caught and audited.

## 2. The helper contract (Swift ↔ TypeScript)

- **Command line** (owned by `stall-sampler.ts`):
  `metis-mac-helper stall-watch --pid <main pid> --alive <userData>/run-alive.json
  --capture-prefix <userData>/diagnostics/stalls/raw/<bootId> --stale-after-ms 20000`
- **Capture file:** `<capture-prefix>.<epochMs>.<stalledMs>.sample`, written by
  `/usr/bin/sample <pid> 5 10 -mayDie -file <capture>`:
  - `epochMs` is the helper's wall clock at sample start. It is used only for naming and retention order.
  - `stalledMs` is the awake time since the helper last saw the marker change, at sample start.
- **stdout:** one word per line, `sampled` (a capture is ready) or `failed` (sample exited non-zero or
  overran 60 s; nothing was left behind). Nothing else is ever printed. `sample`'s own stdout and stderr go
  to `/dev/null` (without `-file` it would also copy the report to `/tmp` and stdout).
- **Exit:** 0 when the parent is gone; 1 with a usage message on bad arguments or when `--pid` is not the
  parent.

Why the two flags beyond the ticket's `--pid`/`--alive`:
- `--capture-prefix` carries the bootId into the capture name. That lets a capture swept at the next
  launch be attributed to the boot that stalled, with no guess from `prevBootId`.
- `--stale-after-ms` keeps the threshold next to the heartbeat period it depends on (TypeScript). A future
  change to `ALIVE_INTERVAL_MS` then cannot silently turn every healthy interval into a "stall".

## 3. Changes per file

### 3.1 `native/mac-helper/main.swift` (mechanism only; about 90 lines; CI cannot compile it)

Header block (after the `stat-flags` entry, line 37-41), add:

```swift
//   stall-watch       Long-running, one per boot. --pid <main> --alive <file> --capture-prefix <path>
//                     --stale-after-ms <ms>. Every 5 s it stats <file>; when its mtime has not changed
//                     for more than <ms> of awake time it runs /usr/bin/sample on <main> into
//                     <path>.<epochMs>.<stalledMs>.sample, once per stall and at most once per 10 minutes,
//                     then prints `sampled` or `failed`. It samples only its own parent and exits once
//                     <main> is no longer its parent. src/main/infra/observability/stall-sampler.ts owns
//                     the protocol; all redaction, retention and auditing happen there, not here.
```

New section before `// MARK: - entry point` (line 313):

```swift
// MARK: - stall-watch

let stallPollSeconds: UInt32 = 5
let stallCooldownMs: UInt64 = 600_000
let sampleDeadlineMs: UInt64 = 60_000

/// Awake milliseconds. CLOCK_UPTIME_RAW stops while the Mac sleeps, so a lid-close never counts toward a
/// stall.
func awakeMs() -> UInt64 {
    clock_gettime_nsec_np(CLOCK_UPTIME_RAW) / 1_000_000
}

/// The file's mtime in nanoseconds, or nil when stat(2) fails. Only ever compared for equality, so a
/// wall-clock step cannot fake a stall either.
func mtimeNs(_ path: String) -> Int? {
    var info = stat()
    guard stat(path, &info) == 0 else { return nil }
    return info.st_mtimespec.tv_sec * 1_000_000_000 + info.st_mtimespec.tv_nsec
}

/// Samples `pid` into `path` for 5 s at 10 ms; -mayDie keeps the symbols if `pid` dies mid-sample. True
/// only when sample exited 0 within the deadline; otherwise it is killed and its partial output removed,
/// so a failed sample never becomes a bundle.
func sampleInto(_ path: String, pid: Int32) -> Bool {
    let sampler = Process()
    sampler.executableURL = URL(fileURLWithPath: "/usr/bin/sample")
    sampler.arguments = [String(pid), "5", "10", "-mayDie", "-file", path]
    // This helper's stdout is the protocol pipe to the main process: sample must never write to it.
    sampler.standardOutput = FileHandle.nullDevice
    sampler.standardError = FileHandle.nullDevice
    do {
        try sampler.run()
    } catch {
        return false
    }
    let deadline = awakeMs() + sampleDeadlineMs
    while sampler.isRunning && awakeMs() < deadline {
        usleep(100_000)
    }
    if sampler.isRunning {
        kill(sampler.processIdentifier, SIGKILL)
        sampler.waitUntilExit()
    }
    let captured = sampler.terminationReason == .exit && sampler.terminationStatus == 0
    if !captured { unlink(path) }
    return captured
}

func runStallWatch(_ options: [String]) -> Never {
    func value(of flag: String) -> String? {
        guard let i = options.firstIndex(of: flag), i + 1 < options.count else { return nil }
        return options[i + 1]
    }
    guard let pid = value(of: "--pid").flatMap({ Int32($0) }),
          let alivePath = value(of: "--alive"),
          let capturePrefix = value(of: "--capture-prefix"),
          let staleAfterMs = value(of: "--stale-after-ms").flatMap({ UInt64($0) })
    else {
        fail("usage: metis-mac-helper stall-watch --pid <pid> --alive <file> --capture-prefix <path> --stale-after-ms <ms>")
    }
    guard getppid() == pid else { fail("stall-watch: --pid \(pid) is not this helper's parent") }

    var lastMtime = mtimeNs(alivePath)
    var lastChangeAt = awakeMs()
    var sampledThisStall = false
    var lastSampleAt: UInt64?
    while true {
        sleep(stallPollSeconds)
        // A dead parent reparents this helper, so getppid() changes: exit rather than ever sample a
        // process this helper did not come from.
        guard getppid() == pid else { exit(0) }
        let now = awakeMs()
        let mtime = mtimeNs(alivePath)
        // An unreadable marker is no evidence of a stall: treat it like a fresh write.
        if mtime == nil || mtime != lastMtime {
            lastMtime = mtime
            lastChangeAt = now
            sampledThisStall = false
            continue
        }
        let stalledMs = now - lastChangeAt
        let cooledDown = lastSampleAt.map { now - $0 >= stallCooldownMs } ?? true
        guard stalledMs > staleAfterMs, !sampledThisStall, cooledDown else { continue }
        sampledThisStall = true
        lastSampleAt = now
        let epochMs = Int64(Date().timeIntervalSince1970 * 1000)
        let captured = sampleInto("\(capturePrefix).\(epochMs).\(stalledMs).sample", pid: pid)
        print(captured ? "sampled" : "failed")
        fflush(stdout)
    }
}
```

Entry point:
- Usage string (line 317): `<watch-frontmost|ocr|transcribe|screen-metrics|stat-flags|stall-watch>`.
- After `case "stat-flags":` / `runStatFlags()`, add `case "stall-watch":` / `runStallWatch(Array(arguments.dropFirst(2)))`.

Swift notes for the implementer (no compiler is available to you; keep to these exact APIs):
- `var info = stat()` / `stat(path, &info)` is the form `runStatFlags` already compiles with.
  `st_mtimespec.tv_sec` and `.tv_nsec` are both `Int` on 64-bit Darwin.
- Top-level `let` constants used inside functions are already a pattern here (`screenNumberKey`).
- `Process.isRunning` is updated by Foundation off the caller's run loop. DERIVED from the documented
  behaviour of `waitUntilExit`, which polls `isRunning` while spinning the run loop. ASSUMED until the QA
  run. If it were ever false, the symptom is a `failed` line after 60 s, never a hang or a leak.
- `sleep`, `usleep`, `kill`, `unlink` and `fflush` are imported C functions, so their results are
  discardable.
- A `-> Never` function whose body is `while true` with no `break` satisfies the compiler.

### 3.2 `src/main/infra/observability/stall-bundle.ts` (NEW)

Owns the capture and bundle layout, the projection, collection and retention. Pure Node, no Electron.

```ts
/**
 * stall-bundle.ts — turns a raw /usr/bin/sample capture of a stalled main process into a content-free
 * bundle and keeps the newest MAX_BUNDLES of them (M2-0192, ARCHITECTURE C15).
 *
 * `metis-mac-helper stall-watch` (see stall-sampler.ts) writes each capture into captureDir() as
 * `<bootId>.<capturedAtMs>.<stalledMs>.sample`. A capture is the full sample(1) report, which names the
 * app's install path and every loaded image's path, so it never leaves captureDir():
 * collectStallCaptures() projects it into a bundle and deletes it, whether or not the projection succeeds.
 *
 * The projection is an allowlist, not a scrub. Only the call graph's thread headers and frame lines
 * survive, each rebuilt from parsed fields: sample count, symbol name, image name and offset. The report
 * header, thread and queue names, source file:line, the summary sections and Binary Images are dropped. A
 * symbol or image name holding `/`, `\`, `@` or a control character becomes `<redacted>`, so no bundle
 * contains any of those characters and no path or email can survive. Symbol and image names come from the
 * symbol tables of loaded code, never from user data.
 */
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Bundles kept; the oldest capture is dropped first. */
export const MAX_BUNDLES = 10
/** Stack bytes kept per bundle. The main thread is written first, so the cut never drops it. */
export const MAX_BUNDLE_BYTES = 512 * 1024
/** A 5 s sample of the main process is a few hundred KB; a file this large is not one. */
const MAX_CAPTURE_BYTES = 16 * 1024 * 1024
const MAX_FIELD_CHARS = 512
const REDACTED = '<redacted>'

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const CAPTURE_NAME = new RegExp(`^(${UUID})\\.(\\d{1,15})\\.(\\d{1,15})\\.sample$`)
const BUNDLE_NAME = new RegExp(`^${UUID}\\.(\\d{1,15})\\.\\d{1,15}\\.txt$`)

const THREAD_LINE = /^\s+(\d+)\s+Thread_\d+(.*)$/
const FRAME_LINE = /^\s+([+!:| ]*)(\d+)\s+(.+)$/
const SYMBOLIZED = /^(.+?) {2}\(in ([^)]+)\) \+ (\d+)/
const UNSYMBOLIZED = /^\?\?\? {2}\(in ([^)]+)\) {2}load address 0x[0-9a-f]+ \+ (0x[0-9a-f]+)/
const UNKNOWN = /^\?\?\?(\s|$)/
const UNSAFE = /[/\\@\p{Cc}]/u

interface Capture {
  bootId: string
  capturedAtMs: number
  stalledMs: number
}

/** One capture's fate, for the caller to audit. `bootId` is the boot that stalled; after a relaunch that
 *  is not the current boot. `bundle` is a file name inside bundleDir(). */
export type CaptureOutcome =
  | { kind: 'bundled'; bootId: string; stalledMs: number; bundle: string }
  | { kind: 'failed'; bootId: string }

export function bundleDir(userData: string): string {
  return join(userData, 'diagnostics', 'stalls')
}

export function captureDir(userData: string): string {
  return join(bundleDir(userData), 'raw')
}

function safe(field: string): string {
  return field.length > MAX_FIELD_CHARS || UNSAFE.test(field) ? REDACTED : field
}

function projectFrame(tree: string, count: string, rest: string): string {
  const symbolized = SYMBOLIZED.exec(rest)
  if (symbolized) return `${tree}${count} ${safe(symbolized[1])}  (in ${safe(symbolized[2])}) + ${symbolized[3]}`
  const unsymbolized = UNSYMBOLIZED.exec(rest)
  if (unsymbolized) return `${tree}${count} ???  (in ${safe(unsymbolized[1])}) + ${unsymbolized[2]}`
  return `${tree}${count} ${UNKNOWN.test(rest) ? '???' : REDACTED}`
}

/** The call graph of a sample(1) report as thread stacks and symbol names only, main thread first. Pure.
 *  Empty when the report has no call-graph thread (for example sample's own error text). */
export function projectSample(report: string): string[] {
  const threads: { main: boolean; lines: string[] }[] = []
  let inCallGraph = false
  for (const line of report.split(/\r?\n/)) {
    if (!inCallGraph) {
      inCallGraph = line.trim() === 'Call graph:'
      continue
    }
    if (/^\S/.test(line)) break // the next report section starts in column 0
    const thread = THREAD_LINE.exec(line)
    if (thread) {
      const main = thread[2].includes('com.apple.main-thread')
      threads.push({ main, lines: [`Thread ${threads.length}${main ? ' (main)' : ''}  ${thread[1]}`] })
      continue
    }
    const frame = FRAME_LINE.exec(line)
    if (frame && threads.length > 0) threads[threads.length - 1].lines.push(projectFrame(frame[1], frame[2], frame[3]))
  }
  return [...threads.filter((t) => t.main), ...threads.filter((t) => !t.main)].flatMap((t) => t.lines)
}

function capped(lines: string[]): string[] {
  const kept: string[] = []
  let bytes = 0
  for (const line of lines) {
    bytes += Buffer.byteLength(line) + 1
    if (bytes > MAX_BUNDLE_BYTES) return [...kept, '[truncated]']
    kept.push(line)
  }
  return kept
}

function renderBundle(capture: Capture, stacks: string[]): string {
  return [
    'metis stall bundle v1',
    `bootId: ${capture.bootId}`,
    `capturedAt: ${new Date(capture.capturedAtMs).toISOString()}`,
    `stalledMs: ${capture.stalledMs}`,
    'source: sample(1), 5 s at 10 ms; thread stacks and symbol names only',
    '',
    ...capped(stacks),
    ''
  ].join('\n')
}

function parseCapture(name: string): Capture | null {
  const m = CAPTURE_NAME.exec(name)
  return m ? { bootId: m[1], capturedAtMs: Number(m[2]), stalledMs: Number(m[3]) } : null
}

async function bundleCapture(userData: string, path: string, capture: Capture): Promise<CaptureOutcome> {
  const failed: CaptureOutcome = { kind: 'failed', bootId: capture.bootId }
  try {
    if ((await stat(path)).size > MAX_CAPTURE_BYTES) return failed
    const stacks = projectSample(await readFile(path, 'utf8'))
    if (stacks.length === 0) return failed
    const bundle = `${capture.bootId}.${capture.capturedAtMs}.${capture.stalledMs}.txt`
    await writeFile(join(bundleDir(userData), bundle), renderBundle(capture, stacks), { mode: 0o600 })
    return { kind: 'bundled', bootId: capture.bootId, stalledMs: capture.stalledMs, bundle }
  } catch {
    return failed
  }
}

async function pruneBundles(userData: string): Promise<void> {
  const names = await readdir(bundleDir(userData)).catch((): string[] => [])
  const newestFirst = names
    .flatMap((name) => {
      const m = BUNDLE_NAME.exec(name)
      return m ? [{ name, capturedAtMs: Number(m[1]) }] : []
    })
    .sort((a, b) => b.capturedAtMs - a.capturedAtMs)
  for (const { name } of newestFirst.slice(MAX_BUNDLES)) {
    await rm(join(bundleDir(userData), name), { force: true }).catch(() => undefined)
  }
}

/** Turn every pending capture into a bundle or a failure, delete it either way, then keep the newest
 *  MAX_BUNDLES bundles. Never rejects; a missing capture directory is nothing to do. */
export async function collectStallCaptures(userData: string): Promise<CaptureOutcome[]> {
  const dir = captureDir(userData)
  const names = await readdir(dir).catch((): string[] => [])
  const outcomes: CaptureOutcome[] = []
  for (const name of names) {
    const capture = parseCapture(name)
    if (capture) outcomes.push(await bundleCapture(userData, join(dir, name), capture))
    await rm(join(dir, name), { force: true }).catch(() => undefined)
  }
  if (outcomes.some((o) => o.kind === 'bundled')) await pruneBundles(userData)
  return outcomes
}
```

Notes:
- `bundleDir` exists whenever a capture does: `stall-sampler.ts` creates `captureDir` recursively before
  the first spawn, so collection needs no `mkdir`.
- A non-file entry in `raw/` makes `rm` reject; the rejection is swallowed and the entry stays. That is
  harmless, because only names matching `CAPTURE_NAME` are ever read.

### 3.3 `src/main/infra/observability/stall-sampler.ts` (NEW)

Owns the helper's lifetime, its arguments and its stdout protocol, and turns outcomes into audit events.
Pure Node plus `boot-sentinel` (no Electron import, same rule as run-observability.ts).

```ts
/**
 * stall-sampler.ts — this boot's out-of-process stall sampler (M2-0192, ARCHITECTURE C15, ADR-023).
 *
 * A blocked main thread cannot report its own stall, so `metis-mac-helper stall-watch` watches
 * run-alive.json from outside. When the marker has gone unchanged for more than `aliveIntervalMs + 10 s`
 * of awake time (its rewrite is more than 10 s overdue), the helper runs /usr/bin/sample on this process,
 * once per stall and at most once per 10 minutes, writes the capture into stall-bundle.ts's captureDir(),
 * and prints one word on stdout:
 *   sampled   a capture is ready
 *   failed    /usr/bin/sample failed or overran its deadline; nothing was left behind
 * The word waits in the pipe until this thread is free again; stall-bundle.ts then turns every pending
 * capture into a content-free bundle and this module audits each outcome.
 *
 * Ownership: the helper samples only its parent, never signals it, and exits within one 5 s poll of the
 * parent dying (or, if a sample is in flight, when that sample finishes). stop() kills it on a clean quit.
 * It is never restarted: a helper that dies is audited once and this boot runs without a sampler.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { runAlivePath } from '../../boot-sentinel'
import type { AuditEvent } from '../../logger'
import { captureDir, collectStallCaptures, type CaptureOutcome } from './stall-bundle'

/** The ticket's "more than 10 s stale": how far past its scheduled rewrite the marker must be. */
const OVERDUE_MS = 10_000

type SampleFailure = 'sample' | 'bundle' | 'watcher'

export interface StallSamplerOptions {
  /** The metis-mac-helper binary. */
  command: string
  userData: string
  bootId: string
  /** How often the caller rewrites run-alive.json. */
  aliveIntervalMs: number
  audit: (event: AuditEvent, detail?: Record<string, unknown>) => void
  /** Test seams only; production uses the real spawn and collector. */
  deps?: { spawn?: typeof spawn; collect?: typeof collectStallCaptures }
}

export interface StallSampler {
  /** Kill the helper and ignore anything it prints afterwards. Captures already being bundled still
   *  finish and are audited. Idempotent. */
  stop(): void
}

export function startStallSampler(opts: StallSamplerOptions): StallSampler {
  const collect = opts.deps?.collect ?? collectStallCaptures
  let stopped = false
  let watcherGone = false
  let collecting: Promise<void> = Promise.resolve()

  const auditFailure = (bootId: string, reason: SampleFailure): void =>
    opts.audit('app.stall.sample_failed', { bootId, reason })
  const auditOutcome = (outcome: CaptureOutcome): void => {
    if (outcome.kind === 'bundled') {
      opts.audit('app.stall.sampled', { bootId: outcome.bootId, stalledMs: outcome.stalledMs, bundle: outcome.bundle })
    } else {
      auditFailure(outcome.bootId, 'bundle')
    }
  }
  // One collection at a time: two running at once would each bundle and audit the same capture.
  const collectCaptures = (): void => {
    collecting = collecting.then(async () => {
      for (const outcome of await collect(opts.userData)) auditOutcome(outcome)
    })
  }
  const onWatcherGone = (): void => {
    if (stopped || watcherGone) return
    watcherGone = true
    auditFailure(opts.bootId, 'watcher')
  }

  // A previous run killed mid-stall leaves its capture behind; bundle it under that run's bootId.
  collectCaptures()

  const child = spawnWatcher(opts)
  if (!child) {
    onWatcherGone()
    return { stop: () => void (stopped = true) }
  }
  child.once('error', onWatcherGone)
  child.once('close', onWatcherGone)
  let partial = ''
  child.stdout?.setEncoding('utf8')
  child.stdout?.on('data', (chunk: string) => {
    const lines = (partial + chunk).split('\n')
    partial = lines.pop() ?? ''
    for (const line of lines) {
      if (stopped) return
      if (line === 'sampled') collectCaptures()
      else if (line === 'failed') auditFailure(opts.bootId, 'sample')
    }
  })
  return {
    stop(): void {
      if (stopped) return
      stopped = true
      child.kill('SIGKILL')
    }
  }
}

function spawnWatcher(opts: StallSamplerOptions): ChildProcess | undefined {
  const doSpawn = opts.deps?.spawn ?? spawn
  try {
    mkdirSync(captureDir(opts.userData), { recursive: true, mode: 0o700 })
    return doSpawn(
      opts.command,
      [
        'stall-watch',
        '--pid', String(process.pid),
        '--alive', runAlivePath(opts.userData),
        '--capture-prefix', join(captureDir(opts.userData), opts.bootId),
        '--stale-after-ms', String(opts.aliveIntervalMs + OVERDUE_MS)
      ],
      { stdio: ['ignore', 'pipe', 'ignore'] }
    )
  } catch {
    return undefined
  }
}
```

Implementer latitude: keep the behaviour and names. Formatting follows prettier. The inert `stop` may be
written as a block rather than `void (stopped = true)` if that reads better; it must still make a later
`stop()` a no-op.

### 3.4 `src/main/infra/observability/run-observability.ts`

- Header comment (line 2): "claims the run watch, audits `app.started`, runs the liveness heartbeat, the
  out-of-process stall sampler (stall-sampler.ts) and the stall monitor, and closes out with
  `app.shutdown.clean`."
- Import `startStallSampler, type StallSampler, type StallSamplerOptions` from `./stall-sampler`.
- `RunObservabilityOptions` gains:
  ```ts
  /** The metis-mac-helper binary that runs this boot's out-of-process stall sampler (stall-sampler.ts).
   *  Absent or null means no sampler (no helper on this platform, or flag `diagnostics.stall_sampler`
   *  off), and then this module behaves exactly as it did before M2-0192. */
  stallWatchCommand?: string | null
  ```
  Also add `startStallSampler?: (opts: StallSamplerOptions) => StallSampler` to `deps`, resolved like the
  others: `const doStartStallSampler = deps.startStallSampler ?? startStallSampler`.
- Right after `aliveTimer` is created:
  ```ts
  const stallSampler = opts.stallWatchCommand
    ? doStartStallSampler({
        command: opts.stallWatchCommand,
        userData: opts.userData,
        bootId,
        aliveIntervalMs: ALIVE_INTERVAL_MS,
        audit: opts.audit
      })
    : undefined
  ```
- In `shutdownClean`, as the first statement after `stopped = true`:
  `stallSampler?.stop()`. Add a comment: before the heartbeat stops, so the helper can never see the
  marker go stale during the rest of `will-quit`.

### 3.5 `src/main/boot-sentinel.ts`

Line 175: `function runAlivePath` becomes `export function runAlivePath`. Add a doc line saying the stall
sampler watches this file's mtime from outside the process. There is no other change.

### 3.6 `src/main/mac-helper.ts`

- Header list gains a bullet: `stall-watch`: long-running, one per boot, samples main when
  `run-alive.json` stops changing; `infra/observability/stall-sampler.ts` owns its arguments and protocol.
- After `macStatFlagsSpawnSpec` (line 101):
  ```ts
  /** Flag `diagnostics.stall_sampler` (ARCHITECTURE C15). false restores the pre-M2-0192 boot exactly: no
   *  stall-watch helper, no capture sweep, no new audit events. */
  const STALL_SAMPLER_ENABLED = true

  /** The helper binary for the long-running `stall-watch` sidecar, or null when there is no helper (always
   *  off macOS) or the flag is off. infra/observability/stall-sampler.ts owns its arguments and protocol. */
  export function macStallWatchCommand(): string | null {
    return STALL_SAMPLER_ENABLED && macHelperPresent() ? macHelperPath() : null
  }
  ```

### 3.7 `src/main/logger.ts`

After `'app.stall.summary'` (line 220):

```ts
  // M2-0192: the out-of-process stall sampler (infra/observability/stall-sampler.ts). `sampled` names a
  // content-free bundle in userData/diagnostics/stalls/ by file name; `sample_failed` carries only a
  // reason ('sample' | 'bundle' | 'watcher'). bootId is the boot that stalled.
  | 'app.stall.sampled'
  | 'app.stall.sample_failed'
```

### 3.8 `src/main/index.ts` (call-site only; merge-queue file, M2-0188)

- Line 169: `import { extractScreenText, macStallWatchCommand } from './mac-helper'`.
- At the `startRunObservability({...})` call (line 2549-2556), after `powerMonitor`, add:
  `stallWatchCommand: macStallWatchCommand()`.
  Extend the comment above it: "…and the out-of-process stall sampler (M2-0192)".

### 3.9 `scripts/qa/stall-sampler-check.sh` (NEW, mode 100755; QA macOS account only)

This script produces the LIVE_VERIFIED output, which M2-0002 requires to be harness-produced. It follows
the style of `scripts/qa/stat-flags-fixture.sh`.

```bash
#!/usr/bin/env bash
# QA check for the out-of-process stall sampler (M2-0192). Run on the isolated QA macOS account only,
# never on an owner account, against a packaged candidate on a fresh profile that has been idle (including
# one sleep and wake) for at least 60 minutes.
#
#   scripts/qa/stall-sampler-check.sh <main-pid> <userData>
#
#   <main-pid>  the candidate's main process (pgrep -x Metis)
#   <userData>  the candidate's userData directory
#
# Passes when: exactly one stall-watch helper is a child of main; the idle period produced no bundle and
# no app.stall.sampled; a 40 s SIGSTOP of main produces exactly one bundle and one app.stall.sampled; the
# bundle starts with the main thread and contains no '/', '\' or '@' and not this account's user name; and
# after kill -9 of main the helper is gone within 6 s. Prints the helper's CPU time and RSS (census row).
set -euo pipefail

fail() { echo "FAIL: $*" >&2; exit 1; }
count_bundles() { find "$stalls" -maxdepth 1 -name '*.txt' | wc -l | tr -d ' '; }
count_events() { grep -c '"event":"app.stall.sampled"' "$audit" || true; }

[[ "$(uname)" == Darwin ]] || fail 'macOS only'
[[ $# -eq 2 ]] || fail 'usage: stall-sampler-check.sh <main-pid> <userData>'
pid=$1 userdata=$2
stalls="$userdata/diagnostics/stalls" audit="$userdata/logs/audit.log"
kill -0 "$pid" 2>/dev/null || fail "no process $pid"
[[ -d "$stalls" && -f "$audit" ]] || fail "not a sampler-enabled profile: $userdata"
helper=$(pgrep -P "$pid" -f 'metis-mac-helper stall-watch' || true)
[[ -n "$helper" && "$helper" != *$'\n'* ]] || fail "expected one stall-watch child of $pid, got: ${helper:-none}"
echo "helper $helper after idle (cputime rss_kb): $(ps -o cputime=,rss= -p "$helper")"
[[ $(count_bundles) -eq 0 && $(count_events) -eq 0 ]] || fail 'the idle period produced a bundle or app.stall.sampled'

kill -STOP "$pid"; sleep 40; kill -CONT "$pid"
for _ in $(seq 120); do [[ $(count_bundles) -ge 1 && $(count_events) -ge 1 ]] && break; sleep 1; done
sleep 5
[[ $(count_bundles) -eq 1 ]] || fail "expected 1 bundle after the stop, found $(count_bundles)"
[[ $(count_events) -eq 1 ]] || fail "expected 1 app.stall.sampled, found $(count_events)"
bundle=$(find "$stalls" -maxdepth 1 -name '*.txt')
grep -q '^Thread [0-9]* (main)' "$bundle" || fail 'bundle has no main thread'
if grep -q '[/@\\]' "$bundle"; then fail "bundle contains '/', '\\' or '@'"; fi
if grep -qiF "$(id -un)" "$bundle"; then fail 'bundle contains the user name'; fi
echo "PASS stop: $(basename "$bundle"), $(wc -c <"$bundle" | tr -d ' ') bytes, raw left: $(ls "$stalls/raw" | wc -l | tr -d ' ')"

kill -9 "$pid"; sleep 6
if kill -0 "$helper" 2>/dev/null; then fail "helper $helper outlived main by 6 s"; fi
echo 'PASS parent death: helper exited'
```

## 4. Tests, red first

All tests are behaviour tests. None match source text. They run in CI only (D-28). Temporary directories
come from `mkdtempSync(join(tmpdir(), 'metis-stall-'))`, which is hermetic under M2-0001. Assert file
modes only when `process.platform !== 'win32'`.

**Red commit.** The first commit holds the tests plus type-correct skeletons of the new exports, each
body `throw new Error('M2-0192: not implemented')`, and the two new `AuditEvent` members. Typecheck stays
green, so the red run shows the new tests failing on behaviour: `audit-event-coverage` also fails until
the call sites exist. The next commit replaces every skeleton; none survives to the PR head.

### 4.1 Fixture (in `stall-bundle.test.ts`; built with `[...].join('\n')` so whitespace is exact)

```ts
const USER = 'jane.doe'
const TITLE = 'Q3 pricing review with Acme'
const TRANSCRIPT = 'we agreed to cut the price by twelve percent'
const EMAIL = 'jane.doe@example.com'
const FILE = '2026-09-26 Q3 pricing review.md'

const REPORT = [
  'Analysis of sampling Metis (pid 4242) every 10 milliseconds',
  'Process:         Metis [4242]',
  `Path:            /Users/${USER}/Applications/Metis.app/Contents/MacOS/Metis`,
  'Identifier:      com.mantu.asktoto',
  'Version:         1.9.7 (1.9.7)',
  'Parent Process:  launchd [1]',
  'Date/Time:       2026-09-26 12:00:00.000 +0200',
  'Analysis Tool:   /usr/bin/sample',
  '----',
  '',
  'Call graph:',
  `    500 Thread_81234: ${TITLE}`,
  '    + 500 thread_start  (in libsystem_pthread.dylib) + 8  [0x18d4210c0]',
  '    +   500 _pthread_start  (in libsystem_pthread.dylib) + 136  [0x18d4212e4]',
  '    +     500 worker  (in Electron Framework) + 64  [0x10a1b2c3d]  threadpool.c:77',
  '    +       500 __psynch_cvwait  (in libsystem_kernel.dylib) + 8  [0x18d3e2c4c]',
  `    500 Thread_81230: ${FILE}   DispatchQueue_1: com.apple.main-thread  (serial)`,
  '    + 500 start  (in dyld) + 6076  [0x18d0e2b98]',
  '    +   500 main  (in Metis) + 128  [0x1000034a0]',
  '    +     500 ???  (in Electron Framework)  load address 0x104000000 + 0x5c6a1c8  [0x109c6a1c8]',
  `    +       494 uv_fs_read  (in Electron Framework) + 300  [0x10a000000]  /Users/${USER}/src/fs.c:12`,
  '    +       ! 494 __pread_nocancel  (in libsystem_kernel.dylib) + 8  [0x18d3e1234]',
  `    +       3 open:/Users/${USER}/Meetings/${FILE}  (in libfoo.dylib) + 4  [0x10b000004]`,
  `    +       1 notify ${EMAIL}  (in /Users/${USER}/Library/libbar.dylib) + 1  [0x10b000008]`,
  '    +       1 ???  [0x10b00000c]',
  `    +       1 ${TRANSCRIPT}`,
  '',
  'Total number in stack (recursive counted multiple, when >=5):',
  '        5       _pthread_start  (in libsystem_pthread.dylib) + 136  [0x18d4212e4]',
  '',
  'Sort by top of stack, same collapsed (when >= 5):',
  '        __pread_nocancel  (in libsystem_kernel.dylib)        494',
  `        ${TRANSCRIPT}        5`,
  '',
  'Binary Images:',
  `       0x100000000 -        0x100007fff +com.mantu.asktoto (1.9.7) <00000000-0000-0000-0000-000000000000> /Users/${USER}/Applications/Metis.app/Contents/MacOS/Metis`,
  ''
].join('\n')

const EXPECTED = [
  'Thread 1 (main)  500',
  '+ 500 start  (in dyld) + 6076',
  '+   500 main  (in Metis) + 128',
  '+     500 ???  (in Electron Framework) + 0x5c6a1c8',
  '+       494 uv_fs_read  (in Electron Framework) + 300',
  '+       ! 494 __pread_nocancel  (in libsystem_kernel.dylib) + 8',
  '+       3 <redacted>  (in libfoo.dylib) + 4',
  '+       1 <redacted>  (in <redacted>) + 1',
  '+       1 ???',
  '+       1 <redacted>',
  'Thread 0  500',
  '+ 500 thread_start  (in libsystem_pthread.dylib) + 8',
  '+   500 _pthread_start  (in libsystem_pthread.dylib) + 136',
  '+     500 worker  (in Electron Framework) + 64',
  '+       500 __psynch_cvwait  (in libsystem_kernel.dylib) + 8'
]
const PLANTED = [USER, 'Users', TITLE, 'Acme', TRANSCRIPT, 'twelve', EMAIL, 'example.com', FILE, '.md', 'fs.c', 'threadpool.c']
```

The fixture models sample(1)'s documented format. The QA run (section 7) confirms it against a real
capture. If the real grammar differs, the allowlist fails closed: frames show up as `<redacted>`, never as
leaked text.

### 4.2 `stall-bundle.test.ts` (NEW)

`projectSample`:
1. Keeps each thread's stack as count, symbol, image and offset, main thread first:
   `expect(projectSample(REPORT)).toEqual(EXPECTED)`.
2. Drops the header, thread names, queue labels, source locations, summary sections and Binary Images:
   no `PLANTED` string (case-insensitive) appears in the joined output, and neither does `/`, `\` or `@`.
3. A symbol or image name holding a path, an email, a backslash or a control character becomes
   `<redacted>`, with count and tree kept. Use one line each, including `C:\\Users\\x` and a tab.
4. An unknown frame (`???  [0x…]`) stays `???`. A line outside the frame grammar becomes `<redacted>`,
   never its text.
5. A report without a call graph (sample's error text, an empty string) projects to `[]`.

`collectStallCaptures` (temp userData; write captures into `captureDir(userData)` after
`mkdirSync(..., { recursive: true })`; the bootId is a fixed v4 UUID):
6. A pending capture `<uuid>.1790000000000.23456.sample` becomes `<uuid>.1790000000000.23456.txt`. The
   bundle starts with the five header lines and a blank line, then `EXPECTED`. The capture is gone, the
   outcome is `{kind:'bundled', bootId, stalledMs: 23456, bundle: '<uuid>.1790000000000.23456.txt'}`,
   and the mode is 0600 (POSIX).
7. **Privacy:** the whole bundle file contains no `PLANTED` string and no `/`, `\` or `@`.
8. A capture without a call graph, a capture larger than 16 MiB (`truncateSync` to 16 MiB + 1; sparse,
   so fast) and a directory named like a capture each yield `{kind:'failed', bootId}` and write no
   bundle. The two files are deleted.
9. A file in `raw/` that is not named like a capture is deleted and yields no outcome.
10. With 12 existing bundles (distinct capture times) plus one new capture, exactly `MAX_BUNDLES` remain,
    the newest by capture time. A `notes.txt` in the bundle directory is untouched.
11. A report whose non-main thread precedes a main thread and exceeds `MAX_BUNDLE_BYTES` gives a bundle
    whose stack section begins with `Thread 1 (main)`, ends with `[truncated]`, and, apart from that
    last line, is at most `MAX_BUNDLE_BYTES`.
12. A missing capture directory, or a userData path that is a file, resolves to `[]`.

### 4.3 `stall-sampler.test.ts` (NEW)

Use a fake child: an `EventEmitter` with `stdout = new PassThrough()` and `kill = vi.fn()`. Inject
`deps.spawn` returning it (cast through `unknown`) and `deps.collect` as `vi.fn()`, unless noted.
13. It creates `captureDir` (mode 0700 on POSIX) and spawns `command` once with exactly
    `['stall-watch','--pid',String(process.pid),'--alive',join(userData,'run-alive.json'),'--capture-prefix',join(userData,'diagnostics','stalls','raw',bootId),'--stale-after-ms','20000']`
    for `aliveIntervalMs: 10_000`, with `stdio: ['ignore','pipe','ignore']`.
14. It collects once at start, before any line. An outcome for another bootId is audited as
    `app.stall.sampled` with that bootId.
15. `sampled` written as `'samp'` then `'led\n'` triggers one collection. Each `bundled` outcome is
    audited `app.stall.sampled {bootId, stalledMs, bundle}`.
16. `failed\n` audits `app.stall.sample_failed {bootId: <this boot>, reason:'sample'}` and does not
    collect. Unknown lines are ignored.
17. A `failed` outcome audits `app.stall.sample_failed {bootId: <capture's boot>, reason:'bundle'}`.
18. Collections are serialised. With the first `collect` pending on a deferred promise, a second
    `sampled` does not call `collect` again until the first resolves.
19. `error` then `close` before `stop()` audits `reason:'watcher'` exactly once. So does `close` alone.
20. A userData path that is a file (mkdir fails) spawns nothing and audits `reason:'watcher'` once.
21. `stop()` calls `kill('SIGKILL')` once, even when called twice. A later `close` and later stdout lines
    audit nothing.
22. End to end, with the real collector and a temp userData, the fake helper writes a `REPORT` capture
    for the current bootId and then emits `sampled\n`. After the collection settles there is one bundle
    on disk and one `app.stall.sampled` naming it.

### 4.4 `run-observability.test.ts` (add; existing tests stay unchanged and keep proving INV-9)

23. Given `stallWatchCommand: '/x/metis-mac-helper'`, `deps.startStallSampler` is called once with
    `{command, userData, bootId, aliveIntervalMs: 10_000, audit}`.
24. `shutdownClean` calls the sampler's `stop()` before `clearIntervalFn(aliveTimer)` and before
    `app.shutdown.clean` is audited. Record the order through one shared call log.
25. With `stallWatchCommand` absent, and again with `null`, `startStallSampler` is never called
    (flag off, Windows, no helper).

### 4.5 `mac-helper.test.ts` (add to `describe('macHelperPath / macHelperPresent')`)

26. With `process.platform` forced to `win32` (same try/finally as the stat-flags test at line 107),
    `macStallWatchCommand()` is `null`. This is the "Windows has no sampler" proof.

The `audit-event-coverage` contract test covers the two new events through the `opts.audit('…')` call
sites; nothing to add there.

## 5. What not to do

- No redaction, naming, retention, audit or flag logic in Swift. Swift watches, samples and prints one
  word; every rule lives where CI tests it.
- No `spindump` (it needs root), no `sudo`. Never add `get-task-allow`, loosen the hardened runtime or add
  entitlements to make sampling work. A sample that fails is recorded as `sample_failed` (ChatGPT audit:
  "an inability to sample should be recorded").
- Never signal main (no SIGQUIT, abort or core dump to force a stack). Never sample any pid but the
  helper's own parent.
- Never compare the marker's mtime with a clock, and never read the marker's JSON in Swift.
- No timer, interval or poll in main. No restart loop for the helper.
- Never copy, attach, export or audit a raw capture. Never keep a raw capture after a failed projection.
  Bundles go into the diagnostics export in a follow-up (see 8), not here.
- Keep nothing from the report outside the call-graph allowlist: no header fields, thread names, queue
  labels, Binary Images or source locations. Do not add a user-name denylist: every place a user name can
  occur in sample output is a path, which is already dropped, and a denylist would redact short names
  everywhere.
- No `detached`. Do not route the helper through `supervise` (M2-0028): its `getppid()` check needs main
  as its direct parent.
- No settings key, IPC channel, UI or runtime flag store. No change to `stall-monitor.ts`, `markAlive` or
  `ALIVE_INTERVAL_MS`.
- No source-text regex tests. Do not run tests, `node`, the app or `swiftc` locally (D-28). The only
  local check allowed is `npx tsc --noEmit -p tsconfig.node.json`.
- No Windows code: `macStallWatchCommand()` is already null there.

## 6. Acceptance amendments (for the ledger)

| # | Ticket text | Amended to | Why |
|---|---|---|---|
| A1 | `stall-watch --pid <main> --alive <path>` | `… --capture-prefix <userData>/diagnostics/stalls/raw/<bootId> --stale-after-ms 20000` | Attributes a capture swept at the next launch to the boot that stalled; keeps the threshold next to the heartbeat period it depends on |
| A2 | "more than 10 s stale" | `run-alive.json` unchanged for more than 20 s of awake time (`CLOCK_UPTIME_RAW`) since the helper last saw it change, which means more than 10 s past its 10 s rewrite | A 10 s threshold against a 10 s heartbeat trips on timer jitter (DERIVED: about once an hour), and a wall-clock age reads every sleep as a stall |
| A3 | `/usr/bin/sample <pid> 5` | `/usr/bin/sample <pid> 5 10 -mayDie -file <capture>`, killed after 60 s | 10 ms cuts sampling-induced suspension 10× on a still-running main; `-mayDie` keeps the capture of a force-quit wedge; without `-file`, sample also writes to `/tmp` and stdout |
| A4 | "owned sidecar (in stopAll and the registry)" | Spawned without `detached`, stopped by `observability.shutdownClean` at will-quit, and self-exiting within one 5 s poll of main's death (after an in-flight sample, at most 60 s). stopAll and registry enrolment belong to M2-0026 and M2-0027 when they land | Neither `stopAll()` nor the registry exists on `m2/integration` (M2-0026 IN_PROGRESS, M2-0027 TODO). The `getppid()` exit covers every exit path, including those that never call stopAll |
| A5 | `app.stall.sampled {bootId, stalledMs}` | `{bootId, stalledMs, bundle}` (bundle = file name in `userData/diagnostics/stalls/`), plus `app.stall.sample_failed {bootId, reason: 'sample' \| 'bundle' \| 'watcher'}` | C9 says the event references the bundle; a file name instead of a path keeps every event path-free. C15 requires failures to be audited |
| A6 | (C15) "marker unreadable → audited" | Unreadable marker = no evidence: never sampled, not audited | Main's own marker writes are best-effort and unaudited; auditing the same fs failure from a second process adds a new failure channel for no attribution gain |
| A7 | "the next boot records prevLastAliveAt and the stall window" | No new code. `app.started.prevLastAliveAt` (M2-0006) plus the `app.started` timestamp bound the window; residual: no stacks on Windows | Both fields already ship; the window is derivable |
| A8 | "CPU cost measured in the census" | The QA script prints the helper's `cputime` and `rss` after at least 60 min idle; M2-0009's census adds a `stall-watch` row when it exists | The census tool (M2-0009) is TODO |
| A9 | Verification: "kill -STOP … for 15 s" | `scripts/qa/stall-sampler-check.sh <pid> <userData>` (SIGSTOP for 40 s) | Detection takes up to 30 s at a 20 s threshold with a 5 s poll |
| A10 | Scope paths | + `stall-sampler.ts`, `stall-sampler.test.ts`, `run-observability.ts` (+test), `boot-sentinel.ts` (one export), `mac-helper.ts` (+test), `logger.ts`, `index.ts` (one option), `scripts/qa/stall-sampler-check.sh` | Wiring, the two events and the harness output LIVE_VERIFIED needs |
| A11 | Flag `diagnostics.stall_sampler` | Build-time constant `STALL_SAMPLER_ENABLED` in `mac-helper.ts`; off means `stallWatchCommand` null, proven by test 25 | No runtime flag mechanism exists. A settings key would touch the shared settings schema (a hot file) for a rollback that owner-channel builds already provide |
| A12 | Verification command | `npx vitest run src/main/infra/observability src/main/mac-helper.test.ts`, in CI only | New test files |

## 7. Evidence plan and not-run list

- **LOCALLY_TESTED:**
  - Red run: the skeleton commit, with the new tests failing on behaviour.
  - Green run: Build & Test on the PR head, Quality checks on ubuntu and windows. Windows proves INV-9's
    platform path and the non-POSIX test branches.
  - Compare with the baseline `m2/integration` run 36267674617.
- **LIVE_VERIFIED:** `scripts/qa/stall-sampler-check.sh` output on the QA macOS account, against a
  candidate from the build-once lane (M2-0187), with its sha256 and host identity. Beyond the script, record
  once:
  - a second SIGSTOP within 10 minutes produces no new bundle (cooldown);
  - SIGSTOP of main for 25 s, then `kill -9` of main, then relaunch: the leftover capture becomes a bundle
    whose `app.stall.sampled.bootId` is the previous boot;
  - no TCC prompt appears.
  This stays NOT_RUN until the QA account exists (M2-0007).
- **Not run (state in the PR):**
  - Swift is not compiled in branch CI, because the macOS package job runs only on main, PRs into main or
    dispatch. The first `qa-candidate.yml` build that contains this commit is the compile proof, and it
    is needed for LIVE_VERIFIED anyway.
  - The sample(1) grammar is modelled, not captured (section 4.1).
  - The idle CPU and footprint targets in INV-1 are unmeasured.
- **Commits** (conventional, `[M2-0192]`, bodies explain why):
  1. `test(observability): specify stall capture projection, collection and the sampler protocol [M2-0192]` (red)
  2. `feat(observability): turn stall captures into content-free bundles [M2-0192]`
  3. `feat(observability): run the stall-watch helper for each boot [M2-0192]`
  4. `feat(mac-helper): add the stall-watch mode [M2-0192]`
  5. `test(qa): add the stall sampler QA check [M2-0192]`
- `index.ts` and `main.swift` are merge-queue files (M2-0188). The declared helper order is M2-0027 →
  M2-0191 → M2-0192 → M2-0028. This PR's Swift change is a new MARK section plus one `case`; if M2-0027
  lands first, rebase onto it.

## 8. Residuals and notes for other tickets

- **Stacks are user-space only.** sample(1) shows the blocking syscall's user stub (for example
  `__pread_nocancel`) but not kernel frames such as `apfs_materialize_dataless_file_ext`. JIT frames show
  as `???` or `(in Electron Framework) + 0x…` (offsets are kept, for offline symbolication). For kernel
  frames, the runbook's collection of OS-generated `.spin` reports (C9) remains the complement.
- **Sampler reach is ASSUMED.** `/usr/bin/sample` can read a same-user, hardened-runtime, non-sandboxed
  process without sudo: Activity Monitor's Sample Process does the same. The QA run verifies it. A MAS
  build's helper is sandboxed, and there sample is expected to fail; that is audited once per stall and
  harmless.
- **App Nap is ASSUMED not to delay main's 10 s heartbeat by 10 s or more.** The 60-minute idle phase of
  the QA script is the check. If it fails, the stall monitor's `app.stall` would show the same thing.
- **A sync modal (`showMessageBoxSync`) held open for over 20 s is sampled.** That is correct: JS is
  blocked, and the bundle shows `runModalForWindow`.
- **Accepted race.** An orphaned `sample` from a quit mid-sample can still be writing its capture while
  the next launch sweeps. The result is at most one partial bundle or one `bundle` failure.
- **M2-0026 / M2-0027:** the helper needs no stopAll entry to meet "0 orphans after 10 s" (it self-exits).
  If stopAll wants it explicit, expose the sampler's `stop()` through `RunObservability`. The registry
  may record it like any owned sidecar.
- **M2-0028:** never wrap `stall-watch` in `supervise`.
- **M2-0215 / follow-up:** add `userData/diagnostics/stalls/*.txt` (never `raw/`) to the diagnostics
  export, and count `app.stall.sampled` in the tray diagnostics summary.
- **M2-0199:** a violation's bundle is `userData/diagnostics/stalls/<bundle>` as named by the event.
