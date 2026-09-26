# TASK-063 — Build, sign, freeze and qualify the immutable candidate family

Source: MASTER revision 4.5, line 2901. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-027, TASK-030, TASK-033, TASK-045, TASK-053, TASK-054, TASK-056, TASK-057, TASK-058, TASK-059, TASK-060, TASK-061, TASK-062. **Requirements:** All applicable M2 requirements.

**Do:** Build from an identified reviewed checkout with locked dependencies/manifests. Use the legitimate configured Windows signer/timestamp service for the relevant runtime/helpers and installer; verify signatures, then freeze final artifact hashes before running customer-candidate native acceptance. A Mac QA candidate is separately identified under its permitted development-signing policy. Run the complete relevant 112-use-case/adversarial matrix and final package/security/inventory tests. Record per-platform/per-profile source, artifact hashes, backend/schema versions and all blocked/skipped evidence.

**Verify before closing:** No mutable branch label, PR head metadata or rebuilt same-name file substitutes for actual provenance. Shared/privacy gates pass. Unqualified profiles stay unavailable. Mac public credentials are not demanded to qualify the independent Windows lane.

**Scope and sequencing:** Create separate .WIN and .MAC candidate records. Include TASK-055 for an advertised live Teams release. Build/sign/timestamp the Windows candidate **before** final hashing and final native acceptance. Freeze immutable backend/policy/schema/component compatibility too. No full-scope completion while a required integration is hidden as a disabled flag.

**Revision-4.2 source and experience closure:** SRC-02, SRC-04, SRC-09, SRC-14, SRC-15, SRC-16, SRC-18, SRC-19, SRC-24, EXP-08, EXP-10, EXP-12. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-16, HC-30, HC-32, AGSTEP-18. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




**Revision-4.4 implementation and review contract:** apply MASTER §33. Bind the implementation, independent Fable/Claude review and real verification to exact source/artifact/service identities. Mock-only success does not close this task. Preserve the existing Métis onboarding and apply the OBU-01–05 Tony-only/accessibility correction in §34. 



**Revision-4.5 Hindsight integration:** HM-16, HMSTEP-15, HMSTEP-16. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


