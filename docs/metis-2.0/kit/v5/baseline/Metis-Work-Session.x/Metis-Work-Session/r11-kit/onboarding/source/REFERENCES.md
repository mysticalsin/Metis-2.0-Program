# Technical references · not onboarding content

## Supplied Métis source export

`mysticalsin-asktoto-mantu-8a5edab282632443.txt` is an uploaded partial repository export. Its filename suffix is not treated as a verified commit. The code/configuration and existing chronology must be reconciled with the actual checkout before implementation.

- `docs/ONBOARDING-EXPERIENCE.md`: older five-act narrative followed by a later Appearance/Ready update; some provider/model prose is superseded.
- `docs/design/ONBOARDING-FLOW.md`: retains original visual/No-Skip controls, Appearance immediately after Reveal and the actual desktop route.
- `src/renderer/src/lib/onboarding-flow.ts`: current exported route and Ready/consent completion helper; ASR readiness is informational for tour completion in that source.
- `src/renderer/src/lib/onboarding-hero-video.ts`: packaged old clip and poster, remote mirror, preload and asar-unpacked resolver; update media reachability rather than overwrite the narrative.
- `src/renderer/src/components/OnboardingDemoScene.tsx`: real product components with guarded synthetic data, not a prerecorded demo replacement.
- `src/renderer/src/lib/onboarding-demo.ts`: source-owned demonstration content; sanitize named-human examples without changing actual user data.
- `native-app/MetisKit/Sources/MetisKit/Onboarding.swift`: separate older native five-act model and injected permissions; does not establish current desktop sequence.
- `src/renderer/src/components/OnboardingExperience.tsx`: referenced but its FILE section was not found in this export; obtain from the actual checkout before patching.

## Primary platform and media references

Reviewed for this amendment. These are technical design inputs, not claims of completed native tests or accessibility certification.

Apple: Accessibility permission is an explicit user decision in Privacy & Security. Use a trusted platform request/settings path and readback; the application does not approve itself.
https://support.apple.com/en-ph/guide/mac-help/mh43185/mac

Microsoft: UI Automation provides structured access to supported UI elements. Do not map it to a fake macOS grant.
https://learn.microsoft.com/en-us/windows/win32/winauto/ui-automation-specification

Microsoft: UIAccess is restricted to appropriate assistive-technology scenarios; do not enable it simply to get broad control or appear above other applications.
https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-securityoverview

W3C WAI: plan accessibility with the media, including meaningful audio/visual alternatives and a usable player. Requirements depend on the kind of media and information it conveys.
https://www.w3.org/WAI/media/av/planning/

W3C WAI: captions convey important speech and non-speech audio in synchronization with the final recording.
https://www.w3.org/WAI/media/av/captions/

W3C WAI: descriptive transcripts convey important auditory and visual information as text; a preliminary script is not automatically the transcript of a final edited recording.
https://www.w3.org/WAI/media/av/transcripts/

W3C WAI: convey essential visual information through spoken description or an appropriate described alternative, rather than captions alone.
https://www.w3.org/WAI/media/av/description/
