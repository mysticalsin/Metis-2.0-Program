# TASK-005 — Shared speech, command, policy and metering contracts (design for review)

| Field | Value |
|---|---|
| Status | **DESIGN ONLY.** Nothing was written to the repository. TASK-005 implementation remains `NOT_STARTED`, verification `NOT_TESTED` (kit `plan/registry.json` TASK-005 row). This document is not a product pass (MASTER §33.6 L4822-4835, §21.1.1 L1889). |
| Kit | `/Users/tony/AI-Brain-build/metis-kit-r11/Metis-2.0-Upgrade-Kit-r11`, MASTER rev 4.5. TASK-005 packet at MASTER L1993-2003. |
| Source | `/Users/tony/AI-Brain-build/metis-2.0`, HEAD `2bf21f1ceefe117838325342574b57852e5cadcb` (commit 2026-09-23 10:10:35 -0400, merge of PR #198), branch `claude/metis-2.0-task-001`, `package.json` version `1.9.6`. VERIFIED: `git rev-parse HEAD`, `git log -1`, `grep '"version"' package.json`. |
| Requirements | M2-STT-01 (L1772), M2-ACT-01 (L1750), M2-OPS-02 (L1761). |
| Closure refs | SRC-02/03/04/06/11/16/17/21/24, EXP-02/07/09, AGX-02/06/09, HC-04/07/10/11/16/24/26, AGSTEP-02. |
| Date | 2026-09-24 |

## 0. How to read this

Evidence labels follow the task's binding rules. **VERIFIED** means I read the cited file at the cited lines at HEAD `2bf21f1c` (read-only), or ran the command listed in §11. **ASSUMED** means a design choice or an inference I did not prove. **UNKNOWN** means the input was not available to me. Kit citations are `MASTER Lnnn` (line numbers in `spec/MASTER.md`), found with `read_task.py`, `grep -n` and `awk` ranges. I never read MASTER whole.

The deliverable has three layers:

1. **§1–§8**: for each contract, the kit's required fields, states and invariants; what code already implements part of it; the gaps; the proposed module; and the invariant tests that pin it.
2. **§9–§14**: the module layout, test plan, what I verified for this design, traceability, open owner decisions and blockers.
3. **Appendices A–D**: the exact proposed TypeScript modules, the four golden JSON fixtures, the Swift mirror and the synthetic self-check runner. They were type-checked and executed in my scratchpad (§11), and are embedded verbatim with their sha256.

"Synthetic" in this document means contract fixtures run against a reference implementation. Per MASTER L1889 that allows independent development. It is never live integration evidence.

---

## 1. Findings that shape the contracts (most severe first)

| # | Finding | Evidence | Kit anchor | Consequence for TASK-005 |
|---|---|---|---|---|
| F1 | **Fresh profiles get a hardware-derived LOCAL engine.** A readable fresh or incomplete sparse profile gets `base.asrEngine = freshAsrEngineForThisDevice()`. At onboarding completion a derived `whisper` is **persisted into the user layer**, where it cannot be told apart from a user choice. An existing test pins the behaviour. | VERIFIED `src/main/store.ts:691-703`, `:815-825`; `src/shared/asr-hardware-preference.ts:46-51` (>8 GiB → whisper); `src/shared/asr-engine.contract.test.ts:38` ("accepts RAM-specific fresh choices…") | L833, L835 ("a local model being installed cannot make it selected"; hardware does not select) | The resolver takes **no** hardware or install input. The migration treats a persisted `whisper` on a completed profile as **ambiguous** (SM-07). That test must be deliberately inverted, not silently deleted. |
| F2 | **Cloud speech is effective only under managed CLOUD_ONLY.** In any other profile a stored cloud provider is ignored. The engine enum has no cloud value. The cloud/local decision is taken in the **renderer**. | VERIFIED `src/shared/cloud-stt-provider.ts:47-54` (blob `28c95473…` = kit R49, unchanged); `src/shared/ipc.ts:1151` (`asrEngine` enum), `:1169` (`cloudSttProvider` default `unconfigured`); `src/renderer/src/App.tsx:2233-2237`; `src/renderer/src/lib/listen.ts:2154-2156` | L835, L839 | One `SpeechEngineId` namespace and one resolver whose result main hands to consumers. The renderer never decides the route. |
| F3 | **Malformed managed policy silently becomes "unmanaged legacy".** `resolveEnterpriseLiveProfile` returns the default `{managed:false, legacy}` when parsing fails. | VERIFIED `src/shared/enterprise-live-profile.ts:46-51` | L837 ("not weakened by malformed policy") | `SpeechPolicy.status = 'invalid'` fails capture closed (SM-14, CS-07). |
| F4 | **The Jev decision is still discarded** (SRC-03), and the Jev hook is not wired at all. No server `/v1/decide` handler exists in this repo. | VERIFIED `src/main/metis-command-runtime.ts:234-235` (`void result`); `src/main/index.ts:2619-2623` (no `jevEnabled` passed, so it defaults to false, `metis-command-register.ts:49`); `git grep "v1/decide"` shows only client and docs hits, nothing in `operator/src` or `cloudflare-proxy/src` | L4036-4040, L921-942 | `DecisionRequest`/`DecisionResponse`/`applyDecision` with typed rejection reasons (DC-01..07). Server route is UNKNOWN for the deployed portal (§14). |
| F5 | **Outcome collapse.** `CommandControl.confirm` folds failed, cancelled, unsupported and thrown into `adapter_failed`. A throw *after* dispatch is reported as failure, not as unknown. Every adapter success path returns `ok:true, outcome:'unknown'`, and `ok:true` means "dispatched". `policyAllows` is never wired. | VERIFIED `src/main/command-control.ts:97-110`, `:93`; `src/main/desktop-adapters.ts:88-93` (`okResult` default `'unknown'`), `:182-264`; `src/main/index.ts:987-993` (no `policyAllows`) | L303, L348, L4048-4052, EXP-09 L3974 | `StepOutcome` with `attempted` distinct from `verified`. `verified` requires a verifier receipt. A throw after dispatch becomes `unknown` (SO-01..13). |
| F6 | **The SRC-04 `flushPending` anchor no longer exists.** Execution moved to `CommandControl`. The kit's observation is stale for this HEAD, but its required change (F5) still applies. | VERIFIED `git grep -n 'flushPending\|mark_committed' -- src native-app` returns nothing | L4048 | Record SRC-04 as "anchor moved; defect class persists in successor". |
| F7 | **The command path is not fed by real speech.** `MetisCommandRuntime.ingestTranscript` has no production caller, and `ApplicationCommandSession` is never instantiated outside tests. | VERIFIED `git grep -n ingestTranscript -- src` shows the definition only (`metis-command-runtime.ts:50`); `git grep -n 'new ApplicationCommandSession'` shows no non-test hit | L309, L857 | The contract must define command ingress (`CommandUtterance`) from a command-purpose speech session. There is no production behaviour to preserve here. |
| F8 | **Segment identity is per message, not per segment.** `epoch: String(this.msgSeq)` changes on every provider message. `segmentId` hashes `[scope, messageSequence, index]`, and `revision` is always `1`. `is_final` and `speech_final` are treated as the same thing. Interims carry no identity. Both tracks always open. | VERIFIED `src/main/cloud-stt/live-session.ts:238-245`, `:389-390`, `:131`; `src/main/cloud-stt/adapter.ts:113-117`, `:269`, `:335`, `:400`; `live-session.ts:55` (`onInterim(channel, text)`) | L871, L869, L863, L857 | Deterministic `SegmentKey` covering capture generation, track, epoch and provider start. A monotonic revision. `endpoint` kept separate from `final` and from stream-final. Tracks validated per purpose (SG-01..15). |
| F9 | **Native Mac persistence hides loss and has no segment model** (SRC-11). A random UUID per line, no revision, no track or generation. It installs Apple speech assets on demand. | VERIFIED `native-app/App/Store/PersistedModels.swift:35-37`, `:47`, `:59-60`; `native-app/MetisKit/Sources/MetisKit/MeetingModels.swift:11-23`; `native-app/MetisKit/Sources/MetisKit/SpeechTranscription.swift:36-38`, `:45` | L4132-4136, L787, L835 | `SaveResult` / `DecodeResult` typed outcomes, and a Swift contract mirror pinned by golden JSON. |
| F10 | **Metering identity is ambiguous and can double-count.** One Ask id plays operation, attempt and delivery roles. `/v1/use` meters with a fresh `randomUUID` on every call, so a retried buffered call is a second charge. Metering failures are swallowed with no accounting-health signal. Merges are null-coalescing with no provenance rank, so a later non-null client value overwrites server-authoritative counts. | VERIFIED `operator/src/ask-meter.ts:36-41`; `operator/src/use.ts:439-450`; `operator/src/ask.ts:237-243`; `operator/src/store.ts:139-168`; `operator/src/d1.ts:76-110` | L297, L1132-1136, L1146-1148 | Separate `UsageEventId` (delivery), `AttemptId` (charge) and `OperationId`. Provenance and state ranks. Explicit `correction`. |
| F11 | **No speech metering exists.** Ingest event types are `ask/rating/listen/recap/crm`, and `listen` carries only `minutes`. | VERIFIED `src/shared/operator.ts:99`, `:192-193`; `git grep -i 'stt\|speech\|nova\|deepgram' -- operator/src` finds no speech metering (non-test) | L1154-1156, L1175 | `UsageRecord.speech` per track and epoch. `audioSentMs` kept distinct from `audioProcessedMs` and wall clock (UL-13, UL-16). |
| F12 | **Gateway privacy controls are incomplete.** `/v1/use` sends `cf-aig-collect-log-payload:false` and `cf-aig-skip-cache:true` but **not** `cf-aig-collect-log:false`. Ask pins the auto-created `default` gateway. | VERIFIED `operator/src/use.ts:229-233`; `operator/src/ask.ts:102` | L1486-1494, L1467 | `RouteQualification.routeAdmitsContent` never accepts gateway `default`, unknown logs or cache, or config drift (CS-05, CS-06). |
| F13 | **Consent is one boolean,** written together with `onboardingDone`, with no notice version, purpose or epoch. | VERIFIED `src/shared/ipc.ts:1103`; `src/renderer/src/components/Onboarding.tsx:508`, `:528` | L1526 | Purpose-scoped `ConsentRecord`. The legacy flag maps to meeting scope only, with notice `legacy-1.x` (CS-02). |
| F14 | **Existing correct seams to keep.** Allowlist ingest projection runs before enqueue and before storage. The durable client outbox is bounded. Owner-scoped merge SQL denies cross-device upserts. Nonce plus webContents confirmation is consumed before the adapter runs. Cloud STT owner generation lives in main. | VERIFIED `src/shared/operator.ts:173-237`; `src/main/operator-ingest.ts:225-236`; `src/main/operator-queue.ts:19-24`; `operator/src/d1.ts:107-109`; `src/main/command-control.ts:85-92`; `src/main/index.ts:6588-6602`; `src/main/cloud-stt/session-replacement.ts:8-34` | L841 ("retain the existing … implementation where correct") | Extend these; do not fork them (D2). |

---

## 2. Cross-cutting design decisions

- **D1. Location and dependencies.** Add `src/shared/contracts/{ids,speech-engine,speech-session,command,policy,usage,agent}.ts` as dependency-free pure TypeScript. The Operator Worker already imports `src/shared/*` by relative path: VERIFIED `operator/src/index.ts:1`, `operator/src/privacy.ts:1`. The shared modules it imports today have no imports of their own (VERIFIED: `grep '^import'` over `src/shared/{operator,operator-license,providers,question-type}.ts` returns nothing). Keeping the contracts free of `zod` and `node:*` therefore adds nothing to the Worker bundle. `zod` stays at desktop IPC boundaries, where it is already used (VERIFIED `src/main/application-intents.ts:1`, `src/shared/enterprise-live-profile.ts:8`; root `package.json:104`).
- **D2. Extend, do not fork.** Existing modules become thin adapters over the contracts rather than parallel systems:
  - `desktop-actions.ts:31` `DesktopActionOutcome` stays as the adapter vocabulary and feeds `classifyStep`.
  - `cloud-stt-provider.ts` becomes a legacy shim over `resolveEffectiveSpeech`.
  - `command-control.ts` keeps nonce and ownership, and calls `checkApproval` / `classifyStep`.
  - `shared/operator.ts` `projectOperatorIngestMetadata` gains a `usage` event projected by `projectUsageRecord`.
  - `application-intents.ts:72-77` capability rows become `CapabilityDefinition`s.

  MASTER L841 and L1140 both require minimal extension.
- **D3. One resolver, owned by main.** Main computes `EffectiveSpeech` and pushes it to the renderer as display state. The renderer's `shouldUseCloudSttEngine` call sites (`App.tsx:2233`, `listen.ts:2154`) are removed. This matches the existing comment at `src/main/index.ts:6588-6590` ("Provider authority is settings/profile only").
- **D4. Swift parity through golden JSON, not a translation.** `native-app/MetisKit/Sources/MetisKit/Contracts/*.swift` mirrors the contract. `native-app/MetisKit/Tests/MetisKitTests/Fixtures/*.json` are byte-identical copies of `src/shared/contracts/__golden__/*.json`, enforced by a TS test that compares sha256. SwiftPM resources must live inside the target directory (ASSUMED standard SwiftPM rule), so the test target needs `resources: [.copy("Fixtures")]`. **CI does not run Swift tests today**: VERIFIED `grep 'swift test\|xcodebuild' .github/workflows/*.yml` finds nothing (SRC-24).
- **D5. Content never crosses into metering or policy records.** Every record that can reach Operator is built by an allowlist projection that constructs a new object. Strings come only from closed enums or an identifier regex. Scope comes from server authentication, never from the payload (MASTER L847, L1158, L1500).
- **D6. Versioning.** Every wire shape carries a `schemaVersion` literal: `metis.speech-engine.v1`, `metis.speech-session.v1`, `metis.command.v1`, `metis.decision.v1`, `metis.policy.v1`, `metis.usage.v1`, `metis.agent.v1`. Changes follow expand/contract so the preceding client keeps working (MASTER L1309).
- **D7. Identity.** IDs are opaque `prefix_` plus 32 hex characters. Randomness is injected: Web Crypto in Electron and the Worker, seeded in tests. Segment IDs are **deterministic** from the segment key and are never random per interim (MASTER L871). Counters (`CaptureGeneration`, `StreamEpoch`, `SegmentRevision`, `ConsentEpoch`) are branded numbers.

---

## 3. Contract A — Speech engine: selected vs allowed vs ready, plus versioned migration

### A.1 Kit requirements
- **Fresh default.** Every fresh Métis 2.0 Windows and native Mac profile defaults to Cloudflare-hosted `@cf/deepgram/nova-3` (L833).
- **Three separate things:** the user's *selected* engine, the engines *allowed* by org policy, and the engines currently *ready*. A readiness failure cannot rewrite the selection. An installed local model cannot make itself selected. A modern Mac does not select Apple speech. Apple generation/PCC is a separate capability (L835).
- **Migration** (L837):
  - Preserve authenticated explicit offline or other-provider choices that policy still permits.
  - Explain a default migration to users who never chose.
  - Never begin uploading audio merely because an upgrade changed a default.
  - Resolve ambiguous legacy settings through a visible choice.
  - An org-enforced mode wins, is visibly locked, and is not weakened by malformed policy or an empty field.
- **Real target.** Changing only the dropdown or default string is insufficient (L839).
- **Fallbacks default to off.** A local pack is used only if allowed, qualified, and explicitly selected or covered by a previously accepted *exact* fallback. Local-only prohibits cloud egress (L881).
- **Local capabilities** (L1260, L1276-1283): local speech and local generation are separate, and both are off by default. Installed bytes are not consent to load or select. "Installed, not selected" means no implicit selection.
- **Settings registry** (L420-424): selected, allowed and ready are tracked independently. Policy revision takes effect at a safe boundary.
- **TASK-005 verify** (L1999): golden cross-platform fixtures plus negative tests. They must preserve explicit legacy choices, forbid a local installation from implicitly selecting itself, and make every fresh eligible 2.0 profile Cloudflare-default **without treating that preference as capture consent**.

### A.2 What exists
- `CLOUD_STT_PROVIDERS`, `effectiveCloudSttProvider`, `shouldUseCloudSttEngine`: VERIFIED `src/shared/cloud-stt-provider.ts:18-54`. This is a partial selected-versus-effective split, but only under CLOUD_ONLY.
- `EnterpriseLiveProfile` with `managed`/`inferenceMode`/`summaryOnly`, plus `assertCloudOnlyAllowsEngine`: VERIFIED `src/shared/enterprise-live-profile.ts:13-91`. It is a partial "allowed" gate, local-blocking only.
- Locked keys and the managed layer are stripped from the user layer on read and ignored on write: VERIFIED `src/main/store.ts:685-690`, `:783-791`. This implements "org wins" for the local-settings keys.
- Local generation is gated by an explicit `enabled`. Automatic provisioning is skipped when disabled: VERIFIED `src/main/local-model-provisioning.ts:8-12`. The comment at `src/shared/ipc.ts:1261-1262` ("weights … download in the background whenever the app opens") is **stale relative to that code**. VERIFIED by reading both; not runtime-tested.
- Runtime local-to-local engine swap after repeated failures: VERIFIED `src/renderer/src/lib/listen.ts:1564-1571`. It is recorded after the fact in Settings (`asrLastFallbackAt`, `ipc.ts:1196`).

### A.3 Gaps
F1, F2, F3 above. In addition:
- There is no "allowed set" beyond CLOUD_ONLY.
- There is no readiness ladder (L853).
- There is no exact-fallback record.
- The silent local-to-local swap (`listen.ts:1564-1571`) is a fallback that no policy covers. Under L881 it must become either an accepted exact fallback or a visible stop.
- The native Mac app has no engine selection at all and is Apple-speech-only. VERIFIED `SpeechTranscription.swift`, `AudioCapture.swift`, and `grep -i engine native-app/App/Settings/SettingsView.swift` finds no selection.

### A.4 Proposed module: `src/shared/contracts/speech-engine.ts` (full code in Appendix A.2)
- **`SpeechEngineId`**: `cloudflare-nova3 | soniox | local-parakeet | local-whisper | local-apple`. It replaces the split `asrEngine` + `cloudSttProvider`.
- **`SelectionState`**: either `SpeechSelection {engine, source: fresh-default|user-explicit|legacy-explicit|migration-default, pendingAck}` or `PendingSelection {source:'needs-choice', reason, proposed, interim}`.
  - `pendingAck.interim` is the legacy local engine that keeps running, with no upload, until the user acknowledges. The type guarantees it is never a cloud engine.
- **`SpeechPolicy`**:
  - `absent`
  - `invalid` (fails closed)
  - `valid {allowed, enforced, orgDefault, exactFallback}`
- **`EngineReadiness`** with rungs `policy-loaded`, `device-authorized`, `service-reachable`, `config-qualified`, `microphone-allowed`, `tracks-ready`, `transcript-received` (L853). Local packs also carry `installed` and `selfTest`.
- **`resolveEffectiveSpeech`** returns either `ready {effective, via: selected|org-enforced|org-default|accepted-exact-fallback|interim-legacy-local, locked}` or `blocked {reason: POLICY_INVALID|NEEDS_CHOICE|NOT_ALLOWED_BY_POLICY|MIGRATION_ACK_REQUIRED|PRIVACY_NOT_VERIFIED|NOT_READY}`.
  - Precedence: enforced > explicit selection (if allowed) > org default > default selection.
  - An explicit choice that policy disallows is **overridden visibly (locked) and never rewritten**, so the user's choice returns if the policy is lifted.
- **`migrateSpeechSelection(layers, ctx)`** reads the **raw sparse user layer** (not merged settings). It has **no** parameter for memory, OS, Apple Intelligence, installed packs or consent.
- **`speechPolicyFromLegacyManaged`**: a present but unparseable `enterpriseLive` is `invalid`.

### A.5 Invariants and tests (proposed `src/shared/contracts/speech-engine.test.ts`; golden `__golden__/speech-selection.v1.json`, cases SM-01..SM-20, Appendix B.1)

| ID | Invariant | Pinned by |
|---|---|---|
| I1 | Resolution never mutates or rewrites the selection (deep-frozen input, compared before and after). | every SM case |
| I2 | Marking every *uninvolved* local engine installed and usable never changes the effective result. | property over every SM case; SM-02, SM-03 |
| I3 | No automatic cross-engine fallback. A local-only failure never uses cloud, and a cloud failure never uses local unless an exact fallback was accepted. | SM-02, SM-16, SM-17 |
| I4 | A malformed managed policy blocks content capture and is never treated as legacy. | SM-14 |
| I5 | A cloud engine is effective only when its route privacy is VERIFIED. | SM-04 |
| I6 | A migrated profile whose legacy route was local never starts cloud upload before acknowledgment, whichever path (selection, org default, enforcement) produced the cloud candidate. | SM-08, SM-10, SM-20 |
| I7 | Hardware, Apple Intelligence and installed-pack hints are inert: migration output is byte-identical with or without them. | property over every SM case |
| I8 | A fresh eligible profile resolves to `fresh-default` + `cloudflare-nova3`, and this does not make capture allowed without a consent record. | SM-01 + CS-01 |
| I9 | An ambiguous persisted `whisper` on a completed profile produces a visible choice. The legacy local route continues meanwhile. | SM-07 |
| I10 | Org enforcement wins and is marked `locked`. The user choice is kept in the record. | SM-13, SM-15 |

### A.6 Adoption plan (call sites, for the implementing change; not done here)
1. `src/main/store.ts:691-703` and `:815-825`: stop deriving and persisting `asrEngine` from RAM. Persist `speechSelection` from `migrateSpeechSelection` once, idempotently. `preferredFreshAsrEngine` may survive only as a *recommendation* input to optional-pack Settings (TASK-021/022), never as selection.
2. Invert `src/shared/asr-engine.contract.test.ts:38` in the same change, with the reason recorded (TASK-005 verify).
3. `src/shared/enterprise-live-profile.ts:46-51`: expose a `status: 'invalid'` result instead of the silent default. Callers fail closed.
4. `src/main/index.ts:6586-6590`: use `resolveEffectiveSpeech`. Push the result to the renderer; delete renderer-side route decisions (`App.tsx:2233`, `listen.ts:2154`).
5. `listen.ts:1564-1571`: the Parakeet-to-Whisper swap requires `exactFallback {from: local-parakeet, to: local-whisper}` acceptance, or it stops visibly (ASSUMED product decision, §13).
6. Native: add `Contracts/SpeechEngineContract.swift` (Appendix C.1). The native app gains a selection model that defaults Cloudflare for fresh eligible profiles, subject to TASK-029 native Cloudflare transport availability.

---

## 4. Contract B — Speech session, track epochs, segment revision and finalization

### B.1 Kit requirements
- **Audio ownership** (L309-313): one trusted audio owner. Command and meeting capture stay logically distinct, with three controls (wake enabled / command mic off / stop all).
- **Four separate representations** (L787): transient audio, provider segments, user corrections, and generated content. Segments carry stable IDs, revision numbers, monotonic audio offsets, language/source metadata and confidence provenance. Generated content never overwrites recognition.
- **Channel is not identity** (L791): "speaker from the local channel" is not a verified person.
- **Gaps and dedup** (L793): track explicit gap events and reconnect offsets. Partial/final replacement must be idempotent; duplicate or out-of-order provider events must not repeat words.
- **Session grant** (L849): scoped to device, operation, capture generation, tracks, model and budget. Single-use is claimed only if redemption is atomic.
- **Purpose-specific tracks** (L857): command sessions are mic-only by default; meetings open only requested and permitted tracks.
- **Bounded queue** (L861): 2-second in-flight queue cap per track. Overflow produces an explicit gap.
- **Reconnect** (L863): new upstream-attempt identity and a new epoch. Never double-count.
- **Three finalities** (L869-873): `is_final`/`speech_final` is not stream-final, and a socket close is not proof. Segment identity comes from capture generation, track, upstream epoch and source time, never a fresh random ID per interim. A partial *replaces*, never appends. Stop-all/revocation acts immediately, and a later final can update only a still-valid transcript scope, never execution.
- **Bounded window** (L909-911): expose lost intervals.
- **Typed commands** (L342): use the same plan contract. Meeting lines are never command authority.
- **EXP-02** (L3918-3920): human notes are separate revisions.
- **EXP-07** (L3958-3960): one occurrence source lease; imports cannot arm actions.
- **SRC-06** (L4072-4076): keep the original command text and spans separate from normalized matching text.
- **SRC-11** (L4132-4136): typed save results.

### B.2 What exists
- **Main-owned cloud STT owner.** The owner is bound to webContents, a generation counter and an optional capture id, with stale-owner rejection: VERIFIED `src/main/index.ts:6597-6607`; `src/main/cloud-stt/session-replacement.ts:8-34`.
- **Terminal-evidence handling.** Nova `Metadata` is required as end-of-stream proof, and a bare close surfaces as incomplete: VERIFIED `src/main/cloud-stt/live-session.ts:72-79`, `:403-409`, `:444-455`. This is a correct partial implementation of L869 and is retained.
- **`CloudSttFinalSegment`** `{id, text, startMs, endMs, cluster, language, isFinal:true, revision}`: VERIFIED `src/main/cloud-stt/adapter.ts:69-78`. A final without word timings is refused rather than given invented timing: VERIFIED `:409-414`.
- **Channel and cluster labels** that never invent names: VERIFIED `src/shared/cloud-stt-line-map.ts:5-8`, `:38-66`.
- **Command runtime** with generation, utterance revision, meeting-channel rejection and stale-decision abort: VERIFIED `src/main/metis-command-runtime.ts:33-37`, `:50-52`, `:225-232`; `src/shared/metis-command-session.ts:121`.
- **Test** "keeps cloud STT transcript-only because renderer PCM has no hardware provenance": VERIFIED `src/main/metis-command-boundary.contract.test.ts:78`.

### B.3 Gaps
- F8 and F9 above.
- No gap events.
- No per-purpose track rule: `start()` opens `you` + `them` unconditionally (`live-session.ts:131`), and the default `audioSource` is `'both'` (VERIFIED `src/shared/ipc.ts:1668`).
- No command-utterance type bound to finals and generation.
- `stripWakeWord` returns folded text and loses the original (VERIFIED `src/shared/metis-wake.ts:41-48`, SRC-06).
- Native lines have no revision or identity semantics.
- The session grant does not exist. The desktop still reads a Cloudflare token from the keystore (VERIFIED `src/main/index.ts:6617` `getApiKey('cloudflare')`; kit R50 blob `3a2f1e86…` matches `git hash-object src/main/cloud-stt/credentials.ts`). That is SRC-07, owned by TASK-014.

### B.4 Proposed module: `src/shared/contracts/speech-session.ts` (Appendix A.3)
- **`SpeechPurpose`** = `command|dictation|meeting|import`, with `PURPOSE_TRACKS` (command/dictation = `['mic']` only). `validateSessionRequest` rejects disallowed and duplicate tracks.
- **`SpeechSessionRequest`** `{sessionId, operationId, purpose, captureGeneration, requestedTracks, engine, language, policyRevision, consentEpoch}`.
- **`SpeechSessionGrant`**: server-issued, never contains credentials. `redemption: 'single-use-atomic' | 'reusable-within-expiry'`.
- **`TrackEpoch`** `{track, epoch, upstreamAttemptId, state: connecting|open|flush-requested|stream-final|truncated|aborted, sessionOffsetMs}`.
- **`SegmentKey`** `{sessionId, captureGeneration, track, epoch, providerStartMs}`, with deterministic `segmentIdFor`.
- **`RecognizedSegment`**: `revision`, `finality: partial|final`, **`endpoint`** (provider `speech_final`, separate from final), `startMs/endMs` on the session timeline, `language` + `languageSource`, `confidence {value, provenance} | null`, and `speaker` as a channel, cluster or unknown label (never a person).
- Separate types: **`UserCorrection`**, **`GeneratedArtifact`** (linked to exact `{segmentId, revision}`), **`HumanNote`** (EXP-02), and **`GapEvent`** with reasons including `queue-overflow`, `reconnect`, `consent-withdrawn`.
- **`applySegmentEvent`** effects: `inserted|revised|duplicate|stale-generation|stale-epoch|final-immutable|revoked|invalid-time`. The window is bounded, and eviction is recorded in `evictedThroughMs`.
- **`startNewEpoch`**: truncates the old epoch, records a gap, and requires a monotonic offset. **`closeEpoch`**: only `provider-terminal` after `flush-requested` counts as `stream-final`. **`requestStop(graceful-tail | revoke, transcriptScopeValid)`**. **`sessionFinalization`**.
- **`commandUtteranceFrom`**: only a command-purpose, non-revoked window with final segments. `original` keeps the exact text. Normalized matching is derived elsewhere.
- **`SaveResult`** / **`DecodeResult`** (SRC-11): an empty fallback is never a success or a decoded meeting.

### B.5 Invariants and tests (proposed `src/shared/contracts/speech-session.test.ts`; SG-01..15 are inline in Appendix D and should be promoted to `__golden__/segment-revision.v1.json` for Swift)

| ID | Invariant | Case |
|---|---|---|
| S1 | A partial with the same key revises (revision +1). It never appends a new line. | SG-01 |
| S2 | An identical redelivery is `duplicate`, with no revision bump and no new object. | SG-02, SG-04 |
| S3 | A final is immutable to later partials. | SG-03 |
| S4 | An event from a closed epoch after reconnect is `stale-epoch`. The gap is recorded and the new epoch's offset is monotonic. | SG-05 |
| S5 | An old capture generation can never revive a window. | SG-06 |
| S6 | `endpoint` (speech_final) is not stream-final. | SG-07 |
| S7 | A bare socket close gives `truncated`/`incomplete-tail`. Only provider terminal evidence after a flush request gives `complete`. | SG-08, SG-09, SG-09b |
| S8 | A revoke with an invalid scope drops later events. A revoke with a valid scope keeps the transcript but cannot produce a command. | SG-10, SG-10b, SG-12b |
| S9 | A meeting window cannot produce command input. A command needs final segments, and the original text (accents, punctuation, dashes) is preserved byte-exact. | SG-11, SG-12 |
| S10 | Command/dictation sessions are mic-only. Duplicate tracks are rejected. | SG-13, SG-13b, SG-13c |
| S11 | The window is bounded and eviction is explicit (`evictedThroughMs`). | SG-14 |
| S12 | Negative or inverted times are rejected, never coerced. | SG-15 |

**ASSUMED, must be pinned by TASK-018 with real frames:** that Nova-3 through Workers AI keeps the same `start` across interims of one unfinalized region, which makes `providerStartMs` a stable key. If the real provider does not, the key needs a provider-supplied utterance identifier or an overlap rule. The contract shape stays the same, but the key derivation function changes.

---

## 5. Contract C — Command request → plan → approval → outcome, with verified results

### C.1 Kit requirements
- **Capability definition** (L295): ID and version, platforms, prerequisites, argument schema, data sensitivity, risk class, target resolution, approval, cancellation, idempotency/reconciliation, timeout, and an independently observable success criterion. Unsupported capabilities are filtered **before model selection**.
- **Separate IDs** (L297): operation, plan, model attempt, action step, capture generation, target snapshot, usage event.
- **Plan binding** (L301): each step binds principal, device, policy revision, target identity, snapshot revision, parameters, expiry and exact approval scope. Recheck before committing a side effect.
- **Typed outcomes** (L303): `attempted/verified/failed/cancelled/unsupported/unknown` with a safe reason. Exit code 0 proves only the command's own contract.
- **Session states** (L321-332): OFF … COMPLETED ("do not show successful completion before proof").
- **No premature action** (L334, L338-342): monotonic session generation. No side effect from partial speech. High-impact actions need target-specific UI confirmation, and a spoken "yes" is not enough. Typed commands use the same contract.
- **Commit-point cancellation** (L346-348): reconcile an unknown result before retrying. No duplicate write on reopen.
- **Deduplication** (L354): a second deliberate command is a new operation; repeated callbacks are deduplicated.
- **Candidate-bound decisions** (L925-942): the server derives identity. The result references only permitted candidates and the exact snapshot, and is applied only if generation, target and policy are current.
- **Decision semantics** (L972): validate the operation/target pair. Confidence is not permission and is never fabricated.
- **Modes** (L4455): read, teach, draft and act are distinct; a model cannot promote read to act.
- **Approval record** (L4499): binds actions, targets, revisions, side-effect class, audience, cost cap and expiry. It is invalidated by source, agent, target, output or policy changes, and "do it" is not transferable between agents.
- **EXP-09** (L3974-3976): accepted/attempted/committed/verified/unknown are shown accurately.
- **SRC-03, SRC-04** as above.
- **RUN-ORDER.md L37-38**: "Ready-to-type, provider-ready, action-attempted and verified-result are distinct." MASTER L4477 says the same.

### C.2 What exists
- **Desktop action allowlist**: `DesktopAdapterId`, typed args, `DesktopActionOutcome = verified|unknown|failed|cancelled|unsupported`, `DesktopActionResult {ok, outcome, detail, preferredMissing}`. VERIFIED `src/shared/desktop-actions.ts:7-40`.
- **`CommandProposal`** `{id, sessionId, utteranceRevision, contextHash, request, fingerprint, expiresAt}`: VERIFIED `src/shared/metis-command-proposal.ts:4-12`.
- **Main-owned `CommandControl`**: a nonce plus owner webContents, a timing-safe compare, consumption before the adapter runs, TTL, lifecycle revocation, and metadata-only audit. VERIFIED `src/main/command-control.ts:42-169`.
- **Deterministic parser** with negation, and a proposal that is never executed by parsing: VERIFIED `src/shared/metis-command-parse.ts:22-23`, `:77-110`; `src/shared/metis-command-session.ts:153-154`.
- **`ApplicationCommandSession`**: a frame-bound owner, monotonic revision, rate limit, deadline, catalog revalidation (`stale-catalog`), risk `R0/R1/R2`, and `executable:false` capability rows. VERIFIED `src/main/application-command-session.ts:15-30`, `:142-147`, `:281-289`; `src/main/application-intents.ts:72-89`.
- **In-repo design intent** matching the kit ("verified | uncertain | failed | cancelled", OutcomeVerifier distinct from Executor): VERIFIED `docs/design/METIS-2.0-COMPUTER-CAPABILITY-MAP.md:62-85`.

### C.3 Gaps
- F4, F5, F6, F7 above.
- No operation, plan, attempt or step IDs. The proposal ID embeds action arguments (`${sessionId}:${revision}:${fingerprint}` with `create_note:hello`), VERIFIED `metis-command-proposal.ts:36`, `desktop-actions.ts:78-82`. That is acceptable in memory, but it must never reach audit or the ledger (ASSUMED risk; audit logs only `actionId` today, VERIFIED `command-control.ts:103`).
- No mode field.
- No `R3` class.
- No approval record binding snapshot, policy revision or agent.
- Legacy phase names (`idle|waking|listening|executing|deactivating|awaiting-confirmation`, VERIFIED `metis-wake.ts:5-10`, `metis-command-session.ts:21`) differ from the kit states. There is no `VERIFYING` or `UNKNOWN`.

### C.4 Proposed module: `src/shared/contracts/command.ts` (Appendix A.4)
- **`CapabilityDefinition<A>`**: every L295 field, including `postcondition: PostconditionKind` and `mode: InteractionMode`.
  - `capabilityDefects` refuses R3 without exact approval and a non-act mode that claims a target effect.
  - `eligibleCapabilities` filters by platform, prerequisites, policy and prohibited status **before any model call**.
- **`Operation`** (with `OperationSource`: voice with generation and utterance revision, typed with submit revision, or agent run), **`Plan`** (`mode`, `decidedBy: deterministic | model {attemptId, provider}`) and **`PlannedStep`** (target `{targetId, snapshotId}`, expiry).
- **`DecisionRequest`/`DecisionResponse`** follow the L929 example, adding `attemptId`, `policyRevision`, `intentSpan` (exact user span) and `confidence | null`.
  - `applyDecision` returns one of `ATTEMPT_MISMATCH|SNAPSHOT_STALE|GENERATION_STALE|POLICY_CHANGED|CLARIFY|NONE|NOT_A_CANDIDATE`, or `applied`. An applied candidate then goes through the **same deterministic preview and approval path** (SRC-03).
- **`ApprovalRecord`** and `checkApproval(approval, liveAuthority)` return `EXPIRED|CONSUMED|SESSION_DEAD|GENERATION_CHANGED|POLICY_CHANGED|PLAN_CHANGED|TARGET_CHANGED|AGENT_CHANGED`. Nonce and webContents binding stay main-only in `CommandControl`.
- **`StepOutcome`** = `not-dispatched | unsupported | attempted | verified{receipt} | failed{sideEffect: none|possible} | cancelled{committedBeforeCancel} | unknown`.
  - `VerifierReceipt` is a branded type that only the verifier module constructs.
  - `classifyStep(adapterResult | {threw}, receipt, postcondition)`: an adapter cannot self-certify. A throw after dispatch is `unknown`. `none-observable` can never be `verified`.
- **`retryDecision`**: `unknown` gives `reconcile-first`. A failure with a possible side effect is retried only if idempotent, otherwise reconciled. Retries are capped at `MAX_SAFE_RETRIES = 2`. A stop gives `no-retry`.
- **`userFacingResult`**: only `verified` reads as "done". `attempted` reads as "tried, unconfirmed", and a cancel after commit reads as "uncertain".
- **`COMMAND_STATES`/`COMMAND_TRANSITIONS`/`canTransition`** follow L321-332. `→ COMPLETED` requires a `verified` outcome. `LEGACY_PHASE_MAP` maps the current phases.
- **`CommandSurfaceStatus {readyToType, speechProviderReady, decisionProvider, lastStep}`**: the four RUN-ORDER claims are independent fields.
- The proposed additive field **`DesktopActionResult.sideEffect?: 'none'|'possible'`** lets an adapter report "app missing, nothing happened". Without it, a dispatched failure defaults to `possible`.

### C.5 Invariants and tests (proposed `src/shared/contracts/command.test.ts`; golden `__golden__/step-outcome.v1.json` SO-01..13, Appendix B.2; inline DC/AP/CP/TR in Appendix D)

| ID | Invariant | Case |
|---|---|---|
| C1 | No adapter result without a matching receipt ever yields `verified` or "done", including an adapter's own `verified`. | SO-01, SO-02, SO-04, SO-05 |
| C2 | A throw after dispatch is `unknown` with `reconcile-first`. A throw before dispatch is a failure with no side effect. | SO-11, SO-12 |
| C3 | Retries are finite and classified. Stop prevents any further dispatch. | SO-06..08, SO-13 |
| C4 | A cancel after commit is never "nothing happened". | SO-10 |
| C5 | A decision is applied only for the same attempt, snapshot, generation and policy, and only for a candidate in the submitted set. | DC-01..07 |
| C6 | Approval is invalidated by expiry, consumption, a dead session, generation, policy, plan, target or agent change, and cannot be replayed. | AP-01..09 |
| C7 | Capabilities filtered by platform, permission or prohibition never reach a model. | CP-03 |
| C8 | `EXECUTING → COMPLETED` is impossible. `VERIFYING → COMPLETED` needs `verified`. | TR-01..03 |

Extend the existing `src/main/command-control.test.ts` (cases at `:43`, `:64` and `:135` already point this way, VERIFIED): assert `confirm()` returns the contract `StepOutcome` kind rather than collapsing to `adapter_failed`.

---

## 6. Contract D — Policy, privacy readiness, consent and retention

### D.1 Kit requirements
- **Settings semantics** (L420, L424): owner is user, device or organization. Policy revision takes effect at a safe boundary; emergency revocation is immediate.
- **Org policy** (L837): wins, is locked, and is not weakened by malformed input.
- **Consent and storage** (L1442-1444): OS permissions at a gesture. Summary/action-only storage covers temporary files, queues, exports and traces.
- **Observability** (L1448): metadata-only diagnostics. A sampled trace cannot be the ledger.
- **Content classes** (L1455): audio, transcripts, command text, vocabulary, prompts, responses and content-derived embeddings/hashes are content.
- **Route evidence** (L1461-1467): per-route qualification record; privacy readiness is `UNREVIEWED|CONFIGURED|VERIFIED|BLOCKED`, tied to the deployed config revision. No real content before VERIFIED, and a UI boolean is not evidence.
- **Sinks** (L1471-1482): the persistence denylist and permitted stores. Durable Object storage is metadata-only.
- **Controls** (L1486-1500): a deliberately configured gateway (not auto-created `default`). Logs and cache are off before protected content. Headers are defence in depth. An allowlist projection runs before every sink, and hashes of short utterances are not stored.
- **Drift** (L1508): fail new content sessions closed while typed/manual functions keep working.
- **Consent records** (L1526): versioned and purpose-scoped; never buried in a model-install toggle.
- **SRC-02** (L4026): Entra authenticates, a signed license/lease grants the entitlement, and telemetry supplies neither.
- **SRC-17** (L4206): production rejects memory/placeholder stores.
- **SRC-21** (L4254): titles, URLs, OCR and filenames are content.
- **Retention proposal** (L1158): 30 d raw operational events and 90 d aggregates, "subject to the actual accounting/privacy policy".

### D.2 What exists
- Allowlist ingest projection: VERIFIED `src/shared/operator.ts:173-237`, applied before enqueue (`src/main/operator-ingest.ts:225-236`) and before storage (`operator/src/index.ts:402`).
- Private event details are nulled for `ask|crm|heartbeat`: VERIFIED `operator/src/privacy.ts:86-91`.
- Retention constants: VERIFIED `operator/src/retention.ts:21-29` (events 30 d, audit 365 d, **asks 90 d raw rows**, crm 90 d).
- Locked keys and managed layers: VERIFIED `src/main/store.ts:159-162`, `:276-287`.
- Summary-only profile flag: VERIFIED `src/shared/enterprise-live-profile.ts:21-25`, `:59-62`.
- `prompt_cipher`/`prompt_iv` columns exist in D1 `asks`, but every production writer sets them to null: VERIFIED `operator/schema.sql:47-48`, `operator/src/index.ts:483`, `operator/src/ask-meter.ts:62`, `operator/src/privacy.ts:77`. The fixture at `operator/src/render/fixture.ts:835` writes placeholder blobs (demo/test only).

### D.3 Gaps
- F3, F12, F13 above.
- No route qualification record or privacy readiness state.
- No sink allowlist as data.
- No consent purpose, version or epoch.
- Raw `asks` rows are kept 90 d against the kit's proposed 30 d raw/90 d aggregate split. That is an owner decision, not a defect: the kit marks it "proposed".
- The encrypted-content columns (`prompt_cipher`) remain in the schema. L1476 says "no encrypted content blob disguised as telemetry", so they should be contracted out (expand/contract, TASK-015/034). Retaining them is ASSUMED harmless today because all writers set null.

### D.4 Proposed module: `src/shared/contracts/policy.ts` (Appendix A.5)
- **`DataClass`** = `content|content-derived|operational-metadata|usage-metadata|identity-admin|security-audit|authored-software`. The doc comment lists titles, URLs, OCR, filenames and hashes as content.
- **`Sink`** plus **`SINK_ALLOWS`**, an allowlist mirroring the L1471-1480 table: gateway log and CF cache allow **nothing**; R2 allows authored software only; local knowledge is the only content sink. **`sinkAllows(sink, class)`** is used by every logger, outbox and export writer.
- **`RouteQualification`** `{routeId, modelId, operator (workers-ai vs provider-native BYOK vs unified billing vs direct vs on-device), transport, gatewayId, gatewayLogs, gatewayCache, readiness, configRevision, liveConfigRevision, reviewedAt, owner}`.
  - **`routeAdmitsContent`** requires VERIFIED, no drift, logs off (or approved metadata-only), cache off, a gateway other than `default`, and a named owner and review.
- **`ConsentRecord`** `{purpose, noticeVersion, basis, epoch, grantedAt, withdrawnAt, policyRevision}` over purposes `command-capture|wake-detection|meeting-transcription|meeting-summary-storage|shared-knowledge-publication|screen-context`.
- **`captureAllowed({purpose, consents, currentNotice, liveEpoch, policyStatus, route})`** has **no speech-selection parameter**, so a default can never stand in for consent.
- **`consentFromLegacyRecordingFlag`** maps the legacy flag to meeting scope with notice `legacy-1.x`.
- **`StoragePolicy`**, **`RetentionPolicy`** + `PROPOSED_RETENTION` (flagged `source:'proposed-default'`), and **`EffectivePolicy`** (`absent|invalid|valid`, with `applyAt`).
- **`EntitlementGrant`** (branded; only the license verifier constructs it) and **`productionStoreAcceptable`** (SRC-17).

### D.5 Invariants and tests (proposed `src/shared/contracts/policy.test.ts`; golden `__golden__/capture-consent.v1.json` CS-01..09, Appendix B.3)

| ID | Invariant | Case |
|---|---|---|
| P1 | A Cloudflare default selection with no consent record means capture is denied (`NO_CONSENT`). | CS-01 |
| P2 | The legacy boolean is meeting-scoped and pre-2.0, so it gives `NOTICE_OUTDATED` until reaffirmed. | CS-02 |
| P3 | Purpose scope: meeting consent does not cover command capture. | CS-03 |
| P4 | Withdrawal and epoch bump deny. | CS-04, CS-08 |
| P5 | Auto `default` gateway, unknown logs/cache, and config drift each deny (`ROUTE_NOT_VERIFIED`). | CS-05, CS-06 |
| P6 | Malformed policy denies. | CS-07 |
| P7 | `sinkAllows(s, 'content')` is true only for `local-knowledge`. | table test over `SINKS` |
| P8 | Production with a memory or missing store is not acceptable. | unit |

Content-sentinel tests across real sinks (L1504) belong to TASK-015/057. This contract supplies the allowlist they assert against.

---

## 7. Contract E — Metering: usage record, provenance, idempotency and money

### E.1 Kit requirements
- **Attempts** (L1132): an operation has zero or more attempts. Each chargeable attempt has a stable server-trusted identity and is recorded once. Retransmission is not a charge; a new model call may be.
- **Authority** (L1134): prefer server-authoritative usage. Client metadata may merge but not erase. Reject cross-principal overwrites. Late or less-authoritative data cannot downgrade. Corrections need explicit provenance.
- **Quantities** (L1136): provider-specific normalized fields. Literal zero vs missing vs estimated vs partial vs provider-reported. Cumulative snapshots are not deltas.
- **Required fields** (L1140): scope, user/device/session, operation/attempt/step, provider/model/checkpoint and pricing revision, timestamps, status, quantities and units, authoritative source, completeness, route/funding, safe error. No content, hashes or previews.
- **Money** (L1142): tariff currency and dates, decimal/integer-safe arithmetic, vendor cost vs allocation, alias resolved to the billed model. Unknown tariff means unknown cost, not zero.
- **Streaming and durability** (L1146-1150): streaming usage contract fixtures per provider. A failed metering write surfaces accounting-health degradation. No unbounded retries. Event time vs ingest time. Hard caps need atomic reservation.
- **Speech** (L1154-1158): speech quantities per track, sent vs processed vs wall clock, a metadata-only ledger when content logging is off, and allowlisted outbox metadata. Unknown is null plus a reason.
- **Mandatory cases** (L1162-1178): the §13.5 table.
- **Laya** (L952): "no Jev fee" is not "free"; show the billing basis.
- **SRC-10** (L4120-4124): merges and aggregates independent of the 2,000-row detail limit.

### E.2 What exists
- **Ingest projection** with numeric allowlist and closed enums: VERIFIED `src/shared/operator.ts:178-237`.
- **Owned upsert** with a cross-device `WHERE` guard and null-coalescing merge that keeps a delivered failover over a failed leg: VERIFIED `operator/src/d1.ts:74-110`, `:378-382`; `operator/src/store.ts:137-168`. The SRC-10 "late null erases 120/30" case is **already mitigated** by `COALESCE(excluded.x, asks.x)` (VERIFIED `d1.ts:105`). A late non-null lower-authority value still overwrites.
- **Streaming usage**: last-value-wins per event (`operator/src/ask.ts:381-383`, VERIFIED). That is correct for cumulative providers but wrong for delta semantics. No semantics are declared per provider.
- **Failed provider legs** get their own random ID so they do not downgrade the delivered one: VERIFIED `operator/src/ask.ts:237-239`.
- **Durable bounded client outbox** (500 items, backoff, dropped counter): VERIFIED `src/main/operator-queue.ts:1-40`.
- **List-price estimate**: never invents $0 when tokens are missing entirely (VERIFIED `src/shared/operator.ts:380-403`). It uses float USD and has no tariff revision or effective date (`:342-369`), and it treats a missing output count as `0` once input is known (`:392-394`).
- **Dashboard**: `listAsks(2000)` as the base for dashboard figures, VERIFIED `operator/src/dashboard.ts:736`. SRC-10 is still present; owner TASK-045.

### E.3 Gaps
F10 and F11 above. Also missing: a quantity state/provenance model, count semantics, tariff revision and effective dates, integer money, an accounting-health signal on write failure, and a budget reservation contract.

### E.4 Proposed module: `src/shared/contracts/usage.ts` (Appendix A.6)
- **`Quantity`** = `known | partial (lower bound) | estimated {method} | unavailable {reason}`, each with `unit` and `provenance`. Literal zero is `known, 0`.
- **`QUANTITY_KEYS`**: input, output, cache read/write/uncached, reasoning tokens, requests, decisions, `audioSentMs`, `audioProcessedMs`, `computeMs`, `unitsBilled`, each with a fixed unit (`UNIT_OF`).
- **`UsageRecord`**:
  - identity: `usageEventId` (delivery), `attemptId` (charge, UNIQUE), `operationId`, `stepId`
  - `scope`: server-derived
  - `route`: kind, provider, `modelRequested` vs `modelBilled`, checkpoint, routeId, `fundingPath`
  - `tariffRevision`
  - `timing`: event vs ingest time
  - `status`: `in-progress|completed|failed-billable|failed-nonbillable|cancelled|unknown`
  - `quantities`, `speech {track, epoch, wallClockMs, transport}`, `authority`, `completeness`, `errorClass`
  - `correction`: explicit
- **`accumulate(prev, value, 'cumulative'|'delta'|'final-only')`**: cumulative takes the max, and a decrease is flagged as an anomaly, never summed.
- **`mergeQuantity`**: provenance rank (provider > gateway > server > client > estimated), then state rank (known > partial > estimated), then max. `unavailable` never overwrites.
- **`mergeUsageRecord`** returns `inserted | merged | duplicate-delivery`, or `OWNERSHIP_CONFLICT | ATTEMPT_MISMATCH | SCHEMA`. Terminal status is sticky, server-authoritative fields win, and only an explicit `correction` lowers a known quantity.
- **`aggregateUsage`**: the full-window reducer that the D1 SQL aggregate must equal. It throws on a duplicate attempt row.
- **`Tariff`** uses integer `microsPerMillion`, a revision and effective dates. **`costOf`** computes in bigint pico-currency and returns `known | partial {lowerBound, missing} | unknown {NO_TARIFF|TARIFF_NOT_EFFECTIVE|NO_PRICED_QUANTITY}`.
- **`projectUsageRecord(raw, serverScope, ingestTime)`**: allowlist-only. A malformed quantity rejects the record instead of coercing to 0. Payload scope is ignored and authority is always `client-supplementary`.
- **`BudgetReservation`**: shape only. Atomicity belongs to the TASK-034 store (D1 transaction or Durable Object).

**Proposed D1 shape for TASK-034 (not written):** add `usage_attempts` (PK `attempt_id`, owner columns, one column per quantity, value + state + provenance, `tariff_revision`, `status`, timestamps) and `usage_deliveries` (PK `usage_event_id` → `attempt_id`) through `schema-alter.sql`. Keep `asks` read-compatible during expand/contract (L1140, L1309). KPIs come from `SUM`/`COUNT` over `usage_attempts` for the window, never from `listAsks(n)`.

### E.5 Invariants and tests (proposed `src/shared/contracts/usage.test.ts` and `operator/src/usage-ledger.test.ts`; golden `__golden__/usage-ledger.v1.json`, Appendix B.4)

| §13.5 row (MASTER line) | Case | Result (reference) |
|---|---|---|
| 2,001 one-token attempts (L1164) | UL-01 | aggregate attempts = 2001, output = 2001 |
| 120/30 survives a later client omission (L1165) | UL-02 (+UL-03 lower-rank estimate) | 120/30 |
| another device reuses an attempt ID (L1166) | UL-04 | `OWNERSHIP_CONFLICT`, stored value unchanged |
| cumulative 1, 15, 30 → 30 (L1167) | UL-05 | 30; delta 1, 14, 15 → 30; a decrease is an anomaly |
| two attempts, one operation, retry redelivery (L1168) | UL-06 | 2 attempts, 1 operation, `duplicate-delivery` |
| interrupted partial (L1169) | UL-07 | cost `partial`, lower bound 3,600,000,000 pico-USD |
| cache breakdown missing (L1170) | UL-08 | known totals + `unavailable` count 1 |
| Laya decisions, no tokens (L1171) | UL-09 | decisions tariff `known`; token tariff `unknown` |
| Apple zero cost, tokens unavailable (L1172) | UL-10 | cost known 0; tokens stay unavailable |
| shared device switches user (L1173) | UL-11 | `OWNERSHIP_CONFLICT` |
| concurrent hard budget (L1174) | — | **not a pure-function test**; TASK-034 store-level concurrency test |
| two tracks + reconnect (L1175) | UL-13 | 3 attempts, 1 operation; sent 150,000 ms vs processed 89,500 ms + 1 unavailable |
| gateway logging disabled (L1176) | — | deployment test (TASK-057) |
| speech error carries transcript (L1177) | UL-15 | projected record has no sentinel; `errorClass` null; scope from server |
| cancelled stream (L1178) | UL-16 | cost `unknown` (`NO_PRICED_QUANTITY`), sent quantity kept |
| extras | UL-17..20 | malformed quantity rejected; no tariff / not-effective tariff give unknown; lowering needs explicit correction |

---

## 8. Contract F — AGSTEP-02: agent identity, run, context coverage, one input writer

AGSTEP-02 (MASTER L4609-4615; `plan/AGENT-EXPANSION.json:711`) asks for stable definitions, run identities, source coverage, policy/consent epochs, artifact handles and one desktop writer lease. The kit's own reference `integration/agents/agent-contract.js` says it "is NOT an authentication implementation … durable database … deployable executor". I read it (VERIFIED) and reused its shape, not its code.

- **Kit requirements:**
  - `AgentDefinition` fields and "a role description cannot grant tools or financial limits" (L4421).
  - `Run` pins agent/version, conversation, principal, surface, intent, context revisions, policy/consent epoch, route, operation/attempt IDs and lifecycle. Callbacks validate every identity plus the generation (L4423).
  - `ContextSnapshot` with coverage `FULL|PARTIAL|VISIBLE_ONLY|UNAVAILABLE`; unsaved buffer vs disk (L4443-4445).
  - Capture before opening the overlay and exclude Métis surfaces (L4451; HC-24).
  - One input writer per device (L4495). Approval binding across agents (L4499).
- **What exists:** no `AgentDefinition`, `InputLease` or `ContextSnapshot` type in the source. VERIFIED `git grep -n -E 'AgentDefinition|InputLease|ContextSnapshot' -- src` exits 1 (no match), and the same grep over `operator/src native-app intelligence/src` prints nothing. `speaker-id.ts` has a `policyEpoch` pattern (VERIFIED `src/main/speaker-id.ts:147`, `:262`, `:456`) that the epoch design reuses.
- **Proposed module:** `src/shared/contracts/agent.ts` (Appendix A.7) with `AgentDefinition` (+ `AUTHORITY_FIELDS`, `authorityChanged`), `Run`, `acceptRunCallback`, `ContextSnapshot` + `snapshotWellFormed`, and `InputLease` + `acquireInputLease`.
- **Tests** (inline AG-01..06):
  - Renaming or changing role text is not an authority change; changing `capabilityProfileId` is.
  - A late callback is rejected.
  - A second run gets `DEVICE_BUSY`.
  - A screenshot must exclude Métis surfaces and can never be FULL coverage.
- The **HC-04** (one trusted executor + outcome verification) and **HC-10** (screen content is context, not routing consent) adaptations are carried by Contract C's `mode` and `StepOutcome` rather than separate types.

---

## 9. Proposed module layout (implementation target; nothing written to the repo)

```text
src/shared/contracts/
  ids.ts                 # branded IDs, counters, CONTRACT_VERSIONS, mintId/parseId          (App. A.1)
  speech-engine.ts       # selection/policy/readiness/resolver/migration                      (App. A.2)
  speech-session.ts      # session request/grant, epochs, segments, finalization, SaveResult  (App. A.3)
  command.ts             # capability, operation/plan/step, decision, approval, outcome       (App. A.4)
  policy.ts              # data classes, sinks, route qualification, consent, retention       (App. A.5)
  usage.ts               # usage record, accumulate/merge/aggregate, tariff/cost, projection  (App. A.6)
  agent.ts               # AGSTEP-02 definitions, run, context snapshot, input lease           (App. A.7)
  index.ts               # re-exports only
  __golden__/
    speech-selection.v1.json   capture-consent.v1.json   step-outcome.v1.json   usage-ledger.v1.json
    segment-revision.v1.json   # to promote from inline SG cases
  speech-engine.test.ts  speech-session.test.ts  command.test.ts  policy.test.ts  usage.test.ts
  agent.test.ts          golden-sync.test.ts   # sha256 equality with the Swift fixture copies
operator/src/usage-ledger.test.ts              # D1 SQL aggregate == aggregateUsage over the same fixtures (TASK-034)
native-app/MetisKit/Sources/MetisKit/Contracts/
  SpeechEngineContract.swift (App. C.1)   StepOutcome.swift   SpeechSegment.swift   SaveResult.swift
native-app/MetisKit/Tests/MetisKitTests/
  ContractGoldenTests.swift   Fixtures/*.json  (byte-identical copies)
  Package.swift change: .testTarget(name: "MetisKitTests", dependencies: ["MetisKit"], resources: [.copy("Fixtures")])
```

Existing files adopted, in the implementing change and tasks named:
- `src/shared/cloud-stt-provider.ts` becomes a legacy shim (TASK-005)
- `src/main/store.ts` migration (TASK-005/027)
- `src/shared/enterprise-live-profile.ts` invalid status (TASK-005)
- `src/main/index.ts` resolver owner (TASK-005/020)
- `src/main/command-control.ts` returns `StepOutcome`, wires `policyAllows` (TASK-005/033)
- `src/main/metis-command-runtime.ts` `applyDecision` (TASK-031/032)
- `src/main/cloud-stt/adapter.ts` + `live-session.ts` segment keys, epochs, tracks (TASK-017/018)
- `src/shared/operator.ts` `usage` event (TASK-015/034)
- `operator/src/{ask,use,ask-meter,d1}.ts` attempt/delivery IDs and metering health (TASK-034)
- `native-app/App/Store/PersistedModels.swift` `SaveResult` (TASK-029)

The vitest include globs already discover `src/**/*.test.ts` (VERIFIED `vitest.config.ts` `include`) and `operator/src/**/*.test.ts` (VERIFIED `operator/vitest.config.ts:45`). CI runs both (VERIFIED `.github/workflows/build.yml:56`, `:111`).

---

## 10. Test plan summary

| Layer | What | Where | Counts as |
|---|---|---|---|
| Pure contract (TS) | SM/CS/SO/UL golden + SG/DC/AP/CP/TR/AG inline + properties I1/I2/I7 | `src/shared/contracts/*.test.ts` | synthetic contract proof only |
| Pure contract (Swift) | the same golden JSON through the Swift mirror | `MetisKitTests/ContractGoldenTests.swift` | synthetic parity; **not run in CI today** (D4) |
| Drift guard | golden files byte-identical across TS and Swift | `golden-sync.test.ts` | structural |
| Inverted legacy test | `asr-engine.contract.test.ts:38` changes from "RAM chooses" to "RAM never chooses" | same file | deliberate behaviour change, reviewed |
| Store-level | D1 aggregate equals `aggregateUsage`; attempt uniqueness; cross-device guard; budget race | `operator/src/usage-ledger.test.ts` (TASK-034) | still not deployed reconciliation (L1180) |
| Live (not TASK-005) | real capture → Cloudflare transcript → decision → verified action → ledger | TASK-020/056/057 | the only product pass |

---

## 11. Verification performed for this design (synthetic; scratchpad only)

All commands ran in `$SCRATCH` = `/private/tmp/claude-501/-Users-tony-Library-CloudStorage-OneDrive-MantuGroup-Documents-TEST/3ccc2657-3de3-4b14-91b4-2195d410e764/scratchpad`. The source worktree was used **read-only**, only to invoke its already-installed compiler binaries. No npm script was run there. `metis-2.0-exec/receipts/npm-ci.log` shows `npm ci exit=0`.

| # | Command | Result |
|---|---|---|
| V1 | `node_modules/typescript/bin/tsc -p $SCRATCH/contracts/tsconfig.json` (TS 5.9.3; ES2022, Bundler, `strict`, plus `noUnusedLocals`/`noUnusedParameters`, `types: []`) | exit 0. Options match `tsconfig.node.json` and are stricter; `types: []` also mimics the Worker (`operator/tsconfig.json`). |
| V2 | `node_modules/.bin/esbuild selfcheck.mts --bundle --platform=node --format=esm` then `node out/selfcheck.mjs` (Node v22.22.3) | `{"pass":366,"fail":0}`. Covers SM-01..20 with I1/I2/I7 per case, CS-01..09, SO-01..13, UL-01..20, SG-01..15, DC-01..07, AP-01..09, CP-01..03, TR-01..03, AG-01..06. |
| V3 | Mutation control: copy; disable the I6 guard, let adapter `verified` self-certify, sum cumulative counts; rerun | `pass 346 fail 17`: SM-08/10/20, SO-02/04/05, UL-05. The checks are not vacuous. |
| V4 | Direct toolchain `swiftc -swift-version 6 -sdk MacOSX.sdk` on `SpeechEngineContract.swift` + `main.swift` (Apple Swift 6.4, swiftlang-6.4.0.34.1) | builds. `golden speech-selection.v1.json` gives `pass=124 fail=0`. |
| V5 | Swift negative control on a tampered copy (SM-08, SM-14 expectations altered) | `pass=119 fail=3`, exit 1 |
| V6 | `git hash-object` on `src/shared/cloud-stt-provider.ts`, `src/main/cloud-stt/credentials.ts`, `src/main/cloud-stt/live-session.ts` | `28c95473…`, `3a2f1e86…`, `aba6648d…`, equal to kit R49/R50/R51 blobs (MASTER L3430, L3436, L3442). Those anchors are unchanged at HEAD. |

The `/usr/bin/swiftc` xcrun shim fails in the sandbox with `couldn't create cache file '/var/folders/…/xcrun_db-…' (errno=Operation not permitted)`. The Xcode toolchain binary works with `TMPDIR` pointed into the scratchpad.

**Not verified:** no repo test was run, and nothing was built or run in the Electron app, the native Mac app, the Operator Worker or Cloudflare. No provider frame was observed. The TS↔Swift parity covers the speech-selection fixture only; outcome, consent and usage have no Swift mirror yet.

---

## 12. Traceability (TASK-005 closure references → where handled)

| Ref | Kit line | Handled in | Status for TASK-005 |
|---|---|---|---|
| SRC-02 | L4020-4030 | §6 `EntitlementGrant`; telemetry cannot construct entitlement | contract only; store and authority choice are TASK-006/034 |
| SRC-03 | L4032-4042 | §5 `applyDecision`, DC-01..07 | contract; application in TASK-031/032 |
| SRC-04 | L4044-4054 | §5 `StepOutcome`/`classifyStep`/`retryDecision`, SO-01..13; F6 anchor moved | contract; adapters and verifier in TASK-033 |
| SRC-06 | L4068-4078 | §4 `CommandUtterance.original` (SG-12) | contract; acoustic wake is TASK-019 |
| SRC-11 | L4128-4138 | §4 `SaveResult`/`DecodeResult` | contract; native store in TASK-029 |
| SRC-16 | L4188-4198 | §3 capabilities independent; installed ≠ selected | contract; package profiles in TASK-021/026 |
| SRC-17 | L4200-4210 | §6 `productionStoreAcceptable` | contract; deployment identity in TASK-012/062 |
| SRC-21 | L4248-4258 | §6 `DataClass` includes titles, URLs, OCR, filenames | contract; sentinel tests in TASK-015/057 |
| SRC-24 | L4284-4294 | §2 D4 (Swift tests not in CI), §9 test owners | open: CI owner needed |
| EXP-02 | L3914-3920 | §4 `HumanNote`, `UserCorrection`, `GeneratedArtifact` | contract |
| EXP-07 | L3954-3960 | §4 purposes incl. `import`, gaps, `commandUtteranceFrom` rejects non-command | contract; occurrence lease is TASK-049/050 |
| EXP-09 | L3970-3976 | §5 `StepOutcome`/`userFacingResult`, §4 `SaveResult` | contract |
| AGX-02 / HC-10 / HC-11 / HC-24 | JSON L24; OBS L223, L247, L654 | §8 `ContextSnapshot`, `snapshotWellFormed`; §5 `mode` | contract |
| AGX-06 / HC-07 / HC-26 | JSON L94; OBS L150, L706 | §8 `AgentDefinition`, `AUTHORITY_FIELDS` | contract |
| AGX-09 / HC-04 / HC-16 | JSON L145; OBS L69, L385 | §8 `InputLease`, `acceptRunCallback`; §5 verifier | contract |
| AGSTEP-02 | L4609-4615; JSON L711 | §8 | contract; "native/service proof" remains open |

---

## 13. Open decisions for owner review (all ASSUMED; not decided by code)

1. **Ambiguous legacy `whisper` (SM-07).** I proposed a visible choice while the legacy local Whisper keeps running. The alternative is to block capture until the user chooses. Both satisfy L837.
2. **Completed profiles that never chose (SM-08/10).** I proposed a migrated Cloudflare default gated by an acknowledgment, with Parakeet as the interim if it is still installed. If a lean 2.0 upgrade removes the bundled Parakeet, capture blocks until acknowledgment (SM-10). An owner may prefer an explicit choice screen instead.
3. **Legacy `recordingConsent`.** I proposed mapping it to meeting scope with `NOTICE_OUTDATED` under the 2.0 notice, so reaffirmation is required. Only a privacy owner can decide whether the legacy acknowledgment carries over (L1524-1526).
4. **Silent Parakeet→Whisper runtime swap** (`listen.ts:1564-1571`). Keep it only as an accepted exact fallback, or turn it into a visible stop.
5. **Retention.** Keep today's 90 d raw `asks` rows, or adopt the kit's proposed 30 d raw plus 90 d aggregates (L1158 says "proposed").
6. **`R3` risk class** for high-impact actions, which is additive to today's R0-R2.
7. **Adapter `sideEffect` field**: an additive change to `DesktopActionResult`.
8. **Segment key derivation** depends on real Nova-3/Workers AI interim semantics. TASK-018 must pin it with provider fixtures (§4.B.5 note).
9. **Contract location.** `src/shared/contracts/` is a new directory. Alternatively, types could be folded into the existing flat `src/shared/*.ts` files. I chose a directory so that the Worker import surface stays explicit.

## 14. Blockers, UNKNOWN and NOT_AVAILABLE

| Item | State | Exact evidence | Smallest unblock |
|---|---|---|---|
| TASK-002 outputs (locked PRD, effective policies, release lanes), TASK-005's only dependency | NOT_AVAILABLE in exec dir | `ls /Users/tony/AI-Brain-build/metis-2.0-exec/tasks/*` → `(eval):1: no matches found: /Users/tony/AI-Brain-build/metis-2.0-exec/tasks/*` (at session start) | Produce TASK-002 scope and policy decisions. Design can proceed; closure cannot (L1889). |
| Deployed Operator `/v1/decide` handler | UNKNOWN (deployed); ABSENT in repo | `git grep "v1/decide"` shows client and docs only | TASK-031: inspect the deployed Worker (read-only `wrangler deployments list` outside sandbox, not run here) or implement the route. |
| Nova-3 via Workers AI real-time frame semantics (interim `start` stability, terminal Metadata through the Cloudflare route) | UNKNOWN | no live route exercised; kit R16/R45 are docs only | TASK-016/018 with authorized synthetic audio after TASK-013 privacy controls. |
| Swift tests in CI | ABSENT | no `swift test`/`xcodebuild` in `.github/workflows/*.yml` | A SRC-24 owner adds a macOS job running `swift test` for MetisKit. |
| Route privacy readiness evidence (gateway config revision, logs/cache state) | UNKNOWN | not inspected; no Cloudflare calls made | TASK-011/013. |
| Owner decisions §13 (1–5) | OPEN | — | Product/privacy owner sign-off. |

No secrets, tokens, license keys or account IDs were copied into this document. The account/gateway values shown are fixture strings only.

---
## Appendix A — Proposed TypeScript contract modules (type-checked, V1)

### A.1 ids.ts

Proposed repo path: `src/shared/contracts/ids.ts` · reference file `$SCRATCH/contracts/ids.ts` · sha256 `7727f8f4f1012282829184a93175f9d4257dc858cea99861249de50e27598fa9` · 94 lines

```ts
/**
 * Métis 2.0 shared contract identities (TASK-005 proposal, not yet in the repo).
 * Dependency-free so Electron main, renderer, the Operator Worker and tests can all import it.
 * MASTER §3.2 L297: separate counters/IDs for operation, plan, model attempt, action step,
 * capture generation, target snapshot and usage event. No single `askId` plays every role.
 */
declare const brand: unique symbol
export type Brand<T, B extends string> = T & { readonly [brand]: B }

export type TenantId = Brand<string, 'TenantId'>
export type PrincipalId = Brand<string, 'PrincipalId'>
export type DeviceId = Brand<string, 'DeviceId'>
/** One user operation (a spoken or typed request). */
export type OperationId = Brand<string, 'OperationId'>
export type PlanId = Brand<string, 'PlanId'>
/** One independently chargeable provider/model attempt; server-trusted (§13.1 L1132). */
export type AttemptId = Brand<string, 'AttemptId'>
/** One action step inside a plan. */
export type StepId = Brand<string, 'StepId'>
export type TargetSnapshotId = Brand<string, 'TargetSnapshotId'>
/** One metering delivery. A retransmission reuses it; a new provider call never does. */
export type UsageEventId = Brand<string, 'UsageEventId'>
export type SpeechSessionId = Brand<string, 'SpeechSessionId'>
export type SegmentId = Brand<string, 'SegmentId'>
export type ApprovalId = Brand<string, 'ApprovalId'>
export type AgentId = Brand<string, 'AgentId'>
export type RunId = Brand<string, 'RunId'>
export type ConversationId = Brand<string, 'ConversationId'>
export type ConsentId = Brand<string, 'ConsentId'>
export type PolicyRevision = Brand<string, 'PolicyRevision'>

/** Monotonic counters. A late event carrying an older value can never revive work (§4.2 L334). */
export type CaptureGeneration = Brand<number, 'CaptureGeneration'>
export type StreamEpoch = Brand<number, 'StreamEpoch'>
export type SegmentRevision = Brand<number, 'SegmentRevision'>
export type ConsentEpoch = Brand<number, 'ConsentEpoch'>

export const CONTRACT_VERSIONS = {
  speechEngine: 'metis.speech-engine.v1',
  speechSession: 'metis.speech-session.v1',
  command: 'metis.command.v1',
  decision: 'metis.decision.v1',
  policy: 'metis.policy.v1',
  usage: 'metis.usage.v1',
  agent: 'metis.agent.v1'
} as const

export const ID_PREFIX = {
  operation: 'op',
  plan: 'plan',
  attempt: 'att',
  step: 'step',
  snapshot: 'snap',
  usage: 'use',
  speechSession: 'sps',
  approval: 'apv',
  run: 'run',
  consent: 'cns'
} as const
export type IdKind = keyof typeof ID_PREFIX
export type IdOf<K extends IdKind> = {
  operation: OperationId
  plan: PlanId
  attempt: AttemptId
  step: StepId
  snapshot: TargetSnapshotId
  usage: UsageEventId
  speechSession: SpeechSessionId
  approval: ApprovalId
  run: RunId
  consent: ConsentId
}[K]

const HEX = '0123456789abcdef'

/** Opaque, content-free ID. Randomness is injected (Web Crypto in Worker/Electron, seeded in tests). */
export function mintId<K extends IdKind>(kind: K, random: (bytes: number) => Uint8Array): IdOf<K> {
  const bytes = random(16)
  if (bytes.length !== 16) throw new TypeError('ID_ENTROPY')
  let body = ''
  for (const b of bytes) body += HEX[b >> 4] + HEX[b & 15]
  return `${ID_PREFIX[kind]}_${body}` as IdOf<K>
}

export function parseId<K extends IdKind>(kind: K, raw: unknown): IdOf<K> | null {
  if (typeof raw !== 'string') return null
  const prefix = `${ID_PREFIX[kind]}_`
  return raw.startsWith(prefix) && /^[a-f0-9]{32}$/.test(raw.slice(prefix.length)) ? (raw as IdOf<K>) : null
}

export function nextCounter<T extends CaptureGeneration | StreamEpoch | SegmentRevision | ConsentEpoch>(value: T): T {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('COUNTER_INVALID')
  return (value + 1) as T
}
```

### A.2 speech-engine.ts

Proposed repo path: `src/shared/contracts/speech-engine.ts` · reference file `$SCRATCH/contracts/speech-engine.ts` · sha256 `53769f2a7c042d5cb677502a781d3259ec929327641c5cf40066f31217419cff` · 418 lines

```ts
/**
 * Speech engine selection: selected vs allowed vs ready (MASTER §9.6 L835-837, §5.7 L420-422,
 * §9.10 L881, §14.7 L1260, §14.8 L1276-1283). Pure; no I/O, no hardware probe, no install state.
 */
import type { ConsentEpoch, PolicyRevision } from './ids'

/** One namespace replacing the split `asrEngine` (ipc.ts:1151) + `cloudSttProvider` (ipc.ts:1169). */
export const SPEECH_ENGINES = [
  'cloudflare-nova3',
  'soniox',
  'local-parakeet',
  'local-whisper',
  'local-apple'
] as const
export type SpeechEngineId = (typeof SPEECH_ENGINES)[number]
export type CloudSpeechEngineId = Extract<SpeechEngineId, 'cloudflare-nova3' | 'soniox'>
export type LocalSpeechEngineId = Exclude<SpeechEngineId, CloudSpeechEngineId>

/** §9.6 L833: every fresh eligible 2.0 Windows and native Mac profile defaults here. */
export const FRESH_2_0_DEFAULT_ENGINE: CloudSpeechEngineId = 'cloudflare-nova3'

export function isSpeechEngineId(raw: unknown): raw is SpeechEngineId {
  return typeof raw === 'string' && (SPEECH_ENGINES as readonly string[]).includes(raw)
}
export function isCloudEngine(e: SpeechEngineId): e is CloudSpeechEngineId {
  return e === 'cloudflare-nova3' || e === 'soniox'
}

/** Independent capabilities: none selects, installs or enables another (§14.7 L1260, §9.6 L835, §4.1 L317). */
export type IndependentCapability =
  | 'speech'
  | 'local-generation'
  | 'local-vision'
  | 'wake-detection'
  | 'apple-generation'

export type SelectionSource =
  | 'fresh-default' // fresh eligible 2.0 profile
  | 'user-explicit' // chosen in 2.0 Settings
  | 'legacy-explicit' // explicit pre-2.0 choice preserved by migration
  | 'migration-default' // pre-2.0 user who never chose; default applied with notice

/** A migration that turns a previously local route into a cloud route must be acknowledged first (§9.6 L837). */
export interface PendingAck {
  noticeVersion: string
  acknowledgedAt: number | null
  /** Legacy local engine that keeps running (no upload) until acknowledgment; never a cloud engine. */
  interim: LocalSpeechEngineId | null
}

export interface SpeechSelection {
  schemaVersion: 'metis.speech-engine.v1'
  engine: SpeechEngineId
  source: SelectionSource
  decidedAt: number
  pendingAck: PendingAck | null
}

export type NeedsChoiceReason =
  | 'ambiguous-legacy-whisper' // store.ts:815-825 persisted a RAM-derived Whisper indistinguishably from a user choice
  | 'conflicting-legacy-fields' // explicit local asrEngine + stored-but-never-effective cloud provider
  | 'fresh-not-eligible'

export interface PendingSelection {
  schemaVersion: 'metis.speech-engine.v1'
  engine: null
  source: 'needs-choice'
  reason: NeedsChoiceReason
  proposed: SpeechEngineId | null
  interim: LocalSpeechEngineId | null
  decidedAt: number
}
export type SelectionState = SpeechSelection | PendingSelection

/** A previously accepted exact fallback pair (§9.10 L881). Fallback defaults are OFF. */
export interface ExactFallback {
  from: SpeechEngineId
  to: SpeechEngineId
  acceptedAt: number
  consentEpoch: ConsentEpoch
}

export type SpeechPolicy =
  | { status: 'absent' }
  /** Malformed managed policy fails closed; it never degrades to the unmanaged legacy default (§9.6 L837). */
  | { status: 'invalid'; policyRevision: PolicyRevision | null }
  | {
      status: 'valid'
      policyRevision: PolicyRevision
      allowed: readonly SpeechEngineId[]
      /** Locked engine; wins over any selection. */
      enforced: SpeechEngineId | null
      /** Org default for profiles without an explicit choice; also replaces a disallowed choice, visibly locked. */
      orgDefault: SpeechEngineId | null
      exactFallback: ExactFallback | null
    }

/** §9.7 L853 readiness rungs; each is observed independently and none implies another. */
export const READINESS_RUNGS = [
  'policy-loaded',
  'device-authorized',
  'service-reachable',
  'config-qualified',
  'microphone-allowed',
  'tracks-ready',
  'transcript-received'
] as const
export type ReadinessRung = (typeof READINESS_RUNGS)[number]
export type RungState = 'pass' | 'fail' | 'unknown'

export interface EngineReadiness {
  engine: SpeechEngineId
  observedAt: number
  rungs: Readonly<Partial<Record<ReadinessRung, RungState>>>
  /** Local packs only. Installed bytes are never consent to select or load (§14.7 L1260, §14.8 L1280). */
  installed?: boolean
  selfTest?: 'pass' | 'fail' | 'not-run'
}

/** Rungs that must pass before a session may start; mic/tracks/transcript are per-session (speech-session.ts). */
const PRE_SESSION_RUNGS: readonly ReadinessRung[] = ['policy-loaded', 'device-authorized', 'service-reachable', 'config-qualified']

export function engineUsable(r: EngineReadiness | undefined): boolean {
  if (!r) return false
  if (isCloudEngine(r.engine)) return PRE_SESSION_RUNGS.every((k) => r.rungs[k] === 'pass')
  return r.rungs['policy-loaded'] === 'pass' && r.rungs['config-qualified'] === 'pass' && r.installed === true && r.selfTest === 'pass'
}

export type BlockedReason =
  | 'POLICY_INVALID'
  | 'NEEDS_CHOICE'
  | 'NOT_ALLOWED_BY_POLICY'
  | 'MIGRATION_ACK_REQUIRED'
  | 'PRIVACY_NOT_VERIFIED'
  | 'NOT_READY'

export type EffectiveSpeech =
  | {
      status: 'ready'
      selected: SpeechEngineId | null
      effective: SpeechEngineId
      via: 'selected' | 'org-enforced' | 'org-default' | 'accepted-exact-fallback' | 'interim-legacy-local'
      locked: boolean
      policyRevision: PolicyRevision | null
    }
  | {
      status: 'blocked'
      selected: SpeechEngineId | null
      effective: null
      reason: BlockedReason
      locked: boolean
      policyRevision: PolicyRevision | null
    }

export interface ResolveInput {
  selection: SelectionState
  policy: SpeechPolicy
  readiness: ReadonlyMap<SpeechEngineId, EngineReadiness>
  /** Route privacy readiness === VERIFIED for this cloud engine's route (policy.ts routeAdmitsContent). */
  privacyVerified: (engine: CloudSpeechEngineId) => boolean
}

/**
 * Invariants (pinned by speech-engine.test.ts):
 *  I1 never mutates or rewrites `selection` (readiness failure cannot rewrite the selected engine);
 *  I2 an installed/ready but unselected local engine never becomes effective except as an accepted exact fallback;
 *  I3 no automatic fallback between engines; cloud never replaces local-only and vice versa;
 *  I4 malformed policy blocks content capture (typed/manual remain usable elsewhere);
 *  I5 a cloud engine is effective only when its route privacy readiness is VERIFIED.
 */
export function resolveEffectiveSpeech(input: ResolveInput): EffectiveSpeech {
  const { selection, policy, readiness, privacyVerified } = input
  const selected = selection.engine
  const revision = policy.status === 'valid' || policy.status === 'invalid' ? policy.policyRevision : null
  const blocked = (reason: BlockedReason, locked: boolean): EffectiveSpeech => ({
    status: 'blocked',
    selected,
    effective: null,
    reason,
    locked,
    policyRevision: revision
  })
  if (policy.status === 'invalid') return blocked('POLICY_INVALID', true)

  const valid = policy.status === 'valid' ? policy : null
  const allowed = (e: SpeechEngineId): boolean => !valid || valid.allowed.includes(e)
  const explicit = selection.source === 'user-explicit' || selection.source === 'legacy-explicit'

  let candidate: SpeechEngineId | null
  let via: 'selected' | 'org-enforced' | 'org-default' | 'interim-legacy-local'
  let locked = false
  if (valid?.enforced) {
    candidate = valid.enforced
    via = 'org-enforced'
    locked = true
  } else if (explicit && selected && allowed(selected)) {
    candidate = selected
    via = 'selected'
  } else if (valid?.orgDefault && allowed(valid.orgDefault)) {
    candidate = valid.orgDefault
    via = 'org-default'
    locked = explicit // a disallowed explicit choice is visibly overridden, never rewritten
  } else if (selection.source === 'needs-choice') {
    if (selection.interim && allowed(selection.interim)) {
      candidate = selection.interim
      via = 'interim-legacy-local'
    } else return blocked('NEEDS_CHOICE', false)
  } else if (selected && allowed(selected)) {
    candidate = selected
    via = 'selected'
  } else return blocked('NOT_ALLOWED_BY_POLICY', valid !== null)

  if (!allowed(candidate)) return blocked('NOT_ALLOWED_BY_POLICY', true)

  // I6: a migrated profile whose legacy route was local never starts cloud upload before acknowledgment,
  // whichever path (selection, org default, org enforcement) produced the cloud candidate.
  const pendingInterim =
    selection.source === 'needs-choice'
      ? { pending: selection.interim !== null, interim: selection.interim }
      : { pending: selection.pendingAck !== null && selection.pendingAck.acknowledgedAt === null, interim: selection.pendingAck?.interim ?? null }
  if (pendingInterim.pending && isCloudEngine(candidate)) {
    const interim = pendingInterim.interim
    if (interim && allowed(interim) && engineUsable(readiness.get(interim))) {
      return { status: 'ready', selected, effective: interim, via: 'interim-legacy-local', locked, policyRevision: revision }
    }
    return blocked('MIGRATION_ACK_REQUIRED', locked)
  }

  const admissible = (e: SpeechEngineId): boolean =>
    engineUsable(readiness.get(e)) && (!isCloudEngine(e) || privacyVerified(e))

  if (admissible(candidate)) {
    return { status: 'ready', selected, effective: candidate, via, locked, policyRevision: revision }
  }
  const fb = valid?.exactFallback
  if (fb && fb.from === candidate && fb.to !== candidate && allowed(fb.to) && admissible(fb.to)) {
    return { status: 'ready', selected, effective: fb.to, via: 'accepted-exact-fallback', locked, policyRevision: revision }
  }
  if (isCloudEngine(candidate) && engineUsable(readiness.get(candidate)) && !privacyVerified(candidate)) {
    return blocked('PRIVACY_NOT_VERIFIED', locked)
  }
  return blocked('NOT_READY', locked)
}

// ---------------------------------------------------------------------------------------------
// Versioned migration from the 1.9.x split fields (store.ts sparse user layer + managed-config).
// ---------------------------------------------------------------------------------------------

/** The RAW sparse layers, never the merged settings: merged values cannot tell explicit from default. */
export interface LegacySpeechLayers {
  /** null = no settings.json yet (fresh install). */
  user: {
    asrEngine?: unknown
    cloudSttProvider?: unknown
    onboardingDone?: unknown
    onboardingDoneAt?: unknown
  } | null
  previous: SelectionState | null
}

export interface MigrationContext {
  now: number
  /** Entitled 2.0 profile on Windows or native Mac with Cloudflare speech permitted (TASK-006/012 input). */
  eligibleForCloudDefault: boolean
  /** Legacy managed CLOUD_ONLY was active: the legacy effective route was already cloud (listen.ts:2154). */
  legacyManagedCloudOnly: boolean
  noticeVersion: string
}

export interface MigrationResult {
  migrationVersion: 1
  selection: SelectionState
  notice: 'none' | 'explain-default' | 'ask-choice'
}

const LEGACY_LOCAL: Record<string, LocalSpeechEngineId> = {
  parakeet: 'local-parakeet',
  whisper: 'local-whisper',
  apple: 'local-apple'
}

function completed(user: NonNullable<LegacySpeechLayers['user']>): boolean {
  return user.onboardingDone === true || (typeof user.onboardingDoneAt === 'number' && user.onboardingDoneAt > 0)
}

/**
 * Deliberately has NO parameter for physical memory, installed packs, OS version or Apple Intelligence:
 * hardware and installation can never select an engine (§9.6 L835). Consent is also absent: a
 * selection is never capture consent (TASK-005 verify, §16.7 L1526).
 */
export function migrateSpeechSelection(layers: LegacySpeechLayers, ctx: MigrationContext): MigrationResult {
  const base = { schemaVersion: 'metis.speech-engine.v1' as const, decidedAt: ctx.now }
  if (layers.previous && layers.previous.schemaVersion === 'metis.speech-engine.v1') {
    return { migrationVersion: 1, selection: layers.previous, notice: 'none' }
  }
  const user = layers.user
  const legacyLocal = user && typeof user.asrEngine === 'string' ? LEGACY_LOCAL[user.asrEngine] ?? null : null
  const legacyCloud =
    user && (user.cloudSttProvider === 'cloudflare-nova3' || user.cloudSttProvider === 'soniox')
      ? (user.cloudSttProvider as CloudSpeechEngineId)
      : null
  const isCompleted = user !== null && completed(user)

  if (user === null || (!isCompleted && !legacyLocal && !legacyCloud)) {
    if (!ctx.eligibleForCloudDefault) {
      return {
        migrationVersion: 1,
        selection: { ...base, engine: null, source: 'needs-choice', reason: 'fresh-not-eligible', proposed: null, interim: null },
        notice: 'ask-choice'
      }
    }
    return {
      migrationVersion: 1,
      selection: { ...base, engine: FRESH_2_0_DEFAULT_ENGINE, source: 'fresh-default', pendingAck: null },
      notice: 'none'
    }
  }
  if (legacyLocal && legacyCloud) {
    return {
      migrationVersion: 1,
      selection: { ...base, engine: null, source: 'needs-choice', reason: 'conflicting-legacy-fields', proposed: legacyLocal, interim: legacyLocal },
      notice: 'ask-choice'
    }
  }
  if (legacyLocal === 'local-whisper' && isCompleted) {
    return {
      migrationVersion: 1,
      selection: { ...base, engine: null, source: 'needs-choice', reason: 'ambiguous-legacy-whisper', proposed: 'local-whisper', interim: 'local-whisper' },
      notice: 'ask-choice'
    }
  }
  if (legacyLocal) {
    return { migrationVersion: 1, selection: { ...base, engine: legacyLocal, source: 'legacy-explicit', pendingAck: null }, notice: 'none' }
  }
  if (legacyCloud) {
    // Outside managed CLOUD_ONLY a stored provider was never effective (cloud-stt-provider.ts:47-54):
    // honouring it now would newly start uploads, so it waits for acknowledgment.
    const pendingAck = ctx.legacyManagedCloudOnly
      ? null
      : { noticeVersion: ctx.noticeVersion, acknowledgedAt: null, interim: 'local-parakeet' as const }
    return {
      migrationVersion: 1,
      selection: { ...base, engine: legacyCloud, source: 'legacy-explicit', pendingAck },
      notice: pendingAck ? 'explain-default' : 'none'
    }
  }
  if (ctx.legacyManagedCloudOnly) {
    return {
      migrationVersion: 1,
      selection: { ...base, engine: FRESH_2_0_DEFAULT_ENGINE, source: 'migration-default', pendingAck: null },
      notice: 'none'
    }
  }
  // Completed profile that never chose: the legacy effective route was bundled Parakeet.
  if (!ctx.eligibleForCloudDefault) {
    return { migrationVersion: 1, selection: { ...base, engine: 'local-parakeet', source: 'legacy-explicit', pendingAck: null }, notice: 'none' }
  }
  return {
    migrationVersion: 1,
    selection: {
      ...base,
      engine: FRESH_2_0_DEFAULT_ENGINE,
      source: 'migration-default',
      pendingAck: { noticeVersion: ctx.noticeVersion, acknowledgedAt: null, interim: 'local-parakeet' }
    },
    notice: 'explain-default'
  }
}

/** Legacy managed layer → policy. A present-but-unparseable enterpriseLive block is INVALID, not legacy. */
export function speechPolicyFromLegacyManaged(input: {
  managed: { enterpriseLive?: unknown; cloudSttProvider?: unknown; asrEngine?: unknown } | null
  lockedKeys: readonly string[]
  policyRevision: PolicyRevision
}): SpeechPolicy {
  const m = input.managed
  if (!m) return { status: 'absent' }
  const el = m.enterpriseLive
  let cloudOnly = false
  if (el !== undefined) {
    if (!el || typeof el !== 'object') return { status: 'invalid', policyRevision: input.policyRevision }
    const o = el as Record<string, unknown>
    const managedOk = o.managed === undefined || typeof o.managed === 'boolean'
    const modeOk = o.inferenceMode === undefined || o.inferenceMode === 'legacy' || o.inferenceMode === 'cloud-only'
    const summaryOk = o.summaryOnly === undefined || typeof o.summaryOnly === 'boolean'
    if (!managedOk || !modeOk || !summaryOk) return { status: 'invalid', policyRevision: input.policyRevision }
    cloudOnly = o.managed === true && o.inferenceMode === 'cloud-only'
  }
  const managedCloud = m.cloudSttProvider === 'cloudflare-nova3' || m.cloudSttProvider === 'soniox' ? m.cloudSttProvider : null
  if (m.cloudSttProvider !== undefined && m.cloudSttProvider !== 'unconfigured' && !managedCloud) {
    return { status: 'invalid', policyRevision: input.policyRevision }
  }
  const managedLocal = typeof m.asrEngine === 'string' ? LEGACY_LOCAL[m.asrEngine] ?? null : null
  if (m.asrEngine !== undefined && !managedLocal) return { status: 'invalid', policyRevision: input.policyRevision }
  if (cloudOnly) {
    return {
      status: 'valid',
      policyRevision: input.policyRevision,
      allowed: ['cloudflare-nova3', 'soniox'],
      enforced: managedCloud && input.lockedKeys.includes('cloudSttProvider') ? managedCloud : null,
      orgDefault: managedCloud ?? 'cloudflare-nova3',
      exactFallback: null
    }
  }
  if (managedLocal || managedCloud) {
    const locked = input.lockedKeys.includes('asrEngine') || input.lockedKeys.includes('cloudSttProvider')
    const engine = (managedCloud ?? managedLocal) as SpeechEngineId
    return {
      status: 'valid',
      policyRevision: input.policyRevision,
      allowed: [...SPEECH_ENGINES],
      enforced: locked ? engine : null,
      orgDefault: engine,
      exactFallback: null
    }
  }
  return { status: 'absent' }
}
```

### A.3 speech-session.ts

Proposed repo path: `src/shared/contracts/speech-session.ts` · reference file `$SCRATCH/contracts/speech-session.ts` · sha256 `2de8adb6491a45fc8b73b615d46a369757d3874004a84e0194340eadfb30993d` · 351 lines

```ts
/**
 * Speech session, track epochs and segment revision/finalization (MASTER §9.1 L787, §9.2 L793,
 * §9.7 L849, §9.8 L857-863, §9.9 L869-873, §9.13 L909-911, §4.1 L311, §4.3 L342).
 * Pure reducer over provider-normalized events. Segment text is CONTENT: it lives only in this
 * bounded in-memory window and in authorized local consumers; it never enters Operator/telemetry.
 */
import type {
  AttemptId,
  CaptureGeneration,
  ConsentEpoch,
  DeviceId,
  OperationId,
  PolicyRevision,
  PrincipalId,
  SegmentId,
  SegmentRevision,
  SpeechSessionId,
  StreamEpoch
} from './ids'
import type { SpeechEngineId } from './speech-engine'

export type SpeechPurpose = 'command' | 'dictation' | 'meeting' | 'import'
export type TrackKind = 'mic' | 'system'

/** §9.8 L857: command/dictation sessions are microphone-only; meetings open only requested+permitted tracks. */
export const PURPOSE_TRACKS: Readonly<Record<SpeechPurpose, readonly (readonly TrackKind[])[]>> = {
  command: [['mic']],
  dictation: [['mic']],
  meeting: [['mic'], ['system'], ['mic', 'system']],
  import: [[]]
}

export interface SpeechSessionRequest {
  schemaVersion: 'metis.speech-session.v1'
  sessionId: SpeechSessionId
  operationId: OperationId
  purpose: SpeechPurpose
  captureGeneration: CaptureGeneration
  requestedTracks: readonly TrackKind[]
  engine: SpeechEngineId
  language: { mode: 'auto' } | { mode: 'pinned'; bcp47: string }
  policyRevision: PolicyRevision
  consentEpoch: ConsentEpoch
}

export type SessionRequestError = 'SCHEMA' | 'TRACKS_NOT_PERMITTED_FOR_PURPOSE' | 'DUPLICATE_TRACK'

export function validateSessionRequest(r: SpeechSessionRequest): { ok: true } | { ok: false; reason: SessionRequestError } {
  if (r.schemaVersion !== 'metis.speech-session.v1') return { ok: false, reason: 'SCHEMA' }
  if (new Set(r.requestedTracks).size !== r.requestedTracks.length) return { ok: false, reason: 'DUPLICATE_TRACK' }
  const sorted = [...r.requestedTracks].sort().join(',')
  const permitted = PURPOSE_TRACKS[r.purpose].some((set) => [...set].sort().join(',') === sorted)
  return permitted ? { ok: true } : { ok: false, reason: 'TRACKS_NOT_PERMITTED_FOR_PURPOSE' }
}

/**
 * Server-issued opaque grant (§9.7 L849). Never contains provider credentials; the renderer never holds it.
 * `redemption` may be 'single-use-atomic' only where the server enforces atomic redemption.
 */
export interface SpeechSessionGrant {
  grantId: string
  sessionId: SpeechSessionId
  deviceId: DeviceId
  principalId: PrincipalId
  operationId: OperationId
  captureGeneration: CaptureGeneration
  purpose: SpeechPurpose
  tracks: readonly TrackKind[]
  engine: SpeechEngineId
  modelId: string
  budgetReservationId: string | null
  expiresAt: number
  redemption: 'single-use-atomic' | 'reusable-within-expiry'
}

/** One upstream connection per track. Reconnect = new epoch + new upstream attempt identity (§9.8 L863). */
export type TrackEpochState = 'connecting' | 'open' | 'flush-requested' | 'stream-final' | 'truncated' | 'aborted'
export interface TrackEpoch {
  track: TrackKind
  epoch: StreamEpoch
  upstreamAttemptId: AttemptId
  state: TrackEpochState
  /** Session-timeline ms at which this epoch's provider time 0 lands (monotonic across epochs). */
  sessionOffsetMs: number
}

/** Stable identity: capture generation + track + epoch + provider source start; never random per interim (§9.9 L871). */
export interface SegmentKey {
  sessionId: SpeechSessionId
  captureGeneration: CaptureGeneration
  track: TrackKind
  epoch: StreamEpoch
  providerStartMs: number
}
export function segmentIdFor(k: SegmentKey): SegmentId {
  return `seg_${k.sessionId}_${k.captureGeneration}_${k.track}_${k.epoch}_${Math.round(k.providerStartMs)}` as SegmentId
}

export type Finality = 'partial' | 'final'

/** Representation 2 of 4 (§9.1 L787): provider recognition. */
export interface RecognizedSegment {
  kind: 'recognized'
  id: SegmentId
  key: SegmentKey
  revision: SegmentRevision
  finality: Finality
  /** Provider endpoint (Deepgram speech_final). NOT stream-final and NOT command finality (§9.9 L869). */
  endpoint: boolean
  startMs: number
  endMs: number
  text: string
  language: string
  languageSource: 'provider-detected' | 'pinned' | 'unknown'
  confidence: { value: number; provenance: 'provider-utterance' | 'provider-word-mean' } | null
  /** Channel/cluster labels are never verified identity (§9.2 L791, SRC-13). */
  speaker: { kind: 'channel'; track: TrackKind } | { kind: 'cluster'; clusterId: string } | { kind: 'unknown' }
  engine: SpeechEngineId
  modelRevision: string | null
}
/** Representation 3: explicit user correction; never overwrites the recognized revision. */
export interface UserCorrection {
  kind: 'correction'
  segmentId: SegmentId
  basedOnRevision: SegmentRevision
  text: string
  correctedBy: PrincipalId
  at: number
}
/** Representation 4: generated content, linked to exact source revisions; approval is separate. */
export interface GeneratedArtifact {
  kind: 'generated'
  artifactId: string
  sources: readonly { segmentId: SegmentId; revision: SegmentRevision }[]
  model: string
  approved: boolean
}
/** EXP-02: human notes are the user's work, with their own revisions, never overwritten by enhancement. */
export interface HumanNote {
  kind: 'human-note'
  noteId: string
  revision: number
  text: string
  anchorMs: number | null
  author: PrincipalId
}

export type GapReason =
  | 'queue-overflow'
  | 'reconnect'
  | 'device-change'
  | 'suspend'
  | 'memory-pressure'
  | 'provider-error'
  | 'consent-withdrawn'
export interface GapEvent {
  kind: 'gap'
  track: TrackKind
  epoch: StreamEpoch
  fromMs: number
  toMs: number
  reason: GapReason
}

export interface TranscriptWindow {
  sessionId: SpeechSessionId
  purpose: SpeechPurpose
  captureGeneration: CaptureGeneration
  epochs: ReadonlyMap<TrackKind, TrackEpoch>
  segments: ReadonlyMap<SegmentId, RecognizedSegment>
  gaps: readonly GapEvent[]
  /** Finite window (§9.13 L909); oldest final segments are evicted with an explicit interval record. */
  maxSegments: number
  evictedThroughMs: number | null
  /** 'open' | graceful tail flush | revoked with or without a still-valid transcript scope (§9.9 L873). */
  stop: 'open' | 'graceful-tail' | 'revoked-transcript-valid' | 'revoked'
}

export interface ProviderSegmentEvent {
  sessionId: SpeechSessionId
  captureGeneration: CaptureGeneration
  track: TrackKind
  epoch: StreamEpoch
  providerStartMs: number
  providerEndMs: number
  finality: Finality
  endpoint: boolean
  text: string
  language: string
  languageSource: RecognizedSegment['languageSource']
  confidence: RecognizedSegment['confidence']
  speaker: RecognizedSegment['speaker']
  engine: SpeechEngineId
  modelRevision: string | null
}

export type ApplyEffect =
  | 'inserted'
  | 'revised'
  | 'duplicate'
  | 'stale-generation'
  | 'stale-epoch'
  | 'final-immutable'
  | 'revoked'
  | 'invalid-time'

export function applySegmentEvent(
  w: TranscriptWindow,
  e: ProviderSegmentEvent
): { window: TranscriptWindow; effect: ApplyEffect; segmentId?: SegmentId } {
  if (e.sessionId !== w.sessionId || e.captureGeneration !== w.captureGeneration) return { window: w, effect: 'stale-generation' }
  if (w.stop === 'revoked') return { window: w, effect: 'revoked' }
  const epoch = w.epochs.get(e.track)
  if (!epoch || epoch.epoch !== e.epoch || !(epoch.state === 'open' || epoch.state === 'flush-requested')) {
    return { window: w, effect: 'stale-epoch' }
  }
  if (!Number.isFinite(e.providerStartMs) || !Number.isFinite(e.providerEndMs) || e.providerStartMs < 0 || e.providerEndMs < e.providerStartMs) {
    return { window: w, effect: 'invalid-time' }
  }
  const key: SegmentKey = {
    sessionId: e.sessionId,
    captureGeneration: e.captureGeneration,
    track: e.track,
    epoch: e.epoch,
    providerStartMs: e.providerStartMs
  }
  const id = segmentIdFor(key)
  const prev = w.segments.get(id)
  const startMs = epoch.sessionOffsetMs + e.providerStartMs
  const endMs = epoch.sessionOffsetMs + e.providerEndMs
  if (prev) {
    const same = prev.text === e.text && prev.endMs === endMs && prev.finality === e.finality && prev.endpoint === e.endpoint
    if (same) return { window: w, effect: 'duplicate', segmentId: id }
    if (prev.finality === 'final') return { window: w, effect: 'final-immutable', segmentId: id }
  }
  const next: RecognizedSegment = {
    kind: 'recognized',
    id,
    key,
    revision: ((prev?.revision ?? 0) + 1) as SegmentRevision,
    finality: e.finality,
    endpoint: e.endpoint,
    startMs,
    endMs,
    text: e.text,
    language: e.language,
    languageSource: e.languageSource,
    confidence: e.confidence,
    speaker: e.speaker,
    engine: e.engine,
    modelRevision: e.modelRevision
  }
  const segments = new Map(w.segments)
  segments.set(id, next)
  let evictedThroughMs = w.evictedThroughMs
  while (segments.size > w.maxSegments) {
    let oldest: RecognizedSegment | undefined
    for (const s of segments.values()) if (s.finality === 'final' && (!oldest || s.endMs < oldest.endMs)) oldest = s
    if (!oldest) break
    segments.delete(oldest.id)
    evictedThroughMs = Math.max(evictedThroughMs ?? 0, oldest.endMs)
  }
  return { window: { ...w, segments, evictedThroughMs }, effect: prev ? 'revised' : 'inserted', segmentId: id }
}

/** Reconnect: close the old epoch explicitly (gap recorded), open a new epoch with a new upstream attempt. */
export function startNewEpoch(
  w: TranscriptWindow,
  track: TrackKind,
  upstreamAttemptId: AttemptId,
  sessionOffsetMs: number,
  gap: { fromMs: number; toMs: number; reason: GapReason } | null
): TranscriptWindow {
  const prev = w.epochs.get(track)
  const epochs = new Map(w.epochs)
  if (prev && sessionOffsetMs < prev.sessionOffsetMs) throw new RangeError('OFFSET_NOT_MONOTONIC')
  if (prev && prev.state !== 'stream-final') epochs.set(track, { ...prev, state: 'truncated' })
  const epoch = ((prev?.epoch ?? 0) + 1) as StreamEpoch
  epochs.set(track, { track, epoch, upstreamAttemptId, state: 'open', sessionOffsetMs })
  const gaps = gap && prev ? [...w.gaps, { kind: 'gap' as const, track, epoch: prev.epoch, ...gap }] : w.gaps
  return { ...w, epochs, gaps }
}

/** Only provider terminal evidence after a flush request proves stream-final; a bare close is 'truncated'. */
export function closeEpoch(w: TranscriptWindow, track: TrackKind, evidence: 'provider-terminal' | 'socket-closed' | 'error'): TranscriptWindow {
  const ep = w.epochs.get(track)
  if (!ep) return w
  const state: TrackEpochState =
    evidence === 'provider-terminal' && ep.state === 'flush-requested' ? 'stream-final' : evidence === 'error' ? 'aborted' : 'truncated'
  const epochs = new Map(w.epochs)
  epochs.set(track, { ...ep, state })
  return { ...w, epochs }
}

export function requestStop(w: TranscriptWindow, mode: 'graceful-tail' | 'revoke', transcriptScopeValid: boolean): TranscriptWindow {
  if (mode === 'revoke') return { ...w, stop: transcriptScopeValid ? 'revoked-transcript-valid' : 'revoked' }
  const epochs = new Map(w.epochs)
  for (const [t, ep] of epochs) if (ep.state === 'open') epochs.set(t, { ...ep, state: 'flush-requested' })
  return { ...w, epochs, stop: 'graceful-tail' }
}

export function sessionFinalization(w: TranscriptWindow): 'complete' | 'incomplete-tail' | 'in-progress' | 'revoked' {
  if (w.stop === 'revoked') return 'revoked'
  const states = [...w.epochs.values()].map((e) => e.state)
  if (states.some((s) => s === 'connecting' || s === 'open' || s === 'flush-requested')) return 'in-progress'
  return states.every((s) => s === 'stream-final') && w.stop !== 'revoked-transcript-valid' ? 'complete' : 'incomplete-tail'
}

/**
 * Command ingress. Only a command-purpose window, current generation, final segments, not revoked.
 * Keeps the original text; normalized matching text is derived separately (SRC-06).
 */
export interface CommandUtterance {
  purpose: 'command'
  sessionId: SpeechSessionId
  captureGeneration: CaptureGeneration
  segments: readonly { id: SegmentId; revision: SegmentRevision }[]
  original: string
}
export type CommandIngressRejection = 'NOT_COMMAND_PURPOSE' | 'REVOKED' | 'NOT_FINAL' | 'UNKNOWN_SEGMENT'

export function commandUtteranceFrom(
  w: TranscriptWindow,
  ids: readonly SegmentId[]
): CommandUtterance | { rejected: CommandIngressRejection } {
  if (w.purpose !== 'command') return { rejected: 'NOT_COMMAND_PURPOSE' }
  if (w.stop === 'revoked' || w.stop === 'revoked-transcript-valid') return { rejected: 'REVOKED' }
  const segs: RecognizedSegment[] = []
  for (const id of ids) {
    const s = w.segments.get(id)
    if (!s) return { rejected: 'UNKNOWN_SEGMENT' }
    if (s.finality !== 'final') return { rejected: 'NOT_FINAL' }
    segs.push(s)
  }
  segs.sort((a, b) => a.startMs - b.startMs)
  return {
    purpose: 'command',
    sessionId: w.sessionId,
    captureGeneration: w.captureGeneration,
    segments: segs.map((s) => ({ id: s.id, revision: s.revision })),
    original: segs.map((s) => s.text).join(' ')
  }
}

/** SRC-11: typed persistence outcomes; an empty fallback is never a successful save or a decoded meeting. */
export type SaveResult =
  | { status: 'committed'; revision: string; readBackVerified: true }
  | { status: 'failed'; reason: 'disk-full' | 'permission-denied' | 'encode-failed' | 'conflict' | 'io' }
  | { status: 'unknown'; reason: 'timeout' | 'crash' }
  | { status: 'refused-by-policy'; policy: 'summary-only' }
export type DecodeResult<T> = { status: 'ok'; value: T } | { status: 'empty' } | { status: 'corrupt'; recoverable: boolean }
```

### A.4 command.ts

Proposed repo path: `src/shared/contracts/command.ts` · reference file `$SCRATCH/contracts/command.ts` · sha256 `9d879bf50f6d18fcb2cfb0eed8ba1ff33b5a8b703e53dd39c9f60cb3f9a6fc80` · 372 lines

```ts
/**
 * Command request → plan → approval → step outcome (MASTER §3.2 L295-297, §3.3 L301-303,
 * §4.2 L319-334, §4.3 L338-342, §4.4 L346-348, §4.5 L354, §10.2 L925-942, §10.6 L972,
 * §32.5 L4455, §32.8 L4499, EXP-09 L3974, SRC-03 L4036-4040, SRC-04 L4048-4052).
 * Pure. Nonces, webContents ownership and adapter execution remain in main-only code (command-control.ts).
 */
import type {
  AgentId,
  ApprovalId,
  AttemptId,
  CaptureGeneration,
  DeviceId,
  OperationId,
  PlanId,
  PolicyRevision,
  PrincipalId,
  RunId,
  SpeechSessionId,
  StepId,
  TargetSnapshotId
} from './ids'
import type { DataClass } from './policy'

export type Platform = 'win32' | 'darwin'
/** R0-R2 exist today (application-intents.ts:72-77). R3 = high-impact: exact target UI confirmation (§4.3 L340). */
export type RiskClass = 'R0' | 'R1' | 'R2' | 'R3'
export type InteractionMode = 'read' | 'teach' | 'draft' | 'act'
export type ApprovalRequirement =
  | 'none-within-authorized-session' // §4.5 L352 direct low-risk open/focus
  | 'visible-confirmation'
  | 'exact-target-ui-confirmation' // spoken "yes" alone is insufficient
  | 'prohibited'
export type IdempotencyClass = 'idempotent' | 'reconcile-before-retry' | 'never-auto-retry'
export type PostconditionKind =
  | 'app-frontmost'
  | 'app-running'
  | 'app-not-running'
  | 'window-focused'
  | 'url-open'
  | 'note-exists-with-title'
  | 'none-observable'
export type Prerequisite = 'accessibility' | 'automation' | 'camera' | 'microphone' | 'screen-recording' | 'network'

/** §3.2 L295: every capability declares all of these. Unsupported ones are filtered before any model call. */
export interface CapabilityDefinition<A = unknown> {
  id: string
  version: number
  platforms: readonly Platform[]
  prerequisites: readonly Prerequisite[]
  validateArgs: (raw: unknown) => A | null
  sensitivity: DataClass
  risk: RiskClass
  mode: InteractionMode
  target: 'catalog-resolved' | 'none' | 'prior-verified-output'
  approval: ApprovalRequirement
  cancellation: 'abortable-until-commit' | 'not-abortable'
  idempotency: IdempotencyClass
  timeoutMs: number
  postcondition: PostconditionKind
}

export type CapabilityDefectCode =
  | 'R3_WITHOUT_EXACT_APPROVAL'
  | 'NON_ACT_MODE_WITH_TARGET_EFFECT'
  | 'NO_PLATFORM'
  | 'TIMEOUT_INVALID'
/** Registry-load invariant check; a defective definition is refused, not patched. */
export function capabilityDefects(c: CapabilityDefinition): CapabilityDefectCode[] {
  const out: CapabilityDefectCode[] = []
  if (c.risk === 'R3' && c.approval !== 'exact-target-ui-confirmation' && c.approval !== 'prohibited') out.push('R3_WITHOUT_EXACT_APPROVAL')
  if (c.mode !== 'act' && c.postcondition !== 'none-observable') out.push('NON_ACT_MODE_WITH_TARGET_EFFECT')
  if (c.platforms.length === 0) out.push('NO_PLATFORM')
  if (!Number.isSafeInteger(c.timeoutMs) || c.timeoutMs <= 0) out.push('TIMEOUT_INVALID')
  return out
}

export function eligibleCapabilities(
  registry: readonly CapabilityDefinition[],
  ctx: { platform: Platform; granted: ReadonlySet<Prerequisite>; policyAllows: (id: string) => boolean }
): CapabilityDefinition[] {
  return registry.filter(
    (c) =>
      capabilityDefects(c).length === 0 &&
      c.approval !== 'prohibited' &&
      c.platforms.includes(ctx.platform) &&
      c.prerequisites.every((p) => ctx.granted.has(p)) &&
      ctx.policyAllows(c.id)
  )
}

/** Voice and typed commands share one plan/execution contract (§4.3 L342). */
export type OperationSource =
  | { kind: 'voice'; sessionId: SpeechSessionId; captureGeneration: CaptureGeneration; utteranceRevision: number }
  | { kind: 'typed'; submitRevision: number }
  | { kind: 'agent-run'; runId: RunId; agentId: AgentId }

export interface Operation {
  schemaVersion: 'metis.command.v1'
  operationId: OperationId
  source: OperationSource
  principalId: PrincipalId
  deviceId: DeviceId
  policyRevision: PolicyRevision
  mode: InteractionMode
  createdAt: number
}

export interface PlannedStep {
  stepId: StepId
  planId: PlanId
  index: number
  capabilityId: string
  capabilityVersion: number
  target: { targetId: string; snapshotId: TargetSnapshotId } | null
  args: unknown
  expiresAt: number
}

export interface Plan {
  planId: PlanId
  operationId: OperationId
  /** Mode of the operation; a model cannot silently promote read/teach/draft to act (§32.5 L4455). */
  mode: InteractionMode
  steps: readonly PlannedStep[]
  decidedBy: { kind: 'deterministic' } | { kind: 'model'; attemptId: AttemptId; provider: 'jev' | 'laya' }
}

// ----- Decision provider (candidate-bound; §10.2) -------------------------------------------

export type DecisionQuestion = 'operation' | 'target' | 'needs_clarification'
export interface DecisionRequest {
  schemaVersion: 'metis.decision.v1'
  operationId: OperationId
  attemptId: AttemptId
  captureGeneration: CaptureGeneration | null
  snapshotId: TargetSnapshotId
  /** Exact user span, never a model paraphrase. Identity is derived server-side, never from this body. */
  intentSpan: string
  candidateIds: readonly string[]
  questions: readonly DecisionQuestion[]
  deadlineMs: number
  policyRevision: PolicyRevision
}
export interface DecisionResponse {
  attemptId: AttemptId
  snapshotId: TargetSnapshotId
  provider: 'jev' | 'laya'
  modelRevision: string | null
  result: { kind: 'candidate'; candidateId: string } | { kind: 'clarify' } | { kind: 'none' }
  /** Only when the backend exposes it; never fabricated; evidence, not authorization (§10.6 L972). */
  confidence: number | null
}
export type DecisionApplyResult =
  | { applied: true; candidateId: string }
  | {
      applied: false
      reason: 'ATTEMPT_MISMATCH' | 'SNAPSHOT_STALE' | 'GENERATION_STALE' | 'NOT_A_CANDIDATE' | 'POLICY_CHANGED' | 'CLARIFY' | 'NONE'
    }

/** SRC-03: the decision is applied (not discarded) only through this check, then through normal approval. */
export function applyDecision(
  req: DecisionRequest,
  res: DecisionResponse,
  live: { captureGeneration: CaptureGeneration | null; snapshotId: TargetSnapshotId; policyRevision: PolicyRevision }
): DecisionApplyResult {
  if (res.attemptId !== req.attemptId) return { applied: false, reason: 'ATTEMPT_MISMATCH' }
  if (res.snapshotId !== req.snapshotId || live.snapshotId !== req.snapshotId) return { applied: false, reason: 'SNAPSHOT_STALE' }
  if (live.captureGeneration !== req.captureGeneration) return { applied: false, reason: 'GENERATION_STALE' }
  if (live.policyRevision !== req.policyRevision) return { applied: false, reason: 'POLICY_CHANGED' }
  if (res.result.kind === 'clarify') return { applied: false, reason: 'CLARIFY' }
  if (res.result.kind === 'none') return { applied: false, reason: 'NONE' }
  if (!req.candidateIds.includes(res.result.candidateId)) return { applied: false, reason: 'NOT_A_CANDIDATE' }
  return { applied: true, candidateId: res.result.candidateId }
}

// ----- Approval (§3.3 L301, §32.8 L4499) -----------------------------------------------------

export interface ApprovalRecord {
  approvalId: ApprovalId
  operationId: OperationId
  planId: PlanId
  stepIds: readonly StepId[]
  targetSnapshotIds: readonly TargetSnapshotId[]
  captureGeneration: CaptureGeneration | null
  policyRevision: PolicyRevision
  agent: { agentId: AgentId; revision: number } | null
  sideEffect: RiskClass
  audience: 'local-device' | 'external'
  maxCostMicros: number | null
  expiresAt: number
  consumed: boolean
}
export interface LiveAuthority {
  now: number
  sessionLive: boolean
  captureGeneration: CaptureGeneration | null
  policyRevision: PolicyRevision
  planId: PlanId
  stepIds: readonly StepId[]
  targetSnapshotIds: readonly TargetSnapshotId[]
  agent: { agentId: AgentId; revision: number } | null
}
export type ApprovalInvalidReason =
  | 'EXPIRED'
  | 'CONSUMED'
  | 'SESSION_DEAD'
  | 'GENERATION_CHANGED'
  | 'POLICY_CHANGED'
  | 'PLAN_CHANGED'
  | 'TARGET_CHANGED'
  | 'AGENT_CHANGED'

const sameList = <T>(a: readonly T[], b: readonly T[]): boolean => a.length === b.length && a.every((v, i) => v === b[i])

/** Re-run immediately before committing each side effect, in trusted code (§3.3 L301). */
export function checkApproval(a: ApprovalRecord, live: LiveAuthority): { ok: true } | { ok: false; reason: ApprovalInvalidReason } {
  if (a.consumed) return { ok: false, reason: 'CONSUMED' }
  if (live.now >= a.expiresAt) return { ok: false, reason: 'EXPIRED' }
  if (!live.sessionLive) return { ok: false, reason: 'SESSION_DEAD' }
  if (a.captureGeneration !== live.captureGeneration) return { ok: false, reason: 'GENERATION_CHANGED' }
  if (a.policyRevision !== live.policyRevision) return { ok: false, reason: 'POLICY_CHANGED' }
  if (a.planId !== live.planId || !sameList(a.stepIds, live.stepIds)) return { ok: false, reason: 'PLAN_CHANGED' }
  if (!sameList(a.targetSnapshotIds, live.targetSnapshotIds)) return { ok: false, reason: 'TARGET_CHANGED' }
  if ((a.agent?.agentId ?? null) !== (live.agent?.agentId ?? null) || (a.agent?.revision ?? null) !== (live.agent?.revision ?? null)) {
    return { ok: false, reason: 'AGENT_CHANGED' }
  }
  return { ok: true }
}

// ----- Outcomes (§3.3 L303, EXP-09 L3974, SRC-04 L4050) ----------------------------------------

declare const verifierBrand: unique symbol
/** Produced only by the OutcomeVerifier module (a different reader from the executor). */
export interface VerifierReceipt {
  readonly [verifierBrand]: true
  postcondition: PostconditionKind
  stepId: StepId
  observedAt: number
  evidenceRef: string
}

export type StepOutcome =
  | { kind: 'not-dispatched'; reason: 'policy-denied' | 'approval-invalid' | 'stopped-before-commit' | 'target-unavailable' }
  | { kind: 'unsupported'; reason: string }
  /** Side effect dispatched; independent postcondition not (yet) proven. */
  | { kind: 'attempted'; dispatchedAt: number }
  | { kind: 'verified'; receipt: VerifierReceipt }
  | { kind: 'failed'; reason: string; sideEffect: 'none' | 'possible' }
  | { kind: 'cancelled'; committedBeforeCancel: boolean }
  /** Uncertain side effect: quarantined until reconciliation; blind retry prohibited (§4.4 L348). */
  | { kind: 'unknown'; reason: string }

/** Today's adapter vocabulary (desktop-actions.ts:31-40). */
export interface LegacyAdapterResult {
  ok: boolean
  outcome: 'verified' | 'unknown' | 'failed' | 'cancelled' | 'unsupported'
  detail?: string
  /** Proposed additive field: an adapter may assert its failure caused no side effect (e.g. app missing). */
  sideEffect?: 'none' | 'possible'
}

export function classifyStep(input: {
  stepId: StepId
  dispatched: boolean
  dispatchedAt: number
  result: LegacyAdapterResult | { threw: true }
  receipt: VerifierReceipt | null
  postcondition: PostconditionKind
}): StepOutcome {
  const r = input.result
  if ('threw' in r) {
    return input.dispatched ? { kind: 'unknown', reason: 'adapter-threw-after-dispatch' } : { kind: 'failed', reason: 'adapter-threw', sideEffect: 'none' }
  }
  if (r.outcome === 'unsupported') return { kind: 'unsupported', reason: 'adapter-unsupported' }
  if (r.outcome === 'cancelled') return { kind: 'cancelled', committedBeforeCancel: input.dispatched }
  if (r.outcome === 'failed' || !r.ok) {
    return { kind: 'failed', reason: 'adapter-failed', sideEffect: input.dispatched ? r.sideEffect ?? 'possible' : 'none' }
  }
  // An adapter cannot self-certify; exit code 0 is not a postcondition (§3.3 L303).
  const rc = input.receipt
  if (rc && rc.stepId === input.stepId && rc.postcondition === input.postcondition && input.postcondition !== 'none-observable') {
    return { kind: 'verified', receipt: rc }
  }
  return input.dispatched ? { kind: 'attempted', dispatchedAt: input.dispatchedAt } : { kind: 'unknown', reason: 'ok-without-dispatch' }
}

export type RetryDecision = 'no-retry' | 'bounded-retry' | 'reconcile-first'
export const MAX_SAFE_RETRIES = 2
export function retryDecision(o: StepOutcome, idem: IdempotencyClass, attemptsSoFar: number, stopped: boolean): RetryDecision {
  if (stopped) return 'no-retry'
  if (o.kind === 'unknown') return 'reconcile-first'
  if (o.kind === 'attempted') return idem === 'idempotent' ? 'no-retry' : 'reconcile-first'
  if (o.kind === 'failed' && o.sideEffect === 'possible') return idem === 'idempotent' && attemptsSoFar < MAX_SAFE_RETRIES ? 'bounded-retry' : 'reconcile-first'
  if (o.kind === 'failed') return attemptsSoFar < MAX_SAFE_RETRIES ? 'bounded-retry' : 'no-retry'
  return 'no-retry'
}

/** What the user may be told. Only `verified` may read as done (§4.2 L329, §33.6 L4827). */
export type UserFacingResult = 'done' | 'tried-unconfirmed' | 'did-not-run' | 'failed' | 'cancelled' | 'unsupported' | 'uncertain'
export function userFacingResult(o: StepOutcome): UserFacingResult {
  switch (o.kind) {
    case 'verified':
      return 'done'
    case 'attempted':
      return 'tried-unconfirmed'
    case 'not-dispatched':
      return 'did-not-run'
    case 'failed':
      return o.sideEffect === 'possible' ? 'uncertain' : 'failed'
    case 'cancelled':
      return o.committedBeforeCancel ? 'uncertain' : 'cancelled'
    case 'unsupported':
      return 'unsupported'
    case 'unknown':
      return 'uncertain'
  }
}

// ----- Session lifecycle (§4.2 L319-334) + distinct readiness claims (RUN-ORDER.md L37-38) --------

export const COMMAND_STATES = [
  'OFF',
  'ARMED',
  'CAPTURING',
  'INTERPRETING',
  'AWAITING_APPROVAL',
  'EXECUTING',
  'VERIFYING',
  'COMPLETED',
  'FAILED',
  'UNKNOWN',
  'CANCELLED'
] as const
export type CommandState = (typeof COMMAND_STATES)[number]
const TERMINAL: readonly CommandState[] = ['COMPLETED', 'FAILED', 'UNKNOWN', 'CANCELLED']
export const COMMAND_TRANSITIONS: Readonly<Record<CommandState, readonly CommandState[]>> = {
  OFF: ['ARMED', 'CAPTURING'],
  ARMED: ['OFF', 'CAPTURING'],
  CAPTURING: ['INTERPRETING', 'CANCELLED', 'FAILED', 'OFF'],
  INTERPRETING: ['AWAITING_APPROVAL', 'EXECUTING', 'CAPTURING', 'CANCELLED', 'FAILED'],
  AWAITING_APPROVAL: ['EXECUTING', 'CANCELLED', 'FAILED'],
  EXECUTING: ['VERIFYING', 'FAILED', 'UNKNOWN', 'CANCELLED'],
  VERIFYING: ['COMPLETED', 'UNKNOWN', 'FAILED'],
  COMPLETED: ['ARMED', 'OFF'],
  FAILED: ['ARMED', 'OFF'],
  UNKNOWN: ['ARMED', 'OFF'],
  CANCELLED: ['ARMED', 'OFF']
}
export function canTransition(from: CommandState, to: CommandState, outcome?: StepOutcome): boolean {
  if (!COMMAND_TRANSITIONS[from].includes(to)) return false
  if (to === 'COMPLETED') return outcome?.kind === 'verified'
  return true
}
export const isTerminal = (s: CommandState): boolean => TERMINAL.includes(s)

/** Legacy phases (metis-wake.ts:5-10, metis-command-session.ts:21) → contract states. */
export const LEGACY_PHASE_MAP: Readonly<Record<'idle' | 'waking' | 'listening' | 'executing' | 'deactivating' | 'awaiting-confirmation', CommandState>> = {
  idle: 'OFF',
  waking: 'CAPTURING',
  listening: 'CAPTURING',
  'awaiting-confirmation': 'AWAITING_APPROVAL',
  executing: 'EXECUTING',
  deactivating: 'CANCELLED'
}

/** Four separate claims; none implies another (RUN-ORDER.md L37-38, MASTER §32.6 L4477). */
export interface CommandSurfaceStatus {
  readyToType: boolean
  speechProviderReady: boolean
  decisionProvider: 'jev' | 'laya' | 'deterministic-only' | 'unavailable'
  lastStep: StepOutcome['kind'] | null
}
```

### A.5 policy.ts

Proposed repo path: `src/shared/contracts/policy.ts` · reference file `$SCRATCH/contracts/policy.ts` · sha256 `407699a61df5f1a05684d10785f35f5432951c74233ebf25b9f2fd336c210280` · 241 lines

```ts
/**
 * Policy, privacy readiness, consent and retention (MASTER §5.7 L420-424, §9.6 L837, §16.4 L1442-1444,
 * §16.5 L1448, §16.6 L1455-1500, §16.7 L1526, §13.4 L1158, SRC-02 L4026, SRC-17 L4206, SRC-21 L4254).
 * Pure. The speech selection is deliberately NOT an input to captureAllowed: a default is not consent.
 */
import type { ConsentEpoch, ConsentId, DeviceId, PolicyRevision, PrincipalId } from './ids'

/**
 * §16.6 L1455 + SRC-21 L4254: audio, transcripts, command text, vocabulary, prompts, responses,
 * screenshots/OCR, window titles, URLs, filenames and content-derived hashes/embeddings are CONTENT.
 */
export type DataClass =
  | 'content'
  | 'content-derived'
  | 'operational-metadata'
  | 'usage-metadata'
  | 'identity-admin'
  | 'security-audit'
  | 'authored-software'

export const SINKS = [
  'cf-gateway-log',
  'cf-cache',
  'worker-log',
  'd1',
  'kv',
  'r2',
  'durable-object',
  'cf-queue',
  'crash-report',
  'support-bundle',
  'analytics',
  'local-operator-outbox',
  'local-settings',
  'local-knowledge'
] as const
export type Sink = (typeof SINKS)[number]

/** §16.6.2 L1469-1482 as an allowlist. Anything absent is denied. */
export const SINK_ALLOWS: Readonly<Record<Sink, readonly DataClass[]>> = {
  'cf-gateway-log': [],
  'cf-cache': [],
  'worker-log': ['operational-metadata'],
  d1: ['operational-metadata', 'usage-metadata', 'identity-admin', 'security-audit', 'authored-software'],
  kv: ['operational-metadata', 'authored-software'],
  r2: ['authored-software'],
  'durable-object': ['operational-metadata', 'usage-metadata'],
  'cf-queue': ['operational-metadata', 'usage-metadata'],
  'crash-report': ['operational-metadata'],
  'support-bundle': ['operational-metadata'],
  analytics: ['operational-metadata', 'usage-metadata'],
  'local-operator-outbox': ['operational-metadata', 'usage-metadata'],
  'local-settings': ['operational-metadata', 'identity-admin'],
  'local-knowledge': ['content', 'content-derived', 'operational-metadata']
}
export function sinkAllows(sink: Sink, cls: DataClass): boolean {
  return SINK_ALLOWS[sink].includes(cls)
}

// ----- Route qualification (§16.6.1 L1461-1467) ------------------------------------------------

export type PrivacyReadiness = 'UNREVIEWED' | 'CONFIGURED' | 'VERIFIED' | 'BLOCKED'
export interface RouteQualification {
  routeId: string
  modelId: string
  operator: 'cloudflare-workers-ai' | 'ai-gateway-provider-native' | 'ai-gateway-unified-billing' | 'direct-vendor' | 'on-device'
  transport: 'websocket' | 'https' | 'local'
  region: string | null
  /** Named, deliberately configured gateway; the auto-created `default` is never assumed safe (§16.6.3 L1486). */
  gatewayId: string | null
  gatewayLogs: 'off' | 'metadata-only-approved' | 'payload' | 'unknown'
  gatewayCache: 'off' | 'on' | 'unknown'
  readiness: PrivacyReadiness
  /** Deployed config revision the evidence was taken against; drift invalidates VERIFIED (§16.6.4 L1508). */
  configRevision: string
  liveConfigRevision: string | null
  reviewedAt: number | null
  owner: string | null
}

export function routeAdmitsContent(r: RouteQualification): boolean {
  if (r.operator === 'on-device') return r.readiness === 'VERIFIED'
  return (
    r.readiness === 'VERIFIED' &&
    r.liveConfigRevision === r.configRevision &&
    (r.gatewayLogs === 'off' || r.gatewayLogs === 'metadata-only-approved') &&
    r.gatewayCache === 'off' &&
    r.gatewayId !== 'default' &&
    r.owner !== null &&
    r.reviewedAt !== null
  )
}

// ----- Consent (§16.7 L1526, §4.1 L315, TASK-005 verify) ----------------------------------------

export type ConsentPurpose =
  | 'command-capture'
  | 'wake-detection'
  | 'meeting-transcription'
  | 'meeting-summary-storage'
  | 'shared-knowledge-publication'
  | 'screen-context'

export interface ConsentRecord {
  consentId: ConsentId
  principalId: PrincipalId
  deviceId: DeviceId
  purpose: ConsentPurpose
  noticeVersion: string
  basis: 'consent' | 'documented-other-basis'
  epoch: ConsentEpoch
  grantedAt: number
  withdrawnAt: number | null
  policyRevision: PolicyRevision | null
}

export type EffectivePolicyStatus = 'absent' | 'valid' | 'invalid'

export type CaptureDenied =
  | 'POLICY_INVALID'
  | 'NO_CONSENT'
  | 'CONSENT_WITHDRAWN'
  | 'NOTICE_OUTDATED'
  | 'CONSENT_EPOCH_STALE'
  | 'ROUTE_NOT_VERIFIED'

const PURPOSE_FOR: Readonly<Record<'command' | 'dictation' | 'meeting', ConsentPurpose>> = {
  command: 'command-capture',
  dictation: 'command-capture',
  meeting: 'meeting-transcription'
}

/**
 * No parameter carries the selected speech engine: a Cloudflare default can never stand in for consent.
 * `route` is the route the effective engine would use (null for none).
 */
export function captureAllowed(input: {
  purpose: 'command' | 'dictation' | 'meeting'
  principalId: PrincipalId
  consents: readonly ConsentRecord[]
  currentNotice: Readonly<Record<ConsentPurpose, string>>
  liveEpoch: ConsentEpoch
  policyStatus: EffectivePolicyStatus
  route: RouteQualification | null
}): { allowed: true; consentId: ConsentId } | { allowed: false; reason: CaptureDenied } {
  if (input.policyStatus === 'invalid') return { allowed: false, reason: 'POLICY_INVALID' }
  const purpose = PURPOSE_FOR[input.purpose]
  const mine = input.consents.filter((c) => c.purpose === purpose && c.principalId === input.principalId)
  if (mine.length === 0) return { allowed: false, reason: 'NO_CONSENT' }
  const latest = mine.reduce((a, b) => (b.grantedAt > a.grantedAt ? b : a))
  if (latest.withdrawnAt !== null) return { allowed: false, reason: 'CONSENT_WITHDRAWN' }
  if (latest.noticeVersion !== input.currentNotice[purpose]) return { allowed: false, reason: 'NOTICE_OUTDATED' }
  if (latest.epoch !== input.liveEpoch) return { allowed: false, reason: 'CONSENT_EPOCH_STALE' }
  if (!input.route || !routeAdmitsContent(input.route)) return { allowed: false, reason: 'ROUTE_NOT_VERIFIED' }
  return { allowed: true, consentId: latest.consentId }
}

/** Legacy `recordingConsent: true` (ipc.ts:1103) is meeting-scoped and predates the 2.0 notice. */
export function consentFromLegacyRecordingFlag(input: {
  recordingConsent: unknown
  onboardingDoneAt: unknown
  principalId: PrincipalId
  deviceId: DeviceId
  consentId: ConsentId
}): ConsentRecord | null {
  if (input.recordingConsent !== true) return null
  const at = typeof input.onboardingDoneAt === 'number' && input.onboardingDoneAt > 0 ? input.onboardingDoneAt : 0
  return {
    consentId: input.consentId,
    principalId: input.principalId,
    deviceId: input.deviceId,
    purpose: 'meeting-transcription',
    noticeVersion: 'legacy-1.x',
    basis: 'consent',
    epoch: 0 as ConsentEpoch,
    grantedAt: at,
    withdrawnAt: null,
    policyRevision: null
  }
}

// ----- Storage and retention (§16.4 L1444, §13.4 L1158) ----------------------------------------

export interface StoragePolicy {
  transcriptPersistence: 'summary-only' | 'full-local' | 'none'
  humanNotes: 'knowledge-environment-only'
}

export interface RetentionPolicy {
  rawOperationalEventsDays: number
  dailyAggregatesDays: number
  securityAuditDays: number
  identityRecords: 'documented-separately'
  source: 'proposed-default' | 'approved-policy'
  policyRevision: PolicyRevision | null
}
/** §13.4 L1158 proposal; not an approved policy until a privacy owner signs it. */
export const PROPOSED_RETENTION: RetentionPolicy = {
  rawOperationalEventsDays: 30,
  dailyAggregatesDays: 90,
  securityAuditDays: 365,
  identityRecords: 'documented-separately',
  source: 'proposed-default',
  policyRevision: null
}

// ----- Effective policy envelope (§5.7 L424) --------------------------------------------------

export type SettingOwner = 'user' | 'device' | 'organization'
export type EffectivePolicy =
  | { status: 'absent' }
  | { status: 'invalid'; revision: PolicyRevision | null }
  | {
      status: 'valid'
      revision: PolicyRevision
      owner: SettingOwner
      storage: StoragePolicy
      retention: RetentionPolicy
      allowedCapabilities: readonly string[] | 'all'
      /** Applied at a safe session boundary; emergency revocation applies immediately. */
      applyAt: 'next-session-boundary' | 'immediate-revocation'
    }

/** SRC-02: entitlement comes only from a verified signed license/lease, never from telemetry/heartbeat fields. */
declare const entitlementBrand: unique symbol
export interface EntitlementGrant {
  readonly [entitlementBrand]: true
  issuer: string
  licenseId: string
  edition: 'personal' | 'pro' | 'enterprise'
  capabilities: readonly string[]
  expiresAt: number
  source: 'signed-license' | 'offline-lease'
}

/** SRC-17: production readiness must reject memory/placeholder stores and wrong bindings. */
export type StoreBinding = { kind: 'd1'; databaseIdLast4: string } | { kind: 'memory' } | { kind: 'missing' }
export function productionStoreAcceptable(env: 'production' | 'staging' | 'test', b: StoreBinding): boolean {
  if (env === 'test') return true
  return b.kind === 'd1' && /^[a-f0-9]{4}$/.test(b.databaseIdLast4)
}
```

### A.6 usage.ts

Proposed repo path: `src/shared/contracts/usage.ts` · reference file `$SCRATCH/contracts/usage.ts` · sha256 `ced9b72e29a116614938d4f34a374459c3722d7b36e424c55880d06cd87e8a13` · 347 lines

```ts
/**
 * Usage/metering record, provenance-aware merge, streaming accumulation, idempotency and money
 * (MASTER §13.1 L1130-1136, §13.2 L1138-1142, §13.3 L1144-1150, §13.4 L1152-1158, §13.5 L1160-1180,
 * §10.3 L952, §16.5 L1448, SRC-10 L4120-4124). Pure; Worker-safe (no Node imports).
 * Content never appears here: no prompt, transcript, vocabulary, filename, title, URL or preview.
 */
import type {
  AttemptId,
  DeviceId,
  OperationId,
  PrincipalId,
  SpeechSessionId,
  StepId,
  StreamEpoch,
  TenantId,
  UsageEventId
} from './ids'
import type { TrackKind } from './speech-session'

export type Unit = 'tokens' | 'requests' | 'decisions' | 'audio-ms' | 'compute-ms' | 'units-billed'
export type QuantityProvenance = 'provider-reported' | 'gateway-reported' | 'server-measured' | 'client-measured' | 'estimated'

/** Literal zero is { state: 'known', value: 0 }. Missing is 'unavailable' with a reason, never 0 (§13.1 L1136). */
export type Quantity =
  | { state: 'known'; value: number; unit: Unit; provenance: Exclude<QuantityProvenance, 'estimated'> }
  /** Lower bound: e.g. an interrupted stream's last reported cumulative count (§13.5 L1169). */
  | { state: 'partial'; value: number; unit: Unit; provenance: Exclude<QuantityProvenance, 'estimated'> }
  | { state: 'estimated'; value: number; unit: Unit; provenance: 'estimated'; method: 'client-tokenizer' | 'duration-sent' | 'other' }
  | { state: 'unavailable'; unit: Unit; reason: 'provider-not-reported' | 'cancelled-before-usage' | 'not-applicable' | 'metering-write-failed' }

export const QUANTITY_KEYS = [
  'inputTokens',
  'outputTokens',
  'cacheReadTokens',
  'cacheWriteTokens',
  'cacheUncachedTokens',
  'reasoningTokens',
  'requests',
  'decisions',
  'audioSentMs',
  'audioProcessedMs',
  'computeMs',
  'unitsBilled'
] as const
export type QuantityKey = (typeof QUANTITY_KEYS)[number]
export const UNIT_OF: Readonly<Record<QuantityKey, Unit>> = {
  inputTokens: 'tokens',
  outputTokens: 'tokens',
  cacheReadTokens: 'tokens',
  cacheWriteTokens: 'tokens',
  cacheUncachedTokens: 'tokens',
  reasoningTokens: 'tokens',
  requests: 'requests',
  decisions: 'decisions',
  audioSentMs: 'audio-ms',
  audioProcessedMs: 'audio-ms',
  computeMs: 'compute-ms',
  unitsBilled: 'units-billed'
}

export type FundingPath = 'portal-cf' | 'portal-direct' | 'cli' | 'seat-local' | 'personal-key'
export type AttemptStatus = 'in-progress' | 'completed' | 'failed-billable' | 'failed-nonbillable' | 'cancelled' | 'unknown'
export type SafeErrorClass = 'transient' | 'auth' | 'rate-limit' | 'usage-cap' | 'empty-response' | 'upstream-protocol' | 'unknown'

export interface UsageRecord {
  schemaVersion: 'metis.usage.v1'
  /** Delivery identity: a retransmission of this record reuses it and is never another charge. */
  usageEventId: UsageEventId
  /** Chargeable attempt identity: UNIQUE in the ledger; a genuinely new provider call gets a new one. */
  attemptId: AttemptId
  operationId: OperationId
  stepId: StepId | null
  /** Derived by the server from authentication; any payload scope is ignored (§9.7 L847). */
  scope: { tenantId: TenantId; principalId: PrincipalId; deviceId: DeviceId; sessionId: SpeechSessionId | null }
  route: {
    kind: 'llm' | 'speech' | 'decision' | 'embedding'
    provider: string
    modelRequested: string
    /** The actual billed/versioned model when the service exposes it; alias otherwise unresolved (§13.2 L1142). */
    modelBilled: string | null
    checkpoint: string | null
    routeId: string
    fundingPath: FundingPath
  }
  tariffRevision: string | null
  timing: { eventTime: number; ingestTime: number; startedAt: number; completedAt: number | null }
  status: AttemptStatus
  quantities: Partial<Record<QuantityKey, Quantity>>
  /** §13.4 L1154: speech quantities per track/epoch; wall clock is separate from processed audio. */
  speech: { track: TrackKind; epoch: StreamEpoch; wallClockMs: Quantity; transport: 'websocket' | 'https' } | null
  authority: 'server-authoritative' | 'client-supplementary'
  completeness: 'complete' | 'partial' | 'unknown'
  errorClass: SafeErrorClass | null
  /** Explicit, auditable correction; the only way to lower an already-known quantity. */
  correction: { reason: 'provider-reconciliation' | 'tariff-recompute' | 'operator-adjustment'; supersedes: UsageEventId } | null
}

// ----- Streaming accumulation (§13.3 L1146, §13.5 L1167) ---------------------------------------

export type CountSemantics = 'cumulative' | 'delta' | 'final-only'
/** Each enabled provider fixture must declare its semantics per quantity; guessing is a defect. */
export function accumulate(prev: number | null, value: number, semantics: CountSemantics): { value: number; anomaly: boolean } {
  if (!Number.isFinite(value) || value < 0) return { value: prev ?? 0, anomaly: true }
  if (semantics === 'delta') return { value: (prev ?? 0) + value, anomaly: false }
  if (semantics === 'final-only') return { value, anomaly: false }
  // cumulative snapshots: never summed; a decrease is recorded as an anomaly, not applied
  if (prev !== null && value < prev) return { value: prev, anomaly: true }
  return { value, anomaly: false }
}

// ----- Provenance-aware merge (§13.1 L1134, SRC-10) ---------------------------------------------

const PROVENANCE_RANK: Readonly<Record<QuantityProvenance, number>> = {
  'provider-reported': 5,
  'gateway-reported': 4,
  'server-measured': 3,
  'client-measured': 2,
  estimated: 1
}
const STATE_RANK = { known: 3, partial: 2, estimated: 1, unavailable: 0 } as const

export function mergeQuantity(prev: Quantity | undefined, next: Quantity | undefined): Quantity | undefined {
  if (!next) return prev
  if (!prev) return next
  if (prev.unit !== next.unit) throw new TypeError('UNIT_MISMATCH')
  if (next.state === 'unavailable') return prev
  if (prev.state === 'unavailable') return next
  const rp = PROVENANCE_RANK[prev.provenance]
  const rn = PROVENANCE_RANK[next.provenance]
  if (rn !== rp) return rn > rp ? next : prev
  if (STATE_RANK[next.state] !== STATE_RANK[prev.state]) return STATE_RANK[next.state] > STATE_RANK[prev.state] ? next : prev
  return next.value >= prev.value ? next : prev
}

const TERMINAL_STATUS: readonly AttemptStatus[] = ['completed', 'failed-billable', 'failed-nonbillable', 'cancelled']

export type MergeResult =
  | { ok: true; record: UsageRecord; effect: 'inserted' | 'merged' | 'duplicate-delivery' }
  | { ok: false; reason: 'OWNERSHIP_CONFLICT' | 'ATTEMPT_MISMATCH' | 'SCHEMA' }

export function mergeUsageRecord(prev: UsageRecord | null, next: UsageRecord): MergeResult {
  if (next.schemaVersion !== 'metis.usage.v1') return { ok: false, reason: 'SCHEMA' }
  if (!prev) return { ok: true, record: next, effect: 'inserted' }
  if (prev.attemptId !== next.attemptId) return { ok: false, reason: 'ATTEMPT_MISMATCH' }
  if (
    prev.scope.deviceId !== next.scope.deviceId ||
    prev.scope.principalId !== next.scope.principalId ||
    prev.scope.tenantId !== next.scope.tenantId
  ) {
    return { ok: false, reason: 'OWNERSHIP_CONFLICT' }
  }
  if (prev.usageEventId === next.usageEventId) return { ok: true, record: prev, effect: 'duplicate-delivery' }
  const quantities: Partial<Record<QuantityKey, Quantity>> = { ...prev.quantities }
  for (const key of QUANTITY_KEYS) {
    const merged = next.correction ? next.quantities[key] ?? prev.quantities[key] : mergeQuantity(prev.quantities[key], next.quantities[key])
    if (merged) quantities[key] = merged
  }
  const serverWins = prev.authority === 'server-authoritative' && next.authority === 'client-supplementary'
  const status: AttemptStatus =
    TERMINAL_STATUS.includes(prev.status) && !TERMINAL_STATUS.includes(next.status)
      ? prev.status
      : serverWins && TERMINAL_STATUS.includes(prev.status)
        ? prev.status
        : next.status
  const record: UsageRecord = {
    ...(serverWins ? prev : next),
    quantities,
    status,
    authority: prev.authority === 'server-authoritative' || next.authority === 'server-authoritative' ? 'server-authoritative' : 'client-supplementary',
    timing: {
      eventTime: Math.min(prev.timing.eventTime, next.timing.eventTime),
      ingestTime: Math.max(prev.timing.ingestTime, next.timing.ingestTime),
      startedAt: Math.min(prev.timing.startedAt, next.timing.startedAt),
      completedAt: prev.timing.completedAt ?? next.timing.completedAt
    },
    route: { ...prev.route, modelBilled: prev.route.modelBilled ?? next.route.modelBilled, checkpoint: prev.route.checkpoint ?? next.route.checkpoint }
  }
  return { ok: true, record, effect: 'merged' }
}

// ----- Full-window aggregate (§13.5 L1164, SRC-10): the SQL aggregate must equal this reducer -------

export interface QuantityTotals {
  known: number
  partialLowerBound: number
  estimated: number
  /** Records where the quantity was explicitly unavailable: shown as a coverage gap, never as zero. */
  unavailable: number
}
export interface UsageAggregate {
  attempts: number
  operations: number
  byKey: Partial<Record<QuantityKey, QuantityTotals>>
}
/** One merged ledger row per attemptId; delivery duplicates were already collapsed by mergeUsageRecord. */
export function aggregateUsage(rows: Iterable<UsageRecord>): UsageAggregate {
  const ops = new Set<string>()
  const atts = new Set<string>()
  const byKey: Partial<Record<QuantityKey, QuantityTotals>> = {}
  for (const r of rows) {
    if (atts.has(r.attemptId)) throw new Error('DUPLICATE_ATTEMPT_ROW')
    atts.add(r.attemptId)
    ops.add(r.operationId)
    for (const key of QUANTITY_KEYS) {
      const q = r.quantities[key]
      if (!q) continue
      const t = (byKey[key] ??= { known: 0, partialLowerBound: 0, estimated: 0, unavailable: 0 })
      if (q.state === 'known') t.known += q.value
      else if (q.state === 'partial') t.partialLowerBound += q.value
      else if (q.state === 'estimated') t.estimated += q.value
      else t.unavailable += 1
    }
  }
  return { attempts: atts.size, operations: ops.size, byKey }
}

// ----- Money (§13.2 L1142): integer-safe, tariff-revisioned, unknown ≠ zero -----------------------

export type Currency = 'USD' | 'EUR'
export interface Tariff {
  tariffRevision: string
  currency: Currency
  effectiveFrom: number
  effectiveTo: number | null
  /** Integer micro-currency per 1,000,000 units (e.g. $0.44/MTok → 440000). */
  microsPerMillion: Partial<Record<QuantityKey, number>>
  basis: 'vendor-list-price' | 'contract' | 'verified-zero-cost'
}
export type Cost =
  | { state: 'known'; currency: Currency; picos: bigint; tariffRevision: string }
  | { state: 'partial'; currency: Currency; lowerBoundPicos: bigint; missing: readonly QuantityKey[]; tariffRevision: string }
  | { state: 'unknown'; reason: 'NO_TARIFF' | 'TARIFF_NOT_EFFECTIVE' | 'NO_PRICED_QUANTITY' }

export function costOf(r: UsageRecord, tariff: Tariff | null): Cost {
  if (!tariff) return { state: 'unknown', reason: 'NO_TARIFF' }
  const t = r.timing.eventTime
  if (t < tariff.effectiveFrom || (tariff.effectiveTo !== null && t >= tariff.effectiveTo)) return { state: 'unknown', reason: 'TARIFF_NOT_EFFECTIVE' }
  let picos = BigInt(0)
  const missing: QuantityKey[] = []
  let priced = 0
  let partial = false
  for (const [key, rate] of Object.entries(tariff.microsPerMillion) as [QuantityKey, number][]) {
    if (!Number.isSafeInteger(rate) || rate < 0) throw new RangeError('TARIFF_RATE')
    const q = r.quantities[key]
    if (!q || q.state === 'unavailable') {
      missing.push(key)
      continue
    }
    if (q.state !== 'known') partial = true
    priced++
    picos += BigInt(Math.round(q.value)) * BigInt(rate) // micros/1e6 units → pico-currency
  }
  if (priced === 0) return { state: 'unknown', reason: 'NO_PRICED_QUANTITY' }
  if (missing.length || partial) return { state: 'partial', currency: tariff.currency, lowerBoundPicos: picos, missing, tariffRevision: tariff.tariffRevision }
  return { state: 'known', currency: tariff.currency, picos, tariffRevision: tariff.tariffRevision }
}

// ----- Allowlist projection before every sink (§13.4 L1158, §16.6.3 L1500) -----------------------

const ID_RE = /^[a-z]{2,5}_[a-f0-9]{32}$/
const IDENT_RE = /^[A-Za-z0-9@][A-Za-z0-9._:/@+-]{0,119}$/
const oneOf = <T extends string>(v: unknown, set: readonly T[]): T | null => (typeof v === 'string' && (set as readonly string[]).includes(v) ? (v as T) : null)
const ident = (v: unknown): string | null => (typeof v === 'string' && IDENT_RE.test(v) && !v.includes('://') ? v : null)
const finiteNonNeg = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null)

function projectQuantity(raw: unknown, unit: Unit): Quantity | null {
  if (!raw || typeof raw !== 'object') return null
  const q = raw as Record<string, unknown>
  if (q.unit !== unit) return null
  const state = oneOf(q.state, ['known', 'partial', 'estimated', 'unavailable'] as const)
  if (state === 'unavailable') {
    const reason = oneOf(q.reason, ['provider-not-reported', 'cancelled-before-usage', 'not-applicable', 'metering-write-failed'] as const)
    return reason ? { state, unit, reason } : null
  }
  const value = finiteNonNeg(q.value)
  if (value === null || state === null) return null
  if (state === 'estimated') {
    const method = oneOf(q.method, ['client-tokenizer', 'duration-sent', 'other'] as const)
    return method && q.provenance === 'estimated' ? { state, value, unit, provenance: 'estimated', method } : null
  }
  const provenance = oneOf(q.provenance, ['provider-reported', 'gateway-reported', 'server-measured', 'client-measured'] as const)
  return provenance ? { state, value, unit, provenance } : null
}

/**
 * Builds a NEW object from allowlisted fields only; unknown keys and free-form strings have no path through.
 * Scope comes from the authenticated server context, never from `raw`.
 */
export function projectUsageRecord(raw: unknown, serverScope: UsageRecord['scope'], ingestTime: number): UsageRecord | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (o.schemaVersion !== 'metis.usage.v1') return null
  const usageEventId = typeof o.usageEventId === 'string' && ID_RE.test(o.usageEventId) && o.usageEventId.startsWith('use_') ? o.usageEventId : null
  const attemptId = typeof o.attemptId === 'string' && ID_RE.test(o.attemptId) && o.attemptId.startsWith('att_') ? o.attemptId : null
  const operationId = typeof o.operationId === 'string' && ID_RE.test(o.operationId) && o.operationId.startsWith('op_') ? o.operationId : null
  if (!usageEventId || !attemptId || !operationId) return null
  const route = (o.route ?? {}) as Record<string, unknown>
  const kind = oneOf(route.kind, ['llm', 'speech', 'decision', 'embedding'] as const)
  const provider = ident(route.provider)
  const modelRequested = ident(route.modelRequested)
  const routeId = ident(route.routeId)
  const fundingPath = oneOf(route.fundingPath, ['portal-cf', 'portal-direct', 'cli', 'seat-local', 'personal-key'] as const)
  if (!kind || !provider || !modelRequested || !routeId || !fundingPath) return null
  const timing = (o.timing ?? {}) as Record<string, unknown>
  const eventTime = finiteNonNeg(timing.eventTime)
  const startedAt = finiteNonNeg(timing.startedAt)
  if (eventTime === null || startedAt === null) return null
  const status = oneOf(o.status, ['in-progress', 'completed', 'failed-billable', 'failed-nonbillable', 'cancelled', 'unknown'] as const)
  if (!status) return null
  const quantities: Partial<Record<QuantityKey, Quantity>> = {}
  const rawQ = (o.quantities ?? {}) as Record<string, unknown>
  for (const key of QUANTITY_KEYS) {
    if (rawQ[key] === undefined) continue
    const q = projectQuantity(rawQ[key], UNIT_OF[key])
    if (!q) return null // a malformed quantity is rejected, not coerced to zero
    quantities[key] = q
  }
  const stepId = typeof o.stepId === 'string' && ID_RE.test(o.stepId) && o.stepId.startsWith('step_') ? o.stepId : null
  return {
    schemaVersion: 'metis.usage.v1',
    usageEventId: usageEventId as UsageEventId,
    attemptId: attemptId as AttemptId,
    operationId: operationId as OperationId,
    stepId: stepId as StepId | null,
    scope: serverScope,
    route: { kind, provider, modelRequested, modelBilled: ident(route.modelBilled), checkpoint: ident(route.checkpoint), routeId, fundingPath },
    tariffRevision: ident(o.tariffRevision),
    timing: { eventTime, ingestTime, startedAt, completedAt: finiteNonNeg(timing.completedAt) },
    status,
    quantities,
    speech: null,
    authority: 'client-supplementary',
    completeness: oneOf(o.completeness, ['complete', 'partial', 'unknown'] as const) ?? 'unknown',
    errorClass: oneOf(o.errorClass, ['transient', 'auth', 'rate-limit', 'usage-cap', 'empty-response', 'upstream-protocol', 'unknown'] as const),
    correction: null
  }
}

// ----- Budget reservation (§13.3 L1150) — contract only; atomicity is the store's job (TASK-034) ---
export interface BudgetReservation {
  reservationId: string
  attemptId: AttemptId
  scope: UsageRecord['scope']
  maxMicros: number
  state: 'reserved' | 'settled' | 'released' | 'expired'
  expiresAt: number
}
```

### A.7 agent.ts

Proposed repo path: `src/shared/contracts/agent.ts` · reference file `$SCRATCH/contracts/agent.ts` · sha256 `3504af34d554a01f919eba8527ba960cea64c796659514585222325b02cb0797` · 130 lines

```ts
/**
 * AGSTEP-02 freeze: agent definition, run identity, context coverage, one desktop input writer
 * (MASTER §32.2 L4417-4423, §32.4 L4443-4447, §32.8 L4495-4499; AGX-02/06/09; HC-04/07/10/11/16/24/26).
 * Pure; no authentication. Authority is resolved server-side from IDs, never from display text.
 */
import type {
  AgentId,
  AttemptId,
  ConsentEpoch,
  ConversationId,
  DeviceId,
  OperationId,
  PolicyRevision,
  PrincipalId,
  RunId,
  TargetSnapshotId,
  TenantId
} from './ids'
import type { DataClass } from './policy'

/** HC-07/AGX-06: identity is separate from model, skill, thread and run. Renaming never changes authority. */
export interface AgentDefinition {
  agentId: AgentId
  tenantId: TenantId
  ownerPrincipalId: PrincipalId
  visibility: 'personal' | 'team' | 'organization'
  displayName: string
  voiceAliases: readonly string[]
  purpose: string
  lifecycle: 'draft' | 'active' | 'suspended' | 'retired'
  revision: number
  orb: { family: 'metis-solving'; tint: string; initial: string }
  /** HC-26: permissions are runtime grants referenced by ID; role text, memory or skills cannot widen them. */
  capabilityProfileId: string
  skillBindings: readonly { skillId: string; version: string }[]
  connectorRefs: readonly string[]
  memoryNamespace: string
  runtimePolicyId: string
  budgetProfileId: string
  providerPin: { kind: 'dust-agent'; remoteId: string } | { kind: 'model-route'; routeId: string } | null
}

/** Fields whose change is authority-relevant and therefore needs a new reviewed revision. */
export const AUTHORITY_FIELDS = ['capabilityProfileId', 'connectorRefs', 'memoryNamespace', 'runtimePolicyId', 'budgetProfileId', 'providerPin', 'visibility', 'tenantId', 'ownerPrincipalId'] as const
export function authorityChanged(a: AgentDefinition, b: AgentDefinition): boolean {
  return AUTHORITY_FIELDS.some((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
}

export interface Run {
  runId: RunId
  agentId: AgentId
  agentRevision: number
  conversationId: ConversationId
  initiatingPrincipalId: PrincipalId
  surface: 'desktop' | 'native-mac' | 'teams' | 'dust'
  operationId: OperationId
  intent: { original: string }
  context: readonly { snapshotId: TargetSnapshotId; revision: string }[]
  policyRevision: PolicyRevision
  consentEpoch: ConsentEpoch
  providerRoute: string
  attemptIds: readonly AttemptId[]
  lifecycle: 'queued' | 'running' | 'awaiting-approval' | 'completed' | 'failed' | 'cancelled' | 'unknown'
  generation: number
}

/** §32.2 L4423: callbacks validate every identity and the generation; a late callback never retargets. */
export function acceptRunCallback(
  ev: { tenantId: TenantId; agentId: AgentId; conversationId: ConversationId; runId: RunId; generation: number },
  live: { tenantId: TenantId; run: Run; cancelled: boolean }
): boolean {
  return (
    !live.cancelled &&
    ev.tenantId === live.tenantId &&
    ev.agentId === live.run.agentId &&
    ev.conversationId === live.run.conversationId &&
    ev.runId === live.run.runId &&
    ev.generation === live.run.generation
  )
}

/** AGX-02/HC-11: exact coverage; "I see everything" is never a claim. */
export type Coverage = 'FULL' | 'PARTIAL' | 'VISIBLE_ONLY' | 'UNAVAILABLE'
export interface ContextSnapshot {
  snapshotId: TargetSnapshotId
  sourceKind: 'file' | 'app-buffer' | 'screenshot' | 'connector' | 'meeting-summary' | 'selection'
  targetId: string
  principalId: PrincipalId
  tenantId: TenantId
  revision: string
  capturedAt: number
  method: 'file-handle' | 'app-api' | 'accessibility' | 'ocr' | 'connector'
  /** §32.4 L4445: unsaved buffer differs from the on-disk file; report which one was read. */
  representation: 'unsaved-buffer' | 'on-disk' | 'remote' | 'visible-pixels'
  coverage: Coverage
  excluded: readonly ('metis-surfaces' | 'password-fields' | 'unrelated-apps' | 'protected-sessions')[]
  sensitivity: DataClass
  audiences: readonly string[]
  leaseExpiresAt: number
}
/** HC-24: Métis's own windows are always excluded from a screen capture used as context. */
export function snapshotWellFormed(s: ContextSnapshot): boolean {
  if (s.sourceKind === 'screenshot' && !s.excluded.includes('metis-surfaces')) return false
  if (s.sourceKind === 'screenshot' && s.coverage === 'FULL') return false
  if (s.representation === 'visible-pixels' && s.coverage !== 'VISIBLE_ONLY' && s.coverage !== 'UNAVAILABLE') return false
  return true
}

/** AGX-09/§32.8 L4495: one desktop input writer per enrolled device. */
export interface InputLease {
  deviceId: DeviceId
  runId: RunId
  agentId: AgentId | null
  principalId: PrincipalId
  policyRevision: PolicyRevision
  generation: number
  expiresAt: number
}
export function acquireInputLease(
  held: InputLease | null,
  req: Omit<InputLease, 'expiresAt'> & { authorized: boolean; locked: boolean },
  now: number,
  ttlMs: number
): { ok: true; lease: InputLease } | { ok: false; reason: 'NOT_AUTHORIZED' | 'LOCKED' | 'DEVICE_BUSY' } {
  if (!req.authorized) return { ok: false, reason: 'NOT_AUTHORIZED' }
  if (req.locked) return { ok: false, reason: 'LOCKED' }
  if (held && held.expiresAt > now && held.runId !== req.runId) return { ok: false, reason: 'DEVICE_BUSY' }
  const { authorized: _a, locked: _l, ...lease } = req
  return { ok: true, lease: { ...lease, expiresAt: now + ttlMs } }
}
```

## Appendix B — Golden cross-platform fixtures (executed by V2; B.1 also by V4)

### B.1 speech-selection.v1.json

Proposed repo path: `src/shared/contracts/__golden__/speech-selection.v1.json` · reference file `$SCRATCH/contracts/__golden__/speech-selection.v1.json` · sha256 `07cfd63e44845509e0eb1de74e9456725f1dcf94b17030e18ecefac9aa3a0eec` · 165 lines

```json
{
  "schema": "metis.golden.speech-selection.v1",
  "contractVersion": "metis.speech-engine.v1",
  "note": "Synthetic contract fixtures. Consumed identically by TypeScript (vitest) and Swift (XCTest). Not live evidence (MASTER §33).",
  "defaults": { "now": 1000, "noticeVersion": "2.0-speech-1", "policyRevision": "pol-1" },
  "readinessShorthand": {
    "usable": { "rungs": { "policy-loaded": "pass", "device-authorized": "pass", "service-reachable": "pass", "config-qualified": "pass" }, "installed": true, "selfTest": "pass" },
    "unreachable": { "rungs": { "policy-loaded": "pass", "device-authorized": "pass", "service-reachable": "fail", "config-qualified": "pass" } },
    "installed-selftest-fail": { "rungs": { "policy-loaded": "pass", "config-qualified": "pass" }, "installed": true, "selfTest": "fail" },
    "not-installed": { "rungs": { "policy-loaded": "pass", "config-qualified": "pass" }, "installed": false, "selfTest": "not-run" }
  },
  "cases": [
    {
      "id": "SM-01", "kit": "MASTER L833, L835; TASK-005 verify (fresh eligible 2.0 = Cloudflare)",
      "given": { "user": null, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "fresh-default", "engine": "cloudflare-nova3" }, "notice": "none",
        "effective": { "status": "ready", "effective": "cloudflare-nova3", "via": "selected" } }
    },
    {
      "id": "SM-02", "kit": "MASTER L835, L881, L1260, L1280 (installed pack never selects; no silent fallback)",
      "given": { "user": null, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "unreachable", "local-parakeet": "usable", "local-whisper": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "fresh-default", "engine": "cloudflare-nova3" }, "notice": "none",
        "effective": { "status": "blocked", "reason": "NOT_READY" } }
    },
    {
      "id": "SM-03", "kit": "MASTER L835 (hardware never selects); replaces store.ts:691-703 RAM preference",
      "given": { "user": { "onboardingDone": false }, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-whisper": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "fresh-default", "engine": "cloudflare-nova3" }, "notice": "none",
        "effective": { "status": "ready", "effective": "cloudflare-nova3", "via": "selected" } }
    },
    {
      "id": "SM-04", "kit": "MASTER L1467 (no content before route VERIFIED)",
      "given": { "user": null, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "usable" }, "privacyVerified": [] },
      "expect": { "selection": { "source": "fresh-default", "engine": "cloudflare-nova3" }, "notice": "none",
        "effective": { "status": "blocked", "reason": "PRIVACY_NOT_VERIFIED" } }
    },
    {
      "id": "SM-05", "kit": "MASTER L837 (preserve explicit offline choice)",
      "given": { "user": { "asrEngine": "parakeet", "onboardingDone": true }, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "legacy-explicit", "engine": "local-parakeet" }, "notice": "none",
        "effective": { "status": "ready", "effective": "local-parakeet", "via": "selected" } }
    },
    {
      "id": "SM-06", "kit": "MASTER L835 (Apple speech only when explicitly chosen)",
      "given": { "user": { "asrEngine": "apple", "onboardingDone": true }, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "local-apple": "usable" }, "privacyVerified": [] },
      "expect": { "selection": { "source": "legacy-explicit", "engine": "local-apple" }, "notice": "none",
        "effective": { "status": "ready", "effective": "local-apple", "via": "selected" } }
    },
    {
      "id": "SM-07", "kit": "MASTER L837 (ambiguous legacy → visible choice); store.ts:815-825 persisted a RAM-derived whisper",
      "given": { "user": { "asrEngine": "whisper", "onboardingDone": true }, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-whisper": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "needs-choice", "engine": null, "reason": "ambiguous-legacy-whisper" }, "notice": "ask-choice",
        "effective": { "status": "ready", "effective": "local-whisper", "via": "interim-legacy-local" } }
    },
    {
      "id": "SM-08", "kit": "MASTER L837 (never begin uploading because an upgrade changed a default)",
      "given": { "user": { "onboardingDone": true }, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "migration-default", "engine": "cloudflare-nova3", "pendingAck": true }, "notice": "explain-default",
        "effective": { "status": "ready", "effective": "local-parakeet", "via": "interim-legacy-local" } }
    },
    {
      "id": "SM-09", "kit": "MASTER L837 (after acknowledgment the migrated default applies)",
      "given": { "user": { "onboardingDone": true },
        "previous": { "schemaVersion": "metis.speech-engine.v1", "engine": "cloudflare-nova3", "source": "migration-default", "decidedAt": 900,
          "pendingAck": { "noticeVersion": "2.0-speech-1", "acknowledgedAt": 950, "interim": "local-parakeet" } },
        "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "migration-default", "engine": "cloudflare-nova3" }, "notice": "none",
        "effective": { "status": "ready", "effective": "cloudflare-nova3", "via": "selected" } }
    },
    {
      "id": "SM-10", "kit": "MASTER L837, L881 (lean upgrade without bundled pack: block, never upload unacknowledged)",
      "given": { "user": { "onboardingDone": true }, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "not-installed" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "migration-default", "engine": "cloudflare-nova3", "pendingAck": true }, "notice": "explain-default",
        "effective": { "status": "blocked", "reason": "MIGRATION_ACK_REQUIRED" } }
    },
    {
      "id": "SM-11", "kit": "MASTER L837; cloud-stt-provider.ts:35-44 (legacy CLOUD_ONLY already used Nova-3)",
      "given": { "user": { "onboardingDone": true }, "managed": { "enterpriseLive": { "managed": true, "inferenceMode": "cloud-only", "summaryOnly": true } },
        "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": true },
        "readiness": { "cloudflare-nova3": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "migration-default", "engine": "cloudflare-nova3" }, "notice": "none",
        "effective": { "status": "ready", "effective": "cloudflare-nova3", "via": "org-default" } }
    },
    {
      "id": "SM-12", "kit": "MASTER L799 (Soniox explicit, org-approved alternative, not co-default)",
      "given": { "user": { "cloudSttProvider": "soniox", "onboardingDone": true }, "managed": { "enterpriseLive": { "managed": true, "inferenceMode": "cloud-only" } },
        "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": true },
        "readiness": { "cloudflare-nova3": "usable", "soniox": "usable" }, "privacyVerified": ["cloudflare-nova3", "soniox"] },
      "expect": { "selection": { "source": "legacy-explicit", "engine": "soniox" }, "notice": "none",
        "effective": { "status": "ready", "effective": "soniox", "via": "selected" } }
    },
    {
      "id": "SM-13", "kit": "MASTER L837 (org mode wins, visibly locked; user choice kept, not rewritten)",
      "given": { "user": { "asrEngine": "parakeet", "onboardingDone": true }, "managed": { "enterpriseLive": { "managed": true, "inferenceMode": "cloud-only" } },
        "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": true },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "legacy-explicit", "engine": "local-parakeet" }, "notice": "none",
        "effective": { "status": "ready", "effective": "cloudflare-nova3", "via": "org-default", "locked": true } }
    },
    {
      "id": "SM-14", "kit": "MASTER L837 (malformed policy never weakens); enterprise-live-profile.ts:51 falls back to legacy today",
      "given": { "user": { "onboardingDone": true }, "managed": { "enterpriseLive": { "managed": true, "inferenceMode": "cloud-first" } },
        "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "migration-default", "engine": "cloudflare-nova3", "pendingAck": true }, "notice": "explain-default",
        "effective": { "status": "blocked", "reason": "POLICY_INVALID", "locked": true } }
    },
    {
      "id": "SM-15", "kit": "MASTER L837, L420 (locked org engine)",
      "given": { "user": { "asrEngine": "whisper", "onboardingDone": false }, "managed": { "asrEngine": "parakeet" }, "lockedKeys": ["asrEngine"],
        "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "local-parakeet": "usable", "local-whisper": "usable" }, "privacyVerified": [] },
      "expect": { "selection": { "source": "legacy-explicit", "engine": "local-whisper" }, "notice": "none",
        "effective": { "status": "ready", "effective": "local-parakeet", "via": "org-enforced", "locked": true } }
    },
    {
      "id": "SM-16", "kit": "MASTER L881 (only a previously accepted exact fallback)",
      "given": { "user": null, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "policyOverride": { "status": "valid", "policyRevision": "pol-2", "allowed": ["cloudflare-nova3", "local-parakeet"], "enforced": null, "orgDefault": null,
          "exactFallback": { "from": "cloudflare-nova3", "to": "local-parakeet", "acceptedAt": 500, "consentEpoch": 1 } },
        "readiness": { "cloudflare-nova3": "unreachable", "local-parakeet": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "fresh-default", "engine": "cloudflare-nova3" }, "notice": "none",
        "effective": { "status": "ready", "effective": "local-parakeet", "via": "accepted-exact-fallback" } }
    },
    {
      "id": "SM-17", "kit": "MASTER L881, UC-072 L712 (local-only failure never sends audio to Cloudflare)",
      "given": { "user": { "asrEngine": "parakeet", "onboardingDone": true }, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "installed-selftest-fail" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "legacy-explicit", "engine": "local-parakeet" }, "notice": "none",
        "effective": { "status": "blocked", "reason": "NOT_READY" } }
    },
    {
      "id": "SM-18", "kit": "TASK-005 verify ('eligible'); MASTER L837",
      "given": { "user": null, "ctx": { "eligibleForCloudDefault": false, "legacyManagedCloudOnly": false },
        "readiness": { "local-parakeet": "usable" }, "privacyVerified": [] },
      "expect": { "selection": { "source": "needs-choice", "engine": null, "reason": "fresh-not-eligible" }, "notice": "ask-choice",
        "effective": { "status": "blocked", "reason": "NEEDS_CHOICE" } }
    },
    {
      "id": "SM-19", "kit": "MASTER L837, L839 (conflicting legacy fields → visible choice)",
      "given": { "user": { "asrEngine": "parakeet", "cloudSttProvider": "cloudflare-nova3", "onboardingDone": true },
        "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "needs-choice", "engine": null, "reason": "conflicting-legacy-fields" }, "notice": "ask-choice",
        "effective": { "status": "ready", "effective": "local-parakeet", "via": "interim-legacy-local" } }
    },
    {
      "id": "SM-20", "kit": "MASTER L839 (stored-but-never-effective cloud provider must not start uploads silently)",
      "given": { "user": { "cloudSttProvider": "cloudflare-nova3", "onboardingDone": true }, "ctx": { "eligibleForCloudDefault": true, "legacyManagedCloudOnly": false },
        "readiness": { "cloudflare-nova3": "usable", "local-parakeet": "usable" }, "privacyVerified": ["cloudflare-nova3"] },
      "expect": { "selection": { "source": "legacy-explicit", "engine": "cloudflare-nova3", "pendingAck": true }, "notice": "explain-default",
        "effective": { "status": "ready", "effective": "local-parakeet", "via": "interim-legacy-local" } }
    }
  ]
}
```

### B.2 step-outcome.v1.json

Proposed repo path: `src/shared/contracts/__golden__/step-outcome.v1.json` · reference file `$SCRATCH/contracts/__golden__/step-outcome.v1.json` · sha256 `9065d69f22303185280bc5f2083a0b426206f14393acf05760190e9b24ca14f9` · 46 lines

```json
{
  "schema": "metis.golden.step-outcome.v1",
  "contractVersion": "metis.command.v1",
  "note": "SRC-04 exit evidence: failed/unsupported/unknown/cancelled/throwing adapters never produce verified. Synthetic.",
  "cases": [
    { "id": "SO-01", "kit": "MASTER L303; desktop-adapters.ts:90 okResult default 'unknown'",
      "given": { "dispatched": true, "result": { "ok": true, "outcome": "unknown" }, "receipt": null, "postcondition": "app-frontmost", "idempotency": "idempotent", "attempts": 0, "stopped": false },
      "expect": { "kind": "attempted", "user": "tried-unconfirmed", "retry": "no-retry" } },
    { "id": "SO-02", "kit": "MASTER L303 (adapter cannot self-certify)",
      "given": { "dispatched": true, "result": { "ok": true, "outcome": "verified" }, "receipt": null, "postcondition": "app-frontmost", "idempotency": "reconcile-before-retry", "attempts": 0, "stopped": false },
      "expect": { "kind": "attempted", "user": "tried-unconfirmed", "retry": "reconcile-first" } },
    { "id": "SO-03", "kit": "MASTER L329 (completion only after proof)",
      "given": { "dispatched": true, "result": { "ok": true, "outcome": "unknown" }, "receipt": { "postcondition": "app-frontmost", "sameStep": true }, "postcondition": "app-frontmost", "idempotency": "idempotent", "attempts": 0, "stopped": false },
      "expect": { "kind": "verified", "user": "done", "retry": "no-retry" } },
    { "id": "SO-04", "kit": "command-control.test.ts:64 (result for another action)",
      "given": { "dispatched": true, "result": { "ok": true, "outcome": "verified" }, "receipt": { "postcondition": "app-frontmost", "sameStep": false }, "postcondition": "app-frontmost", "idempotency": "idempotent", "attempts": 0, "stopped": false },
      "expect": { "kind": "attempted", "user": "tried-unconfirmed", "retry": "no-retry" } },
    { "id": "SO-05", "kit": "MASTER L295 (independently observable success criterion)",
      "given": { "dispatched": true, "result": { "ok": true, "outcome": "verified" }, "receipt": { "postcondition": "none-observable", "sameStep": true }, "postcondition": "none-observable", "idempotency": "never-auto-retry", "attempts": 0, "stopped": false },
      "expect": { "kind": "attempted", "user": "tried-unconfirmed", "retry": "reconcile-first" } },
    { "id": "SO-06", "kit": "MASTER L4050 (quarantine uncertain non-idempotent attempt)",
      "given": { "dispatched": true, "result": { "ok": false, "outcome": "failed" }, "receipt": null, "postcondition": "note-exists-with-title", "idempotency": "never-auto-retry", "attempts": 0, "stopped": false },
      "expect": { "kind": "failed", "sideEffect": "possible", "user": "uncertain", "retry": "reconcile-first" } },
    { "id": "SO-07", "kit": "MASTER L4050 (bounded classified safe retry)",
      "given": { "dispatched": true, "result": { "ok": false, "outcome": "failed", "sideEffect": "none" }, "receipt": null, "postcondition": "app-frontmost", "idempotency": "idempotent", "attempts": 1, "stopped": false },
      "expect": { "kind": "failed", "sideEffect": "none", "user": "failed", "retry": "bounded-retry" } },
    { "id": "SO-08", "kit": "MASTER L4052 (finite retries)",
      "given": { "dispatched": true, "result": { "ok": false, "outcome": "failed", "sideEffect": "none" }, "receipt": null, "postcondition": "app-frontmost", "idempotency": "idempotent", "attempts": 2, "stopped": false },
      "expect": { "kind": "failed", "sideEffect": "none", "user": "failed", "retry": "no-retry" } },
    { "id": "SO-09", "kit": "SRC-04 L4052; desktop-adapters.ts:172-175",
      "given": { "dispatched": true, "result": { "ok": false, "outcome": "unsupported" }, "receipt": null, "postcondition": "app-frontmost", "idempotency": "idempotent", "attempts": 0, "stopped": false },
      "expect": { "kind": "unsupported", "user": "unsupported", "retry": "no-retry" } },
    { "id": "SO-10", "kit": "MASTER L348 (do not report nothing happened after commit)",
      "given": { "dispatched": true, "result": { "ok": false, "outcome": "cancelled" }, "receipt": null, "postcondition": "app-frontmost", "idempotency": "idempotent", "attempts": 0, "stopped": false },
      "expect": { "kind": "cancelled", "user": "uncertain", "retry": "no-retry" } },
    { "id": "SO-11", "kit": "SRC-04 L4050; command-control.ts:107-110 maps throw to adapter_failed today",
      "given": { "dispatched": true, "result": { "threw": true }, "receipt": null, "postcondition": "note-exists-with-title", "idempotency": "never-auto-retry", "attempts": 0, "stopped": false },
      "expect": { "kind": "unknown", "user": "uncertain", "retry": "reconcile-first" } },
    { "id": "SO-12", "kit": "SRC-04 L4050",
      "given": { "dispatched": false, "result": { "threw": true }, "receipt": null, "postcondition": "app-frontmost", "idempotency": "idempotent", "attempts": 0, "stopped": false },
      "expect": { "kind": "failed", "sideEffect": "none", "user": "failed", "retry": "bounded-retry" } },
    { "id": "SO-13", "kit": "SRC-04 L4050 (stop must prevent further dispatch)",
      "given": { "dispatched": true, "result": { "ok": false, "outcome": "failed", "sideEffect": "none" }, "receipt": null, "postcondition": "app-frontmost", "idempotency": "idempotent", "attempts": 0, "stopped": true },
      "expect": { "kind": "failed", "sideEffect": "none", "user": "failed", "retry": "no-retry" } }
  ]
}
```

### B.3 capture-consent.v1.json

Proposed repo path: `src/shared/contracts/__golden__/capture-consent.v1.json` · reference file `$SCRATCH/contracts/__golden__/capture-consent.v1.json` · sha256 `77c7829f38e6d3769b764d593d469d1c0ed5ba49a032940ea55986444afec549` · 51 lines

```json
{
  "schema": "metis.golden.capture-consent.v1",
  "contractVersion": "metis.policy.v1",
  "note": "TASK-005 verify: a Cloudflare default is never capture consent. Synthetic.",
  "currentNotice": { "command-capture": "2.0-cmd-1", "wake-detection": "2.0-wake-1", "meeting-transcription": "2.0-meet-1",
    "meeting-summary-storage": "2.0-sum-1", "shared-knowledge-publication": "2.0-pub-1", "screen-context": "2.0-screen-1" },
  "routes": {
    "verified": { "routeId": "cf-nova3-ws", "modelId": "@cf/deepgram/nova-3", "operator": "cloudflare-workers-ai", "transport": "websocket", "region": null,
      "gatewayId": "metis-sensitive", "gatewayLogs": "off", "gatewayCache": "off", "readiness": "VERIFIED", "configRevision": "cfg-7", "liveConfigRevision": "cfg-7", "reviewedAt": 10, "owner": "privacy-owner" },
    "default-gateway": { "routeId": "cf-nova3-ws", "modelId": "@cf/deepgram/nova-3", "operator": "cloudflare-workers-ai", "transport": "websocket", "region": null,
      "gatewayId": "default", "gatewayLogs": "unknown", "gatewayCache": "unknown", "readiness": "CONFIGURED", "configRevision": "cfg-1", "liveConfigRevision": "cfg-1", "reviewedAt": null, "owner": null },
    "drifted": { "routeId": "cf-nova3-ws", "modelId": "@cf/deepgram/nova-3", "operator": "cloudflare-workers-ai", "transport": "websocket", "region": null,
      "gatewayId": "metis-sensitive", "gatewayLogs": "off", "gatewayCache": "off", "readiness": "VERIFIED", "configRevision": "cfg-7", "liveConfigRevision": "cfg-8", "reviewedAt": 10, "owner": "privacy-owner" }
  },
  "cases": [
    { "id": "CS-01", "kit": "TASK-005 verify; MASTER L1526",
      "given": { "purpose": "meeting", "consents": [], "liveEpoch": 1, "policyStatus": "absent", "route": "verified", "speechSelection": "fresh-default" },
      "expect": { "allowed": false, "reason": "NO_CONSENT" } },
    { "id": "CS-02", "kit": "MASTER L1526 (versioned, purpose-scoped); ipc.ts:1103 legacy boolean",
      "given": { "purpose": "meeting", "legacyRecordingConsent": true, "liveEpoch": 0, "policyStatus": "absent", "route": "verified" },
      "expect": { "allowed": false, "reason": "NOTICE_OUTDATED" } },
    { "id": "CS-03", "kit": "MASTER L1526 (purpose scope: meeting consent is not command consent)",
      "given": { "purpose": "command", "consents": [{ "purpose": "meeting-transcription", "noticeVersion": "2.0-meet-1", "epoch": 1, "grantedAt": 5, "withdrawnAt": null }],
        "liveEpoch": 1, "policyStatus": "absent", "route": "verified" },
      "expect": { "allowed": false, "reason": "NO_CONSENT" } },
    { "id": "CS-04", "kit": "MASTER L1526 (withdrawal)",
      "given": { "purpose": "meeting", "consents": [{ "purpose": "meeting-transcription", "noticeVersion": "2.0-meet-1", "epoch": 1, "grantedAt": 5, "withdrawnAt": 9 }],
        "liveEpoch": 1, "policyStatus": "absent", "route": "verified" },
      "expect": { "allowed": false, "reason": "CONSENT_WITHDRAWN" } },
    { "id": "CS-05", "kit": "MASTER L1467, L1486 (auto-created default gateway is not VERIFIED)",
      "given": { "purpose": "meeting", "consents": [{ "purpose": "meeting-transcription", "noticeVersion": "2.0-meet-1", "epoch": 1, "grantedAt": 5, "withdrawnAt": null }],
        "liveEpoch": 1, "policyStatus": "absent", "route": "default-gateway" },
      "expect": { "allowed": false, "reason": "ROUTE_NOT_VERIFIED" } },
    { "id": "CS-06", "kit": "MASTER L1508 (drift fails new content sessions closed)",
      "given": { "purpose": "meeting", "consents": [{ "purpose": "meeting-transcription", "noticeVersion": "2.0-meet-1", "epoch": 1, "grantedAt": 5, "withdrawnAt": null }],
        "liveEpoch": 1, "policyStatus": "absent", "route": "drifted" },
      "expect": { "allowed": false, "reason": "ROUTE_NOT_VERIFIED" } },
    { "id": "CS-07", "kit": "MASTER L837 (malformed policy)",
      "given": { "purpose": "meeting", "consents": [{ "purpose": "meeting-transcription", "noticeVersion": "2.0-meet-1", "epoch": 1, "grantedAt": 5, "withdrawnAt": null }],
        "liveEpoch": 1, "policyStatus": "invalid", "route": "verified" },
      "expect": { "allowed": false, "reason": "POLICY_INVALID" } },
    { "id": "CS-08", "kit": "MASTER L334 (revocation epoch)",
      "given": { "purpose": "meeting", "consents": [{ "purpose": "meeting-transcription", "noticeVersion": "2.0-meet-1", "epoch": 1, "grantedAt": 5, "withdrawnAt": null }],
        "liveEpoch": 2, "policyStatus": "absent", "route": "verified" },
      "expect": { "allowed": false, "reason": "CONSENT_EPOCH_STALE" } },
    { "id": "CS-09", "kit": "positive control",
      "given": { "purpose": "meeting", "consents": [{ "purpose": "meeting-transcription", "noticeVersion": "2.0-meet-1", "epoch": 1, "grantedAt": 5, "withdrawnAt": null }],
        "liveEpoch": 1, "policyStatus": "valid", "route": "verified" },
      "expect": { "allowed": true } }
  ]
}
```

### B.4 usage-ledger.v1.json

Proposed repo path: `src/shared/contracts/__golden__/usage-ledger.v1.json` · reference file `$SCRATCH/contracts/__golden__/usage-ledger.v1.json` · sha256 `43b6ef9592e9636575712086c91017b45b3f9bab6d2c954c15f60ed1c09e7a06` · 107 lines

```json
{
  "schema": "metis.golden.usage-ledger.v1",
  "contractVersion": "metis.usage.v1",
  "note": "MASTER §13.5 L1160-1180 as reducer fixtures. The TASK-034 D1 implementation must produce identical results; these are synthetic, not deployed reconciliation.",
  "shorthand": "q: {key: [state, value|reason, provenance|method]}; ids are labels expanded by the runner to prefixed 32-hex IDs",
  "tariffs": {
    "tokens": { "tariffRevision": "t-tok-1", "currency": "USD", "effectiveFrom": 0, "effectiveTo": null, "microsPerMillion": { "inputTokens": 3000000, "outputTokens": 15000000 }, "basis": "vendor-list-price" },
    "decisions": { "tariffRevision": "t-dec-1", "currency": "USD", "effectiveFrom": 0, "effectiveTo": null, "microsPerMillion": { "decisions": 250000000 }, "basis": "contract" },
    "apple-zero": { "tariffRevision": "t-apl-1", "currency": "USD", "effectiveFrom": 0, "effectiveTo": null, "microsPerMillion": { "requests": 0 }, "basis": "verified-zero-cost" },
    "speech-processed": { "tariffRevision": "t-sp-1", "currency": "USD", "effectiveFrom": 0, "effectiveTo": null, "microsPerMillion": { "audioProcessedMs": 77000 }, "basis": "vendor-list-price" },
    "late": { "tariffRevision": "t-late", "currency": "USD", "effectiveFrom": 5000, "effectiveTo": null, "microsPerMillion": { "inputTokens": 1 }, "basis": "vendor-list-price" }
  },
  "cases": [
    { "id": "UL-01", "kit": "L1164; SRC-10 (dashboard.ts:736 listAsks(2000))",
      "generate": { "count": 2001, "q": { "outputTokens": ["known", 1, "provider-reported"] } },
      "expect": { "aggregate": { "attempts": 2001, "operations": 2001, "outputTokens.known": 2001 } } },
    { "id": "UL-02", "kit": "L1165",
      "merge": [
        { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 120, "provider-reported"], "outputTokens": ["known", 30, "provider-reported"] } },
        { "ev": "e2", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "client", "status": "completed", "q": { "inputTokens": ["unavailable", "provider-not-reported"], "outputTokens": ["unavailable", "provider-not-reported"] } }
      ],
      "expect": { "effects": ["inserted", "merged"], "final": { "inputTokens": 120, "outputTokens": 30 } } },
    { "id": "UL-03", "kit": "L1134 (less-authoritative data cannot downgrade)",
      "merge": [
        { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 120, "provider-reported"], "outputTokens": ["known", 30, "provider-reported"] } },
        { "ev": "e2", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "client", "status": "completed", "q": { "inputTokens": ["estimated", 100, "client-tokenizer"], "outputTokens": ["estimated", 20, "client-tokenizer"] } }
      ],
      "expect": { "effects": ["inserted", "merged"], "final": { "inputTokens": 120, "outputTokens": 30 } } },
    { "id": "UL-04", "kit": "L1166",
      "merge": [
        { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 120, "provider-reported"] } },
        { "ev": "e2", "att": "a1", "op": "o1", "dev": "B", "pr": "p1", "auth": "client", "status": "completed", "q": { "inputTokens": ["known", 999, "client-measured"] } }
      ],
      "expect": { "effects": ["inserted", "OWNERSHIP_CONFLICT"], "final": { "inputTokens": 120 } } },
    { "id": "UL-05", "kit": "L1167",
      "accumulate": [
        { "semantics": "cumulative", "values": [1, 15, 30], "expect": 30, "anomaly": false },
        { "semantics": "delta", "values": [1, 14, 15], "expect": 30, "anomaly": false },
        { "semantics": "cumulative", "values": [30, 12], "expect": 30, "anomaly": true }
      ] },
    { "id": "UL-06", "kit": "L1168",
      "merge": [
        { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "failed-billable", "q": { "inputTokens": ["known", 50, "provider-reported"] } },
        { "ev": "e2", "att": "a2", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 60, "provider-reported"], "outputTokens": ["known", 10, "provider-reported"] } },
        { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "failed-billable", "q": { "inputTokens": ["known", 50, "provider-reported"] } }
      ],
      "expect": { "effects": ["inserted", "inserted", "duplicate-delivery"], "aggregate": { "attempts": 2, "operations": 1, "inputTokens.known": 110 } } },
    { "id": "UL-07", "kit": "L1169",
      "merge": [ { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "cancelled",
        "q": { "inputTokens": ["known", 1000, "provider-reported"], "outputTokens": ["partial", 40, "provider-reported"] } } ],
      "expect": { "cost": { "tariff": "tokens", "state": "partial", "lowerBoundPicos": "3600000000" } } },
    { "id": "UL-08", "kit": "L1170",
      "merge": [ { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed",
        "q": { "inputTokens": ["known", 200, "provider-reported"], "outputTokens": ["known", 20, "provider-reported"], "cacheReadTokens": ["unavailable", "provider-not-reported"] } } ],
      "expect": { "aggregate": { "attempts": 1, "operations": 1, "inputTokens.known": 200, "cacheReadTokens.unavailable": 1 } } },
    { "id": "UL-09", "kit": "L1171, L952",
      "merge": [ { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "kind": "decision",
        "q": { "decisions": ["known", 3, "server-measured"], "outputTokens": ["unavailable", "not-applicable"] } } ],
      "expect": { "cost": { "tariff": "decisions", "state": "known", "picos": "750000000" }, "cost2": { "tariff": "tokens", "state": "unknown", "reason": "NO_PRICED_QUANTITY" } } },
    { "id": "UL-10", "kit": "L1172",
      "merge": [ { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed",
        "q": { "requests": ["known", 1, "server-measured"], "inputTokens": ["unavailable", "provider-not-reported"] } } ],
      "expect": { "cost": { "tariff": "apple-zero", "state": "known", "picos": "0" }, "aggregate": { "attempts": 1, "operations": 1, "inputTokens.unavailable": 1 } } },
    { "id": "UL-11", "kit": "L1173",
      "merge": [
        { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 10, "provider-reported"] } },
        { "ev": "e2", "att": "a1", "op": "o1", "dev": "A", "pr": "p2", "auth": "client", "status": "completed", "q": { "inputTokens": ["known", 10, "client-measured"] } }
      ],
      "expect": { "effects": ["inserted", "OWNERSHIP_CONFLICT"] } },
    { "id": "UL-13", "kit": "L1175, L1154 (tracks/reconnect are distinct attempts; one meeting operation)",
      "merge": [
        { "ev": "e1", "att": "mic1", "op": "meet", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "kind": "speech", "q": { "audioSentMs": ["known", 60000, "client-measured"], "audioProcessedMs": ["known", 59000, "provider-reported"] } },
        { "ev": "e2", "att": "sys1", "op": "meet", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "kind": "speech", "q": { "audioSentMs": ["known", 60000, "client-measured"], "audioProcessedMs": ["unavailable", "provider-not-reported"] } },
        { "ev": "e3", "att": "mic2", "op": "meet", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "kind": "speech", "q": { "audioSentMs": ["known", 30000, "client-measured"], "audioProcessedMs": ["known", 30500, "provider-reported"] } }
      ],
      "expect": { "aggregate": { "attempts": 3, "operations": 1, "audioSentMs.known": 150000, "audioProcessedMs.known": 89500, "audioProcessedMs.unavailable": 1 } } },
    { "id": "UL-15", "kit": "L1177; §16.6.3 L1500 (allowlist projection)",
      "project": { "raw": { "schemaVersion": "metis.usage.v1", "usageEventId": "e1", "attemptId": "a1", "operationId": "o1", "status": "failed-nonbillable",
          "route": { "kind": "speech", "provider": "workers-ai", "modelRequested": "@cf/deepgram/nova-3", "routeId": "cf-nova3-ws", "fundingPath": "portal-cf" },
          "timing": { "eventTime": 10, "startedAt": 9 }, "errorClass": "SENTINEL-TRANSCRIPT the quarterly price is 42k", "errorMessage": "SENTINEL-TRANSCRIPT the quarterly price is 42k",
          "scope": { "deviceId": "attacker" }, "quantities": {} },
        "sentinel": "SENTINEL-TRANSCRIPT" },
      "expect": { "projected": true, "sentinelAbsent": true, "errorClass": null, "scopeFromServer": true } },
    { "id": "UL-16", "kit": "L1178",
      "merge": [ { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "cancelled", "kind": "speech",
        "q": { "audioSentMs": ["known", 5000, "client-measured"], "audioProcessedMs": ["unavailable", "cancelled-before-usage"] } } ],
      "expect": { "cost": { "tariff": "speech-processed", "state": "unknown", "reason": "NO_PRICED_QUANTITY" } } },
    { "id": "UL-17", "kit": "L1136 (no coercion of malformed to zero)",
      "project": { "raw": { "schemaVersion": "metis.usage.v1", "usageEventId": "e1", "attemptId": "a1", "operationId": "o1", "status": "completed",
          "route": { "kind": "llm", "provider": "anthropic", "modelRequested": "claude-sonnet", "routeId": "portal-direct", "fundingPath": "portal-direct" },
          "timing": { "eventTime": 10, "startedAt": 9 }, "quantities": { "inputTokens": { "state": "known", "value": "12", "unit": "tokens", "provenance": "provider-reported" } } } },
      "expect": { "projected": false } },
    { "id": "UL-18", "kit": "L1142 (unknown tariff → unknown cost, not zero)",
      "merge": [ { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 10, "provider-reported"] } } ],
      "expect": { "cost": { "tariff": null, "state": "unknown", "reason": "NO_TARIFF" } } },
    { "id": "UL-19", "kit": "L1142 (effective dates)",
      "merge": [ { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 10, "provider-reported"] } } ],
      "expect": { "cost": { "tariff": "late", "state": "unknown", "reason": "TARIFF_NOT_EFFECTIVE" } } },
    { "id": "UL-20", "kit": "L1134 (corrections need explicit provenance)",
      "merge": [
        { "ev": "e1", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 120, "provider-reported"] } },
        { "ev": "e2", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 100, "provider-reported"] } },
        { "ev": "e3", "att": "a1", "op": "o1", "dev": "A", "pr": "p1", "auth": "server", "status": "completed", "q": { "inputTokens": ["known", 100, "provider-reported"] }, "correction": "e1" }
      ],
      "expect": { "effects": ["inserted", "merged", "merged"], "finalAfter": [120, 120, 100] } }
  ]
}
```

## Appendix C — Swift mirror and golden parity runner (compiled and run, V4/V5)

### C.1 SpeechEngineContract.swift

Proposed repo path: `native-app/MetisKit/Sources/MetisKit/Contracts/SpeechEngineContract.swift` · reference file `$SCRATCH/swift/SpeechEngineContract.swift` · sha256 `f129709e8c43e90f202ece5ee9f0f828c027293d42aa52eda086e223e8187a73` · 246 lines

```swift
import Foundation

// Proposed native-app/MetisKit/Sources/MetisKit/Contracts/SpeechEngineContract.swift (TASK-005).
// Mirrors src/shared/contracts/speech-engine.ts; parity is pinned by the shared golden JSON, not by
// reading the TypeScript. Pure: no AVFoundation, no Speech framework, no hardware or asset queries.

public enum SpeechEngineID: String, Codable, Sendable, CaseIterable {
    case cloudflareNova3 = "cloudflare-nova3"
    case soniox = "soniox"
    case localParakeet = "local-parakeet"
    case localWhisper = "local-whisper"
    case localApple = "local-apple"
    public var isCloud: Bool { self == .cloudflareNova3 || self == .soniox }
    public static let fresh20Default: SpeechEngineID = .cloudflareNova3
}

public enum SelectionSource: String, Codable, Sendable {
    case freshDefault = "fresh-default"
    case userExplicit = "user-explicit"
    case legacyExplicit = "legacy-explicit"
    case migrationDefault = "migration-default"
    case needsChoice = "needs-choice"
    var isExplicit: Bool { self == .userExplicit || self == .legacyExplicit }
}

public struct PendingAck: Codable, Sendable, Equatable {
    public var noticeVersion: String
    public var acknowledgedAt: Double?
    public var interim: SpeechEngineID?
}

/// Flat encoding of the TS `SelectionState` union (needs-choice carries reason/proposed/interim).
public struct SelectionState: Codable, Sendable, Equatable {
    public var schemaVersion: String = "metis.speech-engine.v1"
    public var engine: SpeechEngineID?
    public var source: SelectionSource
    public var decidedAt: Double
    public var pendingAck: PendingAck?
    public var reason: String?
    public var proposed: SpeechEngineID?
    public var interim: SpeechEngineID?
}

public struct ExactFallback: Codable, Sendable, Equatable {
    public var from: SpeechEngineID
    public var to: SpeechEngineID
    public var acceptedAt: Double
    public var consentEpoch: Int
}

public struct ValidSpeechPolicy: Codable, Sendable, Equatable {
    public var policyRevision: String
    public var allowed: [SpeechEngineID]
    public var enforced: SpeechEngineID?
    public var orgDefault: SpeechEngineID?
    public var exactFallback: ExactFallback?
}

public enum SpeechPolicy: Sendable, Equatable, Decodable {
    case absent
    case invalid(revision: String?)
    case valid(ValidSpeechPolicy)
    enum Keys: String, CodingKey { case status, policyRevision }
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: Keys.self)
        switch try c.decode(String.self, forKey: .status) {
        case "absent": self = .absent
        case "invalid": self = .invalid(revision: try c.decodeIfPresent(String.self, forKey: .policyRevision))
        case "valid": self = .valid(try ValidSpeechPolicy(from: decoder))
        default: self = .invalid(revision: nil)
        }
    }
    var revision: String? {
        switch self { case .absent: nil; case .invalid(let r): r; case .valid(let v): v.policyRevision }
    }
}

public enum RungState: String, Codable, Sendable { case pass, fail, unknown }
public struct EngineReadiness: Codable, Sendable {
    public var rungs: [String: RungState]
    public var installed: Bool?
    public var selfTest: String?
}

func engineUsable(_ e: SpeechEngineID, _ r: EngineReadiness?) -> Bool {
    guard let r else { return false }
    if e.isCloud {
        return ["policy-loaded", "device-authorized", "service-reachable", "config-qualified"].allSatisfy { r.rungs[$0] == .pass }
    }
    return r.rungs["policy-loaded"] == .pass && r.rungs["config-qualified"] == .pass && r.installed == true && r.selfTest == "pass"
}

public enum EffectiveSpeech: Sendable, Equatable {
    case ready(effective: SpeechEngineID, via: String, locked: Bool)
    case blocked(reason: String, locked: Bool)
}

public func resolveEffectiveSpeech(
    selection: SelectionState,
    policy: SpeechPolicy,
    readiness: [SpeechEngineID: EngineReadiness],
    privacyVerified: (SpeechEngineID) -> Bool
) -> EffectiveSpeech {
    if case .invalid = policy { return .blocked(reason: "POLICY_INVALID", locked: true) }
    var valid: ValidSpeechPolicy? = nil
    if case .valid(let v) = policy { valid = v }
    func allowed(_ e: SpeechEngineID) -> Bool { valid?.allowed.contains(e) ?? true }
    let selected = selection.engine
    let explicit = selection.source.isExplicit
    let candidate: SpeechEngineID
    var via: String
    var locked = false
    if let enforced = valid?.enforced {
        candidate = enforced; via = "org-enforced"; locked = true
    } else if explicit, let s = selected, allowed(s) {
        candidate = s; via = "selected"
    } else if let d = valid?.orgDefault, allowed(d) {
        candidate = d; via = "org-default"; locked = explicit
    } else if selection.source == .needsChoice {
        guard let i = selection.interim, allowed(i) else { return .blocked(reason: "NEEDS_CHOICE", locked: false) }
        candidate = i; via = "interim-legacy-local"
    } else if let s = selected, allowed(s) {
        candidate = s; via = "selected"
    } else {
        return .blocked(reason: "NOT_ALLOWED_BY_POLICY", locked: valid != nil)
    }
    if !allowed(candidate) { return .blocked(reason: "NOT_ALLOWED_BY_POLICY", locked: true) }
    let pending: Bool
    let interim: SpeechEngineID?
    if selection.source == .needsChoice {
        pending = selection.interim != nil; interim = selection.interim
    } else {
        pending = selection.pendingAck != nil && selection.pendingAck?.acknowledgedAt == nil
        interim = selection.pendingAck?.interim
    }
    if pending && candidate.isCloud {
        if let i = interim, allowed(i), engineUsable(i, readiness[i]) {
            return .ready(effective: i, via: "interim-legacy-local", locked: locked)
        }
        return .blocked(reason: "MIGRATION_ACK_REQUIRED", locked: locked)
    }
    func admissible(_ e: SpeechEngineID) -> Bool { engineUsable(e, readiness[e]) && (!e.isCloud || privacyVerified(e)) }
    if admissible(candidate) { return .ready(effective: candidate, via: via, locked: locked) }
    if let fb = valid?.exactFallback, fb.from == candidate, fb.to != candidate, allowed(fb.to), admissible(fb.to) {
        return .ready(effective: fb.to, via: "accepted-exact-fallback", locked: locked)
    }
    if candidate.isCloud && engineUsable(candidate, readiness[candidate]) && !privacyVerified(candidate) {
        return .blocked(reason: "PRIVACY_NOT_VERIFIED", locked: locked)
    }
    return .blocked(reason: "NOT_READY", locked: locked)
}

// MARK: - Migration from 1.9.x layers (native Mac has no 1.9.x settings; this keeps semantics identical
// for any imported Electron profile and for the golden parity test).

public struct LegacyUserLayer: Decodable, Sendable {
    public var asrEngine: String?
    public var cloudSttProvider: String?
    public var onboardingDone: Bool?
    public var onboardingDoneAt: Double?
}

public struct MigrationContext: Decodable, Sendable {
    public var eligibleForCloudDefault: Bool
    public var legacyManagedCloudOnly: Bool
}

public struct MigrationResult: Sendable, Equatable {
    public var selection: SelectionState
    public var notice: String
}

/// No hardware, installed-pack, Apple Intelligence or consent parameter by design.
public func migrateSpeechSelection(user: LegacyUserLayer?, previous: SelectionState?, ctx: MigrationContext,
                                   now: Double, noticeVersion: String) -> MigrationResult {
    if let p = previous, p.schemaVersion == "metis.speech-engine.v1" { return MigrationResult(selection: p, notice: "none") }
    let map: [String: SpeechEngineID] = ["parakeet": .localParakeet, "whisper": .localWhisper, "apple": .localApple]
    let legacyLocal = user?.asrEngine.flatMap { map[$0] }
    let legacyCloud = user?.cloudSttProvider.flatMap { $0 == "cloudflare-nova3" || $0 == "soniox" ? SpeechEngineID(rawValue: $0) : nil }
    let completed = user.map { $0.onboardingDone == true || ($0.onboardingDoneAt ?? 0) > 0 } ?? false
    func choice(_ reason: String, _ proposed: SpeechEngineID?, _ interim: SpeechEngineID?) -> MigrationResult {
        MigrationResult(selection: SelectionState(engine: nil, source: .needsChoice, decidedAt: now, pendingAck: nil,
                                                  reason: reason, proposed: proposed, interim: interim), notice: "ask-choice")
    }
    func pick(_ e: SpeechEngineID, _ s: SelectionSource, _ ack: PendingAck?) -> MigrationResult {
        MigrationResult(selection: SelectionState(engine: e, source: s, decidedAt: now, pendingAck: ack),
                        notice: ack == nil ? "none" : "explain-default")
    }
    if user == nil || (!completed && legacyLocal == nil && legacyCloud == nil) {
        return ctx.eligibleForCloudDefault ? pick(.fresh20Default, .freshDefault, nil) : choice("fresh-not-eligible", nil, nil)
    }
    if let l = legacyLocal, legacyCloud != nil { return choice("conflicting-legacy-fields", l, l) }
    if legacyLocal == .localWhisper && completed { return choice("ambiguous-legacy-whisper", .localWhisper, .localWhisper) }
    if let l = legacyLocal { return pick(l, .legacyExplicit, nil) }
    if let c = legacyCloud {
        let ack = ctx.legacyManagedCloudOnly ? nil : PendingAck(noticeVersion: noticeVersion, acknowledgedAt: nil, interim: .localParakeet)
        return pick(c, .legacyExplicit, ack)
    }
    if ctx.legacyManagedCloudOnly { return pick(.fresh20Default, .migrationDefault, nil) }
    if !ctx.eligibleForCloudDefault { return pick(.localParakeet, .legacyExplicit, nil) }
    return pick(.fresh20Default, .migrationDefault, PendingAck(noticeVersion: noticeVersion, acknowledgedAt: nil, interim: .localParakeet))
}

public struct LegacyManagedLayer: Decodable, Sendable {
    public struct EnterpriseLive: Decodable, Sendable { var managed: Bool?; var inferenceMode: String?; var summaryOnly: Bool? }
    var enterpriseLive: EnterpriseLive?
    var enterpriseLivePresentButUndecodable = false
    var cloudSttProvider: String?
    var asrEngine: String?
    enum Keys: String, CodingKey { case enterpriseLive, cloudSttProvider, asrEngine }
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: Keys.self)
        if c.contains(.enterpriseLive) {
            enterpriseLive = try? c.decode(EnterpriseLive.self, forKey: .enterpriseLive)
            enterpriseLivePresentButUndecodable = enterpriseLive == nil
        }
        cloudSttProvider = try? c.decodeIfPresent(String.self, forKey: .cloudSttProvider)
        asrEngine = try? c.decodeIfPresent(String.self, forKey: .asrEngine)
    }
}

public func speechPolicyFromLegacyManaged(_ m: LegacyManagedLayer?, lockedKeys: [String], policyRevision: String) -> SpeechPolicy {
    guard let m else { return .absent }
    if m.enterpriseLivePresentButUndecodable { return .invalid(revision: policyRevision) }
    var cloudOnly = false
    if let el = m.enterpriseLive {
        if let mode = el.inferenceMode, mode != "legacy" && mode != "cloud-only" { return .invalid(revision: policyRevision) }
        cloudOnly = el.managed == true && el.inferenceMode == "cloud-only"
    }
    let managedCloud: SpeechEngineID? = (m.cloudSttProvider == "cloudflare-nova3" || m.cloudSttProvider == "soniox") ? SpeechEngineID(rawValue: m.cloudSttProvider!) : nil
    if let p = m.cloudSttProvider, p != "unconfigured", managedCloud == nil { return .invalid(revision: policyRevision) }
    let map: [String: SpeechEngineID] = ["parakeet": .localParakeet, "whisper": .localWhisper, "apple": .localApple]
    let managedLocal = m.asrEngine.flatMap { map[$0] }
    if m.asrEngine != nil && managedLocal == nil { return .invalid(revision: policyRevision) }
    if cloudOnly {
        return .valid(ValidSpeechPolicy(policyRevision: policyRevision, allowed: [.cloudflareNova3, .soniox],
                                        enforced: lockedKeys.contains("cloudSttProvider") ? managedCloud : nil,
                                        orgDefault: managedCloud ?? .cloudflareNova3, exactFallback: nil))
    }
    if let engine = managedCloud ?? managedLocal {
        let locked = lockedKeys.contains("asrEngine") || lockedKeys.contains("cloudSttProvider")
        return .valid(ValidSpeechPolicy(policyRevision: policyRevision, allowed: SpeechEngineID.allCases,
                                        enforced: locked ? engine : nil, orgDefault: engine, exactFallback: nil))
    }
    return .absent
}
```

### C.2 main.swift (stand-in for ContractGoldenTests.swift)

Proposed repo path: `native-app/MetisKit/Tests/MetisKitTests/ContractGoldenTests.swift (as XCTest)` · reference file `$SCRATCH/swift/main.swift` · sha256 `798d5300d8e403dcba6290b513e84ad6e1e160d079bbc38359ae47e9cd810fed` · 59 lines

```swift
import Foundation

// Synthetic golden parity runner (stand-in for a MetisKitTests XCTest). Not live evidence.
struct Golden: Decodable {
    struct Defaults: Decodable { var now: Double; var noticeVersion: String; var policyRevision: String }
    struct Given: Decodable {
        var user: LegacyUserLayer?
        var previous: SelectionState?
        var ctx: MigrationContext
        var managed: LegacyManagedLayer?
        var lockedKeys: [String]?
        var policyOverride: SpeechPolicy?
        var readiness: [String: String]
        var privacyVerified: [String]
    }
    struct ExpectSel: Decodable { var source: String; var engine: String?; var reason: String?; var pendingAck: Bool? }
    struct ExpectEff: Decodable { var status: String; var effective: String?; var via: String?; var reason: String?; var locked: Bool? }
    struct Expect: Decodable { var selection: ExpectSel; var notice: String; var effective: ExpectEff }
    struct Case: Decodable { var id: String; var given: Given; var expect: Expect }
    var defaults: Defaults
    var readinessShorthand: [String: EngineReadiness]
    var cases: [Case]
}

let url = URL(fileURLWithPath: CommandLine.arguments[1])
let golden = try JSONDecoder().decode(Golden.self, from: Data(contentsOf: url))
var pass = 0
var failures: [String] = []
@MainActor func check(_ id: String, _ ok: Bool, _ detail: String = "") { if ok { pass += 1 } else { failures.append("\(id) \(detail)") } }

for c in golden.cases {
    let g = c.given
    let mig = migrateSpeechSelection(user: g.user, previous: g.previous, ctx: g.ctx, now: golden.defaults.now, noticeVersion: golden.defaults.noticeVersion)
    let policy = g.policyOverride ?? speechPolicyFromLegacyManaged(g.managed, lockedKeys: g.lockedKeys ?? [], policyRevision: golden.defaults.policyRevision)
    var readiness: [SpeechEngineID: EngineReadiness] = [:]
    for (k, v) in g.readiness { if let e = SpeechEngineID(rawValue: k) { readiness[e] = golden.readinessShorthand[v] } }
    let verified = Set(g.privacyVerified)
    let eff = resolveEffectiveSpeech(selection: mig.selection, policy: policy, readiness: readiness, privacyVerified: { verified.contains($0.rawValue) })
    let x = c.expect
    check("\(c.id) source", mig.selection.source.rawValue == x.selection.source, "\(mig.selection)")
    check("\(c.id) engine", mig.selection.engine?.rawValue == x.selection.engine, "\(mig.selection)")
    if let r = x.selection.reason { check("\(c.id) reason", mig.selection.reason == r) }
    if let p = x.selection.pendingAck { check("\(c.id) pendingAck", (mig.selection.pendingAck != nil) == p) }
    check("\(c.id) notice", mig.notice == x.notice, mig.notice)
    switch eff {
    case .ready(let e, let via, let locked):
        check("\(c.id) status", x.effective.status == "ready", "\(eff)")
        if let xe = x.effective.effective { check("\(c.id) effective", e.rawValue == xe, "\(eff)") }
        if let xv = x.effective.via { check("\(c.id) via", via == xv, "\(eff)") }
        if let xl = x.effective.locked { check("\(c.id) locked", locked == xl, "\(eff)") }
    case .blocked(let reason, let locked):
        check("\(c.id) status", x.effective.status == "blocked", "\(eff)")
        if let xr = x.effective.reason { check("\(c.id) blocked.reason", reason == xr, "\(eff)") }
        if let xl = x.effective.locked { check("\(c.id) locked", locked == xl, "\(eff)") }
    }
}
print("swift golden parity: pass=\(pass) fail=\(failures.count)")
for f in failures { print("  FAIL \(f)") }
exit(failures.isEmpty ? 0 : 1)
```

## Appendix D — Synthetic self-check runner (V2/V3)

This runner stands in for the proposed `src/shared/contracts/*.test.ts` vitest files. The inline SG/DC/AP/CP/TR/AG cases should move into those tests; SG should also become `__golden__/segment-revision.v1.json` for Swift. Reference tsconfig used for V1: `$SCRATCH/contracts/tsconfig.json`.

### D.1 selfcheck.mts

Proposed repo path: `(not committed; converted to vitest)` · reference file `$SCRATCH/contracts/selfcheck.mts` · sha256 `a414428c3e20a67edb3a9849a4f13d8fca3d8a111d3226e44cb667a429acb080` · 373 lines

```ts
// Synthetic self-check of the TASK-005 reference contracts against the golden fixtures.
// NOT a repo test and NOT live evidence (MASTER §33). Run: esbuild bundle → node.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  resolveEffectiveSpeech,
  migrateSpeechSelection,
  speechPolicyFromLegacyManaged,
  SPEECH_ENGINES,
  type EngineReadiness,
  type SpeechEngineId,
  type SpeechPolicy,
  type SelectionState,
  type CloudSpeechEngineId
} from './speech-engine'
import {
  applySegmentEvent,
  startNewEpoch,
  closeEpoch,
  requestStop,
  sessionFinalization,
  commandUtteranceFrom,
  validateSessionRequest,
  type TranscriptWindow,
  type ProviderSegmentEvent
} from './speech-session'
import {
  classifyStep,
  retryDecision,
  userFacingResult,
  applyDecision,
  checkApproval,
  capabilityDefects,
  eligibleCapabilities,
  canTransition,
  type VerifierReceipt,
  type CapabilityDefinition,
  type ApprovalRecord,
  type LiveAuthority
} from './command'
import { captureAllowed, consentFromLegacyRecordingFlag, type ConsentRecord, type RouteQualification } from './policy'
import {
  mergeUsageRecord,
  accumulate,
  aggregateUsage,
  costOf,
  projectUsageRecord,
  UNIT_OF,
  type UsageRecord,
  type Quantity,
  type QuantityKey,
  type Tariff
} from './usage'
import { authorityChanged, acceptRunCallback, acquireInputLease, snapshotWellFormed, type AgentDefinition, type Run, type ContextSnapshot } from './agent'

const here = dirname(fileURLToPath(import.meta.url))
const gold = (f: string) => JSON.parse(readFileSync(join(here, '..', '__golden__', f), 'utf8'))
let pass = 0
const failures: string[] = []
function check(id: string, cond: boolean, detail: unknown = '') {
  if (cond) pass++
  else failures.push(`${id}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`)
}
const deepFreeze = <T,>(o: T): T => {
  if (o && typeof o === 'object') {
    Object.freeze(o)
    for (const v of Object.values(o as object)) deepFreeze(v)
  }
  return o
}

// ---------------- speech selection / migration ----------------
const sm = gold('speech-selection.v1.json')
function expandReadiness(r: Record<string, string>): Map<SpeechEngineId, EngineReadiness> {
  const m = new Map<SpeechEngineId, EngineReadiness>()
  for (const [e, short] of Object.entries(r)) m.set(e as SpeechEngineId, { engine: e as SpeechEngineId, observedAt: 1, ...sm.readinessShorthand[short] })
  return m
}
function run(given: any, extraCtx: Record<string, unknown> = {}) {
  const ctx = { now: sm.defaults.now, noticeVersion: sm.defaults.noticeVersion, ...given.ctx, ...extraCtx }
  const mig = migrateSpeechSelection(deepFreeze({ user: given.user ?? null, previous: given.previous ?? null }), ctx)
  const policy: SpeechPolicy = given.policyOverride ?? speechPolicyFromLegacyManaged({ managed: given.managed ?? null, lockedKeys: given.lockedKeys ?? [], policyRevision: sm.defaults.policyRevision })
  const readiness = expandReadiness(given.readiness)
  const verified = new Set<string>(given.privacyVerified)
  const selection = deepFreeze(structuredClone(mig.selection)) as SelectionState
  const before = JSON.stringify(selection)
  const eff = resolveEffectiveSpeech({ selection, policy, readiness, privacyVerified: (e: CloudSpeechEngineId) => verified.has(e) })
  return { mig, eff, policy, readiness, selectionUnchanged: JSON.stringify(selection) === before }
}
for (const c of sm.cases) {
  const { mig, eff, policy, selectionUnchanged } = run(c.given)
  const x = c.expect
  check(`${c.id} selection.source`, mig.selection.source === x.selection.source, mig.selection)
  check(`${c.id} selection.engine`, mig.selection.engine === x.selection.engine, mig.selection)
  if (x.selection.reason) check(`${c.id} selection.reason`, (mig.selection as any).reason === x.selection.reason, mig.selection)
  if (x.selection.pendingAck !== undefined) check(`${c.id} pendingAck`, ((mig.selection as any).pendingAck !== null) === x.selection.pendingAck, mig.selection)
  check(`${c.id} notice`, mig.notice === x.notice, mig.notice)
  check(`${c.id} effective.status`, eff.status === x.effective.status, eff)
  if (x.effective.effective) check(`${c.id} effective.engine`, eff.effective === x.effective.effective, eff)
  if (x.effective.via) check(`${c.id} effective.via`, eff.status === 'ready' && eff.via === x.effective.via, eff)
  if (x.effective.reason) check(`${c.id} effective.reason`, eff.status === 'blocked' && eff.reason === x.effective.reason, eff)
  if (x.effective.locked !== undefined) check(`${c.id} locked`, eff.locked === x.effective.locked, eff)
  // I1: selection never mutated/rewritten by resolution
  check(`${c.id} I1 selection unchanged`, selectionUnchanged)
  // Hardware / Apple Intelligence / installed-pack hints are inert to migration
  const noisy = run(c.given, { totalMemoryBytes: 64 * 1024 ** 3, appleIntelligence: true, installedPacks: ['local-whisper', 'local-apple'] })
  check(`${c.id} hardware inert`, JSON.stringify(noisy.mig) === JSON.stringify(mig), noisy.mig)
  // I2: marking every uninvolved local engine installed+usable never changes the effective result
  const sel: any = mig.selection
  const involved = new Set<string>([sel.engine, sel.interim, sel.pendingAck?.interim, (policy as any).enforced, (policy as any).orgDefault, (policy as any).exactFallback?.to].filter(Boolean))
  const r2: Record<string, string> = { ...c.given.readiness }
  for (const e of SPEECH_ENGINES) if (e.startsWith('local-') && !involved.has(e)) r2[e] = 'usable'
  const again = run({ ...c.given, readiness: r2 })
  check(`${c.id} I2 unselected installs inert`, JSON.stringify(again.eff) === JSON.stringify(eff), { before: eff, after: again.eff })
}

// ---------------- consent: default is not consent ----------------
const cs = gold('capture-consent.v1.json')
for (const c of cs.cases) {
  const g = c.given
  const pid = 'p1' as any
  let consents: ConsentRecord[] = (g.consents ?? []).map((r: any, i: number) => ({ consentId: `cns_${i}`, principalId: pid, deviceId: 'd1', basis: 'consent', policyRevision: null, ...r }))
  if (g.legacyRecordingConsent) {
    const legacy = consentFromLegacyRecordingFlag({ recordingConsent: true, onboardingDoneAt: 5, principalId: pid, deviceId: 'd1' as any, consentId: 'cns_legacy' as any })
    consents = legacy ? [legacy] : []
  }
  const out = captureAllowed({ purpose: g.purpose, principalId: pid, consents, currentNotice: cs.currentNotice, liveEpoch: g.liveEpoch, policyStatus: g.policyStatus, route: cs.routes[g.route] as RouteQualification })
  check(`${c.id} allowed`, out.allowed === c.expect.allowed, out)
  if (c.expect.reason) check(`${c.id} reason`, !out.allowed && out.reason === c.expect.reason, out)
}

// ---------------- step outcomes ----------------
const so = gold('step-outcome.v1.json')
for (const c of so.cases) {
  const g = c.given
  const receipt = g.receipt
    ? ({ postcondition: g.receipt.postcondition, stepId: g.receipt.sameStep ? 'step_x' : 'step_other', observedAt: 2, evidenceRef: 'ev' } as unknown as VerifierReceipt)
    : null
  const o = classifyStep({ stepId: 'step_x' as any, dispatched: g.dispatched, dispatchedAt: 1, result: g.result, receipt, postcondition: g.postcondition })
  check(`${c.id} kind`, o.kind === c.expect.kind, o)
  if (c.expect.sideEffect) check(`${c.id} sideEffect`, o.kind === 'failed' && o.sideEffect === c.expect.sideEffect, o)
  check(`${c.id} user`, userFacingResult(o) === c.expect.user, userFacingResult(o))
  check(`${c.id} retry`, retryDecision(o, g.idempotency, g.attempts, g.stopped) === c.expect.retry, retryDecision(o, g.idempotency, g.attempts, g.stopped))
  if (o.kind !== 'verified') check(`${c.id} never done unless verified`, userFacingResult(o) !== 'done')
}

// ---------------- usage ledger ----------------
const ul = gold('usage-ledger.v1.json')
const hex = (label: string) => Buffer.from(label).toString('hex').padEnd(32, '0').slice(0, 32)
const toQ = (key: QuantityKey, spec: any[]): Quantity => {
  const unit = UNIT_OF[key]
  const [state, a, b] = spec
  if (state === 'unavailable') return { state, unit, reason: a }
  if (state === 'estimated') return { state, value: a, unit, provenance: 'estimated', method: b }
  return { state, value: a, unit, provenance: b }
}
function rec(s: any, i = 0): UsageRecord {
  const q: Partial<Record<QuantityKey, Quantity>> = {}
  for (const [k, v] of Object.entries(s.q ?? {})) q[k as QuantityKey] = toQ(k as QuantityKey, v as any[])
  return {
    schemaVersion: 'metis.usage.v1',
    usageEventId: `use_${hex(s.ev)}` as any,
    attemptId: `att_${hex(s.att)}` as any,
    operationId: `op_${hex(s.op)}` as any,
    stepId: null,
    scope: { tenantId: 't1' as any, principalId: s.pr as any, deviceId: s.dev as any, sessionId: null },
    route: { kind: s.kind ?? 'llm', provider: 'p', modelRequested: 'm', modelBilled: null, checkpoint: null, routeId: 'r', fundingPath: 'portal-cf' },
    tariffRevision: null,
    timing: { eventTime: 10 + i, ingestTime: 20 + i, startedAt: 9, completedAt: 11 },
    status: s.status,
    quantities: q,
    speech: null,
    authority: s.auth === 'server' ? 'server-authoritative' : 'client-supplementary',
    completeness: 'complete',
    errorClass: null,
    correction: s.correction ? { reason: 'provider-reconciliation', supersedes: `use_${hex(s.correction)}` as any } : null
  }
}
for (const c of ul.cases) {
  const x = c.expect ?? {}
  if (c.accumulate) {
    for (const [i, a] of c.accumulate.entries()) {
      let v: number | null = null
      let anomaly = false
      for (const n of a.values) {
        const r = accumulate(v, n, a.semantics)
        v = r.value
        anomaly ||= r.anomaly
      }
      check(`${c.id}[${i}] value`, v === a.expect, v)
      check(`${c.id}[${i}] anomaly`, anomaly === a.anomaly, anomaly)
    }
    continue
  }
  if (c.project) {
    const raw = structuredClone(c.project.raw)
    raw.usageEventId = `use_${hex(raw.usageEventId)}`
    raw.attemptId = `att_${hex(raw.attemptId)}`
    raw.operationId = `op_${hex(raw.operationId)}`
    const serverScope = { tenantId: 't1' as any, principalId: 'p1' as any, deviceId: 'server-dev' as any, sessionId: null }
    const p = projectUsageRecord(raw, serverScope, 99)
    check(`${c.id} projected`, (p !== null) === x.projected, p)
    if (p && c.project.sentinel) check(`${c.id} sentinel absent`, !JSON.stringify(p).includes(c.project.sentinel), p)
    if (p && 'errorClass' in x) check(`${c.id} errorClass`, p.errorClass === x.errorClass, p.errorClass)
    if (p && x.scopeFromServer) check(`${c.id} scope`, p.scope.deviceId === ('server-dev' as any), p.scope)
    continue
  }
  const ledger = new Map<string, UsageRecord>()
  const effects: string[] = []
  const finals: number[] = []
  const records: UsageRecord[] = c.generate
    ? Array.from({ length: c.generate.count }, (_, i) => rec({ ev: `g${i}`, att: `g${i}`, op: `g${i}`, dev: 'A', pr: 'p1', auth: 'server', status: 'completed', q: c.generate.q }, i))
    : c.merge.map((s: any, i: number) => rec(s, i))
  for (const r of records) {
    const m = mergeUsageRecord(ledger.get(r.attemptId) ?? null, r)
    effects.push(m.ok ? m.effect : m.reason)
    if (m.ok) ledger.set(r.attemptId, m.record)
    const first = [...ledger.values()][0]
    const iq = first?.quantities.inputTokens
    if (iq && iq.state !== 'unavailable') finals.push(iq.value)
  }
  if (x.effects) check(`${c.id} effects`, JSON.stringify(effects) === JSON.stringify(x.effects), effects)
  if (x.finalAfter) check(`${c.id} finalAfter`, JSON.stringify(finals) === JSON.stringify(x.finalAfter), finals)
  const only = [...ledger.values()][0]
  if (x.final) {
    for (const [k, v] of Object.entries(x.final)) {
      const q = only?.quantities[k as QuantityKey]
      check(`${c.id} final.${k}`, !!q && q.state !== 'unavailable' && q.value === v, q)
    }
  }
  if (x.aggregate) {
    const agg = aggregateUsage(ledger.values())
    for (const [k, v] of Object.entries(x.aggregate)) {
      const [key, field] = k.split('.')
      const got = field ? (agg.byKey as any)[key]?.[field] : (agg as any)[key]
      check(`${c.id} aggregate.${k}`, got === v, got)
    }
  }
  for (const ck of ['cost', 'cost2'] as const) {
    const e = x[ck]
    if (!e) continue
    const tariff: Tariff | null = e.tariff ? ul.tariffs[e.tariff] : null
    const cost = costOf(only!, tariff)
    check(`${c.id} ${ck}.state`, cost.state === e.state, cost)
    if (e.reason) check(`${c.id} ${ck}.reason`, cost.state === 'unknown' && cost.reason === e.reason, cost)
    if (e.picos) check(`${c.id} ${ck}.picos`, cost.state === 'known' && cost.picos.toString() === e.picos, String((cost as any).picos))
    if (e.lowerBoundPicos) check(`${c.id} ${ck}.lowerBound`, cost.state === 'partial' && cost.lowerBoundPicos.toString() === e.lowerBoundPicos, String((cost as any).lowerBoundPicos))
  }
}

// ---------------- segments (inline) ----------------
const sid = 'sps_0123456789abcdef0123456789abcdef' as any
const win = (purpose: TranscriptWindow['purpose'] = 'meeting', max = 100): TranscriptWindow =>
  startNewEpoch(
    { sessionId: sid, purpose, captureGeneration: 3 as any, epochs: new Map(), segments: new Map(), gaps: [], maxSegments: max, evictedThroughMs: null, stop: 'open' },
    'mic',
    'att_mic1' as any,
    0,
    null
  )
const ev = (p: Partial<ProviderSegmentEvent>): ProviderSegmentEvent => ({
  sessionId: sid, captureGeneration: 3 as any, track: 'mic', epoch: 1 as any, providerStartMs: 1000, providerEndMs: 1500, finality: 'partial', endpoint: false,
  text: 'open', language: 'en', languageSource: 'provider-detected', confidence: null, speaker: { kind: 'channel', track: 'mic' }, engine: 'cloudflare-nova3', modelRevision: null, ...p
})
{
  let w = win()
  let r = applySegmentEvent(w, ev({ text: 'open' }))
  check('SG-01 inserted', r.effect === 'inserted')
  w = r.window
  r = applySegmentEvent(w, ev({ text: 'open chrome', providerEndMs: 1800 }))
  check('SG-01 revised', r.effect === 'revised' && w.segments.size === 1 && r.window.segments.get(r.segmentId!)!.revision === 2, r)
  w = r.window
  r = applySegmentEvent(w, ev({ text: 'open chrome', providerEndMs: 1800 }))
  check('SG-02 duplicate', r.effect === 'duplicate' && r.window === w)
  r = applySegmentEvent(w, ev({ text: 'open chrome actually do not', providerEndMs: 2400, finality: 'final', endpoint: true }))
  check('SG-03 final revision', r.effect === 'revised' && r.window.segments.get(r.segmentId!)!.revision === 3)
  w = r.window
  check('SG-03 final immutable', applySegmentEvent(w, ev({ text: 'open', providerEndMs: 1500 })).effect === 'final-immutable')
  check('SG-04 duplicate final', applySegmentEvent(w, ev({ text: 'open chrome actually do not', providerEndMs: 2400, finality: 'final', endpoint: true })).effect === 'duplicate')
  check('SG-07 endpoint is not stream-final', sessionFinalization(w) === 'in-progress')
  const w2 = startNewEpoch(w, 'mic', 'att_mic2' as any, 5000, { fromMs: 2400, toMs: 5000, reason: 'reconnect' })
  check('SG-05 stale epoch', applySegmentEvent(w2, ev({ providerStartMs: 3000, providerEndMs: 3500 })).effect === 'stale-epoch')
  check('SG-05 gap recorded + old epoch truncated', w2.gaps.length === 1 && w2.gaps[0]!.reason === 'reconnect')
  const inNew = applySegmentEvent(w2, ev({ epoch: 2 as any, providerStartMs: 100, providerEndMs: 400, finality: 'final' }))
  check('SG-05 new epoch offset monotonic', inNew.effect === 'inserted' && inNew.window.segments.get(inNew.segmentId!)!.startMs === 5100)
  let threw = false
  try { startNewEpoch(w2, 'mic', 'att_mic3' as any, 1000, null) } catch { threw = true }
  check('SG-05 non-monotonic offset rejected', threw)
  check('SG-06 stale generation', applySegmentEvent(w, ev({ captureGeneration: 2 as any })).effect === 'stale-generation')
  check('SG-15 invalid time', applySegmentEvent(w, ev({ providerStartMs: -1 })).effect === 'invalid-time')
  const g = requestStop(w, 'graceful-tail', true)
  check('SG-08 bare close = truncated', sessionFinalization(closeEpoch(g, 'mic', 'socket-closed')) === 'incomplete-tail')
  check('SG-09 terminal after flush = complete', sessionFinalization(closeEpoch(g, 'mic', 'provider-terminal')) === 'complete')
  check('SG-09b terminal without flush ≠ complete', sessionFinalization(closeEpoch(w, 'mic', 'provider-terminal')) === 'incomplete-tail')
  const rv = requestStop(w, 'revoke', false)
  check('SG-10 revoked drops events', applySegmentEvent(rv, ev({ providerStartMs: 9000, providerEndMs: 9100 })).effect === 'revoked')
  const rvOk = requestStop(w, 'revoke', true)
  check('SG-10b revoked-with-valid-scope keeps transcript, no command', applySegmentEvent(rvOk, ev({ providerStartMs: 9000, providerEndMs: 9100 })).effect === 'inserted')
  const finalId = [...w.segments.keys()][0]!
  check('SG-11 meeting cannot command', (commandUtteranceFrom(w, [finalId]) as any).rejected === 'NOT_COMMAND_PURPOSE')
  let cw = win('command')
  const t = 'Métis, ouvre Notes — s’il te plaît'
  const p1 = applySegmentEvent(cw, ev({ text: t }))
  check('SG-12 partial cannot command', (commandUtteranceFrom(p1.window, [p1.segmentId!]) as any).rejected === 'NOT_FINAL')
  const f1 = applySegmentEvent(p1.window, ev({ text: t, finality: 'final' }))
  cw = f1.window
  const cu: any = commandUtteranceFrom(cw, [f1.segmentId!])
  check('SG-12 original text preserved exactly', cu.original === t, cu)
  check('SG-12b revoked window cannot command', (commandUtteranceFrom(requestStop(cw, 'revoke', true), [f1.segmentId!]) as any).rejected === 'REVOKED')
  const base = { schemaVersion: 'metis.speech-session.v1', sessionId: sid, operationId: 'op_x', captureGeneration: 1, engine: 'cloudflare-nova3', language: { mode: 'auto' }, policyRevision: 'p', consentEpoch: 1 } as any
  check('SG-13 command mic+system rejected', !validateSessionRequest({ ...base, purpose: 'command', requestedTracks: ['mic', 'system'] }).ok)
  check('SG-13b command mic ok', validateSessionRequest({ ...base, purpose: 'command', requestedTracks: ['mic'] }).ok)
  check('SG-13c meeting duplicate track rejected', !validateSessionRequest({ ...base, purpose: 'meeting', requestedTracks: ['mic', 'mic'] }).ok)
  let bw = win('meeting', 2)
  for (let i = 0; i < 3; i++) bw = applySegmentEvent(bw, ev({ providerStartMs: i * 1000, providerEndMs: i * 1000 + 500, finality: 'final', text: `s${i}` })).window
  check('SG-14 bounded window evicts with explicit interval', bw.segments.size === 2 && bw.evictedThroughMs === 500, { size: bw.segments.size, ev: bw.evictedThroughMs })
}

// ---------------- decision / approval / capability / transitions (inline) ----------------
{
  const req = { schemaVersion: 'metis.decision.v1', operationId: 'op_1', attemptId: 'att_1', captureGeneration: 4, snapshotId: 'snap_1', intentSpan: 'open notes', candidateIds: ['apps.open:notes'], questions: ['target'], deadlineMs: 800, policyRevision: 'pr1' } as any
  const res = (r: any, o: any = {}) => ({ attemptId: 'att_1', snapshotId: 'snap_1', provider: 'jev', modelRevision: null, confidence: null, result: r, ...o }) as any
  const live = { captureGeneration: 4, snapshotId: 'snap_1', policyRevision: 'pr1' } as any
  check('DC-01 applied', applyDecision(req, res({ kind: 'candidate', candidateId: 'apps.open:notes' }), live).applied)
  check('DC-02 out-of-candidate', (applyDecision(req, res({ kind: 'candidate', candidateId: 'shell:rm' }), live) as any).reason === 'NOT_A_CANDIDATE')
  check('DC-03 stale generation', (applyDecision(req, res({ kind: 'candidate', candidateId: 'apps.open:notes' }), { ...live, captureGeneration: 5 }) as any).reason === 'GENERATION_STALE')
  check('DC-04 forged attempt', (applyDecision(req, res({ kind: 'candidate', candidateId: 'apps.open:notes' }, { attemptId: 'att_2' }), live) as any).reason === 'ATTEMPT_MISMATCH')
  check('DC-05 stale snapshot', (applyDecision(req, res({ kind: 'candidate', candidateId: 'apps.open:notes' }), { ...live, snapshotId: 'snap_2' }) as any).reason === 'SNAPSHOT_STALE')
  check('DC-06 clarify', (applyDecision(req, res({ kind: 'clarify' }), live) as any).reason === 'CLARIFY')
  check('DC-07 policy changed', (applyDecision(req, res({ kind: 'candidate', candidateId: 'apps.open:notes' }), { ...live, policyRevision: 'pr2' }) as any).reason === 'POLICY_CHANGED')

  const a: ApprovalRecord = { approvalId: 'apv_1', operationId: 'op_1', planId: 'plan_1', stepIds: ['step_1'], targetSnapshotIds: ['snap_1'], captureGeneration: 4, policyRevision: 'pr1', agent: null, sideEffect: 'R1', audience: 'local-device', maxCostMicros: null, expiresAt: 100, consumed: false } as any
  const L: LiveAuthority = { now: 50, sessionLive: true, captureGeneration: 4, policyRevision: 'pr1', planId: 'plan_1', stepIds: ['step_1'], targetSnapshotIds: ['snap_1'], agent: null } as any
  const why = (o: any) => (o.ok ? 'OK' : o.reason)
  check('AP-01 valid', checkApproval(a, L).ok)
  check('AP-02 expired', why(checkApproval(a, { ...L, now: 100 })) === 'EXPIRED')
  check('AP-03 consumed (no duplicate write)', why(checkApproval({ ...a, consumed: true }, L)) === 'CONSUMED')
  check('AP-04 generation', why(checkApproval(a, { ...L, captureGeneration: 5 as any })) === 'GENERATION_CHANGED')
  check('AP-05 target replaced', why(checkApproval(a, { ...L, targetSnapshotIds: ['snap_2' as any] })) === 'TARGET_CHANGED')
  check('AP-06 agent switched ("do it" not transferable)', why(checkApproval(a, { ...L, agent: { agentId: 'ag2' as any, revision: 1 } })) === 'AGENT_CHANGED')
  check('AP-07 policy', why(checkApproval(a, { ...L, policyRevision: 'pr2' as any })) === 'POLICY_CHANGED')
  check('AP-08 extra step', why(checkApproval(a, { ...L, stepIds: ['step_1', 'step_2'] as any })) === 'PLAN_CHANGED')
  check('AP-09 session dead (stop/lock)', why(checkApproval(a, { ...L, sessionLive: false })) === 'SESSION_DEAD')

  const cap = (o: Partial<CapabilityDefinition>): CapabilityDefinition => ({ id: 'apps.open', version: 1, platforms: ['win32', 'darwin'], prerequisites: [], validateArgs: () => ({}), sensitivity: 'operational-metadata', risk: 'R1', mode: 'act', target: 'catalog-resolved', approval: 'none-within-authorized-session', cancellation: 'abortable-until-commit', idempotency: 'idempotent', timeoutMs: 2000, postcondition: 'app-frontmost', ...o })
  check('CP-01 R3 needs exact approval', capabilityDefects(cap({ risk: 'R3', approval: 'visible-confirmation' })).includes('R3_WITHOUT_EXACT_APPROVAL'))
  check('CP-02 draft cannot claim target effect', capabilityDefects(cap({ mode: 'draft' })).includes('NON_ACT_MODE_WITH_TARGET_EFFECT'))
  const reg = [cap({}), cap({ id: 'camera.capture', platforms: ['darwin'], prerequisites: ['camera'] }), cap({ id: 'purchase', approval: 'prohibited', risk: 'R3' })]
  const el = eligibleCapabilities(reg, { platform: 'win32', granted: new Set(), policyAllows: () => true }).map((c) => c.id)
  check('CP-03 filtered before model selection', JSON.stringify(el) === JSON.stringify(['apps.open']), el)
  check('TR-01 EXECUTING→COMPLETED forbidden', !canTransition('EXECUTING', 'COMPLETED'))
  check('TR-02 VERIFYING→COMPLETED needs verified', !canTransition('VERIFYING', 'COMPLETED', { kind: 'attempted', dispatchedAt: 1 }))
  check('TR-03 VERIFYING→COMPLETED verified', canTransition('VERIFYING', 'COMPLETED', { kind: 'verified', receipt: {} as any }))
}

// ---------------- agent (inline) ----------------
{
  const def: AgentDefinition = { agentId: 'ag1', tenantId: 't1', ownerPrincipalId: 'p1', visibility: 'personal', displayName: 'Research Scout', voiceAliases: ['scout'], purpose: 'research', lifecycle: 'active', revision: 1, orb: { family: 'metis-solving', tint: 'blue', initial: 'R' }, capabilityProfileId: 'cp-read', skillBindings: [], connectorRefs: [], memoryNamespace: 'ns1', runtimePolicyId: 'rp1', budgetProfileId: 'b1', providerPin: null } as any
  check('AG-01 rename is not an authority change', !authorityChanged(def, { ...def, displayName: 'Scout ✨', voiceAliases: ['scouty'], purpose: 'can now send email' }))
  check('AG-02 capability change is', authorityChanged(def, { ...def, capabilityProfileId: 'cp-act' }))
  const runRec = { runId: 'run_1', agentId: 'ag1', conversationId: 'c1', generation: 2 } as unknown as Run
  check('AG-03 late callback rejected', !acceptRunCallback({ tenantId: 't1' as any, agentId: 'ag1' as any, conversationId: 'c1' as any, runId: 'run_1' as any, generation: 1 }, { tenantId: 't1' as any, run: runRec, cancelled: false }))
  const lease = acquireInputLease(null, { deviceId: 'd1' as any, runId: 'run_1' as any, agentId: null, principalId: 'p1' as any, policyRevision: 'pr' as any, generation: 1, authorized: true, locked: false }, 0, 5000)
  const second = acquireInputLease((lease as any).lease, { deviceId: 'd1' as any, runId: 'run_2' as any, agentId: null, principalId: 'p1' as any, policyRevision: 'pr' as any, generation: 1, authorized: true, locked: false }, 10, 5000)
  check('AG-04 one input writer per device', lease.ok && !second.ok && (second as any).reason === 'DEVICE_BUSY')
  const snap = { sourceKind: 'screenshot', coverage: 'VISIBLE_ONLY', representation: 'visible-pixels', excluded: [] } as unknown as ContextSnapshot
  check('AG-05 screenshot must exclude Métis surfaces', !snapshotWellFormed(snap) && snapshotWellFormed({ ...snap, excluded: ['metis-surfaces'] }))
  check('AG-06 screenshot never FULL coverage', !snapshotWellFormed({ ...snap, excluded: ['metis-surfaces'], coverage: 'FULL' }))
}

console.log(JSON.stringify({ pass, fail: failures.length, failures }, null, 1))
process.exit(failures.length ? 1 : 0)
```

### D.2 tsconfig.json (V1)

Proposed repo path: `(reference only)` · reference file `$SCRATCH/contracts/tsconfig.json` · sha256 `4b70b46b1feadaef05c7d817affe769220ecdec4801c5dd5da5dd34e6104ee34` · 17 lines

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false,
    "noEmit": true,
    "skipLibCheck": true,
    "types": []
  },
  "include": ["*.ts"]
}
```

