# 13 · Configuration, model selection, language and performance

## Configuration discipline

Separate server environment (`HINDSIGHT_API_*`), control-plane settings, client
configuration and application policy. Never send a client maximum or an application
ACL field to the server as an invented configuration key. Inspect `/version`, supported
bank configuration and the actual installed SDK. Make one change at a time against a
small evaluation dataset and save the before/after result.
Source: [Configuration](https://hindsight.vectorize.io/developer/configuration).

The large upstream configuration reference is the source for exact supported names,
defaults and precedence. This package deliberately does not duplicate hundreds of
knobs or guess their availability. Older per-type worker `MAX_SLOTS` names can have
surprising reservation semantics; check the current `RESERVED_SLOTS` guidance. Likewise,
switching off scheduled consolidation does not prove queued jobs stopped executing.

## Model roles

Hindsight can involve extraction, embeddings, reranking, consolidation and reflection,
with potentially distinct models/providers. The application agent's model is another
choice. Select structured-output-capable extraction/reflection models and compatible
embedding/reranking options from the current official support matrix. Do not select a
provider merely because a demo uses it; examine privacy, region, quality, latency,
context limits, cost and team support constraints.
Source: [Models](https://hindsight.vectorize.io/developer/models).

A low-cost extraction model may be suitable for simple preferences but miss nuanced
project decisions. Test actual source formats, negations, names and uncertainty. A
stronger reflect model does not repair facts never extracted. Switching embedding
models/dimensions requires a planned re-embedding/index migration; changing an env var
alone does not establish compatibility with stored vectors.

## Missions

Use `templates/bank-config.example.json` as a small candidate configuration only after
checking schema and taking a config snapshot. Keep the extraction mission focused on
what to preserve, the observation mission focused on allowed synthesis, and the reflect
mission explicit about evidence and uncertainty. Do not overwrite an existing bank's
mission without reading and reconciling its purpose. Current config patch behavior
replaces values rather than appending text as older background helpers did.

Tuning personality dispositions is optional. It should not be used to “increase truth”
or bypass approval. A highly skeptical response may still be unsupported, and an
empathetic response may still reveal private data if scope is wrong.

## Multilingual memory

Separate source language, extraction/output language, embedding-language coverage and
response language. Preserve names, identifiers, units and source links across language
changes. A translated summary is a derivative, not the original source quote. Evaluate
French/English/Portuguese/Spanish or other actual project languages with cross-language
queries, diacritics, code-switching, date formats and negation.

Use a multilingual embedding/reranking configuration when required. Confirm the
specific provider/model supports it. Avoid duplicating every memory in every language
without evaluating whether cross-lingual retrieval already solves the need. Do not
assume a setting controlling generated language also changes the embedding model.
Source: [Multilingual](https://hindsight.vectorize.io/developer/multilingual).

## Tune the bottleneck actually observed

Measure retain input volume, facts per document, queue age, provider latency, recall
latency, reranking time, response payload size and derived refresh costs. Restrict
unneeded includes before enlarging output budgets. Batch related allowed writes when
useful; avoid re-ingesting whole unchanged corpora. More observation combinations and
more concurrent reflect calls can increase costs without improving answer quality.
Source: [Performance](https://hindsight.vectorize.io/developer/performance).

Do not claim advertised benchmark performance applies to your project. Run held-out
project evaluations, report the dataset/configuration and compare to memory-off. Use
budget caps and alerts enforced by infrastructure, not instructions embedded in memory.
