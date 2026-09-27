# Métis 2.0: decisions

| Field | Value |
|---|---|
| Owner | Program owner (Tony); Opus records and validates |
| Date | 2026-09-26 |
| Contents | A. Owner decisions already made · B. Program decisions (Opus) · C. Engineering ADR index · D. Open decision register D-1..D-29 |
| How to answer | One line per decision in the weekly 30-minute decision slot (first slot by 2026-10-02), or in the ticket. Answers are copied into the affected tickets and `_relay/HANDOFF.md` |
| Rule | A **reversible** decision takes its recorded default at its needed-by date if unanswered, and stays labelled ASSUMED in the affected tickets until confirmed. An **escalated** decision (spend, legal-privacy, security, owner configuration, irreversible) never auto-applies: engineering proceeds on the default labelled ASSUMED, and the release claim waits for the answer. Decision dependencies (`needs_decision`) never cap a ticket's evidence; artifact dependencies (`depends_on`) do |

Evidence labels follow software-architecture-engineer v1.4.0: OBSERVED, PROVIDED, DERIVED, ASSUMED, PROPOSED, UNKNOWN.

## A. Owner decisions already made

| # | Date | Decision | Why (as recorded) | Alternatives considered | Where it lands |
|---|---|---|---|---|---|
| OD-1 | 2026-09-23 | Publish 1.9.6 as a public **unsigned prerelease** (not Latest, no latest*.yml), as an exception for v1.9.6-unsigned only | Owner: "release them with no signature for now" (PROVIDED, prior OWNER-DECISIONS.md) | Hold the release until signing exists | D-13 proposes the same conditions for 1.9.7 and the trains; M2-0053 amends SIGNING.md/ENTERPRISE_RELEASE.md |
| OD-2 | 2026-09-24 | "Figure out the Windows part": investigate Windows public signing and the Windows build | PROVIDED (stop-hook message) | — | M2-0058 |
| OD-3 | 2026-09-24 | Windows public signing route = **Microsoft Artifact Signing (Public Trust)**, publisher = the Mantu group legal entity | PROVIDED (AskUserQuestion "Win signing") | Routes A–F in the prior WINDOWS-SIGNING decision brief (OV/EV certificates and others) | D-10 (decided); budget and identity validation remain (B-11); M2-0058, M2-0211 |
| OD-4 | 2026-09-24 | Shipping line = **main 1.9.6 + RightEdgeSidecar**; the PR #194 dock lane is ported deliberately, not merged wholesale | PROVIDED (AskUserQuestion "Ship line") | Ship the PR #194 1.9.8 DockPanel line | D-7 (decided); M2-0022, M2-0202, M2-0095; version 1.9.8 is never reused |
| OD-5 | 2026-09-26 | Approve the program goal: deliver everything in the r11 kit and the v6 BRAG-Hindsight kit (with v5 baselines), fix the P0 bugs, refactor to simple enterprise-grade code, ship production-ready, finish with a launch video | PROVIDED (GOAL.json) | — | PLAN.md §1 |
| OD-6 | 2026-09-26 | Outcome = **engineering-complete and tested**; anything needing an outside account or owner is wired for real and shown BLOCKED with the exact unblock step | PROVIDED (GOAL.json) | Declare external items out of scope | PLAN.md §1; M2-0002 'wired for real' |
| OD-7 | 2026-09-26 | Deadline **2026-11-30** | PROVIDED | — | PLAN.md §6 |
| OD-8 | 2026-09-26 | Only **Apple public signing / notarization** is out of scope | PROVIDED | — | M2-0186 (CANCELLED with reason); M2-0175 keeps the in-scope Mac QA |
| OD-9 | 2026-09-26 | Operating model: Opus plans and validates every deliverable; Sonnet implements tickets in isolated worktrees; Opus implements and validates all design and animation work | PROVIDED | — | PLAN.md §3; owner_model in the ledger |
| OD-10 | 2026-09-26 | A **launch video** (BRAG storyboard) at the end | PROVIDED | — | M2-0178..0182, 0212, 0213 |
| OD-11 | 2026-09-26 | Audits: ChatGPT now; Codex CLI when its quota resets (2026-09-29 19:33) | PROVIDED | — | M2-0023 |
| OD-12 | 2026-09-27 | Métis is an installed **desktop application** (Electron) on macOS and Windows. The web platform (Operator) is its mission control and admin console, never a replacement for the app. Standalone HTML design prototypes are internal review artifacts only: they are never shipped or presented as the product, UI evidence is captured from the real app renderer (in CI, per D-28), and no agent drives a visible browser on the owner's machine for program work | PROVIDED (owner message 2026-09-27, after an agent's Playwright capture of the Settings HTML mock appeared on his screen) | A web-first client; separate HTML prototype sites as design evidence | M2-0101, M2-0201, M2-0007, every UI ticket |
| OD-13 | 2026-09-27 | Operating model revised: **Codex implements**, Claude plans (design briefs) and challenges (Opus validation, Level 10 review of every Codex diff). Claude drivers write briefs, run Codex in a workspace-write sandbox per ticket worktree, reject weak diffs back to Codex, then commit/push/CI. Claude implements only when Codex is unavailable (recorded as a fallback) and for Opus-owned design/animation work (OD-9) | PROVIDED (owner message 2026-09-27: "Have Codex execute more than Claude") | Sonnet subagents as implementers (OD-9 original) | ticket runner, rocket-fuel |

## B. Program decisions (Opus, 2026-09-26)

Each was taken while finalizing the ledger against two independent premortem critiques; the ticket columns point at where it is enforced.

| # | Decision | Why | Alternatives rejected | Tickets |
|---|---|---|---|---|
| PD-01 | Architecture-led plan (strangler, C1–C16) with a risk-first W0 and kit-complete traceability | Built on verified mechanisms; scored 26/30 vs 21 (risk-first) and 16 (kit-complete) | Risk-first only (per-repro patches); one ticket per TASK in registry order (P0s wait on owner approvals) | all |
| PD-02 | Refuted theories are never built on: window.confirm freeze, `isResponsive()`, SIGTERM handlers, `detached` flags | Refuted by two Opus verifiers and ChatGPT; `isResponsive()` does not exist in Electron 43 | — | M2-0026, 0036, 0040 |
| PD-03 | No automatic renderer reload in 1.9.7; journal first (m5), journal-gated recovery at m6 | The live transcript exists only in renderer state until the journal lands | Auto-reload now (loses unacknowledged transcript) | M2-0036, 0066, 0098 |
| PD-04 | Test isolation is enforced at the OS level as well as in vitest: first runs in CI with a honeypot, then the QA macOS user, then the owner's account only under a sandbox profile | Test processes quarantined the owner's brain index twice on 09-26; the in-process tripwire misses children, swift test, license-server and wrangler | Rely on the vitest tripwire alone; run on the owner's account under ASKTOTO_USERDATA | M2-0001, 0190, 0007 |
| PD-05 | Unreleased shipping-identity candidates never run on the owner's primary account; if unavoidable, only the QA-identity variant (own appId, userData, Keychain service; legacy reaper off) with per-run consent | Same bundle id shares the Keychain safeStorage item and TCC grants with the live install; a keystore mismatch triggers the quarantine path; the legacy reaper could kill live sidecars | Owner account under ASKTOTO_USERDATA (proposed by one critic; rejected for these reasons) | M2-0007, 0187 |
| PD-06 | Two dependency kinds: `depends_on` (artifact; caps closure while BLOCKED_EXTERNAL) and `needs_decision` (D-x; proceeds on the recorded default labelled ASSUMED) | The old rule capped 97 descendants of the PRD lock at DESIGNED; the prior attempt died waiting on approvals | Keep one dependency kind | M2-0002, all tickets |
| PD-07 | `required_evidence` is a set of distinct Stark levels, one record per level; LOCALLY_TESTED needs a CI run ID on the PR head, LIVE_VERIFIED needs harness output plus the lane sha256; fixes need red-before/green-after; records carry per-kit-ref status; 10% re-execution by another model at each gate | Stark levels are distinct, not ordered; 'at or above' was undefined; prose closure is the biggest program risk | Single `evidence_target` | M2-0002, 0011 |
| PD-08 | Build once, test those bytes, promote the same bytes through a new lane; versions only go up and 1.9.8 is never reused (1.9.7 → 1.9.9 → 2.0.0-beta.1 → beta.2 → rc.N → 2.0.0) | `release.yml` cannot publish 1.9.7 (Developer ID required, unsigned Windows refused, jobs coupled, rebuild from tag) | Push tag v1.9.7 | M2-0187, 0046, 0206, 0207, 0209, 0210 |
| PD-09 | 1.9.7 is the P0 closure only; M2-0029, 0034, 0038–0045 move to T1; M2-0028 ships default-on only if HK-M passes 20/20 | 356 h were due in eight days, including refuted-cause and non-P0 work | Ship everything tagged m3 | M2-0046 |
| PD-10 | The owner's bugs close only on owner-machine MEASURED evidence (10 working days: zero stalls over 5 s, zero orphans after unclean exits, zero reveal no-ops); until then 'fixed for the DERIVED cause' | The freeze cause is DERIVED from two natural occurrences, one without a stack | Close on the 1.9.7 release | M2-0199 |
| PD-11 | Owner-channel trains T1 (m5, 10-18), T2 (m6, 11-01), T3 (m7, 11-08); feature freeze and rc1 on 11-15 with a 72 h soak; only defect fixes after the freeze | No release existed between 1.9.7 and the 2.0 candidate; the ledger contract step needed a release on the new ledger | Big-bang 2.0 candidate on 11-22 | M2-0206, 0207, 0209, 0210 |
| PD-12 | W3 changes that move or edit code 1.9.7 fixed start after a five-day owner soak; the m5 exit is the minimum seam set; M2-0069/0070/0071/0074 are peel-when-touched after 10-18 | Moving freshly fixed code makes 1.9.7.x hotfixes hard; 120 of 201 W4–W7 scope paths depend on W3 directories | Calendar-driven W3 start | M2-0198, 0059 |
| PD-13 | One integration owner (Opus orchestrator) with a merge queue for hot files, declared landing orders, at most three concurrent agents in src/main, packaged runs serialized, release/1.9.x with a backport rule, only the orchestrator edits ledger status | 18 tickets touch the 9,518-line index.ts; ten land in the same week | Free-for-all merges | M2-0188 |
| PD-14 | Every ticket over 12 h is sliced into single-PR slices of at most 10 h before it enters the ready queue; 25 tickets were sliced now, the rest are enforced by the checker | 72 tickets exceeded 12 h (58% of effort) | Split when started | M2-0002, ledger `slices` |
| PD-15 | Sonnet implements non-visual engineering from an Opus spec; Opus implements design, animation and the visual slices of Sonnet tickets; every Opus-implemented ticket is validated by a separate Opus session; each ticket carries a validation budget | Matches the owner's operating model (OD-9); Opus had about 185 h of non-visual implementation and would have approved its own work | Opus implements architecture-defining code | owner_model, `validation_hours` |
| PD-16 | Opus design prototypes (DESIGNED) for nine 2.0 surfaces are produced in W3; implementation stays in its waves | Flattens the m6 Opus peak; implementation starts from approved states | Design during implementation | M2-0201 |
| PD-17 | Storage admission is one global cap ≤ effective pool − 2; dataless detection ships in 1.9.7; stall tests use OS-level fixtures; the C10 worker triggers automatically if ST-1's write or DNS criterion fails | 6 permits vs 4 pool threads; a JS shim cannot pin a thread; 1.9.7 could not know a file is dataless | Per-class permits; JS delay shim | M2-0030, 0191, 0008, ADR-021 |
| PD-18 | An out-of-process stall sampler (mac-helper mode) captures a stalled main | A blocked main cannot report itself | In-process detection only; telemetry vendor | M2-0192, ADR-023 |
| PD-19 | A resource regression gate runs on every train from m5 (fail on >10% or any section 7 breach); wake detection stays off until measured | 2.0 features could bring the heaviness back | Tune only at m10 | M2-0200, 0081, 0166 |
| PD-20 | Windows: 1.9.6 baseline on a managed Windows 11 laptop by 10-04, a windows-latest capability spike, a Windows parity run at every gate from m3; signing is a separate step after the candidate freeze | No Windows runtime evidence exists and the enterprise target is Windows; signing procurement can take 1–20 business days | Windows only at m10; signing inside the freeze | M2-0195, 0196, 0211 |
| PD-21 | Film: claim register at m6, toolchain spike in W2, pre-production before the freeze, captures from rc1 re-diffed against the frozen candidate, claim-approval request by 11-20 | About five days remained after the freeze | Serial production after 11-22 | M2-0178, 0212, 0213, 0179, 0180 |
| PD-22 | M2-0016 split: a one-page policy approval by 10-02 (M2-0189) gates engineering through D-4/D-11/D-12; the full PRD lock gates nothing | The prior prd-lock stayed at 0.1.0-draft | Approve the full PRD first | M2-0189, 0016 |
| PD-23 | Shared contracts land with their first consumer; M2-0064 covers only what m6 consumes | Two tickets wrote the knowledge contracts unordered | One big contracts ticket | M2-0064, 0097, 0105, 0120, 0122, 0133 |
| PD-24 | M2-0024 (program docs PR) stays in m2 although one critic asked to move W0 docs after 10-04 | It is the GOAL m2 exit artifact and costs 2 h of docs, not packaged validation | Move after 10-04 (would fail m2) | M2-0024 |
| PD-25 | Owner relief (M2-0010) and the conditional supervisor (M2-0028) are not 1.9.7 release preconditions; D-28 is a decision, not a blocker, for CI and QA runs | Avoid making owner actions gate 120+ tickets | Hard dependencies | M2-0046, 0190 |
| PD-26 | The ledger contract step waits for T1 plus 14 owner days, else moves to 2.0.1 | Rollback must stay possible until the new ledger has run on the owner's data | Expand, switch and contract in one release | M2-0167 |
| PD-27 | The program sign-off may be DONE with inherited external blocks, each listed with its unblock step | The goal defines done as engineering-complete with BLOCKED items visible | Sign-off only when every external owner has acted | M2-0184, 0002 |
| PD-28 | Three critic requests became separate tickets instead of widening the named one: the stall sampler (M2-0192, asked on M2-0006), the isolation extension (M2-0190, asked on M2-0001) and the resource regression gate (M2-0200, asked on M2-0166) | Keeps each ticket a single PR of at most 12 h, keeps M2-0001 lean because 150+ tickets descend from it, lands the helper binary changes in a declared order, and lets the gate exist from m5 while tuning stays at m10 | Widen the original tickets | M2-0190, 0192, 0200 |
| PD-29 | TASK-028.A (M2-0202) also waits for M2-0036 and the five-day soak, although one critic asked for M2-0022 and M2-0007 only | It edits island/geometry.ts, which 1.9.7 changes; both gates close by 10-09, so it still ships in T1 without waiting for the App.tsx split or m6 | Start it on day 1 in parallel with the 1.9.7 geometry change | M2-0202 |

## C. Engineering ADR index

Full bodies are in [ARCHITECTURE.md §5](ARCHITECTURE.md). Status for all is PROPOSED until the owning ticket's evidence is accepted.

| ADR | Title | Owning ticket(s) | Owner input |
|---|---|---|---|
| ADR-001 | Kill-safe runtime | M2-0026..0028, 0066 | — |
| ADR-002 | Modular monolith | M2-0059, 0060, 0065 | — |
| ADR-003 | Sidecar ownership (supervise, registry, reaper) | M2-0026..0029 | — |
| ADR-004 | Reveal-or-recover controller | M2-0036, 0098 | D-1, D-2 |
| ADR-005 | Durable local journal | M2-0066 | D-3 |
| ADR-006 | Storage gateway | M2-0030, 0031, 0193 | — |
| ADR-007 | Meetings index and device ledger | M2-0067, 0205, 0167 | — |
| ADR-008 | Scheduler and exhaustion semantics | M2-0033, 0073 | — |
| ADR-009 | Contracts with golden fixtures shared with Swift | M2-0061..0064 | — |
| ADR-010 | Typed IPC registration | M2-0060, 0068 | — |
| ADR-011 | Fitness-function tooling | M2-0047 | — |
| ADR-012 | Observability via the audit log | M2-0006 | — |
| ADR-013 | Hermetic tests and the foreign-key guard | M2-0001, 0003, 0190 | D-28 |
| ADR-014 | Server-side intelligence plane | M2-0119 | D-5 |
| ADR-015 | Command authority owned by main | M2-0079 | — |
| ADR-016 | Settings and licensing authority | M2-0062, 0146 | D-4 |
| ADR-017 | Release evidence chain | M2-0002, 0171 | — |
| ADR-018 | Overlay idle posture | M2-0039 | — |
| ADR-019 | Canonical knowledge store | M2-0120 | D-6 |
| ADR-020 | Skill contracts and runtime boundaries | M2-0139 | — |
| ADR-021 | libuv pool sizing and global storage admission | M2-0030 | — |
| ADR-022 | Build-once candidate lane and QA signing identity | M2-0187 | D-13 |
| ADR-023 | Out-of-process stall sampler | M2-0192 | — |

## D. Open decision register

Days waiting are counted from 2026-09-26. As of 2026-09-26: 0 days for every open row.

| ID | Question | Recommended default | Class | Needed by | Status | Affected tickets |
|---|---|---|---|---|---|---|
| D-1 | Should an explicit reopen (Finder, Spotlight, Dock, a second launch, tray, hotkey) reveal the overlay when it is parked in Hide or Island? | Yes: an explicit reopen reveals and focuses; activate during boot stays parked, so first launch never opens Settings | reversible (flag reveal=legacy) | 2026-09-30 | OPEN | 0036 |
| D-2 | After an automatic renderer recovery during capture, does capture resume on its own? | No: show an explicit capture discontinuity and let the user resume with one click | reversible | 2026-10-19 | OPEN | 0098 |
| D-3 | How does the local crash-recovery journal behave under managed or enterprise retention profiles? | The journal follows the active retention profile; where local content retention is disallowed it is off and recovery asks instead of restoring (Engineering proceeds on the default labelled ASSUMED; the release claim waits for the answer) | escalate: legal-privacy | 2026-10-09 | OPEN | 0066, 0097, 0098 |
| D-4 | Which system is the 2.0 entitlement authority, and what is the licensing precedence (C-03, C-08, C-16)? | PROPOSED: the Operator seat is authoritative for 2.0; the legacy license server stays read-only for existing keys until an ADR-016 deprecation decision (Answered on the one-page policy approval (M2-0189)) | escalate: spend (commercial) | 2026-10-02 | ANSWERED_AS_DEFAULT 2026-09-27 (owner: "Operator seat") | 0106, 0146, 0189 |
| D-5 | Where does the server intelligence plane run: container platform, region, managed Postgres with vector, the pinned Hindsight release, and Laya hosting? | No silent default. PROPOSED: self-hosted private Hindsight (not hosted Vectorize Cloud) on one approved container platform with managed Postgres; engineering proceeds against the local compose profile | escalate: spend | 2026-10-12 | OPEN | 0119, 0124, 0125, 0133, 0138 |
| D-6 | What is the canonical knowledge store (TASK-007) and the plaintext-mirror sharing boundary? | No silent default. Recommended: an Entra-protected knowledge API over an approved M365 location (MASTER section 17.3 state (a)); engineering proceeds behind the API contract | escalate: irreversible (data placement) | 2026-10-12 | ANSWERED_AS_DEFAULT 2026-09-27 (owner: "M365 via Entra API") | 0120, 0125 |
| D-7 | Which right-edge line ships: main 1.9.6 RightEdgeSidecar or the PR #194 1.9.8 DockPanel? | Decided: main 1.9.6 RightEdgeSidecar; the PR #194 dock lane is ported deliberately, not merged wholesale (Source: prior execution OWNER-DECISIONS.md; version 1.9.8 is never reused) | decided | 2026-09-24 | DECIDED 2026-09-24 | 0022, 0025, 0095, 0168, 0202 |
| D-8 | The production Operator runs an off-main build (three commits including an ACCESS bypass at /v1/decide): merge through a reviewed PR with a security review, or revert? | No silent default. Recommended: security review of the bypass first; no Operator deploy from main until decided | escalate: security | 2026-10-19 | OPEN | 0014, 0103, 0123, 0145, 0159 |
| D-9 | Which isolated macOS environment is the QA host? | A separate macOS user on the owner's Mac (about five minutes to create), signed into a dedicated test cloud account; plus a managed Windows 11 laptop from Mantu IT (The action itself is blocker B-02) | reversible | 2026-09-29 | ANSWERED_CHANGED 2026-09-27 (owner: "CI runners" — packaged-app QA on GitHub macos-latest and windows-latest, consistent with D-28; no QA user on the owner's Mac) | 0007 |
| D-10 | Which Windows public signing route and publisher entity? | Decided: Microsoft Artifact Signing (Public Trust) under the Mantu group legal entity recorded on 2026-09-24 (Budget approval and identity validation remain (B-11)) | decided | 2026-09-24 | DECIDED 2026-09-24 | 0058, 0211 |
| D-11 | What is the fresh-install default speech route? | Cloudflare-hosted speech through the Operator session broker (no organization token on the device); local speech is optional and never a silent fallback (Kit requirement; answered on M2-0189) | escalate: legal-privacy | 2026-10-02 | ANSWERED_AS_DEFAULT 2026-09-27 (owner: "Cloudflare via Operator") | 0064, 0102, 0107, 0112, 0160, 0189 |
| D-12 | What exactly does the no-content-retention claim say, and what is the AI Gateway log policy (C-18)? | Metadata-only gateway logs with no payload logging or caching; the claim says only what M2-0149 verifies (Answered on M2-0189) | escalate: legal-privacy | 2026-10-02 | ANSWERED_AS_DEFAULT 2026-09-27 (owner: "Metadata-only") | 0102, 0104, 0149, 0178, 0189 |
| D-13 | How are 1.9.7 and the owner-channel trains published? | The same conditions as the 2026-09-23 1.9.6 exception: prerelease, not Latest, no latest*.yml, SHA256SUMS attached, promoted from the tested bytes; SIGNING.md and ENTERPRISE_RELEASE.md amended to name the lane | escalate: security (unsigned public binaries) | 2026-10-03 | ANSWERED_AS_DEFAULT 2026-09-27 (owner: "1.9.6 rules") | 0046, 0053, 0187, 0206, 0207, 0209, 0210 |
| D-14 | In what order does scope degrade if velocity falls short? | M2-0155 live Teams media, then M2-0124 Laya container, M2-0185 competitive qualification, M2-0161 native onboarding parity, M2-0156 Zoom/Meet adapters; degrading only lowers evidence or ships DEFERRED flag-off and every kit ID stays traced (Approved through M2-0197) | reversible | 2026-10-09 | OPEN | 0197, 0210 |
| D-15 | Which refactoring skill did MASTER section 2.5 promise? | software-architecture-engineer v1.4.0 plus Stark v9.3.0 substitute for it | reversible | 2026-10-05 | OPEN | 0059 |
| D-16 | Operator portal scope: the existing tabs or the kit's 11 surfaces? | The kit's surfaces, added inside the existing portal chrome | reversible | 2026-10-26 | OPEN | 0158 |
| D-17 | Is the Forgejo mirror live and authoritative? | GitHub is authoritative; the mirror is treated as unverified and agents never push to it | reversible | 2026-11-02 | OPEN | 0168 |
| D-18 | ClickUp workspace tenancy? | Derive the workspace from the connected account; nothing hardcoded | reversible | 2026-10-26 | OPEN | 0144 |
| D-19 | Adopt HeyClicky components (the cua-driver computer-use daemon, curated skills)? | Evaluate and record adopt/adapt/reject in M2-0082; nothing is adopted without a licence review; one trusted executor remains | reversible | 2026-10-19 | OPEN | 0082 |
| D-20 | Will a recorded welcome video ship? | The text-led welcome ships as final unless a reviewed recording with captions arrives by 2026-11-08 | reversible | 2026-11-08 | OPEN | 0160 |
| D-21 | Do the two OneDrive-hosted worktrees (Metis Portal, asktoto-cahe-build) hold work to preserve? | Treated as holding nothing to preserve; agents never delete them; the owner may repair OneDrive sync | reversible | 2026-10-18 | OPEN | 0015 |
| D-22 | Does 2.0 commit to live Teams raw-media capture? | Post-meeting transcript and desktop capture ship; live bot media stays flag-off and BLOCKED until the Azure subscription and calling-media approval exist | escalate: spend | 2026-10-19 | OPEN | 0155 |
| D-23 | Is Laya in 2.0? | Readiness state 'unavailable' and the Laya-only isolation test now; the container only after the source and checkpoint licence are confirmed | reversible | 2026-10-19 | OPEN | 0124 |
| D-24 | Which Hindsight memory profile ships? | Facts-only initial profile; mental models and observations (HMSTEP-10) stay off until qualified | reversible | 2026-11-01 | OPEN | 0135 |
| D-25 | Native Mac onboarding: converge with Electron or intentionally diverge? | Set by M2-0161's design proposal; the owner confirms | reversible | 2026-11-08 | OPEN | 0161 |
| D-26 | Which competitor products are compared, with which legitimate accounts? | No default; products without a legitimate account are recorded BLOCKED | escalate: spend | 2026-11-08 | OPEN | 0185 |
| D-27 | Which launch-film claims are approved (release_claims_approved)? | No default; unapproved claims are cut or labelled concept (The request is sent by 2026-11-20) | escalate: legal-privacy | 2026-11-24 | OPEN | 0178, 0182, 0213 |
| D-28 | May agents run test commands on the owner's account, and under which sandbox policy? | **ANSWERED 2026-09-26 by the owner: CI only.** No repository test, script or app runs on any Mac, including the owner's account; tests run only in GitHub Actions. Static compilation (`tsc --noEmit`) is allowed because it executes no repository code | owner decision | 2026-09-28 | ANSWERED | 0190 |
| D-29 | What ships on Windows if the signing identity is not provisioned in time? | Windows 2.0 ships as an explicitly BLOCKED unsigned candidate (no public Windows release); the Mac candidate and the film are unaffected | reversible | 2026-10-09 | OPEN | 0058, 0174, 0211 |
| D-30 | Remove the Cahê edition? | **ANSWERED 2026-09-26 by the owner: remove the edition entirely** (code, embedded-key build path, config, workflow, docs). Published Cahê assets deleted the same day | owner decision | 2026-09-26 | ANSWERED | 0214 |

**Order of the first answers:** D-28 (09-28) → D-9 (09-29) → D-1 (09-30) → D-4, D-11, D-12 on the one-page policy (10-02) → D-13 (10-03) → D-15 (10-05) → D-3, D-14, D-29 (10-09) → D-5, D-6 (10-12).
