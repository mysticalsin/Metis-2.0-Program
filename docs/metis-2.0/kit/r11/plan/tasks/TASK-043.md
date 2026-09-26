# TASK-043 — Implement contextual server skill execution

Source: MASTER revision 4.5, line 2570. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-009, TASK-015, TASK-034, TASK-037, TASK-042. **Requirements:** M2-SKILL-02; M2-SKILL-03; M2-GOV-02.

**Do:** Run typed workflows on the approved server path with pinned versions, scoped context/tool permissions, budgets, cancellation and outputs. Use reviewed isolated compute only where necessary; keep user payload out of Cloudflare durable state.

**Verify before closing:** Real retrieval/inference/tool execution and denied-scope/cancellation/mid-run update tests pass. Only authorized low-risk mutations commit; desktop actions still require local trusted authority and verification.

**Scope and sequencing:** Use only the real ready provider(s) needed by the selected skill. Qualify Jev/Laya-assisted steps with TASK-031/TASK-032; do not require both credentials for a deterministic or generative-only synthetic skill. All promised provider variants remain tracked separately.

**Revision-4.2 source and experience closure:** SRC-22, EXP-02, EXP-03, EXP-04, EXP-06. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-07, AGX-08, AGX-09, AGX-10, AGX-11, AGX-12, AGX-13, HC-03, HC-05, HC-07, HC-08, HC-09, HC-14, HC-15, HC-16, HC-19, HC-21, HC-22, HC-25, HC-26, HC-28, AGSTEP-10, AGSTEP-13, AGSTEP-14. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-06, HM-07, HM-09, HM-10, HMSTEP-09. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


