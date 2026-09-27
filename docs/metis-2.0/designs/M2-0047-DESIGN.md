# M2-0047 design: architecture fitness functions (dependency-cruiser layering gate + check-architecture ratchet)

Designer: Opus. Base: `56292fb6` (m2/integration, post-rewrite). Branch `m2/M2-0047-architecture-fitness` (no remote branch, no PR as of 2026-09-27).
Implementer: Codex. The owner asked that Claude plan and challenge and Codex implement. Reviewer: Claude, in a session that is not the implementer's.
Status: design only. Kit ref M2-ENG-01. ADR-011. Findings guarded (this ticket does not fix them): L11-03, L12-flat-god-directories, L12-test-layer-boundary-leak, L12-cycle-brain-ingest, L12-cycle-settings-tapcalibration, L12-stale-orphan-files, L12-F2-settings-god-component.

## 0. Why this design, in one paragraph

The god files are about to be peeled, and without a gate they grow back while that happens. ESLint `max-lines` with a suppression cannot stop a 9,565-line file from reaching 9,600. The house already has a gate that can: `scripts/check-test-types.mjs`. It keeps a committed count, fails when the count rises, and also fails when it falls, so a fixed error cannot quietly become room for a new one. This design applies that pattern to twelve fitness functions and keeps **one** baseline file. dependency-cruiser answers the three questions that need a resolved module graph: FF-01 layering, FF-02 cycles, FF-03 unreachable modules. A TypeScript-AST script answers the per-file syntax questions: FF-04 through FF-14. The script also runs dependency-cruiser and folds its violations into the same per-file counts, so one comparator and one JSON file cover everything. FF-01 in production code has zero violations today, and the acceptance requires it to fail hard from the first run. It therefore gets its own CI step, `npm run check:layering`, which uses dependency-cruiser's native `error` severity. That step is never report-only. The ratchet step runs with `continue-on-error: true` for three days, then a one-line follow-up PR deletes that line. Nothing is run on the owner's Mac (D-28). The baseline is seeded from the first CI log, and the script is built so that the only baseline it ever proposes after seeding is a lower one.

## 1. Invariants

**INV-ONE-BASELINE.** `scripts/architecture-baseline.json` is the only record of accepted debt. dependency-cruiser's own known-violations file (`--ignore-known`, `depcruise-baseline`) is not used. The baseline maps each rule id to a map from repo-relative POSIX file path to a positive integer count.

**INV-EXACT-RATCHET.** For every rule id and file, `current === baseline` passes. `current > baseline` is a regression, and a file missing from the baseline counts as a baseline of 0. `current < baseline` is stale. Any regression or stale entry fails the ratchet. A file that newly exceeds 800 lines (FF-04), a new cycle, or a new orphan therefore fails with no special case.

**INV-NEVER-PROPOSE-A-RAISE.** Once a baseline exists, the only baseline the script prints is `lowerBaseline(baseline, current)`. That function lowers stale entries, drops entries that reach 0, keeps every regressed entry at its old value, and never adds a file. Pasting it fixes stale entries and leaves every regression failing. A count rises only when someone edits the JSON by hand and a reviewer approves it. A pure move that relocates existing violations to a new file is the legitimate case. The single exception is bootstrap: when the file does not exist, the script prints the full current counts as the seed.

**INV-FF01-HARD.** A production import across a layer boundary fails `npm run check:layering` (non-zero exit) on the first CI run and on every run after it. That step never has `continue-on-error`. Test-only crossings are `warn` rules and are held by the ratchet.

**INV-FAIL-CLOSED.** The ratchet fails in each of these cases and never treats a problem as "0 violations":
- dependency-cruiser exits non-zero or prints unparseable output;
- a dependency-cruiser rule name lacks the `ffNN-` prefix;
- the baseline is not in canonical form (unknown rule id, unsorted file, zero or non-integer count);
- the baseline file is missing (after bootstrap).

**INV-ONE-COUNTER-PER-FF.** Each FF id is measured by exactly one tool. That gives one baseline key per FF and one explanation per count.

**INV-AST.** FF-04 through FF-14 are detected on the TypeScript AST from `ts.createSourceFile`, never with a regex over the text. The one exception is line counting.

**INV-DETERMINISTIC.** The result depends only on the checked-out tree. No dates, network, environment variables or OS paths leak into counts or keys. Keys are POSIX-relative to the repo root, rule ids come in the declared order, files are sorted, and CRLF is normalized before any comparison.

**INV-CI-ONLY (D-28).** Nothing in this ticket runs on the owner's Mac: no `node scripts/...`, no `npx depcruise`, no `npm test`, no `npx vitest`. The only local checks allowed are `npx tsc --noEmit -p tsconfig.node.json` and `-p tsconfig.web.json`. Neither covers `scripts/`, so every proof comes from GitHub Actions.

## 2. What the tree looks like at `56292fb6` (design-time calibration, not the baseline)

This was measured with a read-only Python scan and by reading dependency-cruiser 18.4.0's published source. The seed comes from the CI log, not from this table. If the seed is far from these numbers, a detector is wrong: investigate before committing it.

| FF | Measured | Notes |
|---|---|---|
| FF-01 production | **0** | Scan of relative, `@shared/*` and `@/*` imports, `import()`, `require` and `export … from`. No triple-slash references in `src/`. |
| FF-01 tests | 2 | `src/renderer/src/lib/onboarding-kinetic-grid.test.ts` → `src/main/island/geometry`; `src/shared/hash.test.ts` → `src/main/screen-preprocess` |
| FF-02 | ≥ 2 cycles (brain/ingest ↔ operator-ingest ↔ intelligence-index; Settings.tsx ↔ TapCalibration.tsx) | Counted per edge `from`, so about 5 file entries. Type-only edges count (`tsPreCompilationDeps: true`), so a few more may appear. |
| FF-03 | ~15 | L12 list (command-mic feature, Logo, RecordingIndicator, brain-analyze, whisper-worklet …). `whisper.worker.ts` is an entry point, not an orphan. |
| FF-04 | 21 files | `src/main/index.ts` 9,565 · `Settings.tsx` 9,377 · `App.tsx` 4,277 · `listen.ts` 3,153 · `brain/ingest.ts` 2,832 · `shared/ipc.ts` 2,407 · … · `BrainRecordPage.tsx` 831 |
| FF-05a | ~470 calls in ~53 files | Only `fs` Sync calls. `execFileSync`, `scryptSync`, `gunzipSync`, `showMessageBoxSync` and local `write*Sync` helpers are not fs, so they are excluded. |
| FF-05b | 6 modules | `transcripts.ts` 41 sync, `brain/store.ts` 31 sync, `brain/ingest.ts` 18 sync, `brain/publish.ts` 13 sync, plus the async calls in these and in `recall.ts`, `graphify.ts` |
| FF-06 | 9 | `App.tsx` 6, `Settings.tsx` 2, `Review.tsx` 1 |
| FF-07 | ~155–185 test files | Test files that read files and name `.ts`/`.tsx` paths |
| FF-09 | 164 | All in `src/main/index.ts` |
| FF-10 | 18 importer files + 4 `utilityProcess.fork` sites | Including `src/main/infra/storage/dataless.ts` (infra, but not `infra/process`) |
| FF-11 | 4 | `index.ts` 3, `intelligence.ts` 1 |
| FF-14 | 7 files with `setInterval` (index.ts 8) + about 6 self-re-arming `setTimeout` | Scope is `src/main` |

Existing layout: `src/main/infra/{observability,storage}` and `src/shared/contracts/knowledge` exist. `src/main/{features,ipc,windows,infra/process,infra/scheduler}` do not exist yet. Their rules are written now and match nothing until those folders land.

## 3. Exact changes per file

### 3.1 `package.json` (+ `package-lock.json`, produced by the driver)

- `devDependencies`: add `"dependency-cruiser": "18.4.0"`, an exact pin placed alphabetically after `"@vitest/coverage-v8"`. 18.4.0 was published 2026-09-20. It declares Node `^22||^24||>=26` (CI uses 22.22.3) and TypeScript `>=2.0.0 <7.0.0` (the repo installs 5.9.3). Every CLI flag, output shape and matcher behaviour below was checked against the 18.4.0 tarball. Changing the version is a separate reviewed change.
- `scripts`: add these two, next to `check:bugs`:
  ```json
  "check:layering": "depcruise src --config .dependency-cruiser.cjs",
  "check:architecture": "node scripts/check-architecture.mjs",
  ```
  CI calls them through `npm run` and never through `npx depcruise`. npm scripts resolve only local bins, while `npx` falls back to downloading a registry package when the local bin is missing, which is a supply-chain hole.
- **Lockfile (driver, per the lead note).** In the worktree: `npm install --save-dev --save-exact --package-lock-only --ignore-scripts --no-audit --no-fund dependency-cruiser@18.4.0`. This rewrites only `package.json` and `package-lock.json`. It does not reify `node_modules` (the worktree's symlink is untouched) and runs no lifecycle or repo script. Review criteria for the diff:
  - `package.json` gains exactly that one devDependency line (plus the two scripts above);
  - the lock gains `node_modules/dependency-cruiser` and its subtree. dependency-cruiser pins its own dependencies exactly, so expect nested copies of `semver` 7.8.5, `commander` 15.0.0, `picomatch` 4.0.7 and `enhanced-resolve` 5.25.1, plus about 15 new packages (`watskeburt`, `acorn-loose`, `tsconfig-paths-webpack-plugin` …);
  - no existing package changes version.

  If any existing entry moves, discard the result and redo it. My design-time dry run of this command on a scratch copy was denied by the session's permission gate, so the diff has **not** been previewed.

### 3.2 `.dependency-cruiser.cjs` (new, repo root). Full content to implement

```js
/**
 * Architecture fitness functions FF-01..FF-03: the rules that need the resolved module graph.
 *
 * Every rule name starts with its fitness-function id (`ff01-`, `ff02-`, `ff03-`).
 * scripts/check-architecture.mjs counts violations per id and file against
 * scripts/architecture-baseline.json and rejects any rule name without that prefix.
 *
 * Severity is the enforcement mode:
 * - error: production code never does this. `npm run check:layering` exits non-zero on any error.
 * - warn: existing debt that may only shrink, held per file by the ratchet.
 */
const TEST_FILE = '\\.(test|spec)\\.tsx?$'

// Modules the app loads by file path rather than by import: the electron-vite inputs in
// electron.vite.config.ts, the scripts of src/renderer/{index,decoder}.html, and the
// `new Worker(new URL(...))` target in listen.ts.
const ENTRY_POINTS = [
  '^src/main/(index|parakeet-asr-host|parakeet-extract-host|speaker-embedding-host|whisper-asr-host)\\.ts$',
  '^src/preload/(index|intelligence|import-decoder)\\.ts$',
  '^src/renderer/src/(main\\.tsx|import-decoder\\.ts)$',
  '^src/renderer/src/lib/whisper\\.worker\\.ts$',
]

/**
 * One layer boundary, as two rules: production code must never cross it (error), and a test that
 * crosses it is ratcheted debt (warn), because tests follow the production rules.
 */
function boundary(name, comment, fromPath, to) {
  return [
    { name: `ff01-${name}`, comment, severity: 'error', from: { path: fromPath, pathNot: TEST_FILE }, to },
    { name: `ff01-${name}-in-tests`, comment, severity: 'warn', from: { path: `${fromPath}.*${TEST_FILE}` }, to },
  ]
}

module.exports = {
  forbidden: [
    ...boundary('renderer-imports-main-or-preload',
      'The renderer reaches main only through the preload bridge and src/shared.',
      '^src/renderer/', { path: '^src/(main|preload)/' }),
    ...boundary('preload-imports-main-or-renderer',
      'The preload bundle imports only src/shared, Electron and Node.',
      '^src/preload/', { path: '^src/(main|renderer)/' }),
    ...boundary('main-imports-renderer-or-preload',
      'The main bundle never contains renderer or preload code.',
      '^src/main/', { path: '^src/(renderer|preload)/' }),
    ...boundary('shared-imports-a-process',
      'src/shared is imported by every process, so it imports none of them.',
      '^src/shared/', { path: '^src/(main|renderer|preload)/' }),
    ...boundary('infra-imports-features',
      'Features depend on infrastructure, never the reverse.',
      '^src/main/infra/', { path: '^src/main/features/' }),
    ...boundary('feature-imports-feature-internals',
      'Another feature is reached only through its index.ts.',
      '^src/main/features/([^/]+)/',
      { path: '^src/main/features/[^/]+/', pathNot: ['^src/main/features/$1/', '^src/main/features/[^/]+/index\\.ts$'] }),
    {
      name: 'ff01-contracts-import-beyond-zod',
      comment: 'Contracts are plain zod schemas: they import zod and each other, nothing else.',
      severity: 'error',
      from: { path: '^src/shared/contracts/', pathNot: TEST_FILE },
      // (^|/) because a symlinked node_modules resolves to its real path.
      to: { pathNot: ['^src/shared/contracts/', '(^|/)node_modules/zod/'] },
    },
    {
      name: 'ff02-import-cycle',
      comment: 'Every module on a cycle loads, tests and changes together with all the others.',
      severity: 'warn',
      from: { path: '^src/' },
      to: { circular: true },
    },
    {
      name: 'ff03-unreachable-from-entry-points',
      comment: 'No entry point reaches this module, so it is dead code (being imported by a test does not count).',
      severity: 'warn',
      from: { path: ENTRY_POINTS },
      to: { path: '^src/.+\\.tsx?$', pathNot: [TEST_FILE, '\\.d\\.ts$', '/__fixtures__/', ...ENTRY_POINTS], reachable: false },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // Type-only imports are coupling too: a renderer type imported from main is a layering break.
    tsPreCompilationDeps: true,
    // tsconfig.web.json declares both aliases (@shared/* and @/*); main and preload use only @shared/*.
    tsConfig: { fileName: 'tsconfig.web.json' },
  },
}
```

These facts were checked in 18.4.0's source, so do not second-guess them:
- `path` and `pathNot` accept arrays, which are joined with `|`.
- `$1` in `to.pathNot` is replaced with the group captured by `from.path`.
- For `reachable: false`, the violation is `{ type: 'module', from: <unreachable file>, to: <same file> }`.
- Cycle violations come one per edge, with `from` = the importing file.
- The `err` reporter (the CLI default) exits with the number of `error` violations. The `json` reporter always exits 0.
- Paths are POSIX and relative to the cwd.
- dependency-cruiser does **not** follow `new Worker(new URL(...))`, which is why the worker is listed as an entry point.
- enhanced-resolve follows symlinks by default, which is why the zod pattern is `(^|/)node_modules/zod/`.

### 3.3 `scripts/check-architecture.mjs` (new, about 300 lines, ESM, shebang, house header comment)

The header comment is self-contained, because the repo is public: never cite program-document paths. It says:
- what the gate does;
- why it is a ratchet and not zero (large existing debt; a gate that blocks on churn gets switched off);
- why a fall also fails (a fixed violation must not become room for a new one);
- how to update the baseline:
  - fallen counts: paste the lowered JSON the failure prints;
  - rising counts: only a reviewed hand edit;
  - no baseline: CI prints the seed.

It keeps FF ids as the vocabulary and gives each rule a one-line title (below).

**Module shape.** Export pure functions for the tests, and run `main()` only when the file is invoked directly. Use the house guard from `check-update-metadata.mjs`: `import.meta.url === pathToFileURL(resolve(process.argv[1])).href`. Put JSDoc types on the exports, because the vitest test consumes them through `allowJs` and must add **zero** errors to the exact-equality `check:test-types` ratchet (26):

```js
/** @typedef {Record<string, Record<string, number>>} Counts  rule id → repo-relative POSIX file → count */
/** @typedef {{ rule: string, file: string, baseline: number, current: number }} Difference */
export function countSourceFile(file, text)        // → Record<string, number>, non-zero counts only
export function countDependencyViolations(violations) // dependency-cruiser IViolation[] → Counts
export function compareCounts(baseline, current)   // → { regressions: Difference[], stale: Difference[] }
export function lowerBaseline(baseline, current)   // → Counts (INV-NEVER-PROPOSE-A-RAISE)
export function formatBaseline(counts)             // → canonical JSON text, ends with '\n'
```

`repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')`, as in `check-test-types.mjs`. The e2e tests depend on this: copying the script into a fixture's `scripts/` makes the fixture the repo.

**Rule ids, in baseline order, with titles** (printed in the summary):

| Id | Title | Measured by | Scope (repo-relative) |
|---|---|---|---|
| FF-01 | Imports across a layer boundary | dependency-cruiser `ff01-*` | `src/` |
| FF-02 | Imports on a cycle | dependency-cruiser `ff02-*` | `src/` |
| FF-03 | Modules no entry point reaches | dependency-cruiser `ff03-*` | `src/` |
| FF-04 | Lines in source files longer than 800 lines | AST script | production files under `src/` |
| FF-05a | Synchronous fs calls in the main process | AST script | production files under `src/main/` |
| FF-05b | fs calls in meetings-root modules outside the storage gateway | AST script | exactly `MEETINGS_ROOT_READERS` |
| FF-06 | Native confirm/alert/prompt in renderer code | AST script | production files under `src/renderer/` and `intelligence/src/` |
| FF-07 | TypeScript source paths named by tests that read files | AST script | test files under `src/`, `scripts/`, `intelligence/src/` |
| FF-09 | ipcMain registrations outside src/main/ipc/ | AST script | production files under `src/`, not `src/main/ipc/` |
| FF-10 | Process spawning outside src/main/infra/process/ | AST script | production files under `src/`, not `src/main/infra/process/` |
| FF-11 | BrowserWindow construction outside src/main/windows/ | AST script | production files under `src/`, not `src/main/windows/` |
| FF-14 | Background timers outside src/main/infra/scheduler/ | AST script | production files under `src/main/`, not `src/main/infra/scheduler/` |

File classes:
- A **test file** matches `/\.(test|spec)\.tsx?$/`.
- A **production file** is a `.ts`/`.tsx` file that is not a test file, not `*.d.ts`, and not under a `__fixtures__/` directory.
- Files are walked under `src`, `scripts` and `intelligence/src` with `readdirSync(dir, { withFileTypes: true })`, recursively, skipping directories named `node_modules`. A missing root throws (fail closed). Keys are `relative(repoRoot, abs).split(sep).join('/')`.
- Each file is read once, CRLF is normalized to LF, and it is parsed once:

  ```js
  ts.createSourceFile(key, text, ts.ScriptTarget.Latest, /* setParentNodes */ true,
                      key.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  ```

Then every rule whose scope matches runs on it. `import ts from 'typescript'` is already a devDependency, so no new dependency is needed.

**Detectors.** Each is one small named function over a `ts.SourceFile`. The semantics are exact, and the unit tests pin each bullet.

- **FF-04 `linesOverLimit`.** `lines = text === '' ? 0 : text.split('\n').length - (text.endsWith('\n') ? 1 : 0)`, which equals `wc -l` for newline-terminated files. The count is `lines` when `lines > 800`, and nothing otherwise. The value is the line count, so the ceiling tightens as the file shrinks.
- **fs bindings (shared by FF-05a, FF-05b, FF-07).**
  - `FS_MODULES = {'fs','node:fs','fs/promises','node:fs/promises'}`.
  - From import declarations of those modules (type-only imports and specifiers skipped):
    - a named specifier gives local name → imported name (`propertyName ?? name`);
    - a default or namespace import, or a named `promises` specifier, gives a namespace binding.
  - The same applies to `const x = require('<fs module>')` (namespace) and `const { a, b: c, promises } = require('<fs module>')` (named / namespace).
  - An **fs call** is:
    - a `CallExpression` whose callee is an Identifier bound to a named fs import. Its name is the imported name;
    - or a callee that is a property-access chain rooted at a namespace binding. Its name is the last property: `fs.readFileSync` gives `readFileSync`, `fsp.readFile` gives `readFile`, `fs.promises.stat` gives `stat`.
  - Shadowing is ignored.
- **FF-05a.** The number of fs calls whose name ends with `Sync`.
- **FF-05b.** The number of all fs calls, sync and async, in:
  ```js
  // Modules that read or write the meetings root directly. Only src/main/infra/storage/ may (FF-05b).
  const MEETINGS_ROOT_READERS = new Set([
    'src/main/brain/ingest.ts', 'src/main/brain/publish.ts', 'src/main/brain/store.ts',
    'src/main/graphify.ts', 'src/main/recall.ts', 'src/main/transcripts.ts',
  ])
  ```
- **FF-06 `countNativeDialogs`.** `DIALOGS = {confirm, alert, prompt}` and `GLOBALS = {window, globalThis, self}`. Count each of:
  1. `G.d` property access, which covers calls and aliasing (`const c = window.confirm`);
  2. `G['d']` element access with a string literal;
  3. a destructuring element named `d` whose initializer is the Identifier `G` (`const { confirm } = window`);
  4. a bare call `d(...)` when no declaration in the file is named `d`. Declarations are the names of variable, parameter, function, class, import clause, import specifier, namespace import and binding elements, collected in one pass.
- **FF-07 `countSourceTextReads`.** Applies only if the test file **reads files**: it has a named fs binding whose imported name is `readFileSync` or `readFile`, or any namespace fs binding. The count is the number of `StringLiteral`, `NoSubstitutionTemplateLiteral` and `TemplateTail` nodes whose text matches `/^[^\s]*\.tsx?$/`, does not end with `.d.ts` and does not contain `__fixtures__`. That catches direct reads, const paths, loops over arrays of names and in-file wrapper helpers. Prose (it contains spaces) and fixture paths are excluded.
- **FF-09 `countIpcRegistrations`.** A `CallExpression` whose callee is `X.m` with `m ∈ {handle, handleOnce, on, once, addListener}`, where `X` is the Identifier `ipcMain` or a property access named `ipcMain` (`electron.ipcMain.handle`).
- **FF-10 `countProcessSpawners`.** `CHILD_PROCESS_MODULES = {'child_process','node:child_process'}`. Count each of:
  1. an import declaration of such a module that imports at least one value, so an `import type …` or all-`type` specifier list does not count;
  2. `require('<child_process module>')`;
  3. a call `X.fork(...)` where `X` is the Identifier `utilityProcess` or a property access named `utilityProcess`.
- **FF-11 `countWindowConstructions`.** A `NewExpression` whose expression is the Identifier `BrowserWindow` or a property access named `BrowserWindow`.
- **FF-14 `countBackgroundTimers`.** Count each of:
  1. a call whose callee is the Identifier `setInterval` or a property access named `setInterval`;
  2. a call to `setTimeout` (Identifier or `.setTimeout`) that **re-arms** an enclosing function.

  The *enclosing names* are the names of every function-like ancestor:
  - the declared name of a `FunctionDeclaration`, a `MethodDeclaration` or a named `FunctionExpression`;
  - for an `ArrowFunction` or `FunctionExpression`, the name of its parent `VariableDeclaration`, `PropertyAssignment` or `PropertyDeclaration`.

  The first argument *targets*:
  - a name, when it is an Identifier or `this.name`;
  - the names of every call inside it whose callee is an Identifier or `this.name`, when it is an arrow or function expression.

  The call re-arms when any target is an enclosing name, which covers `function tick() { … setTimeout(tick, ms) }`, `const poll = () => { … setTimeout(() => void poll(), ms) }` and `this.tick` in methods. A one-shot `setTimeout` is not counted.
- **Dependency-cruiser (FF-01..03) `runDependencyCruiser`.**
  - Command: `execFileSync(process.execPath, [join(repoRoot, 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruiser.mjs'), 'src', '--config', '.dependency-cruiser.cjs', '--output-type', 'json', '--no-progress'], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })`. Use the `node_modules/.../bin` path, as `check-test-types.mjs` does for tsc, because the bin is not in the package's `exports`.
  - Reading the result: `JSON.parse(stdout).summary.violations`. A throw from `execFileSync` fails the run and prints dependency-cruiser's stderr.
  - `countDependencyViolations`: the rule id is `FF-` plus the capture of `/^ff(\d{2}[ab]?)-/` on `violation.rule.name` (throw if there is no match), and the file is `violation.from`. Each violation adds 1. `error` and `warn` are counted alike. `check:layering` additionally owns the hard verdict for `error`.

**Baseline I/O and comparison.**
- `formatBaseline(counts)` emits every rule id in the table order, even when its map is empty. Within each id it lists files sorted by plain `<` code-unit order, keeps only entries with `Number.isInteger(n) && n > 0`, and returns `JSON.stringify(obj, null, 2) + '\n'`.
- Reading: `text = readFileSync(BASELINE, 'utf8').replace(/\r\n/g, '\n')`, then `parsed = JSON.parse(text)`. The baseline is canonical only when `formatBaseline(parsed) === text`. That single equality rejects unknown ids, missing ids, unsorted files, zeros, strings and floats.
- `compareCounts` walks every rule id and the union of files in both maps.
- `lowerBaseline(b, c)` = for each id and each file in `b`, `Math.min(b, c ?? 0)`, with zeros dropped by `formatBaseline`.

**`main()` and output.** Set `process.exitCode`. Never call `process.exit()`, because large stdout to a pipe can be truncated when the process exits early.

1. Compute `current` = the source counts merged with the dependency-cruiser counts. There is no overlap by construction.
2. Print one summary line per rule: `[check:architecture] FF-05a  470 in 53 files: Synchronous fs calls in the main process`. During the report-only days this line is the readout.
3. If the baseline file is missing (`ENOENT`), print `[check:architecture] FAIL: scripts/architecture-baseline.json does not exist. Commit the counts below as that file:`, then `formatBaseline(current)` last, alone, starting with a line that is exactly `{`. Exit code 1.
4. If the baseline is not canonical, print `FAIL: … is not canonical …` and the canonical rendering of its valid entries last. Exit code 1.
5. If there are differences, print `[check:architecture] FAIL: N counts differ from scripts/architecture-baseline.json`. Then print one line per difference: `  FF-04 src/main/index.ts: 9565 → 9570 (rose; counts may only fall)` or `… (fell; lower the baseline)`, regressions first. If any regression exists, add: `A count rises only through a reviewed edit of the baseline, for example a pure move that relocates existing violations.` If any stale entry exists, add `Baseline with every fallen count lowered (raises nothing):` and `formatBaseline(lowerBaseline(baseline, current))` last. Exit code 1.
6. Otherwise print `[check:architecture] OK: every count matches scripts/architecture-baseline.json.` Exit code 0.

### 3.4 `scripts/architecture-baseline.json` (new, seeded from CI)

It is the canonical output of `formatBaseline`: every rule id key present, 2-space indent, trailing newline. It is **not** written by hand for the seed. It is copied byte for byte from the CI log of the run on the implementation commit (see §5). An extraction that works on the `gh run view --log` format (`<job>\t<step>\t<timestamp> <line>`):

```sh
gh run view <run-id> --repo mysticalsin/AskToto-Mantu --log \
  | awk -F'\t' '$1 ~ /ubuntu/ && $2 == "Architecture ratchet" { print $3 }' \
  | sed -E 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z //' \
  | sed -n '/^{$/,/^}$/p' > "$TMPDIR/architecture-baseline.json"
```

Check the step label in the raw log first, because some `gh` versions print `UNKNOWN STEP`. If yours does, filter on `$1` only; the `^{$ … ^}$` block is unique to this step. Before committing, compare the counts with §2.

### 3.5 `scripts/check-architecture.test.ts` (new, vitest, runs in `npm test` on ubuntu and windows)

Use vitest in `.ts` instead of the ticket's `.test.mjs` under `node --test`. See the amendment in §7. Import the pure functions from `./check-architecture.mjs` (house precedent: `check-update-metadata.test.ts`). Every fixture uses `realpathSync(mkdtempSync(join(tmpdir(), 'metis-architecture-')))`, copies `scripts/check-architecture.mjs`, `.dependency-cruiser.cjs` and `tsconfig.web.json` into it, creates `intelligence/src/`, links `node_modules` with `symlinkSync(join(REPO, 'node_modules'), …, process.platform === 'win32' ? 'junction' : 'dir')` (house pattern from `check-test-types.test.ts`), and is removed in `finally`/`afterEach`. Two constraints:
- Do not import `readFileSync` or `readFile` in this test. Assert on process stdout instead. Otherwise FF-07 counts this file's fixture paths.
- Type the caught `execFileSync` error as `check-test-types.test.ts` does, so the test adds no type errors.

The tests are listed in §4.

### 3.6 `.github/workflows/build.yml` (quality job only)

Insert after `- run: npm run check:bugs` and before `- run: npm run build`:

```yaml
      # FF-01: production code never imports across a process or layer boundary. Fails the job on any
      # such import; test-only crossings are warnings held by the ratchet below.
      - name: Architecture layering
        if: runner.os == 'Linux'
        run: npm run check:layering
      # FF-01 test crossings and FF-02..FF-14 as per-file counts that may only fall
      # (scripts/architecture-baseline.json). Report-only: a differing count shows here but does not fail the job.
      - name: Architecture ratchet
        if: runner.os == 'Linux'
        continue-on-error: true
        run: npm run check:architecture
```

Change nothing else in the workflow: no other job, trigger, action pin or permission. (Pins and permissions are M2-0049/0050.) Ubuntu only, as ARCHITECTURE §3 says. The script's Windows behaviour (path keys, CRLF, junction) is proven by the unit tests, which run on both OSes.

### 3.7 PR 2 (enforcement, same ticket, at least 3 days after PR 1 merges into m2/integration)

PR 2 deletes the `continue-on-error: true` line and the "Report-only …" sentence from the step comment. Title: `ci: enforce the architecture ratchet [M2-0047]`.
- **Preconditions:**
  - every m2/integration push run in the window shows the ratchet `OK`, or a difference that has been traced;
  - the baseline on m2/integration head is current. If counts fell, PR 2 also pastes the printed lowered baseline.
- **Stop condition:** if any count **rose** during the window, stop and report. Each rise is a regression that slipped in while the ratchet was report-only. It needs a fix, or a raise that is explicitly reviewed. PR 2 never raises silently.
- **Queue:** PR 2 goes through the merge queue behind whichever workflow PR is in flight. It does not block M2-0048.
- **Ticket status:** DONE only after PR 2 merges.

## 4. Tests (red-first; all in `scripts/check-architecture.test.ts`)

Group A covers comparison, formatting and violation mapping. Group B pins each detector's semantics. Groups C and D are the behavioural proof of the two CI commands on a real fixture tree, run by the real dependency-cruiser.

**A. Ratchet semantics (pure)**
1. Equal counts produce no differences.
2. A count above its baseline is a regression carrying rule, file, baseline and current.
3. A file absent from the baseline is a regression from 0.
4. A count below its baseline is stale, and a baselined file that no longer violates is stale at 0.
5. `lowerBaseline` lowers stale counts and drops zeros. It never raises a regressed count and never adds a new file.
6. `formatBaseline` emits every rule id in table order, files sorted, 2-space indent and a trailing newline. It drops zero, float and string counts and unknown ids. Formatting its own parsed output returns the same text.
7. `countDependencyViolations` keys `ff01-…-in-tests` as `FF-01` and cycle and module violations by `from`, sums repeated violations per file, and throws on a rule name without the `ffNN-` prefix.

**B. Detectors (pure; `countSourceFile(path, text)` asserted with `toEqual` on the whole result, so no rule leaks into another)**
1. FF-04: 801 lines give `{ 'FF-04': 801 }`. 800 lines give `{}`. A CRLF file counts the same as its LF twin. A test file, a `.d.ts` or a `__fixtures__/` file of 900 lines gives `{}`.
2. FF-05a in `src/main/x.ts`:
   - these count: a named `readFileSync`, an aliased `readFileSync as rf`, a namespace `fs.writeFileSync`, `const { mkdirSync } = require('node:fs')`;
   - these do not: `readFile` (async), a local `writeRunStateSync`, `execFileSync` from child_process, a type-only import;
   - the same calls in `src/shared/x.ts` give `{}`.
3. FF-05b: in `src/main/transcripts.ts`, sync, async, `fs/promises` and `fs.promises.stat` calls all count, and the same text in `src/main/other.ts` counts only its sync calls under FF-05a.
4. FF-06 in `src/renderer/src/X.tsx`:
   - these count: `window.confirm()`, `globalThis.alert`, `self['prompt']`, `const { confirm } = window`, and a bare `alert('x')`;
   - these do not: a bare `confirm()` when the file declares `const confirm = …`, and the same text in `src/main/x.ts` or in a renderer test file.
5. FF-07 in `src/main/x.contract.test.ts`:
   - `readFileSync(join(__dirname, 'index.ts'), 'utf8')` counts 1;
   - a `const SRC = join(__dirname, '../renderer/src/App.tsx')` that is read counts 1;
   - these count 0: a `__fixtures__/a.ts` path, `types.d.ts`, a prose string ending in `.ts` with spaces, and a test that names `index.ts` but imports no read function;
   - a production file with the same text gives `{}`.
6. FF-09:
   - `ipcMain.handle`, `ipcMain.on` and `electron.ipcMain.handleOnce` count in `src/main/index.ts`;
   - the same text in `src/main/ipc/a.ts` gives `{}`;
   - `ipcRenderer.on` does not count.
7. FF-10:
   - these count: `import { spawn } from 'node:child_process'`, `require('child_process')` and `utilityProcess.fork(p)`;
   - `import type { ChildProcess } from 'node:child_process'` does not;
   - the same text under `src/main/infra/process/` gives `{}`.
8. FF-11: `new BrowserWindow({})` and `new electron.BrowserWindow({})` count, and nothing counts under `src/main/windows/`.
9. FF-14 in `src/main/x.ts`:
   - these count: `setInterval(f, 1)`, `function tick() { setTimeout(tick, 5) }`, `const poll = () => { setTimeout(() => void poll(), 5) }`, and `class A { tick() { setTimeout(() => this.tick(), 5) } }`;
   - a one-shot `setTimeout(done, 5)` does not;
   - the same text under `src/main/infra/scheduler/` or in `src/renderer/` gives `{}`.

**C. The layering gate (real dependency-cruiser on a fixture; proves INV-FF01-HARD and the regexes)**
1. One `--output-type json` run over a fixture tree containing each of the following. The test asserts the exact sorted set of `` `${rule.name} ${severity} ${from}` `` strings:
   - a renderer production import of `src/main` (error);
   - a renderer test importing `src/main` (warn `-in-tests`);
   - a `src/main/infra/x.ts` import of `src/main/features/a/index.ts` (error);
   - `features/a` importing `../b/internal` (error) and `../b/index` (allowed);
   - a contract importing `zod` (allowed) and `../util` (error);
   - a two-file cycle (2 × ff02);
   - an unimported `src/main/dead.ts` (ff03);
   - a module reached only through `@shared/…` and one reached only through `@/…` (both reachable, which proves alias resolution);
   - `src/renderer/src/lib/whisper.worker.ts` (an entry point, not an orphan).
2. The CLI exit code. The default reporter over the same fixture (`src --config .dependency-cruiser.cjs`, exactly the `check:layering` arguments) exits non-zero. After the error-producing imports are removed, it exits 0 while the `warn` violations remain.

**D. The ratchet CLI (the real script copied into a fixture, real dependency-cruiser; proves INV-EXACT-RATCHET and INV-NEVER-PROPOSE-A-RAISE end to end)**
1. With no baseline file: exit 1. Stdout ends with the seed, and parsing the seed yields the expected counts for the fixture (at least one entry each under FF-02, FF-03, FF-04 and FF-05a).
2. With that seed written as the baseline: exit 0, and the output contains `OK:`.
3. Adding one import that creates a new cycle: exit 1, with a line naming `FF-02`, the file and `0 → 1`. No JSON follows, because nothing fell.
4. Deleting `src/main/dead.ts`: exit 1, the FF-03 line reads `1 → 0 (fell`, and the printed JSON parses, lacks `src/main/dead.ts` and equals the seed minus that entry.
5. Reordering two keys of a valid baseline: exit 1 `not canonical`.

Spawns: C runs 3 and D runs 5, each about 1.5–4 s. Split them into separate `it`s so each stays well inside the 30 s `testTimeout`, including on Windows.

## 5. Commit and CI plan (every proof in CI, D-28)

| Commit | Content | Expected CI on `m2/M2-0047-architecture-fitness` |
|---|---|---|
| A `test(ci): specify the architecture fitness gates [M2-0047]` | `package.json` devDependency + lock (driver), `scripts/check-architecture.test.ts` | **Red, by design.** Quality (both OSes) fails at `npm run typecheck`, because `check:test-types` counts TS2307 for the missing `./check-architecture.mjs` (27 > 26). Security: the new devDependency tree passes `npm audit --audit-level=critical`. This run's URL is the red evidence. |
| B `ci: add the dependency-cruiser layering gate and the architecture ratchet [M2-0047]` | `.dependency-cruiser.cjs`, `scripts/check-architecture.mjs`, the two npm scripts, the `build.yml` steps | Quality green on both OSes (new tests pass). `Architecture layering` passes (0 production crossings). `Architecture ratchet` fails (`does not exist`), prints the seed, and the job stays green (continue-on-error). **If `Architecture layering` fails here, stop and report.** Never downgrade a rule or baseline a production crossing. |
| C `ci: seed the architecture baseline [M2-0047]` | `scripts/architecture-baseline.json` extracted from run B (§3.4) | All green. The ratchet prints `OK:` and the per-rule summary. This is the head evidence run. |

Each commit body explains why. The last line is the attribution line the driver requires. Then open the draft PR into `m2/integration`: `ci: add architecture fitness functions with a report-only ratchet [M2-0047]`. Compare job names and results with baseline run 36267674617. The only expected differences are the two new ubuntu steps and the new test file.

## 6. What not to do

- Do not run anything locally beyond the two allowed `tsc` projects. Neither covers the new files, so expect one or two CI iterations and budget for them.
- Do not use dependency-cruiser's `--ignore-known` / `depcruise-baseline` / `.dependency-cruiser-known-violations.json`. They tolerate stale entries (no fall-fails) and would split the debt across two files.
- Do not make report-only a date check, an environment flag or a `--report-only` switch in the script. A date turns CI red with no code change and makes old commits unreproducible. The mode belongs in the workflow line PR 2 deletes.
- Do not call `npx depcruise` in CI (registry fallback). Use `npm run check:layering`.
- Do not give the script a `--write`/`--update` mode. Nobody in this program can run it locally, and a writer that raises counts defeats INV-NEVER-PROPOSE-A-RAISE.
- Do not key the baseline by line number, message text or AST position. Keys are rule id + file, so edits elsewhere in a file do not churn it.
- Do not encode FF-05a's future allowlist (boot settings read, sentinel, crash writer, audit logger) or FF-14's UI-timer allowlist now. Those files simply stay in the baseline. An allowlist that matches today's debt is dead code.
- Do not add ESLint/Biome, a second devDependency, a `.gitattributes` change, a Windows ratchet leg, a new workflow, or wiring or source-text tests of `package.json` or `build.yml`. A mis-wired step fails loudly on its own.
- Do not fix any finding here: not the two cycles, the two test crossings, the orphans or the god files. Those belong to M2-0059..0071, M2-0040 and M2-0031. This ticket only measures them.
- Do not tighten FF-01 to the §2.3 target rows (preload → `shared/contracts` only, `main/ipc` → `features/*/ipc.ts`). Those have non-zero violations today and belong to M2-0060/0061. See the amendments.
- Do not copy program documents or cite their paths in code, comments, commits or PR text. The repo is public: FF ids and ticket ids only.
- Do not use `process.exit()` after printing the JSON (it truncates piped stdout). Set `process.exitCode`.

## 7. Acceptance amendments (for the lead to apply to the ticket)

1. **Test file and runner.** `scripts/check-architecture.test.ts` under vitest, run by `npm test` on ubuntu and windows, replaces `scripts/check-architecture.test.mjs` under `node --test`. vitest's include glob does not match `.mjs`, so a `node --test` file would need its own CI step. The house ratchet test (`check-test-types.test.ts`) is vitest. Verification item 3 becomes "the Quality checks job runs `scripts/check-architecture.test.ts` green".
2. **Verification and evidence under D-28.** `node scripts/check-architecture.mjs` and `npx depcruise src --config .dependency-cruiser.cjs` are proven by the CI steps `Architecture ratchet` and `Architecture layering` (`npm run check:layering` runs exactly that depcruise command). They are not run locally. `required_evidence: LOCALLY_TESTED` is met by CI runs, as PD-25/D-28 intends.
3. **FF-01 scope at m4.** The hard rules are the boundaries that have 0 production violations today:
   - renderer ↛ main/preload;
   - preload ↛ main/renderer;
   - main ↛ renderer/preload;
   - shared ↛ main/renderer/preload;
   - infra ↛ features;
   - features/X ↛ features/Y internals;
   - contracts ↛ anything but zod and contracts.

   §3 writes the preload rule as "anything but shared/contracts + electron", but preload imports `@shared/ipc`, `@shared/brain`, `@shared/providers` and `@shared/recap-status` today. The tightening lands with M2-0061 (`channels.ts`). The main/ipc row of §2.3 lands with M2-0060.
4. **One counter per FF.** FF-05b and FF-10 are counted by check-architecture on the AST, not by dependency-cruiser:
   - FF-10: `utilityProcess` is a named export of `electron`, which a module graph cannot see.
   - FF-05b: a call-site count falls with each call moved to the storage gateway, while an import edge stays at 1 until the last call leaves.
5. **FF-03 is reachability, not dependency-cruiser's `orphan`.** Its `orphan` means "no edges at all" and misses modules imported only by tests. The rule is "not reachable from the entry points".
6. **FF-05b's module list** is the six modules ARCHITECTURE §3 names. M2-0031's inventory extends `MEETINGS_ROOT_READERS`.
7. **FF-06** ships in check-architecture now, because M2-0040 has not landed. M2-0040 drives it to 0 and must not add a second detector.
8. **FF-07's unit** is the number of path-like `.ts`/`.tsx` string literals in a test file that reads files. Blind spot, recorded here: a *shared* helper module that reads the source on a test's behalf.
9. **FF-14's scope** is `src/main`, where the scheduler lives. Renderer UI timers are outside FF-14.
10. **Report-only mechanics.** PR 1 carries `continue-on-error: true` on the ratchet step only. PR 2 (§3.7) removes it, at least 3 days after PR 1 merges. The ticket is DONE after PR 2.
11. **Workflow order.** PR 1 is the first workflow change in the sequence M2-0047 → 0048 → 0053 → 0049 → 0050 → 0051 → 0052. PR 2 is a one-line follow-up that queues behind whichever workflow PR is in flight.

## 8. Challenges considered (and why the design stands)

- **"Fails when it falls" on FF-04 means every edit to a god file touches the baseline.** True, and deliberate: the acceptance demands it, and it records the peel in every PR. It also blocks net growth of those 21 files. A 1.9.7 fix that must add lines to `index.ts` either extracts something first or carries a reviewed raise. Concurrent PRs will conflict on the same JSON line. Each conflict is line-local, and the lowered JSON the failure prints resolves it. Rejected alternatives:
  - ceilings without the fall check, which let a shrunk file regrow to its old size;
  - per-rule totals, which let one file grow while another shrinks and lose attribution.
- **Why not dependency-cruiser for everything, or the AST for everything?** dependency-cruiser alone cannot see calls, `new` expressions or line counts. The AST alone would mean reimplementing alias resolution and reachability, the part L12's regex script got wrong twice. Each tool does what it is exact at, and one baseline joins them.
- **Why is FF-01 hard in a separate step?** The acceptance requires a hard fail from day one, while everything else is report-only. Separate steps keep the script free of mode logic. dependency-cruiser's native `error` severity plus its `err` reporter exit code is the smallest hard gate, and it is covered by test C2. It costs a second dependency-cruiser pass of about 10–20 s on ubuntu.
- **Bootstrapping from a CI log is fragile.** The canonical-form check makes a bad copy fail loudly instead of passing wrongly, and §2 gives magnitudes to sanity-check against.
- **Report-only hides regressions for three days.** By design. PR 2's stop condition makes any rise from that window explicit.
- **Nothing stops a hand-edited raise.** True. It is review-enforced, as in `check-test-types.mjs`. Diffing against the merge base would need full-history checkouts and event-specific base detection, which is disproportionate here.
- **18.4.0 is seven days old.** Every behaviour this design relies on was read in that exact tarball. The security job's audit on commit A is the supply-chain check. A version bump is a separate reviewed change.

## 9. PR evidence (template fields)

- Program ticket `M2-0047`. Kit references: M2-ENG-01. Findings: guarded, not closed (list above). Implementer: Codex. Reviewer: Claude, in a separate session.
- Evidence table:
  - `tsc` node/web: local, green (unaffected);
  - red run (commit A) → green head run (commit C), with URLs;
  - quoted CI lines: `Architecture layering` (0 errors) and `Architecture ratchet` (`OK:` plus the twelve summary lines);
  - security job green with the new devDependency;
  - job-by-job comparison with run 36267674617.
- Not run: any local test or script (D-28), the ratchet on Windows (the gate is ubuntu-only; its code is unit-tested on Windows), packaged builds (untouched).
