# 16 · Diagnose failures without guessing

| Symptom | Check first | Likely corrective direction |
|---|---|---|
| Wrong user's memory | Authenticated bank binding; direct path/header access; tags; shared derived sources | Fix the authorization boundary, quarantine affected artifacts |
| Empty recall | Document exists? facts extracted? correct bank/key? strict tags? | Fix ingest/scope before increasing search budget |
| Retain 200 but no useful facts | Memory Defense per-item outcomes; mission; parser; document count | Explain intentional exclusion or repair extraction |
| Old preference after update | Source revision ordering; delayed jobs; cached or derived content | Reject old revisions, serialize writes, invalidate derivatives |
| Duplicate memories | New document ID per retry? append redelivery? missing op UUID? | Stable source IDs, event dedupe and version-gated async idempotency |
| Pending/processing forever | Worker enabled? stable worker ID? provider quota? queue age? | Recover specific worker, resolve capacity/error, reconcile operation |
| UI says model/page is fresh after delete | Deletion not covered by native stale signal | Explicit lifecycle invalidation and rebuild/quarantine |
| 401/403 | Access key, tenant extension, gateway policy | Correct authorized config; never try a global bank |
| 404/410 | Actual server version, path, bank existence, removed endpoint | Use current supported API; do not guess new paths |
| 422 | Real schema, timestamp, unsupported mode/attachment, defense block | Fix request policy/data, not blind retries |
| 429/5xx/timeouts | Provider, queue, pool, rate budget, unknown write state | Bound reads; reconcile writes; avoid duplicate expenditure |
| Works locally, fails under load | Aggregate DB pools, workers, timeouts, model concurrency | Measure capacity; raise only the real bottleneck |
| English works, French fails | Language coverage of embeddings/reranker/extraction | Evaluate multilingual config, preserve identifiers |
| Cost unexpectedly high | Refresh cadence, included chunks/entities, repeated reflect, replay | Reduce unnecessary work; enforce project budgets |

## Trace the lifecycle in order

Authenticate → resolve bank → source committed → projection recorded → operation accepted
→ worker processed → document/facts visible → scope filter matches → current source
resolved → context budget permits inclusion → agent uses evidence correctly. This
sequence prevents blaming the model for a missing source or authorization mismatch.

Use one synthetic source with a distinctive permitted fact. Record operation/document
IDs and inspect privacy-safe status fields. Do not paste a full production conversation
into a public debugging issue. Redact secrets from stack traces and provider errors.
The reference clients intentionally avoid including response bodies in exception text.

## Confirm the kind of failure

A local unit test failure is not a server outage. A static schema mismatch is not proof
that the server accepts the wrong behavior. A time-out is not proof that a mutating
request failed. A successful health check is not an end-to-end memory test. Preserve
these distinctions in incident reports and user-facing status.

## Development changes

When contributing to Hindsight itself rather than integrating it, follow the repository's
current development guide and test commands for the checked-out revision. Do not patch
vendor internals to compensate for a missing application ACL or a wrong SDK call.
Source: [Development](https://hindsight.vectorize.io/developer/development).

Other diagnostic sources: [Operations](https://hindsight.vectorize.io/developer/api/operations),
[Admin CLI](https://hindsight.vectorize.io/developer/admin-cli),
[Monitoring](https://hindsight.vectorize.io/developer/monitoring),
[Memory Defense](https://hindsight.vectorize.io/developer/memory-defense).
