# LESSON-004 — A preserved draft must not make an ARMED assistant deaf

A draft guard can prevent data loss while quietly breaking the next wake. In the first r6 interaction design, a nonempty preserved draft made the orb display ARMED but caused a new valid wake to be ignored.

Correct behavior: protect active typing/composition, but park a dormant draft separately when ARMED accepts a new wake. Do not append it to speech/provider input or replace it with a voice result. Restore it on deliberate typed entry/dismissal; apply the proper transient-data policy on lock/sign-out.

The current synthetic test verifies wake acceptance, empty voice composer, no draft text in caption, and exact restoration after Stop/dismiss/reopen. Native controller integration still needs its own evidence. The view must never own capture authority merely because this preview passes.
