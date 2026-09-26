# Métis r11 — test repair and local execution bridge v2

**For Tony's existing checkout at `$HOME/metis-r11-work`. Do not run `prepare` again.**

The original 16-file delta has a confirmed media contract regression. The playback helper was refactored, but an existing native test still asserted two old source-code shapes. The paired-media function also sought audio before attempting video, instead of preserving both starts before either seek. v2 fixes the implementation and replaces those two spelling-based checks with stronger runtime-order assertions. No test is skipped and no gate is relaxed.

This is an actual two-file application repair plus improvements to the local runner. It is **not the full Métis 2.0 upgrade or a release**. It does not claim that these were the only failures in your local `06.log`, whose contents were not supplied.

## Continue your existing checkout

Your reported GitHub account permission, Python 3.14.6 and Node 22.22.3 need no reconfiguration for these instructions. Unzip this folder into Downloads, separate from the original bridge and the existing workspace.

```bash
cd "$HOME/Downloads/Metis-Local-Execution-Bridge-v2" &&
python3 metis_continue.py repair --workspace "$HOME/metis-r11-work" &&
python3 metis_continue.py publish --workspace "$HOME/metis-r11-work"
```

`repair` performs no network calls, resets, clones, commits, pushes or releases. It accepts only the original uncommitted bridge session at the pinned commit and exact approved old/new source bytes. It preserves the repository, branch, installed dependencies, original logs and all unrelated workspace files. An unexpected edit, staged work, wrong origin, changed HEAD or source symlink is refused without being overwritten. It backs up the two changed files and prior session under `repair-<timestamp>` before replacing them. It updates the session's manifest identity so the new strict publisher accepts the repair. All old source-gate results are invalidated.

Use only the **v2 runner** after repair. The original runner's old hashes will correctly reject the new source bytes.

`publish` re-runs all 11 original source gates, including `npm ci` (which refreshes dependencies), typecheck, build, the full `npm test` command, Operator checks and dependency audit. It does not reuse the old five successful results. It stops on any failing gate or source drift. Only a complete successful run can commit the 16 declared files, push a new review branch without force and open a draft PR. No merge, release-branch change, version bump, tag, service deployment, permission change or signing bypass occurs.

To run the same gates without a remote write, use `verify` instead of `publish`.

## Read a failure without rerunning tests

```bash
python3 metis_continue.py diagnose --workspace "$HOME/metis-r11-work"
```

This reads the latest verification log locally and writes `test-failure-summary.txt` next to it. It does not require GitHub authentication, inspect the keyring or `.env`, collect the repository, upload anything, or run a command from the log. It strips terminal controls and masks common credential forms. It shows a bounded excerpt and marks clipping; **review it for personal/customer content before sharing**. Redaction is not a guarantee that the underlying log contains no sensitive text.

On a future failed gate, v2 automatically produces the same excerpt. `results.json` is written incrementally: passed, failed/timed-out, running and not-run steps remain distinct. A crash or transform error cannot become a fabricated complete pass. Source drift after testing also prevents publication.

The existing failure log you reported remains untouched:

```text
$HOME/metis-r11-work/verification-20260924T083659754658Z/06.log
```

## Actual verification performed here

- 142 isolated source regression tests passed. These execute the TypeScript implementation; external transports, stores and media objects are explicit fixtures. They are not full repository CI.
- The 9 new playback-order cases were also run against v1: 6 failed and 3 passed. All 9 pass after the repair.
- 47 bridge tests passed: the original 19 subprocess-contract tests and 28 added repair, evidence and locking checks. Sixteen repair tests exercise real temporary Git repositories. Network/source-gate subprocesses are explicit simulations where used.
- 12 guarded patch-application tests passed using temporary Git fixtures.
- 17 scoped TypeScript/TSX files syntax-checked with zero diagnostics. This is not full TypeScript project checking.
- Full repository dependency installation, Vitest, build, native packaging, live services and public release were **not** run here.

The local verification environment is Linux, Node 22.16.0, TypeScript 5.8.3, Python 3.13.5 and Git 2.47.3. Your actual source gates still require the repository's Node 22.22.3 and exact lockfile environment. Windows-specific runner branches have not been exercised on Windows.

Evidence lives in `evidence/v2/` and `evidence/current-status.json`; the original evidence is retained as history. The 66-task plan remains in `delta/plan-status.json`. No root task is closed just by this repair. The separate r11 product contract and all native/live/privacy/security gates remain required.

## Reproduce the available local checks

```bash
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 -m unittest discover -s delta/tests -p 'test_*.py' -v
node delta/tools/verify.cjs
node delta/tools/syntax-check.cjs
```

The Node checks need a resolvable TypeScript installation, or `TYPESCRIPT_PATH` pointing to that module. The source checks do not pretend that a fixture-based run is a native application pass.

## Remaining execution boundary

A fresh branch-creation attempt from the chat connector still returned GitHub's 403. No branch or PR was created by this chat, and no subagents were spawned. Your local GitHub CLI authentication remains separate and is used only by the runner on your Mac. Additional product engineering must happen in an actually authorized coding workspace with real source/CI/native evidence, following the full r11 contract; do not weaken this scoped publisher to accept arbitrary new edits.

Integrity manifests detect accidental modification relative to this bundle, not independent signatures or external attestations. The workspace lock coordinates bridge processes only: keep a single writer on this checkout while applying/verifying/publishing.
