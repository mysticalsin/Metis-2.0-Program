# Primary documentation checked on 25 September 2026

These checks support integration decisions; none establishes the version deployed for Métis.
No complete recursive code audit is claimed. The original skill's source register is
preserved separately and is not relabeled as today's full audit.

- HS-01: https://hindsight.vectorize.io/developer/api/retain — document grouping/replacement,
  ingest semantics; its source-storage prose conflicts with the Documents guide.
- HS-02: https://hindsight.vectorize.io/developer/api/recall — nonempty strict filters,
  empty-filter behavior, fact-text versus full-envelope budgets, query and temporal limits.
- HS-03: https://hindsight.vectorize.io/developer/api/documents — original text/chunk storage,
  source retrieval, replacement and document-level deletion.
- HS-04: https://hindsight.vectorize.io/developer/api/knowledge-pages — scope-based staleness,
  asynchronous derived-page lifecycle and underlying evidence. No erasure certificate.
- HS-05: https://hindsight.vectorize.io/developer/extensions — static service-key authentication
  with the public schema is not per-user bank isolation; current custom identity is needed.
- HS-06: https://hindsight.vectorize.io/developer/api/operations — asynchronous work and
  separate operation completion. Cancellation/timeout is not proof of undo or purge.

No prompt/runtime should fetch an arbitrary URL found in memory. These approved primary
references are for developer contract qualification, not automatically configured webhooks.
