# TASK-029 — Build the native Mac foundation using the actual Codex environment

Source: MASTER revision 4.5, line 2326. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-002, TASK-005. **Requirements:** M2-MAC-01.

**Do:** Extend native-app/ in Swift/SwiftUI/AppKit with genuine native capture, Keychain, restricted helpers and the shared contract fixtures. Make Cloudflare the same default speech choice. Compile through Xcode; record the real Codex/SDK versions, not an invented Codex 2 identifier.

**Verify before closing:** Native builds and local-development-policy tests establish real platform behavior. App permissions, migration IDs and capability differences are documented. Public Developer ID signing/notarization remains a distinct external gate.

**Scope and sequencing:** Begin native project, schemas, identity, windows and permission fixtures now. Add actual capture/wake after TASK-017–TASK-019 and optional-pack support after TASK-021. Close native functional evidence only when those integrations run on a Mac; missing Apple public signing does not delay this engineering.

**Revision-4.2 source and experience closure:** SRC-05, SRC-11, SRC-12, SRC-13, SRC-14, SRC-24, EXP-07, EXP-09, EXP-10. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-16, HC-02, HC-29. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




**Revision-4.4 implementation and review contract:** apply MASTER §33. Bind the implementation, independent Fable/Claude review and real verification to exact source/artifact/service identities. Mock-only success does not close this task. Preserve the existing Métis onboarding and apply the OBU-01–05 Tony-only/accessibility correction in §34. 



**Revision-4.5 Hindsight integration:** HM-01, HM-13, HMSTEP-08. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


