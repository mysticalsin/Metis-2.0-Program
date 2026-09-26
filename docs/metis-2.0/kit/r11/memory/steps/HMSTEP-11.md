# HMSTEP-11 · Account for every memory workload

Root ownership: TASK-034, TASK-045.

Prerequisites: HMSTEP-05, HMSTEP-06.

Gates: HM-04, HM-11.

## Execute

Integrate each actual provider attempt and background task into the existing ledger, including embedding/reranking and optional TypeSafe/Jev reranking. Do not infer Laya compatibility. Show infrastructure allocation separately and suppress payloads/high-cardinality metrics.

## Evidence before closure

Known zero versus missing, nested billing dedup, cancelled billable work, retries and full-window portal reconciliation.

**Product NOT_STARTED / NOT_TESTED** in this handoff. Read MASTER §35 and memory/BINDINGS.md. All root task dependencies and release gates remain.
