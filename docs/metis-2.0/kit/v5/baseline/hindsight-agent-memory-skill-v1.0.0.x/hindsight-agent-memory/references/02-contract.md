# 02 · Application contract and implementation sequence

## Discover before editing

Locate request authentication, the agent invocation, canonical persistence, retry
mechanisms, token accounting and runtime configuration. Identify whether a current
memory provider already exists. Reuse the interface or add one small adapter; do not
replace the agent framework to introduce memory. Trace an actual user request through
commit and response. Identify which code runs in a browser/renderer versus the backend.

Fill `templates/memory-contract.json` with real project choices. Values in that file
are **application policy**, not Hindsight configuration fields. Resolve identity and
source permissions in existing code instead of asking the user to repeat available
information. Unavailable credentials or prohibited uploads are real blockers; optional
embeddings optimizations are not.

## Logical adapter interface

Implement operations conceptually equivalent to:

- `recallContext(authContext, purpose, query, budget)` → bounded, authorized evidence.
- `recordCommittedSource(authContext, sourceRef, revision)` → durable projection receipt.
- `reflectAuthorized(authContext, question, evidenceScope, budget)` → sourced advice.
- `forgetSource(authContext, sourceRef)` → revocation/tombstone plus purge progress.

These names are application interfaces, not native Hindsight SDK calls. Bind identity,
bank, credentials and mandatory scope outside model tool arguments. The model may ask
what to search for; it must not supply which person's bank to read or which provider
secret to use. Keep bank administration and deletion tools separate from ordinary chat.

## Request flow

Authenticate → authorize task/purpose → resolve bank and approved sources → memory
policy check → recall relevant hints → resolve current canonical evidence → build a
bounded data envelope → agent reasoning → normal tool approval → authoritative action
and commit → record permitted facts/lessons → acknowledge verified outcome.

Authorization must occur before provider exposure, not just before rendering a response.
If a shared bank mixes audiences, source checks after reflect are too late: the remote
reflect model may already have seen unauthorized facts. Use homogeneous banks, a
verified scoped deployment, or application synthesis over preauthorized evidence.

## Recording transaction boundary

Do not retain success before the business transaction commits. In applications with
an outbox, write a source-change event in the same transaction, then process it through
an idempotent projection worker. In a single-user utility, a synchronous approved
snapshot plus a local retry queue can be enough. Reuse infrastructure already present.

Keep a projection record containing source ID, canonical revision, content digest,
purpose, bank binding, target document ID, status, operation UUID if available, and
last verification time. This can live in the application database; a second “memory
control plane” is unnecessary for a small project. Do not store raw secrets in it.

Concurrency requires per-document ordering. A stable document ID avoids duplicate
logical documents but does not stop an older delayed request from replacing a newer
revision. Serialize updates, reject superseded jobs, and reconcile completion against
the current authoritative revision. A timeout does not prove the server rejected work.

## Memory feature modes

Support disabled, read-only and read/write modes. Reflect should be separately
controllable because its privacy/cost profile differs. Explain memory-off behavior to
the user only when it affects the answer. Never turn an access-denied condition into
an empty successful search that hides a configuration/security incident.

## Incremental delivery

First ship one retained synthetic fact, correctly recalled after a new session. Then
add source versioning and isolation negatives. Then deletion, failure handling and
budgeting. Enable derived knowledge only when repeated synthesis justifies it. Deploy
behind a cohort feature flag, measure benefit and regressions, then expand. Complete
`templates/implementation-handoff.md` with actual evidence, not planned assertions.

Native operation and document semantics:
[Retain](https://hindsight.vectorize.io/developer/api/retain),
[Documents](https://hindsight.vectorize.io/developer/api/documents),
[Operations](https://hindsight.vectorize.io/developer/api/operations).
