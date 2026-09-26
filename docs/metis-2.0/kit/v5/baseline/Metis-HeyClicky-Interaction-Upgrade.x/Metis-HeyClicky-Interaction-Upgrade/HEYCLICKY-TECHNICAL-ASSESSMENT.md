# HeyClicky: inspected architecture and implications for Métis

**Assessment date: 25 September 2026.** Input: the user's `HeyClicky(1).dmg`. This is a read-only static assessment plus a review of primary public documentation. It is not a running-app benchmark, source-code recovery, penetration test, trusted-signature validation, or inspection of HeyClicky's servers.

## 1. What was actually inspected

The unencrypted UDIF disk image was read and its HFS+ catalog parsed without launching the application, its bundled agent, or its native driver. Selected property lists, runtime manifests, skill documentation, Mach-O dependencies and binary symbols were examined. No extracted credentials were used or included in this report. Application code, prompts, artwork and videos are not redistributed.

| Item | Observation | Evidence |
|---|---|---|
| Uploaded application | HeyClicky **1.0.51**, build **61** | `Contents/Info.plist` |
| Bundle identity | `com.humansongs.clicky` | `Contents/Info.plist` |
| Minimum declared Mac version | **14.2** | `LSMinimumSystemVersion` |
| Main executable | Native universal Mach-O, x86_64 and arm64; **77,542,656 bytes** | Executable headers/dependencies; selected-file hash |
| App catalog | **201 file entries**, **824,864,800 logical data-fork bytes** | HFS+ inventory; not installed disk allocation |
| Bundled Codex runtime tree | **12 entries**, **589,486,538 logical bytes** | `Resources/CodexRuntime/` inventory |
| Declared Codex package version | **0.152.1**, both Mac architectures | Two `codex-package.json` files |
| Native computer-use helper | `Contents/Helpers/cua-driver`, **62,047,840 bytes** | File inventory and bundled driver documentation |
| Skill manifests | **15 internal `SKILL.md` files** | Bundle inventory; not proof of 15 public UI features |
| Internal resource consistency | **127 compared resource-seal entries matched; zero mismatches** | Packaged `files2` hashes compared with extracted data forks |

**Input SHA-256:** `0c7b2f7b21cc5153e4a3146cdeaff704a67aaf37e08bf06a0117d108edb7b038`.

**Main executable SHA-256:** `1cf1b4a181bc52d869419cdba95cba5f999045766b8416f726125762cda4b5f1`.

**Info.plist SHA-256:** `0131f718ed72ab33d708640646e0107e57926444e7de60a7362cb910122bb30d`.

The packaged seal and resource hashes are not independent authenticity evidence: an internally consistent bundle can still be unsigned, untrusted or modified. This check does not verify Apple signing, notarization, runtime safety or provenance. The JSON evidence includes the exact comparison scope.

## 2. The important version difference

The latest official changelog entry retrieved is **1.0.52, dated 24 September 2026**; the uploaded 1.0.51 corresponds to the **18 September** entry. The newer release says it removed the floating agent cursor because of target-placement and screen-capture/sharing issues. It also narrows computer-use permission to the conversation. Those are vendor statements, not tests of either version performed here. [REF-02]

Consequently, the desired Métis behavior is not “copy the latest HeyClicky exactly.” It is **preserve the visible guidance/control experience Tony values, with independently tested overlay and authorization boundaries**. The uploaded build explains the older cursor architecture; the public change explains why it needs a separate acceptance gate.

## 3. Observed client architecture

### Native presentation and operating-system integration

The main executable links SwiftUI and AppKit, along with ScreenCaptureKit, Speech, AVFoundation/AVFAudio, ApplicationServices, Network, Security and CryptoKit. Screen-annotation, element-location, permission-coordination and audio-lifecycle symbols are present. This supports a native host that owns windows, permissions, capture and presentation. It does not prove every linked framework or symbol is used in the user's current mode.

For Métis, use existing Electron surfaces where they ship today and extend the real native Mac implementation separately. A good native helper can support the current client; a full rewrite is not a prerequisite for a working voice action.

### A realtime voice path separate from the task worker

The executable contains `RealtimeVoiceController`, `RealtimeVoiceClient`, `RealtimeDuplexAudioEngine`, `RealtimeMicrophoneCapture` and playback-related symbols. Realtime session/warmup/turn endpoint strings and an OpenAI realtime WebSocket URL are present. The useful inference is a short-lived conversational session managed by the native app and an authenticated backend—not a guarantee of one specific live model, transport configuration, latency or provider allocation.

A separate path contains Deepgram dictation, Apple speech, focus-context, cleanup and insertion components, plus dictation token/transcription endpoints. That separation matters: conversation may interpret intent, but dictation must preserve text and the exact insertion target. Model identifiers found in an executable are historical/configuration evidence, not proof of current production selection.

### A real task execution runtime

The bundle has architecture-specific Codex executables, code-mode hosts, supporting binaries and runtime metadata. `CodexAgentSession`, `CodexProtocolClient` and `CodexRuntimeBridge` symbols support an app-supervised task-worker design. A voice model can hand work to that worker rather than blocking the conversational loop until a long job finishes.

This is materially different from adding a microphone to a chat form. It provides a place to execute tools, maintain task progress and return artifacts. It does not follow that Métis must ship Codex to every employee or use the same consumer authentication/billing arrangement.

### A distinct computer-use driver boundary

The bundled driver documentation describes a supervised native daemon and a local computer-use MCP interface. It attributes the upstream driver to the Cua project. Observation, application/window selection, clicking, text input, key input, scrolling and browser operations are separate tool families.

The documented protocol favors current window snapshots and bounded target tokens, then reports effect/verification information. An attempted input event and a verified application change are different outcomes. Some background paths depend on application/platform behavior; private OS technique references in documentation must not be adopted uncritically.

The modern public upstream offers native/SDK and MCP entry points and a bounded-manifest permission mode. Its default mode must not be mistaken for Métis's enterprise policy. Adopt only a reviewed pinned component behind the existing host authorization gate, with the actual supported-platform/action matrix. [REF-05]

### The displayed pointer is not necessarily the human mouse

The supplied driver guidance describes a session-keyed agent-cursor overlay with motion/presentation controls. The executable also contains separate background-cursor and screen-annotation components. This supports three different concepts:

1. A guide highlight or ghost pointer that explains a target.
2. A background semantic action that does not move the user's real pointer.
3. A foreground action that injects actual input when permitted and necessary.

These should never collapse into one misleading animation. A visible cursor can be attractive without being execution proof. A successful background API operation should not be accompanied by simulated clicks on an unrelated window.

### App integrations, skills and artifact work

Fifteen internal skill manifests cover categories including research, documents, spreadsheets, PDFs, repository operations, frontend work, build previews, artifacts, email/workspace integrations and computer use. Agent integration and Composio session endpoint strings are present. These establish packaged capabilities and instructions, not the live OAuth entitlements or success rate for a particular account.

Internal skills are also not the same as a public skill editor: the official changelog describes a pause in the public Skills feature. Recording/replay-related driver documents explicitly note tools that are not exposed in this shipped runtime. Do not promote every bundled document into a verified product feature. [REF-02]

### Identity, operational services and updates

The property list configures a HeyClicky API host, OpenAI/Anthropic endpoints, Supabase, PostHog, Sentry and a Sparkle feed. Auth-manager and agent-cost-ledger symbols corroborate those component roles. The report intentionally excludes credential-like values, DSNs and project tokens.

A configuration key called `WorkerBaseURL` does **not** establish the cloud provider, deployment regions, service topology, database schema or security controls behind that endpoint. Those remain unknown without legitimate server-side evidence.

The vendor says raw screenshots are not retained but generated analysis and prompts are; therefore “screenshots are not stored” is not equivalent to “no sensitive derived content persists.” Métis needs its own reviewed retention and audience model, not copied marketing assurances. [REF-03]

## 4. Reconstructed system flow — an inference, not a network trace

```text
Hotkey / mic / selected task
        │
        ▼
Native host: identity, audio, active app, allowed context, UI state
        │
        ├── realtime conversation ──────────────► speech playback
        │             │
        │             └── task request / follow-up
        │                         │
        │                         ▼
        │               supervised agent runtime
        │                         │
        │                         ├── permitted integrations / files
        │                         └── local computer-use interface
        │                                      │
        │                              native driver / browser route
        │                                      │
        │                           observe → act → inspect effect
        │                                      │
        └──────────── task events, artifacts and truthful response ◄──┘

Separately: backend authentication, scoped sessions, usage and updates.
```

The connections above combine packaged components and documentation. This assessment did not record traffic, run the agent, recover server source or prove exact routing for any real task.

## 5. What Métis should adopt—and not adopt

**Adopt the pattern:** one familiar native-facing surface, low-latency voice, exact task ownership, structured context, a bounded worker, typed action adapters, result verification, continuing threads and useful files.

**Adapt the control layer:** prefer supported semantic APIs and connectors. Explicitly identify when foreground input is needed. Validate the private-API/signing implications of any candidate driver before distribution. Keep capture, guidance and execution permissions separate.

**Do not import the bundle:** the task is clean-room capability integration. Use original upstream components only after reviewing their actual license, version, security, redistributability and platform compatibility. The application, private service endpoints, prompts, media and branding are not implementation assets.

**Do not inherit the payload:** the bundled Codex tree accounts for roughly 71.5% of the inspected app's logical data bytes. That explains an architectural cost, not a measured RAM or performance problem. Métis's core should remain lean; any agent executable belongs in a justified, signed architecture-specific optional pack or reviewed server executor, not an unconditional double-architecture dependency.

**Do not confuse autonomy with blanket access:** a precise requested safe action can run without asking before each mouse movement. That is different from granting every agent permanent computer access. Exact sends, purchases, destructive changes and publishing remain explicit consequence boundaries.

## 6. Unknowns to resolve in the actual implementation environment

The following have not been tested here: HeyClicky's native behavior, foreground/background success across applications, speech latency, current server implementations, service credentials/retention, current Métis HEAD, the user's latest failing tests, signing, native Windows behavior and installed-profile migration.

Resolve current Métis state once at the beginning of implementation, then code against that checkout. Do not repeat the earlier setup loop or turn a connector 404 into a claim that the project does not exist.

## Evidence files

- `evidence/static-assessment.json`: measured inventory, hashes, selected symbol offsets, redactions and limits.
- `evidence/resource-seal-verification.json`: all 127 individual resource comparisons.
- `evidence/sources.json` and `evidence/REFERENCES.md`: primary documentation references.
- `R11-TASK-CROSSWALK.json`: all original roots preserved; current states deliberately unassessed.
