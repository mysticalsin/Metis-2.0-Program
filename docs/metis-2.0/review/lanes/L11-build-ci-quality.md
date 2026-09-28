# L11 — Build / CI / Quality Audit — Métis (asktoto) v1.9.6

Reviewer: senior staff engineer (AUDIT mode, read-only)
Repo: `/Users/<redacted-user>/AI-Brain-build/metis-2.0` @ `2bf21f1ceefe117838325342574b57852e5cadcb` (origin/main, v1.9.6) — confirmed HEAD matches the assigned baseline SHA exactly.
Scope: `package.json` scripts, `scripts/` (129 files), `.github/workflows/*`, `electron-builder*.yml`, `electron.vite.config.ts`, `tsconfig*.json`, vitest configs, `__mocks__/`, `docs/`, `.gitignore`, `.gitleaks.toml`, `README.md`, `DESIGN.md`, `.cursor/`.

Evidence labels used throughout: **OBSERVED** (seen directly in code/logs/commands run in this session), **DERIVED** (reasoned from OBSERVED facts), **ASSUMED**, **UNKNOWN**.

---

## 0. Commands run (this session)

| Command | Exit | Notes |
|---|---|---|
| `npm run typecheck` | 0 | Matches baseline receipt exactly (`tsconfig.node.json` + `tsconfig.web.json` + `check-test-types.mjs` + `operator/tsconfig.json` + `operator/client/tsconfig.json`). Output: `[check:test-types] OK — 26 known type errors in test files, at the baseline (never rising).` |
| `node scripts/check-skipped-tests.mjs` | 1 | **FAIL — 59 skipped tests on darwin, above the declared baseline of 1** (37 of them additionally flagged "no declared reason"). See §3 for root-cause analysis — a meaningful fraction of this session's specific 59 is inflated by this audit sandbox's filesystem/network restrictions, but the finding that the gate is unused in CI and its own baseline is already stale versus the project's own clean-machine baseline receipt (25 skips, not 1) stands independent of my sandbox. |
| `find src scripts intelligence/src eval -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts'` | — | 543 files — matches `BASELINE-EXITS.txt`'s `files: 543` exactly, confirming this checkout is bit-for-bit the audited baseline. |
| Targeted `npx vitest run` on 2 individual failing files, plus reading `__mocks__/electron.ts`, `scripts/check-test-types.mjs`, `scripts/check-skipped-tests.mjs` source | — | Used to separate genuine repo defects from this session's own sandbox artifacts (§3). |

I did not run `npm install`, did not run `npm audit` (network/registry access not in my allowed-commands list), and made no edits, commits, or destructive git operations. One `dangerouslyDisableSandbox` attempt (to distinguish a sandbox artifact from a real bug) was refused by the harness's own auto-mode classifier; I did not retry it and instead reasoned from the evidence already in hand (§3.1).

---

## 1. Architecture notes — what actually runs, and when

Four workflows, 1,036 lines total: `build.yml` (449), `release.yml` (428), `cahe-windows.yml` (118), `windows-signing-identity-preflight.yml` (41).

### `build.yml` — "Build & Test"
```
on:
  push:
    branches: ['**']              # every branch push
    tags-ignore: ['v*', 'ffmpeg-sidecar-*']
  pull_request:
    branches: [main, master]
  workflow_dispatch:
```
(`.github/workflows/build.yml:6-19`)

**Answer to "does pushing a branch trigger builds/releases": yes for verification, no for full packaging.** Concretely, on **every push to every branch**:
- `quality` job runs on `ubuntu-latest` **and** `windows-latest` (matrix, `build.yml:29-33`): `npm ci` → `npm run typecheck` → `npm run check:bugs` → `npm run build` → Playwright Chromium install → `npm test`.
- `operator` job (`build.yml:74-114`, ubuntu only): rebuilds the Operator Worker's two generated bundles from source and **fails the build if the committed generated file drifts from what a fresh build produces** (`git diff --exit-code`, `build.yml:96-102`) — a real "generated code matches source" gate, not just a build-succeeds check.
- `security` job (`build.yml:116-232`, ubuntu only): `npm audit --audit-level=critical`, a custom high/critical audit with a documented Dust-bundle false-positive carve-out (`scripts/check-audit.mjs`), a narrow product-specific secret-key-shape grep, a full-history gitleaks scan pinned to an exact Docker image digest, and a best-effort CycloneDX SBOM upload.

Full **installer packaging** (`build-macos`, `build-windows`, 90-min jobs each) is gated by an explicit cost condition (`build.yml:243-247, 336-340`): only on `workflow_dispatch`, `pull_request`, or `push` to `main`/`master` — **not** on an arbitrary feature-branch push. This is a documented, deliberate cost control (comment cites a prior real incident: "The job was not started because an Actions budget is preventing further use") and is sound engineering.

### `release.yml` — "Release"
```
on:
  push:
    tags: ["v*"]
```
(`release.yml:6-8`) — only a `v*` tag push triggers the customer release pipeline (macOS Developer-ID sign + notarize, Windows Authenticode sign). It re-verifies the tagged commit is exactly `origin/main` (`release.yml:29-35`), re-runs the full quality gate (typecheck, `npm test`, build, `npm audit --audit-level=critical`) before touching signing, and checks the tag matches `package.json`'s version (`check-version-parity.mjs`, `release.yml:65-66, 208-210`).

### `cahe-windows.yml` — manual, `workflow_dispatch` only, uploads a controlled build to an existing release. `windows-signing-identity-preflight.yml` — manual, diagnostic-only, cannot build/sign/publish, hard-gated to `github.repository == 'mysticalsin/AskToto-Mantu' && github.ref == 'refs/heads/main'`.

**What is genuinely good here, and should be preserved, not "simplified" away:** every non-obvious CI decision in `build.yml`/`release.yml` carries a dated rationale comment (why Windows was added to the matrix, why the cost gate exists, why the secret-scan regex is built from `src/shared/providers.ts`'s own key-prefix list, why the gitleaks Docker image is pinned by digest, why `check:bugs` exists). This is well above the median for a repo this size. The bug-ledger anti-regression gate (`docs/qa/BUG-LEDGER.md`, 4,687 lines, wired into CI via `check:bugs` at `build.yml:47`) is a real, working discipline: every bug marked FIXED must cite a regression test. Preserve this pattern; it is exactly what "senior developers working together" looks like, and any v2.0 refactor should extend it, not replace it with something lighter.

---

## 2. Findings

### P1 — `check:skips`, the skip-baseline anti-regression gate, is never run in CI, and its own baseline is already stale
**Axis:** reliability / testability · **File:** `.github/workflows/build.yml` (no reference anywhere); `package.json:80`; `scripts/check-skipped-tests.mjs:79`

`scripts/check-skipped-tests.mjs` is a carefully designed gate (its own header explains exactly why "3,305 passed, 0 failed" can hide an untested path, citing a real past incident where a skipped test let a `-c undefined` regression reach a tagged release). It hard-codes `const BASELINE = { win32: 12, darwin: 1, linux: 18 }` (`scripts/check-skipped-tests.mjs:79`) and is exposed as `npm run check:skips` (`package.json:80`).

- **OBSERVED:** `grep -n "check:skips\|check-skipped" .github/workflows/*.yml` → zero matches. No workflow, no job, no step invokes it. There is also no husky/pre-commit/lint-staged config anywhere in the repo (`find . -iname .husky` → none; no `husky`/`pre-commit`/`lint-staged` in `package.json`), so nothing forces a developer to run it locally either. It exists solely as a command a person can choose to type.
- **OBSERVED:** the project's own clean-machine baseline receipt (`/Users/<redacted-user>/AI-Brain-build/metis-2.0-exec/receipts/BASELINE-EXITS.txt`, macOS host, 2026-09-24, same commit) reports `skipped: 25` for the desktop suite. The script's own `darwin` baseline is `1`. **25 > 1** — meaning if `check:skips` had been run against that exact clean baseline run, it would already have failed, independent of anything in my own sandbox.
- **Failure scenario:** a developer (or CI, if someone ever wires this in) adds a tenth silently-skipped test on macOS; nothing catches it, because (a) nobody runs the check in CI and (b) the check's own accepted number is off by roughly 25x from reality, so even a manual run produces so much noise ("59 problems", "no declared reason for: ...") that a real new regression is indistinguishable from stale baseline drift.
- **Fix direction:** add a `check:skips` step to the `quality` job (only needs to run once, e.g. on the `ubuntu-latest` leg, or once per OS if the per-platform baselines matter) generating the JSON report `npm test` already produces; update `BASELINE.darwin`/`win32`/`linux` to the current real counts as a one-time reconciliation, then let the ratchet (already coded correctly — see `check-test-types.mjs`'s sibling pattern) do its job going forward.

### P1 — `docs/**.md` (60+ files) is invisible to both secret-scanning mechanisms
**Axis:** security · **File:** `.github/workflows/build.yml:159-167`; `.gitleaks.toml:41`

- **OBSERVED:** the narrow product-specific secret scan's root list is `src scripts build intelligence/src .github electron-builder.yml electron-builder.win.yml electron-builder.cahe.win.yml package.json` (`build.yml:165-166`) and its `--include` list is `*.ts *.tsx *.js *.mjs *.json *.yml` (`build.yml:162-163`) — `docs/` is not a root, and `.md` is not an included extension.
- **OBSERVED:** the gitleaks allowlist (repo-wide, full-history scan) explicitly exempts `'''^docs/.*\.md$'''` (`.gitleaks.toml:41`), justified in the same block as "Documentation examples... illustrative, never live keys."
- **Combined effect:** every file under `docs/` (60+ markdown files including `docs/compliance/*`, `docs/operator/RUNBOOKS.md`, `docs/MANTU-IT-REQUEST.md`, `docs/ENTERPRISE_RELEASE.md`, deploy/runbook docs — exactly the kind of file where an engineer pastes a real `curl -H "Authorization: Bearer sk-..."` example while debugging) has **zero** CI secret-scan coverage from either mechanism. Top-level `README.md`/`DESIGN.md` are still covered by gitleaks (they don't match the `^docs/` prefix), so this is specifically the `docs/` subtree.
- **Failure scenario:** an engineer copy-pastes a real Cloudflare/Anthropic/OpenAI key into a runbook while writing "here's the exact command I ran to debug this," commits it under `docs/operator/RUNBOOKS.md`. Neither CI gate flags it; it ships to a public GitHub repo.
- **Fix direction:** narrow the gitleaks allowlist to genuinely-fake, tagged fixtures (as the four `src`/`scripts`/`license-server` cases already are, each with a code-comment explaining exactly why) rather than blanket-exempting an entire content directory by path glob; if some docs genuinely need illustrative key-shaped examples, use a placeholder convention (e.g. `sk-ant-EXAMPLE-...`) that a scanner can still be taught to ignore without exempting the whole tree.

### P1 — 36+ "contract" tests exist only because `src/main/index.ts` (9,518 lines) cannot be unit-tested, and they assert on source text, not behavior
**Axis:** architecture / testability · **File:** `src/main/index.ts` (9,518 lines); representative tests: `src/main/metis-command-boundary.contract.test.ts:1-30`, `src/main/local-cloud-boundary.contract.test.ts:1-20`, `src/main/bank-grade-hardening.contract.test.ts:1-20`, `src/main/screen-capture-check-wiring.contract.test.ts:1-12`, `src/main/provider-fallback-order.contract.test.ts:1-14`

- **OBSERVED:** `wc -l src/main/index.ts` → 9,518 lines. This single file is Electron's main-process entry point.
- **OBSERVED, quantified:** `grep -l "readFileSync(join(__dirname, 'index.ts')" src/main/*.contract.test.ts` → **36 separate test files** read this one file as a raw string via `fs.readFileSync` and then assert with `.toContain(...)` / `.toMatch(/regex/)` / hand-rolled `indexOf`-based `sliceBetween`/`blockAfter` helpers against string ranges. Across the whole repo, **97 files are named `*.contract.test.ts`**, and **87 of the 97 (~90%) import `readFileSync`** (not all of the 87 are pure source-text pins — some read legitimate fixture data — but a representative sample across `src/main`, `src/renderer`, `src/shared`, and `scripts` all showed the same pattern of reading production source files and pattern-matching them).
- **This is self-documented, not inferred:** the tests say so themselves. `bank-grade-hardening.contract.test.ts:6-7`: *"index.ts cannot be imported in vitest (it boots Electron), so each fix is pinned by the shape of its source. A future edit that quietly re-introduces the hole fails here."* `screen-capture-check-wiring.contract.test.ts:2-5`: *"index.ts boots Electron at import, so this is a source-contract test... Behavior of probe vs vision vs failover lives in screen-capture-check.test.ts against the live runner."* `provider-fallback-order.contract.test.ts:13-14`: *"index.ts's askStart closure has no injectable seams."*
- **Failure scenario (concrete, not hypothetical):** `metis-command-boundary.contract.test.ts:19-27` asserts a code block between two literal string markers `ipcMain.handle(IPC.metisCommandConfirm` and `ipcMain.handle(IPC.metisCommandCancel` contains the substring `assertMainWindow(e)`. This proves the string is present in source; it does **not** execute `assertMainWindow` and does not prove it actually rejects a non-top-frame sender at runtime — a bug where `assertMainWindow` is called but its own implementation has an early return, or is called with the wrong closed-over variable due to a rename, would keep this test green. Conversely, a correctness-neutral refactor (extracting the handler body into a named function, changing whitespace inside the block, renaming a local variable) can fail dozens of these tests for no behavioral reason, teaching engineers to treat "contract test failed" as noise rather than signal — the opposite of what a regression suite is for.
- **Root cause, not a symptom:** this is not 36 independent test-quality mistakes; it is one architecture decision (a single ~9,500-line file mixing Electron app bootstrap, dozens of IPC handler registrations, provider routing/failover logic, and command-authority checks, with — by the tests' own admission — "no injectable seams") forcing every single fix in that file to be pinned by string-matching instead of by import-and-call. **Fixing the 36 tests individually would not fix this; the fix is extracting index.ts's non-bootstrap logic (IPC handler bodies, `pickPrimaryProvider`/`askStart` routing, command-authority checks) into plain, importable modules that take their dependencies as parameters, leaving `index.ts` as a thin bootstrap that wires them to Electron.** That refactor is exactly what "simplify... well structured" should mean for this codebase, and it would let most of these 36 tests become real behavioral tests for free.

### P2 — Zero lint/format tooling anywhere in the repo
**Axis:** architecture / readability · **File:** `package.json` (no `eslint`/`prettier`/`biome` in `dependencies`/`devDependencies`); repo root (no config file)

- **OBSERVED:** `grep -iE "eslint|prettier|biome" package.json` → no matches. `find . -maxdepth 2 -iname ".eslintrc*" -o -iname ".prettierrc*" -o -iname "biome.json"` → none. `docs/DEVELOPMENT.md` and `README.md` (277 and 301 lines) mention neither "lint" nor "format" nor "prettier" anywhere (`grep -in "lint\|prettier\|format"` → 0 matches in both).
- For a project with a 9,518-line main file, 543 test files, and an explicit v2.0 goal of "enterprise-grade code," there is no automated style enforcement of any kind and no documented convention. `npm run typecheck` catches type errors but not dead code, unused imports, unreachable branches, `any` usage, or inconsistent style; nothing in CI (`build.yml`) runs anything resembling `eslint .`.
- **Fix direction:** adopt one lint tool (ESLint flat config with `@typescript-eslint`, or Biome for a single fast binary with no plugin sprawl — reasonable given the project's stated Node/TS-only stack) plus Prettier (or Biome's formatter, avoiding a second tool), add it as a `quality` job step so it runs on every push exactly like `typecheck` does, and adopt it incrementally (Biome and ESLint both support "warn, don't fail, on pre-existing violations" migration modes) rather than a single big-bang reformat commit that would obscure `git blame` across the whole tree.

### P2 — Inconsistent GitHub Actions supply-chain pinning; the repo's own stated principle is applied to one dependency (a Docker image) but not to the Actions that run in every job, including the signed-release pipeline
**Axis:** security · **File:** `.github/workflows/build.yml:37,74,120,234,374`; `release.yml:27,61,207,317`; `cahe-windows.yml:29`; contrast `windows-signing-identity-preflight.yml:27`

- **OBSERVED:** 10 of 11 `actions/checkout` invocations across `build.yml`, `release.yml`, and `cahe-windows.yml` use the mutable tag `actions/checkout@v4`. The 11th, in `windows-signing-identity-preflight.yml:27`, is pinned to a full commit SHA (`actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4`). `actions/setup-node@v4`, `actions/cache@v4`, and `actions/upload-artifact@v4` are likewise used unpinned throughout `build.yml`/`release.yml`.
- The repo's own `security` job comment (`build.yml`, gitleaks step) states the principle explicitly: *"Pinned to the exact image digest verified locally... not `:latest` — a mutable tag is a supply-chain risk this gate exists to guard against, so it does not carry one itself."* That reasoning is applied to one Docker image and not to the GitHub Actions that execute arbitrary code in **every single job**, including `release.yml`'s macOS/Windows signing jobs — the pipeline that produces the customer-facing, Developer-ID-signed and notarized installers. A compromised or repointed `actions/checkout@v4` tag (a real attack class GitHub Actions has seen industry-wide) would run with the same trust as the rest of the release job.
- **Compounding gap, same pattern:** `grep -n "^permissions:" .github/workflows/*.yml` → only `windows-signing-identity-preflight.yml` declares an explicit `permissions:` block (scoped to `contents: read`); `build.yml`, `release.yml`, and `cahe-windows.yml` (which publishes to public GitHub Releases and holds signing secrets) have no explicit `permissions:` at workflow or job level, relying on whatever the repo/org default resolves to rather than declaring least privilege.
- **Fix direction:** pin all `actions/*` uses repo-wide to commit SHAs (Dependabot can auto-open PRs to bump SHA pins with the version comment preserved, exactly as `windows-signing-identity-preflight.yml` already demonstrates the pattern for); add an explicit `permissions:` block to every workflow (start from `contents: read`, add `contents: write` only on the specific job/step that needs to create a release).

### P2 — Release/packaging pipeline is expressed as giant single-line `&&`-chained npm scripts, not discrete CI steps
**Axis:** architecture / readability · **File:** `package.json:61,62,69,70` (and 8 more scripts with 5+ chained commands)

- **OBSERVED, quantified:** `release:build:mac` chains **27** `&&`-joined subcommands in one script string (`package.json:69`); `dist:local` chains 25 (`package.json:62`); `release:build:win` chains 22 (`package.json:70`); `release:mas` and `predist` each chain 15; five more scripts chain 8–11. Total npm scripts defined: **71**.
- Each of these giant one-liners runs as effectively one opaque unit from CI's point of view (a single `run:` step per the workflow, or a single local terminal command): a failure two-thirds of the way through (say, `check-packaged-runtime.mjs` failing after `electron-builder` has already spent 20+ minutes producing a universal mac build) gives no step-level boundary in the GitHub Actions UI to jump to — the whole chain is one green/red line, and a person has to read raw log text top-to-bottom to find which of the 27 sub-steps actually failed. This is a direct, measurable cost to "developer experience" and to diagnosability of CI failures, which the audit brief specifically asked about.
- Each individual sub-script (`check-ffmpeg-sidecar.mjs`, `check-sherpa-platform.mjs`, `fetch-llama-server.mjs`, etc.) is itself well-factored and independently testable (many have matching `.test.ts` files) — the complexity is specifically in the **orchestration layer** (package.json script chaining), not in the individual gate scripts.
- **Fix direction:** convert these long `&&` chains into either (a) discrete GitHub Actions steps (one `run:` per meaningful phase, giving per-step timing/red-X in the Actions UI — the CI-facing case, where this refactor is nearly free since `build.yml`'s own `build-macos`/`build-windows` jobs already call `npm run dist`/`npm run dist:win` as one step and could instead inline the sub-steps) or (b) a small orchestrator script (`scripts/release-mac.mjs`) that runs each phase, times it, and reports which phase failed — matching the quality bar the individual check scripts already meet, just one level up.

### P2 — Test suite's global Electron mock hardcodes an absolute `/tmp/...` path rather than using `os.tmpdir()`
**Axis:** reliability / reproducibility · **File:** `__mocks__/electron.ts:5-8`

- **OBSERVED:** `app.getPath` in the auto-mocked `electron` module returns literal, hardcoded paths: `if (name === 'userData') return '/tmp/asktoto-test-userdata'`, `if (name === 'documents') return '/tmp/asktoto-test-documents'`, else `` `/tmp/asktoto-${name}` `` (`__mocks__/electron.ts:5-8`). This is the module every `vi.mock('electron')` test in the suite resolves to.
- In this session's sandboxed audit environment, a test that exercises the encryption-key path (`src/main/secrets.ts:224`, via `src/main/brain/e2e-proof.test.ts`'s "encrypted-at-rest" mode) crashed with `EPERM: operation not permitted, mkdir '/tmp/asktoto-test-userdata'` because this sandbox denies writes to bare `/tmp` (writes are only allowed under `$TMPDIR`/`/tmp/claude`). **I am not asserting this reproduces in the project's actual GitHub-hosted CI runners** — `ubuntu-latest`/`windows-latest`/`macos-latest` have unrestricted `/tmp` access, so this specific crash is most likely (DERIVED, not directly confirmed — my one attempt to confirm by disabling the sandbox was refused by the harness) an artifact of my own read-only audit environment, not a live CI defect today.
- What **is** a legitimate, environment-independent finding: hardcoding an absolute `/tmp/...` path (rather than `os.tmpdir()`, which resolves to `$TMPDIR` and is the portable, sandboxable, parallel-worker-safe convention) means this test suite's reproducibility depends on an assumption — unrestricted write access to a fixed global path — that is not guaranteed on every developer machine, container, or hardened CI runner, and is exactly the kind of thing that silently breaks the day someone runs this suite inside a locked-down sandbox, a read-only-root container, or two CI jobs that happen to share a `/tmp` (e.g., self-hosted runners, which some enterprises use for cost reasons). It also means every test in the suite that touches `userData` shares one fixed directory rather than an isolated-per-test one, unless the individual test additionally does its own `mkdtempSync` (which `e2e-proof.test.ts` does for its *data* folder, but not for the encryption-key path, which still resolves through the shared mock).
- **Fix direction:** change the mock to `require('node:os').tmpdir()`-based paths (or a per-test-run unique subdirectory, e.g. `join(tmpdir(), 'asktoto-test', process.pid.toString())`), which fixes both the portability concern and the shared-state concern in one change.

### P3 — 26 permanently-tolerated type errors in test files (informational, not a defect — flagging so it's understood correctly)
**Axis:** correctness · **File:** `scripts/check-test-types.mjs:36,90`

`npm run typecheck` chains `check-test-types.mjs`, which typechecks files excluded from the main `tsc` runs (test files) and enforces a **monotonic ratchet**: the accepted error count (`BASELINE = 26`, `scripts/check-test-types.mjs:36`) may only ever be lowered, never raised — the script fails if the real count exceeds the baseline (regression) **and** fails if it falls below the baseline (stale, unclaimed improvement, `check-test-types.mjs:82-88`). This is a well-designed, actively-used debt-paydown mechanism (its own comment tracks the ratchet's history: 159 → 139 → 129 → 36 → 30 → 29 → 26) and **is** wired into CI (`npm run typecheck`, run in the `quality` job on every push). I am flagging this only so it is not mistaken for an "ignored technical debt" finding by whoever reads this report next to the `check:skips` finding above — the two look superficially similar (both are "baseline" mechanisms) but this one works exactly as designed and is exercised on every push; `check:skips` is not.

### P3 — No pre-commit/local enforcement layer (husky, lint-staged) anywhere
**Axis:** architecture · **File:** repo root (absence)

All quality gates (typecheck, tests, bug-ledger, audit, secret scan) are CI-only; nothing stops a local commit from violating any of them before a push round-trips through GitHub Actions (30-minute `quality` job timeout, per `build.yml:33`). Not urgent given CI does run on every branch push, but it is slower feedback than necessary and costs CI minutes (relevant given `build.yml`'s own comments describe a prior real incident of exhausting the Actions budget). Low priority relative to the P1/P2 items above.

---

## 3. Test health

### 3.1 Skip accounting — separating a real gap from this session's sandbox noise

The project's own instrumented gate (`scripts/check-skipped-tests.mjs`) is the right tool for this question, and I ran it (§0). It reported **59 skipped tests on darwin**, against its own hard-coded baseline of 1. I did not stop at that number — I investigated the two largest unexplained categories to determine what's real:

- **`src/main/brain/e2e-proof.test.ts`** (the flagship "END-TO-END PROOF" file, 18 tests via `describe.each(['plaintext', false], ['encrypted-at-rest', true])`): running it directly showed 9/9 pass in `plaintext` mode; the `encrypted-at-rest` mode's `beforeAll` throws `EPERM: operation not permitted, mkdir '/tmp/asktoto-test-userdata'` (traced to `src/main/secrets.ts:224` via the hardcoded mock path, §2 P2 finding above), which vitest reports as 9 tests "skipped" for that file rather than 9 failed assertions. **This is a sandbox artifact of my own read-only audit environment**, not a confirmed CI defect — but it is real evidence that the hardcoded `/tmp` path in `__mocks__/electron.ts` is a latent portability risk (see finding above).
- **`src/main/mcp/mcpClient.test.ts`** (network/SSRF-guard tests): running it alone hit my Bash tool's timeout without completing, consistent with this sandbox's restrictions on local port binding for whatever mock HTTP server these tests stand up. Also very likely a sandbox artifact, not evidence of a real hang in CI.
- **`src/renderer/src/components/OnboardingExperience.browser.test.ts`**: this one I traced to source, not environment — `describe.skipIf(process.env.ASKTOTO_BROWSER_QA !== '1')` (line 12) unconditionally skips 6 tests unless that env var is set to `'1'`. **`grep -rn "ASKTOTO_BROWSER_QA" .github/workflows/`** finds no such assignment anywhere in CI. This is a genuine, code-verified, always-on skip in every default `npm test` run (local or CI), and it is **not** in `check-skipped-tests.mjs`'s `REASONS` registry (confirmed: the registry has 9 entries, none mention this file or the env var) — so it is exactly the kind of drift the tool exists to catch, and currently doesn't (because, per the P1 finding above, nothing runs the tool).

**Net assessment:** treat "59" as noisy/environment-inflated, but treat the underlying architectural finding as solid: (a) `check:skips` is not run anywhere in CI, (b) its own `darwin` baseline (1) is already far below what the project's own clean baseline receipt shows (25), and (c) at least one file's skip (`OnboardingExperience.browser.test.ts`) is genuinely undeclared in the tool's own registry regardless of environment.

### 3.2 Scale, at this exact commit
- **543 test files** matching the root vitest include globs (`src/**`, `intelligence/src/**`, `scripts/**`, `eval/**`) — confirmed by direct `find`, matching `BASELINE-EXITS.txt` exactly.
- Desktop suite: 6,716 total tests (6,691 passed + 25 skipped + 0 failed) per the clean baseline receipt, once Electron's binary is correctly installed (the receipt notes the first pass hit `failedFiles: 1` — `local-routing.test.ts` — purely because Electron's binary wasn't installed after an `--ignore-scripts` npm ci; not a code defect).
- `cloudflare-proxy`: 28/28. `operator`: 1,002/1,002. `license-server`: 101/101. `operator/scripts`: 137/137 (per `BASELINE-COMPLETENESS.txt`).
- **97 files** are named `*.contract.test.ts` (~18% of the 543 test files); **36 of them** read `src/main/index.ts` specifically as raw text (§2 P1 finding). This is the "contract tests that grep source text instead of testing behaviour" pattern the audit brief asked me to quantify — it is large, concentrated in `src/main/`, and traceable to one root cause (`index.ts`'s size and lack of testable seams), not scattered bad habits across the codebase.
- No flaky-test quarantine/retry mechanism exists (no `retry` config in any vitest config; no "known-flaky" registry analogous to `check-skipped-tests.mjs`'s `REASONS`). Given the project's own stated philosophy (`vitest.config.ts`'s `testTimeout: 30_000` comment: *"Raising the budget does not weaken the gate: a genuinely hung test still fails, just later... this repo has a documented history of using [masking mechanisms] to mask real failures"*), this appears to be a deliberate choice rather than an oversight, and I am not flagging it as a defect.

---

## 4. Dependency hygiene

- **Electron: `43.6.0`**, pinned exactly (no caret) in `devDependencies` — correct practice for a security-sensitive native runtime. I have no live vulnerability database access in this session (no network egress for `npm audit`/registry calls was in my allowed-command list), so I cannot independently confirm or deny outstanding CVEs against this exact patch version; treat currency as **UNKNOWN** beyond what the repo's own CI already asserts.
- Resolved versions I did check directly in `package-lock.json` (lockfileVersion 3): `sharp@0.35.4` (matches the root `overrides` pin `"sharp": "^0.35.4"`, which the `security` job's own comments say was added specifically to close CVE-2026-33327/33328/35590/35591 in libvips bundled by an older `sharp` that `@huggingface/transformers` pulled in — **OBSERVED as the repo's own documented remediation**, not independently re-verified by me), `vite@7.3.6`, `wrangler@4.131.1`, `electron-builder@26.15.3`, `electron-updater@6.8.9`, `undici@7.29.1`, `@dust-tt/client@1.2.8`.
- The `security` job's own comments (`build.yml:150-158`) document a known, deliberately-accepted residual: `npm audit` reports `@dust-tt/client`'s bundled MCP SDK metadata (`express-rate-limit@8.6.2`, `ip-address@10.5.0` — both confirmed present in the lockfile) as high-severity, even though `scripts/prune-dust-bundle.mjs` (run in `postinstall`) removes that unused server tree from disk before packaging, verified by `check-packaged-runtime.mjs`. `scripts/check-audit.mjs` carves this specific case out rather than suppressing severity broadly. This is a reasonable, narrowly-scoped exception, well short of a blanket `|| true`.
- No dependency-update automation (no Dependabot/Renovate config found under `.github/`) — worth adding given the manual-only current process, though not urgent by itself.

## 5. Release pipeline complexity — see §2 P2 finding (giant chained scripts). Quantified: 71 total npm scripts; worst 4 chain 22–27 `&&`-joined subcommands each.

## 6. Reproducibility — see §2 P2 finding (hardcoded `/tmp` path in the global mock) and §3.1 (sandbox-vs-real-defect analysis). Everything else I could verify (exact HEAD SHA match, exact 543-file-count match, exact typecheck output match) reproduced bit-for-bit against the supplied baseline receipts, which is a good sign for the CI's own determinism.

## 7. Developer experience
- Strong: exhaustively-commented CI, a working anti-regression bug ledger, a well-designed test-type-error ratchet, per-phase caching (ffmpeg sidecars, runtime model assets) to keep packaging jobs fast, a `.cursor/environment.json` + `install.sh` that pins the exact Node version from `.nvmrc` for cloud dev agents.
- Weak: zero lint/format story (§2 P2) and zero mention of one in 578 combined lines of `README.md`/`docs/DEVELOPMENT.md`; 71 npm scripts with no `npm run` discovery aid (no `README.md` "common commands" table checked against reality — not verified either way in depth, flagged as a gap to close alongside the lint work); giant opaque release scripts make local reproduction of a CI packaging failure slow (§2 P2).

## 8. What "enterprise-grade CI/CD" needs from here (priority order)
1. Fix or retire `check:skips` (§2 P1) — cheapest, highest-leverage fix; the tool is already built and well-designed, it just needs a CI step and a baseline reconciliation.
2. Close the `docs/**.md` secret-scan gap (§2 P1) — narrow the gitleaks allowlist.
3. Begin extracting `src/main/index.ts` (§2 P1) — start with the highest-value seam (e.g., the `askStart`/provider-failover routing logic that `provider-fallback-order.contract.test.ts` and `provider-health-ux.contract.test.ts` both already pin by string-matching) into an importable, unit-testable module; let those two contract tests convert to real behavioral tests as proof of the pattern before doing the rest.
4. Pin all GitHub Actions to commit SHAs and add explicit `permissions:` blocks repo-wide (§2 P2) — mechanical, low-risk, closes a real supply-chain gap in the signed-release pipeline.
5. Adopt ESLint or Biome + Prettier/Biome-format, added as a `quality` job step (§2 P2).
6. Break the four giant `&&`-chained release scripts into discrete steps or a small orchestrator (§2 P2).
7. Fix the hardcoded `/tmp` path in `__mocks__/electron.ts` (§2 P2) — small, mechanical, improves portability immediately.

---

*End of L11 report. Structured findings for the Opus planner follow in the tool result.*
