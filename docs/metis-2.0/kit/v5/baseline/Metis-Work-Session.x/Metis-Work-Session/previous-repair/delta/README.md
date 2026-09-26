> Historical v1 implementation record. For the v2 media repair and current evidence, read `../REPAIR-REPORT.md` and `../evidence/current-status.json`.

# Métis 2.0 r11 — source implementation delta

**Actual scoped code changes and test evidence. Not a completed 2.0 app, installer, deployment, or release.**

This bundle continues the supplied `Metis-2.0-Codex-Fable-Hindsight-r11 (1).zip`. That original kit remains the full product contract. This bundle does not replace or mark its 66 tasks complete.

## What was implemented

Six production files are changed: lossless wake-token stripping; exception-safe optional onboarding playback; a read-only, bounded, fail-closed Cloudflare gateway privacy preflight; vault write/rotation ordering; exact token-counter validation; and preserved Ask identity/cancellation in the non-streaming Operator path. Repository-native regression tests and the existing gateway-response fixtures accompany the changes. The patch changes 16 files in total.

**Target:** `mysticalsin/AskToto-Mantu` at `2bf21f1ceefe117838325342574b57852e5cadcb`. The package version remains **1.9.6**. Recent mainline fixes are preserved. This is not the unmerged/conflicted PR #194 branch.

GitHub branch creation was attempted and returned **403: Resource not accessible by integration**. There is no pushed branch or PR for these changes. No callable Codex/Fable worker was available, and no independent agent review was performed.

## Read first

- `IMPLEMENTATION-REPORT.md`: changes, exact executed tests, rollout risks, and remaining blockers.
- `manifest.json`: pinned source and output hashes for every changed file.
- `plan-status.json`: all 66 original tasks, with this session's partial contributions kept distinct from completion.
- `RESUME-CODEX-FABLE.md`: continuation instructions for a genuinely write-enabled coding workspace.
- `patches/metis-r11-scoped.patch`: actual unified patch.
- `baseline/`: scoped original files, not a full checkout.
- `overlay/`: replacement/new files, plus one unchanged reference component. Do not copy this directory blindly over a repository.
- `tests/` and `evidence/`: reproducible isolated checks and captured output.

## Check and apply

Unpack this bundle **outside** the repository. Use a clean, exclusively owned checkout at the pinned commit. Changes must be reviewed before deployment, especially the gateway's stricter readiness contract.

```bash
python3 /path/to/this-bundle/tools/apply.py --repo /path/to/AskToto-Mantu --check
python3 /path/to/this-bundle/tools/apply.py --repo /path/to/AskToto-Mantu --apply
```

The tool refuses a different commit, modified or untracked files, symlinks in target paths, new-file collisions, source-hash differences, and tampered patch bytes. It validates the resulting bytes in an isolated shadow fixture before writing to the checkout. Applying does not stage, commit, push, create a branch, reset files, change cloud configuration, or publish a tag. Run it only while no other worker is writing that checkout.

A Windows checkout with line-ending conversion may not match the verified LF bytes. Use an isolated LF checkout; this tool intentionally does not normalize or reset user files automatically. A source advance requires a reviewed rebase, not disabling the guard.

## Re-run the isolated tests

The bundle has no vendored dependencies. It needs Node, TypeScript, Python 3.10+, and Git. The repository's engine target is Node 22.22.3; this session used Node 22.16.0, so its results are not a replacement for the exact repository CI environment.

```bash
# Bundled patched sources. Set TYPESCRIPT_PATH only when TypeScript is not resolvable.
node tools/verify.cjs
python3 tests/test_apply.py
node tools/syntax-check.cjs

# After applying, validate the actual checkout with the same isolated dependency fixtures.
node tools/verify.cjs --repo /path/to/AskToto-Mantu
```

`--repo` allows TypeScript to be resolved from that checkout's existing dependency installation. It does not install dependencies or run full Vitest/Electron builds. The Python tool tests use temporary Git fixtures with their own explicitly substituted test-only base commit, never a counterfeit full checkout of main.

## Release status

**NO-GO for declaring the entire 2.0 upgrade complete.** The broader plan, independent reviews, full repository CI, real Hindsight binding, voice/action journeys, native Mac/Windows QA, deployed service readback, and release signing gates remain incomplete or unverified. Do not turn an isolated pass into a production pass.
