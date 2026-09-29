# Test isolation runbook

Ticket M2-0481 (closes M2-0190 acceptance 3). Status: DESIGNED. Nothing was run (D-28); every claim below comes from reading files.

Labels: OBSERVED (read, source given), DERIVED, ASSUMED, UNKNOWN.

## Provenance of the public-repo files

- OBSERVED: `git show origin/m2/integration:<path>` was refused by the tool permission layer in this pass, so the files were read from a checked-out worktree of the public repo (metis-operator-ux, worktree `metis-wt-fix-integration-202609282127`). All line numbers below are from that checkout.
- ASSUMED: that checkout matches `origin/m2/integration`. The ticket evidence (below) records the same job name `owner-account.sb denies real user state (hermetic)`, which matches `isolation-canary.yml:133`.

LEAD_ACTION: in a clone of the public repo, run `git diff origin/m2/integration -- scripts/hermetic .github/workflows/isolation-canary.yml` (read-only) and confirm it is empty. If not, re-dispatch M2-0481 to refresh the line numbers.

## Current policy

- OBSERVED (docs/metis-2.0/DECISIONS.md:154): D-28, answered 2026-09-26 by the owner: CI only. No repository test, script or app runs on any Mac, including the owner's account. Static compilation (`tsc --noEmit`) is allowed because it executes no repository code.
- OBSERVED (docs/metis-2.0/DECISIONS.md:42): OD-26, 2026-09-29: GitHub-hosted runners (macos-latest, windows-latest) count as the live host for LIVE_VERIFIED and HOST_CONFIGURED evidence, since D-9 dropped the dedicated QA Mac and D-28 bars the owner's Mac.
- OBSERVED (docs/metis-2.0/DECISIONS.md:135): D-9 was answered "CI runners"; there is no QA user on the owner's Mac.
- OBSERVED (docs/metis-2.0/DECISIONS.md:64): PD-04 requires OS-level isolation in addition to the vitest tripwire.

## Run order

1. OBSERVED (docs/metis-2.0/ledger/tickets/M2-0001.md:61, M2-0190.md:49): the first run of any suite is in CI on macOS and Ubuntu runners with a honeypot directory under `~/Library/CloudStorage/OneDrive-Honeypot`; a touch fails the job. Merged form: `isolation-canary.yml:42-53` (license-server, Ubuntu) and `:61-68` (MetisKit, macOS).
2. OBSERVED (OD-26 above): hosted runners (macos-latest, windows-latest) are the live host for packaged-app and host evidence, installing the candidate by run id and sha256 on a fresh profile.
3. OBSERVED (D-28): no owner-Mac runs. The QA-account step is superseded by D-9 and OD-26. Note the mismatch: M2-0190's acceptance text (field `acceptance` in docs/metis-2.0/ledger/tickets.json) still reads "CI (macOS and Ubuntu with the honeypot), then the QA account, then the owner's account under the sandbox profile"; this runbook's order governs.
4. The sandbox profile below applies only if the owner later lifts D-28. Until then it is merged and proven in CI (the `owner-sandbox-profile` job) but is not a procedure anyone runs on the owner's Mac.

LEAD_ACTION: amend the acceptance text of M2-0190 in docs/metis-2.0/ledger/tickets.json (field `acceptance`) to drop the QA-account and owner-account steps, so it matches D-9, D-28, OD-26 and this run order.

## Sandbox profile as merged: `scripts/hermetic/owner-account.sb`

- OBSERVED (owner-account.sb:8-9): `(version 1)` then `(allow default)`. Everything is allowed except the deny rule below. The profile is a deny-list, not an allow-list.
- OBSERVED (owner-account.sb:11): one rule, `(deny file-read* file-write* ...)`. Every listed path is denied for both read and write operations (all `file-read*` and `file-write*` operations).
- OBSERVED (owner-account.sb:6-7, 15-38): each path is `(subpath (string-append (param "HOME") "<suffix>"))`. `HOME` is supplied at invocation, so the file holds no machine-specific path. `subpath` covers the directory and everything below it.

Denied paths, all relative to `~`:

| Line | Path | Why (per the file's comments) |
|---|---|---|
| 15 | `~/Library/CloudStorage` | every OneDrive/iCloud mount (business accounts are named `OneDrive - <Org>`), so the whole directory is denied (comment lines 12-14) |
| 18 | `~/Library/Keychains` | the real Keychain that safeStorage encrypts against (lines 16-17) |
| 22 | `~/.wrangler` | wrangler's long-standing global config and OAuth store (lines 19-21) |
| 23 | `~/.config/.wrangler` | the XDG-style location some wrangler versions use |
| 24 | `~/Library/Preferences/.wrangler` | the xdg-app-paths fallback when `~/.wrangler` does not exist |
| 30 | `~/Library/Application Support/Metis` | current product name (electron-builder.yml productName, per the comment at lines 27-29) |
| 31 | `~/Library/Application Support/Métis` | prior product name still read by the profile-migration logic in `src/main/index.ts` (lines 27-29) |
| 32 | `~/Library/Application Support/AskToto` | prior product name, same reason |
| 33 | `~/Library/Application Support/asktoto-dev` | unpackaged app's `-dev` suffix |
| 38 | `~/Library/Application Support/asktoto` | lower-case spelling, denied as a precaution because SBPL `subpath` may compare the literal path string rather than a case-folded lookup (comment lines 34-37) |

DERIVED: the ticket's "Métis userData directory" (M2-0190.md:48) is implemented as the five Application Support names at lines 30-33 and 38, and the ticket's `~/.wrangler` as three wrangler locations (lines 22-24).

## Wrapper as merged: `scripts/hermetic/run-under-owner-sandbox.sh`

- OBSERVED (run-under-owner-sandbox.sh:8-11): with no arguments it prints usage and exits 2.
- OBSERVED (run-under-owner-sandbox.sh:13-14): it resolves its own directory, then `exec sandbox-exec -f "$HERE/owner-account.sb" -D HOME="$HOME" "$@"`. The only environment handling in this script is `-D HOME=$HOME`, which feeds `(param "HOME")` in the profile. It does **not** change HOME, TMPDIR or userData, and it does not unset any credential.
- DERIVED: because HOME here is the real home, the profile is the second, independent layer; the environment redirection is done by other scripts (next section), per owner-account.sb:1-5.

## Environment isolation (the first layer, separate files)

These are not the wrapper, but they are how HOME, TMPDIR, userData and Cloudflare credentials are handled.

- OBSERVED (scripts/hermetic/sandbox-env.mjs:30-35, 47-66): `createHermeticSandbox()` makes a fresh empty `metis-test-home-*` directory plus a `tmp` subdirectory. `hermeticEnv()` sets `HOME`, `USERPROFILE`, empty `OneDrive*` variables, `APPDATA`, `LOCALAPPDATA`, `TMPDIR`/`TMP`/`TEMP`, `METIS_TEST_HOME`, and `ASKTOTO_TEST_SANDBOX_ROOT` (the base that `__mocks__/electron.ts` derives every `app.getPath` answer from, so userData lands in the sandbox; comment lines 61-62).
- OBSERVED (scripts/hermetic/sandbox-env.mjs:75, 91-113): `hermeticWranglerEnv()` sets `XDG_CONFIG_HOME` to `<sandbox>/.config`, strips every inherited variable with prefix `CLOUDFLARE_`, `CF_` or `WRANGLER_` (line 97), then forces `WRANGLER_SEND_METRICS=false` (102), `WRANGLER_HIDE_BANNER=true` (108, keeps the npm update check off the network) and `CLOUDFLARE_AUTH_USE_KEYRING=false` (112, stops wrangler reading OAuth tokens from the real OS keyring).
- OBSERVED (scripts/hermetic/sandbox-env.mjs:124-131): `mergedEnv()` deletes keys set to `undefined` rather than passing the string "undefined".
- OBSERVED (scripts/hermetic/run-swift-tests.sh:16-22, 52-59): `swift test` runs only through this script, which makes a fresh sandbox and exports `HOME`, `CFFIXED_USER_HOME` (Foundation ignores `$HOME` alone), `TMPDIR` and `METIS_TEST_HOME`. Its cleanup trap detaches any disk image mounted under the sandbox and preserves swift's exit status (lines 24-49).
- OBSERVED (operator/scripts/wrangler-local-sandbox.contract.test.ts:5, 46-62): the wrangler rule. The test runs `wrangler d1 execute --local` with `mergedEnv(hermeticWranglerEnv(sandbox))`, so no Cloudflare credentials, a sandboxed config directory and `--local` only. `scripts/hermetic/deny-non-loopback.cjs` (preload) refuses any non-loopback `connect()`, rather than trusting the `--local` flag (deny-non-loopback.cjs:4).

## Canary jobs as merged: `.github/workflows/isolation-canary.yml`

Workflow `name: isolation-canary` (line 1). Triggers: push to any branch except `v*`/`ffmpeg-sidecar-*` tags, pull_request to main/master, workflow_dispatch (lines 11-20). Permissions: `contents: read` (22-23). Five jobs (job id → display name, runner):

| Lines | Job id | Display name | Runner | What it checks |
|---|---|---|---|---|
| 26-53 | `license-server` | `license-server node --test (hermetic)` | ubuntu-latest | seeds honeypots `~/Library/CloudStorage/OneDrive-Honeypot` and `~/OneDrive` in the runner's real home (42-45), runs `npm ci` and `npm test` in `license-server`, then `honeypot.sh check` on both (50-53); a touch fails the job |
| 55-118 | `metiskit-swift-test` | `MetisKit swift test (hermetic)` | macos-latest | seeds the CloudStorage honeypot (61-62); runs `run-swift-tests.sh native-app/MetisKit` (66); checks the honeypot (67-68); a shimmed `swift` that mounts a disk image under HOME leaves no mount or sandbox behind (73-98); a shimmed `swift` exiting 37 passes that code through (101-118) |
| 120-130 | `deny-non-loopback` | `deny-non-loopback.cjs denies every connect() shape (hermetic)` | ubuntu-latest | `node --test scripts/hermetic/deny-non-loopback.test.mjs` (130), no third-party dependencies |
| 132-176 | `owner-sandbox-profile` | `owner-account.sb denies real user state (hermetic)` | macos-latest | extracts every `(param "HOME") "<suffix>"` root from `owner-account.sb` with grep/sed (151), so the job cannot drift from the profile; for each root seeds a probe file, then requires `run-under-owner-sandbox.sh cat <probe>` and a `sh -c "echo x >> <probe>"` append to fail with "Operation not permitted" (162-172); the wrong failure reason also fails the job. Positive control: `run-under-owner-sandbox.sh cat AGENTS.md` must succeed (175-176) |
| 178-232 | `honeypot-check-fails-closed` | `honeypot.sh check fails closed (hermetic)` | ubuntu-latest | negative control: an untouched honeypot passes (214-216); a new file, an in-place sentinel rewrite, a deleted directory and a missing reference timestamp must each make `check` fail with the expected message (218-232) |

- OBSERVED (ticket M2-0190, evidence field in docs/metis-2.0/ledger/tickets.json): the job "owner-account.sb denies real user state (hermetic)" was green on macos-latest, run 36634756903, commit 761276bc (HOST_CONFIGURED under OD-26, recorded 2026-09-29 by the lead). DERIVED: this is `owner-sandbox-profile` above.
- OBSERVED (isolation-canary.yml:8-10): `operator/scripts/wrangler-local-sandbox.contract.test.ts`, `scripts/qa/lib/sandbox-guard.test.ts` and `scripts/hermetic/sandbox-env.test.ts` have no job here; `build.yml`'s `quality` and `operator` jobs run them.
- UNKNOWN: whether the other four jobs were green on the same commit; the recorded evidence names only `owner-sandbox-profile`.

## Rules for agents

OBSERVED (M2-0190.md:48): agents never disable the sandbox for test commands. Under D-28 that is moot on the owner's Mac (nothing runs there), and CI is the only place these jobs execute.
