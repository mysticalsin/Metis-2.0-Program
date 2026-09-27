# Runbook: integration and the merge queue (M2-0188, PD-13)

Program document — private. Never copy it into the public `AskToto-Mantu` repository. Written by the
M2-0188.1 implementer (an Opus ticket-runner session, 2026-09-27); the lead merges it. The claims
checker it specifies (§13) is slice M2-0188.2.

Labels follow software-architecture-engineer v1.4.0. Facts carry OBSERVED, PROVIDED, DERIVED, ASSUMED or
UNKNOWN with a source. Rules cite the decision they rest on. Anything this runbook introduces is PROPOSED
and has a row in §15; DECISIONS.md is not edited here. "The lead" is the Opus orchestrator session
(PLAN.md:44). Public-repository line numbers refer to `m2/integration` at 3afebbdf. Program-document
paths are relative to `docs/metis-2.0/`, and their line numbers refer to the program repository's `main`
at 523fc90, where every cited line reads as it did in the lead's ledger commits 521162f and 8cae2a6.

## 1. Invariants

| # | Invariant | Enforced by |
|---|---|---|
| INT-1 | One integrator: only the lead merges into `m2/integration`, `release/1.9.x` and the program repository's `main`, and only the lead writes the ledger and the evidence records | PD-13; the session permission policy refuses merges by subagents (PROVIDED, lead notes 2026-09-26); §8 program-repository step 2. GitHub cannot enforce it (F13) |
| INT-2 | One writer per hot unit: at most one IN_PROGRESS ticket claims each hot unit (§4), and a PR changes a hot unit only if its ticket is that holder | `claims-check.mjs` on the ledger (§13); the PR-files step (§8 step 3) |
| INT-3 | The tested tree is the tree that lands: a PR that changes a hot unit merges only when its head already contains the `m2/integration` head and `build.yml` is green on that head, so the merge commit's tree equals the tree CI tested | §8 steps 2 and 4; `gh pr merge --match-head-commit` |
| INT-4 | The trunk stays green: no hot-unit merge while the `m2/integration` head run is red or still running | §9 |
| INT-5 | At most three IN_PROGRESS tickets claim `src/main/**` | `claims-check.mjs` (§13) |
| INT-6 | Repository code runs only in GitHub Actions | D-28 (§12) |
| INT-7 | Only the owner merges into the public repository's `main`, through milestone PRs | Owner decision of 2026-09-26 (OD-12, §15) |
| INT-8 | A ticket's evidence lives in `docs/metis-2.0/evidence/records/<ticket>.jsonl`; the ledger holds status, not evidence | evidence/SCHEMA.md §6; `ledger.yml` append-only step |

## 2. Branches and flow

```
m2/M2-####-slug --draft PR, validated--> m2/integration --snapshot m2/milestone-<mN>, PR, owner merges--> main
main commit C --qa-candidate, owner approves--> promoted 1.9.7 --> release/1.9.x created at C <-- backport PRs
```

| Branch | Created from | Written by | GitHub protection (OBSERVED, `gh api …/rulesets`, 2026-09-27) |
|---|---|---|---|
| `m2/M2-####-slug` | `origin/m2/integration` | its ticket runner only; brought up to date by merging `origin/m2/integration` in, never rebased or force-pushed once pushed | none |
| `m2/integration` | `main` (2026-09-26) | the lead, by merging PRs | none: `rules/branches/m2%2Fintegration` returns `[]` (D-33) |
| `m2/milestone-<mN>` | a green `m2/integration` commit | the lead, once; never updated | none needed |
| `main` | — | the owner, by merging milestone PRs | `protect-main-deletion`: deletion and non_fast_forward; no required checks |
| `release/1.9.x` | the promoted 1.9.7 candidate's commit (§11) | the lead, by merging backport PRs | `protect-release-branches` (`release/*`): deletion and non_fast_forward |

Two properties of `.github/workflows/build.yml` shape the queue (OBSERVED):

- It runs on a push to any branch (`:11-16`), but its `pull_request` trigger covers only `main` and
  `master` (`:17-18`). A PR into `m2/integration` is tested only as its pushed head; the merge result is
  never built before it lands. INT-3 closes that gap by requiring the head to contain the integration head.
- The macOS and Windows package jobs run only on pushes to `main`, PRs into `main` and
  `workflow_dispatch` (`:227-230`, `:367-370`). Nothing packages `m2/integration` unless the lead dispatches it
  (§8 step 6).

## 3. Roles

| Actor | Does | Never |
|---|---|---|
| Owner (Tony) | Reviews and merges milestone PRs into `main`; approves promotion of exact candidate bytes (ACCEPTED); answers decisions | — |
| Lead (Opus orchestrator session) | Dispatches tickets and sets ledger status; runs the queue; merges into `m2/integration`, `release/1.9.x` and the program repository's `main`; appends evidence records; cuts milestone snapshots and `release/1.9.x`; keeps `_relay/HANDOFF.md` | Merges into the public repository's `main`; validates work its own session wrote |
| Ticket runner (Sonnet; Opus for design tickets) | Implements one ticket or slice in its own worktree; pushes only its own branch; iterates on CI; opens a draft PR into `m2/integration`, or into the program repository's `main` when the ticket's scope is a program document; returns the structured report | Merges; edits ledger status or evidence records; pushes to either repository's `main`; runs repository code on a Mac; pushes tags |
| Opus validator (separate session) | Five-axis review of the diff and the CI runs; pastes the evidence record into the PR body | Validates its own session's work (`validator_session.id ≠ implementer_session.id`, SCHEMA.md §3) |
| Codex / ChatGPT; Cursor (AGENTS.md §5) | Codex and ChatGPT audit and review. Cursor makes owner-driven edits on the same tickets, branches and PR template, so its PRs go through this queue like a runner's | Approve their own work; merge |
| GitHub Actions | Runs every test, node-based check, build and package | — |

## 4. Hot units and claims

Nine hot units (M2-0188 acceptance 1). A unit is one lock even when it spans several paths.

| Unit | Paths |
|---|---|
| `index` | `src/main/index.ts` |
| `app` | `src/renderer/src/App.tsx` |
| `ipc` | `src/shared/ipc.ts` |
| `preload` | every file under `src/preload/` |
| `deps` | `package.json` and `package-lock.json` |
| `release-wf` | `.github/workflows/release.yml` |
| `build-wf` | `.github/workflows/build.yml` |
| `helper` | `native/mac-helper/main.swift` |
| `ledger` | `docs/metis-2.0/ledger/tickets.json` (program repository; only the lead writes it) |

**Claims.** A claim is an entry of a ticket's `scope_paths`. A claim covers a unit path when it is the same
path; when it is a directory (ends in `/`) that contains the path; when the unit is a directory that
contains the claim; or when it is a glob whose `*` (any run of characters except `/`) matches the path.
So `native/mac-helper/` claims `helper`, and `.github/workflows/` claims both workflow units.

**The holder** of a unit is the one IN_PROGRESS ticket whose claims cover it.

1. The lead takes all of a ticket's claims at once, when it sets the ticket IN_PROGRESS. A ticket that
   needs several units (M2-0214 needs `index`, `ipc`, `deps` and `build-wf`) starts only when all are
   free. No ticket holds one unit while waiting for another, so the locks cannot deadlock.
2. Claims are released when the ticket leaves IN_PROGRESS, which happens only when its last slice lands
   (§9 step 2). Between slices the ticket keeps every claim.
3. A runner that finds it needs an unclaimed hot unit stops and asks the lead. The lead adds the path to
   `scope_paths` if the unit is free; otherwise the ticket waits, or the hot-file change becomes its own
   ticket. A PR that changes an unclaimed hot unit is not merged (§8 step 3).
4. Watch list: `src/main/logger.ts`. Three PRs changed it on 2026-09-26 (#207, #208, #210) without a
   conflict (OBSERVED, `gh pr view --json files`). Promoting a file to a hot unit is one row here plus
   the constant in `claims-check.mjs`, in one PR.

## 5. Landing orders

A unit's declared order is its **dispatch order**. When a unit is released, the lead gives it to the first
ticket in the order that is ready: its `depends_on` satisfy L3, every other unit it needs is free, and
INT-5 allows it. A ticket that is not ready is overtaken and keeps its place. A unit with no declared
order goes to ready tickets by `depends_on`, then milestone, then ticket id.

Why a lock rather than parallel work with serialized merges: the Evidence check binds a record to the PR
head (SCHEMA.md §5), so every hot merge would make each other open PR on that unit stale and force a
re-sync, a new CI run and a re-recorded validation (DERIVED). The W1 shape keeps the lock short.

**`index`** — declared for 1.9.7 (M2-0188 acceptance 2; PLAN.md:132): M2-0004 → 0006 → 0026 → 0036 →
0030 → 0031 → 0193 → 0033 → 0037. Two m3 tickets created later also claim it (OBSERVED, ledger). PROPOSED
(PD-30): M2-0215, observability slice 2, directly after 0006, because it is 0006's split-off remainder
(71adb41, on `main` since b8f20bc) and inherits its slot; M2-0214 after 0037, because the Cahê key it
served is already revoked (`_relay/archive/2026-09-26-213714-claude-code.md`, "PURGE STATUS") and it
should not delay the 0030 → 0031 → 0193 critical path. Result: 0004 → 0006 → 0215 → 0026 → 0036 →
0030 → 0031 → 0193 → 0033 → 0037 → 0214, then the W3 tickets by the default rule. The slot after 0006
belongs to the observability slice under whatever id it keeps: PR #2 files a different ticket as M2-0215
(F18).

**`helper`** — declared (M2-0188 acceptance 2; ARCHITECTURE.md:245): M2-0027 → 0191 → 0192 → 0028 →
0084. M2-0191 landed first (PR #210, merge f75383e7) while M2-0027 was not ready: it needs M2-0026 and
the QA host M2-0007 (OBSERVED, ledger `depends_on`). Under this section's rule that is a correct overtake
(DERIVED). Remaining: 0027 → 0192 → 0028 → 0084.

**W1 shape** (M2-0188 acceptance 2). A W1 ticket that touches `index.ts` is a new module with its own
tests plus a minimal call-site swap in `index.ts`. Until FF-04's per-file ceiling (ARCHITECTURE.md:463,
M2-0047) ratchets `index.ts` in CI, the validator treats any logic added to `index.ts` beyond imports and
the swapped call sites as a finding.

**Realized order comes from git, not from a hand-kept log.** In a clone of the public repository,
`rtk proxy git log --first-parent --format='%h %s' origin/m2/integration -- src/main/index.ts` lists, in
landing order, the merges that changed the unit; each merge subject names the ticket (§8 step 7). The
`rtk proxy` prefix matters on this Mac: the RTK hook rewrites a plain `git log` and drops merge commits
(OBSERVED: run through the hook, the command printed only 2026-09-20 commits and missed e8ddf8a7, the
merge of #207). Without a clone,
`gh api 'repos/mysticalsin/AskToto-Mantu/commits?sha=m2/integration&path=src/main/index.ts'` lists the
commits instead of the merges, newest first; a program commit's subject ends in its ticket id. One landing
bypassed the queue so far: M2-0003 changed `index.ts` (commit 21d3d8ee, PR #207) without being in the
declared order or claiming the file (OBSERVED, `gh api …/commits?sha=m2/integration&path=src/main/index.ts`).

## 6. Concurrency caps

- At most one holder per hot unit (INT-2) and at most three IN_PROGRESS tickets claiming `src/main/**`
  (INT-5). Both are machine-checked (§13) and count every IN_PROGRESS claimer, as acceptance 3 states, so a
  ticket keeps its unit and its `src/main` slot while it waits for validation or merge and between its
  slices, until its last slice lands (§9 step 2).
- At most eight concurrent ticket agents, six to eight as the target (PLAN.md:48). This is the lead's
  dispatch rule, not machine-checked: it counts running agents, and an IN_PROGRESS ticket waiting for
  validation or merge has none.
- One validator session per ticket, never the implementer's.

## 7. Ticket lifecycle

1. **Dispatch (lead).** Take a ticket from the ready queue (PLAN.md §14) under §4 to §6. Set
   `status: IN_PROGRESS`, `claimed_by`, `claimed_at`. Commit to the program repository's `main`
   (`ledger: M2-#### in progress`) and push it, so `ledger.yml` checks the claims (it runs on pushes to
   `main` and on PRs).
2. **Implement (runner).** Worktree `~/AI-Brain-build/metis-wt-M2-####`, branch `m2/M2-####-slug` from
   `origin/m2/integration`. Push the failing test first (its red run is the repro), then the fix (the
   green run). Locally only git, gh, reading files and `npx tsc --noEmit -p <tsconfig>` (D-28). Waiting
   on CI:

   ```
   gh run list --repo mysticalsin/AskToto-Mantu --branch <branch> --limit 3 --json databaseId,headSha,status,conclusion
   gh run watch <id> --repo mysticalsin/AskToto-Mantu --interval 30
   gh run view <id> --repo mysticalsin/AskToto-Mantu --log-failed | tail -300
   ```

   Open a **draft** PR into `m2/integration` with `.github/pull_request_template.md`, titled
   `<conventional summary> [M2-####]`, and return the structured report (PR, commits, red run, green run,
   acceptance status). A ticket with slices gets one PR per slice (PLAN.md:48), and the PR body names
   the slice.
3. **Validate (validator).** Review rounds on the diff and the runs; the runner pushes fixes to the same
   branch and CI runs again. On PASS, with `build.yml` green on the final head, the validator pastes the
   ` ```json evidence ` record into the PR body and `evidence.yml` verifies it against that head. The
   record lists in `inherited_block` every ENGINEERING_COMPLETE or BLOCKED_EXTERNAL `depends_on` ancestor
   that has an `external_blocker` (§9 step 2).
4. **Merge (lead):** §8. **Record (lead):** §9.

## 8. Merging ticket PRs

Per PR into `m2/integration`, with `N` the PR number, `SHA` its head, `T` its ticket and `S` the slice it
implements when `T` has slices:

1. **Validated.** The evidence record is in the body and the `Evidence record` check is green
   (`gh pr checks N --repo mysticalsin/AskToto-Mantu`).
2. **Green on the head, no regression.** `build.yml` succeeded on `SHA` with the baseline job set:
   Operator Worker, both Quality checks and Security & supply chain green, the two package jobs skipped
   (OBSERVED on baseline run 36267674617).
   `gh run list --repo mysticalsin/AskToto-Mantu --workflow build.yml --commit SHA --json databaseId,conclusion`
3. **Hot units held.** List the hot files the PR changes:

   ```
   gh pr view N --repo mysticalsin/AskToto-Mantu --json files --jq '.files[].path' | grep -E \
     '^(src/main/index\.ts|src/renderer/src/App\.tsx|src/shared/ipc\.ts|src/preload/.*|package(-lock)?\.json|\.github/workflows/(release|build)\.yml|native/mac-helper/main\.swift)$'
   ```

   Each line must be covered by `T`'s `scope_paths`, and `T` must be IN_PROGRESS. The ledger check cannot
   see this: #207, #213 and #206 each merged with a hot file their ticket does not claim (F3).
4. **Up to date (hot-unit PRs only).** If step 3 printed a line, the head must contain the integration
   head — `gh api repos/mysticalsin/AskToto-Mantu/compare/SHA...m2/integration --jq .ahead_by` prints `0`
   — and the integration head's own run must be green (INT-3, INT-4). Otherwise the runner merges
   `origin/m2/integration` into its branch, CI runs again and the validator re-records on the new head.
   Every merge after that sync makes the PR stale again, so the lead asks for the sync only when the PR is
   next to merge and steps 1 to 3 pass; the runner does not chase the moving head.
5. **Release window.** §11 allows it.
6. **Packaging (when relevant).** If the PR changes `deps`, `build-wf`, `helper` or an electron-builder
   config, the package jobs have passed on the branch:
   `gh workflow run build.yml --repo mysticalsin/AskToto-Mantu --ref <branch>` (push runs skip them, §2).
7. **Merge**, always with a merge commit: squash or rebase would orphan the head commit the evidence record
   names. The subject names `S`, or `T` when it has no slices, so git shows which slices have merged.

   ```
   gh pr ready N --repo mysticalsin/AskToto-Mantu
   gh pr merge N --repo mysticalsin/AskToto-Mantu --merge --match-head-commit SHA --subject "Merge pull request #N [S or T]"
   ```

**Batches.** PRs whose file sets are pairwise disjoint may merge back to back. A batch holds at most one
hot-unit PR: it passes step 4 and merges first, before its siblings move the integration head. The others
change no hot unit and skip step 4. Each merge commit gets its own `build.yml` run, so a red run names its
merge (OBSERVED: the four merges of 2026-09-26 23:46 UTC produced runs 36280486263, 36280488859,
36280491532 and 36280495270, all green).

**Program-repository PRs.** A ticket whose scope is a program document opens its PR into the program
repository's `main` (§3). That repository has no `build.yml`, no `evidence.yml` and no installer, and no
workflow runs there (F8), so steps 1 to 7 do not apply. With `N`, `SHA`, `T` and `S` as above:

1. **Claimed paths only.** Every path the PR changes is covered by `T`'s `scope_paths` (§4 matching), and
   `T` is IN_PROGRESS:
   `gh pr view N --repo mysticalsin/Metis-2.0-Program --json files --jq '.files[].path'`.
2. **No ledger or record edits.** A change under `docs/metis-2.0/ledger/**` or
   `docs/metis-2.0/evidence/records/**` is not merged as it stands, even when claimed (INT-1). The runner
   removes it from the branch and proposes it in the PR body; the lead applies it in its own ledger
   commit (§9 step 2). PRs #2 and #6 show why (F19).
3. **Validated.** The body holds the validator's DESIGNED record, whose `output` is `{ path, sha256 }` of
   the document at `SHA` (L15, SCHEMA.md:279). No workflow checks it before the merge, so the lead does:
   `git show SHA:docs/metis-2.0/<path> | shasum -a 256` prints `output.sha256`. Once the record is on
   `main`, `ledger.yml` checks it on every push, when that workflow is there (F8).
4. **Merge** with a merge commit and the step 7 subject, using `--repo mysticalsin/Metis-2.0-Program`.
   `git diff SHA <merge sha> -- <path>` must print nothing for each recorded document, or L15 fails on
   `main`. Then §9 from step 2.

## 9. After a merge

1. **Wait for the `m2/integration` head run.** If it is red and the merge caused it: stop merging, revert
   through a PR (`git revert -m 1 <merge>` on a lead branch cut from `origin/m2/integration`), and leave the
   ticket IN_PROGRESS. It keeps its units; the runner fixes on the branch and the PR goes through §8 again.
   A program-repository merge has no run and starts at step 2.
2. **When it is green**, one commit on the program repository's `main`, pushed:
   - append each evidence record in the PR body (a PR can carry one per level, such as DESIGNED and
     LOCALLY_TESTED), compacted with `jq -c`, one line each, to `evidence/records/<T>.jsonl`, never editing
     an existing line (SCHEMA.md §6);
   - **if another slice of `T` has not merged yet** (the merge subjects name the merged ones, §8 step 7),
     `T` stays IN_PROGRESS with all its claims: it keeps its units and its `src/main` slot for the next
     slice, and its dependants keep waiting. The subject is `ledger: <S> merged (#N, <merge sha>)`, and
     nothing below applies;
   - **otherwise `T` has landed**: this was its last slice, or its only PR. Set the status. **DONE** when
     every `required_evidence` level has a latest PASS record and no `depends_on` ancestor is
     ENGINEERING_COMPLETE or BLOCKED_EXTERNAL (L9). Otherwise **ENGINEERING_COMPLETE** (L8), and when a
     level the ticket still lacks needs the owner (LIVE_VERIFIED on a candidate, HOST_CONFIGURED,
     MEASURED, or ACCEPTED, the owner's dated `owner_statement`), set `external_blocker` to that owner step
     as below; a ticket capped only by an ancestor needs no blocker of its own. Either way the ticket
     releases its units and no longer holds back its dependants (L3). A ticket whose last slice has landed
     never stays IN_PROGRESS: it would keep its units and stall its dependants (F1);
   - dispatch the next holder of each released unit (§5);
   - subject `ledger: <T> landed (#N, <merge sha>)`.

   The ticket's fields when LIVE_VERIFIED is missing; a HOST_CONFIGURED, MEASURED or ACCEPTED gap names its
   own owner step the same way. The text cites ticket ids, runbook sections and invariants only, never a
   proposed decision id, so it stays true whatever id the QA-host proposal lands under (§15) and however
   the owner answers it:

   ```json
   {
     "status": "ENGINEERING_COMPLETE",
     "external_blocker": {
       "owner": "Program owner (Tony)",
       "unblock_step": "Merge the milestone PR that contains <merge sha> (#<N>) into main (runbooks/integration.md INT-7). The lead then builds a candidate from main's head (runbooks/qa-candidate.md §3), and <T>'s LIVE_VERIFIED check runs against that candidate's sha256 on the QA host (M2-0007) once the owner permits candidate runs on the QA user (runbooks/integration.md §12)",
       "needed_by": "<the milestone's candidate date: 2026-10-03 for 1.9.7>",
       "raised_on": "<landing date>"
     }
   }
   ```

   While `<T>` is ENGINEERING_COMPLETE, a dependant that lands also closes as ENGINEERING_COMPLETE, and
   each of its latest records lists `{ "ticket": "<T>", "unblock_step": … }` in `inherited_block` (L10;
   SCHEMA.md:125). When `<T>`'s LIVE_VERIFIED PASS record is appended, its `external_blocker` returns to
   null, or names the next owner step if another level it lacks needs one, and `<T>` may become DONE (L9,
   as above). A dependant can become DONE only after `<T>` does, and only with a new record at each
   required level that carries no `inherited_block` (L9, L10; README.md:63-66). L8 stays as it is, so an
   ENGINEERING_COMPLETE ticket always states what it waits on (ADR-017).
3. Update `_relay/HANDOFF.md`.

## 10. Milestone PRs to main

1. Pick a green `m2/integration` commit and create a snapshot branch at it. It is never updated, so the
   owner reviews a fixed target while the queue keeps moving:
   `gh api repos/mysticalsin/AskToto-Mantu/git/refs -f ref=refs/heads/m2/milestone-<mN> -f sha=<commit>`
2. `gh pr create --repo mysticalsin/AskToto-Mantu --base main --head m2/milestone-<mN> --title "Milestone <mN>: …"`.
   Its `pull_request` run includes both package jobs (§2).
3. The owner reviews and merges with **Create a merge commit**, which keeps every ticket commit an
   evidence record names reachable from `main`.
4. `m2/integration` needs nothing afterwards: its history is already in `main`. If `main` receives a
   commit that did not come from a milestone PR, the lead merges `main` into `m2/integration` through a
   PR, queued like a hot-unit PR because it may touch anything.

## 11. The 1.9.7 release window and release/1.9.x

**Window (PROPOSED, D-32).** The candidate lane builds only from `main`'s head (OBSERVED:
`.github/workflows/qa-candidate.yml:41,45-51`), so 1.9.7 contains everything on `m2/integration` when the
m3 snapshot is cut. Until then, a PR that changes what goes into the installer (`src/**` other than tests,
`native/**`, `intelligence/**`, `deps`, electron-builder configs) merges only if its ticket is in milestone
m2 or m3. PRs that change only tests, `scripts/`, `docs/`, other workflows or `operator/` are not held.

**Cut (PROPOSED, D-34).** After the owner approves promotion (ACCEPTED), the lead creates `release/1.9.x`
at the commit recorded in the promoted candidate's `provenance.json`:
`gh api repos/mysticalsin/AskToto-Mantu/git/refs -f ref=refs/heads/release/1.9.x -f sha=<commit>`. That
commit is what M2-0046 and M2-0188 call "the 1.9.7 tag": the lane never tags this repository (ADR-022
INV-6; runbooks/qa-candidate.md:16).

**Backports** (M2-0188 acceptance 6). "Fix on main first" means the trunk, which is `m2/integration`.

1. The fix and its test land on `m2/integration` through the ticket's PR.
2. A backport PR from `backport/1.9.x/M2-####`, branched from `release/1.9.x`, into `release/1.9.x`:
   `git cherry-pick -x` the test commit and push (red run on 1.9.x), then the fix commits and push (green
   run). The test file is unchanged.
3. Where the code has moved on the trunk, write the 1.9.x fix and its test against `release/1.9.x` in their
   own PR, and link the two PRs to each other and to the ticket.
4. The lead merges backport PRs with a merge commit. A 1.9.x candidate is built and promoted like any other,
   with the owner's approval. Today the lane cannot build from `release/1.9.x` and no hotfix version number
   is defined (F11, D-34).

## 12. Where things run (D-28)

| What | Where |
|---|---|
| Full suites, targeted tests, `npm run typecheck`, builds | GitHub Actions only. D-28 (DECISIONS.md:128) supersedes M2-0188 acceptance 4's "local runs are targeted files under the hermetic harness": no repository test, script or app runs on any Mac |
| On any Mac | git, gh, reading files, `npx tsc --noEmit -p <tsconfig>` (executes no repository code) |
| Packaging | `build.yml` package jobs (PRs into `main`, dispatch) and `qa-candidate.yml` |
| Packaged runs of a candidate | CI runners (`qa-candidate.yml` smoke jobs). On the QA macOS user only if the owner grants D-35, and then one run at a time: a run starts only after it creates the lock directory on the QA account with `mkdir` (atomic), writes the ticket id, the candidate sha256 and the start time into it, and removes it when it ends. A lock left by a dead run is cleared by the lead, never by another run. The QA host runbook (M2-0007) implements this contract |
| docker-compose service suites | CI jobs only, never the owner's Mac |

## 13. claims-check.mjs contract (M2-0188.2)

Public repository: `scripts/program/claims-check.mjs`, `scripts/program/claims-check.test.mjs`
(`node:test`) and a vitest wrapper `scripts/program/program.test.ts` that spawns `node --test` the way
`scripts/evidence/evidence.test.ts` does, so `npm test` in `build.yml` runs the suite. Data-free: the tests
build synthetic ledgers; no program data enters the public repository.

- **Exports:** `HOT_UNITS` (the §4 table: name and paths), `MAX_MAIN_PROCESS_CLAIMS = 3`, and a pure
  `claimProblems(ledger) → string[]` returning one line per problem, starting with the ticket ids.
- **Scope:** only tickets with `status === 'IN_PROGRESS'` count. An IN_PROGRESS ticket whose `scope_paths`
  is not an array of strings is itself a problem, because its claims cannot be checked.
- **C1:** a unit covered (§4 matching) by two or more IN_PROGRESS tickets gives one line naming the unit
  and every such ticket.
- **C2:** more than `MAX_MAIN_PROCESS_CLAIMS` IN_PROGRESS tickets with a claim inside `src/main/`, or a
  directory claim that contains it, gives one line naming them.
- **CLI:** `node scripts/program/claims-check.mjs --ledger <path>` prints the problems and exits 0 for none,
  1 for problems, 2 for a usage or read error.
- **Behaviour tests, at least:** a conflict, and none when one side is TODO, ENGINEERING_COMPLETE or DONE;
  `native/mac-helper/` against `native/mac-helper/main.swift`; two different files under `src/preload/`;
  `package.json` against `package-lock.json`; `release.yml` against `build.yml` (no conflict) and
  `.github/workflows/` against `build.yml` (conflict); a glob claim; prefix traps (`src/main/index.tsx`
  does not cover `index`, `src/preload-x/a.ts` does not cover `preload`, `src/mainline.ts` does not count
  for C2); three `src/main` tickets pass and four fail; a malformed `scope_paths`; each CLI exit code.
- **Wiring (program repository):** `ledger.yml` adds `scripts/program` to its sparse checkout and runs
  `node public/scripts/program/claims-check.mjs --ledger docs/metis-2.0/ledger/tickets.json`. This works
  only once the script is on `m2/integration` (the ref `ledger.yml` checks out) and `ledger.yml` itself is
  on the program repository's `main` (F8).

The same rules, applied by a read-only Python reading of `tickets.json` (not the script; D-28), reported C1
on `helper` (M2-0190, M2-0191) and C2 with four tickets (M2-0006, 0144, 0147, 0191) at 88106e2. At
521162f, where M2-0191 has left IN_PROGRESS, neither fires: `helper` has one holder (M2-0190) and three
tickets claim `src/main` (M2-0006, 0144, 0147), the cap. At 523fc90, after the batch 4 claims, both fire
again: C1 on `index` (M2-0004, 0006, 0030) and C2 with six tickets (M2-0004, 0006, 0030, 0056, 0144, 0147)
(DERIVED; F4, F5, F20).

## 14. Findings

Collected 2026-09-27 00:10 UTC and re-checked at 01:50 UTC. A ledger fact names its snapshot of the program
repository. 523fc90 is its `main` at 01:37 UTC: b8f20bc publishes the ledger of the lead's local commit
8cae2a6 unchanged, 094bb4b records #213, #214, #206 and program PR #4 as DONE, and 0229170 takes the batch 4
claims. 78ea497 (01:44 UTC), `main` at the re-check, only adds M2-0217 to M2-0219 to that ledger (F15), so
every 523fc90 fact below holds there too. The earlier snapshots are 8876e1c, the published `main` until
01:34 UTC, and the lead's local commits 88106e2 (2026-09-26 23:54 UTC), 521162f (00:47 UTC) and 8cae2a6
(00:56 UTC, which adds only M2-0216), none of them pushed. Rows without a snapshot state GitHub or
public-repository facts at the re-check.

| # | Finding | Label | Source | Handled by |
|---|---|---|---|---|
| F1 | **The 1.9.7 chain stalls only while landed tickets stay IN_PROGRESS.** A dependant may start only when each `depends_on` is ENGINEERING_COMPLETE, DONE, DEFERRED or BLOCKED_EXTERNAL (`scripts/evidence/check.mjs:22,179`, L3). A landed ticket whose remaining level is LIVE_VERIFIED waits on the owner: only the owner merges milestone PRs into `main` (INT-7), the lane builds only `main`'s head, and the QA host needs M2-0007 and D-35. The program routes anything that needs an owner or an outside account to an external blocker with the exact unblock step (README.md:37; AGENTS.md §4, `:71-72`), so ENGINEERING_COMPLETE with an owner-gated `external_blocker` passes L8 (`check.mjs:216`) and satisfies L3 for its dependants without a code change. At 523fc90, 48 tickets carry an `external_blocker`, several owned by other roles such as the Cloudflare account owner or the Entra tenant administrator, and none is ENGINEERING_COMPLETE. Live cases: at 8876e1c the landed M2-0191 (#210) was IN_PROGRESS, co-holding `helper` with M2-0190 (F5) as one of five `src/main` claimers against a cap of three (F4); its dependants could not start even without it, since M2-0192 also waits on M2-0006 and M2-0193 on M2-0030 and M2-0031. From 521162f on M2-0191 is DONE without a LIVE_VERIFIED record, and at 523fc90 M2-0187 (#213) is DONE without a HOST_CONFIGURED record; L9 rejects both. ENGINEERING_COMPLETE with the §9 blocker is the status that passes, and M2-0187 already carries its owner step | OBSERVED (rules, ledger) / DERIVED (stall) | `check.mjs`; ledger `required_evidence`, `depends_on`, `external_blocker` at 8876e1c, 521162f and 523fc90; `qa-candidate.yml:41,45-51` | §9 step 2 |
| F2 | M2-0003 changed `index.ts` (#207) outside the declared order and without claiming it | OBSERVED | `gh api …/commits?path=src/main/index.ts`; ledger `scope_paths` | §5, §8 step 3 |
| F3 | PRs merged with hot files their tickets do not claim: #207 (`index.ts`, M2-0003), #213 (`package.json`, M2-0187, merged 01:24 UTC) and #206 (`ipc.ts`, M2-0041, merged 01:31 UTC). #206 also broke the batch rule: it merged 3 s after #214, and its head did not contain #214's merge | OBSERVED | `gh pr view <n> --json files,mergedAt`; ledger `scope_paths`; `gh api …/compare/6083bddd...f637ae36` (`ahead_by` 11) | §8 steps 3 and 4, Batches |
| F4 | The `src/main` cap was exceeded from batch 1 on, which dispatched four claimers (M2-0003, 0006, 0035, 0043). 8876e1c lists five IN_PROGRESS claimers (those four and M2-0191); 88106e2 lists four (M2-0006, 0144, 0147 and M2-0191, which landed at 22:12 UTC); 521162f three (M2-0006, 0144, 0147), the cap. The batch 4 claims make six at 523fc90: M2-0004, 0006, 0030, 0056, 0144 and 0147 | DERIVED | ledger `scope_paths` at each snapshot; batch 1 worktrees in `_relay/archive/2026-09-26-213714-claude-code.md:20` | §6, §13 |
| F5 | `helper` is claimed twice at 8876e1c and 88106e2: M2-0190 (`native/mac-helper/`) and M2-0191, both IN_PROGRESS. From 521162f on M2-0190 holds it alone, although its PR #209 changes no file under `native/` | OBSERVED | ledger at each snapshot; `gh pr view 209 --json files` | narrow M2-0190's claim |
| F6 | The ledger lagged merges: at 8876e1c M2-0002 (#212, merged 23:14 UTC) and M2-0191 (#210, 22:12 UTC) were still IN_PROGRESS. 523fc90 records every merge so far, the eleven into `m2/integration` and program PR #4, as DONE: wrong for M2-0191 and M2-0187 (F1) and for M2-0024 and M2-0041 (F7), right for the others once their records exist (F7) | OBSERVED | `gh pr list --base m2/integration --state merged`; ledger at 8876e1c and 523fc90 | §9 step 2 |
| F7 | At 523fc90 `evidence/records/` holds only `.gitkeep`, and the twelve DONE tickets (M2-0001, 0002, 0003, 0010, 0024, 0035, 0041, 0043, 0045, 0187, 0191, 0204; eight at 521162f, six at 88106e2) carry an inline `evidence` object in `tickets.json` instead. DONE needs a PASS record per required level, so the ledger check fails on all twelve once it runs. It also fails L3 on two of them: M2-0024 depends on M2-0011 (IN_PROGRESS) and M2-0012 (TODO), and M2-0041 on M2-0005 (TODO). Whether M2-0001, merged "on local evidence", has a green run on its PR head is UNKNOWN | OBSERVED / DERIVED | `git ls-tree 523fc90 docs/metis-2.0/evidence/records/`; ledger; `check.mjs` | INT-8; backfill the records; §5 (dispatch needs L3) |
| F8 | Program CI has never run: `gh run list --repo mysticalsin/Metis-2.0-Program` is empty and GitHub lists no workflow. `ledger.yml` is not on the program repository's `main` (523fc90): it exists only in the lead's local lineage (added by 71adb41), and b8f20bc re-landed that lineage's documents without it | OBSERVED | `gh api …/actions/workflows`; `git cat-file -e origin/main:.github/workflows/ledger.yml` | §7 step 1; §16 |
| F9 | T1 and m5 work is on the trunk. M2-0043 (#202) and M2-0045 (#203), merged 2026-09-26 23:46 UTC, and M2-0041 (#206, 01:31 UTC) are on M2-0046's deferred-to-T1 list; M2-0204 (#214, m5, 01:31 UTC) changes `src/shared/grounding.ts`, which the installer ships. Batch 4 is building two more installer changes outside m2 and m3, M2-0056 (m4, `electron-builder.yml`) and M2-0203 (m5, `intelligence/`), so D-32 is needed before they are ready to merge | OBSERVED | `gh pr list --state merged`; M2-0046 acceptance; ledger `milestone`, `scope_paths` at 523fc90 | D-32 |
| F10 | There is no 1.9.7 tag to cut at: the lane never tags this repository, while PLAN.md:225 still says the promote workflow creates tags | OBSERVED | ADR-022 INV-6; qa-candidate.md:16 | D-34 |
| F11 | No 1.9.x hotfix path: the lane builds only `main`'s head, and PD-08's sequence (1.9.7 → 1.9.9 → …) leaves no number for a 1.9.x hotfix before T1 | OBSERVED / DERIVED | `qa-candidate.yml:41,45-51`; DECISIONS.md PD-08 | D-34 |
| F12 | `m2/integration` can be deleted or force-pushed; no branch has required status checks | OBSERVED | `gh api …/rulesets`, `…/rules/branches/…` | D-33 |
| F13 | GitHub cannot tell the lead from a subagent: every merge into `m2/integration` was made by the owner's account, the one `gh` credential every session on this Mac uses | OBSERVED (merges) / DERIVED (shared credential) | `gh pr list --json mergedBy` | INT-1 |
| F14 | Ticket views are stale: `ledger/tickets/M2-0003.md` shows status TODO and an empty Validation section. `tickets.json` and the records are the place of record | OBSERVED | the file | — |
| F15 | At 523fc90 M2-0214, M2-0215 (observability slice 2) and M2-0216 carry the v1 field `evidence_target` and lack `required_evidence`, `slices` and `needs_decision`, which rule L1 requires. 78ea497 adds M2-0217 to M2-0219 in the same shape | OBSERVED | ledger; `check.mjs` L1 | add the three fields |
| F16 | D-28 forbids any app run on any Mac, while 1.9.7 acceptance needs real cloud-backed dataless fixtures on the QA host | DERIVED | DECISIONS.md:128; M2-0046 acceptance 2; D-9 | D-35 |
| F17 | Lock throughput: PRs merged into `m2/integration` took 14 minutes (#205) to 5 h 13 min (#206) from open to merge; the full dispatch-to-merge cycle is not recorded. At about 6 h per cycle, the eleven 1.9.7 `index` tickets take about 66 h in sequence, against 144 h from 2026-09-27 00:00 UTC to the 10-03 candidate; every hour the queue idles comes out of that margin | OBSERVED (PR times) / ASSUMED (cycle time) | `gh pr list --json createdAt,mergedAt` | §5 |
| F18 | Two tickets share the id M2-0215. The lead's 71adb41 gives it to observability slice 2, split from M2-0006, and `main` has that ticket since b8f20bc; PR #2 (M2-0013), branched from 8876e1c, adds "Fresh-install speaker-ID default must not persist a voiceprint…" under the same id. This runbook's M2-0215 is the observability slice (§5, PD-30, F15) | OBSERVED | ledger at 523fc90; `git diff origin/main...origin/m2-0013-src-reverify-round3 -- docs/metis-2.0/ledger/tickets.json` | §16 |
| F19 | Program-repository PRs change paths their tickets do not claim, the ledger among them. #2 (M2-0013, claims `review/SRC-REVERIFY.md`) adds a ticket to `ledger/tickets.json` (F18) and D-31 to DECISIONS.md. #6 (M2-0057, claims `review/prior-exec/`) sets its own ticket IN_PROGRESS with `claimed_by` and an `external_blocker`, and edits `ledger/INDEX.md` and `ledger/tickets/M2-0057.md`. #1 (M2-0020, claims `memory/HINDSIGHT-PIN.md`) carries an M2-0013 commit, 393364a, that changes `review/SRC-REVERIFY.md`. No workflow runs there to stop them (F8) | OBSERVED | `gh pr view <n> --repo mysticalsin/Metis-2.0-Program --json files`; `git diff origin/main...origin/<branch>`; ledger `scope_paths` at 523fc90 | §8 program-repository PRs |
| F20 | `index` has three holders at 523fc90: M2-0006, IN_PROGRESS since batch 1, and M2-0004 and M2-0030, claimed in batch 4 (0229170). Under §4 rule 1 both would wait until M2-0006 lands | OBSERVED (claims) / DERIVED (rule) | ledger at 523fc90 | §4, §5, §13 C1; §16 |

## 15. Proposed rows for DECISIONS.md

D-32 to D-35 are the next free ids: DECISIONS.md ends at D-30 on `main` (523fc90), and PR #2 (M2-0013)
takes D-31 for its speaker-voiceprint question. OD-12 and PD-30 follow OD-11 and PD-29. An id still shifts
if another row lands first, so ledger text cites a row only once it is in DECISIONS.md, by the id it landed
under; until then it cites this runbook's section, as the §9 step 2 template does.

Section A (owner decision already made, not yet in DECISIONS.md):

| # | Date | Decision | Why (as recorded) | Alternatives considered | Where it lands |
|---|---|---|---|---|---|
| OD-12 | 2026-09-26 | Merge flow: validated ticket PRs merge into `m2/integration`; the owner reviews and merges milestone PRs into `main` | PROVIDED (`_relay/HANDOFF.md`, "Decisions made") | Ticket PRs straight into `main` (PLAN.md §10; AGENTS.md §4) | runbooks/integration.md §2, §10; PLAN.md §10, AGENTS.md §4 and README.md:30-33 to be amended |

Section B (program decisions):

| # | Decision | Why | Alternatives rejected | Tickets |
|---|---|---|---|---|
| PD-30 | The hot-file queue has one holder per hot unit, the single IN_PROGRESS ticket that claims it, with claims taken all at once at dispatch. Declared orders are dispatch orders among ready tickets, and a ticket that is not ready is overtaken. A PR changes a hot unit only if its ticket holds it, and a hot-unit PR merges only when up to date and green on its head. The `index` order gains observability slice 2 (M2-0215 on `main`; F18) after 0006 and M2-0214 after 0037 | Evidence binds to the PR head, so parallel work with serialized merges would re-sync, re-run and re-validate every open PR on a unit at each hot merge | Parallel development with serialized merges only; GitHub's merge queue (not evaluated for this user-owned repository, and it cannot see ledger claims) | M2-0188, 0214, 0215 |

Section D (open register):

| ID | Question | Recommended default | Class | Needed by | Status | Affected tickets |
|---|---|---|---|---|---|---|
| D-32 | Until the 1.9.7 (m3) snapshot is cut, which PRs that change the installer may merge into `m2/integration`? | Only m2 and m3 tickets. M2-0004 (m4, first in the `index` order) moves to m3. Four tickets outside m2 and m3 are already merged (F9): M2-0041, M2-0043 and M2-0045 from M2-0046's T1 list, and M2-0204. They ship in 1.9.7 and are listed in its release notes, and M2-0046's T1 list drops 0041, 0043 and 0045. The owner may instead have the lead revert any of them through a PR before the m3 snapshot. M2-0056 (m4) and M2-0203 (m5), in progress, wait | reversible | 2026-09-27 | OPEN | 0004, 0041, 0043, 0045, 0046, 0056, 0203, 0204 |
| D-33 | Protect `m2/integration` on GitHub? | Yes: a ruleset with deletion and non_fast_forward, as `main` has, plus required status checks (both Quality checks, Security & supply chain, Operator Worker) without "up to date", which the queue handles. ASSUMED: push-triggered runs on a PR's head satisfy required checks; confirm on the first PR after enabling | escalate: owner configuration | 2026-09-28 | OPEN | 0188 |
| D-34 | How is `release/1.9.x` cut, and how is a 1.9.x hotfix built and numbered? | Cut at the commit in the promoted 1.9.7 candidate's `provenance.json`. `qa-candidate.yml` also accepts the head of `release/1.9.x` (M2-0187 follow-up). A hotfix takes the next unused patch number (never 1.9.8, never reused), and the next train the one after it | reversible | 2026-10-03 | OPEN | 0046, 0187, 0206 |
| D-35 | May lane-built candidate bytes (not repository tests or scripts) run on the QA macOS user, one run at a time behind the §12 lock? | Yes, only sha256-verified candidate bytes and only on the QA account. Otherwise every 1.9.7 check that needs a real cloud-backed file is BLOCKED_EXTERNAL and packaged evidence comes from CI runners alone | escalate: owner (amends D-28) | 2026-10-02 | OPEN | 0007, 0008, 0046, 0187 |

## 16. Corrections other documents need (lead)

- PLAN.md §10 (:218-225): the repository is public with five active rulesets; ticket PRs target
  `m2/integration`; the promote workflow creates no tag; backports start on the trunk.
- PLAN.md §14: step 2 (`:305`) still allows tests "on the QA macOS user" (D-28), and step 5 (`:308`) still
  says to branch from `main` (OD-12).
- PLAN.md:132 and ARCHITECTURE.md:245: the `index` order per PD-30 and the realized `helper` order.
- AGENTS.md §4 in the public repository (`:63-68`): branch from `origin/m2/integration` and target it.
  One-file docs PR; no open ticket owns `AGENTS.md` since M2-0024 closed.
- README.md, the session entry point (`:44`: "Start every session by reading `_relay/HANDOFF.md`, then
  this file"): `:30` and `:32-33` still say to branch from `main` and target PRs at `main` (OD-12), and
  `:38-39` still say "targeted runs on the isolated QA macOS user" (D-28).
- M2-0188, before this PR merges: scope path `docs/metis-2.0/runbooks/integration.md` in place of
  `INTEGRATION.md`, or §8's program-repository step 1 refuses this PR; also `scripts/program/program.test.ts`
  for slice M2-0188.2; acceptance 4 per D-28; acceptance 6 per D-34 once it is decided. When this slice
  (M2-0188.1) merges, M2-0188 stays IN_PROGRESS with its claims; it lands with slice M2-0188.2 (§9 step 2,
  §13).
- M2-0046, once D-32 and D-34 are decided: the T1 list per D-32; "cut at the 1.9.7 tag" per D-34.
- Ticket ids (F18): when the lead applies PR #2's ledger change (§8, program-repository step 2), it files
  that ticket under the next free id, so M2-0215 stays the observability slice (§5, PD-30, F15).
- Ledger, now: M2-0191 and M2-0187 as ENGINEERING_COMPLETE with their owner blockers, not DONE (F1, F6);
  `index` back to one holder, M2-0006, and `src/main` back to three claimers, so M2-0004 and M2-0030 wait
  for M2-0006 to land and M2-0056 for a slot (F4, F20); M2-0024 and M2-0041, which fail L3, either have a
  dependency that is not real removed from `depends_on` or leave DONE until M2-0005, M2-0011 and M2-0012
  are ready (F7); M2-0190's claim narrowed (F5); `required_evidence`, `slices` and `needs_decision` on
  M2-0214, the observability M2-0215 and M2-0216 to M2-0219 (F15); records backfilled for every DONE and landed
  ticket (F7); `ledger.yml` pushed to the program repository's `main` (F8).
