# LESSON-003 — Scope event binding to real controls

The first synthetic-browser suite found that selecting all `[data-state]` elements also bound the workspace container. Clicks on nested input/approval controls bubbled into an unintended state reset. This broke inert-text preview and approval feedback.

The handler and selected-state update now target `button[data-state]` only. The regression suite verifies all 14 controls, literal typed text, approval feedback and generation-aware cancellation. This was a delivery-kit UI defect, not a diagnosed defect in the Métis application.

Test-harness corrections are separate: each HTML document now receives a fresh page instead of reusing JavaScript globals through document replacement; CSP-safe function predicates replace string-eval waits. Security policy was not weakened to make tests pass.
