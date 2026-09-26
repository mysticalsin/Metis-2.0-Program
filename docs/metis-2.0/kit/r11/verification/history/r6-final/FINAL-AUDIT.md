# Métis 2.0 — r6 delivery-kit and orb refinement audit

**Verdict: ready as an implementation handoff for the owner-approved orb-only change. Not a product release certificate.**

Package **r6** contains the complete **revision-4.1** contract, updated HTML, presentation references, numbered task files and current checks. ARMED is a standalone mesh orb. The actual Métis application, repository, cloud configuration, native binaries and releases were not changed by this preparation.

## 1. Exact visual and interaction change

ARMED paints only one 64px mesh inside a transparent 72px button. There is no idle pill, background plate, decorative ring, status label, caption, placeholder, badge, composer, border beam or voice glow. A keyboard focus outline is available when needed. The resting Canvas does not run a continuous animation clock.

Click, Enter or Space opens typing with deliberate focus and no capture. A trusted **simulated** wake opens the bar and caption without programmatic focus theft. Hover/focus alone leaves the orb alone. The real product still needs explicit wake opt-in; an ARMED initial demo is not a changed fresh-install consent policy.

A dormant draft is parked separately when wake is accepted, never mixed into the voice input, and restored unchanged after dismissal. This closes a subtle failure in which preserving a draft could have made an apparently ARMED assistant ignore new wake events. Active typing/composition and ongoing approval/work remain protected against competing wake callbacks.

## 2. Measured scope preservation and checks

| Check | Actual result | Meaning |
|---|---:|---|
| Established requirements | **55 / 55 retained** | Same identifiers, not product passes. |
| Catalog use cases | **112 / 112 retained** | Per-case implementation and proof lanes preserved. |
| Root tasks | **66 / 66 retained** | Source-linked task bodies regenerated from current MASTER. |
| Owner commitments | **44 / 44 retained** | Entire agreed product scope remains mapped. |
| Golden integrated journeys | **12 / 12 retained** | Product journeys are not claimed run. |
| Historical findings | **20 / 20 retained** | Issue lineage and closure obligations preserved. |
| Broad synthetic-browser suite | **60 / 60 passed** | Current HTML in Chromium memory documents. |
| Orb/lifecycle edge suite | **25 / 25 passed** | New compact/modality/focus/draft/approval/lock cases. |
| Combined preview assertions | **85 / 85 passed** | Not native speech, service or release qualification. |
| Structural checks, before inventory | **31 / 31 passed** | Counts, exact IDs/bodies, mappings, common DAG, references and source links. |
| Complete offline integrity verifier | **32 checks, including checksum inventory** | Run on extracted kit; results must all pass. |
| Deliberately damaged temporary copies | **6 / 6 detected** | Changed master, missing asset, dropped case, broken link, forbidden ARMED bar and duplicate source ID. |
| Current synthetic screenshots | **17** | Actual rendered HTML stills, not real product screenshots. |
| External requests / JavaScript errors | **0 / 0 observed** | Only in the exercised synthetic documents. |
| React reference syntax transpilation | **0 diagnostics** | TypeScript 5.8.3 syntax transform only; not full typecheck/application compilation. |
| PDF reading edition | **122 pages** | Required identifiers retained, no out-of-page text blocks; selected visual pages inspected. |

The complete file inventory is in `CHECKSUMS.json`. It detects changed or missing bytes, **not** a trusted publisher signature. Product statuses remain NOT_STARTED / NOT_TESTED; no kit check supplies a native or live-service pass.

Current canonical Markdown SHA-256:

```text
0d808c7f6eaf5bbb183b62d2b53f65d286438aa2dbcdbb711c065c3287e68286
```

The master and PDF were intentionally updated; they are **not byte-identical to r5**. The complete agreed product identifiers remain. All eight original reference assets remain byte-identical to their recorded source inventory. Prior audit/results are archived under `history/r5/` and are explicitly historical.

## 3. What was exercised

Chromium **144.0.7559.96**, Linux, Playwright `page.set_content`, exact self-contained HTML. The browser clock was controlled to exercise timers and animation lifecycle deterministically; these runs are **not wall-clock latency, CPU, battery or GPU benchmarks**.

The suites cover 14 state controls and five scripted scenarios; standalone orb content/geometry; native button Enter/Space; hover/focus; typed drafts and dormant-draft parking; IME Enter/Escape; no submission during capture/work/approval; repeated approval; stale/duplicate wake generations; OFF → typing without rearming; simulated lock; no ongoing ARMED animation frames; hidden/reduced-motion pause; static graphics fallback; 320/390px layout; right-edge/light/high-contrast; keyboard focus; unresolved-result retention; all Settings destinations; synthetic Intelligence/Operator views; original expanded HTML module; and root-entry parity.

The demo uses a procedural Canvas/CSS mesh/glow approximation. It contains no microphone, actual speech detector, real action, browser automation agent, private knowledge, or network service. **Play** simulates “Hey Métis”; speaking into the room does not activate this HTML. Production must use the qualified requested Libraries.dev effects/native equivalents connected to the existing trusted controller.

## 4. Overlooked cases found and dealt with

The full 20-case disposition is in `OVERLOOKED-CASES.md`. The principal improvements are:

1. Separate compact rendering and tight DOM hit target; inactive expanded controls are truly hidden, not just transparent.
2. Passive wake no longer invokes focus even when the orb previously held keyboard focus. Deliberate typed entry is the focus-changing action.
3. A dormant saved draft does not make ARMED silently unresponsive; it is isolated from voice and later restored.
4. Busy/capturing/approval state protects input and the trusted-controller contract rejects stale or repeated work.
5. IME composition gets Escape/Enter first; Settings Escape is not commandeered by the command demo.
6. OFF, lock and wake permission are separate from surface visibility. Unlock does not revive old command authority.
7. ARMED and hidden/reduced-motion views do not keep the demo visual clock running; graphics failure retains an accessible static mesh.
8. The new source references retain the original TypeSafe R77. R78/R79 are unique, validated and included in the registry; a duplicate-reference negative probe was added.

A mouse-focus/high-contrast test initially assumed `:focus-visible` without entering keyboard modality. The harness was corrected to test real keyboard focus; it was not fixed by painting a permanent ring. The first failing report is retained under `history/r6/`. An incomplete early wall-clock test attempt is explicitly excluded from pass counts. The final two browser suites ran to completion after the last behavior changes.

## 5. Native obligations the browser cannot prove

**A visually small orb can still sit inside a large invisible native window.** The DOM suite verifies the page target and surrounding hit behavior only. Codex must reduce/test the actual Windows/AppKit window and input region over a second real application, including right-side taskbar/Dock, mixed DPI, monitor removal and keyboard recovery.

The view reference does not grant execution authority. Real capture provenance, wake detection, stream cleanup, stale generations, exact approval, cancellation, unsaved work, remote meeting acknowledgment and postcondition verification remain trusted-core obligations. An invisible local view does not prove a remote meeting assistant stopped. OS privacy indicators and independent meeting status must not be removed for minimalism.

The React integration source has a distinct compact branch and updated callbacks. No full React dependency build, native library build, VoiceOver/Narrator test, platform GPU measurement, real backend call, sign-in, install/update or code signing was performed. All such gates remain in the complete contract.

## 6. Local viewing and portability boundary

The root and main lab are self-contained HTML/CSS/JS and require no CDN, npm install, API key or microphone to render in a compatible permitted browser. Their relative links and fragments are checked structurally.

This managed Chromium environment rejected `file://` navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. It was **not bypassed**. Tests instead rendered the exact HTML into memory. This does not establish that double-click or loopback navigation worked here. The optional loopback-only helper is retained for environments where local serving is authorized; it was not exercised in this r6 run. Screenshots and readable source are available when policy prohibits local preview navigation.

No font files, symlinks, organizational credentials, `node_modules`, automatic dependency installers or product patches are bundled. The code graph/index references are engineering guidance, not a claim that the target repository has already been indexed.

## 7. Finish in the real application

Start from `CODEX-START.txt` in the authorized actual repository. MASTER §5.11 integrates this refinement into the existing 55/112/66 contract. It preserves Cloudflare privacy, optional local models, Jev/Laya, Mantu Intelligence, Dust writes, cloud skills, Settings, Teams/Entra, lean installation, native Mac and signed Windows requirements.

The original unread Claude artifact, exact promised refactoring skill, actual onboarding video, authorized cloud/tenant/supplier inputs, native hardware and signing credentials remain explicit prerequisites where needed. The included desktop-control video is not the missing onboarding film. Missing access must not erase scope or manufacture successful evidence.

## 8. Reproduce

From the extracted kit, run:

```text
python3 verification/verify_bundle.py
python3 tools/read_task.py --task 30
```

Windows may use `py` instead of `python3`. In an already authorized Playwright/Chromium environment, run `verification/browser_checks.py` and `verification/orb_checks.py`, directing optional `--report` outputs outside the immutable kit. `verification/negative_checks.py` mutates only temporary copies. No bundled helper installs dependencies or changes the Métis repository.

The final ZIP is separately CRC-tested and its extracted folder is verified with the complete 32-check inventory. Changing any bundled file afterward requires an intentional reviewed inventory regeneration; it cannot be presented as the same verified kit.

**Conclusion:** the current handoff reproduces the requested orb-only ARMED state and tightens tested preview behavior while preserving the full upgrade scope. This is measurable delivery-kit quality, not a claim of an absolute best product or universal correctness.
