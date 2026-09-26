# Métis onboarding source improvement

This is real application source for the existing demo, not an installer, a new wizard,
or a production mock. Review `manifest.json` and `SOURCE-UPDATE.patch` in the actual repo.
The existing component baseline was previously verified to Git blob
`f61cfc0a43d53514a100da9a651ef10098693202`. Current GitHub reads returned 404;
do not assume the current local or remote component still equals that snapshot.

## Four application files

- Modified `src/renderer/src/components/OnboardingDemoScene.tsx`: Pause/Resume,
  Replay, Previous, step progress, selected-role semantics, bounded scrolling and
  visible navigation. Stop timing synchronously while hidden. Respect live reduced-
  motion changes. Keep the real child components and existing demo safety guard.
- New `src/renderer/src/lib/onboarding-demo-controls.ts`: tested elapsed-time clock,
  generation-fenced cancellation, environment subscriptions, safe optional media.
- New `src/renderer/src/components/OnboardingDemoPreviewBoundary.tsx`: contain
  optional preview rendering failure while preserving Next and Set me up; replay
  resets the boundary. It does not suppress setup/permission failures.
- New `src/renderer/src/lib/onboarding-demo-controls.test.ts`: eight repository-native
  Vitest tests. Authored and syntax checked here, not run in the full repository.

No existing test was removed or skipped. No new app runtime dependency is required.
The existing hero/media fixes from the previous v2 repair are preserved separately.
This addition intentionally exceeds the old bridge's exact 16-file manifest. A real
coding agent must integrate/review/test normally, not relax the bridge's hash checks.

## Executed evidence

43 isolated Node source tests pass, including one 25,000-transition deterministic
clock corpus. 13 real Chromium/React component-fixture cases pass, including compact
320x480/390x500 layouts, keyboard interaction, errors, replay, reduced motion and
simulated visibility changes. The original component is a negative control: an
injected optional-media exception prevents its Next transition.

48 historical literal demo-source assertions were checked: zero newly failing
assertions versus the provided original. This checks only those exact assertions,
not the complete test files or the latest repository tests.

Strict TypeScript check passes for the dependency-free production clock helper.
All four TS/TSX files pass transpilation/syntax checks. Git apply and resulting file
hashes pass in a temporary exact-file fixture; repeat application is refused.

See `evidence/` for outputs and boundaries. Browser children (Bar/Copilot/Answer/
QuickActions/ModeRecap) and shell styles are explicitly simplified test fixtures.
The actual modified parent/clock/boundary run in real React and Chromium; that is
not full Electron integration, complete visual design validation, native minimize,
or an installed-app pass. Actual runtime versions differ from repository pins.

## Reproduce the focused checks

With TypeScript available from a reviewed repository dependency installation:
`node --test tests/demo-controls.test.cjs`
Set TYPESCRIPT_PATH to that installed TypeScript module if it is outside node lookup.
The test loader also supports METIS_SOURCE_ROOT pointing at an integrated checkout.

With Python Playwright and an installed Chromium:
`python3 tests/browser/run_browser.py --chromium /path/to/chromium`
The bundled compiled browser fixtures preserve exact build inputs in
`tests/browser/fixture/BUILD-INPUTS.json`; they are testing-only. Recompile with
`tests/browser/compile-fixture.cjs` to check changed sources. React runtime license
notices are included. Never copy test fixtures into the production app.

The full application must still be checked using its own dependencies, real child
components, styles, IPC/security gates, native profile isolation and installed build.
