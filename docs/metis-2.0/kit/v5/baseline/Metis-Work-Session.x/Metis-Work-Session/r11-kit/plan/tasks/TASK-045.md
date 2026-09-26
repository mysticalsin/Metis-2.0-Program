# TASK-045 — Repair portal totals, speech controls and data-health UX

Source: MASTER revision 4.5, line 2608. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-015, TASK-034. **Requirements:** M2-OPS-01; M2-OPS-02; M2-STT-04; M2-PRIV-03.

**Do:** Use database full-window aggregates independent of detail pagination. Add real Cloudflare speech readiness/config/privacy revision, device-qualified local state and accurate Jev/Laya settings. Integrate published skill version/run accounting, knowledge freshness, Dust service health and meeting assistant states. Keep people, bots, devices and activity distinct. Display partial/unavailable/estimated usage distinctly; enforce role scope in queries, exports and caches.

**Verify before closing:** At least 2,001 synthetic attempts reconcile across rows/KPI/chart/export. One user/two devices remains one user. Portal labels match actual backend selection; data failures cannot look like no activity or zero spend.

**Scope and sequencing:** The .CORE slice repairs users, usage totals, errors and completeness first. Add local/decision panes with TASK-022/TASK-025/TASK-031/TASK-032 and knowledge/skill panes with TASK-040/TASK-041/TASK-044 as they become ready. Final .ALL evidence must exercise every advertised pane; a placeholder is not integration.

**Revision-4.2 source and experience closure:** SRC-02, SRC-10, SRC-17, EXP-08. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-10, AGX-11, AGX-14, HC-14, HC-22, HC-28, AGSTEP-12, AGSTEP-15. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.





**Revision-4.5 Hindsight integration:** HM-11, HMSTEP-11. Read MASTER §35, memory/EXPANSION.json and memory/BINDINGS.md. Embed behind the existing canonical/identity boundary; preserve Cloudflare privacy and lean native clients. Offline component tests do not close actual integration or release gates.


