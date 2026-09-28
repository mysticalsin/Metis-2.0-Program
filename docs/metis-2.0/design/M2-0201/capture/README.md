# M2-0201 renderer capture evidence

Source label: OBSERVED from files in this worktree on 2026-09-28.

- OBSERVED: The dev-only renderer entry is `src/renderer/m2-design.html`.
- OBSERVED: The React prototype component is `src/renderer/src/components/M2DesignPrototypes.tsx`.
- OBSERVED: The prototype styling is `src/renderer/src/components/M2DesignPrototypes.css`.
- OBSERVED: The committed PNG artifacts carry ticket, variant, renderer source and renderer source hash metadata; source: `capture/provenance.json`.
- OBSERVED: The CI capture harness is `scripts/evidence/capture-m2-design.mjs`; source: `scripts/evidence/capture-m2-design.mjs:1-103`.
- LEAD_ACTION: Run `M2_DESIGN_URL=<ci-served src/renderer/m2-design.html URL> node scripts/evidence/capture-m2-design.mjs` in CI, then commit the updated PNG artifacts and `capture/provenance.json`.
- LEAD_ACTION: An independent Opus validator session must review the manifest, state lists, renderer source and captured artifacts, then append ACCEPTED or REVISE to `VALIDATION.md`.

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
