# Lane L08 — shared-contracts-preload

Repo: `/Users/<redacted-user>/AI-Brain-build/metis-2.0` (read-only checkout, origin/main `2bf21f1c`, v1.9.6)
Reviewer: staff-engineer audit pass, AUDIT mode (brownfield discovery + domain-boundary method skimmed; five-axis review: correctness, readability, architecture, security, performance/reliability/testability).
Scope: `src/shared/` (all; `ipc.ts` 2,407 lines is the core artifact) and `src/preload/` (all: `index.ts` 563 lines, `intelligence.ts`, `import-decoder.ts`, `index.d.ts`, `live-identity.test.ts`).
Method docs skimmed: `03-brownfield-discovery.md`, `05-domain-and-code-boundaries.md` (software-architecture-engineer), `addy-agent-skills.md` (Stark five-axis). Cross-referenced against `TASK-005.md` (r11 kit) which asks for `src/shared/contracts/*` with golden fixtures + a Swift mirror.

## 0. Overall read

The renderer↔main IPC boundary is **better architected than the size of `ipc.ts` suggests at first glance**. `preload/index.ts` is a hand-written, fully-enumerated allowlist — every exposed function is bound to one named `IPC.<x>` constant and a concrete argument shape; there is no generic `ipcRenderer.invoke(channel, ...args)` passthrough that would let arbitrary renderer content reach arbitrary main handlers. Renderer→main payloads are overwhelmingly zod-validated (59 `z.object(...)` schemas in `ipc.ts` alone) with real bounds (string/array length caps, regex-constrained slugs, `.strict()` where drift would be dangerous). Path-derived strings (`file` params) are documented as "re-basenamed in main for defense" — a deliberate, sound split of responsibility between shared (shape) and main (defense-in-depth), not an oversight. This is a solid foundation for the v2.0 contracts work TASK-005 asks for.

The real problems are architectural, not exploited-today bugs: (1) one 2,407-line file is the single source of truth for roughly fifteen unrelated domains, (2) the one place where a real security boundary is enforced (which `settings:set` fields a renderer may write) lives entirely outside the type system, as three independent hand-maintained string arrays in `main/index.ts`, with nothing in `shared/ipc.ts` encoding the same policy, and (3) the "Swift mirror" TASK-005 anticipates needing golden-fixture protection against does not merely risk drifting — it **has already drifted** on the single field two platforms actually share today.

I found no evidence of a currently-exploited crash/hang/resource-leak in this lane (those live in main-process/runtime lanes — see the shared `E1–E9` runtime evidence, which this lane's files don't drive). My findings are contract-design and drift risks that (a) directly explain why cross-cutting bugs are hard to keep out as the app grows toward 2.0, and (b) are exactly what TASK-005's contracts-with-golden-fixtures ask is meant to close.

---

## Findings (most severe first)

### F1 — P1 / security + architecture: `SettingsPatch`'s type contract does not model the fields it is unsafe for a renderer to write; the real enforcement is three unlinked string arrays in a 9,518-line file

**Files:** `src/shared/ipc.ts:1599-1619` (the type), `src/main/index.ts:4809-4883` (the only enforcement)
**Evidence label:** OBSERVED

`SettingsPatch` (`ipc.ts:1600-1619`) is defined as:

```ts
export type SettingsPatch = Partial<
  Omit<PublicSettings,
    | 'hasApiKey' | 'providerReady' | 'localReady' | 'localSuggestReady' | 'localSummaryReady'
    | 'localVisionReady' | 'localRuntimeRunning' | 'localRuntimeState' | 'hasKeys' | 'hasEncryption'
    | 'resolvedMeetingsFolder' | 'managedKeys' | 'envKeys' | 'loginItemOpenAtLogin' | 'lastFailover'
  >
>
```

Every field it omits is a **derived/computed** field (main ignores it if sent). But `BaseSettingsSchema` also carries a second, disjoint category the schema's own doc-comments call out repeatedly as *"server-authoritative,"* *"Worker-authoritative,"* or *"main-owned"* — e.g. `licenseValid`, `licenseKey`, `licenseSeatCap`, `licenseExpiresAt`, `licenseLastValidatedAt`, `licenseLease` (`ipc.ts:1420-1434`, comment: *"a renderer patch must not be able to self-issue a signed-looking lease string"*), `trialStartedAt` (`ipc.ts:1435-1441`), `mcpConnections`/`clickupClientId`/`planeClientId` (`ipc.ts:1236-1253`), and `operatorTier`/`operatorEntitlements`/`operatorIntegrationsVersion`/`operatorEntitlementsAt`/`operatorLicenseToken`/`operatorLicenseJti`/`operatorLicenseLast4`/`operatorLicenseExpiresAt` (`ipc.ts:1465-1487`). **None of these are excluded from `SettingsPatch`.** The type system says a caller may legally construct `{ licenseValid: true, licenseSeatCap: 999999 }` or `{ operatorEntitlements: { ask: true, ... } }` and hand it to `window.toto.setSettings(...)`.

The only actual enforcement is in `main/index.ts`'s `settings:set` handler, as three separate, independently-maintained `for (const k of [...]) { if (k in p) delete (p as Record<string, unknown>)[k] }` loops:
- `main/index.ts:4843-4854` — the 8 license fields (comment: *"Without this strip, any renderer code could self-issue an unlimited license with a plain settings patch"*)
- `main/index.ts:4865-4867` — `mcpConnections`, `clickupClientId`, `planeClientId`
- `main/index.ts:4872-4883` — the 8 operator-entitlement fields

These three arrays exist **nowhere in `shared/ipc.ts`** and are not referenced by, generated from, or checked against the schema. I confirmed via full-text search that no test in `shared/ipc.test.ts` (or anywhere in `src/shared/`) asserts this strip list is complete or in sync with `BaseSettingsSchema`'s privileged fields.

**Why this matters for v2.0, not just today:** this is a hand-maintained allowlist-by-subtraction with three separate lists, each added in a separate wave (license → MCP → Operator, per the comments) as new privileged state was introduced. The pattern *will* repeat as TASK-005's work adds more server-authoritative fields (metering, policy, engine-selection state — exactly the kind of fields TASK-005 describes). Every future field of that shape requires an author to (a) add it to `BaseSettingsSchema` *and* (b) remember to append it to the correct one of three arrays in a 9,518-line file, with **zero compiler signal and zero test signal** if they forget step (b). The failure mode is a renderer (compromised via any future XSS-adjacent surface, a malicious imported context doc, or simply a future bug in a legitimate call site that forwards a broader object than intended) silently self-granting a valid license, Operator entitlements, or rewriting a stored MCP bearer-token's endpoint. The code is correct *today* for the fields it currently protects; the risk is that it has no mechanism to stay correct.

**Fix direction (small, matches "simplicity first"):** add one exported constant to `shared/ipc.ts` (or the proposed `contracts/settings/` module — see §3), e.g. `SERVER_AUTHORITATIVE_SETTINGS_KEYS = [...] as const satisfies readonly (keyof PublicSettings)[]`, covering all 18 fields above (union of the three arrays). Derive `SettingsPatch` from it (`Omit<PublicSettings, typeof DERIVED_KEYS[number] | typeof SERVER_AUTHORITATIVE_SETTINGS_KEYS[number]>`), and replace the three loops in `main/index.ts` with one `for (const k of SERVER_AUTHORITATIVE_SETTINGS_KEYS)`. This turns a silent, three-way-duplicated policy into one array that the type system and the runtime both read from — a caller who tries to type a patch containing `licenseValid` gets a compile error instead of a silent strip.

---

### F2 — P1 / correctness + architecture: the Swift "mirror" TASK-005 wants golden-fixture protection for has already drifted from the TS contract on the one field both platforms share

**Files:** `src/shared/ipc.ts:392` vs. `native-app/MetisKit/Sources/MetisKit/MeetingModels.swift:11-22`
**Evidence label:** OBSERVED

`TranscriptLineSchema` (`ipc.ts:389-408`) declares:
```ts
speaker: z.enum(['them', 'you', 'unknown']),
```
The native Swift app's `TranscriptLine` (`MeetingModels.swift:11-22`) declares:
```swift
public enum Speaker: String, Codable, Sendable { case me, them, unknown }
```
with the doc-comment directly above the `name` field: *"mirrors the Electron app's additive `name` field so transcripts port across both products."* That comment asserts interoperability intent, but the operator's own side of the enum does not match: TS uses the raw string `"you"`, Swift uses `"me"`. I searched all of `native-app/MetisKit/Sources/MetisKit/*.swift` for any custom `Codable` implementation, `CodingKeys`, or string-remapping for this enum — there is none; Swift's synthesized `Codable` conformance for a `String`-backed enum decodes strictly by raw value. A JSON transcript line produced by the Electron app for the user's own speech (`{"speaker":"you", ...}`) would fail to decode into this Swift model (`DecodingError.dataCorrupted`, "Cannot initialize Speaker from invalid String value you") the moment any interchange path exists between the two products.

**Scope of current risk:** I found no wired-up interchange path yet (`native-app` appears to persist its own SwiftData records independently; no code under `native-app/` reads Electron's `userData/asktoto` meetings folder or vice versa in this checkout) — so this is DERIVED as *latent*, not an active runtime failure today. But it is exactly the class of bug TASK-005 names explicitly: *"a Swift mirror... Golden cross-platform fixtures and negative tests preserve explicit legacy choices."* Right now there is no fixture, golden or otherwise, that would catch this, and the comment asserting parity is actively wrong.

**Fix direction:** either (a) rename the Swift case to `you` to match the wire contract (breaking change to `native-app`'s own persisted data, but it's pre-2.0 and isolated), or (b) add an explicit `CodingKeys`/custom decoder that maps `"you" <-> .me` at the JSON boundary, documented as the intentional cross-platform mapping. Whichever is chosen, TASK-005's requested golden fixture set should include at least one JSON transcript-line fixture with `speaker: "you"` and a corresponding Swift decode test, so this exact class of drift fails CI instead of failing silently in the field.

---

### F3 — P2 / reliability + testability: two preload surfaces hardcode IPC channel-name string literals instead of importing `IPC.*`, and nothing tests that they still match

**Files:** `src/preload/intelligence.ts:11-14,17-40`, `src/preload/import-decoder.ts:3-11`
**Evidence label:** OBSERVED

Both `preload/intelligence.ts` (the Mantu Intelligence dashboard window) and `preload/import-decoder.ts` (the hidden audio-decode window) explicitly avoid importing `IPC` from `@shared/ipc`, with a documented and plausible reason: *"importing the zod-heavy `@shared/ipc` here would make Rollup split a chunk SHARED with the main preload — and a sandboxed preload cannot require() secondary chunks, which silently breaks `window.toto` in the overlay"* (`intelligence.ts:11-14`). Given that constraint, both files instead re-type the channel names as raw strings: `'brain:read'`, `'brain:status'`, `'brain:backfill'`, `'brain:intelligencePass'`, `'brain:field-decision'` (`intelligence.ts:17-40`), and `'import-decoder:source-start'`, `'import-decoder:source-chunk'`, `'import-decoder:source-ack'`, `'import-decoder:chunk'`, `'import-decoder:complete'`, `'import-decoder:failed'`, `'import-decoder:ready'` (`import-decoder.ts:5-11`).

I confirmed by full-repo search that **no test anywhere** asserts these literals equal their `IPC.*` counterparts in `shared/ipc.ts` (`IPC.brainRead`, `IPC.brainStatus`, `IPC.brainBackfill`, `IPC.brainIntelligencePass`, `IPC.brainFieldDecision`, `IPC.importDecoderChunk`, etc.). `shared/ipc.test.ts` (1,042 lines) never references any of these literal strings; the only place they're checked is the corresponding `ipcMain.handle(IPC.brainRead, ...)` registration in `main/index.ts:8039`, which will happily keep compiling and running even if `IPC.brainRead`'s *value* changes, because main always reads it through the constant. If a future refactor renames `IPC.brainRead` from `'brain:read'` to anything else (a one-line change in `ipc.ts` that typechecks cleanly everywhere, since every other consumer goes through the constant), the Intelligence dashboard silently breaks at runtime with "No handler registered for channel 'brain:read'" — with zero compile-time or CI signal, and (per confirmed asymmetry) `main/index.ts:8202` already uses `IPC.brainFieldDecision` for the *handler* while `intelligence.ts:40` invokes the literal `'brain:field-decision'` for the *caller* — i.e. this exact split already exists for one channel today, it just hasn't drifted yet.

**Fix direction:** the chunk-splitting constraint is real, so importing `IPC` directly isn't free — but the fix is cheap: one small unit test (in `src/preload/`, run once) that re-declares the same literals inline and asserts equality against `IPC.*` imported from `@shared/ipc` (a test file is not bundled by Rollup, so it can safely import the zod-heavy module). This converts "a rename silently breaks two windows in production" into "a rename fails one fast unit test," at near-zero cost. Longer-term, a channel-names-only sibling module with no zod import (e.g. `contracts/channels.ts`, re-exported by `contracts/index.ts` for everyone else) would let these sandboxed preloads import the real constants directly and remove the duplication entirely — see §3.

---

### F4 — P2 / architecture / dead code: five IPC channels are fully declared, string-pinned by a test, and never wired to anything

**Files:** `src/shared/ipc.ts:290-294`, `src/shared/ipc.test.ts:971-975`
**Evidence label:** OBSERVED

`IPC.localAiStatus` (`'local-ai:status'`), `IPC.localTranscriptBegin` (`'local-ai:transcript:begin'`), `IPC.localTranscriptAppend`, `IPC.localTranscriptResync`, and `IPC.localTranscriptEnd` are declared in the channel registry (`ipc.ts:290-294`) and their exact string values are pinned by `ipc.test.ts:971-975` (`expect(IPC.localAiStatus).toBe('local-ai:status')`, etc.) — but I confirmed by grepping the entire repository (`src/main`, `src/preload`, `src/renderer`) for both the constant form (`IPC.localAiStatus`, etc.) and the literal string form (`'local-ai:status'`, `'local-ai:transcript:begin'`, etc.) that **none of the five is referenced anywhere outside `ipc.ts` and its own test**: no `ipcMain.handle`/`ipcMain.on`, no `webContents.send`, no `preload` invocation. This is pure dead contract surface — a name that exists and is unit-tested, wired to nothing, most likely left over from a `local-ai:*` streaming-transcript feature that was designed or partially built and then abandoned/superseded (the sibling `localModelsList`/`localModelsEnsure`/`localPrewarm` channels around it *are* live and wired).

**Fix direction:** delete the five constants and their pinning test, or if the feature is coming back for 2.0, replace the dead pin-test with a `// TODO(TASK-xxx): unwired, reserved for <feature>` comment so a future reader doesn't have to re-derive "is this dead or not-yet-built" from a repo-wide grep the way this review had to.

---

### F5 — P2 / architecture: `shared/ipc.ts` is a single 2,407-line file spanning roughly fifteen unrelated domains — exactly the shape TASK-005 asks to replace with `src/shared/contracts/*`

**File:** `src/shared/ipc.ts` (whole file)
**Evidence label:** OBSERVED

One file currently owns: the IPC channel-name registry (213 channels); the entire persisted-settings schema (`BaseSettingsSchema`, ~150 fields spanning provider routing, ASR engine/quality, licensing, MCP connections, Operator config, desk-tap-control calibration, overlay/window UI prefs, and GDPR retention policy — `ipc.ts:926-1488`); the Ask/Stream wire protocol (`AskStartSchema`, `StreamDelta/Done/Error/MetaSchema`); the transcript/import-audio pipeline (`TranscriptLineSchema`, `SaveMeetingSchema`, `ImportAudioChunkSchema`, `ImportJobView`, `ImportDecoder*Schema`); the brain-correction-engine payloads (`EntityRename/Merge/Unmerge/UpdateField/FieldDecision/CommitmentReject`); the MCP connection schema; two independent licensing subsystems' wire types (self-hosted license-server *and* Operator seat-license — see F6); local-model summaries; and window/overlay command state (`MetisCommandState`, `HotkeyAction`, `DEFAULT_SHORTCUTS`).

This is the concrete instance of the pattern the domain-boundaries method doc warns about: *"Shared DTOs across every service can turn independent deployment into coordinated deployment."* Practically, it means: a reviewer or new contributor touching the transcript pipeline must read/scroll past licensing, MCP, and overlay-window schemas to find what they need; `git blame`/PR diffs for unrelated features collide in the same file; and the file is large enough (2,407 lines) that this review itself had to read it in four passes to cover it completely. TASK-005 explicitly asks for `src/shared/contracts/*` — see §3 below for a concrete proposed decomposition that preserves every current type/schema name (so it's a mechanical split, not a rewrite) and keeps `IPC.*` as a single registry import path.

---

### F6 — P2 / architecture: two independently-evolved licensing/entitlement subsystems share one flat settings namespace with no type-level relationship

**Files:** `src/shared/ipc.ts:1414-1487` (self-hosted license fields) and `:1442-1487` (Operator fields) interleaved in the same `BaseSettingsSchema`; `src/shared/license-types.ts`; `src/shared/operator-license.ts`; `src/shared/operator-entitlements.ts`; `src/shared/operator-seat.ts`
**Evidence label:** OBSERVED

Métis carries two separate licensing mechanisms that evolved in separate waves, per the code's own comments: (1) a self-hosted phone-home **license server** (`licenseServerUrl`, `licenseKey`, `licenseValid`, `licenseSeatCap`, `licenseExpiresAt`, `licenseLease`, `trialStartedAt`; IPC channels `license:activate/status/gate/config`; types in `license-types.ts` + inline in `ipc.ts`) and (2) the **Operator seat-license/entitlements** system (`operatorLicenseToken`, `operatorTier`, `operatorEntitlements`, `operatorIntegrationsVersion`; IPC channel `operator:licenseActivate`/`operator:status`; types in `operator-license.ts` + `operator-entitlements.ts`). Both persist directly into the same flat `BaseSettingsSchema`/`PublicSettings` object, both are gated by separate main-side logic (`license:gate`'s `checkLicenseGrace()` vs. `operatorGate()` in `operator-entitlements.ts`), and nothing in the shared type layer expresses how the two combine for a given install (Can both be active? Does an Operator seat supersede a self-hosted grace period? Is a build meant to ship with exactly one enabled?). Each individual subsystem is internally well-factored (operator-license.ts/operator-entitlements.ts/operator-seat.ts are cleanly split by concern, well under 250 lines each, with matching test files) — the issue is that their *coexistence* is undocumented in types, which is exactly the kind of gap F1 exploits (a strip-list per subsystem, each easy to get right in isolation and easy to lose track of in combination).

**Fix direction:** not a v2.0 blocker on its own, but worth a deliberate decision as part of TASK-005: either (a) formally deprecate one system in favor of the other for 2.0 and mark its settings fields `@deprecated`, or (b) add one discriminated-union-style `licensingMode: 'self-hosted' | 'operator' | 'both'` (computed, not persisted) to `PublicSettings` so the renderer and any future contract test has one place to reason about precedence instead of re-deriving it from which fields happen to be truthy.

---

### F7 — P3 / testability: the one existing preload wire-shape test works around an architecture problem instead of fixing it, and covers 4 of ~140 exposed functions

**Files:** `src/preload/live-identity.test.ts` (whole file, 50 lines); `src/preload/index.ts` (whole file, 563 lines)
**Evidence label:** OBSERVED

`preload/index.ts` defines its ~140-entry `api` object and calls `contextBridge.exposeInMainWorld('toto', api)` in the same module, at top level. Because `contextBridge` only exists in a real Electron preload context, `api` cannot be `import`ed directly in a Vitest/Node test. The one test that exists, `live-identity.test.ts`, works around this cleverly but expensively: it reads `index.ts`'s source as text, uses the TypeScript compiler API (`ts.createSourceFile`) to find the AST node for a named property assignment, `ts.transpileModule`s just that expression, and `vm.runInContext`-evaluates it against a stub `{ ipcRenderer, IPC }` context (`live-identity.test.ts:9-23`) — effectively re-implementing a miniature bundler per test. It is used to cover exactly 4 functions: `parakeetFeed`, `appleSpeechFeed`, `speakerEmbed`, `setListeningState`. The other ~136 bindings (all of settings, licensing, MCP, import-audio, recall, brain-correction, etc.) have no equivalent wire-shape test — nothing would catch a copy-paste error that sent the wrong payload shape to the wrong channel, short of an end-to-end/manual run.

**Fix direction:** split `preload/index.ts` into `preload/api.ts` (the plain `const api = {...}` object, no top-level Electron side effects beyond `ipcRenderer` itself, directly `import`able in a test) and a thin `preload/index.ts` that only does `import { api } from './api'; contextBridge.exposeInMainWorld('toto', api)`. This removes the need for the AST/`vm` workaround entirely — a normal test can `import { api } from './api'`, pass a mocked `ipcRenderer`, and assert on every call directly — and makes it realistic to extend coverage to the full surface rather than 4 of ~140 functions. Same split is worth applying to `preload/intelligence.ts` and `preload/import-decoder.ts` for the same reason.

---

## 1. What's already right (don't re-litigate this in the 2.0 plan)

- **Allowlisted preload surface.** No generic `invoke(channel, ...)`/`on(channel, ...)` passthrough anywhere in `preload/index.ts`, `intelligence.ts`, or `import-decoder.ts` — every exposed function is bound to one named, fixed channel. This is the correct contextIsolation posture and should be preserved as-is through the 2.0 refactor.
- **Renderer→main validation coverage is broad and specific.** 59 zod schemas in `ipc.ts` cover essentially every payload a renderer can send that isn't a bare primitive; bounds are concrete (e.g. `IMPORT_AUDIO_MAX_CHUNK_SAMPLES`, `McpPushPayloadSchema`'s 20-field/50KB-string caps, `SLUG_RE`-gated entity ids to block path-traversal-shaped strings before they reach a handler — `ipc.ts:608-658`) rather than generic `z.any()`.
- **The provider-id parity guard** (`ipc.ts:37-45`) is a nice small pattern worth reusing in the proposed `contracts/` layout: a compile-time assignability check that fails the build if `ProviderIdSchema`'s zod enum and `providers.ts`'s TS union ever diverge. The settings server-authoritative split (F1) and the channel-literal duplication (F3) are exactly the places this same technique (or its runtime-array equivalent) should be applied next.
- **Request/response vs. events is coherent.** Every push-only (`main → renderer`, fire-and-forget) channel I checked (`streamDelta/Done/Error/Meta`, `hotkey`, `settingsChanged`, `cloudSttFinal/Error/Interim`, `*Progress` channels) is sent via `webContents.send` and consumed via the preload's `sub()` helper — never mixed with request/response `invoke`/`handle` on the same channel name. There is no backpressure mechanism for these (e.g. `streamDelta` has no ack/flow-control), but I found no evidence this is a live problem — LLM token-streaming rates are far below what would need one, and adding one would be premature complexity for 2.0.

---

## 2. Duplicated / dead types (TASK-005's explicit ask)

- **Dead:** `IPC.localAiStatus`, `localTranscriptBegin/Append/Resync/End` — see F4.
- **Re-exported, not duplicated (fine):** `license-types.ts`'s `MemberActivatePayloadSchema`, `IdentitySnapshot`, `MemberActivateResult`, `MemberLicenseStatus`, `LICENSE_ACTIVATION_OPEN`, `emptyLicenseStatus` are cleanly re-exported through `ipc.ts:2375-2383` rather than copy-pasted — good practice, keep it in the `contracts/` split.
- **Conceptually duplicated (two systems, not two types — see F6):** the self-hosted license fields and the Operator license fields don't share a type, but they do overlap in *purpose* (both answer "is this seat entitled to use Métis"), which is a design duplication worth resolving for 2.0 even though it isn't a code-duplication bug per se.
- **No duplicate zod schema bodies found.** I diffed the shape of every `z.object` in `ipc.ts` against the `operator-*.ts` family and found each file owns a distinct, non-overlapping concern (license parsing vs. entitlements vs. seat metadata vs. connector catalog vs. vision-model resolution vs. HMAC signing) — this part of the codebase is well-factored already; F5/F6 are about *where* they live and *how they relate*, not about redundant definitions.

---

## 3. Proposed target contracts layout (for TASK-005 / `src/shared/contracts/*`)

Goal: mechanical decomposition of the existing `ipc.ts` (every current export keeps its name and shape — this is a house-move, not a rewrite) into domain modules, plus the structural fixes from F1/F3 baked in from day one, plus a home for TASK-005's golden fixtures.

```
src/shared/contracts/
  index.ts                 # barrel: re-exports every domain module's public surface (drop-in
                            # replacement for `@shared/ipc` at every current import site)
  channels.ts               # ONLY the `IPC` channel-name map + its literal string values.
                            # Zero zod import — this is what preload/intelligence.ts and
                            # preload/import-decoder.ts should import directly once this exists,
                            # closing F3 without the chunk-splitting risk (no zod dependency to split).
  settings/
    schema.ts                # BaseSettingsSchema / SettingsSchema (persisted + user-writable slice)
    server-authoritative.ts  # NEW: `SERVER_AUTHORITATIVE_SETTINGS_KEYS` (closes F1) — single source
                              # for both `SettingsPatch`'s type-level Omit and main's runtime strip loop
    public.ts                 # PublicSettingsSchema (derived/computed fields layered on top)
    defaults.ts                # DEFAULT_SETTINGS
  ask/
    schema.ts                 # AskStart*, ChatTurn, StreamDelta/Done/Error/Meta
  transcript/
    schema.ts                 # TranscriptLine, SaveMeeting, SaveNote, stripProvisionalLines,
                              # IMPORT_CHUNK_SECONDS
    __fixtures__/golden/       # NEW — TASK-005: one JSON fixture per edge case (mixed-language line,
                              # provisional line, every `speaker` value) consumed by BOTH a TS zod
                              # .safeParse test here AND a Swift Codable-decode test in
                              # native-app/MetisKit/Tests — this is what would have caught F2.
  import-audio/
    schema.ts                 # ImportAudio*, ImportJob*, ImportDecoder*Schema
  brain-correction/
    schema.ts                 # EntityRename/Merge/Unmerge/UpdateField/FieldDecision/
                              # CommitmentReject, SLUG_RE
  mcp/
    schema.ts                 # McpConnection*, McpTestConnection/SaveConnection/Disconnect/Push
  licensing/
    self-hosted/schema.ts      # License activate/status/gate/config + license-types.ts's Member*
    operator/schema.ts         # the wire-facing types from operator-license.ts / operator-entitlements.ts
                              # (the pure functions can stay where they are; only the shapes that
                              # cross IPC need to live under contracts/)
    README.md                  # NEW — resolves F6: states, in prose, how the two systems interact
                              # for a 2.0 install (or that one is deprecated)
  local-ai/
    schema.ts                 # LocalModelSummary, LocalPrewarmPayload
    # (delete localAiStatus/localTranscript* here, or re-add with a wiring TODO — see F4)
  window-overlay/
    schema.ts                 # MetisCommandState/Confirmation, HotkeyAction, DEFAULT_SHORTCUTS
```

Migration is mechanical: each domain file's content is a cut-paste of the corresponding section already identified above (line ranges cited in each finding double as the extraction boundaries), `index.ts` re-exports everything so **no call site outside this directory needs to change** (`import { IPC, AskStart } from '@shared/contracts'` behaves exactly like today's `@shared/ipc`), and the two structural fixes (F1's shared key-array, F3's zod-free `channels.ts`) are new additions rather than refactors of existing logic — low risk, matches "minimal blast radius."

---

## 4. Test gaps (summary)

1. No test asserts `SettingsPatch`/the main-process strip list actually covers every server-authoritative field in `BaseSettingsSchema` (F1).
2. No test asserts `preload/intelligence.ts`'s and `preload/import-decoder.ts`'s literal channel strings match `IPC.*` (F3).
3. No cross-platform (TS↔Swift) fixture exists for `TranscriptLine`/any shared wire shape at all — the exact gap TASK-005 names (F2).
4. `preload/index.ts`'s wire-shape test coverage is 4 of ~140 exposed functions, via a fragile AST/`vm` technique that a plain module split would make unnecessary (F7).
5. The five dead `local-ai:*` channels are "tested" only in the sense of having their string values pinned — that test currently provides negative evidence (proves the channel is unused) rather than positive coverage (F4).

---

## 5. Notes on scope boundaries honored

- Read-only throughout; no edits, no git state changes, no `npm install` run against `/Users/<redacted-user>/AI-Brain-build/metis-2.0`.
- Did not open or read any `key-*.bin`, `secret-key.bin`, `Cookies`, `identity.json`, or meeting/transcript content files — only counted/measured file sizes where relevant (none were needed for this lane).
- No secrets, tokens, account ids, or email addresses observed in this lane's files; none reproduced here.
- `main/index.ts` was read only as cross-reference evidence for contract-drift findings that are inherently about the preload/main boundary (F1, F3, F4) — this report does not attempt to audit `main/` itself, which is other lanes' scope (I did notice `main/index.ts` is 9,518 lines and that several "contract tests" in `src/main/*.contract.test.ts` verify code-ordering invariants by literal-text-slicing the source file rather than exercising real behavior — e.g. `main-lifecycle.contract.test.ts:167`, `content-protection.contract.test.ts:267`, `index-audit-fixes.contract.test.ts:276` — flagging this only because the other main-process lanes should be aware of it; it is not scored as an L08 finding since it lives entirely in `src/main/`).
