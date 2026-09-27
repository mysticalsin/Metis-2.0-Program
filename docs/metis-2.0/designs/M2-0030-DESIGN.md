# M2-0030 design: the storage gateway core

Designer: Opus. Base: `3afebbdf` (= `origin/m2/integration`). Branch: `m2/M2-0030-storage-gateway-core`.
Status: design only. The implementer (Sonnet) follows this file. Line anchors are at `3afebbdf`.

## 0. Why this design, in one paragraph

The freeze root cause is OBSERVED: a main-process timer read a OneDrive dataless file synchronously and the
kernel parked the main thread in `apfs_materialize_dataless_file_ext` for 45-85 s. Moving reads to async
fs is necessary but not enough: async fs runs on the libuv pool (4 threads by default), which is also where
every other async fs call, `dns.lookup` (so all Node `fetch`) and async crypto run. Four blocked reads
pin the whole pool, and a JavaScript timeout cannot cancel a kernel-blocked call. This ticket adds the
module every meetings-root read will go through (M2-0031 and M2-0193 migrate callers). It has five parts:

- `admission.ts`: one global cap of *pool − 2* permits, a permit per fs call that returns only when the
  call settles, metadata ahead of content, and a bounded wait.
- `gateway.ts`: `list`, `classify` and `read`. A read stats the file, asks the M2-0191 detector, and opens
  the file only if its bytes are local. It also enforces deadlines, abort, sharing of in-flight reads, a
  60 s failure memory and root containment.
- `paths.ts`: a pure move of meetings-root resolution out of `transcripts.ts`. The gateway receives the
  root injected.
- `fifo.mjs`: a kernel-blocking FIFO fixture.
- `st-1.mjs`: the packaged stall harness.

The proof is a CI test that reproduces pool starvation with real FIFOs and then shows the gateway
prevents it.

Evidence labels: OBSERVED, DERIVED, ASSUMED, UNKNOWN (AGENTS.md section 4).

## 1. Invariants

**INV-1 (async only, always settles).** The gateway imports only `node:fs/promises`. Every method
resolves and never rejects. Each call settles by its deadline plus scheduling, whatever the fs or the
detector does:
- `list` and `classify`: 2 s.
- `read`: 5 s.

**INV-2 (one cap, permit per call).** At most `max(1, poolSize − 2)` meetings-root fs calls run at once.
- A permit covers exactly one fs call (`stat`, `readdir`, `realpath` or `readFile`) and returns only when
  that call settles, resolved or rejected. A deadline or an abort releases the caller, never the permit
  ("a timeout is not cancellation", ChatGPT fix 6).
- The cap is per gateway instance, so there must be exactly one gateway per process. M2-0031 creates it
  (section 9).

**INV-3 (priority and bounded wait).** A request that finds no free permit waits.
- A returned permit goes to the oldest metadata waiter, else the oldest content waiter.
- A waiter leaves with `'degraded'` when its request deadline passes, and with `'aborted'` when its caller
  aborts. Queued work that leaves never starts.
- `acquire` refuses at once (`'degraded'`) in two cases:
  - `MAX_QUEUED = 4096` requests already wait;
  - every permit is held by a call that has run for `STUCK_AFTER_MS = 2000` or more. This is the
    "cap reached returns degraded immediately" case.

**INV-4 (classify before any read).** Content is read only when the detector answers `local` for the
file's current `(path, mtimeMs, ctimeMs, size)`. `dataless` and `unknown` files are never opened:
neither `realpath` nor `readFile` runs on them. At most one detector probe runs at a time; files asked
about during a probe share the next one.

**INV-5 (containment).**
- Paths are relative to the injected root. An absolute path, a path that normalizes to `..` or climbs
  out, or a path containing NUL is `unavailable/OUTSIDE_ROOT`, and no fs call runs for it.
- `read` resolves symlinks only **after** classification says `local`. On Windows `uv_fs_realpath` opens
  the file (`CreateFileW`), which can recall a `RECALL_ON_OPEN` placeholder. `read` opens the resolved
  path only if it lies inside the resolved root.

**INV-6 (missing is the only deletion signal).** Only `ENOENT` and `ENOTDIR` map to `missing`. Every other
errno maps to `unavailable` with its code. `timeout` and `degraded` say nothing about the file. Callers
must never turn any of these into a deleted meeting (M2-0193 renders them as rows).

**INV-7 (sharing and memory).**
- Concurrent reads of one version share one `readFile` once it is running. A read still waiting for a
  permit is not shared, so one caller's abort can never cancel another caller's read.
- A read that ended `dataless`, `unknown`, `unavailable` or `timeout` is answered from memory for 60 s
  without any fs call or probe. `missing`, `degraded`, `aborted` and `ok` are never remembered. The
  gateway caches no content.

**INV-8 (content-free logs).** The admission logs one `mainLog.warn` when it starts refusing because every
permit is stuck (`{ capacity }`), and one `mainLog.info` when a stuck call settles (`{ degradedMs }`). No
path, file name or content is ever logged. There is no audit event.

**INV-9 (injected root).** `gateway.ts` imports neither `paths.ts`, `electron` nor `transcripts.ts`. The
root arrives as `root: () => string`, called once per request because Settings can move the folder. A
gateway test can reach only the directory it passes in.

## 2. Public API (the target code in section 3 is normative)

```ts
createStorageGateway({ root, detector?, fs?, poolSize? }): StorageGateway
gateway.list(relDir, { signal }?)        → { status: 'ok', names } | StorageFailure
gateway.classify(relPaths, { signal }?)  → Map<rel, { status: 'ok'|'dataless'|'unknown', version } | StorageFailure>
gateway.read(relPath, { signal }?)       → { status: 'ok', version, bytes } | { status: 'dataless'|'unknown', version } | StorageFailure
StorageFailure = missing | unavailable{code} | timeout | degraded | aborted
threadpoolSize(UV_THREADPOOL_SIZE)       → number (libuv's reading, never larger)
```

`classify` stats every path, probes once for the batch, and returns versions for History rows.
Callers that read many files classify first, so each read finds its verdict cached by the detector.

## 3. Code changes per file

Commit order and CI expectations are in section 5.

### 3.1 `src/main/infra/storage/paths.ts` (NEW) and `src/main/transcripts.ts` (pure move, commit 1)

**`paths.ts`** holds the header below, then these imports:
```ts
import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import type { Settings } from '@shared/ipc'
```
After the imports, copy `transcripts.ts` lines **500-595** (from `// detectOneDrive() does a handful of
sync fs calls` through the closing brace of `resolveMeetingsFolder`) **byte for byte**. That block is:
- `_oneDriveCache`;
- `detectOneDrive` and `detectOneDriveUncached`;
- `COPY_FORWARD_MARKER` and `copyForwardLegacyMeetingsOnce`;
- `resolveMeetingsFolder`.

Header:
```ts
/**
 * Where the meetings root is: the folder set in Settings, else `<OneDrive>/Métis Meetings`, else
 * `<Documents>/Métis Meetings` (inside ASKTOTO_USERDATA for physical QA). Only this module decides it.
 * The storage gateway receives the root injected (gateway.ts), so gateway code and its tests never
 * resolve a real OneDrive folder themselves.
 */
```

**`transcripts.ts`:**
- Delete lines 500-595 and one of the two blank lines that then touch.
- Remove the imports that become unused: `copyFileSync` (line 11), `dirname` (line 14) and the whole
  `homedir` import (line 15). Verify with `grep -n 'copyFileSync\|dirname\|homedir'` that nothing else
  uses them.
- Add after the `./logger` import: `import { resolveMeetingsFolder } from './infra/storage/paths'`. It
  keeps `ensureMeetingsFolder`, `appendDebrief`, `clearDraftTranscript` and `recoverOrphanDrafts`
  working.
- Where the block was, add:
  ```ts
  // The meetings root is resolved in infra/storage/paths.ts; re-exported for this module's importers.
  export { detectOneDrive } from './infra/storage/paths'
  export { resolveMeetingsFolder }
  ```

Why a re-export and not 20 import swaps: 7 production modules, 3 test files and a `vi.mock('./transcripts')`
factory (selftest.test.ts) import these names from `./transcripts`. Callers change their import when they
move onto the gateway (M2-0031, M2-0193). The re-export keeps this commit a two-file pure move that
`git show --color-moved=dimmed-zebra` shows as moved.

Behaviour is unchanged, including the sync fs in `copyForwardLegacyMeetingsOnce`. That call runs once
per profile and is listed by M2-0031's sync-fs inventory.

### 3.2 `src/main/infra/storage/admission.ts` (NEW): target code

```ts
/**
 * Admission for meetings-root fs calls: one cap, two priority lanes and a bounded wait.
 *
 * A read of a cloud-only file can hold its libuv pool thread in the kernel for minutes, and no JavaScript
 * can cancel it. So a permit covers exactly one fs call and comes back only when that call settles;
 * callers give up on their own (deadline or abort) without taking the permit with them.
 *
 * Invariants:
 *   - At most `capacity` permits are out. While a permit is free, nobody waits.
 *   - A returned permit goes to the oldest metadata waiter, else the oldest content waiter, else back to
 *     the free count. Metadata calls are short and drive listings and degraded rows.
 *   - Waiting is bounded: a waiter leaves when its signal aborts, and acquire() refuses at once when
 *     MAX_QUEUED requests wait or every permit is held by a call running STUCK_AFTER_MS or more.
 */
import { mainLog } from '../../logger'

export type Lane = 'metadata' | 'content'

/** 'admitted': the caller holds a permit and must hand it to run() or release(). 'refused': no permit can
 *  be promised. 'ended': the caller's signal aborted first. */
export type AcquireResult = 'admitted' | 'refused' | 'ended'

/** Bounds memory, not latency (each caller's deadline bounds latency): far above the files in one listing
 *  of any measured library. */
export const MAX_QUEUED = 4_096
/** A call still running after this long waits on the network or the kernel, not on the disk. */
const STUCK_AFTER_MS = 2_000

export interface Admission {
  acquire(lane: Lane, signal: AbortSignal): Promise<AcquireResult>
  /** Runs `call` under the permit the caller holds; the permit returns when the call settles. */
  run<T>(call: () => Promise<T>): Promise<T>
  /** Returns the permit the caller holds without running anything. */
  release(): void
}

export function createAdmission(capacity: number): Admission {
  let free = capacity
  const running = new Set<{ startedAt: number }>()
  const waiting: Record<Lane, Array<() => void>> = { metadata: [], content: [] }
  /** performance.now() when acquire() first refused because every permit was stuck; null otherwise. */
  let refusingSince: number | null = null

  function everyPermitStuck(): boolean {
    const now = performance.now()
    return running.size >= capacity && [...running].every((call) => now - call.startedAt >= STUCK_AFTER_MS)
  }

  function refuseWhileStuck(): boolean {
    if (!everyPermitStuck()) return false
    if (refusingSince === null) {
      refusingSince = performance.now()
      mainLog.warn('[storage] every permit is held by a stalled call; meetings-root requests are degraded', { capacity })
    }
    return true
  }

  function release(): void {
    const next = waiting.metadata.shift() ?? waiting.content.shift()
    if (next) next()
    else free += 1
  }

  function acquire(lane: Lane, signal: AbortSignal): Promise<AcquireResult> {
    if (signal.aborted) return Promise.resolve('ended')
    if (free > 0) {
      free -= 1
      return Promise.resolve('admitted')
    }
    if (refuseWhileStuck() || waiting.metadata.length + waiting.content.length >= MAX_QUEUED) {
      return Promise.resolve('refused')
    }
    const queue = waiting[lane]
    return new Promise((resolve) => {
      function admit(): void {
        signal.removeEventListener('abort', leave)
        resolve('admitted')
      }
      function leave(): void {
        queue.splice(queue.indexOf(admit), 1)
        resolve('ended')
      }
      queue.push(admit)
      signal.addEventListener('abort', leave, { once: true })
    })
  }

  function run<T>(call: () => Promise<T>): Promise<T> {
    const entry = { startedAt: performance.now() }
    running.add(entry)
    return new Promise<T>((resolve) => resolve(call())).finally(() => {
      running.delete(entry)
      if (refusingSince !== null) {
        mainLog.info('[storage] a stalled call settled; admission resumed', {
          degradedMs: Math.round(performance.now() - refusingSince)
        })
        refusingSince = null
      }
      release()
    })
  }

  return { acquire, run, release }
}
```

Checks the implementer must keep:
- `free > 0` implies an empty queue, because `release()` hands a permit to a waiter before it would
  increment `free`. Do not add an "anyone ahead?" check; it would be dead.
- `new Promise((resolve) => resolve(call()))` turns a synchronous throw into a rejection, so the permit
  still returns.

### 3.3 `src/main/infra/storage/gateway.ts` (NEW): target code

Keep names, constants and comments. The module is about 230 lines. Split a function only if it exceeds
about 25 lines.

```ts
/**
 * Storage gateway: the only way main-process code reads the meetings root, the synced folder (OneDrive or
 * Documents) that holds the meetings and `.brain`.
 *
 * Reading a cloud-only (dataless) file makes the OS download it and blocks the reading thread until the
 * provider answers, for minutes when offline; on the main thread that froze the whole app. Async fs moves
 * the wait onto a libuv pool thread, but the pool is small (UV_THREADPOOL_SIZE, 4 by default) and every
 * async fs call, dns.lookup and async crypto call in the process shares it, so blocked reads must never
 * fill it.
 *
 * Invariants:
 *   - Async only. Every method resolves, never rejects, and settles by its deadline (2 s for list and
 *     classify, 5 s for read) whatever the fs or the probe does.
 *   - At most `poolSize - 2` (at least 1) meetings-root fs calls run at once (admission.ts), so two pool
 *     threads stay free. The cap is per gateway: create one per process and share it.
 *   - A deadline or an abort releases the caller; the fs call keeps its permit until it settles.
 *   - Content is read only after the dataless detector says the bytes are on this device. 'dataless' and
 *     'unknown' files are never opened, and at most one detector probe runs at a time.
 *   - Paths are relative to the injected root and never leave it. A read resolves symlinks only after
 *     classification (on Windows, resolving a path opens the file) and reads the resolved path only if it
 *     lies inside the resolved root.
 *   - Only ENOENT and ENOTDIR are 'missing'. 'unavailable', 'timeout' and 'degraded' say nothing about
 *     whether a file exists; callers must never treat them as a deletion.
 */
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { isAbsolute, join, normalize, relative, sep } from 'node:path'
import { createAdmission, type Lane } from './admission'
import { createDatalessDetector, type ContentPresence, type DatalessDetector, type FileVersion } from './dataless'

/** Threads libuv starts when UV_THREADPOOL_SIZE is unset, and the most it accepts (libuv src/threadpool.c). */
const DEFAULT_POOL_SIZE = 4
const MAX_POOL_SIZE = 1024
/** Pool threads meetings-root calls never occupy, so async userData writes, dns.lookup and async crypto
 *  always find one free (ADR-021). */
const RESERVED_POOL_THREADS = 2
/** stat, readdir and realpath answer from local metadata in microseconds. Also History's degraded-view budget. */
const METADATA_DEADLINE_MS = 2_000
/** A local meeting or `.brain` file (a few MB at most) reads in milliseconds. */
const CONTENT_DEADLINE_MS = 5_000
/** How long a read that returned no content is answered from memory, without touching the file. */
const FAILURE_TTL_MS = 60_000
/** Abort reason of a request's own deadline, which tells it apart from the caller's abort. */
const DEADLINE = Symbol('storage deadline')

/** Why no content or class came back. Only 'missing' says the file does not exist. */
export type StorageFailure =
  | { status: 'missing' }
  | { status: 'unavailable'; code: string }
  | { status: 'timeout' }
  | { status: 'degraded' }
  | { status: 'aborted' }

/** mtime, ctime and size: the version identity the detector keys on (FileVersion in dataless.ts). */
export type ContentVersion = Omit<FileVersion, 'path'>

/** 'ok': the bytes are on this device. 'dataless' | 'unknown': they may not be, so nothing reads them. */
export type FileClass = { status: 'ok' | 'dataless' | 'unknown'; version: ContentVersion } | StorageFailure

export type ReadResult =
  | { status: 'ok'; version: ContentVersion; bytes: Buffer }
  | { status: 'dataless' | 'unknown'; version: ContentVersion }
  | StorageFailure

export type ListResult = { status: 'ok'; names: string[] } | StorageFailure

export interface RequestOptions {
  /** Aborting answers 'aborted' at once; work still waiting for a permit never starts. */
  signal?: AbortSignal
}

export interface StorageGateway {
  /** The entry names of a directory under the root. */
  list(relDir: string, options?: RequestOptions): Promise<ListResult>
  /** Each file's version and class, with one detector probe for the whole batch. Classify a listing before
   *  reading its files, so each read finds its verdict cached. */
  classify(relPaths: readonly string[], options?: RequestOptions): Promise<Map<string, FileClass>>
  /** A file's bytes, read only when they are on this device. Concurrent reads of one version share one fs
   *  call and one buffer: treat it as read-only. */
  read(relPath: string, options?: RequestOptions): Promise<ReadResult>
}

/** The fs calls the gateway makes; each is one libuv pool request. Injectable so tests can hold a call
 *  open the way a kernel-blocked hydration does. */
export interface StorageFs {
  readdir(path: string): Promise<string[]>
  readFile(path: string): Promise<Buffer>
  realpath(path: string): Promise<string>
  stat(path: string): Promise<{ mtimeMs: number; ctimeMs: number; size: number }>
}

export interface StorageGatewayOptions {
  /** The meetings root, called on every request because Settings can move it (infra/storage/paths.ts). */
  root: () => string
  detector?: DatalessDetector
  fs?: StorageFs
  /** The libuv pool size; this process's by default. */
  poolSize?: number
}

type Settled<T> = { status: 'ok'; value: T } | StorageFailure
type Unread = Exclude<ReadResult, { status: 'ok' }>
type PresenceOf = (files: readonly FileVersion[]) => Promise<Map<string, ContentPresence>>

/** Read outcomes that describe the file itself: repeating the read inside the TTL would only pin another
 *  pool thread or spawn another probe. */
const REMEMBERED: ReadonlySet<ReadResult['status']> = new Set<ReadResult['status']>(['dataless', 'unknown', 'unavailable', 'timeout'])

/** The libuv pool size for a UV_THREADPOOL_SIZE value, never above libuv's own reading of it (libuv reads
 *  a negative value as a huge unsigned one; here it counts as 1). */
export function threadpoolSize(value: string | undefined): number {
  if (value === undefined) return DEFAULT_POOL_SIZE
  const size = Number.parseInt(value, 10)
  return size > 0 ? Math.min(size, MAX_POOL_SIZE) : 1
}

function outsideRoot(): StorageFailure {
  return { status: 'unavailable', code: 'OUTSIDE_ROOT' }
}

/** Whether a path relative to some base climbs out of it. */
function leavesBase(rel: string): boolean {
  return rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)
}

/** `relPath` joined under `root`, or null unless it is a plain relative path that stays inside. */
function underRoot(root: string, relPath: string): string | null {
  const normal = normalize(relPath)
  return relPath.includes('\0') || leavesBase(normal) ? null : join(root, normal)
}

function failureOf(error: unknown): StorageFailure {
  const code = (error as NodeJS.ErrnoException | null)?.code
  if (code === 'ENOENT' || code === 'ENOTDIR') return { status: 'missing' }
  return { status: 'unavailable', code: code ?? 'UNKNOWN' }
}

function settle<T>(pending: Promise<T>): Promise<Settled<T>> {
  return pending.then((value): Settled<T> => ({ status: 'ok', value }), failureOf)
}

function versionOf({ mtimeMs, ctimeMs, size }: FileVersion): ContentVersion {
  return { mtimeMs, ctimeMs, size }
}

/** One gateway call: its deadline and the caller's signal, combined. */
interface Request {
  readonly signal: AbortSignal
  /** What the request answers once its signal has aborted, by where it was: waiting (for a permit or the
   *  probe) or running an fs call. */
  ended(phase: 'waiting' | 'running'): StorageFailure
  close(): void
}

function openRequest(deadlineMs: number, caller: AbortSignal | undefined): Request {
  const deadline = new AbortController()
  const timer = setTimeout(() => deadline.abort(DEADLINE), deadlineMs)
  const signal = caller ? AbortSignal.any([deadline.signal, caller]) : deadline.signal
  return {
    signal,
    ended(phase) {
      if (signal.reason !== DEADLINE) return { status: 'aborted' }
      return phase === 'running' ? { status: 'timeout' } : { status: 'degraded' }
    },
    close: () => clearTimeout(timer)
  }
}

/** `pending` (which never rejects), unless the request ends first; the work runs on either way. */
function untilEnded<T>(pending: Promise<T>, request: Request, phase: 'waiting' | 'running'): Promise<T | StorageFailure> {
  if (request.signal.aborted) return Promise.resolve(request.ended(phase))
  return new Promise((resolve) => {
    function end(): void {
      resolve(request.ended(phase))
    }
    request.signal.addEventListener('abort', end, { once: true })
    void pending.then((value) => {
      request.signal.removeEventListener('abort', end)
      resolve(value)
    })
  })
}

/** At most one detector probe runs at a time. Files asked about meanwhile share the next probe, so a burst
 *  of reads of uncached files costs two probes, not one process per file. */
function createPresenceQueue(detector: DatalessDetector): PresenceOf {
  let waiting: Array<{ files: readonly FileVersion[]; resolve: (verdicts: Map<string, ContentPresence>) => void }> = []
  let probing = false

  async function drain(): Promise<void> {
    probing = true
    while (waiting.length > 0) {
      const batch = waiting
      waiting = []
      // classify never rejects (dataless.ts INV-3); the catch keeps this module's never-rejects invariant
      // independent of the injected detector. A file with no verdict counts as unknown.
      const verdicts = await detector
        .classify(batch.flatMap((entry) => entry.files))
        .catch(() => new Map<string, ContentPresence>())
      for (const entry of batch) entry.resolve(verdicts)
    }
    probing = false
  }

  return (files) =>
    new Promise((resolve) => {
      waiting.push({ files, resolve })
      if (!probing) void drain()
    })
}

export function createStorageGateway({
  root,
  detector = createDatalessDetector(),
  fs = { readdir, readFile, realpath, stat },
  poolSize = threadpoolSize(process.env.UV_THREADPOOL_SIZE)
}: StorageGatewayOptions): StorageGateway {
  const admission = createAdmission(Math.max(1, poolSize - RESERVED_POOL_THREADS))
  const presenceOf = createPresenceQueue(detector)
  /** Running content reads, by resolved path and version. */
  const reads = new Map<string, Promise<Settled<Buffer>>>()
  /** Recent reads that returned no content, by path. The TTL is constant, so insertion order is expiry order. */
  const failures = new Map<string, { result: Unread; expiresAt: number }>()
  let resolvedRoot: { root: string; real: string } | undefined

  /** null once the request holds a permit, else why it got none. */
  async function admit(lane: Lane, request: Request): Promise<StorageFailure | null> {
    const acquired = await admission.acquire(lane, request.signal)
    if (acquired === 'refused') return { status: 'degraded' }
    if (acquired === 'ended') return request.ended('waiting')
    if (!request.signal.aborted) return null
    admission.release()
    return request.ended('waiting')
  }

  /** One fs call under admission. */
  async function call<T>(lane: Lane, request: Request, fsCall: () => Promise<T>): Promise<Settled<T>> {
    const refused = await admit(lane, request)
    if (refused) return refused
    return untilEnded(settle(admission.run(fsCall)), request, 'running')
  }

  async function statFile(path: string, request: Request): Promise<Settled<FileVersion>> {
    const stats = await call('metadata', request, () => fs.stat(path))
    if (stats.status !== 'ok') return stats
    const { mtimeMs, ctimeMs, size } = stats.value
    return { status: 'ok', value: { path, mtimeMs, ctimeMs, size } }
  }

  /** The detector's verdicts, or none (every file then counts as unknown) when the request ends first. The
   *  probe runs on, and the detector caches its answer for the next call. */
  async function presenceWithin(files: readonly FileVersion[], request: Request): Promise<Map<string, ContentPresence>> {
    const verdicts = await untilEnded(presenceOf(files), request, 'waiting')
    return verdicts instanceof Map ? verdicts : new Map<string, ContentPresence>()
  }

  async function resolveRoot(base: string, request: Request): Promise<Settled<string>> {
    if (resolvedRoot?.root === base) return { status: 'ok', value: resolvedRoot.real }
    const real = await call('metadata', request, () => fs.realpath(base))
    if (real.status === 'ok') resolvedRoot = { root: base, real: real.value }
    return real
  }

  /** The symlink-free path of `path`, if it lies inside the symlink-free root. */
  async function resolveInside(base: string, path: string, request: Request): Promise<Settled<string>> {
    const realBase = await resolveRoot(base, request)
    if (realBase.status !== 'ok') return realBase
    const real = await call('metadata', request, () => fs.realpath(path))
    if (real.status !== 'ok') return real
    return leavesBase(relative(realBase.value, real.value)) ? outsideRoot() : real
  }

  /** Reads `real` once per version, however many callers ask while that read runs. */
  async function readShared(real: string, version: ContentVersion, request: Request): Promise<Settled<Buffer>> {
    const key = [real, version.mtimeMs, version.ctimeMs, version.size].join('\0')
    const running = reads.get(key)
    if (running) return untilEnded(running, request, 'running')
    const refused = await admit('content', request)
    if (refused) return refused
    const started = reads.get(key) // another caller started this read while this one waited
    if (started) {
      admission.release()
      return untilEnded(started, request, 'running')
    }
    const reading = settle(admission.run(() => fs.readFile(real))).finally(() => reads.delete(key))
    reads.set(key, reading)
    return untilEnded(reading, request, 'running')
  }

  async function readLocal(base: string, path: string, request: Request): Promise<ReadResult> {
    const file = await statFile(path, request)
    if (file.status !== 'ok') return file
    const version = versionOf(file.value)
    const presence = (await presenceWithin([file.value], request)).get(path)
    if (request.signal.aborted) return request.ended('waiting')
    if (presence !== 'local') return { status: presence ?? 'unknown', version }
    const real = await resolveInside(base, path, request)
    if (real.status !== 'ok') return real
    const bytes = await readShared(real.value, version, request)
    return bytes.status === 'ok' ? { status: 'ok', version, bytes: bytes.value } : bytes
  }

  function remember(path: string, result: Unread): void {
    const now = performance.now()
    for (const [key, entry] of failures) {
      if (entry.expiresAt > now) break
      failures.delete(key)
    }
    failures.delete(path)
    failures.set(path, { result, expiresAt: now + FAILURE_TTL_MS })
  }

  return {
    async list(relDir, { signal } = {}) {
      const dir = underRoot(root(), relDir)
      if (!dir) return outsideRoot()
      const request = openRequest(METADATA_DEADLINE_MS, signal)
      try {
        const names = await call('metadata', request, () => fs.readdir(dir))
        return names.status === 'ok' ? { status: 'ok', names: names.value } : names
      } finally {
        request.close()
      }
    },

    async classify(relPaths, { signal } = {}) {
      const base = root()
      const request = openRequest(METADATA_DEADLINE_MS, signal)
      try {
        const stats = await Promise.all(
          relPaths.map(async (rel): Promise<[string, Settled<FileVersion>]> => {
            const path = underRoot(base, rel)
            return [rel, path ? await statFile(path, request) : outsideRoot()]
          })
        )
        const files = stats.flatMap(([, file]) => (file.status === 'ok' ? [file.value] : []))
        const presence = files.length > 0 ? await presenceWithin(files, request) : new Map<string, ContentPresence>()
        return new Map(
          stats.map(([rel, file]): [string, FileClass] => {
            if (file.status !== 'ok') return [rel, file]
            const verdict = presence.get(file.value.path)
            return [rel, { status: verdict === 'local' ? 'ok' : (verdict ?? 'unknown'), version: versionOf(file.value) }]
          })
        )
      } finally {
        request.close()
      }
    },

    async read(relPath, { signal } = {}) {
      const base = root()
      const path = underRoot(base, relPath)
      if (!path) return outsideRoot()
      const remembered = failures.get(path)
      if (remembered && remembered.expiresAt > performance.now()) return remembered.result
      const request = openRequest(CONTENT_DEADLINE_MS, signal)
      try {
        const result = await readLocal(base, path, request)
        if (result.status !== 'ok' && REMEMBERED.has(result.status)) remember(path, result)
        return result
      } finally {
        request.close()
      }
    }
  }
}
```

Checks the implementer must keep:
- **Types.** The default `fs` object (`{ readdir, readFile, realpath, stat }` from `node:fs/promises`) must
  type-check against `StorageFs`. If `@types/node` overloads fight, wrap the offending function in a
  one-line arrow. Do not cast to `any`.
- **Timers.** Deadlines use the global `setTimeout`, not `AbortSignal.timeout()`, so fake timers drive
  them in tests. `AbortSignal.any` exists in Node 22 (CI) and Electron 43.
- **`untilEnded`.** It is only ever given promises that never reject: `settle(...)`, the in-flight map
  entries and `presenceOf`. Keep it that way; a rejecting input would be an unhandled rejection.
- **No duplicate stat.** `classify` and `read` do not stat twice for one path within a call. A later
  `read` stats again (by design): the version must be current when the read starts.

### 3.4 `scripts/qa/fixtures/fifo.mjs` (NEW, commit 2): target code

This fixture is shared by `gateway.test.ts`, ST-1 and M2-0008's repro. It is a library only, with no CLI
and no shebang.

```js
/**
 * Kernel-blocking file fixtures for the storage stall tests: gateway.test.ts, ST-1 (scripts/qa/st-1.mjs)
 * and the freeze repro (M2-0008). POSIX only; Windows has no FIFOs.
 *
 * Opening a FIFO for reading blocks in the kernel until a writer opens it, the way reading a cloud-only
 * file blocks while the provider downloads it: the libuv pool thread running the read stays pinned until
 * the fixture is released. A JavaScript delay cannot stand in for this, because it never occupies a pool
 * thread.
 */
import { execFileSync } from 'node:child_process'
import { closeSync, constants, openSync } from 'node:fs'

/** Creates a FIFO at `path`, readable and writable by the owner only. */
export function createFifo(path) {
  execFileSync('mkfifo', ['-m', '600', path])
}

/**
 * Wakes every reader blocked opening the FIFO at `path`: opens the write end without blocking and closes
 * it, so each waiting read sees end-of-file. Returns whether any reader was waiting (ENXIO: none was).
 * A read queued behind a pinned pool thread opens the FIFO only later, so callers repeat this until their
 * reads settle.
 */
export function releaseFifo(path) {
  let fd
  try {
    fd = openSync(path, constants.O_WRONLY | constants.O_NONBLOCK)
  } catch (error) {
    if (error.code === 'ENXIO') return false
    throw error
  }
  closeSync(fd)
  return true
}
```

### 3.5 `scripts/qa/st-1.mjs` (NEW, commit 4): the packaged stall harness

This is a QA script run on the QA macOS account and the managed Windows laptop, never on an owner
account. It runs no product hooks and needs no compile-time QA flag (PD-23). It measures inside the
packaged main process through Node's inspector (`--inspect`). Import `sha256File` from
`./provenance.mjs` and `createFifo`/`releaseFifo` from `./fixtures/fifo.mjs`. Use Node builtins only
(global `WebSocket`, Node ≥ 22.4). Write it as small named functions, one per step below. Target:
≤ 250 lines.

Usage (header comment):
```
node scripts/qa/st-1.mjs --installer <Metis-QA-<v>.zip | Metis-Setup-<v>.exe> --provenance <provenance.json>
    --fixtures fifo|dataless [--count 6] [--cloud-dir <folder of evicted files>] [--main-log <main.log>]
    [--exe <installed executable>] [--profile-template <userData dir>] [--minutes 5] [--out <report.json>]
```

Steps:
1. **Verify the candidate.**
   - Find the asset whose `name` equals the installer's basename in `provenance.builds[].assets`.
   - Compare its `sha256` with `sha256File(installer)`. A mismatch exits 1.
   - Keep `{ build_run_id: provenance.run.id, artifact_sha256 }` for the report. It is the M2-0002
     evidence binding.
2. **Executable.**
   - `--exe` wins.
   - Otherwise, on darwin with a `.zip`, run `ditto -x -k <zip> <work>`, take the single `*.app` in it,
     and use `<app>/Contents/MacOS/<basename(app, '.app')>`. This is the same derivation as
     check-packaged-launch.mjs.
   - Otherwise exit 2 (usage). Windows needs `--exe`: the installed `Metis.exe` from the verified setup.
3. **Profile.**
   - `mkdtempSync(join(tmpdir(), 'metis-st1-'))`. When `--profile-template` is given, `cpSync` it in
     recursively. The template is the M2-0007 representative profile, with brain work enabled and
     `meetingsFolder` unset.
   - The meetings root is `<profile>/Métis Meetings`, the ASKTOTO_USERDATA default in `paths.ts`.
4. **Fixtures.**
   - `fifo`: refuse on win32 (exit 2). Make `.brain/entities/person` under the root. Create `--count`
     (≥ 3, default 6) FIFOs:
     - `count − 2` meeting files `2026-01-<nn>_090000-st1-fifo.md`;
     - `.brain/index.json`;
     - `.brain/entities/person/st1-fifo.json`.

     `rmSync(path, { force: true })` any existing file of that name first, then `createFifo`.
   - `dataless`: `--cloud-dir` and `--main-log` are required.
     - Remove the fresh root directory and make the root a link to the cloud folder:
       `symlinkSync(cloudDir, root, 'junction')` (a junction on Windows needs no privilege).
     - The fixtures are every top-level `*.md` and every file under `.brain/` in the cloud folder that is
       dataless now:
       - macOS: `stat -f %Uf <file>` has `0x40000000` set;
       - Windows: one `WINDOWS_POWERSHELL`-style `-NoProfile -NonInteractive -Command` run that reads
         `[int][IO.File]::GetAttributes` for paths passed in an env var, with the `0x441000` mask.
     - Zero fixtures exits 2 ("evict files first"). Record `mainLogOffset = size of --main-log` (0 when
       absent).
5. **Launch.**
   - `spawn(exe, ['--inspect=127.0.0.1:0'], { env: { ...process.env, ASKTOTO_USERDATA: profile },
     stdio: ['ignore', 'ignore', 'pipe'], detached: process.platform !== 'win32' })`.
   - Read stderr until `/ws:\/\/127\.0\.0\.1:\d+\/[\w-]+/` matches (60 s budget), then keep draining it.
   - No URL means criterion `inspector` fails, with the message "no main-process inspector: the
     EnableNodeCliInspectArguments fuse may be off" (ASSUMED on today; M2-0008 records the fuse state).
6. **Measure.**
   - Use a ~25-line CDP client: `new WebSocket(url)`, an id → resolver map, and
     `Runtime.evaluate { expression, awaitPromise: true, returnByValue: true }`. Each evaluate has a 1 s
     answer budget; an unanswered one is a late sample.
   - Run `SETUP` once, then `SAMPLE(probeFile)` every 1 s for `--minutes` (default 5), then `SUMMARY`.
     `probeFile` is `join(profile, 'st1-probe.txt')`.
   ```js
   const SETUP = `(() => {
     const { monitorEventLoopDelay } = process.getBuiltinModule('node:perf_hooks')
     globalThis.__st1 = monitorEventLoopDelay({ resolution: 10 })
     globalThis.__st1.enable()
     return process.env.UV_THREADPOOL_SIZE ?? 'default'
   })()`
   const sample = (probeFile) => `(async () => {
     const { writeFile } = process.getBuiltinModule('node:fs/promises')
     const { lookup } = process.getBuiltinModule('node:dns/promises')
     let started = performance.now()
     await writeFile(${JSON.stringify(probeFile)}, String(started))
     const writeMs = performance.now() - started
     started = performance.now()
     await lookup('localhost')
     return { writeMs, lookupMs: performance.now() - started }
   })()`
   const SUMMARY = `({ p99Ms: __st1.percentile(99) / 1e6, maxMs: __st1.max / 1e6 })`
   ```
7. **Exercised evidence.** Collect this after sampling and before stopping the app.
   - `fifo`: `opened = fixtures.filter(releaseFifo).length`, release once. `exercised = opened ≥ 1`
     (the app reached a fixture).
   - `dataless`:
     - `stillDataless`: every fixture is still dataless.
     - `exercised`: the bytes of `--main-log` after `mainLogOffset` contain at least one
       `[dataless] probed` line. That line is M2-0191's per-probe info line.
8. **Stop and clean.**
   - Kill the app: darwin `process.kill(-child.pid, 'SIGKILL')`; win32 `taskkill /pid <pid> /T /F`.
   - For `dataless`, `unlinkSync(root)` **before** `rmSync(profile, { recursive: true, force: true })`,
     so nothing ever recurses into the cloud folder.
   - Remove the unzip dir.
9. **Report.** Print it and write it to `--out`. It is content-free, with no paths other than the
   installer basename:
   ```
   { harness: 'ST-1', row, platform, arch, installer, build_run_id, artifact_sha256, poolSize,
     fixtures, minutes, samples, lateSamples, loop: { p99Ms, maxMs }, write: { maxMs }, lookup: { maxMs },
     exercised, stillDataless?, criteria: [{ name, pass }], verdict }
   ```
   - Criteria: `inspector`, `no-late-samples`, `loop-p99 < 50`, `loop-max < 250`, `async-write < 250`
     (every sample), `dns-lookup < 250` (every sample); for `dataless`, also `still-dataless`.
   - `verdict`: `NOT_EXERCISED` when `exercised` is false, else `PASS` iff every criterion passes, else
     `FAIL`.
   - Exit codes: 0 PASS, 1 FAIL or NOT_EXERCISED, 2 usage.

Why these measurements:
- `settings.json` and `audit.log` are written synchronously today (store.ts:831, logger.ts
  `sync:true`) and never wait on the pool. The pool-bound userData write is an async one, which is what
  `writeSaved`, the run/alive heartbeat and the C3 journal do. OBSERVED in the code.
- M2-0006's `app.stall` fires only at ≥ 1 s late, so "no stall > 250 ms" is measured as the histogram
  max.

### 3.6 `scripts/check-skipped-tests.mjs`

- Add this REASON entry:
  ```js
  {
    match: 'gateway.test.ts',
    why: 'Pins libuv pool threads with real FIFOs, the kernel-blocking stand-in for a cloud-only read. Windows has no FIFOs; the admission, deadline, sharing and dataless rules run on every platform through an in-memory fs whose calls can be held open.'
  },
  ```
- `BASELINE.win32`: 12 → 15 (K0, K1 and K2 skip there). linux and darwin are unchanged. The script is not
  in CI; this keeps its audit truthful (M2-0191 precedent).

### 3.7 Files explicitly NOT changed

- `src/main/index.ts`: nothing to swap yet. The one gateway instance is created by M2-0031, the first
  consumer.
- `src/main/recall.ts` and `src/main/brain/*`: M2-0193 and M2-0031.
- `src/main/infra/storage/dataless.ts`: probe single-flight lives in the gateway's presence queue.
- `src/main/logger.ts`: no audit event.
- `src/shared/*`: no settings key, no flag.
- `.github/workflows/*`, `electron-builder*.yml`, `native/*`, `package.json`.

## 4. Tests: red first, then implementation

D-28: tests run in CI only. New test code must add zero errors to the `check-test-types` ratchet:
- use typed fakes and `vi.mocked(...)`;
- no `any`;
- importing `fifo.mjs` from TS is fine (`allowJs`, `checkJs: false`).

Both files mock the logger and the helper so the import chain (gateway → dataless → mac-helper →
electron) never loads Electron:
```ts
vi.mock('../../logger', () => ({ mainLog: { info: vi.fn(), warn: vi.fn() }, auditLog: vi.fn() }))
vi.mock('../../mac-helper', () => ({ macStatFlagsSpawnSpec: vi.fn(() => null) }))
```
`afterEach`: `vi.useRealTimers(); vi.restoreAllMocks(); vi.clearAllMocks()`.

For fake-timer tests, use `vi.useFakeTimers()`. Vitest 4 fakes `performance` along with the timers. If a
run shows it does not, spy `performance.now` as dataless.test.ts C8 does. To observe a pending promise,
use a `peek` helper: attach a `.then` that records the value, `await vi.advanceTimersByTimeAsync(0)`,
then return the value or `'pending'`.

### 4.1 `src/main/infra/storage/admission.test.ts` (NEW)

| # | Test name (behaviour it proves) |
|---|---|
| AD1 | `grants capacity permits at once, then makes further requests wait` (capacity 2; the 3rd acquire is pending) |
| AD2 | `hands a returned permit to the oldest metadata waiter before any content waiter` (capacity 1; queue content c1, metadata m1, content c2, metadata m2; each `release()` admits m1, m2, c1, c2 in that order) |
| AD3 | `a waiter whose signal aborts leaves at once with 'ended' and never takes the permit` (after the abort, the next waiter gets the released permit) |
| AD4 | `an already-aborted signal is 'ended' and consumes no permit` |
| AD5 | `run() keeps the permit until the call settles, whether it resolves or rejects` (a deferred call; acquire stays pending until the call resolves, then again with a rejection; `run` rejects with the call's own error) |
| AD6 | `refuses at once while every permit is held by a call running 2 s or more, and logs the episode once, content-free` (capacity 2, two never-settling runs; at 1 999 ms acquire queues; at 2 000 ms two acquires are `'refused'`; `mainLog.warn` called once with `{ capacity: 2 }`; settling one run logs `mainLog.info` once with `{ degradedMs: expect.any(Number) }` and admits the waiter queued at 1 999 ms) |
| AD7 | `refuses at once when MAX_QUEUED requests already wait` (capacity 1, hold it, queue `MAX_QUEUED` waiters, then one more is `'refused'`) |

### 4.2 `src/main/infra/storage/gateway.test.ts` (NEW)

**Harness.** `memoryFs(files: Record<string, string>)` is an in-memory `StorageFs` keyed by
`join(ROOT, rel)`:
- `hold(method, rel)` makes the next such call wait until `.release()` or `.fail(code)`.
- `fail(method, rel, code)` makes that call reject with an errno-shaped error.
- `calls` logs every call as `` `${method} ${rel}` ``.
- `inFlight()` counts calls that have started and not yet settled.
- `touch(rel)` bumps mtime and ctime.
- `realpath` returns its input unless a `links` map says otherwise.

The detector fake is a `vi.fn<DatalessDetector['classify']>` answering by basename: `cloud*` →
`dataless`, `odd*` → `unknown`, else `local`. `ROOT = join(sep, 'meetings')`. Use fake timers for every
G/D/F/P test except P2 and P4, which use real temp dirs.

| # | Test name (behaviour it proves) |
|---|---|
| T1 | `threadpoolSize reads UV_THREADPOOL_SIZE the way libuv does, never larger` (undefined→4, '8'→8, '0'→1, 'abc'→1, ''→1, '-3'→1, '2000'→1024, ' 6'→6) |
| G1 | `runs at most poolSize − 2 meetings-root fs calls at once, and at least one` (table 4→2, 6→4, 3→1, 1→1: hold `readFile` for cap+1 files, start cap+1 reads, and `inFlight()` is exactly `cap`; releasing one lets the next read's calls start) |
| G2 | `a deadline answers 'timeout' while the blocked call keeps its permit` (pool 3: hold `readFile a`; at 5 s → `timeout`; `read b` → `degraded` with no `stat b` call; release a, `read c` → `ok`) |
| G3 | `a request that waits past its deadline is 'degraded' and never touches the file` (pool 3: hold `readFile a` fresh; `classify(['b'])` at 2 s → b `degraded`; after releasing a, `calls` never contains `stat b`) |
| G4 | `aborting a waiting request answers 'aborted' at once and its fs call never starts` |
| G5 | `aborting a running read answers 'aborted', and the call keeps its permit until it settles` |
| G6 | `an already-aborted signal answers 'aborted' with no fs call and no probe` |
| D1 | `classify stats every path, probes once for the batch and classes each path` (a, cloud, odd, gone (missing), `../x` → ok/dataless/unknown/missing/unavailable OUTSIDE_ROOT; one detector call with the three FileVersions carrying stat's mtimeMs, ctimeMs and size) |
| D2 | `read never opens a file the detector calls dataless or unknown` (`read('cloud.md')` → `{ status: 'dataless', version }`, `odd.md` → `unknown`; `calls` has no `realpath` or `readFile` for either) |
| D3 | `read returns a local file's bytes and version` |
| D4 | `a burst of reads of uncached files makes at most two probes` (hold the detector's first answer, start 10 reads, then release; 2 detector calls, and the 2nd covers the other 9) |
| D5 | `a probe that does not answer in time leaves files unknown and unread` (detector never settles: `classify` → all `unknown` at 2 s; `read` → `degraded` at 5 s; no `readFile`) |
| D6 | `a rejecting detector leaves files unknown and unread` |
| F1 | `only ENOENT and ENOTDIR are 'missing'; every other failure is 'unavailable' with its code` (at the stat step and at the readFile step: ENOENT, ENOTDIR → missing; EACCES, EPERM, EIO, ETIMEDOUT, EBUSY → unavailable+code; no code → `UNKNOWN`) |
| F2 | `a read that returned dataless, unknown, unavailable or timeout is answered from memory for 60 s, then tried again` (at 59 s: same result, no new fs call and no probe; at 60 s: fs calls again) |
| F3 | `missing, degraded, aborted and ok are never remembered` |
| F4 | `concurrent reads of one unchanged file share one readFile` (hold `readFile a`, 3 reads, 1 call, all get the same bytes; a later read issues a new call) |
| F5 | `a shared read still reaches the other callers when the caller that started it aborts` |
| F6 | `a read of a changed file does not join the read of its previous version` (`touch` between two reads, 2 `readFile` calls) |
| P1 | `rejects paths that leave the root before any fs call` (`../x.md`, `a/../../x.md`, an absolute path, `x\0.md` → OUTSIDE_ROOT; `calls` empty, no probe) |
| P2 | `refuses to read through a link that leaves the root` (real temp dirs `root/` and `outside/secret.md`; `symlinkSync(outside, join(root, 'linked'), 'junction')`; local-answering detector; `read('linked/secret.md')` → `unavailable` OUTSIDE_ROOT, no bytes; runs on every OS) |
| P3 | `resolves the root on every call` (`root()` switches between two roots; each read hits its own) |
| P4 | `list returns a directory's entry names; a missing directory is 'missing'` (real temp dir) |

**Kernel-blocking group K** uses `describe.skipIf(process.platform === 'win32')`, real timers, the
real fs (the gateway default), and `pool = threadpoolSize(process.env.UV_THREADPOOL_SIZE)`.
- Fixtures are made with `createFifo` in a `mkdtempSync(join(tmpdir(), 'gateway-fifo-'))` root.
- `afterEach` calls `releaseFifo` on every fixture and `rmSync`s the dir.
- A helper `releaseUntilSettled(fifos, pending)` runs `releaseFifo` over the fixtures every 10 ms until
  `pending` settles. One pass is not enough: queued reads open their FIFO later.
- Stand-in detectors: `allLocal` and `allDataless`
  (`{ classify: async (files) => new Map(files.map((f) => [f.path, verdict])) }`).

| # | Test name (behaviour it proves) |
|---|---|
| K0 | `the fixture is real: pool + 2 direct reads of FIFOs leave dns.lookup waiting` (plain `readFile` on each FIFO; `lookup('localhost')` has not resolved at 250 ms; `releaseUntilSettled`, then it resolves). This is the characterization that makes K1 non-vacuous. |
| K1 | `through the gateway, six blocked reads leave dns.lookup, an async write and the event loop responsive`. Six FIFOs: 4 meeting `.md`, `.brain/index.json`, `.brain/entities/person/x.json`. Use `allLocal` and `monitorEventLoopDelay({ resolution: 10 })`. Start the 6 reads and wait 100 ms. Then `writeFile` + `rename` in a second temp dir takes < 250 ms, `lookup('localhost')` takes < 250 ms, and p99 is < 50 ms. `releaseUntilSettled`, then all six are `ok` with empty bytes. |
| K2 | `a FIFO the detector calls dataless is answered at once and never opened` (`allDataless`; `read` resolves `dataless` within 1 s without any release, and `releaseFifo(fifo)` returns `false`: no reader ever waited). This is the gateway-level half of the Codex production-path requirement. |

K1 is valid only while `pool > cap` (always true). Six fixtures at the CI default pool of 4 are the
acceptance's "six FIFO fixtures". If CI ever sets `UV_THREADPOOL_SIZE`, K0 scales with it.

## 5. Commits and CI evidence

1. `refactor(storage): move meetings-root resolution to infra/storage/paths [M2-0030]`
   - Files: paths.ts, transcripts.ts.
   - Push. CI must match baseline run 36267674617 job for job.
   - Record the run URL. `npx tsc --noEmit -p tsconfig.node.json` (and `-p tsconfig.web.json`) locally
     first.
2. `test(storage): pin admission and gateway behaviour before the module exists [M2-0030]`
   - Files: admission.test.ts, gateway.test.ts, fifo.mjs.
   - Push. The expected red is `npm run typecheck`'s test-types step (TS2307 for `./admission` and
     `./gateway`). Record the run URL.
3. `fix(storage): add the async storage gateway with one global admission cap [M2-0030]`
   - Files: admission.ts, gateway.ts, check-skipped-tests.mjs.
   - Push. Green is required on Quality (ubuntu, windows), Operator Worker and Security.
   - Grep the ubuntu Quality log to show **K0, K1 and K2 passed** (not skipped). On windows they show
     skipped and everything else passes.
4. `test(qa): add the ST-1 packaged stall harness [M2-0030]`
   - File: st-1.mjs. It runs nowhere in CI; review only. Push; CI stays green.

Compare every run's jobs with baseline 36267674617. A job red there and red here for the same
pre-existing reason is recorded, not fixed. Each commit body explains why and ends with the
`Co-Authored-By` line.

Existing suites that must stay green in CI:
- `dataless.test.ts`, `transcripts.test.ts`, `test-hermetic-home.test.ts`, `update-persistence.test.ts`;
- `selftest.test.ts`, `speaker-session-wiring.test.ts`, `speaker-id-off-switch.test.ts`,
  `recap-status-wiring.test.ts`;
- `diagnostics-export.contract.test.ts`, `audit-event-coverage.contract.test.ts`.

## 6. What NOT to do

**Scope**
- Do not migrate any caller (`recall.ts`, `brain/*`, `transcripts.ts` readers, `index.ts`). Do not create
  a gateway instance anywhere in production code. M2-0031 creates the single instance; M2-0193 moves
  History.
- No `storage.gateway` flag in this ticket (A6).
- No writes through the gateway, no hydrate or explicit-open option (M2-0193), no content cache or LRU
  (M2-0193), and no decoding or decryption in the gateway. Callers decode, and M2-0003's taxonomy stays
  in store.ts.

**Admission and sync fs**
- No `*Sync` call and no `node:fs` (sync) import in `admission.ts` or `gateway.ts`.
- No `Promise.race` timeout that returns a permit, no per-call pool, and no `p-limit` or other
  dependency.
- No unbounded queue.
- Do not pass an `AbortSignal` into `fs.readFile`. The permit must follow the OS call, and one semantics
  is simpler.

**Ordering and containment**
- Never call `realpath` (or anything that opens the file) before the detector says `local`.
- No `blocks`/size heuristics.
- Do not remember `missing` or `degraded`.
- Do not key sharing on the lexical path: key on the resolved path plus version.

**Out-of-scope files**
- Do not change `dataless.ts`, `logger.ts` (no audit event), `src/shared/*`, `.github/workflows/*`,
  `electron-builder*.yml` or Info.plist.
- Do not set or raise `UV_THREADPOOL_SIZE` anywhere (ADR-021).
- Do not change behaviour in the pure move. The copy-forward's sync fs stays, for M2-0031's inventory.

**ST-1 harness**
- No product hook, IPC or build flag. Measure only through `--inspect`.
- Never recurse into the cloud folder when cleaning up.
- Never run it on an owner account.

**D-28 and the public repo**
- Do not run vitest, node scripts, the harness or the app on the owner's Mac. Locally allowed: git, gh,
  reading files, and `npx tsc --noEmit -p tsconfig.node.json` / `-p tsconfig.web.json`.
- No program document (this design, ADR-021, the ledger) in the public repo. No absolute user paths or
  meeting names in code, tests, commits or the PR.

## 7. Acceptance amendments (for the orchestrator to apply to the ledger)

| # | Amendment | Why |
|---|---|---|
| A1 | **Scope.** Add `src/main/infra/storage/admission.ts`, `admission.test.ts`, `src/main/transcripts.ts` (pure move and re-export) and `scripts/check-skipped-tests.mjs`. Drop `src/main/index.ts`: no call site exists until M2-0031. ADR-021 lives in the **private** program repo at `docs/metis-2.0/adr/ADR-021-libuv-pool-admission.md` (text in section 8). | The move must edit transcripts.ts. Admission is a separately tested policy. A gateway instance without a consumer would be dead code. |
| A2 | **Classification.** The gateway's vocabulary is `ok \| dataless \| unknown \| missing \| unavailable \| timeout \| degraded \| aborted`. `corrupt` and `foreign-key` are decode outcomes and stay with the decoders: `classifyIndexBytes` in store.ts and `decodeSavedResult`. | M2-0003 established that a foreign key and damaged ciphertext cannot be told apart. Decoding needs the keychain, which the I/O layer must not own. |
| A3 | **"Cap reached returns degraded immediately"** reads: a free permit runs now. Otherwise the request waits in a bounded queue (4096, metadata first) until its deadline, and then answers `degraded`. It answers `degraded` at once when every permit is held by a call running ≥ 2 s, or when the queue is full. | Without a short wait, a healthy History open + brainStatus poll + ingest (3 callers, cap 2) would degrade spuriously. |
| A4 | **Sharing key** is `(resolved path, mtimeMs, ctimeMs, size)`, the detector's FileVersion identity. Only running reads are shared. | ctime moves on evict and hydrate. Sharing queued work would let one caller's abort cancel another caller's read. |
| A5 | **Failure cache.** Read outcomes `dataless, unknown, unavailable, timeout` are remembered per path for 60 s. `missing, degraded, aborted` are never remembered. | Remembering `degraded` would hide healthy files after a burst. |
| A6 | **Flag `storage.gateway=off`** moves to M2-0031 and M2-0193: each gates its own migrated call sites. | M2-0030 migrates nothing, so the flag would have nothing to gate. |
| A7 | **ST-1.** M2-0030 delivers `fifo.mjs`, `st-1.mjs` (rows `fifo` and `dataless`) and the CI pool-protection proof (K0-K2). The packaged run passes only once the boot, timer and `.brain` readers use the gateway: before M2-0031, boot backfill reads a FIFO meeting file synchronously and freezes main. That run, on the lane candidate that includes M2-0031, is the LIVE evidence for **both** tickets. M2-0030's LIVE_VERIFIED is pending on M2-0031 and the QA account (M2-0007). Criterion wording: "an async userData write (`fs.promises.writeFile`) and a `dns.lookup` each < 250 ms; main event-loop p99 < 50 ms and max < 250 ms, measured in-process through `--inspect`". | settings.json is written synchronously and never waits on the pool. M2-0006's `app.stall` resolution is 1 s. |
| A8 | **ST-1-W:** `st-1.mjs --fixtures dataless` on the managed Windows laptop with OneDrive placeholders and the network off. There are no FIFOs on Windows. It runs after M2-0031, and its result is recorded whatever it is. | |
| A9 | **Codex audit note.** The production-path regression (a seeded cloud-only transcript is never passed to `readSavedFile` or model ingestion) moves to M2-0031 (backfill and extraction) and M2-0193 (list and search). M2-0030 proves the gateway half: D2 on every OS through the call log, and K2 on POSIX with a FIFO that would block if it were opened. | The ticket's split puts those call sites in M2-0031 and M2-0193 (lead note). |
| A10 | **Containment.** Lexical for every call. Realpath for content reads only, and only after classification. | On Windows, realpath opens the file and can recall a `RECALL_ON_OPEN` placeholder. |
| A11 | **ADR-021** is PROPOSED here and becomes ACCEPTED when the measurements in section 8 are recorded. | The packaged pool-size diagnostic is M2-0215's (M2-0006 item 8 moved there). |
| A12 | **Verification** lines: `npx vitest run src/main/infra/storage/admission.test.ts src/main/infra/storage/gateway.test.ts` (CI) and `node scripts/qa/st-1.mjs --installer … --provenance … --fixtures fifo --count 6` plus `--fixtures dataless --cloud-dir … --main-log …` (QA account, candidate including M2-0031). M2-0031's verification line maps to these rows (the `fifo` row is passive and already holds `.brain` fixtures). | |

Gap for the orchestrator: no ticket owns the architecture's `storage.summary` telemetry (per-class counts
per minute). M2-0030 logs only the saturation episode (INV-8).

## 8. ADR-021 text (the orchestrator places it in the program repo)

```markdown
# ADR-021: libuv pool sizing and global storage admission

Status: PROPOSED 2026-09-26 (M2-0030). ACCEPTED once measurements 1-3 below are recorded.

## Context
- Node runs async fs, dns.lookup (getaddrinfo, so every Node fetch), async crypto and zlib on one libuv
  pool per process: UV_THREADPOOL_SIZE threads, 4 when unset. getaddrinfo is libuv "slow I/O" work and
  uses at most (size + 1) / 2 threads. (libuv src/threadpool.c; DERIVED.)
- Reading a cloud-only file blocks its thread in the kernel until the provider answers. OBSERVED on the
  main thread: spindump, 85 s in apfs_materialize_dataless_file_ext. JavaScript cannot cancel that call;
  whether File Provider hydration can be interrupted at all is M2-0008's measurement.
- Four such reads pin the whole default pool, and every async write, DNS lookup and crypto call waits
  behind them. DERIVED; gateway.test.ts K0 reproduces it with FIFOs in CI.
- settings.json and audit.log are written synchronously and never use the pool. The async userData writes
  (writeSaved, run/alive, the C3 journal) and all network calls do.

## Decision
1. One global admission cap on meetings-root fs calls: capacity = max(1, effective pool size - 2).
   Content and metadata are priority lanes under it (metadata first), not separate budgets, because
   stat and readdir on dataless File Provider directories may block too (ASSUMED; M2-0008 records it).
   A permit covers one fs call and returns only when that call settles.
2. The effective pool size is read the way libuv reads UV_THREADPOOL_SIZE: unset → 4; zero, negative or
   non-numeric → 1 (libuv reads a negative value as a huge number; the smaller reading keeps the cap safe);
   above 1024 → 1024.
3. UV_THREADPOOL_SIZE is not raised in 1.9.7. The cap scales with the pool, so raising it keeps the same
   two free threads and only adds healthy-folder throughput, which is not a measured bottleneck (History
   cold list: 8 ms at N=59, 27 ms at N=500; OBSERVED). If raising is ever justified:
   - macOS: Info.plist LSEnvironment applies only to launches through LaunchServices (Finder, Dock, open),
     not to a direct exec.
   - Windows: the variable must be in the environment before the first pool use. Setting process.env in
     the main script is reliable only if nothing used the pool earlier (UNKNOWN), so it needs a launcher
     or a relaunch.
   Record which route is used.

## Measurements (fill in before ACCEPTED)
| # | What | Source | Result |
|---|---|---|---|
| 1 | Effective UV_THREADPOOL_SIZE in the packaged app, macOS and Windows | app.started (M2-0215), or the ST-1 report's poolSize | PENDING |
| 2 | Async userData write and dns.lookup < 250 ms, event-loop p99 < 50 ms and max < 250 ms, with 6 FIFO fixtures and with real dataless files | ST-1 on the lane candidate including M2-0031, QA account | PENDING |
| 3 | The same on Windows with OneDrive placeholders, network off | ST-1-W | PENDING |
| 4 | Pool protection with kernel-blocking FIFOs, unit level | gateway.test.ts K0-K2, ubuntu CI | run URL from M2-0030 |

## Consequences
- + At least two pool threads stay free for async writes, DNS and crypto whatever the cloud does. The main
  thread never waits on meetings-root I/O that goes through the gateway.
- - Healthy-folder throughput is capped at two concurrent fs calls.
- - Every meetings-root caller must migrate (FF-05b). Unmigrated sync readers are M2-0031's.

## Alternatives rejected
- (a) Per-class budgets (2 content + 4 metadata = 6 against a pool of 4): stuck metadata calls alone
  could pin the pool.
- (b) Raise the pool blindly: more threads for the same stuck calls to pin, and no reliable way to set it
  on Windows after start.
- (c) A utilityProcess storage worker now (C10): more moving parts before evidence. It enters 1.9.7
  automatically if row 2 or 3 fails the write or lookup criterion.

## Revisit triggers
ST-1 or ST-1-W fails the write or lookup criterion (→ C10); a measured healthy-folder bottleneck; an
Electron major (libuv change); a File Provider or Cloud Files behaviour change.
```

## 9. Guidance for the consuming tickets (M2-0031, M2-0193)

- **One instance.** Create the gateway once in `index.ts` (later `AppContext`, M2-0060):
  ```ts
  createStorageGateway({ root: () => resolveMeetingsFolder(getSettings()) })
  ```
  Import `resolveMeetingsFolder` from `infra/storage/paths`. Pass the instance to every caller; a second
  instance doubles the cap and breaks INV-2.
- **Bulk reads.** Call `list`, then `classify` the names, then `read` only the `ok` ones. Reading without
  classifying still works, but costs one probe per burst.
- **Rows.** Render `dataless`/`unknown` as "In OneDrive, not downloaded" and
  `unavailable`/`timeout`/`degraded` as "Unavailable". Only `missing` may drop a row (INV-6).
- **Attempts.** `unavailable`, `timeout`, `dataless` and `unknown` do not consume ingest attempts; they
  wait for an availability change.
- **Cancellation.** Pass one `AbortController.signal` per search and abort it when the search is
  superseded; the search's waiting reads leave the queue.
- **Flag and regression tests.** Each ticket adds the `storage.gateway` flag for its own call sites (A6)
  and its production-path regression test (A9).

## 10. Risks and unknowns

- **Pool size (ASSUMED).** Electron 43's main process leaves UV_THREADPOOL_SIZE unset, so the pool is
  4. ADR-021 row 1.
- **Blocking metadata (ASSUMED).** `stat` and `readdir` on dataless File Provider directories can block.
  They are covered by the single cap either way.
- **Windows stat (UNKNOWN).** libuv's Windows `stat` opens a handle with `FILE_READ_ATTRIBUTES`. Whether
  that recalls a placeholder is unknown. This is parity with today's recall.ts, and ST-1-W measures it.
- **Windows cold probe (DERIVED).** A cold PowerShell probe (0.5-1.9 s) plus stats can exceed the 2 s
  classify deadline, so the first History classify on Windows may answer `unknown` for every file. The
  probe runs on and caches, so a re-classify a moment later answers. M2-0193 owns that retry; ST-1-W
  measures it.
- **Inspector fuse (ASSUMED).** `--inspect` works on the packaged candidate because no Electron fuse is
  flipped in this repo (OBSERVED: no `flipFuses`). If a later hardening flips it, ST-1 fails loudly at
  `inspector` and needs a replacement probe.
- **FIFO wake-ups (ASSUMED).** XNU wakes a blocked FIFO reader when a writer opens and closes at once.
  CI is Linux, where the `w_counter` semantics are DERIVED. The macOS harness kills the app rather than
  relying on release, and `releaseUntilSettled` repeats releases anyway.
