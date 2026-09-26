# TASK-041 — Close knowledge synchronization and deletion loops

Source: MASTER revision 4.5, line 2536. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-039, TASK-040. **Requirements:** M2-KNOW-05; M2-DUST-03; M2-GOV-02.

**Do:** Implement scoped delta reconciliation, correction propagation, tombstones, confidential-source exclusion and revoked-reader blocking across canonical, wiki, graph, caches and configured external replicas. Prevent stale-device/backup resurrection.

**Verify before closing:** Real edits from either surface converge. Revocation blocks reads before cleanup completes, and rights/deletion status honestly names third-party/legal-hold limits. No wildcard delete or plaintext export shortcut.

**Revision-4.2 source and experience closure:** SRC-23, EXP-09, EXP-11. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-08, HC-08, AGSTEP-08. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-05, HM-08, HM-15, HMSTEP-07, HMSTEP-10, HMSTEP-14. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


