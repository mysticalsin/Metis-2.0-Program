# HMSTEP-07 · Implement correction, tombstone and purge fences

Root ownership: TASK-039, TASK-041, TASK-058.

Prerequisites: HMSTEP-05, HMSTEP-06.

Gates: HM-04, HM-05, HM-08.

## Execute

Persist canonical tombstones before waiting on any in-flight writer. Revoke read leases, implement exact-document cleanup, durable reconciliation and safe generation quarantine. Build dependency tracking for future observations/models; do not wait for richer synthesis to block raw fact reads.

## Evidence before closure

Real source deletion during retain/recall, duplicate/out-of-order writes, purge timeout and restored-backup tests. Rich derived-model cleanup is additionally proven in HMSTEP-10.

**Product NOT_STARTED / NOT_TESTED** in this handoff. Read MASTER §35 and memory/BINDINGS.md. All root task dependencies and release gates remain.
