# M2-0191 design: detect cloud-only files before any read

Designer: Opus. Base: `70de3c30` (= `origin/m2/integration`). Branch: `m2/M2-0191-dataless-detection`.
Status: design only. The implementer (Sonnet) follows this file. Line anchors are at `70de3c30`.

## 0. Why this design, in one paragraph

The freeze root cause is OBSERVED: a main-process timer did a synchronous read of a OneDrive dataless file
and the kernel parked the thread in `apfs_materialize_dataless_file_ext` for 45-85 s (RUNTIME-EVIDENCE,
spindump). The meetings folder holds 6 `compressed,dataless` files today. Nothing in the app can tell a
cloud-only file from a local one before reading it: Node's `fs.Stats` has no `st_flags`, and
`blocks === 0` also matches APFS-compressed local files. This ticket adds one small, dependency-free
detector that answers "are this file's bytes on this device?" for a batch of files without reading them.
On macOS it asks the existing Swift helper for `st_flags` (a new `stat-flags` subcommand, about 20 lines).
On Windows it asks one PowerShell process for `FILE_ATTRIBUTE_*` words. Both speak the same wire protocol,
the TypeScript side owns all decoding, caching and failure policy, and every failure mode degrades to
`unknown`, which consumers treat as cloud-only. The detector has no caller in this PR by ticket design:
M2-0030 (gateway classification) and M2-0193 (History list/search) consume it.

Evidence labels used below: OBSERVED, DERIVED, ASSUMED, UNKNOWN (AGENTS.md section 4).

## 1. Invariants

**INV-1 (no content access).** Nothing in this ticket opens or reads file data. The probes query metadata
only, in a child process: `stat(2)` on macOS, `GetFileAttributesExW` (via `[IO.File]::GetAttributes`) on
Windows. `dataless.ts` has no `node:fs` import and performs no file-system I/O of its own; callers pass
the stat they already hold (the gateway owns stat admission, M2-0030).
- macOS: `stat` on a dataless file does not materialize it. OBSERVED: the review ran `stat -f %Sf` and
  `find -flags +dataless` on the owner's placeholders without hydrating them.
- Windows: an attribute query does not trigger a Cloud Files hydration. DERIVED from the Cloud Files
  model (hydration happens on data access); confirmed on the managed laptop in ST-1-W (UNKNOWN until then).

**INV-2 (unknown is cloud-only).** On darwin and win32 the detector never answers `local` by default.
- The whole batch is `unknown` when: the probe is missing (helper binary absent), the spawn fails, the
  child exits non-zero, the deadline passes, or the answer is malformed or has the wrong count.
- A single path is `unknown` when its own metadata query failed (`null` word).
- `unknown` is part of the public contract: consumers handle it exactly like `dataless` (never read on
  list or search). This deliberately differs from the rest of mac-helper.ts, whose features fail open
  (section 3.2 states the exception in that file's header).

**INV-3 (bounded wait).** `classify` never rejects and settles by the platform deadline (5 s macOS,
10 s Windows) plus scheduling, whatever state the child is in. The deadline is an `AbortSignal`, not
`execFile`'s `timeout` option: `timeout` settles on the child's `close` event, so a child that cannot be
reaped (blocked in the kernel) would hang the caller. An aborted `execFile` settles immediately after the
kill is sent. DERIVED from Node's `lib/child_process.js` (`abortChildProcess` emits `error` right after
`kill`).

**INV-4 (cache validity).** A cached verdict is served only for the identical
`(path, mtimeMs, ctimeMs, size)`. Only `local` and `dataless` are cached, never `unknown`. The cache holds
at most `MAX_CACHED_VERSIONS = 10_000` entries; insertion order is eviction order.
- ctime is in the key because eviction and hydration change a file's flags or attributes (and so its
  ctime) while mtime and size stay put. recall.ts already documents that hydration changes neither mtime
  nor size. Without ctime, a file evicted after it was cached as `local` would be read (and hydrated) by
  the next consumer that misses its content cache. That ctime moves on evict/hydrate is ASSUMED on both
  platforms. The QA fixture's `--cycle` mode records it (section 3.6).

**INV-5 (one batch, rate-bounded).** Each `classify` call issues at most one probe, covering exactly its
cache misses. There is no probe when there are no misses. After a failed probe, misses are answered
`unknown` without a probe for `PROBE_RETRY_MS = 60_000`, so a broken probe cannot spawn a process per
History open or search keystroke.

**INV-6 (content-free telemetry).** `storage.dataless_probe_failed` is audited once per failure streak
(first failure after a healthy state) with `{ reason: 'unavailable' | 'failed', files: <count> }`.
`main.log` gets one warn per streak (`reason` plus an errno, exit code or error class name) and one info
line per successful probe (`{ files, ms }`), which is the Windows cost instrument. No path, file name,
stdout, stderr or error message ever reaches the audit log or `main.log`.

**INV-7 (paths only on stdin).** Paths travel only on stdin as NUL-separated UTF-8. Both command lines
are constant. There are no argv length limits, no quoting, and no path ever enters the PowerShell
script text.

## 2. Wire protocol (both platforms)

- **stdin:** the batch's paths, UTF-8, joined by `\0` (no trailing separator). A path cannot contain NUL.
- **stdout:** ONE JSON array with exactly one entry per input path, in input order. Each entry is the
  platform's raw attribute word (a non-negative 32-bit integer) or `null` when the metadata query failed
  for that path:
  - macOS: `st_flags`.
  - Windows: `FILE_ATTRIBUTE_*`.
- **exit status:** 0 on success; anything else is a failed probe.
- **Decoding happens in TypeScript only:**
  - macOS: `SF_DATALESS = 0x40000000` means dataless. `UF_COMPRESSED` (0x20) is ignored, so an
    APFS-compressed local file is `local`.
  - Windows: any of `FILE_ATTRIBUTE_OFFLINE 0x1000`, `FILE_ATTRIBUTE_RECALL_ON_OPEN 0x40000` or
    `FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS 0x400000` means dataless. `PINNED`/`UNPINNED`/`ARCHIVE`/
    `NORMAL` are `local`.
  - `null` is `unknown`.

The Swift side reports raw words and does no decoding, so the only Swift logic is "stat each path". Swift
cannot be compiled or run in CI, so every rule lives where CI tests it.

## 3. Code changes per file

### 3.1 `native/mac-helper/main.swift` (the only Swift change; keep it exactly this small)

- Line 4: replace `// Two subcommands, both designed to plug into EXISTING main-process seams without new
  protocols:` with `// Subcommands, each spawned by the main process:`. The old line is already wrong
  (four commands) and becomes more wrong with a fifth.
- Header, after the `screen-metrics` entry (ends line 34), add:
  ```swift
  //   stat-flags        One-shot. Reads NUL-separated UTF-8 paths from stdin and prints ONE JSON array
  //                     holding each path's st_flags, or null where stat(2) failed, in input order.
  //                     stat(2) reads the inode and never opens the file, so probing a dataless
  //                     (cloud-only) file cannot materialize it. src/main/infra/storage/dataless.ts owns
  //                     the protocol and decodes SF_DATALESS; this command reports the raw word.
  ```
- New section between the end of `runScreenMetrics` (line 286) and `// MARK: - entry point` (line 288):
  ```swift
  // MARK: - stat-flags

  func runStatFlags() -> Never {
      let input = FileHandle.standardInput.readDataToEndOfFile()
      let flags: [UInt32?] = input.split(separator: 0).map { pathBytes in
          var info = stat()
          let path = String(decoding: pathBytes, as: UTF8.self)
          return stat(path, &info) == 0 ? info.st_flags : nil
      }
      do {
          let encoded = try JSONEncoder().encode(flags)
          FileHandle.standardOutput.write(encoded)
          FileHandle.standardOutput.write("\n".data(using: .utf8)!)
      } catch {
          fail("stat-flags: could not encode result: \(error.localizedDescription)")
      }
      exit(0)
  }
  ```
  Notes:
  - `stat`, not `lstat` (amendment A2): the classification must describe the bytes a later `readFile`
    touches, and `readFile` follows symlinks. Neither call opens the file.
  - `var info = stat(); stat(path, &info)` is the standard Darwin idiom (struct init vs function).
  - `JSONEncoder` encodes `[UInt32?]` as `[0,null,1073741856]`. The output style matches `ocr` and
    `screen-metrics`.
- Usage string (line 292): `<watch-frontmost|ocr|transcribe|screen-metrics|stat-flags>`.
- Switch (after `case "screen-metrics":`, line 304-305): `case "stat-flags":` / `runStatFlags()`.
- Nothing else: no `setiopolicy_np`, no `getattrlistbulk`, no decoding, no argv paths (section 5).

### 3.2 `src/main/mac-helper.ts`

- Header bullet list (after the `screen-metrics` bullet, line 13-15):
  ```ts
   *   - `stat-flags`: one-shot st_flags per path for cloud-only file detection. Unlike the features
   *     above it fails SAFE, not open: infra/storage/dataless.ts classifies every file 'unknown' (never
   *     read by list or search) when the helper is missing or fails. check-mac-helper.mjs keeps the
   *     helper in every mac package; a dev checkout needs `node scripts/build-mac-helper.mjs` once.
  ```
- After `macScreenMetricsSpawnSpec` (line 90-93), add (mirrors it exactly):
  ```ts
  /** Spawn spec for the one-shot `stat-flags` subcommand, or null when the helper isn't available.
   *  infra/storage/dataless.ts owns the wire protocol and the SF_DATALESS decoding. */
  export function macStatFlagsSpawnSpec(): { command: string; args: string[] } | null {
    if (!macHelperPresent()) return null
    return { command: macHelperPath(), args: ['stat-flags'] }
  }
  ```
- Do not touch the OCR / screen-metrics spawn code (section 5).

### 3.3 `src/main/logger.ts`

In the `AuditEvent` union, after `'recall.export'` (line 220):
```ts
  // A cloud-placeholder probe could not classify a batch of meeting files, so they were treated as
  // cloud-only and not read. Once per failure streak; reason and file count only.
  | 'storage.dataless_probe_failed'
```
The audit-event coverage contract test is satisfied by the `auditLog(...)` call in dataless.ts.

### 3.4 `src/main/infra/storage/dataless.ts` (NEW; the directory is new, and M2-0030 adds siblings)

The code below is the target. Keep names, constants and comments. Split `probeBatch` into
`probeBatch` + `recordFailure` if it exceeds about 25 lines.

```ts
/**
 * Cloud-placeholder detection: whether a file's bytes are on this device, answered BEFORE anything reads
 * the file. Reading a cloud-only file makes the OS download it, and the read blocks its thread until the
 * provider answers, for minutes when offline.
 *
 * The probes read placeholder metadata only, in a child process, and never open file data:
 *   - macOS: `metis-mac-helper stat-flags` returns each path's st_flags; SF_DATALESS marks a cloud-only
 *     file. Node's fs.Stats has no st_flags, and `blocks === 0` also matches APFS-compressed local files.
 *   - Windows: one PowerShell process returns each path's FILE_ATTRIBUTE_* word; OFFLINE, RECALL_ON_OPEN
 *     and RECALL_ON_DATA_ACCESS mark a placeholder whose data is not local.
 * Both read NUL-separated UTF-8 paths on stdin and answer ONE JSON array: the word per path, in order, or
 * null where that path's metadata query failed.
 *
 * 'unknown' (no probe, a failed probe, or a failed query) means "treat as cloud-only": list and search
 * never read it. This module does no file-system I/O itself; callers pass the stat they already hold.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { z } from 'zod'
import { auditLog, mainLog } from '../../logger'
import { macStatFlagsSpawnSpec } from '../../mac-helper'
import { WINDOWS_POWERSHELL } from '../../win-security'

/** Whether a file's content is on this device. Handle 'unknown' exactly like 'dataless'. */
export type ContentPresence = 'local' | 'dataless' | 'unknown'

/** The stat fields that identify one version of a file. ctime belongs here because eviction and hydration
 *  change a file's flags or attributes, and so its ctime, while mtime and size stay put. */
export interface FileVersion {
  path: string
  mtimeMs: number
  ctimeMs: number
  size: number
}

/** Reads placeholder metadata (never content) for `paths` and returns one verdict per path, in order.
 *  Resolves null when this device has no probe available; rejects when the probe ran and failed. */
export type PresenceProbe = (paths: readonly string[]) => Promise<readonly ContentPresence[] | null>

export interface DatalessDetector {
  /** Resolves with an entry for every path in `files` and never rejects. Only files whose version is not
   *  cached are probed, all in one batch. */
  classify(files: readonly FileVersion[]): Promise<Map<string, ContentPresence>>
}

/** SF_DATALESS, <sys/stat.h>. */
const SF_DATALESS = 0x4000_0000
/** FILE_ATTRIBUTE_OFFLINE | FILE_ATTRIBUTE_RECALL_ON_OPEN | FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS, <winnt.h>. */
const WIN_PLACEHOLDER_ATTRIBUTES = 0x0000_1000 | 0x0004_0000 | 0x0040_0000
/** The helper starts in about 0.1 s (see mac-helper.ts) and stat(2) on a listed file does not wait on the network. */
const MAC_PROBE_TIMEOUT_MS = 5_000
/** powershell.exe cold starts take 0.5-1.9 s on a managed install (see win-security.ts). */
const WIN_PROBE_TIMEOUT_MS = 10_000
/** After a failed probe, misses stay 'unknown' this long without a new attempt, so a broken probe cannot
 *  spawn a process per History open or search keystroke. */
const PROBE_RETRY_MS = 60_000
/** Bounds the cache across folder switches, far above any library measured. Insertion order is eviction order. */
const MAX_CACHED_VERSIONS = 10_000

const AttributeWordsSchema = z.array(z.number().int().min(0).max(0xffff_ffff).nullable())

/** Constant script: paths arrive only on stdin, decoded from raw bytes so the console code page cannot
 *  mangle them. GetAttributes queries metadata and never opens file data. */
const WIN_ATTRIBUTES_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  '$bytes = New-Object System.IO.MemoryStream',
  '[Console]::OpenStandardInput().CopyTo($bytes)',
  '$paths = [Text.Encoding]::UTF8.GetString($bytes.ToArray()).Split([char]0)',
  '$words = foreach ($path in $paths) { try { [string][int][IO.File]::GetAttributes($path) } catch { "null" } }',
  "[Console]::Out.Write('[' + ($words -join ',') + ']')"
].join('\n')

/** Pinned System32 binary and -EncodedCommand, as win-security.ts requires for every PowerShell spawn. */
const WIN_ATTRIBUTES_SPAWN_SPEC = {
  command: WINDOWS_POWERSHELL,
  args: [
    '-NoProfile',
    '-NonInteractive',
    '-EncodedCommand',
    Buffer.from(WIN_ATTRIBUTES_SCRIPT, 'utf16le').toString('base64')
  ]
}

const execFileAsync = promisify(execFile)

export function presenceFromStFlags(flags: number | null): ContentPresence {
  if (flags === null) return 'unknown'
  return (flags & SF_DATALESS) === 0 ? 'local' : 'dataless'
}

export function presenceFromWinAttributes(attributes: number | null): ContentPresence {
  if (attributes === null) return 'unknown'
  return (attributes & WIN_PLACEHOLDER_ATTRIBUTES) === 0 ? 'local' : 'dataless'
}

async function runAttributeProbe(
  spec: { command: string; args: string[] } | null,
  paths: readonly string[],
  timeoutMs: number,
  decode: (word: number | null) => ContentPresence
): Promise<ContentPresence[] | null> {
  if (!spec) return null
  const pending = execFileAsync(spec.command, spec.args, {
    encoding: 'utf8',
    // An AbortSignal settles at the deadline even when the child cannot be reaped; execFile's own
    // `timeout` waits for 'close', which such a child never emits.
    signal: AbortSignal.timeout(timeoutMs),
    killSignal: 'SIGKILL',
    windowsHide: true
  })
  // A probe that exits before draining stdin fails through its exit status; the EPIPE this write then
  // raises must not become an unhandled stream error in the main process.
  pending.child.stdin?.on('error', () => {})
  pending.child.stdin?.end(paths.join('\0'))
  const { stdout } = await pending
  return AttributeWordsSchema.parse(JSON.parse(stdout)).map(decode)
}

/** The probe for `platform`. Platforms other than macOS and Windows have no cloud-placeholder mechanism
 *  the app supports, so every file there is local. */
export function presenceProbeFor(platform: NodeJS.Platform): PresenceProbe {
  switch (platform) {
    case 'darwin':
      return (paths) => runAttributeProbe(macStatFlagsSpawnSpec(), paths, MAC_PROBE_TIMEOUT_MS, presenceFromStFlags)
    case 'win32':
      return (paths) => runAttributeProbe(WIN_ATTRIBUTES_SPAWN_SPEC, paths, WIN_PROBE_TIMEOUT_MS, presenceFromWinAttributes)
    default:
      return async (paths) => paths.map((): ContentPresence => 'local')
  }
}

/** A content-free label for a probe failure: the errno or exit code, else the error's class name. */
function failureCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code
  if (typeof code === 'string' || typeof code === 'number') return String(code)
  return error instanceof Error ? error.name : typeof error
}

export function createDatalessDetector(probe: PresenceProbe = presenceProbeFor(process.platform)): DatalessDetector {
  const cache = new Map<string, Omit<FileVersion, 'path'> & { presence: 'local' | 'dataless' }>()
  /** performance.now() before which a failed probe is not retried; null while the probe is healthy. */
  let retryAt: number | null = null

  function cachedPresence(file: FileVersion): ContentPresence | undefined {
    const hit = cache.get(file.path)
    if (!hit || hit.mtimeMs !== file.mtimeMs || hit.ctimeMs !== file.ctimeMs || hit.size !== file.size) {
      return undefined
    }
    return hit.presence
  }

  function remember(file: FileVersion, presence: 'local' | 'dataless'): void {
    cache.delete(file.path)
    cache.set(file.path, { mtimeMs: file.mtimeMs, ctimeMs: file.ctimeMs, size: file.size, presence })
    if (cache.size > MAX_CACHED_VERSIONS) {
      const oldest = cache.keys().next()
      if (!oldest.done) cache.delete(oldest.value)
    }
  }

  async function probeBatch(paths: string[]): Promise<readonly ContentPresence[]> {
    if (retryAt !== null && performance.now() < retryAt) return paths.map(() => 'unknown')
    const started = performance.now()
    let failure: { reason: 'unavailable' | 'failed'; code?: string }
    try {
      const verdicts = await probe(paths)
      if (verdicts !== null && verdicts.length === paths.length) {
        retryAt = null
        mainLog.info('[dataless] probed', { files: paths.length, ms: Math.round(performance.now() - started) })
        return verdicts
      }
      failure = { reason: verdicts === null ? 'unavailable' : 'failed' }
    } catch (error) {
      failure = { reason: 'failed', code: failureCode(error) }
    }
    if (retryAt === null) {
      auditLog('storage.dataless_probe_failed', { reason: failure.reason, files: paths.length })
      mainLog.warn('[dataless] probe failed; files treated as cloud-only', failure)
    }
    retryAt = performance.now() + PROBE_RETRY_MS
    return paths.map(() => 'unknown')
  }

  return {
    async classify(files) {
      const verdicts = new Map<string, ContentPresence>()
      const misses: FileVersion[] = []
      for (const file of files) {
        const presence = cachedPresence(file)
        if (presence) verdicts.set(file.path, presence)
        else misses.push(file)
      }
      if (misses.length === 0) return verdicts
      const probed = await probeBatch(misses.map((file) => file.path))
      misses.forEach((file, i) => {
        const presence = probed[i]
        verdicts.set(file.path, presence)
        if (presence !== 'unknown') remember(file, presence)
      })
      return verdicts
    }
  }
}
```

Checks the implementer must keep:
- `probeBatch` returns `'unknown'` arrays with the literal type (annotate `(): ContentPresence => 'unknown'`
  if TS widens).
- The Windows `-EncodedCommand` args carry **no** `-ExecutionPolicy Bypass`. Execution policy does not
  govern `-EncodedCommand`, and `Bypass` is an extra EDR signal. This mirrors `winCredReadSpawnSpec`.
- PowerShell details:
  - `.Split([char]0)` binds to `Split(params char[])` on .NET Framework (Windows PowerShell 5.1).
  - `foreach` as an expression plus `-join` also works when there is a single path.
  - `[string][int]` prints invariant-culture decimals.
  - Output is ASCII only, so the console output code page is irrelevant.

### 3.5 `src/main/infra/storage/dataless.test.ts` (NEW): see section 4

### 3.6 `scripts/qa/stat-flags-fixture.sh` (NEW, mode 100755, macOS QA account only)

Target content. Keep the checks and the `if` style: no `(( )) && fail` under `set -e`, and no `yes | head`
under `pipefail`, because SIGPIPE turns that into a false failure.

```bash
#!/usr/bin/env bash
# QA fixture for `metis-mac-helper stat-flags` (M2-0191). Run on the isolated QA macOS account only,
# never on an owner account.
#
#   scripts/qa/stat-flags-fixture.sh <helper> <dataless-file> [--cycle]
#
#   <helper>         the metis-mac-helper binary under test (the packaged candidate's
#                    Contents/Resources/mac-helper/metis-mac-helper, or resources/mac-helper/ after
#                    `node scripts/build-mac-helper.mjs`)
#   <dataless-file>  a cloud-only file on the QA cloud account (iCloud Drive: `brctl evict <file>`;
#                    OneDrive: Finder > Free up space)
#   --cycle          also hydrate the file, evict it again with brctl (iCloud Drive only) and print
#                    mtime, ctime, size and flags at each step: evidence for the detector's cache key
#
# Passes when the helper reports the same st_flags as stat(1) for a local, an APFS-compressed, a
# non-ASCII-named and a dataless file; SF_DATALESS is set only on the dataless file; an unstat-able path
# is null; and the dataless file is still dataless after the probe.
set -euo pipefail

SF_DATALESS=$((0x40000000))
UF_COMPRESSED=$((0x20))

fail() { echo "FAIL: $*" >&2; exit 1; }
flags_of() { stat -f %Uf "$1"; }
has_flag() { (( ($1 & $2) != 0 )); }

[[ "$(uname)" == Darwin ]] || fail 'macOS only'
[[ $# -ge 2 ]] || fail 'usage: stat-flags-fixture.sh <helper> <dataless-file> [--cycle]'
helper=$1 dataless=$2 mode=${3:-}
[[ -x "$helper" ]] || fail "helper is not executable: $helper"
[[ -f "$dataless" ]] || fail "dataless fixture not found: $dataless"
has_flag "$(flags_of "$dataless")" "$SF_DATALESS" || fail "$dataless is not dataless; evict it first"

work=$(mktemp -d "${TMPDIR:-/tmp}/stat-flags-fixture.XXXXXX")
trap 'rm -rf "$work"' EXIT
local_file="$work/local.md"
compressed="$work/compressed.md"
unicode="$work/Métis réunion.md"
missing="$work/missing.md"
printf 'local fixture\n' >"$local_file"
printf 'unicode fixture\n' >"$unicode"
head -c 200000 /dev/zero | tr '\0' 'a' >"$work/plain.md"
ditto --hfsCompression "$work/plain.md" "$compressed"
has_flag "$(flags_of "$compressed")" "$UF_COMPRESSED" || fail 'fixture: ditto did not compress the file'

answer=$(printf '%s\0' "$local_file" "$compressed" "$dataless" "$missing" "$unicode" | "$helper" stat-flags)
list=${answer#\[}; list=${list%\]}
IFS=, read -r -a words <<<"$list"
[[ ${#words[@]} -eq 5 ]] || fail "expected 5 words, got: $answer"

expect_stat() { [[ "$2" == "$(flags_of "$1")" ]] || fail "$1: helper said $2, stat(1) says $(flags_of "$1")"; }
expect_stat "$local_file" "${words[0]}"
expect_stat "$compressed" "${words[1]}"
expect_stat "$dataless" "${words[2]}"
[[ "${words[3]}" == null ]] || fail "unstat-able path: expected null, got ${words[3]}"
expect_stat "$unicode" "${words[4]}"
if has_flag "${words[0]}" "$SF_DATALESS"; then fail 'local file reported dataless'; fi
if has_flag "${words[1]}" "$SF_DATALESS"; then fail 'compressed local file reported dataless'; fi
has_flag "${words[2]}" "$SF_DATALESS" || fail 'dataless file not reported dataless'
has_flag "$(flags_of "$dataless")" "$SF_DATALESS" || fail 'the probe hydrated the dataless file'
echo "PASS stat-flags: local=${words[0]} compressed=${words[1]} dataless=${words[2]} missing=null unicode=${words[4]}"

if [[ "$mode" == --cycle ]]; then
  version() { stat -f '%.9Fm %.9Fc %z %Sf' "$dataless"; }
  echo "evicted  (mtime ctime size flags): $(version)"
  sleep 1; cat "$dataless" >/dev/null
  echo "hydrated (mtime ctime size flags): $(version)"
  sleep 1; brctl evict "$dataless"; sleep 5
  echo "evicted  (mtime ctime size flags): $(version)"
fi
```

### 3.7 `scripts/check-skipped-tests.mjs` (skip audit stays truthful)

- Add a REASON entry:
  ```js
  {
    match: 'dataless.test.ts',
    why: 'Runs the real Windows PowerShell attribute probe against an NTFS file carrying FILE_ATTRIBUTE_OFFLINE. The binary and the attribute exist only on Windows; the shared wire protocol, decoding and failure policy run on every platform through a stand-in probe.'
  },
  ```
- `BASELINE`: `linux: 19`, `darwin: 2` (+1 each, the single win32-only test). `win32` is unchanged.
- This raise is for a new platform-bound test that carries a REASON, which is the mechanism the script
  exists to enforce. The "never raise it to accommodate one" line targets hiding regressions. The
  validator confirms the delta is exactly +1 on linux and darwin (section 6, A4).

### 3.8 `src/main/mac-helper.test.ts` (one test)

In `describe('macScreenMetricsSpawnSpec / getMacScreenMetrics …')`, or a sibling describe, add: "stat-flags
spawn spec degrades to null where the helper cannot exist". Use the same `Object.defineProperty(process,
'platform', { value: 'win32' })` try/finally pattern as the existing degrade test and expect
`macStatFlagsSpawnSpec()` to be `null`.

### 3.9 Files explicitly NOT changed

`src/main/recall.ts`, `src/main/index.ts` (M2-0193 / M2-0030 wire the detector), `.github/workflows/*`
(hot files; no macOS job here), `scripts/build-mac-helper.mjs` and `scripts/check-mac-helper.mjs` (the
freshness check already rebuilds when main.swift changes), `native/mac-helper/Info.plist`,
`electron-builder.yml`, `src/main/win-security.ts`, `src/main/foreground-watcher.ts`.

## 4. Tests: red first, then implementation

D-28: tests run in CI only. File: `src/main/infra/storage/dataless.test.ts`. Mocks:
- `vi.mock('../../logger', () => ({ mainLog: { info: vi.fn(), warn: vi.fn() }, auditLog: vi.fn() }))`.
- `vi.mock('../../mac-helper', () => ({ macStatFlagsSpawnSpec: vi.fn() }))`. This is the process boundary
  that lets a stand-in helper run on ubuntu and windows.
- Nothing else is mocked. `win-security` is real.

New test code must add zero errors to the `check-test-types` ratchet:
- Use `vi.fn<PresenceProbe>()` and `vi.mocked(...)`.
- Keep fakes typed.
- No `any`.

**Stand-in helper** (darwin protocol tests; runs on every CI OS). Set
`vi.mocked(macStatFlagsSpawnSpec).mockReturnValue({ command: process.execPath, args: ['-e', SCRIPT] })`.
`SCRIPT` speaks the section-2 protocol and picks each word by basename:
```ts
const WORDS_BY_NAME = `{ 'local.md': 0, 'compressed.md': 32, 'dataless.md': 1073741824,
  'compressed-dataless.md': 1073741856, 'Métis réunion.md': 1073741824 }`
const STAND_IN = `const words = ${WORDS_BY_NAME}
const paths = require('node:fs').readFileSync(0, 'utf8').split('\\0')
process.stdout.write(JSON.stringify(paths.map((p) => words[require('node:path').basename(p)] ?? null)))`
```
An unlisted basename answers `null`, which stands in for a failed stat. If UTF-8 broke anywhere across the
pipe, the non-ASCII name would miss the table and read `unknown`, so the test catches it.

Fake `PresenceProbe` (detector tests): `vi.fn<PresenceProbe>(async (paths) => paths.map(byName))`.
`byName` returns `'dataless'` for names starting `dataless`, `'unknown'` for `gone`, else `'local'`.
FileVersion fixtures are plain objects (no fs).

| # | Test name (behaviour it proves) | Red on base? |
|---|---|---|
| D1 | `presenceFromStFlags: SF_DATALESS marks cloud-only, UF_COMPRESSED alone is local, a failed stat is unknown` (table: 0, 0x20, 0x8000, 0x40000000, 0x40000020 → local/local/local/dataless/dataless; null → unknown) | RED (module missing) |
| D2 | `presenceFromWinAttributes: OFFLINE, RECALL_ON_OPEN and RECALL_ON_DATA_ACCESS each mark a placeholder; archive, normal, pinned and unpinned-but-hydrated files are local; a failed query is unknown` (0x20, 0x80, 0x80020, 0x100020 → local; 0x1000, 0x40000, 0x400000, 0x401420 → dataless; null → unknown) | RED |
| C1 | `classifies a listing with one probe call covering every file and answers every path` | RED |
| C2 | `serves an unchanged file from cache without probing again` | RED |
| C3 | `re-probes a file whose mtime, ctime or size changed` (three cases; ctime alone proves eviction/hydration invalidation) | RED |
| C4 | `never probes an empty listing or a fully cached one` | RED |
| C5 | `never caches unknown: a file whose query failed is probed again on the next call` | RED |
| C6 | `a missing probe (null) answers unknown for every file and audits storage.dataless_probe_failed {reason:'unavailable', files}` | RED |
| C7 | `a probe that rejects, or answers the wrong count, answers unknown with reason 'failed'` (two cases) | RED |
| C8 | `after a failure, misses stay unknown without a probe for 60 s, then the probe is retried` (`vi.spyOn(performance, 'now')`) | RED |
| C9 | `audits once per failure streak: fail, fail after the window → 1 audit; success; fail → 2 audits` | RED |
| C10 | `audit and log records are content-free` (paths contain `SECRET-MEETING-TITLE`; `JSON.stringify` of every `auditLog`, `mainLog.warn` and `mainLog.info` call omits it) | RED |
| C11 | `does not retain an unbounded number of versions: after 50 000 distinct files the first is probed again` | RED |
| P1 | `darwin: sends NUL-separated UTF-8 paths on stdin and decodes the helper's words` (local, compressed, dataless, compressed-dataless, `Métis réunion.md`, and an unlisted `gone.md` → local, local, dataless, dataless, dataless, unknown) | RED |
| P2 | `darwin: a helper that exits non-zero, prints garbage or answers the wrong count leaves every file unknown` (three stand-ins; each reads stdin first) | RED |
| P3 | `darwin: a helper that never answers is abandoned at the deadline and classify settles with unknown` (stand-in `setInterval(() => {}, 1000)`; per-test timeout 15 s) | RED |
| P4 | `darwin: a helper that exits without reading a large stdin raises no unhandled EPIPE` (stand-in `process.exit(0)`; 5 000 paths of about 100 chars, so more than a pipe buffer) | RED |
| P5 | `darwin: a missing helper (no spawn spec) answers unknown and audits reason 'unavailable'` | RED |
| P6 | `other platforms: every file is local` (`presenceProbeFor('linux')`) | RED |
| W1 | `win32: one PowerShell query reports FILE_ATTRIBUTE_OFFLINE, keeps input order, decodes a non-ASCII path and answers unknown for a missing path` (`it.runIf(process.platform === 'win32')`; `mkdtempSync(join(tmpdir(), 'dataless-'))`; files `local.md`, `offline.md` after `execFileSync('attrib', ['+O', file])`, `Métis réunion d'équipe.md`, missing `gone.md`; FileVersions from `statSync`, zeros for the missing file; expect local/dataless/local/unknown; `rmSync` in `finally`). If the runner's `attrib` rejects `+O`, set the bit with `[IO.File]::SetAttributes($env:FIXTURE, 'Offline')` through `WINDOWS_POWERSHELL -NoProfile -NonInteractive -Command`, with the path passed in the `FIXTURE` env var. | RED (skipped off Windows) |
| S1 | `mac-helper.test.ts: stat-flags spawn spec degrades to null where the helper cannot exist` | RED (missing export) |

**Commit 1 (red):** the two test files only (`dataless.test.ts` and the `mac-helper.test.ts` addition).
Push. The expected red is `npm run typecheck`'s test-types step (TS2307, missing module and export), so
vitest does not run.
- That is the honest red for a brand-new module. A stub that compiled would be a fake.
- Record the run URL.
- Do not add the `AuditEvent` member in commit 1: the audit coverage contract would fail for an unrelated
  reason.

**Commit 2 (green):** sections 3.1-3.4, 3.6, 3.7. Push. CI must be green on Quality (ubuntu, windows),
Operator Worker and Security. W1 must show as **passed** in the windows leg's log, not skipped (grep the
log for its title).

Existing suites that must stay green (in CI): `mac-helper.test.ts`, `mac-helper.race.test.ts`,
`foreground-watcher.test.ts`, `island/metrics.test.ts`, `apple-speech.test.ts`,
`audit-event-coverage.contract.test.ts`, `audit-log-chain.test.ts`.

Compare job results with the baseline run 36267674617. Any job red there and red here for the same
pre-existing reason is recorded, not fixed.

## 5. What NOT to do

- No `blocks`, size or `blocks === 0` heuristic, and no `fs.Stats` field other than mtime, ctime and size.
- No `node:fs` import in dataless.ts. No `stat`, `open`, `access` or `readFile` of the probed files from
  TypeScript. Callers own stat under the gateway's admission cap.
- No paths on any command line, and no path interpolated into the PowerShell script.
- Windows: no `Get-ChildItem`, `attrib`, `cmd dir`, `$input` or `[Console]::In`. They decode through the
  console code page, which mangles non-ASCII paths such as "Métis Meetings". Raw stdin bytes only.
- Do not use `execFile`'s `timeout` option or the hand-rolled spawn/settle pattern. Use
  `AbortSignal.timeout` (INV-3).
- No single-flight or in-flight sharing, no "one probe alive" gate, and no queue. The gateway owns
  in-flight sharing (M2-0030); the 60 s retry window bounds spawn rate.
- Never cache `unknown`, never answer `local` on darwin/win32 without a probe word, and never make
  `classify` reject.
- No path, file name, stdout, stderr or `error.message` in `auditLog` or `mainLog`.
- Do not wire the detector into `recall.ts`, `index.ts` or any other caller, and add no flag check here.
  `storage.gateway` gates the consumer (M2-0030/M2-0193).
- Do not refactor the OCR / screen-metrics spawn code in mac-helper.ts. Their race tests pin the current
  wiring.
- No `setiopolicy_np(IOPOL_TYPE_VFS_MATERIALIZE_DATALESS_FILES, …)` and no `getattrlistbulk` in Swift.
  Both are unverifiable in CI, and stat on an already-listed file does not materialize.
- Do not add a macOS CI job and do not edit `.github/workflows/*` (hot files, M2-0188). The Swift
  test lane is M2-0190's.
- D-28:
  - Do not compile Swift and do not run vitest, node scripts, the QA fixture or the app on the owner's
    Mac.
  - Locally allowed: git, gh, reading files, and `npx tsc --noEmit -p tsconfig.node.json` /
    `-p tsconfig.web.json`.
- Do not copy this design, the ledger or review text into the public repo.
- No absolute user paths or meeting names in code, tests, commits or the PR.

## 6. Acceptance amendments (proposed)

- **A1 (cache key).** Replace "caches results per (path, mtime, size)" with "caches `local`/`dataless`
  per (path, mtime, ctime, size), never `unknown`, bounded to 10 000 versions".
  - *Why:* eviction and hydration change neither mtime nor size (recall.ts already relies on that), so
    a (path, mtime, size) key would keep an evicted file `local` for the whole session. The next
    content-cache miss would then read it and hydrate it.
  - That ctime moves on evict/hydrate is ASSUMED. `stat-flags-fixture.sh --cycle` (macOS) and ST-1-W
    (Windows) record it.
  - If ctime does not move on a platform, the residual is recorded, and the gateway's admission cap
    (M2-0030) remains the containment.
- **A2 (stat, not lstat).** Replace "via lstat" with "via stat(2)".
  - *Why:* the verdict must describe the bytes a later `readFile` touches, and `readFile` follows
    symlinks. Neither call opens the file.
- **A3 (failure policy).** Add to "Helper missing or failing":
  - "any probe failure (missing, spawn error, non-zero exit, deadline (5 s macOS / 10 s Windows),
    malformed or short answer) classifies the batch `unknown`";
  - "`storage.dataless_probe_failed {reason: 'unavailable'|'failed', files}` is audited once per failure
    streak";
  - "a failed probe is not retried for 60 s".
  - *Why:* without the window, a persistently failing probe spawns a process on every History open and
    search keystroke (a new heaviness loop). Without once-per-streak, it floods the hash-chained audit
    log.
- **A4 (scope_paths).** Add `src/main/logger.ts` (one `AuditEvent` member), `src/main/mac-helper.test.ts`
  (one test) and `scripts/check-skipped-tests.mjs` (REASON plus baseline linux 18→19 and darwin 1→2 for
  the single win32-only test W1).
- **A5 (verification).**
  - Replace `npx vitest run src/main/infra/storage/dataless.test.ts` with "CI run on the branch (D-28):
    Quality ubuntu and windows green; W1 passed on windows-latest".
  - The macOS helper is **BLOCKED / CI-gap**: no CI job compiles or runs Swift. It is verified by
    `scripts/qa/stat-flags-fixture.sh` on the QA account (M2-0007) with the packaged candidate's
    helper. Record OBSERVED output, including `--cycle` for iCloud Drive.
  - The TypeScript half of the protocol is covered in CI by the stand-in helper (P1-P5).
- **A6 (Windows cost, measurement protocol).** The instrument is the `main.log` line
  `[dataless] probed {files, ms}` on the packaged candidate, on the managed Windows laptop during ST-1-W:
  cold History open, then after saving a new meeting. Also record:
  - `$ExecutionContext.SessionState.LanguageMode`. ConstrainedLanguage breaks this probe and the
    existing foreground watcher / credential read alike.
  - Whether EDR flags or delays the `-EncodedCommand` launch.
  - The attribute word of a real "Free up space" file.
  - "Too slow" means a probe beyond `WIN_PROBE_TIMEOUT_MS`. Those files are already `unknown` and never
    read, which satisfies the acceptance's fallback. Any probe under the deadline but above M2-0193's
    2 s degraded-list budget is reported to M2-0193 (which must render rows before classification
    completes).
- **A7 (helper order).** "Lands in the helper order after M2-0027" is a serialization rule for the hot
  file, not a code dependency. M2-0191 touches only the header, one new section, the usage string and
  one `case`, so a rebase onto M2-0027 is mechanical. The orchestrator decides the order. Recommendation:
  let M2-0191 land first if M2-0027 is not ready, because M2-0027 waits on M2-0007/M2-0026 while
  M2-0193, M2-0192 and M2-0046 wait on M2-0191.
- **A8 (fixtures).** "Fixtures cover a local file, an APFS-compressed local file and a dataless file" is
  met twice:
  - protocol words in CI (P1: 0, 0x20, 0x40000000, 0x40000020);
  - real files on the QA account (stat-flags-fixture.sh), which also prove the probe does not hydrate.

## 7. Evidence and PR

- **Local:** `npx tsc --noEmit -p tsconfig.node.json` (tests are excluded there; CI typechecks them).
- **PR:**
  - Title: `fix(storage): detect cloud-only files before any read [M2-0191]`.
  - Draft, from `m2/M2-0191-dataless-detection` into `m2/integration`, using
    `.github/pull_request_template.md`.
  - Kit M2-DATA-01; findings B1-RC4 and CHATGPT-A7.
  - Evidence table: red run URL → green run URL; W1 passed on windows-latest (quote the log line).
  - State in "What changed": the module has no caller by ticket design; M2-0030 and M2-0193 consume it.
- **Evidence level:** LOCALLY_TESTED (CI, per D-28). LIVE_VERIFIED is **BLOCKED_EXTERNAL** on M2-0007:
  - QA macOS account: build or take the packaged helper, then run the fixture script with an evicted
    iCloud Drive or OneDrive file.
  - Managed Windows laptop: ST-1-W measurement per A6.
- **Not run:**
  - Swift compile and run (no macOS CI job: CI-gap, M2-0190 owns the Swift test lane).
  - `stat-flags-fixture.sh` (QA account).
  - Windows laptop measurement.
  - `npm run check:skips` (local node script, D-28; the baseline edit is reasoned in 3.7).
  - Packaged app.
- **Commits:** conventional, subject ends `[M2-0191]`, body says why, last line
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
  1. `test(storage): specify cloud-only file detection [M2-0191]`
  2. `fix(storage): detect cloud-only files before any read [M2-0191]`

## 8. Consumer notes for M2-0030 / M2-0193 (non-normative)

- Create ONE detector per process (`createDatalessDetector()`); the cache and failure window are per
  instance.
- After the gateway's stat (metadata lane), call `classify` with `{ path, mtimeMs, ctimeMs, size }`.
  Use `verdicts.get(path) ?? 'unknown'`, and read only `local`.
- It classifies directories too (SF_DATALESS and RECALL_ON_OPEN apply to them). The gateway may probe a
  root before listing it.
- On macOS dev checkouts without a built helper, every file is `unknown` (fail-safe). Build it once with
  `node scripts/build-mac-helper.mjs`.

## 9. Known limits and residuals

- TOCTOU: a file can be evicted between probe and read. The gateway's async admission cap (M2-0030)
  contains the read off the main thread. This ticket only avoids starting hydration on list/search.
- A probe child blocked in the kernel is abandoned at the deadline, not reaped. The 60 s window bounds
  how many can accumulate under a persistent fault. The realistic Windows failures (policy, EDR) fail
  fast.
- Windows `.NET Framework` `GetAttributes` rejects paths over 260 characters unless long paths are
  enabled. Those files answer `unknown` (safe). Meeting paths are about 100-150 characters.
- TCC attribution on macOS 15+ for File Provider domains is ASSUMED to follow the responsible process
  (Metis.app). The QA fixture runs under Terminal's context, so packaged ST-1 (M2-0030) covers the app
  context.

## 10. Size estimate

- Production: about 150 LOC TypeScript (dataless.ts about 140, mac-helper.ts 8, logger.ts 3), about 25
  lines of Swift, and about 60 lines of bash.
- Tests: about 300 LOC.
- About 4-5 h including the red/green CI round-trips.
