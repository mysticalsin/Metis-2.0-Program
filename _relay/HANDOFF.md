---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 13
agent: claude-code
updated: 2026-09-29 19:25 EDT
status: in-progress (full autopilot; signing excluded)
branch: public main = df205007 (ruleset PR + 5 checks); m2/integration = 8916f5cf; program repo Metis-2.0-Program is PUBLIC temporarily (OD-37; main locked against force-push; revert via M2-0480 at program end)
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
Ship Métis 2.0 by 2026-11-30: every ledger ticket at its evidence level; HeyClicky parity plus the owner's asks (r11 MASTER, v5/v6); merged to main after CI and packaged smoke are green. Signing is excluded.

## Current state
- **Ledger:** 511 tickets. The critical path is 1.9.7 (M2-0046), then the owner's 5-day soak (M2-0198), then W3+ (about 279 tickets gated by PD-12).
- **1.9.7 = FULL qualification** (OD-31, target 10-07..09). Other owner decisions:
  - OD-32: the mac build is ad-hoc signed.
  - OD-33: promote dry run. DONE, PASS (runs 36636273967 and 36643160857).
  - OD-34: supervision is default-on only after HK-M passes 20/20 on the candidate.
  - OD-35: the idle soak is two hosted legs of at most 5.5 h each, with a pre-registered growth rule.
  - OD-36: real-dataless ST-1 is proven in the owner soak.
- **Producers:** M2-0482..M2-0511, plus 16 existing tickets raised to P0 W1/m3. All are M2-0046 dependencies. Version bump M2-0498 depends on every before-cut ticket (it lands last). Launch order is codex-queue/PRIORITY; merge order is state/.merge-first.
- **P0 fixes:**
  - Merged: M2-0429 meeting audio, M2-0430 write-up speed.
  - M2-0428 right-edge hide: resolving conflicts again.
  - M2-0431 flashing: after M2-0428.
  - M2-0433 strict ST-1: long pole, CI failing.
  - M2-0193 then M2-0032: History.
  - M2-0478: diagnostics schema 2, in the merge slot.
- **Queue:** merge trains live (3 trains, 12 PRs today). Red-train blame goes to files. Flakes are in known-smoke-flakes.txt and state/.smoke-failset (RV-3 Windows; M2-0474). Scans are cached per head. PARALLEL=6, niced.
- **OD-30:** onboarding downloads the selected on-device speech engine (M2-0475 engine now, M2-0476 wiring after the soak, M2-0477 policy).

## Next steps (in order)
1. Review each P0 PR when READY. Keep PRIORITY / .merge-first on the before-cut chain.
2. After M2-0498 (bump) merges: hold installer-changing PRs on m2/integration until the owner records ACCEPTED (only tests/docs/workflows may land). This is not built into merge.sh yet; add a hold check before the bump merges.
3. Milestone merge to main with green main CI (M2-0486 area), then dispatch qa-candidate.yml on main for the 1.9.7 cut. Then run the evidence lanes on the candidate. Then release/1.9.x plus promote (publish) after ACCEPTED.
4. Owner items: M2-0012 (weekly decision slot, role names, send drafts); D-14 degrade order (M2-0197 ACCEPTED); private repo back to private at the end (M2-0480).

## Decisions made (don't relitigate)
D-28 CI only; OD-12..OD-37 in DECISIONS.md; PD-12 soak gate stays.

## Watch out
- The program repo is PUBLIC now: nothing secret, personal or meeting-related may be pushed there.
- Edit queue scripts via .new + mv. Bash 3.2 quirks. zsh: parse in bash. Read the full ledger.py check after dependency edits. Take ledger.lock for every private-main push.
- Network drops happen (22:30-22:48Z today): passes then fail silently in service.err. Check `tail logs/service.err` when the queue goes quiet.
