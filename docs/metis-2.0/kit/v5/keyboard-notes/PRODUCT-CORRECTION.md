# Métis remains the note-taker — keyboard-first assistance adds more

**Owner correction · 25 September 2026 · v4. Product requirements, not installed behavior.**

## The product, stated correctly

**Métis = note-taking and meeting intelligence + keyboard-accessible assistance + verified voice/computer actions.**

HeyClicky supplies an interaction reference. It does not become the product identity, a replacement meeting engine, a second app, or a prerequisite for taking notes. JEV remains deeply integrated as a decision provider; it does not become an always-on command listener for meetings. Hindsight remains governed continuity; it does not absorb all captured audio or transcript by default.

The corrected everyday flow is:

> Start an explicitly authorized meeting → Métis takes notes → press the Métis shortcut → ask, guide or act → dismiss Métis → note-taking continues → finish the meeting → review its real summary and actions.

Outside meetings, the same keyboard-accessible assistant works on permitted independent tasks. An active meeting is not required to use it. The mouse, accessible buttons, typed input and separately opted-in wake remain alternatives; clicking is not the sole or required entry.

This correction supersedes click-first or computer-agent-only descriptions in earlier handoffs. It does not erase the preserved r11 specification, original tasks, JEV work or previously stronger security/behavior requirements. Existing code and native settings must first establish today's shortcuts and behavior. No particular key combination has been newly mandated or proven available here.

## 1. Preserve the existing note-taker, not just a note-creation demo

Before changing command control, capture the actual baseline of the note-taking product: opt-in meeting capture and supported imports; faithful incremental/final transcript; supported speaker and timestamp handling; live/manual notes; summaries, decisions and action items; existing meeting/persona modes and assistance; history, search/Intelligence, exports and authorized sync. Preserve current encrypted/local data, selected folders, explicit offline choices, permissions and approved organizational storage.

This is an inventory and non-regression obligation, not a claim that every listed capability is implemented or passing today. Mark actual gaps honestly. Do not remove supported functionality merely because the new assistant offers another way to create a text file.

A task that creates a Notes document and a meeting that produces a transcript are different records. Neither may overwrite the other. A failed action does not invalidate captured meeting evidence; an unavailable decision model must not prevent saving an already captured note.

## 2. Keyboard controls are first-class

| Operation | Required behavior | Meeting consequence |
|---|---|---|
| **Toggle Métis** | Existing configurable global shortcut: show/focus the current surface, then dismiss on a second distinct press. Restore the same context. | None: no implicit start, pause, stop, finalization or new meeting. |
| **Talk to Métis** | Separately configurable keyboard action for explicit command-voice capture; press-on/press-off, not mandatory hold-to-talk. Same behavior is reachable through the visible mic. | Existing meeting consumer continues if separately authorized. |
| **Meeting record/pause/end** | Preserve dedicated current UI and keyboard controls, actual consent and state feedback. | Only the specifically requested meeting operation. |
| **Stop speaking / stop assistant task** | Stop the selected speech or task scope, using local existing controllers. Do not route local emergency controls through JEV. | No implicit end of note-taking. |
| **Stop all capture** | Stop microphone, system-audio, command and wake consumers; revoke pending command authority. | Recording is stopped, with actual acknowledgment and buffered-data finalization governed by existing policy. |

These are distinct operations, not a requirement to memorize five new chords. Keep the current registered accelerators and user remappings. Where a shortcut is absent, expose it in Settings and onboarding; select a platform-appropriate default only after inspecting current conflicts and obtaining the product decision. Do not silently replace an established show/hide shortcut with always-on voice.

The visibility-only toggle never starts a microphone. The command toggle, after explicit consent and permitted scope, can reveal the assistant and request the command subscription. Show **Starting** until the real audio owner confirms capture; show **Listening** only while that subscription is actually active. A second press while startup is pending cancels it, and a late acknowledgment cannot revive it.

Ending command capture with the dedicated command toggle can finalize that explicitly requested utterance through the existing stable-input pipeline. Dismissing or cancelling the surface must not submit an incomplete utterance. Default dismiss behavior ends any active command-only capture and invalidates its unfinished interpretation; it does not cancel an already dispatched, independently authorized task. Keep a truthful task/recording indicator and reachable Stop. Thus hiding means neither 'all work stopped' nor 'all microphones off.'

A command-off control also disables wake for that scope, as required by r11. A visibility-only reopen does not re-enable wake. Closing/stopping a meeting must not secretly leave a full cloud command stream running; make remaining capture visible and explicitly authorized, or end it. Do not use a single global listening boolean for all of these states.

## 3. Hotkey implementation requirements

Bind current main/native shortcut registration to the existing window/command reducers. Do not build another keyboard service or another authority framework. For Electron, verify registration success in main after readiness and report actual conflicts; do not display Ready because a settings string was saved. Electron documents that an occupied global shortcut can fail to register. [KREF-01]

Safe rebinding keeps the old binding until replacement is successfully registered, or explicitly rolls back if the platform requires a temporary swap. Only persist successful effective configuration. Never unregister all global shortcuts just to replace the assistant binding: existing meeting and emergency controls must survive. Track registered versus configured versus suspended/unavailable states.

Process one distinct press cycle, suppress key-repeat/double-dispatch from overlapping global and renderer paths, and test the actual backend. A focused renderer key listener is not a global shortcut implementation. A global accelerator callback alone does not supply a universal key-release stream or secure speaker identity. Use the installed platform's qualified mechanism; do not invent native callback fields or add broad keystroke logging.

Qualify Mac and Windows separately: foreground and background invocation, typing in another app, keyboard layout/language, IME composition, accessibility, fullscreen, multiple displays, sleep/wake, permissions and shortcut conflicts. Restore focus to the intended existing target without closing files, losing drafts or injecting text. Avoid capturing ordinary Escape globally; preserve composition/OS controls and the separately configured emergency chord. [KREF-02]

## 4. Simultaneous note-taking and assistance

Use the one real audio broker with separate granted consumers. A keyboard-invoked command obtains only its explicit interval and permitted tracks. It cannot promote the whole meeting stream to command input or send the entire meeting to JEV. Broker generations, segment revisions and consumer ownership must survive show/hide, task completion, command Stop and device changes.

Meeting participants saying 'open', 'send', 'yes' or the wake phrase must not issue or confirm desktop actions. A hotkey demonstrates a local gesture, not whose voice is now audible. Where trusted separation cannot be established, keep note-taking running and require typed input or appropriate confirmation; do not guess.

Keep private command text, task status and generated response text separate from canonical meeting transcript. Implement the declared routing policy for the command microphone interval without suppressing other participants or silently deleting genuine meeting evidence. Mark any actual gap/uncertain coverage rather than inventing continuity. Source audio that is already mixed cannot be magically separated by assigning labels.

The microphone command may still be audible to other people through the calling app or the physical room. Do not claim that using Métis privately mutes Teams or hides speech from participants. During a call the safe default is keyboard/typed input and text-only responses. Spoken responses require the existing explicit audience/private-output qualification and actual echo handling; headphones alone do not prove privacy.

Meeting controls, assistant controls and actual device indicators remain visibly distinct. 'Assistant mic off — meeting recording continues' is valid when true. 'Microphone off' is false while any actual consumer continues.

## 5. Keep JEV fully connected, but away from recording authority

The complete v3 JEV candidate, route/qualification work, central key, actual selected-proposal consumer and Intelligence roles are retained unchanged. JEV can resolve an ambiguous permitted task target, recommend an eligible skill or annotate approved knowledge. It cannot own recording start/stop, turn meeting statements into commands, declare a transcript complete, or approve a write.

Disabling JEV or losing its service must not independently stop recording, discard buffered transcript, stop saving notes or block meeting controls. Diagnose actual speech outages separately; this is not a promise that cloud transcription works when its own route is unavailable. JEV calls and action runtimes are separately bounded and lower priority than essential capture/segment persistence on a constrained device.

Questions such as 'What decisions have we made so far?' read the permitted current meeting context, state incomplete coverage honestly, and use the existing generative/source-backed response path. JEV may contribute a qualified bounded assessment but does not replace summaries or become mandatory for every query. Action items extracted from meeting evidence remain recorded suggestions until a distinct authorized command requests execution.

## 6. The acceptance milestone that must replace an action-only demo

Use an isolated development profile and a synthetic, consented meeting fixture in the actual app:

1. Start the normal note-taking workflow. Record actual initial meeting/session IDs, segment and source lineage, settings and runtime/artifact identity.
2. While another application is focused, toggle Métis on and off repeatedly. Continue speaking known timestamped fixture sentences. Confirm actual capture/segment continuity, not only a green recording badge.
3. Invoke a keyboard-accessible private question about the current meeting. Prefer text during call tests. Confirm source-backed response and separation from canonical notes.
4. Explicitly use the command voice toggle in an authorized test setup; perform a harmless arbitrary-content action with real readback. Show Guide without input and an interrupted task that cannot keep clicking.
5. Disable/fail JEV and repeat visibility, note-taking and saving. Existing core functions remain usable; unavailable decision tasks are reported accurately.
6. Dismiss the assistant, finish the meeting through the meeting control, reopen the result, and compare expected transcript, notes, decisions, action items, history and authorized export/sync to the baseline.

Measure gaps, missing/reordered/duplicated segments, capture duration, persistence and summary critical facts; use the actual existing fidelity and performance budgets. Do not label all transcript text 'verified' just because a synthetic helper returns success.

## 7. Delivery scope

This v4 package corrects product intent, host-integration instructions and acceptance requirements. **It introduces no new runtime controller and no application code patch.** The v3 candidate source, compiled files, tests and preserved baseline ZIPs remain byte-identical. Their preserved and rerun checks are not proof of actual keyboard/recording integration.

All new NKAC cases start NOT_RUN. The installed app, repository, native shortcuts, audio broker, live services, independent review and signing remain unverified here. Integrate these requirements into existing controllers and tests; preserve the full original release gates.
