# M2-0031 design: the verified stall path's readers move onto the storage gateway

Designer: Opus. Base: `edbd7020` (= `origin/m2/integration`). Branch: `m2/M2-0031-readers-onto-gateway`.
Status: design only. The implementer follows this file; line anchors are at `edbd7020`.
Findings: P7-RANK1, L03-06, B1-RC3 (L03-05 moves to M2-0074, see A10). Kit: M2-DATA-01.

## 0. Why this design, in one paragraph

The spindump (85 s, `CrBrowserMain → uv__run_timers → sync uv_fs_read → apfs_materialize_dataless_file_ext`)
and the audit trail line up with one chain (DERIVED): the 15 s boot timer ran `resumeBackfillIfPending` →
`reconcileMeetingsInBackground` → `catchUpIntelligenceIndexIfNeeded` → `runConsolidationIfDue`, and the
last one called `startBackfill`, which `readdirSync`/`statSync`-scanned the meetings folder, queued jobs and
called `pump()`, whose `runExtractionStage` ran `readSavedFile(job.file)` **synchronously inside the same
timer callback** on a dataless transcript (`brain.consolidation` and 14 `brain.ingest` rows were logged
within about a second of the sampled stall ending; the catch-up log line ended the earlier 5 m 24 s gap).
The same class of read sits behind every `brain:status` poll (RecallView, every 1-5 s) and behind the
ledger (`.brain/index.json`), which on the owner's Mac was mostly cloud-only. This design moves every reader
on that chain onto M2-0030's gateway, **asynchronously and dataless-aware**, without converting the ~150
synchronous entity-reader call sites the merge, lint, ask and correction paths use. Those stay synchronous
(M2-0074), and model-bound work starts only when every file they read is verified local
(`brainInputsLocal`). Four mechanisms, each small:

1. **One Storage per process, a gateway per folder** (`createStorage().at(root)`), sharing one admission
   cap, plus `noteWritten` so reading back our own writes never spawns a probe.
2. **The ledger loads asynchronously** (`ledger.ts`, M2-0003's code moved out of `store.ts`); the
   synchronous `readIndex`/`indexUnavailable` answer from the last load and never touch the disk.
3. **Meeting sources are scanned asynchronously** (`inputs.ts`): one list + one classify per folder, pure
   predicates over the result; cloud-only transcripts are never read and never cost an attempt.
4. **`brain:status` is assembled asynchronously** (`status.ts`) and the boot block, dashboard-open request,
   extraction stage and draft recovery await the gateway.

Evidence labels: OBSERVED, DERIVED, ASSUMED, UNKNOWN.

## 1. Scope decided from evidence

| Reader (edbd7020 anchor) | On the verified chain? | This ticket |
|---|---|---|
| Boot block `index.ts:9388-9448` → resume, reconcile, catch-up, consolidation | yes (OBSERVED timing) | ROUTED |
| `startBackfill` scan `ingest.ts:2541-2720` and the scan helpers `1838-1955` | yes (DERIVED: consolidation → startBackfill) | ROUTED |
| `runExtractionStage` `ingest.ts:1695-1716` (`readSavedFile`, `readMeetingExtraction`) | yes (DERIVED: pump in the timer callback) | ROUTED |
| `brain:status` `index.ts:7962-8023` + `brainStatusCounts` `1136-1155` | yes (RecallView poll, FREEZE-HYPOTHESES rank 1) | ROUTED |
| `requestBackfill` on dashboard open `index.ts:7954` | yes (ticket) | ROUTED |
| `recoverOrphanDrafts` `transcripts.ts:897-969` | boot, launch | ROUTED |
| `updateIndex` lane, `enqueueIngest`, drain/completion scans | reached from all of the above | ROUTED |
| Team transcript folders (same scans, same job reads) | same chain, other roots | ROUTED (shared cap) |
| Merge / lint / replay / corrections journal / publish (sync `readJson`, `listEntities`) | reached after a job extracts | GATED: work starts only when these files are local; conversion is M2-0074 |
| History list/search/read and the catch-up's `listMeetingsNeedingRecap` (`recall.ts`, async fs, no gateway) | pool, not main | M2-0193 (depends on this ticket) |
| Ask path, dashboard `brainRead`, entity names, attention, correction IPC, graph auto-rebuild | IPC, not the verified chain | DEFERRED with owners (Appendix A, §9) |

The lead note's "History/recall listing and reads" is M2-0193's by the ticket split (PLAN: 0193 depends on
0031). What this ticket covers on History open is the `brain:status` poll and the dashboard-open backfill.

## 2. Invariants

**INV-1 (no synchronous meetings-root read on the migrated paths).** None of the migrated readers makes a
synchronous fs call on a file or directory it reads. They read only through a gateway of the process
Storage, and they read a file's bytes only when the gateway classified them local or this process wrote that
exact version. A behaviour test per reader proves both (§5.2).

**INV-2 (one cap).** The process has exactly one `Storage` (`infra/storage/meetings-storage.ts`). Every
folder (meetings root, each team folder) is reached through `storageAt(folder)`; all of them share one
admission cap, one probe queue, one running-read map and one failure memory (ADR-021 unchanged).

**INV-3 (ledger, M2-0003 preserved).** INV-1..3 of the M2-0003 design hold verbatim: index.json is renamed or
overwritten only when this process decoded its current bytes or no file exists; unusable bytes leave the
session read-only (`readIndex` = empty stand-in, `writeIndex` throws, `updateIndex` drops, `startBackfill`
and `enqueueIngest` queue nothing); only decoded-but-invalid bytes are set aside, capped at 5. New cause:
`'cloud-only'` (the gateway says dataless or unknown for a version whose content this process never decoded).

**INV-4 (sync accessors answer from memory).** `readIndex`, `indexUnavailable` (ledger), `lastIndexedAt`
(intelligence state) and `pausedForCloudOnlyInputs` never touch the disk. They answer the last asynchronous
load. Before the first load of a folder, `indexUnavailable` is `'io'` and `readIndex` is the empty stand-in,
so a caller that forgot to load is read-only, never destructive. Every code path that decides to queue,
write or replay loads first, and re-checks `indexUnavailable` after its last `await`.

**INV-5 (content identity vs availability).** Content identity is `(mtimeMs, size)` (M2-0003's key). A
decoded outcome (`ready`, `undecryptable`, `unsupported`, `corrupt-kept`) holds while identity holds, even if
the file has since been evicted: those bytes are in memory. Availability outcomes (`io`, `cloud-only`) are
never memoized as content; each load re-asks the gateway (whose 60 s failure memory bounds the cost). ctime
is never part of content identity; it only moves the detector's presence cache.

**INV-6 (not on this device is not an attempt).** A transcript classified cloud-only or unreadable is not
queued. A job whose read finds its transcript not on this device (dataless, unknown, unavailable, timeout,
degraded) leaves the ledger record exactly as it was: no attempt, no error, no `retryAfter`, no `exhausted`.
Only `missing` keeps today's failure path. Unavailable is never treated as deleted (gateway INV-6).

**INV-7 (model work only over local inputs).** `startBackfill`, `enqueueIngest`, the automatic and the
user rebuild, and the rebuild replay start only when `brainInputsLocal(s)` is true: every `.brain` file the
synchronous merge, lint and replay stages read (entities, `graph.json`, the corrections journal and its
conflict copies) is classified local, and, while `publishBrainPages` is on, every meeting transcript is too.
Otherwise they return without work, and `brain:status.error` says why. Nothing hydrates in the background.

**INV-8 (rebuild semantics).** Purge-with-preserve, `replayPending`, `sourceRefreshRequested`, the busy
guards and the replay callback are unchanged, except for four additive points listed in §4.7 (R-a..R-d).

**INV-9 (content-free logs).** New log lines carry counts and statuses only: no path, name or content.

## 3. Public API after this ticket

```ts
// infra/storage/gateway.ts
createStorage({ detector?, fs?, poolSize? }): Storage          // replaces createStorageGateway
storage.at(root: string): StorageGateway                        // same root → same gateway
gateway.list / classify / read                                  // unchanged
gateway.noteWritten(relPath, { signal }?) → { status: 'ok', version } | StorageFailure
// infra/storage/dataless.ts
detector.markLocal(files: readonly FileVersion[]): void
// infra/storage/meetings-storage.ts (NEW)
storageAt(root): StorageGateway;  classifyAll(gateway, relPaths): Promise<Map<rel, FileClass>>
useStorageForTests(options?): void
// brain/ledger.ts (NEW: moved from store.ts, then async)
loadIndex(s): Promise<ResolvedIndex>;  readIndex(s); indexUnavailable(s); writeIndex(s, v)
classifyIndexBytes, indexUnavailableMessage, BrainIndexUnavailableError, INDEX_AUTO_SNAPSHOT_CAP
// brain/store.ts
readBrainFile(s, rel, held?) → BrainFileRead<Held>;  loadJson(s, rel, parse) → JsonLoad<T>
peekJson(s, rel) → T | null | undefined;  listBrainNames(s, relDir) → string[] | null
persistJson(s, rel, value) → ContentIdentity | null;  writeJson (unchanged signature)
// brain/inputs.ts (NEW)
scanMeetingSources(s) → SourceScan;  sourceVersions, hasSourceDrift, hasIncompleteSource, countUnextracted
readSourceText(file);  sourceFileVersion(file);  formatSourceVersion(v)
brainInputsLocal(s, scan?) → boolean;  pausedForCloudOnlyInputs(s) → boolean
// brain/status.ts (NEW)
readBrainStatus(s): Promise<BrainStatus>
// now async: startBackfill, requestBackfill, requestBackfillRun, resumeBackfillIfPending,
//   reconcileMeetingsInBackground, startIntelligencePass, startIntelligenceWork, canConsolidateToday,
//   recordConsolidationPass; new: loadIntelligenceIndexState, readIntelligenceIndexStatus,
//   journalCorruptionBlocked, isJournalFile
// removed: createStorageGateway, readIntelligenceIndexState (sync), intelligenceIndexStatus (sync),
//   countUnextractedMeetings, hasUnextractedMeetings, INDEX_IO_RETRY_MS
```

## 4. Code changes per file

Commit order is §6. "Unchanged" means byte-identical apart from the edits named.

### 4.1 `src/main/infra/storage/gateway.ts`

1. **Header.** Replace the cap bullet with: "At most `poolSize - 2` (at least 1) fs calls run at once across
   every gateway of one Storage (admission.ts), so two pool threads stay free. Create one Storage per process
   (meetings-storage.ts) and reach each folder through `at(root)`." In the read bullet add "…or after this
   process wrote that exact version (`noteWritten`)". Replace "Paths are relative to the injected root" with
   "Paths are relative to the gateway's root". Add `noteWritten` to the 2 s deadline list.
2. **Types.** Delete `StorageGatewayOptions`. Add:
   ```ts
   export interface StorageOptions {
     detector?: DatalessDetector
     fs?: StorageFs
     /** The libuv pool size; this process's by default. */
     poolSize?: number
   }

   export interface Storage {
     /** The gateway over `root`, an absolute folder. Every gateway of one Storage shares its admission cap,
      *  probe queue, running reads and failure memory; asking for a root again returns the same gateway. */
     at(root: string): StorageGateway
   }
   ```
   Add to `StorageGateway`:
   ```ts
   /** Records that this process has just written `relPath`: its current version counts as local, so reading
    *  it back needs no probe, and any remembered read failure for it is forgotten. */
   noteWritten(relPath: string, options?: RequestOptions): Promise<{ status: 'ok'; version: ContentVersion } | StorageFailure>
   ```
3. **Factory.** Rename `createStorageGateway` to `createStorage(options: StorageOptions = {}): Storage`.
   Keep `admission`, `presenceOf`, `reads`, `failures`, `admit`, `call`, `statFile`, `presenceWithin`,
   `readShared` and `remember` at factory level, bodies unchanged. Move `resolveRoot`, `resolveInside`,
   `readLocal` and the four public methods into `function gatewayAt(base: string): StorageGateway`, where
   `base` replaces every `root()` call and `let realRoot: string | undefined` replaces the single-entry
   `resolvedRoot`. Return:
   ```ts
   const gateways = new Map<string, StorageGateway>()
   return {
     at(root) {
       let gateway = gateways.get(root)
       if (!gateway) {
         gateway = gatewayAt(root)
         gateways.set(root, gateway)
       }
       return gateway
     }
   }
   ```
   `noteWritten` inside `gatewayAt`:
   ```ts
   async noteWritten(relPath, { signal } = {}) {
     const path = underRoot(base, relPath)
     if (!path) return outsideRoot()
     failures.delete(path)
     const request = openRequest(METADATA_DEADLINE_MS, signal)
     try {
       const file = await statFile(path, request)
       if (file.status !== 'ok') return file
       detector.markLocal([file.value])
       return { status: 'ok', version: versionOf(file.value) }
     } finally {
       request.close()
     }
   }
   ```
   No other behaviour changes. `realpath` still runs only after classification says local (INV-4/INV-5 of
   M2-0030); a `noteWritten` version counts as a local verdict from the detector.

### 4.2 `src/main/infra/storage/dataless.ts`

- Interface: add
  ```ts
  /** Records `files` as local at their given version without probing: this process has just written them.
   *  Eviction changes ctime, so an evicted file can never answer from this entry. */
  markLocal(files: readonly FileVersion[]): void
  ```
- Implementation in `createDatalessDetector`: `markLocal(files) { for (const file of files) remember(file, 'local') }`.

### 4.3 `src/main/infra/storage/meetings-storage.ts` (NEW): target code

```ts
/**
 * The process's one Storage (ADR-021: one admission cap per process). Main-process code reaches a folder of
 * meetings (the meetings root, a team transcript folder) only through storageAt(folder), naming the folder on
 * every request because Settings can move it.
 */
import type { ContentPresence, DatalessDetector } from './dataless'
import { createStorage, type FileClass, type Storage, type StorageGateway, type StorageOptions } from './gateway'

/** Paths per classify call: far below admission's MAX_QUEUED (4096), so a large folder never degrades itself. */
const CLASSIFY_BATCH = 1_000

let storage: Storage | undefined

export function storageAt(root: string): StorageGateway {
  storage ??= createStorage()
  return storage.at(root)
}

/** Every path's class, in batches. Paths a batch left 'unknown' are asked once more: a cold platform probe can
 *  outlast one classify deadline, and it caches its verdicts for the second ask. */
export async function classifyAll(gateway: StorageGateway, relPaths: readonly string[]): Promise<Map<string, FileClass>> {
  const classes = new Map<string, FileClass>()
  for (let start = 0; start < relPaths.length; start += CLASSIFY_BATCH) {
    const batch = relPaths.slice(start, start + CLASSIFY_BATCH)
    for (const [rel, fileClass] of await gateway.classify(batch)) classes.set(rel, fileClass)
    const unknown = batch.filter((rel) => classes.get(rel)?.status === 'unknown')
    if (unknown.length === 0) continue
    for (const [rel, fileClass] of await gateway.classify(unknown)) classes.set(rel, fileClass)
  }
  return classes
}

const EVERY_FILE_LOCAL: DatalessDetector = {
  classify: async (files) => new Map(files.map((file): [string, ContentPresence] => [file.path, 'local'])),
  markLocal: () => {}
}

/** Test-only: a fresh Storage whose detector and fs the test controls. By default every file is local and the
 *  real fs is used, so a test neither spawns the platform probe (PowerShell on the Windows runner) nor depends
 *  on its timing. */
export function useStorageForTests(options: StorageOptions = {}): void {
  storage = createStorage({ detector: EVERY_FILE_LOCAL, ...options })
}
```

It imports nothing from `electron`, `paths.ts` or the settings store (infra depends on infra only).

### 4.4 `src/main/brain/ledger.ts` (NEW) and `store.ts`, in two commits

**Commit C1, pure move.** Move `store.ts` lines **427-628** (from `// ── Brain index (index.json)` through the
closing brace of `writeIndex`) byte for byte into `ledger.ts`, with the imports it needs
(`readdirSync, readFileSync, renameSync, statSync`, `basename, dirname, join`, `randomBytes`, the brain
schema/types, `decodeSavedResult`, `mainLog, auditLog`, and `brainDir, writeJson` from `./store`). Prefix a
one-line module header: `/** The ingest ledger (.brain/index.json) and its read/replace invariant (M2-0003). */`.
Remove from `store.ts` the imports only that section used. `git mv src/main/brain/store.test.ts
src/main/brain/ledger.test.ts` (it tests only this section) and fix its imports. Point every importer of
`readIndex`, `writeIndex`, `indexUnavailable`, `indexUnavailableMessage`, `classifyIndexBytes`,
`BrainIndexUnavailableError`, `INDEX_AUTO_SNAPSHOT_CAP`, `INDEX_IO_RETRY_MS` at `./ledger` (production:
`ingest.ts`, `index.ts`, `publish.ts`, `attention.ts`; tests per `grep`). Drop `index.ts`'s unused
`writeIndex as writeBrainIndex`. No re-export from `store.ts`: `ledger.ts` imports `store.ts`, never the
reverse (no new cycle for FF-02).

**Commit C5, async.** Replace the moved `IndexCacheEntry`/`indexCache`/`errnoCode`/`ioRetryDue`/
`recordUnavailable`/`setAsideCorruptIndex`/`loadIndex`/`readIndex`/`indexUnavailable`/`writeIndex` with the
target below. `classifyIndexBytes`, `IndexLoad`, `ResolvedIndex`, `BrainIndexUnavailableError` and
`INDEX_AUTO_SNAPSHOT_*` stay. Delete `INDEX_IO_RETRY_MS` (the gateway's failure memory is the one retry clock).

```ts
// Loading goes through the storage gateway (M2-0031): nothing here reads index.json synchronously, and a
// cloud-only index.json is never read. readIndex and indexUnavailable answer from the last load and never
// touch the disk; before the first load of a folder the ledger counts as read-only ('io'). A decoded outcome
// holds while the file's content identity (mtimeMs, size) holds, even after an eviction: those bytes are in
// memory. Availability outcomes ('io', 'cloud-only') are re-evaluated on every load.

/** Causes decided by decoding a version's bytes; they hold while its content identity holds. */
const DECODED_CAUSES: ReadonlySet<IndexUnavailableCause> = new Set(['undecryptable', 'unsupported', 'corrupt-kept'])
const ABSENT: ResolvedIndex = { kind: 'absent' }

type LedgerEntry = { identity: ContentIdentity | null; load: ResolvedIndex }
/** The last load per `.brain` index path. */
const ledger = new Map<string, LedgerEntry>()
/** Bumped by every writeIndex: a load that read older bytes never replaces the entry a write set. */
let writes = 0

function indexPath(s: Settings): string {
  return join(brainDir(s), INDEX_REL)
}

/** The entry's decoded outcome with the content identity it holds for, or undefined when it holds none. */
function decodedHeld(entry: LedgerEntry | undefined): (ContentIdentity & { load: ResolvedIndex }) | undefined {
  if (!entry?.identity) return undefined
  const { load } = entry
  const decoded = load.kind === 'ready' || (load.kind === 'unavailable' && DECODED_CAUSES.has(load.cause))
  return decoded ? { ...entry.identity, load } : undefined
}

function settle(p: string, identity: ContentIdentity | null, load: ResolvedIndex): ResolvedIndex {
  ledger.set(p, { identity, load })
  return load
}

/** Logs and audits a NEW unavailable cause once (not once per poll), then records it. */
function recordUnavailable(
  p: string,
  identity: ContentIdentity | null,
  load: Extract<ResolvedIndex, { kind: 'unavailable' }>
): ResolvedIndex {
  const previous = ledger.get(p)?.load
  if (previous?.kind !== 'unavailable' || previous.cause !== load.cause) {
    mainLog.warn(`[brain] index.json can't be used on this device (${load.cause}${load.detail ? `: ${load.detail}` : ''}) — left untouched; indexing is paused until it can be read`)
    auditLog('brain.index.unavailable', { cause: load.cause })
  }
  return settle(p, identity, load)
}

async function setAsideCorruptIndex(s: Settings): Promise<ResolvedIndex> {
  const listing = await storageAt(resolveMeetingsFolder(s)).list('.brain')
  if (listing.status !== 'ok') return { kind: 'unavailable', cause: 'corrupt-kept', detail: listing.status }
  const kept = listing.names.filter((f) => f.startsWith(INDEX_AUTO_SNAPSHOT_PREFIX)).length
  if (kept >= INDEX_AUTO_SNAPSHOT_CAP) return { kind: 'unavailable', cause: 'corrupt-kept', detail: 'snapshot cap reached' }
  const to = join(brainDir(s), `${INDEX_AUTO_SNAPSHOT_PREFIX}${new Date().toISOString().replace(/[:.]/g, '-')}-${randomBytes(3).toString('hex')}.json`)
  try {
    await rename(indexPath(s), to)
  } catch (e) {
    return { kind: 'unavailable', cause: 'corrupt-kept', detail: (e as NodeJS.ErrnoException).code }
  }
  // (the existing warn + 'brain.index.quarantined' audit, unchanged)
  return ABSENT
}

export async function loadIndex(s: Settings): Promise<ResolvedIndex> {
  const p = indexPath(s)
  const writesBefore = writes
  const file = await readBrainFile(s, INDEX_REL, decodedHeld(ledger.get(p)))
  const written = ledger.get(p)
  if (writes !== writesBefore && written) return written.load
  switch (file.status) {
    case 'unchanged':
      return file.held.load
    case 'missing':
      return settle(p, null, ABSENT)
    case 'cloud-only':
      return recordUnavailable(p, null, { kind: 'unavailable', cause: 'cloud-only' })
    case 'unreadable':
      return recordUnavailable(p, null, { kind: 'unavailable', cause: 'io', detail: file.code })
    case 'ok': {
      const classified = classifyIndexBytes(file.bytes)
      if (classified.kind === 'corrupt') {
        const kept = await setAsideCorruptIndex(s)
        return kept.kind === 'unavailable' ? recordUnavailable(p, file.identity, kept) : settle(p, null, kept)
      }
      if (classified.kind === 'unavailable') return recordUnavailable(p, file.identity, classified)
      return settle(p, classified.kind === 'ready' ? file.identity : null, classified)
    }
  }
}

/** The ledger as of the last load, or the empty stand-in when there is none or it is read-only. Never
 *  touches the disk. Callers clone before mutating: it is the shared loaded object. */
export function readIndex(s: Settings): BrainIndex {
  const load = ledger.get(indexPath(s))?.load
  return load?.kind === 'ready' ? load.index : BrainIndexSchema.parse({})
}

/** Non-null while the last load found index.json unusable here, and 'io' before the first load. */
export function indexUnavailable(s: Settings): IndexUnavailableCause | null {
  const load = ledger.get(indexPath(s))?.load
  if (!load) return 'io'
  return load.kind === 'unavailable' ? load.cause : null
}

/** Fail-closed write: never replaces bytes this process could not fully decode. */
export async function writeIndex(s: Settings, v: BrainIndex): Promise<void> {
  const blocked = indexUnavailable(s)
  if (blocked) throw new BrainIndexUnavailableError(blocked)
  const identity = await persistJson(s, INDEX_REL, v)
  writes += 1
  ledger.set(indexPath(s), { identity, load: { kind: 'ready', index: BrainIndexSchema.parse(JSON.parse(JSON.stringify(v))) } })
}
```

`indexUnavailableMessage` gains the case below (it is also the text `brain:status` shows for cloud-only
merge inputs, so it names files, not only the index):

```ts
case 'cloud-only':
  return 'Some Mantu Intelligence files are in OneDrive but not on this device right now, so Métis ' +
    "won't open them in the background. Nothing was changed. Indexing is paused until the Métis Meetings " +
    'folder is kept on this device (in OneDrive, choose "Always keep on this device").'
```

`purgeBrain` needs no ledger hook: the next load classifies `missing` and settles `absent`, and every
purge caller loads before it decides anything (§4.7, §4.13).

### 4.5 `src/main/brain/store.ts`

- Imports: add `mkdir` from `node:fs/promises`; `storageAt, classifyAll` from
  `../infra/storage/meetings-storage`; `type ContentVersion, type FileClass` from `../infra/storage/gateway`;
  `decodeSaved` from `../transcripts`.
- `ensureDirs` (197-203) becomes async:
  ```ts
  async function ensureDirs(settings: Settings): Promise<void> {
    const root = brainDir(settings)
    const leaves = ['meetings', join('entities', 'person'), join('entities', 'account'), join('entities', 'deal')]
    await Promise.all(leaves.map((leaf) => mkdir(join(root, leaf), { recursive: true })))
  }
  ```
- New, after `readJson` (keep `readJson`'s body; it is the synchronous reader M2-0074 retires):
  ```ts
  /** Content identity of a file version (M2-0003's key): what changes when the bytes change. */
  export type ContentIdentity = Pick<ContentVersion, 'mtimeMs' | 'size'>

  export type BrainFileRead<Held> =
    | { status: 'unchanged'; held: Held }
    | { status: 'ok'; identity: ContentIdentity; bytes: Buffer }
    | { status: 'missing' }
    | { status: 'cloud-only' }
    | { status: 'unreadable'; code: string }

  function identityOf({ mtimeMs, size }: ContentIdentity): ContentIdentity {
    return { mtimeMs, size }
  }

  function failureCode(fileClass: Exclude<FileClass, { version: ContentVersion }>): string {
    return fileClass.status === 'unavailable' ? fileClass.code : fileClass.status
  }

  /** A .brain file through the storage gateway. `held` is what the caller already decoded from some version
   *  (its content identity plus whatever it keeps): while that identity still matches, nothing is read,
   *  whether or not the file is on this device now, and `held` comes back. A file whose bytes may not be
   *  local is never opened. */
  export async function readBrainFile<Held extends ContentIdentity>(s: Settings, rel: string, held?: Held): Promise<BrainFileRead<Held>> {
    const gateway = storageAt(resolveMeetingsFolder(s))
    const path = join('.brain', rel)
    // classify answers every path it is given; an absent entry would mean no answer, i.e. degraded.
    const fileClass = (await classifyAll(gateway, [path])).get(path) ?? { status: 'degraded' as const }
    if (fileClass.status === 'missing') return { status: 'missing' }
    if (!('version' in fileClass)) return { status: 'unreadable', code: failureCode(fileClass) }
    const { mtimeMs, size } = fileClass.version
    if (held && held.mtimeMs === mtimeMs && held.size === size) return { status: 'unchanged', held }
    if (fileClass.status !== 'ok') return { status: 'cloud-only' }
    const read = await gateway.read(path)
    if (read.status === 'ok') return { status: 'ok', identity: identityOf(read.version), bytes: read.bytes }
    if (read.status === 'missing') return { status: 'missing' }
    if (read.status === 'dataless' || read.status === 'unknown') return { status: 'cloud-only' }
    return { status: 'unreadable', code: failureCode(read) }
  }

  export type JsonLoad<T> = { status: 'ok'; value: T | null } | { status: 'unavailable' }

  /** readJson through the storage gateway, sharing its cache. 'unavailable': the file exists but is not
   *  readable on this device right now; callers must not treat that as absent. */
  export async function loadJson<T>(settings: Settings, rel: string, parse: (v: unknown) => T): Promise<JsonLoad<T>> {
    const p = join(brainDir(settings), rel)
    const file = await readBrainFile(settings, rel, jsonCache.get(p))
    if (file.status === 'unchanged') return { status: 'ok', value: file.held.value as T | null }
    if (file.status === 'missing') {
      jsonCache.delete(p)
      return { status: 'ok', value: null }
    }
    if (file.status !== 'ok') return { status: 'unavailable' }
    let value: T | null
    try {
      value = parse(JSON.parse(decodeSaved(file.bytes)))
    } catch {
      value = null
    }
    if (jsonCache.size >= JSON_CACHE_MAX) jsonCache.clear()
    jsonCache.set(p, { ...file.identity, value })
    return { status: 'ok', value }
  }

  /** The value the last read or load of `rel` cached; undefined when none has. Never touches the disk. */
  export function peekJson<T>(settings: Settings, rel: string): T | null | undefined {
    return jsonCache.get(join(brainDir(settings), rel))?.value as T | null | undefined
  }

  /** Entry names of a directory under .brain through the gateway: [] when it does not exist, null when it
   *  could not be listed. */
  export async function listBrainNames(settings: Settings, relDir: string): Promise<string[] | null> {
    const listing = await storageAt(resolveMeetingsFolder(settings)).list(join('.brain', relDir))
    if (listing.status === 'ok') return listing.names
    return listing.status === 'missing' ? [] : null
  }
  ```
- `writeJson` (252-263) becomes a wrapper over `persistJson`:
  ```ts
  /** Writes a .brain JSON file and tells the gateway this version is local. Answers its content identity,
   *  or null when the file could not be stated after the write (the next load then reads it). */
  export async function persistJson(settings: Settings, rel: string, value: unknown): Promise<ContentIdentity | null> {
    await ensureDirs(settings)
    const p = join(brainDir(settings), rel)
    await writeSaved(p, JSON.stringify(value, null, 2), !!settings.encryptTranscripts)
    // (keep the existing comment on invalidating rather than pre-populating)
    jsonCache.delete(p)
    _writeGen += 1
    const noted = await storageAt(resolveMeetingsFolder(settings)).noteWritten(join('.brain', rel))
    return noted.status === 'ok' ? identityOf(noted.version) : null
  }

  export async function writeJson(settings: Settings, rel: string, value: unknown): Promise<void> {
    await persistJson(settings, rel, value)
  }
  ```
- Nothing else in `store.ts` changes (typed accessors, `listEntities`, `listMeetingExtractions`,
  `ensureV1Backup`, `removeMeetingExtraction`, `purgeBrain` stay synchronous; Appendix A).
- FF-04: `store.ts` loses ~200 lines in C1 and gains ~80 in C5; it stays under 800.

### 4.6 `src/main/brain/inputs.ts` (NEW): target code

```ts
/**
 * What the brain may read, as the storage gateway sees it without reading: the meeting transcripts in the
 * meetings root and every team transcript folder, and whether the .brain files the synchronous merge, lint
 * and replay stages read are on this device. Scanning is metadata only (one list and one classify per folder);
 * a transcript is read only through readSourceText, which never opens a cloud-only file.
 */

/** A `.md` transcript directly inside a source folder. `version` is `${round(mtimeMs)}:${size}`, absent when its
 *  metadata could not be read; `local` is the gateway's verdict that its bytes are on this device. */
export interface MeetingSource {
  key: string
  file: string
  source: 'meetings' | 'team'
  label?: string
  version?: string
  local: boolean
}

export interface SourceFolder {
  root: string
  source: 'meetings' | 'team'
  label?: string
  status: 'ok' | 'missing' | 'failed'
  sources: MeetingSource[]
}

/** The meetings root first, then each configured team folder, in Settings order. */
export type SourceScan = readonly SourceFolder[]

export type SourceText = { status: 'ok'; text: string } | { status: 'missing' } | { status: 'not-on-device' }
```

Functions (bodies are short; write them as small named functions):

- `isMeetingTranscriptFile(name)`: moved verbatim from `ingest.ts:1833-1835`.
- `formatSourceVersion({ mtimeMs, size }: ContentIdentity): string` → `` `${Math.round(mtimeMs)}:${size}` ``
  (the exact format `meetingSourceVersion` produced, so existing ledger `sourceVersion`s still match).
- `scanMeetingSources(s)`: folders = `{ root: resolveMeetingsFolder(s), source: 'meetings' }` then, for each
  non-empty `s.teamTranscriptFolders` entry, `{ root, source: 'team', label: basename(root) || 'team' }`;
  `Promise.all(folders.map(scanFolder))`. `scanFolder`: `storageAt(root).list('')`; `missing` → status
  `'missing'`, other failure → `'failed'`, both with no sources; else filter `isMeetingTranscriptFile`,
  `classifyAll` the names, and map each to a `MeetingSource` (key = name for `meetings`,
  `` `team/${label}/${name}` `` for `team`; `file = join(root, name)`; `version` when the class carries one;
  `local = status === 'ok'`). A name whose class is `missing` (deleted between list and stat) is dropped.
- `sourceVersions(scan): Map<string, string> | null`: null when any folder is not `ok` or any source has no
  `version` (today's `currentMeetingSourceVersions` "cannot inspect safely" rule).
- `hasSourceDrift(scan, idx)`: today's `hasMeetingSourceDrift` body over `sourceVersions(scan)`.
- `hasIncompleteSource(scan, idx)`: true when any folder is not `ok` or any source lacks an `ok` record.
- `countUnextracted(scan, idx)`: number of sources in `ok` folders without an `ok` record.
- `readSourceText(file)`: `storageAt(dirname(file)).read(basename(file))`; `ok` → `decodeSaved(bytes)`;
  `missing` → `{ status: 'missing' }`; everything else → `{ status: 'not-on-device' }`. Doc comment:
  "Sources are direct children of their folder (scanMeetingSources lists one level; enqueueIngest joins a
  basename), so dirname is the source's root."
- `sourceFileVersion(file): Promise<ContentIdentity | null>`: `classifyAll(storageAt(dirname(file)),
  [basename(file)])`; the class's version when it has one, else null. Presence is irrelevant here.
- `brainInputsLocal(s, scan?)`: see below; `pausedForCloudOnlyInputs(s)`: sync read of the recorded state.

```ts
const ENTITY_DIRS = [join('entities', 'person'), join('entities', 'account'), join('entities', 'deal')]
/** .brain folders whose last check found a merge input not on this device. */
const pausedFolders = new Set<string>()

/** The .brain files the merge, lint and replay stages still read synchronously (M2-0074 moves them onto the
 *  gateway), relative to the meetings root; null when a folder could not be listed. */
async function mergeInputs(gateway: StorageGateway): Promise<string[] | null> {
  const listings = await Promise.all(['.brain', ...ENTITY_DIRS.map((dir) => join('.brain', dir))].map((dir) => gateway.list(dir)))
  const paths: string[] = []
  for (const [i, listing] of listings.entries()) {
    if (listing.status === 'missing') continue
    if (listing.status !== 'ok') return null
    const dir = i === 0 ? '.brain' : join('.brain', ENTITY_DIRS[i - 1])
    const wanted = i === 0 ? (name: string) => name === 'graph.json' || isJournalFile(name) : (name: string) => name.endsWith('.json')
    for (const name of listing.names) if (wanted(name)) paths.push(join(dir, name))
  }
  return paths
}

/** True only when every file the synchronous brain stages would read is on this device: the merge inputs,
 *  and while publishBrainPages is on (publish.ts reads transcripts synchronously) every transcript. Records
 *  the answer for brain:status and logs when it flips. */
export async function brainInputsLocal(s: Settings, scan?: SourceScan): Promise<boolean> {
  const gateway = storageAt(resolveMeetingsFolder(s))
  const inputs = await mergeInputs(gateway)
  let local = inputs !== null && [...(await classifyAll(gateway, inputs)).values()].every((c) => c.status === 'ok' || c.status === 'missing')
  if (local && s.publishBrainPages) {
    const folders = scan ?? (await scanMeetingSources(s))
    local = folders.every((folder) => folder.status !== 'failed' && folder.sources.every((source) => source.local))
  }
  notePaused(brainDir(s), !local)
  return local
}

function notePaused(folder: string, paused: boolean): void {
  if (paused === pausedFolders.has(folder)) return
  if (paused) {
    pausedFolders.add(folder)
    mainLog.warn('[brain] some Intelligence files are not on this device; model work is paused until they are')
  } else {
    pausedFolders.delete(folder)
    mainLog.info('[brain] Intelligence files are on this device again; model work resumes')
  }
}

export function pausedForCloudOnlyInputs(s: Settings): boolean {
  return pausedFolders.has(brainDir(s))
}
```
(The implementer may restructure `mergeInputs` into two tiny helpers if that reads better; the contract is
what matters: listing failure → not local; legacy `index.corrupt-*` snapshots and `meetings/*.json` are not
inputs.)

### 4.7 `src/main/brain/ingest.ts`

Net effect: no `node:fs` import, no `readSavedFile`, the five scan helpers move out, and the functions below
become async. Keep every comment that still describes behaviour; rewrite the ones that name `readdirSync`,
`statSync` or `setImmediate`.

1. **Imports.** Delete `import { existsSync, readdirSync, statSync } from 'node:fs'` and `readSavedFile`.
   Import `loadIndex, readIndex, writeIndex, indexUnavailable` from `./ledger`; `loadJson` from `./store`;
   `MeetingExtractionSchema` stays; from `./inputs` the scan, predicates, `readSourceText`,
   `sourceFileVersion`, `formatSourceVersion`, `brainInputsLocal`, `isMeetingTranscriptFile`, `type SourceScan`.
2. **Delete** `meetingSourceVersion` (1566-1575), `isMeetingTranscriptFile` (1833-1835),
   `currentMeetingSourceVersions` (1838-1870), `hasMeetingSourceDrift` (1876-1885),
   `countUnextractedMeetings` + `hasUnextractedMeetings` (1894-1919), `hasIncompleteMeetingSource`
   (1921-1940). `hasSavedReconciliationCandidate` (1946-1955) becomes pure:
   `hasSavedReconciliationCandidate(scan, idx, extracted: ReadonlySet<string>)` over the `meetings` folder's
   sources (own meetings only, as today).
3. **`updateIndex` (1343-1367).** The lane body becomes
   ```ts
   const load = await loadIndex(s)
   if (load.kind === 'unavailable') return
   const idx = cloneEntity(readIndex(s))
   mutate(idx)
   await writeIndex(s, idx)
   ```
   (comments kept; "readIndex returns a shared loaded snapshot").
4. **`backfillPreparing` → `backfillScans`.** `let backfillScans = 0` (replacing the flag at 1266) counts
   scans in flight; every read of `backfillPreparing` becomes `backfillScans > 0` (`brainBackfillProgress`
   ~1455, `maybeFinishDrain` 1962, `rebuildWorkBusy` 2257, `requestBackfillRun` finally 2462, `busy()` 2484,
   `requestBackfill` 2767, `reconcileMeetingsInBackground` 2819; `grep` for the rest). Update the comment at
   1262-1265: the scan no longer blocks main; the counter says a scan is in flight.
5. **`ingestExtraction` (1590-1688).** After the two frontmatter reads, ask the gateway once, only when
   something is missing:
   ```ts
   const version = sourceVersion === undefined || !date ? await sourceFileVersion(file) : null
   ```
   Date fallback: `date = version ? new Date(version.mtimeMs).toISOString() : ''` (was `statSync(file).mtime`).
   Ledger write: `const recorded = sourceVersion ?? (version ? formatSourceVersion(version) : undefined)`
   computed before `updateIndex`; the mutator uses `recorded`.
6. **`JobResult` and `runExtractionStage` (1693-1716).**
   ```ts
   type JobResult =
     | { job: Job; s: Settings; ok: true; x: MeetingExtraction; md: string; preparedText?: string }
     | { job: Job; s: Settings; ok: false; error: unknown }
     /** The transcript or its saved extraction is not on this device: not an attempt (INV-6). */
     | { job: Job; s: Settings; ok: false; notOnDevice: true }
   ```
   Body: `const source = await readSourceText(job.file)`; `missing` → `throw new Error('Meeting file not found.')`
   (today's ENOENT failure path, attempt spent); `not-on-device` → `return { job, s, ok: false, notOnDevice: true }`;
   `ok` → `md = source.text`. The reconcile branch: `const saved = await loadJson(s, join('meetings',
   `${extractionSlug(jobKey(job))}.json`), (v) => MeetingExtractionSchema.parse(v))`; `unavailable` →
   `notOnDevice`; a value → today's early return. Everything else unchanged.
7. **`finishJob` (1723-1800).** First statement inside the outer `try`:
   ```ts
   if (!result.ok && 'notOnDevice' in result) {
     failed = true
     completionError('incomplete')
     mainLog.info('[brain] a meeting is not on this device; its ledger record is left as it was')
     return
   }
   ```
   (The outer `finally` still advances progress and marks the observer's source.) In the error path,
   compute `const version = job.sourceVersion ?? formatVersionOrUndefined(await sourceFileVersion(job.file))`
   before `updateIndex`; the mutator uses it.
8. **`maybeFinishBackfill` (1809-1831)** inside its `withEntityLock` body, before the second `updateIndex`:
   `const scan = await scanMeetingSources(sx)`; mutator uses `hasIncompleteSource(scan, i)`.
9. **`maybeFinishDrain` (1959-2002)** inside the `drainTask` IIFE, first line: `const scan = await
   scanMeetingSources(s)`; mutator uses `hasIncompleteSource(scan, idx)`.
10. **`enqueueIngest` (2073-2141).** After `refuseIfDemoTagged`:
    ```ts
    const s = getSettings()
    if ((await loadIndex(s)).kind === 'unavailable') return   // M2-0003 (comment kept)
    if (!(await brainInputsLocal(s))) return                    // INV-7: a later backfill picks it up
    const key = basename(file)
    const version = await sourceFileVersion(file)
    const sourceVersion = version ? formatSourceVersion(version) : undefined
    if (indexUnavailable(s)) return                             // re-check after the awaits (INV-4)
    const previous = readIndex(s).ingested[key]
    ```
    Rest unchanged.
11. **`startReplayBackfill` (2169-2178)** becomes `async`, `return await startBackfill(callback, options)`
    inside the same `try` (the catch still resets `rebuildReplayQueued` and wraps `BackfillScanFailure`).
12. **`performRebuildReplay` (2180-2206).** R-c: first lines
    ```ts
    if ((await loadIndex(s)).kind === 'unavailable' || !(await brainInputsLocal(s))) {
      mainLog.warn('[brain] rebuild replay waits: the ledger or the files it reads are not usable on this device')
      return   // replayPending stays set; the next resume retries
    }
    ```
    Before the final `updateIndex`: `const scan = await scanMeetingSources(s)`; the mutator uses
    `hasSourceDrift(scan, i)`.
13. **`performStartRebuild` (2272-2316).** R-b: after `localOnlyRebuildBlocked`,
    `if (!(await brainInputsLocal(s))) return { queued: 0, error: indexUnavailableMessage('cloud-only') }`;
    then `await loadIndex(s)` before `const before = readIndex(s)`; `const r = await startReplayBackfill(...)`.
14. **`resumeBackfillIfPending` (2383-2405)** → `export async function resumeBackfillIfPending(): Promise<void>`;
    `const load = await loadIndex(s); if (load.kind !== 'ready') return; const idx = load.index`; the two
    `start*` calls are awaited. The outer try/catch stays (it never rejects; say so in the doc comment).
15. **`requestBackfillRun` (2441-2466)** → `async`, returns `Promise<BackfillRun>`. The observer is still
    created synchronously before the first `await`, so a concurrent call coalesces. `run.result = await
    requestBackfill(options)`; `const idx = (await loadIndex(observer.s)).kind === 'ready' ? readIndex(observer.s) : undefined`;
    register the replay drain callback when `idx?.replayPending && !sourceRefreshRunning`.
16. **`maybeCompleteBackfillRun` (2481-2532).** Replace `currentMeetingSourceVersions(observer.s)` with
    `sourceVersions(await scanMeetingSources(observer.s))`, and `readIndex(observer.s)` with
    `(await loadIndex(observer.s), readIndex(observer.s))` written as two statements.
17. **`startBackfill` (2541-2720).** R-d. Becomes a lane wrapper plus two functions:
    ```ts
    let scanLane: Promise<unknown> = Promise.resolve()

    /** Queues every not-yet-ingested local transcript. Scans run one at a time, so a re-entrant call tops up
     *  the queue from the state the previous one left. `onDrained` is registered on every return; a scan
     *  that throws registers nothing (startReplayBackfill resets its replay flag). */
    export function startBackfill(onDrained?: () => void | Promise<void>, options: BackfillStartOptions = {}): Promise<BackfillStartResult> {
      backfillScans += 1
      const run = scanLane.then(async () => {
        const result = await scanAndQueue(options)
        registerDrainCallback(onDrained)
        return result
      })
      scanLane = run.catch(() => {})
      return run.finally(() => {
        backfillScans -= 1
        if (backfillScans === 0 && backfillObserver) backfillObserver.preparing = false
        maybeFinishDrain()
      })
    }
    ```
    `scanAndQueue(options)` = today's body with these edits, in order:
    - `const s = getSettings()`; `if ((await loadIndex(s)).kind === 'unavailable') return { queued: 0 }` (M2-0003
      comment kept);
    - `const scan = await scanMeetingSources(s)`; `if (!(await brainInputsLocal(s, scan))) return { queued: 0 }`;
    - `const extractions = await listBrainNames(s, 'meetings')`; `extractedSlugs` = the `.json` names without
      the extension (null listing handled below);
    - **no `await` after this line.** `if (indexUnavailable(s)) return { queued: 0 }`; `const idx = readIndex(s)`;
    - route/provider lines unchanged; drift check uses `hasSourceDrift(scan, idx)`;
    - `backfillRequested`, `already`, `inFlight`, counter reset unchanged;
    - `if (extractions === null || scan.some((folder) => folder.status === 'failed')) throw new Error('a meetings folder could not be listed')`
      (same point in the sequence where `readdirSync` used to throw);
    - the two loops become **one** loop over `scan.flatMap((folder) => folder.sources)` (own folder first, as
      today). Per source: skip `already`/`inFlight`; `if (!source.local) { notOnDevice += 1; continue }`
      (before `observeSource`); the backoff and exhaustion checks use `source.version`; strategy from
      `extractedSlugs.has(extractionSlug(source.key))`; the job is
      `{ file: source.file, source: source.source, origin: 'backfill', ...(source.source === 'team' ? { key: source.key, label: source.label } : {}), ...(source.version ? { sourceVersion: source.version } : {}), ...strategy, ...route }`
      (own jobs keep `key` undefined, as today);
    - `if (notOnDevice > 0) mainLog.info(`[brain] ${notOnDevice} meetings are not on this device; Intelligence skips them until they are`)`;
    - the final detached update uses `hasIncompleteSource(scan, i)`; delete the trailing
      `registerDrainCallback(onDrained)` (the wrapper does it).
18. **`consumeDailyBackfillRun` (2741-2754)** unchanged (reads the loaded ledger).
19. **`requestBackfill` (2755-2807)** → `export async function requestBackfill(options = {}): Promise<BackfillStartResult>`:
    ```ts
    const s = getSettings()
    if (!hasUsableProvider(s)) {
      const r = await startBackfill(undefined, options)
      if (r.queued === 0 && r.deferred !== 'no-provider' && (await hasUnextracted(s))) return { queued: 0, deferred: 'no-provider' }
      return r
    }
    if (backfillScans > 0 || sourceRefreshRunning || rebuildStarting || rebuildReplayTask) return { queued: 0, preparing: true }
    if (hasActiveBackfill() || backfillLintPending) { /* unchanged MQA-023 block */ }
    if (!options.force) {
      await loadIndex(s)
      if (!consumeDailyBackfillRun(s)) return (await hasUnextracted(s)) ? { queued: 0, preparing: true } : { queued: 0, upToDate: true }
    }
    void startBackfill(undefined, options).catch((error) => {
      // Keep the durable request flag intact so a temporary folder failure resumes on the next launch.
      mainLog.error('[brain] deferred backfill scan failed:', error)
      completionError('scan-failed')
    })
    return { queued: 0, preparing: true }
    ```
    with `async function hasUnextracted(s) { return countUnextracted(await scanMeetingSources(s), readIndex(s)) > 0 }`.
    The `setImmediate`, the manual `backfillPreparing` bookkeeping and the duplicate `backfillRequested`
    write go (the scan counter and `scanAndQueue` own them). Rewrite the doc comment above `todayKey` that
    describes the old deferral ("Schedules the historical-meeting scan after the current IPC turn…") to say
    the scan runs on the gateway and the reply does not wait for it.
20. **`reconcileMeetingsInBackground` (2813-2832)** → `export async function reconcileMeetingsInBackground(): Promise<void>`:
    guard as today (with `backfillScans > 0`); `await loadIndex(s)`; `const idx = readIndex(s)`;
    `const scan = await scanMeetingSources(s)`; drift via `hasSourceDrift(scan, idx)`; candidate via
    `hasSavedReconciliationCandidate(scan, idx, extractedSlugs)` where `extractedSlugs` are the `.json`
    names from `listBrainNames(s, 'meetings')` without the extension (a null listing → no candidate); `await requestBackfill({ respectRetryBackoff: true })`.
    The try/catch stays; document "never rejects".

Rebuild points (INV-8), and only these: **R-a** `startReplayBackfill` awaits the async scan; **R-b** the
user and the source-refresh rebuild refuse up front, before any purge, while inputs are cloud-only; **R-c**
the replay waits (logs, keeps `replayPending`) while the ledger or its inputs are not usable; **R-d** a
scan's drain callback is registered on every non-throwing return, which also closes a path where M2-0003's
gate left `rebuildReplayQueued` stuck for the session.

FF-04: `ingest.ts` must not grow. Moving the scan helpers (~110 lines) out offsets the async plumbing; if the
diff still grows the file, move `hasSavedReconciliationCandidate` to `inputs.ts` too (pass `extractionSlug`).

### 4.8 `src/main/brain/consolidate.ts`

- `readState` → `async function loadState(s, now = Date.now()): Promise<ConsolidateState | null>` over
  `loadJson`; `unavailable` → `null`; absent, corrupt or another day → `emptyState(now)`.
- `canConsolidateToday(s, now): Promise<boolean | null>`: `false` when disabled; `null` when the state is not
  readable on this device; else `passes < max`. Doc: "null: the state file exists but is not readable here".
- `recordConsolidationPass(s, now): Promise<ConsolidateState | null>`: loads; `null` → return `null` without
  writing (never overwrite a state this device could not read).
- `ConsolidationRunResult.reason` gains `'unavailable'`. `runConsolidationIfDue`:
  `const allowed = await canConsolidateToday(s)`; `null` → `{ ran: false, queued: 0, reason: 'unavailable' }`;
  `false` → `'budget-spent'`; `result = await startBackfill()`.

### 4.9 `intelligence-index.ts`, `intelligence-work.ts`, `intelligence-pass.ts`

- `intelligence-index.ts`:
  - Replace `readIntelligenceIndexState` with `loadIntelligenceIndexState(s): Promise<IntelligenceIndexState | null>`
    over `loadJson` (`unavailable` → `null`; absent or corrupt → `{ lastSuccessAt: 0 }`).
  - `lastIndexedAt(s)` stays synchronous and reads `peekJson` (INV-4). `operator-ingest.ts:125` keeps
    working unchanged, now without a disk read.
  - Replace `intelligenceIndexStatus` with `readIntelligenceIndexStatus(s): Promise<{ running: boolean; lastError?: string }>`
    (same body over the loaded state).
  - `runIntelligenceIndex`: first `await loadIntelligenceIndexState(s)` (fresh `lastIndexedAt`); the fallback
    path `await requestBackfillRun({ force: true })`; `recordFailure` loads the state and, when it is `null`,
    logs "could not record the failure: state is not readable on this device" and does not write.
  - `catchUpIntelligenceIndexIfNeeded`: `const state = await loadIntelligenceIndexState(s)`; `null` →
    `{ ran: false, queued: 0, reason: 'unavailable' }` (result union gains `'unavailable'`).
- `intelligence-work.ts`: `backfill(options, beforeComplete): Promise<BackfillRun>`;
  `export async function startIntelligenceWork(deps): Promise<IntelligenceIndexRun>` with
  `const backfill = await deps.backfill({ force: true }, recaps)` (recaps still start first).
- `intelligence-pass.ts`: `export async function startIntelligencePass(): Promise<IntelligencePassStartResult>`,
  `await startBackfill(...)`.

### 4.10 `src/main/brain/corrections.ts`

- Export `isJournalFile(name)`: `name === CORRECTIONS_REL || isConflictCopyName(name)` (the files a replay or
  a conflict merge reads).
- Add
  ```ts
  /** isJournalCorruptionBlocked through the storage gateway, for the polled brain:status. */
  export async function journalCorruptionBlocked(s: Settings): Promise<boolean> {
    const rel = join('.brain', CORRUPTION_LOCK_REL)
    const fileClass = (await storageAt(resolveMeetingsFolder(s)).classify([rel])).get(rel)
    return fileClass !== undefined && 'version' in fileClass
  }
  ```
  Nothing else changes (`readCorrectionsJournalSafe` and the IPC corrections stay synchronous: GATED/DEFERRED).

### 4.11 `src/main/brain/status.ts` (NEW)

Header: "brain:status. RecallView polls it every 1-5 s and the dashboard every few seconds, so it reads the
ledger and .brain only through the storage gateway: never synchronously, never a cloud-only file." Content:

- `brainCounts(s, revision)`: the moved `brainStatusCounts` cache (keyed by folder and revision). On a miss:
  `Promise.all` of three `listBrainNames(s, join('entities', kind))` counts (`.json` names) and
  `loadJson(s, 'graph.json', BrainGraphSchema.parse)`. Any `null`/`unavailable` → return the last complete
  counts for this folder, else zeros, **without caching** (so the next poll retries).
- `export async function readBrainStatus(s: Settings): Promise<BrainStatus>`: `await loadIndex(s)`;
  `const idx = readIndex(s)`; `const unavailable = indexUnavailable(s)`; `Promise.all` of `brainCounts`,
  `readIntelligenceIndexStatus`, `journalCorruptionBlocked`; then the object literal of `index.ts:7989-8022`
  **field for field**, with `lastIndexedAt: lastIndexedAt(s)` and the tail
  ```ts
  ...(unavailable ? { indexUnavailable: unavailable } : {}),
  ...((unavailable ?? (pausedForCloudOnlyInputs(s) ? 'cloud-only' : null)) !== null
    ? { error: indexUnavailableMessage(unavailable ?? 'cloud-only') } : {})
  ```
  (write it as two named consts; the expression above only fixes the semantics). No new `BrainStatus` field.

### 4.12 `src/main/transcripts.ts`

- Extract `function isEncryptedBytes(bytes: Buffer): boolean` from `isEncryptedFile` (329-336) with the same
  comparison; `isEncryptedFile` becomes `try { return isEncryptedBytes(readFileSync(path)) } catch { return false }`.
- `recoverOrphanDrafts` (897-969) reads through the gateway:
  ```ts
  const folder = resolveMeetingsFolder(settings)
  const gateway = storageAt(folder)
  const listing = await gateway.list('')
  if (listing.status !== 'ok') return { recovered }
  const names = new Set(listing.names)
  for (const f of listing.names) {
    if (!f.startsWith('.autosave-draft-') || !f.endsWith('.md')) continue
    const draftPath = join(folder, f)
    try {
      const stampPart = f.slice('.autosave-draft-'.length, -'.md'.length)
      const primaryOut = `${stampPart}-recovered.md`
      if (names.has(primaryOut)) {
        await unlink(draftPath).catch(() => {})   // (existing comment: promoted earlier, only cleanup retried)
        continue
      }
      const draft = await gateway.read(f)
      if (draft.status !== 'ok') continue          // cloud-only, unreadable or gone: left for a later launch
      const wasEncrypted = isEncryptedBytes(draft.bytes)
      const text = decodeSaved(draft.bytes)
      // …promotion unchanged…
      let out = primaryOut
      for (let n = 2; names.has(out); n++) out = `${stampPart}-recovered-${n}.md`
      await writeSaved(join(folder, out), promoted, wasEncrypted)
      names.add(out)
      await unlink(draftPath).catch(() => {})     // (existing comment kept)
      recovered++
      // plaintext index.md row unchanged (appendIndexRow(folder, …, out))
    } catch { /* unchanged */ }
  }
  ```
  Replace the `dirent.isFile()` comment with one line: the gateway reads only inside the meetings root
  (a planted link that leaves it is refused, gateway INV-5), and a directory with a draft name fails to read.
- `appendIndexRow`, `ensureMeetingsFolder` and the save paths stay synchronous (Appendix A, M2-0074).

### 4.13 `src/main/index.ts` (call-site swaps; lands after M2-0030, before M2-0193 and M2-0033)

1. Delete `BrainStatusCounts`, `brainStatusCountsCache` and `brainStatusCounts` (1136-1155).
2. `IPC.brainStatus` (7962): handler `async`; keep `assertBrainReader` and the signed-out literal; the rest is
   `return readBrainStatus(getSettings())`.
3. `IPC.brainOpenDashboard` (7954): `const r = await requestBackfill()`.
4. `IPC.brainRead` (8071): handler `async`; `const s = getSettings(); await loadIndex(s)` before `readBrainIndex(s)`.
5. `IPC.brainAttention` (8274): handler `async`; `const s = getSettings(); await loadIndex(s); return { items: computeAttention(s) }`.
6. Boot block (9396-9446): wrap the body in `void (async () => { … })()`; inside the non-early-death branch
   `await resumeBackfillIfPending()` and `await reconcileMeetingsInBackground()` (both never reject; drop their
   try/catch), `trackTimer(setInterval(() => void reconcileMeetingsInBackground(), BRAIN_RECONCILE_MS))`,
   `await catchUpIntelligenceIndexIfNeeded().catch(…)`, `await runConsolidationIfDue().catch(…)`; the
   `finally` (power-save release, `clearBootWatchOnce('mqa-175')`) stays and now runs after the awaited load
   and scan phase, which is when the synchronous version reached it. Update the MQA-175 comment's "first
   thing after launch that decrypts index.json" wording only if it became false (it did not).
7. Imports: `readBrainStatus` from `./brain/status`; `loadIndex, readIndex as readBrainIndex` from
   `./brain/ledger`; drop what only the moved code used (`indexUnavailable`, `indexUnavailableMessage`,
   `ingestFailureCounts`, `ingestFailureDetails`, `isPendingIngestRecord`, `brainBackfillProgress`,
   `brainLiveIngestProgress`, `isJournalCorruptionBlocked`, `lastIndexedAt`, `intelligenceIndexStatus`,
   `readBrainGraph` if unused), verified with `grep` and `npx tsc --noEmit -p tsconfig.node.json`.

`index.ts` shrinks (FF-04 friendly).

### 4.14 Import-path-only edits

`publish.ts:19` and `attention.ts:4` import `readIndex` from `./ledger`.

### 4.15 `src/shared/brain.ts`

`IndexUnavailableCause` gains `'cloud-only'`; extend its doc comment: "cloud-only: the gateway says the
bytes are not on this device (M2-0031); nothing reads or downloads them in the background." The renderer does
not switch on the cause (OBSERVED: it shows `error`), so no renderer change.

### 4.16 Files explicitly NOT changed

`recall.ts` (M2-0193), `context.ts` and `match-key-cache.ts` (M2-0074), `publish.ts` and `graphify.ts`
reads (P2, §9), `admission.ts`, `paths.ts`, `logger.ts` (no new audit event), `import-job-store.ts`, the
renderer, `.github/workflows/*`, `package.json`. No `UV_THREADPOOL_SIZE` change. No flag (A6).

## 5. Tests, red first

D-28: nothing runs on the owner's Mac. Locally only `npx tsc --noEmit -p tsconfig.node.json` and
`-p tsconfig.web.json`. Everything else is CI (ubuntu + windows Quality, Operator Worker, Security).

### 5.1 Storage (commit C2, red until C3)

`gateway.test.ts`: replace `createStorageGateway({ root: () => R, …rest })` with
`createStorage(rest).at(R)` everywhere (33 sites; a local `gatewayOver(root, options)` helper is fine), and
add `markLocal: vi.fn()` to the three detector fakes. Rewrite `'resolves the root on every call'` as
**S2 `each gateway reads only under its own root`** (two `at()` gateways over ROOT and ROOT2 of one
Storage; `b.md` is `ok` under ROOT2 and `missing` under ROOT). New:
- **S1 `gateways of one Storage share one admission cap across roots`**: pool 4 (cap 2); hold two reads under
  ROOT; a read under ROOT2 does not start (its `readFile` never called) and answers `degraded` at its
  deadline; after release a new ROOT2 read is `ok`.
- **S3 `noteWritten makes that version readable without a probe`**: `noteWritten('a.md')` → `ok` with the
  version; a following `read('a.md')` returns the bytes and the detector's `classify` was never called; after
  `fs.touch('a.md')` a read probes again.
- **S4 `noteWritten forgets a remembered read failure`**: a read answers `dataless` (remembered); after
  `noteWritten`, the next read is `ok` without waiting 60 s.
- **S5 `noteWritten refuses a path outside the root with no fs call`**.

`dataless.test.ts`: **M1 `markLocal answers local for that version without probing, and a new version probes again`**.

### 5.2 One behaviour test per migrated reader (commit C4, red until C7)

New file `src/main/brain/meetings-root-readers.test.ts`. Harness:
- `vi.mock('electron')`; state from `vi.hoisted(() => ({ armed: false, calls: [] as string[], cloud: new Set<string>() }))`.
- `vi.mock('node:fs', …)` wrapping **every** `*Sync` export: record `${name} ${basename(path)}` for each
  string path argument while `armed`; **throw** `Error(`${name} of a cloud-only file`)` when a path's
  basename is in `cloud` (a regression fails loudly instead of hanging).
- `beforeEach`: fresh temp meetings folder (`mkdtempSync`), `setSettings({ meetingsFolder })`, provider env
  vars cleared as in `ingest-backfill.test.ts`, and
  `useStorageForTests({ detector, fs })` where `detector.classify` answers `dataless` for basenames in
  `cloud`, `local` otherwise (`markLocal` no-op), and `fs` is real `node:fs/promises` with `readFile`
  recording `basename(path)` into `reads`.
- `syncCallsOn(...names)` filters the recorded calls to those basenames (fixture names are unique:
  `local-meeting.md`, `cloud-meeting.md`, …). Idle wait = `brainBackfillProgress().running === false` then
  `whenIndexWritesSettle()`.

| # | Test name (exact) | Setup | Assert |
|---|---|---|---|
| R1 | `brain:status reads the ledger, counts and state files through the gateway, never synchronously` | ledger with one ok record, revision 3 (`loadIndex` then `writeIndex`); one person; a graph; intelligence state | status fields; `syncCallsOn('index.json','graph.json','person-a.json','intelligence-index.json','person','.brain')` is empty |
| R1b | `brain:status reports a cloud-only index.json as indexUnavailable 'cloud-only' without reading it` | then rewrite index.json with other bytes (disarmed) and add it to `cloud` | `indexUnavailable === 'cloud-only'`, `error` is the message; `reads` has no `index.json` after the change |
| R1c | `an index.json evicted with unchanged content stays usable from memory` | add index.json to `cloud` without changing it | status is the ledger's; no read of `index.json` |
| R2 | `boot resume scans through the gateway and never opens a cloud-only transcript or spends its attempt` | ledger `backfillRequested: true`; `local-meeting.md` and `cloud-meeting.md` with saved extractions (reconcile strategy, no provider needed); cloud one in `cloud` | after `await resumeBackfillIfPending()` and idle: local one `ok`; cloud one has no record; `reads` lacks it; no sync call on either transcript, the folder or `index.json` |
| R3 | `reconcile detects drift of a cloud-only transcript from metadata alone` | cloud transcript with an ok record whose `sourceVersion` no longer matches | `await reconcileMeetingsInBackground()` → `readIndex(s).sourceRefreshRequested === true`; never read; no sync call on it or the folder |
| R4 | `the launch catch-up skips a pass while its state file is cloud-only` | intelligence state present and in `cloud`; `setIntelligenceIndexWork(spy)` | result `reason: 'unavailable'`; spy not called; state never read |
| R5 | `consolidation skips a pass while its state file is cloud-only` | consolidation enabled; state in `cloud` | `reason: 'unavailable'`; `brainBackfillProgress().total === 0`; never read |
| R6 | `the dashboard-open backfill request lists and classifies without synchronous fs` | as R2 without `backfillRequested` | `await requestBackfill()` and idle: local ingested, cloud not; no sync call on transcripts or folder |
| R7 | `a transcript that is cloud-only when its extraction starts is left pending, not failed` | `cloud-meeting.md` on disk and in `cloud` | `await enqueueIngest(path)` and idle: record `{ ok: false, attempts: 0 }` with no `error`, `retryAfter` or `exhausted`; never read |
| R8 | `draft recovery promotes local drafts and leaves cloud-only drafts unread` | encryption on (no index.md row); one local and one cloud draft | `recovered === 1`; the cloud draft still exists and was never read; no sync call on either draft or the folder |
| R9 | `model work waits while a .brain merge input is cloud-only, and brain:status says so` | one entity file in `cloud`, one local transcript, provider-free reconcile fixture | `await startBackfill()` → `queued: 0`; `readBrainStatus(s).error` is the message; the entity file never read (the trap would throw on a sync read) |

### 5.3 Ledger, store and inputs units

- `ledger.test.ts` (renamed in C1; rewritten in C5 to inject faults through `useStorageForTests({ fs })`
  and `vi.mock('node:fs/promises')` for `rename`): **L1** an I/O failure is `unavailable/io`, logged and
  audited once, and a load after the gateway's 60 s failure memory (fake `performance`) recovers; **L2**
  undecryptable bytes are decoded once while their identity holds; **L3** decoded-corrupt bytes are set aside,
  counting only `index.corrupt-auto-` names from the gateway listing, and at the cap or on a failed rename are
  `corrupt-kept`; **L4** a dataless index.json is `cloud-only` and never read; **L5** evicted with unchanged
  identity stays `ready` with no read; **L6** after `writeIndex` the next `loadIndex` reads nothing (recording
  fs); **L7** a load that read the previous bytes while a `writeIndex` landed returns the written ledger;
  **L8** before any load `readIndex` is the empty stand-in and `indexUnavailable` is `'io'`. Keep the
  `classifyIndexBytes` table tests as they are.
- `store` additions (in `store-durability.test.ts` or a new `brain-files.test.ts`): `loadJson` shares
  `readJson`'s cache; `unavailable` for a cloud-only file with no cached value; `peekJson` never touches fs.
- `inputs.test.ts` (NEW): **I1** `sourceVersions` is null when a folder failed or a source has no version;
  **I2** table for `hasSourceDrift`, `hasIncompleteSource`, `countUnextracted` over constructed scans;
  **I3** `scanMeetingSources` keys own and team sources, marks cloud ones not local, drops a file deleted
  between list and stat; **I4** `brainInputsLocal`: a cloud-only journal conflict copy → false; a cloud-only
  legacy `index.corrupt-*.json` → still true; publish on with a cloud-only transcript → false.

### 5.4 Existing tests to adapt (same commit as the behaviour they cover)

- Every test file that reaches `storageAt` (all of `src/main/brain/*.test.ts`, `mqa-175-brain-index-poison.test.ts`,
  `transcripts.test.ts`, and any file the Windows Quality job shows spawning the probe) calls
  `useStorageForTests()` in `beforeEach`.
- `await` the now-async calls (`startBackfill` 74 sites, `requestBackfillRun` 37, `resumeBackfillIfPending`,
  `reconcileMeetingsInBackground`, `requestBackfill`, `startIntelligencePass`, `canConsolidateToday`,
  `recordConsolidationPass`); `readIntelligenceIndexState` → `loadIntelligenceIndexState`;
  `intelligenceIndexStatus` → `readIntelligenceIndexStatus`; `intelligence-work.test.ts` fakes return
  `Promise<BackfillRun>`.
- A test that plants index.json bytes with `writeFileSync` and then calls a synchronous reader first
  `await loadIndex(s)`. Tests that go through production entry points need nothing extra (they load).
- No assertion is weakened. A test whose meaning changed (the stuck-flag path of R-d) gets its expectation
  corrected with the reason in the commit body.

## 6. Commits and CI evidence

Each push: find the run for HEAD, watch it, compare every job with baseline run 36267674617.

| Commit | Files | Expected CI |
|---|---|---|
| C1 `refactor(brain): move the ledger's read/replace invariant into brain/ledger.ts [M2-0031]` | ledger.ts, store.ts, ledger.test.ts (git mv), importers | equals baseline (pure move; `git show --color-moved=dimmed-zebra`) |
| C2 `test(storage): pin per-folder gateways sharing one cap, noteWritten and markLocal [M2-0031]` | gateway.test.ts, dataless.test.ts | red: typecheck test-types (TS2305/TS2339) |
| C3 `feat(storage): one Storage per process with a gateway per folder; own writes read back without a probe [M2-0031]` | gateway.ts, dataless.ts, meetings-storage.ts | green |
| C4 `test(brain): prove each stall-path reader stays off synchronous fs and never opens a cloud-only file [M2-0031]` | meetings-root-readers.test.ts, inputs.test.ts | red: typecheck (TS2307 `./status`, `./inputs`) |
| C5 `fix(brain): load the ledger, brain state and brain:status through the storage gateway [M2-0031]` | ledger.ts, store.ts, status.ts, consolidate.ts, intelligence-index.ts, corrections.ts, shared/brain.ts, index.ts (1, 2, 4, 5, 7), adapted tests | R1, R1b, R1c, R4, R5 pass; others red |
| C6 `fix(brain): scan and read meeting sources through the storage gateway; model work waits for local inputs [M2-0031]` | inputs.ts, ingest.ts, intelligence-work.ts, intelligence-pass.ts, publish.ts/attention.ts imports, index.ts (3, 6), adapted tests | R2, R3, R6, R7, R9 pass |
| C7 `fix(transcripts): recover orphan drafts through the storage gateway [M2-0031]` | transcripts.ts, transcripts.test.ts | all green on Quality (ubuntu, windows), Operator Worker, Security |

Final evidence: grep the ubuntu and windows Quality logs for R1-R9, S1-S5, M1, L1-L8, I1-I4 **passed**.
PR evidence table lists each run URL. Not-run list: ST-1 `--fixtures fifo` and `--fixtures dataless` (QA
account, M2-0007/0008), ST-1-W (Windows laptop), any local test (D-28).

## 7. What NOT to do

- No synchronous fs call in `ledger.ts`, `inputs.ts`, `status.ts`, `meetings-storage.ts`, and none added
  anywhere else. No `node:fs` (sync) import in the new modules.
- Never read, `realpath` or open a file the gateway calls `dataless` or `unknown`; never hydrate in the
  background; no "retry until downloaded" loop.
- Do not create a second `Storage` (INV-2) or pass an `AbortSignal` into fs; no `Promise.race` timeouts.
- Do not memoize `io` or `cloud-only` as content; do not put ctime into content identity.
- Do not change M2-0003's outcomes, cap, snapshot prefix or legacy-file rule; do not delete or rename legacy
  `index.corrupt-*.json`; do not change `purgeBrain`'s erasure semantics.
- Do not record `unreadable` markers, change attempt accounting or the backoff/exhaustion policy (M2-0033).
- Do not convert `readJson`/typed accessors/`listEntities`, `context.ts`, `match-key-cache.ts`, corrections,
  publish or graphify (M2-0074, P1, P2). Do not touch `recall.ts` (M2-0193).
- No `storage.gateway` flag, no new setting, no new `BrainStatus` field, no renderer change.
- No source-text scanner for `*Sync` calls (FF-05a/FF-05b are M2-0047's single counters).
- No absolute user paths, meeting names or program documents in code, tests, commits or the PR.

## 8. Acceptance amendments (for the lead to apply to the ledger)

| # | Amendment | Why |
|---|---|---|
| A1 | **Scope** add: `src/main/infra/storage/{gateway,dataless,meetings-storage}.ts` (+ tests), `src/main/brain/{ledger,inputs,status}.ts` (+ tests), `src/shared/brain.ts` (one cause value), `publish.ts`/`attention.ts` (import path only), the adapted test files. Drop `match-key-cache.ts` (A10). The inventory lives in the private repo; the lead places Appendix A at `docs/metis-2.0/evidence/sync-fs-inventory.md` after merge, anchors updated to the merge commit. | Per-folder gateways and own-write presence are needed for team folders, per-call Settings and a probe-free ledger lane; the implementer cannot write the private repo. |
| A2 | **Readers**: unchanged list, plus the `updateIndex` lane, `enqueueIngest`, the drain/completion scans and team folders (same chain). "History open" means the `brain:status` poll and the dashboard-open request; History list/search/read and the catch-up's recap listing (`recall.ts`) are M2-0193's. | The ticket split (PLAN: 0193 depends on 0031); the lead note's "History/recall listing" is 0193's scope. |
| A3 | **Inventory** reads: "every sync fs call reachable from main timers or IPC that can resolve under the meetings root or a team folder is listed as ROUTED, GATED (runs only after `brainInputsLocal`), DEFERRED (existing ticket) or UNREACHABLE (with the reason); GATED and DEFERRED rows seed FF-05b". The "test fails on any new *Sync call" is **M2-0047's FF-05a/FF-05b ratchet** (one counter per FF); add `brain/ledger.ts`, `brain/inputs.ts`, `brain/status.ts` to its `MEETINGS_ROOT_READERS`. M2-0047 must be enforced before 1.9.7 ships. | INV-ONE-COUNTER-PER-FF; a second scanner would duplicate FF-05b; the owner bar forbids source-text tests. |
| A4 | **Attempts** reads: "a transcript classified cloud-only or unreadable is not queued; a job whose read finds it not on this device leaves the ledger record unchanged (no attempt, no error); only `missing` keeps the failure path; reconcile, resume, consolidation and the request scan are metadata-only (list + classify)". | Precise, testable (R2, R3, R7). |
| A5 | **ledger_unavailable**: the `deferredReason: 'ledger_unavailable'` audit and the catch-up's recap guard are delivered by M2-0033 (its §3, R7 EX-3), which lands after this ticket in the index.ts order. This ticket makes a dataless/unknown index.json `unavailable/cloud-only` (so M2-0003's gates and M2-0033's reporting fire) and adds INV-7 for cloud-only merge inputs; data health shows both through `brain:status.error`. | Avoids two tickets editing the same guards; M2-0033's design already owns the reason and audit. |
| A6 | **Flag `storage.gateway` dropped** for this ticket. | No flag infrastructure exists (OBSERVED); the "off" state would keep the verified freeze path alive as dead code and double the test matrix; rollback is the build-once candidate lane. If a flag is still wanted, file the flag infrastructure first. |
| A7 | **ST-1** LIVE rows run on the lane candidate that contains **M2-0031 and M2-0193**; M2-0031's LIVE_VERIFIED is recorded from that run. | The boot catch-up's `listMeetingsNeedingRecap` (recall.ts, async fs, no admission) reads the FIFO/dataless meeting fixtures and pins the pool until M2-0193 (DERIVED from the code). |
| A8 | **index.ts**: "call-site swaps only" reads "the brain:status body moves to `brain/status.ts`; the boot block awaits the same steps in the same order; dashboard-open awaits `requestBackfill`; brainRead and attention load the ledger first". Lands 0030 → 0031 → 0193 → 0033 (M2-0188). | The handler body is logic; moving it out is the rule's intent. |
| A9 | **Estimate** 12 h → 18 h (7 commits, ~25 test files adapted). Alternative the lead may choose: split C1-C5 (ledger, status, state files) from C6-C7 (scans, extraction, drafts); the verified chain needs both before ST-1. | Honest sizing. |
| A10 | **Findings**: L03-05 (match-key-cache N+1 stats on the ask path) moves to M2-0074; B1-RC3 needs no code here (reveal paths run once main is not blocked; RC3 itself is refuted to P3). | Neither is on the verified chain. |
| A11 | **Verification**: `npx vitest run src/main/brain src/main/infra/storage src/main/transcripts.test.ts src/main/mqa-175-brain-index-poison.test.ts` (CI), plus the ST-1 rows of A7. | Matches §5. |

## 9. Proposed new tickets (the lead files them with the next free ids)

- **P1 Dashboard and brain IPC reads through the gateway (1.9.7 candidate).** Summary: `brain:read` (polled
  by the dashboard every 3-10 s), `brain:entityNames`, `brain:meetingExtraction`, `brain:attention` and the
  correction handlers read entity files synchronously; a cloud-only entity freezes main while the dashboard
  is open. Acceptance: those handlers read through `loadJson`/`listBrainNames`; cloud-only entities are
  omitted and `brain:status` says so; behaviour test per handler like §5.2. Scope: `index.ts` handlers,
  `store.ts` async typed readers, `attention.ts`, `corrections.ts` reads.
- **P2 Confidential-meeting reads through the gateway (1.9.7 candidate).** Summary: `readConfidentialMeetings`
  reads every transcript synchronously on every meeting save (graph auto-rebuild, default on) and every
  publish. Acceptance: async via the gateway, cloud-only counted confidential (its documented fail-closed
  rule), `scheduleRebuild` and publish callers await it, `brainInputsLocal` drops its publish clause.
  Scope: `publish.ts`, `graphify.ts`, `inputs.ts`.
- **P3 Explicit "Download Intelligence files" action.** Summary: while `cloud-only` pauses Intelligence, offer
  one user action that hydrates the `.brain` files one at a time with progress (the architecture's only
  hydration path). Acceptance: never automatic; cancellable; ST-1 unaffected.
- **P4 Cloud-only-aware Intelligence completion copy.** Summary: a pass that skipped cloud-only transcripts
  says "N meetings are not downloaded on this device" instead of "could not finish updating".

## 10. Risks and unknowns

- **Cloud-only pauses Intelligence (DERIVED, user-visible).** On a folder where `.brain` is mostly evicted
  (prior review counted ~195/201 placeholders on the owner's Mac, PROVIDED), indexing pauses with the message
  until the folder is kept on the device. That is the architecture's rule (never hydrate in the background);
  P3 makes recovery one click.
- **Windows probe cost (UNKNOWN).** Own writes never probe (`noteWritten`); remote changes and new
  transcripts cost one batched PowerShell probe; `classifyAll` asks twice for `unknown` to ride out a cold
  start. ST-1-W measures it.
- **Race between our write and a remote replace (ASSUMED negligible).** `noteWritten` stats after the
  rename; a remote version landing in between would be marked local and, for index.json, adopted as ours.
  Equivalent to today's stat-then-read TOCTOU.
- **Readers before the first load (DERIVED).** A synchronous reader that runs before any load sees a
  read-only ledger (`'io'`): safe by construction (INV-4), visible only as an empty attention list for a few
  seconds after launch.
- **Transient `degraded`/`timeout` on index.json** drop ledger mutations while they last (M2-0003's
  fail-closed rule; today's 30 s window becomes the gateway's 60 s). Only when the version changed or on first
  load: the lane reads nothing after its own writes.
- **ST-1 depends on M2-0193 (A7).**
- **Test churn** is large but mechanical; CI on Windows is the check that no test still spawns the probe.

## Appendix A: sync-fs inventory (target state after M2-0031; anchors at `edbd7020`)

"Reach": T = main timer, I = IPC, B = boot. Statuses as A3. Owner = existing ticket or §9 proposal.

| Module: function (lines) | Sync calls | Reach | After M2-0031 | Owner |
|---|---|---|---|---|
| ingest.ts: meetingSourceVersion (1566-1575) | statSync | T B I | ROUTED (`sourceFileVersion`) | 0031 |
| ingest.ts: ingestExtraction date fallback (1624) | statSync | T | ROUTED | 0031 |
| ingest.ts: runExtractionStage (1701) | readFileSync (readSavedFile) | T B | ROUTED (`readSourceText`) | 0031 |
| ingest.ts: currentMeetingSourceVersions (1841-1858) | existsSync, readdirSync | T | ROUTED (`scanMeetingSources`) | 0031 |
| ingest.ts: countUnextractedMeetings (1899-1907) | existsSync, readdirSync | T I | ROUTED (`countUnextracted`) | 0031 |
| ingest.ts: hasIncompleteMeetingSource (1924-1933) | existsSync, readdirSync | T | ROUTED (`hasIncompleteSource`) | 0031 |
| ingest.ts: hasSavedReconciliationCandidate (1948-1951) | existsSync, readdirSync | T | ROUTED | 0031 |
| ingest.ts: startBackfill (2589, 2643) | existsSync, readdirSync | T B I | ROUTED | 0031 |
| store.ts: loadIndex (550, 565) → ledger.ts | statSync, readFileSync | T B I | ROUTED (`loadIndex`) | 0031 |
| store.ts: setAsideCorruptIndex (525, 532) → ledger.ts | readdirSync, renameSync | T B I | ROUTED (gateway list + async rename) | 0031 |
| store.ts: ensureDirs (200) | existsSync, mkdirSync | T I (every write) | ROUTED (async mkdir) | 0031 |
| store.ts: readJson for intelligence-index.json, consolidate-state.json, graph.json on the status/boot paths | statSync, readFileSync | T B I | ROUTED (`loadJson`) | 0031 |
| store.ts: readJson for entities, graph, extractions (merge, lint, replay) (230, 241) | statSync, readFileSync | T | GATED (INV-7) | M2-0074 |
| store.ts: readJson for the ask path, brainRead, entity names, meeting extraction, attention | statSync, readFileSync | I | DEFERRED | P1 / M2-0074 |
| store.ts: listEntities, listMeetingExtractions (696-706) | existsSync, readdirSync | T (merge) / I | GATED (T) / DEFERRED (I) | M2-0074 / P1 |
| store.ts: brainHasV1Entities, isV1EntityFile, ensureV1Backup (367-415) | readdirSync, readFileSync, existsSync, cpSync, renameSync, rmSync | T (first entity write per brain without a backup) | GATED | M2-0074 |
| store.ts: removeMeetingExtraction (721, 726) | rmSync, existsSync | I (delete) | DEFERRED (unlink does not hydrate) | M2-0074 |
| store.ts: purgeBrain (754-781) | existsSync, cpSync, rmSync, mkdirSync, readdirSync | I (Delete all, rebuild) | GATED for rebuild (journal copy), DEFERRED for Delete all | M2-0074 |
| corrections.ts: isJournalCorruptionBlocked (94) | existsSync | I T (status poll) | ROUTED for status (`journalCorruptionBlocked`); DEFERRED elsewhere | 0031 / M2-0074 |
| corrections.ts: parseJournalFile, listConflictCopyNames, quarantine/merge renames, raw entity read (161-495) | readFileSync, existsSync, readdirSync, renameSync, writeFileSync | T (replay, merge) / I (corrections) | GATED (T) / DEFERRED (I) | M2-0074 / P1 |
| corrections.ts: clearJournalCorruptionLock (102-104) | existsSync, rmSync | I | DEFERRED | M2-0074 |
| publish.ts: whole module (71-989) | existsSync, mkdirSync, readdirSync, openSync/readSync, readFileSync, unlinkSync, rmSync | T (publishBrainPages on; default off) / I | GATED (INV-7 publish clause) | P2 |
| graphify.ts: confidentialGraphRefusal → readConfidentialMeetings (280-285) | readFileSync of every transcript | I (every save: graph auto-rebuild, default on) | DEFERRED | P2 |
| context.ts via store readers; match-key-cache.ts (22-48) | statSync, readdirSync, readFileSync | I (every ask) | DEFERRED | M2-0074 (L03-05) |
| transcripts.ts: recoverOrphanDrafts (901-938) | existsSync, readdirSync, readFileSync, unlinkSync | B | ROUTED | 0031 |
| transcripts.ts: isEncryptedFile (331) via recoverOrphanDrafts | readFileSync | B | ROUTED (`isEncryptedBytes`) | 0031 |
| transcripts.ts: isEncryptedFile via recall.ts, appendDebrief, recallOpen | readFileSync | I | DEFERRED | M2-0193 / M2-0074 |
| transcripts.ts: readSavedFile via recall.ts (809), recallExportPlain (index.ts:6207) | readFileSync | I | DEFERRED (explicit single-file user actions) | M2-0193 |
| transcripts.ts: decryptToTemp and self-healing rewrap (250-254, 398-415) | readFileSync, writeFileSync, renameSync, existsSync, unlinkSync | I (Open) | DEFERRED (explicit open hydrates by design) | M2-0193 |
| transcripts.ts: ensureMeetingsFolder, appendIndexRow, saveNote/saveMeeting name loops, appendDebrief, clearDraftTranscript (476-493, 603, 665, 752, 864) | existsSync, mkdirSync, writeFileSync, appendFileSync | I (save), B (recovered draft row) | DEFERRED | M2-0074 |
| transcripts.ts: writeSaved failure cleanup (371) | existsSync | T I (failed write only) | DEFERRED | M2-0074 |
| index.ts: openBrainForClaude (8604) | existsSync | I | DEFERRED | M2-0074 |
| recall.ts: isMeetingConfidentialOnDisk (809), readMeetingUncached/isOwnedMeetingFile via isEncryptedFile (184, 852) | readFileSync | I | DEFERRED | M2-0193 |
| intelligence-index.ts: lastIndexedAt via operator-ingest.ts:125 | readFileSync (readJson) | T I (seat metadata) | ROUTED (memory only, INV-4) | 0031 |
| infra/storage/paths.ts: detectOneDriveUncached (29-49) | existsSync, readdirSync | B (once per process, memoized) | DEFERRED (reads the OneDrive base, not the root) | M2-0074 |
| infra/storage/paths.ts: copyForwardLegacyMeetingsOnce (67-85) | existsSync, mkdirSync, readdirSync, copyFileSync, writeFileSync | every resolve (marker in userData); legacy sibling once per profile | DEFERRED | M2-0074 |
| selftest.ts (13 calls) | various | only under `ASKTOTO_SELFTEST`, isolated temp profile (M2-0004) | UNREACHABLE in a normal launch | — |
| store.ts (settings), import-job-store.ts, graphify.ts userData paths, sweepStaleTempFiles | various | userData / OS temp | not under the meetings root | — |
