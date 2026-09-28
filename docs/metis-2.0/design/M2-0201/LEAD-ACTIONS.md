# M2-0201 lead actions

Source label: OBSERVED from this worktree on 2026-09-28.

- OBSERVED: M2-0201 acceptance requires every prototype to have a state list, light/dark, 1x/2x, reduced motion, keyboard path, kit section and screenshots or recordings; source: `docs/metis-2.0/ledger/tickets/M2-0201.md:33-36`.
- OBSERVED: The current capture provenance marks committed PNGs as renderer-spec rasterization placeholders and not Electron renderer completion evidence; source: `docs/metis-2.0/design/M2-0201/capture/provenance.json:1-19`.
- OBSERVED: The updated capture harness launches through Playwright Electron rather than Playwright Chromium; source: `scripts/evidence/capture-m2-design.mjs:5` and `scripts/evidence/capture-m2-design.mjs:78-86`.
- OBSERVED: The updated checker requires Playwright Electron, Electron runtime, Electron version and an Electron user agent for non-placeholder completion evidence; source: `scripts/evidence/check.mjs:9-97` and `scripts/evidence/check.mjs:149-158`.

LEAD_ACTION: In CI, serve `src/renderer/m2-design.html`, run `M2_DESIGN_URL=<ci-served renderer URL> node scripts/evidence/capture-m2-design.mjs`, and archive the updated `docs/metis-2.0/design/M2-0201/*/screenshots/*.png` plus `docs/metis-2.0/design/M2-0201/capture/provenance.json`.

LEAD_ACTION: Have an Opus validator session other than the author review `docs/metis-2.0/design/M2-0201/manifest.json`, every `docs/metis-2.0/design/M2-0201/*/STATE-LIST.md`, the renderer source files, and the Electron-captured artifacts, then append the dated verdict to `docs/metis-2.0/design/M2-0201/VALIDATION.md`.

LEAD_ACTION: File the DESIGNED evidence record from the CI artifacts after Electron capture and independent Opus acceptance are present.

LEAD_ACTION: Update the implementing ticket citations in lead-owned ledger outputs for M2-0093, M2-0094, M2-0100, M2-0114, M2-0117, M2-0130, M2-0137, M2-0158 and M2-0160 to point at `docs/metis-2.0/design/M2-0201/`.
