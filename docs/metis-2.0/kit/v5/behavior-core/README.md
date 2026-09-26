# Métis behavior-core candidate

**Implemented standalone host logic; not a deployed Métis feature.** No third-party runtime dependencies. The distributable JavaScript is compiled from the included TypeScript; declarations are provided for integration review.

From the kit root, developers can execute:

```sh
node --test behavior-core/tests/*.test.mjs
node behavior-core/examples/verified-file-task.mjs
```

The example creates one document in a NEW TEMPORARY directory, reads it back independently, prints a receipt, and removes only that temporary directory. It does not interact with Notes, a browser, the mouse, microphone, cloud services or the installed Métis app. The journal used by the example/tests is explicitly in-memory and is NOT a production journal.

To rebuild with the existing TypeScript compiler, run `tsc -p behavior-core/tsconfig.json`. Do not install arbitrary latest dependencies into the user's repository to run these checks. This delivery was checked with Node 22.16.0 and TypeScript 5.8.3; the historical Métis target was Node 22.22.3. The actual target checkout's complete checks remain required.

## Included

- `authority.ts`: stable-source/mode checks; exact immutable proposals and hashes; resource/capability/route grants; expiry, policy and generation revocation; one-use consequential approval; operation-count limits.
- `coordinator.ts`: independent canonical-intent match, authorized observation, durable-journal interface, bounded dispatch/verification, conservative unknown effects, separate settlement, typed receipts and exact-plan completion summaries.
- `native-lease.ts`: device-level exclusive input ownership and revocation-to-quiescence handoff logic.
- `voice.ts`: playback position and generation metadata; bounded audio queue acceptance; output-policy projection; speech-only versus task control dispositions.
- `tests/`: explicit fixtures plus a real temporary-file effect. No native/device/provider evidence is claimed.

## Not included

This is not a speech recognizer, LLM, native driver, screen capturer, target locator, UI implementation, authenticator, IPC boundary, persistent database, distributed lock, Hindsight adapter, live metering pipeline, recorder, app installer or independent security certification.

`delivery/HOST-BINDINGS.md` describes the required production bindings and limitations. Never expose grant issuance or the source/authorization booleans directly to a renderer/model. Do not connect an unrestricted local MCP or shell behind these interfaces. Reuse the existing Métis runtime and apply these boundaries there; do not create a parallel competing permission system.

Timeout and Stop prevent authorized further dispatch; they cannot prove a remote mutation was undone. “Confirmed no effect” must come from a trusted verifier, not absence of a desired result. The underlying native driver must enforce the input fence and acknowledge drained events. Unknown resource effects require durable reconciliation before another attempt.


## v3: six managed JEV modules

The `src/jev-*.ts` modules add the actual documented TypeSafe wire transport, immutable validated contracts, managed routing/current-policy checks, central credential lifecycle orchestration, versioned templates and action/intent/skill/Intelligence consumers. The action consumer invokes the existing coordinator rather than discarding the result.

`npm run test:jev` exercises the JEV tests only. `npm test` also retains all original behavior tests. `npm run build` requires a compatible installed TypeScript compiler; the emitted JS/declarations are included for dependency-free test execution under Node. No test contacts the vendor; the one loopback HTTP test uses an explicitly synthetic provider and a real temporary-file effect.

The JEV transport/admin/service are **server-only logical components**. Their placement in this standalone test package is not a customer bundle prescription. Exclude them from desktop output and bind real authenticated API/vault/ledger ports. See `../jev/JEV-ROLE-AND-BINDINGS.md`.
