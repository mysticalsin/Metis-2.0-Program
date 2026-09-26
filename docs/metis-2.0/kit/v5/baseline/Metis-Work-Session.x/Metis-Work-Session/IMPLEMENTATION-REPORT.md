# Métis: implemented source improvement and real execution route

Date: September 24, 2026.
Status: **local source improvement and tested launcher; not integrated, installed or released**.

## Actual application changes

One existing application component is changed: OnboardingDemoScene.tsx. It now has
Pause/Resume, Replay this step, Previous, step status and accessible selected-role
state. A generation-fenced clock separates elapsed playing time from hidden/paused
time, handles reduced-motion changes and releases old owners. The playback controls
and Next/Set me up live outside optional-preview render failures, and replay resets
that error boundary. Optional-media exceptions/rejections do not own navigation.
Compact scrolling keeps the navigation row reachable in the component fixture.

Two production helper files and one native Vitest file are added. No application
runtime dependency, production service, account permission, user key, live profile
or installer is modified. Existing real demo children/guards remain production imports.
The original v2 media fixes are retained separately, not reverted or expanded silently.

## Source binding

The supplied component baseline hashes to Git blob
f61cfc0a43d53514a100da9a651ef10098693202, matching the previously recorded authenticated
source register at commit 2bf21f1ceefe117838325342574b57852e5cadcb.
This session's current GitHub branch and exact-file reads returned 404, so these changes
are grounded in the uploaded verified snapshot, NOT a freshly synchronized checkout.

The attached SOURCE-UPDATE.patch applies to that exact component with the new helper/test
paths absent. Git apply/check and all four resulting hashes were tested in a temporary
Git fixture. This does not prove current remote compatibility; the local agent must
reconcile any newer source and preserve Tony's modifications.

## Executed results

| Check | Actual result | Boundary |
|---|---:|---|
| New isolated source tests | 43 passed, 0 failed/skipped | Real helper TS; injected scheduler/environment fixtures |
| Deterministic clock corpus | 25,000 state transitions | Included within one of the 43 tests, not separate cases |
| Real React/Chromium component fixture | 13 passed | Actual parent/clock/boundary with explicitly simplified child components/styles |
| Browser negative control | Original media exception blocks Next | Exposes an original component fragility, not proof of all installed failures |
| Historical literal source assertions | 48 checked, 0 new regressions | Only those exact provided assertions, not complete latest test files |
| Strict TypeScript | Passed for clock helper | Not whole-app import/type graph |
| TS/TSX syntax | Four scoped files, zero diagnostics | Transpilation, not full project typecheck |
| Launcher contract tests | 24 passed | Temporary real Git and explicit CLI subprocess simulations |
| Existing v2 isolated source suite rerun | 142 passed | Preserved prior source bundle, not full application CI |
| Scoped patch application | Check/apply + all hashes passed; repeat refused | Temporary source fixture, not repository release validation |

The browser cases cover four Next steps, keyboard entry, pause/resume, replay/Previous,
optional-media failure, preview render-failure recovery, reduced motion, simulated
visibility restoration, selected-role state, unmount cleanup and four compact/desktop
viewports. Runtime: Node 22.16.0/TypeScript 5.8.3, Chromium 144.0.7559.96,
React 18.2.0 and ReactDOM 18.2.0-next-9e3b772b8-20220608. These differ from the repository
pins and require rerunning in the actual app. The test shell is NOT the full application
CSS, and callbacks/guard observation are not native IPC/security acceptance.

Eight repository-native Vitest tests were authored and syntax checked, but not executed
under Vitest here. No full repository dependency install/typecheck/test/build, native
Mac/Windows application, live service, trusted signing or production deployment passed
in this environment. The actual failed Mac 06.log was not available here.

## Different execution route

The old bridge only repaired, tested and published a fixed source delta. The new launcher
actually invokes a locally installed coding agent, interactively, in Tony's existing
authenticated checkout. It finds its own folder, checks repo identity and supported
permission flags, preserves dirty/staged work, and hands the agent the full concrete job.
Normal approval prompts stay enabled; no permission bypass, unattended service or fake
collaborator is used. An unchanged copy of all 66 original root tasks remains in r11-kit.

This chat did not start that Mac session, spawn subagents, push code or update the installed
app. The launcher was tested using explicit simulations, not the user's computer.
A runtime that lacks a supported CLI stops honestly. Authenticated GitHub access is not
a substitute for coding-agent login.

The local job prioritizes actual failed-log diagnosis, real integration and a clearly
identified development preview using verified profile isolation. It prohibits guessing
isolation settings or overwriting the existing installed app/profile. It then continues
the full r11 plan with source-bound real review/delegation when available.

## Remaining completion

The broader Tony-only welcome, complete trusted voice/native action path, speech quality,
named-agent/skills behavior, canonical/Hindsight binding, enterprise integration and
durable usage/accounting work remains as specified by r11. No root task is closed solely
by this scoped change. Full local, independent, native, live-service and signing gates
still determine release readiness. Status remains NO-GO for a claimed complete 2.0 release.
