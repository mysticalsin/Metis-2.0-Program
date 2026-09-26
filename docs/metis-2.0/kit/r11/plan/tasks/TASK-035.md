# TASK-035 — Implement the governed canonical knowledge service

Source: MASTER revision 4.5, line 2436. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-006, TASK-007, TASK-015. **Requirements:** M2-KNOW-02; M2-KNOW-04; M2-GOV-02.

**Do:** Implement scoped versioned reads/mutations against the selected approved knowledge store. Support expected-revision writes, immutable evidence references, idempotent commits and read-your-write. Deploy only in the authorized organizational environment.

**Verify before closing:** Real two-principal reads and concurrent writes demonstrate isolation and no lost updates. Sleeping-device behavior matches the chosen service contract. Content/keys do not enter prohibited Cloudflare stores.

**Scope and sequencing:** Use the content-free event contract now and integrate actual ledger presentation with TASK-034. Do not wait for Jev/Laya provisioning merely to build canonical authorized writes. Prove supported backing-store CAS and lost-event repair rather than assume multi-system transactions.

**Revision-4.2 source and experience closure:** SRC-11, SRC-23, EXP-02, EXP-04, EXP-09, EXP-11. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-08, AGX-13, HC-08, HC-09, HC-25, AGSTEP-08, AGSTEP-13. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-02, HM-03, HM-04, HM-05, HM-15, HMSTEP-04, HMSTEP-05, HMSTEP-14. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


