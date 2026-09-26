# TASK-064 — Verify and publish the already signed Windows candidate

Source: MASTER revision 4.5, line 2924. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-063. **Requirements:** M2-WIN-01; M2-REL-01.

**Do:** Take the exact signed/timestamped Windows artifact frozen and tested in TASK-063. Verify its expected publisher/chain, required timestamp, installer/runtime/helper coverage and hashes. Publish through the authorized release workflow without rebuilding, re-signing or changing its component manifest. Download from the actual customer destination, compare hashes/signatures and validate installed update-feed behavior against the qualified backend.

**Verify before closing:** Actual GitHub assets, final hashes, signatures/timestamps, native installation/upgrade and deployed backend compatibility evidence are delivered. No unsigned or stale replacement, fake DMG, bypassed security tool or untested rebuild is promoted.

**Revision-4.2 source and experience closure:** SRC-18. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGSTEP-18. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




**Revision-4.4 implementation and review contract:** apply MASTER §33. Bind the implementation, independent Fable/Claude review and real verification to exact source/artifact/service identities. Mock-only success does not close this task. 



**Revision-4.5 Hindsight integration:** HM-16, HMSTEP-16. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


