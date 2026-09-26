# Verification report

**Package:** Hindsight Agent Memory 1.0.0  
**Verification date:** September 25, 2026  
**Executed runtimes:** Python 3.13.5; Node.js 22.16.0

## Tests actually executed

| Check | Observed result | Scope |
|---|---|---|
| Python unit/policy/schema/transport tests | **60 passed; 0 failed** | Mock transports, trusted-source resolver fixtures, synthetic local OpenAPI, and a local HTTP fixture |
| JavaScript reference client tests | **21 passed; 0 failed** | Fake fetch/stream responses and abort behavior |
| Root `SKILL.md` YAML parsing | **Passed** | Valid name, description and metadata frontmatter |
| Local Compose YAML parsing | **Passed** | YAML syntax only, not Docker interpolation/startup |
| Package structure/reference validator | **Passed** | Required files, internal paths, Python syntax, JSON/JSONL and extracted size |
| Live script without write authorization | **Correctly refused; exit 2** | Tested the default safety gate; no Hindsight request sent |

The **81 passing tests** check fixed bank/scope request shapes, capability gating,
strict tags, metadata types, timezone requirements, byte budgets, redirect refusal,
credential/header validation, access-denial classification, ambiguous writes, no
implicit retry, source authorization, grants/revisions/tombstones/expiry, canonical
text selection, complete-envelope budgeting and bounded schema references.

Five Python tests exercise real loopback HTTP request/response mechanics against a
synthetic local fixture. That fixture is **not Hindsight**, has no extraction model,
and does not establish native service behavior. The remaining client tests use mocks.

Raw logs are included in `tests/results/python.log` and `tests/results/node.log`.

## Reproduce

From the extracted skill directory:

```sh
python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/memory_client.test.mjs
python scripts/validate_package.py
```

The test suite performs no external Hindsight/provider requests. It binds an ephemeral
loopback port for the Python transport fixture. A tightly sandboxed host may need
permission for that local fixture. The reference client itself uses only the standard
Python library or Node native APIs; optional YAML parsing during authoring is not a
runtime dependency of the client or packaged validator.

## Explicitly NOT run

| Native/application gate | Status |
|---|---|
| Live retain/recall/reflect against a Hindsight deployment | **NOT RUN** |
| Native async idempotency or append semantics | **NOT RUN** |
| Current deployed server OpenAPI check | **NOT RUN**; checker tested using a synthetic fixture |
| Native Memory Defense, zero-fact or partial-batch behavior | **NOT RUN** |
| Two real authenticated users/tenants and direct API/MCP bypass tests | **NOT RUN** |
| Native deletion of raw and derived content; restore anti-resurrection | **NOT RUN** |
| LangGraph, Vercel AI SDK, MCP host or Entra execution | **NOT RUN** |
| Docker, Kubernetes, cloud or Oracle deployment | **NOT RUN** |
| Project-specific quality, multilingual performance, latency and spend | **NOT RUN** |

No live endpoint, service credential, model-provider credential, application repository
or identity tenant was supplied for this task. The skill is packaged and locally tested;
**your project's native integration and production readiness remain unverified**.
The live smoke script and acceptance matrix make those remaining checks explicit.

## Research provenance

The source inventory contains 47 official documentation/repository references. Core
API shapes and critical operational/security behavior were checked in relevant sections.
The large configuration and generated API references were not audited line-by-line in
full. `sources/coverage.md`, `sources/manifest.json` and the compatibility chapter record
coverage and discrepancies. No complete recursive source-code audit is claimed.

The observed public HTTP documentation label was 0.10.1. This does not prove the
version deployed by any user or guarantee availability on older releases.
