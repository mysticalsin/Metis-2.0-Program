# Film toolchain: pins, proof render and measurements

Ticket: M2-0212 (W2, m11). Recorded 2026-09-27 against public PR mysticalsin/AskToto-Mantu#225, head
`1cc0cf947e2ab3bbdfbd6cbfe7070387568be7be` on `m2/M2-0212-film-toolchain-spike`. Labels follow the
software-architecture-engineer convention: OBSERVED (read off a run log, registry or source at the pin),
DERIVED (computed from OBSERVED facts), ASSUMED (a default taken without an owner answer).

The launch film (kit v6 `launch-film/BRAG-LAUNCH-PROMPT.md`) is produced with BRAG, which delegates composition
and rendering to Hyperframes. This spike proves BRAG's render tail on the machine the film will use, with every
tool pinned. It renders a 5-second 3840x2160 synthetic scene, then delivers it the way BRAG step 4 does: it picks
a poster and bakes it into frame 0. No product, meeting or user content is in the scene.

## 1. Pinned toolchain

| Tool | Pin | Where the pin lives | Status |
|---|---|---|---|
| BRAG skill | `latent-spaces/brag` commit `c893c5ed52aed84e3e2ee56787de869fccdae6b0` (plugin 0.4.0, MIT). This was `main` HEAD on 2026-09-27; BRAG publishes no tags | This document. BRAG is an agent skill, not a package, so install it at this commit (section 7). The workflow runs the check, render, poster and bake commands of `skills/brag/references/step-4-deliver.md` at this commit | OBSERVED |
| Hyperframes CLI | npm `hyperframes@0.8.79` (Apache-2.0), integrity `sha512-Ng1ybAgmIALbYQ/awKhSl9waLmTTlNWneUpaYPE0PdTxVcD2GFpgirQfiPuAWJG5hQ4mX+n37ZCz2BNvE6ASZg==`, git tag `v0.8.79` = `0ae223773ac27c8966d8ef2de70f54b2501e55a2` | `film/toolchain/package.json` (exact version) | OBSERVED |
| npm dependency tree | 123 packages, all resolved from registry.npmjs.org with integrity hashes. Examples: puppeteer-core 25.12.0, @puppeteer/browsers 3.2.3, sharp 0.35.4, esbuild 0.25.12. The lockfile sha256 is `19d483b453f4b290f8b152685dcd6f0cbdb1f3b5ea5aa8efc81adf7be7ea05e8` | `film/toolchain/package-lock.json`, installed with `npm ci`. The lockfile was generated in CI (run 36287443916), not on a Mac (D-28) | OBSERVED |
| Chrome | `chrome-headless-shell` 152.0.7977.30 (Chrome for Testing, linux64) | Transitively, by Hyperframes 0.8.79 (`CHROME_VERSION` in `packages/cli/src/browser/manager.ts` at the tag). Fetched by `hyperframes browser ensure` before the render. The log shows `HeadlessChrome/152.0.7977.30, beginframe, headlessShell=true` | OBSERVED |
| FFmpeg | Ubuntu 24.04 package `7:6.1.1-3ubuntu5` (FFmpeg 6.1.1, libavcodec 60.31.102, libx264), with all eight libav* libraries from that source pinned to the same version. It runs BRAG's poster pick and frame-0 bake, the probe and the tests | `.github/workflows/film-toolchain.yml` (`FFMPEG_VERSION`). Launchpad shows this as the only ffmpeg published for noble: it sits in the release pocket, which is never rewritten, and no noble-updates or noble-security version exists | OBSERVED |
| GSAP (composition runtime) | 3.14.2 from `cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js`, SRI `sha256-wXS/zlOnKUGNV6ithiXnJHx5OiL++OKFHjz6PenNgoA=`. Free under the GSAP Standard "no charge" license | `film/toolchain/composition/index.html`. The Hyperframes compiler inlines the script and refuses bytes that miss the SRI hash (`packages/producer/src/services/htmlCompiler.ts`, `ScriptIntegrityError`) | OBSERVED |
| Node.js | 22.22.3, the repository's `.nvmrc` | Workflow (`actions/setup-node`) | OBSERVED |
| GitHub Actions | `actions/checkout` v4.4.0 = `11d5960a326750d5838078e36cf38b85af677262`, `actions/setup-node` v4.4.0 = `49933ea5288caeca8642d1e84afbd3f7d6820020`, `actions/upload-artifact` v4.6.2 = `ea165f8d65b6e75b540449e92b4886f43607fa02` | Workflow, pinned by commit SHA with the release named beside each. Each SHA is the commit its release tag points at | OBSERVED |
| Runner image | `ubuntu-24.04`. Image `20260920.314.1` ran every proof run. GitHub rolls image versions weekly, so only the OS release is pinnable | Workflow `runs-on`. The image version is printed on every render | OBSERVED; image version not pinnable |
| Font | Not pinned. The composition names only the generic `sans-serif`, and the Hyperframes compiler substitutes Inter, downloaded at compile time from Google Fonts (11 faces) into `~/.cache/hyperframes/fonts` | Nowhere: this is Hyperframes' deterministic-font behaviour (`packages/producer/src/services/deterministicFonts.ts`) | OBSERVED; see section 5 |
| Telemetry | Off (`HYPERFRAMES_NO_TELEMETRY=1`) | Workflow env | OBSERVED |

## 2. The render machine

**ASSUMED: a GitHub-hosted `ubuntu-24.04` runner counts as a machine the owner approves.** D-28 (answered
2026-09-26) forbids running repository scripts and the app on any Mac and sends test runs to GitHub Actions. The
lead notes for this ticket make the same assumption for renders. The ticket asks for renders "never during the
owner's meetings". A runner is not the owner's machine and takes none of its CPU, memory or network, so a render
there cannot compete with a meeting. **DERIVED:** that criterion is met by construction and needs no calendar
gating. If the owner wants film renders on a specific machine instead, that machine becomes a new pin in this table.

Runner capacity during the proof: 4 vCPU, 15989 MiB memory, 84.7 GB free disk, `/dev/shm` 7994 MB. The CPU model
varies by run: AMD EPYC 9V74 in runs 36287443916 and 36289049340 (GREEN), AMD EPYC 7763 in runs 36287703457 and
36288895533. Chrome ran with software GL (SwiftShader), because GitHub-hosted runners have no GPU (OBSERVED,
`hyperframes doctor --json` and the render summary).

## 3. Proof render and delivery

The workflow runs, in order: `hyperframes check composition --strict`, `hyperframes render composition --quality
high`, BRAG's poster pick, BRAG's frame-0 bake, `ffprobe`, a contact sheet, the artifact upload, and the
acceptance test. The composition has been byte-identical since `495c8ec2`.

| Run | Head | What it showed |
|---|---|---|
| [36287321314](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36287321314) RED | `60c4620d` | Render test before the render existed. All three spike tests fail in `before` with `spike.mp4: No such file or directory` |
| [36287443916](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36287443916) | `e0699c1d` | First green render (`npm install`; resolved the committed lockfile) |
| [36287703457](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36287703457) | `495c8ec2` | Render green with `npm ci` and `check --strict`, before the delivery tail existed |
| [36288787433](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36288787433) RED | `1085039f` | Poster test before the bake existed. Tests 1 to 3 pass; test 4 fails: `Error opening input file …/poster.jpg` |
| [36288895533](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36288895533) | `df2b9c23` | BRAG's bake exactly as step 4 writes it. Duration, frame count and poster pass (frame 0 SSIM 0.999458). The provenance test fails: `hyperframes_version` is gone (section 5) |
| [36289049340](https://github.com/mysticalsin/AskToto-Mantu/actions/runs/36289049340) **GREEN** | `1cc0cf94` | Final head: bake with `use_metadata_tags`, 4 of 4 tests pass |

| Item | Value (GREEN run 36289049340) |
|---|---|
| Artifact | `film-toolchain-spike`, id 10921951965, zip sha256 `021df1a17ac85544621a7355b9eb8a0dcaaf6c74a23f3f96f3a2e9f0d9b1c3dc`, 2103962 bytes, expires 2026-12-26 |
| `spike.mp4` (delivered, poster baked) | sha256 `df613b611fe3d17512dc43a014f02d6ee7413533abad1b99bd36e01c90feb85f`, 1747812 bytes |
| `poster.jpg` | sha256 `f6d955158d869fd32dcee79634a13d7d0152b1e45cc5f8cec8881de82fcf79b9`, 3840x2160, picked at 3.0 s. Inspected: title and caption fully in, progress bar at 60%, nothing mid-transition |
| `contact-sheet.png` | sha256 `e820a6196e7afac67268798bdae828972912cbb97b4faaa273651647869ded11`. The `fps=1` filter samples near 0.5 s, 1.5 s and so on, so it shows the scene, not frame 0 |
| BRAG gate | `hyperframes check composition --strict`: lint 0 errors and 0 warnings, runtime 0/0, layout 0 issues across 9 samples, motion 0/0, contrast 9/9 WCAG AA |
| Acceptance test | `film/toolchain/spike.test.mjs` (`node --test`) runs against the delivered MP4, 4 of 4 pass. ffprobe decodes and counts every frame: 3840x2160, H.264, yuv420p, `avg_frame_rate` 30/1, 150 frames, duration 5 s ± one frame, `hyperframes_version` tag equals the pinned 0.8.79. Frame 0's luma SSIM to `poster.jpg` is 0.999464, at or above the 0.99 bar. Frame 1 is 0.965795, below it, which proves the bar tells the poster from the opening it replaced |

ffprobe output of the delivered `spike.mp4` (OBSERVED, GREEN run, step "Probe the spike"):

```
    hyperframes_version: 0.8.79
    hyperframes_renderer: hyperframes
    encoder         : Lavf60.16.100
  Duration: 00:00:05.00, start: 0.000000, bitrate: 2796 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709, progressive), 3840x2160 [SAR 1:1 DAR 16:9], 2791 kb/s, 30 fps, 30 tbr, 15360 tbn (default)
      encoder         : Lavc60.31.102 libx264
```

Before the bake, the same run's render probed at `Duration: 00:00:05.00`, 3840x2160, 30 fps, 4190 kb/s. The bake
kept the duration and frame count and cut the bitrate by a third (section 5).

The composition is authored natively at 3840x2160 (`data-width`/`data-height`), not supersampled with
`--resolution 4k`. Capture therefore uses the BeginFrame path at device scale factor 1 (OBSERVED:
`captureMode: beginframe`, `deviceScaleFactor: 1`). The 4K frames are native captures, not an upscale.

## 4. Render time, bake time and machine load

**Render.** `hyperframes render composition --quality high` (libx264 preset slow, CRF 15: `ENCODER_PRESETS.high`
in `packages/engine/src/services/chunkEncoder.ts` at the tag), `auto` workers, which resolved to 2 Chrome workers
on 4 cores. GNU `time -v` measured the command; `vmstat` sampled the whole runner once a second.

| Measure | 36287443916 (9V74) | 36287703457 (7763) | 36288895533 (7763) | 36289049340 GREEN (9V74) |
|---|---|---|---|---|
| Hyperframes render time | 16.6 s | 21.6 s | 21.9 s | 17.7 s |
| Capture (encode streamed during capture) | 14.6 s | 19.7 s | 19.6 s | 15.7 s |
| Other stages (compile, setup, assemble) | 0.6, 1.2, 0.1 s | 0.4, 1.3, 0.1 s | 0.8, 1.4, 0.1 s | 0.7, 1.1, 0.1 s |
| Wall clock of the command, including npx start | 18.03 s | 23.27 s | 23.74 s | 19.02 s |
| CPU used by the render process tree | 262% | 260% | 251% | 250% |
| Largest single process RSS | 2034 MiB | 1984 MiB | 1984 MiB | 2030 MiB |
| Runner CPU busy, mean / peak | 77% / 99% | 83% / 99% | 80% / 99% | 78% / 99% |
| Runner memory in use, peak (of 15989 MiB) | 3467 MiB | 3408 MiB | 3459 MiB | 3545 MiB |
| Load average after the render (1, 5, 15 min) | 1.78, 0.65, 0.25 | 2.29, 0.61, 0.21 | 2.21, 0.57, 0.20 | 1.85, 0.52, 0.19 |

**Bake.** BRAG's frame-0 bake decodes the whole render and re-encodes it with libx264 CRF 18 preset slow. GNU
`time -v` measured the ffmpeg command.

| Measure | 36288895533 (7763) | 36289049340 GREEN (9V74) |
|---|---|---|
| Wall clock | 8.92 s | 7.07 s |
| CPU | 352% | 347% |
| Maximum RSS | 2501 MiB | 2547 MiB |
| Encode speed at the end (ffmpeg progress) | not recorded | 21 fps, 0.7x real time |

The poster pick is a single-frame seek and decode, under half a second (log timestamps).

**DERIVED:**

- Capture costs 0.10 s per 4K frame on the EPYC 9V74 and 0.13 s on the EPYC 7763. The bake costs 0.047 and
  0.059 s per frame on the same CPUs: 45% of the capture time on both. The CPU model, not the run, explains the
  25 to 30% spread, since runs on the same model agree within 8%. Budget for the slower one.
- The bake uses 3.5 of the 4 vCPU and is CPU-bound. Its RSS, about 2.5 GiB, is the largest of any process in the
  pipeline, but still only 16% of the runner's memory.
- The 60-second hero is 1800 frames at 30 fps. For a scene of this complexity, capture takes 3.0 to 3.9 minutes
  and the bake 1.4 to 1.8 minutes: about 4.5 to 5.7 minutes, plus about 2 seconds of setup. The bake adds about
  45% to the render.
- Treat this as a floor, not a forecast, and the bake's share most of all. Capture cost grows with layers and
  effects. The bake's cost grows with detail and motion, and this scene has almost none: libx264 skipped 82% of
  P-frame and 87% of B-frame macroblocks. Real UI captures, video and grain will slow libx264 preset slow far
  more than they slow capture, so the bake can cost as much as the capture, or more. The first real-content render
  in film week must re-measure both, and check the result against the workflow's 30-minute job timeout.

## 5. What the spike proves, and what it leaves for the film week

Proved (OBSERVED): the pinned Hyperframes CLI installs from a lockfile on a clean runner. It fetches its pinned
headless Chrome and passes its own `check` gate in strict mode. BRAG's step-4 render command produces a native
3840x2160, 30 fps H.264 MP4 at the exact duration and frame count requested. BRAG's step-4 delivery tail runs on
it with the pinned FFmpeg: the poster pick at a settled beat, then the frame-0 bake. The delivered file keeps the
render's duration and all 150 frames, so BRAG's "same duration, same frame count" promise holds, and there is no
timing drift. Frame 0 is the poster. The pinned FFmpeg probes the file, decodes every frame and tiles a contact
sheet from it.

Findings from the delivery tail. The film week must act on each:

- **The bake strips Hyperframes' provenance. The workflow deviates from BRAG to keep it.** ffmpeg copies the
  input's global metadata, but the MP4 muxer writes only its standard keys unless `-movflags use_metadata_tags`
  is set. Run 36288895533 ran BRAG's bake exactly as written: `hyperframes_version` and `hyperframes_renderer`
  were gone from the delivered file, and the provenance test failed. The workflow's bake therefore uses
  `-movflags +faststart+use_metadata_tags`. This is its only change to BRAG's commands, and the film's bake must
  carry the same flag, or the delivered film cannot be traced to its renderer (LFAC-10's probe metadata).
- **The bake makes a frame-zero flash when the poster differs from the opening.** It overlays a settled beat
  onto frame 0, and frame 1 is the opening as rendered. In the spike, frame 0 shows the finished title and
  caption with the bar at 60%. Frame 1, at 0.033 s, is almost empty: the title starts to fade in only at 0.2 s,
  the caption at 0.6 s, and the bar is under 1%. That is a one-frame (33 ms) flash of the finished title, and frame
  1's SSIM to the poster is 0.966. BRAG calls it imperceptible.
  LFAC-11 requires "no frame-zero flash", and the kit's prompt says "inspect the opening for a visible flash".
  The film must either open on the poster's composition, so frame 1 continues it, or skip the bake and ship the
  poster only as a separate thumbnail. The spike's scene is built the way it is on purpose, so the test can tell
  a real bake from a no-op; it does not claim LFAC-11.
- **The bake re-encodes the whole film at a lower quality than the render.** `--quality high` renders at CRF 15;
  the bake re-encodes every frame at CRF 18, so the delivered master is a second-generation CRF 18 encode. The
  spike's bitrate fell from 4190 to 2791 kb/s. Before the final render, the film lead decides whether that is
  acceptable. The alternative is to raise the bake's quality to match the render, which would be a second
  deviation from BRAG.

Not exercised by a 5-second synthetic scene. Each item is a known gap, not a failure:

- **BRAG's agent-authoring steps.** Inspect, plan, `brag-plan.md`, `composition-brief.md` and share copy are
  prompt workflows that run inside the film agent's session. They are out of scope for a toolchain spike (Opus
  validator ruling, round 1). **On Opus 5.5, `/brag` switches itself to `/brag-slim` (no Hyperframes) unless
  invoked with `--full`** (BRAG `SKILL.md`, "Invocation dispatch"). The kit requires the full route, so the film
  invocation must carry `--full`.
- **Audio.** There is no music, SFX or voice, so the mix, ducking, beat sync and the bake's audio copy
  (`-map 0:a? -c:a copy`) are unproven. `hyperframes doctor` reports Kokoro TTS as not installed
  (`pip install kokoro-onnx soundfile`). That matters only if narration is requested; the kit defaults to none.
- **Typography.** The generic `sans-serif` became Inter, fetched from Google Fonts at compile time. That fetch is
  neither pinned nor offline. The film must name the approved Métis typeface through a local `@font-face` (the
  lint rule `font_family_without_font_face` flags a named family that has none). LFAC-06 also says "no
  redistributed font binaries" in the deliverable. Decide before the film week where the approved font files
  live: keep them in the private production workspace, out of the public repository and the delivered bundle.
  That also removes the unpinned compile-time fetch.
- **Media.** No `<video>`, `<img>` or captured UI. Real captures go through Hyperframes' video extraction and
  proxy path, which this scene never touched.
- **Length and cutdowns.** The 60-second hero, the 30-second vertical and the 20-second teaser (section 4 gives
  only an extrapolation).

## 6. Acceptance

| Criterion | Status | Evidence |
|---|---|---|
| A 5-second 3840x2160 render of a synthetic scene | MET | GREEN run 36289049340; ffprobe in section 3 |
| … through the BRAG pipeline | MET for the render tail | BRAG c893c5ed step 4 ran end to end in CI: `check --strict`, `render --quality high`, poster pick, frame-0 bake, with one documented deviation (`use_metadata_tags`, section 5). BRAG's agent-authoring steps are out of scope for a toolchain spike (section 5) |
| Toolchain versions pinned in TOOLCHAIN.md | MET | Section 1 |
| Render time and machine load measured | MET | Section 4: four render runs and two bake runs |
| Renders on a machine the owner approves, never during the owner's meetings | MET, ASSUMED | Section 2. Owner confirmation that a GitHub-hosted runner is the approved machine is still open |

## 7. Reproduce

- **In CI (the approved machine).** Push to `m2/M2-0212-film-toolchain-spike`, or run
  `gh workflow run film-toolchain.yml --repo mysticalsin/AskToto-Mantu --ref <branch>` once the workflow is on the
  default branch; GitHub dispatches only workflows that exist there. The workflow is
  `.github/workflows/film-toolchain.yml`. The `film-toolchain-spike` artifact holds `spike.mp4`, `poster.jpg` and
  `contact-sheet.png`.
- **BRAG at the pin**, for the film agent's session:
  `git clone https://github.com/latent-spaces/brag && git -C brag checkout c893c5ed52aed84e3e2ee56787de869fccdae6b0`,
  then copy `skills/brag/` into the agent's skills directory (BRAG README, "No installer? Copy the skill directly").
  `npx skills add` and the plugin marketplace install whatever `main` is at install time.
- **Never on a Mac.** D-28 applies to renders too. Do not run `npm ci`, `npx hyperframes`, `ffmpeg` on the spike
  or `node --test` in `film/toolchain` on the owner's machines.
