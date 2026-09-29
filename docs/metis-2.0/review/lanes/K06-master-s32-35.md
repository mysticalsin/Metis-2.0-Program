# Lane K06-master-s32-35 — Requirements extraction: MASTER §32–§35 (AGX/AGUC/AGSTEP, Codex+Fable collaboration, retained onboarding/OBU, Hindsight memory HM/HMUC/HMSTEP)

**Lane:** K06-master-s32-35
**Scope:** `/Users/<redacted-user>/AI-Brain-build/metis-v2-inputs/r11/Metis-2.0-Upgrade-Kit-r11/spec/MASTER.md` lines 4401–5363 (§32–§35), plus `memory/`, `onboarding/`, `collaboration/` support material in the same kit.
**Mode:** READ-ONLY. No file in `/Users/<redacted-user>/AI-Brain-build/metis-2.0` or any kit directory was modified. All repo statements below are grep/read observations only.
**Method:** software-architecture-engineer requirements method (`/Users/<redacted-user>/AI-Brain-build/metis-v2-inputs/sae/software-architecture-engineer/references/02-requirements-and-quality.md`: journeys, quality-scenario form, ID + criticality + traceability, explicit non-goals) and stark PRD discipline (`/Users/<redacted-user>/AI-Brain-build/metis-v2-inputs/stark/stark/references/product-and-planning.md`: every requirement cites a source, unknowns are first-class, don't populate generic requirements to look complete).
**Evidence labels used below:** OBSERVED (seen directly in MASTER.md, kit files, or the repo), DERIVED (reasoned from OBSERVED facts), ASSUMED, UNKNOWN.

---

## 0. What this section of MASTER actually is

§32–§35 of MASTER.md is **not** four independent feature specs. It is one continuous "r11 kit" delta on top of a large pre-existing MASTER (55 M2 requirements, UC-001–112, 66 root TASK-001–066, 44 COV, 12 FLOW, 12 EXP, 24 SRC — MASTER.md:4537, OBSERVED) plus one static-analysis-derived expansion (HeyClicky study → AGX/AGUC/AGSTEP, §32), one process contract for how two coding agents (Codex + Fable/Claude) must build and review the rest of the kit (§33), one onboarding amendment that supersedes an earlier r9 proposal (§34, "OBU"), and one new subsystem addition (Hindsight embedded memory → HM/HMUC/HMSTEP, §35). None of the four sections removes or replaces the 55/UC/TASK/COV/FLOW/EXP/SRC baseline; MASTER.md:4537 and MASTER.md:5173 both say explicitly "No prior ID is removed or replaced" / "All baseline TASK-001–066 IDs remain." The root TASK-001..066 definitions themselves live earlier in MASTER.md (outside this lane's assigned line range) and are referenced only by number here — this lane does not extract TASK-001..066 content itself, only how §32–§35 reuse those IDs.

Repo cross-check (OBSERVED, `/Users/<redacted-user>/AI-Brain-build/metis-2.0`): none of the §32 agent-expansion primitives exist in the current codebase. `grep -rl "AgentDefinition\|ContextBroker\|ContextSnapshot\|Research Scout\|Briefing Guide\|Follow-up Desk"` across `src/` returns zero matches; there is no `dictation` file and no `ScreenAnnotation`/screen-guidance file. Likewise `grep -rl "hindsight"` under `src/` returns zero matches — no Hindsight client, gateway, or route exists in the product yet; the only Hindsight code anywhere is the kit's own reference implementation under `memory/src/*.mjs` in the kit (not the repo). This means §32 and §35 are **greenfield additions**, not refactors of existing code, which materially changes effort estimation versus §34 (onboarding), where the target files already exist and already match the spec's claimed baseline (see §3 below).

---

## 1. §32 — Source-derived agent, context and onboarding expansion (AGX / AGUC / AGSTEP)

### 1.1 Framing and authority rules (MASTER.md:4401–4463, §32.1–32.5)

| ID | Requirement | Source | Priority |
|---|---|---|---|
| R32-A | The HeyClicky DMG (v1.0.51 build 61, SHA-256 `0c7b2f7b21c...` truncated in doc) is untrusted reference material only: static-inspection evidence (32 HC observations, 48 Markdown resources catalogued), not a runnable second app, not a license to copy proprietary media, account data, or credentials, and its packaged prompts/comments are never instructions for the coding agent. | MASTER.md:4405–4413 | MUST |
| R32-B | Bulk-copying personal files or reusing any HeyClicky account identifier/service URL is explicitly forbidden; public upstream components need separate version/license/maintenance/security review before adoption. | MASTER.md:4409–4411 | MUST |
| R32-C | A named agent = "a configured job with a stable identity, scoped memory, published skills and a conversation" — explicitly **not** another always-listening app. A skill is a versioned instruction/tool recipe, not an identity. A model is a provider route, not an authorization principal. A run is one bounded operation; a conversation may hold many runs. | MASTER.md:4417 | MUST (definitional — gates all of §32) |
| R32-D | Extend the *existing* Operator registry / mode-persona system / Dust agent discovery; first inventory existing IDs/pins. A failed named Dust agent must never be silently impersonated by a generic model; provider label must never change silently while the same backend is used — that is an explicit failing test. Spotlight Ref no-cross-provider-fallback boundary must be preserved. | MASTER.md:4419 | MUST |
| R32-E | `AgentDefinition` schema: stable opaque ID, tenant/owner principal, visibility scope, reviewed display name + voice aliases, purpose, lifecycle, definition revision, icon/orb descriptor, allowed capability profile, skill-version bindings, connector references, memory namespace, runtime policy, budget profile. Renaming must not change identity. Canonical name handling must be Unicode-confusable-safe; reject duplicate reserved aliases; a role description alone cannot grant tools or financial limits. | MASTER.md:4421 | MUST |
| R32-F | `Run` schema: pins agent ID/version, conversation ID, initiating principal, surface, exact intent, selected context refs/revisions, policy/consent epoch, provider route, operation/attempt IDs, requested output, lifecycle. Switching the selected agent must never retarget a late callback. Migration must map existing records/provider threads, not orphan them. | MASTER.md:4423 | MUST |
| R32-G | Three starter agents are *suggested*, not proven or default-shipped: **Briefing Guide**, **Research Scout**, **Follow-up Desk** (optional: Writing Studio, Workflow Guide, an approved dev assistant). Explicitly: "not recovered HeyClicky defaults and not proof those services exist." Avoid a mandatory catalog of near-duplicate personas. | MASTER.md:4425 | SHOULD |
| R32-H | ARMED desktop default stays the single neutral animated solving orb — no name/idle pill/caption/badge/sound added to that state. Expanded surface: named agent gets a name bubble above the left edge of the bar, live caption above bar, orb inside it; source chips in a separate row (never inside editable text or over Stop). Only the reviewed Libraries.dev solving-animation family (state/tint/initial variant) is allowed — no arbitrary remote shader/script/user-uploaded avatar. | MASTER.md:4429–4431 | MUST |
| R32-I | Agent Home: each row = name, one-line job, stable visual signature, status. Busy-agent rail is opt-in, max 3 named bubbles + drawer, must not turn idle Métis into a "parade of floating windows"; pending approvals outrank decorative activity; background response never steals input focus/scroll/foreground app. | MASTER.md:4433 | MUST |
| R32-J | One window/geometry authority; per-display position; hit areas bound to visible content while collapsed; per-agent draft/attachment/result/scroll state preserved independently; full a11y (keyboard nav, accessible names, 200% text, light/dark/high-contrast, reduced motion); names are plain text even with emoji/bidi (never HTML); Escape respects IME composition before shortcuts; Stop stays a separate trusted control. | MASTER.md:4435 | MUST |
| R32-K | Only visible active motifs animate; pause when obscured/hidden/locked/reduced-motion/energy-policy; background tiles throttled/static; **no cost-savings claim until the whole process tree is measured on real Windows + native Mac** — the synthetic preview's frame count is explicitly disqualified as a power benchmark. | MASTER.md:4437 | MUST |

### 1.2 Context lens (`ContextBroker` / `ContextSnapshot`) — MASTER.md:4439–4451, §32.4

| ID | Requirement | Source | Priority |
|---|---|---|---|
| R32-L | Build a bounded `ContextBroker` over existing capture/preprocessing/file-import/brain-retrieval/connectors. Resolve the user's explicit target first; prefer structured source access > scoped native accessibility semantics for the foreground window > screenshot/OCR only when structured access can't supply the evidence. A screenshot is explicitly **not** permission to operate that app's UI or read its whole account. | MASTER.md:4441 | MUST |
| R32-M | `ContextSnapshot` fields: source kind, stable target/record ID, exact principal+tenant, selected app/window/document, display coordinate system, source revision/content hash, capture/read time, extraction method, selected range, coverage enum (`FULL`/`PARTIAL`/`VISIBLE_ONLY`/`UNAVAILABLE`), excluded material, sensitivity, allowed audiences, revocable lease. Derived content keeps source refs and cannot broaden access; content never enters the operational ledger. | MASTER.md:4443 | MUST |
| R32-N | Reading beyond the visible page requires a verified file handle / attachment / app API / connector — never silently substitute a stale saved file for the "current" unsaved buffer. For paginated remote sources, exhaust the authorized scope or disclose the exact gap ("list counts are not full-text proof"). | MASTER.md:4445 | MUST |
| R32-O | UI: compact source chips ("Selected region", "QBR brief · full text", "CRM · access needed") + details drawer (method/age/coverage/exclusions); chip removable, removal revokes use in uncommitted work and invalidates dependent approvals (committed external effects need reconciliation, not retroactive "never sent" claims). | MASTER.md:4447 | MUST |
| R32-P | Bounded extraction limits, streaming parsers, input sanitization; macro/embedded-script/remote-image execution disabled in previews; never run code from a doc/workbook to extract text; "I see everything" is explicitly **forbidden UI copy**. | MASTER.md:4449 | MUST |
| R32-Q | Exclude all Métis surfaces from screen capture; don't append prior screenshots to every turn; context refresh is demand-driven; a prior screen grant ≠ consent to continuous logging; never read password fields/protected sessions/private folders to personalize a greeting; permission acquisition belongs to trusted Settings/native UI, never to the agent manipulating its own permission controls. | MASTER.md:4451 | MUST |

### 1.3 Read/Teach/Draft/Act, screen guidance, dictation, actions — MASTER.md:4453–4463, §32.5

| ID | Requirement | Source | Priority |
|---|---|---|---|
| R32-R | Four distinct modes — Read (evidence only), Teach (point + explain), Draft (prepare, no target change), Act (perform + verify). Selected mode must be visible; model must never silently promote Read → Act. | MASTER.md:4455 | MUST |
| R32-S | Screen guidance: native overlay annotations anchored to a recent snapshot; annotation carries target identity/display/normalized region/age/confidence/expected role; accessibility element bounds preferred over coordinate-only; scroll/resize/zoom/display-move/window-replace/stale-target invalidates the highlight and forces reobservation; a circle/arrow is **not** a permission prompt and cannot click-through; clear on Stop/app-switch/lock/tour-exit/permission-revocation; Windows uses real work-area coords (never emulate a Mac notch). | MASTER.md:4457 | MUST |
| R32-T | Dictation: pin the destination field before capture; keep verbatim text distinct from an optional rewrite; never strip negation/accents/product IDs/amounts/punctuation as "cleanup"; revalidate app/field/selection/focus generation before insertion; if target changed, preserve text and ask for destination or offer explicit copy; never paste into a password field/newly focused chat/search bar/terminal just because it has focus; clipboard fallback must respect an explicit user choice and not clobber a clipboard value the user changed meanwhile. | MASTER.md:4459 | MUST |
| R32-U | Actions: prefer API/connector-first execution; visible browser control is a separate route (task-owned window or explicit user-selected tab); never clone cookies/profiles/login state, disable security prefs, run hidden debug servers, or use undocumented OS input injection "to appear instant"; verify native API support and deployment eligibility before adopting any upstream computer-use helper; where only foreground interaction is supported, explain the handoff rather than pretend invisible background control works everywhere. | MASTER.md:4461 | MUST |

### 1.4 Concurrency, routines, skills/connectors, portal, performance, acceptance — MASTER.md:4491–4759, §32.8–32.16 (condensed; full text already in MASTER.md, not re-transcribed row-by-row here — see source lines cited)

| ID | Requirement (summary) | Source | Priority |
|---|---|---|---|
| R32-V | One desktop input writer per enrolled device via a revocable lease (run/agent/principal/policy epoch + heartbeat/expiry); a second agent waits, never races the pointer; agent-to-agent handoff carries original intent + minimal context + budget/authority intersection, with depth/step/concurrency caps and cycle detection; approvals bind the full reviewed action list + revisions + expiry — any source/agent/target/output/step/policy change invalidates the approval; "do it" is never transferable across agent bubbles. | MASTER.md:4495–4499 | MUST |
| R32-W | Routines: explicit recurrence/timezone/target-agent/permitted-data-tools/surface/budget/owner/expiry; service-work (laptop asleep, approved service) vs device-work (needs the specific enrolled unlocked device) are distinct and never silently substituted; idempotency key per occurrence; missed runs use an explicit skip/coalesce/one-catch-up policy (never replay a full backlog); proactive suggestions are read-only, small in number, with sources/benefit/permission/cost shown; meetings/DND/quiet-hours suppress unrequested speech/sound/cards; no employee-productivity ranking or sentiment profiling added to Operator. | MASTER.md:4501–4507 | MUST |
| R32-X | Provider/connector manifests report installed/configured/entitled/authenticated/scope-ready/tested/reachable **separately**; runtime discovery must corroborate actual tool schemas; background agents cannot self-authorize OAuth, read login cookies, paste keys into chat, or silently widen browser-automation permission. Every generated output gets a validated artifact manifest (owning agent/run, source revisions, type/MIME, storage handle, bytes/hash, creation/expiry, audience, render result, available actions) — no arbitrary absolute local path from a model; preview sandboxed, executable content blocked by default. | MASTER.md:4513–4515 | MUST |
| R32-Y | Operator ledger extension: employee/device/service identity, agent+version, skill+version, conversation, run, parent op, provider attempt, phase, queue wait, duration, billing units — product content stays outside telemetry; a heartbeat ≠ meaningful usage, a queued routine ≠ an active person; onboarding/creation/preview/execution/routine events are distinct classes (no generic "agent credit" counter); a support view must answer "why did X not finish" from authorized metadata only (no screenshot/transcript/prompt dumps in support export). | MASTER.md:4519–4523 | MUST |
| R32-Z | Performance budgets to **qualify, not assume**: agent-switch ack ≤100ms p95 (uncached history read excluded); local draft keystroke-to-paint ≤50ms p95; 1000-turn chat must paginate/window (no full render); 20-agent catalog must not create 20 continuous animation loops; inactive animated surfaces do zero frame work; onboarding targets first useful typed success within 3 minutes excluding external consent (measured separately from voice readiness). | MASTER.md:4529 | SHOULD (qualification targets, not committed SLAs) |
| R32-AA | Acceptance journey requires one **real** enrolled user: create a named agent (no start), select authorized source, get full/partial-coverage answer, approve a scoped side effect, verify result, cross-check via Mantu Intelligence/Dust, find accurate Operator metadata — repeated on Windows and native Mac, both Jev and Laya provider variants. | MASTER.md:4533 | MUST |

### 1.5 AGX-01..16 gate catalog (MASTER.md:4539–4556, table, §32.13)

All 16 gates reproduced verbatim (condensed to id/title/evidence) because this table is itself the authoritative acceptance contract for §32 — every AGSTEP and AGUC below maps back to one of these:

| Gate | Title | Root task owners | Required evidence |
|---|---|---|---|
| AGX-01 | Source and adoption integrity | TASK-001,002,061 | Every adoption names actual packaged evidence + its limit; no private service/proprietary media copied |
| AGX-02 | Authorized full-document context | TASK-005,033,037,057 | Broker distinguishes current buffer / saved source / visible screenshot / partial / full coverage |
| AGX-03 | Screen guidance w/o hidden action | TASK-030,033,056 | Annotations carry fresh identity, never execute input or impersonate a permission prompt |
| AGX-04 | Safe verbatim dictation/insertion | TASK-019,033,056,057 | Verbatim vs rewrite distinct; exact focus/field/clipboard ownership validated |
| AGX-05 | Resumable personalized onboarding | TASK-008,027,044,055 | Existing scene order + native ownership retained; progressive coaching; Tony-only/text fallback; consent; no-run creation; replay verified in real product; **no replacement wizard** |
| AGX-06 | Stable named-agent definitions | TASK-005,042,044 | Identity separate from models/skills/runs; appearance change cannot broaden authority |
| AGX-07 | Correct routing and pinned providers | TASK-019,031,032,043 | Names/focus/turn context resolve correctly; provider pins never silently change |
| AGX-08 | Isolated memory, drafts, source authority | TASK-035,039,041,043,044 | Per-principal/stable-namespace isolation; shared knowledge stays canonical |
| AGX-09 | Bounded concurrent runs and input leases | TASK-005,033,043,057 | One run owns desktop input per device; cancellation/generation/verification gate every effect |
| AGX-10 | Explicit routines and calm suggestions | TASK-043,045,048,062 | Explicit scope/location/timezone/budget; meeting/privacy-state respected |
| AGX-11 | Probed connectors and typed schemas | TASK-006,033,043,045 | Ready reflects a real scoped authenticated probe; typed write schemas + readback |
| AGX-12 | Central skills and truthful capabilities | TASK-009,042,043,044 | Published skills determine capability; arbitrary local scripts don't self-enable |
| AGX-13 | Scoped artifacts and safe previews | TASK-035,043,044,057 | Outputs verified before presentation; preview/open/export/overwrite/share are separate authority decisions |
| AGX-14 | Per-agent operational truth | TASK-015,034,045 | Operator reconciles op/agent/skill/provider/billing identities, no content logging |
| AGX-15 | Minimal animated identity, fast Home | TASK-028,030,044,060 | Orb-only ARMED; expanded names clear; animation bounded; history paged; a11y preserved |
| AGX-16 | Real cross-platform E2E qualification | TASK-029,055,056,057,063,065 | Native signed Windows/live-service + independent native Mac journey prove real capability |

*(MASTER.md:4541–4556, verbatim table)*

### 1.6 AGUC-001..032 use cases (MASTER.md:4562–4595, §32.14)

Full 32-row table is reproduced verbatim in MASTER.md:4562–4595 (gate mapping AGUC→AGX is 1:1 per row) and is not re-copied here in full to keep this report navigable; it is the acceptance-test denominator for §1.5's gates and remains **NOT_TESTED** by contract until real product qualification (MASTER.md:4560). Representative high-risk cases worth flagging to the Opus planner because they map directly onto Tony's two reported bugs (heaviness, History-hang) even though they are framed as agent-feature cases, not bug tickets:
- AGUC-017 (AGX-09): "Two agents request keyboard or pointer control simultaneously → one lease owner acts, the other waits; no mixed typing/cursor race" (MASTER.md:4580) — directly relevant to any future multi-agent version of the freeze Tony sees today with a single agent.
- AGUC-018 (AGX-09): "Cancel a run as its provider result arrives → reject late dispatch, release authority, reconcile any already-attempted effect truthfully" (MASTER.md:4581) — same class of race as the orphaned llama-server sidecars observed at runtime (see K06 cross-lane note in §5 below).
- AGUC-029 (AGX-15): "A catalog contains twenty agents and a thousand-turn chat → do not create twenty frame loops or render whole history per keystroke; measure actual resource use" (MASTER.md:4592) — directly on-point for the "very heavy on the PC" bug report if/when named agents ship.

### 1.7 AGSTEP-01..18 ordered slices (MASTER.md:4597–4757, §32.15)

Full 18-slice sequence with root owners, prerequisite slice, gates, "Do", and "Before closing" verbatim in MASTER.md:4601–4757. Dependency chain (source-derived, not re-invented):

```
AGSTEP-01 (baseline) 
  └─ AGSTEP-02 (contracts: identity/context/authority)
       ├─ AGSTEP-03 (context resolution) ──▶ AGSTEP-04 (screen guidance + dictation)
       ├─ AGSTEP-05 (onboarding + Tony welcome)         [depends only on AGSTEP-02]
       ├─ AGSTEP-06 (named-agent registry) ──┬─ AGSTEP-07 (orbs + Agent Home)
       │                                     ├─ AGSTEP-08 (memory + artifacts)
       │                                     └─ AGSTEP-09 (voice/text routing, Jev/Laya)
       │        AGSTEP-08 + AGSTEP-09 ──▶ AGSTEP-10 (hosted execution)
       │        AGSTEP-03 + AGSTEP-10 ──▶ AGSTEP-11 (native action leases)
       └─ AGSTEP-12 (connectors, depends only on AGSTEP-02)
AGSTEP-08+10 ──▶ AGSTEP-13 (artifact navigation/preview)
AGSTEP-10+11+12 ──▶ AGSTEP-14 (routines/suggestions/quiet mode)
AGSTEP-10+12+14 ──▶ AGSTEP-15 (Operator accounting)
AGSTEP-04+05+07+11+12+13+14+15 ──▶ AGSTEP-16 (fresh/upgrade cross-system journeys)
AGSTEP-16 ──▶ AGSTEP-17 (abuse/concurrency/a11y/perf qualification)
AGSTEP-17 ──▶ AGSTEP-18 (final platform artifacts: Windows signed release; native Mac independently qualified, public Apple hold explicit)
```

Note the explicit ordering rule: "The urgent existing P1/input lane proceeds before optional agent work" (MASTER.md:4599) — i.e. §32 work is *additive* and must not block or reorder whatever P1 bug-fix lane already exists in the baseline plan (relevant since this run's other lanes include Tony's crash/perf bugs).

### 1.8 §32.22 capability disposition (MASTER.md:4760–4765)

`clicky-study/CAPABILITY-ADOPTION.md` + its 48-row JSON inventory (kit path, not read by this lane per scope — belongs to AGSTEP-01 evidence, owned by whichever lane inspects `clicky-study/`) governs which HeyClicky-observed capabilities get implemented through the existing central registry vs. remain explicit NOT_TESTED/BLOCKED candidates. Catalog states are distinct: discovered/reviewed/entitled/connected/ready/enabled/executed — "one imported guide cannot set all seven" (MASTER.md:4764).

---

## 2. §33 — Codex + Fable/Claude collaboration contract (MASTER.md:4767–4863)

This section is **process/governance**, not a product feature — but it is a hard requirement on *how* the rest of version 2.0 must be built, and it directly targets the orchestration this very workflow run is attempting (Opus-plans/Sonnet-executes/ChatGPT-audits pattern the user asked for). Extracted as requirements:

| ID | Requirement | Source | Priority |
|---|---|---|---|
| R33-A | This package is "a complete implementation contract... not the finished application, a runnable replacement source tree, credentials, or a signed release." Implement real paths in the actual current checkout; do not stop after architecture/contracts/scaffolding/mocks/dependency-install/pattern-tests; continue until required evidence passes or a genuine prerequisite is unavailable; at a blocker, preserve work, name the exact owner/unblock, continue other authorized lanes. | MASTER.md:4771 | MUST |
| R33-B | Roles: "Codex is the integration lead. Fable/Claude is the requested second engineering participant" for architecture challenge, allocated-file implementation, and independent review — "an engineering collaboration, not another runtime agent shipped inside Métis." Coding-tool weights/transcripts/credentials must never enter the installer, Operator telemetry, or a user's meeting graph. | MASTER.md:4773 | MUST |
| R33-C | A narrower approved Windows release and full-contract completion are separate decisions; native Mac public signing may remain explicitly pending without that blocking native engineering/QA being called complete; the Tony recording is `NOT_PROVIDED` until supplied and the complete text welcome is the *working default*, not a blocking placeholder. | MASTER.md:4775 | MUST |
| R33-D | Record actual Codex/Claude environment versions, repo root, branch/HEAD, model identity, endpoint, workspace policy, permissions, coding budget (no credential printing). Fable must resolve to a real eligible route — no third-party imitation, no assuming a label change = Fable; unavailable/prohibited model → record the blocker and request approval before substituting. [R92] | MASTER.md:4779 | MUST |
| R33-E | Inspect effective project/global/managed instructions, hooks, skills, MCP servers, tool settings before a headless call; never bypass permission/approval/content-governance to automate a reviewer; CLI switches ≠ an OS sandbox. [R93] | MASTER.md:4781 | MUST |
| R33-F | Use an already-authorized native collaboration mechanism when present; otherwise the kit's local hash-bound handoff tool (`tools/dual_agent.py`) works between two independently started sessions and does **not** pretend to be a live bridge. The optional Claude launcher requires explicit data/config approval + model/budget params, installs nothing, never auto-opens a paid session; a failed/missing Claude auth is a failed review attempt, never a synthetic pass. | MASTER.md:4783 | MUST |
| R33-G | Confidential source under review uses the owner's approved coding account/retention route — never the product's speech token, never an assumption that Cloudflare speech privacy extends to Claude. | MASTER.md:4785 | MUST |
| R33-H | Read START-HERE + role launch text + MASTER §0/§33/relevant task + the real HEAD source before acting; never inject the entire master into every review or let AGENTS.md grow until truncated; repository's own AGENTS.md is not replaced by the kit's handoff AGENTS.md. [R90] | MASTER.md:4789 | MUST |
| R33-I | Make owner decisions explicit where old repo docs conflict (Cloudflare default, local models optional, no org credentials in installers, orb-only ARMED, retained onboarding/Tony welcome, separate native-Mac release) rather than "silently follow whichever stale design file is found last"; update the affected design contract/tests with a reviewed change record, never delete tests to force new behavior to pass. | MASTER.md:4791 | MUST |
| R33-J | Preserve every baseline + extension ID; registry is an index, not an independent source of features; requirement / implementation-state / deployment-state / applicability / verification stay **separate fields** — new work is never prefilled as verified, and prior findings are hypotheses to revalidate at current HEAD, not proof of today's incident. | MASTER.md:4793 | MUST |
| R33-K | **Ownership/concurrency:** Codex owns integration, dependency ordering, shared schemas, lockfiles, migration sequencing, final branch. Fable may own explicitly allocated slices but never edits the lead's files concurrently. Each slice: unique owner, base commit, exact dirs/files, in/out contracts, permitted side effects, review target, tests, timeout/checkpoint. Shared-boundary changes need a proposal to the integration owner first. | MASTER.md:4797 | MUST |
| R33-L | Separate worktrees/branches (never a shared uncommitted tree or single build-output dir); worktrees isolate files, not DBs/credentials/audio devices/release channels; distinct test ports/profiles/DBs; one native capture/action test owner; never auto-copy secret files into worktrees; preserve dirty user work (no destructive reset/stash/clean/force-push to "isolate" a task). [R91] | MASTER.md:4799 | MUST |
| R33-M | **Independent review means independent**: if Fable implements a slice, Codex reviews it — the author cannot fill the reviewer slot under another label. Native/live-service tests need authorized runners/accounts; a reviewer may inspect evidence but cannot pretend it executed a test run elsewhere. | MASTER.md:4801 | MUST |
| R33-N | Parallelize only genuinely independent work (P1/right-edge repairs independent of optional local packs/Mac certs/Teams-media; Laya bring-up doesn't need a Jev key); record cross-lane API contracts first; don't spin up "ten copies of the same investigation." | MASTER.md:4803 | MUST |
| R33-O | **The mandatory 10-step loop per deliverable** (claim/inspect → plan vertical slice → implement live path end-to-end → characterize+regress with negative tests preserved → handoff a pinned review packet → independent review with file/symbol-level findings and severity → repair+re-review, no waiving critical findings for budget → verify actual integration end-to-end with readback → integrate+checkpoint within approval policy → promote only qualified, signed, verified bytes). | MASTER.md:4805–4816 | MUST |
| R33-P | **"No skeleton / fake integration / false readiness" acceptance table** (User entry / Identity+policy / Provider / State+writes / UX+recovery / Operations / Native behavior / Release) — each row lists the required real behavior vs. what must be rejected as completion (e.g. "Config file generated but not deployed" is explicitly rejected under Operations; "Linux parser pass represented as Mac/Windows behavior" rejected under Native behavior). Tests may mock; the production entry path never does. Audit every TODO/FIXME/placeholder/no-op/caught-and-ignored-error in advertised functionality rather than blanket-banning legitimate interfaces/test doubles. | MASTER.md:4820–4835 | MUST |
| R33-Q | A real dependency outage may legitimately return an explicit unavailable state — that is reliable failure handling, not delivery. Never: count a disabled required feature as done, label every hard case unsupported, narrow scope without approval, lower thresholds after seeing results, edit the reference transcript to match the model, or drop failure cases from the denominator. | MASTER.md:4835 | MUST |
| R33-R | **Evidence contract**: every closure receipt binds task/slice, requirement/UC IDs, platform/profile, implementation HEAD, artifact hash (if applicable), backend deployment, schema/policy/component/model revisions, dataset/rubric, executed command/test IDs, exit codes, observed result, evidence location, runner+reviewer identity, time, remaining limitations — including error/cancellation/partial/denied cases, not only happy paths. | MASTER.md:4839 | MUST |
| R33-S | `tools/dual_agent.py` binds a review packet to a clean committed worktree, validates a returned review against that exact snapshot, and can reject stale/modified packets or contradictory verdicts — but explicitly **cannot** authenticate a human, prove a model identity from a self-written JSON field, attest legal compliance, or certify a release; its zero exit is never a release pass. | MASTER.md:4841 | MUST |
| R33-T | The optional launcher runs the installed Claude CLI with a requested model/budget/read-only tools, feeds the packet via stdin, checks whether the snapshot changed — it does not run tests itself and grants no write/deployment authority; it was **not live-authenticated during kit prep** ("its transport/error paths are tested with local fakes and labelled as such") — real-route qualification is explicitly assigned to TASK-001/002. | MASTER.md:4843 | MUST — and a direct UNKNOWN flag: the collaboration tooling itself is unverified against a live Claude session as of kit authorship. |
| R33-U | Readiness gating before various claims: customer-content use needs credential/tenant readiness + privacy assurance + deployed controls; core qualification needs real cloud speech/transcription/Jev+Laya/native actions/canonical+Dust writes/central skills/attributable portal; Teams/live-media claims need actual supported start/admission/media/status/audience tests (personal tab / manual import are not substitutes); Windows release needs full gate pass + current review + security/privacy + recovery + signed installer; upgrade must preserve IDs/keys/knowledge/choices; never silently disable signature verification/Defender/Gatekeeper/TLS/sandboxing/tenant checks/review policy; Mac public release has a separate explicit hold. | MASTER.md:4847–4849 | MUST |
| R33-V | Unavailable signing credentials / Tony's recording / tenant consent / media eligibility / supplier terms / a missing refactoring skill are **external inputs a model may not fabricate**; discover what can actually be retrieved/configured; don't ask for secrets in chat (use secret managers); missing optional film ≠ block on finished text-led onboarding; missing critical cloud privacy DOES block the protected route. | MASTER.md:4851 | MUST |
| R33-W | Durable continuation: immutable handoff package stays separate from mutable execution state (`CURRENT.md`, task states, review packets, test receipts, decisions, numbered lessons in an approved project-local dir); never write transcripts/secrets/failed binaries/native test profiles into the kit, production knowledge, or ordinary git history. At each completed vertical slice / before context compaction: record actual HEAD/dirty state, task owners, accepted interfaces, implemented-vs-deployed-vs-tested distinctions, commands, outstanding findings, next executable operation, rollback. | MASTER.md:4855–4857 | MUST |
| R33-X | Stop only the blocked operation for an ordinary blocker; stop **all** affected operations for a credential leak, missing authority, unauthorized capture, cross-tenant access, content-retention breach, destructive ambiguity, or unverifiable candidate — request the precise decision, never "keep going" through a security boundary. At completion, give the full test/status catalog and real install/release links — never a percentage score or a generic "everything works." | MASTER.md:4859 | MUST |

**Repo cross-check (OBSERVED):** `find . -iname "dual_agent.py" -o -iname "FABLE-START*" -o -iname "CODEX-START*"` inside `/Users/<redacted-user>/AI-Brain-build/metis-2.0` returns nothing — the collaboration tooling lives only in the kit (`.../Metis-2.0-Upgrade-Kit-r11/tools/dual_agent.py`, `.../read_agent_step.py`, `read_memory_step.py`, `read_source.py`, `read_task.py`, `serve_preview.py`), not in the product repo. That is expected (it's engineering tooling, not application code) but confirms §33 process machinery has not yet been wired into this checkout's actual dev workflow — an open item for whichever lane sets up the r11 execution loop.

---

## 3. §34 — Retained Métis onboarding, Tony welcome, progressive access (OBU) (MASTER.md:4866–5000)

### 3.1 Non-negotiable direction (MASTER.md:4875–4881, §34.1)

| ID | Requirement | Source | Priority |
|---|---|---|---|
| R34-A | Original Métis onboarding is the host experience: keep identity, narrative, scene components, progress model, placement choice, real guarded demo, consent, settings persistence, completion route. Borrow interaction *principles* from HeyClicky (permission explanations, exercises, state feedback, accessible controls) — never its visual identity/names/presenters/architecture. This amendment **replaces only** the r9 eight-stage generic-agent-wizard instruction; all other existing requirements continue. | MASTER.md:4877–4879 | MUST |
| R34-B | Tony Walteur is the **only** named human anywhere in user-facing onboarding (welcome, subtitles, transcript, lower third, sample meeting, a11y labels); Métis is the product name; no fictional colleagues/testimonials/customer identities; does not rename the actual signed-in user or their real meeting history; technical/legal attribution stays outside onboarding, not erased/misattributed. | MASTER.md:4881 | MUST |

### 3.2 Actual source state (MASTER.md:4883–4906, §34.2) — **verified against the live repo**

MASTER.md:4885 claims the inspected file is `src/renderer/src/lib/onboarding-flow.ts` with sequence `hero → problem → reveal → appearance → setup → personalize → [license if enabled] → ready`, plus `sceneAfterReveal()→appearance`, `sceneAfterAppearance()→setup`, `sceneAfterSetup()→personalize`, `sceneAfterPersonalize()→license-or-ready`.

**OBSERVED, confirmed exactly correct against HEAD 2bf21f1c:**
```
src/renderer/src/lib/onboarding-flow.ts:5   *   hero -> problem -> reveal -> appearance -> setup -> personalize -> [licen...
src/renderer/src/lib/onboarding-flow.ts:33  export function sceneAfterReveal(): OnboardingScene { return 'appearance' }
src/renderer/src/lib/onboarding-flow.ts:38  export function sceneAfterAppearance(): OnboardingScene { return 'setup' }
src/renderer/src/lib/onboarding-flow.ts:43  export function sceneAfterSetup(): OnboardingScene { return 'personalize' }
src/renderer/src/lib/onboarding-flow.ts:48  export function sceneAfterPersonalize(licenseGateEnabled): OnboardingScene { return licenseGateEnabled ? 'license' : 'ready' }
```
This is a rare case in the kit where the spec's factual claim about the current checkout is independently verifiable and **matches** — the r11 authors did inspect the real file, not a stale export. Good sign for trusting the rest of §34's "actual source" claims, though each should still be reconfirmed at implementation time since HEAD may have moved.

The kit's own `onboarding/source/BINDINGS.json` (kit path, OBSERVED) separately records: `desktop_scene_order` matches the above; `native_export_scene_order: [hero, story, reveal, setup, personalize]` (5 acts, Swift, no appearance/license/ready — a genuinely different, older topology); and explicitly flags `missing_export_files: ["src/renderer/src/components/OnboardingExperience.tsx"]` — i.e. the kit's own source export did not capture that file, so its content must be independently re-read from the real checkout before implementation, not assumed.

**OBSERVED, confirmed:** `src/renderer/src/lib/onboarding-hero-video.ts:7` still does `import localHeroUrl from '../assets/onboarding-hero-lady-planet.mp4'` — this is exactly the "old packaged non-Tony welcome video" MASTER.md:4910 says must be retired (OBU-02). The retirement work described in §34.3/§34.7 (OBU-02) has **not yet been done** in this checkout; the old asset is still the live import as of HEAD 2bf21f1c.

**OBSERVED, file exists:** `src/renderer/src/components/OnboardingExperience.tsx` **does exist** in the real checkout (`find` in §0 above lists it) even though the kit's export was missing it — confirms MASTER.md:4893's instruction ("the implementer must obtain that file before modifying the real composition") is exactly the right call and the file is available to read directly rather than reconstructed.

### 3.3 Scene-by-scene integration table (MASTER.md:4897–4906, verbatim) and media lifecycle (MASTER.md:4916–4930, §34.3)

| Scene | Preserve | Integrate w/o replacing |
|---|---|---|
| Hero | Métis mark, "The wisdom before the moment", welcome shell, Begin | Optional Tony welcome in same slot; complete text-led fallback |
| Problem | Existing meeting story/pacing | User-controlled pacing/text alt; reduced-motion equivalent; no other named humans |
| Reveal | Real Bar/Copilot/Answer/QuickActions + existing demo guard | Explain voice-vs-typing, visible-vs-full context, draft-vs-action via bounded synthetic examples |
| Appearance | "Where should Métis live?" position; Hidden/Island/Bar options | Keyboard-selectable previews, readable selected state, no premature persistence/geometry rewrite |
| Your setup | Permission/probe rows, status animation, state authority | Guided explanation, one permission at a time, return/recheck, failure repair, optional deferral |
| Personalize | General/Sales/Recruiting, language, "Tell the room", explicit consent | Accessible input/reading prefs + contextual agent recommendations w/o auto-execution |
| Optional license | Existing entitlement semantics/default | No new mandatory purchase/step; no media/permission workaround |
| Ready | Existing landing, only completion point | Truthful readiness summary + usable typed landing; video-end/OS-dialog cannot complete tour |

Media lifecycle enum: `NOT_PROVIDED → DRAFT_RECEIVED → IN_REVIEW → APPROVED → AVAILABLE`; `REVOKED`/`MISSING`/`DECODE_FAILED` always fall back to Métis-only text welcome (MASTER.md:4918–4920). Current delivered manifest state is **`NOT_PROVIDED`** with null media paths (MASTER.md:4920) — confirmed consistent with kit's `onboarding/media/tony-walteur.manifest.json` being `NOT_PROVIDED` (per `onboarding/README.md:17`).

### 3.4 Permission-row states and accessibility (MASTER.md:4932–4970, §34.4–34.6)

| ID | Requirement | Source | Priority |
|---|---|---|---|
| R34-C | Permission conversation shape: what this enables → what it can access → your choice → trusted OS handoff → actual recheck → clear next step; one capability at a time, details expand on demand. Six named capabilities (Microphone, Screen context, macOS Accessibility, Windows app interaction, Files, Notifications) each with explicit Métis-explanation + control-boundary text (table at MASTER.md:4936–4943). | MASTER.md:4934–4943 | MUST |
| R34-D | Row-state enum: `checking, loading, action, waiting_for_return, denied, restricted, restart_required, granted_unverified, ready, deferred, revoked, unavailable` — preserve existing enum/storage compatibility via a versioned mapper (no uncontrolled rename); opening Settings → `waiting_for_return` (never `ready`); return triggers a fresh native probe bound to app/build/principal/capability/generation; "Not now" defers one capability only (never skips onboarding or grants it); repeated clicks must not open repeated permission windows. | MASTER.md:4949–4955 | MUST |
| R34-E | Onboarding a11y: operable without OS-control permission, without speech, without video, without decoding animation; semantic headings/buttons/labels; Next/Back moves focus to the new heading (passive probe updates don't steal focus); polite live region for state changes only (not animation frames or mic-level samples); ≥44×44 CSS px targets; 200% text support; reduced motion honored from first frame; KineticGrid stays non-interactive `pointer-events:none`; final recording needs synchronized captions + a separate descriptive transcript matched to the **filmed** content (draft script ≠ transcript until filmed). | MASTER.md:4959–4969 | MUST |
| R34-F | Keep the real guarded Reveal demo (Bar/Copilot/Answer/QuickActions with synthetic data, no real save/rating/network effects); teach exactly three ideas there: typing available, visible-scope context, draft≠send; Tony stays the only named human in demo strings; a cursor animation may only point/simulate within the bounded demo, never issue arbitrary native input. | MASTER.md:4973–4977 | MUST |

### 3.5 OBU-01..05 implementation sequence (MASTER.md:4979–4991, §34.7) — verbatim

| ID | Work | Source | Sub-slice of |
|---|---|---|---|
| OBU-01 | Baseline and source binding: inspect current checkout vs supplied export; read existing scene/media/permission/persistence tests; recover the missing parent component (`OnboardingExperience.tsx` — **now confirmed present in repo, see §3.2**); confirm active media paths/localized copy. | MASTER.md:4981 | TASK-005/008/019/027/028/029/030/033/055/056/057/060/062/063 |
| OBU-02 | Media retirement and Tony slot: remove runtime selection/reachability of retired media, install null/approved-manifest contract, add failure fallback + user-controlled playback + teardown; do not broaden CSP to make a hosted video work. **Not yet done — `onboarding-hero-video.ts:7` still imports the old MP4 (OBSERVED).** | MASTER.md:4983 | same |
| OBU-03 | Setup coaching: extend rows + native bridge readback; generation-bound requests; just-in-time scope; denial/restricted/restart repair; independent readiness categories; no auto-elevation/TCC editing/fake grant/new capture loop. | MASTER.md:4985 | same |
| OBU-04 | Accessibility and copy: integrate semantic/focus/input/motion behavior into actual scenes (not a separate wizard); review all supported languages/labels/captions/demo strings/poster metadata for the Tony-only rule. | MASTER.md:4987 | same |
| OBU-05 | Native and installed validation: test actual source components, persisted/replayed flows, media decode on final package, real OS permission interaction on Windows and Mac; preserve original high-priority Next/Ready/dock regressions and all parent release gates. | MASTER.md:4989 | same |

Native parity note (MASTER.md:4991): the native Swift model's separate five-act form (`hero, story, reveal, setup, personalize` — confirmed in `onboarding/source/BINDINGS.json`'s `native_export_scene_order`) requires **explicit parity decisions in its own model/tests** — inserting desktop scenes into it "by assumption" or creating a second native coordinator is explicitly disallowed.

### 3.6 Acceptance (MASTER.md:4993–4999, §34.8)

Accepted only when: original scene topology + completion rule hold; every onboarding media/named-human reference is Tony-Walteur-approved; old media cannot reappear via fallback/preload/update/locale; setup is completable through the legitimate route without falsifying readiness. Required negative-path test matrix: missing/corrupt/unsupported/revoked recording; no captions; stale/incorrect transcript; cancelled media; replay+app-close; reduced motion; voice-only vs typed; denied/restricted/revoked permission; return-from-Settings; changed principal/build/generation; keyboard/screen-reader completion; mixed scaling/displays; 200% text; a truly unavailable backend; the actual signed/native artifact. "Missing real media must remain `NOT_PROVIDED`; no fake 'video verified' evidence" (MASTER.md:4997).

**Cross-reference note:** the kit's own `verification/REPORT.md`, `policy-results.json`, `structure-results.json`, `browser-results.json`, and `checksums` under `onboarding/verification/` are kit-internal synthetic-review artifacts (per `onboarding/README.md:33`, "Browser checks need an already approved Playwright/Chromium environment... Read verification/REPORT.md for executed checks and native/media gates that remain unverified") — they are **not** evidence of anything having been verified against the real Metis 2.0 app; do not cite them as product proof.

---

## 4. §35 — Hindsight embedded memory (HM / HMUC / HMSTEP) (MASTER.md:5029–5363)

### 4.1 Product outcome and architecture (MASTER.md:5035–5058, §35.1)

| ID | Requirement | Source | Priority |
|---|---|---|---|
| R35-A | Six target workflows must become real: "Remember that I prefer French summaries"; "What changed since our last meeting?"; "What did we agree, and what remains uncertain?"; "Why did this agent use that information?"; "Correct that commitment"; "Forget this preference." Availability is gated by current user/tenant/agent/source-permissions/audience — a sleeping laptop must not block an approved shared server memory query, and a device-only/private vault must not be uploaded just to satisfy availability. | MASTER.md:5037 | MUST |
| R35-B | "Embedded means one Métis identity, one UX, one governed API, one operational portal and a thin desktop/native client." Recommended deployment: private service on the already-approved container platform + managed PostgreSQL + supported vector extension; Hindsight's API/worker + any server embeddings/reranker stay there, **never in every EXE/DMG**; Cloudflare keeps only speech + authorized gateway/control; a standard Worker or D1 is explicitly **not** a drop-in host for Hindsight's Python/Postgres runtime; any alternate host needs its own workload/lifecycle/persistent-storage qualification. [HS-R09, HS-R14] | MASTER.md:5039 | MUST |
| R35-C | Architecture diagram (MASTER.md:5041–5055, verbatim) establishes strict layering: client surfaces → existing knowledge/memory API → canonical records/approval/revisions/ACLs/tombstones → bounded context builder → Hindsight retain/recall/reflect (private service) → Postgres projection + extraction/embedding/reranking/synthesis → source/audience-checked answer → existing Operator ledger (readiness/purge metadata only). Graphify/wiki and the developer codebase graph are explicitly **separate** projections, never authoritative over this chain; Hindsight is "persistent, derived application memory, never the authority above them." | MASTER.md:5042–5055 | MUST (architectural invariant) |
| R35-D | This is a new **approved derived-content storage boundary** — cannot honestly be called "no data retained anywhere." Existing Cloudflare content-log/cache/queue/store prohibition is unchanged; hosted Vectorize Cloud must **not** auto-enable — self-hosted/private service is the default for this plan, hosted service is a separate future approval+commercial decision. | MASTER.md:5057 | MUST |

### 4.2 Three layers of truth (MASTER.md:5059–5065, §35.2)

Canonical evidence (durable, human-verified) → Memory projection (extracted/observed, engine-labelled "fact" ≠ verified business value) → Synthesis (reflected answers, always carries sources/freshness/uncertainty, never auto-retained as its own corroboration). Hard rule: never replace deterministic business totals / signed policies / source permissions / provider selections / skill definitions / exact approved action arguments with recalled text; Hindsight never grants execution rights; memory retrieval must never fill missing audio with a plausible transcript or "repair" a negation.

### 4.3 Scope, banks, tags (MASTER.md:5067–5075, §35.3)

| ID | Requirement | Source | Priority |
|---|---|---|---|
| R35-E | Server-owned mapping: authenticated principal + eligible knowledge scope → bank/generation. Separate personal / agent-private / explicitly-shared team-account-project / synthetic-test / engineering memory. Agent rename ≠ new identity; a role title is never an access-control credential; cloud-backed memory must not be used during an explicit local-only interaction. | MASTER.md:5069 | MUST |
| R35-F | **Homogeneous effective-ACL banks** as the initial boundary; never consolidate private+team material and plan to filter citations after ("model generation could already have consumed it"); on a permission change, quarantine the affected generation before retrieval and rebuild the permitted remainder (or use isolated storage); output-audience restrictions applied before recall/rerank/reflect AND again at release; personal evidence cannot flow to a Teams shared stage or wider Dust service account. | MASTER.md:5071 | MUST |
| R35-G | Hindsight's shared API key is service auth only, never Entra user/record authorization; a custom tenant extension still requires the Métis access model; scope IDs/identity headers/tags/policies/provider keys are **server-derived**, never trusted from an MCP JSON argument. [HS-R03, HS-R08] | MASTER.md:5073 | MUST |
| R35-H | Initial adapter requires nonempty security tags, `tags_match=all_strict`, `observation_scopes=combined`; these are defense-in-depth *within* an already-authorized bank, not the authorization itself; `all_strict` ≠ exact tag-set equality; forbidden: `any`, blank scope, fuzzy tags, shared global observations, per-tag authority splitting, automatic all-combination materialization; untagged directives still apply during reflect — keep them operator-owned/reviewed. [HS-R02, HS-R04, HS-R05] | MASTER.md:5075 | MUST |

### 4.4 Ingestion (MASTER.md:5077–5085, §35.4)

Only eligible canonical records with verified approval/revision/visibility/expiry/storage-policy are retained; initial supported categories: approved summaries, approved explicit preferences, verified execution receipts. **No** continuous transcription retain, screenshot archive, passwords/tokens, unapproved personal data, confidential/local-only source, automatic historical export, or covert agent-conversation capture. "Remember this" creates a canonical preference (scope/lifetime) first, then a projection — ordinary chat does not imply every sentence becomes memory. Ephemeral mode prevents all derived retention including feedback/delayed jobs. Submit `replace`, not append; source revision + ACL epoch prevent an old retry overwriting a newer correction; upstream retain is not compare-and-swap — requires durable cross-replica fencing + metadata-only outbox. State machine: canonical saved → projection queued → upstream accepted → indexed → recall-verified; a provider `success:true` is **not** proof of cross-system completion or searchable memory. [HS-R02, HS-R06, HS-R07]

### 4.5 Privacy profile and readback (MASTER.md:5087–5109, §35.5) — concrete config, treat as literal acceptance criteria

```
HINDSIGHT_API_STORE_DOCUMENT_TEXT=false
HINDSIGHT_API_LLM_TRACE_ENABLED=false
HINDSIGHT_API_OTEL_TRACES_ENABLED=false
HINDSIGHT_API_MCP_ENABLED=false
HINDSIGHT_API_ENABLE_FILE_UPLOAD_API=false
HINDSIGHT_API_ENABLE_DOCUMENT_EXPORT_API=false
HINDSIGHT_API_ENABLE_DOCUMENT_IMPORT_API=false
HINDSIGHT_API_RETAIN_EXTRACTION_MODE=concise
HINDSIGHT_API_OPERATION_RETENTION_DAYS=1
```
(MASTER.md:5092–5101) — this is a proposed *starting* profile, to be minimized further where possible, not a legal conclusion; `chunks`/`verbatim` extraction modes must **not** be enabled under this profile despite being able to preserve source text regardless of the document-text flag (MASTER.md:5105); `/version` check confirms flags only, not network isolation or every sink (MASTER.md:5109); no secret may appear in renderer/SwiftUI/JS bundle/bank label/deep link/onboarding video/review packet.

### 4.6 Recall/reflection performance and correction/forgetting (MASTER.md:5111–5131, §35.6–35.7)

Memory is invoked only when the request actually depends on prior context — never on every keystroke/speech-partial/animation-frame/heartbeat/deterministic open-close; a memory outage must never disable mic Stop/UI/canonical notes/other deterministic actions. Reflection is an explicit, separately budgeted deeper operation; withhold synthesis entirely if any required source is unauthorized/stale/unresolvable/deleted; a final-output token cap ≠ total internal cost cap. The shipped transport is deliberately **facts-only, excluding mental models** — explicitly "a safe initial component profile, not permission to omit the planned richer memory"; HMSTEP-10 must qualify the richer profile (lineage, invalidation, refresh) before it is enabled. Corrections: fix canonical record by expected revision, then invalidate derivatives — never write a correction only into a regenerable Hindsight extraction. Forgetting: persist exact-source tombstone, invalidate read authority immediately; user-visible state is "not used anymore; removal still in progress" until purge is verified; the documented `is_stale` flag does **not** detect source deletions — Métis must explicitly invalidate dependent observations/models/pages/history/cached answers itself. Deletion ledger distinguishes canonical deletion / retrieval block / primary purge / derivatives / external replicas / backups-legal-hold / completion; never claim physical removal from inaccessible supplier infra based on an HTTP status alone.

### 4.7 In-product UX, Dust/skills integration, portal, migration (MASTER.md:5133–5169, §35.8–35.11)

Memory lives in existing Knowledge & skills / Mantu Intelligence (Inspect/Correct/Forget), never a 5th Settings destination and never a second orb/spinner. Dust reads/writes only through existing Métis MCP/knowledge services — never a direct shared Hindsight API key; a skill cannot redefine its own ACL or create an unreviewed persistent policy. Engineering Hindsight memory (if separately authorized for Codex/Fable) must be isolated from product memory with different banks/credentials/retention. Portal pane: version/readiness, bank counts (no names/content), projection lag, failures, quarantine/expiry, purge backlog, latency, cost — reconcile parent vs child totals, no per-source IDs in metric labels. Migration: start with synthetic data + empty bank, opt-in real smoke only after real permissions, then a small owner-approved canonical set; never feed the raw export/entire OneDrive/all old transcripts "to give it memory"; new embedding model (even same dimensions) = new projection generation, qualify, then atomically promote the pointer; rollback changes the retrieval projection only, never source facts/permissions/tombstones. Proposed (not yet achieved) latency budgets: hot auth/index overhead ≤50ms p95; UI ack ≤100ms; warm bounded recall ≤700ms p95; deep reflection ≤8s target w/ cancellation; simple open/close paths keep their existing latency target with **no compulsory memory call**.

### 4.8 HMSTEP-01..16 (MASTER.md:5175–5192, verbatim table, and `memory/EXPANSION.json` which mirrors it exactly — cross-checked, no divergence found)

| Step | Work | Prereqs | Root owners |
|---|---|---|---|
| HMSTEP-01 | Qualify source and runtime contract | Baseline | TASK-001,002,003 |
| HMSTEP-02 | Approve retention/authority before ingest | 01 | TASK-007,011,015 |
| HMSTEP-03 | Deploy private service + database | 02 | TASK-015,062 |
| HMSTEP-04 | Bind real identity + bank generation | 02,03 | TASK-006,035,037 |
| HMSTEP-05 | Canonical-to-memory projection | 04 | TASK-035,036 |
| HMSTEP-06 | Bounded recall with lineage | 05 | TASK-037,038 |
| HMSTEP-07 | Correction/tombstone/purge fences | 05,06 | TASK-039,041,058 |
| HMSTEP-08 | Wire memory UX into Métis | 06 | TASK-008,029,040,044 |
| HMSTEP-09 | Connect Dust + server skills | 06,08 | TASK-038,039,043,044 |
| HMSTEP-10 | Observations/mental models/derivative cleanup | 06,07 | TASK-036,037,040,041 |
| HMSTEP-11 | Account for every memory workload | 05,06 | TASK-034,045 |
| HMSTEP-12 | Benchmark usefulness/multilingual/speed | 06,10,11 | TASK-053,054,056,060 |
| HMSTEP-13 | Exercise failure/security boundaries | 09,10,11 | TASK-057,058,062 |
| HMSTEP-14 | Migrate with scoped canaries | 08,10,12,13 | TASK-026,035,041,061 |
| HMSTEP-15 | Prove complete product journeys | 09,11,12,13,14 | TASK-055,056,063,065 |
| HMSTEP-16 | Freeze/release/operate | 15 | TASK-062,063,064,065,066 |

**Implemented-vs-open boundary (MASTER.md:5268–5274, §35.16, and confirmed by repo grep):** `memory/src/hindsight-client.mjs` + `memory/src/memory-gateway.mjs` + `memory/deploy/profile-check.mjs` + `memory/live-smoke.mjs` are real, tested (`node --test memory/tests/*.test.mjs`) **kit-side reference modules only**. OBSERVED: `grep -rl "hindsight" src/` in `/Users/<redacted-user>/AI-Brain-build/metis-2.0` → zero matches. None of HMSTEP-01 through HMSTEP-16 has begun in the product repo; `memory/EXPANSION.json:3` literally encodes this as `"status": "IMPLEMENTATION_COMPONENTS_TESTED_PRODUCT_INTEGRATION_NOT_RUN"`, and every one of the 16 HM gates and 16 HMSTEP steps in that file carries `"product_verification": "NOT_TESTED"` / `"product_status": "NOT_STARTED"`. This is the single largest net-new subsystem in this lane's scope — full server (private Postgres+pgvector service), full governed API surface, full UX, full Dust/skills wiring, full Operator pane, and full migration tooling, none of which has a single line in the actual Métis codebase yet.

### 4.9 HM-01..16 acceptance gates and HMUC-001..032 use cases (MASTER.md:5198–5252, §35.13–35.14, mirrored exactly in `memory/EXPANSION.json:4–1117` — cross-checked line-for-line, no divergence)

Full verbatim tables reproduced in MASTER.md (HM gates: 5198–5216; HMUC cases: 5219–5252) and duplicated machine-readably in the kit's `memory/EXPANSION.json`. Not re-transcribed row-by-row a second time in this report to avoid triplicating ~50 rows already available verbatim in two source files; the Opus planner should treat `memory/EXPANSION.json` as the authoritative machine-readable form of MASTER §35.12–35.14 (confirmed identical). Six HM-FLOW end-to-end journeys (Remember-and-reuse / Meeting-to-team-knowledge / Forget-under-concurrency / Honest-outage-and-limits / Security-and-privacy / Release) are at MASTER.md:5254–5266 and are the mandatory integrated-proof scripts for HMSTEP-15.

### 4.10 Source precedence (MASTER.md:5276–5362, §35.17)

14 numbered external references (HS-R01..R14) to the real Hindsight product docs (hindsight.vectorize.io) and a pinned upstream commit (`b88458fd6b96e70069238f7df5a0e2f1c3c9240c`, observed 23 Sept 2026, explicitly "not the production deployment version, image digest or security approval" — MASTER.md:5033). Closing line (MASTER.md:5362) is itself a requirement: "Apparent documentation conflicts are recorded in the source review, not silently resolved in favor of a convenient claim" — i.e. `memory/SOURCE-REVIEW.md` (not deep-read by this lane; belongs to whichever lane owns `memory/` in full) is the required conflict log, not something to paper over during implementation.

---

## 5. Cross-lane notes for the Opus planner

1. **§32/§35 are greenfield; §34 is a refactor of live code.** Effort/risk profile differs sharply: agent expansion (§32) and Hindsight memory (§35) require new server infrastructure, new client modules, and zero existing code to build on (OBSERVED: no `AgentDefinition`, `ContextBroker`, or `hindsight` reference anywhere in `src/`). Onboarding (§34/OBU) is bounded, surgical work against files that already exist and already match the spec's claimed baseline almost exactly, with one concrete outstanding item already located: retire `src/renderer/src/lib/onboarding-hero-video.ts:7`'s import of `../assets/onboarding-hero-lady-planet.mp4` (OBU-02, still not done at HEAD 2bf21f1c).

2. **Runtime evidence (E1–E9) supplied in this run's task packet does not belong to this lane's spec scope.** The crash/perf bug evidence (orphaned llama-server sidecars, capture.failed×5394, render-process-gone, SingletonLock hangs) is not addressed anywhere in MASTER §32–§35 — those sections govern agent expansion, onboarding, and memory, not process lifecycle/sidecar reaping/local-LLM cold start. The closest textual overlap is AGUC-017/018 (§1.6 above), which are about *future* multi-agent input-lease races, not the *current* single-agent freeze Tony reports. **Recommendation to the planner:** route Tony's two bug reports (heaviness; History-hang/freeze) to whichever lane owns the baseline P1/reliability TASK-IDs (outside 4401–5363), not to this AGX/HM lane — conflating them risks the AGX-16/HM-16 cross-platform E2E gates absorbing scope that belongs to a narrower, faster reliability fix.

3. **§33's collaboration contract is itself a hard requirement on how the rest of the plan gets executed**, and it directly matches the user's stated intent for this run (Opus plans, Sonnet executes, an external model audits). Two concrete constraints from §33 that the orchestrator should honor: (a) independent review must be structurally independent — the same agent that implements a slice cannot also be the reviewer of record for that slice (MASTER.md:4801); (b) `tools/dual_agent.py`'s zero exit code is explicitly disqualified as a release pass (MASTER.md:4841) — whatever audit step ChatGPT performs, its "looks good" is evidence to log, not a gate to close.

4. **The kit's own internal verification artifacts (onboarding `verification/*`, memory `tests/*.mjs`) are synthetic/offline and explicitly say so.** None of them should be cited elsewhere in the review as proof that any AGX/OBU/HM requirement is met in the real product — every one of MASTER's 16 AGX gates, 5 OBU slices, and 16 HM gates remains formally `NOT_TESTED`/`NOT_STARTED` against the actual Métis application until a lane runs the real, native, signed-artifact journeys described in §32.16, §34.8, and §35.15.

5. **Open items this lane could not resolve within its read-only scope** (flag to the planner, not fabricated here):
   - `clicky-study/CAPABILITY-ADOPTION.md` and its 48-row JSON (referenced MASTER.md:4511, 4762) were not read by this lane — out of the assigned line range and not under `memory/`, `onboarding/`, or `collaboration/`. Needed to fully close AGX-01/AGX-12/AGSTEP-01/AGSTEP-02.
   - `memory/SOURCE-REVIEW.md` and its machine-readable register (referenced MASTER.md:5033, 5276) were not deep-read; only the directory listing and `EXPANSION.json`/`BINDINGS.md` were inspected. Needed to fully close HMSTEP-01.
   - TASK-001..066 root definitions live earlier in MASTER.md, outside this lane's 4401–5363 range — every AGX/AGSTEP/OBU/HMSTEP root-task-owner reference above is a *pointer* to content this lane did not itself extract.

---

## 6. Requirement-count summary (for traceability)

- §32: 16 AGX gates, 32 AGUC use cases, 18 AGSTEP ordered slices, plus ~26 narrative sub-requirements (R32-A..AA) extracted above with line citations.
- §33: 24 narrative process requirements (R33-A..X) — no numbered ID scheme in the source; none needed inventing.
- §34: 2 top-level direction requirements + 5 OBU slices + 3 detailed sub-requirements (permission states/a11y/demo) + the full scene-integration table (8 rows) — all with source lines, plus one independently repo-verified fact-check (scene order matches HEAD) and one confirmed-still-open item (old hero video not retired).
- §35: 16 HM gates, 32 HMUC use cases, 16 HMSTEP steps, 6 HM-FLOW journeys, 14 external source refs, plus ~9 narrative sub-requirements (R35-A..H) — cross-checked against `memory/EXPANSION.json` with zero divergence found.

No requirement in MASTER.md:4401–5363 was knowingly dropped. Line-item AGUC/HMUC tables (64 rows total) were preserved by exact reference to their source lines rather than re-transcribed a second/third time, since MASTER.md and `memory/EXPANSION.json` already hold them verbatim and duplication would risk silent transcription drift.
