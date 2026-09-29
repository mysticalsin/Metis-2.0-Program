---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 10
agent: claude-code
updated: 2026-09-29 05:50 EDT
status: in-progress (full autopilot; signing excluded)
branch: public main = 858a6a22 (milestone #281); m2/integration 83fd757c (ahead of main; proof pending); private main (metis-prog-main)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level, HeyClicky-parity + owner asks (r11 MASTER, v6), well-structured code; merges incl. m2/integration -> main after CI + packaged smoke are green (owner directive); signing excluded.

## Current state
- Ledger: M2-0001..M2-0411 (175 new from the 2026-09-28 capability audit, review/audits/2026-09-28-capability-gap-audit.json). Decisions OD-13..OD-17 in DECISIONS.md.
- Worker: launchd com.tony.metis-codex-queue -> service.sh -> queue.sh 3 (guard.sh, merge.sh + milestone.sh in background, launches). OD-14: codex-queue/IMPLEMENTER=claude (headless Sonnet via tools/claude-build.sh, --permission-mode default + allowlist; audited) until the Codex quota resets Oct 3 3:21 PM (CODEX-DOWN auto-expires) — then rm IMPLEMENTER and restart the queue loop.
- 2026-09-29 01:00Z: ~13 READY PRs; the ledger's only launchable TODO is M2-0417 — everything else waits on READY root blockers (M2-0031 #259, M2-0049 #292, M2-0028 #272, M2-0071 slice 1). Merge throughput is the critical path.
- CI capacity: macOS runners (5) were saturated (31 queued runs; integration smoke waited 38 min). Cause: merge.sh synced EVERY behind READY PR after each merge (~13 full check suites per merge), plus build.yml/isolation-canary.yml never cancel superseded runs. Fixed: merge.sh single-slot queue; M2-0417 (P0) files the workflow concurrency groups.
- M2-0071 sliced restart: #268 closed (branch kept; worktree moved to metis-quarantine-M2-0071-v1); slice 1 = harness + DustSetup/AgentPicker behaviour tests on unmoved Settings.tsx (state/M2-0071.lead, branch m2/M2-0071-s1-settings-tests). After each non-final slice merges, reset the auto DONE to TODO "slice .N merged #PR" and rewrite the lead for slice N+1.
- Gates: per-PR packaged smoke (ready_for_review), failset baseline (state/.smoke-failset) + owned rows (state/<ID>.owns), post-merge smoke STOP on growth, revert guard, hygiene (paths too), READY pins reviewed SHA, WAIT_OWNER for the owner's tool (OD-15), known-flakes.txt, red run off (RED-RUN file re-enables).

## Next steps (in order)
- P0 M2-0031: OWNER chose B (OD-21): ST-1 stays strict (whole run incl. boot < 250 ms). ROUND FOCUS v8 is in state/M2-0031.lead:
  split the BrowserWindow constructor (591-706 ms native, show:true) from its first show, split/defer the remaining boot tasks and boot I/O.
  If only an unsplittable native call or idle-profile runner noise remains, report the numbers to the owner and never relax the criteria.
- 2026-09-29 done: owner-approved ledger batch c12ae4b (M2-0423 P0 brain-index no-destroy, M2-0424..0427, HM-FLOW refs, deps: the M2-0129->0136 edge was
  omitted because it would cycle), M2-0417 check (integration never cancelled; superseded cancellation not yet observed), M2-0013 verification fix,
  M2-0028 merged (HK-M 3/5 bounded pass; the lead verified the reaper never kills by name), M2-0422 boot fix merged, stale public branch deleted.
- Merge order: codex-queue/state/.merge-first (root blockers by impact: M2-0050 235, M2-0028 160, M2-0103 120, M2-0119 110).
0. Owner decisions still open from the LEAD_ACTION triage: private Actions budget (unblocks ~12 evidence rows), D-5 platform/region/owner, plaintext-mirror audience, M2-0014 prod readbacks, Dust admin, Windows laptop, D-8, branch protection, delete stale public branch m2/M2-0014-audit-operator-production-reality.
1. M2-0031 (History freeze P0) must pass the QA-candidate job "ST-1 fifo stall row (macOS)"; plan v4 in codex-queue/state/M2-0031.lead. Then cut 1.9.7 per D-13 (M2-0046: notes in docs/metis-2.0/releases/1.9.7.md; dispatch promote-candidate.yml from main; prerelease, not Latest, no latest*.yml, SHA256SUMS).
2. Queue flows the whole ledger by priority (FOCUS lifted; PARALLEL=4). New P0s first: M2-0237.., M2-0412 (portal model policy, OD-18), M2-0413 (brain test cleanup race).
3. Lead actions now that main has the workflows: evidence dispatches in codex-queue/LEAD-ACTIONS.txt.
4. OD-19: Claude implements (Sonnet) and reviews (Opus) until 2.0 is fully ready — do NOT switch back to Codex on Oct 3.

## Decisions made (don't relitigate)
- D-28 CI only; OD-12 Electron app is the product (OD-16 adds native Mac parity in 2.0); OD-14/OD-19 Claude implements (Sonnet) + reviews (Opus) until 2.0 is ready; OD-15 owner's tool may push to ticket branches (adopt + full gates); OD-16 CF key out of all installers, FR+EN, developer skills in 2.0; OD-17 MASTER 4.3 voice tiers, D-24 facts-only (derived built, off), D-5 self-hosted Hindsight.

## Queue rules added 2026-09-28 (evening)
- merge.sh judges each PR check by its NEWEST run (per name + workflow); a cancelled newest run with no sibling is re-run once (state/.rerun-<rid>); PR bodies get the refactor-classification section before every sync (lib.sh backfill_classification; M2-0059's Evidence check bounced synced PRs otherwise); ledger commits are path-limited to tickets.json. state/.merge-queue shows slot + wait order.
- Honest ledger (2026-09-29 evidence audit, d58bf58): ledger.py done closes DONE only when a merge proves every required level (DESIGNED; LOCALLY_TESTED only on the public repo); otherwise ENGINEERING_COMPLETE with evidence.pending. Private docs PRs run no CI (private Actions budget exhausted) and say so.
- Merge-queue (2026-09-29, single slot): at most ONE public PR is synced to the current base (GitHub update-branch, READY re-pinned, re-marked ready) and re-checked at a time; other behind PRs wait in ticket-ID order. A PR merges only onto an m2/integration head watch-integration.sh has proven (state/.int-checked == base). merge.sh no longer waits post-merge; watch-integration.sh is the single post-merge prover (STOP on red).
- watch-integration.sh (every cycle) proves any new integration head (outside merges included): Build & Test red -> STOP unless only known/infra flakes (one rerun); smoke failset growth -> STOP.
- READY pins the reviewed SHA; a moved head -> WAIT_OWNER (owner tool, OD-15) until 30 min quiet, then re-review.
- ledger.py: engineering_first flag (OD-20, 32 tickets) runs outside-blocked tickets' engineering half; merges of tickets with live-evidence requirements or an external_blocker close ENGINEERING_COMPLETE. state/<ID>.mode overrides routing (12 set). PARALLEL file (now 5). classification_section in every PR body (M2-0059 check). Codex = none (OD-19: Sonnet implements, Opus reviews; git rm allowed; default permission mode).
- Owner actions pending: GitHub branch protection on public main (agent blocked from repo settings); private-repo Actions budget; Cloudflare read-only prod queries (M2-0014), staging authorization (M2-0103).

## Watch out
- Private main was force-reset to 90ed28f twice (09-27 04:35Z, 09-28 05:05Z); guard.sh heals rewinds. Owner has not said whether that is his tool.
- Sandboxed vs unsandboxed $TMPDIR differ; keep lead scripts under codex-queue/.
- RTK hook rewrites `git show ref:path`; use git cat-file -p in a script.
- Edit running queue scripts only via .new + mv (never rewrite in place);
- Parse gh/CLI listings with a delimiter (| via --jq), never whitespace: workflow names contain spaces ("Packaged smoke") — a whitespace split cancelled 13 current-head smoke runs on 2026-09-29 (re-run).
- Public branch m2/M2-0014-audit-operator-production-reality is a bare integration snapshot (0 own commits, no private content) from the old misroute; deletion needs owner approval.
- restart queue.sh (kill it + the service sleep) to pick up queue.sh changes.
