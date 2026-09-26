# P8 — Hermetic tests: how test/node processes reach Tony's real OneDrive meetings folder

Evidence labels per software-architecture-engineer v1.4.0: **OBSERVED** (read directly from the
checked-out code), **DERIVED** (follows deductively from OBSERVED code), **ASSUMED** (plausible,
not directly verified), **UNKNOWN** (not established). All file/line refs are against the read-only
reference checkout `/Users/tony/AI-Brain-build/metis-2.0` (origin/main `2bf21f1c`, v1.9.6) unless
marked `[r11-work]` for `/Users/tony/metis-r11-work/repo`. No tests were run to produce this report
(per the hard rule); every claim below is a static read of the source.

---

## 1. Root cause — the exact call chain

**OBSERVED.** `resolveMeetingsFolder()` (`src/main/transcripts.ts:580-591`) resolves the meetings
folder in this order:

1. `settings.meetingsFolder` if set (returns verbatim, no OneDrive lookup).
2. Else `process.env.ASKTOTO_USERDATA` (the packaged-app QA hook) → `<that>/Métis Meetings`.
3. Else `detectOneDrive() || app.getPath('documents')` → `<that>/Métis Meetings`.

`detectOneDrive()` (`transcripts.ts:507-546`) is **pure Node** — `homedir()` from `node:os` and
`existsSync`/`readdirSync` from `node:fs` — with **no Electron dependency at all**. On macOS it does:

```js
const base = join(homedir(), 'Library', 'CloudStorage')
if (existsSync(base)) {
  const dirs = readdirSync(base)
  const personal = dirs.find((d) => /^OneDrive-(?!SharedLibraries)/i.test(d))
  ...
}
```

`__mocks__/electron.ts` mocks `app.getPath`, `safeStorage`, `ipcMain`, etc. — but it **does not, and
structurally cannot, mock `node:os`'s `homedir()`**, because `detectOneDrive()` never goes through
Electron. Every test file that does `vi.mock('electron')` (108 files) is fully protected from the
`electron` module and completely *unprotected* from `detectOneDrive()`. On Tony's own Mac (or any
worktree checked out under his account), `homedir()` returns his real `/Users/tony`, and
`~/Library/CloudStorage/OneDrive-MantuGroup` genuinely exists — so `detectOneDrive()` returns that
real path, and `resolveMeetingsFolder({ meetingsFolder: '' })` returns literally
`$HOME/Library/CloudStorage/OneDrive-MantuGroup/Métis Meetings` — the exact path in the incident
report.

**OBSERVED, concrete reproducer already in the suite** — `src/main/update-persistence.test.ts:24-38`:

```ts
vi.mock('electron')                                   // only electron is mocked
import { resolveMeetingsFolder } from './transcripts'
...
const dir = resolveMeetingsFolder({ meetingsFolder: '' } as Settings)   // line 25
...
const before = resolveMeetingsFolder({ meetingsFolder: '' } as Settings) // line 36
const after  = resolveMeetingsFolder({ meetingsFolder: '' } as Settings) // line 37
```

No `ASKTOTO_USERDATA` is set anywhere in this file. On any machine with a real OneDrive mount, this
test's assertions (`dir.endsWith('Métis Meetings')`, no install-dir markers) still pass — the test
is *green* precisely because it never checks that the resolved folder is fake. This is a currently
existing, currently-passing test that resolves to Tony's real vault path every time it runs on his
Mac.

`resolveMeetingsFolder`'s non-`meetingsFolder`-set branch (`transcripts.ts:589-590`) also calls
`copyForwardLegacyMeetingsOnce(folder)` (`transcripts.ts:549-573`) with that **real** folder. That
function:
- checks a marker under `app.getPath('userData')` (mocked → safe, fake path) — proceeds if absent;
- computes `legacy = join(dirname(folder), 'AskToto Meetings')` — a **real** path
  (`$HOME/Library/CloudStorage/OneDrive-MantuGroup/AskToto Meetings`, the pre-rebrand sibling
  folder this app used before it was renamed from AskToto to Métis);
- if `legacy` exists, `mkdirSync`s the real `folder` if absent and `copyFileSync`s every `.md` file
  from it into the real folder.

This is a **real write** into Tony's OneDrive, not just a path computation, gated only on whether a
pre-rebrand "AskToto Meetings" folder happens to still sit next to his real OneDrive root — plausible
given the app's rebrand history. `[r11-work]`'s own MQA-348 commit message (see §3) independently
confirms this exact hazard and adds: on a OneDrive Files-On-Demand (cloud-only) placeholder,
`copyFileSync` can **block synchronously forever**, hanging the whole vitest worker past its
`testTimeout` — a second, independent failure mode (test hangs, not just data corruption).

## 2. How that reaches `.brain/index.json` and gets it quarantined

**OBSERVED.** `brainDir(settings)` (`src/main/brain/store.ts:34-36`) is `join(resolveMeetingsFolder(settings), '.brain')` — it inherits the exact same real-folder hazard. `readIndex(s)` (`store.ts:471-477`):

```ts
export const readIndex = (s: Settings): BrainIndex => {
  const idx = readJson(s, 'index.json', (v) => BrainIndexSchema.parse(v))
  if (idx) return idx
  quarantineUnusableIndex(s)              // fires whenever idx is null
  return BrainIndexSchema.parse({})
}
```

`readJson` (`store.ts:223-246`) does `parse(JSON.parse(readSavedFile(p)))` inside a `try`; `readSavedFile` → `decodeSaved` → `tryDecodeSaved` (`transcripts.ts:286-309`) decrypts a v2 envelope via `decryptEnvelopeV2`, which calls the **mocked** `safeStorage.decryptString`/`encryptString` (`__mocks__/electron.ts:17-22` — a trivial `enc:`-prefix round trip, not real AES/Keychain). Tony's **real** `index.json` was encrypted by the real macOS Keychain (or the file-backend AES-GCM key in `secrets.ts`) on his real device. A test process's fake `safeStorage` cannot decrypt real ciphertext — `JSON.parse`/decrypt throws, `readJson`'s catch sets `value = null`, and `readIndex` calls:

```ts
function quarantineUnusableIndex(s: Settings): void {   // store.ts:447-469
  const p = join(brainDir(s), 'index.json')
  if (indexQuarantineAttempted.has(p)) return
  let buf: Buffer
  try { buf = readFileSync(p) } catch { return }
  if (buf.length === 0) return
  indexQuarantineAttempted.add(p)
  ...
  const to = join(brainDir(s), `index.corrupt-${ISOtimestamp}.json`)
  renameSync(p, to)          // <-- renames the REAL index.json, unconditionally
  ...
}
```

There is **no check anywhere in this function** of who wrote the file, which app/device/key
produced it, or whether the "unusable" verdict came from a genuine corruption versus a process that
was never entitled to read it in the first place. `indexQuarantineAttempted` is a plain in-process
`Set` — "one quarantine attempt per path per process" (the code's own comment) is exactly why the
incident count (62 times on 09-23) reads as *N separate test-process invocations*, each contributing
at most one rename, not 62 distinct vulnerable tests.

**Scope check (OBSERVED):** I audited every test file that calls `readIndex(`, `writeIndex(`,
`brainDir(`, or `ensureMeetingsFolder(` directly (21 files, all under `src/main/brain/*.test.ts` plus
`src/main/mqa-175-brain-index-poison.test.ts`) — every one of them explicitly sets
`settings.meetingsFolder` to a `mkdtempSync`'d directory, so **none of those specific files** is
individually vulnerable today. I also checked every test file that imports
`resolveMeetingsFolder`/`detectOneDrive`/`./transcripts` without visibly setting `meetingsFolder`
(`recap-status.test.ts`, `transcripts.summary-only.test.ts`, `recall.test.ts`,
`onboarding-demo-guard.mqa278.test.ts`, `speaker-session-wiring.test.ts`,
`recap-status-wiring.test.ts`, `speaker-id-off-switch.test.ts`,
`diagnostics-export.contract.test.ts`, `erasure-completeness.contract.test.ts`,
`selftest.test.ts`) — all of them either set `meetingsFolder` to a temp dir, stub
`resolveMeetingsFolder`/`detectOneDrive` directly, or only pattern-match source text via `vm`/regex
(never execute the real function). **`update-persistence.test.ts` is the one file I found that
currently calls the real, unstubbed `resolveMeetingsFolder` with an empty `meetingsFolder` and no
`ASKTOTO_USERDATA`.** It does not itself call `readIndex`, so by itself it does not prove the
quarantine step — but it does prove the *reachability* of the real path, memoizes `_oneDriveCache`
to it for the rest of that file's run, and (via `copyForwardLegacyMeetingsOnce`) can write into the
real OneDrive folder. Given 461 test files, many recently added/edited by parallel Sonnet
agents/worktrees, and no lint/CI gate that would catch a new test omitting `meetingsFolder` +
`ASKTOTO_USERDATA`, this is a **latent hazard the suite as a whole does not close** — one omission in
any current or future test file is sufficient to reproduce the exact incident, and
`update-persistence.test.ts` shows the omission already exists on `main`. **DERIVED**, not
exhaustively proven for every one of 461 files given the read-only/no-run constraint.

### Ties to Tony's P0 bugs
**DERIVED.** A quarantined `index.json` forces the brain to rebuild its entire index from every
transcript on disk on the next read — on Tony's real, presumably large, real meeting history, this is
exactly the kind of full-corpus re-ingest that would (a) spike CPU/memory ("very heavy on the PC")
and (b) make the "History" view (which reads the brain index) hang while the rebuild runs, or appear
to freeze if a concurrent process (a real running app instance racing a test/agent process over the
same real files) is fighting over the same `index.json`/rename at the same time. I did not run
anything to confirm this correlation; flagging it as the most plausible mechanism linking this defect
to the two P0 symptoms, for the P0 root-cause lane to confirm/refute against `BUG-ROOT-CAUSES.json`'s
B1/B2/B3 (which this task's inputs say already cover sidecar-orphaning as B2/B3 separately — this is
a **distinct**, additional mechanism, not a restatement of B1/B2/B3).

## 3. Prior art already sitting uncommitted in `/Users/tony/metis-r11-work/repo` (MQA-348)

**OBSERVED.** That worktree (branch `work/metis-r11-20260924-083623`, forked from the same
`2bf21f1c` as our reference checkout) has an **uncommitted, unmerged, untriaged** fix for exactly
this defect, tagged MQA-348. `git status` shows `vitest.config.ts` modified and
`src/main/test-hermetic-home.test.ts` untracked (never committed to any branch). This matches
`PRIOR-EXECUTION.json`'s coverage-critic note verbatim: *"metis-r11-work contains a fully-green,
unmerged 13-file fix set (incl. a critical MQA-348 defect) that is undocumented in metis-2.0-exec
and has not been triaged, reviewed, or merged."* I have not run these tests (out of scope / hard
rule); treat the design below as **DESIGNED**, not **LOCALLY_TESTED**, until someone re-verifies it
against the current `main` tip.

The uncommitted `vitest.config.ts` diff (full text, for exact porting):

```ts
import { mkdtempSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'path'
...
function playwrightBrowsersPath(realHome: string): string {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) return process.env.PLAYWRIGHT_BROWSERS_PATH
  if (process.platform === 'darwin') return join(realHome, 'Library', 'Caches', 'ms-playwright')
  if (process.platform === 'win32') {
    return join(process.env.LOCALAPPDATA || join(realHome, 'AppData', 'Local'), 'ms-playwright')
  }
  return join(process.env.XDG_CACHE_HOME || join(realHome, '.cache'), 'ms-playwright')
}
const testHome = mkdtempSync(join(tmpdir(), 'metis-test-home-'))
const hermeticHomeEnv = {
  HOME: testHome,
  USERPROFILE: testHome,
  OneDrive: '',
  OneDriveCommercial: '',
  OneDriveConsumer: '',
  PLAYWRIGHT_BROWSERS_PATH: playwrightBrowsersPath(homedir()),
  METIS_TEST_HOME: testHome
}
...
test: {
  globals: true,
  environment: 'node',
  env: hermeticHomeEnv,
  ...
}
```

and the untracked canary test `src/main/test-hermetic-home.test.ts` (27 lines, reproduced in full —
this IS the regression tripwire the task asked for):

```ts
import { describe, it, expect, vi } from 'vitest'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'

vi.mock('electron')

import { detectOneDrive, resolveMeetingsFolder } from './transcripts'
import type { Settings } from '@shared/ipc'

describe('MQA-348 — test workers run under a hermetic home', () => {
  it('MQA-348 — homedir() is the fresh per-run test home, not the real user profile', () => {
    const home = homedir()
    expect(process.env.METIS_TEST_HOME).toBeTruthy()
    expect(home).toBe(process.env.METIS_TEST_HOME)
    expect(basename(home)).toMatch(/^metis-test-home-/)
    expect(existsSync(join(home, 'Library', 'CloudStorage'))).toBe(false)
    expect(existsSync(join(home, 'OneDrive'))).toBe(false)
  })

  it('MQA-348 — the default meeting store cannot resolve into a real OneDrive folder', () => {
    expect(detectOneDrive()).toBe('')
    const folder = resolveMeetingsFolder({ meetingsFolder: '' } as Settings)
    expect(folder).toBe(join('/tmp/asktoto-test-documents', 'Métis Meetings'))
    expect(folder).not.toMatch(/CloudStorage|OneDrive/)
  })
})
```

**Where this design is right, and where it stops short (gaps to close, not present in r11-work):**

1. It sets `HOME`/`USERPROFILE` at Vitest's `test.env` layer (injected before any worker imports
   test code) — this is the *correct* mechanism, better than a `setupFiles` script, because it is
   guaranteed to land before `detectOneDrive`'s module-level `_oneDriveCache` memoizes anything.
2. **Gap — `__mocks__/electron.ts` is untouched.** `app.getPath('userData')` /
   `('documents')` still return the **hardcoded, fixed strings** `/tmp/asktoto-test-userdata` /
   `/tmp/asktoto-test-documents` (confirmed by the canary test itself asserting against that literal
   path). Two problems this leaves open:
   - it is not unique per run — concurrent vitest workers/processes (multiple parallel agent
     worktrees, or a normal multi-thread vitest run) all collide on the same fixed path, so one
     run's `COPY_FORWARD_MARKER` or partial writes can corrupt another concurrent run's state
     (exactly the class of flake `0e4e0497`'s commit message describes for a different fixed path);
   - it is not tied to `testHome`/`METIS_TEST_HOME`, so the "hermetic" guarantee is really two
     independent, uncoordinated conventions (one for `homedir()`-derived paths, one for
     Electron-derived paths) that happen not to collide today only because nothing currently
     crosses between them.
3. **Gap — `APPDATA`/`LOCALAPPDATA`/`TMPDIR`/`TMP`/`TEMP` are not overridden.** Not exploitable by
   *this* codebase's own logic today (Windows `OneDrive*` env vars are covered; `app.getPath` is
   always mocked so raw `APPDATA` is never consulted directly by this repo's code) but it is the
   literal ask in the ticket ("HOME/APPDATA/userData/TMPDIR"), and closing it is cheap insurance
   against any dependency that reads those env vars directly (Node's own tmp-file helpers, a
   third-party lib, a future contributor's code).
4. **Gap — no fail-loudly tripwire beyond the one canary test.** The design achieves hermeticity by
   construction (there is nothing real left to resolve to), which is the right primary defense, but
   it does not catch a **hardcoded real-path literal** typed into a future test by mistake (e.g. a
   copy-pasted fixture containing `/Users/tony/...`) — that class of mistake bypasses `HOME`
   entirely. Not the mechanism behind the observed incident, but worth a cheap, narrow guard (see
   §4.3) given how it is being hit in practice (parallel agents editing this suite all day).
5. Not addressed at all by r11-work: the **production-side** ownership check on
   `quarantineUnusableIndex` (§5) — MQA-348 is a test-hygiene fix, not a defense for the packaged
   app's own multi-device/foreign-key scenario.

## 4. Fix design — part 1: hermetic vitest environment

### 4.1 Files to change

- **`vitest.config.ts`** (repo root) — port the `[r11-work]` diff from §3 verbatim (imports,
  `playwrightBrowsersPath`, `testHome`, `hermeticHomeEnv`, `env: hermeticHomeEnv` in `test:{}`), then
  extend `hermeticHomeEnv` with:
  ```ts
  APPDATA: join(testHome, 'AppData', 'Roaming'),
  LOCALAPPDATA: join(testHome, 'AppData', 'Local'),
  TMPDIR: join(testHome, 'tmp'),
  TMP: join(testHome, 'tmp'),
  TEMP: join(testHome, 'tmp'),
  ASKTOTO_TEST_SANDBOX_ROOT: testHome   // new — see 4.2
  ```
  (create `join(testHome, 'tmp')` with `mkdirSync(..., { recursive: true })` next to the
  `mkdtempSync` call, since several existing tests already do
  `mkdtempSync(join(tmpdir(), 'asktoto-...'))` and should transparently land inside the sandbox once
  `TMPDIR` is honored by `os.tmpdir()`).

- **`__mocks__/electron.ts`** — stop hardcoding `/tmp/asktoto-test-userdata` /
  `/tmp/asktoto-test-documents`. Derive both from the same sandbox root the config just set:
  ```ts
  const SANDBOX = process.env.ASKTOTO_TEST_SANDBOX_ROOT ?? '/tmp/asktoto-test-fallback'
  export const app = {
    getPath: vi.fn((name: string) => join(SANDBOX, name === 'userData' ? 'userdata'
                                          : name === 'documents' ? 'documents' : name)),
    ...
  }
  ```
  This makes every `app.getPath(...)` call land inside the same per-run temp dir as `HOME`, so a
  single `rm -rf` of `testHome` after the run cleans up everything, and concurrent runs never share a
  path. **Update `test-hermetic-home.test.ts`'s second assertion** (§3) to match — it currently
  hardcodes `/tmp/asktoto-test-documents` and would need to assert against
  `join(process.env.ASKTOTO_TEST_SANDBOX_ROOT!, 'documents', 'Métis Meetings')` instead once this
  lands.

- **`operator/vitest.config.ts`, `cloudflare-proxy/vitest.config.ts`,
  `operator/scripts/vitest.config.ts`** — checked (`OBSERVED`): these sub-projects do not import
  `src/main/transcripts.ts` or `src/main/brain/store.ts` (separate Worker/operator codebase), so they
  are not exposed to *this* defect. Lower-priority follow-up: give them the same `HOME`/`TMPDIR`
  sandbox purely for consistency/defense-in-depth, not because a concrete path was found.

### 4.2 Tests to add / port

- Port `src/main/test-hermetic-home.test.ts` from r11-work (§3), with the assertion fix in 4.1.
- Add one assertion the r11-work version doesn't have: that `detectOneDrive()`'s Windows branch is
  also inert — `expect(process.env.OneDrive).toBe(''); expect(process.env.OneDriveCommercial).toBe('')`
  — cheap, and this is the branch that only ever runs on the Windows CI runner where nobody would
  otherwise notice it silently doing the wrong thing.
- Add a regression test for `update-persistence.test.ts` itself once the fix lands: assert
  `resolveMeetingsFolder({ meetingsFolder: '' })` does **not** contain `CloudStorage`/`OneDrive` (the
  exact assertion the current file is missing — this is *why* it didn't catch the bug).
- Add one `brain/store.ts`-level test (new, not in r11-work): `readIndex`/`quarantineUnusableIndex`
  called with `meetingsFolder: ''` and no `ASKTOTO_USERDATA`, under the hermetic sandbox, resolves
  and quarantines only inside the sandbox — i.e. a test that would have caught this specific
  incident's *second* half (the quarantine, not just the path resolution), which nothing in
  r11-work's MQA-348 set currently exercises.

### 4.3 Optional defense-in-depth (design only, not required to close the observed incident)

A narrow, second-layer tripwire for the class of mistake §3.4 describes (a hardcoded real-path
literal bypassing `HOME` entirely): in the same new setup area, wrap only the two `node:fs` calls
`detectOneDrive` itself makes — `existsSync` and `readdirSync` — via a targeted `vi.mock('node:fs', ...)`
in a shared setup module that re-exports the real module and only intercepts calls whose resolved
path contains `Library/CloudStorage` (case-sensitive substring, checked against the **real**,
pre-override `homedir()` captured once at config-load time) with a thrown, descriptive error. This is
deliberately **not** a blanket `node:fs` monkeypatch (that would risk breaking any of the many
existing tests that legitimately `readFileSync(join(__dirname, 'recall.ts'))` off the real repo
checkout, which — because the checkout itself lives under `$HOME` — a whole-home block would also
catch as a false positive) and is scoped to exactly the two calls and the one substring that matter.
Recommend as a follow-up ticket, not bundled into the primary fix, given the primary
`HOME`-override fix already closes the reachable path by construction.

## 5. Fix design — part 2: production guard on `quarantineUnusableIndex`

### 5.1 What's confirmed

**OBSERVED, direct answer to "can the packaged app itself quarantine an index written by another
key without user consent": yes.** `quarantineUnusableIndex` (`store.ts:447-469`) renames any
`index.json` that fails to parse/decrypt, unconditionally, with no check of provenance. The
envelope format (`transcripts.ts:44,157-266`, `EnvelopeV2`) carries `kLocal` (wrapped for *this*
device's keychain or file-backend key) and an optional `kEscrow`, but **no plaintext, checkable
"who wrote this" field** — the only way to tell "mine" from "foreign" today is to attempt a full
decrypt, which is exactly the operation that fails for both a genuinely foreign key **and** a test
process's mocked `safeStorage`. The code's own doc comment already anticipates the legitimate
foreign-key case ("intact-elsewhere: encrypted under another device's keychain on a shared OneDrive
`.brain`") and accepts renaming it anyway, on the reasoning that a rename is non-destructive. That
reasoning is sound for *irrecoverable-elsewhere* corruption; it is not sound for *recoverable*
foreign-key content, where renaming still forces every reader of that shared `.brain` folder (any
other real device, or the same device next launch) to silently lose its live index and pay for a
full rebuild — which is very plausibly the mechanism behind "History sometimes freezes" (§2, ties to
P0).

### 5.2 Existing infrastructure to reuse (no new crypto/identity needed)

**OBSERVED.** `src/main/license/install.ts` already persists a stable, non-secret per-install
`installId: string` (`z.string().uuid()`) at `<userData>/identity.json`
(`identityPath`/`readInstallIdentity`/`writeInstallIdentity`, lines 22-73). `userData` is per-device,
per-OS-user, and — critically — **never** inside the synced `.brain` folder, so this ID is already
exactly the right shape of "which real app/device instance is this" signal the guard needs, with
zero new secret material and zero new IPC surface.

### 5.3 The guard

1. Add a plaintext (never-encrypted) sidecar next to the index: `.brain/index.owner.json`, e.g.
   `{ installId: string, updatedAt: ISOString }`. Plaintext is safe here — it reveals only "which
   install last wrote a good index," not meeting content.
2. `writeIndex` (`store.ts:478`) additionally stamps this sidecar (via `readInstallIdentity()`'s
   `installId`) on every successful write of `index.json` specifically — not on `writeGraph`/entity
   writes, which don't need it.
3. `quarantineUnusableIndex` gains a decision gate before the rename:
   - sidecar **absent** (no ownership record — first run, or a pre-fix install) → keep today's
     behavior (rename; this is the safe, backward-compatible default and matches "quarantine only by
     the owning app").
   - sidecar **present and `installId` matches** this device's own `readInstallIdentity().installId`
     → this really is *our own* index, merely torn/corrupt (e.g. an interrupted write) → proceed with
     the existing rename+rebuild path, unchanged.
   - sidecar **present and `installId` differs** → foreign-key content → **do not touch the file.**
     Log a warning (`mainLog.warn`, metadata only, no content) and return an in-memory empty index
     for *this session only* (never persisted, never overwriting the real file) so the app keeps
     working; surface a non-blocking notice the user can act on (e.g. a Settings-surfaced "this
     shared brain was written by a different device — take ownership / rebuild here?" action) rather
     than silently renaming. Implementing that UI affordance is a separate, larger ticket
     (Operator/Intelligence surface work is out of this task's scope); the store.ts-level change
     described here is the part that removes the silent, no-consent mutation.

### 5.4 Files to change (production)

- `src/main/brain/store.ts` — `quarantineUnusableIndex` (add the ownership gate), `writeIndex` (stamp
  the sidecar on success), a small new `readIndexOwner`/`writeIndexOwner` pair of helpers next to it.
- Import `readInstallIdentity` from `./license/install` (relative path
  `src/main/brain/store.ts` → `../license/install.ts`).
- `src/shared/ipc.ts` (or wherever `BrainIndex`-adjacent shared types live) — no schema change needed;
  the sidecar is a separate untyped-by-zod file, deliberately outside `BrainIndexSchema`.

### 5.5 Tests to add

- `quarantineUnusableIndex` with no sidecar present + a corrupt/undecryptable `index.json` → still
  renames (backward-compat case, matches today's `mqa-175-brain-index-poison.test.ts` behavior —
  extend that file rather than replace it).
- `quarantineUnusableIndex` with a sidecar whose `installId` matches this device's own → renames
  (own-file, genuinely-corrupt case).
- `quarantineUnusableIndex` with a sidecar whose `installId` differs → **does not** rename; the
  original bytes on disk are byte-identical after the call; `readIndex` returns an empty in-memory
  index without writing anything.
- `writeIndex` → after a successful write, `.brain/index.owner.json` exists and its `installId`
  equals the current device's `readInstallIdentity().installId`.

## 6. Summary — files to change / tests to add (consolidated)

| # | File | Change |
|---|------|--------|
| 1 | `vitest.config.ts` | Port r11-work's `hermeticHomeEnv` (HOME/USERPROFILE/OneDrive*/PLAYWRIGHT_BROWSERS_PATH/METIS_TEST_HOME), extend with APPDATA/LOCALAPPDATA/TMPDIR/TMP/TEMP/ASKTOTO_TEST_SANDBOX_ROOT |
| 2 | `__mocks__/electron.ts` | `app.getPath` derives from `ASKTOTO_TEST_SANDBOX_ROOT` instead of hardcoded `/tmp/asktoto-test-*` |
| 3 | `src/main/test-hermetic-home.test.ts` (new/ported) | Port from r11-work; fix the `/tmp/asktoto-test-documents` assertion to use the sandbox root; add Windows `OneDrive*` env assertions |
| 4 | `src/main/update-persistence.test.ts` | Add an explicit "never resolves into CloudStorage/OneDrive" assertion (the gap that let this ship green) |
| 5 | `src/main/brain/store.ts` | Ownership gate on `quarantineUnusableIndex`; sidecar stamp on `writeIndex`; two new small helpers |
| 6 | `src/main/mqa-175-brain-index-poison.test.ts` | Extend with the three ownership-gate cases from §5.5 |
| 7 | (new) `src/main/brain/store.test.ts` case, or extend an existing brain test | `readIndex`/`quarantineUnusableIndex` exercised under the hermetic sandbox with `meetingsFolder: ''` |
| 8 | `operator/vitest.config.ts`, `cloudflare-proxy/vitest.config.ts`, `operator/scripts/vitest.config.ts` | Lower priority: same sandbox env for consistency (not currently exposed to this defect) |
| 9 | (follow-up ticket, not bundled) | Narrow `existsSync`/`readdirSync` tripwire on the `Library/CloudStorage` substring, per §4.3 |

## 7. What I did not verify (explicitly out of scope / blocked by hard rules)

- Did not run `npm test`/`vitest`/any Node process against the repo (hard rule).
- Did not exhaustively execute-trace all 461 test files; the "no other file is currently vulnerable"
  claim in §2 is a grep+read audit of every file that imports the relevant functions, not a
  guaranteed-complete enumeration of every transitive call path (e.g. a helper imported by many files
  that itself calls `resolveMeetingsFolder` with a bad default would not necessarily show up in a
  grep for `meetingsFolder`) — recommend the hermetic `vitest.config.ts` fix regardless, since it
  closes the class of bug rather than each instance.
- Did not check whether metis-2.0's current `main` has diverged from r11-work's fork point
  (`2bf21f1c`) in `vitest.config.ts` beyond the hermetic diff — my read of both files' non-hermetic
  content was byte-for-byte identical at the time of this audit, but that should be re-diffed at
  merge time, not assumed.
- The Operator/Intelligence-surface "take ownership" UI affordance in §5.3 is named as a follow-up,
  not designed in detail here — out of this ticket's scope (test-hermeticity + store.ts guard).
