# Review source index

This index maps the source names used by the `finding_refs` convention in
`SYNTHESIS-NOTES.md` to committed source files.

`K01`-`K09`'s `-DEC-*`, `-BLK-*` and `-CONFLICT-*` refs are keyword-level slugs over each lane's decision/blocker/conflict lists in `SYNTHESIS-NOTES.md`'s convention; they are located in the lane file by reading its decisions/blockers/conflicts section, not by an exact-phrase match. For example, `K03-DEC-knowledge-model` and `K06-DEC-native-onboarding` do not appear as literal strings in `lanes/K03-master-s15-20.md` or `lanes/K06-master-s32-35.md` (confirmed by grep). The same DEC/BLK/CONFLICT slugs are keyword-level in the uncommitted `KIT-REQUIREMENTS.json`, whose `open_decisions`, `blockers` and `conflicts_or_contradictions` are plain-string lists rather than a complete id registry. Bare `K0x-*` refs may be literal lane ids when the lane itself carries them; for example `K03-16.6-03` appears verbatim in `lanes/K03-master-s15-20.md`. `K07-SEQ-01` is a literal `requirements[].id` sequencing requirement in the uncommitted kit requirements; in this committed set, locate it at `lanes/K07-kit-other.md` line 215, item 3: "P1 fixes (#196/#197, right-edge input) ... ship independent of and before the Hindsight/agent-expansion work."

## Committed sources

| Source name / `finding_refs` pattern | Committed path or paths |
|---|---|
| `BUG-ROOT-CAUSES` (`B1-RC*`, `B2-F*`, `B3-RC*`) | `docs/metis-2.0/review/plan-inputs/BUG-ROOT-CAUSES.json` |
| `CODE-FINDINGS` | `docs/metis-2.0/review/plan-inputs/CODE-FINDINGS.json` |
| `COVERAGE-CRITIC` (`CRITIC-INV-*`, `CRITIC-CON-*`, `CRITIC-CODE-*`, `CRITIC-KIT-*`) | `docs/metis-2.0/review/plan-inputs/COVERAGE-CRITIC.json` |
| `UNCOVERED-MAIN` (`P4-F*`, `P4-SRC04`) | `docs/metis-2.0/review/prep/UNCOVERED-MAIN.md` |
| `UNCOVERED-RENDERER-OPS` (`P5-F*`) | `docs/metis-2.0/review/prep/UNCOVERED-RENDERER-OPS.md` |
| `DOCS-RECONCILE` (`P6-DOCS`) | `docs/metis-2.0/review/prep/DOCS-RECONCILE.md` |
| `FREEZE-HYPOTHESES` (`P7-RANK*`, `P7-INSTR`) | `docs/metis-2.0/review/prep/FREEZE-HYPOTHESES.md` |
| `HERMETIC-TESTS` (`P8-HERMETIC`, `P8-QUARANTINE-GUARD`) | `docs/metis-2.0/review/prep/HERMETIC-TESTS.md` |
| `KIT-PATCHES` (`KP-*`) | `docs/metis-2.0/review/prep/KIT-PATCHES.md` |
| ChatGPT audit (`CHATGPT-A*`) | `docs/metis-2.0/review/chatgpt-audit-1.md`; `docs/metis-2.0/review/chatgpt-audit-2.md` |
| `RUNTIME-EVIDENCE` (`RUNTIME-*`) | `docs/metis-2.0/review/RUNTIME-EVIDENCE.md` |
| GitHub (`GH-PR-*`, `GH-ISSUE-*`) | `docs/metis-2.0/review/prep/GITHUB.md`; `github.com` remains authoritative for the live PR or issue state |
| `ARCH-4.2-ROLLBACK` | `docs/metis-2.0/ARCHITECTURE.md` section 4.2; this committed source lives outside `docs/metis-2.0/review/` |
| Lane `B1` (`B1-*`) | `docs/metis-2.0/review/lanes/B1-history-freeze.md` |
| Lane `B2` (`B2-*`, `B2-OTHER-F5`) | `docs/metis-2.0/review/lanes/B2-resource-heavy.md` |
| Lane `B3` (`B3-*`) | `docs/metis-2.0/review/lanes/B3-crash-stability.md` |
| Lane `K01` (`K01-R*`, `K01-DEC-*`, `K01-BLK-*`, `K01-CONFLICT-*`, bare `K01-*`) | `docs/metis-2.0/review/lanes/K01-master-s0-7.md` |
| Lane `K02` (`K02-R*`, `K02-DEC-*`, `K02-BLK-*`, `K02-CONFLICT-*`, bare `K02-*`) | `docs/metis-2.0/review/lanes/K02-master-s8-14.md` |
| Lane `K03` (`K03-R*`, `K03-DEC-*`, `K03-BLK-*`, `K03-CONFLICT-*`, bare `K03-*`, for example `K03-16.6-03`) | `docs/metis-2.0/review/lanes/K03-master-s15-20.md` |
| Lane `K04` (`K04-R*`, `K04-DEC-*`, `K04-BLK-*`, `K04-CONFLICT-*`, bare `K04-*`) | `docs/metis-2.0/review/lanes/K04-tasks-registry.md` |
| Lane `K05` (`K05-R*`, `K05-DEC-*`, `K05-BLK-*`, `K05-CONFLICT-*`, bare `K05-*`) | `docs/metis-2.0/review/lanes/K05-master-s22-31.md` |
| Lane `K06` (`K06-R*`, `K06-DEC-*`, `K06-BLK-*`, `K06-CONFLICT-*`, bare `K06-*`) | `docs/metis-2.0/review/lanes/K06-master-s32-35.md` |
| Lane `K07` (`K07-R*`, `K07-DEC-*`, `K07-BLK-*`, `K07-CONFLICT-*`, bare `K07-*`) | `docs/metis-2.0/review/lanes/K07-kit-other.md` |
| Lane `K08` (`K08-R*`, `K08-DEC-*`, `K08-BLK-*`, `K08-CONFLICT-*`, bare `K08-*`) | `docs/metis-2.0/review/lanes/K08-v6-v5-lineage.md` |
| Lane K09, requirement refs (`K09-R01`..`K09-R30`) | `docs/metis-2.0/review/plan-inputs/PRIOR-EXECUTION.json`, its `requirements[].id` field — each ref is a literal id present verbatim in the committed JSON. |
| Lane K09, decision/blocker/conflict refs (`K09-DEC-*`, `K09-BLK-*`, `K09-CONFLICT-*`, bare `K09-*`) | `docs/metis-2.0/review/lanes/K09-prior-execution.md` — see the opening note above on how K01-K09's DEC/BLK/CONFLICT refs resolve (they are not literal-string matches). |
| Lane `K10` (`K10-R*`, `K10-DEC-*`, `K10-BLK-*`, `K10-CONFLICT-*`, bare `K10-*`) | `docs/metis-2.0/review/lanes/K10-git-github.md` |
| Lane `L01` (`L01-*`) | `docs/metis-2.0/review/lanes/L01-main-lifecycle.md` |
| Lane `L02` (`L02-*`) | `docs/metis-2.0/review/lanes/L02-main-sidecars-ai.md` |
| Lane `L03` (`L03-*`) | `docs/metis-2.0/review/lanes/L03-main-data-history.md` |
| Lane `L04` (`L04-*`, `F-L04-*`) | `docs/metis-2.0/review/lanes/L04-main-capture-speech.md` |
| Lane `L05` (`L05-*`) | `docs/metis-2.0/review/lanes/L05-main-security-integrations.md` |
| Lane `L06` (`L06-*`) | `docs/metis-2.0/review/lanes/L06-renderer-core.md` |
| Lane `L07` (`L07-*`) | `docs/metis-2.0/review/lanes/L07-renderer-components.md` |
| Lane `L08` (`L08-*`) | `docs/metis-2.0/review/lanes/L08-shared-contracts-preload.md` |
| Lane `L09` (`L09-*`) | `docs/metis-2.0/review/lanes/L09-operator-cloud.md` |
| Lane `L10` (`L10-*`) | `docs/metis-2.0/review/lanes/L10-intelligence-native.md` |
| Lane `L11` (`L11-*`) | `docs/metis-2.0/review/lanes/L11-build-ci-quality.md` |
| Lane `L12` (`L12-*`) | `docs/metis-2.0/review/lanes/L12-arch-graph.md` |
| Codex audit round 2 (`RF-AUDIT-R2-*`) | `docs/metis-2.0/review/codex/audit-r2.txt`. Ledger-cited refs are `RF-AUDIT-R2-B1` (`M2-0217`), the file's one `blocker:` line, and `RF-AUDIT-R2-R1` (`M2-0218`) / `RF-AUDIT-R2-R2` (`M2-0219`), its two `risk:` lines in order. |
| Codex audit round 3 (`RF-AUDIT-R3-*`) | `docs/metis-2.0/review/codex/audit-r3.txt`. Ledger-cited refs are `RF-AUDIT-R3-B1` (`M2-0221`), the file's one `blocker:` line; `RF-AUDIT-R3-R1` (`M2-0222`), `RF-AUDIT-R3-R3` and `RF-AUDIT-R3-R4` (`M2-0223`), three of its four `risk:` lines. `RF-AUDIT-R3-R5` (`M2-0224`) resolves to the file's fourth `rock:` line, "Replace renderer-ready source contract with wiring behavior"; the `R5` suffix does not mean "5th risk line" here. |
| Codex audit round 4 (`RF-AUDIT-R4-*`) | `docs/metis-2.0/review/codex/audit-r4.txt`. Ledger-cited refs `RF-AUDIT-R4-R1` and `RF-AUDIT-R4-R2` (both `M2-0227`) are the file's two `risk:` lines in order. |
| `RF-MEET-R1-Q` | `docs/metis-2.0/review/codex/meet-r1.txt` (`M2-0216`), the file's single `question:` line: "PLAN.md:14 says explicit rebuild remains the repair path for a permanently lost key, but the preserved prior index is then outside the purged tree; what user-visible restore/delete path owns `.brain-preserved`?" |
| `RF-MEET-R2-B5` | `docs/metis-2.0/review/codex/meet-r2.txt` (`M2-0216`). The file has 5 labelled `blocker:` lines followed by `VERDICT: REVISE`; `B5` means the file's 5th (last) `blocker:` line. Its 5th blocker line: ".rocket-fuel/PLAN.md:17 says a restore UI follow-up ledger ticket will be filed, but `rg "brain-preserved\|restore of a preserved\|offer restore" /Users/<redacted-user>/AI-Brain-build/metis-2.0-program/docs/metis-2.0/ledger` finds no existing ticket; missing_evidence for the ownership/restore path." |
| `GIT-TRACE-REC` | `docs/metis-2.0/review/lanes/K10-git-github.md`, cited by `M2-0025`, `M2-0049`, `M2-0188`. This is a 12-item positional list from an uncommitted `GIT-STATE.json`'s top-level `traceability_recommendations` field; the top-level `report_path` names this lane. Items 1-10 are §12's 10 numbered recommendations in order; item 11 is §2's finding that no local "2.0" branch exists on GitHub; item 12 is §2/§13's finding that `codex/operator-ux-rock-1` has a misconfigured upstream and no open PR. `GIT-STATE.json` itself is not committed (outside this ticket's acceptance list) but the positional rule is fully documented here so the ref is checkable. |
| `PUBLIC-AUDIT-B1` | `docs/metis-2.0/review/PUBLIC-READINESS.md`, section "B1 — Secret rotation" (`M2-0214`). |
| `M2-0013-SRC-13-DEFAULT-ON` | `docs/metis-2.0/review/SRC-REVERIFY.md` §SRC-13 (`M2-0226`), which documents `speakerId` defaulting to `{ enabled: true }` in `src/shared/ipc.ts`. |
| `OWNER-2026-09-26-REMOVE-CAHE` | `docs/metis-2.0/DECISIONS.md` D-30 (`M2-0214`), the owner's 2026-09-26 decision to remove the Cahê edition entirely. |
| `RF-G5.5-R2` | `docs/metis-2.0/designs/M2-0225-DESIGN.md` (`M2-0225`). This is the finding's committed analysis/design record: it names and analyses `RF-G5.5-R2` as its subject and specifies the fix; it is not the original raw audit text where the finding first appeared. |

## Runtime evidence label key

`RUNTIME-EVIDENCE.md` itself carries no E-numbered headings; the E1-E9 labels are lane-prose shorthand cross-referenced here in one place.

| Label | Lane meaning | Substantiated by `RUNTIME-EVIDENCE.md` | Not in `RUNTIME-EVIDENCE.md` |
|---|---|---|---|
| E1 | The 3.3GB local-llm directory size. | "## Installed app" (lines 5-7). | Nothing material noted here. |
| E2 | Orphaned `llama-server`/`chrome_crashpad_handler` processes, ppid=1. | "## Processes" (lines 9-17). | Nothing material noted here. |
| E3 | 8 `app.started` events in one day, no clean-shutdown event type. | "## audit.log" (lines 19-22, specifically the `app.started` timestamp list). | Nothing material noted here. |
| E4 | Post-launch sequence: `brain.consolidation`, ~20 `brain.ingest(source=meetings)` events within 200 ms, `local.runtime.start`, 30-41 s cold `llm.call`, with some `brain.ingest ok:false` (`B2-resource-heavy.md` line 66, `L02-main-sidecars-ai.md` line 76, `L03-main-data-history.md` line 15). | The two `llm.call provider=local ttaMs=41282` / `29637` lines (lines 27-28) and the `brain.ingest` total count (line 20). | `brain.consolidation`, the ~20-event burst, the 200 ms window, `local.runtime.start` in sequence, and `ok:false` are absent. |
| E5 | `capture.failed` x5394 because Screen Recording permission is off, `phase=bg-screen`, roughly every 6 s (`B2-resource-heavy.md` lines 77-88, `L04-main-capture-speech.md` lines 46-55). | The `capture.failed 5394` count (line 20). | "Screen Recording permission is off", `phase=bg-screen`, and the ~6 s cadence are absent. |
| E6 | Crash-record set: `render-process-gone reason=killed`, `app.unresponsive`, `unhandledRejection`, `boot-early-death`, `safe_start`, `createWindow_retry`, and Crashpad/minidump evidence (`B3-crash-stability.md` sections 1 and 3, `L04-main-capture-speech.md` section 1.2, `K10-git-github.md` lines 131-134). | Event counts (line 20), `render-process-gone` / `app.unresponsive` records (lines 25-26), `unhandledRejection` dates (line 30), and crash artefacts (line 33). | The lanes' counts differ from this file: lanes say `unhandledRejection` x6 and `boot-early-death` x9, while this file says 5 and 10. `boot_step createWindow_retry` and `safe_start` are absent. |
| E7 | Crashpad pending minidumps. | "## Crash artefacts" (lines 32-34). | Nothing material noted here. |
| E8 | `local.runtime.start` x62 vs `local.runtime.stop` x108 (accounting mismatch). | "## audit.log" (line 20, event counts). | Nothing material noted here. |
| E9 | `SingletonLock` present. | "## Installed app" (line 7). | Nothing material noted here. |

## External / not committed to this ticket

| `finding_refs` pattern or id | Status |
|---|---|
| `M2-0006-VAL-R3-ADV1` | Cited by `M2-0220`. This is advisory finding 1 from the Opus round-3 validation of ticket `M2-0006` — that validation record itself was never committed anywhere (`docs/metis-2.0/ledger/tickets/M2-0006.md`'s own "Validation (Opus)" section is empty, and `M2-0220`'s ticket summary is the only place this finding's content survives, in paraphrase: "run-observability keeps its own `suspended` flag duplicating StallMonitor's paused state..."). Whole-repo grep for `M2-0006-VAL-R3-ADV1` matches only `tickets.json` and this README row. |
