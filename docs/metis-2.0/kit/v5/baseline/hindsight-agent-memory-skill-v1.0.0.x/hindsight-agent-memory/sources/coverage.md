# Documentation coverage and provenance

**Review date: September 25, 2026.** This is an implementation-oriented synthesis, not
a claim that every line of every online page was read or that every documented feature
was executed. The generated HTTP reference and configuration/model tables are large;
implementation-critical sections were inspected selectively. Native capabilities and
application recommendations are intentionally distinguished in the guides.

The requested `/developer/` landing path returned 404. The actual topic pages were
available through official navigation. The API directory was also checked through the
official repository and listed 13 API documentation files, including Main Methods.
A developer-directory listing was truncated; no complete recursive repository audit
is claimed. The repository skill and license were read in full.

## 47 source references

`topic_review`: page opened and relevant topic information reviewed; not a full-file guarantee.
`targeted_sections_verified`: specific behavior/signatures/settings checked on the page.
`full_file_read`: complete returned repository file inspected. No category means native-tested.

| ID | Source | Review scope |
|---|---|---|
| S01 | [Overview](https://hindsight.vectorize.io/) | topic_review |
| S02 | [Retain architecture](https://hindsight.vectorize.io/developer/retain) | topic_review |
| S03 | [Retrieval architecture](https://hindsight.vectorize.io/developer/retrieval) | topic_review |
| S04 | [Reflect architecture](https://hindsight.vectorize.io/developer/reflect) | topic_review |
| S05 | [Observations](https://hindsight.vectorize.io/developer/observations) | topic_review |
| S06 | [Mental models](https://hindsight.vectorize.io/developer/mental-models) | topic_review |
| S07 | [Knowledge pages](https://hindsight.vectorize.io/developer/knowledge-pages) | topic_review |
| S08 | [Multilingual](https://hindsight.vectorize.io/developer/multilingual) | topic_review |
| S09 | [Performance](https://hindsight.vectorize.io/developer/performance) | topic_review |
| S10 | [Storage](https://hindsight.vectorize.io/developer/storage) | topic_review |
| S11 | [RAG versus memory](https://hindsight.vectorize.io/developer/rag-vs-hindsight) | topic_review |
| S12 | [Installation](https://hindsight.vectorize.io/developer/installation) | topic_review |
| S13 | [Services](https://hindsight.vectorize.io/developer/services) | topic_review |
| S14 | [Configuration](https://hindsight.vectorize.io/developer/configuration) | targeted_sections_verified |
| S15 | [Extensions](https://hindsight.vectorize.io/developer/extensions) | topic_review |
| S16 | [MCP server](https://hindsight.vectorize.io/developer/mcp-server) | topic_review |
| S17 | [Development](https://hindsight.vectorize.io/developer/development) | topic_review |
| S18 | [Administrator CLI](https://hindsight.vectorize.io/developer/admin-cli) | topic_review |
| S19 | [Oracle database](https://hindsight.vectorize.io/developer/oracle) | topic_review |
| S20 | [Model/provider configuration](https://hindsight.vectorize.io/developer/models) | targeted_sections_verified |
| S21 | [Monitoring](https://hindsight.vectorize.io/developer/monitoring) | topic_review |
| S22 | [Memory Defense](https://hindsight.vectorize.io/developer/memory-defense) | targeted_sections_verified |
| S23 | [Quickstart](https://hindsight.vectorize.io/developer/api/quickstart) | topic_review |
| S24 | [Main methods](https://hindsight.vectorize.io/developer/api/main-methods) | topic_review |
| S25 | [Retain API](https://hindsight.vectorize.io/developer/api/retain) | targeted_sections_verified |
| S26 | [Recall API](https://hindsight.vectorize.io/developer/api/recall) | targeted_sections_verified |
| S27 | [Reflect API](https://hindsight.vectorize.io/developer/api/reflect) | targeted_sections_verified |
| S28 | [Mental models API](https://hindsight.vectorize.io/developer/api/mental-models) | targeted_sections_verified |
| S29 | [Knowledge pages API](https://hindsight.vectorize.io/developer/api/knowledge-pages) | targeted_sections_verified |
| S30 | [Memories API](https://hindsight.vectorize.io/developer/api/memories) | targeted_sections_verified |
| S31 | [Memory banks API](https://hindsight.vectorize.io/developer/api/memory-banks) | targeted_sections_verified |
| S32 | [Documents API](https://hindsight.vectorize.io/developer/api/documents) | targeted_sections_verified |
| S33 | [Operations API](https://hindsight.vectorize.io/developer/api/operations) | targeted_sections_verified |
| S34 | [Webhooks API](https://hindsight.vectorize.io/developer/api/webhooks) | topic_review |
| S35 | [Bank templates API](https://hindsight.vectorize.io/developer/api/bank-templates) | topic_review |
| S36 | [Best practices](https://hindsight.vectorize.io/best-practices) | targeted_sections_verified |
| S37 | [FAQ](https://hindsight.vectorize.io/faq) | topic_review |
| S38 | [Generated HTTP API reference](https://hindsight.vectorize.io/api-reference) | targeted_sections_verified |
| S39 | [Python SDK](https://hindsight.vectorize.io/sdks/python) | targeted_sections_verified |
| S40 | [TypeScript/JavaScript SDK](https://hindsight.vectorize.io/sdks/nodejs) | targeted_sections_verified |
| S41 | [Python embedded deployment](https://hindsight.vectorize.io/sdks/hindsight-all) | targeted_sections_verified |
| S42 | [Node embedded deployment](https://hindsight.vectorize.io/sdks/hindsight-all-npm) | targeted_sections_verified |
| S43 | [LangGraph / LangChain](https://hindsight.vectorize.io/sdks/integrations/langgraph) | targeted_sections_verified |
| S44 | [Vercel AI SDK](https://hindsight.vectorize.io/sdks/integrations/ai-sdk) | targeted_sections_verified |
| S45 | [Coding agents](https://hindsight.vectorize.io/sdks/integrations/coding-agents) | targeted_sections_verified |
| S46 | [Official hindsight-docs skill](https://github.com/vectorize-io/hindsight/blob/main/skills/hindsight-docs/SKILL.md) | full_file_read |
| S47 | [Official repository license](https://github.com/vectorize-io/hindsight/blob/main/LICENSE) | full_file_read |

## Evidence that stays project-specific

Server release and feature flags; SDK/framework runtime; provider data handling;
bank authorization; idempotency behavior; quality/latency/cost; deletion of derived
artifacts; backup restoration; cloud/Oracle/PostgreSQL feature parity. These must be
verified on the deployment receiving the skill. The manifest includes date, scope and
limitations so an implementation agent can refresh only the sources it needs.

## Re-review before changing versions

Read the actual deployment version and capture its schema. Inspect changed operation,
configuration and integration pages. Update compatibility notes; rerun local and native
behavioral tests. Do not automatically replace security decisions with newer tutorial
examples or silently broaden allowed data capture.
