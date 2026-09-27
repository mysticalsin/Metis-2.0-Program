# M2-0187 design: build each candidate once, test those bytes, promote the same bytes (ADR-022)

Designer: Opus. Base: `70de3c30` (= `origin/m2/integration`). Branch: `m2/M2-0187-build-once-candidate`.
Status: design only. The implementer (Sonnet) follows this file. Line anchors are at `70de3c30`.
Decision used: D-13 is OPEN; this design applies its recorded default (same conditions as the 1.9.6
exception) and labels it ASSUMED.

## 0. Why this design, in one paragraph

`release.yml` cannot publish 1.9.7. It refuses macOS without Developer ID secrets (out of scope), refuses
unsigned Windows, couples both jobs, and rebuilds from the tag, so the shipped bytes can never be the
tested bytes. The lane replaces it for owner-channel builds with two small workflows and one
dependency-free module. `qa-candidate.yml` builds every shipped installer once, from one named main
commit, in one run, using the chains CI already proves (`npm run dist`, `npm run dist:win`), plus a
macOS QA-identity variant built from the same commit. It hashes every installer where it was built,
assembles one `provenance.json`, then downloads, verifies by sha256, installs and launches every
installer. `promote-candidate.yml` never builds. It downloads one successful run's artifacts, proves
every byte against that run's provenance and against the promotion evidence, uploads them to a draft on
the release feed, checks GitHub's digest of every uploaded asset, and only then publishes a prerelease
that is never Latest. The release and its tag are created in the feed repository `Metis-Releases`,
which runs no workflows (OBSERVED 2026-09-26: `total_count` 0), so promotion cannot start `release.yml`.
That turns the ticket's ASSUMED token behaviour into a structural fact. macOS signing uses the stable QA
identity once the owner stores `QA_MAC_SIGNING` (B-05). Until then the ad-hoc path works, and the
signing mode is recorded and verified per installer.

Evidence labels used below: OBSERVED, DERIVED, ASSUMED, UNKNOWN (AGENTS.md section 4).

## 1. Invariants

**INV-1 (built once).** A candidate is exactly the installers produced by one `qa-candidate` run on its
first attempt. Every build job refuses `GITHUB_RUN_ATTEMPT != 1`, so rebuilding means dispatching a new
run, which is a new candidate. Gate jobs only read artifacts, so they may be re-run.

**INV-2 (named main commit).** A dispatched run builds only when its `commit` input equals `GITHUB_SHA`
and the ref is `refs/heads/main`. A pull-request self-test run (section 5.7) builds the PR merge commit
and can never be promoted, because promotion requires `event == workflow_dispatch` and
`head_branch == main`.

**INV-3 (identified by sha256).** Every consumer verifies each installer's sha256 against that run's
`provenance.json` before using it: the in-run smoke gates, host gates (through `SHA256SUMS.txt`) and
promotion. Evidence binds to bytes by `(build_run_id, artifact_sha256)`. There is no other way to name a
candidate.

**INV-4 (published = tested).** `promote-candidate.yml` contains no build, install or `npm` step. It
uploads exactly the promotable installers, `SHA256SUMS.txt` (those installers only) and the unmodified
`provenance.json`. Before any draft is published, GitHub's reported `digest` of every uploaded asset
must equal the local sha256 (OBSERVED: `Metis-Releases` draft assets carry `digest: "sha256:…"`). A
missing digest fails closed.

**INV-5 (evidence required).** Promotion needs both of these:
- every job of the candidate run concluded `success` (a skipped gate is not a pass);
- at least one evidence record, where every record is `PASS`, carries
  `build_run_id == provenance.run.id`, and has an `artifact_sha256` in that candidate.

Which gates a given release requires is that release ticket's policy (M2-0046, 0206, 0207, 0209, 0210).
Opus validation checks it; the workflow does not hardcode it.

**INV-6 (owner channel, D-13 default, ASSUMED).** A publication is:
- a prerelease with `make_latest=false`;
- no `latest*.yml` and no blockmaps;
- tag `v<version>`, which must not exist as a tag or as a release, draft included, in the feed repo.

No tag is ever created in this repository. `release.yml` is not edited.

**INV-7 (identities).** macOS installers are signed with the stable QA identity when `QA_MAC_SIGNING`
exists, and ad-hoc otherwise. They are never signed with a Developer ID: the import step refuses one,
and the lane never references `CSC_LINK` or `APPLE_*`. Windows installers are unsigned: no `WIN_CSC_*`
or `CSC_*` secret is referenced. `provenance.json` records the signing mode. Each smoke gate checks it
against the installed bytes: the leaf-certificate SHA-1, or `Signature=adhoc` for mac, or `NotSigned`
for win.

**INV-8 (QA-identity variant isolation).** The variant shares nothing that the live install owns.
- `appId` is `com.mantu.asktoto.qa`, which gives it separate TCC entries.
- `productName` is `Metis QA`, so it installs as `Metis QA.app` next to `/Applications/Metis.app`.
- Its runtime name is `asktoto-qa`. The userData directory becomes `<appData>/asktoto-qa`, against the
  live `asktoto` (OBSERVED in RUNTIME-EVIDENCE). The Keychain safeStorage service follows the same name
  (ASSUMED, see section 10).
- It has no update feed.
- It is built for macOS only and is never promoted.

**INV-9 (least privilege).**
- Every workflow declares `permissions:`.
- Every action is pinned by commit SHA.
- Secrets are exposed only to the steps that need them.
- `${{ inputs.* }}` never appears inside a `run:` script. Inputs reach scripts through `env:`.
- The feed token (`secrets.GH_TOKEN`) appears only in promotion's feed steps.

**INV-10 (private key).** The QA private key exists only in the owner's temporary directory while
`make-qa-identity.sh` runs, and in the secret. Agents never create, read or print it. The workflow masks
the p12 password before using it.

## 2. Where things live and run

| Thing | Path | Runs where | Who writes |
|---|---|---|---|
| Candidate lane | public `.github/workflows/qa-candidate.yml` (NEW) | Actions: dispatch on main; self-test on PRs touching lane files | Sonnet |
| Promotion | public `.github/workflows/promote-candidate.yml` (NEW) | Actions: dispatch on main | Sonnet |
| Provenance, evidence binding, release prep | public `scripts/qa/provenance.mjs` (NEW, node builtins only) | Actions jobs; imported by tests | Sonnet |
| Tests | public `scripts/qa/provenance.test.mjs` (NEW, `node:test`) + `scripts/qa/provenance.test.ts` (NEW, vitest wrapper) | CI Quality (ubuntu + windows) via `npm test` | Sonnet |
| QA-identity builder config | public `build/qa-identity.electron-builder.yml` (NEW) | electron-builder on macOS runners | Sonnet |
| QA-identity chain | public `package.json` (EDIT: `predist:qa-identity`, `dist:qa-identity`) | macOS runners | Sonnet |
| Signing identity plumbing | public `scripts/after-pack.mjs` (EDIT) + `scripts/after-pack.test.ts` (EDIT) | electron-builder afterPack | Sonnet |
| Bundle-named executable | public `scripts/check-packaged-runtime.mjs`, `scripts/check-packaged-launch.mjs` (EDIT) + `scripts/check-packaged-launch.test.ts` (EDIT) | packaging chains, smoke gates | Sonnet |
| Chain contract | public `scripts/mac-chain-gates.contract.test.ts` (EDIT) | CI | Sonnet |
| Owner identity script | public `scripts/qa/make-qa-identity.sh` (NEW, mode 100755) | owner, once (B-05) | Sonnet writes; owner runs |
| Runbook | private `docs/metis-2.0/runbooks/qa-candidate.md` (NEW) | — | Sonnet writes it uncommitted; lead commits |

The runbook is a program document, so it never goes into the public repository. Its scope path in the
ledger resolves to the private repo, the same convention as `runbooks/orphan-cleanup.md`.

## 3. Candidate lifecycle

```
owner/agent: gh workflow run qa-candidate.yml --ref main -f commit=<main head>
  guard ─┬─ build-mac [mac]              (npm run dist)              ─┐
         ├─ build-mac [mac-qa-identity]  (npm run dist:qa-identity)  ─┼─ provenance ─┬─ smoke-mac [mac]
         └─ build-win [win]              (npm run dist:win)          ─┘              ├─ smoke-mac [mac-qa-identity]
                                                                                     └─ smoke-win
  artifacts (30 d): candidate-mac, candidate-mac-qa-identity, candidate-win (installers only),
                    build-<variant> (build records), candidate-provenance (provenance.json, SHA256SUMS.txt)
host gates (QA user, Windows laptop): gh run download → shasum -a 256 -c → install → HK/ST-1/RV/EX/census
  → M2-0002 records carrying artifact_sha256 + build_run_id (private repo)
owner: gh workflow run promote-candidate.yml --ref main -f candidate_run_id=<id> -F evidence=@evidence.jsonl
       [-f publish=true -f confirm_version=<version>]
  → verify run → download → prepare-release (evidence + bytes) → draft on Metis-Releases → digest check
  → publish as a prerelease that is not Latest   |   dry run: delete the draft
```

## 4. `provenance.json` (normative; `provenance.mjs` is the single source of truth)

```json
{
  "schema": 1,
  "repository": "mysticalsin/AskToto-Mantu",
  "commit": "<40 lowercase hex>",
  "version": "1.9.7",
  "run": { "id": 123456789, "url": "https://github.com/mysticalsin/AskToto-Mantu/actions/runs/123456789" },
  "builds": [
    {
      "variant": "mac",
      "artifact": "candidate-mac",
      "runner": { "os": "macOS", "arch": "ARM64", "image": "macos15", "image_version": "20260915.1" },
      "node": "v22.22.3",
      "electron": "43.6.0",
      "electron_builder": "26.15.3",
      "builder_config": [{ "path": "electron-builder.yml", "sha256": "<64 hex>" }],
      "signing": { "mode": "qa-identity", "certificate_sha1": "<40 lowercase hex>" },
      "assets": [
        { "name": "Metis-1.9.7.dmg", "size": 1827062492, "sha256": "<64 lowercase hex>" },
        { "name": "Metis-1.9.7.zip", "size": 1826300776, "sha256": "<64 lowercase hex>" }
      ]
    }
  ]
}
```

- `builds` holds exactly one entry per variant, sorted by `variant`: `mac`, `mac-qa-identity`, `win`.
  Each build's `assets` follow its variant's order in `VARIANTS`.
- `signing` has one of three shapes:
  - `{ "mode": "qa-identity", "certificate_sha1" }` for mac with the secret set;
  - `{ "mode": "ad-hoc" }` for mac without it;
  - `{ "mode": "unsigned" }` for win.
- `runner` comes from `RUNNER_OS`, `RUNNER_ARCH`, `ImageOS` and `ImageVersion`, all four required. The
  lane runs on GitHub-hosted runners only, where all four are set.
- `builder_config` lists every file electron-builder read for that variant, in `extends` order.
  `commit` pins the rest of the chain (`package.json`).
- `SHA256SUMS.txt` has one line per asset, sorted by name: `<sha256>  <name>\n` (two spaces, the format
  `shasum -a 256 -c` reads).

`VARIANTS` (exported constant, frozen):

| Variant | Promotable | Builder config files | Assets for version `v` |
|---|---|---|---|
| `mac` | yes | `electron-builder.yml` | `Metis-v.dmg`, `Metis-v.zip` |
| `mac-qa-identity` | no | `build/qa-identity.electron-builder.yml`, `electron-builder.yml` | `Metis-QA-v.zip` |
| `win` | yes | `electron-builder.win.yml`, `electron-builder.yml` | `Metis-Setup-v.exe`, `Metis-Portable-v.exe` |

These names are what the existing `artifactName` settings produce (OBSERVED on the 1.9.6 prerelease)
plus the QA override in section 5.1. The table is also the lane's definition of "every shipped target".
AppX is not shipped: `release.yml`'s exact asset set has no AppX.

## 5. Changes per file

### 5.1 `build/qa-identity.electron-builder.yml` (NEW)

```yaml
# QA-identity variant of Métis (M2-0187, PD-05): the only form an unreleased build may take on the
# owner's primary account. It shares nothing the live install owns: its own bundle id (TCC grants), its
# own runtime name (userData directory and Keychain safeStorage service) and no update feed. Built only by
# `npm run dist:qa-identity` in qa-candidate.yml, and never published.
# electron-builder resolves `extends` against the project directory, not against this file.
extends: ./electron-builder.yml
appId: com.mantu.asktoto.qa
# ASCII for the same helper-bundle reason as the base productName. It names Metis QA.app, its executable
# and its "Metis QA Helper" bundles, so the variant installs beside the live Metis.app.
productName: Metis QA
# Electron takes the app name from the packaged package.json: userData becomes <appData>/asktoto-qa and
# the safeStorage Keychain service "asktoto-qa Safe Storage", never the live install's "asktoto".
extraMetadata:
  name: asktoto-qa
mac:
  artifactName: Metis-QA-${version}.${ext}
  extendInfo:
    CFBundleDisplayName: Métis QA
# No app-update.yml: a QA build never updates itself from, or into, the release feed.
publish: null
```

DERIVED from `app-builder-lib` 26.15.3:
- `load.js:96` resolves the parent config with `path.resolve(projectDir, spec)`.
- `deepAssign` merges objects key by key and takes `null` as an override, so `publish: null` removes the
  feed, and `mac.extendInfo` keeps the usage-description keys.
- `deepAssign` unions arrays, so the dmg/zip target list cannot be narrowed here. The chain passes
  `--mac zip` on the command line instead.
- `electronMac.js:47` names helpers from `sanitizedProductName`.

The variant ships as a zip only. It is the simplest form to install by script (`ditto -x -k`), and it
halves storage.

### 5.2 `package.json` (EDIT, two new scripts next to `dist`)

```json
"predist:qa-identity": "npm run predist",
"dist:qa-identity": "node scripts/embed-cloudflare-key.mjs && node scripts/check-cloudflare-key-valid.mjs && npm run check:main-imports && ASKTOTO_MAC_UNIVERSAL=1 npm run build && ASKTOTO_ADHOC_SIGN=1 ASKTOTO_MAC_ARCHES=arm64,x64 electron-builder --config build/qa-identity.electron-builder.yml --mac zip --universal -c.npmRebuild=false -c.electronDist=resources/electron-dist --publish never -c.mac.identity=null && node scripts/check-packaged-runtime.mjs mac \"release/mac-universal/Metis QA.app/Contents/Resources\" --arches=arm64,x64 --macho-arches=arm64,x64 --post-sign && ASKTOTO_MAC_LAUNCH_GATE=1 node scripts/check-packaged-launch.mjs \"release/mac-universal/Metis QA.app\" && node scripts/check-embedded-cloudflare-key.mjs release/mac-universal",
```

- The chain is `dist` with three differences: the QA config, the `zip` target and the `Metis QA.app`
  paths. It drops `check-update-metadata` because `publish: null` produces no `latest-mac.yml`.
- `predist:qa-identity` reuses the provisioning chain rather than copying it. npm runs it automatically
  before `dist:qa-identity`.
- `dist`, `dist:win` and every other script stay byte-identical.

### 5.3 `scripts/after-pack.mjs` (EDIT, lines 135-169)

Replace the ad-hoc-only identity with an optional keychain identity. The gating and the verify call do
not change.

```js
  // ASKTOTO_ADHOC_SIGN=1 makes this hook, not electron-builder, sign the final bundle. The signature is
  // ad-hoc unless ASKTOTO_MAC_SIGN_IDENTITY names a code-signing identity in the keychain search list:
  // the QA candidate lane's stable QA certificate, whose designated requirement survives rebuilds so TCC
  // grants persist. It is never a Developer ID; customer releases sign through electron-builder instead.
```

In the signing branch:
- `const identity = process.env.ASKTOTO_MAC_SIGN_IDENTITY || '-'`.
- Log `applying complete ${identity === '-' ? 'ad-hoc' : 'QA identity'} signature to ${app}`.
- Pass `'--sign', identity` in place of `'--sign', '-'`.

Keep `--timestamp=none`, `--options runtime`, the entitlements and `--deep`, as the existing path has
them. Do not rename `ASKTOTO_ADHOC_SIGN`. A rename touches six files and is out of scope.

### 5.4 `scripts/check-packaged-runtime.mjs` (EDIT, lines 636-643)

electron-builder names the macOS executable after the bundle (productFilename). Derive it from the bundle
so the gate checks the variant it was given. `basename` is already imported.

```js
  const executable = basename(appRoot, '.app')
  requireExactInventory(macOsDir, [executable], 'macOS executable directory')
  ...
  verifyMachOArches(join(macOsDir, executable), expectedMachoArches)
```

(Declare `executable` after `appRoot`. The rest of the block is unchanged.)

### 5.5 `scripts/check-packaged-launch.mjs` (EDIT, line 64; import `basename`)

```js
  const proc = spawn(join(appPath, 'Contents', 'MacOS', basename(appPath, '.app')), [], {
```

Keep the comment above it. Update the usage hint in the file header only if it names `Metis.app` as the
only possible bundle; otherwise leave the header alone.

### 5.6 `scripts/qa/provenance.mjs` (NEW, about 230 lines, node builtins only)

The file header states purpose and invariants INV-3/4/5 in three to five lines. It exports:

```js
export const VARIANTS                        // section 4 table; Object.freeze, each { promotable, platform, configs, assets(version) }
export const PROMOTABLE_VARIANTS             // Object.keys(VARIANTS).filter(v => VARIANTS[v].promotable) → ['mac', 'win']
export async function sha256File(path)       // streaming createHash('sha256'); resolves lowercase hex
export async function stageBuild({ variant, repoRoot, releaseDir, outDir, env, nodeVersion })
export function assembleProvenance(records, env)
export function sha256Sums(assets)
export async function directoryProblems(provenance, dir, variants)
export function evidenceProblems(evidenceText, provenance)
export async function prepareRelease({ provenancePath, evidencePath, downloadsDir, outDir, candidateRun, candidateCommit, env })
export function releaseNotes({ provenance, evidence, promotionRunUrl })
export function uploadProblems(manifest, uploaded)
```

**Rules.** A function reports what it found. Functions named `*Problems` return `string[]`, where empty
means OK. `stageBuild`, `assembleProvenance` and `prepareRelease` throw an `Error` whose message lists
every problem, one per line. Each problem names the file or line and the fix.

- **`stageBuild`** (build jobs):
  - Validate first, so a failure leaves everything in place:
    - `variant` is known;
    - `env.GITHUB_SHA` matches `^[0-9a-f]{40}$`;
    - the four runner fields are non-empty;
    - signing parses;
    - every expected asset exists in `releaseDir`.
  - Then rename each asset into `<outDir>/assets/` and hash it.
  - Write `<outDir>/build-<variant>.json` (2-space JSON plus newline):
    `{ variant, artifact: 'candidate-<variant>', commit, version, runner, node, electron, electron_builder, builder_config, signing, assets }`.
  - Read `version` from `<repoRoot>/package.json`, `electron` and `electron_builder` from their
    `node_modules/<name>/package.json`, and `builder_config` by hashing the variant's config files.
  - Signing:
    - `win` → `{ mode: 'unsigned' }`, whatever the env holds;
    - mac with `ASKTOTO_MAC_SIGN_IDENTITY` → it must match `^[0-9A-Fa-f]{40}$`, recorded as
      `{ mode: 'qa-identity', certificate_sha1: <lowercase> }`;
    - mac without it → `{ mode: 'ad-hoc' }`.
  - Missing asset message: `mac: the build produced no Metis-1.9.7.dmg in release/`.
- **`assembleProvenance(records, env)`**:
  - `env` needs `GITHUB_SHA` (40 hex), `GITHUB_RUN_ID` (positive integer), `GITHUB_REPOSITORY` and
    `GITHUB_SERVER_URL`.
  - Require exactly one record per variant, with no unknown or duplicate variant.
  - Every `record.commit === GITHUB_SHA`, and all `record.version` values are equal.
  - Asset names are unique across builds.
  - Returns the section 4 object. It hoists `commit` and `version` to the top and removes them from each
    build, and sets `run.url = <server>/<repository>/actions/runs/<id>`.
- **`sha256Sums(assets)`**: sort by name and join `<sha256>  <name>\n`.
- **`directoryProblems(provenance, dir, variants)`**:
  - The expected files are the assets of those builds. Every requested variant must exist in
    `provenance.builds`.
  - Report a missing file, an unexpected file (the directory must hold exactly the expected set), a size
    mismatch, and a sha256 mismatch. Hash only when the size matches.
- **`evidenceProblems(evidenceText, provenance)`**:
  - Trailing newlines are ignored. The remaining text splits on `\r?\n`, and a blank line in the middle
    is a problem (`line 3 is blank`).
  - Each line must be a JSON object. Only these fields are read:
    - `ticket`, matching `^M2-\d{4}$`;
    - `result === 'PASS'`;
    - `build_run_id === provenance.run.id`;
    - `artifact_sha256`, one of the candidate's sha256 values (any variant).
  - Zero records gives `no evidence records: promotion needs at least one passing record bound to these bytes`.
  - Messages name the line, for example `line 2 (M2-0028) is bound to run 41, not this candidate's run 42`.
  - Full record validation belongs to M2-0002's checker, not here. This function checks only the binding.
- **`prepareRelease`** (promotion):
  - Read `provenancePath` as bytes and parse them.
  - Collect problems from:
    - `provenance.run.id !== candidateRun`;
    - `provenance.commit !== candidateCommit`;
    - `evidenceProblems`;
    - `directoryProblems(provenance, downloadsDir, PROMOTABLE_VARIANTS)`.
    If there are any, throw before touching the filesystem.
  - Otherwise:
    - create `<outDir>/upload/` and rename each promotable asset into it;
    - write `upload/SHA256SUMS.txt` (promotable assets only);
    - write `upload/provenance.json` using the **original bytes**;
    - write `<outDir>/manifest.json`, an array of `{ name, size, sha256 }` for every file in `upload/`;
    - write `<outDir>/notes.md` from `releaseNotes`, with the evidence summary
      `{ count, tickets: sorted unique, sha256: sha256 of the evidence file bytes }` and
      `promotionRunUrl` from `env` (`GITHUB_SERVER_URL`, `GITHUB_REPOSITORY`, `GITHUB_RUN_ID`).
- **`releaseNotes`**: exactly this shape (placeholders in braces):

```md
Owner-channel prerelease of Métis {version}. These files are the exact bytes of QA candidate run [{run.id}]({run.url}), built once from commit `{commit}` and promoted by [this run]({promotionRunUrl}) without rebuilding.

**This is not a signed customer release.** {macSigning} The Windows installers carry no Authenticode signature. On macOS, allow the first launch in System Settings → Privacy & Security → Open Anyway; on Windows, choose More info → Run anyway. In-app update does not offer this build, so install it by hand.

**Evidence:** {count} passing record(s) ({tickets joined by ", "}) bound to these bytes. Evidence file SHA-256: `{evidence.sha256}`.

| File | SHA-256 |
|---|---|
| `{name}` | `{sha256}` |   ← one row per promotable asset

`provenance.json` records the commit, the candidate run, the runner images and the Node, Electron and electron-builder versions and builder configuration hashes of every build. Check a download with `shasum -a 256 -c SHA256SUMS.txt` on macOS or `Get-FileHash` on Windows.
```

  `{macSigning}` depends on the mac build's signing mode:
  - `qa-identity`: `The macOS app is signed with the program's self-signed QA certificate (SHA-1 \`{sha1}\`), not a Developer ID, and it is not notarized.`
  - `ad-hoc`: `The macOS app is ad-hoc signed and not notarized.`

- **`uploadProblems(manifest, uploaded)`**:
  - `uploaded` is GitHub's asset array, and each entry needs `name`, `size`, `state` and `digest`.
  - The set of names must equal the manifest's names.
  - For each asset: `state === 'uploaded'`, sizes equal, and `digest === 'sha256:' + sha256`.
  - A missing or null digest gives `GitHub reported no digest for {name}; the uploaded bytes cannot be proven`.

**CLI.** The dispatch runs only when the module is the entry point
(`import.meta.url === pathToFileURL(process.argv[1]).href`). A failed check prints its problems to
stderr and exits 1. A usage error exits 2.

| Command | Does |
|---|---|
| `stage <variant> <release-dir> <out-dir>` | `stageBuild` with `repoRoot = process.cwd()`, `env = process.env`, `nodeVersion = process.version` |
| `assemble <records-dir> <out-dir>` | reads every `build-*.json` in `records-dir` and writes `<out-dir>/provenance.json` and `<out-dir>/SHA256SUMS.txt` |
| `verify <provenance.json> <dir> <variant>...` | `directoryProblems` |
| `prepare-release <provenance.json> <evidence.jsonl> <downloads-dir> <out-dir> --candidate-run <id> --candidate-commit <sha>` | `prepareRelease` |
| `check-release <manifest.json> <uploaded.json>` | `uploadProblems` |

### 5.7 `.github/workflows/qa-candidate.yml` (NEW)

Write it as below. Comments state reasons, not history. SHAs were OBSERVED 2026-09-26 via
`gh api repos/actions/<name>/commits/v4`:
- checkout: `11d5960a326750d5838078e36cf38b85af677262` (the SHA already pinned in
  `windows-signing-identity-preflight.yml`);
- setup-node: `49933ea5288caeca8642d1e84afbd3f7d6820020`;
- cache: `0057852bfaa89a56745cba8c7296529d2fc39830`;
- upload-artifact: `ea165f8d65b6e75b540449e92b4886f43607fa02`;
- download-artifact: `d3f86a106a0bac45b974a628896c90dbdf5c8093`.

```yaml
name: QA candidate

# Builds one candidate once (ADR-022): every shipped macOS and Windows installer plus the macOS
# QA-identity variant, from one named main commit, in one run. It records provenance (sha256 per
# installer, commit, run, runner image, Node, Electron and electron-builder versions, builder config
# hashes), then verifies, installs and launches every installer by sha256. Packaged gates elsewhere
# consume these bytes by sha256, and promote-candidate.yml publishes the same bytes. This workflow never
# signs with a Developer ID, publishes, or pushes a tag.
#
# A pull request that changes the lane's own files runs it as a self-test. Such a run builds the PR's
# merge commit and can never be promoted.
run-name: ${{ github.event_name == 'pull_request' && format('QA candidate self-test (PR {0})', github.event.pull_request.number) || format('QA candidate {0}', inputs.commit) }}

on:
  workflow_dispatch:
    inputs:
      commit:
        description: main's current commit (full 40-character SHA)
        required: true
        type: string
  pull_request:
    paths:
      - .github/workflows/qa-candidate.yml
      - build/qa-identity.electron-builder.yml
      - scripts/qa/provenance.mjs

permissions:
  contents: read

concurrency:
  group: qa-candidate-${{ github.event.pull_request.number || github.run_id }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

defaults:
  run:
    shell: bash

jobs:
  guard:
    name: Check what this run may build
    if: github.repository == 'mysticalsin/AskToto-Mantu' && (github.event_name == 'pull_request' || github.ref == 'refs/heads/main')
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - name: The named commit is main's head
        if: github.event_name == 'workflow_dispatch'
        env:
          COMMIT: ${{ inputs.commit }}
        run: |
          if [ "$COMMIT" != "$GITHUB_SHA" ]; then
            echo "::error::main is at $GITHUB_SHA and the named commit differs. Dispatch again naming main's current commit."
            exit 1
          fi

  build-mac:
    name: Build ${{ matrix.variant }}
    needs: guard
    runs-on: macos-latest
    timeout-minutes: 120
    strategy:
      matrix:
        include:
          - variant: mac
            script: dist
          - variant: mac-qa-identity
            script: dist:qa-identity
    steps:
      - name: Build once
        run: |
          if [ "$GITHUB_RUN_ATTEMPT" != 1 ]; then
            echo "::error::A candidate is built once. Dispatch a new run; its bytes are a new candidate."
            exit 1
          fi
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      # predist's check-ffmpeg-sidecar.mjs verifies each binary against resources/ffmpeg/manifest.json
      # before running it, so trust comes from that hash, not from the download or from Gatekeeper.
      - name: Provision the reviewed ffmpeg sidecars
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh release download ffmpeg-sidecar-v1 --repo "$GITHUB_REPOSITORY" --pattern 'ffmpeg-darwin-*' --dir resources/ffmpeg
          for arch in arm64 x64; do
            mkdir -p "resources/ffmpeg/darwin-$arch"
            mv "resources/ffmpeg/ffmpeg-darwin-$arch" "resources/ffmpeg/darwin-$arch/ffmpeg"
            chmod +x "resources/ffmpeg/darwin-$arch/ffmpeg"
            xattr -d com.apple.quarantine "resources/ffmpeg/darwin-$arch/ffmpeg" 2>/dev/null || true
          done
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.22.3
          cache: npm
      - run: npm ci
      # Same key as build.yml. fetch-models.mjs reuses cached files only after its exact manifest gate.
      - uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4
        with:
          path: |
            resources/models
            resources/asr
            resources/ort
            resources/llama
            resources/local-llm
          key: runtime-assets-${{ runner.os }}-${{ hashFiles('scripts/fetch-models.mjs', 'resources/runtime-assets-manifest.json') }}-${{ hashFiles('scripts/fetch-llama-server.mjs') }}-${{ hashFiles('scripts/fetch-local-model.mjs', 'scripts/local-model-assets.mjs') }}
      # A stable identity keeps one designated requirement across candidates, so TCC grants persist.
      # Without the secret (owner step B-05) the candidate is ad-hoc signed, and provenance says so.
      - name: Import the stable QA signing identity
        id: identity
        env:
          QA_MAC_SIGNING: ${{ secrets.QA_MAC_SIGNING }}
        run: |
          if [ -z "$QA_MAC_SIGNING" ]; then
            echo "::warning::QA_MAC_SIGNING is not set (B-05): this candidate is ad-hoc signed, so TCC grants will not carry over to the next candidate."
            exit 0
          fi
          password=$(jq -r .password <<<"$QA_MAC_SIGNING")
          keychain_password=$(openssl rand -hex 32)
          echo "::add-mask::$password"
          echo "::add-mask::$keychain_password"
          keychain="$RUNNER_TEMP/qa-identity.keychain-db"
          jq -r .p12_base64 <<<"$QA_MAC_SIGNING" | base64 --decode > "$RUNNER_TEMP/qa-identity.p12"
          security create-keychain -p "$keychain_password" "$keychain"
          echo "keychain=$keychain" >> "$GITHUB_OUTPUT"
          security set-keychain-settings -lut 21600 "$keychain"
          security unlock-keychain -p "$keychain_password" "$keychain"
          security import "$RUNNER_TEMP/qa-identity.p12" -k "$keychain" -P "$password" -T /usr/bin/codesign
          rm "$RUNNER_TEMP/qa-identity.p12"
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$keychain_password" "$keychain" > /dev/null
          security list-keychains -d user -s "$keychain" $(security list-keychains -d user | tr -d '"')
          identities=$(security find-identity -p codesigning "$keychain")
          if grep -q '"Developer ID' <<<"$identities"; then
            echo "::error::QA_MAC_SIGNING holds a Developer ID identity. The QA lane never signs with Developer ID."
            exit 1
          fi
          fingerprint=$(grep -Eo '[0-9A-F]{40}' <<<"$identities" | sort -u)
          if [ -z "$fingerprint" ] || [ "$(wc -l <<<"$fingerprint")" -ne 1 ]; then
            echo "::error::QA_MAC_SIGNING must hold exactly one code-signing identity."
            exit 1
          fi
          echo "ASKTOTO_MAC_SIGN_IDENTITY=$fingerprint" >> "$GITHUB_ENV"
      - name: Build the ${{ matrix.variant }} installers
        run: npm run ${{ matrix.script }}
      - name: Refuse any installer over GitHub's per-asset limit
        run: npm run check:release
        env:
          ASKTOTO_ARTIFACTS_DIR: release
      - name: Stage and hash the installers
        run: node scripts/qa/provenance.mjs stage ${{ matrix.variant }} release candidate
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: candidate-${{ matrix.variant }}
          path: candidate/assets/
          if-no-files-found: error
          retention-days: ${{ github.event_name == 'pull_request' && 7 || 30 }}
          compression-level: 0
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: build-${{ matrix.variant }}
          path: candidate/build-${{ matrix.variant }}.json
          if-no-files-found: error
          retention-days: ${{ github.event_name == 'pull_request' && 7 || 30 }}
      - name: Remove the QA keychain
        if: always() && steps.identity.outputs.keychain != ''
        env:
          KEYCHAIN: ${{ steps.identity.outputs.keychain }}
        run: security delete-keychain "$KEYCHAIN"

  build-win:
    name: Build win
    needs: guard
    runs-on: windows-latest
    timeout-minutes: 90
    steps:
      - name: Build once
        run: |
          if [ "$GITHUB_RUN_ATTEMPT" != 1 ]; then
            echo "::error::A candidate is built once. Dispatch a new run; its bytes are a new candidate."
            exit 1
          fi
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      - name: Provision the reviewed ffmpeg sidecar
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh release download ffmpeg-sidecar-v1 --repo "$GITHUB_REPOSITORY" --pattern 'ffmpeg-win32-x64.exe' --dir resources/ffmpeg
          mkdir -p resources/ffmpeg/win32-x64
          mv resources/ffmpeg/ffmpeg-win32-x64.exe resources/ffmpeg/win32-x64/ffmpeg.exe
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.22.3
          cache: npm
      - run: npm ci
      - uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4
        with:
          path: |
            resources/models
            resources/asr
            resources/ort
            resources/llama
            resources/local-llm
          key: runtime-assets-${{ runner.os }}-${{ hashFiles('scripts/fetch-models.mjs', 'resources/runtime-assets-manifest.json') }}-${{ hashFiles('scripts/fetch-llama-server.mjs') }}-${{ hashFiles('scripts/fetch-local-model.mjs', 'scripts/local-model-assets.mjs') }}
      # No signing secret reaches this job, so electron-builder leaves both installers unsigned.
      - name: Build the win installers
        run: npm run dist:win
      - name: Refuse any installer over GitHub's per-asset limit
        run: npm run check:release
        env:
          ASKTOTO_ARTIFACTS_DIR: release
      - name: Stage and hash the installers
        run: node scripts/qa/provenance.mjs stage win release candidate
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: candidate-win
          path: candidate/assets/
          if-no-files-found: error
          retention-days: ${{ github.event_name == 'pull_request' && 7 || 30 }}
          compression-level: 0
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: build-win
          path: candidate/build-win.json
          if-no-files-found: error
          retention-days: ${{ github.event_name == 'pull_request' && 7 || 30 }}

  provenance:
    name: Record provenance
    needs: [build-mac, build-win]
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.22.3
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with:
          pattern: build-*
          path: builds
          merge-multiple: true
      - name: Assemble provenance.json and SHA256SUMS.txt
        run: |
          node scripts/qa/provenance.mjs assemble builds provenance
          { echo "### Candidate $GITHUB_RUN_ID"; echo '```'; cat provenance/SHA256SUMS.txt; echo '```'; } >> "$GITHUB_STEP_SUMMARY"
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: candidate-provenance
          path: provenance/
          if-no-files-found: error
          retention-days: ${{ github.event_name == 'pull_request' && 7 || 30 }}

  smoke-mac:
    name: Install and launch ${{ matrix.variant }} by sha256
    needs: provenance
    runs-on: macos-latest
    timeout-minutes: 30
    strategy:
      matrix:
        variant: [mac, mac-qa-identity]
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.22.3
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with:
          name: candidate-provenance
          path: provenance
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with:
          name: candidate-${{ matrix.variant }}
          path: assets
      - name: Verify every byte against the provenance
        run: node scripts/qa/provenance.mjs verify provenance/provenance.json assets ${{ matrix.variant }}
      - name: Install each installer, check its signature, launch it
        env:
          VARIANT: ${{ matrix.variant }}
        run: |
          expected=$(jq -r --arg v "$VARIANT" '.builds[] | select(.variant == $v) | .signing.certificate_sha1 // "ad-hoc"' provenance/provenance.json)
          for installer in assets/*; do
            target="$RUNNER_TEMP/installed"
            rm -rf "$target" && mkdir -p "$target"
            case "$installer" in
              *.dmg)
                volume="$RUNNER_TEMP/volume"
                hdiutil attach -nobrowse -readonly -mountpoint "$volume" "$installer" > /dev/null
                bundle=$(cd "$volume" && ls -d *.app)
                ditto "$volume/$bundle" "$target/$bundle"
                hdiutil detach "$volume" > /dev/null ;;
              *.zip) ditto -x -k "$installer" "$target" ;;
            esac
            app=$(find "$target" -maxdepth 1 -name '*.app' -print -quit)
            if [ "$expected" = ad-hoc ]; then
              codesign -dv "$app" 2>&1 | grep -qx 'Signature=adhoc' \
                || { echo "::error::$installer is not ad-hoc signed, but its provenance says it is."; exit 1; }
            else
              rm -rf "$RUNNER_TEMP/certificate" && mkdir "$RUNNER_TEMP/certificate"
              codesign -d --extract-certificates="$RUNNER_TEMP/certificate/c" "$app"
              [ "$(shasum -a 1 "$RUNNER_TEMP/certificate/c0" | cut -d' ' -f1)" = "$expected" ] \
                || { echo "::error::$installer is not signed with the QA certificate its provenance records."; exit 1; }
            fi
            ASKTOTO_MAC_LAUNCH_GATE=1 node scripts/check-packaged-launch.mjs "$app"
          done

  smoke-win:
    name: Install and launch win by sha256
    needs: provenance
    runs-on: windows-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.22.3
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with:
          name: candidate-provenance
          path: provenance
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with:
          name: candidate-win
          path: assets
      - name: Verify every byte against the provenance
        run: node scripts/qa/provenance.mjs verify provenance/provenance.json assets win
      - name: Install the Setup silently and launch it, then launch the Portable
        shell: pwsh
        run: |
          $ErrorActionPreference = 'Stop'
          foreach ($exe in Get-ChildItem assets -Filter *.exe) {
            if ((Get-AuthenticodeSignature $exe.FullName).Status -ne 'NotSigned') { throw "$($exe.Name) is signed; Windows candidates are unsigned." }
          }
          $target = Join-Path $env:RUNNER_TEMP 'installed'
          $setup = Get-Item assets/Metis-Setup-*.exe
          $install = Start-Process -FilePath $setup.FullName -ArgumentList '/S', "/D=$target" -Wait -PassThru
          if ($install.ExitCode -ne 0) { throw "Setup exited with $($install.ExitCode)." }
          node scripts/check-packaged-launch.mjs (Join-Path $target 'Metis.exe')
          if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
          node scripts/check-packaged-launch.mjs (Get-Item assets/Metis-Portable-*.exe).FullName
          if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

Notes for the implementer:
- `npm run ${{ matrix.script }}` interpolates a static matrix value, not user input.
- `candidate/assets/` becomes the artifact root, so a downloaded `candidate-<variant>` holds only the
  installers, which `verify` requires.
- The NSIS `/D=` argument must stay last and unquoted.
- `check-packaged-launch.mjs` imports only node builtins (OBSERVED), and so does `provenance.mjs`, so gate
  jobs need no `npm ci`.

### 5.8 `.github/workflows/promote-candidate.yml` (NEW)

```yaml
name: Promote candidate

# Publishes the exact bytes of one successful qa-candidate run as an owner-channel prerelease on the
# release feed (D-13): a prerelease, never Latest, with no latest*.yml or blockmaps, plus SHA256SUMS.txt
# and provenance.json. It never builds. It downloads the candidate's artifacts, proves every byte against
# the candidate's provenance and the promotion evidence, and checks GitHub's digest of every uploaded
# asset before publishing. The release and its tag are created in the feed repository, which runs no
# workflows; release.yml runs only on tag pushes to this repository, so promotion cannot start it.
run-name: Promote candidate run ${{ inputs.candidate_run_id }} (publish ${{ inputs.publish }})

on:
  workflow_dispatch:
    inputs:
      candidate_run_id:
        description: Run ID of a successful qa-candidate run on main
        required: true
        type: string
      evidence:
        description: Evidence records (JSON Lines) bound to that run's bytes; pass them with -F evidence=@file
        required: true
        type: string
      publish:
        description: Publish the prerelease. When false (a dry run) the draft is verified and then deleted
        required: true
        type: boolean
        default: false
      confirm_version:
        description: Required to publish; the candidate's version, exactly
        required: false
        type: string
        default: ''

permissions:
  contents: read
  actions: read

concurrency:
  group: promote-candidate
  cancel-in-progress: false

defaults:
  run:
    shell: bash

env:
  # The public release feed: electron-builder.yml publish.owner/repo and src/main/updater.ts.
  FEED: mysticalsin/Metis-Releases

jobs:
  promote:
    name: Promote the tested bytes
    if: github.repository == 'mysticalsin/AskToto-Mantu' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    timeout-minutes: 90
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22.22.3
      - name: Require a fully successful qa-candidate run on main
        id: candidate
        env:
          GH_TOKEN: ${{ github.token }}
          RUN_ID: ${{ inputs.candidate_run_id }}
        run: |
          if ! [[ "$RUN_ID" =~ ^[1-9][0-9]*$ ]]; then
            echo "::error::candidate_run_id must be a workflow run ID."; exit 1
          fi
          run=$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$RUN_ID")
          jq -e '.path == ".github/workflows/qa-candidate.yml" and .event == "workflow_dispatch" and .head_branch == "main" and .status == "completed" and .conclusion == "success"' <<<"$run" > /dev/null \
            || { echo "::error::Run $RUN_ID is not a completed, successful qa-candidate dispatch on main."; exit 1; }
          gh api "repos/$GITHUB_REPOSITORY/actions/runs/$RUN_ID/jobs?filter=latest&per_page=100" \
            | jq -e '.total_count > 0 and all(.jobs[]; .conclusion == "success")' > /dev/null \
            || { echo "::error::Every job of run $RUN_ID must have succeeded; a skipped gate is not a pass."; exit 1; }
          echo "commit=$(jq -r .head_sha <<<"$run")" >> "$GITHUB_OUTPUT"
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with:
          name: candidate-provenance
          path: provenance
          run-id: ${{ inputs.candidate_run_id }}
          github-token: ${{ github.token }}
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with:
          name: candidate-mac
          path: downloads
          run-id: ${{ inputs.candidate_run_id }}
          github-token: ${{ github.token }}
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4
        with:
          name: candidate-win
          path: downloads
          run-id: ${{ inputs.candidate_run_id }}
          github-token: ${{ github.token }}
      - name: Check the evidence and stage exactly the tested bytes
        id: stage
        env:
          EVIDENCE: ${{ inputs.evidence }}
          CANDIDATE_RUN: ${{ inputs.candidate_run_id }}
          CANDIDATE_COMMIT: ${{ steps.candidate.outputs.commit }}
        run: |
          printf '%s' "$EVIDENCE" > "$RUNNER_TEMP/evidence.jsonl"
          node scripts/qa/provenance.mjs prepare-release provenance/provenance.json "$RUNNER_TEMP/evidence.jsonl" downloads "$RUNNER_TEMP/promotion" \
            --candidate-run "$CANDIDATE_RUN" --candidate-commit "$CANDIDATE_COMMIT"
          echo "version=$(jq -r .version provenance/provenance.json)" >> "$GITHUB_OUTPUT"
      - name: Choose the release tag
        id: tag
        env:
          PUBLISH: ${{ inputs.publish }}
          CONFIRM: ${{ inputs.confirm_version }}
          VERSION: ${{ steps.stage.outputs.version }}
          CANDIDATE_RUN: ${{ inputs.candidate_run_id }}
        run: |
          if [ "$PUBLISH" = true ]; then
            [ "$CONFIRM" = "$VERSION" ] || { echo "::error::To publish, set confirm_version to exactly $VERSION."; exit 1; }
            echo "tag=v$VERSION" >> "$GITHUB_OUTPUT"
          else
            echo "tag=v$VERSION-dryrun.$CANDIDATE_RUN" >> "$GITHUB_OUTPUT"
          fi
      # GITHUB_TOKEN cannot write to another repository; GH_TOKEN is the feed token release.yml also uses.
      - name: Upload to a draft on the feed and verify every uploaded byte
        id: draft
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          TAG: ${{ steps.tag.outputs.tag }}
          VERSION: ${{ steps.stage.outputs.version }}
        run: |
          if gh api "repos/$FEED/releases?per_page=100" --paginate --jq '.[].tag_name' | grep -Fxq "$TAG"; then
            echo "::error::$FEED already has a release named $TAG. Versions are never reused."; exit 1
          fi
          if lookup=$(gh api "repos/$FEED/git/ref/tags/$TAG" 2>&1); then
            echo "::error::$FEED already has the tag $TAG. Versions are never reused."; exit 1
          elif ! grep -q 'HTTP 404' <<<"$lookup"; then
            echo "::error::Could not confirm that $TAG is unused on $FEED."; exit 1
          fi
          gh release create "$TAG" --repo "$FEED" --draft --prerelease --latest=false --target main \
            --title "Métis $VERSION (owner channel)" --notes-file "$RUNNER_TEMP/promotion/notes.md" \
            "$RUNNER_TEMP"/promotion/upload/*
          release_id=$(gh release view "$TAG" --repo "$FEED" --json databaseId --jq .databaseId)
          echo "release_id=$release_id" >> "$GITHUB_OUTPUT"
          gh api "repos/$FEED/releases/$release_id/assets?per_page=100" > "$RUNNER_TEMP/uploaded.json"
          node scripts/qa/provenance.mjs check-release "$RUNNER_TEMP/promotion/manifest.json" "$RUNNER_TEMP/uploaded.json"
      - name: Publish the prerelease (never Latest)
        if: inputs.publish
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          RELEASE_ID: ${{ steps.draft.outputs.release_id }}
          TAG: ${{ steps.tag.outputs.tag }}
        run: |
          gh api -X PATCH "repos/$FEED/releases/$RELEASE_ID" -F draft=false -F prerelease=true -f make_latest=false > /dev/null
          gh api "repos/$FEED/releases/$RELEASE_ID" | jq -e --arg tag "$TAG" '.draft == false and .prerelease == true and .tag_name == $tag' > /dev/null \
            || { echo "::error::$TAG did not become a published prerelease."; exit 1; }
          latest=$(gh api "repos/$FEED/releases/latest" --jq .tag_name 2>/dev/null || true)
          [ "$latest" != "$TAG" ] || { echo "::error::$TAG became Latest."; exit 1; }
          echo "Published $TAG: https://github.com/$FEED/releases/tag/$TAG" >> "$GITHUB_STEP_SUMMARY"
      - name: Delete the draft (dry run or failed promotion)
        if: always() && steps.draft.outputs.release_id != '' && (failure() || !inputs.publish)
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          RELEASE_ID: ${{ steps.draft.outputs.release_id }}
          TAG: ${{ steps.tag.outputs.tag }}
        run: |
          [ "$(gh api "repos/$FEED/releases/$RELEASE_ID" --jq .draft)" = true ] \
            || { echo "::error::Release $RELEASE_ID is not a draft; refusing to delete it."; exit 1; }
          gh api -X DELETE "repos/$FEED/releases/$RELEASE_ID"
          echo "Draft $TAG was uploaded, verified against GitHub's digests and deleted." >> "$GITHUB_STEP_SUMMARY"
```

A draft never creates a tag. Publishing creates `v<version>` on the feed repo's `main`. The feed repo
holds only `README.md` and runs no workflows (OBSERVED).

### 5.9 `scripts/qa/make-qa-identity.sh` (NEW, mode 100755; owner-run, B-05)

```bash
#!/usr/bin/env bash
# Creates the stable QA code-signing identity for the QA candidate lane and stores it as this
# repository's QA_MAC_SIGNING secret (M2-0187, owner step B-05). The program owner runs it once, on macOS,
# in an account where `gh` is signed in.
#
# The identity is a self-signed code-signing certificate valid for ten years. Candidates signed with it
# keep one designated requirement across builds, so a TCC grant given to one candidate carries over to
# the next. It is not a Developer ID and cannot notarize.
#
# The private key exists only in a temporary directory, deleted on exit, and in the secret. Replacing the
# identity resets every TCC grant made to earlier candidates, so replacing needs --replace.
#
#   scripts/qa/make-qa-identity.sh [--replace]
set -euo pipefail

readonly REPO=mysticalsin/AskToto-Mantu
readonly SECRET=QA_MAC_SIGNING
readonly NAME='Metis QA Code Signing'
# macOS LibreSSL. Its PKCS#12 output with these algorithms imports with `security import`.
readonly OPENSSL=/usr/bin/openssl

replace=false
case "${1:-}" in
  '') ;;
  --replace) replace=true ;;
  *) echo "usage: $0 [--replace]" >&2; exit 2 ;;
esac

if ! $replace && gh secret list --repo "$REPO" --json name --jq '.[].name' | grep -Fxq "$SECRET"; then
  echo "$SECRET already exists. Replacing it resets TCC grants for every earlier candidate; rerun with --replace to do that." >&2
  exit 1
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
cat > "$work/request.cnf" <<EOF
[req]
distinguished_name = subject
x509_extensions = code_signing
prompt = no
[subject]
CN = $NAME
[code_signing]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, codeSigning
subjectKeyIdentifier = hash
EOF
"$OPENSSL" req -x509 -newkey rsa:3072 -nodes -days 3650 -config "$work/request.cnf" \
  -keyout "$work/key.pem" -out "$work/certificate.pem"
P12_PASSWORD=$("$OPENSSL" rand -hex 32)
export P12_PASSWORD
"$OPENSSL" pkcs12 -export -name "$NAME" -inkey "$work/key.pem" -in "$work/certificate.pem" \
  -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg sha1 -passout env:P12_PASSWORD -out "$work/identity.p12"
printf '{"p12_base64":"%s","password":"%s"}' "$(base64 < "$work/identity.p12" | tr -d '\n')" "$P12_PASSWORD" \
  | gh secret set "$SECRET" --repo "$REPO"
fingerprint=$("$OPENSSL" x509 -in "$work/certificate.pem" -noout -fingerprint -sha1 | cut -d= -f2 | tr -d : | tr 'A-F' 'a-f')
echo "$SECRET is set. QA certificate SHA-1: $fingerprint"
echo "Every later candidate's provenance.json must show signing.certificate_sha1 = $fingerprint."
```

The lane parses the secret with `jq -r .password` and `jq -r .p12_base64`. Base64 and hex need no JSON
escaping.

### 5.10 Private `docs/metis-2.0/runbooks/qa-candidate.md` (NEW)

Write it in plain words, with exact commands and no secrets. Sections:

1. **What the lane guarantees.** Summarise INV-1..INV-8 in one paragraph and give the artifact names.
2. **One-time owner setup (B-05).**
   - Run `scripts/qa/make-qa-identity.sh` in the owner's primary account, where `gh` is already signed
     in. It reads no Métis data, writes only a temporary directory, and runs no other repository code.
   - Do not sign `gh` in on the QA account: agents have shell access there (M2-0007), and a GitHub
     credential there would let them act as the owner.
   - Record the printed fingerprint. B-05 closes when a dispatched candidate's `provenance.json` shows
     `signing.mode: qa-identity` with that fingerprint and both mac smoke gates pass.
3. **Build a candidate.**
   - `gh workflow run qa-candidate.yml --repo mysticalsin/AskToto-Mantu --ref main -f commit=$(gh api repos/mysticalsin/AskToto-Mantu/commits/main --jq .sha)`.
   - Find the run with `gh run list --workflow qa-candidate.yml --limit 1`.
   - Read `SHA256SUMS.txt` in the run summary.
   - If the run fails, dispatch a new run; never re-run a build job.
4. **Where each form may run (PD-05).**
   - Shipping identity: the QA macOS user, the Windows laptop, windows-latest and CI.
   - QA-identity variant: the only form allowed on the owner's primary account, with written per-run
     consent. Quit the live Métis first, because both use the same fixed local ports (UNKNOWN which ones;
     M2-0007 measures it).
5. **Install by sha256.**
   - `gh run download <id> -n candidate-provenance -n candidate-<variant> -D candidate-<id>`.
   - Check the lines for the files you took with `shasum -a 256 -c`.
   - Then `ditto -x -k` (zip) or drag from the dmg.
   - First launch needs System Settings → Privacy & Security → Open Anyway. The TCC grants follow
     M2-0007's `tcc-grants.md`.
6. **Evidence for promotion.**
   - Host gates write M2-0002 records with `artifact_sha256` and `build_run_id`.
   - Build the input with `jq -c 'select(.build_run_id == <id>)' docs/metis-2.0/evidence/records/*.jsonl > evidence-<id>.jsonl`.
   - Promotion accepts only PASS records bound to that run and its bytes. The release ticket lists which
     gates must be present, and Opus validation checks that list.
7. **Dry run.** Agents may run it only with the owner's approval:
   `gh workflow run promote-candidate.yml --repo mysticalsin/AskToto-Mantu --ref main -f candidate_run_id=<id> -F evidence=@evidence-<id>.jsonl`.
   It proves download-by-hash, staging, upload to a draft and a digest match, then deletes the draft.
8. **Publish (owner only).** Add `-f publish=true -f confirm_version=<version>`. Afterwards, check that
   the release is a prerelease, is not Latest, and has exactly the four installers plus
   `SHA256SUMS.txt` and `provenance.json`.
9. **Failures and their fixes.**
   - main moved: dispatch again with main's current commit.
   - Re-run refused: dispatch a new run.
   - Size gate failed.
   - Evidence refused: the message names the line.
   - Tag already used: versions are never reused.
   - Feed token rejected: the owner refreshes `GH_TOKEN` with contents write on Metis-Releases.
   - A draft left after a cancelled run: delete it only if the API says `draft: true`.
10. **Rollback.** Delete the two workflows; `release.yml` is unchanged. The owner can return a
    published prerelease to draft.

## 6. Tests, red first

Commit 1 contains only tests, plus the contract list change. It must be red in CI for exactly these
reasons:
- the provenance suite fails (the module is missing);
- after-pack test 18 fails (the code signs with `-`);
- launch test 19 fails (it spawns `MacOS/Metis`);
- the chain contract fails (`dist:qa-identity` is missing).

Commit 2 contains the implementation and is green. Tests exercise behaviour through real files in
`mkdtemp` directories or through mocked process boundaries, never by regex over source text. The one
source-text edit is adding a name to the existing `MAC_BUILD_CHAINS` list.

Fixture rule: no literal high-entropy hex in tests. Compute hashes with `createHash`, and use
`'a'.repeat(40)`-style values for commits and fingerprints, so gitleaks has nothing to flag.

`scripts/qa/provenance.test.mjs` (`node:test`, `assert/strict`). A `fixture()` helper builds a temp repo
root holding:
- `package.json` with version `1.9.7`;
- `node_modules/electron/package.json` with `43.6.0` and `node_modules/electron-builder/package.json`
  with `26.15.3`;
- the three config files with small distinct texts;
- `release/` with each installer name containing distinct text.

`env()` returns `GITHUB_SHA`, `GITHUB_RUN_ID=42`, `GITHUB_REPOSITORY=owner/repo`,
`GITHUB_SERVER_URL=https://github.com`, `RUNNER_OS`, `RUNNER_ARCH`, `ImageOS` and `ImageVersion`.

| # | Test | Asserts |
|---|---|---|
| 1 | stage moves exactly the variant's installers and records size and sha256 | files now in `out/assets`, gone from `release/`; sha256 = `createHash` of the content; other variants' files untouched |
| 2 | stage records the runner image, Node, Electron, electron-builder and per-file builder config hashes | record fields equal to the fixture values; `builder_config` in `extends` order |
| 3 | stage refuses a missing installer and moves nothing | throws naming the file; `release/` unchanged |
| 4 | stage refuses a build without the runner image | throws naming `ImageOS`; nothing moved |
| 5 | stage records the mac identity from the environment, ad-hoc without it, and unsigned on Windows even with it set | three signing shapes; the fingerprint is lowercased |
| 6 | stage refuses a malformed signing identity | throws |
| 7 | assemble binds every build to one commit and run and lists every asset in SHA256SUMS | top-level `commit`, `version`, `run.url`; builds sorted; `commit`/`version` hoisted; `sha256Sums` sorted with two spaces |
| 8 | assemble refuses a missing or duplicated variant, a foreign commit and mismatched versions | four throws, each naming its cause |
| 9 | verify accepts the exact bytes and names a changed byte, a missing file and an extra file | a same-size one-byte change is reported as a sha256 mismatch |
| 10 | evidence needs at least one PASS record bound to this run and its bytes | empty text gives a problem; one valid record gives `[]`; a trailing newline is accepted |
| 11 | evidence problems name the line | FAIL result, other run, foreign hash, bad ticket id, invalid JSON, interior blank line |
| 12 | prepare-release publishes only the shipping installers with SHA256SUMS.txt and the original provenance.json | QA zip stays in downloads; `upload/` has 4 installers and 2 files; SHA256SUMS lists 4; provenance bytes identical; manifest covers all 6 |
| 13 | prepare-release refuses unbound provenance or refused evidence and moves nothing | wrong run and wrong commit each throw; downloads untouched; no `upload/` |
| 14 | release notes state version, commit, candidate run, promotion run, not-Latest wording, signing and the evidence hash | both mac signing sentences; one table row per promotable asset |
| 15 | check-release accepts matching digests and refuses a missing, extra, resized, not-uploaded or undigested asset | one problem each |
| 16 | the CLI stages, assembles, verifies and prepares a release end to end | `spawnSync(process.execPath, [module, …])` per subcommand over one fixture; exit 0; `verify` after a corrupted byte exits 1; a usage error exits 2 |

`scripts/qa/provenance.test.ts` (vitest wrapper). Copy the pattern of
`scripts/windows-signing-identity-preflight.test.ts`: spawn `node --test` on the suite and assert status
0, with `timeout: 60_000`. It inherits M2-0001's hermetic `test.env`.

`scripts/after-pack.test.ts` (new `describe('afterPack macOS signature')`):
- The fixture is `appOutDir/Metis.app/Contents/Resources/ffmpeg/darwin-arm64/ffmpeg` plus
  `app.asar.unpacked/node_modules`.
- The context is `arch: 3`, `electronPlatformName: 'darwin'`.
- Stub `ASKTOTO_ADHOC_SIGN=1` and `ASKTOTO_MAC_ARCHES=''`.

| # | Test |
|---|---|
| 17 | signs the final bundle ad-hoc by default: a `codesign` call contains `['--sign', '-']`, then `--verify --deep --strict` |
| 18 | signs with `ASKTOTO_MAC_SIGN_IDENTITY` when the lane provides one: `['--sign', 'A'.repeat(40)]` (red before 5.3) |

`scripts/check-packaged-launch.test.ts`:

| # | Test |
|---|---|
| 19 | launches the executable named after the bundle: argv `/fixture/Metis QA.app`, and `fixtures.spawn` receives `join('/fixture/Metis QA.app', 'Contents', 'MacOS', 'Metis QA')` (red before 5.5) |

`scripts/mac-chain-gates.contract.test.ts`:
- Add `'dist:qa-identity'` to `MAC_BUILD_CHAINS`.
- Make `chainWithHook` expand a pre-hook of exactly the form `npm run <script>` into that script's text,
  so `predist:qa-identity` counts as provisioning. Update its doc comment.

`check-packaged-runtime.mjs` has no unit suite: the script needs a full packaged tree with real Mach-O
files. Its change is covered by two runs: the build.yml dispatch (the `Metis` bundle) and the lane
self-test (the `Metis QA` bundle), as described in section 7.

## 7. Evidence plan (D-28: CI only)

1. Locally, run only `npx tsc --noEmit -p tsconfig.node.json` and `-p tsconfig.web.json`. Nothing else
   runs on the Mac.
2. Push commit 1 and record the red Build & Test run URL, listing the failing tests from section 6.
3. Push commit 2. Record the green Build & Test run and compare its job set with baseline
   `36267674617`.
4. The self-test on the PR proves LOCALLY_TESTED for the lane. The draft PR's diff touches
   `qa-candidate.yml`, so the `pull_request` trigger runs the whole lane on the PR head: both mac builds,
   win, provenance and all three smoke jobs. Record it with its `provenance.json` (signing
   `ad-hoc` while B-05 is open).
5. Dispatch Build & Test on the branch. The draft PR targets `m2/integration`, and build.yml packages
   only on PRs into main, so run `gh workflow run build.yml --ref m2/M2-0187-build-once-candidate` to
   prove that `npm run dist` and `npm run dist:win` still package and launch after the afterPack and
   runtime-gate edits.
6. Not runnable before the workflows reach main:
   - `promote-candidate.yml` and dispatched `qa-candidate.yml` (GitHub accepts `workflow_dispatch` only
     for workflows on the default branch);
   - the owner-approved dry run, run after the milestone merge.
   List both under "Not run" in the PR.
7. BLOCKED_EXTERNAL:
   - QA-identity signing (B-05);
   - TCC persistence across two QA-signed candidates (M2-0007 on `qa-mac`);
   - publication (owner, B-08).

## 8. What NOT to do

- Do not edit `release.yml` or `build.yml`, and do not change any existing chain in `package.json`.
- Do not reference `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_*` or `WIN_CSC_*` anywhere in the lane.
- Do not create or push a tag in this repository. Do not run `git tag` or `git push` in any workflow.
  Agents never dispatch promotion with `publish=true`.
- Do not publish `latest*.yml`, blockmaps or the QA variant. Do not pass `--latest`.
- Do not add a build, `npm ci` or `npm run` step to `promote-candidate.yml`.
- Do not allow a build job to run on a re-run attempt, and do not cache or restore `release/`.
- Do not interpolate `${{ inputs.* }}` or step outputs into `run:` bodies. Use `env:`.
- Do not echo, `set -x`, or write the QA secret, its password or the p12 anywhere but `$RUNNER_TEMP`;
  delete the p12 right after import. Agents never run `make-qa-identity.sh`.
- Do not add a compile-time QA flag, fault hook or reaper change. M2-0026 and M2-0027 own them (PD-23).
  The interface they use is in section 9, A2.
- Do not build a Windows QA-identity variant.
- Do not read the private program repository from public CI, and do not put the runbook in the public
  repo.
- Do not add dependencies. `provenance.mjs` uses node builtins only.
- Do not add regex tests over workflow YAML. The self-test run is the workflow's test.
- Do not rename `ASKTOTO_ADHOC_SIGN`, and do not change `--deep` signing or add notarization.

## 9. Acceptance amendments (for the orchestrator to apply to the ledger)

- **A1 (tag and release.yml).** Replace the clause "creates the git tag with the workflow token so
  release.yml is not re-triggered (ASSUMED …; verified in the dry run)" with: "publication creates the
  tag `v<version>` in the feed repository Metis-Releases, which runs no workflows (OBSERVED 2026-09-26);
  no tag is created in AskToto-Mantu; release.yml, which triggers only on tag pushes to AskToto-Mantu,
  cannot start (DERIVED)".
- **A2 (QA hooks).** "Legacy llama reaper rule disabled, QA fault hooks compiled in" holds vacuously at
  `70de3c30`: neither exists (OBSERVED by grep). The first consumer adds the switch (PD-23):
  - M2-0026 adds a Vite `define` keyed on `METIS_QA_IDENTITY=1`, and sets that variable on the
    `npm run build` inside `dist:qa-identity`. That chain is the only place a QA-identity bundle is
    compiled.
  - M2-0026 also adds a test that the shipping bundle lacks the hook.
  - M2-0027 gates the legacy rule on the same constant.
  - Add `package.json` and `electron.vite.config.ts` to M2-0026's scope.
- **A3 (platforms).** The QA-identity variant is macOS only. Windows QA uses the shipping identity (the
  Windows lanes).
- **A4 (scope).** Add:
  - `package.json`;
  - `scripts/after-pack.mjs` and `scripts/after-pack.test.ts`;
  - `scripts/check-packaged-runtime.mjs`;
  - `scripts/check-packaged-launch.mjs` and `scripts/check-packaged-launch.test.ts`;
  - `scripts/mac-chain-gates.contract.test.ts`;
  - `scripts/qa/provenance.test.ts`;
  - `scripts/qa/make-qa-identity.sh`.
  The runbook path resolves to the private repo.
- **A5 (evidence record).** "Passing evidence record" means both conditions in INV-5: the candidate run
  succeeded in every job, and at least one record exists, all PASS and bound to the run and its bytes.
  The required gate set belongs to each release ticket.
- **A6 (dry run).** The dry run uploads to a draft, verifies GitHub's sha256 digest of every uploaded
  asset against the local manifest, then deletes the draft. "Download-by-hash" is proven twice: by the
  smoke jobs and by promotion's staging.
- **A7 (verification lines).** Add the PR-triggered self-test run (LOCALLY_TESTED on the PR head) and
  the build.yml dispatch on the branch. The `gh workflow run qa-candidate.yml` dry run, and the promote
  dry run, happen after the milestone merge to main.
- **A8 (assets).** The checksum file is `SHA256SUMS.txt`, as in 1.9.6, and `provenance.json` is attached
  too. The promoted set is exactly `Metis-v.dmg`, `Metis-v.zip`, `Metis-Setup-v.exe`,
  `Metis-Portable-v.exe`, `SHA256SUMS.txt` and `provenance.json`.
- **A9 (signing).** macOS candidates are QA-signed once `QA_MAC_SIGNING` exists, and ad-hoc until then
  (B-05). The mode is recorded and verified per installer.
- **A10 (B-05 text).** Run the script in the owner's primary account, where `gh` is signed in, not on
  the QA account (a GitHub credential there would be reachable by agents). Store the secret with the
  script, which calls `gh secret set QA_MAC_SIGNING` itself.
- **A11 (M2-REL-01).** PARTIAL. The lane records honest per-platform states (ad-hoc or QA for mac,
  unsigned for win). Per-platform independent publication stays with M2-0053.

## 10. Labels: what is ASSUMED or UNKNOWN, and what settles it

| Claim | Label | Settled by |
|---|---|---|
| `codesign` signs with an untrusted self-signed identity from a temporary keychain, and the result launches (hardened runtime, unrestricted entitlements) | ASSUMED | first dispatch with the secret: the smoke job checks the certificate and launches. Fallback: an Apple Development certificate, stored in the same secret format |
| TCC grants persist across two candidates signed with the QA identity | ASSUMED (ticket) | M2-0007 on `qa-mac`: grant once, install the next candidate, confirm |
| The Keychain safeStorage service follows the packaged name (`asktoto-qa Safe Storage`) | ASSUMED | runbook check after the first QA launch: `security find-generic-password -s 'asktoto-qa Safe Storage'` exists, and the live item is untouched |
| userData follows the packaged name | DERIVED | live `asktoto` = package name (OBSERVED); first QA launch shows `<appData>/asktoto-qa` |
| `extends` path resolution, array union, `publish: null`, helper naming | DERIVED | app-builder-lib 26.15.3 source; the self-test builds it |
| NSIS `/S /D=` installs per-user silently without auto-launching | ASSUMED | smoke-win in the self-test |
| Re-running a smoke job reads the first attempt's artifacts | ASSUMED | only matters on a flaky gate; otherwise dispatch anew |
| Release asset `digest` is populated | OBSERVED | Metis-Releases draft asset, 2026-09-26 |
| `gh release view <tag> --json databaseId` resolves a draft | OBSERVED | gh 2.99.0 against the v1.9.8 draft, 2026-09-26 |
| `GH_TOKEN` can create, upload to and delete releases on Metis-Releases | UNKNOWN | dry run; unblock step in the runbook |
| Artifact storage for about 8.4 GB per candidate for 30 days fits the public-repo allowance | ASSUMED | first runs; lower retention if the quota is hit |
| Metis-Releases has no workflows | OBSERVED | `gh api repos/mysticalsin/Metis-Releases/actions/workflows` returns `total_count` 0 |

## 11. Open items for the orchestrator (not for the implementer)

- M2-0002 requires `environment.kind ≠ ci` for HOST_CONFIGURED. This ticket's HOST_CONFIGURED record
  should therefore be the `qa-mac` TCC-persistence check (M2-0007, after B-05). The CI dry run is not
  enough for that level. Decide how to record it.
- Apply amendments A1-A11. Update M2-0026 and M2-0027 for A2. Update B-05's text for A10.
- D-13 is OPEN (needed by 10-03). If the answer differs from the default (for example, it wants
  `latest*.yml` on the owner channel), `prepare-release` and INV-6 change and this design is revisited.
