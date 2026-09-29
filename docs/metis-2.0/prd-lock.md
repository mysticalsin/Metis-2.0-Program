# Metis 2.0 PRD Lock

| Field | Value |
|---|---|
| Ticket | M2-0016 |
| Version | 1.0 |
| Evidence level | DESIGNED |
| Gates other tickets | No |
| Coverage rows | 44 Section 25 rows |

## Scope

This lock covers the full TASK-002 PRD, threat model and Section 25 coverage map after the one-page policy approval. It records policy answers for entitlement authority, default speech routing, gateway logging, local options, release lanes and signing scope. It does not claim product verification.

## Policy Answers Copied From M2-0189

- D4. Which system is the 2.0 entitlement authority? Answer: "Operator seat". Recorded policy [S1]: the Operator seat is authoritative for 2.0; the legacy license server stays read-only for existing keys until an ADR-016 deprecation decision.
- D11. What is the fresh-install default speech route? Answer: "Cloudflare via Operator". Recorded policy [S1]: Cloudflare-hosted speech through the Operator session broker, with no organization token on the device; local speech is optional and never a silent fallback.
- D12. What is the gateway log policy, and what does the retention claim say? Answer: "Metadata-only". Recorded policy [S1]: metadata-only gateway logs, no payload logging or caching; the claim says only what M2-0149 verifies. This is the separate approval MASTER §16.6.2 asks for; the end-to-end transport verification is still owed (DERIVED [S4]).

## Speech And Local Options

- Fresh 2.0 profiles default to Cloudflare-hosted speech through the Operator session broker.
- No organization speech token is stored on the device for the broker route.
- Local speech is explicit and optional; it is never a silent fallback when the broker route is unavailable.
- Until the broker route is privacy-ready, the route is unavailable with an explicit local-install choice.

## Retention Claim

The approved wording is metadata-only. The product must not say "zero retention", "no logs" or "Cloudflare stores no data". Published privacy copy may say only what the verified route proves, including: "Authorized usage metadata is retained for administration".

## Release Lanes

- Windows and macOS release states are independent: Windows can reach a signed Electron lane without waiting for Apple prerequisites.
- The macOS Electron lane remains blocked on legitimate Apple distribution prerequisites until those inputs exist.
- Native Mac public distribution and Apple public signing are out of scope for this lock; they stay on their own lane and never block Windows-only signing.
- Public release evidence must name exact candidate artifacts and platform state; unsigned QA artifacts count as zero customer-release evidence.

