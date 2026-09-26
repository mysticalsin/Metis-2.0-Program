# 14 · Monitoring, quality and operational evidence

## Separate platform health from memory usefulness

Monitor API availability, worker backlog, database/pool health and provider failures.
Also measure whether the memory actually improves tasks. An always-green HTTP monitor
can coexist with zero extracted facts, wrong-user retrieval or obsolete summaries.
Source: [Monitoring](https://hindsight.vectorize.io/developer/monitoring).

Recommended application metrics (not a promise of native metric names):
- Projection acceptance, completion and verification counts; oldest unverified source.
- Pending/processing age; orphaned worker operations; retry and UNKNOWN rates.
- Documents with zero useful facts; per-item defense rejection and parsing failures.
- Recall latency, useful-source hit rate, irrelevant-context rate and envelope bytes/tokens.
- Reflect requests, provider token cost and end-to-end deadline overruns.
- Source-revision mismatch, tombstone rejection and cross-principal denial counts.
- Deletion lag, derived-artifact invalidation lag and restore anti-resurrection results.

Use native Prometheus/OpenTelemetry capabilities documented for your deployment and
add application metrics only where needed. Inspect actual metric names before writing
alerts; this skill does not invent a drop-in Grafana dashboard for every release.

## Logging policy

Log request/operation IDs, pseudonymous scope IDs, status, duration, size and error
class. Do not log API keys, source bodies, prompts, operation payloads, raw transcripts
or full reflect traces by default. Trace data can be a second memory store with its own
retention requirements. Access to metrics and admin endpoints should be restricted.

## Readiness and liveness

Use `/health/ready` or the documented `/health` readiness alias to gate traffic on
database connectivity; use `/health/live` for process liveness where supported. Inspect
`/version` separately for feature and schema compatibility. A healthy process does not
prove its model/provider has enough quota or that memories can be extracted correctly.
Source: [API reference](https://hindsight.vectorize.io/api-reference).

## SLOs and alerts

Choose explicit project SLOs for memory recall latency, projection lag and delete/revoke
latency. Values depend on the application; do not present template numbers as service
guarantees. Alert on a nonzero privacy sentinel leak immediately. Alert on sustained
backlog or UNKNOWN writes before repeatedly raising worker concurrency and exhausting
the database/provider. Provide runbook links and a clearly named owner.

## Evidence of improvement

Compare a fixed dataset of tasks with and without memory. Record task success, source
correctness, latency, cost and user corrections. Include cold start and repeated-session
cases. Track negative outcomes as carefully as successful personalization. A decrease
in tokens is not a win if answers become less correct or leak another user's data.

## Incident containment

On scope leakage or poisoning, disable memory reads and writes for the affected cohort,
revoke compromised credentials, stop unsafe queue replay, preserve privacy-safe audit
evidence and identify contaminated derived artifacts. Rebuild from authorized canonical
sources and test negative cases before reenabling. A model prompt reminding the agent
to “be safe” is not sufficient remediation for a missing authorization boundary.
