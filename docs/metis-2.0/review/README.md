# Review source index

This index maps the source names used by the `finding_refs` convention in
`SYNTHESIS-NOTES.md` to committed source files.

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
| Lane `K09` (`K09-R*`, `K09-DEC-*`, `K09-BLK-*`, `K09-CONFLICT-*`, bare `K09-*`) | `docs/metis-2.0/review/lanes/K09-prior-execution.md` |
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
| `PUBLIC-AUDIT-B1` | `docs/metis-2.0/review/PUBLIC-READINESS.md`, section "B1 — Secret rotation" (`M2-0214`). |
| `M2-0013-SRC-13-DEFAULT-ON` | `docs/metis-2.0/review/SRC-REVERIFY.md` §SRC-13 (`M2-0226`), which documents `speakerId` defaulting to `{ enabled: true }` in `src/shared/ipc.ts`. |
| `OWNER-2026-09-26-REMOVE-CAHE` | `docs/metis-2.0/DECISIONS.md` D-30 (`M2-0214`), the owner's 2026-09-26 decision to remove the Cahê edition entirely. |
| `RF-G5.5-R2` | `docs/metis-2.0/designs/M2-0225-DESIGN.md` (`M2-0225`). This is the finding's committed analysis/design record: it names and analyses `RF-G5.5-R2` as its subject and specifies the fix; it is not the original raw audit text where the finding first appeared. |

## External / not committed to this ticket

| `finding_refs` pattern or id | Status |
|---|---|
| `RF-MEET-R1-Q` | Cited by `M2-0216`. This ref points at meeting-derived audit content; this ticket's scope and this repo's confidentiality rule exclude meeting content from the repository entirely, so no committed source can exist here by design. This is the intended boundary, not a source gap to close. |
| `RF-MEET-R2-B5` | Cited by `M2-0216`. This ref points at meeting-derived audit content; this ticket's scope and this repo's confidentiality rule exclude meeting content from the repository entirely, so no committed source can exist here by design. This is the intended boundary, not a source gap to close. |
| `M2-0006-VAL-R3-ADV1` | Cited by `M2-0220`. Whole-repo grep for `M2-0006-VAL-R3-ADV1` matches only `docs/metis-2.0/ledger/tickets.json` and this README row, so no committed source names this exact ref string. |
| `GIT-TRACE-REC` | Cited by `M2-0025`, `M2-0049` and `M2-0188`. Candidate follow-up: the expected source is a `GIT-STATE.json` snapshot, but that file was never in ticket `M2-0021`'s acceptance list (`BUG-ROOT-CAUSES`, `CODE-FINDINGS`, `COVERAGE-CRITIC`, lane reports, prep reports and `RUNTIME-EVIDENCE`); do not add `GIT-STATE.json` here. |
