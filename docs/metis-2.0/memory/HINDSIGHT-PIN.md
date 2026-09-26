# HINDSIGHT-PIN — upstream identity pin for Vectorize Hindsight

Ticket: M2-0020 (HMSTEP-01, kit refs REF-15..17 / HS-01..18 / HS-R01..14, finding refs CRITIC-INV-14 / K09-R07).
Retrieved: 2026-09-26, against upstream `https://github.com/vectorize-io/hindsight.git` (public, MIT-licensed, default branch `main`). All commands below were re-run live on that date; every claim is labeled OBSERVED (read directly from the primary source), DERIVED (computed from an OBSERVED fact), or UNKNOWN.

This document is the pin. It supersedes the "no identity certified" state that made HMSTEP-01 NOT_MET (`plan-inputs/PRIOR-EXECUTION.json:K09-R07`; `lanes/K09-prior-execution.md:35`; `plan-work/SYNTHESIS-NOTES.md:285` CRITIC-INV-14) and gives the memory plan (ARCHITECTURE.md "Hindsight memory" row, ADR-014/D-5) a concrete release to build against. **Nothing has been deployed or coded against this pin — it is a research/record ticket only**, per its `scope_paths` (this file) and `required_evidence: DESIGNED`.

---

## 1. Pinned identity (no `latest`)

| Field | Value | Status |
|---|---|---|
| Repository | `https://github.com/vectorize-io/hindsight.git` | OBSERVED |
| Release tag | `v0.10.1` | OBSERVED — latest tag; `git ls-remote --tags` shows no `v0.10.2`+ as of 2026-09-26 |
| Release commit SHA | `f8950b0c07d9e34c76493dba802bb309f0ce60fd` | OBSERVED — dereferenced from the annotated tag object (`git/refs/tags/v0.10.1` → tag object `fac097590c016126fc07c9a823fd9106da0d084f` → `object.sha`). Commit message: "Release v0.10.1 — Update version to 0.10.1 in all components". Authored 2026-09-21T14:59:59Z. |
| Release published | 2026-09-21T15:24:30Z | OBSERVED (`GET /repos/vectorize-io/hindsight/releases/tags/v0.10.1`) |
| Node/TypeScript client SDK | `@vectorize-io/hindsight-client@0.10.1` | OBSERVED (npm registry). `gitHead: f8950b0c07d9e34c76493dba802bb309f0ce60fd` — **exact match** to the release commit. `dist.integrity: sha512-83FsMz/FyFwKooN1KsBZq4cWLB4RJQcTTnmxpZ0n4bXZih1iySLCtR88OAuqhqSnT3ajw4Nx5Oa8OwrrBuI6Lw==`; `dist.shasum: 9ef0d7a3b5c0fc3af36d1739b98c642db9d41d03`. Package directory `hindsight-clients/typescript` in the monorepo. This is the SDK the existing kit code targets (`kit/*/memory/src/hindsight-client.mjs` is a Node ESM module). |
| Python client SDK | `hindsight-client==0.10.1` | OBSERVED on PyPI (`pypi.org/pypi/hindsight-client/json` → `info.version: 0.10.1`). Not currently used by any kit code; recorded for completeness only. |
| OpenAPI/schema identity | `openapi: 3.1.0`, `info.title: "Hindsight HTTP API"`, `info.version: "0.10.1"`, 74 paths | OBSERVED — canonical file `hindsight-docs/static/openapi.json` at commit `f8950b0c...`. Git blob SHA `5f4ac3bcfd1f298dcfe933253950258a32084072`; SHA-256 of the raw file content: `af16a099b209e16f2337e78fd4310c698d42e1de65d2ba60ffa1c335cc9bae56` (570,730 bytes). |
| Container image — API | `ghcr.io/vectorize-io/hindsight-api:0.10.1` | OBSERVED — OCI image-index digest `sha256:35a1c04c3b50172707d627f82d7f7800d7695b8d9e630142354e3365e5ce56ba` (multi-arch). `linux/amd64` child manifest `sha256:7e7378b003fcac108d32111c3d75a5995a6fc7bfbd4f2a9047d68200ab364b01`; `linux/arm64` child manifest `sha256:b53b8b017ab2770d353dd965976eab0757cd5414738c1d391eac84eabd0db719`. |
| Container image — control plane | `ghcr.io/vectorize-io/hindsight-control-plane:0.10.1` | OBSERVED — OCI image-index digest `sha256:d3ff569d865f715be1fd6904ac911325af63a4e01c64e7c25e4736cc8def71be`. |
| License | MIT (Vectorize AI, Inc., copyright 2025) | OBSERVED (`LICENSE` at the release commit; `GET /repos/vectorize-io/hindsight` → `license.spdx_id: "MIT"`) |
| Current `main` HEAD (informational, not the pin) | `ccfe85b4851957ac2adf88b4a9ddf9668b2882f1` | OBSERVED, 2026-09-26. DERIVED: `git compare f8950b0c...main` reports `status: ahead, ahead_by: 127, behind_by: 0` — main has 127 unreleased commits past v0.10.1 and no newer tag exists yet, so v0.10.1 is genuinely current, not stale. |

**Deviation from the prior source review, and why.** The r11-kit source review (`kit/r11/memory/SOURCE-REVIEW.md`, `kit/r11/memory/SOURCES.json`, reviewed 2026-09-23) recorded `upstream_ref: b88458fd6b96e70069238f7df5a0e2f1c3c9240c` — an arbitrary `main` snapshot, two days *newer* than the actual last cut release. This ticket pins to the tagged release (`v0.10.1` / `f8950b0c...`) instead, because (a) the acceptance criterion forbids `latest`/floating refs and a release tag is the only reproducible, versioned identity upstream publishes; (b) the npm and PyPI client packages, and the `openapi.json` `info.version`, all independently agree on `0.10.1`, so the whole stack (server, clients, schema) is provably self-consistent at this one commit, which is not true of an arbitrary main snapshot; (c) `b88458fd` remains reachable and is not stale (verified below), so nothing the r11 review cited is broken — it is simply not the identity to build against.

---

## 2. Verification performed

```
$ git ls-remote --tags --refs https://github.com/vectorize-io/hindsight.git   # latest tag: v0.10.1
$ git ls-remote https://github.com/vectorize-io/hindsight.git HEAD refs/heads/main
  ccfe85b4851957ac2adf88b4a9ddf9668b2882f1  HEAD
  ccfe85b4851957ac2adf88b4a9ddf9668b2882f1  refs/heads/main
$ curl -s api.github.com/repos/vectorize-io/hindsight/git/refs/tags/v0.10.1      # tag object -> fac097590c...
$ curl -s api.github.com/repos/vectorize-io/hindsight/git/tags/fac097590c...     # dereferences to commit f8950b0c...
$ curl -s api.github.com/repos/vectorize-io/hindsight/compare/f8950b0c...main    # ahead_by 127, behind_by 0
$ curl -s registry.npmjs.org/@vectorize-io%2fhindsight-client                    # latest: 0.10.1, gitHead f8950b0c...
$ curl -s pypi.org/pypi/hindsight-client/json                                   # version 0.10.1
$ (ghcr.io token dance) curl -H "Authorization: Bearer $TOKEN" .../manifests/0.10.1   # Docker-Content-Digest, both images
$ shasum -a 256 openapi.json  (fetched raw at f8950b0c...)                      # af16a099b209e16f2337e78fd4310c698d42e1de65d2ba60ffa1c335cc9bae56
```

All 14 HS-R sources were re-fetched and returned `200`:

| Ref | URL | Result |
|---|---|---|
| HS-R01 | `hindsight.vectorize.io/` | 200 — reachable |
| HS-R02 | `hindsight.vectorize.io/api-reference` | 200 — reachable |
| HS-R03 | `hindsight.vectorize.io/developer/configuration` | 200 — reachable |
| HS-R04 | `hindsight.vectorize.io/developer/api/retain` | 200 — reachable |
| HS-R05 | `hindsight.vectorize.io/developer/api/recall` | 200 — reachable |
| HS-R06 | `hindsight.vectorize.io/developer/api/documents` | 200 — reachable |
| HS-R07 | `hindsight.vectorize.io/developer/api/operations` | 200 — reachable |
| HS-R08 | `hindsight.vectorize.io/developer/extensions` | 200 — reachable |
| HS-R09 | `hindsight.vectorize.io/developer/installation` | 200 — reachable |
| HS-R10 | `hindsight.vectorize.io/developer/memory-defense` | 200 — reachable |
| HS-R11 | `hindsight.vectorize.io/sdks/nodejs` | 200 — reachable |
| HS-R12 | `github.com/.../tree/b88458fd6b96e70069238f7df5a0e2f1c3c9240c` | 200 — reachable, but points at the pre-review main snapshot, not the pin. **Recommend repointing to the release**: `github.com/vectorize-io/hindsight/tree/v0.10.1`, when `kit/r11/memory/SOURCES.json` is next touched. Not changed here — out of this ticket's `scope_paths`. |
| HS-R13 | `github.com/.../blob/b88458fd.../hindsight-docs/blog/2026-08-27-retain-memory-budget.md` | 200 — reachable, same caveat as HS-R12 (the blog post itself is unversioned/undated content, not release-scoped, so the permalink choice matters less here). |
| HS-R14 | `hindsight.vectorize.io/developer/services` | 200 — reachable |

None are stale. HS-R12/HS-R13 are flagged, not marked stale: they resolve correctly, they just cite a non-canonical commit.

---

## 3. HS-01..HS-18 re-checked against the pin (`v0.10.1` / `f8950b0c07d9e34c76493dba802bb309f0ce60fd`)

Source for the original 18 observations: `kit/r11/memory/SOURCE-REVIEW.md` / `SOURCES.json` (also duplicated verbatim under `kit/v5/baseline/.../r11-kit/memory/`).

| ID | Original claim | Re-check at the pin | Verdict |
|---|---|---|---|
| HS-01 | Memory is an engine behind the knowledge API, not a new canonical authority. | No API-level change; `retain`/`recall`/`reflect` remain the three operations (`hindsight-docs/versioned_docs/version-0.10/developer/api/*`). | **Still true** |
| HS-02 | Hindsight is a deliberate persistent derived store, not zero-retention. | Confirmed and sharpened — see §4. Config doc states the product keeps a verbatim copy **by default** unless told not to. | **Still true** (stronger than originally worded — see §4) |
| HS-03 | STORE_DOCUMENT_TEXT should be disabled explicitly; the retain guide suggests no verbatim storage while config allows it. | Confirmed with an exact source, not just "suggests": see §4. `HINDSIGHT_API_STORE_DOCUMENT_TEXT` default is `true`; retain.mdx's "never stored verbatim" is API-level rhetoric about `retain`'s *output* facts, not about document persistence. Both are simultaneously true and describe different things. | **Still true, now precisely sourced** |
| HS-04 | Tracing (LLM request trace) and OTLP export are separate content sinks; disable both independently. | Confirmed exactly: `HINDSIGHT_API_LLM_TRACE_ENABLED` default `true` (1-day retention, full prompt/output stored, `HINDSIGHT_API_LLM_TRACE_MAX_CHARS` default 50,000 chars); `HINDSIGHT_API_OTEL_TRACES_ENABLED` default `false`, separate switch. (`configuration.md:2551-2620`) | **Still true** |
| HS-05 | Terminal operation rows can retain payloads indefinitely by default. | Confirmed verbatim in intent: "Completed, failed, and cancelled operations are kept indefinitely by default. Set `HINDSIGHT_API_OPERATION_RETENTION_DAYS`..." Pending/processing rows are never removed by retention cleanup. PostgreSQL-only cleanup loop (no-op on Oracle backend). (`operations.mdx:43`) | **Still true**, with a new caveat: the Oracle-backend exception is new information not in the original observation. |
| HS-06 | Default API access is not authenticated; the shared-key tenant gives shared schema scope, not per-person auth. | Confirmed: built-in `ApiKeyTenantExtension` validates one shared key against an env var and always uses the `public` schema for every authenticated request (`extensions.md:13-19`). | **Still true** |
| HS-07 | `all_strict` is an all-required-tags test, not exact-set equality; empty tag list can mean no filter even in strict mode. | Confirmed, and the API now also documents an `exact` mode explicitly ("Memory has exactly the specified tag set", excludes untagged) that did not appear as a named mode in the original observation. Empty/null tags still mean "no filter" for every mode except `exact`. (`recall.mdx:188-212`) | **Changed** — `exact` mode is new-to-the-observation and is the correct tool for the isolation HS-08 asks for; still must be selected explicitly (`any`/`all` remain the defaults). |
| HS-08 | Do not rely on default consolidation modes for private/security tags; use one homogeneous ACL scope. | The `exact` tag-match mode (see HS-07) gives a concrete mechanism to satisfy this that the original text only described abstractly. | **Changed** (a concrete fix now exists — see HS-07) |
| HS-09 | Mental-model `is_stale` flags miss deletions; deletions leave no write, so staleness never fires from them alone. | Confirmed near-verbatim: "Deletions are invisible to it... does not raise the flag." (`mental-models.mdx:214`) | **Still true** |
| HS-10 | Replace via a stable `document_id` is not compare-and-swap; concurrency/ACL-change handling is still Métis's job. | Confirmed: "Re-retaining with the same document_id **replaces** the old content" (`documents.mdx:72`). No optimistic-concurrency token (ETag/revision) is exposed on this endpoint in the reviewed docs — Métis-side fencing is still required. | **Still true** |
| HS-11 | Cancellation is not physical rollback; a worker may finish its current batch. | Not separately re-verified beyond the operations-lifecycle text in HS-05 (no new cancellation-specific doc section found at this pin). | **Not re-verified independently — treat as still true, unconfirmed by new source text** |
| HS-12 | Slim clients need a real service; do not bundle Docker/Python/Postgres/embeddings per install. | Confirmed: `pg0` (embedded Postgres) is explicitly "convenient for development" and "**not recommended for production**"; production guidance points at Supabase/Neon/Azure/self-hosted Postgres+pgvector. (`installation.md:37-45`) | **Still true** |
| HS-13 | Memory creates separate inference work (extraction/embedding/reranking/reflection); model paths differ. | TypeSafe/Jev reranker is now a documented, named provider option (`feat(reranker): TypeSafe provider (Jev)`, PR #4522, in the v0.10.1 changelog) rather than only "documented" in the abstract. | **Still true**, and the Jev integration point is now concretely in-release, not just planned. |
| HS-14 | Memory Defense is opt-in, pattern-based, not full sanitization. | Not independently re-read at the source-text level this pass (no material change found in the changelog); one v0.10.1 changelog entry does patch a false-positive in the credit-card redaction pattern, consistent with "pattern-based" being still accurate. | **Still true** |
| HS-15 | `temporal_window` is a scoring influence, not a strict filter. | Not independently re-read at the source-text level this pass; no changelog entry contradicts it, and one fix (`fix(recall): anchor the default temporal window on UTC, not the server clock`, PR #4356) is a bugfix to the same mechanism, implying the mechanism (an influence, not a hard filter) is unchanged. | **Still true, not independently re-derived — DERIVED from changelog, not re-read primary text** |
| HS-16 | Embedding-model/dimension migrations are semantic migrations; do not mix vector spaces even at matching dimension. | Not independently re-read this pass — no contradicting or confirming changelog entry found. | **Not re-verified — carry forward unchanged (UNKNOWN whether still current)** |
| HS-17 | `apply_all_directives=false` does not remove untagged global directives during reflect. | Not independently re-read this pass. | **Not re-verified — carry forward unchanged (UNKNOWN whether still current)** |
| HS-18 | No deployed service is verified by documentation/pin/offline tests alone. | Still true by construction — this ticket is itself only a documentation pin; `verify/RUNTIME-EVIDENCE.md` has zero Hindsight mentions, and `ARCHITECTURE.md:102` states Hindsight is "OBSERVED absent" from the product source tree (`git -rl hindsight src/` → 0 matches, per `lanes/K06-master-s32-35.md:311`). | **Still true, and re-confirmed by this ticket's own scope** |

Where this pass says "not re-verified," that reflects the ticket's 4-hour estimate against 18 observations plus 5 required identity fields plus 14 URL checks; HS-11/15/16/17 would each need a targeted source read (cancellation semantics, `temporal_window` scoring code, embedding-migration guide, `reflect` directive-scoping code) that this pass did not have budget for. They are not contradicted by anything found — they are simply unconfirmed at the source-code level, which is a materially different status than "still true," and is recorded as such rather than silently upgraded.

---

## 4. Delta note — STORE_DOCUMENT_TEXT, chunk/verbatim modes, tag-matching, replace semantics

**STORE_DOCUMENT_TEXT.** At the pin, `hindsight_api/config.py:1679`: `DEFAULT_STORE_DOCUMENT_TEXT = True  # Persist raw source text in documents.original_text / chunks.chunk_text`, and the versioned configuration doc is explicit: *"By default Hindsight keeps a verbatim copy of everything you retain... set `HINDSIGHT_API_STORE_DOCUMENT_TEXT=false`"* (`configuration.md:1914-1917`). This is hierarchical — overridable per bank via the config API, so one bank can opt out while others keep raw text (`configuration.md:1719`). Meanwhile `retain.mdx:31,75` (the retain guide, HS-R04) says content "is never stored verbatim" and that Hindsight "stores the resulting structured facts... not the original text" — this sentence is about what `retain` *extracts into memories*, not about the separate `documents.original_text`/`chunks.chunk_text` columns the configuration doc is talking about. Read together, both are accurate simultaneously and describe two different storage locations; a reader of only the retain guide would reasonably conclude no raw text is kept, and would be wrong. **Métis must set `HINDSIGHT_API_STORE_DOCUMENT_TEXT=false` explicitly** (or the per-bank equivalent) wherever raw meeting/note text must not be persisted a second time outside the canonical store — the shipped default does the opposite.

**Chunk/verbatim extraction modes.** `RETAIN_EXTRACTION_MODES = ("concise", "verbose", "custom", "verbatim", "chunks")` (`config.py:1620`); default is `"concise"` (`config.py:1619`). `"chunks"` mode is auto-forced when the retain LLM provider is `"none"` (`config.py:3965`) — i.e. a no-LLM deployment silently changes extraction behavior rather than failing. Chunks themselves ("the original text segments") are always stored alongside extracted facts regardless of extraction mode, per `documents.mdx:32-40` — chunk storage and `STORE_DOCUMENT_TEXT` are two separate mechanisms; disabling `STORE_DOCUMENT_TEXT` nulls `original_text`/empties `chunk_text` but the retain pipeline (chunking → extraction → embedding → entity-linking) is otherwise unaffected and recall quality does not degrade (`configuration.md:1920`).

**Tag matching.** Five modes exist at the pin: `any` (default, includes untagged), `any_strict`, `all`, `all_strict`, and `exact` (`recall.mdx:195-212`). `exact` is the one mode that is not simply "at least/all of these tags plus maybe more" — it requires the memory's *complete* tag set to equal the requested set, and excludes untagged memories. For every mode except `exact`, an omitted/`null`/empty tags list is treated as "no filter" (all tagged and untagged memories match) — this is the trap HS-07 already flagged, confirmed unchanged. **For a homogeneous, security-scoped bank (HS-08's ask), `tags_match: "exact"` with a non-empty tag list is the only mode that cannot silently widen to include untagged or partially-tagged memories; `all_strict` is not sufficient by itself if the memory can carry additional tags beyond the required set.**

**Replace semantics.** Re-retaining with the same `document_id` replaces the document's content (`documents.mdx:72`); there is no ETag/revision/If-Match concurrency control documented on that path. Métis's own revision/fencing layer (HS-10) is still required for out-of-order retries and concurrent-ACL-change safety — nothing upstream changed this. Tag replacement on the document resource has its own footgun worth carrying forward even though it wasn't in the original 18: `PATCH .../tags` **replaces** the whole tag array rather than merging (`documents.mdx:124`) — omitting the field is rejected with `422`, but sending an incomplete array silently drops tags.

**One packaging note found in passing, not in the original 18 or in the SOURCES.json register:** the OpenAPI copy vendored into `skills/hindsight-docs/references/openapi.json` still reads `"version": "0.10.0"` at the `v0.10.1` release commit (byte-identical to `hindsight-docs/static/openapi.json` except for that one field) — it lagged one release at the moment `v0.10.1` was cut. **Use `hindsight-docs/static/openapi.json` as the canonical schema source, not the skills-embedded copy**, if either is ever vendored into Métis's own repo.

---

## 5. Cross-check against `kit/v6/memory/HINDSIGHT-UPSTREAM-REQUIREMENTS.md`

That document (reviewed 2026-09-26, same day as this pin) states an identity was "not certified by this package" and lists the same primary reference pages as HS-R01/02/04/05/06 here (retain, recall, reflect, documents). Nothing in it is contradicted by this pin; it explicitly defers exact identity to "actual integration," which this ticket now supplies for HMSTEP-01's purposes. Its ten required implementation seams (current-identity scoping, canonical-data-first, real retained memory, bounded retrieval, grounded reflection, correction/forgetting, independent failure, one governed integration, operations/retention, no auto-ingestion shortcut) are unaffected by which exact release is pinned — they are integration-design requirements, not version-specific facts, and none of them are contradicted by anything observed in §3–§4.

---

## 6. Net effect on HMSTEP-01 / CRITIC-INV-14 / K09-R07

- **HMSTEP-01** (`kit/.../memory/steps/HMSTEP-01.md`): "Pin the actual Hindsight release image, SDK/OpenAPI and dependencies; register license/security findings" — the identity half of this step is now satisfied by §1 of this document (release, commit, both client SDKs, schema hash, both image digests, license). The step's other two clauses — "record the selected approved region and hosting, with no deployment claim" and the evidence bar ("actual source map, dependency diff, API compatibility fixtures") — are **not** in this ticket's `scope_paths` and remain open; they depend on Tony's hosting/region/Postgres decision (ARCHITECTURE.md D-5/ADR-014), which this ticket does not make.
- **CRITIC-INV-14 / K09-R07**: the blocking condition both cite — "certifies no identity" / "0 tracked Hindsight files" — is resolved for the *identity* half by this document. `0` tracked Hindsight files in the product repo (`metis-2.0`) is unchanged and expected: this ticket is documentation-only, no code was written.
- Nothing here unblocks HM/HMUC sequencing by itself — that also needs the hosting/region/Postgres decision and the actual client integration work, both out of scope for M2-0020.
