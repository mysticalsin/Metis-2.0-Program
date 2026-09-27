# Redactions applied when copying into `review/`

Every file copied from `metis-v2-review/` into `docs/metis-2.0/review/` was scanned for email addresses, API-key-/token-like strings, labelled account/workspace/tenant/zone IDs, and absolute paths naming a non-generic username, before being written here. Matches were replaced in place (`<redacted-email>`, `<redacted>`, `<redacted-user>`). Raw values are never reproduced in this file, only counts, per the confidentiality hard rule.

| File | Emails | Secrets | Account IDs | Paths |
|---|---:|---:|---:|---:|
| review/DIGEST-code-critic.md | 0 | 0 | 0 | 4 |
| review/PUBLIC-READINESS.md | 0 | 0 | 0 | 1 |
| review/SRC-REVERIFY.md | 0 | 0 | 0 | 3 |
| review/SYNTHESIS-NOTES.md | 0 | 0 | 0 | 1 |
| review/chatgpt-audit-2.md | 0 | 0 | 0 | 1 |
| review/lanes/B1-history-freeze.md | 0 | 0 | 0 | 1 |
| review/lanes/B2-resource-heavy.md | 0 | 0 | 0 | 1 |
| review/lanes/B3-crash-stability.md | 0 | 0 | 0 | 1 |
| review/lanes/K01-master-s0-7.md | 0 | 0 | 0 | 2 |
| review/lanes/K02-master-s8-14.md | 0 | 0 | 0 | 3 |
| review/lanes/K03-master-s15-20.md | 0 | 0 | 0 | 4 |
| review/lanes/K05-master-s22-31.md | 0 | 0 | 0 | 5 |
| review/lanes/K06-master-s32-35.md | 0 | 0 | 0 | 7 |
| review/lanes/K07-kit-other.md | 0 | 0 | 0 | 1 |
| review/lanes/K08-v6-v5-lineage.md | 0 | 0 | 0 | 2 |
| review/lanes/K09-prior-execution.md | 1 | 0 | 0 | 7 |
| review/lanes/K10-git-github.md | 0 | 0 | 0 | 1 |
| review/lanes/L02-main-sidecars-ai.md | 0 | 0 | 0 | 1 |
| review/lanes/L03-main-data-history.md | 0 | 0 | 0 | 1 |
| review/lanes/L04-main-capture-speech.md | 0 | 0 | 0 | 1 |
| review/lanes/L05-main-security-integrations.md | 0 | 0 | 0 | 1 |
| review/lanes/L06-renderer-core.md | 0 | 0 | 0 | 1 |
| review/lanes/L07-renderer-components.md | 0 | 0 | 0 | 1 |
| review/lanes/L08-shared-contracts-preload.md | 0 | 0 | 0 | 2 |
| review/lanes/L09-operator-cloud.md | 0 | 0 | 0 | 1 |
| review/lanes/L10-intelligence-native.md | 0 | 0 | 0 | 2 |
| review/lanes/L11-build-ci-quality.md | 0 | 0 | 0 | 2 |
| review/lanes/L12-arch-graph.md | 0 | 0 | 0 | 1 |
| review/plan-inputs/BUG-ROOT-CAUSES.json | 0 | 0 | 0 | 5 |
| review/plan-inputs/CODE-FINDINGS.json | 0 | 0 | 0 | 15 |
| review/plan-inputs/COVERAGE-CRITIC.json | 0 | 0 | 0 | 2 |
| review/prep/FREEZE-HYPOTHESES.md | 0 | 0 | 0 | 1 |
| review/prep/GITHUB.md | 0 | 0 | 0 | 2 |
| review/prep/HERMETIC-TESTS.md | 0 | 0 | 0 | 5 |
| review/prep/KIT-PATCHES.md | 0 | 0 | 0 | 3 |
| review/prep/UNCOVERED-RENDERER-OPS.md | 0 | 0 | 0 | 1 |
| **Total** | **1** | **0** | **0** | **93** |

## Kit copies (`docs/metis-2.0/kit/`)

The kit copies were first written verbatim, without this scan. The final validator (2026-09-26) found the owner's personal email address and the real Cloudflare account ID inside copied Operator test fixtures and replaced them in place (`<redacted-email>`, `<redacted-account-id>`). `kit/MANIFEST.json` carries the sha256 of each redacted copy and a `redacted` count per file. The same values still exist in the read-only kit sources outside this repository, and the account ID is also present in the repository's own `operator/src/*.test.ts` fixtures (cleanup tracked by an acceptance line on M2-0049, together with the personal emails already tracked at 2bf21f1c).

| Files | Emails | Account IDs |
|---|---:|---:|
| `kit/v5/baseline/Metis-Work-Session.x/Metis-Work-Session/previous-repair/delta/{baseline,overlay}/operator/src/{ask,cloudflare-connect,keys,use}.test.ts` (8 files) | 18 | 6 |

## Notes

- `plan-work/drafts/` does not exist yet (source directory not created upstream as of this render). `review/drafts/` is intentionally absent — re-run this renderer once drafts exist.
- The quoted `SCRATCH_DIR` code snippet in `prep/UNCOVERED-RENDERER-OPS.md` had only its username token substituted by this same redaction pass: the real source code contains the owner's actual username at that position, not the literal string `<redacted-user>`, so treat the snippet's path shape as evidence while knowing that one token was altered from the original.
