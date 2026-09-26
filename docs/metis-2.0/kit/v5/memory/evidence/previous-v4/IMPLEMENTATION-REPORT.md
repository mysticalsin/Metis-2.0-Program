# Métis v4 correction — note-taker preserved and keyboard-first assistance

25 September 2026. **Updated product/integration kit; not an implemented native shortcut or installed application upgrade.**

## What changed

The owner clarified that Métis must remain a note-taker and more, with a keyboard toggle rather than click-only invocation. The current README, product behavior, JEV integration description, full implementation prompt, host bindings, task crosswalk and acceptance matrix now carry that constraint explicitly.

`keyboard-notes/PRODUCT-CORRECTION.md` specifies a configurable global show/hide toggle, separately keyboard-accessible command voice, preserved meeting controls, truthful actual-capture status and normal note-taking during assistant use. Existing key combinations must be recovered and preserved; none was invented here. The action-only demonstration is supplemented by a required continuous meeting → keyboard assistance → verified action → final notes/summary/history journey.

Twelve NK requirements and sixteen NKAC app-level scenarios are tied to original tasks. All 66 roots, 20 CXSTEP children, JEV backlog and previous 84 interaction IDs remain; the combined interaction matrix has 100 cases, all NOT_RUN. Original r11 and AGSTEP/OBU/HMSTEP expansion acceptance remains required in addition.

## What did not change

**No runtime source or test was changed, and no new controller was added.** All ten TypeScript modules, built JS/declarations, tests, examples and package files under `behavior-core/` remain byte-identical to v3, as do the full preserved baseline ZIPs. The complete JEV candidate and its integration work are retained. Existing reference implementations must be integrated into current controllers rather than creating another permission, audio or keyboard system.

No current repository inspection was claimed or needed for this product correction. No Mac access, native keyboard registration, microphone capture, actual concurrent meeting task, vendor call, push, installation or release was performed.

## Checks actually run

- Strict TypeScript rebuild of the ten unchanged candidate modules: exit 0; TypeScript 5.8.3.
- Unchanged standalone Node candidate suite: **306 passed**, zero failures/skips/cancellations/todo; Node v22.16.0. The historical repository pin is v22.22.3; actual repository gates must use current pins.
- Byte comparison of **51 runtime/baseline files** against v3: identical, including generated code after rebuild.
- Structured consistency checks: original root identities/dependencies and children preserved; original acceptance IDs retained; all 12 NK requirements covered by 16 NKAC procedures; 100 unique app-level cases, all NOT_RUN.
- Original nested MASTER revision 4.5 SHA-256 verified: `e5b3c51d6d8423b5aadd1801d8fc2a77131c5ca3a363d281f1deb0da7acb1350`.

These are compilation, candidate regression and package-consistency checks. **They do not test the newly required native keyboard controls, actual recording continuity or installed-app behavior.** The new sixteen scenarios are specifications for execution in the real codebase, not newly passing unit tests.

## Required next application work

Follow `delivery/IMPLEMENTATION-PROMPT.md`. Verify existing note-taking and shortcuts; integrate controls in current main/native handlers and audio consumers; reproduce real recording/command/task coexistence and failure behavior; then execute the combined real-product milestone on exact target builds. The actual configured shortcut, supported platforms and readiness must come from those observations.

A JEV outage must not independently stop capture or saving already captured notes, but an unavailable speech route must still be reported accurately. Private commands/generated responses are separate records from actual meeting evidence; physical audio already mixed together cannot be made private merely by labeling it. Keep the established audience, storage and consent rules.

## Evidence

- `keyboard-notes/evidence/FINAL-STATUS.json` — current observed scope/results.
- `keyboard-notes/evidence/PRESERVATION.json` — exact preserved file hashes.
- `keyboard-notes/evidence/candidate-tests.tap` and `typescript-build.txt` — actual rerun outputs.
- `keyboard-notes/evidence/previous-v3/` — previous top-level documents for comparison.
- `keyboard-notes/evidence/PRIMARY-SOURCES.json` — official shortcut references, not real native qualification.

**Installed Métis has not been changed. Full 2.0 remains unverified.**
