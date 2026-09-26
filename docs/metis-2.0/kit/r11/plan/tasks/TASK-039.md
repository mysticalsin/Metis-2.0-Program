# TASK-039 — Implement real Dust writes and reviewed corrections

Source: MASTER revision 4.5, line 2502. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-035, TASK-038. **Requirements:** M2-DUST-02; M2-KNOW-05.

**Do:** Expose typed allowed action mutations plus high-impact change proposals. Enforce roles, expected revision, idempotency, exact approval, state readback and projection refresh. Do not let agents edit generated pages or self-verify financial fields.

**Verify before closing:** Real Dust writes survive regeneration and appear in Intelligence. Two agents/human conflict, timeout replay, rejected pinned-field change and pending-approval versus committed states are demonstrated.

**Revision-4.2 source and experience closure:** SRC-23, EXP-09, EXP-11. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-08, HC-08, HC-14, HC-26, AGSTEP-08. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-08, HM-10, HMSTEP-07, HMSTEP-09. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


