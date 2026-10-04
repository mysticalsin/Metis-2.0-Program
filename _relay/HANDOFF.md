---
project: Métis (AskToto-Mantu) — 2.0 program
shift: 28
agent: codex
updated: 2026-10-04 21:23 UTC
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
- Independently reviewed and fast-forwarded the inactive M2-0538 local owner branch to f78bedc87109dc980f5437aa945e6264d5933a16, test-first48f7d443. Exactly19 existing download-action pins use official fixedv6 SHA018cc2cf5baa6db3ef3c5f8a56943fffe632ef53. Node/web no-emit pass; tests no-emit retains five baseline TS2345 diagnostics. Remote PR464 remains a404f7df; status stays blocked pending publication and actual exact-head CI.
- M2-0495 full original-feature independent SOURCE PASS, REQUIRED none, atb4d477cd0d2dea67f32407eae4fbfdb82c0fd438, now adopted onto the clean inactive local owner. Hosted profile/WAV containment, identity-checked cleanup, original permission contract, fixed action pins, genuine Listen clock and bounded pinned CDP protocol preserved. Remote PR377 remainsd0bf4133; actual runtime capture PASS still required.
- M2-0205 full original-feature independent SOURCE PASS, REQUIRED none, atbd8a74a6badbbfbc09b725173dc1725fdebd76cd. Clean inactive local owner fast-forwarded to that exact head, status blocked for publication/actual CI; original held pin unchanged. Mirror admission, precisely owned snapshot erase, stat/decode cache and architecture accounting repaired. Strict profile modes/default legacy/private once audit preserved. Source hash e2393a47824033466247061d8cddcda837d35f181b7fa090327f35dc8b1343d0.
- M2-0561 full independent SOURCE PASS, REQUIRED none, atc9af93271c569f7d82f6293def12ee9095282033; a new isolated local owner checkout was allocated from that exact head, statusSTUCK until actual CI. Failed/exhausted/pending probes and harness-owned encrypted-settings restoration corrected; reviewed productbd8/e239 source pin verified. Candidate and1.9.6 rollback bytes, per-launch actual mode/audit/write gates and process identity guards remain intact.

- Lead allocated M2-0202.4 to an isolated Codex branch m2/M2-0202-s4-codex-island, based on reviewed Reader01cf7034 (PR480 has green required source/smoke checks). The current slice3 owner/READY pin remains unchanged. Bound the next writer to the slice4 flag, right-edge components/lib, and island variants of Answer/Copilot/Markdown; production flag stays false and separate review/CI are mandatory.

## Blockers
- Stable isolated preview2361cfb08c4e4173b79142d1b0a7814e41437b20 independently SOURCE PASS, REQUIRED none. All21 fixed download pins, captureb4, strict8ca/f78, unchanged permission hook and existing release/inspector contracts verified. Main/web no-emit pass; tests retain five baseline diagnostics. The2.0 ledger/product/owned-Windows-capture previewa8e9bccb65f6597945bd8438f6a3cdac737cd29c is source REVISE because original owned80bb capture gate treats PowerShell transport failure as proof and can PASS an early-exited candidate. Root reverified clean inactive owner, backed up old READY status and held it STUCK; isolated two-file proof correction allocated to a separate Codex writer, with independent review and all original duration/audit thresholds preserved. No shared integration changed or new runtime CI exists.
- Exact failing publication: GitHub app create_branch for mysticalsin/AskToto-Mantu, m2/M2-0538-codex-artifact-delivery from a404f7dfd82157ce3815a561ea4d8fdd6c5b7846 returned GitHub API error403 Resource not accessible by integration. This is an integration-permission denial, not a rate limit; no branch was created. Smallest supported user action: restore the connected GitHub app's write access to this repository. Do not switch credentials/routes to evade the denial.
- The specifically denied queue state/M2-0541.feedback write remains paused pending its own explicit authorization. Its prepared correction is not adopted or routed through another queue destination.
- Fresh exact-commit runtime checks, valid strict/control/FIFO measurements, actual capture, all remaining right-edge slices, candidate qualification and owner acceptance are still required. Static/source review does not satisfy these gates.
- Corrected product and rollout now have full exact source reviews and local adoption; actual publication/runtime evidence remains blocked. The harness fails closed for absent or mismatched provenance. Full corrected combined checks remain required.

## Next steps
1. Finish the bounded M2-0559 proof correction and separately review its full exact source; retain blocked statuses, thresholds and original owner history. Recombine corrected Windows capture with ledger/product/stable in the isolated preview for exact independent review.
2. Finish allocated right-edge slice4 under the binding amended spec, production flag false; preserve current slice3 ownership and obtain separate exact-head review.
3. Bind M2-0561 to the final reviewed product contract, then combine all approved corrections only in an isolated preview and obtain independent review/static checks on that exact combined commit. Preserve all other scenarios, including M2-0559.
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
