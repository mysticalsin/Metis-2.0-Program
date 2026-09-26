# TASK-013 — Disable speech content logs and caches before capture tests

Source: MASTER revision 4.5, line 2107. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-011, TASK-012. **Requirements:** M2-PRIV-01; M2-PRIV-02.

**Do:** Provision a deliberate sensitive-route gateway where applicable. Disable gateway logs/cache, remove body-bearing traces and exclude inference paths from CDN/Worker caching. Apply supported request/binding protections server-side and record the transport-specific test plan, including WebSockets.

**Verify before closing:** Sanitized configuration readback shows the intended settings before content tests. No code path can auto-create an unreviewed logging-enabled default gateway or let a client re-enable collection. Live effect is subsequently tested in TASK-020 and TASK-057.

**Revision-4.2 source and experience closure:** SRC-08. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** HC-30. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




