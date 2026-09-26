# Redactions applied when copying into `review/`

Every file copied from `metis-v2-review/` into `docs/metis-2.0/review/` was scanned for email addresses, API-key-/token-like strings, labelled account/workspace/tenant/zone IDs, and absolute paths naming a non-generic username, before being written here. Matches were replaced in place (`<redacted-email>`, `<redacted>`, `<redacted-user>`). Raw values are never reproduced in this file, only counts, per the confidentiality hard rule.

| File | Emails | Secrets | Account IDs | Paths |
|---|---:|---:|---:|---:|
| review/lanes/K09-prior-execution.md | 1 | 0 | 0 | 0 |
| **Total** | **1** | **0** | **0** | **0** |

## Kit copies (`docs/metis-2.0/kit/`)

The kit copies were first written verbatim, without this scan. The final validator (2026-09-26) found the owner's personal email address and the real Cloudflare account ID inside copied Operator test fixtures and replaced them in place (`<redacted-email>`, `<redacted-account-id>`). `kit/MANIFEST.json` carries the sha256 of each redacted copy and a `redacted` count per file. The same values still exist in the read-only kit sources outside this repository, and the account ID is also present in the repository's own `operator/src/*.test.ts` fixtures (cleanup tracked by an acceptance line on M2-0049, together with the personal emails already tracked at 2bf21f1c).

| Files | Emails | Account IDs |
|---|---:|---:|
| `kit/v5/baseline/Metis-Work-Session.x/Metis-Work-Session/previous-repair/delta/{baseline,overlay}/operator/src/{ask,cloudflare-connect,keys,use}.test.ts` (8 files) | 18 | 6 |

## Notes

- `plan-work/drafts/` does not exist yet (source directory not created upstream as of this render). `review/drafts/` is intentionally absent — re-run this renderer once drafts exist.

