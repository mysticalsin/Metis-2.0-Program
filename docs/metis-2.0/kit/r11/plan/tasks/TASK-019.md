# TASK-019 — Implement opt-in local wake and immediate stop authority

Source: MASTER revision 4.5, line 2191. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-017, TASK-018. **Requirements:** M2-VOICE-01; M2-VOICE-02.

**Do:** Implement or qualify the small local wake detector and trusted session transition. No cloud audio before wake/explicit meeting capture; transfer only the authorized command interval. Keep first-syllable handling, meeting subscriptions, command-off and stop-all semantics distinct.

**Verify before closing:** Wake/first-word/echo/replay/negation/stale-generation tests pass; local stop revokes authority without waiting on network. Idle speech egress is absent and the small wake component is not a full offline ASR download.

**Revision-4.2 source and experience closure:** SRC-04, SRC-05, SRC-06, EXP-10. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-04, AGX-07, HC-16, HC-23, AGSTEP-04, AGSTEP-09. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




