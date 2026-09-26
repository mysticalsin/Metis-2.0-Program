# build-traceability.mjs — running the real check (M2-0011)

The generator lives only in the public repo now: `mysticalsin/AskToto-Mantu`,
`scripts/trace/build-traceability.mjs`, merged from branch `m2/M2-0011-traceability-generator`
(PR #211) after Opus round-1 validation. There is **no copy of it in this repository** — a
byte-identical copy drifts the moment either side changes, so round-1 replaced it with a
sparse-checkout of the public path, the same pattern `scripts/evidence/check.mjs` already uses.
Real program data (`ledger/tickets.json`, `kit/ID-INVENTORY.json`, `DECISIONS.md`, `BLOCKERS.md`,
`evidence/records/`) still never leaves this private repository — only the data-free module comes
in, read-only, for the run.

## The authoritative check: `.github/workflows/ledger.yml`

`ledger.yml` (uncommitted — M2-0002's file; the lead reviews and commits it) now sparse-checks out
`scripts/trace` alongside `scripts/evidence` from `m2/integration` and runs:

```sh
node public/scripts/trace/build-traceability.mjs --check \
  --tickets docs/metis-2.0/ledger/tickets.json \
  --inventory docs/metis-2.0/kit/ID-INVENTORY.json \
  --decisions docs/metis-2.0/DECISIONS.md \
  --blockers docs/metis-2.0/BLOCKERS.md \
  --evidence docs/metis-2.0/evidence/records
```

This is the only run of this check that counts as LOCALLY_TESTED in the Stark sense (it happens in
CI, on this repo's own real data). `--evidence` feeds in the ADR-017 per-kit_ref record store
(M2-0002); a ticket with no record simply has no override.

## Running it by hand (equivalent command)

Clone or sparse-checkout `mysticalsin/AskToto-Mantu` at `m2/integration` next to this repo (as
`public/`, matching the CI layout above), then from this repo's root:

```sh
node public/scripts/trace/build-traceability.mjs --check \
  --tickets docs/metis-2.0/ledger/tickets.json \
  --inventory docs/metis-2.0/kit/ID-INVENTORY.json \
  --decisions docs/metis-2.0/DECISIONS.md \
  --blockers docs/metis-2.0/BLOCKERS.md \
  --evidence docs/metis-2.0/evidence/records

# once --check is clean:
node public/scripts/trace/build-traceability.mjs \
  --tickets docs/metis-2.0/ledger/tickets.json \
  --inventory docs/metis-2.0/kit/ID-INVENTORY.json \
  --decisions docs/metis-2.0/DECISIONS.md \
  --blockers docs/metis-2.0/BLOCKERS.md \
  --evidence docs/metis-2.0/evidence/records \
  --out-md docs/metis-2.0/TRACEABILITY.md \
  --out-json docs/metis-2.0/ledger/traceability.json
```

`kit/ID-INVENTORY.json` (937 rows) was seeded on 2026-09-26 from `TRACEABILITY.json`'s `rows` — its
`id`, `family`, `title`, `kit`, `source_file`, `source_ref`, `parent_task` and `sources` fields,
copied verbatim (ticket acceptance criterion 8) — so the check runs from this repository's own
files, with no dependency on `metis-v2-review`.

## What round-1 changed, and what that means for the real ledger

Opus round-1 validation (2026-09-26) found the per-kit_ref override was built on a ledger field
(`ticket.evidence[]`) that nothing writes, and tightened several checks that were fail-open before:
a malformed ledger ticket id, a program-ticket id cited inside `kit_refs`, `DECISIONS.md` entries
matched only as table rows (not prose mentions), `BLOCKERS.md` coverage widened to every item in a
`Ticket` or `Affected tickets` cell plus any bare `M2-NNNN` token in the document, and a row cited
only by a `CANCELLED` ticket now correctly counts as unmapped. All of this is covered by the public
module's synthetic-fixture test suite (CI-green on `m2/M2-0011-traceability-generator`), but **it
has not been re-verified against this repository's real data** the way the pre-round-1 version was
(a throwaway Python port of the old algorithm — see git history of this file for that verification,
since it predates round-1 and would need redoing against the new checks). The `--evidence` flag is
new in round-1 and reads `docs/metis-2.0/evidence/records/` (currently empty but for `.gitkeep`), so
it has no effect yet. Until `ledger.yml` runs `--check` for real in CI, criterion 1 (100% of rows
map) stays **NOT_MET** as a live result — the previously-known gap below is unaffected by round-1
and is very likely still the dominant one, but the widened BLOCKERS/ticket-id checks may surface a
few more.

## The known remaining fix — a ledger edit, not a code change

Per AGENTS.md §4, `ledger/tickets.json`'s content is the Opus orchestrator's to edit, not a ticket
executor's — so this is reported, not applied. Each row below needs its ticket's `kit_refs` entry
changed from the bare id to a kit-qualified one (`Metis-HeyClicky-Interaction-Upgrade:REF-0N` or
`v6:REF-0N`); which kit is very likely determinable from the ticket's own title/summary in most
cases (e.g. M2-0082 is D-19's HeyClicky-adoption ticket, so its five `REF-0N` citations are almost
certainly the HeyClicky kit's, not v6's) — worth a quick confirm against each ticket's summary
before writing the qualified id, rather than guessing from the id alone:

| Ticket | Bare citation | Qualify as one of |
|---|---|---|
| M2-0020 | REF-15, REF-16 | `Metis-HeyClicky-Interaction-Upgrade:REF-1{5,6}` or `v6:REF-1{5,6}` |
| M2-0082 | REF-01..REF-05 | `Metis-HeyClicky-Interaction-Upgrade:REF-0{1..5}` or `v6:REF-0{1..5}` |
| M2-0084 | REF-09, REF-10 | `Metis-HeyClicky-Interaction-Upgrade:REF-{09,10}` or `v6:REF-{09,10}` |
| M2-0085 | REF-11, REF-12 | `Metis-HeyClicky-Interaction-Upgrade:REF-{11,12}` or `v6:REF-{11,12}` |
| M2-0087 | REF-06..REF-08 | `Metis-HeyClicky-Interaction-Upgrade:REF-0{6..8}` or `v6:REF-0{6..8}` |
| M2-0123 | REF-13 | `Metis-HeyClicky-Interaction-Upgrade:REF-13` or `v6:REF-13` |
| M2-0124 | REF-14 | `Metis-HeyClicky-Interaction-Upgrade:REF-14` or `v6:REF-14` |
| M2-0133 | REF-11, REF-12 | `Metis-HeyClicky-Interaction-Upgrade:REF-{11,12}` or `v6:REF-{11,12}` |
| M2-0134 | REF-13 | `Metis-HeyClicky-Interaction-Upgrade:REF-13` or `v6:REF-13` |
| M2-0135 | REF-14, REF-15 | `Metis-HeyClicky-Interaction-Upgrade:REF-{14,15}` or `v6:REF-{14,15}` |
| M2-0136 | REF-16 | `Metis-HeyClicky-Interaction-Upgrade:REF-16` or `v6:REF-16` |
| M2-0178 | REF-09, REF-10 | `Metis-HeyClicky-Interaction-Upgrade:REF-{09,10}` or `v6:REF-{09,10}` |
| M2-0180 | REF-01..REF-08 | `Metis-HeyClicky-Interaction-Upgrade:REF-0{1..8}` or `v6:REF-0{1..8}` |

Once every row above is qualified and `ledger.yml` is enabled, `--check` should reach the ticket's
acceptance criterion 1 (937/937 rows, 921/921 unique ids mapped) with zero errors, and
`--out-md`/`--out-json` regenerate `TRACEABILITY.md` and `ledger/traceability.json` from the ledger
itself.

## Cleanup still needed

`scripts/trace/build-traceability.mjs` in this directory is a **stale, superseded duplicate** from
before round-1 — it was never committed and an agent could not delete it in this session (no
destructive local filesystem ops). Please delete it by hand: `rm scripts/trace/build-traceability.mjs`.
