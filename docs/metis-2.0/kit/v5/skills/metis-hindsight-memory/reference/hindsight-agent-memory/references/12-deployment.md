# 12 · Deployment, storage and production boundaries

## Choose by need

A local single-user experiment can use the documented all-in-one deployment and embedded
PostgreSQL. Production should use a durable external database with backups, recovery,
authentication and operational ownership. The installation guide documents PostgreSQL
14+ with pgvector by default and optional vector backends. Oracle 23ai support is a
separate path with different capabilities; do not assume all admin tooling supports it.
Sources: [Installation](https://hindsight.vectorize.io/developer/installation),
[Storage](https://hindsight.vectorize.io/developer/storage),
[Oracle](https://hindsight.vectorize.io/developer/oracle).

## Local template

`templates/compose.local.yaml` is an intentionally local-only full-image example. It
binds the API to 127.0.0.1, requires a configured image/provider/model and access key,
uses a named data volume, and fixes worker identity. No public UI port is opened.
Read `.env.example`; obtain the image tag/digest from the trusted release channel.
The Compose file has not been run against Docker in this package's verification.

Do not use `latest` as the production release contract. Pin image digests, SDK and
schema compatibility. Do not paste provider keys on command lines that become shell
history; use a secret mechanism. The static API key authenticates the service but does
not create per-user bank authorization. A public deployment needs the application
security boundary described in reference 03.

## Service layout

The API can run with an integrated worker for simplicity. Separate workers when
throughput or deployment ownership requires it. The documented ports are API 8888,
control plane 9999, and worker metrics 8889; expose only what is required and protect
administrative/metrics endpoints. The API is stateless relative to durable database
state; worker/task recovery still requires stable identity and sound queue handling.
Source: [Services](https://hindsight.vectorize.io/developer/services).

Full images/packages can include local embedding/reranking dependencies; slim variants
require suitable external services/configuration. Intel macOS and accelerator support
need platform-specific checks. Never claim a CPU/GPU memory requirement from a generic
example without testing the selected models and data volume. Prefer a named volume
with documented non-root permissions rather than forcing an arbitrary container UID.

## Production checklist

Configure TLS, ingress authentication, per-cohort authorization, secret injection,
provider egress policy, database encryption/backups and restoration ownership. Keep
the database and admin CLI inaccessible to untrusted clients. Control plane access
needs its own security review; hiding the port in a README is not protection.

Size database pools across all API/worker replicas and replicas separately. Separate
read replicas can lag corrections and deletes; enforce current tombstones at the
application. Use a direct migration connection where required rather than assuming
all pooler modes support migrations. Pin and rehearse migrations in staging.

Use readiness for database connectivity and liveness for process health. Current API
docs distinguish `/health/ready` (and `/health` alias) from `/health/live`. Do not restart
all pods repeatedly because the shared database is temporarily unavailable.
Source: [API reference](https://hindsight.vectorize.io/api-reference).

## Kubernetes and advanced topology

A documented Helm chart exists, but read current values and pin the chart/image instead
of pasting guessed flags. Stable per-replica worker IDs, resource requests, durable
volumes/external database, secrets, ingress, probes and scale testing are required.
Introduce this topology only if the team already operates it or needs the benefits.
Do not impose Kubernetes for a local desktop assistant.

## Restore and disaster recovery

Backups must be tested, not merely scheduled. Record recovery point/time objectives,
restore to an isolated target, reapply tombstones, inspect callbacks, validate indexes
and re-run privacy/fact tests before serving traffic. Bank/document transfer is not
necessarily a complete database backup. Never run a destructive restore without an
explicitly approved target and verified backup. See reference 15 for migration details.
