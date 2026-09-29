# M2-0053 design: macOS and Windows publish independently in release.yml

Designer: Opus. Base: `4ec75897` (branch `m2/M2-0053-independent-releases`, no commits yet). Rebase onto
`origin/m2/integration` (`6aa8cb36` at design time) before the first commit; nothing it adds touches the files below.
Status: design only. The implementer follows this file. Findings: K09-R16, K09-R11, K03-CONFLICT-20.5 (K03-20.5-01).
Kit refs: M2-REL-01, F-19, SRC-18. Decision: D-13 is ANSWERED_AS_DEFAULT (2026-09-27, "1.9.6 rules"), so the docs half
of the ticket (acceptance 3) is in scope now.

## 0. Why this design, in one paragraph

`release.yml` builds each platform in its own job, then publishes both from one `release-verify` job with
`needs: [release-macos, release-windows]`. GitHub skips a job when any job it needs fails or is skipped, so a held
macOS lane (Apple public signing is out of scope, OD-8) blocks every Windows release, which MASTER §20.5 forbids. The
fix gives each platform its own publish job that needs only its own build (and, through it, the shared source gate),
and consumes only its own artifact. Both publish jobs write the same feed release for the tag, so they take turns on
one job-level concurrency group, and the release-state rules move out of 90 lines of inline bash into one small
Node module (`scripts/publish-release.mjs`) that both jobs call with their platform. The module is written as a pure
planner plus a thin `gh` adapter, so every rule gets a behaviour test with an in-memory feed: the first platform goes
draft, then verified bytes, then public and Latest (today's flow); the second platform joins that public release with
installers first and its `latest*.yml` last, only after GitHub's sha256 digests match; anything the workflow did not
itself publish (an owner-channel prerelease, a foreign draft, unexpected assets, this platform already present) is
refused untouched. `check-version-parity.mjs` pre-flights the same rule per platform, so a platform can be re-run
after the other one published. The independence claim is proven by a strict CI contract test that parses the job
graph and simulates GitHub's `needs` semantics, plus actionlint on `release.yml`. Nothing is dispatched, tagged or
published to prove it.

## 1. Facts this design rests on

VERIFIED in this session with read-only `gh api` calls against the public feed `mysticalsin/Metis-Releases`:

- F1. `GET /repos/{feed}/releases` (list) returns drafts, each asset with `name`, `size`, `state` and `digest`
  (`sha256:<hex>`).
- F2. `GET /repos/{feed}/releases/tags/v1.9.1` returns **404** although a `v1.9.1` draft exists; the same endpoint
  returns the published prerelease `v1.9.6-unsigned`. So the tag endpoint never sees drafts. Consequences today: the
  stale-draft branch in `release-verify` (`lookup_status -eq 0` then `assert_draft; gh release delete`) and the
  "resuming the existing draft" branch in `check-version-parity.mjs` are dead code, and a retry after a failed
  publication creates another draft for the same tag (A3). The feed holds leftover drafts for `v1.8.9` and `v1.9.1`
  (assets named like release.yml's) and a foreign draft `v1.9.8`. This change never touches them; versions only
  go up.
- F3. `gh` 2.99 supports `gh api --paginate --slurp`; `--slurp` cannot be combined with `--jq`. Filter in Node.
- F4. The feed's Latest is currently `v1.6.6`.

OBSERVED in the worktree:

- F5. `src/main/updater.ts` already judges a Latest release per platform (`latestReleaseHasApprovedInstallers`):
  darwin needs `Metis-<v>.dmg`, `Metis-<v>.zip`, `latest-mac.yml`; win32 needs `Metis-Setup-<v>.exe`, `latest.yml`.
  `allowPrerelease = false`, and the updater's `error` listener logs any 404 as one warning (`isNotFound`).
  Derived (electron-updater's GitHub provider reads `<channel>.yml` from the Latest release; not re-run here): on a
  Windows-only Latest, a macOS client gets that 404 for `latest-mac.yml` and downloads nothing.
- F6. `promote-candidate.yml` (D-13 lane) publishes to the same feed with tag `v<version>`: prerelease, never Latest,
  no `latest*.yml` or blockmaps, `SHA256SUMS.txt` and `provenance.json` attached, digests checked
  (`uploadProblems` in `scripts/qa/provenance.mjs`). Its header relies on `release.yml` being tag-only.
- F7. Three existing tests read `release.yml` as text and depend on job names and order:
  `scripts/release-gates.test.ts` (slices `release-quality`→`release-macos`, `release-macos`→`release-windows`,
  `release-verify`→end, `release-windows`→end), `scripts/ffmpeg-provisioning.contract.test.ts` (extracts
  `release-macos` by header), and `src/main/updater.test.ts` MQA-292 ("does not undraft Latest", asserts
  `gh release create .* --draft` and `--draft=false` in the workflow text).
- F8. Repo convention: no YAML library in tests (js-yaml is transitive only; see the headers of
  `ci-cost-gates.contract.test.ts` and `ffmpeg-provisioning.contract.test.ts`). No dependency can be added anyway
  (`node_modules` is a symlink; never install).

ASSUMED from GitHub documentation (not re-verified in session; the design does not depend on the third):

- A1. A job whose `needs` include a failed or skipped job is skipped unless it has a condition such as `always()`.
- A2. Job-level `concurrency` with `cancel-in-progress: false` runs one job per group and queues one pending job;
  a third arrival cancels the pending one. Here a group holds at most two jobs (the two publish jobs of one run; the
  workflow-level group already keeps runs of one tag apart).
- A3. GitHub allows several drafts with the same `tag_name`.

## 2. Invariants

**INV-LANES.** `publish-windows` transitively needs exactly `{release-windows, release-quality}` and `publish-macos`
exactly `{release-macos, release-quality}`. No job in `release.yml` has a job-level `if:`, and nothing in it uses
`continue-on-error`, so GitHub's default success rule binds every gate. A failure or skip anywhere in one platform's
lane never stops the other platform's publish job.

**INV-SHARED-GATE (unchanged).** `release-quality` (tagged commit is current `origin/main`; typecheck, `npm test`,
build and audit on ubuntu and windows) gates both platforms.

**INV-PLATFORM-GATES (unchanged, byte-for-byte).** Every step of `release-macos` and `release-windows` stays as it is,
except the platform argument added to the version-parity step. macOS still requires Developer ID plus notarization
(`check-release-secrets.mjs mac`, `verify-signing.mjs --require-notarized`); Windows still requires
`WIN_CSC_*` including `WIN_CSC_EXPECTED_SUBJECT`. No unsigned or ad-hoc byte is ever published by this workflow.

**INV-ARTIFACTS.** Each publish job downloads only its own platform's artifact (`metis-release-macos` or
`metis-release-windows`), and every artifact any job downloads is uploaded by one of its transitive needs.

**INV-EXACT-SET.** A platform publishes exactly its asset set and nothing else. macOS: `Metis-<v>.dmg`,
`Metis-<v>.dmg.blockmap`, `Metis-<v>.zip`, `Metis-<v>.zip.blockmap`, `latest-mac.yml`. Windows:
`Metis-Setup-<v>.exe`, `Metis-Setup-<v>.exe.blockmap`, `Metis-Portable-<v>.exe`, `latest.yml`. The bundle must equal
the set, and its update metadata must match the bundled bytes (`verifyUpdateMetadata`), before the feed is touched.
The native SwiftUI ZIP stays out.

**INV-STATES.** For one tag the feed release moves only along: none → draft (first platform) → public and Latest →
public with both platforms (second platform joins). A draft found at publication time is a leftover: publications of
one tag never overlap and a successful one always ends public. The module deletes a leftover draft only when every
asset on it belongs to this workflow's two asset sets.

**INV-METADATA-LAST.** On the join path, `latest-mac.yml` / `latest.yml` is uploaded only after GitHub's sha256
digest of every installer and blockmap of that platform matches the local bytes. An installed app is never pointed at
missing or unverified bytes (K09-R16: "latest-mac.yml never advances to missing/unnotarized bytes").

**INV-READBACK (SRC-18).** Every upload is read back: exact asset names, `state == uploaded`, size, and GitHub's
sha256 digest against the local file (`uploadProblems`). The first platform's draft becomes public only after this
passes; after publication the release is re-read (public, not a prerelease) and `/releases/latest` must name the tag.

**INV-LATEST (unchanged policy).** The first publication of a version pins Latest (`make_latest=true`), as today.
Joining never changes Latest.

**INV-OWNER-CHANNEL (D-13 intact).** `promote-candidate.yml`, `qa-candidate.yml` and `scripts/qa/provenance.mjs` are
not modified (two of provenance's exported functions are imported read-only). `release.yml` refuses to publish onto a
prerelease for its version and refuses to delete a draft that carries anything outside its own asset sets, so it can
never alter an owner-channel release: prerelease, never Latest, no `latest*.yml`, `SHA256SUMS.txt`, promoted tested
bytes.

**INV-SERIALIZED.** `publish-macos` and `publish-windows` share one job-level concurrency group
`metis-release-publish-${{ github.ref }}` with `cancel-in-progress: false`, distinct from the unchanged workflow-level
group `metis-release-${{ github.ref }}`.

**INV-TAG-ONLY.** `release.yml` keeps `on: push: tags: v*` as its only trigger. No `workflow_dispatch`, no dry-run input.

## 3. Changes per file

### 3.1 `.github/workflows/release.yml`

1. Header comment (lines 3-6). The old text says "this repository's public GitHub Releases page"; the feed is
   `Metis-Releases`. Replace with:

   ```yaml
   # Publishes only verified customer installers to the public Metis-Releases feed (electron-builder.yml
   # publish.owner/repo) on a version tag push (v1.2.3). macOS requires Developer ID signing plus notarization
   # and Windows requires trusted Authenticode signing; missing signing inputs fail that platform's build
   # before it produces an artifact. Each platform publishes as soon as its own gates pass, so a held or
   # failed macOS lane never blocks a signed Windows release, and vice versa (M2-0053). This workflow never
   # publishes unsigned bytes: local ad-hoc builds stay local, and owner-channel prereleases come only from
   # promote-candidate.yml.
   ```

2. Workflow-level `concurrency` comment: "...while both mutate the same feed release." Group unchanged.
3. `release-macos` version step: `run: node scripts/check-version-parity.mjs mac`. Extend its comment by one
   sentence: "It also stops the run early when the feed cannot take this platform's installers for the tag (see
   scripts/publish-release.mjs)." `release-windows`: `run: node scripts/check-version-parity.mjs win`. Nothing
   else in the three existing jobs changes, and their order stays `release-quality`, `release-macos`,
   `release-windows` (F7 slices depend on it).
4. Delete `release-verify` (lines 308-428) and append, after `release-windows`:

   ```yaml
     # Each platform publishes on its own gates (M2-0053, MASTER 20.5): a held or failed macOS lane never
     # blocks a signed Windows release, and vice versa. Both jobs write the same feed release for this tag,
     # so they take turns on one concurrency group. scripts/publish-release.mjs owns the release states:
     # the first platform goes draft -> verified -> public and Latest; the second joins that release with
     # its update metadata uploaded last, after GitHub's digests of its installers match.
     publish-macos:
       name: Publish macOS release
       needs: release-macos
       runs-on: ubuntu-latest
       timeout-minutes: 90
       concurrency:
         group: metis-release-publish-${{ github.ref }}
         cancel-in-progress: false
       steps:
         - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
           with:
             persist-credentials: false
         - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
           with:
             node-version: 22.22.3
         - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0
           with:
             name: metis-release-macos
             path: release-bundle
         - name: Publish the verified macOS installers
           env:
             GH_TOKEN: ${{ secrets.GH_TOKEN }}
           run: node scripts/publish-release.mjs mac release-bundle

     publish-windows:
       name: Publish Windows release
       needs: release-windows
       runs-on: ubuntu-latest
       timeout-minutes: 90
       concurrency:
         group: metis-release-publish-${{ github.ref }}
         cancel-in-progress: false
       steps:
         - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
           with:
             persist-credentials: false
         - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
           with:
             node-version: 22.22.3
         - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0
           with:
             name: metis-release-windows
             path: release-bundle
         - name: Publish the verified Windows installers
           env:
             GH_TOKEN: ${{ secrets.GH_TOKEN }}
           run: node scripts/publish-release.mjs win release-bundle
   ```

   The action SHAs are the ones already pinned in this file (M2-0223 gate). `setup-node` has no `cache:` because
   the job runs no `npm` command; `publish-release.mjs` and everything it imports use Node builtins only.

### 3.2 `scripts/publish-release.mjs` (new, about 170 lines, Node builtins only)

Header comment states the purpose and the state machine (INV-STATES) in four lines, like `scripts/qa/provenance.mjs`.
Follow that file's convention: functions named `*Problems` return `string[]` (empty = OK); the others throw one
`Error` whose message lists every problem, one per line.

Imports: `verifyUpdateMetadata` from `./check-update-metadata.mjs`; `sha256File` and `uploadProblems` from
`./qa/provenance.mjs` (read-only reuse; do not edit that file).

Exports:

```js
/** Per-platform release assets. `artifacts` are uploaded before `metadata` when a platform joins a release. */
export const PLATFORMS = Object.freeze({
  mac: {
    label: 'macOS',
    other: 'win',
    metadata: 'latest-mac.yml',
    artifacts: (v) => [`Metis-${v}.dmg`, `Metis-${v}.dmg.blockmap`, `Metis-${v}.zip`, `Metis-${v}.zip.blockmap`]
  },
  win: {
    label: 'Windows',
    other: 'mac',
    metadata: 'latest.yml',
    artifacts: (v) => [`Metis-Setup-${v}.exe`, `Metis-Setup-${v}.exe.blockmap`, `Metis-Portable-${v}.exe`]
  }
})

export function platformAssets(platform, version)          // [...artifacts(version), metadata]
export function bundleProblems(platform, version, names)   // missing and unexpected names vs the exact set
export function planPublication(platform, version, releases)
  // -> { action: 'create', staleDraftIds: number[] } | { action: 'join', releaseId: number }; throws on refusal
export function feedRepository(builderConfigText)          // 'owner/repo' from electron-builder.yml; throws if absent
export function toRelease(apiRelease)                      // GitHub JSON -> { id, tag, draft, prerelease, assets: [{ name, size, state, digest }] }
export function ghFeed(repo, token)                        // the feed adapter below
export async function publishPlatform({ platform, tag, bundleDir, feed }) // -> { action, releaseId }
```

`feedRepository` uses the same two regexes `check-version-parity.mjs` uses today
(`/^\s*owner:\s*(\S+)\s*$/m`, `/^\s*repo:\s*(\S+)\s*$/m`).

**The feed adapter** (synchronous; each method is one `gh` call through `spawnSync('gh', args, { encoding: 'utf8',
env: { ...process.env, GH_TOKEN: token }, maxBuffer: 64 MiB })`; a non-zero exit throws with gh's stderr):

| Method | gh call |
|---|---|
| `releasesTagged(tag)` | `gh api --paginate --slurp repos/{repo}/releases?per_page=100` then `.flat().filter(r => r.tag_name === tag).map(toRelease)` (F1, F3; never the tags endpoint, F2) |
| `release(id)` | `gh api repos/{repo}/releases/{id}` |
| `createDraft(tag, title, notes)` | `gh api -X POST repos/{repo}/releases -f tag_name=… -f name=… -f body=… -F draft=true -F prerelease=false` |
| `upload(tag, paths)` | `gh release upload <tag> <paths…> --repo {repo}` (no `--clobber`: an existing name fails the call) |
| `publish(id)` | `gh api -X PATCH repos/{repo}/releases/{id} -F draft=false -F prerelease=false -f make_latest=true` |
| `deleteDraft(id)` | `gh api -X DELETE repos/{repo}/releases/{id}` |
| `latestTag()` | `gh api repos/{repo}/releases/latest --jq .tag_name`; `HTTP 404` means `null`, anything else throws |

`gh release upload <tag>` resolves a draft by listing releases; that is unambiguous because the create path deletes
leftover drafts first and publications of one tag are serialized. On the join path the tag resolves to the published
release (F2).

**`planPublication`** (pure; this is the rule both the publish job and the pre-flight apply):

```js
export function planPublication(platform, version, releases) {
  const { label, metadata, other } = PLATFORMS[platform]
  const own = new Set(platformAssets(platform, version))
  const others = platformAssets(other, version)
  const ours = new Set([...own, ...others])
  const published = releases.find((release) => !release.draft)
  if (!published) {
    const foreign = releases.filter((draft) => draft.assets.some((asset) => !ours.has(asset.name)))
    if (foreign.length > 0) {
      const ids = foreign.map((draft) => draft.id).join(', ')
      throw new Error(`A draft for v${version} (${ids}) holds assets release.yml never publishes; resolve it by hand. This job deletes only its own leftover drafts.`)
    }
    return { action: 'create', staleDraftIds: releases.map((draft) => draft.id) }
  }
  if (published.prerelease) {
    throw new Error(`v${version} is already an owner-channel prerelease on the feed; release.yml never publishes over it.`)
  }
  const names = published.assets.map((asset) => asset.name)
  const present = names.filter((name) => own.has(name))
  if (present.length > 0) {
    throw new Error(`v${version} already carries ${label} assets (${present.join(', ')}); a platform is published once per version. If ${metadata} is not among them, an earlier upload was interrupted: delete those assets from the release, then re-run this job.`)
  }
  if (!sameNames(names, others)) {
    throw new Error(`v${version}'s public release must hold exactly the ${PLATFORMS[other].label} installers before the ${label} ones join it; it holds: ${names.join(', ') || 'nothing'}.`)
  }
  return { action: 'join', releaseId: published.id }
}
```

`sameNames(a, b)` is a module-private helper: equal as sets, and no duplicates. GitHub allows only one published
release per tag, so `find` is exact. Drafts next to a published release are ignored: they are invisible and
`gh release upload` resolves the published one.

**`publishPlatform`**, split into three small functions:

1. `publishPlatform` validates `tag` against `/^v(\d+\.\d+\.\d+)$/` (release.yml ships plain versions only; a
   prerelease version would also make electron-builder write `beta*.yml`), then `readBundle`, then
   `planPublication(platform, version, feed.releasesTagged(tag))`, then dispatches to `createRelease` or
   `joinRelease`.
2. `readBundle(platform, version, bundleDir)`: lists regular files in `bundleDir` (depth 1); throws
   `bundleProblems` if not empty; `await verifyUpdateMetadata(join(bundleDir, metadata), version)`; returns the
   manifest `[{ name, path, size, sha256 }]` in `platformAssets` order (metadata last). No feed call happens before
   this returns.
3. `createRelease(feed, tag, manifest, staleDraftIds)`: for each stale id, re-read it and throw if it is no longer a
   draft, else `deleteDraft`. `createDraft` with title `Métis <tag>` (today's title) and `RELEASE_NOTES`; `upload(tag, all paths)`;
   re-read: it must still be a draft and `uploadProblems(manifest, release.assets)` must be empty, else throw
   ("the draft stays private"). `publish(id)`; re-read: not draft, not prerelease; `latestTag()` must equal `tag`,
   else throw "`<tag>` is public but not Latest; set it with `gh release edit <tag> --latest --repo <feed>`".
4. `joinRelease(feed, platform, version, tag, manifest, releaseId)`: re-read the release and re-run
   `planPublication(platform, version, [release])` (it must still say join; the plan came from a list call).
   `upload(tag, artifact paths)`; re-read: still public and not a prerelease, and `uploadProblems` over this
   platform's artifacts (filter `release.assets` to those names) must be empty, else throw a message that names
   the partial assets, says the metadata was not uploaded so no installed app points at them, and gives the
   recovery (delete them, re-run). Then `upload(tag, [metadata path])`; re-read: `uploadProblems(manifest, own
   assets)` empty and the release's asset names equal exactly the union of both platforms' sets.

`RELEASE_NOTES` is one constant that stays true whichever platforms are present:
"Signed Métis desktop installers. A platform's installers appear here only after that platform's release gates pass:
macOS builds are Developer ID-signed and notarized, Windows builds are Authenticode-signed." (Today's text claims both
platforms, which a Windows-only release would falsify.)

CLI (guarded like `check-update-metadata.mjs`): `node scripts/publish-release.mjs <mac|win> <bundle-dir>`. Reads
`GITHUB_REF_NAME` and `GH_TOKEN` (missing token throws), the feed from `electron-builder.yml`, prints one line:
`[publish-release] Published the Windows installers of v1.2.3 on mysticalsin/Metis-Releases as a new Latest release`
or `... joined the public release`. Errors print the message and set exit code 1.

### 3.3 `scripts/check-version-parity.mjs`

Keeps its job (first step of each build job) and its tag rule byte-for-byte. Changes:

1. Header: usage becomes `node scripts/check-version-parity.mjs <mac|win>`; replace the "Optional duplicate-release
   guard" paragraph with: the feed must be able to take this platform's installers for the tag, by the same
   `planPublication` rule the publish job applies; checking it here stops a doomed run before hours of signing and
   packaging; network and auth failures fail closed.
2. First statement: `const platform = process.argv[2]`; if `!Object.hasOwn(PLATFORMS, platform ?? '')`, print
   `[check:version-parity] usage: check-version-parity.mjs <mac|win>` to stderr and exit 1.
3. Replace lines 51-89 (the `/releases/tags/` lookup, which never sees drafts, F2) with:

   ```js
   const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
   if (!token) {
     console.log('[check:version-parity] Skipping the release-feed check (no token in this environment).')
     process.exit(0)
   }
   try {
     const repo = feedRepository(readFileSync(join(here, '..', 'electron-builder.yml'), 'utf8'))
     const plan = planPublication(platform, pkg.version, ghFeed(repo, token).releasesTagged(ref))
     console.log(`[check:version-parity] OK — ${repo} can take the ${PLATFORMS[platform].label} installers for ${ref} (${plan.action}).`)
   } catch (error) {
     console.error(`[check:version-parity] FAIL — ${error.message}`)
     process.exit(1)
   }
   ```

   The unused `spawnSync` import goes. A missing owner/repo now fails closed instead of skipping (the release
   cannot publish without it).

Effect: re-running only the macOS jobs after Windows published passes the pre-flight (join), while re-running
Windows after Windows published fails in its first step, before any build work.

### 3.4 `.github/workflows/build.yml` (security job, one step)

Insert after "Workflow action pins" (before `npm ci`):

```yaml
      # actionlint checks release.yml's expressions, job graph and needs, and runs the runner's shellcheck
      # over its scripts (M2-0053). Pinned by version and by the sha256 in that release's checksums file,
      # like every other third-party tool this job runs.
      - name: Lint release.yml (actionlint)
        env:
          ACTIONLINT_VERSION: <x.y.z>
          ACTIONLINT_SHA256: <sha256 of actionlint_<x.y.z>_linux_amd64.tar.gz>
        run: |
          archive="$RUNNER_TEMP/actionlint.tar.gz"
          curl -fsSL -o "$archive" "https://github.com/rhysd/actionlint/releases/download/v${ACTIONLINT_VERSION}/actionlint_${ACTIONLINT_VERSION}_linux_amd64.tar.gz"
          echo "${ACTIONLINT_SHA256}  ${archive}" | sha256sum --check --strict -
          tar -xzf "$archive" -C "$RUNNER_TEMP" actionlint
          "$RUNNER_TEMP/actionlint" .github/workflows/release.yml
```

Take the newest actionlint release and read its sha256 with `gh` only (allowed outside the sandbox):
`gh release download v<x.y.z> --repo rhysd/actionlint --pattern 'actionlint_<x.y.z>_checksums.txt' --dir "$TMPDIR"`,
and cross-check against `gh api repos/rhysd/actionlint/releases/tags/v<x.y.z> --jq '.assets[] | select(.name ==
"actionlint_<x.y.z>_linux_amd64.tar.gz") | .digest'`. Lint `release.yml` only; if actionlint or shellcheck reports
a pre-existing finding in `release.yml`, fix it there. Other workflows are a follow-up (§7).

### 3.5 Existing tests that read `release.yml` as text

- `src/main/updater.test.ts`: delete the `it('release.yml does not undraft Latest until the signed EXE + notarized DMG
  are in the bundle', ...)` case (F7). Its property now has a behaviour test in `scripts/publish-release.test.ts`
  whose name cites MQA-292. The describe `'MQA-292 Metis-Releases feed rules — QA Latest only'` and its other two cases
  stay, so `check:bugs` still finds MQA-292 in the ledger's named file. Do not edit `docs/qa/BUG-LEDGER.md`.
- `scripts/release-gates.test.ts`, case `'release.yml publishes only notarized Electron macOS artifacts and excludes
  the unsigned native ZIP'`: delete the `publishGate` line and its `expect(publishGate)...` assertion (after the
  change `indexOf('  release-verify:')` is -1, so the assertion would pass vacuously). The native ZIP exclusion is
  covered behaviourally in §5.2. Everything else in that case stays. Add the parity cases of §5.3 to this file and
  `version: string` to its `pkg` type.
- `scripts/ffmpeg-provisioning.contract.test.ts`: no edit; it extracts `release-macos` by header.

### 3.6 `docs/SIGNING.md`

1. Line 10: "three desktop distribution lanes", adding a third bullet: "Owner-channel QA prereleases: the exact tested
   bytes of one build-once candidate, published as a prerelease that no installed app updates to (see Owner-Channel
   QA Prereleases below)."
2. Replace lines 26-29 with: "The tag workflow (`.github/workflows/release.yml`) mirrors the direct-release gates with
   no ad-hoc exception, and gates and publishes each platform on its own. Missing Apple `CSC_*` / `APPLE_*` secrets
   fail the macOS build before it produces an artifact; a missing or mismatched `WIN_CSC_*` identity fails the Windows
   build the same way; neither failure stops the other platform from publishing. The tag workflow publishes only
   Developer ID-signed, notarized macOS artifacts and Authenticode-signed Windows installers. Local ad-hoc packages
   never reach the release feed. The only unsigned bytes on it are owner-channel prereleases (next section)."
3. New section after the gates paragraph, before "macOS Direct Distribution":

   > ## Owner-Channel QA Prereleases (unsigned)
   >
   > Owner decision D-13 (2026-09-27) publishes 1.9.7 and the owner-channel trains before public signing exists,
   > under the same conditions as the 1.9.6 exception of 2026-09-23. These are the only unsigned or ad-hoc-signed
   > installers allowed on `mysticalsin/Metis-Releases`, and they arrive only through this lane:
   >
   > - `.github/workflows/qa-candidate.yml` builds each candidate once from main's current commit, records its
   >   provenance (the sha256 of every installer), and installs and launches those exact bytes on hosted macOS and
   >   Windows runners. macOS candidates are ad-hoc signed or signed with a stable QA identity, never Developer ID,
   >   and are not notarized. Windows candidates are unsigned.
   > - `.github/workflows/promote-candidate.yml` publishes the bytes of one fully successful candidate run, and only
   >   with a PASS evidence record for every promoted installer. The release is a prerelease, never Latest, carries
   >   no `latest*.yml` and no blockmaps, and attaches `SHA256SUMS.txt` and `provenance.json`. GitHub's sha256 digest
   >   of every uploaded asset is checked before publication. A version is never reused.
   > - Installed apps never update to these builds: the updater reads only the Latest release and never a prerelease
   >   (`src/main/updater.ts`), and a prerelease carries no update metadata. People install them by hand; Gatekeeper
   >   and SmartScreen warn or block on first open because the bytes are not notarized or not signed.
   > - `release.yml` never publishes over an owner-channel prerelease: a tag whose version is already a prerelease on
   >   the feed fails each platform's first step.

4. Line 61 ("The release pipeline signs, notarizes, publishes to the update feed, then runs") is wrong about the
   order: `release:build:mac` runs with `--publish never` and verifies before anything is published. Replace with:
   "The macOS release build signs and notarizes, then runs this before anything is published:".

### 3.7 `docs/ENTERPRISE_RELEASE.md`

1. Line 3: "**Each platform's public release is blocked until that platform's production signing lane passes.** A
   held or failing macOS lane never blocks a signed Windows release, and a failing Windows lane never blocks a
   notarized macOS release."
2. Lines 5-9: keep the facts, scope them per platform, and add one sentence: "Unsigned owner-channel prereleases are
   a separate lane, described in `docs/SIGNING.md`."
3. Line 24: "...before the macOS publish job can run."
4. Replace the "Release CI Gates" bullets (lines 139-145) with:
   - `scripts/check-version-parity.mjs <mac|win>` runs first in each platform's build job: the pushed tag must equal
     `v<package.json version>` exactly, and the feed must be able to take this platform's installers for that tag
     (the rule below); otherwise the job stops before any build work.
   - `publish-macos` needs only `release-macos`, and `publish-windows` needs only `release-windows`; both reach the
     shared source gate `release-quality` through their build job. A platform whose build fails, or whose signing
     inputs are missing, is not published for that tag.
   - `scripts/publish-release.mjs` publishes one platform's exact asset set (macOS: DMG, ZIP, their blockmaps,
     `latest-mac.yml`; Windows: Setup EXE, its blockmap, Portable EXE, `latest.yml`) after checking the update
     metadata against the bytes. The first platform for a tag goes to a fresh draft, is read back (asset set and
     GitHub's sha256 digest of every asset), then becomes public and Latest. The second platform joins that public
     release: installers first, then, only once GitHub's digests of those installers match, its update metadata.
     Latest does not change. It refuses a prerelease (the owner channel), a release that already carries this
     platform, and a release holding anything else, and it deletes only its own leftover drafts. The two publish jobs
     of one tag take turns, so they never write the release at the same time.
   - A single-platform release is honest about what shipped: installed apps on the other platform find no update
     metadata in it and keep their version, and the in-app check says the latest release is not yet published for
     their platform.
   - Recovery: if a joining platform's upload is interrupted, its job stops before the update metadata is uploaded and
     names the partial assets. Delete them (`gh release delete-asset v<version> <asset> --repo
     mysticalsin/Metis-Releases`), then re-run the failed publish job. The build artifact is kept for one day; after
     that, re-run that platform's build job too.
5. Line 161: "The tag workflow never publishes an unsigned Windows installer: it fails closed unless ... exactly.
   Unsigned Windows candidates reach people only as owner-channel prereleases (`docs/SIGNING.md`)." Keep the rest.

Do not touch the Forgejo mirror steps (D-17 owns them) or anything outside these lines.

### 3.8 `docs/asktoto-architecture.md` (two stale sentences only)

- Line 1455: replace "and a `release-verify` CI job that fails a tagged release closed (marks it draft) if either
  platform's build didn't actually land its assets." with "and per-platform publish jobs in `release.yml` that each
  publish only their own verified, signed installers, whatever the other platform's state."
- Line 1627: replace the bullet with "- [x] `release.yml` publishes macOS and Windows independently; each publish
  job reads its exact asset set and GitHub's sha256 digests back before its update metadata goes live."

### 3.9 Files explicitly NOT changed

`promote-candidate.yml`, `qa-candidate.yml`, `scripts/qa/provenance.mjs`, `src/main/updater.ts`,
`electron-builder.yml`, `scripts/check-update-metadata.mjs`, `scripts/check-release-secrets.mjs`,
`docs/qa/BUG-LEDGER.md`, `docs/MANTU-IT-REQUEST.md` (job names it cites are unchanged), every other workflow.

## 4. What NOT to do

- Do not push a tag, dispatch `release.yml`, create, edit or delete any release, or write to the feed in any way.
  Read-only `gh api` calls against the public feed are fine.
- Do not add `workflow_dispatch` or a `dry_run` input to `release.yml` (INV-TAG-ONLY; see §6 for why a dispatch run
  could not prove independence anyway).
- Do not decouple with conditions: no `if: always()`, `!cancelled()`, `needs.x.result` checks or
  `continue-on-error`. One publish job with `needs: [both]` and `if: always()` would still wait on the other platform
  and would couple through artifact downloads; conditions also weaken the gates they bypass.
- Do not rename `release-macos`, `release-windows` or `release-quality`, and do not reorder them. Append the publish
  jobs at the end.
- Do not use `--clobber`, delete assets, or change Latest on a public release. Do not delete a draft unless every
  asset on it belongs to this workflow's asset sets and a fresh read says it is still a draft.
- Do not use `/releases/tags/{tag}` to find drafts (F2).
- Do not add a YAML library or any dependency; do not run `npm install`.
- Do not write source-text regex tests for the new behaviour; the only text parsing allowed is the strict job-graph
  parser of §5.1, which exists because no YAML library is available.
- Do not add `permissions:` blocks or other hardening (M2-0049 owns it), and do not lint other workflows here.
- Do not edit program documents in this repository; cite ticket ids only.
- Do not run tests, `node` on repository files, or the app on the Mac (D-28). CI is the only test runner.

## 5. Tests: red first, then the change

Commit the tests alone first and push: CI Quality (ubuntu and windows) must go red on them. Then commit the change.

### 5.1 `scripts/release-lanes.contract.test.ts` (new): the independence proof

Reads `release.yml`, normalizes `\r\n` to `\n` (Windows checkout), and parses its job graph with a small strict
parser kept in the test file (no production consumer):

```ts
interface Job {
  needs: string[]
  concurrency: { group: string; cancelInProgress: boolean } | null
  uploads: string[]    // artifact names of actions/upload-artifact steps
  downloads: string[]  // artifact names of actions/download-artifact steps
}
```

Parser rules, each throwing a message that says "model it before adding it" when violated:

- Jobs are the `^  ([a-z][a-z0-9-]*):$` headers after `^jobs:$`; comment and blank lines are ignored.
- Job-level keys (exactly four spaces) must be in `{name, needs, runs-on, timeout-minutes, strategy, concurrency,
  steps}`. Anything else throws, which covers `if:`, `continue-on-error:` and a reusable-workflow `uses:`.
- `needs:` is `needs: x` or `needs: [x, y]`; a block sequence throws.
- `concurrency:` is a block with `group:` and `cancel-in-progress:` (six spaces).
- A `continue-on-error:` at any indentation throws (MASTER 20.5: no continue-on-error for release safety).
- In a step whose `uses:` is `actions/upload-artifact@…` or `actions/download-artifact@…`, the artifact is the
  `name:` under its `with:`; a download without `name:` (a `pattern:`) throws.
- The workflow-level group is read from the top-level `concurrency:` block.

Simulation, from A1: `jobsThatRun(jobs, failed)` returns the set of jobs that run when `failed` fails: a job runs iff
it is not `failed` and every job it needs runs. Evaluate in dependency order; a cycle throws. `ancestors(jobs, name)`
returns transitive needs.

Lanes table: `SHARED = ['release-quality']`, `MAC = ['release-macos', 'publish-macos']`,
`WIN = ['release-windows', 'publish-windows']`.

Cases:

1. "models every job in release.yml": parsed names equal `SHARED ∪ MAC ∪ WIN` exactly, so a new job must be placed in a
   lane consciously. (Red today: `release-verify` exists, `publish-*` do not.)
2. For every job J in `MAC`: "a failing <J> never stops publish-windows" (`jobsThatRun(jobs, J)` contains
   `publish-windows` and does not contain `publish-macos`). Same for every job in `WIN` against `publish-macos`.
   (Red today.)
3. "the shared source gate binds both platforms": `jobsThatRun(jobs, 'release-quality')` contains neither publish job.
4. "each publish job stands on exactly its own build and the shared gate": `ancestors('publish-macos')` equals
   `{release-macos, release-quality}`; same for Windows.
5. "each publish job consumes only its own platform's bytes": `publish-macos.downloads` equals
   `['metis-release-macos']`, `publish-windows.downloads` equals `['metis-release-windows']`, and for every job every
   downloaded name is uploaded by one of its ancestors.
6. "the two publish jobs take turns on the feed release": both have the same concurrency, `cancelInProgress` is
   false, the group differs from the workflow-level group, and the workflow-level group is still
   `metis-release-${{ github.ref }}`.

### 5.2 `scripts/publish-release.test.ts` (new): the publication rules

Vitest, importing `../scripts/publish-release.mjs` (like `ci/check-workflow-pins.contract.test.ts` imports its
`.mjs`). Fixtures: a `mkdtemp` bundle per platform whose files have distinct small contents, and a real
`latest-mac.yml` / `latest.yml` built from those bytes (sha512 base64 and sizes; top-level `path` =
`Metis-<v>.zip` or `Metis-Setup-<v>.exe`) so `verifyUpdateMetadata` passes. No literal high-entropy hex (hashes come
from `createHash`). Remove temp roots in `afterEach`.

`FakeFeed` implements the adapter in memory: releases with ids, `upload` resolves the published release for the
tag or else the single draft, rejects an existing asset name, and records `digest` as `sha256:` of the uploaded file
(or a wrong digest for names listed in `corruptDigests`); `publish` sets draft and prerelease false and Latest to the
tag. It records mutating calls in order (`create`, `upload <name>`, `publish`, `delete <id>`) in `mutations`, and
counts `releasesTagged` calls in `listings`.

Cases (version `1.2.3`, tag `v1.2.3`), each parametrized over both platforms where it makes sense:

1. "MQA-292: the first platform reaches the feed through a draft that becomes public and Latest only after its exact
   assets and digests are verified": empty feed. After: one release, public, not prerelease, assets exactly the
   platform set, Latest `v1.2.3`; `mutations` is `create`, then every upload, then `publish` last.
2. "the second platform joins the public release: installers first, update metadata last, Latest untouched": run
   case 1 for the other platform, then set the fake's Latest to `v9.9.9` and clear `mutations`. After: assets equal
   the union; every artifact upload precedes `upload <metadata>`; no `create` or `publish`; Latest still `v9.9.9`.
3. "refuses an owner-channel prerelease of the same version and leaves it untouched": a published prerelease tagged
   `v1.2.3` holding `Metis-1.2.3.dmg`, `SHA256SUMS.txt`, `provenance.json`. Rejects matching `/prerelease/`;
   `mutations` empty.
4. "refuses a release that already carries this platform, naming the interrupted-upload recovery": a public release
   holding the other platform's set plus this platform's artifacts without its metadata. Rejects naming the metadata
   file and "delete those assets"; `mutations` empty.
5. "refuses a public release holding assets it did not publish": the other platform's set plus `notes.txt`. Rejects;
   `mutations` empty.
6. "replaces its own leftover draft, never a foreign one": (a) a draft holding part of this platform's set: `delete`
   precedes `create`, and the result is one public release. (b) a draft holding `SHA256SUMS.txt`: rejects, `mutations`
   empty.
7. "keeps the draft private when GitHub's digest differs from the local bytes": empty feed, `corruptDigests` =
   the primary installer. Rejects matching `/digest/`; the release is still a draft; no `publish`.
8. "never uploads update metadata after an installer whose digest does not match": join path with a corrupt digest on
   one artifact. Rejects; `upload <metadata>` is absent from `mutations`.
9. "refuses a bundle that is not exactly the platform's set, before touching the feed": (a) a missing blockmap; (b) an
   extra `Metis-Native-1.2.3.zip` in the macOS bundle (the unsigned native ZIP). `mutations` empty and `listings`
   zero.
10. "refuses update metadata that does not describe the bundled bytes": wrong sha512 in the metadata; `mutations` empty.
11. "refuses a tag that is not a plain vX.Y.Z": `v1.2.3-beta.1`, `1.2.3`.
12. "maps GitHub's release JSON": `toRelease` over a literal API-shaped object keeps `id`, `tag_name`→`tag`, `draft`,
    `prerelease`, and each asset's `name`, `size`, `state`, `digest`.
13. "reads the feed from electron-builder.yml": `feedRepository(readFileSync('electron-builder.yml'))` is
    `mysticalsin/Metis-Releases`, and a config without `repo:` throws.

### 5.3 `scripts/release-gates.test.ts`: pre-flight CLI (added cases)

Spawn `check-version-parity.mjs` with `process.execPath` and `env: { PATH, GITHUB_REF_NAME: v<package.json
version> }` (no token):

- "the release pre-flight requires the platform it checks": args `[]` and `['linux']` exit 1 with `<mac|win>` on
  stderr. (Red today: the script ignores its arguments and exits 0.)
- "the release pre-flight checks the tag for each platform and skips the feed without a token": `['mac']` and
  `['win']` exit 0 with `Skipping the release-feed check` on stdout. (Red today: different wording.)

### 5.4 Suites to watch in CI

`src/main/updater.test.ts` (one case removed), `scripts/release-gates.test.ts`,
`scripts/ffmpeg-provisioning.contract.test.ts`, `scripts/ci/check-workflow-pins.contract.test.ts` (the new jobs
reuse pinned SHAs), `check:bugs` (MQA-292 still cited), and the Security job's new actionlint step.

### 5.5 Evidence (PR table) and not-run list

| Check | Result to record |
|---|---|
| Red run: tests only (commit A) | Quality ubuntu and windows red on `release-lanes.contract.test.ts`, `publish-release.test.ts` (module missing) and the two pre-flight cases; run URL |
| Green run on head | Quality ubuntu + windows, Operator Worker, Security (incl. actionlint on `release.yml`) green; run URL |
| Baseline | Same job set as m2/integration run 36267674617; no new failures |

Not run, and why: `release.yml` itself (tag-only; no tag, dispatch or release is ever made for this ticket); the
`gh` adapter against the real feed (its first use is the next owner-approved signed tag; the rules it executes are
covered by §5.2 and the adapter mirrors the `gh` calls the old job made); local tests (D-28).
`npx tsc --noEmit -p tsconfig.node.json` does not cover `scripts/`, so it proves nothing here; say so rather than
listing it as evidence.

## 6. Acceptance amendments (proposed to the lead)

1. Keep acceptance 1 ("Windows publish job is not gated on macOS notarization and vice versa").
2. Replace acceptance 2 and its verification (`gh workflow run release.yml -f dry_run=true`) with: "A CI contract test
   (`scripts/release-lanes.contract.test.ts`) parses release.yml's job graph strictly and, under GitHub's `needs`
   semantics, proves that a failure of any macOS-lane job leaves `publish-windows` runnable and vice versa, that
   `release-quality` binds both, that each publish job consumes only its own platform's artifact, and that the two
   publish jobs share one concurrency group; actionlint validates release.yml in CI. No tag, dispatch or release is
   made." Why the dispatch dry run cannot prove it: both platforms' signing secrets are absent today (Apple public
   signing is out of scope, OD-8; Windows signing awaits B-11), so a dispatched run fails both lanes at their secret
   gates and shows nothing about one lane while the other passes; adding `workflow_dispatch` would widen the trigger
   surface of the only workflow that holds signing secrets and a feed-publishing token, and `promote-candidate.yml`'s
   safety note relies on `release.yml` being tag-only.
3. Acceptance 3 is actionable now: D-13 was answered on 2026-09-27.
4. Add: "The publication rules have behaviour tests (`scripts/publish-release.test.ts`): the first platform goes
   draft → verified digests → public and Latest; the second joins with its update metadata last and Latest unchanged;
   prereleases, foreign drafts, unexpected assets and a platform already present are refused untouched."
5. Add: "`check-version-parity.mjs <mac|win>` pre-flights the same rule, so one platform can be re-run after the
   other published."
6. `scope_paths` add: `scripts/publish-release.mjs` (new), `scripts/publish-release.test.ts` (new),
   `scripts/release-lanes.contract.test.ts` (new), `scripts/check-version-parity.mjs`,
   `scripts/release-gates.test.ts`, `src/main/updater.test.ts`, `.github/workflows/build.yml` (actionlint step),
   `docs/asktoto-architecture.md` (two stale sentences).
7. `verification`: CI run IDs of the red and green runs on the PR branch.

Private-doc note for the lead: ARCHITECTURE.md C16 and ADR-017 describe `release.yml` as coupling both jobs; that
becomes stale once this merges.

## 7. Risks, residuals, proposed tickets

- R1 (residual, by design). GitHub has one Latest per repository. When Latest carries one platform only, clients of
  the other platform get no update from it (electron-updater 404 on their `latest*.yml`, one log line), and the
  manual check says the release is "not yet fully published for this platform. Please try again after the next
  release upload", which overpromises while the macOS lane is held. Older releases stay downloadable. Proposed
  ticket A below.
- R2. An interrupted join leaves some of that platform's installers on a public release without their metadata. No
  installed app is pointed at them (INV-METADATA-LAST), but the download page shows them until someone deletes them
  by hand; the job's error names them and the recovery is documented.
- R3. The `gh` adapter is first exercised on the next signed tag. Mitigation: the adapter is a table of single
  `gh` calls equivalent to the old job's, and every rule above it is behaviour-tested.
- R4 (pre-existing, kept). A first publication of an older version after a newer release still pins Latest
  backwards (today's `--latest` does the same); `allowDowngrade = false` keeps clients safe. Proposed ticket B.
- R5 (theoretical). An owner-channel draft with no assets yet (the instant between `gh release create` and its
  upload in `promote-candidate.yml`) for the same version would look like a leftover. It needs both lanes on one
  version at once, which versions-only-go-up forbids.
- R6. actionlint or shellcheck may flag pre-existing lines in `release.yml`; fix them in that file only.

Proposed tickets (the lead files them with the next free ids):

- A. "Keep each platform's update feed on its newest release when Latest is single-platform". Summary: the updater
  resolves the newest non-prerelease release that carries this platform's update metadata instead of trusting the
  single Latest pointer, and the manual check says no release exists yet for this platform rather than "try again
  after the next upload". Acceptance: a macOS client with Latest Windows-only is offered the newest release carrying
  `latest-mac.yml`; behaviour tests over feed payloads. scope_paths: `src/main/updater.ts`,
  `src/main/updater.test.ts`.
- B. "release.yml pins Latest only when the version is newer than the current Latest". Acceptance: behaviour test
  in `scripts/publish-release.test.ts` (older version publishes without taking Latest). scope_paths:
  `scripts/publish-release.mjs`, `scripts/publish-release.test.ts`.
- C. "actionlint every workflow in CI". Acceptance: the Security job lints `.github/workflows/*.yml`; findings fixed.
  scope_paths: `.github/workflows/*.yml`.

## 8. Commits and PR

1. `test(release): prove the release lanes independent and pin the publication rules [M2-0053]` — §5.1, §5.2, §5.3
   only. Push; record the red run.
2. `ci(release): publish macOS and Windows independently [M2-0053]` — §3.1 to §3.5. Body: why (MASTER 20.5, a held
   macOS lane blocked Windows), the state machine, the dead draft-lookup (F2), why no dispatch.
3. `docs(release): name the owner-channel prerelease lane and per-platform publication [M2-0053]` — §3.6 to §3.8.

Each ends with the Co-Authored-By trailer from the operating rules. Draft PR into `m2/integration`, title
`ci(release): publish macOS and Windows independently [M2-0053]`, filled from `.github/pull_request_template.md`:
kit refs M2-REL-01, F-19, SRC-18; findings K09-R16, K09-R11, K03-20.5-01; evidence table of §5.5; not-run list.
No account ids, absolute paths or program-document text in the PR.

## 9. Size

About 170 lines of module, 25 changed lines of parity script, 60 lines of workflow (net negative: 120 lines of
inline bash removed), 12 lines in build.yml, about 380 lines of tests, and about 60 lines of docs. Five to six hours
including two CI round trips; validation 0.5 h plus the review.
