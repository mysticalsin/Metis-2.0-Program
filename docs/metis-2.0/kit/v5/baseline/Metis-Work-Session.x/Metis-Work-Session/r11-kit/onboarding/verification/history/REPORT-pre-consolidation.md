# Verification report · Tony Walteur onboarding amendment

Executed 2026-09-23T00:29:37.877245+00:00.

**Scope:** independent pure policy rules, static package integrity and a synthetic browser interaction review. Not an actual Métis integration, native permission test, media playback test, account test or release.

| Check | Result | Meaning |
|---|---:|---|
| Pure policy checks | 35/35 | Desktop scene order, Ready/consent, permission-readback identity/freshness, empty media fallback, presenter/review/hash requirements |
| Browser checks | 30/30 | Existing route, focus, only-Tony welcome copy, no media/capture, denied/restricted/revoked examples, Windows distinction, typed input, reduced motion, 390px layout and scaled text |
| Damaged-copy probes | 4/4 | Wrong presenter, false media availability, removed Appearance and injected network call are rejected |
| PDF layout | 7-page integration + 3-page filming guide | No detected out-of-page text blocks; selected rendered pages visually inspected |
| New stills | 3 | Current exact synthetic HTML, not a native product screenshot |

Browser engine: 144.0.7559.96, Chromium on Linux. Exact HTML loaded through `page.set_content`. Observed external requests: 0; JavaScript exceptions: 0. No source video was opened or decoded because the authentic recording is absent. No Play or media request is fabricated. The initial development runs caught a quote typo, a noninteractive toast intercepting clicks, and an assertion affected by visual uppercase text. They were corrected before the final run. The large-text check doubles computed text sizes on the setup review; it is not a full browser/platform accessibility certification. Screen-reader/VoiceOver/Narrator and native OS permission behavior remain product tests.

The preview deliberately includes reviewer-only controls to select synthetic readback states. Those controls are not production permissions or consent, and must not be copied into the real onboarding. Real code must reuse the existing scene components, gate helpers, guarded demo and native adapters.

The supplied source export identifies the current desktop route and an older native five-act model. The full parent component was not present as a FILE section in the export. It must be acquired from the actual checkout. The previous r9 archive was not found in the active runtime or exact retrieval; this is an amendment to the described handoff, not a reconstructed full kit. Unrelated prior requirements were not re-verified or repackaged.

The final recording remains NOT_PROVIDED. Human review of Tony Walteur's real recording, approved captions/transcript/poster, actual file hashes and packaged playback are still required. Metadata-only tests do not establish who appears in a video. No private credentials or fonts are bundled; required orb attribution stays in technical license files, outside the visible onboarding.

Before release, test real source integration; retired-media absence in the shipped installer and fallback paths; actual grant/deny/recheck/restart/revoke behavior; all selected locales; keyboard and assistive technology; app close/lock/replay/media cleanup; and exact native/signed artifact behavior under the parent's existing gates.
