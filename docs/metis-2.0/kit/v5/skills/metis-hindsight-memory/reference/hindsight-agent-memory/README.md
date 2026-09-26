# Hindsight Agent Memory — reusable implementation skill

**Version 1.0.0 · Documentation review: September 25, 2026**

This is a framework-independent Agent Skills folder. Give it to an agent that can
read your project and perform the authorized implementation. It combines a compact
instruction entry point, detailed implementation references, project recipes,
executable reference code, offline tests, and an opt-in live smoke test.

It is not the Hindsight server, a preconfigured cloud account, or proof that your
application has been deployed. No credentials, model weights, or binary dependencies
are included. Both the ZIP and extracted folder are intentionally below 5 MB.

## Install

Extract the ZIP and import or copy the **whole `hindsight-agent-memory/` directory**
into the skills directory supported by your agent host. `SKILL.md` must remain directly
inside that directory, beside `references/`, `scripts/`, `recipes/`, and `templates/`.
A host that accepts skill ZIP uploads should receive the ZIP. Host-specific discovery
and reload steps vary; confirm it can read one referenced file after installation.

For a host without skill discovery, attach the folder and instruct it to read
`hindsight-agent-memory/SKILL.md` first. The implementation skill needs file-edit and
execution permissions to change a project; memory tools alone cannot implement code.
Do not upload private project files or memory data without permission.

## Use

> Use hindsight-agent-memory to integrate persistent memory into this project.
> Inspect the existing code first, choose the least complex working approach,
> preserve authentication and canonical records, implement the integration,
> and show the tests and any remaining deployment requirements.

Other triggers include auditing isolation, adding memory to an event workflow,
debugging missing recall, setting up MCP, correcting/deleting memories, or migrating
an existing memory service. The skill routes to the relevant sections rather than
reading every guide on each request.

## Local verification

From this folder, with Python 3.11+ and Node.js 20+:

```sh
python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/memory_client.test.mjs
python scripts/validate_package.py
```

These tests do **not** contact Hindsight or spend model tokens. See `VERIFICATION.md`
for the exact runtimes and results used to validate this package. The minimum runtime
versions above are compatibility targets, not an assertion of a multi-version test run.

## Live connection test

Provision an explicitly authorized disposable bank first. Supply endpoint and access
key through your secret mechanism, then run the live script as documented in
`references/08-clients.md`. It writes one synthetic document, checks asynchronous
completion, document facts, recall and an update, and deletes only its own test document.
It does not create/delete banks, patch production configuration, or test complete
multi-user authorization. The script refuses to run without an explicit write opt-in.

## What's included

- A compact skill router and 18 implementation reference chapters.
- Practical recipes for local, chat/voice, multi-user, coding, multi-agent, RAG,
  business-process and event-driven projects.
- Fixed-bank Python and JavaScript HTTP reference clients, an evidence gate, a
  deployed-schema checker, a live smoke test, and local package validation.
- Contracts, missions, local Docker Compose, acceptance/evaluation cases, migration
  and handoff templates, source inventory and verification report.

Read `references/18-compatibility.md` before adapting old Hindsight examples. The
reviewed documentation contains newer features and a few contradictory explanations.
The package records those instead of hiding them behind a false universal guarantee.

## Scope and limitations

The developer topics, API guides, and selected client/integration documentation were
reviewed at differing depths; `sources/coverage.md` records this. This package is an
authored implementation synthesis, **not a verbatim complete documentation mirror**.
The large configuration table and generated API reference were consulted selectively.
No live Hindsight server, Entra tenant, cloud account or host framework was available
for end-to-end verification. Live readiness remains a project-specific acceptance gate.

References to native capabilities are sourced. Additional security, outbox, budgeting,
canonical evidence and rollout patterns are recommendations from this package, not
claims that Hindsight provides those application-level controls automatically.
