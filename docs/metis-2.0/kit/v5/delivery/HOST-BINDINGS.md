# Bind the behavior into the existing application

## Status and target

The candidate TypeScript code is implemented and tested in this package. It is not imported by today's Métis main process, native helpers, renderer, speech stack or Operator. No current remote HEAD was asserted while producing this enhancement. Historical source names below are navigation hints, not current-source evidence.

Inspect `/Users/tony/metis-r11-work/repo` or the actual mounted checkout once. Preserve all staged/unstaged changes and active workers. Read its instructions, current source graph, scripts, profile isolation and newest failed logs. Compare the prepared v1/v2 media and onboarding changes by behavior. Do not reapply a historical archive wholesale or run the old exact-16-file publisher after integrating more code.

**Adopt equivalent boundaries into existing controllers; do not run a parallel authority system.** The standalone core exists to make rules executable and reviewable. If the current implementation is stronger, port its conformance tests rather than replace it.

## Required bindings

| ID | Actual responsibility | Candidate reference | Host integration and evidence |
|---|---|---|---|
| BIND-01 | Authenticate input/identity and capture ownership | `BehaviorAuthority.beginIntent` | Current main-owned command ingress / Entra principal / trusted typed IPC. Never trust a renderer-supplied source enum, mode, identity or final flag. Validate actual sender/frame/session/capture ownership and source-channel separation. Native forged-origin/meeting/own-TTS tests required. |
| BIND-02 | Compile bounded grants from explicit intent and policy | `ScopeGrant`, `approve`, `consume` | Existing `command-control.ts` / register equivalent. Exact resources/capabilities/routes, immutable prepared payload, policy epoch, expiry, single-use approvals. The model proposes; it cannot call grant issuance. Voice yes requires host-resolved one-current-proposal authority and an allowed confirmation method. |
| BIND-03 | Coordinate one typed effect | `executeVerifiedOperation` | Existing `metis-command-runtime.ts` / execution coordinator. The required `matchIntent` port independently validates proposed literal values/scope against canonical user-request evidence, not the planner's own expected result. All awaited preparation precedes final consumption. Check policy, target and cancellation again at the actual native/API side-effect boundary. Each operation is a bounded semantic action, not an arbitrary script or shell. |
| BIND-04 | Durable atomic reservation and result journal | `OperationJournal` interface | Bind to real transactional storage and current user/device/task identity. `reserve` atomically deduplicates operation IDs and holds unresolved resource scope across agents. A crash/timeout cannot be fixed by inventing a new ID. Never use the package's MemoryJournal in production. Qualify cross-process and server-replica behavior. |
| BIND-05 | Device-level foreground input arbiter | `NativeInputLeaseBroker` | Existing native helper / AX/UIA/approved driver. One broker per device, not per agent. Validate fence, native target token, current focus/window/revision and permission before each actual input event. Revoke immediately; drain and acknowledge before release. A JS object fence alone cannot prevent a native daemon's old queued events. |
| BIND-06 | Independent real result verification | `ActionPort.verify`, `Proof` | Registered trusted verifier reads actual target state. A model string or input-injection return code is not proof. Bind exact operation, digest, resource, postcondition and current observation. `confirmed_no_effect` requires affirmative evidence of no effect, not merely failure to find the intended result. |
| BIND-07 | Mic, STT, streaming TTS, playback sink | `PlaybackLedger`, `controlDisposition` | Existing Cloudflare-first broker and single real audio owner. Preserve original segment/revision/capture identities. On interruption, flush the device sink and cancel provider generation; use the actual sink cursor to truncate unheard history. This ledger contains no audio DSP, echo rejection, microphone, codec, WebSocket client or TTS model. Those must be real bindings. |
| BIND-08 | Task UI, orb, guidance and completion | `presentReceipt`, `summarizeTask` | Existing `RightEdgeSidecar.tsx`, command bar and agent surfaces. Display trusted state projections. No direct renderer execution or independent success boolean. Sum only the exact current plan; reconcile valid carry-forward after corrections. Navigation/animation failure must not change task authority. Actual native visual tests required. |
| BIND-09 | Current-audience output release | `maySpeak`, receipt projection context | Main/service rechecks result access, policy and task generation immediately before release and each eligible audio segment. Do not allow renderer-provided `resultAuthorized=true`. Audio-route and call/share changes invalidate private buffers. Correctness of these booleans is the host's responsibility. |
| BIND-10 | Memory and cost provenance | Existing canonical/Operator contracts | Keep Hindsight behind approved canonical sources and current authorization. The candidate core is not a Hindsight adapter or usage outbox. Meter actual task/attempt/provider work without raw private content. A record with no known token count stays unknown, not zero. |

## Input/action flow

1. Trusted UI/native callback asks the current command owner to engage; a visual click alone does not authorize unrelated capture.
2. Real approved capture produces transcript revisions; the host distinguishes request, status question, preference, correction and stop. Partial candidates are read-only.
3. The host interprets final stable intent, current context and applicable policy, then issues a minimal grant. Target/source resolution remains independently authorized.
4. The planner proposes registered operations with validated arguments and a postcondition. The trusted canonical-intent matcher checks the exact literal constraints and intended outcome independently before any application access; it cannot simply echo `matches: true` for whatever the planner proposed. Exact consequential approval is presented and consumed only by trusted code.
5. The coordinator obtains a fresh permitted observation, atomically reserves operation/resource identity, acquires physical input only when needed, and revalidates immediately before dispatch.
6. The native/API adapter enforces the same boundaries at its real side-effect point, observes stop/fence changes, and does not wrap unbounded script execution in a safe-looking action name.
7. A new trusted readback verifies the exact intended result. Pending/unknown effects are quarantined until an explicit authorized reconciler establishes what happened.
8. A durable, audience-checked receipt controls UI/speech. Completion of one operation does not complete a multi-step plan.

## Interfaces are not security boundaries by themselves

WeakMap/WeakSet grants and tokens prevent fabricated copies inside the reference process; they do not establish real user intent, authenticate network messages, verify operating-system permissions or fence another replica. Hashes bind exact data; they are not signatures and do not anonymize low-entropy personal content. Source/identity strings are references, not capabilities.

Production must restrict IPC origins/callers, secure helper communication, register permitted adapters/verifiers, enforce account/origin policy, and bind typed grants to authenticated host state. Remote grants need the existing signed service/device trust and revocation rules—not serialization of these JavaScript objects.

The candidate uses a 1,500ms observation-age limit, a maximum 5-minute grant, a default 5-second queued-audio limit and a default 5-minute response bound. These are conservative reference limits, not benchmark claims or final product-tuning decisions. Use qualified workload-specific configuration in the host; never relax origin/scope/receipt constraints for speed. Long jobs need explicit valid scope renewal/replanning without inventing a new user utterance. That renewal path is not implemented by this candidate.

All `observedAtMs`/authority times are local monotonic host time. Do not compare raw timestamps from independent machines; a remote verifier needs a trusted local receipt time plus authoritative revision lineage.

The coordinator assumes the registered adapter is trusted code. Its cancellation/fence callback must actually be invoked at each relevant native effect point. A non-cooperative API may still commit after timeout. Returning a promise is not proof that a native helper stopped. Quiescence acknowledgments require real device evidence.

## Journal semantics

Required atomic transaction: reserve operation key + resource lock + prepared identity. Record the conservative attempt boundary durably. Final settlement releases the resource only after verified effect, authoritative no-effect, or confirmed predispatch stop. Unknown, missing settlement and crash states retain a reconciliation obligation. Recovered unfinished records never auto-replay.

A bounded reservation timeout may complete late. Reconciliation must recognize a reserved-but-never-dispatched record from actual host attempt evidence. Do not delete its resource lock merely because a client UI returned an error. Failed settlement can also complete late; reconcile idempotently without double billing or duplicate effects.

The reference coordinates one semantic operation. It does not implement a transactional multi-app workflow, exactly-once remote side effects, arbitrary undo, a persistent task scheduler, a complete resource conflict graph, or a database engine. Those remain existing plan integration work. Prefer at-most-once dispatch plus explicit uncertainty/reconciliation to unsupported exactly-once claims.

## Readiness and rollback

A capability is Ready only after actual compatible platform driver/service/identity/permission probes and qualified behavior. Static method presence, saved credentials, a source-level test, and an operator token are insufficient. A failed probe gives Checking / Needs access / Unsupported / Unavailable, never a fake Ready.

Integrate behind a development-only test scope until the real first loop is qualified. A feature flag is rollout control, not acceptance evidence or a reason to omit a required full-upgrade feature. Preserve the installed app/profile, encryption material, consent, old explicit offline choices and completed artifacts. New installs remain lean and Cloudflare-first. Do not distribute the HeyClicky binaries or require coding CLIs for employees.


## Managed JEV implementation binding (v3)

The original ten bindings remain mandatory. Add the concrete server/desktop/Intelligence integration in `../jev/JEV-ROLE-AND-BINDINGS.md`. Six executable JEV modules consume decisions through the existing coordinator and provide real HTTP/schema and admin orchestration. Their injected security, vault, distributed journal, normalized Laya transport and current-source ports must be bound to the actual application; test fixtures cannot fulfill them.

Do not put server TypeSafe imports into customer Electron/native distributions. A `typeof window` assertion is not a build boundary. Reuse the existing authenticated Operator endpoint and vault instead of a new arbitrary proxy. Prove the link using `../jev/PROOF-OF-INTEGRATION.md`.


## Keyboard and note-taker bindings (v4; extend existing responsibilities)

- **BIND-01/02:** Only trusted keyboard/typed/command ingress can request bounded authority; meeting transcripts cannot become commands. A keyboard gesture alone is not speaker authentication.
- **BIND-07:** Separate meeting, wake and command consumers behind the current single broker. Preserve meeting segment/persistence identity; command off releases only its subscription. Stop all capture and explicit meeting controls have declared scope. Status comes from actual broker acknowledgments, not UI intent.
- **BIND-08:** Bind configured global show/hide to the current window authority, plus a distinct keyboard-accessible command-voice control. Same surface, meeting, selected task and drafts survive hiding. Check registration/rebinding and actual repeat/focus behavior; do not invoke the meeting record handler to toggle the overlay.
- **BIND-09:** A meeting-safe text reply is the default during calls. Private speech requires current audience/output qualification and device-change buffer invalidation. Do not promise acoustic secrecy.
- **BIND-10:** Preserve note/summary/action-item/history/export/sync lineage and approved storage. Commands and generated task text remain separate from canonical meeting evidence. JEV/action-worker outages do not independently prevent saving already captured notes.

`keyboard-notes/INTEGRATION.json` maps this work to original roots. All 16 NKAC cases require actual application/native evidence; no new native/runtime bindings were implemented by this document change.


## V5 supplied Hindsight skill binding

The full uploaded memory skill is now integrated through `skills/metis-hindsight-memory/SKILL.md` and its mandatory Métis profile. See `memory/INTEGRATION.md` and `memory/HOST-BINDINGS.md`. Reuse original HMSTEP-01–16 and the existing governed memory gateway. This addition preserves note-taking, keyboard control and JEV; it cannot grant capture, execution or raw-provider access. No live runtime binding is proven by including the skill. The combined app-level matrix now has 120 NOT_RUN scenarios; historical counts in preserved documents remain scoped to their original versions.
