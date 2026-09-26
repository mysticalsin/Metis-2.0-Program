# TASK-014 — Implement the authenticated speech-session broker

Source: MASTER revision 4.5, line 2121. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-012, TASK-013. **Requirements:** M2-STT-02; M2-SEC-02.

**Do:** Extend the existing Operator protocol/router with a constrained session broker and the minimal required Worker relay. Authenticate device/principal, enforce requested tracks/model, privacy readiness, entitlement, concurrency and budget. Bind short-lived grants to an exact session; inject upstream secrets only on the server.

**Verify before closing:** Unauthenticated, revoked, expired, replayed, cross-device and wrong-scope requests fail before audio or paid inference. Actual route names, grant rules and safe failure codes are documented; no unrestricted proxy or caller-selected upstream URL exists.

**Revision-4.2 source and experience closure:** SRC-02, SRC-07, SRC-08, SRC-09, SRC-20, EXP-08. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** HC-15. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




