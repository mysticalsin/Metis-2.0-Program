# M2-0196 Windows Packaged Gate Lane Classification

Status: BLOCKED_EXTERNAL; successful `windows-qa-capabilities` artifact output and the test-type compiler ratchet remain unresolved.
Scope: classify which packaged gates the GitHub-hosted `windows-latest` runner can really run, and assign every `PARTIAL` or `CANNOT` gate to the physical Windows laptop lane.

## Decision

`windows-latest` remains valid for packaged install/launch smoke and a limited clean-quit survivor census. It is not the authority for hard-kill, OneDrive placeholder stress, product reveal entry points, product tray/global-hotkey behavior, real UIA/SendInput desktop targets, audio capture, GPU parity, EDR, DPI, battery, or representative resource census. Those gates are assigned to the physical Windows laptop lane below.

LEAD_ACTION: After `.github/workflows/windows-qa.yml` is on `main`, run `gh workflow run windows-qa.yml --ref main -f probe=capabilities`.
LEAD_ACTION: After the capabilities run exists, run `gh run view <run-id> --repo mysticalsin/Metis-2.0-Program --log`, download the `windows-qa-capabilities` artifact, redact only secrets/PII if any, and file the CI artifact evidence under `docs/metis-2.0/evidence/records/`.
LEAD_ACTION: Run the physical Windows laptop host-configuration probe with synthetic/non-PII data and file the required `HOST_CONFIGURED` evidence record under `docs/metis-2.0/evidence/records/`.

## Source Register

| ID | Claim label | Exact source | Evidence used |
|---|---|---|---|
| S1 | OBSERVED / BLOCKED_EXTERNAL | `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:21-32` and `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-capabilities-dispatch-attempt.md:1-7` | The worktree defines the `probe=capabilities` workflow probes and `windows-qa-capabilities` artifact upload, but the successful owner-approved GitHub Actions run output has not been recorded. This is workflow design evidence, not runner probe output. |
| S2 | OBSERVED / BLOCKED_EXTERNAL | `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:25` and `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:34-48` | The workflow design says the synthetic UIA probe writes `uia.invoke_action`; actual `windows-latest` artifact output is still required. |
| S3 | OBSERVED / BLOCKED_EXTERNAL | `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:26` and `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:34-48` | The workflow design says the synthetic SendInput probe writes `sendinput.key_action`; actual `windows-latest` artifact output is still required. |
| S4 | OBSERVED / BLOCKED_EXTERNAL | `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:27` and `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:34-48` | The workflow design says the synthetic tray probe writes `tray.notify_icon_action`; actual `windows-latest` artifact output is still required. |
| S5 | OBSERVED / BLOCKED_EXTERNAL | `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:28` and `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:34-48` | The workflow design says the synthetic global-hotkey probe writes `global_hotkey.register_action`; actual `windows-latest` artifact output is still required. |
| S6 | OBSERVED / BLOCKED_EXTERNAL | `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:29` and `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:34-48` | The workflow design says the audio probe writes `audio.default_capture_endpoint_action`; actual `windows-latest` artifact output is still required. |
| S7 | OBSERVED / BLOCKED_EXTERNAL | `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:30` and `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-windows-qa-probe-design.md:34-48` | The workflow design says the GPU probe writes `gpu.dxdiag_action`; actual `windows-latest` artifact output is still required. |
| S8 | OBSERVED | `.github/workflows/packaged-smoke.yml:94-145`, also recorded in `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-readonly-source-checks.md:63-99` | Windows packaged smoke runs on `windows-latest`, builds unsigned installers, records Setup SHA256, silently installs Setup into runner temp, launches `scripts/qa/packaged-smoke.mjs`, and uploads `packaged-smoke-windows`. |
| S9 | OBSERVED | `.github/workflows/qa-candidate.yml:168-226` and `.github/workflows/qa-candidate.yml:314-350`, also recorded in `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-readonly-source-checks.md:23-61` | QA candidate builds Windows installers on `windows-latest`; the smoke job verifies provenance, silently installs Setup, launches installed `Metis.exe`, then launches Portable. |
| S10 | OBSERVED | `docs/metis-2.0/designs/M2-0007-DESIGN.md:87-100` | Hosted packaged smoke proves install/start, renderer ready, clean quit, zero owned processes after clean exit, census operation, and SHA256; it explicitly does not prove HK, real dataless/cloud placeholders, resource baselines, GPU/DPI/battery/EDR. |
| S11 | OBSERVED | `docs/metis-2.0/PLAN.md:171-176` | CI can run suites/builds but never real credentials; managed Windows 11 laptop owns ST-1-W with OneDrive placeholders, HK-W, census, GPU/DPI/battery, and EDR interaction. |
| S12 | OBSERVED | `docs/metis-2.0/PLAN.md:180-193` | HK-W, ST-1-W, and census budgets are process-tree, storage-stress, CPU, and memory measurements. |
| S13 | OBSERVED | `docs/metis-2.0/PLAN.md:195-214` | Release acceptance includes HK-W, ST-1-W, RV, census/resource gates, and Windows parity. |
| S14 | ASSUMED / UNKNOWN | `docs/metis-2.0/ARCHITECTURE.md:235-245` | Windows libuv child-job behavior is assumed and Windows utility-process reaping is unknown until HK-W. |
| S15 | OBSERVED / PROPOSED | `docs/metis-2.0/ARCHITECTURE.md:249-268` | Reveal entry points are activate/reopen, second-instance, tray Show, global hotkey, notification click, and command wake; explicit reopen reveal is proposed. |
| S16 | OBSERVED / UNKNOWN | `docs/metis-2.0/ARCHITECTURE.md:290-291` | Windows placeholder detection cost is unknown until measured on the managed Windows laptop; ST-1-W runs on the Windows laptop with OneDrive placeholders. |
| S17 | OBSERVED | `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-capabilities-dispatch-attempt.md:1-101` | Owner-approved `gh workflow run windows-qa.yml --ref main -f probe=capabilities` attempts exited 1 here because `api.github.com` was unreachable; this is blocker evidence, not successful CI output. |
| S18 | BLOCKED_EXTERNAL | `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-host-configured-blocker.md:1-39` | The required `HOST_CONFIGURED` record cannot be produced from this macOS worktree or from CI; it must come from the physical Windows laptop lane. |
| S19 | OBSERVED | GitHub Docs "Choosing the runner for a job", lines 78-107, retrieved 2026-09-28, https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job | GitHub-hosted jobs use fresh runner images; private-repo `windows-latest` is a standard x64 VM with 2 CPU, 8 GB RAM, and 14 GB SSD; GPU-powered machines are described as a separate larger-runner feature. |
| S20 | OBSERVED | GitHub Docs "Larger runners reference", lines 60-64, retrieved 2026-09-28, https://docs.github.com/en/actions/reference/runners/larger-runners | GPU larger runners are a separate class with a listed GPU configuration. |

## Gate Matrix

| Gate | `windows-latest` classification | Probe output / evidence | Physical Windows laptop assignment |
|---|---|---|---|
| Install/launch | RUNS | OBSERVED: S8 and S9 run Windows installer build/install/launch lanes on `windows-latest`. OBSERVED: S10 says this proves shipped installer install and installed app start on a clean host. | Not required for basic install/launch. The laptop may repeat install/launch only to bind laptop-only gates to the same packaged bytes. |
| HK-W | CANNOT | BLOCKED_EXTERNAL: no successful `windows-qa-capabilities` artifact output is checked in (S1, S17). OBSERVED: S10 says hosted packaged smoke does not prove hard-kill supervision. OBSERVED: S12 defines HK-W as zero owned processes after main SIGKILL. ASSUMED/UNKNOWN: S14 says Windows child-job and utility-process behavior remains unverified until HK-W. LEAD_ACTION: file the successful capabilities artifact output/SHA or retain this row as externally blocked. | ASSIGNED. Run HK-W on the physical Windows laptop; record main kill, owned process tree at 5 seconds, sidecar descendants, utility-process behavior, and any `supervise.exe` decision. |
| RV-W | PARTIAL | OBSERVED: S8/S9 cover packaged launch only. BLOCKED_EXTERNAL: no successful `windows-qa-capabilities` artifact output is checked in for reveal-related desktop entry points (S1, S17). OBSERVED/PROPOSED: S15 lists product reveal routes that require user entry points; hosted launch does not exercise every route. LEAD_ACTION: file the successful capabilities artifact output/SHA if any runner-side reveal probe is added; otherwise keep RV-W assigned to the laptop lane. | ASSIGNED. Run RV-W on the physical Windows laptop for explicit reopen, second-instance, tray Show, global hotkey reveal, notification click, command wake, and park-state transitions. |
| ST-1-W | CANNOT | BLOCKED_EXTERNAL: no successful `windows-qa-capabilities` artifact output is checked in for OneDrive placeholder stress (S1, S17). OBSERVED: S11 says CI never uses real credentials and the managed Windows laptop owns ST-1-W with OneDrive placeholders. OBSERVED/UNKNOWN: S16 says Windows placeholder detection cost is unknown until laptop measurement. LEAD_ACTION: file the physical Windows laptop `HOST_CONFIGURED`/ST-1-W output under `docs/metis-2.0/evidence/records/`. | ASSIGNED. Run ST-1-W on the physical Windows laptop with OneDrive placeholders; record `[dataless] probed {files, ms}`, placeholder attributes, settings-write timing, `dns.lookup` timing, EDR/language-mode notes, and timeout behavior. |
| Tray | PARTIAL | BLOCKED_EXTERNAL: S4 is workflow design, not successful runner output; no `tray.notify_icon_action` artifact line is checked in (S1, S4, S17). DERIVED from S4 and S15: if the future probe passes, it proves at most tray API availability, not product tray Show/Hide, Settings, Quit, or diagnostics behavior. LEAD_ACTION: file the successful `windows-qa-capabilities` artifact output/SHA showing `tray.notify_icon_action`. | ASSIGNED. Validate packaged product tray Show/Hide, Settings, Quit, and diagnostics on the physical Windows laptop. |
| Global hotkey | PARTIAL | BLOCKED_EXTERNAL: S5 is workflow design, not successful runner output; no `global_hotkey.register_action` artifact line is checked in (S1, S5, S17). DERIVED from S5 and S15: if the future probe passes, registration is not equivalent to product accelerator routing or reveal from every park state. LEAD_ACTION: file the successful `windows-qa-capabilities` artifact output/SHA showing `global_hotkey.register_action`. | ASSIGNED. Validate packaged product global hotkey registration and reveal behavior on the physical Windows laptop with foreground-app context recorded without personal data. |
| UIA/SendInput adapters | PARTIAL | BLOCKED_EXTERNAL: S2/S3 are workflow design, not successful runner output; no `uia.invoke_action` or `sendinput.key_action` artifact lines are checked in (S1-S3, S17). DERIVED: even if the future synthetic WinForms probes pass, they do not prove product adapters against representative desktop targets. LEAD_ACTION: file the successful `windows-qa-capabilities` artifact output/SHA showing `uia.invoke_action` and `sendinput.key_action`. | ASSIGNED. Run UIA/SendInput adapters on the physical Windows laptop against approved synthetic desktop targets and record readback. |
| Audio capture | CANNOT | BLOCKED_EXTERNAL: S6 is workflow design, not successful runner output; no `audio.default_capture_endpoint_action` artifact line is checked in (S1, S6, S17). DERIVED: endpoint state is not microphone/system-audio capture. UNKNOWN: no successful checked-in probe output establishes a usable capture path on standard `windows-latest`. LEAD_ACTION: file the successful `windows-qa-capabilities` artifact output/SHA showing `audio.default_capture_endpoint_action`. | ASSIGNED. Run microphone/system-audio capture on the physical Windows laptop with synthetic audio, explicit endpoint state, permission state, and no personal data. |
| GPU | CANNOT | BLOCKED_EXTERNAL: S7 is workflow design, not successful runner output; no `gpu.dxdiag_action` artifact line is checked in (S1, S7, S17). OBSERVED: S19 describes standard private-repo `windows-latest` as CPU/RAM/storage/architecture VM capacity and separates GPU-powered machines. OBSERVED: S20 lists GPU under larger runners. OBSERVED: S10 says GPU/DPI/battery/EDR stay outside hosted packaged smoke. LEAD_ACTION: file the successful `windows-qa-capabilities` artifact output/SHA showing `gpu.dxdiag_action`. | ASSIGNED. Run GPU/backend/DPI/battery checks on the physical Windows laptop and record actual GPU/backend, driver, power state, display scale, and fallback behavior. |
| Census | PARTIAL | OBSERVED: S8/S10 prove a hosted clean-quit survivor census and non-vacuous process census. OBSERVED: S11/S12 assign managed Windows laptop resource census, CPU, memory, GPU/DPI/battery, and EDR interaction. | ASSIGNED for resource census. Keep hosted clean-quit survivor census on `windows-latest`; run representative CPU/memory/resource census, EDR, GPU/DPI/battery, and profile-context census on the physical Windows laptop. |

## Physical Windows Laptop Lane

Every `PARTIAL` or `CANNOT` row above is assigned to the physical Windows laptop lane.

| Gate | Required laptop evidence |
|---|---|
| HK-W | LIVE_VERIFIED or MEASURED process-tree output on packaged bytes: main kill, descendants/sidecars, owned survivors at 5 seconds, utility-process behavior, and `supervise.exe` decision if needed. |
| RV-W | LIVE_VERIFIED reveal transcript/screenshots/logs for explicit reopen, second-instance, tray Show, global hotkey, notification click, command wake, and park-state transitions. |
| ST-1-W | MEASURED `[dataless] probed {files, ms}` output, OneDrive placeholder attributes, settings-write timing, `dns.lookup` timing, EDR/language-mode notes, and timeout behavior. |
| Tray | LIVE_VERIFIED tray Show/Hide, Settings, Quit, and diagnostics behavior on the packaged app. |
| Global hotkey | LIVE_VERIFIED registration plus reveal from relevant park states, with focused foreground-app context recorded without personal data. |
| UIA/SendInput adapters | LIVE_VERIFIED adapter actions plus readback on approved synthetic desktop targets. |
| Audio capture | LIVE_VERIFIED microphone/system-audio endpoint, permission state, and synthetic audio capture result. |
| GPU | MEASURED backend/GPU availability, fallback path, driver/power state, DPI, and battery/power context. |
| Census | MEASURED resource census on a representative physical Windows host, including CPU, memory, helper processes, EDR interaction, GPU/DPI/battery context, and packaged artifact SHA256. |

## Acceptance Checklist

- [x] Matrix includes install/launch, HK-W, RV-W, ST-1-W, tray, global hotkey, UIA/SendInput adapters, audio capture, GPU, and census.
- [x] Each matrix row records `RUNS`, `PARTIAL`, or `CANNOT` for `windows-latest`.
- [x] Each matrix row records exact observed probe output or exact `BLOCKED_EXTERNAL` probe-output dependency with source IDs.
- [x] Every `PARTIAL` or `CANNOT` row is assigned to the physical Windows laptop lane.
- [x] Claims are labelled `OBSERVED`, `DERIVED`, `ASSUMED`, `UNKNOWN`, or `BLOCKED_EXTERNAL` and mapped to exact file lines, command-output records, or URLs with retrieval dates.
- [x] Lead-only actions are listed as `LEAD_ACTION` lines instead of being run or faked from this worktree.
- [x] No edit is made to `docs/metis-2.0/ledger/tickets.json`, generated ledger ticket files, or `_relay/`.

## Verification Notes

- OBSERVED: D-28 forbids repository tests, scripts, and app runs on this Mac; this worktree did not run them.
- OBSERVED: The ticket's verification command needs GitHub account/network access and a workflow present on `main`; S17 records failed attempts from this environment because `api.github.com` was unreachable.
- BLOCKED_EXTERNAL: Successful GitHub run logs and CI artifacts must be filed by the lead using the `LEAD_ACTION` steps above.
- BLOCKED_EXTERNAL: The required `HOST_CONFIGURED` evidence record must be filed by the lead from the physical Windows laptop lane using the `LEAD_ACTION` step above.
- OBSERVED: Direct static TypeScript checks recorded in `docs/metis-2.0/evidence/raw/M2-0196/M2-0196-tsc-checks.md:7-99` from the public checkout: `tsconfig.node.json` passed, `tsconfig.web.json` passed, and `tsconfig.tests.json` failed with 26 diagnostics. The evidence record states that `origin/m2/integration:scripts/check-test-types.mjs:50-94` set the checked source ratchet baseline to 24, so the test-type bar is not met.
