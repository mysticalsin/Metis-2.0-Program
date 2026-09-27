# M2-0196 capabilities dispatch attempt

Recorded: 2026-09-27

This artifact captures the owner-approved capabilities-dispatch command requested by M2-0196. It did not dispatch a workflow from this environment because GitHub was unreachable here; therefore it is blocker evidence only, not the required capability-probe output.

Update on 2026-09-27: this branch now adds `.github/workflows/windows-qa.yml`, so the missing-workflow part of the blocker is addressed in the worktree. A successful `--ref main` dispatch still cannot be recorded until that workflow exists on `main` and a GitHub-authorized runner run is available.

## Command

```bash
gh workflow run windows-qa.yml --ref main -f probe=capabilities
```

Exit code: 1

Output:

```text
error connecting to api.github.com
check your internet connection or https://githubstatus.com
```

## Read-only workflow presence checks

Commands:

```bash
git show origin/m2/integration:.github/workflows/windows-qa.yml
git show origin/main:.github/workflows/windows-qa.yml
```

Exit code for each command: 128

Output:

```text
fatal: path '.github/workflows/windows-qa.yml' does not exist in 'origin/m2/integration'
fatal: path '.github/workflows/windows-qa.yml' does not exist in 'origin/main'
```

## Required next read-only step

After this branch lands and a reviewer with GitHub access confirms `windows-qa.yml` exists on `main`, run:

```bash
gh workflow run windows-qa.yml --ref main -f probe=capabilities
```

Then capture the redacted probe output with:

```bash
gh run view <run-id> --repo mysticalsin/AskToto-Mantu --log
```

Check the redacted output into `docs/metis-2.0/evidence/records/` and cite it from `docs/metis-2.0/runbooks/windows-lanes.md`.
