# M2-0196 Windows Packaged Gate Lane Classification

Status: BLOCKED_EXTERNAL investigation runbook.
Scope: classify which packaged gates can run on GitHub `windows-latest`, and assign the rest to the physical Windows laptop lane.

## Evidence Rules

- OBSERVED means the source records a concrete workflow, line, output, or program decision.
- DERIVED means this runbook combines OBSERVED sources without adding a new measurement.
- ASSUMED means the source itself labels the fact as unverified or assumption-backed.
- UNKNOWN means no source in this worktree or official GitHub runner docs establishes the fact.
- BLOCKED_EXTERNAL means the required step needs GitHub account/workflow access or physical-device access and was not executed in this worktree.

No repository tests, scripts, or app launches were run for this ticket in this worktree. The only external action attempted from this worktree was the owner-approved `gh workflow run windows-qa.yml --ref main -f probe=capabilities`, which failed before dispatch because `api.github.com` was unreachable (S24).

## Source Register

| ID | Source | Retrieval date | Evidence used |
|---|---|---:|---|
| S1 | `docs/metis-2.0/designs/M2-0007-DESIGN.md:1-7` | 2026-09-27 | OBSERVED: M2-0007 is the hosted macOS/Windows packaged smoke design and says D-28 keeps tests and the app in CI only. |
| S2 | `docs/metis-2.0/designs/M2-0007-DESIGN.md:11-23` | 2026-09-27 | OBSERVED: the hosted lane builds unsigned app bytes, installs from shipped installer, runs fresh `ASKTOTO_USERDATA`, waits for renderer ready, quits cleanly, checks survivors, and uploads report plus sha256. |
| S3 | `docs/metis-2.0/designs/M2-0007-DESIGN.md:87-100` | 2026-09-27 | OBSERVED: hosted packaged smoke proves install/start, renderer ready, clean quit, zero owned processes after clean exit, census operation, and sha256; it does not prove HK, real dataless/cloud placeholders, x64 Mac slice, resource baselines, GPU/DPI/battery/EDR. |
| S4 | `docs/metis-2.0/designs/M2-0007-DESIGN.md:376-429` | 2026-09-27 | OBSERVED probe output from the designed Windows packaged smoke workflow: `runs-on: windows-latest`, `npm run dist:win`, NSIS `/S /D=...`, `node scripts/qa/packaged-smoke.mjs "$RUNNER_TEMP/smoke/Metis.exe"`, uploads `packaged-smoke-windows`. |
| S5 | `docs/metis-2.0/evidence/records/M2-0196-readonly-source-checks.md:23-61` | 2026-09-27 | OBSERVED read-only source output: `build-win` and `smoke-win` run on `windows-latest`; `smoke-win` verifies provenance, silently installs `Metis-Setup-*.exe`, launches installed `Metis.exe`, then launches `Metis-Portable-*.exe`. Artifact sha256: `1d1fea98a42df2c7d56ca3071be59691e49af971b652b9c6c7131d13c19975c1`. |
| S6 | `docs/metis-2.0/evidence/records/M2-0196-readonly-source-checks.md:63-99` | 2026-09-27 | OBSERVED read-only source output: the current `packaged-smoke.yml` Windows job runs on `windows-latest`, builds unsigned installers, records sha256, installs Setup silently, launches packaged smoke, and uploads `packaged-smoke-windows`. Artifact sha256: `1d1fea98a42df2c7d56ca3071be59691e49af971b652b9c6c7131d13c19975c1`. |
| S7 | `docs/metis-2.0/PLAN.md:171-176` | 2026-09-27 | OBSERVED: CI runs suites/builds with no real credentials; managed Windows 11 laptop owns ST-1-W with OneDrive placeholders, HK-W, census, GPU/DPI/battery, and EDR interaction. |
| S8 | `docs/metis-2.0/PLAN.md:180-193` | 2026-09-27 | OBSERVED: HK-M/HK-W require zero owned processes after main SIGKILL; ST-1/ST-1-W requires storage stress timing; census/resource regression has budgeted CPU/memory evidence. |
| S9 | `docs/metis-2.0/PLAN.md:195-214` | 2026-09-27 | OBSERVED: release acceptance requires HK-W, ST-1-W, RV, census/resource gates, and Windows parity across train/candidate gates. |
| S10 | `docs/metis-2.0/ARCHITECTURE.md:235-245` | 2026-09-27 | ASSUMED/UNKNOWN source facts: Windows libuv child-job behavior is unverified until HK-W; Windows `utilityProcess` reaping is UNKNOWN; Windows HK-W/supervise decision is later work. |
| S11 | `docs/metis-2.0/ARCHITECTURE.md:249-268` | 2026-09-27 | OBSERVED/PROPOSED source facts: reveal controller entry points are activate/reopen, second-instance, tray Show, global hotkey, notification click, and command wake; explicit reopen reveal is PROPOSED; blocked main thread is out of scope for reveal. |
| S12 | `docs/metis-2.0/ARCHITECTURE.md:290-291` | 2026-09-27 | OBSERVED: Windows placeholder detection cost is UNKNOWN until measured on the managed Windows laptop; ST-1-W runs on the Windows laptop with OneDrive placeholders. |
| S13 | `docs/metis-2.0/designs/M2-0191-DESIGN.md:635-645` | 2026-09-27 | OBSERVED: Windows dataless/placeholder measurement protocol records `[dataless] probed {files, ms}`, language mode, EDR effect, real "Free up space" attributes, and timeout behavior on the managed laptop. |
| S14 | `docs/metis-2.0/evidence/SCHEMA.md:115-118` | 2026-09-27 | OBSERVED: `HOST_CONFIGURED` records need non-CI environment, command, exit code, and output under `docs/metis-2.0/`. |
| S15 | `docs/metis-2.0/DECISIONS.md:111` | 2026-09-27 | OBSERVED: owner changed D-9 to CI runners for packaged-app QA, consistent with D-28; no QA user on owner's Mac. |
| S16 | GitHub Docs, "Choosing the runner for a job", lines 78-90 and 97-107, retrieved 2026-09-27: https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job | 2026-09-27 | OBSERVED: each GitHub-hosted job gets a fresh runner image; private-repo `windows-latest` is a standard x64 VM with 2 CPU, 8 GB RAM, 14 GB SSD; GPU-powered machines are a separate larger-runner offering. |
| S17 | GitHub Docs, "Larger runners reference", lines 60-64, retrieved 2026-09-27: https://docs.github.com/en/actions/reference/runners/larger-runners | 2026-09-27 | OBSERVED: GPU larger runners are a distinct runner class, with GPU listed only under larger-runner specifications. |
| S18 | `docs/metis-2.0/evidence/records/M2-0196-readonly-source-checks.md:7-21` | 2026-09-27 | OBSERVED: `windows-qa.yml` is not present on `origin/m2/integration`, so no checked-in capability-dispatch workflow output exists in this worktree. Artifact sha256: `1d1fea98a42df2c7d56ca3071be59691e49af971b652b9c6c7131d13c19975c1`. |
| S19 | `docs/metis-2.0/evidence/records/M2-0196-tsc-checks.md:1-94` | 2026-09-27 | OBSERVED: direct `tsc --noEmit` passes for `tsconfig.node.json` and `tsconfig.web.json`; direct `tsc --noEmit -p tsconfig.tests.json` exits 2. The diagnostic count recheck reports 26, while S20 defines the ratchet baseline as 24, so the test-type bar fails. Artifact sha256: `82b7c01225c2bf423a253a484b2a152dd8142142e335108039f790c47febc323`. |
| S20 | Public code ref `origin/m2/integration:scripts/check-test-types.mjs:50-94`, read with `git show origin/m2/integration:scripts/check-test-types.mjs` on 2026-09-27 | 2026-09-27 | OBSERVED: the test-type bar is the ratchet script's baseline comparison, not a raw zero-error `tsconfig.tests.json` compile; it exits 0 only when the count equals `BASELINE = 24`. The script itself was not run in this worktree under D-28. |
| S21 | `docs/metis-2.0/evidence/records/M2-0196-capabilities-dispatch-attempt.md:1-101` | 2026-09-27 | OBSERVED: the owner-approved `gh workflow run windows-qa.yml --ref main -f probe=capabilities` command and its 2026-09-27 re-attempt both exited 1 here with `error connecting to api.github.com`; read-only source checks also found no `windows-qa.yml` at `origin/m2/integration` or `origin/main`. The follow-up log command targets this worktree's verified remote repo, `mysticalsin/Metis-2.0-Program`. |
| S22 | `.github/workflows/windows-qa.yml:1-269` | 2026-09-28 | OBSERVED: this worktree adds/updates `windows-qa.yml` with `workflow_dispatch` input `probe=capabilities`, a `windows-latest` probe job, no repository script/app launch/build step, capability output lines, sha256 output, and `windows-qa-capabilities` artifact upload. |
| S23 | `docs/metis-2.0/evidence/records/M2-0196-windows-qa-probe-design.md:21-54` | 2026-09-28 | OBSERVED/PARTIAL: the workflow now defines action-level probes for UIA invoke, SendInput key delivery, tray icon creation, global hotkey registration, default capture endpoint state, and DirectX diagnostics; the record explicitly says it is not the required successful GitHub dispatch output. |
| S24 | `docs/metis-2.0/evidence/records/M2-0196-capabilities-dispatch-attempt.md:39-67` | 2026-09-28 | OBSERVED: the owner-approved `gh workflow run windows-qa.yml --ref main -f probe=capabilities` command was re-attempted and exited 1 with `error connecting to api.github.com`; a read-only `gh repo view --json nameWithOwner,url` also exited 1 with the same API connectivity error. |
| S25 | `docs/metis-2.0/evidence/records/M2-0196-host-configured-blocker.md:1-39` | 2026-09-28 | BLOCKED_EXTERNAL: this is not a `HOST_CONFIGURED` evidence record; it records the required non-CI fields, why this macOS worktree cannot produce them, and the exact physical Windows laptop step needed to produce the real record. |

## Capability Probe Status

| Probe | Status | Exact current output / blocker |
|---|---|---|
| Source check: scoped runbook | OBSERVED | This checked-in runbook is the scoped deliverable: `docs/metis-2.0/runbooks/windows-lanes.md`. |
| Source check: `windows-qa.yml` on public refs | OBSERVED | S18 records the read-only `origin/m2/integration` absence; S21 records the read-only `origin/main` absence. S22 records the workflow now added in this worktree; it must land on `main` before the ticket's `--ref main` dispatch can produce reviewer-checkable logs. Existing Windows install/launch evidence is in `qa-candidate.yml` and `packaged-smoke.yml` (S5, S6). |
| Owner-approved live capabilities dispatch | BLOCKED_EXTERNAL | Required per-gate probe output remains absent. S23 records that the action-level probes are now implemented in the worktree, but not executed on GitHub. S24 records a fresh owner-approved dispatch attempt and a read-only repo metadata check; both exited 1 because `api.github.com` was unreachable here. Exact external step after this workflow reaches `main`: `gh workflow run windows-qa.yml --ref main -f probe=capabilities`; then `gh run view <run-id> --repo mysticalsin/Metis-2.0-Program --log`; then attach redacted capability output and the `windows-qa-capabilities` artifact sha256 under `docs/metis-2.0/evidence/records/`. |
| HOST_CONFIGURED record | BLOCKED_EXTERNAL | Required `HOST_CONFIGURED` record remains absent. S25 is only a blocker record; it records the required non-CI `environment`, `command`, `exit_code`, `output.path`, and `output.sha256` fields and the physical Windows laptop step needed to produce them. Until the real `HOST_CONFIGURED` record exists, M2-0196 acceptance is not satisfied. |

## Lane Matrix

| Gate | `windows-latest` classification | Probe output / source | Physical Windows laptop assignment |
|---|---|---|---|
| Install/launch | RUNS | OBSERVED: S5 `smoke-win` runs on `windows-latest`, verifies provenance, silently installs Setup, launches installed `Metis.exe`, and launches Portable. OBSERVED: S6 packaged smoke runs on `windows-latest`, installs Setup, launches packaged smoke, and uploads `packaged-smoke-windows`. DERIVED: M2-0007 says this proves shipped installer install and installed app start on a clean host (S3). | Not required for basic install/launch, but the laptop may repeat it before laptop-only gates to bind those gates to the same packaged bytes. |
| HK-W | CANNOT | OBSERVED: M2-0007 says hosted smoke does not prove hard-kill supervision (S3). OBSERVED: release budgets define HK-W as zero owned processes after main SIGKILL (S8). ASSUMED/UNKNOWN: Windows libuv job behavior and utilityProcess reaping remain unverified until HK-W (S10). | ASSIGNED. Run HK-W on the physical Windows laptop; record End Task/SIGKILL-equivalent process-tree census, sidecar descendants, and any `supervise.exe` decision evidence. |
| RV-W | PARTIAL | OBSERVED: hosted install/launch proves renderer ready and clean start only (S2, S3). OBSERVED/PROPOSED: reveal correctness involves second-instance, tray Show, global hotkey, notification click, command wake, and explicit reopen behavior (S11). DERIVED: hosted launch does not exercise those user entry points. | ASSIGNED. Run RV-W on the physical Windows laptop for explicit reopen, tray Show, global hotkey reveal, notification/click routes, and command wake surface. |
| ST-1-W | CANNOT | OBSERVED: hosted runners have no real credentials by lane policy (S7). OBSERVED: real dataless/placeholder rows stay unhosted and ST-1-W runs with Windows OneDrive placeholders on the laptop (S3, S12). OBSERVED: M2-0191's Windows placeholder protocol records real Free-up-space attributes and EDR/language-mode effects on the managed laptop (S13). | ASSIGNED. Run ST-1-W on the physical Windows laptop with OneDrive placeholders and the `[dataless] probed {files, ms}` protocol. |
| Tray | PARTIAL | OBSERVED: clean quit through product Quit path is covered by hosted smoke (S2, S3). OBSERVED: tray Show is a separate reveal entry point (S11). OBSERVED/PARTIAL: S23 defines a synthetic `NotifyIcon` creation probe, but no successful GitHub run output is checked in yet. DERIVED: even a passing synthetic tray icon probe would not click product tray menus or validate product affordances. | ASSIGNED. Validate tray Show/Hide, Settings, Quit, and diagnostics on the physical Windows laptop. |
| Global hotkey | PARTIAL | OBSERVED: global hotkey is one reveal entry point (S11). OBSERVED/PARTIAL: S23 defines a `RegisterHotKey` action probe, but no successful GitHub run output is checked in yet. UNKNOWN: whether the hosted desktop session accepts global accelerator focus semantics equivalent to an enterprise laptop. DERIVED: a synthetic registration result is not product reveal behavior. | ASSIGNED. Validate global hotkey registration and reveal behavior on the physical Windows laptop. |
| UIA/SendInput adapters | PARTIAL | OBSERVED/PARTIAL: S23 defines synthetic UIA invoke and SendInput key-delivery probes. BLOCKED_EXTERNAL: no successful `windows-latest` probe output is checked in yet. DERIVED: synthetic controls are not enough to prove the product's desktop-control adapters against real desktop targets. | ASSIGNED. Run UIA/SendInput adapters on the physical Windows laptop against real desktop targets and record readback. |
| Audio capture | CANNOT | OBSERVED/PARTIAL: S23 defines a default capture endpoint state probe. DERIVED: endpoint presence/state is not audio capture. UNKNOWN: no checked-in successful probe output establishes a usable microphone/system-audio capture path on standard `windows-latest`. | ASSIGNED. Run microphone/system-audio capture on the physical Windows laptop with explicit endpoint and permission evidence. |
| GPU | CANNOT | OBSERVED: standard private-repo `windows-latest` is documented as CPU/RAM/storage/architecture only (S16). OBSERVED: GPU is a separate larger-runner class (S16, S17). OBSERVED/PARTIAL: S23 defines a `dxdiag` action probe, but no successful GitHub run output is checked in yet; even successful `dxdiag` text would not prove physical GPU parity. OBSERVED: M2-0007 says resource baselines/GPU stay outside hosted packaged smoke (S3). | ASSIGNED. Run GPU/backend/DPI/battery checks on the physical Windows laptop and record actual GPU/backend, driver, power state, and fallback behavior. |
| Census | PARTIAL | OBSERVED: hosted packaged smoke proves a non-vacuous process census for clean quit and zero owned survivors after clean exit (S2, S3, S4, S6). OBSERVED: managed Windows laptop owns resource census, GPU/DPI/battery/EDR interaction (S7). DERIVED: hosted census is not the resource/baseline census required for Windows parity. | ASSIGNED for resource census. Hosted `windows-latest` may keep the clean-quit survivor census; physical laptop owns CPU/memory/resource baseline, EDR, GPU/DPI/battery, and representative-profile census. |

## Physical Windows Laptop Lane

Every `CANNOT` or `PARTIAL` gate in the matrix is assigned to the physical Windows laptop:

| Gate | Physical-lane required evidence |
|---|---|
| HK-W | LIVE_VERIFIED or MEASURED process-tree output on packaged bytes: main kill, descendants/sidecars, owned survivors at 5 s, and `supervise.exe` decision if needed. |
| RV-W | LIVE_VERIFIED reveal transcript/screenshots/logs for explicit reopen, tray Show, global hotkey, notification click, command wake, and park-state transitions. |
| ST-1-W | MEASURED `[dataless] probed {files, ms}` output, OneDrive placeholder attributes, settings-write and `dns.lookup` timing under storage stress, and EDR/language-mode notes. |
| Tray | LIVE_VERIFIED tray Show/Hide, Settings, Quit, diagnostics behavior on the packaged app. |
| Global hotkey | LIVE_VERIFIED registration plus reveal from every relevant park state, with focused foreground-app context recorded without personal data. |
| UIA/SendInput adapters | LIVE_VERIFIED adapter action plus readback on approved synthetic desktop targets. |
| Audio capture | LIVE_VERIFIED microphone/system-audio endpoint and permission state with synthetic audio only. |
| GPU | MEASURED backend/GPU availability, fallback path, driver/power state, and DPI/battery context. |
| Census | MEASURED resource census on representative physical Windows host, including CPU, memory, helper processes, EDR interaction, GPU/DPI/battery context, and packaged artifact sha256. |

## Reviewer Checklist

- [x] Matrix includes install/launch, HK-W, RV-W, ST-1-W, tray, global hotkey, UIA/SendInput adapters, audio capture, GPU, and census.
- [x] Each matrix row records RUNS, PARTIAL, or CANNOT for `windows-latest`.
- [x] Each matrix row cites exact source IDs, and each source ID maps to a file:line, checked-in command-output artifact, or official URL with retrieval date.
- [x] Every PARTIAL or CANNOT row is assigned to the physical Windows laptop lane.
- [x] The runbook does not edit `docs/metis-2.0/ledger/tickets.json` or `_relay/`.
- [x] The missing `windows-qa.yml` workflow is restored in this branch with a `probe=capabilities` dispatch path.
- [x] The `probe=capabilities` workflow now defines action-level synthetic probes for tray, global hotkey registration, UIA invoke, SendInput key delivery, default capture endpoint state, and DirectX diagnostics.
- [x] The runbook labels outside-account workflow dispatch and the missing HOST_CONFIGURED record as BLOCKED_EXTERNAL with the exact owner/reviewer steps.
- [x] A fresh failed owner-approved `gh workflow run windows-qa.yml --ref main -f probe=capabilities` attempt and read-only `gh repo view` failure are recorded in `docs/metis-2.0/evidence/records/M2-0196-capabilities-dispatch-attempt.md`.
- [x] A `HOST_CONFIGURED` blocker record is checked in at `docs/metis-2.0/evidence/records/M2-0196-host-configured-blocker.md`; it is not the required successful non-CI evidence record.
- [x] No secrets, personal data, raw paths from reports, or client data are included.
- [ ] Required owner-approved capability probe output is checked in.
- [ ] Required HOST_CONFIGURED record is checked in with non-CI environment, command, exit_code, output path, and output sha256.
- [ ] TypeScript bars meet their source-defined thresholds; S19 records node/web pass, but test-type diagnostics are 26 against S20's baseline of 24.

## Verification Notes

- OBSERVED: S19 records direct TypeScript compiler output from the public code checkout. `tsconfig.node.json` and `tsconfig.web.json` pass. Direct `tsconfig.tests.json` compile exits 2, and the diagnostic count is 26. S20 shows the actual bar is the `check-test-types.mjs` ratchet baseline of 24, so the test-type bar fails as of this recheck.
- OBSERVED: S22 restores the workflow required by the ticket's verification command, but the command targets `--ref main`; this branch must land before a successful `gh workflow run windows-qa.yml --ref main -f probe=capabilities` can exist.
- BLOCKED_EXTERNAL: no successful `gh run view <run-id> --repo mysticalsin/Metis-2.0-Program --log` capability output is checked in yet; S24 records the latest failed dispatch attempt from this environment.
- BLOCKED_EXTERNAL: no successful `HOST_CONFIGURED` evidence record exists for M2-0196 in `docs/metis-2.0/evidence/records/`; S25 records only the external blocker and required physical Windows laptop fields. Acceptance is not satisfied until that record and the capability probe output are checked in.
