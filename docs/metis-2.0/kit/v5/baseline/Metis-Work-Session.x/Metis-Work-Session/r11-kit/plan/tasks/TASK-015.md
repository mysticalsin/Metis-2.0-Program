# TASK-015 — Make diagnostics and metering projections content-free

Source: MASTER revision 4.5, line 2135. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-013, TASK-014. **Requirements:** M2-PRIV-03; M2-STT-04.

**Do:** Apply explicit allowlist projection before logging, queues, database writes, tracing, alerts and support exports. Keep only approved IDs, versions, quantities, timings, enums and identity records. Define retention/deletion for operational events; exclude raw provider errors, custom vocabulary and content hashes.

**Verify before closing:** Adversarial fixtures carrying synthetic content/credentials are rejected or safely projected at every sink. Metadata-only usage remains durable. Gateway logs are not the only ledger, and accounting is not lost merely because content logging is off.

**Revision-4.2 source and experience closure:** SRC-10, SRC-19, SRC-21. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-14, HC-30, AGSTEP-15. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-04, HM-14, HMSTEP-02, HMSTEP-03. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


