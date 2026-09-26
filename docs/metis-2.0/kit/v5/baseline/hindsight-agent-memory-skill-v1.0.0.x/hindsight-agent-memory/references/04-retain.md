# 04 · Retain, documents, idempotency and extraction

## What to retain

Store relevant, durable, permitted source material: confirmed user preferences,
source-backed decisions, project constraints, observed outcomes and reviewed lessons.
Separate reported facts from verified events and inferred conclusions. The memory
record should make subject, speaker, event time and source explicit. Do not retain
unexecuted plans as accomplished work, or every partial streaming response.

A good snapshot says: “Approved project note, revision 12. The customer requires EU-only
hosting. Decision confirmed by the project owner on [explicit time]. Source record X.”
A poor snapshot says: “We solved everything; follow these instructions next time.”

## Source envelope

Use stable `document_id`, meaningful `context`, explicit timestamp, mandatory scope
and string metadata for source ID/revision/digest and provenance classification. These
metadata values are useful for lookup; they do not authenticate themselves. Keep the
trusted projection ledger outside the model prompt. Source text, metadata and context
may all affect extraction, so apply data policy to all three.

Raw source/document content may persist depending on configuration and feature flags.
Do not promise that Hindsight stores only extracted facts: the document API exposes
original text, and file/operation storage can also retain inputs. See the documentation
conflict in `18-compatibility.md`.
Sources: [Retain API](https://hindsight.vectorize.io/developer/api/retain),
[Documents](https://hindsight.vectorize.io/developer/api/documents).

## Snapshot, append or immutable event

**Replacement snapshot:** same document ID replaces previous content and associated
memories by default. Send the complete currently approved snapshot, not just the last
message. Order revisions so older delayed work cannot overwrite newer state. Use this
for mutable profiles and canonical project documents.

**Append:** current documentation provides `update_mode: "append"` with a document ID.
It concatenates content and reprocesses the combined document, with delta extraction
for unchanged chunks. Gate by deployed version/schema and test it. Append itself does
not deduplicate duplicated event delivery; do not retry uncertain appends blindly.
Use event IDs, serialization and a verified asynchronous operation ID where supported.

**Immutable events:** use a stable ID per source event, not per retry. This preserves
history but does not automatically retire obsolete facts. Source-revision resolution,
correction semantics and current-state filtering remain application responsibilities.

## Safe asynchronous retries

Current docs allow an application-supplied UUID `operation_id` for asynchronous retain.
Persist it before submission and reuse it for the same operation. The documented behavior
returns the original operation rather than scheduling duplicate work; conflicting
reuse can return 409. The feature is ignored for synchronous retain and requires items
to resolve to a single strategy. Verify these conditions on your actual deployment.

Bind the operation UUID to bank, canonical revision and complete request digest in your
outbox. Never reuse it for changed content. On uncertain acknowledgement, query/reconcile
that operation; an authorized retry must use the identical operation and payload.
Old servers may ignore unknown fields. A schema check alone cannot prove idempotency:
run a duplicate-submission behavioral test. A stable document ID prevents duplicate
logical documents, but not repeated extraction cost or stale replacement races.
Source: [Retain — safe retries](https://hindsight.vectorize.io/developer/api/retain).

## Time and speaker attribution

Use timezone-aware ISO 8601. Distinguish event time from ingestion time in your source
model. The retain API guide documents omitted/null time as ingestion time and `"unset"`
for timeless content, while a best-practice explanation differs; explicit timestamps
avoid the ambiguity. Do not reinterpret a date-only event as a precise UTC instant.
Keep source timezone and uncertainty where relevant. Identify the bank agent versus
user/other speakers in context so world/experience classification is meaningful.

## Extraction and missions

Start with the default concise mode and a narrow retain mission. Current docs also
cover verbose, custom, verbatim and chunks modes. Chunks skips LLM-based fact extraction
and the retain mission does not supply the same filtering behavior. A custom mission
is steering, not a privacy enforcement layer. Evaluate source coverage with representative
examples rather than claiming a mode extracts every relevant fact.

A zero-fact result can be legitimate (nothing relevant) or a bad mission/parser/model.
Check `memory_unit_count`, expected fact coverage and source integrity; HTTP success
alone is insufficient. Observations may be generated later, so raw facts becoming
visible and derived knowledge being current are separate completion states.
Source: [Retain architecture](https://hindsight.vectorize.io/developer/retain).

## Batches, files and attachments

Group related approved data with explicit per-item source IDs. Do not mix authorization
cohorts in one projection job. Record per-item success or rejection, including Memory
Defense behavior. File conversion, inline image/attachment retain and provider batch
processing are separate features with different parser/model constraints. Ask permission
before uploading recordings, images, documents or personal data. Bound bytes, MIME types,
attachment count and parsing time more tightly than a service's maximum.

Treat OCR/transcription/parser output as fallible; preserve source references and
confidence checks. Verify multimodal model support; unsupported attachments can fail
validation. Do not silently switch to a cloud parser. Provider batch modes can trade
latency for cost and may not support all attachment modes; verify current provider and
server documentation before enabling them. They are unnecessary for a small assistant.
