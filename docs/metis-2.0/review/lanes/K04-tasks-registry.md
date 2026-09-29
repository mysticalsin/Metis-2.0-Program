# K04 — Task Registry Extraction (r11 kit TASK-001..TASK-066)

**Lane:** K04-tasks-registry &nbsp;|&nbsp; **Repo pinned:** origin/main `2bf21f1c`, v1.9.6 (read-only) &nbsp;|&nbsp; **Kit:** `metis-v2-inputs/r11/Metis-2.0-Upgrade-Kit-r11`, `product_contract_revision` 4.5, `package_edition` r11 &nbsp;|&nbsp; **Report date:** 2026-09-26

## 0. What this lane covers, and what it does not

This lane extracts the **r11 kit's** numbered execution plan (`spec/MASTER.md` §21, TASK-001..TASK-066) as a requirement registry: one row per task with dependencies, requirement bindings, acceptance criteria and an external-dependency classification, plus the DAG's critical path. It does **not** re-audit `src/`, `operator/`, `native/` or `intelligence/` for defects (see the `L01`-`L10` and `B1`-`B3` lane reports in `metis-v2-review/lanes/` for that); where this report cites a repo path, it is a directory-level correlation only, produced by `ls`/`grep` for orientation, not a verified code audit. The `v6` kit (`metis-v2-inputs/v6/Metis-Upgrade-v6-BRAG-Hindsight`) exists but is out of this lane's assigned reading list and was not read; if the overall Métis 2.0 contract needs to merge v6 alongside r11, that reconciliation belongs to the Opus planner or a lane scoped to read it.

**Evidence labels used below:** OBSERVED = read directly in the cited file/line. DERIVED = reasoned from OBSERVED facts (marked explicitly). ASSUMED = a working assumption I could not verify in this read-only pass. UNKNOWN = flagged, not guessed.

## 1. Source registry, verified

- `plan/registry.json` — `schema`: `metis.handoff.registry.v1`, `package_edition`: `r11`, `product_contract_revision`: `4.5`, `source_file`: `spec/MASTER.md`, **`product_execution_performed`: `False`**. (OBSERVED, registry.json top-level keys.)
- 66 task objects present (`TASK-001`..`TASK-066`); every one carries `implementation: NOT_STARTED`, `deployment: NOT_ASSESSED`, `verification: NOT_TESTED` **in this kit's own tracking** (OBSERVED, verified programmatically — no task in the registry shows any other status). **This is the kit's planning state, not the repo's real state** — it means the r11 kit itself has never been "run" against a checkout to flip any status; it says nothing about how much of TASK-031's Jev integration, TASK-016's Cloudflare transport, etc. already exists in the live repo (see §8 below, where I cross-checked a few by grep and found real, already-built code for several "NOT_STARTED" tasks). Do not hand `NOT_STARTED` to the Opus planner as "nothing built yet."
- 55 top-level requirements (`M2-*`), 44 owner commitments (`COV-*`), 12 golden flows (`FLOW-*`), 16 named slice handoffs (`.A/.B/.WIN/.MAC/.CORE/.ADAPTER/...`). The registry's own `limitations` field (OBSERVED) says: "Derived delivery index, not a source-code graph or a product test result" and "No source commits, deployed identities or successful product receipts are fabricated."
- Individual `plan/tasks/TASK-*.md` files (66, checked) are verbatim single-task extracts of the same MASTER.md §21.2 prose (OBSERVED, diffed TASK-001 and TASK-010 against MASTER.md — identical Depends-on/Do/Verify text, only the Revision-4.2+ addenda are dropped in the per-task file). They add no information beyond MASTER.md; the table below cites MASTER.md line numbers as the source of record.

## 2. Full task table — TASK-001 through TASK-066

Phases (MASTER.md §21.1, line 1875-1883): **A**=001-010 baseline/identity/contracts, **B**=011-020 Cloudflare speech, **C**=021-034 lean apps/native/decisions/ledger, **D**=035-045 Intelligence/Dust/skills, **E**=046-052 Teams participation, **F**=053-060 quality/privacy/efficiency, **G**=061-066 refactor/ops/release.

Dependency column keeps slice suffixes (`.A`, `.WIN`, ...) exactly as MASTER.md/registry.json state them (§21.1.1: a suffix is an evidence slice of the same root task, not a new task ID).

| ID | Title | Phase | Depends on | Requirements | Tier |
|---|---|---|---|---|---|
| TASK-001 | Pin the actual system and preserve the working tree | A | None | M2-BASE-01 | 1 |
| TASK-002 | Lock the PRD, effective policies and independent release lanes | A | TASK-001. | M2-BASE-01; M2-SEC-02; M2-REL-01 | 2 |
| TASK-003 | Establish a compact source map and numbered handoff | A | TASK-001. | M2-ENG-01 | 1 |
| TASK-004 | Measure size, capture and hardware baselines | A | TASK-001. | M2-PKG-01; M2-ASR-01; M2-LOCAL-02 | 1 |
| TASK-005 | Define shared speech, command, policy and metering contracts | A | TASK-002. | M2-STT-01; M2-ACT-01; M2-OPS-02 | 1 |
| TASK-006 | Establish cross-surface Entra and service identity | A | TASK-002, TASK-005. | M2-TEAMS-01; M2-DUST-01; M2-SEC-02 | 3 |
| TASK-007 | Lock canonical knowledge, provenance and storage authority | A | TASK-002, TASK-005. | M2-KNOW-02; M2-KNOW-04; M2-GOV-02 | 2 |
| TASK-008 | Design the simplified Settings inventory and task flows | A | TASK-002, TASK-004, TASK-005. | M2-SET-01; M2-SET-02 | 1 |
| TASK-009 | Define centrally governed skill contracts and runtime boundaries | A | TASK-002, TASK-005, TASK-007. | M2-SKILL-01; M2-SKILL-02; M2-GOV-02 | 1 |
| TASK-010 | Qualify meeting APIs, capture permissions and legal prerequisites | A | TASK-002, TASK-006, TASK-007. | M2-TEAMS-02; M2-TEAMS-03; M2-TEAMS-05; M2-GOV-01 | 3 |
| TASK-011 | Qualify the exact Cloudflare hosting and privacy route | B | TASK-002. | M2-PRIV-02 | 3 |
| TASK-012 | Prepare authorized Cloudflare staging and server credentials | B | TASK-002, TASK-005. | M2-STT-02; M2-SEC-01; M2-OPS-03 | 1* |
| TASK-013 | Disable speech content logs and caches before capture tests | B | TASK-011, TASK-012. | M2-PRIV-01; M2-PRIV-02 | 1 |
| TASK-014 | Implement the authenticated speech-session broker | B | TASK-005, TASK-012, TASK-013. | M2-STT-02; M2-SEC-02 | 1 |
| TASK-015 | Make diagnostics and metering projections content-free | B | TASK-005, TASK-013, TASK-014. | M2-PRIV-03; M2-STT-04 | 1 |
| TASK-016 | Connect the real Cloudflare Nova-3 server transport | B | TASK-013, TASK-014, TASK-015. | M2-STT-02; M2-ASR-01 | 1 |
| TASK-017 | Repair the trusted audio broker and requested-only tracks | B | TASK-005. | M2-VOICE-01; M2-STT-03 | 1 |
| TASK-018 | Harden segment revision, reconnect and stream finalization | B | TASK-005, TASK-017. | M2-ASR-01; M2-STT-03 | 1 |
| TASK-019 | Implement opt-in local wake and immediate stop authority | B | TASK-005, TASK-017, TASK-018. | M2-VOICE-01; M2-VOICE-02 | 1 |
| TASK-020 | Prove the first complete synthetic Cloudflare speech path | B | TASK-013, TASK-014, TASK-015, TASK-016, TASK-017, TASK-018, TASK-019. | M2-STT-02; M2-PRIV-01 | 1 |
| TASK-021 | Build hardware qualification and the reviewed model catalog | C | TASK-004, TASK-005. | M2-LOCAL-02 | 1 |
| TASK-022 | Implement separate optional local-model Settings | C | TASK-005, TASK-008, TASK-021. | M2-LOCAL-01; M2-UX-02; M2-SET-01; M2-SET-02 | 1 |
| TASK-023 | Provision signed manifests and R2 asset delivery | C | TASK-004, TASK-005, TASK-012, TASK-021. | M2-PKG-02; M2-SEC-01 | 1 |
| TASK-024 | Implement optional component lifecycle and installation | C | TASK-021, TASK-022, TASK-023. | M2-PKG-02; M2-LOCAL-01 | 1 |
| TASK-025 | Enforce local model load, resource and fallback rules | C | TASK-017, TASK-021, TASK-024. | M2-LOCAL-01; M2-LOCAL-02 | 1 |
| TASK-026 | Produce the genuinely lean cloud-first core | C | TASK-004, TASK-016, TASK-023, TASK-024, TASK-025. | M2-PKG-01 | 1 |
| TASK-027 | Repair onboarding, migration and both known P1s | C | TASK-002, TASK-005. | M2-UX-02; M2-DATA-01; M2-REL-01 | 1 |
| TASK-028 | Repair right-edge and expanded input usability | C | TASK-002, TASK-005. | M2-UX-02 | 1 |
| TASK-029 | Build the native Mac foundation using the actual Codex environment | C | TASK-002, TASK-005. | M2-MAC-01 | 1 |
| TASK-030 | Connect the real orb, beam and caption interfaces | C | TASK-005, TASK-019, TASK-028.A. | M2-UX-01; M2-VOICE-02 | 1 |
| TASK-031 | Finish the real Jev decision gateway and application | C | TASK-005, TASK-012, TASK-015. | M2-DEC-01; M2-ACT-01 | 1* |
| TASK-032 | Qualify the Laya alternative and real portal selection | C | TASK-005, TASK-012, TASK-015. | M2-DEC-02 | 3 |
| TASK-033 | Complete safe native and browser actions | C | TASK-005, TASK-019. | M2-ACT-01; M2-ACT-02 | 1 |
| TASK-034 | Repair identity and authoritative metering end to end | C | TASK-005, TASK-015. | M2-OPS-01; M2-OPS-02; M2-STT-04 | 1 |
| TASK-035 | Implement the governed canonical knowledge service | D | TASK-006, TASK-007, TASK-015. | M2-KNOW-02; M2-KNOW-04; M2-GOV-02 | 1 |
| TASK-036 | Build deterministic wiki and graph projections | D | TASK-035. | M2-KNOW-03; M2-KNOW-05 | 1 |
| TASK-037 | Implement the authorized evidence context builder | D | TASK-035, TASK-036. | M2-KNOW-01; M2-KNOW-04; M2-GOV-02 | 1 |
| TASK-038 | Deploy and connect Dust knowledge read tools | D | TASK-006, TASK-035, TASK-037. | M2-DUST-01; M2-DUST-03 | 2 |
| TASK-039 | Implement real Dust writes and reviewed corrections | D | TASK-035, TASK-038. | M2-DUST-02; M2-KNOW-05 | 1 |
| TASK-040 | Rework Intelligence into an evidence-first workspace | D | TASK-008, TASK-036, TASK-037. | M2-KNOW-01; M2-SET-01 | 1 |
| TASK-041 | Close knowledge synchronization and deletion loops | D | TASK-039, TASK-040. | M2-KNOW-05; M2-DUST-03; M2-GOV-02 | 1 |
| TASK-042 | Implement versioned server skill authoring and publishing | D | TASK-009, TASK-015. | M2-SKILL-01; M2-SKILL-03 | 1 |
| TASK-043 | Implement contextual server skill execution | D | TASK-009, TASK-015, TASK-034, TASK-037, TASK-042. | M2-SKILL-02; M2-SKILL-03; M2-GOV-02 | 1 |
| TASK-044 | Connect the user skill catalog and versioned run receipts | D | TASK-008, TASK-022, TASK-043. | M2-SKILL-03; M2-SET-01 | 1 |
| TASK-045 | Repair portal totals, speech controls and data-health UX | D | TASK-005, TASK-015, TASK-034. | M2-OPS-01; M2-OPS-02; M2-STT-04; M2-PRIV-03 | 1 |
| TASK-046 | Build Teams personal and meeting surfaces with SSO | E | TASK-006, TASK-008. | M2-TEAMS-01; M2-SET-01 | 3 |
| TASK-047 | Implement enrolled meeting discovery and actual-start events | E | TASK-010, TASK-046. | M2-TEAMS-02; M2-TEAMS-05 | 3 |
| TASK-048 | Implement single-occurrence join coordination and admission | E | TASK-047. | M2-TEAMS-02; M2-TEAMS-04 | 1* |
| TASK-049 | Deploy the qualified Teams media receiver | E | TASK-010, TASK-012, TASK-015, TASK-048. | M2-TEAMS-03; M2-GOV-01 | 3 |
| TASK-050 | Connect consent-aware Teams media to Cloudflare speech | E | TASK-016, TASK-018, TASK-020, TASK-049. | M2-TEAMS-03; M2-TEAMS-04; M2-STT-03 | 1* |
| TASK-051 | Qualify post-meeting alternatives and other meeting adapters | E | TASK-010, TASK-047. | M2-TEAMS-05; M2-GOV-01 | 3 |
| TASK-052 | Publish meeting knowledge and skill outputs to the right audience | E | TASK-041, TASK-043. | M2-TEAMS-04; M2-KNOW-02; M2-GOV-02 | 1 |
| TASK-053 | Qualify transcript fidelity and speech latency | F | TASK-011, TASK-016, TASK-017, TASK-018, TASK-020. | M2-ASR-02; M2-STT-03 | 1 |
| TASK-054 | Verify summaries, knowledge and sync without cloud content copies | F | TASK-005, TASK-018, TASK-034, TASK-041, TASK-043, TASK-053. | M2-KNOW-01; M2-DATA-01; M2-PRIV-01 | 1 |
| TASK-055 | Prove the full meeting, Dust and skill journey | F | TASK-040, TASK-044, TASK-045, TASK-050, TASK-052, TASK-053, TASK-054. | M2-E2E-02; M2-DUST-02; M2-SKILL-03; M2-SET-01 | 3* |
| TASK-056 | Run real cross-platform Cloudflare-to-action-to-portal journeys | F | TASK-027, TASK-030, TASK-033, TASK-034, TASK-045, TASK-053, TASK-054. | M2-E2E-01 | 1* |
| TASK-057 | Close no-content-retention and drift-evidence gates | F | TASK-011, TASK-013, TASK-015, TASK-020, TASK-034, TASK-045, TASK-054, TASK-056. | M2-PRIV-01; M2-PRIV-02; M2-PRIV-03 | 2 |
| TASK-058 | Complete governance, subject rights and sharing qualification | F | TASK-006, TASK-007, TASK-041, TASK-057. | M2-GOV-01; M2-GOV-02; M2-DUST-03 | 3 |
| TASK-059 | Qualify optional local packs on actual device classes | F | TASK-021, TASK-022, TASK-024, TASK-025, TASK-053. | M2-LOCAL-01; M2-LOCAL-02 | 1 |
| TASK-060 | Tune speed and footprint against the recorded baseline | F | TASK-004, TASK-026, TASK-030, TASK-053, TASK-056, TASK-059. | M2-PKG-01; M2-VOICE-02; M2-STT-03 | 1 |
| TASK-061 | Apply the supplied refactoring skill in bounded slices | G | TASK-001, TASK-002, TASK-003, TASK-005. | M2-ENG-01 | 1 |
| TASK-062 | Exercise production operations, staging and recovery | G | TASK-012, TASK-023, TASK-034, TASK-045, TASK-057, TASK-058, TASK-060, TASK-061. | M2-OPS-03; M2-SEC-02 | 2 |
| TASK-063 | Build, sign, freeze and qualify the immutable candidate family | G | TASK-027, TASK-030, TASK-033, TASK-045, TASK-053, TASK-054, TASK-056, TASK-057, TASK-058, TASK-059, TASK-060, TASK-061, TASK-062. | *(see note)* | 3 |
| TASK-064 | Verify and publish the already signed Windows candidate | G | TASK-063. | M2-WIN-01; M2-REL-01 | 1* |
| TASK-065 | Finalize native Mac QA and its separate Apple publication decision | G | TASK-029, TASK-030, TASK-033, TASK-034, TASK-053, TASK-056, TASK-057, TASK-059, TASK-063. | M2-MAC-01; M2-MAC-02; M2-REL-01 | 3 |
| TASK-066 | Deliver final re-audit, exact evidence and resumable handoff | G | TASK-063. | M2-BASE-01; M2-ENG-01; M2-REL-01 | 1 |

## 3. Per-task detail: acceptance summary, code areas, external dependency

`Acceptance summary` condenses MASTER.md's **Verify before closing** clause (exact source at the line cited). `Code areas` are directory-level correlations from a read-only `ls`/`grep` pass over the pinned checkout — orientation, not a code audit. `Tier` and its one-line reason answer the "needs no external account/owner decision" question per task (see §4 for the rollup and full tier definitions).

### TASK-001 — Pin the actual system and preserve the working tree

*Source: `spec/MASTER.md:1920` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: None &nbsp;|&nbsp; Requirements: M2-BASE-01 (Pinned, preserved baseline and deployed-state audit)*

- **Do:** Read repository instructions and recover referenced inputs, including the two original named briefs and the missing-input register in section 2.5. Map all shipping workspaces and approved GitHub UI lineages. Record full source and PR/branch SHAs, dirty-file ownership, exact installed clients, frontend/Worker versions, database binding/schema, Cloudflare account/gateway identities and available authorized tools. Never infer the live portal version from main.
- **Acceptance (Verify before closing):** Commit or retain a sanitized baseline/source register, real baseline test exits and an explicit unavailable-input list. Existing user work is untouched. No secrets or private portal data are copied into the handoff.
- **Code areas (directory-level correlation, not audited):** (repo-wide) — inventory only
- **Tier 1 — Engineering-only:** Reads/records existing baseline and already-authorized tools; no new account.

### TASK-002 — Lock the PRD, effective policies and independent release lanes

*Source: `spec/MASTER.md:1941` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: TASK-001. &nbsp;|&nbsp; Requirements: M2-BASE-01 (Pinned, preserved baseline and deployed-state audit); M2-SEC-02 (Effective auth/egress/tool/approval boundaries); M2-REL-01 (Independent honest platform release states)*

- **Do:** Reconcile all prior findings with the current source. Make Cloudflare-hosted speech the fresh-install default, define optional local speech/generation separately, and record the exact no-content-retention claim. Update the threat model, scope, Windows release path and native Mac engineering/public-signing distinction. Run sanitized signing/tenant/provider prerequisite discovery now, and generate the section 25 coverage map and section 27 evidence registry without prefilled passes.
- **Acceptance (Verify before closing):** A versioned PRD and route/policy decision record cover all 55 requirements and 112 use cases. Windows/shared gates remain mandatory; pending Apple publication is explicit and does not waive or indefinitely block Windows-only signing.
- **Code areas (directory-level correlation, not audited):** docs/ (PRD/policy record)
- **Tier 2 — Owner/internal policy decision:** "Lock the PRD, effective policies" — locks the no-content-retention claim, threat model and Windows/Mac release path: an owner/product-policy decision, not code.

### TASK-003 — Establish a compact source map and numbered handoff

*Source: `spec/MASTER.md:1962` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: TASK-001. &nbsp;|&nbsp; Requirements: M2-ENG-01 (Maintainable refactor and fresh engineering memory)*

- **Do:** Evaluate the existing requested structural-index tooling without creating a duplicate runtime graph. Set up bounded source-linked queries, repository/worktree freshness, a task index, relay/CURRENT.md and numbered lessons. Keep security/retention rules always loaded.
- **Acceptance (Verify before closing):** A resumed agent can identify the right source, active task and next action without re-reading the repository. Record tooling permissions and provenance. This optional tooling task cannot delay an independent urgent security fix.
- **Code areas (directory-level correlation, not audited):** scripts/, relay/ (tooling)
- **Tier 1 — Engineering-only:** Tooling/index only.

### TASK-004 — Measure size, capture and hardware baselines

*Source: `spec/MASTER.md:1979` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: TASK-001. &nbsp;|&nbsp; Requirements: M2-PKG-01 (Genuinely lightweight default installation); M2-ASR-01 (Faithful capture and ordered segment revisions); M2-LOCAL-02 (Device-qualified model selection and resource limits)*

- **Do:** Measure actual compressed/unpacked/temporary install sizes, resource duplication, startup/process-tree memory/CPU and current capture/stream latency. Inventory supported Windows/Mac devices, architectures, accelerators and languages; do not substitute marketing model names for measured properties.
- **Acceptance (Verify before closing):** A reproducible baseline ties bytes and performance to an exact artifact/profile/device. Explain what remains unmeasured; the historical 1.57 GB source inventory is not mislabeled as a new installed-size test.
- **Code areas (directory-level correlation, not audited):** scripts/ (baseline harness)
- **Tier 1 — Engineering-only:** Measurement harness only.

### TASK-005 — Define shared speech, command, policy and metering contracts

*Source: `spec/MASTER.md:1993` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: TASK-002. &nbsp;|&nbsp; Requirements: M2-STT-01 (Cloudflare default on all fresh 2.0 native platforms); M2-ACT-01 (Capability-bound safe action planning); M2-OPS-02 (Correct complete usage and money)*

- **Do:** Extend existing TypeScript/Swift contracts for selected/allowed/ready engines, separate speech/generation capability, capture generation, requested track, stream epoch, segment revision, operation/attempt/step identity and typed outcomes. Implement migration/default fixtures before UI labels.
- **Acceptance (Verify before closing):** Golden cross-platform fixtures and negative tests preserve explicit legacy choices, forbid a local installation from implicitly selecting it, and make every fresh eligible 2.0 profile Cloudflare-default without treating that preference as capture consent.
- **Code areas (directory-level correlation, not audited):** src/shared/
- **Tier 1 — Engineering-only:** Contract/schema definitions only.

### TASK-006 — Establish cross-surface Entra and service identity

*Source: `spec/MASTER.md:2007` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: TASK-002, TASK-005. &nbsp;|&nbsp; Requirements: M2-TEAMS-01 (Teams app plus verified Entra identity); M2-DUST-01 (Authenticated Dust read and attribution); M2-SEC-02 (Effective auth/egress/tool/approval boundaries)*

- **Do:** Map desktop/Teams/Dust personal identities and separate bot/service principals. Register only authorized app audiences/scopes; define PKCE/OBO, token validation, revocation and tenant restrictions. Do not request broad calendar/media access merely to sign in.
- **Acceptance (Verify before closing):** Actual authorized tenant tests distinguish delegated and service authority. Wrong audience/issuer/tenant, anonymous caller, forged email and revoked permissions fail. Missing admin consent is recorded, not bypassed.
- **Code areas (directory-level correlation, not audited):** operator/src/routes/connectors-oauth.ts; operator/src/connectors/oauth.ts
- **Tier 3 — External account / tenant / signing / vendor:** "Register only authorized app audiences/scopes" in Entra — requires an Entra/Azure AD tenant admin to create/consent the app registration.

### TASK-007 — Lock canonical knowledge, provenance and storage authority

*Source: `spec/MASTER.md:2025` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: TASK-002, TASK-005. &nbsp;|&nbsp; Requirements: M2-KNOW-02 (Canonical knowledge authority, versions and field provenance); M2-KNOW-04 (Always-available authorized context service); M2-GOV-02 (Content, control artifacts and metadata kept separate)*

- **Do:** Inspect the actual .brain/wiki/OneDrive configuration and source ownership. Select the existing canonical store and approved always-on service path. Define fact states, ETags/revisions, source ACLs, conflicts, deletion and the plaintext-mirror sharing boundary.
- **Acceptance (Verify before closing):** A reviewed data/authority matrix covers canonical records, projections, Dust, Cloudflare metadata and device-only limitations. No unauthorized new knowledge store, key upload or broad plaintext mirror exists.
- **Code areas (directory-level correlation, not audited):** src/main/brain/; src/shared/brain.ts
- **Tier 2 — Owner/internal policy decision:** "Select the existing canonical store" and define the plaintext-mirror sharing boundary — an architecture/owner decision (uses existing .brain/OneDrive, so no new vendor).

### TASK-008 — Design the simplified Settings inventory and task flows

*Source: `spec/MASTER.md:2039` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: TASK-002, TASK-004, TASK-005. &nbsp;|&nbsp; Requirements: M2-SET-01 (Simple everyday Settings and progressive disclosure); M2-SET-02 (Safe Settings migration and effective policy)*

- **Do:** Classify every existing setting using KEEP/MERGE/ADVANCED/OPERATOR-ONLY/DEPRECATED/PLATFORM-SPECIFIC. Design four everyday destinations and search, mapped to stable existing keys and actual policy semantics.
- **Acceptance (Verify before closing):** A complete migration/visibility table, interactive concept and typical-task acceptance plan preserve optional local controls, capture/privacy access and expert capabilities without a new switch for every backend.
- **Code areas (directory-level correlation, not audited):** src/renderer/src/components/Settings.tsx
- **Tier 1 — Engineering-only:** Design/classification deliverable, no external gate.

### TASK-009 — Define centrally governed skill contracts and runtime boundaries

*Source: `spec/MASTER.md:2057` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: TASK-002, TASK-005, TASK-007. &nbsp;|&nbsp; Requirements: M2-SKILL-01 (Central versioned skill lifecycle); M2-SKILL-02 (Server-side governed skill execution); M2-GOV-02 (Content, control artifacts and metadata kept separate)*

- **Do:** Inspect existing signed pack/manifest/publishing behavior. Define immutable skill versions, typed I/O, entitlement, tool/context scopes, model/privacy class, budget, review/canary and remote execution. Separate authored templates from private run content.
- **Acceptance (Verify before closing):** One logical registry/migration is documented, no parallel local/cloud skill systems. Permission escalation, executable imports, private template examples and offline revoked-skill fallback have explicit denial tests.
- **Code areas (directory-level correlation, not audited):** operator/src/ (skill registry — not yet located as a distinct module)
- **Tier 1 — Engineering-only:** Contract/governance definitions only.

### TASK-010 — Qualify meeting APIs, capture permissions and legal prerequisites

*Source: `spec/MASTER.md:2071` &nbsp;|&nbsp; Phase A &nbsp;|&nbsp; Depends on: TASK-002, TASK-006, TASK-007. &nbsp;|&nbsp; Requirements: M2-TEAMS-02 (Eligible actual-start automatic attendance); M2-TEAMS-03 (Qualified real Teams media service); M2-TEAMS-05 (Honest cross-platform meeting capability matrix); M2-GOV-01 (Deployment-specific privacy/GDPR decision evidence)*

- **Do:** Verify current Teams app/event/join/media rules and actual tenant controls. Resolve required Azure/.NET receiver and recording-status/derived-data restrictions. Record Zoom/Meet capabilities and notice/consent route, with scoped admin/privacy review.
- **Acceptance (Verify before closing):** Feasible routes have exact permissions/hosting/status evidence; unresolved raw-media eligibility is explicitly blocked. A tab, invitation or consent checkbox cannot be counted as universal recording permission.
- **Code areas (directory-level correlation, not audited):** (policy/legal — no code area)
- **Tier 3 — External account / tenant / signing / vendor:** "Verify current Teams app/event/join/media rules and actual tenant controls... Record Zoom/Meet capabilities... with scoped admin/privacy review" — needs Microsoft 365 tenant admin plus Zoom/Google program access and a privacy reviewer.

### TASK-011 — Qualify the exact Cloudflare hosting and privacy route

*Source: `spec/MASTER.md:2079` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-002. &nbsp;|&nbsp; Requirements: M2-PRIV-02 (Route-specific provider assurance and no silent downgrade)*

- **Do:** Identify the actual Cloudflare-hosted model, endpoint, transport, service/model terms, geographic constraints and supplier assurance. Distinguish Workers AI from direct Deepgram/BYOK/Unified Billing. Record any unresolved vendor or account entitlement issue; do not toggle generic ZDR and assume Nova-3 is covered.
- **Acceptance (Verify before closing):** The route evidence record is approved or explicitly BLOCKED with an owner and precise question. Synthetic non-sensitive testing may continue; customer-content sessions require the approved route and verified deployed controls.
- **Code areas (directory-level correlation, not audited):** operator/src/cloudflare.ts; operator/src/cloudflare-connect.ts
- **Tier 3 — External account / tenant / signing / vendor:** "Record any unresolved vendor or account entitlement issue" for Workers AI vs. direct Deepgram/BYOK/Unified Billing — a Cloudflare/Deepgram account-entitlement and billing-route decision the vendor or account owner must resolve.

### TASK-012 — Prepare authorized Cloudflare staging and server credentials

*Source: `spec/MASTER.md:2093` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-002, TASK-005. &nbsp;|&nbsp; Requirements: M2-STT-02 (Server-credentialed real-time speech session); M2-SEC-01 (No shipped organizational master credentials); M2-OPS-03 (Operational diagnostics and recovery)*

- **Do:** Inspect available cloud credentials and existing Operator provisioning/deploy scripts. Configure an isolated staging Worker/D1 and required AI binding or scoped server secret, with least privilege, correct environment separation and no placeholder database IDs. Preserve unrelated resources.
- **Acceptance (Verify before closing):** Authorized deployment/readback proves actual binding and version identity. No desktop asks for or receives a Cloudflare account token. Any missing account permission is documented; configuration text alone does not count as provisioning.
- **Code areas (directory-level correlation, not audited):** operator/wrangler.jsonc; operator/src/
- **Tier 1* — Engineering-only (transitive caveat — see note):** Uses the Cloudflare account already operating Metis in production (OBSERVED: Operator is live) to cut a new scoped Worker/D1 — low-friction, assumes existing account access continues to be available.

### TASK-013 — Disable speech content logs and caches before capture tests

*Source: `spec/MASTER.md:2107` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-011, TASK-012. &nbsp;|&nbsp; Requirements: M2-PRIV-01 (No controlled cloud content persistence); M2-PRIV-02 (Route-specific provider assurance and no silent downgrade)*

- **Do:** Provision a deliberate sensitive-route gateway where applicable. Disable gateway logs/cache, remove body-bearing traces and exclude inference paths from CDN/Worker caching. Apply supported request/binding protections server-side and record the transport-specific test plan, including WebSockets.
- **Acceptance (Verify before closing):** Sanitized configuration readback shows the intended settings before content tests. No code path can auto-create an unreviewed logging-enabled default gateway or let a client re-enable collection. Live effect is subsequently tested in TASK-020 and TASK-057.
- **Code areas (directory-level correlation, not audited):** operator/src/cloudflare.ts
- **Tier 1 — Engineering-only:** Config change on the already-provisioned Cloudflare gateway.

### TASK-014 — Implement the authenticated speech-session broker

*Source: `spec/MASTER.md:2121` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-005, TASK-012, TASK-013. &nbsp;|&nbsp; Requirements: M2-STT-02 (Server-credentialed real-time speech session); M2-SEC-02 (Effective auth/egress/tool/approval boundaries)*

- **Do:** Extend the existing Operator protocol/router with a constrained session broker and the minimal required Worker relay. Authenticate device/principal, enforce requested tracks/model, privacy readiness, entitlement, concurrency and budget. Bind short-lived grants to an exact session; inject upstream secrets only on the server.
- **Acceptance (Verify before closing):** Unauthenticated, revoked, expired, replayed, cross-device and wrong-scope requests fail before audio or paid inference. Actual route names, grant rules and safe failure codes are documented; no unrestricted proxy or caller-selected upstream URL exists.
- **Code areas (directory-level correlation, not audited):** operator/src/routes/; operator/src/ai-gateway.ts
- **Tier 1 — Engineering-only:** Server-side broker logic on the existing Operator.

### TASK-015 — Make diagnostics and metering projections content-free

*Source: `spec/MASTER.md:2135` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-005, TASK-013, TASK-014. &nbsp;|&nbsp; Requirements: M2-PRIV-03 (Content-free diagnostics and finite metadata retention); M2-STT-04 (Speech metering and actual provider/config provenance)*

- **Do:** Apply explicit allowlist projection before logging, queues, database writes, tracing, alerts and support exports. Keep only approved IDs, versions, quantities, timings, enums and identity records. Define retention/deletion for operational events; exclude raw provider errors, custom vocabulary and content hashes.
- **Acceptance (Verify before closing):** Adversarial fixtures carrying synthetic content/credentials are rejected or safely projected at every sink. Metadata-only usage remains durable. Gateway logs are not the only ledger, and accounting is not lost merely because content logging is off.
- **Code areas (directory-level correlation, not audited):** operator/src/ (logging/metering sinks)
- **Tier 1 — Engineering-only:** Projection/allowlist logic only.

### TASK-016 — Connect the real Cloudflare Nova-3 server transport

*Source: `spec/MASTER.md:2153` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-013, TASK-014, TASK-015. &nbsp;|&nbsp; Requirements: M2-STT-02 (Server-credentialed real-time speech session); M2-ASR-01 (Faithful capture and ordered segment revisions)*

- **Do:** Implement the actual accepted Cloudflare-hosted realtime protocol using an eligible binding or authenticated server WebSocket relay. Pin model/config, validate accepted audio/language/endpointing options, handle upstream status/terminal metadata and safe errors, and document transport-specific privacy enforcement.
- **Acceptance (Verify before closing):** A permitted synthetic PCM sample returns an actual normalized transcript. Wrong token, rejected options, invalid frames and upstream failure are exercised. A socket-open event or mocked text never satisfies the recognition test.
- **Code areas (directory-level correlation, not audited):** src/main/cloud-stt/adapter.ts; src/main/cloud-stt/live-session.ts
- **Tier 1 — Engineering-only:** Uses an existing/assumed-enabled Workers AI Nova-3 binding; no new account named.

### TASK-017 — Repair the trusted audio broker and requested-only tracks

*Source: `spec/MASTER.md:2163` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-005. &nbsp;|&nbsp; Requirements: M2-VOICE-01 (Trusted opt-in wake and single audio owner); M2-STT-03 (Efficient purpose-specific tracks and bounded streams)*

- **Do:** Reuse the current capture owner and move high-frequency processing off the UI thread. Open microphone-only for commands and only explicitly requested tracks for meetings. Validate sample rate/channel/framing/resampling and cap every in-flight queue by bytes and duration.
- **Acceptance (Verify before closing):** Actual capture and deterministic fixtures show no duplicate microphones/system streams, no frame-format mismatch, explicit dropped-frame gaps and bounded resources. UI effects consume a scalar level, never a new capture subscription.
- **Scope/sequencing note:** Audio capture/format and pure broker work starts from TASK-005. Actual Cloudflare integration also requires TASK-016 and is proved in TASK-020. Neither contract fixtures nor a local microphone loop count as upstream speech proof.
- **Code areas (directory-level correlation, not audited):** src/main/cloud-stt/; src/shared/cloud-stt-*.ts
- **Tier 1 — Engineering-only:** Client-side audio broker refactor.

### TASK-018 — Harden segment revision, reconnect and stream finalization

*Source: `spec/MASTER.md:2175` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-005, TASK-017. &nbsp;|&nbsp; Requirements: M2-ASR-01 (Faithful capture and ordered segment revisions); M2-STT-03 (Efficient purpose-specific tracks and bounded streams)*

- **Do:** Use stable segment identity and monotonic audio offsets across partial revisions, finals and new upstream epochs. Preserve the good existing end-of-stream distinction. Implement bounded reconnect/backpressure and distinguish normal tail flush from immediate stop-all/revocation.
- **Acceptance (Verify before closing):** Duplicate/out-of-order finals, delayed metadata, clipped tail, disconnect/reconnect, language switch, overflow and cancellation races pass. No duplicate words, fabricated continuity or durable audio retry spool is introduced.
- **Scope/sequencing note:** Implement provider fixtures independently; close live finalization/reconnect evidence only with TASK-016. Preserve every native-platform result separately.
- **Code areas (directory-level correlation, not audited):** src/main/cloud-stt/live-session.ts; src/main/cloud-stt/session-replacement.ts
- **Tier 1 — Engineering-only:** Client-side stream-state logic.

### TASK-019 — Implement opt-in local wake and immediate stop authority

*Source: `spec/MASTER.md:2191` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-005, TASK-017, TASK-018. &nbsp;|&nbsp; Requirements: M2-VOICE-01 (Trusted opt-in wake and single audio owner); M2-VOICE-02 (Fast visible command bar and local cancellation)*

- **Do:** Implement or qualify the small local wake detector and trusted session transition. No cloud audio before wake/explicit meeting capture; transfer only the authorized command interval. Keep first-syllable handling, meeting subscriptions, command-off and stop-all semantics distinct.
- **Acceptance (Verify before closing):** Wake/first-word/echo/replay/negation/stale-generation tests pass; local stop revokes authority without waiting on network. Idle speech egress is absent and the small wake component is not a full offline ASR download.
- **Code areas (directory-level correlation, not audited):** src/main/ (wake detector — not directly located)
- **Tier 1 — Engineering-only:** Client-side wake detector.

### TASK-020 — Prove the first complete synthetic Cloudflare speech path

*Source: `spec/MASTER.md:2205` &nbsp;|&nbsp; Phase B &nbsp;|&nbsp; Depends on: TASK-013, TASK-014, TASK-015, TASK-016, TASK-017, TASK-018, TASK-019. &nbsp;|&nbsp; Requirements: M2-STT-02 (Server-credentialed real-time speech session); M2-PRIV-01 (No controlled cloud content persistence)*

- **Do:** Run controlled non-sensitive audio through identified client/relay/hosted model/segment UI and metadata persistence. Inspect the configured logs/cache/storage/export sinks on success, failure and disconnect. Verify request privacy controls on the actual WebSocket path, not only HTTP.
- **Acceptance (Verify before closing):** A sanitized evidence receipt proves provider/model, capture/attempt IDs, real returned text and permitted metadata, without retaining that text in production sinks. Any unsupported privacy behavior blocks the route; a mock test is not relabeled live.
- **Code areas (directory-level correlation, not audited):** src/main/cloud-stt/; operator/src/routes/live.ts
- **Tier 1 — Engineering-only:** Test harness using already-provisioned route (012-016).

### TASK-021 — Build hardware qualification and the reviewed model catalog

*Source: `spec/MASTER.md:2215` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-004, TASK-005. &nbsp;|&nbsp; Requirements: M2-LOCAL-02 (Device-qualified model selection and resource limits)*

- **Do:** Probe actual OS/architecture/instruction sets, available memory/disk, execution-provider/driver support and requested languages. Add reviewed per-model resource/quality envelopes and conservative compatibility explanations. Reuse signed inventory definitions.
- **Acceptance (Verify before closing):** Fixtures cover unsupported accelerators, low available memory, disk peaks, language mismatch and changing device conditions. Recommendations explain why they qualify; no raw unique device fingerprint or automatic download is emitted.
- **Code areas (directory-level correlation, not audited):** src/main/llm/local-models.ts; src/main/llm/local-routing.ts
- **Tier 1 — Engineering-only:** Local probing/catalog logic.

### TASK-022 — Implement separate optional local-model Settings

*Source: `spec/MASTER.md:2225` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-005, TASK-008, TASK-021. &nbsp;|&nbsp; Requirements: M2-LOCAL-01 (Optional separate local speech/generation Settings); M2-UX-02 (Accessible stable right-edge/top-center UI); M2-SET-01 (Simple everyday Settings and progressive disclosure); M2-SET-02 (Safe Settings migration and effective policy)*

- **Do:** Implement the four-destination Settings design and legacy-key migration; add nested optional local speech and optional local generation controls, with vision as a separate capability. Show not-installed/downloading/verified/installed/selected/loaded/unsupported states, bytes, compatibility and privacy implications. Installing a pack does not select it silently.
- **Acceptance (Verify before closing):** Fresh installs show Cloudflare default and no local packs/processes. Explicit install/select/disable/remove flow is keyboard-accessible, persists correctly and respects managed locks; failing cloud speech never starts this flow automatically.
- **Code areas (directory-level correlation, not audited):** src/renderer/src/components/Settings.tsx; src/main/llm/local-models.ts
- **Tier 1 — Engineering-only:** Settings UI/state logic.

### TASK-023 — Provision signed manifests and R2 asset delivery

*Source: `spec/MASTER.md:2239` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-004, TASK-005, TASK-012, TASK-021. &nbsp;|&nbsp; Requirements: M2-PKG-02 (Secure optional components); M2-SEC-01 (No shipped organizational master credentials)*

- **Do:** Use authorized R2/Worker infrastructure for immutable reviewed assets, signed manifests and appropriately scoped grants. Separate asset caching from no-cache speech. Define compatibility, trusted root rotation, length/hash/signature, safe extraction and rollback protection.
- **Acceptance (Verify before closing):** Actual authorized staging asset/manifests and tamper/expiry/scope/architecture tests pass. No private signing key, provider account credential or recording is in downloadable assets or public metadata.
- **Code areas (directory-level correlation, not audited):** operator/src/assets.ts
- **Tier 1 — Engineering-only:** Uses existing Cloudflare R2/Worker infra.

### TASK-024 — Implement optional component lifecycle and installation

*Source: `spec/MASTER.md:2253` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-021, TASK-022, TASK-023. &nbsp;|&nbsp; Requirements: M2-PKG-02 (Secure optional components); M2-LOCAL-01 (Optional separate local speech/generation Settings)*

- **Do:** Download only selected allowed packs; stream with bounded resources, resumable verified ranges, space checks and cancellation. Verify then safely extract/self-test and activate atomically. Do not alter a signed Mac app bundle or fetch arbitrary runtime code.
- **Acceptance (Verify before closing):** Interrupted download, sleep, reboot, captive portal, low disk, bad signature/hash, decompression abuse and failed self-test leave no partial capability active. Uninstall affects only owned assets and does not erase user data.
- **Code areas (directory-level correlation, not audited):** resources/local-llm/; resources/asr/
- **Tier 1 — Engineering-only:** Client-side installer logic.

### TASK-025 — Enforce local model load, resource and fallback rules

*Source: `spec/MASTER.md:2263` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-017, TASK-021, TASK-024. &nbsp;|&nbsp; Requirements: M2-LOCAL-01 (Optional separate local speech/generation Settings); M2-LOCAL-02 (Device-qualified model selection and resource limits)*

- **Do:** Load models only when selected and needed, cap context/concurrency/memory, detect tested execution providers and unload safely at idle. Prioritize capture over background installation/self-tests. Add explicit local-only and optional preapproved fallback policies without automatic mode changes.
- **Acceptance (Verify before closing):** Default startup launches no local inference. Disabling a model releases its resources. Local-only failures produce no cloud audio; memory pressure/unsupported language/thermal events do not covertly change provider or trigger downloads.
- **Code areas (directory-level correlation, not audited):** src/main/llm/fm-runtime.ts; src/main/llm/exhaustion.ts
- **Tier 1 — Engineering-only:** Client-side resource/scheduling logic.

### TASK-026 — Produce the genuinely lean cloud-first core

*Source: `spec/MASTER.md:2273` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-004, TASK-016, TASK-023, TASK-024, TASK-025. &nbsp;|&nbsp; Requirements: M2-PKG-01 (Genuinely lightweight default installation)*

- **Do:** Remove optional offline weights and unnecessary duplicate runtimes from the default package while preserving profile-aware integrity checks, native critical helpers and notices. Make onboarding build hooks unable to fetch optional weights just because historic scripts did.
- **Acceptance (Verify before closing):** Exact signed-candidate profile inventory and measured sizes meet or explicitly explain proposed budgets. Fresh installation/launch works with no local model files. The saving is total core size, not only a bootstrap hiding the same large transfer.
- **Code areas (directory-level correlation, not audited):** resources/ (packaging manifest); resources/runtime-assets-manifest.json
- **Tier 1 — Engineering-only:** Packaging/build logic.

### TASK-027 — Repair onboarding, migration and both known P1s

*Source: `spec/MASTER.md:2291` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-002, TASK-005. &nbsp;|&nbsp; Requirements: M2-UX-02 (Accessible stable right-edge/top-center UI); M2-DATA-01 (Existing data and retention preserved); M2-REL-01 (Independent honest platform release states)*

- **Do:** Inspect integration/equivalence of the historical #197 fix `7d684b24b2f4a1944388d94dd1c6c5dedfe5cc1a`; reproduce/integrate only the focused renderer fix and correct #196 without unconditional advancement. Implement privacy-ready Cloudflare onboarding, optional nonblocking downloads and explicit legacy mode migration. Preserve original-to-release patch mapping, notes/keys/IDs and release-feed continuity.
- **Acceptance (Verify before closing):** Visible Next and bundled renderer pass unset/unreachable/reachable-stale override cases. Actual fresh and upgrade profiles retain data/consent, have truthful readiness and no surprise model acquisition or speech upload.
- **Scope/sequencing note:** **TASK-027.A — urgent repair:** start after baseline/contracts, independently of the new speech/local-pack onboarding. Resolve #196/#197 narrowly and record the source-to-release patch mapping. **TASK-027.B — full onboarding:** integrate TASK-020, TASK-022, TASK-024 and TASK-026 once ready; re-test both P1s and fresh/upgrade journeys on the final candidate. A pass for A does not close B.
- **Code areas (directory-level correlation, not audited):** src/renderer/src/ (onboarding); src/main/ (migration)
- **Tier 1 — Engineering-only:** Bug-fix + onboarding logic, no new external gate named.

### TASK-028 — Repair right-edge and expanded input usability

*Source: `spec/MASTER.md:2310` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-002, TASK-005. &nbsp;|&nbsp; Requirements: M2-UX-02 (Accessible stable right-edge/top-center UI)*

- **Do:** Use one geometry authority for collapsed handle, inward expansion, caption and approval/result cards. Stabilize definite-height scrolling, composer, drafts, focus, IME, keyboards, target sizes and display/DPI handling. Do not hide essential controls to solve crowding.
- **Acceptance (Verify before closing):** Before/after running-app evidence covers long/multiline/unbroken text, markdown/code, streaming, pointer departure, monitor removal, reduced motion and 100/150/200% scaling. Typing never disappears or executes via a drag-region accident.
- **Scope/sequencing note:** **TASK-028.A** repairs current right-edge geometry/input from the baseline immediately. **TASK-028.B** integrates the final onboarding and new command surface. Do not wait for optional model downloads to fix typing. Final-candidate evidence still links to TASK-027.B and TASK-030.
- **Code areas (directory-level correlation, not audited):** src/main/island/geometry.ts; src/renderer/src/App.tsx
- **Tier 1 — Engineering-only:** UI/geometry bug fix.

### TASK-029 — Build the native Mac foundation using the actual Codex environment

*Source: `spec/MASTER.md:2326` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-002, TASK-005. &nbsp;|&nbsp; Requirements: M2-MAC-01 (Genuine native application)*

- **Do:** Extend native-app/ in Swift/SwiftUI/AppKit with genuine native capture, Keychain, restricted helpers and the shared contract fixtures. Make Cloudflare the same default speech choice. Compile through Xcode; record the real Codex/SDK versions, not an invented Codex 2 identifier.
- **Acceptance (Verify before closing):** Native builds and local-development-policy tests establish real platform behavior. App permissions, migration IDs and capability differences are documented. Public Developer ID signing/notarization remains a distinct external gate.
- **Scope/sequencing note:** Begin native project, schemas, identity, windows and permission fixtures now. Add actual capture/wake after TASK-017–TASK-019 and optional-pack support after TASK-021. Close native functional evidence only when those integrations run on a Mac; missing Apple public signing does not delay this engineering.
- **Code areas (directory-level correlation, not audited):** native-app/App/; native/mac-helper/
- **Tier 1 — Engineering-only:** "Public Developer ID signing/notarization remains a distinct external gate" — explicitly deferred to TASK-065; TASK-029 itself uses local development signing only.

### TASK-030 — Connect the real orb, beam and caption interfaces

*Source: `spec/MASTER.md:2349` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-005, TASK-019, TASK-028.A. &nbsp;|&nbsp; Requirements: M2-UX-01 (Exact requested orb/beam/voice hierarchy); M2-VOICE-02 (Fast visible command bar and local cancellation)*

- **Do:** Implement §5.11 first: ARMED renders only the mesh button; the pill, caption and beam are absent until deliberate typing or trusted wake. Use the reviewed React effects and qualified native equivalents when expanded: solving orb inside the pill, live caption above, beam border and audio-driven glow. Bind actual session state/level and local Stop; no duplicate microphone hook or redundant decorative status label.
- **Acceptance (Verify before closing):** Windows/native state evidence proves orb-only ARMED, tight native hit bounds, typed-versus-wake focus, duplicate wake/approval protection, IME dismissal, OFF/lock distinctions and correct capture/solve/approval/result/error behavior. Hidden/reduced-motion modes stop unnecessary animation, and no animation gates authorized execution.
- **Scope/sequencing note:** The .WIN slice uses its ready React controller. The .MAC slice additionally requires TASK-029 and genuine native rendering. Neither waits for the other to begin. Both must eventually prove the promised interaction; a PNG cannot substitute for the specified libraries and native equivalents.
- **Code areas (directory-level correlation, not audited):** src/renderer/src/App.tsx (orb/beam); native-app/App/UI/
- **Tier 1 — Engineering-only:** Client UI/animation logic.

### TASK-031 — Finish the real Jev decision gateway and application

*Source: `spec/MASTER.md:2368` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-005, TASK-012, TASK-015. &nbsp;|&nbsp; Requirements: M2-DEC-01 (Real Jev applied decision path); M2-ACT-01 (Capability-bound safe action planning)*

- **Do:** Complete entitlement, server vault, typed candidate-bound requests and application of successful decisions. Remove the discarded-result behavior while preserving independent policy/approval checks. Apply content-privacy controls to transcript-derived requests too.
- **Acceptance (Verify before closing):** A live authorized Jev request changes the actual qualified plan with route/version/usage evidence. Invalid/stale/out-of-candidate results and outage cannot execute; provider confidence never substitutes for permission.
- **Scope/sequencing note:** Bring up the provider contract using synthetic allowed state without waiting for wake UI. Complete command integration with TASK-019/TASK-033 and Intelligence integration with TASK-040; both actual effects, plus two-device shared-key isolation/rotation, need evidence.
- **Code areas (directory-level correlation, not audited):** src/main/metis-decide-client.ts; src/main/desktop-adapters.ts
- **Tier 1* — Engineering-only (transitive caveat — see note):** "Complete entitlement, server vault, typed candidate-bound requests" for Jev — OBSERVED: Jev is already integrated in src/main/metis-decide-client.ts (JEV_INTEL_LABELS), so this task completes/hardens an existing vendor relationship rather than establishing a new one; a materially expanded entitlement would move this to tier 3.

### TASK-032 — Qualify the Laya alternative and real portal selection

*Source: `spec/MASTER.md:2384` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-005, TASK-012, TASK-015. &nbsp;|&nbsp; Requirements: M2-DEC-02 (Laya alternate with honest capabilities/cost)*

- **Do:** Deploy only into an authorized suitable serving environment, pin checkpoint/dependencies, verify language/context/options and resource behavior, and expose actual provider readiness/selection. Retain Jev; Laya-only does not silently route to it. No Python/Torch in the default desktop.
- **Acceptance (Verify before closing):** Common task evaluation and live serving trace establish useful compatible decisions, explicit limits and honest hosting/speech/generation cost. Missing service credentials/resources are BLOCKED, not a fake free-ready state.
- **Scope/sequencing note:** Use the common decision schemas, not a dependency on a successful live Jev key test. Qualify actual Laya serving independently. The dual-provider comparison and full product demonstrations still require both real providers when the feature is advertised.
- **Code areas (directory-level correlation, not audited):** (no existing "Laya" source hits found — appears unbuilt)
- **Tier 3 — External account / tenant / signing / vendor:** "Deploy only into an authorized suitable serving environment... Missing service credentials/resources are BLOCKED" — DERIVED: no "laya" identifier was found anywhere in src/, operator/, native/, native-app/ or intelligence/, meaning this is a new vendor/hosting relationship to stand up, not a completion of existing work.

### TASK-033 — Complete safe native and browser actions

*Source: `spec/MASTER.md:2400` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-005, TASK-019. &nbsp;|&nbsp; Requirements: M2-ACT-01 (Capability-bound safe action planning); M2-ACT-02 (Real cross-platform outcomes)*

- **Do:** Implement qualified open/focus/graceful close, exact notes, browser actions and camera behavior per platform. Resolve fresh targets, parameters and approvals. Inspect every returned result and independently verify the postcondition. Refuse arbitrary shell text and unsafe partial-speech execution.
- **Acceptance (Verify before closing):** Supported UC-009–UC-040 cases show the real result, not only app launch. Failed/unknown/cancelled cannot become verified; unsaved work, stale targets, retries, injection and multi-step failure are tested without touching private user fixtures.
- **Scope/sequencing note:** Implement deterministic/native adapters against the common contract first. .MAC also requires TASK-029; each model-assisted slice requires its real qualified TASK-031 or TASK-032 provider. Validate operation-target compatibility, manual interference, intentional repeated commands and exact note/photo outcomes. Close aggregate scope only with all required platform/provider evidence.
- **Code areas (directory-level correlation, not audited):** src/main/desktop-adapters.ts; src/shared/desktop-actions.ts
- **Tier 1 — Engineering-only:** Deterministic native/browser action adapters; only the model-assisted variants inherit TASK-031/032's tier.

### TASK-034 — Repair identity and authoritative metering end to end

*Source: `spec/MASTER.md:2416` &nbsp;|&nbsp; Phase C &nbsp;|&nbsp; Depends on: TASK-005, TASK-015. &nbsp;|&nbsp; Requirements: M2-OPS-01 (People/devices/activity correctly separated); M2-OPS-02 (Correct complete usage and money); M2-STT-04 (Speech metering and actual provider/config provenance)*

- **Do:** Separate people/devices/sessions/operations/attempts and bind identity at event time. Preserve server usage across late client updates, support cumulative provider fields and track speech duration/transport/channel/reconnect pricing with provenance. Make settlement concurrency-safe and content-free.
- **Acceptance (Verify before closing):** All accounting tests pass including late nulls, cross-device rejection, cumulative 1/15/30, real separate attempts, interrupted speech, unknown usage, local/PCC semantics and hard-budget races. No raw payload is saved to recover a charge.
- **Scope/sequencing note:** Repair identity/merge/aggregate foundations with deterministic fixtures immediately; integrate live speech TASK-014/TASK-018 and each decision-provider result when ready. Do not make basic accounting correctness depend on every future connector. Live per-route reconciliation remains required.
- **Code areas (directory-level correlation, not audited):** operator/src/ (ledger/metering); operator/src/d1.ts
- **Tier 1 — Engineering-only:** Ledger/accounting logic on existing Operator D1.

### TASK-035 — Implement the governed canonical knowledge service

*Source: `spec/MASTER.md:2436` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-006, TASK-007, TASK-015. &nbsp;|&nbsp; Requirements: M2-KNOW-02 (Canonical knowledge authority, versions and field provenance); M2-KNOW-04 (Always-available authorized context service); M2-GOV-02 (Content, control artifacts and metadata kept separate)*

- **Do:** Implement scoped versioned reads/mutations against the selected approved knowledge store. Support expected-revision writes, immutable evidence references, idempotent commits and read-your-write. Deploy only in the authorized organizational environment.
- **Acceptance (Verify before closing):** Real two-principal reads and concurrent writes demonstrate isolation and no lost updates. Sleeping-device behavior matches the chosen service contract. Content/keys do not enter prohibited Cloudflare stores.
- **Scope/sequencing note:** Use the content-free event contract now and integrate actual ledger presentation with TASK-034. Do not wait for Jev/Laya provisioning merely to build canonical authorized writes. Prove supported backing-store CAS and lost-event repair rather than assume multi-system transactions.
- **Code areas (directory-level correlation, not audited):** src/main/brain/; operator/src/d1.ts
- **Tier 1 — Engineering-only:** Deploys into the store TASK-007 already selected.

### TASK-036 — Build deterministic wiki and graph projections

*Source: `spec/MASTER.md:2456` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-035. &nbsp;|&nbsp; Requirements: M2-KNOW-03 (Scoped rebuildable wiki/graph projections); M2-KNOW-05 (Knowledge correction, revocation and deletion convergence)*

- **Do:** Extend the existing wiki exporter and qualify Graphify where useful. Preserve strict verified-field gates, confidentiality exclusions, source revisions and scoped edges. Add incremental/atomic refresh and safe stale/rebuild states.
- **Acceptance (Verify before closing):** Regeneration preserves authorized canonical edits, rejects malicious documents and does not widen audiences. Partial rebuild, deleted source and circular generated-evidence cases pass; plaintext sharing is explicit.
- **Code areas (directory-level correlation, not audited):** src/main/graphify.ts; src/main/brain/publish.ts
- **Tier 1 — Engineering-only:** Projection/export logic on existing graphify.ts.

### TASK-037 — Implement the authorized evidence context builder

*Source: `spec/MASTER.md:2470` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-035, TASK-036. &nbsp;|&nbsp; Requirements: M2-KNOW-01 (Bounded authorized evidence-based Intelligence); M2-KNOW-04 (Always-available authorized context service); M2-GOV-02 (Content, control artifacts and metadata kept separate)*

- **Do:** Build bounded source-linked search/context with before-retrieval authorization, source revisions, dates, evidence labels, output-audience checks and safe cache keys. Start from working existing retrieval before adding new infrastructure.
- **Acceptance (Verify before closing):** Permission/confidentiality/negation/conflict/staleness fixtures and measured query budgets pass. Model input contains no unauthorized source and the result cites real permitted evidence.
- **Code areas (directory-level correlation, not audited):** src/main/brain/context.ts; intelligence/src/lib/
- **Tier 1 — Engineering-only:** Retrieval/context logic.

### TASK-038 — Deploy and connect Dust knowledge read tools

*Source: `spec/MASTER.md:2488` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-006, TASK-035, TASK-037. &nbsp;|&nbsp; Requirements: M2-DUST-01 (Authenticated Dust read and attribution); M2-DUST-03 (Dust retention and cross-system convergence)*

- **Do:** Implement bounded remote MCP read/search/change/explain tools. Configure a permitted Dust workspace with personal OAuth or explicitly scoped service identity, correct region/callbacks and reviewed retention. Do not rely on user identity supplied in tool JSON.
- **Acceptance (Verify before closing):** A real Dust agent retrieves authorized meeting context with verified citations; another principal cannot access it. Disconnect/revoke, wrong audience and unavailable source tests pass; supplier limitations remain explicit.
- **Code areas (directory-level correlation, not audited):** src/main/llm/dust.ts; src/main/llm/dust-attachments.ts
- **Tier 2 — Owner/internal policy decision:** "Configure a permitted Dust workspace with personal OAuth or explicitly scoped service identity" — per Tony's memory a Dust workspace (<redacted-account-id>) and manager stack already exist, so this is most likely reusing that workspace and registering a new OAuth/service identity plus a retention decision inside it — an owner configuration step, not a brand-new vendor signup.

### TASK-039 — Implement real Dust writes and reviewed corrections

*Source: `spec/MASTER.md:2502` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-035, TASK-038. &nbsp;|&nbsp; Requirements: M2-DUST-02 (Safe working Dust writes); M2-KNOW-05 (Knowledge correction, revocation and deletion convergence)*

- **Do:** Expose typed allowed action mutations plus high-impact change proposals. Enforce roles, expected revision, idempotency, exact approval, state readback and projection refresh. Do not let agents edit generated pages or self-verify financial fields.
- **Acceptance (Verify before closing):** Real Dust writes survive regeneration and appear in Intelligence. Two agents/human conflict, timeout replay, rejected pinned-field change and pending-approval versus committed states are demonstrated.
- **Code areas (directory-level correlation, not audited):** src/main/llm/dust.ts; src/main/brain/corrections.ts
- **Tier 1 — Engineering-only:** Builds on TASK-038's already-configured workspace.

### TASK-040 — Rework Intelligence into an evidence-first workspace

*Source: `spec/MASTER.md:2520` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-008, TASK-036, TASK-037. &nbsp;|&nbsp; Requirements: M2-KNOW-01 (Bounded authorized evidence-based Intelligence); M2-SET-01 (Simple everyday Settings and progressive disclosure)*

- **Do:** Implement clear briefings, meetings/actions, review inbox, conflicts/stale sources and evidence drawer. Keep the graph advanced. Preserve the original Jev/Laya Intelligence classification capability and deterministic business calculations, not only record browsing. Make corrections, sharing audience and true source availability visible with native-compatible access semantics.
- **Acceptance (Verify before closing):** Actual nontechnical flows retrieve, verify, correct and explain records. Accessibility, multilingual names, differing audiences and no-available-source cases pass; concept fixtures are not presented as live records.
- **Scope/sequencing note:** Implement canonical UI reads/edits without waiting for Dust approval. Then integrate TASK-039 write readback and the TASK-031/TASK-032 decision routes. Close facts → assessments → explanations, multi-scope coverage, clock-driven deadlines, currency handling and late-result rejection against section 17.11.
- **Code areas (directory-level correlation, not audited):** intelligence/src/views/; intelligence/src/lib/
- **Tier 1 — Engineering-only:** UI/workspace logic on existing Intelligence app.

### TASK-041 — Close knowledge synchronization and deletion loops

*Source: `spec/MASTER.md:2536` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-039, TASK-040. &nbsp;|&nbsp; Requirements: M2-KNOW-05 (Knowledge correction, revocation and deletion convergence); M2-DUST-03 (Dust retention and cross-system convergence); M2-GOV-02 (Content, control artifacts and metadata kept separate)*

- **Do:** Implement scoped delta reconciliation, correction propagation, tombstones, confidential-source exclusion and revoked-reader blocking across canonical, wiki, graph, caches and configured external replicas. Prevent stale-device/backup resurrection.
- **Acceptance (Verify before closing):** Real edits from either surface converge. Revocation blocks reads before cleanup completes, and rights/deletion status honestly names third-party/legal-hold limits. No wildcard delete or plaintext export shortcut.
- **Code areas (directory-level correlation, not audited):** src/main/brain/consolidate.ts; src/main/erasure-completeness.contract.test.ts
- **Tier 1 — Engineering-only:** Sync/reconciliation logic.

### TASK-042 — Implement versioned server skill authoring and publishing

*Source: `spec/MASTER.md:2554` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-009, TASK-015. &nbsp;|&nbsp; Requirements: M2-SKILL-01 (Central versioned skill lifecycle); M2-SKILL-03 (Catalog freshness and attributable skill usage)*

- **Do:** Extend Operator with draft validation, synthetic evals, review, canary, immutable published versions and revocation/rollback. Pin dependencies and deny unreviewed executable uploads. Move existing distribution semantics through a compatible migration.
- **Acceptance (Verify before closing):** Publish/update/revoke/rollback a synthetic skill in actual staging. Catalog/review evidence and historical version integrity hold; no client installation is required for approved instruction updates.
- **Scope/sequencing note:** Author/catalog/publishing tests use synthetic definitions independently of an always-on knowledge store. Contextual execution depends on TASK-037 through TASK-043; publishing alone does not qualify execution.
- **Code areas (directory-level correlation, not audited):** operator/src/ (skill publishing — not directly located)
- **Tier 1 — Engineering-only:** Server-side skill publishing pipeline.

### TASK-043 — Implement contextual server skill execution

*Source: `spec/MASTER.md:2570` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-009, TASK-015, TASK-034, TASK-037, TASK-042. &nbsp;|&nbsp; Requirements: M2-SKILL-02 (Server-side governed skill execution); M2-SKILL-03 (Catalog freshness and attributable skill usage); M2-GOV-02 (Content, control artifacts and metadata kept separate)*

- **Do:** Run typed workflows on the approved server path with pinned versions, scoped context/tool permissions, budgets, cancellation and outputs. Use reviewed isolated compute only where necessary; keep user payload out of Cloudflare durable state.
- **Acceptance (Verify before closing):** Real retrieval/inference/tool execution and denied-scope/cancellation/mid-run update tests pass. Only authorized low-risk mutations commit; desktop actions still require local trusted authority and verification.
- **Scope/sequencing note:** Use only the real ready provider(s) needed by the selected skill. Qualify Jev/Laya-assisted steps with TASK-031/TASK-032; do not require both credentials for a deterministic or generative-only synthetic skill. All promised provider variants remain tracked separately.
- **Code areas (directory-level correlation, not audited):** operator/src/ (skill execution — not directly located)
- **Tier 1 — Engineering-only:** Server-side skill execution; model-assisted steps inherit TASK-031/032.

### TASK-044 — Connect the user skill catalog and versioned run receipts

*Source: `spec/MASTER.md:2590` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-008, TASK-022, TASK-043. &nbsp;|&nbsp; Requirements: M2-SKILL-03 (Catalog freshness and attributable skill usage); M2-SET-01 (Simple everyday Settings and progressive disclosure)*

- **Do:** Add small curated/favorite skills and contextual selection to desktop/native and the server interface. Show entitled/ready/unavailable/offline states; emit real run/version/attempt usage and safe failure evidence.
- **Acceptance (Verify before closing):** A newly published skill appears without reinstall. An active run stays pinned, a revoked cached skill fails, and retry usage is not counted twice. Ordinary users never need raw vendor/API controls.
- **Code areas (directory-level correlation, not audited):** src/renderer/src/components/; src/preload/index.ts
- **Tier 1 — Engineering-only:** Client/server catalog UI.

### TASK-045 — Repair portal totals, speech controls and data-health UX

*Source: `spec/MASTER.md:2608` &nbsp;|&nbsp; Phase D &nbsp;|&nbsp; Depends on: TASK-005, TASK-015, TASK-034. &nbsp;|&nbsp; Requirements: M2-OPS-01 (People/devices/activity correctly separated); M2-OPS-02 (Correct complete usage and money); M2-STT-04 (Speech metering and actual provider/config provenance); M2-PRIV-03 (Content-free diagnostics and finite metadata retention)*

- **Do:** Use database full-window aggregates independent of detail pagination. Add real Cloudflare speech readiness/config/privacy revision, device-qualified local state and accurate Jev/Laya settings. Integrate published skill version/run accounting, knowledge freshness, Dust service health and meeting assistant states. Keep people, bots, devices and activity distinct. Display partial/unavailable/estimated usage distinctly; enforce role scope in queries, exports and caches.
- **Acceptance (Verify before closing):** At least 2,001 synthetic attempts reconcile across rows/KPI/chart/export. One user/two devices remains one user. Portal labels match actual backend selection; data failures cannot look like no activity or zero spend.
- **Scope/sequencing note:** The .CORE slice repairs users, usage totals, errors and completeness first. Add local/decision panes with TASK-022/TASK-025/TASK-031/TASK-032 and knowledge/skill panes with TASK-040/TASK-041/TASK-044 as they become ready. Final .ALL evidence must exercise every advertised pane; a placeholder is not integration.
- **Code areas (directory-level correlation, not audited):** operator/src/routes/admin-core.ts; operator/src/charts.ts
- **Tier 1 — Engineering-only:** Portal UI/query logic on existing D1.

### TASK-046 — Build Teams personal and meeting surfaces with SSO

*Source: `spec/MASTER.md:2628` &nbsp;|&nbsp; Phase E &nbsp;|&nbsp; Depends on: TASK-006, TASK-008. &nbsp;|&nbsp; Requirements: M2-TEAMS-01 (Teams app plus verified Entra identity); M2-SET-01 (Simple everyday Settings and progressive disclosure)*

- **Do:** Create the actual Teams package, personal tab and meeting side panel with authenticated service calls, clear presence/capture controls and private-by-default outputs. Preserve standalone apps; do not expose Electron IPC or direct local control.
- **Acceptance (Verify before closing):** Authorized installed Teams test app works under proper identity. Guest/wrong-tenant, untrusted deep link, shared-stage audience and narrow-panel accessibility tests pass. Tab functionality is not recorded as media joining.
- **Scope/sequencing note:** SSO, app packaging and an authenticated empty/error-state shell can be built before the whole portal. Integrate real knowledge and skills after TASK-037/TASK-044 and operations with TASK-045. Do not claim app installation is proof of joining or media access.
- **Code areas (directory-level correlation, not audited):** (Teams app package — not found under this name in repo)
- **Tier 3 — External account / tenant / signing / vendor:** "Create the actual Teams package" — a Teams app manifest must be installed/sideloaded into the Microsoft 365 tenant's app catalog by a tenant admin, alongside a new Entra SSO registration.

### TASK-047 — Implement enrolled meeting discovery and actual-start events

*Source: `spec/MASTER.md:2640` &nbsp;|&nbsp; Phase E &nbsp;|&nbsp; Depends on: TASK-010, TASK-046. &nbsp;|&nbsp; Requirements: M2-TEAMS-02 (Eligible actual-start automatic attendance); M2-TEAMS-05 (Honest cross-platform meeting capability matrix)*

- **Do:** Implement authorized subscriptions/installation and calendar discovery only as needed. Verify callbacks, renewals, lifecycle notifications, recurrence mapping and event coverage. Add explicit auto-attend enable/skip/pause and exclusions.
- **Acceptance (Verify before closing):** Actual supported start—not scheduled clock alone—triggers eligibility. Reschedule/cancel/replay, late installation, unsupported type and privacy exclusions produce correct states without tenant-wide recording.
- **Code areas (directory-level correlation, not audited):** src/main/calendar.test.ts (calendar hooks exist; Teams-subscription code not located)
- **Tier 3 — External account / tenant / signing / vendor:** "Implement authorized subscriptions/installation and calendar discovery" — Microsoft Graph change-notification subscriptions on calendars/online meetings require tenant admin consent for the relevant Graph scopes.

### TASK-048 — Implement single-occurrence join coordination and admission

*Source: `spec/MASTER.md:2654` &nbsp;|&nbsp; Phase E &nbsp;|&nbsp; Depends on: TASK-047. &nbsp;|&nbsp; Requirements: M2-TEAMS-02 (Eligible actual-start automatic attendance); M2-TEAMS-04 (Visible consent-aware capture and audience-safe output)*

- **Do:** Build metadata-only leases/fencing, idempotent join requests, actual call-state reconciliation, lobby/denial/removal handling, bounds and graceful leave. Deduplicate enrolled colleagues under the approved tenant/occurrence scope.
- **Acceptance (Verify before closing):** Two simultaneous triggers create one intended assistant/capture ownership. Ambiguous join timeout, organizer denial, removal, ended/no-host meeting and worker failover do not cause hidden reentry or duplicate capture.
- **Code areas (directory-level correlation, not audited):** (join/admission — not directly located)
- **Tier 1* — Engineering-only (transitive caveat — see note):** Coordination/locking logic once TASK-047's subscriptions exist.

### TASK-049 — Deploy the qualified Teams media receiver

*Source: `spec/MASTER.md:2666` &nbsp;|&nbsp; Phase E &nbsp;|&nbsp; Depends on: TASK-010, TASK-012, TASK-015, TASK-048. &nbsp;|&nbsp; Requirements: M2-TEAMS-03 (Qualified real Teams media service); M2-GOV-01 (Deployment-specific privacy/GDPR decision evidence)*

- **Do:** Implement the supported media SDK on the authorized required hosting platform. Apply least-privilege app/media permissions, lifecycle/capacity controls and recording-status/derived-data prerequisites. Disable media payload dumps and persistent audio.
- **Acceptance (Verify before closing):** Actual test-tenant admission/media prerequisites are proven or specifically blocked. A 201 call response or successful web app deployment is not audio evidence. Unsupported policy/status routes stay disabled.
- **Code areas (directory-level correlation, not audited):** (Teams media SDK receiver — not directly located)
- **Tier 3 — External account / tenant / signing / vendor:** "Implement the supported media SDK on the authorized required hosting platform... recording-status/derived-data prerequisites" — real-time meeting media access (Graph cloud communications / Azure Communication Services) is a Microsoft-gated capability that historically needs a reviewed/approved application, not a self-serve toggle.

### TASK-050 — Connect consent-aware Teams media to Cloudflare speech

*Source: `spec/MASTER.md:2676` &nbsp;|&nbsp; Phase E &nbsp;|&nbsp; Depends on: TASK-016, TASK-018, TASK-020, TASK-049. &nbsp;|&nbsp; Requirements: M2-TEAMS-03 (Qualified real Teams media service); M2-TEAMS-04 (Visible consent-aware capture and audience-safe output); M2-STT-03 (Efficient purpose-specific tracks and bounded streams)*

- **Do:** Connect permitted media frames through the same qualified speech broker, source/time/generation contracts and no-content-persistence controls. Coordinate source lease with desktop capture, notices, pause/removal and finite flush/cleanup.
- **Acceptance (Verify before closing):** Actual allowed meeting audio yields transcript without duplicate source/speech charges. Removal/revocation stops new processing; remote utterances cannot control desktops. Content-sentinel tests include receiver/transport errors.
- **Code areas (directory-level correlation, not audited):** src/main/cloud-stt/; (Teams bridge — not directly located)
- **Tier 1* — Engineering-only (transitive caveat — see note):** Bridges already-approved media (049) into the already-built Cloudflare speech path (016-020).

### TASK-051 — Qualify post-meeting alternatives and other meeting adapters

*Source: `spec/MASTER.md:2686` &nbsp;|&nbsp; Phase E &nbsp;|&nbsp; Depends on: TASK-010, TASK-047. &nbsp;|&nbsp; Requirements: M2-TEAMS-05 (Honest cross-platform meeting capability matrix); M2-GOV-01 (Deployment-specific privacy/GDPR decision evidence)*

- **Do:** Implement allowed source adapters/capability flags for post-meeting Microsoft transcript access and evaluate Zoom RTMS/Google Meet official media routes. Verify permissions, current program/plan constraints, disclosure, costs and supported meeting types.
- **Acceptance (Verify before closing):** Every requested platform has a precise supported/blocked/unsupported disposition and tested interface. No stealth universal browser bot, fake participant label or automatic external recording download substitutes for a missing API.
- **Code areas (directory-level correlation, not audited):** (Zoom/Meet adapters — not directly located)
- **Tier 3 — External account / tenant / signing / vendor:** "Evaluate Zoom RTMS/Google Meet official media routes" — needs a Zoom marketplace developer account/app review and Google Cloud/Workspace Meet API enablement.

### TASK-052 — Publish meeting knowledge and skill outputs to the right audience

*Source: `spec/MASTER.md:2696` &nbsp;|&nbsp; Phase E &nbsp;|&nbsp; Depends on: TASK-041, TASK-043. &nbsp;|&nbsp; Requirements: M2-TEAMS-04 (Visible consent-aware capture and audience-safe output); M2-KNOW-02 (Canonical knowledge authority, versions and field provenance); M2-GOV-02 (Content, control artifacts and metadata kept separate)*

- **Do:** Save only approved summaries/actions to canonical knowledge; resolve individual versus team/meeting audience before cards/links. Coordinate laptop-off service operation, source handover, citation/identity uncertainty and safe output publication.
- **Acceptance (Verify before closing):** Real permitted output appears in Intelligence and Dust with correct revision/access. External attendees cannot open restricted sources; a silent desktop does not block the qualified server or spawn another source.
- **Scope/sequencing note:** Add the actual source-specific prerequisite: TASK-050 for live Teams or the particular qualified TASK-051 import/other-platform adapter. Do not require every platform before publishing a permitted source. Full live Teams acceptance cannot be substituted with post-meeting data.
- **Code areas (directory-level correlation, not audited):** src/main/brain/publish.ts
- **Tier 1 — Engineering-only:** Publishing logic on existing knowledge/Dust plumbing.

### TASK-053 — Qualify transcript fidelity and speech latency

*Source: `spec/MASTER.md:2708` &nbsp;|&nbsp; Phase F &nbsp;|&nbsp; Depends on: TASK-011, TASK-016, TASK-017, TASK-018, TASK-020. &nbsp;|&nbsp; Requirements: M2-ASR-02 (Qualified transcript/summary quality); M2-STT-03 (Efficient purpose-specific tracks and bounded streams)*

- **Do:** Build the permissioned, versioned holdout/scoring harness and freeze normalization, primary slices, non-inferiority margins, critical-error definitions and evidence sufficiency before scoring. Include exact target/intent accuracy and completed/refused/clarified denominators. Test Cloudflare primary configurations per language/noise/device, names/numbers/negations/silence/overlap and meeting versus command endpointing. Compare alternatives only within approved evaluation terms.
- **Acceptance (Verify before closing):** Measured slices, sample counts, confidence limits, p50/p95/p99 and failure denominators support the advertised scope. No universal irrefutability claim, hidden slow/error exclusions or overwritten uncertain words. Failed slices trigger correction or an approved narrowed capability, not cosmetic green.
- **Code areas (directory-level correlation, not audited):** scripts/ (eval harness — not directly located)
- **Tier 1 — Engineering-only:** Evaluation harness against the already-provisioned Cloudflare route.

### TASK-054 — Verify summaries, knowledge and sync without cloud content copies

*Source: `spec/MASTER.md:2722` &nbsp;|&nbsp; Phase F &nbsp;|&nbsp; Depends on: TASK-005, TASK-018, TASK-034, TASK-041, TASK-043, TASK-053. &nbsp;|&nbsp; Requirements: M2-KNOW-01 (Bounded authorized evidence-based Intelligence); M2-DATA-01 (Existing data and retention preserved); M2-PRIV-01 (No controlled cloud content persistence)*

- **Do:** Requalify the implemented shared knowledge/Dust/skill path, while preserving the selected second brain/OneDrive encryption/provenance flow. Separate provisional recognition, correction and generated summaries, with bounded authorized context and cache invalidation. Audit temporary files, exports, Graphify helpers and summary-only cleanup.
- **Acceptance (Verify before closing):** Existing-data upgrades, correction/deletion/revocation, sync conflicts and confidential-source exclusions pass. No raw transcript archive or Cloudflare recording/result cache is introduced to improve recall or accuracy.
- **Code areas (directory-level correlation, not audited):** src/main/brain/; src/main/graphify.ts
- **Tier 1 — Engineering-only:** Verification logic on existing knowledge/Dust/sync code.

### TASK-055 — Prove the full meeting, Dust and skill journey

*Source: `spec/MASTER.md:2736` &nbsp;|&nbsp; Phase F &nbsp;|&nbsp; Depends on: TASK-040, TASK-044, TASK-045, TASK-050, TASK-052, TASK-053, TASK-054. &nbsp;|&nbsp; Requirements: M2-E2E-02 (Meeting-to-knowledge-to-Dust-to-skill full-chain proof); M2-DUST-02 (Safe working Dust writes); M2-SKILL-03 (Catalog freshness and attributable skill usage); M2-SET-01 (Simple everyday Settings and progressive disclosure)*

- **Do:** Run an uncut permitted Teams scenario through visible join, capture protocol, Cloudflare transcript, approved knowledge, real Dust read/write, updated human view, published skill version and portal receipt. Execute Settings task study and multiple-principal negative cases.
- **Acceptance (Verify before closing):** Evidence ties real meeting/session/run/revision/actor identities to actual outcomes and measured UX. No fixture-filled portal or simulated graph updates count. Blocked platform prerequisites remain visible, not quietly omitted.
- **Scope/sequencing note:** This is the live Teams end-to-end slice, so TASK-050 is mandatory for that claim. Where live Teams is blocked, record the blocked prerequisite and independently test the permitted import slice without calling it live.
- **Code areas (directory-level correlation, not audited):** (cross-cutting E2E)
- **Tier 3* — External (partial — see note):** The task itself says the live-Teams claim is "mandatory" only via TASK-050 — so it is engineering-only for the import-only slice but transitively blocked by TASK-049's tier-3 media-access gate for its primary (live Teams) claim.

### TASK-056 — Run real cross-platform Cloudflare-to-action-to-portal journeys

*Source: `spec/MASTER.md:2759` &nbsp;|&nbsp; Phase F &nbsp;|&nbsp; Depends on: TASK-027, TASK-030, TASK-033, TASK-034, TASK-045, TASK-053, TASK-054. &nbsp;|&nbsp; Requirements: M2-E2E-01 (Deployed Cloudflare speech-to-action-to-portal proof)*

- **Do:** Use identified packaged Windows and native Mac QA clients against the authorized deployed backend. Demonstrate wake/caption/real speech/actual Jev and Laya decision/verified action/closed session/reconciled portal metadata, plus a consented meeting and explicit offline/local cases.
- **Acceptance (Verify before closing):** Uncut native recordings and sanitized per-operation receipts prove the full chain and real versions. Pure tests, model responses, a dev browser or a fixture-filled portal do not substitute. Record Windows and Mac results independently.
- **Scope/sequencing note:** Run .WIN and .MAC separately; .MAC needs TASK-029. Desktop command proof does not wait for TASK-055 Teams participation. Include both actual Jev and Laya paths, but do not pretend the deterministic path uses a provider it did not call.
- **Code areas (directory-level correlation, not audited):** (cross-cutting E2E, Windows/Mac QA clients)
- **Tier 1* — Engineering-only (transitive caveat — see note):** Test-execution task; the deterministic/Windows/Mac core is engineering-only, the Jev/Laya paths inherit 031/032.

### TASK-057 — Close no-content-retention and drift-evidence gates

*Source: `spec/MASTER.md:2782` &nbsp;|&nbsp; Phase F &nbsp;|&nbsp; Depends on: TASK-011, TASK-013, TASK-015, TASK-020, TASK-034, TASK-045, TASK-054, TASK-056. &nbsp;|&nbsp; Requirements: M2-PRIV-01 (No controlled cloud content persistence); M2-PRIV-02 (Route-specific provider assurance and no silent downgrade); M2-PRIV-03 (Content-free diagnostics and finite metadata retention)*

- **Do:** Run synthetic sentinel tests over every active speech/follow-on route and controlled sink on success/error/retry/cancel/revocation. Read back configuration, verify supported WS controls, approved supplier assurance and finite metadata retention. Implement authorized configuration-drift checks and fail-closed new-session readiness.
- **Acceptance (Verify before closing):** No controlled sink contains test content, while approved usage still reconciles. Config/evidence revision and supplier limitations are explicit. Do not claim invisible provider infrastructure was inspected or erase historic content without an authorized remediation decision.
- **Scope/sequencing note:** Close .CORE privacy independently. For enabled live Teams include TASK-049/TASK-050/TASK-055 and all receiver sinks; for Dust/skills include their actual connected handling. Unqualified new routes remain disabled and visible as blockers; never weaken privacy to close a parent task.
- **Code areas (directory-level correlation, not audited):** operator/src/ (sentinel/log sinks)
- **Tier 2 — Owner/internal policy decision:** "approved supplier assurance" and configuration-drift checks likely need a signed Data Processing Addendum / ZDR confirmation from Cloudflare/Deepgram — an owner/legal sign-off on paperwork already in force, not new engineering.

### TASK-058 — Complete governance, subject rights and sharing qualification

*Source: `spec/MASTER.md:2805` &nbsp;|&nbsp; Phase F &nbsp;|&nbsp; Depends on: TASK-006, TASK-007, TASK-041, TASK-057. &nbsp;|&nbsp; Requirements: M2-GOV-01 (Deployment-specific privacy/GDPR decision evidence); M2-GOV-02 (Content, control artifacts and metadata kept separate); M2-DUST-03 (Dust retention and cross-system convergence)*

- **Do:** Implement approved notice/rights/retention procedures and exercise access/correction/deletion across source/wiki/graph/Dust/Teams publication. Obtain authorized purpose/party/transfer/contract/DPIA decisions; record held records and supplier limits.
- **Acceptance (Verify before closing):** Controls are tested with synthetic subjects and actual permissions. Lawful basis/approval gaps are owner-held blockers. No GDPR badge or absolute deletion/retention claim is fabricated from Teams presence or empty log results.
- **Scope/sequencing note:** Privacy owners decide each purpose/route before customer-content processing, not only at this final sweep. The .TEAMS slice additionally consumes TASK-055. A blocked meeting route cannot delay independent implementation or masquerade as governance approved.
- **Code areas (directory-level correlation, not audited):** operator/src/export/; (governance/DPIA — largely process, not code)
- **Tier 3 — External account / tenant / signing / vendor:** "Obtain authorized purpose/party/transfer/contract/DPIA decisions" — explicit legal/privacy-counsel and possibly external DPA negotiation.

### TASK-059 — Qualify optional local packs on actual device classes

*Source: `spec/MASTER.md:2825` &nbsp;|&nbsp; Phase F &nbsp;|&nbsp; Depends on: TASK-021, TASK-022, TASK-024, TASK-025, TASK-053. &nbsp;|&nbsp; Requirements: M2-LOCAL-01 (Optional separate local speech/generation Settings); M2-LOCAL-02 (Device-qualified model selection and resource limits)*

- **Do:** Test representative eligible Windows/native Mac classes using the same quality harness and resource envelopes. Verify post-install self-test, offline operation, unload/remove, unavailable accelerator, memory/thermal pressure, unsupported language and download contention during capture.
- **Acceptance (Verify before closing):** Each offered pack has actual compatibility/quality/realtime-factor evidence or a clear unsupported status. Local-only has no speech egress; core default never downloads/loads packs. Hardware detection is not portrayed as a benchmark.
- **Scope/sequencing note:** Qualify each actual Windows/native Mac device/profile separately; .MAC requires TASK-029. A missing accelerator or optional pack is not a pass; do not block the lean cloud core by installing every pack on every device.
- **Code areas (directory-level correlation, not audited):** src/main/llm/local-models.ts
- **Tier 1 — Engineering-only:** Device-class testing on owned hardware.

### TASK-060 — Tune speed and footprint against the recorded baseline

*Source: `spec/MASTER.md:2835` &nbsp;|&nbsp; Phase F &nbsp;|&nbsp; Depends on: TASK-004, TASK-026, TASK-030, TASK-053, TASK-056, TASK-059. &nbsp;|&nbsp; Requirements: M2-PKG-01 (Genuinely lightweight default installation); M2-VOICE-02 (Fast visible command bar and local cancellation); M2-STT-03 (Efficient purpose-specific tracks and bounded streams)*

- **Do:** Profile the complete process tree and critical path. Remove duplicate sockets/work, per-sample rendering, excessive model calls, heavy startup loads and unnecessary resource copies. Bound downloads and background work during capture. Re-measure warm/cold and healthy/degraded conditions.
- **Acceptance (Verify before closing):** Before/after bytes, startup, RAM/CPU, speech/decision/action latency and two-hour soak results support each claimed gain. Document approved budget exceptions; never trade fidelity, retention, approval or signature validation for faster numbers.
- **Scope/sequencing note:** Profile core platform slices independently. Add TASK-055 performance when live Teams is enabled, including whole-service capacity, queue fairness and join/admission boundaries. Do not exclude slower/failed runs or hide disk use in caches.
- **Code areas (directory-level correlation, not audited):** (profiling — cross-cutting)
- **Tier 1 — Engineering-only:** Profiling/tuning.

### TASK-061 — Apply the supplied refactoring skill in bounded slices

*Source: `spec/MASTER.md:2855` &nbsp;|&nbsp; Phase G &nbsp;|&nbsp; Depends on: TASK-001, TASK-002, TASK-003, TASK-005. &nbsp;|&nbsp; Requirements: M2-ENG-01 (Maintainable refactor and fresh engineering memory)*

- **Do:** Read the real provided skill and use Ponytail only as complementary guidance. Refactor oversized/duplicated responsibilities around tested boundaries, keeping local/cloud/native policy semantics shared. Update source graph, numbered lessons and task relay after each accepted slice.
- **Acceptance (Verify before closing):** Behavioral, security, quality and dependency tests stay green. Report maintainability and actual engineering-token/search overhead changes; do not remove guards/tests to lower line counts or label file moves an architecture improvement.
- **Scope/sequencing note:** **Slice entry:** characterize the affected behavior and inspect the supplied skill before each refactor. Work can proceed alongside completed feature slices; no requirement to wait for Teams approvals. **Final closure:** perform an integrated dependency/security/regression review after all included repairs, UI, knowledge and performance changes; TASK-063 consumes that final closure, not an early partial pass.
- **Code areas (directory-level correlation, not audited):** (repo-wide refactor)
- **Tier 1 — Engineering-only:** Refactor with regression tests.

### TASK-062 — Exercise production operations, staging and recovery

*Source: `spec/MASTER.md:2878` &nbsp;|&nbsp; Phase G &nbsp;|&nbsp; Depends on: TASK-012, TASK-023, TASK-034, TASK-045, TASK-057, TASK-058, TASK-060, TASK-061. &nbsp;|&nbsp; Requirements: M2-OPS-03 (Operational diagnostics and recovery); M2-SEC-02 (Effective auth/egress/tool/approval boundaries)*

- **Do:** Include authorized knowledge-service, skill-service and meeting-service deployment/readback, least-privilege identities and content-free runtime controls. Complete safe monitoring, model/config drift alarms, budget/ingestion health, capability kill switches, canary policy, credential rotation runbooks and isolated database restore/rollback exercises. Confirm scopes/environment names and explicit recovery objectives. After approved backup/migration and staging checks, deploy the reviewed Worker, portal bundle, bindings and schema to the actual authorized Operator production/canary environment; read back deployed IDs and privacy controls. A staging-only success is not production completion.
- **Acceptance (Verify before closing):** Real sanitized alert/restore/canary evidence exists. Backups/queues include only allowed metadata/config; product content is not captured for observability. No background job is claimed until it has actually been configured with authorization.
- **Scope/sequencing note:** Exercise shared operations and the services included in the release. Enabled meeting-service production also requires TASK-052/TASK-055. Record preflight signing access from TASK-002 and backend-before-client compatibility. A blocked unrelated vendor cannot justify skipping required shared restore/alert tests.
- **Code areas (directory-level correlation, not audited):** operator/wrangler.jsonc; operator/scripts/
- **Tier 2 — Owner/internal policy decision:** "deploy the reviewed Worker, portal bundle, bindings and schema to the actual authorized Operator production/canary environment" — a production cut-over needs the account owner's go/no-go, even though the Cloudflare account itself already exists.

### TASK-063 — Build, sign, freeze and qualify the immutable candidate family

*Source: `spec/MASTER.md:2901-2903` &nbsp;|&nbsp; Phase G &nbsp;|&nbsp; Depends on: TASK-027, TASK-030, TASK-033, TASK-045, TASK-053, TASK-054, TASK-056, TASK-057, TASK-058, TASK-059, TASK-060, TASK-061, TASK-062. &nbsp;|&nbsp; Requirements: MASTER.md states "All applicable M2 requirements" (line 2903) — a **data-quality gap**: `registry.json`'s `tasks[TASK-063].requirements` array is empty (`[]`, OBSERVED) rather than enumerating the 55 IDs the prose refers to. Every other one of the 66 tasks has a populated `requirements` array; TASK-063 is the only exception. Flag this back to whoever regenerates `registry.json` from MASTER.md — an Opus planner joining on `requirements` (e.g. for traceability or the `owner_commitments`/`golden_flows` cross-references in §6/§7) will silently drop TASK-063 unless this is fixed or worked around.*

- **Do:** Build from an identified reviewed checkout with locked dependencies/manifests. Use the legitimate configured Windows signer/timestamp service for the relevant runtime/helpers and installer; verify signatures, then freeze final artifact hashes before running customer-candidate native acceptance. A Mac QA candidate is separately identified under its permitted development-signing policy. Run the complete relevant 112-use-case/adversarial matrix and final package/security/inventory tests. Record per-platform/per-profile source, artifact hashes, backend/schema versions and all blocked/skipped evidence.
- **Acceptance (Verify before closing):** No mutable branch label, PR head metadata or rebuilt same-name file substitutes for actual provenance. Shared/privacy gates pass. Unqualified profiles stay unavailable. Mac public credentials are not demanded to qualify the independent Windows lane.
- **Scope/sequencing note:** Create separate .WIN and .MAC candidate records. Include TASK-055 for an advertised live Teams release. Build/sign/timestamp the Windows candidate **before** final hashing and final native acceptance. Freeze immutable backend/policy/schema/component compatibility too. No full-scope completion while a required integration is hidden as a disabled flag.
- **Code areas (directory-level correlation, not audited):** scripts/ (build/sign pipeline)
- **Tier 3 — External account / tenant / signing / vendor:** "Use the legitimate configured Windows signer/timestamp service" — needs a Windows code-signing certificate (EV cert or a cloud signing service) and a timestamp authority, i.e. a CA/vendor relationship that must exist or be purchased.

### TASK-064 — Verify and publish the already signed Windows candidate

*Source: `spec/MASTER.md:2924` &nbsp;|&nbsp; Phase G &nbsp;|&nbsp; Depends on: TASK-063. &nbsp;|&nbsp; Requirements: M2-WIN-01 (Qualified signed Windows 2.0 release); M2-REL-01 (Independent honest platform release states)*

- **Do:** Take the exact signed/timestamped Windows artifact frozen and tested in TASK-063. Verify its expected publisher/chain, required timestamp, installer/runtime/helper coverage and hashes. Publish through the authorized release workflow without rebuilding, re-signing or changing its component manifest. Download from the actual customer destination, compare hashes/signatures and validate installed update-feed behavior against the qualified backend.
- **Acceptance (Verify before closing):** Actual GitHub assets, final hashes, signatures/timestamps, native installation/upgrade and deployed backend compatibility evidence are delivered. No unsigned or stale replacement, fake DMG, bypassed security tool or untested rebuild is promoted.
- **Code areas (directory-level correlation, not audited):** .github/ (release workflow)
- **Tier 1* — Engineering-only (transitive caveat — see note):** Publishing/verification of the artifact TASK-063 already signed; blocked transitively until 063's certificate exists.

### TASK-065 — Finalize native Mac QA and its separate Apple publication decision

*Source: `spec/MASTER.md:2945` &nbsp;|&nbsp; Phase G &nbsp;|&nbsp; Depends on: TASK-029, TASK-030, TASK-033, TASK-034, TASK-053, TASK-056, TASK-057, TASK-059, TASK-063. &nbsp;|&nbsp; Requirements: M2-MAC-01 (Genuine native application); M2-MAC-02 (Correct Apple intelligence eligibility/distribution); M2-REL-01 (Independent honest platform release states)*

- **Do:** Finish native parity/migration evidence and the Apple generation/PCC entitlement/distribution decision using actual SDK rules. Cloudflare remains default speech; optional Apple on-device speech has its own selection/qualification. Prepare the correct public artifact only when legitimate Apple inputs exist.
- **Acceptance (Verify before closing):** Report native implemented/tested separately from public signing/notarization/PCC availability. Public DMG stays BLOCKED where inputs are missing; retain controlled authorized QA. This external hold does not block TASK-064 after its own gates pass.
- **Code areas (directory-level correlation, not audited):** native-app/; native/mac-helper/
- **Tier 3 — External account / tenant / signing / vendor:** "the Apple generation/PCC entitlement/distribution decision" and Developer ID notarization are explicit Apple Developer Program dependencies the task itself calls an external hold.

### TASK-066 — Deliver final re-audit, exact evidence and resumable handoff

*Source: `spec/MASTER.md:2966` &nbsp;|&nbsp; Phase G &nbsp;|&nbsp; Depends on: TASK-063. &nbsp;|&nbsp; Requirements: M2-BASE-01 (Pinned, preserved baseline and deployed-state audit); M2-ENG-01 (Maintainable refactor and fresh engineering memory); M2-REL-01 (Independent honest platform release states)*

- **Do:** Close or explicitly disposition every requirement, use case, owner commitment, golden journey and historical finding. Run the section 27 structural/evidence linter and list missing or stale receipts; don't promote every row to VERIFIED from one green test run. Summarize canonical knowledge/projection/Dust collaboration, central skills, simplified Settings, Teams enrollment/media and privacy-rights evidence, alongside Cloudflare default/privacy proof, local device catalog, transcript fidelity, actual portal reconciliation, speed/size, native status and Windows release evidence. Include actual outcomes of TASK-064 and TASK-065 without hiding external holds.
- **Acceptance (Verify before closing):** Deliver source-linked changes, commands/exits, current configuration/SHAs, artifacts and truthful VERIFIED/BLOCKED states. End with relay/CURRENT.md naming the exact next operation for remaining blockers. Do not report the whole product complete when a required enabled journey lacks evidence.
- **Code areas (directory-level correlation, not audited):** docs/ (final report)
- **Tier 1 — Engineering-only:** Documentation/audit rollup of already-produced evidence.

## 4. Engineering-only vs. owner/external-dependency rollup

Three tiers, assigned from the exact "Do"/"Verify before closing" wording of each task (§3 above cites the reasoning per task):

- **Tier 1 — Engineering-only.** No new external account, tenant-admin consent, signing certificate, or owner/legal policy decision is named in the task text; it is buildable and testable by an engineer using access already established by an earlier tier-1 task.
- **Tier 1*  — Engineering-only with a transitive caveat.** Same as tier 1, but the task explicitly inherits part of its scope from a tier-2/3 task (e.g. it builds on credentials tier-3 work must first obtain, or its full closure needs a provider only a tier-3 task can supply); the deterministic/core part can still proceed today.
- **Tier 2 — Owner/internal policy decision.** Needs Tony (or a named internal privacy/legal reviewer) to make an architecture, policy or go/no-go decision. No brand-new external vendor account is implied, but engineering cannot close the task alone.
- **Tier 3 — External account / tenant / signing / vendor.** Needs a new or additional external party: a tenant admin consenting to an app registration, a marketplace review, a signing certificate/CA relationship, or a legal counterparty (DPA, DPIA sign-off with an external subject).

**Tally: 43 pure engineering-only, 6 engineering-only-with-caveat, 5 owner-decision, 12 external-account/vendor** (of 66).

### 4.1 Engineering-only set — 43 tasks, no external account or owner decision needed

TASK-001, TASK-003, TASK-004, TASK-005, TASK-008, TASK-009, TASK-013, TASK-014, TASK-015, TASK-016, TASK-017, TASK-018, TASK-019, TASK-020, TASK-021, TASK-022, TASK-023, TASK-024, TASK-025, TASK-026, TASK-027, TASK-028, TASK-029, TASK-030, TASK-033, TASK-034, TASK-035, TASK-036, TASK-037, TASK-039, TASK-040, TASK-041, TASK-042, TASK-043, TASK-044, TASK-045, TASK-052, TASK-053, TASK-054, TASK-059, TASK-060, TASK-061, TASK-066

### 4.2 Engineering-only with a transitive caveat — 6 tasks

- **TASK-012** — Prepare authorized Cloudflare staging and server credentials: Uses the Cloudflare account already operating Metis in production (OBSERVED: Operator is live) to cut a new scoped Worker/D1 — low-friction, assumes existing account access continues to be available.
- **TASK-031** — Finish the real Jev decision gateway and application: "Complete entitlement, server vault, typed candidate-bound requests" for Jev — OBSERVED: Jev is already integrated in src/main/metis-decide-client.ts (JEV_INTEL_LABELS), so this task completes/hardens an existing vendor relationship rather than establishing a new one; a materially expanded entitlement would move this to tier 3.
- **TASK-048** — Implement single-occurrence join coordination and admission: Coordination/locking logic once TASK-047's subscriptions exist.
- **TASK-050** — Connect consent-aware Teams media to Cloudflare speech: Bridges already-approved media (049) into the already-built Cloudflare speech path (016-020).
- **TASK-056** — Run real cross-platform Cloudflare-to-action-to-portal journeys: Test-execution task; the deterministic/Windows/Mac core is engineering-only, the Jev/Laya paths inherit 031/032.
- **TASK-064** — Verify and publish the already signed Windows candidate: Publishing/verification of the artifact TASK-063 already signed; blocked transitively until 063's certificate exists.

### 4.3 Needs an owner/internal policy decision — 5 tasks

- **TASK-002** — Lock the PRD, effective policies and independent release lanes: "Lock the PRD, effective policies" — locks the no-content-retention claim, threat model and Windows/Mac release path: an owner/product-policy decision, not code.
- **TASK-007** — Lock canonical knowledge, provenance and storage authority: "Select the existing canonical store" and define the plaintext-mirror sharing boundary — an architecture/owner decision (uses existing .brain/OneDrive, so no new vendor).
- **TASK-038** — Deploy and connect Dust knowledge read tools: "Configure a permitted Dust workspace with personal OAuth or explicitly scoped service identity" — per Tony's memory a Dust workspace (<redacted-account-id>) and manager stack already exist, so this is most likely reusing that workspace and registering a new OAuth/service identity plus a retention decision inside it — an owner configuration step, not a brand-new vendor signup.
- **TASK-057** — Close no-content-retention and drift-evidence gates: "approved supplier assurance" and configuration-drift checks likely need a signed Data Processing Addendum / ZDR confirmation from Cloudflare/Deepgram — an owner/legal sign-off on paperwork already in force, not new engineering.
- **TASK-062** — Exercise production operations, staging and recovery: "deploy the reviewed Worker, portal bundle, bindings and schema to the actual authorized Operator production/canary environment" — a production cut-over needs the account owner's go/no-go, even though the Cloudflare account itself already exists.

### 4.4 Needs a new external account, tenant admin, signing cert or vendor/legal counterparty — 12 tasks

- **TASK-006** — Establish cross-surface Entra and service identity: "Register only authorized app audiences/scopes" in Entra — requires an Entra/Azure AD tenant admin to create/consent the app registration.
- **TASK-010** — Qualify meeting APIs, capture permissions and legal prerequisites: "Verify current Teams app/event/join/media rules and actual tenant controls... Record Zoom/Meet capabilities... with scoped admin/privacy review" — needs Microsoft 365 tenant admin plus Zoom/Google program access and a privacy reviewer.
- **TASK-011** — Qualify the exact Cloudflare hosting and privacy route: "Record any unresolved vendor or account entitlement issue" for Workers AI vs. direct Deepgram/BYOK/Unified Billing — a Cloudflare/Deepgram account-entitlement and billing-route decision the vendor or account owner must resolve.
- **TASK-032** — Qualify the Laya alternative and real portal selection: "Deploy only into an authorized suitable serving environment... Missing service credentials/resources are BLOCKED" — DERIVED: no "laya" identifier was found anywhere in src/, operator/, native/, native-app/ or intelligence/, meaning this is a new vendor/hosting relationship to stand up, not a completion of existing work.
- **TASK-046** — Build Teams personal and meeting surfaces with SSO: "Create the actual Teams package" — a Teams app manifest must be installed/sideloaded into the Microsoft 365 tenant's app catalog by a tenant admin, alongside a new Entra SSO registration.
- **TASK-047** — Implement enrolled meeting discovery and actual-start events: "Implement authorized subscriptions/installation and calendar discovery" — Microsoft Graph change-notification subscriptions on calendars/online meetings require tenant admin consent for the relevant Graph scopes.
- **TASK-049** — Deploy the qualified Teams media receiver: "Implement the supported media SDK on the authorized required hosting platform... recording-status/derived-data prerequisites" — real-time meeting media access (Graph cloud communications / Azure Communication Services) is a Microsoft-gated capability that historically needs a reviewed/approved application, not a self-serve toggle.
- **TASK-051** — Qualify post-meeting alternatives and other meeting adapters: "Evaluate Zoom RTMS/Google Meet official media routes" — needs a Zoom marketplace developer account/app review and Google Cloud/Workspace Meet API enablement.
- **TASK-058** — Complete governance, subject rights and sharing qualification: "Obtain authorized purpose/party/transfer/contract/DPIA decisions" — explicit legal/privacy-counsel and possibly external DPA negotiation.
- **TASK-063** — Build, sign, freeze and qualify the immutable candidate family: "Use the legitimate configured Windows signer/timestamp service" — needs a Windows code-signing certificate (EV cert or a cloud signing service) and a timestamp authority, i.e. a CA/vendor relationship that must exist or be purchased.
- **TASK-065** — Finalize native Mac QA and its separate Apple publication decision: "the Apple generation/PCC entitlement/distribution decision" and Developer ID notarization are explicit Apple Developer Program dependencies the task itself calls an external hold.
- **TASK-055** — Prove the full meeting, Dust and skill journey: The task itself says the live-Teams claim is "mandatory" only via TASK-050 — so it is engineering-only for the import-only slice but transitively blocked by TASK-049's tier-3 media-access gate for its primary (live Teams) claim.

External parties named across the tier-3 set, grouped (DERIVED from the task texts, not confirmed with Tony): Cloudflare/Deepgram account entitlement + billing route (TASK-011); Microsoft Entra ID tenant admin / app registration (TASK-006, TASK-046, TASK-047); Microsoft 365/Teams app-catalog admin (TASK-046); Microsoft real-time meeting media approval — Graph cloud communications / Azure Communication Services (TASK-049); Zoom marketplace developer account + Google Meet API enablement (TASK-010, TASK-051); a Laya hosting/vendor relationship not yet established (TASK-032); Windows code-signing certificate + timestamp authority (TASK-063); Apple Developer Program membership, Developer ID notarization and PCC entitlement (TASK-065); legal/privacy counsel for DPIA and data-subject-rights procedures (TASK-058); scoped admin/privacy review for meeting-capture legal prerequisites (TASK-010).

## 5. Critical path

Computed as the longest dependency chain through `common_dependencies` (registry.json), normalizing slice suffixes (`TASK-028.A` -> `TASK-028`) to their root task per §21.1.1 ("Suffixes ... identify evidence slices under a stable task; they are not new root task IDs"). This is a task-count critical path (no duration estimates exist in the kit to weight it by time), computed by longest-path-in-a-DAG over all 66 root tasks; the graph has a single true root (`TASK-001` — every other task traces back to it) and is acyclic (verified — no cycle exception raised).

**Longest chain: 19 edges / 20 tasks**, and it is *not* the speech pipeline — it runs through canonical knowledge and Dust, not through Cloudflare Nova-3:

```
TASK-001 -> TASK-002 -> TASK-005 -> TASK-012 -> TASK-013 -> TASK-014 -> TASK-015 -> TASK-035 -> TASK-036 -> TASK-037 -> TASK-038 -> TASK-039 -> TASK-041 -> TASK-054 -> TASK-056 -> TASK-057 -> TASK-058 -> TASK-062 -> TASK-063 -> TASK-066
```

| Depth | Task | Title |
|---|---|---|
| 0 | TASK-001 | Pin the actual system and preserve the working tree |
| 1 | TASK-002 | Lock the PRD, effective policies and independent release lanes |
| 2 | TASK-005 | Define shared speech, command, policy and metering contracts |
| 3 | TASK-012 | Prepare authorized Cloudflare staging and server credentials |
| 4 | TASK-013 | Disable speech content logs and caches before capture tests |
| 5 | TASK-014 | Implement the authenticated speech-session broker |
| 6 | TASK-015 | Make diagnostics and metering projections content-free |
| 7 | TASK-035 | Implement the governed canonical knowledge service |
| 8 | TASK-036 | Build deterministic wiki and graph projections |
| 9 | TASK-037 | Implement the authorized evidence context builder |
| 10 | TASK-038 | Deploy and connect Dust knowledge read tools |
| 11 | TASK-039 | Implement real Dust writes and reviewed corrections |
| 12 | TASK-041 | Close knowledge synchronization and deletion loops |
| 13 | TASK-054 | Verify summaries, knowledge and sync without cloud content copies |
| 14 | TASK-056 | Run real cross-platform Cloudflare-to-action-to-portal journeys |
| 15 | TASK-057 | Close no-content-retention and drift-evidence gates |
| 16 | TASK-058 | Complete governance, subject rights and sharing qualification |
| 17 | TASK-062 | Exercise production operations, staging and recovery |
| 18 | TASK-063 | Build, sign, freeze and qualify the immutable candidate family |
| 19 | TASK-066 | Deliver final re-audit, exact evidence and resumable handoff |

**Reading this:** the Cloudflare speech path (TASK-011 through TASK-020) bottoms out at depth 8 (TASK-020) — four steps shorter than the point (depth 12, TASK-041) where the canonical-knowledge/Dust chain alone has already gone deeper. The critical path only rejoins a speech-adjacent task at TASK-054 (depth 13, which pulls in TASK-053's transcript-fidelity harness as one of its six dependencies, but TASK-053 is not itself on the longest chain — its own longest chain is only 9 deep). **DERIVED implication for sequencing:** governance/knowledge/Dust work (TASK-006/007 -> TASK-035..041) is the actual long pole for reaching TASK-063/TASK-066, not the speech/Teams work most bug reports and runtime evidence (E1-E9) focus on. Starting TASK-035-041 late because "Cloudflare speech feels more urgent" would be the single biggest schedule risk in this plan.

**Root task:** ['TASK-001'] — TASK-001 is the only task with no dependency; every one of the other 65 tasks traces back to it, directly or transitively.

**Leaf tasks (nothing in the registry names them as a dependency):** TASK-031, TASK-032, TASK-051, TASK-055, TASK-064, TASK-065, TASK-066. Five of these (TASK-031, TASK-032, TASK-051, TASK-055, and TASK-064/065/066's siblings) are provider-adapter or terminal-release tasks by design — nothing should depend on a specific decision-provider adapter or a release event. This is expected shape, not a defect.

**Second-longest branch, for context** — the Teams path: TASK-001 -> TASK-002 -> TASK-006 -> TASK-010 -> TASK-046 -> TASK-047 -> TASK-048 -> TASK-049 -> TASK-050 -> TASK-053(dep of 054, not shown)... reaches only depth 9 at TASK-050 before folding into the same TASK-054/056/057 chain as everything else; Teams is gated far more by *external* approvals (tier 3: TASK-006, TASK-010, TASK-046, TASK-047, TASK-049) than by chain length.

## 6. Requirements glossary (55 `M2-*` requirements, registry.json)

Full list, for cross-referencing the "Requirements" column in §2/§3. `required_evidence` is the registry's own acceptance-evidence description (OBSERVED, `plan/registry.json:requirements[]`).

| ID | Scope | Required evidence |
|---|---|---|
| M2-BASE-01 | Pinned, preserved baseline and deployed-state audit | Actual source/deployment inventory and baseline results. |
| M2-VOICE-01 | Trusted opt-in wake and single audio owner | Capture provenance, silence/echo/replay, first-word and off-state tests. |
| M2-VOICE-02 | Fast visible command bar and local cancellation | Measured wake/stop timings and lifecycle tests. |
| M2-ACT-01 | Capability-bound safe action planning | Typed schemas, target freshness and policy/approval negative tests. |
| M2-ACT-02 | Real cross-platform outcomes | UC-009–UC-040 native results; failed/unknown attempts never verified by declaration. |
| M2-UX-01 | Exact requested orb/beam/voice hierarchy | Actual library/native integration and state screenshots/video. |
| M2-UX-02 | Accessible stable right-edge/top-center UI | Keyboard/IME/focus/scaling/long-content/display-change results. |
| M2-ASR-01 | Faithful capture and ordered segment revisions | Audio framing, gaps, reconnect, echo and finalization fixtures. |
| M2-ASR-02 | Qualified transcript/summary quality | Versioned holdout scores, critical-fact errors and truthful limitations. |
| M2-DEC-01 | Real Jev applied decision path | Live authorized provider-to-verified-action trace and usage event. |
| M2-DEC-02 | Laya alternate with honest capabilities/cost | Common qualification set, serving readiness, policy-respecting fallback. |
| M2-MAC-01 | Genuine native application | Xcode native builds and physical/native platform acceptance. |
| M2-MAC-02 | Correct Apple intelligence eligibility/distribution | Account/entitlement/distribution/readiness evidence and quota/error tests. |
| M2-OPS-01 | People/devices/activity correctly separated | Verified identity and event-time attribution tests. |
| M2-OPS-02 | Correct complete usage and money | Adversarial ledger/aggregate/streaming tests plus deployed reconciliation. |
| M2-OPS-03 | Operational diagnostics and recovery | Alerts, staging identification, tested backup/restore and rollback. |
| M2-PKG-01 | Genuinely lightweight default installation | Actual size/inventory/first-value measurements and profile-aware packaging gates. |
| M2-PKG-02 | Secure optional components | Signed-manifest, tamper, resume, low-space, atomicity and downgrade tests. |
| M2-SEC-01 | No shipped organizational master credentials | Actual final-artifact policy scan and device-scoped authentication evidence. |
| M2-SEC-02 | Effective auth/egress/tool/approval boundaries | Transport matrix, managed-policy and adversarial boundary tests. |
| M2-DATA-01 | Existing data and retention preserved | Upgrade/export/sync/key/summary-only cleanup tests. |
| M2-KNOW-01 | Bounded authorized evidence-based Intelligence | Access/correction/cache/provenance and UI drill-down tests. |
| M2-ENG-01 | Maintainable refactor and fresh engineering memory | Dependency/regression tests, source map and measured task-efficiency comparison. |
| M2-WIN-01 | Qualified signed Windows 2.0 release | Exact artifact signer/timestamp/hash, install/update/native journeys and published provenance. |
| M2-REL-01 | Independent honest platform release states | Windows lane green without fake Mac artifact; Mac hold explicit; canonical feeds/versions correct. |
| M2-STT-01 | Cloudflare default on all fresh 2.0 native platforms | Fresh profiles, explicit legacy choices and managed-policy migration tests. |
| M2-STT-02 | Server-credentialed real-time speech session | No account token on desktop; real PCM-to-transcript round-trip and role/session negative tests. |
| M2-STT-03 | Efficient purpose-specific tracks and bounded streams | Mic-only commands, permitted meeting tracks, backpressure/reconnect/finalization/soak evidence. |
| M2-STT-04 | Speech metering and actual provider/config provenance | Per-track/attempt duration accounting with tariff, completeness and portal reconciliation. |
| M2-PRIV-01 | No controlled cloud content persistence | Readback of disabled logging/cache and synthetic negative tests across every configured sink. |
| M2-PRIV-02 | Route-specific provider assurance and no silent downgrade | Hosting/terms/transport evidence, exact no-training/retention basis, fail-closed readiness and drift tests. |
| M2-PRIV-03 | Content-free diagnostics and finite metadata retention | Approved event allowlist, metadata-only queues, content-free exports and retention enforcement. |
| M2-LOCAL-01 | Optional separate local speech/generation Settings | Off/uninstalled/unloaded default, explicit install/select/unload/remove, no surprise fallback. |
| M2-LOCAL-02 | Device-qualified model selection and resource limits | Actual hardware/driver/language/memory/disk plus signed catalog and bounded post-install benchmark. |
| M2-E2E-01 | Deployed Cloudflare speech-to-action-to-portal proof | Immutable Windows/native Mac evidence from real capture through transcript, decision, verified result, cleanup and ledger. |
| M2-KNOW-02 | Canonical knowledge authority, versions and field provenance | Source-backed records; human-verification limits; conflicting/generated evidence never silently promoted. |
| M2-KNOW-03 | Scoped rebuildable wiki/graph projections | Graphify adapter, source revision, ACL intersection, atomic refresh and no derived source of authority. |
| M2-KNOW-04 | Always-available authorized context service | Actual approved knowledge storage/hosting, user scope, sleeping-device behavior and bounded retrieval. |
| M2-KNOW-05 | Knowledge correction, revocation and deletion convergence | CAS/conflict, read-your-write, tombstones, source/replica cleanup and no stale resurrection. |
| M2-DUST-01 | Authenticated Dust read and attribution | Personal OAuth or explicitly scoped service identity; real authorized/denied MCP reads. |
| M2-DUST-02 | Safe working Dust writes | Allowed canonical writes plus reviewed proposals, expected revision/idempotency, readback and human-review gates. |
| M2-DUST-03 | Dust retention and cross-system convergence | Actual workspace/credential scope and supplier handling; correction/deletion/revocation tests. |
| M2-SKILL-01 | Central versioned skill lifecycle | Existing registry migration; immutable versions, tests, review, canary, publication, rollback and revocation. |
| M2-SKILL-02 | Server-side governed skill execution | Real context retrieval/tool pipeline, typed outputs, permissions, budgets and no arbitrary client code. |
| M2-SKILL-03 | Catalog freshness and attributable skill usage | No reinstall for updates; pinned runs; correct skill/version/attempt metrics and offline/unavailable behavior. |
| M2-SET-01 | Simple everyday Settings and progressive disclosure | Four everyday destinations, search, admin-only controls and measured usability. |
| M2-SET-02 | Safe Settings migration and effective policy | Old-key mapping, failed-save behavior, native parity and no hidden consent/engine changes. |
| M2-TEAMS-01 | Teams app plus verified Entra identity | Personal/meeting surfaces, downstream permission separation, guest/cross-tenant negative tests. |
| M2-TEAMS-02 | Eligible actual-start automatic attendance | Real supported events, enrollment, idempotent occurrence coordination, lobby/removal and laptop-off tests. |
| M2-TEAMS-03 | Qualified real Teams media service | Supported SDK/hosting/permissions/status procedure and actual permitted audio; explicit route blockers. |
| M2-TEAMS-04 | Visible consent-aware capture and audience-safe output | One source per occurrence, notices/stop, no remote desktop authority, scoped saved output. |
| M2-TEAMS-05 | Honest cross-platform meeting capability matrix | Teams/Zoom/Meet/other supported routes verified independently; no universal silent join claims. |
| M2-GOV-01 | Deployment-specific privacy/GDPR decision evidence | Approved purposes/parties/lawful basis, DPIA determination, notice and rights handling; no automatic certification. |
| M2-GOV-02 | Content, control artifacts and metadata kept separate | Approved M365 knowledge location; no private run content in Cloudflare storage/logs or template loophole. |
| M2-E2E-02 | Meeting-to-knowledge-to-Dust-to-skill full-chain proof | Actual meeting/Cloudflare/knowledge/Dust mutation/skill/version/Operator receipt under differing permissions. |

## 7. Golden flows and owner commitments (context, not re-derived)

registry.json carries 12 `FLOW-*` end-to-end journeys and 44 `COV-*` owner commitments, each already mapped to primary tasks. These are the kit's own traceability layer (requirement -> flow -> task), not something this lane re-derives; listing all of them is out of scope for a task-registry extraction, but one is directly relevant to the critical path in §5:
- **FLOW-01 — A new Windows user reaches the real first success**: primary tasks 002 006 016 019 027 030 031 033 034 045 056 063 064
- Every `COV-*` owner commitment lists explicit `tasks` and `requirements` arrays (OBSERVED) — an Opus planner assembling a milestone plan should pull directly from `owner_commitments` rather than re-deriving a task-to-outcome mapping, since the kit already ships one.

## 8. Concrete findings from cross-checking the registry against the pinned repo

These are the only repo-code claims in this report; each is a directory/grep check, not a full audit (that is the `L0x`/`B0x` lanes' job).

1. **OBSERVED — TASK-031's "Jev" provider already has real, non-trivial code in the pinned checkout.** `grep -rl "jev" src operator native native-app intelligence` hits `src/shared/metis-command-parse.ts`, `src/shared/desktop-actions.ts`, `src/main/desktop-adapters.ts`, `src/main/metis-command-register.ts`, `src/main/metis-command-runtime.ts`, and `src/main/metis-decide-client.ts` (which defines `JEV_INTEL_LABELS` / `isJevIntelLabel`). TASK-031's registry status is `NOT_STARTED` — that status describes the r11 kit's own tracking (§1), not the repo. Treat TASK-031 as "harden/complete an existing integration," not "build from zero."
2. **DERIVED — TASK-032's "Laya" alternative has no corresponding identifier anywhere in the checkout.** The same grep for "laya" only matches unrelated substrings (`Malayalam`, `overlayAfterHide`, `displayAccelerator` — confirmed by inspecting each hit's context) — zero genuine "Laya" hits. This is consistent with TASK-032's own text ("Qualify the Laya alternative... Missing service credentials/resources are BLOCKED") describing a not-yet-qualified provider, and it is why TASK-032 sits in tier 3 (§4.4) rather than tier 1 like TASK-031: there is no existing vendor relationship to build on.
3. **OBSERVED — the registry's all-`NOT_STARTED` state is a kit-tracking artifact, not a repo-maturity signal (`product_execution_performed: false`, §1).** Given (1) above, and given the runtime evidence already collected by the lead (installed app is 1.9.6 with a working local-LLM stack, cloud STT adapter, brain/knowledge ingestion, and an Operator already live in production per E1-E9), the Opus planner should *not* read this registry's per-task status as "0% done." A faithful status read requires walking each task's actual code area (§3's "Code areas" column) against the other lanes' findings, which this lane did not attempt exhaustively — that reconciliation is this report's single biggest open item (see §9).
4. **OBSERVED — "Teams" and "Entra" identifiers already exist in `operator/src/connectors/catalog.ts`, `operator/src/routes/integrations.ts` and `operator/src/routes/connectors-oauth.ts`.** This is very likely a generic third-party-connector catalog (alongside ClickUp/Plane, which also appear under `src/main/mcp/`) used for outbound integrations, not the Teams meeting-bot app that TASK-046-050 describe. I did not open these files' contents to confirm which; flagging as UNKNOWN rather than asserting either way, since conflating the two would misrepresent how much of TASK-046 is actually done.
5. **OBSERVED — `registry.json` has one data-quality gap: `TASK-063.requirements` is an empty array (`[]`)** although MASTER.md line 2903 states "Requirements: All applicable M2 requirements" for that task. Every other one of the 66 `tasks[]` entries has a populated `requirements` array; TASK-063 alone does not. Anything that joins on `requirements` (this report's §6/§7 cross-references, or an automated traceability tool) will silently miss TASK-063's binding to all 55 `M2-*` requirements unless this is special-cased.

## 9. Open questions and blockers for the Opus planner

- **Reconcile registry status with real repo state per task.** §8.3: every task reads `NOT_STARTED` in the kit, but at least TASK-031 clearly is not. A planner that schedules off this registry's status field alone will misallocate effort. Recommend a follow-up pass (or a synthesis step across the `L0x`/`B0x` lanes) that walks each of the 66 tasks' "Code areas" (§3) against what those lanes actually found, and re-labels status as one of NOT_STARTED / PARTIAL / IMPLEMENTED-UNVERIFIED / VERIFIED per MASTER.md's own vocabulary (line 1869).
- **Confirm real-world identities behind "Jev" and "Laya."** The spec deliberately code-names these two decision-providers throughout (never resolved to a real vendor name in MASTER.md, TASK-INDEX.md or registry.json). TASK-031/032's external-dependency tier (§4) is my best derivation from the *pattern* of the requirement text (candidate-bound requests, applied decisions, server vault, two-device shared-key isolation) plus the repo-code correlation in §8, but the actual account/contract owner is UNKNOWN to this lane and should be confirmed directly with Tony before scheduling TASK-031/032/043/056.
- **The critical path (§5) runs through knowledge/Dust/governance, not speech.** If the team's intuition (reinforced by the runtime evidence E1-E9, which is all about crashes/freezes/resource use in the capture/lifecycle path) is to prioritize speech/lifecycle work first, the schedule risk is that TASK-006/007/035-041/058 (Entra, canonical knowledge, Dust, governance) start late and become the actual pacing item for TASK-063/066. This is a scheduling finding for the Opus planner to weigh against the B1-B3/L0x lanes' P0/P1 findings, not a recommendation to deprioritize the crash/freeze fixes Tony reported.
- **Tier-3 external items should be started in parallel, now, regardless of engineering sequencing**, since none of them are on this lane's critical path by task-count but every one of them (Entra tenant admin, Teams app-catalog admin, Teams real-time-media approval, Zoom/Google developer programs, Windows signing certificate, Apple Developer Program membership, DPIA/legal review) has its own external lead time that this registry cannot estimate. Recommend the planner open these as parallel-track owner action items on day one: TASK-006, TASK-010, TASK-011, TASK-032, TASK-046, TASK-047, TASK-049, TASK-051, TASK-058, TASK-063, TASK-065 (§4.4).
- **`common_dependencies` is a common-implementation-prerequisite DAG, not a full integration-closure DAG** (registry.json `limitations[1]`, OBSERVED) — MASTER.md §21.1.1 and the 16 `slice_handoffs` (registry.json) add further real-provider/platform closure requirements on top of the dependency edges used for §5's critical path (e.g. TASK-056's `.MAC` slice additionally needs TASK-029; TASK-063.WIN needs a Windows signer regardless of the graph). Treat §5's critical path as the engineering-sequencing lower bound, not the full release-readiness critical path.

## 10. Method

Per `sae/software-architecture-engineer/references/02-requirements-and-quality.md`: each task row keeps its requirement ID, links to the M2-* requirement it implements (§6) and to the exact MASTER.md line (§3), and criticality is not flattened — tier-3 external blockers are marked as blockers, not downgraded to "nice to have" to make the plan look done (matches "never downgrade a real invariant to save time"). Per `stark/stark/references/product-and-planning.md`: every requirement below cites its supplied source (MASTER.md line + registry.json field) or is explicitly marked DERIVED/ASSUMED/UNKNOWN; nothing here claims a decision, approval or completion that was not read directly. No requirement was invented and none of the 66 tasks was dropped (verified count: 66 rows in §2/§3, matching `plan/registry.json:tasks` length and `TASK-INDEX.md`'s 66-row table).
