# TASK-059 — Qualify optional local packs on actual device classes

Source: MASTER revision 4.5, line 2825. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-021, TASK-022, TASK-024, TASK-025, TASK-053. **Requirements:** M2-LOCAL-01; M2-LOCAL-02.

**Do:** Test representative eligible Windows/native Mac classes using the same quality harness and resource envelopes. Verify post-install self-test, offline operation, unload/remove, unavailable accelerator, memory/thermal pressure, unsupported language and download contention during capture.

**Verify before closing:** Each offered pack has actual compatibility/quality/realtime-factor evidence or a clear unsupported status. Local-only has no speech egress; core default never downloads/loads packs. Hardware detection is not portrayed as a benchmark.

**Scope and sequencing:** Qualify each actual Windows/native Mac device/profile separately; .MAC requires TASK-029. A missing accelerator or optional pack is not a pass; do not block the lean cloud core by installing every pack on every device.


