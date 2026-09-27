# M2-0201 renderer capture evidence

Source label: OBSERVED from files in this worktree on 2026-09-27.

- OBSERVED: The dev-only renderer entry is `src/renderer/m2-design.html`.
- OBSERVED: The React prototype component is `src/renderer/src/components/M2DesignPrototypes.tsx`.
- OBSERVED: The prototype styling is `src/renderer/src/components/M2DesignPrototypes.css`.
- BLOCKED_EXTERNAL: Electron screenshot capture was not executed in this session because D-28 forbids running repository scripts or the app on the owner's Mac. Exact read-only unblock step: in CI, open `src/renderer/m2-design.html` with the Electron/Vite renderer, capture each `[data-ticket] [data-variant]` node, and write PNG files to each ticket's `screenshots/` directory.
- BLOCKED_EXTERNAL: Independent Opus validator acceptance was not produced by this Codex authoring session. Exact read-only unblock step: an Opus validator session other than the author reviews `manifest.json`, every `STATE-LIST.md`, the renderer source files above, and the captured PNG/recording evidence, then appends its ACCEPTED/REVISE entry to `VALIDATION.md`.

## Intended CI capture map

| Ticket | Node selector | Target files |
|---|---|---|
| M2-0093 | `[data-ticket="M2-0093"] [data-variant]` | `M2-0093/screenshots/*.png` |
| M2-0094 | `[data-ticket="M2-0094"] [data-variant]` | `M2-0094/screenshots/*.png` |
| M2-0100 | `[data-ticket="M2-0100"] [data-variant]` | `M2-0100/screenshots/*.png` |
| M2-0114 | `[data-ticket="M2-0114"] [data-variant]` | `M2-0114/screenshots/*.png` |
| M2-0117 | `[data-ticket="M2-0117"] [data-variant]` | `M2-0117/screenshots/*.png` |
| M2-0130 | `[data-ticket="M2-0130"] [data-variant]` | `M2-0130/screenshots/*.png` |
| M2-0137 | `[data-ticket="M2-0137"] [data-variant]` | `M2-0137/screenshots/*.png` |
| M2-0158 | `[data-ticket="M2-0158"] [data-variant]` | `M2-0158/screenshots/*.png` |
| M2-0160 | `[data-ticket="M2-0160"] [data-variant]` | `M2-0160/screenshots/*.png` |
