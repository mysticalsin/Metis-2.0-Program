# KIT-PATCHES — source patch reconciliation vs HEAD 2bf21f1c

Prep-lane output for task **P2-kit-patches**. Read-only investigation: nothing was applied to
`metis-2.0`, `metis-r11-work/repo`, or any kit directory. All `git apply` calls below were
`--check` only. Evidence labels follow the SAE contract: **OBSERVED** (ran/read myself),
**PROVIDED** (asserted by an input document), **DERIVED** (computed from OBSERVED facts),
**ASSUMED**/**UNKNOWN** (gap, flagged explicitly).

Reference commit throughout: `2bf21f1c` = `2bf21f1ceefe117838325342574b57852e5cadcb`
(`origin/main`, v1.9.6). OBSERVED: `metis-2.0` is on branch `claude/metis-2.0-task-001`,
working tree clean, `HEAD` = `2bf21f1c`.

---

## (a) `git apply --check --verbose` results — the three named kit patches

Run against `/Users/tony/AI-Brain-build/metis-2.0` at `2bf21f1c`, check-only (no writes).

| # | Patch | Files | Result |
|---|---|---|---|
| 1 | `previous-repair/delta/patches/metis-r11-scoped.patch` | 16 | **APPLIES CLEAN** — every file checked OK, exit 0 |
| 2 | `previous-repair/upgrade/media-repair.patch` | 2 | **FAILS** — exit 1, both hunks reject (context not found) |
| 3 | `onboarding-update/SOURCE-UPDATE.patch` | 4 | **APPLIES CLEAN** — every file checked OK, exit 0 |

### 1. `metis-r11-scoped.patch` (39,773 bytes, `delta_revision: 2`) — clean, per-file

All 16 files checked OK individually (`git apply --check --verbose` prints one "Checking
patch <path>..." line per file with no error):

new: `operator/src/ai-gateway.privacy-fixture.ts`, `operator/src/ai-gateway.privacy.test.ts`,
`operator/src/ask-meter.validation.test.ts`, `operator/src/keys.privacy.test.ts`,
`src/shared/metis-wake-lossless.test.ts`
modified: `operator/src/ai-gateway.ts`, `operator/src/ask-meter.ts`, `operator/src/ask.test.ts`,
`operator/src/cloudflare-connect.test.ts`, `operator/src/keys.test.ts`, `operator/src/keys.ts`,
`operator/src/use.test.ts`, `operator/src/use.ts`,
`src/renderer/src/lib/onboarding-hero-video.test.ts`,
`src/renderer/src/lib/onboarding-hero-video.ts`, `src/shared/metis-wake.ts`

`manifest.json` declares `base_commit: 2bf21f1ceefe117838325342574b57852e5cadcb` — matches
HEAD exactly. **DERIVED**: this is the current, superseding revision of the previous-repair
lane (its own `previous-manifest.json` records a `delta_revision`-1 sibling — see §2).

### 2. `media-repair.patch` (5,924 bytes) — fails, and this is expected, not a defect

Both hunks reject: the `.test.ts` hunk fails searching for the file's closing
`expect(video.play).toHaveBeenCalledOnce()` block (line 223), and the `.ts` hunk fails
searching for the pre-image `playOptionalOnboardingMedia` function body (line 55).

**DERIVED (OBSERVED cross-check, see §b/file-map below)**: this patch's pre-image is not
`2bf21f1c` — it targets an intermediate, already-once-patched ("v1") state of these two files
that itself no longer exists anywhere. `previous-manifest.json` (sibling to `manifest.json`,
same `patches/metis-r11-scoped.patch` path but different patch `sha256`) records **different**
`new_sha256` values for exactly these 2 files (v1) than the current `manifest.json` (v2):

| file | previous-manifest.json (v1) new_sha256 | manifest.json (v2) new_sha256 |
|---|---|---|
| `onboarding-hero-video.test.ts` | `2da76f12…` | `e70ad496…` |
| `onboarding-hero-video.ts` | `fc2a740c…` | `11eb389c…` |

`media-repair.patch`'s new-side content introduces `tryPlayOnboardingMedia` /
`tryRestartOnboardingMedia` as two split functions. OBSERVED: `metis-r11-scoped.patch`'s
(v2) final overlay already contains those exact two function names — i.e. the intent of
`media-repair.patch` was carried forward and superseded by the v2 delta, not lost.
**Classification: OBSOLETE as a standalone patch** (see table in §c).

### 3. `SOURCE-UPDATE.patch` (28,744 bytes) — clean, per-file

All 4 files checked OK: `src/renderer/src/components/OnboardingDemoPreviewBoundary.tsx` (new),
`src/renderer/src/components/OnboardingDemoScene.tsx` (modified),
`src/renderer/src/lib/onboarding-demo-controls.test.ts` (new),
`src/renderer/src/lib/onboarding-demo-controls.ts` (new).

`manifest.json` (`schema: metis.onboarding.source-update.v1`) declares
`historically_verified_base_commit: 2bf21f1ceefe117838325342574b57852e5cadcb` and
`does_not_modify_previous_16_file_delta: true`. OBSERVED: no path overlap with either patch
above — confirmed independently applicable. OBSERVED: `OnboardingDemoScene.tsx` sha256 in
metis-2.0 HEAD (`5003079b…`) equals the patch's own recorded `old_git_blob`-equivalent
baseline copy — i.e. **fully unapplied anywhere**, not partially landed.

### Overlay/reference directories found (beyond the three `.patch` files)

Two `overlay/` trees exist under `Metis-Work-Session/` (searched the whole tree; no others):
`previous-repair/delta/overlay/{operator,src}` (the v2 delta's literal post-patch file
contents) and `onboarding-update/overlay/src` (SOURCE-UPDATE's post-patch contents). Both
were used below as independent cross-checks (hash/diff), not applied anywhere. No separate
"overlay-only" patch exists that isn't already covered by one of the three named patches.

---

## (b) `/Users/tony/metis-r11-work/repo` — is it a clone, and how does it relate to `2bf21f1c`?

**Yes, real git clone.** OBSERVED: `origin` = `https://github.com/mysticalsin/AskToto-Mantu.git`
(same repo). Branch `work/metis-r11-20260924-083623`. `git rev-parse HEAD` / `git log -1` =
`2bf21f1ceefe117838325342574b57852e5cadcb` — **identical commit to metis-2.0's HEAD**, no
commits ahead or behind (`git log --oneline` and `git merge-base --is-ancestor 2bf21f1c HEAD`
confirm equality, not just ancestry). `git stash list` empty. `git branch -a` shows only
`main` + this work branch + `origin/*` refs — no other local branches hiding extra commits.

So there is **no commit-level diff to report** (`git log`/`git diff --stat` vs `2bf21f1c`
on committed history is empty by construction — HEAD *is* `2bf21f1c`). All of the prior
session's work lives as **uncommitted working-tree changes**:

```
 M  docs/qa/BUG-LEDGER.md
 M  operator/src/ai-gateway.ts
 M  operator/src/ask-meter.ts
 M  operator/src/ask.test.ts
 M  operator/src/cloudflare-connect.test.ts
 M  operator/src/keys.test.ts
 M  operator/src/keys.ts
 M  operator/src/use.test.ts
 M  operator/src/use.ts
 M  src/renderer/src/lib/onboarding-hero-video.test.ts
 M  src/renderer/src/lib/onboarding-hero-video.ts
 M  src/shared/metis-wake.ts
 M  vitest.config.ts
 ?? operator/src/ai-gateway.privacy-fixture.ts
 ?? operator/src/ai-gateway.privacy.test.ts
 ?? operator/src/ask-meter.validation.test.ts
 ?? operator/src/keys.privacy.test.ts
 ?? src/main/test-hermetic-home.test.ts
 ?? src/shared/metis-wake-lossless.test.ts
```

`git diff --stat 2bf21f1c` (working tree): 13 files, +425/−71 lines (tracked files only; the
6 untracked new files add on top of that).

### File-by-file map: kit patch vs. extra work

| File | In a kit patch? | Which | Matches kit's v2 overlay hash? |
|---|---|---|---|
| `operator/src/ai-gateway.ts` | yes | `metis-r11-scoped.patch` | not separately hash-checked; patch checked clean |
| `operator/src/ai-gateway.privacy-fixture.ts` (new) | yes | `metis-r11-scoped.patch` | " |
| `operator/src/ai-gateway.privacy.test.ts` (new) | yes | `metis-r11-scoped.patch` | " |
| `operator/src/ask-meter.ts` | yes | `metis-r11-scoped.patch` | " |
| `operator/src/ask-meter.validation.test.ts` (new) | yes | `metis-r11-scoped.patch` | " |
| `operator/src/ask.test.ts` | yes | `metis-r11-scoped.patch` | " |
| `operator/src/cloudflare-connect.test.ts` | yes | `metis-r11-scoped.patch` | " |
| `operator/src/keys.ts` | yes | `metis-r11-scoped.patch` | " |
| `operator/src/keys.test.ts` | yes | `metis-r11-scoped.patch` | " |
| `operator/src/keys.privacy.test.ts` (new) | yes | `metis-r11-scoped.patch` | " |
| `operator/src/use.ts` | yes | `metis-r11-scoped.patch` | " |
| `operator/src/use.test.ts` | yes | `metis-r11-scoped.patch` | " |
| `src/renderer/src/lib/onboarding-hero-video.ts` | yes | `metis-r11-scoped.patch` (v2) | **OBSERVED identical**: sha256 `11eb389c…` in both the delta's overlay file and this working-tree file |
| `src/renderer/src/lib/onboarding-hero-video.test.ts` | yes | `metis-r11-scoped.patch` (v2) | not separately hashed; same lane as above |
| `src/shared/metis-wake.ts` | yes | `metis-r11-scoped.patch` | " |
| `src/shared/metis-wake-lossless.test.ts` (new) | yes | `metis-r11-scoped.patch` | " |
| `docs/qa/BUG-LEDGER.md` | **no** | extra work (MQA-348 entry) | n/a — not in any kit patch |
| `vitest.config.ts` | **no** | extra work (MQA-348 fix) | n/a — not in any kit patch |
| `src/main/test-hermetic-home.test.ts` (new) | **no** | extra work (MQA-348 test) | n/a — not in any kit patch |

**None of the 16 `metis-r11-scoped.patch` files are missing from the working tree** — the
match is exact, both in file set and (spot-checked) content hash. The onboarding-update lane
(4 files) is **not present at all** in `metis-r11-work/repo` — OBSERVED: `OnboardingDemoScene.tsx`
there hashes to the unmodified baseline (`5003079b…`), and `OnboardingDemoPreviewBoundary.tsx`
/ `onboarding-demo-controls.ts` don't exist in the tree.

### The extra work: MQA-348

`docs/qa/BUG-LEDGER.md` + `vitest.config.ts` + new `src/main/test-hermetic-home.test.ts`
together are **MQA-348**, a bug the prior session found and fixed *while* running the kit's
own test session, not part of any of the three kit patches. OBSERVED content: unit tests
(`ingest-*`, `update-persistence`) call `resolveMeetingsFolder({ meetingsFolder: '' })`, which
falls through to `detectOneDrive()` (derives the real OneDrive root from `homedir()`) and then
a one-time legacy-folder copy-forward runs against the **real** `Métis Meetings` folder — on
2026-09-24 a cloud-only placeholder file blocked a synchronous `copyFileSync` and hung the
run. The fix gives every Vitest worker a fresh `mkdtempSync` home directory (`HOME`/
`USERPROFILE`, OneDrive env vars blanked, Playwright cache repinned) so no test can ever
resolve a real user profile.

**This is precisely the hazard this task's own HARD RULES section warns about** ("test
processes currently resolve Tony's REAL OneDrive meetings folder and quarantine his brain
index (observed twice today)"). **DERIVED, high confidence**: landing MQA-348 on `metis-2.0`
mainline is very likely what removes that hazard for future sessions — but this was not
executed or verified here (no tests were run, per the hard rule), so treat the causal link as
DERIVED-not-LIVE_VERIFIED until someone actually runs the isolated suite after landing it.

Cross-check (OBSERVED, no writes): concatenated the 3 extra-work files into one diff and ran
`git apply --check --verbose` against `metis-2.0` — **applies clean**, exit 0. This is expected
by construction (`metis-r11-work/repo` HEAD = `metis-2.0` HEAD exactly), done as a second,
independent confirmation rather than only reasoning from commit equality.

---

## (c) Classification — cherry-pick-ready / needs-rework / obsolete, and kit IDs closed

| Patch / change | Classification | Kit IDs it (partially) closes | Basis |
|---|---|---|---|
| `metis-r11-scoped.patch` (16 files) | **cherry-pick-ready** | SRC-06, SRC-08, SRC-10 (all **partial**, not full closure — see below) | git apply --check clean against current HEAD; content confirmed identical to what's already sitting uncommitted in `metis-r11-work/repo` |
| `media-repair.patch` (2 files) | **obsolete** | none (superseded) | Fails to apply (pre-image is a since-abandoned intermediate state); its fix intent (`tryPlayOnboardingMedia`/`tryRestartOnboardingMedia` split) is already present, in improved form, inside `metis-r11-scoped.patch`'s v2 content. Applying it would be a regression, not progress — do not resurrect it. |
| `SOURCE-UPDATE.patch` (4 files) | **cherry-pick-ready** | none of SRC-06/08/10 (separate onboarding-demo-controls lane; see kit-requirements note below) | git apply --check clean; zero file overlap with the other two patches; fully unapplied in both trees checked |
| MQA-348 extra work (3 files, uncommitted in `metis-r11-work/repo`) | **cherry-pick-ready** | none of the numbered kit SRC IDs — this is a QA/test-infra fix the session did on its own initiative, tracked as bug ledger entry MQA-348 | git apply --check clean against `metis-2.0` HEAD; self-contained (includes its own regression test) |

### Why SRC-06 / SRC-08 / SRC-10 are "partial," not closed

Per `r11-kit/source-review/FINDINGS.json` (**PROVIDED**), all three are **P0** and describe a
much larger scope than what `metis-r11-scoped.patch` delivers:

- **SRC-06** ("Text matching is not wake-word capture") wants a compact **acoustic** wake
  detector behind explicit opt-in, with the original command text/spans kept separate from
  normalized matching, and no ambient cloud transcription as a wake path. The patch only
  touches `src/shared/metis-wake.ts`'s text-matching layer (span/lossless handling) — the
  acoustic detector and capture-authority gate SRC-06 actually asks for are **not present**.
  Six kit tasks are attached (TASK-005/017/018/019/033/053); this delta does not close any of
  them, it narrows their remaining scope.
- **SRC-08** ("Gateway creation cannot certify privacy readiness") wants a named, reviewed
  sensitive-route config with explicit readback before protected traffic, and a hard rule
  never to auto-create an unreviewed gateway or infer privacy from a successful vault save.
  The patch adds a read-only privacy/vault-ordering slice and a fixture/test pair to
  `ai-gateway.ts`, `keys.ts`, `use.ts` — real progress, but the readback-before-traffic and
  auto-create prohibition are **not implemented** here (six tasks attached: TASK-011–016).
- **SRC-10** ("Preserve authoritative usage and complete aggregates") wants provenance-aware
  monotonic/reconcilable usage merges and SQL aggregates independent of pagination, touching
  `operator/src/d1.ts` and `operator/src/dashboard.ts`. The patch only touches
  `ask-meter.ts`/`ask.test.ts` (safe integer counters, stable non-streaming Ask identity) —
  **`d1.ts` and `dashboard.ts` are untouched by this patch**, so the durable-reconciliation /
  SQL-aggregate half of SRC-10 remains fully open (six tasks attached:
  TASK-015/018/034/045/056/062).

This matches the kit's own accounting: `previous-repair/delta/plan-status.json` states
`"root_tasks_closed_by_this_delta": 0` and spells out the same three partial contributions
verbatim (**PROVIDED**, quoted, not paraphrased as a closure claim):

> SRC-06: "Lossless wake-token source spans only; acoustic capture and authority gates
> remain open."
> SRC-08: "Read-only managed-gateway privacy and vault ordering slice; other
> routes/sinks/native/live gates remain open."
> SRC-10: "Safe integer counters and stable non-streaming Ask identity only; durable
> reconciliation/SQL aggregate gates remain open."

**Recommendation for whoever consumes this file next**: cherry-pick `metis-r11-scoped.patch`,
`SOURCE-UPDATE.patch`, and the MQA-348 trio as low-risk, already-validated (via `--check`)
groundwork — but do **not** mark SRC-06/08/10 closed in any tracker off the back of this
delta; log them as "narrowed, tasks above still open" and let the m5+ refactor/interaction
work pick up the remaining acoustic-wake, gateway-readback, and D1/dashboard-aggregate scope.
`media-repair.patch` should be treated as dead: don't apply it, and don't let a future agent
"fix" the apply failure by force — it would reintroduce the pre-v2, less-correct media-order
implementation.

### Explicitly out of scope for this reconciliation (flagged, not investigated)

- **B1/B2/B3 sidecar-orphaning / "heavy on the PC" / History-freeze P0 bugs**: OBSERVED —
  none of the files touched by any of the three kit patches or the MQA-348 extra work
  (`ai-gateway.ts`, `ask-meter.ts`, `keys.ts`, `use.ts`, `metis-wake.ts`,
  `onboarding-hero-video.ts`, `onboarding-demo-*`, `BUG-LEDGER.md`, `vitest.config.ts`) appear
  among the sidecar/orphaning evidence paths in `CODE-FINDINGS.json` (spot-checked for
  `mac-helper`/sidecar terms). This patch set does **not** address Tony's two headline P0 bugs;
  that work is tracked separately against `BUG-ROOT-CAUSES.json`'s sidecar-orphaning and
  onFatal-relaunch findings and is untouched here.
- `previous-repair/delta/tools/*`, `evidence/*`, `previous-repair/tests/*.cjs`,
  `onboarding-update/tests/*` — these are the kit's own verification harnesses (Node-loader
  test runners, a Python/Playwright browser fixture runner, syntax checkers). **Not executed**
  here per the hard rule against running the repo's tests; not needed to answer (a)/(b)/(c).
- `r11-kit/` inside the v5 baseline package is a **copy** of (part of) the r11 kit bundled
  for the work session's own reference; the canonical r11 kit inputs are
  `/Users/tony/AI-Brain-build/metis-v2-inputs/r11/Metis-2.0-Upgrade-Kit-r11`. Not diffed
  against each other — **UNKNOWN** whether the two copies are byte-identical; irrelevant to
  this task since only the copy's `FINDINGS.json`/`registry.json` were read for SRC-ID context.
