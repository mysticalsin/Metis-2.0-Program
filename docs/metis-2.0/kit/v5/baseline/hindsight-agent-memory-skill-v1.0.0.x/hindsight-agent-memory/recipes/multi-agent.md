# Recipe · Several agents with explicit shared memory


Give each agent an execution role and authorized evidence scope. Do not give every agent
a shared administrative Hindsight key merely because they collaborate. Private user
memory, project memory and reviewed organizational lessons are distinct scopes.

A planner may recall project constraints; a researcher may access approved sources; an
executor records verified outcomes after tool completion. The reviewer decides whether
a lesson is accurate and suitable for shared publication. A handoff message is task
context, not automatic permission to read the sender's entire bank.

Do not let agents repeatedly retain each other's generated summaries as independent
facts. Record source/operation IDs, revision and verified result once; derived conclusions
remain explicitly labeled. Duplicate orchestration should not multiply memory writes.

A shared mental model can be useful for a stable, authorization-homogeneous project.
Keep its refresh ownership and deletion invalidation explicit. Fan-out to multiple
banks must remain backend-authorized and share one total budget; do not allocate a full
context window independently to every agent and concatenate the results.

Acceptance: a lower-privilege agent cannot obtain another agent's restricted source,
a remembered approval does not authorize execution, duplicate handoffs do not duplicate
learning, and every claimed completion has real execution evidence.
