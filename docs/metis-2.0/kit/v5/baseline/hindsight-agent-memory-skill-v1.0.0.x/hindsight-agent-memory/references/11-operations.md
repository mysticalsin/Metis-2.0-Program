# 11 · Async operations, workflows, webhooks and recovery

## Model completion explicitly

An async retain acknowledgement returns an operation ID; processing continues in the
worker. Track pending, processing, completed, failed and cancelled states as documented.
A completed job still needs task-specific verification: expected document exists,
relevant facts were extracted, and derived knowledge is sufficiently fresh. A blocked
item or zero-fact retain can be unsuitable even with transport-level success.
Source: [Operations](https://hindsight.vectorize.io/developer/api/operations).

## Outbox state machine

Recommended application states are PREPARED → SUBMITTED/UNKNOWN → PROCESSING →
VERIFIED, with REJECTED/FAILED/REVOKED alternatives. These are application states, not
native Hindsight enum values. Persist source revision, request digest and operation ID
before submission. Recheck source permission and current revision before each replay.

A timeout, lost connection or invalid write response produces UNKNOWN. Do not send a
new operation automatically. If verified native async operation-id deduplication is
available, reconcile or retry the same UUID and identical payload under the same bank.
Otherwise inspect operations/document state and let a bounded recovery workflow resolve
ambiguity. Never interpret “nothing returned” as “no work happened.”

Ordered replacement avoids stale writes; append requires event deduplication. Partition
work by authorized document/cohort. Use existing durable queues and dead-letter handling.
No exactly-once end-to-end claim is justified by a stable document ID alone.
Source: [Retain](https://hindsight.vectorize.io/developer/api/retain).

## Cancellation and retry

Cancellation is cooperative and can stop at checkpoints. Work already committed may
remain, and some operations can finish before cancellation takes effect. Cancel is not
rollback, deletion or a guarantee that provider spend stops. Reconcile the final state
and explicitly purge/rebuild when required. Retry supported failed/cancelled operations
only after diagnosing the cause and checking that source permissions remain valid.

## Polling

Use bounded exponential backoff with jitter, an overall wall-clock budget and limited
concurrency. Do not poll once per token or indefinitely. Persist receipts so a restarted
worker can resume checking. Avoid retrieving operation payloads in routine logging;
they can contain the exact sensitive source data. Set operation history retention
consistent with the organization's policy and backend support.

## Webhooks

Webhooks are a completion notification path, not permission to execute instructions
inside memory. Inspect the actual deployment's event schema, registration API and
available authentication/signature options. This package does not assume a native
signature mechanism that has not been verified. When needed, put an authenticated
controlled receiver in front, deduplicate events and re-read operation state with your
own authorized service credential before updating business state.

Validate callback destinations on creation/change/import, reject arbitrary internal
network targets, keep secrets out of callback URLs, and bound retries. A webhook may
arrive twice, out of order or after a revocation. Do not treat event delivery as an
exactly-once transaction. Source: [Webhooks](https://hindsight.vectorize.io/developer/api/webhooks).

## Worker recovery

Use a stable `HINDSIGHT_API_WORKER_ID` per replica across restarts. A changing identity
can leave processing tasks associated with an old worker. Investigate worker status
and decommission the specific obsolete worker rather than disrupting a healthy fleet.
Pausing new consolidation scheduling does not necessarily stop work already queued.
Source: [Services](https://hindsight.vectorize.io/developer/services),
[Admin CLI](https://hindsight.vectorize.io/developer/admin-cli).

## Runbook example

When a workflow says “memory saved” but recall misses it: inspect the outbox receipt;
check operation state; verify the document and count; inspect defense rejection or
mission filtering; then test authorized raw-fact recall. Only after facts exist should
you investigate consolidation/derived lag. Record the root cause and corrective action
without pasting private source payloads into incident tickets.
