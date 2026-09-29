# Windows signing: repository integration design (Lane C)

**Scope:** how `mysticalsin/AskToto-Mantu` supports an Azure-managed signing mode next to the existing PFX mode, how the updater publisher pin migrates, and which tests and steps go with it.
**Read-only lane.** Nothing in `/Users/tony/AI-Brain-build/metis-2.0` was edited. Source read at `HEAD = origin/main = 2bf21f1` (branch `claude/metis-2.0-task-001`), electron-builder `26.15.3`, electron-updater `6.8.9`, builder-util-runtime `9.7.0`. Evidence gathered 2026-09-24.
**Owner rule.** Anything touching pricing, legal entity or eligibility is an input for Tony to decide. This lane gives engineering trade-offs, not verdicts. Each claim is tagged **VERIFIED** (file:line, command or URL plus date seen), **ASSUMED** or **UNKNOWN**. The ledger in section 8 collects them.

---

## 0. Summary

1. **The brief says existing installs trust `CN=Mantu`. For the public feed that is not true.** All 14 Windows EXEs on `Metis-Releases` (v1.5.3 to v1.8.7) are unsigned: their PE certificate table is empty. An unsigned build writes no `publisherName` into `app-update.yml`, and when that field is missing the installed updater skips signature checks. So the first signed public release has no transitional release to worry about. Whatever that release pins becomes the trust anchor for every later update. That pin is the real decision. (Section 3.2)
2. **`win.publisherName` no longer exists.** Commit `3c2dbf85` (2026-07-13) removed it, and the 26.15.3 schema rejects it. Today the pin comes from the certificate's CN, so a `CN=Mantu` PFX would pin `["Mantu"]`, which is a CN-only match. `docs/ENTERPRISE-DEPLOY-WINDOWS.md:45,84` is stale. (Section 1)
3. **Azure mode can be added with no identity in the repo.** A small wrapper writes a temporary JSON overlay (`extends: electron-builder.win.yml` plus `win.azureSignOptions` plus `publish.publisherName[]`) built from environment variables. The repeated `-c.` CLI override cannot express the pin list: the last value wins. I ran the overlay through electron-builder's own loader and validator. It is VALID, and apart from the signing keys the resolved config is byte-identical to `electron-builder.win.yml`. (Section 2.2)
4. **The pin list must go in `publish.publisherName`, not in `azureSignOptions.publisherName`.** The schema allows only a single string in the second (an array is rejected). `publish.publisherName` accepts an array and takes precedence when `app-update.yml` is written. (Sections 2.2 and 3.1)
5. **Fail fast.** Add a probe step right after the Windows secrets gate and before `setup-node`. In PFX mode it runs the existing identity/chain probe in a new `--release-gate` mode. That would have failed the `CN=Mantu` run with `CHAIN_UNTRUSTED` in minutes, not after the roughly 1-hour build. In Azure mode it signs one throwaway PE and checks it with the same policy `verify-signing` uses. (Section 4)
6. **New post-build gate: "installs of this release will accept the next update."** It runs electron-updater's own `verifySignature` against the built Setup.exe, using the pin baked into `release/win-unpacked/resources/app-update.yml`. (Section 2.7)

---

## 1. What the code does today (facts)

| # | Fact | Evidence | Status |
|---|---|---|---|
| F1 | If `win.azureSignOptions` is set, electron-builder uses the Azure manager. Otherwise it uses signtool. | `node_modules/app-builder-lib/out/winPackager.js:33-43` | VERIFIED |
| F2 | When both option blocks are present, electron-builder only **warns** and uses Azure. It does not fail closed on "both". | `app-builder-lib/out/codeSign/windowsCodeSign.js:6-11` | VERIFIED |
| F3 | In 26.15.3 the Azure manager reads **no** `AZURE_*` env vars. Credentials are left entirely to the `TrustedSigning` PowerShell module / Azure.Identity. A grep for `AZURE_`, `EnvironmentCredential` and `ExcludeManagedIdentity` in `app-builder-lib/out` returns nothing. The docs pointer is at `windowsSignAzureManager.js:39-40` and `options/winOptions.d.ts:133`. | grep, 2026-09-24 | VERIFIED |
| F4 | At build time the Azure manager runs `Install-Module -Name TrustedSigning -MinimumVersion 0.5.0 -Force -Repository PSGallery -Scope CurrentUser`. That is unpinned above 0.5.0 and needs network access to PSGallery. It then runs `Invoke-TrustedSigning -Endpoint -CertificateProfileName -CodeSigningAccountName -TimestampRfc3161 (default http://timestamp.acs.microsoft.com) -TimestampDigest SHA256 -FileDigest SHA256 -Files`. | `windowsSignAzureManager.js:29-38, 46-68` | VERIFIED |
| F5 | Extra `azureSignOptions` keys are passed through as `-Key 'value'` pairs. PowerShell switches such as `-ExcludeEnvironmentCredential` cannot be passed this way (no bare-switch form). | `windowsSignAzureManager.js:50-67`; switch behaviour is PowerShell semantics | VERIFIED (code) / ASSUMED (PowerShell binding) |
| F6 | electron-builder signs with `pwsh.exe` when present (windows-latest has it) and falls back to `powershell.exe`. | `app-builder-lib/out/vm/vm.js:11-21` | VERIFIED |
| F7 | `TrustedSigning` 0.5.8 (2025-07-11) is the latest on PSGallery. Microsoft's integration page now points PowerShell users to a module called **`ArtifactSigning`** (0.1.20, 2026-09-09, exports `Invoke-ArtifactSigning`). electron-builder 26.15.3 still calls the old module. | https://www.powershellgallery.com/packages/TrustedSigning, https://www.powershellgallery.com/packages/ArtifactSigning/, https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations (all seen 2026-09-24) | VERIFIED |
| F8 | The updater pin (`app-update.yml` `publisherName`) is written from `publish.publisherName` when set. If not, it comes from the signing manager's `computedPublisherName`, but only when `verifyUpdateCodeSignature !== false`. | `app-builder-lib/out/publish/PublishManager.js:87-89, 202-207`; `winPackager.js:26-28` | VERIFIED |
| F9 | Signtool/PFX mode computes the pin as `[certInfo.commonName]`, i.e. CN only. With no certificate it computes `null`, so no pin is written. | `app-builder-lib/out/codeSign/windowsSignToolManager.js:18-29, 75, 155-158` | VERIFIED |
| F10 | Azure mode computes the pin only from `azureSignOptions.publisherName`. It never derives it from the certificate (there is a TODO in the code). If `publisherName` is omitted, **no pin is written and updates go unverified.** | `windowsSignAzureManager.js:10-22` | VERIFIED |
| F11 | Config schema (26.15.3): `win.publisherName` is not allowed (`WindowsConfiguration.additionalProperties=false`). `win.azureSignOptions.publisherName` must be a **string**. `win.signtoolOptions.publisherName` accepts a string or an array. `publish` (GithubOptions) `publisherName` accepts an **array**. | `node_modules/app-builder-lib/scheme.json`; I also ran `getConfig`+`validateConfiguration` on test overlays: array in `azureSignOptions.publisherName` gave INVALID, legacy `win.publisherName` gave INVALID, `publish.publisherName: [..]` with azure options gave VALID (2026-09-24) | VERIFIED |
| F12 | `win.publisherName: Mantu` was deleted in `3c2dbf85` (2026-07-13). The yml comment now says the name is derived from the certificate. | `git show 3c2dbf85 -- electron-builder.yml`; `electron-builder.yml:264-266` | VERIFIED |
| F13 | `verifyUpdateCodeSignature: true` is set and has no `forceCodeSigning` alongside it. The nearby comment says the check is inert because "no real publish.url", but `publish` **is** configured. It is actually inert because unsigned builds write no pin (F9). | `electron-builder.yml:288-292, 319-330`; `git grep forceCodeSigning` returns nothing | VERIFIED |
| F14 | The Windows release job: an inline bash secrets gate that requires `GH_TOKEN, WIN_CSC_LINK, WIN_CSC_KEY_PASSWORD, WIN_CSC_EXPECTED_SUBJECT`; then setup-node, npm ci, a 1.3 GB model cache, `npm run release:build:win`, `check:release`, `verify-signing`, upload. The job has no `permissions:` block, no `environment:`, and actions are pinned by tag (`@v4`), not by SHA. | `.github/workflows/release.yml:201-306` (gate at 248-264, setup-node at 265, build at 282-289, verify at 294-296) | VERIFIED |
| F15 | `release:build:win` already runs `check-release-secrets.mjs win` and `verify-signing.mjs` inside the npm chain. | `package.json:70`; `scripts/check-release-secrets.mjs:49-55` | VERIFIED |
| F16 | `verify-signing` passes only if Status is `Valid`, Subject **or** CN exactly equals `WIN_CSC_EXPECTED_SUBJECT`, and a timestamp is present. It does not check EKUs. | `scripts/lib/signing-policy.mjs:24-55`; `scripts/verify-signing.mjs:108-138` | VERIFIED |
| F17 | The identity preflight is PFX-only (base64 PKCS#12 in `WIN_CSC_LINK`) and runs only on `workflow_dispatch` on main at an exact SHA. Its workflow contract test **forbids `id-token:`**. | `scripts/windows-signing-identity-preflight.mjs:54-72, 115-124`; `scripts/windows-signing-identity-preflight.test.mjs:382-402` | VERIFIED |
| F18 | The packaged-launch gate starts the built `Metis.exe` with the **whole build env** (minus `*_API_KEY`). The app reads `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` from its env at runtime as its SSO configuration. | `scripts/check-packaged-launch.mjs:202-211`; `src/main/auth.ts:26-27, 167-168` | VERIFIED |
| F19 | The Cahê workflow reuses the same `WIN_CSC_*` repo secrets with its own inline gate and signs through electron-builder's PFX path. | `.github/workflows/cahe-windows.yml:60-75, 100-107` | VERIFIED |

---

## 2. Design: explicit signing mode (brief item 1)

### 2.1 Inputs and the fail-closed matrix

The mode is chosen **explicitly** by `WIN_SIGNING_MODE`: a GitHub *variable*, not a secret, because it is not sensitive. Nothing is inferred from which secrets happen to exist.

| Input | pfx | azure | Kind |
|---|---|---|---|
| `WIN_SIGNING_MODE` | `pfx` | `azure` | var (required in any release context) |
| `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` | required | **forbidden** | secret (repo-level, as today) |
| `CSC_LINK`, `CSC_KEY_PASSWORD` in the Windows job | forbidden | forbidden | electron-builder falls back to `CSC_LINK` (`platformPackager.js:81-85`) |
| `WIN_CSC_EXPECTED_SUBJECT` | required | required (exact CN of the Azure certificate; see 3.4) | var or secret, used by verify-signing |
| `WIN_AZURE_SIGNING_ENDPOINT` | forbidden | required. Must match `^https://[a-z0-9]+\.codesigning\.azure\.net/?$` (e.g. `https://weu.codesigning.azure.net`, `https://swn.codesigning.azure.net`) | environment var |
| `WIN_AZURE_SIGNING_ACCOUNT` | forbidden | required | environment var |
| `WIN_AZURE_CERT_PROFILE` | forbidden | required | environment var |
| `WIN_AZURE_PUBLISHER_NAME` | forbidden | required (goes into `azureSignOptions.publisherName`, a string; F11) | environment var |
| `WIN_UPDATE_PUBLISHER_NAMES` | optional (transitional list, section 3.3) | optional, defaults to `[WIN_AZURE_PUBLISHER_NAME]` | environment var, JSON array of strings |
| `WIN_AZURE_CLIENT_ID`, `WIN_AZURE_TENANT_ID`, `WIN_AZURE_SUBSCRIPTION_ID` | unused | required, but passed **only** as `azure/login` inputs | environment secrets (`windows-signing`) |
| `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_CLIENT_CERTIFICATE_PATH`, `AZURE_FEDERATED_TOKEN_FILE` in the build step env | forbidden | **forbidden** | Reason: F18. The launch gate would hand them to the packaged app as SSO config. Also, a stray secret would change DefaultAzureCredential's choice (F3). OIDC via `azure/login` needs none of them. |

**Rules**, enforced by one pure function `resolveWindowsSigningMode(env)` in a new `scripts/lib/windows-signing-mode.mjs`. Each rule returns a fixed error code and names the variables, **never their values**:
- Mode unset or not `pfx|azure` returns `SIGNING_MODE_REQUIRED` / `SIGNING_MODE_INVALID`.
- Inputs for the other mode present (never both) returns `SIGNING_MODE_AMBIGUOUS`.
- Any required input for the selected mode missing (half-configured) returns `PFX_CONFIG_INCOMPLETE` / `AZURE_CONFIG_INCOMPLETE`.
- An endpoint that fails the pattern returns `AZURE_ENDPOINT_INVALID`.
- A forbidden `AZURE_*` variable returns `AZURE_ENV_FORBIDDEN`.
- A malformed, empty or non-string `WIN_UPDATE_PUBLISHER_NAMES` returns `PUBLISHER_LIST_INVALID`. So does a list with no entry that matches `WIN_CSC_EXPECTED_SUBJECT` under electron-updater's matching rules (section 3.1).

`scripts/check-release-secrets.mjs` `win` (currently `:49-55`) becomes a thin CLI over this resolver. The inline bash gate at `release.yml:248-264` is replaced with `node scripts/check-release-secrets.mjs win`, so there is one source of truth. The test at `release-gates.test.ts:233` expects the phrase `refusing to publish an unsigned Windows release` in the Windows job. Keep that phrase in the CLI's failure text **and** as a comment in the step, or update the assertion.

### 2.2 Getting the identity into electron-builder without hard-coding it

**Why the CLI `-c.` form is not enough (tested):** I ran electron-builder's own `configureBuildCommand`+`normalizeOptions` on `--config electron-builder.win.yml -c.win.azureSignOptions.* -c.publish.publisherName=Mantu -c.publish.publisherName=Example`. The four azure keys went through correctly, but `publish.publisherName` came out as the **single last value**, not an array (`node_modules/electron-builder/out/builder.js:106-121` merges the config file and dot values). A single value cannot express the transitional list in section 3.3. **VERIFIED** (local run, 2026-09-24).

**Design:** add a new `scripts/electron-builder-win.mjs`. It is used only by `release:build:win`; `dist:win` and CI's unsigned `build.yml:425` stay as they are.
1. Call `resolveWindowsSigningMode(process.env)` and exit non-zero with the fixed code on failure.
2. Write a JSON overlay to `${RUNNER_TEMP || os.tmpdir()}/metis-win-signing-<pid>.json`, mode 0600:
   ```json
   {
     "extends": "<absolute path>/electron-builder.win.yml",
     "forceCodeSigning": true,
     "win": { "azureSignOptions": {
       "endpoint": "<WIN_AZURE_SIGNING_ENDPOINT>",
       "codeSigningAccountName": "<WIN_AZURE_SIGNING_ACCOUNT>",
       "certificateProfileName": "<WIN_AZURE_CERT_PROFILE>",
       "publisherName": "<WIN_AZURE_PUBLISHER_NAME>" } },
     "publish": { "publisherName": ["<entries of WIN_UPDATE_PUBLISHER_NAMES>"] }
   }
   ```
   In PFX mode, omit `win.azureSignOptions`. Include `publish.publisherName` only when `WIN_UPDATE_PUBLISHER_NAMES` is set; otherwise F9's CN-derived pin applies.
3. `spawn('npx'|electron-builder bin, ['--config', overlay, '--win', '--x64', '--publish', 'never'], { shell: false })`, then delete the overlay in `finally`.

**Tested:** I ran this overlay (azure variant, placeholder identity) through `app-builder-lib/out/util/config/config.js` `getConfig` + `validateConfiguration`. It is **VALID**. `productName` is still `Métis`, `executableName` is still `Metis`, `publish` stays `github/mysticalsin/Metis-Releases/release` with `publisherName` added, and `forceCodeSigning` is `true`. After deleting the signing keys, the resolved config is **identical** to loading `electron-builder.win.yml` directly. So the `files` allow-list from `electron-builder.win.yml:11-30` is unchanged. Arrays merge as a union (`builder-util-runtime/out/objects.js:48-67`); the base has no `publisherName`, so the result is exactly the overlay list. **VERIFIED** for config resolution. This was not a full build.

`forceCodeSigning: true` turns an unsigned-file slip into a build error (`winPackager.js:123-131`) instead of a late verify-signing failure. That matters in PFX mode, where a missing certificate silently skips signing (`windowsSignToolManager.js:155-158`).

### 2.3 Two ways to sign in azure mode (Tony decides)

| | A. Native `win.azureSignOptions` (recommended first cut) | B. Custom `win.signtoolOptions.sign` hook calling a pinned module |
|---|---|---|
| Code | Wrapper only (2.2) | Wrapper plus a `scripts/azure-sign-hook.cjs` that calls `Invoke-ArtifactSigning` (or signtool + `Microsoft.ArtifactSigning.Client` dlib with `metadata.json`), plus tests |
| Module | `TrustedSigning`, `-MinimumVersion 0.5.0 -Force`, i.e. whatever is newest on PSGallery at build time (F4, F7). Cannot be pinned without patching electron-builder: with `-Force` it installs the newest version even if an older one is pre-installed (ASSUMED PowerShellGet v2 behaviour). | Pinned `-RequiredVersion` installed in a workflow step. Can move to the renamed `ArtifactSigning` module. |
| Credential control | DefaultAzureCredential order, with no exclusions possible (F5). It works after `azure/login` through AzureCliCredential but probes earlier credential types first (ASSUMED from the Azure/artifact-signing-action OIDC guide, which excludes all but AzureCli; https://github.com/Azure/artifact-signing-action/blob/main/docs/OIDC.md, seen 2026-09-24). | `ExcludeCredentials` for all but `AzureCliCredential` (documented in `metadata.json`; https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations, seen 2026-09-24) |
| Pin source | `publish.publisherName[]` (F11) | `signtoolOptions.publisherName[]` (the schema allows arrays) |
| Gotchas | Stays on the older module name | Must set `signtoolOptions.signingHashAlgorithms: [sha256]`, or the hook runs twice, once for sha1 and once for sha256 (`windowsSignToolManager.js:115-128, 160-167`) |

Both options feed the same verify-signing, publisher gate and probe. I suggest starting with A because it is the smaller change, and moving to B if the unpinned PSGallery fetch is unacceptable for a public release pipeline. That is a supply-chain risk call for Tony.

### 2.4 `release.yml`, Windows job (proposed edits)

```yaml
  release-windows:
    needs: release-quality
    runs-on: windows-latest
    timeout-minutes: 120
    environment: windows-signing          # OIDC sub = repo:mysticalsin/AskToto-Mantu:environment:windows-signing
    permissions:
      contents: read                      # checkout + gh release download ffmpeg-sidecar-v1 (release.yml:229)
      id-token: write                     # azure/login OIDC (azure mode)
    env:
      WIN_SIGNING_MODE: ${{ vars.WIN_SIGNING_MODE }}
    steps:
      # ... unchanged checkout / version parity / ffmpeg steps (release.yml:207-247) ...
      - name: Require signing inputs before releasing   # replaces release.yml:248-264
        shell: bash
        run: node scripts/check-release-secrets.mjs win   # "refusing to publish an unsigned Windows release"
        env: &signing-env
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          WIN_CSC_LINK: ${{ vars.WIN_SIGNING_MODE == 'pfx' && secrets.WIN_CSC_LINK || '' }}
          WIN_CSC_KEY_PASSWORD: ${{ vars.WIN_SIGNING_MODE == 'pfx' && secrets.WIN_CSC_KEY_PASSWORD || '' }}
          WIN_CSC_EXPECTED_SUBJECT: ${{ secrets.WIN_CSC_EXPECTED_SUBJECT }}
          WIN_AZURE_SIGNING_ENDPOINT: ${{ vars.WIN_AZURE_SIGNING_ENDPOINT }}
          WIN_AZURE_SIGNING_ACCOUNT: ${{ vars.WIN_AZURE_SIGNING_ACCOUNT }}
          WIN_AZURE_CERT_PROFILE: ${{ vars.WIN_AZURE_CERT_PROFILE }}
          WIN_AZURE_PUBLISHER_NAME: ${{ vars.WIN_AZURE_PUBLISHER_NAME }}
          WIN_UPDATE_PUBLISHER_NAMES: ${{ vars.WIN_UPDATE_PUBLISHER_NAMES }}
      # section 4: fail-fast probe steps go HERE, before setup-node (release.yml:265)
      # ... setup-node / npm ci / model cache unchanged ...
      - name: Refresh Azure login immediately before the signing build
        if: vars.WIN_SIGNING_MODE == 'azure'
        uses: azure/login@<40-hex SHA>   # v2
        with: { client-id: ${{ secrets.WIN_AZURE_CLIENT_ID }}, tenant-id: ${{ secrets.WIN_AZURE_TENANT_ID }}, subscription-id: ${{ secrets.WIN_AZURE_SUBSCRIPTION_ID }} }
      - run: npm run release:build:win          # release.yml:282, env = *signing-env (YAML anchors are not supported in Actions; repeat the block)
      - run: npm run check:release               # unchanged
      - run: node scripts/verify-signing.mjs     # unchanged call, mode-aware EKU policy (2.5)
      - name: Prove installs of this release accept the next identically signed update
        run: node scripts/check-update-publisher.mjs release   # 2.7
      # ... upload-artifact unchanged ...
```

Why each change is there:
- **`environment:`** Without an environment, a tag-push job's OIDC subject is `repo:…:ref:refs/tags/<tag>`, which changes with every tag. With an environment it is the fixed `repo:…:environment:<name>` (https://docs.github.com/en/actions/reference/security/oidc, seen 2026-09-24, VERIFIED). Microsoft also recommends environment secrets for public repos (https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect, seen 2026-09-24, VERIFIED). Restricting the environment's deployments to `v*` tags and optionally adding a required reviewer is a GitHub environment setting (ASSUMED available on this plan/repo).
- **`permissions:`** Once any permission is listed at job level, every unlisted one becomes `none` (https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax, seen 2026-09-24, VERIFIED). So `contents: read` must be listed explicitly. `id-token: write` is the documented requirement for azure/login OIDC. The Azure OIDC guide pairs it with `contents: read` (https://github.com/Azure/artifact-signing-action/blob/main/docs/OIDC.md, seen 2026-09-24, VERIFIED).
- **Conditional PFX secrets.** The Cahê workflow still needs the repo-level `WIN_CSC_*` (F19), so they cannot simply be deleted when release switches to azure. The expression keeps them out of the release job in azure mode, and the resolver still refuses if both ever appear (defense in depth). The alternative is to pass everything unconditionally and have the gate refuse. That is stricter about repository state but forces deleting the PFX secrets and breaks Cahê. Tony's call.
- **Second `azure/login` before the build.** The build starts about 60+ minutes of work before the last signature. az CLI tokens obtained with a GitHub OIDC assertion may not refresh once that assertion expires (ASSUMED; measure on the first run). If signing is still too far from login, move the asset-fetch parts of `release:build:win` into earlier steps.
- **Pin actions by SHA in this job** (checkout, cache, setup-node, upload-artifact, azure/login). With `id-token: write`, any compromised action in this job can mint a signing token. The preflight workflow already pins checkout by SHA (`windows-signing-identity-preflight.yml:27`).

### 2.5 verify-signing: expected subject and EKUs

- Keep `WIN_CSC_EXPECTED_SUBJECT` exact-match semantics (`signing-policy.mjs:39-55`). In azure mode, set it to the **CN**, not the full DN. Microsoft states that subject DN values can change over an organisation's lifetime, that certificates renew daily and last 72 hours, and that CN/O cannot be customised (https://learn.microsoft.com/en-us/azure/artifact-signing/concept-certificate-management, seen 2026-09-24, VERIFIED).
- Extend `windowsSignatureCommand` (`signing-policy.mjs:24-37`) to also output the signer certificate's EKU OIDs, reading extension `2.5.29.37` the same way `windows-signing-identity-preflight.ps1:38-45` already does.
- Extend `windowsSignatureProblem(signature, expected, policy)`. Azure mode requires:
  - `1.3.6.1.4.1.311.97.1.0`, the Public Trust marker (same Microsoft page, VERIFIED);
  - optionally `WIN_AZURE_IDENTITY_EKU`, the durable subscriber EKU `1.3.6.1.4.1.311.97.<…>` tied to the identity validation (same page, VERIFIED);
  - **rejection** of the lifetime-signing EKU `1.3.6.1.4.1.311.10.3.13`. Public Trust *Test* profiles carry it, and it makes signatures expire with the 3-day certificate even when timestamped (https://learn.microsoft.com/en-us/azure/artifact-signing/concept-resources-roles, seen 2026-09-24, VERIFIED). This stops a test-profile signature from ever being published.
- PFX mode keeps today's behaviour exactly.

### 2.6 Preflight adaptation (the current preflight only understands PFX)

- **Leave `windows-signing-identity-preflight.yml` and its contract unchanged.** It must stay free of `id-token:` (`windows-signing-identity-preflight.test.mjs:395`).
- In `windows-signing-identity-preflight.mjs` (CLI at `:164-171`), add a `--release-gate` mode that reuses `evaluateIdentityReport` and the same PowerShell probe but replaces the dispatch-only `checkTrustedRevision` (`:54-72`) with `checkReleaseRevision`. The new check requires `GITHUB_ACTIONS=true`, `GITHUB_EVENT_NAME=push`, `GITHUB_REF` matching `^refs/tags/v`, `GITHUB_REPOSITORY=mysticalsin/AskToto-Mantu`, and `GITHUB_SHA` equal to the checked-out `HEAD` (same bounded git call as `:62-67`). Each mode rejects the other's context.
- Add `scripts/windows-signing-azure-probe.mjs` (+ `.ps1`) and a new manual workflow `windows-signing-azure-preflight.yml`: `workflow_dispatch`, main-only, exact-SHA guard (reusing the exported `checkTrustedRevision`), `environment: windows-signing`, `permissions: contents: read, id-token: write`, `azure/login` pinned by SHA, then the canary probe from section 4. Its own contract test mirrors `assertWorkflowContract` (`windows-signing-identity-preflight.test.mjs:382-402`) but **requires** `id-token: write` and forbids `WIN_CSC_*`.

### 2.7 New gate: `scripts/check-update-publisher.mjs` (Windows only)

1. Parse `release/win-unpacked/resources/app-update.yml` (the file electron-builder writes at `PublishManager.js:87-89`; the installed app reads it from `process.resourcesPath`, `electron-updater/out/AppUpdater.js:157`). Use `js-yaml` resolved from electron-updater's own dependency tree, as `scripts/updater-yaml-compat.test.ts:24-27` does.
2. Fail if `publisherName` is missing or empty while `verifyUpdateCodeSignature` is true. That is exactly the silent no-verification state today's public builds are in (section 3.2).
3. If `WIN_UPDATE_PUBLISHER_NAMES` is set, the list must be exactly equal to it (same order, same size).
4. Call the **installed** `electron-updater/out/windowsExecutableCodeSignatureVerifier.js` `verifySignature(list, <release/Metis-Setup-<v>.exe>, logger)` and require `null`. This is the same code that will judge the next update (`NsisUpdater.js:16, 84-100`). A pass proves that installs of this release will accept an update signed by the identity that signed this one.

### 2.8 Related drift to fix in the same change

- `docs/ENTERPRISE-DEPLOY-WINDOWS.md:45-46, 84` say `win.publisherName` = `CN=Mantu`. That field is gone (F11, F12). `:52-53` calls Azure a drop-in where "nothing else changes", which is false (F10, section 3). `docs/SIGNING.md:102` says Azure signing is "a future wired Azure Artifact Signing flow" and `:22` lists only the PFX gate. `electron-builder.yml:288-294` has the stale "inert" and signing comments (F13).
- Cahê (F19): either it stays PFX-only (internal pilot, own appId, no shared feed, `src/main/updater.ts:92`), or it adopts the same resolver and wrapper. Decision for Tony.

---

## 3. The publisherName migration (brief item 2)

### 3.1 How electron-updater compares publishers (from source)

- The installed app reads the pin from **its own** `app-update.yml`, not from the feed. So release N's pin decides whether release N+1 is accepted. A string is normalised to an array (`electron-updater/out/NsisUpdater.js:84-100`). **Lists are supported.**
- **No pin means no check:** `publisherName == null` makes the check return `null`, meaning accepted (`NsisUpdater.js:87-90`). Only the sha512 from `latest.yml` protects the download then.
- The check runs `Get-AuthenticodeSignature … | ConvertTo-Json` (`windowsExecutableCodeSignatureVerifier.js:47`). Any name comparison requires `Status === 0` (Valid) first (`:56`). Otherwise it falls through to "Sign verification failed" and returns a failure string (`:91-93`), and the updater throws `ERR_UPDATER_INVALID_SIGNATURE` (`NsisUpdater.js:52-57`).
- For each pin entry (`:72-89`), matching stops at the first hit:
  - An entry containing `=` is parsed as a DN, and **every key in the entry** must equal the signer's value. It is a subset compare, so `"CN=X, O=X"` matches a signer that also has `L=`, `S=`, `C=`.
  - A plain entry (`"Mantu"`) is compared to the signer's **CN only**, with a warning logged (`:81-83`).
  - DN parsing is `builder-util-runtime/out/rfc2253Parser.js:4-60`: a string with no `=` yields an empty map, which triggers the CN-only branch.
- Fail-open corner: if PowerShell or `ConvertTo-Json` is unusable, `handleError` returns without rejecting and the check resolves `null` (`:50-54, 119-130`). Existing behaviour; noted, not changed.
- The installed updater accepts a custom verifier through the setter at `NsisUpdater.js:18-29`, relevant to option 3.4-C.

**Public unmanaged installs and UnknownError (from source):** a `CN=Mantu` self-signed update on a machine that does not trust that root gets `UnknownError` (reported in `ENTERPRISE-DEPLOY-WINDOWS.md:67-69` and by the lead's release run). That is not Status 0, so it is **rejected no matter what the pin says** (`:56`). VERIFIED code path. That UnknownError serialises to a non-zero Status is ASSUMED from the SignatureStatus enum; the code needs only "not 0". Today, though, no public install is in that position (3.2).

### 3.2 Who pins what today (evidence)

| Population | Pin in its `app-update.yml` | Evidence | Status |
|---|---|---|---|
| Public feed installs v1.5.3 to v1.8.7 (`Metis-Releases`; `/releases/latest` = v1.6.6) | **none**, so updates are unverified | All 14 EXEs (Setup + Portable × 7 tags) have an empty PE certificate table. I range-fetched the PE header and data directory 4. The parser was cross-checked on a known-signed installer, where it correctly listed a Sectigo chain. The GitHub API release list is at https://api.github.com/repos/mysticalsin/Metis-Releases/releases (2026-09-24). Unsigned builds write no pin (F9). The tags have no `publisherName` in config (`git show v1.5.3/v1.6.6/v1.8.9/v1.9.5:electron-builder.yml`). A local extraction of a 1.5.0 build, `/Users/tony/AI-Brain-build/v150-final/win/app64/resources/app-update.yml`, has no `publisherName`. | VERIFIED that the artifacts are unsigned and for the code path. The `app-update.yml` inside each *published* installer was not extracted: **ASSUMED (high confidence)** |
| Early-July AskToto-era builds | `["Mantu"]` (CN-only) | `/Users/tony/AI-Brain-build/asktoto-v1.0.0-final-win/.../app-update.yml`, `metis-win-release/.../app-update.yml` (2026-07-02 and 2026-07-10). Their feed repo is `mysticalsin/AskToto-Releases`, which now returns HTTP 404 anonymously. | VERIFIED locally. Whether any such installs are still in use: **UNKNOWN** |
| Any future build signed with the `CN=Mantu` PFX | `["Mantu"]` (F9) | code | VERIFIED |
| Mantu-fleet installs deployed outside the public feed | ? | Not in the repo | **UNKNOWN** (ask IT) |

**Consequence.** Public installs will accept the first signed release whatever signs it: there is no check (NsisUpdater:87-90). No transitional release is needed for them. But **that first signed release fixes the pin that every later update must meet**, so it has to bake the intended long-term pin. Section 2.7 makes sure it bakes one at all.

### 3.3 Transitional design, per population

**P1. Public feed (no pin).** Ship release N signed in azure mode with `WIN_UPDATE_PUBLISHER_NAMES = ["<Azure CN>"]` (format choice in 3.4). Do **not** add `"Mantu"`. A plain `"Mantu"` entry would accept any *publicly trusted* certificate whose CN is `Mantu` and would buy nothing for this population. The installs download N with only the sha512 check (today's behaviour). From N on, updates must be Valid and match the pin.

**P2. Installs pinned `["Mantu"]` that should end up on Azure-signed updates.** These are fleet builds, if any exist or will exist.
- The updater only accepts what the *installed* pin allows. So the bridge has to be a release T that is **signed by the old identity** (`CN=Mantu` PFX) and **pins both**: `WIN_UPDATE_PUBLISHER_NAMES = ["Mantu", "<Azure CN>"]` in PFX mode (supported by the resolver and 2.2).
- Once T has spread, release N (Azure) is accepted by T installs (`verifier:72-89`, any-match). Release N+1 then drops `"Mantu"`.
- **Preconditions:** the Azure CN must be known before T is built, which means identity validation is finished (other lane). T must be delivered through a channel whose machines trust the `CN=Mantu` root, because T itself is rejected elsewhere (3.1). `release.yml` **cannot** publish T: its runner does not trust `CN=Mantu` (lead-reported preflight 35538932316 = `CHAIN_UNTRUSTED/UntrustedRoot`), and `verify-signing` requires Valid (`signing-policy.mjs:45`). That is correct and must not be weakened. T therefore goes through the fleet channel (section 5).
- **Simpler alternative for a managed fleet:** skip T and have Intune or SCCM install N over the top. Same appId `com.mantu.asktoto` (`electron-builder.yml:4`), per-user NSIS, `/S`. Intune installs do not go through electron-updater's check. The trade-off is IT deployment effort versus building and staging a special release.
- `["Mantu"]` installs on **unmanaged** PCs cannot take T or N automatically (UnknownError, or a mismatch). Manual reinstall only.

**P3. Pinned but on a dead feed** (`AskToto-Releases`, 404): stranded no matter what. Manual reinstall only. **UNKNOWN** count.

### 3.4 Pin format (a trust-policy decision for Tony)

| Option | Pin | Strength | Brittleness | Code |
|---|---|---|---|---|
| A. Plain CN | `["<Legal Name>"]` | Any Valid, publicly trusted certificate with that CN passes | Survives L/S/C changes. Breaks only if the validated legal name changes | none |
| B. Partial DN | `["CN=<Legal Name>, O=<Legal Name>, C=<CC>"]` | Adds org and country | Microsoft warns the subject DN can change (2.5), which would strand installs until a manual reinstall | none |
| C. Durable identity EKU | custom `verifyUpdateCodeSignature` (setter `NsisUpdater.js:18-29`) requiring Valid + `1.3.6.1.4.1.311.97.1.0` + the subscriber's `1.3.6.1.4.1.311.97.<…>` | Strongest: tied to the identity validation resource, which is the pinning mechanism Microsoft recommends (concept-certificate-management, VERIFIED) | Durable across renewals and DN edits. A new identity validation changes it | Custom PowerShell verification in `src/main/updater.ts` plus tests, replacing electron-updater's name check |

C can also be layered later: release N pins A, then a later release switches to C. The installed pin always governs the *next* hop, so each change needs one release in which both old and new are accepted.

---

## 4. Fail-fast chain probe (brief item 3)

**Placement:** directly after the mode-aware secrets gate (2.4), which replaces `release.yml:248-264`, and **before** `actions/setup-node` (`:265`), `npm ci` (`:269`), the model cache (`:271-279`) and the build (`:282`). The runner's preinstalled Node is enough: the PFX preflight already runs with no setup-node or npm (`windows-signing-identity-preflight.yml:32-41`).

```yaml
      - name: Probe PFX signing identity chain (no build, no signing)
        if: vars.WIN_SIGNING_MODE == 'pfx'
        run: node scripts/windows-signing-identity-preflight.mjs --release-gate
        env: { WIN_CSC_LINK: ..., WIN_CSC_KEY_PASSWORD: ..., WIN_CSC_EXPECTED_SUBJECT: ... }   # same guarded expressions as 2.4
      - name: Azure login for the signing probe (OIDC)
        if: vars.WIN_SIGNING_MODE == 'azure'
        uses: azure/login@<40-hex SHA>
        with: { client-id: ${{ secrets.WIN_AZURE_CLIENT_ID }}, tenant-id: ${{ secrets.WIN_AZURE_TENANT_ID }}, subscription-id: ${{ secrets.WIN_AZURE_SUBSCRIPTION_ID }} }
      - name: Probe Azure signing with one canary signature (no app build)
        if: vars.WIN_SIGNING_MODE == 'azure'
        run: node scripts/windows-signing-azure-probe.mjs --release-gate
        env: { WIN_AZURE_SIGNING_ENDPOINT: ..., WIN_AZURE_SIGNING_ACCOUNT: ..., WIN_AZURE_CERT_PROFILE: ..., WIN_CSC_EXPECTED_SUBJECT: ..., WIN_AZURE_IDENTITY_EKU: ... }
```

**PFX probe.** This is the existing chain policy: system roots only, online revocation, code-signing application policy, no custom roots (`windows-signing-identity-preflight.ps1:67-102`). It emits fixed codes plus `chainStatusCodes` (`windows-signing-identity-preflight.mjs:150-158`). For the current `CN=Mantu` PFX it returns `CHAIN_UNTRUSTED`, `UntrustedRoot` in minutes. The lead observed that code in run 35538932316; I did not re-run it.

**Azure canary probe** (new, same supervisor discipline: bounded output, fixed codes, no raw native text):
1. Compile a throwaway unsigned PE into `RUNNER_TEMP` using Windows PowerShell's `Add-Type -OutputType Library -OutputAssembly metis-canary.dll`. It contains no app code. (ASSUMED to work on windows-latest; a Library target is used because non-Library `-OutputType` values are not reliable on PowerShell 7.)
2. Sign it with the same shell choice (F6) and **the same module and parameter mapping electron-builder uses** (F4) for option A, or with the pinned hook for option B. This is one real signature per release run.
3. Verify with the shared `windowsSignatureCommand` / `windowsSignatureProblem` plus the azure EKU policy (2.5). Output codes: `PASS | CANARY_BUILD_FAILED | AZURE_SIGN_FAILED | AUTHENTICODE_<Status> | PUBLISHER_MISMATCH | TIMESTAMP_MISSING | PUBLIC_TRUST_EKU_MISSING | IDENTITY_EKU_MISMATCH | TEST_PROFILE_EKU_PRESENT | PROBE_TIMEOUT`.

In one step this covers the OIDC federation, the role assignment, the endpoint/region match (Microsoft notes a mismatch typically gives a 403), the profile type, chain trust on a clean runner, and the TSA. None of it depends on the app build.

---

## 5. Fleet track: Intune/GPO trust of `CN=Mantu` (brief item 4)

**What it is.** IT deploys the **public** `.cer` of the self-signed `CN=Mantu` certificate to Trusted Root CAs and Trusted Publishers through GPO or Intune "Trusted certificate" profiles (`docs/ENTERPRISE-DEPLOY-WINDOWS.md:55-70`). On those machines `Get-AuthenticodeSignature` returns Valid, so the updater's Status check (`verifier:56`) passes and a `["Mantu"]` pin matches. There is no certificate or licence cost, only IT time. Whether Mantu IT will do it is UNKNOWN.

**Limits:**
- **Managed Mantu PCs only.** Unmanaged and public machines, and client-managed laptops consultants may use, stay at UnknownError (3.1). If Mantu has a BYOD population, it is out of reach.
- **It cannot use the public pipeline.** `release.yml` `verify-signing` runs on a runner that does not trust the root and correctly fails (`signing-policy.mjs:45`). Making it pass would mean adding a custom root in CI, which the preflight policy explicitly rules out (`docs/windows-signing-identity-preflight.md:27`). Fleet builds therefore need a **separate, clearly labelled, non-public lane**: a manual workflow modelled on `cahe-windows.yml`, or local `scripts/sign-win.mjs` (`:1-20`). It would publish to the private feed (`updateFeedUrl` admin policy, `src/main/updater.ts:46-61`, `ENTERPRISE-DEPLOY-WINDOWS.md:124-137`) or to Intune. It must never publish to `Metis-Releases`: public installs of a `CN=Mantu`-signed build would then carry a pin and a signature that fail everywhere outside the fleet.
- **Trust blast radius.** Putting a self-signed leaf in Trusted Root means whoever holds the PFX can sign code the whole fleet trusts. Today that PFX is a base64 GitHub secret. In a build step it sits in the environment, and the packaged-launch gate passes the full env to the launched app (`check-packaged-launch.mjs:202-211`). A self-signed certificate has no revocation, so the only remedy after a compromise is removing the GPO. Whether the current certificate is CA:false and code-signing-only is **UNKNOWN**; the preflight checks the EKU but reports no basicConstraints.
- **No SmartScreen reputation** for downloads outside the fleet (`ENTERPRISE-DEPLOY-WINDOWS.md:49-51`).
- **Pin coupling.** If the fleet is later moved to Azure through auto-update, the fleet build must already pin `["Mantu", "<Azure CN>"]` (3.3 P2), which requires the Azure CN to be known. An Intune reinstall avoids this.
- **Alternative (out of lane, UNKNOWN fit):** Artifact Signing *Private Trust* profiles are meant for internal LOB signing, but their trust also has to be distributed by IT (concept-resources-roles, VERIFIED that the profile type exists).

---

## 6. Tests to add (brief item 5a)

These follow the repo's patterns: text-level contract tests on `package.json` and workflows (`scripts/release-gates.test.ts:146-236`, `scripts/mac-chain-gates.contract.test.ts`), behavioural `spawnSync` tests of gate scripts with synthetic env (`release-gates.test.ts:163-214`), running the installed dependency in a disposable child (`scripts/updater-yaml-compat.test.ts:7-54`), `it.runIf(process.platform === 'win32')` for real Authenticode checks (`scripts/verify-signing.test.ts:63-74`, which runs in the `release-quality` Windows leg, `release.yml:18-49`), and `node --test` plus a small vitest adapter for dependency-free preflight code (`scripts/windows-signing-identity-preflight.test.ts:1-12`).

| File (new unless noted) | Asserts |
|---|---|
| `scripts/windows-signing-mode.test.ts` | Resolver matrix from 2.1: every fixed code; `pfx` complete gives OK; `azure` complete gives an overlay with exactly the four azure keys taken from env plus `forceCodeSigning: true` plus the list; both modes present gives `AMBIGUOUS`; each missing input gives `INCOMPLETE` naming the variable; stderr **never** contains any synthetic secret value; a bad endpoint is rejected; any `AZURE_*` credential var gives `AZURE_ENV_FORBIDDEN`; a list that excludes the expected signer gives `PUBLISHER_LIST_EXCLUDES_SIGNER`, evaluated with builder-util-runtime `parseDn` semantics |
| `scripts/windows-signing-config.contract.test.ts` | Runs the **real** `app-builder-lib` `getConfig`+`validateConfiguration` on generated overlays for both modes: VALID, and the resolved config equals `electron-builder.win.yml` apart from the signing keys (the experiment in 2.2). Negative pins that record why the design routes the list through `publish`: `azureSignOptions.publisherName` as an array is rejected, `win.publisherName` is rejected. `electron-builder*.yml` contain no `azureSignOptions` and no publisher literal (no identity in the repo) |
| `scripts/update-publisher-acceptance.test.ts` | Loads the installed `windowsExecutableCodeSignatureVerifier.js` in a child process with a `--require` preload that replaces `child_process.execFile` with synthetic `Get-AuthenticodeSignature` JSON. Patching works because the verifier reads `execFile` at call time (`:5, :47`). Cases: Status 1 + `CN=Mantu` + `["Mantu"]` is rejected (the UnknownError case); Status 0 + `CN=Mantu` + `["Mantu","<new>"]` is accepted; Status 0 + new DN + the same list is accepted; Status 0 + new DN + `["Mantu"]` is rejected (why P2 needs T); a DN-subset entry is accepted and a mismatched `O=` is rejected. Plus `it.runIf(win32)`: the real verifier against `powershell.exe` with `["Microsoft Windows"]` returns `null` and with `["Mantu"]` returns non-null. A dependency pin checks that `NsisUpdater.js` still returns early when `publisherName == null`, so an electron-updater upgrade that changes the no-pin behaviour gets reviewed |
| `scripts/check-update-publisher.test.ts` | Missing or empty pin with `verifyUpdateCodeSignature: true` fails; a list different from `WIN_UPDATE_PUBLISHER_NAMES` fails; the verifier call is made with the parsed list and the Setup.exe path (stubbed verifier) |
| `scripts/verify-signing.test.ts` (extend `:81-101`) | EKU policy: azure mode requires `…97.1.0`, optionally requires the exact identity EKU, rejects `…10.3.13`; PFX mode unchanged; malformed EKU output fails closed |
| `scripts/windows-signing-identity-preflight.test.mjs` (extend) | `--release-gate` accepts only push + `refs/tags/v*` + repo + SHA==HEAD, and rejects `workflow_dispatch`; the default and `--check-revision` modes still reject push contexts; other arguments still give `ARGUMENTS_UNSUPPORTED` (`.mjs:164-171`) |
| `scripts/windows-signing-azure-probe.test.mjs` + `.test.ts` adapter | Supervisor output is fixed codes only; no raw child output or exception text; timeouts and output bounds; canary path confined to `RUNNER_TEMP`; manual workflow contract (`workflow_dispatch`, main-only, exact SHA, `environment: windows-signing`, `permissions` exactly `contents: read` + `id-token: write`, `azure/login@<40-hex>`, no `WIN_CSC_*`, no `npm ci`/electron-builder/`gh release`) |
| `scripts/windows-signing-release.contract.test.ts` | In `release.yml` `release-windows`: `environment: windows-signing`; permissions exactly `contents: read` + `id-token: write`; the gate calls `node scripts/check-release-secrets.mjs win`; the probe steps come after the gate and **before** `actions/setup-node` and `npm run release:build:win` (index ordering, like `src/main/updater.test.ts:614-618`); every `secrets.WIN_CSC_LINK/KEY_PASSWORD` reference in the job is guarded by `vars.WIN_SIGNING_MODE == 'pfx'`; `azure/login` is SHA-pinned and appears exactly twice, both `if: … == 'azure'`; no `AZURE_CLIENT_SECRET` in any workflow; no `AZURE_CLIENT_ID:`/`AZURE_TENANT_ID:` env keys in the Windows job; `verify-signing` then `check-update-publisher` both before `upload-artifact` |
| `scripts/release-gates.test.ts` (update `:28-30, :163-180, :232-234`) | `release:build:win` calls `scripts/electron-builder-win.mjs`, and the wrapper source contains `'--config'` plus an `extends` of `electron-builder.win.yml`; the Windows gate is mode-aware (spawnSync matrix: pfx OK, azure OK, both FAIL, none FAIL); the phrase `refusing to publish an unsigned Windows release` is kept |
| `scripts/windows-signing-identity-preflight.test.mjs` (unchanged) | Keeps forbidding `id-token:` in the PFX preflight workflow |

---

## 7. Ordered steps: owner/IT versus code (brief item 5b)

**Decisions (Tony), before any step below:** D1 which tracks (public Azure, fleet GPO, or both). D2 which legal entity signs (eligibility is another lane; the entity, its country and the exact CN are **UNKNOWN** here). D3 pin format (3.4 A/B/C). D4 azure option A or B (2.3). D5 conditional versus unconditional PFX secrets (2.4). D6 Cahê stays PFX or moves (2.8).

| # | Who | Step | Depends on |
|---|---|---|---|
| 1 | Code | Resolver + `check-release-secrets` + wrapper + tests (2.1, 2.2, 6) | — |
| 2 | Tony | Set repo variable `WIN_SIGNING_MODE=pfx` **before** merging step 3. Once merged, the gate refuses a missing mode. | 1 |
| 3 | Code | `release.yml` edits (2.4), PFX `--release-gate` probe (4), `check-update-publisher` (2.7), docs drift (2.8). With mode=pfx and today's certificate, a tag run now fails in the probe with `CHAIN_UNTRUSTED`, as intended. | 2 |
| 4 | Tony/legal (other lane) | Artifact Signing identity validation for the chosen entity (Public Trust). Record the exact certificate subject CN/O/L/S/C and the durable EKU `1.3.6.1.4.1.311.97.<…>`. | D2 |
| 5 | Tony/IT (Azure) | Create the Artifact Signing account in a region (this fixes the endpoint, e.g. `https://weu.codesigning.azure.net` or `https://swn.codesigning.azure.net`) and a **Public Trust** certificate profile, not Public Trust Test. Create an Entra app or user-assigned identity with a federated credential whose subject is `repo:mysticalsin/AskToto-Mantu:environment:windows-signing`. Assign **Artifact Signing Certificate Profile Signer** to it (role name VERIFIED at concept-resources-roles; the recommended scope, profile or account, is ASSUMED). | 4 |
| 6 | Tony (GitHub) | Create environment `windows-signing` with deployments limited to `v*` tags and optionally a reviewer. Add environment secrets `WIN_AZURE_CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID` and environment variables `WIN_AZURE_SIGNING_ENDPOINT/ACCOUNT`, `WIN_AZURE_CERT_PROFILE`, `WIN_AZURE_PUBLISHER_NAME`, `WIN_UPDATE_PUBLISHER_NAMES`, `WIN_AZURE_IDENTITY_EKU`. Set `WIN_CSC_EXPECTED_SUBJECT` to the new CN. | 5 |
| 7 | Code | Azure canary probe + manual azure preflight workflow + EKU policy in verify-signing (2.5, 2.6, 4) | 1 |
| 8 | Tony | Dispatch the azure preflight on main at the exact SHA and require `PASS`. | 6, 7 |
| 9 | Tony | Flip `WIN_SIGNING_MODE=azure` and push a `v*` tag. The release must pass the probe, `verify-signing` (Valid, CN, timestamp, EKUs) and `check-update-publisher`. Only then does it reach the existing draft-then-publish step (`release.yml:311-428`). | 8 |
| 10 | Tony | After the first signed release, confirm on a clean public Windows machine that v1.6.6 (current Latest) auto-updates to it, and that the new install's `resources\app-update.yml` shows the intended pin. | 9 |
| F1 | IT (fleet, optional) | GPO/Intune `CN=Mantu` `.cer` into Trusted Root + Trusted Publishers. Set up a private feed or Intune packages. Build fleet releases through a separate non-public lane. | D1 |
| F2 | IT (fleet → Azure) | Either Intune-reinstall the Azure-signed N, or build a transitional T (`CN=Mantu`, pin `["Mantu","<Azure CN>"]`), let it spread, then N (3.3 P2). | 4, F1 |
| 11 | Code | Next release after migration: drop `"Mantu"` from any fleet list, and optionally move to pin option C. | 9/F2 |

---

## 8. Claims ledger

| Claim | Status | Source |
|---|---|---|
| electron-builder 26.15.3 Azure path reads no AZURE_* env; credentials come from the TrustedSigning module | VERIFIED | grep app-builder-lib/out; windowsSignAzureManager.js:26-70 (2026-09-24) |
| Azure path installs TrustedSigning ≥0.5.0 from PSGallery with -Force at build time | VERIFIED | windowsSignAzureManager.js:38 |
| With -Force, the newest module version is always installed (cannot pin) | ASSUMED | PowerShellGet behaviour, not tested |
| Microsoft now points to the `ArtifactSigning` PS module (0.1.20, 2026-09-09); TrustedSigning latest is 0.5.8 (2025-07-11) | VERIFIED | powershellgallery.com pages + MS Learn signing-integrations (seen 2026-09-24) |
| azureSignOptions.publisherName is schema-string-only; publish.publisherName accepts arrays; win.publisherName is invalid | VERIFIED | scheme.json + local validateConfiguration run |
| Repeated `-c.publish.publisherName` gives the last value, not an array | VERIFIED | local normalizeOptions run |
| Generated JSON overlay resolves identically to electron-builder.win.yml apart from signing keys | VERIFIED | local getConfig diff (config resolution only, no build) |
| Azure mode writes no updater pin unless publisherName is supplied | VERIFIED | windowsSignAzureManager.js:10-22; PublishManager.js:202-207 |
| PFX mode pins CN only (`[commonName]`) | VERIFIED | windowsSignToolManager.js:18-29 |
| electron-updater supports a list; DN entries compare all given keys; plain entries compare CN; Status must be 0 first | VERIFIED | windowsExecutableCodeSignatureVerifier.js:56, 70-93; NsisUpdater.js:84-100 |
| No pin means no signature verification on update | VERIFIED | NsisUpdater.js:87-90 |
| All 14 public Windows EXEs on Metis-Releases are unsigned | VERIFIED | PE certificate-table range fetch, parser cross-checked on a signed installer (2026-09-24) |
| Published installers' app-update.yml carry no publisherName | ASSUMED (high) | Inferred from unsigned + code path + tag configs + local 1.5.0 extraction; not extracted from published assets |
| Early-July AskToto builds pin ["Mantu"] and point at AskToto-Releases (now 404) | VERIFIED (local builds); in-the-wild count UNKNOWN | local app-update.yml files; api.github.com 404 (2026-09-24) |
| UnknownError on untrusted-root machines makes CN=Mantu updates fail regardless of pin | VERIFIED (code needs Status 0) / ASSUMED (UnknownError≠0 enum) | verifier:56; ENTERPRISE-DEPLOY-WINDOWS.md:67-69 |
| Preflight 35538932316 = CHAIN_UNTRUSTED/UntrustedRoot | Lead-reported, not re-run | brief |
| OIDC subject for an environment job is `repo:ORG/REPO:environment:NAME`, even on tag pushes | VERIFIED | docs.github.com OIDC reference (seen 2026-09-24) |
| Job-level permissions set unlisted permissions to none | VERIFIED | docs.github.com workflow syntax (seen 2026-09-24) |
| Role "Artifact Signing Certificate Profile Signer" is required to sign | VERIFIED | learn.microsoft.com concept-resources-roles (seen 2026-09-24) |
| Certificates last 72 h, renewed daily; subject DN can change; durable EKU `1.3.6.1.4.1.311.97.*`; Public Trust marker `…97.1.0`; TSA timestamp.acs.microsoft.com | VERIFIED | learn.microsoft.com concept-certificate-management (seen 2026-09-24) |
| Public Trust Test profiles carry lifetime EKU `1.3.6.1.4.1.311.10.3.13` | VERIFIED | concept-resources-roles (seen 2026-09-24) |
| Regional endpoint URIs (e.g. weu, swn, neu `.codesigning.azure.net`); a region mismatch causes 403 | VERIFIED | learn.microsoft.com how-to-signing-integrations (seen 2026-09-24) |
| az CLI token refresh fails when a long build outlives the OIDC assertion | ASSUMED | not tested; mitigated by a second login |
| Add-Type Library canary PE builds on windows-latest | ASSUMED | not run |
| Signing entity, its country, exact CN, eligibility | UNKNOWN | out of this lane |
| Whether any Mantu-fleet installs with a `CN=Mantu` pin exist | UNKNOWN | ask IT |
| Current CN=Mantu certificate basicConstraints (CA:true/false) | UNKNOWN | not reported by the preflight |

## 9. Out of lane / open

- The Mantu or Amaris legal entity, the jurisdiction and eligibility for Artifact Signing Public Trust were not researched here. They are an input to D2 and step 4.
- Artifact Signing pricing and signature quota: another lane. The canary adds one signature per release run.
- A newer electron-builder may switch to the `ArtifactSigning` module. The repo pins 26.15.3 (`release-gates.test.ts:40`), so any upgrade is a separate, reviewed change.
