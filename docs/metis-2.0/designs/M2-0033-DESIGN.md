# M2-0033 design: one retry/exhaustion policy for every backfill caller, and a maintenance gate for unattended model work

Designer: Opus. Base: `56292fb6` (m2/integration, post-rewrite). Branch `m2/M2-0033-backfill-retry-policy`.
The scoped files are unchanged between `56292fb6` and `origin/m2/integration@ede134da`, so this design holds on
either base; rebase onto the tip before pushing.
Status: design only. Codex implements this file; the driver challenges every diff against it.
Findings: B2-F2, B2-F4, L02-F3, CHATGPT-A3, CRITIC-CON-3, CRITIC-CON-4, L02-REFACTOR-3. Kit: M2-LOCAL-02. ADR slot: ADR-008.
Depends on M2-0001 (hermetic tests, DONE) and M2-0006 (clean-shutdown marker, DONE).

## 0. Why this design, in one paragraph

`startBackfill` decides retry permission from the *absence* of an option. Only the 60 s reconcile tick
passes `respectRetryBackoff: true`; every other caller (boot resume, the intelligence catch-up and slots
with `force:true`, consolidation, dashboard-open, import-idle) skips backoff **and** clears `exhausted`,
so `MAX_INGEST_ATTEMPTS` holds only until the next relaunch. The fix inverts the default: every call is
`automatic` unless the caller says `trigger: 'user'`, and one pure function (`admitSource`) decides
queue / revive / hold for every record. A failure to *read* the transcript (a cloud-only file, a lock, an
undecryptable file) is recorded as `unreadable`, spends no attempt, and is retried only when the file's
ctime moves. Separately, unattended model work (automatic extraction, automatic recaps, the boot warm)
passes one **maintenance gate**: no admission in the first 120 s of the process, none after an unclean
exit until the first deliberate input, one holder at a time, and none while an interactive local stream
runs. The catch-up keys on "a pass finished since the slot", not "a pass succeeded", so a pass that
honestly reports `incomplete` (exhausted records remain) no longer reruns on every launch. Prewarm
eligibility is deliberately **not** widened for ingest (L02-F3 verifier: that adds standing RAM for work
nobody waits on); the boot warm instead goes through the same gate. CRITIC-CON-3 is resolved as "both":
M2-0003 stopped the quarantine re-ingest, this ticket stops the un-exhaust loop. CRITIC-CON-4 is resolved
in the comments: the reconcile tick fires every 60 s but scans at most 3 times a day; `scheduleConsolidation`
is dead and is deleted.

## 1. Caller inventory (OBSERVED at `56292fb6`) and the decision for each

| Caller | Today | After |
|---|---|---|
| Boot resume `resumeBackfillIfPending` → `startBackfill()` / `startReplayBackfill` | ignores backoff, **revives exhausted** | `automatic` (default) |
| Reconcile tick (60 s) → `requestBackfill({respectRetryBackoff:true})` | respects both | `automatic` (default); ledger check first |
| Dashboard open (`IPC.brainOpenDashboard`) → `requestBackfill()` | **revives exhausted** | `automatic` (default) |
| Consolidation (boot) `runConsolidationIfDue` → `startBackfill()` | **revives exhausted** | `automatic` (default) |
| Intelligence `catch-up` / `schedule` / `import-idle` → `requestBackfillRun({force:true})` | **revives exhausted**; catch-up reruns every launch while `lastSuccessAt` is stale | `automatic`; waits for the maintenance window; catch-up keyed on `lastFinishedAt` |
| Intelligence `click` (`IPC.brainBackfill`) | revives exhausted | `user` (explicit Retry) |
| Update Intelligence (`IPC.brainIntelligencePass`) → `startIntelligencePass` | revives exhausted | `user` |
| Rebuild (`IPC.brainRebuildAll`) → `startRebuild` | purge, so moot | `user` (model work not gated) |
| Source-refresh rebuild (`maybeStartSourceRefresh`) | purge, so moot | `automatic` (its re-extraction is gated) |
| Live save / debrief / import → `enqueueIngest` | fresh pending record | unchanged (a new source version is new input); ledger audit added |

## 2. Invariants

**INV-RETRY (one policy).** Whether a not-yet-ingested source is queued is decided only by
`admitSource(record, source, trigger, now)` in `src/main/infra/scheduler/policy.ts`:
- no record, or a pending record → queue (automatic resume continues genuinely interrupted work);
- `automatic` + `exhausted` → hold; `automatic` + unchanged source inside `retryAfter` → hold;
- `automatic` + `unreadable` → hold until the file's ctime differs from the one recorded;
- `user` + `exhausted` → revive (attempts 0, no `exhausted`, no `retryAfter`), then queue;
- `user` otherwise → queue (backoff ignored, budget not reset).
`reviveExhausted` is called from exactly one place (`startBackfill`, only for a `revive` admission), and a
`revive` admission exists only for `trigger === 'user'`. The default trigger everywhere is `automatic`.

**INV-FAIL.** A failed job's ledger record is built only by `retryStateAfterFailure`. A genuine failure
spends one attempt, sets `retryAfter`, and sets `exhausted` at `MAX_INGEST_ATTEMPTS`. A failure to read the
transcript (any throw from `readSavedFile`) keeps `attempts` unchanged, sets no `retryAfter`/`exhausted`, and
records `unreadable.changedAtMs` (the file's ctime, when stat succeeds). Any later outcome replaces the record.

**INV-VERSION.** `sourceVersion` keeps its `${round(mtimeMs)}:${size}` format. Drift detection compares it for
every `ok` record; changing it would schedule a purge-and-rebuild of every meeting.

**INV-GATE (maintenance admission).** Unattended model work = an `automatic` backfill job that calls a model
(not the `reconcile` strategy), an `automatic` Intelligence recap, and the boot-time local warm. Once the app
has called `startMaintenanceGate`, such work starts only when `deferralFor(state)` is `null`:
1. not within `BOOT_QUIET_PERIOD_MS` (120 000) of process start;
2. not before this run has read how the previous run ended, and after an **unclean** end not before the
   first deliberate input (`mouseDown`, `rawKeyDown`, `keyDown`, `touchStart`) to any Métis window;
3. not while another maintenance holder runs (at most one at a time);
4. not while any local-model stream (llama or Apple FM) is active that is not the maintenance holder's
   (interactive work pre-empts maintenance at dispatch; an admitted call is never cancelled).
Live jobs, user-triggered jobs and interactive asks never consult the gate. Before `startMaintenanceGate`
(unit tests) the gate admits everything and counts nothing.

**INV-LEDGER.** While `indexUnavailable(s)` is non-null (foreign-key, keystore-unavailable, read-only for the
session, dataless/io, newer schema), backfill, live ingest, consolidation and automatic Intelligence passes
do nothing and emit `scheduler.job {kind, outcome:'deferred', deferredReason:'ledger_unavailable'}` once per
kind per process. No recap runs and no `.brain` state file is written by an automatic pass.

**INV-CATCHUP.** A catch-up runs only when no pass *finished* (success or failure) after the most recently
elapsed slot, evaluated after the maintenance window opens.

## 3. Code changes per file

### 3.1 NEW `src/main/infra/scheduler/policy.ts` (pure; no I/O, no clock, no imports)

Write it as below (names are load-bearing for the tests in §5; wording of comments may be tightened).

```ts
/**
 * Scheduler policy: the pure decisions every background caller shares. Callers pass what they observed;
 * maintenance.ts holds the process state.
 *  - Retry and exhaustion: may a not-yet-ingested source be queued now, and what does a failure do to its
 *    ledger record.
 *  - Maintenance admission: may unattended model work start now.
 */

/** Who asked for the work. Only 'user' (an explicit click) revives an exhausted source or starts model work
 *  while maintenance is deferred. Every caller that does not say otherwise is 'automatic'. */
export type WorkTrigger = 'user' | 'automatic'

/** Consecutive genuine failures after which automatic triggers stop retrying a source. */
export const MAX_INGEST_ATTEMPTS = 6

const MAX_RETRY_DELAY_MS = 30 * 60_000
const retryDelayMs = (attempts: number): number =>
  Math.min(MAX_RETRY_DELAY_MS, 60_000 * 2 ** Math.max(0, attempts - 1))

/** One source file as one scan sees it. `changedAtMs` is its ctime: edits move it, and so do cloud
 *  hydration and eviction, which leave mtime and size unchanged (infra/storage/dataless.ts relies on the same). */
export interface SourceObservation {
  version?: string
  changedAtMs?: number
}

/** The retry fields of a ledger record that is not ok (structural subset of BrainIndex['ingested'][key]). */
export interface AttemptRecord {
  sourceVersion?: string
  attempts?: number
  retryAfter?: number
  exhausted?: boolean
  unreadable?: { changedAtMs?: number }
}

export type HoldReason = 'exhausted' | 'backed-off' | 'unreadable'
export type Admission = { action: 'queue' } | { action: 'revive' } | { action: 'hold'; reason: HoldReason }

export function admitSource(
  record: AttemptRecord | undefined,
  source: SourceObservation,
  trigger: WorkTrigger,
  now: number
): Admission {
  if (!record) return { action: 'queue' }
  if (trigger === 'user') return record.exhausted ? { action: 'revive' } : { action: 'queue' }
  if (record.exhausted) return { action: 'hold', reason: 'exhausted' }
  if (record.unreadable) {
    return record.unreadable.changedAtMs === source.changedAtMs
      ? { action: 'hold', reason: 'unreadable' }
      : { action: 'queue' }
  }
  const unchanged = source.version !== undefined && record.sourceVersion === source.version
  return unchanged && (record.retryAfter ?? 0) > now ? { action: 'hold', reason: 'backed-off' } : { action: 'queue' }
}

/** Gives an exhausted source a fresh attempt budget with no backoff. Only an explicit Retry reaches this. */
export function reviveExhausted(record: AttemptRecord): void {
  record.attempts = 0
  delete record.exhausted
  delete record.retryAfter
}

/** The retry fields of the record a failed job leaves. A source this device could not read spends no attempt. */
export function retryStateAfterFailure(
  previous: AttemptRecord | undefined,
  failure: { unreadable: boolean; source: SourceObservation },
  now: number
): Pick<AttemptRecord, 'attempts' | 'retryAfter' | 'exhausted' | 'unreadable'> {
  const spent = previous?.attempts ?? 0
  if (failure.unreadable) return { attempts: spent, unreadable: { changedAtMs: failure.source.changedAtMs } }
  const attempts = spent + 1
  return {
    attempts,
    retryAfter: now + retryDelayMs(attempts),
    ...(attempts >= MAX_INGEST_ATTEMPTS ? { exhausted: true } : {})
  }
}

/** No unattended model work in the first two minutes of a process. */
export const BOOT_QUIET_PERIOD_MS = 120_000

export type MaintenanceDeferral =
  | 'boot_quiet_period'
  | 'awaiting_first_interaction'
  | 'maintenance_running'
  | 'interactive_active'
export type DeferredReason = MaintenanceDeferral | 'ledger_unavailable'

export interface MaintenanceState {
  uptimeMs: number
  /** How the previous run ended; undefined until this run has read it. */
  priorExit: 'clean' | 'unclean' | 'unknown' | undefined
  interacted: boolean
  holding: boolean
  interactiveActive: boolean
}

export function deferralFor(state: MaintenanceState): MaintenanceDeferral | null {
  if (state.uptimeMs < BOOT_QUIET_PERIOD_MS) return 'boot_quiet_period'
  if (!state.interacted && (state.priorExit === undefined || state.priorExit === 'unclean')) return 'awaiting_first_interaction'
  if (state.holding) return 'maintenance_running'
  if (state.interactiveActive) return 'interactive_active'
  return null
}

/** Input only a person produces: a press, never a hover, move or scroll. */
export function isDeliberateInput(type: string): boolean {
  return type === 'mouseDown' || type === 'rawKeyDown' || type === 'keyDown' || type === 'touchStart'
}
```

### 3.2 NEW `src/main/infra/scheduler/maintenance.ts` (process state of the gate)

Required exports and behaviour (implement with module-level state, the codebase's existing style):

| Export | Contract |
|---|---|
| `startMaintenanceGate({ interactiveActive, uptimeMs?, schedule? })` | Arms the gate. Defaults: `uptimeMs = () => process.uptime() * 1000`, `schedule = (run, ms) => { setTimeout(run, ms).unref() }`. Schedules one `wake()` at `max(0, BOOT_QUIET_PERIOD_MS - uptimeMs())`. |
| `settlePriorExit(prior: PriorShutdown)` | Stores how the previous run ended (type from `boot-sentinel`), then `wake()`. Works before or after start. |
| `noteUserInput(inputType: string)` | First `isDeliberateInput` sets `interacted = true` and `wake()`s; everything else returns at once (it runs on every forwarded mouse move). |
| `maintenanceDeferral(): MaintenanceDeferral \| null` | `null` when not started; else `deferralFor({...})` from the current state and `interactiveActive()`. Pure query. |
| `beginMaintenance(): () => void` | Takes the slot. Precondition: `maintenanceDeferral()` returned `null` in the same synchronous turn; throws `Error('maintenance is deferred (<reason>)')` otherwise. Not started → returns a no-op release. The release is idempotent and `wake()`s. |
| `runAsMaintenance<T>(work)` | Takes the slot now or waits for it (FIFO), runs `work`, releases in `finally` (also on rejection). |
| `whenMaintenanceWindowOpens(): Promise<void>` | Resolves when conditions 1–2 of INV-GATE hold (ignores holder/interactive); immediately when not started or already open. |
| `onMaintenanceMayBegin(listener)` | Persistent listener; called in a `queueMicrotask` after any `wake()` that leaves `maintenanceDeferral() === null` (no re-entrancy into `pump`). |
| `reportDeferred(kind: SchedulerJobKind, reason: DeferredReason)` | `auditLog('scheduler.job', { kind, outcome: 'deferred', deferredReason: reason })` once per `kind:reason` per process. |
| `resetMaintenanceGateForTests()` | Clears all state except registered listeners. |

`type SchedulerJobKind = 'backfill' | 'ingest' | 'intelligence-index' | 'model-work'`.

`wake()` (private), in this order:
1. If not started, return.
2. The first time the window is open (conditions 1–2), audit
   `scheduler.job { kind: 'model-work', outcome: 'window-open', uptimeMs: round(uptime), afterInteraction: interacted }`
   and resolve every `whenMaintenanceWindowOpens` promise.
3. While waiters exist and `maintenanceDeferral() === null`, hand the next waiter `beginMaintenance()`.
4. If waiters remain and the deferral is `interactive_active`, arm one re-check after
   `INTERACTIVE_RECHECK_MS = 5_000` through `schedule` (local streams raise no event when they end; the
   pump does not need this because a finishing job and the 60 s tick already re-run it, as MQA-048 does today).
5. If `maintenanceDeferral() === null`, `queueMicrotask` the listeners.

Module doc states INV-GATE verbatim. No other timers, no `setInterval`.

### 3.3 `src/shared/brain.ts`

- `BrainIndexSchema.ingested` value: add
  ```ts
  /** Set when this device could not read the source (a cloud-only placeholder, a lock, a vanished or
   *  undecryptable file). Such a failure spends no attempt; automatic scans retry once the file's ctime
   *  differs from `changedAtMs`. Replaced by the next outcome. */
  unreadable: z.object({ changedAtMs: z.number().optional() }).optional()
  ```
- Fix the `exhausted` doc: "True once `attempts` reaches MAX_INGEST_ATTEMPTS (infra/scheduler/policy.ts).
  Automatic triggers never requeue it; only an explicit user Retry revives it." Same correction on the
  `exhausted` count doc near line 581 ("stopped being retried automatically").

### 3.4 `src/main/logger.ts`

Add `| 'scheduler.job'` to `AuditEvent` with a one-line comment: "M2-0033: scheduler decisions
(backfill scan counts, deferrals, maintenance window) — counts and enums only, never paths or names."

### 3.5 `src/main/infra/observability/run-observability.ts`

Add `readonly priorShutdown: PriorShutdown` to `RunObservability` (doc: "How the previous run ended, read once
by beginRunWatch."), and return `priorShutdown: prior.prevShutdown` from `startRunObservability`. Nothing else.

### 3.6 `src/main/brain/ingest.ts`

1. **Imports.** `admitSource, reviveExhausted, retryStateAfterFailure, type HoldReason, type SourceObservation,
   type WorkTrigger` from `../infra/scheduler/policy`; `beginMaintenance, maintenanceDeferral,
   onMaintenanceMayBegin, reportDeferred` from `../infra/scheduler/maintenance`.
2. **Move out** `retryDelayMs` and `MAX_INGEST_ATTEMPTS` (now in policy.ts). No re-export.
3. **Source observation.** Replace the body of `meetingSourceVersion` with a thin wrapper over a new
   ```ts
   /** One stat for a scan: the content version drift detection compares, plus the ctime the retry policy
    *  uses to notice a cloud-only file becoming readable. */
   function observeSourceFile(file: string): SourceObservation
   ```
   returning `{ version: \`${Math.round(st.mtimeMs)}:${st.size}\`, changedAtMs: Math.round(st.ctimeMs) }`,
   or `{}` when stat throws. `meetingSourceVersion(file)` returns `observeSourceFile(file).version` and keeps
   its doc. Do not add a second stat anywhere.
4. **Job.** Add `trigger: WorkTrigger` ("Who queued it. Automatic model-backed backfill jobs wait for the
   maintenance gate.") Live jobs from `enqueueIngest` set `'user'`. Add:
   ```ts
   /** Background extraction nobody is waiting on: the only queue work the maintenance gate governs. */
   function isUnattendedModelWork(job: Job): boolean {
     return job.origin === 'backfill' && job.trigger === 'automatic' && job.strategy !== 'reconcile'
   }

   /** An explicit request makes already-queued historical work the user's: it stops waiting for the gate. */
   function promoteQueuedBackfill(): void {
     for (const job of queue) if (job.origin === 'backfill') job.trigger = 'user'
     pump()
   }
   ```
5. **`JobResult` / `runExtractionStage`.** The failure variant becomes
   `{ job; s; ok: false; error: unknown; unreadable: boolean }`. Read the transcript in its own `try`:
   a throw from `readSavedFile(job.file)` returns `unreadable: true`; everything after it (checkpoint
   reuse, `extractMeeting`) returns `unreadable: false` on throw. Doc: "A read failure says nothing about
   the transcript, so it must not spend an attempt."
6. **`finishJob` failure record.** Replace the literal record with
   ```ts
   const previous = idx.ingested[key]
   const source = observeSourceFile(job.file)
   const version = job.sourceVersion ?? source.version
   const now = Date.now()
   idx.ingested[key] = {
     at: now,
     ok: false,
     error: e instanceof Error ? e.message : String(e),
     ...(version ? { sourceVersion: version } : {}),
     ...retryStateAfterFailure(previous, { unreadable: !result.ok && result.unreadable, source }, now)
   }
   ```
   (A merge/publication failure after a successful extraction stays a genuine failure.)
7. **`pump`.** In the `findIndex` predicate, after the existing provider and MQA-048 checks, a
   model-backed backfill job qualifies only if `job.trigger === 'user' || maintenanceDeferral() === null`.
   Keep the concurrency `break` where it is. After `queue.splice`, take
   `const endMaintenance = isUnattendedModelWork(job) ? beginMaintenance() : undefined` and call
   `endMaintenance?.()` in the `.then` right after `extracting.delete(job)` and before the existing `pump()`.
   The lease covers the model stage only, never the `withEntityLock` merge. Directly after the `pump`
   function add `onMaintenanceMayBegin(pump)` (module scope, one line).
8. **`BackfillStartOptions`.** Delete `respectRetryBackoff`. Add
   `trigger?: WorkTrigger` ("Who asked. Defaults to 'automatic'; only 'user' revives exhausted sources and
   bypasses the maintenance gate."). Document `force` precisely: "Bypass the daily scan budget and the
   source-drift rebuild diversion. Says nothing about retry permission."
9. **`requestBackfillRun`.** First statement: `if (options.trigger === 'user') promoteQueuedBackfill()`.
   No new early return.
10. **`startBackfill`.**
    - At the M2-0003 guard: `reportDeferred('backfill', 'ledger_unavailable')` before `return { queued: 0 }`.
    - `const trigger = options.trigger ?? 'automatic'`; `if (trigger === 'user') promoteQueuedBackfill()`.
    - In **both** scan loops, replace the backoff `if` and the exhausted `if` with one admission:
      ```ts
      const source = observeSourceFile(file)
      const admission = admitSource(idx.ingested[key], source, trigger, now)
      if (admission.action === 'hold') {
        held[admission.reason] += 1
        continue
      }
      if (admission.action === 'revive') toRevive.push(key)
      ```
      with `const held: Record<HoldReason, number> = { exhausted: 0, 'backed-off': 0, unreadable: 0 }`.
      Candidates carry `trigger` and `sourceVersion: source.version`.
      Keep the existing `observeSource(key)` calls (they feed the backfill completion observer and are
      unrelated to `observeSourceFile`).
    - Rename `toUnexhaust` → `toRevive`; the detached write becomes
      `for (const k of toRevive) { const r = i.ingested[k]; if (r) reviveExhausted(r) }` then `i.revision += 1`.
    - After both loops, one audit (counts only):
      `auditLog('scheduler.job', { kind: 'backfill', trigger, outcome: 'scanned', queued: candidates.length, revived: toRevive.length, heldExhausted: held.exhausted, heldBackedOff: held['backed-off'], heldUnreadable: held.unreadable })`.
    - Delete the three misleading comments (the `MAX_INGEST_ATTEMPTS` doc "Any OTHER caller … ignores",
      the `toUnexhaust` block comment, the "Every other caller already ignores the retryAfter backoff"
      comment). Replace with one line at the admission: "Retry permission comes from the trigger alone; see
      admitSource."
11. **`requestBackfill`.** No change in logic. Callers pass `trigger` through `options` as today.
12. **`reconcileMeetingsInBackground`.** First lines after `const s = getSettings()`:
    `if (indexUnavailable(s)) { reportDeferred('backfill', 'ledger_unavailable'); return }`
    (safe here: this function sets no `preparing` flag and owns no observer). Call `requestBackfill()`
    with no options. Extend its doc with the CRITIC-CON-4 fact: "Fires every 60 s but scans at most
    DAILY_BACKFILL_RUN_BUDGET times a day; between scans it only re-pumps a stalled queue."
13. **`enqueueIngest`.** At the M2-0003 guard: `reportDeferred('ingest', 'ledger_unavailable')` before `return`.
    The live job gets `trigger: 'user'`.
14. **Rebuild.** `StartRebuildOptions` gains `trigger?: WorkTrigger`; `performStartRebuild` passes
    `{ allowSourceRefresh: true, trigger: options.trigger }` to `startReplayBackfill`.
    `maybeStartSourceRefresh` passes nothing (automatic).
15. **Docs.** Module doc line "retried on the next rebuild" → "retried when the retry policy admits it again
    (infra/scheduler/policy.ts)". `resumeBackfillIfPending` doc: add "Runs as an automatic trigger:
    exhausted, backed-off and unreadable sources stay held; pending and never-attempted ones continue."
    `localOnlyRebuildBlocked` doc: "which the automatic reconcile tick skips forever" → "which every
    automatic trigger holds until an explicit Retry".

### 3.7 `src/main/brain/intelligence-index.ts`

1. `export function triggerForReason(reason: IntelligenceIndexReason): WorkTrigger` → `'click'` is `'user'`,
   everything else `'automatic'`.
2. `StateSchema` gains `lastFinishedAt: z.number().nonnegative().optional()` ("when the last pass ended,
   success or failure").
3. `runIntelligenceIndex(reason, s?: Settings)`: for an automatic reason, first
   `await whenMaintenanceWindowOpens()`, then resolve `const settings = s ?? getSettings()` (a wait can be
   long; never use settings read before it). Then, still for automatic reasons only:
   `if (indexUnavailable(settings)) { reportDeferred('intelligence-index', 'ledger_unavailable'); return { ran: false, queued: 0, lastIndexedAt: lastIndexedAt(settings) } }`.
   The fallback work passes `{ force: true, trigger: triggerForReason(reason) }`. The success write becomes
   `{ lastSuccessAt: now, lastFinishedAt: now }`; `recordFailure` writes `lastFinishedAt: Date.now()` too.
   The click path is unchanged apart from the trigger.
4. `catchUpIntelligenceIndexIfNeeded(now?: number, s?: Settings)`: `await whenMaintenanceWindowOpens()`,
   then `const at = now ?? Date.now()`, `const settings = s ?? getSettings()`,
   `const state = readIntelligenceIndexState(settings)`, and decide with
   `shouldCatchUp(state.lastFinishedAt ?? state.lastSuccessAt, at)`. Rename `shouldCatchUp`'s first
   parameter to `lastPassAt` and update its doc: "Catch up when no pass finished after the last slot."
5. Module doc: "Catch up on launch if a slot was missed" → "Catch up once the maintenance window opens if no
   pass finished after the last slot."

### 3.8 `src/main/brain/intelligence-work.ts`

`startIntelligenceWork(deps, reason: IntelligenceIndexReason)`:
```ts
const trigger = triggerForReason(reason)
// Unattended recaps are model work nobody is waiting on: each one takes the maintenance slot.
const generate = trigger === 'user'
  ? deps.generate
  : (meeting: MissingSummary) => runAsMaintenance(() => deps.generate(meeting))
const recaps = recapMissingMeetings({ ...deps, generate })
const backfill = deps.backfill({ force: true, trigger }, recaps)
```
Everything else unchanged. Update the module's one-line doc to mention the trigger.

### 3.9 `src/main/brain/intelligence-pass.ts`

`startBackfill(undefined, { route: 'intelligence-pass', trigger: 'user' })`. Nothing else.

### 3.10 `src/main/brain/consolidate.ts` (B2-F4)

- Delete `scheduleConsolidation` entirely (exported, never imported; confirmed by grep at base).
- Fix docs: module doc → "runs once per launch from the boot brain step; the named Intelligence slots own the
  recurring pass". `canConsolidateToday`: "the gate `runConsolidationIfDue`'s hourly timer checks on every
  tick" → "the gate `runConsolidationIfDue` checks". `recordConsolidationPass` / `runConsolidationIfDue`:
  replace "hourly tick"/"the timer below" with "a launch". Add to `runConsolidationIfDue`'s doc:
  "An automatic trigger: exhausted and backed-off sources stay held (infra/scheduler/policy.ts)."
- No logic change: `startBackfill()` is already automatic by default.

### 3.11 `src/main/index.ts` (wiring only, seven edits, no logic)

| # | Where (base line) | Edit |
|---|---|---|
| E1 | imports | `import { noteUserInput, runAsMaintenance, settlePriorExit, startMaintenanceGate } from './infra/scheduler/maintenance'` |
| E2 | `app.whenReady().then(async () => {` ~8830, directly after `initLogging()` | `startMaintenanceGate({ interactiveActive: () => localRuntime.activeStreams() + fmRuntime.activeStreams() > 0 })` and `app.on('web-contents-created', (_event, contents) => { contents.on('input-event', (_inputEvent, input) => noteUserInput(input.type)) })` (one comment line: "M2-0033: unattended model work waits for the maintenance gate.") Must precede the onboarding-exclusive early `createWindow()`. |
| E3 | `createWindow`, right after `observability = startRunObservability({...})` ~2556 | `settlePriorExit(observability.priorShutdown)` |
| E4 | boot warm ~8906–8915 | provisioning `.then`: `warmLocalIfReady()` → `void runAsMaintenance(warmLocalIfReady)`; replace `setTimeout(warmLocalIfReady, 4000).unref?.()` with `void runAsMaintenance(warmLocalIfReady)`. Comment above: "The warm is unattended model work: it waits for the maintenance gate, so it never starts in the boot quiet period." Leave `warmLocalIfReady`'s body untouched (the model load is single-flight in local-runtime, so an extraction admitted right after the warm joins the same start). |
| E5 | `wireIntelligenceIndexWork` ~1685 | `setIntelligenceIndexWork((reason) => startIntelligenceWork({ ...same deps }, reason))` |
| E6 | `IPC.brainRebuildAll` ~8050 | `startRebuild(getSettings(), { trigger: 'user' })` |
| E7 | boot block consolidation comment ~9434 | Replace "Hourly consolidation is demoted … helper stays imported so existing settings/tests keep compiling …" with "Consolidation runs once per launch; the named slots own the recurring pass. Both are automatic triggers (infra/scheduler/policy.ts)." |

Do not move, reorder or wrap the 15 s boot block, its `try` blocks, or its `'}, 15_000)'` terminator
(mqa-175 source contracts slice it).

### 3.12 Files explicitly NOT changed

- `src/main/llm/local-routing.ts`, `src/main/llm/prewarm.ts`: prewarm eligibility stays interactive-only
  (L02-F3 verifier: "Do not add a fourth prewarm branch"; L02-REFACTOR-3 rejected for the same reason).
- `src/main/screen-preprocess.ts`, `src/main/import-memory-pressure.ts`, `speculativeLocalWorkAllowed`:
  interactive-adjacent opt-in work; see §8.
- Renderer, preload, `shared/ipc.ts` contracts: no new fields.
- `src/main/brain/store.ts`: M2-0003 semantics unchanged.

## 4. What NOT to do

- Do not add another boolean like `respectRetryBackoff`, `allowUnexhaust` or `manual`. `trigger` is the only
  retry-permission input, and it defaults to `automatic`.
- Do not call `reviveExhausted` anywhere but the `revive` branch of `startBackfill`.
- Do not reset exhaustion because `sourceVersion` or ctime changed. Exhaustion ends only by explicit Retry or a
  new live save (`enqueueIngest`), as today.
- Do not change the `sourceVersion` string format (INV-VERSION).
- Do not gate live jobs, user-triggered jobs, reconcile-strategy jobs, interactive asks or the renderer
  `local:prewarm` IPC behind the maintenance gate.
- Do not cancel an in-flight maintenance stream to "pre-empt" it; pre-emption is at dispatch.
- Do not put the gate into `speculativeLocalWorkAllowed()`: that would block interactive prewarm and the
  ask-path early ensure for two minutes after every launch.
- Do not widen `localPrewarmEligible` for ingest routing.
- Do not add early returns inside `requestBackfill` or `requestBackfillRun` (M2-0003 §4: their preparing and
  observer bookkeeping is subtle). Ledger suspension lives in `reconcileMeetingsInBackground`,
  `startBackfill`, `enqueueIngest` and `runIntelligenceIndex` only.
- Do not audit per job or per refused admission; audit per scan, per suspension kind, and once for the window.
  Never put file names, paths or error strings in `scheduler.job`.
- Do not detect test runs (`VITEST`, `NODE_ENV`) to disable anything; the gate is inert until started.
- Do not use the async dataless detector in the synchronous scan (M2-0031/M2-0193 own async scans).
- Do not add `setInterval`, and no timer outside `infra/scheduler/` (FF-14).
- Do not add new source-text tests; update the one existing regex (§5.5) minimally.
- Do not copy this design, the ledger or finding text into the public repository, commits or PR body;
  cite ticket and finding ids only.

## 5. Tests: red first, then implementation

D-28: nothing runs on the Mac. Commit A (tests only) is pushed first; its CI run is the red evidence
(behavioural failures for §5.1; module-not-found for §5.2–5.3 is expected and must be stated as such). Then
the implementation commits turn it green. All fixtures live in each test's own `mkdtempSync` folders.

### 5.1 NEW `src/main/brain/ingest-retry-policy.test.ts` (EX-1, EX-3; real ingest, `createStream` mocked)

Harness as `ingest-resilience.test.ts` (provider key sweep, `setSettings({ meetingsFolder })`,
`whenIndexWritesSettle` in `afterEach`). Capture audits with
`vi.mock('../logger', async (orig) => ({ ...(await orig()), auditLog: auditLogMock }))`. Identify which
file a `createStream` call is for by a unique marker word in each transcript body. A **relaunch** is:
`await whenIndexWritesSettle()`, `vi.resetModules()`, re-import `electron` and re-apply the `getPath`
override, re-import `./ingest`, `./consolidate`, `./intelligence-index`, `../infra/scheduler/maintenance`,
start the gate open (`uptimeMs: () => 121_000`, `schedule: () => {}`, `interactiveActive: () => false`),
`settlePriorExit('clean')`, then run the boot sequence `resumeBackfillIfPending()`,
`reconcileMeetingsInBackground()`, `await runConsolidationIfDue()`, `requestBackfill()` (dashboard open),
`await catchUpIntelligenceIndexIfNeeded()`, and wait for idle.

Seeded ledger (five sources): `eligible.md` (no record), `backedoff.md` (`attempts: 2`, `retryAfter: now + 1 h`,
current `sourceVersion`), `exhausted.md` (`attempts: 6`, `exhausted: true`, `retryAfter` in the past),
`unreadable.md` (`attempts: 1`, `unreadable: { changedAtMs: <current ctime> }`), `unacked.md` (a saved
extraction written with `writeMeetingExtraction`, no `ok` record).

| # | Test | Red on base because |
|---|---|---|
| R1 | `EX-1: three relaunches leave exhausted, backed-off and unreadable records byte-for-byte as seeded and never call a model for them` | base boot resume/consolidation/catch-up revive `exhausted.md` and ignore the backoff |
| R2 | `EX-1: an eligible source is extracted exactly once across three relaunches` | green on base (guard) |
| R3 | `EX-1: a completed-but-unacknowledged extraction is merged without any model call and is not repeated` | green on base (guard) |
| R4 | `EX-1: each automatic scan audits scheduler.job with heldExhausted, heldBackedOff and heldUnreadable counts and no file names` | no such event |
| R5 | `EX-3: an explicit Retry (requestBackfillRun({ force: true, trigger: 'user' })) revives an exhausted source; one more failure lands at attempts 1, not 7` | green on base (base revives on every call); it guards the one path that must keep reviving |
| R6 | `EX-3: a transcript that cannot be read spends no attempt, is held by automatic scans while its ctime is unchanged, and is retried after the file changes` (mock `readSavedFile` via `vi.mock('../transcripts', …)` to throw an `ETIMEDOUT`-shaped errno error for one path; change the file by rewriting its content) | base increments `attempts` |
| R7 | `EX-3: with a foreign-key index.json, reconcile, resume, consolidation and the catch-up start no model call, write nothing under .brain, and audit ledger_unavailable once per kind` (reuse the `foreignKeyIndexBytes` fixture from `ingest-index-unavailable.test.ts`; compare a sha256 of `index.json` and a `readdirSync(brainDir)` listing before/after) | base catch-up writes `intelligence-index.json` and no audit exists |

### 5.2 NEW `src/main/brain/ingest-maintenance-gate.test.ts` (EX-2; real ingest)

Gate started with a controllable `let uptime` and a captured `schedule` (`scheduled.push({ run, ms })`).

| # | Test |
|---|---|
| G1 | `EX-2: in the boot quiet period, resume and reconcile queue work but call no model; firing the quiet-period wake at 120 s starts it and audits window-open with uptimeMs >= 120000` |
| G2 | `EX-2: after an unclean exit, nothing starts after 120 s until a deliberate input; a mouse move does not count, a mouseDown does` |
| G3 | `EX-2: with no settlePriorExit the gate stays closed after 120 s (fail-closed)` |
| G4 | `EX-2: automatic extraction runs one model call at a time (three held streams → one in flight), while a user Retry during the quiet period runs at once with full cloud concurrency` |
| G5 | `EX-2: an active interactive local stream holds automatic extraction; once it ends, the next nudge (requestBackfill) starts it` |
| G6 | `EX-2: a user Retry during the quiet period promotes already-queued automatic jobs instead of leaving them waiting` |
| G7 | `EX-2: live saves (enqueueIngest) and reconcile-strategy repairs are never held by the gate` |

### 5.3 NEW `src/main/infra/scheduler/policy.test.ts` and `maintenance.test.ts` (unit)

- `admitSource`: table-driven over {no record, pending, backed-off same version, backed-off changed version,
  backoff elapsed, exhausted, unreadable same ctime, unreadable ctime moved (mtime and size unchanged),
  unreadable with unknown ctime both times} × {user, automatic}.
- `retryStateAfterFailure`: attempts 1..6 give delays 1, 2, 4, 8, 16, 30 min and `exhausted` at 6; an
  unreadable failure keeps attempts and sets no `retryAfter`/`exhausted`; a genuine failure after an
  unreadable one clears `unreadable`. `reviveExhausted` keeps `sourceVersion` and removes only the three fields.
- `deferralFor`: each reason, and the priority order; `'unknown'` prior exit does not hold.
- `isDeliberateInput`: presses count; `mouseMove`, `mouseWheel`, `mouseEnter`, `keyUp` do not.
- maintenance: not started → everything admitted, no audit; `runAsMaintenance` serializes (second work
  starts only after the first settles, including on rejection); FIFO waiters; `beginMaintenance` throws when
  deferred; release is idempotent; listeners fire in a microtask after a release; interactive re-check is
  scheduled only while waiters exist; `whenMaintenanceWindowOpens` resolves once, and immediately when open;
  `reportDeferred` audits once per kind and reason.

### 5.4 Extend existing suites

- `intelligence-index.test.ts`: (a) `catch-up no-ops after a failed pass finished after the elapsed slot`
  (seed `{ lastSuccessAt: 0, lastFinishedAt: <after slot> }`) — red on base; (b) `catch-up waits for the
  maintenance window, then re-checks` — gate started in quiet period, catch-up promise pending, window
  opened, work called once; (c) `an automatic pass with an unavailable ledger runs no work and audits
  ledger_unavailable, while a click still runs`; (d) the fallback path passes `trigger: 'user'` for click and
  `'automatic'` for schedule. Update the `toEqual` at ~line 298 to also expect `lastFinishedAt: expect.any(Number)`.
- `intelligence-work.test.ts`: `startIntelligenceWork(h.deps, 'click')` in existing cases; add
  `passes trigger user for a click and automatic for a scheduled pass` and `an automatic pass generates
  recaps only through the maintenance gate` (gate closed → `generate` not called; opened → called).
- `run-observability.test.ts`: `exposes the prior run's shutdown classification` (`'unclean'` fixture).
- `consolidate.test.ts`: no change needed; if it imports `scheduleConsolidation` anywhere, delete that use.

### 5.5 Existing tests to update (they encode the old defaults)

- `ingest-resilience.test.ts`: import `MAX_INGEST_ATTEMPTS` from `../infra/scheduler/policy`; the loops that
  drive a source to exhaustion and the "manual retry" calls pass `{ trigger: 'user' }` (the loop retries
  inside the backoff window, which only a user Retry may do); the automatic assertion becomes `startBackfill()`.
- `ingest-backfill.test.ts` ~215 and `ingest-audit-fixes.test.ts` ~505: drop `respectRetryBackoff` (the
  default now respects backoff).
- `screen-preprocess-wiring.contract.test.ts` ~45: the regex expects
  `refreshScreenPreprocess()\s*void runAsMaintenance\(warmLocalIfReady\)`.
- Any other CI failure where a test retries a failed source inside its backoff window and means "manual
  retry": pass `{ trigger: 'user' }`. Never weaken an assertion; report each such change in the PR.

### 5.6 CI evidence (PR evidence table)

Red run URL (commit A), green run URL (HEAD) for Quality checks ubuntu + windows, Operator Worker, Security,
compared with baseline run 36267674617. `npx tsc --noEmit -p tsconfig.node.json` and `-p tsconfig.web.json`
clean locally. Not run: packaged EX / census (§6 A3).

## 6. Acceptance amendments (proposed to the orchestrator)

| # | Ticket text | Amendment |
|---|---|---|
| A1 | "prewarm eligibility aligned with ingest routing" | "The boot-time local warm is unattended model work and passes the same maintenance gate as background extraction. Prewarm eligibility is not widened for ingest routing (L02-F3 verified P3; widening adds standing RAM for work nobody waits on)." |
| A2 | "node scripts/qa/ex-suite.mjs (hermetic)" | "EX-1..3 hermetic = `src/main/brain/ingest-retry-policy.test.ts` + `ingest-maintenance-gate.test.ts`, run in CI (D-28)." |
| A3 | "EX-1..3 also run as real packaged relaunches … census" | Unchanged as a requirement, recorded `BLOCKED_EXTERNAL` on this ticket until the M2-0009 census tool and the QA account (M2-0190) exist. Evidence to collect then: per relaunch, `app.started` → `scheduler.job window-open uptimeMs ≥ 120000` → first `local.runtime.start` after it; `scheduler.job scanned` held counts matching the seeded ledger; no `llama-server` in the process census before 120 s. Seed with `encryptTranscripts: false` so the ledger is inspectable. |
| A4 | "src/main/index.ts changes are call-site swaps only" | "index.ts changes are wiring only: the seven edits in §3.11, no logic." Declared index.ts order (PLAN): 0030 → 0031 → 0193 → **0033** → 0037; the PR stays draft in the merge queue until its turn. |
| A5 | scope_paths | Add `src/main/infra/scheduler/maintenance.ts`, `src/shared/brain.ts`, `src/main/logger.ts`, `src/main/infra/observability/run-observability.ts`, `src/main/brain/intelligence-index.ts`, `src/main/brain/intelligence-pass.ts` and the tests. `llm/local-routing.ts` and `llm/prewarm.ts` stay in scope as "unchanged by design". |
| A6 | "at most one at a time, pre-empted by interactive requests" | "At most one unattended model call at a time (automatic extraction, automatic recap, boot warm). Interactive work pre-empts at dispatch; an admitted call is not cancelled." |
| A7 | "until the first user interaction" | "until the first deliberate input (mouseDown, rawKeyDown, keyDown, touchStart) to any Métis window". |
| A8 | "unavailable/dataless failures … wait for an availability change" | "Any failure to read the transcript on this device spends no attempt; automatic scans retry it only once the file's ctime changes (hydration, eviction or an edit)." |

## 7. Data flow

```
trigger ── user ─────────────► admitSource: revive exhausted / queue ──► job(trigger:user) ──► pump: runs now
        └─ automatic ─ ledger unavailable? → reportDeferred, stop
                      └─ admitSource: hold(exhausted|backed-off|unreadable) / queue ──► job(trigger:automatic)
                                                                                         │ reconcile? runs now
                                                                                         └ model? pump waits for
   maintenanceDeferral(): quiet 120 s → prior exit unknown/unclean & no input → holder → interactive stream
   wake(): quiet timer | settlePriorExit | first press | release | 5 s interactive re-check (waiters only)
job fails ─ read threw? → attempts kept, unreadable{ctime} │ else attempts+1, retryAfter, exhausted at 6
```

## 8. Residuals and known limits (documented, out of scope)

- **Automatic source-refresh rebuild** (`maybeStartSourceRefresh`) still purges immediately when drift is
  found, which also clears exhaustion; only its re-extraction waits for the gate. Proposed follow-up:
  preserve exhausted records for unchanged sources across an automatic purge.
- **Recaps have no attempt budget.** A deterministically failing recap retries once per automatic pass
  (at most the three slots, catch-up and import-idle a day) and no longer on every launch. Follow-up if the
  census shows it matters.
- **Opt-in background screen context** (`screen-preprocess.ts`) can still start the local runtime in the
  first 120 s; it is interactive-adjacent and belongs to M2-0116. The EX/census QA profile keeps
  `backgroundScreenContext` off.
- **A Retry clicked while earlier automatic work is still queued** promotes that work but does not rescan,
  so exhausted sources are revived by the next Retry (same as today's "already running" path).
- **Rebuild during held work** is refused as "indexing is already running" for up to the quiet period
  (same semantics as today while work runs).
- The scans themselves are still synchronous stats/readdirs on the main thread at +15 s (M2-0031).
- `reportDeferred` audits once per process; a ledger that recovers and fails again in one session is not
  re-audited.
- Whether ctime moves on Windows OneDrive hydration is DERIVED from libuv using NTFS ChangeTime; the pure
  policy test pins the rule, the Windows census confirms the platform.

## 9. Commits (conventional, `[M2-0033]`, body says why, trailer per the operating rules)

1. `test(brain): pin one retry policy and the maintenance gate across relaunches [M2-0033]` — §5 tests only (red).
2. `feat(scheduler): add the retry policy and the maintenance gate [M2-0033]` — policy.ts, maintenance.ts,
   logger event, run-observability field, shared schema field.
3. `fix(brain): route every backfill caller through the retry policy [M2-0033]` — ingest.ts, intelligence-*,
   consolidate.ts (dead code and doc fixes), existing test updates.
4. `fix(main): wire the maintenance gate at boot [M2-0033]` — index.ts E1–E7 and the one contract regex.

Draft PR into `m2/integration`, title `fix(brain): one retry policy for every backfill caller and a boot quiet period for model work [M2-0033]`.

## 10. Size estimate

policy.ts ~95 lines, maintenance.ts ~120, ingest.ts ~+70/−45, intelligence-index/work/pass ~+35/−10,
consolidate.ts −25, index.ts ~+12/−3, schema/logger/observability ~+10. Tests ~700 lines. About 10–12 h
including two CI round trips.
