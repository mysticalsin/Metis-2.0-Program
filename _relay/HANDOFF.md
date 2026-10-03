---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 27
agent: claude-code
updated: 2026-10-03 19:40 EDT
status: in-progress (1.9.7 first; merge lane throttled by CI flakes, each now root-caused; evidence chain live)
branch: m2/integration moving; main = milestone #460 green; program main ebb13b1
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Stable 1.9.7 first (OD-45; owner ACCEPT), then Métis 2.0 = the v6 kit plus OD-56 additions, merged to main and owner-accepted by
2026-11-30, freeze M2-0210 on 11-15 (checkpoint 11-08, OD-50). Every release check preserved.

## Current state
- Owner decisions this shift: OD-62..OD-66 (OS-synthesized takeover input; one owner-runner camera job M2-0572; real-dataless timings
  from daily 1.9.9 use; pre-evidence fix closures stay closed as legacy, L11 from the install on, M2-0573; ST-1 window gate in-job
  re-measure amends OD-44, M2-0575). Lead: D-37 OPEN (bytes for promotable rows once the inspect fuse is off; M2-0558 on lead hold).
- Evidence chain live: fix38/39/40/41/42 installed (Codex SHIP each); first record filed at merge (M2-0553 DONE). 36/36 suites.
- Merge lane: PARALLEL 3 (merges starved of macOS runners). Four CI flakes root-caused (agent diagnosis + adversarial verify, Codex
  cross-check): History design 46% (never-settling fixture promise collected by main GC -> 'reply was never sent'; M2-0550 READY #474
  with the fix), packaged-smoke "Promise was collected" 3% (inspector awaitPromise on sync expressions; M2-0574 P0), ST-1 window gate
  7.7% (single-launch variance; M2-0575 P0), sidecar reaper race (M2-0551). M2-0556 relaunched with its test-hang cause
  (descendant_pids unbounded recursion). Order: state/.merge-first = M2-0574, 0575, 0551, 0550, 0556, ...
- Evidence Phase 2: ledger normalised (28 L10 caps -> EC, 31 required_evidence aligned, 28 inheritance-capped EC got unblock steps);
  tools/evidence-backfill.sh plan: ready 125, needs-validator 23, no-logs 49, ambiguous 14, other 7, legacy 55 (dry run only); Codex
  attack round 2 running.

## Next steps (in order)
1. Codex verdict on the back-fill tool; on SHIP: pilot `apply` on ONE ready PR, confirm evidence.yml passes, then the m2-0238
   back-fill workflow and the records commit; write docs/metis-2.0/evidence/legacy-fix.json (OD-65) once M2-0573 merges.
2. Watch M2-0574/0575/0551/0550/0556 to merge; then re-run #467 (M2-0543) checks; merge M2-0543/M2-0538 -> strict measurement.
3. Pre-fix41 fix tickets with a cancelled red run: scratchpad red-rerun.sh <ID> (no live run on the branch).
4. M2-0558 hold: answer D-37 before DEFER-OFFPATH lifts; update ELECTRON-FUSES.md for OD-59.
5. Ask the owner the day before T1 (about 10-17) for the OD-58 runner window. Velocity forecast once records exist.

## Decisions made (don't relitigate)
D-28 CI only (exceptions OD-46, OD-63); OD-12..OD-66; D-34, D-35; CI re-runs only the newest run (or a cancelled red run with no
live sibling), marker set; flake fixes need a verified root cause, not a longer timeout.

## Watch out
- Program repo is PUBLIC: grep every push for absolute local paths and email addresses.
- Ledger push scripts: commit messages must not contain double quotes (the generated push script quotes them).
- A ticket process shares the queue service's process group: kill only its own pid tree, never the group.
- zsh: `$var:s...` is a history modifier; brace variables before a colon. `set -- $var` does not split.
- Run the FULL suite against staged files before a Codex attack (fix42's test-27 conflict surfaced only after install).
