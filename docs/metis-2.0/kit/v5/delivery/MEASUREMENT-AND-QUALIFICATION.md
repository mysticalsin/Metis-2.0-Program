# Qualification without false completion

## Evidence levels must remain separate

1. **Candidate code:** compilation and isolated behavior tests. Executed in this kit; not project integration.
2. **Application integration:** current repository imports/bindings, full affected tests, real UI. Not executed here.
3. **Native/live behavior:** actual microphone/output, native/OS action, exact readback, calls/sharing, real service/identity, failure/race paths. Not executed here.
4. **Distribution/release:** package inspection, signing, migration, qualified deployment, independent approval. Not executed here.

The 160 candidate tests are not 157 native successes. The 5,000 generated playback transitions are inside one candidate test, not 5,000 separate tests. The file example performs real temporary-file IO with an explicit test journal; it is not Notes/Windows/Mac computer use. The 13 evidence-validator tests use synthetic run documents. The eight mutation checks deliberately break temporary compiled copies to establish that relevant candidate tests detect them; they are not independent security review.

All 36 inherited CXAC and 24 BXAC behavioral scenarios are currently NOT_RUN for the application. They strengthen rather than replace the full r11/expansion suites. Some BXAC scenarios refine inherited coverage; do not market the scenario count as a comprehensive capability count.

## Performance

Preserve original proposed targets: wake acknowledgment p95 ≤150ms, local command-authority revocation p95 ≤100ms, qualified speech partial p95 ≤700ms, stable intent input p95 ≤1,000ms, ready simple-command dispatch p95 ≤1.2s, and qualified warm open/focus→verified p95 ≤2s. These are targets, NOT measured results in this kit.

Measure audio flush independently from authority revocation. Measure local stop request, native fence rejection, native quiescence acknowledgment, remote cancellation acknowledgment and any uncertain effect reconciliation separately. Never make a fast UI stop timestamp imply remote rollback or drained input.

Measure end-of-user-turn→first audible reply and end-of-user-turn→verified final spoken result. Separate canned acknowledgment from substantive reply. Include actual STT/planning/policy/native/verification/TTS costs and actual output device conditions. Do not subtract clocks from unsynchronized machines. Log structured spans/opaque refs without raw sensitive source content.

Test English/Québec French/Spanish/Brazilian Portuguese, names/numbers/negation and silence/noise; qualify real multilingual behavior rather than merely translating labels. Track false activation, incorrect-side-effect count, false-completion count, unnecessary confirmations, user corrections, recovery success and per-task actual known/unknown spend with declared denominators. Zero unsafe actions in a bounded suite is not universal proof.

## Read-only evidence gate

`check_acceptance.py` rejects missing/failed/blocked cases, mislabeled unit/fixture evidence, wrong source/artifact/platform, altered evidence bytes, path traversal/symlinks and absent negative/profile assertions. Its success label is EVIDENCE_FORM_AND_HASH_CHECKS_PASS, not release approved.

A developer with actual native results runs it against an identified artifact and actual run report. Do not manufacture the report from this template or copied test values:

```sh
python3 tools/check_acceptance.py \
  --report /absolute/path/to/actual-native-run.json \
  --commit ACTUAL_FULL_SOURCE_COMMIT \
  --artifact /absolute/path/to/exact-tested-artifact \
  --platform windows
```

The report requires an isolated profile reference plus one real evidence file per required case. Each evidence file declares the same source/artifact/platform, native run reference, result and positive/negative/profile assertions; it is content-hashed. The gate validates declarations and bytes, not their authenticity. Trusted native/CI provenance, signing verification, reviews and complete release checks remain independent mandatory controls. A false report is not made true by passing this parser.

Mac Electron preview evidence cannot stand in for macos-native or Windows. Qualification of one lane neither proves nor blocks another unrelated lane; preserve the original Windows-first release policy and native-Mac hold. Any platform-specific exception requires an explicit traceable owner decision, not silently removing a required case.
