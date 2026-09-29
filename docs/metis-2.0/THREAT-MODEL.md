# Metis 2.0 Threat Model

| Field | Value |
|---|---|
| Ticket | M2-0016 |
| Evidence level | DESIGNED |

## Trust Boundaries

| ID | Boundary | Rule |
|---|---|---|
| TB1 | Renderer to main IPC | Renderer input is untrusted; main owns policy, filesystem, network and process authority. |
| TB2 | Main to Operator broker | Broker credentials are session-scoped and server-issued; no organization speech token lives on the device. |
| TB3 | Local model and ASR sidecars | Sidecars are child capabilities owned by the app lifecycle; model output is data, not authority. |
| TB4 | Cloud provider routes | Routes fail closed until transport, logging, cache and retention claims are verified. |
| TB5 | Release artifacts | Unsigned or QA artifacts are not customer-release evidence. |
| TB6 | Development and test execution to user data | Repository tests, scripts and app launches must not run on the owner Mac against live profiles or cloud-file folders; CI-only execution preserves the user-data boundary. |

## Sidecar Ownership

- The Electron main process owns local LLM, ASR, ffmpeg and helper sidecars.
- Exit, relaunch, fatal-error and packaged-smoke paths must route through one ordered sidecar shutdown boundary.
- A sidecar surviving the owning main process is a failed ownership boundary, not a successful background service.
- Windows ownership evidence and macOS ownership evidence are separate release-lane facts; unsupported hosted-runner rows are BLOCKED_EXTERNAL with the exact unblock step.

## Added M2-0016 Risk

| ID | Threat | Control | Evidence status |
|---|---|---|---|
| TB6-R1 | A local dev/test command reads or mutates real user data. | Run repository tests and app execution only in GitHub Actions; local verification is limited to allowed TypeScript compile checks. | DESIGNED |
| TB6-R2 | Sidecars outlive the desktop app and consume resources or stale credentials. | Main-owned registry, ordered shutdown and platform-specific survivor proof. | DESIGNED |

