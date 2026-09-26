# Métis 2.0 — voice, guidance and verified computer action

**Plan addendum · 25 September 2026 · proposed implementation, not shipped software**

## Executive decision

Build the experience Tony requested inside Métis: **click a familiar control, speak a task, see what Métis is doing, interrupt it naturally, and receive a truthful spoken answer backed by the actual result.** Retain typed interaction throughout. Do not make the user open a developer terminal, select an AI model, or configure a separate assistant to perform ordinary tasks.

Use HeyClicky as a behavioral reference, not a source-code transplant. The inspected installer is 1.0.51/build 61. Its actual native host, voice/session components, agent runtime and computer-use helper support the architecture described in the companion assessment. Current vendor documentation also identifies a newer cursor-overlay regression/fix; cursor rendering is therefore an independent acceptance item, not a shortcut to claiming successful automation.

Integrate this as **20 child slices under the existing 66 root tasks**, retaining the complete revision-4.5 r11 contract, 55 base requirements, 112 base use cases, 12 golden flows, AGSTEP-01–18, OBU-01–05 and HMSTEP-01–16. Existing requirements are not reduced to this addendum's 30-capability and 36-case matrices.

**Source confidence:** this turn's authenticated GitHub main lookup returned 404. The last recorded source baseline remains historical, not current: `2bf21f1ceefe117838325342574b57852e5cadcb`, package 1.9.6. Prepared patches, earlier passing fixture tests and a user's previously failed `npm test` do not establish today's code. Stage zero verifies the actual checkout before editing.

## 1. The interaction to deliver

### Four intentions, one Métis surface

| User intention | Expected behavior | Authority boundary |
|---|---|---|
| Talk | Hear a concise answer, ask a follow-up, refer to permitted context. | No unrelated action just because a model suggests it. |
| Guide | Point to a live target, explain what to do, wait for the user when appropriate. | Guidance draws; it does not click. |
| Do | Execute the requested bounded task, show progress and verify the result. | Valid scope, stable intent, fresh target and consequence-appropriate approval. |
| Dictate | Insert the user's words into the intended permitted field. | Text insertion is not permission to submit/send or operate other apps. |

These are internal intent states, not four mandatory setup steps. Reuse the existing mic/shortcut/composer and a small visible mode indicator. A clear command such as “open my note” can route directly to a permitted action without forcing a mode-selection conversation. An ambiguous request gets one useful clarification. If a Talk interaction becomes an explicit action request, show the new scope/mode; the model cannot silently upgrade its own authority.

A normal user sees **Listening → Understanding → Working → Done / Needs you / Could not verify**. Engineering state is richer, but must not leak as a wall of technical statuses. A task card identifies the active agent, permitted app/account, next meaningful operation and Stop. Long work can continue while the user talks or types a correction. New intent must supersede old authority, not race it.

### First visible success

In an isolated development profile and dedicated test document:

> “Métis, create a note called Friday plan, add these three items, and read them back.”

Métis captures the real microphone, displays the actual transcription, resolves the qualified notes/text target, prepares a bounded plan, executes permitted operations, rereads the resulting content and speaks the verified outcome. Use a non-hard-coded title and varied content; matching a fixed “hello” demo is not general action support. For Windows, use a deliberately qualified equivalent—not a silent application substitution.

Then exercise two follow-ups: “Show me where to change that” must guide without clicking; “Stop” must revoke future action locally, including while remote inference is delayed. A failed write must produce an honest answer instead of “Done.” This proves the core loop before adding more agents or scheduled work.

**Exit evidence:** actual source/build/profile identity, live transcript, real changed target, independent readback, visible mode/pointer behavior, tested interruption and truthful completion. An HTML fixture, prerecorded animation, generated patch or draft PR is insufficient.

## 2. Architecture: logical boundaries, not a new platform

Retain Métis's current app, native helper, Operator, canonical knowledge and skills services. Add interfaces at existing boundaries instead of seven new services.

```text
                  EXISTING MÉTIS UI: mic · shortcut · composer · orb
                                      │
                         Interaction session controller
                       actor / agent / thread / mode / generation
                            ┌─────────┴───────────┐
                            │                     │
                   Audio + voice loop       Authorized context broker
                  capture → STT → speech     selection / AX or UIA /
                   playback and captions    source API / cropped screen
                            │                     │
                            └──────────┬──────────┘
                                Task coordinator
                    deterministic action OR bounded generative plan
                         + optional typed Jev/Laya decisions
                                      │
                         EXISTING POLICY / APPROVAL GATE
                       tenant + scope + target + budget + expiry
                                      │
                              Execution dispatcher
                      ┌───────────────┼───────────────────┐
                      │               │                   │
               Approved APIs    Native semantic      Authorized browser /
               and connectors     AX / UIA          foreground input
                      └───────────────┼───────────────────┘
                                 Result verifier
                                      │
                          Task events and authorized outputs
                         UI progress + truthful spoken summary
                                      │
               approved canonical outcome → governed memory, when eligible

Cross-cutting: one audio owner, one physical input lease, current identity,
revocation, cancellation, receipt journal, safe telemetry and usage accounting.
```

The fast voice path should remain responsive while the task worker performs slower work. It may say “I’m opening the note” when dispatch is valid and in progress. It cannot say “The note is saved” until the verifier has evidence. A failed or unknown result constrains spoken output as strictly as a visual success badge.

### Suggested integration points—not declarations of today's tree

Historical source names include `src/main/metis-command-runtime.ts`, `metis-command-register.ts`, `command-control.ts`, `desktop-adapters.ts`, shared command/action contracts, the main audio/speech code, `RightEdgeSidecar.tsx`, `OnboardingDemoScene.tsx`, `operator/`, `intelligence/`, and `native-app/`. Locate their current equivalents and callers first. Reuse stronger existing behavior instead of creating parallel state managers.

The renderer may request a session and display state. It must not own organizational secrets, native grants, execution locks or raw Hindsight credentials. A worker may propose typed actions; the trusted host validates them and owns side effects. Native code owns permissions, app/window identity, low-level capture and input. The server owns service credentials, entitlements, approved hosted workloads and authoritative cross-device records.

## 3. Voice that can really converse

### Keep the required route, add the missing response loop

Complete the existing qualified Cloudflare speech broker and Nova-3 transport first. Cloudflare documents real-time Nova-3 availability; the actual account, route, model configuration, languages, privacy and latency still need Métis qualification. [REF-06]

For the response side, add a provider-neutral streaming TTS adapter. A Cloudflare-hosted voice is a sensible first candidate if it meets the required language, privacy and interruption profiles. Do not hard-code the model strings discovered inside HeyClicky. Treat native speech-to-speech as another explicitly approved route, not a way to bypass the mandated STT transcript/authority contract.

Cloudflare's experimental voice package supports a shared conversation pipeline, but its documented example persists messages in SQLite. Evaluate it behind the existing broker; do not adopt that persistence default into Métis's no-unapproved-content-storage path. [REF-07] An optional OpenAI realtime route has explicit client playback/truncation responsibilities over WebSocket; hiding those responsibilities behind a library does not remove them. [REF-08]

### Required audio behavior

The trusted audio owner manages explicit microphone consent, selected device, requested tracks, gain/resampling, echo cancellation, voice activity, speech endpointing and backpressure. Meeting capture, dictation and command interpretation may share permitted capture infrastructure but remain different consumers with different authority. Never open a second hidden microphone session to work around lifecycle bugs.

Keep input, transcript and output identities separate: audio capture generation; utterance/segment/revision; stable command intent; output response/playback position; action task/step/attempt. Bind all callbacks to their generation. Reconnecting a stream must not duplicate already-finalized input or authorize a stopped task.

During barge-in, stop local playback immediately, cancel the superseded synthesis/generation, discard queued audio and track what the user actually heard. Preserve correct conversational history without replaying an executed action. Echo from Métis's own voice and meeting participants must not trigger authority. A visible Stop button and keyboard stop work even when cloud speech recognition is unavailable.

A provider outage produces a usable text path and an honest voice-unavailable state. An optional installed local engine is not automatically selected; explicit existing offline choices and enterprise policy govern fallback. No silent recording or upload is inferred from a selected engine preference.

## 4. Reliable context and computer control

### Observe the right thing

A context request starts with an explicit target: active application/window, selected document/region, selected agent context or connected account. Use the minimum necessary evidence in this order when applicable: explicit selected content; supported structured app/document APIs; native accessibility information; approved browser DOM; and a fresh screenshot crop for missing visual facts. A visible screenshot is not the full document, and a saved file is not necessarily the current unsaved buffer.

Bind every observation to PID/window or browser target, source/document revision, display coordinate transform, capture time, requested scope and coverage. Protected fields and unrelated private windows are excluded. No continuous whole-desktop stream merely because the app is open. During a permitted automation session, re-observe when the target changes or verification requires it, rather than uploading screenshots on an arbitrary high-frequency timer.

### Choose the right action mechanism

| Route | Preferred use | Requirements |
|---|---|---|
| Connector/API | Account data and reliable structured operations. | Correct OAuth principal/audience, versioned tool schema and action-specific authorization. |
| Native semantic action | Press, set a value, select a menu or scroll a supported UI control. | Fresh AX/UIA target, allowed app/window and result readback. |
| Approved browser route | A selected tab/window or task browser with explicit account/profile scope. | Real browser lifecycle, DOM freshness, origin checks and mutation limits. |
| Foreground pointer/keyboard | Custom controls or applications where safer semantic routes are unavailable. | Visible authorized mode, one input owner, fresh coordinates and bounded recovery. |

Do not use a connector failure as permission to enter a signed-in browser. Do not let “execute JavaScript” or an arbitrary shell become a general escape hatch. Terminal work, where the owner explicitly requests development, belongs to a separate reviewed capability with workspace, command, network and credential boundaries.

Apple exposes application-scoped accessibility and ScreenCaptureKit filtering APIs; Windows offers UI Automation and input APIs. Those are building blocks, not universal app coverage. Windows `SendInput` is constrained by integrity/UIPI, and its dispatch result does not prove the application changed. Never bypass UAC, secure desktops, protected fields or permission dialogs. [REF-09–REF-12]

### Use or build the driver deliberately

First inspect the existing Métis native helper/adapters. Compare a pinned upstream Cua Driver against concrete missing operations, per-platform tests, license/SBOM, signing, update, private-API use, size and crash behavior. Adopt the smallest useful component when it actually reduces risk and effort. Keep its public interface behind Métis's grant boundary, use a bounded capability manifest, and avoid an unrestricted local MCP endpoint. The upstream documents both agent-facing MCP and application-facing native integration; availability of an interface does not qualify its behavior on both operating systems. [REF-05]

The native Mac and Windows adapter implementations can differ while conforming to one action contract. A foreground-only capability must say so. Do not promise invisible background operation for every app or rely on undocumented focus tricks as a platform guarantee.

### Observe → prepare → authorize → act → verify

For each step:

1. Resolve a stable intent and fresh permitted observation.
2. Prepare a typed action with exact arguments, target token, expected postcondition and budget.
3. Check current identity, scope, policy epoch, task generation, grant lifetime and any critical-action approval.
4. Acquire the required resource/input lease; revalidate immediately before dispatch.
5. Dispatch once with a logical operation ID and distinct attempt ID.
6. Verify through a new application read, API result with appropriate semantics, or observed native state.
7. Publish the truthful result; choose the next step only from current evidence.

Retries are bounded. A timeout after an external effect is **unknown**, not automatically failed and safe to repeat. Read back or request intervention before another create/send/payment. Store a content-minimized action journal and idempotency keys. On restart, reconcile unfinished operations; do not replay screen clicks from a stale snapshot.

## 5. The visible mouse without the associated problems

Tony explicitly wants to see what is happening. Keep that capability, but distinguish its meaning.

**Guide pointer:** a Métis-colored outline/beam/ghost cursor anchored to a target. It is presentation only, with a label that it is guidance. It must not steal focus, input or permission-dialog appearance.

**Foreground execution:** when the operation actually requires pointer or keyboard injection, show the current app/task and real action target. Respect the human's mouse. Physical movement, clicks or typing trigger the defined takeover behavior. Agent-generated events must be identifiable so they do not falsely trigger their own cancellation.

**Background execution:** when a supported native semantic or API action does not move the pointer, do not animate a fake mouse to imply it did. Show a small progress card or target outline when useful. Give a visible “working in background” indication and a result the user can open.

Coordinate correctness includes negative display origins, mixed scaling, rotation, fullscreen/Spaces, moving/minimized windows, browser zoom, external monitors, remote desktop and monitor removal. A target that cannot be reliably mapped cannot be clicked. Inactive or hidden overlays do zero frame work; motion is never on the authorization critical path.

Screen-capture safety is a full native test lane: OS window screenshots, whole-display capture, actual single-window call sharing and screen recordings. Verify exclusions, occlusion, click-through and accessibility across overlay modes. Never label a black or covered capture as privacy protection. Suppress private overlays and unprompted speech during calls/sharing according to policy; the user's explicit request still needs a correct audience and playback path.

## 6. Autonomy without repetitive confirmation

The goal is not a permission prompt before every click. Use task-scoped grants based on the user's explicit request and current enterprise policy.

| Consequence | Proposed experience |
|---|---|
| Explain/read within already authorized scope | Proceed and show source/scope when relevant. |
| Reversible local task specifically requested | Brief intent preview where useful, then execute the bounded steps without repeated prompts. |
| New app/account/profile scope or ambiguous target | Ask once for the missing specific scope/selection. |
| Send, publish, delete, purchase, change access, or otherwise consequential operation | Bind approval to exact target/payload and policy; changed arguments invalidate it. |
| Secure desktop, forbidden data/action or unavailable platform capability | Refuse that operation with an honest supported alternative, not a bypass. |

OS Accessibility permission is not a global application-level grant. A grant is limited by actor, tenant, device, agent/thread/task, capability/resource, expiry, policy epoch and revocation. Reusing an approval across unrelated agents is disallowed. Normal conversational correction cannot silently become a wider grant. Persistent routine authority is separately reviewed; it is not inherited from a one-time interactive session.

A natural “yes” can confirm a single currently presented, unexpired proposal when the trusted input/context is unambiguous and policy permits voice confirmation. Otherwise show the exact operation and require clarification. Untrusted documents, webpages, emails and tool output are data—not instructions that can create new grants.

## 7. Agents, models, skills and memory have different jobs

The named agent is a stable product identity with its own permitted context, threads, artifacts and job. The model is a replaceable reasoning component; a skill is a reviewed procedure; a runtime executes; a policy gate authorizes; a verifier establishes outcomes. Changing a name or model must not change identity or broaden rights.

Use a generative model for explanations, multi-step decomposition and useful speech. Keep deterministic fast paths for simple exact actions. Use Jev and Laya only for genuinely typed candidate decisions and apply their validated results through the current policy layer. Their confidence or selection is not permission. These projects describe typed decision systems, not substitutes for the full conversational/planning stack. [REF-13–REF-14]

Named agents may research or create independent artifacts concurrently, within cost and privacy limits. They cannot each own a physical cursor. One desktop-input broker schedules mutually exclusive input work. Follow-ups resolve the exact selected agent/task/proposal; “do it” with several pending proposals must not act on a guessed thread.

Central skills should support real research, documents, spreadsheets, PDFs, app workflows and explicitly authorized development. Validate actual outputs—formulas, file structure, target data and executable code where applicable—not just filenames. Preview results in existing Métis surfaces; durable artifacts have owners, revisions and provenance. A training or “show me once” interaction produces a reviewed skill draft, not an unreviewed replay of arbitrary clicks. Recorded instruction teaching is optional owner scope, not a claimed shipped HeyClicky feature.

### Hindsight belongs behind canonical authority

Use existing Entra and server-side resource authorization to derive eligible memory scope. Keep stable agent/user identities independent from display names. Do not expose raw bank IDs as access tokens, bundle a database/model server into the desktop, or ask staff for another memory-service login.

Eligible inputs are approved canonical summaries, explicit preferences and verified outcomes. Raw capture, secrets, unapproved transcripts, hidden app data and temporary task buffers do not become memories by default. Keep the original source and current revision/ACL lineage; memory cannot grant tools or revive expired approvals. Hindsight provides memory APIs, not Métis's policy enforcement. [REF-15–REF-17]

Implement actual runtime bindings, a durable outbox/reconciliation path, current-principal authorization before inference, and a final authorization/generation check before releasing results. Forget/revocation tombstones block reads immediately; upstream facts, derived summaries, caches, exports and in-flight jobs must converge on deletion. Use the existing why-used/source/correct/forget UI. A reference-memory unit suite is not this end-to-end binding.

Do not make simple actions wait for memory. Retrieve only when the task benefits and policy allows it. Memory failure should yield “memory unavailable” while eligible standalone actions remain usable. Meter preprocessing, retain, recall, reflect and storage separately; unknown quantities remain unknown.

## 8. Physical deployment and footprint

The minimal topology is the existing Métis client plus its trusted platform helper, the existing authenticated Operator/service layer, and an approved Hindsight service behind canonical access. A task worker can be a supervised local optional runtime or an existing qualified hosted executor. It must not require every end user to install Codex or Claude and run Terminal commands.

Keep server credentials out of desktop distributions. Short-lived scoped session material belongs behind the established broker and appropriate secure storage. Authentication to an account does not prove the service is ready: real permission/health checks determine status. Protect localhost/native IPC through owner identity, nonce/capability binding and restricted endpoints; another local process must not drive the helper just by knowing a port.

Do not add the inspected 589.5 MB dual-architecture Codex tree to every Métis installation. The old contract's proposed budgets remain: Windows compressed cloud-first core ≤250 MB and steady core footprint ≤650 MB; native Mac distribution ≤100 MB where feasible, excluding OS-managed models. They are targets requiring measured exceptions, not promises. Account for runtime downloads, caches, temporary install duplication and helper binaries—not only the main archive.

Continue the real native Mac foundation in parallel with the supported Windows release lane. Keep current Mac Electron users stable until an explicitly qualified migration. Native Apple inference/PCC requires actual SDK entitlement/capability qualification; it is not assumed available. One platform's missing signing input does not create evidence for the other or justify bypassing its release requirements.

## 9. Delivery milestones and existing task mapping

Detailed ownership, prerequisites and acceptance are in `BACKLOG.json`/`.md`. These are child integration slices, not new infrastructure services.

| Milestone | Visible outcome | Child slices | Existing roots most directly involved |
|---|---|---|---|
| A — Reconcile and unblock | Actual checkout/test failure understood; no overwritten work. | CXSTEP-01–02 | 001–006, 015, 033 |
| B — Real first loop | Click → actual speech → safe native action → verified spoken result, with Stop. | Core portions of 03, 04, 06–08 | 011–020, 028–030, 033, 053, 056 |
| C — Show and steer | Guide pointer, safe foreground/background modes, barge-in, human takeover and dictation. | 05, 07, 10 | 019, 028–030, 033, 056, 058 |
| D — Useful multi-step work | Reliable multi-app tasks, contextual follow-ups, named agents, connectors and real files. | 09, 11–12 | 009, 031–044, 056 |
| E — Governed continuity | Approved memory, explicit routines, accurate usage and meeting-safe behavior. | 13–14, 16–17 | 006–007, 034–058, 062 |
| F — Integrated product | Existing onboarding teaches real behavior; lean/native packages preserve user choices. | 15, 18 | 021–030, 059–061, 065 |
| G — Full upgrade qualification | All original and new gates reconciled on exact artifacts and services. | 19–20 | 053–066, plus every inherited prerequisite |

An early typed or local-only development slice is useful when a service is unavailable, but does not close live speech acceptance. Focused tests run after each slice; full relevant suites run at integration checkpoints. Milestone B should not wait for memory, routines, marketing features or a native rewrite. Milestone G must not be declared complete merely because B works.

### Actual source reconciliation before edits

Expected workspace: `/Users/tony/metis-r11-work/repo`. Read actual branch/HEAD/status, repository instructions, current package scripts, deploy identities, prior prepared-patch manifests and the newest test logs. Older report: 16-file patch applied, verification stopped at `npm test`; v2 playback repair and onboarding controls were later supplied but not confirmed applied here.

Classify each intended change as already present, absent, partial, superseded, conflicting or unverified. Do not blindly reapply patches or run the old fixed-scope bridge publisher after adding new files. Preserve all staged/unstaged ownership, encryption material, installed data and active workers. Resolve #196/#197/#194/#200 by current code/evidence, not historical titles.

### Concrete worker allocation

Use actual available subagents only. Keep one integration owner for shared contracts, schemas, migrations, provider policy and release integration. Once those contracts are stable, parallelize a voice worker, a native-action worker and an experience/context worker. Memory/Operator work can proceed independently once its interfaces are stable. Have a separate reviewer examine exact resulting diffs and adversarial tests.

Workers have explicit task IDs, base SHA plus prerequisite diff, exclusive files/worktrees, test ownership and concise evidence receipts. Do not count named roles as spawned workers. Do not share live profiles, ports or writable generated artifacts. An unavailable independent reviewer remains an outstanding gate; it is not a reason to fabricate approval or to stop all safe implementation.

## 10. Performance and cost acceptance

Preserve these existing r11 proposed targets rather than inventing new “instant” claims:

| Path | Existing target and qualification boundary |
|---|---|
| Wake event → first visible command frame | p95 ≤150 ms, local detector event to paint. |
| Local Stop → authority revoked | p95 ≤100 ms; no claim of reversing a committed effect. |
| Speech interval end → relevant partial | p95 ≤700 ms with aligned audio offsets and language/fidelity evidence. |
| Complete command end → stable final intent input | p95 ≤1,000 ms on the qualified healthy profile. |
| Stable simple command → dispatch | p95 ≤1.2 s, ready target/adapter, no new consent. |
| Warm supported open/focus → verified result | p95 ≤2 s after stable command; cold launch measured separately. |
| Cached local navigation | p95 ≤100 ms. |

**New proposed speech-output target:** after an eligible short response becomes available, local synthesis/playback should begin promptly; benchmark end-of-user-turn to first audible response at p50/p95/p99 and propose a profile-specific budget before release. Do not subtract away STT/planning time or use a canned acknowledgment as the final answer metric. Local Stop should also flush queued playback, measured separately from authorization revocation.

Measure real app performance with the agreed device/network/language profiles and slow/failure denominators. Keep animation, recording, STT revision, planner, policy, decision, native dispatch, verification, synthesis and playback spans distinct. Do not subtract unsynchronized clocks across machines. Québec French, English, Spanish and Brazilian Portuguese are qualified separately with critical-word errors and editing burden.

Account for speech duration and tracks, TTS quantity where available, planner input/output, decisions, tool costs, memory stages and compute/storage. Use the actual provider accounting basis; zero is different from missing. Distinguish a logical task from retries and other billable attempts. Implement durable settlement/reconciliation, then show complete aggregate queries—not only the current page of detail rows.

## 11. Security, privacy and failure acceptance

The 36 additional cases in `ACCEPTANCE-MATRIX.json` are all NOT_RUN. They complement, not replace, the original 112 cases, 12 golden flows and expansion cases.

Must-pass categories include: real arbitrary-content action; guide-only no-input; action handover; stale target/snapshot; multiple monitors; OS screenshot and single-window sharing; dictation/clipboard races; meeting/own-TTS isolation; exact critical-action approval; malicious page instructions; concurrent agents; unknown side effects; crashes/restarts; wrong identity/audience; provider outage; durable artifacts; source-linked remember/correct/forget; routines after sleep; real usage reconciliation; fresh/upgrade consent; native platform qualification; and signing/rollback.

“Zero unsafe actions in the declared negative suite” is evidence about that suite, not a proof of universal safety. Every test records source/artifact identity, platform/device, provider/service revision, expected versus observed result and sanitized evidence. Missing/blocked tests stay NOT_RUN/BLOCKED; mock and native passes have different labels.

The final version must preserve human-readable recovery: what happened, whether an effect committed, what remains uncertain, and what the user can do next. No infinite spinner, repeated credit-consuming retry, or fake connected/ready state.

## 12. Definition of done and implementation boundaries

The first success is done when the actual development app performs the complete spoken, visible, interruptible and verified loop. The interaction upgrade is done when the supported capability matrix passes all its native/live/privacy/quality gates. The full 2.0 upgrade is done only when every inherited root/expansion requirement and platform release gate is accounted for with current evidence and approved scope decisions.

Repository work and testing do not authorize public releases, paid service provisioning, destructive account/data operations, or replacement of Tony's installed app. Prepare those steps with exact scope and obtain the relevant approval. Do not ask for tokens in chat or bypass code signing/tenant controls.

This package contributes analysis, contracts, backlog and tests to implement. **No Métis application code was changed, no subagents were launched, and no native/live-service acceptance was executed by producing this plan.**

## References

Static observations: `HEYCLICKY-TECHNICAL-ASSESSMENT.md`, `evidence/static-assessment.json` and resource-seal comparison. Existing obligations: supplied r11 MASTER revision 4.5, SHA-256 `e5b3c51d6d8423b5aadd1801d8fc2a77131c5ca3a363d281f1deb0da7acb1350`, registry and expansion files. External primary sources: REF-01–REF-17 in `evidence/REFERENCES.md`.
