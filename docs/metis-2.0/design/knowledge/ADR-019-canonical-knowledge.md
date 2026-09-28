# ADR-019: canonical knowledge, provenance and storage authority

| Field | Value |
|---|---|
| Ticket | M2-0120 (TASK-007). Kit refs: M2-KNOW-02, M2-KNOW-04, M2-GOV-02, EXP-11, R58. Finding: K03-DEC-knowledge-model |
| Status | **ACCEPTED for the store (D-6 answered 2026-09-27); the mirror audience is still PROPOSED.** Owner decision **D-6** was answered as the recommended default, "M365 via Entra API" (OBSERVED: `docs/metis-2.0/DECISIONS.md:114`, status column). So the canonical store is option B and the always-on service path in §2.2 is the approved path. The engineering decisions (§3 to §9) are unchanged. The register records no separate answer for the mirror audience, so M1 (§9.2) stays the recommended default and is ASSUMED until the owner confirms it (O-1). Nothing is migrated yet, and no content leaves the device until M2-0125 and M2-0126 land. Reviewed matrix: `DATA-AUTHORITY-MATRIX.md` (M2-0265). |
| Contract | `src/shared/contracts/knowledge/` in the public repository, PR #217 (`m2/M2-0120-knowledge-contracts`, base `m2/integration`) |
| Baseline | `m2/integration` at `7dab8e89`, read with `git show`. D-28 applies: nothing was run on a Mac except `tsc --noEmit`. |
| Companions | ARCHITECTURE.md §2.7 C11 (component admission register), §2.5 (Mantu Intelligence row), §5 ADR-019 row; `designs/M2-0003-DESIGN.md` (decryption as ownership proof); kit MASTER §17 and §35 |

**Labels** follow ARCHITECTURE.md line 12. OBSERVED means read in code or on disk. PROVIDED means stated by an input document. DERIVED means reasoned from OBSERVED facts. ASSUMED means believed but not verified, with a named verification step. PROPOSED means a design choice made here. UNKNOWN means the evidence is missing. Code citations are `path:line` at `7dab8e89`. `MASTER:n` is `kit/r11/spec/MASTER.md` line n in this repository, and `MEM:n` is `kit/r11/memory/INTEGRATION-CONTRACT.md` line n.

---

## 0. The decision in brief

1. **One logical owner per knowledge space (PROPOSED, MASTER:1544).** At any moment a space's canonical records live in exactly one place. Every other copy is a projection or a cache.
2. **Store (owner, D-6).** The recommended answer is an Entra-protected knowledge API over an approved Microsoft 365 location (MASTER §17.3 state (a)). This is also the default already recorded in DECISIONS.md D-6. The current `.brain` stays the honest **device-only mode**, and a service database is not canonical unless the owner approves it explicitly (§2).
3. **Extend or rebuild (engineering, decided here).** The §17.4 record model is a new contract (`src/shared/contracts/knowledge/`). `brain/store.ts` and `brain/corrections.ts` are **not** extended into the canonical store. They stay the device-side producer and the device-only store, and their proven rules become requirements on the service. A total, one-way mapping takes legacy data to canonical records (§3, §11).
4. **Ten provenance states** with invariants enforced by the contract, plus a transition table (§4).
5. **Revisions and ETags**: a per-record `revision` for content and a separate ACL `epoch`. The HTTP ETag is the revision, and the backing store's own precondition enforces compare-and-swap (§5).
6. **ACLs** name explicit principals only. Identity comes from the validated token, never from a request (§6).
7. **Conflicts**: write conflicts are refused with the current revision, and evidence conflicts stay visible as DISPUTED until a person resolves them (§7).
8. **Deletion**: permanent tombstones block reads at once and refuse any resurrection. Field-level DELETED claims keep no content (§8).
9. **Plaintext mirror**: it is a projection with exactly one declared audience. It only contains what every member of that audience may read. Team access goes through the governed read tools, not a second plaintext copy (§9).

---

## 1. Facts this rests on

| # | Fact | Label | Source |
|---|---|---|---|
| F1 | The brain is a set of JSON files under `<meetings folder>/.brain/`, next to the transcripts. OneDrive syncs it, and it uses the same at-rest encryption setting as the transcripts. | OBSERVED | `src/main/brain/store.ts:27-38`; ARCHITECTURE.md:87 |
| F2 | The at-rest key is device-local: a v2 envelope wraps each file's content key for the local keychain (`kLocal`). An org escrow wrap (`kEscrow`) is written only when an escrow public key is configured, and the app never reads it. | OBSERVED | `src/main/transcripts.ts:28-34, 44-45` |
| F3 | An entity's id is the slug of its first display name and never changes. Meetings are referenced by transcript file basename. | OBSERVED | `src/shared/brain.ts:246-251, 384-386`; `store.ts:51` |
| F4 | No brain schema has a tenant, space, audience/ACL or sensitivity field. | OBSERVED | `src/shared/brain.ts:382-532` (every entity, graph and index schema read) |
| F5 | The only revision is one global counter on the index, used for dashboard polling. No record has its own revision. | OBSERVED | `src/shared/brain.ts:521-522` |
| F6 | Mutual exclusion is an in-process promise chain, so there is no compare-and-swap across processes or devices. When two devices fork `corrections.json`, OneDrive creates conflict copies, which are unioned in timestamp order and re-sequenced. | OBSERVED | `store.ts:283-293`; `corrections.ts:233-295` |
| F7 | Legacy provenance has a state (`extracted`, `verified`, `edited`, `pinned`), a separate graphify confidence tag (`EXTRACTED`, `INFERRED`, `AMBIGUOUS`), and a `superseded` history capped at 10. | OBSERVED | `src/shared/brain.ts:22, 272, 281-297` |
| F8 | `verified` is stamped by a **machine** quote-grounding check on deal amount and close date, not by a person. Yet the record page chip says "verified", and the money-card and wiki comments describe it as human verification. | OBSERVED | `src/main/brain/ingest.ts:537-559, 1012-1041`; `src/renderer/src/components/BrainRecordPage.tsx:50, 61`; `src/main/brain/publish.ts:28` |
| F9 | Production code never writes `edited`; it only compares against it. | OBSERVED | `git grep "'edited'" 7dab8e89 -- src intelligence/src`: comparisons only |
| F10 | The correction engine is sound. Each mutation has one implementation, and replay reproduces the live state. The journal entry is the commit point. A human pin beats any later extraction. A merge leaves a `{merged_into}` tombstone. | OBSERVED | `corrections.ts:50-65, 474-539, 964-987, 1444-1463`; `ingest.ts:753-764` |
| F11 | "Contradicted pin" is derived at read time from `superseded` entries dated after the pin. There is no stored dispute state. | OBSERVED | `src/main/brain/attention.ts:53-66` |
| F12 | The wiki mirror is written in plaintext whatever the encryption setting, under `<meetings folder>/wiki/`. It is gated by `publishBrainPages` (schema default off; the first-run default follows `!encryptTranscripts`). Turning it on while encryption is on needs a consent dialog, and turning it off deletes the mirror. Confidential and unreadable meetings are excluded (fail closed). | OBSERVED | `publish.ts:22-39, 75-80, 216-253`; `src/shared/ipc.ts:1028-1036`; `src/main/index.ts:4888-4910, 5044-5048` |
| F13 | Dust reads the mirror through its OneDrive connector, scoped to `wiki/`. That end-to-end checklist is still unchecked, so it is not executed evidence. | OBSERVED / PROVIDED | `docs/verification/mi-5-dust-e2e.md:21`; SRC-23 (MASTER:4272) |
| F14 | No knowledge service, no `knowledge.*` tool and no ACL-aware retrieval exists. | OBSERVED (by lane) | `lanes/K03-master-s15-20.md` K03-17.3-01, K03-17.7-01; ARCHITECTURE.md:102 |
| F15 | Foreign processes that failed to decrypt the synced index quarantined it 180 times. M2-0003 therefore treats decryption as the ownership proof: bytes this device cannot decode are read-only here. | OBSERVED | `verify/RUNTIME-EVIDENCE.md`; `designs/M2-0003-DESIGN.md` §0-1 |
| F16 | The kit requires one logical record owner and no second canonical database (§17.1), state (a) or (b) (§17.3), the record fields and ten states (§17.4), and compare-and-swap in the actual backing store (§17.8), where a stale `If-Match` produces a conflict rather than an overwrite. R58 cites If-Match/ETag conflict semantics for the Graph list-item update API; the kit does not state the status code. | PROVIDED | MASTER:1544, 1570, 1576-1584, 1632, 3481-3485 |
| F17 | Legacy `pinned` means "a person entered this value". Every human field edit writes it, and so does accepting a dashboard suggestion, which re-pins the extracted value unchanged. A pin keeps neither its source nor its quote (`source_file: ''`). The record page shows it as "edited by you", and the user can edit it again at any time: nothing asks for approval. | OBSERVED | `corrections.ts:1250-1268, 1438-1463`; `src/main/index.ts:8181-8192, 8209-8238`; `BrainRecordPage.tsx:40, 49` |

---

## 2. Canonical store (owner decision D-6)

### 2.1 Options

| Option | What it means | Always-on (M2-KNOW-04) | Compare-and-swap (§17.8) | Keys and privacy | Verdict |
|---|---|---|---|---|---|
| **A. `.brain` on the user's OneDrive** (today) | Canonical records stay device-written files | **No.** State (b) at best: a sleeping laptop serves nothing, and a service cannot read device-key envelopes without a key upload (F2, MASTER:1570) | **No.** Process-local lock and union merge of conflict copies (F6) | Keys stay on the device | Honest only as device-only mode |
| **A′. A, but a server decrypts `.brain` with the org escrow key** | The service reads the OneDrive files | Yes | No (same files as A) | Turns a break-glass recovery key into an online serving key; escrow is off unless configured (F2) | Rejected |
| **B. Approved M365 location behind the knowledge API** (recommended) | Canonical records are items in a team-owned SharePoint site approved for knowledge. The Entra-protected knowledge API (C11) reaches them with a Sites.Selected grant (R57). | **Yes**, state (a) | **Yes** for list items: a stale `If-Match` is refused as a conflict (R58, PROVIDED). The exact response (412 Precondition Failed) is ASSUMED until M2-0125 qualifies it (O-2). Other Graph content APIs stay UNKNOWN until qualified. | Content stays inside the tenant's existing M365 boundary. No device key leaves the device. Migration is an explicit per-space action by the owning device. | **Recommended** |
| **C. Service database** (the managed Postgres of D-5) | Canonical records live in the service database | Yes | Yes, with transactions and an atomic outbox (MASTER §17.12) | Adds a new processor and location for knowledge content (DPIA scope, M2-0150) and duplicates M365 as a second content home | Rejected unless the owner approves that data location explicitly. §17.1, §17.3 and ARCHITECTURE.md:403 forbid a second canonical database created only for convenience. |

### 2.2 Answer (D-6 answered 2026-09-27: option B)

**D-6 record (OBSERVED, `docs/metis-2.0/DECISIONS.md:114`).** Question: the canonical knowledge store (TASK-007) and the plaintext-mirror sharing boundary. Recommended default: an Entra-protected knowledge API over an approved M365 location (MASTER section 17.3 state (a)). Status: `ANSWERED_AS_DEFAULT 2026-09-27 (owner: "M365 via Entra API")`. The register row is the only source; the owner's original message is not in this repository (UNKNOWN). D-5 was answered separately on 2026-09-28 (OD-17, `DECISIONS.md:33`): self-hosted private Hindsight on one approved container platform with managed Postgres. The container platform choice still follows (`DECISIONS.md:113`), so the knowledge API host is not yet named (UNKNOWN).

**Consequences of the answer (DERIVED).** Canonical records are list items in an approved M365 site, and the service database is not canonical (option C stays rejected). The always-on service path below is the approved path for M2-KNOW-04. The plaintext-mirror audience is not part of the recorded answer: the register text names only the store, so M1 remains ASSUMED (O-1). The Graph adapter is still BLOCKED_EXTERNAL on Entra admin consent and on approval of the site and the Sites.Selected grant (M2-0125).

- **Canonical store: B (answered).** Engineering proceeds behind the contract. M2-0125 builds the knowledge API with a store port and two adapters: a local adapter for the compose profile (tests and CI only), and the Graph list-item adapter, which stays BLOCKED on Entra admin consent plus approval of the site and the Sites.Selected grant. The contract is store-agnostic, so answer C would change the adapter only.
- **Approved always-on service path (approved by D-6; the diagram detail is PROPOSED design):**

```text
Dust (remote MCP, personal OAuth) ─┐
Teams tab / bot (Entra SSO)        ├─> Operator Worker: auth hand-off, rate limits, metadata ledger only
Desktop knowledge client (Entra)   ─┘      (no knowledge content in logs, D1, KV, R2 or queues: MASTER §16.6)
                                             │
                                             v
            Knowledge API (C11): Entra-validated, tenant and principal scoped, on the D-5 container platform
                                             │  Microsoft Graph, Sites.Selected on one approved site (R57)
                                             v
            Canonical records: list items in the approved team site; every write carries If-Match (R58)
                                             │  revision delta / outbox (metadata only)
                                             v
            Projections: governed read tools, service graph and search, Hindsight (derived, D-5),
                         optional plaintext mirror (§9)
```

- **What stays on the device:** transcripts and recordings (source evidence), the ingest ledger, the meetings index and the journal (C3, C5). In device-only mode the `.brain` stays there too.
- **Migration (PROPOSED):** per space, started by the user, and never automatic (HM-15). Only the device that can decrypt the space's `.brain` may export it; decryption is the ownership proof (F15, M2-0003 INV-1/INV-2). The device maps legacy data with §11 and uploads records over TLS under the user's Entra token. No key material leaves. Once the service confirms the import, that space's authority moves to the service, and the device's `.brain` for that space becomes a read cache. One logical owner holds at every moment (§0.1).
- **Not chosen (kept for the record). Had D-6 answered A:** knowledge is device-only. Dust reads only the personal mirror (§9), Teams has no knowledge, and M2-KNOW-04 is recorded BLOCKED_EXTERNAL or DEFERRED under D-14. The contract still governs the device-side export shape.
- **Not chosen. Had D-6 answered C:** the approval must name the data location, retention and processors (DPIA, M2-0150). The contract does not change.
- **Remaining external steps (BLOCKED_EXTERNAL, M2-0125):** Entra admin consent, approval of the knowledge site, and the Sites.Selected grant. Read-only check for the owner: in the Entra admin centre, confirm whether the knowledge API app registration has admin consent for `Sites.Selected`, and which site the grant names. Also confirm the mirror audience (M1, M2 or M3, §9.2), because D-6's recorded answer names only the store.

---

## 3. Extend `corrections.ts` / `store.ts`, or build fresh? (engineering decision)

**Decision (PROPOSED, decided by this ticket).** The §17.4 record model is defined fresh, as the contract `src/shared/contracts/knowledge/`. The legacy brain modules are not grown into the canonical store. They remain the device-side producer (extraction and local corrections) and the device-only store. Every rule they prove is carried into the service as a requirement (table below). Legacy data reaches the canonical store only through the total mapping in §11.

**Why (DERIVED from §1):**

1. The legacy store cannot give compare-and-swap. Its lock is process-local, and a cross-device fork is resolved by union merge (F6). §17.8 requires the backing store's own precondition (F16), so extending the files would turn a synced folder into a multi-writer database without CAS.
2. Its identities are the wrong kind: display-name slugs and file basenames (F3), where §17.4 and §17.9 require stable, tenant- and space-qualified ids and source ids rather than filenames.
3. It has no tenant, space, ACL or sensitivity (F4), and no per-record revision (F5). All of them would be new fields on every file and every reader.
4. It is unreadable off-device by design (F2), and §17.3 forbids a key upload.
5. Its provenance vocabulary does not map onto the ten states without loss (F7). Legacy `verified` is a machine check (F8), so treating it as HUMAN-VERIFIED would inflate evidence. Legacy `pinned` is an ordinary edit, not a lock (F17), and `edited` is never written (F9).
6. The blast radius is wrong. Both modules read `.brain` synchronously and sit on the freeze-fix path: M2-0031 moves every `.brain` reader reachable from timers and IPC behind the storage gateway, and M2-0205 moves the ingest ledger out of `store.ts` (ARCHITECTURE.md:294, 304-307). Widening `corrections.ts` (1,629 lines) and `store.ts` (789 lines) now would collide with the 1.9.7 work (DERIVED).

**Why this is not a parallel state machine (MASTER:1580).** Each space has one authority (§0.1), so the same data never runs under two state machines. In device-only mode the legacy vocabulary governs, and in connected mode the canonical one does. §11 maps every legacy value to exactly one canonical meaning, so no legacy state is contradicted.

**Legacy rules that carry over as service requirements:**

| Legacy rule (OBSERVED) | Canonical requirement | Owner |
|---|---|---|
| One implementation per mutation, replay converges (`corrections.ts:50-65`) | Each mutation operation has one service implementation, used both for live commits and for rebuilding projections | M2-0125 |
| Journal-first commit (`corrections.ts:1444-1463`) | The canonical write (with its precondition) is the commit point, and projections follow from it | M2-0125, M2-0132 |
| Human beats machine (`ingest.ts:753-764`; `corrections.ts:964-987`) | Machine evidence never replaces a human-state claim; a contradicting one becomes a dispute (§4.2) | M2-0125 |
| Winner order: `EXTRACTED` confidence before any other, then the newer date, then the source file name (`store.ts:151-160`) | The same ranking (EXTRACTED before INFERRED, then newer `observedAt`) decides supersession between origin claims, except that an exact tie in rank and date becomes DISPUTED instead of being broken by source name (§4.2) | M2-0125 |
| Consequential-field render gate (`brain.ts:279`) | A consequential field (amount, date, owner, commitment) renders as a figure only when HUMAN-VERIFIED, PINNED or EDITED, or as EXTRACTED labelled "stated, not confirmed" (§4.3) | M2-0126, M2-0130 |
| Confidential and unreadable meetings fail closed (`publish.ts:216-253`) | `sensitivity: confidential` is excluded from team publication and prompts unless explicitly authorized; unreadable means excluded | M2-0126, M2-0127 |
| Undecryptable bytes are read-only (M2-0003) | Only the owning device exports a space (§2.2) | M2-0125 |

**Alternatives rejected.** (a) Add tenant, ACL and revision fields to the legacy files: this fails reasons 1, 2, 4 and 6 and still leaves two authorities. (b) Discard the brain and build only the service: this loses the extraction pipeline, the proven correction rules and the owner's data, against §17.1's "retain the selected second brain".

---

## 4. The ten provenance states

A **claim** is one value of one record field, with its state, evidence (canonical records or source items at exact revisions) and an optional attestation. A **field** has one `current` claim, a `history` of SUPERSEDED claims and a list of DISPUTED `disputes`, each list capped at 10 like the legacy history. A model probability lives in the separate `confidence` band and never changes the state (MASTER:1580).

MASTER §17.4 lists a record-level freshness state. The contract deliberately has none: support lapses per field, so freshness is per claim (STALE), and a record's freshness is derived from the states of its current claims.

### 4.1 Meaning and enforced invariants

| State | Meaning | Contract invariant (`provenance.ts`, `record.ts`) |
|---|---|---|
| SOURCE-OBSERVED | Copied from a field of an authoritative source item (for example a calendar event) | Cites at least one source item. No attestation, no confidence. |
| EXTRACTED | Pulled by a model from permitted evidence, with a verbatim quote | At least one quoted evidence entry. No attestation. The service checks that the quote aligns with the cited revision before it accepts the claim (§4.2). |
| INFERRED | A model judgement without a quote that aligns, or a legacy value of unknown origin | May have no evidence at all (weakest state). No attestation. |
| HUMAN-VERIFIED | A named user confirmed the value against its evidence | Attestation by a user, at a revision no later than the record's; no confidence |
| PINNED | A named user locked the value. Changing it needs an approved correction proposal (§4.2). No legacy state maps here (§11). | Attestation by a user; no confidence |
| EDITED | A named user entered the value. An editor may change it directly, and machine evidence never replaces it. | Attestation by a user; no confidence |
| DISPUTED | Contradicting evidence exists and no person has resolved it | As `current`: at least one entry in `disputes`. Every `disputes` entry is DISPUTED. |
| SUPERSEDED | A value the field held before | Only in `history`, never as `current` |
| STALE | The value's support lapsed: the source item was deleted, changed without re-extraction, or became unreadable to the record's audience | Keeps its value and evidence. May keep an earlier attestation. |
| DELETED | A person or a retention job removed the value | `value` is null, the claim is attested (by a user or a service, never a group), and no evidence entry keeps a quote |

These invariants hold for every claim in every record: evidence is only a canonical record or a source item in the allowlisted systems, so a wiki page, graph, search index, memory entry or model answer can never be cited. A claim never cites its own record. A record reference carries no tenant, so evidence cannot cross tenants.

This is only the part of the laundering guard (MASTER:1584) that one record can check. The rest needs the whole store: tracking originating sources through summaries and graphs, and refusing a citation cycle across records (A cites B while B cites A, or any longer loop). That is requirement O-11, owned by M2-0125.

### 4.2 Transitions (PROPOSED; the service enforces them, M2-0125)

| Trigger | Actor (from the token) | Result |
|---|---|---|
| New source-field value | service (sync) | SOURCE-OBSERVED; the previous value goes to `history` |
| New extraction whose quote aligns with the cited revision | producer (service extraction, or the owning device) | EXTRACTED |
| New extraction without an aligning quote, or a judgement | producer | INFERRED, with `confidence` |
| New origin claim against an origin `current` | producer | If it outranks `current` under the legacy order, `current` moves to `history` and the new claim becomes current. If `current` outranks it, the new claim goes to `history`. If they tie exactly in rank and date with different values, both become DISPUTED. |
| New origin claim with a different value against a human-state `current`, dated after the human act | producer | `current` is unchanged, and the new claim is added to `disputes` (this is legacy "contradicted pin", F11, made explicit) |
| The same, dated before the human act | producer | Goes to `history` |
| `set` / `set` with `pin` / `verify` / `pin` / `delete` on a field that is not PINNED | user | EDITED / PINNED / HUMAN-VERIFIED / PINNED / DELETED. On a disputed field, the operation resolves the dispute and every entry in `disputes` moves to `history`. |
| Any operation on a PINNED field | user, or agent acting for a user | PENDING-APPROVAL: the service files a correction-proposal record, approved under the rule below |
| `set` by an agent (Dust) acting for a user, on a field the space policy marks low-risk | agent on behalf of a user | EDITED, attested by that user. `committedBy` records the agent and the user, so the delegation stays visible (MASTER:1630). Otherwise the operation files a proposal. |
| `verify`, `pin` or `delete` by an agent | agent | Always PENDING-APPROVAL. An agent never certifies. |
| The evidence item is deleted, changed without re-extraction, or no longer readable by the record's audience | service (reconciliation) | STALE. The claim becomes current again once re-extracted from the new revision. |
| Retention expiry of a field, or a rights request scoped to a field | service or user | DELETED |

**Approving a PINNED change (PROPOSED; M2-0125 enforces it, O-9 adds the operation).**

- The approver is a user who edits the record when the approval arrives, directly or through a group. An agent or a service never approves, whoever it acts for. This is stricter than MASTER:1622, which only forbids an agent approving itself.
- The approver is not the proposer, so a lock in a shared space always needs a second person.
- When no other user edits the record (for example any personal space, and the golden `record.deal.json`), the proposer approves their own proposal through an explicit confirmation. It is a separate request, sent only after the client has shown the pinned value, who pinned it and when, and the proposed value. The request that files a proposal never approves it.
- A proposal an agent filed for a user is approved by that user or by another editor, under the same rules.
- The approval commits only if the record is still at the revision the proposal was filed against. Otherwise it returns CONFLICT, and the proposal is filed again against the current revision.

### 4.3 The word "verified"

"Verified" means HUMAN-VERIFIED and nothing else. A legacy `verified` value is a machine grounding check, so it maps to EXTRACTED at most (§11, field-value rows 5 and 6). Today the chip text, money-card comment and wiki comment call it human verification (F8). That is a user-facing overclaim, and it is **new finding N-1** (§14): the copy should say "quote-checked" until the canonical states replace it.

---

## 5. Revisions, ETags, idempotency and read-your-write

| Element | Rule (PROPOSED; contract field where one exists) |
|---|---|
| `revision` | Positive integer per record, +1 on every committed content change. Revision 0 means "absent" and is never stored. Committed revisions are immutable, and `knowledge.get(address, revision)` returns them (MASTER:1617). |
| `access.epoch` | Non-negative integer, +1 on every ACL change and only then. Projections, caches and memory fence on (revision, epoch), so a revocation invalidates them without a content change (HM-05, MASTER:5204). |
| HTTP mapping | `ETag: "<revision>"` (strong). `If-Match: "<n>"` is `expectedRevision: n`, and `If-None-Match: *` is `expectedRevision: 0`. |
| Backing-store CAS | The service writes only with the store's own precondition (for a list item, its eTag in `If-Match`, R58). The store's precondition failure (ASSUMED to be 412 until O-2 qualifies it) becomes a CONFLICT outcome. No write is ever unconditional. |
| Idempotency | Keys are scoped to (principal, key). Replaying a key returns its first outcome, and the same key with a different body is REJECTED `idempotency-key-reused`. After an ambiguous timeout, the client resends the same key and never a new one (MASTER:1636). |
| Read-your-write | COMMITTED carries `revision`, and the client reads that revision back. PROJECTION-PENDING means search is behind, not that the write failed, so the client never repeats a committed write because a projection lags (MASTER:1634). |
| Out-of-order safety | A projection or memory worker never replaces a newer (revision, epoch) with an older one (HMUC-013, MASTER:5233). |

---

## 6. Source ACLs and identity

- **ACL shape.** `access = {epoch, readers, editors}`, where every principal is an explicit Entra user, group or service principal, each list names a principal once, and every editor is also a reader. There is no "anyone with the link", "whole tenant" or "meeting attendees" principal (EXP-11, MASTER:1604). The record's `owner` names who is accountable for its source and grants no access by itself. A record's ACL is copied from its source's permissions at ingest. It narrows through derivation and widens only through an owner's explicit sharing action, which the contract cannot express yet (O-10).
- **Identity.** The actor and tenant come only from the validated token. A mutation addresses `{space, id}` inside the caller's tenant and carries no actor, tenant or claim state; the schema refuses those keys (MASTER:1610).
- **Order of checks (MASTER §17.6).** Authorize the principal, space and output audience before retrieval. A derived artifact's audience is the intersection of its sources' readers, so a derived edge or page never widens access (MASTER:1592). Check access again before returning or generating. Revocation bumps the epoch, and every read and cache key checks the current epoch.
- **Sensitivity.** `confidential` records are excluded from team publication, graph projections and generated prompts unless someone explicitly authorizes their inclusion (MASTER:1646).
- **Cross-space evidence** is allowed only when the citing record's readers are a subset of the cited record's readers. The service checks this (M2-0125).

---

## 7. Conflicts

| Kind | Detection | Outcome | Resolution |
|---|---|---|---|
| **Write conflict** | `expectedRevision` differs from the current revision, or the store refuses the precondition | CONFLICT `{expectedRevision, currentRevision}`, and nothing is written (MASTER:1632) | The client re-reads, rebases onto the current revision and resubmits with a new idempotency key |
| **Pinned-field change** | The patch targets a PINNED field | PENDING-APPROVAL with a proposal address | A user who edits the record approves it (§4.2): another editor, or the proposer through an explicit confirmation when no other user edits the record, and never an agent. The service then commits it if the record is still at the proposal's revision, and returns CONFLICT otherwise. |
| **Evidence conflict** | A machine claim contradicts `current` (§4.2) | DISPUTED entries stay visible; nothing is auto-resolved | A user runs `set`, `verify` or `pin` on the field. On a PINNED field that operation is a proposal, approved as above. |
| **Sync conflict** | Only in device-only mode: OneDrive conflict copies of `corrections.json` | The legacy union merge stays as it is (F6) | None needed in connected mode, because the service is the only writer of canonical records |

---

## 8. Deletion and no resurrection

- **Record deletion** produces a tombstone `{key, type, revision, deletedAt, deletedBy, reason, source?, successor?}`. The tombstone is in the contract; the request that deletes a whole record (a user's request, or a rights request scoped to the record) is not yet (O-8). The reason is `user-request`, `retention-expired`, `source-deleted` or `merged`, and a merge names its successor. Tombstones are permanent and ids are never reused. Every read of the key is blocked immediately at the API, every write is REJECTED `deleted`, and a re-ingest of the same `source` item is refused, whether it comes from a stale device or a restored backup (MASTER:1644, HM-08).
- **Field deletion** produces a DELETED claim: no value, no quoted content, and an attestation of who removed it. The source reference stays, so the same value is not re-extracted from the same source revision.
- **Propagation.** Reads are blocked before any clean-up. Projections, including the mirror, graph, search, memory, cached context packets and configured Dust replicas, are cleaned asynchronously against a deletion ledger. That ledger distinguishes canonical deletion, retrieval block, derivative purge, external replicas, backups or legal hold, and completion. While clean-up runs, the user sees "not used anymore; removal still in progress" (MEM:95-103). Owners: M2-0132 and M2-0136.
- **Restore.** Tombstones and ACL epochs are re-applied before a restored backup serves anything (HMUC-030).
- **Retention.** `retention.policy` is an opaque policy id until D-3 and D-12 define the catalog. Expiry produces a tombstone with reason `retention-expired`.

---

## 9. The plaintext-mirror sharing boundary

### 9.1 Rules (PROPOSED; M2-0126 enforces them in the exporter)

| # | Rule | Today (F12) |
|---|---|---|
| B1 | The mirror is a projection. It is never canonical and never a write target. An edit discovered in it becomes an attributed proposal or conflict (MASTER:1554). | Regenerated from the brain; edits are overwritten |
| B2 | Each mirror has **exactly one declared audience**, and the user sees it before enabling the mirror (MASTER:1550). A record may appear only if that audience is a subset of its readers (the ACL intersection). | The consent copy says only "so Dust and other tools can read them" |
| B3 | Content gate: consequential fields render only under the §4.3 rule; DISPUTED and STALE values are labelled as such; SUPERSEDED and DELETED never render; `confidential` records are excluded unless explicitly authorized; unreadable sources are excluded. | Render gate and confidential exclusion exist (fail closed) |
| B4 | Location: inside the approved knowledge environment, or the user's own meetings folder for a personal mirror. Never Cloudflare storage and never an anonymous link. | The user's meetings folder |
| B5 | Generated `AGENTS.md`, `CLAUDE.md` and index files are delimited, untrusted content, never instructions (MASTER:1552). | Files exist; handling by readers is UNKNOWN |
| B6 | Turning the mirror off deletes it. A deletion or narrower ACL removes pages at the next publish, and every page carries the revision watermark it was built from, so a stale page can be recognised. | Off deletes the mirror; no watermark |
| B7 | Honesty: the mirror is plaintext, and no copy may imply it inherits transcript encryption (MASTER:1550). | Consent dialog states it |

### 9.2 Owner choice inside D-6

| Choice | Audience | Dust path | Assessment |
|---|---|---|---|
| **M1. Personal mirror only** (recommended) | The owner alone, declared. Pointing a Dust connector at it makes that Dust space part of the audience, and the user attests to this in the consent copy, since Métis cannot read Dust space membership. | Team and agent access goes through the governed read tools (M2-0128), with per-principal authorization | Least new plaintext and no broad mirror (TASK-007 verify). It keeps today's shipped feature for individual use. |
| M2. Service-built team mirror in the approved site | Members of the declared site library; only records whose readers cover that whole audience | The Dust connector reads the team mirror | A second plaintext copy of team knowledge, with its own retention and revocation qualification (MASTER:1626). Choose it only if Dust MCP is not available. |
| M3. No plaintext mirror in 2.0 | None | Only the governed read tools | The simplest privacy posture, but it removes a shipped feature |

---

## 10. Data and authority matrix (TASK-007 verification)

The per-data-class matrix, with Dust access, Cloudflare metadata and device-only limits in separate columns, is published in `DATA-AUTHORITY-MATRIX.md` (M2-0265) and governs where the two differ. The table below is the design-time summary.

| Data | Authority | Home (target; today) | Protection | Who writes | Who reads |
|---|---|---|---|---|---|
| Canonical knowledge records (meetings, summaries, decisions, actions, accounts, people, deals, skill outputs, proposals) | **Canonical** (one owner per space) | Approved M365 site via the knowledge API [D-6]; today `.brain/entities`, `.brain/corrections.json` | M365 tenant controls plus record ACLs; today device-key envelope | Knowledge service only | Principals in `readers`, through the API or tools |
| Transcripts and recordings | **Source evidence** | The user's meetings folder, device-encrypted | Device key (F2) | The device | The owner's device. The service sees quotes only, and only where permitted. |
| Ingest ledger, meetings index, journal | Device state, not knowledge | `userData` (C3, C5) | Device envelope | The device | The device |
| Plaintext mirror | Projection | Per §9 | Plaintext; one declared audience | Exporter | The declared audience |
| Graph, search index, context packets | Projection | Service projections; today `userData/graph` | Keyed by (revision, epoch) | Projection jobs | Authorized principals only |
| Hindsight memory | Projection (derived store) | Service Postgres [D-5] | Homogeneous-ACL banks (MEM §35.3) | Projection outbox (M2-0134) | Authorized principals, never as authority |
| Dust | Client, never a store | Dust workspace (retention per workspace, M2-0128) | Personal OAuth | Mutations and proposals through tools | Governed tools; connector mirror only under §9 |
| Operator (Worker, D1) | **Metadata only** | Cloudflare | No content in logs, D1, KV, R2 or queues (MASTER §16.6) | Operator | Admins |
| Cloudflare AI gateway and proxy | Transit only | Cloudflare | No payload logging or caching (D-12) | n/a | n/a |
| Device-only limitations | In device-only mode nothing is reachable while the laptop sleeps, and Dust reads only the personal mirror. A `.brain` this device cannot decrypt is read-only here and cannot be exported from it (M2-0003). | | | | |

Checks this matrix implies (the owning tickets must show evidence): no new canonical store without D-6 (this ADR); no key upload (§2.1 A′ rejected; M2-0125); no broad plaintext mirror (§9; M2-0126); no content in Operator or Cloudflare persistence (M2-0149).

---

## 11. Legacy-to-canonical mapping (implemented by the M2-0125 migration)

The mapping is total and single-valued: every legacy value has exactly one canonical meaning.

**Identities and records.**

| Legacy (`src/shared/brain.ts`) | Canonical |
|---|---|
| Entity id (slug) | New record id: a deterministic UUIDv5 of (space, kind, slug), so a re-run of the migration is idempotent. The slug is kept as an alias field. |
| `MeetingRef.file` (basename) | Source `{system: metis-meeting, id: meetings-index id (C5), revision: content version}` |
| Merge tombstone `{merged_into}` | Tombstone `merged` with its successor |
| Commitment `status: rejected` | Tombstone `user-request` on the action record, keeping its source, so a re-extraction of that commitment is refused |
| Commitment `status` `kept` or `broken` | An EDITED `status` claim on the action record, because only a person settles a commitment (`ingest.ts:1188-1215`, called from the IPC handler at `src/main/index.ts:6442`). Settling is not journaled, so the claim is attested at export time. |
| Commitment `status: open` (the extraction default) | The action's `status`, mapped by field-value rows 3 to 6 using the commitment's own quote and confidence |
| Deal `outcome` | `won` or `lost` becomes an EDITED `outcome` claim, attested at export time, because only a person sets it (`src/main/index.ts:8082-8093`) and the change is not journaled. The default `open` is not migrated as a claim. |
| `index.warnings` (free-text lint) | Not migrated. The service recomputes disputes from evidence. |
| `corrections.json` | Not migrated as a journal. Its effect is already in the entities, and each entry supplies its claim's attestation time. |

**Field values.** Each legacy provenant field becomes one `current` claim, and the first row that matches wins. The `state` row comes before the source and confidence rows, so a pin, which also carries `source_file: ''`, maps by its state and never as a sourceless v1 field.

| Order | Legacy field value | Canonical `current` claim |
|---|---|---|
| 1 | `state: pinned` or `state: edited` | EDITED with no evidence, since a pin keeps neither its source nor its quote (F17). Attested by the exporting user (the brain's owner, proved by decryption) at the field's `date`, which is its journal entry's `at`, for revision 1, the revision the import creates. ASSUMED: every legacy correction was made by the device's single user; the export flow shows this attribution before it commits. |
| 2 | `source_file: ''` (a v1 field migrated with no source) | INFERRED with no evidence |
| 3 | confidence `AMBIGUOUS` | INFERRED, `confidence: low` |
| 4 | confidence `INFERRED` | INFERRED |
| 5 | confidence `EXTRACTED` and a quote that re-verifies against the decrypted source at export | EXTRACTED. This includes `state: verified`, which is a machine check (F8) and never becomes HUMAN-VERIFIED. |
| 6 | Any other value: confidence `EXTRACTED` with no quote, or with a quote that fails re-verification | INFERRED, `confidence: medium` |

**Why legacy `pinned` becomes EDITED, not PINNED.** Legacy `pinned` is written by every human edit and every accepted suggestion, shown as "edited by you", and changed again freely (F17). EDITED means exactly that: a person entered the value, machine evidence never replaces it, and an editor may change it directly. PINNED would put every migrated correction behind an approval that the legacy app never asked for, so nothing maps to PINNED; a user pins a value only through the canonical `pin` operation. An accepted suggestion does not become HUMAN-VERIFIED either: the pin discarded the quote and source it was confirmed against, and the legacy data cannot tell it apart from a typed value.

**Field history.** Each `superseded[]` entry becomes a SUPERSEDED claim in `history`, citing its `source_file` when it has one. There is one exception: when row 1 applies and the entry is dated after the field's `date`, it becomes a DISPUTED claim in `disputes`. This is legacy "contradicted pin" (F11) made explicit.

---

## 12. What landed and how it is verified

- **Contract (PR #217).** `identity.ts` (GUID identities, UTC instants, actors, source allowlist), `provenance.ts` (the ten states, evidence, claims, fields), `record.ts` (records, ACLs, tombstones), `mutation.ts` (typed patch, expected revision, the eight outcomes) and `issue.ts`. The contract imports only zod. Every object in a request is strict, including the evidence it cites and the source inside that evidence, so an injected key is refused; only a `set` value is free-form JSON. Records, tombstones and outcomes drop unknown keys, so an older client keeps reading a record that a newer service extends with new keys. That is the whole compatibility promise. A new enum value (record type, provenance state, outcome status or rejection code), or a new key inside a strict address, record key or principal, fails an older parser. It is therefore a breaking contract change, and the service emits it only once every client in use parses it. Public code comments cite only `ADR-019, M2-0120`, following the `ADR-017, M2-0002` precedent in `scripts/evidence/`, and never kit sections.
- **Fixtures.** Under `__fixtures__/`: 17 golden fixtures, which together hold all ten states, all eight outcomes and a record from a newer service, and 48 negative fixtures. `knowledge.contract.test.ts` requires each negative to fail with **exactly one** issue, at the path of the rule it breaks, so a negative cannot pass by failing for an unrelated reason. Together the negatives cover every refinement branch in the contract (each side of a two-sided rule separately) and every strict object, so deleting any of those checks fails CI.
- **Evidence.** LOCALLY_TESTED (OBSERVED in the job logs). Red: `Build & Test` run 36285223679 on `950a0eac`, which adds the negatives before the fix, fails in Quality checks on both ubuntu and windows with exactly four failures: the three injected-evidence negatives and the duplicate-editor negative, the behaviour the contract lacked. The other fourteen new negatives already passed there. Green: run 36285532733 on PR head `57c74b12` passes all four jobs, and `knowledge.contract.test.ts` passes 69 of 69 on both OSes, matching the `m2/integration` baseline run 36267674617 job for job. DESIGNED is this document.
- **Not claimed.** No store, service, migration, mirror change or Swift mirror exists, and the contract has no record-deletion, proposal-approval or sharing request yet (O-8 to O-10). No live M365, Entra or Dust behaviour was exercised, and those are BLOCKED on the Entra consent and the site and grant approval. D-6 (2026-09-27) and D-5 (2026-09-28) are answered, but the container platform is not yet named.

---

## 13. Consequences for downstream tickets

| Ticket | Inherits |
|---|---|
| M2-0125 (knowledge service) | The store port and adapters (§2.2), the §4.2 transitions, the §5 CAS and idempotency rules, quote alignment for EXTRACTED, the migration (§11) and the producer ingest request. The ingest request is added to this contract with its first consumer (PD-23), because where extraction runs, on the device or in the service, depends on D-3, D-5 and D-12. It also adds the record-deletion, proposal-approval and sharing requests (O-8 to O-10) to this contract, with fixtures, before any client uses them, and owns cross-record cycle detection (O-11). The API bounds request body size and JSON nesting depth before zod parses a request, because a `set` value (`JsonValueSchema`) has no size or depth limit of its own. |
| M2-0126 (projections) | §9 rules B1-B7, the §4.3 render rule, (revision, epoch) watermarks |
| M2-0127 (context builder) | Authorization before retrieval, audience intersection, epoch-keyed caches (§6) |
| M2-0128 / M2-0129 (Dust tools) | `KnowledgeMutationSchema` and `MutationOutcomeSchema` for field-level writes; no identity in tool arguments; agents never verify, pin or approve (§4.2). Those two schemas cannot delete a record, approve a proposal or widen an ACL. M2-0129 exposes record deletion and proposal approval only after M2-0125 adds them to this contract (O-8, O-9), and no agent tool widens an ACL (MASTER:1620). |
| M2-0132 / M2-0136 (sync and deletion) | Tombstone semantics, the deletion ledger and restore fencing (§8) |
| M2-0134 (Hindsight projection) | Fence on (revision, epoch); retain only approved records; memory never sets a state |
| M2-0139 (skills) | A skill output is a `skill-output` record with evidence; it never certifies itself |
| M2-0150 (governance) | The DPIA scope depends on the D-6 answer (option C adds a processor) |

---

## 14. Open items

| # | Item | Label | Owner | Next step |
|---|---|---|---|---|
| O-1 | D-6 store: ANSWERED 2026-09-27, option B (§2.2). The mirror boundary has no separate recorded answer | Store: closed (OBSERVED, `DECISIONS.md:114`). Mirror: ASSUMED M1 | Program owner | Confirm M1, M2 or M3 (§9.2) by 2026-10-12, or record that D-6's answer covers M1. |
| O-2 | Which Graph primitive (list item or drive item), with its size limits, throttling and `If-Match` semantics, including the exact precondition-failure response (ASSUMED 412) | UNKNOWN | M2-0125 | Qualify against a test site before choosing. R58 covers list items only. |
| O-3 | The producer ingest request (extraction on the device or in the service) | PROPOSED later | M2-0125 | Decide after D-3, D-5 and D-12, and add it to this contract |
| O-4 | The retention policy catalog | UNKNOWN | Owner (D-3, D-12) | Until then `retention.policy` is opaque |
| O-5 | **N-1 (new finding):** legacy machine grounding is labelled "verified" in the UI and described as human verification in code comments (F8) | OBSERVED | Lead to route: M2-0130 or a small copy-fix ticket | Relabel as "quote-checked" and keep "verified" for HUMAN-VERIFIED |
| O-6 | A Swift mirror of these fixtures | Not needed yet | M2-0063 sync script | Add it when a native consumer exists |
| O-7 | Dust workspace region, retention and connector revocation | UNKNOWN | M2-0128 | Qualify before any team knowledge reaches Dust |
| O-8 | Deleting a whole record: the §8 `user-request` tombstone, and a rights request scoped to a record. `KnowledgeMutationSchema` deletes fields only. | PROPOSED later | M2-0125 (request), M2-0129 (tool) | Add a record-deletion request to this contract, with golden and negative fixtures, before any client deletes a record |
| O-9 | Approving and committing a correction proposal (§4.2, §7; MASTER:1622 `knowledge.commit_change`), and the fields of a `correction-proposal` record | PROPOSED later | M2-0125 (request and approval rule), M2-0129 (tool) | Add the approval request and the proposal's fields to this contract. Its goldens include the approved path for `record.deal.json`'s PINNED amount by its only editor, and the service tests refuse an agent approver, and a self-approval while another user edits the record, with REJECTED `forbidden`. |
| O-10 | The explicit sharing action that widens a record's ACL (§6) | PROPOSED later | M2-0125 | Add a sharing request that only the record's owner may send and that bumps `access.epoch`. No agent tool widens an ACL (MASTER:1620). |
| O-11 | Citation cycles across records and originating-source tracking (MASTER:1584). The contract refuses only a claim citing its own record. | PROPOSED later | M2-0125; M2-0126 for graph edges | Refuse a citation that closes a cycle (A cites B while B cites A, or any longer loop), and trace each claim to its originating sources so a summary never confirms the evidence it was built from |
