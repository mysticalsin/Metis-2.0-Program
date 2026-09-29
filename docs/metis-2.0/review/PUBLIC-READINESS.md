# PUBLIC-READINESS — mysticalsin/AskToto-Mantu

Reviewer: Opus final gate · Date: 2026-09-26 · Mode: read-only (no repo writes, no pushes, no visibility change)
Inputs: lane reports `secrets.md`, `pii.md`, `confidential.md`, `infra.md`, `licensing.md` + independent verification below.
Masking rule used throughout: values shown only as first 4 chars + length. No secret, key, full ID or full email appears in this file.

> Not legal advice. Items touching IP ownership, reverse-engineering, trademarks and licensing are laid out as facts + trade-offs for Tony (and Mantu legal) to decide.

---

## 0. STOP-FIRST FINDING — the repo is ALREADY PUBLIC

The lanes all assumed the repo is private. It is not.

| Evidence (read-only GitHub API / anonymous git) | Result |
|---|---|
| Unauthenticated `GET /repos/mysticalsin/AskToto-Mantu` at 2026-09-26T19:43:54Z | HTTP 200, `private:false`, `visibility:"public"` |
| Anonymous `git ls-remote` (no credential helper) | 106 heads, 204 `refs/pull/*`, 27 tags (39 lines incl. peeled) all listable |
| Anonymous `git clone --mirror` into scratchpad | succeeded: 108 heads, 204 PR refs, 27 tags, 1,919 commits |
| Actions run 98207420707 @ 19:23:27Z | every job: "The job was not started because an Actions budget is preventing further use." (private-repo behaviour) |
| Actions run 98207578544 @ 19:24:32Z | jobs assigned GitHub-hosted runners, success |
| Repo `updated_at` | 2026-09-26T19:30:45Z |
| Release asset `v1.2.0/Metis-Windows-Cahe-Setup-1.2.0.exe` anonymous HEAD | HTTP 302 → downloadable by anyone |
| forks / stars / watchers at 19:43Z | 0 / 0 / 0 |

Most likely reading: visibility was flipped to public between 19:23:27Z and 19:24:32Z today (about 20 minutes before this review verified it). Caveat: the repo events feed shows only one `PublicEvent`, timestamped at repo creation (2026-06-27T20:02:18Z), which I can't reconcile. One explanation (the budget was raised at 19:24Z and the repo has been public for longer) can't be fully excluded from the API. **Tony: check github.com/settings/security-log for the `repo.access` event to fix the exact exposure window.** Either way, the irreversible step this review was meant to gate has already happened, and the question is now whether it **stays** public.

---

## 1. Verdict

**NO_GO for this repository being public. Revert it to private now, then pursue free or cheap CI without publishing.**

Why this is not "GO after remediation": the two items that matter most (competitor reverse-engineering evidence in the *root* commit, and unconfirmed authorisation to open-source a Mantu-branded product under a personal MIT copyright) can't be fixed in place. Fixing them needs a rewrite from the first commit. On GitHub, the owner can't complete that alone: 204 `refs/pull/*` refs keep the old commits reachable until GitHub Support dereferences them, and any clone taken during the exposure keeps the old history. If Mantu ever wants this open-source, the clean vehicle is a **new** repo created from a sanitized snapshot, not this one.

What's reassuring: no live credential exists anywhere in git history (lanes plus my extra scan). The only secret-rotation item comes from a **release asset**, not from git.

---

## 2. Verification of critical / high lane items (done myself, read-only)

| Lane item | Lane severity | Verified? | My finding |
|---|---|---|---|
| Cluely-replica spec in history (licensing) | critical | **Confirmed, and wider than reported** | `docs/planning/PLAN-v5-providers-cluely-ui.md` is in the **root commit `fa884651`** and records "Cluely settings = ground truth (from app.asar 2.1.19)", including lifted class strings and design tokens. `docs/superpowers/specs/2026-06-29-cluely-replica-design.md` (`3b74951e`) cites "live CDP capture of Cluely v2.1.19 + its extracted source". `docs/cluely-mantu-build-brief.md` (`6394b020`). Deleted in `9ddd08ab`, but all three commits are ancestors of `origin/main` and of **all 27 tags**, and the files are still in the *tip tree* of `origin/feat/enterprise-hardening`, `origin/feat/ux-fixes-models-cli-integration`, `origin/session-recovery` and tag `v1.0.0`. 9 commit messages say "Cluely" (e.g. "Cluely teardown · prompt B"). 15 files / 48 lines on current main mention Cluely; README openly says "look and feel modeled on Cluely … No Cluely code, logo, or assets are used." |
| D-8 `/v1/decide` Access bypass (confidential) | critical | **Confirmed but overstated** | Commits `6547aca1` and `9568d21c` exist only on `origin/metis-2.0-inventory` (not on main), now publicly readable. The route skips Cloudflare Access but still passes `verifyDeviceRequest` (per-device licence token + HMAC + nonce, or server-side ingest secret), seat authorisation, and a rate limit. That's the same pattern as `/v1/ask`. The shared ingest secret is **not** in the app or repo (env/settings only). So this is not an open bypass: it's **unreviewed code serving production**, now with public source. Real severity: medium, and it's a governance gate, not a history problem. |
| `ADMIN_EMAILS` hardcoded in `operator/src/access.ts` (confidential/infra) | high | **Confirmed** | Line 3 on `origin/main`: personal Gmail `tony…` (len 22) and corporate `twal…` (len 19, @amaris domain). The infra lane's len 17 is wrong. Beyond tests, the two owner addresses also appear in **10 non-test files** on main (design docs, runbooks, `operator/src/render/pages/settings.ts`, `operator/src/spa/client.generated.ts`, `src/renderer/src/components/Settings.tsx`, dev scripts). |
| Real Cloudflare account ID in test fixtures (confidential/infra) | high | **Confirmed** | `2948…` (len 32) on `origin/main` in `operator/src/{cloudflare-connect,cloudflare,keys}.test.ts` (5 lines), in 72 of 136 remote/tag tips, and in 14 commits. Also in 2 PR-only versions of `README.md` / `OPERATOR.md`. Cloudflare treats account IDs as non-secret, and they can't be rotated. The program's own `review/REDACTIONS.md` already tracks it (M2-0049). |
| HeyClicky DMG teardown (licensing/confidential) | high | **Confirmed, and wider than reported** | Not committed anywhere and 0 hits in the public mirror, which is good. But it isn't one subtree: 36 dedicated files across `kit/r11/clicky-study`, `kit/v5/baseline/Metis-HeyClicky-Interaction-Upgrade.x/…` and `…/r11-kit/…`, and "clicky" appears in **152 of 1,240** program-doc files, including `PLAN.md`, `GOAL.json`, `TRACEABILITY.*`, 9+ ledger tickets and review lanes. These docs record a static extraction of the vendor's `.dmg` (with its SHA-256). |
| Mantu brand assets under plain MIT (licensing) | high | **Confirmed, with a bigger issue behind it** | `LICENSE` is plain MIT, "Copyright (c) 2026 Tony Walteur", with no trademark carve-out (0 mentions in LICENSE or THIRD_PARTY_NOTICES). Six Mantu/Métis mark files are tracked. The bigger issue: this is plainly a Mantu product (Mantu-tenant Entra sign-in, Mantu IT asked to fund Actions in `docs/MANTU-IT-REQUEST.md`, Mantu branding). Whether Tony personally holds the copyright and may MIT-license it is an employer-IP question no lane raised. |

---

## 3. New findings no lane covered

1. **Release assets were exposed (the only secret-rotation item).** 12 non-draft releases on this repo are now anonymously downloadable. `v1.2.0` carries `Metis-Windows-Cahe-Setup-1.2.0.exe` (and its blockmap), built via `cahe-windows.yml` from `secrets.CAHE_KIMI_JSON` with `METIS_CAHE_EMBED_KEY=1`, so it embeds the Cahê Kimi Code key. The public feed `mysticalsin/Metis-Releases` has **no** Cahê assets, so this key was previously limited to pilot users and repo collaborators. Download count is 3 (all probably pre-flip; recheck after reverting).
2. **148 commits / 544 blobs reachable only via GitHub's `refs/pull/*` were never scanned by the lanes.** The lanes used the local clone; 41 PR head refs point at commits not present locally. I scanned them from the anonymous mirror with gitleaks 8.30.1 (default config and repo config): **0 findings**. Pattern scan shows only already-known categories: owner emails, the account ID `2948…`, D1 `8eb5…`, the personal-name Access team domain, and Cluely mentions (no HeyClicky, no PEM, no provider keys).
3. **Issues / PRs / comments are now public**: 204 issues+PRs, 43 comments, 0 review comments. No secrets, client names or HeyClicky content. They contain the owner's two emails (12 items), the Worker hostname (36), Kimi mentions (7) and one D-8 reference (#171).
4. **Actions artifacts are now downloadable by any signed-in user**: 969 `sbom` artifacts and 5 `metis-unsigned-windows` builds. `build.yml` uses only `GITHUB_TOKEN`, so no embedded keys. Low risk.
5. **GitHub secret scanning and push protection are both disabled** on the now-public repo.
6. Actions posture is sound: default token `read`, fork-PR approval policy `first_time_contributors`, `main` protected, no `pull_request_target`, no self-hosted runners.

## 4. Cross-lane corrections

- **infra** said "no workflow triggers on pull_request". Wrong: `build.yml` has `pull_request: [main, master]`. The secrets lane is right, and it's safe because it only uses the read-only `GITHUB_TOKEN`.
- **secrets** said "no account_id". That's true only for `wrangler.jsonc`: the real account ID is in 3 test files on main (confidential and infra lanes are right).
- **confidential** called D-8 a "critical open access-control bypass". It's HMAC/licence/seat-gated (see §2): medium, governance.
- **pii** summary lists the corporate email as a *commit identity*. Across all 1,919 public commits, the identities are the personal Gmail (`tony…`, len 22), `Toto…` Mac `.local` hostname (13 commits), Cursor Agent, `devo…@mantu.local`, `rock…@metis.local` and GitHub noreply. The corporate address is in **file content**, not commit metadata.
- **licensing** said deleting 3 Cluely files via filter-repo "purges" the issue. It doesn't: the root commit carries one of them, 9 commit messages and current code comments reference Cluely, and GitHub PR refs pin the old SHAs.
- All lanes counted 103 remote-only branches. GitHub has 108 heads now, plus 204 PR refs.

---

## 5. BLOCKING items (for this repo to be or stay public), with exact remediation, in order

**B0 — Containment: revert visibility to private now.**
Settings → General → Danger Zone → Change visibility → Private (or `gh repo edit mysticalsin/AskToto-Mantu --visibility private --accept-visibility-change-consequences`). Do it while forks = 0: a public fork made before the revert stays public and detached. Consequences: stars and watchers reset (0 anyway), anonymous release downloads stop, and CI goes back to the budget block until §7 is done. App auto-update is **unaffected**, because it's served from the separate public `Metis-Releases` repo (`electron-builder.yml` publish block). Afterwards, check the security log for the flip time and treat that window as an exposure incident.

**B1 — Secret rotation (first remediation after containment).**
- Revoke the Cahê Kimi `sk-kimi-…` key at the vendor, write a new one into `build/cahe-kimi.local.json` and the `CAHE_KIMI_JSON` repo secret, and rebuild the Cahê edition. This follows `docs/security/EMBEDDED-KEY-ROTATION.md` (`npm run rotate:embedded-keys`, Cahê section). Remove or replace the `v1.2.0` Cahê asset.
- Embedded-default `METIS_PROXY_KEY`: exposure only changed if some AskToto-Mantu-only release (for example `local-preview-2026-07-05`, `preview-metis-1.0.0`, `v1.0.3`–`v1.0.6` prereleases) was built with `METIS_EMBED_CLOUDFLARE_KEY=1` using a key not also shipped on the public Metis-Releases feed. If unsure, rotate: it's one command, and the old entry in `METIS_PROXY_KEYS` gets replaced.
- Nothing in git history needs rotating. Account ID and D1 ID are non-secret and can't be rotated.

**B2 — Written Mantu authorisation before any open-sourcing.** Confirm who owns the copyright (employment IP terms), whether MIT is an acceptable licence, and whether Mantu marks may be published. If they may, add a trademark carve-out (NOTICE) and exclude the brand files from the MIT grant. Until this exists, no version of this code should be public.

**B3 — Competitor reverse-engineering evidence in history (Cluely).** Needs a legal read of Cluely's EULA and ToS on reverse engineering against the documented `app.asar` extraction and CDP capture. It can't be fixed in place: it starts at the root commit `fa884651` and reaches all 27 tags. If it has to go, the only complete fix is a new repo from a sanitized snapshot (§8). An in-place rewrite is described in §8b for completeness only.

**B4 — Unreviewed production endpoint (D-8).** Security-review `operator/src/decide.ts` (`handleDecide`) and the `/v1/decide` addition to `ACCESS_BYPASS_PATHS`. Then either merge `origin/metis-2.0-inventory` through a reviewed PR or revert the live deploy to a reviewed main build, and reconcile the reported D1 drift (28 tables live vs 19 in source). Delete the branch once merged or reverted. No history rewrite needed.

**B5 — Keep the uncommitted program docs out of any public repo.** Don't commit `metis-v2-program/docs/metis-2.0/` (17 MB, 1,240 files) into this repo while any public path exists. Put it in a separate **private** repo (simplest), or at minimum drop all 36 clicky paths and scrub the 152 referencing files plus the D-8 narrative before any commit. `AGENTS.md`, `CLAUDE.md`, `.cursor/` and `.github/pull_request_template.md` are clean and can be committed.

---

## 6. NON-BLOCKING items (fix in HEAD anyway; no history rewrite)

- Move `ADMIN_EMAILS` to a Worker var or secret. Replace the real email and account-ID fixtures (about 20 test files plus 10 non-test files) with `example.com` / `acct-test` placeholders, and close M2-0049.
- Commit identity: set `user.email` to the GitHub noreply address on every machine and agent. The `.local` hostname identity leaks machine names.
- Infra recon: D1 ID `8eb5…` (len 36), the personal-name `*.cloudflareaccess.com` team domain, the `*.workers.dev` hostname (~50 mentions / 11 files), and `docs/operator/ACCESS-BYPASS-INTEGRATIONS.md`. None is exploitable alone, since HMAC and Access remain the controls. Consider replacing the name-bearing team domain with a role reference in docs.
- `src/main/cli-install-advice.test.ts`: replace the third-party username `kenn…` with a placeholder.
- Add `.wrangler/` to `.gitignore` (empty miniflare files were committed in `f19e4024` and removed in `34e22dec`).
- Licensing hygiene: add OFL-1.1 notices for the 4 bundled fonts, a CC0 credit for the Goldberg Aria, and provenance/ToS for `onboarding-hero-lady-planet.mp4`; drop the account-tagged `d8j0….cloudfront.net` mirror URL.
- `docs/MANTU-IT-REQUEST.md`: an internal ops memo, so decide whether it belongs in any public tree.
- If anything is ever public: enable secret scanning and push protection (free on public repos), keep the gitleaks CI gate, and keep first-time-contributor approval on.
- HeyClicky and Cluely competitor studies generally: route them through Mantu legal before any external exposure.

---

## 7. Alternatives that meet the goal (CI that runs) without publishing

Current burn, per `build.yml`: `quality` (ubuntu + **windows**) and `security` run on **every push to every branch** (108 branches, heavy agent pushing), with no `concurrency` cancel. macOS and Windows packaging run on main, PRs and dispatch. macOS bills at a 10x multiplier and Windows at 2x.

| Option | Cost | Risk | Notes |
|---|---|---|---|
| **A. Mantu funds the budget** (already requested in `docs/MANTU-IT-REQUEST.md` §2) | $ (hosted prices were cut up to 39% on 2026-01-01; check current per-minute rates) | none new | Fastest. Also settles the "billing owner" question. |
| **B. Transfer the repo to a Mantu GitHub org** (Team or Enterprise included minutes) | org plan | none new; history stays private | Also resolves B2 ownership ambiguity. Transfer keeps issues, PRs and redirects. |
| **C. Cut minute burn** | free | none | Add `concurrency: {group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true}`; `paths-ignore: ['docs/**','**/*.md']`; run the Windows `quality` leg only on PRs and main; keep packaging gated. Combine with A, B or D. |
| **D. Self-hosted runner for the private repo** (e.g. macOS packaging on a dedicated Mac user or VM) | free today: GitHub **postponed** the planned $0.002/min self-hosted charge (re-check on the day) | medium, containable | In a private repo only collaborators can trigger it, so the fork-PR attack doesn't apply. Remaining risk: it runs whatever any collaborator or AI agent pushes, with host access (signing keychain, local creds). Use `--ephemeral`, a dedicated OS user with no personal credentials, a runner group limited to named workflows, and no org-wide sharing. **Never attach a self-hosted runner to a public repo.** |
| E. Public mirror of a sanitized subset for CI | free minutes | high complexity; sanitization failures become public | Status doesn't gate private PRs without cross-repo plumbing, and every mirror push is a new publication. Only sensible for a clearly separable component (e.g. `license-server/`), not the app. |
| F. Local and pre-push test gates plus CI only for packaging | free | low | Agents already run vitest locally; CI budget then goes to signed builds only. |

## 8. If Mantu later approves open-sourcing

**8a (recommended vehicle): a new public repo from a fresh snapshot.** Apply the §6 HEAD scrub and the B2 notices. Exclude `docs/superpowers/`, `docs/planning/`, `docs/MANTU-IT-REQUEST.md`, brand files if not approved, and all program docs. Create a single initial commit with a noreply identity, run gitleaks and the pattern scans on it, and have a second person review before publishing. This repo stays private as the full-history archive. Nothing old is ever exposed, and no worktrees or PRs break.

**8b (not recommended): an in-place `git filter-repo` of this repo.** Only if Tony insists on publishing *this* history:
- `--invert-paths` for the 3 Cluely docs and `operator/.wrangler/`.
- `--replace-text` for the account ID, both owner emails and `kenn…`.
- `--mailmap` for the `.local` / `mantu.local` / `metis.local` identities.
- `--message-callback` for the 9 Cluely commit messages.

Consequences:
- Because the root commit changes, **every SHA changes**. That invalidates 108 remote branches, 24 local branches, 27 tags (and the release-to-tag links), 12 worktrees (plus 2 prunable), and 29 open PRs, all of which must be recreated.
- Every agent (Cursor, Codex, Devon, Claude) must re-clone. One push from an old clone reintroduces the old history.
- The 204 `refs/pull/*` refs and cached views keep the old commits reachable until GitHub Support removes them.
- Any clone, fork or archive made during today's exposure keeps them permanently.

## 9. Recommended path (ordered)

1. **Now:** revert to private (B0) while forks = 0, then read the security log for the exact flip time.
2. **Today:** rotate the Cahê Kimi key and pull the `v1.2.0` Cahê asset (B1). Decide on or rotate the embedded-default proxy key.
3. **This week:** restore CI via A or B, plus C, with D only as a scoped, ephemeral self-hosted macOS runner. That meets the free or cheap CI goal without publishing.
4. **This week:** review D-8, then merge or revert the live off-main Operator and delete `origin/metis-2.0-inventory` (B4). Land the §6 HEAD scrub (`ADMIN_EMAILS`, fixtures, `.gitignore`).
5. **Before committing the program docs:** move them to a private repo, or strip HeyClicky and the D-8 narrative (B5).
6. **Only if open-source is wanted:** get Mantu legal and IP sign-off (B2, B3), then use the §8a fresh-snapshot repo. Never re-flip this one.

---
Method notes: every command was read-only against `/Users/<redacted-user>/AI-Brain-build/metis-operator-ux` and the GitHub API. The anonymous mirror clone, blob extraction and scans ran in the session scratchpad. gitleaks output used `--redact`. Pattern outputs were masked at source.
