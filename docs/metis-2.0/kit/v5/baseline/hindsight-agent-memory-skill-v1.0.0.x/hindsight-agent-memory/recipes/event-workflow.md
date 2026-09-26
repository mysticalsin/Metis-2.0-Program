# Recipe · Event-driven or scheduled workflow


Trigger from an authenticated event or schedule already configured in your workflow
engine. Load the committed canonical source through its trusted ID and current grant.
Do not retain an event's unverified description as business truth. Use an existing
outbox/queue and persist the source revision, stable document ID and request digest.

For supported async retain, generate and persist the operation UUID once per projection
job. Keep the same UUID/payload across retries; verify native idempotency on the installed
version first. For older servers, reconcile unknown responses before retrying. Serialize
updates to a mutable document so late work cannot overwrite a newer revision.

Poll within a bounded deadline or use a validated completion webhook, then inspect the
operation and expected document/fact outcome. A job can be accepted yet extract nothing.
Deduplicate callbacks and revalidate source permissions at replay. A recurring schedule
must not repeatedly ingest unchanged data under new random IDs.

If the source is deleted while work is pending, record a canonical tombstone, prevent
use immediately, and reconcile/cancel/purge in-flight work. Cancellation alone is not a
rollback guarantee. Include operation history and payloads in the retention inventory.

Acceptance: duplicate event, out-of-order revision, crash after submission, lost response,
revocation during queue wait, empty extraction, and duplicate webhook are all handled
without false success or unauthorized resurrection.
