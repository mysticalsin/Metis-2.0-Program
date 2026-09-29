# Host-binding table (M2-0386)

Ticket M2-0386, depends on M2-0019. Machine-checked by `docs/metis-2.0/tools/trace/check-bindings.mjs`.

## Evidence labels

- OBSERVED: seen in a named file or command output.
- DERIVED: concluded from OBSERVED items, source named.
- ASSUMED: planned or inferred, not yet verifiable on `origin/m2/integration`.
- UNKNOWN: no source found.

## Sources

- OBSERVED: the ten responsibilities and the owning tickets M2-0079/0082/0087/0089/0091/0093/0106/0114/0121/0134 come from the M2-0386 ticket summary (`docs/metis-2.0/ledger/tickets.json`, entry `M2-0386`).
- OBSERVED: M2-0019 decided PORT_TESTS for command authority and rejected a second authority system (`docs/metis-2.0/kit/PORT-DECISIONS.md:66-68`, `:82`). It read `command-control.ts` on `origin/m2/integration` (`PORT-DECISIONS.md:55`).
- OBSERVED: scope paths and verification commands per owning ticket are in `docs/metis-2.0/ledger/tickets/M2-0079.md` `M2-0082.md` `M2-0087.md` `M2-0089.md` `M2-0091.md` `M2-0093.md` `M2-0106.md` `M2-0114.md` `M2-0121.md` `M2-0134.md`.
- OBSERVED (read from the local checkout `/Users/tony/AI-Brain-build/metis-operator-ux`, whose branch this session could not print, so not proof of `origin/m2/integration`): exports `requireAuth` (`src/main/auth.ts:721`), `class CommandControl` (`src/main/command-control.ts:42`), `executeDesktopAction` (`src/main/desktop-adapters.ts:167`), `resolveBarOrbState` (`src/renderer/src/lib/bar-pill-orb.ts:108`), `persistProxyAsk` (`operator/src/ask-meter.ts:22`). Each test file imports or references the symbol: `auth.test.ts` (26 hits for `requireAuth`), `command-control.test.ts:2`, `desktop-adapters.test.ts:11`, `bar-pill-orb.test.ts` (12 hits for `resolveBarOrbState`), `ask-meter.test.ts:2`.
- OBSERVED: `git -C .../metis-operator-ux show origin/m2/integration:<path>` was refused by this session's permission layer, so no BOUND row is confirmed against `origin/m2/integration` yet. The checker is the confirmation step (see LEAD_ACTION).

## Table

`BOUND` means the module and symbol exist in production code and the named test exercises it. `UNBOUND` means the owning ticket has not landed the code; the module and test paths are ASSUMED from that ticket's scope paths and verification command, and the row is carried into the M2-0183 final audit. Column order is fixed; the checker parses it.

| ID | Responsibility | Status | Module | Symbol | Owning ticket | CI test |
|---|---|---|---|---|---|---|
| HB-01 | Authenticated ingress (identity, tenant, session) | BOUND | `src/main/auth.ts` | `requireAuth` | M2-0121 | `src/main/auth.test.ts` |
| HB-02 | Task grants (one-use, policy-checked command proposals) | BOUND | `src/main/command-control.ts` | `CommandControl` | M2-0079 | `src/main/command-control.test.ts` |
| HB-03 | Operation coordination (bounded dispatch to desktop adapters) | BOUND | `src/main/desktop-adapters.ts` | `executeDesktopAction` | M2-0082 | `src/main/desktop-adapters.test.ts` |
| HB-04 | Durable journal and resource fencing | UNBOUND | `src/main/features/actions/journal.ts` | — | M2-0091 | `src/main/features/actions/journal.test.ts` |
| HB-05 | Native input arbiter (one physical input owner, human wins) | UNBOUND | `src/main/features/actions/input-lease.ts` | — | M2-0089 | `src/main/features/actions/input-lease.test.ts` |
| HB-06 | Trusted readback (independent postcondition verifier) | UNBOUND | `src/main/features/actions/verify.ts` | — | M2-0082 | `src/main/features/actions/verify.test.ts` |
| HB-07 | Real mic, STT, TTS and playback (fenced, interruptible) | UNBOUND | `src/main/features/voice/index.ts` | — | M2-0087 | `src/main/features/voice/index.test.ts` |
| HB-08 | Real UI and overlay (orb, pill, bar) | BOUND | `src/renderer/src/lib/bar-pill-orb.ts` | `resolveBarOrbState` | M2-0093 | `src/renderer/src/lib/bar-pill-orb.test.ts` |
| HB-09 | Current-audience output (private assistant output kept out of meeting transcript) | UNBOUND | `src/main/features/meeting/index.ts` | — | M2-0114 | `src/main/features/meeting/index.test.ts` |
| HB-10a | Canonical usage and metering | BOUND | `operator/src/ask-meter.ts` | `persistProxyAsk` | M2-0106 | `operator/src/ask-meter.test.ts` |
| HB-10b | Canonical memory (approved records projected to Hindsight) | UNBOUND | `services/memory/projection/index.ts` | — | M2-0134 | `services/memory/projection/index.test.ts` |

## How the mapping was chosen

- DERIVED: the responsibility-to-ticket assignment follows each ticket's title and acceptance items. Ingress: M2-0121 (PKCE, token validation, tenant re-check). Grants: M2-0079 (main-owned command session, channel authenticity). Coordination and readback: M2-0082 (registry, typed results, independent verifier). Journal: M2-0091. Input arbiter: M2-0089. Voice: M2-0087. Overlay: M2-0093. Audience output: M2-0114 (`M2-0114.md` acceptance line 1). Usage: M2-0106. Memory: M2-0134.
- DERIVED: HB-10 is split because the ticket summary names "canonical memory/usage" as one responsibility with two owners, and M2-0106 (usage) has existing code while M2-0134 (memory) does not.
- ASSUMED: HB-01, HB-03 and HB-08 bind the existing symbol that the owning ticket will extend, not the finished feature. When the ticket lands and changes the production symbol, update the row in the same PR.
- ASSUMED: the planned module and test paths for the UNBOUND rows, except the tests named in the owner tickets' verification lines (`journal.test.ts` in `M2-0091.md:42`, `input-lease.test.ts` in `M2-0089.md:41`). The checker fails when an UNBOUND row's module appears, which forces the owner PR to flip the row to BOUND with a real symbol.

## Final-audit carry list (M2-0183)

These UNBOUND rows must appear in `docs/metis-2.0/FINAL-AUDIT.md` when M2-0183 creates it: HB-04 (M2-0091), HB-05 (M2-0089), HB-06 (M2-0082), HB-07 (M2-0087), HB-09 (M2-0114), HB-10b (M2-0134). The checker enforces this by failing when `FINAL-AUDIT.md` exists and omits an UNBOUND row id.

## Running the check

```
node docs/metis-2.0/tools/trace/check-bindings.mjs --code-repo <public repo clone> [--ref origin/m2/integration]
node docs/metis-2.0/tools/trace/check-bindings.mjs --code-root <public repo checkout on m2/integration>
```

It exits 1 when a BOUND row's module, symbol or test file is missing (or the test does not mention the symbol), when an owner ticket is not in the ledger, when an UNBOUND row's module already exists, or when the final audit omits an UNBOUND row.

- UNKNOWN: this ticket's scope holds only the table and the checker. No workflow file wires the checker into CI, and this session ran nothing (owner decision D-28).

## Lead-only steps

LEAD_ACTION: Run `node docs/metis-2.0/tools/trace/check-bindings.mjs --code-repo /Users/tony/AI-Brain-build/metis-operator-ux --ref origin/m2/integration` and fix any FAIL line by correcting the row, not by weakening the checker.
LEAD_ACTION: Add a CI step that runs the checker against the `m2/integration` checkout (workflow files are outside this ticket's scope).
LEAD_ACTION: Add HB-04, HB-05, HB-06, HB-07, HB-09 and HB-10b to the scope and acceptance of M2-0183 in `docs/metis-2.0/ledger/tickets.json` and regenerate `ledger/tickets/M2-0183.md`.
LEAD_ACTION: Update the M2-0386 ledger status and file CI evidence after the PR's Build & Test passes.
