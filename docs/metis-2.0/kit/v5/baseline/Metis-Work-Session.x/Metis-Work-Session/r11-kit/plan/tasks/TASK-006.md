# TASK-006 — Establish cross-surface Entra and service identity

Source: MASTER revision 4.5, line 2007. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-002, TASK-005. **Requirements:** M2-TEAMS-01; M2-DUST-01; M2-SEC-02.

**Do:** Map desktop/Teams/Dust personal identities and separate bot/service principals. Register only authorized app audiences/scopes; define PKCE/OBO, token validation, revocation and tenant restrictions. Do not request broad calendar/media access merely to sign in.

**Verify before closing:** Actual authorized tenant tests distinguish delegated and service authority. Wrong audience/issuer/tenant, anonymous caller, forged email and revoked permissions fail. Missing admin consent is recorded, not bypassed.

**Revision-4.2 source and experience closure:** SRC-02, SRC-17, SRC-23, EXP-08. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-11, HC-15, AGSTEP-12. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-03, HMSTEP-04. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


