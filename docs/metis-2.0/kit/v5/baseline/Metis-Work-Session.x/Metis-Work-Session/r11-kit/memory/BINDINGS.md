# Required production bindings: no fake authentication, no in-memory “durability”

The modules in `src/` execute real request construction, bounded transport, policy checks and coordination. Their test seams are not substitutes for the application's actual identity, canonical repository, transaction or metering services. **Do not ship test fixtures.** Map these interfaces to existing Métis services rather than deploy a second competing platform.

## 1. Authority

`authorize({principal, scopeId, action, outputAudience, operationId})` receives a server-authenticated principal (never an email, tenant or bank supplied as proof in request JSON). Return an immutable grant containing `scopeId`, `bankId`, nonempty security `tags`, `epoch`, `state: READY`, `homogeneousAcl: true`, and an opaque server-owned `lease`. It must establish personal/team/agent entitlement, output audience, retention approval, provider readiness and bank-generation safety before ANY upstream retrieval/inference.

`assertFresh(lease)` rejects invalid, expired, revoked or replaced grants. A successful re-login must not silently refresh the old request's authority. Protect all introspection/list/chunk/entity/mental-model endpoints too. The builtin Hindsight API key is only service authentication, not these checks.

## 2. Canonical repository

- `withScopeLease(grant, callback)` must actually fence bank generation and concurrent modifications across replicas; a JavaScript mutex is insufficient. Queue bounded writes per scope and reject reads during quarantine. A long inference must not postpone a source revocation: revocation invalidates outstanding leases, withholds results and blocks new reads immediately. Purge continuation uses already authorized, exact-source cleanup authority even after the user read lease is invalidated.
- `readCanonical(grant, sourceId)` retrieves a current permitted record: `id`, `documentId`, `scopeId`, string `revision`, `aclEpoch`, canonical `eventTime` with timezone, finite policy `expiresAt`, `kind`, `content`, `approved`, `allowMemory`, and deleted/confidential/local-only flags. Do not trust these values from a client payload. Eligible kinds in this first adapter are approved summary, approved preference and verified action receipt. Timestamp means source event/approval time, not arbitrary ingest time.
- `recordProjection(grant, source, receipt)` atomically rechecks the live revision, epoch and tombstone, stores source→document→memory lineage, and distinguishes accepted/indexing/searchable. Upstream retain acknowledgment does not prove recall can already find it. Enumerate/paginate metadata-only memory IDs under trusted service access to bind lineage; do not assume recall embeds document identity in every result.
- `resolveEvidence(grant, memoryId, audience)` resolves complete provenance to current canonical source(s), rejects hidden/stale/deleted/expired material and returns authorized locators only. An observation with several sources requires **all** dependencies, not the first convenient citation. The initial adapter is deliberately facts-only until this derivative lifecycle is implemented and tested.
- `blockSource(grant, sourceId, operationId)` commits a tombstone and revokes affected read leases before returning the exact owned document ID. It must not delete canonical evidence indiscriminately: a request to forget one preference is not a request to erase every meeting. Use the existing rights workflow for wider deletion. Return a replay-safe receipt.
- `recordPurge(...)` records the verified upstream document deletion and schedules/checks dependent observations, mental models, pages, histories, asynchronous jobs, exports, vector copies, backups and external replicas. This is not “fully erased.” Do not rely on Hindsight `is_stale` after deletion.
- `markReconciliation(...)` is durable and metadata-only; quarantine affected context until an ambiguous retain/delete is reconciled. Prevent delayed batch completion or an older backup from resurrecting forbidden sources.

Keep an outbox beside the canonical transaction when supported. If the selected source is OneDrive/SharePoint or another remote record store, use its actual ETag/delta/checkpoint semantics plus a durable reconciliation registry; do not claim a distributed transaction. An outbox carries opaque IDs/revisions, not copied private content in Cloudflare D1, Queues or Workflow checkpoints.

## 3. Client factory and ledger

`clientFor(grant)` uses an operator-reviewed fixed HTTPS destination, server secret and the resolved bank/tags. Do not accept a free-form proxy URL, bank ID, header set, request body, strategy or directive from a user/agent. Egress and DNS restrictions are infrastructure requirements. A 401/403 service credential failure is not solved by asking the user to paste a vendor token.

`meter(event)` durably records minimal attempt metadata in the **existing ledger**; it must allocate/reconcile real attempt IDs, including paid failed requests and background stages. The supplied module reports coarse completion/error and available usage, but does not know every hidden subcall. Instrument or reconcile the actual embedding/reranking/consolidation/reflect path without enabling prompt traces. Retain/reflect aggregate usage and child provider usage must not be summed twice. A ledger outage uses approved metadata-only recovery, never silently zero spend.

## 4. Production server routes to add to existing API

Expose narrow operations: source-ID-based remember, scoped recall, evidence-based reflect, inspect/why-used, canonical correct, exact forget, and status. Translate them to the internal service; do not expose raw Hindsight routes/CP. Add real request/response schemas, CSRF for cookie-authenticated routes, CORS allowlists, size/rate limits, cancellation, protected logging and tenant/audience authorization. Dust uses those same governed methods over the qualified MCP gateway. Never turn an MCP argument into a bank credential.

A direct real-Hindsight smoke proves the transport only. Required full closure: actual Métis identity → canonical approval → retain → later-context recall → visible source → correction → Dust/skill readback → forget and late-read denial → metadata reconciliation, on Windows and native Mac.
