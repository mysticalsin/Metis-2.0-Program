---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 3
agent: claude-code
updated: 2026-09-26 12:00 EDT
status: in-progress
branch: docs/metis-2.0-program (worktree ~/AI-Brain-build/metis-v2-program); integration branch m2/integration
head: m2/integration = e323151c (origin/main 2bf21f1c + M2-0001 via PR #201)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Deliver Métis 2.0 (docs/metis-2.0/GOAL.json; deadline 2026-11-30). Plan: docs/metis-2.0/PLAN.md; 213 tickets in docs/metis-2.0/ledger/tickets.json (921/921 kit ids, 78/78 findings mapped). Done when every ticket reaches its evidence level with Opus validation and the owner signs off.

## Current state
- M2-0001 (test isolation) merged into m2/integration via PR #201 (e323151c). Evidence: RED on main wrote into a seeded fake OneDrive; branch leaves it byte-identical; full suite matches main's sandbox-only failures, all of which pass outside the agent sandbox.
- History-freeze root cause OBSERVED: spindump Metis_2026-09-25-135445 shows the main thread in a JS timer doing synchronous reads blocked in apfs_materialize_dataless_file_ext (OneDrive cloud-only files), 85 s. Reopen in Hide layout is a visible no-op. Heavy-on-PC: orphaned llama-server ≈3.1 GB each (CONFIRMED).
- Program docs (PLAN, ARCHITECTURE, DECISIONS, BLOCKERS, TRACEABILITY, ledger, review/, kit/, designs/) exist uncommitted in this worktree, waiting on the public-readiness verdict.
- Ticket worktrees ~/AI-Brain-build/metis-wt-M2-{0003,0006,0035,0043,0045} on branches m2/M2-*, base 4cf7c2dd. Only M2-0003 has work: WIP commit e2adbadf (untested, do not merge); design in docs/metis-2.0/designs/M2-0003-DESIGN.md.

## Done this shift
- Plan workflow wf_0b1fe997-ce5 (validation PASS_WITH_FIXES); W0 hermetic workflow; PR #201; m2/integration branch; ChatGPT audits 1+2 (review/chatgpt-audit-*.md).

## Tests actually run
- Up to 12:00 EDT, sandboxed with fake HOME on the M2-0001 config: full root suite (534 pass / 8 sandbox-only fails), those 8 outside the sandbox (all pass), typecheck exit 0. Real .brain quarantine count stayed 180 (no new files). Since D-28 (below): none.

## Executed side effects — do NOT repeat blindly
- Pushed: codex/operator-ux-rock-1, wip/windows-artifact-signing-snapshot, m2/w0-test-isolation, m2/integration.
- PR #201 opened, commented, retargeted to m2/integration, merged (e323151c).
- ChatGPT uploads (owner-approved permission rule): status brief, B1/B2/B3 reports, runtime evidence, follow-up.

## Blockers
- D-28 (owner, 2026-09-26): tests run ONLY in CI. GitHub Actions is out of budget ("The job was not started because an Actions budget is preventing further use."), so no ticket can be tested until CI runs.
- Owner asked to make the repo public (free Actions). Public-readiness audit wf_aea16745-b30 running → ~/AI-Brain-build/metis-v2-review/public-audit/PUBLIC-READINESS.md. Do NOT change visibility before the owner confirms the verdict.
- Codex quota until 2026-09-29 19:33. OneDrive not hydrating (6 dataless meetings fail ETIMEDOUT).

## Next steps (in order)
1. Read PUBLIC-READINESS.md; present GO/NO-GO and remediation to the owner; act only on explicit confirmation.
2. Once CI runs: re-launch the ticket runner (script metis-ticket-runner) in CI-only mode — agents push branches and iterate on `gh run view`, never run tests locally.
3. Commit + push the program docs branch and open the m2 milestone PR (M2-0024) to main for owner review.

## Decisions made (don't relitigate)
- Merge flow: validated ticket PRs merge into m2/integration; owner reviews milestone PRs into main — Tony, 2026-09-26.
- D-28: CI only — Tony, 2026-09-26.
- Outcome eng-complete + BLOCKED-visible; deadline 2026-11-30; only Apple public signing out of scope; Opus validates and owns design/animation; launch video at the end — Tony.


## PURGE STATUS (2026-09-26 ~20:45 UTC) — read before any git push
- With the owner's explicit go: release.yml disabled and the 5 rulesets set to disabled; the remaining 49 rewritten branches + 27 rewritten tags were force-pushed from ~/AI-Brain-build/purge/remote-mirror.git (pending list: ~/AI-Brain-build/purge/pending-refs.txt; all 76 were unchanged since the backup). Then all 5 rulesets were set back to active and release.yml re-enabled (confirmed). Ruleset snapshots: ~/AI-Brain-build/purge/rulesets/*.json.
- NOT YET VERIFIED: an automated ls-remote comparison after the push was refused by the tool policy. Verify manually: on GitHub, main's head must be 22d1fba ("Merge pull request #198"), not 2bf21f1.
- CAHE_KIMI_JSON: does not exist as a repo or environment secret (404); the v1.2.0 Cahê build embedded the key from a local git-ignored file. The key still needs revoking at the vendor (owner; no console access here).
- GitHub Support request: text at docs/metis-2.0/GITHUB-SUPPORT-REQUEST.md; needs the owner signed in at support.github.com (browser window open at the sign-in page).
- Mantu sign-off: draft at docs/metis-2.0/owner-requests/MANTU-LICENCE-SIGNOFF-DRAFT.md (not sent; owner chooses recipients).
- NEVER push from a clone/ref predating the rewrite. Local-only pre-rewrite branches m2/w0-hermetic-tests and m2/M2-0003-wip-scratch must never be pushed.
- Program docs live ONLY in this private repo. Ticket runner batches: wf_32ea0bc9-6bc (batch 1: M2-0003/0006/0035/0043/0045/0041) and wf_635af830-809 (batch 2: M2-0191/0002/0011/0190/0187/0013/0020).

## M2-0011 — traceability matrix generator (2026-09-26, Sonnet ticket runner)
- PR #211 (`m2/M2-0011-traceability-generator` → `m2/integration`, draft): RED run
  [36273031905](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36273031905) (new
  tests fail with `buildInventoryIndex() is not implemented yet`, as the ticket describes) →
  GREEN run [36273540014](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36273540014)
  (52/52 new tests pass on ubuntu + windows, typecheck ratchet gate unchanged at its 26-error
  baseline, no job regressed against the `m2/integration` baseline run 36267674617). The public
  repo carries only the data-free generator (`scripts/trace/build-traceability.mjs`) and its
  synthetic-fixture test suite — no program data.
- This program repo now has its own copy at `scripts/trace/build-traceability.mjs` (uncommitted,
  per the ticket's lead notes — `scripts/trace/README.md` next to it says why and how to run it)
  and a freshly seeded `docs/metis-2.0/kit/ID-INVENTORY.json` (937 rows, verbatim from
  `TRACEABILITY.json`'s `id`/`family`/`title`/`kit`/`source_file`/`source_ref`/`parent_task`/
  `sources` fields — acceptance criterion 8), so the check now runs from this repository alone.
- Verified against the real ledger with a throwaway Python port of the same algorithm (D-28 keeps
  `node` off this Mac, and no agent ran the real `--check` here): `needs_decision` → DECISIONS.md
  and BLOCKERS.md → ledger both resolve cleanly; the one gap is 16 REF-* ids
  (`Metis-HeyClicky-Interaction-Upgrade` vs `v6`) that 13 tickets cite unqualified, now correctly
  `ambiguous-citation` rather than the old hand-built `TRACEABILITY.md`'s match-by-id-string
  shortcut. Exact ticket/id list and the kit-qualification fix each needs: `scripts/trace/README.md`.
  Per AGENTS.md §4 that ledger edit is the orchestrator's, not reported as done here.
- Next: qualify those 13 tickets' `kit_refs` in `ledger/tickets.json`, re-run `--check` for a real
  937/937 LOCALLY_TESTED pass, regenerate `TRACEABILITY.md`/`ledger/traceability.json`, then record
  Opus validation on M2-0011 and move PR #211 out of draft.

### M2-0011 — Opus round-1 validation, applied (2026-09-26, Sonnet ticket runner)
- Round-1 found the per-kit_ref override read `ticket.evidence[]`, a shape nothing in the real
  ledger writes (`evidence` is `null` for 212 tickets, a provenance object for 2), plus a fail-open
  CLI entrypoint, a dead `--check` flag, and several checks more permissive than the acceptance
  criteria require. Push `7286b05a` on `m2/M2-0011-traceability-generator` applies every required
  fix — full list in the updated PR #211 body. CI:
  [36275620918](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36275620918), conclusion
  `success`, `build-traceability.test.ts` 78/78 (was 52/52) on ubuntu+windows, typecheck ratchet
  gate unchanged at its 26-error baseline, job set matches the `m2/integration` baseline exactly —
  no regression.
- The generator now takes evidence overrides as data (`evidenceByTicket`, ticket id → ADR-017
  `kit_refs` status map) via a new `--evidence <dir>` flag that calls M2-0002's `readRecordStore`
  (no second JSONL parser); one documented mapping (`BLOCKED`→`BLOCKED_EXTERNAL`;
  `PARTIAL`/`NOT_MET` capped at `IN_PROGRESS`; `MET` passes the ticket's status through).
  `docs/metis-2.0/evidence/records/` currently holds only `.gitkeep`, so this has no effect on the
  real ledger yet — it activates as M2-0002 records accumulate.
- **Deleted the private-repo duplicate generator** (`scripts/trace/build-traceability.mjs` here was
  a byte-identical, uncommitted copy that would drift): an agent could not `rm` it in this session
  (no destructive local filesystem ops allowed), so it is marked SUPERSEDED at the top of the file
  and `scripts/trace/README.md` says to delete it by hand. **Action needed: `rm
  scripts/trace/build-traceability.mjs`.**
- **`.github/workflows/ledger.yml` edited (still uncommitted — M2-0002's file; review and commit
  together):** the `public` checkout now sparse-checks `scripts/trace` alongside `scripts/evidence`,
  and a new step runs `node public/scripts/trace/build-traceability.mjs --check` against the real
  ledger, inventory, DECISIONS.md, BLOCKERS.md and evidence records. This is the check that will
  give criterion 1 a real, live answer once enabled — it has not run yet (the workflow file is
  uncommitted and the workflow is not enabled).
- Round-1 widened the BLOCKERS.md/ticket-id checks (every column item, not just the leading one;
  bare `M2-NNNN` tokens anywhere; malformed ledger ticket ids; a program-ticket id inside
  `kit_refs`; CANCELLED tickets excluded from coverage). None of this has been re-verified against
  the real ledger with a fresh Python port this round (D-28; no `node` here) — the pre-round-1
  reconciliation numbers in `scripts/trace/README.md`'s git history predate these checks and should
  be treated as superseded, not current.
- Next: (1) delete the stale duplicate generator by hand; (2) review, fix per `ledger.yml`'s own
  §6.5 checklist if any, and commit `ledger.yml`; (3) qualify the 13 tickets' REF-* citations listed
  in `scripts/trace/README.md`; (4) enable the workflow and let it produce the first real
  `TRACEABILITY.md`/`ledger/traceability.json`; (5) point this HANDOFF and the CURRENT continuation
  record (MASTER §27.5) at those generated files (criterion 5, currently PARTIAL); (6) record Opus
  validation on M2-0011 and move PR #211 out of draft.

## M2-0187 — build-once candidate lane, provenance and promotion (2026-09-26, Sonnet ticket runner)
- Implemented `docs/metis-2.0/designs/M2-0187-DESIGN.md` verbatim in worktree
  `~/AI-Brain-build/metis-wt-M2-0187`, branch `m2/M2-0187-build-once-candidate`. Draft PR
  [#213](https://github.com/mysticalsin/AskToto-Mantu/pull/213) → `m2/integration`.
- TDD through CI: RED commit `a8572a91` — run
  [36275049219](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36275049219) failed for
  exactly the 4 designed reasons (provenance module missing, after-pack QA-identity test, launch
  bundle-name test, `dist:qa-identity` chain-contract test — 6 tests / 4 files, both OSes). GREEN
  commit `009e5782` — run
  [36275744415](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36275744415): Quality
  (ubuntu+windows), Security, Operator Worker all green, 543/545 files, 6696+/6699+ tests passed,
  zero regressions vs `m2/integration` baseline `36267674617`.
- `qa-candidate.yml` self-tested automatically (it and `provenance.mjs`/`build/qa-identity...yml`
  are in its own `pull_request: paths:` trigger): run
  [36275746917](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36275746917) — `Build win`
  fully green (proves `provenance.mjs stage win release candidate` + `check:release` for real);
  `Build mac` hit `HTTP 429` from `huggingface.co` inside the pre-existing, unmodified
  `fetch-models.mjs` step (external rate limit, not this diff — same chain `dist`/`dist:local`
  already use); its `mac-qa-identity` matrix sibling was cancelled by GitHub's default
  matrix fail-fast. `provenance`/`smoke-*` consequently skipped. Worth a clean re-run once HF's
  limit clears (next push touching a lane file will retrigger it).
- Also dispatched `build.yml` on the branch (`gh workflow run build.yml --ref
  m2/M2-0187-build-once-candidate`) to prove the existing `npm run dist`/`dist:win` chains still
  package+launch after the `after-pack.mjs`/`check-packaged-runtime.mjs`/`check-packaged-launch.mjs`
  edits — run [36276368946](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36276368946):
  **green**, both macOS and Windows package jobs succeeded; logs show
  `check-packaged-runtime`/`check-packaged-launch` ran for real against the shipping `Metis`/
  `Metis.exe` bundle names and passed, confirming the `basename(app, '.app')` refactor is
  behaviourally identical to the old hardcoded name for the existing chains.
- BLOCKED_EXTERNAL (owner/hardware, unchanged from the design): B-05 (`QA_MAC_SIGNING` — confirmed
  absent via `gh secret list`, so candidates stay ad-hoc signed and provenance says so honestly), TCC
  persistence across two QA-signed candidates (M2-0007, `qa-mac`), and publication itself.
- Not yet done: PR needs Opus validation recorded in the ticket before it leaves draft/merges (only
  the Opus orchestrator merges PRs per this repo's `AGENTS.md` §4/§5); `ledger/tickets.json` status
  is the orchestrator's to change, not touched here.

## Watch out
- The agent Bash sandbox allows writes under /Users/tony, so it does NOT protect OneDrive data.
- Never use git stash in worktrees (shared stack). Never push tags.
- 62 quarantines on 09-23 attributed to test runs is DERIVED, not proven (M2-0003 / CRITIC-INV-2); today's 2 coincide with agent test runs.
