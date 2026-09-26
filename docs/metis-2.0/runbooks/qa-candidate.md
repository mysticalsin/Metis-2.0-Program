# Runbook: the QA candidate lane (M2-0187, ADR-022)

Program document — private. Never copy this file, or excerpts naming secrets or account handling, into
the public `AskToto-Mantu` repository. Written by the M2-0187 implementer; committed by the lead.

## 1. What the lane guarantees

`qa-candidate.yml` builds every shipped macOS/Windows installer, plus the macOS QA-identity variant, once
from one named `main` commit, in one run (INV-1/INV-2). It hashes each installer where it was built and
writes one `provenance.json` recording every asset's sha256, the commit, the run, the runner image, and
the Node/Electron/electron-builder versions and builder-config hashes (INV-3). Every consumer — the
in-run smoke jobs, host gates and `promote-candidate.yml` — verifies bytes by sha256 against that record
before doing anything with them. `promote-candidate.yml` never builds: it downloads one successful
candidate run's artifacts, proves every byte against its provenance and against at least one passing,
bound evidence record (INV-5), and publishes the exact same bytes as an owner-channel prerelease on the
separate `Metis-Releases` feed — never Latest, no tag in this repository (INV-4/INV-6). macOS candidates
are signed with a stable QA identity once B-05 is done, and ad-hoc until then; Windows candidates are
always unsigned (INV-7). Artifact names: `candidate-mac`, `candidate-mac-qa-identity`, `candidate-win`,
`candidate-provenance` (holds `provenance.json` + `SHA256SUMS.txt`), `build-<variant>` (the per-variant
build record consumed only by the `provenance` job).

## 2. One-time owner setup (B-05)

- Run `scripts/qa/make-qa-identity.sh` in the **owner's primary GitHub account**, where `gh` is already
  signed in. It reads no Métis data, writes only a temporary directory (deleted on exit), and runs no
  other repository code.
- Do **not** sign `gh` in on the QA account: agents have shell access there (M2-0007), and a GitHub
  credential there would let them act as the owner.
- Record the fingerprint the script prints. B-05 closes when a dispatched candidate's `provenance.json`
  shows `signing.mode: "qa-identity"` with that fingerprint on the `mac` build, and both `smoke-mac` jobs
  pass.

## 3. Build a candidate

```
gh workflow run qa-candidate.yml --repo mysticalsin/AskToto-Mantu --ref main \
  -f commit=$(gh api repos/mysticalsin/AskToto-Mantu/commits/main --jq .sha)
gh run list --repo mysticalsin/AskToto-Mantu --workflow qa-candidate.yml --limit 1
```

Read `SHA256SUMS.txt` from the `provenance` job's step summary. If a run fails, dispatch a new run —
never re-run a build job; `GITHUB_RUN_ATTEMPT != 1` refuses on purpose (INV-1).

## 4. Where each form may run (PD-05)

- **Shipping identity** (`candidate-mac`, `candidate-win`): the QA macOS user, the Windows laptop,
  `windows-latest` and CI.
- **QA-identity variant** (`candidate-mac-qa-identity`, `Metis QA.app`): the only unreleased form ever
  allowed on the owner's primary macOS account, and only with written per-run consent. Quit the live
  Métis first — both apps may claim the same fixed local ports (exact ports UNKNOWN; M2-0007 measures it).

## 5. Install by sha256

```
gh run download <run-id> --repo mysticalsin/AskToto-Mantu \
  -n candidate-provenance -n candidate-<variant> -D candidate-<run-id>
cd candidate-<run-id> && shasum -a 256 -c <(grep <installer-name> SHA256SUMS.txt)
```

Then `ditto -x -k <name>.zip <dest>` or drag the app from the mounted `.dmg`. First launch needs
System Settings → Privacy & Security → Open Anyway. TCC grants follow M2-0007's `tcc-grants.md`.

## 6. Evidence for promotion

- Host gates write M2-0002 evidence records carrying `artifact_sha256` and `build_run_id`.
- Build the promotion input with:
  `jq -c 'select(.build_run_id == <run-id>)' docs/metis-2.0/evidence/records/*.jsonl > evidence-<run-id>.jsonl`
- Promotion accepts only PASS records bound to that run and its bytes (INV-5). Which gates a given
  release requires is that release ticket's own policy; Opus validation checks the list.

## 7. Dry run (agents may run this only with the owner's explicit approval)

```
gh workflow run promote-candidate.yml --repo mysticalsin/AskToto-Mantu --ref main \
  -f candidate_run_id=<run-id> -F evidence=@evidence-<run-id>.jsonl
```

Proves download-by-hash, staging, upload to a draft on `Metis-Releases`, and a digest match against
GitHub's own report — then deletes the draft. No tag is created in `AskToto-Mantu`.

## 8. Publish (owner only)

Add `-f publish=true -f confirm_version=<version>` to the same dispatch. Afterwards, confirm on
`Metis-Releases` that the release is a prerelease, is **not** Latest, and holds exactly the four
installers plus `SHA256SUMS.txt` and `provenance.json` — nothing else.

## 9. Failures and their fixes

| Symptom | Fix |
|---|---|
| `main is at … and the named commit differs` | Dispatch again naming main's current commit |
| `A candidate is built once … dispatch a new run` | Re-running a build job is refused on purpose; dispatch a fresh run |
| Size gate failed (`check:release`) | An installer exceeds GitHub's per-asset limit — shrink it, don't bypass the gate |
| Evidence refused | The error names the exact line and cause (bad ticket id, wrong run, unknown hash, not PASS) |
| `already has a release/tag named v<version>` | Versions are never reused; this candidate cannot be promoted under that version string |
| Feed token rejected | The owner refreshes `secrets.GH_TOKEN` with contents:write on `Metis-Releases` |
| A draft is left after a cancelled promotion run | Delete it only after confirming via `gh api` that `draft: true` |

## 10. Rollback

Delete `.github/workflows/qa-candidate.yml` and `.github/workflows/promote-candidate.yml`. `release.yml`
is never touched by this lane and needs no change. The owner can return an already-published prerelease
to draft on `Metis-Releases` directly.

## Status labels (for the ledger)

- B-05 (QA signing identity): BLOCKED_EXTERNAL until the owner runs `make-qa-identity.sh`.
- TCC persistence across two QA-signed candidates: ASSUMED until M2-0007 checks it on `qa-mac`.
- Publication itself: BLOCKED_EXTERNAL, owner-only (`-f publish=true`).
