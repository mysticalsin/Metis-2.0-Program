# 18 · Version compatibility and documentation discrepancies

Reviewed September 25, 2026. The public generated HTTP reference displayed version
**0.10.1** during review. That is a documentation label, **not proof of the version
running in any user's account**, and not a pinned server release recommendation.
Use the actual `/version`, feature flags, installed SDK types and deployed schema.
Source: [HTTP reference](https://hindsight.vectorize.io/api-reference).

| Topic | What the reviewed docs show | Safe implementation choice |
|---|---|---|
| Requested `/developer/` index | Returned 404 during this review; linked developer pages worked | Navigate official topic pages; track actual coverage |
| Stored input privacy | Retain guide says content is not stored verbatim; Documents exposes `original_text`, and other docs discuss stored source content | Treat submitted content as potentially persisted; minimize before upload; inspect feature/config behavior |
| Missing retain timestamp | API guide documents ingestion-time default and `"unset"`; best-practice explanation differs | Use explicit timezone-aware timestamps; test timeless behavior where needed |
| Document update | Replace is default; current API guide additionally supports append | Default replacement snapshot; gate append and deduplicate event delivery |
| Async idempotency | Caller UUID `operation_id` is now documented for async single-strategy retain | Pin support, persist payload binding and test duplicate submission; don't assume old servers honor it |
| Profile/background | Generated reference marks old endpoints removed | GET/PATCH bank config, not old profile/background helpers |
| SDK examples | Some bank helpers/examples still show older mission/disposition patterns | Compile against installed SDK and test current server config route |
| Reflect context | Generated API marks `context` deprecated in favor of query composition; older SDK examples use it | Use a composed query in the reference HTTP client |
| Reflect budget | Final answer max_tokens is not total execution budget | Add provider/request/loop budgets separately |
| Knowledge-page freshness | `is_stale` does not detect deletions | Explicit invalidation/rebuild after deletion/revocation |
| Default tag match | Non-strict modes can include untagged data | Nonempty strict policy filter plus real authorization |
| MCP defaults | Open unless configured; bank route chooses scope | Authenticate and authorize bank access; test direct bypass |
| MCP tool allowlist | Can deny invocation while tool remains listed; does not govern REST | Check actual calls and enforce backend permissions |
| Sensitive-data defense | Opt-in; not retroactive; partial batch can still succeed | Minimize input and verify per-item/document outcome |
| Old document export | Removed synchronous GET; async export preferred | Track operation and download protected artifact |
| Cancellation | Cooperative; already committed work can remain; examples/descriptions differ in some cases | Test your server and reconcile; never equate cancel with rollback |
| Worker identity | Default hostname may change across restarts | Stable per-replica worker ID and targeted recovery |
| Extensions | Some formerly built-in tenant extensions moved to external packages | Validate import path/version, don't paste an old module path |
| Admin backend | PostgreSQL admin tools differ from Oracle support | Read backend-specific docs; no presumed feature parity |

Primary sources:
[Retain](https://hindsight.vectorize.io/developer/api/retain),
[Documents](https://hindsight.vectorize.io/developer/api/documents),
[Best practices](https://hindsight.vectorize.io/best-practices),
[Knowledge pages](https://hindsight.vectorize.io/developer/api/knowledge-pages),
[Memory banks](https://hindsight.vectorize.io/developer/api/memory-banks),
[MCP](https://hindsight.vectorize.io/developer/mcp-server),
[Memory Defense](https://hindsight.vectorize.io/developer/memory-defense),
[Extensions](https://hindsight.vectorize.io/developer/extensions),
[Admin](https://hindsight.vectorize.io/developer/admin-cli).

## Compatibility gate

Capture the actual server version/feature flags. Save the deployed OpenAPI securely.
Run `scripts/check_schema.py` for the core paths and inspect reported optional fields.
Pin dependencies and run native tests. Test an unsupported optional feature explicitly;
never let silent field ignoring downgrade an isolation or idempotency guarantee.

When sources disagree, write down the discrepancy and use the more conservative safe
behavior until the deployed implementation is tested. Do not turn a convenience demo
into a universal security or privacy promise. Re-review the relevant source pages
before an upgrade; a documentation snapshot has no automatic future validity.

Additional implementation-critical details from the reviewed generated API:
`temporal_window` is a temporal-arm ranking hint, not a universal time filter;
semantic/keyword score floors do not guarantee every returned result clears both;
untagged directives remain bank-global even under strict reflect tags. These are
independent of a correctly configured bank identity and must be evaluated explicitly.
