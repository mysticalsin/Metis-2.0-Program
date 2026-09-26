# JEV in Métis 2.0: complete integration contract and executable candidate

25 September 2026 · v3 upgrade addendum · current repository and deployed services unverified

## Product decision

JEV is a first-class managed **decision provider** in Métis. It must actually influence qualified action/target selection and authorized Intelligence assessments, not merely appear in a provider selector or produce a discarded result. The existing generative assistant, speech pipeline, policy gate, native adapters, verifier and canonical knowledge remain separate responsibilities.

The finished product remains a note-taker and meeting copilot with keyboard-first assistance: authorized meeting notes → toggle Métis → ask/guide/act → verified result → return without losing notes. Mouse/mic clicks remain alternatives. `../keyboard-notes/PRODUCT-CORRECTION.md` governs the distinct visibility and command-voice controls. No personal JEV key, developer terminal, new memory login or model-selection ceremony. Central administration configures one server-vault credential for entitled devices, with separate desktop-assistance and Intelligence-assessment controls. These are required production behaviors; the delivered code is a tested integration candidate, not an installed feature.

## 1. The concrete request path

```text
Trusted stable command + permitted current context
    ├─ exact qualified deterministic match → existing host policy/adapter/verifier
    └─ genuine bounded ambiguity
         → complete prepared action+target+arguments candidates
         → authenticated existing Operator decision endpoint
         → tenant/device entitlement + data review + model/profile qualification
         → atomic budget/dedupe reservation and current credential snapshot
         → pinned JEV request {state, questions, model}
         → structural validation, uncertainty and fresh identity/policy checks
         → actual selected original proposal, not a new model-authored command
         → durable decision-consumption link
         → existing canonical-intent matcher and exact approval when required
         → fresh target + native lease + single dispatch + independent readback
         → existing truthful result card and speech
```

The deterministic path does not call JEV merely to demonstrate integration. Local Stop, human takeover, speech-only interruption, explicit status and revocation do not wait for an external classification. No JEV result can authorize input, change a task grant, fabricate a native receipt, mark all steps done, or reinterpret a denied connector route as permission to use a browser.

A user requesting “the project note” may require a bounded choice among already permitted documents. Each candidate is a **complete compatible tuple**, carrying prepared target and literal arguments. Do not choose an application in one question and a document in another and combine incompatible answers. When the candidate list is incomplete, confidence is not a reason to invent another target: return clarification.

`executeWithDecision` now consumes the selected candidate and invokes the previous behavior core's actual `executeVerifiedOperation`. The independent literal-intent matcher remains in that path. A high-confidence wrong title therefore still fails before dispatch. This closes the standalone candidate's no-op decision gap, but the actual Métis call site must still be wired and proved.

## 2. Four integrated uses and their limits

| Use | Executable candidate | Required actual-app consumer |
|---|---|---|
| Action and target selection | `executeWithDecision` selects the returned original proposal and enters existing authority/coordinator verification. | Current main command runtime/register and approved adapter catalog. |
| Interaction intent | `recommendInteractionOrSkill` consumes Talk/Guide/Do/Dictate/status/speech-only/clarify classification. | Existing session reducer treats this as a hint; trusted request and mode transitions govern authority. |
| Reviewed skill choice | The same recommendation consumer returns an eligible skill ID, after entitlement rechecks. | Existing skills registry revalidates ID/version/capability and normal approval before execution. |
| Mantu Intelligence triage | `annotateKnowledge` consumes Score, Noul and Choice with current source checks. | Canonical Intelligence presents source-linked candidate evidence, conflict review or uncertainty. It does not rewrite facts. |

Default unresolved follow-ups ask a useful question. “How is it going?” must not restart the action. “Stop talking” must not cancel a task. Selecting Do is not a grant; recommending a skill neither downloads it nor runs it. Creating or renaming an agent does not affect JEV privileges.

In Intelligence, use JEV for bounded semantic questions such as relevance, visible contradiction or review disposition. Source/date arithmetic, deadline aging, identity, authorization and deterministic numeric gates remain code responsibilities. An assessment should carry provider/model, template, source IDs/revisions, retrieval time, uncertainty and an explicit inferred label. A negative contradiction answer only describes the supplied coverage; it is not proof that no contradiction exists anywhere. [JEV-REF-06]

Do not persist source excerpts or commands in the operational decision ledger. Approved assessment persistence and any Hindsight retain operation require canonical revision/ACL and retention controls. Forget/revocation invalidates reads and queued work; a JEV result is never permission to retain memory or promote a claim to fact.

## 3. Actual vendor contract, not an invented `/decide` API

The vendor call is `POST https://api.typesafe.ai/v1/systemone` with bearer authorization. Métis may expose its existing internal `/v1/decide` route; those are different interfaces. Vendor input is text/structured text, not microphone bytes, images or a computer-control script. Text/vision/STT/TTS stay on their separately approved routes. [JEV-REF-01, JEV-REF-02]

The candidate supports all three documented primitives:

- **Choice:** selected option, complete option distribution, reported confidence.
- **Score:** ordered levels, distribution/legend, expected rubric score and confidence.
- **Noul:** probability of yes; no fabricated `confidence` property.

Questions in a batch are independent. Use one batch for independent Intelligence observations, then combine them deterministically. Sequential decisions need a new validated state. The candidate currently requires text-only Score rubric labels so the returned legend can be compared exactly; structured Score-label rendering needs separate live contract qualification. Structured instructions and Choice descriptions remain supported. Response validation checks model, all expected questions/types/options, probability bounds and sums, selected option, score legend and expected-value consistency. Unknown fields do not become authority. [JEV-REF-01, JEV-REF-05]

The public model reference retrieved on 25 September 2026 names `jev-1.13.0`. It is the **documented candidate pin**, not proof your account can serve it or that it is qualified for Métis. A moving alias cannot silently inherit version-specific thresholds. An absent pin in a model-list response is not automatically a denial, since the vendor documents aliases in that list while accepting versioned IDs. The real bounded synthetic probe establishes account/model reachability. [JEV-REF-02]

Métis intentionally limits a request more tightly than the vendor's maximum: 64 KiB wire input, 256 KiB response, up to 16 questions, 64 Choice options at the generic boundary and up to 31 prepared action/skill candidates plus abstention in the supplied templates. Byte budgets are **not token estimates**. Production must also enforce the vendor's actual token limits using an approved compatible counter or conservative qualification and handle rejection without truncating negation or literal values.

## 4. Confidence and qualification

Choice probability, reported confidence, top-two margin, rubric score and observed task correctness are distinct fields. Noul has no reported confidence. Do not label a 0.9 value “90% safe.” The candidate requires an unexpired qualification profile bound to provider/model, template version, language, purpose and candidate cardinality. [JEV-REF-03]

No production thresholds are supplied as magic defaults. Test profiles are explicitly synthetic. The template configuration starts disabled and unqualified. Qualify English, Québec French, Spanish and Brazilian Portuguese with representative held-out data, false-selection/abstention rates, critical literal/negation errors, calibration, candidate-size effects and latency/cost. Vendor English preference makes multilingual validation especially important. [JEV-REF-02]

Low confidence or `needs_clarification` does not silently call another provider. A provider switch has privacy, latency and cost consequences. Explain the ambiguity or preserve an eligible deterministic alternative. Stop and corrections invalidate in-flight decisions regardless of their confidence.

## 5. One centrally managed credential, with truthful readiness

All TypeSafe secrets stay in the existing Operator encrypted vault or authorized server secret binding. The desktop receives only entitlement/capability/configuration metadata. Actual actor/tenant/device identity derives from authenticated transport; do not trust identity fields in a request body or the candidate's TypeScript types.

The supplied admin orchestration enforces:

1. Authenticate and authorize an actual administrator for this tenant/configuration.
2. Reserve a bounded synthetic-probe operation in the real budget/usage store.
3. Test the proposed credential and exact model using non-customer content; validate the wire response and account for the attempt even when it fails.
4. Recheck authorization, then perform encrypted-vault replacement using expected-version compare-and-swap. Recheck current privilege/configuration inside the transaction, write audit/revocation outbox and invalidate old configuration epochs.
5. Return masked metadata and **Checking**, not Ready. Live data handling, task/language qualification, health and real two-device consumption remain separate.

Probe or precommit failures leave the existing key untouched by that operation. A conflict is not automatically retried. If the vault may have committed but acknowledgment is lost, return **pending reconciliation**, not “rolled back”; read the operation record before another replacement. The delivered vault/journal interfaces are mandatory bindings, not a fake durable implementation.

Rotation/revocation must invalidate both in-flight and cached decisions and all stale device settings. Two independently authenticated installations must demonstrate the same central credential revision without receiving the raw key. Backward-compatible metadata cannot make an old binary support new APIs; expose client capability/version requirements honestly.

## 6. Privacy, route eligibility and operational resilience

“Not used to train” is not “zero retention.” TypeSafe offers enterprise ZDR; the actual organizational agreement/configuration must be qualified before real customer content is permitted. An HTTP no-store flag cannot enforce a vendor's backend retention. Keep the existing no-unapproved-content-storage requirement. [JEV-REF-04]

The request uses a fixed reviewed vendor origin, rejects redirects, omits cookies and avoids raw-body logging. Its deadline covers vault access, response headers and the entire bounded UTF-8 JSON body. No automatic SDK retries are inherited. Credentials, customer text and upstream error bodies do not appear in stable error results.

`ManagedDecisionService` rechecks current authority before reservation, again before egress, after response and before return. Atomic budget/deduplication/circuit behavior is provided by the mandatory real journal. A bounded settlement drain accounts for incurred attempts even after cancellation. If settlement cannot be established, no usable decision is returned; the reservation remains pending for reconciliation. Known zero remains zero; absent/invalid quantities remain unknown.

Configured mode is `disabled`, `jev`, `laya`, or explicitly reviewed `auto`. Laya-only never calls JEV, even during failure. Auto can use a separately qualified/approved alternative only on listed transient errors, within the overall deadline and budget, recording each attempt independently. Credential/schema/policy failures and uncertainty do not trigger another provider. Laya's actual transport, checkpoint, tokenizer and infrastructure remain separately required; the common backend interface and synthetic tests are **not a served Laya model**.

The candidate reserves part of the overall deadline for an approved fallback; the production circuit must honor retry guidance and constrain traffic across replicas. A provider retry never repeats a native side effect. Disable/shadow/canary controls belong to actual effective tenant policy. Shadow is off by default and cannot feed action authority.

## 7. Visible behavior and administration

For staff, preserve Listening, Understanding, Working, Needs you, and factual completion. Do not announce “JEV has 97% confidence” as an assurance or add repetitive confirmations. A model outage becomes an honest decision-unavailable or clarification state; basic deterministic commands, manual controls and qualified text paths remain available.

For administrators, provide actual status, masked credential metadata, configuration/model/profile revisions, separate desktop/Intelligence toggles, expiry, redacted errors, per-attempt usage and metadata-only applied/rejected decision counters. A JEV response alone does not increment “successful actions.” A source annotation does not increment “verified facts.” Probe, decision, action and completion telemetry are different events.

The visible pointer still reflects Guide, foreground control or background work truthfully. JEV does not draw a fake mouse or directly click. Speech completion is generated only after the existing verifier's receipt. Status questions and speech changes preserve the task.

## 8. Integration order and evidence

Read `BACKLOG.json`, `JEV-ROLE-AND-BINDINGS.md`, `QUALIFICATION.md`, and the updated full implementation prompt. Reconcile existing JEV files and deployed routes first. Historical names include `metis-decide-client.ts`, `metis-command-runtime.ts`, `metis-command-register.ts`, `command-control.ts`, `operator/` and Intelligence; locate today's equivalents and stronger code instead of layering another permission system.

First demonstrate a synthetic decision selecting a non-first candidate, then independent literal checks, actual effect/readback and truthful completion. Next qualify the real server route and actual two-device use with synthetic data. Only after privacy review and task/language qualification may approved organizational content use the route. Finally run the actual microphone-to-action-to-portal/voice and Intelligence/source/correction flows on exact Mac/Windows artifacts.

Twenty-four new JVAC acceptance cases supplement the previous sixty interaction cases. All eighty-four **application/native/live** cases remain NOT_RUN. The standalone passing suite is a useful implementation contribution, not a release certificate. The complete 66-root r11 plan and its expansions remain intact.


## 9. Recording independence and keyboard coexistence (v4 owner correction)

The actual JEV modules and full v3 integration obligations remain unchanged. Preserve note-taking and keyboard operations even when JEV is disabled, unavailable or unqualified. A decision cannot stop a meeting, grant microphone capture, convert a participant's sentence/action item into authorization, or write generated speech into its transcript. Notes/summaries remain source-backed and separately governed; optional Intelligence inferences remain visibly inferred. NKAC-09 through NKAC-11 and the combined meeting milestone prove these boundaries in the real app.
