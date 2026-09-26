# TASK-047 — Implement enrolled meeting discovery and actual-start events

Source: MASTER revision 4.5, line 2640. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-010, TASK-046. **Requirements:** M2-TEAMS-02; M2-TEAMS-05.

**Do:** Implement authorized subscriptions/installation and calendar discovery only as needed. Verify callbacks, renewals, lifecycle notifications, recurrence mapping and event coverage. Add explicit auto-attend enable/skip/pause and exclusions.

**Verify before closing:** Actual supported start—not scheduled clock alone—triggers eligibility. Reschedule/cancel/replay, late installation, unsupported type and privacy exclusions produce correct states without tenant-wide recording.

**Revision-4.2 source and experience closure:** EXP-01. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** HC-21, AGSTEP-14. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




