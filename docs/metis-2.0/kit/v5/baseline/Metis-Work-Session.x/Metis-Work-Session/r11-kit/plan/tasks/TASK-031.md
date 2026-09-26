# TASK-031 — Finish the real Jev decision gateway and application

Source: MASTER revision 4.5, line 2368. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-012, TASK-015. **Requirements:** M2-DEC-01; M2-ACT-01.

**Do:** Complete entitlement, server vault, typed candidate-bound requests and application of successful decisions. Remove the discarded-result behavior while preserving independent policy/approval checks. Apply content-privacy controls to transcript-derived requests too.

**Verify before closing:** A live authorized Jev request changes the actual qualified plan with route/version/usage evidence. Invalid/stale/out-of-candidate results and outage cannot execute; provider confidence never substitutes for permission.

**Scope and sequencing:** Bring up the provider contract using synthetic allowed state without waiting for wake UI. Complete command integration with TASK-019/TASK-033 and Intelligence integration with TASK-040; both actual effects, plus two-device shared-key isolation/rotation, need evidence.

**Revision-4.2 source and experience closure:** SRC-03. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-07, AGSTEP-09. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




