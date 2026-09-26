# TASK-023 — Provision signed manifests and R2 asset delivery

Source: MASTER revision 4.5, line 2239. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-004, TASK-005, TASK-012, TASK-021. **Requirements:** M2-PKG-02; M2-SEC-01.

**Do:** Use authorized R2/Worker infrastructure for immutable reviewed assets, signed manifests and appropriately scoped grants. Separate asset caching from no-cache speech. Define compatibility, trusted root rotation, length/hash/signature, safe extraction and rollback protection.

**Verify before closing:** Actual authorized staging asset/manifests and tamper/expiry/scope/architecture tests pass. No private signing key, provider account credential or recording is in downloadable assets or public metadata.

**Revision-4.2 source and experience closure:** SRC-09, SRC-16. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** HC-03. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




