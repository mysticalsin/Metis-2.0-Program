# 17 · Tests, evaluations and release acceptance

## Three evidence levels

**Offline implementation tests** validate local code and policy logic with fake
transports/resolvers. They catch request-shape, bounds and failure-handling regressions.
They do not prove the Hindsight server, authentication, model quality or deployment.

**Native integration tests** use a real authorized test server/bank and actual provider
configuration. They establish retain/recall/update/delete and operation behavior on the
specific version. They may cost money and process data; use synthetic data and explicit
permission. The included live smoke test is intentionally limited to core behavior.

**Application acceptance tests** exercise independently authenticated users, actual
framework/queue/storage, approvals, privacy, freshness, failures, recovery and quality.
These are required before claiming a multi-user production integration is ready.

## Required scenarios

Use `templates/acceptance-matrix.csv` and `templates/eval-cases.jsonl` as a starting set.
At minimum test stable preferences across sessions, two users with conflicting private
facts, no-access tenant, untagged sentinel, unknown source, stale source revision,
revoked grant, deleted fact and derived artifact, explicit correction, prompt injection,
repeated async operation ID, unknown acknowledgement, out-of-order updates, deadline,
oversized context and memory-off behavior. Include real project languages and formats.

For append, send the same event twice and show deduplication outside or through a
verified idempotent operation. For replace, race old/new revisions and prove the
canonical newest version wins. For cancellation, demonstrate that any already committed
work is reconciled instead of assumed rolled back. For restore, prove tombstones stop
resurrection. These are behavioral tests, not comments in source code.

## Quality dataset

Construct synthetic or approved examples with source IDs, versions, timestamps,
authorized readers, expected claims and forbidden claims. Keep a held-out subset.
Do not use the same cases to tune missions and advertise final performance without
reporting that overlap. Avoid test facts so generic that the base model can answer
without memory; use synthetic non-sensitive distinctive values.

Track source precision/recall, supported-answer correctness, unauthorized leakage,
revision correctness, latency and cost. Compare memory-on with memory-off. Use human
review on an initial representative sample; model-as-judge scores alone may miss
source/authorization problems. A good result improves the user's task without
sacrificing privacy or current-state correctness.

## Pass/fail policy

Unauthorized evidence, credential exposure, ignored tombstones and execution of memory
instructions are release blockers. Quality and latency targets are project-defined;
record a baseline and an explicit threshold. Do not borrow a benchmark number from
an unrelated dataset as your acceptance target. A failed security test must not be
averaged away by many successful preference tests.

## Reporting

For every test, record the exact configuration, command, timestamp, observed result,
expected result and evidence file/operation ID. Clearly label PASSED, FAILED, SKIPPED
or NOT RUN. “Code provided” and “schema checked” are not PASSED native runtime tests.
The package's `VERIFICATION.md` follows this distinction. Use the handoff template to
separate cleared gates from those needing project credentials, infrastructure or review.

Native behavior sources: [Retain](https://hindsight.vectorize.io/developer/api/retain),
[Recall](https://hindsight.vectorize.io/developer/api/recall),
[Operations](https://hindsight.vectorize.io/developer/api/operations),
[Knowledge pages](https://hindsight.vectorize.io/developer/api/knowledge-pages).
