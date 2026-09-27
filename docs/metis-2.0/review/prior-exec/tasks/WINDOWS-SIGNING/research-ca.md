# Research lane B: publicly trusted OV/EV Authenticode certificates from GitHub Actions (2026)

Scope: what it takes to replace the internal self-signed `CN=Mantu` certificate with a certificate from a public CA that Windows trusts, signed from `windows-latest` GitHub Actions, for the Métis NSIS Setup.exe, portable exe and AppX, using electron-builder 26.15.3.

All web sources were read on **2026-09-24**. The code facts come from `/Users/tony/AI-Brain-build/metis-2.0/node_modules` (electron-builder / app-builder-lib 26.15.3, electron-updater 6.8.9) and the repo's own config, read the same day.

Labels: **VERIFIED** means I read it at the source listed. **ASSUMED** means inferred, or taken from a secondary or third-party page. **UNKNOWN** means not established. Prices are what the page showed on that date. They are inputs for Tony. None of this is a purchase or legal recommendation, and I am not a lawyer.

---

## 0. Summary (inputs, not a verdict)

| # | Finding | Status |
|---|---|---|
| 1 | Since **2023-06-01**, a publicly trusted code-signing key (OV or EV) must be generated, stored and used inside a hardware crypto module certified to at least FIPS 140-2 Level 2 or Common Criteria EAL 4+. The CA must check this itself, using one of seven listed methods such as key attestation, a CA-shipped token, a cloud-HSM report or a Signing Service. Source: CA/B Forum Code Signing BR §6.2.7.4 (v3.11.0). | VERIFIED [S1] |
| 2 | So a CA cannot issue a new public OV cert as an exportable `.pfx`. The current `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD` pattern can only ever hold a self-signed or private-CA cert. It cannot hold a public one. | VERIFIED (rule) [S1]; DigiCert says browser/laptop key generation is gone [S9] |
| 3 | Pre-June-2023 exportable certs are also gone by now. Their maximum validity was 39 months, so the last of them expired around the end of Aug 2026. | ASSUMED (derived from §6.3.2 [S1]) |
| 4 | Certificates issued on or after **2026-03-01** are capped at **460 days** (ballot CSC-31). In practice CAs now sell 1-year certs and re-issue yearly. | VERIFIED [S1][S2]; CA practice [S7][S13][S14][S16] |
| 5 | **EV no longer gives instant SmartScreen reputation.** Microsoft stopped recognising EV code signing in **Feb 2024** and removed the EV code-signing OIDs from roots in **Aug 2024**. Its developer docs say EV no longer bypasses SmartScreen. | VERIFIED [S3][S4][S5] |
| 6 | Cloud-HSM routes that work from CI include SSL.com eSigner, DigiCert KeyLocker, Sectigo or SSL.com with your own attested cloud HSM (Google Cloud KMS, Azure Key Vault Premium / Managed HSM), GlobalSign with Azure Key Vault, and Microsoft Artifact Signing (covered in lane A). Certum SimplySign has no official headless CI support. | VERIFIED per vendor, §4 |
| 7 | electron-builder 26.15.3 accepts a non-PFX signer in three ways. (a) `signtoolOptions.certificateSha1` against a cert-store cert backed by a vendor KSP. (b) A custom `signtoolOptions.sign` hook. (c) `azureSignOptions`, which only works with Artifact Signing. | VERIFIED (code) §5 |
| 8 | **Trap.** With a custom `sign` hook and no cert file or cert-store info, electron-builder writes no `publisherName` into `app-update.yml`. electron-updater then **skips** signature verification without saying so. Any hook-based route must set `signtoolOptions.publisherName` explicitly. | VERIFIED (code) §5.2 |
| 9 | **Update continuity.** A public OV/EV cert's CN must be the subject's **legal name**, for example "MANTU GROUP SA", not "Mantu". Installed apps that pinned `publisherName: Mantu` will reject updates signed by the new cert. electron-updater also requires `Status == Valid`, which a self-signed cert only reaches on machines that trust it. | VERIFIED (BR §7.1.4.2.2 [S1]; updater code); impact on the installed base UNKNOWN §6 |
| 10 | The Microsoft Store re-signs **MSIX/AppX** submissions for free. It does **not** re-sign MSI/EXE submissions, and it covers only Store-distributed installs. The GitHub-hosted Setup.exe and portable exe still need their own signature. | VERIFIED [S6] |

---

## 1. Publisher legal entities (eligibility input)

Registry lookups on 2026-09-24. Lane A (`research-azure.md` §4) has a longer list, and it matches these.

| Entity | Country | Registry id | Registered address | Status | Source |
|---|---|---|---|---|---|
| **MANTU GROUP SA** (formerly AMARIS GROUP SA) | Switzerland (GE) | UID CHE-476.382.049 | Place de la Gare 4, 1225 Chêne-Bourg | Active. Holding purpose. Swiss entry 2015-12-10 (Moneyhouse, secondary) | VERIFIED Zefix [S30]; mantu.com terms name it as the site publisher [S33] |
| **Amaris Consulting Sàrl** | Switzerland (GE) | UID CHE-113.375.102 | Place de la Gare 4, 1225 Chêne-Bourg | Active. IT/engineering consulting purpose. Commercial-gazette entries back to at least 2016 | VERIFIED Zefix [S30] |
| **AMARIS FRANCE SAS** (SASU) | France | SIREN 511 199 226 (RCS Lyon) | 25 bd Eugène Deruelle, 69003 Lyon | Active, created 2009-01-01 | VERIFIED recherche-entreprises.api.gouv.fr [S31] |
| **AMARIS Luxembourg S.à r.l.** | Luxembourg | RCS B159033 | 36-38 Grand-Rue, 1660 Luxembourg | Active, created 2011-02-23 | ASSUMED (pappers.lu, secondary) [S32] |
| Amaris Technologies GmbH | Switzerland (ZH) | UID CHE-115.827.078 | Bahnhofquai 11, 8001 Zürich | Active; consulting purpose | Registry VERIFIED [S30]; membership of the group ASSUMED |

What matters for a CA:
- Every public CA in §4 validates organisations worldwide. Switzerland, France and Luxembourg are all normal cases. VERIFIED: Microsoft's comparison table lists OV and EV as available worldwide [S6]. Per-CA country exclusions are UNKNOWN, but no page listed any.
- The BR has a "formed less than 3 years ago" clause that requires extra verification of the requester's identity. It does not apply to either Swiss entity, which both appear in gazette entries from 2016 or earlier. VERIFIED [S1 §3.2.2.1(4)][S30].
- **Data-quality flag.** amaris.com's terms still give MANTU GROUP SA's old Vernier address and a registry number (CHE-276.382.049) that does not match the registry (CHE-476.382.049). mantu.com shows the correct Chêne-Bourg data. VERIFIED [S33][S34]. CAs validate against the registry, so this probably doesn't block anything. It could cause questions if a validator cross-checks the website. ASSUMED.
- The certificate subject will be the verified legal name, for example `CN=MANTU GROUP SA, O=MANTU GROUP SA, L=Chêne-Bourg, C=CH`. The exact casing and fields depend on the CA. ASSUMED format. That CN rule is VERIFIED [S1 §7.1.4.2.2–3]. **Which entity becomes the visible Windows publisher is a brand and legal decision for Tony.**

---

## 2. The hardware-key rule and what it does to a `.pfx` in a GitHub secret

**Rule (VERIFIED, CSBR v3.11.0 dated 2026-06-16, §6.2.7.4) [S1]:**
- From 2023-06-01, the subscriber has to promise contractually to use one of three key-protection options. These are (7) a certified hardware crypto module, (8) a cloud key service whose HSM meets the bar, where the key never leaves the HSM boundary and all access is logged, or (9) a CA/B-compliant Signing Service.
- The CA must *verify* this using one of the listed methods in §6.2.7.4.2:
  - it ships a pre-keyed token;
  - the key has a manufacturer **key attestation**;
  - the subscriber uses a CA-prescribed library with an HSM;
  - an IT audit;
  - a cloud-HSM configuration report;
  - an approved auditor witnesses key generation;
  - the subscriber signs up to a Signing Service.
- RSA-3072 is the minimum key size for code signing (§6.1.5, since 2021). VERIFIED [S1]. Microsoft's root program does not support ECC for code signing, or RSA keys above 4096. VERIFIED [S3].

**What this means for Métis CI:**
- A CA cannot hand over a public cert with an exportable private key. So "buy an OV cert, base64 the .pfx into `WIN_CSC_LINK`" is not possible. VERIFIED (rule) [S1].
- The CI runner must reach the key remotely: a cloud HSM or signing service, called through a Windows KSP/CNG provider, an HTTP API or a Java tool. The alternative is a self-hosted runner with a physical token plugged in. GitHub-hosted runners cannot hold USB tokens. ASSUMED (obvious, not documented).
- `scripts/sign-win.mjs` accepts only a PFX (`WIN_CSC_LINK` must be a local file, and it passes `/p` to signtool). Any HSM route needs it reworked or retired. VERIFIED (file header, read 2026-09-24).

---

## 3. SmartScreen: EV vs OV today

- Microsoft Trusted Root Program requirements, §3.D.3 (page dated 2026-04-28). Starting **Feb 2024**, Microsoft no longer accepts or recognises EV code-signing certificates. From **Aug 2024** the EV code-signing OIDs are removed from existing roots, and all code-signing certificates are treated equally. VERIFIED [S3].
- Microsoft Learn, "SmartScreen reputation" (ms.date 2026-05-04, updated 2026-08-17). It says EV certificates no longer bypass SmartScreen. OV and EV both warn until reputation builds, which can take weeks and hundreds of clean installs. A consistent signing identity helps. A self-signed cert behaves like no signature. VERIFIED [S4].
- Microsoft Learn, "Code signing options" (2026-08-29). It prices OV at roughly $150–300/yr and EV at $400+/yr, says the EV SmartScreen advantage "was removed in 2024", and says the EV premium is no longer justified for SmartScreen. VERIFIED [S5].
- electron-builder updated its own docs to match on 2026-09-17 (PR #10190 merged). VERIFIED [S29].
- **Renewal risk (community-reported, not official).** Several Q&A users report that SmartScreen reputation reset when a certificate was renewed. One of them quotes a Microsoft employee from April 2026 saying reputation does not carry over. With certificates now yearly (§0 #4), that could recur every renewal. ASSUMED. The source is a user-posted thread with no Microsoft answer in it [S35].
- Windows 11 Smart App Control may block unsigned files that have no positive reputation. VERIFIED [S4].
- **What EV still buys:** stricter identity vetting, which enterprise procurement sometimes asks for, and kernel-driver / hardware dev-center use, which Métis doesn't need. VERIFIED [S3 §3.F][S5].

---

## 4. Provider matrix (CI-capable routes)

The prices below are for **one certificate, one year**, as displayed on 2026-09-24. They exclude VAT and resellers.

### 4.1 SSL.com eSigner (CA-run cloud signing service)

- **Price, cert (USD):** OV $129/yr (1-yr term; multi-year discounts shown down to $96.75/yr for 5 years). EV $349/yr for 1 year. VERIFIED [S7][S8].
- **Price, eSigner signing subscription (USD/month, pricing guide dated 2025-09-23):**
  - OV/IV: $20 for 20 signings, $85 for 100, $175 for 300, $250 for 1,000. Overage runs from $1.00 down to $0.25 per signing.
  - EV: $100 for 10 signings, $300 for 100, $700 for 1,000, $1,500 for 10,000.
  - First 30 days unlimited. 25% off if paid annually.
  - VERIFIED [S10]. The guide is a year old, so re-confirm. ASSUMED stale-risk.
- **Other add-ons (one-time, USD):** YubiKey +$379. Cloud-HSM attestation (bring your own HSM) is $500 for Azure or Google and $1,500 for AWS on the buy page, but $1,200 for AWS on the 2025-03-26 guide. Expedited validation +$599. VERIFIED [S7][S8][S11]; the AWS figures conflict.
- **Validation:** standard OV takes 3–5 days on the buy page. VERIFIED [S7].
- **CI mechanics:** two options.
  - CodeSignTool (Java) or the GitHub Action (`SSLcom/esigner-codesign`, formerly `sslcom/actions-codesigner`). It needs `ES_USERNAME`, `ES_PASSWORD`, `CREDENTIAL_ID` and `ES_TOTP_SECRET`, and signs in place or to an output directory. VERIFIED [S12].
  - **eSigner CKA**, a Windows KSP that puts the cert in the Windows store like a virtual token, so plain `signtool` works. It runs on Windows runners only, and the TOTP secret is stored for automation. VERIFIED via vendor search snippets [S12b]; I did not read the CKA page in full, so treat it as ASSUMED.
- **electron-builder fit:** CKA plus `signtoolOptions.certificateSha1` is the native path, with no hook and `publisherName` derived automatically (§5.1). Otherwise use CodeSignTool through a `sign` hook plus an explicit `publisherName`. ASSUMED fit, based on the verified code paths.
- **Cost driver:** SSL.com bills per signing. One Métis release is roughly 9–10 PE files × 2 hashes, so about 20 signings (§5.3). The $20 OV tier would cover about one release a month. ASSUMED.

### 4.2 DigiCert KeyLocker / Software Trust (DigiCert ONE)

- **Price (USD):** digicert.com shows OV with KeyLocker at $44 per month per certificate, next to a subscription line of $696.00. EV with a DigiCert token shows $62 per month and $972.00. The page does not explain how the monthly and total figures relate. Resellers list DigiCert OV at about $399–549/yr (secondary). VERIFIED as displayed [S13]; the reseller figures are ASSUMED.
- **KeyLocker licence:** one signer and **1,000 signatures per certificate per year**, with more sold in blocks of 1,000. The KeyLocker service fee is separate from the cert according to the docs, but the product page says KeyLocker is included. So the fee structure is UNKNOWN until quoted. The licensing doc (modified 2026-06-15) is VERIFIED [S14].
- **CI mechanics:** GitHub Action `digicert/code-signing-software-trust-action@v1`. Secrets are `SM_HOST`, `SM_API_KEY`, and a **client-auth `.p12`** (`SM_CLIENT_CERT_FILE_B64` plus its password). The `.p12` authenticates to DigiCert ONE. It is not the signing key. Signing uses a `keypair-alias`. Simple mode uses `smctl`, and signtool is usable through the KSP. Windows, Linux and macOS runners are supported. VERIFIED [S15][S15b].
- The old action `digicert/ssm-code-signing@v1.1.1` reached end-of-service 2026-02-01 and end-of-life 2026-02-28. VERIFIED [S15c]. A search snippet giving 2026-03-01 / 2026-05-01 dates is contradicted by the doc page itself.
- **Key storage options** (DigiCert KB, modified 2026-04-23): a DigiCert token, your own supported token, your own HSM, or KeyLocker. VERIFIED [S9].
- **electron-builder fit:** KSP plus a cert-store sync plus `certificateSha1`, which is native. Or `smctl` through a `sign` hook plus an explicit `publisherName`. ASSUMED.
- **Validity:** DigiCert now sells 1-year code-signing plans only. ASSUMED (secondary snippet) [S16b].

### 4.3 Sectigo (token, or bring-your-own attested HSM)

- **Price (USD):** Sectigo direct says a code-signing cert "starts at $536.25 per year" on the 5-year option. Resellers are far lower. That quote is VERIFIED [S16]; reseller prices UNKNOWN.
- **Delivery:** a Sectigo token shipped to you, or a download onto **your own FIPS HSM with externally verifiable key attestation**. Since **2026-02-23**, multi-year purchases get a new device and a new cert every year. VERIFIED [S16].
- **CI mechanics (third-party guide, 2025-03-26):** generate an RSA-4096 HSM key in Google Cloud KMS, submit the attestation bundle and CSR to Sectigo, then sign on `windows-latest` with signtool through Google's KMS CNG provider, authenticated by Workload Identity Federation (OIDC, no long-lived secret). The guide gives about $2.50 per key per month plus $0.15 per 10k operations. ASSUMED (third-party [S17]; I could not load Google's pricing page).
- **electron-builder fit:** CNG provider plus `certificateSha1` (native), or jsign `GOOGLECLOUD` through a hook. ASSUMED.

### 4.4 GlobalSign (token, HSM, or Azure Key Vault)

- **Price:** not shown on the page without JavaScript (placeholders only). UNKNOWN; needs a quote [S18].
- **Delivery:** a USB token (included), an HSM, or Azure Key Vault. Only 1-year (366-day) certs are sold now, with a renewal bonus up to 460 days. VERIFIED [S18].
- **CI mechanics:** Azure Key Vault plus **AzureSignTool** with the GlobalSign timestamp service. The support article is dated 2025-12-17. VERIFIED [S19].
- **electron-builder fit:** AzureSignTool or jsign `AZUREKEYVAULT` through a hook, with an explicit `publisherName`. ASSUMED.

### 4.5 Azure Key Vault Premium / Managed HSM plus a public CA (BYO cloud HSM)

- **Key cost (Azure Retail Prices API, West Europe, 2026-09-24):** Premium HSM-protected "advanced" key (RSA-3072/4096, which code signing requires) costs **$5.00 per key per month** for the first 250 keys. Advanced key operations cost **$0.15 per 10k**. RSA-2048 is $1 per month but below the code-signing minimum. VERIFIED [S20]; the size floor is from [S1].
- **Which CAs accept it:** SSL.com accepts Azure Key Vault Premium or Managed HSM through remote attestation of a portal-created CSR, for a $500 fee. VERIFIED [S11]. GlobalSign has a Key Vault flow. VERIFIED [S19]. DigiCert and GlobalSign are also the two CAs integrated with Key Vault (secondary). ASSUMED [S21]. Managed HSM supports documented key attestation, FIPS 140-3 Level 3 (doc dated 2026-01-30). VERIFIED [S22].
- **CI mechanics:** `azure/login` with OIDC federated credentials, then AzureSignTool or jsign. No PFX and no long-lived key material in GitHub. OIDC is ASSUMED to work with these tools (standard Azure identity chain, not tested).
- **Why it may appeal:** the key lives in a Mantu-controlled Azure tenant, you can change CA at renewal, and signing costs are metered cheaply. **Why it may not:** you run the HSM, the IAM and the attestation paperwork, which is more setup than a CA-run service. ASSUMED trade-off.

### 4.6 Certum (Asseco, Poland): SimplySign cloud

- **Price (EUR net, 1 year):** Standard Code Signing in the Cloud €209; EV in the Cloud €379; token set €169 (standard) or €359 (EV); Open Source in the Cloud €49 (out of stock, and aimed at OSS developers). From 2026-02-27 validity is capped at 459 days, with free re-issues. VERIFIED [S23][S24].
- **CI:** signing needs a SimplySign login confirmed with an OTP on the mobile app. There is no official headless CI support. Community workarounds keep a session alive on a dedicated agent (VNC containers, unofficial HTTPS clients). VERIFIED that the community repos exist [S25]; how official or supported they are is ASSUMED.
- **Fit for Métis on GitHub-hosted runners:** poor, because a human OTP is needed per session. ASSUMED.

### 4.7 For comparison: Microsoft Artifact Signing (lane A has the detail)

- Basic $9.99/mo (5,000 signatures), Premium $99.99/mo (100,000), overage $0.005 per signature. VERIFIED [S20b]. Organisations in the EU, UK, **Switzerland (since 2026-07-23)** and others are eligible. VERIFIED [S26][S27]. It does not issue EV certificates. VERIFIED [S28]. electron-builder supports it natively through `azureSignOptions`. VERIFIED (code).

### 4.8 Side-by-side (for Tony's weighing, not a ranking)

| Route | Year-1 cash (approx.) | CI auth in GitHub | Windows runner needed? | electron-builder shape | Main friction |
|---|---|---|---|---|---|
| SSL.com eSigner OV | $129 cert + $20–250/mo signing tier | user/pass + TOTP secret | CKA: yes. CodeSignTool: no | cert store (CKA) or hook | per-signing metering; long-lived creds in secrets |
| DigiCert KeyLocker OV | $44/mo or $696 as displayed; quote needed | API key + client `.p12` | no | cert store (KSP) or hook | pricing clarity; 1,000 sigs/yr included |
| Sectigo + Google Cloud KMS | cert (quote) + ~$30/yr KMS | OIDC (WIF) | yes (CNG) or no (jsign) | cert store or hook | attestation paperwork; you run GCP |
| GlobalSign + Azure Key Vault | cert (quote) + ~$60/yr key | OIDC (azure/login) | no | hook | you run Azure KV; price unknown |
| SSL.com + Azure KV (BYO) | $129 + $500 attestation + ~$60/yr key | OIDC | no | hook | one-off attestation fee |
| Certum SimplySign | €209 | human OTP | yes | cert store | not headless |
| Artifact Signing (lane A) | $9.99/mo | Entra app / OIDC | yes (PS module) | `azureSignOptions` | Swiss onboarding only since 2026-07-23 |

The dollar figures come from §4.1–4.7. The ~$30/yr and ~$60/yr annualisations are my arithmetic on the monthly key prices, so they are ASSUMED.

---

## 5. electron-builder 26.15.3 integration facts (read from node_modules)

### 5.1 Three signer shapes (VERIFIED, `app-builder-lib/out/options/winOptions.d.ts`, `codeSign/*.js`)
1. **Cert-store lookup.** Set `win.signtoolOptions.certificateSha1` or `certificateSubjectName`. electron-builder finds the cert via PowerShell `Get-ChildItem Cert: -CodeSigningCert` and signs with its signtool on Windows. It also takes `publisherName` from the store subject's CN automatically. This works whenever a vendor KSP/CNG provider exposes the HSM key behind a store cert, as eSigner CKA, the DigiCert KSP and Google's KMS CNG do (vendor side ASSUMED).
2. **Custom hook.** `win.signtoolOptions.sign: "./scripts/<hook>.mjs"` is called **once per file per hash algorithm** with `{ path, hash, isNest, ... }`.
3. **`win.azureSignOptions`.** This installs the `TrustedSigning` PowerShell module and runs `Invoke-TrustedSigning`. It is Artifact Signing only, requires `publisherName`, and cannot be combined with `signtoolOptions`.

### 5.2 The `publisherName` trap (VERIFIED)
- `computedPublisherName` takes `signtoolOptions.publisherName` if set. Otherwise it takes the CN from the cert file or cert store, and otherwise it returns **null**.
- electron-updater's `NsisUpdater.verifySignature` returns success early when `app-update.yml` has no `publisherName`.
- Put together: a hook-only setup with no explicit `publisherName` ships an app that never checks update signatures. That defeats `verifyUpdateCodeSignature: true` (electron-builder.yml line 292). A hook route must set `signtoolOptions.publisherName` to the new cert's full subject DN or CN.
- electron-updater compares every DN key given, or falls back to CN only with a warning. It **also requires `Get-AuthenticodeSignature` Status == 0 (Valid)**.

### 5.3 Hash doubling and signing volume
- The default `signingHashAlgorithms` is `['sha1','sha256']` for EXE (AppX always uses sha256, MSI gets one). VERIFIED (code). Setting `['sha256']` halves the calls. Whether any supported Métis target still needs SHA-1 dual signing is UNKNOWN. It mattered for Windows 7-era verification. ASSUMED.
- Files electron-builder will sign by default are every `.exe` it copies or builds, including extraResources. For Métis that means:
  - `Metis.exe`;
  - `llama-server.exe` ×2 (cpu and vulkan);
  - managed `node.exe`;
  - `vc_redist` (already Microsoft-signed; re-signing replaces its signature, and `signExts: ["!vc_redist.x64.exe"]`-style exclusion is possible);
  - the NSIS uninstaller and installer;
  - the portable exe;
  - possibly `elevate.exe`.
- The rule is VERIFIED (winPackager `shouldSignFile`/`createTransformerForExtraFiles`, and extraResources in electron-builder.yml lines 274–284). The file count, about 9–10 files and about 18–20 signings per release on default hashes, is ASSUMED because I did not count it from a build log.

### 5.4 AppX and the Store identity
- The config has `appx.publisher: CN=Mantu` (electron-builder.yml line 308). VERIFIED.
- For a Store submission, the manifest's Identity Publisher must be the value Partner Center assigns. The page for that value is VERIFIED [S6b]. The value looks like `CN=<GUID>`, which is ASSUMED from Q&A threads [S6c].
- For sideloading, signtool requires the manifest Publisher to equal the signing cert's subject. So one AppX cannot be both Store-ready and signed with a public OV cert. That needs separate builds, or no signing for the Store AppX. ASSUMED (standard MSIX rule, not re-read today).

### 5.5 What the repo says today
- `win` has no hardcoded `publisherName`. The comment in electron-builder.yml says it is derived from the cert CN, and that the release workflow compares it to `WIN_CSC_EXPECTED_SUBJECT`. VERIFIED (lines 262–266). The lead's note that "win.publisherName is CN=Mantu" matches the **AppX** publisher and the self-signed cert's CN. It does not match a literal `win.publisherName` key.

---

## 6. Update continuity when the publisher name changes (implications)

- A public cert's CN must be the verified legal name [S1 §7.1.4.2.2]. It will not be "Mantu" unless an entity's legal name is exactly that, and none found in §1 is. VERIFIED (rule + registry) / ASSUMED (no entity named exactly "Mantu").
- Installed apps check updates against **their own** `app-update.yml` `publisherName`. An app built with the self-signed cert pins `Mantu`. A release signed as "MANTU GROUP SA" fails that check and the auto-update is refused. VERIFIED (updater code). Those same apps already reject self-signed updates on machines that don't trust the Mantu root, because Status is not Valid. VERIFIED (code). How many such installs exist is UNKNOWN.
- electron-builder accepts a **list** of publisher names. A bridge release could list both the old and new names. That only helps machines where the bridge release itself installs, meaning managed machines that trust `CN=Mantu`. Everyone else needs one manual reinstall. VERIFIED (config type supports an array) / ASSUMED (rollout effect).

---

## 7. Microsoft Store route

- The Store re-signs **MSIX/AppX** packages after certification, at no cost, and those packages get no SmartScreen prompt. VERIFIED [S4][S6].
- An **MSI/EXE** submitted to the Store is not re-signed. It must be signed with a cert that chains to a Trusted Root Program CA; self-signed is rejected. VERIFIED [S6].
- Registering a company developer account is free in the new flow. It requires a D-U-N-S number or official registry documents, a work email on the company's domain, due diligence and employment checks, with manual reviews of 2–5 business days. VERIFIED (MS Learn, updated 2026-07-17) [S6d]. Whether Mantu already has a Partner Center account is UNKNOWN. D&B has a MANTU GROUP SA profile page (search result); the DUNS number is UNKNOWN.
- This does **not** solve the GitHub-hosted Setup.exe, portable exe or electron-updater feed. Those still need a public signature. VERIFIED [S6].

---

## 8. Decision inputs for Tony (trade-offs, no verdict)

1. **Publisher entity:** MANTU GROUP SA (the group name users would see), Amaris Consulting Sàrl, or AMARIS FRANCE SAS. The choice sets the CN, the SmartScreen identity and which contracting party signs the CA subscriber agreement. Legal and brand own this.
2. **OV vs EV:** SmartScreen treats them the same since 2024 [S3–S5]. EV costs more and vets harder. It helps only where a buyer or procurement demands EV.
3. **Who runs the key:** a CA-run service (SSL.com eSigner, DigiCert KeyLocker) means less infrastructure, vendor credentials in GitHub secrets and metered signing. A Mantu-run cloud HSM (Azure Key Vault or Google KMS with an attesting CA) means OIDC with no stored secret and CA portability, but you own the HSM, IAM and attestation.
4. **Metering:** the default dual hashing roughly doubles per-signature costs. Excluding already-signed third-party exes and choosing sha256 only are levers (§5.3).
5. **Yearly renewal:** 460-day certificates mean yearly re-validation and possibly a SmartScreen reset per renewal (community-reported) [S35]. Artifact Signing ties reputation to an identity with short-lived certs. That is lane A's area and ASSUMED here.
6. **Continuity:** plan one manual reinstall for existing self-signed installs, or a two-name bridge for managed fleets (§6).
7. **Store:** optional and additive, for the AppX only (§7).

## 9. Open items (UNKNOWN)
- Firm quotes from DigiCert (how $44/mo relates to $696 for OV KeyLocker), GlobalSign and Sectigo direct.
- Whether eSigner counts each electron-builder hash pass as a separate billable signing. Likely yes, but ASSUMED.
- The exact signed-file count from a real release log (§5.3).
- Whether Mantu has a DUNS number or a Partner Center account.
- Whether any Métis target still needs SHA-1 dual signing.

---

## Sources (all seen 2026-09-24)

| Id | URL | Note |
|---|---|---|
| S1 | https://raw.githubusercontent.com/cabforum/code-signing/main/docs/CSBR.md | CSBR v3.11.0 (2026-06-16): §6.2.7.4, §6.3.2, §6.1.5, §3.2.2.1, §7.1.4.2 |
| S2 | https://cabforum.org/working-groups/code-signing/requirements/ | Version table: 3.10/CSC-31 (2025-11-07), 3.11/CSC-32 |
| S3 | https://learn.microsoft.com/en-us/security/trusted-root/program-requirements | ms.date 2026-04-28; §3.D.3 EV code signing Feb/Aug 2024; §3.B ECC unsupported |
| S4 | https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation | ms.date 2026-05-04, updated 2026-08-17 |
| S5 | https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options | ms.date 2026-08-29 |
| S6 | (same as S5) | Store MSIX re-sign vs MSI/EXE signing |
| S6b | https://learn.microsoft.com/en-us/windows/apps/publish/view-app-identity-details | Manifest identity values from Partner Center |
| S6c | https://learn.microsoft.com/en-sg/answers/questions/5924650/why-does-my-microsoft-store-msix-show-cn-guid-as-t | CN=GUID publisher (Q&A, secondary) |
| S6d | https://learn.microsoft.com/en-us/windows/apps/publish/whats-new-company-developer | Free company onboarding; D-U-N-S/docs; updated 2026-07-17 |
| S7 | https://www.ssl.com/certificates/code-signing/buy/ | OV prices, add-ons |
| S8 | https://www.ssl.com/certificates/ev-code-signing/buy/ | EV prices, add-ons |
| S9 | https://knowledge.digicert.com/general-information/new-private-key-storage-requirement-for-standard-code-signing-certificates-november-2022 | Modified 2026-04-23 |
| S10 | https://www.ssl.com/guide/esigner-pricing-for-code-signing/ | Dated 2025-09-23 |
| S11 | https://www.ssl.com/guide/supported-cloud-hsms-document-signing-ev-code-signing/ | Dated 2025-03-26 |
| S12 | https://www.ssl.com/how-to/cloud-code-signing-integration-with-github-actions/ | Dated 2022-08-04; action + secrets |
| S12b | https://www.ssl.com/how-to/how-to-integrate-esigner-cka-with-ci-cd-tools-for-automated-code-signing/ | Search snippet only |
| S13 | https://www.digicert.com/signing/code-signing-certificates | Displayed OV/EV prices |
| S14 | https://docs.digicert.com/en/digicert-keylocker/overview/licensing.html | Modified 2026-06-15 |
| S15 | https://docs.digicert.com/en/digicert-keylocker/ci-cd-integrations-and-deployment-pipelines/plugins/github/binary-signing-using-github-actions.html | Current action + secrets |
| S15b | https://github.com/digicert/code-signing-software-trust-action | Action README |
| S15c | https://docs.digicert.com/en/digicert-keylocker/ci-cd-integrations-and-deployment-pipelines/plugins/github/install-client-tools-for-standard-keypair-signing-on-github.html | Old action EoS 2026-02-01 / EoL 2026-02-28; modified 2026-01-13 |
| S16 | https://www.sectigo.com/ssl-certificates-tls/code-signing | Price quote; BYO attested HSM; 2026-02-23 yearly device |
| S16b | https://comparecheapssl.com/digicert-code-signing-certificate-price-renewal-best-deals/ | Secondary (search snippet) |
| S17 | https://dev.to/katz/building-a-cost-effective-windows-code-signing-pipeline-sectigo-google-cloud-kms-on-github-2ghf | Third-party, 2025-03-26 |
| S18 | https://shop.globalsign.com/en/code-signing | Prices not rendered; 366-day certs |
| S19 | https://support.globalsign.com/code-signing/code-signing/code-signing-azure-key-vault-and-azure-signtool | Dated 2025-12-17 |
| S20 | https://prices.azure.com/api/retail/prices (Key Vault, westeurope) | Queried 2026-09-24 |
| S20b | https://prices.azure.com/api/retail/prices (Trusted Signing) | Queried 2026-09-24 |
| S21 | https://www.fairssl.dk/en/code-signing-azure-key-vault/ | Secondary (search snippet) |
| S22 | https://raw.githubusercontent.com/MicrosoftDocs/azure-security-docs/main/articles/key-vault/managed-hsm/key-attestation.md | ms.date 2026-01-30 |
| S23 | https://shop.certum.eu/code-signing.html | EUR net prices; 459-day cap |
| S24 | https://shop.certum.eu/open-source-code-signing-on-simplysign.html | €49, 5,000 sig/month |
| S25 | https://github.com/hpvb/certum-container ; https://github.com/Le-Syl21/ssign | Community workarounds |
| S26 | https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/main/articles/artifact-signing/quickstart.md | ms.date 2026-05-21; country list incl. Switzerland |
| S27 | https://learn.microsoft.com/en-us/answers/questions/5812975/please-add-switzerland-(efta)-to-artifact-signing | MS employee: available 2026-07-23 |
| S28 | https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/main/articles/artifact-signing/faq.yml | ms.date 2026-05-14; no EV |
| S29 | https://github.com/electron-userland/electron-builder/pull/10190 | Merged 2026-09-17 |
| S30 | https://www.zefix.ch/ZefixREST/api/v1/firm/search.json and /firm/{859847,1245486,987438}.json | Swiss federal registry index |
| S31 | https://recherche-entreprises.api.gouv.fr/search?q=amaris%20france | French official company API |
| S32 | https://www.pappers.lu/company/amaris-luxembourg-sa-rl-B159033 | Secondary |
| S33 | https://mantu.com/terms-of-use | Publisher MANTU GROUP SA, Chêne-Bourg, CHE-476.382.049 |
| S34 | https://amaris.com/terms-and-conditions/ | Old Vernier address; mismatched registry no. |
| S35 | https://learn.microsoft.com/en-us/answers/questions/5900208/smartscreen-reputation-reset-following-ev-certific | Community thread, no MS staff answer in-thread |
| S36 | https://ebourg.github.io/jsign/ | jsign 7.5: AZUREKEYVAULT, TRUSTEDSIGNING, DIGICERTONE, ESIGNER, GOOGLECLOUD, AWS; exe/msi/appx/msix; cross-platform |
| Code | /Users/tony/AI-Brain-build/metis-2.0/node_modules/app-builder-lib/out/{options/winOptions.d.ts, codeSign/windowsSignToolManager.js, codeSign/windowsSignAzureManager.js, winPackager.js}; electron-updater/out/{NsisUpdater.js, windowsExecutableCodeSignatureVerifier.js}; electron-builder.yml; scripts/sign-win.mjs | Read 2026-09-24 |
