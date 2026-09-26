# Where the candidate must join the real application

This is a integration map, not a claim of today's file layout. Preserve one existing authority/control stack. No second desktop server, unrestricted MCP, employee-side vendor key or raw cloud proxy is introduced.

| Candidate | Required production binding | Proof needed |
|---|---|---|
| `jev-contract.ts` | Shared DTO validation and compatible policy metadata. | Native/current server compile; malformed response and mixed-version tests. |
| `jev-transport.ts` | **Server-only** TypeSafe HTTP adapter and version-bound vault lookup. | Customer artifact scan contains no vendor secret/client; egress and redirect tests. |
| `jev-service.ts` | Existing Operator decision route, authenticated principal, entitlements, data review, current policy and exact config snapshot. | Body identity forgery fails; two devices keep independent authorization; revoke/signout during every await. |
| `DecisionJournal` | Existing transaction-capable operation/usage store, cross-replica budget, circuit, request identity, pending-attempt reconciliation. | Races, process crash, duplicate retry, unknown usage and settlement recovery; no in-memory production fake. |
| `jev-admin.ts` | Existing admin route, encrypted vault, atomic CAS, same-transaction authorization check, audit and invalidation outbox. | Failed probe preserves key; commit-ack ambiguity reconciles; actual rotation stops old epochs. |
| `executeWithDecision` | Current prepared action registry, canonical-intent matcher, grant, exact approval, input lease, result verifier and durable consumption link. | Non-first selected proposal actually executed; wrong literal/target/approval rejected; no `void result`. |
| `recommendInteractionOrSkill` | Existing interaction reducer and reviewed skill registry. | Advice cannot mint grants/run skills; deterministic Stop/status preserves task; stale entitlement rejects. |
| `annotateKnowledge` | Current source ACL/revision checks, canonical Intelligence read model and optionally approved annotation write. | Confidence is not truth; correction/deletion/revocation invalidates; no raw context in telemetry. |
| `DecisionBackend` for Laya | A real approved server adapter with pinned artifacts and honestly normalized comparable fields. | Laya-only live bring-up needs no JEV key; missing confidence must abstain rather than invent one. |
| `decisionReadiness` | Real admin health/qualification projection, tenant toggles and device capability metadata. | Saved key is Checking; Ready requires current evidence; toggle changes effective route, not only UI. |

## Trust and transport requirements

The candidate service is intentionally not an unauthenticated HTTP handler. Add it only behind the existing authenticated Operator middleware. Derive the caller and validate the request's declared binding against that trusted principal. Approved-content status is established by a real content/retention policy check, not by a renderer sending a string. `assertCurrent` must check current source ACL, principal entitlement, capture/task generation, policy and credential epoch.

The desktop client must verify the authenticated server response, model/profile identity, all typed answers, binding and schema before exposing a `DecisionResult`. The consumer's typed `DecisionClient` interface assumes that validation; do not cast arbitrary JSON to it. Use the real existing signed/session-bound channel, not trust in a hash sent by the model. Operation/candidate digests bind data, they do not authenticate actors.

Server-only TypeSafe code must live in a build entry point excluded from desktop/renderer distribution. A runtime `window` check is only a diagnostic; Electron main also lacks `window`. It is not a distribution/security boundary. Add import-graph and packaged-secret checks to prove no desktop route calls the TypeSafe endpoint or returns the bearer key. Existing server code must select a version-pinned secret snapshot matching policy, rather than racing a current global key accessor.

The ledger receipt and action grant are not the same thing. Record the decision and actual consumption with distinct IDs; then let existing host checks authorize execution. `status: executed` in the candidate means the operation coordinator was invoked. Its nested **receipt outcome** still decides verified/unknown/failed/cancelled user presentation.

## Pending dependencies are not completed adapters

The new source includes real orchestration and HTTP/schema logic, not production database, app IPC, OAuth/Entra enrollment, Laya hosting or native action implementations. Tests use explicit synthetic authentication, qualification and store fakes. Never import `tests/jev-fixtures.mjs` or test profiles into customer code. Real HTTP loopback tests return a synthetic model decision; they do not establish JEV accuracy.

## Configuration lifecycle

A production key change needs an immutable configuration revision with credential version, allowed model pin, data-review evidence, language/task/cardinality qualification, caps and fallback policy. In-flight requests retain their captured revision and fail final freshness checks after it changes. Do not migrate old device metadata as a blanket grant. Use a canary cohort and reversible policy rollout only after qualification; rollback invalidates old pending work and cannot resurrect revoked approvals.

Read-only readiness can be polled or delivered over the existing heartbeat. Do not send secret material, raw requests or decision histories to every device. Staff-facing behavior stays inside Métis; the probe example is an administrator/developer qualification tool, not an employee requirement.
