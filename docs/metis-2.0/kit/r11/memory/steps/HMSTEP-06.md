# HMSTEP-06 · Implement bounded recall with lineage

Root ownership: TASK-037, TASK-038.

Prerequisites: HMSTEP-05.

Gates: HM-03, HM-06, HM-12.

## Execute

Resolve nonempty trusted scope before recall; use strict tags and facts-only profile first. Resolve memory IDs to canonical sources with current revisions/ACLs before returning context. Preserve human names/negation and enforce hard date filters outside ranking hints.

## Evidence before closure

Authorized source packets, revoked/untagged/fuzzy-scope rejection and measured low-budget queries.

**Product NOT_STARTED / NOT_TESTED** in this handoff. Read MASTER §35 and memory/BINDINGS.md. All root task dependencies and release gates remain.
