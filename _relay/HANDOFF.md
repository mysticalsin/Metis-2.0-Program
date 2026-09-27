---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 7
agent: claude-code
updated: 2026-09-27 12:40 EDT
status: in-progress (Codex worker running as a service)
branch: public m2/integration = 9d05e1e7 (green, run 36333276942); private main (metis-prog-main)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; external items BLOCKED-visible; launch film; owner signs off milestone PRs into main and the release.

## Current state
- Ledger: {'DONE': 47, 'IN_PROGRESS': 10, 'TODO': 169, 'ENGINEERING_COMPLETE': 1, 'CANCELLED': 1}
- OWNER DIRECTIVE 2026-09-27: Codex finishes everything remaining (Claude weekly limit). Codex implements AND independently reviews; CI is the hard gate.
- Always-on worker: launchd com.tony.metis-codex-queue -> ~/AI-Brain-build/codex-queue/service.sh (queue.sh 3 parallel, ticket.sh, merge.sh one-at-a-time + integration CI, fix-integration.sh heals red integration, STUCK retried once, Mac notifications). Logs: codex-queue/logs/queue.log; state: codex-queue/state/.
- Full Codex handoff for humans/Codex app: ~/Downloads/METIS-2.0-CODEX-NEXT-STEPS.md.
- Shipped this shift: rocket-fuel Rocks 1+2 (#253, owner G6 yes), M2-0225 (#240), M2-0226 (#246), M2-0227 (#243), hotfixes #245 #248; P0 heavy-PC fixed (M2-0026, M2-0033); History-freeze gateway core (M2-0030) — wiring M2-0031 in progress by Codex.

## Next steps (in order)
1. Let the service run. Check queue.log and state/*.status; if STOP persists or tickets are STUCK after retry, intervene (read state/<id>.feedback).
2. Owner-held tickets (ledger.py skipped): Tony's decisions/accounts — signing, publishing 1.9.7, Teams/M365, Cloudflare prod, soaks, sign-off.
3. Milestone PR m2/integration -> main for Tony's review when the 1.9.7 P0 set (M2-0031 included) is merged.

## Decisions made (don't relitigate)
- D-28 CI only; OD-12 desktop app; OD-13 Codex implements (now also reviews); D-4/6/9/11/12/13 answered; M2-0011 re-scoped to the private repo (public #211 closed).

## Watch out
- Merge one PR at a time and ci-proof m2/integration after each (combined merges broke integration twice).
- ps from Claude's shell cannot see launchd processes; use launchctl print gui/501/com.tony.metis-codex-queue and the logs.
- 2026-09-27T04:35Z external mirror push incident: run tools/repo-guard.sh.
