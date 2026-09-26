# HeyClicky → Métis: artifact-derived study

> r10 consolidation: onboarding follows MASTER §32.6/§34 and the retained Métis scene order. Any original eight-stage illustration below is historical reference, not an implementation instruction. Agent capabilities remain required.
**Basis:** the supplied `HeyClicky.dmg`, not a cloned open-source project. Read-only static extraction. No app launch, driver execution, token use, private API request or login bypass. The implementation below is an independent Métis design.

## 1. Exact artifact

Version **1.0.51 (61)**, universal x86_64/arm64, declared minimum macOS 14.2. DMG **373,328,455 bytes**. SHA-256 `0c7b2f7b21cc5153e4a3146cdeaff704a67aaf37e08bf06a0117d108edb7b038`. Internal build metadata claims `ddbd4191`; full source ancestry is unknown.

Recovered **192 regular files / 824,864,616 data-fork bytes**. **589,486,538 bytes** belong to the two-architecture CodexRuntime subtree; this is an inventory, not an installed-size or speed benchmark. Metadata and library imports identify a native Swift/SwiftUI application, not Electron. No original complete Swift source project was recovered.

## 2. Method and limits

Indexed retrieval returned no text for the DMG. A bounded read-only UDIF/HFS+ reader decompressed its HFS volume, read catalog/data forks, skipped symlinks and special unsafe HFS metadata names, and wrote non-executable analysis copies. No disk mount or installer execution occurred. The 127 available resource `hash2` entries matched their extracted file hashes. The embedded signing manifest is not an independent trust root: Apple certificate validation, notarization and resource code requirements were not verified. Original source, account-side services, policies, dynamic UI ordering and successful native execution remain unobserved. The scope is the 192 extracted regular data forks, not every extended attribute/resource fork.

**Evidence vocabulary:** PACKAGED_METADATA/BINARY_STRUCTURE proves what is packaged; BUNDLED_INSTRUCTION/SKILL/DOCUMENTATION proves a stated intended contract; COMPILED_STRING/SYMBOL identifies an intended path but not execution; MEDIA_INSPECTION is sampled presentation; VENDOR_CLAIM is outside corroboration only. Proposed Métis behavior is never silently attributed to the reference.

## 3. Source-to-Métis findings

### HC-01 — Exact inspected build

**Evidence level:** PACKAGED_METADATA. **Owners:** TASK-001, TASK-002.

HeyClicky 1.0.51, build 61; minimum macOS 14.2. Internal build plist reports short commit ddbd4191, not a verified public repository ancestry.

**Independent Métis adaptation:** Bind every comparison to this artifact; do not conflate newer vendor claims with this installation.

- path=Contents/Info.plist; sha256=0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d; key=CFBundleShortVersionString

- path=Contents/Info.plist; sha256=0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d; key=CFBundleVersion

### HC-02 — Native architecture, not recoverable original source

**Evidence level:** BINARY_STRUCTURE. **Owners:** TASK-001, TASK-029.

Universal Mach-O has x86_64 and arm64 slices and imports SwiftUI, AppKit, ScreenCaptureKit, Speech and PDFKit. No complete original Swift source project was recovered.

**Independent Métis adaptation:** Implement true native Mac parity and Windows adapters independently. Do not describe packaged instructions as full source.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1

### HC-03 — Substantial bundled execution payload

**Evidence level:** FILE_INVENTORY. **Owners:** TASK-004, TASK-023, TASK-026, TASK-043.

Recovered CodexRuntime data forks total 589,486,538 bytes; both Mac architectures are packaged, with Codex and code-mode-host binaries.

**Independent Métis adaptation:** Use the existing authorized service runner by default. Optional developer runtimes must be licensed, architecture-specific, signed and explicitly selected. Never copy this runtime or its account configuration.

- path=Contents/Resources/CodexRuntime

### HC-04 — Computer-use helper already a separate boundary

**Evidence level:** BUNDLED_INSTRUCTION. **Owners:** TASK-005, TASK-033, TASK-057.

The helper file exists, and its bundled guidance describes a supervised local MCP computer-use daemon with before/after snapshots. We did not execute it.

**Independent Métis adaptation:** Evaluate licensed upstream Cua against existing Métis adapters; keep one trusted executor, bounded helper protocol and outcome verification.

- path=Contents/Resources/ClickyBundledSkills/cua-driver/README.md; sha256=a015cb8802526ab5a512e58eb560eb5b932195e8e148cb55d580e470657705e2; lines=[13]; anchor=embedded

- path=Contents/Resources/ClickyBundledSkills/cua-driver/README.md; sha256=a015cb8802526ab5a512e58eb560eb5b932195e8e148cb55d580e470657705e2; lines=[6, 8, 20, 68, 73]; anchor=snapshot

### HC-05 — Fifteen curated runtime skill definitions

**Evidence level:** PACKAGED_TEXT. **Owners:** TASK-009, TASK-042, TASK-043.

Fifteen SKILL.md files are present for workflows, documents, developer tasks, design and computer use. Presence alone does not prove availability in an authenticated session.

**Independent Métis adaptation:** Map each useful capability to centrally governed skill versions rather than copy a second local skills platform.

- path=Contents/Resources/ClickyBundledSkills

### HC-06 — Legacy picker is not the runtime catalog

**Evidence level:** BUNDLED_DOCUMENTATION. **Owners:** TASK-001, TASK-042, TASK-044.

A bundled attribution note explicitly describes a picker whose runtime activation wiring was not included when that note was written. The current binary also ships a different curated skills directory.

**Independent Métis adaptation:** Keep catalog visibility, selection, entitlement, installation and actual execution distinct. Do not infer current absence solely from possibly stale attribution.

- path=Contents/Resources/ATTRIBUTION.md; sha256=9a72ea800fa89a20ca8475847e5f88b67af448aa548fa70008d7c66436fb74cd; lines=[12]; anchor=intentionally not included yet

### HC-07 — Persistent agent identity

**Evidence level:** BUNDLED_INSTRUCTION. **Owners:** TASK-005, TASK-042, TASK-043.

Packaged guidance gives an agent a durable name, purpose, workspace and conversational identity.

**Independent Métis adaptation:** AgentDefinition is separate from a model, skill, thread and run; enforce stable ID and version binding in code.

- path=Contents/Resources/ClickyModelInstructions.md; sha256=f5ddb338c41307b6e7bcd401d449344a94217d64db512b06467f5a24e400c145; lines=[9]; anchor=IDENTITY:

### HC-08 — Curated agent memory

**Evidence level:** BUNDLED_INSTRUCTION. **Owners:** TASK-035, TASK-039, TASK-041, TASK-043.

Guidance describes dated, compact job memory and prohibits storing secrets in it.

**Independent Métis adaptation:** Place memory in authorized canonical records with provenance, correction and deletion; preferences do not become facts or permission.

- path=Contents/Resources/ClickyModelInstructions.md; sha256=f5ddb338c41307b6e7bcd401d449344a94217d64db512b06467f5a24e400c145; lines=[10]; anchor=MEMORY:

### HC-09 — Agent-owned artifacts

**Evidence level:** BUNDLED_INSTRUCTION. **Owners:** TASK-035, TASK-043, TASK-057.

Guidance assigns new artifacts and temporary generation files to the owning workspace, with explicit export required elsewhere.

**Independent Métis adaptation:** Use tenant/principal/agent/run scoped artifact handles, safe filenames and atomic publication; verify output independently.

- path=Contents/Resources/ClickyModelInstructions.md; sha256=f5ddb338c41307b6e7bcd401d449344a94217d64db512b06467f5a24e400c145; lines=[12]; anchor=FILE OWNERSHIP:

### HC-10 — Screen content is context, not routing consent

**Evidence level:** BUNDLED_INSTRUCTION. **Owners:** TASK-005, TASK-033, TASK-037.

Seeing a connected application is not treated as a request to operate its visible UI.

**Independent Métis adaptation:** Prefer authorized structured connectors or files; distinguish Read, Teach, Draft and Act with their own permissions.

- path=Contents/Resources/ClickyModelInstructions.md; sha256=f5ddb338c41307b6e7bcd401d449344a94217d64db512b06467f5a24e400c145; lines=[19]; anchor=Screenshots and the focused app are context

### HC-11 — Full document can differ from visible screenshot

**Evidence level:** COMPILED_STRING. **Owners:** TASK-005, TASK-033, TASK-037.

The binary contains an active-document handoff instructing a higher model to use full document text rather than only the visible screenshot; folder usage copy supports that intended path.

**Independent Métis adaptation:** Implement explicit full/partial/visible-only source coverage, document revision identity and bounded retrieval; never claim universal access to app internals.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71424016; anchor=captured this document's FULL text

- path=Contents/Info.plist; sha256=0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d; key=NSDocumentsFolderUsageDescription

### HC-12 — Document extraction may time out

**Evidence level:** COMPILED_STRING. **Owners:** TASK-018, TASK-037, TASK-056.

A diagnostic string reports delegating without document context when extraction did not complete.

**Independent Métis adaptation:** Surface partial coverage; cancel late reads by run generation. Do not silently answer off-screen questions as though full text was read.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71449392; anchor=extraction didn't finish in time

### HC-13 — Minimize protected-folder prompt cascades

**Evidence level:** BUNDLED_INSTRUCTION. **Owners:** TASK-027, TASK-033, TASK-057.

Instructions discourage speculative probing across several protected personal folders.

**Independent Métis adaptation:** Ask for the exact needed source or reuse an existing scoped grant. Never scan all Desktop/Documents/Downloads to make onboarding look personalized.

- path=Contents/Resources/ClickyModelInstructions.md; sha256=f5ddb338c41307b6e7bcd401d449344a94217d64db512b06467f5a24e400c145; lines=[97]; anchor=SINGLE folder

### HC-14 — Structured schemas and write readback

**Evidence level:** BUNDLED_INSTRUCTION. **Owners:** TASK-033, TASK-039, TASK-043, TASK-045.

Packaged integration guidance requires schema fidelity and structured verification after writes.

**Independent Métis adaptation:** Extend existing connector catalog and verifier; a successful HTTP response or connector display name is not business success.

- path=Contents/Resources/ClickyModelInstructions.md; sha256=f5ddb338c41307b6e7bcd401d449344a94217d64db512b06467f5a24e400c145; lines=[30, 61]; anchor=structured read

### HC-15 — Connector session and entitlement services

**Evidence level:** COMPILED_STRING. **Owners:** TASK-006, TASK-012, TASK-014, TASK-043.

These strings identify packaged expectations of brokered integration and agent sessions; no endpoint was contacted.

**Independent Métis adaptation:** Reuse Métis Operator/Entra scoped session authority. Do not reuse HeyClicky URLs, account IDs, tokens or subscription entitlements.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71321168; anchor=/agent/composio/session

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71335952; anchor=/agent/session-token

### HC-16 — Named-agent routing and busy-session lifecycle

**Evidence level:** COMPILED_SYMBOL. **Owners:** TASK-005, TASK-019, TASK-030, TASK-043.

Agent permission rows and routine request types are present. Runtime success, arbitration and reconnect correctness remain unknown.

**Independent Métis adaptation:** Resolve explicit names/active conversation to IDs, preserve queued turns, isolate callbacks and reject ambiguous destructive routing.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=33707504; anchor=HomeSpaceAgentPermissionRow

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=33850880; anchor=CodexAgentRoutineRequest

### HC-17 — Learning-oriented onboarding steps

**Evidence level:** COMPILED_UI_TEXT. **Owners:** TASK-008, TASK-027, TASK-030, TASK-055.

The binary includes practical microphone, screen-marking and dictation steps rather than only a marketing tour.

**Independent Métis adaptation:** Teach one safe capability at a time with typed alternatives, genuine readiness checks and an exact synthetic practice surface.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71497792; anchor=First, can I hear you?

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71498288; anchor=Circle anything, ask about it

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71499680; anchor=Dictate anywhere

### HC-18 — Interview and personalized starter team

**Evidence level:** COMPILED_UI_TEXT. **Owners:** TASK-009, TASK-027, TASK-042, TASK-044.

Packaged UI/service strings describe a short interview and a suggested starter-agent plan.

**Independent Métis adaptation:** Offer at most three optional work-context questions; recommend up to three editable agents. Creation never starts execution, subscriptions or broad data discovery.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71500016; anchor=Four quick questions about you

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71496832; anchor=/onboarding/starter-plan

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71497136; anchor=suggested_agents

### HC-19 — Creation without automatic work

**Evidence level:** COMPILED_STRING. **Owners:** TASK-027, TASK-042, TASK-043.

An onboarding handoff states that a new agent exists without work having started.

**Independent Métis adaptation:** Separate create, publish, enable, enqueue and execute; replay is idempotent and never duplicates starter agents.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71454464; anchor=with no work started

### HC-20 — Interview pause and explicit abandonment

**Evidence level:** COMPILED_STRING. **Owners:** TASK-027, TASK-044.

The binary distinguishes paused interview state from abandoning creation.

**Independent Métis adaptation:** Persist minimal reviewed setup progress, resume at the unresolved step, and cancel generation when leaving. Do not create an agent from an abandoned conversation.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71421328; anchor=interview is PAUSED

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71421200; anchor=without creating one

### HC-21 — Quiet announcements during other work

**Evidence level:** COMPILED_SYMBOL. **Owners:** TASK-030, TASK-043, TASK-047, TASK-060.

A quiet-period symbol exists; exact behavior is supplemented by the versioned vendor changelog, not proven by the symbol.

**Independent Métis adaptation:** One attention manager respects calls, sharing, Focus/DND and user preferences; agent identity never triggers unrequested audio.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71380928; anchor=postOnboardingQuietPeriod

### HC-22 — Repeatable routines have lifecycle types

**Evidence level:** COMPILED_SYMBOL. **Owners:** TASK-043, TASK-045, TASK-048, TASK-062.

Wake/network observers and routine types are present; vendor documentation describes device-bound routine behavior.

**Independent Métis adaptation:** Declare service-bound versus device-bound tasks, timezone, occurrence keys, missed-run policy, budgets and bounded failures. Never run another desktop device silently.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=74920016; anchor=ClickyRoutineFullWakeObserver

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=74919968; anchor=ClickyRoutineNetworkObserver

### HC-23 — Safe dictation focus and fallback

**Evidence level:** COMPILED_STRING. **Owners:** TASK-019, TASK-033, TASK-056, TASK-057.

Diagnostics describe retaining a clipboard fallback rather than typing into a newly focused application.

**Independent Métis adaptation:** Pin exact field/window ownership, separate verbatim dictation from rewrite, request clipboard fallback, and avoid overwriting a newer clipboard revision.

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71374928; anchor=late re-capture found a field in a different app

- path=Contents/MacOS/HeyClicky; sha256=1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1; offset_decimal=71547168; anchor=outside the focused field

### HC-24 — Avoid capturing the assistant itself

**Evidence level:** BUNDLED_DOCUMENTATION. **Owners:** TASK-005, TASK-030, TASK-033, TASK-037.

A bundled developer note describes excluding its floating assistant window from screenshots.

**Independent Métis adaptation:** Capture the user-approved target before opening Métis; exclude all Métis windows; never keep resending obsolete screenshots.

- path=Contents/Resources/AGENTS.md; sha256=a7a056dd42d53aff821e0b799a3ddbd9c3a9170dbe369605da1776b4828026e8; lines=[24]; anchor=excludes it from capture filter

### HC-25 — Durable artifacts need a retrieval surface

**Evidence level:** BUNDLED_SKILL. **Owners:** TASK-035, TASK-043, TASK-044, TASK-055.

An artifact skill distinguishes finding/opening/exporting previous outputs from creating new work.

**Independent Métis adaptation:** Add per-agent result manifests and safe previews, source and output distinctions, download/open failures and exact verified locations.

- path=Contents/Resources/ClickyBundledSkills/clicky-artifacts/SKILL.md; sha256=1da2718937ce150360a80831be36205539508a53cee5570737de2b91530d64c6; lines=[3, 36, 45]; anchor=existing

### HC-26 — Memory and role do not broaden permissions

**Evidence level:** BUNDLED_INSTRUCTION. **Owners:** TASK-005, TASK-039, TASK-043, TASK-057.

Guidance explicitly separates remembering job context from external action approval.

**Independent Métis adaptation:** Permissions are runtime grants, never text in an agent role, memory note, document or skill.

- path=Contents/Resources/ClickyModelInstructions.md; sha256=f5ddb338c41307b6e7bcd401d449344a94217d64db512b06467f5a24e400c145; lines=[13]; anchor=never widen approval

### HC-27 — The source is not a blanket app license

**Evidence level:** ATTRIBUTION. **Owners:** TASK-001, TASK-042, TASK-061.

The visible MIT notice belongs to Nous Research skills, with separate attribution for Blender guidance; it does not establish that all HeyClicky application code/media is MIT.

**Independent Métis adaptation:** Independently implement behavior; review upstream licenses per adopted component. Do not redistribute this DMG, private prompts, mascot, sounds, video, fonts or service configuration in the kit.

- path=Contents/Resources/ATTRIBUTION.md; sha256=9a72ea800fa89a20ca8475847e5f88b67af448aa548fa70008d7c66436fb74cd; lines=[4]; anchor=NousResearch/hermes-agent

### HC-28 — Unsupported generation routes are explicitly excluded

**Evidence level:** BUNDLED_INSTRUCTION. **Owners:** TASK-009, TASK-042, TASK-043, TASK-045.

The installed guidance excludes some provider-backed image/video/slide generation unless exposed by the runtime, despite adjacent legacy guides.

**Independent Métis adaptation:** Keep existing Métis roadmap abilities, but every agent has a real capability manifest. A skill label cannot create an unavailable provider.

- path=Contents/Resources/ClickyModelInstructions.md; sha256=f5ddb338c41307b6e7bcd401d449344a94217d64db512b06467f5a24e400c145; lines=[23]; anchor=not part of this curated release

### HC-29 — Automatic termination is disabled

**Evidence level:** PACKAGED_METADATA. **Owners:** TASK-027, TASK-029, TASK-062.

Both metadata flags are false in this build. That is not a tested guarantee against crashes.

**Independent Métis adaptation:** Native onboarding and run lifecycle must survive windowless moments and shutdown without lying about pending remote tasks.

- path=Contents/Info.plist; sha256=0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d; key=NSSupportsAutomaticTermination

- path=Contents/Info.plist; sha256=0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d; key=NSSupportsSuddenTermination

### HC-30 — Account, telemetry and updater configuration exists

**Evidence level:** PACKAGED_METADATA. **Owners:** TASK-012, TASK-013, TASK-015, TASK-057, TASK-063.

The bundle includes backend, analytics, crash-reporting and updater configuration. The actual content retained by those services was not observed.

**Independent Métis adaptation:** Do not copy provider IDs or enable those SDKs by implication. Keep Métis metadata-only telemetry and independent signing/feed verification.

- path=Contents/Info.plist; sha256=0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d; key=WorkerBaseURL

- path=Contents/Info.plist; sha256=0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d; key=PostHogHost

- path=Contents/Info.plist; sha256=0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d; key=SentryDSN

- path=Contents/Info.plist; sha256=0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d; key=SUFeedURL

### HC-31 — Intro media is not proof of live automation

**Evidence level:** MEDIA_INSPECTION. **Owners:** TASK-027, TASK-055.

Eight sampled frames show a person speaking, not a complete executable task sequence. Audio was not transcribed.

**Independent Métis adaptation:** Produce original Métis onboarding. Keep prerecorded/demo results out of real first-value metrics and capability readiness.

- path=Contents/Resources/onboarding-intro-v2.mp4; sha256=49acf8e179457794df29de26b703faf893d7f56547fbfa543d49a4eba927dd74

### HC-32 — Compiled controls are not a live test

**Evidence level:** EXTRACTION_VALIDATION. **Owners:** TASK-001, TASK-055, TASK-063.

127 extracted resource SHA-256 values matched the packaged resource-seal manifest. This validates selected extraction bytes, not Apple signing trust, notarization, runtime safety or app behavior.

**Independent Métis adaptation:** Record exact evidence level; native acceptance must still run on real installed candidates.

- report=RESOURCE-SEAL-RESULT.json

## 4. Supplemental vendor documentation

The official changelog for 1.0.49–1.0.51 describes persistent named agents, personalized setup, source-carrying suggestions, quieter call-time notifications and repair of long-chat performance. It also says the earlier user-facing Skills feature was removed. These claims help interpret retained resources; they do not prove a live account capability or justify copying the product. The bundled legacy attribution and curated runtime skills therefore receive separate dispositions.

Source: https://www.heyclicky.com/changelog (reviewed 22 September 2026). Official homepage: https://www.heyclicky.com/ . Third-party clones and similarly named websites are not evidence for this DMG.

## 5. What not to inherit

No private API/service keys, analytics account configuration, mascots, videos, fonts, proprietary instruction text, account tokens, subscription bypass, unrestricted Always-Allow computer authority, blanket protected-folder scanning, hidden background capture, local dual-architecture agent payload, or source assertions masquerading as runtime passes. Public licensed upstream components may be separately evaluated from their proper source with license/security review. A scoped local analysis of a user-supplied binary does not establish a blanket license to distribute its contents.

## 6. Where the full design lives

MASTER §32 incorporates the onboarding/agent/context contracts. `plan/AGENT-EXPANSION.json` has 16 qualification gates, 32 additional cases and 18 ordered work slices. The interactive original Métis design is `visual/agents/index.html`; its state machine and tests are independent code, not extracted HeyClicky code. These materials extend all r8 scope.
