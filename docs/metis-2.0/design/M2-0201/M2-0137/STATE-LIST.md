# M2-0137 prototype: memory UX, isolation and outage states

Source label: DERIVED from `docs/metis-2.0/ledger/tickets/M2-0137.md:1-45`.

Kit sections satisfied: HMSTEP-08, HMSTEP-11, HM-01, HM-09, HM-13, HSAC-01, HSAC-03, HSAC-15, HSAC-16.

Keyboard path: Cmd/Ctrl+M opens memory review; Tab reaches approve/forget; Enter confirms focused action; Shift+Tab returns to agent isolation selector; Escape exits without write.

| State | Surface | Required elements | Must not show |
|---|---|---|---|
| Review | Memory panel | Pending memory, source, approve/forget | Hidden persistent write |
| Forget | Confirmation | Scope, downstream effect, cancel | One-click destructive action |
| Agent isolation | Selector | Agent boundary and shared/not shared label | Cross-agent leak |
| Outage | Banner | Capture and notes still available; historical memory unavailable | Blocked Stop or capture |
| Local-only | Session chip | No persistent memory write | Sync queue |
| Reduced motion | Panel | Static status changes | Animated recall trail |

Screenshot matrix: `screenshots/prototype-matrix.svg`.
