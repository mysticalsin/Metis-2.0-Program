# M2-0196 capabilities dispatch attempt

Recorded: 2026-09-27. Re-attempted: 2026-09-27 and 2026-09-28.

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

Re-attempt command:

```bash
gh workflow run windows-qa.yml --ref main -f probe=capabilities
```

Re-attempt exit code: 1

Re-attempt output:

```text
error connecting to api.github.com
check your internet connection or https://githubstatus.com
```

Second re-attempt command:

```bash
gh workflow run windows-qa.yml --ref main -f probe=capabilities
```

Second re-attempt exit code: 1

Second re-attempt output:

```text
error connecting to api.github.com
check your internet connection or https://githubstatus.com
```

Read-only repo metadata command:

```bash
gh repo view --json nameWithOwner,url
```

Read-only repo metadata exit code: 1

Read-only repo metadata output:

```text
error connecting to api.github.com
check your internet connection or https://githubstatus.com
```

Third re-attempt command:

```bash
gh workflow run windows-qa.yml --ref main -f probe=capabilities
```

Third re-attempt exit code: 1

Third re-attempt output:

```text
error connecting to api.github.com
check your internet connection or https://githubstatus.com
```

Third re-attempt read-only repo metadata command:

```bash
gh repo view --json nameWithOwner,url,defaultBranchRef
```

Third re-attempt read-only repo metadata exit code: 1

Third re-attempt read-only repo metadata output:

```text
error connecting to api.github.com
check your internet connection or https://githubstatus.com
```

Fourth re-attempt command:

```bash
gh workflow run windows-qa.yml --ref main -f probe=capabilities
```

Fourth re-attempt exit code: 1

Fourth re-attempt output:

```text
error connecting to api.github.com
check your internet connection or https://githubstatus.com
```

Fourth re-attempt read-only repo metadata command:

```bash
gh repo view --json nameWithOwner,url,defaultBranchRef
```

Fourth re-attempt read-only repo metadata exit code: 1

Fourth re-attempt read-only repo metadata output:

```text
error connecting to api.github.com
check your internet connection or https://githubstatus.com
```

Local artifact search command:

```bash
find . -type f \( -name '*capabilities*' -o -name '*HOST_CONFIGURED*' -o -name '*host-configured*' -o -name '*windows-qa*' \) 2>/dev/null | sort | sed -n '1,240p'
```

Local artifact search exit code: 0

Local artifact search output:

```text
./.github/workflows/windows-qa.yml
./docs/metis-2.0/evidence/records/M2-0196-capabilities-dispatch-attempt.md
./docs/metis-2.0/evidence/records/M2-0196-host-configured-blocker.md
./docs/metis-2.0/evidence/records/M2-0196-windows-qa-probe-design.md
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
gh run view <run-id> --repo mysticalsin/Metis-2.0-Program --log
```

Check the redacted output into `docs/metis-2.0/evidence/records/` and cite it from `docs/metis-2.0/runbooks/windows-lanes.md`.
