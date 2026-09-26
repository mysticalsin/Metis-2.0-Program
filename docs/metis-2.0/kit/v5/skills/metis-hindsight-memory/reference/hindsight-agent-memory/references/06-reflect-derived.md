# 06 · Reflect, observations, mental models and knowledge pages

## Choose deliberately

Use recall to supply facts to an existing agent. Use reflect when Hindsight's
memory-grounded reasoning adds value for a question. Use a mental model when the same
expensive synthesis is needed repeatedly. Use knowledge pages when users need an
organized, readable knowledge structure. These are optional layers, not requirements
for every chatbot or event workflow.
Sources: [Reflect API](https://hindsight.vectorize.io/developer/api/reflect),
[Reflect architecture](https://hindsight.vectorize.io/developer/reflect).

## Reflect safety and cost

Reflect runs a reasoning process over memories and can consult observations and mental
models. Its output is generated advice. Preserve evidence identifiers and distinguish
facts, interpretation, uncertainty and proposed next steps. A structured output schema
can make consumption easier, but schema-valid does not mean correct or authorized.
Validate the schema and the cited support separately.

Final-answer `max_tokens` is not a total execution/cost ceiling. Bound request duration,
concurrency, allowed tools, available evidence and provider spending independently.
Client timeout does not prove server/model cancellation. Avoid speculative repeated
reflect calls in a background loop. Use current supported tuning knobs only after
checking deployment schema; do not invent environment variable names.

Never expose unauthorized source data to the reflect model and then rely on filtering
the answer. For sensitive or recently revoked data, prefer the main application's
synthesis over already revalidated canonical evidence, or maintain a demonstrably current
authorization-homogeneous bank. Passing tags is not automatically proof that every
internal reflect tool and derived model obeys the same boundary; test that behavior.

## Observations

Observations consolidate facts asynchronously. Their mission and scope affect what
gets summarized. `combined`, `per_tag`, combinations and explicit tag-set scopes have
different breadth and cost. More combinations mean more derived work and potential
cohort crossover. Use the fewest explicit scopes justified by the use case; never let
a broader synthesis cross an authorization boundary.

Consolidation can update how contradictory information is represented while original
facts remain. This is useful history, not erasure or a canonical transaction. Keep
conflicts visible when evidence is insufficient. Validate links to source facts and
source freshness before high-stakes use. Disabling future scheduling alone may not stop
already queued consolidation. Source: [Observations](https://hindsight.vectorize.io/developer/observations).

## Mental models

A mental model is a named, precomputed reflection for a defined question. Define its
purpose, source scope, refresh policy, owner, expected structure and freshness condition.
Reads are inexpensive relative to building/refreshing, but stale models can give fast
wrong answers. Do not generate one per trivial question. Start with one useful recurring
question and measure whether refresh cost is lower than repeated reflect.

Examples: current approved project constraints, recurring support lessons within one
customer cohort, or a reviewed user's working preferences. Avoid “everything about
all employees” as a model definition. The model's source query is untrusted until
reviewed; it cannot redefine access. Cron/automatic/delta refresh capabilities must be
verified on the deployed version before use.
Sources: [Mental model architecture](https://hindsight.vectorize.io/developer/mental-models),
[Mental model API](https://hindsight.vectorize.io/developer/api/mental-models).

## Knowledge pages

Knowledge pages organize generated knowledge in folders/pages and can build in the
background. Creation is not immediate completion. Check the returned operation and
actual content before presenting a finished page. A page's description/source query,
tags and linked mental model form part of its derivation contract.

**Deletion caveat:** the current knowledge-page API guide states that `is_stale` detects
newly written memories since the last read, but not deletions. A page can still report
up-to-date while citing deleted memory. Use an application invalidation epoch or
explicit rebuild/quarantine after correction, deletion or revocation. Native stale
flags are helpful signals, not an erasure guarantee.
Source: [Knowledge pages API](https://hindsight.vectorize.io/developer/api/knowledge-pages).

## Missions and dispositions

Separate `retain_mission`, `observations_mission` and `reflect_mission`. They answer
what to extract, what to consolidate and how to reason, respectively. A narrow
mission saves irrelevant processing but is not a substitute for source filtering.
Dispositions such as skepticism, literalism and empathy steer style/interpretation;
they are not confidence calibration or security settings. Current APIs favor bank
configuration rather than removed profile/background endpoints.
Source: [Bank configuration](https://hindsight.vectorize.io/developer/api/memory-banks).

## Avoid self-confirming memory

Do not feed generated reflections straight back as verified outcomes. A hypothesis
must remain labeled as a hypothesis until external evidence confirms it. Record the
actual user decision or verified tool result after execution, not the agent's plan.
Derived content promoted into a shared bank requires a separate review and source trail.

## Bank-wide directives and templates

The current generated reflect schema states that untagged directives remain global
in every tag-match mode. Strict recall/reflect tags therefore do not remove bank-wide
instructions. Only trusted administrators should create or change directives; inspect
them before sharing or importing a bank. A global directive is appropriate only when
it is approved for every authorized reader in that bank. Do not let recalled content
promote itself into a directive. Source: [HTTP API](https://hindsight.vectorize.io/api-reference).

Bank templates can standardize approved configuration for a purpose. Read the current
template schema and supported instantiation behavior before using a template, review
its missions/scopes/provider-dependent options, and retain a version identifier. A
template is not a deployment credential or an authorization policy by itself. Avoid
applying a new template to existing banks without an explicit migration/diff review.
Source: [Bank templates](https://hindsight.vectorize.io/developer/api/bank-templates).

Current retain documentation additionally describes a `shared` observation scope that
consolidates into an untagged global scope. Do not use it to merge users whose data is
not mutually authorized. The documentation also contains simplified statements about
untagged visibility that should not substitute for strict-filter and derived-scope
behavioral tests. Source: [Retain](https://hindsight.vectorize.io/developer/api/retain).
