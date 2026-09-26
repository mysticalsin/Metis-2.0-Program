# M2-0002 design: release evidence chain, readiness labels and computed closure (ADR-017)

Designer: Opus. Base: `m2/integration` at `70de3c30`. Status: design only. Slice M2-0002.1 (the spec) is
this file; slice M2-0002.2 (Sonnet) implements §5-§8 from it.

## 0. Why this design, in one paragraph

The program's biggest risk is false closure: a persuasive report or a green unit run being read as proof
(ChatGPT audit §5, F-18). The fix is a record that points only at checkable facts (a commit, a CI run, a
file hash, a named session), plus a checker that computes whether a ticket may carry its status from those
records. Two constraints shape everything. D-28 means no repository script runs on a Mac, so every check
runs in GitHub Actions. And program documents are private while code and CI are public, so the public CI
can never read the ledger. The design therefore splits verification by where each fact is authoritative.
**Public CI** verifies a record pasted into a PR body against that PR's head commit and the named Actions
runs. This is the only place where "a CI run on the PR head SHA" can be proven. **A private-repo workflow**
runs the same scripts, from a sparse checkout of the public repo, against the ledger and the record files
to compute closure. The scripts are dependency-free Node ESM with `node:test` suites. No record-writing
CLI exists, because nothing could run it.

## 1. Invariants

**INV-1 (records are facts, not prose).** A record's claim is carried only by checkable references: a
40-hex commit, a positive Actions run id, a PR number, a sha256 of a committed file or packaged artifact,
a host label, or a session id. Free text appears in four places only: `command`, `unblock_step`,
`owner_statement.text` and `wired.probe`. It never substitutes for one of those references.

**INV-2 (append-only; latest governs).** Each ticket has one file, `evidence/records/<ticket>.jsonl`,
with one record per line. Lines are only ever appended. A correction, a re-run or a re-execution is a new
line. For each evidence level, the **last line with that level** is that level's evidence. Closure reads
only those latest records. So a later FAIL (for example a failed re-execution) withdraws an earlier PASS
without anyone editing history.

**INV-3 (levels are a set).** `DESIGNED`, `LOCALLY_TESTED`, `HOST_CONFIGURED`, `LIVE_VERIFIED`,
`ACCEPTED` and `MEASURED` are distinct and unordered. No code compares levels, and no level implies
another. `required_evidence` is a non-empty set of these values. Any other value, anywhere, is an error.

**INV-4 (closure is computed).** A ticket's status is valid only if the ledger rules in §4 hold for its
records and its dependency graph. The checker never infers a status. It accepts or rejects the one the
orchestrator wrote.

**INV-5 (artifact dependencies cap, decisions do not).** A ticket may be DONE only when no transitive
`depends_on` ancestor is ENGINEERING_COMPLETE or BLOCKED_EXTERNAL. The single exception is the ticket
marked `closes_program` (PD-27). A `needs_decision` entry never caps. It only obliges the record to label
the default it assumed, and it forces re-validation if the answer differs from that default.

**INV-6 (separation of duties).** `implementer_session.id` ≠ `validator_session.id` on every record. A
re-execution's `reexecuted_by.model` differs from the implementer's model, and its id differs from both
sessions.

**INV-7 (public-safe records).** A record may be published in a public PR body. No string in it may
contain a user home path (`/Users/<x>`, `/home/<x>`, `<drive>:\Users\<x>`) or an email address. Host
identity is a program label (`qa-mac-1`, `ubuntu-latest`), never a machine name or serial.

**INV-8 (no claim, nothing to verify).** The PR check fails only on a record that is present and false or
malformed. Missing evidence is judged where closure is judged, in the ledger check. A PR with no record
block passes the PR check.

## 2. Where things live and run

| Thing | Repo / path | Runs where | Who writes |
|---|---|---|---|
| Record schema + parsing | public `scripts/evidence/record.mjs` | imported only | Sonnet |
| Ledger + PR checker | public `scripts/evidence/check.mjs` | public CI (`--pr-event`), private CI (`--ledger`) | Sonnet |
| Re-execution sampler | public `scripts/evidence/sample.mjs` | private CI (dispatch) | Sonnet |
| Tests | public `scripts/evidence/{record,check,sample}.test.mjs` + vitest wrapper `evidence.test.ts` | public CI via `npm test` (Quality, ubuntu + windows) | Sonnet |
| PR record verification | public `.github/workflows/evidence.yml` | public CI on `pull_request` | Sonnet |
| PR template fields | public `.github/pull_request_template.md` | — | Sonnet |
| ADR-017 + schema reference | private `docs/metis-2.0/evidence/SCHEMA.md` | — | Sonnet (uncommitted), lead commits |
| Status vocabulary + dependency semantics | private `docs/metis-2.0/README.md` | — | Sonnet (uncommitted), lead commits |
| Record files | private `docs/metis-2.0/evidence/records/M2-####.jsonl` (+ `.gitkeep`) | — | validator writes the PR block; lead appends the line |
| Ledger workflow | private `.github/workflows/ledger.yml` | private CI | Sonnet (uncommitted), lead commits |
| Ledger register changes | private `ledger/tickets.json` | — | **lead only** (PD-13) |

Record lifecycle: CI goes green on the PR head. The validator pastes the record into the PR body as a
` ```json evidence ` block. The Evidence workflow verifies it. The lead appends the same JSON, compacted to
one line (`jq -c`), to the private record file and sets the ledger status. The private Ledger workflow
then recomputes closure for every ticket.

## 3. Record schema (normative; `record.mjs` is the single source of truth, SCHEMA.md explains it)

A record is one JSON object. Unknown keys are errors. An optional key that is absent or `null` means "not
applicable". A key that is present must be valid even on a level that does not require it.

| Field | Format | Required |
|---|---|---|
| `schema` | the number `1` | always |
| `ticket` | `^M2-\d{4}$` | always |
| `evidence_level` | one of the six levels | always |
| `recorded_at` | UTC instant `YYYY-MM-DDTHH:MM:SSZ` that parses | always |
| `kit_refs` | object: kit ref → `MET` \| `PARTIAL` \| `BLOCKED` \| `NOT_MET` | always (ledger check: keys = ticket's kit_refs) |
| `finding_refs` | array of non-empty strings | always (may be `[]`) |
| `commit` | 40 lowercase hex | always |
| `result` | `PASS` \| `FAIL` | always |
| `implementer_session`, `validator_session` | session | always |
| `pr` | positive integer (public PR number) | LOCALLY_TESTED; DESIGNED if no `output` |
| `ci_run_id` | positive integer (Build & Test run on `commit`) | LOCALLY_TESTED |
| `environment` | `{ kind, host }` | LOCALLY_TESTED (`kind` = `ci`), HOST_CONFIGURED and LIVE_VERIFIED (`kind` ≠ `ci`), MEASURED (any kind) |
| `command` | non-empty single-line string | LOCALLY_TESTED, HOST_CONFIGURED, LIVE_VERIFIED, MEASURED |
| `exit_code` | integer | whenever `command` is present |
| `output` | `{ path, sha256 }`: machine-produced file under the program docs root | HOST_CONFIGURED, LIVE_VERIFIED (suite or census output), MEASURED (raw measurement); DESIGNED if no `pr` |
| `artifact_sha256` | 64 lowercase hex (packaged bytes from the build lane) | LIVE_VERIFIED |
| `build_run_id` | positive integer (the `qa-candidate` run that produced the artifact, M2-0187) | LIVE_VERIFIED |
| `owner_statement` | `{ date: YYYY-MM-DD, text }` | ACCEPTED |
| `repro` | `{ test, commit, ci_run_id }`: the red-before run | LOCALLY_TESTED of a fix ticket (ledger rule L11) |
| `reexecuted_by` | session | re-execution records only |
| `assumed_decisions` | array of `^D-\d+$` | when the ticket has open decisions (ledger rule L12) |
| `inherited_block` | array of `{ ticket, unblock_step }` | when capped (ledger rules L10) |
| `wired` | `{ client, contract_fake, probe, capability, unblock_step }` | whenever any `kit_refs` value is `BLOCKED` |

Sub-formats:
- **session** `{ model, id }`: `model` matches `^[a-z0-9][a-z0-9.-]{0,63}$` (for example `claude-opus-5-5`,
  or `human` for a person). `id` matches `^[A-Za-z0-9._:-]{1,128}$` and is an opaque session id, never a
  name or email.
- **environment** `{ kind, host }`: `kind` ∈ `ci`, `qa-mac`, `windows-laptop`, `windows-runner`, `owner-mac`
  (the ARCHITECTURE §7.1 environments). `host` matches `^[a-z0-9][a-z0-9._-]{0,62}$`. It is a label
  registered in SCHEMA.md.
- **program path** (`output.path`): relative POSIX path under `docs/metis-2.0/` (for example
  `evidence/raw/M2-0029/hk-m-census.json`). It has no leading `/`, no `\`, and no empty, `.` or `..`
  segment. `output.sha256` is 64 lowercase hex.
- **repo path** (`repro.test`, `wired.client`, `wired.contract_fake`): the same shape, relative to the
  public repo root.
- **test path**: matches `\.(test|spec)\.[cm]?[jt]sx?$` (`repro.test` must be one).
- **test-only path**: a test path, or a path with a `__mocks__/`, `fixtures/` or `test/` segment.
- **wired**: `client` is a repo path that is **not** test-only. `contract_fake` **is** test-only. `probe` is
  one command: non-empty, single line, with none of `&&`, `||`, `;` or `|`. `capability` matches
  `^[a-z0-9][a-z0-9._-]*$` (the id shown in the in-app capability matrix). `unblock_step` is non-empty.
- **inherited_block entry**: `ticket` matches the ticket id, and `unblock_step` is non-empty.

Cross-field rules (record-local, in `recordProblems`):
- R-SEP: `implementer_session.id !== validator_session.id` ("a reviewer never approves its own work").
- R-REEX: if `reexecuted_by` is present, its `model` ≠ `implementer_session.model` and its `id` ∉
  {implementer id, validator id}.
- R-EXIT: if `command` is present, then `result === 'PASS'` exactly when `exit_code === 0`.
- R-REPRO: `repro.commit !== commit` (the red run is on an earlier commit than the green one).
- R-WIRED: any `BLOCKED` kit status requires a complete, valid `wired`. The problem text says the kit ref
  "counts as NOT_MET".
- R-DESIGNED: DESIGNED needs `output` or `pr` (design documents live in the program repo; public docs are
  proven by their PR).
- R-SAFE: every string value, at any depth, fails `USER_PATH = /(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)[^\s\/\\]+/i`
  and `EMAIL = /[^\s@<>]+@[^\s@<>]+\.[A-Za-z]{2,}/`.

**File form.** `records/<ticket>.jsonl`: UTF-8, one compact JSON object per line, `\n` or `\r\n`, a
trailing newline allowed, no blank lines. Every line's `ticket` equals the file stem. Dotfiles
(`.gitkeep`) are ignored. Any other file name in the directory is an error.

**PR-body form.** One record per fenced block whose opening line is exactly ` ```json evidence ` (trailing
spaces allowed). The block closes at the next line that is ` ``` `. HTML comments (`<!-- … -->`) are
stripped before scanning, so template comments never parse. Several blocks are allowed.

## 4. Closure rules (normative)

Ticket statuses: `TODO`, `IN_PROGRESS`, `ENGINEERING_COMPLETE`, `BLOCKED_EXTERNAL`, `DEFERRED`, `DONE`,
`CANCELLED`.

Definitions:
- `READY_DEP` = {ENGINEERING_COMPLETE, DONE, DEFERRED, BLOCKED_EXTERNAL}.
- `IN_HOUSE` = {DESIGNED, LOCALLY_TESTED}: the levels that need no outside environment.
- **caps(t)** = every transitive `depends_on` ancestor whose status is ENGINEERING_COMPLETE or
  BLOCKED_EXTERNAL. **roots(t)** = the members of caps(t) with a non-null `external_blocker`.
- **latest(t, level)** = the last record for that level in t's file (INV-2). **latest(t)** = the latest
  record of each level present.
- **closed** = DONE or ENGINEERING_COMPLETE.

Ledger rules (`ledgerProblems`). Each problem is one line starting with the ticket id:

| # | Rule |
|---|---|
| L1 | **Shape.** `tickets` is an array. Ids are unique and match the ticket pattern. `status` ∈ the vocabulary. `depends_on` ids exist. `needs_decision` is an array of D-ids. `required_evidence` is non-empty, distinct and ⊆ levels. `kit_refs`, `finding_refs` and `slices` are arrays. `estimate_hours` is a number. `external_blocker` and `flag` are present, and may be null. The top-level `decisions` register is an object with a value `OPEN` \| `ANSWERED_AS_DEFAULT` \| `ANSWERED_CHANGED` for every D-id any ticket references. At most one ticket has `closes_program: true`. |
| L2 | The `depends_on` graph is acyclic. Report each cycle once. |
| L3 | **Ready.** Status IN_PROGRESS, ENGINEERING_COMPLETE, DEFERRED or DONE ⇒ every direct dependency's status ∈ READY_DEP. |
| L4 | **Slicing.** IN_PROGRESS with `estimate_hours > 12` ⇒ at least one slice, and every slice has `estimate_hours ≤ 10`. |
| L5 | BLOCKED_EXTERNAL ⇒ `external_blocker` has non-empty `owner`, `unblock_step`, `needed_by` and `raised_on`. |
| L6 | CANCELLED ⇒ non-empty `reason`. |
| L7 | DEFERRED ⇒ `flag` is non-null, and latest(t, ACCEPTED) exists with PASS (the owner's dated approval under D-14). |
| L8 | ENGINEERING_COMPLETE ⇒ (`external_blocker` is non-null or caps(t) is non-empty), at least one latest PASS record exists, and latest(t, L) is PASS for every L in required_evidence ∩ IN_HOUSE. |
| L9 | DONE ⇒ latest(t, L) exists with PASS for every L in required_evidence, and caps(t) = ∅ unless `closes_program`. |
| L10 | **Inherited blocks.** For ENGINEERING_COMPLETE, and for DONE with `closes_program`: every record in latest(t) lists every id in roots(t) in `inherited_block`. For DONE without `closes_program`: every required-level latest record has an empty `inherited_block` (the affected verification was re-run after the upstream reached DONE). |
| L11 | **Red-before.** A closed ticket of `type: 'fix'` with LOCALLY_TESTED in required_evidence ⇒ latest(t, LOCALLY_TESTED) has `repro`. (A MEASURED-only fix such as M2-0166 proves before/after through its measurement file.) |
| L12 | **Record context** (every valid record in the file): `kit_refs` keys = the ticket's `kit_refs` exactly. `finding_refs` ⊆ the ticket's. `assumed_decisions` ⊆ the ticket's `needs_decision`. Every needs_decision whose register state is `OPEN` appears in `assumed_decisions` ("unlabelled assumption"). |
| L13 | **Re-validation.** A closed ticket whose latest(t) records list, in `assumed_decisions`, a decision now `ANSWERED_CHANGED` ⇒ problem "re-validate: D-x was answered differently from the default this evidence assumed". This line is the list the acceptance asks for. It clears when a new record for that level no longer assumes it. |
| L14 | A record file for a ticket that is not in the ledger, a line whose `ticket` ≠ the file stem, and an unexpected file name are problems. |
| L15 | **Outputs.** For every valid record with `output`, the file at `docs/metis-2.0/<output.path>` exists and its sha256 equals `output.sha256`. |

Invalid record lines (parse or `recordProblems` failures) are reported as `<file>:<line>: …`. They are
excluded from closure, so they never count as evidence.

PR rules (`prProblems`):

| # | Rule |
|---|---|
| P1 | Every ` ```json evidence ` block parses and passes `recordProblems`. |
| P2 | LOCALLY_TESTED: `commit` = the PR head SHA and `pr` = the PR number (so a new push makes the record stale). |
| P3 | LOCALLY_TESTED: the run `ci_run_id` exists, `path === '.github/workflows/build.yml'`, `head_sha === commit`, `status === 'completed'` and `conclusion === 'success'`. |
| P4 | Any record with `repro`: the run `repro.ci_run_id` exists, has the same workflow path, `head_sha === repro.commit`, is completed with `conclusion === 'failure'`, and `repro.commit` is an ancestor of `commit` (compare API `status === 'ahead'`). `repro.test` exists in the checkout. |
| P5 | Any record with `wired`: `client` and `contract_fake` exist in the checkout. |
| P6 | No block ⇒ no problems. Print "no evidence record in this pull request; nothing to verify". |

Sampling (`sample.mjs`):
- S1 population = closed tickets whose newest `recorded_at` is ≥ `--since`.
- S2 size k = ⌈0.10 × n⌉. That is 0 when n = 0, and at least 1 otherwise.
- S3 selection = the k ids with the smallest `sha256("<seed>:<id>")` hex, printed sorted by id. The seed
  is the gate commit SHA, so anyone can re-derive the draw, the lead cannot steer it, and no
  `Math.random` is involved.
- A re-executor appends records with `reexecuted_by`. R-REEX enforces "a different model". INV-2 makes a
  failed re-execution reopen the closure automatically: L9 fails until someone fixes it.

## 5. Public repo changes (Sonnet, branch `m2/M2-0002-evidence-chain`)

Style: match `scripts/check-bug-ledger.mjs` and `scripts/windows-signing-identity-preflight.{mjs,test.mjs}`.
That means ESM, no semicolons, single quotes, 2-space indent, and a short top comment that states what the
file guarantees. Every export gets a JSDoc typedef/param block. Use Node built-ins only: `node:fs`,
`node:path`, `node:crypto`, `node:util` `parseArgs`, `node:url`, and global `fetch`. For CLI entry use
the repo's guard `if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)`. Exit
codes: 0 ok, 1 problems, 2 usage (bad or missing flags, unreadable input). Keep functions short; rules
come from data tables, not branching.

### 5.1 `scripts/evidence/record.mjs` (NEW, ~180 LOC)

Exports:
```js
export const EVIDENCE_LEVELS   // frozen array of the six levels
export const KIT_STATUSES      // ['MET','PARTIAL','BLOCKED','NOT_MET']
export const RECORD_SCHEMA = 1
export function recordProblems(record)            // string[]; context-free (§3 incl. R-* rules)
export function parseRecordLines(text)            // { records: {record, line}[], problems: string[] } (JSONL, 1-based line numbers)
export function recordsInPrBody(body)             // { records: object[], problems: string[] }
export function latestByLevel(records)            // Map<level, record>; last in array order wins
export function readRecordStore(dir)              // { recordsByTicket: Map<id, record[]>, problems: string[] }
export function sha256Hex(bytesOrString)
```
Internals:
- `FIELDS`: a map from field name to a validator `(value) => string | null` (null means valid). The
  validators are small and named for the format: `isTicketId`, `isInstant`, `isSha1`, `isSha256`,
  `isPositiveInt`, `isSession`, `isEnvironment`, `isProgramPath`, `isRepoPath`, `isWired`,
  `isOwnerStatement`, `isRepro`, `isInheritedBlock`, `isDecisionIds`, `isKitStatusMap`.
- `ALWAYS = [...]` and `LEVEL_REQUIRES = { DESIGNED: [], LOCALLY_TESTED: ['pr','ci_run_id','environment','command','exit_code'], HOST_CONFIGURED: ['environment','command','exit_code','output'], LIVE_VERIFIED: ['artifact_sha256','build_run_id','environment','command','exit_code','output'], MEASURED: ['environment','command','exit_code','output'], ACCEPTED: ['owner_statement'] }`.
  Then add the environment-kind rules, R-DESIGNED, and the `exit_code` ⇔ `command` pairing.
- `present(v) = v !== undefined && v !== null`.
- `readRecordStore(dir)`: a missing dir gives an empty store. It reads `readdirSync` sorted, skips
  dotfiles, flags names not matching `^M2-\d{4}\.jsonl$`, parses each file, and adds `recordProblems` and
  the ticket-equals-stem check prefixed `records/<file>:<line>`. Only valid records go into the map, in
  file order.
- Problem strings name the field and the expected format, for example
  `ci_run_id: expected a positive integer`.

### 5.2 `scripts/evidence/check.mjs` (NEW, ~280 LOC)

Exports:
```js
export const TICKET_STATUSES
export const DECISION_STATES      // ['OPEN','ANSWERED_AS_DEFAULT','ANSWERED_CHANGED']
export const TEST_WORKFLOW = '.github/workflows/build.yml'
export function ledgerProblems(ledger, recordsByTicket)   // string[] sorted; L1-L13 + L14's "ticket not in ledger" (pure)
                                                          // (L14's file-name and stem checks live in readRecordStore)
export function outputProblems(recordsByTicket, programRoot) // string[]; L15 (reads files)
export function loadProgram(ledgerPath)   // { ledger, programRoot, recordsByTicket, problems }
                                          // programRoot = resolve(dirname(ledgerPath), '..'); records = <root>/evidence/records
export async function prProblems({ body, headSha, prNumber, github, fileExists })  // string[]; P1-P6
export function githubApi(repo, token, fetchImpl = fetch)
  // → { run(id) → Promise<{path, head_sha, status, conclusion} | null>, isAncestor(a, b) → Promise<boolean> }
  // GET https://api.github.com/repos/<repo>/actions/runs/<id> and /compare/<a>...<b>;
  // headers Accept: application/vnd.github+json, X-GitHub-Api-Version: 2022-11-28, Authorization: Bearer <token> when set.
  // 404 → null / false; any other non-OK status throws an Error naming the status (prProblems turns it into a problem).
```
Internals, each a small function: `ticketShapeProblems`, `cycleProblems`, `capsOf(t, byId)` (iterative
DFS with a visited set), `statusProblems(t, ctx)` dispatching on a `STATUS_RULES` table,
`recordContextProblems(t, records, decisions)`, `revalidationProblems(t, latest, decisions)`,
`runProblems(run, sha, conclusion)`.

CLI:
```
node scripts/evidence/check.mjs --ledger docs/metis-2.0/ledger/tickets.json
node scripts/evidence/check.mjs --pr-event "$GITHUB_EVENT_PATH"
```
Exactly one mode is allowed. `--ledger` prints `- <problem>` lines to stderr and exits 1, or prints
`evidence: OK, <n> tickets, <m> records` and exits 0. `--pr-event` reads the event JSON
(`pull_request.body ?? ''`, `pull_request.head.sha`, `pull_request.number`, `repository.full_name`),
builds `githubApi(full_name, process.env.GITHUB_TOKEN)`, and uses `fileExists = p =>
existsSync(join(repoRoot, ...p.split('/')))`, where `repoRoot` is two levels above the script.

### 5.3 `scripts/evidence/sample.mjs` (NEW, ~60 LOC)

```js
export function closedSince(ledger, recordsByTicket, since)   // string[] ids (S1); since: Date.parse-able
export function drawSample(ids, seed, fraction = 0.1)          // string[] (S2, S3)
```
CLI: `node scripts/evidence/sample.mjs --ledger <path> --since <YYYY-MM-DD|instant> --seed <string>`. It
uses `loadProgram` from `./check.mjs` and prints
`JSON.stringify({ since, seed, population, sample }, null, 2)`. A missing or empty `--seed`, or an
unparseable `--since`, exits 2.

### 5.4 `scripts/evidence/evidence.test.ts` (NEW, vitest wrapper, ~15 LOC)

This mirrors `scripts/windows-signing-identity-preflight.test.ts`. vitest only collects `.ts` tests, so this
file is how `npm test` (the Quality job on ubuntu and windows) runs the `node:test` suites. It also means
they run under the hermetic `test.env`: `spawnSync` inherits the worker's sandboxed HOME and TMPDIR.
```ts
it('runs the dependency-free evidence-chain node:test suites', () => {
  const suites = ['record', 'check', 'sample'].map((name) => join(__dirname, `${name}.test.mjs`))
  const result = spawnSync(process.execPath, ['--test', ...suites], { encoding: 'utf8', timeout: 60_000, maxBuffer: 1024 * 1024 })
  expect(result.error).toBeUndefined()
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)
})
```

### 5.5 `.github/workflows/evidence.yml` (NEW)

```yaml
name: Evidence

# Verifies evidence records pasted into a pull request body: a LOCALLY_TESTED record must name a green
# Build & Test run on this PR's head commit, and a fix's red-before run must be a failed run on an
# ancestor commit. A PR body without a record makes no claim and passes.
on:
  pull_request:
    types: [opened, edited, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  actions: read

concurrency:
  group: evidence-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  record:
    name: Evidence record
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22.22.3
      - name: Verify the evidence records in the PR body
        run: node scripts/evidence/check.mjs --pr-event "$GITHUB_EVENT_PATH"
        env:
          GITHUB_TOKEN: ${{ github.token }}
```
The workflow does not touch `build.yml`: its contract tests pin that file, and `npm test` already runs the
suites.

### 5.6 `.github/pull_request_template.md` (EDIT)

- Under `## Ticket`, add three bullets:
  - `- Evidence record: \`docs/metis-2.0/evidence/records/M2-____.jsonl\` (private program repository)`
  - `- Implementer model: <!-- e.g. claude-sonnet-5 -->`
  - `- Reviewing model: <!-- the validator; its session must differ from the implementer's -->`
- In the Evidence table, change the Tests row's Command cell to
  `red run URL (fixes: the new test failing before the fix) → green run URL on the head commit`.
- Replace `Evidence level reached:` with
  `Evidence levels recorded: <!-- any of DESIGNED, LOCALLY_TESTED, HOST_CONFIGURED, LIVE_VERIFIED, ACCEPTED, MEASURED; a set, not a ladder -->`.
- Add a new section `## Evidence record` before `## Validation`. It contains only an HTML comment: "Once
  Build & Test is green on the head commit, the validator adds the record here as one fenced code block
  whose info string is `json evidence` (fields: evidence/SCHEMA.md in the program repository). The Evidence
  check verifies it against this PR's head commit and the named runs. A new push makes it stale; replace
  it. The same record is then appended unchanged to the record file above." The comment must **not**
  contain a literal fence line.
- In `## Validation`, replace the Opus line with
  `- [ ] Evidence record added and the Evidence check is green; Opus validation recorded in the ticket (the reviewer's session is not the implementer's)`,
  and change the first item to `- [ ] Failing test written first (bugs) and kept; its failing run is the record's \`repro\``.

## 6. Private repo changes (written uncommitted by the implementer; the lead reviews and commits)

### 6.1 `docs/metis-2.0/evidence/SCHEMA.md` (NEW)

1. **ADR-017. Release evidence chain and readiness labels.**
   - Status: ACCEPTED on M2-0002 closure.
   - Context: false closure (ChatGPT §5, F-18), D-28 (CI only), and the public/private split.
   - Decision: INV-1..INV-8 in plain words, plus the lifecycle from §2.
   - Alternatives rejected:
     - Prose evidence in ticket logs: unverifiable.
     - JSON Schema + ajv: a new dependency and a second source that drifts from the code.
     - Verifying CI runs from the private ledger: the API cost grows with every record, and it needs
       cross-repo tokens.
     - A public copy of the ledger: program documents are private.
   - Consequences:
     - (+) Closure is mechanical.
     - (+) The one fact only public CI can prove is proven there.
     - (−) The lead's copy step from the verified PR block to the record file is a trust boundary; sampling
       re-execution is the backstop.
     - (−) The Ledger workflow needs Actions minutes on the private repo.
     - (−) Records are hand-written JSON; the check rejects malformed ones.
2. **Readiness labels.**
   - Ticket readiness is its status (vocabulary and meaning as in §6.2).
   - Kit-reference readiness is the per-record `MET/PARTIAL/BLOCKED/NOT_MET`, including the "wired for
     real" definition: a real client code path with no production stub, a schema-faithful contract fake
     used only in tests, a one-command live probe, and BLOCKED with the unblock step visible in the in-app
     capability matrix. Anything less is NOT_MET.
   - Evidence readiness is the level set.
   - Component labels in ARCHITECTURE (DESIGN_READY…) stay informal.
   - Per-platform release readiness (M2-REL-01) is M2-0171's decision computed over these records.
     `environment.kind` keeps macOS and Windows evidence separate.
3. **Record fields and formats.** §3, verbatim in reference form, with one worked example per level. Use
   synthetic values; the LOCALLY_TESTED example is this ticket's own record.
4. **Host labels.** Registry table: `ubuntu-latest` and `windows-latest` (CI), `qa-mac-1` (the QA macOS
   user, M2-0007), `windows-laptop-1` (M2-0195), `owner-mac` (owner account, promoted builds only).
5. **Closure rules.** §4 L1-L15, P1-P6, S1-S3.
6. **How to record.** The lifecycle from §2 and the `jq -c` append.
   - Never edit a line.
   - Raw outputs are committed under `evidence/raw/<ticket>/`.
   - Re-execution records set `reexecuted_by`.
7. A statement that `scripts/evidence/record.mjs` in the public repo is authoritative wherever this text
   and the code differ.

### 6.2 `docs/metis-2.0/README.md` (EDIT)

Change the "Evidence levels" bullet to end with "…distinct and unordered; see
[`evidence/SCHEMA.md`](evidence/SCHEMA.md)". Add `evidence/` to the Index table. Append two sections:

**Ticket status.** A table with one row per status (meaning; what the check enforces):
- TODO: not started.
- IN_PROGRESS: claimed. Every dependency is ready. A ticket over 12 h has slices of at most 10 h.
- ENGINEERING_COMPLETE: DESIGNED and LOCALLY_TESTED evidence (where required) passed. Closure waits on the
  ticket's own external blocker or an inherited one, and its records list every inherited block.
- BLOCKED_EXTERNAL: cannot proceed without an outside owner. `external_blocker` names the owner role, the
  exact unblock step, needed_by and raised_on.
- DEFERRED: shipped flag-off (the `flag` is named), with the owner's dated approval (an ACCEPTED record)
  under the degrade order D-14.
- DONE: every required level has a latest PASS record, validated by a different session, with no inherited
  block. The one exception is the program sign-off (`closes_program`, M2-0184, PD-27), which lists each
  inherited block with its unblock step.
- CANCELLED: will not be done. The reason is recorded. Never deleted.

**Dependencies and decisions.** The acceptance text of M2-0002 item 3, verbatim. It adds that "the
affected verification is re-run" means a new record at each required level without `inherited_block`,
and that "the check lists those tickets" refers to rule L13.

### 6.3 `docs/metis-2.0/evidence/records/.gitkeep` (NEW, empty)

### 6.4 `.github/workflows/ledger.yml` in the private repo (NEW)

```yaml
name: Ledger

# Computes ticket closure from the ledger and the evidence records with the public evidence scripts.
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
    inputs:
      since:
        description: Previous gate date (YYYY-MM-DD) to draw the 10% re-execution sample; empty skips it
        required: false
        type: string

permissions:
  contents: read

jobs:
  ledger:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
        with:
          repository: mysticalsin/AskToto-Mantu
          ref: m2/integration
          path: public
          sparse-checkout: scripts/evidence
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22.22.3
      - name: Evidence records are append-only
        if: github.event_name == 'push' && github.event.before != '0000000000000000000000000000000000000000'
        env:
          BEFORE: ${{ github.event.before }}
        run: |
          if git diff --unified=0 "$BEFORE" HEAD -- docs/metis-2.0/evidence/records | grep -E '^-[^-]'; then
            echo "An evidence record line was edited or removed; records are append-only." >&2
            exit 1
          fi
      - run: node public/scripts/evidence/check.mjs --ledger docs/metis-2.0/ledger/tickets.json
      - name: Draw the re-execution sample
        if: github.event_name == 'workflow_dispatch' && inputs.since != ''
        env:
          SINCE: ${{ inputs.since }}
        run: node public/scripts/evidence/sample.mjs --ledger docs/metis-2.0/ledger/tickets.json --since "$SINCE" --seed "$GITHUB_SHA"
```
The append-only step makes INV-2 mechanical at no code cost. Switch `ref` to `main` when m2/integration
lands on main.

### 6.5 Lead-only actions before enabling `ledger.yml` (ledger edits are the orchestrator's, PD-13)

These are the problems the first real run will report. Each was OBSERVED today by reading
`tickets.json`:
1. Add the top-level `decisions` register for D-1..D-30. Use `OPEN` for OPEN rows. For D-7, D-10, D-28 and
   D-30, choose `ANSWERED_AS_DEFAULT` or `ANSWERED_CHANGED` against their recorded default. Add
   `closes_program` and `decisions` to `schema.fields`, and `decision_state` to `schema.enums`.
2. Set `"closes_program": true` on M2-0184.
3. M2-0214 lacks `needs_decision`, `required_evidence`, `validation_hours`, `slices` and `due`. Fill them
   (L1).
4. M2-0041 is IN_PROGRESS, but its dependency M2-0005 is TODO (L3). Either return it to TODO or record why
   the dependency edge is wrong.
5. M2-0001 and M2-0024 are DONE without records (L9). Backfill them:
   - M2-0001 needs a LOCALLY_TESTED record with a Build & Test run on the PR #201 head SHA. The existing
     run 36267674617 is on the merge commit `56677e7d`, not the PR head. If no run exists on the head,
     push that SHA to a throwaway branch to get one.
   - M2-0024 needs a DESIGNED record with `pr: 205` and `commit` = its head.
6. Create `evidence/records/.gitkeep`, commit §6.1-§6.4, then run the Ledger workflow once and attach the
   run URL to M2-0002.

## 7. What NOT to do

- No dependency: no ajv, no JSON-Schema file, no YAML library. Node built-ins only.
- No CLI that writes or rewrites records. Under D-28 nothing could run it, and any "update record" helper
  would contradict INV-2.
- Public CI must never read the private repo: no PAT, no deploy key, no secrets, no `pull_request_target`.
- Never interpolate `${{ github.event.pull_request.body }}` (or any event text) into `run:`. The script
  reads `$GITHUB_EVENT_PATH`.
- Do not shell out to `gh` from scripts. Use `fetch` through the injected `githubApi`.
- Do not edit `build.yml`. Its contract tests pin it, and the wrapper already runs under `npm test`.
- Do not hard-code ticket ids (M2-0184, M2-0166…), decision ids or the ledger path in scripts. Use the
  `closes_program` flag and the CLI arguments.
- Do not parse DECISIONS.md or any markdown. Use the `decisions` register.
- Do not order or compare evidence levels anywhere (INV-3).
- Do not use `Math.random` or wall-clock time in any rule. The only date input is the sampler's `--since`.
- Do not compute TRACEABILITY (the future records-based matrix), the release decision (M2-0171), velocity
  (M2-0197) or hot-file claims (M2-0188).
- Use no real ledger content in tests: no real titles, no real run ids. All fixtures are built in the test
  (`'a'.repeat(40)`, run id `101`). For R-SAFE, use `someone@example.com` and a `/home/example/…` path.
  Both are reserved, synthetic values, and the file is a `.test.mjs` (gitleaks allowlist).
- No source-text or regex tests of the scripts. Test behaviour through the exported functions and the
  CLIs' exit codes.
- Do not run any of it locally (D-28). The only local command allowed is
  `npx tsc --noEmit -p tsconfig.node.json`. The wrapper must add zero errors to the `check-test-types`
  ratchet.
- Do not change ledger status or register fields in this PR. That is the lead's job (§6.5).

## 8. Tests: red first, then implementation

Commit 1 contains the three `.test.mjs` suites and the wrapper, with exports imported but no
implementation. Push it; the Build & Test run goes red (module not found). Then implement. Record both run
URLs in the PR. Fixtures are builder functions: `record(overrides)` returns a valid LOCALLY_TESTED record;
`ledger({ tickets, decisions })` fills ticket defaults. Assert with a helper
`assertProblem(problems, ...fragments)` that checks some problem contains every fragment. Use
`assert.deepEqual(problems, [])` for the OK cases.

### 8.1 `record.test.mjs`
| # | Behaviour |
|---|---|
| R1 | A complete record at each of the six levels (one builder per level) has no problems |
| R2 | An unknown key is rejected and named |
| R3 | Each ALWAYS field missing yields a problem naming it (table-driven) |
| R4 | `evidence_level` `VERIFIED` / `locally_tested` is rejected |
| R5 | For each level, removing each field in `LEVEL_REQUIRES[level]` yields a problem (table-driven) |
| R6 | LOCALLY_TESTED with `environment.kind: 'qa-mac'` is rejected; LIVE_VERIFIED and HOST_CONFIGURED with `kind: 'ci'` are rejected |
| R7 | The same session id as implementer and validator is rejected (R-SEP) |
| R8 | `reexecuted_by` with the implementer's model is rejected; a different model with a fresh id passes (R-REEX) |
| R9 | PASS with `exit_code: 1` and FAIL with `exit_code: 0` are rejected (R-EXIT) |
| R10 | A BLOCKED kit status without `wired` gives "counts as NOT_MET". A complete `wired` passes. `contract_fake: 'src/main/x.ts'`, `client: 'src/main/x.test.ts'` and `probe: 'a && b'` are each rejected |
| R11 | A `/home/example/…` path in `command` and an email in `owner_statement.text` are rejected (R-SAFE) |
| R12 | `output.path` values `../x`, `/abs` and `a\\b` are rejected |
| R13 | `repro.commit === commit` is rejected; `repro.test: 'src/main/x.ts'` is rejected |
| R14 | DESIGNED with neither `output` nor `pr` is rejected; either one alone passes |
| R15 | Optional fields set to `null` count as absent |
| R16 | `parseRecordLines`: two lines give two records with line numbers. A bad JSON line reports its 1-based line. CRLF parses. A blank middle line is a problem |
| R17 | `recordsInPrBody` extracts ` ```json evidence ` blocks. It ignores ` ```json ` blocks and a block inside `<!-- -->`. Malformed JSON gives a problem |
| R18 | `latestByLevel` returns the last record per level in array order |
| R19 | `readRecordStore` on a temp dir: a missing dir gives an empty store. `.gitkeep` is ignored. `notes.txt` is flagged. A line whose ticket ≠ the file stem is flagged. Invalid lines are excluded from the map |

### 8.2 `check.test.mjs`
| # | Behaviour |
|---|---|
| C1 | DONE with a PASS record per required level, deps DONE, and valid context: no problems |
| C2 | DONE missing a required level: the problem names the ticket and the level |
| C3 | DONE whose last LOCALLY_TESTED line is FAIL after an earlier PASS: problem (latest governs) |
| C4 | `required_evidence` of `['VERIFIED']`, `['LOCALLY_TESTED','LOCALLY_TESTED']`, `[]` or missing: each is a problem |
| C5 | Status `READY` is a problem |
| C6 | IN_PROGRESS with a TODO dependency: problem. With dependencies ENGINEERING_COMPLETE, DONE, DEFERRED and BLOCKED_EXTERNAL: ok |
| C7 | IN_PROGRESS: 14 h without slices is a problem. 14 h with an 11 h slice is a problem. 14 h with 8 h + 6 h passes. 12 h without slices passes |
| C8 | DONE directly downstream of BLOCKED_EXTERNAL: problem "only as ENGINEERING_COMPLETE" |
| C9 | A BLOCKED_EXTERNAL ← B ENGINEERING_COMPLETE ← C DONE: problem on C (transitive cap) |
| C10 | ENGINEERING_COMPLETE downstream of blocked A: a problem when a latest record lacks `inherited_block` A; passes with it |
| C11 | ENGINEERING_COMPLETE with no external_blocker and no caps: problem |
| C12 | Upstream now DONE, downstream DONE whose latest record still carries `inherited_block`: problem. After appending a clean record: ok |
| C13 | `closes_program` DONE with caps: passes when latest records list every root; problem when one root is missing. Two `closes_program` tickets: problem |
| C14 | A fix ticket DONE (LOCALLY_TESTED required) without `repro`: problem; with it: ok. A fix requiring only MEASURED needs no `repro` |
| C15 | `kit_refs` missing one of the ticket's refs, or carrying an extra one: problem |
| C16 | A `finding_refs` entry not on the ticket: problem |
| C17 | Decisions. D-13 OPEN without `assumed_decisions: ['D-13']`: "unlabelled assumption". With it: ok. D-13 `ANSWERED_CHANGED` on a DONE ticket whose latest record assumes it: "re-validate". `ANSWERED_AS_DEFAULT`: ok. A needs_decision missing from the register: problem. No register: problem |
| C18 | DEFERRED without `flag`: problem. With `flag` but no ACCEPTED PASS: problem. With both: ok |
| C19 | CANCELLED without `reason`: problem |
| C20 | BLOCKED_EXTERNAL with `external_blocker: null`, or missing `unblock_step`: problem |
| C21 | A dependency cycle A↔B is reported once. An unknown dependency id: problem |
| C22 | Records keyed to a ticket absent from the ledger: problem |
| C23 | `outputProblems`: a missing file and a hash mismatch are each a problem; a matching file passes (temp dir) |
| C24 | CLI `--ledger`. On a temp program tree (`<root>/ledger/tickets.json`, `<root>/evidence/records/M2-0001.jsonl`, `<root>/evidence/raw/...`): a valid tree exits 0. Appending a FAIL line exits 1 with the ticket id in stderr. No arguments, or both modes, exits 2 |
| P1 | `prProblems` with no block: `[]` |
| P2 | A valid LOCALLY_TESTED block with a fake `github` (green build.yml run on the head SHA): `[]` |
| P3 | `commit` ≠ head SHA (a push after the record): problem. `pr` ≠ the PR number: problem |
| P4 | Run on another workflow path, on another SHA, `in_progress`, `failure`, or `run()` returning null: each is a problem |
| P5 | `repro`: the red run succeeded, or is not an ancestor, or `repro.test` is missing (`fileExists` false): each is a problem. A valid red run passes |
| P6 | `wired` paths missing in the checkout: problem |
| P7 | `github.run` throwing (HTTP 500) becomes a problem, not a crash |
| G1 | `githubApi` with a fake `fetch`: the run URL includes the repo and id. The bearer header is sent only when a token is given. 404 → `null`. The compare URL uses `a...b`. `status 'ahead'` → true and `'diverged'` → false |

### 8.3 `sample.test.mjs`
| # | Behaviour |
|---|---|
| S1 | The population holds DONE and ENGINEERING_COMPLETE tickets whose newest `recorded_at` ≥ since. It excludes TODO, IN_PROGRESS, DEFERRED and CANCELLED tickets and closures before since |
| S2 | Size: 0 of 0, 1 of 1, 1 of 10, 2 of 11, 3 of 30 |
| S3 | The same seed gives the same sample, and a shuffled input gives the same sample. Two fixed different seeds over 30 ids give different samples (deterministic assertion) |
| S4 | CLI prints JSON with `population` and `sample` and exits 0. A missing `--seed` exits 2 |

### 8.4 CI evidence to record (the PR's own record; this ticket is `type: process`, so `repro` is optional)

- The red run from commit 1, then the green Build & Test run on the head, both Quality jobs green.
- The Evidence workflow run that verified this PR's own ` ```json evidence ` block (dogfood).
- Suggested kit statuses:
  - M2-REL-01 `PARTIAL`: per-platform release states are M2-0171's.
  - F-18 `PARTIAL`: qualification evidence arrives with M2-0187 and M2-0007.
  - FLOW-12 `PARTIAL`: only the "resume from evidence" part.

## 9. Acceptance amendments (proposed)

- **A1 (schema as code).** "JSON schema for evidence records" is met by the field and level tables in
  `scripts/evidence/record.mjs` and documented in SCHEMA.md. There is no separate JSON-Schema file: a
  second source would drift, and the repo has no validator dependency. Records are JSON Lines: one file
  per ticket, `records/<ticket>.jsonl`, append-only, where the latest record per level governs. Fields
  added beyond the list are `schema`, `recorded_at`, `pr`, `build_run_id`, `output`, `owner_statement`,
  `assumed_decisions`, `reexecuted_by` and `wired`. Each supports a rule the acceptance already states.
- **A2 (where checks run, D-28).** "node --test scripts/evidence/check.test.mjs" runs in CI through the
  vitest wrapper `scripts/evidence/evidence.test.ts`, under `npm test` on ubuntu and windows.
  "node scripts/evidence/check.mjs --ledger docs/metis-2.0/ledger/tickets.json" runs in the private repo's
  Ledger workflow (§6.4), never on a Mac. If that repo cannot get Actions minutes, the ticket closes
  ENGINEERING_COMPLETE, with the external blocker "Program owner: allow Actions minutes for the private
  program repository".
- **A3 (CI run on the PR head is proven, not asserted).** Add `.github/workflows/evidence.yml`. It verifies
  records in the PR body against the event's head SHA and the Actions API (P1-P6), including red-before
  ancestry for fixes.
- **A4 (PR template).** "Requires the evidence record path and the reviewing model" means template fields
  plus an `## Evidence record` section. Enforcement falls on the record the Evidence check verifies, not
  on free-text fields.
- **A5 (decision register).** The ledger gains a top-level `decisions` register
  (`OPEN`/`ANSWERED_AS_DEFAULT`/`ANSWERED_CHANGED`). Records label assumptions in `assumed_decisions`, and
  L13 lists the tickets to re-validate. DECISIONS.md stays the human register.
- **A6 (program sign-off).** The exception is keyed on a ledger flag, `closes_program: true` (set on
  M2-0184), not on a hard-coded id.
- **A7 (DEFERRED approval).** "A recorded owner approval" is an ACCEPTED record, the owner's dated
  statement, plus a non-null `flag`.
- **A8 (scope_paths).** Add `scripts/evidence/record.test.mjs`, `scripts/evidence/sample.test.mjs`,
  `scripts/evidence/evidence.test.ts`, `.github/workflows/evidence.yml`,
  `docs/metis-2.0/evidence/records/.gitkeep` and private `.github/workflows/ledger.yml`.
- **A9 (lead actions).** The §6.5 items are the lead's, not the implementer's. They are prerequisites for
  verification 2.

## 10. Known limits (documented, out of scope)

- **The copy step is a trust boundary.** The ledger check cannot tell that a LOCALLY_TESTED line is the
  one the Evidence workflow verified. The record's `pr` lets a re-executor re-verify, and sampling is the
  backstop.
- **Hashes prove bytes, not provenance.** An `output` hash shows the file is unchanged, not that a harness
  produced it. "Never prose" is enforced by review and re-execution. `artifact_sha256` is tied to its lane
  only by `build_run_id`, which a re-executor can check against the lane's provenance file.
- **Red-before is proven at run level.** P4 proves a failed Build & Test run on an ancestor commit, not
  which test failed. The validator reads the red log.
- **Green means the whole run.** "Green" requires the entire Build & Test run to succeed, Security
  included. This is stricter than "the tests passed", and intentional.
- **`recorded_at` is self-reported.** Only the sampler uses it.
- **Append-only covers pushes to the private `main`.** A rewrite of private history is visible only in
  git.
- **`wired` existence is checked only in PR mode**, against the public checkout. "No production stub" is
  judged by review.
- **Private Actions minutes are ASSUMED available.** The account previously hit its Actions budget. Verify
  on the first Ledger run.

## 11. Size estimate

- Production: about 520 LOC (record ~180, check ~280, sample ~60), plus 30 lines of workflow and about 20
  lines of template.
- Tests: about 600 LOC.
- Private docs: SCHEMA.md about 250 lines, README about 40 lines.
- Time: about 6 h for slice .2, including the red and green CI rounds. The lead's §6.5 actions take
  about 1 h.
