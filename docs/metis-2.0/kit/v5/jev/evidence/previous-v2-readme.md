# Métis 2.0 — Behavior Upgrade v2

**Click → speak → act visibly → interrupt → verify → reply → continue.**

25 September 2026. This package strengthens the actual required Métis experience and includes original, executable candidate host logic. It does not update the installed application by itself and is not a new launcher or installer.

## Start here

1. `behavior/PRODUCT-BEHAVIOR.md` — the normative user-facing behavior, including concrete autonomy, voice, mouse, interruption, recovery and privacy rules.
2. `behavior/INTERACTION-EXAMPLES.md` — twelve intended user journeys with unacceptable counterexamples.
3. `delivery/HOST-BINDINGS.md` — exactly where trusted native/app/service integration must happen and what the candidate code does NOT provide.
4. `delivery/IMPLEMENTATION-PROMPT.md` — continuation instructions for the actual authorized coding environment.
5. `IMPLEMENTATION-REPORT.md` — executed checks and the boundary between candidate code and a working app.

## What changed since the first interaction plan

- Four executable TypeScript modules now express bounded host authority, canonical-intent matching, exact approval, coordinated dispatch/readback, native input ownership, audio playback generations, output policy and whole-task completion.
- Status questions, speech preferences, pause, correction and Stop are distinct controls. Speech interruption cannot accidentally rerun a mutation or kill the worker.
- Literal values must match canonical user intent; verification is not merely checking whether the model accomplished its own mistaken plan.
- Scope binds resources AND capabilities AND routes. “Connected” is not unrestricted computer access; connector denial is not browser permission.
- Done requires verified readback, durable settlement and the correct current output context. A verified first step is not a completed multi-step task.
- Unknown side effects retain a reconciliation obligation; a new operation ID cannot silently bypass a same-resource quarantine.
- Physical input remains fenced after revocation until the native helper acknowledges it has drained old work.
- Audio tracking distinguishes generated, queued and actually played content and applies bounded buffering.
- The plan now carries 24 normative behavior requirements and 24 additional native acceptance refinements, alongside all 36 prior interaction scenarios.
- A read-only evidence form/hash checker rejects missing, stale-build, tampered and fixture-labeled evidence; it does not authenticate fabricated reports or certify a release.

## Preserved full upgrade material

`baseline/Metis-Work-Session.zip` is the exact previous consolidated handoff: full original r11 plan, prior v2 repairs, onboarding update, tests and historical evidence. `baseline/Metis-HeyClicky-Interaction-Upgrade.zip` is the exact original assessment/addendum with its 20 integration slices, 30-capability matrix and 36 scenarios.

These originals are preserved for provenance and continuity, not recommended entrypoint scripts. Their old launchers and previous test counts are historical. Do not run `prepare` again over existing work or use the old fixed-16-file publisher after expanding the source. Baseline hashes and the unchanged revision-4.5 MASTER hash are recorded in `baseline/BASELINE-INVENTORY.json`.

All 66 r11 roots, base/expansion obligations and 20 CXSTEP children remain intact. `delivery/INTEGRATION-BACKLOG.json` attaches the new requirements/cases to those existing children. `delivery/R11-TASK-CROSSWALK.json` and `delivery/CAPABILITY-MATRIX.json` preserve the earlier mapping. No root task was closed by producing this kit.

## Code and developer checks

`behavior-core/` is a standalone candidate with no third-party runtime dependencies. Included JavaScript/declarations are compiled from the supplied TypeScript. Run from this folder:

```sh
node --test behavior-core/tests/*.test.mjs
python3 -m unittest discover -s tools -p 'test_*.py' -v
```

The optional `node behavior-core/examples/verified-file-task.mjs` makes one real temporary-file change and independently reads it back, then removes its own temporary directory. Its journal is an explicit test double; it does not control native apps or use a microphone/service. Source compilation uses the existing TypeScript compiler: `tsc -p behavior-core/tsconfig.json`.

End users should never need these commands. The implementation owner must bind the behavior into the existing app, run the full project checks, and demonstrate actual mic→native action→readback→speech in a safely isolated development build.

## Evidence and qualification

Executed here: **160 candidate behavior tests**, **13 evidence-gate tests**, **8 detected negative-control mutations**, strict candidate TypeScript compilation, and an actual temporary-file write/readback example. The 5,000-transition playback corpus is one of the 160 tests, not an extra 5,000 tests.

Not executed here: current-repository integration, full application CI, real speech/native UI/driver/service tests, independent agent review, installed-profile migration, deployment, signing or release. All **60 interaction acceptance scenarios** remain NOT_RUN for the application. Candidate/reference code is not product readiness.

No GitHub push, local-Mac change, installed-app update or sub-agent execution occurred while producing this package. The current remote HEAD was not asserted.
