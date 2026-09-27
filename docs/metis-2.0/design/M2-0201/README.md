# M2-0201 DESIGNED prototype package

Evidence level: DESIGNED.
Authoring session: Codex, 2026-09-27.

## Source claims

- OBSERVED: M2-0201 scope is `docs/metis-2.0/design/`; source `docs/metis-2.0/ledger/tickets/M2-0201.md:25-27`.
- OBSERVED: M2-0201 requires every prototype to include a state list, light/dark, 1x/2x, reduced motion, keyboard path, kit section, and screenshots or recordings; source `docs/metis-2.0/ledger/tickets/M2-0201.md:33-36`.
- OBSERVED: M2-0201 slices require prototypes for M2-0093, M2-0094, M2-0100, M2-0114, M2-0117, M2-0130, M2-0137, M2-0158 and M2-0160; source `docs/metis-2.0/ledger/tickets/M2-0201.md:50-60`.
- OBSERVED: M2-0093 already cites the M2-0201 prototype in its design-evidence acceptance; source `docs/metis-2.0/ledger/tickets/M2-0093.md:36-40`.
- OBSERVED: The visual contract requires ARMED to be one animated solving orb only and requires reduced-motion, input, capture and approval protections; source `docs/metis-2.0/kit/r11/visual/VISUAL-CONTRACT.md:3-10`.
- OBSERVED: Settings 2.0 uses DESIGNED evidence, evidence labels and state captures in light/dark, 1x/2x and reduced motion; source `docs/metis-2.0/design/settings/SETTINGS-2.0.md:1-10` and `docs/metis-2.0/design/settings/SETTINGS-2.0.md:23-30`.
- OBSERVED: TASK-030, TASK-040 and TASK-045 are the kit tasks for orb, Intelligence and portal work; source `docs/metis-2.0/kit/r11/plan/TASK-INDEX.md:36-51`.
- OBSERVED: A dev-only renderer prototype surface now exists at `src/renderer/m2-design.html`, backed by `src/renderer/src/components/M2DesignPrototypes.tsx` and `src/renderer/src/components/M2DesignPrototypes.css`; source: worktree files added on 2026-09-27.
- OBSERVED: The requested evidence checker path now exists at `scripts/evidence/check.mjs`; source: worktree file added on 2026-09-27.
- BLOCKED_EXTERNAL: Independent Opus validator acceptance is required by `docs/metis-2.0/ledger/tickets/M2-0201.md:35-36`, but this Codex session cannot truthfully create an Opus validator session. Exact read-only unblock step: an Opus session other than this author must review `manifest.json`, each `STATE-LIST.md`, the dev-only renderer source, and captured screenshots or recordings, then append its verdict to `VALIDATION.md`.
- BLOCKED_EXTERNAL: Electron screenshot capture was not executed under the owner D-28 constraint forbidding repository scripts and app runs on the owner's Mac. Exact read-only unblock step: CI must open `src/renderer/m2-design.html` with the Electron/Vite renderer and write `light-1x`, `dark-1x`, `light-2x`, `dark-2x`, and `reduced-motion` PNG or WEBM artifacts under each prototype folder.

## Prototype index

| Implementing ticket | Prototype folder | State list | Current artifact | Kit sections satisfied |
|---|---|---|---|---|
| M2-0093 | `M2-0093/` | `M2-0093/STATE-LIST.md` | `M2-0093/screenshots/prototype-matrix.svg` | TASK-030, M2-UX-01, EXP-10, SRC-14 |
| M2-0094 | `M2-0094/` | `M2-0094/STATE-LIST.md` | `M2-0094/screenshots/prototype-matrix.svg` | CXSTEP-08, CXCAP-24, MB-10, MB-13, MB-19, MB-22, EXP-04 |
| M2-0100 | `M2-0100/` | `M2-0100/STATE-LIST.md` | `M2-0100/screenshots/prototype-matrix.svg` | AGSTEP-07, AGX-15, AGUC-029, AGUC-030 |
| M2-0114 | `M2-0114/` | `M2-0114/STATE-LIST.md` | `M2-0114/screenshots/prototype-matrix.svg` | EXP-01, EXP-03, EXP-07, CXSTEP-17, FLOW-04 |
| M2-0117 | `M2-0117/` | `M2-0117/STATE-LIST.md` | `M2-0117/screenshots/prototype-matrix.svg` | TASK-022, M2-LOCAL-01, UC-097, UC-098, UC-099, M2-SET-01, M2-SET-02 |
| M2-0130 | `M2-0130/` | `M2-0130/STATE-LIST.md` | `M2-0130/screenshots/prototype-matrix.svg` | TASK-040, UC-041 through UC-048, M2-KNOW-01 |
| M2-0137 | `M2-0137/` | `M2-0137/STATE-LIST.md` | `M2-0137/screenshots/prototype-matrix.svg` | HMSTEP-08, HMSTEP-11, HSAC-01, HSAC-03, HSAC-15, HSAC-16 |
| M2-0158 | `M2-0158/` | `M2-0158/STATE-LIST.md` | `M2-0158/screenshots/prototype-matrix.svg` | TASK-045, TASK-045.CORE, UC-052, UC-054, UC-055, M2-OPS-01, M2-OPS-02 |
| M2-0160 | `M2-0160/` | `M2-0160/STATE-LIST.md` | `M2-0160/screenshots/prototype-matrix.svg` | TASK-027.B, OBU-01, OBU-02, OBU-03, OBU-04, OBU-05 |

## Capture convention

The dev-only renderer source defines five capture variants for each prototype:

1. Light 1x.
2. Dark 1x.
3. Light 2x.
4. Dark 2x.
5. Reduced motion.

The per-ticket state list names the states represented by the renderer panels and the keyboard path that implementation must preserve. The reduced-motion panel specifies the intended still or simplified state. Current SVG matrices are hand-authored legacy artifacts and are not sufficient for final acceptance until replaced by CI-captured renderer PNG or WEBM files.
