# TASK-057 — Close no-content-retention and drift-evidence gates

Source: MASTER revision 4.5, line 2782. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-011, TASK-013, TASK-015, TASK-020, TASK-034, TASK-045, TASK-054, TASK-056. **Requirements:** M2-PRIV-01; M2-PRIV-02; M2-PRIV-03.

**Do:** Run synthetic sentinel tests over every active speech/follow-on route and controlled sink on success/error/retry/cancel/revocation. Read back configuration, verify supported WS controls, approved supplier assurance and finite metadata retention. Implement authorized configuration-drift checks and fail-closed new-session readiness.

**Verify before closing:** No controlled sink contains test content, while approved usage still reconciles. Config/evidence revision and supplier limitations are explicit. Do not claim invisible provider infrastructure was inspected or erase historic content without an authorized remediation decision.

**Scope and sequencing:** Close .CORE privacy independently. For enabled live Teams include TASK-049/TASK-050/TASK-055 and all receiver sinks; for Dust/skills include their actual connected handling. Unqualified new routes remain disabled and visible as blockers; never weaken privacy to close a parent task.

**Revision-4.2 source and experience closure:** SRC-07, SRC-08, SRC-13, SRC-19, SRC-21, SRC-24, EXP-12. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-02, AGX-04, AGX-09, AGX-13, AGX-16, HC-04, HC-09, HC-13, HC-23, HC-26, HC-30, AGSTEP-17. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




**Revision-4.4 implementation and review contract:** apply MASTER §33. Bind the implementation, independent Fable/Claude review and real verification to exact source/artifact/service identities. Mock-only success does not close this task. Preserve the existing Métis onboarding and apply the OBU-01–05 Tony-only/accessibility correction in §34. 



**Revision-4.5 Hindsight integration:** HM-04, HM-14, HMSTEP-13. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


