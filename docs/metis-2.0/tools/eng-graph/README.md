# Engineering graph checks (M2-0377)

Specification only. No script exists here, and none was run (D-28). Decision context: `../../adr/ADR-025-engineering-graph.md`.

## Check 1: no developer metric reaches Operator usage (ADR-025 §6)

Add to `src/shared/operator.test.ts` in the public repo, inside `describe('projectOperatorIngestMetadata')` (`<pub>src/shared/operator.test.ts:166`):

1. Input an ask event with valid fields plus `graphTokens`, `compactionTokens`, `indexCommit`, `searchCount`, `devTokens`. Assert the projected object has none of those keys.
2. Input events with `event: 'graph'` and `event: 'compaction'`. Assert `null` (matches the existing pattern at `operator.test.ts:270`).
3. Assert the ask key set equals the fixed list at `<pub>src/shared/operator.ts:187-229`, so adding a key needs a deliberate test edit.

Runs in CI only. LEAD_ACTION: route through a Codex-queue ticket and file the CI run.

## Check 2: no Python graph tool in the installer (ADR-025 §3.3)

In CI, after the packaged build, list the installer contents and fail if any path matches `graphify`, `code-review-graph` or a bundled `python` interpreter that the product does not already document. Note (OBSERVED): the app already carries `resources/graphify_runner.py` for the notes graph (`<pub>src/main/graphify.ts:15`); the allowlist for that file belongs to M2-0074/M2-0169, not this ticket. LEAD_ACTION: assign the CI ticket.
