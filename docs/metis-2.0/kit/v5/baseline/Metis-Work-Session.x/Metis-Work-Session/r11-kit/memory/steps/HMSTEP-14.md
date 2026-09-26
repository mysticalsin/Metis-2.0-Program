# HMSTEP-14 · Migrate with scoped canaries

Root ownership: TASK-026, TASK-035, TASK-041, TASK-061.

Prerequisites: HMSTEP-08, HMSTEP-10, HMSTEP-12, HMSTEP-13.

Gates: HM-05, HM-13, HM-15.

## Execute

Inventory only eligible canonical records, preview counts/audiences, receive actual migration approval, and process resumable bounded batches. Shadow comparison cannot write twice or widen recipients. Switch projection pointer after qualification; preserve canonical revisions and tombstones.

## Evidence before closure

Dry-run manifest, real canary, versioned migration state, safe rollback and optional-model/installer size regression.

**Product NOT_STARTED / NOT_TESTED** in this handoff. Read MASTER §35 and memory/BINDINGS.md. All root task dependencies and release gates remain.
