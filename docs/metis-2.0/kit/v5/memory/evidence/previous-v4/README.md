# Métis 2.0 — v4: note-taking preserved, keyboard-first assistance, JEV retained

**Full consolidated implementation handoff. Product-contract correction, not a new installed app or native shortcut patch.**

Métis remains the note-taker and meeting copilot. Use a configurable global keyboard toggle to summon/dismiss it; use keyboard, typed input or the mic to ask, guide or act. HeyClicky-style actions are additions within the same product. Notes continue while the assistant is invoked or dismissed.

## What changed in v4

The authoritative correction is `keyboard-notes/PRODUCT-CORRECTION.md`. It adds twelve note-taking/keyboard requirements and sixteen actual-app acceptance scenarios. It corrects click-first wording in the product behavior, JEV document, coding prompt and matrices. It requires a real combined meeting + keyboard + assistance + action + final-summary demonstration, not merely a Notes-file demo.

**No runtime source was changed.** All ten v3 TypeScript modules, compiled code, tests and baseline ZIPs remain byte-identical. JEV integration is retained in full. Keyboard registration and capture coexistence must be bound and tested in the real repository's existing controllers; this kit has not registered a key on your computer.

## Start here

1. `keyboard-notes/PRODUCT-CORRECTION.md` — product identity and exact control/lifecycle rules.
2. `delivery/IMPLEMENTATION-PROMPT.md` — the full corrected development job.
3. `keyboard-notes/REQUIREMENTS.json`, `INTEGRATION.json`, `ACCEPTANCE-MATRIX.json` — testable integration requirements under existing original tasks.
4. `jev/JEV-INTEGRATION.md`, `jev/JEV-ROLE-AND-BINDINGS.md`, `jev/BACKLOG.json` and `jev/QUALIFICATION.md` — preserved server-key, actual decision-consumption and Intelligence work.
5. `IMPLEMENTATION-REPORT.md` and `keyboard-notes/evidence/FINAL-STATUS.json` — executed checks and explicit limits.

## Complete package retained

- `baseline/Metis-Work-Session.zip`: original consolidated r11 handoff, unchanged.
- `baseline/Metis-HeyClicky-Interaction-Upgrade.zip`: original static assessment and interaction plan, unchanged.
- `behavior-core/`: all ten original v3 modules, declarations, built JS, tests and examples, unchanged.
- `behavior/`, `delivery/`, `jev/`: full upgrade instructions and retained original IDs with current cross-references.
- `keyboard-notes/`: owner correction, requirements, added acceptance and preservation evidence.

All 66 original root tasks, 20 CXSTEP integration children, 10 JVSTEP JEV children and the r11 AGSTEP/OBU/HMSTEP expansions remain. The combined app-level interaction matrix now has 100 cases (previous 84 plus 16); all are NOT_RUN. Original r11 base/expansion and release gates are not replaced by that count.

## Checking the supplied candidate

From `behavior-core/`, `npm test` runs the included compiled candidate and explicit fixtures. With the compatible TypeScript compiler already installed, `npm run build` rebuilds it; `npm run test:jev` runs the JEV subset. These are not actual Métis/Electron/native hotkey or audio tests. No live vendor probe or production mutation is required for this suite.

The handoff is not a launcher or installer. Do not extract old baseline snapshots over current code or run the old fixed-16-file publisher after scope changes. Integrate through the authorized current checkout and preserve user data, native permissions, shortcut mappings and staged/unstaged work. Normal employees use Métis itself, never a coding CLI.

Full completion requires note-taking fidelity, actual global/voice shortcuts on both target platforms, real voice/actions/Intelligence, JEV/identity/privacy/usage qualification, independent review and the original release gates. No external keys, customer data or HeyClicky proprietary assets are included.
