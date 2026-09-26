# K08 — v6 / v5 lineage requirements extraction (Métis 2.0)

**Lane:** K08-v6-v5-lineage
**Scope:** Extract every requirement and acceptance item from the v6 kit (`Metis-Upgrade-v6-BRAG-Hindsight`) and the v5 kit (`Metis-Behavior-Upgrade-v5-Hindsight`, including its nested baselines), mark delta vs r11 MASTER, with exact source refs.
**Method:** software-architecture-engineer requirements/quality checklist + stark product-and-planning checklist (skimmed; no direct quotes reproduced — paraphrased per copyright rule).
**Repo:** read-only, no edits made. All paths below are under `/Users/tony/AI-Brain-build/metis-v2-inputs/` unless noted.
**Evidence labels:** OBSERVED = read directly in a cited file. DERIVED = reasoned from two or more OBSERVED facts, reasoning stated. ASSUMED = plausible but unverified. UNKNOWN = genuinely undetermined from inputs available to this lane.

---

## 0. Lineage map (OBSERVED, DERIVED)

The kit tree is a layered stack, each layer additive over the last, preserved byte-for-byte as a nested baseline ZIP:

```
r11 MASTER (rev 4.5, "kit r11")                — spec/MASTER.md, 5363 lines, sha256 e5b3c51d...1350
  ├─ already contains: JEV/Laya decision service (§10), HeyClicky static-artifact study R88/R89 (informs
  │  named agents / screen guidance / dictation / onboarding, not a keyboard-toggle spec), orb-only ARMED
  │  wake-word state (§5.11), governed Hindsight embedded behind canonical knowledge (§35, HMSTEP-01–16,
  │  16 gates, 32 memory cases) — OBSERVED spec/MASTER.md:34,315-346,915-1003,1658-1664,1939
  └─▶ v2 "Metis-HeyClicky-Interaction-Upgrade" (baseline .x, nested)   — CXSTEP-01..20, CXAC-01..36,
      CXCAP-*, root_count_preserved 66 — OBSERVED v5/baseline/Metis-HeyClicky-Interaction-Upgrade.x/...
      └─▶ v3 JEV integration addendum      — JVSTEP-01..10, JVAC-01..24, jev/JEV-INTEGRATION.md
          └─▶ v4 "keyboard-notes" owner correction — NK-01..12, NKAC-01..16 (this is the "keyboard-first
              note-taker correction" the task asks about) — OBSERVED keyboard-notes/PRODUCT-CORRECTION.md
              └─▶ v5 "Metis-Behavior-Upgrade-v5-Hindsight" (the v5 kit)  — adds supplied
                  hindsight-agent-memory-skill v1.0.0 (55 files) wrapped as
                  skills/metis-hindsight-memory, HMSTEP-SKILL-CROSSWALK.json, HSAC-01..20
                  → combined app-level matrix = 120 NOT_RUN cases (100 prior + 20 new)
                  └─▶ v6 "Metis-Upgrade-v6-BRAG-Hindsight" (the v6 kit) — adds (a) an explicit mandatory
                      upstream binding to Vectorize Hindsight (github.com/vectorize-io/hindsight, 10
                      "required implementation seams", proof items A–H) and (b) a BRAG/Hyperframes launch
                      film brief (60s hero + 30s vertical + 20s teaser, 8-scene storyboard, 12 LFAC media
                      QA criteria) explicitly scoped as **not** a runtime/product requirement.
```

Key delta finding: **r11 MASTER already has JEV and Hindsight as concepts**, and already references HeyClicky as a design study. What v2→v6 add on top are (1) a fully worked *executable candidate* implementation contract for JEV and for the HeyClicky interaction model (CXSTEP/CXAC), (2) the v4 "keyboard-first" correction that did **not** exist in r11 as a first-class global show/hide + separate command-voice toggle spec (r11's nearest equivalent is the ARMED wake-word orb state and a generic "configurable global stop chord", not a visibility toggle — OBSERVED spec/MASTER.md:315-346), (3) a third-party Hindsight *skill package* wrapper and its v6 upstream-binding tightening, and (4) an entirely new, explicitly non-runtime deliverable: the BRAG launch film.

Nothing in v5/v6 is installed in `/Users/tony/AI-Brain-build/metis-2.0` (the checkout this lane was told is read-only); every kit document says so explicitly (e.g. OBSERVED README.md:3 v5 "the installed app is not updated"; v6 evidence/PACKAGE-CHECKS.json: `"application_code_modified": false`). This lane did not open metis-2.0 source; that is other lanes' job. Cross-references to Tony's runtime evidence (E1–E9) below are DERIVED comparisons only.

---

## 1. Keyboard-first note-taker correction (v4 "keyboard-notes") — **NEW vs r11**

Source: `v5/.../keyboard-notes/PRODUCT-CORRECTION.md`, `REQUIREMENTS.json`, `ACCEPTANCE-MATRIX.json`, `INTEGRATION.json`.

This is an **owner correction**, i.e. it supersedes earlier click-only/action-only framing in the v2/v3 kits, but "does not erase the preserved r11 specification" (OBSERVED PRODUCT-CORRECTION.md:17). It introduces **no new runtime controller and no code** (OBSERVED PRODUCT-CORRECTION.md:90-91) — it is a requirements/contract change to be implemented against existing controllers.

| ID | Title | Requirement (paraphrased) | Priority | Source |
|---|---|---|---|---|
| NK-01 | Additive product identity | Métis remains note-taker/meeting copilot; HeyClicky-style speech/guidance/actions extend it, no second app | MUST | REQUIREMENTS.json:8-19 |
| NK-02 | Preserve complete note-taking workflow | Inventory + regress capture/import, transcript revisions, speakers/timestamps, summaries, decisions, action items, history, search, exports/sync | MUST | REQUIREMENTS.json:20-34 |
| NK-03 | Global Métis visibility toggle | One configured shortcut shows/focuses; a second distinct press dismisses; never starts/stops/pauses/finalizes the meeting; works while another app is focused | MUST | REQUIREMENTS.json:35-47; PRODUCT-CORRECTION.md:29-37 |
| NK-04 | Keyboard-accessible command capture | Separate configurable command-voice action, press-on/press-off (not hold-to-talk); visibility toggle never silently acquires the mic | MUST | REQUIREMENTS.json:48-60 |
| NK-05 | Truthful shortcut readiness/migration | Inspect current bindings, qualify registration/conflicts/layouts/repeats/suspend-resume; failed remap cannot destroy the working old binding | MUST | REQUIREMENTS.json:61-73; PRODUCT-CORRECTION.md:45-53 |
| NK-06 | Separate recording/command/task lifecycles | Command end/off, dismiss, stop-speaking, task-Stop must not end note-taking; "Stop all capture" stops every consumer | MUST | REQUIREMENTS.json:74-86 |
| NK-07 | One audio owner, scoped consumers | Existing trusted broker, not a hidden second mic; closing command subscription can't close device while meeting still needs it | MUST | REQUIREMENTS.json:87-98 |
| NK-08 | Meeting speech is evidence, not action authority | Participant/transcript/screen/tool/own-TTS text cannot issue or confirm a command; hotkey ≠ speaker authentication | MUST | REQUIREMENTS.json:99-111 |
| NK-09 | Private help without corrupting notes | Private queries/progress/synthesized responses stay outside canonical transcript by default; call default = text | MUST | REQUIREMENTS.json:112-125 |
| NK-10 | JEV/action runtime cannot gate note-taking | JEV absence/failure/agent cancellation cannot stop capture, flush transcript, or block saving already-captured notes | MUST | REQUIREMENTS.json:126-139 |
| NK-11 | Keep meeting context/permissions across toggles | Reopening restores same meeting/task/draft/scroll without duplicate records or new consent | MUST | REQUIREMENTS.json:140-153 |
| NK-12 | Combined product proof before completion | Full milestone: note-taker + repeated toggle + private query + one verified action + reopen, on native builds | MUST | REQUIREMENTS.json:154-169 |

**Acceptance:** 16 cases NKAC-01..16, all `status: NOT_RUN` at kit authoring time (OBSERVED ACCEPTANCE-MATRIX.json throughout). Representative ones directly relevant to Tony's bug reports:
- NKAC-02 "Global show/hide during recording" — same session/segments persist, no restart, across repeated toggles while another app is focused (ACCEPTANCE-MATRIX.json:27-47). **This is the acceptance test that would catch the "History sometimes doesn't reopen; running but frozen" bug (E3/E9)** if it were run against the live app — it currently is not (status NOT_RUN).
- NKAC-07 "Shortcut conflict and remapping rollback" — no false Ready state; old mapping survives failed re-registration (lines 133-151).
- NKAC-14 "Upgrade and crash recovery preserve user choices" — restart after interrupted work must not lose notes or reactivate capture automatically (lines 275-295). Directly relevant to E3 (8 app.started with no clean-shutdown) and E6 (crash records).
- NKAC-16 "Actual platform qualification" — repeat on real Windows/Mac builds; no browser fixture allowed as substitute (lines 316-336).

**New vs r11:** YES. r11 MASTER's closest analog is the ARMED orb wake-word state and a generic "configurable global stop chord" (OBSERVED spec/MASTER.md:315-346) — there is no r11 text defining a *visibility* toggle distinct from a *command-voice* toggle, nor the "one audio owner, scoped consumers" contract in this explicit form. `grep` across r11 MASTER for "global shortcut / show-hide / visibility toggle / summon" returned zero matches; the only global-shortcut concept in r11 is the stop chord. This entire NK/NKAC family is therefore a genuine v4 addition layered onto r11, not a restatement.

---

## 2. JEV — the decision provider, "completion not another placeholder"

Source: `v5/.../jev/JEV-INTEGRATION.md`, `JEV-ROLE-AND-BINDINGS.md`, `BACKLOG.json` (JVSTEP-01..10), `QUALIFICATION.md`, `PROOF-OF-INTEGRATION.md`, `ACCEPTANCE-MATRIX.json` (JVAC-01..24); v6 `IMPLEMENTATION-PROMPT.md` §"Mandatory JEV completion" (lines 83-96).

r11 MASTER already specifies JEV/Laya as the decision service (§10, OBSERVED spec/MASTER.md:915-1003) including: real vendor call (not an invented `/decide` API), central server-vault credential shared across devices with separate desktop/Intelligence toggles, Choice/Score/Noul primitives, fleet-key isolation, business-Intelligence three-layer contract (Facts/Assessments/Explanations, §17.11). **JEV itself is not new.** What v3 (nested inside v5's baseline) adds is a fully worked, testable candidate implementation and closes a specifically named prior defect:

> "Historical names include `metis-decide-client.ts`... The prior audit found a client path whose successful decision was discarded" (OBSERVED r11 spec/MASTER.md:919; restated as the "no-op consumer" gap in JEV-INTEGRATION.md:34 and BACKLOG.json JVSTEP-01 "Reconcile actual JEV code... historical no-op consumer").

| ID | Title | Requirement | Priority | Source |
|---|---|---|---|---|
| JVSTEP-01 | Reconcile actual JEV code + historical no-op consumer | Classify current JEV client/gateway/telemetry; close the discarded-`void result` gap named in r11's audit | MUST | BACKLOG.json:4-27 |
| JVSTEP-02 | Central credential lifecycle | Server-only encrypted vault, scoped admin probe, atomic rotation/revocation, 2 independent devices on one credential | MUST | BACKLOG.json:28-53; JEV-ROLE-AND-BINDINGS.md:9,15,80-89 |
| JVSTEP-03 | Pinned typed vendor transport | Real API schema, strict bounds (64 KiB req / 256 KiB resp / 16 questions / 64 options / 31 candidates), model pin `jev-1.13.0` as *candidate*, not proof of account access | MUST | BACKLOG.json:54-79; JEV-INTEGRATION.md:51-65 |
| JVSTEP-04 | Validated JEV selection → actual prepared action | `executeWithDecision` consumes exact selected candidate through existing canonical-intent matcher + grant + native readback; no `void result` | MUST | BACKLOG.json:80-109; JEV-ROLE-AND-BINDINGS.md:12 |
| JVSTEP-05 | Intent/skill hints without granting authority | `recommendInteractionOrSkill` is a hint only; deterministic Stop/status stay independent | MUST | BACKLOG.json:110-136 |
| JVSTEP-06 | Source-linked JEV classifications in Intelligence | `annotateKnowledge` combines Score/Noul/Choice; annotations remain inferred; JEV cannot write Hindsight memory | MUST | BACKLOG.json:137-164; JEV-INTEGRATION.md:47-49 |
| JVSTEP-07 | Distributed budgets/circuits/reconciliation | Atomic request budget/dedupe/circuit; unknown ≠ zero; cancellation settles without side effects | MUST | BACKLOG.json:165-192 |
| JVSTEP-08 | Real Laya alternative + explicit auto fallback | Laya-only needs no JEV key/call; auto-fallback only on listed transient errors, budgeted, no fabricated confidence | MUST | BACKLOG.json:193-221; JEV-INTEGRATION.md:99-101 |
| JVSTEP-09 | Calibrate profiles, native/live proof, privacy | Held-out multilingual (EN/Québec FR/ES/BR-PT) qualification; real two-device use; account retention review | MUST | BACKLOG.json:222-252; QUALIFICATION.md (dataset + measurement sections) |
| JVSTEP-10 | Operations/rollout/CI/full-upgrade evidence | Full suites, canary/rollback/revocation, separate Windows/native-Mac gates | MUST | BACKLOG.json:253-280 |

**Acceptance:** JVAC-01..24 (ACCEPTANCE-MATRIX.json), e.g. JVAC-01 "Central key, two installations", JVAC-11 "Failed replacement preserves key", JVAC-18 "Laya-only isolation", JVAC-20 "Real ledger and crash recovery". Combined with the prior 60 interaction scenarios these make "84 app-level cases," all NOT_RUN (OBSERVED JEV-INTEGRATION.md:117). `PROOF-OF-INTEGRATION.md` states plainly: a mock reply / stored key / imported SDK / provider button / `void result` is **not** sufficient proof, and that the included loopback test proves wiring through the candidate only, with synthetic provider result and test-fixture auth/journal (OBSERVED PROOF-OF-INTEGRATION.md:3,13).

**New vs r11:** PARTIAL. JEV as a concept is r11-original (§10). The specific candidate modules (`jev-contract.ts`, `jev-transport.ts`, `jev-service.ts`, `DecisionJournal`, `jev-admin.ts`, `executeWithDecision`, `recommendInteractionOrSkill`, `annotateKnowledge`, `DecisionBackend`, `decisionReadiness` — OBSERVED JEV-ROLE-AND-BINDINGS.md:5-16), the JVSTEP/JVAC breakdown, and the explicit "close the no-op consumer" framing are new elaborations layered on top of r11 by the nested v3 addendum, carried forward unchanged through v5/v6.

---

## 3. HeyClicky-inspired verified actions (CXSTEP/CXAC/BXAC/MB)

Source: `v5/.../behavior/PRODUCT-BEHAVIOR.md`, `INTERACTION-EXAMPLES.md`, `REQUIREMENTS.json` (MB-01..24), `ALL-ACCEPTANCE.json` (CXAC-01..36 + HSAC-01..20), `ADDITIONAL-ACCEPTANCE.json` (BXAC-01..24); nested baseline `Metis-HeyClicky-Interaction-Upgrade.x/.../BACKLOG.json` (CXSTEP-01..20) and `CAPABILITY-MATRIX.json` (CXCAP-*).

r11 MASTER already studied the real HeyClicky.dmg 1.0.51 build 61 (static artifact only, no execution — OBSERVED spec/MASTER.md:4393) and used it to justify persistent named agents, screen guidance, safe dictation, personalized onboarding, routines (spec/MASTER.md:4405-4425). The v2 "HeyClicky Interaction Upgrade" baseline is the layer that turns that r11 prose into a candidate implementation with 20 CXSTEP children and 36 CXAC acceptance cases, still carrying the same `root_count_preserved: 66` / same MASTER sha256 (OBSERVED BACKLOG.json:281-283 in the JEV file, same sha repeated across kits confirming lineage).

CXSTEP-01..20 titles (OBSERVED delivery/INTEGRATION-BACKLOG.json — same 20 children repeated verbatim in the v5 delivery folder): source/evidence reconciliation; interaction session + revocable authority; click-to-talk + interruptible speech; context binding to window/field/source; non-controlling screen guidance; typed native action + independent readback; foreground input ownership/interruption/recovery; unify buttons/voice/text/task-card; bounded multi-step plans + qualified decisions; safe dictation; named agents + isolated context; connectors/skills/output artifacts; approved outcomes/preferences → governed Hindsight; explicit suggestions/routines; onboarding integration; session privacy/permissions/consumption; live-meeting/voice-output/audience boundaries; lean native packaging; full behavior/abuse/accessibility/performance qualification; converge r11 upgrade + separate releases.

Key normative behavior requirements (MB-01..24, `behavior/REQUIREMENTS.json`) — selected ones with direct bearing on "verified actions":

| ID | Title | Requirement | Priority | Source |
|---|---|---|---|---|
| MB-02 | Talk/Guide/Do/Dictate separation | Guide cannot click; Dictate cannot submit; intent selects mode | MUST | REQUIREMENTS.json:18-29 |
| MB-04 | Stable authorized input before effects | Partial/meeting/playback/tool-origin text cannot authorize mutation | MUST | REQUIREMENTS.json:42-54 |
| MB-05 | Exact consequential approval | Approval binds exact current recipients/content/resource/amount, consumed once | MUST | REQUIREMENTS.json:55-66 |
| MB-06 | Truthful speech/labels | "Done/saved/sent" requires verified host receipt, not model prose | MUST | REQUIREMENTS.json:67-79 |
| MB-11 | One physical input owner | Exclusive device fence survives revocation until native drain ack | MUST | REQUIREMENTS.json:130-142 |
| MB-14 | Durable operation/resource identity | Reserve before effects; duplicates can't bypass quarantine | MUST | REQUIREMENTS.json:169-180 |
| MB-15 | Independent postcondition verification | Read back actual target; absence of desired result ≠ proof of zero effect | MUST | REQUIREMENTS.json:181-192 |
| MB-21 | Readiness grounded in probes | Saved creds = Checking until real scoped probe passes | MUST | REQUIREMENTS.json:255-266 |

Acceptance: 36 CXAC cases (ALL-ACCEPTANCE.json:8-2200-ish, ids CXAC-01..36) plus 24 BXAC refinements (ADDITIONAL-ACCEPTANCE.json, ids BXAC-01..24, e.g. BXAC-08 "Native drain before handoff", BXAC-16/17/18 journal failure-mode triplet, BXAC-19 "Command-channel authenticity" — directly the NK-08 boundary tested at the behavior layer too).

**New vs r11:** YES, as elaboration. r11 has the *product decisions* (D01-D0n style, Talk/Guide/Do concepts implied through the HeyClicky study section) but not the CXSTEP/CXAC/MB apparatus, candidate TypeScript module boundaries (`BehaviorAuthority`, `ScopeGrant`, `executeVerifiedOperation`, `OperationJournal`, `NativeInputLeaseBroker`, `ActionPort.verify` — OBSERVED delivery/HOST-BINDINGS.md:15-24, BIND-01..10), or the 60→84→120 cumulative acceptance-case counting scheme. This is the same "worked out" pattern as JEV: r11 sets policy, the nested v2/v3 kits deliver an executable, testable contract.

---

## 4. Hindsight memory — two layers (r11-original HMSTEP, v5 skill wrapper, v6 upstream binding)

### 4a. r11-original memory obligations (NOT new)
r11 rev 4.5 already embeds Hindsight "behind the existing governed knowledge service" with HMSTEP-01–16 (16 gates, 32 memory cases) — OBSERVED spec/MASTER.md:34,1939. `memory/HMSTEP-SKILL-CROSSWALK.json` in the v5 kit reproduces these 16 steps' original titles/tasks/dependencies/gates verbatim (OBSERVED, e.g. HMSTEP-01 "Qualify the source and runtime contract" through HMSTEP-16 "Freeze, release and operate the qualified capability" — full table read, lines 10-436). These are **r11 requirements**, not new ones; the crosswalk's own schema field `"new_competing_memory_stack": false` (line 7) makes this explicit.

### 4b. v5 addition — the supplied third-party skill (NEW)
The genuinely new v5 content is the packaging/integration of an uploaded third-party skill, `hindsight-agent-memory-skill-v1.0.0` (55 files, preserved in `baseline/hindsight-agent-memory-skill-v1.0.0.zip` and extracted at `baseline/hindsight-agent-memory-skill-v1.0.0.x/`), wrapped by an active `skills/metis-hindsight-memory/SKILL.md` + `METIS-PROFILE.md` that must be read before the generic upstream recipes (OBSERVED README.md:11-16, memory/INTEGRATION.md:5-10). Four explicit reconciliations are called out as new obligations against the generic skill's defaults (memory/INTEGRATION.md:61-82):
- **HS-01/HS-03 (storage truth):** the generic skill's own docs conflict — retain prose claims original text isn't stored, but the Documents guide describes stored original chunks; treat as potentially retained until the actual deployment is inspected.
- **HS-02 (tags/budgets):** empty `all_strict` tag list means *no filter*, not "no results" — a specific footgun the host must guard against; `max_tokens` bounds fact-text only, not the whole envelope.
- **HS-04 (derived/version drift):** `is_stale` behavior is historical documentation, not a portable guarantee; must be re-tested on the actual deployed version.
- **Consent scope narrowing:** the generic skill's "reviewed-turn" recipe is broader than Métis's rule (only eligible approved summaries/preferences/verified receipts may be retained).

Twenty new **HSAC-01..20** scenarios (ALL-ACCEPTANCE.json:1853-2249) bring the combined app-level total to 120 (OBSERVED memory/INTEGRATION.md:105, README.md:19-20). `memory/HOST-BINDINGS.md` sections A–F name the required production seams (authenticated principal/bank, canonical storage/reconciliation, one transport, product triggers separate from capture controls, application API/Dust reuse, ledger/deployment/release) — all still against **existing** Métis services, explicitly forbidding a second memory implementation (OBSERVED HOST-BINDINGS.md:1-3).

**Actual test evidence from this v5 kit (OBSERVED, not this lane's own testing):** `evidence/FINAL-STATUS.json` records 421 total passing tests across the *candidate* (existing behavior/JEV: 306, uploaded skill Python: 60, Node: 21, new package-contract: 34), 0 failures, but explicitly: `"current_repository_inspected": false"`, `"installed_app_updated": false"`, `"live_hindsight_requests": 0"`, `"all_app_acceptance": "NOT_RUN"`. These are candidate/fixture tests, not application or native evidence (OBSERVED IMPLEMENTATION-REPORT.md:26-38, "Still required" section).

### 4c. v6 addition — mandatory upstream binding (NEW, tightens 4b)
Source: `v6/.../memory/HINDSIGHT-UPSTREAM-REQUIREMENTS.md`.

v6 makes explicit what v5 left generic: the required upstream is **Vectorize Hindsight**, `https://github.com/vectorize-io/hindsight.git` — not merely an inspiration (OBSERVED HINDSIGHT-UPSTREAM-REQUIREMENTS.md:7-13). This is a genuinely new architecture decision not present in v5 or r11 (r11's Hindsight references are generic/governed-service-level, no named upstream vendor pin).

Ten "required implementation seams" (HINDSIGHT-UPSTREAM-REQUIREMENTS.md:15-26), each MUST:
1. Current identity/audience scoping before and after inference, no desktop-selected banks.
2. Canonical data first — notes remain canonical; metadata-only jobs reauthorize content at execution.
3. Real retained memory via pinned client/REST; prevent stale replacement/duplicate ingestion; reconcile ambiguous timeouts.
4. Bounded retrieval — empty tag list ≠ no filter risk (repeats HS-02); reject unexpectedly-empty protected scope before egress.
5. Grounded reflection — optional per task, not every hotkey; inference stays labeled.
6. Correction/forgetting — ordered projection replacement; tombstone before purge; forgetting ≠ deleting meeting notes.
7. Fail independently — Hindsight failure cannot stop capture/saving/keyboard/local cancellation/deterministic actions (mirrors NK-10).
8. One governed integration — named agents/Dust/JEV share the same source-authorized service; JEV cannot approve retention.
9. Operations/retention — secrets server-side; verify actual content/chunk/derived storage rather than trusting "no-training" language.
10. No automatic-ingestion shortcut — explicit governed calls only, no auto-capture hooks or raw MCP.

Minimum live proof, items **A–H** (lines 32-39): consented meeting continues through show/hide → approve one canonical decision → observe real retain/projection job → new session, no seeded context, recall via actual Hindsight route with current source link → correct canonical value, prove stale memory loses control → deny a second unauthorized identity → forget + prove immediate read-denial and eventual cleanup with notes intact → inject delayed retain/recall, retry, restart, outage — verify no resurrection/duplicate write/note-taking shutdown. All explicitly "obligations to execute, not passes declared here" (line 41).

**Priority:** MUST for the runtime integration; **release-blocking specifically for any marketing claim** — v6 explicitly forbids advertising "remembers everything / zero retention / all data stays on your Mac / learns automatically / secure for every organization" without exact evidence (OBSERVED HINDSIGHT-UPSTREAM-REQUIREMENTS.md:47).

---

## 5. BRAG launch film — explicitly a SEPARATE deliverable from runtime

Source: `v6/.../launch-film/BRAG-LAUNCH-PROMPT.md`, `STORYBOARD.json`, `ACCEPTANCE.json`.

This whole section is **not a product/runtime requirement**. It is stated as such repeatedly and unambiguously:
- README.md:1 "This is a prompt/production handoff update, not a rendered video or installed software."
- BRAG-LAUNCH-PROMPT.md:53 "This filmmaking brief alone does not authorize implementing the entire app backlog."
- IMPLEMENTATION-PROMPT.md:9 "A request for a launch film does not authorize changing product code, paid services or production memory."
- evidence/PACKAGE-CHECKS.json: `"film_rendered": false"`, `"application_code_modified": false"`.

Requirements, for completeness (this lane's task explicitly calls these out):

| Item | Spec | Source |
|---|---|---|
| Hero film | 60 s, 3840×2160/16:9/30fps (fallback 1920×1080 if native 4K unavailable — must not mislabel upscale as native), no narrator by default, product thesis "Métis keeps the notes. You summon it with a key. It helps you act. Approved context carries forward." | BRAG-LAUNCH-PROMPT.md:11-13,150; STORYBOARD.json:7-16 |
| 8-scene storyboard | LF-01..LF-08, contiguous 0–60s, each scene has `product_status: NOT_ASSESSED`, `source_capture: null` at authoring time | STORYBOARD.json:18-115 |
| Cutdowns | 30 s vertical 1080×1920 (re-edit/reframe, not center-crop) + 20 s teaser 1920×1080, both `status: NOT_RENDERED` | STORYBOARD.json:117-131 |
| 12 LFAC media-QA criteria | LFAC-01..12: product identity, source/claims honesty, keyboard continuity, Hindsight proof (cross-session, not seeded), approval/result truth, original branding, storyboard contiguity, motion/readability, audio rights, render QA, formats/opening, handoff/privacy — all `status: NOT_RUN` | ACCEPTANCE.json:1-90 |
| Honesty gate | Every depicted capability classified available-and-verified / implemented-but-unverified / planned / unavailable; unverifiable sequences require visible "concept" labeling, not fabrication | BRAG-LAUNCH-PROMPT.md:46-51 |
| Deliverables | mp4 hero+cutdowns, poster, storyboard/contact sheet, animatic, `claims-manifest.json`, sanitized asset/license register, `memory-proof.md`, blocked/reconstructed list | BRAG-LAUNCH-PROMPT.md:160-171 |

**Priority:** COULD relative to the runtime/2.0 completion goal — Tony's stated overall goal ("bring Métis to version 2.0... fix Tony's bugs... refactor to simple, well-structured, enterprise-grade code") does not require this film to ship; the kit itself frames it as a marketing artifact gated on the runtime work being provably true first. Flagging as `new_vs_r11: true` (wholly new, no r11 analog) but low priority against the crash/performance bugs.

---

## 6. Cross-reference to Tony's runtime evidence (E1–E9) — gap analysis (DERIVED)

The v5/v6 kits are requirements text; they were not tested against `/Applications/Metis.app` 1.9.6 by this lane (out of scope, read-only). Comparing their stated acceptance obligations to the lead's OBSERVED runtime evidence:

- **E2 (orphaned llama-server / chrome_crashpad_handler sidecars, ppid=1) and E9 (SingletonLock hangs)** — **not covered by any requirement in this v5/v6/r11 text.** None of NK-*, MB-*, JVSTEP-*, HMSTEP-* discuss local-LLM sidecar process lifecycle, orphan reaping, or single-instance-lock recovery on a hung first instance. This is a genuine requirements gap for v2.0, not an oversight in this lane's reading — `grep -i "llama\|sidecar\|singleton\|orphan" ` across all v5/v6 kit markdown returned no hits (verified by search during this review). **Recommend the Opus planner add a new requirement family** ("sidecar lifecycle & crash reaping") since NK-07's "one audio owner" concept does not extend to the local-LLM process.
- **E3 (8 app.started, no clean-shutdown) / E6 (crash records, render-process-gone, app.unresponsive)** — directly the scenario NKAC-02 and NKAC-14 are designed to catch (global show/hide during recording; crash recovery preserves user choices), but both are `status: NOT_RUN` in the kit (ACCEPTANCE-MATRIX.json). **The acceptance tests that would catch Tony's "History sometimes doesn't reopen" bug already exist on paper and have never been executed.**
- **E5 (capture.failed x5394, screen-recording-permission retry loop)** — CXSTEP-16 ("Reconcile session privacy, permissions and actual consumption") and MB-21 ("Readiness grounded in probes: saved creds = Checking until a real scoped probe") are the closest normative match — a retry loop hammering every ~6s when a permission is off is exactly the kind of thing MB-21 says must not happen (a route must show "Unsupported/Unavailable", not spin). Not an exact match; flag as a likely violation of MB-21's spirit if confirmed against source by a lane with repo access.
- **E4 (cold LLM start 30-41s blocking on every launch)** — no v5/v6 requirement addresses local-model cold-start budgets; r11 §7 has generic "Performance budgets and instant-feeling interaction" (spec/MASTER.md:554) which is likely the more relevant source for another lane.

None of this is a finding this lane can confirm against source (no repo access authorized); it is offered as a cross-check for the Opus planner to route to the lanes that do have repo access (L01 main-lifecycle, L02 sidecars-ai, B2/B3).

---

## 7. Summary counts (OBSERVED, for the planner's tracking)

| Family | IDs | Count | All-NOT_RUN at kit authoring? |
|---|---|---|---|
| Keyboard/note-taker requirements | NK-01..12 | 12 | yes |
| Keyboard/note-taker acceptance | NKAC-01..16 | 16 | yes |
| Behavior requirements | MB-01..24 | 24 | yes |
| HeyClicky interaction steps | CXSTEP-01..20 | 20 | yes (application_integration NOT_ASSESSED) |
| HeyClicky acceptance | CXAC-01..36 | 36 | yes |
| Behavior acceptance refinements | BXAC-01..24 | 24 | yes |
| JEV integration steps | JVSTEP-01..10 | 10 | yes |
| JEV acceptance | JVAC-01..24 | 24 | yes |
| Hindsight original steps (r11) | HMSTEP-01..16 | 16 | yes |
| Hindsight skill acceptance (v5 new) | HSAC-01..20 | 20 | yes |
| Hindsight upstream seams (v6 new) | 10 numbered seams | 10 | yes (obligations, "not passes declared here") |
| Hindsight upstream live proof | A–H | 8 | yes |
| BRAG film scenes | LF-01..08 | 8 | `NOT_ASSESSED`/`NOT_CREATED` |
| BRAG film acceptance | LFAC-01..12 | 12 | yes |
| **Combined declared app-level cases (v5 kit's own count)** | — | **120** | **120 NOT_RUN** (OBSERVED memory/evidence/FINAL-STATUS.json: `"all_app_acceptance": "NOT_RUN"`, `"total_app_interaction_cases": 120`) |

Candidate (non-application) test evidence that **does** exist and passed, per the kit's own claims: 306 existing behavior/JEV compiled-candidate tests, 60 Python + 21 Node uploaded-skill tests, 34 new package-contract tests — 421 total, 0 failures (OBSERVED evidence/FINAL-STATUS.json). These are fixture/unit tests against the standalone candidate core, explicitly not application, native, or live evidence per the kit's own repeated disclaimers.

---

## 8. Open decisions / conflicts for the Opus planner

1. **Terminology drift across kit versions.** v3/JEV-INTEGRATION.md says "84 app-level cases" (60 original + 24 JVAC); v4/keyboard-notes says "100 declared app-level cases" (84 + 16 NKAC); v5 says "120" (100 + 20 HSAC). v6's IMPLEMENTATION-PROMPT.md explicitly warns: "older embedded references to 84 or 100 describe earlier stages, not a reduced current scope" (line 25). The planner should treat **120** as current and ignore the smaller numbers appearing in older-but-still-shipped files inside the same kit (e.g. JEV-INTEGRATION.md itself still says 84 in its own body text even though it's bundled inside the v5/v6 kits that supersede that count).
2. **Model pin `jev-1.13.0`** is explicitly "a documented candidate pin... not proof your account can serve it" (JEV-INTEGRATION.md:63) as of 25 Sept 2026 — this will need re-verification, not blind trust, whenever this is actually wired.
3. **No file in this lane's scope names an actual Hindsight server release/commit/schema identity** — v6 explicitly requires this to be recorded "during actual integration" (HINDSIGHT-UPSTREAM-REQUIREMENTS.md:11) and states "None is certified by this package." This is a blocking unknown for HMSTEP-01/JVSTEP-03-equivalent work, not something this lane can resolve from kit text alone.
4. **The BRAG film's Notchview/X reference material was not actually retrieved** — v6's own evidence says the X clip fetch failed and Notchview's embedded video was never played (SOURCE-REGISTER.json REF-09, REF-10). Any planner assumption that "the reference film was analyzed shot-by-shot" would be wrong.
5. **The "keyboard-first" correction assumes an existing configured global shortcut** ("Existing shortcut assignments must be recovered and preserved, not guessed" — PRODUCT-BEHAVIOR.md:9; "No particular key combination has been newly mandated or proven available here" — PRODUCT-CORRECTION.md:17). Whether metis-2.0 HEAD actually has one registered is unknown to this lane — a repo-access lane must confirm before NK-03/NK-05 can be scoped as "verify" vs "build from scratch."

---

## 9. Files read in full (for traceability)

v6 kit: README.md, delivery/IMPLEMENTATION-PROMPT.md, memory/HINDSIGHT-UPSTREAM-REQUIREMENTS.md, launch-film/BRAG-LAUNCH-PROMPT.md, launch-film/STORYBOARD.json, launch-film/ACCEPTANCE.json, evidence/PACKAGE-CHECKS.json, evidence/SOURCE-REGISTER.json, MANIFEST.json.

v5 kit: README.md, IMPLEMENTATION-REPORT.md, evidence/FINAL-STATUS.json, keyboard-notes/{PRODUCT-CORRECTION.md, REQUIREMENTS.json, ACCEPTANCE-MATRIX.json, INTEGRATION.json}, jev/{JEV-INTEGRATION.md, JEV-ROLE-AND-BINDINGS.md, BACKLOG.json, QUALIFICATION.md, PROOF-OF-INTEGRATION.md}, jev/ACCEPTANCE-MATRIX.json (ids sampled), memory/{INTEGRATION.md, HOST-BINDINGS.md, HMSTEP-SKILL-CROSSWALK.json}, behavior/{PRODUCT-BEHAVIOR.md, INTERACTION-EXAMPLES.md, REQUIREMENTS.json}, behavior/ALL-ACCEPTANCE.json + ADDITIONAL-ACCEPTANCE.json (ids sampled, structure verified), delivery/{HOST-BINDINGS.md, CAPABILITY-MATRIX.json (head), INTEGRATION-BACKLOG.json (ids/titles for all 20 CXSTEP + schema keys)}.

Baselines: confirmed presence/structure of `Metis-Work-Session.x` (r11 origin + previous-repair patch), `Metis-HeyClicky-Interaction-Upgrade.x` (source of CXSTEP/CXAC/CXCAP), `hindsight-agent-memory-skill-v1.0.0.x` (55-file third-party skill, structure enumerated, content not needed beyond what memory/INTEGRATION.md already summarizes).

r11 MASTER: targeted `grep` across all 5363 lines for keyboard/hotkey/JEV/Hindsight/HeyClicky/command-voice terms plus full section-heading map, to establish what r11 already specifies vs what v2-v6 add. Full-file read not performed (out of this lane's specific scope; K01-master lane owns full r11 extraction).

Not read (out of lane scope / low marginal value given repetitive schema): full 2249-line ALL-ACCEPTANCE.json body (sampled ids + representative entries via NKAC/JVAC/BXAC full reads which share identical schema), full 1847-line R11-TASK-CROSSWALK.json (crosswalk only maps IDs back to TASK-NNN, no new requirement text), full contents of the 55-file third-party Hindsight skill reference bundle (already faithfully summarized by memory/INTEGRATION.md and memory/HOST-BINDINGS.md, which this lane did read in full — those files are the actual Métis-specific integration obligation, not the generic upstream skill prose).
