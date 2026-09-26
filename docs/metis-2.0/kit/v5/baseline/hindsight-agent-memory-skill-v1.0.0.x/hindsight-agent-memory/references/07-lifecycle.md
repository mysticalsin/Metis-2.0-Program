# 07 · Correction, deletion, consent and evidence lifecycle

## State distinctions

A source can be current, superseded, revoked, expired, invalidated or deleted. These
are not interchangeable. Historical relevance does not mean present authority.
Define the lifecycle in the canonical application and project its permitted portions
into memory. A soft invalidation can preserve audit history; it is not physical erasure.

Current memory curation APIs can change supported fact state, while observations are
derived. Consult the deployed schema and document behavior rather than editing
internal database tables. Source: [Memories API](https://hindsight.vectorize.io/developer/api/memories).

## Correction protocol

Commit a new canonical revision first. Block the previous revision at the evidence
resolver, enqueue an ordered document update and invalidate affected caches and derived
models/pages. Verify new fact coverage and that superseded content is not used as
current truth. Retain history only where policy permits, with temporal qualification.
A source saying “Alice changed teams” may need both historical and current representations;
do not indiscriminately delete legitimate history to improve a current-state answer.

Document tag updates replace the complete tag set; read-modify-write intentionally.
An empty list clears tags. Changing tags is not sufficient to prove that all previously
derived summaries are now correctly scoped. Revalidate/rebuild those separately.
Source: [Documents](https://hindsight.vectorize.io/developer/api/documents).

## Forget / revoke protocol

1. Authenticate the request and determine authorized deletion scope. Enumerate known
   source and projection IDs from the trusted application mapping, not an LLM guess.
2. Commit a tombstone or grant revocation before the async purge. Stop new capture and
   prevent retrieval immediately. Check already queued writes so they cannot resurrect data.
3. Delete affected documents/memories using supported APIs and verify outcomes. Bound
   every batch. An accepted asynchronous job is not proof of completed deletion.
4. Invalidate or rebuild dependent observations, mental models, knowledge pages and
   application caches. Quarantine derived artifacts while provenance is uncertain.
5. Apply the applicable policy to original files, operation payloads, traces, replicas,
   exports, backups and provider-side data. State what was deleted, retained or pending.
6. Run a fresh-session negative recall and derived-answer test, plus a restore/replay
   anti-resurrection test. Record evidence without logging erased content itself.

Do not claim universal “right to be forgotten” compliance from one DELETE response.
Retention duties, legal holds and jurisdiction-specific obligations require the
organization's approved policy. This is an engineering lifecycle, not legal advice.

## Backup and restore

A backup can contain content legitimately removed from live memory later. Keep an
authoritative tombstone ledger outside snapshots that might be restored, and apply it
before restored data serves traffic. Disable or inspect imported webhooks so a restore
does not notify an old endpoint with sensitive content. See migration and admin guidance.

## Graceful memory-off

A user disable request should stop new retention immediately. Decide explicitly whether
previous memory remains stored, becomes inaccessible or is scheduled for deletion.
“Disabled” must not silently keep sending data through an automatic integration hook.
If a service is down, memory reads may be unavailable; canonical consent/tombstones
must still govern later queue replay. Fail closed when source authorization cannot be
revalidated; do not label unauthorized evidence as a harmless stale cache hit.

## Evidence envelope

Keep a small source-linked record with source ID, revision, excerpt, provenance type,
observed time and retrieval purpose. Do not carry entire raw logs by default. For each
candidate, the evidence resolver must check the current principal's grant and current
revision in trusted storage. `scripts/evidence_gate.py` intentionally obtains displayed
text from the canonical resolver rather than trusting a model-extracted metadata claim.
That is a reference pattern; it cannot implement an unknown application's ACL by itself.

Native deletion behavior and generated knowledge limitations:
[Documents](https://hindsight.vectorize.io/developer/api/documents),
[Knowledge pages](https://hindsight.vectorize.io/developer/api/knowledge-pages),
[Operations](https://hindsight.vectorize.io/developer/api/operations).
