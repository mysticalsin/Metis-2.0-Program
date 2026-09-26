# TASK-016 — Connect the real Cloudflare Nova-3 server transport

Source: MASTER revision 4.5, line 2153. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-013, TASK-014, TASK-015. **Requirements:** M2-STT-02; M2-ASR-01.

**Do:** Implement the actual accepted Cloudflare-hosted realtime protocol using an eligible binding or authenticated server WebSocket relay. Pin model/config, validate accepted audio/language/endpointing options, handle upstream status/terminal metadata and safe errors, and document transport-specific privacy enforcement.

**Verify before closing:** A permitted synthetic PCM sample returns an actual normalized transcript. Wrong token, rejected options, invalid frames and upstream failure are exercised. A socket-open event or mocked text never satisfies the recognition test.

**Revision-4.2 source and experience closure:** SRC-07, SRC-08. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.


