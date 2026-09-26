# P4 — Uncovered Main-Process Areas: AUDIT (read-only)

Scope: `src/main/llm/{dust,openai,anthropic,operator-ask,think-strip,prewarm,dust-attachments,enterprise-client}.ts`;
`src/main/mcp/{pushQueue,clickupOAuth,planeOAuth,clickupPush,write-tools}.ts`; `src/main/dust-oauth.ts`,
`dust-projects.ts`; `src/main/brain/{corrections,publish,attention,context,intelligence-index,intelligence-pass-route}.ts`;
`src/main/import-recap*.ts`, `import-magic.ts`, `selftest.ts`; `src/shared/{metis-command-session,metis-command-parse,
metis-command-proposal,metis-wake,desktop-actions}.ts`; `src/main/metis-command-register.ts`,
`application-command-session.ts` + renderer counterparts (`CommandListeningPill`, `CommandProposalCard`,
`use-command-mic`). Also read (necessary to answer the command-mic/SRC-04 question, not separately assigned):
`src/main/metis-command-runtime.ts`, `src/main/command-control.ts`, `src/main/desktop-adapters.ts`,
`src/renderer/src/App.tsx`, `src/renderer/src/components/RightEdgeSidecar.tsx`, `src/shared/ipc.ts` (MetisCommandState).

Method: read-only static review, five axes (correctness, readability, architecture, security, performance).
No repo tests/code were executed on this machine (hard rule). Evidence labels: OBSERVED (read directly in this
checkout), ASSUMED (plausible, not independently verified against a live external server / running app).

Headline: this main-process surface — LLM provider strategies, MCP OAuth/push, brain corrections/publish/context,
import-recap/selftest — is unusually mature. Nearly every file carries dense, dated doc comments citing prior
bug IDs (MQA-xxx, MI-2.5 review rounds, Fix A/B/C/D/G/H) that show several earlier hardening passes already ran
here. The material findings below are concentrated in the command-mic feature (not wired end-to-end despite full
per-layer test coverage), one asymmetry between two near-identical OAuth modules, and one file (`selftest.ts`)
whose own comments admit destructive behavior against the live profile.

---

## Command-mic / SRC-04 — is it wired? (explicit task question)

**No — the feature is fully scaffolded at every layer, with real per-layer tests, but no code path
currently connects a spoken wake word to an executed (or even user-visible) action.**

Chain, hop by hop, with what's actually implemented vs. what's missing:

1. **Mic capture** — `src/renderer/src/lib/use-command-mic.ts`'s `CommandMicController` is, by its own doc
   comment, "a deliberately narrow microphone lease" that "owns no recorder, ASR buffer, ... It intentionally
   has no command-ingest, execution, or meeting-audio capability." It only requests `getUserMedia`, holds the
   stream for up to 8s, and reports `idle/starting/listening/finalizing/error` — it never produces transcript
   text. OBSERVED.
2. **Wake/parse (pure, well-tested)** — `src/shared/metis-wake.ts` (wake word "Métis" + end-phrase detection),
   `src/shared/metis-command-parse.ts` (deterministic phrase→`DesktopActionRequest` rules), `src/shared/
   metis-command-proposal.ts` (proposal + TTL), `src/shared/metis-command-session.ts` (phase state machine).
   All are pure, all have matching `.test.ts` files, all look correct in isolation. OBSERVED.
3. **Runtime** — `src/main/metis-command-runtime.ts`'s `MetisCommandRuntime.ingestTranscript(text, channel)`
   is the *only* entry point that feeds text into step 2. It is never called anywhere in `src/main` outside its
   own class body (`grep -rn "\.ingestTranscript(" src/main` outside tests returns nothing). No STT/ASR handler
   (Parakeet/Whisper/Apple Speech, all present elsewhere in `src/main`) forwards recognized text into it, and no
   caller bridges `use-command-mic`'s raw audio into any recognizer that would produce text for it either.
   `getMetisCommandRuntime()` is exported and never called anywhere. `ensureMetisCommandRuntime(...)` *is*
   called once, from `src/main/index.ts:2619`, wiring `onState` → `CommandControl.propose(...)` and IPC
   broadcast (`IPC.metisCommandState`) — but with nothing ever calling `ingestTranscript`, the runtime sits
   permanently idle. OBSERVED.
4. **Confirmation boundary** — `src/main/command-control.ts`'s `CommandControl` (proposal token + timing-safe
   nonce compare, single-use consumption before the adapter call, TTL, lifecycle revocation) is wired to
   `executeDesktopAction` in `src/main/index.ts` and correctly separates dispatch/attempt/verified-completion
   (see SRC-04 section below). This part is real and reachable via `window.toto.confirmMetisCommand` /
   `cancelMetisCommand` (both exposed in `src/preload/index.ts`). OBSERVED.
5. **Renderer surface** — `confirmMetisCommand` is exposed on `window.toto` but is **never called from any
   renderer code** outside its own preload definition (`grep -rn "confirmMetisCommand" src` outside test/preload
   returns nothing). The purpose-built, fully-tested `CommandListeningPill.tsx` and `CommandProposalCard.tsx`
   components (pill copy "Hi Métis" / "Hi Métis, I'm listening...", a proper Confirm/Cancel card with an
   Escape-to-cancel handler) are **never imported by `App.tsx` or `RightEdgeSidecar.tsx`** — they exist only
   alongside their own test files. The actual mounted UI, `RightEdgeSidecar.tsx` (line ~397), instead renders a
   generic banner keyed off `commandState.proposalId` — "A pending external action has no verified summary. It
   cannot be approved here." — with **only a Cancel button, no Confirm affordance at all**. OBSERVED.
6. **Even if mounted, `CommandProposalCard` cannot render today**: its required prop
   `proposal.preview: string` ("Main must generate this exact, allowlisted consequence") has no producer.
   `MetisCommandState` (`src/shared/ipc.ts:1837`) is only
   `{proposalId} | {proposalId, nonce, expiresAt, revision}` — no `preview` field exists anywhere in the type or
   in `CommandControlState` (`command-control.ts`). The component returns `null` whenever `preview` is empty, so
   it is dead code by construction, not merely unmounted. OBSERVED.

**Net effect**: a user saying "Métis, open notes" today produces no observable effect anywhere in the shipped
app — not because of a bug in any one file, but because the mic→text, text→runtime, and
runtime→user-visible-confirm hops are each missing their connecting call. Every individual piece is
well-built and tested in isolation; nothing joins them.

### Where SRC-04 logic actually lives (kit registry evidence appears stale)

The r11 kit registry's SRC-04 finding (`plan/registry.json`) cites evidence at
`src/main/metis-command-runtime.ts` / `.test.ts` and describes: *"flushPending awaits executeDesktopAction but
ignores the returned ok/outcome before mark_committed... A rejected execution can also re-enter flushPending
from finally while pending remains."*

**Current `metis-command-runtime.ts` contains no `flushPending`, no `mark_committed`, and never calls
`executeDesktopAction`** — its own doc comment says "Execution is deliberately deferred to Task 5's main-owned
confirmation boundary" and "Reserved for Task 5 confirmation; this runtime never calls it." OBSERVED (grep
confirms zero matches for `flushPending`/`executeDesktopAction` in this file or anywhere in `src/main` except
`desktop-adapters.ts` and its one `index.ts` import site).

The actual execution/outcome-handling logic SRC-04 is about lives in **`src/main/command-control.ts`**,
`CommandControl.confirm()` (lines 85–111): it consumes the proposal exactly once before calling the adapter,
and explicitly separates dispatch acceptance from verified completion:
```
const result = await this.deps.execute(proposal.request)
if (result.id !== proposal.request.id) → { ok:false, reason:'adapter_failed' }
if (result.ok && result.outcome === 'verified') → { ok:true, outcome }
if (result.ok && result.outcome === 'unknown')  → { ok:false, reason:'outcome_unverified' }
else → { ok:false, reason:'adapter_failed' }
```
This already satisfies SRC-04's `required_change` ("separate dispatch acceptance, attempted side effect,
verified completion and unknown outcome... quarantine an uncertain non-idempotent attempt") — in clear
contrast to the registry's `"implementation": "NOT_STARTED"` / `"verification": "NOT_TESTED"` marking, which
appears to describe a stale snapshot of the runtime file rather than the current `command-control.ts`. DERIVED
— the registry evidence pointer and this checkout have diverged; someone should reconcile which commit the
kit's SRC-04 evidence extraction actually ran against.

**However, one real residual SRC-04-shaped gap remains**: every adapter case in `src/main/desktop-adapters.ts`
(`executeMac`) that succeeds returns `okResult(req.id, 'unknown', ...)` — **no adapter case ever returns
`outcome: 'verified'`**. So even once steps 1–5 above are wired, `CommandControl.confirm()` — which is written
to treat `outcome:'unknown'` as `{ok:false, reason:'outcome_unverified'}` — can **never** report a genuinely
successful voice command as `ok:true`. Every real success is indistinguishable from "unverified" today. This is
a legitimate, narrow SRC-04 gap, just one layer down from where the kit's evidence pointed. OBSERVED.

---

## Findings by axis

### Correctness

**F1 — `selftest.ts` runs destructively against the live Electron profile, gated only by a persistable env var.**
`src/main/selftest.ts`, invoked from `src/main/index.ts:8953-8959`. `runSelfTest` calls `app.getPath('userData')`
(the real production profile path for a dev/unpackaged launch) and directly `writeFileSync`s over the live
`settings.json` and `managed-config.json` (steps 1–2), and in step 3 calls `setSettings({ meetingsFolder: <tmp>,
encryptTranscripts:false })` — i.e. persists a temporary redirect of the **real** meetings-folder setting into
the **real** settings.json — before restoring both in a `finally`. The code's own comment at the call site
admits this: *"The self-test suite runs destructively against the LIVE profile (it overwrites, then deletes,
settings.json and managed-config.json), so devEnv() keeps it out of packaged builds — otherwise a persistent
`setx ASKTOTO_SELFTEST out.json` re-wipes the profile and quits on every launch."* The only guard is
`devEnv('ASKTOTO_SELFTEST')`, i.e. `!app.isPackaged && process.env.ASKTOTO_SELFTEST` — and an exported/`setx`/
`launchctl setenv` environment variable persists across shell sessions and terminal restarts. **This is a
plausible root cause for exactly the symptom this task's hard rules cite as already observed twice** ("test
processes currently resolve Tony's REAL OneDrive meetings folder and quarantine his brain index"): a stray
`ASKTOTO_SELFTEST` left set in an environment, combined with any unpackaged/dev launch of Métis, silently
mutates the real settings/meetings-folder pointer, then quits — and any crash or interruption between the
mutation and the `finally` restore (or a concurrent read by another process/instance) leaves the real profile
pointed at a directory that no longer exists, or leaves `encryptTranscripts` toggled. ASSUMED for the causal
link to the specific incident (not independently reproduced — hard rule forbids running it), OBSERVED for the
destructive-by-design mechanism itself.
- Fix direction: give self-test its own isolated `userData` directory (`app.setPath('userData', <dedicated
  dir>)` before any settings access) instead of borrow-then-restore on the live profile, so it can never touch
  the real settings.json/managed-config.json/meetings folder even if interrupted mid-run.

**F2 — Plane OAuth likely inherits ClickUp's already-discovered-and-fixed redirect_uri mismatch bug, but
without the fix.** `src/main/mcp/planeOAuth.ts` vs `clickupOAuth.ts`. `clickupOAuth.ts`'s header documents (with
verification dates and specific 401 evidence) that `mcp.clickup.com` exact-matches the DCR-registered
`redirect_uri` and does **not** support RFC 8252 §7.3 port-flexible loopback matching — so it re-registers a
**fresh** OAuth client on every `runClickupOAuth()` call, bound to that run's exact
`http://127.0.0.1:<ephemeral-port>/callback`, and never reuses a cached `client_id` for `/authorize`.
`planeOAuth.ts` is structurally identical in every other respect (its own header says "Mirrors clickupOAuth.ts")
but `ensurePlaneClient()` instead **caches** a `client_id`/`client_secret` pair from a **one-time** registration
using a portless `redirect_uris: ['http://127.0.0.1/callback']`, and every subsequent `runPlaneOAuth()` call then
sends a **different**, ported `redirect_uri` to `/authorize` and to the token exchange using that stale cached
client. Nothing in `planeOAuth.ts`'s header states this was checked against a live Plane server the way
ClickUp's was, and there is no mismatch-specific error humanizer here (contrast `humanizeClickupOAuthError`). If
`mcp.plane.so` behaves like `mcp.clickup.com` (exact match, no port flexibility) — plausible, since both are
recently-stood-up hosted MCP OAuth servers — every Plane Connect after the very first successful registration
will fail with a redirect_uri mismatch. ASSUMED (not verified against the live Plane server; flagged because of
the stark contrast in documented verification rigor between two files by the same author covering the same
mechanism).
- Failure scenario: user connects Plane once (registration succeeds, portless URI cached); reconnects later
  (new ephemeral port) → `/authorize` or the token exchange is rejected by Plane for a redirect_uri that
  doesn't match the cached registration → user sees a generic OAuth failure with no actionable guidance.
- Fix direction: verify `mcp.plane.so`'s `.well-known/oauth-authorization-server` + a live `/authorize` round
  trip the same way `clickupOAuth.ts`'s header documents doing; if exact-match, apply the identical "register a
  fresh client scoped to this run's redirect_uri" pattern instead of the one-time cache.

**F3 — `pushQueue.ts`'s idempotency key is not canonical.** `outboundActionId` (`src/main/mcp/pushQueue.ts:85`)
hashes `JSON.stringify([kind, toolName, meetingFile, payload])`. `JSON.stringify` serializes object keys in
insertion order, not a canonical/sorted order, so two calls that build a logically-identical `payload` via
different code paths (e.g. an object literal vs. a spread-merged object with the same keys in a different
order) hash to two different ids — silently defeating the documented guarantee ("the same logical action never
queues twice"). Low probability today (single call site), but the invariant is not actually enforced by the
implementation, and enqueue is exactly the place a future second caller (the doc comment itself anticipates "a
future auto-push from brain consolidation") could reintroduce a duplicate silently.
- Fix direction: sort payload keys (recursively) before stringifying in `outboundActionId`.

### Architecture

**F4 — `clickupPush.ts` hardcodes a single ClickUp workspace identifier as a shipped constant**, used verbatim
in every create-task/discovery call regardless of which workspace the connecting user's own OAuth grant
actually covers (`export const CLICKUP_WORKSPACE_ID = '<redacted per task rule: never print account IDs>'`, used
in `clickupCreateTaskArgs`, `discoverClickupList`). This bakes one specific ClickUp workspace into the shipped
product rather than deriving the workspace id from the connected user's own session/tools discovery. If this is
deliberately a single-tenant/internal integration that's a legitimate (if undocumented) choice; if any customer
other than that one workspace's owner is expected to connect their own ClickUp, every push will target the
wrong workspace. Worth an explicit product decision rather than a silent literal in a shared module.
- Fix direction: derive the workspace id from the connected account (a post-connect `/workspaces` call, mirroring
  how Plane resolves its workspace at login) or document explicitly that ClickUp push is single-tenant by design.

**F5 — Command-mic feature has no wiring layer at all (see dedicated section above)** — five independently
correct, independently tested layers with zero glue code connecting them. Filed here too because the gap itself
is architectural (no owner module currently exists whose job is "bridge renderer mic → main transcript
ingestion → user-visible confirm"), not a bug in any one of the layers.

### Performance

**F6 — `dust-projects.ts`'s `fetchDustProjects` fetches every space's data_sources sequentially** (a plain
`for` loop with `await fetchImpl(...)` per space, `src/main/dust-projects.ts:83-124`) rather than concurrently.
For a Dust workspace with many spaces, Spotlight Ref's "Data and AI projects" resolution pays N sequential round
trips instead of one parallel batch. Low severity at today's likely space counts, but a straightforward
`Promise.all` over the space list would materially cut latency as workspaces grow.

### Security

No new high-severity findings beyond F1 (destructive dev hatch) and F2/F4 above. Positive notes: OAuth PKCE/
state/loopback handling in `clickupOAuth.ts`/`planeOAuth.ts` is careful (literal `127.0.0.1`, S256, CSRF state,
timing-safe nonce compare in `command-control.ts`, single-flight refresh locks in `dust-oauth.ts`); `dust-oauth.ts`'s
`isHttpsUrl` scheme-only gate on `shell.openExternal` (MQA-253) is a good, narrowly-scoped fix; `readConfidentialMeetings`
in `publish.ts` fails closed on every unreadable/unknown state before publishing brain content to the plaintext
wiki mirror.

### Readability

No material issues found — this surface is unusually well-commented; several files (`corrections.ts`,
`command-control.ts`, `clickupOAuth.ts`) use dense doc comments that name the specific prior defect (MQA-xxx /
MI-2.5 Fix letter) each guard exists for, which is a genuinely good pattern for a codebase at this history depth.

---

## Coverage notes / limitations

- `corrections.ts` (1629 lines) and `publish.ts` (990 lines) were read in large part (corrections.ts ~1300/1629
  lines across two passes plus targeted greps of the remainder; publish.ts ~300/990 lines plus a grep sweep of
  the remainder for TODO/FIXME/bare-catch patterns, none found) rather than exhaustively line-by-line, given the
  review's breadth; both showed no new correctness defects in the portions read, and both are clearly the
  product of multiple prior hardening passes (explicit `MI-2.5`/`MQA-0xx` fix references throughout).
- `intelligence-index.ts` was read in full.
- Adjacent files read only because the command-mic/SRC-04 question required them (not separately assigned):
  `metis-command-runtime.ts`, `command-control.ts`, `desktop-adapters.ts` (partial — `executeMac`'s outcome
  values only), `App.tsx` (grep + two short reads), `RightEdgeSidecar.tsx` (grep + one read), `shared/ipc.ts`
  (`MetisCommandState` only).
- No repo tests or app code were executed on this Mac, per hard rule.
- No secrets, tokens, personal emails, or meeting content were found or are reproduced here. One hardcoded
  ClickUp workspace ID constant exists in source (F4) — its value is intentionally not reproduced in this report
  per the task's "never print account IDs" rule.
