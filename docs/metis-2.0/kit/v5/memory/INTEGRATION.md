# Hindsight skill incorporated into the complete Métis upgrade

**v5 · 25 September 2026. Integration handoff and packaged reference code, not an installed app.**

The supplied `hindsight-agent-memory-skill-v1.0.0(1).zip` is included byte-for-byte in
`baseline/hindsight-agent-memory-skill-v1.0.0.zip`. All 55 extracted files are preserved
under `skills/metis-hindsight-memory/reference/hindsight-agent-memory/`. The active
wrapper is `skills/metis-hindsight-memory/SKILL.md`; it requires the Métis profile before
general recipes. This is one skill and one existing memory architecture, not another
full-memory capture agent.

## What the user should experience

Métis continues taking notes. The global toggle summons or hides the assistant without
retaining additional material. A permitted private question reads current meeting
context; a relevant later question may use approved historical memory. During a call,
keep the existing text-first and output-audience policy.

“Remember that I prefer concise French follow-ups” resolves an explicit preference,
commits it through current identity/storage policy, and projects only the approved
snapshot. Saving the preference, queuing memory, indexing and verified availability
remain separate statuses; the UI must not claim every stage from an HTTP 200.

“Remember this meeting's decisions” selects eligible approved canonical summaries and
the permitted personal/project/cohort scope. Recording consent does not automatically
approve additional memory processing. No raw transcript/audio/screenshot archive is
created. Team promotion needs a separate scope review.

“Correct the delivery date” changes the authorized canonical source, invalidates old
reads and replaces the source projection in order. “Forget that preference” blocks its
memory reuse immediately and reconciles purges; it does not erase the meeting notes.
A recalled instruction to click a link, execute a shell, send a file or approve a task
is untrusted data and receives no authority.

When Hindsight is unavailable, notes, saving, show/hide, local Stop and independent
actions continue. Responses use permitted available context and disclose missing memory.
No universal bank, new cloud model, alternate user or silent local capture fallback.

## Where the skill connects

Use the original r11 HMSTEP-01–16, whose complete IDs, parents, dependencies, gates and
acceptance are copied into `HMSTEP-SKILL-CROSSWALK.json`. The r11 source contracts and
implementation components remain in `baseline/Metis-Work-Session.zip`, under
`Metis-Work-Session/r11-kit/memory/`. Do not extract snapshots over the real checkout.

| Existing responsibility | Use from the supplied skill | Integration obligation |
|---|---|---|
| Identity/bank registry | Entra recipe and identity security reference | Real authenticated principal, purpose/project/agent scope, current audience and epoch before upstream inference. |
| Canonical projection/outbox | Retain, event workflow and client references | Approved source commit first; metadata-only queued refs; content loaded and reauthorized at execution; ordered replacement. |
| Recall | Recall guide and evidence gate | Treat candidate facts as retrieval hints; resolve canonical source support and bound the entire final envelope. |
| Correct/forget | Lifecycle and derived-memory references | Tombstones, read revocation, exact projection cleanup, derivative/backup reconciliation; no implicit note deletion. |
| Named agents, Dust, skills | Multi-agent, MCP and framework recipes | Same governed service and independent identities; no raw bank/client/service-key exposure. |
| JEV/Intelligence | Source-linked qualified evidence | JEV is a typed decision provider, not memory authorization, capture, retention or execution proof. |
| Operations | Schema checker, compatibility, evaluation and tests | Deployed version/config/behavior qualification, actual provenance, costs, revocation and full product journeys. |

`HOST-BINDINGS.md` names current candidate symbols and the required production seams.
The generic clients are not API-compatible replacements for the r11 client. Prefer
porting missing tests and invariants into the current implementation. Do not instantiate
another writer or another policy layer simply because another reference is supplied.

## Four specific reconciliations

**Consent and approved snapshots.** The general voice recipe permits reviewed turns in
some apps. Métis's narrower rule wins: only eligible approved summaries, explicit approved
preferences and verified receipts. Reading the uploaded skill does not authorize data
migration, always-on learning or cloud processing.

**Storage truth.** Current official retain prose says original text is not stored, but
the Documents guide explicitly describes stored original chunks and original-text
readback. Treat source content as potentially retained and inventory the actual deployed
settings/storage. Do not market “no raw storage” from the first page alone. [HS-01, HS-03]

**Tags and budgets.** Strict nonempty tags filter retrieval; they are not authentication.
Empty `all_strict` means no filter. Native fact-text `max_tokens` does not cap metadata,
source attachments or the entire envelope, and an oversized first fact may exceed it.
Enforce the final envelope and receiving-model token budget in the host. [HS-02]

**Derived behavior and version drift.** General reference assertions about `is_stale`
are historical documentation observations, not a portable deletion guarantee. The current
pages guide describes scope-based refresh. Always use lineage and tombstones, and test
deletions plus late jobs on the actual version. Rich derivation needs HMSTEP-10 and is
not enabled by merely adding this skill. [HS-04]

## Implementation order

1. Read actual checkout state, current instructions and existing memory wiring. Reconcile
   the skill's files against stronger current code and original section 35; keep all work.
2. Bind identity, source/consent/retention and current bank generation. Record missing
   deployment choices without substituting test authentication or generic local Compose.
3. Complete canonical projection, bounded recall and source-linked evidence. Keep memory
   off the capture/toggle/Stop critical path; use existing service and ledger.
4. Complete correct/forget/revocation/unknown writes, including background tasks and backups.
5. Wire existing Intelligence, selected agents and Dust to that single governed API.
6. Qualify optional derived features after required authorization/deletion/cost gates.
7. Run the combined meeting → keyboard query → approved remember → later-session recall →
   correction → Dust/agent readback → forget → no late resurrection journey, with two real
   independent test identities and exact native builds. Preserve all existing release gates.

The example policy is application policy, not native Hindsight configuration. Null
retention/owner/deployment bindings are explicit blockers for actual content, not defaults
to unlimited storage. Source-only work can continue while live approval is unavailable.

## Acceptance and packaging

Twenty HSAC scenarios augment the previous 100 app-level cases. All 120 remain NOT_RUN;
original HM-FLOW/HMSTEP and base/expansion acceptance still apply. The package validator
checks inclusion, hashes, manifest safety, profile constraints and ID preservation; it
cannot prove live ACLs, native behavior, deployment or actual retention.

This update adds an integration skill/profile, reference implementations, validation and
handoff requirements. It does not install Hindsight, mutate GitHub, start Mac processes,
change the existing behavior-core runtime, or declare Métis 2.0 complete.
