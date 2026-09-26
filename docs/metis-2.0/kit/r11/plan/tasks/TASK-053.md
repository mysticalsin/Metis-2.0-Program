# TASK-053 — Qualify transcript fidelity and speech latency

Source: MASTER revision 4.5, line 2708. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-011, TASK-016, TASK-017, TASK-018, TASK-020. **Requirements:** M2-ASR-02; M2-STT-03.

**Do:** Build the permissioned, versioned holdout/scoring harness and freeze normalization, primary slices, non-inferiority margins, critical-error definitions and evidence sufficiency before scoring. Include exact target/intent accuracy and completed/refused/clarified denominators. Test Cloudflare primary configurations per language/noise/device, names/numbers/negations/silence/overlap and meeting versus command endpointing. Compare alternatives only within approved evaluation terms.

**Verify before closing:** Measured slices, sample counts, confidence limits, p50/p95/p99 and failure denominators support the advertised scope. No universal irrefutability claim, hidden slow/error exclusions or overwritten uncertain words. Failed slices trigger correction or an approved narrowed capability, not cosmetic green.

**Revision-4.2 source and experience closure:** SRC-06, SRC-12, SRC-13, SRC-24, EXP-06, EXP-07, EXP-12. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.



**Revision-4.5 Hindsight integration:** HM-12, HMSTEP-12. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


