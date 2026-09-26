# TASK-004 — Measure size, capture and hardware baselines

Source: MASTER revision 4.5, line 1979. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-001. **Requirements:** M2-PKG-01; M2-ASR-01; M2-LOCAL-02.

**Do:** Measure actual compressed/unpacked/temporary install sizes, resource duplication, startup/process-tree memory/CPU and current capture/stream latency. Inventory supported Windows/Mac devices, architectures, accelerators and languages; do not substitute marketing model names for measured properties.

**Verify before closing:** A reproducible baseline ties bytes and performance to an exact artifact/profile/device. Explain what remains unmeasured; the historical 1.57 GB source inventory is not mislabeled as a new installed-size test.

**Revision-4.2 source and experience closure:** SRC-16, EXP-12. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** HC-03. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




