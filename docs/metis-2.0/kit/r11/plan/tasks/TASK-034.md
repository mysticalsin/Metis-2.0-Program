# TASK-034 — Repair identity and authoritative metering end to end

Source: MASTER revision 4.5, line 2416. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-015. **Requirements:** M2-OPS-01; M2-OPS-02; M2-STT-04.

**Do:** Separate people/devices/sessions/operations/attempts and bind identity at event time. Preserve server usage across late client updates, support cumulative provider fields and track speech duration/transport/channel/reconnect pricing with provenance. Make settlement concurrency-safe and content-free.

**Verify before closing:** All accounting tests pass including late nulls, cross-device rejection, cumulative 1/15/30, real separate attempts, interrupted speech, unknown usage, local/PCC semantics and hard-budget races. No raw payload is saved to recover a charge.

**Scope and sequencing:** Repair identity/merge/aggregate foundations with deterministic fixtures immediately; integrate live speech TASK-014/TASK-018 and each decision-provider result when ready. Do not make basic accounting correctness depend on every future connector. Live per-route reconciliation remains required.

**Revision-4.2 source and experience closure:** SRC-02, SRC-10, SRC-17, SRC-21, EXP-08. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-14, AGSTEP-15. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-11, HMSTEP-11. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


