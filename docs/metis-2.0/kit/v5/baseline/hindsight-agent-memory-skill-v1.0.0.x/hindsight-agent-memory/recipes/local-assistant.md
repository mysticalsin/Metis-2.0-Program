# Recipe · Local single-owner assistant


Use one explicitly owned bank, not a multi-tenant service. A local Hindsight process or
approved remote endpoint supplies memory; your existing assistant supplies reasoning.
Keep endpoint/key in a trusted local secret/config store. Local does not mean offline:
extraction, embedding, reranking or reflect may call configured remote providers.

Capture only user-approved durable preferences and reviewed lessons. Use a stable source
ID for a preference snapshot and replace the full approved content when it changes.
Recall only when history is relevant. Make the “memory disabled” switch stop both reads
and automatic capture. Show which memories a user can inspect/correct/forget.

Start with raw-fact recall and one modest envelope budget. Do not create a mental-model
catalog or Kubernetes deployment. Add derived knowledge only for a demonstrated recurring
question. A durable outbox can be a table in your existing local application database.

Acceptance: a synthetic preference survives a new assistant session; changing it updates
the answer; disabling memory stops use/capture; forgetting it excludes it from later
recall and any derived summaries. Protect local backups and exports too.

Implementation references: 01 architecture, 04 retain, 05 recall, 07 lifecycle, 12 deployment.
