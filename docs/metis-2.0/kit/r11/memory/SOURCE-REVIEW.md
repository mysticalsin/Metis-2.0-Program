# Hindsight → Métis: source review and design decisions

**Reviewed 23 September 2026. Not a deployed-service certification.**

The owner requested embedded memory. The design below is our proposed Métis integration, not a claim that Hindsight supplies all the surrounding controls. Official HTTP docs showed version 0.10.1; the upstream main ref was `b88458fd6b96e70069238f7df5a0e2f1c3c9240c`. Pin an approved release image and SDK/schema during actual implementation; do not equate these observations with a verified production image.

## HS-01 · A memory engine, not a new canonical authority

Retain, retrieval and synthesis fit behind the existing knowledge API. World/experience/observation labels must not certify a business fact.

Evidence: HS-R01, HS-R02.

## HS-02 · A deliberate persistent derived store

Hindsight is not a zero-retention inference shim. Approve and disclose the new memory projection store; leave raw meetings and forbidden local-only content outside it.

Evidence: HS-R03, HS-R06.

## HS-03 · Source-text retention must be disabled explicitly

The configuration documents STORE_DOCUMENT_TEXT=false; the introductory retain guide suggests no verbatim storage. Test actual database/document/chunk behavior rather than accepting the simpler marketing statement.

Evidence: HS-R03, HS-R04, HS-R06, HS-R13.

## HS-04 · Tracing is a second content sink

Disable model-request traces and content-bearing OTLP export separately. Truncated or one-day prompt copies are still retained copies.

Evidence: HS-R03.

## HS-05 · Operation rows need a lifecycle

Terminal operations can retain payloads indefinitely by default; set finite retention and handle stuck nonterminal work. Passing async=false for ingress is not proof that consolidation has no durable payload.

Evidence: HS-R07.

## HS-06 · Authentication is not supplied by a bank name

Default API access is not authenticated. The builtin shared-key tenant resolves to shared schema scope; it is not per-person or per-record authorization.

Evidence: HS-R03, HS-R08.

## HS-07 · Default tag matching includes untagged memory

Use nonempty server-derived strict scope. all_strict is an all-required-tags test, not exact set equality. Fuzzy tag groups and global observations must not select security scope.

Evidence: HS-R02, HS-R05.

## HS-08 · Observations can widen retrieval scope

Do not use shared/per-tag/all-combination consolidation for private security tags. Start with one homogeneous ACL domain and combined scope; qualify every derived lineage.

Evidence: HS-R04.

## HS-09 · Mental-model stale flags miss deletion

The API explicitly says deletions do not raise is_stale. Invalidate memory-derived answers through Métis tombstones/generations, including pages and prior materialized reflections.

Evidence: HS-R02.

## HS-10 · Replace is not compare-and-swap

Stable document IDs help updates, but concurrency, out-of-order retries and tenant ACL changes still require Métis revision/fencing semantics.

Evidence: HS-R02, HS-R06.

## HS-11 · Cancellation is not physical rollback

A worker may finish its current batch after cancellation. Block retrieval first and reconcile surviving upstream mutations.

Evidence: HS-R02, HS-R07.

## HS-12 · Slim clients need a real service

Do not add Docker, Python, PostgreSQL or embedding weights to each installer. Use approved server infrastructure, not D1 as an invented PostgreSQL substitute.

Evidence: HS-R09, HS-R14.

## HS-13 · Memory creates additional inference work

Extraction, embedding, reranking, consolidation and reflection have separate model/cost paths. TypeSafe/Jev reranking is documented; Laya is not automatically a compatible embedding or generation model.

Evidence: HS-R03.

## HS-14 · Optional defense is not complete sanitization

Memory Defense is opt-in and future-facing. Keep independent ingress, tool-authority, output-audience and deletion controls.

Evidence: HS-R10.

## HS-15 · Time-window hints are not strict filters

Recall temporal_window influences a retrieval arm; it does not exclude every out-of-window result. Enforce any contractual date interval against authorized canonical event time.

Evidence: HS-R02.

## HS-16 · Embedding migrations are semantic migrations

Pin model and dimensions; do not mix vector spaces even if dimensions match. Rebuild from currently permitted canonical records into a versioned projection, then qualify and switch.

Evidence: HS-R03.

## HS-17 · Global directives remain relevant during reflect

apply_all_directives=false does not remove untagged directives. Keep directive authoring service-owned and forbid sensitive mixed-audience bank prompts.

Evidence: HS-R02.

## HS-18 · No deployed service verified here

Documentation, pinned ref and offline adapter tests do not prove network isolation, supplier approvals, effective policy, model quality or actual Métis integration.

Evidence: HS-R01–HS-R14.

## Primary source register

### HS-R01 · Hindsight product and memory model

https://hindsight.vectorize.io/

Retain, recall, and reflect are different operations; vendor benchmark claims are not Métis results.

### HS-R02 · HTTP API, observed documentation version 0.10.1

https://hindsight.vectorize.io/api-reference

Wire schemas, endpoint paths, version feature flags, operation status, mental-model deletion caveat.

### HS-R03 · Configuration

https://hindsight.vectorize.io/developer/configuration

Persistence, traces, authentication, inference stages, model compatibility and configuration readback.

### HS-R04 · Retain guide

https://hindsight.vectorize.io/developer/api/retain

Document replacement and extraction scopes. Resolve apparent text-retention contradiction against configuration and actual deployed behavior.

### HS-R05 · Recall guide

https://hindsight.vectorize.io/developer/api/recall

Bounded recall and exact versus permissive tag modes. Tags are not authentication.

### HS-R06 · Document lifecycle

https://hindsight.vectorize.io/developer/api/documents

Original text access, replacement and document deletion; no implication of complete derivative erasure.

### HS-R07 · Operations

https://hindsight.vectorize.io/developer/api/operations

Background job states and retention, including payload-bearing terminal operation rows.

### HS-R08 · Extensions and tenant resolution

https://hindsight.vectorize.io/developer/extensions

Builtin API-key tenancy and custom tenant resolution are not existing Métis Entra/record permissions.

### HS-R09 · Installation and production hosting

https://hindsight.vectorize.io/developer/installation

Dedicated service plus supported PostgreSQL; development embedded database is not recommended for production.

### HS-R10 · Memory Defense

https://hindsight.vectorize.io/developer/memory-defense

Pattern-based optional protection; not retroactive erasure or a complete semantic security boundary.

### HS-R11 · Node SDK

https://hindsight.vectorize.io/sdks/nodejs

Official SDK option to evaluate against the existing dependency policy and the pinned service.

### HS-R12 · Repository source pin

https://github.com/vectorize-io/hindsight/tree/b88458fd6b96e70069238f7df5a0e2f1c3c9240c

Main ref observed through GitHub connector. This is not a production release image digest or a complete source audit.

### HS-R13 · Runtime memory-budget source note

https://github.com/vectorize-io/hindsight/blob/b88458fd6b96e70069238f7df5a0e2f1c3c9240c/hindsight-docs/blog/2026-08-27-retain-memory-budget.md

The original_text persistence is acknowledged by upstream source documentation.

### HS-R14 · Service architecture

https://hindsight.vectorize.io/developer/services

API/worker separation and PostgreSQL-backed state and tasks.

