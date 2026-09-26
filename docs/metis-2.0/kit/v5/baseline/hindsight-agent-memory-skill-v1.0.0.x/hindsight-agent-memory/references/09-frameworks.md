# 09 · Framework adapters without replacing the application

## Common integration rule

Keep framework checkpoints and business state where they already live. Hindsight adds
long-term memory; it is not an execution checkpoint substitute. Create memory tools or
nodes per authorized request/cohort, with identity, budget and capture policy closed
over by the backend. Review what an integration captures automatically before enabling it.
Never assume an example's hardcoded user ID or incoming JSON `userId` is authenticated.

## LangGraph / LangChain

The official integration documents `create_hindsight_tools`, recall/retain nodes, and
`HindsightStore`. A graph can recall before the agent and retain after it; a store can
provide cross-thread search while a separate checkpointer handles execution state.
Dynamic bank resolution from `RunnableConfig` is convenient only when that config is
populated by trusted backend identity logic, not directly from the request body.

The documented recall node injects memories as a `SystemMessage`, and the retain node
can capture human/AI messages. Review or wrap this behavior: retrieved text must remain
untrusted evidence and retention must be source-allowlisted. Do not silently turn every
assistant hallucination into durable experience. The store's namespace-to-bank mapping
also needs collision and ownership review. Agent state must not mutate the bank resolver.
Source: [LangGraph / LangChain](https://hindsight.vectorize.io/sdks/integrations/langgraph).

## Vercel AI SDK

The documented `createHindsightTools` constructor fixes a bank at tool creation and
separates semantic model inputs from infrastructure options. That is useful, but your
server must authenticate the principal before selecting that bank. Do not copy a demo
that accepts user identity directly from `req.json()` into a production route.

Pin the `ai` and Hindsight integration versions together. Current documentation contains
examples from different AI SDK loop/streaming APIs; use the types actually installed.
Bound agent steps and model expenditure; a memory tool's response size limit does not
bound a whole agent loop. Decide whether direct `getDocument`/mental-model tools belong
in the runtime allowlist and revalidate their resource scope, not just recall results.
Source: [Vercel AI SDK](https://hindsight.vectorize.io/sdks/integrations/ai-sdk).

## Other frameworks and custom agents

For CrewAI, other tool-based frameworks, provider agent SDKs, or a custom runner, use
one adapter tool with a narrow schema and a server-owned scope. Read the specific
current official integration before inventing package names or decorators. The portable
fallback is documented HTTP, not a claimed native connector for every platform.

A recommended tool schema exposes `query` and, only when policy allows, a candidate
fact to review. The tool implementation—not the model—chooses bank, credentials,
required tags, source validation, maximum results, timeout and reflect permission.
A proposed memory write may require human confirmation for sensitive or shared records.

## Low-code / automation engines

Use a secret-backed HTTP node or your existing backend endpoint. Authenticate the
webhook/event, resolve its owning user/project, load the committed canonical record,
retain with a stable source ID, track async operations, and mark the projection result.
The workflow engine's retries must not generate a new document ID or operation UUID
every attempt. Scope may not come from an untrusted event payload without validation.

## Desktop and voice

Keep access/provider keys and memory policy in a trusted main process/backend. Voice
transcripts are candidate source data: apply consent, speaker attribution and transcription
quality checks. Do not retain every partial transcript. Voice interaction and desktop
control remain the application's responsibilities; Hindsight supplies memory, not a
voice model, permissions framework or computer-use executor.

## Required project proof

Show where authenticated identity becomes bank scope, where current source evidence is
checked, which hook records only committed results, how memory is disabled, and how
tests exercise a new session. A framework adapter is adopted only when those seams
remain correct. Otherwise wrap or replace that adapter alone, not the entire framework.
