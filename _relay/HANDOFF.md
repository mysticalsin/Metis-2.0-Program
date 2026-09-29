---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 11
agent: claude-code
updated: 2026-09-29 13:35 EDT
status: in-progress (full autopilot; signing excluded)
branch: public main = 858a6a22; m2/integration = 51132486; private main (metis-prog-main)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; HeyClicky parity plus the owner's asks (r11 MASTER, v5/v6); well-structured code; merged to main after CI and packaged smoke are green (owner directive). Signing is excluded.

## Current state
- Ledger: 445 tickets (60 DONE, 56 EC, ~325 TODO). `python3 codex-queue/ledger.py check` shows known wave-order notes and 13 post-freeze (m5/m8/m10) closure notes.
- Worker: launchd com.tony.metis-codex-queue -> service.sh -> queue.sh (guard, merge, milestone, watch-integration). PARALLEL=7. Claude implements (Sonnet; Opus when owner_model=opus) and Opus reviews (OD-19).
- **Merge train (new, 2026-09-29):** merge.sh squashes up to 4 behind PRs whose own checks are green onto integration as single-parent commits. They are checked once through PR queue/merge-train -> m2/integration, then squash-merged in order, with the integration tree verified after each car. A red train or no verdict in 3 h sends its cars solo (state/<ID>.solo). The single slot is still used when the first PR in line is not train-ready. This was reviewed adversarially (4 blockers and 6 risks fixed) and dry-run tested. The first live train has not formed yet.
- **Flake handling:** codex-queue/known-smoke-flakes.txt. merge.sh re-runs a matching failed run once, and watch-integration re-runs integration smoke once before STOP. The current entry is the Windows packaged-asr failure "no transcript lines" (twice on 09-29); root-cause ticket M2-0445 (P1, opus).
- guard.sh ignores queue/merge-train and GitHub's update-branch sync commits.

## Critical path to 1.9.7 (M2-0046)
1. M2-0428 right-edge hide #329 (lead-reviewed PASS) and M2-0429 meeting audio #332 (lead-reviewed PASS; flake re-run) are both in flight on the base.
2. M2-0430 slow write-up: conflict sync running. M2-0431 flashing starts after M2-0428 merges.
3. M2-0433 strict ST-1 and M2-0193 History are implementing (both had CI failures and are iterating); M2-0032 follows M2-0193.
4. Then cut 1.9.7 per D-13: prerelease, not Latest, no latest*.yml, SHA256SUMS, promote-candidate from main, and dispatch the HK-M 20-cycle candidate.
5. M2-0202 island redesign slices S1..S7 start after M2-0428 and M2-0431 (reset the auto DONE to TODO per slice and rewrite the lead).

## Next steps (in order)
1. Watch the first merge train land (queue.log "train #"). If it stalls, read state/.train and state/train.required.
2. Review each P0 PR when READY: M2-0430, M2-0431, M2-0433, M2-0193, M2-0032.
3. When M2-0445 merges, remove its line from known-smoke-flakes.txt.
4. Owner items: confirm the M2-0429 OBU-03 exception (one-click tccutil reset of Métis's own Screen Recording entry). Also: Screen Recording remove and re-add on the Mac, disable the Windows PC stale clone push, private Actions budget, D-5, D-8, branch protection, mirror audience, Dust admin, Windows laptop, M2-0189 POLICY.

## Decisions made (don't relitigate)
- D-28 CI only. OD-12 Electron app. OD-14/OD-19 Claude implements and reviews. OD-15 the owner's tool may push to ticket branches (adopt it and re-run full gates). OD-21 strict ST-1 via M2-0433 (OD-24 split). OD-22 no-scroll island. OD-23 top-center reveal from the notch only. OD-25 Reader view for long content.
- The merge train is the default lane. The single slot stays the fallback.

## Queue rules
_relay/QUEUE-RULES.md. The honest ledger: DONE only when a merge proves every required level; otherwise ENGINEERING_COMPLETE with evidence.pending.

## Watch out
- Edit running queue scripts only via .new + mv. macOS /bin/bash is 3.2: no apostrophe inside "${VAR:-text}", and guard empty arrays with ${a[@]+...}.
- zsh does not word-split: run multi-field parsing in bash. Parse gh output with | delimiters.
- Private main gets force-reset by the owner's Windows PC stale clone; guard.sh heals it.
- Take codex-queue/ledger.lock for every private-main push.
