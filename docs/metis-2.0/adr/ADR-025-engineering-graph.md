# ADR-025: the engineering source graph — evaluation of code-review-graph and Graphify

| Field | Value |
|---|---|
| Ticket | M2-0377. Finding refs: AUDIT-2026-09-28, M2-ENG-01, COV-42, D10, F-16, TASK-003, master-r11:TASK-061, R35, v6-brag-hindsight-255 |
| Status | **PROPOSED.** Decision: **do not adopt either tool now** (DEFER). Adoption is reopened only by the gate in §5. |
| Depends on | M2-0011 (ID matrix only; it built no graph) |
| Scope | Documentation only. No code, test, script or app run (D-28). No network access in this session. |

**Labels.** OBSERVED = read in a file or code, source `path:line`. DERIVED = reasoned from OBSERVED facts. ASSUMED = believed, verification step named. UNKNOWN = evidence missing. BLOCKED_EXTERNAL = needs network or an outside account; the exact read-only step is given.

`<pub>` = `/Users/tony/AI-Brain-build/metis-operator-ux/`, read with Read/Grep. UNKNOWN: whether that checkout equals `origin/m2/integration` (`git show origin/m2/integration:<path>` was refused by the sandbox). See LEAD_ACTION 1.

---

## 1. Requirement (OBSERVED)

- MASTER 18.2 (`kit/r11/spec/MASTER.md:1686-1696`): evaluate `mysticalsin/code-review-graph` first; add Graphify document/ADR relationships only for an identified gap; pin the reviewed implementation; keep dependencies local to engineering; "Do not ship Python graph tools in the Métis user installer" (`:1688`).
- Index identity must include repository/worktree, full commit, dirty-file hashes, parser/schema/config version, exclusion rules; stale results rejected or marked (`:1690`). Queries return bounded source-linked context and never prove absence (`:1692`).
- Component table (`:1732-1733`): code-review-graph is "QUALIFY COMPONENT ... if benchmarks support it"; Graphify is limited to narrow projection adapters and optional developer relationships.
- R35 / R36 (`:3341-3349`) record only "prior source/README review" of the forks. No source review of either tool exists in this repository (grep of `docs/metis-2.0` outside `kit/` finds no evaluation). UNKNOWN: their current behaviour.

## 2. Evaluation

| Question | code-review-graph (R35) | Graphify (R36) |
|---|---|---|
| Pinned commit reviewed | **BLOCKED_EXTERNAL.** Read-only step: `git ls-remote https://github.com/mysticalsin/code-review-graph HEAD`, then record the full SHA and a read of its README, parser list and index schema. Not done: no network. | **BLOCKED_EXTERNAL.** Same step for `https://github.com/mysticalsin/graphify`. |
| Runs on the engineering machine only | ASSUMED (MASTER `:1688`); verify in the pinned source. | Public app already spawns a Python Graphify runner (see below). |
| Has index identity (worktree, commit, dirty hashes, config version) | UNKNOWN. Required by §4 before adoption. | UNKNOWN. |
| Measured token/search benefit | UNKNOWN. `evidence/eng-efficiency.md` defines the run; no run exists. | UNKNOWN. |

**Graphify in the product today (OBSERVED, and the reason for the installer rule).** `<pub>src/main/graphify.ts:14-22` documents a bridge that spawns `resources/graphify_runner.py` with a Python interpreter, and `:60` looks for a `graphifyy` uv tool. It builds a graph of the user's meeting notes for the "Open graph" and "Related notes" features. DERIVED: this is a user-data feature owned by knowledge/privacy tickets (M2-0074, M2-0169), a different domain from an engineering index. This ADR does not change it and must not be read as approving Python in the installer; ADR-019 already keeps Graphify confidence tags separate from provenance (`design/knowledge/ADR-019-canonical-knowledge.md:39`).

## 3. Decision

1. **Adopt neither tool now.** Reason (DERIVED): both acceptance gates that MASTER sets (pinned source review, benchmark support) are unmet, and the two ways to meet them (network read, measured sessions) are outside this session. Adopting on README-only evidence would repeat the "competing memories" risk 18.2 warns about.
2. **Baseline stays direct scoped search** (Grep/Glob/Read of the pinned worktree), which MASTER `:1692` itself says can be cheaper for a known file.
3. **No Python graph tooling enters the Métis installer**, whichever tool is later adopted. Hard rule, checked by the installer-content check in §6 item 2.
4. **code-review-graph is evaluated first**; Graphify is evaluated only against a gap that code-review-graph leaves on the fixed task set (`evidence/eng-efficiency.md`).

## 4. Query contract if a tool is later adopted (acceptance 2, conditional)

Not adopted, so nothing is claimed as implemented. Any adopted index must satisfy all of:

- Every answer states: worktree path, full commit SHA, sorted list of dirty-file paths with content hashes, parser/schema version, exclusion-rule hash, config version, index build time.
- The query layer recomputes the current worktree identity on each call and **refuses** (non-zero exit, no context) when it differs from the index identity. It never returns a stale result marked as fresh.
- Results are bounded (fixed maximum nodes and bytes), source-linked (`path:line`), carry edge origin and confidence, and say they do not prove absence.
- Dynamic edges (IPC channel, preload method, Worker route, D1 table, feature flag, packaging resource) are explicit supplemental edges, each verified against source.
- The index lives outside the app bundle and outside `src/`; dependencies are pinned and installed only in the engineering environment.

## 5. Reopen gate

Adopt only when all hold: (a) LEAD_ACTION 2 records pinned SHAs and a source review; (b) the after-run in `evidence/eng-efficiency.md` shows fewer tokens or searches on the fixed task set without lower answer correctness; (c) the §4 contract is demonstrated on a dirty worktree and after a branch switch. Otherwise this decision stands.

## 6. Developer metrics stay out of Operator usage (acceptance 4)

**Static evidence (OBSERVED).**

1. The only production call of `recordOperatorAsk` is the app's own answered-ask seam, `<pub>src/main/index.ts:7663-7684`; tokens are `u.inputTokens` / `u.outputTokens` from that stream (`:7672-7673`). Engineering tools (an agent session, an index build) do not run inside the app.
2. The wire payload passes `projectOperatorIngestMetadata`, which "constructs a new object from approved metadata fields only" (`<pub>src/shared/operator.ts:173-178`). Event types are the closed set `ask, rating, listen, recap, crm` (`:99`); an unknown event returns `null` (`:182`) and is consumed without a network call (`<pub>src/main/operator-ingest.ts:166-169`). Ask fields are a fixed list (`operator.ts:205-229`).
3. A search of `<pub>/src` for `compaction` finds no match; no developer graph or compaction field exists in any payload today.
4. Existing test `<pub>src/shared/operator.test.ts:270` proves an unknown event is dropped.

DERIVED: a developer graph or compaction metric has no serialization path to Operator today, and would need a code change to the allowlist to gain one.

**Regression check to add (CI-only, D-28).** Specified in `tools/eng-graph/README.md` as a test to add to `src/shared/operator.test.ts`: feed `projectOperatorIngestMetadata` events carrying `graphTokens`, `compactionTokens`, `indexCommit`, `searchCount`, `devTokens` and event types `graph`, `compaction`; assert the output contains none of those keys and unknown events return `null`. The check is **not implemented or run here**; it is a LEAD_ACTION.

## 7. Actions only the lead can take

LEAD_ACTION 1: confirm `<pub>` equals `origin/m2/integration` and re-verify the line numbers cited in §2 and §6.
LEAD_ACTION 2: run the two read-only steps in the §2 table (network) and record pinned SHAs plus a source review in this ADR.
LEAD_ACTION 3: run the before and after task sets in `evidence/eng-efficiency.md` in a real engineering session and file the counts.
LEAD_ACTION 4: land the §6 regression test in the public repo through a ticket (Codex queue) and file the CI run as evidence.
LEAD_ACTION 5: assign an independent validator; none has run, so status stays PROPOSED.
