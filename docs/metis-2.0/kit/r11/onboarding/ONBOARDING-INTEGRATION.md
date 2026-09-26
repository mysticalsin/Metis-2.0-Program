# Métis onboarding · preserve the experience, improve the guidance

**Owner:** Tony Walteur  
**Amendment:** OBU-01 · source-informed correction to the prior r9 onboarding proposal  
**Delivery status:** specification, independent policy examples and synthetic interaction review; not application integration or release evidence.

## 1. The non-negotiable direction

The original Métis onboarding remains the host experience. Keep its identity, narrative, scene components, progress model, placement choice, real guarded demo, consent, settings persistence and completion route. Borrow interaction principles—clear permission explanations, practical exercises, state feedback, accessible controls—not another product's visual identity, names, presenters, private prompts or onboarding architecture.

This amendment replaces the r9 instruction to introduce an eight-stage generic agent wizard. It does not replace the rest of the existing plan. All original voice, context, named-agent, knowledge, provider, identity, cost, security, lightweight-installation and native release requirements continue. New helper rows or expandable panels must fit inside existing scenes, not create a new top-level onboarding manager.

The only named human in the user-facing onboarding, welcome narration, subtitles, descriptive transcript, lower third, sample meeting and accessibility labels is **Tony Walteur**. Métis is the product name. Ordinary role labels may remain when useful, but do not create fictional colleagues, testimonials or customer identities. This rule does not rename the real signed-in user or modify their actual meeting history. Their identity need not be displayed in the introductory sample. Technical evidence and legally required licenses remain outside the onboarding; do not erase or misattribute them.

## 2. The actual source has evolved—do not flatten it

The inspected desktop helper, `src/renderer/src/lib/onboarding-flow.ts`, fixes this sequence:

`hero → problem → reveal → appearance → setup → personalize → [license if enabled] → ready`

`sceneAfterReveal()` returns `appearance`; `sceneAfterAppearance()` returns `setup`; `sceneAfterSetup()` returns `personalize`; `sceneAfterPersonalize()` returns the existing optional license scene or Ready. The helper's completion rule requires Ready and consent; transcription readiness alone does not block finishing in the inspected implementation. Keep operational capture readiness separate from tour completion. Existing sign-in/organization policy still applies and must not be bypassed.

Older narrative documentation describes five acts and contains superseded claims about fully local processing and mandatory model downloads. Later source includes Appearance and Ready, a No Skip-tour rule, and different provider defaults. The native Swift `OnboardingModel` still has an older five-act form. These are **different source states**, not permission to choose whichever is easiest. Bind to the actual checkout and reconcile the native owner scope explicitly. Do not restore an old “everything stays on-device” claim when a cloud route is selected.

The actual `OnboardingExperience.tsx` implementation is referenced by tests but was not located as a FILE section in the uploaded export. That is an export gap, not proof the repository lacks it. The implementer must obtain that file before modifying the real composition. The amendment's HTML is only an isolated review of the intended additions, not a substitute for the component.

### Integration by existing scene

| Existing scene | Preserve | Integrate without replacing |
|---|---|---|
| Hero | Métis mark, “The wisdom before the moment”, current welcome shell and Begin control | Optional authentic Tony Walteur welcome in the same media slot; complete text-led fallback |
| Problem | Existing meeting story and its emotional pacing | User-controlled pacing/text alternative; reduced-motion equivalent; no other named humans |
| Reveal | Real Bar/Copilot/Answer/QuickActions components with the existing demo guard | Explain voice versus typing, visible versus full context and draft versus action using bounded synthetic examples |
| Appearance | “Where should Métis live?” in its existing position; actual Hidden/Island/Bar options | Keyboard-selectable placement previews, readable selected state, no premature layout persistence or geometry rewrite |
| Your setup | Existing permission/probe rows, status animation and actual state authority | Guided explanation, one requested permission at a time, return/recheck, failure repair and optional-capability deferral |
| Personalize | General/Sales/Recruiting, language, “Tell the room”, explicit consent | Accessible input/reading preferences and contextual approved agent recommendations without automatic execution |
| Optional license | Existing entitlement semantics and default | No new mandatory purchase or license step; no media/permission workaround |
| Ready | Existing landing and only allowed completion point | Truthful readiness summary and usable typed landing; video ending or an OS dialog cannot complete the tour |

## 3. Replace the media, not the narrative

The source currently imports a packaged non-Tony welcome video and poster through `onboarding-hero-video.ts`; it also retains a remote mirror string and has preload/play/packaged-path helpers. The new requirement explicitly supersedes that asset selection and continuous background-play assumption. It does not supersede opaque first paint, readable branding, the existing real demo or the rest of the scene flow.

Remove the old active video/poster imports, old default URL, remote mirror fallback, media preloads, cached default selection and packaging reachability. Search localized copy, preview metadata, low-resolution variants, fallback branches, browser/native wrappers, build resources and tests that pin the old file. Existing user history and unrelated media are not deletion targets. If an old packaged asset is needed solely for engineering history, retain its audit reference outside runtime resources; do not ship or preload it in customer onboarding.

The actual application must verify that the approved asset is readable under the real packaged media resolver. Preserve the required `app.asar` versus unpacked-resource behavior where applicable, but bind it to the new approved asset, never to the retired fallback. A development browser playback check is not proof that media decodes in the signed installer.

### Media lifecycle

`NOT_PROVIDED → DRAFT_RECEIVED → IN_REVIEW → APPROVED → AVAILABLE`

`REVOKED`, `MISSING` or `DECODE_FAILED` always return to a Métis-only text welcome. No old asset, host, actor, generated voice or missing-file download is substituted. The delivered manifest is `NOT_PROVIDED` with null media paths; no Tony recording has been fabricated.

A deployable record binds the presenter, exact video/poster/caption/transcript hashes, locale, duration, revision, reviewer identity/reference, content approval, rights approval and publisher integrity policy. An editable string saying “Tony Walteur” is not proof of who appears or speaks. Review the full actual recording, background audio, screen captures, notifications, captions and final poster. The pure policy example in this package checks metadata shape only and is not a signature verifier or human-identity classifier.

### Playback and pacing

Use an explicit **Watch Tony Walteur's welcome** action only when approved playable media exists. Do not display a broken or disabled Play button before filming. Until then, show the same introductory message as ordinary text inside the Métis hero. Begin remains visible and usable. After media is available, reading the text instead of watching is a media alternative, not a Skip-tour path.

Narration must not autoplay on startup, return from Settings or Replay. No endless talking-head loop. Pause narration and the onboarding music before microphone practice, permission handoff, scene exit, app lock, close or replay. Only one managed audio owner may remain. On return, retain the current scene and playback position where appropriate; do not resume audio unexpectedly. Motion preferences and user mute must apply before first paint, not after the first loud or animated frame.

A stalled/missing/unsupported video must have an immediate text route, not a spinner that blocks Begin. Media timecodes never grant permissions, create agents, advance security gates, or persist `onboardingDone`. The recording is a welcome, not the application's control plane.

## 4. Permission coaching belongs inside Your setup

The objective is an understandable conversation: **what this enables → what it can access → your choice → trusted OS handoff → actual recheck → clear next step**. Explain enough to decide before displaying the system prompt. Ask for one relevant capability at a time, not a wall of alerts. Expand details only on demand.

| Capability | Métis explanation | Control boundary |
|---|---|---|
| Microphone | Speak to Métis or use voice features; typing remains available | Request only deliberately through the existing native bridge. Input detection, OS grant, provider readiness and final transcript are different signals. |
| Screen context | Let Métis inspect the screen or window you deliberately share | User-selected scope, visible indicator and stop/revocation; no background whole-desktop monitoring |
| macOS Accessibility | Enable eligible app interactions you explicitly request | The user grants OS access. Runtime task approval remains separate; this does not authorize every future action. |
| Windows app interaction | Explain which native automation operations are available under current privileges | Do not display a fake macOS switch, disable UAC, auto-elevate or use UIAccess merely to get broad control. |
| Files | Attach or authorize the source needed by the task | Use selected files/folders and scoped handles; no full-disk access request just to personalize onboarding |
| Notifications | Receive optional quiet results | Separate consent; meeting/focus/privacy rules still suppress noisy or revealing surfaces |

Apple documents explicit user authorization for Accessibility in Privacy & Security. Windows UI Automation uses a different native model and has separate security restrictions. Use the existing platform adapter and version-appropriate system surfaces; do not guess unsupported deep links or automate Métis's own consent settings. See the primary references in `source/REFERENCES.md`.

### Row states must mean something

Use `checking`, `loading`, `action`, `waiting_for_return`, `denied`, `restricted`, `restart_required`, `granted_unverified`, `ready`, `deferred`, `revoked`, `unavailable`. Preserve actual existing enum/storage compatibility with a versioned mapper, not an uncontrolled rename. Continuous real work can show the existing reviewed orb; a timer alone cannot become success. Measured progress may be shown; unknown progress is not a fabricated percentage.

Opening Settings moves to `waiting_for_return`, not `ready`. Returning triggers a fresh native probe bound to the same application/build/principal/capability and request generation. Denied should explain how to change the choice or continue without the feature; restricted should point to the organization/admin without looping on a request the OS will not honor. Newly granted access may require an actual process-level recheck or restart according to the real adapter. Do not force a universal restart based only on old documentation or assume a grant implies a usable capture handle.

A “Not now” control defers one optional capability inside setup. It does not skip onboarding, grant that capability, or allow the dependent action. At Ready, show the actual available capabilities separately. Finishing consent cannot secretly arm continuous listening. For wake behavior, use the existing explicit opt-in and single audio owner.

Recheck after permission changes, lock/unlock, application identity/signature updates, native errors and relevant foreground return. Revoke pending context/input leases immediately; a queued or late provider result cannot use old authority. Repeated clicking must not open repeated permission windows or submit multiple requests. Bounded retry and a support explanation replace silent looping.

## 5. Accessibility of the onboarding itself

OS Accessibility permission and accessible interface design are separate concerns. The onboarding must be operable without granting OS control permission, without speaking, without watching a video and without decoding animation.

Use semantic headings, actual buttons, explicit input labels and meaningful state text. Every scene transition caused by the user's Next/Back moves focus to the new scene heading; passive probe updates do not steal focus. Returning from a system dialog restores the relevant row or initiating control. Use a polite live region for meaningful state changes; do not announce animation frames or microphone-level samples. Error guidance must identify the affected control and recovery path.

Keep Next/Continue/Begin/Get started visible without hover, offscreen scroll tricks or waiting for animation. Do not hijack Enter/Space while a user edits text, selects a menu or composes with an IME. Avoid keyboard traps. A detail disclosure or preview must be closeable with Escape and return focus appropriately without erasing unsaved choices.

Provide readable contrast, visible focus and non-color status indicators. Use at least 44-by-44 CSS-pixel interaction areas as this product's design target where applicable; validate layouts at 200% text and narrow widths without hiding controls or clipping labels. This target is a design requirement, not a claim that every such interface automatically meets an accessibility standard.

Honor reduced motion from the first frame. Offer user pause for decorative motion and paced demonstrations; remove parallax/flashes, auto-advance and motion-only explanations. The Métis KineticGrid remains a non-interactive background with `pointer-events: none`; it must not move the entire stage or obscure controls. Use the existing color tokens and typography rather than a new theme or sidebar.

The final recording needs accurate synchronized captions and a separate descriptive transcript matched to the **filmed** content. Describe essential visual information in the recording or provide a qualified described alternative; do not treat text captions as a replacement for visual description. Final text must be selectable and screen-reader readable, not burned into an image only. Until the recording exists, the filming script is explicitly a draft, not its transcript. The shipped text-led welcome independently conveys the essential information.

## 6. Keep the real Métis demonstration

The source's Reveal drives real Bar/Copilot/Answer/QuickActions components with synthetic meeting data and guards that block real saving/rating/network effects. Preserve those guards, lazy loading, original beat order, Next behavior and safe data source. Do not replace Reveal with another product video or this amendment's HTML.

Keep Tony Walteur as the only named human in all demonstration strings and speaker labels. Use neutral role labels only where the existing UI requires a second participant and no personal name is needed; never substitute a real contact. Demo phrases must not contain real customer information or imply an actual provider output. A cursor animation can point or simulate a control only within the bounded demo; it cannot issue arbitrary native input.

The addition should teach three precise ideas in the existing Reveal: typing is available; shared context has a visible scope; preparing a draft is not sending it. The real app's actions still require current policy/permissions and verified results. The welcome video does not become the only explanation.

## 7. Implementation sequence and scope

**OBU-01 Baseline and source binding:** inspect the current checkout and resolve any divergence from the supplied export. Read existing scene/media/permission/persistence tests. Recover the missing parent component. Confirm exact active media paths and localized copy. Keep all non-onboarding working behavior and reference licenses.

**OBU-02 Media retirement and Tony slot:** remove runtime selection/reachability of the retired media and install the null/approved-manifest contract in the existing component. Add failure fallback, user-controlled playback and complete teardown. Do not broaden general content-security policy to make a hosted video work.

**OBU-03 Setup coaching:** extend the existing setup rows and native bridge readback. Use generation-bound requests, just-in-time scope, denial/restricted/restart repair and independent readiness categories. No auto-elevation, TCC database editing, fake grant or new capture loop.

**OBU-04 Accessibility and copy:** integrate semantic/focus/input/motion behavior into the actual scenes, not an independent wizard. Review all supported languages, labels, captions, demo strings and associated poster metadata for the Tony-only named-person rule.

**OBU-05 Native and installed validation:** test actual source components, persisted/replayed flows, media decode on the final package and real OS permission interaction on both Windows and Mac. Preserve the original high-priority Next/Ready/dock regressions and all parent release gates.

These are sub-slices of existing TASK-005/008/019/027/028/029/030/033/055/056/057/060/062/063, not replacement root tasks. The native app's separate five-act form requires explicit parity decisions in its existing model and tests. Do not insert desktop-specific scenes into that model by assumption or create a second native coordinator.

## 8. Acceptance and remaining evidence

The change is accepted only when the original verified scene topology and completion rule still hold; every customer-facing onboarding media and named-human reference is approved for Tony Walteur; the old media cannot reappear through a fallback, preload, update or locale; and setup can be understood and completed through the legitimately available route without falsifying readiness.

Test missing, corrupt, unsupported and revoked recording; no captions; stale/incorrect transcript; cancelled media; replay and app close; reduced motion; voice-only versus typed input; denied/restricted/revoked permission; return from Settings; changed principal/build/generation; keyboard and screen-reader completion; mixed scaling/displays; 200% text; a truly unavailable backend; and the actual signed/native artifact. Missing real media must remain `NOT_PROVIDED`; no fake “video verified” evidence.

This package runs no app, native permission, provider, live account or signing tests. It supplies a tested synthetic reference, explicit source bindings and required product evidence. This amendment is consolidated into kit r10 and MASTER §34. It supersedes r9’s replacement-wizard topology, not Métis’s existing scenes. Consult the root verification/FINAL-AUDIT.md for this consolidation’s actual checks; the original amendment reports remain historical.
