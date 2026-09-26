# Integrated into Métis 2.0 r10

Start at `../START-HERE.md`. This directory is included in the full kit; no separate amendment upload is needed. The complete binding text is in `../spec/MASTER.md` section 34.

# Métis onboarding · Tony Walteur integration update

**Owner decision:** Métis is the product. Keep its existing onboarding and integrate better accessibility/permission guidance into it. The only named human in the welcome, video, captions, transcript, sample meeting and other user-facing onboarding copy is **Tony Walteur**.

This onboarding module is now fully included in the r10 kit and canonical MASTER section 34. Its policy and browser examples are isolated references, not a repository patch or installed application. The previous amendment-only availability limitation is resolved by this consolidation. The supplied source export remains the historical source basis; real current integration needs the actual checkout.

## What to use

Open `preview/index.html` for the source-aligned interaction review. It contains only synthetic states and no camera, microphone, network, persistence, provider or operating-system calls. Its navigation mirrors the inspected desktop flow; it does not prove the actual application is integrated. The placeholder is intentionally video-free.

Give the implementation agent `CODEX-INTEGRATION-UPDATE.md` and the real checkout. `ONBOARDING-INTEGRATION.md` is the normative change contract. It supersedes the r9 eight-step onboarding proposal only. Keep all other meeting, agent, context, provider, security and release work intact.

Record the welcome using `media/TONY-WALTEUR-FILMING-GUIDE.md`. No recording is supplied here. `media/tony-walteur.manifest.json` remains `NOT_PROVIDED`: no old video, external presenter or remote mirror is used as a fallback. Continue works through the text-led Métis welcome until a real recording is approved.

`integration/onboarding-policy.cjs` is an independently authored, pure reference for media/permission/readiness rules. It is not an OS permission broker or new production state machine. Bind the rules to the existing Métis components and handlers.

## Preserve the actual flow

The inspected desktop source says:

`hero → problem → reveal → appearance → setup → personalize → [license only if enabled] → ready`

Appearance is **Where should Métis live?** after the real product demo. **Ready** remains the only completion point. There is no new Skip-tour or provider-setup detour. A text alternative to the optional welcome video is not a skipped tour.

The inspected native Swift model has an older five-act sequence. Treat that as a separately owned implementation: enrich its current setup/consent surfaces and reconcile intended parity in the real checkout. Do not silently delete desktop stages, add a parallel Swift wizard, or assume both existing implementations are identical.

## Validate the amendment

Run `node verification/policy.test.cjs` and `python3 verification/validate_package.py`. Browser checks need an already approved Playwright/Chromium environment; they install nothing. Read `verification/REPORT.md` for executed checks and native/media gates that remain unverified.

Third-party source/license attribution remains in technical material where legally required. It is not displayed in the onboarding and must not be falsely removed from historical evidence.
