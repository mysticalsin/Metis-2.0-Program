# Runbook: integration and the merge queue (M2-0188, PD-13)

Program document — private. Never copy it into the public `AskToto-Mantu` repository. Written by the
M2-0188.1 implementer (an Opus ticket-runner session, 2026-09-27); the lead merges it. The claims
checker it specifies (§13) is slice M2-0188.2.

Labels follow software-architecture-engineer v1.4.0. Facts carry OBSERVED, PROVIDED, DERIVED, ASSUMED or
UNKNOWN with a source. Rules cite the decision they rest on. Anything this runbook introduces is PROPOSED
and has a row in §15; DECISIONS.md is not edited here. "The lead" is the Opus orchestrator session
(PLAN.md:44). Public-repository line numbers refer to `m2/integration` at 7dab8e89 unless stated.
Program-document paths are relative to `docs/metis-2.0/`, and their line numbers refer to the lead's
ledger commit 521162f (`ledger: M2-0191 and M2-0002 done`).

## 1. Invariants

| # | Invariant | Enforced by |
|---|---|---|
| INT-1 | One integrator: only the lead merges into `m2/integration` and `release/1.9.x`, and only the lead edits ledger status | PD-13; the session permission policy refuses merges by subagents (PROVIDED, lead notes 2026-09-26). GitHub cannot enforce it (F13) |
| INT-2 | One writer per hot unit: at most one IN_PROGRESS ticket claims each hot unit (§4), and a PR changes a hot unit only if its ticket is that holder | `claims-check.mjs` on the ledger (§13); the PR-files step (§8 step 3) |
| INT-3 | The tested tree is the tree that lands: a PR that changes a hot unit merges only when its head already contains the `m2/integration` head and `build.yml` is green on that head, so the merge commit's tree equals the tree CI tested | §8 steps 2 and 4; `gh pr merge --match-head-commit` |
| INT-4 | The trunk stays green: no hot-unit merge while the `m2/integration` head run is red or still running | §9 |
| INT-5 | At most three IN_PROGRESS tickets claim `src/main/**` | `claims-check.mjs` (§13) |
| INT-6 | Repository code runs only in GitHub Actions | D-28 (§12) |
| INT-7 | Only the owner merges into `main`, through milestone PRs | Owner decision of 2026-09-26 (OD-12, §15) |
| INT-8 | A ticket's evidence lives in `docs/metis-2.0/evidence/records/<ticket>.jsonl`; the ledger holds status, not evidence | evidence/SCHEMA.md §6; `ledger.yml` append-only step |

## 2. Branches and flow

```
m2/M2-####-slug --draft PR, validated--> m2/integration --snapshot m2/milestone-<mN>, PR, owner merges--> main
main commit C --qa-candidate, owner approves--> promoted 1.9.7 --> release/1.9.x created at C <-- backport PRs
```

| Branch | Created from | Written by | GitHub protection (OBSERVED, `gh api …/rulesets`, 2026-09-27) |
|---|---|---|---|
| `m2/M2-####-slug` | `origin/m2/integration` | its ticket runner only; brought up to date by merging `origin/m2/integration` in, never rebased or force-pushed once pushed | none |
| `m2/integration` | `main` (2026-09-26) | the lead, by merging PRs | none: `rules/branches/m2%2Fintegration` returns `[]` (D-32) |
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
2. Claims are released when the ticket leaves IN_PROGRESS at landing (§9 step 2).
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
(PD-30): M2-0215 directly after 0006, because it is 0006's split-off remainder and inherits its slot; M2-0214
after 0037, because the Cahê key it served is already revoked (`_relay/HANDOFF.md`, "PURGE STATUS") and it
should not delay the 0030 → 0031 → 0193 critical path. Result: 0004 → 0006 → 0215 → 0026 → 0036 → 0030 →
0031 → 0193 → 0033 → 0037 → 0214, then the W3 tickets by the default rule.

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
  ticket waiting for validation or merge keeps its unit and its `src/main` slot until it lands (§9 step 2).
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
   acceptance status).
3. **Validate (validator).** Review rounds on the diff and the runs; the runner pushes fixes to the same
   branch and CI runs again. On PASS, with `build.yml` green on the final head, the validator pastes the
   ` ```json evidence ` record into the PR body and `evidence.yml` verifies it against that head. The
   record lists in `inherited_block` every ENGINEERING_COMPLETE or BLOCKED_EXTERNAL `depends_on` ancestor
   that has an `external_blocker` (§9 step 2).
4. **Merge (lead):** §8. **Record (lead):** §9.

## 8. Merging into m2/integration

Per PR, with `N` the PR number, `SHA` its head and `T` its ticket:

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
   see this: #207, #213 and #206 each changed a hot file their ticket does not claim (F3).
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
   names.

   ```
   gh pr ready N --repo mysticalsin/AskToto-Mantu
   gh pr merge N --repo mysticalsin/AskToto-Mantu --merge --match-head-commit SHA --subject "Merge pull request #N [T]"
   ```

**Batches.** PRs that change no hot unit and whose file sets are pairwise disjoint may merge back to back
without step 4. Each merge commit gets its own `build.yml` run, so a red run names its merge (OBSERVED: the
four merges of 2026-09-26 23:46 UTC produced runs 36280486263, 36280488859, 36280491532 and 36280495270,
all green). Merge a batch's hot-unit PR first, so its siblings never make it stale.

## 9. After a merge

1. **Wait for the `m2/integration` head run.** If it is red and the merge caused it: stop merging, revert
   through a PR (`git revert -m 1 <merge>` on a lead branch cut from `origin/m2/integration`), and leave the
   ticket IN_PROGRESS. It keeps its units, fixes on its branch and lands again through §8.
2. **When it is green**, one commit on the program repository's `main`, pushed:
   - append the PR's evidence record, compacted with `jq -c`, to `evidence/records/<T>.jsonl`, never
     editing an existing line (SCHEMA.md §6);
   - set the status. **DONE** when every `required_evidence` level has a latest PASS record and no
     `depends_on` ancestor is ENGINEERING_COMPLETE or BLOCKED_EXTERNAL (L9). Otherwise
     **ENGINEERING_COMPLETE** (L8), and when a level the ticket still lacks needs the owner (LIVE_VERIFIED
     on a candidate, HOST_CONFIGURED, MEASURED), set `external_blocker` to that owner step as below; a
     ticket capped only by an ancestor needs no blocker of its own. Either way the ticket releases its
     units and its dependants become ready (L3). A landed ticket never stays IN_PROGRESS: it would keep
     its units and stall its dependants (F1);
   - dispatch the next holder of each released unit (§5);
   - subject `ledger: <T> landed (#N, <merge sha>)`.

   The ticket's fields when LIVE_VERIFIED is missing; a HOST_CONFIGURED or MEASURED gap names its own
   owner step the same way:

   ```json
   {
     "status": "ENGINEERING_COMPLETE",
     "external_blocker": {
       "owner": "Program owner (Tony)",
       "unblock_step": "Merge the milestone PR that contains <merge sha> (#<N>) into main (INT-7). The lead then builds a candidate from main's head (runbooks/qa-candidate.md §3), and <T>'s LIVE_VERIFIED check runs against that candidate's sha256 on the QA host (M2-0007, D-34)",
       "needed_by": "<the milestone's candidate date: 2026-10-03 for 1.9.7>",
       "raised_on": "<landing date>"
     }
   }
   ```

   While `<T>` is ENGINEERING_COMPLETE, a dependant that lands also closes as ENGINEERING_COMPLETE, and
   each of its latest records lists `{ "ticket": "<T>", "unblock_step": … }` in `inherited_block` (L10;
   SCHEMA.md:125). When `<T>`'s LIVE_VERIFIED PASS record is appended, `<T>` becomes DONE and its
   `external_blocker` returns to null; each dependant then records every required level again, without that
   entry, before it can be DONE (L9, L10; README.md:63-66). L8 stays as it is, so an ENGINEERING_COMPLETE
   ticket always states what it waits on (ADR-017).
3. Update `_relay/HANDOFF.md`.

## 10. Milestone PRs to main

1. Pick a green `m2/integration` commit `S` and create a snapshot branch. It is never updated, so the owner
   reviews a fixed target while the queue keeps moving:
   `gh api repos/mysticalsin/AskToto-Mantu/git/refs -f ref=refs/heads/m2/milestone-<mN> -f sha=S`
2. `gh pr create --repo mysticalsin/AskToto-Mantu --base main --head m2/milestone-<mN> --title "Milestone <mN>: …"`.
   Its `pull_request` run includes both package jobs (§2).
3. The owner reviews and merges with **Create a merge commit**, which keeps every ticket commit an
   evidence record names reachable from `main`.
4. `m2/integration` needs nothing afterwards: its history is already in `main`. If `main` receives a
   commit that did not come from a milestone PR, the lead merges `main` into `m2/integration` through a
   PR, queued like a hot-unit PR because it may touch anything.

## 11. The 1.9.7 release window and release/1.9.x

**Window (PROPOSED, D-31).** The candidate lane builds only from `main`'s head (OBSERVED:
`.github/workflows/qa-candidate.yml:41,45-51` at PR #213's head e1127f87), so 1.9.7 contains everything on
`m2/integration` when the m3 snapshot is cut. Until then, a PR that changes what goes into the installer
(`src/**` other than tests, `native/**`, `intelligence/**`, `deps`, electron-builder configs) merges only if
its ticket is in milestone m2 or m3. PRs that change only tests, `scripts/`, `docs/`, other workflows or
`operator/` are not held.

**Cut (PROPOSED, D-33).** After the owner approves promotion (ACCEPTED), the lead creates `release/1.9.x`
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
   is defined (F11, D-33).

## 12. Where things run (D-28)

| What | Where |
|---|---|
| Full suites, targeted tests, `npm run typecheck`, builds | GitHub Actions only. D-28 (DECISIONS.md:128) supersedes M2-0188 acceptance 4's "local runs are targeted files under the hermetic harness": no repository test, script or app runs on any Mac |
| On any Mac | git, gh, reading files, `npx tsc --noEmit -p <tsconfig>` (executes no repository code) |
| Packaging | `build.yml` package jobs (PRs into `main`, dispatch) and `qa-candidate.yml` |
| Packaged runs of a candidate | CI runners (`qa-candidate.yml` smoke jobs). On the QA macOS user only if the owner grants D-34, and then one run at a time: a run starts only after it creates the lock directory on the QA account with `mkdir` (atomic), writes the ticket id, the candidate sha256 and the start time into it, and removes it when it ends. A lock left by a dead run is cleared by the lead, never by another run. The QA host runbook (M2-0007) implements this contract |
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
tickets claim `src/main` (M2-0006, 0144, 0147), the cap (DERIVED; F4, F5).

## 14. Findings (2026-09-27 00:10 UTC)

| # | Finding | Label | Source | Handled by |
|---|---|---|---|---|
| F1 | **The 1.9.7 chain stalls only while landed tickets stay IN_PROGRESS.** A dependant may start only when each `depends_on` is ENGINEERING_COMPLETE, DONE, DEFERRED or BLOCKED_EXTERNAL (`scripts/evidence/check.mjs:22,179`, L3). A landed ticket whose remaining level is LIVE_VERIFIED waits on the owner: only the owner merges milestone PRs into `main` (INT-7), the lane builds only `main`'s head, and the QA host needs M2-0007 and D-34. The program routes anything that needs an owner to an external blocker with the exact unblock step (README.md:37; AGENTS.md §4, `:71-72`), so ENGINEERING_COMPLETE with an owner-gated `external_blocker` passes L8 (`check.mjs:216`) and satisfies L3 for its dependants without a code change; 48 ledger tickets already carry owner blockers. Live case: M2-0191 landed (#210) and is IN_PROGRESS on the program repository's `origin/main`, which keeps M2-0192 and M2-0193 from starting. The lead's commit 521162f sets it DONE without a LIVE_VERIFIED record, which L9 rejects; ENGINEERING_COMPLETE with the §9 blocker is the status that passes | OBSERVED (rules, ledger) / DERIVED (stall) | `check.mjs`; ledger `required_evidence`, `depends_on`, `external_blocker`; `qa-candidate.yml:41,45-51` (PR #213 head e1127f87) | §9 step 2 |
| F2 | M2-0003 changed `index.ts` (#207) outside the declared order and without claiming it | OBSERVED | `gh api …/commits?path=src/main/index.ts`; ledger `scope_paths` | §5, §8 step 3 |
| F3 | PRs change hot files their tickets do not claim: #207 (`index.ts`, M2-0003), #213 (`package.json`, M2-0187), #206 (`ipc.ts`, M2-0041) | OBSERVED | `gh pr view <n> --json files`; ledger `scope_paths` | §8 step 3; add `package.json` to M2-0187 now (`deps` is free) |
| F4 | The `src/main` cap was exceeded: batch 1 dispatched four claimers (M2-0003, 0006, 0035, 0043); four are IN_PROGRESS now (M2-0006, 0144, 0147, 0191), one only because its status lags its merge | DERIVED | ledger `scope_paths`; batch lists in `_relay/HANDOFF.md` | §6, §13 |
| F5 | `helper` is claimed twice: M2-0190 (`native/mac-helper/`) and M2-0191, both IN_PROGRESS; #209 changes no file under `native/` | OBSERVED | ledger; `gh pr view 209 --json files` | narrow M2-0190's claim |
| F6 | The ledger lags merges: M2-0002 (#212, merged 23:14 UTC) and M2-0191 (#210, 22:12 UTC) are IN_PROGRESS on the program repository's `origin/main`. 521162f sets both DONE: right for M2-0002 once its record exists (F7), wrong for M2-0191 (F1) | OBSERVED | `gh pr list --base m2/integration --state merged`; ledger | §9 step 2 |
| F7 | `evidence/records/` holds only `.gitkeep`; the six DONE tickets (M2-0001, 0003, 0024, 0035, 0043, 0045) carry an inline `evidence` object in `tickets.json` instead. DONE needs a PASS record per required level, so the ledger check fails on all six once it runs. Whether M2-0001, merged "on local evidence", has a green run on its PR head is UNKNOWN | OBSERVED / DERIVED | `ls evidence/records`; ledger; `check.mjs` | INT-8; backfill the records |
| F8 | Program CI has never run: `gh run list --repo mysticalsin/Metis-2.0-Program` is empty and GitHub lists no workflow; `ledger.yml` is not on `origin/main` but on the local branch `m2-0020-hindsight-pin-round2`, 7 commits ahead | OBSERVED | `gh api …/actions/workflows`; `git cat-file -e origin/main:.github/workflows/ledger.yml` | §7 step 1 |
| F9 | T1 work is already on the trunk: M2-0043 (#202) and M2-0045 (#203), deferred to T1 by M2-0046's acceptance, merged on 2026-09-26; M2-0041 (#206, T1) is open | OBSERVED | `gh pr list`; M2-0046 acceptance | D-31 |
| F10 | There is no 1.9.7 tag to cut at: the lane never tags this repository, while PLAN.md:225 still says the promote workflow creates tags | OBSERVED | ADR-022 INV-6; qa-candidate.md:16 | D-33 |
| F11 | No 1.9.x hotfix path: the lane builds only `main`'s head, and PD-08's sequence (1.9.7 → 1.9.9 → …) leaves no number for a 1.9.x hotfix before T1 | OBSERVED / DERIVED | `qa-candidate.yml:41,45-51`; DECISIONS.md PD-08 | D-33 |
| F12 | `m2/integration` can be deleted or force-pushed; no branch has required status checks | OBSERVED | `gh api …/rulesets`, `…/rules/branches/…` | D-32 |
| F13 | GitHub cannot tell the lead from a subagent: every merge into `m2/integration` was made by the owner's account, the one `gh` credential every session on this Mac uses | OBSERVED (merges) / DERIVED (shared credential) | `gh pr list --json mergedBy` | INT-1 |
| F14 | Ticket views are stale: `ledger/tickets/M2-0003.md` shows status TODO and an empty Validation section. `tickets.json` and the records are the place of record | OBSERVED | the file | — |
| F15 | M2-0214 and M2-0215 carry the v1 field `evidence_target` and no `required_evidence`, which rule L1 rejects | OBSERVED | ledger | add `required_evidence` |
| F16 | D-28 forbids any app run on any Mac, while 1.9.7 acceptance needs real cloud-backed dataless fixtures on the QA host | DERIVED | DECISIONS.md:128; M2-0046 acceptance 2; D-9 | D-34 |
| F17 | Lock throughput: PRs merged on 2026-09-26 took 15 minutes to 4 hours from open to merge; the full dispatch-to-merge cycle is not recorded. At about 6 h per cycle, the eleven 1.9.7 `index` tickets take about 66 h in sequence, against 144 h from 2026-09-27 00:00 UTC to the 10-03 candidate; every hour the queue idles comes out of that margin | OBSERVED (PR times) / ASSUMED (cycle time) | `gh pr list --json createdAt,mergedAt` | §5 |

## 15. Proposed rows for DECISIONS.md

Row ids are proposals; renumber on entry. D-31 is already taken: PR #2 (M2-0013) gives that id to its
speaker-voiceprint question.

Section A (owner decision already made, not yet in DECISIONS.md):

| # | Date | Decision | Why (as recorded) | Alternatives considered | Where it lands |
|---|---|---|---|---|---|
| OD-12 | 2026-09-26 | Merge flow: validated ticket PRs merge into `m2/integration`; the owner reviews and merges milestone PRs into `main` | PROVIDED (`_relay/HANDOFF.md`, "Decisions made") | Ticket PRs straight into `main` (PLAN.md §10; AGENTS.md §4) | runbooks/integration.md §2, §10; PLAN.md §10, AGENTS.md §4 and README.md:30-33 to be amended |

Section B (program decisions):

| # | Decision | Why | Alternatives rejected | Tickets |
|---|---|---|---|---|
| PD-30 | The hot-file queue has one holder per hot unit, the single IN_PROGRESS ticket that claims it, with claims taken all at once at dispatch. Declared orders are dispatch orders among ready tickets, and a ticket that is not ready is overtaken. A PR changes a hot unit only if its ticket holds it, and a hot-unit PR merges only when up to date and green on its head. The `index` order gains M2-0215 after 0006 and M2-0214 after 0037 | Evidence binds to the PR head, so parallel work with serialized merges would re-sync, re-run and re-validate every open PR on a unit at each hot merge | Parallel development with serialized merges only; GitHub's merge queue (not evaluated for this user-owned repository, and it cannot see ledger claims) | M2-0188, 0214, 0215 |

Section D (open register):

| ID | Question | Recommended default | Class | Needed by | Status | Affected tickets |
|---|---|---|---|---|---|---|
| D-31 | Until the 1.9.7 (m3) snapshot is cut, which PRs that change the installer may merge into `m2/integration`? | Only m2 and m3 tickets. M2-0004 (m4, first in the `index` order) moves to m3. M2-0043 and M2-0045, already merged, ship in 1.9.7 and are listed in its release notes; M2-0046's T1 list drops them. M2-0041 waits | reversible | 2026-09-28 | OPEN | 0004, 0041, 0043, 0045, 0046 |
| D-32 | Protect `m2/integration` on GitHub? | Yes: a ruleset with deletion and non_fast_forward, as `main` has, plus required status checks (both Quality checks, Security & supply chain, Operator Worker) without "up to date", which the queue handles. ASSUMED: push-triggered runs on a PR's head satisfy required checks; confirm on the first PR after enabling | escalate: owner configuration | 2026-09-28 | OPEN | 0188 |
| D-33 | How is `release/1.9.x` cut, and how is a 1.9.x hotfix built and numbered? | Cut at the commit in the promoted 1.9.7 candidate's `provenance.json`. `qa-candidate.yml` also accepts the head of `release/1.9.x` (M2-0187 follow-up). A hotfix takes the next unused patch number (never 1.9.8, never reused), and the next train the one after it | reversible | 2026-10-03 | OPEN | 0046, 0187, 0206 |
| D-34 | May lane-built candidate bytes (not repository tests or scripts) run on the QA macOS user, one run at a time behind the §12 lock? | Yes, only sha256-verified candidate bytes and only on the QA account. Otherwise every 1.9.7 check that needs a real cloud-backed file is BLOCKED_EXTERNAL and packaged evidence comes from CI runners alone | escalate: owner (amends D-28) | 2026-10-02 | OPEN | 0007, 0008, 0046, 0187 |

## 16. Corrections other documents need (lead)

- PLAN.md §10 (:218-225): the repository is public with five active rulesets; ticket PRs target
  `m2/integration`; the promote workflow creates no tag; backports start on the trunk.
- PLAN.md:132 and ARCHITECTURE.md:245: the `index` order per PD-30 and the realized `helper` order.
- AGENTS.md §4 in the public repository (`:63-68`): branch from `origin/m2/integration` and target it.
  One-file docs PR; no open ticket owns `AGENTS.md` since M2-0024 closed.
- README.md, the session entry point (`:44`: "Start every session by reading `_relay/HANDOFF.md`, then
  this file"): `:30` and `:32-33` still say to branch from `main` and target PRs at `main` (OD-12), and
  `:38-39` still say "targeted runs on the isolated QA macOS user" (D-28).
- M2-0188: scope path `docs/metis-2.0/runbooks/integration.md` (not `INTEGRATION.md`) plus
  `scripts/program/program.test.ts`; acceptance 4 per D-28; acceptance 6 per D-33. The ticket closes only
  once slice M2-0188.2 (§13) lands.
- M2-0046: the T1 list per D-31; "cut at the 1.9.7 tag" per D-33.
- Ledger, now: M2-0191 as ENGINEERING_COMPLETE with the §9 step 2 blocker, not DONE (F1, F6);
  `package.json` in M2-0187's `scope_paths` (F3); M2-0190's claim narrowed (F5); `required_evidence` on
  M2-0214 and M2-0215 (F15); records backfilled for every DONE and landed ticket (F7); `ledger.yml` pushed
  to the program repository's `main` (F8).
