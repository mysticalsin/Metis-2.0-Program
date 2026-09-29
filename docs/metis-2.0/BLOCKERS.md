# Métis 2.0: external and owner blockers

| Field | Value |
|---|---|
| Date | 2026-09-26; days-waiting refreshed 2026-09-28 (M2-0012) |
| Rows | 47 blocking tickets (every ledger ticket with an `external_blocker`) plus B-48, an owner action with no gated ticket of its own (one row per external owner role appears in §2; B-48 is the OneDrive repair), grouped by owner role |
| Rules | Owners are **roles**, never guessed names; the program owner names the person for each role (M2-0012). No emails, account IDs, tokens or tenant IDs appear here. Requests are drafted for the owner to send; nothing is sent automatically |
| Needed by | Earliest dependent start minus lead time. Days waiting = today − raised on (all raised 2026-09-26; 2 as of 2026-09-28, DERIVED; recompute at each weekly slot and train gate) |
| Requests | One send-ready draft per external role in [owner-requests/](owner-requests/) (NOT SENT; the owner sends them and names the person for each role). Each carries the exact unblock step, needed-by and the tickets it gates |
| Downstream | Transitive dependents in the ledger (DERIVED). A downstream ticket keeps working while a blocker is open, but closes only as ENGINEERING_COMPLETE until the block clears (see PLAN.md §8) |

## 1. Start now (sorted by needed-by)

| B | Needed by | Owner role | Exact unblock step | Ticket |
|---|---|---|---|---|
| B-01 | 09-27 | Program owner (Tony) | Run the two commands in docs/metis-2.0/runbooks/orphan-cleanup.md on the Mac on day 1, paste the before/after census into the ticket, and optionally apply the 'Always keep on this device' step | 0010 |
| B-02 | 09-28 | Program owner (Tony) | Book the weekly 30-minute decision slot (first slot held by 10-02); answer D-1 (reversible: it takes its default on 09-30 if unanswered, labelled ASSUMED); name a person for each external role in BLOCKERS.md and send the drafted requests in docs/metis-2.0/owner-requests/. D-28, D-9, D-4, D-11, D-12 and D-13 are already answered (DECISIONS.md §D) | 0012 |
| B-03 | 09-29 | Program owner (Tony) / Mantu IT | (1) By 2026-09-29 create a standard macOS user (for example 'metis-qa') on the owner's Mac or another Mac or VM, with no Métis install and no owner cloud sign-in; sign it into a dedicated test OneDrive or iCloud Drive account (a personal test Microsoft account or test Apple ID is enough); give the agent runner shell access to that user only. (2) Name a managed Windows 11 x64 laptop with the standard enterprise image (EDR, OneDrive Files On-Demand), available by 2026-10-01. (3) Export the allowlisted non-content settings keys listed in docs/metis-2.0/runbooks/qa-host.md for the representative profile | 0007 |
| B-04 | 09-30 | OpenAI Codex CLI quota (tool account holder: program owner) | After 2026-09-29 19:33 run the read-only Codex review of docs/metis-2.0/PLAN.md and ledger/tickets.json; the ChatGPT audit proceeds now | 0023 |
| B-05 | 09-30 | Program owner (Tony) | On the QA account run scripts/qa/make-qa-identity.sh to create the stable QA signing identity (self-signed code-signing certificate, or an Apple Development certificate if an Apple ID is available) and store it with `gh secret set QA_MAC_SIGNING`; agents never handle the private key | 0187 |
| B-06 | 10-01 | Mantu IT (role; person to be named by the program owner) | Provide the managed Windows 11 x64 laptop named in M2-0007 (standard enterprise image with EDR and OneDrive Files On-Demand) and remote access for the QA runner | 0195 |
| B-07 | 10-02 | Program owner (Tony) | Read docs/metis-2.0/POLICY-2.0.md (one page) and answer D-4, D-11 and D-12 in your own words | 0189 |
| B-48 | 10-04 | Program owner (Tony) | Repair the owner-side OneDrive File Provider (6 of 59 files fail to hydrate with ETIMEDOUT) and record how many still fail; details in §2 | 0008, 0191 |
| B-08 | 10-04 | Program owner (Tony) | Review the 1.9.7 evidence record, install the candidate bytes (sha256 in the lane provenance file) on the owner Mac, and approve promotion of those same bytes with the promote workflow (no rebuild; agents never push tags) | 0046 |
| B-09 | 10-05 | Program owner (Tony) | Name the promised refactoring skill and its location/version (MASTER section 2.5), or confirm in writing that software-architecture-engineer v1.4.0 plus Stark v9.3.0 substitute for it | 0059 |
| B-10 | 10-09 | Program owner (Tony) | Authorize read-only `wrangler deployments list` and one `wrangler d1 execute <db> --command "SELECT name FROM sqlite_master"` against production Operator (run by the owner or with a scoped read-only token); the merge-or-revert answer is decision D-8 | 0014 |
| B-11 | 10-09 | Program owner (Tony) + Mantu procurement | Approve the budget for the Microsoft Artifact Signing (Public Trust) route decided on 2026-09-24, complete publisher identity validation for the recorded entity (1-20 business days), then add the signer credentials to the release environment secrets | 0058 |
| B-12 | 10-09 | Program owner (Tony) | Approve or reorder the degrade order in DECISIONS.md D-14 | 0197 |
| B-13 | 10-09 | Program owner (Tony) | Use 1.9.7 as the daily build for five days and paste the tray 'Copy diagnostics summary' output into the ticket on day five | 0198 |
| B-14 | 10-12 | Cloudflare account owner (Mantu IT; person to be named by program owner) | Confirm the Workers AI @cf/deepgram/nova-3 entitlement and data-use terms on the Mantu Cloudflare account and provide a read-only readback of the AI Gateway log/cache settings | 0102 |
| B-15 | 10-12 | Program owner (Tony) | Approve the hosting platform, region and managed Postgres+vector choice for the knowledge/memory service (decision D-5) and name an operational owner | 0119 |
| B-16 | 10-12 | Program owner (Tony) | Select the canonical knowledge store (current .brain on OneDrive, an approved M365 location, or the service database) and the plaintext-mirror sharing boundary (decision D-6) | 0120 |
| B-17 | 10-12 | Entra tenant administrator (role; person to be named by program owner) | Register the Métis applications in the Mantu Entra tenant with the documented audiences and scopes, grant admin consent, and place tenant and client IDs in the Operator vault | 0121 |

## 2. All blockers by owner role

### Program owner (Tony)

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-01 | 0010: Give the owner a safe one-off cleanup for today's orphaned llama-server processes | Run the two commands in docs/metis-2.0/runbooks/orphan-cleanup.md on the Mac on day 1, paste the before/after census into the ticket, and optionally apply the 'Always keep on this device' step | 2026-09-27 | 2026-09-26 | 2 | 13 / 120 | The orphans stay until reboot; no release impact |
| B-02 | 0012: Issue the owner decision packet and start every external unblock request on day one | Book the weekly 30-minute decision slot (first slot held by 2026-10-02); answer D-1 (defaults on 2026-09-30 if unanswered, labelled ASSUMED); name a person for each external role in BLOCKERS.md and send the drafted requests in docs/metis-2.0/owner-requests/. D-28, D-9, D-4, D-11, D-12 and D-13 are answered and removed from this row | 2026-09-28 | 2026-09-26 | 2 | 16 / 133 | Reversible decisions take their defaults at needed-by; escalated ones stay open |
| B-05 | 0187: Build each candidate once, test those exact bytes and promote the same bytes (QA-candidate and owner-channel prerelease lane) | On the QA account run scripts/qa/make-qa-identity.sh to create the stable QA signing identity (self-signed code-signing certificate, or an Apple Development certificate if an Apple ID is available) and store it with `gh secret set QA_MAC_SIGNING`; agents never handle the private key | 2026-09-30 | 2026-09-26 | 2 | 129 / 1602 | Ad-hoc signed candidates; TCC grants re-applied per candidate by the runbook |
| B-07 | 0189: Get the one-page policy approval: entitlement authority (C-03/C-08/C-16), gateway log policy (C-18), default speech route and the no-content-retention wording | Read docs/metis-2.0/POLICY-2.0.md (one page) and answer D-4, D-11 and D-12 in your own words | 2026-10-02 | 2026-09-26 | 2 | 14 / 128 | D-4/D-11/D-12 defaults labelled ASSUMED; release claims wait |
| B-08 | 0046: Qualify and release 1.9.7 from the tested artifact only, with explicit residual risks | Review the 1.9.7 evidence record, install the candidate bytes (sha256 in the lane provenance file) on the owner Mac, and approve promotion of those same bytes with the promote workflow (no rebuild; agents never push tags) | 2026-10-04 | 2026-09-26 | 2 | 127 / 1586 | Candidate stays unpromoted; the owner keeps 1.9.6 |
| B-09 | 0059: Govern the refactor as bounded strangler slices and record the supplied refactoring skill (TASK-061) | Name the promised refactoring skill and its location/version (MASTER section 2.5), or confirm in writing that software-architecture-engineer v1.4.0 plus Stark v9.3.0 substitute for it | 2026-10-05 | 2026-09-26 | 2 | 13 / 120 | D-15 default (SAE + Stark) applies on 10-05 |
| B-10 | 0014: Audit Operator production reality: deployed version, off-main ACCESS-bypass commits, D1 schema and data scripts | Authorize read-only `wrangler deployments list` and one `wrangler d1 execute <db> --command "SELECT name FROM sqlite_master"` against production Operator (run by the owner or with a scoped read-only token); the merge-or-revert answer is decision D-8 | 2026-10-09 | 2026-09-26 | 2 | 46 / 564 | Staging and the /v1/decide reconcile proceed from source; D1 drift stays UNKNOWN |
| B-12 | 0197: Measure delivery velocity, re-forecast at each gate and record the owner-approved degrade order | Approve or reorder the degrade order in DECISIONS.md D-14 | 2026-10-09 | 2026-09-26 | 2 | 13 / 120 | D-14 default degrade order applies on 10-09 |
| B-13 | 0198: Hold the 1.9.7 five-day owner soak checkpoint before any W3 change moves or edits the code 1.9.7 fixed | Use 1.9.7 as the daily build for five days and paste the tray 'Copy diagnostics summary' output into the ticket on day five | 2026-10-09 | 2026-09-26 | 2 | 125 / 1581 | W3 changes to 1.9.7-fixed code wait |
| B-15 | 0119: Decide and scaffold the server intelligence plane: hosting, region, managed Postgres and a local compose profile (ADR-014) | Approve the hosting platform, region and managed Postgres+vector choice for the knowledge/memory service (decision D-5) and name an operational owner | 2026-10-12 | 2026-09-26 | 2 | 36 / 455 | Local compose profile; live deployment BLOCKED |
| B-16 | 0120: Lock canonical knowledge, provenance and storage authority (TASK-007) | Select the canonical knowledge store (current .brain on OneDrive, an approved M365 location, or the service database) and the plaintext-mirror sharing boundary (decision D-6) | 2026-10-12 | 2026-09-26 | 2 | 41 / 526 | Engineering behind the knowledge API contract; live store BLOCKED |
| B-18 | 0016: Lock the full PRD, threat model and coverage map (TASK-002) after the one-page policy approval; gates no other ticket | Approve prd-lock.md v1.0 (it gates no ticket; the policy answers already come from M2-0189) | 2026-10-18 | 2026-09-26 | 2 | 13 / 120 | Gates nothing |
| B-24 | 0199: Close the owner's bugs only on owner-machine evidence: 10 working days with zero stalls over 5 s, zero orphans after unclean exits and zero reveal no-ops | Keep the owner-channel build as the daily build for 10 working days, paste the diagnostics summary at the end, and accept or reject the closure in writing | 2026-10-19 | 2026-09-26 | 2 | 13 / 120 | B1 stays 'fixed for the DERIVED cause' |
| B-25 | 0206: Owner-channel build T1 (version 1.9.9) at the m5 exit: journal dual-write, meetings index, ledger expand and switch, and the deferred 1.9.x fixes | Install the promoted bytes on the owner Mac and keep them as the daily build | 2026-10-19 | 2026-09-26 | 2 | 18 / 162 | Train unpromoted; the ledger contract clock does not start |
| B-28 | 0146: Decide the entitlement authority and implement licensing precedence (ADR-016) | Answer C-03, C-08 and C-16 (Operator seat vs license-server entitlement authority), state whether the Fly.io license server is kept or deprecated, and grant read-only Fly.io access if kept | 2026-10-26 | 2026-09-26 | 2 | 13 / 120 | Precedence implemented on the D-4 default, labelled ASSUMED |
| B-35 | 0207: Owner-channel build T2 at the m6 exit: interaction core behind flags | Install the promoted bytes on the owner Mac and keep them as the daily build | 2026-11-02 | 2026-09-26 | 2 | 15 / 136 | Train unpromoted |
| B-36 | 0138: Execute the Hindsight live proof A-H with two real test identities | Approve the hosting environment (decision D-5) and provide two synthetic test identities in the Entra tenant for the memory proof | 2026-11-05 | 2026-09-26 | 2 | 13 / 120 | Live proof A–H stays BLOCKED with the local evidence recorded |
| B-37 | 0160: Repair onboarding and migration: privacy-ready Cloudflare setup, optional non-blocking downloads and the Tony welcome slot (TASK-027.B, OBU-01..05) | Supply the recorded welcome video with captions, or confirm the text-led welcome ships as final (OBU-02) | 2026-11-08 | 2026-09-26 | 2 | 15 / 152 | D-20 default: the text-led welcome ships |
| B-38 | 0185: Run the pre-registered competitive and operational qualification against legitimate competitor trials (EXP-12) | Approve the pre-registered slice list and the competitor products to compare (candidates from the kit references R81..R85), and provide legitimate trial or paid accounts used under each vendor's terms; any product without one is recorded BLOCKED | 2026-11-08 | 2026-09-26 | 2 | 2 / 16 | Products without legitimate accounts recorded BLOCKED |
| B-40 | 0209: Owner-channel build T3 at the m7 exit: speech broker, Cloudflare realtime path and segment revision | Install the promoted bytes on the owner Mac and keep them as the daily build | 2026-11-09 | 2026-09-26 | 2 | 13 / 120 | Train unpromoted |
| B-42 | 0210: Freeze 2.0 features on 2026-11-15 and qualify rc1 with a 72 h owner soak | Approve each DEFERRED item, install rc1 and use it for 72 h | 2026-11-15 | 2026-09-26 | 2 | 12 / 112 | No freeze; the candidate cannot be frozen |
| B-45 | 0174: Verify and publish the already-signed Windows candidate without rebuilding (TASK-064) | Approve publication; the promote workflow publishes the signed, frozen bytes and creates the v2.0.0 tag without rebuilding (agents never push tags) | 2026-11-24 | 2026-09-26 | 2 | 2 / 16 | Signed bytes stay unpublished |
| B-46 | 0182: Review every render frame by frame against LFAC-01..12 and hand off privacy-safe masters | Approve the release claims (release_claims_approved) and the final masters | 2026-11-24 | 2026-09-26 | 2 | 2 / 16 | Unapproved claims cut or labelled concept |
| B-47 | 0184: Obtain Opus final program validation and the owner's sign-off on the installed 2.0 build | Install the frozen 2.0 candidate on the owner Mac, walk the acceptance checklist and record sign-off in docs/metis-2.0/SIGNOFF.md | 2026-11-30 | 2026-09-26 | 2 | 0 / 0 | No sign-off |
| B-48 | 0008 / 0191 / 0015: OneDrive File Provider repair (owner action, no ticket of its own; raised by M2-0012) | Repair the owner-side OneDrive File Provider: 6 of 59 files fail to hydrate with ETIMEDOUT (PROVIDED by the M2-0012 ticket, finding RUNTIME-ONEDRIVE-HYDRATION; not re-measured here, so the current count is UNKNOWN). Steps: in Finder or Files On-Demand choose 'Always keep on this device' for the affected folder, or pause and resume OneDrive sync, or reset OneDrive; then re-open the 6 files and record how many still fail. Agents never repair or delete OneDrive content (D-21) | 2026-10-04 | 2026-09-28 | 0 | shares the M2-0008 / M2-0191 fixtures | Owner-machine hydration evidence stays partly unmeasured; CI OS-level slow-file fixtures (M2-0008, M2-0191) proceed |

### Program owner with Mantu IT or procurement

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-03 | 0007: Provision the isolated macOS QA environment and the Windows test lanes for packaged tests | (1) By 2026-09-29 create a standard macOS user (for example 'metis-qa') on the owner's Mac or another Mac or VM, with no Métis install and no owner cloud sign-in; sign it into a dedicated test OneDrive or iCloud Drive account (a personal test Microsoft account or test Apple ID is enough); give the agent runner shell access to that user only. (2) Name a managed Windows 11 x64 laptop with the standard enterprise image (EDR, OneDrive Files On-Demand), available by 2026-10-01. (3) Export the allowlisted non-content settings keys listed in docs/metis-2.0/runbooks/qa-host.md for the representative profile | 2026-09-29 | 2026-09-26 | 2 | 140 / 1707 | Nothing packaged runs; tickets reach ENGINEERING_COMPLETE only. Never the owner's primary account |
| B-11 | 0058: Procure and wire the Windows code-signing identity and timestamp service into the release pipeline | Approve the budget for the Microsoft Artifact Signing (Public Trust) route decided on 2026-09-24, complete publisher identity validation for the recorded entity (1-20 business days), then add the signer credentials to the release environment secrets | 2026-10-09 | 2026-09-26 | 2 | 14 / 134 | D-29: Windows ships as an explicitly BLOCKED unsigned candidate |
| B-34 | 0165: Qualify optional local packs on actual device classes (TASK-059) | Name representative eligible device classes (for example 8 GB and 16 GB Apple silicon Macs and one Windows x64 laptop with and without a GPU) and make them available to the QA runner | 2026-11-02 | 2026-09-26 | 2 | 13 / 120 | Qualification on the available QA hosts only; other classes BLOCKED |
| B-39 | 0170: Run the real cross-platform Cloudflare-to-action-to-portal journeys on packaged clients (TASK-056) | Staging backend (cf-staging), the Jev key (decide-route) and both QA lanes must be provisioned; steps depending on them stay BLOCKED with the engineering evidence recorded | 2026-11-09 | 2026-09-26 | 2 | 13 / 120 | Journeys run to the first blocked hop; the rest recorded BLOCKED |
| B-44 | 0211: Sign the frozen Windows candidate with the provisioned identity, verify signatures and timestamps, and re-run the Windows smoke on the signed bytes (split from M2-0173) | The Microsoft Artifact Signing identity from M2-0058 exists in the release environment secrets | 2026-11-18 | 2026-09-26 | 2 | 3 / 22 | D-29 applies |

### Mantu IT

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-06 | 0195: Record the Windows 1.9.6 baseline on a managed Windows 11 laptop: freeze, heaviness, orphaned sidecars and OneDrive placeholders | Provide the managed Windows 11 x64 laptop named in M2-0007 (standard enterprise image with EDR and OneDrive Files On-Demand) and remote access for the QA runner | 2026-10-01 | 2026-09-26 | 2 | 13 / 120 | Windows findings arrive later; 1.9.7 states Windows as an unverified residual |

### Cloudflare account owner

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-14 | 0102: Qualify the exact Cloudflare speech hosting and privacy route (TASK-011) | Confirm the Workers AI @cf/deepgram/nova-3 entitlement and data-use terms on the Mantu Cloudflare account and provide a read-only readback of the AI Gateway log/cache settings | 2026-10-12 | 2026-09-26 | 2 | 33 / 400 | Engineering proceeds; the live speech route stays BLOCKED |
| B-19 | 0103: Provision the isolated Operator staging Worker and D1 with least-privilege server credentials (TASK-012) | Authorize creation of a staging Worker and D1 database on the Mantu Cloudflare account (or grant a scoped API token limited to them); the agent then fills operator/wrangler.jsonc | 2026-10-18 | 2026-09-26 | 2 | 44 / 553 | Local miniflare contract tests; the live chain stays BLOCKED |
| B-29 | 0162: Provision signed manifests and R2 asset delivery under one capability manifest (TASK-023) | Authorize an R2 bucket for immutable reviewed assets and place the manifest-signing trusted root in the Operator vault | 2026-10-26 | 2026-09-26 | 2 | 21 / 246 | Manifest signing tested locally; R2 delivery BLOCKED |
| B-33 | 0159: Exercise production operations, staging and recovery: restore drills, drift alarms, kill switches and rotation runbooks (TASK-062) | Authorize an isolated D1 restore drill on the staging database using D1 Time Travel and approve the capability kill-switch names | 2026-11-02 | 2026-09-26 | 2 | 13 / 120 | Drills scripted and run locally; staging drill BLOCKED |

### Microsoft 365 tenant roles (Entra, Teams, Azure)

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-17 | 0121: Establish cross-surface Entra and service identity (TASK-006) | Register the Métis applications in the Mantu Entra tenant with the documented audiences and scopes, grant admin consent, and place tenant and client IDs in the Operator vault | 2026-10-12 | 2026-09-26 | 2 | 41 / 532 | Mock issuer in tests; live SSO BLOCKED |
| B-21 | 0151: Qualify Teams, Zoom and Meet APIs, capture permissions and legal prerequisites (TASK-010) | Confirm the Teams app policy, Graph actual-start event eligibility, Azure subscription and calling-media SDK approval, and the recording-status/derived-data restriction for the Mantu tenant | 2026-10-19 | 2026-09-26 | 2 | 19 / 214 | Qualification recorded as BLOCKED with the exact tenant checks |
| B-22 | 0155: Build the Teams media receiver and connect consent-aware media to Cloudflare speech (TASK-049/050) | Provide an Azure subscription and obtain Microsoft application-hosted media approval; until then live bot media stays BLOCKED and post-meeting transcript alternatives ship | 2026-10-19 | 2026-09-26 | 2 | 14 / 136 | Post-meeting transcript and desktop capture ship; live bot media BLOCKED (D-22) |
| B-31 | 0152: Build the Teams personal tab and meeting side panel with SSO behind a flag (TASK-046) | Allow custom app upload of the Métis Teams package in the Mantu tenant (Teams admin center) for a pilot group | 2026-11-02 | 2026-09-26 | 2 | 18 / 204 | Teams package built behind a flag; pilot upload BLOCKED |
| B-32 | 0153: Implement enrolled meeting discovery and actual-start events (TASK-047) | Grant the Métis service principal Graph permissions for calendar and online-meeting change notifications in the pilot scope | 2026-11-02 | 2026-09-26 | 2 | 17 / 188 | Discovery built against fakes; live notifications BLOCKED |
| B-43 | 0176: Prove the full meeting to knowledge to Dust to skill to portal journey (TASK-055) | Provide a permitted Teams test meeting, the Dust workspace connection and two test identities; otherwise the live chain stays BLOCKED with the synthetic-journey evidence recorded | 2026-11-16 | 2026-09-26 | 2 | 3 / 32 | Synthetic-journey evidence recorded; live chain BLOCKED |

### Decision-service vendors (Jev, Laya)

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-20 | 0123: Add the Operator /v1/decide route with the Jev vendor secret held in the Operator vault | Provision the Jev API key into the staging Operator vault, confirm the jev-1.13.0 model pin on the vendor account, and supply the Metis-Jev-Integration-Plan (R73) if it exists | 2026-10-19 | 2026-09-26 | 2 | 16 / 161 | Route built and contract-tested; live Jev calls BLOCKED |
| B-26 | 0124: Qualify the Laya alternative behind /v1/decide without any Jev dependency (TASK-032) | Confirm the Laya source and checkpoint licence and approve the hosting environment (platform from D-5); until then Laya shows 'unavailable' and never routes to Jev | 2026-10-26 | 2026-09-26 | 2 | 13 / 120 | Only the 'unavailable' state and the isolation test are built |

### Dust workspace administrator

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-27 | 0128: Deploy and connect the Dust knowledge read tools over remote MCP (TASK-038) | Approve the Dust workspace connection for the knowledge.* remote MCP server (personal OAuth or a scoped service identity), its region/callbacks and retention | 2026-10-26 | 2026-09-26 | 2 | 22 / 244 | Read tools built against a contract fake; live Dust BLOCKED |

### Privacy/legal owner (DPO)

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-30 | 0150: Complete governance, subject rights and sharing qualification and add the multi-seat/Teams compliance track (TASK-058) | Review the second-track compliance draft (multi-seat and Teams attendance) and sign the DPIA and controller/processor determination | 2026-11-02 | 2026-09-26 | 2 | 13 / 120 | Controls implemented; governance sign-off BLOCKED |

### Zoom and Google Workspace administrators

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-23 | 0156: Qualify post-meeting Microsoft transcript access and Zoom/Meet adapters (TASK-051) | Enroll in the Zoom RTMS and Google Meet Media API developer programs. Until then the adapters stay behind capability flags and the in-app capability matrix shows Zoom and Meet as BLOCKED (UC-111); declaring them out of scope would need an owner-approved change to GOAL.json out_of_scope, which today lists only Apple public signing | 2026-10-19 | 2026-09-26 | 2 | 13 / 120 | Adapters stay behind flags; capability matrix shows BLOCKED (UC-111) |

### Apple Developer account holder

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-41 | 0175: Finalize native Mac QA and record the Apple publication decision as out of scope (TASK-065) | Apple public signing and notarization are excluded by owner decision (GOAL.json out_of_scope, 2026-09-26; see M2-0186), so the public DMG stays HELD. For PCC, the Apple Developer account holder confirms under Apple's current eligibility rules (R10) whether the development-signed QA candidate can hold the PCC managed entitlement and, if so, requests it; if PCC requires public or App Store distribution signing, record it as inheriting the M2-0186 exclusion | 2026-11-15 | 2026-09-26 | 2 | 2 / 16 | Public DMG stays HELD (out of scope); PCC recorded UNKNOWN/BLOCKED |

### Tooling

| B | Ticket | Exact unblock step | Needed by | Raised | Days waiting | Downstream (tickets / h) | While blocked |
|---|---|---|---|---|---|---|---|
| B-04 | 0023: Run independent audits of the plan and ledger: ChatGPT now, Codex after its quota resets | After 2026-09-29 19:33 run the read-only Codex review of docs/metis-2.0/PLAN.md and ledger/tickets.json; the ChatGPT audit proceeds now | 2026-09-30 | 2026-09-26 | 2 | 13 / 120 | ChatGPT audits proceed; Codex review after 09-29 19:33 |

## 3. Escalated owner decisions (never auto-applied)

These are decisions, not blockers: work proceeds on the default labelled ASSUMED and only the release claim waits. Details in [DECISIONS.md](DECISIONS.md).

| Decision | Class | Needed by | Affected tickets |
|---|---|---|---|
| D-3: How does the local crash-recovery journal behave under managed or enterprise retention profiles? | escalate: legal-privacy | 2026-10-09 | 0066, 0097, 0098 |
| D-4: Which system is the 2.0 entitlement authority, and what is the licensing precedence (C-03, C-08, C-16)? | escalate: spend (commercial) | 2026-10-02 | 0106, 0146, 0189 |
| D-5: Where does the server intelligence plane run: container platform, region, managed Postgres with vector, the pinned Hindsight release, and Laya hosting? | escalate: spend | 2026-10-12 | 0119, 0124, 0125, 0133, 0138 |
| D-6: What is the canonical knowledge store (TASK-007) and the plaintext-mirror sharing boundary? | escalate: irreversible (data placement) | 2026-10-12 | 0120, 0125 |
| D-8: The production Operator runs an off-main build (three commits including an ACCESS bypass at /v1/decide): merge through a reviewed PR with a security review, or revert? | escalate: security | 2026-10-19 | 0014, 0103, 0123, 0145, 0159 |
| D-11: What is the fresh-install default speech route? | escalate: legal-privacy | 2026-10-02 | 0064, 0102, 0107, 0112, 0160, 0189 |
| D-12: What exactly does the no-content-retention claim say, and what is the AI Gateway log policy (C-18)? | escalate: legal-privacy | 2026-10-02 | 0102, 0104, 0149, 0178, 0189 |
| D-13: How are 1.9.7 and the owner-channel trains published? | escalate: security (unsigned public binaries) | 2026-10-03 | 0046, 0053, 0187, 0206, 0207, 0209, 0210 |
| D-22: Does 2.0 commit to live Teams raw-media capture? | escalate: spend | 2026-10-19 | 0155 |
| D-26: Which competitor products are compared, with which legitimate accounts? | escalate: spend | 2026-11-08 | 0185 |
| D-27: Which launch-film claims are approved (release_claims_approved)? | escalate: legal-privacy | 2026-11-24 | 0178, 0182, 0213 |
| D-28: May agents run test commands on the owner's account, and under which sandbox policy? | escalate: owner-config | 2026-09-28 | 0190 |

## 3a. M2-0012 steps that stay outside the autopilot

| Step | Label | Who |
|---|---|---|
| Book the fixed weekly 30-minute decision slot; hold the first slot by 2026-10-02 (mechanics in DECISIONS.md §F) | BLOCKED_EXTERNAL (needs the owner's calendar) | Program owner |
| Name a person for each external owner role in §2 | BLOCKED_EXTERNAL | Program owner |
| Send the drafts in [owner-requests/](owner-requests/) (none is sent automatically) | BLOCKED_EXTERNAL | Program owner |
| Repair the OneDrive File Provider (B-48) | BLOCKED_EXTERNAL | Program owner |

LEAD_ACTION: after the first slot (by 2026-10-02), copy each answer into the affected tickets and `_relay/HANDOFF.md`, and set M2-0012 `status`/evidence in `ledger/tickets.json` (the lead alone edits the ledger).
LEAD_ACTION: run `node docs/metis-2.0/tools/trace/build-traceability.mjs --check` and its `node --test` run through the private `traceability.yml` workflow_dispatch, then file the CI artifact as the evidence record. The workflow header says the private-repo Actions budget is exhausted, so until the owner raises it the proof falls back to the independent Opus review.
LEAD_ACTION: at each train gate re-check that the slot is still booked, recompute the days-waiting column and drop rows whose owner has acted.

## 4. Crosswalk from the previous attempt's 29 blockers

| Prior # | Prior blocker | Now |
|---|---|---|
| 1 | TASK-005 contracts design-only | Engineering in M2-0061..0064; decisions via D-4/D-11 (no longer a blocker) |
| 2 | Tenant and provider owners unnamed | Owner names each role (M2-0012); rows under Microsoft 365, vendors, Dust, privacy |
| 3 | TASK-002 PRD not approved | One-page policy M2-0189 (10-02); full PRD M2-0016 gates nothing |
| 4 | No CI for native Mac and license-server | Engineering: M2-0050, M2-0051 |
| 5 | Cloudflare route privacy readiness | M2-0102 + D-12 |
| 6 | Entitlement authority undecided | D-4 via M2-0189; M2-0146 |
| 7 | Forgejo mirror authority | D-17 (default: GitHub authoritative) |
| 8 | Hindsight not pinned, hosting not approved | M2-0020 (pin) + D-5 |
| 9 | Off-main production Operator build | D-8 + M2-0014 |
| 10 | Operator staging missing | M2-0103 (W2, needed by 10-18; miniflare fallback) |
| 11 | Shipping line undecided | **Resolved 2026-09-24** (D-7) |
| 12 | Unsigned 1.9.6 public vs written policy | D-13 + M2-0053 |
| 13 | No isolated macOS QA host | M2-0007, hard date 09-29 |
| 14 | No Windows x64 machine | M2-0007 + M2-0195 |
| 15 | No independent review | M2-0023 + separate validator sessions (M2-0002) |
| 16 | Windows Authenticode chain untrusted | Route decided 2026-09-24 (D-10); provisioning M2-0058 |
| 17 | release.yml couples Windows to macOS | Engineering: M2-0053; build-once lane M2-0187 |
| 18 | license-server live state unobservable | M2-0146 (read-only Fly.io access) |
| 19 | Live D1 schema not reconciled | M2-0014 (read-only authorization) |
| 20 | No capture-to-caption harness | Engineering: M2-0113 |
| 21 | macOS Developer ID and notarization missing | Out of scope (M2-0186) |
| 22 | No native app artifact | Engineering: M2-0118 |
| 23 | Jev integration plan (R73) not found | Part of M2-0123's unblock step |
| 24 | Codex integrator route | M2-0023 (quota resets 09-29 19:33) |
| 25 | Baseline exits incomplete | Engineering: M2-0005 |
| 26 | Exec-dir sanitization | Engineering: M2-0057 |
| 27 | Refactoring skill not identified | D-15 (default SAE + Stark) |
| 28 | Welcome recording not provided | D-20 (default: text-led welcome) |
| 29 | Two OneDrive-hosted worktrees unreadable | D-21 |
