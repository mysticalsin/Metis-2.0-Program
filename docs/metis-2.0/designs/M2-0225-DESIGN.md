# M2-0225 design: decrypting saved bytes never creates secret-key.bin

Designer: Opus. Base: `edbd7020` (m2/integration, post-rewrite). Branch `m2/M2-0225-decrypt-no-key-creation`.
Status: design only. The implementer (Sonnet) follows this file. Finding: RF-G5.5-R2. Unblocks the held
`rf/rock-1-preserve-unreadable-index` merge (brain-index safety).

## 0. Why this design, in one paragraph

`decryptSecret()` gets its key from `getOrCreateKey()`. When the profile has no usable key file, that function falls
through to its tail, generates 32 random bytes and writes `secret-key.bin`. So every decrypt on a keyless profile
writes a key as a side effect of a read. That includes an `F:` transcript or `.brain/index.json` synced from another
install, `classifyIndexBytes` at boot, and a rebuild's re-check. The new key can never open those bytes anyway: they
were written under a different key. The same read-side creation also hits every other `decryptSecret` caller.
On packaged Windows it materialises a DPAPI-wrapped key the profile never needed (`auth.ts` reverse migration,
`license/secret-store.ts` fallback, an `ATKENC2` settings file). That contradicts `prepareFileKeyForWrite`'s own
promise that a keyless profile stays keyless. The fix belongs where the key is loaded. The loader gets one explicit
input, `createIfMissing`. Writers pass `true`, `decryptSecret` passes `false`. With `false`, the loader throws at the
exact point where it would otherwise start generating. Nothing above that point changes: every
`KeychainKeyRecoveryError` path, the raw-to-wrapped KEK migration on the boot read path, and the explicit-write
Keychain recovery. So "no key" is decided by the one piece of code that already decides it, and only two states
reach it: an absent file, or a zero-byte file on an unwrapped keystore. No caller changes. Every caller already catches
a throwing decrypt and maps it to "cannot be decrypted here".

## 1. Invariants

**INV-READ-NEVER-CREATES.** `decryptSecret` never writes, creates or regenerates a key. If the profile has no key
file, or has a zero-byte one while the keystore is unwrapped, the call throws
`Error('secrets: this profile has no file key to decrypt with')`. It writes no file, creates no directory, and leaves
`_key` unset.

**INV-FIRST-WRITE-CREATES.** On a keyless profile, `encryptSecret` and `prepareFileKeyForWrite` still generate and
persist the key the first time they run. They behave exactly as they do today, including the choice between a
wrapped and a raw key (`canWrap`) and the `0o600` mode.

**INV-FAIL-CLOSED (unchanged, byte-for-byte).** Every `KeychainKeyRecoveryError` throw site stays above the new guard
and is untouched. The class and its message are untouched too. A non-empty key file that does not yield a 32-byte key
is never overwritten, whether the caller is a read or a write.

**INV-SAME-KEY-MIGRATION (unchanged).** The decrypt path still runs the legacy raw-to-wrapped KEK migration
(`persistKeyFileAtomically`). That migration re-wraps the existing key and never creates a new one. The Windows
upgrade relies on the first `getSettings()` decrypt to perform it.

**INV-NO-NEGATIVE-CACHE.** The no-key outcome caches nothing. A later write in the same process still creates the
key, and a later decrypt in the same process then uses it.

**INV-CALLERS-UNCHANGED.** Every production `decryptSecret` caller already catches the throw. These are
`transcripts.ts` `tryDecodeSaved` (which returns `{ ok: false }`, so the brain sees `undecryptable`), `store.ts`
`tryParseSettingsBuffer`/`getApiKey`/`getDustRefreshToken`/Soniox, `auth.ts` (both loaders), `mcp/mcpSecrets.ts`
`readKeyFile`, and `license/secret-store.ts` `unwrap`. They all end in the same outcome as today. Only the error text
differs, and it is log-only. OBSERVED from source at `edbd7020`.

## 2. Code changes per file

### 2.1 `src/main/secrets.ts` (the only production change, about 20 changed lines)

1. **Rename and re-sign the loader.** Change `function getOrCreateKey(allowKeychainMigration = false): Buffer` to:

   ```ts
   function loadKey({
     createIfMissing,
     allowKeychainMigration = false
   }: {
     /** Generate and persist a key when this profile has none. Writes only: a decrypt never creates a key. */
     createIfMissing: boolean
     /** Explicit user write only: may ask the original Keychain to unwrap a legacy wrapped key. */
     allowKeychainMigration?: boolean
   }): Buffer {
   ```

   The body stays line-for-line identical. That covers `_key` short-circuit, `p`, `localKeystoreForced`,
   `keychainAvailable`, `canWrap`, and the whole `if (existsSync(p)) { … }` block. The only exceptions are the two
   comment edits in step 3 and the guard in step 2. Do not re-indent or reorder anything.

2. **Guard before generation.** Insert it right after the `if (existsSync(p)) { … }` block closes and before
   `const dir = app.getPath('userData')`:

   ```ts
     // This profile holds no key: no key file, or a zero-byte one on an unwrapped keystore. Only a write creates
     // the key. A decrypt fails here instead: a key generated now can never open bytes written before it, and
     // generating one would leave secret-key.bin behind as a side effect of a read.
     if (!createIfMissing) throw new Error('secrets: this profile has no file key to decrypt with')
   ```

   The generation tail below it (`mkdirSync`, `_key = randomBytes(32)`, `writeFileSync`) is not touched (see §3.9).

3. **Make two stale comments inside the block accurate.** Without these, they contradict the new contract.
   - In the `else if (buf.length > 0)` comment, change `(A genuinely zero-byte file falls through to regeneration below.)`
     to `(A genuinely zero-byte file holds no key and falls through to the no-key case below.)`
   - Change `// else (empty file): fall through to regenerate.` to `// else (empty file): no key, handled below.`

4. **Correct the loader's doc paragraph.** It is the four lines that begin with `Load or generate the per-install
   AES-256-GCM key.`, which currently sit above `isKeychainAvailable`. Change only those four lines. The KEK and
   Windows/DPAPI paragraphs below them stay as they are.

   ```ts
   /**
    * Load the per-install AES-256-GCM key; only a write (`createIfMissing`) may generate it.
    * Persisted to <userData>/secret-key.bin with mode 0o600; stable for the lifetime of the userData directory.
    * "No key" means no file, or a zero-byte file on an unwrapped keystore. Any other key file that does not
    * yield a 32-byte key fails closed and is never overwritten.
    *
   ```

   The removed sentence ("If the file is present but has the wrong length…, it is regenerated") is false today and would
   stay false after this change.

5. **Update the call sites.**
   - `prepareFileKeyForWrite`: `if (useFileBackend() || fileKeyExists()) loadKey({ createIfMissing: true, allowKeychainMigration: true })`
   - `encryptSecret`: `const key = loadKey({ createIfMissing: true })`
   - `decryptSecret`: `const key = loadKey({ createIfMissing: false })`. Its doc comment's `Throws if` line becomes
     `Throws if the buffer is too short, this profile has no file key (a decrypt never creates one), the authentication tag is wrong, or the key doesn't match.`
     The length check stays first, before the key load.

### 2.2 `src/main/transcripts.ts`: no change (it stays in scope_paths but is untouched)

The `F:` branch of `decryptEnvelopeV2` calls `decryptSecret`, and `tryDecodeSaved` already turns the throw into
`{ ok: false, reason }`. The `S:` self-heal rewrap calls `encryptSecret` deliberately. It is a write: it persists an
`F:` envelope, and only when the file backend is the active writer (`useFileBackend()`). Creating the key there follows
INV-FIRST-WRITE-CREATES. Leave it.

### 2.3 Files explicitly NOT changed

`src/main/brain/**` (owner-lead instruction; the rebuild path is fixed by the root change),
`store.ts`, `auth.ts`, `mcp/mcpSecrets.ts`, `license/secret-store.ts`, and every existing test.

## 3. What NOT to do

1. **Do not touch `src/main/brain/`.** Pre-classifying `F:` indexes in the rebuild path (c9a5cb94) regressed 12 rebuild
   tests and was reverted.
2. **Do not add a pre-check in `decryptSecret`** such as `if (!fileKeyExists()) throw`. It misses the zero-byte file,
   which the loader would still regenerate on a read. It also creates a second definition of "no key" that can drift
   from the loader's.
3. **Do not turn the decrypt path into a pure read that skips the KEK migration.** In
   `windows-keystore-dpapi.test.ts`, "re-wraps the SAME key with DPAPI…" needs the first `getSettings()` decrypt to
   migrate. "…leaves the old key intact when the re-wrap fails midway…" needs the in-memory key from that read.
4. **Do not throw `KeychainKeyRecoveryError` for the no-key case.** Its message carries
   `ENCRYPTED_PROFILE_RECOVERY_ERROR_PREFIX`, which the renderer turns into the "Create new local profile & retry"
   action. A missing key is not a locked credential store, so it must stay a plain `Error`.
5. **Do not cache the no-key outcome** by assigning `_key` or adding a negative flag. A later write must still create
   the key.
6. **Do not change callers** to special-case the new error. They all already catch it.
7. **Stay clear of the lines the held rf branch edits in `secrets.ts`.** Do not move the misplaced KEK/DPAPI doc block,
   do not export `isKeychainAvailable`, and do not add a `fileKeyState()`. rf edits `function isKeychainAvailable` and
   inserts a function after `fileKeyExists()`. Every edit in §2.1 falls outside those hunks' 3-line merge context
   (the nearest, the `prepareFileKeyForWrite` call, is about 10 lines past it), so rf rebases without conflicts.
8. **Do not use `vi.resetModules()` in `secrets.test.ts`.** Its `app` is the statically imported mock. A registry
   reset would hand `secrets.ts` a different electron instance. Use the exported `resetSecretKeyCache()`, which models
   a fresh process and is already public API.
9. **Do not fix the pre-existing creation-tail ordering in this PR.** `_key` is assigned before the key file is
   persisted. That belongs to a separate ticket (§6).
10. No source-text tests, no TODOs, no commented-out code, no ticket ids in test names.

## 4. Tests: red first, then the fix

The first commit contains tests only. Push it; CI must fail on exactly the three tests marked RED below and nowhere
else. The second commit contains the §2.1 fix. Push it; CI must be fully green.

### 4.1 `src/main/secrets.test.ts` (extend; keep the existing six tests)

Add these imports: `randomBytes` from `node:crypto`, `readdirSync`, `readFileSync` and `writeFileSync` from `node:fs`,
and `KeychainKeyRecoveryError`, `prepareFileKeyForWrite` and `resetSecretKeyCache` from `./secrets`. Add a nested
`describe` as the last block inside the existing `describe('secrets — AES-256-GCM file keystore')`. It reuses that
block's `userData` and `getPath` setup, and running last keeps the existing tests' shared cached key undisturbed.

```ts
describe('the key file — only a write creates it', () => {
  const keyFile = (): string => join(userData, 'secret-key.bin')
  /** IV + tag + 16 ciphertext bytes under a key this profile never held: a file synced from another install. */
  const envelopeFromAnotherInstall = (): Buffer => randomBytes(12 + 16 + 16)

  // Each case starts as a new process would: nothing cached, so every key access goes to disk.
  beforeEach(() => resetSecretKeyCache())

  it('a decrypt on a profile with no key file fails and writes nothing', () => {            // RED
    expect(() => decryptSecret(envelopeFromAnotherInstall())).toThrow('no file key')
    expect(readdirSync(userData)).toEqual([])
  })

  it('a decrypt treats a zero-byte key file as no key and leaves it empty', () => {          // RED
    writeFileSync(keyFile(), Buffer.alloc(0))
    expect(() => decryptSecret(envelopeFromAnotherInstall())).toThrow('no file key')
    expect(readFileSync(keyFile())).toHaveLength(0)
  })

  it('a decrypt against a key file it cannot unwrap fails closed with KeychainKeyRecoveryError, bytes intact', () => {
    const wrapped = Buffer.from('a-key-wrapped-by-an-older-signed-build')
    writeFileSync(keyFile(), wrapped)
    expect(() => decryptSecret(envelopeFromAnotherInstall())).toThrow(KeychainKeyRecoveryError)
    expect(readFileSync(keyFile())).toEqual(wrapped)
  })

  it('the first encrypt creates the key, and the next process decrypts with that same key', () => {
    const envelope = encryptSecret('first-write')
    const key = readFileSync(keyFile())
    expect(key).toHaveLength(32) // unpackaged mock: canWrap is false, so the key is raw
    resetSecretKeyCache()
    expect(decryptSecret(envelope)).toBe('first-write')
    expect(readFileSync(keyFile())).toEqual(key)
  })

  it('prepareFileKeyForWrite creates the key on a keyless file-backend profile', () => {
    prepareFileKeyForWrite()
    expect(readFileSync(keyFile())).toHaveLength(32)
  })
})
```

Why each red test fails before the fix (DERIVED from source). The loader generates a key, so `readdirSync` lists
`secret-key.bin` and the empty file becomes 32 bytes. The error is then GCM's "Unsupported state or unable to
authenticate data", not "no file key". The last three tests are characterization guards and pass on both commits:
they pin INV-FAIL-CLOSED on the decrypt path, INV-FIRST-WRITE-CREATES, and the fact that a decrypt still loads an
existing key from disk.

### 4.2 `src/main/transcripts.keyless-profile.test.ts` (new; mirrors `transcripts.summary-only.test.ts`)

This test proves the finding's own scenario, a synced `F:` file, through the exact call that `classifyIndexBytes`
makes.

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { app } from 'electron'
import { decodeSavedResult } from './transcripts'

vi.mock('electron')

/** A v2 envelope whose content key is 'F:'-wrapped under a file key this profile never held: a transcript or
 *  brain index synced from another install. */
function envelopeFromAnotherInstall(): Buffer {
  const env = {
    v: 2,
    iv: randomBytes(12).toString('base64'),
    tag: randomBytes(16).toString('base64'),
    ct: randomBytes(32).toString('base64'),
    kLocal: 'F:' + randomBytes(72).toString('base64')
  }
  return Buffer.concat([Buffer.from('ATKENC2\n', 'utf8'), Buffer.from(JSON.stringify(env), 'utf8')])
}

describe('a file-key envelope from another install, on a profile with no key file', () => {
  let userData: string

  beforeEach(() => {
    userData = mkdtempSync(join(tmpdir(), 'metis-keyless-'))
    vi.mocked(app.getPath).mockReturnValue(userData)
  })

  afterEach(() => {
    rmSync(userData, { recursive: true, force: true })
  })

  it('decodes as unreadable here and leaves no secret-key.bin behind', () => {                 // RED
    expect(decodeSavedResult(envelopeFromAnotherInstall())).toEqual({
      ok: false,
      reason: expect.stringContaining('no file key')
    })
    expect(existsSync(join(userData, 'secret-key.bin'))).toBe(false)
  })
})
```

The `reason` assertion keeps the test meaningful over time. Without it, a fixture that failed at JSON parsing, before
reaching `decryptSecret`, would pass trivially.

### 4.3 Suites to watch in CI (no edits expected)

These suites exercise read-before-write orderings on keyless or locked profiles, so any hidden reliance on read-side
creation would show up here: `windows-keystore-dpapi`, `store-local-keystore-migration`, `secrets-key-recovery`,
`secrets-local-keystore`, `store.test`, `settings-persistence.mqa`, `auth.test`, `signout-revocation.contract`,
`mcp/mcpSecrets.test`, `transcripts.test`, `mqa-175-brain-index-poison`, and `brain/store.test`/
`ingest-index-unavailable` (FOREIGN-F fixtures still classify as `undecryptable`). A search for `secret-key.bin` and
for `decryptSecret` in the tests found no test that expects a key file to exist after only a read (OBSERVED; CI is the
proof). If one fails, stop and report it. Do not weaken the invariant to make it pass.

### 4.4 Evidence (PR table)

| Check | Where | Expected |
|---|---|---|
| `npx tsc --noEmit -p tsconfig.node.json` and `-p tsconfig.web.json` | local | clean (test files are excluded from node; CI's `typecheck:tests` covers them) |
| Red run | CI, commit 1 | exactly 3 failures: the two RED tests in 4.1 and the one in 4.2 |
| Green run | CI, commit 2 (head) | Quality checks on ubuntu and windows, Operator Worker, and Security all green; job set matches baseline run 36267674617 |

Not run locally: every vitest/npm/node command (D-28), and `tsconfig.tests.json` (not on the allowed list; CI runs it).

## 5. Acceptance amendments (proposed to the lead)

1. **Item 1, sharpened.** "decryptSecret on a profile with no key file, or with a zero-byte key file on an unwrapped
   keystore, throws a 'no file key' error and writes nothing: no secret-key.bin, userData listing unchanged (behaviour
   tests in secrets.test.ts)."
2. **Item 2, unchanged.** Covered by the "first encrypt creates the key…" and "prepareFileKeyForWrite creates the
   key…" tests, plus the existing `store-local-keystore-migration` "archives… then a fresh local profile" test and the
   `windows-keystore-dpapi` "unpackaged/dev runs…" test.
3. **Item 3, re-homed.** `rebuild-preserve.test.ts` does not exist on m2/integration. It lives only on
   `rf/rock-1-preserve-unreadable-index`, and `src/main/brain/` is out of bounds for this ticket. In this PR the
   equivalent proof is §4.2, which exercises `decodeSavedResult`, the call `classifyIndexBytes` makes. After M2-0225
   lands, the rf branch rebases and applies only the test hunk of c9a5cb94
   (`expect(existsSync(keyPath)).toBe(false)` in "preserves a file-key index this install has no key for before
   rebuild") with **no** `brain/store.ts` change. Its CI run is that item's evidence.
4. **New item.** "KeychainKeyRecoveryError behaviour is unchanged on the decrypt path: a non-empty key file that cannot
   be unwrapped throws it and keeps its bytes."
5. **scope_paths.** Add `src/main/transcripts.keyless-profile.test.ts`. `src/main/transcripts.ts` stays listed but
   needs no edit.

## 6. Risks, residuals, proposed ticket

- **Error text.** `getApiKey`'s warning and the brain's `undecryptable` detail now show "no file key" where they
  used to show a GCM auth failure. Both are log-only. `UNDECRYPTABLE_MSG` and every UI string are unaffected
  (OBSERVED).
- **Behaviour change on packaged builds (intended, DERIVED).** A read of an `ATKENC2`/`ATKAES1`/`F:`/auth or license
  blob on a keyless packaged profile no longer calls `safeStorage.encryptString` and no longer writes a wrapped key.
  So `fileKeyExists()` stays false, and `prepareFileKeyForWrite` stays a no-op there, as its doc already promises.
- **rf rebase.** Hunks do not overlap (§3.7). After this lands, the lead may reconsider whether rf's `fileKeyState()`
  is still needed only for the "locked" refusal. That is rf's decision, not this ticket's.
- **Proposed ticket (for the lead to file with the next free id).** *Title:* "A key that failed to persist is never
  used for the session." *Summary:* The creation tail of the key loader assigns `_key = randomBytes(32)` before
  `writeFileSync`. If that write fails (ENOSPC, EACCES, or a `safeStorage.encryptString` throw under `canWrap`), the
  first call throws but leaves `_key` cached. The next `encryptSecret` then succeeds under a key that is not on disk,
  and everything written in that session becomes unreadable after a restart. It is also a non-atomic write of the only
  copy of the key. *Acceptance:* the key is created through `persistKeyFileAtomically` and cached only after the rename
  succeeds. A behaviour test runs with packaged=true and `encryptString` throwing: two consecutive `encryptSecret`
  calls both throw, and no key file exists. *scope_paths:* `src/main/secrets.ts`,
  `src/main/secrets-key-recovery.test.ts`.

## 7. Commits and PR

1. `test(secrets): a decrypt must never create the file key [M2-0225]`. The body says why: the red proof that the
   loader writes a key on a read. Push and record the red run URL.
2. `fix(secrets): decrypt loads an existing key only; writes still create it [M2-0225]`. The body says why: a key
   created on a read can never open the bytes being read, it materialises a key the profile never needed, and it
   breaks the brain's keyless rebuild guarantee. Push and record the green run URL.

Both commits end with the operating-rules trailer. Open a DRAFT PR into `m2/integration` titled
`fix(secrets): decrypting saved bytes never creates secret-key.bin [M2-0225]`, using the template, the finding
`RF-G5.5-R2`, the evidence table from §4.4, and the not-run list.

## 8. Size

About 20 changed production lines and about 80 test lines. Roughly 1 hour of implementation plus two CI cycles.
