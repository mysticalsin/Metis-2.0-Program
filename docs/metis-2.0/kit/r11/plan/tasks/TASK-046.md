# TASK-046 — Build Teams personal and meeting surfaces with SSO

Source: MASTER revision 4.5, line 2628. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-006, TASK-008. **Requirements:** M2-TEAMS-01; M2-SET-01.

**Do:** Create the actual Teams package, personal tab and meeting side panel with authenticated service calls, clear presence/capture controls and private-by-default outputs. Preserve standalone apps; do not expose Electron IPC or direct local control.

**Verify before closing:** Authorized installed Teams test app works under proper identity. Guest/wrong-tenant, untrusted deep link, shared-stage audience and narrow-panel accessibility tests pass. Tab functionality is not recorded as media joining.

**Scope and sequencing:** SSO, app packaging and an authenticated empty/error-state shell can be built before the whole portal. Integrate real knowledge and skills after TASK-037/TASK-044 and operations with TASK-045. Do not claim app installation is proof of joining or media access.

**Revision-4.2 source and experience closure:** EXP-01. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.


