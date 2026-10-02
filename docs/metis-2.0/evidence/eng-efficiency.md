# Engineering efficiency: fixed task set, before and after (M2-0444)

Status: **DERIVED: MEASUREMENT REGISTER READY; measured cells remain UNKNOWN until lead-run artifacts are filed.** Source: M2-0444 makes the measurement run and evidence filing lead-only for the implementer-facing acceptance (`docs/metis-2.0/ledger/tickets.json:31145-31148`).

Labels follow `docs/metis-2.0/adr/ADR-025-engineering-graph.md:10`: OBSERVED, DERIVED, ASSUMED, UNKNOWN and BLOCKED_EXTERNAL. Retrieval date for command-output sources in this file: 2026-10-02.

## Scope and authority

- OBSERVED: M2-0444's only scope path is this file (`docs/metis-2.0/ledger/tickets.json:31141-31143`).
- OBSERVED: M2-0444 depends on M2-0377 and M2-0426 (`docs/metis-2.0/ledger/tickets.json:31133-31136`).
- OBSERVED: M2-0444 requires MEASURED evidence (`docs/metis-2.0/ledger/tickets.json:31124`, `docs/metis-2.0/ledger/tickets.json:31150-31152`).
- OBSERVED: M2-0444 acceptance requires the five-task set to run three times per before/after cell on pinned commits, with medians of tokens, searches, reads and correctness filed by the lead (`docs/metis-2.0/ledger/tickets.json:31145-31147`).
- OBSERVED: M2-0444 acceptance requires maintainability deltas for FF-04 over-limit files and duplicated-responsibility counts beside token figures (`docs/metis-2.0/ledger/tickets.json:31147`).
- OBSERVED: M2-0444 acceptance requires citing M2-0426 for the no-developer-metric-to-Operator control (`docs/metis-2.0/ledger/tickets.json:31148`).
- OBSERVED: M2-0377 already records the predecessor requirement: a fixed task set is run before and after with token and search counts recorded, and no developer graph or compaction metric is sent to Operator usage (`docs/metis-2.0/ledger/tickets.json:27896-27900`).

## Measurement conditions

- DERIVED: The run has four cells: before efficiency, after efficiency, before maintainability and after maintainability. Source: M2-0444 acceptance lines require before/after efficiency medians and maintainability deltas beside the token figures (`docs/metis-2.0/ledger/tickets.json:31145-31148`).
- OBSERVED: ADR-025's baseline is direct scoped search, and later adoption requires the after-run to show fewer tokens or searches without lower correctness (`docs/metis-2.0/adr/ADR-025-engineering-graph.md:49-52`, `docs/metis-2.0/adr/ADR-025-engineering-graph.md:64-66`).
- OBSERVED: ADR-025 says the after column cannot be complete until source review and measured sessions happen; those are lead actions (`docs/metis-2.0/adr/ADR-025-engineering-graph.md:81-88`).
- ASSUMED: "Before the m5 seam set" means the lead-selected pinned commit immediately before the relevant m5 refactor seam PR set. Source: M2-0444 acceptance names that boundary but does not name the commit (`docs/metis-2.0/ledger/tickets.json:31145-31147`).
- ASSUMED: "After it" means the lead-selected pinned commit immediately after the same seam set lands. Source: same as above.
- UNKNOWN: The before commit SHA, after commit SHA, model build, prompt transcript IDs and CI artifact IDs are not present in this repository.

LEAD_ACTION: choose and record the exact before commit SHA immediately before the m5 seam set.
LEAD_ACTION: choose and record the exact after commit SHA immediately after the m5 seam set.
LEAD_ACTION: run each fixed task three times on each selected commit in fresh engineering sessions using the same owner-approved model and prompt.
LEAD_ACTION: file each run artifact or transcript ID with input tokens, output tokens, search calls, read calls and correctness.
LEAD_ACTION: compute and file the median input tokens, output tokens, searches, reads and correctness for every task and cell.

## Fixed task set and grading key

`<pub>` means `origin/m2/integration` in `/Users/tony/AI-Brain-build/metis-operator-ux`, read with `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:<path>`.

| # | Task | Grading key and source |
|---|---|---|
| T1 | Where does the desktop post ask usage to the Operator, and what gates the payload fields? | OBSERVED: `<pub>src/main/index.ts:8048-8068` calls `recordOperatorAsk` with ask usage fields. OBSERVED: `<pub>src/main/operator-ingest.ts:559-595` builds the Operator ask payload and posts through `postIngestWithQueue`. OBSERVED: `<pub>src/shared/operator.ts:173-182` constructs a new approved-field object and rejects unknown events. Source: read-only `git show ... | nl -ba`, 2026-10-02. |
| T2 | Which event types may reach `/v1/ingest`? | OBSERVED: `<pub>src/shared/operator.ts:99` allows only `ask`, `rating`, `listen`, `recap`, `crm`; `<pub>src/shared/operator.ts:181-182` rejects all other event types. Source: read-only `git show ... | nl -ba`, 2026-10-02. |
| T3 | What spawns the Python Graphify runner in the app? | OBSERVED: `<pub>src/main/graphify.ts:14-22` documents the bridge that spawns `resources/graphify_runner.py` with a Python interpreter. Source: read-only `git show ... | nl -ba`, 2026-10-02. |
| T4 | Which tests cover the ingest projection? | OBSERVED: `<pub>src/shared/operator.test.ts:166-350` covers `projectOperatorIngestMetadata`, including the positive projection, dropped developer metrics, null mapping for graph/compaction/index/search/dev events, and frozen ask key set. Source: read-only `git show ... | nl -ba`, 2026-10-02. |
| T5 | List callers of `recordOperatorAsk` outside tests. | OBSERVED: read-only `git show origin/m2/integration:src/main/index.ts | rg -n "recordOperatorAsk"` returns import line `629` and call line `8048`; no second non-test caller was observed in that file. UNKNOWN: absence across the full public repo was not proven here because repository-wide search would be a lead/audit step under the ticket constraints. |

## Results register

UNKNOWN: the cells below are not zeroes and are not estimates; no lead-run artifact has been filed in this document.

| Task | Before efficiency median: in tokens / out tokens / searches / reads / correct | Before maintainability: FF-04 over-limit files / duplicated-responsibility count | After efficiency median: in tokens / out tokens / searches / reads / correct | After maintainability: FF-04 over-limit files / duplicated-responsibility count | Delta summary |
|---|---|---|---|---|---|
| T1 | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN |
| T2 | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN |
| T3 | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN |
| T4 | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN |
| T5 | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN | UNKNOWN |

LEAD_ACTION: beside each task's token/search/read medians, file the before and after FF-04 over-limit-file count from the approved architecture artifact.
LEAD_ACTION: beside each task's token/search/read medians, file the before and after duplicated-responsibility count from the approved architecture artifact.
LEAD_ACTION: compute each delta as `after - before`, keeping lower-is-better explicit for tokens, searches, reads, FF-04 over-limit files and duplicated-responsibility counts.

## Maintainability metric definitions

- OBSERVED: FF-04 is the file-size rule for non-generated, non-test source files over 800 LOC; existing over-limit files have per-file ceilings that can only fall (`docs/metis-2.0/ARCHITECTURE.md:463`).
- OBSERVED: the architecture baseline at `2bf21f1c` records 21 files over 800 LOC for FF-04 (`docs/metis-2.0/ARCHITECTURE.md:458-463`).
- OBSERVED: M2-0047's design describes FF-04 counting as the line count when a production file exceeds 800 lines (`docs/metis-2.0/designs/M2-0047-DESIGN.md:210-235`).
- OBSERVED: `scripts/check-architecture.mjs` is the architectural source for FF-04 and related counts, and it keeps a baseline whose counts can only go down (`docs/metis-2.0/ARCHITECTURE.md:453-456`).
- UNKNOWN: "duplicated-responsibility count" is not named as a fitness-function ID in the sources read for this ticket. It must be filed from the lead-approved architecture artifact or a lead-approved duplicate-responsibility audit, not inferred from similar FF labels.

LEAD_ACTION: identify the exact approved source for "duplicated-responsibility count" before filing the measured rows.
LEAD_ACTION: if the source is a CI artifact, file the artifact URL or run ID and the exact line or JSON path containing the count.
LEAD_ACTION: if the source is a read-only command, file the exact command and output in the evidence record without editing `docs/metis-2.0/ledger/`.

## Operator metric boundary

- OBSERVED: M2-0426 is DONE and specifically covers developer-efficiency metrics never reaching Operator usage (`docs/metis-2.0/ledger/tickets.json:30206-30217`).
- OBSERVED: M2-0426 acceptance covers dropping `graphTokens`, `compactionTokens`, `indexCommit`, `searchCount` and `devTokens`, mapping graph/compaction events to null, and freezing the ask key set (`docs/metis-2.0/ledger/tickets.json:30228-30232`).
- OBSERVED: M2-0426 evidence records PR `https://github.com/mysticalsin/AskToto-Mantu/pull/323`, merged into `m2/integration`, with independent review and every PR check green (`docs/metis-2.0/ledger/tickets.json:30241-30247`).
- OBSERVED: current public source drops developer-efficiency metric fields from every event payload in `operator.test.ts:269-284`, maps graph/compaction/index/search/dev events to null in `operator.test.ts:286-290`, and freezes the ask key set in `operator.test.ts:292-335`. Source: read-only `git show origin/m2/integration:src/shared/operator.test.ts | nl -ba`, 2026-10-02.
- OBSERVED: the production projector only accepts the closed event set at `<pub>src/shared/operator.ts:99` and returns null for other event types at `<pub>src/shared/operator.ts:181-182`. Source: read-only `git show ... | nl -ba`, 2026-10-02.
- OBSERVED: `signedPost` treats a null `/v1/ingest` projection as consumed without a network call at `<pub>src/main/operator-ingest.ts:194-197`, and `postIngestWithQueue` returns before posting when the projection is null at `<pub>src/main/operator-ingest.ts:252-254`. Source: read-only `git show ... | nl -ba`, 2026-10-02.
- DERIVED: developer efficiency metrics have no current Operator serialization path unless a future code change deliberately expands the allowlist and tests.

## Verification limits for this implementation session

- OBSERVED: this implementation changed only this document. Source: `git diff -- docs/metis-2.0/evidence/eng-efficiency.md`, 2026-10-02.
- OBSERVED: graph navigation was attempted first, but `graphify query "M2-0444 engineering efficiency ADR-025 M2-0426 eng-efficiency"` failed because `graphify-out/graph.json` is absent in this worktree. Source: command output, 2026-10-02.
- BLOCKED_EXTERNAL: lead-only measured evidence cannot be created in this session. Exact read-only step: the lead must run the five-task set three times per before/after cell on the selected pinned commits, then file the artifacts and medians here.
- BLOCKED_EXTERNAL: generated ledger evidence records and CI artifacts cannot be filed by this implementer. Exact read-only step: the lead must file the evidence record from the authorized CI/artifact source.
- BLOCKED_EXTERNAL: repository tests, scripts and app runs were not executed because the owner instruction for M2-0444 says never to run repository tests, scripts or the app under D-28.

## Acceptance coverage

| Acceptance item | Status in this file |
|---|---|
| Lead runs five-task set three times per before/after cell and files medians | COVERED_AS_LEAD_ACTION: exact lead-only run and filing steps are listed above; measured cells remain UNKNOWN until artifacts exist. |
| Maintainability deltas reported beside token figures | COVERED_AS_REGISTER: maintainability columns sit beside each token/search/read cell, and lead-only source steps for FF-04 and duplicated-responsibility counts are explicit. |
| No developer metric is sent to Operator, citing M2-0426 | COVERED_BY_OBSERVED_SOURCE: M2-0426 ledger evidence and current public regression-test/source anchors are cited above. |
