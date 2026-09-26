# Interaction capability matrix

Status: proposed Métis acceptance, not current implementation.

| ID | Capability | Evidence boundary | Métis decision | Children |
|---|---|---|---|---|
| CXCAP-01 | Button/shortcut invocation | User-observed; packaged hotkey and session components | Required first loop | CXSTEP-02, CXSTEP-03, CXSTEP-08 |
| CXCAP-02 | Spoken conversation with captions | Packaged realtime audio/voice symbols and endpoint strings | Required first loop | CXSTEP-03, CXSTEP-08 |
| CXCAP-03 | Interruptible spoken responses | Packaged duplex audio components; realtime provider supports interruption | Required first loop | CXSTEP-03, CXSTEP-07 |
| CXCAP-04 | Contextual answer about the selected app | Packaged screen and element-location components | Required first loop | CXSTEP-04, CXSTEP-08 |
| CXCAP-05 | Visible arrows and screen guidance | Packaged screen annotation components | Required first loop | CXSTEP-04, CXSTEP-05 |
| CXCAP-06 | Agent ghost pointer | Packaged cursor controls; newer vendor release removes floating cursor | Requested opt-in feature, not execution proof | CXSTEP-05, CXSTEP-07 |
| CXCAP-07 | Actual foreground pointer actions | Documented driver input mechanisms, platform-dependent | Required qualified native route | CXSTEP-06, CXSTEP-07 |
| CXCAP-08 | Background app actions without focus theft | Bundled driver guidance and latest vendor changelog | Prefer when actually supported | CXSTEP-06, CXSTEP-07 |
| CXCAP-09 | Multi-step computer task execution | Packaged Codex runtime and computer-use bridge | Required full interaction | CXSTEP-09, CXSTEP-12 |
| CXCAP-10 | Fresh screenshot/element grounding | Bundled driver snapshot/token protocol | Required full interaction | CXSTEP-04, CXSTEP-06, CXSTEP-07 |
| CXCAP-11 | Independent result verification | Bundled driver verification/effect guidance | Required full interaction | CXSTEP-06, CXSTEP-09, CXSTEP-19 |
| CXCAP-12 | Browser work with explicit account/tab scope | Bundled driver and connector guidance | Required qualified app route | CXSTEP-04, CXSTEP-06, CXSTEP-12 |
| CXCAP-13 | Verbatim dictation to another app | Packaged dictation/focus/insertion components | Required full interaction | CXSTEP-10 |
| CXCAP-14 | Optional rewrite distinct from transcription | Packaged cleanup and correction components | Required with explicit mode | CXSTEP-10 |
| CXCAP-15 | Reusable named agents and distinct orbs | Packaged agent session, workspace and UI components | Existing r11 expansion | CXSTEP-11 |
| CXCAP-16 | Voice follow-up to the selected task | Packaged voice/agent integration components | Required full interaction | CXSTEP-08, CXSTEP-09, CXSTEP-11 |
| CXCAP-17 | Attach sources and preview outputs | Packaged artifact/document/workspace support | Existing r11 expansion | CXSTEP-11, CXSTEP-12 |
| CXCAP-18 | Create documents, spreadsheets, PDFs and code artifacts | Fifteen internal SKILL manifests include relevant categories | Qualify each supported output; not a universal generation claim | CXSTEP-12 |
| CXCAP-19 | Authenticated integrations and MCP | Packaged integration/Composio session endpoints | Existing r11 expansion | CXSTEP-12, CXSTEP-16 |
| CXCAP-20 | Per-agent memory and continuing threads | Packaged agent workspace/memory structure | Use governed Hindsight, not copied storage design | CXSTEP-11, CXSTEP-13 |
| CXCAP-21 | Read-only suggestions, accept/adjust workflow | Packaged suggestion types; vendor policy describes background reads | Opt-in bounded full-plan lane | CXSTEP-14 |
| CXCAP-22 | Routines with sleep/offline recovery | Packaged cron and scheduling types | Opt-in bounded full-plan lane | CXSTEP-14, CXSTEP-16 |
| CXCAP-23 | Concurrent independent agent tasks | Packaged named task architecture | Allow non-input concurrency; one native input lease | CXSTEP-07, CXSTEP-11 |
| CXCAP-24 | Usage, approval and completion status | Packaged metering/permissions/session components | Required full-plan lane | CXSTEP-08, CXSTEP-16 |
| CXCAP-25 | Quiet mode during calls/screen sharing | Packaged audio/capture context; vendor documentation | Required privacy and usability gate | CXSTEP-05, CXSTEP-17 |
| CXCAP-26 | Resumable onboarding and permissions | Packaged permission coordinator and onboarding assets | Adapt current Métis narrative; no copied media | CXSTEP-15 |
| CXCAP-27 | Updates and recovery | Packaged Sparkle framework and update feed | Use existing per-platform signed updater | CXSTEP-18, CXSTEP-20 |
| CXCAP-28 | Public skill-authoring screen | Vendor changelog says Skills UI was paused; manifests remain in binary | Not proven live; Métis central skills remain required | CXSTEP-12 |
| CXCAP-29 | Driver recording/replay automation | Bundled reference docs explicitly do not expose recording tools in this runtime | Do not claim shipped parity; reviewed skill teaching is separate future/owner scope | CXSTEP-12 |
| CXCAP-30 | Universal support for every application | Not established by static inspection or marketing | Publish a qualified per-app action matrix instead | CXSTEP-06, CXSTEP-12, CXSTEP-19 |
