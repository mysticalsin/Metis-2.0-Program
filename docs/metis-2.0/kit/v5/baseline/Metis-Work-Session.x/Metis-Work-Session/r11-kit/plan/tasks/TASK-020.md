# TASK-020 — Prove the first complete synthetic Cloudflare speech path

Source: MASTER revision 4.5, line 2205. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-013, TASK-014, TASK-015, TASK-016, TASK-017, TASK-018, TASK-019. **Requirements:** M2-STT-02; M2-PRIV-01.

**Do:** Run controlled non-sensitive audio through identified client/relay/hosted model/segment UI and metadata persistence. Inspect the configured logs/cache/storage/export sinks on success, failure and disconnect. Verify request privacy controls on the actual WebSocket path, not only HTTP.

**Verify before closing:** A sanitized evidence receipt proves provider/model, capture/attempt IDs, real returned text and permitted metadata, without retaining that text in production sinks. Any unsupported privacy behavior blocks the route; a mock test is not relabeled live.

**Revision-4.2 source and experience closure:** SRC-07, SRC-08. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.


