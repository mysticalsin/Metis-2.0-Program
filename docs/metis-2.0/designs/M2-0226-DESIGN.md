# M2-0226 design: a fresh install never saves a voiceprint without an explicit opt-in

Designer: Opus. Branch `m2/M2-0226-speaker-id-opt-in`, draft PR into `m2/integration`.
Base: fast-forward the branch to `origin/m2/integration` (`6aa8cb36`) before the first commit. The worktree is at
`4ec75897`, an ancestor 5 commits behind. None of those 5 commits touches the speaker region of `index.ts` (lines
249-501 are identical), `speaker-id.ts`, `ipc.ts` or `Settings.tsx` (OBSERVED). Use
`git merge --ff-only origin/m2/integration`. The branch has no commits of its own.
Status: design only. Codex/Sonnet implements from this file. Finding: `M2-0013-SRC-13-DEFAULT-ON` (SRC-13, F-13).
Decision: D-31 is not yet in the DECISIONS.md register. This design implements the posture the lead directed:
opt-in for persistence, existing data and the existing `enabled` choice kept. That posture is labelled ASSUMED until
D-31 is answered. §7 lists the two sub-questions D-31 should settle.

## 0. Why this design, in one paragraph

Today `speakerId` is a single switch, `{ enabled: true }` by default. It turns on two very different things. The
first is session-local attribution: in-memory "Speaker N" clusters and echo defense that die with the meeting. The
second is persistence: `userData/voiceprints.json`, which three automatic paths write without asking. Those paths are
(a) `snapshotSession`, which flushes the operator's own echo-defense voiceprint after every live meeting with 3 or more
mic windows, (b) `resetSession`, which flushes the legacy operator buffer at the next meeting's start, and (c)
`enrollFromSnapshot`, which folds a Teams-VTT-named cluster into a named profile. No production path calls `enroll()`.
SRC-13 asks for the first by default and the second only with approval. So the fix separates them. `enabled` stays
default-on and keeps meaning "label speakers in this meeting". A new `speakerId.saveVoiceprints` is default-off and is
the explicit opt-in. `speaker-id.ts` enforces it at the one function every voiceprint-adding write goes through
(`enrollEmbeddings`), through an injected predicate whose absence means "never". `index.ts` binds that predicate to
live settings. Settings sparse-persists only user overrides. So a settings file written before this change parses to
`saveVoiceprints: false` with its stored `enabled` intact, and the schema default is the whole migration. The
existing `voiceprints.json` is not touched. Its profiles still name people (the read path is unchanged). It only stops
growing until the user opts in, and the new Settings row says so.

## 1. Invariants

**INV-OPT-IN-WRITES.** `speaker-id.ts` adds to `voiceprints.json` only when `canSaveVoiceprints()` returns true at the
moment of that write. "Adds" means creating the file or adding or reinforcing a profile, `__operator__` included. The
predicate defaults to `() => false`, so a caller that never asked the user cannot persist a voiceprint by omission.

**INV-FRESH-DEFAULT.** `SettingsSchema` and `DEFAULT_SETTINGS` resolve `speakerId` to
`{ enabled: true, saveVoiceprints: false }`. The same holds when `speakerId` is missing from the settings layers, and
when a stored `speakerId` lacks `saveVoiceprints`, which is every settings file written before this change.

**INV-SESSION-LOCAL-DEFAULT.** With `enabled` on and saving off, THEM windows still get "Speaker N" labels and
in-session echo defense (the live operator buffer). All of that state is in memory and is dropped by the existing
session boundaries.

**INV-LEGACY-KEPT.** This change never deletes, rewrites or migrates an existing `voiceprints.json`. Its profiles
still match (`matchProfile` and `operatorCentroid` are unchanged). The stored `speakerId.enabled` value keeps its
meaning.

**INV-LIVE-BINDING.** Production reads the opt-in from `getSettings()` at each write, not once at construction.
Turning "Save voiceprints" off in Settings stops the next write in the same process.

**INV-REMOVAL-UNGATED.** `deleteProfile` works whatever the opt-in says. The gate is on adding data, never on
removing it.

**INV-OFF-SWITCH-UNCHANGED.** `speakerId.enabled = false` still means no speaker work at all, through the existing
`applySpeakerIdPolicy`/discard path. That holds whatever `saveVoiceprints` says.

## 2. Code changes per file

### 2.1 `src/shared/ipc.ts`

Replace the `speakerId` comment and schema (currently lines 1342-1350) with the block below. The rewrite also drops
the dated history from the comment, which now states only invariants.

```ts
  // Speaker Intelligence (docs/SPEAKER-INTELLIGENCE-PLAN.md): "who's speaking" labels on THEM transcript lines
  // from on-device voice embeddings (sherpa-onnx, same addon as Parakeet).
  // `enabled` (default on) gives session-local labels: "Speaker N" clusters held in memory for one meeting. The
  // embedding model ships in every build and speaker-id.ts degrades to unlabeled lines when the extractor is
  // unavailable, so this default costs nothing where it cannot work.
  // `saveVoiceprints` (default off) is the explicit opt-in for anything that outlives a meeting: only while it is
  // on does speaker-id.ts add to userData/voiceprints.json (named profiles and the operator's own echo-defense
  // voiceprint). A stored speakerId written before this field existed parses with it off.
  speakerId: z
    .object({
      enabled: z.boolean().default(true),
      saveVoiceprints: z.boolean().default(false)
    })
    .default({ enabled: true, saveVoiceprints: false }),
```

In `DEFAULT_SETTINGS` (line 1725): `speakerId: { enabled: true, saveVoiceprints: false },`

### 2.2 `src/main/speaker-id.ts` (the only enforcement point)

1. **Header, store bullet (lines 7-8).** Replace with:
   ```
    *  - the persistent voiceprint store (userData/voiceprints.json): named profiles from explicit enrollment and
    *    the Teams-VTT auto-enrollment flywheel, written only under the user's opt-in (SpeakerIdDeps.canSaveVoiceprints);
   ```
2. **Header, Privacy paragraph (lines 31-34).** Replace it. The current "removed with the profile delete (P2 Settings
   surface)" describes a surface that does not exist.
   ```
    * Privacy: embeddings and profiles never leave the machine. Nothing is added to the store unless
    * canSaveVoiceprints() is true at the moment of the write, so without the opt-in every label is session-local.
    * Profiles already on disk are never removed by that gate and are still matched; deleteProfile removes one
    * regardless of it. PLAN §3.6. The operator's own voiceprint is stored under a reserved name (see
    * OPERATOR_PROFILE_NAME) that listProfiles() never surfaces — it exists purely for echo defense, never as a
    * "person" a user could see or delete from a future enrollment UI by mistake.
   ```
3. **`SpeakerIdDeps`.** Add this after `storePath`:
   ```ts
     /** True only while the user has opted in to saving voiceprints (Settings → Save voiceprints). Asked at every
      *  write, so turning it off stops the next one. Absent means never, so a caller cannot persist a voiceprint by
      *  omission. Matching against profiles already on disk does not depend on it. */
     canSaveVoiceprints?: () => boolean
   ```
4. **`createSpeakerId`.** Add this right after the `storePath` line:
   `const canSaveVoiceprints = deps.canSaveVoiceprints ?? (() => false)`
5. **`enrollEmbeddings`, the gate.** Append one line to the comment above it and make the predicate the first check:
   ```ts
     // Every write that adds a voiceprint (enroll, the flywheel, both operator flushes, enrollFromSnapshot) passes
     // through here, so this is the one place the save opt-in is enforced.
     const enrollEmbeddings = (name: string, embeddings: readonly Float32Array[]): boolean => {
       if (!canSaveVoiceprints() || !name.trim() || embeddings.length === 0) return false
   ```
   Nothing else in the function changes.
6. **Return docs on the interface** (so the contract reads true):
   - `enroll`: `/** Enroll (or reinforce) a named voice profile from one or more turn embeddings' raw audio. False without the save opt-in. */`
   - `autoEnrollFromLabeledWindows`: in the last sentence change `e.g. every candidate cluster was below the quality gate)`
     to `e.g. every candidate cluster was below the quality gate, or saving voiceprints is off)`.

`loadProfiles`, `saveProfiles`, `matchProfile`, `operatorCentroid`, `deleteProfile`, `listProfiles`, `snapshotSession`
and `resetSession` do not change (see §4).

### 2.3 `src/main/index.ts` (the production binding; add to scope_paths)

1. `getSpeakerId` (line 254):
   ```ts
   function getSpeakerId(): SpeakerId {
     if (!speakerIdInstance) {
       speakerIdInstance = createSpeakerId({ canSaveVoiceprints: () => getSettings().speakerId.saveVoiceprints })
     }
     return speakerIdInstance
   }
   ```
   The arrow reads settings on every call (INV-LIVE-BINDING). Never pass a boolean captured at construction.
2. The stale comment in `completeLiveSpeakerReceipt` (lines 302-304) says "snapshotSession intentionally keeps its
   existing qualified-operator flush behavior; consent/encrypted operator-profile persistence remains Task 7-P3."
   Its consent half becomes false with this change. Replace those words with: "snapshotSession flushes the qualified
   operator buffer only under the save-voiceprints opt-in, which speaker-id.ts enforces; encrypting that store
   remains Task 7-P3."

No other `index.ts` change. `backfillSpeakerNames` still calls `enrollFromSnapshot`, which now returns 0 without the
opt-in, and its `auditLog('speaker.auto_enrolled')` already fires only when the count is above 0.

### 2.4 `src/renderer/src/components/Settings.tsx` (add to scope_paths; copy-only UI, existing style)

Replace the speaker block in `LocalAiSection` (lines 2438-2445). A dependent row renders only while its parent is
on, as in the Brain consolidation section (line 7936). Both `onChange`s spread the current object: `setSettings`
validates a patch through the schema, so `{ enabled: v }` alone would silently reset `saveVoiceprints` to false. With
the new field required in `PublicSettings['speakerId']`, the old literal no longer type-checks, so the compiler
enforces the spread.

```tsx
        <div className="flex flex-col gap-0.5">
          <ToggleRow
            label="Speaker identification (beta)"
            desc="Label who's speaking in meetings using on-device voice recognition. Voice data never leaves this device."
            on={settings.speakerId.enabled}
            onChange={(v) => patch({ speakerId: { ...settings.speakerId, enabled: v } })}
          />
          {settings.speakerId.enabled && (
            <ToggleRow
              label="Save voiceprints"
              desc="Save voiceprints on this device so Métis can name people in later meetings. Off unless you turn it on. Voiceprints saved by earlier versions are kept and still used."
              on={settings.speakerId.saveVoiceprints}
              onChange={(v) => patch({ speakerId: { ...settings.speakerId, saveVoiceprints: v } })}
            />
          )}
        </div>
```

Do not pass `disabled`. In `ToggleRow`, `disabled` adds the "Managed by your organization" chip.

### 2.5 Files explicitly NOT changed

`src/main/store.ts` needs no migration code (§0). Also unchanged: `src/preload/**`, every other IPC channel,
`speaker-cluster.ts`, `speaker-embedding-*`, `docs/SPEAKER-INTELLIGENCE-PLAN.md`, and `listen.ts`.

## 3. Tests: red first, then the fix

Commit 1 holds tests only. CI runs `npm run typecheck`, including `check-test-types.mjs`, before `npm test`. So every
commit-1 test uses only APIs that already exist. `createSpeakerId` gets no new dep, `setSettings` is not called with
the new field, and schema inputs go through `parse(unknown)`. Commit 1 must type-check clean and fail at runtime on
exactly the six tests marked RED. Commit 2 holds the fix, the opt-in updates to existing suites, and the two
opt-in wiring tests that need the new field. CI must be fully green on it.

### 3.1 `src/main/speaker-id.test.ts` (commit 1: add; commit 2: opt existing suites in)

Commit 1: add `readdirSync` and `writeFileSync` to the `node:fs` import, and add this describe after
`describe('labelWindow')`:

```ts
describe('voiceprints are saved only after the user opts in', () => {
  /** What a caller that never asked the user builds: no canSaveVoiceprints. */
  const withoutOptIn = () =>
    createSpeakerId({ createExtractor: fakeExtractor, storePath: () => join(dir, 'voiceprints.json') })

  it('without the opt-in, a meeting still gets session labels but writes no voiceprint', async () => {        // RED
    const id = withoutOptIn()
    for (let i = 0; i < 4; i++) {
      expect(await id.labelWindow(windowFor(2))).toMatchObject({ name: 'Speaker 1', source: 'cluster' })
    }
    for (let i = 0; i < 3; i++) await id.observeOperatorWindow(windowFor(3))
    expect(await id.labelWindow(windowFor(3))).toMatchObject({ echo: true })

    expect(id.autoEnrollFromLabeledWindows([{ clusterLabel: 'Speaker 1', name: 'Jane Doe' }])).toBe(0)
    expect(await id.enroll('Jane Doe', [windowFor(2)])).toBe(false)
    id.resetSession()
    expect(id.createSession('live:1')).toBe(true)
    for (let i = 0; i < 3; i++) {
      await id.observeSessionOperatorWindow('live:1', windowFor(3), 'live')
      await id.labelSessionWindow('live:1', windowFor(5), 'live')
    }
    const snapshot = id.snapshotSession('live:1')
    expect(snapshot).not.toBeNull()
    expect(id.enrollFromSnapshot(snapshot!, [{ clusterLabel: 'Speaker 1', name: 'Bob Smith' }])).toBe(0)
    expect(readdirSync(dir)).toEqual([])
  })

  it('keeps a voiceprint store from an earlier version byte-for-byte and still names its voices', async () => { // RED
    const store = join(dir, 'voiceprints.json')
    const earlier = JSON.stringify({
      version: 1,
      profiles: [{ name: 'Jane Doe', centroid: [0, 0, 1, 0, 0, 0, 0, 0.1], samples: 4 }]
    })
    writeFileSync(store, earlier)
    const id = withoutOptIn()

    expect(await id.labelWindow(windowFor(2))).toMatchObject({ name: 'Jane Doe', source: 'profile' })
    expect(await id.enroll('Jane Doe', [windowFor(2)])).toBe(false)
    for (let i = 0; i < 3; i++) await id.labelWindow(windowFor(5))
    expect(id.autoEnrollFromLabeledWindows([{ clusterLabel: 'Speaker 1', name: 'Bob Smith' }])).toBe(0)
    expect(id.listProfiles()).toEqual([{ name: 'Jane Doe', samples: 4 }])
    expect(readFileSync(store, 'utf8')).toBe(earlier)
  })
})
```

Why these tests are red before the fix (DERIVED): `autoEnrollFromLabeledWindows` returns 1 in the first and
`enroll` returns true in the second. The same tests also pin INV-SESSION-LOCAL-DEFAULT (labels and in-session echo
defense still work) and INV-LEGACY-KEPT.

Commit 2: `makeId` opts in, because every suite that uses it pins what voice memory does *after* the opt-in. Add
`canSaveVoiceprints: () => true` to its `createSpeakerId` call with this doc line:
`/** An identifier whose user has opted in to saving voiceprints: the behaviour the suites below pin. */`.
Add the same dep to the two direct constructions whose meaning depends on persistence. These are "drops late
operator/profile mutations after resetSession" (line 217) and "discardSession revokes pending label,
operator-observation, and enrollment continuations" (line 249). Without it, their "nothing persisted" assertions
would pass trivially. Leave lines 202, 274 and 407 as they are, because they only label.

### 3.2 `src/main/speaker-id-off-switch.test.ts`: the end-to-end fresh install

This file already runs real `index.ts` functions through `actualFunction` (TS AST, then vm), and the ticket's
verification line names it. The test runs the production `getSpeakerId` over the **real** settings store with
nothing on disk and the **real** voiceprint store at its default path under a temp `userData`. Only the native
embedding is replaced.

Commit 1 additions:
- Imports: add `afterEach` to the vitest import. Add `existsSync`, `mkdtempSync` and `rmSync` to the `node:fs`
  import, `tmpdir` from `node:os`, and `app` from `electron`. Add `getSettings` from `./store`, and
  `createSpeakerId, type SpeakerId, type SpeakerIdDeps, type SpeakerLabel` from `./speaker-id`. Add
  `vi.mock('electron')` (the hermetic root `__mocks__/electron.ts`). The existing tests import no electron-dependent
  code, so the mock does not affect them.
- A second top-level describe:

```ts
describe('Save voiceprints opt-in wiring', () => {
  const OPERATOR_VOICE = 4
  let userData: string
  const voiceprints = (): string => join(userData, 'voiceprints.json')
  const windowFor = (axis: number): Float32Array => Float32Array.from([axis])
  const voice = (axis: number): Float32Array => {
    const embedding = new Float32Array(8)
    embedding[axis] = 1
    embedding[7] = 0.1
    return embedding
  }

  beforeEach(() => {
    userData = mkdtempSync(join(tmpdir(), 'metis-voiceprints-'))
    vi.mocked(app.getPath).mockReturnValue(userData)
  })
  afterEach(() => rmSync(userData, { recursive: true, force: true }))

  /** index.ts's own lazy singleton over the real settings and voiceprint stores; only the native embedding is
   *  replaced. Each call models a new app process. */
  function startApp(): SpeakerId {
    const getSpeakerId = actualFunction('getSpeakerId', {
      speakerIdInstance: null,
      getSettings,
      createSpeakerId: (deps: SpeakerIdDeps = {}) =>
        createSpeakerId({ ...deps, createExtractor: () => ({ compute: async (samples: Float32Array) => voice(samples[0]) }) })
    })
    return getSpeakerId()
  }

  /** One live meeting as index.ts drives it: mic and THEM windows, the post-save snapshot, then the Teams-VTT
   *  backfill naming "Speaker 1". */
  async function holdMeeting(
    id: SpeakerId,
    key: string,
    theirVoice: number,
    theirName: string
  ): Promise<{ label: SpeakerLabel | null; enrolled: number }> {
    expect(id.createSession(key)).toBe(true)
    let label: SpeakerLabel | null = null
    for (let i = 0; i < 3; i++) {
      await id.observeSessionOperatorWindow(key, windowFor(OPERATOR_VOICE), 'live')
      label = await id.labelSessionWindow(key, windowFor(theirVoice), 'live')
    }
    const snapshot = id.snapshotSession(key)
    if (!snapshot) throw new Error(`no enrollment snapshot for ${key}`)
    return { label, enrolled: id.enrollFromSnapshot(snapshot, [{ clusterLabel: 'Speaker 1', name: theirName }]) }
  }

  it('a fresh install (nothing on disk) labels a whole meeting but writes no voiceprint', async () => {     // RED
    const meeting = await holdMeeting(startApp(), 'live:1', 2, 'Jane Doe')
    expect(meeting.label).toMatchObject({ name: 'Speaker 1', source: 'cluster' })
    expect(meeting.enrolled).toBe(0)
    expect(existsSync(voiceprints())).toBe(false)
  })
})
```

This is red before the fix (DERIVED). The old `getSpeakerId` calls `createSpeakerId()` with no gate, so the snapshot
flushes the 3-window operator buffer to `voiceprints.json` and `enrollFromSnapshot` returns 1.

Commit 2 adds `setSettings` to the `./store` import and two tests to the same describe:

```ts
  it('after the user turns Save voiceprints on, the next process names the voice it learned', async () => {
    setSettings({ speakerId: { enabled: true, saveVoiceprints: true } })
    expect((await holdMeeting(startApp(), 'live:1', 2, 'Jane Doe')).enrolled).toBe(1)

    const restarted = startApp()
    expect(restarted.createSession('live:2')).toBe(true)
    await expect(restarted.labelSessionWindow('live:2', windowFor(2), 'live'))
      .resolves.toMatchObject({ name: 'Jane Doe', source: 'profile' })
  })

  it('turning Save voiceprints off stops the next write and keeps what was saved', async () => {
    setSettings({ speakerId: { enabled: true, saveVoiceprints: true } })
    const id = startApp()
    await holdMeeting(id, 'live:1', 2, 'Jane Doe')
    const saved = readFileSync(voiceprints())

    setSettings({ speakerId: { enabled: true, saveVoiceprints: false } })
    expect((await holdMeeting(id, 'live:2', 5, 'Bob Smith')).enrolled).toBe(0)
    expect(readFileSync(voiceprints())).toEqual(saved)
  })
```

The last test is the only one that catches a construction-time capture of the opt-in, in either `index.ts` or
`speaker-id.ts` (INV-LIVE-BINDING). It also proves that the operator flush is gated inside a single process.

### 3.3 `src/shared/ipc.test.ts` (commit 1; add to the existing `describe('SettingsSchema')`)

```ts
  it('a fresh install labels speakers in the meeting but saves no voiceprints', () => {                     // RED
    const fresh = { enabled: true, saveVoiceprints: false }
    expect(SettingsSchema.parse(DEFAULT_SETTINGS).speakerId).toEqual(fresh)
    const { speakerId: _omit, ...withoutSpeakerId } = DEFAULT_SETTINGS
    expect(SettingsSchema.parse(withoutSpeakerId).speakerId).toEqual(fresh)
  })

  it('a profile saved before the voiceprint opt-in keeps its speaker-ID choice and saves no voiceprints', () => { // RED
    for (const enabled of [true, false]) {
      expect(SettingsSchema.parse({ ...DEFAULT_SETTINGS, speakerId: { enabled } }).speakerId)
        .toEqual({ enabled, saveVoiceprints: false })
    }
  })
```

The second test is the whole existing-user migration contract. `store.getSettings` merges `{ ...DEFAULT_SETTINGS,
...managed, ...userLayer }`, and a pre-change user layer holds at most `speakerId: { enabled }`.

### 3.4 `src/renderer/src/components/Settings.local-models.test.tsx` (commit 1; add to scope_paths)

This file already renders the real `LocalAiSection`. Extract its settings construction into one helper and use it
from `renderModel` and from the new describe, with no duplication:

```ts
function publicSettingsWith(overrides: Record<string, unknown>) {
  return PublicSettingsSchema.parse({
    ...DEFAULT_SETTINGS, hasApiKey: false, providerReady: false, visionReady: false, hasKeys: {},
    hasEncryption: true, resolvedMeetingsFolder: '', ...overrides
  })
}
```
`renderModel` becomes
`publicSettingsWith({ localLlm: { ...DEFAULT_SETTINGS.localLlm, enabled, modelId: model.id } })`. Then add:

```ts
describe('Speaker identification in Local AI', () => {
  /** The same healthy included-model card as the MQA-319 cases, with only speakerId varied. */
  function renderWithSpeakerId(speakerId: unknown): string {
    view.models = [bundled]
    return renderToStaticMarkup(<LocalAiSection settings={publicSettingsWith({ speakerId })} patch={() => {}} />)
  }

  it('offers Save voiceprints, off, on a fresh install and says voiceprints from earlier versions are kept', () => { // RED
    const html = renderWithSpeakerId(DEFAULT_SETTINGS.speakerId)
    expect(html).toContain('aria-checked="false" aria-label="Save voiceprints"')
    expect(html).toContain('Voiceprints saved by earlier versions are kept and still used.')
  })

  it('hides Save voiceprints while speaker identification is off', () => {
    expect(renderWithSpeakerId({ enabled: false, saveVoiceprints: true })).not.toContain('Save voiceprints')
  })
})
```

`Toggle` renders `role`, `aria-checked` and `aria-label` in that order, so the contiguous string ties the checked
state to this switch and not to "Enable Métis Local". The second test is a guard and passes on both commits.

### 3.5 Other existing suites (commit 2: opt in, nothing else)

- `src/main/speaker-id-session.test.ts`: add `canSaveVoiceprints: () => true` to `makeId` (same doc line as §3.1)
  and to the direct construction at line 240 ("shares one extractor and profile repository").
- `src/main/speaker-session-wiring.test.ts`: add `canSaveVoiceprints: () => true` to `realSpeakerId`. The
  `sessionApi` harness passes `createSpeakerId: () => options.id` and ignores the new argument, and its fake
  `getSettings` is never consulted for the opt-in.

### 3.6 Evidence (PR table)

| Check | Where | Expected |
|---|---|---|
| `npx tsc --noEmit -p tsconfig.node.json` and `-p tsconfig.web.json` | local, both commits | clean |
| Red run | CI, commit 1 | typecheck green; exactly 6 failures: the RED tests in §3.1 (2), §3.2 (1), §3.3 (2), §3.4 (1) |
| Green run | CI, commit 2 (head) | Quality checks ubuntu and windows, Operator Worker and Security green; job set matches baseline run 36267674617 |

Not run locally (D-28): every vitest, npm and node command, and `check-test-types.mjs` (CI runs it inside
`npm run typecheck`). UI evidence is the renderer test on the real `LocalAiSection`. A packaged-app screenshot of the
row is taken only if an existing CI capture lane can reach Settings; otherwise it goes on the not-run list.

## 4. What NOT to do

1. **Do not flip `enabled` to default-off.** Settings persist sparsely, so every existing user who never touched the
   toggle would silently lose speaker labels, which contradicts "keep their setting". It would also remove the
   session-local default attribution that SRC-13 asks to keep.
2. **Do not grandfather.** Do not derive `saveVoiceprints: true` from an existing `voiceprints.json` (or anything
   else) in `store.ts` or `speaker-id.ts`. That is persistence without an explicit opt-in (acceptance 2) and would
   need a tri-state setting.
3. **Do not delete, move, rewrite or re-version `voiceprints.json`** on upgrade or when saving is turned off
   (acceptance 3, INV-LEGACY-KEPT).
4. **Do not gate `saveProfiles` or `loadProfiles`.** Gating `saveProfiles` would block `deleteProfile`
   (INV-REMOVAL-UNGATED). Gating reads changes what existing users see, which is out of the lead's scope. That
   stricter posture is a D-31 question (§7).
5. **Do not add a second check** in `snapshotSession`, `resetSession`, `enrollFromSnapshot` or `index.ts`.
   `enrollEmbeddings` is the single choke point, and one definition cannot drift.
6. **Do not import `./store` into `speaker-id.ts`**, and do not default the predicate to reading settings. The
   module stays store-free, and its suites mock `app.getPath` to `/tmp`. A settings-reading default would make every
   suite that omits the dep read a real path.
7. **Do not bind a captured value** (`canSaveVoiceprints: () => captured`) in `getSpeakerId` (INV-LIVE-BINDING).
8. **Do not patch `speakerId` without spreading the current object** anywhere, now or later.
9. **Do not add an IPC channel, a notification, an acknowledgement flag or a saved-voices list** in this PR. Those
   belong to the follow-up in §7.
10. No source-text regex tests, no TODOs, no commented-out code, and no ticket ids in test names or production
    comments.

## 5. Acceptance amendments (proposed to the lead)

1. **Item 1, sharpened.** "With no settings.json and no managed config, a complete live meeting driven through
   index.ts's getSpeakerId writes no userData/voiceprints.json, including the operator's own echo-defense profile.
   The meeting covers mic and THEM windows, the post-save snapshot, and the Teams-VTT name backfill. THEM lines still
   get session-local 'Speaker N' labels."
2. **Item 2, made precise.** "voiceprints.json is added to only while settings.speakerId.saveVoiceprints is true.
   That happens through the Settings 'Save voiceprints' toggle or an administrator's managed-config, and it is read
   at every write. The schema default and every settings file that predates the field resolve to false."
3. **Item 3, made concrete.** "An existing voiceprints.json is kept byte-for-byte and its profiles still name people.
   Nothing is added to it until the user opts in. The stored speakerId.enabled choice is kept. The Settings 'Save
   voiceprints' row states that voiceprints saved by earlier versions are kept and still used." Being "told" is
   delivered in place, in the Settings row. A proactive notice is proposed in §7.
4. **Item 4, unchanged.** It is met by §3.2's fresh-install test (real settings store, production getSpeakerId, real
   voiceprint path).
5. **scope_paths, add:** `src/main/index.ts`, `src/main/speaker-id-off-switch.test.ts`,
   `src/main/speaker-id-session.test.ts`, `src/main/speaker-session-wiring.test.ts`, `src/shared/ipc.test.ts`,
   `src/renderer/src/components/Settings.tsx`, `src/renderer/src/components/Settings.local-models.test.tsx`.
6. **verification, extend to:** `npx vitest run src/main/speaker-id.test.ts src/main/speaker-id-off-switch.test.ts
   src/main/speaker-id-session.test.ts src/main/speaker-session-wiring.test.ts src/shared/ipc.test.ts
   src/renderer/src/components/Settings.local-models.test.tsx` (CI only).

## 6. Commits and PR

0. `git merge --ff-only origin/m2/integration`.
1. `test(speaker-id): a fresh install must not save a voiceprint without an opt-in [M2-0226]`. The body explains
   why: speakerId defaults on, and three automatic paths persist voiceprints (the operator flush at snapshot and at
   reset, and the Teams-VTT enrollment). These tests pin the fresh default, the legacy store, and the Settings copy.
   Push it and record the red run URL.
2. `fix(speaker-id): save voiceprints only after an explicit opt-in [M2-0226]`. The body explains why: SRC-13 wants
   attribution session-local by default and persistence only with approval. It also covers why the gate sits at
   `enrollEmbeddings` and why the schema default is the whole migration for existing users. Push it and record the
   green run URL.

Both commits end with the operating-rules trailer. Open a DRAFT PR into `m2/integration` titled
`fix(speaker-id): a fresh install saves no voiceprint without an explicit opt-in [M2-0226]`. Use the template with
kit refs SRC-13 and F-13, finding `M2-0013-SRC-13-DEFAULT-ON`, the §3.6 evidence table and the not-run list. State
under "What changed" that D-31 is open and that this PR follows the lead's opt-in direction.

## 7. Risks, residuals, and items for the lead

- **Behaviour change for fresh installs (intended).** Echo defense uses only the in-meeting operator buffer until the
  user opts in, so the first few THEM windows of each meeting cannot yet be checked against the operator's voice
  (DERIVED from `operatorCentroid`). Live names from Teams-VTT learning need the opt-in. The post-save transcript
  renaming from Teams does not: `applySpeakerNames` is unaffected.
- **D-31 sub-question A, for the owner.** Should voiceprints saved automatically under the old default still be
  *matched* while "Save voiceprints" is off? This design keeps them matched, per the lead's "keep their data and
  setting". The strict alternative (session-local only until the user re-consents) is a small follow-up: gate the
  two read sites (`matchProfile` and `operatorCentroid`) on the same predicate and change one copy sentence.
- **D-31 sub-question B, for the owner.** An administrator's managed-config can set `saveVoiceprints: true` for the
  organisation, as with every other managed setting. If the owner rules that biometric consent must be individual,
  that key must be excluded from the managed layer (a `store.ts` follow-up).
- **Proposed ticket (the lead files it with the next free id).** *Title:* "Settings shows saved voiceprints and can
  forget them." *Summary:* `listProfiles` and `deleteProfile` have no IPC and no UI. A user told that earlier
  voiceprints are kept cannot see or remove them, and SRC-13's exit evidence names data-rights deletion. The
  "speaker identification" search keyword also sits on the Speech tab, while the row lives in the AI tab's Local AI
  card (OBSERVED, Settings.tsx keywords vs line 1470). *Acceptance:* Settings lists saved voices (names, plus the
  operator's own as "Your voice"), with Forget for each and Forget all. Forgetting removes the entry from
  voiceprints.json, and the file goes when it is empty. Behaviour tests cover the IPC handler and the renderer row.
  Searching "voiceprints" lands on the row. *scope_paths:* `src/shared/ipc.ts`, `src/preload/index.ts`,
  `src/main/index.ts`, `src/main/speaker-id.ts`, `src/renderer/src/components/Settings.tsx`, and their tests.
- **Residual, for the lead to route.** `voiceprints.json` is written as plaintext JSON with mode 0o600 (OBSERVED,
  `saveProfiles`). `docs/SPEAKER-INTELLIGENCE-PLAN.md` §privacy says it is encrypted with the store key, and the
  `index.ts` comment defers encryption to "Task 7-P3". This design does not claim which M2 ticket, if any, owns it.

## 8. Size

About 30 changed production lines across 4 files, and about 170 test lines across 6 files. Roughly 2 hours of
implementation plus two CI cycles.
