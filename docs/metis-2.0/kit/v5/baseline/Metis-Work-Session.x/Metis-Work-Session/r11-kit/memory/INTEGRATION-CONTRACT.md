## 35. Hindsight embedded memory, governed by Métis

**Revision 4.5 / package r11. Owner-requested addition, not a substitute for any previous requirement.** Hindsight becomes an internal memory capability of Mantu Intelligence, named agents, approved Dust callers and central skills. It is not another end-user application, an embedded administration iframe, a general-purpose model, a replacement transcription engine, or a new execution authority. Preserve the animated solving orb, original Métis onboarding/Tony-only film contract, simple Settings, Cloudflare-first speech, Jev/Laya, lightweight installers and independent platform release lanes.

The primary-source review is in `memory/SOURCE-REVIEW.md` and its machine-readable register. Official HTTP docs were observed as 0.10.1; upstream main was `b88458fd6b96e70069238f7df5a0e2f1c3c9240c` on 23 September 2026. These are research observations, not the production deployment version, image digest or security approval. The implementation must pin a qualified release and reconcile actual runtime schemas. The included adapter was independently implemented against documented HTTP shapes; the complete upstream code was not audited or built here.

### 35.1 Product outcome and architecture decision

Make these workflows real: “Remember that I prefer French summaries”; “What changed since our last meeting?”; “What did we agree, and what remains uncertain?”; “Why did this agent use that information?”; “Correct that commitment”; and “Forget this preference.” The current user, tenant, agent, source permissions and intended audience determine what is available. A sleeping laptop must not prevent an approved shared server memory from being queried; a device-only/private vault must not be uploaded just to satisfy availability.

**Embedded means one Métis identity, one UX, one governed API, one operational portal and a thin desktop/native client.** The recommended starting deployment is a private service on the already approved container platform, with managed PostgreSQL and supported vector extension. Hindsight's API/worker runtime and any server embeddings/reranker remain there, not in every EXE/DMG. Cloudflare still provides the selected speech and authorized gateway/control functions. Do not pretend that a standard Worker or D1 is a drop-in host for Hindsight's Python/PostgreSQL runtime. Any alternative host needs actual workload, lifecycle and persistent-storage qualification. [HS-R09, HS-R14]

```text
Windows Métis / native Mac / Teams / authorized Dust / published skills
    → existing authenticated Métis knowledge and memory API
        → canonical records, approval, revisions, ACLs and tombstones
        → bounded authorized context builder
            → Hindsight retain / recall / reflect, private service
                → approved PostgreSQL memory projection
                → approved extraction / embedding / reranking / synthesis
        → source- and audience-checked answer or reviewable proposal
    → existing Operator ledger, readiness and purge metadata only

Graphify + published wiki: projections of approved canonical knowledge.
Developer codebase graph + relay/lessons: separate engineering context.
Hindsight: persistent, derived application memory, never the authority above them.
```

This adds a new **approved derived-content storage boundary**. It cannot honestly be called “no data retained anywhere”: memory deliberately retains permitted information. The existing prohibition is unchanged for Cloudflare content logs/caches/queues/stores and for raw or unapproved meeting capture. Approve the Hindsight store's purposes, lifetimes, region, key management, backups and processors before activating real data. Do not automatically turn on hosted Vectorize Cloud; select self-hosted/private service by default for this plan, with hosted service a separate actual approval and commercial decision.

### 35.2 Three layers of truth, preserved

1. **Canonical evidence:** approved meeting summaries, verified action receipts, explicit preferences and human corrections in the existing selected store. Keep source event time, currency, certainty, speaker attribution where authorized, and the original text. This layer owns durable revisions and human verification.
2. **Memory projection:** Hindsight extracted world/experience memories and later qualified observations. They improve retrieval and continuity; an engine label such as “fact” does not upgrade a stated or uncertain business value to verified.
3. **Synthesis:** reflected answers, curated mental models and briefings. Always carry supporting permitted sources, freshness and uncertainty. A synthesis is not a new independent witness for its own inputs and must never be auto-retained as corroboration.

Never replace deterministic business totals, signed policies, source permissions, explicit provider selections, skill definitions or exact approved action arguments with recalled text. Jev/Laya still choose compatible authorized candidates; Hindsight does not grant execution rights. A remembered browser name cannot override the currently selected target or bypass unsaved-work approval. Memory retrieval cannot be used to fill missing audio with a plausible transcript or silently “repair” a negation.

### 35.3 Scope and bank design

Create a server-owned mapping from authenticated principal and eligible knowledge scope to a bank/generation. Separate personal preferences, agent-private experience, explicitly shared team/account/project knowledge, synthetic tests and engineering memory. Agent display-name changes do not create a new identity; a role title never becomes an access-control credential. Cloud-backed memory must not be used during an explicit local-only interaction.

Use **homogeneous effective ACL banks** as the initial defensible boundary, with tenant and security-domain generation recorded in the registry. Do not consolidate private and team-visible material together and plan to remove forbidden citations afterward: model generation could already have consumed it. On a permission change, quarantine the affected generation before retrieval and rebuild the permitted remainder or use qualified strictly isolated storage. Apply output-audience restrictions before any recall/rerank/reflect and again at release. Personal evidence cannot flow to a Teams shared stage or wider Dust service account.

Hindsight's shared API key is service authentication, not Entra user or record authorization. Auth is not enabled merely by starting its default server. A custom tenant extension can partition schemas but still requires the Métis access model and qualified bank selection. Scope IDs, identity headers, tags, policies and provider keys are server-derived, not trusted because an MCP JSON argument says they are. [HS-R03, HS-R08]

For the initial adapter, require nonempty security tags, `tags_match=all_strict`, and `observation_scopes=combined`. These tags are defense in depth within an already authorized bank. `all_strict` is not exact tag-set equality. Do not permit `any`, blank scope, fuzzy security tags, shared global observations, per-tag authority splitting or automatic all-combination materialization. Untagged directives can still apply during reflect; keep directives operator-owned, reviewed and free from unauthorized content. Bank config, prompts, missions, mental models and list/history/graph/export APIs need the same review boundary. [HS-R02, HS-R04, HS-R05]

### 35.4 Ingestion: approved records, not everything the microphone hears

Retain only eligible canonical records whose approval, source revision, visibility, expiry and storage policy have been verified. Initial supported categories are approved summaries, approved explicit preferences and verified execution receipts. No continuous transcription retain, no screenshot archive, no passwords/tokens, no unapproved personal data, no confidential/local-only source, no automatic historical export and no covert agent conversation capture.

“Remember this” creates a canonical preference with scope/lifetime first, then a projection operation. Ordinary chat does not imply that every sentence becomes memory. Established summary automation may project already approved notes under the approved organizational policy; it does not need repetitive confirmations for each fact, but must show effective memory scope and a clear correction/forget route. Ephemeral mode prevents all derived retention for that interaction, including feedback and delayed background jobs.

Carry the source's actual event/approval timestamp and original Unicode text. Stable opaque document IDs map back to canonical source identity. Submit `replace`, not append. Use the source revision and ACL epoch to prevent an old retry overwriting a newer correction. Upstream retain is not compare-and-swap; implement durable cross-replica fencing and a metadata-only outbox beside the real source transaction or its actual ETag/delta reconciliation. Fetch private content only when the worker is ready to process it, and never store that body in a Cloudflare durable checkpoint.

Distinguish **canonical saved → projection queued → upstream accepted → indexed → recall-verified**. A provider `success: true` is not a cross-system transaction or proof of searchable memory. Reconcile an ambiguous timeout instead of blindly retrying, marking success, or telling the user nothing happened. When an API response represents several child operations, account for all relevant children. Cancellation may stop future work while a submitted batch still completes; tombstones and generations remain authoritative. [HS-R02, HS-R06, HS-R07]

### 35.5 Privacy profile and actual readback

Configure the real service deliberately; do not just paste quick-start defaults. The initial deployment profile contains:

```text
HINDSIGHT_API_STORE_DOCUMENT_TEXT=false
HINDSIGHT_API_LLM_TRACE_ENABLED=false
HINDSIGHT_API_OTEL_TRACES_ENABLED=false
HINDSIGHT_API_MCP_ENABLED=false
HINDSIGHT_API_ENABLE_FILE_UPLOAD_API=false
HINDSIGHT_API_ENABLE_DOCUMENT_EXPORT_API=false
HINDSIGHT_API_ENABLE_DOCUMENT_IMPORT_API=false
HINDSIGHT_API_RETAIN_EXTRACTION_MODE=concise
HINDSIGHT_API_OPERATION_RETENTION_DAYS=1
```

The one-day terminal-operation target is a proposed bounded starting value, not a legal retention conclusion. Minimize it further where supported and appropriate. Pending/processing rows need separately bounded deadlines and cleanup. Validate effective per-bank strategies, audit options and extensions; a safe server default can be undermined by a bank-level override in a different setting. Preserve necessary metadata-only security audit in the existing Métis ledger; do not disable it to make a privacy test quiet.

The configuration documentation states that disabling document text omits original/chunk source text while retained memories remain. Append then cannot reconstruct the previous document. Evidence expansion should therefore return to the approved canonical source, not a hidden copied archive. `chunks` and `verbatim` extraction can preserve source as memory despite a source-storage flag; do not enable them in this profile. Model-request traces and OTLP content export are separate potential sinks. [HS-R03, HS-R06]

Run sentinels through successful and failed retain/recall/reflect, rejected requests, cancellation, retries and maintenance. Inspect controlled DB tables, chunks, operation payloads, logs, exception stores, object stores, debug endpoints, exports and telemetry transport. Verify that **approved derived memories may persist only where declared**, while raw transcripts and forbidden payloads do not. A pattern scrubber cannot establish semantic safety, delete existing copies or prove upstream retention guarantees. Validate supplier/route contractual assurances separately from a database screen. [HS-R10]

The provided `/version` check verifies reported feature flags only; it does not attest network isolation or prove every sink. Service secrets come from the existing vault/secret manager; no key appears in a renderer, Swift UI, JavaScript bundle, bank label, deep link, onboarding video or review packet. Bind the API, DB and administration console to restricted ingress. Accept no arbitrary upstream URL or user-supplied auth passthrough.

### 35.6 Recall and reflection without slowing every interaction

Use memory when the request depends on prior approved context, an explicit preference, a continuing task or a skill-declared retrieval need. Do not run retain/recall/reflect before every user keystroke, speech partial, animation frame, heartbeat or deterministic app-open/close. Keep a simple exact command on its existing fast route. A memory outage must not disable microphone Stop, app UI, canonical note access or an otherwise authorized deterministic action.

Begin with a small low-budget recall and a bounded evidence packet. Resolve each candidate to current canonical sources and known epistemic status. If a required date range is a filter, apply it explicitly to canonical event time; temporal ranking hints do not guarantee exclusion of older material. Do not drop important negation or names to fit context. State coverage and provide on-demand source navigation instead of repeatedly pasting an entire bank. [HS-R02, HS-R05]

Reflection is an explicit deeper operation with its own deadline and budget, not an invisible extra answer generator. Request supporting facts; withhold an entire synthesis if any required source is unauthorized, stale, unresolvable or deleted. A final-output token cap is not a total cost cap for internal model/tool iterations. Enforce total workload/concurrency budgets at the service and preserve usage attribution for partial or failed calls.

The delivered transport deliberately begins facts-only and excludes mental models. This is a **safe initial component profile, not permission to omit the planned richer memory**. HMSTEP-10 implements and qualifies observations/curated models with complete lineage, mutation invalidation and scoped refresh before enabling them. Do not adopt the upstream CP as a shortcut or turn on every built-in feature merely because it exists. Record a staged capability matrix, with advertised advanced memory still pending until its real qualification succeeds.

Caching includes tenant, principal/authorized set, output audience, agent and skill versions, bank generation, policy and source revisions. A TTL alone cannot fix access revocation. Do not cache full reflected content in Cloudflare persistence. Keep ephemeral context in an approved process-bound cache only within the permitted lifetime, or use the approved content store deliberately. On cache miss or failure, distinguish **no matching evidence**, **insufficient permissions**, **sync pending**, **source stale** and **service unavailable** without leaking which private record exists.

### 35.7 Corrections, forgetting and derivative invalidation

Correct the canonical record using expected revision, then invalidate its derivatives. Never write a user correction only into a Hindsight extraction that is regenerated later. Preserve previously stated versus now-corrected historical values without presenting both as current truth. Human verification overrides an inferred observation, but does not fabricate source evidence for an unrecorded assertion.

For forget/revoke, persist the exact-source tombstone and invalidate read authority immediately. User-visible state is **not used anymore; removal still in progress** until actual purge and downstream handling are verified. If a write is in flight, its late completion cannot publish to the active generation. A retry may reconcile the exact document, not delete an entire shared bank casually. Restore tombstones/ACL epochs before serving a restored backup.

The documented mental-model `is_stale` flag does not detect source deletions. Métis must explicitly invalidate dependent observations, mental models, knowledge pages, stored reflect payloads, histories and cached answers. If complete lineage cannot be proved, quarantine/rebuild the affected scope rather than release an answer with a removed citation. Cancel or fence already scheduled consolidation/refresh, then verify cleanup after any outstanding job settles. [HS-R02]

Keep a deletion ledger that distinguishes canonical deletion, retrieval block, primary memory purge, derivatives, external replicas, backups/legal hold and completion. Never claim physical removal from inaccessible supplier infrastructure based on a successful HTTP status. Test a deletion during reflect, a delayed retain retry, a backup restoration and an agent with cached evidence. “Please forget” in a prompt is not erasure.

### 35.8 Memory inside the actual Métis interface

Add a compact **Memory** area to existing Knowledge & skills, not a fifth everyday Settings destination. Mantu Intelligence exposes “What Métis remembers,” source/freshness, personal/shared scope, corrected/conflicting state, and accessible Inspect / Correct / Forget actions. Keep technical banks, prompts, provider dimensions and queue settings in role-scoped Operator administration.

Named agents can show “Using 2 approved sources” and a source drawer. Their private preferences and workflow experience cannot be silently mixed into a team briefing. Switching agents preserves identity, drafts and pending approvals. Remembering an action result is allowed only after the existing executor verifies it; a failed or unknown operation must not become successful experience. User-authored notes stay intact, with generated enhancements separately reviewable.

The global ARMED surface remains the single animated solving orb. No extra Hindsight orb, activity spinner, cloud query or microphone stream is required just to show that memory is configured. Passive arrival of new memory never steals input focus. The original onboarding can explain memory in its existing personalization/setup scenes without adding another tour, login or replacement video. Only Tony Walteur is the named presenter.

The included `memory/visual/index.html` is an independent synthetic design reference. It illustrates review, cross-conversation recall, correction, revocation, purge-pending and unavailable states. Its fixtures do not certify a deployed memory store or become production seed records.

### 35.9 Dust, agents and skills use one governed interface

Dust reads and writes through existing Métis MCP/knowledge services, not a direct shared Hindsight API key. A read may use authorized memory as retrieval support. A write modifies the canonical record or creates a reviewed proposal; subsequent memory regeneration reflects that change. Personal OAuth and explicitly scoped service credentials remain different authority models. Do not trust a tool argument naming an employee.

Publish skill metadata specifying eligible memory scopes, context budget, evidence requirements and whether any approved outcome may be remembered. A skill may not redefine its own ACL, teach the assistant to ignore approvals, update a global directive or create an unreviewed persistent policy. Pin agent/skill versions; cross-run learnings are reviewed canonical preferences or bounded outcome evidence, not edits to executable skills. Deletion and revocation reach these readers before eventual projections catch up.

Keep **engineering Hindsight memory**, if separately authorized for Codex/Fable, isolated from product memory with different banks, credentials, retention and retrieval scopes. It may summarize reviewed engineering lessons but must not upload the private repository automatically or replace commit-bound relay notes/source graph. Do not enable global CLI/plugin hooks as a side effect of embedding memory into the application.

### 35.10 Portal accounting and operational control

Add one memory service pane under the existing Operator surface. Show actual version and readiness, authorized bank counts without revealing names/content, projection lag, failures, quarantine/expiry, purge backlog, stage-level latency, workload, known quantities and cost completeness. End-user identity and event-time attribution remain the existing definitions. “Live memory” is not “live user.”

Meter extraction, embeddings, reranking, consolidation, reflection, retries, refresh and failed billable attempts. Some aggregate API usage covers several internal calls; reconcile parent versus child totals rather than sum both. Separate provider-reported quantities, estimates, unknowns and allocated infrastructure costs. A self-hosted open-source memory engine does not make LLM or compute usage free. Keep private content and content hashes/embeddings out of operational accounting; opaque IDs are not human-readable meeting titles.

The source configuration documents a TypeSafe/Jev reranker option. Qualify its actual supported model/endpoint and measured value under the current Jev policy, and track it separately from desktop action decisions. Do not install a moving `jev-latest` alias as an unreviewed production dependency. Laya remains an independent decision alternative; it is not automatically an Hindsight embedder, reranker or generative model. Cloudflare speech selection remains unchanged. [HS-R03]

Scale only against measured workloads: isolate interactive recall from maintenance, cap queue/consolidation and per-tenant concurrency, prevent refresh storms and noisy neighbors, set connection/worker budgets, and define finite abandoned-job cleanup. Use actual DB/service readiness instead of blind container restarts. Keep counters low-cardinality; avoid per-source IDs in metric labels. Observe content-free health and restore evidence rather than enabling full prompts to make graphs attractive.

### 35.11 Migration, quality and rollout

Start with reviewed synthetic data and an empty dedicated bank; use the supplied opt-in real API smoke only after legitimate service/provider permissions. Then project a small owner-approved canonical set. Preview counts, scope, retained content categories and cost before historical migration. Never feed the raw export, entire OneDrive root or all old transcripts simply to “give it memory.”

Preserve schema/model/dimension/embedding-space identity. Even equal dimensions do not make two embedding models compatible. Create a new projection generation and rebuild only still-authorized records, qualify it, then atomically promote its pointer. Rollback changes the retrieval projection, not the current source facts, permissions or tombstones. A newer source edit must not disappear because an old memory image was restored.

Use paired held-out tests against competent existing canonical search/Graphify retrieval. Measure answer usefulness, citation coverage, false facts, temporal correctness, contradiction handling, language slices, privacy isolation, recall latency, source-to-ready lag, total inference and CPU/storage costs. Report abstentions and failed/partial runs alongside successes. Do not quote vendor leaderboard results as Métis quality. Include Québec French, accented English, Spanish and Brazilian Portuguese in the actual supported product scope; no brand-name model choice substitutes for the tests.

Proposed starting budgets, to qualify rather than announce as achieved: hot authorization/index overhead ≤50 ms p95 excluding upstream inference; memory response UI acknowledgment ≤100 ms; typical warm bounded recall goal ≤700 ms p95 on declared reference infrastructure; final deep reflection ≤8 s target with cancellation and explicit partial/unavailable behavior; simple open/close paths retain their existing latency target without a compulsory memory call. Measure p50/p95/p99, sample counts, network/device conditions and total cost including preprocessing. Do not trim away critical evidence to win the budget.

### 35.12 Numbered delivery and evidence

All baseline TASK-001–066 IDs remain. HMSTEP implementation dependencies refer to ready contracts/components; full parent-feature acceptance still requires its downstream real journeys. Memory infrastructure cannot delay the early P1/right-edge repairs. Native Mac implementation and Windows release lanes remain independent of public Apple signing, but neither platform may advertise memory without its own integration proof.

| Step | Work | Prerequisites | Root task owners |
|---|---|---|---|
| HMSTEP-01 | Qualify the source and runtime contract | Actual baseline | TASK-001, TASK-002, TASK-003 |
| HMSTEP-02 | Approve retention and authority before ingest | HMSTEP-01 | TASK-007, TASK-011, TASK-015 |
| HMSTEP-03 | Deploy the private service and database | HMSTEP-02 | TASK-015, TASK-062 |
| HMSTEP-04 | Bind real identity and bank generation | HMSTEP-02, HMSTEP-03 | TASK-006, TASK-035, TASK-037 |
| HMSTEP-05 | Implement canonical-to-memory projection | HMSTEP-04 | TASK-035, TASK-036 |
| HMSTEP-06 | Implement bounded recall with lineage | HMSTEP-05 | TASK-037, TASK-038 |
| HMSTEP-07 | Implement correction, tombstone and purge fences | HMSTEP-05, HMSTEP-06 | TASK-039, TASK-041, TASK-058 |
| HMSTEP-08 | Wire the memory UX into Métis | HMSTEP-06 | TASK-008, TASK-029, TASK-040, TASK-044 |
| HMSTEP-09 | Connect Dust and server skills | HMSTEP-06, HMSTEP-08 | TASK-038, TASK-039, TASK-043, TASK-044 |
| HMSTEP-10 | Qualify observations, mental models and derivative cleanup | HMSTEP-06, HMSTEP-07 | TASK-036, TASK-037, TASK-040, TASK-041 |
| HMSTEP-11 | Account for every memory workload | HMSTEP-05, HMSTEP-06 | TASK-034, TASK-045 |
| HMSTEP-12 | Benchmark usefulness, multilingual fidelity and speed | HMSTEP-06, HMSTEP-10, HMSTEP-11 | TASK-053, TASK-054, TASK-056, TASK-060 |
| HMSTEP-13 | Exercise failure and security boundaries | HMSTEP-09, HMSTEP-10, HMSTEP-11 | TASK-057, TASK-058, TASK-062 |
| HMSTEP-14 | Migrate with scoped canaries | HMSTEP-08, HMSTEP-10, HMSTEP-12, HMSTEP-13 | TASK-026, TASK-035, TASK-041, TASK-061 |
| HMSTEP-15 | Prove the complete product journeys | HMSTEP-09, HMSTEP-11, HMSTEP-12, HMSTEP-13, HMSTEP-14 | TASK-055, TASK-056, TASK-063, TASK-065 |
| HMSTEP-16 | Freeze, release and operate the qualified capability | HMSTEP-15 | TASK-062, TASK-063, TASK-064, TASK-065, TASK-066 |

### 35.13 Additional acceptance requirements

These are additional qualifications mapped to existing root owners, not replacements for the 55 baseline requirements. Product verification starts NOT_TESTED; offline component checks are not allowed to prefill it.

| ID | Qualification | Required outcome |
|---|---|---|
| HM-01 | Embedded product, lean clients | Hindsight is used through Métis identity and surfaces. No new end-user service login, iframe admin console, desktop PostgreSQL or model weights. |
| HM-02 | Approved inputs and canonical authority | Only eligible approved summaries/preferences/verified outcomes enter memory. Canonical records remain authoritative and model-generated observations remain labelled. |
| HM-03 | Pre-retrieval authorization and audience | A verified principal cannot retrieve another personal/team bank, including through reflect, entities, history, listings, exports or derived pages. Mixed ACL input never reaches a model. |
| HM-04 | No unintended retained content | Source-text and LLM traces off; external spans/queues/exports audited. Derived storage explicitly approved. No raw audio/transcript or private content in Cloudflare persistence. |
| HM-05 | Revision-safe retain and durable projection | Stable document identity, canonical event time, CAS/fencing and metadata-only outbox survive reordered writes, restarts and ambiguous upstream acknowledgments. |
| HM-06 | Source-linked bounded recall | Results are bounded, preserve meaning, resolve to current authorized canonical records and honor required time intervals. Unavailable is not empty. |
| HM-07 | Grounded reflection without false authority | Syntheses name permitted sources, uncertainty and freshness; unknown lineage withholds the result. No reflection grants an action or verifies itself. |
| HM-08 | Deletion, correction and no resurrection | Revocation blocks reads immediately; dependent observations/models/pages invalidate explicitly; pending work and restored backups cannot resurrect deleted evidence. |
| HM-09 | Named-agent memory isolation | Personal preferences, shared team facts and agent-private experience remain distinct. Renames do not change scope, export permissions or identity. |
| HM-10 | Actual Dust and skill interoperability | A real Dust agent and published skill retrieve/update authorized canonical records and see refreshed memory without bypassing governance. |
| HM-11 | One accurate operational ledger | Ingestion, recall, rerank, reflection and maintenance attempts reconcile with real units and unknowns, not duplicate nested totals or content logs. |
| HM-12 | Fast critical path and useful quality | No compulsory memory round trip for an exact open/close command. Paired multilingual evaluation measures quality and total latency/cost against existing retrieval. |
| HM-13 | Simple, controllable UX | Memory stays inside Knowledge & skills and Intelligence. User can inspect/correct/forget, use ephemeral interaction and distinguish policy-locked controls. |
| HM-14 | Server deployment and resilient operations | Authenticated private API and PostgreSQL, scoped secrets, version/health checks, backups, restore, workload limits and vendor failover policy are exercised. |
| HM-15 | Incremental migration and reversible rollout | No automatic historical transcript backfill. Approved projection generations can be rebuilt/rolled back without rolling back canonical edits or revocations. |
| HM-16 | Real cross-platform integrated proof | Windows/native Mac, deployed memory, portal, Dust and skills have explicit real proof at the claimed level. No disabled capability or fixture closes the advertised memory promise. |

### 35.14 Additional use cases

| ID | Scenario | Expected behavior | Gates |
|---|---|---|---|
| HMUC-001 | Remember a reviewed language preference | It becomes personal memory only after canonical approval; a later authorized thread recalls its source. | HM-02, HM-05, HM-06, HM-09 |
| HMUC-002 | Recall before an account meeting | Return scoped current commitments with sources, not a reconstructed transcript. | HM-06, HM-07 |
| HMUC-003 | Unverified budget in a summary | Preserve provisional status and currency; do not promote an extraction to confirmed budget. | HM-02, HM-07 |
| HMUC-004 | Same user on two devices | Same permitted personal bank; two devices do not produce independent conflicting identities. | HM-03, HM-09 |
| HMUC-005 | Agent renamed | Stable ID and scope survive; the new display name never grants additional sources. | HM-09 |
| HMUC-006 | Different agent with private context | Do not share private agent history unless explicitly authorized. | HM-03, HM-09 |
| HMUC-007 | Dust asks for permitted meeting context | Use the existing governed endpoint; return real evidence and freshness. | HM-06, HM-10 |
| HMUC-008 | Dust corrects a commitment | Canonical CAS then invalidation/reprojection, not direct edits in generated memory. | HM-05, HM-08, HM-10 |
| HMUC-009 | Published skill uses memory | Version and source scope pinned; runtime respects audience and budget. | HM-09, HM-10, HM-11 |
| HMUC-010 | Employee revoked during recall | Withhold all late results and block the scope at the trusted boundary. | HM-03, HM-08 |
| HMUC-011 | Source deleted during retain | In-flight write cannot publish or resurrect it; reconciliation remains pending until proved. | HM-05, HM-08 |
| HMUC-012 | Mental model not flagged stale after deletion | Explicit dependency invalidation hides the derived answer despite upstream flag. | HM-07, HM-08 |
| HMUC-013 | Out-of-order source revision | Older worker cannot replace newer projection or source. | HM-05 |
| HMUC-014 | Duplicate outbox event | No duplicate retained document or duplicate usage settlement; genuine retries billed separately. | HM-05, HM-11 |
| HMUC-015 | Server confirms retain but search lags | Show sync pending; do not claim memory ready from HTTP 200. | HM-05, HM-13 |
| HMUC-016 | Memory provider unavailable | Show unavailable; exact actions still work and no-memory answer discloses missing history. | HM-06, HM-12, HM-14 |
| HMUC-017 | User selects an ephemeral interaction | No hidden retain, feedback training or summary projection for that interaction. | HM-02, HM-04, HM-13 |
| HMUC-018 | User selected local-only processing | Do not call remote memory, embeddings, reranker or reflection. | HM-02, HM-04 |
| HMUC-019 | Cloudflare gateway body logging drifts | Block affected content route; preserve operational metadata incident only. | HM-04, HM-14 |
| HMUC-020 | Worker payload holds approved content | Enforce finite terminal retention and explicit stuck-job cleanup; no raw transcript in task payload. | HM-04, HM-14 |
| HMUC-021 | Prompt injection embedded in a memory | Treat as quoted evidence; no tool, bank, policy, secret or skill permission change. | HM-03, HM-07, HM-14 |
| HMUC-022 | Untagged and fuzzy matches | No private recall via empty or fuzzy security scope; strict matching and bank identity enforced. | HM-03, HM-06 |
| HMUC-023 | Mixed audience Teams meeting | Use only sources permitted to the output audience, not organizer-private context. | HM-03, HM-10 |
| HMUC-024 | Hard date filter | Exclude canonical records outside the requested period even if semantic recall ranks them. | HM-06, HM-12 |
| HMUC-025 | Multilingual proper name and negation | Preserve original text and meaning; aliases cannot merge unrelated canonical people. | HM-02, HM-06, HM-12 |
| HMUC-026 | Embedding model changed, same dimensions | Treat as a new vector space; generation rebuild and qualification, not in-place mixing. | HM-14, HM-15 |
| HMUC-027 | Memory inference incurs background costs | Count actual stage attempts; no free-memory or double-counted nested-total claim. | HM-11 |
| HMUC-028 | Unknown token counts | Leave missing fields null and basis visible; never invent exact totals. | HM-11 |
| HMUC-029 | Privacy-safe source text disabled | Document text and raw chunk expansion unavailable; canonical authorized view provides evidence. | HM-04, HM-06 |
| HMUC-030 | Restore a pre-deletion backup | Tombstones/ACL epochs reapplied before serving; no resurrection. | HM-08, HM-14 |
| HMUC-031 | Simple “open Notes” command | No obligatory memory/reflection step; retained context never substitutes a fresh target. | HM-12, HM-16 |
| HMUC-032 | Final Windows and native Mac journey | Actual live retain/recall/correct/forget/portal flow on identified artifacts and services. | HM-16 |

### 35.15 Mandatory integrated memory journeys

**HM-FLOW-01 — Remember and reuse.** Actual authorized Windows user approves a preference → canonical save with revision → real Hindsight retain/index proof → quit/restart or new authorized session → recall with current source → Métis applies only the preference allowed for this task → portal reconciles actual memory attempts. Repeat on native Mac and a second device; user identity is stable, device identity distinct.

**HM-FLOW-02 — Meeting to team knowledge.** Real qualified capture → Cloudflare transcript → reviewed approved summary (not raw retain) → scoped canonical memory → authorized Dust agent reads with citations → Dust proposes/corrects through canonical service → a published server skill uses the new revision. Another principal and a wider Teams audience cannot receive the restricted source.

**HM-FLOW-03 — Forget under concurrency.** Start recall/reflect/retain work → delete or revoke the source mid-flight → existing read leases invalidate → no late answer or memory publication → upstream document/derivative purge reconciles → old backup/cached agent cannot resurrect it. Prove behavior even when the Hindsight stale flag remains false.

**HM-FLOW-04 — Honest outage and limits.** Interrupt memory service, provider, DB, telemetry settlement and network separately → display the correct state → stop always works locally → no silent third-party fallback or optional local install → exact deterministic actions still work → replay only safe metadata-referenced work with budget and revision checks.

**HM-FLOW-05 — Security and privacy.** Attempt foreign bank IDs, empty/fuzzy scopes, injected directives, malformed responses, raw transcripts, forbidden source types, disabled consent and source text in diagnostics → gates reject before leakage. Actual deployed readback and sink inspection cover successful/error/background paths. No-content claims remain route-specific; approved derived memory retention is disclosed.

**HM-FLOW-06 — Release.** Qualify the exact signed Windows candidate against the identified private service and database version; validate cross-client protocol compatibility, updates and rollback. Repeat native Mac engineering qualification without inventing Apple distribution credentials. Record real Fable independent review of source/failure evidence and keep all unrun gates explicit.

### 35.16 Implemented components and honest boundary

`memory/src/hindsight-client.mjs` implements actual HTTP request/response handling for version privacy flags, retain, recall, reflect, source-text privacy readback and document deletion. `memory/src/memory-gateway.mjs` implements orchestration using required trusted Métis identity, canonical store, fencing and ledger interfaces. `memory/deploy/profile-check.mjs` rejects unsafe/incomplete configuration profiles. `memory/live-smoke.mjs` can call a real approved test service only after explicit synthetic-write and cost authorization.

Read `memory/BINDINGS.md` before wiring these modules. Their included tests exercise actual module logic with controlled transports and fixture bindings; they are not deployed Entra, PostgreSQL, MCP, Hindsight, Windows or Swift tests. The configuration template intentionally has unfilled image/region and unapproved providers, so it fails until real setup is complete. There is no fake working deployment.

The application routes, durable registry/outbox/fences, real mental-model lifecycle, frontend bindings, actual supplier approvals and native/service E2E remain Codex implementation tasks in the real checkout. Do not copy fixture authority, synthetic UI data, test timeouts or unexecuted receipts as production. The missing pieces are explicitly assigned in HMSTEP-01–16; the integration is not finished merely because transport tests are green.

### 35.17 References and source precedence

**HS-R01 — Hindsight product and memory model**

https://hindsight.vectorize.io/

Retain, recall, and reflect are different operations; vendor benchmark claims are not Métis results.

**HS-R02 — HTTP API, observed documentation version 0.10.1**

https://hindsight.vectorize.io/api-reference

Wire schemas, endpoint paths, version feature flags, operation status, mental-model deletion caveat.

**HS-R03 — Configuration**

https://hindsight.vectorize.io/developer/configuration

Persistence, traces, authentication, inference stages, model compatibility and configuration readback.

**HS-R04 — Retain guide**

https://hindsight.vectorize.io/developer/api/retain

Document replacement and extraction scopes. Resolve apparent text-retention contradiction against configuration and actual deployed behavior.

**HS-R05 — Recall guide**

https://hindsight.vectorize.io/developer/api/recall

Bounded recall and exact versus permissive tag modes. Tags are not authentication.

**HS-R06 — Document lifecycle**

https://hindsight.vectorize.io/developer/api/documents

Original text access, replacement and document deletion; no implication of complete derivative erasure.

**HS-R07 — Operations**

https://hindsight.vectorize.io/developer/api/operations

Background job states and retention, including payload-bearing terminal operation rows.

**HS-R08 — Extensions and tenant resolution**

https://hindsight.vectorize.io/developer/extensions

Builtin API-key tenancy and custom tenant resolution are not existing Métis Entra/record permissions.

**HS-R09 — Installation and production hosting**

https://hindsight.vectorize.io/developer/installation

Dedicated service plus supported PostgreSQL; development embedded database is not recommended for production.

**HS-R10 — Memory Defense**

https://hindsight.vectorize.io/developer/memory-defense

Pattern-based optional protection; not retroactive erasure or a complete semantic security boundary.

**HS-R11 — Node SDK**

https://hindsight.vectorize.io/sdks/nodejs

Official SDK option to evaluate against the existing dependency policy and the pinned service.

**HS-R12 — Repository source pin**

https://github.com/vectorize-io/hindsight/tree/b88458fd6b96e70069238f7df5a0e2f1c3c9240c

Main ref observed through GitHub connector. This is not a production release image digest or a complete source audit.

**HS-R13 — Runtime memory-budget source note**

https://github.com/vectorize-io/hindsight/blob/b88458fd6b96e70069238f7df5a0e2f1c3c9240c/hindsight-docs/blog/2026-08-27-retain-memory-budget.md

The original_text persistence is acknowledged by upstream source documentation.

**HS-R14 — Service architecture**

https://hindsight.vectorize.io/developer/services

API/worker separation and PostgreSQL-backed state and tasks.

The canonical project source and current observed implementation must be reconciled first. Primary Hindsight sources describe their product; the surrounding security, storage, UX, performance budgets, rollout and Métis integration are **our engineering decisions**. Apparent documentation conflicts are recorded in the source review, not silently resolved in favor of a convenient claim. Preserve r10's complete contract and collaboration rules, except this explicit memory addition and its synchronized implementation details.
