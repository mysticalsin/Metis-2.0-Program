# TASK-048 — Implement single-occurrence join coordination and admission

Source: MASTER revision 4.5, line 2654. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-047. **Requirements:** M2-TEAMS-02; M2-TEAMS-04.

**Do:** Build metadata-only leases/fencing, idempotent join requests, actual call-state reconciliation, lobby/denial/removal handling, bounds and graceful leave. Deduplicate enrolled colleagues under the approved tenant/occurrence scope.

**Verify before closing:** Two simultaneous triggers create one intended assistant/capture ownership. Ambiguous join timeout, organizer denial, removal, ended/no-host meeting and worker failover do not cause hidden reentry or duplicate capture.

**Revision-4.3 named-agent/source expansion:** AGX-10, HC-22, AGSTEP-14. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




