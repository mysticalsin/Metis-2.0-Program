# Métis 2.0 — final Codex delivery-kit audit

**Verdict: ready as an implementation handoff. Not a product release certificate.**

Package edition **r5** integrates the complete unchanged revision-4 contract with the requested HTML visual context, original references, numbered task files and reproducible checks. No app repository, provider configuration, live portal, Entra tenant, Dust workspace or signing service was modified here.

## 1. Measured completeness

| Check | Observed result | What it establishes |
|---|---:|---|
| Preserved product requirements | **55 / 55** | Exact IDs match the canonical source, not just a heading count. |
| Preserved catalog use cases | **112 / 112** | Each retains a requirement, implementation and golden-test lane. |
| Root task definitions | **66 / 66** | Every generated task file contains its exact source task body and source reference. |
| Owner commitments | **44 / 44** | All requirements are covered by explicit owner-request mappings. |
| Golden integrated journeys | **12 / 12** | Full proof scripts retained; none are marked run by this kit. |
| Historical findings | **20 / 20** | Existing issue/finding lineage preserved. |
| Structural checks before checksum inventory | **26 / 26 passed** | IDs, coverage, task bodies, common dependency DAG, files and input integrity. |
| Synthetic-browser checks | **59 / 59 passed** | The delivered UI works for the exercised states and interactions in Chromium memory documents. |
| Deliberately damaged-copy probes | **4 / 4 detected** | Changed master, missing reference, dropped case and broken HTML link are rejected. |
| Browser external requests / JS exceptions | **0 / 0 observed** | In the tested synthetic documents; also supported by no-capture/no-network code checks and restrictive CSP. |
| Synthetic screenshots | **14** | Actual rendered stills of the delivered visual reference, not app or provider proof. |

The final offline verifier adds a **complete file/checksum inventory check**, yielding **27 structural/integrity checks**. Run `python3 verification/verify_bundle.py` on the extracted folder; it returns a nonzero exit code for a failed check. The SHA-256 inventory detects changed bytes, not trusted publisher identity or cryptographic code signing.

The canonical Markdown digest is:

```text
7bdb9c186d739c443350e66a6764b3c95f82dfbc551130bb0dd8e3a4ed1a887d
```

The supplied 145-page PDF is copied unchanged, not regenerated into a divergent scope. The current-text HTML contains every requirement, task and use-case ID and links to the new lab. The original HTML's command module remains separately available; its obsolete scope/counts are not another implementation contract. The eight original reference assets are byte-identical to the mounted inputs. No font files, symlinks, credentials, node_modules, automatic installers or application patches are included.

## 2. What the browser tests actually exercised

Chromium **144.0.7559.96**, **Linux** host, Playwright `page.set_content` in-memory documents. The suite covers 14 state controls; caption-above/orb-inside geometry; exclusive stop/send visibility; keyboard expansion; persistent drafts; Shift+Enter and IME; inert HTML-looking text; four scripted scenarios; interrupted/replaced sequences; explicit approval; bounded answer scrolling; manual/OS reduced motion; hidden-tab animation suspension; all five Settings destinations; synthetic Intelligence evidence; honest Operator readiness; a 390px narrow typing layout; light theme; the original five-state HTML module; and the current root entry page.

All result text, audio levels, actions and provider statuses are **synthetic**. The lab has no microphone, speech detector, external inference, real knowledge, Teams participation or device-control API. Play simulates wake; saying the name alone does not trigger this HTML. It is a build reference, not a misleading half-implemented assistant.

The main mesh/glow is original procedural Canvas/CSS. The original module retains the supplied orb PNG/CSS. The React integration source uses documented Libraries.dev imports but was **not installed or compiled against the actual Métis repository**. Production component/version/native parity qualification remains TASK-030 and its relevant slices.

## 3. Defects found and corrected during this last check

1. **Obsolete HTML scope:** separated the old visual module from its obsolete specification and generated a complete current-text HTML edition from MASTER.
2. **Hidden controls:** explicit display rules overrode the HTML hidden attribute, exposing both Stop and Send. Added a safe hidden rule and behavioral checks.
3. **Event bubbling/state reset:** a broad `[data-state]` binding also attached to the workspace container. Nested clicks reset the state. Restricted binding to real state buttons and tested approval and inert text afterward.
4. **Narrow controls:** the Play label could stack into a tall narrow button. The narrow layout now gives Play a full row; the regression test checks its height and input containment.
5. **Harness isolation:** each HTML document uses a fresh page. CSP-safe function predicates avoid an unsafe-eval test dependency; browser protection was not disabled to make a test pass.

`history/browser-initial.json` preserves the first completed failing run. Intermediate screenshot-heavy batch attempts exceeded tool deadlines and are not counted as passing evidence. The final interaction suite ran to completion without screenshot work interleaved; fourteen stills were then captured in separate bounded batches. Package observations were corrected rather than labelled product defects.

## 4. Portability and viewing boundaries

The main lab and root entry are self-contained HTML/CSS/JS. They require no npm installation, CDN, network call, microphone or API key to render in a compatible browser. The full contract viewer uses a local iframe and relative package links; all local paths/fragments are checked structurally.

The managed Chromium environment blocked direct file:// and loopback navigation. Tests therefore render the exact generated HTML into memory rather than weaken that policy. This does **not** establish that double-click or local-server navigation was exercised here. The included optional loopback-only server is for environments where policy permits it. If local viewing is prohibited, Codex can inspect the included screenshots, source and state map; no security-policy workaround is required.

The common task prerequisite graph was checked for cycles. Scoped platform/provider slice semantics are preserved in `plan/SCOPE-HANDOFFS.md`; Codex must bind their actual output nodes and integration evidence in the target repository. The kit does not pretend the source navigation index is already a complete codebase graph.

## 5. The actual product is still unverified here

All generated product records deliberately remain **NOT_STARTED / NOT_TESTED** pending reconciliation with the real repository. This preparation ran no native Windows/macOS application, no live speech/provider request, no Dust write, no Teams meeting, no installed-product performance/quality benchmark, no cloud deployment and no signing operation.

Remaining genuine inputs and external gates are recorded in `plan/BLOCKERS.md`: current source/deployment access, original unread Claude artifact, the exact promised refactoring skill, the actual onboarding video, credentials/tenant/supplier approvals, Windows signer/native runners, and Apple public-distribution/PCC prerequisites. The included Jev MP4 is the original desktop demonstration, **not** the missing onboarding film.

These do not erase scope or justify stopping unrelated engineering. They prevent false claims of coverage of unseen inputs or completion of unexecuted integrations. The 55/112/66 contract and its rejection conditions remain authoritative.

## 6. Reproduce and resume

1. Extract into a dedicated new handoff folder; preserve the existing repository and instructions.
2. Open `OPEN-METIS-2.html`; inspect Play, the state controls, original HTML, screenshots and reference footage.
3. Run `python3 verification/verify_bundle.py` (Windows: `py verification/verify_bundle.py`).
4. Read `CODEX-START.txt` in the existing authorized AskToto-Mantu workspace; start TASK-001 and the early P1/input lane after its prerequisites.
5. Load one task with `python3 tools/read_task.py --task 30` or one master section with `--section 5`.
6. Re-run the optional synthetic suite only in an approved existing Playwright/Chromium environment; save new results **outside the immutable kit**, or intentionally regenerate the inventory after approved changes. No dependency installer is bundled.

Evidence JSON files: `structure-results.json`, `browser-results.json`, `capture-results.json`, `negative-results.json`, `QUALITY-SUMMARY.json`, and the final `CHECKSUMS.json`. Keep these package checks separate from `PRODUCT-EVIDENCE-TEMPLATE.json` and `plan/PRODUCT-STATUS.json`.

**Quality conclusion:** the delivered contract, visual context, task inventory and tested synthetic interface are coherent and usable as a Codex handoff. No finite review proves an “absolute best” implementation or universal correctness. The acceptance criteria and actual signed-artifact/service evidence—not this ZIP's appearance—decide the quality of the completed upgrade.
