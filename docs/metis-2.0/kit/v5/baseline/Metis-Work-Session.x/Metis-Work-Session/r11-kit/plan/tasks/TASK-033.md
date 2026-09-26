# TASK-033 — Complete safe native and browser actions

Source: MASTER revision 4.5, line 2400. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-019. **Requirements:** M2-ACT-01; M2-ACT-02.

**Do:** Implement qualified open/focus/graceful close, exact notes, browser actions and camera behavior per platform. Resolve fresh targets, parameters and approvals. Inspect every returned result and independently verify the postcondition. Refuse arbitrary shell text and unsafe partial-speech execution.

**Verify before closing:** Supported UC-009–UC-040 cases show the real result, not only app launch. Failed/unknown/cancelled cannot become verified; unsaved work, stale targets, retries, injection and multi-step failure are tested without touching private user fixtures.

**Scope and sequencing:** Implement deterministic/native adapters against the common contract first. .MAC also requires TASK-029; each model-assisted slice requires its real qualified TASK-031 or TASK-032 provider. Validate operation-target compatibility, manual interference, intentional repeated commands and exact note/photo outcomes. Close aggregate scope only with all required platform/provider evidence.

**Revision-4.2 source and experience closure:** SRC-03, SRC-04, SRC-05, SRC-06, SRC-21, EXP-04, EXP-09. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-02, AGX-03, AGX-04, AGX-09, AGX-11, HC-04, HC-10, HC-11, HC-13, HC-14, HC-23, HC-24, AGSTEP-03, AGSTEP-04, AGSTEP-11, AGSTEP-12. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




