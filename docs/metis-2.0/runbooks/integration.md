# Runbook: integration and the merge queue (M2-0188, PD-13)

Program document — private. Never copy it into the public `AskToto-Mantu` repository. Written by the
M2-0188.1 implementer (an Opus ticket-runner session, 2026-09-27); the lead merges it. The claims
checker it specifies (§13) is slice M2-0188.2.

**Two parts.** Part I (§1 to §13) holds the rules and their reasons. It changes only as §8 "Amending a
recorded document" says. Part II (§14 to §16) is a dated audit: its findings, the decision rows it
proposes and the corrections it asks for are true at the snapshot named in §14, or at the later commit a
statement names, and it is not maintained after this document lands. The lead moves the decision rows
into DECISIONS.md.

Labels follow software-architecture-engineer v1.4.0. Facts carry OBSERVED, PROVIDED, DERIVED, ASSUMED or
UNKNOWN with a source. Rules cite the decision they rest on. Anything this runbook introduces is PROPOSED
and has a row in §15; DECISIONS.md is not edited here. "The lead" is the Opus orchestrator session
(PLAN.md:44). Public-repository line numbers refer to `m2/integration` at 5993c7e3. Program-document
paths are relative to `docs/metis-2.0/`, and their line numbers refer to the program repository's `main`
at 901ceaf.

# Part I: rules

## 1. Invariants

| # | Invariant | Enforced by |
|---|---|---|
| INT-1 | One integrator: only the lead merges into `m2/integration`, `release/1.9.x` and the program repository's `main`, and only the lead writes the ledger and the evidence records | PD-13; the session permission policy refuses merges by subagents (PROVIDED, lead notes 2026-09-26); §8 program-repository step 2. GitHub cannot enforce it (F11) |
| INT-2 | One writer per hot unit: at most one IN_PROGRESS ticket claims each hot unit (§4), and a PR other than the lead's merge of `main` (§10 step 4) changes a hot unit only if its ticket is that holder | The lead at dispatch (§4) and at merge (§8 step 3); `claims-check.mjs` in `ledger.yml` once both land (§13, F6) |
| INT-3 | The tested tree is the tree that lands: a PR that changes a hot unit merges only when its head already contains the `m2/integration` head and is green (§8 step 2), so the commit that lands has the tree CI tested | §8 steps 2 and 4; `gh pr merge --match-head-commit` |
| INT-4 | The trunk stays green: while the trunk is red (§8 step 2), no PR merges except the revert and the fix of a repeated failure, whether or not they change a hot unit; otherwise a hot-unit PR merges only on a green `m2/integration` head | §8 step 4; §9 step 1 |
| INT-5 | At most three IN_PROGRESS tickets claim `src/main/**` | The lead at dispatch (§6); `claims-check.mjs` once it lands (§13) |
| INT-6 | Repository code runs only in GitHub Actions | D-28 (§12) |
| INT-7 | Only the owner merges into the public repository's `main`, through milestone PRs | Owner decision of 2026-09-26 (OD-14, §15) |
| INT-8 | A ticket's evidence lives in `docs/metis-2.0/evidence/records/<ticket>.jsonl`; the ledger holds status, not evidence | evidence/SCHEMA.md §6; the append-only step of `ledger.yml` once it is on `main` (F6) |
| INT-9 | Only a runner's own ticket branch is ever rewritten: no session pushes with `--mirror`, `--all`, `--prune` or `--delete` or deletes a remote branch, in either repository, and the only force-push is a runner's `--force-with-lease` to its own ticket branch | PROVIDED: lead notes and runner rules, 2026-09-27, after a mirror push reset the program repository's `main` (§2). Among the branches this runbook uses, GitHub refuses a rewrite or deletion only on the public `main` and `release/*`, and only while their rulesets are on (§2, F11). The lead checks both `main` branches and `m2/integration` after each batch (§9 step 3) |

## 2. Branches and flow

```
m2/M2-####-slug --draft PR, validated--> m2/integration --snapshot m2/milestone-<mN>, PR, owner merges--> main
main commit C --qa-candidate, owner approves--> promoted 1.9.7 --> release/1.9.x created at C <-- backport PRs
program repository: m2-####-slug --draft PR, validated--> main
```

| Branch | Created from | Written by | GitHub protection (OBSERVED, `gh api …/rulesets`, 2026-09-27) |
|---|---|---|---|
| `m2/M2-####-slug` | `origin/m2/integration` | its ticket runner only; brought up to date by merging `origin/m2/integration` in, never by a rebase; force-pushed only by its runner, with `--force-with-lease` (INT-9) | none |
| `m2/integration` | `main` (2026-09-26) | the lead, by squash-merging PRs (§8 step 7) | none: `rules/branches/m2%2Fintegration` returns `[]` (D-33) |
| `m2/milestone-<mN>` | a green `m2/integration` commit | the lead, once; never updated | none needed |
| `main` | — | the owner, by merging milestone PRs | `protect-main-deletion`: deletion and non_fast_forward; no required checks |
| `release/1.9.x` | the promoted 1.9.7 candidate's commit (§11) | the lead, by merging backport PRs | `protect-release-branches` (`release/*`): deletion and non_fast_forward |
| program `m2-####-slug` | the program repository's `origin/main` | its docs-ticket runner only (§7 step 2); brought up to date by merging `origin/main` in, never by a rebase; force-pushed only by its runner, with `--force-with-lease` (INT-9) | none possible, as for program `main` |
| program `main` | — | the lead: its ledger, record and baton commits (§7 step 1, §9 steps 2 and 4), its DECISIONS.md and design commits (such as 61250ab and b8f20bc) and squash merges of docs-ticket PRs (§8) | none possible: the repository is private, and its rulesets and branch-rules APIs return HTTP 403 ("Upgrade to GitHub Pro or make this repository public"). INT-1 and INT-9 there rest on sessions alone (F11). At 04:35:52Z one push made with the owner's account, the one every session uses, reset `main` from 901ceaf to its ancestor 90ed28f and deleted ten branches, this PR's among them (OBSERVED, `gh api …/activity`): an external mirror push (PROVIDED, lead notes 2026-09-27). The lead's merge af39d16 (05:26:09Z) brought the lost commits back into `main` |

The public rulesets bind a session only while the owner's account, the one every session uses (F11), leaves
them on. All five, which also cover `cursor/*`, `fix/*` and `cursor/metis-bank-grade-fable`, were updated at
23:51:36-38Z on 2026-09-26, 18 to 21 s after one push at 23:51:18Z force-pushed the public `main`,
`release/1.1.0`, `release/1.8.3` and `release/1.9.1` (OBSERVED, `gh api …/rulesets`, `…/activity`).

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
| Ticket runner (a Claude driver session, OD-13) | Owns one ticket or slice in its own worktree: writes the brief, has Codex implement it, sends weak diffs back to Codex, then commits and pushes only its own branch; iterates on CI; opens a draft PR into `m2/integration`, or into the program repository's `main` when the ticket's scope is a program document; returns the structured report. It implements itself only when Codex is unavailable, recorded as a fallback, and for Opus-owned design work (OD-13) | Merges; adds or edits ledger tickets or evidence records; pushes to either repository's `main`, deletes any branch or rewrites any branch but its own (INT-9); runs repository code on a Mac; pushes tags |
| Opus validator (separate session) | Five-axis review of the diff and the CI runs; pastes the evidence record into the PR body | Validates its own session's work (`validator_session.id ≠ implementer_session.id`, SCHEMA.md §3) |
| Codex (OD-13) | Implements under a runner's brief, in the runner's worktree and sandbox | Commits, pushes or merges; approves its own work |
| ChatGPT; Cursor (AGENTS.md §5) | ChatGPT audits and reviews. Cursor makes owner-driven edits on the same tickets, branches and PR template, so its PRs go through this queue like a runner's | Approve their own work; merge |
| GitHub Actions | Runs every test, node-based check, build and package | — |

## 4. Hot units and claims

Nine hot units (M2-0188 acceptance 1). A unit is one lock even when it spans several paths. Acceptance 1
lists `release.yml` and `build.yml` as one item; they are two units because they are independent files,
and a lock each lets a release-workflow change and a build-workflow change proceed at the same time.

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
2. Claims are released when the ticket leaves IN_PROGRESS: when its last slice lands (§9 step 2), while
   a red-trunk fix suspends it (§9 step 1), or when a revert the owner asks for sends it back to TODO
   (§8). Between slices the ticket keeps every claim.
3. A runner that finds it needs an unclaimed hot unit stops and asks the lead. The lead adds the path to
   `scope_paths` if the unit is free; otherwise the ticket waits, or the hot-file change becomes its own
   ticket. A PR that changes an unclaimed hot unit is not merged (§8 step 3).
4. Promoting a file to a hot unit takes two PRs that link to each other: a program-repository PR that adds
   the row to the table above and the path to §8 step 3's pattern, and a public-repository PR that adds
   the unit to `HOT_UNITS` in `claims-check.mjs` with a test. The first amends this document (§8,
   "Amending a recorded document"). Before merging either, the lead confirms that at most one IN_PROGRESS
   ticket claims the new unit. It merges the program PR first, so the rule is written before it is
   checked. Watch list: `src/main/logger.ts`, which the merged PRs #207, #208 and #210 changed without a
   conflict (OBSERVED, Files API).

## 5. Landing orders

A unit's declared order is its **dispatch order**. When a unit is released, the lead gives it to the first
ticket in the order that is ready: its `depends_on` satisfy L3, every other unit it needs is free, and
INT-5 allows it. A ticket that is not ready is overtaken and keeps its place. A unit with no declared
order goes to ready tickets by `depends_on`, then milestone, then ticket id. Two kinds of ticket come
before every order: the fix of a red trunk (§9 step 1) and a revert ticket (§8, "Reverts the owner asks
for").

**Reservation.** The ready rule alone can starve a ticket that needs several units: M2-0214 needs four,
and a single-unit ticket can take each of them as it frees. So when a released unit's first ticket in
order is ready except that other units it needs are held, the lead reserves the released unit for it, and
reserves each further unit it needs as that unit becomes free; the ticket is dispatched once it has them
all. At most one ticket holds reservations at a time, so no two tickets wait on each other's reserved
units.

Why a lock rather than parallel work with serialized merges: the Evidence check binds a record to the PR
head (SCHEMA.md §5), so every hot merge would make each other open PR on that unit stale and force a
re-sync, a new CI run and a re-recorded validation (DERIVED). The W1 shape keeps the lock short.

**`index`** — declared for 1.9.7 (M2-0188 acceptance 2; PLAN.md:132): M2-0004 → 0006 → 0026 → 0036 →
0030 → 0031 → 0193 → 0033 → 0037. Tickets created later also claim it (F2). PROPOSED (PD-30): M2-0215,
observability slice 2, directly after 0006, because it holds the acceptance items split off from 0006 (in
the lead's local commit 71adb41; the ticket is on `main` since b8f20bc) and inherits its slot; M2-0214
after 0037, because the Cahê key it served is already revoked (`_relay/archive/2026-09-26-213714-claude-code.md`,
"PURGE STATUS") and it should not delay the 0030 → 0031 → 0193 critical path. Result: 0004 → 0006 → 0215
→ 0026 → 0036 → 0030 → 0031 → 0193 → 0033 → 0037 → 0214, then every other ticket that claims `index`, by
the default rule.

**`helper`** — declared (M2-0188 acceptance 2; ARCHITECTURE.md:245): M2-0027 → 0191 → 0192 → 0028 →
0084. M2-0191 landed first (#210) while M2-0027 was not ready, since it needs M2-0026 and the QA-host
ticket M2-0007 (OBSERVED, ledger `depends_on`): a correct overtake under this section's rule (DERIVED).

**W1 shape** (M2-0188 acceptance 2). A W1 ticket that touches `index.ts` is a new module with its own
tests plus a minimal call-site swap in `index.ts`. Until FF-04's per-file ceiling (ARCHITECTURE.md:463,
M2-0047) ratchets `index.ts` in CI, the validator treats any logic added to `index.ts` beyond imports and
the swapped call sites as a finding.

**Realized order comes from git, not from a hand-kept log.** In a clone of the public repository,

```
git log --first-parent --format='%h %s' origin/m2/integration -- src/main/index.ts
```

lists, newest first, the landed commits that changed the unit; each subject names the ticket (§8 step 7).
On a Mac with the RTK hook, run it as `rtk proxy git log …`: the hook rewrites a plain `git log` and drops
merge commits, and the landings up to 3afebbdf are merge commits (F18; OBSERVED: through the hook, the
command missed e8ddf8a7, the landing of #207). Without a clone,
`gh api 'repos/mysticalsin/AskToto-Mantu/commits?sha=m2/integration&path=src/main/index.ts'` lists every
commit that changed the file, newest first, including the commits inside PRs that landed as merges.

## 6. Concurrency caps

- At most one holder per hot unit (INT-2) and at most three IN_PROGRESS tickets claiming `src/main/**`
  (INT-5). Both count every IN_PROGRESS claimer, as acceptance 3 states, so a ticket keeps its unit and its
  `src/main` slot while it waits for validation or merge and between its slices, until it leaves
  IN_PROGRESS (§4 rule 2). The lead checks both at dispatch; `claims-check.mjs` checks them on every
  ledger push once it runs in `ledger.yml` (§13, F6).
- At most eight concurrent ticket agents, six to eight as the target (PLAN.md:48). This is the lead's
  dispatch rule, not machine-checked: it counts running agents, and an IN_PROGRESS ticket waiting for
  validation or merge has none.
- One validator session per ticket, never the implementer's.

## 7. Ticket lifecycle

1. **Dispatch (lead).** Take a ticket from the ready queue (PLAN.md §14) under §4 to §6. Set
   `status: IN_PROGRESS`, `claimed_by`, `claimed_at`. Commit to the program repository's `main`
   (`ledger: M2-#### in progress`) and push it before the runner starts. Once `ledger.yml` is on `main`
   (F6), that push runs the claims check (§13).
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

   A docs ticket, whose scope is a program document, works in the program repository instead (PROVIDED:
   lead notes, 2026-09-27; OBSERVED: this PR's branch): its worktree `~/AI-Brain-build/metis-wt-M2-####`
   is a worktree of that repository, and its branch `m2-####-slug` is cut from the program repository's
   `origin/main` and brought up to date by merging `origin/main` in. Its draft PR targets the program
   repository's `main` (§8, program-repository PRs). No workflow runs there (F6), so it has no red or
   green run to report.
3. **Validate (validator).** Review rounds on the diff and the runs; the runner pushes fixes to the same
   branch and CI runs again. On PASS, with the final head green (§8 step 2), the validator pastes the
   ` ```json evidence ` record into the PR body and `evidence.yml` verifies it against that head. The
   record lists in `inherited_block` every ENGINEERING_COMPLETE or BLOCKED_EXTERNAL `depends_on` ancestor
   that has an `external_blocker` (§9 step 2). A docs ticket has no run and no `evidence.yml`: its record
   is DESIGNED, with `output` `{ path, sha256 }` of the document at the head, and the lead checks it
   (§8, program-repository step 3).
4. **Merge (lead):** §8. **Record (lead):** §9.

## 8. Merging ticket PRs

Per PR into `m2/integration`, with `N` the PR number, `SHA` its head, `T` its ticket and `S` the slice it
implements when `T` has slices:

1. **Validated.** The evidence record is in the body, and every check on the PR passed or was skipped:
   `gh pr checks N --repo mysticalsin/AskToto-Mantu` exits 0 (8 while one is pending). They include the
   `Evidence record` check, the push runs of step 2 and, for a PR that touches its paths,
   `qa-candidate.yml`'s `pull_request` run, which has no base-branch filter.
2. **Green on the head, no regression.** `SHA` is the full 40-character head: `gh run list --commit`
   with a short sha prints `[]` (OBSERVED with 5a10fc7d). `SHA` is **green** when every workflow in its
   own tree that runs on every push is listed for it with a completed run that succeeded, and the
   `build.yml` run had the baseline job set: Operator Worker, both Quality checks and Security & supply
   chain green and the two package jobs skipped (OBSERVED on baseline run 36267674617). Those workflows
   are `build.yml` and, in a tree that contains #209, M2-0190's `isolation-canary.yml`; a branch not
   synced since #209 has no canary run (OBSERVED on #238's head 266172b1). A workflow that is not listed
   has not registered its run yet, so an empty list, such as in the seconds after a push, is never green.
   `gh run list --repo mysticalsin/AskToto-Mantu --commit SHA --event push --json workflowName,databaseId,status,conclusion`
   A commit is **red** from the moment one of those runs fails until a re-run of it succeeds. The
   **trunk** is red while any commit that landed on `m2/integration` after its last green commit is red.
   The head alone can hide one: a PR that changes no hot unit may land while its parent's runs are still
   going (Batches).
3. **Hot units held.** List the hot files the PR changes from the Files API, which pages through every
   file:

   ```
   gh api --paginate repos/mysticalsin/AskToto-Mantu/pulls/N/files --jq '.[].filename' | grep -E \
     '^(src/main/index\.ts|src/renderer/src/App\.tsx|src/shared/ipc\.ts|src/preload/.*|package(-lock)?\.json|\.github/workflows/(release|build)\.yml|native/mac-helper/main\.swift)$'
   ```

   `T` must be IN_PROGRESS, whether or not a line is printed, and each line must be covered by `T`'s
   `scope_paths`. `gh pr view N --json files` will not do: it stops at 100 files (F19). The Files API
   stops at 3,000, so a PR whose `changed_files`
   (`gh api repos/mysticalsin/AskToto-Mantu/pulls/N --jq .changed_files`) is 3,000 or more is not merged;
   it is split. The ledger check cannot see this step, and PRs have changed hot files their tickets do not
   hold (F3).
4. **Trunk open, and up to date for hot units.** Read the trunk's push runs, newest first, down to its
   last green commit (raise `--limit` when that commit is not listed). `$TRUNK`, the integration head, is
   a full sha:

   ```
   TRUNK=$(gh api repos/mysticalsin/AskToto-Mantu/branches/m2%2Fintegration --jq .commit.sha)
   gh run list --repo mysticalsin/AskToto-Mantu --branch m2/integration --event push --limit 20 --json headSha,workflowName,status,conclusion
   ```

   The containment check passes when the PR's head contains the integration head:
   `gh api repos/mysticalsin/AskToto-Mantu/compare/SHA...m2/integration --jq .ahead_by` prints `0`.
   If the trunk is red (step 2), only a red-trunk PR merges, the revert or the fix of §9 step 1, and it
   needs the containment check whether or not it changes a hot unit (INT-4). Otherwise, if step 3 printed
   a line, `$TRUNK` must be green (step 2), so a head whose runs are still going or not yet listed holds
   the PR back, and the PR needs the containment check (INT-3, INT-4). A PR that fails the containment
   check is synced: the runner merges `origin/m2/integration` into its branch, CI runs again and the
   validator re-records on the new head. Every merge after that sync makes the PR stale again, so the lead
   asks for the sync only when the PR is next to merge and steps 1 to 3 pass; the runner does not chase
   the moving head.
5. **Release window.** §11 allows it.
6. **Packaging (when relevant).** If the PR changes `deps`, `build-wf`, `helper` or an electron-builder
   config, the package jobs have passed on the branch:
   `gh workflow run build.yml --repo mysticalsin/AskToto-Mantu --ref <branch>` (push runs skip them, §2).
7. **Merge** by squash, with a hand-written message (PROVIDED: lead notes, 2026-09-27; OBSERVED from #208
   on, F18). The subject is `<conventional summary> [S or T] (#N)`, naming `S`, or `T` when it has no
   slices, so git shows which tickets and slices have landed. The body says what changed and why and names
   the green run and the validation result. Like everything in the public repository, it names no private
   document or path.

   ```
   gh pr ready N --repo mysticalsin/AskToto-Mantu
   gh pr merge N --repo mysticalsin/AskToto-Mantu --squash --match-head-commit SHA \
     --subject "<conventional summary> [S or T] (#N)" --body-file <message file>
   ```

   When step 4 holds, the squash commit has the head's tree, so INT-3 is kept. Squashing costs two things
   that later steps allow for: the head commit the evidence record names is not reachable from
   `m2/integration` or `main`, although GitHub keeps it as `refs/pull/N/head` (§10 step 3); and the PR's
   test and fix commits are fused on the trunk, so a backport takes them from that ref (§11). A revert of
   a squash commit takes no `-m` (§9 step 1).

**Batches.** PRs whose file sets are pairwise disjoint may merge back to back. A batch holds at most one
hot-unit PR: it passes step 4 and merges first, before its siblings move the integration head. The others
change no hot unit and skip step 4's containment check. Each landed commit gets its own runs, so a red run
names its PR (OBSERVED: the four merges of 2026-09-26 23:46 UTC produced `build.yml` runs 36280486263,
36280488859, 36280491532 and 36280495270, all green).

**Reverts the owner asks for.** §9 step 1's revert relies on its ticket still holding its units. A ticket
that has landed has released them, and reopening it could give a unit a second holder (INT-2). So on a
green trunk the lead reverts a ticket `X` through a revert ticket of its own, filed in m3 while §11's
window holds. `X`'s landed commits are the commits by which its PRs landed on `m2/integration`, and the
revert ticket's `scope_paths` are the paths they change, so §4 and INT-5 count it like any other ticket.
Its PR reverts those commits, newest first, with `git revert <landed sha>` (`-m 1` for the merge-commit
landings up to 3afebbdf, F18), and merges through all of §8 with its own evidence record. Its landing
commit (§9 step 2) returns `X` to TODO unless `X` already is. A revert ticket reverts exactly one ticket:
its PR lands as one squash commit, and reverting that commit brings back everything the PR reverted.

L3 would then fail for each dependant of `X` in a status L3 checks, so the lead collects those
dependants, their own dependants in such a status, and so on. A dependant whose work does not build on
the ticket it depends on is not collected: it keeps its status, and that ticket leaves its `depends_on`.
One ledger commit, the **filing commit**, drops those edges and files the revert tickets. Of the
collected tickets:

- Each one with a landed commit gets a revert ticket of its own, as `X` does. Every revert ticket depends
  on the revert tickets of the collected tickets that depend on the ticket it reverts, directly or
  through others, so L3 dispatches the reverts from the last dependant back to `X`.
- Each one still IN_PROGRESS, whether a slice of it has landed or not, returns to TODO in the filing
  commit. L3 still holds, because IN_PROGRESS does not satisfy a dependency, so no ticket in a status L3
  checks can depend on it. Its claims are released (§4 rule 2), and its open PRs wait, since §8 step 3 and
  program-repository step 1 need their ticket IN_PROGRESS.
- Each DONE, ENGINEERING_COMPLETE or DEFERRED one without a landed commit returns to TODO in the ledger
  commit in which the first of its dependencies does: for a ticket that depends only on `X`, the landing
  commit of `X`'s revert. A program document it landed stays on `main`: reverting the document would
  fail L15 (F20), and a re-dispatch that changes it amends it (§8, "Amending a recorded document").

From the filing commit until `X`'s revert lands, the lead dispatches no ticket that depends on `X` or on a
collected ticket, because L3 would fail for it when that dependency returns to TODO. The revert tickets go
ahead of every declared order: each is first in §5's order for every unit it claims, and a `src/main` slot
that frees goes to a ready revert ticket first. §5's ready and reservation rules apply to them as to any
ticket: a revert ticket takes no unit reserved for another ticket, and reserves none while another ticket
holds reservations. Unlike §9 step 1's fix, it passes no reservation and suspends no holder: the trunk is
green, so the holder can land and release the unit.

When a reverted ticket is dispatched again, its branch is cut from `origin/m2/integration` and starts with
`git revert <its own revert's landed sha>`, which restores its work, and no other ticket's, whichever way
it landed. A collected ticket that was IN_PROGRESS resumes its own branch and open PRs instead. If a slice
of it had landed, the runner first merges into its branch a branch cut and started as above. Merging
`origin/m2/integration` directly, or running the revert on its own branch, would drop the slice from a
branch synced after the slice landed, because the trunk holds the slice's revert. L3 and §5 dispatch `X`
and the collected tickets again in dependency order, `X` first.

**Program-repository PRs.** A ticket whose scope is a program document opens its PR into the program
repository's `main` (§3). That repository has no `build.yml`, no `evidence.yml` and no installer, and no
workflow runs there (F6), so steps 1 to 6 do not apply. With `N`, `SHA`, `T` and `S` as above:

1. **Claimed paths only.** Every path the PR changes is covered by `T`'s `scope_paths` (§4 matching), and
   `T` is IN_PROGRESS:
   `gh api --paginate repos/mysticalsin/Metis-2.0-Program/pulls/N/files --jq '.[].filename'`, with step 3's
   3,000-file limit.
2. **No ledger or record edits.** A change under `docs/metis-2.0/ledger/**` or
   `docs/metis-2.0/evidence/records/**` is not merged as it stands, even when claimed (INT-1). The runner
   removes it from the branch and proposes it in the PR body; the lead applies it in its own ledger
   commit (§9 step 2). A ticket the PR proposes gets its id from the lead then: an id chosen on a branch
   can be taken on `main` before the branch merges (F16). PRs #2 and #9 show why (F17).
3. **Validated.** The body holds the validator's DESIGNED record, whose `output` is `{ path, sha256 }` of
   the document at `SHA` (L15, SCHEMA.md:279). No workflow checks it before the merge, so the lead does:
   `git show SHA:docs/metis-2.0/<path> | shasum -a 256` prints `output.sha256`. Once the record is on
   `main`, `ledger.yml` checks it on every push, when that workflow is there (F6).
4. **Merge** by step 7's method, with `--repo mysticalsin/Metis-2.0-Program`. For each recorded document,
   `git diff SHA <landed sha> -- <path>` must print nothing, or L15 fails on `main`. Then §9 from step 2.

**Amending a recorded document.** A document with a DESIGNED record, such as this runbook once M2-0188.1
lands, changes only through a ticket that claims it, by a PR on this path whose own DESIGNED record names
the new sha256. L15 checks every valid record, not only the latest (F20), and records are append-only, so
the earlier record would then fail on `main` for good. The first amendment of any recorded document
therefore waits for the L15 follow-up in §16.

## 9. After a merge

1. **Wait for the landed commit's runs.** When it is green (§8 step 2), go to step 2 for its ticket `T`.
   Go there too when a later commit on `m2/integration` is green and no revert of this one has landed:
   `T`'s work is then in a tree that ran green. When a run fails, the commit is red, and so is the trunk
   unless a later commit is already green (§8 step 2). Re-run its failed jobs once, since a failure can
   pass on the next run (F21): `gh run rerun <id> --repo mysticalsin/AskToto-Mantu --failed`. A red trunk
   is closed (INT-4), and a failure that repeats keeps it closed: only the two PRs below merge, whether or
   not they change a hot unit, and each needs §8 step 2 and step 4's containment check, so the tree that
   lands is a tree that ran green. A landing that passed the containment check has exactly the tree that
   ran green on its head, so a failure that repeats on it points at the environment and takes the fix. On
   a landing that skipped the check (Batches), the untested merge result may be the cause, and the revert
   fits.
   - **The revert**, when the merge caused the failure: `git revert <landed sha>` on a lead branch cut from
     `origin/m2/integration`. Its `T` is the reverted ticket, which stays IN_PROGRESS and keeps its units,
     so §8 step 3 holds, and step 2 does not run for the revert's landing. The revert carries no evidence
     record, so §8 step 1 does not apply to it. GitHub cannot reopen or re-merge a merged PR, so the work
     returns through a new one: the ticket's runner merges `origin/m2/integration`, which now holds the
     revert, into the ticket's branch (the landing was a squash, so the merge keeps the ticket's changes),
     fixes the failure there and opens a new draft PR from that branch. The new PR is validated and
     recorded on its own head and merges through §8.
   - **The fix**, when the merge did not cause the failure, for example after a runner-image change breaks
     `build.yml`. The failure becomes a ticket. The lead files it in m3 while §11's window holds,
     dispatches it ahead of every declared order and reservation (§5), and merges its PR through all of
     §8. If the fix needs a hot unit that another ticket holds, the lead suspends that holder; if it would
     be a fourth `src/main` claimer (INT-5), the lead suspends the `src/main` claimer dispatched last. A
     suspended ticket goes back to TODO in the fix's dispatch commit, which releases its claims (§4), and
     back to IN_PROGRESS, with the same claims, in the fix's landing commit, before step 2 dispatches
     anyone else. It loses nothing: none of its PRs could merge while the trunk was red, and §8 step 4
     syncs its hot-unit PR with the fix before it merges. When the fix's landing is green, step 2 records
     the fix's ticket and then `T`, whose work that green tree contains.

   A program-repository merge has no run and starts at step 2.
2. **Record the landing** in one commit on the program repository's `main`, pushed:
   - append each evidence record in the PR body (a PR can carry one per level, such as DESIGNED and
     LOCALLY_TESTED), compacted with `jq -c`, one line each, to `evidence/records/<T>.jsonl`, never editing
     an existing line (SCHEMA.md §6);
   - **if another slice of `T` has not landed yet** (the landed subjects name the slices that have, §8
     step 7), `T` stays IN_PROGRESS with all its claims: it keeps its units and its `src/main` slot for the
     next slice, and its dependants keep waiting. The subject is `ledger: <S> merged (#N, <landed sha>)`,
     and nothing below applies;
   - **otherwise `T` has landed**: this was its last slice, or its only PR. Set the status. **DONE** when
     every `required_evidence` level has a latest PASS record and no `depends_on` ancestor is
     ENGINEERING_COMPLETE or BLOCKED_EXTERNAL (L9). Otherwise **ENGINEERING_COMPLETE** (L8), and when a
     level the ticket still lacks needs the owner (LIVE_VERIFIED on a candidate, HOST_CONFIGURED,
     MEASURED, or ACCEPTED, the owner's dated `owner_statement`), set `external_blocker` to that owner step
     as below; a ticket capped only by an ancestor needs no blocker of its own. Either way the ticket
     releases its units and no longer holds back its dependants (L3). A ticket whose last slice has landed
     never stays IN_PROGRESS: it would keep its units and stall its dependants (F1);
   - dispatch the next holder of each released unit (§5);
   - subject `ledger: <T> landed (#N, <landed sha>)`.

   The ticket's fields when LIVE_VERIFIED is missing; a HOST_CONFIGURED, MEASURED or ACCEPTED gap names its
   own owner step the same way. The text cites ticket ids, runbook sections, invariants and decisions
   already in DECISIONS.md, never a proposed decision id, so it stays true whatever id a proposal lands
   under (§15):

   ```json
   {
     "status": "ENGINEERING_COMPLETE",
     "external_blocker": {
       "owner": "Program owner (Tony)",
       "unblock_step": "Merge the milestone PR that contains <landed sha> (#<N>) into main (runbooks/integration.md INT-7). The lead then builds a candidate from main's head (runbooks/qa-candidate.md §3), and <T>'s LIVE_VERIFIED check runs against that candidate's sha256 on the hosted runners (D-9)",
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
3. **After each batch** (§8; a lone merge is a batch of one), check that no push since the previous check
   rewrote or deleted `main` in either repository or `m2/integration` (INT-9; PROVIDED: lead notes,
   2026-09-27). For the program `main` and `m2/integration`, which nothing on GitHub protects (§2, D-33),
   this check is the only detection, so it must be complete. The complete read asks GitHub's activity API
   for those branches alone: the API filters by branch and by type, and `--paginate` reads every page.

   ```
   gh api --paginate 'repos/<repo>/activity?ref=<branch>&activity_type=force_push' \
     --jq '.[] | select(.timestamp >= "<previous check>") | "\(.timestamp) \(.ref) \(.before[0:8])->\(.after[0:8])"'
   ```

   It runs for `main` in `mysticalsin/Metis-2.0-Program` and in `mysticalsin/AskToto-Mantu`, and for
   `m2/integration` in the second, then for the same three with `activity_type=branch_deletion`.
   `<previous check>` is the UTC time of the previous check, written as the API writes its timestamps, in
   ISO 8601 form `YYYY-MM-DDTHH:MM:SSZ`, because jq compares the two as strings. Every printed line is a
   rewrite or a deletion.

   The lead's `~/AI-Brain-build/tools/repo-guard.sh <previous check>`, which lives in neither repository,
   takes the same argument and compares it the same way, but reads one unpaginated page per repository
   (`activity?per_page=100`): the newest 100 events of every branch and type. It exits 1 when that page holds
   a force-push or deletion of either `main` or of `m2/integration` since the given time, and it is complete
   only when the oldest event on the page is older than the previous check. At 07:56Z on 2026-09-27 the page
   reached back to 04:23:17Z in the public repository, of 1,745 events, and to 22:48:07Z the day before in
   the program repository, of 112 (OBSERVED, `gh api …/activity`). With its default window, the last 24
   hours, the script would therefore not have seen three of the four force-pushes in that window that the
   complete read lists: `m2/integration` at 19:54:33Z, the program `main` at 20:26:03Z and the public `main`
   at 23:51:18Z on 2026-09-26.

   Both reads need the network, so they run outside the sandbox. On a printed line or exit 1 the lead merges
   nothing until the lost commits are back on the branch, by a fast-forward push of the old head or, when
   commits have landed since, by a merge as af39d16 did (§2), and tells the owner.
4. Update `_relay/HANDOFF.md`.

## 10. Milestone PRs to main

1. Pick a green `m2/integration` commit and create a snapshot branch at it. It is never updated, so the
   owner reviews a fixed target while the queue keeps moving:
   `gh api repos/mysticalsin/AskToto-Mantu/git/refs -f ref=refs/heads/m2/milestone-<mN> -f sha=<commit>`
2. `gh pr create --repo mysticalsin/AskToto-Mantu --base main --head m2/milestone-<mN> --title "Milestone <mN>: …"`.
   Its `pull_request` run includes both package jobs (§2).
3. The owner reviews and merges with **Create a merge commit**. That keeps `m2/integration`'s commits in
   `main`'s history, so step 4 holds and the next milestone PR carries only new commits. The head commits
   that evidence records name are in neither branch once squashed (§8 step 7);
   `git fetch origin pull/<N>/head` retrieves one.
4. `m2/integration` needs nothing afterwards: its history is already in `main`. If `main` receives a
   commit that did not come from a milestone PR, the lead merges `main` into `m2/integration` through a
   PR, queued like a hot-unit PR because it may touch anything. That PR has no ticket, and its commits are
   already on `main`, from which candidates are built (§11): it needs no evidence record (§8 step 1), no
   holding ticket (step 3) and no milestone (step 5). It lands with **Create a merge commit**
   (`gh pr merge --merge`), not a squash, so that `main`'s commits enter `m2/integration`'s history and the
   next milestone PR carries only new commits.

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
2. A backport PR from `backport/1.9.x/M2-####`, branched from `release/1.9.x`, into `release/1.9.x`. The
   trunk's squash commit fuses test and fix, so take them from the ticket PR's head:
   `git fetch origin pull/<N>/head`, then
   `git log --no-merges --reverse --format='%h %s' origin/m2/integration..FETCH_HEAD` lists the ticket's
   own commits. `git cherry-pick -x` the test commit and push (red run on 1.9.x), then the fix commits and
   push (green run). The test file is unchanged.
3. Where the code has moved on the trunk, write the 1.9.x fix and its test against `release/1.9.x` in their
   own PR, and link the two PRs to each other and to the ticket.
4. The lead merges backport PRs as in §8 step 7. A 1.9.x candidate is built and promoted like any other,
   with the owner's approval. Today the lane cannot build from `release/1.9.x` and no hotfix version number
   is defined (F9, D-34).

## 12. Where things run (D-28)

| What | Where |
|---|---|
| Full suites, targeted tests, `npm run typecheck`, builds | GitHub Actions only. D-28 (DECISIONS.md:130) supersedes M2-0188 acceptance 4's "local runs are targeted files under the hermetic harness": no repository test, script or app runs on any Mac |
| On any Mac | git, gh, reading files, `npx tsc --noEmit -p <tsconfig>` (executes no repository code) |
| Packaging | `build.yml` package jobs (PRs into `main`, dispatch) and `qa-candidate.yml` |
| Packaged runs of a candidate | GitHub-hosted runners only: the `qa-candidate.yml` smoke jobs and the packaged smoke lanes that M2-0007 designs. D-9 (DECISIONS.md:111, answered 2026-09-27) puts the QA hosts there and drops the QA user on the owner's Mac. Each run gets a fresh runner VM, install directory and profile (designs/M2-0007-DESIGN.md:27-28), so no two runs share a host, and acceptance 4's lock on the QA host has nothing to serialize (F14) |
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
  on the program repository's `main` (F6).

# Part II: dated audit (not maintained after this document lands)

## 14. Findings

Snapshot: the program repository's `main` at 901ceaf (2026-09-27 04:19 UTC, whose ledger is the one
4ac9202 committed), the public `m2/integration` at 5993c7e3 (04:18 UTC) and GitHub state read between
04:00 and 04:30 UTC. Claims are computed with §4's matching by a read-only Python pass over `tickets.json`
(not the §13 script; D-28). File lists come from the paginated Files API.

| # | Finding | Label | Source | Handled by |
|---|---|---|---|---|
| F1 | **Landed tickets whose remaining level needs the owner are marked DONE.** M2-0191 has no LIVE_VERIFIED record and M2-0187 no HOST_CONFIGURED one, so L9 rejects both. Left IN_PROGRESS instead, they would keep their units and block their dependants (L3). ENGINEERING_COMPLETE with an owner-gated `external_blocker` passes L8 and satisfies L3 without a code change (`check.mjs:22,179,216`), and the program already routes owner steps to external blockers (README.md:37; AGENTS.md:71-72). M2-0120 is the first ENGINEERING_COMPLETE ticket: its blocker has an `unblock` field where the schema has `unblock_step`, and it waits on D-6, which b181f9b answered | OBSERVED (ledger, rules) / DERIVED (stall) | ledger `status`, `required_evidence`, `external_blocker`; `check.mjs` | §9 step 2; §16 |
| F2 | **The declared `index` order predates its claimers.** M2-0003 changed `index.ts` in #207 (21d3d8ee) without claiming it or being in the order. M2-0214, 0215 and 0224, all m3, claim it and are not in the order; PD-30 places the first two | OBSERVED | `gh api …/commits?sha=m2/integration&path=src/main/index.ts`; ledger `scope_paths` | §5, §8 step 3, PD-30 |
| F3 | **PRs change hot files their tickets do not hold.** Merged: #207 (`index.ts`, M2-0003), #213 (`package.json`, M2-0187), #206 (`ipc.ts`, M2-0041) and #219 (`package.json`, M2-0056). Open: #216 (`index.ts`, M2-0144), #222 (`build.yml` and `package.json`, M2-0055) and #231 (`package.json`, M2-0223). #206 also broke the batch rule: it merged 3 s after #214 and its head did not contain #214's merge | OBSERVED | Files API per PR; ledger `scope_paths`; `gh api …/compare/6083bddd...f637ae36` (`ahead_by` 11) | §8 steps 3 and 4, Batches |
| F4 | **Claims break both caps.** C1 fires on `index` with eight holders (M2-0004, 0026, 0030, 0033, 0037, 0214, 0215, 0224), on `deps` (M2-0047, 0214), on `build-wf` (M2-0047, 0214, 0223) and on `helper` (M2-0190, 0192). C2 fires with thirteen `src/main` claimers (M2-0004, 0026, 0030, 0033, 0037, 0144, 0192, 0214, 0215, 0220, 0221, 0222, 0224) against a cap of three (PLAN.md:48); the cap has been exceeded since batch 1 dispatched four (M2-0003, 0006, 0035, 0043). M2-0190's `native/mac-helper/` claim is wider than its work: #209 changes no file under `native/` | DERIVED (claims) / OBSERVED (#209) | ledger `scope_paths`, `status`; `_relay/archive/2026-09-26-213714-claude-code.md:20`; Files API | §4, §5, §6, §13; §16 |
| F5 | **No evidence records, and three tickets fail L3.** `evidence/records/` holds only `.gitkeep`; the eighteen DONE tickets and M2-0120 carry an inline `evidence` object in `tickets.json` instead, so the ledger check fails on all nineteen once it runs. L3 fails for M2-0024 (M2-0011 IN_PROGRESS, M2-0012 TODO), M2-0041 (M2-0005 TODO) and M2-0189 (M2-0012 TODO). M2-0001 merged "on local evidence": its head 4cf7c2dd has two Build & Test runs, 36255385086 and 36255405007, both failed on all four jobs, and its merge commit e323151c is green (36265947197) | OBSERVED / DERIVED | `git ls-tree 901ceaf docs/metis-2.0/evidence/records/`; ledger; `check.mjs`; `gh api …/actions/runs?head_sha=` | INT-8; §5 (dispatch needs L3); §16 |
| F6 | **Program CI has never run.** GitHub lists no workflow for the program repository. `ledger.yml` is not on its `main`: it exists only in the lead's local lineage (added by 71adb41), and b8f20bc published that lineage's documents without it | OBSERVED | `gh api …/actions/workflows` (`total_count` 0); `git cat-file -e origin/main:.github/workflows/ledger.yml` | §7 step 1; §13; §16 |
| F7 | **Installer work outside m2 and m3 is on the trunk and in flight.** Merged, eight tickets: M2-0041, 0043 and 0045 (m5, on M2-0046's T1 list), M2-0203 (m5, #221, `intelligence/`) and M2-0204 (m5), both on PLAN.md:130's T1 list, M2-0056 (m4, #219, `electron-builder.yml` and `package.json`), M2-0120 (m8, #217, 72 files under `src/shared/contracts/knowledge/`, 71 besides its test) and M2-0147 (m9, #218, `src/main`). In progress with installer claims: M2-0004 (m4, `index.ts`), 0047 (m4, `package.json`), 0101 (m5, a renderer `inventory.json`), 0144 (m8, `src/main`) and 0190 (m4, `native/mac-helper/`). Open PRs that change `package.json` without claiming it: #222 (M2-0055, m4) and #231 (M2-0223, m4) | OBSERVED | Files API; ledger `milestone`, `scope_paths`; M2-0046 acceptance; PLAN.md:130 | D-32 |
| F8 | There is no 1.9.7 tag to cut at: the lane never tags this repository, while PLAN.md:225 still says the promote workflow creates tags | OBSERVED | ADR-022 INV-6; runbooks/qa-candidate.md:16 | D-34 |
| F9 | No 1.9.x hotfix path: the lane builds only `main`'s head, and PD-08's sequence (1.9.7 → 1.9.9 → …) leaves no number for a 1.9.x hotfix before T1 | OBSERVED / DERIVED | `qa-candidate.yml:41,45-51`; DECISIONS.md PD-08 | D-34 |
| F10 | `m2/integration` can be deleted or force-pushed, and no branch has required status checks | OBSERVED | `gh api …/rulesets`, `…/rules/branches/…` | D-33 |
| F11 | GitHub cannot tell the lead from a subagent: every merge into `m2/integration` was made by the owner's account, the one `gh` credential every session on this Mac uses | OBSERVED (merges) / DERIVED (shared credential) | `gh pr list --json mergedBy` | INT-1 |
| F12 | Ticket views are stale: `ledger/tickets/M2-0003.md` shows status TODO and an empty Validation section. `tickets.json` and the records are the place of record | OBSERVED | the file | — |
| F13 | M2-0214 to M2-0224, eleven tickets, carry the v1 field `evidence_target` and lack `required_evidence`, `slices` and `needs_decision`, which L1 requires | OBSERVED | ledger; `check.mjs` L1 | §16 |
| F14 | **D-9's answer moves packaged QA to hosted runners** and drops the QA user on the owner's Mac (DECISIONS.md:111), so no candidate runs on a Mac and no host needs a lock (§12). Two gaps remain: real cloud-backed dataless files cannot exist on hosted runners (designs/M2-0007-DESIGN.md:569-571), and evidence/SCHEMA.md requires an `environment.kind` other than `ci` for HOST_CONFIGURED and LIVE_VERIFIED records (:115) while registering no label for a hosted macOS runner: its macOS hosts are `qa-mac-1` (:223, dropped by D-9) and `owner-mac` (:225, promoted and release builds only, never routine test evidence) | OBSERVED / DERIVED | DECISIONS.md D-9; SCHEMA.md; M2-0007 design | §9 step 2 template; §12; §16 |
| F15 | Lock throughput: the eighteen PRs merged into `m2/integration` took 14 min (#205) to 5 h 24 min (#208) from open to merge; the full dispatch-to-merge cycle is not recorded. At about 6 h per cycle, the ten `index` tickets left in the PD-30 order take about 60 h in sequence, against about 140 h from the snapshot to the 2026-10-03 candidate | OBSERVED (PR times) / ASSUMED (cycle time) | `gh pr list --json createdAt,mergedAt` | §5 |
| F16 | **Ticket ids chosen on a branch collide.** PR #2 (M2-0013) has filed its speaker-voiceprint ticket as M2-0215, then as M2-0220 (e470b8a) and as M2-0221 (95eff63). The lead gave each id to another ticket: M2-0215 to observability slice 2 (its local 71adb41, on `main` since b8f20bc), M2-0220 in 0fe0781 and M2-0221, "Open the Windows CLI setup script without cmd re-parsing its path", in c679f1f. The branch and `main` each take the next free id, so the PR's head 2f4f5a4 collides again | OBSERVED | the ledger at each named commit | §8 program-repository step 2; §16 |
| F17 | **Program-repository PRs change paths their tickets do not claim.** #2 (M2-0013) changes DECISIONS.md and `ledger/tickets.json`; #9 (M2-0189) changes `ledger/tickets.json`; #1 (M2-0020) changes M2-0013's `review/SRC-REVERIFY.md`; #7 (M2-0101) adds 80 files under `design/settings/` and `evidence/M2-0101/`, none of them claimed; and this PR, #5, adds `runbooks/integration.md` while M2-0188 claims `INTEGRATION.md` (§16). No workflow runs there to stop them (F6) | OBSERVED | Files API per PR; ledger `scope_paths` | §8 program-repository steps 1 and 2 |
| F18 | **The merge method changed.** The landings on `m2/integration` up to 3afebbdf (#201 to #207, #210, #212 to #214) are merge commits. #208 and #217 (02:03 UTC), #215 (02:24), #218 (02:47) and #219, #221 and #225 (04:18) landed as squash commits with hand-written messages, the lead's practice (`_relay/HANDOFF.md:29`) that §8 step 7 states. In the program repository, #4 landed as a merge commit and #8 as a squash (73c48e5) | OBSERVED / PROVIDED | `git rev-list --parents -n 1` on each landed commit; the baton | §8 step 7 and "Reverts the owner asks for"; §10 step 3; §11; PD-31 |
| F19 | `gh pr view N --json files` returns at most 100 files: for #171 it lists 100, where the paginated Files API lists 622 | OBSERVED | both commands on #171 | §8 step 3; program-repository step 1 |
| F20 | **L15 freezes every recorded document.** L15 checks the `output` of every valid record, not only the latest (SCHEMA.md:279; `check.mjs:370-391`), and records are append-only (SCHEMA.md §6). Once M2-0188.1's DESIGNED record lands, any edit to this runbook fails the ledger check for good, and the same holds for any other recorded document | OBSERVED (rules) / DERIVED | SCHEMA.md; `check.mjs` | §8 "Amending a recorded document"; §16 |
| F21 | **A red trunk run that its merge did not cause.** #215 (docs only) landed as bc08a419, whose run 36288445138 failed one Windows test in `src/main/infra/storage/dataless.test.ts`; #218 landed on it 23 min later without a re-run, and the run on 56292fb6 (36289553574) is green | OBSERVED | `gh run view 36288445138 --log-failed` | §9 step 1 |

## 15. Proposed rows for DECISIONS.md

D-32 to D-34 are the next free ids at the snapshot: DECISIONS.md ends at D-30 on `main`, and PR #2 (M2-0013)
takes D-31 for its speaker-voiceprint question. OD-14 follows OD-13, which `main` gained in 61250ab, and
PD-30 and PD-31 follow PD-29. An id still shifts if another row lands first, so ledger text cites a row
only once it is in DECISIONS.md, by the id it landed under; until then it cites this runbook's section, as
the §9 step 2 template does.

Section A (owner decision already made, not yet in DECISIONS.md):

| # | Date | Decision | Why (as recorded) | Alternatives considered | Where it lands |
|---|---|---|---|---|---|
| OD-14 | 2026-09-26 | Merge flow: validated ticket PRs merge into `m2/integration`; the owner reviews and merges milestone PRs into `main` | PROVIDED (`_relay/HANDOFF.md:29`, "Decisions made") | Ticket PRs straight into `main` (PLAN.md §10; AGENTS.md §4) | runbooks/integration.md §2, §10; PLAN.md §10, AGENTS.md §4 and README.md:30-33 to be amended |

Section B (program decisions):

| # | Decision | Why | Alternatives rejected | Tickets |
|---|---|---|---|---|
| PD-30 | The hot-file queue has one holder per hot unit, the single IN_PROGRESS ticket that claims it, with claims taken all at once at dispatch. Declared orders are dispatch orders among ready tickets: a ticket that is not ready is overtaken, and one ticket at a time may reserve the units it still needs. A PR changes a hot unit only if its ticket holds it, and a hot-unit PR merges only when up to date and green on its head. While the trunk is red, from a landing's failed run until that commit or a later one is green, only the revert and the fix of a repeated failure merge, and the fix's ticket may suspend the tickets whose claims it needs. A ticket the owner asks to revert on a green trunk is reverted by a revert ticket of its own that claims the paths its landed commits change, after each landed dependant is reverted by its own. Its dependants in progress return to TODO when the revert tickets are filed, no dependant is dispatched until its revert lands, and the revert tickets go ahead of every declared order but not of a reservation. The `index` order gains observability slice 2 (M2-0215) after 0006 and M2-0214 after 0037 | Evidence binds to the PR head, so parallel work with serialized merges would re-sync, re-run and re-validate every open PR on a unit at each hot merge. A red trunk hides the failures of every later landing, and a fix that waited for claims held by tickets unable to merge would deadlock. Reverting a revert brings back everything it reverted, so each revert covers one ticket, and a dependant left in progress while the reverts wait could land on work about to leave the trunk, or hold a unit a revert needs | Parallel development with serialized merges only; GitHub's merge queue (not evaluated for this user-owned repository, and it cannot see ledger claims) | M2-0188, 0214, 0215 |
| PD-31 | Ticket PRs land by squash, with a hand-written subject `<summary> [slice or ticket] (#N)` and a body that names no private document | One commit per PR on the trunk, and public history whose text the lead writes (PROVIDED: `_relay/HANDOFF.md:29`; lead notes, 2026-09-27) | Merge commits, as #201 to #214 used: they keep each evidence head commit reachable from `main`, per-commit backports and `git revert -m 1`, but carry every runner commit message into the public history | M2-0188 |

Section D (open register):

| ID | Question | Recommended default | Class | Needed by | Status | Affected tickets |
|---|---|---|---|---|---|---|
| D-32 | Until the 1.9.7 (m3) snapshot is cut, which PRs that change the installer may merge into `m2/integration`? | Only those of m2 and m3 tickets. Twelve tickets outside m2 and m3 have merged installer changes: at the snapshot, the eight of F7, M2-0041, 0043, 0045, 0203 and 0204 (m5), M2-0056 (m4), M2-0120 (m8) and M2-0147 (m9); since then, by 07:26 UTC (ledger at 7f93e52), M2-0004 (#220), 0055 (#222) and 0223 (#231), all m4, and M2-0144 (m8, #216). They ship in 1.9.7 and are listed in its release notes, and the T1 lists drop those on them (M2-0046's: 0041, 0043 and 0045; PLAN.md:130's: those three, 0203 and 0204; M2-0206's `depends_on`: all five). The owner may instead have the lead revert any of them before the m3 snapshot (§8, "Reverts the owner asks for"). Such a revert waits for the hot units it changes and, when it changes a file under `src/main/`, for a `src/main` slot (INT-5). At 7f93e52 the slot is the longer wait: eight IN_PROGRESS tickets claim `src/main` (M2-0031, 0033, 0037, 0214, 0215, 0225, 0226 and 0227) against a cap of three, so at least six of them must leave IN_PROGRESS before the revert of M2-0004 (#220), 0041 (#206, `src/main/cloud-stt/credentials.ts`), 0043 (#202), 0144 (#216) or 0147 (#218, six `src/main` files besides tests) is dispatched. The hot units need fewer to leave: `index` (#220, #216) is claimed by M2-0031, 0033, 0037, 0214 and 0215, `deps` (#219, #222, #231) by M2-0047, 0092 and 0214, `ipc` (#206) by M2-0214 and 0226, `build-wf` (#222, #231) by M2-0047 and 0214, and `release-wf` (#231) by M2-0053. Each landed dependant of a reverted ticket is reverted first, by its own revert ticket: M2-0218 and 0219 depend on 0041 (#226 and #223 change `operator/src/cloudflare-connect.ts`, as #206 does), and M2-0221 and 0222 on 0147 (#232 changes `src/main/cli.ts`, and #234 `src/main/mcp/mcpClient.ts` and `src/main/net/install-proxy.ts`, as #218 does, so their reverts wait for `src/main` slots too); all four have landed. Waiting at 7f93e52: M2-0047 (m4), 0092 (m6), 0101 (m5) and 0226 (m7), in progress with installer claims | reversible | 2026-09-27 | OPEN | 0004, 0031, 0033, 0037, 0041, 0043, 0045, 0046, 0047, 0053, 0055, 0056, 0092, 0101, 0120, 0144, 0147, 0203, 0204, 0206, 0214, 0215, 0218, 0219, 0221, 0222, 0223, 0225, 0226, 0227 |
| D-33 | Protect `m2/integration` on GitHub? | Yes: a ruleset with deletion and non_fast_forward, as `main` has, plus required status checks (both Quality checks, Security & supply chain, Operator Worker) without "up to date", which the queue handles. ASSUMED: push-triggered runs on a PR's head satisfy required checks; confirm on the first PR after enabling | escalate: owner configuration | 2026-09-28 | OPEN | 0188 |
| D-34 | How is `release/1.9.x` cut, and how is a 1.9.x hotfix built and numbered? | Cut at the commit in the promoted 1.9.7 candidate's `provenance.json`. `qa-candidate.yml` also accepts the head of `release/1.9.x` (M2-0187 follow-up). A hotfix takes the next unused patch number (never 1.9.8, never reused), and the next train the one after it | reversible | 2026-10-03 | OPEN | 0046, 0187, 0206 |

## 16. Corrections other documents need (lead)

- PLAN.md §10 (:218-225): the repository is public with five active rulesets; ticket PRs target
  `m2/integration` and land by squash (PD-31); the promote workflow creates no tag; backports start on the
  trunk.
- PLAN.md §14: step 2 (`:305`) still allows tests "on the QA macOS user" (D-28, D-9), and step 5 (`:308`)
  still says to branch from `main` (OD-14).
- PLAN.md:132 and ARCHITECTURE.md:245: the `index` order per PD-30 and the realized `helper` order.
- PLAN.md:130 and M2-0046, once D-32 is decided: their T1 lists. M2-0046's "cut at the 1.9.7 tag" per
  D-34.
- AGENTS.md §4 in the public repository (`:63-68`): branch from `origin/m2/integration` and target it.
  One-file docs PR; no open ticket owns `AGENTS.md` since M2-0024 closed.
- README.md, the session entry point (`:44`: "Start every session by reading `_relay/HANDOFF.md`, then
  this file"): `:30` and `:32-33` still say to branch from `main` and target PRs at `main` (OD-14), and
  `:38-39` still say "targeted runs on the isolated QA macOS user" (D-28, D-9).
- evidence/SCHEMA.md after D-9: the environment kind and host label under which the hosted smoke lanes
  record HOST_CONFIGURED and LIVE_VERIFIED, or the statement that they cannot (F14). M2-0187's blocker
  still asks for a step on the QA account.
- The L15 follow-up, a new ticket with linked PRs for `check.mjs` and SCHEMA.md, needed before the first
  amendment of any recorded document (F20). Options: (a) for each `output.path`, check only the latest
  record that names it, by `recorded_at`, across tickets, so an amendment's record supersedes the earlier
  one and an unrecorded edit on `main` still fails; (b) check the latest record per ticket and level, so
  an amendment must append a record to every earlier ticket that recorded the document; (c) pin a
  DESIGNED `output` to its `commit`, which never fails and no longer detects an unrecorded edit on `main`.
  Recommended: (a).
- M2-0188, before this PR merges: scope path `docs/metis-2.0/runbooks/integration.md` in place of
  `INTEGRATION.md`, or §8's program-repository step 1 refuses this PR, and the same path in acceptance 1,
  which names `INTEGRATION.md`, a file that will not exist; also `scripts/program/program.test.ts`
  for slice M2-0188.2; acceptance 4 per D-28 and D-9 (§12); acceptance 6 per D-34 once it is decided. When
  this slice (M2-0188.1) merges, M2-0188 stays IN_PROGRESS with its claims; it lands with slice M2-0188.2
  (§9 step 2, §13).
- Ledger, now:
  - M2-0191 and M2-0187 as ENGINEERING_COMPLETE with their owner blockers, not DONE; M2-0120's blocker
    with `unblock_step` and the step left after D-6's answer (F1);
  - `index` back to one holder, M2-0004, the first ready ticket in the PD-30 order. M2-0026, 0030, 0033,
    0037, 0214, 0215 and 0224 wait, or drop the claim when their work does not change `index.ts`; #227,
    M2-0030's PR, does not (F4);
  - `deps`, `build-wf` and `helper` back to one holder each under §5, with M2-0190's claim narrowed, and
    `src/main` back to three claimers (PLAN.md:48) unless the owner raises the cap (F4);
  - M2-0024, M2-0041 and M2-0189, which fail L3: a dependency that is not real removed from `depends_on`,
    or the ticket out of its status until its dependencies are ready (F5);
  - `required_evidence`, `slices` and `needs_decision` on M2-0214 to M2-0224 (F13);
  - records backfilled for every DONE and landed ticket (F5), and `ledger.yml` pushed to `main` (F6);
  - PR #2's ticket filed under the next free id when the lead applies it (F16).
