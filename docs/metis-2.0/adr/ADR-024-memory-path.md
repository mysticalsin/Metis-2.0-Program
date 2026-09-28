# ADR-024: the single memory path — call-site inventory and gateway placement

| Field | Value |
|---|---|
| Ticket | M2-0331. Finding refs: AUDIT-2026-09-28, v6-brag-hindsight-02, -106, -121, HMSTEP-01 |
| Status | **PROPOSED.** Needs an Opus validator session other than the author to record PASS (acceptance 4). No validator has run. |
| Depends on | M2-0019 (`kit/PORT-DECISIONS.md`), M2-0020 (`memory/HINDSIGHT-PIN.md`), M2-0120 (`design/knowledge/ADR-019-canonical-knowledge.md`) |
| Scope | Documentation only. No code, test or app run (owner decision D-28). |

**Labels.** OBSERVED = read in code or a file, source given as `path:line`. DERIVED = reasoned from OBSERVED facts. PROPOSED = a design choice made here. ASSUMED = believed, verification step named. UNKNOWN = evidence missing.

**Source of OBSERVED code lines.** `<pub>` = `/Users/tony/AI-Brain-build/metis-operator-ux/`, read with the Grep and Read tools on its checked-out working tree. UNKNOWN: whether that checkout equals `origin/m2/integration`. `git -C … show origin/m2/integration:<path>` was refused by the sandbox in this session, so the exact commit was not confirmed. The lead re-verifies the line numbers (see LEAD_ACTION at the end) before this ADR leaves PROPOSED.

---

## 0. Decision in brief

1. **Two writers, one authority.** Today the desktop's `.brain` store and its wiki mirror are the only writers of remembered context (§1). Hindsight adds a second store. It is a **derived projection** of canonical knowledge (ADR-019) and never an authority (HINDSIGHT-PIN §5 seam 1, seam 2; M2-0134 acceptance).
2. **The gateway lives server-side in `services/memory/`** (M2-0133..0136). `src/main/features/memory-client/` (M2-0135, M2-0137) is a thin, generic client of the knowledge API. It never speaks Hindsight and never chooses a bank. This amends `PORT-DECISIONS.md:77`, which put the gateway "in trusted main".
3. **One owner per concern** (§3): projection, source registry, authority decision, usage ledger.
4. **A versioned adapter is adopted** (§4) between the r11 `HindsightClient` and the generic `MemoryClient`. It sits inside `services/memory/`.
5. **Ordering fix.** M2-0128, M2-0129 and M2-0141 gain `depends_on` on memory tickets (§5). Editing `tickets.json` is a lead action.

---

## 1. Inventory of current call sites (OBSERVED)

Every current place that reads or writes remembered context. "Store" means the `.brain` directory (`brain/store.ts`), the corrections journal, the wiki mirror, or the saved meeting files under recall.

### 1.1 `src/main/brain/*`

| # | Kind | Call site | What it does |
|---|---|---|---|
| B1 | write | `<pub>src/main/brain/store.ts:34` (`brainDir`), `:452` (`readFileSync`) | Owns the on-disk `.brain` location and low-level reads. `readJson`/`writeJson` are imported from it at `intelligence-index.ts:10`, `consolidate.ts:15`. |
| B2 | write | `<pub>src/main/brain/ingest.ts:1667-1668` | Reads the alias map and applies human corrections to a meeting extraction before it is stored. |
| B3 | write | `<pub>src/main/brain/ingest.ts:2185` | Publishes the wiki mirror after an ingest (`trackedPublication(() => publishAll(s))`). |
| B4 | write | `<pub>src/main/brain/ingest.ts:2315` (`exciseDeletedMeeting`) | Removes a deleted meeting's derived memory. |
| B5 | write | `<pub>src/main/brain/corrections.ts:161` (read), `:379` (write), `:688` (`readAliasMap`), `:701` (`applyCorrections`) | Human correction journal `.brain/corrections.json`. |
| B6 | write | `<pub>src/main/brain/publish.ts:49` (`wikiDir`), `:238` (`readConfidentialMeetings`), `:520` (`publishEntity`), `:556` (`removeFromWiki`), `:947` (`publishAll`) | Markdown wiki mirror. Confidential meetings are excluded. |
| B7 | read | `<pub>src/main/brain/context.ts:5`, `:194` (`buildBrainContext`) | Builds the per-turn context block from the store. |
| B8 | read | `<pub>src/main/brain/attention.ts:4` | Reads entities and the index for the attention list. |
| B9 | write | `<pub>src/main/brain/consolidate.ts:15,42`; `<pub>src/main/brain/intelligence-index.ts:10-11`; `<pub>src/main/brain/intelligence-pass.ts:7` | Batched passes that write `.brain/consolidate-state.json` and the index run record, and start backfill. |

### 1.2 `src/main/recall.ts`

| # | Kind | Call site | What it does |
|---|---|---|---|
| R1 | read | `<pub>src/main/recall.ts:237` (`listMeetings`), `:251` (`recallRead`), `:949` (`searchMeetings`) | Reads saved meetings. Exposed to the renderer at `<pub>src/main/index.ts:6163`, `:8540`, `:8544` (`requireAuth()` gate at `:8540`). |
| R2 | write | `<pub>src/main/recall.ts:387-394`, `:484-499` (index rewrite), `:537` (`updateMeetingRecap`), `:632` (`updateMeetingTranscript`), `:694` (`setMeetingCrmPushed`), `:746` (`setMeetingConfidential`) | Edits saved meeting text and index. |
| R3 | write | `<pub>src/main/recall.ts:370` (`deleteMeeting`), `:870` (`deleteAllMeetings`), `:923` (`sweepExpiredMeetings`), `:940` (calls `exciseDeletedMeeting`) | Deletion and retention, which cascades into the brain (B4). |

### 1.3 Ask path (agent runtime, in trusted main)

| # | Kind | Call site | What it does |
|---|---|---|---|
| A1 | read | `<pub>src/main/index.ts:6912-6919` | For `mode === 'answer'` and not fact-check, calls `buildBrainContext` and sets `req.brainContext`. Best effort: failure is logged and the answer proceeds. |
| A2 | read | `<pub>src/main/llm/shared.ts:186`, `:212` (`brainContextBlock`) | Puts that block into the prompt for every provider. |
| A3 | write | `<pub>src/main/index.ts:5054`, `:6368`, `:8109`, `:8147-8148`, `:8168-8169`, `:8183`, `:8228` | IPC handlers that mutate entities, then re-publish the wiki (`publishAll`, `publishEntity`, `removeFromWiki`). |
| A4 | write | `<pub>src/main/index.ts:6298`, `:6440`, `:8081` | Meeting excise, commitment settlement and deal outcome, each resolved through the alias map (`readAliasMap`). |

### 1.4 Operator routes

| # | Kind | Call site | What it does |
|---|---|---|---|
| O1 | write (metadata) | `<pub>src/main/operator-ingest.ts:166` (`projectOperatorIngestMetadata`), `:229` (`/v1/ingest`), `:285`, `:334` (`/v1/heartbeat`) | Desktop posts projected event metadata to the Operator. The projection drops unsupported legacy records without a network call (`:169`). DERIVED: this path carries usage events, not a memory store. |
| O2 | none found | `<pub>src/main/operator-*.ts` | UNKNOWN whether any operator route outside the files searched reads or writes remembered context. The operator service source (`operator/src/routes/`) was not inspected in this session. |

### 1.5 Dust and MCP

| # | Kind | Call site | What it does |
|---|---|---|---|
| D1 | read (indirect) | `<pub>src/main/store.ts:704-708` | Comment states the published wiki mirror is "Dust-readable". Dust agents read remembered context by reading the OneDrive wiki files, not through a tool. |
| D2 | none | `<pub>src/main/store.ts:1095-1133` (`fetchDustAgentList`, `listDustAgents`) | Lists Dust agents only. No memory read or write. |
| D3 | none | `<pub>src/main/mcp/write-tools.ts:2-10`; `mcpClient.ts`, `pushQueue.ts` | MCP client for CRM / task write intents (BidStack/Polo, Plane, ClickUp). Not a memory path. |
| D4 | absent | no `knowledge.*` tool, no MCP memory server | UNKNOWN for the public tree beyond the files searched; M2-0128 creates the first one in `services/knowledge/mcp/`. |

### 1.6 Hindsight in the public tree

OBSERVED: a case-insensitive search for `Hindsight` and `MemoryClient` under `<pub>src` returned no matches. `PORT-DECISIONS.md:85` already records that no production gateway module was identified; this pass confirms it for the searched tree. So there is **nothing to migrate to a gateway**: the gateway is greenfield and the risk is only that a second writer appears (§2).

### 1.7 Readers and writers that matter for the decision (DERIVED)

- Writers of remembered context today: B2-B6, B9, R2, R3, A3, A4. All are trusted main code on the device.
- Readers today: B7/A1/A2 (the model prompt), R1 (renderer), B8, and D1 (Dust via wiki files).
- Neither Hindsight nor the Operator currently writes remembered context (§1.4, §1.6).

---

## 2. Risk being closed

- **Two writers.** If a gateway in trusted main wrote into the same `.brain` records that `services/memory` projects from, the same fact would have two authors. (PROPOSED fix: main never writes Hindsight; it writes only canonical or device-only records.)
- **Two authority points.** `PORT-DECISIONS.md:77` says "trusted main/native memory gateway around existing brain/recall storage". M2-0133 says banks are derived from authenticated server context and the desktop can never choose a bank (`ledger/tickets.json:8068`). Both cannot hold. The server-side rule wins because tags and bank ids are not authentication (HINDSIGHT-PIN §5 seam 1, citing HS-06).
- **Ordering.** M2-0128, M2-0129 and M2-0141 have no memory dependency (`ledger/tickets.json:7748-7752`, `:7805-7807`, `:8513-8517`), so Dust read tools, Dust writes and server skills could ship before the path they must go through exists.

---

## 3. Owners and placement (PROPOSED)

| Concern | Single owner | Where it runs | Not an owner |
|---|---|---|---|
| **Projection** (canonical record → Hindsight documents, revision/epoch/operation mapping, outbox reconciliation, purge) | Memory projection worker, M2-0134 / M2-0136 | `services/memory/projection/`, `services/memory/forget/` | Desktop main; Hindsight itself (its labels never certify a fact, M2-0134 acceptance). |
| **Source registry** (which records may be projected, per-record provenance state, revision, ACL epoch) | Canonical knowledge service per ADR-019 | `services/knowledge/` (store per owner decision D-6) | `brain/store.ts` (stays device-side producer and device-only store per ADR-019 §0.3); `services/memory`, which holds only a mapping keyed by canonical id. |
| **Authority decision** (may this principal read/write/recall this scope now; bank derivation; revocation) | Knowledge API decision on the validated token | `services/knowledge/` decision, called by `services/memory/recall/` before any upstream call | `src/main/features/memory-client`, the renderer, tool JSON, Hindsight tags. Desktop `command-control.ts` keeps authority over *local actions*, which is unchanged (`PORT-DECISIONS.md:70-72`). |
| **Usage ledger** (provider-reported tokens with truthful unknowns, per workload) | Usage recorder in the memory service, one record per upstream call | `services/memory/` (records) surfaced to M2-0137 accounting | Desktop-side estimates; `HindsightClient.normalizeUsage` output is an input, not the ledger. Unknown stays `null`, never `0` (`kit/r11/memory/src/hindsight-client.mjs:27-31`). |

### 3.1 What runs where

- **`services/memory/`** (server, private network): Hindsight service at the pinned digest (M2-0133); projection (M2-0134); recall and optional reflection (M2-0135, `services/memory/recall/`); correction, tombstone and purge (M2-0136); the versioned adapter (§4); the usage ledger. Only this tier holds a Hindsight credential.
- **`src/main/features/memory-client/`** (desktop, trusted main; M2-0135, M2-0137): a generic `MemoryClient` over the authenticated knowledge/memory API. It requests recall with a purpose and deadline, passes an `AbortSignal`, receives source-linked candidates and normalized errors and usage, and drives the UI states (outage never blocks capture, notes, visibility or Stop, M2-0137 acceptance). It holds no Hindsight URL, key or bank id, and never writes a Hindsight document.
- **Renderer**: never contacts memory directly (`PORT-DECISIONS.md:77` already says "no raw renderer MCP/client"; retained).
- **Existing `src/main/brain/*` and `recall.ts`** (§1): stay the device-side producers and the device-only mode. They do not gain a Hindsight write path. Where the flag `memory.hindsight` is off, A1 still works exactly as today (DERIVED from A1's best-effort contract).

### 3.2 One read path for the model (PROPOSED)

A1's `buildBrainContext` (device-only mode) and the `memory-client` recall are **alternatives selected by flag and mode, never both merged into one prompt**, so the same fact cannot arrive twice with two authorities. The choice belongs to M2-0135. UNKNOWN: whether the owner wants device-only users to keep A1 after the service exists; that is decision D-24's territory (`ledger/tickets.json:8168-8170` lists D-24 as a need for M2-0135).

---

## 4. Versioned adapter between `HindsightClient` and `MemoryClient` (adopted)

**Decision: adopt one adapter**, inside `services/memory/`, named `memory-adapter` with an explicit integer `contractVersion` carried in every request and response of the service API. Rejecting it would put r11's Hindsight-shaped results into desktop code, which breaks §3.

**What r11 provides (OBSERVED, `kit/r11/memory/src/hindsight-client.mjs`).** `MemoryError` codes (`:7-12`); `normalizeUsage` returns frozen `inputTokens/outputTokens/totalTokens` or `null` with `basis: 'provider_reported' | 'not_reported'` (`:27-31`); a per-request deadline (`deadlineMs`, `:42`), caller `signal` support (`:51-52`, `:57`) that separates `TIMEOUT` from `CANCELLED` (`:98`), and `ambiguous: sent && mutating` on failure (`:98`); `retain` returns `RETAIN_ACCEPTED` with `searchable: 'NOT_PROVEN'` (`:123`); `recall` returns `candidates` plus usage (`:134`); `reflect` is labelled `SYNTHESIS_NOT_VERIFIED_FACT` (`:147`). HTTPS-only fixed origin, no redirects, no retries (`:5`, `:32-37`, `:67`).

**Adapter contract (PROPOSED).**

| Concern | Rule |
|---|---|
| Versioning | `contractVersion` integer. A service accepts N and N-1; an unknown version fails closed with `UNSUPPORTED_VERSION`. Golden and negative fixtures live in `src/shared/contracts/memory/` (M2-0133). |
| Cancellation | The desktop `AbortSignal` is forwarded as request cancellation; the server passes it to `HindsightClient` (`signal`). A cancelled mutating call reports `ambiguous: true` and is reconciled by the outbox before any replay (M2-0134, M2-0136 acceptance "caller cancellation and deadlines respected"). |
| Deadlines | Caller supplies an absolute deadline in the request; the service clamps it to its own maximum and passes the remaining time as `deadlineMs`. Exceeding it returns `TIMEOUT`, distinct from `CANCELLED`. |
| Normalized errors | A closed set, mapped from r11 `MemoryError.code`: `CANCELLED`, `TIMEOUT`, `TRANSPORT_FAILURE`, `INVALID_ID`, `INVALID_TEXT`, `INVALID_LIMIT`, `INVALID_ORIGIN`/`HTTPS_ORIGIN_REQUIRED`/`PRIVATE_SERVICE_ORIGIN_REQUIRED` (all collapsed to `SERVICE_MISCONFIGURED`), plus `UNSUPPORTED_VERSION`, `SCOPE_DENIED`, `SCOPE_EMPTY`. Each carries `ambiguous` and never leaks upstream text or status bodies. The exact code list beyond the r11 ones is PROPOSED; the r11 status field (`:8`) is dropped from the wire. |
| Usage | Adapter forwards `normalizeUsage` output unchanged, including `basis: 'not_reported'` and `null` fields. Consumers must not coerce `null` to `0`. |
| Result labelling | `reflect` results keep `SYNTHESIS_NOT_VERIFIED_FACT`; recall candidates carry a canonical source id, not a Hindsight label. The desktop never treats a Hindsight `type` (world/experience/observation) as certifying a fact (M2-0134 acceptance). |
| Compatibility | A change to the pinned Hindsight release or embedding model is a semantic migration (HS-16, M2-0134) and bumps the adapter's internal mapping, not necessarily `contractVersion`. UNKNOWN: the exact trigger policy; M2-0135 owns it. |

ASSUMED: the r11 client is reused as the transport inside the adapter and re-tested against the pinned server by M2-0133. Verification step: run the r11 client tests in the memory service CI job (LEAD_ACTION below); the earlier scratch result (60/60, `PORT-DECISIONS.md:100`) was not run against the pinned image.

---

## 5. Ledger ordering (PROPOSED; lead applies)

Memory tickets used (ids from `ledger/tickets.json`): M2-0133 (service, `:8028`), M2-0134 (projection, `:8093`), M2-0135 (recall, `:8156`), M2-0136 (forget, `:8229`), M2-0137 (client UX and accounting, `:8284`).

| Ticket | Current `depends_on` | Add | Why |
|---|---|---|---|
| M2-0128 Dust knowledge read tools | M2-0127, M2-0121, M2-0042, M2-0202 (`:7748-7752`) | **M2-0135** | `knowledge.search/get/changes/explain` may reach memory only through the bounded recall path; without it a Dust read could bypass scope, revision and deadline limits (§2). M2-0135 already transitively includes M2-0133 and M2-0134. |
| M2-0129 Dust writes and corrections | M2-0128 (`:7805-7807`) | **M2-0134**, **M2-0136** | Acceptance requires "projection refresh after commit" and reviewed corrections; a correction must reach the projection and tombstone fences (M2-0136), not just canonical. |
| M2-0141 server skill execution | M2-0140, M2-0127, M2-0106 (`:8513-8517`) | **M2-0135**, **M2-0137** | Its kit refs include HM-10 / HMSTEP-09 (scoped context), so it must use the same recall path and the same usage accounting. |

DERIVED cycle check: M2-0133..0137 do not depend on M2-0128, M2-0129 or M2-0141 (`:8034-8040`, `:8099-8103`, `:8162-8166`, `:8235-8239`, `:8290-8296`), so the additions add no cycle. M2-0135 depends on M2-0127 (also a dependency of M2-0128), so ordering stays consistent. All are W6, the same wave as the three tickets.

---

## 6. Consequences

- `PORT-DECISIONS.md:77` is amended (same PR) to this decision.
- `HINDSIGHT-PIN.md:255` says HMSTEP-01's first sentence, "inspect the current `.brain/context/wiki/recall`, Operator, Dust and agent call sites", was not performed. §1 performs it for the public checkout listed above. Remaining gaps: O2 (operator service source) and D4 (Dust-side configuration); both UNKNOWN and named for the lead.
- Nothing here is a claim that any Hindsight code exists in the product.

---

## 7. Lead-only actions

LEAD_ACTION: Edit `docs/metis-2.0/ledger/tickets.json` and regenerate `ledger/tickets/*.md` so `depends_on` gains M2-0135 on M2-0128; M2-0134 and M2-0136 on M2-0129; M2-0135 and M2-0137 on M2-0141 (table in §5); then run the ledger check and record its output.
LEAD_ACTION: Dispatch an Opus validator session other than the author to review this ADR and `PORT-DECISIONS.md:77`, and record PASS or REVISE. Acceptance 4 is not met until then.
LEAD_ACTION: Re-verify every `<pub>` line number in §1 with `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:<path> | nl -ba` and record the commit SHA of `origin/m2/integration` (this session could not run `git show`).
LEAD_ACTION: Read `operator/src/routes/` in the operator service repository (read-only) to close O2, and confirm the Dust workspace configuration for D4 (BLOCKED_EXTERNAL: needs the Dust workspace administrator).
LEAD_ACTION: Confirm owner decisions D-5 (hosting/region, needed by M2-0133) and D-24 (needed by M2-0135) before the flag `memory.hindsight` is planned.
LEAD_ACTION: Run the r11 memory client tests in CI against the pinned Hindsight image and file the artifact as evidence.
