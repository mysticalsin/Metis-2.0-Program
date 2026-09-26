# Recipe · Chat, voice and desktop assistants


Authenticate the user in the application's existing backend/main process. Resolve the
user/project bank there; never send a service/provider key to the web frontend or desktop
renderer. Before the agent answers a relevant question, recall a small context and replace
stale extracted hints with current canonical evidence.

For voice, retain a reviewed complete turn or committed conversation checkpoint—not each
streaming transcript fragment. Attribute speakers; preserve transcription uncertainty.
Ask permission before storing recordings or sending audio to another provider. A voice
interface may let users say “remember this,” “correct that” and “forget that”; each maps
to an authenticated lifecycle operation rather than arbitrary model-supplied IDs.

Decouple the spoken response from slow memory projection when possible. The conversation
can continue while an outbox verifies ingestion; the UI should not say “learned” until
its required verification completes. Never record a cancelled desktop action as a success.

For shared meeting context, choose an explicit authorized project/cohort and keep private
user preferences separate. Promotion of a meeting lesson into organizational knowledge
needs a source/scope review. Hindsight is not the speech, wake-word or desktop-control
engine; integrate it behind those existing components.

Acceptance: separate users hear only their own facts, partially transcribed text is not
silently persisted, a source correction takes effect, and voice-driven deletion invalidates
related derived knowledge. Include latency and memory-off tests.
