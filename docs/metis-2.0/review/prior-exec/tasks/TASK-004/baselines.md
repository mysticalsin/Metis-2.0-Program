# TASK-004: size, capture and hardware baselines

Métis 1.9.6, unsigned CI build from `main` at `2bf21f1c`. Measured 2026-09-24, approx. 03:45-04:16 UTC (session clock; per-command timestamps not recorded) on one Apple M5 MacBook Pro. Machine-readable copy: `baselines.json` (same folder).

**Status: PARTIAL.** Installer sizes, bundle composition, duplication, architecture overhead and host hardware are measured. Startup/process-tree resources and live capture latency were **not run**, for the reasons given in sections 9 and 10. Windows devices are **not available** from this host. This is a baseline record and not a product pass (MASTER §33). Labels: VERIFIED (command or file:line run or read this session), DERIVED (arithmetic on verified numbers), ASSUMED (stated inference), UNKNOWN, NOT_RUN, NOT_AVAILABLE.

## 1. Exact artifact and source identity

| Item | Value | Evidence |
|---|---|---|
| Source | `mysticalsin/AskToto-Mantu` `2bf21f1ceefe117838325342574b57852e5cadcb` (origin/main), package 1.9.6 | VERIFIED `git log -1`; package.json |
| CI run | Build & Test #35872259580, push to main, head `2bf21f1c`, conclusion success, 14:10–14:36 UTC 2026-09-23 | VERIFIED `gh run view` (read-only) |
| CI artifacts | metis-macos 3,657,108,377 B; metis-windows 4,766,437,569 B | VERIFIED `gh api .../artifacts` |
| Local files = CI artifacts | Local mac files sum to 666 B less, win files to 850 B less (zip container overhead) | ASSUMED: size-consistent, not hash-verified |
| Bundle identity | `com.mantu.asktoto`, CFBundleShortVersionString 1.9.6, display name Métis, LSMinimumSystemVersion 12.0, Electron 43.6.0 | VERIFIED PlistBuddy |
| Update metadata | sha512 of zip, dmg and Setup equals latest-mac.yml / latest.yml | VERIFIED openssl dgst |

## 2. Installer sizes (compressed)

All four sha256 values match `SHA256SUMS.txt` (VERIFIED `shasum -a 256 -c`: OK ×4). Full hashes are in baselines.json.

| File | Bytes | GB | GiB | vs check-release gate (warn 1.7 / fail 1.9 GiB) | sha256 |
|---|---:|---:|---:|---|---|
| `Metis-1.9.6.dmg` | 1,827,062,492 | 1.827 | 1.7016 | over WARN, under FAIL (213,046,973 B below fail) | `1687e2ca89e8db14…` |
| `Metis-1.9.6.zip` | 1,826,300,776 | 1.826 | 1.7009 | over WARN, under FAIL (213,808,689 B below fail) | `227c65e64f2156fe…` |
| `Metis-Setup-1.9.6.exe` | 1,532,977,165 | 1.533 | 1.4277 | under WARN (507,132,300 B below fail) | `77a532f3c33a0be6…` |
| `Metis-Portable-1.9.6.exe` | 1,523,263,850 | 1.523 | 1.4187 | under WARN (516,845,615 B below fail) | `f76bbd441cda774a…` |

Supplementary: `Metis-1.9.6.appx` (win/release-appx, not in the upload set or SHA256SUMS) is 1,708,625,779 B and expands to 2,713,448,759 B in 324 files. The DMG is UDIF zlib: 3,570,708,480 B image, 3,435,169,792 B non-empty, ratio 0.5318 (VERIFIED `hdiutil imageinfo`).

## 3. Unpacked, installed and temporary sizes

| Measure | Bytes | Label |
|---|---:|---|
| macOS Metis.app, file content (10,116 files, 20 symlinks) | 3,191,016,308 (3.191 GB, 2.9719 GiB) | VERIFIED lstat walk of the read-only mount; equals zip uncompressed 3,191,016,820 minus 512 B of symlink targets |
| macOS Metis.app, allocated on the DMG HFS+ volume | 3,215,839,232 (`du -sk` 3,140,548 KiB) | VERIFIED |
| macOS steady installed | 3,191,016,308 | DERIVED. APFS copy not measured: the permission system denied the copy-to-scratch step |
| macOS DMG install, peak disk (DMG + copied app) | 5,018,078,800 | DERIVED |
| macOS zip install, peak disk | 5,017,317,596 | ASSUMED (in-place extraction) |
| Windows payload `app-64.7z` expanded (318 files; identical in Setup and Portable) | 2,701,091,865 (2.701 GB) | VERIFIED `7z l -t7z -slt` |
| Windows Setup steady installed (payload + separate mp4 + uninstaller) | 2,710,734,962 | DERIVED; NTFS overhead unmeasured |
| Windows Setup peak disk (installer + temp 7z + installed) | 5,766,491,060 | ASSUMED NSIS temp semantics |
| Windows Portable per-launch temp extraction | 4,223,870,798 | ASSUMED (repo comment check-packaged-launch.mjs:219) |

## 4. macOS bundle composition

VERIFIED on the read-only mounted DMG (`hdiutil attach -nobrowse -readonly -noautoopen`). The image was detached afterwards ("disk4" ejected; nothing left in `mount` or `hdiutil info`). The compressed column is each component's per-entry deflate size in the zip. It shows which parts drive download bytes. The DMG uses zlib at a similar overall ratio. Unpacked bytes in this table are zip central-directory sizes, which count 512 B of symlink targets.

| Component | Unpacked bytes | Zip-compressed bytes | Share of download |
|---|---:|---:|---:|
| Qwen 0.8B model.gguf | 558,772,480 | 544,592,302 | 29.9% |
| Parakeet ASR (asr/) | 671,239,000 | 478,269,063 | 26.3% |
| Electron Framework + helpers (Frameworks/) | 521,793,725 | 221,501,727 | 12.2% |
| Qwen vision mmproj.gguf | 204,987,232 | 155,970,419 | 8.6% |
| app.asar.unpacked | 337,642,888 | 114,710,857 | 6.3% |
| whisper-base + speaker (models/) | 110,860,192 | 79,474,277 | 4.4% |
| managed-node darwin-x64 | 200,037,842 | 56,131,129 | 3.1% |
| managed-node darwin-arm64 | 196,896,101 | 54,820,869 | 3.0% |
| app.asar | 218,395,316 | 49,338,616 | 2.7% |
| llama-server mac x64 | 53,736,233 | 20,649,685 | 1.1% |
| llama-server mac arm64 | 52,884,793 | 19,999,196 | 1.1% |
| ffmpeg (both arches) | 30,947,650 | 14,804,190 | 0.8% |
| everything else | 9,435,508 | 5,903,685 | 0.3% |
| ort wasm (Resources/ort) | 21,640,503 | 5,058,664 | 0.3% |
| intelligence dashboard | 1,342,052 | 362,014 | 0.0% |
| default_app.asar | 111,073 | 85,881 | 0.0% |
| mac-helper | 282,888 | 62,937 | 0.0% |
| local-llm license | 11,344 | 3,947 | 0.0% |
| **Total** | **3,191,016,820** | **1,821,739,458** | 100% |

Detail inside those groups (unpacked bytes, VERIFIED):

| Item | Bytes |
|---|---:|
| Electron Framework.framework (fat x86_64+arm64; main binary 408,004,576 B = 213,247,360 x86_64 + 194,734,048 arm64) | 518,274,219 |
| 4 Metis Helper apps (together) | 1,885,966 |
| app.asar (215,837,064 B packed content: node_modules 184,334,109, out/ 31,501,957) | 218,395,316 |
| app.asar.unpacked (onnxruntime-node 148,090,165; sherpa-onnx arm64 75,845,555 / x64 64,537,207; sharp+libvips ~39.6 MB) | 337,642,888 |
| Parakeet TDT 0.6b v3 int8 (asr/, incl. 760,228 B test WAVs) | 671,239,000 |
| whisper-base quantized (models/Xenova) | 81,263,214 |
| speaker embedding.onnx | 29,596,978 |
| Qwen3.5 0.8B model.gguf | 558,772,480 |
| Qwen3.5 0.8B mmproj.gguf (vision projector) | 204,987,232 |
| llama-server mac/arm64 (Metal+BLAS+CPU backends) | 52,884,793 |
| llama-server mac/x64 | 53,736,233 |
| ffmpeg 7.1.1 LGPL darwin-arm64 | 13,723,712 |
| ffmpeg 7.1.1 LGPL darwin-x64 | 17,196,256 |
| metis-mac-helper (fat) | 282,888 |
| managed-node darwin-arm64 (Node 24.21.0) | 196,895,980 |
| managed-node darwin-x64 | 200,037,721 |
| ort wasm (Resources/ort) | 21,640,503 |
| intelligence dashboard | 1,342,052 |
| default_app.asar (Electron default app) | 111,073 |

### Top 25 largest files (macOS)

| # | Bytes | Path (under Metis.app/) |
|---:|---:|---|
| 1 | 652,184,281 | `Contents/Resources/asr/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/encoder.int8.onnx` |
| 2 | 558,772,480 | `Contents/Resources/local-llm/models/qwen3.5-0.8b/model.gguf` |
| 3 | 408,004,576 | `Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework` |
| 4 | 218,395,316 | `Contents/Resources/app.asar` |
| 5 | 204,987,232 | `Contents/Resources/local-llm/models/qwen3.5-0.8b/mmproj.gguf` |
| 6 | 125,270,960 | `Contents/Resources/managed-node/darwin-x64/bin/node` |
| 7 | 122,129,232 | `Contents/Resources/managed-node/darwin-arm64/bin/node` |
| 8 | 53,707,539 | `Contents/Resources/models/Xenova/whisper-base/onnx/decoder_model_merged_quantized.onnx` |
| 9 | 35,619,040 | `Contents/Resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v3/darwin/x64/libonnxruntime.1.21.0.dylib` |
| 10 | 35,418,600 | `Contents/Resources/app.asar.unpacked/node_modules/sherpa-onnx-darwin-arm64/libonnxruntime.1.24.4.dylib` |
| 11 | 35,418,600 | `Contents/Resources/app.asar.unpacked/node_modules/sherpa-onnx-darwin-arm64/libonnxruntime.dylib` |
| 12 | 31,847,304 | `Contents/Resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v3/darwin/arm64/libonnxruntime.1.21.0.dylib` |
| 13 | 29,624,256 | `Contents/Resources/app.asar.unpacked/node_modules/sherpa-onnx-darwin-x64/libonnxruntime.1.24.4.dylib` |
| 14 | 29,624,256 | `Contents/Resources/app.asar.unpacked/node_modules/sherpa-onnx-darwin-x64/libonnxruntime.dylib` |
| 15 | 29,596,978 | `Contents/Resources/models/speaker/embedding.onnx` |
| 16 | 23,200,850 | `Contents/Resources/models/Xenova/whisper-base/onnx/encoder_model_quantized.onnx` |
| 17 | 21,914,784 | `Contents/Resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1` |
| 18 | 21,914,784 | `Contents/Resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1.21.0` |
| 19 | 21,596,019 | `Contents/Resources/ort/ort-wasm-simd-threaded.jsep.wasm` |
| 20 | 21,161,776 | `Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib` |
| 21 | 20,298,840 | `Contents/Resources/app.asar.unpacked/node_modules/@img/sharp-libvips-darwin-x64/lib/libvips-cpp.8.18.6.dylib` |
| 22 | 18,164,536 | `Contents/Resources/app.asar.unpacked/node_modules/@img/sharp-libvips-darwin-arm64/lib/libvips-cpp.8.18.6.dylib` |
| 23 | 17,446,360 | `Contents/Resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v3/linux/arm64/libonnxruntime.so.1` |
| 24 | 17,446,360 | `Contents/Resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v3/linux/arm64/libonnxruntime.so.1.21.0` |
| 25 | 17,196,256 | `Contents/Resources/ffmpeg/darwin-x64/ffmpeg` |

## 5. Windows payload composition

VERIFIED with `7z l -t7z -slt`. 7-Zip found the embedded `app-64.7z` (1,522,778,933 B, stored inside NSIS) by signature. It is non-solid (318 blocks), so per-file packed sizes are exact. Setup and Portable carry byte-identical payload listings (paths, sizes, CRCs). Metis.exe is PE32+ x86-64 (machine 0x8664, read from a 4 KB stream with no extraction to disk).

| Component | Uncompressed bytes | 7z packed bytes | Share of payload |
|---|---:|---:|---:|
| Qwen model.gguf | 558,772,480 | 545,215,719 | 35.8% |
| Parakeet ASR | 671,239,000 | 461,490,166 | 30.3% |
| Qwen mmproj.gguf | 204,987,232 | 146,333,887 | 9.6% |
| Electron runtime (root: Metis.exe, DLLs, paks, locales, licenses) | 377,750,233 | 103,579,612 | 6.8% |
| models (whisper-base+speaker) | 110,860,192 | 75,654,747 | 5.0% |
| app.asar.unpacked | 259,684,323 | 64,245,358 | 4.2% |
| app.asar | 219,063,678 | 34,983,760 | 2.3% |
| vcredist | 25,636,149 | 24,762,167 | 1.6% |
| managed-node win-x64 | 93,852,935 | 23,524,523 | 1.5% |
| llama win vulkan | 93,367,713 | 18,944,586 | 1.2% |
| llama win cpu | 44,784,033 | 13,550,116 | 0.9% |
| ffmpeg | 16,545,835 | 5,620,486 | 0.4% |
| ort wasm | 21,640,503 | 3,105,429 | 0.2% |
| resources other | 1,553,177 | 1,464,742 | 0.1% |
| intelligence | 1,343,038 | 293,604 | 0.0% |
| local-llm license | 11,344 | 3,833 | 0.0% |
| **Total** | **2,701,091,865** | **1,522,772,735** | 100% |

Largest Windows entries:

| # | Bytes | Path |
|---:|---:|---|
| 1 | 652,184,281 | `resources/asr/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/encoder.int8.onnx` |
| 2 | 558,772,480 | `resources/local-llm/models/qwen3.5-0.8b/model.gguf` |
| 3 | 239,118,336 | `Metis.exe` |
| 4 | 219,063,678 | `resources/app.asar` |
| 5 | 204,987,232 | `resources/local-llm/models/qwen3.5-0.8b/mmproj.gguf` |
| 6 | 93,580,104 | `resources/managed-node/win-x64/node.exe` |
| 7 | 53,707,539 | `resources/models/Xenova/whisper-base/onnx/decoder_model_merged_quantized.onnx` |
| 8 | 48,583,680 | `resources/llama/win/vulkan/ggml-vulkan.dll` |
| 9 | 35,619,040 | `resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v3/darwin/x64/libonnxruntime.1.21.0.dylib` |
| 10 | 31,847,304 | `resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v3/darwin/arm64/libonnxruntime.1.21.0.dylib` |
| 11 | 29,596,978 | `resources/models/speaker/embedding.onnx` |
| 12 | 25,635,768 | `resources/vcredist/vc_redist.x64.exe` |
| 13 | 25,610,752 | `dxcompiler.dll` |
| 14 | 23,200,850 | `resources/models/Xenova/whisper-base/onnx/encoder_model_quantized.onnx` |
| 15 | 21,914,784 | `resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1` |

## 6. Duplication and architecture overhead (HC-03)

- **x64-only payload idle on Apple silicon: 622,096,548 B (19.5% of the mac bundle).** That is 391,932,884 B of x64-only trees (managed-node, llama, ffmpeg, sherpa-onnx, sharp, onnxruntime-node darwin/x64) plus 230,163,664 B of x86_64 slices in fat Mach-O files. The trees include per-arch copies of arch-neutral files (Node headers, npm). The Intel mirror is 612,921,051 B. VERIFIED.
- **Exact duplicate file content in Metis.app: 292,988,007 B redundant** (sha256 over every file). By area:
  - 131,394,516 B: Resources/managed-node (OpenSSL/C headers replicated across include/ trees and arch dirs)
  - 57,158,688 B: Resources/llama (symlink triplets materialised as 3 identical copies, both arches)
  - 39,361,144 B: app.asar.unpacked/onnxruntime-node (linux .so and .so.1.21.0 identical pairs)
  - 35,418,600 B: app.asar.unpacked/sherpa-onnx-darwin-arm64 (libonnxruntime.dylib == libonnxruntime.1.24.4.dylib)
  - 29,624,256 B: app.asar.unpacked/sherpa-onnx-darwin-x64 (libonnxruntime.dylib == libonnxruntime.1.24.4.dylib)
- **Inside app.asar:** one 21,596,019 B ORT wasm appears three times, with a fourth copy in Resources/ort: 64,788,057 B redundant. 52,427,372 B of node_modules `.map` files also ship. VERIFIED from the asar header's per-file sha256.
- **Three ONNX Runtime builds ship side by side:** onnxruntime-node 1.21.0 (native), sherpa-onnx's own libonnxruntime 1.24.4, and onnxruntime-web wasm. onnxruntime-node also carries 80,119,200 B of linux/win32 binaries on mac and 183,040,245 B of darwin/linux/win-arm64 binaries on Windows. VERIFIED.
- **managed-node:** two full Node.js 24.21.0 trees on mac (396,933,701 B), including 121,949,031 B of C/OpenSSL headers. Windows has one tree at 93,852,935 B. VERIFIED.
- **Windows:** 84,145,112 B redundant by size+CRC32. The llama cpu and vulkan variants share 44,783,968 B of identical CPU backend DLLs, and onnxruntime-node linux .so pairs account for 39,361,144 B. VERIFIED (a CRC32 match is strong but not cryptographic).

## 7. The historical 1.57 GB inventory, reconciled against the real artifact

MASTER §2.1/§14.1 declares 1,567,510,751 B: runtime manifest 803,739,695 plus local model 763,771,056. **That figure stays a source-inventory calculation, not an installed-size test.** In the measured 1.9.6 artifacts, all 22 runtime-manifest assets are present once, with matching bytes and sha256 (streamed from the zip). Both Qwen files match the sha256 pins in `scripts/local-model-assets.mjs:25,32`. VERIFIED. The declared set is 49.1% of mac unpacked bytes, **69.3% of the mac download** (1,263,368,672 of 1,821,739,458 B compressed) and **80.9% of the Windows payload** (1,231,803,781 of 1,522,772,735 B packed). DERIVED. MASTER §14.1 treats these as optional-delivery candidates. That is MASTER's proposal, not a measurement.

## 8. Measurement host hardware

| Property | Value |
|---|---|
| Model | Mac17,2 (MacBook Pro), chip `Apple M5` (machdep.cpu.brand_string) |
| CPU | hw.ncpu 10 = 4 "Super" + 6 "Efficiency" (hw.perflevel0/1), arm64, Rosetta 2 present |
| Memory | hw.memsize 34,359,738,368 B (32 GiB) |
| GPU | Apple M5, 10 cores, Metal: Supported (system_profiler). Neural Engine: UNKNOWN (not reported, not inferred) |
| OS | macOS 27.2, build 26B5091g (sw_vers) |
| Free disk | /System/Volumes/Data: 84,800,000 KiB available of 971,298,980 (91% used; `df -H` 87G). It moved between 84.4M and 84.8M KiB during the session |

VERIFIED. sysctl needed the sandbox disabled (sandboxed calls returned "Operation not permitted"). Serial number, hardware UUID and part number were deliberately left out.

**Devices, architectures, accelerators and languages** (from the artifacts, not from marketing names):

- macOS artifact: universal x86_64+arm64, minimum macOS 12.0. The llama arm64 build ships Metal, BLAS and CPU backends; llama x64 ships BLAS and CPU, with no Metal file. Ad-hoc signed; hardened runtime on the app. `metis-mac-helper` is ad-hoc linker-signed without the runtime flag. Entitlements: allow-jit, allow-unsigned-executable-memory, disable-library-validation, device.audio-input, network.client. VERIFIED.
- Windows artifact: x64 only. llama `vulkan` and `cpu` variants each ship 14 per-microarchitecture CPU DLLs. onnxruntime-node win32/x64 includes DirectML.dll. vc_redist.x64.exe (25,635,768 B) is bundled. VERIFIED.
- Library files being present does not show that an accelerator gets used: runtime accelerator selection is UNKNOWN. Windows device, GPU and driver inventory: NOT_AVAILABLE. Language coverage: UNKNOWN as a measured property (Parakeet ships de/en/es/fr test WAVs; nothing more is claimed).

## 9. Startup and process-tree resource baseline: NOT_RUN

The repo does document a throwaway-profile hook: `ASKTOTO_USERDATA` (src/main/index.ts:889-891, used by scripts/check-packaged-launch.mjs:59-67). It still cannot keep a launch on this host away from Tony's real install:

- VERIFIED: a real Metis install exists on this host: /Applications/Metis.app CFBundleIdentifier com.mantu.asktoto, version 1.8.9 (PlistBuddy). The 1.9.6 DMG copy has the same CFBundleIdentifier com.mantu.asktoto (Info.plist). ASKTOTO_USERDATA relocates only the Electron userData directory; bundle-id-keyed state (TCC grants, login-item registration, NSUserDefaults domain, Keychain "Metis Safe Storage" item) is shared with the real install. ASSUMED: this sharing follows standard macOS semantics; not tested here on purpose.
- VERIFIED: the main-process diagnostic log is not relocated. src/main/logger.ts:15-22 overrides electron-log's path only when process.type !== "browser"; scripts/check-packaged-launch.mjs:21 states the audit log lives under the isolated userData override "unlike electron-log's macOS main.log". A launch would append to the real app's main.log (ASSUMED location: electron-log default ~/Library/Logs/Metis/main.log; not read).
- VERIFIED: every boot reconciles the OS login item: src/main/index.ts:8899-8906 calls app.setLoginItemSettings({openAtLogin: want}) when app.getLoginItemSettings().openAtLogin !== want, and a fresh profile defaults launchAtLogin to false (src/shared/ipc.ts:1097, :1680). ASSUMED: on macOS 13+ the login-item status is bundle-scoped, so a throwaway-profile launch could unregister the real app's login item.
- Lane rule: "only if it can be measured without touching Tony's real profile". The flag isolates userData but not the items above, so that condition is not met.

Command that would run it, on a dedicated QA account or VM with no other `com.mantu.asktoto` install:

```sh
# On a dedicated macOS QA user account or VM with NO other com.mantu.asktoto install:
hdiutil attach -nobrowse -readonly -noautoopen -mountpoint /tmp/m196 Metis-1.9.6.dmg
P=$(mktemp -d /tmp/metis-qa.XXXXXX)
T0=$(python3 -c "import time;print(time.time())")
ASKTOTO_USERDATA="$P" /tmp/m196/Metis.app/Contents/MacOS/Metis & APP=$!
# renderer-ready = first "app.renderer.ready" line in "$P/logs/audit.log" (same signal as scripts/check-packaged-launch.mjs:87)
for i in $(seq 1 120); do date +%s.%N; ps -axo pid,ppid,rss,vsz,pcpu,comm | awk -v r=$APP '$1==r||$2==r'; sleep 1; done > "$P/proc-tree.txt"
kill $APP; hdiutil detach /tmp/m196
# Repeat under Rosetta for the x64 slice: arch -x86_64 /tmp/m196/Metis.app/Contents/MacOS/Metis
```

The repo's own gate proves renderer-ready plus 3 s survival only, and records no memory or CPU: `ASKTOTO_MAC_LAUNCH_GATE=1 node scripts/check-packaged-launch.mjs /tmp/m196/Metis.app`.

## 10. Capture baseline: source inventory, measurement NOT_RUN

| Path | Mechanism | Permission requirement | Anchors |
|---|---|---|---|
| Microphone ("you" channel) (macOS, Windows) | renderer navigator.mediaDevices.getUserMedia({audio:{channelCount:1, echoCancellation:true, noiseSuppression:true}}) with optional exact deviceId -> AudioContext(16 kHz) -> AudioWorklet "whisper-worklet" (VAD, 1.2 s first partial, 6 s cap) -> IPC to main-process ASR (Parakeet/sherpa-onnx or Whisper/transformers) | macOS: TCC Microphone; Info.plist NSMicrophoneUsageDescription present; entitlement com.apple.security.device.audio-input present (codesign); main prompts via systemPreferences.askForMediaAccess("microphone") (src/main/index.ts:4722). Windows: OS microphone privacy setting; no main-process prompt API (index.ts:4733 comment). | src/renderer/src/lib/listen.ts:677-686, :1761-1790; src/renderer/src/lib/whisper-worklet-src.ts:26-28 |
| System audio loopback ("them" channel) (macOS, Windows) | renderer getDisplayMedia with echoCancellation/noiseSuppression/autoGainControl all false (listen.ts:717-721, :741-750); main session.setDisplayMediaRequestHandler grants {audio:"loopback"} only while Listen is armed, from the main frame, to an expected origin (src/main/index.ts:986, :9013-9040, :9077-9099). macOS binds loopback to a 1 fps ScreenCaptureKit screen stream (video track dropped); Windows tries audio-only first, then 1 fps video. | macOS: TCC Screen & System Audio Recording (NSScreenCaptureUsageDescription and NSAudioCaptureUsageDescription present in Info.plist). Windows: no queryable permission (src/main/platform-perms.ts:21-29, :87-90). | src/renderer/src/lib/listen.ts:700-752; src/main/index.ts:9013-9110 |
| Screen capture (screenshots/visual asks, permission probe) (macOS, Windows) | main desktopCapturer.getSources({types:["screen"], thumbnailSize}) with retry on empty/blank sources; 1 px probe registers the app with TCC | macOS: TCC Screen Recording (status via systemPreferences.getMediaAccessStatus("screen"), platform-perms.ts:69-100). Windows: none queryable; probe result only. | src/main/index.ts:3606-3614, :4710; src/main/screen-capture.ts; src/main/platform-perms.ts:50-66 |
| metis-mac-helper Swift sidecar (universal x86_64+arm64, 282,888 B) (macOS) | modes watch-frontmost (NSWorkspace), ocr (Vision VNRecognizeTextRequest over a supplied image), transcribe <wav> [locale] (SFSpeechRecognizer on-device, one-shot over a file), screen-metrics | Speech Recognition TCC for transcribe (embedded NSSpeechRecognitionUsageDescription found in binary strings). It captures no audio or screen itself; it consumes files/images produced elsewhere. | native/mac-helper/main.swift:13-23, :139-167, :290-305 |
| Native SwiftUI Mac app microphone path (macOS 26+, SpeechAnalyzer) | AVAudioEngine input-node tap (bufferSize 4096) -> AnalyzerInput -> SpeechAnalyzer + SpeechTranscriber. System audio via SCStream is a TODO, not implemented (AudioCapture.swift:44). | AVCaptureDevice.requestAccess(.audio), SFSpeechRecognizer.requestAuthorization, CGRequestScreenCaptureAccess. Not part of the measured Electron artifact; no native-app build was measured. | native-app/App/AudioCapture.swift:9-44; native-app/MetisKit/Sources/MetisKit/SpeechTranscription.swift:5-39; native-app/App/Permissions/PermissionsService.swift:26-60; native-app/project.yml:54,58 |
| Recorded-file import (not live capture) (macOS, Windows) | bundled LGPL ffmpeg 7.1.1 sidecar decodes files for Whisper/Parakeet import (Resources/ffmpeg/manifest.json) | none (user-picked file) | electron-builder.yml:121-122; scripts/check-packaged-asr.mjs (Windows import gate) |

Configured constants (from source, **not latency measurements**): PCM 16000 (listen.ts:30 SR; whisper-worklet-src.ts:26); first partial 1200 (src/shared/asr-latency.ts:10); window cap 6000 (listen.ts:66 WINDOW_SEC; asr-latency.ts:14; worklet MAX_SAMPLES); native mic tap 4096 (native-app/App/AudioCapture.swift:29).

**Why NOT_RUN:** Real capture needs OS permission prompts: macOS Microphone and Screen & System Audio Recording TCC grants (Windows: the microphone privacy setting). These grants are keyed to com.mantu.asktoto, which the real 1.8.9 install shares. No automated capture or stream latency harness exists in source. VERIFIED: scripts/ contains bench-asr-ttfc.mjs, which is scheduling-only with a stub 400 ms decode (its own header says so), and docs/asr/QUALITY.md:32 says decode time "must also be measured on the actual packaged engine".

```sh
# Dedicated QA macOS account/VM (fresh TCC), pinned reference clip played through the speakers:
hdiutil attach -nobrowse -readonly -noautoopen -mountpoint /tmp/m196 Metis-1.9.6.dmg
P=$(mktemp -d /tmp/metis-cap.XXXXXX); ASKTOTO_USERDATA="$P" ASKTOTO_DEBUG=1 /tmp/m196/Metis.app/Contents/MacOS/Metis
# then: start Listen, grant Microphone + Screen & System Audio Recording, play the clip, stop; derive speech-onset -> first caption from audit/transcript timestamps.
# A timestamped capture->caption harness does not exist yet; it must be written (see docs/asr/QUALITY.md:32).
```

## 11. Findings (artifact and source observations, not product passes)

- **T4-F01** (size-gate; VERIFIED): DMG 1.7016 GiB and ZIP 1.7009 GiB are just over scripts/check-release.mjs:33 WARN threshold (1.7 GiB = 1,825,361,100 B) and 213,046,973 B below the 1.9 GiB FAIL gate (check-release.mjs:32). Windows Setup 1.4277 GiB and Portable 1.4187 GiB are below WARN.
- **T4-F02** (inventory-reconciliation; VERIFIED): The historical declared inventory (MASTER 2.1/14.1: 1,567,510,751 B = runtime manifest 803,739,695 + local model 763,771,056) is present exactly once in the measured 1.9.6 mac bundle and in the Windows payload. All 22 runtime-manifest assets match bytes and sha256 inside the zip, and both Qwen files match the pins in scripts/local-model-assets.mjs:25,32. It makes up 49.1% of mac unpacked bytes, 69.3% of mac zip-compressed bytes (1,263,368,672 of 1,821,739,458) and 80.9% of Windows 7z packed bytes (1,231,803,781 of 1,522,772,735). The 1.57 GB figure is still a source-inventory number, not an installed-size test; the installed sizes in this report come from the actual 1.9.6 artifacts.
- **T4-F03** (architecture-overhead (HC-03); VERIFIED): Universal mac bundle: 622,096,548 B (19.5% of unpacked) is x64-only payload that an Apple-silicon install never uses (binaries plus per-arch copies of arch-neutral files such as Node headers and npm). That is 391,932,884 B of x64-only trees plus 230,163,664 B of x86_64 slices in fat binaries. The Intel-idle arm64 counterpart is 612,921,051 B. Both Mac architectures are packaged, the pattern HC-03 flags.
- **T4-F04** (bundled-execution-payload (HC-03); VERIFIED): managed-node ships two full Node.js 24.21.0 distributions (darwin-arm64 + darwin-x64) at 396,933,701 B, including npm/corepack and 121,949,031 B of C/OpenSSL headers under include/ (for every OpenSSL target arch). Windows ships one win-x64 node.exe tree at 93,852,935 B. Purpose per electron-builder.yml comments: the managed Dust CLI/keytar.
- **T4-F05** (duplication; VERIFIED): Exact duplicate file content (sha256, all sizes) inside Metis.app: 292,988,007 B redundant across 2,370 groups. Inside app.asar, the 21,596,019 B ORT jsep wasm (sha256 c46655e8a94a...) appears 3 times (out/renderer/assets, onnxruntime-web/dist, @huggingface/transformers/dist), plus a 4th copy at Resources/ort: 64,788,057 B redundant. app.asar also carries 52,427,372 B in 3,360 .map files from node_modules. Windows payload: 84,145,112 B redundant by size+CRC32 (llama cpu/vulkan share 44,783,968 B; onnxruntime-node linux .so pairs 39,361,144 B).
- **T4-F06** (packaging-config; VERIFIED (mac) / ASSUMED (win)): electron-builder.yml:57 excludes out/renderer/assets/ort-wasm-*.wasm only in the top-level files list. The mac.files override (electron-builder.yml:147-160) and electron-builder.win.yml files (:11-31) replace that list and do not repeat the exclusion, so the Vite wasm copy ships in the mac asar (VERIFIED from the asar header). ASSUMED the same for Windows: the Windows asar header was not parsed, although it is 668,362 B larger than the mac one.
- **T4-F07** (foreign-platform binaries; VERIFIED): onnxruntime-node ships binaries for platforms the artifact cannot run: 80,119,200 B of linux/win32 on mac, and 183,040,245 B of darwin/linux/win32-arm64 on Windows x64.
- **T4-F08** (artifact-content; VERIFIED listing / UNKNOWN runtime effect): Metis-Setup carries resources/app.asar.unpacked/out/renderer/assets/onboarding-hero-lady-planet-CpyqQ-62.mp4 (9,360,049 B) as a separate NSIS entry outside app-64.7z. Metis-Portable has no .mp4 entry: its 7z payload lists identical paths, sizes and CRCs to Setup, and its NSIS byte accounting leaves about 5 KB unexplained. So the Portable build appears to lack the onboarding hero video. Runtime effect UNKNOWN (not launched).
- **T4-F09** (bundle-hygiene; VERIFIED): The mac bundle ships Electron's default_app.asar (111,073 B), Parakeet test_wavs (760,228 B), and llama tool implementation libraries (libllama-{cli,bench,batched-bench,perplexity,quantize,completion,fit-params}-impl) next to llama-server. Whether llama-server needs the tool libs is ASSUMED no, and is unverified.
- **T4-F10** (permission-strings (SRC-16); VERIFIED): Info.plist permission strings describe on-device processing: NSMicrophoneUsageDescription "Métis transcribes audio on-device to give you live AI suggestions."; NSSpeechRecognitionUsageDescription "...on-device using Apple Speech..."; NSScreenCaptureUsageDescription and NSAudioCaptureUsageDescription are present. NSCameraUsageDescription is a generic "This app needs access to the camera". A cloud-first profile has to change these together with packaging (SRC-16).

## 12. What remains unmeasured

- Installed size on APFS after a real copy: NOT_RUN (the permission system denied the ditto copy-to-scratch step). Installed size is given as bundle apparent bytes plus HFS+ allocation on the DMG volume.
- Windows installed size on NTFS, NSIS temp usage, Portable per-launch extraction: NOT_AVAILABLE (no Windows host). Temporary figures are DERIVED/ASSUMED from listings.
- Startup time, process-tree RSS/CPU, idle and steady-state resource use (both mac slices, Windows): NOT_RUN (see startup_resource_baseline).
- Capture/stream latency (speech onset to first caption, loopback gaps, reconnect): NOT_RUN (see capture_baseline).
- First-value time (install to first useful typed/voice result): NOT_RUN.
- Native SwiftUI Mac app size and capture: NOT_AVAILABLE (no native-app artifact was built or supplied).
- Accelerator use at runtime (Metal/Vulkan/DirectML/CPU fallback), GPU/NPU memory, thermals, battery: NOT_RUN.
- Language coverage as a measured property: UNKNOWN.
- Windows device/driver inventory: NOT_AVAILABLE.
- Download/transfer timing and delta-update (blockmap) efficiency: NOT_RUN.

## 13. How to reproduce

```sh
cd /Users/tony/AI-Brain-build/release-1.9.6/upload && shasum -a 256 -c SHA256SUMS.txt
hdiutil imageinfo Metis-1.9.6.dmg                     # format / compression
hdiutil attach -nobrowse -readonly -noautoopen -mountpoint "$TMPDIR/m196" Metis-1.9.6.dmg
du -sk "$TMPDIR/m196/Metis.app"; lipo -archs "$TMPDIR/m196/Metis.app/Contents/MacOS/Metis"
codesign -dv "$TMPDIR/m196/Metis.app"; codesign -d --entitlements - --xml "$TMPDIR/m196/Metis.app" | plutil -p -
# lstat walk: sum st_size / st_blocks*512 per component, sha256 duplicate groups, Mach-O fat-header slice sizes
hdiutil detach "$TMPDIR/m196"
zipinfo -t Metis-1.9.6.zip                          # uncompressed/compressed totals; per-entry deflate sizes via python zipfile
7z l Metis-Setup-1.9.6.exe                          # NSIS entries (app-64.7z, separate mp4)
7z l -t7z -slt Metis-Setup-1.9.6.exe                # embedded app-64.7z per-file size / packed size / CRC
7z l -t7z -slt Metis-Portable-1.9.6.exe
gh run view 35872259580 --repo mysticalsin/AskToto-Mantu --json headSha,conclusion,createdAt   # read-only
```

Tooling on this host: 7-Zip (p7zip) 17.05, bsdtar 3.5.3, Python 3 standard library. hdiutil, sysctl and gh needed the sandbox disabled; every such call was read-only.

**Safety record.** The DMG was detached. No app was launched. `~/Library/Application Support` and `~/Library/Logs` of the real app were never read. `/Applications/Metis.app/Contents/Info.plist` was read only for its bundle id and version. Nothing remote was written.
