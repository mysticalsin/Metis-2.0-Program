# M2-0201 validation record

## Current author review

- OBSERVED: All nine prototype folders exist under `docs/metis-2.0/design/M2-0201/`.
- OBSERVED: Each folder contains `STATE-LIST.md` and five PNG variants under `screenshots/`.
- OBSERVED: The dev-only renderer prototype source exists at `src/renderer/m2-design.html`, `src/renderer/src/m2-design-entry.tsx`, `src/renderer/src/components/M2DesignPrototypes.tsx`, and `src/renderer/src/components/M2DesignPrototypes.css`.
- OBSERVED: The evidence checker exists at `scripts/evidence/check.mjs`.
- OBSERVED: `capture/provenance.json` records every committed PNG artifact and the renderer source hashes used to produce it.
- DERIVED: The package satisfies the design artifact shape of `docs/metis-2.0/ledger/tickets/M2-0201.md:35` because each prototype has a state list, variants for light/dark, 1x/2x and reduced motion, a keyboard path, kit sections and labeled PNG artifacts.
- LEAD_ACTION: Run the CI/Electron capture harness from `scripts/evidence/capture-m2-design.mjs`, then commit the updated renderer-captured PNG artifacts and provenance.
- LEAD_ACTION: An Opus validator session other than this author must review `manifest.json`, every `STATE-LIST.md`, the dev-only renderer source, and captured screenshot or recording evidence, then append an ACCEPTED or REVISE entry below.

## Independent Opus validator acceptance

Validator must append one entry with:

- session model and date;
- files reviewed;
- pass/fail verdict for each prototype;
- any required design changes;
- final verdict: ACCEPTED or REVISE.
