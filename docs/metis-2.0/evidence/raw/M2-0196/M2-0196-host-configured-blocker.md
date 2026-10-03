# M2-0196 HOST_CONFIGURED blocker record

Recorded: 2026-09-28.

This is not the required `HOST_CONFIGURED` evidence record. It records why that required evidence cannot be produced in this worktree without access to the physical Windows laptop lane.

## Required Evidence Shape

Source: `docs/metis-2.0/evidence/SCHEMA.md:115-118`.

- OBSERVED: a `HOST_CONFIGURED` record requires `environment` with `kind` not equal to `ci`.
- OBSERVED: a `HOST_CONFIGURED` record requires a single-line `command`.
- OBSERVED: a `HOST_CONFIGURED` record requires `exit_code`.
- OBSERVED: a `HOST_CONFIGURED` record requires `output.path` under `docs/metis-2.0/` and `output.sha256`.

## Current Worktree Result

- OBSERVED: this session is running in a macOS worktree, not on the physical Windows laptop lane.
- OBSERVED: the owner constraint says no repository tests, scripts, or app execution may run here.
- DERIVED: manufacturing a `HOST_CONFIGURED` record from this macOS worktree or from CI would violate the required non-CI environment field and the owner constraint.
- BLOCKED_EXTERNAL: the physical Windows laptop host-configuration probe has not been run in this worktree, so there is no non-CI command output file and no output sha256 to cite.

## Exact External Step

Run the approved host-configuration probe on the physical Windows laptop lane, using only synthetic/non-PII output, then check in the resulting record and output under `docs/metis-2.0/evidence/records/`.

Minimum required fields for the eventual record:

```text
evidence_level: HOST_CONFIGURED
environment.kind: windows-laptop
environment.host: <non-PII host identifier>
command: <single-line approved host-configuration probe command>
exit_code: 0
output.path: docs/metis-2.0/<physical-lane-output-path>
output.sha256: <sha256 of that output file>
```

Result: BLOCKED_EXTERNAL.
