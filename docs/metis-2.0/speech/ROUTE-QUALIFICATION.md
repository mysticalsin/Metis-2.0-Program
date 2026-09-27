# Metis 2.0 speech route qualification

| Field | Evidence record |
|---|---|
| Ticket | OBSERVED: M2-0102 |
| Task | OBSERVED: TASK-011 |
| Requirement | OBSERVED: M2-PRIV-02 |
| Decisions | OBSERVED: D-11 and D-12 are answered in [POLICY-2.0.md](../POLICY-2.0.md). |
| Date | OBSERVED: 2026-09-27 |
| Reviewer |  |
| Review date | OBSERVED: 2026-09-27. DERIVED: this is a point-in-time qualification because Cloudflare and Deepgram terms, features, and account regimes are mutable. DERIVED: this record must be rechecked before any GA privacy claim under MASTER.md §16.6.5. |

## Scope

- OBSERVED: [POLICY-2.0.md](../POLICY-2.0.md) records D-11 as "Cloudflare via Operator" and D-12 as "Metadata-only"; this file records the underlying route evidence rather than restating the policy answer.
- OBSERVED: MASTER.md §9.3 requires qualification of the selected Cloudflare model against current official API/version, language, residency, retention, diarization, vocabulary, streaming, outage, and cost evidence.
- OBSERVED: MASTER.md §9.6 sets the launch speech baseline as Cloudflare-hosted `@cf/deepgram/nova-3` over its qualified real-time transport and requires distinguishing `workers-ai/@cf/deepgram/nova-3` from provider-native Deepgram BYOK.
- OBSERVED: MASTER.md §16.6.1 requires an evidence record for each enabled speech route and says Cloudflare-hosted Workers AI must be qualified separately from provider-native BYOK or Unified Billing.
- OBSERVED: M2-0102 limits this ticket's `scope_paths` to `docs/metis-2.0/speech/ROUTE-QUALIFICATION.md`.

## Exact model, endpoint, transport

- OBSERVED: mysticalsin/AskToto-Mantu `m2/integration` commit `6aa8cb36b8c0bfddfb5a364d300d3fb74b635245`, `src/main/cloud-stt/adapter.ts:32`, defines `CLOUDFLARE_NOVA3_MODEL = '@cf/deepgram/nova-3'`.
- OBSERVED: `src/main/cloud-stt/adapter.ts:177-217` builds `wss://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayId}/workers-ai?model=@cf/deepgram/nova-3&encoding=linear16&sample_rate=16000&interim_results=...&diarize=...&language=...&detect_language=...`.
- OBSERVED: `src/main/cloud-stt/live-session.ts:247-274` opens the WebSocket for `provider === 'cloudflare-nova3'` with `headers: { 'cf-aig-authorization': \`Bearer ${creds.token}\` }`.
- OBSERVED: `src/main/cloud-stt/live-session.ts:247-274` sends only the `cf-aig-authorization` header on the WebSocket handshake; no `cf-aig-collect-log`, `cf-aig-collect-log-payload`, or `cf-aig-skip-cache` header is sent.
- OBSERVED: `src/shared/ipc.ts:1169` allows `cloudSttProvider` values `cloudflare-nova3`, `soniox`, and `unconfigured`, and `src/shared/ipc.ts:1700` defaults that setting to `unconfigured`.
- OBSERVED: `src/shared/cloud-stt-provider.ts:18-23` names `DEFAULT_CLOUD_ONLY_STT_PROVIDER = 'cloudflare-nova3'`, and the supplied evidence says `effectiveCloudSttProvider()` resolves `unconfigured` to `cloudflare-nova3` only under a managed CLOUD_ONLY profile while legacy or unmanaged profiles remain `unconfigured`.
- DERIVED: the qualified route is the cloud-only managed-profile route observed today, while the broader D-11 target state still requires the broker-only default migration recorded in [POLICY-2.0.md](../POLICY-2.0.md).
- OBSERVED: Cloudflare's Nova-3 Workers AI model page lists partner, batch, and real-time support for `@cf/deepgram/nova-3`, with unit pricing of `$0.0052/audio-minute` for batch and `$0.0092/audio-minute` for WebSocket.
- OBSERVED: Cloudflare's AI Gateway real-time WebSocket page documents the same live route shape for Deepgram over Workers AI: `wss://gateway.ai.cloudflare.com/v1/<account_id>/<gateway>/workers-ai?model=@cf/deepgram/nova-3&encoding=linear16&sample_rate=16000&interim_results=true`, authenticated with `cf-aig-authorization`.
- DERIVED: the observed product code uses Cloudflare's documented Workers AI WebSocket route for `@cf/deepgram/nova-3`; the endpoint host, account/gateway path, `workers-ai` provider segment, model id, audio encoding, sample rate, and authorization header match the primary source.

## Workers AI vs. direct Deepgram vs. BYOK vs. Unified Billing

- OBSERVED: the product route is the Workers-AI-hosted Nova-3 route because the code uses the AI Gateway `/workers-ai` WebSocket path and the model id `@cf/deepgram/nova-3`.
- OBSERVED: Cloudflare's Workers AI data-use page says Workers AI inputs, outputs, embeddings, and training data are Customer Content; Cloudflare does not make Customer Content available to other Cloudflare customers; Cloudflare does not use Workers AI Customer Content to train Workers AI models or improve Cloudflare or third-party services unless it has explicit consent; Workers AI Customer Content may be stored by Cloudflare if a storage service such as R2, KV, Durable Objects, or Vectorize is used with Workers AI.
- DERIVED: the Workers-AI-hosted route is governed, from the public sources reviewed, by Cloudflare's Workers AI Customer Content policy rather than by Deepgram's direct-service Model Improvement Program terms or by Unified Billing ZDR.
- OBSERVED: Deepgram's direct-service data page says direct requests participate in Deepgram's Model Improvement Program by default and may be retained for model improvement; `mip_opt_out=true` opts a direct request out so Deepgram does not retain audio, text, transcripts, or synthesized audio after the response; metadata and usage logs remain recorded and retrievable for 90 days, with summarized usage retained beyond 90 days.
- DERIVED: direct or BYOK Deepgram is not the product route qualified here, and Deepgram-native regional endpoints are not evidence of residency for Cloudflare's Workers-AI-hosted route.
- OBSERVED: Cloudflare's Unified Billing page says ZDR applies only to Unified Billing requests using Cloudflare-managed credentials, does not apply to BYOK or other AI Gateway requests, does not control AI Gateway logging, and Workers AI requests do not use provider credentials in that setting's sense.
- DERIVED: Unified Billing ZDR is out of scope for this Nova-3 Workers AI route by the feature's own documented boundary, not merely unverified.
- DERIVED: MASTER.md §16.6.1 is correct to warn that generic Unified Billing ZDR must not be treated as universal proof for Nova-3 and that an unsupported-ZDR fallback is prohibited.
- OBSERVED: Cloudflare's Nova-3 parameter schema lists `mip_opt_out` as a boolean and describes it as opting requests out of Deepgram's Model Improvement Program, with a pricing-impact note.
- UNKNOWN: no Cloudflare page reviewed states what effect `mip_opt_out` has, or whether it is honored identically, when `@cf/deepgram/nova-3` is called through the Workers-AI-hosted route rather than Deepgram's own API.

## Service/model terms

- OBSERVED: Cloudflare's Nova-3 model page links "Terms and License" to `https://deepgram.com/terms`.
- OBSERVED: Cloudflare's Workers AI data-use page references Cloudflare's Self-Serve Subscription Agreement and Enterprise Subscription Agreement as Cloudflare terms for Workers AI.
- UNKNOWN: Mantu's actual Cloudflare contract type is not established by the public documents reviewed, so whether Self-Serve terms, Enterprise terms, or an account-specific order form controls cannot be determined from this evidence record alone.
- DERIVED: supplier/privacy review must use the active Mantu Cloudflare agreement and any AI-specific addendum before treating this route as ready for a GA privacy claim.

## Geographic constraints

- UNKNOWN: none of the reviewed Cloudflare pages for Nova-3, Workers AI data use, AI Gateway logging, WebSockets, caching, or Unified Billing states a region or residency guarantee for the Workers-AI-hosted Nova-3 route specifically.
- OBSERVED: Deepgram documents regional-endpoint residency controls for Deepgram's own service endpoints.
- DERIVED: Deepgram's direct-service residency controls must not be assumed to transfer to Cloudflare's hosting of the same model weights.
- UNKNOWN: no primary source reviewed commits to a data-processing region for this Workers-AI-hosted Nova-3 route.

## Logging, caching, and the retention gap between HTTP and WebSocket

- OBSERVED: Cloudflare's AI Gateway logging page says logs are enabled by default for each gateway and that the setting applies to all requests unless a request overrides it.
- OBSERVED: the AI Gateway logging page documents `cf-aig-collect-log` and `cf-aig-collect-log-payload` as HTTP request headers; when payload logging is off, metadata such as model, status, tokens, cost, and duration is still logged.
- OBSERVED: Cloudflare's Worker binding methods page documents `env.AI.run(model, input, { gateway: { skipCache, cacheTtl, cacheKey, collectLog, metadata } })`; this is a Worker binding options object for a Cloudflare Worker calling `env.AI.run()`.
- OBSERVED: Cloudflare's caching page documents `cf-aig-skip-cache`, `cf-aig-cache-ttl`, and `cf-aig-cache-key` as HTTP request headers, with legacy aliases `cf-skip-cache` and `cf-cache-ttl`.
- OBSERVED: Cloudflare's real-time WebSocket page documents WebSocket examples for OpenAI, Google, Cartesia, ElevenLabs, Fal AI, and Deepgram/Workers AI, and the supplied evidence says none of those examples attach `cf-aig-collect-log`, `cf-aig-collect-log-payload`, `cf-aig-skip-cache`, or an equivalent WebSocket control.
- DERIVED: Cloudflare documents per-request logging and caching controls for HTTP-style requests and for the `env.AI.run()` binding path, but the reviewed WebSocket documentation does not document an equivalent control for the real-time WebSocket handshake.
- OBSERVED: the product's live Nova-3 session uses the raw AI Gateway WebSocket route and sends only `cf-aig-authorization`.
- DERIVED: no per-session or per-WebSocket-connection log/cache override is sent by the current live Nova-3 product code, and no reviewed Cloudflare WebSocket page shows such an override as supported.
- DERIVED: the only observed product lever over logging/caching for the live speech route is the AI Gateway gateway-level default for the `default` gateway, which `verifyDefaultGatewayPrivacy()` reads back.
- OBSERVED: `operator/src/ai-gateway.ts:6` sets `DEFAULT_AI_GATEWAY_ID = 'default'`.
- OBSERVED: `operator/src/ai-gateway.ts:53-69` requires the `default` AI Gateway to read back `collect_logs === false`, `cache_ttl === 0`, `logpush === false`, absent or empty `otel`, and absent or false `log_classification`, otherwise it throws `GATEWAY_CONFIGURATION_UNSAFE`.
- OBSERVED: `operator/src/ai-gateway.ts:113` performs `GET https://api.cloudflare.com/client/v4/accounts/{id}/ai-gateway/gateways/default`.
- OBSERVED: `operator/src/keys.ts:71-91,112,164,228` runs `verifyDefaultGatewayPrivacy()` only when an operator or admin pastes or rotates a Cloudflare credential into the Operator vault.
- OBSERVED: no call site is identified in `src/main/cloud-stt/**` that re-verifies gateway configuration before a live Nova-3 WebSocket session opens.
- DERIVED: content-retention safety for the live speech transport rests entirely on a gateway-level configuration that is verified only when a credential is pasted or rotated, with no additional per-session gate today.
- DERIVED: MASTER.md §16.6.3 requires verifying the actual effect of controls on the selected real-time WebSocket handshake and frame handling; that verification does not yet exist for the WebSocket path and remains open.
- OBSERVED: `operator/src/use.ts:240` returns `{ 'cf-aig-collect-log-payload': 'false', 'cf-aig-skip-cache': 'true' }`, and `operator/src/use.ts:344` sends `cf-aig-gateway-id: 'default'` plus that header set.
- DERIVED: `operator/src/use.ts` is the Operator HTTP ask/screenshot/Jev inference path, not the Nova-3 live speech WebSocket path, so its HTTP headers are not evidence that the live speech WebSocket sends or supports the same controls.
- OBSERVED: Cloudflare's Legacy Logs page says Legacy Logs applies only to AI Gateway customers who created a gateway before 2026-09-24, and that customers whose first gateway was created on or after 2026-09-24 use current AI Gateway logging.
- OBSERVED: Cloudflare's Legacy Logs page says Legacy Logs persist "until you delete them"; plan limits include Free 100,000 logs across all gateways, Paid 10 million logs per gateway, and 10 MB per log.
- ASSUMED: the newer-regime Workers Logs 7-day maximum retention claim is inherited from [POLICY-2.0.md](../POLICY-2.0.md) [S5] and was not re-verified in this pass.
- UNKNOWN: which regime the Mantu account's `default` gateway is actually in is unknown without an account readback.

## Supplier assurance and unresolved entitlement issues

| Status | Item | Required owner step |
|---|---|---|
| BLOCKED_EXTERNAL | Whether the Mantu Cloudflare account's Workers AI entitlement for `@cf/deepgram/nova-3` carries any account-specific data-use addendum beyond the public Customer Content policy, such as an Enterprise agreement rider. | Confirm the Workers AI `@cf/deepgram/nova-3` entitlement and data-use terms on the Mantu Cloudflare account and provide a read-only readback of the AI Gateway log/cache settings. The account owner reviews the account's active Cloudflare subscription agreement/order form for any AI-specific addendum, without changing any configuration. Owner: Cloudflare account owner (Mantu IT; person to be named by program owner). Needed by: 2026-10-12. |
| BLOCKED_EXTERNAL | Whether the account's `default` AI Gateway was created before or after 2026-09-24 and whether its current dashboard settings have Logs and Caching disabled. | Confirm the Workers AI `@cf/deepgram/nova-3` entitlement and data-use terms on the Mantu Cloudflare account and provide a read-only readback of the AI Gateway log/cache settings. Verification item: Readback of the account's AI Gateway settings (owner-authorized, read-only). The account owner performs a read-only readback of the AI Gateway dashboard Settings tab for the `default` gateway, including Logs toggle, Caching toggle, and creation date, with no configuration change. Owner: Cloudflare account owner (Mantu IT; person to be named by program owner). Needed by: 2026-10-12. |
| UNKNOWN | Whether Cloudflare forwards `mip_opt_out` to Deepgram with the same retention effect Deepgram documents for its own direct API when the request instead comes through the Workers-AI-hosted route. | No reviewed document states this either way. |
| UNKNOWN | The Mantu account's actual data-processing region for this route. | No reviewed primary source commits to a Workers-AI-hosted Nova-3 processing region. |
| DERIVED | No per-session or per-WebSocket-connection gateway-configuration verification exists in the current code path for live Nova-3 speech. | This is an in-repo design gap to track separately; no code change is made in this documentation-only ticket. |
| DERIVED | The device today still holds a raw Cloudflare account token locally because `src/main/index.ts:~6617` supplies `cloudflareToken: getApiKey('cloudflare')`. | This is the same already-tracked D-11 "Gap today" recorded in [POLICY-2.0.md](../POLICY-2.0.md), and the observed commit has not implemented the broker-only target state. |

- DERIVED: No generic Zero Data Retention assumption is made for Nova-3.
- DERIVED: the reason is the "Workers AI vs. direct Deepgram vs. BYOK vs. Unified Billing" finding that Unified Billing ZDR is outside this Workers AI route by definition and that AI Gateway logging is a separate control.

## Sources

| ID | Source | Evidence used |
|---|---|---|
| [A] | https://developers.cloudflare.com/workers-ai/models/nova-3/ retrieved 2026-09-27 | OBSERVED: Nova-3 model id, partner/batch/real-time support, pricing, Terms and License link, and `mip_opt_out` schema field. |
| [B] | https://developers.cloudflare.com/workers-ai/platform/data-usage/ retrieved 2026-09-27 | OBSERVED: Workers AI Customer Content policy, no cross-customer sharing, no training or service-improvement use without explicit consent, and optional storage-service persistence. |
| [C] | https://developers.cloudflare.com/ai-gateway/observability/logging/ retrieved 2026-09-27 | OBSERVED: gateway logs enabled by default, HTTP logging override headers, and metadata behavior when payload logging is off. |
| [D] | https://developers.cloudflare.com/ai-gateway/usage/websockets-api/realtime-api/ retrieved 2026-09-27 | OBSERVED: real-time WebSocket route shape for Deepgram over Workers AI and `cf-aig-authorization` authentication. |
| [E] | https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/ retrieved 2026-09-27 | OBSERVED: Worker binding gateway options for `env.AI.run()`, including `skipCache` and `collectLog`. |
| [F] | https://developers.cloudflare.com/ai-gateway/features/caching/ retrieved 2026-09-27 | OBSERVED: HTTP cache-control request headers and legacy aliases. |
| [G] | https://developers.cloudflare.com/ai-gateway/features/unified-billing/ retrieved 2026-09-27 | OBSERVED: Unified Billing ZDR scope, exclusion of BYOK and other AI Gateway requests, separation from AI Gateway logging, and Workers AI provider-credential boundary. |
| [H] | https://developers.deepgram.com/trust-security/your-data retrieved 2026-09-27 | OBSERVED: direct Deepgram MIP default, `mip_opt_out=true` behavior for direct requests, metadata/usage retention, and Deepgram-native residency controls. |
| [I] | https://developers.cloudflare.com/ai-gateway/observability/logging/legacy-logs/ retrieved 2026-09-27 | OBSERVED: Legacy Logs cutoff, persistence until deletion, and plan limits. |
| [J] | [docs/metis-2.0/POLICY-2.0.md](../POLICY-2.0.md) | OBSERVED: D-11, D-12, M2-0102 consequence, D-11 gap today, D-12 metadata-only policy, and inherited [S5] Workers Logs retention claim. |
| [K] | [docs/metis-2.0/kit/r11/spec/MASTER.md](../kit/r11/spec/MASTER.md) §9.3, §9.6, §16.6-§16.6.5, R16, R42-R48, R49-R51, R87 | OBSERVED: normative route qualification, default route, route distinction, controls, proof, supplier-boundary, and privacy-language requirements. |
| [L] | [docs/metis-2.0/ledger/tickets.json](../ledger/tickets.json) id `M2-0102` | OBSERVED: ticket scope, acceptance criteria, verification item, and external blocker owner/unblock date. |
| [M] | mysticalsin/AskToto-Mantu `m2/integration` commit `6aa8cb36b8c0bfddfb5a364d300d3fb74b635245`: `src/main/cloud-stt/adapter.ts:32`, `src/main/cloud-stt/adapter.ts:177-217`, `src/main/cloud-stt/live-session.ts:247-274` | OBSERVED: product model constant, WebSocket URL construction, and single-header handshake. |
| [N] | mysticalsin/AskToto-Mantu `m2/integration` commit `6aa8cb36b8c0bfddfb5a364d300d3fb74b635245`: `src/main/cloud-stt/credentials.ts:13`, `src/main/cloud-stt/credentials.ts:88-119`, `src/main/index.ts:~6617`, `src/shared/ipc.ts:1169`, `src/shared/ipc.ts:1700`, `src/shared/cloud-stt-provider.ts:18-23` | OBSERVED: default gateway id, local token/account/gateway credential resolution, local raw token source, unconfigured default, and managed CLOUD_ONLY effective provider behavior. |
| [O] | mysticalsin/AskToto-Mantu `m2/integration` commit `6aa8cb36b8c0bfddfb5a364d300d3fb74b635245`: `operator/src/ai-gateway.ts:6`, `operator/src/ai-gateway.ts:53-69`, `operator/src/ai-gateway.ts:113`, `operator/src/keys.ts:71-91,112,164,228` | OBSERVED: `default` gateway privacy readback requirements and vault-write timing for verification. |
| [P] | mysticalsin/AskToto-Mantu `m2/integration` commit `6aa8cb36b8c0bfddfb5a364d300d3fb74b635245`: `operator/src/use.ts:149`, `operator/src/use.ts:240`, `operator/src/use.ts:344` | OBSERVED: separate Operator HTTP ask/screenshot path headers and gateway id usage. |
