# SRC-REVERIFY — Re-verification of the 24 source-export findings against HEAD

**Ticket:** M2-0013 · **Type:** investigation (docs/process only; no code changed) · **Owner model:** sonnet
**Repo re-verified (read-only):** `mysticalsin/AskToto-Mantu` — `git -C /Users/tony/AI-Brain-build/metis-operator-ux show origin/m2/integration:<path>`, HEAD **`70de3c303a047879afd8651a78b41c0ce85dcc3c`** ("Merge pull request #205: agent rules for the Métis 2.0 program [M2-0024]", 2026-09-26T16:20:02-04:00). No file in that checkout was created, modified, or deleted by this ticket.
**Prior pass re-verified here:** `metis-v2-review/lanes/K05-master-s22-31.md` §2.8, taken against HEAD `2bf21f1c` (v1.9.6). **`2bf21f1c` is not an ancestor of the current `origin/m2/integration`** — the git history was rewritten 2026-09-26 (owner operating rule) — so this ticket does not diff commit ranges; every claim below is a fresh, direct read of the file content at the two named refs.
**Source-export inputs:** `metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/references/source/metis-1.9.5-export.txt` (kit copy, read-only) and `metis-v2-inputs/r11/Metis-2.0-Upgrade-Kit-r11/source-review/FINDINGS.json` (the 24 findings' `source_observation`/`required_change` text) + `architecture/MAP-COVERAGE.json` (the 19 file-backed architecture-map nodes, 14 present / 5 `NOT_IN_EXPORT`).
**Evidence labels:** **OBSERVED** (read directly in the cited file at the cited ref), **DERIVED** (reasoned from OBSERVED facts), **ASSUMED**, **UNKNOWN** (anchor read, disposition not established this pass).

---

## 0. Executive summary

1. **SHA-256 of the export re-confirmed OBSERVED.** `shasum -a 256 metis-1.9.5-export.txt` = `efc8af651c1b2abb952d7737d5f3f3d15c4e51057059a07ceb3445c65f5c53f3` — matches §29/R80's cited prefix `efc8af65…` exactly (K05 flagged this as un-re-hashed "a binary I don't have"; CRITIC-CON-11 named this gap directly — it is now closed).
2. **Mechanical diff run for real, for all 19 MAP-COVERAGE.json file-backed nodes, including the 5 `NOT_IN_EXPORT` files** (§2). 10 of 14 export-present files are **byte-identical** (post-whitespace-trim) to the current HEAD; 3 (`src/preload/index.ts`, `src/main/operator-ingest.ts`, `operator/src/index.ts` — see table) show small, real drift; `operator/src/store.ts` grew by 47 net lines (real diff traced in the table; unrelated to SRC-02/17, see §2). The 5 `NOT_IN_EXPORT` files (`App.tsx`, `main/index.ts`, `listen.ts`, `transcripts.ts`, `brain/ingest.ts`) all exist at HEAD and were read live, per K07's original flag.
3. **SRC-04 is re-anchored with a concrete, currently-live residual defect** (§3): the successor file `src/main/command-control.ts` (not `metis-command-runtime.ts`, which now only *proposes*) implements exactly the completion-verification boundary SRC-04/F-06 demanded — `CommandControl.confirm()` refuses to promote an `'unknown'` adapter outcome to success. But **no desktop adapter (`src/main/desktop-adapters.ts`) ever returns `'verified'`** — every `okResult()` call site passes (or defaults to) `'unknown'`. The result, live and wired end-to-end (`ipcMain.handle(IPC.metisCommandConfirm, …) → commandControl.confirm() → executeDesktopAction()`, `metis-command-register.ts:43` proposes from the real voice-command runtime): **every desktop-command confirmation on HEAD today returns `{ ok: false, reason: 'outcome_unverified' }` to the user, for every adapter, on both platforms.** This is not a new defect to file — it is exactly the gap four existing TODO tickets (M2-0082, M2-0083, M2-0084, M2-0085) already scope to close; this pass supplies the missing "is it actually still broken at HEAD" evidence for closing SRC-04/F-06 in the acceptance registry once those tickets land.
4. **All 11 previously-UNKNOWN SRC findings are now re-verified with file:line evidence** (§4): none are FIXED outright. Three (SRC-13 speaker voiceprints, SRC-22 nine recap layouts, and the licensing half of SRC-02) show **real, substantial mitigation** since the export — an explicit policy off-switch, a `deleteProfile` API, and (for SRC-02) legacy licensing being deliberately, consistently, and documentedly compiled off end-to-end rather than left half-wired. The rest (SRC-14, 15, 16, 17, 18, 21, 23, 24) still reproduce essentially as described, several with the owner's own docs now *explicitly acknowledging* the gap as a conscious, reviewed trade-off rather than an oversight (SRC-14's "always animates" comment; SRC-21's AUDIT-LOG.md "Erasure stance — decided, not accidental" section). None of these were closed by this pass; none should be marked closed in the acceptance registry without the owner disposition each one's evidence trail below points at.
5. **F-01…F-20 all have an owning TODO/IN_PROGRESS ledger ticket** (§6) — none are orphaned. Two (M2-0002, M2-0011) are IN_PROGRESS; the other 20 ticket-slots are TODO. §5's blockers (no acceptance registry / `CURRENT.md` / `source-review/SOURCE-INDEX.json` at repo root) still hold at current HEAD — re-checked, still absent.
6. **No new defect requires a new ledger ticket.** Every gap this pass found (the live `outcome_unverified` dead end, the `operator/src/index.ts` silent `memoryStore()` fallback for SRC-17, CI's missing `swift test`/`license-server npm test` jobs for SRC-24) already has an owning TODO ticket whose stated scope covers it. This pass's job was reproduction evidence, not remediation — none of it was fixed here.

---

## 1. Repo + export grounding (OBSERVED)

| Check | Result |
|---|---|
| `origin/m2/integration` HEAD | `70de3c303a047879afd8651a78b41c0ce85dcc3c` |
| Export SHA-256 | `efc8af651c1b2abb952d7737d5f3f3d15c4e51057059a07ceb3445c65f5c53f3` — matches §29/R80's `efc8af65…` prefix. Re-hashed directly this pass (`shasum -a 256` on the kit's own copy); CRITIC-CON-11 is closed. |
| `2bf21f1c` (K05's HEAD) reachable from `origin/m2/integration`? | **No.** `git log 2bf21f1c..origin/m2/integration` walks the entire unrelated history back to the initial commit (50 unrelated "AskToto CLI" / "Enterprise hardening" commits) — confirms the owner's 2026-09-26 history-rewrite note; `2bf21f1c` is not an ancestor post-rewrite. All comparisons below are direct reads of file content at each ref, never a `git diff` across that range. |
| `source-review/SOURCE-INDEX.json`, `CURRENT.md`, an acceptance-registry JSON | **Still not found** at `origin/m2/integration` HEAD (`git ls-tree -r` — searched for `CURRENT.md`, `SOURCE-INDEX`, `acceptance-registry`, `readiness`; only unrelated `docs/qa/2026-09-12-release-readiness.md` and `*-readiness.ts` files matched). K05's §5 blockers #1/#2 are unresolved at current HEAD, not merely unresolved at the older HEAD it read. |

---

## 2. Mechanical diff — export vs. HEAD, all 19 MAP-COVERAGE.json nodes

**Method (read-only, ran for real this pass):** a small script (kept in this session's scratch directory, not committed — reproducible from the command below) parses `metis-1.9.5-export.txt`'s `FILE:` sections, and for each of `MAP-COVERAGE.json`'s 19 file-backed nodes either (a) diffs the export's section text against `git show origin/m2/integration:<path>` via `difflib.SequenceMatcher`, or (b) for the 5 `NOT_IN_EXPORT` nodes, just confirms the file is readable at HEAD and reports its line count.

```
python3 diff-export.py   # EXPORT_PATH=metis-kit-r11/.../metis-1.9.5-export.txt, REF=origin/m2/integration
```

| Path | In export? | Status at HEAD | Detail |
|---|---|---|---|
| `src/renderer/src/App.tsx` | No | `NOT_IN_EXPORT` | Present, 4,277 lines. |
| `src/preload/index.ts` | Yes | **CHANGED** | export 556 lines → HEAD 563 lines; ~13 added / 6 removed (SequenceMatcher ratio 0.983). |
| `src/main/index.ts` | No | `NOT_IN_EXPORT` | Present, 9,518 lines. |
| `src/main/screen-capture.ts` | Yes | IDENTICAL | — |
| `src/renderer/src/lib/listen.ts` | No | `NOT_IN_EXPORT` | Present, 3,153 lines. |
| `src/main/parakeet.ts` | Yes | IDENTICAL | — |
| `src/main/asktoto-shot.ts` | Yes | IDENTICAL | — |
| `src/main/llm.ts` | Yes | IDENTICAL | — |
| `src/main/transcripts.ts` | No | `NOT_IN_EXPORT` | Present, 1,272 lines. |
| `src/main/brain/ingest.ts` | No | `NOT_IN_EXPORT` | Present, 2,817 lines. |
| `src/main/brain/store.ts` | Yes | IDENTICAL | — |
| `src/main/operator-ingest.ts` | Yes | **CHANGED** | export 509 → HEAD 513 lines; ~18 added / 14 removed (ratio 0.969). |
| `operator/src/index.ts` | Yes | **CHANGED** | export 631 → HEAD 632 lines; ~23 added / 22 removed (ratio 0.964). |
| `operator/src/store.ts` | Yes | **CHANGED** | export 843 → HEAD 890 lines; ~55 added / 8 removed (ratio 0.964) — real unified diff (below) shows the growth is a new `mergeOwnedAsk` idempotency helper and `insertAsk`/`insertPulse`/`recordPulseSession` returning `boolean` for dedup, not a production-store guard. `memoryStore()` itself, and the `OperatorStore` interface it implements, are **already present in the 1.9.5 export** — the SRC-02/SRC-17 concern (§4) is old, pre-export debt that grew rather than a regression. |
| `operator/client/main.ts` | Yes | IDENTICAL | — |
| `license-server/lib/app.mjs` | Yes | IDENTICAL | — |
| `license-server/lib/store.mjs` | Yes | IDENTICAL | — |
| `intelligence/src/App.tsx` | Yes | IDENTICAL | — |
| `intelligence/src/lib/brainAdapter.ts` | Yes | IDENTICAL | — |

**Reading this table (DERIVED):** 10/14 export-present nodes are untouched since the 1.9.5 snapshot — most of §29's file-anchored claims about these files are still directly checkable against the export text itself, not just against HEAD. `operator/src/store.ts` — the same file SRC-02/SRC-17 anchor to (§4) — grew by 47 net lines, but a real unified diff (not just the stat) shows the growth is unrelated `mergeOwnedAsk`/dedup logic, not a fix for either finding; SRC-02/17's `memoryStore()` mechanism was already present in the export, unchanged, and is still there today. The 5 `NOT_IN_EXPORT` files remain a hard gap in the *kit's own* source register (this is a K07/SRC-01 finding about the export's completeness, not something this diff can fix) — all 5 were read live from HEAD instead, both here and by K05/L01-L12.

---

## 3. SRC-04 re-anchored (ticket acceptance criterion 2)

**Original claim (source-export, FINDINGS.json):** `flushPending` in `src/main/metis-command-runtime.ts` awaits `executeDesktopAction` but ignores the returned `ok`/`outcome` before `mark_committed`.

**K05's finding at `2bf21f1c`:** the `flushPending`/`mark_committed` shape is gone from `metis-command-runtime.ts` entirely (grepped, zero hits); the file's own docstring says execution is "deliberately deferred... this runtime never calls it"; `executeDesktopAction` is wired in `index.ts` instead. K05 marked this "relocated — cannot confirm or refute" and named `index.ts`'s command-confirmation path as the next locus (cross-ref CRITIC-CON-9, CRITIC-INV-8).

**This pass, at `origin/m2/integration` HEAD (OBSERVED):**

- `src/main/metis-command-runtime.ts` (241 lines) is **unchanged in shape** from what K05 read: it still only produces a *proposal* (`ingestTranscript` → `reduceMetisCommandSession` → `state.proposal`), never executes anything. Its own `maybeDisambiguate` (line 82: `void this.maybeDisambiguate(...)`) still discards a remote Jev decision's result — but the comment directly above it (`// Advisory only. A remote response cannot create, alter, or execute a proposal.`) now states this is deliberate policy, not an oversight; F-08's "discarded decision" concern is *this specific line*, now documented as by-design rather than silent.
- Execution genuinely lives in **`src/main/command-control.ts`** (169 lines, new file, not present in the 1.9.5 export or in K05's read): `CommandControl.confirm()` (`command-control.ts:85`) does exactly what SRC-04's `required_change` asks —
  ```ts
  const result = await this.deps.execute(proposal.request)          // :98
  if (result.id !== proposal.request.id) { ...; return { ok: false, reason: 'adapter_failed' } }   // :99-101
  this.audit('command.confirmed', { actionId: proposal.request.id, outcome: result.outcome })       // :103
  if (result.ok && result.outcome === 'verified') return { ok: true, outcome: result.outcome }      // :104
  if (result.ok && result.outcome === 'unknown') return { ok: false, reason: 'outcome_unverified' } // :105
  return { ok: false, reason: 'adapter_failed' }                    // :106
  ```
  (`src/main/command-control.ts:98-106`, quoted verbatim). This is a real fix for the *original* SRC-04 defect (a result silently discarded before commit) — the result is consumed, audited, and gates the return value; an exception is caught and treated as `adapter_failed` (`:107-109`).
- **The residual gap, confirmed live:** `src/main/desktop-adapters.ts:88`'s `okResult()` helper defaults its `outcome` parameter to `'unknown'`, and **all 14 of its call sites** across `executeMac`/`executeWin` (create-note, open-Notes, open-Arc, google-search, open-X, Photo-Booth-capture, Sticky-Notes, Notepad, camera) pass `'unknown'` explicitly (lines 182-264) — grepped for `'verified'` as a literal in the file: **zero hits**. So `CommandControl.confirm()`'s `result.outcome === 'unknown'` branch is the *only* branch any real adapter call can ever reach; `'verified'` is unreachable code on both platforms today.
- **This is live, not scaffolding:** `src/main/index.ts:987-988` constructs `commandControl = new CommandControl({ execute: executeDesktopAction, ... })`; `index.ts:4680` (`ipcMain.handle(IPC.metisCommandConfirm, ...)`) calls `commandControl.confirm(...)` directly from a renderer IPC channel; `src/main/metis-command-register.ts:43` calls `commandControl.propose(...)` from the real `MetisCommandRuntime`'s `onState` callback, i.e. from an actual parsed voice command, not a test harness.

**Disposition: RELOCATED + PARTIAL.** SRC-04's *originally described* bug (silently discarded result) is fixed in the new location. The *underlying requirement* ("adapters returning failed/unsupported/unknown/cancelled never produce verified success" — SRC-04's own `exit_evidence`) is technically satisfied (unknown never becomes verified) but at the cost of **no adapter can currently produce a positive user-facing outcome at all**: every confirmed desktop command today resolves to `outcome_unverified` (or `adapter_failed` on a genuine OS error) — functionally indistinguishable from failure to the end user, even when the OS action visibly succeeded (Notes opened, browser opened, etc.). **No new ticket needed** — M2-0082 ("typed action results and independent postcondition verifier"), M2-0083 ("wire the command path... verified adapter result"), M2-0084/M2-0085 (mac/Windows adapters "with readback") already scope exactly this: build the AX/UI-verification layer that lets a real adapter call return `'verified'`. This pass's contribution is the concrete, current-HEAD confirmation that the gap is real, live, and user-visible today, for whoever picks those tickets up next.

**F-06 cross-reference:** F-06 ("Ignored adapter result... unknown/failure never becomes verified") is the historical finding this maps to. Its "ignored result" half is fixed; its "never becomes verified" half remains true for a different reason (no adapter tries) than the original one (result was discarded) — F-06's disposition in §6 reflects this nuance rather than a flat OPEN/CLOSED call.

---

## 4. The 11 previously-UNKNOWN SRC findings — re-verified at HEAD

Each row: `source_observation`/`required_change` from `source-review/FINDINGS.json` (kit, read-only) vs. what's actually at `origin/m2/integration` HEAD today.

### SRC-02 — Separate entitlement authority from telemetry and legacy licensing (P0 ARCHITECTURE_GAP)

**OBSERVED at HEAD:** `src/main/license.ts`'s own header now states plainly (and `docs/qa/BUG-LEDGER.md:2209` independently documents the same thing as a tracked ledger row): device licensing is **compiled off** in the shipped app — `src/renderer/src/App.tsx:311` `const LICENSE_ENFORCEMENT = false`, `src/renderer/src/components/Settings.tsx:201` `const LICENSE_UI_ENABLED: boolean = false` — so `<LicenseGate>` never renders, the only activation UI never renders, and `licenseGateEnabled`'s 12h heartbeat (gated on `licenseGateEnabled && licenseValid`) can never fire. `license-server/lib/license-gate.mjs:11-12` independently enforces the pair can't drift server-side ("if an operator sets LICENSE_ENFORCEMENT without also explicitly setting LICENSE_UI_ENABLED to the same value, we do NOT serve a drifted pair"). A real Ed25519 offline-lease system was added since the export (`license-lease-key.ts`, `verifyLease`/`checkLicenseGrace` in `license.ts`), with an explicit `embeddedLicenseLeasePubkeyAvailable()` check for "is this a real production key or the dev placeholder" (`license-lease-key.ts:81`) — **but that check is called nowhere** (grepped the whole tree outside its own file and tests: zero call sites), so "production rejects development trust roots" (the `required_change`'s explicit demand) is not actually enforced by any gate; it's a function someone could wire into a release check but hasn't.
**Disposition: PARTIAL.** The "conflicting gates" half of SRC-02 is resolved by making legacy licensing consistently, verifiably, and honestly *off* rather than half-wired — real, documented hardening beyond the export. The "one issuer/entitlement authority, production rejects dev trust roots" half is unresolved: Operator's `IssuedLicenseRow`/seat records (`operator/src/store.ts`) and the legacy JSON `license-server/lib/store.mjs` store still coexist with no reconciliation, and the dev-key-detection function exists but gates nothing.

### SRC-13 — Speaker labels are not biometric identity or action authority (P0 SOURCE_POLICY_CONFLICT)

**OBSERVED at HEAD:** `src/main/speaker-id.ts`'s persistent voiceprint store (`userData/voiceprints.json`) and Teams-VTT "auto-enrollment flywheel" (`autoEnrollFromLabeledWindows`, lines 191-197) still exist essentially as the export describes almost word-for-word ("folds that buffer into a permanent voiceprint under the real name — zero user effort"). New since the export: a `deleteProfile(name)` API (line 199, wired at line 491) and a dedicated policy off-switch with its own test file (`src/main/speaker-id-off-switch.test.ts`). No callsite anywhere in `src/**` gates a *desktop command* on a speaker match (grepped `speaker` near `commandControl`/`executeDesktopAction`: no hits) — the "no speaker score authenticates desktop commands" half of the requirement holds.
**Disposition: PARTIAL.** Persistent-identity-without-explicit-opt-in is still the architecture; a real off switch and a real delete path exist now (not in the export), but no evidence an off *default* (session-local-only by default, matching `required_change`'s "Keep default attribution session-local and uncertain") was verified this pass — that would need reading the off-switch's actual default value, which is `L`-lane / renderer-Settings territory, not re-traced here.

### SRC-14 — Use the real solving motion without defeating accessibility (P1 SOURCE_POLICY_CONFLICT)

**OBSERVED at HEAD:** `src/renderer/src/components/BrandThinkingOrb.tsx:5-7`, verbatim: *"Always animates: Windows Show animations off maps to OS reduce media query and the stock ThinkingOrb freezes to one frame — that killed the product identity. Still pauses when the document is hidden or the host is off-screen."* Unchanged from the export era.
**Disposition: REPRODUCES (deliberate, documented).** The OS reduced-motion signal is explicitly, knowingly overridden by product decision; hidden/offscreen pausing is honored. This is the clearest case in this pass of a finding that is not a bug so much as an un-adjudicated conflict between an accessibility requirement and a stated product-identity decision — flagged for an explicit owner disposition (accept the trade-off in writing, or implement the "shared MotionPolicy" `required_change` asks for), not something a code fix alone can "close."

### SRC-15 — Reconcile onboarding contract and recover the real media lineage (P1 DOCUMENT_AND_MIGRATION)

**OBSERVED at HEAD:** `src/renderer/src/lib/onboarding-hero-video.ts` — the April-29 "lady looking at space" clip is now a **packaged local Vite asset** (`../assets/onboarding-hero-lady-planet.mp4`), with the CloudFront URL kept only as a "documented mirror / future refresh source," not the runtime default — this resolves the export-era "auto-local-download" ambiguity the finding raised. `docs/design/ONBOARDING-FLOW.md:14` still says, verbatim, **"No Skip."**
**Disposition: PARTIAL.** The media-lineage/asset-availability half is resolved (real, licensed, locally-bundled asset, not a placeholder or a dangling remote reference). The "allow reduced/static educational presentation" half of `required_change` is still in direct tension with the explicit "No Skip" policy in the same document.

### SRC-16 — Profile-aware package gates, OS descriptions and docs must change together (P0 SOURCE_POLICY_CONFLICT)

**OBSERVED at HEAD:** no single "capability manifest" artifact exists (grepped for `capability-manifest`/`CAPABILITY_MANIFEST` across `*.ts`/`*.json`: zero hits). What does exist, and postdates the export: a real chain of build-time enforcement scripts wired into `package.json`'s `prebuild`/`postbuild`/`dist*` scripts — `check-offline-package.mjs`, `check-built-offline.mjs`, `check-no-dynamic-import.mjs`, `ensure-intelligence-bundle.mjs` — that fail the build rather than merely documenting intent.
**Disposition: PARTIAL.** Real automated gating exists where the export had none, but it is a set of discrete point-checks, not the single declared "capability catalog" `required_change` calls for; a profile-aware, single-source manifest driving install/runtime-readiness/optional-pack decisions was not found.

### SRC-17 — A development-store seam is not production durability (P0 ARCHITECTURE_GAP)

**OBSERVED at HEAD (this is the strongest "still fully open" finding in this pass):** `operator/src/index.ts:206` and `:623`, verbatim: `const store = opts.store ?? (env.DB ? d1Store(env.DB) : memoryStore())` — identically in both `routeRequest` (the request handler) and the `scheduled` cron handler. **If the Worker's `DB` (D1) binding is ever unbound in a real deployment** (misconfigured environment, wrong `wrangler.toml` target, a new environment that forgot the binding), **the Worker silently serves every request from a fresh, per-invocation, non-persistent in-memory store** — no error, no `/health` failure field keyed to it (`env.OPERATOR_ENV` is read only for a cosmetic label, never used to gate store selection), no startup check. `operator/src/store.ts:490`'s `memoryStore()` is the same factory 38 `operator/` test files construct directly (`git grep -l "memoryStore(" -- 'operator/**'`) — there is no code-level distinction between "the test double" and "what production falls back to."
**Disposition: REPRODUCES, essentially verbatim from the export.** `required_change`'s core demand — "Production must reject placeholder/memory stores and wrong environment bindings" — has no implementation at HEAD.

### SRC-18 — Mirror-safe release delivery is a first-class gate (P0 OPERATIONAL_DEPENDENCY)

**OBSERVED at HEAD:** `scripts/push-both.sh` (18 lines, unchanged in nature) still just loops `git push $remote "$@"` over `github`/`origin` and reports per-remote OK/FAIL to stdout — no same-commit verification across remotes, no post-sync readback, no protected-tag check.
**Disposition: REPRODUCES.** Exactly the gap SRC-18 named; still a read-only-checkable static-code gap (the *live* mirror cadence/authority itself remains outside what a source-review pass can close, as K05 already noted).

### SRC-21 — Capture privacy copy must cover screenshots, titles, URLs and helpers too (P0 SOURCE_POLICY_CONFLICT)

**OBSERVED at HEAD:** `docs/AUDIT-LOG.md` has grown substantially since the export — real tamper-evidence (hash-chained records, `scripts/verify-audit-log.mjs`), a documented retention policy (20 generations, ~100MB), and a new, explicit **"Erasure stance — decided, not accidental"** section (lines 40-50) that states outright: *"Records are metadata-only; the identifying payload is limited to the actor email and file basenames derived from meeting titles... This stance is recorded here so a DPO reviews a decision, not an omission."* The specific audit call this pass traced (`screen-preprocess.ts:322-327`, `screen.preprocess.describe`) logs only `windowId`/`chars`/`mode` — no title, no URL, no OCR text.
**Disposition: REPRODUCES (deliberate, owner-flagged for DPO review).** The underlying practice (meeting-title-derived file basenames in metadata logs) is unchanged from the export, but it is now an explicitly documented, consciously-owned policy decision inviting DPO sign-off rather than an unexamined gap — materially different posture from "no real audit log discipline existed," even though the technical behavior SRC-21 flagged has not changed.

### SRC-22 — Preserve tailored recaps and human edits when moving skills server-side (P1 PRESERVE_AND_EXTEND)

**OBSERVED at HEAD:** `src/shared/mode-recap.ts` still defines all **nine** built-in recap layouts (`src/shared/ipc.ts:332-342`'s `CONVERSATION_MODES`, commented "The 9 built-in modes") — none dropped. `src/main/mode-skills.ts` (231 lines, new machinery not in the export) adds a real version/integrity check (`header.version !== entry.version` throws `ModeSkillIntegrityError`, line 44) and a SHA-256-locked skill manifest (`lock.skills[id] = { path, version, sha256 }`, line 189) — a genuine "versioned templates... with compatibility" mechanism.
**Disposition: PARTIAL, trending FIXED.** The regression risk SRC-22 warned about (a generic cloud summary replacing the nine tailored layouts) did not happen — all nine layouts are intact — and real version/integrity infrastructure was added since the export. This pass did not trace whether a regenerate/retry path can overwrite a human-accepted correction (the specific runtime guarantee `required_change` asks for); that's a narrower, still-open check for whichever lane owns the recap-edit runtime path.

### SRC-23 — Dust connector checklists do not prove canonical read/write (P0 IMPLEMENTATION_LIMIT)

**OBSERVED at HEAD:** `docs/verification/mi-5-dust-e2e.md` is still an **unchecked** manual checklist (`[ ]` boxes throughout), and its own text says so: *"The one thing that genuinely requires the real Dust OneDrive connector... is this checklist. It is Tony's to run, not automatable in CI."* `src/main/brain/publish.ts` (990 lines) — grepped for `revision`/`readback`/`conflict`/`principal`/`audience`: no matches — publishes a **plaintext markdown mirror** for Dust to read via its OneDrive connector; there is no canonical read/write mutation interface, matching the finding exactly.
**Disposition: REPRODUCES, verbatim.** No canonical Dust read/write path exists; the checklist required_change calls for "actual two-principal Dust read/write, conflict, regenerate, correction, revoke, deletion" evidence remains unexecuted.

### SRC-24 — Every workspace needs a real test/build/release coverage owner (P0 EVIDENCE_GAP)

**OBSERVED at HEAD:** `.github/workflows/build.yml` (grepped for `license-server`, `native-app`, `MetisKit`, `swift`: **zero hits** in any job). The workflow runs exactly 4 real jobs (confirmed via the owner-supplied baseline run `36267674617`: `gh api repos/mysticalsin/AskToto-Mantu/actions/runs/36267674617/jobs`, all `conclusion: success`) — **Quality checks (ubuntu-latest)**, **Quality checks (windows-latest)**, **Operator Worker (build + typecheck + tests)**, **Security & supply chain** — plus **macOS package**/**Windows package**, both `skipped` on that run. `license-server/package.json:13` has its own `"test": "node --test"` script; `native-app/MetisKit` has its own Swift package with tests (per K05's earlier read) — **neither is invoked anywhere in CI.**
**Disposition: REPRODUCES.** A full, currently-green CI run exists (real evidence the root/Electron and Operator suites pass on both OSes) — but it structurally cannot close SRC-24, because two of the workspace's own test suites (license-server, native Swift) are never run by it. This is the concrete evidence SRC-24's `required_change` ("no excluded workspace... can satisfy release evidence") asks someone to act on.

---

## 5. Full SRC-01…SRC-24 disposition at HEAD `70de3c30`

Carrying forward K05's `2bf21f1c` reads for the 11 items not in this ticket's kit_refs (SRC-03, 05-12, 19, 20 — spot-re-confirmed against HEAD this pass where cited; unchanged unless noted), plus §3-§4's fresh re-verification for the 13 items that are in kit_refs: SRC-01/02/04/13–18/21–24.

| ID | Sev/Class | Disposition at HEAD | Evidence |
|---|---|---|---|
| SRC-01 | P0 INPUT_LIMITATION | **N/A / self-resolving** (re-confirmed) | This and every lane already work from the real checkout; full baseline-suite execution across the whole tree is out of a read-only lane's scope (see SRC-24). |
| SRC-02 | P0 ARCHITECTURE_GAP | **PARTIAL** (§4) | `App.tsx:311`, `Settings.tsx:201`, `license-gate.mjs:11-12`, `license-lease-key.ts:81` (unused). |
| SRC-03 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `metis-command-runtime.ts:82` `void this.maybeDisambiguate(...)` still discards the result — now with an explicit "Advisory only" comment (§3). |
| SRC-04 | P0 SOURCE_DEFECT | **RELOCATED + PARTIAL** (§3) | `command-control.ts:88-99` (fixed: result now gates completion) / `desktop-adapters.ts` (residual: no `'verified'` outcome anywhere). |
| SRC-05 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `desktop-adapters.ts` — every `okResult()` call site still `'unknown'`; no general close-app/close-tab adapter exists. |
| SRC-06 | P0 IMPLEMENTATION_LIMIT | **REPRODUCES**, re-confirmed at HEAD | `src/shared/metis-wake.ts` unchanged, 48 lines, `stripWakeWord` at line 41. |
| SRC-07 | P0 SOURCE_POLICY_CONFLICT | **REPRODUCES**, re-confirmed at HEAD | `src/main/cloud-stt/credentials.ts:16` — the "seat a Cloudflare account API token" instruction string is unchanged. |
| SRC-08 | P0 SOURCE_POLICY_CONFLICT | **REPRODUCES**, re-confirmed at HEAD | `operator/src/ai-gateway.ts` (28 lines) — `ensureDefaultAiGateway` still never inspects the response, still a bare `catch {}`. |
| SRC-09 | P0 SOURCE_POLICY_CONFLICT | **PARTIAL**, re-confirmed at HEAD | `electron-builder.yml:131-141` — opt-in/encrypted/scanned embed path still exists as a supported mechanism. |
| SRC-10 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `operator/src/d1.ts:76,379`; `operator/src/dashboard.ts:736,1349` — same line numbers as K05's read; `ownedAskUpsertSql`/capped `listAsks(2000)` unchanged. |
| SRC-11 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `native-app/App/Store/PersistedModels.swift` — `try? context.save()`, encode/decode-failure-to-empty, unchanged. |
| SRC-12 | P0 IMPLEMENTATION_LIMIT | **Likely reproduces**, re-confirmed at HEAD | `MeetingController.swift:15,19` — nil-hook doc comment unchanged. |
| SRC-13 | P0 SOURCE_POLICY_CONFLICT | **PARTIAL** (§4) | `speaker-id.ts:191-199,491`; `speaker-id-off-switch.test.ts` (new). |
| SRC-14 | P1 SOURCE_POLICY_CONFLICT | **REPRODUCES** (deliberate, documented) (§4) | `BrandThinkingOrb.tsx:5-7`. |
| SRC-15 | P1 DOCUMENT_AND_MIGRATION | **PARTIAL** (§4) | `onboarding-hero-video.ts` (asset resolved); `ONBOARDING-FLOW.md:14` ("No Skip", unresolved). |
| SRC-16 | P0 SOURCE_POLICY_CONFLICT | **PARTIAL** (§4) | `package.json` prebuild/postbuild check-script chain; no single capability manifest found. |
| SRC-17 | P0 ARCHITECTURE_GAP | **REPRODUCES**, verbatim (§4) | `operator/src/index.ts:206,623` — silent `memoryStore()` fallback, both request and cron paths. |
| SRC-18 | P0 OPERATIONAL_DEPENDENCY | **REPRODUCES** (§4) | `scripts/push-both.sh` (18 lines) — no cross-remote verification. |
| SRC-19 | P0 SOURCE_CONTROL_GAP | **PARTIAL**, re-confirmed at HEAD | `.gitleaks.toml` (42 lines) — dated real gitleaks run documented; allowlist still broad path-glob. |
| SRC-20 | P0 SOURCE_DEFECT | **REPRODUCES**, re-confirmed at HEAD | `cloudflare-proxy/provision-embedded-key.mjs:107-113` — same line numbers as K05's read; `catch {}` around `secret list` unchanged. |
| SRC-21 | P0 SOURCE_POLICY_CONFLICT | **REPRODUCES** (deliberate, DPO-flagged) (§4) | `docs/AUDIT-LOG.md:40-50` ("Erasure stance — decided, not accidental"). |
| SRC-22 | P1 PRESERVE_AND_EXTEND | **PARTIAL, trending FIXED** (§4) | `mode-recap.ts` (9 layouts intact); `mode-skills.ts:44,189` (new version/integrity machinery). |
| SRC-23 | P0 IMPLEMENTATION_LIMIT | **REPRODUCES**, verbatim (§4) | `mi-5-dust-e2e.md` (unchecked checklist); `brain/publish.ts` (no revision/readback/conflict handling). |
| SRC-24 | P0 EVIDENCE_GAP | **REPRODUCES** (§4) | `.github/workflows/build.yml` — no `swift test`, no `license-server` test job; baseline run `36267674617` confirmed via `gh api`. |

**No SRC item may be marked closed in a future acceptance registry from this table alone** — per §29's own acceptance rule, a PARTIAL/REPRODUCES row here needs either a real code diff removing the pattern (re-read and re-confirmed) or an explicit owner-approved disposition (SRC-14, SRC-19, SRC-21 are the clearest candidates for the latter — each is now a *documented*, not merely *undiscovered*, trade-off).

---

## 6. F-01…F-20 disposition, with owning ledger ticket

Historical-audit-closure IDs (§23) cross-referenced against `docs/metis-2.0/ledger/tickets.json` `kit_refs` (every ticket whose `kit_refs` array names that F-ID). All 20 have at least one owning ticket beyond M2-0013 itself; none are orphaned.

| ID | Historical issue | SRC cross-ref | Disposition at HEAD | Owning ticket(s) (status) |
|---|---|---|---|---|
| F-01 | Embedded shared credentials | SRC-09 | PARTIAL — opt-in/encrypted/scanned, not removed | M2-0056 (TODO) |
| F-02 | Command authority drift | SRC-03/04 | PARTIAL — `CommandControl` now authenticates proposal ownership (nonce + `webContentsId`), but no adapter reaches `'verified'` (§3) | M2-0079 (TODO) |
| F-03 | Egress coverage gaps | — | UNKNOWN (out of this pass's anchors) | M2-0147 (TODO) |
| F-04 | Deployment-dependent auth | SRC-02 | UNKNOWN beyond SRC-02's licensing-compiled-off finding (§4) | M2-0145 (TODO) |
| F-05 | Unestablished multi-customer scope | SRC-02/17 | UNKNOWN beyond SRC-02/17 (§4) | M2-0145 (TODO) |
| F-06 | Ignored adapter result | SRC-04 | **PARTIAL — result no longer ignored; still never reaches "verified"** (§3, re-anchored this pass) | M2-0082, M2-0083 (both TODO) |
| F-07 | Incomplete actions / close missing | SRC-05 | REPRODUCES — confirmed at HEAD, no general close-app/tab adapter | M2-0084, M2-0085 (both TODO) |
| F-08 | Discarded Jev decisions | SRC-03 | REPRODUCES, now documented as deliberate ("Advisory only") (§3) | M2-0122 (TODO) |
| F-09 | Missing Laya integration | — | UNKNOWN (out of this pass's anchors) | M2-0124 (TODO) |
| F-10 | Capped-list aggregate | SRC-10 | REPRODUCES — confirmed at HEAD, same line numbers | M2-0106 (TODO) |
| F-11 | Late null overwrites usage | SRC-10 | REPRODUCES — confirmed at HEAD, same line numbers | M2-0106 (TODO) |
| F-12 | Incomplete usage/stream persistence | SRC-17 | REPRODUCES — SRC-17's silent memory-store fallback bears directly on this (§4) | M2-0106 (TODO) |
| F-13 | People/device/session conflation | SRC-13 | PARTIAL — see SRC-13 (§4) | M2-0106 (TODO) |
| F-14 | Onboarding/right-edge failures | — | UNKNOWN (owned by renderer/right-edge lanes, not re-checked here) | M2-0042, M2-0095, M2-0202 (all TODO) |
| F-15 | Legacy/managed privacy differences | SRC-21 | Bears on SRC-21's DPO-flagged posture (§4) | M2-0112 (TODO) |
| F-16 | Developer rediscovery | — | **Blocker unchanged**: no acceptance-registry/`CURRENT.md`/`SOURCE-INDEX.json` at HEAD (§1) | M2-0011 (IN_PROGRESS) |
| F-17 | Stale architectural assessments | — | UNKNOWN (out of this pass's anchors) | M2-0017 (TODO) |
| F-18 | Packaging mistaken for qualification | SRC-24 | Bears on SRC-24's CI-coverage gap (§4) | M2-0002 (IN_PROGRESS) |
| F-19 | Competing release feeds/policy | SRC-18 | Bears on SRC-18's mirror-verification gap (§4) | M2-0053, M2-0168 (both TODO) |
| F-20 | Unproven staging/restore | SRC-17 | Bears on SRC-17's production-store gap (§4) | M2-0103, M2-0159 (both TODO) |

**F-items left UNKNOWN this pass** (F-03, F-04 [partly], F-05 [partly], F-09, F-14, F-17): their anchors sit outside the 24 SRC files this ticket's scope covers (`kit_refs`) — they need the owning ticket's own implementation pass to establish current status, exactly as K05 flagged for the same rows. This is a scope statement, not a claim of resolution (§23's own rule).

---

## 7. R80 — the source-export register entry itself

**OBSERVED (kit, read-only):** R80 (`MASTER.md:4342-4346`) states the export's "source commit and actual deployed identities [are] unknown. 14/19 linked source sections present. No complete application execution." Every SRC-01…24 anchor is a *static* finding against this one 1.9.5 snapshot.
**This pass's addition:** the SHA-256 is now independently re-verified (§1), the "14/19 present" claim is now independently re-verified file-by-file with a real mechanical diff rather than assumed (§2), and all 5 of the "not present" files were confirmed to exist and were read live at HEAD (§2, §4). R80's caveat about not having a source commit/deployed-identity match is still true and cannot be resolved from a source-export text file alone — it would need the export's *actual* originating commit, which nothing in the kit records.

---

## 8. Open items for the Opus planner

1. **No new ledger ticket is warranted.** Every gap this pass reproduced already has an owning TODO/IN_PROGRESS ticket (§6); the SRC-04 residual (§3) sharpens M2-0082/83/84/85's acceptance criteria (they must make at least one real adapter path return `'verified'`, not just add more `'unknown'` returns) but does not need a new ticket of its own.
2. **Three explicit owner-decision candidates**, none of which a code change alone resolves: SRC-14 (accessibility vs. product-identity motion), SRC-19/SRC-21 (both already self-documented as conscious trade-offs inviting a DPO/owner sign-off, not silent gaps), SRC-02's dev-lease-key detector (`embeddedLicenseLeasePubkeyAvailable()`) sitting unused — someone should decide whether it's wired into `check:release` or removed as dead code.
3. **§5's blockers (F-16) are unchanged**: no acceptance-registry JSON or `CURRENT.md` exists at repo root on `origin/m2/integration` at the ticket's own re-verification time (2026-09-26). M2-0011 (traceability matrix + CI check, IN_PROGRESS) is the ticket to watch for this closing.
4. **This report does not re-open or re-score any F-item beyond what its cited SRC evidence supports** — F-03/04/05/09/14/17's UNKNOWN dispositions are carried forward unchanged and should not be read as "confirmed still open" without their owning ticket's own pass.

---

*End of SRC-REVERIFY. Written for ticket M2-0013. No file under `/Users/tony/AI-Brain-build/metis-operator-ux` (the public repo worktree) was created, modified, or deleted while producing this report — every code citation above is a `git show <ref>:<path>` read. This file itself lives only in the private `metis-2.0-program` clone and was not committed by this pass (per the ticket's operating rule, the lead commits program docs).*
