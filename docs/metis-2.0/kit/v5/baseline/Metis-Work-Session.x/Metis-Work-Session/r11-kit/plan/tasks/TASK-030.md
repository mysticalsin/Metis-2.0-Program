# TASK-030 — Connect the real orb, beam and caption interfaces

Source: MASTER revision 4.5, line 2349. The master and scoped handoffs remain authoritative.

**Depends on:** TASK-005, TASK-019, TASK-028.A. **Requirements:** M2-UX-01; M2-VOICE-02.

**Do:** Implement §5.11 first: ARMED renders only the mesh button; the pill, caption and beam are absent until deliberate typing or trusted wake. Use the reviewed React effects and qualified native equivalents when expanded: solving orb inside the pill, live caption above, beam border and audio-driven glow. Bind actual session state/level and local Stop; no duplicate microphone hook or redundant decorative status label.

**Verify before closing:** Windows/native state evidence proves orb-only ARMED, tight native hit bounds, typed-versus-wake focus, duplicate wake/approval protection, IME dismissal, OFF/lock distinctions and correct capture/solve/approval/result/error behavior. Hidden/reduced-motion modes stop unnecessary animation, and no animation gates authorized execution.

**Scope and sequencing:** The .WIN slice uses its ready React controller. The .MAC slice additionally requires TASK-029 and genuine native rendering. Neither waits for the other to begin. Both must eventually prove the promised interaction; a PNG cannot substitute for the specified libraries and native equivalents.

**Revision-4.2 source and experience closure:** SRC-14, SRC-15, EXP-03, EXP-10. Read the exact observation, change and acceptance contract in sections 28–29. Preserve the task’s scoped prerequisites; a source finding is not a product pass.

**Revision-4.3 named-agent/source expansion:** AGX-03, AGX-15, HC-16, HC-17, HC-21, HC-24, AGSTEP-04, AGSTEP-07. Read MASTER §32 and the matching `plan/AGENT-EXPANSION.json` rows. Source presence and synthetic reference tests are not runtime passes; preserve each task's original native/live-service/security gates.




**Revision-4.4 implementation and review contract:** apply MASTER §33. Bind the implementation, independent Fable/Claude review and real verification to exact source/artifact/service identities. Mock-only success does not close this task. Preserve the existing Métis onboarding and apply the OBU-01–05 Tony-only/accessibility correction in §34. 


