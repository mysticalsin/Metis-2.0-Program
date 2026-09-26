# Recipe · Multi-user memory with an existing Entra identity layer


This is an application integration pattern, not a prebuilt Entra connector. Reuse the
app's maintained authentication middleware. After full token validation, obtain stable
tenant and principal identifiers and current permissions from trusted context. Do not
trust `userId`/`tenantId` supplied in a JSON body or merely decoded token.

Resolve `{tenant, principal, project, purpose}` through an application-owned mapping to
an opaque bank. A role with team memory access is separately authorized for the shared
cohort. Every reader must be allowed to see the entire synthesis domain before native
reflect/derived artifacts are enabled. Human and service-principal access differ.

Create a per-request adapter/tool closure with immutable bank and mandatory scope. Keep
Hindsight service keys in the backend and prohibit direct client access to privileged
REST/MCP routes. Enforce grants before uploads, not only at response rendering. Tags
help retrieval but cannot replace the gateway policy.

Use a trusted resolver to bind memory result IDs to source revisions and current grants.
Changed group membership revokes memory and cache access immediately. Stop queued writes
on revoked consent. Rebuild/quarantine derived knowledge affected by scope changes.

Acceptance: two real independently authenticated test users; tenant spoofing, bank-path
swaps, direct document/list/export/MCP requests, changed membership, cache collision and
service-principal misuse all fail. A test using only two different tag strings with the
same all-powerful key does not establish tenant isolation.
