# How Métis must behave

Version 4 · 25 September 2026 · normative product requirement, not a shipped-feature claim

## The experience

**Métis keeps taking notes. Toggle it from the keyboard to ask, guide or act. See verified work. Return to your meeting without losing the notes.**

Métis remains the note-taker and meeting copilot. HeyClicky-inspired behavior is additive. Read `../keyboard-notes/PRODUCT-CORRECTION.md`: it defines the first-class global visibility toggle, separate command-voice toggle, preserved meeting controls and required combined-product proof. Existing shortcut assignments must be recovered and preserved, not guessed. Clicking stays an alternative, not the required entry.

A member of staff must not open Terminal, install a coding agent, choose a model, or configure a second assistant for ordinary Métis use. Codex/Fable remain development collaborators when available, not the required end-user interface. Use the existing command bar, right-edge surface, agent orbs, shortcuts, composer and Intelligence. Preserve the real native Mac lane and existing Electron customers; do not make a rewrite a prerequisite for the first complete interaction.

## 1. One familiar surface

The global visibility toggle shows/dismisses the current Métis surface without starting capture or changing the meeting. Separately, clicking the microphone or using the configured command-voice toggle engages the permitted command audio owner and visibly acknowledges the gesture. The mesh orb stays in the command bar with its voice-responsive glow/beam treatment; motion follows actual capture/playback/activity, not a simulated recording. A quiet/static accessible representation has equal information. Showing a glow is never microphone consent or proof of recording.

The foreground task card names the active agent, permitted app/account and a meaningful current step. It offers an always-reachable Stop control. The typed composer is available throughout. A finished task exposes the actual result, evidence/source link and useful follow-up—not another setup dialog.

Show five simple activity labels: Listening, Understanding, Working, Needs you, and the factual terminal outcome. Also distinguish Queued, Paused, Stopped, Partly completed, and Could not verify where applicable. Do not collapse every non-success into “failed,” or every request into “working.” A task is Running only after its worker/adapter accepted execution, not merely after a launch request was sent.

## 2. Four intentions, no mode-selection obstacle course

| Intention | Métis does | It must not silently do |
|---|---|---|
| Talk | Answers about permitted sources or visible context and speaks naturally. | Mutate an application because a model suggested it. |
| Guide | Highlights the current live target and explains the next step. | Click, type, change focus, or act through a connector. |
| Do | Completes the requested bounded operation and verifies the outcome. | Expand into another app/account or more consequential task. |
| Dictate | Inserts the user's exact intended text into the selected permitted field. | Rewrite, submit, send, add a newline shortcut that submits, or switch targets silently. |

Clear language selects the intention. “Show me where” routes to Guide; “Change it for me” routes to Do only when “it” is uniquely bound. Existing internal code may use `act`; map it explicitly to the user-facing Do label rather than introducing competing action enums.

Planning, context retrieval and skill selection may happen while input is arriving, inside read permissions. A partial transcript may prepare a candidate; it may not commit a mutation. Negation/correction invalidates that candidate. Stable text is necessary, not sufficient: source identity, task intent, resource scope and policy still apply.

## 3. The useful default: act without asking before every click

For a clear, reversible, permitted local request, issue one bounded task grant and perform its authorized steps. Do not ask “Are you sure?” for each pointer movement, field insertion or internal readback.

The grant specifies principal/tenant/device/session/agent/task, permitted resources, action capabilities, execution routes, lifetime, policy revision and budget. Resource access is not blanket capability access. Connector approval does not include a logged-in browser fallback. A command to create a note does not include emailing it or changing who can read it.

Ask one focused question when a target, audience, resource or consequential payload is genuinely ambiguous. Reuse current authorized context to avoid asking for information already known. Do not invent the missing fact to avoid a question.

Send, publish, purchase, delete and access changes require the exact consequence-appropriate approval. It includes actual recipients, content, objects, destination and totals where applicable. Any relevant change invalidates it. A bare “yes” is usable only when bound to one current presented proposal, the trusted speaker/input owner, the current audience and the policy's accepted confirmation method. Never let a webpage, document, meeting participant or tool output confirm an action.

## 4. Sound like a helpful operator

Speak briefly at meaningful transitions, not after every low-level tool call. Usually one acknowledgment and one useful outcome are enough. Intermediate speech is for a real obstacle, a user question, or a material change. Do not expose internal chain-of-thought; show a short actionable plan and observed progress instead.

Examples of truthful phrasing:

- Before a worker starts: “Queued. Another task is using the desktop.”
- Once dispatch really starts: “I’m creating the note.”
- During verification: “The write finished. I’m checking the contents.”
- After exact readback: “The note is saved, and I checked all three items.”
- After an uncertain timeout: “I stopped further work. The save may have happened; I haven’t repeated it.”
- After partial completion: “The document is ready. I haven’t sent it.”

Do not say “done,” “sent,” “saved,” “connected,” “listening,” or “installed” because a model said so. These words require the corresponding host/native/service receipt. A completion chime and success color obey the same rule as spoken text.

For ordinary answers, use permitted source-backed content. For action completion, generate speech from a typed result disposition plus authorized detail; free-form model text cannot override an unknown/failed disposition. Default reply language follows the user's explicit preference/current conversation; preserve proper names and original captured text separately. Qualify English, Québec French, Spanish and Brazilian Portuguese independently.

## 5. Interrupt without destroying the workflow

| User action | Audio response | Task response |
|---|---|---|
| “Stop talking.” | Flush playback, cancel synthesis, truncate unheard content. | Continue previously authorized work unless separately paused. |
| “How’s it going?” | Yield the audio floor; answer from actual progress. | Keep the existing task and permissions unchanged. |
| “Say that in French.” | Cancel/rephrase the audible response from the same eligible evidence. | Do not run the action again. |
| “Pause this task.” | Brief factual acknowledgment if safe. | Revoke further dispatch; reconcile already-started effects; require fresh target/policy checks on resume. |
| “Actually, use the other document/account.” | Stop superseded speech. | Revoke prior authority before replanning; show any already-completed effects. |
| “Stop everything.” | Immediately mute/flush applicable playback. | Locally revoke all task/input authority, cancel workers, and separately confirm remote stop acknowledgments. |
| Human physically takes over the mouse/keyboard | Do not fight for focus or input. | Pause/revoke foreground input; drain the old input owner before another one can acquire the device. |

Barge-in alone is not permission to abandon or rerun a mutation. The next utterance is classified separately as a question, speech preference, correction, pause or cancellation. Local Stop/keyboard controls must work without network or cloud STT availability. A remote operation already committed cannot be reversed by displaying “Stopped.”

Record the playback position actually reported by the audio sink—not synthesized duration or words generated. Discard late chunks from the old response generation. Handle echo/own-voice rejection and command-vs-meeting origin in the trusted capture boundary; the candidate core's source enum alone does not authenticate audio.

## 6. The mouse must be both visible and honest

Keep the guidance and activity Tony requested. During an engaged user-requested session, useful target highlighting and the active task card are visible by default, subject to explicit accessibility/privacy choices. Decorative ghost trails are optional. Do not bury all activity behind an invisible background process.

Three representations have distinct meanings:

- **Guide highlight:** a non-input overlay anchored to a fresh target, clearly identified as guidance.
- **Actual foreground control:** real OS pointer/keyboard events tied to the current authorized task, with a reachable stop/takeover path.
- **Background work:** a truthful progress/result card for API or semantic operations; no animation pretending the real mouse is clicking.

One device has one physical input owner. Concurrent agents may research or build independent artifacts within limits, but they queue for physical input. Revocation immediately rejects new events; the lease is not released until the native helper acknowledges its queued events are drained. No timeout-based forced handoff to another agent.

Validate target coordinates, window/field identity, document revision and monitor transform at the last native dispatch boundary. Moving windows, changed focus, browser navigation/zoom, monitor removal and protected surfaces invalidate stale target tokens. If a safer qualified route is unavailable, explain the limit; do not guess or silently switch authority domains.

Motion must not own permission or navigation. Hidden/idle overlays schedule no unnecessary animation frames. Reduced motion replaces motion with equally informative status. Real OS screenshots, full-display capture and actual single-window screen sharing must be tested; a black covered image is a defect, not privacy success.

## 7. Follow-ups stay attached to the right agent and result

Resolve “that,” “this,” “do it,” and “retry” against the selected task/card/source and its revision. Name the relevant agent when ambiguity is possible. Several pending proposals require a choice; do not select whichever returned most recently.

Creating an agent, choosing an orb, changing a voice, or renaming a thread does not execute a task or widen permissions. Agent identity remains stable across names and models. Preserve drafts, scroll position, selected files and conversation continuity without moving raw private content into a universal memory store.

Expose useful result actions: Open result, Show what changed, Explain, Refine, and Undo only when a verified reversible inverse exists and remains safe. Undo is a fresh authorized operation with current target checks; do not present a fake universal undo button. A request to “retry” an uncertain write starts reconciliation, not a duplicate write.

## 8. Recover helpfully and precisely

Distinguish no effect, verified effect, and uncertain effect. Reserve durable operation identity before dispatch. Persist receipt/usage reconciliation and retain unresolved resource locks across crashes. New operation IDs must not evade unresolved side-effect quarantine on the same resource.

If a task writes two documents and fails to send a message, keep both documents, report the partial outcome, and offer only the remaining safe action. Do not rerun completed operations. Source-backed carry-forward across a new plan revision requires explicit reconciliation; old receipts cannot silently authorize a new plan.

If voice fails, keep the typed path and eligible independent actions usable. If a memory service fails, disclose memory unavailability without blocking a simple permitted action. If a connector token is saved, display Checking until a real scoped health/capability probe succeeds. Never silently enable local audio, a cloud route, a logged-in browser, or additional capture as fallback.

## 9. Be quiet and private when appropriate

Unprompted speech and private overlays are suppressed during calls/sharing under the established policy. An explicit reply still requires the correct audience and a verified private output route where required; the existence of headphones alone is not enough. Unknown audio-route or call/sharing state must not become a permissive default. Output-device changes flush private queued audio before it can play over new speakers.

Screen/context capture is task-scoped and minimum necessary. A screenshot represents visible coverage, not an entire document. Suppress the app's own overlay from eligible captures, avoid stale screenshot accumulation, and do not continuously upload the desktop just because Métis is open.

Keep raw capture and unapproved transcripts out of persistent memory and operational telemetry. Approved summaries/actions and necessary metadata follow canonical organizational storage, including the existing OneDrive decision where applicable. Hindsight stays subordinate to current canonical source and access rules. Remember/correct/forget remains visible and reversible according to real retention obligations.

## 10. Learn preferences without silently gaining power

“Talk less,” “answer in French,” and “show me the pointer” can update scoped explicit preferences. Confirm the changed preference briefly and show it in existing settings. These choices do not grant more app access, record a meeting, enable always-on wake, start a routine, or retain raw screen content.

Proactive suggestions require explicit permitted source scope, rate/cost limits and quiet handling. They remain suggestions until authorized. Teaching a workflow produces a reviewable skill draft with resource and side-effect boundaries, never an unreviewed recording replay.

## 11. First-run proof of behavior

Keep Métis's existing onboarding sequence and note-taking identity, demonstrate the current keyboard shortcuts, add clear permission explanations and the combined meeting-plus-assistance practice in `../keyboard-notes/PRODUCT-CORRECTION.md`. Retain a real practice action in an isolated user-approved practice document. The practice can show listening, guide, do, verification, interruption and result reopening. No fake ready state or stored video counts as the test.

Tony Walteur remains the only named onboarding presenter. Use his approved recording if actually supplied; otherwise provide the complete intentional text welcome. Remove obsolete video, poster, preload and remote fallback together. Do not transplant HeyClicky branding, prompts, server endpoints or bundled binaries.

## 12. What “complete” means

This behavior is a release requirement, not an optional inspiration. It needs actual application bindings, native/device/service checks, accurate capability readiness and traceable build evidence. The standalone candidate core provides useful tested boundaries, not an operating-system driver or proof that the installed app already works this way.

Retain every original r11 task, AGSTEP/OBU/HMSTEP expansion, 20 CXSTEP children and 36 CXAC scenarios. The additional BXAC scenarios sharpen behavioral acceptance; they do not replace the full upgrade. Windows public readiness and native-Mac qualification stay separate. Missing required behavior must remain an open gate rather than being silently hidden behind a feature flag.


## 13. JEV is genuinely used, but never becomes authority

Use the managed JEV decision integration in `jev/JEV-INTEGRATION.md`. One central server key serves independently entitled devices; desktop decision assistance and Intelligence assessments have separate controls. Staff keep the normal Métis surface. JEV does not replace speech, the generative assistant, canonical facts, exact approvals or native result verification.

A validated uncertain-case Choice must select the corresponding original prepared proposal. Check request/task/candidate/config revisions, record actual consumption, and run the existing trusted matcher/authorization/verifier. A high-confidence wrong title, Guide request, changed target or unapproved Send must still be blocked. A setting that never changes routing, or a `void result` call, is not integration.

Known simple commands, explicit status, local Stop and speech-only changes should stay deterministic. An uncertain JEV result asks for clarification without silently switching providers. Laya-only never sends to JEV. Current model pin, language/template qualification, data approval and request accounting are independent prerequisites.

Intelligence can display useful source-linked semantic assessments as inferred or uncertain. JEV cannot certify facts, compute authoritative date arithmetic, alter canonical records or write Hindsight memories without the existing separate source/approval lifecycle. Correct/forget and ACL changes invalidate pending decisions.

All original sixty interaction scenarios are retained, with twenty-four JVAC refinements added. Eighty-four declared app-level scenarios remain NOT_RUN until the actual application, native and service evidence exists. Standalone code tests are not those passes.


## 13. Mandatory note-taker and keyboard preservation (v4)

All twelve NK requirements and sixteen NKAC native/app scenarios extend this behavior. Show/hide, command capture, speech, tasks and meeting controls have separate semantics. Preserve actual note-taking, summaries, decisions, action items, history, sync and Intelligence. JEV/action failure cannot independently stop or discard those records. This adds product/integration requirements only; the v3 candidate code remains unchanged.
