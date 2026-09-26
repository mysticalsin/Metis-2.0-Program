> Historical v1 implementation record. For the v2 media repair and current evidence, read `../REPAIR-REPORT.md` and `../evidence/current-status.json`.

# Métis 2.0 continuation — implementation and evidence

Date: September 24, 2026. Status: **scoped source changes implemented locally; no remote integration or 2.0 release**.

## 1. Recovered scope and actual baseline

The supplied r11 kit contains product contract revision 4.5, 55 requirements, 112 use cases, 66 root tasks and 12 golden flows, with additional agent, onboarding and Hindsight gates. Its original files remain authoritative. A short patch cannot honestly stand in for those acceptance criteria.

The source baseline used here is `mysticalsin/AskToto-Mantu` main commit `2bf21f1ceefe117838325342574b57852e5cadcb`, tree `945c28fb6938712bf6c52bccfc8d31591aea9ced`. Its package version is 1.9.6. Recent changes already include PR #199's onboarding, identity, command-approval and Operator integrity work and PR #198's subsequent dock/focus fixes. The open 2.0 PR #194 was not merged or used as a replacement for main.

Source bytes were recovered from authenticated GitHub reads and matching sections of the supplied export. Every existing patched file was matched to its exact Git blob hash at the pinned commit. Where the historical export differed for `operator/src/ask.test.ts`, the authenticated PR #199 file diff was applied first and the resulting bytes were then matched to the current blob hash. Unverified historical source was not silently substituted for current source. The source register includes one unchanged onboarding component retained only as a reference.

The connector could read the repository, but its actual branch-creation request returned 403. A discovered metadata permission is not a successful write. No branch, commit, PR, deployment, tag, or cloud configuration change was made. No callable Codex/Fable agent executor was available. Implementation and self-checking in this session are not independent agent review.

## 2. Production changes in this bundle

### Lossless wake-token removal — `src/shared/metis-wake.ts`

The old helper returned the folded string after matching. That destroyed capitalization, accents, punctuation and URL syntax in the remaining command. The replacement maps the folded match to original UTF-16 source offsets and removes only that wake span from the original text. Compatibility characters, combining accents, non-Latin payload text, emoji, quoted titles and internal whitespace are covered.

The existing wake/end detection policy is unchanged. This is not an acoustic detector, anti-replay system or permission grant. It does not make meeting transcripts into commands. It does not generalize the fixed OS adapter allowlist. SRC-06 is therefore only partially addressed.

### Optional playback must not block navigation — `onboarding-hero-video.ts`

The helper now handles synchronous `play()` exceptions, asynchronous rejection, and synchronous seeking failures independently. Promise rejection handling is attached before seeking. A failed audio attempt cannot suppress an independent video attempt, and playback remains first to preserve the click's media-gesture semantics.

This hardens a real existing helper, but does not establish that the installed Next-button blocker is closed. The parent flow, native input handling, package content and exact installed renderer still require validation. The existing lady/planet media was not replaced with an invented Tony video. The complete Tony-only film-or-text fallback requirement remains open in this continuation.

### Reviewed gateway configuration before protected traffic — `operator/src/ai-gateway.ts`

The former helper attempted to create a gateway with only a name and ID and ignored both unsuccessful responses and exceptions. It is replaced by a read-only check of the existing `default` gateway. No provisioning, silent repair, retry or management write occurs.

The minimum sensitive-route profile requires a matching successful result with `collect_logs: false`, `cache_ttl: 0`, and `logpush: false`. Configured OpenTelemetry exports and enabled log classification are rejected. Unknown, omitted required, or string-coerced values are not accepted as proof. The profile is a deliberately strict application policy, not a claim that every API response is guaranteed to expose these fields.

Requests use a trusted fixed API origin, a validated account identifier, no redirect following, no request body, and a whole-operation deadline of at most eight seconds. The response must be JSON, valid UTF-8, and no larger than 64 KiB, including when Content-Length is misleading. The deadline covers a stalled body and even a transport that ignores cancellation. Late response bodies are disposed. Stable error codes exclude credentials, response contents, source text, and raw upstream exception messages.

**Rollout consequence:** an existing token without gateway-read access, a missing gateway, an unsafe profile, or an omitted required field will block managed traffic. This is intentional fail-closed behavior. An authorized platform owner must inspect and qualify the actual account and route before deployment. This patch must not be used to auto-change a shared gateway or silently relax policy to make a request succeed.

The readback is not an end-to-end retention certificate. It does not cover every direct provider, the separate proxy, WebSocket speech, log export destination, provider retention policy, or Hindsight deployment. Existing payload-log suppression and cache-bypass request headers in the managed non-streaming path are preserved. Numeric usage continues through the Operator's metering path rather than being fabricated from a gateway success.

### Privacy preflight before credential mutation — `operator/src/keys.ts`

Cloudflare vault writes and rotations now complete their readback before encryption, persistence, supersession, or success audit/event writes. A privacy failure returns a stable 503 and leaves that operation's existing vault state unchanged. Rotation with an unrecoverable account identifier returns a clear 400 before modifying the prior key.

This proves ordering at these functions. It is not a claim of atomicity for every multi-key OAuth workflow, every database failure after a successful preflight, or all concurrent administrators. Those broader transactional cases remain to be validated in the complete system.

### Exact known/unknown usage — `operator/src/ask-meter.ts`

Token counts must be finite, safe, non-negative integers. Genuine zero remains zero; negative, fractional, infinite, unsafe or string-valued counts remain unknown (`null`). There is no invented zero, coercion or rounding. A known field remains known when its companion field is missing.

Current main already contains newer ownership/null/failover integrity work. It was not replaced by older r11 SQL. This patch does not finish provenance-aware paid-attempt reconciliation, cumulative event interpretation, or SQL-wide dashboard aggregates independent of detail pagination. SRC-10 remains partial.

### Preserve logical Ask identity and cancellation — `operator/src/use.ts`

The existing `clientAskId` accepted by the parser is now passed to `persistProxyAsk`. Previously this handler discarded it, causing the Worker to mint a separate logical operation ID rather than sharing the seat's ID. Separate billable attempts still require their own accounting semantics.

The provider timeout wrapper now preserves a shorter caller signal and Request-carried cancellation instead of overwriting them with a longer timeout. Explicit RequestInit signal precedence and null override behavior are tested. Gateway privacy failures surface as stable errors. Invalid upstream counters are omitted from the public answer and persisted as unknown; valid zero remains visible.

**Known remaining gap:** this handler still intentionally catches metering persistence errors and returns the buffered answer. This continuation did not introduce a durable outbox or claim full cost reconciliation. That failure/retry path remains a release-relevant accounting task.

## 3. Regression coverage and executed evidence

| Check | Actual result | Boundary |
|---|---:|---|
| New isolated source regression suite | 133 passed; 0 failed, skipped or cancelled | Actual patched TypeScript is transpiled and executed; transport, auth, crypto and store doubles are explicit where required. Not full app CI. |
| Unicode payload corpus | 2,000 generated payloads checked within one of those tests | Corpus cases are not counted as 2,000 separate tests. |
| Same initial wake/media tests on verified original source | 13 passed, 28 failed, nonzero exit | Negative control for the first 41 tests. Not a claim that the original repository's entire suite fails. |
| Guarded patch-application suite | 12 passed | Real Git in temporary scope fixtures; exact output hashes, clean-check refusal, tampering, wrong HEAD, user changes, ignored collisions and symlinks. |
| Isolated strict TypeScript check | Exit 0 | Two self-contained production modules: wake and gateway. Not whole-project typechecking. |
| TypeScript transpilation/syntax | 17 scoped files; 0 diagnostics | Includes one unchanged reference component. Does not resolve/check the complete project type graph. |
| Original r11 Hindsight component suite | 60 passed | Original kit tests, not a new embedded runtime or live-service pass. |
| New/updated repository-native Vitest files | Authored and syntax checked | Not run under Vitest here; full dependency/runtime environment unavailable. |
| Full repository typecheck/test/build/package | Not run | Do not substitute any row above for this gate. |
| Native Mac/Windows and live service qualification | Not run | No installed app, production account mutation, signing, Teams/Entra or live Hindsight operation performed. |

The environment was Node 22.16.0 and TypeScript 5.8.3; the repository's Node target is 22.22.3. The standalone checks did not install repository dependencies. Full native CI must run with the repository's exact dependency and runtime configuration.

Captured output is in `evidence/`. Repository-native tests were added for wake preservation, gateway privacy, count validation and vault mutation ordering; onboarding media regressions were appended to its existing suite. Four existing gateway-response fixture files were updated so they explicitly return a reviewed JSON profile instead of treating an arbitrary successful response as privacy proof. No production fake-success fixture was introduced.

## 4. Remaining completion gates

No root task is closed solely by this delta. `plan-status.json` preserves every task's ID, title, dependencies and relevant gates and records which received a limited local contribution.

The remaining product work or missing evidence includes the authentic Tony-only accessible onboarding experience; opt-in acoustic wake and trusted command-audio ingress; verified cross-platform action postconditions; production-quality speech, interruption, translation and diarization flows; real decision-provider qualification; canonical knowledge and source-linked Hindsight integration; named-agent/skills behavior; Entra/Teams/enterprise lifecycle behavior; durable exact usage and aggregate reconciliation; and all mandatory native/live/privacy/security acceptance criteria from the original r11 contract.

The two historical onboarding/package blockers must be evaluated on an exact new package containing the current source. Current main already has source repairs for stale renderer environment handling and some onboarding navigation issues. Open issue status is not proof that those repairs are absent, and source tests are not proof that the physical installed behavior is correct.

Hindsight remains server-side and subordinate to canonical source/identity authorization. Do not expose raw cross-user banks, treat recalled text as execution authority, add a raw Hindsight MCP to the desktop, bundle a server/database into the app, or mark the 60 reference tests as embedded integration. Runtime bindings, authorization changes, source revisions, tombstones, deletion/revocation, outages, provenance, cost and live observability remain required.

Release work must use one exact source/artifact identity with independent review, complete CI, actual package inspection and installation, native user-journey evidence, deployed Operator/privacy readback and trusted signing. No credentials were inspected or changed. No signing requirement was bypassed. Neither main's version nor the public `v2.0.0` tag was changed.

## 5. Applying and continuing

Use `tools/apply.py --check` before `--apply`, following the README. Keep this bundle outside a clean checkout. It is a scoped delta, not a full repository archive. The script never bypasses GitHub permission errors: it operates only on a local checkout the user supplies.

The exact patch output is checked in a temporary shadow fixture before the user checkout is changed. Every replacement's old Git blob and new SHA-256 are in `manifest.json`. A different source commit must be reconciled and reviewed instead of force-applied. The tool deliberately refuses rather than overwriting concurrent user changes. Its lock is cooperative; the applying worker must own the checkout exclusively.

`RESUME-CODEX-FABLE.md` preserves the continuation contract for an actual coding workspace. It authorizes no fictional worker, rubber-stamp review or test claim. A real read/write execution environment must first establish its available delegation APIs and repository permissions.

## 6. Source references

- Supplied artifact: `Metis-2.0-Codex-Fable-Hindsight-r11 (1).zip`; original master SHA-256 `e5b3c51d6d8423b5aadd1801d8fc2a77131c5ca3a363d281f1deb0da7acb1350`.
- Pinned repository source and authenticated Git blob register: `evidence/source-verification.json`.
- Mainline continuity: repository PR #199, PR #198 and pinned main. The PR metadata's historical test claims are not claimed as this session's executions.
- Cloudflare official gateway GET API: https://developers.cloudflare.com/api/resources/ai_gateway/methods/get/
- Cloudflare official logging controls: https://developers.cloudflare.com/ai-gateway/observability/logging/
- Cloudflare official caching controls: https://developers.cloudflare.com/ai-gateway/features/caching/
- Cloudflare Workers changelog (AbortSignal.any availability): https://developers.cloudflare.com/workers/platform/changelog/

These documents informed the readback/request-control implementation; no live account/profile validation was performed. The source artifact hashes and captured local evidence, not a confident narrative, define what this continuation actually accomplished.
