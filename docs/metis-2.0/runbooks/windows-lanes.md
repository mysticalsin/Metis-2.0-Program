# M2-0196 Windows Packaged Gate Lane Classification

Status: BLOCKED_EXTERNAL investigation runbook.  
Scope: classify which packaged gates can run on GitHub `windows-latest`, and assign the rest to the physical Windows laptop lane.

## Evidence Rules

- OBSERVED means the source records a concrete workflow, line, output, or program decision.
- DERIVED means this runbook combines OBSERVED sources without adding a new measurement.
- ASSUMED means the source itself labels the fact as unverified or assumption-backed.
- UNKNOWN means no source in this worktree or official GitHub runner docs establishes the fact.
- BLOCKED_EXTERNAL means the required step needs GitHub account/workflow access or physical-device access and was not executed in this worktree.

No repository tests, scripts, app launches, or workflow dispatches were run for this ticket in this worktree. That is intentional under D-28 and the owner constraint for M2-0196.

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
| S19 | `docs/metis-2.0/evidence/records/M2-0196-tsc-checks.md:1-58` | 2026-09-27 | OBSERVED: direct `tsc --noEmit` passes for `tsconfig.node.json` and `tsconfig.web.json`; direct `tsc --noEmit -p tsconfig.tests.json` exits 2 with known test-type diagnostics. Artifact sha256: `367dfc8149f4ab425114d13748c6959a9727f99117c218b3306753e4dfd9186a`. |
| S20 | Public code ref `origin/m2/integration:scripts/check-test-types.mjs:50-94`, read with `git show origin/m2/integration:scripts/check-test-types.mjs` on 2026-09-27 | 2026-09-27 | OBSERVED: the test-type bar is the ratchet script's baseline comparison, not a raw zero-error `tsconfig.tests.json` compile; it exits 0 only when the count equals `BASELINE = 24`. The script itself was not run in this worktree under D-28. |
| S21 | `docs/metis-2.0/evidence/records/M2-0196-capabilities-dispatch-attempt.md:1-48` | 2026-09-27 | OBSERVED: the owner-approved `gh workflow run windows-qa.yml --ref main -f probe=capabilities` command exited 1 here with `error connecting to api.github.com`; read-only source checks also found no `windows-qa.yml` at `origin/m2/integration` or `origin/main`. Artifact sha256: `49fafd6408c3b23d760217c4f78dd8d78c1930904330eaea7b60825338b7e284`. |

## Capability Probe Status

| Probe | Status | Exact current output / blocker |
|---|---|---|
| Source check: scoped runbook | OBSERVED | This checked-in runbook is the scoped deliverable: `docs/metis-2.0/runbooks/windows-lanes.md`. |
| Source check: `windows-qa.yml` on public refs | OBSERVED | S18 records the read-only `origin/m2/integration` absence; S21 records the read-only `origin/main` absence. Existing Windows install/launch evidence is in `qa-candidate.yml` and `packaged-smoke.yml` (S5, S6). |
| Owner-approved live capabilities dispatch | BLOCKED_EXTERNAL | S21 records the exact owner-approved dispatch attempt: `gh workflow run windows-qa.yml --ref main -f probe=capabilities` exited 1 because GitHub was unreachable from this environment. Required per-gate probe output remains absent. Exact reviewer step after a successful dispatch: `gh run view <run-id> --repo mysticalsin/AskToto-Mantu --log` and attach redacted capability output under `docs/metis-2.0/evidence/records/`. |
| HOST_CONFIGURED record | BLOCKED_EXTERNAL | Required record is absent. Per S14, the record must include non-CI `environment`, `command`, `exit_code`, and `output.path`/`output.sha256` under `docs/metis-2.0/`. Until that record exists, M2-0196 acceptance is not satisfied. |

## Lane Matrix

| Gate | `windows-latest` classification | Probe output / source | Physical Windows laptop assignment |
|---|---|---|---|
| Install/launch | RUNS | OBSERVED: S5 `smoke-win` runs on `windows-latest`, verifies provenance, silently installs Setup, launches installed `Metis.exe`, and launches Portable. OBSERVED: S6 packaged smoke runs on `windows-latest`, installs Setup, launches packaged smoke, and uploads `packaged-smoke-windows`. DERIVED: M2-0007 says this proves shipped installer install and installed app start on a clean host (S3). | Not required for basic install/launch, but the laptop may repeat it before laptop-only gates to bind those gates to the same packaged bytes. |
| HK-W | CANNOT | OBSERVED: M2-0007 says hosted smoke does not prove hard-kill supervision (S3). OBSERVED: release budgets define HK-W as zero owned processes after main SIGKILL (S8). ASSUMED/UNKNOWN: Windows libuv job behavior and utilityProcess reaping remain unverified until HK-W (S10). | ASSIGNED. Run HK-W on the physical Windows laptop; record End Task/SIGKILL-equivalent process-tree census, sidecar descendants, and any `supervise.exe` decision evidence. |
| RV-W | PARTIAL | OBSERVED: hosted install/launch proves renderer ready and clean start only (S2, S3). OBSERVED/PROPOSED: reveal correctness involves second-instance, tray Show, global hotkey, notification click, command wake, and explicit reopen behavior (S11). DERIVED: hosted launch does not exercise those user entry points. | ASSIGNED. Run RV-W on the physical Windows laptop for explicit reopen, tray Show, global hotkey reveal, notification/click routes, and command wake surface. |
| ST-1-W | CANNOT | OBSERVED: hosted runners have no real credentials by lane policy (S7). OBSERVED: real dataless/placeholder rows stay unhosted and ST-1-W runs with Windows OneDrive placeholders on the laptop (S3, S12). OBSERVED: M2-0191's Windows placeholder protocol records real Free-up-space attributes and EDR/language-mode effects on the managed laptop (S13). | ASSIGNED. Run ST-1-W on the physical Windows laptop with OneDrive placeholders and the `[dataless] probed {files, ms}` protocol. |
| Tray | PARTIAL | OBSERVED: clean quit through product Quit path is covered by hosted smoke (S2, S3). OBSERVED: tray Show is a separate reveal entry point (S11). DERIVED: hosted smoke does not click tray menus or validate tray affordances. | ASSIGNED. Validate tray Show/Hide, Settings, Quit, and diagnostics on the physical Windows laptop. |
| Global hotkey | PARTIAL | OBSERVED: global hotkey is one reveal entry point (S11). DERIVED: hosted install/launch can start the app, but no source shows a real user keyboard/global accelerator probe on `windows-latest`. UNKNOWN: whether the hosted desktop session accepts global accelerator focus semantics equivalent to an enterprise laptop. | ASSIGNED. Validate global hotkey registration and reveal behavior on the physical Windows laptop. |
| UIA/SendInput adapters | CANNOT | UNKNOWN: no scoped source records a `windows-latest` UIA/SendInput probe. DERIVED: UIA/SendInput adapters are desktop-control gates, not covered by install/launch, clean quit, or process census (S2, S3). | ASSIGNED. Run UIA/SendInput adapters on the physical Windows laptop against real desktop targets and record readback. |
| Audio capture | CANNOT | DERIVED: CI lane policy excludes real credentials and physical host state (S7), while hosted smoke covers app start/quit only (S2, S3). UNKNOWN: no scoped source or official runner doc establishes a real microphone/system-audio endpoint on standard `windows-latest`. | ASSIGNED. Run microphone/system-audio capture on the physical Windows laptop with explicit endpoint and permission evidence. |
| GPU | CANNOT | OBSERVED: standard private-repo `windows-latest` is documented as CPU/RAM/storage/architecture only (S16). OBSERVED: GPU is a separate larger-runner class (S16, S17). OBSERVED: M2-0007 says resource baselines/GPU stay outside hosted packaged smoke (S3). | ASSIGNED. Run GPU/backend/DPI/battery checks on the physical Windows laptop and record actual GPU/backend, driver, power state, and fallback behavior. |
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
- [x] The runbook labels outside-account workflow dispatch and the missing HOST_CONFIGURED record as BLOCKED_EXTERNAL with the exact owner/reviewer steps.
- [x] No secrets, personal data, raw paths from reports, or client data are included.
- [ ] Required owner-approved capability probe output is checked in.
- [ ] Required HOST_CONFIGURED record is checked in with non-CI environment, command, exit_code, output path, and output sha256.
- [ ] TypeScript bars are fully proven; S19 records direct compiler output and S20 identifies the test-type ratchet bar, but the ratchet script was not run here under D-28.

## Verification Notes

- OBSERVED: S19 records direct TypeScript compiler output from the public code checkout. `tsconfig.node.json` and `tsconfig.web.json` pass. Direct `tsconfig.tests.json` compile exits 2 with known diagnostics; S20 shows the actual bar is the `check-test-types.mjs` ratchet, which was not run here under D-28.
- BLOCKED_EXTERNAL: the ticket's verification command is `gh workflow run windows-qa.yml --ref main -f probe=capabilities`; S21 records that the dispatch attempt failed before reaching GitHub from this environment, and that `windows-qa.yml` is not present in the local public checkout's `origin/main` or `origin/m2/integration` refs.
- BLOCKED_EXTERNAL: no `HOST_CONFIGURED` evidence record exists for M2-0196 in `docs/metis-2.0/evidence/records/`; acceptance is not satisfied until that record and the capability probe output are checked in.
