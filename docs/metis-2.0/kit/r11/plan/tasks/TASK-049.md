# TASK-049 — Deploy the qualified Teams media receiver

Source: MASTER revision 4.5, line 2666. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-010, TASK-012, TASK-015, TASK-048. **Requirements:** M2-TEAMS-03; M2-GOV-01.

**Do:** Implement the supported media SDK on the authorized required hosting platform. Apply least-privilege app/media permissions, lifecycle/capacity controls and recording-status/derived-data prerequisites. Disable media payload dumps and persistent audio.

**Verify before closing:** Actual test-tenant admission/media prerequisites are proven or specifically blocked. A 201 call response or successful web app deployment is not audio evidence. Unsupported policy/status routes stay disabled.

**Revision-4.2 source and experience closure:** EXP-07. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.


