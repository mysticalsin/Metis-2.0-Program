# M2-0201 validation record

## Current author review

- OBSERVED: All nine prototype folders exist under `docs/metis-2.0/design/M2-0201/`.
- OBSERVED: Each folder contains `STATE-LIST.md` and five PNG variants under `screenshots/`.
- OBSERVED: The dev-only renderer prototype source exists at `src/renderer/m2-design.html`, `src/renderer/src/m2-design-entry.tsx`, `src/renderer/src/components/M2DesignPrototypes.tsx`, and `src/renderer/src/components/M2DesignPrototypes.css`.
- OBSERVED: The evidence checker exists at `scripts/evidence/check.mjs`.
- OBSERVED: `capture/provenance.json` records every committed PNG artifact and the renderer source hashes used to produce it.
- DERIVED: The package satisfies the design artifact shape of `docs/metis-2.0/ledger/tickets/M2-0201.md:35` because each prototype has a state list, variants for light/dark, 1x/2x and reduced motion, a keyboard path, kit sections and labeled PNG artifacts.
- BLOCKED_EXTERNAL: Electron capture replacement is lead/CI-only in this run because D-28 forbids running repository scripts or the app on the owner's Mac. Exact read-only unblock step: in CI, serve `src/renderer/m2-design.html`, run `M2_DESIGN_URL=<ci-served renderer URL> node scripts/evidence/capture-m2-design.mjs`, then review the updated renderer-captured PNG artifacts and provenance.
- BLOCKED_EXTERNAL: Independent Opus validation is outside this author session. Exact read-only unblock step: an Opus validator session other than this author must review `manifest.json`, every `STATE-LIST.md`, the dev-only renderer source, and Electron-captured screenshot or recording evidence, then append a dated verdict entry below.

## Independent Opus validator acceptance

Validator must append one dated entry with:

- session model and date;
- files reviewed;
- pass/fail verdict for each prototype;
- any required design changes;
- final verdict line containing the validator's single outcome.
