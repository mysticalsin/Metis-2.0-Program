# GitHub Support request — remove sensitive data from a public repository

Submit at https://support.github.com/contact (topic: "Removing sensitive data"). Send from the account that owns the repository.

---

Subject: Request to remove cached views and pull-request references after a history rewrite — mysticalsin/AskToto-Mantu

Hello,

I rewrote the history of my repository **mysticalsin/AskToto-Mantu** with `git filter-repo` to permanently remove three documentation files that should never have been published:

- `docs/cluely-mantu-build-brief.md`
- `docs/planning/PLAN-v5-providers-cluely-ui.md`
- `docs/superpowers/specs/2026-06-29-cluely-replica-design.md`

All branches and tags have been force-pushed with the rewritten history. The files are no longer reachable from any branch or tag. However, the old commits remain reachable through the repository's pull-request references (`refs/pull/*`, about 204 of them) and through cached commit/blob views.

Please:
1. Dereference the old commits held by `refs/pull/*/head` and `refs/pull/*/merge` for all pull requests in this repository, so the old objects can be garbage-collected.
2. Remove any cached views of the affected commits and files.
3. Run garbage collection on the repository.

The repository was public for a short period on 2026-09-26 (from about 19:24 UTC). There are no forks. I can provide the list of the first changed commits if helpful (old root commit `fa88465107d49f6ec8ba5db534d89cc9e31281f0`).

Thank you.
