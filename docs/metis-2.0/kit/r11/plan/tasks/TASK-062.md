# TASK-062 — Exercise production operations, staging and recovery

Source: MASTER revision 4.5, line 2878. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-012, TASK-023, TASK-034, TASK-045, TASK-057, TASK-058, TASK-060, TASK-061. **Requirements:** M2-OPS-03; M2-SEC-02.

**Do:** Include authorized knowledge-service, skill-service and meeting-service deployment/readback, least-privilege identities and content-free runtime controls. Complete safe monitoring, model/config drift alarms, budget/ingestion health, capability kill switches, canary policy, credential rotation runbooks and isolated database restore/rollback exercises. Confirm scopes/environment names and explicit recovery objectives. After approved backup/migration and staging checks, deploy the reviewed Worker, portal bundle, bindings and schema to the actual authorized Operator production/canary environment; read back deployed IDs and privacy controls. A staging-only success is not production completion.

**Verify before closing:** Real sanitized alert/restore/canary evidence exists. Backups/queues include only allowed metadata/config; product content is not captured for observability. No background job is claimed until it has actually been configured with authorization.

**Scope and sequencing:** Exercise shared operations and the services included in the release. Enabled meeting-service production also requires TASK-052/TASK-055. Record preflight signing access from TASK-002 and backend-before-client compatibility. A blocked unrelated vendor cannot justify skipping required shared restore/alert tests.

**Revision-4.2 source and experience closure:** SRC-02, SRC-08, SRC-10, SRC-17, SRC-18, SRC-19, SRC-20, SRC-24, EXP-08, EXP-09, EXP-12. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-10, HC-22, HC-29, AGSTEP-14. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




**Revision-4.4 implementation and review contract:** apply MASTER §33. Bind the implementation, independent Fable/Claude review and real verification to exact source/artifact/service identities. Mock-only success does not close this task. 



**Revision-4.5 Hindsight integration:** HM-14, HMSTEP-03, HMSTEP-13, HMSTEP-16. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


