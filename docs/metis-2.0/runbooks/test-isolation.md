# Test isolation runbook

Ticket M2-0481 (closes M2-0190 acceptance 3). Status: DESIGNED, **incomplete**. The public-repo files this runbook must mirror could not be read in this session (see "Unread sources"). Nothing was run (D-28).

Labels: OBSERVED (read, source given), DERIVED, ASSUMED, UNKNOWN.

## Current policy

- OBSERVED (docs/metis-2.0/DECISIONS.md:154): D-28, answered 2026-09-26 by the owner: CI only. No repository test, script or app runs on any Mac, including the owner's account. Static compilation (`tsc --noEmit`) is allowed because it executes no repository code.
- OBSERVED (docs/metis-2.0/DECISIONS.md:42): OD-26, 2026-09-29: GitHub-hosted runners (macos-latest, windows-latest) count as the live host for LIVE_VERIFIED and HOST_CONFIGURED evidence, since D-9 dropped the dedicated QA Mac and D-28 bars the owner's Mac.
- OBSERVED (docs/metis-2.0/DECISIONS.md:135): D-9 was answered "CI runners"; there is no QA user on the owner's Mac.
- OBSERVED (docs/metis-2.0/DECISIONS.md:64): PD-04 requires OS-level isolation in addition to the vitest tripwire.

## Run order

1. OBSERVED (docs/metis-2.0/ledger/tickets/M2-0001.md:61, M2-0190.md:49): the first run of any suite is in CI on macOS and Ubuntu runners with the honeypot directory `~/Library/CloudStorage/OneDrive-Honeypot`; a touch fails the job.
2. OBSERVED (OD-26 above): hosted runners (macos-latest, windows-latest) are the live host for packaged-app and host evidence, installing the candidate by run id and sha256 on a fresh profile.
3. OBSERVED (D-28): no owner-Mac runs. The QA-account step is superseded by D-9 and OD-26. Note the mismatch: M2-0190's acceptance text (docs/metis-2.0/ledger/tickets.json:11898) still reads "CI (macOS and Ubuntu with the honeypot), then the QA account, then the owner's account under the sandbox profile"; this runbook's order governs.
4. The sandbox profile below applies only if the owner later lifts D-28. Until then it is a design, not a procedure.

## Sandbox profile (design from the ticket, not from the file)

OBSERVED (docs/metis-2.0/ledger/tickets/M2-0190.md:48): deny read and write on these paths, and agents never disable the sandbox for test commands:

- `~/Library/CloudStorage`
- the Métis userData directory
- `~/Library/Keychains`
- `~/.wrangler`

OBSERVED (M2-0190.md:47): tests that invoke wrangler run with Cloudflare credentials unset, a sandboxed config directory and `--local` only.
OBSERVED (M2-0190.md:46): swift test, license-server node --test and scripts/qa run with HOME, TMPDIR and userData pointed at a per-run sandbox, each with a canary proving no access to `~/Library/CloudStorage`.

## Canary job recorded in the repo

OBSERVED (docs/metis-2.0/ledger/tickets.json:11927-11932): the one `isolation-canary` job name recorded here is "owner-account.sb denies real user state (hermetic)", green on macos-latest, run 36634756903, commit 761276bc (HOST_CONFIGURED under OD-26, recorded 2026-09-29 by the lead). DERIVED: it exercises `scripts/hermetic/owner-account.sb`.

## Unread sources (BLOCKING: acceptance 1 unmet)

The brief requires citing `scripts/hermetic/owner-account.sb`, `scripts/hermetic/run-under-owner-sandbox.sh` and the `isolation-canary.yml` job names as merged on origin/m2/integration. In the re-dispatch, `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:<path>` was again refused (approval required, with and without a pipe), and a direct Read of that clone's working tree found no such file. The files are not in this worktree.

- UNKNOWN: the exact rules, variable names and flags in `owner-account.sb` and `run-under-owner-sandbox.sh`.
- UNKNOWN: the job names and checks in `isolation-canary.yml`. Only its existence is OBSERVED (docs/metis-2.0/runbooks/integration.md:239).

LEAD_ACTION: in a clone of the public repo (metis-operator-ux), run `git show origin/m2/integration:scripts/hermetic/owner-account.sb`, the same for `scripts/hermetic/run-under-owner-sandbox.sh` and `.github/workflows/isolation-canary.yml`, then add sections "Profile as merged", "Wrapper" and "Canary jobs" here with file:line citations, or re-dispatch M2-0481 with that permission granted.
