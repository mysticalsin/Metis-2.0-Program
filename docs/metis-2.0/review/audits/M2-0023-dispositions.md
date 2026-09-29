# M2-0023 Independent Audit Dispositions

Retrieval date: 2026-09-28.

## Evidence and Boundary

- OBSERVED `docs/metis-2.0/ledger/tickets.json:1504-1548`: M2-0023 requires saved ChatGPT and Codex audits, dispositioned findings, no reviewer approving work it produced, and DESIGNED evidence.
- OBSERVED `docs/metis-2.0/review/audits/M2-0023-chatgpt-audit.md:3-9`: the M2-0023 ChatGPT audit artifact covers the plan, architecture, ledger, prior ChatGPT artifact boundary, and graph/wiki fallback.
- OBSERVED `docs/metis-2.0/review/audits/M2-0023-codex-readonly-review.md:3-9`: the M2-0023 Codex artifact records a current-session document/process review claim, but also records that nested `codex exec --sandbox read-only` failed before review with `Operation not permitted`.
- OBSERVED `docs/metis-2.0/review/codex/audit-r1.txt:1-13`, `audit-r2.txt:1-8`, `audit-r3.txt:1-10`, `audit-r4.txt:1-13`: the earlier lead-provided Codex artifacts exist and each records findings plus `VERDICT: REVISE`. PROVIDED (lead ruling 2026-09-28, `codex-queue/state/M2-0023.lead`): these four are the Codex read-only review artifacts for M2-0023, run by the lead outside any sandbox on 2026-09-26/27; the nested `codex exec` attempt is not the artifact.
- OBSERVED `docs/metis-2.0/review/chatgpt-audit-1.md:3-7`: the earlier ChatGPT artifact is an independent engineering audit with an explicit boundary; DERIVED it remains a finding source but is not the M2-0023-specific PLAN/ARCHITECTURE/ledger audit artifact.
- OBSERVED `docs/metis-2.0/PLAN.md:42-50`: Opus, ChatGPT and Codex have separate roles; ChatGPT audits, Codex reviews after quota reset, and a reviewer never approves its own work.
- OBSERVED `docs/metis-2.0/ledger/tickets.json:213-217`: the evidence model requires records before DONE and requires `implementer_session` to differ from `validator_session`.
- OBSERVED `docs/metis-2.0/ARCHITECTURE.md:14`: architecture components are at DESIGNED.
- DERIVED from the sources above: M2-0023 is a disposition/evidence ticket, not proof that any reviewed implementation is correct.

## Acceptance State

| Criterion | Disposition |
|---|---|
| ChatGPT audit of PLAN, ARCHITECTURE and ledger saved; each finding dispositioned | ACCEPTED. OBSERVED the M2-0023-specific artifact is `docs/metis-2.0/review/audits/M2-0023-chatgpt-audit.md` (`M2-0023-chatgpt-audit.md:3-9`); OBSERVED its findings `CGPT-M2-0023-01` through `CGPT-M2-0023-05` are dispositioned below with file:line sources. |
| Codex read-only review run after quota resets; findings dispositioned | ACCEPTED (amended 2026-09-29 by lead ruling). PROVIDED `codex-queue/state/M2-0023.lead` (2026-09-28): the Codex read-only reviews are `review/codex/audit-r1.txt` through `audit-r4.txt`, run by the lead outside any sandbox on 2026-09-26/27, and nested Codex is not run. OBSERVED every r1-r4 finding is dispositioned below (R1-01 to R4-05). The failed nested `codex exec` at `M2-0023-codex-readonly-review.md:8` is kept only as a record of that attempt, not as the artifact. |
| No reviewer approves work it produced | ACCEPTED for the artifacts present here. OBSERVED `docs/metis-2.0/PLAN.md:47-50` separates validator/ChatGPT/Codex roles and forbids self-approval; OBSERVED the audit artifacts record findings/revise/blocker states rather than approval. |

Resolved 2026-09-29 (lead): nested Codex is not run (lead ruling, `codex-queue/state/M2-0023.lead`); `review/codex/audit-r1.txt` through `audit-r4.txt` are the Codex review artifacts, and the acceptance row above is amended.

## M2-0023 ChatGPT Findings

| ID | Source | Disposition | Reason |
|---|---|---|---|
| CGPT-M2-0023-01 | `M2-0023-chatgpt-audit.md:13-18` | ACCEPTED -> LEAD_ACTION below | OBSERVED the audit says ledger disposition cannot be satisfied under the no-ledger-edit constraint. OBSERVED M2-0023 requires every finding to be dispositioned in the ledger (`tickets.json:1528`). DERIVED only the lead can complete the program-ledger disposition. |
| CGPT-M2-0023-02 | `M2-0023-chatgpt-audit.md:20-25` | ACCEPTED -> LEAD_ACTION below | OBSERVED the generated ticket still reflects open status. OBSERVED M2-0023 status is `TODO` (`tickets.json:1547`). DERIVED generated status cannot be corrected from the audit scope alone. |
| CGPT-M2-0023-03 | `M2-0023-chatgpt-audit.md:27-33` | ACCEPTED -> this disposition record | OBSERVED M2-0023 summary includes architecture (`tickets.json:1528`) and ChatGPT acceptance explicitly includes PLAN/ARCHITECTURE/ledger (`tickets.json:1530`). DERIVED the audit scope must include `ARCHITECTURE.md`; this disposition file treats architecture as required scope. |
| CGPT-M2-0023-04 | `M2-0023-chatgpt-audit.md:35-42` | ACCEPTED -> LEAD_ACTION below | OBSERVED the prompt forbids repository tests/scripts/apps and PLAN restricts tests (`PLAN.md:35`, `PLAN.md:305`). OBSERVED public `origin/m2/integration:package.json` defines `typecheck` as `tsc` checks plus repository scripts. DERIVED tsc bars are outside this session and must be verified by the lead in the allowed environment. |
| CGPT-M2-0023-05 | `M2-0023-chatgpt-audit.md:44-49` | ACCEPTED -> LEAD_ACTION below | OBSERVED traceability remains not-started until ledger update. DERIVED generated trace refresh is lead-owned because ledger edits/generated ledger pages are forbidden here. |

LEAD_ACTION: Update `docs/metis-2.0/ledger/tickets.json` with M2-0023 finding dispositions and status/evidence if the lead accepts this disposition record.
LEAD_ACTION: Regenerate `docs/metis-2.0/ledger/tickets/M2-0023.md` and traceability for R15/R90/R91/R92/R93 after the ledger update.
Resolved 2026-09-29 (lead): typecheck evidence is the public Build & Test run 36501359360 on `m2/integration` at `83fd757cc0200b2ac76d158a05bb3fbf5bcf5a91` (push, 2026-09-29T00:05:35Z, conclusion success): `npm run typecheck` passed in Quality checks on ubuntu-latest and windows-latest, and the Operator Worker job's typecheck steps (Worker, client) passed (read-only `gh run view 36501359360 -R mysticalsin/AskToto-Mantu --json conclusion,headSha,jobs`).

## M2-0023 Codex Findings

| ID | Source | Disposition | Reason |
|---|---|---|---|
| CX-M2-0023-01 | `M2-0023-codex-readonly-review.md:13-18` | ACCEPTED -> LEAD_ACTION above | OBSERVED the Codex artifact says program-ledger disposition is missing and cannot be added here. OBSERVED only the lead can edit `docs/metis-2.0/ledger/` under the owner constraint. |
| CX-M2-0023-02 | `M2-0023-codex-readonly-review.md:20-26` | ACCEPTED -> LEAD_ACTION above | OBSERVED the Codex artifact says the ticket and traceability still show not done. OBSERVED M2-0023 status is `TODO` (`tickets.json:1547`). DERIVED generated status/traceability refresh remains lead-owned. |
| CX-M2-0023-03 | `M2-0023-codex-readonly-review.md:28-33` | ACCEPTED -> this disposition record | OBSERVED the Codex artifact says architecture belongs in scope. DERIVED this is correct because M2-0023 summary includes the architecture target (`tickets.json:1528`). |
| CX-M2-0023-04 | `M2-0023-codex-readonly-review.md:35-40` | RESOLVED by lead ruling (2026-09-29) | OBSERVED nested `codex exec --sandbox read-only` failed before review (`M2-0023-codex-readonly-review.md:8`). PROVIDED `codex-queue/state/M2-0023.lead`: nested Codex is not run; the Codex review artifacts are `review/codex/audit-r1.txt` through `audit-r4.txt`, whose findings are dispositioned below, so the acceptance criterion rests on them. |
| CX-M2-0023-05 | `M2-0023-codex-readonly-review.md:42-48` | ACCEPTED -> LEAD_ACTION above | OBSERVED repository tests/scripts/apps are forbidden and `typecheck` includes repository scripts. DERIVED tsc evidence must come from the allowed lead/CI lane. |

## Prior ChatGPT Findings From `review/chatgpt-audit-1.md`

| ID | Source | Disposition | Reason |
|---|---|---|---|
| CGPT-01 | `chatgpt-audit-1.md:16-31` | ACCEPTED -> M2-0008, M2-0036, M2-0040, M2-0037 | OBSERVED ChatGPT rejects the unproven `window.confirm`/`isResponsive()` theory. OBSERVED M2-0008 says that theory is refuted and uses OS-level repro evidence (`tickets.json:606-645`). OBSERVED M2-0036 owns reveal paths (`tickets.json:2251-2309`), M2-0040 owns native dialogs (`tickets.json:2465-2514`), and M2-0037 owns bounded renderer reload (`tickets.json:2313-2357`). |
| CGPT-02 | `chatgpt-audit-1.md:44-68` | ACCEPTED -> M2-0008, M2-0030, M2-0031, M2-0193, M2-0194 | OBSERVED ChatGPT lists alternative History/reopen/storage/crash/root-cause investigations. OBSERVED M2-0030 covers the storage gateway (`tickets.json:1902-1960`), M2-0031 covers `.brain` and meeting-root readers (`tickets.json:1973-2035`), M2-0193 covers History list/search (`tickets.json:2033`), and M2-0194 reruns the matrix with observability (`PLAN.md:126`). |
| CGPT-03 | `chatgpt-audit-1.md:74-115` | ACCEPTED -> M2-0026, M2-0027, M2-0029, M2-0033, M2-0195 | OBSERVED ChatGPT accepts orphaning and retry defects while requiring Windows/resource evidence. OBSERVED M2-0026 is stopAll (`tickets.json:1665-1722`), M2-0027 is identity-safe registry/reaper (`tickets.json:1732-1782`), M2-0029 is Windows sidecar ownership (`tickets.json:1858-1899`), M2-0033 is retry/exhaustion policy (`tickets.json:2085-2145`), and Windows evidence is required in the managed Windows lane (`PLAN.md:175`, `ARCHITECTURE.md:631`). |
| CGPT-04 | `chatgpt-audit-1.md:121-133` | ACCEPTED -> M2-0040, M2-0036 | OBSERVED ChatGPT requires one async navigation guard, Save/Discard/Cancel semantics, AST-aware ban, and reveal before modal display. OBSERVED M2-0040 covers the async guard (`tickets.json:2465-2514`) and its acceptance explicitly requires reveal/expand before showing the modal (`tickets.json:2496`). |
| CGPT-05 | `chatgpt-audit-1.md:135-158` | ACCEPTED -> M2-0066, M2-0037, ARCH ADR-004/005 | OBSERVED ChatGPT requires durable draft recovery before automatic renderer reset. OBSERVED M2-0066 owns the durable local journal and zero-loss acknowledged revisions (`tickets.json:3887-3923`). OBSERVED Architecture ADR-004/005 ties reveal/recovery to journal-gated recovery (`ARCHITECTURE.md:545-546`). |
| CGPT-06 | `chatgpt-audit-1.md:159-194` | ACCEPTED -> M2-0027, M2-0028, M2-0029 | OBSERVED ChatGPT requires identity-safe child ownership and hard-kill tests. OBSERVED M2-0027 owns registry/reaper (`tickets.json:1732-1782`), M2-0028 owns mac-helper supervision (`tickets.json:1786-1854`), and M2-0029 owns Windows HK-W (`tickets.json:1858-1899`). |
| CGPT-07 | `chatgpt-audit-1.md:196-214` | ACCEPTED -> M2-0033 | OBSERVED ChatGPT separates resume, maintenance and explicit retry. OBSERVED M2-0033 summary and acceptance cover one retry/exhaustion function, boot quiet period and ledger-unavailable suspension (`tickets.json:2085-2145`). |
| CGPT-08 | `chatgpt-audit-1.md:215-230` | ACCEPTED -> M2-0030, M2-0031, M2-0191, M2-0193 | OBSERVED ChatGPT rejects per-call limits and `Promise.race` as sufficient. OBSERVED Architecture C4/ADR-021 uses global admission and holds permits until OS operations settle (`ARCHITECTURE.md:284`, `ARCHITECTURE.md:547`, `ARCHITECTURE.md:563`). OBSERVED M2-0191 detects cloud-only files before reads (`tickets.json:1962`), and M2-0193 moves History list/search to the gateway (`tickets.json:2033`). |
| CGPT-09 | `chatgpt-audit-1.md:231-245` | ACCEPTED -> M2-0009, M2-0046 | OBSERVED ChatGPT requires explicit resource accounting. OBSERVED PLAN budgets define sidecar, storage-stress, History, CPU, memory and owner-stability targets (`PLAN.md:178-193`). OBSERVED M2-0046 gates the tested 1.9.7 artifact (`tickets.json:2796-2869`). |
| CGPT-10 | `chatgpt-audit-1.md:247-272` | ACCEPTED -> PLAN gates, M2-0011, external-blocker handling | OBSERVED ChatGPT supports stabilization before broad refactor and asks for dependency graph/external unblock discipline. OBSERVED PLAN waves/gates and critical path (`PLAN.md:76-80`, `PLAN.md:132-146`) and traceability generation by M2-0011 (`tickets.json:771-821`). |
| CGPT-11 | `chatgpt-audit-1.md:274-296` | ACCEPTED -> M2-0002, M2-0187, M2-0199 | OBSERVED ChatGPT identifies false closure as the biggest risk. OBSERVED M2-0002 exists to prevent false closure (`tickets.json:177-249`), M2-0187 builds/tests/promotes the same bytes (`ARCHITECTURE.md:637-641`), and M2-0199 closes owner bugs only on owner-machine evidence (`PLAN.md:21-23`, `PLAN.md:148`). |
| CGPT-12 | `chatgpt-audit-1.md:298-359` | ACCEPTED -> PLAN/ARCH verification suites | OBSERVED ChatGPT lists the required History and resource tests. OBSERVED PLAN acceptance matrix includes ST-1, EX, RV, RC, HK, Census/RG and Windows parity (`PLAN.md:195-214`); OBSERVED Architecture test table defines HK/ST/EX/RV/RC/JR/IX/RG/GF/OWN (`ARCHITECTURE.md:573-588`). |
| CGPT-13 | `chatgpt-audit-1.md:361-382` | ACCEPTED -> M2-0046 and release evidence chain | OBSERVED ChatGPT concludes both owner symptoms are not closed without packaged evidence and ranks weekly actions. OBSERVED M2-0046 is the 1.9.7 qualification/release ticket and keeps owner bug closure at M2-0199 (`tickets.json:2796-2870`). |

## Codex r1 Findings

| ID | Source | Disposition | Reason |
|---|---|---|---|
| R1-01 | `audit-r1.txt:1-2` | ACCEPTED -> M2-0003 plus LEAD_ACTION below | OBSERVED Codex reports destructive rebuild can purge an unavailable brain index and tests bless the violation. OBSERVED M2-0003 protects unreadable/foreign indexes (`tickets.json:260-326`), but this specific post-DONE regression needs ledger attachment. |
| R1-02 | `audit-r1.txt:3-4` | ACCEPTED -> M2-0003 plus LEAD_ACTION below | OBSERVED Codex reports future schema is checked after Zod acceptance and coverage misses compatible future schemas. OBSERVED M2-0003 owns brain store/index poison tests (`tickets.json:281-300`), but the specific future-schema finding must be attached by the lead. |
| R1-03 | `audit-r1.txt:5-6` | ACCEPTED -> M2-0191, M2-0031, M2-0193 | OBSERVED Codex reports dataless detection was not wired into production reads. OBSERVED ledger notes require M2-0191/M2-0031 to wire detectors into real listing/search/read/backfill paths (`tickets.json:1962`, `tickets.json:2032-2033`). |
| R1-04 | `audit-r1.txt:8-12` | ACCEPTED -> M2-0003, M2-0031 | OBSERVED Codex proof requirements cover no destructive rebuild, future schema rejection, dataless source scans and removal of tests that encode forbidden replacement. OBSERVED these map to M2-0003 and M2-0031 line items above. |

LEAD_ACTION: Attach `RF-AUDIT-R1-B1`, `RF-AUDIT-R1-B2`, `RF-AUDIT-R1-B3`, `RF-AUDIT-R1-R1`, and `RF-AUDIT-R1-R2` to the correct existing ledger tickets or file new tickets if the lead decides M2-0003 is already closed and must not be reopened.

## Codex r2 Findings

| ID | Source | Disposition | Reason |
|---|---|---|---|
| R2-01 | `audit-r2.txt:1`, `audit-r2.txt:5` | ACCEPTED -> M2-0217 | OBSERVED Codex reports per-asset promotion evidence gap. OBSERVED M2-0217 requires a PASS record for every staged asset (`tickets.json:12757-12797`). |
| R2-02 | `audit-r2.txt:2`, `audit-r2.txt:6` | ACCEPTED -> M2-0218 | OBSERVED Codex reports non-atomic Cloudflare OAuth provisioning. OBSERVED M2-0218 makes provisioning atomic or compensating (`tickets.json:12800-12841`). |
| R2-03 | `audit-r2.txt:3`, `audit-r2.txt:7` | ACCEPTED -> M2-0219 | OBSERVED Codex reports excessive Cloudflare OAuth scopes. OBSERVED M2-0219 reduces scopes and tests the authorization URL (`tickets.json:12844-12884`). |

## Codex r3 Findings

| ID | Source | Disposition | Reason |
|---|---|---|---|
| R3-01 | `audit-r3.txt:1`, `audit-r3.txt:6` | ACCEPTED -> M2-0221 | OBSERVED Codex reports Windows script opening through `cmd.exe /c start` with raw `scriptPath`. OBSERVED M2-0221 opens the Windows CLI setup script without cmd re-parsing (`tickets.json:12930-12969`). |
| R3-02 | `audit-r3.txt:2`, `audit-r3.txt:7` | ACCEPTED -> M2-0222 | OBSERVED Codex reports MCP metadata/DNS-rebinding refusal bypass on the system-proxy route. OBSERVED M2-0222 covers direct, env-proxy and system-proxy refusal (`tickets.json:12971-13012`). |
| R3-03 | `audit-r3.txt:3` | ACCEPTED -> M2-0221 | OBSERVED Codex reports tests miss the Windows `start` launcher path. OBSERVED M2-0221 acceptance requires metacharacter path behaviour tests (`tickets.json:12956-12959`). |
| R3-04 | `audit-r3.txt:4-5`, `audit-r3.txt:8` | ACCEPTED -> M2-0223 | OBSERVED Codex reports mutable workflow actions. OBSERVED M2-0223 pins workflow actions to full commit SHAs and adds a check (`tickets.json:13025-13054`). |
| R3-05 | `audit-r3.txt:9` | ACCEPTED -> M2-0224 | OBSERVED Codex reports source-text renderer-ready contract testing. OBSERVED M2-0224 replaces it with a behaviour test (`tickets.json:13057-13095`). |

## Codex r4 Findings

| ID | Source | Disposition | Reason |
|---|---|---|---|
| R4-01 | `audit-r4.txt:1`, `audit-r4.txt:8` | ACCEPTED -> M2-0031 | OBSERVED Codex reports Recall/History still bypasses the gateway. OBSERVED M2-0031 notes audit-r4 as MUST cover real Recall paths and product-level regressions (`tickets.json:2033`). |
| R4-02 | `audit-r4.txt:2`, `audit-r4.txt:9` | ACCEPTED -> M2-0031 | OBSERVED Codex reports synchronous meeting-root reads through `readSavedFile`. OBSERVED M2-0031 scope includes `src/main/transcripts.ts` and the audit-r4 note requires removal/bounding of synchronous meeting-root reads (`tickets.json:1973-2006`, `tickets.json:2033`). |
| R4-03 | `audit-r4.txt:3-4`, `audit-r4.txt:10` | ACCEPTED -> M2-0227 | OBSERVED Codex reports ALL_PROXY SOCKS bypass and missing tests. OBSERVED M2-0227 covers HTTP(S)_PROXY, ALL_PROXY and lowercase SOCKS routes (`tickets.json:13194-13235`). |
| R4-04 | `audit-r4.txt:5`, `audit-r4.txt:11` | ACCEPTED -> M2-0031 | OBSERVED Codex asks for proof gateway `root()` cannot reject. OBSERVED M2-0031 audit-r4 note requires throwing root/settings resolution to resolve unavailable within deadline (`tickets.json:2033`). |
| R4-05 | `audit-r4.txt:6`, `audit-r4.txt:12` | ACCEPTED -> M2-0031 | OBSERVED Codex says the gateway module comment is misleading and product-level freeze regression is missing. OBSERVED M2-0031 audit-r4 note requires making the comment true and testing real History/Recall entrypoints (`tickets.json:2033`). |

## Lead-Only Ledger Actions

LEAD_ACTION: Update `docs/metis-2.0/ledger/tickets.json` for M2-0023 status/evidence after review, if the lead accepts this disposition record as the DESIGNED evidence.
Resolved 2026-09-29 (lead): not regenerated. `ledger/tickets/*.md` are frozen snapshots of the original ticket text (no generator exists; see `docs/metis-2.0/README.md`); `ledger/tickets.json` is the only source of M2-0023's status.
LEAD_ACTION: Attach the r1 finding refs named above to the chosen carrier tickets or create new tickets if the lead will not reopen M2-0003.
LEAD_ACTION: If this ticket is closed, refresh traceability for R15/R90/R91/R92/R93 from M2-0023 so the generated trace no longer shows stale not-started state.

## Verification Notes

- OBSERVED command output, 2026-09-28: `/Users/tony/.local/bin/graphify query "M2-0023 PLAN ARCHITECTURE ledger tickets independent audits" --budget 1200` failed with `graph file not found: /Users/tony/AI-Brain-build/metis-wt-M2-0023/graphify-out/graph.json`.
- OBSERVED command output, 2026-09-28: `sed -n '1,220p' graphify-out/wiki/index.md` failed with `No such file or directory`.
- OBSERVED command output, 2026-09-28: `find .. -name AGENTS.md -maxdepth 3 -print` found neighboring worktree AGENTS files but no `./AGENTS.md`; this run used the AGENTS instructions supplied in the prompt.
- OBSERVED command output, 2026-09-28: vault SessionStart reads for `Preferences/mistakes.md` and `_agent_state/codex/memory.json` failed with OneDrive `Resource deadlock avoided`; `Preferences/dont.md` produced no visible output.
- OBSERVED command output, 2026-09-28: read-only artifact inspection used `sed`, `nl -ba`, `rg`, `find`, and `git show`; no repository tests, repository scripts, app, workflow dispatches, `_relay` edits, or `docs/metis-2.0/ledger/` edits were performed.
- UNKNOWN: CI artifact evidence and generated-ledger refresh status are outside this session's permitted actions.
