# Film toolchain: pins, proof render and measurements

Ticket: M2-0212 (W2, m11). Recorded 2026-09-27 against public PR mysticalsin/AskToto-Mantu#225, head
`495c8ec288e9459e43c6855846910305ec9a5be7` on `m2/M2-0212-film-toolchain-spike`. Labels follow the
software-architecture-engineer convention: OBSERVED (read off a run log, registry or source at the pin),
DERIVED (computed from OBSERVED facts), ASSUMED (a default taken without an owner answer).

The launch film (kit v6 `launch-film/BRAG-LAUNCH-PROMPT.md`) is produced with BRAG, which delegates composition
and rendering to Hyperframes. This spike proves that render path on the machine the film will use, with every tool
pinned, by rendering a 5-second 3840x2160 synthetic scene. No product, meeting or user content is in the scene.

## 1. Pinned toolchain

| Tool | Pin | Where the pin lives | Status |
|---|---|---|---|
| BRAG skill | `latent-spaces/brag` commit `c893c5ed52aed84e3e2ee56787de869fccdae6b0` (plugin 0.4.0, MIT). This was `main` HEAD on 2026-09-27; BRAG publishes no tags | This document. BRAG is an agent skill, not a package, so install it at this commit (section 6) | OBSERVED |
| Hyperframes CLI | npm `hyperframes@0.8.79` (Apache-2.0), integrity `sha512-Ng1ybAgmIALbYQ/awKhSl9waLmTTlNWneUpaYPE0PdTxVcD2GFpgirQfiPuAWJG5hQ4mX+n37ZCz2BNvE6ASZg==`, git tag `v0.8.79` = `0ae223773ac27c8966d8ef2de70f54b2501e55a2` | `film/toolchain/package.json` (exact version) | OBSERVED |
| npm dependency tree | 123 packages, all resolved from registry.npmjs.org with integrity hashes. Examples: puppeteer-core 25.12.0, @puppeteer/browsers 3.2.3, sharp 0.35.4, esbuild 0.25.12. The lockfile sha256 is `19d483b453f4b290f8b152685dcd6f0cbdb1f3b5ea5aa8efc81adf7be7ea05e8` | `film/toolchain/package-lock.json`, installed with `npm ci`. The lockfile was generated in CI (run 36287443916), not on a Mac (D-28) | OBSERVED |
| Chrome | `chrome-headless-shell` 152.0.7977.30 (Chrome for Testing, linux64) | Transitively, by Hyperframes 0.8.79 (`CHROME_VERSION` in `packages/cli/src/browser/manager.ts` at the tag). Fetched by `hyperframes browser ensure` before the render. The log shows `HeadlessChrome/152.0.7977.30, beginframe, headlessShell=true` | OBSERVED |
| FFmpeg | Ubuntu 24.04 package `7:6.1.1-3ubuntu5` (FFmpeg 6.1.1, libavcodec 60.31.102, libx264), with all eight libav* libraries from that source pinned to the same version | `.github/workflows/film-toolchain.yml` (`FFMPEG_VERSION`). Launchpad shows this as the only ffmpeg published for noble: it sits in the release pocket, which is never rewritten, and no noble-updates or noble-security version exists | OBSERVED |
| GSAP (composition runtime) | 3.14.2 from `cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js`, SRI `sha256-wXS/zlOnKUGNV6ithiXnJHx5OiL++OKFHjz6PenNgoA=`. Free under the GSAP Standard "no charge" license | `film/toolchain/composition/index.html`. The Hyperframes compiler inlines the script and refuses bytes that miss the SRI hash (`packages/producer/src/services/htmlCompiler.ts`, `ScriptIntegrityError`) | OBSERVED |
| Node.js | 22.22.3, the repository's `.nvmrc` | Workflow (`actions/setup-node`, pinned by commit SHA) | OBSERVED |
| Runner image | `ubuntu-24.04`. Image `20260920.314.1` ran the proof. GitHub rolls image versions weekly, so only the OS release is pinnable | Workflow `runs-on`. The image version is printed on every render | OBSERVED; image version not pinnable |
| Font | Not pinned. The composition names only the generic `sans-serif`, and the Hyperframes compiler substitutes Inter, downloaded at compile time from Google Fonts (11 faces) into `~/.cache/hyperframes/fonts` | Nowhere: this is Hyperframes' deterministic-font behaviour (`packages/producer/src/services/deterministicFonts.ts`) | OBSERVED; see section 5 |
| Telemetry | Off (`HYPERFRAMES_NO_TELEMETRY=1`) | Workflow env | OBSERVED |

## 2. The render machine

**ASSUMED: a GitHub-hosted `ubuntu-24.04` runner counts as a machine the owner approves.** D-28 (answered
2026-09-26) forbids running repository scripts and the app on any Mac and sends test runs to GitHub Actions. The
lead notes for this ticket make the same assumption for renders. The ticket asks for renders "never during the
owner's meetings". A runner is not the owner's machine and takes none of its CPU, memory or network, so a render
there cannot compete with a meeting. **DERIVED:** that criterion is met by construction and needs no calendar
gating. If the owner wants film renders on a specific machine instead, that machine becomes a new pin in this table.

Runner capacity during the proof: 4 vCPU (an AMD EPYC 9V74 in run 36287443916, an AMD EPYC 7763 in the GREEN
run), 15989 MiB memory, 84.7 GB free disk, `/dev/shm` 7994 MB. Chrome ran with software GL (SwiftShader), because GitHub-hosted runners have no GPU (OBSERVED,
`hyperframes doctor --json` and the render summary).

## 3. Proof render

| Item | Value |
|---|---|
| RED run (test before implementation) | https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36287321314 (head `60c4620d`). All three spike tests fail in `before` with `spike.mp4: No such file or directory` |
| First green render | https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36287443916 (head `e0699c1d`, `npm install`; resolved the committed lockfile) |
| GREEN run (final head) | https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36287703457 (head `495c8ec2`, `npm ci`, `check --strict`) |
| Artifact | `film-toolchain-spike` (artifact id 10920931258, expires 2026-12-26). It holds `spike.mp4`, sha256 `e65023bd0a8c689117959fcfd8c3eedccb96f54f4a1eb298bb8c5c2631fbade4`, 2.5 MB, and `contact-sheet.png`, one frame per second |
| BRAG gate | `hyperframes check composition --strict`: lint 0 errors and 0 warnings, runtime 0/0, layout 0 issues across 9 samples, motion 0/0, contrast 9/9 WCAG AA |
| Acceptance test | `film/toolchain/spike.test.mjs` (`node --test`), 3 of 3 pass. ffprobe decodes and counts every frame: 3840x2160, H.264, yuv420p, `avg_frame_rate` 30/1, 150 frames, duration 5 s ± one frame, `hyperframes_version` tag equals the pinned 0.8.79 |

ffprobe output of the GREEN run's `spike.mp4` (OBSERVED, step "Probe the spike"):

```
    hyperframes_version: 0.8.79
    hyperframes_renderer: hyperframes
    encoder         : Lavf60.16.100
  Duration: 00:00:05.00, start: 0.000000, bitrate: 4192 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709, progressive), 3840x2160 [SAR 1:1 DAR 16:9], 4189 kb/s, 30 fps, 30 tbr, 15360 tbn (default)
      encoder         : Lavc60.31.102 libx264
```

The composition is authored natively at 3840x2160 (`data-width`/`data-height`), not supersampled with
`--resolution 4k`. Capture therefore uses the BeginFrame path at device scale factor 1 (OBSERVED:
`captureMode: beginframe`, `deviceScaleFactor: 1`). The 4K frames are native captures, not an upscale.

## 4. Render time and machine load

`hyperframes render composition --quality high` (libx264 preset slow, CRF 15), `auto` workers, which resolved to
2 Chrome workers on 4 cores. GNU `time -v` measured the render command; `vmstat` sampled the whole runner once a
second during the render.

| Measure | Run 36287443916 | Run 36287703457 (GREEN) |
|---|---|---|
| Hyperframes render time | 16.6 s | 21.6 s |
| Stages | compile 0.6 s, setup 1.2 s, capture 14.6 s (encode streamed during capture), assemble 0.1 s | compile 0.4 s, setup 1.3 s, capture 19.7 s (encode streamed during capture), assemble 0.1 s |
| Wall clock of the command, including npx start | 18.03 s | 23.27 s |
| CPU used by the render process tree | 262% of one core | 260% of one core |
| Largest single process RSS | 2034 MiB | 1984 MiB |
| Runner CPU busy, mean / peak | 77% / 99% | 83% / 99% |
| Runner memory in use, peak | 3467 MiB of 15989 | 3408 MiB of 15989 |
| Load average after the render (1, 5, 15 min) | 1.78, 0.65, 0.25 | 2.29, 0.61, 0.21 |

**DERIVED:** capture runs at 0.10 to 0.13 s per 4K frame on this runner. The 60-second hero is 1800 frames at
30 fps, so a scene of similar complexity would capture in roughly 3 to 4 minutes. The real film will be heavier,
with more layers, images, video and audio, so treat this as a floor, not a forecast. Peak memory stayed near 22%
of the runner's total. The render is CPU-bound, not memory-bound, at 2 workers. The two runs differ by about 30%
on nearly the same composition (the second changed only layout CSS). They also landed on different CPU models, so
this is ordinary variance on shared runners. Budget for it.

## 5. What the spike proves, and what it leaves for the film week

Proved (OBSERVED): the pinned Hyperframes CLI installs from a lockfile on a clean runner. It fetches its pinned
headless Chrome and passes its own `check` gate in strict mode. BRAG's step-4 render command produces a native
3840x2160, 30 fps H.264 MP4 at the exact duration and frame count requested. The pinned FFmpeg probes that file,
decodes every frame of it and tiles a contact sheet from it.

Not exercised by a 5-second synthetic scene. Each item is a known gap, not a failure:

- **BRAG's agent steps.** Inspect, plan, `brag-plan.md` and `composition-brief.md` are prompt workflows that run
  inside the film agent's session; this spike exercises only their render tail. **On Opus 5.5, `/brag` switches
  itself to `/brag-slim` (no Hyperframes) unless invoked with `--full`** (BRAG `SKILL.md`, "Invocation dispatch").
  The kit requires the full route, so the film invocation must carry `--full`.
- **Audio.** There is no music, SFX or voice, so the mix, ducking and beat sync are unproven. `hyperframes doctor`
  reports Kokoro TTS as not installed (`pip install kokoro-onnx soundfile`). That matters only if narration is
  requested; the kit defaults to none.
- **Poster bake.** BRAG step 4 re-encodes the MP4 to overlay a chosen poster as frame 0 (LFAC-11). It was not run.
- **Typography.** The generic `sans-serif` became Inter, fetched from Google Fonts at compile time. That fetch is
  neither pinned nor offline. The film must name the approved Métis typeface through a local `@font-face` (the
  lint rule `font_family_without_font_face` flags a named family that has none). LFAC-06 also says "no redistributed font binaries" in
  the deliverable. Reconcile the two before the film week: keep font files in the private production workspace,
  out of the public repository and the delivered bundle.
- **Media.** No `<video>`, `<img>` or captured UI. Real captures go through Hyperframes' video extraction and
  proxy path, which this scene never touched.
- **Length and cutdowns.** The 60-second hero, the 30-second vertical and the 20-second teaser (section 4 gives
  only an extrapolation).

## 6. Reproduce

- **In CI (the approved machine).** Push to `m2/M2-0212-film-toolchain-spike`, or run
  `gh workflow run film-toolchain.yml --repo mysticalsin/AskToto-Mantu --ref <branch>` once the workflow is on the
  default branch; GitHub dispatches only workflows that exist there. The workflow is `.github/workflows/film-toolchain.yml`.
- **BRAG at the pin**, for the film agent's session:
  `git clone https://github.com/latent-spaces/brag && git -C brag checkout c893c5ed52aed84e3e2ee56787de869fccdae6b0`,
  then copy `skills/brag/` into the agent's skills directory (BRAG README, "No installer? Copy the skill directly").
  `npx skills add` and the plugin marketplace install whatever `main` is at install time.
- **Never on a Mac.** D-28 applies to renders too. Do not run `npm ci`, `npx hyperframes` or `node --test` in
  `film/toolchain` on the owner's machines.
