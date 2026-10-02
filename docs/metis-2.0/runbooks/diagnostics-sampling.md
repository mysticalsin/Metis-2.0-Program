# Diagnostics sampling runbook

Ticket M2-0464 (closes M2-0008 acceptance 8). Status: DESIGNED. No repository script, test, app or workflow was run; every claim below comes from reading files or from the command outputs listed in the source register.

Labels: OBSERVED (read, source given), DERIVED, ASSUMED, UNKNOWN, BLOCKED_EXTERNAL.

## Source register

| ID | Label | Source |
|---|---|---|
| S1 | OBSERVED | `docs/metis-2.0/ledger/tickets/M2-0008.md:37-57` includes this runbook in M2-0008 scope and acceptance 8 requires `/usr/bin/sample <pid> 10` for main and renderer PIDs plus consented `.spin`/`.hang` collection into a content-free bundle. |
| S2 | OBSERVED | `docs/metis-2.0/ledger/tickets/M2-0192.md:42-48` defines the current-build stall sampler: out-of-process sampling, content-free bundles, redaction, retention under `userData/diagnostics/stalls/`, and Windows as no-sampler residual. |
| S3 | OBSERVED | `docs/metis-2.0/ledger/tickets/M2-0194.md:41-46` requires the HEAD matrix to use observability and sampler bundles, attribute every stall, file uncovered mechanisms, and update ranking with OBSERVED/DERIVED labels. |
| S4 | OBSERVED | `docs/metis-2.0/DECISIONS.md:42` says GitHub-hosted `macos-latest` and `windows-latest` count as the live host under OD-26 because D-9 dropped the dedicated QA Mac and D-28 bars the owner's Mac. |
| S5 | OBSERVED | `docs/metis-2.0/DECISIONS.md:140` says D-9 was answered as CI runners: packaged-app QA runs on GitHub `macos-latest` and `windows-latest`; there is no QA user on the owner's Mac. |
| S6 | OBSERVED | `docs/metis-2.0/DECISIONS.md:159` says D-28 is CI only: no repository test, script or app runs on any Mac, including the owner's account; tests run only in GitHub Actions. |
| S7 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:.github/workflows/freeze-repro.yml`, lines 14-21, defines workflow input `mode` with `dry-run` and `hosted-live`. Retrieval date: 2026-10-02. |
| S8 | OBSERVED | Same command as S7, lines 57-62 and 104-120, runs the macOS job on `macos-latest` and calls `run-matrix.sh` with `--hosted-live --qa-host-label macos-latest` when `mode=hosted-live`. Retrieval date: 2026-10-02. |
| S9 | OBSERVED | Same command as S7, lines 121-134, runs M2-0194 macOS attribution with `--hosted-live --candidate-run <id>` and checks `--ticket M2-0194`. Retrieval date: 2026-10-02. |
| S10 | OBSERVED | Same command as S7, lines 135-148 and 231-244, uploads the freeze-repro bundles with `retention-days: 14`. Retrieval date: 2026-10-02. |
| S11 | OBSERVED | Same command as S7, lines 150-230, runs the Windows job on `windows-latest`; M2-0008 can use `--hosted-live --qa-host-label windows-latest`, while M2-0194 Windows attribution is `--dry-run`. Retrieval date: 2026-10-02. |
| S12 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:scripts/qa/freeze-repro/run-matrix.sh`, lines 6-40, documents `--hosted-live`, `--candidate-run`, `--collect-diagnostic-reports`, and the required hosted-live flags. Retrieval date: 2026-10-02. |
| S13 | OBSERVED | Same command as S12, lines 225-243, runs `$SAMPLE_BIN "$pid" 10 -file "$raw"`, redacts `$HOME`, removes the raw sample, and keeps only the redacted sample. Retrieval date: 2026-10-02. |
| S14 | OBSERVED | Same command as S12, lines 264-307, selects renderers by Chromium `--type=renderer`, samples main and renderer PIDs for each row, writes sample files under `samples/`, and appends `sampled`, `main_pid`, `main_sample`, `renderer_attempts`, `renderer_samples`, and `renderers_selected_by` to `matrix.jsonl`. Retrieval date: 2026-10-02. |
| S15 | OBSERVED | Same command as S12, lines 319-341, writes `diagnostic-reports.json`, only copies `.spin`/`.hang` reports when `--collect-diagnostic-reports` is present, copies into `diagnostic-reports/`, and redacts `$HOME`. Retrieval date: 2026-10-02. |
| S16 | OBSERVED | Same command as S12, lines 343-361, restricts DiagnosticReports matches to Metis/AskToto process names, paths, identifiers, or sampled PIDs from `app-pids.txt`. Retrieval date: 2026-10-02. |
| S17 | OBSERVED | Same command as S12, lines 501-521, records content-free host facts only and excludes host name, user name and serial. Retrieval date: 2026-10-02. |
| S18 | OBSERVED | Same command as S12, lines 695-748, writes hosted-runner evidence import metadata, identifies blocked external rows/interrupts, and tells the lead to validate the bundle and file controlled program evidence. Retrieval date: 2026-10-02. |
| S19 | OBSERVED | Same command as S12, lines 843-876, runs macOS hosted-live rows 1-4 automatically, records rows 5 and 9 and network/file-provider interrupts as BLOCKED_EXTERNAL, and runs the process-signal interrupt. Retrieval date: 2026-10-02. |
| S20 | OBSERVED | Same command as S12, lines 878-915, runs Windows hosted-live rows 1 and 4, records row 2 and rows 5/9 as BLOCKED_EXTERNAL, row 3 and process-signal as not applicable, and records sampling unavailable on Windows. Retrieval date: 2026-10-02. |
| S21 | OBSERVED | Same command as S12, lines 993-1119, validates hosted-live options, sets `SAMPLE_BIN=/usr/bin/sample`, restricts hosted-live labels to `macos-latest` or `windows-latest`, rejects profile templates/dataless fixtures in hosted-live, creates `samples/`, `matrix.jsonl`, `interrupt-results.jsonl`, and `app-pids.txt`. Retrieval date: 2026-10-02. |
| S22 | OBSERVED | Same command as S12, lines 1173-1235 and 1288-1306, writes hosted bundle README entries for `samples/`, `diagnostic-reports/`, `diagnostic-reports.json`, `matrix.jsonl`, `external-blockers.json`, evidence import files, and lead-action files. Retrieval date: 2026-10-02. |
| S23 | OBSERVED | `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:scripts/qa/freeze-repro/attribution-bundle.mjs`, lines 1-5 and 55-72, writes attribution excerpts and stall-bundle file names only; it never reads or copies stall-bundle contents. Retrieval date: 2026-10-02. |
| S24 | OBSERVED | `graphify query "M2-0464 diagnostics sampling hosted-live freeze-repro run-matrix sample diagnostic reports content-free bundle"` exited 1 with `graph file not found: /Users/tony/AI-Brain-build/metis-wt-M2-0464/graphify-out/graph.json`, and `graphify-out/wiki/index.md` was absent. Retrieval date: 2026-10-02. |
| S25 | OBSERVED | `docs/metis-2.0/ledger/tickets.json:32019-32041` identifies M2-0462 and says it adds the non-interactive hosted-live mode for `macos-latest`; the same summary says the workflow input and Windows branch are M2-0463 and the runbook is M2-0464. |
| S26 | OBSERVED | `docs/metis-2.0/ledger/tickets.json:32078-32099` identifies M2-0463 and says it wires M2-0462's mode into `freeze-repro.yml` and gives Windows a hosted-live branch for the rows a Windows runner can drive. |
| S27 | OBSERVED | `docs/metis-2.0/ledger/tickets.json:32155-32157` says M2-0464 documents the M2-0462 hosted-live mode and M2-0463 workflow mode input, and its acceptance requires exact flags and outputs as merged in M2-0462 and M2-0463. |

## Procedure: hosted main and renderer sampling

1. OBSERVED (S7, S8): the lead dispatches `.github/workflows/freeze-repro.yml` on `main` with `mode=hosted-live`, macOS artifact sha256, Windows artifact sha256, and either the M2-0008 release inputs or `candidate_run` for M2-0194.
2. OBSERVED (S8, S12, S21): the macOS hosted M2-0008 command shape is:

   ```bash
   bash scripts/qa/freeze-repro/run-matrix.sh \
     --hosted-live \
     --qa-host-label macos-latest \
     --artifact <macos sha256> \
     --build-run-id "$GITHUB_RUN_ID" \
     --app "$RUNNER_TEMP/m2-0008-app/Metis.app" \
     --out out/m2-0008-freeze-repro
   ```

3. OBSERVED (S9, S12, S21): the macOS hosted M2-0194 attribution command shape is:

   ```bash
   bash scripts/qa/freeze-repro/run-matrix.sh \
     --hosted-live \
     --artifact <macos sha256> \
     --build-run-id "$GITHUB_RUN_ID" \
     --candidate-run <qa-candidate run id> \
     --app "$RUNNER_TEMP/m2-0008-app/Metis.app" \
     --out out/m2-0194-freeze-repro
   ```

4. OBSERVED (S13, S21): on macOS, `SAMPLE_BIN=/usr/bin/sample` and each sample runs as `/usr/bin/sample <pid> 10 -file <raw>`.
5. OBSERVED (S13): raw sample files are temporary; the script redacts `$HOME` into `<label>.sample.txt` and removes `<label>.raw.sample.txt`.
6. OBSERVED (S14): for each sampled row, `sample_app` samples the main process PID and every renderer selected by `renderer_pids`.
7. OBSERVED (S14): renderers are chosen by role from the child process command line containing `--type=renderer`; command lines are matched and not recorded.
8. OBSERVED (S14): `matrix.jsonl` gets a separate sampling row per matrix row with fields `sampled`, `main_pid`, `main_sample`, `renderer_attempts`, `renderer_samples`, and `renderers_selected_by:"--type=renderer"`.
9. OBSERVED (S19): macOS hosted-live drives rows 1-4 automatically, records rows 5 and 9 as BLOCKED_EXTERNAL, records network-off and file-provider-cancel as BLOCKED_EXTERNAL, and runs the process-signal interrupt.
10. OBSERVED (S10, S22): the macOS bundle is uploaded as a workflow artifact for 14 days and includes `samples/`, `matrix.jsonl`, `interrupt-results.jsonl`, `external-blockers.json`, and the lead-action handoff.
11. DERIVED (S25, S26, S27, S7-S22): the flags and outputs above are the merged M2-0462 hosted-live and M2-0463 workflow-mode procedure that M2-0464 documents.

## Procedure: hosted Windows branch

1. OBSERVED (S11, S20): M2-0008 can run hosted-live on `windows-latest`; M2-0194 Windows attribution is a dry run.
2. OBSERVED (S20): Windows hosted-live automatically runs row 1 and row 4, records row 2 plus rows 5 and 9 as BLOCKED_EXTERNAL, and records row 3 plus process-signal as not applicable.
3. OBSERVED (S14, S20): process sampling is unavailable on `windows-latest`; `matrix.jsonl` records `sampled:false` with the reason that `/usr/bin/sample` is macOS-only and `pgrep` is not used.
4. DERIVED (S2, S20): Windows evidence for sampler behavior remains residual/no-sampler; current-build stall-sampler proof belongs to the macOS sampler path and M2-0192.

## Procedure: consented `.spin`/`.hang` collection

1. OBSERVED (S15): DiagnosticReports collection is off by default and `diagnostic-reports.json` is written with `consented:false` unless `--collect-diagnostic-reports` is present.
2. OBSERVED (S15): with `--collect-diagnostic-reports`, the script searches `/Library/Logs/DiagnosticReports` for `*.spin` and `*.hang` files newer than the run-start stamp.
3. OBSERVED (S15, S16): copied reports are restricted to files whose name, `Process`, `Path`, or `Identifier` names Metis/AskToto, or whose body names a sampled PID from `app-pids.txt`.
4. OBSERVED (S15): matching reports are copied into `diagnostic-reports/` as `.txt` files after `$HOME` redaction, and `diagnostic-reports.json` lists copied relative paths.
5. DERIVED (S15, S16): the collection is consented and filtered, but the script does not prove that every copied `.spin`/`.hang` report is content-free beyond `$HOME` redaction; the lead must review `diagnostic-reports.json` and reject any report that contains content or a non-profile path before importing evidence.
6. OBSERVED (S6): no repository script or app may run on the owner's Mac under D-28.
7. DERIVED (S6, S15): on the owner's Mac, DiagnosticReports collection is a manual owner action only, with written per-run consent; no repository script runs there. The owner may provide only the allowed, redacted files to the lead, and the lead treats that handoff as external input, not as agent-run evidence.
8. BLOCKED_EXTERNAL (S6): exact owner-side step, if the owner chooses to provide reports: the owner writes per-run consent, manually identifies only post-run Metis/AskToto `.spin`/`.hang` reports or reports tied to sampled PIDs, manually redacts `$HOME` and any content/path outside the profile, then gives the lead the redacted files plus the consent note. Agents do not execute this step.

## Bundle content rules

1. OBSERVED (S17): environment facts are content-free host facts only: no host name, user name or serial.
2. OBSERVED (S13, S15): sample and DiagnosticReports copies redact `$HOME`.
3. OBSERVED (S22): the hosted bundle may contain `README.md`, `environment.json`, `launch-plan.json`, `matrix.jsonl`, `interrupt-results.jsonl`, `fifo-fixtures.json`, `dataless-fixtures.json`, `node-options-fuse.json`, `hosted-live-summary.json`, `external-blockers.json`, `samples/`, `diagnostic-reports/`, `diagnostic-reports.json`, evidence import manifests, owner-bug summaries, and lead-action files.
4. OBSERVED (S23): M2-0194 attribution bundles may contain audit excerpts and `stall-bundle-names.json`; stall-bundle contents are not copied by `attribution-bundle.mjs`.
5. DERIVED (S1, S2, S13, S15, S17, S23): a valid diagnostics bundle is content-free. It may contain process stacks, symbol names, bounded audit rows, status fields, sha256 values, row ids, host kind, runner OS/version/architecture/memory, copied DiagnosticReports that pass the consent/filter/redaction gate, and stall-bundle file names.
6. DERIVED (S1, S2, S13, S15, S17, S23): a valid diagnostics bundle may not contain transcripts, meeting text, meeting titles, tokens, secrets, email addresses, user names, host names, serial numbers, raw unredacted samples, raw unredacted DiagnosticReports, full local paths outside the run profile, or stall-bundle contents.
7. OBSERVED (S10): GitHub workflow artifacts are retained for 14 days.
8. DERIVED (S10): after 14 days, the artifact should not be treated as durable storage; the lead imports only the content-free evidence records and hashes that the program ledger requires.

## Lead import and review

1. OBSERVED (S18): hosted bundles emit evidence-import metadata with `environment.kind:"hosted-runner"` and identify blocked external rows and interrupts.
2. OBSERVED (S18, S22): the bundle includes lead-action files that tell the lead to validate the content-free bundle and file controlled program evidence records.
3. DERIVED (S18, S22): the evidence lead imports the bundle by validating the artifact path, checking `matrix.jsonl`, `interrupt-results.jsonl`, `external-blockers.json`, `diagnostic-reports.json`, sample presence, and the evidence-import manifest, then filing controlled records with only allowed content-free outputs and sha256 hashes.
4. LEAD_ACTION: review `docs/metis-2.0/runbooks/diagnostics-sampling.md` against M2-0008 acceptance 8 and merge it.
5. LEAD_ACTION: after merge, file this ticket's DESIGNED record with output `{path: "docs/metis-2.0/runbooks/diagnostics-sampling.md", sha256: "<sha256 of merged file>"}`.
6. LEAD_ACTION: dispatch `freeze-repro.yml` on `main` only after confirming the workflow is registered and active; agents in this worktree do not dispatch workflows.
7. LEAD_ACTION: import any M2-0008 or M2-0194 hosted bundle into controlled evidence records only after validating the bundle is content-free and consistent with this runbook.

## Cross-links and scope boundaries

1. OBSERVED (S1): M2-0008 acceptance 8 is the direct source for this diagnostics-sampling runbook.
2. OBSERVED (S2): M2-0192 owns current-build stall-sampler bundles.
3. OBSERVED (S3): M2-0194 owns HEAD freeze/reopen attribution using observability and sampler outputs.
4. DERIVED (S1, S2, S3): this runbook documents the diagnostic collection procedure; it does not replace M2-0192's sampler implementation or M2-0194's attribution evidence.

## Verification notes for this DESIGNED record

1. OBSERVED (S24): graphify query and wiki navigation were unavailable in this worktree because there is no `graphify-out/graph.json` and no `graphify-out/wiki/index.md`.
2. OBSERVED (S12): `run-matrix.sh` usage/help text was verified by reading the `usage()` block from `origin/m2/integration`; `run-matrix.sh --help` was not executed because D-28 forbids repository scripts in this worktree.
3. OBSERVED (S7-S23): verification was read-only against `origin/m2/integration` with `git show`; no repository script, test, workflow, or app was run.
4. OBSERVED (S6): skipping local tests/scripts is required by D-28.
5. UNKNOWN: no CI artifact bundle was present in this worktree, so no live bundle contents or DiagnosticReports copies were inspected here.
