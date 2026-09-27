# M2-0057 — curation proposal for owner approval

**No PII in this file.** It names files, byte sizes and match *counts* only. It does not
quote any email address, account ID or file content. Do not treat anything here as
already approved — see "What happens next".

Source directory (read-only, untouched by this ticket): `/Users/tony/AI-Brain-build/metis-2.0-exec`.
Destination scope (this ticket's only allowed write path): `docs/metis-2.0/review/prior-exec/`.

## 1. Candidate files

Every file that exists today under the source's handoff tree, each with an include/exclude
recommendation. Every "include" recommendation is still gated on your answers in §3 — nothing
here is copied yet.

### Recommend include (no email/secret/account-ID match found)

| File | Size |
|---|---:|
| `CURRENT.md` | 398 B |
| `OWNER-DECISIONS.md` | 1.0 KB |
| `BLOCKERS.md` | 15.4 KB |
| `tasks/PHASE1-STATUS.md` | 30.3 KB |
| `tasks/TASK-001/source-register.md` | 63.6 KB |
| `tasks/TASK-001/source-register.json` | 205.4 KB |
| `tasks/TASK-002/prd-lock.md` | 94.7 KB |
| `tasks/TASK-003/source-map.md` | 43.7 KB |
| `tasks/TASK-004/baselines.md` | 31.7 KB |
| `tasks/TASK-004/baselines.json` | 64.4 KB |
| `tasks/TASK-005/contracts.md` | 225.3 KB |
| `tasks/TASK-027/reconcile.md` | 32.6 KB |
| `tasks/WINDOWS-SIGNING/DECISION-BRIEF.md` | 9.5 KB |
| `tasks/WINDOWS-SIGNING/integration-design.md` | 52.4 KB |
| `tasks/WINDOWS-SIGNING/research-azure.md` | 30.9 KB |
| `tasks/WINDOWS-SIGNING/research-ca.md` | 32.8 KB |

### Recommend include, but only after masking (see §2)

| File | Size | Why |
|---|---:|---|
| `tasks/TASK-001/service-register.md` | 28.3 KB | The 3 email occurrences this ticket exists for (§2), plus one account-ID suffix decision (§3, question 3) |

### Recommend exclude this round (your call to override)

| File | Size | Why excluded |
|---|---:|---|
| `tasks/WINDOWS-SIGNING/build-workflow-result.json` | 98.5 KB | Raw CI-run artifact; no finding, ticket or TRACEABILITY row cites it as needed. Adds bulk with no reviewed narrative value. |
| `receipts/` (28 files, 3.0 MB total — `baseline-desktop.json` alone is 2.5 MB) | 3.0 MB | Raw CI/test-run logs and JSON, not cited by K09-R23 or any downstream ticket dependency found in TRACEABILITY. **They also contain email-pattern strings this ticket did not anticipate** (see §2, "found beyond the ticket's 3") — including them would need its own separate mask/count decision. |

### Excluded, not a choice — named per the required-changes instruction

| Path | Status |
|---|---|
| `metis-2.0-exec/.wrangler/cache/wrangler-account.json` | Already deleted from the source (confirmed absent by `find`, 2026-09-27). Never copied, and stays excluded even if it reappears. |

## 2. What actually needs masking

**The ticket's 3 known occurrences** — `tasks/TASK-001/service-register.md`, lines 29, 30 and 53:
each line contains one already-partially-masked personal email address (first character, `***`,
last character, then `@gmail.com` — the domain is fully visible and the first/last character of
the local part leak). This is the finding K09-R23 was opened for.

**Found beyond the ticket's 3, while auditing every candidate file (2026-09-27):**

| File | What | Count |
|---|---|---:|
| `receipts/baseline-desktop.json` | Same partial-mask pattern (`x***y@amaris.com`) | 4 |
| `receipts/baseline-desktop.json` | A generic company alias, not a personal address (`support@mantu.com`) | 2 |
| `receipts/baseline-operator.json` | An **unmasked** email-shaped string inside a CI test title — reads as a test fixture value, not confirmed as anyone's real address | 2 |
| `receipts/npm-ci.log` | A third-party open-source maintainer's public contact address, from npm package metadata, unrelated to this program | 1 |

None of these are in a file this proposal recommends including (see §1's exclude table), so no
mask decision is needed for them unless you choose to include `receipts/` after all.

**Not a match, flagged anyway for your awareness, not blocking:** every file in the source
contains ordinary absolute paths under `/Users/tony/...` (build paths, tool paths, OneDrive
paths). `docs/metis-2.0/review/REDACTIONS.md`'s own convention for this repository also scans
copied content for "absolute paths naming a non-generic username." The ticket's acceptance
criteria (gitleaks + an email regex scan) do not cover this, and gitleaks's default ruleset does
not flag a plain home-directory path, so it is **not** part of what this ticket needs to pass —
raising it only so the choice not to mask it is yours, not an unstated assumption on my part.

## 3. Questions for you to answer (approve, amend, or answer no to any of these — either way, I do not copy anything until you have)

1. **File list** — approve the "recommend include" list in §1 as-is, or tell me which files to
   add or drop (including whether `build-workflow-result.json` and/or `receipts/` should be
   in after all, and if so, which of the §2 "found beyond the ticket's 3" matches to mask and
   how).
2. **Mask token** — this repository already has a convention for this exact situation
   (`docs/metis-2.0/review/REDACTIONS.md`, used when the K09 review lane and the kit copies were
   made): emails become the literal placeholder text `<redacted-email>`. Do you want the 3
   `service-register.md` occurrences masked with that same token, or a different one?
3. **The account-ID suffix** — `service-register.md` line 30 also shows the last 4 hex
   characters of a Cloudflare account ID (the rest is already masked in the source). Mask that
   suffix too (token `<redacted-account-id>`, matching the same convention), or leave it as the
   4 characters it already shows?
4. **K09-R23's own acceptance line** — the finding this ticket implements
   (`KIT-REQUIREMENTS.json:8303`) is written against `metis-2.0-exec` itself returning 0 email
   matches, not against a copy. The LEAD NOTES forbid editing that directory from this ticket.
   Do you want TRACEABILITY to record K09-R23 as "satisfied by the sanitized copy, by owner
   decision," or would you rather mask the 3 lines in the source yourself as part of this same
   sign-off (nothing else in this ticket needs you to touch the source either way)?
5. **Who curates** — do you want to do the actual copy-and-mask yourself, or do you approve an
   agent doing it exactly as answered above once this proposal is answered?

## 4. What happens next

Once your answers to §3 are on record (a reply on the PR, or an edit to this file, is enough —
whatever you're comfortable leaving as the approval trail), the next agent on this ticket:

1. Copies only the approved files, byte-for-byte, from the source into this directory.
2. Applies only the approved mask(s), at only the approved location(s).
3. Writes `MANIFEST.json` here: per file, the source path, source and copy sha256, the
   redaction count, and the mask token used, plus the exclusions list (naming the `.wrangler`
   cache explicitly).
4. Runs `gitleaks detect --no-git --source docs/metis-2.0/review/prior-exec` and an email-regex
   scan over the copies (must be 0 matches) with a control count over the untouched source
   `service-register.md` (3, or 4 if you said yes to question 3), and confirms the source's
   sha256 values are unchanged before and after.
5. Pastes the exit codes and counts — never the matched text — into the PR as evidence.

No copy, mask, or commit happens before that. This file is the only thing this round of the
ticket adds under `docs/metis-2.0/review/prior-exec/`.
