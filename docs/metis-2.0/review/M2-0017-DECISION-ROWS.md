# M2-0017 — proposed DECISIONS.md cross-references

Docs-reconcile pass (M2-0017). Per the ticket's lead notes, this ticket does not edit the private
`DECISIONS.md` directly this batch (M2-0022 owns it) — these are proposed rows / cross-references
for M2-0022 to fold in, plus a record of what the public-repo PR (AskToto-Mantu m2/M2-0017-docs-reconcile)
already did instead.

## Operator 8-tab vs 11-surface question (acceptance item 4, first half)

`DECISIONS.md` already carries this question as **D-16** ("Operator portal scope: the existing tabs
or the kit's 11 surfaces?", default: "The kit's surfaces, added inside the existing portal chrome",
class reversible, needed by 2026-10-26, status OPEN, affected tickets 0158). **No new row is
needed** — D-16 already satisfies this ticket's acceptance criterion as written.

Public-repo action taken (round 1): `docs/design/OPERATOR.md` and `docs/design/DESIGN.md` carried a
plain-text pointer to D-16 next to the 8-tab rail definition.

**Round 2 (Opus validator).** The round-1 pointer named a private-repo decision id and quoted
`DECISIONS.md`'s section numbers (MASTER §12.2, §12.9) directly in the public repo — public-repo
hygiene per AGENTS.md is to reference ticket ids only. Both files now point at **M2-0158** ("Repair
portal totals, speech controls and data-health UX and add the missing portal surfaces inside the
existing chrome", TASK-045) instead — the ticket that owns this open scope question — and drop the
enumerated MASTER §12.2/§12.9 surface list. D-16 itself is unchanged and still OPEN with only a
recommended default; the public repo states the question as open rather than restating D-16's
default as decided. This is a public-repo pointer fix, not a decision change.

**Round 3 (Opus validator).** Round 2 had drifted back into stating D-16's default as settled
("closes D-16's default"). Both public-repo files now say only that whether/how the kit's 11
surfaces join the console is an open scope question owned by M2-0158; they no longer describe an
outcome.

## Voice/orb/bar reconciliation (acceptance item 4, second half)

Not a `DECISIONS.md` row — the ticket routes this to the design ticket, not the decision register.
**M2-0093** ("Implement the section 5.11 ARMED orb and the expanded pill, caption, beam and voice
glow; reconcile the three voice/orb/bar designs (TASK-030)") is the existing ticket that owns
reconciling:

- Design A — `docs/design/DESIGN.md` + `BAR-PILL.md` + `ORB-SELECTION.md` (shipped Bar/orb visual system)
- Design B — `docs/design/METIS-2.0-JARVIS-COMMAND.md` (approved 2026-09-20, pill/sidecar placement)
- Design C — `docs/design/METIS-2.0-CAP2-WAKE-ADAPTERS.md` (shipped wake-word/command-session increment)

All five files now carry a plain-text pointer to M2-0093 (TASK-030) in the public repo.

## Superseded meeting-intelligence plan phases 6-8 (acceptance item 5)

**Round 1** folded all three phases into **M2-0130** as a block. **Round 2 (Opus validator)** found
that wrong: M2-0130's scope (briefings, review inbox, evidence drawer, graph) covers at most Phase 6;
Phase 7 (ASR entity biasing) has no owning ticket; Phase 8 (enterprise hardening + compliance pack)
is partly already shipped independent of the 2.0 ticket system (the hash-chained audit log —
`src/main/audit-log-chain.test.ts`, MQA-232 — and the erasure seams —
`src/main/erasure-completeness.contract.test.ts`) and `docs/compliance/*` is Phase 8's own paper pack.
`docs/plans/2026-07-11-meeting-intelligence-100x-plan.md`'s fold-in note now folds only Phase 6 into
M2-0130, states Phase 7 is unowned, and names **M2-0150** ("Complete governance, subject rights and
sharing qualification and add the multi-seat/Teams compliance track", TASK-058) as the ticket owning
Phase 8's remaining governance/subject-rights work. The phases are left in place (not deleted) for
lineage, per the ticket's "never delete a doc outright" rule. This is recorded as a departure from
the ticket text on the PR (acceptance item 5), not silently substituted.

## Compliance placeholder (acceptance item 2)

**Round 2 (Opus validator).** `docs/compliance/README.md`'s multi-seat/Teams placeholder named
M2-0155 (the Teams media receiver engineering ticket). The ticket that actually owns "add the
multi-seat/Teams compliance track" is **M2-0150** (TASK-058). Also dropped "currently zero-code" (a
status that goes stale on its own).

**Round 3 (Opus validator).** Round 2 still called M2-0155 "its dependency" — the ledger's
`depends_on` for M2-0150 is `["M2-0132", "M2-0149"]`; M2-0155 does not appear anywhere in that
chain. The public-repo file now says M2-0150 owns the track and separately notes that M2-0155
builds the Teams media receiver that track covers — a "what it needs to describe," not a
dependency edge.

## Contract test narrowed (round 2)

**Round 2 (Opus validator).** `src/shared/docs-reconcile-m2-0017.contract.test.ts` pinned exact
prose (D-16, M2-0093, M2-0130, "first increment", "section 17", plus an 8-path "never deletes a doc"
list covering two files this ticket never touched) that the *owning* tickets — M2-0158, M2-0093,
M2-0130 — would have had to delete a test to change while doing their own job. Narrowed to
`src/shared/design-docs-status.contract.test.ts`, keeping only the durable invariant: every
`docs/design/*.md` file carries a `Status:` line.

## Reference

- Public PR: mysticalsin/AskToto-Mantu#215 (`m2/M2-0017-docs-reconcile` → `m2/integration`)
- Red run: 36281107215 (Build & Test, ubuntu Quality job: 25 failed / 6780 passed / 28 skipped)
- Green run (round 1): 36282959109 (Build & Test, head commit 7363e4c6, all jobs green; ubuntu
  Quality job: 547/549 test files passed, matching baseline run 36267674617 job-for-job)
- Green run (round 2, current PR head): 36285010513 (Build & Test, head commit `ab2e05d9`, all jobs
  green; ubuntu Quality job: 547/549 test files passed, 6797/6825 tests passed, matching baseline
  run 36267674617 job-for-job)
