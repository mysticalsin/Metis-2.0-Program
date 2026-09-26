# TASK-018 — Harden segment revision, reconnect and stream finalization

Source: MASTER revision 4.5, line 2175. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-017. **Requirements:** M2-ASR-01; M2-STT-03.

**Do:** Use stable segment identity and monotonic audio offsets across partial revisions, finals and new upstream epochs. Preserve the good existing end-of-stream distinction. Implement bounded reconnect/backpressure and distinguish normal tail flush from immediate stop-all/revocation.

**Verify before closing:** Duplicate/out-of-order finals, delayed metadata, clipped tail, disconnect/reconnect, language switch, overflow and cancellation races pass. No duplicate words, fabricated continuity or durable audio retry spool is introduced.

**Scope and sequencing:** Implement provider fixtures independently; close live finalization/reconnect evidence only with TASK-016. Preserve every native-platform result separately.

**Revision-4.2 source and experience closure:** SRC-06, SRC-10, SRC-12, SRC-13, SRC-22, EXP-02, EXP-03, EXP-06, EXP-07, EXP-09. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** HC-12. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




