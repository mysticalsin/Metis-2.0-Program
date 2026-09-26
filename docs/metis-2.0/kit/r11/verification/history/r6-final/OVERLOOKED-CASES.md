# r6 — overlooked cases and precise disposition

This is a change-level audit, not another entire-product security review. All root product requirements remain.

| Case | Kit change / test | Actual application obligation |
|---|---|---|
| The idle pill still paints a backplate/glow | Separate orb button; inactive bar is hidden. State map and browser checks verify absence. | Render the real ThinkingOrb-only compact branch in each native UI. |
| An invisible 650px window still blocks clicks | Demo stack shrinks to 72px and does not intercept surrounding DOM hits. | Main/AppKit/Win32 hit regions must be tested over another real application. CSS is not proof. |
| Hover/focus starts capture | Native button click/Enter/Space opens typing only; hover/focus remains ARMED. | Local wake broker is the only authorized voice activation path. |
| A fresh install silently enables wake | Preview default ARMED is explicitly synthetic. Product opt-in remains OFF by default. | Enforce actual preference/permission migration independently. |
| Typed mode silently rearms a disabled mic | Separate wakeEnabled state; OFF → typing → dismissal never returns to ARMED. | Keep capture permissions, surface mode, readiness and meetings independent. |
| Duplicate/stale wake resets a command | Generation-bound, bounded-ID synthetic wake checks; busy/composing/locked cases rejected. | Validate authenticated local capture owner and current native lifecycle before dispatch. |
| A hidden saved draft makes ARMED silently ignore wake | Park and restore the draft; valid wake still opens capture, and draft text never enters the voice caption. | Keep active composition protected and never upload unrelated dormant draft content. |
| Wake moves focus after keyboard use of the orb | Passive render no longer invokes focus; deliberate typed activation is the only focus transfer. | Qualify real native focus behavior and app-directed focus changes independently. |
| Double approval dispatches twice | Repeated preview handler rejected after state transition; callback reference includes session/generation/revision. | Trusted executor validates exact target and approval and reconciles ambiguous side effects. |
| Enter submits while approval is pending | Busy/approval/capturing composer is read-only and submission is guarded. | Preserve controller checks even if UI controls are forged. |
| Escape breaks Japanese/French IME composition | Composition Escape and Enter are separately tested. | Native IME and screen-reader tests remain required. |
| Escape from Settings cancels another workflow | Handler scoped to the actual command surface. | The configured native global Stop is a different mechanism. |
| Lock hides UI but delayed work continues | Simulated lock clears timeline/generation and hides transient content. | Actual local authority revocation and remote acknowledgment remain distinct. |
| Hidden UI still burns animation cycles | ARMED static by default; paused/hidden view clocks are stopped; pose retained. | Profile actual libraries and all native helper/GPU processes. |
| Graphics failure creates an invisible launcher | Local embedded static mesh fallback; typing still works with null Canvas context. | Qualify real native/component failure handling. |
| Right-edge margins clip the mesh | Remove negative compact offsets; 390px bounds and 320px layout exercised. | Real mixed-DPI, Dock/taskbar, monitor disconnect and focus-outline bounds need native runs. |
| Minimalism hides capture or unknown outcomes | OFF/readiness/result views separate; no automatic approval/error dismissal; independent OS/meeting indicators protected by contract. | Never remove privacy indicators to satisfy orb-only styling. |
| Stale documentation contradicts new visuals | MASTER, task files, HTML/PDF, state map, launcher and adapters synchronized; stable IDs preserved. | Reconcile actual repository decisions before implementation. |
| Appending new references reuses an existing ID | Reference uniqueness/parity check added; existing TypeSafe R77 kept, new UI/W3C entries are R78/R79. | Keep source and evidence IDs stable across updates. |
| Test assumes mouse focus implies keyboard focus ring | High-contrast test explicitly enters keyboard modality before requiring focus-visible. | Follow actual accessible focus semantics; do not force a permanent decorative ring. |

The source/model/privacy/Teams/Entra/signing constraints have not been weakened. Native, cloud, legal and rollout blockers remain genuine blockers and are not cleared by this table.
