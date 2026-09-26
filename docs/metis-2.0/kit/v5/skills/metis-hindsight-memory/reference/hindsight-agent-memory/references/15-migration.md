# 15 · Migration, backup, rollback and bank administration

## Inventory first

Record current server/SDK/image versions, model providers and embedding dimensions,
database backend/extensions, bank configuration, source mapping, active jobs, scopes,
webhooks, derived models/pages and deletion ledger. Take an approved backup and rehearse
restoration to an isolated target. Do not migrate live data merely to try a new model.

## Supported transfer is not full backup

Hindsight documents document transfer, broader bank transfer, clone and administrator
backup/restore paths with different semantics. Some transfer flows re-embed target data
without re-extracting facts. They are not interchangeable and should not be assumed to
preserve every operational log, vector, callback, file or configuration field.

The generated API documentation marks the older synchronous whole-bank document-export
GET as removed and directs callers to asynchronous export. Read the current transfer
API and inspect returned operations/download artifacts. Do not implement an export by
unbounded paging everything into one process. Protect transfer files as sensitive data.
Sources: [Banks](https://hindsight.vectorize.io/developer/api/memory-banks),
[API reference](https://hindsight.vectorize.io/api-reference).

## Administrator boundary

`hindsight-admin` works directly against the database and is privileged. The documented
admin tooling is PostgreSQL-specific; do not promise the same commands for Oracle.
Snapshot/restore operations can be destructive. Read command help for the installed
version, show the exact target and implications, and require explicit approval before
restore, schema deletion, fleet decommissioning or mass purge. Never default to `--yes`.
Source: [Admin CLI](https://hindsight.vectorize.io/developer/admin-cli).

## Upgrade procedure

Freeze incompatible writers or deploy a versioned projection queue. Rehearse schema
migrations and connection behavior on a production-like snapshot. Run a dry-run index
repair/inspection where documented after restore or a vector-backend change. Measure
retrieval quality before and after; matching counts do not prove equivalent recall.
Inspect callbacks and secret-bearing configuration before cloning or importing banks.

Validate feature flags and removed endpoints with the target server. Switching
embeddings may require re-embedding; retain extraction changes may require reprocessing
selected sources. Neither is a blind environment-variable toggle. Do not reprocess
sources whose current permissions no longer allow ingestion.

## Bank rename and multi-bank migration

Resolve client mapping and key scopes, pause writes, let relevant operations settle,
perform the supported rename/transfer, update references/caches and test old-path denial.
A UI label change is not necessarily a bank ID change. Keep explicit source-to-bank
mapping during staged moves to avoid duplicate learning or inconsistent reads.

## Rollback

A feature flag can restore memory-off behavior without rolling back business data.
When reverting schema or snapshots, do not restore revoked content into active service.
Reapply authoritative tombstones and grants before serving. Keep queues paused until
source revision ordering and projection compatibility are confirmed. Rollback is tested
with a retained synthetic source, an updated source and a deleted source, not just a
successful process startup.

## Migration exit evidence

Record source/target versions, approved scope, backup identifier, performed commands,
operation results, counts, sample source checks, privacy negatives, retrieval quality,
derived refresh status and rollback rehearsal. A connector import success message alone
does not satisfy migration acceptance.
