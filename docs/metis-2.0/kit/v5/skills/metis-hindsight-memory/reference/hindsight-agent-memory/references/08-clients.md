# 08 · Python, TypeScript, HTTP and executable reference code

## Prefer the client already in your stack

The official Python package is `hindsight-client`, with `Hindsight` from
`hindsight_client`. Helper methods include retain/recall/reflect; generated namespaces
cover additional operations and are asynchronous. Do not mix a synchronous helper,
a generated async namespace, and an embedded client as though their signatures match.
Source: [Python client](https://hindsight.vectorize.io/sdks/python).

The TypeScript/JavaScript package is `@vectorize-io/hindsight-client`, exposing
`HindsightClient`. The SDK uses JavaScript option conventions such as `maxTokens` in
some helper methods, whereas raw HTTP uses `max_tokens`. Generated APIs are another
surface. Pin SDK/server versions and typecheck against the installed package rather
than mechanically converting Python argument names.
Source: [TypeScript client](https://hindsight.vectorize.io/sdks/nodejs).

Go and CLI integrations are also documented; use current generated types/CLI help for
those routes. For embedded deployment, consult `hindsight-all` and `hindsight-all` npm
guidance separately. Running a Python subprocess is not an in-browser implementation.
Never bundle a provider key into an Electron renderer or frontend.
Sources: [Quickstart](https://hindsight.vectorize.io/developer/api/quickstart),
[Python embedded](https://hindsight.vectorize.io/sdks/hindsight-all),
[Node embedded](https://hindsight.vectorize.io/sdks/hindsight-all-npm).

## Package reference adapters

`scripts/memory_client.py` uses the Python standard library.
`scripts/memory_client.mjs` uses Node's native fetch.
Both bind one bank and a nonempty strict tag scope at construction, validate strings
and bounds, forbid insecure non-loopback HTTP, reject URL credentials/redirects, limit
request/response sizes and make no automatic retries. They provide version, retain,
recall, reflect, document lookup/deletion, and operation lookup. Reflect requires an
explicit opt-in; document deletion requires a matching confirmation argument.

These are small reference adapters, not a reimplementation of the entire Hindsight SDK.
They intentionally omit files, admin operations, bank configuration and arbitrary
request escape hatches. They do not authenticate your users, authorize bank membership,
provide a distributed circuit breaker or persist an outbox. The host application owns
those decisions. Private endpoint URLs must come from trusted configuration; transport
validation is not a general-purpose SSRF firewall. Use egress controls in deployment.

Python socket timeout is not a guaranteed total wall-clock deadline, particularly for
DNS or a peer trickling bytes. Use a supervising request deadline at the application/
proxy layer. Node abort bounds local work but does not prove remote cancellation.
Both distinguish access denial, rejection, unavailable reads and uncertain mutations.
Even a malformed successful response to a write is an unknown write outcome.

## Minimal use (backend only)

```python
import os, sys
from datetime import datetime, timezone
sys.path.insert(0, "scripts")
from memory_client import MemoryClient

# Values are provisioned/resolved by trusted application code, not model input.
client = MemoryClient(
    base_url=os.environ["HINDSIGHT_BASE_URL"],
    api_key=os.environ["HINDSIGHT_API_KEY"],
    bank_id=os.environ["HINDSIGHT_BANK_ID"],
    scope_tags=("purpose:assistant",),
)
receipt = client.retain(
    content="Synthetic test: the project codename is Cedar.",
    document_id="demo-approved-note-v1",  # use a stable source ID in real apps
    timestamp=datetime.now(timezone.utc).isoformat(),
    context="Approved synthetic note; not a real customer record.",
    metadata={"source_id": "demo-note", "revision": "1"},
)
result = client.recall("What is the project codename?")
# Before injecting result into a real agent, apply canonical evidence checks.
```

Async retain can accept a persisted `operation_id` only with the explicit capability
flag after validating server support. Append similarly requires a capability flag.
The adapter uses replacement by default and never invents an idempotency guarantee.
An outbox must persist the operation UUID and request digest before submitting it.

## Live smoke test

From the package folder, set backend-owned environment variables via your secret
manager or shell environment. Do not copy secrets into this skill or a chat transcript.

```sh
export HINDSIGHT_BASE_URL=http://127.0.0.1:8888
export HINDSIGHT_BANK_ID=explicitly-provisioned-disposable-bank
# Set HINDSIGHT_API_KEY through your secret mechanism.
export HINDSIGHT_ALLOW_TEST_WRITES=YES
python scripts/live_smoke.py
```

The script prints identifiers and status, not source data or keys. It creates a unique
synthetic document, waits for async retain, checks document count and recall, replaces
the value, verifies the revised document, and deletes its own document. A failed or
uncertain write leaves a clear cleanup notice rather than blindly racing a deletion
against in-flight retain. It does not perform auto-provisioning, bank deletion, derived
knowledge erasure or real multi-user authorization tests.

Optionally save your deployed OpenAPI JSON with an authorized client, then run:

```sh
python scripts/check_schema.py /secure/path/deployed-openapi.json
```

That script validates only required paths, operation presence and selected schema fields.
An OpenAPI match is not evidence that authorization/idempotency/quality works correctly.
Source for raw HTTP shapes: [API reference](https://hindsight.vectorize.io/api-reference).
