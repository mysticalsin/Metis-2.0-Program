# Métis r11 test-repair report — 24 September 2026

## Owner-reported state

The Mac's account reports ADMIN on `mysticalsin/AskToto-Mantu`; Python is 3.14.6 and Node is 22.22.3. The v1 bridge applied 16 files to `/Users/tony/metis-r11-work/repo`. Its publish command reached gate 6, `npm test`, and exited 1 after gates 1–5 completed. Gates 7–11 were not reached. The actual contents of `verification-20260924T083659754658Z/06.log` were not supplied or accessible here. No claim is made about all its failing tests.

## Confirmed defect and implemented correction

`src/renderer/src/lib/onboarding-hero-video.test.ts` retained two assertions that matched the old helper's variable names and statement form. Evaluating those exact expressions against the authenticated baseline returned true; both returned false against the delivered v1 overlay. This is a definite incompatibility in the delivered patch, not speculation about GitHub authentication.

The same audit found a behavioral regression: the paired-media helper executed audio play, audio seek, video play, video seek. The original contract required audio play, video play, audio seek, video seek. The v1 isolated checks did not assert the setters' actual order.

`onboarding-hero-video.ts` now uses separate synchronous start and restart phases. Both play attempts receive rejection handling before any seek. Synchronous play failure, rejected promises and seek failure remain isolated, so optional decorative media cannot throw out of these helpers and interrupt navigation. The existing single-video interface is unchanged. This does not grant permission or declare setup ready, replace Tony's welcome media, or establish installed onboarding acceptance.

The native test replaces only the two implementation-spelling assertions with observed runtime calls and setters. Other visual/source assertions are retained. Five native regression cases cover each media play/seek failure and non-restarting behavior. Nine new independent Node test cases exercise the actual implementation through the existing TypeScript source loader. On v1, 6 fail and 3 pass; after the correction all 9 pass, along with the original 133 isolated cases.

## Existing-checkout recovery

The v2 `repair` command migrates the exact v1 manifest identity to v2 while keeping the same pinned commit, working branch and 16-file application delta. It changes only the two media files; all other application code remains byte-identical to v1. It verifies working-copy, index, origin and per-file identity, creates backups, uses atomic individual file replacements and records the new session identity only after verifying the new bytes. Partial application can resume only when every source file matches an approved old/new digest; arbitrary edits are not adopted. No reset, clone, remote call, commit or push is part of repair.

OS-owned advisory locking prevents two bridge processes from writing the same workspace at once and releases automatically when the owning process exits. This is cooperative coordination, not a claim that unrelated editors cannot write files. Keep exclusive ownership of the checkout. Windows locking code is present but only Linux behavior was executed here.

Verification now creates an honest incremental `results.json`, including failed and unrun gates. Timeouts do not receive exit 0. A local, bounded failure excerpt is generated without uploading anything; obvious token forms are masked but manual privacy review remains required. The original failed log remains untouched. The full 11-command gate sequence is unchanged and is rerun for publication; no skipped tests, relaxed assertions, forced patching or reused PASS flags are permitted.

## Evidence boundaries

142 isolated source tests passed; 47 bridge tests passed; 12 patch-application tests passed; 17 scoped source files passed syntax checks. Source-order negative control: 6/9 new cases fail on v1. These counts do not represent full application CI or native user journeys. Native Vitest additions were authored and syntax-checked but not executed under Vitest here. The actual Mac rerun remains necessary.

Network dependency retrieval in this Linux runtime failed to resolve `registry.npmjs.org`; no complete repository dependency environment was available. The connected GitHub read still reports main `2bf21f1ceefe117838325342574b57852e5cadcb`, and a new connector branch-creation request returned 403. No remote source change, independent agent review, native application test, deployment, signing or release occurred.

## Remaining full-upgrade scope

All 66 root tasks remain in the original plan. The Tony-only accessible welcome, complete trusted voice/action journey, source-authorized Hindsight application binding, enterprise integrations and the remaining use cases need actual implementation or acceptance evidence. This narrow urgent repair intentionally avoids broad UI, provider, storage or release changes while the source gate is red. The exact installed Mac/Windows onboarding, signing and live service/privacy checks remain separate. **Métis 2.0 is not certified complete or release-ready.**

## Technical reference

MDN's HTMLMediaElement.play documentation describes promise-based playback success and failure and user-gesture/autoplay constraints. The repair preserves the existing synchronous call contract and handles failures independently. https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play

Vitest's official reporter documentation describes failure output and structured reporting. The bridge's excerpt is merely an extraction of existing log output; it does not replace the command's exit status or full report. https://vitest.dev/guide/reporters
