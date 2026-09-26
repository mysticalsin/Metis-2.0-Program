# M2-0003 design: brain index read/replace invariant (no ownership stamp)

Designer: Opus. Base: `4cf7c2dd` (origin/main `2bf21f1c` + M2-0001 hermetic tests).
Status: design only. The implementer (Sonnet) follows this file.

## 0. Why this design, in one paragraph

The incident (L03-01 verification, RUNTIME-EVIDENCE "Brain index quarantine") was non-app node/vitest
processes with a different file-backend key. They failed to decrypt the owner's real `.brain/index.json`
and renamed it away. The running app then re-ingested the whole vault. The prior attempt
(`55ffa595..4a4dabf9`) tried to tell "mine" from "foreign" with a plaintext `index.owner.json` stamp.
It needed four module-level states and still lost data (F1: a session shadow outlived purge. F2: a torn
sidecar let foreign bytes be overwritten). It also leaked the raw installId into a OneDrive folder that
Dust agents read. The stamp cannot prove anything the crypto does not already prove. Being able to
decode the bytes is the ownership proof. So this design drops the stamp and enforces one invariant at the
two places that can destroy the ledger (rename and replace) and at the two places that start ingest work.
The corrections journal already implements the same rule (`corrections.ts` `parseJournalFile`:
absent / unreadable / corrupt / ok). The index now does the same.

## 1. Invariants

**INV-1 (replace/rename).** `.brain/index.json` is renamed or overwritten only when this process fully
decoded its current bytes. "Fully decoded" means plaintext, or an ATKENC envelope whose content
authenticated under a key this device holds (`decodeSavedResult(buf).ok === true`). The other exception
is that no file exists at all (ENOENT or 0 bytes).

**INV-2 (read-only session).** An existing index.json that this process cannot use is left byte-identical.
That covers an I/O error, a decode failure of any kind (another device's key, keystore unavailable,
damaged ciphertext, truncated envelope) and a newer schema we cannot parse. The session treats the index
as read-only:
- `readIndex` returns an empty stand-in.
- `writeIndex` throws.
- `updateIndex` drops the mutation.
- No extraction job is queued: `startBackfill` and `enqueueIngest` are gated.

The state is keyed only on the file's `(mtimeMs, size)`. It ends by itself when the bytes change and
become readable, and after an explicit purge (Delete all / Rebuild). Nothing in memory outlives the file.

**INV-3 (bounded auto-repair).** Only *decoded-but-invalid* bytes may be set aside automatically:
`JSON.parse` or `BrainIndexSchema` fails and the schema_version is not newer than this build's. They are
renamed to `index.corrupt-auto-<ISO>-<hex>.json`, at most `INDEX_AUTO_SNAPSHOT_CAP = 5` per `.brain`.
Only the `index.corrupt-auto-` prefix is counted on disk. At the cap, or if the rename fails, INV-2
applies (`cause: 'corrupt-kept'`). No code path deletes, renames or counts the legacy ISO-named
`index.corrupt-<ISO>.json` files. The existing 180 are untouched. User-initiated `purgeBrain`
(Delete all / Rebuild) keeps its current erasure semantics.

Decode failure is deliberately *not* split into "foreign key" and "damaged own ciphertext" for behaviour.
AES-GCM auth failure cannot tell them apart. The kLocal-unwrap stage is not a proof either: the vitest
`safeStorage` mock passes non-`enc:` bytes through unchanged, and macOS `v10` wraps are unauthenticated
CBC. The decode `reason` is logged for diagnosis only.

## 2. Code changes per file

Line anchors are at `4cf7c2dd`.

### 2.1 `src/shared/brain.ts`

- Add near `BRAIN_SCHEMA_VERSION`:
  ```ts
  /** Why an existing .brain/index.json is read-only for this session (M2-0003). Content-free. */
  export type IndexUnavailableCause = 'io' | 'undecryptable' | 'unsupported' | 'corrupt-kept'
  ```
- `BrainStatus` (line ~544): add `indexUnavailable?: IndexUnavailableCause` with a one-line doc comment:
  "set while index.json exists but cannot be used on this device. Indexing is paused and nothing was
  changed."

### 2.2 `src/main/logger.ts`

- `AuditEvent` union (lines ~170-241, next to the `brain.*` events): add `'brain.index.unavailable'` and
  `'brain.index.quarantined'`.
- If a contract test enumerates audit events, extend it.

### 2.3 `src/main/brain/store.ts`

Replace lines 423-478: the `indexQuarantineAttempted` Set, `quarantineUnusableIndex`, `readIndex` and
`writeIndex`. Everything else in the file is unchanged, including `readJson`, which graph and entity files
still use. New imports: `BRAIN_SCHEMA_VERSION` and `type IndexUnavailableCause` from `@shared/brain`, and
`auditLog` from `../logger`. `renameSync`, `readdirSync`, `readFileSync`, `statSync`, `randomBytes` and
`basename` are already imported.

```ts
// ── Brain index (index.json) ─ M2-0003 read/replace invariant ─────────────────────────────────────
// index.json is renamed or overwritten ONLY when this process fully decoded its current bytes (plaintext,
// or an envelope that authenticated under a key this device holds), or when no file exists. Bytes that
// could not be read, decrypted (another device's key, an unavailable keystore, damaged ciphertext — not
// distinguishable, so never distinguished) or parsed by this build's schema_version are left byte-identical
// and the index is read-only for the session. Decoded-but-invalid bytes are set aside, capped. Mirrors
// corrections.ts parseJournalFile (absent / unreadable / corrupt / ok).

const INDEX_REL = 'index.json'
/** Only snapshots made by this scheme are counted. Legacy `index.corrupt-<ISO>.json` files are never
 *  counted, renamed or deleted. Keeps the `.corrupt-` infix every .brain reader already excludes. */
const INDEX_AUTO_SNAPSHOT_PREFIX = 'index.corrupt-auto-'
export const INDEX_AUTO_SNAPSHOT_CAP = 5
/** Only an I/O failure is retried on a timer (e.g. a OneDrive dataless placeholder hydrating). A decode
 *  failure is not: retrying safeStorage on a timer risks Keychain prompts, and the bytes have not changed. */
export const INDEX_IO_RETRY_MS = 30_000

type IndexLoad =
  | { kind: 'ready'; index: BrainIndex }
  | { kind: 'absent' }
  | { kind: 'corrupt' } // decoded, but not a valid index for this build
  | { kind: 'unavailable'; cause: IndexUnavailableCause; detail?: string } // detail: log-only (errno / decode reason)
type ResolvedIndex = Exclude<IndexLoad, { kind: 'corrupt' }>

export class BrainIndexUnavailableError extends Error {
  override readonly name = 'BrainIndexUnavailableError'
  // NOT `cause` — that is Error.cause (ES2022).
  constructor(readonly unavailable: IndexUnavailableCause) {
    super(`brain index is read-only on this device (${unavailable})`)
  }
}

/** Pure classification of index.json bytes. No filesystem writes. M2-0031 can call it after an async
 *  read without changing semantics. */
export function classifyIndexBytes(buf: Buffer): IndexLoad {
  if (buf.length === 0) return { kind: 'absent' } // torn to zero bytes: nothing to preserve (unchanged)
  const decoded = decodeSavedResult(buf)
  if (!decoded.ok) return { kind: 'unavailable', cause: 'undecryptable', detail: decoded.reason }
  let raw: unknown
  try { raw = JSON.parse(decoded.text) } catch { return { kind: 'corrupt' } }
  const parsed = BrainIndexSchema.safeParse(raw)
  if (parsed.success) return { kind: 'ready', index: parsed.data }
  const v = (raw as { schema_version?: unknown } | null)?.schema_version
  if (typeof v === 'number' && v > BRAIN_SCHEMA_VERSION) return { kind: 'unavailable', cause: 'unsupported' }
  return { kind: 'corrupt' }
}

// Stat-keyed memo, one entry per brain dir. It is NOT session state: an entry is used only while
// (mtimeMs,size) still match the file on disk. ENOENT drops it, and writeIndex / set-aside delete it.
// The -1/-1 key stands for "stat itself failed (non-ENOENT)".
const indexCache = new Map<string, { mtimeMs: number; size: number; at: number; load: ResolvedIndex }>()

function loadIndex(s: Settings): ResolvedIndex
//  1. p = join(brainDir(s), INDEX_REL); statSync(p).
//     ENOENT → indexCache.delete(p), return absent.
//     Any other stat error → key (-1,-1), classify as unavailable('io').
//  2. hit = indexCache.get(p). Return hit.load when the key matches, unless it is an 'io' entry older than
//     INDEX_IO_RETRY_MS.
//  3. load = classifyIndexBytes(readFileSync(p)). A read error with ENOENT → absent; any other code →
//     unavailable('io', detail: code). Never swallow into "absent".
//  4. load.kind === 'corrupt' → load = setAsideCorruptIndex(p).
//  5. absent → indexCache.delete(p), return.
//  6. unavailable and (no hit, or hit.load was not 'unavailable' with the same cause) → log once:
//       mainLog.warn(`[brain] index.json can't be used on this device (${cause}${detail ? `: ${detail}` : ''}) — left untouched; indexing is paused until it can be read`)
//       auditLog('brain.index.unavailable', { cause })      // enum only: no path, no reason string
//  7. indexCache.set(p, { mtimeMs, size, at: Date.now(), load }); return load.

function setAsideCorruptIndex(p: string): ResolvedIndex
//  dir = dirname(p)
//  kept = readdirSync(dir).filter((f) => f.startsWith(INDEX_AUTO_SNAPSHOT_PREFIX)).length   (throw → corrupt-kept)
//  kept >= INDEX_AUTO_SNAPSHOT_CAP → return { kind: 'unavailable', cause: 'corrupt-kept', detail: 'snapshot cap reached' }
//  to = join(dir, `${INDEX_AUTO_SNAPSHOT_PREFIX}${new Date().toISOString().replace(/[:.]/g, '-')}-${randomBytes(3).toString('hex')}.json`)
//  renameSync(p, to)  (throw → { unavailable, 'corrupt-kept', detail: errno code })
//  indexCache.delete(p)
//  mainLog.warn(`[brain] index.json decoded but was not a valid index — preserved as ${basename(to)} (${kept + 1}/${INDEX_AUTO_SNAPSHOT_CAP}); it will be rebuilt from the transcripts`)
//  auditLog('brain.index.quarantined', { kept: kept + 1, cap: INDEX_AUTO_SNAPSHOT_CAP })
//  return { kind: 'absent' }

/** The index, or an empty stand-in when there is none or it is read-only (see indexUnavailable). The
 *  stand-in can never be persisted over unreadable bytes: writeIndex refuses. It returns the same cached
 *  object for an unchanged file, so callers still clone before mutating (see updateIndex). */
export const readIndex = (s: Settings): BrainIndex => {
  const load = loadIndex(s)
  return load.kind === 'ready' ? load.index : BrainIndexSchema.parse({})
}

/** Non-null while an existing index.json cannot be used here: the index is read-only for the session. */
export function indexUnavailable(s: Settings): IndexUnavailableCause | null {
  const load = loadIndex(s)
  return load.kind === 'unavailable' ? load.cause : null
}

/** Fail-closed write: never replaces bytes this process could not fully decode. */
export async function writeIndex(s: Settings, v: BrainIndex): Promise<void> {
  const blocked = indexUnavailable(s)
  if (blocked) throw new BrainIndexUnavailableError(blocked)
  await writeJson(s, INDEX_REL, v)
  indexCache.delete(join(brainDir(s), INDEX_REL))
}

/** User-facing, content-free explanation for brainStatus.error. */
export function indexUnavailableMessage(cause: IndexUnavailableCause): string
//  'undecryptable': "Mantu Intelligence can't read its index on this device: it was encrypted with a key this
//                    device doesn't have (another device, or a keychain that is unavailable). Nothing was changed
//                    or deleted. Indexing is paused on this device."
//  'io':            "Mantu Intelligence couldn't read its index file just now (it may still be downloading from
//                    OneDrive). Nothing was changed. Indexing resumes automatically once the file can be read."
//  'unsupported':   "Mantu Intelligence's index was written by a newer version of Métis. Nothing was changed.
//                    Update Métis on this device to resume indexing."
//  'corrupt-kept':  "Mantu Intelligence's index is damaged and the automatic repair limit for this folder has been
//                    reached. Nothing was deleted. Indexing is paused on this device."
```

Also update the stale doc comment on `readJson`'s catch ("callers treat as absent; ingest will rewrite
it"). Note that this no longer applies to index.json. Do not change `readJson`'s behaviour.

### 2.4 `src/main/brain/ingest.ts` (three guards; no other changes)

1. **`updateIndex`** (line 1342). Inside the serialized lane, as its first statement:
   ```ts
   // M2-0003: an existing index.json this process cannot use is read-only for the session. Drop the
   // mutation. Never persist a ledger derived from readIndex's empty stand-in. Quiet on purpose: the
   // unavailability was already logged/audited once.
   if (indexUnavailable(s)) return
   ```
   Everything after it is unchanged (`clone(readIndex) → mutate → writeIndex`). A race where the file
   turns unreadable between this check and `writeIndex` still rejects through `BrainIndexUnavailableError`,
   the same path as any disk error today.
2. **`startBackfill`** (line 2531). Right after `const s = getSettings()`, before `readIndex`:
   `if (indexUnavailable(s)) return { queued: 0 }`. This is one of the only two `queue.push` sites. It
   covers resume, reconcile→requestBackfill, consolidation, intelligence-pass, dashboard-open and the
   Index-meetings click. `onDrained` is never registered on this path. Its only caller is the rebuild
   replay, which runs after `purgeBrain`, so the index is absent and not gated.
3. **`enqueueIngest`** (line 2068). After `refuseIfDemoTagged(...)` and `const s = getSettings()`, before
   `readIndex`: `if (indexUnavailable(s)) return` (optionally `mainLog.info('[brain] index is read-only
   on this device — live ingest skipped')`, with no filename). The transcript is already saved. A
   backfill picks it up once the index is usable again.

### 2.5 `src/main/index.ts` (brainStatus surface)

- Import `indexUnavailable` and `indexUnavailableMessage` from `./brain/store` (import block ~line 556).
- In `ipcMain.handle(IPC.brainStatus …)` (line ~7951), after `const idx = readBrainIndex(s)`:
  `const unavailable = indexUnavailable(s)`. Spread it into the returned object:
  `...(unavailable ? { indexUnavailable: unavailable, error: indexUnavailableMessage(unavailable) } : {})`.
  BrainView already shows `status.error` (`brainStatusError` → `visibleError`), so no renderer change is
  needed. A repair button is a follow-up (see A9).

### 2.6 Files explicitly NOT changed

- `src/main/transcripts.ts`: `decodeSavedResult` already returns the typed `{ok:false, reason}` needed.
- `src/main/license/install.ts`: no installId dependency.
- `corrections.ts`: it already follows the invariant.
- `purgeBrain` and `startRebuild`: they are the explicit user repair/erasure paths and already work in
  the degraded state, because a purge makes the index absent.

## 3. Data flow (degraded session)

```
readIndex / indexUnavailable / writeIndex
        └─ loadIndex ─ stat ─┬─ ENOENT → absent (writable)
                             └─ cache(mtime,size) or read+classifyIndexBytes
                                  ├─ ready ................ serve
                                  ├─ corrupt .............. setAside (≤5 auto) → absent | unavailable(corrupt-kept)
                                  └─ unavailable(io|undecryptable|unsupported) → log+audit once, cache
updateIndex  ── unavailable? → drop (resolve)       writeIndex ── unavailable? → throw BrainIndexUnavailableError
startBackfill ─ unavailable? → {queued:0}           enqueueIngest ─ unavailable? → return
brainStatus ── unavailable? → {indexUnavailable, error: message}
exit: bytes change & decode (other device/owner rewrites), io retry after 30 s, relaunch with keystore
      back, or explicit purge (Delete all / IPC brain:rebuildAll)
```

## 4. What NOT to do

- No `index.owner.json`, no installId in the synced folder, no change to `license/install.ts`.
- No session-only or shadow index, no in-memory ledger, and no module flags beyond the stat-keyed
  `indexCache`. Delete `indexQuarantineAttempted`: a failed rename is now a stat-keyed `corrupt-kept`
  entry.
- Do not infer ownership from partial decrypt stages (kLocal unwrap succeeded but content failed).
  See §1 for why this is unsound under the test mock and macOS CBC.
- Do not add gates to `requestBackfill`, `reconcileMeetingsInBackground` or other callers. They are not
  load-bearing, because `startBackfill` and `enqueueIngest` are the only `queue.push` sites. The
  observer, `preparing` and completion bookkeeping in `requestBackfill` / `requestBackfillRun` is subtle,
  and extra early returns there risk a stuck "preparing" state. Gate only at `startBackfill`,
  `enqueueIngest` and `updateIndex`. I6 proves a forced run still settles.
- Do not log per dropped mutation. The reconcile tick runs every 60 s and would spam `main.log`.
- Do not retry `undecryptable` on a timer (Keychain prompt risk). Only `io` has a retry window.
- Do not delete, rotate, rename or count legacy `index.corrupt-<ISO>.json` files. Add no pruning.
- Do not make `readIndex` throw. Do not change `readJson` semantics for graph or entity files (see §7).
- Do not move reads off the main thread (M2-0031), but keep `classifyIndexBytes` pure so M2-0031 can.
- Do not name an Error field `cause`.
- Do not read, list or stat anything under `~/Library/CloudStorage` for the correlation note (§6).
- Do not put paths, decode reason strings or meeting filenames into `auditLog`. Use the cause enum and
  counts only.

## 5. Tests: red first, then implementation

Commit the tests as a WIP commit and show them failing on `4cf7c2dd` behaviour, then implement. Build
fixtures in each test's own `mkdtempSync` folder (`settings.meetingsFolder` set explicitly), never
anywhere else. Assert "byte-identical" as a `sha256` of `index.json` before and after, plus
`readdirSync(brainDir)` showing no new `index.corrupt-*` file.

Fixtures (in `mqa-175-brain-index-poison.test.ts`, reusing `envelopeV2` / `poisonedIndexBytes`):
- **FOREIGN-F** (the incident): `ATKENC2\n` + `{v:2, iv, tag, ct, kLocal: 'F:' + base64(randomBytes(72))}`.
  `decryptSecret` fails with "Unsupported state or unable to authenticate data", which is the logged
  incident reason.
- **KEYSTORE-OFF**: a valid mock-wrapped `envelopeV2(JSON.stringify({ingested:{'a.md':{at:1,ok:true}}}))`
  read with `vi.stubEnv('ASKTOTO_LOCAL_KEYSTORE', '1')`.
- **DAMAGED-OWN**: the existing `poisonedIndexBytes()` (GCM content auth fails).
- **INVALID-PLAIN**: `Buffer.from('{"ingested": tru')`. **INVALID-ENC**: `envelopeV2('not json')`.
- **NEWER**: plaintext `{"schema_version": 99, "ingested": "new-shape"}`.

### 5.1 `src/main/mqa-175-brain-index-poison.test.ts` (extend; the ticket's named file)

| # | Test name (behaviour it proves) | Red on base? |
|---|---|---|
| M1 | `M2-0003: a foreign-key index.json is byte-identical after readIndex, and readIndex returns an empty stand-in` (FOREIGN-F) | RED (base renames) |
| M2 | `M2-0003: writeIndex refuses to replace a foreign-key index.json (BrainIndexUnavailableError 'undecryptable'), bytes unchanged` | RED (base overwrites) |
| M3 | `M2-0003: keystore-unavailable leaves index.json byte-identical, and a fresh process with the keystore back reads the original ledger` (KEYSTORE-OFF, then `vi.unstubAllEnvs()` + `vi.resetModules()` + re-import store → `readIndex().ingested['a.md'].ok === true`) | RED |
| M4 | `M2-0003: damaged own ciphertext is no longer auto-quarantined — left in place, read-only` (DAMAGED-OWN). **Replaces** the base test "preserves an undecryptable index.json aside…" (see A4) | RED |
| M5 | `M2-0003: decoded-but-invalid plaintext is set aside as index.corrupt-auto-*.json with identical bytes, and the store is writable again` (INVALID-PLAIN; then updateIndex round-trip) | RED (name pattern) |
| M6 | `M2-0003: decoded-but-invalid content inside an authenticated envelope is set aside the same way` (INVALID-ENC) | RED (name pattern) |
| M7 | `M2-0003: legacy index.corrupt-<ISO>.json snapshots are never counted, renamed or deleted` (seed 3 ISO-named files, INVALID-PLAIN → quarantine proceeds, and the 3 legacy files keep names and sha256) | RED (name pattern) |
| M8 | `M2-0003: at 5 auto snapshots a sixth invalid index is left in place and read-only ('corrupt-kept')` (seed 5 `index.corrupt-auto-*` files; bytes of index.json and all 5 unchanged; writeIndex rejects) | RED |
| M9 | `M2-0003: an index from a newer schema_version is never quarantined ('unsupported')` (NEWER) | RED |
| M10 | `M2-0003: purge ends the read-only state — no in-memory ledger outlives the file` (FOREIGN-F → degraded → `purgeBrain(s)` → writeIndex succeeds and readIndex returns what was written). Regression guard for prior F1 | green on base |
| M11 | `M2-0003: the read-only state ends when the bytes become readable, with no restart` (FOREIGN-F → degraded → `writeFileSync` a healthy plaintext index → readIndex returns it, writeIndex allowed) | RED (base renamed it, so it was never degraded) |
| keep | existing "never hands the native keychain a truncated OSCrypt blob"; add `sha256` unchanged | RED (sha part) |
| keep | existing "leaves a healthy index.json alone" | green |

### 5.2 `src/main/brain/store.test.ts` (NEW; the ticket's verification names this path)

Use a scoped partial `vi.mock('node:fs')` with one-shot failure flags, following the pattern in
`store-durability.test.ts`. Faults are injected only for paths ending in `/.brain/index.json`.

| # | Test name | Red on base? |
|---|---|---|
| S1 | `classifyIndexBytes: 0 bytes → absent; plaintext index → ready; '{' → corrupt; FOREIGN-F → unavailable/undecryptable; NEWER → unavailable/unsupported` | RED (missing export) |
| S2 | `an I/O error reading index.json (ETIMEDOUT) is read-only, not "absent": writeIndex rejects 'io' and bytes are unchanged` | RED (base swallows into absent, then overwrites) |
| S3 | `an I/O failure is retried after INDEX_IO_RETRY_MS, and the original ledger is then served` (`vi.setSystemTime`) | RED |
| S4 | `a failed set-aside rename (EPERM) leaves the invalid index in place as 'corrupt-kept', without spinning on every read` (renameSync spy called once across 3 readIndex calls) | RED |
| S5 | `unavailability is logged and audited once per classification, not once per poll` (spy `mainLog.warn` and `auditLog`; 10× readIndex → 1 each; audit detail is exactly `{ cause }`) | RED |
| S6 | `indexUnavailableMessage has content-free copy for every IndexUnavailableCause` | RED (missing export) |

### 5.3 `src/main/brain/ingest-index-unavailable.test.ts` (NEW)

Harness: copy from `ingest-index-fallback.test.ts`. Mock `../llm` `createStream` so it returns valid
JSON, and call `setApiKey('anthropic','fake')` so a provider is usable. Without the gate, work would
really run. Use two transcripts in `meetingsFolder`, a sentinel entity file
`.brain/entities/person/sentinel.json`, FOREIGN-F as index.json, and `waitForIdle` + `whenIndexWritesSettle`
in `afterEach`.

| # | Test name | Red on base? |
|---|---|---|
| I1 | `startBackfill queues nothing and calls no model while the index is unreadable; index.json sha256 and the sentinel are unchanged` | RED |
| I2 | `the 60 s reconcile tick (reconcileMeetingsInBackground) does not re-ingest the vault behind an unreadable index` | RED |
| I3 | `a live save (enqueueIngest) is not indexed and does not touch index.json while it is unreadable` | RED |
| I4 | `updateIndex and markBrainChanged resolve without persisting anything over an unreadable index` | RED |
| I5 | `requestSourceRefresh never reaches purgeBrain behind an unreadable index` (sentinel still present) | RED (base: quarantine → refresh → rebuild → purge) |
| I6 | `requestBackfillRun({force:true}).completion settles (no hang) with queued 0 while the index is unreadable` | RED (base queues 2) |
| I7 | `explicit rebuild (startRebuild) is the repair path: it purges and writes a readable index` | green (guard) |

### 5.4 Existing suites to re-run (must stay green)

`brain.test.ts`, `ingest-index-durability.test.ts` (partial store mock spreads `...actual`, so it picks up
the new exports), `ingest-audit-fixes.test.ts`, `ingest-rebuild-resume.test.ts`, `store-durability.test.ts`,
`e2e-proof.test.ts`, `corrections.test.ts`.

### 5.5 Commands (sandbox ON, fake HOME)

```
cd /Users/tony/AI-Brain-build/metis-wt-M2-0003
H="$TMPDIR/metis-fake-home-M2-0003"; mkdir -p "$H"
HOME="$H" USERPROFILE="$H" OneDrive= OneDriveCommercial= OneDriveConsumer= npx vitest run \
  src/main/mqa-175-brain-index-poison.test.ts src/main/brain/store.test.ts \
  src/main/brain/ingest-index-unavailable.test.ts src/main/brain/ingest-index-durability.test.ts \
  src/main/brain/brain.test.ts src/main/brain/ingest-audit-fixes.test.ts src/main/brain/ingest-rebuild-resume.test.ts
HOME="$H" USERPROFILE="$H" OneDrive= OneDriveCommercial= OneDriveConsumer= npx vitest run   # full: only the 8 known baseline files may fail
HOME="$H" USERPROFILE="$H" OneDrive= OneDriveCommercial= OneDriveConsumer= npm run typecheck
```

Keep the red and green logs under `.m2-evidence/M2-0003/`.

## 6. CRITIC-INV-2 correlation note (deliverable, metadata only)

Write `.m2-evidence/M2-0003/CORRELATION.md` **from evidence already collected**. Do not read the live
folder again. The sources are:
- RUNTIME-EVIDENCE §"Brain index quarantine": per-day counts, and 2026-09-26 08:37:08Z / 09:05:05Z.
- The L03-01 verifier block in `plan-inputs/CODE-FINDINGS.json`:
  - Both 09-26 quarantines are logged in the non-app `main.log`, with vitest frames and reason
    "undecryptable (Unsupported state or unable to authenticate data)".
  - The app's `main.log` has zero quarantine lines since 09-23 13:00Z.
  - Quarantines vs app starts: 09-19 15/0, 09-20 48/4, 09-21 25/1, 09-23 64/8.
  - The 16 quarantines after 13:00Z on 09-23 are all 474 B test-sized files.
  - There were none on 09-24 or 09-25.
- The M2-0001 landing time (`4cf7c2dd`) as the end of the test-run exposure window.

Conclusion to record: every attributable quarantine is in the `undecryptable` class. The new invariant
never renames that class. If the owner wants fresher numbers, give him a read-only command that lists
names, sizes and mtimes to run himself. Agents never run it.

## 7. Acceptance amendments (proposed)

- **A1 (drop the ownership stamp).** Delete "writeIndex stamps .brain/index.owner.json {installId,
  updatedAt}".
  - *Why:* successful decode is a stronger proof of ownership than a forgeable plaintext sidecar in a
    synced folder.
  - The stamp caused the prior attempt's F2 (torn sidecar → overwrite).
  - It misread own indexes as foreign whenever identity.json was regenerated.
  - It leaked a stable per-device id into a OneDrive folder that Dust agents read.
  - INV-1/2 cover the foreign-key and keystore cases without it.
  - `license/install.ts` and `transcripts.ts` leave the scope.
- **A2 (cause-based read-only).** Replace "Foreign installId or keystore-unavailable leaves index.json
  byte-identical, returns an in-memory empty read-only index and audits brain.ledger.foreign_key" with:
  "Any existing index.json that cannot be read, decrypted or recognised (io / undecryptable /
  unsupported / corrupt-kept) stays byte-identical across readIndex, writeIndex, updateIndex,
  startBackfill, the reconcile tick, enqueueIngest and requestSourceRefresh. readIndex returns an empty
  stand-in, writeIndex throws BrainIndexUnavailableError, updateIndex drops the mutation, and no
  extraction is queued. `brain.index.unavailable {cause}` is audited once per classification, and
  brainStatus exposes `indexUnavailable` + `error`."
  - *Why:* "foreign" cannot be determined honestly. Every decode failure must be treated alike, and the
    write and ingest paths are where the damage actually happened.
- **A3 (quarantine rule + cap).** Replace "Own or unowned plus unparseable keeps today's rename
  behaviour; new snapshots capped at 5; existing 180 never deleted" with:
  - "Decoded-but-invalid (plaintext, or an envelope that authenticates) is renamed to
    `index.corrupt-auto-<ISO>-<hex>.json`."
  - "The cap is 5 on disk, counting only the `auto-` prefix. At the cap or on a rename failure the file
    stays and the index is read-only (`corrupt-kept`)."
  - "Legacy ISO-named snapshots are never counted, renamed or deleted by any automatic path.
    User-initiated Delete all / Rebuild keeps its erasure semantics."
  - `brain.index.quarantined {kept, cap}` is audited.
- **A4 (MQA-175 behaviour change, explicit).** Damaged *own* ciphertext (the 1.5.4 Windows field shape)
  is no longer auto-quarantined. It becomes read-only like every other decode failure, because it
  cannot be told apart from a foreign key (§1). The base test "preserves an undecryptable index.json
  aside…" is rewritten as M4. The crash protection (the OSCrypt length guard) is unchanged.
- **A5 (scope_paths).**
  - Add `src/main/brain/ingest.ts` (3 guards), `src/main/index.ts` (brainStatus, ~3 lines),
    `src/shared/brain.ts` (type + field) and `src/main/logger.ts` (2 audit events).
  - Add new tests `src/main/brain/store.test.ts` (it does not exist at base) and
    `src/main/brain/ingest-index-unavailable.test.ts`.
  - Remove `src/main/license/install.ts` and `src/main/transcripts.ts`.
- **A6 (correlation note).** "Owner-approved" is met by compiling from already-collected review
  evidence (§6). No agent reads `~/Library/CloudStorage`.
- **A7 (test matrix).** Replace "three ownership cases plus the backward-compatible case" with the cause
  matrix M1-M11 / S1-S6 / I1-I7.
- **A8 (verification).** Add the new test files to the verification command. The foreign-key `sha256`
  fixture must also hold after writeIndex, updateIndex, startBackfill, reconcile and enqueueIngest, not
  only after readIndex.
- **A9 (follow-up ticket, not this one).** No in-app repair control exists today: `brain:rebuildAll` has
  no renderer call site (confirmed; also noted in BUG-LEDGER).
  - This ticket gives the degraded state a visible explanation (`brainStatus.error`).
  - Exits today: the cause clears (readable bytes, io retry, relaunch with keystore), Delete all, or
    IPC-only rebuild.
  - Follow-up: add a BrainView banner on `status.indexUnavailable`, with a "Rebuild on this device"
    button calling the existing `window.toto.brainRebuildAll()`, mirroring the `corruptionBlocked` →
    "Reset corrections lock" banner. Consider preserving the unreadable index.json outside `.brain`
    before the purge.

## 8. Known limits (documented, out of scope)

- **TOCTOU with another device's OneDrive write** between writeIndex's check and its rename. It cannot
  be serialized locally (ChatGPT STORE-01 says the same). Jobs already in flight when the index turns
  unreadable finish their entity writes, but their ledger writes are dropped.
- **Graph and entity files** still use `readJson`'s catch-all (undecryptable → absent). With ingest
  gated on the index, automatic overwrites of them stop whenever the index itself is unreadable. A
  readable index next to foreign entity files is a separate, pre-existing multi-device issue.
- **Heavy re-ingest after a legitimate (capped) quarantine**: this is B2-F2 / M2-0033/34 territory,
  bounded here to 5 automatic events per `.brain`.
- **`decryptSecret` → `getOrCreateKey`** can mint `secret-key.bin` in userData on read (ChatGPT: "missing
  index does not authorize a replacement key"). This is in `secrets.ts`, outside this ticket.

## 9. Size estimate

Production about 110 LOC (store ~85, ingest ~6, index ~4, shared ~4, logger ~2). Tests about 400 LOC.
About 4-5 h including red/green evidence. There is no new module-level state beyond one stat-keyed map.
