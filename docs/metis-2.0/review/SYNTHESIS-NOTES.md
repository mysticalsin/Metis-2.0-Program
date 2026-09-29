# Métis 2.0: synthesis notes (Opus judge)

| Field | Value |
|---|---|
| Date | 2026-09-26 |
| Role | Opus judge/synthesizer, software-architecture-engineer v1.4.0 labels (OBSERVED / PROVIDED / DERIVED / ASSUMED / PROPOSED / UNKNOWN) |
| Output | `/Users/<redacted-user>/AI-Brain-build/metis-v2-program/docs/metis-2.0/ledger/tickets.json` (184 tickets, schema version 1) |
| Builder | `scratchpad/ledger/build.py` plus `part_*.py`; it validates dependencies, enums, coverage and a privacy scan, then writes the JSON with `json.dump` |
| Execution | Nothing in the repo was run. Only read-only `ls`/`grep` against the reference checkout, and Python over the review and kit JSON. |

---

## 1. Input status: the three drafts do not exist

- **OBSERVED:** `plan-work/drafts/` does not exist. The three draft summaries passed to this lane are all `null`. A `find` for `risk-first*`, `kit-complete*`, `architecture-led*` and `drafts` under both `metis-v2-review` and `metis-v2-program` returns nothing.
- **UNKNOWN:** why the three draft lanes produced no output. The orchestrator should check those lanes' logs; this synthesis does not depend on them.
- **Consequence:** I cannot score documents that were never written, and I have not invented their contents. Instead I reconstructed three **candidate skeletons**, one per lens name, from the same inputs every draft lane would have used: ARCHITECTURE-TARGET, the prep reports, BUG-ROOT-CAUSES, CODE-FINDINGS, COVERAGE-CRITIC, KIT-REQUIREMENTS, PRIOR-EXECUTION, GIT-STATE, the ChatGPT audit and the r11 registry. The skeletons below are **PROPOSED by the judge**. They are not the missing drafts.

## 2. Candidate skeletons and scores

Scale: 1 (poor) to 5 (strong). Criteria are the six named in the task.

| Criterion | A. Risk-first | B. Kit-complete | C. Architecture-led |
|---|---|---|---|
| Correctness (built on verified mechanisms, not refuted ones) | 4 | 3 | **5** |
| Completeness vs kit (TASK/UC/family coverage) | 2 | **5** | 3 |
| Simplicity (fewest moving parts, no rewrite) | 3 | 2 | **5** |
| Risk reduction (owner bugs, data safety, false closure) | **5** | 2 | 4 |
| Feasibility by 2026-11-30 | 3 | 1 | **4** |
| Testability (machine-checkable acceptance) | 4 | 3 | **5** |
| **Total (of 30)** | 21 | 16 | **26** |

- **A. Risk-first:** fix the P0/P1 bugs and data-safety hazards first, then work the kit in DAG order.
  - Strength: it front-loads what hurts Tony today.
  - Weakness: without seams (supervisor, gateway, controller, journal) the fixes become per-repro patches. That is exactly how the "leftover slab at Y=39" bug class accumulated (seven separate patches, issue #124). It also compresses 60+ kit tasks into the last five weeks.
- **B. Kit-complete:** one ticket per TASK-001..066 in registry DAG order.
  - Strength: traceability is complete.
  - Weakness 1 (OBSERVED in the K04 lane): the DAG's critical path runs through TASK-002 (owner PRD approval), Entra, the canonical-knowledge decision and Dust, all of which are external. The P0 bugs would wait behind owner approvals.
  - Weakness 2: the registry's own status fields are stale (all NOT_STARTED, and the SRC-04 evidence points at the wrong file). A plan built from it inherits that staleness. Worst feasibility of the three.
- **C. Architecture-led:** ARCHITECTURE-TARGET's 21 strangler migration steps mapped to m3–m12, with components C1–C14, fitness functions FF-01..15 and ADR-001..018.
  - Strengths: it is built on the Opus-verified mechanisms, rejects every refuted theory (window.confirm, `isResponsive()`, a SIGTERM handler, `detached`), and gives each component an admission record.
  - Weaknesses: it covers the kit families (UC, CX*, JV*, HM*, NK, LF) only by reference; it declares the server plane DESIGN_BLOCKED; and it does not start the external unblocks or the evidence chain in week 1.

**Decision:** C is the skeleton, with grafts from A and B:

- **From A (risk-first):**
  - A dedicated W0 safety-and-evidence wave. Test hermeticity is M2-0001 and the release evidence chain is M2-0002.
  - Freeze and heaviness are reproduced on the packaged 1.9.6 build *before* any fix is judged.
  - A resource baseline and a same-day orphan-cleanup runbook for the owner.
  - External unblock requests on day 1 (ChatGPT A9), and 1.9.7 treated as a gated release of the tested artifact only (ChatGPT A10).
- **From B (kit-complete):**
  - A primary ticket for every TASK-001..066, carrying that task's registry requirement bindings (M2-* IDs).
  - Explicit per-ID mapping of the full 937-row inventory.
  - Dependency fidelity where the kit's DAG matters for release: TASK-054 → 056 → 063 → 064/065/066.
  - Kit slice IDs, and the kit sequencing rule K07-SEQ-01: the P1 fixes TASK-027.A and TASK-028.A ship before any Hindsight or agent provisioning.

## 3. Judgment calls that shape the ledger

1. **Freeze mechanism.**
   - Leading cause: synchronous reads of dataless OneDrive files on the main thread. DERIVED from OBSERVED spindumps (45.75 s and 85.55 s blocked in `apfs_materialize_dataless_file_ext`) and a 5 m 24 s log gap.
   - Second cause: a structural no-op reopen in the Hide/Island park state (OBSERVED in code and in the owner's `park hide` logs).
   - The fixes are the storage gateway (M2-0030/31/32) and the reveal controller (M2-0036).
   - The window.confirm theory is REFUTED twice, and ChatGPT agrees. The nine native dialogs are still replaced (M2-0040) as P3 UX debt, which ChatGPT ranks A5 for this week. That ticket is not the freeze fix.
2. **Heaviness.**
   - CONFIRMED: orphaned `llama-server` processes of about 3.1 GB each.
   - Fix: one `stopAll()` covering the onFatal relaunch path and ffmpeg (M2-0026), plus an identity-safe registry and reaper including a legacy rule (M2-0027), plus a `mac-helper supervise` guardian (M2-0028). The guardian is default-on only if HK-M passes 20/20.
   - No SIGTERM handler and no `detached` flag: the verifier's experiment showed both are irrelevant.
   - Amplifiers are fixed alongside: exhaustion resets (M2-0033), the context-blind extraction window (M2-0034), re-hashing on every cold spawn (M2-0035) and un-throttled parked animation (M2-0039, measure first).
3. **No automatic renderer reload in 1.9.7.**
   - The journal lands first (M2-0066, m5). Journal-gated recovery with SAFE_MODE (M2-0098, m6) then supersedes the test-pinned "no reload" rule through ADR-004. This follows ChatGPT A2.
   - 1.9.7 only adds a bounded reload budget for crashes (M2-0037) and a user-invoked "Restart Métis window" tray action.
4. **Test hermeticity blocks all test execution.** No agent runs any repo test until M2-0001 merges and its canary passes.
   - M2-0001 ports the reviewed MQA-348 fix and closes its gaps.
   - The production foreign-key guard (M2-0003) and the selftest isolation (M2-0004) close the other two ways owner data gets mutated.
5. **Kit patches.**
   - `metis-r11-scoped.patch` and `SOURCE-UPDATE.patch` apply cleanly and land (M2-0041). `media-repair.patch` is OBSOLETE.
   - SRC-06, SRC-08 and SRC-10 are recorded as NARROWED, not closed.
6. **PR #189 is already on main.** The prep lane corrected GIT-STATE's "fast-track" advice: the open gap is the `onFatal` relaunch path, which M2-0026 covers.
7. **Shipping line.**
   - RightEdgeSidecar vs DockPanel is owner decision D-7 (M2-0022). It gates the right-edge ticket (M2-0095).
   - PR #187's notes-as-nodes fix is salvaged into M2-0130 regardless, because the bug is still live at HEAD.
8. **Server intelligence plane** (decisions, knowledge, Hindsight, Laya, skills).
   - Engineering runs against a local compose profile (PROPOSED `services/` root).
   - Live deployment is BLOCKED on D-5 (hosting), D-6 (canonical store), Entra, Dust and the vendors. Each ticket names its external owner and exact unblock step.
9. **Apple public signing is out of scope.**
   - TASK-065 (M2-0175) records the public DMG as HELD. The Mac QA candidate is development-signed.
   - Windows signing procurement starts in W2 (M2-0058) because vendor validation takes 1–20 business days.
10. **Windows packaged tests.**
    - HK-W, install/launch and reveal gates run on the GitHub-hosted `windows-latest` lane via workflow_dispatch. PROVIDED by the GitHub prep lane: the quality job already runs on `windows-latest`.
    - A physical Windows device is needed only for GPU, DPI and battery budgets (M2-0007).
11. **Refactor order.** It follows the architecture target.
    - Seams first: AppContext/IPC (M2-0060) and contracts (M2-0061..64).
    - Then lifecycle extraction (M2-0065), the three-part `registerIpc` peel (M2-0068..70), and the Settings and App.tsx splits as pure moves.
    - `listen.ts` is split only in m7 (M2-0110), when speech changes anyway.
    - The fitness ratchet (M2-0047) stops the old shape from regrowing.
12. **Launch film.** Built only from verified evidence. M2-0178 is the claim register and truth gate; unverified scenes are visibly labelled as concept. REF-01..10 on film tickets are the **v6** register.
13. **Refactoring skill identity.** Unresolved in the kit. M2-0059 proceeds with SAE v1.4.0 + Stark v9.3.0 and asks the owner to name the skill or confirm the substitution.

## 4. Ledger conventions

**Waves, milestones and dates.** Waves are sequencing lanes, and they overlap in time. A few tickets sit in an earlier wave than their milestone because of lead time:
- M2-0025 PR triage: W0, m4.
- M2-0058 Windows signing: W2, m10.
- M2-0106 metering: W5, m9.
- M2-0121 Entra: W6, m9.

| Wave | Milestone(s) | Due | Tickets | Est. hours |
|---|---|---|---|---|
| W0 safety and evidence baseline | m2, m3, m4 | 09-27 / 10-04 | 25 | 137 |
| W1 1.9.7 stabilization | m3 | 10-04 | 21 | 167 |
| W2 repo and CI hygiene | m4 (and m10 for signing) | 10-04 | 12 | 62 |
| W3 refactor foundation | m5 | 10-18 | 20 | 201 |
| W4 interaction core | m6 | 11-01 | 23 | 328 |
| W5 speech and meeting (plus metering) | m7 (and m9) | 11-08 | 17 | 232 |
| W6 intelligence plane | m8 (and m9) | 11-15 | 26 | 368 |
| W7 Operator, identity, Teams, security | m9 | 11-15 | 15 | 216 |
| W8 onboarding, install, release gates | m10 | 11-22 | 16 | 210 |
| W9 launch film and final validation | m11, m12 | 11-27 / 11-30 | 9 | 96 |

**Dependency semantics (PROPOSED; to be recorded in docs/metis-2.0/README.md by M2-0002).**
- A dependency is satisfied when the upstream ticket reaches `ENGINEERING_COMPLETE` or `DONE`.
- An upstream `BLOCKED_EXTERNAL` ticket lets downstream engineering proceed, but the downstream ticket cannot claim a higher evidence level than its blocked input. This is how "wired for real but BLOCKED with the exact unblock step" works without freezing the whole graph.

**owner_model.**
- `opus`: every design, animation, visual and video ticket, plus architecture-defining slices. That covers the evidence chain, decisions, PRD, freeze investigation, supervisor registry and guardian, storage gateway, reveal controller, journal, meetings index, fitness tooling, AppContext/IPC, TASK-005 contracts, command authority, the actions core, recovery v2, release gate, candidate freeze and the final audit.
- `sonnet`: everything else.
- Opus validates every ticket regardless of owner.

**External blockers.**
- 37 tickets carry an `external_blocker`, naming a role and never a guessed person. "Program owner (Tony)" is PROVIDED by the goal.
- Owner decisions D-1..D-9 and the other open questions are consolidated in M2-0012.

**finding_refs naming.**
- `B1-RC1..4`, `B2-F1..4`, `B3-RC1..6`: BUG-ROOT-CAUSES.
- Code findings keep their ids where already lane-unique (`L01-*`, `L03-*`, `L05-*`, `L06-*`, `L07-*`, `L09-*`, `L10-*`, `L11-*`, `F-L04-*`). Otherwise they are lane-prefixed: `L02-F*`, `L08-F*`, `L12-<id>`.
- `<lane>-REFACTOR-n`: the nth refactor opportunity in that lane.
- `CRITIC-INV-1..16`: missing investigations. `CRITIC-CON-n`: contradictions. `CRITIC-CODE-n`: uncovered code. `CRITIC-KIT-n`: uncovered kit. All follow COVERAGE-CRITIC list order.
- `CHATGPT-A1..A10`: the audit's ranked top-10 actions.
- Prep reports:
  - `P4-F1..6` and `P4-SRC04`: UNCOVERED-MAIN.
  - `P5-F1..4`: UNCOVERED-RENDERER-OPS.
  - `P6-DOCS`: DOCS-RECONCILE.
  - `P7-RANK1..6` and `P7-INSTR`: FREEZE-HYPOTHESES.
  - `P8-HERMETIC` and `P8-QUARANTINE-GUARD`: HERMETIC-TESTS.
  - `KP-1..4`: KIT-PATCHES (1 metis-r11-scoped, 2 media-repair, 3 SOURCE-UPDATE, 4 MQA-348 extra work).
- Other sources:
  - `GH-PR-n`, `GH-ISSUE-n`: GitHub.
  - `K0x-R*`, `K0x-DEC-*`, `K0x-BLK-*`, `K0x-CONFLICT-*`: kit-lane requirement, decision, blocker and conflict keys.
  - `RUNTIME-*`: RUNTIME-EVIDENCE items.
  - `B2-OTHER-F5`, `GIT-TRACE-REC`, `ARCH-4.2-ROLLBACK`: other named inputs.

**kit_refs.** These are canonical inventory IDs, exactly as in the kits. They come from three sources:
- Explicit per-ticket mapping (for example, UCs are grouped by owner partition onto the implementing ticket).
- The registry requirement bindings of each TASK's primary ticket.
- A deterministic auto-fill by first parent task for 7 leftovers: AGSTEP-01, AGUC-001, AGUC-002, AGX-01, COV-43 and HC-01 go to M2-0015, and UC-032 goes to M2-0082.

**REF collision.**
- `REF-01..17` (HeyClicky interaction kit nested in v5) and `REF-01..16` (v6 SOURCE-REGISTER) share literal ids. Each ticket that carries REF ids says in its summary which kit they belong to.
- HeyClicky: M2-0020 (15..17), M2-0082 (01..05), M2-0084 (09..10), M2-0085 (11..12), M2-0087 (06..08), M2-0123 (13), M2-0124 (14).
- v6: M2-0133 (11..12), M2-0134 (13), M2-0135 (14..15), M2-0136 (16), M2-0178 (09..10), M2-0180 (01..08).
- The traceability ticket (M2-0011) must disambiguate by kit tag.

**scope_paths.**
- Existing paths were verified against the 2bf21f1c checkout. Four initial guesses were corrected: `src/main/operator-ingest.ts`, `src/main/brain/intelligence-work.ts`, `src/shared/enterprise-live-profile.ts`, and the real timer owners for the scheduler.
- New paths are PROPOSED per ARCHITECTURE-TARGET §2.3 (`main/{app,lifecycle,windows,ipc,features,infra}`, `shared/contracts`, `renderer/{features,ui,app}`).
- `services/` and `teams-app/` are PROPOSED roots pending ADR-014.

## 5. Coverage results (computed by the builder)

- 184 tickets, ids M2-0001..M2-0184, with waves non-decreasing.
- Every dependency points to an earlier id; there are no cycles.
- Canonical IDs: 921 distinct ids from 937 inventory rows (the difference is the 16 REF collisions). All 921 are covered.
- Every TASK-001..066 has a primary ticket (table below).
- All 16 CRITIC-INV items, all 10 ChatGPT actions, every bug root cause (including refuted ones, mapped as P3 cleanup or closure notes) and every P0/P1 code finding with a CONFIRMED or PARTIAL verdict map to tickets.
- Evidence targets:

| Evidence target | Tickets |
|---|---|
| LOCALLY_TESTED | 113 |
| DESIGNED | 27 |
| PACKAGED_TESTED | 21 |
| LIVE_VERIFIED | 9 |
| HOST_CONFIGURED | 8 |
| MEASURED | 6 |

- Owner model: 52 Opus tickets (637 h) and 132 Sonnet tickets (1,380 h).
- Privacy scan: the ledger contains no email addresses, 32-hex account-style ids or key-like strings.

## 6. Feasibility and schedule risk

- **Effort:** 2,017 estimated agent-hours (DERIVED, sum of estimates). The serial dependency critical path is 266 agent-hours, running hermetic → fitness → AppContext → contracts → TASK-005 → Entra → knowledge → projections → context → Dust read → Dust write → sync → summaries → desktop journeys → candidate freeze → film → final audit → sign-off.
- **Calendar critical path.** It is driven by external blockers, not engineering hours. Six critical-path tickets carry one: Entra, Dust, the QA lanes/Jev key, Windows signing, film-claim approval and sign-off. This matches the K04 lane's finding that the kit DAG's longest chain runs through Entra, knowledge and Dust.
- **Feasibility (ASSUMED, to be re-checked at each milestone gate):**
  - Engineering-complete delivery of the desktop scope (m3–m7, m10) by 11-30 is feasible with sustained parallel Sonnet execution: roughly 6–8 concurrent agents across W4–W8.
  - Live server-plane, Teams media and signed Windows publication depend on owner and tenant actions and may legitimately end `BLOCKED_EXTERNAL` with exact unblock steps.
- **Top risks:**
  1. **QA host not provisioned** (M2-0007). 1.9.7's packaged evidence depends on it. Fallback: run on the owner Mac under `ASKTOTO_USERDATA=<mkdtemp>` with explicit consent.
  2. **Late owner decisions.** D-1 (reopen policy), D-5/D-6 (hosting, canonical store) and D-7 (shipping line) each gate a lane.
  3. **Opus throughput.** 637 h of Opus-owned implementation, plus validation of all 184 tickets.
  4. **False closure.** Mitigated by M2-0002 and the release gate M2-0171: a closure without an evidence record at its target level fails the checker.
  5. **Oversized tickets.** Tickets estimated at 20 h or more should be split when started: M2-0093, M2-0106, M2-0114, M2-0117, M2-0118, M2-0125, M2-0130, M2-0155, M2-0158, M2-0160, M2-0180.

## 7. Open items for the validator and orchestrator

- Investigate why the three draft lanes produced nothing (section 1).
- Validate acceptance testability ticket by ticket. Several verification lines name scripts that the ticket itself creates (for example `scripts/qa/st-1.mjs`); that is intentional.
- Run order: M2-0001 first. No verification command in any ticket may run before M2-0001 is merged and its canary passes.
- Not verified here:
  - The libuv Windows job semantics (M2-0029).
  - The mac-helper entitlements needed for `supervise` (M2-0028).
  - The Plane OAuth exact-match behaviour (M2-0144).
  - The wake-model licence (M2-0081).
  - The Hindsight upstream identity (M2-0020).
  - Every ASSUMED item listed in ARCHITECTURE-TARGET §6.4.

---

## Appendix: generated mapping tables

### P0/P1 findings that survived verification → tickets

| Finding | Original → adjusted severity | Verdict | Tickets |
|---|---|---|---|
| L01-F1 | P0 → P2 | PARTIAL | M2-0008, M2-0036 |
| L01-F1b | P0 → P2 | PARTIAL | M2-0036, M2-0098 |
| L01-F2 | P0 → P1 | PARTIAL | M2-0026 |
| L01-F3 | P1 → P3 | PARTIAL | M2-0074 |
| L01-F4 | P1 → P2 | PARTIAL | M2-0060, M2-0068, M2-0069, M2-0070 |
| L02-F1 | P0 → P1 | PARTIAL | M2-0027 |
| L02-F3 | P1 → P3 | PARTIAL | M2-0033 |
| L03-01 | P1 → P1 | PARTIAL | M2-0003, M2-0067 |
| L03-03 | P1 → P3 | PARTIAL | M2-0069, M2-0074 |
| F-L04-windows-e5-gap | P1 → P2 | PARTIAL | M2-0044 |
| F-L04-1 | P1 → P2 | PARTIAL | M2-0043 |
| L05-F1 | P1 → P3 | PARTIAL | M2-0056 |
| L05-F2 | P1 → P3 | PARTIAL | M2-0147 |
| L05-F3 | P1 → P3 | PARTIAL | M2-0147 |
| L06-F1 | P0 → P2 | PARTIAL | M2-0040 |
| L06-F2 | P1 → P3 | PARTIAL | M2-0072 |
| L07-01 | P1 → P3 | PARTIAL | M2-0075 |
| L07-03 | P1 → P3 | PARTIAL | M2-0077 |
| L08-F1 | P1 → P3 | PARTIAL | M2-0062 |
| L08-F2 | P1 → P3 | PARTIAL | M2-0063 |
| L09-F1 | P1 → P1 | PARTIAL | M2-0145 |
| L09-F2 | P1 → P2 | PARTIAL | M2-0051 |
| L10-1 | P1 → P2 | PARTIAL | M2-0050 |
| L10-2 | P1 → P2 | PARTIAL | M2-0050 |
| L11-01 | P1 → P2 | PARTIAL | M2-0005, M2-0048 |
| L11-02 | P1 → P2 | PARTIAL | M2-0049 |
| L11-03 | P1 → P2 | CONFIRMED | M2-0047, M2-0065, M2-0068 |
| L12-F3-connector-kind-drift | P0 → P2 | PARTIAL | M2-0045 |
| L12-F1-main-index-god-module | P1 → P2 | PARTIAL | M2-0060 |
| B1-RC1 | P0 → P3/P3 | REFUTED (REFUTED/REFUTED) | M2-0008, M2-0040 |
| B1-RC2 | P0 → P3/P3 | REFUTED (REFUTED/REFUTED) | M2-0006, M2-0037, M2-0066, M2-0098 |
| B1-RC3 | P1 → P3/P3 | CONTESTED (PARTIAL/REFUTED) | M2-0008, M2-0030, M2-0031, M2-0036 |
| B1-RC4 | P2 → P3/P3 | CONTESTED (PARTIAL/PARTIAL) | M2-0008, M2-0030, M2-0032, M2-0067 |
| B2-F1 | P0 → P1/P1 | CONFIRMED (CONFIRMED/CONFIRMED) | M2-0010, M2-0026, M2-0027, M2-0028, M2-0029 |
| B2-F2 | P1 → P2/P2 | CONTESTED (PARTIAL/PARTIAL) | M2-0003, M2-0033, M2-0034 |
| B2-F3 | P3 → NA/NA | CONFIRMED (CONFIRMED/CONFIRMED) | M2-0044 |
| B2-F4 | P2 → P3/P3 | CONTESTED (PARTIAL/PARTIAL) | M2-0033, M2-0073 |
| B3-RC1 | P1 → P3/P3 | CONFIRMED (CONFIRMED/PARTIAL) | M2-0006 |
| B3-RC2 | P0 → P3/P3 | CONTESTED (PARTIAL/REFUTED) | M2-0037 |
| B3-RC3 | P0 → P3/P3 | CONTESTED (PARTIAL/REFUTED) | M2-0006, M2-0036 |
| B3-RC4 | P1 → P3/P3 | CONTESTED (PARTIAL/PARTIAL) | M2-0006, M2-0038 |
| B3-RC5 | P1 → P1/P1 | CONTESTED (PARTIAL/PARTIAL) | M2-0026, M2-0027, M2-0028 |
| B3-RC6 | P2 → P3/P3 | CONTESTED (PARTIAL/PARTIAL) | M2-0028 |

### Coverage-critic missing investigations → tickets

| Ref | Tickets |
|---|---|
| CRITIC-INV-1 | M2-0008 |
| CRITIC-INV-2 | M2-0003 |
| CRITIC-INV-3 | M2-0009, M2-0166 |
| CRITIC-INV-4 | M2-0005 |
| CRITIC-INV-5 | M2-0041 |
| CRITIC-INV-6 | M2-0022 |
| CRITIC-INV-7 | M2-0011, M2-0183 |
| CRITIC-INV-8 | M2-0013 |
| CRITIC-INV-9 | M2-0018 |
| CRITIC-INV-10 | M2-0014 |
| CRITIC-INV-11 | M2-0025 |
| CRITIC-INV-12 | M2-0007, M2-0029 |
| CRITIC-INV-13 | M2-0019 |
| CRITIC-INV-14 | M2-0020 |
| CRITIC-INV-15 | M2-0017 |
| CRITIC-INV-16 | M2-0021 |

### ChatGPT top-10 actions → tickets

| Ref | Tickets |
|---|---|
| CHATGPT-A1 | M2-0002, M2-0006, M2-0008 |
| CHATGPT-A2 | M2-0046, M2-0066, M2-0098 |
| CHATGPT-A3 | M2-0033 |
| CHATGPT-A4 | M2-0027, M2-0028, M2-0029 |
| CHATGPT-A5 | M2-0040 |
| CHATGPT-A6 | M2-0036, M2-0098 |
| CHATGPT-A7 | M2-0030, M2-0032, M2-0067 |
| CHATGPT-A8 | M2-0007, M2-0009, M2-0046 |
| CHATGPT-A9 | M2-0002, M2-0012, M2-0025 |
| CHATGPT-A10 | M2-0002, M2-0046 |

### Primary ticket per r11 task

- TASK-001 → M2-0015; TASK-002 → M2-0016; TASK-003 → M2-0011; TASK-004 → M2-0009; TASK-005 → M2-0064; TASK-006 → M2-0121
- TASK-007 → M2-0120; TASK-008 → M2-0101; TASK-009 → M2-0139; TASK-010 → M2-0151; TASK-011 → M2-0102; TASK-012 → M2-0103
- TASK-013 → M2-0104; TASK-014 → M2-0107; TASK-015 → M2-0105; TASK-016 → M2-0108; TASK-017 → M2-0080; TASK-018 → M2-0109
- TASK-019 → M2-0081; TASK-020 → M2-0111; TASK-021 → M2-0115; TASK-022 → M2-0117; TASK-023 → M2-0162; TASK-024 → M2-0163
- TASK-025 → M2-0116; TASK-026 → M2-0164; TASK-027 → M2-0160; TASK-028 → M2-0095; TASK-029 → M2-0118; TASK-030 → M2-0093
- TASK-031 → M2-0122; TASK-032 → M2-0124; TASK-033 → M2-0082; TASK-034 → M2-0106; TASK-035 → M2-0125; TASK-036 → M2-0126
- TASK-037 → M2-0127; TASK-038 → M2-0128; TASK-039 → M2-0129; TASK-040 → M2-0130; TASK-041 → M2-0132; TASK-042 → M2-0140
- TASK-043 → M2-0141; TASK-044 → M2-0142; TASK-045 → M2-0158; TASK-046 → M2-0152; TASK-047 → M2-0153; TASK-048 → M2-0154
- TASK-049 → M2-0155; TASK-050 → M2-0155; TASK-051 → M2-0156; TASK-052 → M2-0157; TASK-053 → M2-0113; TASK-054 → M2-0169
- TASK-055 → M2-0176; TASK-056 → M2-0170; TASK-057 → M2-0149; TASK-058 → M2-0150; TASK-059 → M2-0165; TASK-060 → M2-0166
- TASK-061 → M2-0059; TASK-062 → M2-0159; TASK-063 → M2-0173; TASK-064 → M2-0174; TASK-065 → M2-0175; TASK-066 → M2-0183

---

## 8. Ledger fixer, coverage round 1 (Opus, 2026-09-26)

| Field | Value |
|---|---|
| Input | `plan-work/coverage-round-1.json` (mechanical check: 921/921 canonical ids mapped, 78/78 findings referenced, 1 schema error) |
| Output | `ledger/tickets.json`, now 186 tickets (M2-0185 new, M2-0186 new and CANCELLED); 47 existing tickets edited |
| Method | One python3 script (json load, asserted edits, validation, `json.dump` with indent=2, ensure_ascii=False). Backup of the prior file is in the session scratchpad (sha256 `52a3f166…13d6`). Nothing in the repo was run. |

**Summary.** The mechanical check found no unmapped id or finding, so the round had two jobs: fix the schema error, and confirm each mapping is real. The coverage count can pass even when an id sits on a ticket that does not implement it, so I reviewed every family against the kit text (registry.json, memory/SOURCES.json, v5 REQUIREMENTS and CAPABILITY-MATRIX).

### 8.1 Schema error: `PACKAGED_TESTED` is not a Stark level

- **OBSERVED:** Stark v9.3.0 `SKILL.md` names six distinct levels and says "Do not invent". `PACKAGED_TESTED` appears in no kit or method document. It was used on 21 tickets.
- **Fix:**
  - All 21 tickets now target `LIVE_VERIFIED`. Stark counts host execution as a separate evidence class, and running the packaged artifact on a real host (the QA account, the windows-qa lane, or the owner Mac under a throwaway userData) is host execution.
  - The tickets are M2-0008, 0027, 0028, 0029, 0036, 0042, 0044, 0046, 0066, 0081, 0083, 0084, 0085, 0093, 0095, 0096, 0098, 0160, 0168, 0173 and 0175.
- **Knock-on fixes:**
  - M2-0036, M2-0042 and M2-0095 run their packaged step on the QA host but did not depend on M2-0007. They now do: under the dependency rule, a ticket cannot claim more than its blocked input.
  - M2-0095 only listed unit tests. It gained a packaged right-edge walkthrough step.
  - M2-0184 (owner sign-off) now targets `ACCEPTED`, which is Stark's level for authorized acceptance. Before this change no ticket used `ACCEPTED`.
  - M2-0002 gained an acceptance line: `check.mjs` rejects any evidence level outside the six, and packaged-on-host runs are recorded as LIVE_VERIFIED with the artifact hash and host identity. This stops the invented level from coming back.

### 8.2 Mappings that did not implement the id (removed or moved)

| Id | Was on | Now | Why |
|---|---|---|---|
| R10 Apple PCC eligibility | M2-0084 (macOS accessibility adapters) | M2-0175 only | Unrelated to adapters. Almost certainly confused with HeyClicky REF-10. |
| R34 TypeSafe MCP | M2-0144 (Plane/ClickUp OAuth) | M2-0123 (Jev /v1/decide) | MASTER classes it as engineering-only typed decision tooling. The M2-0123 summary now says so. |
| SRC-01 source export is not a checkout | M2-0171 (release linter) | M2-0015, M2-0013, M2-0005 | Its exit evidence has three parts, each implemented by one ticket: checkout identity (M2-0015), the missing-vs-present manifest covering the 5 NOT_IN_EXPORT files (M2-0013), and baseline checks with skips explained (M2-0005). |

### 8.3 Ids held only by an investigation or a partial owner (implementer added)

Existing mappings that follow the kit's own task binding were kept. The missing implementer was added. Where the acceptance did not already name the obligation, a line was added.

- **Historical findings dispositioned only by M2-0013:**
  - F-06 → M2-0082 and M2-0083.
  - F-07 → M2-0084 and M2-0085.
  - F-20 → M2-0103 and M2-0159.
- **Windows adapters (M2-0085).** Its acceptance says "same UC set as macOS", but it carried none of those UCs. It now carries UC-009..016, UC-025, UC-026, UC-031, UC-040, COV-11, AGSTEP-11 and F-07. A UC with no Windows equivalent returns an explicit unsupported result.
- **Speech and command path:**
  - UC-003 (typed input) → M2-0083. Its acceptance now requires the same policy and verification path with no microphone.
  - UC-065 and COV-16 → M2-0112, whose whole purpose is making Cloudflare the fresh-profile default.
- **Hindsight observations pinned only by M2-0020:**
  - HS-01 → M2-0134.
  - HS-14 → M2-0135.
  - HS-18 → M2-0138.
- **HeyClicky observations:**
  - HC-04 → M2-0082 (Cua evaluation, one trusted executor).
  - HC-16 → M2-0099, together with MB-17 (exact agent resolution, ambiguous references asked back).
  - HC-29 → M2-0118 (windowless and shutdown lifecycle).
  - HC-30 → M2-0105 (no copied telemetry SDKs or IDs) and M2-0168 (independent feed and artifact verification).
  - HC-09 → M2-0142 (scoped artifact handles).
- **Experience requirements:**
  - EXP-08 → M2-0146 (entitlement authority and lease failure boundaries).
  - EXP-12 → M2-0178 (no comparative claim without receipts) and the new M2-0185.
- **Owner commitments:**
  - COV-01 → M2-0183.
  - COV-37 → M2-0153 and M2-0154.
  - COV-38 → M2-0155 and M2-0156.
- **Connector readiness (M2-0144).** The ticket holds AGX-11 and AGSTEP-12, but its acceptance only covered rejected tokens and pagination. It now also requires:
  - a probed Ready state;
  - typed write schemas with readback;
  - trusted OAuth scope upgrades.

### 8.4 New tickets

- **M2-0185 (W9, m12, sonnet, target MEASURED): EXP-12 competitive qualification.**
  - No ticket ran the comparison. M2-0009 covers only the footprint half.
  - The protocol is pre-registered, runs on the frozen candidate and uses synthetic meetings only. No owner or client content enters any competitor product.
  - BLOCKED on the program owner, who must choose the products (candidates are R81..R85) and provide legitimate accounts.
  - Depends on M2-0009, M2-0113 and M2-0173.
- **M2-0186 (W8, m10, process, CANCELLED): Apple public signing, notarization and public DMG publication.**
  - Reason: this is the only exclusion in GOAL.json `out_of_scope`.
  - It carries the excluded slice of TASK-065 and COV-06, so the matrix shows that slice as excluded, not missing. The in-scope part stays on M2-0175.
  - It adds a `reason` field that no other ticket has. The M2-0002 and M2-0011 tooling must accept it.

### 8.5 Scope corrections

- **M2-0175.** The summary and blocker had claimed "PCC eligibility/entitlement out of scope". GOAL.json excludes only Apple public signing. Now:
  - PCC eligibility for a development-signed candidate is **UNKNOWN**. R10 names App Store distribution and eligible testing.
  - PCC is BLOCKED on the Apple Developer account holder, with the exact check to run.
  - PCC inherits the M2-0186 exclusion only if it needs public or App Store distribution signing.
- **M2-0156.** The unblock step offered "confirm Zoom/Meet out of scope". Now the adapters stay flagged and show BLOCKED in the capability matrix (UC-111). An exclusion would need an owner-approved change to GOAL.json.

### 8.6 Verification of this round (python3 over the written file)

- **Coverage:** 921/921 canonical ids mapped, including by non-CANCELLED tickets alone. No orphan kit refs. Every TASK-001..066 still has an active ticket.
- **Findings:** 78/78 checked findings are referenced. `finding_refs` are byte-identical to before.
- **Schema:**
  - Every evidence_target is one of the six Stark levels: LOCALLY_TESTED 113, LIVE_VERIFIED 29, DESIGNED 28, HOST_CONFIGURED 8, MEASURED 7, ACCEPTED 1.
  - No duplicate ids or refs. No unknown dependencies and no cycles. Every dependency points to an earlier id. All required fields are present.
  - Design and video tickets are all Opus-owned.
- **Privacy scan:** no emails, no 32-hex ids, no key-like strings.

### 8.7 Residuals for the validator

- **Wave order.** M2-0186 is W8 but numbered after M2-0185 (W9). This breaks the builder's incidental "waves non-decreasing by id" property. Dependency order is intact, and the wave field is what views group by.
- **Totals.** The effort total is now 2,029 h (DERIVED: 2,017 + 12). W8 has 17 tickets, 1 of them cancelled at 0 h. W9 has 10 tickets and 108 h. The tables in sections 4 and 5 predate this round.
- **Coverage depth.** The review went family by family. The finding-to-ticket appendix above was spot-checked, not re-derived. Mappings that follow the kit's own task binding were kept even where a more specific implementer was added.
