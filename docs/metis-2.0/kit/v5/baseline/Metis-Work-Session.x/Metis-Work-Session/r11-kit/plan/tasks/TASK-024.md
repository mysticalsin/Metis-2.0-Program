# TASK-024 — Implement optional component lifecycle and installation

Source: MASTER revision 4.5, line 2253. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-021, TASK-022, TASK-023. **Requirements:** M2-PKG-02; M2-LOCAL-01.

**Do:** Download only selected allowed packs; stream with bounded resources, resumable verified ranges, space checks and cancellation. Verify then safely extract/self-test and activate atomically. Do not alter a signed Mac app bundle or fetch arbitrary runtime code.

**Verify before closing:** Interrupted download, sleep, reboot, captive portal, low disk, bad signature/hash, decompression abuse and failed self-test leave no partial capability active. Uninstall affects only owned assets and does not erase user data.

**Revision-4.2 source and experience closure:** SRC-15, SRC-16, EXP-07. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.


