# Research lane A: Microsoft Artifact Signing (formerly Trusted Signing)

All sources seen 2026-09-24. Status tags: **VERIFIED** (primary or registry source, URL in the Sources table), **ASSUMED** (reasoned or secondary-only, not confirmed), **UNKNOWN** (couldn't establish).
This file gathers inputs and trade-offs for Tony. It doesn't pick an option, and nothing here is legal or pricing advice.

---

## 0. Summary

| # | Finding | Status |
|---|---------|--------|
| 1 | The product is now called **Artifact Signing** (Azure Artifact Signing). Microsoft renamed Trusted Signing at GA and announced it on 2026-01-12. Under the hood nothing moved: resource provider `Microsoft.CodeSigning`, endpoints `*.codesigning.azure.net`. | VERIFIED [S1][S2][S3] |
| 2 | Price: Basic USD 9.99/month (5,000 signatures, 1 cert profile per type). Premium USD 99.99/month (100,000 signatures, 10 per type). Overage USD 0.005 per signature. In CHF: 8.03 / 80.38 / 0.004. In EUR: 8.58 / 85.86 / 0.0043. Billing isn't pro-rated. | VERIFIED [S4][S5][S6] |
| 3 | Public Trust is open to organizations in the US, Canada, the EU, the UK, Australia, New Zealand, Japan, South Korea, Singapore, **Switzerland**, Norway and Israel. France and Luxembourg count as EU. Switzerland was added on **2026-07-23**. | VERIFIED [S2][S7] |
| 4 | A minimum business age (the old "3 years of tax history" rule) is **disputed**. A Microsoft-employee moderator said on 2026-08-17 that no age minimum exists. Another Q&A answer (2026-08) says 3 years is still required. It doesn't matter for the entities below, which are 11 to 19 years old. | UNKNOWN (conflicting) [S8][S9] |
| 5 | The signed files carry the **validated legal entity name** as CN and O, plus locality, state and country. Custom CN or O isn't allowed, so "CN=Mantu" can't be reproduced unless a legal entity is named exactly "Mantu". | VERIFIED [S10][S11] |
| 6 | Certificates are short-lived: renewed daily, valid 72 h. A timestamp from `http://timestamp.acs.microsoft.com` is what keeps signatures valid after that. | VERIFIED [S12][S3] |
| 7 | SmartScreen: Microsoft Learn says reputation builds up over time and first downloads can still warn. The GA blog says reputation is tied to the verified identity, not to the daily certificate. The product page and one secondary blog suggest "base" or "instant" reputation. | VERIFIED that the sources conflict [S13][S14][S3][S15][S16] |
| 8 | GitHub integration: `azure/artifact-signing-action@v2` (v2.0.0 released 2026-05-14). The old `azure/trusted-signing-action` redirects to it. OIDC is recommended; a client secret also works. The signing identity needs the **Artifact Signing Certificate Profile Signer** role. | VERIFIED [S17][S18] |
| 9 | electron-builder 26.15.3 (the latest on npm) can sign with Azure natively (`win.azureSignOptions`). It still installs the **old `TrustedSigning` PowerShell module** (last published 2025-07-11). Microsoft's current module is `ArtifactSigning` 0.1.20 (2026-09-09). | VERIFIED (code + PSGallery) [S19][S20]. Whether the old module still works: UNKNOWN |
| 10 | electron-updater compares the update's signer DN with `publisherName`. If a publisher name is configured and doesn't match, installed apps reject the update. If `publisherName` is missing from `app-update.yml`, verification is skipped silently. | VERIFIED (code) [S21] |

---

## 1. Name and GA status

- **Current name: Artifact Signing.** Azure marketing uses "Azure Artifact Signing (formerly Trusted Signing)". VERIFIED [S1][S3][S13].
- **GA:** a Microsoft Tech Community post dated **2026-01-12** announced that Trusted Signing had become Artifact Signing and gone GA. VERIFIED [S3].
- **Name history:** Azure Code Signing, then Trusted Signing (preview), then Artifact Signing (GA). ASSUMED, from a secondary source (devclass, 2026-01-14) [S22].
- **What didn't change:** provider `Microsoft.CodeSigning`, endpoints `https://<region>.codesigning.azure.net`, and the timestamp URL. VERIFIED [S2][S12].
- **What did change:** the Azure CLI extension is now `artifact-signing` (`az artifact-signing ...`) and the PowerShell cmdlets are `*-AzArtifactSigning*`. The RBAC roles were renamed from "Trusted Signing ..." to "Artifact Signing ...". VERIFIED [S2][S18].
- **Azure regions** where an account can live include West Europe (`weu`), North Europe (`neu`), **Switzerland North (`swn`)** and Poland Central (`plc`), plus US, Brazil, Japan and Korea regions. VERIFIED [S2].
- The account must be on a **paid** Azure subscription. Free, trial and sponsored subscriptions are rejected. VERIFIED [S11].
- Resources **can't be moved** across subscriptions, tenants or resource groups. A move means recreating everything, including identity validation. VERIFIED [S11]. So choose the corporate tenant and subscription from the start.

## 2. Pricing

Source: Azure Retail Prices API, service "Trusted Signing" (the API still uses the old name). Effective since 2024-06-01 and unchanged at GA. VERIFIED [S4]. The public pricing page shows the quotas but loads prices by script [S5]. The product page repeats the USD figures [S13].

| Tier | USD / month | CHF / month | EUR / month | Signatures included / month | Certificate profiles | Overage per signature |
|------|-------------|-------------|-------------|-----------------------------|----------------------|------------------------|
| Basic | 9.99 | 8.0305 | 8.5781 | 5,000 | 1 of each type | USD 0.005 / CHF 0.004 / EUR 0.0043 |
| Premium | 99.99 | 80.377 | 85.8578 | 100,000 | 10 of each type | same |

- Billing isn't pro-rated: each month is charged in full for the chosen SKU. VERIFIED [S11].
- The quota counts every signature across all certificate profiles in the account. VERIFIED [S11].
- Quota fit for Métis: electron-builder signs each PE file separately, so one release uses a few dozen signatures. Basic's 5,000/month is far above that. ASSUMED (estimate; not measured).
- "1 of each type" on Basic still allows one **Public Trust** plus one **Public Trust Test** profile (for CI dry runs). ASSUMED, from the tier wording and the list of profile types [S5][S18].
- For comparison, Microsoft's own table lists OV certificates at USD 150–300/year and EV at USD 400+/year. VERIFIED [S14].

## 3. Eligibility

### 3.1 Organizations (Public Trust)

The Learn quickstart lists the eligible countries (page updated 2026-09-18). The FAQ points to that list as the authoritative one. VERIFIED [S2][S11].

| Country / region | Public Trust (organization) | Evidence |
|---|---|---|
| **Switzerland** | Yes, since **2026-07-23** | Quickstart lists it. On the Q&A thread, a Microsoft employee posted on 2026-07-23: "Starting today Artifact Signing is available in Switzerland." VERIFIED [S2][S7] |
| **France** | Yes (EU) | VERIFIED [S2] |
| **Luxembourg** | Yes (EU) | VERIFIED [S2] |
| EU in general | Yes | VERIFIED [S2] |
| **UK** | Yes | VERIFIED [S2] |
| US, Canada, Australia, NZ, Japan, South Korea, Singapore, Norway, Israel | Yes | VERIFIED [S2] |

**Stale pages to be aware of:** two Microsoft pages still show the older list (US, Canada, EU, UK only). The Windows "code signing options" page (updated 2026-08-29) does [S14]. So did the portal banner quoted in an April 2026 Q&A [S23]. The quickstart is newer on this point and matches the Switzerland announcement. VERIFIED that the conflict exists.

**Existing customers:** in the April 2026 case, Azure support said the geographic restrictions don't apply to existing customers. VERIFIED that this was said in the Q&A [S23]. Irrelevant for Mantu, which would be a new customer.

**Nobody on the Switzerland thread had reported completing a new Swiss organization validation after 2026-07-23** as of today. VERIFIED (thread read) [S7]. First-mover risk exists. ASSUMED.

**Business history (years in operation): UNKNOWN / conflicting.**
- 2026-08-17: a Microsoft-employee moderator said Artifact Signing has no minimum organization age, only the country prerequisites. VERIFIED that this was said [S8].
- 2026-08: a separate Q&A answer, relaying what moderators had said, stated that Public Trust organization validation needs about 3 years of verifiable operating history (registry, tax records, D-U-N-S or similar). VERIFIED that this was said [S9]. A secondary blog says the 3-year rule was dropped at GA [S16].
- None of the current Learn pages (quickstart, FAQ) mention an age requirement. VERIFIED [S2][S11].
- For the Mantu candidates in §4, the question doesn't matter: all are more than 10 years old. One exception: the young "Mantu Next Gen" SAS (2024) would be exposed if the rule exists.

### 3.2 Individual developers

- Individuals must be located in the **US or Canada only**. Their Azure billing account must be of type *Individual*, and its legal name and sold-to address must match the government ID. VERIFIED [S2].
- An individual certificate shows the person's name, not Mantu's. ASSUMED consequence, based on the certificate subject coming from the validated identity [S18]. It isn't a corporate publisher option for Métis.

### 3.3 Private Trust is not a substitute

Private Trust certificates chain to a CA that isn't trusted by default in any root program or in Windows. They're meant for App Control for Business policies [S24]. On unmanaged machines they would hit the same untrusted-root problem as today's self-signed CN=Mantu certificate. VERIFIED (doc) / ASSUMED (the parallel with the current failure).

## 4. Mantu / Amaris legal entities (for the eligibility mapping)

Registry lookups were made on 2026-09-24. Personal names of officers are deliberately left out.

| Entity | Country | Registry ID | Registered since | Registered address (registry) | Role / notes | Status |
|---|---|---|---|---|---|---|
| **MANTU GROUP SA** | Switzerland (GE) | UID CHE-476.382.049 (Zefix ehraid 1245486) | Swiss entry 2015-12-10 [S27] | Place de la Gare 4, 1225 Chêne-Bourg | Group parent (holding purpose). Formerly **AMARIS GROUP SA**, renamed in April 2019. Moved its seat to Vernier from Luxembourg (formerly RCS **B168753**) around Dec 2015, then to Chêne-Bourg in 2023. | VERIFIED (Zefix) [S25]. Entry date VERIFIED on Moneyhouse (secondary) [S27] |
| **Amaris Consulting Sàrl** | Switzerland (GE) | UID CHE-113.375.102 (ehraid 859847) | 2007-01-15 [S28] | Place de la Gare 4, 1225 Chêne-Bourg | IT and consulting operating company. Its associate is MANTU GROUP SA. | VERIFIED (Zefix) [S26]. Date from Moneyhouse (secondary) [S28] |
| **AMARIS FRANCE SAS** | France | SIREN 511 199 226 | 2009-01-01 | 25 boulevard Eugène Deruelle, 69003 Lyon | IT consulting (NAF 62.02A). Mid-size company (ETI), 14 open establishments. | VERIFIED (French government registry API) [S29] |
| **AMARIS Luxembourg S.à r.l.** | Luxembourg | RCS B159033 | 2011-02-23 | 36-38 Grand-Rue, 1660 Luxembourg | IT consulting (NACE 62.200) | ASSUMED (Pappers.lu, secondary. The official LBR wasn't queried) [S30] |
| MG-AC Sàrl | Switzerland | UID CHE-348.870.811 | 2015-08-10 | Place de la Gare 4, Chêne-Bourg | Management consulting and holdings. Listed as a Mantu entity in 2022 [S31]. | ASSUMED (Moneyhouse, secondary) [S32] |
| MANTU NEXT GEN (SAS) | France | SIREN 939 939 146 | 2024-11-08 | Same Lyon address as Amaris France | Young entity. Would be exposed if the 3-year rule exists. | VERIFIED (registry) [S29]. Group membership ASSUMED (shared address) |

Other group entities in the UK (Amaris Consulting UK Ltd), Germany, Belgium, Canada and the US appear in Mantu's own 2022 list of consolidated entities. That list says the group is legally present in about fifty countries. VERIFIED as Mantu's statement at the time. Current status UNKNOWN [S31].

**How this maps to eligibility:** MANTU GROUP SA and Amaris Consulting Sàrl (Switzerland), AMARIS FRANCE SAS (France) and AMARIS Luxembourg (Luxembourg) are all in currently listed countries. VERIFIED (country list) [S2]. Which entity should appear as the publisher is **Tony's (and Mantu Legal's) decision**. Things to weigh:
- Brand recognition: "Mantu" appears in the name MANTU GROUP SA. Amaris Consulting Sàrl is the entity users would recognise as "Amaris".
- Which entity actually owns and publishes Métis: UNKNOWN. The source repo is under a personal GitHub account.
- Which entity controls a domain and mailbox usable for validation (see §5).
- Switzerland was only enabled on 2026-07-23. France, Luxembourg and the UK have been eligible since GA. VERIFIED [S7][S3].

**Possible friction to check before applying:** the amaris.com legal notice names MANTU GROUP SA as the website publisher, but it still shows the **old Vernier address** and a registry number (**CHE-276.382.049**) that doesn't match Zefix (**CHE-476.382.049**). VERIFIED, both pages seen [S33][S25]. Microsoft advises keeping public records up to date and matching the request to official registration details [S2]. Whether this mismatch would slow validation: ASSUMED risk.

## 5. Identity validation process (organization, Public Trust)

All VERIFIED from the Learn quickstart, FAQ and renewal page [S2][S11][S34] unless marked otherwise.

- **Where:** Azure portal only (not possible from the CLI).
- **Role needed:** the person filing needs the **Artifact Signing Identity Verifier** role, granted by an Owner or User Access Administrator.
- **Form fields:**
  - legal organization name
  - website URL belonging to the entity
  - **primary email on a domain the entity owns**, which must accept external mail with links. Verification links expire in **7 days**.
  - secondary email on the same domain (distribution lists allowed)
  - business identifier (for example the UID or SIREN)
  - registered address
  - first and last name of the **individual representative**, exactly as on their government ID
  - Seller ID only for Microsoft Store customers
- **Representative check:** when the request shows *Action Required*, the named representative goes through **Microsoft Entra Verified ID**. This uses the AU10TIX vendor flow with a government photo ID and a face check, and the credential ends up in Microsoft Authenticator. The link goes to the primary email.
- **Possible document requests:**
  - Business registration, charter or articles showing the name and address exactly as entered.
  - Domain registration or invoice listing the entity and every domain in the request.
  - Documents must be issued within the last 12 months, and any expiry must be at least 2 months away.
  - You get three upload attempts. If all three fail, onboarding can't continue.
- **Duration:** 1–20 business days according to the quickstart. The GA blog says most finish within a few business days [S3]. Validation can't be expedited, and filing duplicate requests doesn't help.
- **Mistakes are costly:** changing a submitted request means filing a new one. A missed email link also means starting over.
- **Validity and renewal:**
  - Renewal can start **60 days before expiry** and repeats the full review (1–20 business days).
  - If validation lapses, certificate renewal stops, and signing stops within about 3 days (the certificate lifetime).
  - Validation lasts **2 years**: ASSUMED (secondary source only) [S16].
- **Who must do what:**
  - Tony: Azure-side setup, if he gets the Identity Verifier role on a corporate subscription.
  - A Mantu representative: must agree to present their own government ID.
  - The mailbox owners on the chosen entity's domain.
  - Mantu Legal or company secretarial: registry documents.
  - Who inside Mantu is authorized to represent the entity: UNKNOWN.

## 6. Certificate subject, lifetime, chain

- **Subject:** taken from the validated identity. Example format: `CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US`. Street and postal code can be added as options. VERIFIED [S18][S2].
- **No custom CN or O.** Industry code-signing rules (CA/B Forum baseline) require CN to be the validated legal name. No OU is allowed on Public Trust profiles. VERIFIED [S11].
  - For MANTU GROUP SA, the subject would likely resemble `CN=MANTU GROUP SA, O=MANTU GROUP SA, L=Chêne-Bourg, S=Genève, C=CH`. ASSUMED: exact casing and accents only show in the portal's "Certificate subject preview" after validation.
- **No EV:** Artifact Signing doesn't issue EV certificates and Microsoft has no plan to. VERIFIED [S11].
- **Lifetime:** renewed **daily**, each certificate valid **72 hours**. Keys stay inside Microsoft-managed FIPS 140-3 Level 3 HSMs and can't be exported. VERIFIED [S12]. (devclass's "24 hours" [S22] contradicts Microsoft's own docs; the Microsoft figure is used here.)
- **Timestamping is mandatory in practice.** An RFC 3161 countersignature keeps the signature valid after the certificate expires, unless the certificate is revoked. Microsoft's TSA is `http://timestamp.acs.microsoft.com`. The action README says untimestamped signatures are only good for about 3 days. VERIFIED [S12][S17].
- **Durable identity:** each certificate carries a custom EKU `1.3.6.1.4.1.311.97.<unique>` tied to the identity validation. All Public Trust certificates also carry `1.3.6.1.4.1.311.97.1.0`. That EKU is the stable thing to pin on, not the thumbprint, which changes daily. VERIFIED [S12].
- **Chain:** Public Trust chains to **Microsoft Identity Verification Root Certificate Authority 2020**, part of the Microsoft Root Certificate Program. The PCA is **Microsoft ID Verified Code Signing PCA 2021**. Windows added support in the **July 2021 CTL update** (KB5022661). VERIFIED [S24][S11]. On up-to-date Windows, including GitHub windows-2022/2025 runners, `Get-AuthenticodeSignature` should therefore return Valid, which fixes today's UntrustedRoot. ASSUMED until a test profile run proves it.
- **Revocation:** deleting a certificate profile doesn't revoke certificates already issued. Microsoft can revoke a single day's certificate if it's abused. VERIFIED [S11][S12].

### 6.1 What this means for Métis update verification

All VERIFIED from code in `/Users/tony/AI-Brain-build/metis-2.0/node_modules` (electron-updater 6.8.9, app-builder-lib 26.15.3) [S21][S19]:
- electron-updater accepts an update only if `Get-AuthenticodeSignature` reports **Valid** (Status 0) and the signer matches a configured `publisherName`.
  - When the configured name is a DN, only the keys it contains are compared, and they must match exactly.
  - When it's a plain string, only the CN is compared, with a warning.
- The PowerShell call switches to UTF-8 (`chcp 65001`), so accented values like "Chêne-Bourg" or "Sàrl" are handled. Residual risk of an encoding mismatch: ASSUMED low. Still copy the subject exactly from a real signed file.
- If `app-update.yml` has no `publisherName`, verification is **skipped**. With `azureSignOptions`, electron-builder writes `azureSignOptions.publisherName` into `app-update.yml` (it's a required field in the typings). Leaving it out would silently disable the `verifyUpdateCodeSignature: true` protection.
- Current installs are pinned to `CN=Mantu`, per the lead's context. A grep of `electron-builder.yml` at commit 2bf21f1c found no explicit `publisherName`, so the value comes from the certificate CN.
  - Consequence: those installs will **reject** updates signed as the new legal entity. VERIFIED from the comparison logic.
  - How to bridge (a transitional build that lists both names, signed with the old certificate, vs. reinstalling) is a decision for the integration lane. ASSUMED. Such a bridge only helps on machines where the old self-signed root is trusted, because Status must be Valid.

## 7. SmartScreen reputation

- **Microsoft Learn** (SmartScreen page, updated 2026-08-17, and the FAQ):
  - Reputation builds automatically.
  - First downloads may show a prompt saying the app isn't recognized, with the verified publisher name.
  - The prompt stops once the file hash or the publisher has enough clean download history, which can take weeks and hundreds of installs.
  - Keeping a consistent signing identity lets later releases inherit reputation.
  - EV no longer bypasses SmartScreen.
  - Smart App Control on Windows 11 may block unsigned files regardless.
  VERIFIED [S15][S11].
- **Windows code-signing options page** (2026-08-29): says Artifact Signing gives no instant SmartScreen trust and behaves the same as OV. VERIFIED [S14].
- **GA blog** (2026-01-12): says signing reputation is anchored to the verified identity in Azure rather than to any single certificate. This fits the daily rotation not resetting reputation. VERIFIED that the blog says so [S3]. How SmartScreen implements it internally: UNKNOWN.
- **Product page:** claims signing provides "base reputation" on SmartScreen. VERIFIED that the page says so [S13]. A secondary blog claims instant reputation [S16]. Neither is consistent with Learn. The planning-safe reading is: expect warnings for early releases. ASSUMED.
- **Compared with today:** a self-signed certificate is treated like no signature ("Windows protected your PC"). VERIFIED [S15].

## 8. GitHub Actions integration

- **Official action:** `azure/artifact-signing-action`. Release history:
  - v1.0.0 (2026-01-14) was the rebrand from Trusted Signing and the GA baseline.
  - v2.0.0 (2026-05-14) moved to the new `ArtifactSigning` module.
  - The repo was last pushed 2026-09-21.
  - The old `Azure/trusted-signing-action` path returns HTTP 301 to the same repository.
  VERIFIED (GitHub API) [S17].
- **Runners:** Windows only: GitHub-hosted **windows-2025 and windows-2022** (so `windows-latest` works). No Windows Arm runners. Self-hosted runners need Windows 10+, PowerShell 5.1+ and .NET 8. VERIFIED [S17].
- **Authentication:** DefaultAzureCredential underneath.
  - **Recommended:** OIDC. `azure/login` with `client-id`, `tenant-id` and `subscription-id` against an Entra app or user-assigned managed identity that has a **federated credential** for the repo. The job needs `permissions: id-token: write`.
  - **Alternative:** App Registration client secret (`AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET`).
  VERIFIED [S17][S35].
  - For public repositories, Microsoft recommends **environment secrets**, which can require reviewer approval. VERIFIED [S35]. The repo `mysticalsin/AskToto-Mantu` is public per the lead's context.
  - Exact subject formats and wildcard rules for federated credentials weren't checked here: UNKNOWN. See the Entra workload identity federation docs.
- **Roles:**
  - **Artifact Signing Certificate Profile Signer** on the account, resource group or subscription, assigned to the service principal or managed identity. Required to sign; it also lets that identity view signing history.
  - **Artifact Signing Identity Verifier**, to create or manage identity validation. Portal only.
  - Standard Owner or Contributor to manage accounts and profiles. Owner or User Access Admin to assign roles.
  - The old names ("Trusted Signing Certificate Profile Signer", "Trusted Signing Identity Verifier") appear in older docs and Q&A threads.
  VERIFIED [S18][S17].
- **Action inputs:**
  - `endpoint` (regional, for example `https://weu.codesigning.azure.net/` or `https://swn.codesigning.azure.net/`)
  - `signing-account-name`
  - `certificate-profile-name`
  - files, folder or catalog
  - `file-digest`, `timestamp-rfc3161`, `timestamp-digest`
  - VERIFIED [S17][S2]
- **electron-builder native path** (`win.azureSignOptions`: `publisherName`, `endpoint`, `certificateProfileName`, `codeSigningAccountName`, plus optional digest and timestamp settings). This signs **inside** the build, so the NSIS uninstaller, the installer and the portable exe are signed before electron-builder hashes them into `latest.yml`. It can't be combined with `signtoolOptions`.
  - At run time it installs the PowerShell module `TrustedSigning` (at least 0.5.0) and calls `Invoke-TrustedSigning`. VERIFIED (code) [S19].
  - PSGallery: `TrustedSigning` is at 0.5.8, last published 2025-07-11. `ArtifactSigning` is at 0.1.20, published 2026-09-09. VERIFIED [S20].
  - Whether the old module keeps working after the rename: UNKNOWN. The endpoint and provider are unchanged, so it probably still works (ASSUMED). A run against a **Public Trust Test** profile would settle it.
- **Signing after the build with the action:** it would change file bytes after electron-builder computed `latest.yml` sha512, and it would miss binaries embedded inside the NSIS package. ASSUMED (reasoning, not tested). This is why in-build signing (azureSignOptions or a custom `sign` hook calling signtool with the Artifact Signing dlib) looks like the better fit. That choice belongs to the integration lane.
- **Other integrations:** SignTool plus the Artifact Signing dlib client, the Azure DevOps task `AzureArtifactSigning@<ver>`, PowerShell, and an SDK. Signing is by digest only: the file itself never leaves the runner. VERIFIED [S3][S11][S1].
- **Store / AppX:** MSIX submitted to the Microsoft Store is re-signed by Microsoft for free. MSI and EXE Store submissions must be signed by the publisher with a certificate from a CA in the Trusted Root Program. VERIFIED [S14]. Whether Métis's AppX target needs Artifact Signing at all depends on its channel. UNKNOWN here.

## 9. Decisions and inputs for Tony (no verdicts)

1. **Which legal entity publishes Métis.** Options: MANTU GROUP SA (CH), Amaris Consulting Sàrl (CH), AMARIS FRANCE SAS (FR) or AMARIS Luxembourg (LU). Trade-offs:
   - the brand name users will see
   - who legally owns and publishes the app
   - which domain and mailboxes can receive the validation emails
   - Switzerland has been eligible since 2026-07-23; France and Luxembourg since GA
2. **Who represents the entity.** A named person must pass the Verified ID check with their government ID. Mantu Legal or company secretarial must supply registry documents. The entity's IT team must make sure a mailbox on the entity's domain receives external links.
3. **Tenant and subscription.** Validation can't be moved later, so a Mantu corporate paid subscription is needed from the start. Who approves Azure spend: UNKNOWN.
4. **Clean-up before filing.** Fix the website legal-notice address and registry-number mismatch, or confirm Microsoft accepts registry data regardless.
5. **Tier.** Basic (USD 9.99/month) likely covers the volume. Premium only adds signature volume and more profiles.
6. **Timeline.** Budget 1–20 business days for validation, plus a test-profile CI run, plus the publisherName bridge for existing CN=Mantu installs.
7. **SmartScreen expectations.** Plan for early warnings (Learn), not instant trust (product page).

---

## Sources (all seen 2026-09-24)

| ID | Source | Notes |
|---|---|---|
| S1 | https://learn.microsoft.com/en-us/azure/artifact-signing/overview | ms.date 2026-01-02, updated 2026-08-03 |
| S2 | https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart | ms.date 2026-05-21, updated 2026-09-18. Countries, regions, IV form, CLI |
| S3 | https://techcommunity.microsoft.com/blog/microsoft-security-blog/simplifying-code-signing-for-windows-apps-artifact-signing-ga/4482789 | Published 2026-01-12. Rename and GA, 72 h certificates, reputation tied to identity |
| S4 | https://prices.azure.com/api/retail/prices (serviceName 'Trusted Signing', USD/EUR/CHF/GBP) | effectiveStartDate 2024-06-01 |
| S5 | https://azure.microsoft.com/en-us/pricing/details/artifact-signing/ | Quotas and profile counts. Prices load by script |
| S6 | FAQ billing section (see S11) | Not pro-rated, quota scope |
| S7 | https://learn.microsoft.com/en-us/answers/questions/5812975/please-add-switzerland-(efta)-to-artifact-signing | Asked 2026-03-08. Microsoft employee: available 2026-07-23 |
| S8 | https://learn.microsoft.com/en-us/answers/questions/5977141/azure-artifact-signing-trusted-signing-is-a-us-llc | 2026-08-17. Microsoft employee: no age minimum. An AI-generated answer on the same thread says 3 years |
| S9 | https://learn.microsoft.com/en-ie/answers/questions/5964352/trusted-signing-artifact-signing-organization-iden | Asked 2026-08-02. Answer relays a 3-year operating-history requirement |
| S10 | https://learn.microsoft.com/en-us/azure/artifact-signing/concept-resources-roles (subject DN example) | Same as S18 |
| S11 | https://learn.microsoft.com/en-us/azure/artifact-signing/faq | ms.date 2026-05-14, updated 2026-08-14 |
| S12 | https://learn.microsoft.com/en-us/azure/artifact-signing/concept-certificate-management | updated 2026-08-06. 72 h, daily renewal, EKU, TSA |
| S13 | https://azure.microsoft.com/en-us/products/artifact-signing | USD prices, "base reputation" claim |
| S14 | https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options | ms.date 2026-08-29. Older country list, comparison table |
| S15 | https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation | updated 2026-08-17 |
| S16 | https://melatonin.dev/blog/code-signing-on-windows-with-azure-trusted-signing/ | Secondary, header dated 2026-06-19. 2-year IV expiry, "instant reputation" claim |
| S17 | https://github.com/Azure/artifact-signing-action (README, docs/OIDC.md, releases via api.github.com) | v2.0.0 2026-05-14, v1.0.0 2026-01-14 |
| S18 | https://learn.microsoft.com/en-us/azure/artifact-signing/concept-resources-roles | updated 2026-08-03. Roles and profile types |
| S19 | Local: /Users/tony/AI-Brain-build/metis-2.0/node_modules/app-builder-lib/out/codeSign/windowsSignAzureManager.js and out/options/winOptions.d.ts (v26.15.3). npm latest = 26.15.3 | Code read |
| S20 | https://www.powershellgallery.com/api/v2 (FindPackagesById TrustedSigning / ArtifactSigning) | Versions and dates |
| S21 | Local: node_modules/electron-updater/out/windowsExecutableCodeSignatureVerifier.js and NsisUpdater.js (v6.8.9) | Code read |
| S22 | https://www.devclass.com/security/2026/01/14/code-signing-windows-apps-may-be-easier-and-more-secure-with-new-azure-artifact-service/4079554 | Secondary, 2026-01-14 |
| S23 | https://learn.microsoft.com/en-us/answers/questions/5859082/artifact-signing-stopped-working | 2026-04-14 to 04-22. Old country banner. Existing customers exempt |
| S24 | https://learn.microsoft.com/en-us/azure/artifact-signing/concept-trust-models | updated 2026-08-03. Root CA, Private Trust not default-trusted |
| S25 | https://www.zefix.ch/ZefixREST/api/v1/firm/1245486.json (MANTU GROUP SA) | Swiss federal registry index. SOGC publications 2016–2025 |
| S26 | https://www.zefix.ch/ZefixREST/api/v1/firm/859847.json (Amaris Consulting Sàrl) | Same |
| S27 | https://www.moneyhouse.ch/en/company/mantu-group-sa-13815325491 | Secondary. Entry date 2015-12-10 |
| S28 | https://www.moneyhouse.ch/en/company/amaris-consulting-sarl-4894409391 | Secondary. Entry date 2007-01-15 |
| S29 | https://recherche-entreprises.api.gouv.fr/search (SIREN 511199226, 939939146) | French government registry API |
| S30 | https://www.pappers.lu/company/amaris-luxembourg-sa-rl-B159033 | Secondary. The official LBR wasn't queried |
| S31 | https://mantu.com/static/f/337611/x/ac84fc3476/230712-sustainability-report-2022-appendix.pdf | Mantu's 2022 list of consolidated entities |
| S32 | https://www.moneyhouse.ch/en/company/mg-ac-sarl-14096358061 | Secondary |
| S33 | https://amaris.com/terms-and-conditions/ | Website publisher legal notice (old address and registry number) |
| S34 | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-renew-identity-validation | updated 2026-09-23 |
| S35 | https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect | updated 2026-01-21 |
