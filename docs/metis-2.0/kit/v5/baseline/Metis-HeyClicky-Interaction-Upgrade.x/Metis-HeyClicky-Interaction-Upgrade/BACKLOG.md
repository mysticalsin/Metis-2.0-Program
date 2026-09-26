# Integration backlog

Twenty dependency-ordered child slices, under the original 66 roots. Original prerequisites and gate bodies remain authoritative. Nothing is implemented or closed by this document.

## CXSTEP-01 — Establish current source and reconcile the feature evidence

**Lane:** Baseline. **Parents:** TASK-001, TASK-002, TASK-003, TASK-004. **Depends on children:** none.

Inspect actual HEAD, staged/unstaged ownership, runtime pins, deployed identities and the latest test logs. Compare both prepared deltas by behavior. Inventory available actions without trusting a green settings label.

**Acceptance:** (1) A preserved before-state ties each patch to current files. (2) Actual failing tests are classified and reproduced; no reset or blind patch replay. (3) Every parity item is labeled static, documented, verified locally, missing, or unknown.

**Existing expansions:** AGSTEP-01

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-02 — Define one interaction session and revocable action authority

**Lane:** Contracts. **Parents:** TASK-005, TASK-006, TASK-015, TASK-033. **Depends on children:** CXSTEP-01.

Extend existing contracts with mode, exact target/snapshot, actor/agent/thread, policy epoch, stable intent, operation/attempt IDs and local generation. The trusted host—not the UI or model—owns grants and execution.

**Acceptance:** (1) Cross-surface TypeScript/Swift fixtures agree. (2) Guide and Dictate cannot escalate into general Act authority. (3) Stop, sign-out, owner replacement and policy expiry reject all late input.

**Existing expansions:** AGSTEP-02, AGSTEP-11

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-03 — Complete click-to-talk and interruptible spoken replies

**Lane:** Voice. **Parents:** TASK-011, TASK-012, TASK-013, TASK-014, TASK-016, TASK-017, TASK-018, TASK-019, TASK-020, TASK-030, TASK-053. **Depends on children:** CXSTEP-02.

Wire the existing microphone owner to the qualified Cloudflare speech session and streaming TTS. Add endpointing, echo control, mute, headset changes, playback positions and truthful speech progress.

**Acceptance:** (1) Real microphone audio produces real captions and an audible reply; no stored demonstration. (2) Barge-in flushes unplayed speech and invalidates superseded generation without inventing action rollback. (3) Meeting audio and Métis playback never become authorized commands.

**Existing expansions:** AGSTEP-02, AGSTEP-09

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-04 — Bind context to the selected window, field and source

**Lane:** Context. **Parents:** TASK-005, TASK-007, TASK-033, TASK-037. **Depends on children:** CXSTEP-02.

Create a least-scope context snapshot from explicit selection, AX/UIA, authorized browser or document source, and a fresh cropped screenshot when needed. Track visible versus complete document coverage.

**Acceptance:** (1) Changing PID/window/tab/field invalidates the old target. (2) Password fields, hidden unrelated windows and inaccessible documents are excluded. (3) Full-document claims require complete authorized source retrieval, not a screenshot.

**Existing expansions:** AGSTEP-03

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-05 — Add non-controlling screen guidance and optional agent pointer

**Lane:** Guidance. **Parents:** TASK-028, TASK-029, TASK-030, TASK-033, TASK-056. **Depends on children:** CXSTEP-04.

Render Métis-branded highlights, arrows, explanations and an optional ghost pointer from the same observation coordinates. Keep presentation separate from native input.

**Acceptance:** (1) Guidance causes zero input side effects. (2) Multi-display/scale/fullscreen/remote-desktop coordinates and 200% text are verified. (3) No overlay contaminates screenshots, blocks clicks or breaks single-window sharing.

**Existing expansions:** AGSTEP-04, AGSTEP-07

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-06 — Prove typed native action and independent readback

**Lane:** Actions. **Parents:** TASK-005, TASK-029, TASK-033, TASK-056. **Depends on children:** CXSTEP-04.

Extend existing adapters first. Evaluate a pinned, licensed Cua Driver component behind the existing host policy boundary only if it reduces genuine gaps. Implement a real non-demo note/text action on supported Mac and Windows targets.

**Acceptance:** (1) A user-selected arbitrary allowed title/content is written and independently read back. (2) Native dispatch acknowledgement alone never produces verified success. (3) Missing apps, secure desktops, denied permissions and unsupported controls fail accurately.

**Existing expansions:** AGSTEP-11

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-07 — Own foreground input, interruption and recovery

**Lane:** Actions. **Parents:** TASK-017, TASK-019, TASK-028, TASK-033, TASK-058. **Depends on children:** CXSTEP-06.

Implement one exclusive physical input lease; distinguish background semantic actions from foreground pointer work. Tag own input, detect human takeover, bound retries and keep a content-safe action journal.

**Acceptance:** (1) Two tasks cannot drive the desktop simultaneously. (2) Human takeover/Stop ends new dispatch within the local budget. (3) Unknown external side effects are reconciled rather than blindly replayed.

**Existing expansions:** AGSTEP-11, AGSTEP-17

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-08 — Unify buttons, voice, text and the visible task card

**Lane:** Experience. **Parents:** TASK-008, TASK-028, TASK-030, TASK-044. **Depends on children:** CXSTEP-02.

Wire current Métis bar/orbs/task cards to the same session controller. Expose Talk/Guide/Do/Dictate without another onboarding wizard. Always show real listening, scope, progress, stop and outcome states.

**Acceptance:** (1) Button, shortcut and typed entry reach the same scoped execution path. (2) No duplicate microphone or command sessions appear on repeated clicks. (3) Task controls and focus work with keyboard, IME and compact layouts.

**Existing expansions:** AGSTEP-07, AGSTEP-09

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-09 — Execute bounded multi-step plans and qualified decisions

**Lane:** Planning. **Parents:** TASK-009, TASK-031, TASK-032, TASK-033, TASK-043, TASK-056. **Depends on children:** CXSTEP-03, CXSTEP-06, CXSTEP-07, CXSTEP-08.

Use an approved generative planner for decomposition and language; Jev/Laya only for genuine typed candidate decisions. Validate each step, observe fresh state and verify the effect before continuing.

**Acceptance:** (1) A live two-app task completes with route and step evidence. (2) Correction, target movement, provider outage and changed intent cancel or replan safely. (3) A model cannot approve itself or generate unrestricted terminal commands.

**Existing expansions:** AGSTEP-09, AGSTEP-10, AGSTEP-11

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-10 — Deliver safe dictation into the exact intended field

**Lane:** Dictation. **Parents:** TASK-019, TASK-030, TASK-033, TASK-053, TASK-056. **Depends on children:** CXSTEP-03, CXSTEP-04, CXSTEP-07, CXSTEP-08.

Preserve verbatim text by default, bind insertion to the original field and document revision, implement opt-in rewrite as a separate proposal, and handle clipboard ownership safely.

**Acceptance:** (1) Québec French, English, Spanish and Brazilian Portuguese fixtures retain names, negation and punctuation. (2) Focus change, protected field, selection change or new clipboard owner prevents stale insertion. (3) Dictation never submits/sends a form unless separately requested and allowed.

**Existing expansions:** AGSTEP-04

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-11 — Connect named agents to shared execution and isolated context

**Lane:** Agents. **Parents:** TASK-009, TASK-028, TASK-030, TASK-035, TASK-042, TASK-043, TASK-044. **Depends on children:** CXSTEP-08, CXSTEP-09.

Reuse the named-agent registry, stable agent IDs, orbs, threads and artifact storage. Parallel background work is allowed within policy, but all desktop execution shares the native lease.

**Acceptance:** (1) Creating/renaming an agent does not execute a task or change identity. (2) Follow-up audio and “do it” resolve an exact agent/proposal or ask for clarification. (3) Concurrent agent histories, outputs and grants remain isolated.

**Existing expansions:** AGSTEP-06, AGSTEP-07, AGSTEP-08, AGSTEP-10

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-12 — Qualify connectors, skills and useful output artifacts

**Lane:** Skills and apps. **Parents:** TASK-006, TASK-009, TASK-033, TASK-035, TASK-038, TASK-039, TASK-042, TASK-043, TASK-044. **Depends on children:** CXSTEP-09, CXSTEP-11.

Prefer permitted structured APIs for account work. Preserve exact OAuth identity/audience, tool schemas, versioned skill manifests, sandboxed artifact generation, atomic saves and visible previews.

**Acceptance:** (1) Private connector failure never silently becomes broad browser access. (2) A real document/spreadsheet/code artifact opens and validates in its actual target. (3) Send/delete/publish/spend require exact policy-appropriate approval; normal safe steps do not ask repeatedly.

**Existing expansions:** AGSTEP-10, AGSTEP-12, AGSTEP-13

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-13 — Bind approved outcomes and preferences to governed Hindsight

**Lane:** Memory. **Parents:** TASK-006, TASK-007, TASK-035, TASK-036, TASK-037, TASK-038, TASK-039, TASK-040, TASK-041, TASK-043, TASK-045, TASK-057, TASK-058. **Depends on children:** CXSTEP-11, CXSTEP-12.

Wire the real canonical and Hindsight service bindings, retain approved inputs, show why-used/source/correct/forget in existing surfaces, and fence all recall/reflect/export paths by current authorization.

**Acceptance:** (1) Later-session recall cites a current authorized source; a bank ID is never accepted as client authority. (2) Forget/revocation invalidates reads immediately and reconciles derivative deletion across replicas. (3) Simple exact actions work without compulsory memory requests; outage remains visible.

**Existing expansions:** AGSTEP-08, HMSTEP-01, HMSTEP-02, HMSTEP-03, HMSTEP-04, HMSTEP-05, HMSTEP-06, HMSTEP-07, HMSTEP-08, HMSTEP-09, HMSTEP-10, HMSTEP-11, HMSTEP-12, HMSTEP-13, HMSTEP-14, HMSTEP-15, HMSTEP-16

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-14 — Make suggestions and routines explicit and durable

**Lane:** Routines. **Parents:** TASK-043, TASK-047, TASK-048, TASK-062. **Depends on children:** CXSTEP-11, CXSTEP-12.

Suggestions are read-only until accepted. Scheduled tasks carry separate narrow capabilities, scope and expiry; resume/catch-up does not duplicate actions after sleep or network loss.

**Acceptance:** (1) Creating a routine is an explicit request, not inferred from a task. (2) A foreground routine cannot steal a busy desktop; the user sees a queued state. (3) Expired grants, absent devices and failures back off without hidden recurring spend.

**Existing expansions:** AGSTEP-14

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-15 — Integrate the first success into existing Métis onboarding

**Lane:** Onboarding. **Parents:** TASK-008, TASK-019, TASK-027, TASK-028, TASK-030, TASK-056. **Depends on children:** CXSTEP-03, CXSTEP-05, CXSTEP-06, CXSTEP-08.

Preserve Welcome→Problem→Reveal→Appearance→Setup→Personalization→optional License→Ready. Reconcile previous playback fixes. Use Tony-only approved media or complete text fallback and present truthful permission/readiness.

**Acceptance:** (1) A fresh user reaches a real click-speak-action-reply task; no prerecorded success. (2) Next/Back/Pause/Replay/reduced motion and text-only paths cannot be blocked by optional media. (3) Old screenshot/media URLs and fake presenter dependencies are retired together.

**Existing expansions:** AGSTEP-05, AGSTEP-16

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-16 — Reconcile session privacy, permissions and actual consumption

**Lane:** Operator. **Parents:** TASK-006, TASK-011, TASK-013, TASK-014, TASK-015, TASK-034, TASK-045, TASK-057, TASK-058, TASK-062. **Depends on children:** CXSTEP-02, CXSTEP-03, CXSTEP-09.

Tie operations, paid attempts, speech duration, decision calls, tool/model usage and optional memory to the existing authoritative ledger. Keep operational metadata separate from user content.

**Acceptance:** (1) Failed/retried/cancelled work is correctly attributed once, with unknown counters still unknown. (2) Content-free telemetry, exports and gateway readback are qualified on the deployed route. (3) Grant expiry/tenant switch/sign-out stop future processing across all selected providers.

**Existing expansions:** AGSTEP-12, AGSTEP-15

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-17 — Reconcile live meetings, voice output and audience boundaries

**Lane:** Meetings. **Parents:** TASK-010, TASK-017, TASK-019, TASK-046, TASK-047, TASK-048, TASK-049, TASK-050, TASK-051, TASK-052, TASK-055, TASK-058. **Depends on children:** CXSTEP-03, CXSTEP-11, CXSTEP-16.

Keep the full Teams lane. Add command-channel/meeting-channel separation, audience-aware summaries, explicit enrollment and actual admission, and quiet speech/overlay behavior while sharing.

**Acceptance:** (1) A meeting participant saying “send it” never authorizes a desktop action. (2) Private task results are not spoken into calls or projected to the wrong audience. (3) Remote bot-stop and local stop have separate truthful acknowledgements.

**Existing expansions:** AGSTEP-12, AGSTEP-14, AGSTEP-16

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-18 — Package lean clients and complete native platform behavior

**Lane:** Platforms. **Parents:** TASK-004, TASK-021, TASK-022, TASK-023, TASK-024, TASK-025, TASK-026, TASK-029, TASK-059, TASK-060, TASK-061, TASK-065. **Depends on children:** CXSTEP-06, CXSTEP-07, CXSTEP-08.

Keep optional models/runtime packs separate. Extend actual Swift/SwiftUI code and Windows adapters behind common contracts. Review helper signatures, APIs, capabilities and architecture-specific sizes.

**Acceptance:** (1) No mandatory duplicate-architecture Codex bundle is introduced to the cloud-first core. (2) Fresh and upgraded installed packages preserve explicit offline choices and live profiles. (3) Native Mac is actual native implementation; Windows UAC/signing is never bypassed.

**Existing expansions:** AGSTEP-17

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-19 — Run full behavior, abuse, accessibility and performance qualification

**Lane:** Verification. **Parents:** TASK-020, TASK-053, TASK-054, TASK-055, TASK-056, TASK-057, TASK-058, TASK-059, TASK-060, TASK-061, TASK-063. **Depends on children:** CXSTEP-05, CXSTEP-07, CXSTEP-09, CXSTEP-10, CXSTEP-11, CXSTEP-12, CXSTEP-13, CXSTEP-14, CXSTEP-15, CXSTEP-16, CXSTEP-17, CXSTEP-18.

Run the native/app/service test matrix on exact source and artifacts. Retain all original golden flows and add interaction cases; independently review executable changes and failures.

**Acceptance:** (1) Every acceptance case records platform/build/route/outcome and linked evidence, including NOT_RUN. (2) All source gates, generated artifacts, profile migrations and signed-runtime inventories are current. (3) A visible first-success demo does not substitute for full plan acceptance.

**Existing expansions:** AGSTEP-16, AGSTEP-17

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.

## CXSTEP-20 — Converge the full r11 upgrade and prepare separate releases

**Lane:** Release. **Parents:** TASK-002, TASK-062, TASK-063, TASK-064, TASK-065, TASK-066. **Depends on children:** CXSTEP-19.

Reconcile all 66 root task states plus existing expansions. Freeze one candidate family; qualify signed Windows distribution and native Mac independently; prepare rollback and exact remaining external approvals.

**Acceptance:** (1) No inherited requirement is silently dropped or marked complete by this addendum. (2) Windows public release waits for its real signing/native/service gates and owner approval. (3) Native Mac QA and Apple distribution status remain explicit; no fake all-platform completion.

**Existing expansions:** AGSTEP-18

**Current source/runtime status:** NOT_ASSESSED / NOT_RUN.
