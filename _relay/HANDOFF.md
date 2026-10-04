---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 28
agent: codex
updated: 2026-10-04 19:55 UTC
status: in-progress (authorized Codex takeover; local adoption; publication blocked by GitHub integration 403)
branch: m2/integration = 90c671ec6513ba8ce6cfaae17d276dc4061d047a
---

# Handoff — Métis 2.0 program

## Current state
- Stable 1.9.7 remains the first gate, then the full 2.0 scope. Published baseline is 1.9.6; no accepted 1.9.7 exists.
- Tony explicitly authorized full Codex takeover, lead allocation and separate independent Codex review while Claude is unavailable (OD-68). The supported queue IMPLEMENTER is now codex; no route source was changed. PARALLEL remains 3.
- STOP is unchanged: packaged smoke failed on integration90c671ec. No merge, deployment, release, credential or security change was performed.
- Exact integration Build & Test run37174602443 passed. Packaged smoke37174602417 attempt2 failed in macOS unsigned-build setup with ENOTFOUND nodejs.org before app smoke; Windows passed. This is not accepted packaged proof.
- The connected GitHub integration still returns 403 Resource not accessible by integration when creating the allocated M2-0538 repair branch. Remote publication and new exact-commit CI are blocked; no alternate credentials or write route were used.

## Done this shift
- Recorded bounded lead allocations in existing queue state for M2-0538, M2-0543, M2-0495, M2-0205 and M2-0561, preserving all earlier rulings. No active ticket running markers were present at allocation.
- Fast-forwarded the clean, inactive M2-0543 local owner worktree to separately reviewed8ca364dac4dbdb1ebed27a2be050d892790bf339. Its three-file correction makes INVALID exit1 and leaves all criteria intact. Remote PR467 stays7c85ed5f; new status is blocked pending publication and actual CI, not READY.
- Committed the M2-0538 artifact-delivery repair on an isolated branch at f78bedc87109dc980f5437aa945e6264d5933a16, test-first48f7d443. Exactly19 download-action pins now reference official fixedv6 SHA018cc2cf5baa6db3ef3c5f8a56943fffe632ef53. A contract test prevents reintroduction. Node/web no-emit pass; tests no-emit has the same five known TS2345 diagnostics. Separate review is in progress; no runtime CI ran on this head.
- Adopted the separately reviewed capture classification/cleanup correction onto current ownerd0bf4133 in its isolated M2-0495 branch, resulting5f67c8b94f44353e5be1eb04dcc88658c7d2c24c. A separate writer is diagnosing the real capture failure in run37174623870/job111358686028 before further bounded changes. No accepted capture exists.
- Allocated separate concurrent writers: M2-0205 profile-scoped shipping selector plus once-per-launch mode audit; M2-0561 registry/workflow/rollback verification plus consumption of that exact contract. Each works in its own branch and checkout, with separate independent review required.

- Lead allocated M2-0202.4 to an isolated Codex branch m2/M2-0202-s4-codex-island, based on reviewed Reader01cf7034 (PR480 has green required source/smoke checks). The current slice3 owner/READY pin remains unchanged. Bound the next writer to the slice4 flag, right-edge components/lib, and island variants of Answer/Copilot/Markdown; production flag stays false and separate review/CI are mandatory.

## Blockers
- GitHub integration create-reference403 blocks publication and required runtime CI. Restore that integration's repository write access before publication; do not switch credentials/routes to evade the denial.
- The specifically denied queue state/M2-0541.feedback write remains paused pending its own explicit authorization. Its prepared correction is not adopted or routed through another queue destination.
- Fresh exact-commit runtime checks, valid strict/control/FIFO measurements, actual capture, all remaining right-edge slices, candidate qualification and owner acceptance are still required. Static/source review does not satisfy these gates.
- M2-0205's reviewed old selector reads environment variables and has no mode audit. The allocated amendment must land as a freshly reviewed contract before packaged ledger rollout can run. The harness currently fails closed when the contract is absent.

## Next steps
1. Finish independent review of exact M2-0538f78bedc8; adopt it locally through the inactive owner branch, preserving old pins/history and a blocked status until exact-head CI.
2. Finish the bounded capture diagnosis/correction and the profile-selector/audit implementation; independently review exact commits.
3. Complete M2-0561 against the actual profile/audit contract; verify both candidate and release-feed rollback bytes before any launch and preserve all other scenarios, including M2-0559.
4. When the same GitHub integration has write access, publish through the documented owner process and obtain genuine exact-head CI, red-before evidence where applicable, and all actual packaged gates. No report-only green may stand in for a measured PASS.
5. Obtain checks on the exact authorized combined commits, then candidate stress qualification under OD-69. Merge/promotion/deployment require their applicable explicit authorization and owner acceptance.

## Decisions made (don't relitigate)
- All prior owner rulings OD-1..OD-67 remain in force except the allocation/review model restriction superseded by OD-68 and the five-day elapsed stability wait superseded by OD-69.
- D-28 CI only remains binding, with only its existing scoped exceptions. Local TypeScript no-emit is allowed; repository scripts/tests/apps do not run on the Mac.
- A reviewer never approves its own work. Exact heads and candidate bytes, actual runtime outputs and required evidence determine acceptance.
- Preserve STOP, all release checks, sandbox and privacy controls, current owners' work, and dependency/merge order.

## Watch out
- Program repo is PUBLIC: no absolute owner paths, personal emails, account IDs, private content or credentials in pushes.
- M2-0541's specific denied feedback action is separate from the approved general takeover; do not bypass it.
- Existing READY reviews belong to their pinned heads. New local commits remain blocked until actual CI/review/evidence repin them through the lead process.
- Queue services share process groups; never terminate the group or inject into active Claude sessions.
- Existing M2-0559 owns Windows capture work in the candidate scenario files. The M2-0561 writer owns only the named ledger scenario contract.
