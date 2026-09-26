# TASK-025 — Enforce local model load, resource and fallback rules

Source: MASTER revision 4.5, line 2263. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-017, TASK-021, TASK-024. **Requirements:** M2-LOCAL-01; M2-LOCAL-02.

**Do:** Load models only when selected and needed, cap context/concurrency/memory, detect tested execution providers and unload safely at idle. Prioritize capture over background installation/self-tests. Add explicit local-only and optional preapproved fallback policies without automatic mode changes.

**Verify before closing:** Default startup launches no local inference. Disabling a model releases its resources. Local-only failures produce no cloud audio; memory pressure/unsupported language/thermal events do not covertly change provider or trigger downloads.

**Revision-4.2 source and experience closure:** SRC-16, EXP-07. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.


