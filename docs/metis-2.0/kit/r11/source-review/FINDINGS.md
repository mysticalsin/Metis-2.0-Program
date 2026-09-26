# Source reconciliation · Métis 1.9.5 export → 2.0

**Status:** targeted source review and computed export inventory. Not an exhaustive line-by-line audit, deployed-system check or product pass.

The 24 findings below preserve existing controls and add concrete implementation work. Source defects, design conflicts, input limitations and unverified operational dependencies are different categories. No missing export section is called a missing repository file.

## SRC-01 · Do not mistake a source export for a complete checkout
**P0** · INPUT_LIMITATION · TASK-001, TASK-002, TASK-003, TASK-066**

**Observed:** The export contains 1,521 FILE sections and package version 1.9.5. Five of the 19 file-backed nodes in the supplied map have no source section: renderer App.tsx, main index.ts, renderer lib/listen.ts, main/transcripts.ts and main/brain/ingest.ts. Imports and tests mention them; that does not recover their contents. The filename suffix is not an established Git commit.

**Implement:** Acquire the authorized real checkout and its commit/dirty state. Compare source hashes before using anchors. Preserve the export as historical evidence; never generate stub replacements or run an incomplete reconstructed app as the baseline.

**Proof:** Exact checkout/branch identity and a missing-versus-present source manifest; baseline checks on the complete tree, with every skipped suite explained.

**Source sections:** `package.json` (export lines 2697–2833)

## SRC-02 · Separate entitlement authority from telemetry and legacy licensing
**P0** · ARCHITECTURE_GAP · TASK-002, TASK-005, TASK-006, TASK-014, TASK-034, TASK-045, TASK-062, TASK-063**

**Observed:** The map separates a license service but omits the consumer edges. Operator has issued-license/seat records, while the legacy service has a serialized JSON store and a separately configured offline lease key. The legacy module describes compiled-off UI gates; the corresponding current renderer files are absent, so actual gate enablement is not established.

**Implement:** Choose one issuer/entitlement authority for each active distribution profile. Entra authenticates identity; a signed license or lease grants only its exact entitlement; telemetry supplies neither identity proof nor permission. Reconcile legacy and Operator IDs without switching on conflicting gates. Production rejects development trust roots. Preserve recovery/export access when paid inference is unavailable.

**Proof:** Activation, renewal, revoke, expired/clock-skewed lease, duplicated device, reinstall, entitlement loss, two-user isolation and cross-process seat-cap races on the actual chosen store. JSON mutex cannot be represented as a distributed lock.

**Source sections:** `operator/src/store.ts` (export lines 63381–64220); `license-server/lib/store.mjs` (export lines 32541–32683); `src/main/license.ts` (export lines 125889–126239); `src/main/license-lease-key.ts` (export lines 124721–124809)

## SRC-03 · Apply the Jev decision instead of discarding it
**P0** · SOURCE_DEFECT · TASK-005, TASK-031, TASK-032, TASK-033, TASK-040, TASK-056**

**Observed:** maybeDisambiguate awaits a successful result then executes void result. It therefore does not apply that decision to the plan in this function.

**Implement:** Validate the returned choice against the exact submitted candidate set, utterance revision, source generation and policy. Apply it through the same deterministic preview/approval path. Retain a useful no-provider deterministic route.

**Proof:** Actual entitled Jev and independent Laya requests affect eligible action and Intelligence results; stale, incompatible, forged and out-of-candidate responses have no side effects.

**Source sections:** `src/main/metis-command-runtime.ts` (export lines 129196–129396)

## SRC-04 · Execution result and exception handling must control completion
**P0** · SOURCE_DEFECT · TASK-005, TASK-019, TASK-033, TASK-056, TASK-063**

**Observed:** flushPending awaits executeDesktopAction but ignores the returned ok/outcome before mark_committed. A test on unsupported Linux expects a committed action; this proves bookkeeping, not successful desktop control. A rejected execution can also re-enter flushPending from finally while pending remains.

**Implement:** Separate dispatch acceptance, attempted side effect, verified completion and unknown outcome. Consume every result and caught exception. Quarantine an uncertain non-idempotent attempt until reconciliation. Retry only bounded classified safe failures; stop must prevent further dispatch.

**Proof:** Adapters returning failed, unsupported, unknown, cancelled or throwing never produce verified success. A rejected or timed-out write cannot create an unbounded retry loop or duplicate note.

**Source sections:** `src/main/metis-command-runtime.ts` (export lines 129196–129396); `src/main/metis-command-runtime.test.ts` (export lines 129042–129189)

## SRC-05 · Exact note, camera and close operations need real adapters
**P0** · SOURCE_DEFECT · TASK-019, TASK-029, TASK-033, TASK-056, TASK-065**

**Observed:** The six-action catalog does not supply general close-app/tab behavior. Windows create-note only launches Notepad and photo capture only opens Camera. Mac note creation removes quotes/backslashes and interpolates changed text into AppleScript; most adapters return unknown.

**Implement:** Implement graceful scope-aware close, exact parameterized text, object identity and postcondition reads. Separate camera preview from shutter permission and resulting file. Reuse actual installed application capabilities; no arbitrary scripts or silent substitute.

**Proof:** Unicode, quotes, backslashes, newlines, missing app, unsaved work, changed focus, camera-busy and repeated intentional actions produce correct real objects or explicit unsupported/unknown results.

**Source sections:** `src/main/desktop-adapters.ts` (export lines 116965–117179); `src/shared/desktop-actions.ts` (export lines 226587–226673)

## SRC-06 · Text matching is not wake-word capture
**P0** · IMPLEMENTATION_LIMIT · TASK-005, TASK-017, TASK-018, TASK-019, TASK-033, TASK-053**

**Observed:** The wake helper tests a regular expression against already recognized text. stripWakeWord returns the normalized, lowercased, punctuation-stripped string; it does not preserve the original payload span.

**Implement:** Qualify a compact acoustic wake detector behind explicit opt-in and the single capture owner. Keep the original command text/spans separate from normalized matching. No ambient cloud transcription to find the wake word and no meeting audio authority.

**Proof:** No pre-wake cloud frames; first words survive; exact accents/names/title punctuation survive matching; media replay, other speakers, quotations and false wakes are tested.

**Source sections:** `src/shared/metis-wake.ts` (export lines 232312–232359)

## SRC-07 · Speech credentials must move behind the session broker
**P0** · SOURCE_POLICY_CONFLICT · TASK-011, TASK-012, TASK-014, TASK-016, TASK-020, TASK-027, TASK-057**

**Observed:** The credential resolver requires a Cloudflare token/account on the desktop and the error text instructs users to supply an account API token in Settings; an empty gateway uses default.

**Implement:** Replace the centrally funded path with authenticated session grants and server-held credentials. Keep optional personal-key routes explicitly classified rather than silently using them. Remove obsolete onboarding and error instructions.

**Proof:** A new eligible user completes actual speech without an organizational account credential on the device. Revoked or wrong-scope grants fail before upstream audio.

**Source sections:** `src/main/cloud-stt/credentials.ts` (export lines 164992–165111)

## SRC-08 · Gateway creation cannot certify privacy readiness
**P0** · SOURCE_POLICY_CONFLICT · TASK-011, TASK-012, TASK-013, TASK-014, TASK-016, TASK-020, TASK-057, TASK-062**

**Observed:** ensureDefaultAiGateway posts only id/name, does not inspect the HTTP result, and ignores exceptions. The separate proxy forwards chat requests and returns no-store, but that response header does not establish disabled upstream payload logging or response caching.

**Implement:** Use a named reviewed sensitive-route configuration and explicit readback before protected traffic. Separate chat-only proxy, Operator funding and real-time speech routes. Never auto-create an unreviewed gateway or infer privacy from a successful vault save.

**Proof:** Failure, existing gateway, unsupported WS controls and drift leave privacy readiness blocked; synthetic sentinels inspect every configured controlled sink while usage metadata still settles.

**Source sections:** `operator/src/ai-gateway.ts` (export lines 49837–49864); `cloudflare-proxy/src/index.ts` (export lines 4331–4752)

## SRC-09 · Legacy embedded credentials and pilot profiles must not leak into 2.0
**P0** · SOURCE_POLICY_CONFLICT · TASK-002, TASK-012, TASK-014, TASK-023, TASK-026, TASK-027, TASK-063**

**Observed:** Packaging has opt-in embedded credential resources; documentation permits a direct Cloudflare account-token shape. Cahê has a separate identity and deliberately embedded pilot key. Encryption with shipped decryption material is not secret isolation.

**Implement:** The enterprise 2.0 profile forbids reusable organizational credentials in every artifact. Migrate safely from explicit legacy choices, inventory existing exposure privately and rotate only through authorized operations. Do not merge the isolated pilot identity or feed into standard Métis.

**Proof:** Scan and inspect actual final archives/helpers/build outputs, then test two independently authenticated clients with server-only funding and per-device revocation. No private token appears in evidence.

**Source sections:** `electron-builder.yml` (export lines 2220–2550); `electron-builder.cahe.win.yml` (export lines 2154–2175); `docs/CLOUDFLARE.md` (export lines 5132–5394)

## SRC-10 · Preserve authoritative usage and complete aggregates
**P0** · SOURCE_DEFECT · TASK-015, TASK-018, TASK-034, TASK-045, TASK-056, TASK-062**

**Observed:** ownedAskUpsertSql overwrites update columns with excluded values for same-device collisions. Dashboard starts from listAsks(2000) and other limited detail lists. Both are concrete source risks; no production undercount was measured here.

**Implement:** Add provenance-aware monotonic/reconcilable usage merges and SQL aggregates independent of detail pagination. Preserve the existing cross-device ownership check. Distinguish logical operations, billable attempts and repeated event deliveries.

**Proof:** 120/30 survives a late null update; cumulative 1/15/30 is 30; 2,001 one-token attempts total 2,001; cross-device collision denied; rows/charts/export and exact windows reconcile.

**Source sections:** `operator/src/d1.ts` (export lines 53940–54876); `operator/src/dashboard.ts` (export lines 55447–56874)

## SRC-11 · Native persistence must not hide loss or retain forbidden transcripts
**P0** · SOURCE_DEFECT · TASK-005, TASK-007, TASK-027, TASK-029, TASK-035, TASK-054, TASK-058, TASK-065**

**Observed:** SwiftData stores full transcript linesData. Encoding failures become empty Data, decoding failures become [], and try? context.save() is followed by returning a StoredMeeting. The caller cannot infer a durable save from that return.

**Implement:** Use throwing or typed save results, transactional metadata and explicit readback. Preserve existing data through approved migrations and implement summary-only storage on native Mac as well as Electron. Distinguish corrupt data from an empty meeting; offer authorized recovery.

**Proof:** Inject disk-full, permission denial, encode/decode corruption, duplicate ID and save errors. No saved success or data-deleting empty fallback; no new raw transcript blob under summary-only policy.

**Source sections:** `native-app/App/Store/PersistedModels.swift` (export lines 35077–35138)

## SRC-12 · Native recording and long-session summaries require actual readiness
**P0** · IMPLEMENTATION_LIMIT · TASK-017, TASK-018, TASK-029, TASK-053, TASK-054, TASK-056, TASK-065**

**Observed:** The controller permits nil audio hooks and then sets isRecording=true; the comment calls this a test/prototype seam. It appends meeting lines and summarizes a tail. This does not establish capture readiness or complete long-meeting coverage.

**Implement:** Production injection must require a ready audio owner, explicit permission and a successful start result. Separate test drivers from production entry. Stream bounded evidence/summary state across the whole meeting, not only its last tail.

**Proof:** Missing hook/device/service yields unavailable, not recording. Early and late commitments in a two-hour fixture survive within measured memory limits and without durable raw audio.

**Source sections:** `native-app/MetisKit/Sources/MetisKit/MeetingController.swift` (export lines 35651–35747)

## SRC-13 · Speaker labels are not biometric identity or action authority
**P0** · SOURCE_POLICY_CONFLICT · TASK-007, TASK-017, TASK-018, TASK-029, TASK-053, TASK-057, TASK-058**

**Observed:** The source implements session clustering and describes persistent named voiceprints plus a Teams-VTT auto-enrollment path. This is materially different from per-meeting anonymous diarization. The reviewed excerpt does not prove which callsites are enabled in the deployed app.

**Implement:** Keep default attribution session-local and uncertain; use authenticated roster metadata only with qualified mapping. Disable unapproved persistent enrollment/voiceprint retention and audit legacy migration without destructive surprise. No speaker score authenticates desktop commands or employee performance.

**Proof:** Fresh default produces no persistent voiceprint; attribution errors, same names, off switch and data-rights deletion are tested. Authorized identity and local command authority remain separate.

**Source sections:** `src/main/speaker-id.ts` (export lines 146890–147476)

## SRC-14 · Use the real solving motion without defeating accessibility
**P1** · SOURCE_POLICY_CONFLICT · TASK-008, TASK-028, TASK-029, TASK-030, TASK-055, TASK-060, TASK-063**

**Observed:** DESIGN.md specifies the real 64-preset monochrome solving orb, without a label. BrandThinkingOrb deliberately keeps animating despite OS reduced motion, although it handles hidden/offscreen suspension. The previously delivered r6 kit made ARMED static; the owner has now explicitly changed that decision.

**Implement:** ARMED is one animated solving orb only. Qualify the installed library API and preserve its geometry, pixel density and motion, not a rotating PNG or improvised constellation. A shared MotionPolicy honors reduce/pause/energy/hidden states; no per-frame React state or microphone.

**Proof:** Time-separated frames and geometry checks prove the solver moves; reduced motion/offscreen/lock stop clocks; CSS and actual native hit regions stay compact. Test declared 41px host and 64 preset separately from the enlarged lab reference.

**Source sections:** `DESIGN.md` (export lines 1966–2147); `src/renderer/src/components/BrandThinkingOrb.tsx` (export lines 196646–196743); `package.json` (export lines 2697–2833)

## SRC-15 · Reconcile onboarding contract and recover the real media lineage
**P1** · DOCUMENT_AND_MIGRATION · TASK-001, TASK-002, TASK-008, TASK-024, TASK-026, TASK-027, TASK-030, TASK-063**

**Observed:** The export identifies the April-29 hero clip and a scripted Act2 product demo rather than one generic onboarding MP4. Older No Skip and auto-local-download instructions conflict with newer requirements for optional educational motion and cloud-first essentials. A referenced filename is not included media bytes.

**Implement:** Preserve the approved artistic lineage and required consent/identity checks; allow reduced/static educational presentation. Keep script-driven demonstration separate from real setup tests. Find the licensed actual hero/music assets in the real checkout; do not substitute the Jev desktop-control clip.

**Proof:** Next advances the actual visible scene once, first-frame fallback works offline, no orphan media continues after finish, and optional packs/video cannot block an otherwise usable cloud core.

**Source sections:** `DESIGN.md` (export lines 1966–2147); `docs/design/ONBOARDING-FLOW.md` (export lines 12217–12282); `src/renderer/src/lib/onboarding-hero-video.ts` (export lines 214551–214638)

## SRC-16 · Profile-aware package gates, OS descriptions and documentation must change together
**P0** · SOURCE_POLICY_CONFLICT · TASK-004, TASK-005, TASK-021, TASK-023, TASK-024, TASK-025, TASK-026, TASK-027, TASK-060, TASK-063**

**Observed:** Build/prepack paths provision local model/speech resources, package manifests copy them, and permission strings/docs describe on-device processing. Existing duplicate/foreign-runtime exclusions are useful optimizations and must remain.

**Implement:** Implement cloud-first/offline-selected/profile manifests from one capability catalog. Make fetch/build/inventory tests agree; do not remove safety checks to delete weights. Update localized OS permission strings and help/IT documentation to the effective route. Keep portable/no-auto-update and native channels explicit.

**Proof:** Fresh core needs no local weights or full model process; complete binary/temporary-size waterfall and profile-aware integrity checks; old explicit offline choices and notices/licenses survive.

**Source sections:** `package.json` (export lines 2697–2833); `electron-builder.yml` (export lines 2220–2550); `docs/ENTERPRISE-DEPLOY-WINDOWS.md` (export lines 5684–5825); `THIRD_PARTY_NOTICES.md` (export lines 2840–2938)

## SRC-17 · A development-store seam is not production durability
**P0** · ARCHITECTURE_GAP · TASK-001, TASK-005, TASK-006, TASK-012, TASK-034, TASK-045, TASK-062**

**Observed:** The map labels operator/src/store.ts as the Operator store; it contains contracts/test memory behavior while d1.ts supplies SQL implementation. The separate license store documents small-dataset single-process durability.

**Implement:** Draw physical stores separately from interfaces. Production must reject placeholder/memory stores and wrong environment bindings. Choose a concurrency-safe source for entitlements and budgets; avoid accidental dual writes across unrelated authorities.

**Proof:** Actual deployment ID/database/schema identity, restart persistence, concurrent admission and isolated restore. Startup/readiness cannot paint an ephemeral fallback as live.

**Source sections:** `operator/src/store.ts` (export lines 63381–64220); `operator/src/d1.ts` (export lines 53940–54876); `license-server/lib/store.mjs` (export lines 32541–32683)

## SRC-18 · Mirror-safe release delivery is a first-class gate
**P0** · OPERATIONAL_DEPENDENCY · TASK-001, TASK-002, TASK-027, TASK-062, TASK-063, TASK-064, TASK-066**

**Observed:** The checked-in script/docs describe a Forgejo push mirror that removes refs missing on its side, and push both github and origin. The actual current mirror settings and cadence were not verified by this source audit.

**Implement:** Discover actual remote URLs, authority, mirror mode and branch/tag rules before writing. Verify both required refs at the same commit and post-sync durability, handle partial push visibly, and retain protected-tag policy. Never disable rules or force-push because an old document says so.

**Proof:** Exact signed-asset hash, canonical feed, source/release tags, required remotes and post-publication readback agree. Missing mirror access is a scoped release blocker if that mirror is actually authoritative.

**Source sections:** `scripts/push-both.sh` (export lines 98656–98673); `docs/ENTERPRISE_RELEASE.md` (export lines 5832–6027); `electron-builder.yml` (export lines 2220–2550)

## SRC-19 · Secret scans must not exclude entire tests and documentation trees
**P0** · SOURCE_CONTROL_GAP · TASK-002, TASK-012, TASK-015, TASK-057, TASK-061, TASK-062, TASK-063**

**Observed:** The allowlist covers whole test-file patterns, scripts/qa and Markdown docs, not just known fixture bytes. This creates a blind area even though the comments describe fake examples. No real leaked token was established by this review.

**Implement:** Replace broad exemptions with reviewed narrow rule/fingerprint/line-scoped synthetic exceptions. Scan documentation, tests, fixtures, generated assets and final artifacts. Prevent scanners from printing secrets in reports.

**Proof:** Plant synthetic canary secrets in each formerly excluded class and prove detection; legitimate exact fixtures remain allowed. Run the actual tools on the current commit/history and inspect final artifacts.

**Source sections:** `.gitleaks.toml` (export lines 3135–3176)

## SRC-20 · Failed cloud inventory is not an empty account
**P0** · SOURCE_DEFECT · TASK-001, TASK-012, TASK-014, TASK-062**

**Observed:** The script catches failure of secret list and continues with an empty string, then may replace METIS_PROXY_KEYS. The code correctly refuses when it sees an existing name, but a failed inventory cannot establish absence.

**Implement:** Any retained provisioner must fail on unavailable inventory and require explicit authority for replacement. Stop using embedded shared credentials for enterprise 2.0; archive/deprecate this path safely instead of re-running it automatically.

**Proof:** Access denied/network error leaves all existing secrets unchanged. No delete-existing-secret workaround or successful empty inventory inference.

**Source sections:** `cloudflare-proxy/provision-embedded-key.mjs` (export lines 3553–3702)

## SRC-21 · Capture privacy copy must cover screenshots, titles, URLs and helpers too
**P0** · SOURCE_POLICY_CONFLICT · TASK-005, TASK-015, TASK-033, TASK-034, TASK-054, TASK-057, TASK-058**

**Observed:** The product includes screen/OCR paths and the audit document calls meeting-title-derived file basenames metadata. Such labels can still reveal confidential content; audio-only logging rules are incomplete.

**Implement:** Minimize approved window/region observation, exclude credentials and unrelated apps, classify derived text as content. Replace sensitive title/URL labels in operational logs with opaque IDs and approved categorical fields; avoid raw crash/heap exports.

**Proof:** Synthetic meeting title, OCR phrase, URL token and filename sentinels do not persist in prohibited sinks, while authorized knowledge records and meaningful safe diagnostics remain available.

**Source sections:** `src/main/screen-capture.ts` (export lines 141536–141616); `src/main/screen-preprocess.ts` (export lines 142301–142745); `docs/AUDIT-LOG.md` (export lines 5027–5081)

## SRC-22 · Preserve tailored recaps and human edits when moving skills server-side
**P1** · PRESERVE_AND_EXTEND · TASK-008, TASK-009, TASK-018, TASK-022, TASK-028, TASK-037, TASK-040, TASK-042, TASK-043, TASK-044, TASK-054**

**Observed:** The source already defines nine mode-specific recap layouts and locked mode skills. A generic new cloud summary would regress this existing capability.

**Implement:** Migrate mode IDs and versioned templates into the central registry with compatibility. Keep original human notes, accepted corrections and generated alternatives separate. Never overwrite manual edits during enhancement, re-template or retry.

**Proof:** All nine layouts render within the answer scroller; update/revoke/version behavior works without reinstall; human text/corrections remain exact after regeneration.

**Source sections:** `src/shared/mode-recap.ts` (export lines 232411–232531); `src/main/mode-skills.ts` (export lines 130106–130336); `DESIGN.md` (export lines 1966–2147)

## SRC-23 · Dust connector checklists do not prove canonical read/write
**P0** · IMPLEMENTATION_LIMIT · TASK-006, TASK-007, TASK-035, TASK-036, TASK-037, TASK-038, TASK-039, TASK-040, TASK-041, TASK-054, TASK-055**

**Observed:** The source includes an unchecked real-Dust verification checklist for a plaintext wiki. That is neither executed evidence nor a canonical mutation interface; the readable projection has its own access boundary.

**Implement:** Reuse the wiki safely, but make personal/service-scoped Dust tools read and mutate canonical records with revision checks and readback. Protect private sources and output audience before retrieval, regeneration and publication.

**Proof:** Actual two-principal Dust read/write, conflict, regenerate, correction, revoke, deletion and laptop-asleep sequence. No raw parent-folder indexing or edits lost on regeneration.

**Source sections:** `docs/verification/mi-5-dust-e2e.md` (export lines 16256–16360); `src/main/brain/publish.ts` (export lines 161550–162539)

## SRC-24 · Every workspace needs a real test/build/release coverage owner
**P0** · EVIDENCE_GAP · TASK-001, TASK-003, TASK-005, TASK-029, TASK-053, TASK-056, TASK-057, TASK-061, TASK-062, TASK-063, TASK-065, TASK-066**

**Observed:** Root tests explicitly chain proxy and Operator suites. Native Swift and legacy license-server have their own projects/tests, and the export lacks essential root files. Test counts/names and historical README claims do not establish current executed coverage.

**Implement:** Build a workspace/entrypoint inventory for production, test, migrations and native helpers. Run each applicable suite on the correct runtime/OS; bind tests to actual package profile and post-sign artifact. Include generated bundles and policy/data migrations in impact analysis.

**Proof:** No zero-tests pass, excluded workspace, stale generated bundle, native test seam or unsigned rebuild can satisfy release evidence. Missing source/tool/tenant states are explicit and scoped.

**Source sections:** `package.json` (export lines 2697–2833); `vitest.config.ts` (export lines 3031–3101); `native-app/MetisKit/Package.swift` (export lines 35457–35476); `license-server/package.json` (export lines 29269–29294); `.github/workflows/build.yml` (export lines 245561–246007)
