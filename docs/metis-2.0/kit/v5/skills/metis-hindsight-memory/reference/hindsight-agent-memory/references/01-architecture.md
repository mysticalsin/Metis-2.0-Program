# 01 · Choose the right memory architecture

## The role of Hindsight

Hindsight provides retain (derive and store memories), recall (find relevant memory),
and reflect (reason over memory). Recall combines semantic, keyword, graph and temporal
retrieval. Banks organize separate memory stores. These are product capabilities, not
an authorization design or a replacement for the application's transactional database.
Sources: [Quickstart](https://hindsight.vectorize.io/developer/api/quickstart),
[Overview](https://hindsight.vectorize.io/),
[RAG vs memory](https://hindsight.vectorize.io/developer/rag-vs-hindsight).

Use memory when history should improve future behavior: durable preferences, project
constraints, verified decisions, recurring obstacles, resolved incidents and lessons.
Avoid retaining everything just because it is available. A one-off transformation,
current stock lookup or deterministic calculation may need no persistent memory.

## Four distinct layers

| Layer | Purpose | Authority |
|---|---|---|
| Application database / source systems | Current objects, grants, approvals, revision and state | Authoritative for the application |
| Workflow checkpoint / event log | Resume execution, avoid repeated side effects | Authoritative execution state |
| Hindsight memory | Retrieve useful past context and derived perspectives | Advisory; revalidate before use |
| Model context | Small, current evidence for one turn | Ephemeral; not a durable store |

A memory saying “invoice paid” does not prove payment. A remembered approval is not a
current approval token. A remembered test success is not a test result for a newer commit.
A conversation transcript is not automatically an approved business record.

## Minimum viable architecture

Keep the existing agent runner. Add one server-owned memory adapter and an allowlisted
recording point after successful source commits. Retrieve a small context before
relevant turns. Add an explicit disable switch and one integration test. Do not add a
message broker, graph database, microservice fleet or specialized orchestrator unless
an actual durability, throughput or ownership requirement demands it.

A single local owner can start with one bank. A multi-user app usually needs one bank
per authorization cohort (often a tenant/user/project combination) resolved by the
backend. A shared team bank is appropriate only when every reader may access every
item and synthesis in it. Querying several banks requires application orchestration;
apply authorization, deduplication and a common total budget before merging results.

## Choose the access route

Prefer the application's existing official SDK for Python or TypeScript. Use a small
HTTP adapter for other languages, strict transport control, or a workflow engine with
HTTP nodes. Use MCP when the agent host is built around MCP tool discovery. Reuse a
framework adapter when it preserves your isolation and capture rules. Do not install
all four routes; maintain one policy boundary and one clear owner.

Hindsight does not remove the need for RAG. Keep approved manuals, source documents,
policies and current code in their canonical retrieval systems. Use memory to find
previously relevant evidence and experience; resolve the latest document for precise
quotations or current policy. Graph traversal is part of Hindsight retrieval, not a
license to infer access across connected people or projects.

## Memory vocabulary

`world` is extracted information about people, objects and events; `experience` concerns
the bank agent's own activity. Speaker attribution matters, not merely the word “I.”
Neither label means independently verified. `observation` is an automatically derived
consolidation. A mental model is a curated/precomputed synthesis for repeated questions.
Knowledge pages organize generated knowledge hierarchically. Keep the distinction
between original source, extracted assertion and generated conclusion in your UI.
Sources: [Retain architecture](https://hindsight.vectorize.io/developer/retain),
[Observations](https://hindsight.vectorize.io/developer/observations),
[Mental models](https://hindsight.vectorize.io/developer/mental-models),
[Knowledge pages](https://hindsight.vectorize.io/developer/knowledge-pages).

## Done criteria

The design identifies a business outcome, memory owner, allowed sources, application
policy boundary, lifecycle owner and measurable advantage over memory-off behavior.
It explains why its deployment and bank granularity are sufficient without claiming
that a database, SDK or diagram alone makes an agent reliable.
