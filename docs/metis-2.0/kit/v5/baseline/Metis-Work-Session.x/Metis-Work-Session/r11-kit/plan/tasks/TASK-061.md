# TASK-061 — Apply the supplied refactoring skill in bounded slices

Source: MASTER revision 4.5, line 2855. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-001, TASK-002, TASK-003, TASK-005. **Requirements:** M2-ENG-01.

**Do:** Read the real provided skill and use Ponytail only as complementary guidance. Refactor oversized/duplicated responsibilities around tested boundaries, keeping local/cloud/native policy semantics shared. Update source graph, numbered lessons and task relay after each accepted slice.

**Verify before closing:** Behavioral, security, quality and dependency tests stay green. Report maintainability and actual engineering-token/search overhead changes; do not remove guards/tests to lower line counts or label file moves an architecture improvement.

**Scope and sequencing:** **Slice entry:** characterize the affected behavior and inspect the supplied skill before each refactor. Work can proceed alongside completed feature slices; no requirement to wait for Teams approvals. **Final closure:** perform an integrated dependency/security/regression review after all included repairs, UI, knowledge and performance changes; TASK-063 consumes that final closure, not an early partial pass.

**Revision-4.2 source and experience closure:** SRC-19, SRC-24, EXP-12. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-01, HC-27, AGSTEP-17. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




**Revision-4.4 implementation and review contract:** apply MASTER §33. Bind the implementation, independent Fable/Claude review and real verification to exact source/artifact/service identities. Mock-only success does not close this task. 



**Revision-4.5 Hindsight integration:** HM-15, HMSTEP-14. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


