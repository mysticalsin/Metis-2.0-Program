# Métis 2.0 — Canonical Requirement-ID Inventory (P1-id-inventory)

Source of truth: `plan-work/prep/ID-INVENTORY.json` (937 rows, one row per distinct `(id, kit)` pair,
duplicates across files merged into a `sources` array). Built with `python3` directly against the
JSON/Markdown sources listed below — no test execution, no code run, read-only on all kit
directories.

## Counts per family

| Family | Total | By kit |
|---|---|---|
| M2 | 55 | r11: 55 |
| UC | 112 | r11: 112 |
| TASK | 66 | r11: 66 |
| COV | 44 | r11: 44 |
| FLOW | 12 | r11: 12 |
| F | 20 | r11: 20 |
| EXP | 12 | r11: 12 |
| SRC | 24 | r11: 24 |
| R | 93 | r11: 93 |
| HC | 32 | r11: 32 |
| AGX | 16 | r11: 16 |
| AGUC | 32 | r11: 32 |
| AGSTEP | 18 | r11: 18 |
| HM | 16 | r11: 16 |
| HMSTEP | 16 | r11: 16 |
| HMUC | 32 | r11: 32 |
| OBU | 5 | r11: 5 |
| HS | 18 | r11: 18 |
| HS-R | 14 | r11: 14 |
| SLICE | 15 | r11: 15 |
| MB | 24 | v5: 24 |
| CXSTEP | 20 | v5: 20 |
| CXCAP | 30 | v5: 30 |
| CXAC | 36 | v5: 36 |
| BXAC | 24 | v5: 24 |
| JVSTEP | 10 | v5: 10 |
| JVAC | 24 | v5: 24 |
| JEV-REF | 8 | v5: 8 |
| NK | 13 | v5: 13 |
| NKAC | 16 | v5: 16 |
| KREF | 2 | v5: 2 |
| HSAC | 20 | v5: 20 |
| HMS | 1 | v5: 1 |
| S | 4 | v5: 4 |
| REF | 33 | Metis-HeyClicky-Interaction-Upgrade: 17, v6: 16 |
| LF | 8 | v6: 8 |
| LFAC | 12 | v6: 12 |
| **Total** | **937** | r11: 652 · v5: 249 · Metis-HeyClicky-Interaction-Upgrade: 17 · v6: 16 (net of the 3-family split above; row-level kit tags are exact) |

37 distinct families across 4 kit tags (`r11`, `v5`, `v6`, and the nested `Metis-HeyClicky-Interaction-Upgrade` sub-kit embedded in v5's `baseline/`).

## Where each family lives (canonical source)

**r11 kit** (`plan/registry.json` is canonical for all of these; duplicate copies noted in `sources`):
- `M2` = `requirements`, `UC` = `use_cases`, `TASK` = `tasks`, `COV` = `owner_commitments`, `FLOW` = `golden_flows`, `F` = `historical_findings`, `EXP` = `experience_requirements` (dup: `plan/EXPERIENCE-REQUIREMENTS.json`, `plan/PRODUCT-STATUS.json`), `SRC` = `source_findings` (dup: `plan/PRODUCT-STATUS.json`), `R` = `references`, `HC` = `clicky_observations`, `AGX`/`AGUC`/`AGSTEP` = `agent_expansion.{gates,cases,ordered_steps}` (dup: `plan/AGENT-EXPANSION.json`), `HM`/`HMSTEP`/`HMUC` = `memory_expansion.{gates,steps,use_cases}` (dup: `memory/EXPANSION.json`).
- `OBU` (5) — **not** in registry.json at all; defined only in prose in `spec/MASTER.md` §34 (OBU-01…OBU-05, lines ~4981-4989). Referenced elsewhere only as the range "OBU-01–05".
- `HS` (18) and `HS-R` (14) — **not** in registry.json**; from `memory/SOURCES.json`'s `observations` and `sources` arrays (Hindsight vendor-source review, separate from the `HM`/`HMSTEP`/`HMUC` memory-expansion gates).
- `SLICE` (15, not 16 — see collision note below) — `registry.json:slice_handoffs[]`, keyed by the `label` field (e.g. `TASK-027.A`), not an `id` field.

**v5 kit** (`Metis-Behavior-Upgrade-v5-Hindsight/`):
- `MB` — `behavior/REQUIREMENTS.json`
- `CXSTEP` — `delivery/INTEGRATION-BACKLOG.json` (same 20 ids also drafted first in the nested `baseline/Metis-HeyClicky-Interaction-Upgrade.x/.../BACKLOG.json`)
- `CXCAP` — `delivery/CAPABILITY-MATRIX.json` (same pattern, nested-kit draft first)
- `CXAC` — only exists as the `inherited_cases` slice (36) of `behavior/ALL-ACCEPTANCE.json`; no standalone CXAC file in the main v5 tree — nested-kit `ACCEPTANCE-MATRIX.json` is the original draft.
- `BXAC` — `behavior/ADDITIONAL-ACCEPTANCE.json` (also rolled up inside `ALL-ACCEPTANCE.json`)
- `JVSTEP` — `jev/BACKLOG.json`; `JVAC` — `jev/ACCEPTANCE-MATRIX.json`; `JEV-REF` — `jev/evidence/PRIMARY-SOURCES.json`
- `NK` — `keyboard-notes/REQUIREMENTS.json` (12) plus the single anchor record `NK-INTEGRATION` in `keyboard-notes/INTEGRATION.json`; `NKAC` — `keyboard-notes/ACCEPTANCE-MATRIX.json`; `KREF` — `keyboard-notes/evidence/PRIMARY-SOURCES.json`
- `HSAC` — `memory/ACCEPTANCE-MATRIX.json`; `HMS` — the single anchor record `HMS-INTEGRATION` in `memory/INTEGRATION.json`
- `S` (4) — `evidence/PRIMARY-SOURCES.json` (top-level vendor/API URLs: `S1`…`S4`, no hyphen)
- `behavior/ALL-ACCEPTANCE.json` is a **rollup, not a new family**: its 120 `cases` = CXAC(36)+BXAC(24)+JVAC(24)+HSAC(20)+NKAC(16); it was folded in as an extra source on the matching rows, not counted separately.
- The `baseline/Metis-Work-Session.x/Metis-Work-Session/r11-kit/` folder inside v5 is a **byte-identical copy** of the canonical r11 kit (`plan/registry.json` compares equal field-for-field, same `source_sha256`). It was verified but **not** re-inventoried — re-parsing it would only re-emit the same 652 r11 rows under a different path.

**v6 kit** (`Metis-Upgrade-v6-BRAG-Hindsight/`):
- `LF` — `launch-film/STORYBOARD.json` → `hero.scenes[]` (8 scenes, LF-01…LF-08)
- `LFAC` — `launch-film/ACCEPTANCE.json` → `cases[]` (12)
- `REF` — `evidence/SOURCE-REGISTER.json` → `records[]` (16)
- `baseline/Metis-Behavior-Upgrade-v5-Hindsight.zip` is a packaged backup of the v5 kit; not unzipped/re-inventoried (same reasoning as the r11 nested copy above).

## ID collisions / naming risks between kits

1. **`REF-*` is reused for two unrelated lists.** The nested sub-kit `Metis-HeyClicky-Interaction-Upgrade` (embedded under v5's `baseline/`) defines `REF-01`…`REF-17` in `evidence/sources.json` (vendor/API references for the interaction-core study — e.g. `REF-01` = "HeyClicky product page"). The v6 kit independently defines `REF-01`…`REF-16` in `evidence/SOURCE-REGISTER.json` (launch-film sources — e.g. `REF-01` = "BRAG repository"). Same ID text, disjoint content, overlapping numeric range. A cross-kit grep for `REF-05` returns two unrelated records. Kept as **separate rows** in the inventory (`kit` field disambiguates); do not merge them.

2. **`M2-*` pattern collision risk (flagged per your instruction).** The kit's own canonical requirement IDs use a three-segment slug: `M2-<SEGMENT>-NN` (e.g. `M2-BASE-01`, `M2-SEC-02`, `M2-VOICE-01` — 55 of them, one per `registry.json:requirements[]` row). The program's own tracking tickets use a different, flatter pattern: `M2-NNNN` (4-digit, e.g. `M2-0001`). Both start with `M2-`, so any tool, dashboard or search that filters on the bare `M2-` prefix without checking the segment shape will conflate a **kit requirement ID** with a **program ticket ID**. Recommend the traceability tooling (m2 milestone) match on the full pattern `M2-[A-Z]+-\d{2}` for kit requirements and `M2-\d{4}` for program tickets, never a bare `M2-` prefix.

3. **`HS` family sprawl.** Three different "H…S…" families exist and are easy to conflate in a quick grep: `HS-01`…`HS-18` (Hindsight vendor-source *observations*, r11 `memory/SOURCES.json`), `HS-R01`…`HS-R14` (the *reference URLs* those observations cite, same file), and `HSAC-01`…`HSAC-20` (Hindsight-skill *acceptance cases*, v5 `memory/ACCEPTANCE-MATRIX.json`). None of these share literal IDs (no true collision), but `grep -r "HS-"` will pull all three together.

4. **Five independent "reference list" namespaces.** `R` (r11 canonical, R01–R93), `REF` (two separate kits, see #1), `KREF` (v5 keyboard-notes, KREF-01/02), `JEV-REF` (v5 jev, JEV-REF-01…08), and `HS-R` (r11 memory sources, HS-R01…R14) are five distinct, non-overlapping reference-citation lists maintained in five different files with no cross-linking. Nothing is broken, but there is no single "all references" list to query — a traceability report that wants "every citation" has to union all five.

5. **`slice_handoffs` isn't a clean sub-ID family.** 15 of the 16 `registry.json:slice_handoffs[]` rows use a genuine sub-slice label (`TASK-027.A`, `TASK-030.WIN`, `TASK-031.ADAPTER`, …) and were inventoried as family `SLICE` with `parent_task` parsed from the prefix. The 16th row's `label` is literally `"TASK-064"` — identical to the existing task ID, not a sub-slice — so it was merged into the existing `TASK-064` row (as an extra source) instead of creating a spurious 16th `SLICE` entry. That is why the `SLICE` family shows **15**, not 16.

## Not re-expanded (by design, to avoid duplicate bloat)

- Per-ID detail Markdown files that mirror registry IDs one-to-one — `plan/tasks/TASK-0NN.md` (66), `plan/agent-slices/AGSTEP-NN.md` (18), `memory/steps/HMSTEP-NN.md` (16) — were **not** added as extra sources per row; `registry.json` is the canonical, already-cited source for all of them, and the per-ID files are a predictable `family/ID.md` filename pattern, not additional content.
- `verification/*.json` result files (orb/browser/geometry/negative/etc.) were checked and contain pass/fail test records keyed by internal test names, not new requirement IDs — they reference existing `TASK`/`UC` IDs, they don't mint new ones.
- `memory/HMSTEP-SKILL-CROSSWALK.json` and `skills/REGISTRY.json` (v5) re-list existing `HMSTEP`/`CXSTEP`/`HMS-INTEGRATION` IDs with skill-mapping metadata; no new IDs, not added as extra sources (would have added noise to every HMSTEP row for no new information).
- `delivery/R11-TASK-CROSSWALK.json` (both v5 top-level and the nested HeyClicky kit) crosswalks existing `TASK` IDs against the r11 baseline; no new IDs.

## Row schema

```
{
  "id": "AGSTEP-01",
  "family": "AGSTEP",
  "source_file": "plan/registry.json",        // primary/first-seen source, relative to the kit root
  "source_ref": "agent_expansion.ordered_steps[0]",  // json path, or "line:NNNN" for Markdown-sourced ids
  "title": "Reconcile the actual reference and source baseline",  // <=120 chars
  "kit": "r11",                                // "r11" | "v5" | "v6" | "Metis-HeyClicky-Interaction-Upgrade"
  "parent_task": "TASK-001, TASK-002",         // comma-joined when a source links >1 TASK; "" if none
  "sources": [ { "source_file": ..., "source_ref": ... }, ... ]  // present only when >1 source merged
}
```

`source_file` paths are relative to each row's kit root:
`r11` → `Metis-2.0-Upgrade-Kit-r11/`, `v5`/`Metis-HeyClicky-Interaction-Upgrade` → `Metis-Behavior-Upgrade-v5-Hindsight/`, `v6` → `Metis-Upgrade-v6-BRAG-Hindsight/`.
