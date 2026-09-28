# M2-0196 windows-qa capability probe design record

Recorded: 2026-09-28.

This record documents the worktree change that expands `.github/workflows/windows-qa.yml` from inventory-only checks into action-level capability probes. It is not the required successful owner-approved GitHub dispatch output. The successful dispatch still needs an authorized GitHub Actions run on `main`.

## Source

Commit at inspection time:

```text
589e1aa2e0af1097db2c1c600b29eff3b01c384e
```

Worktree file:

```text
.github/workflows/windows-qa.yml
```

## OBSERVED workflow capabilities now exercised

- OBSERVED: `.github/workflows/windows-qa.yml:47-58` writes run identity, runner OS/arch, image version, interactive-user state, and process session ID into `capabilities.txt`.
- OBSERVED: `.github/workflows/windows-qa.yml:75-86` records video controllers, sound devices, and Explorer process count.
- OBSERVED: `.github/workflows/windows-qa.yml:88-129` creates a synthetic WinForms button, finds it through UIAutomation, invokes it, and writes `uia.invoke_action`.
- OBSERVED: `.github/workflows/windows-qa.yml:131-181` declares `SendInput`, focuses a synthetic WinForms text box, sends an `A` key down/up pair, and writes `sendinput.key_action`.
- OBSERVED: `.github/workflows/windows-qa.yml:183-194` creates and disposes a `NotifyIcon`, writing `tray.notify_icon_action`.
- OBSERVED: `.github/workflows/windows-qa.yml:196-213` calls `RegisterHotKey`/`UnregisterHotKey`, writing `global_hotkey.register_action`.
- OBSERVED: `.github/workflows/windows-qa.yml:215-240` queries the default capture endpoint through Core Audio COM, writing `audio.default_capture_endpoint_action`.
- OBSERVED: `.github/workflows/windows-qa.yml:242-254` runs `dxdiag`, extracts card and feature-level text, and writes `gpu.dxdiag_action`.
- OBSERVED: `.github/workflows/windows-qa.yml:259-262` writes the `capabilities.txt` SHA256 into `SHA256SUMS.txt`.
- OBSERVED: `.github/workflows/windows-qa.yml:264-268` uploads `windows-qa-capabilities`.

## BLOCKED_EXTERNAL required run

Required command, owner-approved in the ticket:

```bash
gh workflow run windows-qa.yml --ref main -f probe=capabilities
```

Read-only follow-up after the run exists:

```bash
gh run view <run-id> --repo mysticalsin/Metis-2.0-Program --log
```

Required checked-in output after the external run: redacted capability output plus the `windows-qa-capabilities` artifact SHA256 under `docs/metis-2.0/evidence/records/`.

## Result

Result: PARTIAL.

Reason: the worktree now defines action-level probes for the gate capabilities being classified, but this record is not a substitute for the required successful GitHub run output and artifact SHA256.
