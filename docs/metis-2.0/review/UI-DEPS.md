# UI effect dependencies: thinking-orbs, border-beam, voice-glow

Ticket: M2-0092 (W4, m6). Kit references R05, R06, R07, R08, R09, R78, R86; finding K07-BLK-ui-deps. Recorded
2026-09-27 against:

- the public app, `mysticalsin/AskToto-Mantu` branch `m2/integration` at `6aa8cb36b8c0bfddfb5a364d300d3fb74b635245`;
- the npm registry documents and tarballs as served on 2026-09-27;
- `Jakubantalik/Libraries.dev` `main` at `f20116327f4e3b28d0fb70b04437dfd092bf88fe` (and the commits named below);
- Electron `v43.6.0`, the version the app pins (`package.json:122`).

Labels: OBSERVED (read off a registry document, tarball, source file, doc page or CI log at the stated identity),
DERIVED (computed or reasoned from OBSERVED facts), ASSUMED (taken without an owner answer), UNKNOWN (not
established; the step that would establish it is named).

This is a recommendation. Per the lead note nothing was installed into the app, and `package.json` and
`package-lock.json` are unchanged; the install belongs to M2-0093, the ticket that first mounts the beam and the
glow. Under D-28 no repository code ran on a Mac: tarballs were downloaded and read, never executed.

## 1. Verdict

| Package | Pin | Where Métis uses it | Verdict |
|---|---|---|---|
| `thinking-orbs` | `0.3.1` (already in the lockfile) | The ARMED orb and the orb inside the expanded pill. Already shipped through `BrandThinkingOrb` and `AgentStatus` | Keep 0.3.1 and change the manifest range `^0.3.1` to the exact `0.3.1`. Do not move to 0.3.2 (section 3) |
| `border-beam` | `1.4.1` | The animated beam around the expanded pill | Adopt, in the expanded surface only, under the host contract in section 6.3 |
| `voice-glow` | `0.2.1` | The sound-responsive glow at the bottom of the pill | Adopt for the Electron renderer, driven by `level` only (never `stream`, never `useMicrophone`), under section 6.3. The native Mac glow is built in-house (section 7) |

All three are MIT, have no runtime dependencies, no install-time scripts and no known advisories (sections 4
and 5). Their weak point is supply-chain provenance, not their code (section 5.3).

## 2. Registry facts (OBSERVED)

Each tarball was downloaded and its SHA-512 recomputed. Every digest matches the registry's `dist.integrity`, and
thinking-orbs 0.3.1 also matches the app's lockfile entry (`package-lock.json:11927-11936`).

| | thinking-orbs 0.3.1 | thinking-orbs 0.3.2 | border-beam 1.4.1 | voice-glow 0.2.1 |
|---|---|---|---|---|
| Published (UTC) | 2026-08-11 19:07 | 2026-09-22 08:06 | 2026-09-22 15:55 | 2026-09-22 15:55 |
| `latest` dist-tag | no | yes | yes | yes |
| `repository` | `Jakubantalik/thinking-orbs` | `Jakubantalik/Libraries.dev`, `packages/thinking-orbs` | `Jakubantalik/Libraries.dev`, `packages/border-beam` | `Jakubantalik/Libraries.dev`, `packages/voice-glow` |
| `gitHead` | `bd204b73c9b6660fad7210b1ad48d9dc2adbb89d` | `5e7afad5fc8f3661e0bf0b4cd3f87de482ffcf16` | `740b349cd601710388c9334abd0320718d32b286` | `740b349cd601710388c9334abd0320718d32b286` |
| Provenance | SLSA v1 attestation: GitHub-hosted runner, `Jakubantalik/thinking-orbs` tag `v0.3.1` = `bd204b73`, `.github/workflows/publish.yml`, run 31526191621. Its subject SHA-512 (`dc11b569…9e244b`) equals the recomputed tarball digest | none | none | none |
| `dependencies` | none | none | none | none |
| `peerDependencies` | react >=18 | react >=18 | react, react-dom >=18 | react, react-dom >=18 |
| preinstall / install / postinstall / prepare | none | none | none | none |
| Files, unpacked size | 23, 55,080 B | 26, 130,686 B | 6, 198,683 B | 6, 147,663 B |
| Licence (`package.json` and `LICENSE`) | MIT | MIT | MIT | MIT |

Integrity strings: see section 8.

Version history (OBSERVED): thinking-orbs 0.1.0 to 0.3.1 all carry provenance and 0.3.2 is the first without it.
border-beam has six versions since 2026-04-12, none with provenance. voice-glow was created on 2026-09-17 and has
two versions. The step from border-beam 1.4.0 to 1.4.1, and from voice-glow 0.2.0 to 0.2.1, changes only the
CommonJS entry name in `package.json`: the `src/` blobs at their `gitHead`s (`b7c588f1`, `90a10ad2`, `740b349c`)
are identical. The same npm account published every version of all three packages.

The only external modules the bundles import are `react` and `react/jsx-runtime`, using React 18 APIs (`forwardRef`, `useId`, hooks). The
app has React 18.3.1 (`package.json:129`), so the peer ranges hold (DERIVED).

## 3. Which source the kit reviewed

OBSERVED: the blobs the kit records as reviewed (`kit/r11/visual/vendor/PROVENANCE.json`: `lattice.ts`
`f4f9126c`, `core.ts` `ee10dfa8`, `profiles.ts` `8517ed23`, `presets.ts` `d366ce71`, `LICENSE` `0e9405a2`) are the
Libraries.dev blobs at thinking-orbs 0.3.2's `gitHead` `5e7afad5`, still unchanged on `main`.

OBSERVED: the installed 0.3.1 was built from `Jakubantalik/thinking-orbs@bd204b73`. There `lattice.ts` is the same
blob, but `core.ts` (`6e0b1eb6`), `profiles.ts` (`386986ea`), `presets.ts` (`b2b44ae8`) and `morph.ts` (`cebec976`)
differ.

DERIVED from a line diff of those four files, every 0.3.1 to 0.3.2 change is additive or opt-in:

- `presets.ts` adds a size-32 preset to each state; the 64 and 20 presets are unchanged.
- `profiles.ts` adds `countDots`.
- `morph.ts` adds an opt-in `shape` hold; with `shape` unset the loop is unchanged.
- `core.ts` lets the painters take an optional `tint`; the grayscale path computes the same expression.

For Métis's inputs (sizes 64 and 20, no colour, no shape), 0.3.1 therefore draws the geometry the kit reviewed,
and solving parity with the kit does not need 0.3.2. What 0.3.2 does add is `gravity`, which hides the system
cursor document-wide through a `<style>` element appended to `document.head` (`dist/index.es.js:282-287`, opt-in).
It also more than doubles the bundled size (section 6.1) and drops provenance. Keep 0.3.1.

OBSERVED: `ThinkingOrbProps` in 0.3.1 has no `dark` prop (`dist/types.d.ts`), but the MASTER section 6.1 sketch
passes `dark={theme === 'dark'}` (`kit/r11/spec/MASTER.md:531`). M2-0093 should pass `theme`. The sketch's other
props exist in the pinned versions: BorderBeam `size`, `colorVariant`, `strength`, `theme`, `active`; VoiceBeam
`level`, `processing`, `active`, `paused`, `colorVariant`, `theme` (`dist/index.d.ts` of each).

## 4. Licence

OBSERVED: MIT, "Copyright (c) 2026 Jakub Antalik". The `LICENSE` file in all five tarballs examined (the four above
and border-beam 1.3.0) is git blob `0e9405a2`, the same blob as each package's `LICENSE` in the repository and the
licence the kit reviewed.

DERIVED: MIT requires the copyright and permission notice in "all copies or substantial portions of the Software".
The published bundles carry no legal comment, so the Vite-built renderer contains no notice. The shipped
`THIRD_PARTY_NOTICES.md` (copied into the package by `electron-builder.yml:86-87`) covers only models and runtime
binaries (`THIRD_PARTY_NOTICES.md:1-6`). thinking-orbs therefore already ships without its notice today, as do the
other bundled npm packages. One notice block covers all three libraries (same holder, same text). A follow-up is
proposed in section 9. This is an engineering reading of the licence text, not legal advice.

OBSERVED: libraries.dev also sells a "Pro" tier (site navigation). Nothing in the three tarballs refers to it.

## 5. Security posture

### 5.1 Advisories and audit

- OBSERVED: the GitHub Advisory Database (`GET /advisories?ecosystem=npm&affects=<name>`) returns 0 advisories for
  each package.
- OBSERVED: npm's bulk advisory endpoint, the source `npm audit` queries, returns `{}` for thinking-orbs 0.3.1 and
  0.3.2, border-beam 1.4.1 and voice-glow 0.2.1.
- OBSERVED: the Security job of baseline run
  [36267674617](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36267674617) (head `56677e7d`, job
  108475352877) ran `npm audit --audit-level=critical`: "found 0 vulnerabilities". Its next step,
  `node scripts/check-audit.mjs`, printed "OK — no high/critical advisories outside the documented carve-out". That
  tree includes thinking-orbs 0.3.1. On the current head `6aa8cb36`, run
  [36303098291](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36303098291) stopped its Security job
  at the workflow-pin check, before the audit steps, for a reason unrelated to this ticket.
- DERIVED: the ticket's verification command, `npm audit --omit=dev`, cannot see these packages. The repository keeps
  renderer dependencies in `devDependencies` (`package.json:89`; thinking-orbs at `:135`), and `npm audit` leaves
  omitted dependency types out of the report (npm/cli `v10.9.8`,
  `docs/lib/content/commands/npm-audit.md:114-117` and `:145`; CI runs npm 10.9.8). The gate that covers them is
  the full `npm audit` the Security job already runs (`.github/workflows/build.yml:141-147`). Because none of the
  three has dependencies, adopting border-beam and voice-glow adds exactly two packages to that tree.
- UNKNOWN: the Sigstore certificate chain of the 0.3.1 attestation. Its subject digest was matched to the tarball,
  but the signature was not verified. `npm audit signatures` in the Security job would verify registry signatures
  and attestations across the installed tree (section 9).

### 5.2 Code surface

A pattern scan of the four ESM bundles (not a line-by-line audit) finds none of: `fetch`, `XMLHttpRequest`,
`WebSocket`, `eval`, `new Function`, dynamic `import()`, `innerHTML`, `dangerouslySetInnerHTML`, `localStorage`,
`sessionStorage`, `postMessage`, `window.open`, `Worker` (OBSERVED). What is present:

| Surface | Where (OBSERVED) | Consequence for Métis (DERIVED) |
|---|---|---|
| Inline `<style>` elements rendered by React | border-beam `BorderBeam.tsx:304` (`dist/index.es.js:2281`); voice-glow `VoiceBeam.tsx:546` (`dist/index.es.js:1329`) | They work because the renderer CSP allows `style-src 'self' 'unsafe-inline'` (`src/renderer/index.html:26-27`). Hardening the CSP to nonces or hashes would break both |
| `css` prop | Both components append the caller's string verbatim to the generated stylesheet (same lines) | A CSS injection sink: never pass user- or model-supplied text |
| Microphone and Web Audio | voice-glow `useMicrophone` calls `getUserMedia` with echo cancellation, noise suppression and auto gain off (`useMicrophone.ts:33-35`); a `stream` prop creates a shared `AudioContext` and one `AnalyserNode` per instance (`audio.ts`, `voiceDriver.ts:859-867`). With `level` alone no `AudioContext` is created | Pass `level` only. MASTER already forbids the `useMicrophone` demo (`kit/r11/spec/MASTER.md:544`). M2-0093 needs a component test that the expanded surface never calls `getUserMedia` and never constructs an `AudioContext` |
| Document-wide observer | thinking-orbs with theme `auto` watches `class` and `data-theme` on the whole `document.documentElement` subtree (0.3.1 `dist/index.es.js`, theme hook) | Pass an explicit theme. The app already does: `AgentStatus` defaults to `dark` and `BrandThinkingOrb` runs its own loop |
| Wrapper-scoped observers | border-beam and voice-glow: `IntersectionObserver`, `ResizeObserver`, `MutationObserver` on their own wrapper | Cleaned up on unmount |

### 5.3 Supply chain (OBSERVED unless marked)

- One maintainer account for all three packages.
- Provenance exists only for thinking-orbs up to 0.3.1. For everything else, `gitHead` is the publisher's own
  claim.
- The repositories moved. GitHub redirects `Jakubantalik/border-beam` to `Jakubantalik/Libraries.dev`, created
  2026-04-12, the day border-beam 1.0.1 was published. thinking-orbs left its own repository, last pushed
  2026-08-16, for the monorepo at 0.3.2.
- Tags do not track releases. Libraries.dev has tags `v1.2.0`, `v1.3.0`, `1.4.0` (`36d4d491`) and
  `voice-glow@0.2.0` (`a5606cb3`), but the npm `gitHead`s of border-beam 1.4.0 (`b7c588f1`) and voice-glow 0.2.0
  (`90a10ad2`) are different commits, and 1.4.1, 0.2.1 and thinking-orbs 0.3.2 have no tag at all.
- No `SECURITY.md` and no disclosure channel: the GitHub community profile lists only a licence and a README.
- Release age on 2026-09-27: border-beam 1.4.1, voice-glow 0.2.1 and thinking-orbs 0.3.2 are 5 days old;
  voice-glow as a package is 10 days old.
- Name confusion. The component is called `VoiceBeam`, and the npm name `voice-beam` had one version, published and
  unpublished on 2026-09-16; it has no live version. npm's policy states only that the unpublishing owner cannot
  republish for 24 hours (`npm/documentation` `content/policies/unpublish.mdx:34`). Whether another account can
  register the name is UNKNOWN. Install by exact name, version and integrity only.
- DERIVED spot check that the tarballs match their declared source: distinctive constants from the `gitHead`
  sources appear in the bundles. border-beam has the 30 fps pulse interval `1e3 / 30 - 2`, the
  `rootMargin: "256px"` observer and the paused-animation rule; voice-glow has `1e3 / 60 - 2`, the 4 s pace probe and
  the three disabled audio-processing flags. This is not a reproducible build: whether the bytes equal a clean build
  of `740b349c` is UNKNOWN.

DERIVED: the exposure is a future bad release, not the reviewed bytes. Exact versions plus lockfile integrity under
`npm ci` already fix the bytes. Any version bump repeats sections 2 to 5, and `npm audit signatures` guards the
installed tree (section 9).

### 5.4 Open upstream defects (OBSERVED, Libraries.dev issues)

- #15: malformed `rgba(r, g, b,, a)` values in the forest, candy, ice and gold palettes, which browsers discard.
  The 1.4.1 bundle holds 112 of them, 28 in each of those four palettes and none in `colorful` or `mono` (DERIVED
  count over `dist/index.es.js`). Métis uses `colorful` and is unaffected.
- #12: ThinkingOrbsKit draws the reduced-motion or paused frame at a different instant from the web build. This is
  native only.
- #9: the Swift packages cannot be added by URL (section 7).

## 6. Cost in the Electron renderer

### 6.1 Bundle

Sizes of the published ESM files each package contributes (OBSERVED); `gzip -9` computed here.

| Package | Files bundled | Raw | gzip -9 |
|---|---|---:|---:|
| thinking-orbs 0.3.1 (shipped today) | `index.es.js`, `engine.es.js` | 22,930 B | 7,720 B |
| thinking-orbs 0.3.2 (not recommended) | `index.es.js`, `index-B8WsUNf5.js` | 51,518 B | 14,768 B |
| border-beam 1.4.1 | `index.es.js` | 99,219 B | 14,146 B |
| voice-glow 0.2.1 | `index.es.js` | 54,914 B | 16,406 B |

DERIVED: adopting border-beam and voice-glow adds at most about 154 KB of JavaScript before Vite minifies it.
`sideEffects: false` lets Vite drop voice-glow's `useMicrophone` when it is not imported, but border-beam's
stylesheet generators for all five variants stay, because the variant is chosen at run time (`styles.ts:1407-1427`).
Against the unchanged 1.9 GiB installer gate (`electron-builder.yml:92`) this is negligible. UNKNOWN: parse and
compile time on the overlay's wake path. M2-0093 measures it against the wake-to-first-frame budget (MASTER
section 7).

### 6.2 Per-frame work

DERIVED from the source at the reviewed commits. Nothing here was measured.

| | thinking-orbs 0.3.1 | border-beam 1.4.1, size `md` | voice-glow 0.2.1 |
|---|---|---|---|
| Driver | One `requestAnimationFrame` loop per mounted orb, uncapped: it runs at the display rate, 60 or 120 Hz | CSS keyframes animate the registered custom property `--beam-angle` (1.96 s spin), which feeds conic-gradient masks on two pseudo-elements, plus a 12 s hue-rotate keyframe unless `staticColors`. No JS loop for `md` | One shared `requestAnimationFrame` loop for all instances, capped at about 60 fps, dropping to half rate on slow devices (`voiceDriver.ts:170-186`) |
| Work per frame | Clear and redraw a 128 x 128 backing canvas. Solving at 64 draws 138 dots: `latRings` 9 (10 rows, pole to pole) at longitude density 24, from the preset (`count` 0.35 over the base 15 x 40) and `lattice.ts:143-150`. Each dot passes through up to 14 moves, then is projected, z-sorted and filled. Solving at 20 draws 30 dots | Style recalculation and repaint of the masked stroke, the inner glow and the blurred bloom every display frame. Animating a custom property is not a compositor-only animation; the author says so for the pulse variants (`pulseDriver.ts:5-14`), which moved to a 30 fps JS driver, but `md` did not | Custom properties for seven lobes, a per-frame `clip-path` on the warp layers, a redraw of the band canvas or canvases, an SVG `feDisplacementMap` filter on two mirror layers while `distortion` > 0 (default 0.62), and a blurred bloom |
| Still running when nothing happens | Yes, until paused or unmounted | Yes, while `active` | Yes. The default `idle` of 0.23 keeps a breathing glow. `paused` holds the frame but the shared loop keeps ticking; only `active={false}` (after its fade) or unmounting stops it |
| Stops itself when | Off-screen (`IntersectionObserver`); `visibilitychange` to hidden; `paused`; reduced motion draws one static frame | Off-screen, with a 256 px margin (`animation-play-state: paused`, `styles.ts:1231-1238`); `active={false}` | Off-screen; `active={false}`; `paused` |
| Reduced motion | Stock `ThinkingOrb` draws a static frame. The app's `BrandThinkingOrb` ignores reduced motion on purpose (SRC-14, in M2-0093's scope) | Not handled for `sm`, `md` or `line`: only the pulse variants have a reduced-motion rule (`styles.ts:2055`, `:2242`) | Breathing, flow and hue drift stop; the reaction to the level continues, as a meter |

DERIVED, specific to Electron: the overlay window is created with `backgroundThrottling: false`
(`src/main/index.ts:2608`, `:2643`). Electron documents that with throttling disabled "the visibility state will
remain `visible` even if the window is minimized, occluded, or hidden" (`docs/api/browser-window.md:129-130` at
`v43.6.0`). An `IntersectionObserver` measures against the page's own viewport, which does not change when the OS
window hides. So none of the three libraries stops itself when the overlay is hidden, minimised or covered; each
keeps drawing until the host stops it. This is the mechanism M2-0009, M2-0039 and ADR-018 already record for the
existing orb loop.

### 6.3 Host contract for M2-0093

DERIVED from section 6.2 and MASTER sections 5.11 and 6.1.

1. ARMED mounts only the orb. border-beam and voice-glow are mounted only while the pill is expanded and are
   unmounted when it collapses. Unmounting also removes their `<style>` elements and observers.
2. One motion policy drives the orb's `paused` and the beam's and glow's `active`. It is fed by the main-process
   presenter signal (ADR-018), reduced motion and the energy policy, never by `visibilityState`.
3. Pass explicit themes and `colorVariant="colorful"` (section 5.4). Never pass the `css` prop.
4. voice-glow receives `level={() => brokerLevel}` only: no `stream`, no `useMicrophone`, no `getAudioContext`. The
   level is clamped to 0..1 before it reaches the view (MASTER section 6.1).
5. Measure the expanded state on the packaged app (M2-0093's MEASURED evidence and the M2-0200 gate), recording CPU,
   GPU and frame time. If it misses the MASTER section 7 budget, first set voice-glow `distortion={0}`, which removes
   the displacement filter and its two mirror layers (`VoiceBeam.tsx:564`), and border-beam `staticColors`, then
   measure again. Consider replacing a library in-house only if that still fails.

## 7. Native macOS and iOS ports (R08, R09)

| Component | Native source | Declared minimum | Build note |
|---|---|---|---|
| ThinkingOrbsKit | `packages/thinking-orbs/ports/ios/ThinkingOrbsKit`, `Package.swift` blob `34460994` | iOS 15, macOS 12 | Pure Swift, no resources |
| BorderBeamKit | `packages/border-beam/ports/ios/BorderBeamKit`, `Package.swift` blob `c3c30539` | iOS 17, macOS 14 | `BeamShaders.metal` becomes `default.metallib` only through Xcode's build system (manifest comment; libraries.dev/beam: "Build through Xcode") |
| Voice glow | None. `packages/voice-glow` has no `ports/` directory, and libraries.dev/voice offers React only | n/a | n/a |
| Métis native target | `native-app/project.yml:20-22`; `native-app/MetisKit/Package.swift:12` | macOS 14.0, iOS 17.0 | xcodegen project, built through Xcode |
| Métis Electron app (for comparison) | `electron` 43.6.0 | macOS 12. Electron 38 removed macOS 11 (`docs/breaking-changes.md:302-306` at `v43.6.0`); Electron 44 will require macOS 13 (`:15-21`) | The renderer uses the npm packages, not these ports |

OBSERVED: both `Package.swift` blobs equal the ones the kit inspected (R08, R09) and are unchanged on `main`.

DERIVED, reconciled: the two ports declare different minimums (macOS 12 and macOS 14), but both are at or below the
native target's macOS 14.0 and iOS 17.0, so adopting both changes no deployment target. The npm packages have no OS
floor of their own. They need Chromium features (registered custom properties, conic gradients, `mask-composite`)
that Electron 43.6.0's Chromium 150.0.7871.250 provides (`DEPS:4-5` at `v43.6.0`).

OBSERVED, consumption: SwiftPM uses a package by URL only when `Package.swift` sits at the repository root
(`swiftlang/swift-package-manager` `Sources/PackageManagerDocs/Documentation.docc/ReleasingPublishingAPackage.md:7`
at `24a8a7b0`). Libraries.dev has no root manifest; upstream issue #9 reports exactly this, and libraries.dev/orbs
and libraries.dev/beam show `.package(path: …)`. DERIVED: the native app must vendor both kits at a pinned
Libraries.dev commit as local packages, with their `LICENSE` and a provenance note (section 9). ThinkingOrbsKit
comes with upstream issue #12.

Decision (DERIVED from `kit/r11/integration/NATIVE-PARITY.md:7` and MASTER section 6.2,
`kit/r11/spec/MASTER.md:548-550`): the native voice glow is an in-house SwiftUI implementation, driven by the same
trusted scalar level and labelled as an adaptation, not as the library.

## 8. Exact pins for the adoption change

For M2-0093, in `devDependencies` (the repository's convention for renderer code):

```json
"border-beam": "1.4.1",
"thinking-orbs": "0.3.1",
"voice-glow": "0.2.1",
```

The lockfile must resolve them to exactly these integrity values:

| Package | `integrity` |
|---|---|
| thinking-orbs 0.3.1 | `sha512-3BG1aeB1RUTxItCml/BBuIz5JRM4kZqGuyx+vouv0fXTtcR9ZNoKjWGneHPx94y74GxgArwJZ1qbJR5dt54kSw==` |
| border-beam 1.4.1 | `sha512-YyugmKjrhkg1PBC1ZKX7JvFo/zYzha6NXOq24VWrnvBYmDRvGCgFS9oxZoKJ+oS9Kn436l1etYGlAdGiWK+3ag==` |
| voice-glow 0.2.1 | `sha512-Lpc+Ppd788kCDC88p9Hr8u3eFQh0X/hdISX76hqx1/x4BZiidrmCuQRLOE+jGOIkqB1BdaFBJ7F2rg1GsST6tw==` |

Changing thinking-orbs to an exact version also rewrites the lockfile's root entry (`package-lock.json:50`, now
`^0.3.1`). The lockfile is regenerated in CI, not on a Mac (D-28). M2-0093's `scope_paths` do not list
`package.json` or `package-lock.json` today.

## 9. Follow-ups proposed to the lead

- Ship notices for bundled npm packages: generate `THIRD_PARTY_NOTICES.md` entries from the lockfile for every
  package whose code lands in the renderer or main bundle, including the Libraries.dev MIT notice, and fail CI when
  a bundled package has none (section 4).
- Vendor ThinkingOrbsKit and BorderBeamKit into `native-app` at a pinned Libraries.dev commit, as local packages with
  licence and provenance, build BorderBeamKit's Metal shader through Xcode in native CI (after M2-0050), and build
  the in-house native voice glow (section 7).
- Add `npm audit signatures` to the Security job (section 5.1).
- Amend M2-0093: add `package.json` and `package-lock.json` to its scope, take section 8's pins, and adopt section
  6.3 as acceptance.

## 10. Acceptance of this ticket

| Acceptance | Status | Evidence |
|---|---|---|
| Versions pinned in the lockfile | PARTIAL | thinking-orbs 0.3.1 is locked with its integrity (`package-lock.json:11927-11936`). border-beam 1.4.1 and voice-glow 0.2.1 are chosen, with integrity, in section 8, but the lead note bars installing them in this ticket, so their lock entries land with M2-0093 |
| Licence and npm audit review recorded | MET | Sections 4 and 5.1 |
| Native package minimum macOS versions reconciled, or an in-house implementation decided | MET | Section 7: both ports fit the macOS 14.0 target; the native voice glow is in-house |
| Verification `npm audit --omit=dev` | Replaced | It cannot cover `devDependencies` (section 5.1). The full `npm audit` evidence and the advisory queries are cited instead |

## 11. Sources

npm registry (fetched 2026-09-27): `https://registry.npmjs.org/thinking-orbs`, `/border-beam`, `/voice-glow`,
`/voice-beam`; tarballs `thinking-orbs-0.3.1.tgz`, `thinking-orbs-0.3.2.tgz`, `border-beam-1.3.0.tgz`,
`border-beam-1.4.1.tgz`, `voice-glow-0.2.1.tgz`; `/-/npm/v1/attestations/thinking-orbs@0.3.1`;
`POST /-/npm/v1/security/advisories/bulk`.

GitHub: `Jakubantalik/Libraries.dev` at `f2011632`, `5e7afad5`, `740b349c`, `b7c588f1`, `90a10ad2`, plus tags,
community profile and issues #9, #12 and #15; `Jakubantalik/thinking-orbs` at `bd204b73` and its tags;
`GET /advisories?ecosystem=npm&affects=…`; `electron/electron` at `v43.6.0` (`docs/breaking-changes.md`,
`docs/api/browser-window.md`, `docs/api/structures/web-preferences.md:77-83`, `DEPS`); `npm/cli` at `v10.9.8`;
`npm/documentation` at `d1cbe2e2`; `swiftlang/swift-package-manager` at `24a8a7b0`.

Documentation pages (fetched 2026-09-27, sha256): `https://libraries.dev/orbs` (`f635531f…`),
`https://libraries.dev/beam` (`cf1face5…`), `https://libraries.dev/voice` (`8e5dd8e3…`). `orbs.html`, `beam.html`
and `voice.html` redirect to these.

App at `6aa8cb36`: `package.json`, `package-lock.json`, `src/renderer/index.html`, `src/main/index.ts`,
`src/renderer/src/components/BrandThinkingOrb.tsx`, `src/renderer/src/components/AgentStatus.tsx`,
`electron-builder.yml`, `THIRD_PARTY_NOTICES.md`, `.github/workflows/build.yml`, `native-app/project.yml`,
`native-app/MetisKit/Package.swift`. CI runs 36267674617 and 36303098291.

Kit (this repository): `kit/r11/integration/DEPENDENCIES.json`, `kit/r11/integration/NATIVE-PARITY.md`,
`kit/r11/visual/vendor/PROVENANCE.json`, `kit/r11/spec/MASTER.md` (sections 5.1, 5.11, 6.1, 6.2 and references
R05 to R09, R78, R86).
