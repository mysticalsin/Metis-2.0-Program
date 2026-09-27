# TASK-001 source and lineage register

Generated 2026-09-24T04:42:39Z (UTC). MASTER revision 4.5, TASK-001 part 1. Machine-readable twin: `source-register.json`.

Every claim carries VERIFIED (command or file:line), ASSUMED, UNKNOWN or NOT_AVAILABLE. A source finding is not a product pass (MASTER section 33). Nothing in the source worktree, the kit or any of Tony's clones was modified. All GitHub calls were read-only GETs.

## 1. Source checkout identity

| Field | Value | Evidence |
|---|---|---|
| path | /Users/tony/AI-Brain-build/metis-2.0 | VERIFIED: ls |
| git_entry | linked worktree; gitdir /Users/tony/AI-Brain-build/metis-operator-ux/.git/worktrees/metis-2.0 | VERIFIED: cat .git |
| branch | claude/metis-2.0-task-001 | VERIFIED: git branch --show-current |
| HEAD | 2bf21f1ceefe117838325342574b57852e5cadcb | VERIFIED: git rev-parse HEAD |
| local origin/main | 2bf21f1ceefe117838325342574b57852e5cadcb | VERIFIED: git rev-parse origin/main |
| GitHub main (live) | 2bf21f1ceefe117838325342574b57852e5cadcb committed 2026-09-23T14:10:35Z, protected=true | VERIFIED: gh api repos/mysticalsin/AskToto-Mantu/branches/main |
| HEAD commit | Merge pull request #198 from mysticalsin/codex/metis-review-fix-1 (Tony, 2026-09-23 10:10:35 -0400) | VERIFIED: git log -1 |
| dirty files | 0 (tracked and untracked, gitignored node_modules excluded) | VERIFIED: git status --porcelain --untracked-files=all \| wc -l |
| remotes | origin = https://github.com/mysticalsin/AskToto-Mantu.git (fetch and push); no other remote | VERIFIED: git remote -v |
| package | asktoto 1.9.6; engines.node 22.22.3; main ./out/main/index.js | VERIFIED: package.json |
| native-app version | MARKETING_VERSION 1.9.6, CURRENT_PROJECT_VERSION 1 | VERIFIED: native-app/project.yml |
| Node pin | 22.22.3 (.nvmrc, .node-version, package.json, all workflows); local node v22.22.3, npm 10.9.8 | VERIFIED: cat .nvmrc; node -v; npm -v; grep node-version .github/workflows/*.yml |
| drift from MASTER anchor | fff88c26 (tag v1.9.5, MASTER section 2.1) is an ancestor of main; main is 53 commits ahead via merges #195 (55f8b06b), #199 (bf2358e1), #198 (2bf21f1c) | VERIFIED: git merge-base --is-ancestor; git rev-list --count fff88c26..2bf21f1c; git log --first-parent |
| shared object store | ~/AI-Brain-build/metis-operator-ux holds worktrees: itself (codex/operator-ux-rock-1 @ 5e988489), metis-2.0, and two detached /private/tmp/claude-501/rv-3821 and rv-4057 @ 0b872d64 created by another session | VERIFIED: git worktree list |
| lockfiles | package-lock.json blob 20fcde87ff92; intelligence/package-lock.json blob e91b1ca85b63; license-server/package-lock.json blob 619899f48436; operator/ and cloudflare-proxy/ have no package.json (root dependencies) | VERIFIED: git ls-tree HEAD |
| installed dependencies | node_modules present in root, intelligence, license-server; exec receipts record npm ci exit=0 for all three (run by the orchestrator, not by this lane) | VERIFIED: ls; /Users/tony/AI-Brain-build/metis-2.0-exec/receipts/npm-ci*.log |
| update feed | electron-builder publish provider github, owner mysticalsin, repo Metis-Releases; appId com.mantu.asktoto; productName Metis | VERIFIED: electron-builder.yml:4,13,319-326 |
| key tool pins | electron 43.6.0, electron-vite 5.0.0, electron-builder 26.15.3, electron-updater ^6.8.9, wrangler 4.131.1, vitest ^4.1.11, typescript ^5.6.3, react ^18.3.1 | VERIFIED: package.json dependencies/devDependencies |
| host | macOS 27.2 (26B5091g) arm64; git 2.54.0; gh 2.99.0; xcodegen 2.46.0; swift and xcodebuild versions UNKNOWN (sandbox: "couldn't create cache file ... xcrun_db (errno=Operation not permitted)") | VERIFIED: sw_vers; uname -m; git/gh/xcodegen --version |

## 2. Repository instructions and binding rules

No `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules/*` or `.codex/` exists at main. The binding rules come from the design, release and development documents below.

### `AGENTS.md` (NOT_PRESENT)

Evidence: VERIFIED: git ls-files at HEAD; git log --all -- AGENTS.md CLAUDE.md **/AGENTS.md **/CLAUDE.md .cursorrules .cursor/rules/* returns no commit; find outside node_modules finds none

### `CLAUDE.md` (NOT_PRESENT)

Evidence: VERIFIED: same search as AGENTS.md

### `.cursor/rules, .cursorrules, .codex/, .github/copilot-instructions.md` (NOT_PRESENT)

Evidence: VERIFIED: git ls-files; find

### `.cursor/environment.json + .cursor/install.sh` (PRESENT (agent bootstrap, not rules))

Evidence: VERIFIED: cat .cursor/environment.json .cursor/install.sh

- Cloud-agent install installs the pinned Node from .nvmrc with nvm, appends an nvm snippet to ~/.bashrc and ~/.profile, then runs npm install (.cursor/install.sh). It writes shell rc files, so this lane did not run it.

### `DESIGN.md (blob a8b37936b230)` (PRESENT, self-declared gate)

Evidence: VERIFIED: read in full

- Do not add or restyle overlay or onboarding UI unless it matches this document (DESIGN.md:3).
- Three chrome modes: hide (default), island, bar. Windows uses the top edge with no fake notch (DESIGN.md:7-11).
- Bar toolbar overlap is a ship blocker: BAR_WIDTH 880, every control an in-flow reserved box, no absolute stacking or negative margins (DESIGN.md:19).
- Frozen geometry: Hide park 8x2, Island peek 132x15, top-edge watch strip at display.bounds.y capped at 40 px (DESIGN.md:26, 42-43).
- Auto-answer never auto-sends and has no TTL (DESIGN.md:34).
- Motion is compositor-only (transform/opacity); reduced-motion skips springs (DESIGN.md:72-76, 138).
- No Skip: onboarding cannot be skipped; Ready is the only finish (DESIGN.md:104, 166).
- Flow is hero, problem, reveal, appearance, setup, personalize, [license], ready (DESIGN.md:108-112).
- Act 1 plays only the April-29 clip hf_20260429_115139; leaving Act 1 pauses and unmounts it (DESIGN.md:140).
- Act 2 is a scripted demo on the real product with fake data only, not an mp4 (DESIGN.md:144).
- Goldberg Aria (CC0) is bundled; lockOnboardingAudio after onboardingDone; leftover audio after finish is FAIL (DESIGN.md:152).
- No em dash in user-facing onboarding copy; Métis voice; no Vibe Island strings (DESIGN.md:154, 178).
- "Tell the room" consent copy is pinned; the recordingConsent checkbox gates Continue (DESIGN.md:158-164).
- Nine built-in modes each own a recap layout; recap bodies must fit or scroll (DESIGN.md:172-174).
- "READY TO MERGE stays no until Tony Mac-shows" (DESIGN.md:134).
- Operator is the Cloudflare Access ops console; map geo uses request.cf only; it is not the Fly license-server (DESIGN.md:182).
- Conflict to resolve downstream, not here: DESIGN.md:104 (No Skip) and DESIGN.md:140 (April-29 clip) conflict with MASTER section 34 and SRC-15 (Tony-only welcome, text fallback, retire the old clip). Owner precedence decides (TASK-002/008 and the onboarding tasks).

### `docs/design/DESIGN.md + docs/design/*.md sub-contracts` (PRESENT (headers inspected, not read in full))

Evidence: VERIFIED: grep -n "^#" docs/design/DESIGN.md; ls docs/design

- Design-system contract (Cluely v2.1.19 basis, single accent #7C8CF8) covering Platform, Surfaces, Review never clips, Anti-slop, Answer first, Enterprise LLM client, Operator (Shoey OpenPanel lock 6 Sep 2026), Onboarding, Thinking orbs, Bar sphere, CLI session.
- Referenced sub-contracts: BAR-PILL.md, QUALITY.md, ONBOARDING-FLOW.md, ONBOARDING-APPEARANCE.md, ONBOARDING-KINETIC-GRID.md, OPERATOR.md, THINKING-ORB.md, plus METIS-2.0-* design notes. Implementers must read the relevant one before UI work.

### `README.md` (PRESENT)

Evidence: VERIFIED: read in full

- Node 22.22.3 is pinned in .nvmrc, .node-version, package.json and CI (README.md:63).
- Keep the internal identifier asktoto (package name, appId, userData paths). Renaming breaks macOS TCC grants and electron-updater continuity (README.md:35-41).
- The main process is the trust boundary: requireAuth() and assertMainWindow() guard privileged IPC, the renderer is sandboxed, keys never reach the renderer (README.md:233-235).
- Public releases only after the notarized macOS and signed Windows gates; do not substitute an unsigned local build for customer distribution; the native SwiftUI app is local-only (README.md Install section).
- States that branch protection on main is not configured (README.md:295). Live GitHub contradicts this (section 8).

### `docs/DEVELOPMENT.md` (PRESENT (sections 2-8 read))

Evidence: VERIFIED: sed -n 93,277p

- No dynamic import() in src/main/** because the main bundle is V8 bytecode; enforced by check:main-imports in prebuild (DEVELOPMENT.md:116-133).
- New IPC handler: channel constant in IPC (src/shared/ipc.ts), a zod schema, and assertMainWindow (or assertBrainReader) as the first line (DEVELOPMENT.md:189).
- Extend renderer state with hooks in state.ts, not a state library (DEVELOPMENT.md:197).
- The audit log is metadata only, never message or transcript content (DEVELOPMENT.md:103-108).
- bidstackClient.test.ts binds a local port; a failure under a network sandbox is environmental, not a regression (DEVELOPMENT.md:220).

### `docs/ENTERPRISE_RELEASE.md (blob 2614d1b3c2ae)` (PRESENT)

Evidence: VERIFIED: read in full

- A public tag is blocked until both production signing lanes pass (ENTERPRISE_RELEASE.md:3).
- Tag vX.Y.Z from main; it must equal package.json version or release.yml fails first (ENTERPRISE_RELEASE.md:47).
- After publishing the feed, push the release tag to the Forgejo twin; a release is not landed until its tag exists on both remotes (ENTERPRISE_RELEASE.md:49-56).
- Code repo: push through scripts/push-both.sh; after a GitHub web-UI merge, fetch and push the merge to Forgejo before the next 8 h sync (ENTERPRISE_RELEASE.md:57-62).
- When the Apple secret set is complete, delete the two darwin guards in src/main/updater.ts in the same commit (ENTERPRISE_RELEASE.md step 7).
- Do not re-add device-licensing proofs while enforcement is compiled off (ENTERPRISE_RELEASE.md:186).
- Never seed a Homebrew-linked macOS ffmpeg sidecar; the tracked manifest SHA-256 is the trust anchor (ENTERPRISE_RELEASE.md ffmpeg section).

### `docs/SIGNING.md` (PRESENT)

Evidence: VERIFIED: read in full

- Local ad-hoc packages are QA-only and must never be uploaded to the public release feed (SIGNING.md:29).
- Release secret names per channel are documented; no values are in the repo (SIGNING.md gate table).
- Last verified 2026-07-06; the GitHub Actions billing block is mutable external state to re-check (SIGNING.md:3-8).

### `docs/PLATFORM-MAP.md` (PRESENT)

Evidence: VERIFIED: read in full

- No per-OS fork of the Electron source; platform differences are runtime checks and packaging overlays (PLATFORM-MAP.md:6, 51).
- The native Swift app ships through the App Store, never through latest-mac.yml or electron-updater (PLATFORM-MAP.md section 3).

### `.github/workflows/{build,release,cahe-windows,windows-signing-identity-preflight}.yml` (PRESENT)

Evidence: VERIFIED: grep jobs/run lines

- build.yml runs on every branch push and on PRs to main: quality matrix (typecheck, check:bugs, build, npm test), Operator job (rebuild generated bundles and fail on drift, typecheck Worker and client, operator tests, operator scripts tests), security job (npm audit high/critical, SBOM, secret scan), build-macos (npm run dist), build-windows (dist:win, dist:win:appx).
- release.yml runs on v* tags and requires signed macOS and Windows jobs plus release-verify.
- No workflow runs swift test (native-app/MetisKit), license-server node --test, or a standalone mac-helper build (grep of workflows for swift, xcode, license-server: no match).

### `.gitleaks.toml (blob e8d2b955d87c)` (PRESENT)

Evidence: VERIFIED: grep structure

- useDefault=true with a path allowlist covering all *.test.ts(x), *.test.mjs, scripts/qa/** and docs/**/*.md (.gitleaks.toml:30-41). This is the broad exclusion SRC-19 targets.

### `/Users/tony/AI-Brain-build/metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/AGENTS.md and CLAUDE.md` (PRESENT (kit only))

Evidence: VERIFIED: cat

- Govern the handoff folder only and tell agents to preserve the application's own instructions; they do not add rules to the source repository.

## 3. Shipping workspaces

| Workspace | Path | Build entry | Package / version | Test command | CI coverage |
|---|---|---|---|---|---|
| Desktop main | src/main | electron.vite.config.ts main inputs: src/main/index.ts + parakeet-asr-host, speaker-embedding-host, parakeet-extract-host, whisper-asr-host (V8 bytecode) | asktoto 1.9.6 (root) | npm test (vitest root include src/**); npm run typecheck (tsconfig.node.json) | build.yml quality matrix (ubuntu + windows) |
| Preload | src/preload | preload inputs index.ts, intelligence.ts, import-decoder.ts | asktoto 1.9.6 (root) | npm test (root vitest) | quality matrix |
| Renderer | src/renderer | renderer inputs src/renderer/index.html, decoder.html (React ^18.3.1, Tailwind v4) | asktoto 1.9.6 (root) | npm test (root vitest); typecheck tsconfig.web.json | quality matrix |
| Shared contracts | src/shared | bundled into main/preload/renderer via @shared alias | asktoto 1.9.6 (root) | npm test | quality matrix |
| Native SwiftUI app | native-app/ (App/ + MetisKit/) | xcodegen native-app/project.yml target Metis (com.mantu.metis.native, macOS 14 / iOS 17, Swift 6.0 strict concurrency); npm run build:native-mac or package:native-mac:local -> release/Metis-Native-<v>.zip | MARKETING_VERSION 1.9.6; MetisKit swift-tools 6.0 (targets MetisKit, MetisKitTests) | cd native-app/MetisKit && swift test | NONE (no workflow runs swift) |
| macOS helper sidecar | native/mac-helper (main.swift, Info.plist) | node scripts/build-mac-helper.mjs: xcrun swiftc -O for arm64-apple-macos13.0 and x86_64-apple-macos13.0, lipo -> resources/mac-helper/ | unversioned (ships inside the Electron mac app) | node scripts/check-mac-helper.mjs mac (presence/arch check); no unit tests found | indirect: build-macos npm run dist triggers predist, which runs build-mac-helper + check-mac-helper |
| Operator Worker (portal) | operator/ | wrangler.jsonc name metis-operator, main src/index.ts, compatibility_date 2026-08-31, D1 binding DB -> metis-operator (database_id ...9f7c), assets ./public (run_worker_first), cron 17 3 * * *; client bundle via npm run build:operator-client / build:operator-world | no own package.json (root deps, wrangler 4.131.1); OPERATOR_VERSION var is "<set by deploy>" | npm run test:operator; npx vitest run --config operator/scripts/vitest.config.ts; tsc -p operator/tsconfig.json and operator/client/tsconfig.json | build.yml Operator job |
| Cloudflare proxy Worker | cloudflare-proxy/ | wrangler.jsonc name metis-cloudflare-proxy, main src/index.ts, compatibility_date 2026-08-20; secrets CLOUDFLARE_API_TOKEN, CF_ACCOUNT_ID, METIS_PROXY_KEY set via wrangler secret (names only) | no package.json (root deps) | npm run test:proxy (vitest --config cloudflare-proxy/vitest.config.ts) | via root npm test chain in quality matrix |
| License server | license-server/ | server.mjs (express ^4.21.2, zod ^3.23.8); Dockerfile, docker-compose.yml, fly.toml | asktoto-license-server 1.0.0, engines node >=18 | cd license-server && npm test (node --test) | NONE (no workflow references license-server) |
| Mantu Intelligence dashboard | intelligence/ | npm run build:intelligence (cd intelligence && npm ci && tsc -b && vite build) -> intelligence/dist, packaged via electron-builder extraResources | deal-psychology-dashboard 0.0.0 (Vite ^8.1.1, React ^19.2.7, TypeScript ~6.0.2) | root npm test (include intelligence/src/**); npm run lint (oxlint); npm run smoke | tests via quality matrix; bundle built only in dist/release predist chains |
| Skills (mode prompts) | skills/ (modes/<9 modes>/SKILL.md, humanizer, caveman) | electron-builder.yml:127-130 copies skills -> skills; hashes locked in src/shared/mode-skills.lock.json (blob b403856a6c36) | 11 tracked files | npm run check:mode-skills (lock-mode-skills.mjs --check), first step of npm test | via npm test |
| Build, release and QA scripts | scripts/ (+ scripts/qa, scripts/evals, scripts/lib) | node scripts/*.mjs invoked by package.json lifecycle (prebuild, predist, dist*, release*) | root | root npm test (include scripts/**/*.test.ts); physical QA scripts/qa/e2e-workflows.mjs needs a launched app and is not in npm test | quality matrix for unit tests; physical QA none |
| Packaging variants | electron-builder.yml, electron-builder.win.yml, electron-builder.cahe.win.yml | mac universal DMG/ZIP (dist, release:build:mac), Windows NSIS + portable + APPX (dist:win, release:build:win, dist:win:appx), MAS (release:mas), Cahê pilot appId com.mantu.metis.windows-cahe (installers:win:cahe) | root 1.9.6 | check-packaged-runtime, check-update-metadata, check-packaged-launch, verify-signing (post-build gates) | build.yml build-macos/build-windows; release.yml; cahe-windows.yml |

Evidence and notes per workspace are in the JSON (`workspaces[].evidence`, `workspaces[].notes`). Test commands are recorded from source; none was executed in this lane (no npm scripts in the worktree by instruction), so no baseline exit status is claimed here.

### SRC-01 manifest: the five files absent from the 1.9.5 export

| File | Present at main | Git blob | Lines |
|---|---|---|---|
| src/renderer/src/App.tsx | YES | bffd67c5b3755ac646229640f210a644f3beabf0 | 4277 |
| src/main/index.ts | YES | 5a8d9e72a2e987db5b27b166515655f1a10905e2 | 9518 |
| src/renderer/src/lib/listen.ts | YES | 8ab014c3fae6e7d525de55fb295f9db0bd6f06b3 | 3153 |
| src/main/transcripts.ts | YES | 07bbec93581d71a825e71a57b86410c377fcfbf1 | 1272 |
| src/main/brain/ingest.ts | YES | 3b19265ae6547c2b809f3fd932a4a4c1948fa148 | 2817 |

VERIFIED (git ls-tree HEAD; wc -l): all five files the 1.9.5 export omitted are present in the real checkout at main 2bf21f1c. VERIFIED (shasum -a 256): the kit export digest equals the one MASTER section 29 records. Presence is not an audit of their runtime wiring.

## 4. GitHub lineage

### mysticalsin/AskToto-Mantu

- **repo**: public, default branch main, not a fork, not archived, pushed_at 2026-09-23T14:10:35Z (VERIFIED: gh api repos/mysticalsin/AskToto-Mantu)
- **main**: 2bf21f1ceefe117838325342574b57852e5cadcb (protected=true) (VERIFIED: gh api repos/mysticalsin/AskToto-Mantu/branches/main)
- **rulesets**: 5 active, all branch-target: protect-bank-grade-branch, protect-cursor-branches, protect-fix-branches, protect-main-deletion, protect-release-branches; no tag ruleset (VERIFIED: gh api repos/mysticalsin/AskToto-Mantu/rulesets)
- **branches**: 101 remote branches (VERIFIED: gh api repos/.../branches --paginate | wc -l)
- **non-main PR bases**: every non-main base is already contained in main: release/1.9.1 7e54a08a (-86), codex/review-release-1.9.1 83d9d3fa (-64), feat/operator-wow 1d508f2b (-272), fix/settings-orb-stability-20260905 de25141c (-337), release/1.8.3 56cd0fe1 (-411), cursor/jarvis-orb-fill-bar-rest-6c68 37ea76d7 (-315) (VERIFIED: gh api branches/<b> and compare/main...<b> (status behind, ahead 0))

### Open pull requests (26)

Stat columns are the PR diff against its own base. "In main" means the head SHA is an ancestor of main 2bf21f1c (GitHub compare status `behind`/`identical`).

| PR | Draft | Base | Head ref @ SHA | Files / +add / -del | Top paths (file count) | vs main | In main | Mergeable | Local checkout at head |
|---|---|---|---|---|---|---|---|---|---|
| #200 Fix Windows Bash advice tests and packaged UI smoke timing | yes | main | codex/metis-win-bash-tests @ 90f70e36b9113b6e0b1acc755007cb622da9f1d4 | 3 / +139 / -67 | scripts:1, scripts/qa:1, src/main:1 | diverged +3/-8 | no | MERGEABLE/CLEAN | - |
| #194 Métis 2.0 — the right-edge dock lane, merged onto main | no | main | claude/dock-three-fixes @ a105a258aab0cb9ab07b24dbf85538dce84b6de8 | 99 / +7328 / -678 | src/renderer:33, src/main:22, intelligence:12, src/shared:10, docs/design:9, docs/evidence:2, proof:2, scripts:2 | diverged +81/-53 | no | CONFLICTING/DIRTY | ~/dev/metis-fx3 |
| #193 Cap4: Apple-smooth dock motion (base 3d6825f9) | no | release/1.9.1 | claude/cap4-motion @ 2c902a250d15a88c696b5751e101d37fed511d27 | 220 / +14700 / -1671 (file list capped at 100) | src/main:45, scripts:13, operator/src:12, docs/design:11, intelligence:6, docs:3, native-app:2, .github:1 | diverged +41/-58 | no | MERGEABLE/UNSTABLE | - |
| #192 fix(metis): Cap3 QA_TIP force-paint gated to unpackaged builds | no | codex/review-release-1.9.1 | fix/cap3-qa-tip-cp-packaged-gate @ a5eb53dcca788bcc00b3a44e3b9f49f9f6bde84d | 36 / +3227 / -51 | src/main:12, src/shared:9, intelligence:6, src/renderer:6, docs/design:2, src/preload:1 | diverged +5/-58 | no | MERGEABLE/UNSTABLE | ~/dev/metis-cap3-cp-gate |
| #191 Cap4: Bar-DNA glass DockPanel (DESIGN lock) | no | main | cursor/cap4-glass-sidecar @ 9fb913f1bd39fbbf15619cbffdebc85e3a5b3281 | 25 / +1203 / -152 | src/renderer:10, src/main:6, intelligence:5, src/shared:3, docs/design:1 | diverged +8/-58 | no | CONFLICTING/DIRTY | ~/dev/metis-glass |
| #190 Unblind the content-protection audit (6 red tests on 2.0) | no | codex/review-release-1.9.1 | claude/content-protection-stub @ 1e59059fb5fd67b476b103fa0b8b1085dcbf1674 | 49 / +3578 / -96 | src/main:15, src/renderer:14, src/shared:11, intelligence:6, docs/design:2, src/preload:1 | diverged +8/-58 | no | MERGEABLE/UNSTABLE | ~/dev/metis-cp |
| #189 Make the force-quit contract match the force-quit code again | no | codex/review-release-1.9.1 | claude/force-quit-contract @ 579d60a1bac0fedc0a82de2a3bb20ee052b8b55a | 50 / +3706 / -98 | src/main:16, src/renderer:14, src/shared:11, intelligence:6, docs/design:2, src/preload:1 | diverged +8/-58 | no | MERGEABLE/UNSTABLE | ~/dev/metis-fq |
| #188 Right-edge dock: its own panel instead of a squeezed bar (+ fixes the typecheck break) | no | codex/review-release-1.9.1 | claude/dock-panel-design @ 638f506529b7a79175c2ebdbaf0fe0f13bcf5342 | 62 / +5597 / -143 | src/renderer:22, src/main:16, src/shared:11, intelligence:6, docs/design:5, DESIGN.md:1, src/preload:1 | diverged +21/-58 | no | MERGEABLE/UNSTABLE | ~/dev/metis-638 |
| #187 Intelligence: notes are nodes in Relationships, and empty never looks broken | no | codex/review-release-1.9.1 | claude/intelligence-relationship-notes @ f589b45957a771cfa16e1b63e6d8bee29f1065b5 | 53 / +4004 / -153 | src/main:14, src/renderer:13, intelligence:12, src/shared:11, docs/design:2, src/preload:1 | diverged +7/-58 | no | MERGEABLE/UNSTABLE | ~/dev/metis-notes-graph |
| #186 fix(test): CRLF-safe right-edge placement contract | no | main | fix/win-quality-crlf-right-edge @ a340410511db186188dad0b2a91f750ae84d5fc8 | 1 / +8 / -3 | src/main:1 | diverged +1/-83 | no | MERGEABLE/CLEAN | - |
| #179 Métis 1.9.0 — better transcripts + multi-speaker naming | yes | main | cursor/transcript-speakers-190-8ca3 @ 20f41330494080a8d72374ec23a40aafd0880eab | 21 / +945 / -47 | src/main:7, src/shared:6, src/renderer:4, docs:1, docs/asr:1, package.json:1, src/preload:1 | diverged +3/-257 | no | CONFLICTING/DIRTY | - |
| #178 fix: Windows cross-pack DOA (cachedDataRejected) + 1.8.9 unsigned pack | yes | main | cursor/windows-pack-latest-8ca3 @ 569dc7852847de16aa154d55b0eaa06a54e0b549 | 10 / +354 / -137 | scripts:2, .github:1, WINDOWS-PACK-STATUS.md:1, electron-builder.win.yml:1, electron.vite.config.ts:1, package-lock.json:1, package.json:1, src/main:1 | diverged +9/-257 | no | CONFLICTING/DIRTY | - |
| #176 fix(win): afterPack uses --post-sign when Authenticode already ran | no | main | cursor/win-afterpack-postsign-7bea @ ef19d1084a2845a151933c21f110ad8bd0fc7415 | 2 / +42 / -4 | scripts:2 | diverged +1/-259 | no | CONFLICTING/DIRTY | - |
| #168 fix(operator): run deploy/smoke when the repo path contains spaces | no | feat/operator-wow | cursor/operator-deploy-ismain-spaces-16ef @ 08a5fd78d23b97c3acacd62da968eea0e7ff8908 | 4 / +42 / -2 | operator/scripts:4 | diverged +1/-282 | no | MERGEABLE/UNSTABLE | - |
| #167 test: ignore Windows EBUSY when cleaning cli-setup temp dir | no | main | cursor/cli-setup-rm-ebusy-7bea @ cb0b3a13ad3642fc31dceb60aefc66f57070eeee | 1 / +9 / -1 | src/main:1 | diverged +1/-312 | no | MERGEABLE/CLEAN | - |
| #161 fix(operator): heartbeat shipped Operator URL so seats appear on Licenses | yes | cursor/jarvis-orb-fill-bar-rest-6c68 | cursor/metis-operator-default-url-32eb @ b92394d54c6ba326216c1486f3b3030f799ee14f | 15 / +175 / -35 | src/main:6, docs/design:2, operator/src:2, src/renderer:2, src/shared:2, operator:1 | diverged +2/-328 | no | CONFLICTING/DIRTY | - |
| #160 Tony locks: Jarvis fills 41 circle; Bar-only rest cards; minimize on Done | yes | fix/settings-orb-stability-20260905 | cursor/jarvis-orb-fill-bar-rest-6c68 @ 37ea76d79139bffe0faa7bbe3647c2633d269811 | 75 / +1919 / -317 | src/renderer:27, src/main:18, src/shared:12, docs/design:7, operator/src:2, scripts:2, DESIGN.md:1, docs/qa:1 | behind +0/-315 | YES | MERGEABLE/UNSTABLE | - |
| #159 fix(settings): no sideways scroll on Audio / AI (Win) | yes | fix/settings-orb-stability-20260905 | cursor/settings-no-sideways-scroll-3959 @ 83dd0bd4ceb6c74dadbf48b292b2d1ff2b87cea0 | 3 / +82 / -38 | src/renderer:3 | diverged +1/-337 | no | MERGEABLE/UNSTABLE | - |
| #157 G Mantu Intelligence: OneDrive scan+connect and Connections | yes | fix/settings-orb-stability-20260905 | cursor/mantu-intelligence-onedrive-b16d @ c98771ca710295afc0e76eab7e1b177614cba9e8 | 40 / +2350 / -20 | intelligence:11, src/main:10, src/renderer:8, src/shared:8, docs:1, docs/design:1, src/preload:1 | diverged +8/-337 | no | MERGEABLE/UNSTABLE | - |
| #156 Nightly cleanup: dead overlay leftovers + smaller boot chunk | no | main | cursor/nightly-cleanup-dead-logic-f629 @ ead57b2314bdf40d833e2df98735c1be77838ef1 | 15 / +58 / -660 | src/renderer:11, src/shared:2, package-lock.json:1, package.json:1 | diverged +3/-698 | no | CONFLICTING/DIRTY | - |
| #155 Auto-start Listen when joining Teams, Zoom, or Google Meet | yes | fix/settings-orb-stability-20260905 | cursor/auto-start-meetings-cf81 @ 17ceaa047cc845e49ca9e518a21fdec84e813835 | 17 / +857 / -10 | src/main:7, src/shared:5, src/renderer:2, docs:1, docs/design:1, src/preload:1 | diverged +5/-343 | no | MERGEABLE/UNSTABLE | - |
| #154 deep security harden (UX-safe) | yes | fix/settings-orb-stability-20260905 | cursor/metis-security-deep-fable @ b465000fd828aaf8f56fcde82204eab75358d8dc | 73 / +2689 / -354 | src/main:28, scripts:10, operator/src:6, resources:6, docs:4, docs/design:3, docs/security:3, src/shared:3 | diverged +21/-349 | no | MERGEABLE/UNSTABLE | - |
| #153 Operator thin tip: Generate license + Shoey Mission Control PORT | yes | main | cursor/operator-license-thin-cd63 @ d1cf52ff336eeef8dd8d4afc9aac0d9b6ec34ad1 | 73 / +12937 / -72 | operator/src:49, operator:6, src/shared:6, src/main:4, docs/design:2, src/renderer:2, .gitignore:1, package-lock.json:1 | diverged +27/-698 | no | UNKNOWN/UNKNOWN | - |
| #151 draft: Operator Keys + Cloudflare AI Gateway login (no paste) — generate license kept | yes | main | cursor/operator-keys-gateway-cd63 @ 42c6a1973b97d153b5eb62cc5b79b82d135aabf8 | 476 / +48550 / -2230 (file list capped at 100) | license-server:19, native-app/App:12, docs/design:11, operator/src:9, docs:8, intelligence:7, docs/qa:6, native-app/MetisKit:4 | diverged +64/-486 | no | UNKNOWN/UNKNOWN | - |
| #148 Bank-grade harden: Operator question-type tracking, egress allowlist, IPC parse, copy | yes | release/1.8.3 | cursor/metis-bank-grade-fable @ 290a6a6eabc0ed252cc5a1faeaea6530571c84c2 | 86 / +3349 / -248 | src/main:32, src/renderer:18, src/shared:10, operator/src:7, docs/design:3, operator:3, scripts:3, .github:2 | diverged +4/-407 | no | CONFLICTING/DIRTY | - |
| #144 fix(overlay): 1.8.5 KineticGrid + PR148 Security on tip | yes | release/1.8.3 | fix/settings-orb-stability-20260905 @ de25141cf79ce3f61440e7d72e1ae2fced615fde | 132 / +7828 / -655 (file list capped at 100) | src/main:44, src/renderer:19, operator/src:7, docs/design:6, scripts:5, intelligence:4, operator:3, .github:2 | behind +0/-337 | YES | MERGEABLE/UNSTABLE | - |

Summary (VERIFIED): heads already contained in main: #160, #144. Based on a non-main branch: #193→release/1.9.1, #192→codex/review-release-1.9.1, #190→codex/review-release-1.9.1, #189→codex/review-release-1.9.1, #188→codex/review-release-1.9.1, #187→codex/review-release-1.9.1, #168→feat/operator-wow, #161→cursor/jarvis-orb-fill-bar-rest-6c68, #160→fix/settings-orb-stability-20260905, #159→fix/settings-orb-stability-20260905, #157→fix/settings-orb-stability-20260905, #155→fix/settings-orb-stability-20260905, #154→fix/settings-orb-stability-20260905, #148→release/1.8.3, #144→release/1.8.3. Conflicting with base: #194, #191, #179, #178, #176, #161, #156, #148.

### Historical anchors named by MASTER

| Anchor | Observed | Evidence |
|---|---|---|
| MASTER 2.1 main fff88c2686e2ce0d55c26d61413d948b34d2dc47 | equals tag v1.9.5 (package 1.9.5); ancestor of main; main is 53 commits newer | VERIFIED: gh api tags; git show fff88c26:package.json; git rev-list --count |
| MASTER 2.1 PR #194 at a105a258aab0cb9ab07b24dbf85538dce84b6de8 | PR #194 head is still a105a258; diverged from main +81/-53; CONFLICTING | VERIFIED: gh pr list; gh api compare/main...a105a258 |
| MASTER 2.5 #197 fix 7d684b24b2f4a1944388d94dd1c6c5dedfe5cc1a on claude/dock-three-fixes | Commit exists (2026-09-21T09:22:26Z, "fix(main): ignore stale ELECTRON_RENDERER_URL when packaged (GH #197)", touches src/main/index.ts and src/renderer/src/lib/onboarding-boot.test.ts). NOT an ancestor of main (diverged +72/-53, merge-base fff88c26). IS an ancestor of PR #194 head (7d684b24...a105a258: ahead 9, behind 0). Main has a code-site equivalent: devEnv('ELECTRON_RENDERER_URL') at src/main/index.ts:1491 and :2064, introduced by fca1e6b5dba15b889f56feb354332d3a8420ffe6 (2026-09-22, "fix(metis): stabilize onboarding and preserve operator usage integrity"). Ancestry equivalence: NO. Code-site equivalence: YES. Test-file and runtime equivalence: UNKNOWN (not executed). | VERIFIED: git cat-file -t; git show --stat 7d684b24; gh api compare (both directions); git grep ELECTRON_RENDERER_URL HEAD -- src/main; git log -S"devEnv('ELECTRON_RENDERER_URL')" origin/main |
| MASTER 2.5 #196 | issue OPEN; no main commit message references #196 (git log --grep); fix status UNKNOWN | VERIFIED: gh issue view 196; git log origin/main -i --grep |

### Recently merged PRs and the #196/#197 issues

| Item | State | Detail | Evidence |
|---|---|---|---|
| PR #195 "Métis 1.9.6 release candidate" | MERGED 2026-09-23T00:57:08Z | head c006cb51b1d9 (codex/metis-v2-command-sidecar), merge 55f8b06b3ff4 | VERIFIED: gh pr view 195 |
| PR #199 "Stabilize Métis onboarding and Operator usage integrity" | MERGED 2026-09-23T04:42:43Z | head 5bc7ce013369 (codex/metis-operator-seat-identity-ui), merge bf2358e148b2 | VERIFIED: gh pr view 199 |
| PR #198 "Fix Metis review blockers" | MERGED 2026-09-23T14:10:36Z | head 06e12eaa0332 (codex/metis-review-fix-1), merge 2bf21f1c = main | VERIFIED: gh pr view 198 |
| Issue #196 "P1 Dig 1.9.8 Act2 demo: onboard-cta Next does not advance (tip ac1a62d8e3)" | OPEN | updated 2026-09-21T09:19:46Z | VERIFIED: gh issue view 196 |
| Issue #197 "P1 Dig packaged app honors stale ELECTRON_RENDERER_URL -> localhost:5173 black screen (tip ac1a62d8e3)" | OPEN | updated 2026-09-21T09:22:38Z | VERIFIED: gh issue view 197 |
| Other open issues | OPEN | 18 open in total, including P0 #183, #184, #185 and Operator UI issues #104-#124 | VERIFIED: gh issue list --state open --limit 30 |

### Tags on AskToto-Mantu

27 tags (VERIFIED: gh api repos/mysticalsin/AskToto-Mantu/tags --paginate). Newest version tag is v1.9.5 (fff88c26). No v1.9.1, v1.9.6 or v1.9.8 tag exists on the source repo, although package.json on main is 1.9.6 and the release feed has 1.9.1/1.9.6/1.9.8 entries.

| Tag | Commit |
|---|---|
| v1.9.5 | fff88c2686e2ce0d55c26d61413d948b34d2dc47 |
| v1.8.9 | 4607dcd0b6a1f06e721b8ca44459b09dd79545c4 |
| v1.8.8 | 48c180f581ab04d6bcf0b116d756debeea8ab3c6 |
| v1.6.6 | 7f4c625736fb0c2d6a97aebcf414cc8e56afed59 |
| v1.6.5 | 84d79ebce2823c12ff2282ad1380767bda9e9533 |
| v1.6.3 | f068e9073dddfc23c6e5e58e67a6220d7d40cee1 |
| v1.6.1 | 832dce4f5febe5bb8a7a78c8690e0778522ab099 |
| v1.6.0 | 9ac9b990450eb53fab8d77212015f6025b42afb3 |
| v1.5.4 | 9b3ea106b67111889b08e4e4f5c7a58f0a9bf703 |
| v1.5.3 | 4245cbf92a4a5507d796f10233ea86ccaef9c18d |
| v1.5.2 | f9ea5e76da811447dd16dfc6fc7fbff79e3d1cc2 |
| v1.5.1 | a7958d38248588ecfa3a3449e4772d6e1534d8e0 |
| v1.5.0 | 7d1db65d64ea4e02a1ac6983157dd33c81374be3 |
| v1.4.0 | a28d6d5ac766abf3ee0eb75d8fe1eb4ec3e2c78b |
| v1.3.0 | ac1f795c4fb0f2aa73da0e856b949f4dccd05376 |
| v1.2.0 | dbfd4ca97ec46f531c314cc42fd7d2cb5aa1852f |
| v1.0.9 | 8d2cb11a724ebad02186f6ce7c977c661587d300 |
| v1.0.6 | 194347cd77b417de6d7ccc650da5602e0b3eb683 |
| v1.0.5 | 5715d00bd1e81ac2dfd356f7edd04b82a2006cd4 |
| v1.0.4 | 34ad395c72b2a2663381fb3b49b2bf6ed9a8d980 |
| v1.0.3 | d26597ad759c80fc4e9b246e57602728f4b4c1cb |
| v1.0.1 | 15c385d1be40356751247a9adee98460c9c0ae09 |
| v1.0.0 | 8d27c84abc9bc0d0ae8b1a67e9af864802d215b0 |
| preview-metis-1.0.0 | 3220d666cb5a42c18b1d90c62a22f86a4a0b751c |
| metis-qa-transfer | ffcbf9116b9abb3ef79ddbdda6aec70c729bb8c1 |
| local-preview-2026-07-05 | 78d9bc5816cf1352b41501cb4cb826eee0a46aba |
| ffmpeg-sidecar-v1 | 55e202fc63e98bbd0fe93d277d869126afdd0180 |

### Releases on AskToto-Mantu (source repo, not the update feed)

| Tag | Draft | Prerelease | Latest | Published |
|---|---|---|---|---|
| metis-qa-transfer | True | True | False | - |
| v1.8.9-unsigned-win | True | False | False | - |
| v1.8.9 | False | False | True | 2026-09-09T20:14:54Z |
| v1.8.4 | True | True | False | - |
| v1.8.3 | True | False | False | - |
| v1.7.0 | True | False | False | - |
| v1.6.1 | True | False | False | - |
| v1.5.4 | True | False | False | - |
| v1.5.3 | False | False | False | 2026-08-06T13:19:07Z |
| v1.5.2 | False | False | False | 2026-08-05T20:02:45Z |
| v1.5.1 | False | False | False | 2026-08-05T15:52:11Z |
| v1.2.0 | False | False | False | 2026-07-19T20:21:33Z |
| v1.0.9 | False | False | False | 2026-07-16T12:33:04Z |
| v1.0.6 | False | True | False | 2026-07-15T19:03:00Z |
| v1.0.5 | False | True | False | 2026-07-15T02:43:03Z |
| v1.0.4 | False | True | False | 2026-07-15T00:06:57Z |
| v1.0.3 | False | True | False | 2026-07-14T23:21:13Z |
| preview-metis-1.0.0 | False | False | False | 2026-07-10T14:34:56Z |
| ffmpeg-sidecar-v1 | False | False | False | 2026-07-10T11:52:35Z |
| local-preview-2026-07-05 | False | True | False | 2026-07-06T00:18:17Z |
| v1.0.0 | False | False | False | 2026-07-02T22:52:52Z |

### Release feed mysticalsin/Metis-Releases

- **repo**: public, default branch main, pushed_at 2026-09-07T04:07:25Z, mirror_url null (VERIFIED: gh api repos/mysticalsin/Metis-Releases)
- **rulesets**: protect-all-branches-deletion (branch, active); protect-release-tags (tag, active) (VERIFIED: gh api repos/mysticalsin/Metis-Releases/rulesets)
- **git_tags_summary**: 8 tags, all at commit da18499f8a71e3f34716c867a0a597a553648bf3: v1.9.6-unsigned, v1.8.7, v1.8.4, v1.8.3, v1.6.6, v1.6.5, v1.6.3, v1.5.3 (VERIFIED: gh api repos/mysticalsin/Metis-Releases/tags --paginate)

| Release tag | Draft | Prerelease | Latest | Published | Created | Git tag exists |
|---|---|---|---|---|---|---|
| v1.9.8 | True | True | False | - | 2026-09-21T12:45:29Z | no |
| v1.9.1 | True | False | False | - | 2026-09-14T06:48:26Z | no |
| v1.8.9 | True | False | False | - | 2026-09-08T02:51:18Z | no |
| v1.9.6-unsigned | False | True | False | 2026-09-24T04:14:36Z | 2026-07-18T14:54:45Z | yes |
| v1.8.7 | False | True | False | 2026-09-07T04:07:25Z | 2026-07-18T14:54:45Z | yes |
| v1.8.4 | False | True | False | 2026-09-03T09:35:26Z | 2026-07-18T14:54:45Z | yes |
| v1.8.3 | False | True | False | 2026-09-02T15:28:34Z | 2026-07-18T14:54:45Z | yes |
| v1.6.6 | False | False | True | 2026-08-26T13:37:32Z | 2026-07-18T14:54:45Z | yes |
| v1.6.5 | False | False | False | 2026-08-26T13:37:31Z | 2026-07-18T14:54:45Z | yes |
| v1.6.3 | False | False | False | 2026-08-26T13:37:31Z | 2026-07-18T14:54:45Z | yes |
| v1.5.3 | False | False | False | 2026-08-06T13:17:53Z | 2026-07-18T14:54:45Z | yes |

/releases/latest = v1.6.6 (published 2026-08-26T13:37:32Z; VERIFIED gh api releases/latest). v1.8.3, v1.8.4, v1.8.7 are published prereleases; v1.8.9, v1.9.1, v1.9.8 are drafts with no git tag. STATE CHANGED DURING THIS SESSION: the first listing showed v1.9.6-unsigned as a draft prerelease created 2026-09-24T03:53:59Z; a second listing shows it PUBLISHED as a prerelease at 2026-09-24T04:14:36Z with tag v1.9.6-unsigned at da18499f, author account mysticalsin, name "Métis 1.9.6 (unsigned / ad-hoc)", assets Metis-1.9.6.dmg, Metis-1.9.6.zip, Metis-Portable-1.9.6.exe, Metis-Setup-1.9.6.exe, SHA256SUMS.txt, and no latest.yml or latest-mac.yml. This lane made no GitHub write; who published it (Tony or an agent using his account) is UNKNOWN. It conflicts with SIGNING.md:29 ("Local ad-hoc packages ... must never be uploaded to the public release feed"). Whether installed clients see it: ASSUMED no auto-update, because electron-updater's GitHub provider reads latest*.yml and none is attached; not verified. If the Forgejo mirror is live, this GitHub-only tag is at risk of deletion at the next sync (ENTERPRISE_RELEASE.md:49-56).

### CodeNotch reference (R75)

vinzdg/codenotch: public, MIT (GitHub license field), default main, HEAD 731a23d8e057862c2ff151bde8e8d9274f5e950a (2026-09-24T02:39:35Z), newest tag v1.17.0 (aae2c1f77bd2) (VERIFIED: gh api repos/vinzdg/codenotch, commits/HEAD, tags). Upstream is moving (pushed 2026-09-24). Pin a specific SHA at adaptation time. No source or license-file audit beyond the GitHub license field was done in this lane (R75).

## 5. Tony's local clones (ownership: Tony; untouched)

Read with `git --no-optional-locks` (no index refresh, no fetch). Ahead/behind is against the locally cached tracking ref, which may be stale: no fetch was run. Full dirty-file lists are in the JSON.

| Path | Branch | HEAD | Ahead/behind | Remotes (userinfo redacted) | Dirty count | Dirty files (first 6) | .git |
|---|---|---|---|---|---|---|---|
| ~/AI-Brain-build | main | 952771312d5880b91cf777484d520859e753cca7 | +0/-0 vs local-backup/main | local-backup=/Users/tony/AI-Brain-build-backups/build.git | full status TIMEOUT (60 s); tracked-only status: 10 modified | M build/tools/build_brain_api.py; M build/tools/build_brain_index.py; M build/tools/capture_session.py; M build/tools/convert_docs_to_md.py; M build/tools/promise_ledger.py; M build/tools/recall.py (+4 more) | dir |
| ~/dev/metis-1.9.5-release-audit | (detached) | 24ced518740c90395d101d05410e648473a76bcd | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 2 | ?? docs/design/CAP4-BAR-CENTRALIZE-WAKE-LOCK.md; ?? docs/design/CAP4-INTEGRATE-LOCK.md | dir |
| ~/dev/metis-183-pack | release/1.8.3 | 56cd0fe1407993b0f899153015f636002072c3bf | +0/-0 vs origin/release/1.8.3 | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 2 | M electron-builder.yml; M native-app/project.yml | file(worktree) |
| ~/dev/metis-183-show | (detached) | 2eee2e1d80730819b990da91db0808226d1beecd | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? qa-bob/ | file(worktree) |
| ~/dev/metis-638 | (detached) | 638f506529b7a79175c2ebdbaf0fe0f13bcf5342 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-cap3-cp-gate | fix/cap3-qa-tip-cp-packaged-gate | a5eb53dcca788bcc00b3a44e3b9f49f9f6bde84d | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | file(worktree) |
| ~/dev/metis-cp | claude/content-protection-stub | 1e59059fb5fd67b476b103fa0b8b1085dcbf1674 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-dock-design | claude/cap4-motion-onboarding-fix | 57ba07af30d44cd4b35dec0f4bacefeaafa3a76e | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | file(worktree) |
| ~/dev/metis-enterprise-audit-20260909 | main | de418ae15a13f939c6678d29eb0f2f9916257ce9 | +0/-0 vs origin/main | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | dir |
| ~/dev/metis-fe-cand-12c295e9 | (detached) | 12c295e90a1fcd46439cdce3771fb2427c5a34bd | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-fe-cand-2f06669e | (detached) | 2f06669ea116a44f82f5bb55d6087afccd9fc78d | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-fe-eye-3d6825f9 | (detached) | 3d6825f9c61f718e15b4edc34311386c9667eaa5 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-fe-eye-65eaa6a2 | (detached) | 65eaa6a21bc87e2e6d5258380f26d7f4ee462a56 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-fe-eye-72c36473 | (detached) | 72c36473d803b349f69039cfddc700e7fd10d3bf | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-fe-eye-b634fea9 | (detached) | b634fea9b7444dc1827b546cf9baa3c3cfe7950b | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-fe-only-318e0ab2 | (detached) | 318e0ab2adf376fe8955d472818ed835ce14002f | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-fe-sot-d7307a22 | (detached) | d7307a2220fc6fd2cc07b2d687f09961ac9c1b51 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-fix3 | claude/dock-three-fixes | a4fa77eb92ad647d43e6c1e8357fcaad501c226e | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | file(worktree) |
| ~/dev/metis-fq | claude/force-quit-contract | 579d60a1bac0fedc0a82de2a3bb20ee052b8b55a | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-fx3 | (detached) | a105a258aab0cb9ab07b24dbf85538dce84b6de8 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | file(worktree) |
| ~/dev/metis-glass | (detached) | 9fb913f1bd39fbbf15619cbffdebc85e3a5b3281 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-notes-graph | claude/intelligence-relationship-notes | f589b45957a771cfa16e1b63e6d8bee29f1065b5 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-operator-restore | restore/operator-pre-shoey-keep-access | ed8755a9ebe157ac267202b74fba69757e2888c3 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? operator/.wrangler/ | file(worktree) |
| ~/dev/metis-portal | claude/operator-portal-2.0 | de048b7a27b3680c2c94582ec12f42ced46de6bf | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 4 | ?? .agents/; ?? skills-lock.json; ?? skills/autofix; ?? skills/code-review | file(worktree) |
| ~/dev/metis-pr144-local | (detached) | 11dd8839555dc801210638953f851a069fcf39a2 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 17 | ?? docs/design/METIS-LITE.md; ?? docs/design/METIS-PCC.md; ?? scripts/qa/g-autolisten-ultron-proof.mjs; ?? scripts/qa/g-brain-read.mjs; ?? scripts/qa/g-brain-status.mjs; ?? scripts/qa/g-cli-connect.mjs (+11 more) | file(worktree) |
| ~/dev/metis-pr195-ver | codex/metis-operator-seat-identity-ui | 5bc7ce01336980509dc5c53b7d254dae6f2e8dc2 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | file(worktree) |
| ~/dev/metis-pr58 | overlay-68-show | 811fed9eae8cff1aee46b664820f74bdbead942b | +0/-91 vs origin/fix/settings-orb-stability-20260905 | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 41 | M .gitignore; M docs/design/OPERATOR.md; M native-app/project.yml; M operator/schema-alter.sql; M operator/schema.sql; M operator/src/access.ts (+35 more) | file(worktree) |
| ~/dev/metis-prove-b-src | - | - | - | - | UNREADABLE | fatal: failed to read /Users/tony/Library/CloudStorage/OneDrive-MantuGroup/Documents/Chief of Staff/Apps Source/Metis Portal/.git/worktrees/metis-prove-b-src/commondir: Operation timed out | - |
| ~/dev/metis-review-fix-1 | codex/metis-review-fix-1 | 55f8b06b3ff499dc3a20e5ac820bb376e7d2cbe0 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 7 | M src/main/metis-command-boundary.contract.test.ts; M src/renderer/src/App.tsx; M src/renderer/src/components/RightEdgeSidecar.test.tsx; M src/renderer/src/lib/onboarding-appearance.test.ts; M src/renderer/src/styles.css; ?? src/renderer/src/lib/right-edge-dismissal-lock.test.ts (+1 more) | file(worktree) |
| ~/dev/metis-rf3 | claude/dock-three-fixes | ac1a62d8e377effcffc6f5bcc24bdd1717316adb | +0/-0 vs origin/claude/dock-three-fixes | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | dir |
| ~/dev/metis-verify-2.0 | (detached) | e23160a2eeac83c4c58762c7c4b2917f3757a6b9 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | ?? node_modules | file(worktree) |
| ~/dev/metis-voice-action-v1 | codex/metis-voice-action-v1 | 8f1c7b936c1b9da6a4bf72c69a3392c6658de25d | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | file(worktree) |
| ~/AI-Brain-build/CosyVoice | main | 074ca6dc9e80a2f424f1f74b48bdd7d3fea531cc | +0/-0 vs origin/main | origin=https://github.com/FunAudioLLM/CosyVoice.git | 2 | ?? requirements-mac.txt; ?? requirements-mac2.txt | dir |
| ~/AI-Brain-build/TotoWhisper | main | 8d4592402e73dcdc7d00adaeb5452ebcc3fe87c0 | no upstream | none | 13 | M Package.swift; M Sources/TotoWhisper/App/RecordingCoordinator.swift; M Sources/TotoWhisper/App/Settings.swift; M Sources/TotoWhisper/App/TotoWhisperApp.swift; D Sources/TotoWhisper/Insertion/README.md; M scripts/bundle.sh (+7 more) | dir |
| ~/AI-Brain-build/Walteur | main | 239f3432d665f0624a0df8f22b844dfe1b756072 | no upstream | origin=https://github.com/mysticalsin/walteur.git | 0 | - | dir |
| ~/AI-Brain-build/Wisp | main | 35b3616453f2a84776bac7229eab5b5d7ad33ca7 | no upstream | none | 13 | M Sources/Wisp/App/RecordingCoordinator.swift; M Tests/WispTests/InsertionServiceTests.swift; M Tests/WispTests/PolisherChainTests.swift; M Tests/WispTests/StubTranscriptionEngine.swift; M Tests/WispTests/TextProcessingStoresTests.swift; M Tests/WispTests/UIMenuBarIconStyleTests.swift (+7 more) | dir |
| ~/AI-Brain-build/asktoto-cahe-build | - | - | - | - | UNREADABLE | gitdir is /Users/tony/Library/CloudStorage/OneDrive-MantuGroup/Documents/Chief of Staff/Apps Source/AskToto/.git/worktrees/asktoto-cahe-build; every git command TIMEOUT (90 s) | - |
| ~/AI-Brain-build/asktoto-main | main | ebb909d79b8def5deb5e0954039c9619c853f6d4 | +0/-384 vs origin/main | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | dir |
| ~/AI-Brain-build/asktoto-release-v13 | main | ac1f795c4fb0f2aa73da0e856b949f4dccd05376 | +0/-0 vs origin/main | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | dir |
| ~/AI-Brain-build/asktoto-win-src | main | cc9faf563b03f7eab1e3435bbb3e517aa855a0a6 | +0/-0 vs origin/main | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | dir |
| ~/AI-Brain-build/holo-inspect | main | 530a85c85a6d514d6299b1642bd9e98b8b25ab48 | +0/-0 vs origin/main | origin=https://github.com/JustinGamer191/Holo.git | 0 | - | dir |
| ~/AI-Brain-build/impeccable | main | af78b1e512148e2a2f2d2ded6786d265ea420191 | +0/-0 vs origin/main | origin=https://github.com/pbakaus/impeccable.git | 0 | - | dir |
| ~/AI-Brain-build/mantu-presentation-center | main | bd7a8b7e1d83181fbd80fbdd1e5e117e0f515d95 | no upstream | none | 38 | M apps/server/src/routes/presentations.test.ts; M apps/server/src/routes/presentations.ts; M apps/web/src/App.tsx; M apps/web/src/components/Sidebar.tsx; M apps/web/src/components/StageTimeline.tsx; M apps/web/src/components/brand-kit/BrandForm.tsx (+32 more) | dir |
| ~/AI-Brain-build/metis-1.1.0 | feat/desk-tap-control | 82da6f47d477e0be4eac0057dba29870c8e495ea | +0/-0 vs origin/feat/desk-tap-control | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 1 | M resources/runtime-assets-manifest.json | dir |
| ~/AI-Brain-build/metis-1.2.0-rebase | feat/1.2.0-rebase | da54cbc93317ff6bfa24f7190f277a4a6b8fa53a | +0/-0 vs origin/feat/1.2.0-rebase | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 4 | ?? .forge/qa-phys-final.mjs; ?? .forge/qa-screenauth.mjs; ?? PHYS-FINAL-REPORT.md; ?? PHYS-FINAL-SHOTS/ | dir |
| ~/AI-Brain-build/metis-1.5.4-build | build/1.6.1 | 14e4e6d8cfbc5e3a36c3bb58c21f9b346395d032 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | dir |
| ~/AI-Brain-build/metis-183-pack | (detached) | 2eee2e1d80730819b990da91db0808226d1beecd | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | file(worktree) |
| ~/AI-Brain-build/metis-2.0 | claude/metis-2.0-task-001 | 2bf21f1ceefe117838325342574b57852e5cadcb | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | file(worktree) |
| ~/AI-Brain-build/metis-ci-verify | (detached) | 9c187fb1ee35a38672313a524c74c36c15ea3fa5 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 14 | M package-lock.json; M scripts/build-light.mjs; M src/main/edition.test.ts; M src/main/edition.ts; M src/main/llm/local-routing.test.ts; M src/main/llm/local-routing.ts (+8 more) | dir |
| ~/AI-Brain-build/metis-operator-ux | codex/operator-ux-rock-1 | 5e988489aad5ddc3d97ddbab4f4d0693f3a79833 | +2/-0 vs origin/main | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | dir |
| ~/AI-Brain-build/metis-sec | feat/sec-hardening | 144f1a1ef29cb1fadd2e3217ecc82040d31caf68 | no upstream | origin=/Users/tony/AI-Brain-build/metis-1.2.0-rebase | 0 | - | dir |
| ~/AI-Brain-build/metis-tx-work | (detached) | 36c8ec3fd5813c6d55cdc779bab212b22ddaf260 | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 0 | - | file(worktree) |
| ~/AI-Brain-build/neutts-air | main | 857bec0255f13ec726db5af76e5b97426183a724 | +0/-0 vs origin/main | origin=https://github.com/neuphonic/neutts-air.git | 5 | ?? neutts_daemon.py; ?? neutts_daemon.py.20260607-021923.bak; ?? ultron-ref-long.txt; ?? ultron-ref-long.wav; ?? ultron_fx.py | dir |
| ~/AI-Brain-build/tetris-go | main | 8e9dcc1a1bc5b26b4c6324e1f1a67a112264a87a | no upstream | none | 17 | M README.md; M index.html; M input.js; M main.js; M pieces.js; M test/a11y-checks.mjs (+11 more) | dir |
| ~/AI-Brain-build/thought-topology | build/thought-topology | 6007d9f4b3b2e6f2e6b7d2a8607e33f668541922 | no upstream | none | 0 | - | dir |
| ~/AI-Brain-build/tony-second-brain | main | 4d7c675174affbdd1809c57505a54f14e967cfc4 | +1/-0 vs origin/main | origin=https://github.com/mysticalsin/tony-second-brain.git | 6 | M infra/tools/build_analytics.py; M specs/06-hard-won-lessons.md; ?? .DS_Store; ?? infra/tools/__pycache__/; ?? infra/tools/build_analytics.py.bak-graphfix-20260902-053342; ?? infra/tools/build_analytics.py.bak-graphfix2-20260903-004729 | dir |
| ~/AI-Brain-build/verify-v1.3.0-gate | v150-gate | 4245cbf92a4a5507d796f10233ea86ccaef9c18d | no upstream | origin=https://github.com/mysticalsin/AskToto-Mantu.git | 39 | ?? lane6-run-copyforward.mjs; ?? lane6-run-recovery.mjs; ?? qa-ask-memory-lane2.mjs; ?? qa-cdp-probe.mjs; ?? qa-gate-dev.mjs; ?? qa-import-real.mjs (+33 more) | dir |
| ~/AI-Brain-build/walteur-v11 | main | b6b992c7872d2bbeb48d2db319e8c8bf6dfbcfe9 | +14/-0 vs origin/walteur-pro-coding | origin=https://github.com/mysticalsin/walteur-framework.git | 2 | M field-runs/engine-humansize; M field-runs/jsonlint-cli | dir |

- UNREADABLE: ~/dev/metis-prove-b-src and ~/AI-Brain-build/asktoto-cahe-build have their gitdir inside OneDrive ("Chief of Staff/Apps Source/..."), and reads time out (dataless placeholders). Nothing was repaired or hydrated beyond the attempted reads.
- ~/AI-Brain-build is itself a git repo (main @ 95277131, remote local-backup). ~/AI-Brain-build/ai-success sits inside it and is not a separate repo.
- The AskToto object store behind metis-2.0 is ~/AI-Brain-build/metis-operator-ux (codex/operator-ux-rock-1 @ 5e988489, +2 vs cached origin/main).
- Tracking refs are stale because no fetch was run. Example: branch claude/dock-three-fixes resolves to a105a258 on GitHub (PR #194), ac1a62d8 in ~/dev/metis-rf3 (shows 0/0 against its cached ref), and a4fa77eb in ~/dev/metis-fix3. ~/dev/metis-fx3 holds the live PR #194 head detached.
- "?? node_modules" in many ~/dev worktrees is an untracked symlink to another worktree's node_modules (VERIFIED: ls -ld ~/dev/metis-638/node_modules -> ~/dev/metis-fix3/node_modules). It is not source work.
- Clones with real uncommitted source edits (Tony's, preserved): ~/dev/metis-pr58 (41, operator and schema files), ~/dev/metis-pr144-local (17), ~/AI-Brain-build/metis-ci-verify (14), ~/dev/metis-review-fix-1 (7, renderer right-edge), ~/dev/metis-portal (4, agent skill files), ~/dev/metis-183-pack (2: electron-builder.yml, native-app/project.yml), ~/AI-Brain-build/verify-v1.3.0-gate (39 untracked QA scripts), ~/AI-Brain-build/metis-1.2.0-rebase (4), ~/AI-Brain-build/metis-1.1.0 (1).
- No readable clone has a Forgejo remote or a remote named github. The OneDrive primary clone ".../Apps Source/AskToto/.git/config" was readable and lists only origin = GitHub; ".../Apps Source/Metis Portal/.git/config" timed out (25 s).

## 6. Forgejo / mirror configuration (SRC-18)

**Verdict: MIRROR_DOCUMENTED_NOT_VERIFIABLE**

- Docs describe Forgejo push-mirrors for tony/AskToto-Mantu (every 8 h) and tony/Metis-Releases that delete any ref Forgejo does not hold. (DOCUMENTED: docs/ENTERPRISE_RELEASE.md:49-62; scripts/push-both.sh:2-6; docs/PLATFORM-MAP.md:66; docs/qa/audit-2026-08-29-product-review.md:48)
- scripts/push-both.sh pushes to remotes named github and origin, so it assumes origin = Forgejo. In every readable AskToto clone origin is GitHub https (metis-sec's origin is a local clone path) and no clone has a remote named github, so the script would never reach Forgejo from these clones. (VERIFIED: scripts/push-both.sh:10; git remote -v across the clone inventory; git config of metis-operator-ux and the OneDrive AskToto clone)
- The documented Forgejo URL ssh://forgejo/tony/Metis-Releases.git relies on an SSH host alias. ~/.ssh/config is sandbox-denied and was not read. (UNKNOWN: ENTERPRISE_RELEASE.md:50; sandbox read deny list includes ~/.ssh)
- ~/.gitconfig has no forgejo or insteadOf entry. (VERIFIED: grep -i "forgejo|insteadof" ~/.gitconfig: no match)
- GitHub reports mirror_url null for both repos. That field covers only GitHub pull mirrors, so it cannot show an external push mirror. (VERIFIED (inconclusive): gh api repos/mysticalsin/AskToto-Mantu; gh api repos/mysticalsin/Metis-Releases)
- Metis-Releases ruleset protect-release-tags is active, matching the documented backstop. AskToto-Mantu has no tag ruleset but has 5 branch rulesets. (VERIFIED: gh api .../rulesets)
- Metis-Releases v1.6.3/v1.6.5/v1.6.6 share publishedAt 2026-08-26T13:37:31-32Z, consistent with the documented 2026-08-26 draft-demotion recovery. (ASSUMED (correlation only): gh release list --repo mysticalsin/Metis-Releases)
- Forgejo host, mirror settings, cadence and whether it is still authoritative. (UNKNOWN: no Forgejo URL, API token or account in this session)

## 7. Input register (MASTER section 2.5, R72 to R75)

| Input | Status | Location / identity | Evidence |
|---|---|---|---|
| This conversation and revision-3 contract | NOT_AVAILABLE (as raw input) | No transcript was supplied to this lane; MASTER rev 4.5 section 25 carries it forward | MASTER.md:219 |
| Metis-Codex-Master-Update-Prompt.md (R72) | FOUND | /Users/tony/Downloads/Metis-Codex-Master-Update-Prompt.md (37,746 bytes, 330 lines, sha256 3e7d6c11e12a564528f41751d8d627c04b8bf0d125b11a1c38f5c9ca86548031) | VERIFIED: find ~/Downloads; shasum -a 256; header reads "Prepared September 20, 2026", matching MASTER.md:3567. Not copied; content diff against MASTER not done in this lane |
| Metis-Jev-Integration-Plan.md (R73) | NOT_AVAILABLE | not found | VERIFIED: name search (*Jev-Integration*, *Jev*Plan*) found nothing in ~/Downloads, ~/Desktop, ~/Documents, ~/AI-Brain-build, ~/dev, ~/Library/Mobile Documents (maxdepth 7), ~/.claude/plans, ~/.codex or the kit; mdfind returned nothing; OneDrive Documents walk: INCOMPLETE: python os.walk of /Users/tony/Library/CloudStorage/OneDrive-MantuGroup/Documents (maxdepth 6) stalled after about 600 directories (last progress under /Trainings/Skills/Pro Coding/walteur-kit) with no hit; two earlier find runs stalled with no output. OneDrive coverage is partial |
| Original Claude master-plan artifact (R74) | FOUND (readable via owner connector) | https://claude.ai/artifact/XEWcXFYw9fPsRvu79Mqn8f -> Tony's private Claude Docs doc "Métis Optimization PRD" (doc id f4d513ff-fb7d-4b84-be4a-286deee48f50), byline date 2026-09-21, rev 23, one tab. H2 sections as the outline projection truncates them: "Where we stand", "Why now", "P0 — Unblo…", "P1 — Perfo…", "P2 — Security", "P3 — Ship", "P4 — Conso…", "P5 — Laya:…", "P6 — Cost", "Sequenced plan", "Success metrics", "Non-goals,…", "P7 — Two m…" | VERIFIED: Artifact read (owned by the user, private) + Claude Docs read, outline projection only. Content not copied. ASSUMED: this is the "original master-plan artifact" because it is the exact URL R74 names; its title says PRD. The kit (BLOCKERS.md, MASTER.md:222) still says "not recovered"; that is now stale. Diff against MASTER is still required before claiming coverage |
| Separately promised refactoring skill | NOT_AVAILABLE (not identified) | none identified | VERIFIED: no refactor file in the repo (git ls-files \| grep -i refactor); the recovered R72 brief has no "refactor" match; MASTER mentions it only as missing (MASTER.md:223, 1680, 1712). Present but NOT identified as the promised skill: ~/.claude/skills/mantu-legacy-modernization, ~/.claude/skills/mantu-tech-debt-audit-for-client, ~/.claude/skills/karpathy-guidelines, ~/.codex/.tmp/plugins/plugins/build-macos-apps/skills/view-refactor, ~/.codex/.tmp/plugins/plugins/build-ios-apps/skills/swiftui-view-refactor. MASTER 18.1 names Ponytail [R37] as complementary guidance only. Do not apply a guessed skill |
| Uploaded desktop-control clip and orb/bar images | FOUND | /Users/tony/AI-Brain-build/metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/references/assets/: jev-desktop-reference.mp4 (sha256 0cb3bbe8d3e5...), orb-reference.png (2705841660...), bar-reference.png (287be30652...), previous-command-showcase.png, right-edge-broken.png, expanded-panel-broken.png, architecture-inspiration.jpeg, historical-metis-architecture.png | VERIFIED: ls; shasum -a 256. Clip audio and interaction sequence not verified in this lane |
| Actual onboarding video (Tony Walteur welcome) | NOT_AVAILABLE (NOT_PROVIDED) | /Users/tony/AI-Brain-build/metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/onboarding/media/tony-walteur.manifest.json: status NOT_PROVIDED, video null, fallback METIS_TEXT_WELCOME | VERIFIED: cat manifest. Historical lineage in repo: April-29 hero clip src/renderer/src/assets/onboarding-hero-lady-planet.mp4 (blob 9addd7c738f5) with a remote CloudFront fallback at src/renderer/src/lib/onboarding-hero-video.ts:12, and Goldberg Aria src/renderer/src/assets/music/goldberg-variations-aria.ogg (blob 606130bad5aa). These are the SRC-15 lineage, not Tony's recording |
| GitHub UI models/prototypes/PRs and CodeNotch (R75) | FOUND (lineage inspected) | 26 open PRs with full head SHAs (section 4); vinzdg/codenotch HEAD 731a23d8 | VERIFIED: gh pr list/view; gh api compare; gh api repos/vinzdg/codenotch. Which PR is the "approved design implementation" is UNKNOWN (no approval record found); owner decision |
| 1.9.5 source export (MASTER section 29 input) | FOUND | /Users/tony/AI-Brain-build/metis-kit-r11/Metis-2.0-Upgrade-Kit-r11/references/source/metis-1.9.5-export.txt | VERIFIED: sha256 efc8af651c1b...53f3 equals MASTER section 29 |

## 8. Documentation versus live state

- README.md:295 says branch protection on main is not configured. **Live:** main protected=true; 5 active branch rulesets including protect-main-deletion. (VERIFIED: gh api branches/main; rulesets)
- ENTERPRISE_RELEASE.md:58 says the GitHub code repo is private on the free plan, so no ruleset backstop is possible. **Live:** mysticalsin/AskToto-Mantu is public and has rulesets (none tag-target). (VERIFIED: gh api repos/mysticalsin/AskToto-Mantu; rulesets)
- SIGNING.md:29 says ad-hoc packages must never be uploaded to the public release feed. **Live:** Metis-Releases v1.9.6-unsigned ("Métis 1.9.6 (unsigned / ad-hoc)") was published as a prerelease at 2026-09-24T04:14:36Z, during this session, by account mysticalsin. Actor UNKNOWN; this lane wrote nothing. (VERIFIED: gh release list (two reads, state changed); gh release view v1.9.6-unsigned)
- scripts/push-both.sh expects remotes github and origin=Forgejo. **Live:** No readable clone has either layout. (VERIFIED: clone inventory remotes)
- Release process: tag vX.Y.Z equals package.json version (ENTERPRISE_RELEASE.md:47). **Live:** main is 1.9.6 with no v1.9.6 source tag; the feed has a v1.9.6-unsigned tag at the release repo's own commit only. (VERIFIED: tag listings)
- GitHub Actions billing blocked on 2026-07-10 (ENTERPRISE_RELEASE.md, SIGNING.md). **Live:** Not re-checked in this lane. (UNKNOWN)

## 9. Not covered by this lane

- Deployed Operator Worker version, deployment ID, D1 database binding and migration level; Cloudflare account and AI Gateway identities (wrangler whoami / deployments list). The live portal version must not be inferred from main.
- Installed Métis clients (Mac/Windows) and their exact versions.
- Baseline typecheck/test/build exits (npm test, typecheck, swift test, license-server node --test): not run, by instruction (no npm scripts in the worktree).
- Content diffs of the R72 brief and the R74 doc against MASTER.
- GitHub Actions run, billing and secret state.

## 10. Blockers

| Item | Owner | Exact error | Smallest unblock | Affects |
|---|---|---|---|---|
| Forgejo mirror authority and settings cannot be verified (SRC-18) | Tony | No Forgejo URL, token or account in session; ~/.ssh/config is sandbox-denied; ".../Apps Source/Metis Portal/.git/config" read TIMEOUT (25 s) | Tony states whether the Forgejo mirror is still live and authoritative, and if so gives the Forgejo base URL plus a read-only view (or screenshots) of the mirror settings for tony/AskToto-Mantu and tony/Metis-Releases | TASK-002, TASK-027, TASK-062, TASK-063, TASK-064, TASK-066 |
| Metis-Jev-Integration-Plan.md (R73) not found on disk | Tony | no file matching *Jev-Integration* / *Jev*Plan* in the searched local locations; the OneDrive Documents search did not complete (os.walk stalled after about 600 directories, two find runs stalled with no output) | Tony supplies the file path or a copy | TASK-001 input closure; Jev trust/verification tasks |
| Promised refactoring skill not identified | Tony | no named skill/version in repo, kit, briefs or skill folders | Tony names the skill and its location/version | TASK-053 to TASK-061 refactor work |
| Two OneDrive-hosted worktrees unreadable | Tony | fatal: failed to read .../Apps Source/Metis Portal/.git/worktrees/metis-prove-b-src/commondir: Operation timed out; asktoto-cahe-build git commands TIMEOUT (90 s) | Tony repairs OneDrive sync for "Chief of Staff/Apps Source" or confirms those two worktrees hold no work to preserve | TASK-001 dirty-state completeness |
| Unsigned 1.9.6 build published to the public feed during this session | Tony (release owner) | Metis-Releases v1.9.6-unsigned isDraft=false isPrerelease=true publishedAt 2026-09-24T04:14:36Z | Tony confirms it was intentional or returns it to draft; this lane made no change | TASK-062 to TASK-066 release gates; SIGNING.md:29 |
| Tony Walteur welcome recording | Tony | manifest status NOT_PROVIDED | Supply the reviewed recording with captions; the text fallback remains usable | onboarding tasks under MASTER section 34 |


## Lead correction (2026-09-24)
- Metis-Releases v1.9.6-unsigned was published by this Claude session on Tony's explicit owner decision
  (2026-09-23: "Public unsigned prerelease" + "release them with no signature for now"). Receipt:
  receipts/RELEASE-v1.9.6-unsigned.md (bytes verified pre-upload and by anonymous download-back).
  The conflict with docs/SIGNING.md:29 ("ad-hoc builds must never go to the public feed") is an owner-level
  exception, bounded: prerelease, not Latest, no latest*.yml, tag suffix -unsigned. Not a blocker.
