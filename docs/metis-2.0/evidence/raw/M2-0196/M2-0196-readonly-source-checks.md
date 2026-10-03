# M2-0196 read-only public source checks

Recorded: 2026-09-27

This artifact captures read-only excerpts from the public code checkout for M2-0196. Commands are written without private local checkout paths; run them from a clone that has `origin/m2/integration`.

## `windows-qa.yml` presence check

Command:

```bash
git show origin/m2/integration:.github/workflows/windows-qa.yml
```

Exit code: 128

Output:

```text
fatal: path '.github/workflows/windows-qa.yml' does not exist in 'origin/m2/integration'
```

## `qa-candidate.yml` Windows packaged install/launch lane

Command:

```bash
git show origin/m2/integration:.github/workflows/qa-candidate.yml | nl -ba | sed -n '168,226p;314,350p'
```

Exit code: 0

Output excerpt:

```text
   168	  build-win:
   169	    name: Build win
   170	    needs: guard
   171	    runs-on: windows-latest
   172	    timeout-minutes: 90
   205	      - name: Build the win installers
   206	        run: npm run dist:win
   211	      - name: Stage and hash the installers
   212	        run: node scripts/qa/provenance.mjs stage win release candidate
   314	  smoke-win:
   315	    name: Install and launch win by sha256
   316	    needs: provenance
   317	    runs-on: windows-latest
   334	      - name: Verify every byte against the provenance
   335	        run: node scripts/qa/provenance.mjs verify provenance/provenance.json assets win
   336	      - name: Install the Setup silently and launch it, then launch the Portable
   337	        shell: pwsh
   343	          $target = Join-Path $env:RUNNER_TEMP 'installed'
   344	          $setup = Get-Item assets/Metis-Setup-*.exe
   345	          $install = Start-Process -FilePath $setup.FullName -ArgumentList '/S', "/D=$target" -Wait -PassThru
   346	          if ($install.ExitCode -ne 0) { throw "Setup exited with $($install.ExitCode)." }
   347	          node scripts/check-packaged-launch.mjs (Join-Path $target 'Metis.exe')
   348	          if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   349	          node scripts/check-packaged-launch.mjs (Get-Item assets/Metis-Portable-*.exe).FullName
   350	          if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

## `packaged-smoke.yml` Windows packaged smoke lane

Command:

```bash
git show origin/m2/integration:.github/workflows/packaged-smoke.yml | nl -ba | sed -n '94,145p'
```

Exit code: 0

Output excerpt:

```text
    94	  windows:
    95	    name: Packaged smoke (Windows)
    96	    runs-on: windows-latest
    97	    timeout-minutes: 90
   125	      - name: Build the unsigned installers
   126	        run: npm run dist:win
   127	      - name: Record the installer's sha256
   128	        run: |
   129	          mkdir -p smoke-report
   130	          sha256sum release/Metis-Setup-*.exe > smoke-report/SHA256SUMS.txt
   131	      - name: Install the Setup silently into a fresh directory
   132	        shell: pwsh
   135	          $setup = Get-Item release/Metis-Setup-*.exe
   136	          $install = Start-Process -FilePath $setup.FullName -ArgumentList '/S', "/D=$env:RUNNER_TEMP\smoke" -Wait -PassThru
   137	          if ($install.ExitCode -ne 0) { throw "Setup exited with $($install.ExitCode)." }
   138	      - name: Launch, quit cleanly, and check that nothing survives
   139	        id: smoke
   140	        timeout-minutes: 10
   141	        run: node scripts/qa/packaged-smoke.mjs "$RUNNER_TEMP/smoke/Metis.exe" smoke-report/packaged-smoke.json
   142	      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
   143	        if: ${{ !cancelled() && steps.smoke.outcome != 'skipped' }}
   144	        with:
   145	          name: packaged-smoke-windows
```
