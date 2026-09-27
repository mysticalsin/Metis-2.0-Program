# M2-0093 prototype: ARMED orb, expanded pill, caption, beam and voice glow

Source label: DERIVED from `docs/metis-2.0/ledger/tickets/M2-0093.md:1-45` and `docs/metis-2.0/kit/r11/visual/VISUAL-CONTRACT.md:3-12`.

Kit sections satisfied: TASK-030, M2-UX-01, EXP-10, SRC-14.

Keyboard path: Tab to orb button; Enter or Space opens typing only; Escape collapses expanded pill; Arrow keys remain app/window controls, not wake controls.

| State | Surface | Required elements | Must not show |
|---|---|---|---|
| ARMED | Resting orb | One solving orb, transparent host, 72 px target | Pill, caption, beam, badge, mic level |
| Typing | Expanded pill | Orb inside pill, text field, caption above | Microphone activation |
| Trusted wake | Expanded pill | Live caption, beam border, sanitized voice glow | Raw mic hook or demo pipeline |
| Approval | Expanded pill | Exact requested action, approve/cancel | Prose-only completion |
| Reduced motion | Both | Static orb pose, no shimmer; level shown as stepped opacity | Continuous animation |

Screenshot matrix: `screenshots/prototype-matrix.svg`.

