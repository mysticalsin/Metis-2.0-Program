# TASK-042 — Implement versioned server skill authoring and publishing

Source: MASTER revision 4.5, line 2554. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-009, TASK-015. **Requirements:** M2-SKILL-01; M2-SKILL-03.

**Do:** Extend Operator with draft validation, synthetic evals, review, canary, immutable published versions and revocation/rollback. Pin dependencies and deny unreviewed executable uploads. Move existing distribution semantics through a compatible migration.

**Verify before closing:** Publish/update/revoke/rollback a synthetic skill in actual staging. Catalog/review evidence and historical version integrity hold; no client installation is required for approved instruction updates.

**Scope and sequencing:** Author/catalog/publishing tests use synthetic definitions independently of an always-on knowledge store. Contextual execution depends on TASK-037 through TASK-043; publishing alone does not qualify execution.

**Revision-4.2 source and experience closure:** SRC-22, EXP-04, EXP-06. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-06, AGX-12, HC-05, HC-06, HC-07, HC-18, HC-19, HC-27, HC-28, AGSTEP-06. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




