# TASK-037 — Implement the authorized evidence context builder

Source: MASTER revision 4.5, line 2470. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-035, TASK-036. **Requirements:** M2-KNOW-01; M2-KNOW-04; M2-GOV-02.

**Do:** Build bounded source-linked search/context with before-retrieval authorization, source revisions, dates, evidence labels, output-audience checks and safe cache keys. Start from working existing retrieval before adding new infrastructure.

**Verify before closing:** Permission/confidentiality/negation/conflict/staleness fixtures and measured query budgets pass. Model input contains no unauthorized source and the result cites real permitted evidence.

**Revision-4.2 source and experience closure:** SRC-22, SRC-23, EXP-01, EXP-03, EXP-06. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-02, HC-10, HC-11, HC-12, HC-24, AGSTEP-03. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-02, HM-03, HM-06, HM-07, HM-09, HMSTEP-04, HMSTEP-06, HMSTEP-10. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


