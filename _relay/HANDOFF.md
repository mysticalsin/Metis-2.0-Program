---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 22
agent: claude-code
updated: 2026-10-02 17:05 EDT
status: in-progress (OD-45: stable 1.9.7 is priority #1; signing excluded; IMPLEMENTER=mixed OD-40)
branch: m2/integration moving (M2-0532 merged 20:41Z); main = milestone snapshot 2d2a85e8
---

# Handoff — Métis 2.0 program

## Objective & acceptance criteria
OD-45 (owner, 2026-10-02): ship a stable Métis 1.9.7 first — capture, startup/History responsiveness, strict ST-1 tests, final
installer; unrelated 2.0 work deferred; every release check preserved. Then 2.0 by 2026-11-30.

## Current state
- 1.9.7 closure (M2-0498 deps still open): M2-0495 (capture; READY, ruling applied), M2-0533 (boot/History trims; bounced — it edited
  qa-candidate.yml out of scope, apostrophes broke a jq step; ruling: restore the workflow), M2-0535 (first-Listen Whisper load error,
  allocated to Ultron), M2-0520 (held) -> M2-0433. M2-0532 merged.
- Queue focus: codex-queue/FOCUS = the 1.9.7 closure (only these launch); PRIORITY puts them first; DEFER-OFFPATH on (merge.sh
  release_deferred: off-path PRs changing installer content wait until 1.9.7 ACCEPTED; tests/docs/QA scripts still land; release-branch
  hotfixes never wait; D-32 installer hold scoped to m2/integration; boarded trains recheck both). Codex attack r1-r3 REVISE -> r4 SHIP.
- M2-0535 for Ultron: brief docs/metis-2.0/handoffs/M2-0535-ultron-brief.md; landing branch m2/M2-0535-first-listen-whisper-init
  (AskToto-Mantu, at 0499fffb); ledger IN_PROGRESS claimed by Ultron (the Codex queue never launches it). Root cause verified:
  listen.ts:1421 epoch guard drops load errors (pendingWhisperEpochRef 0 until the first post-ready window). The lead registers
  Ultron's PR with the merge lane after an independent review.
- Strict ST-1 still fails on hosted runners (boot burst, mostly native window construction + an unprofiled block; onboarded launches
  fail too). With M2-0532 merged the timeline now attributes every block.

## Next steps (in order)
1. M2-0533 -> merge; M2-0495 capture smoke -> read its DIAG line (if a fake device with zero input: ask the owner about a QA-only
   audio-sandbox switch).
2. Collect >= 3 QA runs of fifo/control with the corrected harness; bring the owner the strict-gate decision (larger/dedicated macOS
   runner keeps OD-21 vs strict window from first show). Then release M2-0520 (rm its status) -> M2-0433.
3. When Ultron opens the M2-0535 PR: independent review, then register it (state/M2-0535.status READY AskToto-Mantu <pr> <head>).
4. M2-0498 bump -> installer hold -> qa-candidate on main -> evidence lanes -> owner ACCEPT -> delete DEFER-OFFPATH and FOCUS.
5. After ACCEPTED (owner, 2026-10-02): remove /Applications/Metis.app (1.9.6) and the 1.9.5 build copy under asktoto-release, keep all
   user data, install 1.9.7 from the release feed.

## Decisions made (don't relitigate)
D-28 CI only; D-32 installer hold on m2/integration; OD-12..OD-45; never re-run qa-candidate.yml (build once); RELEASE-GATE lane rule.

## Watch out
- Program repo is PUBLIC: nothing secret/personal/meeting-related.
- Codex attacks: allowed_domains chatgpt.com, inline all files; thread rotated today (resume refused: paginated_threads).
- Review diffs in full (never truncate a diff stat); check edits outside scope_paths.
- Stop-hook answers can differ from dialog answers: re-ask when they conflict.
