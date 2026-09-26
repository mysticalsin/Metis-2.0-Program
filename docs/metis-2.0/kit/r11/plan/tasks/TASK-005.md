# TASK-005 — Define shared speech, command, policy and metering contracts

Source: MASTER revision 4.5, line 1993. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-002. **Requirements:** M2-STT-01; M2-ACT-01; M2-OPS-02.

**Do:** Extend existing TypeScript/Swift contracts for selected/allowed/ready engines, separate speech/generation capability, capture generation, requested track, stream epoch, segment revision, operation/attempt/step identity and typed outcomes. Implement migration/default fixtures before UI labels.

**Verify before closing:** Golden cross-platform fixtures and negative tests preserve explicit legacy choices, forbid a local installation from implicitly selecting it, and make every fresh eligible 2.0 profile Cloudflare-default without treating that preference as capture consent.

**Revision-4.2 source and experience closure:** SRC-02, SRC-03, SRC-04, SRC-06, SRC-11, SRC-16, SRC-17, SRC-21, SRC-24, EXP-02, EXP-07, EXP-09. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-02, AGX-06, AGX-09, HC-04, HC-07, HC-10, HC-11, HC-16, HC-24, HC-26, AGSTEP-02. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




