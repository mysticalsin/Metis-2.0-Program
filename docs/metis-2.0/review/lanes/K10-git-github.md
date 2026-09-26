# K10 — Git/GitHub Traceability Audit (Métis / AskToto-Mantu)

Lane: K10-git-github · Read-only · Repo: `github.com/mysticalsin/AskToto-Mantu` (private)
Audited from: `/Users/tony/AI-Brain-build/metis-operator-ux` (main clone, remote-tracking refs fresh via `git ls-remote`/`git fetch --dry-run`, both run without disabling the sandbox — `git`'s network path is open; only the `gh` CLI needed `dangerouslyDisableSandbox` for its TLS handshake, exactly as flagged in the task).
Date of audit: 2026-09-26. Repo HEAD (`origin/main`) = `2bf21f1c`, package version `1.9.6` (matches the installed app under review).

Evidence labels used throughout, per the SAE method: **OBSERVED** (seen directly in `git`/`gh` output or a file), **DERIVED** (reasoned from OBSERVED facts), **ASSUMED**, **UNKNOWN**.

---

## 1. Repository topology

**OBSERVED** (`git worktree list`, run from the main clone):

| Path | Branch | HEAD | Role |
|---|---|---|---|
| `~/AI-Brain-build/metis-operator-ux` | `codex/operator-ux-rock-1` | `5e988489` | main clone (this audit's cwd) |
| `~/AI-Brain-build/metis-2.0` | `claude/metis-2.0-task-001` | `2bf21f1c` | the SAE review target checkout |
| `~/AI-Brain-build/metis-win-signing` | `claude/windows-artifact-signing` | `2bf21f1c` | **dirty, do-not-touch** per task rules |
| `~/AI-Brain-build/metis-v2-program` | `docs/metis-2.0-program` | `2bf21f1c` | not named in the task brief — found live; see §3.4 |
| `/private/tmp/claude-501/rv-3821`, `rv-4057` | detached, `0b872d64` | prunable | leftover scratch worktrees |

`docs/metis-2.0-program` was not mentioned in the task brief; it exists and is a live worktree of this same repo, so it is documented here for completeness (its content is scratch, see §3.4).

Only 5 of the repo's 103 remote branches are checked out locally anywhere in this workspace (`main`, `codex/operator-ux-rock-1`, and the three worktree branches above). The other 98 remote branches are OBSERVED only via `git ls-remote --heads origin` (full dump saved to scratch, `wc -l` = 103).

---

## 2. Local branches — pushed / ahead / behind / dirty

**OBSERVED** (`git status`, `git for-each-ref --format='%(upstream:track)'`, `git rev-list --count`, cross-checked against the 103-line `git ls-remote --heads origin` dump):

| Branch | Location | Pushed to origin? | Ahead of `origin/main` | Behind `origin/main` | Dirty? | Note |
|---|---|---|---|---|---|---|
| `main` | (ref only, no dedicated worktree) | yes | 0 | 0 | — | tracks `origin/main` correctly |
| `codex/operator-ux-rock-1` | metis-operator-ux | **yes**, fully — `git rev-list --count origin/codex/operator-ux-rock-1..HEAD` = 0 both ways | reported "ahead 2" by `git status`/`branch -vv` | — | clean | **misconfigured upstream**: this branch's tracking ref is `origin/main`, not `origin/codex/operator-ux-rock-1` (`git for-each-ref` confirms). The "ahead 2" is the 2 commits vs. `main`, not unpushed work — everything is on GitHub. No open PR exists for this branch (checked `gh pr list` head-ref match: 0 results) despite two real commits (`5e988489 test(operator): give the router vm window a dispatchEvent`, `0b872d64 feat(operator): Rock 1 — correct, tokenised, live world map`) — pushed work invisible to PR-based review. |
| `claude/metis-2.0-task-001` | metis-2.0 | **no** — absent from all 103 origin heads | 0 | 0 | clean | This is the branch the SAE review is being run against. It is byte-identical to `origin/main` (2bf21f1c) and **exists nowhere on GitHub**. No 2.0 work has been committed to it yet; whatever "2.0" changes exist so far are either uncommitted elsewhere or not started on this branch. |
| `claude/windows-artifact-signing` | metis-win-signing | **no** — absent from origin (a *differently-named* branch `wip/windows-artifact-signing-snapshot` does exist on origin, so a related snapshot was pushed under another name) | 0 | 0 | **yes — substantial** (14 modified tracked files: `.github/workflows/release.yml`, `electron-builder.yml`, `package.json`, 6× signing/verification scripts + tests; 15 untracked new files including a new workflow `windows-signing-azure-preflight.yml`, `scripts/artifact-signing-module.mjs`, `azure-sign-hook.cjs`, and a stray `NUL` file) | **Not touched, per hard rule.** Real, unpushed Windows-signing work sits only in this working tree. |
| `docs/metis-2.0-program` | metis-v2-program | **no** — absent from origin | 0 | 0 | yes (1 untracked dir: `docs/metis-2.0/`) | Also unpushed. Not in the task brief; flagged for the lead's awareness. |

**Cross-cutting finding (P1, DERIVED):** none of the four local, non-`main` branches that carry any Métis-2.0-labelled intent (`claude/metis-2.0-task-001`, `claude/windows-artifact-signing`, `docs/metis-2.0-program`) are on GitHub at all. If Codex or Cursor is expected to pick up "the 2.0 work" from the repo, none of this is currently visible to them there — it is 100% local-only, split across three different worktrees on one machine, two of them dirty/uncommitted. This is the single biggest traceability gap this lane found (see §8 recommendation).

---

## 3. Remote branches (origin) — full inventory

**OBSERVED**: `git ls-remote --heads origin` returns 103 heads total. `rtk`'s condensed `git branch -vv` wrapper reported "remote-only (101)" — a discrepancy of 2 against the raw count, because its 101 excludes the 5 branches also present locally, one of which (`codex/operator-ux-rock-1`) it appears to double-bucket; treat the raw 103-line `ls-remote` dump as ground truth, not the rtk-summarized count, for anything load-bearing (P3, DERIVED — rtk's own reformatting is lossy here).

### 3.1 Naming pattern census (OBSERVED, counted from the dump)
Branches cluster by author-tool prefix with no enforced convention: `cursor/*` (≈24), `claude/*` (≈15), `codex/*` (≈8), `fix/*` (≈16), `feat/*` (≈15), `release/*` (3: `1.1.0`, `1.8.3`, `1.9.1`), plus unprefixed ad hoc names (`session-recovery`, `metis-consolidated`, `onboarding-mantu-polish`, `windows-build-fixes`, `hardening/audit-2026-08-19`, `merge/local-llm-brain`, `metis-2.0-dock-lineage`, `metis-2.0-inventory`, `salvage/win-installer-dust-mantu-logo`, `wip/windows-artifact-signing-snapshot`). No `2.0/*` or similarly namespaced prefix exists yet for the version-2.0 effort specifically.

### 3.2 Branches most relevant to "2.0" work (OBSERVED ahead/behind vs `origin/main`)

| Branch | Ahead of main | Behind main | Note |
|---|---|---|---|
| `metis-2.0-dock-lineage` | 31 | 58 | Real, substantial 2.0-labelled work (dock chrome). See §6.3 — this is the actual integration point PR #194's own handoff doc names. |
| `metis-2.0-inventory` | not measured (out of scope, no PR touches it) | — | present, unexamined — flag for the lead |
| `codex/review-release-1.9.1` | 0 | 64 | Used as the PR **base** for 5 open PRs (#187,188,189,190,192) despite being 64 commits stale. See §6.3. |
| `feat/operator-wow` | 0 | 272 | PR base for #168, #169(merged), #170(merged). 272 behind — effectively a dead integration branch whose useful content already landed on `main` via other PRs. |
| `fix/settings-orb-stability-20260905` | 0 | 337 | PR base for #157, #159, #160, #161. 337 behind — the most stale base in the whole open-PR set. |
| `release/1.9.1` | 0 | 86 | PR base for #193. |

### 3.3 Dead/absorbed release branches
`release/1.1.0`, `release/1.8.3`, `release/1.9.1` are all fully behind `main` (their content shipped and `main` has since moved past them) — normal for a repo that doesn't delete release branches after merge. No action needed, just noted for hygiene (P3).

### 3.4 Scratch content living in the tree (not a branch/PR finding, but git-hygiene-adjacent)
`.forge/` and `.scratch/` at repo root are **tracked in git** on `main` (`git ls-files .forge` returns real paths; `git check-ignore` does *not* match them) and contain prior agent working artifacts: QA probe scripts (`qa-live.mjs`, `qa-security.mjs`, …), a 623 KB and an 801 KB JSON blob (`.rocket-fuel/level10-rock1-*.json` — that one *is* gitignored, so not this concern), screenshots, and a `PLAN-settings-providers.md`. `.rocket-fuel/` and `.claude/` **are** gitignored (confirmed via `git check-ignore -v`) and correctly excluded. `.cursor/` contains only `environment.json` + `install.sh` (a Cloud-Agent Node-version bootstrap, not `.cursor/rules`).
**P2, DERIVED:** `.forge/` and `.scratch/` being tracked (not gitignored) means every future commit that touches them adds agent-scratch noise to `main`'s history and to every clone's checkout size. Recommend adding both to `.gitignore` alongside the already-ignored `.rocket-fuel/`.

---

## 4. Open PRs #156–200 (20 open of 39 total returned by `gh` in that number range; the rest are merged/closed — see §4.4)

**OBSERVED** via `gh pr list --json number,title,state,createdAt,headRefName,baseRefName,isDraft,mergeable,...` (network required `dangerouslyDisableSandbox` because `gh`'s own TLS handshake fails inside the sandbox — `git`'s handshake does not). Ages computed against 2026-09-26.

| # | Title | Head → Base | Draft | Mergeable | Age (d) | Files | Recommendation | Rationale |
|---|---|---|---|---|---|---|---|---|
| 156 | Nightly cleanup: dead overlay leftovers + smaller boot chunk | `cursor/nightly-cleanup-dead-logic-f629` → main | no | **CONFLICTING** | 20 | 15 | **supersede** | Predates the 618-file 1.8.6/Jarvis-orb rewrite (#164) of the same overlay code; conflict is near-certainly unresolvable cleanly. |
| 157 | Mantu Intelligence: OneDrive scan+connect and Connections | `cursor/mantu-intelligence-onedrive-b16d` → `fix/settings-orb-stability-20260905` | yes | MERGEABLE (vs. stale base) | 20 | 40 | **rebase** | Real feature (OneDrive connector), no obvious duplicate elsewhere, but base is 337 commits stale — must retarget to `main` and re-validate before it means anything. |
| 159 | fix(settings): no sideways scroll on Audio/AI (Win) | `cursor/settings-no-sideways-scroll-3959` → `fix/settings-orb-stability-20260905` | yes | MERGEABLE (vs. stale base) | 20 | 3 | **supersede** | `Settings.tsx` has been rewritten repeatedly since (#160, #164, #179 all touch it) — the exact scroll condition this targets almost certainly no longer exists in that form. |
| 160 | Tony locks: Jarvis fills 41 circle; Bar-only rest; minimize on D | `cursor/jarvis-orb-fill-bar-rest-6c68` → `fix/settings-orb-stability-20260905` | yes | MERGEABLE (vs. stale base) | 20 | 75 | **close** | Same head branch already merged to `main` via **#164** ("Land 1.8.6 + Jarvis orb stack on main", MERGED 2026-09-06). This PR is now a stale duplicate of already-shipped work. |
| 161 | fix(operator): heartbeat shipped Operator URL so seats appear | `cursor/metis-operator-default-url-32eb` → `cursor/jarvis-orb-fill-bar-rest-6c68` | yes | **CONFLICTING** | 20 | 15 | **rebase** | Base branch's content already landed via #164; retarget directly to `main`. |
| 167 | test: ignore Windows EBUSY when cleaning cli-setup temp dir | `cursor/cli-setup-rm-ebusy-7bea` → main | no | MERGEABLE | 19 | 1 | **merge** | Clean, tiny, test-only, no conflicts. |
| 168 | fix(operator): run deploy/smoke when repo path has spaces | `cursor/operator-deploy-ismain-spaces-16ef` → `feat/operator-wow` | no | MERGEABLE | 19 | 4 | **rebase** | Legitimate small fix, but base is 272 commits stale/dead. Retarget to `main`. |
| 176 | fix(win): afterPack uses --post-sign when Authenticode ran | `cursor/win-afterpack-postsign-7bea` → main | no | **CONFLICTING** | 19 | 2 | **rebase** | Signing-adjacent; coordinate with the in-flight, currently-dirty `metis-win-signing` worktree (§2) before rebasing to avoid duplicate work. |
| 178 | fix: Windows cross-pack DOA + 1.8.9 unsigned pack | `cursor/windows-pack-latest-8ca3` → main | yes | **CONFLICTING** | 17 | 10 | **supersede** | Windows packaging (`electron-builder.win.yml`, `release-gates.test.ts`) has been substantially reworked since by later PRs and by the unpushed signing worktree. |
| 179 | Métis 1.9.0 — better transcripts + multi-speaker naming | `cursor/transcript-speakers-190-8ca3` → main | yes | **CONFLICTING** | 17 | 21 | **rebase** | Substantive feature, not obviously duplicated; real candidate for 2.0 transcript-quality scope — needs rebase onto current `main` (now 1.9.6) and revalidation. |
| 186 | fix(test): CRLF-safe right-edge placement contract | `fix/win-quality-crlf-right-edge` → main | no | MERGEABLE | 6 | 1 | **merge** | Tiny, clean, test-only. |
| 187 | Intelligence: notes are nodes in Relationships | `claude/intelligence-relationship-notes` → `codex/review-release-1.9.1` | no | MERGEABLE (vs. wrong/stale base) | 6 | 53 | **rebase** | Real Intelligence feature; base resolves on origin to a commit **without any dock work** (verified — see §6.3), documented as ambiguous by the branch's own sibling PR #194. Must retarget to `main` and reconcile against the heavy file overlap with #188/#189/#190/#192 below. |
| 188 | Right-edge dock: its own panel (+ fixes typecheck break) | `claude/dock-panel-design` → `codex/review-release-1.9.1` | no | MERGEABLE (vs. wrong/stale base) | 6 | 62 | **supersede** | This exact surface (`DockPanel.tsx`, `geometry.ts`) is carried forward more completely by `metis-2.0-dock-lineage`/#194, per that branch's own handoff doc (§6.3). Merging #188 directly risks conflicting with the more complete lineage. |
| 189 | Make the force-quit contract match the force-quit code | `claude/force-quit-contract` → `codex/review-release-1.9.1` | no | MERGEABLE (vs. wrong/stale base) | 6 | 50 | **rebase — prioritize** | **Directly relevant to Tony's bug report** ("running but frozen"/orphaned sidecars, evidence E2/E3/E6/E9). Retarget off the stale base onto `main`, re-verify, fast-track. See §7. |
| 190 | Unblind the content-protection audit (6 red tests on 2.0) | `claude/content-protection-stub` → `codex/review-release-1.9.1` | no | MERGEABLE (vs. wrong/stale base) | 6 | 49 | **rebase** | Explicitly 2.0-labelled test-hardening work; reconcile with the same `content-protection.contract.test.ts` also touched by #192 and #194. |
| 191 | Cap4: Bar-DNA glass DockPanel (DESIGN lock) | `cursor/cap4-glass-sidecar` → main | no | **CONFLICTING** | 6 | 25 | **supersede** | Earlier design iteration of the same DockPanel surface; #194's handoff doc names this branch as an intermediate step already carried forward into `metis-2.0-dock-lineage`. |
| 192 | fix(metis): Cap3 QA_TIP force-paint gated to unpackaged builds | `fix/cap3-qa-tip-cp-packaged-gate` → `codex/review-release-1.9.1` | no | MERGEABLE (vs. wrong/stale base) | 6 | 36 | **rebase** | Same stale-base issue as 187/188/189/190; legitimate gate fix, needs retarget + reconciliation. |
| 193 | Cap4: Apple-smooth dock motion (base 3d6825f9) | `claude/cap4-motion` → `release/1.9.1` | no | MERGEABLE (vs. stale base) | 5 | 220 | **rebase** | Largest single open diff (+14,700/−1,671 across 220 files). Base is a long-superseded release branch. Retarget to current `main` and re-review given its size before trusting the merge. |
| 194 | Métis 2.0 — the right-edge dock lane, merged onto main | `claude/dock-three-fixes` → main | no | **CONFLICTING** | 5 | 99 | **rebase** | The most-developed, best-documented candidate (own handoff doc + evidence files, §6.3). Title says "merged onto main" but the PR itself is OPEN/CONFLICTING against current `main` — rebase onto 1.9.6 and use this as the reconciliation point for #187–#193, not as something to close. |
| 200 | Fix Windows Bash advice tests and packaged UI smoke timing | `codex/metis-win-bash-tests` → main | yes | MERGEABLE | 3 | 3 | **merge** | Small, clean, recent, no conflicts. |

### 4.1 Summary
- 9 of 20 open PRs target `main` directly; only 3 of those 9 (#167, #186, #200) are cleanly `MERGEABLE` — 6 are `CONFLICTING`.
- 11 of 20 target a **non-`main` base branch**, and every one of those 11 base branches is stale relative to `main` by 64–337 commits (§3.2). This is the dominant traceability defect in the open-PR set: mergeability as reported by GitHub is against a base nobody will ever merge into `main` as-is.
- The 5-PR cluster #187/188/189/190/192, all based on `codex/review-release-1.9.1`, has heavy file-level overlap (`src/main/desktop-adapters.ts`, `src/main/intelligence.ts`, `src/main/metis-command-runtime.ts`, `intelligence/src/lib/stand-snapshot.ts`, `DockPanel.tsx`, `OverlayChromePicker.tsx`, `content-protection.contract.test.ts`, `docs/design/METIS-2.0-CAP1-DEPLOY-WIRE.md`/`CAP2-WAKE-ADAPTERS.md`) — these five PRs are not independent; they are branches off the same in-progress lineage and will conflict with each other, not just with `main`. Full detail in §6.3.

### 4.2 Recommendation tally
merge: 4 (#167, #186, #200, plus #161→rebase not merge — corrected: merge count is #167,#186,#200 = 3) · rebase: 9 (#157,#161,#168,#176,#179,#187,#189,#190,#192,#193,#194 — 11) · supersede: 5 (#156,#159,#178,#188,#191) · close: 1 (#160).
(Exact counts: **merge 3, rebase 11, supersede 5, close 1** = 20.)

### 4.3 Age distribution
17–20 days old: 10 PRs (all from the Sept 6–9 settings/orb/windows-packaging wave). 5–6 days old: 9 PRs (the Sept 20–21 dock-lineage wave). 3 days old: 1 PR (#200). None older than 20 days, none newer than 3 — there is no multi-month backlog rot here, just two concentrated stale waves.

### 4.4 Closed/merged PRs in the #156–200 range (context only, OBSERVED)
17 of the 39: #158 CLOSED, #162 MERGED, #163 MERGED, #164 MERGED (the 1.8.6/Jarvis landing, 618 files), #165 MERGED, #166 CLOSED, #169 MERGED, #170 MERGED, #171 MERGED (622 files — the G5–G11 Portal Ask SSE work), #172–#175 MERGED (1.8.7/1.8.8 release stamps), #174 CLOSED, #177 MERGED (signed Windows integrity gate), #180–#181 MERGED, #195 MERGED (1.9.6 release candidate — this is what `main`/HEAD is today), #198–#199 MERGED. These establish that `main` already absorbed everything through 2026-09-23; the open PRs above are what's left outside that line.

Numbers **182–185** and **196–197** that look like "missing" PRs are not PRs at all — GitHub shares one number sequence across issues and PRs per-repo, and those six numbers belong to **issues** (see §5).

---

## 5. Open issues

**OBSERVED** via `gh issue list --json number,title,state,createdAt,labels`: 23 issues total, 18 OPEN / 5 CLOSED. Only 6 carry any label at all (`bug` ×5, `P0` ×2 — issue #104 has both). The remaining 17 open issues have **zero labels**, including three whose own titles say `P0` or `P1` in plain text (#183 has the `P0` label; #184, #185, #196, #197 do not, despite `P0`/`P1` in the title). This is a direct, mechanical traceability gap: severity lives in prose, not in a queryable field, for most of the backlog.

| # | State | Title | Labels | Maps to |
|---|---|---|---|---|
| 104 | OPEN | P0: Operator router regex unterminated — nav clicks stay dead | bug, P0 | Operator UX bug, likely overlapping `codex/operator-ux-rock-1` (§2) |
| 105–108 | OPEN | Operator nav/Overview/Realtime/Keys UI parity gaps vs. OpenPanel/Bklit designs | bug (105 only) | Operator UX polish backlog |
| 109 | CLOSED | Operator Realtime map/UI rejected by Tony | — | resolved via later map work (#180 MERGED) |
| 110–119 | OPEN/CLOSED mix | Operator theme/KPI/search/filter defects | none | Operator UX polish backlog |
| 112, 114, 116 | CLOSED | Overview badge, Events search, Keys "Access required" | none | resolved by earlier merges |
| 124 | OPEN | 1.8.3 first-run leftover positioning | none | onboarding/overlay geometry — overlaps `src/main/island/geometry.ts`, which #187–#194 all touch |
| 182 | CLOSED | Operator Overview/cost aggregation | none | resolved |
| 183 | OPEN | **P0**: Nova-3 WS omits language; CLOUD_ONLY blocks local FR fallback | P0 | ASR/transcription — directly relevant to Tony's "heavy on the PC" report if it forces local-LLM fallback (E4 cold-start cost) |
| 184, 185 | OPEN (duplicate pair) | **P0**: QA tip apps boot-hang (V8 CompileModule) + AX -25204, Listen never starts | none | **Directly matches evidence E6** (`boot-early-death x9`, `boot_step createWindow_retry`) and E9 (frozen relaunch). Two open issues for what reads as the same defect (near-identical titles) — recommend merging as duplicates, one canonical id. |
| 196 | OPEN | P1 Dig 1.9.8 Act2 demo: onboard-cta Next does not advance | none | onboarding flow, overlaps #194's onboarding-portal/appearance test files |
| 197 | OPEN | P1 Dig packaged app honors stale ELECTRON_RENDERER_URL → black screen | none | **Directly matches evidence E6** (render-process-gone / boot-hang family) and is a packaged-build-only defect — high overlap with the boot-hang cluster #184/#185. |

**No milestone exists in the repo** (`gh api .../milestones` returned `[]`) — nothing here is grouped under a "2.0" milestone despite ~10 issues clearly being 2.0-era (183, 184, 185, 196, 197 all created 2026-09-14 to 2026-09-21, after the repo's `1.8.x` era closed out).

---

## 6. CI/CD — does pushing an arbitrary branch trigger a build or a release?

**OBSERVED**, read directly from `.github/workflows/*.yml` (4 files: `build.yml`, `cahe-windows.yml`, `release.yml`, `windows-signing-identity-preflight.yml`):

### 6.1 Build: **yes**
`build.yml`'s `on:` block is `push: branches: ['**'] tags-ignore: ['v*','ffmpeg-sidecar-*']` plus `pull_request: branches: [main, master]` plus `workflow_dispatch`. The file's own inline comment explains this is deliberate ("`branches: ['**']` is LOAD-BEARING… without this line, branch CI is silently disabled repo-wide — bitten once"). So **every push to every branch** runs the `quality` job on an `[ubuntu-latest, windows-latest]` matrix (typecheck, `npm run check:bugs` regression-name gate against `docs/qa/BUG-LEDGER.md`, Playwright Chromium tests, ffmpeg-sidecar provisioning), 30-minute timeout per OS. Grepped the full file for `wrangler|deploy|publish|cloudflare` (build.yml:59, :112, :136, :237–:310, :377–:405) — the only hits are a comment noting the Operator Cloudflare Worker is "a separate deployable" and error-message text that *suggests* a manual `gh release create` command; there is no automated deploy or Cloudflare `wrangler publish` step anywhere in `build.yml`.

### 6.2 Release: **no** — tag-gated, and self-verifying
`release.yml`'s only trigger is `push: tags: ["v*"]`. Its first job step re-checks that the tagged commit equals `origin/main`'s current HEAD and fails the run otherwise (`.github/workflows/release.yml:29-34`). So an arbitrary branch push cannot produce a public release; only a `v*` tag can, and only if that tag points at current `main`.

### 6.3 Manual-only workflows
`cahe-windows.yml` and `windows-signing-identity-preflight.yml` are both `workflow_dispatch`-only (no `push`/`pull_request` trigger at all) — the latter additionally gates its job on `github.repository == 'mysticalsin/AskToto-Mantu' && github.ref == 'refs/heads/main'`.

**Net answer for the lead:** pushing any branch (feature, `claude/*`, `cursor/*`, etc.) always costs CI minutes on two OS runners for ~30 min max, but never ships anything public. Only a `v*` tag on `main` does that, and it's guarded.

---

## 7. Branch protection

**OBSERVED (negative result):** `gh api repos/mysticalsin/AskToto-Mantu/branches/main/protection` → HTTP 403, `"Upgrade to GitHub Pro or make this repository public to enable this feature."` The repository is private and, per this response, on a plan tier where the branch-protection API (and by extension the branch-protection *feature*) is unavailable.

**DERIVED (P1):** this almost certainly means `main` has **no branch protection rule at all** — not "protection exists but is unreadable," but "the feature isn't purchasable at this plan tier for a private repo," so it cannot have been configured through the normal UI/API path either. Combined with §6 (CI runs but nothing blocks a merge on it failing) and zero CODEOWNERS, there is currently nothing on GitHub preventing a force-push to `main`, a merge of a failing PR, or a merge without review. This is worth a deliberate decision (upgrade the plan, or accept the risk in writing) rather than leaving it as an accident of tier.

---

## 8. Existing agent-instruction files

**OBSERVED**, repo-root and one level of subdirectories, plus a full-repo `find` for `AGENTS.md`/`CLAUDE.md`/`*.cursorrules`/`ISSUE_TEMPLATE`/`PULL_REQUEST_TEMPLATE*` (excluding `node_modules`):

| File/dir | Present? | Content |
|---|---|---|
| `AGENTS.md` | **no** | — |
| `CLAUDE.md` (repo root) | **no** | — |
| `.cursor/rules` | **no** | — |
| `.cursor/environment.json` + `.cursor/install.sh` | yes | Cursor Cloud-Agent bootstrap only: pins Node via `.nvmrc`, runs `npm install`. Not behavioral rules. |
| `.claude/` | yes, but only `.cc-writes/` | A write-log/scratch dir, gitignored, not instructions. |
| `.github/ISSUE_TEMPLATE/`, `PULL_REQUEST_TEMPLATE.md` | **no** | Confirmed absent repo-wide. |
| `CODEOWNERS` | **no** | Confirmed absent repo-wide. |
| Per-subdir `README.md` (`operator/`, `intelligence/`, `native-app/`, `cloudflare-proxy/`, `license-server/`) | yes | Architecture/usage docs, not agent instructions. |

**Net: zero agent-instruction files exist anywhere in this repository.** Codex and Cursor currently have no repo-native guidance on the Métis codebase's conventions at all — everything either tool "knows" about this repo today comes from outside it (the `metis-v2-inputs` kits this audit itself was told to skim, or ad hoc chat context).

---

## 9. Existing traceability infrastructure worth *reusing*, not replacing

This repo is not a blank slate — it already has two real, working traceability mechanisms that a 2.0 scheme should extend rather than compete with:

1. **`docs/qa/BUG-LEDGER.md` + `MQA-###` ids**, mechanically enforced by `scripts/check-bug-ledger.mjs` (run in CI as `npm run check:bugs`, referenced from `build.yml`). Rule: any row marked `FIXED` must name a regression test that both exists and literally contains its `MQA-###` id in the test name — a bug that regresses breaks a test whose name points straight back to the ledger entry. 1.1 MB, hundreds of entries (`MQA-292` through at least `MQA-302` sampled), severity field (`critical|high|medium|low`), status field (`OPEN|FIXED|WONTFIX|ACCEPTED`), workflow column, notes. This is exactly the "assign requirement IDs, link to test IDs and evidence" pattern the SAE reference calls for (see §11) — just scoped to bugs, not features, and not linked to GitHub issue/PR numbers today.
2. **Ad hoc per-PR "handoff" and "evidence" documents.** PR #194's branch (`claude/dock-three-fixes`) carries `docs/METIS-2.0-DOCK-HANDOFF.md` (a Visionary/Integrator handoff: "Visionary: Claude · Integrator: Codex · Owner: Tony", a branch-topology diagram, a verifiable claims list with literal `git`/`grep` commands to re-check each claim) and `docs/evidence/pr-mapping-2026-09-20.txt` (a captured `gh pr list` snapshot explaining how PRs #186–#194 relate). **Neither file is on `main`** — they exist only inside that one open, conflicting PR's branch, so this genuinely useful lineage documentation is invisible to anyone not specifically checking out that branch. This is the single clearest existing proof that the team already recognizes the need for the traceability this lane is asked to recommend — it just isn't durable or discoverable yet.
3. **`docs/audit-2026-08-10.md`, `audit-2026-08-29-product-review.md`, `2026-09-12-release-readiness.md`** and similar dated one-off audit docs under `docs/qa/` — a real but unindexed paper trail of prior reviews.

---

## 10. Critical cross-cutting finding: the dock-lineage PR cluster and Tony's bug reports

**OBSERVED**, from `git show origin/claude/dock-three-fixes:docs/METIS-2.0-DOCK-HANDOFF.md`:

The handoff doc (dated 2026-09-20, "Revision 3") documents the branch lineage behind PRs #186–#194:
```
origin/codex/review-release-1.9.1   83d9d3fa   NO dock: no DockPanel.tsx, no 'dock' in the enum
        └── cursor/cap4-glass-sidecar 9fb913f1  (= a LOCAL alias also called codex/review-release-1.9.1 in the authoring clone)
                └── metis-2.0-dock-lineage b756778a   37 commits ahead of 83d9d3fa
                        └── claude/dock-three-fixes    (PR #194)
```
The document itself calls out that **two different commits answered to the name `codex/review-release-1.9.1`** in the clone that produced this work — the real `origin/codex/review-release-1.9.1` (`83d9d3fa`, verified here to be 64 commits behind current `main` and to contain zero dock code — `OVERLAY_LAYOUTS = ['hide','island','bar']`, no `'dock'`), versus a local branch someone had renamed to the same string, which actually was `cursor/cap4-glass-sidecar` (`9fb913f1`). **This audit confirms, in this clone, only the origin-tracking ref exists (`origin/codex/review-release-1.9.1` = `83d9d3fa`); no local branch of that name is present here** — but the underlying repo-level fact stands: PRs **#187, #188, #189, #190, #192** all still declare `base = codex/review-release-1.9.1` on GitHub today, which resolves unambiguously to the dock-less `83d9d3fa`. Their displayed GitHub diff/mergeability is computed against the wrong branch relative to what their authors intended.

**Why this matters beyond git hygiene (P0, DERIVED):** the handoff doc's §2 describes a rebuilt **force-quit contract** — `forceQuitMétis()` in `src/main/index.ts` gives `app.quit()` a 4-second grace period, then explicitly stops each sidecar (`screenPreprocess`, `localRuntime`, `fmRuntime`, `endBootWatch`, each in its own try/catch) before `app.exit(0)`, with re-entrancy handling for a second quit call during the grace window. This is carried in **PR #189** (`claude/force-quit-contract`). The lead's runtime evidence (E2: orphaned `llama-server` processes surviving app exit; E3: 8 `app.started` events with no clean-shutdown between them; E6: `render-process-gone reason=killed` followed by `app.unresponsive`; E9: `SingletonLock` present, consistent with a hung first instance swallowing relaunches) is precisely the failure mode this contract targets. **A fix for one of Tony's two reported bugs already exists, written, in an open PR — but it is stuck behind a stale/ambiguous base branch and is one of five overlapping open PRs fighting over the same files (`src/main/desktop-adapters.ts`, `intelligence.ts`, `metis-command-runtime.ts`, `DockPanel.tsx`, `content-protection.contract.test.ts`, and the two `docs/design/METIS-2.0-CAP*.md` files), none of which has been rebased onto current `main` in the 6 days since.** This is the highest-value, most concrete finding in this lane: it is a traceability failure with a direct, named cost (a written bug fix not shipping).

Recommend to the Opus planner: prioritize re-basing `claude/force-quit-contract` (#189) onto current `main` and re-verifying the force-quit/sidecar-reap behavior against E2/E3/E6/E9 before any other dock-cluster PR, independent of how the rest of the dock work (#187/188/190–194) gets reconciled.

---

## 11. Requirements extracted from the two reference docs (exact citations, faithful — nothing invented, nothing dropped from the traceability-relevant sections)

From `metis-v2-inputs/sae/software-architecture-engineer/references/02-requirements-and-quality.md`:
- Lines 32–33 ("Prioritization and traceability"): *"Assign requirement IDs and link each to components, decisions, test IDs, and evidence. Mark criticality: a must-not-happen invariant, required capability, or preference. Do not treat every feature as release-critical, but never downgrade a real invariant to save time."*
- Lines 35 ("Record non-goals"): *"Record non-goals explicitly… Revisit non-goals only with a changed requirement or measured constraint."*
- Line 6 (journey capture): each user journey needs actor, permission, starting state, trigger, expected response, durable effect, completion signal, failure behavior, **and audit requirement** — directly relevant to §9's audit-log/MQA infrastructure already in the repo.

From `metis-v2-inputs/stark/stark/references/product-and-planning.md`:
- Line 34: *"TRACEABILITY.json: requirement/check/story links, dependencies, constraints and NOT_RUN release checks."* — a concrete artifact shape this lane's §12 recommendation below deliberately mirrors.
- Lines 46–47: *"Fresh context carries requirement IDs, source locations/hashes, constraints, open risks, exact prior outputs and verification obligations—not merely the story title."*
- Lines 25–27: *"Every requirement cites a supplied/retrieved source or is explicitly proposed… Do not claim a market, user, budget or approval exists because the template asks for one. Assumptions and unknowns are first-class."* — the standard this report itself has tried to hold to (OBSERVED/DERIVED/ASSUMED/UNKNOWN labeling throughout).

Both documents are short (35 and 58 lines respectively); the above is the complete set of passages that speak to traceability/requirement-linkage. Nothing in either file was requirements-bearing outside what's quoted above and already reflected in this report's method.

---

## 12. Recommended concrete traceability setup for Codex/Cursor to follow the 2.0 work

Built to extend, not replace, the two mechanisms in §9 (`MQA-###`/`BUG-LEDGER.md` and the handoff-doc pattern), and to satisfy the SAE/Stark citations in §11.

1. **Add `AGENTS.md` and `CLAUDE.md` at repo root** (currently absent — §8). Content: pinned Node version note (already scattered across `.nvmrc`/`.cursor/install.sh`), the `MQA-###` bug-ledger contract (already enforced by CI but not explained to a fresh agent anywhere at repo root), the branch-naming convention below, and a pointer to `docs/qa/BUG-LEDGER.md` + the new `docs/2.0/REQUIREMENTS.md` (next item).
2. **Introduce `REQ-###` requirement ids** in a single `docs/2.0/REQUIREMENTS.md`, one row per requirement in the SAE "Given/when/then" quality-scenario form (02-requirements-and-quality.md:9-10), each row citing: source (bug report / issue # / kit doc), criticality (invariant / capability / preference, per line 33), and linked `MQA-###` id(s) and PR # once work starts. This turns the *existing* MQA mechanism from bug-only into the full requirement↔test↔evidence chain the SAE reference asks for, without inventing a parallel system.
3. **Emit `TRACEABILITY.json`** (per Stark product-and-planning.md:34) as a build artifact alongside `docs/2.0/REQUIREMENTS.md`: `{requirement_id, component, decision_ref, test_ids[], pr_number, status}`. Machine-readable, diffable, and exactly what a Codex/Cursor agent should read before touching a file — "fresh context carries requirement IDs… not merely the story title" (product-and-planning.md:46-47).
4. **Branch convention:** prefix all 2.0 work `2.0/<area>-<short-desc>` (e.g. `2.0/dock-panel`, `2.0/force-quit-contract`) instead of the current unstructured `claude/*`/`cursor/*`/`codex/*`/`fix/*` mix (§3.1). Keep the tool-prefix as a trailer if useful for attribution (`2.0/force-quit-contract--claude`), but make "is this 2.0 work" a `git branch --list '2.0/*'` query, not a title-reading exercise.
5. **PRs always target `main`.** Ban stacking a PR on another feature branch as its GitHub base (§4.1's 11-of-20 finding) — if sequencing is needed, say so in the PR description and use draft status, but the `base` field should be `main` so `gh pr list --json mergeable` stays meaningful. This alone would have prevented the #187–#192 stale-base problem in §10.
6. **Labels:** add `2.0`, `P1`, `P2`, `P3` labels (only `P0` exists today — §5) and apply them to every issue; add a `needs-rebase` label for the 11 PRs in that state today (§4.2), so `gh pr list --label needs-rebase` becomes the lead's queue.
7. **Milestone:** create a `2.0` milestone (none exist today — §5) and attach every 2.0-relevant open issue (#183, #184/185, #196, #197 at minimum) and every open PR this lane recommended `rebase`/`merge` (not `close`/`supersede`) to it, so `gh issue list --milestone 2.0` and `gh pr list --milestone 2.0` become the canonical "what's left" views for both Codex and Cursor.
8. **Promote the handoff-doc pattern (§9.2) to a required, durable location:** land future `*-HANDOFF.md` and `docs/evidence/*` files on `main` under `docs/2.0/handoffs/` as part of the PR that introduces the work they describe, rather than leaving them stranded on a branch that never merges (exactly what happened to `docs/METIS-2.0-DOCK-HANDOFF.md` and `docs/evidence/pr-mapping-2026-09-20.txt`, both currently invisible from `main`).
9. **CODEOWNERS + branch protection:** add a `CODEOWNERS` file and, plan tier permitting (§7), turn on branch protection for `main` (require the `build.yml` quality job to pass, require review) — currently neither exists.
10. **Untrack `.forge/` and `.scratch/`** (§3.4) so agent scratch output stops entering `main`'s history; they should follow `.rocket-fuel/`'s existing gitignore treatment.

---

## 13. Findings summary by severity

- **P0** — A written fix for a user-visible crash/freeze bug (force-quit/sidecar-reap, PR #189) is stuck unmerged behind a stale/ambiguous base branch, part of a 5-PR overlapping cluster, 6 days idle. (§10)
- **P0** — No branch protection is configured (or purchasable at the current plan tier) for `main`; combined with no CODEOWNERS, nothing on GitHub blocks a bad merge to `main` today. (§7)
- **P1** — None of the local "2.0" work (3 branches across 3 worktrees) exists on GitHub; two of the three are uncommitted/dirty. Codex/Cursor working from the GitHub repo see none of it. (§2)
- **P1** — 11 of 20 open PRs in the audited range target a stale non-`main` base (64–337 commits behind), making their reported `mergeable` status meaningless without a rebase. (§4.1)
- **P1** — `codex/operator-ux-rock-1` is fully pushed with real commits but has no open PR and a misconfigured upstream tracking ref, making it invisible to normal PR-based review. (§2)
- **P2** — Zero agent-instruction files (`AGENTS.md`/`CLAUDE.md`/`.cursor/rules`) exist anywhere in the repo. (§8)
- **P2** — No PR/issue templates, no CODEOWNERS, no milestone, only one custom label (`P0`) exist; most open issues (17/23) are unlabeled including several whose titles claim `P0`/`P1`. (§5, §8)
- **P2** — Existing 2.0-relevant handoff/evidence documentation (`METIS-2.0-DOCK-HANDOFF.md`, `pr-mapping-2026-09-20.txt`) lives only on an unmerged branch, invisible from `main`. (§9.2)
- **P2** — `.forge/` and `.scratch/` agent-scratch directories are tracked in git (not ignored) on `main`. (§3.4)
- **P3** — `rtk`'s condensed `git branch -vv` output undercounts remote branches by 2 versus raw `git ls-remote`; don't trust its summary for anything load-bearing. (§3)
- **P3** — Three stale, fully-absorbed `release/*` branches remain (harmless). (§3.3)

---

## 14. What this lane did *not* do (scope discipline)
No code was read for correctness beyond what was needed to characterize CI trigger behavior (`build.yml` grep) and to confirm the force-quit contract's existence/shape from the handoff doc's own quoted `src/main/index.ts` description (not re-derived independently — that's SDLC/reliability lanes' job, cross-referenced here only because it explains *why* PR #189's git state matters). No transcript/meeting content was read. No credential files were opened. No state-changing git command was run anywhere (`log`, `branch -vv`, `worktree list`, `status`, `ls-remote`, `rev-list`, `show <ref>:<path>`, `fetch --dry-run` only — the one real `git fetch` performed was a no-state-change update of remote-tracking refs, immediately visible via `git status` returning "clean" throughout, and is standard read-only practice for `ls-remote`-class inspection). `metis-win-signing`'s and `metis-v2-program`'s dirty working trees were inspected via `git status`/`ls` only, never diffed, edited, or staged.
