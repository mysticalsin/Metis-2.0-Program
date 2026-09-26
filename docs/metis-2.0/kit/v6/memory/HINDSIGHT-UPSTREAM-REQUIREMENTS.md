# Hindsight upstream is mandatory — Métis v6 integration addendum

26 September 2026. This is a stronger implementation requirement and film-evidence gate, not a deployed feature.

## Architecture decision

The approved long-term agent-memory implementation is Vectorize Hindsight from:

`https://github.com/vectorize-io/hindsight.git`

The active upstream, server release/commit, client package version, API/schema identity, image digest (where applicable), deployed capabilities and relevant model configuration must be recorded during actual integration. None is certified by this package. Do not use an unpinned `latest` deployment as production identity.

Reuse the existing Métis memory gateway, canonical source store, identity, outbox, budget ledger and governed skills. Keep the prior v5 wrapper and all original HMSTEP-01–16 obligations. Installing a development-agent memory plugin or adding an SDK import does not wire end-user Métis memory.

## Required implementation seams

1. **Current identity and audience.** Derive tenant, user, project, purpose and stable agent scope from authenticated server context. Scope all accessible facts and derived material before inference, then recheck before response release. Partition by compatible authorization domains. The desktop cannot select arbitrary banks; tags and bank identifiers are not authentication.
2. **Canonical data first.** Notes remain canonical and preserve existing encryption/sync policies. Commit eligible approved summaries, explicit preferences and verified outcome records before asynchronous projection. Metadata-only jobs reload and reauthorize content when executed. Show approval, queue, processing, available and failed states separately.
3. **Real retained memory.** Use the pinned Hindsight client/REST interface through the authorized server path. Map document IDs, revisions, epochs and operation IDs explicitly. Prevent stale replacement and duplicate ingestion; reconcile an ambiguous timeout before replaying a write. Upstream `document_id` replacement semantics are not by themselves a transaction across Métis's canonical store and Hindsight.
4. **Bounded retrieval.** Use recall only when relevant. Enforce eligible scopes, source revision and revocation, full response size/token budget and deadlines. With current docs, an empty tag list can mean no filter even with strict matching; reject an unexpectedly empty protected scope before egress. Do not rely on post-hoc UI filtering to prevent an upstream model seeing unauthorized facts.
5. **Grounded reflection.** Reflect is optional per task, not every hotkey. Resolve memory/mental-model/directive dependencies to current authorized source lineage; inference remains labeled. Do not assume a returned citation proves source truth or current access. Qualify extraction, embedding, reranking and reflection routes separately.
6. **Correction and forgetting.** Canonical corrections lead ordered projection replacement and invalidate stale reads. Tombstone forgotten memory before asynchronous purge; reconcile facts, derived pages/models, caches, exports, backup/restore and late work. Forgetting memory does not delete original meeting notes unless separately requested and authorized. Do not call a 200 response proof of universal erasure.
7. **Fail independently.** Hindsight failure does not independently stop meeting capture, saving buffered notes, keyboard visibility, local cancellation or deterministic actions. Current permitted live meeting context can answer a question without a persistent write. Report unavailable historical memory accurately.
8. **One governed integration.** Named agents, Dust, central skills and JEV use the same source-authorized service. JEV can classify eligible evidence but cannot approve retention, certify facts or obtain execution permission from recalled text. A bank is not a second authority system.
9. **Operations and retention.** Keep secrets server-side; reject unauthorized hosts/redirects and raw content logging. Account for extraction, indexing, reranking, retain, recall, reflect and storage with truthful unknowns. Verify actual content/chunk/derived storage, processing destinations and retention. No-training language and HTTP cache controls do not prove zero retention.
10. **No automatic ingestion shortcut.** The upstream offers convenience wrappers that can retain whole conversations. Do not adopt that default for Métis. Use explicitly governed calls, not auto-capture hooks, indiscriminate coding-history ingestion, raw employee-accessible MCP or an additional desktop database/model service.

## Minimum live proof and film permission

Use synthetic data and two real test identities in an authorized environment. Capture source/build/service identities separately from releasable film assets.

A. Start a consented meeting and verify notes continue through global show/hide.
B. Approve one canonical decision or preference for the appropriate memory scope.
C. Observe an actual retain/projection job and establish retrieval availability without a fake ready callback.
D. Open a new session with no seeded answer in its chat context. Recall via the actual Hindsight route and show a current source link.
E. Correct the canonical value and prove stale memory no longer controls the response.
F. Deny a second unauthorized identity before upstream inference and after any concurrent permission change.
G. Forget the selected memory; prove immediate read denial and eventual cleanup while original meeting notes remain intact.
H. Inject a delayed retain/recall completion, retry, process restart and Hindsight outage. Verify no resurrection, duplicate write or note-taking shutdown.

These are obligations to execute, not passes declared here. Reuse the existing HMSTEP, HSAC and full application gates; the prior 120 interaction scenarios remain unrun unless actual new evidence establishes otherwise. Film QA is not app acceptance.

## Prompt and production boundary

For a complete upgrade request, implement these bindings against today's source and preserve stronger existing code. For a launch-video-only request, inspect the available integration evidence; do not infer permission to deploy or change the application. Missing proof requires omitting the claim or visibly labeling the memory scene as concept.

A new-session memory retrieval on film must be genuine or disclosed as reconstruction. Do not advertise “remembers everything,” “zero retention,” “all data stays on your Mac,” “learns automatically from every meeting,” or “secure for every organization” without the appropriate precise evidence—and do not introduce those behaviors merely to support copy.

## Primary references checked

- Upstream README: https://github.com/vectorize-io/hindsight
- Explicit SDK/API versus automatic wrapper: https://raw.githubusercontent.com/vectorize-io/hindsight/main/README.md
- Retain and document identity: https://hindsight.vectorize.io/developer/api/retain
- Recall and scope behavior: https://hindsight.vectorize.io/developer/api/recall
- Reflect and source dependencies: https://hindsight.vectorize.io/developer/api/reflect
- Document storage/lifecycle: https://hindsight.vectorize.io/developer/api/documents

These pages inform the contract; the actual pinned deployment must be inspected. Some source-storage prose differs between pages, so this handoff does not assert that original content is never stored.
