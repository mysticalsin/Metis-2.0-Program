# Métis 2.0: policy record (D-4, D-11, D-12)

| Field | Value |
|---|---|
| Ticket | M2-0189, the one-page approval split from M2-0016 (PD-22) |
| Answered | 2026-09-27 by the program owner; each answer selects the recommended default (`ANSWERED_AS_DEFAULT`) [S1] |
| Labels | PROVIDED (owner), OBSERVED, DERIVED, ASSUMED, UNKNOWN; sources [S1]–[S7] below |

## D-4. Which system is the 2.0 entitlement authority? (C-16)

- **Answer (PROVIDED, verbatim):** "Operator seat". Recorded policy [S1]: the Operator seat is authoritative for 2.0; the legacy license server stays read-only for existing keys until an ADR-016 deprecation decision.
- **Precedence (DERIVED):** one authority per profile. A seat decides its profile even when a legacy key is present; a profile with only an existing legacy key is validated read-only, and no new keys are issued.
- **If revisited:** reopens M2-0146 (precedence, EXP-08) and M2-0106 (metering identity), and needs Fly.io access first.
- **Scope (OBSERVED [S2]):** D-4 answers C-16 only. C-03 (native onboarding parity) is D-25 (M2-0161). C-08 asks which chrome modes show the ARMED orb and whether `hide` stays the fresh default. It has no D-row (M2-0093 owns the design). Both stay open.

## D-11. What is the fresh-install default speech route?

- **Answer (PROVIDED, verbatim):** "Cloudflare via Operator". Recorded policy [S1]: Cloudflare-hosted speech through the Operator session broker, with no organization token on the device; local speech is optional and never a silent fallback.
- **Gap today (OBSERVED [S3]):** the fresh default is local (`ipc.ts:1698,1700`), cloud applies only to cloud-only profiles (`cloud-stt-provider.ts:52`), and the device reads a Cloudflare token (`credentials.ts:90,109`).
- **Unready route (DERIVED):** until privacy readiness is VERIFIED, speech shows unavailable with an explicit local-install choice; the engine never switches by itself.
- **If revisited:** a local default reverses M2-0112 and the M2-0160 setup scene, and reopens bundled weights in the core installer.

## D-12. What is the gateway log policy (C-18), and what does the retention claim say?

- **Answer (PROVIDED, verbatim):** "Metadata-only". Recorded policy [S1]: metadata-only gateway logs, no payload logging or caching; the claim says only what M2-0149 verifies. This is the separate approval MASTER §16.6.2 asks for; the end-to-end transport verification is still owed (DERIVED [S4]).
- **Controls (OBSERVED [S5]):** `cf-aig-collect-log: false` drops the log entry; `cf-aig-collect-log-payload: false` keeps a metadata-only entry (model, status, tokens, cost, duration); a per-request `cf-aig-collect-log` overrides the gateway default either way. The Worker binding has `collectLog` and no payload option. Accounts with a gateway created before 2026-09-24 use Legacy Logs, which keep entries until deleted; newer accounts use Workers Logs (7 days maximum). The account's regime is UNKNOWN until the B-14 readback.
- **Control set (DERIVED; ASSUMED until M2-0149's sentinels prove it):** gateway logging stays off, as the landed readback requires (`ai-gateway.ts:61-69` also requires cache, Logpush, OTel and log classification off [S3]), so a request missing its headers is never logged. Today `use.ts:240` omits `cf-aig-collect-log`, so a compliant gateway logs nothing at all. Protected Operator requests send `cf-aig-collect-log: true`, `cf-aig-collect-log-payload: false` and `cf-aig-skip-cache: true`. A transport without a proven metadata-only result, including a binding route, sends `cf-aig-collect-log: false`. One where neither is proven is BLOCKED (§16.6.3).
- **Claim (DERIVED):** the §16.6.5 sentence tailored to the verified route, shown only while readiness is VERIFIED, keeping "Authorized usage metadata is retained for administration". It never says "zero retention", "no logs" or "Cloudflare stores no data".
- **If revisited:** "no gateway logs" is `cf-aig-collect-log: false` on every route, one line in M2-0104. The readback and the claim stay, because the Operator ledger still holds the usage metadata.

## Consequences by ticket (DERIVED; decisions from `needs_decision` [S7])

| Ticket | From | Consequence | Re-validate |
|---|---|---|---|
| M2-0146 | D-4 | `licensingMode` implements the precedence; ADR-016 leaves only deprecation open; the remaining unblock step is read-only Fly.io access | Yes: `external_blocker` still asks C-03, C-08 and keep-or-deprecate |
| M2-0106 | D-4 | Metering identity is the seat's principal and device, never a legacy key | No |
| M2-0064 | D-11 | A selected engine that is not ready reports not-ready; there is no implicit cloud/local fallback | No |
| M2-0102 | D-11, D-12 | Qualify only the broker route; record the log mode per transport, the log regime and the metadata retention bound | No |
| M2-0107 | D-11 | The broker grant is the only speech credential; a stored token is removed on upgrade | No |
| M2-0112 | D-11 | Broker route is the fresh default on every profile; an unready route shows unavailable, never local | No |
| M2-0160 | D-11 | Setup configures the broker route with no token field; local downloads are optional, never a fallback | No |
| M2-0104 | D-12 | Implement the control set | Yes: acceptance 1 prescribes `cf-aig-collect-log: false`, dropping the metadata D-12 keeps |
| M2-0149 | D-12 | Sentinels on HTTP and WebSocket; record the log regime and a finite metadata retention bound; publish only the claim above | No |
| M2-0178 | D-12 | A film privacy line is the M2-0149 sentence verbatim, or it is cut | No |
| M2-0016 | all | prd-lock v1.0 copies these answers, closes C-16 and C-18, keeps C-03 and C-08 open | No |
| M2-0093 | none | C-08 remains an open owner question | No |

**Re-validation.** M2-0002 rule L13 lists no ticket, because every answer equals its default [S6]. The orchestrator owns ledger fields other than `notes`. It corrects the two "Yes" rows (text written before the answers), the C-03/C-08 wording on D-4 (DECISIONS.md, BLOCKERS.md B-07/B-28, PLAN.md:353, ARCHITECTURE.md:557/:599) and this ticket's title.

**Open, not asked here.** The retention period for gateway metadata (Legacy Logs have none without a deletion job). Also whether the privacy/legal owner (B-30 role) co-signs the metadata-only approval, as the prior C-18 resolution asked [S2].

## Sources

- [S1] DECISIONS.md D-4, D-11, D-12 (commit 531e374).
- [S2] `metis-2.0-exec/tasks/TASK-002/prd-lock.md` §2.3: C-03 :173, C-08 :178, C-16 :186, C-18 :188.
- [S3] mysticalsin/AskToto-Mantu `m2/integration` 56292fb6: `src/shared/ipc.ts:1698,1700`, `src/shared/cloud-stt-provider.ts:47-54`, `src/main/cloud-stt/credentials.ts:90,109`, `operator/src/use.ts:238-240`, `operator/src/ai-gateway.ts:61-69`.
- [S4] `kit/r11/spec/MASTER.md:1469-1516` (§16.6.2-§16.6.5).
- [S5] developers.cloudflare.com, read 2026-09-26: ai-gateway/observability/logging, …/logging/legacy-logs, ai-gateway/reference/limits, ai-gateway/usage/worker-binding-methods, workers/observability/logs/workers-logs.
- [S6] README.md:69-75 (decision register, rule L13).
- [S7] `ledger/tickets.json`.
