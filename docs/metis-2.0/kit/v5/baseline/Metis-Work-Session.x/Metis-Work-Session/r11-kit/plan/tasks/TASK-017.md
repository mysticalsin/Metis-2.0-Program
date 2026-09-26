# TASK-017 — Repair the trusted audio broker and requested-only tracks

Source: MASTER revision 4.5, line 2163. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005. **Requirements:** M2-VOICE-01; M2-STT-03.

**Do:** Reuse the current capture owner and move high-frequency processing off the UI thread. Open microphone-only for commands and only explicitly requested tracks for meetings. Validate sample rate/channel/framing/resampling and cap every in-flight queue by bytes and duration.

**Verify before closing:** Actual capture and deterministic fixtures show no duplicate microphones/system streams, no frame-format mismatch, explicit dropped-frame gaps and bounded resources. UI effects consume a scalar level, never a new capture subscription.

**Scope and sequencing:** Audio capture/format and pure broker work starts from TASK-005. Actual Cloudflare integration also requires TASK-016 and is proved in TASK-020. Neither contract fixtures nor a local microphone loop count as upstream speech proof.

**Revision-4.2 source and experience closure:** SRC-06, SRC-12, SRC-13, EXP-03, EXP-07. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.


