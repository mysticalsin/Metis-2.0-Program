# Métis-specific profile — mandatory before the general memory skill

**Product:** note-taker and meeting intelligence first; keyboard-summoned assistant,
JEV decisions, verified actions and governed memory add capabilities. These are
implementation requirements; no runtime has been connected by importing this skill.

## One existing memory path

The original r11 has `MetisMemoryGateway` in `memory/src/memory-gateway.mjs` and
`HindsightClient` in `memory/src/hindsight-client.mjs`, plus sixteen HMSTEP tasks.
These names identify the supplied candidate, not today's repository. Locate its actual
integrated equivalents. Keep one canonical-to-memory projection, one source registry,
one authority decision and one usage ledger.

The reusable skill supplies `MemoryClient` in Python and JavaScript and a Python
`build_evidence` reference. They have different constructor/method/return contracts
from r11. Do not exchange client objects or deploy all transports concurrently without
an explicit adapter and compatibility tests. Preserve the existing host's caller
cancellation, deadline, normalized errors and usage; the Python socket timeout is not
a wall-clock SLA, and the JS client has no external caller-signal parameter.

## Narrow data and identity policy

Only current, approved, non-confidential/non-local-only, eligible canonical snapshots
may be projected in the initial profile:
`approved_summary`, `approved_preference`, `verified_action_receipt`.
A reviewed lesson/decision is first represented in an approved canonical summary;
do not silently widen the gateway's accepted kind set.

Meeting recording consent is not permission for additional memory-provider processing.
Raw audio, partial or whole raw transcripts, screenshots, credentials, unexecuted plans,
and unreviewed model output are excluded. The general voice recipe's reviewed-turn
option does not override this narrower rule. Valid note-taking can continue even when
memory consent is absent. Canonical notes use their existing retention/sync policy.

Reuse actual verified Entra/host identity. Stable tenant/principal IDs and current
project/purpose/agent context resolve a server-owned binding. Emails, display names,
model tags and a shared service key do not establish per-user rights. Agent renaming
cannot change ownership. Sharing a private lesson with a team is a separate publishing
operation. Direct list/export/document/chunk/operation/MCP/admin paths need the same
boundary as recall. Never return raw bank IDs or keys as client-side authority.

## Lifecycle and retrieval

Authorize before any memory inference and again before releasing evidence. Keep scope
homogeneous before derivation; do not send a mixed-ACL bank to reflect and filter only
the result. Revalidate source IDs/revisions/tombstones and complete dependency lineage.
Use facts-only, nonempty server-owned strict tags initially. Empty strict filters do
not establish isolation. No global-bank fallback.

Recall only when the request benefits. A proposed initial envelope is at most eight
items from at most 32 examined candidates, 12,000 serialized UTF-8 bytes, and one
low-budget recall per relevant turn; these are application policy targets, not native
Hindsight config. Enforce the receiving model's token budget with its real tokenizer
when a token-bound claim is made. Provider `max_tokens` does not bound metadata or the
whole evidence envelope; current docs even permit an oversized first fact. Do not
confuse the reference 8,000-character query bound with the live provider token limit.

Canonical approval/commit precedes projection. Queue opaque source ID/revision,
authorization epoch and operation ID, not private excerpts in operational queues.
Load/minimize content at execution. Default to replace; append is not approved for this
profile. Serialize updates per document with real revision/epoch fencing. Same document
ID is grouping/replacement, not proof of exactly-once billing or concurrent-write safety.
An ambiguous write blocks unsafe reuse until reconciled; no blind resend.

“Accepted,” “indexing,” “searchable,” and “available in this answer” are different states.
A source correction supersedes the old read path immediately while reindexing completes.
Forget commits an immediate read tombstone and schedules exact projection/derivative
purge. It never implicitly erases the meeting. Include raw stored content/chunks,
facts, observations, mental models/pages, pending jobs, caches, exports and restored
copies in the purge inventory. No stale flag or single DELETE proves total erasure.

Native reflect, observations, mental models, pages, refresh schedules and model/provider
batch work stay off until their original HMSTEP-10 gates and cost/retention approvals
pass. Suppressing them forever is not completion of the full upgrade.

## Note-taking, keyboard and JEV coexistence

Show/hide, command Stop and “stop speaking” are not memory lifecycle events. A relevant
private question can read current authorized meeting context without retaining it.
Default to text in calls; apply the existing output-audience rule to recalled preferences
and generated speech. An unavailable memory service must not create a capture gap.

JEV selects typed decisions from currently eligible evidence. Its confidence does not
approve a retain, turn an inference into a fact, or revive action approval. Hindsight
provider credentials/qualification are separate from JEV, even when a deployment uses
a reviewed JEV reranker. Laya-only decision routing does not silently authorize JEV
reranking or another external memory inference route. Do not map one setting to both.

## Reference assets that must not be activated automatically

- `templates/compose.local.yaml` and `.env.example`: local teaching examples, not
  production Métis topology or employee configuration. No desktop database deployment.
- `scripts/live_smoke.py`: explicit synthetic write/update/delete workload in a disposable
  bank, with possible provider costs. Never run it from an app startup or test-all command.
  Its source-text readback assumption must match the approved test deployment; do not
  enable content persistence in production just to make the smoke pass.
- Framework/MCP/coding recipes: consult only for an existing relevant integration.
  No automatic conversation hooks, wildcard bank tools, global memory or request-time installs.
- General reflect/append/deployment settings: version-specific options requiring actual
  `/version`, OpenAPI, configuration and behavior qualification, not text-file approval.

No secret or endpoint is preset here. Missing deployment/retention approval is a named
external gate, not an excuse to disable note-taking or claim memory is live.
