# HMSTEP-05 · Implement canonical-to-memory projection

Root ownership: TASK-035, TASK-036.

Prerequisites: HMSTEP-04.

Gates: HM-02, HM-05, HM-15.

## Execute

Wire the supplied transport into the real canonical service. Use metadata-only outbox references, read approved source at execution, carry event time and revision, stable document IDs, replace only, and bounded batches. Record accepted versus searchable state separately.

## Evidence before closure

Concurrent updates, duplicate delivery, negative acknowledgement, crash-after-write, and read-your-write tests on the actual DB/service.

**Product NOT_STARTED / NOT_TESTED** in this handoff. Read MASTER §35 and memory/BINDINGS.md. All root task dependencies and release gates remain.
