# Métis 2.0 PRD lock: requirements, effective policies and release lanes (TASK-002)

| Field | Value |
|---|---|
| Document | `tasks/TASK-002/prd-lock.md`, PRD-lock version **0.1.0-draft** |
| Generated | 2026-09-24 (evidence reads on 2026-09-23/24; times are UTC unless marked) |
| Contract | Kit r11, MASTER rev 4.5. `spec/MASTER.md` sha256 `e5b3c51d6d8423b5aadd1801d8fc2a77131c5ca3a363d281f1deb0da7acb1350`, equal to `plan/registry.json` `source_sha256` (VERIFIED: `shasum -a 256 spec/MASTER.md`) |
| Source | `mysticalsin/AskToto-Mantu` main `2bf21f1ceefe117838325342574b57852e5cadcb`, package `1.9.6`, worktree clean (VERIFIED: `git rev-parse HEAD` = `git rev-parse origin/main`; `git status --porcelain` = 0 lines; `require('./package.json').version`) |
| Status | **DRAFT for Tony's review. Not owner-approved. It does not close TASK-002 (see §4).** |
| Author / review | TASK-002 lane subagent (Claude). No independent review has run. |

**Evidence labels.** VERIFIED means a command or file:line is given. ASSUMED states its basis. UNKNOWN means not observed. NOT_AVAILABLE quotes the exact error. Product verification for every ID below remains **NOT_TESTED**: kit `plan/PRODUCT-STATUS.json` has `product_verification: "NOT_RUN"`, and its TASK-002 row is `implementation: NOT_STARTED`, `verification: NOT_TESTED`. Nothing in this file is a product pass (MASTER §33.6).

---

## 1. Requirement ID register

### 1.1 Declared totals versus actual definitions

| Family | Declared | Definitions found | Unique | Range | Defined in | registry.json key | Registry count | Same ID set | Result |
|---|---|---|---|---|---|---|---|---|---|
| M2 | 55 | 55 | 55 | M2-BASE-01 … M2-E2E-02 (register order, lines 1747–1801) | MASTER §20.1 table rows | `requirements` | 55 | yes | **MATCH** |
| UC | 112 | 112 | 112 | UC-001–UC-112 | MASTER §8 catalog rows | `use_cases` | 112 | yes | **MATCH** |
| TASK | 66 | 66 | 66 | TASK-001–TASK-066 | MASTER §21.2 headings | `tasks` | 66 | yes | **MATCH** |
| COV | 44 | 44 | 44 | COV-01–COV-44 | MASTER §25.1 rows | `owner_commitments` | 44 | yes | **MATCH** |
| FLOW | 12 | 12 | 12 | FLOW-01–FLOW-12 | MASTER §26 headings | `golden_flows` | 12 | yes | **MATCH** |
| EXP | 12 | 12 | 12 | EXP-01–EXP-12 | MASTER §28 headings | `experience_requirements` | 12 | yes | **MATCH** |
| SRC | 24 | 24 | 24 | SRC-01–SRC-24 | MASTER §29 headings | `source_findings` | 24 | yes | **MATCH** |
| AGX | 16 | 16 | 16 | AGX-01–AGX-16 | MASTER §32.13 rows | `agent_expansion.gates` | 16 | yes | **MATCH** |
| AGUC | 32 | 32 | 32 | AGUC-001–AGUC-032 | MASTER §32.14 rows | `agent_expansion.cases` | 32 | yes | **MATCH** |
| HC | 32 | 32 | 32 | HC-01–HC-32 | clicky-study/SOURCE-STUDY.md headings | `clicky_observations` | 32 | yes | **MATCH** |
| AGSTEP | 18 | 18 | 18 | AGSTEP-01–AGSTEP-18 | MASTER §32.15 headings | `agent_expansion.ordered_steps` | 18 | yes | **MATCH** |
| OBU | 5 | 5 | 5 | OBU-01–OBU-05 | MASTER §34.7 bold items | `(none; not a registry family)` | – | – | **MATCH** |
| HM | 16 | 16 | 16 | HM-01–HM-16 | MASTER §35.13 rows | `memory_expansion.gates` | 16 | yes | **MATCH** |
| HMUC | 32 | 32 | 32 | HMUC-001–HMUC-032 | MASTER §35.14 rows | `memory_expansion.use_cases` | 32 | yes | **MATCH** |
| HMSTEP | 16 | 16 | 16 | HMSTEP-01–HMSTEP-16 | MASTER §35.12 rows | `memory_expansion.steps` | 16 | yes | **MATCH** |
| **All** | **492** | | **492** | | | | | | **MATCH** |

VERIFIED by a read-only extractor run over `spec/MASTER.md`, `clicky-study/SOURCE-STUDY.md` and `plan/registry.json`. It matched definition rows and headings with anchored patterns, rejected duplicates and compared each family's ID set with registry.json. An independent raw-grep cross-check over all MASTER mentions agrees: `grep -oE 'M2-[A-Z0-9]+-[0-9]{2}' spec/MASTER.md | sort -u | wc -l` = 55. Boundary-guarded greps per family give UC 112, TASK 66, COV 44, FLOW 12, EXP 12, SRC 24, AGX 16, AGUC 32, HC 32, AGSTEP 18, OBU 5, HM 16, HMUC 32 and HMSTEP 16. The kit's own `verification/FINAL-AUDIT.md:9` and `:11` state the same baseline and Hindsight totals.

**Mismatches: none.** One methodology trap for the next agent: the naive pattern `M2-[A-Z]*-[0-9]*` returns **53**, because it cannot match `M2-E2E-01` or `M2-E2E-02` (a digit inside the family token). Use `M2-[A-Z0-9]+-[0-9]{2}`.

Structural checks (MASTER §27.2 items 1–3, traceability only; VERIFIED by the same read-only run):

- The §25.2 partition's 18 range rows cover UC-001–UC-112 exactly once: 112 slots, 112 unique, no gap.
- All 55 M2 IDs are referenced by at least one COV row (`registry.json` `owner_commitments[*].requirements`).
- There are 0 dangling UC→M2 references and 0 use cases without a requirement mapping.
- registry.json also retains the 20 historical findings and 16 slice handoffs.
- OBU-01–05 is **not** a registry family. It exists only as MASTER §34.7 items (MASTER.md:4981–4989), defined as sub-slices of existing tasks (§34.7, last paragraph). The §27 evidence registry must add it explicitly or it will fall out of the denominator.

### 1.2 The 55 baseline requirements (MASTER §20.1, register order)

| # | ID | Scope (one line) | Required evidence (MASTER) | Source |
|---|---|---|---|---|
| 1 | `M2-BASE-01` | Pinned, preserved baseline and deployed-state audit | Actual source/deployment inventory and baseline results. | MASTER.md:1747 |
| 2 | `M2-VOICE-01` | Trusted opt-in wake and single audio owner | Capture provenance, silence/echo/replay, first-word and off-state tests. | MASTER.md:1748 |
| 3 | `M2-VOICE-02` | Fast visible command bar and local cancellation | Measured wake/stop timings and lifecycle tests. | MASTER.md:1749 |
| 4 | `M2-ACT-01` | Capability-bound safe action planning | Typed schemas, target freshness and policy/approval negative tests. | MASTER.md:1750 |
| 5 | `M2-ACT-02` | Real cross-platform outcomes | UC-009–UC-040 native results; failed/unknown attempts never verified by declaration. | MASTER.md:1751 |
| 6 | `M2-UX-01` | Exact requested orb/beam/voice hierarchy | Actual library/native integration and state screenshots/video. | MASTER.md:1752 |
| 7 | `M2-UX-02` | Accessible stable right-edge/top-center UI | Keyboard/IME/focus/scaling/long-content/display-change results. | MASTER.md:1753 |
| 8 | `M2-ASR-01` | Faithful capture and ordered segment revisions | Audio framing, gaps, reconnect, echo and finalization fixtures. | MASTER.md:1754 |
| 9 | `M2-ASR-02` | Qualified transcript/summary quality | Versioned holdout scores, critical-fact errors and truthful limitations. | MASTER.md:1755 |
| 10 | `M2-DEC-01` | Real Jev applied decision path | Live authorized provider-to-verified-action trace and usage event. | MASTER.md:1756 |
| 11 | `M2-DEC-02` | Laya alternate with honest capabilities/cost | Common qualification set, serving readiness, policy-respecting fallback. | MASTER.md:1757 |
| 12 | `M2-MAC-01` | Genuine native application | Xcode native builds and physical/native platform acceptance. | MASTER.md:1758 |
| 13 | `M2-MAC-02` | Correct Apple intelligence eligibility/distribution | Account/entitlement/distribution/readiness evidence and quota/error tests. | MASTER.md:1759 |
| 14 | `M2-OPS-01` | People/devices/activity correctly separated | Verified identity and event-time attribution tests. | MASTER.md:1760 |
| 15 | `M2-OPS-02` | Correct complete usage and money | Adversarial ledger/aggregate/streaming tests plus deployed reconciliation. | MASTER.md:1761 |
| 16 | `M2-OPS-03` | Operational diagnostics and recovery | Alerts, staging identification, tested backup/restore and rollback. | MASTER.md:1762 |
| 17 | `M2-PKG-01` | Genuinely lightweight default installation | Actual size/inventory/first-value measurements and profile-aware packaging gates. | MASTER.md:1763 |
| 18 | `M2-PKG-02` | Secure optional components | Signed-manifest, tamper, resume, low-space, atomicity and downgrade tests. | MASTER.md:1764 |
| 19 | `M2-SEC-01` | No shipped organizational master credentials | Actual final-artifact policy scan and device-scoped authentication evidence. | MASTER.md:1765 |
| 20 | `M2-SEC-02` | Effective auth/egress/tool/approval boundaries | Transport matrix, managed-policy and adversarial boundary tests. | MASTER.md:1766 |
| 21 | `M2-DATA-01` | Existing data and retention preserved | Upgrade/export/sync/key/summary-only cleanup tests. | MASTER.md:1767 |
| 22 | `M2-KNOW-01` | Bounded authorized evidence-based Intelligence | Access/correction/cache/provenance and UI drill-down tests. | MASTER.md:1768 |
| 23 | `M2-ENG-01` | Maintainable refactor and fresh engineering memory | Dependency/regression tests, source map and measured task-efficiency comparison. | MASTER.md:1769 |
| 24 | `M2-WIN-01` | Qualified signed Windows 2.0 release | Exact artifact signer/timestamp/hash, install/update/native journeys and published provenance. | MASTER.md:1770 |
| 25 | `M2-REL-01` | Independent honest platform release states | Windows lane green without fake Mac artifact; Mac hold explicit; canonical feeds/versions correct. | MASTER.md:1771 |
| 26 | `M2-STT-01` | Cloudflare default on all fresh 2.0 native platforms | Fresh profiles, explicit legacy choices and managed-policy migration tests. | MASTER.md:1772 |
| 27 | `M2-STT-02` | Server-credentialed real-time speech session | No account token on desktop; real PCM-to-transcript round-trip and role/session negative tests. | MASTER.md:1773 |
| 28 | `M2-STT-03` | Efficient purpose-specific tracks and bounded streams | Mic-only commands, permitted meeting tracks, backpressure/reconnect/finalization/soak evidence. | MASTER.md:1774 |
| 29 | `M2-STT-04` | Speech metering and actual provider/config provenance | Per-track/attempt duration accounting with tariff, completeness and portal reconciliation. | MASTER.md:1775 |
| 30 | `M2-PRIV-01` | No controlled cloud content persistence | Readback of disabled logging/cache and synthetic negative tests across every configured sink. | MASTER.md:1776 |
| 31 | `M2-PRIV-02` | Route-specific provider assurance and no silent downgrade | Hosting/terms/transport evidence, exact no-training/retention basis, fail-closed readiness and drift tests. | MASTER.md:1777 |
| 32 | `M2-PRIV-03` | Content-free diagnostics and finite metadata retention | Approved event allowlist, metadata-only queues, content-free exports and retention enforcement. | MASTER.md:1778 |
| 33 | `M2-LOCAL-01` | Optional separate local speech/generation Settings | Off/uninstalled/unloaded default, explicit install/select/unload/remove, no surprise fallback. | MASTER.md:1779 |
| 34 | `M2-LOCAL-02` | Device-qualified model selection and resource limits | Actual hardware/driver/language/memory/disk plus signed catalog and bounded post-install benchmark. | MASTER.md:1780 |
| 35 | `M2-E2E-01` | Deployed Cloudflare speech-to-action-to-portal proof | Immutable Windows/native Mac evidence from real capture through transcript, decision, verified result, cleanup and ledger. | MASTER.md:1781 |
| 36 | `M2-KNOW-02` | Canonical knowledge authority, versions and field provenance | Source-backed records; human-verification limits; conflicting/generated evidence never silently promoted. | MASTER.md:1782 |
| 37 | `M2-KNOW-03` | Scoped rebuildable wiki/graph projections | Graphify adapter, source revision, ACL intersection, atomic refresh and no derived source of authority. | MASTER.md:1783 |
| 38 | `M2-KNOW-04` | Always-available authorized context service | Actual approved knowledge storage/hosting, user scope, sleeping-device behavior and bounded retrieval. | MASTER.md:1784 |
| 39 | `M2-KNOW-05` | Knowledge correction, revocation and deletion convergence | CAS/conflict, read-your-write, tombstones, source/replica cleanup and no stale resurrection. | MASTER.md:1785 |
| 40 | `M2-DUST-01` | Authenticated Dust read and attribution | Personal OAuth or explicitly scoped service identity; real authorized/denied MCP reads. | MASTER.md:1786 |
| 41 | `M2-DUST-02` | Safe working Dust writes | Allowed canonical writes plus reviewed proposals, expected revision/idempotency, readback and human-review gates. | MASTER.md:1787 |
| 42 | `M2-DUST-03` | Dust retention and cross-system convergence | Actual workspace/credential scope and supplier handling; correction/deletion/revocation tests. | MASTER.md:1788 |
| 43 | `M2-SKILL-01` | Central versioned skill lifecycle | Existing registry migration; immutable versions, tests, review, canary, publication, rollback and revocation. | MASTER.md:1789 |
| 44 | `M2-SKILL-02` | Server-side governed skill execution | Real context retrieval/tool pipeline, typed outputs, permissions, budgets and no arbitrary client code. | MASTER.md:1790 |
| 45 | `M2-SKILL-03` | Catalog freshness and attributable skill usage | No reinstall for updates; pinned runs; correct skill/version/attempt metrics and offline/unavailable behavior. | MASTER.md:1791 |
| 46 | `M2-SET-01` | Simple everyday Settings and progressive disclosure | Four everyday destinations, search, admin-only controls and measured usability. | MASTER.md:1792 |
| 47 | `M2-SET-02` | Safe Settings migration and effective policy | Old-key mapping, failed-save behavior, native parity and no hidden consent/engine changes. | MASTER.md:1793 |
| 48 | `M2-TEAMS-01` | Teams app plus verified Entra identity | Personal/meeting surfaces, downstream permission separation, guest/cross-tenant negative tests. | MASTER.md:1794 |
| 49 | `M2-TEAMS-02` | Eligible actual-start automatic attendance | Real supported events, enrollment, idempotent occurrence coordination, lobby/removal and laptop-off tests. | MASTER.md:1795 |
| 50 | `M2-TEAMS-03` | Qualified real Teams media service | Supported SDK/hosting/permissions/status procedure and actual permitted audio; explicit route blockers. | MASTER.md:1796 |
| 51 | `M2-TEAMS-04` | Visible consent-aware capture and audience-safe output | One source per occurrence, notices/stop, no remote desktop authority, scoped saved output. | MASTER.md:1797 |
| 52 | `M2-TEAMS-05` | Honest cross-platform meeting capability matrix | Teams/Zoom/Meet/other supported routes verified independently; no universal silent join claims. | MASTER.md:1798 |
| 53 | `M2-GOV-01` | Deployment-specific privacy/GDPR decision evidence | Approved purposes/parties/lawful basis, DPIA determination, notice and rights handling; no automatic certification. | MASTER.md:1799 |
| 54 | `M2-GOV-02` | Content, control artifacts and metadata kept separate | Approved M365 knowledge location; no private run content in Cloudflare storage/logs or template loophole. | MASTER.md:1800 |
| 55 | `M2-E2E-02` | Meeting-to-knowledge-to-Dust-to-skill full-chain proof | Actual meeting/Cloudflare/knowledge/Dust mutation/skill/version/Operator receipt under differing permissions. | MASTER.md:1801 |

### 1.3 TASK-002's own bindings and what the source shows today

The registry row TASK-002 (`source_line` 1941) binds M2-BASE-01, M2-SEC-02 and M2-REL-01, plus EXP-08; SRC-01, SRC-02, SRC-09, SRC-15, SRC-18 and SRC-19; AGX-01; HC-01; and HMSTEP-01. MASTER.md:1956 adds OBU-01–05 through §34.

| Binding | Source observation at 2bf21f1c (an observation, not a pass) | Label |
|---|---|---|
| SRC-01 (MASTER:4008) | All five files absent from the 1.9.5 export exist in the checkout: `src/renderer/src/App.tsx`, `src/main/index.ts`, `src/renderer/src/lib/listen.ts`, `src/main/transcripts.ts`, `src/main/brain/ingest.ts` (`ls` sizes 149.2K / 479.6K / 65.5K / 227.9K / 167.6K). The export gap is closed at source-presence level only. | VERIFIED |
| SRC-02 (MASTER:4020) | Two licence authorities remain: `license-server/` (Fly app `asktoto-license`, `license-server/fly.toml:5`) and Operator licence/seat records. Client enforcement is compiled off (`src/renderer/src/App.tsx:311 const LICENSE_ENFORCEMENT = false`). No authority decision is recorded. | VERIFIED; decision OPEN (C-16) |
| SRC-09 (MASTER:4104) | `release:build:win` and `release:build:mac` still run `scripts/embed-cloudflare-key.mjs`. It is a no-op without a token env var, and packaging additionally needs `METIS_EMBED_CLOUDFLARE_KEY=1` (script header). release.yml passes no `METIS_CLOUDFLARE_*` env (release.yml:174-182, :283-289), and no such repo secret name exists (`gh secret list`). The capability remains in source. | VERIFIED (C-15) |
| SRC-15 (MASTER:4176) | Retired hero media is still wired: `src/renderer/src/lib/onboarding-hero-video.ts:7-8` (packaged mp4/poster imports), `:12` (remote CloudFront mirror), `:48-53` (preload link). DESIGN.md:140 still mandates the April-29 clip. | VERIFIED (C-01) |
| SRC-18 (MASTER:4212) | This worktree has only `origin` = GitHub (`git remote -v`). `scripts/push-both.sh:10` pushes to `github` and `origin`, and ENTERPRISE_RELEASE.md:49-62 describes a Forgejo twin that deletes refs it lacks. The actual mirror mode and cadence cannot be observed from here. | VERIFIED (config); mirror UNKNOWN (C-13) |
| SRC-19 (MASTER:4224) | `.gitleaks.toml:35`, `:36`, `:41` still allowlist every `*.test.ts(x)`, every `*.test.mjs` and all of `docs/*.md`. | VERIFIED (C-14) |
| EXP-08 (MASTER:3962) | Same finding as SRC-02: no entitlement/trust-plane decision record exists. | VERIFIED absent |
| AGX-01, HC-01 (SOURCE-STUDY.md:20), AGSTEP-01 (MASTER:4601) | HC-01 binds comparisons to HeyClicky 1.0.51 build 61 only. No adoption record in the repository references it yet. | VERIFIED absent |
| HMSTEP-01 (MASTER:5177) | No Hindsight code in source (`git ls-files \| grep -i hindsight` = 0). Kit `memory/LIVE-STATUS.json`: `application_wiring: NOT_IMPLEMENTED_IN_ACTUAL_REPOSITORY`, `service_deployment: NOT_RUN`. | VERIFIED |
| M2-BASE-01 | Source is pinned (2bf21f1c, clean). Deployed identities were read for the Operator and proxy Workers and the Metis-Releases feed (§3). license-server, AI Gateway and tenants were not read. | PARTIAL |
| M2-REL-01 | Platform publication is coupled in release.yml (C-11). | VERIFIED conflict |
| M2-SEC-02 | Assessed here only through C-14, C-15, C-18 and C-19. The transport matrix, managed policy and adversarial tests were not assessed. | UNKNOWN |

---

## 2. Effective policies and conflict resolution

### 2.1 Precedence rules

- **R1 Product intent.** MASTER rev 4.5 is the sole product contract for what Métis 2.0 must do (kit `AGENTS.md`; MASTER §0.3, line 114). A later owner-approved MASTER section supersedes an earlier one only where it says so; for example, §34 supersedes r9's wizard, and §5.11 supersedes the r6 static idle.
- **R2 Repository gates stay enforceable.** The kit `AGENTS.md` "governs this handoff folder only; preserve the application's existing instructions." A repo gate (DESIGN.md, release.yml, SIGNING.md, ENTERPRISE_RELEASE.md, contract tests) therefore binds what may merge or ship until a reviewed PR amends it. Where MASTER contradicts a repo gate, the gate and the behaviour change in the same reviewed PR. That never means bypassing, disabling, a global `continue-on-error`, force-push or ruleset edits (MASTER §1.3 line 160; §20.5 line 1843).
- **R3 The stricter control wins** for security, privacy, consent, accessibility and signing when both sources define one. Example: DESIGN.md:142's 52×220 CTA hit target beats the §34.5 44×44 design target.
- **R4 Owner authority.** Tony can scope a release or accept a named residual risk (MASTER §0.2, line 108). He cannot waive shared security or privacy gates (§0.2; D01, D13, D14). A decision counts only when recorded in his own words, with a date and scope. Orchestrator or workflow text, including the prompt for this lane, is not owner authority.
- **R5 A scoped release is not contract completion** (MASTER §27.4, line 3874). An excluded or blocked lane stays in the denominator with a named blocker.
- **R6 Evidence levels.** Source presence, synthetic tests, mocks and unsigned builds are not runtime, live-service or signed-customer passes (MASTER §20.2, §20.4.1, §33.6).
- **R7 Unresolvable conflicts** are recorded OPEN with one precise question for Tony (MASTER §0.2), and unrelated work continues.

### 2.2 Locked product policies

| ID | Policy (locked) | Kit source | Repository / source at 2bf21f1c | Agreement |
|---|---|---|---|---|
| P-01 | Cloudflare-hosted speech (`@cf/deepgram/nova-3` on a qualified route) is the default for every fresh 2.0 profile on Windows and native Mac. No employee account key and no implicit capture consent. Existing explicit offline choices migrate visibly, never silently. | D04 (MASTER:135), D11 (:142), M2-STT-01, §9.6 (:831) | `DEFAULT_SETTINGS` (`src/shared/ipc.ts:1628`) sets `asrEngine: 'parakeet'` (:1698) and `cloudSttProvider: 'unconfigured'` (:1700), so the fresh **speech** default is local. The generation `provider` is already `'cloudflare'` (:1629). The Nova-3 id is defined at `src/main/cloud-stt/adapter.ts:32`. | CONFLICT (C-09) |
| P-02 | Local speech and local generation are two separate optional capabilities, off by default. Hardware can recommend; installing and selecting need an explicit user choice or signed admin policy. No surprise fallback. | D12 (:143), D14 (:145), M2-LOCAL-01/02, §14.7 (:1258) | `localLlm` defaults to disabled (ipc.ts:1719-1720) but `modelId: BUNDLED_LOCAL_MODEL_ID` (:1721), which is `'qwen3.5-0.8b'` (:870). release.yml:171-172 and :280-281 say "The compact Qwen default is embedded". DESIGN.md:168 says weights "already fetch via `ensureLocalModel` on app open". | CONFLICT (C-04, C-10) |
| P-03 | Lean core: no bundled or auto-fetched optional speech/LLM/vision weights in the 2.0 core installer. | D04, M2-PKG-01, §14.2 (:1198) | Release jobs cache about 1.3 GB of runtime assets (release.yml:161-170, :270-279). `prepack` runs `fetch-local-model.mjs` and `fetch-models.mjs` (package.json scripts). The 2bf21f1c CI artifacts are 4,766,437,569 B (Windows) and 3,657,108,377 B (macOS) zipped (run 35872259580 artifacts API); their contents were not inspected. | CONFLICT (C-10) |
| P-04 | The exact no-content-retention claim below. | D13 (:144), D22 (:153), §16.6 (:1453), §16.6.5 (:1512), §25.3 | The Operator Worker sends `cf-aig-collect-log-payload: false` and `cf-aig-skip-cache: true` but not `cf-aig-collect-log: false` (`operator/src/use.ts:228-233`; an exact-header grep over operator/src, cloudflare-proxy/src and src/main finds 0 non-test hits). Both Workers enable observability (`operator/wrangler.jsonc:5`, `cloudflare-proxy/wrangler.jsonc:28`). Route privacy readiness: UNREVIEWED. | PARTIAL (C-18) |
| P-05 | Shared organisational secrets stay server-side. No reusable organisational credential in any 2.0 enterprise artifact. | D07 (:138), M2-SEC-01, SRC-09 | The opt-in embed path is still in source (§1.3, SRC-09). | CONFLICT (C-15) |
| P-06 | Windows 2.0 is the first public lane. Trusted signing, timestamping, installer/runtime checks and native user-journey evidence are mandatory. Apple delays neither waive nor indefinitely block Windows. | D01 (:132), §20.4–§20.6 (:1821–1862), M2-WIN-01, M2-REL-01 | release.yml enforces Windows signing (:248-259, :294-296) but couples publication to macOS (:308-313, :343-353). | CONFLICT (C-11) |
| P-07 | Native Mac: build the real Swift/SwiftUI product now. Public Developer ID, notarisation, App Store and PCC are separate gated milestones. Never publish an ad-hoc build as a trusted customer DMG, and never publish a placeholder DMG. Keep the Electron Mac product stable until a migration is qualified. | D02 (:133), D03 (:134), D06 (:137), §11.1–§11.2 (:976–1004), §20.5 table | `native-app/` present; bundle `com.mantu.metis.native` (`native-app/project.yml:40`); `CODE_SIGN_STYLE: Automatic` (:46). No workflow builds it (0 hits for `native-app\|swift build\|swift test\|xcodebuild` in `.github/workflows/*.yml`). ENTERPRISE_RELEASE.md:7-8 excludes the native ZIP from public releases. | AGREES (native CI gap noted) |
| P-08 | Jev is the preferred decision backend and Laya a required alternative, on the same action and policy contracts. Neither authorises an action. | D05 (:136), M2-DEC-01/02 | Not assessed in this lane. | UNKNOWN |
| P-09 | Retain the existing Métis onboarding: `hero → problem → reveal → appearance → setup → personalize → [license] → ready`, Ready-only completion, No Skip. Tony Walteur is the only named human. His approved recording, or a complete text fallback, replaces the retired welcome clip. | §34 (:4866–5001), OBU-01–05, AGX-05, SRC-15 | Scene order and No Skip match (DESIGN.md:104, :109-112). Retired media is still wired (C-01). | PARTIAL (C-01, C-05, C-07) |
| P-10 | Hindsight is an internal, approved derived-memory store on a private service (an approved container platform plus managed PostgreSQL), behind the Métis identity and canonical boundary. It is a new retention boundary, so "no data retained anywhere" must never be claimed. The Cloudflare prohibition is unchanged. | §35.1 (:5035), §35.5 (:5087), `memory/BINDINGS.md` | Not in source. | N/A (not started) |
| P-11 | Teams presence is not permission. Live raw media needs the qualified Azure media receiver and the recording-status gate; otherwise it is BLOCKED, with labelled alternatives. | D20/D21 (:151–152), §15.4 (:1317), §15.8 (:1361) | Not in source. | N/A (not started) |
| P-12 | Required scope cannot disappear behind flags. A scoped release is not full-contract completion. | §0.2 (:108), §20.6 (:1857), §27.4 | ENTERPRISE_RELEASE.md:186-192 already refuses to list licence proofs while enforcement is compiled off. | AGREES |

**P-04, the exact claim.** MASTER §16.6 (:1455) defines protected content as audio, interim and final transcripts, command text, vocabulary, prompts, generated responses, and content-derived embeddings or recognisable hashes. That content may exist transiently in required memory and transport buffers. It must not be written to Cloudflare-controlled application storage, response caches, payload logs, durable work queues or diagnostic exports. Approved numerical/categorical usage metadata and verified user/device administration records form a separate class with finite access and retention. No-training and no-content-retention are separate claims (§25.3). The product must never say "Cloudflare stores no data whatsoever". Once a route is VERIFIED, and only then, the user-facing text is the §16.6.5 wording (MASTER:1514), tailored to the reviewed route:

> "Speech is processed through the approved Cloudflare route. Métis is configured not to persist audio or transcript content in Cloudflare logs, caches or application storage. Authorized usage metadata is retained for administration. Saved summaries follow your selected storage policy."

This text is not displayed while readiness is `UNREVIEWED`, `CONFIGURED` or `BLOCKED`, or while supplier handling is unresolved (§16.6.1 :1459, §16.6.5 :1512). Current readiness for every route is **UNREVIEWED**. ASSUMED basis: no route evidence record exists in the source tree or the exec directory, and no gateway configuration was read in this lane.

### 2.3 Kit versus repository conflicts

| ID | Kit rule | Repository rule or state | Resolution | Owner / task | Label |
|---|---|---|---|---|---|
| C-01 | §34.3: remove the retired welcome video/poster imports, default URL, remote mirror, preloads and packaging reachability. Provide a slot for Tony's approved recording (manifest `NOT_PROVIDED`) and a complete text fallback. SRC-15, OBU-02. | DESIGN.md:140 mandates an Act 1 full-viewport looping April-29 CloudFront clip; :91, :136 and :148 build on the "lady+universe" hero. The source wires it (onboarding-hero-video.ts:7-8, :12, :48-53). | §34 wins under R1: it is the owner-approved amendment (MASTER:4871 "Owner: Tony Walteur") and explicitly supersedes the asset selection and the continuous background play. Keep what §34.3 keeps: the opaque `#05010A` first-paint hold, readable branding, the real demo and the scene flow. Under R2, one reviewed PR amends DESIGN.md's Act 1 paragraph and the component together. | Tony approves; TASK-027 / OBU-02 | VERIFIED conflict |
| C-02 | §34.2–§34.4: no Skip-tour. "Not now" defers one capability; reading text instead of watching is a media alternative, not a skip. | DESIGN.md:104, :132, :166: no Skip; Ready is the only finish. | No conflict; both bind. SRC-15's note about "older No Skip" instructions reads as: reduced or static presentation inside scenes is allowed, skipping the tour is not. | none | VERIFIED consistent |
| C-03 | §34.2: the native Swift `OnboardingModel` still has an older five-act form. Parity needs an explicit decision in that model, with no second coordinator. | DESIGN.md governs the Electron flow only. | OPEN. Question for Tony: should native Mac adopt the desktop scene order, or keep five acts with a documented mapping? | Tony; TASK-029 | OPEN |
| C-04 | D04, D12, M2-LOCAL-01, §14.6 (:1249): onboarding never auto-downloads optional weights and never hides work. | DESIGN.md:168: weights "already fetch via `ensureLocalModel` on app open". :114 treats the on-device model download as a Your-setup row. | The kit wins for fresh 2.0 profiles (R1). DESIGN.md's honest-progress rules (a determinate % only for real progress, no fake 0%) match the §34.4 row states and stay. Amend DESIGN.md:114 and :168 in the TASK-022/024/027.B change. | TASK-022, 024, 027.B | VERIFIED conflict |
| C-05 | §34.3: narration never autoplays. Narration **and onboarding music** pause before microphone practice, permission handoff, scene exit, lock, close and replay. A user mute applies before first paint. One managed audio owner. | DESIGN.md:148 and :152: the Goldberg Aria starts with the portal SFX on mount with no await, loops, and reduced motion does not mute it. | Partial conflict. Music starting on mount can stay, since §34's autoplay ban targets narration. The §34.3 pauses and mute-before-first-sound are added under R3. Amend DESIGN.md in the OBU-02/04 PR. | TASK-027 / OBU-02, OBU-04 | VERIFIED partial |
| C-06 | §34.1, §34.6: Tony Walteur is the only named human in onboarding, narration, demo strings and labels. | DESIGN.md:140 and :150 (Tony byline, LinkedIn link) agree. The pinned "Tell the room" copy (DESIGN.md:158-164) says "aligned with GDPR". No demo-string audit for other names was performed. | Consistent on the byline. Demo strings are UNKNOWN until the OBU-04 sweep. The GDPR line goes to TASK-058 copy review against D23 ("no vendor logo creates compliance"). It claims transparency rather than certification, so it is not changed here. | OBU-04; TASK-058 | PARTIAL / UNKNOWN |
| C-07 | The §34 additions: setup coaching rows, Reveal teaching beats, accessibility behaviour, Tony media slot. | DESIGN.md:3: "This file is the gate. Do not add or restyle overlay / onboarding UI unless it matches this document." :134: "READY TO MERGE stays no until Tony Mac-shows." | Under R2 the gate is satisfied by amending DESIGN.md first or in the same PR, and Tony's Mac-show remains the merge condition. MASTER is not a licence to skip the gate. | Tony; TASK-027/028 | VERIFIED |
| C-08 | §5.11 (:487): ARMED is only the animated solving orb, and the 41 px production host from DESIGN.md is preserved. D08: the solving mesh orb sits inside the command bar. | DESIGN.md:7-9: the fresh default chrome is `hide`, with nothing visible until a top-edge hover. :13-26: the Bar sphere is a 41×41 thinking-orb. The source default is `overlayLayout: 'hide'` (ipc.ts:1692). | OPEN (R7). Question for Tony: in which chrome modes is the ARMED orb visible, and does `hide` stay the fresh default? Do not change the default silently. | Tony; TASK-008/028/030 | OPEN |
| C-09 | P-01, the Cloudflare-first speech default. | ipc.ts:1698 `asrEngine: 'parakeet'`; :1700 `cloudSttProvider: 'unconfigured'`. | The kit wins for fresh 2.0 profiles (R1). Existing explicit offline users keep their choice through a visible migration (D04). `src/shared/default-provider.contract.test.ts` is the pattern for pinning the new speech default. | TASK-005, 016, 027.B | VERIFIED conflict |
| C-10 | P-02 and P-03: no bundled weights in the core. | release.yml:161-172 and :270-282; package.json `prepack`; ipc.ts:870. | The kit wins for the cloud-first core profile. Change packaging through profile-aware gates (SRC-16) in TASK-026. Keep the size gate (`npm run check:release`, release.yml:184, :291). | TASK-026 | VERIFIED conflict |
| C-11 | §20.5 (:1841-1843): an explicit reviewed release-policy change, so Windows publishes once the Windows and shared gates pass while Mac public stays on hold. Keep the main/review rule. No force-push, no bypass, no global `continue-on-error`. D01, M2-REL-01. | ENTERPRISE_RELEASE.md:3: "A public tag is blocked until both production signing lanes pass"; :142-145. release.yml:308-313 `needs: [release-macos, release-windows]`, and :343-353 require both platforms' assets. PLATFORM-MAP.md:59: "released together". | The kit's direction wins, but only through a reviewed PR (R2) that (a) splits publication per platform, (b) keeps the current-main tag rule (release.yml:30-37), (c) never advances `latest-mac.yml` to a missing or unnotarised artifact, and (d) amends ENTERPRISE_RELEASE.md, SIGNING.md and PLATFORM-MAP.md together. Until it merges, the coupled rule binds the signed customer lane. | Tony approves; before TASK-063.WIN | VERIFIED conflict |
| C-12 | D01, D03; §20.4.1 (unsigned passes are never signed-customer evidence); §20.5 (no unnotarised QA bytes through a stable channel). | SIGNING.md:26-29: "Local ad-hoc packages are QA-only and must never be uploaded to the public release feed". ENTERPRISE_RELEASE.md:161: "Windows releases are not deferred or allowed to publish unsigned". Practice already diverges: public Metis-Releases holds unsigned prereleases v1.8.3, v1.8.4 and v1.8.7. The claimed 2026-09-23 decision is to publish v1.9.6 unsigned as a prerelease. | See §2.4. Permitted only as a separate, labelled unsigned-QA prerelease lane under seven conditions, with the policy docs amended so written policy matches practice. | Tony (decision in his words); release operator | Decision ASSUMED; state VERIFIED |
| C-13 | SRC-18: discover the actual mirror before writing; both refs must be at the same commit. If the mirror is authoritative, missing mirror access is a scoped release blocker. | ENTERPRISE_RELEASE.md:49-62: Forgejo deletes refs it lacks, so push tags to both. push-both.sh:10 needs `github` and `origin`; this worktree has only `origin` = GitHub. | Treat Forgejo as authoritative until an owner statement or a readback shows otherwise. Any tag publish, including C-12, must reach Forgejo before the next sync. Never push from this worktree. | Tony; TASK-062/064 | UNKNOWN mirror state |
| C-14 | SRC-19: narrow fingerprint- or line-scoped exceptions; scan docs, tests and artifacts; prove detection with canaries. | `.gitleaks.toml:35`, `:36`, `:41` exempt whole file classes. | The kit wins (R3). Replace the classes with fingerprints, plant a canary per class, and keep scanner output secret-free. | TASK-012/015/061 | VERIFIED conflict |
| C-15 | SRC-09, D07: no reusable organisational credential in any 2.0 enterprise artifact; the Cahê pilot identity stays isolated. | The `scripts/embed-cloudflare-key.mjs` opt-in (double gate) remains in `release:build:*`. docs/CLOUDFLARE.md documents a direct account-token shape. | The kit wins (R3). The 2.0 enterprise profile fails closed on any embed and scans final artifacts. The Cahê feed and identity are not merged. | TASK-012/014/026/063 | VERIFIED conflict |
| C-16 | SRC-02, EXP-08: one entitlement authority per profile. Entra authenticates; a lease grants only its entitlement. | ENTERPRISE_RELEASE.md:29-36: operator setup for `license-server/`. SIGNING.md:131-150: managed config "License gate". App.tsx:311: enforcement off. ENTERPRISE_RELEASE.md:186-192 excludes licence proofs. | OPEN (R7). Question for Tony: does Operator or license-server own 2.0 entitlement? ENTERPRISE_RELEASE.md's refusal to list unrunnable proofs stays. | Tony; TASK-006/034 | OPEN |
| C-17 | §20.5: keep the main/review integration rule. §1.3: resolve the release branch from evidence. | release.yml:30-37: tags must point at current `origin/main`. ENTERPRISE_RELEASE.md:47-48: the tag must equal `v<package.json version>`. | Consistent. The release branch is `main` (2bf21f1c, package 1.9.6). | none | VERIFIED consistent |
| C-18 | §16.6.2 (:1469): per-request gateway log collection is off by default on sensitive routes; metadata-only gateway logs need separate approval and transport verification. §16.6.3 (:1484) lists `cf-aig-collect-log: false` alongside the payload and cache headers. | `operator/src/use.ts:228-233` deliberately keeps metadata logs (comment: "Keep usage metadata but never retain … payloads") and omits `cf-aig-collect-log: false`. | The kit default wins (R3) unless Tony and the privacy owner record approval of metadata-only gateway logs with transport verification. TASK-013 owns the change and the readback. | TASK-013 | VERIFIED conflict (source) |
| C-19 | §20.4.2 (:1835): freeze compatible service versions per client candidate and deploy additive backend changes first. §1.3: reviewable commits. | The deployed `metis-operator` runs `OPERATOR_VERSION 9568d21`, built 2026-09-20T17:11:47Z. 9568d21 is not an ancestor of main and exists only on `origin/metis-2.0-inventory` (`git for-each-ref --contains`). `git cherry 2bf21f1c 9568d21` shows 3 commits with no patch-equivalent on main, including `9568d21c fix(operator): ACCESS bypass /v1/decide …`. Main also has 2 `operator/` commits that are not in 9568d21. | The deployed portal diverges from main in both directions. Do not redeploy from main until the 3 commits are reviewed and merged, or deliberately reverted, because a main deploy would silently undo them. The Access-bypass change needs security review under M2-SEC-02. | Tony; TASK-012/045/062 | VERIFIED |
| C-20 | §35.1: Hindsight adds an approved derived-content store, so "no data retained anywhere" cannot be claimed. | No repository counterpart. | Adopt §35 as written. The P-04 wording applies to the Cloudflare speech chain only. | TASK-007/011/015 | VERIFIED (kit) |
| C-21 | Kit `AGENTS.md`: "preserve the application's existing instructions". MASTER R90 expects a scoped AGENTS.md. | No AGENTS.md or CLAUDE.md is tracked at 2bf21f1c (`git ls-files \| grep -iE '(^\|/)(AGENTS\|CLAUDE)\.md$'` = empty). Repository instructions live in DESIGN.md (the gate), docs/*, contract tests and `.cursor/environment.json`. | The effective repository instructions are the DESIGN.md gate, the release and signing docs, and the contract tests. Adding a small AGENTS.md is an OPEN option for TASK-003 (source map and handoff); it is not required to proceed. | TASK-003 | VERIFIED absent |

### 2.4 The v1.9.6 unsigned prerelease (C-12 detail)

**What this lane was told.** The orchestrator prompt states that Tony decided on 2026-09-23 to publish v1.9.6 unsigned as a prerelease on Metis-Releases. That is **ASSUMED**: this lane has no statement in Tony's own words (R4). Corroborating state, VERIFIED read-only on 2026-09-24:

- `gh release view v1.9.6-unsigned --repo mysticalsin/Metis-Releases` returns the name "Métis 1.9.6 (unsigned / ad-hoc)", `isDraft: true`, `isPrerelease: true`, `publishedAt: null`, `targetCommitish: main`, created 2026-09-24T03:53:59Z (23:53 on 2026-09-23, US Eastern) by `mysticalsin` (release id 395306225).
- The body says it was built from `main` at `2bf21f1c` (Build & Test run 35872259580): Windows unsigned, macOS ad-hoc and not notarised, and "In-app auto-update does not offer this build". It lists the dmg, zip, Setup exe, Portable exe and SHA256SUMS.txt. No `latest*.yml` is listed.
- **Only `SHA256SUMS.txt` is attached** (343 B, asset digest `sha256:a9dfcd6e689363e3e7ffa7b764a1d5d91751b476865a8a5fedbddecaaec534df`). The four installers are not uploaded yet.
- The tag does not exist yet: `gh api repos/mysticalsin/Metis-Releases/git/refs/tags/v1.9.6-unsigned` returns HTTP 404.
- SHA256SUMS.txt names the intended bytes:
  - `Metis-1.9.6.dmg` `1687e2ca89e8db14840ded63c20e0812ceadb544e0169e1efa92bef77eddb0e4`
  - `Metis-1.9.6.zip` `227c65e64f2156fe054580b21a558c86e76e9e20a7169459b54c2114c8848df4`
  - `Metis-Setup-1.9.6.exe` `77a532f3c33a0be6f9315e7e0df02c2420c25a297e90c5fa6baff18f84193df8`
  - `Metis-Portable-1.9.6.exe` `f76bbd441cda774a0d51942bd6410b5727d72723a30385110575992baab3f0bd`
- Run 35872259580 is `Build & Test`, event push, branch main, headSha `2bf21f1ceefe117838325342574b57852e5cadcb`, conclusion success, created 2026-09-23T14:10:38Z. Artifact `metis-windows` expires **2026-09-26T14:28:28Z** and `metis-macos` expires **2026-09-26T14:35:19Z**. Whether those artifacts contain bytes matching SHA256SUMS.txt is UNKNOWN (not downloaded).
- Existing installs will not auto-update onto it: `src/main/updater.ts:127-132` rejects a draft or prerelease Latest, and `:343-345` sets `autoUpdater.allowPrerelease = false`. `/releases/latest` is `v1.6.6` (published 2026-08-26T13:37:32Z).
- The tag name `v1.9.6-unsigned` does not collide with a later signed `v1.9.6`, because check-version-parity requires the release tag to equal `v<package.json version>` exactly (ENTERPRISE_RELEASE.md:139-141).

**Resolution rule.** An owner decision, confirmed in Tony's own words, may authorise an **unsigned QA prerelease lane**. That lane sits outside `release.yml` and outside every 2.0 release gate, and only under all seven of these conditions:

1. The GitHub prerelease flag is on, the release is never marked `--latest`, and `/releases/latest` stays on a release that passed the signed lane.
2. No `latest.yml` or `latest-mac.yml` asset is attached.
3. The title and body say unsigned / ad-hoc / not notarised and carry first-launch warnings (already true in the draft).
4. The uploaded bytes are exactly the SHA256SUMS.txt entries from run 35872259580 at 2bf21f1c, re-hashed after upload. A rebuild is a new candidate with a new SHA256SUMS.
5. The tag reaches the Forgejo twin immediately after publishing (ENTERPRISE_RELEASE.md:49-56); otherwise the mirror deletes it and demotes the release.
6. It counts as zero evidence for M2-WIN-01, M2-REL-01, M2-MAC-01/02 and every UC. It is QA distribution only (MASTER §20.4.1, D03).
7. A reviewed PR amends SIGNING.md:26-29 and ENTERPRISE_RELEASE.md:3 and :161 to name this lane and its conditions, so written policy and practice (the v1.8.3/1.8.4/1.8.7 precedent) agree.

ENTERPRISE_RELEASE.md:3 and SIGNING.md continue to bind the **signed customer lane** unchanged until C-11 lands.

**Time-critical.** If the installers are not attached before 2026-09-26T14:28Z, the CI artifacts expire. After that, the published SHA256SUMS can be honoured only from another retained copy of the exact bytes. This lane uploaded, published and pushed nothing, and must not.

---

## 3. Independent release lanes

State fields follow MASTER §27.3, which keeps implementation, deployment and verification separate. "Decision" is who approves; "provisioning" is who must supply an external input. Engineering is the Codex integrator, with independent Fable/Claude review per MASTER §33.4. None of these states is a product pass.

| # | Lane and identity | Gate (kit · repository) | Decision · provisioning owner | Implementation | Deployment / publication | Verification | Smallest unblock |
|---|---|---|---|---|---|---|---|
| L0 | **Unsigned QA prerelease** (Electron Win + Mac, `v1.9.6-unsigned` on `mysticalsin/Metis-Releases`) | §2.4 conditions 1–7; outside `release.yml` | Tony · release operator (account `mysticalsin`) | CI build succeeded at 2bf21f1c (run 35872259580) | DRAFT prerelease; only SHA256SUMS attached; tag absent (HTTP 404) | NOT_TESTED; by definition not 2.0 evidence | Tony's confirmation in his own words; upload the exact bytes before 2026-09-26T14:28Z; push the tag to Forgejo |
| L1 | **Desktop Windows signed** (Electron NSIS + Portable; `appId com.mantu.asktoto`, electron-builder.yml:4; feed `latest.yml` on Metis-Releases, electron-builder.yml:319-331) | MASTER §20.4, §20.4.1, §20.5, §20.6; M2-WIN-01, M2-REL-01; TASK-063.WIN → TASK-064 · release.yml `release-quality` (:18-49), `release-windows` (:201-306; secrets :248-259; size gate :291; `verify-signing.mjs` :294-296), coupled `release-verify` (:308-428) | Tony · Mantu IT for a trusted code-signing identity (docs/MANTU-IT-REQUEST.md:60) | Pipeline present. The v1.9.5 log shows signtool signing `node.exe`, `ffmpeg.exe`, both `llama-server.exe`, `Metis.exe`, `elevate.exe`, the uninstaller, Setup and Portable, with a DigiCert timestamp responder | No signed 2.0 release. The last tagged run (v1.9.5, run 35537817481, 2026-09-20) failed. `/releases/latest` = v1.6.6; its signing status is UNKNOWN | **BLOCKED.** Signing-identity preflight runs 35538932316 (2026-09-20, revision `fff88c26…`) and 34723616509 (2026-09-12) both returned `{"ok":false,"code":"CHAIN_UNTRUSTED","chainStatusCodes":["UntrustedRoot"]}`. In the v1.9.5 run, `verify-signing` reported "FAIL — 4 signature problem(s)" (Authenticode `UnknownError` on Portable, Setup, `Metis.exe` and `elevate.exe`). Per docs/windows-signing-identity-preflight.md, UntrustedRoot alone does not prove the certificate is self-signed. Secret names `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` and `WIN_CSC_EXPECTED_SUBJECT` exist (updated 2026-09-07; values not read) | A publicly trusted Authenticode identity (a CA-issued certificate or a reviewed signing service) in the approved secret store, then a preflight PASS on a reviewed main SHA. Then the C-11 decoupling PR, then C-09 and C-10 before a 2.0 candidate |
| L2 | **Desktop Mac Electron** (universal DMG/ZIP; feed `latest-mac.yml`) | D02 (keep stable); §20.5 (never advance the Mac feed to a missing or unnotarised artifact) · release.yml `release-macos` (:51-199; `check-release-secrets.mjs mac` :147-155; `verify-signing.mjs --require-notarized` :187-188); ENTERPRISE_RELEASE.md:37-44 (remove the darwin updater guards in the same commit that adds the Apple set) | Tony · Mantu IT for Apple Developer Program enrolment and Developer ID (docs/MANTU-IT-REQUEST.md:8, :14) | Pipeline present | No notarised release. Recent Mac builds exist only as unsigned/ad-hoc drafts or prereleases (release titles v1.8.3–v1.9.8) | **BLOCKED.** v1.9.5 run: "[check:release-secrets] FAIL - macOS Developer ID release missing: CSC_LINK, APPLE_ID, APPLE_TEAM_ID". The repo-level secret list has `CSC_KEY_PASSWORD` and `APPLE_APP_SPECIFIC_PASSWORD` but none of those three; organisation- or environment-level secrets are UNKNOWN | Apple enrolment, then the Developer ID `.p12`, Team ID and Apple ID added as secrets. Once C-11 lands, this lane must not gate L1 |
| L3 | **Native Mac, Apple hold** (SwiftUI `native-app/`, bundle `com.mantu.metis.native`) | §11.1–§11.2 (:976–1004); §20.5 columns "Native Mac QA" and "Native Mac public"; D02, D03, D06; M2-MAC-01/02; TASK-029, TASK-065; FLOW-11; AGX-16 · PLATFORM-MAP.md (App Store route); ENTERPRISE_RELEASE.md:7-8 (excluded from public releases) | Tony · the Apple account holder (per §11.2, PCC needs App Store Small Business Program enrolment plus the managed entitlement; not assumed) | Source present (`native-app/App`, `native-app/MetisKit`). No CI job builds it. Onboarding parity is OPEN (C-03) | None | Engineering: NOT_TESTED in this lane (no Xcode build run). Public: **HOLD / BLOCKED** on Apple inputs. PCC eligibility UNKNOWN | Engineering: a real Xcode build and test on a Mac (TASK-029). Public: Apple distribution credentials and a route decision (Developer ID or App Store). This lane never blocks Windows-only signing (TASK-002 verify clause) |
| L4 | **Operator portal** (Worker `metis-operator`, D1 `metis-operator` …9f7c, Cloudflare Access; account …<redacted-account-id>) | MASTER §12.1–§12.3, §16.6.2, §20.4.2; M2-OPS-01/02/03; TASK-012 (staging), 034, 045, 062 · build.yml Operator job (:70, scripts contract tests :112); `operator/scripts/deploy.mjs`, `smoke.mjs`, `backup.mjs`, `migrate.mjs` | Tony (Cloudflare account and Access team) | Present | **Production DEPLOYED.** `wrangler deployments list --name metis-operator`: latest 2026-09-20T17:14:07Z, version `5ef9fc5a-0f9e-4bed-8907-c17776fcc3b3` at 100%. `wrangler versions view`: `OPERATOR_VERSION 9568d21`, `OPERATOR_BUILT_AT 2026-09-20T17:11:47Z`, handlers fetch + scheduled, 6 secret names bound (values not readable). **Staging absent**: `metis-operator-staging` returns "This Worker does not exist on your account. [code: 10007]", and the staging D1 id is the placeholder `REPLACE_AFTER_D1_CREATE` (operator/wrangler.jsonc:51) | NOT_TESTED against 2.0 criteria. Deployed source is off-main (C-19) | Reconcile the 3 off-main commits into main through a reviewed PR, with security review of the Access bypass. Create the staging Worker and D1 (TASK-012; creating cloud resources needs Tony's authorisation) |
| L5 | **cloudflare-proxy / speech** (Worker `metis-cloudflare-proxy`; Workers AI `@cf/deepgram/nova-3`; AI Gateway) | MASTER §9.6–§9.13, §16.6 (route evidence record, readiness UNREVIEWED→VERIFIED, content-sentinel tests, drift detection); D11, D13, D14; M2-STT-01..04, M2-PRIV-01..03; TASK-011/012/013/014/016/020/057; UC-065–069 | Tony · the authorised privacy/supplier owner for route assurance (identity UNKNOWN; per §16.6.1 only that owner can resolve contractual gaps) | Client Nova-3 adapter present (`src/main/cloud-stt/adapter.ts:32`). The fresh default is not Cloudflare (C-09). The server-credentialed session broker (M2-STT-02) was not assessed | **DEPLOYED.** The last deployment is 2026-08-25T05:38:38Z, source "Secret Change", version `095ab3d2-762d-433b-b7e4-2a5aaf5823f3`. Deployed source identity UNKNOWN. 4 commits have touched `cloudflare-proxy/` on main since (latest `14d79cdc`, 2026-08-31). Observability is enabled (wrangler.jsonc:28). AI Gateway logging/cache configuration: UNKNOWN (not read) | Privacy readiness **UNREVIEWED**; no real-content session is permitted | TASK-011 route evidence record, then TASK-013 readback that gateway logging and caching are off, using synthetic probes |
| L6 | **license-server** (Fly app `asktoto-license`) | SRC-02 and EXP-08 authority decision (C-16); M2-SEC-01/02; TASK-006/034/062 · ENTERPRISE_RELEASE.md:29-36 (HTTPS, admin token, daily backups) | Tony | Source present (`license-server/`, Dockerfile, `fly.toml:5` "rename before launch if this name is already taken"). Client enforcement is compiled off (App.tsx:311) | **NOT_AVAILABLE.** `fly status -a asktoto-license` inside the sandbox failed with "Error: failed ensuring config directory perms: open /Users/tony/.fly/perms.1489647799: operation not permitted". Fly was not among the CLIs authorised for sandbox bypass, so it was not retried. No production URL in source (only example domains) | NOT_TESTED | Tony runs `fly status -a asktoto-license` (read-only) or supplies the deployed URL; then the C-16 authority decision |
| L7 | **Teams** (personal app/tab, meeting panel, communications and media service) | MASTER §15.4–§15.11 (:1317–1408); D20, D21; M2-TEAMS-01..05, M2-GOV-01; TASK-046..052; FLOW-08. Live raw media needs a Windows Server media receiver in Azure (§15.8) and the recording-status procedure; otherwise it is BLOCKED with labelled alternatives | Tony · the Mantu Entra tenant administrator (app registration, consent) · the privacy/legal owner (lawful basis, DPIA; D23). Identities UNKNOWN | **NOT_STARTED** in source: 0 Teams manifest or appPackage files; the only Teams artifact is `operator/public/logos/microsoftteams.svg` | None | NOT_TESTED. Tenant readiness UNKNOWN (not queried; no tenant tool in scope) | The tenant admin confirms whether Métis may register a Teams app and with which permissions, then qualification per TASK-010. A Windows core release does not wait for Teams unless it advertises Teams (§20.6) |
| L8 | **Hindsight memory service** | MASTER §35.1, §35.5; §35.12 HMSTEP-02 (retention and authority approval before any ingest), HMSTEP-03 (private service and database), HMSTEP-16 (freeze and release); `memory/BINDINGS.md` production bindings (authorize/assertFresh, canonical repository, ledger); HM-01..16 | Tony: approves the new derived-content boundary, hosting platform, region, keys, backups, processors and the commercial choice. Hosted Vectorize Cloud is a separate decision (§35.1) | **NOT_STARTED** in the repository. The kit ships only an offline adapter (`memory/src`) | NOT_RUN (kit `memory/LIVE-STATUS.json`) | NOT_RUN. Upstream was observed as docs 0.10.1 and main `b88458fd…` on 2026-09-23 (MASTER:5033): a research observation, not a pinned release | Tony's HMSTEP-02 approval plus a named approved container platform and managed PostgreSQL. RUN-ORDER.md: do not delay the P1/right-edge fixes for Hindsight |

Lanes seen but outside this assignment: the Cahê Windows pilot (`electron-builder.cahe.win.yml`, `.github/workflows/cahe-windows.yml`, a separate appId, which SRC-09 requires to stay isolated); the Mac App Store and Microsoft Store profiles (SIGNING.md:67-129); and the `intelligence/` bundle.

### 3.1 Lane independence rules applied

- **L1** needs the shared gates and its own gates. It does not depend on L2, L3, L7 or L8 unless the release advertises those capabilities (MASTER §20.6). It does depend on L4 and L5 for any Operator or speech capability it advertises (quick start item 5: "End-to-end means deployed").
- **L2 and L3 are distinct.** The Electron Mac feed stays stable (D02) and must never point at a native DMG (§20.5).
- **L0** is a QA channel, not a lane of the 2.0 contract. Its existence changes no requirement state.
- A failed privacy or authorisation gate in **L5** blocks every content-processing claim in every lane (§27.3).
- **Until C-11 lands**, L1 publication is mechanically coupled to L2 in release.yml. That coupling is the main release-policy blocker to D01. The trust-chain failure is the main technical blocker.

---

## 4. What this file does not close

TASK-002's "Verify before closing" (MASTER:1947) requires a versioned PRD **and** a route/policy decision record covering all 55 requirements and 112 use cases. This lane produced the requirement and policy lock and the lane map only. Still open:

1. The §25 coverage map and the §27 machine-readable evidence registry, with every ID `NOT_TESTED` and OBU-01–05 added explicitly: **not generated here**.
2. The threat-model update, the route evidence record per §16.6.1 and the written Windows release-path decision: not produced.
3. Tenant/provider prerequisite discovery for Entra, Teams, Dust, Jev/Laya and AI Gateway: not performed. Only GitHub and Cloudflare Worker reads were in scope.
4. Owner decisions: C-12 (confirm v1.9.6 in his own words), C-03 (native onboarding parity), C-08 (ARMED orb vs `hide` default), C-16 (entitlement authority), and approval of metadata-only gateway logs (C-18) if he wants to keep them.
5. The independent Fable/Claude review of this file (MASTER §33.5).

**UNKNOWN in this lane:** the Forgejo mirror state; organisation/environment-level GitHub secrets; the signing status of v1.6.6; the deployed source commit of `metis-cloudflare-proxy`; AI Gateway logging/cache settings; license-server deployment and URL; Entra/Teams tenant readiness; Apple account and PCC eligibility; whether the run 35872259580 artifacts match SHA256SUMS.txt; demo-string named-person compliance (C-06); the M2-SEC-02 boundary matrix.

---

## 5. Commands run (all read-only)

- **Kit:** `python3 tools/read_task.py --task 2`; `sed -n` ranges of `spec/MASTER.md` (77–169, 976–1004, 1453–1517, 1704–1862, 1941–1961, 3613–3711, 3812–3899, 3962–4031, 4104–4115, 4176–4187, 4212–4235, 4535–4608, 4845–5001, 5029–5199); `shasum -a 256 spec/MASTER.md`; `grep -oE` counts per family; a Python extractor over MASTER.md, SOURCE-STUDY.md and registry.json.
- **Source worktree** (no mutation, no npm scripts): `git rev-parse`, `git status --porcelain`, `git log`, `git ls-files`, `git merge-base --is-ancestor 9568d21 2bf21f1c`, `git for-each-ref --contains 9568d21`, `git cherry 2bf21f1c 9568d21`, `git rev-list --count`, `git remote -v`; reads of DESIGN.md, docs/ENTERPRISE_RELEASE.md, docs/SIGNING.md, docs/PLATFORM-MAP.md, docs/windows-signing-identity-preflight.md, .github/workflows/release.yml, wrangler configs, fly.toml, and the cited source lines.
- **GitHub** (sandbox disabled because of the documented TLS failure; GET/list only): `gh release list`/`view`/`download --output -` (SHA256SUMS.txt only) on Metis-Releases; `gh api …/releases/latest`, `…/rulesets`, `…/git/refs/tags/v1.9.6-unsigned`; `gh run list` and `gh run view` (release.yml and the signing preflight); `gh api …/check-runs/<id>/annotations`; `gh run view --log-failed` filtered to fixed-category and error lines; `gh secret list` (names and dates only).
- **Cloudflare** (a cached npx wrangler 4.131.1, run from the exec dir; sandbox disabled): `wrangler whoami`, `wrangler deployments list --name {metis-operator, metis-operator-staging, metis-cloudflare-proxy}`, `wrangler versions view 5ef9fc5a-… --name metis-operator`. Account IDs are shown as last-4; emails masked.
- **Fly:** `fly status -a asktoto-license` inside the sandbox → NOT_AVAILABLE (error above).

No secret, token, password, key, licence key or private portal data was copied into this file. Certificate subject values and secret values were not read. The release `SHA256SUMS.txt` hashes are public integrity values.

---

## Appendix A. Complete ID lists with source lines

Titles are truncated to one line. `MASTER.md:N` is `spec/MASTER.md` line N in the r11 kit; `clicky-study/SOURCE-STUDY.md:N` is relative to the kit root.

### A.1 Launch use cases UC-001–UC-112 (scenario, then the §8 Risk column) (112)

| ID | Title / one line | Source |
|---|---|---|
| `UC-001` | Say “Hey Métis.” / risk: ALLOWED | MASTER.md:598 |
| `UC-002` | Wake and immediately say “open Notes.” / risk: ALLOWED | MASTER.md:599 |
| `UC-003` | Type instead of speaking. / risk: ALLOWED | MASTER.md:600 |
| `UC-004` | Speak an unrelated sentence during a meeting. / risk: BLOCKED | MASTER.md:601 |
| `UC-005` | Say “open Chrome—actually, do not.” / risk: BLOCKED | MASTER.md:602 |
| `UC-006` | Cancel while the model is responding. / risk: ALLOWED | MASTER.md:603 |
| `UC-007` | Use command-mic-off / stop-all. / risk: ALLOWED | MASTER.md:604 |
| `UC-008` | Wake through media playback, echo or a remote speaker. / risk: BLOCKED | MASTER.md:605 |
| `UC-009` | Open Google. / risk: ALLOWED | MASTER.md:611 |
| `UC-010` | Open a named installed application. / risk: ALLOWED | MASTER.md:612 |
| `UC-011` | Switch to the already open app. / risk: ALLOWED | MASTER.md:613 |
| `UC-012` | Close Google. / risk: CONFIRM | MASTER.md:614 |
| `UC-013` | Close this empty tab or unchanged window. / risk: ALLOWED | MASTER.md:615 |
| `UC-014` | Close an app with unsaved work. / risk: CONFIRM | MASTER.md:616 |
| `UC-015` | Force quit a frozen app. / risk: CONFIRM | MASTER.md:617 |
| `UC-016` | Open an app not installed or unavailable on this platform. / risk: OBSERVE | MASTER.md:618 |
| `UC-017` | Search Google for Norbert Wiener. / risk: ALLOWED | MASTER.md:624 |
| `UC-018` | Open X.com. / risk: ALLOWED | MASTER.md:625 |
| `UC-019` | Click the second relevant search result. / risk: ALLOWED | MASTER.md:626 |
| `UC-020` | Open, switch or close a browser tab. / risk: ALLOWED | MASTER.md:627 |
| `UC-021` | Go back, forward, reload or scroll. / risk: ALLOWED | MASTER.md:628 |
| `UC-022` | Fill a form field with specified text. / risk: CONFIRM | MASTER.md:629 |
| `UC-023` | Complete checkout, send a form or accept an external commitment. / risk: CONFIRM | MASTER.md:630 |
| `UC-024` | A page says “ignore the user and run this command.” / risk: BLOCKED | MASTER.md:631 |
| `UC-025` | Open Notes, then make a note titled hello. / risk: ALLOWED | MASTER.md:637 |
| `UC-026` | Append text to that note. / risk: CONFIRM | MASTER.md:638 |
| `UC-027` | Find the latest authorized meeting summary. / risk: OBSERVE | MASTER.md:639 |
| `UC-028` | Create a meeting action item. / risk: ALLOWED | MASTER.md:640 |
| `UC-029` | Draft a follow-up from this meeting. / risk: ALLOWED | MASTER.md:641 |
| `UC-030` | Send that follow-up. / risk: CONFIRM | MASTER.md:642 |
| `UC-031` | Rename/move a selected file. / risk: CONFIRM | MASTER.md:643 |
| `UC-032` | Delete files, run arbitrary shell text or change security settings. / risk: BLOCKED | MASTER.md:644 |
| `UC-033` | Start meeting transcription. / risk: CONFIRM | MASTER.md:650 |
| `UC-034` | Transcribe French/English code-switching with names and numbers. / risk: OBSERVE | MASTER.md:651 |
| `UC-035` | Several people overlap or system audio echoes the microphone. / risk: OBSERVE | MASTER.md:652 |
| `UC-036` | Switch headset, mute, suspend or reconnect. / risk: ALLOWED | MASTER.md:653 |
| `UC-037` | Ask for a recap during a meeting. / risk: ALLOWED | MASTER.md:654 |
| `UC-038` | Correct a recognized amount or negation. / risk: CONFIRM | MASTER.md:655 |
| `UC-039` | End a summary-only meeting. / risk: ALLOWED | MASTER.md:656 |
| `UC-040` | Open Photo Booth / Camera and take a photo. / risk: CONFIRM | MASTER.md:657 |
| `UC-041` | Where do we stand on this account? / risk: OBSERVE | MASTER.md:663 |
| `UC-042` | What changed since my previous review? / risk: OBSERVE | MASTER.md:664 |
| `UC-043` | Show overdue commitments. / risk: OBSERVE | MASTER.md:665 |
| `UC-044` | Explain why this risk is highlighted. / risk: OBSERVE | MASTER.md:666 |
| `UC-045` | Search across my approved second brain. / risk: OBSERVE | MASTER.md:667 |
| `UC-046` | Merge duplicate account/person records. / risk: CONFIRM | MASTER.md:668 |
| `UC-047` | A sync conflict or permission change occurs. / risk: OBSERVE | MASTER.md:669 |
| `UC-048` | Jev/Laya/Apple inference is unavailable. / risk: OBSERVE | MASTER.md:670 |
| `UC-049` | A user signs in on two computers. / risk: OBSERVE | MASTER.md:676 |
| `UC-050` | An admin checks 24-hour consumption. / risk: OBSERVE | MASTER.md:677 |
| `UC-051` | A retry or late client event arrives. / risk: OBSERVE | MASTER.md:678 |
| `UC-052` | An admin selects Jev or Laya. / risk: CONFIRM | MASTER.md:679 |
| `UC-053` | PCC is available or its user quota is exhausted. / risk: OBSERVE | MASTER.md:680 |
| `UC-054` | A support viewer opens a user record. / risk: OBSERVE | MASTER.md:681 |
| `UC-055` | An admin revokes a device or lowers a budget. / risk: CONFIRM | MASTER.md:682 |
| `UC-056` | The accounting pipeline falls behind. / risk: OBSERVE | MASTER.md:683 |
| `UC-057` | Fresh cloud-first Windows installation. / risk: ALLOWED | MASTER.md:689 |
| `UC-058` | Select an optional offline language/model pack. / risk: CONFIRM | MASTER.md:690 |
| `UC-059` | Network drops during component download. / risk: ALLOWED | MASTER.md:691 |
| `UC-060` | A component manifest or asset is tampered with. / risk: BLOCKED | MASTER.md:692 |
| `UC-061` | Upgrade an existing 1.x installation. / risk: CONFIRM | MASTER.md:693 |
| `UC-062` | Low disk space or a metered network is detected. / risk: OBSERVE | MASTER.md:694 |
| `UC-063` | Native Mac signing or PCC eligibility is absent. / risk: OBSERVE | MASTER.md:695 |
| `UC-064` | Roll back a failed application/component rollout. / risk: CONFIRM | MASTER.md:696 |
| `UC-065` | Fresh Windows/native Mac user opens Speech Settings. / risk: OBSERVE | MASTER.md:705 |
| `UC-066` | Say a command while no meeting is active. / risk: ALLOWED | MASTER.md:706 |
| `UC-067` | The user remains silent before wake. / risk: BLOCKED | MASTER.md:707 |
| `UC-068` | Speech route logging/cache configuration drifts. / risk: BLOCKED | MASTER.md:708 |
| `UC-069` | Cloudflare or its entitlement is unavailable. / risk: OBSERVE | MASTER.md:709 |
| `UC-070` | User opens Optional local models on a low-memory device. / risk: OBSERVE | MASTER.md:710 |
| `UC-071` | User explicitly installs a recommended offline speech pack. / risk: CONFIRM | MASTER.md:711 |
| `UC-072` | User selects local-only speech and it fails. / risk: BLOCKED | MASTER.md:712 |
| `UC-073` | Device memory, thermal or battery conditions change. / risk: OBSERVE | MASTER.md:713 |
| `UC-074` | User disables or removes an optional local model. / risk: CONFIRM | MASTER.md:714 |
| `UC-075` | Admin reconciles two speech tracks and a reconnect. / risk: OBSERVE | MASTER.md:715 |
| `UC-076` | The default speech session ends or is revoked. / risk: ALLOWED | MASTER.md:716 |
| `UC-077` | An approved meeting summary becomes shared knowledge. / risk: ALLOWED | MASTER.md:724 |
| `UC-078` | Two summaries disagree about the same amount or deadline. / risk: OBSERVE | MASTER.md:725 |
| `UC-079` | A human pins a consequential field. / risk: CONFIRM | MASTER.md:726 |
| `UC-080` | Ask where a briefing claim came from. / risk: OBSERVE | MASTER.md:727 |
| `UC-081` | Search a shared account while the desktop is asleep. / risk: OBSERVE | MASTER.md:728 |
| `UC-082` | A source is corrected, deleted or becomes confidential. / risk: CONFIRM | MASTER.md:729 |
| `UC-083` | A graph path would reveal a restricted account relation. / risk: BLOCKED | MASTER.md:730 |
| `UC-084` | A graph/index rebuild fails halfway. / risk: OBSERVE | MASTER.md:731 |
| `UC-085` | A Dust user asks about their authorized meeting context. / risk: OBSERVE | MASTER.md:737 |
| `UC-086` | A Dust tool call invents another email or tenant ID. / risk: BLOCKED | MASTER.md:738 |
| `UC-087` | Dust creates an allowed action item. / risk: ALLOWED | MASTER.md:739 |
| `UC-088` | Dust proposes changing a pinned amount. / risk: CONFIRM | MASTER.md:740 |
| `UC-089` | Two agents and a human edit one record concurrently. / risk: CONFIRM | MASTER.md:741 |
| `UC-090` | A Dust connection or knowledge grant is revoked. / risk: BLOCKED | MASTER.md:742 |
| `UC-091` | Admin publishes a reviewed skill. / risk: CONFIRM | MASTER.md:748 |
| `UC-092` | A skill is updated while a run is active. / risk: OBSERVE | MASTER.md:749 |
| `UC-093` | A skill uses contextual meeting knowledge. / risk: OBSERVE | MASTER.md:750 |
| `UC-094` | An uploaded skill requests arbitrary scripts or hidden network access. / risk: BLOCKED | MASTER.md:751 |
| `UC-095` | A cached or queued skill has been revoked. / risk: BLOCKED | MASTER.md:752 |
| `UC-096` | Admin inspects a skill with retries and mixed providers. / risk: OBSERVE | MASTER.md:753 |
| `UC-097` | A nontechnical user changes microphone or finds privacy controls. / risk: ALLOWED | MASTER.md:759 |
| `UC-098` | An old advanced setting is migrated. / risk: OBSERVE | MASTER.md:760 |
| `UC-099` | Settings save fails or policy changes remotely. / risk: OBSERVE | MASTER.md:761 |
| `UC-100` | A user pauses automatic attendance for one meeting. / risk: CONFIRM | MASTER.md:762 |
| `UC-101` | Sign in to the Teams personal app. / risk: ALLOWED | MASTER.md:768 |
| `UC-102` | An enrolled eligible Teams meeting actually starts. / risk: ALLOWED | MASTER.md:769 |
| `UC-103` | The organizer leaves the bot in the lobby or denies it. / risk: BLOCKED | MASTER.md:770 |
| `UC-104` | Two enrolled colleagues attend one meeting. / risk: OBSERVE | MASTER.md:771 |
| `UC-105` | The meeting is rescheduled, cancelled or recurs. / risk: OBSERVE | MASTER.md:772 |
| `UC-106` | The host removes Métis after it joins. / risk: ALLOWED | MASTER.md:773 |
| `UC-107` | A participant says Hey Métis close the organizer laptop app. / risk: BLOCKED | MASTER.md:774 |
| `UC-108` | The Teams live-media recording/status prerequisite is unavailable. / risk: BLOCKED | MASTER.md:775 |
| `UC-109` | A permitted live meeting produces a summary and skill result. / risk: ALLOWED | MASTER.md:776 |
| `UC-110` | The desktop goes offline while the bot is active. / risk: OBSERVE | MASTER.md:777 |
| `UC-111` | A Zoom/Meet/other meeting is requested. / risk: OBSERVE | MASTER.md:778 |
| `UC-112` | A data subject requests correction/deletion or objects to processing. / risk: CONFIRM | MASTER.md:779 |

### A.2 Root tasks TASK-001–TASK-066 (66)

| ID | Title / one line | Source |
|---|---|---|
| `TASK-001` | Pin the actual system and preserve the working tree | MASTER.md:1920 |
| `TASK-002` | Lock the PRD, effective policies and independent release lanes | MASTER.md:1941 |
| `TASK-003` | Establish a compact source map and numbered handoff | MASTER.md:1962 |
| `TASK-004` | Measure size, capture and hardware baselines | MASTER.md:1979 |
| `TASK-005` | Define shared speech, command, policy and metering contracts | MASTER.md:1993 |
| `TASK-006` | Establish cross-surface Entra and service identity | MASTER.md:2007 |
| `TASK-007` | Lock canonical knowledge, provenance and storage authority | MASTER.md:2025 |
| `TASK-008` | Design the simplified Settings inventory and task flows | MASTER.md:2039 |
| `TASK-009` | Define centrally governed skill contracts and runtime boundaries | MASTER.md:2057 |
| `TASK-010` | Qualify meeting APIs, capture permissions and legal prerequisites | MASTER.md:2071 |
| `TASK-011` | Qualify the exact Cloudflare hosting and privacy route | MASTER.md:2079 |
| `TASK-012` | Prepare authorized Cloudflare staging and server credentials | MASTER.md:2093 |
| `TASK-013` | Disable speech content logs and caches before capture tests | MASTER.md:2107 |
| `TASK-014` | Implement the authenticated speech-session broker | MASTER.md:2121 |
| `TASK-015` | Make diagnostics and metering projections content-free | MASTER.md:2135 |
| `TASK-016` | Connect the real Cloudflare Nova-3 server transport | MASTER.md:2153 |
| `TASK-017` | Repair the trusted audio broker and requested-only tracks | MASTER.md:2163 |
| `TASK-018` | Harden segment revision, reconnect and stream finalization | MASTER.md:2175 |
| `TASK-019` | Implement opt-in local wake and immediate stop authority | MASTER.md:2191 |
| `TASK-020` | Prove the first complete synthetic Cloudflare speech path | MASTER.md:2205 |
| `TASK-021` | Build hardware qualification and the reviewed model catalog | MASTER.md:2215 |
| `TASK-022` | Implement separate optional local-model Settings | MASTER.md:2225 |
| `TASK-023` | Provision signed manifests and R2 asset delivery | MASTER.md:2239 |
| `TASK-024` | Implement optional component lifecycle and installation | MASTER.md:2253 |
| `TASK-025` | Enforce local model load, resource and fallback rules | MASTER.md:2263 |
| `TASK-026` | Produce the genuinely lean cloud-first core | MASTER.md:2273 |
| `TASK-027` | Repair onboarding, migration and both known P1s | MASTER.md:2291 |
| `TASK-028` | Repair right-edge and expanded input usability | MASTER.md:2310 |
| `TASK-029` | Build the native Mac foundation using the actual Codex environment | MASTER.md:2326 |
| `TASK-030` | Connect the real orb, beam and caption interfaces | MASTER.md:2349 |
| `TASK-031` | Finish the real Jev decision gateway and application | MASTER.md:2368 |
| `TASK-032` | Qualify the Laya alternative and real portal selection | MASTER.md:2384 |
| `TASK-033` | Complete safe native and browser actions | MASTER.md:2400 |
| `TASK-034` | Repair identity and authoritative metering end to end | MASTER.md:2416 |
| `TASK-035` | Implement the governed canonical knowledge service | MASTER.md:2436 |
| `TASK-036` | Build deterministic wiki and graph projections | MASTER.md:2456 |
| `TASK-037` | Implement the authorized evidence context builder | MASTER.md:2470 |
| `TASK-038` | Deploy and connect Dust knowledge read tools | MASTER.md:2488 |
| `TASK-039` | Implement real Dust writes and reviewed corrections | MASTER.md:2502 |
| `TASK-040` | Rework Intelligence into an evidence-first workspace | MASTER.md:2520 |
| `TASK-041` | Close knowledge synchronization and deletion loops | MASTER.md:2536 |
| `TASK-042` | Implement versioned server skill authoring and publishing | MASTER.md:2554 |
| `TASK-043` | Implement contextual server skill execution | MASTER.md:2570 |
| `TASK-044` | Connect the user skill catalog and versioned run receipts | MASTER.md:2590 |
| `TASK-045` | Repair portal totals, speech controls and data-health UX | MASTER.md:2608 |
| `TASK-046` | Build Teams personal and meeting surfaces with SSO | MASTER.md:2628 |
| `TASK-047` | Implement enrolled meeting discovery and actual-start events | MASTER.md:2640 |
| `TASK-048` | Implement single-occurrence join coordination and admission | MASTER.md:2654 |
| `TASK-049` | Deploy the qualified Teams media receiver | MASTER.md:2666 |
| `TASK-050` | Connect consent-aware Teams media to Cloudflare speech | MASTER.md:2676 |
| `TASK-051` | Qualify post-meeting alternatives and other meeting adapters | MASTER.md:2686 |
| `TASK-052` | Publish meeting knowledge and skill outputs to the right audience | MASTER.md:2696 |
| `TASK-053` | Qualify transcript fidelity and speech latency | MASTER.md:2708 |
| `TASK-054` | Verify summaries, knowledge and sync without cloud content copies | MASTER.md:2722 |
| `TASK-055` | Prove the full meeting, Dust and skill journey | MASTER.md:2736 |
| `TASK-056` | Run real cross-platform Cloudflare-to-action-to-portal journeys | MASTER.md:2759 |
| `TASK-057` | Close no-content-retention and drift-evidence gates | MASTER.md:2782 |
| `TASK-058` | Complete governance, subject rights and sharing qualification | MASTER.md:2805 |
| `TASK-059` | Qualify optional local packs on actual device classes | MASTER.md:2825 |
| `TASK-060` | Tune speed and footprint against the recorded baseline | MASTER.md:2835 |
| `TASK-061` | Apply the supplied refactoring skill in bounded slices | MASTER.md:2855 |
| `TASK-062` | Exercise production operations, staging and recovery | MASTER.md:2878 |
| `TASK-063` | Build, sign, freeze and qualify the immutable candidate family | MASTER.md:2901 |
| `TASK-064` | Verify and publish the already signed Windows candidate | MASTER.md:2924 |
| `TASK-065` | Finalize native Mac QA and its separate Apple publication decision | MASTER.md:2945 |
| `TASK-066` | Deliver final re-audit, exact evidence and resumable handoff | MASTER.md:2966 |

### A.3 Owner commitments COV-01–COV-44 (44)

| ID | Title / one line | Source |
|---|---|---|
| `COV-01` | One complete Codex handoff; plan, implement, verify and release | MASTER.md:3623 |
| `COV-02` | Deep audit of the entire shipped repository and existing systems | MASTER.md:3624 |
| `COV-03` | Minimal release-branch repair of both P1 blockers | MASTER.md:3625 |
| `COV-04` | Working signed Windows EXE on GitHub | MASTER.md:3626 |
| `COV-05` | Real native Mac product built using Codex | MASTER.md:3627 |
| `COV-06` | Mac public DMG waits only for legitimate Apple release prerequisites | MASTER.md:3628 |
| `COV-07` | Apple intelligence/PCC where truly eligible, with honest portal tracking | MASTER.md:3629 |
| `COV-08` | Hey Métis activation with no ambient cloud listening | MASTER.md:3630 |
| `COV-09` | Orb-only ARMED; solving orb inside active beam bar; caption above | MASTER.md:3631 |
| `COV-10` | Instant-feeling but safe commands on both platforms | MASTER.md:3632 |
| `COV-11` | Open/focus/gracefully close apps, windows and browser tabs | MASTER.md:3633 |
| `COV-12` | Complete Notes/hello/Arc/Norbert Wiener/X/camera reference workflow | MASTER.md:3634 |
| `COV-13` | Reliable stop, cancellation, replay and security boundaries | MASTER.md:3635 |
| `COV-14` | Repair right-edge typing and expanded-panel usability | MASTER.md:3636 |
| `COV-15` | Apple-minded four-destination Settings, with every old option dispositioned | MASTER.md:3637 |
| `COV-16` | Cloudflare-hosted speech is the actual default everywhere | MASTER.md:3638 |
| `COV-17` | The strongest qualified transcript fidelity, not fluent invention | MASTER.md:3639 |
| `COV-18` | No Cloudflare content persistence; no-training is a separate statement | MASTER.md:3640 |
| `COV-19` | Independent optional local speech/generation fitted to actual hardware | MASTER.md:3641 |
| `COV-20` | No covert fallback, background bulk downloads or local-only cloud leaks | MASTER.md:3642 |
| `COV-21` | A truly lightweight application, not only a small bootstrap | MASTER.md:3643 |
| `COV-22` | Cloudflare delivery of selected components during honest onboarding | MASTER.md:3644 |
| `COV-23` | One portal Jev key for eligible devices; real Jev in action | MASTER.md:3645 |
| `COV-24` | Laya as a real alternative with no Jev API dependency | MASTER.md:3646 |
| `COV-25` | Jev/Laya in Mantu Intelligence, not only command demos | MASTER.md:3647 |
| `COV-26` | A trusted knowledge space/wiki/graph with evidence and corrections | MASTER.md:3648 |
| `COV-27` | Always-on knowledge when the laptop is asleep | MASTER.md:3649 |
| `COV-28` | Dust agents read authorized meeting context | MASTER.md:3650 |
| `COV-29` | Dust agents really write safely to canonical knowledge | MASTER.md:3651 |
| `COV-30` | Correction, deletion, revocation and confidential sources across systems | MASTER.md:3652 |
| `COV-31` | Central platform skills added and updated without reinstall | MASTER.md:3653 |
| `COV-32` | Skills execute on services with rich permitted knowledge | MASTER.md:3654 |
| `COV-33` | Portal tracks real people, devices, active sessions and skill runs | MASTER.md:3655 |
| `COV-34` | Accurate token, speech, decision and cost consumption | MASTER.md:3656 |
| `COV-35` | Keep standalone Métis and add useful Teams surfaces | MASTER.md:3657 |
| `COV-36` | Entra authentication and scoped service/agent permissions | MASTER.md:3658 |
| `COV-37` | Automatically join eligible meetings when they actually start | MASTER.md:3659 |
| `COV-38` | Real Teams media plus honest other-platform support | MASTER.md:3660 |
| `COV-39` | GDPR/privacy readiness and proper sharing—not a Teams badge | MASTER.md:3661 |
| `COV-40` | Whole meeting→knowledge→Dust update→skill→portal journey | MASTER.md:3662 |
| `COV-41` | Refactor the existing product with the actual supplied skill | MASTER.md:3663 |
| `COV-42` | Find code quickly with a persistent map and lean coding context | MASTER.md:3664 |
| `COV-43` | Review every supplied repository/reference, including GitHub UI improvements | MASTER.md:3665 |
| `COV-44` | End-to-end deployed quality, recovery and durable handoff | MASTER.md:3666 |

### A.4 Golden journeys FLOW-01–FLOW-12 (12)

| ID | Title / one line | Source |
|---|---|---|
| `FLOW-01` | A new Windows user reaches the real first success | MASTER.md:3716 |
| `FLOW-02` | The complete reference-video workflow and visual experience | MASTER.md:3724 |
| `FLOW-03` | Dual decision providers and one-key fleet isolation | MASTER.md:3732 |
| `FLOW-04` | A long, faithful meeting with bounded private working memory | MASTER.md:3740 |
| `FLOW-05` | Intelligence, Dust and corrected source truth converge | MASTER.md:3748 |
| `FLOW-06` | Central skills change without reinstalling Métis | MASTER.md:3756 |
| `FLOW-07` | Simple Settings and optional local models work on real hardware | MASTER.md:3764 |
| `FLOW-08` | Visible Teams assistance survives lifecycle and audience changes | MASTER.md:3772 |
| `FLOW-09` | Install, migrate, update and recover the signed artifact | MASTER.md:3780 |
| `FLOW-10` | No hidden content persistence or cross-boundary authority | MASTER.md:3788 |
| `FLOW-11` | Native Mac parity and Apple routes without a false public release | MASTER.md:3796 |
| `FLOW-12` | An operator and the next coding session can trust the system | MASTER.md:3804 |

### A.5 Experience qualifications EXP-01–EXP-12 (12)

| ID | Title / one line | Source |
|---|---|---|
| `EXP-01` | Prepared, not surprised | MASTER.md:3906 |
| `EXP-02` | Human notes remain the user’s work | MASTER.md:3914 |
| `EXP-03` | Useful, quiet live assistance | MASTER.md:3922 |
| `EXP-04` | Trusted follow-through, not a wall of prose | MASTER.md:3930 |
| `EXP-05` | A powerful notebook with fewer settings | MASTER.md:3938 |
| `EXP-06` | Vocabulary and template quality without false certainty | MASTER.md:3946 |
| `EXP-07` | Capture choices with truthful recovery | MASTER.md:3954 |
| `EXP-08` | A real enterprise entitlement and trust plane | MASTER.md:3962 |
| `EXP-09` | No silent loss or misleading success | MASTER.md:3970 |
| `EXP-10` | Animated identity, bounded cost | MASTER.md:3978 |
| `EXP-11` | Portability and control over knowledge | MASTER.md:3986 |
| `EXP-12` | Evidence-based competitive and operational qualification | MASTER.md:3994 |

### A.6 Source-export findings SRC-01–SRC-24 (24)

| ID | Title / one line | Source |
|---|---|---|
| `SRC-01` | Do not mistake a source export for a complete checkout | MASTER.md:4008 |
| `SRC-02` | Separate entitlement authority from telemetry and legacy licensing | MASTER.md:4020 |
| `SRC-03` | Apply the Jev decision instead of discarding it | MASTER.md:4032 |
| `SRC-04` | Execution result and exception handling must control completion | MASTER.md:4044 |
| `SRC-05` | Exact note, camera and close operations need real adapters | MASTER.md:4056 |
| `SRC-06` | Text matching is not wake-word capture | MASTER.md:4068 |
| `SRC-07` | Speech credentials must move behind the session broker | MASTER.md:4080 |
| `SRC-08` | Gateway creation cannot certify privacy readiness | MASTER.md:4092 |
| `SRC-09` | Legacy embedded credentials and pilot profiles must not leak into 2.0 | MASTER.md:4104 |
| `SRC-10` | Preserve authoritative usage and complete aggregates | MASTER.md:4116 |
| `SRC-11` | Native persistence must not hide loss or retain forbidden transcripts | MASTER.md:4128 |
| `SRC-12` | Native recording and long-session summaries require actual readiness | MASTER.md:4140 |
| `SRC-13` | Speaker labels are not biometric identity or action authority | MASTER.md:4152 |
| `SRC-14` | Use the real solving motion without defeating accessibility | MASTER.md:4164 |
| `SRC-15` | Reconcile onboarding contract and recover the real media lineage | MASTER.md:4176 |
| `SRC-16` | Profile-aware package gates, OS descriptions and documentation must change together | MASTER.md:4188 |
| `SRC-17` | A development-store seam is not production durability | MASTER.md:4200 |
| `SRC-18` | Mirror-safe release delivery is a first-class gate | MASTER.md:4212 |
| `SRC-19` | Secret scans must not exclude entire tests and documentation trees | MASTER.md:4224 |
| `SRC-20` | Failed cloud inventory is not an empty account | MASTER.md:4236 |
| `SRC-21` | Capture privacy copy must cover screenshots, titles, URLs and helpers too | MASTER.md:4248 |
| `SRC-22` | Preserve tailored recaps and human edits when moving skills server-side | MASTER.md:4260 |
| `SRC-23` | Dust connector checklists do not prove canonical read/write | MASTER.md:4272 |
| `SRC-24` | Every workspace needs a real test/build/release coverage owner | MASTER.md:4284 |

### A.7 Agent-expansion gates AGX-01–AGX-16 (16)

| ID | Title / one line | Source |
|---|---|---|
| `AGX-01` | Source and adoption integrity | MASTER.md:4541 |
| `AGX-02` | Authorized full-document context | MASTER.md:4542 |
| `AGX-03` | Screen guidance without hidden action | MASTER.md:4543 |
| `AGX-04` | Safe verbatim dictation and insertion | MASTER.md:4544 |
| `AGX-05` | Resumable personalized onboarding | MASTER.md:4545 |
| `AGX-06` | Stable named-agent definitions | MASTER.md:4546 |
| `AGX-07` | Correct routing and pinned providers | MASTER.md:4547 |
| `AGX-08` | Isolated memory, drafts and source authority | MASTER.md:4548 |
| `AGX-09` | Bounded concurrent runs and input leases | MASTER.md:4549 |
| `AGX-10` | Explicit routines and calm suggestions | MASTER.md:4550 |
| `AGX-11` | Probed connectors and typed schemas | MASTER.md:4551 |
| `AGX-12` | Central skills and truthful capabilities | MASTER.md:4552 |
| `AGX-13` | Scoped artifacts and safe previews | MASTER.md:4553 |
| `AGX-14` | Per-agent operational truth | MASTER.md:4554 |
| `AGX-15` | Minimal animated identity and fast Home | MASTER.md:4555 |
| `AGX-16` | Real cross-platform end-to-end qualification | MASTER.md:4556 |

### A.8 Agent-expansion use cases AGUC-001–AGUC-032 (gate · scenario) (32)

| ID | Title / one line | Source |
|---|---|---|
| `AGUC-001` | AGX-01 · A reference contains an old unused skill picker. | MASTER.md:4564 |
| `AGUC-002` | AGX-01 · A source contains an account token or a private endpoint. | MASTER.md:4565 |
| `AGUC-003` | AGX-02 · Ask about an off-screen clause in a selected document. | MASTER.md:4566 |
| `AGUC-004` | AGX-02 · Source permission is removed while extraction runs. | MASTER.md:4567 |
| `AGUC-005` | AGX-03 · Ask Métis to show which button changes export format. | MASTER.md:4568 |
| `AGUC-006` | AGX-03 · The target moves, scrolls or changes displays. | MASTER.md:4569 |
| `AGUC-007` | AGX-04 · Dictate Québec / R&D, do not send. | MASTER.md:4570 |
| `AGUC-008` | AGX-04 · Switch to a terminal or another app before insertion. | MASTER.md:4571 |
| `AGUC-009` | AGX-05 · Create the recommended starter team then replay setup. | MASTER.md:4572 |
| `AGUC-010` | AGX-05 · Video, speech or an optional connector is unavailable. | MASTER.md:4573 |
| `AGUC-011` | AGX-06 · Rename Research Scout and change its orb. | MASTER.md:4574 |
| `AGUC-012` | AGX-06 · Ask to create three agents and then cancel before confirmation. | MASTER.md:4575 |
| `AGUC-013` | AGX-07 · Send a follow-up to a busy named Dust agent. | MASTER.md:4576 |
| `AGUC-014` | AGX-07 · Say do it after switching to a different agent or suggestion. | MASTER.md:4577 |
| `AGUC-015` | AGX-08 · Switch agents with unsent text and attachments. | MASTER.md:4578 |
| `AGUC-016` | AGX-08 · Delete or correct an agent fact and regenerate knowledge. | MASTER.md:4579 |
| `AGUC-017` | AGX-09 · Two agents request keyboard or pointer control simultaneously. | MASTER.md:4580 |
| `AGUC-018` | AGX-09 · Cancel a run as its provider result arrives. | MASTER.md:4581 |
| `AGUC-019` | AGX-10 · A device-bound routine misses several runs while locked. | MASTER.md:4582 |
| `AGUC-020` | AGX-10 · A suggestion finishes during a meeting or screen share. | MASTER.md:4583 |
| `AGUC-021` | AGX-11 · Save a syntactically valid but rejected connector token. | MASTER.md:4584 |
| `AGUC-022` | AGX-11 · An API result is large or paginated. | MASTER.md:4585 |
| `AGUC-023` | AGX-12 · Publish a skill update while an agent is running. | MASTER.md:4586 |
| `AGUC-024` | AGX-12 · A role requests a capability whose provider is not present. | MASTER.md:4587 |
| `AGUC-025` | AGX-13 · An agent generates a report and the user returns tomorrow. | MASTER.md:4588 |
| `AGUC-026` | AGX-13 · A preview contains scripts, remote images or a traversal filename. | MASTER.md:4589 |
| `AGUC-027` | AGX-14 · Two agents use the same server-held Jev key. | MASTER.md:4590 |
| `AGUC-028` | AGX-14 · A preview or starter-agent creation is mistaken for a live task. | MASTER.md:4591 |
| `AGUC-029` | AGX-15 · A catalog contains twenty agents and a thousand-turn chat. | MASTER.md:4592 |
| `AGUC-030` | AGX-15 · Reduced motion, high contrast, 200% text or IME is active. | MASTER.md:4593 |
| `AGUC-031` | AGX-16 · A new user completes agent creation, context, approval and result. | MASTER.md:4594 |
| `AGUC-032` | AGX-16 · The native or provider prerequisite is not available. | MASTER.md:4595 |

### A.9 HeyClicky artifact observations HC-01–HC-32 (evidence, not product passes) (32)

| ID | Title / one line | Source |
|---|---|---|
| `HC-01` | Exact inspected build | clicky-study/SOURCE-STUDY.md:20 |
| `HC-02` | Native architecture, not recoverable original source | clicky-study/SOURCE-STUDY.md:32 |
| `HC-03` | Substantial bundled execution payload | clicky-study/SOURCE-STUDY.md:42 |
| `HC-04` | Computer-use helper already a separate boundary | clicky-study/SOURCE-STUDY.md:52 |
| `HC-05` | Fifteen curated runtime skill definitions | clicky-study/SOURCE-STUDY.md:64 |
| `HC-06` | Legacy picker is not the runtime catalog | clicky-study/SOURCE-STUDY.md:74 |
| `HC-07` | Persistent agent identity | clicky-study/SOURCE-STUDY.md:84 |
| `HC-08` | Curated agent memory | clicky-study/SOURCE-STUDY.md:94 |
| `HC-09` | Agent-owned artifacts | clicky-study/SOURCE-STUDY.md:104 |
| `HC-10` | Screen content is context, not routing consent | clicky-study/SOURCE-STUDY.md:114 |
| `HC-11` | Full document can differ from visible screenshot | clicky-study/SOURCE-STUDY.md:124 |
| `HC-12` | Document extraction may time out | clicky-study/SOURCE-STUDY.md:136 |
| `HC-13` | Minimize protected-folder prompt cascades | clicky-study/SOURCE-STUDY.md:146 |
| `HC-14` | Structured schemas and write readback | clicky-study/SOURCE-STUDY.md:156 |
| `HC-15` | Connector session and entitlement services | clicky-study/SOURCE-STUDY.md:166 |
| `HC-16` | Named-agent routing and busy-session lifecycle | clicky-study/SOURCE-STUDY.md:178 |
| `HC-17` | Learning-oriented onboarding steps | clicky-study/SOURCE-STUDY.md:190 |
| `HC-18` | Interview and personalized starter team | clicky-study/SOURCE-STUDY.md:204 |
| `HC-19` | Creation without automatic work | clicky-study/SOURCE-STUDY.md:218 |
| `HC-20` | Interview pause and explicit abandonment | clicky-study/SOURCE-STUDY.md:228 |
| `HC-21` | Quiet announcements during other work | clicky-study/SOURCE-STUDY.md:240 |
| `HC-22` | Repeatable routines have lifecycle types | clicky-study/SOURCE-STUDY.md:250 |
| `HC-23` | Safe dictation focus and fallback | clicky-study/SOURCE-STUDY.md:262 |
| `HC-24` | Avoid capturing the assistant itself | clicky-study/SOURCE-STUDY.md:274 |
| `HC-25` | Durable artifacts need a retrieval surface | clicky-study/SOURCE-STUDY.md:284 |
| `HC-26` | Memory and role do not broaden permissions | clicky-study/SOURCE-STUDY.md:294 |
| `HC-27` | The source is not a blanket app license | clicky-study/SOURCE-STUDY.md:304 |
| `HC-28` | Unsupported generation routes are explicitly excluded | clicky-study/SOURCE-STUDY.md:314 |
| `HC-29` | Automatic termination is disabled | clicky-study/SOURCE-STUDY.md:324 |
| `HC-30` | Account, telemetry and updater configuration exists | clicky-study/SOURCE-STUDY.md:336 |
| `HC-31` | Intro media is not proof of live automation | clicky-study/SOURCE-STUDY.md:352 |
| `HC-32` | Compiled controls are not a live test | clicky-study/SOURCE-STUDY.md:362 |

### A.10 Agent-expansion slices AGSTEP-01–AGSTEP-18 (18)

| ID | Title / one line | Source |
|---|---|---|
| `AGSTEP-01` | Reconcile the actual reference and source baseline | MASTER.md:4601 |
| `AGSTEP-02` | Freeze agent/context/authority contracts | MASTER.md:4609 |
| `AGSTEP-03` | Build scoped context resolution | MASTER.md:4617 |
| `AGSTEP-04` | Implement screen guidance and safe dictation | MASTER.md:4625 |
| `AGSTEP-05` | Enhance the existing Métis onboarding and Tony welcome | MASTER.md:4633 |
| `AGSTEP-06` | Extend the existing registry with named agents | MASTER.md:4643 |
| `AGSTEP-07` | Integrate named orbs and compact Agent Home | MASTER.md:4651 |
| `AGSTEP-08` | Implement canonical agent memory and artifact ownership | MASTER.md:4659 |
| `AGSTEP-09` | Bind voice/text to exact agents and real Jev/Laya | MASTER.md:4667 |
| `AGSTEP-10` | Connect bounded hosted agent execution | MASTER.md:4675 |
| `AGSTEP-11` | Connect trusted native action leases and verification | MASTER.md:4683 |
| `AGSTEP-12` | Verify scoped connectors and authority upgrades | MASTER.md:4691 |
| `AGSTEP-13` | Add durable output navigation and sandboxed previews | MASTER.md:4699 |
| `AGSTEP-14` | Add explicit routines, source-backed suggestions and quiet mode | MASTER.md:4707 |
| `AGSTEP-15` | Complete named-agent Operator accounting | MASTER.md:4715 |
| `AGSTEP-16` | Run actual fresh/upgrade cross-system journeys | MASTER.md:4723 |
| `AGSTEP-17` | Run abuse, concurrency, accessibility and performance qualification | MASTER.md:4731 |
| `AGSTEP-18` | Qualify exact final platform artifacts and report scope | MASTER.md:4739 |

### A.11 Onboarding amendment slices OBU-01–OBU-05 (5)

| ID | Title / one line | Source |
|---|---|---|
| `OBU-01` | Baseline and source binding | MASTER.md:4981 |
| `OBU-02` | Media retirement and Tony slot | MASTER.md:4983 |
| `OBU-03` | Setup coaching | MASTER.md:4985 |
| `OBU-04` | Accessibility and copy | MASTER.md:4987 |
| `OBU-05` | Native and installed validation | MASTER.md:4989 |

### A.12 Hindsight acceptance gates HM-01–HM-16 (16)

| ID | Title / one line | Source |
|---|---|---|
| `HM-01` | Embedded product, lean clients | MASTER.md:5200 |
| `HM-02` | Approved inputs and canonical authority | MASTER.md:5201 |
| `HM-03` | Pre-retrieval authorization and audience | MASTER.md:5202 |
| `HM-04` | No unintended retained content | MASTER.md:5203 |
| `HM-05` | Revision-safe retain and durable projection | MASTER.md:5204 |
| `HM-06` | Source-linked bounded recall | MASTER.md:5205 |
| `HM-07` | Grounded reflection without false authority | MASTER.md:5206 |
| `HM-08` | Deletion, correction and no resurrection | MASTER.md:5207 |
| `HM-09` | Named-agent memory isolation | MASTER.md:5208 |
| `HM-10` | Actual Dust and skill interoperability | MASTER.md:5209 |
| `HM-11` | One accurate operational ledger | MASTER.md:5210 |
| `HM-12` | Fast critical path and useful quality | MASTER.md:5211 |
| `HM-13` | Simple, controllable UX | MASTER.md:5212 |
| `HM-14` | Server deployment and resilient operations | MASTER.md:5213 |
| `HM-15` | Incremental migration and reversible rollout | MASTER.md:5214 |
| `HM-16` | Real cross-platform integrated proof | MASTER.md:5215 |

### A.13 Hindsight use cases HMUC-001–HMUC-032 (32)

| ID | Title / one line | Source |
|---|---|---|
| `HMUC-001` | Remember a reviewed language preference | MASTER.md:5221 |
| `HMUC-002` | Recall before an account meeting | MASTER.md:5222 |
| `HMUC-003` | Unverified budget in a summary | MASTER.md:5223 |
| `HMUC-004` | Same user on two devices | MASTER.md:5224 |
| `HMUC-005` | Agent renamed | MASTER.md:5225 |
| `HMUC-006` | Different agent with private context | MASTER.md:5226 |
| `HMUC-007` | Dust asks for permitted meeting context | MASTER.md:5227 |
| `HMUC-008` | Dust corrects a commitment | MASTER.md:5228 |
| `HMUC-009` | Published skill uses memory | MASTER.md:5229 |
| `HMUC-010` | Employee revoked during recall | MASTER.md:5230 |
| `HMUC-011` | Source deleted during retain | MASTER.md:5231 |
| `HMUC-012` | Mental model not flagged stale after deletion | MASTER.md:5232 |
| `HMUC-013` | Out-of-order source revision | MASTER.md:5233 |
| `HMUC-014` | Duplicate outbox event | MASTER.md:5234 |
| `HMUC-015` | Server confirms retain but search lags | MASTER.md:5235 |
| `HMUC-016` | Memory provider unavailable | MASTER.md:5236 |
| `HMUC-017` | User selects an ephemeral interaction | MASTER.md:5237 |
| `HMUC-018` | User selected local-only processing | MASTER.md:5238 |
| `HMUC-019` | Cloudflare gateway body logging drifts | MASTER.md:5239 |
| `HMUC-020` | Worker payload holds approved content | MASTER.md:5240 |
| `HMUC-021` | Prompt injection embedded in a memory | MASTER.md:5241 |
| `HMUC-022` | Untagged and fuzzy matches | MASTER.md:5242 |
| `HMUC-023` | Mixed audience Teams meeting | MASTER.md:5243 |
| `HMUC-024` | Hard date filter | MASTER.md:5244 |
| `HMUC-025` | Multilingual proper name and negation | MASTER.md:5245 |
| `HMUC-026` | Embedding model changed, same dimensions | MASTER.md:5246 |
| `HMUC-027` | Memory inference incurs background costs | MASTER.md:5247 |
| `HMUC-028` | Unknown token counts | MASTER.md:5248 |
| `HMUC-029` | Privacy-safe source text disabled | MASTER.md:5249 |
| `HMUC-030` | Restore a pre-deletion backup | MASTER.md:5250 |
| `HMUC-031` | Simple “open Notes” command | MASTER.md:5251 |
| `HMUC-032` | Final Windows and native Mac journey | MASTER.md:5252 |

### A.14 Hindsight delivery steps HMSTEP-01–HMSTEP-16 (16)

| ID | Title / one line | Source |
|---|---|---|
| `HMSTEP-01` | Qualify the source and runtime contract | MASTER.md:5177 |
| `HMSTEP-02` | Approve retention and authority before ingest | MASTER.md:5178 |
| `HMSTEP-03` | Deploy the private service and database | MASTER.md:5179 |
| `HMSTEP-04` | Bind real identity and bank generation | MASTER.md:5180 |
| `HMSTEP-05` | Implement canonical-to-memory projection | MASTER.md:5181 |
| `HMSTEP-06` | Implement bounded recall with lineage | MASTER.md:5182 |
| `HMSTEP-07` | Implement correction, tombstone and purge fences | MASTER.md:5183 |
| `HMSTEP-08` | Wire the memory UX into Métis | MASTER.md:5184 |
| `HMSTEP-09` | Connect Dust and server skills | MASTER.md:5185 |
| `HMSTEP-10` | Qualify observations, mental models and derivative cleanup | MASTER.md:5186 |
| `HMSTEP-11` | Account for every memory workload | MASTER.md:5187 |
| `HMSTEP-12` | Benchmark usefulness, multilingual fidelity and speed | MASTER.md:5188 |
| `HMSTEP-13` | Exercise failure and security boundaries | MASTER.md:5189 |
| `HMSTEP-14` | Migrate with scoped canaries | MASTER.md:5190 |
| `HMSTEP-15` | Prove the complete product journeys | MASTER.md:5191 |
| `HMSTEP-16` | Freeze, release and operate the qualified capability | MASTER.md:5192 |

