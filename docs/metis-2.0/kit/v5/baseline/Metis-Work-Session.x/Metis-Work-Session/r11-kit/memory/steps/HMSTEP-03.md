# HMSTEP-03 · Deploy the private service and database

Root ownership: TASK-015, TASK-062.

Prerequisites: HMSTEP-02.

Gates: HM-01, HM-04, HM-14.

## Execute

Use the existing approved container platform and managed PostgreSQL/pgvector. Pin images, mount secrets through the secret store, disable public API/DB/CP/MCP and body traces. Separate liveness from readiness, test migrations, connections, restore and restricted egress.

## Evidence before closure

Identified service version/digest, private networking evidence, auth rejection, database health and restore rehearsal.

**Product NOT_STARTED / NOT_TESTED** in this handoff. Read MASTER §35 and memory/BINDINGS.md. All root task dependencies and release gates remain.
