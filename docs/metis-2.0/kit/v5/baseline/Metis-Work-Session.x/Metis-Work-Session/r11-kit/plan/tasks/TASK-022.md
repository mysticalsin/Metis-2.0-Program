# TASK-022 — Implement separate optional local-model Settings

Source: MASTER revision 4.5, line 2225. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-008, TASK-021. **Requirements:** M2-LOCAL-01; M2-UX-02; M2-SET-01; M2-SET-02.

**Do:** Implement the four-destination Settings design and legacy-key migration; add nested optional local speech and optional local generation controls, with vision as a separate capability. Show not-installed/downloading/verified/installed/selected/loaded/unsupported states, bytes, compatibility and privacy implications. Installing a pack does not select it silently.

**Verify before closing:** Fresh installs show Cloudflare default and no local packs/processes. Explicit install/select/disable/remove flow is keyboard-accessible, persists correctly and respects managed locks; failing cloud speech never starts this flow automatically.

**Revision-4.2 source and experience closure:** SRC-22, EXP-05. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.



**Revision-4.5 Hindsight integration:** HM-01. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


