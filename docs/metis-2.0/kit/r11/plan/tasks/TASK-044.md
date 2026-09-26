# TASK-044 — Connect the user skill catalog and versioned run receipts

Source: MASTER revision 4.5, line 2590. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-008, TASK-022, TASK-043. **Requirements:** M2-SKILL-03; M2-SET-01.

**Do:** Add small curated/favorite skills and contextual selection to desktop/native and the server interface. Show entitled/ready/unavailable/offline states; emit real run/version/attempt usage and safe failure evidence.

**Verify before closing:** A newly published skill appears without reinstall. An active run stays pinned, a revoked cached skill fails, and retry usage is not counted twice. Ordinary users never need raw vendor/API controls.

**Revision-4.2 source and experience closure:** SRC-22, EXP-04, EXP-05. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-05, AGX-06, AGX-08, AGX-12, AGX-13, AGX-15, HC-06, HC-18, HC-20, HC-25, AGSTEP-07, AGSTEP-13. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-01, HM-09, HM-10, HM-13, HMSTEP-08, HMSTEP-09. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


