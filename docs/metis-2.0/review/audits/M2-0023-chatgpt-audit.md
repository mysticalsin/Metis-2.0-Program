# M2-0023 ChatGPT Audit Provenance Gap

- OBSERVED (docs/metis-2.0/ledger/tickets.json:1498): ticket id is M2-0023.
- DERIVED (this file): artifact type is audit-scope evidence for the required ChatGPT review.
- OBSERVED (current session, 2026-09-28): reviewer label is current Codex session evidence check; not verifiable ChatGPT provenance.
- OBSERVED (system date, 2026-09-28): review date is 2026-09-28.
- OBSERVED (current session file reads, 2026-09-28): scope reviewed was `docs/metis-2.0/PLAN.md`, `docs/metis-2.0/ARCHITECTURE.md`, `docs/metis-2.0/ledger/tickets.json`, `docs/metis-2.0/ledger/tickets/M2-0023.md`, `docs/metis-2.0/review/chatgpt-audit-1.md`, and `docs/metis-2.0/review/audits/`.

## Boundary

- OBSERVED (docs/metis-2.0/ledger/tickets.json:1523-1526): M2-0023 requires a ChatGPT audit of PLAN, ARCHITECTURE and ledger, a Codex read-only review, and no self-approval.
- OBSERVED (docs/metis-2.0/ledger/tickets/M2-0023.md:35-37): the generated ticket repeats those acceptance criteria.
- OBSERVED (docs/metis-2.0/ledger/tickets.json:1519-1522): the scope path is `docs/metis-2.0/review/audits/`, but the summary requires every finding to be dispositioned in the ledger.
- OBSERVED (docs/metis-2.0/PLAN.md:47-50): the plan assigns separate validator, ChatGPT and Codex roles; reviewers must not approve their own work.
- OBSERVED (docs/metis-2.0/review/chatgpt-audit-1.md:1-7): the only existing in-repo ChatGPT-labelled source reviews "the brief, B1, and B2" and says it did not independently check the repository.
- OBSERVED (command output, 2026-09-28): root `AGENTS.md` was not present in this worktree.
- OBSERVED (command output, 2026-09-28): `graphify query "M2-0023 plan architecture ledger independent audit docs/metis-2.0" --budget 1800` failed with `graph file not found`, and `graphify-out/wiki/index.md` was absent.
- DERIVED: raw file inspection was necessary after the mandated graph/wiki navigation path returned no usable project graph.
- UNKNOWN: no durable in-repo source proves that ChatGPT reviewed `PLAN.md`, `ARCHITECTURE.md`, and `ledger/tickets.json` for M2-0023.
- BLOCKED_EXTERNAL: exact read-only step is for the owner/orchestrator to provide a ChatGPT export, conversation URL, model run ID, or signed provenance note showing those three files were reviewed for M2-0023.

## Findings

### CGPT-M2-0023-01: No verifiable ChatGPT audit artifact is present

- OBSERVED (docs/metis-2.0/review/chatgpt-audit-1.md:3-7): the existing ChatGPT artifact's boundary is the brief, B1, and B2; it does not claim review of PLAN, ARCHITECTURE, or the ledger.
- OBSERVED (docs/metis-2.0/ledger/tickets.json:1524): M2-0023 requires ChatGPT audit coverage of PLAN, ARCHITECTURE, and ledger.
- UNKNOWN: no in-repo transcript, export, URL, model run ID, or signed provenance note establishes that required ChatGPT review.
- Disposition: ACCEPTED. Acceptance criterion 1 remains unmet until verifiable ChatGPT provenance is added.

### CGPT-M2-0023-02: Ledger disposition is required but forbidden in this run

- OBSERVED (docs/metis-2.0/ledger/tickets.json:1522): the ticket summary requires every finding to be dispositioned in the ledger.
- OBSERVED (docs/metis-2.0/PLAN.md:49): ChatGPT findings are to be dispositioned in the ledger.
- OBSERVED (user prompt, 2026-09-28): `Never edit docs/metis-2.0/ledger/tickets.json or _relay/.`
- DERIVED: this run cannot satisfy the program-ledger disposition requirement without violating the owner constraint.
- Disposition: ACCEPTED. Record audit-scope disposition only; do not edit the forbidden ledger files.

### CGPT-M2-0023-03: Codex timing is internally inconsistent

- OBSERVED (docs/metis-2.0/PLAN.md:50): the plan says Codex CLI reviews happen after quota reset at 2026-09-29 19:33.
- OBSERVED (docs/metis-2.0/PLAN.md:237): the external-unblock row repeats the 2026-09-29 19:33 Codex step.
- OBSERVED (docs/metis-2.0/BLOCKERS.md:18): blocker B-04 repeats that the Codex review runs after 2026-09-29 19:33.
- OBSERVED (docs/metis-2.0/ledger/tickets.json:1542): M2-0023 notes `UNBLOCKED 2026-09-27: Codex is available (quota restored)`.
- UNKNOWN: no in-repo source proves the outside account quota state.
- Disposition: ACCEPTED. The ticket note and current owner prompt allow a Codex attempt now; account proof remains external if challenged.

### CGPT-M2-0023-04: The dependency is ledger-DONE, but generated traceability still shows an incomplete row

- OBSERVED (docs/metis-2.0/ledger/tickets.json:765-815): M2-0011 is `DONE`.
- OBSERVED (docs/metis-2.0/TRACEABILITY.md:3-5): traceability is generated from the kit inventory, ledger, and evidence records.
- OBSERVED (docs/metis-2.0/TRACEABILITY.md:188): `r11:COV-42` maps to M2-0011 with status `IN_PROGRESS`.
- DERIVED: M2-0023's dependency is satisfied by the ledger, but a reviewer could read traceability as stale or evidence-derived incomplete state.
- Disposition: ACCEPTED. No M2-0023 scope change; orchestrator should refresh or explain traceability if it is expected to mirror the DONE ledger row.

### CGPT-M2-0023-05: Process-only evidence must not imply code validation

- OBSERVED (docs/metis-2.0/ledger/tickets.json:1531-1533): M2-0023 requires only `DESIGNED` evidence.
- OBSERVED (docs/metis-2.0/PLAN.md:11): the plan states nothing in the repository was run to produce it.
- OBSERVED (docs/metis-2.0/PLAN.md:35): repository tests are forbidden until the M2-0001 canary passes, then limited to CI, QA macOS user, or D-28 sandboxed owner account.
- OBSERVED (docs/metis-2.0/PLAN.md:305): AGENTS.md test commands are subject to the same no-repository-test rule.
- OBSERVED (user prompt, 2026-09-28): never run repository tests, scripts, or the app.
- DERIVED: tsc/test/app execution is out of scope and forbidden for this ticket in this run.
- Disposition: ACCEPTED. Verification is document inspection only.

## Verdict

DERIVED: this file is not a substitute for a successful ChatGPT audit. M2-0023 remains blocked on external ChatGPT provenance and forbidden ledger disposition.
