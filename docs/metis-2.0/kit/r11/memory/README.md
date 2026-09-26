# Hindsight embedded in Métis

**Delivery addition to the complete r11 kit. It is not a standalone replacement product.**

Read MASTER §35, `SOURCE-REVIEW.md`, and `BINDINGS.md`. Then follow `HMSTEP-01` through `HMSTEP-16` under their existing TASK-001–066 owners. Hindsight serves memory behind the current identity/knowledge/skills surfaces; end users do not install Hindsight, sign into another dashboard, or receive its API key.

## Implemented here

`src/hindsight-client.mjs` performs actual bounded HTTP calls for retain, recall, reflect, document privacy checks and document deletion. It rejects unsafe transport and scope, preserves original Unicode text, enforces explicit strict queries, handles unknown usage, and never treats a partial response as full proof. `src/memory-gateway.mjs` coordinates those calls with explicit trusted Métis bindings and withholds unauthorized or stale evidence. `deploy/profile-check.mjs` checks a proposed server privacy/placement profile. They have offline tests. **The actual application bindings and production deployment are not completed by this ZIP.**

Run component tests without installing dependencies:

```bash
node --test memory/tests/*.test.mjs
```

Inspect the interactive design at `memory/visual/index.html`. Its controls operate synthetic fixtures in memory only; they are not app/provider test results.

## Deployment preparation

Copy `deploy/profile.template.json` outside the sealed kit and fill it from a reviewed real image, region and approved stage providers. The template deliberately fails validation until that has happened:

```bash
node memory/deploy/profile-check.mjs /approved/path/profile.json
```

Supply secrets via the actual server secret manager. No deploy automation in this kit creates a paid service, broadens tenant permissions, stores credentials or invents approval. Do not place this server library in the Electron renderer or SwiftUI bundle.

## Opt-in actual API smoke

Only in a permitted environment with a pre-created dedicated `metis-test-*` bank, place `METIS_HINDSIGHT_URL`, `METIS_HINDSIGHT_API_KEY` and `METIS_HINDSIGHT_TEST_BANK` in the process environment through approved secret handling. Then:

```bash
node memory/live-smoke.mjs --allow-synthetic-write --allow-provider-cost
```

This performs real retain, document-text readback, bounded recall, evidence-bearing reflect, exact-document deletion and 404 readback with generated non-sensitive data. It cleans up only its own document. Inference may incur actual costs. Do not run it against user banks. Its result is **transport/service smoke, not complete Métis E2E, full deletion or quality certification**.

The provided live-service receipt stays `NOT_RUN`; no service endpoint or vendor credential was supplied during preparation. No customer content was sent to Hindsight.
