# TASK-021 — Build hardware qualification and the reviewed model catalog

Source: MASTER revision 4.5, line 2215. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-004, TASK-005. **Requirements:** M2-LOCAL-02.

**Do:** Probe actual OS/architecture/instruction sets, available memory/disk, execution-provider/driver support and requested languages. Add reviewed per-model resource/quality envelopes and conservative compatibility explanations. Reuse signed inventory definitions.

**Verify before closing:** Fixtures cover unsupported accelerators, low available memory, disk peaks, language mismatch and changing device conditions. Recommendations explain why they qualify; no raw unique device fingerprint or automatic download is emitted.

**Revision-4.2 source and experience closure:** SRC-16. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.


