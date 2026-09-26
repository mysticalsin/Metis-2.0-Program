# TASK-036 — Build deterministic wiki and graph projections

Source: MASTER revision 4.5, line 2456. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-035. **Requirements:** M2-KNOW-03; M2-KNOW-05.

**Do:** Extend the existing wiki exporter and qualify Graphify where useful. Preserve strict verified-field gates, confidentiality exclusions, source revisions and scoped edges. Add incremental/atomic refresh and safe stale/rebuild states.

**Verify before closing:** Regeneration preserves authorized canonical edits, rejects malicious documents and does not widen audiences. Partial rebuild, deleted source and circular generated-evidence cases pass; plaintext sharing is explicit.

**Revision-4.2 source and experience closure:** SRC-23, EXP-11. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.



**Revision-4.5 Hindsight integration:** HM-05, HMSTEP-05, HMSTEP-10. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


