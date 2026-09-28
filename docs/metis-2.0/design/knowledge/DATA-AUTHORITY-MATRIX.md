# Data and authority matrix (TASK-007)

| Field | Value |
|---|---|
| Ticket | M2-0265 (closes M2-0120 acceptance 1). Kit refs: TASK-007. Finding refs: AUDIT-2026-09-28, TASK-007 |
| Governing decision | ADR-019 (`ADR-019-canonical-knowledge.md`), §2.2 and §9. Owner decision D-6 |
| Review status | **NOT YET SIGNED.** Sign-off is in §5 and is filled in only by an independent reviewer. |
| Basis | Repository files at this worktree's `HEAD` (2026-09-28). Nothing was run (D-28). No live M365, Entra, Dust or Cloudflare system was read. |

Labels follow ADR-019. OBSERVED means read in a file; the source is given. DERIVED means reasoned from OBSERVED facts. ASSUMED means believed, with a verification step. UNKNOWN means the evidence is missing. `ADR §n` is a section of ADR-019, `DEC:n` is a line of `docs/metis-2.0/DECISIONS.md`, and `MASTER` is `docs/metis-2.0/kit/r11/spec/MASTER.md`.

---

## 1. The D-6 answer this matrix rests on

- **OBSERVED (DEC:114).** D-6 status is `ANSWERED_AS_DEFAULT 2026-09-27 (owner: "M365 via Entra API")`. The default is an Entra-protected knowledge API over an approved M365 location (MASTER §17.3 state (a)).
- **DERIVED.** The canonical store is option B of ADR §2.1. The service database (D-5 managed Postgres, DEC:33) is not canonical, and nothing may become a second canonical database.
- **DERIVED (ADR §2.2).** The approved always-on service path is: Dust, Teams and the desktop client call the Operator Worker (auth hand-off and metadata ledger only), which hands off to the Entra-validated knowledge API, which reaches the canonical list items through Microsoft Graph (Sites.Selected, `If-Match` on every write), and projections follow from that.
- **UNKNOWN.** The container platform that hosts the knowledge API. DEC:113 says the platform choice follows the D-5 answer. The owner's original D-6 message is not in this repository.
- **ASSUMED.** The plaintext-mirror audience is M1 (personal mirror only, ADR §9.2). The register row names only the store in its answer. Verification: the owner confirms M1, M2 or M3 (LEAD_ACTION below).

## 2. Matrix by data class

Columns: **Canonical store** is the one place the record is authoritative. **Projections** are derived copies that can be rebuilt and never accept writes as authority. **Dust access** is what Dust may do. **Cloudflare metadata** is what the Operator or gateway may hold. **Device-only limits** are what stays on the device or degrades when the device is the only holder.

| # | Data class | Canonical store | Projections | Dust access | Cloudflare metadata | Device-only limits |
|---|---|---|---|---|---|---|
| 1 | Knowledge records: meetings, summaries, decisions, actions, accounts, people, deals, skill outputs, correction proposals | Connected mode: list items in the approved M365 site, behind the knowledge API (D-6; ADR §2.2). Device-only mode: `.brain/entities` and `corrections.json` (ADR §10 row 1). One owner per space at any moment (ADR §0.1) | Governed read tools, service graph and search, context packets, Hindsight, optional plaintext mirror (ADR §2.2 diagram) | Reads and field-level writes only through the governed tools, with per-principal authorization. Mutations and proposals use `KnowledgeMutationSchema`. No identity in tool arguments. Agents never verify, pin, approve, delete a record or widen an ACL (ADR §13, M2-0128/0129; §4.2) | None. No knowledge content in logs, D1, KV, R2 or queues (ADR §10 row 8; MASTER §16.6) | Device-only mode: nothing is reachable while the laptop sleeps. A `.brain` this device cannot decrypt is read-only and cannot be exported from it (ADR §10 last row; M2-0003) |
| 2 | Provenance state, revisions, ACL epoch, tombstones | Inside each canonical record (ten states, per-record `revision`, `access.epoch`, permanent tombstones; ADR §§4-8) | Every projection is fenced on (revision, epoch) (ADR §13, M2-0126/0134) | Cannot set a state. Sees states as labels only (DISPUTED and STALE labelled; SUPERSEDED and DELETED never shown; ADR §9.1 B3) | None | Legacy vocabulary governs device-only mode; the mapping to the ten states is total and one-way (ADR §11) |
| 3 | Transcripts and recordings | Source evidence, not knowledge. The user's meetings folder, device-encrypted (ADR §10 row 2; F2) | Quotes reach the service only where permitted, and only as evidence entries | None directly. Dust never sees transcripts, except any that are quoted into a record it may read | Metadata only, if any. No transcript or audio persisted at Cloudflare (MASTER §16.6, D-12 at DEC:120) | The device key (`kLocal`) never leaves the device. The org escrow key is not an online serving key (ADR §2.1 A′, rejected) |
| 4 | Ingest ledger, meetings index, crash-recovery journal | Device state, not knowledge: `userData` (ADR §10 row 3) | None | None | None | Device only. The journal follows the retention profile; D-3 is OPEN (DEC:111), so the managed-profile behaviour is ASSUMED |
| 5 | Plaintext wiki mirror | Never canonical, never a write target (ADR §9.1 B1) | It is itself a projection: one declared audience; only records whose readers cover that audience (B2); confidential excluded (B3) | Only if a Dust connector points at it. Under M1 that Dust space becomes part of the owner's declared audience, attested by the user (ADR §9.2). Team access uses governed tools instead | Never stored in Cloudflare and never an anonymous link (B4) | Today the mirror is written to the user's meetings folder in plaintext, gated by `publishBrainPages` (ADR F12). Off deletes it (B6). It never inherits transcript encryption (B7) |
| 6 | Graph, search index, context packets | Not canonical | Service projections, keyed by (revision, epoch). Today `userData/graph` on the device (ADR §10 row 5) | Only through governed tools, after authorization; a derived artifact's audience is the intersection of its sources' readers (ADR §6) | None | Today's device graph is device-only; a stale one is rebuilt from the canonical store |
| 7 | Hindsight memory | Not canonical: a derived store. Self-hosted private Hindsight on managed Postgres (D-5, DEC:33) | It is a projection: homogeneous-ACL banks; the outbox retains only approved records; memory never sets a state (ADR §13, M2-0134) | Only through the governed read tools; never as authority | None. Not hosted in Cloudflare | Facts-only profile ships on; derived memory is built but off by default (D-24, DEC:33) |
| 8 | Dust workspace | Client, never a store (ADR §10 row 7) | Its own conversation copies are outside the canonical set | This row is the Dust access itself: personal OAuth, governed tools, mirror only under §9 | None | Dust workspace region, retention and connector revocation are UNKNOWN (ADR O-7). Qualify before any team knowledge reaches Dust |
| 9 | Operator (Worker and D1) records | **Metadata only**: seats, sessions, routing, counters, an outbox of revision deltas (ADR §2.2 diagram; MASTER §16.6) | None | None | Metadata only; a content sentinel test is required over all storage and log paths (MASTER line 905, M2-0149) | Content never reaches it. The device keeps the content |
| 10 | Cloudflare AI gateway and proxy | Transit only | None | None | No payload logging or caching. Metadata-only gateway logs (D-12, DEC:120). What the claim says is limited to what M2-0149 verifies | Speech goes through the Operator session broker with no organization token on the device (D-11) |

## 3. Rules the matrix enforces

Each rule needs evidence from the owning ticket before a release claim. This document does not provide that evidence.

1. No new canonical store: the service database and the mirror are never canonical (ADR §2.1 C; §9.1 B1).
2. No key upload from the device (ADR §2.1 A′; M2-0125).
3. No broad plaintext mirror: one declared audience, and confidential excluded (ADR §9; M2-0126).
4. No content in Cloudflare or Operator persistence (M2-0149).
5. Every canonical write carries an `If-Match` precondition. The exact refusal response (412) is ASSUMED until M2-0125 qualifies it (ADR O-2).
6. A data class not listed here is not authorized to hold knowledge until it is added here.

## 4. What this matrix does not claim

- **UNKNOWN.** The Graph adapter, the Sites.Selected grant and the site are not created. This is BLOCKED_EXTERNAL on Entra admin consent (M2-0125). The read-only step is to check in the Entra admin centre whether the knowledge API app registration has admin consent for `Sites.Selected`, and which site the grant names.
- **UNKNOWN.** No Dust, M365 or Cloudflare setting was read. Columns "Dust access" and "Cloudflare metadata" state the design and the recorded decisions (D-11, D-12, MASTER §16.6), not live configuration.
- **ASSUMED.** The row 5 audience (M1).
- **UNKNOWN.** Whether the M2-0119 hosting choice changes row 7 or the knowledge API host. This must be re-verified when M2-0119 lands (ledger note on M2-0265).

## 5. Independent review sign-off

M2-0265 acceptance 3 needs a reviewer who did not write this matrix (OD-19, DEC:35: Opus, read-only, separate session). The author did not sign it, and it is unsigned until the reviewer fills the table below.

| Item | Value |
|---|---|
| Reviewer (model and session) | _pending_ |
| Date | _pending_ |
| Result (PASS or CHANGES) | _pending_ |
| M2-0120 acceptance 1 re-validated against ADR §2.2 and `DEC:114` | _pending_ |
| Checks each cell against its cited source | _pending_ |

## 6. Steps only the lead can take

LEAD_ACTION: Dispatch the independent Opus reviewer (read-only, separate session; OD-19) on this matrix and on ADR-019 §2.2, and paste the result into §5 above.
LEAD_ACTION: In `docs/metis-2.0/ledger/tickets.json`, change M2-0120 `evidence.validation` from "acceptance 1 blocked on D-6" to record acceptance 1 re-validated by that reviewer, remove or update its `external_blocker`, then regenerate `ledger/tickets/*.md`. Do this only after the reviewer signs.
LEAD_ACTION: Ask the owner to confirm the plaintext-mirror audience (M1, M2 or M3), or to record that D-6's answer covers M1, then update ADR-019 O-1 and §9.2.
LEAD_ACTION: Re-verify this matrix against M2-0119 once it lands (ledger note on M2-0265).
LEAD_ACTION: File the CI Build & Test evidence record for the PR once its run finishes. This ticket changes documents only, so no packaged smoke covers app behaviour.
