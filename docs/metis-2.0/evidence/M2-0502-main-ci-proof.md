# M2-0502 — main CI proof and workflow registration for df205007 (evidence note)

Program document, private. Content-free: commit shas, counts, run ids, event and actor types only (no
logins, no log text). Written 2026-09-29 by the M2-0502 ticket runner, which has no network access and runs
nothing (D-28). So every value below is either quoted from the lead's recorded observations in the ledger
(labelled with its `ledger/tickets.json` line) or BLOCKED_EXTERNAL with the exact read-only step that
fills it. The lead runs those steps, fills the table and copies the note into the ticket's `notes`
(LEAD_ACTION below). The runner does not do that step and does not fake it.

Paths are relative to `docs/metis-2.0/`. Repository: `mysticalsin/AskToto-Mantu`. `<full sha>` is
`gh api repos/mysticalsin/AskToto-Mantu/commits/<short> --jq .sha`. The `head_sha` filters are given the
full sha, because the runs API is not known to match a short prefix (ASSUMED).

## 1. The failure

- The queue logged "milestone: main CI NOT green" at 19:58:01Z on 2026-09-29. `milestone.sh` ran
  `ci-proof.sh main`, which waits for a `build.yml` run on `main`'s head, and ended with "PROOF FAIL: run
  for df205007… not completed in time". It was not a failing test (PROVIDED: `ledger/tickets.json:27884`,
  from `codex-queue logs/queue.log:2271` and `logs/milestone.main.txt`, which lie outside this worktree).
- `main`'s tree at df205007 is byte-identical to `m2/integration` 51132486, whose Build & Test runs are
  green (PROVIDED: `ledger/tickets.json:27884`). 51132486 is the head that QA candidate self-test run
  36608178436 (PR #337) built green (OBSERVED by the lead: `evidence/M2-0422-boot-stretch.md:5`). So the
  code is green and only the proof is missing (DERIVED).
  BLOCKED_EXTERNAL re-check, read-only on the lead's clone:
  `git rev-parse df205007^{tree} 51132486^{tree}` prints the same tree id twice.

## 2. Evidence table

| Item | df205007 (#337, merged 17:55Z) | 858a6a22 (#281) | Source / read-only step |
|---|---|---|---|
| Push-event runs | 0 (OBSERVED) | 2: Build & Test and isolation-canary (OBSERVED) | `ledger/tickets.json:27825`, `:27835`, `:27837`. Re-check: `gh api "repos/mysticalsin/AskToto-Mantu/actions/runs?head_sha=<full sha>&event=push" --jq .total_count` |
| Check suites, count and source | 3, all from later `workflow_dispatch` runs: PRD lock, resource census, QA candidate (OBSERVED) | BLOCKED_EXTERNAL | `ledger/tickets.json:27835`. Step: `gh api repos/mysticalsin/AskToto-Mantu/commits/<full sha>/check-suites --jq '.total_count'`, then `gh api "repos/mysticalsin/AskToto-Mantu/actions/runs?head_sha=<full sha>" --jq '.workflow_runs[] \| "\(.check_suite_id) \(.event) \(.name) \(.created_at)"'` |
| Merge method | BLOCKED_EXTERNAL | BLOCKED_EXTERNAL | `git show -s --format=%P <sha> \| wc -w` (2 = merge commit, 1 = squash or rebase), and `gh api --paginate 'repos/mysticalsin/AskToto-Mantu/activity?ref=main' --jq '.[] \| select(.after \| startswith("<short>")) \| "\(.timestamp) \(.activity_type)"'` (`pr_merge`, `merge_queue_merge` or `push`) |
| Merging actor type | BLOCKED_EXTERNAL | BLOCKED_EXTERNAL | `gh api repos/mysticalsin/AskToto-Mantu/pulls/<337 or 281> --jq '{merged_at, merged_by_type: .merged_by.type, auto_merge: (.auto_merge != null)}'`, plus `.actor.type` in the activity read above. Record the type (`User` or `Bot`) and whether auto-merge or a token-driven tool merged it, never a login |
| PushEvent in the events feed | UNKNOWN. M2-0502 acceptance 8 (`ledger/tickets.json:27893`) expects none, but no read is recorded; BLOCKED_EXTERNAL | BLOCKED_EXTERNAL | `gh api --paginate repos/mysticalsin/AskToto-Mantu/events --jq '.[] \| select(.type == "PushEvent" and (.payload.head \| startswith("<short>"))) \| .created_at'`. The feed keeps at most 300 events and 90 days, so "none" is complete only if the oldest event read is older than the merge |
| GitHub status incident, 2026-09-29 17:45-18:30Z | BLOCKED_EXTERNAL | n/a | https://www.githubstatus.com/history (September 2026), and any Actions or Webhooks incident overlapping the window. Record the incident id and components, or "none", with the retrieval date |
| Registration set difference | in `main`'s tree, not registered: hk-m-candidate.yml, windows-qa.yml, m2-0238-backfill.yml, ledger.yml, the four files whose first commit on `main` is df205007 and which have no push or pull_request trigger. The API listed 21 workflows (OBSERVED, about 22:00Z) | #281's dispatch-only files (freeze-repro, promote-candidate, resource-census and others) registered at the merge minute (OBSERVED) | `ledger/tickets.json:27835`. Re-check after `git fetch origin main`: `comm -3 <(git ls-tree --name-only origin/main .github/workflows/ \| grep -E '\.ya?ml$' \| sort) <(gh api --paginate repos/mysticalsin/AskToto-Mantu/actions/workflows --jq '.workflows[].path' \| sort)` |
| Control | docs-verify.yml also first reached `main` in df205007, but registered at 12:33:16Z from its first pull_request run (OBSERVED) | — | `ledger/tickets.json:27835` |

`ledger.yml` needs no registration: its only trigger is `workflow_call` and callers resolve it by path
(OBSERVED, `ledger/tickets.json:27835`). So the expected clean difference is `ledger.yml` alone.

## 3. Root cause

**UNKNOWN**, with the evidence above. What is OBSERVED: GitHub created no push-event run and registered no
new dispatch-only workflow for the push that moved `main` to df205007, while it did both for 858a6a22.
What is DERIVED (`ledger/tickets.json:27835`): a dispatch-only file registers only when a push to the
default branch is processed or when a run of it exists.

Two explanations remain open. The merging-actor row decides between them:

- **H1, documented suppression (ASSUMED).** GitHub does not start workflow runs for events caused by the
  repository's `GITHUB_TOKEN` (GitHub Docs, "Triggering a workflow from a workflow",
  https://docs.github.com/en/actions/using-workflows/triggering-a-workflow; not retrieved by this runner,
  which has no network). If #337 was merged by a workflow or bot with that token (actor type `Bot`, or
  auto-merge completed by such a token), the missing push run is expected behaviour. The root cause then
  becomes OBSERVED, and no Support request is sent.
- **H2, a push GitHub never processed.** If a `User` merged #337 through the web UI or with their own
  token, no PushEvent is in the feed and no incident covers the window, then the push was dropped on
  GitHub's side. The root cause stays UNKNOWN to us, and the Support draft in §5 applies.

Either way, the remedy does not depend on the answer. M2-0501 makes registration independent of push
processing, and `runbooks/integration.md` §10 step 5 dispatches `build.yml` when a push run is missing.

## 4. Lead actions

LEAD_ACTION: `gh workflow run build.yml --repo mysticalsin/AskToto-Mantu --ref main`; then `gh run list --repo mysticalsin/AskToto-Mantu --workflow build.yml --branch main --event workflow_dispatch --limit 1 --json databaseId,headSha,conclusion`. Confirm that headSha is `main`'s head (df205007 unless `main` moved) and the conclusion is `success`, and that the queue's `ci-proof.sh main` prints `PROOF OK`. Record the run id in M2-0502's evidence note.
LEAD_ACTION: run each BLOCKED_EXTERNAL step in §2 for df205007 and 858a6a22, fill the table, and state the root cause in §3 as OBSERVED (H1 or H2 proven) or UNKNOWN with this evidence. Copy the content-free result into M2-0502's `notes` in `ledger/tickets.json`.
LEAD_ACTION: change the queue's milestone step (`milestone.sh` / `ci-proof.sh`, lead tooling outside both repositories) to run `runbooks/integration.md` §10 step 5 (a) to (c) and log the four distinct outcomes listed there, instead of a single "NOT green". Show the new log lines from the next milestone merge in M2-0502's notes.
LEAD_ACTION: on the 1.9.7 merge (after M2-0498), follow §10 steps 1 to 5: cut the snapshot at the bump's merge commit on `m2/integration`, not on the queue's 24-hour timer. After the owner's merge, record green main CI on the merge commit and a clean registration check in `releases/1.9.7.md`, then run `runbooks/qa-candidate.md` §3's pre-dispatch check, and only then dispatch `qa-candidate.yml`.
LEAD_ACTION: amend the post-merge LEAD_ACTIONs of M2-0467 (its last acceptance item, step 1) and M2-0460 (its last acceptance item) in `ledger/tickets.json` so that they cite M2-0502 (`runbooks/integration.md` §10 step 5) and M2-0501 as the remedy for an unregistered workflow. Regenerate `ledger/tickets/*.md`.
LEAD_ACTION: run §10 step 5 after every later milestone merge, both interim pre-cut merges (for M2-0504 or M2-0467) and post-cut harness merges, before their lanes are dispatched.
LEAD_ACTION (optional, only if H2 holds): fill §5 with the table's values and give it to the owner to review and send. Never send it automatically.

## 5. Draft GitHub Support request (owner reviews and sends; only if H2 holds)

Submit at https://support.github.com/contact, from the account that owns the repository. Topic: Actions.
Fill each `<…>` from §2 first. The push trigger it cites is OBSERVED at `build.yml:11-16`
(`runbooks/integration.md:64`).

> Subject: Push to the default branch created no workflow runs and did not register new workflows —
> mysticalsin/AskToto-Mantu, 2026-09-29
>
> Hello,
>
> On 2026-09-29 at about 17:55 UTC, pull request #337 was merged into `main` of mysticalsin/AskToto-Mantu,
> which moved `main` to commit `<full sha of df205007>`. Merge method: `<merge commit / squash>`, merged by
> a `<User>` account `<through the web UI / with a personal token>`.
>
> - `GET /repos/mysticalsin/AskToto-Mantu/actions/runs?head_sha=<sha>&event=push` returns `total_count: 0`.
>   `build.yml` has a `push` trigger for every branch. The commit's only check suites come from later manual
>   dispatches.
> - The repository events feed has no PushEvent for this commit.
> - Four workflow files that first reached `main` in this commit were never registered.
>   `GET /repos/mysticalsin/AskToto-Mantu/actions/workflows/hk-m-candidate.yml` returned 404.
> - For comparison, the earlier merge of #281 (`<full sha of 858a6a22>`) got 2 push-event runs, and its
>   new workflows registered within the minute.
> - githubstatus.com shows `<no incident / incident id>` for 17:45-18:30 UTC that day.
>
> Could you check whether this push event was processed by Actions, and why no runs or workflow
> registrations followed? No action on the repository is requested.
>
> Thank you.
