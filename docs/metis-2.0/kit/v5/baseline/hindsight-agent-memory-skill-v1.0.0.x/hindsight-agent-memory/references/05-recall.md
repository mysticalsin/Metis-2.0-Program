# 05 · Recall, provenance and bounded context

## Query construction

Ask the question whose answer matters now. Include relevant entities, project and date
context, but avoid copying a whole transcript into every query. A concise task-grounded
query is easier to evaluate than a generic “remember everything about this user.” Use
an explicit `query_timestamp` when interpreting relative dates. A query anchor is not
an authorization cutoff or a guaranteed historical snapshot.

Recall searches through multiple retrieval strategies and can return world, experience
and observation types. Use `low`/`mid`/`high` retrieval budgets deliberately; start small
and measure missed evidence before raising them. Avoid one reflect plus many recalls
per turn by default. Sources: [Recall API](https://hindsight.vectorize.io/developer/api/recall),
[Retrieval architecture](https://hindsight.vectorize.io/developer/retrieval).

## Strict filters

For a scope such as `project:p1` plus `purpose:support`, use an explicit nonempty
`all_strict` filter when both tags are required. `any_strict` is OR without untagged
records; `exact` requires the whole tag set. Ordinary `any` and `all` include untagged
records in the documented behavior. Empty filters must not become broad fallback access.
Bank-level authorization remains mandatory even with strict filtering.

Filters on the initial raw facts are not sufficient if a derived observation combines
more broadly authorized records. See identity-security before enabling observations,
mental-model search or reflect over a shared bank.

## Result handling

Treat result IDs as lookup hints. Resolve their source through a trusted projection
mapping or canonical resolver; check active revision, grant, tenant, purpose and
retention status. Reject source-less facts for workflows requiring evidence. A metadata
field claiming “approved” is not approval. Return explicit uncertainty when a valid
inference goes beyond what the canonical source states.

Optional chunks help recover exact wording. Source facts can explain observations.
Entities, trace data and metadata have their own privacy and token costs. Request
these only when needed. Prefer a canonical connector read for exact quotations or
current policy. Validate that each cited source actually supports the proposed claim;
retrieval rank is not confidence, truth or entailment.

## Full-envelope budget

`max_tokens` does not replace application-wide budgeting. Count the complete serialized
context after adding source links/IDs, metadata, chunks, entities, warnings and wrapper
text. Use the tokenizer of the model receiving the envelope, or an explicitly declared
character/byte budget; never silently equate a byte heuristic with exact tokens.

Recommended starting policy values, not native defaults: one recall, up to eight
evidence records, no source chunks unless needed, 1,500 retrieved text tokens, 12 KB
serialized evidence and an independent end-to-end request deadline. Tune against your
actual workload. Keep a budget for the user's request, tool calls and final answer.

Deduplicate by trusted source identity/revision and excerpt, preserving distinct
conflicting evidence. Prefer dropping a whole lower-priority item over truncating away
a negation or splitting a citation. Keep a truncation indicator outside unsupported
claims. Never emit half a JSON document. `scripts/evidence_gate.py` provides tested
whole-item envelope construction, with an optional exact-token counting callback.

## Caching and freshness

Cache keys must include tenant, principal/cohort, bank, purpose, grants version,
source revision/epoch, query, filters and relevant model/config version. Do not reuse
another principal's cache because the text query matches. Invalidate on correction,
delete, consent change, role change or source revocation. Revalidate before use when
revocation can occur during a request. A read replica can lag, so current canonical
tombstones remain necessary even after the primary accepted deletion.

## No-result and failure behavior

No relevant memory is a normal result. Continue from the user's prompt and canonical
sources; do not fabricate a remembered preference. A 401/403 is a configuration/access
issue, not an invitation to try another bank. A transient outage can activate a clear
memory-off mode without suppressing normal action safety. Retry read requests only
within a bounded deadline and request budget; the reference clients intentionally do
not implement automatic retries.

## Retrieval evaluation

Test expected source recall, irrelevant memory exclusion, untagged/private sentinel
exclusion, contradictions, relative time, multilingual questions, token envelope limits
and privacy-safe failure. Use held-out cases and compare memory-on versus memory-off.
If extracted facts are absent, fix retain before tuning reranking. If valid facts exist
but are filtered out, fix scope/config before increasing the retrieval budget.

## Advanced temporal and score-filter caveats

The current generated HTTP reference states that `temporal_window` affects the temporal
retrieval arm's ranking, not a hard filter across all retrieval arms. Facts outside that
window can still arrive through semantic, keyword or graph retrieval. Implement a true
source-time eligibility check in the application when the task requires a hard cutoff.
Likewise, semantic/keyword `min_scores` apply to their own retrieval arms, while reranker/
final floors have different post-ranking semantics; absolute reranker scores are not
calibrated confidence. Do not interpret these values as probabilities of truth.
When requested source facts are truncated, some referenced IDs may be absent from the
returned source-facts map because its budget ran out, not because the source never
existed. Resolve or omit unsupported claims rather than inventing their provenance.
Source: [Generated HTTP API](https://hindsight.vectorize.io/api-reference).
