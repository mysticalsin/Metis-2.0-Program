# Métis: work on the existing application, not another setup wrapper

This is an authorized coding job for Tony Walteur's existing `mysticalsin/AskToto-Mantu`
checkout. The user wants real implementation and a visible, functioning application,
not another prompt-only handoff or a claim that a PR updates the installed app.

## First concrete deliverables

1. Inspect the actual checkout, its AGENTS.md/CLAUDE.md/DESIGN.md and applicable local
   instructions, branch, diffs and all worktree owners. Preserve dirty work and keys.
   Establish a before-state with exact SHA and a safe patch/backup of intended files.
   Do not clone over this checkout, switch branches blindly, reset, clean, delete or
   force-apply anything. This package's verified historical baseline is
   `2bf21f1ceefe117838325342574b57852e5cadcb`, not a claim about today's remote.
2. Read the existing failed `npm test` log under the workspace's
   `verification-20260924T083659754658Z/06.log`. If newer verification logs exist, inspect
   their results as well. Diagnose the actual errors, including transform failures,
   unhandled rejections, timeout/environment cases and the complete exit status.
   Do not infer the test failures solely from the prior chat.
3. Review `previous-repair` (unchanged v2 repair package) and compare the current
   `onboarding-hero-video.ts` and its test with those repaired bytes. Integrate missing
   media ordering/error isolation changes by reviewed content. Do not overwrite newer
   edits. The prior bug was audio play -> audio seek -> video play -> video seek;
   preserve both play attempts before either seek, and contain every independent failure.
4. Review `onboarding-update/README.md`, manifest, patch and source. Add the real
   playback clock, preview error boundary, controls and native tests to the actual
   existing OnboardingDemoScene. Check the exact old component blob before direct
   application. If it differs, reconcile manually and preserve current architecture.
   Run the focused tests and actual component browser tests with repository-pinned
   React/Vite/Chromium, not just the supplied isolated fixture. Preserve the demo guard.
5. Fix the real root causes of all newly observed test failures. No skips, weakening
   meaningful assertions, swallowing crashes, false-green transformations, manufactured
   success, blanket fixture rewrites or mutating user/profile data to make tests pass.
   The earlier bridge deliberately hashes a fixed 16-file delta. After adding new
   reviewed application code it SHOULD reject that changed scope: do not weaken it or
   repeatedly run its publish command. Own the normal Git/test/review workflow instead.

## Make the work visible without risking Tony's installed profile

Inspect the actual Electron main/start scripts and supported profile isolation. Determine
the exact process/executable/source currently running. Use the repository's real supported
development/QA profile isolation, with a new empty profile and separate output directory.
Never invent an environment variable and assume isolation works. Verify paths and a distinct
profile BEFORE launching a preview; if the code has no supported isolation, implement and
test it as a reviewed separate slice first. Do not attach to or rewrite the live installed
app profile, stored keys, meetings, permissions or settings. Do not disable OS security,
remove quarantine recursively, use --no-sandbox on the user app or modify trusted roots.

Build and open a clearly labelled development preview containing the actual new code,
with explicit source identity and the user able to see the new controls. Do not call an
HTML fixture the application. Exercise Pause/Resume, Replay, Previous, all four Next steps,
Set me up, reduced motion, keyboard input, visibility restoration, failed optional media,
render-error recovery and compact bounds. Keep controls outside optional preview failures.
Preserve hero -> problem -> reveal -> appearance -> setup -> personalize -> optional license
-> Ready, permission/consent/readiness gates and existing branding. Record what worked on
the real Mac separately from Windows, installed/signed artifacts and production services.

## Then execute the original full plan

The complete unmodified original handoff is in `r11-kit`, including MASTER revision 4.5,
the 66 root task registry and all referenced memory, collaboration, onboarding and
acceptance files. Read START-HERE.md, CODEX-START.txt, MASTER's ownership/onboarding/
collaboration/memory sections, and delivery/RUN-ORDER.md. Use tools/read_task.py after
reviewing it, or equivalent bounded reads. Keep historical source exports as reference
only; they are not a replacement repo and must not overwrite newer source.

Retain every requirement/use case/task/dependency; no new "minimal 2.0" scope reduction.
Continue inspect -> bounded plan -> actual code -> focused/full checks -> independent
review -> fix -> integrate -> evidence. Keep durable local checkpoints so context
compaction doesn't repeat investigation. An available artifact or a function signature
is not a deployed, verified capability.

The next broad lanes include:
- Retained accessible onboarding and Tony-only authentic welcome or complete text fallback.
- Trusted opted-in command audio/wake, cancellation and verified native action results.
  Meeting transcripts and model output cannot grant action authority.
- Real speech/translation/diarization/interruption, named agents/skills and canonical
  Intelligence with source-linked, authorization-aware Hindsight binding.
- Entra/Teams and real enterprise integration lifecycles, private provider routing and
  exact durable usage/accounting, including failure/retry reconciliation.
- Native platform/package/installer/upgrade evidence, service readback and legitimate signing.

Do not delay independent safe implementation for an unrelated unavailable signing key.

## Actual agents, not fictional assignments

Discover the coding runtime's real delegation/worktree tools and any installed authorized
Claude/Fable collaborator. Fable is a role/session name in the handoff, NOT a known executable.
Start with a small real independent review before scaling. If available, delegate disjoint
bounded work to actual workers: (A) reproduce/fix tests, (B) review onboarding accessibility
and lifecycle, (C) review privacy/command authority, then later independent plan lanes.
Supply exact source-bound contexts, named files, acceptance conditions and small summaries.
Keep one integrator and exclusive ownership of each writable path. Do not let two agents
edit the same checkout concurrently. Read-only review can run in parallel.

Report actual worker/session IDs and results only when the runtime created them. Where no
real collaborator is available, implement directly and explicitly leave independent review
open. Do not claim roles described in markdown were spawned. No unattended/background
daemon or permission-bypass mode. Respect the operator's approvals and Ctrl+C.

## Evidence and publication boundaries

Use the repository-pinned Node/dependencies; preserve lockfiles unless a reviewed fix needs
a change. Run the actual scripts, source typecheck, bug-ledger gate, build, complete tests,
proxy/Operator tests and generated-bundle drift gates, dependency audit and relevant native
checks. Read existing package/workflow definitions first. Always capture exit status and
distinguish 0 tests from passing tests; do not reuse prior PASS flags after source changes.

A local checkpoint commit/review branch may be prepared after user changes are isolated.
Remote push/draft PR can be proposed through normal interactive approval and should be a
reviewable source-bound result, never a force push. No merge, version bump, public tag,
service policy change, paid provisioning or production deployment without the applicable
explicit authorization. Native signing/real-service evidence cannot be replaced by mocks.

At checkpoints report exact files and behavior changed, tests actually run, identity of
the runnable preview or artifact, independent review outcomes, and remaining blockers.
At a real blocker state the exact operation, who owns it and smallest unblock, while
continuing other permitted tasks. End with evidence-backed completion or explicit remaining
gates, never "fully done" merely because code compiles.
