# Engineering efficiency: fixed task set, before and after (M2-0377)

Status: **PROTOCOL ONLY. No run has happened; every measured cell is UNKNOWN.** Reason: a measured run needs live engineering sessions, and this session has no network and may not run scripts (D-28). Nothing below is estimated or invented.

Labels as in `adr/ADR-025-engineering-graph.md`. Related decision: ADR-025 §3 (adopt neither now).

## Conditions

- Same pinned commit of the public repo (`<pub>` = `/Users/tony/AI-Brain-build/metis-operator-ux/`), same model, same prompt, fresh session per run, empty prior memory.
- **Before** = direct scoped search only (Grep/Glob/Read). **After** = the same tasks with the candidate index (code-review-graph first, ADR-025 §3.4) answering under the ADR-025 §4 contract.
- Count per run: input tokens, output tokens (from the session's own usage report), number of search calls (Grep/Glob/index queries), number of file reads, answer correct yes/no against the key below.
- Three runs per cell; record the median. Dev tokens are recorded in this file only and never sent to Operator (ADR-025 §6).

## Fixed task set (each answer key is OBSERVED at the cited line, so a reviewer can grade it)

| # | Task | Answer key |
|---|---|---|
| T1 | Where does the desktop post ask usage to the Operator, and what gates the payload fields? | `<pub>src/main/index.ts:7663` call; `<pub>src/main/operator-ingest.ts:440,166`; `<pub>src/shared/operator.ts:178` |
| T2 | Which event types may reach `/v1/ingest`? | `<pub>src/shared/operator.ts:99` |
| T3 | What spawns the Python Graphify runner in the app? | `<pub>src/main/graphify.ts:14-22` |
| T4 | Which tests cover the ingest projection? | `<pub>src/shared/operator.test.ts:166` |
| T5 | List callers of `recordOperatorAsk` outside tests. | only `<pub>src/main/index.ts:7663` |

## Results

| Task | Before: in / out tokens, searches, reads, correct | After: in / out tokens, searches, reads, correct |
|---|---|---|
| T1 | UNKNOWN | UNKNOWN |
| T2 | UNKNOWN | UNKNOWN |
| T3 | UNKNOWN | UNKNOWN |
| T4 | UNKNOWN | UNKNOWN |
| T5 | UNKNOWN | UNKNOWN |

The "after" column cannot be filled until a tool is pinned and installed (ADR-025 §2).

LEAD_ACTION: run the before column now (needs no graph tool) in an engineering session, then the after column once ADR-025 LEAD_ACTION 2 lands; file the counts here.
