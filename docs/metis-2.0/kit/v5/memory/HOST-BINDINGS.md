# Bind to existing Métis services — no second memory implementation

All names below are **historical r11 candidate interfaces**, not assertions about current
HEAD. The full original obligations are preserved in `evidence/original-BINDINGS.md`.
The integration owner first locates their current equivalents and active callers.

## A. Authenticated principal and retrieval domain

`authorize({principal, scopeId, action, outputAudience, operationId})` and
`assertFresh(lease)` must use real transport identity and current policy. Resolve a
server-owned bank/epoch, never accept model/user bank IDs as proof. Authenticate human
and service principals independently. Scope restrictions apply before every inference,
not only when rendering a reply. Filter policy cannot replace bank/API authorization.

## B. Canonical storage and durable reconciliation

`readCanonical`, `withScopeLease`, `recordProjection`, `resolveEvidence`, `blockSource`,
`recordPurge`, `markReconciliation` remain the required authoritative seams. Actual
cross-replica fencing and atomic checks cannot be replaced by an in-process map.
Remote OneDrive/SharePoint commits need real ETag/delta reconciliation, not a fictional
distributed transaction. Outbox content is opaque identity/revision metadata; approved
content is read at execution. Serialize same-document updates. After a timeout, inspect
actual source and operation state before retrying. Retain acceptance can produce zero
facts; never infer searchable memory from an accepted request alone.

## C. One transport and explicit contracts

The r11 `HindsightClient` returns normalized typed results, takes caller cancellation and
feeds `MetisMemoryGateway`. The generic `MemoryClient` returns raw JSON and has different
IDs/constructor/options. It cannot be passed to `clientFor(grant)` unchanged. Keep the
existing server gateway; port useful transport/evidence tests or write an explicit
versioned adapter. Preserve caller cancellation, actual timeout/egress controls and
current grant checks before and after I/O. No raw client object in renderer/Dust tools.

The generic Python evidence helper is a policy example with fixture AuthContext, not
Entra middleware. Port its whole-envelope accounting and trusted-source resolution
concepts; never construct canonical evidence from recalled metadata alone. Revocation
must recheck after asynchronous resolution and before result publication.

## D. Product triggers, separate from capture controls

- Canonical approved preference/summary/verified-receipt commit: eligible projection via
  existing outbox; no write on start/stop/hide/key repeat or streaming ASR fragment.
- Relevant question: read current scope, optional recall, source validation, minimum
  evidence to the existing generative route, final audience check.
- Exact correction/forget: canonical lifecycle, tombstone/revision, invalidate reads,
  reconcile upstream/derived storage, update source-linked UI.
- JEV decision: no retention trigger. Verified completed action: optional approved
  canonical receipt only. A decision result is neither a receipt nor memory consent.
- Memory disabled/unavailable: reject memory use without disturbing notes or toggles.
- Signout/membership/consent/policy change: invalidate old memory authority and output,
  drain/reconcile accepted jobs, preserve authorized canonical notes separately.

## E. Application API and Dust

Reuse narrow authenticated source-ID/purpose operations for remember/recall/why-used/
correct/forget/status. These are responsibilities, not newly invented route strings.
Discover existing service and connector schemas before coding. Dust/skills use the same
API; their principals and shared-output audiences get current checks. Do not export the
whole bank to a prompt or let a memory URL trigger a network request.

## F. Ledger, deployment and release

Use the current attempt/usage ledger and existing private approved service. Separate
retention/extraction/reranking/reflect/background work and infrastructure costs; preserve
unknown counts and avoid parent/child double counting. No command/source text in telemetry.
Actual version/OpenAPI/config/model/region and customer-data approval precede activation.
Model availability is not data authorization. A generic Compose/SDK package is not
proof of a production runtime or a reason to ship PostgreSQL in the desktop.
