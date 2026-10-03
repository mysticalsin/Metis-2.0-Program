# Evidence chain: schema, readiness labels and closure rules

Only the orchestrator edits `ledger/` and merges into this repository's history (PD-13); this document
is otherwise normative wherever it does not conflict with `scripts/evidence/record.mjs` and
`scripts/evidence/check.mjs` in the public repository (§7).

## 1. ADR-017 — Release evidence chain and readiness labels

**Status.** ACCEPTED on M2-0002 closure.

**Context.** The program's biggest risk is false closure: a persuasive report, or a green unit test run,
being read as proof that something works (ChatGPT audit §5, finding F-18). Two constraints shape the fix.
D-28 (owner decision, 2026-09-26): no repository script, test or app runs on any Mac — every check runs in
GitHub Actions. And this program's plan, ledger and evidence are private, while the app's code and CI are
public (`mysticalsin/AskToto-Mantu`) — so public CI can never read this repository, and this repository's
own CI (checking the ledger) can never assume it is checking out a trustworthy copy of the public one
without saying which commit.

**Decision.** Every fact a ticket's status depends on is recorded as one immutable JSON object — a
*record* — that points only at checkable references (a 40-hex commit, a positive Actions run id, a PR
number, a sha256 of a committed file or packaged artifact, a host label, a session id). Free text appears
in exactly four places (`command`, `unblock_step`, `owner_statement.text`, `wired.probe`) and never
substitutes for one of those references (INV-1). Records are append-only, one JSONL file per ticket under
`evidence/records/<ticket>.jsonl`; for each evidence level, the *last* line with that level is that
level's current evidence, so a later FAIL (a failed re-execution, say) withdraws an earlier PASS without
anyone editing history (INV-2). The six evidence levels — `DESIGNED`, `LOCALLY_TESTED`, `HOST_CONFIGURED`,
`LIVE_VERIFIED`, `ACCEPTED`, `MEASURED` — are a *set*: distinct, unordered, and no code anywhere compares
or orders them (INV-3). A checker (`scripts/evidence/check.mjs`, public repository) computes whether a
ticket's status is *supported* by its records and its dependency graph; it never infers a status, only
accepts or rejects the one the orchestrator already wrote (INV-4). Verification splits by where each fact
is authoritative:

- **Public CI** (`.github/workflows/evidence.yml` in the public repository) verifies a record pasted into
  a pull request's body against that PR's own head commit and the GitHub Actions API. This is the only
  place "a CI run on the PR head SHA" can be proven, because only public CI can see the public repository's
  own Actions history for that exact commit.
- **This repository's own CI** (`.github/workflows/ledger.yml`; design document
  `docs/metis-2.0/designs/M2-0002-DESIGN.md` §6.4) runs the same public scripts, via a
  sparse checkout of the public repository's `scripts/evidence/`, against `ledger/tickets.json` and
  `evidence/records/` here, to compute closure for every ticket.
- **No record-writing CLI exists.** Nothing could run it under D-28. The validator pastes the verified
  record into the PR body; the lead appends the same JSON, compacted to one line, to the record file here.

**Alternatives rejected.**
- *Prose evidence in ticket logs.* Unverifiable — exactly the false-closure risk this ADR exists to close.
- *JSON Schema + a validator library (ajv).* A new dependency, and a second source of truth (the schema
  file) that drifts from the code that actually enforces it. `scripts/evidence/record.mjs` in the public
  repository is normative; this document explains it in prose but never overrides it.
- *Verifying CI runs from this repository's own ledger check.* The GitHub API cost grows with every
  historical record, and it would need a cross-repository token — a public/private boundary this program
  otherwise refuses to cross.
- *Publishing a copy of the ledger into the public repository.* Program documents (the plan, the ledger,
  reviews) are private by design; only the evidence *scripts* are public.

**Consequences.**
- (+) Closure is mechanical: a ticket may not claim DONE or ENGINEERING_COMPLETE without a checker-passing
  reason.
- (+) The one fact only public CI can prove — a green run on this exact commit — is proven exactly there,
  never asserted by a session that ran the tests nowhere.
- (−) The lead's copy step, from the Evidence-check-verified PR block into the private record file, is a
  trust boundary the ledger check cannot itself close. Sampling re-execution (`scripts/evidence/sample.mjs`,
  §5) is the backstop: about 10% of recently closed tickets are re-run by a different model every gate.
- (−) This repository's own `ledger.yml` workflow needs GitHub Actions minutes on this (private) repository.
  Verify this on the first real run (design document §6.5 item 6) — the account has previously hit its Actions budget. If
  it cannot get minutes, a ticket that would otherwise be DONE closes ENGINEERING_COMPLETE instead, with
  the external blocker "Program owner: allow Actions minutes for the private program repository".
- (−) Records are hand-written JSON, not generated by a tool; `scripts/evidence/check.mjs` rejects a
  malformed one outright rather than tolerating it.

## 2. Readiness labels

Four different things in this program are each called "ready" in a different sense. Keep them separate:

1. **Ticket readiness** is the ticket's `status` (vocabulary and meaning: `README.md` §"Ticket status").
2. **Kit-reference readiness** is the per-record `kit_refs` value: `MET`, `PARTIAL`, `BLOCKED` or
   `NOT_MET`. **"Wired for real"** is the bar a kit reference must clear before it may be anything other
   than `NOT_MET` while its client code is in place but not fully proven: a real client code path with **no
   production stub**, a schema-faithful **contract fake used only in tests**, a **one-command live probe**
   script, and, if it is `BLOCKED`, the exact **unblock step** visible in the in-app capability matrix.
   Anything less counts as `NOT_MET` — `scripts/evidence/record.mjs`'s `recordProblems` enforces this
   mechanically (rule R-WIRED) whenever a record marks a kit reference `BLOCKED`.
3. **Evidence readiness** is the set of evidence levels a ticket's records currently carry a PASS for
   (INV-3: a set, never a ladder — `LOCALLY_TESTED` does not imply `DESIGNED`, and having `LIVE_VERIFIED`
   does not excuse a missing `LOCALLY_TESTED` that the ticket's own `required_evidence` lists).
4. **Component labels** in `ARCHITECTURE.md` (`DESIGN_READY`, …) describe the target architecture's own
   maturity and stay informal — they are not evidence levels and no record or check references them.
   **Per-platform release readiness** (kit reference M2-REL-01) is a *decision* computed over these
   records by M2-0171, not a label this schema defines; `environment` (its `kind` and `host`) keeps macOS
   and Windows evidence distinguishable for that later computation.

## 3. Record fields and formats

Normative source: `scripts/evidence/record.mjs` (exports `EVIDENCE_LEVELS`, `KIT_STATUSES`,
`RECORD_SCHEMA`, `recordProblems`, and the JSONL/PR-body parsers) in the public repository
(`mysticalsin/AskToto-Mantu`). This section is the prose reference; wherever it and the code disagree, the
code governs (§7).

A record is one JSON object. Unknown top-level keys are errors. An absent or `null` optional key means
"not applicable" for that record; a key that *is* present must be valid even on a level that does not
require it.

| Field | Format | Required |
|---|---|---|
| `schema` | the number `1` | always |
| `ticket` | `^M2-\d{4}$` | always |
| `evidence_level` | one of the six levels | always |
| `recorded_at` | UTC instant `YYYY-MM-DDTHH:MM:SSZ` | always |
| `kit_refs` | object: kit ref → `MET`\|`PARTIAL`\|`BLOCKED`\|`NOT_MET` | always (ledger check: keys = the ticket's `kit_refs`, exactly) |
| `finding_refs` | array of non-empty strings, may be `[]` | always |
| `commit` | 40 lowercase hex | always |
| `result` | `PASS`\|`FAIL` | always |
| `implementer_session`, `validator_session` | `{ model, id }` | always; `validator_session.id` ≠ `implementer_session.id` |
| `pr` | positive integer (public PR number) | `LOCALLY_TESTED`; `DESIGNED` if no `output` |
| `ci_run_id` | positive integer: the GitHub Actions run that executed `command` (for `LOCALLY_TESTED`, the Build & Test run) | `LOCALLY_TESTED`; `HOST_CONFIGURED`, `LIVE_VERIFIED` and `MEASURED` when `kind: 'hosted-runner'` |
| `environment` | `{ kind, host }` | `LOCALLY_TESTED` (`kind: 'ci'`), `HOST_CONFIGURED`/`LIVE_VERIFIED` (`kind` ≠ `'ci'`), `MEASURED` (any) |
| `command` | non-empty single-line string | `LOCALLY_TESTED`, `HOST_CONFIGURED`, `LIVE_VERIFIED`, `MEASURED` |
| `exit_code` | integer | whenever `command` is present; `PASS` ⇔ `0` |
| `output` | `{ path, sha256 }`, a file under this repository's `docs/metis-2.0/` | `HOST_CONFIGURED`, `LIVE_VERIFIED`, `MEASURED`; `DESIGNED` if no `pr` |
| `artifact_sha256` | 64 lowercase hex (packaged bytes, build lane M2-0187) | `LIVE_VERIFIED` |
| `build_run_id` | positive integer (the `qa-candidate` run that produced the artifact) | `LIVE_VERIFIED` |
| `owner_statement` | `{ date: YYYY-MM-DD, text }` | `ACCEPTED` |
| `repro` | `{ test, commit, ci_run_id }`, the red-before run | fix tickets' `LOCALLY_TESTED` record (ledger rule L11) |
| `reexecuted_by` | `{ model, id }`, model differs from the implementer's | re-execution records only |
| `assumed_decisions` | array of `^D-\d+$` | when the ticket has `needs_decision` entries (rule L12) |
| `inherited_block` | array of `{ ticket, unblock_step }` | when capped by an ancestor (rule L10) |
| `wired` | `{ client, contract_fake, probe, capability, unblock_step }` | whenever any `kit_refs` value is `BLOCKED` |

**Sub-formats.** `session` `{ model, id }`: `model` is a lowercase dotted id (`claude-sonnet-5`,
`claude-opus-5-5`, or `human` for a person); `id` is an opaque session id — never a name or an email.
`environment` `{ kind, host }`: `kind` ∈ `ci`, `qa-mac`, `windows-laptop`, `windows-runner`, `owner-mac`
(ARCHITECTURE §7.1), `hosted-runner` (OD-26); `host` is a label registered in §4 below. A
`hosted-runner` record is a GitHub-hosted image used as the live host: its `host` is `macos-latest` or
`windows-latest`, nothing else, and it is never valid for `LOCALLY_TESTED`. A program path (`output.path`) and a repo
path (`repro.test`, `wired.client`, `wired.contract_fake`) are both a relative POSIX path with no leading
`/`, no `\`, and no empty, `.` or `..` segment — just resolved against different roots. A *test path*
matches `\.(test|spec)\.[cm]?[jt]sx?$`; a *test-only* path is a test path or a path with a `__mocks__/`,
`fixtures/` or `test/` segment. `wired.client` must **not** be test-only; `wired.contract_fake` **must
be**; `wired.probe` is one command with none of `&&`, `||`, `;` or `|`.

**Cross-field rules** (record-local, all enforced by `recordProblems`): the implementer's and validator's
session ids must differ (a reviewer never approves its own work); a re-execution's model must differ from
the implementer's, and its id must be fresh; `result` must agree with `exit_code` exactly; a fix's `repro`
commit must be *earlier* than the record's own `commit`; a `BLOCKED` kit status needs a complete `wired`
or it counts as `NOT_MET`; `DESIGNED` needs an `output` or a `pr`; a `hosted-runner` record at
`HOST_CONFIGURED`, `LIVE_VERIFIED` or `MEASURED` needs `ci_run_id` (it may equal `build_run_id` when one
run built and tested the bytes); and **no string, anywhere in the
record, may contain a user home path or an email address** (INV-7) — records are pasted verbatim into
public pull request bodies.

**Worked examples.** Every field below is a synthetic placeholder for illustration only — none of these
three records has been recorded for any real ticket. In particular, M2-0002's own real `LOCALLY_TESTED`
record is pasted into its pull request, and verified there, only after this round's Build & Test is green
on its head commit (§6); it is not the second example below.

```json evidence
{
  "schema": 1,
  "ticket": "M2-9000",
  "evidence_level": "DESIGNED",
  "recorded_at": "2026-09-26T00:00:00Z",
  "kit_refs": { "EXAMPLE-01": "PARTIAL" },
  "finding_refs": ["EXAMPLE-F1"],
  "commit": "0000000000000000000000000000000000000001",
  "pr": 1,
  "result": "PASS",
  "implementer_session": { "model": "claude-opus-5-5", "id": "example-design-session-1" },
  "validator_session": { "model": "claude-opus-5-5", "id": "example-design-session-2" }
}
```

```json evidence
{
  "schema": 1,
  "ticket": "M2-9000",
  "evidence_level": "LOCALLY_TESTED",
  "recorded_at": "2026-09-26T00:00:00Z",
  "kit_refs": { "EXAMPLE-01": "PARTIAL" },
  "finding_refs": ["EXAMPLE-F1"],
  "commit": "0000000000000000000000000000000000000003",
  "pr": 1,
  "ci_run_id": 1,
  "environment": { "kind": "ci", "host": "ubuntu-latest" },
  "command": "npm test",
  "exit_code": 0,
  "result": "PASS",
  "implementer_session": { "model": "claude-sonnet-5", "id": "example-impl-session-1" },
  "validator_session": { "model": "claude-opus-5-5", "id": "example-validate-session-1" }
}
```

```json evidence
{
  "schema": 1,
  "ticket": "M2-9000",
  "evidence_level": "LIVE_VERIFIED",
  "recorded_at": "2026-09-26T00:00:00Z",
  "kit_refs": { "EXAMPLE-01": "MET" },
  "finding_refs": [],
  "commit": "0000000000000000000000000000000000000002",
  "artifact_sha256": "00000000000000000000000000000000000000000000000000000000000000aa",
  "build_run_id": 1,
  "environment": { "kind": "qa-mac", "host": "qa-mac-1" },
  "command": "node scripts/check-packaged-launch.mjs release/mac-universal/Metis.app",
  "exit_code": 0,
  "output": { "path": "evidence/raw/M2-9000/launch.json", "sha256": "00000000000000000000000000000000000000000000000000000000000000bb" },
  "result": "PASS",
  "implementer_session": { "model": "claude-sonnet-5", "id": "example-impl-session-2" },
  "validator_session": { "model": "claude-opus-5-5", "id": "example-validate-session-2" }
}
```

**File form.** `evidence/records/<ticket>.jsonl`: UTF-8, one compact JSON object per line, `\n` or `\r\n`,
a trailing newline allowed, no blank lines. Every line's `ticket` equals the file stem. Dotfiles
(`.gitkeep`) are ignored; any other file name in the directory is a problem.

**PR-body form.** One record per fenced block whose opening line is exactly ` ```json evidence ` (trailing
spaces allowed), closing at the next ` ``` ` line. HTML comments are stripped before scanning, so the
template's own comment (design document §5.6; the PR template's "Evidence record" section) never parses as
a record. Several blocks are allowed in one PR body.

## 4. Host labels

| Label | Meaning |
|---|---|
| `ubuntu-latest` | Public repository CI runner (`environment.kind: 'ci'`) |
| `windows-latest` | Public repository CI runner, Windows (`environment.kind: 'ci'`); also the GitHub-hosted Windows image as the live host (`kind: 'hosted-runner'`, OD-26) |
| `macos-latest` | Public repository CI runner, macOS (`environment.kind: 'ci'`); also the GitHub-hosted macOS image as the live host (`kind: 'hosted-runner'`, OD-26) |
| `qa-mac-1` | The dedicated QA macOS user account (M2-0007) |
| `windows-laptop-1` | The dedicated Windows test laptop (M2-0195) |
| `owner-mac` | The owner's own Mac account, used by hand — promoted/release builds only, never routine test evidence |
| `metis-owner-mac` | The self-hosted GitHub Actions runner in the owner's own Mac account (runner label `metis-owner-mac`; OD-46, M2-0537): a scoped D-28 exception for the strict ST-1 jobs `st1-mac-fifo` and `st1-mac-control` only, under the sandbox OD-46 requires and never for a fork's pull request. Records use `kind: 'owner-mac'` and carry `ci_run_id` (§6 step 7). |

A release gate file's `hosts` (`check.mjs --release`) uses these same labels. A row is met on a host only
by the latest record for its `ticket` and `level` whose `environment.host` is that label (and whose
`output.path` or `command` contains the row's `match`, when it has one), so a record filed under any other
label never meets it. A row for the strict fifo or control job therefore names `metis-owner-mac`; the other
macOS ST-1 jobs run on `macos-latest`, and their rows name that host. A candidate-bound row
(`promotable`, `qa-identity`) also needs the record's `build_run_id` to be the candidate run and its
`artifact_sha256` to be one of that bytes class's assets, at every level, `MEASURED` included.

## 5. Closure rules

Normative source: `scripts/evidence/check.mjs` (`ledgerProblems`, `outputProblems`, `prProblems`) in the
public repository. In prose: a ticket's `depends_on` graph must be acyclic and every direct dependency of
an in-progress or closed ticket must already be ready (`ENGINEERING_COMPLETE`, `DONE`, `DEFERRED` or
`BLOCKED_EXTERNAL`). An `ENGINEERING_COMPLETE` or `BLOCKED_EXTERNAL` ancestor, anywhere in the transitive
dependency graph, *caps* a ticket: it may not become `DONE` while such an ancestor exists (the one
exception is the ticket flagged `closes_program`), and while capped its own `ENGINEERING_COMPLETE` records
must list every capping ancestor that itself has an external blocker, in `inherited_block`, alongside that
ancestor's unblock step. A `needs_decision` entry never caps closure the way a `depends_on` ancestor does —
it only requires the record to say, in `assumed_decisions`, which recorded default it assumed; the check
flags a ticket for re-validation the moment the decisions register answers that entry differently
(`ANSWERED_CHANGED`). A closed `type: 'fix'` ticket whose `required_evidence` includes `LOCALLY_TESTED`
must carry a `repro` — a run that failed, on an ancestor of the green commit — on that record (red-before).
Every record's `kit_refs` keys must equal the ticket's own `kit_refs` set exactly, and its `finding_refs`
must be a subset of the ticket's. An `output` field's file must exist under this repository's
`docs/metis-2.0/` and match its recorded sha256 exactly.

On the public-repository side, a record pasted into a pull request's body is checked against that exact
PR: `LOCALLY_TESTED`'s `commit` must be the PR's own head SHA and `pr` its own number (so a later push
makes a stale record fail, not silently pass); its named run must be a completed, successful
`.github/workflows/build.yml` run on that commit; a `repro` run must be a completed, *failed* run of the
same workflow on a commit that is a genuine ancestor of the green one; and any `wired` paths must exist in
that same checkout. A pull request body with no evidence block makes no claim and is not a problem.

**The rule numbers.** Both `README.md` and this document cite rules by number (`L10`, `L11`, `L12`,
`L13`, …); this table is their definition, restated from the design document
(`docs/metis-2.0/designs/M2-0002-DESIGN.md` §4), which remains normative wherever the two disagree.
Definitions: `READY_DEP` = {`ENGINEERING_COMPLETE`, `DONE`, `DEFERRED`, `BLOCKED_EXTERNAL`}; `IN_HOUSE` =
{`DESIGNED`, `LOCALLY_TESTED`} (the levels that need no outside environment); **caps(t)** = every
transitive `depends_on` ancestor of `t` whose status is `ENGINEERING_COMPLETE` or `BLOCKED_EXTERNAL`;
**roots(t)** = the members of caps(t) with a non-null `external_blocker`; **latest(t, level)** = the last
record for that level in `t`'s file (INV-2); **closed** = `DONE` or `ENGINEERING_COMPLETE`.

Ledger rules (`ledgerProblems`); each problem is one line starting with the ticket id:

| # | Rule |
|---|---|
| L1 | **Shape.** `tickets` is an array. Ids are unique and match the ticket pattern. `status` is a known status. `depends_on` ids exist, for every ticket regardless of status. `needs_decision` is an array of D-ids. `required_evidence` is non-empty, distinct and a subset of the six levels. `kit_refs`, `finding_refs` and `slices` are arrays. `estimate_hours` is a number. `external_blocker` and `flag` are present, and may be null. The top-level `decisions` register has a value for every D-id any ticket references. At most one ticket has `closes_program: true`. |
| L2 | The `depends_on` graph is acyclic. Report each cycle once. |
| L3 | **Ready.** Status `IN_PROGRESS`, `ENGINEERING_COMPLETE`, `DEFERRED` or `DONE` requires every direct dependency's status to be in READY_DEP. |
| L4 | **Slicing.** `IN_PROGRESS` with `estimate_hours > 12` requires at least one slice, and every slice has `estimate_hours ≤ 10`. |
| L5 | `BLOCKED_EXTERNAL` requires `external_blocker` with non-empty `owner`, `unblock_step`, `needed_by` and `raised_on`. |
| L6 | `CANCELLED` requires a non-empty `reason`. |
| L7 | `DEFERRED` requires a non-null `flag`, and latest(t, `ACCEPTED`) with `PASS` (the owner's dated approval under D-14). |
| L8 | `ENGINEERING_COMPLETE` requires (`external_blocker` non-null or caps(t) non-empty), at least one *latest* `PASS` record across all levels, and latest(t, L) is `PASS` for every L in `required_evidence` ∩ IN_HOUSE. |
| L9 | `DONE` requires latest(t, L) with `PASS` for every L in `required_evidence`, and caps(t) empty unless `closes_program` is exactly `true`. |
| L10 | **Inherited blocks.** For `ENGINEERING_COMPLETE`, and for `DONE` with `closes_program === true`: every record in latest(t) lists every id in roots(t) in `inherited_block`. For `DONE` without `closes_program`: every required-level latest record has an empty `inherited_block`. |
| L11 | **Red-before.** A closed ticket of `type: 'fix'` with `LOCALLY_TESTED` in `required_evidence` requires latest(t, `LOCALLY_TESTED`) to carry `repro`. |
| L12 | **Record context** (every valid record in the file): `kit_refs` keys equal the ticket's `kit_refs` exactly. `finding_refs` is a subset of the ticket's. `assumed_decisions` is a subset of the ticket's `needs_decision`. Every `needs_decision` entry whose register state is `OPEN` appears in `assumed_decisions` ("unlabelled assumption"). |
| L13 | **Re-validation.** A closed ticket whose latest(t) records list, in `assumed_decisions`, a decision now `ANSWERED_CHANGED` is flagged "re-validate". It clears when a new record for that level no longer assumes it. |
| L14 | A record file for a ticket not in the ledger, a line whose `ticket` does not match the file stem, and an unexpected file name are each a problem. |
| L15 | **Outputs.** For every valid record with `output`, the file at `docs/metis-2.0/<output.path>` exists and its sha256 equals `output.sha256`. |

PR rules (`prProblems`), checked against a pull request's own head commit and Actions runs:

| # | Rule |
|---|---|
| P1 | Every ` ```json evidence ` block parses and passes `recordProblems`. |
| P2 | `LOCALLY_TESTED`: `commit` is the PR's own head SHA and `pr` its own number. |
| P3 | `LOCALLY_TESTED`: the run named by `ci_run_id` exists, is `.github/workflows/build.yml`, on `commit`, completed, and successful. |
| P4 | Any record with `repro`: the run named by `repro.ci_run_id` exists, is the same workflow, on `repro.commit`, completed and *failed*, and `repro.commit` is a genuine ancestor of `commit`. `repro.test` exists in the checkout. |
| P5 | Any record with `wired`: `wired.client` and `wired.contract_fake` exist in the checkout. |
| P6 | No block: no problems. |

Sampling rules (`sample.mjs`):

| # | Rule |
|---|---|
| S1 | Population = closed tickets whose newest `recorded_at` is at or after `--since`. |
| S2 | Size k = ⌈0.10 × n⌉ — 0 when n is 0, otherwise at least 1. |
| S3 | Selection = the k ids with the smallest `sha256("<seed>:<id>")` hex, printed sorted by id; the seed is the gate commit SHA, so the draw is reproducible and not steerable. |

## 6. How to record

1. Push until `.github/workflows/build.yml`'s Build & Test is green on the exact commit you intend to
   record (the run id you cite must be *on that commit*, not on a later merge commit — see M2-0001's own
   backfill note in the design document's §6.5 item 5 for why this matters).
2. The validator (a session distinct from the implementer's) pastes the record as a
   ` ```json evidence ` fenced block into the pull request body. `.github/workflows/evidence.yml` verifies
   it there, against the PR's own head commit and the named Actions runs.
3. Once that check is green, the lead appends the *same* JSON object, compacted to one line (`jq -c`), to
   `evidence/records/<ticket>.jsonl` in this repository, and sets the ticket's status in
   `ledger/tickets.json` (PD-13: only the orchestrator edits the ledger).
4. **Never edit a line.** A correction, a re-run, or a re-execution is always a new appended line; the
   latest record of each level governs (INV-2).
5. Raw machine-produced output that a record's `output` field points at is committed under
   `evidence/raw/<ticket>/` in this repository.
6. A re-execution record (the 10% sample, `scripts/evidence/sample.mjs`) sets `reexecuted_by` to a session
   whose model differs from the original implementer's.
7. **Owner-runner records** (OD-46). A record from a job on the `metis-owner-mac` runner uses
   `environment: { kind: 'owner-mac', host: 'metis-owner-mac' }` — never `hosted-runner`, which
   `record.mjs` rejects with that host — and carries `ci_run_id`, the run whose job executed `command`, at
   `HOST_CONFIGURED`, `LIVE_VERIFIED` and `MEASURED`. `record.mjs` does not enforce either rule for this
   label yet (M2-0549); until it does, the lead checks both before appending the record.

## 7. Authority

`scripts/evidence/record.mjs` and `scripts/evidence/check.mjs`, in the public repository
(`mysticalsin/AskToto-Mantu`), are the schema and the closure rules as *code*. This document is the prose
explanation for a human or an agent reading the private program repository; wherever it and that code
disagree, the code governs, and this document should be corrected to match it.
