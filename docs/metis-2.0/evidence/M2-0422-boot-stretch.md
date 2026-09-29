# M2-0422 — boot-phase longest main-thread stretch (after-merge LEAD_ACTION)

Recorded 2026-09-29 by the lead (Claude) from public CI; no local runs (D-28).

- Run: QA candidate self-test (PR #337) run 36608178436, head `51132486` = m2/integration head, which contains #318 (`9fd43008`). Every job green, both ST-1 jobs included. Chosen because it builds exactly the integration head; earlier post-#318 self-tests (PRs 259/335/319) carried unmerged PR code.
- Artifacts: `st-1-macos-fifo` (11054174244) and `st-1-macos-control` (11054991705), copied to `raw/M2-0422/` (cpuprofile, ST-1 JSON, content-free audit log). CI keeps PR self-test artifacts 7 days.
- Method: longest run of consecutive non-`(idle)` samples in the V8 `.cpuprofile` (sum of timeDeltas).

| Profile | Baseline (run 36527480638) | After #318 (run 36608178436) | Next-longest stretch |
|---|---|---|---|
| fifo | 1282 ms | 651–652 ms | 608–616 ms |
| control | 1419 ms | 904–916 ms | 767–769 ms |

(Two independent measurements, the triage agent's and the lead's, agree within 12 ms.)

The former single boot block is split in two. The stretches still over 250 ms are owned by M2-0433 (strict ST-1, OD-21), which gates 1.9.7.
