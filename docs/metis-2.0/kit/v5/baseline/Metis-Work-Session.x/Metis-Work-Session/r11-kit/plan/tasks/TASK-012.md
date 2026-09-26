# TASK-012 — Prepare authorized Cloudflare staging and server credentials

Source: MASTER revision 4.5, line 2093. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-002, TASK-005. **Requirements:** M2-STT-02; M2-SEC-01; M2-OPS-03.

**Do:** Inspect available cloud credentials and existing Operator provisioning/deploy scripts. Configure an isolated staging Worker/D1 and required AI binding or scoped server secret, with least privilege, correct environment separation and no placeholder database IDs. Preserve unrelated resources.

**Verify before closing:** Authorized deployment/readback proves actual binding and version identity. No desktop asks for or receives a Cloudflare account token. Any missing account permission is documented; configuration text alone does not count as provisioning.

**Revision-4.2 source and experience closure:** SRC-07, SRC-08, SRC-09, SRC-17, SRC-19, SRC-20, EXP-08. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** HC-15, HC-30. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




