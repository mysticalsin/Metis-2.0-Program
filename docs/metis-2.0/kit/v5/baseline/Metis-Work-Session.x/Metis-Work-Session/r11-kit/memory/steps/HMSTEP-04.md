# HMSTEP-04 · Bind real identity and bank generation

Root ownership: TASK-006, TASK-035, TASK-037.

Prerequisites: HMSTEP-02, HMSTEP-03.

Gates: HM-03, HM-05, HM-09.

## Execute

Implement Entra/authorized service principal binding and server-owned bank registry. Partition by tenant, effective security domain and ACL epoch, not guessed email or model tags. Add cross-replica fences and read-lease revocation. Inventory every upstream read/admin endpoint.

## Evidence before closure

Two users/two teams/agent cases demonstrate pre-model exclusion and immediate epoch invalidation.

**Product NOT_STARTED / NOT_TESTED** in this handoff. Read MASTER §35 and memory/BINDINGS.md. All root task dependencies and release gates remain.
