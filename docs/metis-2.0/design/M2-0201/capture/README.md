# M2-0201 renderer capture evidence

Source label: OBSERVED from files in this worktree on 2026-09-28.

- OBSERVED: The dev-only renderer entry is `src/renderer/m2-design.html`; source: `src/renderer/m2-design.html:1-15`.
- OBSERVED: The React prototype component is `src/renderer/src/components/M2DesignPrototypes.tsx`; source: `src/renderer/src/components/M2DesignPrototypes.tsx:1-163`.
- OBSERVED: The prototype styling is `src/renderer/src/components/M2DesignPrototypes.css`; source: `src/renderer/src/components/M2DesignPrototypes.css:1-169`.
- OBSERVED: The committed PNG artifacts carry ticket, variant, renderer source and renderer source hash metadata; source: `capture/provenance.json:25-50`.
- OBSERVED: The committed PNG artifacts are renderer-spec rasterization placeholders, not Electron renderer capture evidence; source: `capture/provenance.json:1-24`.
- OBSERVED: The CI capture harness is `scripts/evidence/capture-m2-design.mjs`; source: `scripts/evidence/capture-m2-design.mjs:1-151`.
- OBSERVED: The CI capture harness launches through Playwright Electron and records `capture_tool`, `runtime`, `electron_version` and an Electron user agent into capture provenance; source: `scripts/evidence/capture-m2-design.mjs:5-151`.
- OBSERVED: The evidence checker rejects non-placeholder completion evidence unless the capture provenance identifies Playwright Electron, Electron runtime, Electron version and an Electron user agent; source: `scripts/evidence/check.mjs:9-97` and `scripts/evidence/check.mjs:149-158`.
- BLOCKED_EXTERNAL: Electron capture replacement is lead/CI-only in this run because D-28 forbids running repository scripts or the app on the owner's Mac. Exact read-only unblock step: in CI, serve `src/renderer/m2-design.html`, run `M2_DESIGN_URL=<ci-served renderer URL> node scripts/evidence/capture-m2-design.mjs`, then review the updated PNG artifacts and `capture/provenance.json`.
- BLOCKED_EXTERNAL: Independent Opus validation is outside this author session. Exact read-only unblock step: an Opus validator session other than this author reviews the manifest, state lists, renderer source and Electron-captured artifacts, then appends a verdict entry to `VALIDATION.md`.

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
