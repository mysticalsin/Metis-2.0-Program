# TASK-038 — Deploy and connect Dust knowledge read tools

Source: MASTER revision 4.5, line 2488. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-006, TASK-035, TASK-037. **Requirements:** M2-DUST-01; M2-DUST-03.

**Do:** Implement bounded remote MCP read/search/change/explain tools. Configure a permitted Dust workspace with personal OAuth or explicitly scoped service identity, correct region/callbacks and reviewed retention. Do not rely on user identity supplied in tool JSON.

**Verify before closing:** A real Dust agent retrieves authorized meeting context with verified citations; another principal cannot access it. Disconnect/revoke, wrong audience and unavailable source tests pass; supplier limitations remain explicit.

**Revision-4.2 source and experience closure:** SRC-23, EXP-11. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.



**Revision-4.5 Hindsight integration:** HM-03, HM-06, HM-10, HMSTEP-06, HMSTEP-09. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


