# Implementation report — stronger Métis behavior

Date: 25 September 2026.

## Delivered implementation

Four original TypeScript modules plus generated JavaScript/declarations implement a standalone candidate host boundary: immutable typed proposals, task-scoped capability/resource/route grants, stable-source and revision checks, exact approvals, canonical user-intent matching, asynchronous operation coordination, explicit journaling/adapter bindings, unknown-effect handling, input-lease quiescence fencing, trustworthy completion projections, exact-plan progress, audio playback generation/position/buffering and distinct speech/task controls.

The code has no third-party runtime dependency. It deliberately contains no native driver, microphone, speech model, service credentials, current repository imports, broad shell, real account integration, persistent production journal or new UI. Those are explicit mandatory production bindings, not hidden completed features. The test fixture supplies an in-memory journal and synthetic authenticated/intent conditions; those fixtures must not be imported into the application.

An additional example performs an actual file creation in a newly allocated temporary directory, compares its real reread bytes to the explicit requested content and publishes a typed verified result. It removes its own temporary directory. This establishes real filesystem IO through the candidate flow, not microphone, speech, native Notes/UIA, remote service, database durability or installed-app behavior.

## Executed evidence

| Check | Observed result | What it does not prove |
|---|---:|---|
| Candidate Node test suite | 160 passed; 0 failed, skipped, cancelled or todo | Current project integration, native computer use or live speech/services |
| Seeded playback corpus | 5,000 transitions inside one of those tests | 5,000 independent tests or actual audio-device behavior |
| Evidence validator unit tests | 13 passed | Genuine runtime provenance or a signed native build |
| Negative controls | All 8 intentionally unsafe mutations caused test failures | Universal security or an independent review |
| Strict TypeScript build | Passed for four candidate modules | The actual complete Métis TypeScript/native build graph |
| Actual temporary-file example | One write, exact reread match, verified receipt | A working Métis app, microphone, native driver or durable production journal |

Negative controls remove source rejection, route scope, exact approval, receipt-gated completion, lease drain, stale-voice rejection, task-preserving status semantics and complete-plan aggregation one at a time. They run only on temporary compiled copies with unchanged tests; the original source is preserved. Exact results are in `evidence/negative-controls.json`.

Test runtime: Node 22.16.0. Compiler: TypeScript 5.8.3. Python gate tests: Python 3.13.5. The historical repository Node target was 22.22.3. Rerun under the actual checkout pins and its full dependency graph. No package downloads or cloud/model/service requests are needed by this core suite.

## Preserved and improved planning

The original consolidated handoff and first HeyClicky integration package are preserved byte-for-byte in `baseline/`. Their manifest lists exact archive hashes. The original r11 MASTER revision-4.5 hash was verified against the preserved archive: `e5b3c51d6d8423b5aadd1801d8fc2a77131c5ca3a363d281f1deb0da7acb1350`.

All 66 original task roots and 20 integration children remain. New metadata adds 24 normative behavior requirements, 12 illustrative user journeys, 10 required integration bindings and 24 acceptance refinements. The 36 old plus 24 new scenarios make 60 declared interaction scenarios; every native/live case remains NOT_RUN. Some refinements strengthen overlapping inherited coverage. Existing r11 base/expansion and release obligations are not replaced by that count.

The code, tests and documentation emphasize useful behavior as much as safeguards: clear requests can execute without repeated confirmation; status questions do not cancel work; language changes do not repeat an action; the visible representation distinguishes guide/foreground/background; partial results survive failure; Done requires evidence for the whole plan; users never need coding tooling to use the finished app.

## Production gaps remain explicit

No application imports were changed, no source patch was applied to the user's GitHub/local Mac, and no new current HEAD was claimed. The implementation candidate must be reconciled into existing trusted controllers, not layered as a competing permission system.

The identity/capture-source, canonical-intent matcher, native target checks, cross-process/replica resource fencing, transactional journal, independent verifier, actual audio sink, audience decisions and underlying service contracts must be real. JavaScript enums/booleans and hash strings do not authenticate those facts. The reference cannot revoke events already queued inside an uncooperative driver or reverse a committed remote side effect; driver fencing/quiescence and durable reconciliation are mandatory.

The evidence checker validates declared category, completeness, source/artifact/platform binding and file hashes. It cannot establish the truth of a fabricated report, authenticate its native-run reference, verify signing or approve production release. Trusted CI/native provenance and independent review remain separate.

No subagents were spawned; no independent reviewer approved these changes. Full application tests, native UI/audio/screenshare checks, current service access/privacy, profile migration, platform packaging, deployment and signing were not performed. **Installed Métis has not been updated by producing this archive. Full Métis 2.0 is not certified complete.**

## Primary references and limits

HeyClicky's inspected public changelog remains a behavioral reference; its 1.0.52 entry of 24 September 2026 describes changes to cursor/conversation permissions. The original static binary assessment is preserved as historical evidence, not rerun here. We did not import its application, proprietary prompts/assets, credentials or private endpoints.

OpenAI's realtime documentation informs client-owned playback interruption/truncation; Electron's security guide informs restricted authenticated IPC; Cloudflare's Nova-3 documentation confirms a candidate speech path. None of these source references prove Métis's actual deployed account configuration, performance, retention or permissions. The required Cloudflare-first product architecture is retained.

See `evidence/PRIMARY-SOURCES.json` for the exact primary URLs checked on 25 September 2026.
