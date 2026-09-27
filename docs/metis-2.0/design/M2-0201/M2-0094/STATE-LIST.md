# M2-0094 prototype: unified task card with receipt-driven progress

Source label: DERIVED from `docs/metis-2.0/ledger/tickets/M2-0094.md:1-42`.

Kit sections satisfied: CXSTEP-08, CXCAP-24, MB-10, MB-13, MB-19, MB-22, EXP-04.

Keyboard path: Tab enters task card; Enter expands details; Space toggles pause/resume when focus is on the task action; Escape returns to quiet compact mode.

| State | Surface | Required elements | Must not show |
|---|---|---|---|
| Queued | Compact card | Receipt id, source command, pending step list | Model prose as status |
| Running | Card with progress | Receipt-backed step progress, elapsed time | Fake percent without receipts |
| Partial | Expanded card | Completed and blocked steps separated | Restart on status question |
| Undoable complete | Card footer | Result receipt, undo action, evidence link | Auto-dismiss before review |
| Quiet call mode | Compact card | Low-contrast progress and typed reply default | TTS or intrusive animation |
| Reduced motion | Any | Static step changes and polite status text | Animated progress sweep |

Screenshot matrix: `screenshots/prototype-matrix.svg`.

