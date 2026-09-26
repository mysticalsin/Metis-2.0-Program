# Required combined meeting experience (v4 owner correction)

These are desired behaviors, not recordings of implemented functionality.

**During an authorized meeting:** Métis records the permitted meeting evidence and takes notes. Tony uses the configured global shortcut while another app is focused. The same meeting context opens; no new recording session starts.

**Tony types:** “What have we agreed so far?” Métis uses the current permitted meeting evidence and shows a source-backed answer, with incomplete coverage stated. It does not add its own answer as somebody's spoken words in the transcript.

**Tony explicitly invokes the command-voice shortcut in a qualified private test setup:** “Create a follow-up draft from those action items.” Métis handles the authorized task, uses JEV only where a qualified bounded decision is helpful, and verifies the real draft. Drafting is not sending. During an actual call, prefer typed input and text responses; the shortcut does not mute the call.

**Tony toggles Métis away:** the meeting continues. Ending the assistant command stops its command subscription, not the shared audio owner. Already running authorized work is shown by a truthful task indicator; unfinished utterances are not silently submitted on dismiss.

**At the end:** Tony uses the meeting end control. The final notes, summary, decisions, action items and linked draft are distinct, preserved and available in the existing history/Intelligence surfaces. JEV failure cannot independently erase them.

The following earlier journeys remain valid, with keyboard invocation added wherever they previously said to click. They are assistant subjourneys, not a replacement for the meeting product.

---
# Behavioral examples and failure counterexamples

These are specification examples, not recordings of a working Métis build.

## A. Click → speak → real note → spoken verification

**User:** clicks the Métis mic, then says “Create a note called Friday plan, add the three points I’m about to give you, and read it back.”

**Métis:** Listening is based on real capture ownership. Transcript preserves the actual words and title. It asks only for the missing points, not for the title again. After the final points and stable intent, it scopes the target app/document and produces the bounded operation plan.

**Métis while dispatched:** “I’m creating Friday plan.” The activity representation matches the route: actual pointer actions if foreground input is necessary, or a background task card if semantic operations suffice.

**Verifier:** reads the saved target and compares title, all three points and their order against the approved intent.

**Métis after verification:** “Friday plan is saved. It contains…” The actual result can be opened from the same card.

**Forbidden substitute:** a pre-recorded click animation, a hard-coded `hello` note, or “Done” immediately after `open -a Notes` succeeds.

## B. A question while work continues

**User:** “How’s it going?” while an authorized research/document task is running.

**Métis:** yields the speech floor, resolves the selected task, and replies “I’ve verified two sources. The draft is still being assembled.” Only state actually in the task ledger is mentioned. The worker keeps its scope and does not restart.

**Forbidden substitute:** treating every speech onset as global task cancellation, producing a made-up percentage, or “I’ll continue in the background” after the task process has actually exited.

## C. Show me first, then do it

**User:** “Show me where to change the language.”

**Métis:** highlights the live control and explains. No clicks occur.

**User:** “Do it.”

**Métis:** when exactly one current proposal and intended value are resolved, creates the Do grant, rechecks the control and performs/reads back the change. If the language value is missing, it asks “Which language?” once. If two proposals exist, it asks which one.

**Forbidden substitute:** a guide overlay becoming an implicit permanent computer-control grant.

## D. A correction before dispatch

**User:** “Send the report to… actually don’t send it; just draft it.”

**Métis:** speculative work may resolve read-only context. It never sends from the partial. The corrected stable intent creates only a draft; final speech says “Draft ready. Nothing was sent.”

**Forbidden substitute:** detecting the word “send” early and committing before the negation reaches the model.

## E. A correction after possible effect

**User:** “Wait—use the other document.” while a save response is pending.

**Métis:** revokes old dispatch, stops superseded speech, records the first write as uncertain until readback, and does not immediately create a second copy under a new ID. It resolves the requested new target separately.

**Métis:** “I stopped further work on the first document. I’m checking whether that save completed before continuing.” Only say “checking” while a real reconciliation read is authorized and active; otherwise report that checking is blocked.

**Forbidden substitute:** claiming rollback, duplicating the save, or hiding an uncertain first effect.

## F. Dictation is text, not a task

**User:** selects a message field and dictates “Please send the invoice tomorrow.”

**Métis:** inserts those words into that field. It does not interpret the sentence as a command to schedule a send or press Enter. If focus changes, it pauses instead of putting private text into the newly focused app.

**Optional rewrite:** only after explicit user intent. Preserve the original separately for review within retention policy.

## G. Stop speech versus stop all

**User:** “Stop talking.”

**Métis:** flushes audio and cancels the old synthesis. It does not replay the already-completed action to generate another spoken answer.

**User:** “Stop everything.”

**Métis:** locally invalidates all active command/physical-input generations immediately, cancels workers and reports remote acknowledgments separately. It never says that stopping reversed already-committed effects.

## H. Physical takeover

**User:** moves the mouse while Métis is controlling a foreground task.

**Métis:** yields input and drains/fences queued native events. The old agent cannot resume from stale coordinates. Another agent waits until quiescence is acknowledged. Background tasks that do not require the occupied resource can continue under their own valid grants.

**Forbidden substitute:** chasing the pointer, immediately forcing focus back, or transferring the lease while old queued clicks can still execute.

## I. Three-step job with partial completion

**User:** “Create the summary, save it in the approved project, and draft a follow-up email.”

**Result:** summary and save verified; the email connector is unavailable.

**Métis:** “The summary is saved. I couldn’t create the email draft because the connector is unavailable.” Shows the real saved artifact and a focused connector recovery action. No claim of overall Done; no regeneration of the saved summary on recovery.

## J. Language and voice preference

**User:** “Less talking, and answer in French.”

**Métis:** updates the explicit scoped output preferences and acknowledges briefly in French. Ongoing task execution is not repeated. Input captions still represent the actual original words. Proper names, figures and accented text survive the command path.

## K. Privacy at an output-device change

A private spoken result is queued for the user when headphones disconnect.

**Métis:** flushes the pending private audio; rechecks audience/output before speaking. The result remains available in its authorized private card where permitted. It does not play the queued result on room speakers merely because a new audio device exists.

## L. Memory with a visible source

**User:** “Remember that I prefer summaries in French.”

**Métis:** retains the explicit preference through the canonical governed route, confirms only after a durable eligible acknowledgment, and exposes why-used/source/correct/forget in existing Intelligence. If retention is pending, it says pending—not remembered.

Later “Forget that preference” immediately blocks its future use, starts required derivative deletion/reconciliation, and reports durable deletion separately. An in-flight old recall cannot resurrect it. Memory never grants app permissions or restores an expired approval.
