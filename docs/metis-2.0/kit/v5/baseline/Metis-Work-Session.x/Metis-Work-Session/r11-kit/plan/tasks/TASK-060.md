# TASK-060 — Tune speed and footprint against the recorded baseline

Source: MASTER revision 4.5, line 2835. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-004, TASK-026, TASK-030, TASK-053, TASK-056, TASK-059. **Requirements:** M2-PKG-01; M2-VOICE-02; M2-STT-03.

**Do:** Profile the complete process tree and critical path. Remove duplicate sockets/work, per-sample rendering, excessive model calls, heavy startup loads and unnecessary resource copies. Bound downloads and background work during capture. Re-measure warm/cold and healthy/degraded conditions.

**Verify before closing:** Before/after bytes, startup, RAM/CPU, speech/decision/action latency and two-hour soak results support each claimed gain. Document approved budget exceptions; never trade fidelity, retention, approval or signature validation for faster numbers.

**Scope and sequencing:** Profile core platform slices independently. Add TASK-055 performance when live Teams is enabled, including whole-service capacity, queue fairness and join/admission boundaries. Do not exclude slower/failed runs or hide disk use in caches.

**Revision-4.2 source and experience closure:** SRC-14, SRC-16, EXP-03, EXP-10, EXP-12. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-15, HC-21, AGSTEP-17. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-12, HMSTEP-12. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


