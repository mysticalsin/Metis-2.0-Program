# M2-0117 prototype: four-destination Settings UI

Source label: OBSERVED from existing Settings 2.0 design `docs/metis-2.0/design/settings/SETTINGS-2.0.md:1-40`; DERIVED for M2-0117 from `docs/metis-2.0/ledger/tickets/M2-0117.md:1-47`.

Kit sections satisfied: TASK-022, M2-LOCAL-01, UC-097, UC-098, UC-099, M2-SET-01, M2-SET-02.

Keyboard path: Cmd/Ctrl+F focuses search; Tab reaches destination nav, readiness card and controls; Enter opens disclosure; Escape closes drawer or clears search.

| State | Surface | Required elements | Must not show |
|---|---|---|---|
| General | Settings | Four destinations, readiness summary | Nine legacy tabs |
| Voice local packs | Settings | Not installed, downloading, verified, installed, selected, loaded, unsupported | Install selecting silently |
| Search result | Settings | Control-level result and synonym match | Tab-only search |
| Save failed | Inline control | Confirmed value retained, retry action | Unhandled promise failure |
| Policy changed | Banner | Current session unaffected, next-session policy | Silent privacy change |
| Reduced motion | Settings | No animated disclosure flourish | Motion-only feedback |

Screenshot matrix: `screenshots/prototype-matrix.svg`.

