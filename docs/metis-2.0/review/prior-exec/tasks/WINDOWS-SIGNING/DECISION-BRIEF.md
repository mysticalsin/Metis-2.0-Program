# Métis Windows signing: decision brief (fact-checked 2026-09-24)

Tags: **V** = VERIFIED (primary source or code, seen 2026-09-24), **A** = ASSUMED, **U** = UNKNOWN. This brief gives inputs and trade-offs for you to decide. It is not legal or financial advice, and it makes no spending recommendation.

## The problem
Métis EXEs are signed with an internal self-signed certificate (CN=Mantu). Windows trusts it only on PCs where IT has installed it, so the release gate stops (preflight run 35538932316 failed its identity-check step on 2026-09-20 [V]; the logged reason, CHAIN_UNTRUSTED/UntrustedRoot, was reported by the lead and not re-read [A]).
As a result, every public installer on Metis-Releases is unsigned. That includes v1.8.7 and v1.9.6-unsigned, published today, whose PE certificate tables are empty [V]. Users get the "Windows protected your PC" warning [V], and installed apps skip update signature checks because the updater has no publisher name to compare against [V].

## Options
| Route | What it gives | Mantu entity eligibility | Cost (seen 2026-09-24) | Setup time | Who must act | What the code needs |
|---|---|---|---|---|---|---|
| **A. Microsoft Artifact Signing** (formerly Trusted Signing) | Public trust: Windows trusts the chain by default [V]. SmartScreen reputation builds over time, with early warnings expected [V]. The product page says it gives "base reputation", which contradicts that [V]. | Organizations are accepted in the US, Canada, EU, UK, Australia, NZ, Japan, South Korea, Singapore, Switzerland, Norway and Israel [V]. **CH:** MANTU GROUP SA CHE-476.382.049 and Amaris Consulting Sàrl CHE-113.375.102 are both active [V]. Switzerland was added on 2026-07-23 [V], and no successful Swiss organization validation has been reported yet [A]. **FR:** AMARIS FRANCE SAS, SIREN 511199226 (EU) [V]. **LU:** AMARIS Luxembourg B159033, from secondary sources only [A]. | Basic: USD 9.99/month for 5,000 signatures. Premium: USD 99.99/month. Extra signatures: USD 0.005 each [V]. Billed for the full month, not pro-rated [V]. Needs a paid Azure subscription [V]. | Identity validation takes 1 to 20 business days [V] | Azure subscription owner. Someone with the Identity Verifier role. A named representative with a government ID and a mailbox on the company domain [V]. Legal picks the entity [U]. | `win.azureSignOptions` is already supported by electron-builder 26.15.3 [V]. `publisherName` is required and must be a single string: the schema rejects configs without it [V]. Microsoft now publishes a newer ArtifactSigning PowerShell module, but electron-builder still installs the older TrustedSigning module; whether that still works is unknown [U]. Also needs an OIDC `azure/login` step [V]. |
| **B. Public CA OV + CA cloud signing** (e.g. SSL.com eSigner) | Public trust. SmartScreen behaves the same as route A [V]. | Any registered legal entity. The CA validates its legal name [A]. | SSL.com OV costs $129/year, plus eSigner at $20/month (20 signings) up to $250/month (1,000) [V; the tier page is dated 2025-09-23]. | SSL.com states 3 to 5 days for standard validation [V] | Purchaser, plus a representative for CA validation [A] | A custom `signtoolOptions.sign` hook, which electron-builder 26.15.3 already supports [V], plus vendor CLI glue [A]. Must set `signtoolOptions.publisherName` explicitly; otherwise no update pin is written [V]. Each file is signed twice by default (sha1 and sha256), which doubles metered signings [V]. |
| **C. Public CA OV + your own HSM** (e.g. Azure Key Vault Premium) | Public trust, same as route B [V] | Same as route B [A] | CA fee needs a quote [U]. Azure Key Vault HSM key about $5/key/month (lane B) [A]. SSL.com charges $500 for Azure/Google HSM attestation [V]. | Weeks [A] | Purchaser, plus the Azure Key Vault administrator [A] | `signtoolOptions.certificateSha1` or a sign hook, which electron-builder 26.15.3 already supports [V]. The runner needs a vendor KSP or AzureSignTool [A]. |
| **D. Microsoft Store (MSIX/AppX)** | Store installs never get SmartScreen warnings, because Microsoft re-signs them [V]. This does **not** cover the GitHub Setup.exe or the portable exe [V]. | Company developer registration is free (lane B) [A] | Free [V] | Unknown [U] | Partner Center owner [A] | The `appx` target is already set up in electron-builder.yml [V]. `appx.publisher: CN=Mantu` must be replaced with the identity Partner Center assigns [V]. |
| **E. Fleet only: keep CN=Mantu and have IT trust it** | Managed PCs only. Public users still see warnings [V]. | n/a | $0 [A] | Depends on IT [U] | Mantu IT (Intune/GPO) | The PFX path works as it is today [V]. The release gate can pass only if CI trusts a self-signed root, which exposes a wide attack surface, or if fleet builds skip the public gate [A]. |
| **F. SignPath Foundation** (open-source program) | Public trust, but the publisher shown is SignPath Foundation, not Mantu [V] | Requires an OSI license with no proprietary components. The repo is MIT [V], but the bundled binaries may not meet the rules [U]. | Free [V] | Unknown [U] | SignPath approval [V] | Their own pipeline [U] |

Across routes: EV certificates no longer bypass SmartScreen. Since 2024, Microsoft treats EV and OV code-signing certificates the same [V].

## Fleet stopgap (route E, alongside any public route)
- IT can push the CN=Mantu certificate to managed PCs through Intune/GPO. Microsoft's docs list this as the supported use of self-signed certificates [V].
- The cost is IT time only [A]. It does nothing for public downloads [V].
- If this certificate is also a CA (CA:true), trusting it as a root lets it vouch for anything. Whether it is CA:false is unknown and needs confirming with IT [U].

## Publisher-name migration caveat
- A public certificate's name must be the validated legal name, for example "MANTU GROUP SA". It cannot be "Mantu", and Artifact Signing does not allow a custom name [V].
- The first signed public release writes its publisher name into app-update.yml. From then on, every update must match that name [V].
- The updater requires a Valid signature status before it compares names [V].
- No public install carries a CN=Mantu pin today, because all public EXEs are unsigned [V]. So the first publicly signed release does not need a transitional release [V].
- Fleet PCs running a build signed with the CN=Mantu PFX would pin "Mantu" and reject updates signed under the new name [V]. Whether any such installs exist is unknown [U]. The fix would be one release signed with the old key that lists both names, or a reinstall through Intune [A].
- Artifact Signing issues a new 72-hour certificate every day, and the certificate subject can change over time [V]. Pinning the CN alone is simpler; pinning the full DN is stricter [V].
- Changing the signing identity later affects SmartScreen publisher trust [V]. Choosing the entity is effectively a one-time decision [A].
- The brief's premise that `win.publisherName: CN=Mantu` is set is out of date. It was removed in commit 3c2dbf85, and electron-builder 26.15.3 now rejects that key [V]. `appx.publisher: CN=Mantu` is still in the config [V].

## What I (Claude) can wire now without credentials
1. A fail-closed `WIN_SIGNING_MODE=pfx|azure` resolver used by `check-release-secrets` in release.yml. It stays dormant until the secrets exist [A].
2. A generated config overlay that adds `azureSignOptions` from env plus a `publish.publisherName` list. A list is needed because `azureSignOptions.publisherName` takes only one string [V].
3. OIDC plumbing: a `windows-signing` environment and `id-token: write` in a separate workflow. The existing preflight tests forbid `id-token:` [V].
4. `verify-signing` EKU checks: require `1.3.6.1.4.1.311.97.1.0` and reject the test-profile EKU `…10.3.13` [V].
5. A post-build gate that runs electron-updater's own `verifySignature` against Setup.exe with the pin baked into the build [A].
6. Keeping the `AZURE_*` variables out of the packaged-launch env, because the app reads `AZURE_CLIENT_ID` as its SSO config [V (lane C)].
7. Updating the stale docs/ENTERPRISE-DEPLOY-WINDOWS.md (lines 45 and 84) [V].

These things I cannot do: choose the entity, create the Azure subscription and validation, buy a certificate, or confirm that the legacy PowerShell module works. The last one needs a Public Trust Test profile [U].

## Decisions for you
1. Which entity will be the publisher, and who is the authorized representative [U]?
2. Which public route to take, if any: A, B, C and/or D, and the budget for it [U]?
3. Whether to run fleet route E in parallel [U]?
4. Whether to fix the amaris.com legal notice first. Its "Geneva registry" number CHE-276.382.049 and its Vernier address do not match Zefix; the VAT line on the same page shows the correct UID [V]. Validators check public records [V].

Sources, all seen 2026-09-24:
- Microsoft Learn: artifact-signing quickstart (updated 2026-09-18), faq, concept-certificate-management, smartscreen-reputation (2026-08-17), code-signing-options (2026-08-29), and security/trusted-root/program-requirements §3.D.3.
- Microsoft Q&A threads 5812975 and 5977141.
- prices.azure.com (serviceName "Trusted Signing").
- CA/B Forum CSBR v3.11.0: §6.2.7.4, §6.3.2, §7.1.4.2.2(a).
- Registries: zefix.ch firm 1245486 and 859847; recherche-entreprises.api.gouv.fr.
- ssl.com buy page and eSigner pricing page; signpath.org/terms.
- metis-2.0 code: node_modules/app-builder-lib/out/codeSign/windowsSignAzureManager.js:10-68, windowsSignToolManager.js:18-29, publish/PublishManager.js:202-207; electron-updater/out/windowsExecutableCodeSignatureVerifier.js:47-93 and NsisUpdater.js:52-57,84-100.
