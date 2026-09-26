# TASK-027 — Repair onboarding, migration and both known P1s

Source: MASTER revision 4.5, line 2291. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-002, TASK-005. **Requirements:** M2-UX-02; M2-DATA-01; M2-REL-01.

**Do:** Inspect integration/equivalence of the historical #197 fix `7d684b24b2f4a1944388d94dd1c6c5dedfe5cc1a`; reproduce/integrate only the focused renderer fix and correct #196 without unconditional advancement. Implement privacy-ready Cloudflare onboarding, optional nonblocking downloads and explicit legacy mode migration. Preserve original-to-release patch mapping, notes/keys/IDs and release-feed continuity.

**Verify before closing:** Visible Next and bundled renderer pass unset/unreachable/reachable-stale override cases. Actual fresh and upgrade profiles retain data/consent, have truthful readiness and no surprise model acquisition or speech upload.

**Scope and sequencing:** **TASK-027.A — urgent repair:** start after baseline/contracts, independently of the new speech/local-pack onboarding. Resolve #196/#197 narrowly and record the source-to-release patch mapping. **TASK-027.B — full onboarding:** integrate TASK-020, TASK-022, TASK-024 and TASK-026 once ready; re-test both P1s and fresh/upgrade journeys on the final candidate. A pass for A does not close B.

**Revision-4.2 source and experience closure:** SRC-07, SRC-09, SRC-11, SRC-15, SRC-16, SRC-18. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-05, HC-13, HC-17, HC-18, HC-19, HC-20, HC-29, HC-31, AGSTEP-05. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




**Revision-4.4 implementation and review contract:** apply MASTER §33. Bind the implementation, independent Fable/Claude review and real verification to exact source/artifact/service identities. Mock-only success does not close this task. Preserve the existing Métis onboarding and apply the OBU-01–05 Tony-only/accessibility correction in §34. 


