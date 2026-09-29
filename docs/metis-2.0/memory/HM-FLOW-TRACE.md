# HM-FLOW-01..06 inventory rows, ticket mapping and ID-family sweep (M2-0262)

Evidence labels: OBSERVED = read in this worktree (file:line); DERIVED = follows from observed facts; UNKNOWN = not checked.

## 1. Rows added (OBSERVED)

`docs/metis-2.0/kit/ID-INVENTORY.json` now holds six rows, family `HMFLOW`, kit `r11`, ids `HM-FLOW-01`..`HM-FLOW-06`, in the r11 kit. Each row's sources are:

- `memory/INTEGRATION-CONTRACT.md`, ref `35.15 HM-FLOW-0N` (definitions at `docs/metis-2.0/kit/r11/memory/INTEGRATION-CONTRACT.md:228-238`).
- `spec/MASTER.md`, ref `35.15 HM-FLOW-0N` (`docs/metis-2.0/kit/r11/spec/MASTER.md:5256-5266`).
- `plan/registry.json`, ref `memory_expansion.steps HMSTEP-15 (names the HM-FLOW sequences)`. The registry carries no structured HM-FLOW rows; its only mention is the HMSTEP-15 prose at `docs/metis-2.0/kit/r11/plan/registry.json:10779`. The ticket summary's claim that the registry "defines" the six flows is therefore only partly true: it names them, the contract and MASTER define them.

`build-traceability.mjs` (`REQUIRED_ACCEPTANCE_IDS`, wired into `build()`) emits an error if any of these six ids is missing from the inventory, unmapped, or not named in the acceptance of a mapped ticket. Traceability maps a ticket to a row only through `kit_refs` (`build-traceability.mjs`, `buildReferenceIndex`); `finding_refs` do not count.

## 2. Ticket mapping the lead must apply (DERIVED)

Current state (OBSERVED, `docs/metis-2.0/ledger/tickets.json`): `HM-FLOW-*` appears only in `finding_refs` and summaries (M2-0334 line 18283, M2-0343 line 18731, M2-0344 lines 18778-18780, M2-0378 lines 20297-20298), never in `kit_refs`. No acceptance names HM-FLOW-01, -03, -04, -05 or -06 by id. M2-0344's fourth acceptance line says "each step maps to its HM-FLOW id" without naming one. Until the ledger changes, `--check` reports 6 unmapped rows and 6 not-named errors.

LEAD_ACTION: in docs/metis-2.0/ledger/tickets.json add kit_refs "HM-FLOW-01" and an acceptance line naming HM-FLOW-01 to ticket M2-0344 (proposed line: "HM-FLOW-01 (remember and reuse): the approved-remember, new-session recall and correction steps map to HM-FLOW-01 in the evidence record")
LEAD_ACTION: in docs/metis-2.0/ledger/tickets.json add kit_refs "HM-FLOW-02" and an acceptance line naming HM-FLOW-02 to ticket M2-0344 (proposed line: "HM-FLOW-02 (meeting to team knowledge): the scoped team-memory step and authorized Dust readback map to HM-FLOW-02")
LEAD_ACTION: in docs/metis-2.0/ledger/tickets.json add kit_refs "HM-FLOW-03" and an acceptance line naming HM-FLOW-03 to ticket M2-0344 (proposed line: "HM-FLOW-03 (forget under concurrency): delete or revoke a source while recall, reflect and retain are in flight; leases invalidate, no late answer or publication, and no resurrection from backup or cache even when the Hindsight stale flag stays false")
LEAD_ACTION: in docs/metis-2.0/ledger/tickets.json add kit_refs "HM-FLOW-04" and an acceptance line naming HM-FLOW-04 to ticket M2-0344 (proposed line: "HM-FLOW-04 (honest outage and limits): the separately injected fault matrix shows the correct state, local stop keeps working, and there is no silent third-party fallback")
LEAD_ACTION: in docs/metis-2.0/ledger/tickets.json add kit_refs "HM-FLOW-05" and an acceptance line naming HM-FLOW-05 to ticket M2-0334 (proposed line: "HM-FLOW-05 (security and privacy): foreign bank ids, empty or fuzzy scopes and tampered tags are rejected on every route before data returns")
LEAD_ACTION: in docs/metis-2.0/ledger/tickets.json add kit_refs "HM-FLOW-06" and an acceptance line naming HM-FLOW-06 to ticket M2-0343 (proposed line: "HM-FLOW-06 (release): qualification records the memory service version, image digest and DB version for the exact signed candidate")

Rationale (DERIVED): M2-0344 already carries HM-FLOW-01/02/04 in `finding_refs` and owns the fault matrix and resurrection checks that HM-FLOW-03 needs; M2-0334 already carries HM-FLOW-05; M2-0343 already carries HM-FLOW-06. Row keys are unique (`r11:HM-FLOW-0N`), so bare ids resolve without the `kit:id` form. Any ticket with a reworded line must keep the exact id string, because the check uses `line.includes(id)`.

Resolved 2026-09-29 (lead): staged in `.github/workflows/traceability.yml` — runs when private CI minutes are available (owner action). The workflow runs `--check`, then regenerates docs/metis-2.0/ledger/traceability.json and docs/metis-2.0/TRACEABILITY.md and uploads them as the `traceability-outputs` artifact; the lead commits the outputs from that artifact. Until the ledger edits above land, the generator reports the HM-FLOW errors and writes nothing, so the artifact then carries only its log. Not run yet (D-28 forbids running it on a Mac); the generated files stay unchanged and are never hand-edited.
Resolved 2026-09-29 (lead): no ticket-md generator exists. `ledger/tickets/*.md` are frozen snapshots of M2-0001..M2-0213 (`docs/metis-2.0/README.md`); M2-0334, M2-0343 and M2-0344 have no md file, and `ledger/tickets.json` is the only source for them.

## 3. Sweep for other missing ID families (OBSERVED unless marked)

Sources searched: `docs/metis-2.0/kit/r11/plan/registry.json` (every top-level array and the `agent_expansion` / `memory_expansion` sub-arrays) and `docs/metis-2.0/kit/r11/memory/INTEGRATION-CONTRACT.md` (all `PREFIX-NN` tokens).

| Source | Id families found | In ID-INVENTORY.json? |
|---|---|---|
| registry `requirements` | M2-* | yes, family `M2` |
| registry `use_cases` | UC-001..112 | yes, `UC` |
| registry `tasks` | TASK-001..066 | yes, `TASK` |
| registry `owner_commitments` | COV-01..44 | yes, `COV` |
| registry `golden_flows` | FLOW-01..12 | yes, `FLOW` |
| registry `historical_findings` | F-01..20 | yes, `F` |
| registry `slice_handoffs` | SLICE-* | yes, `SLICE` |
| registry `references` | R01..R93 | yes, `R` |
| registry `experience_requirements` | EXP-01..12 | yes, `EXP` |
| registry `source_findings` | SRC-01..24 | yes, `SRC` |
| registry `agent_expansion` | AGX, AGUC, AGSTEP | yes, same families |
| registry `clicky_observations` | HC-01..32 | yes, `HC` |
| registry `memory_expansion` gates/steps/use_cases | HM-01..16, HMSTEP-01..16, HMUC-001..032 | yes; registry `id` occurrences (64) equal inventory rows in families HM, HMSTEP, HMUC (64) |
| INTEGRATION-CONTRACT.md | HMSTEP, TASK, HM, HMUC, HM-FLOW | all yes; HM-FLOW was the only gap |

Result: HM-FLOW was the only family missing, so no rows beyond the six were added. Limits: family membership and the 64 = 64 count for HM/HMSTEP/HMUC were checked by search; for the other families I compared the registry id ranges to the family names present in the inventory (943 rows, 40+ families) rather than diffing every id (DERIVED). LEAD_ACTION: run `node docs/metis-2.0/tools/trace/build-traceability.mjs --check` in CI; it fails on any inventory row without a mapped ticket, which is the machine check for the rows above.
