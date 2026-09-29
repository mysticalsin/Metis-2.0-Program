# M2-0442 HeyClicky capability register re-point

Nothing here was executed (D-28). Every claim is labelled with its source. Ledger ticket text is OBSERVED from `docs/metis-2.0/ledger/tickets.json` at the line given.

## Re-verification of each owner (OBSERVED unless stated)

| Register rows | New owner | Ticket cites (finding_refs, tickets.json line) | Result |
|---|---|---|---|
| CAP-04, 06, 22 | M2-0355 | CAPADOPT-clicky-build-preview, -clicky-dev-setup-doctor, -vercel-deploy (20397-20399) | cited |
| CAP-09, 28, 30, 33-37 | M2-0354 | CAPADOPT-clicky-repo-operator, -claude-code, -codex, -github-auth, -github-code-review, -github-issues, -github-pr-workflow, -github-repo-management (20336-20343) | cited |
| CAP-17, 29, 31 | M2-0356 | CAPADOPT-frontend-design, -claude-design, -excalidraw (20450-20452) | cited |
| CAP-05, 27 | M2-0358 | CAPADOPT-clicky-creative-studio, -blender (20545-20546) | cited |
| CAP-07 | M2-0302 | CAPADOPT-clicky-email-assistant (17747) | cited |
| CAP-08, 24 | M2-0359 | CAPADOPT-clicky-google-workspace, -airtable (20593-20594) | cited |
| CAP-38 | M2-0359 | only `clicky-google-workspace`; no `CAPADOPT-google-workspace`. Acceptance (20605) proves the Google family per service | **citation gap** (see LEAD_ACTION) |
| CAP-10, 41, 48 | M2-0300 | CAPADOPT-clicky-research-report, -maps, -youtube-content (17634-17637) | cited |
| CAP-16, 19, 20 | M2-0298 | CAPADOPT-doc, -pdf, -spreadsheet (17536-17538); acceptance 17550-17553 covers DOCX, PDF, spreadsheet | cited |
| CAP-18, 42, 43 | M2-0361 | CAPADOPT-obsidian, -notion (20690-20691) | cited |
| CAP-26, 40 | M2-0360 | CAPADOPT-apple-reminders, -linear (20643-20644) | cited |
| CAP-46 | M2-0357 | CAPADOPT-powerpoint (20499) | cited |
| CAP-03 | M2-0297 (+ also_owners M2-0299) | M2-0297 CAPADOPT-clicky-artifacts (17484, manifest and authority split); M2-0299 bare `clicky-artifacts` (17587, library, rename, export, readback) | cited by both |
| CAP-44 | M2-0276 | CAPADOPT-ocr-and-documents (16431) | cited |

DERIVED addition beyond the ticket's list: CAP-25 (apple-notes) moved from M2-0084 to M2-0245. M2-0245 cites CAPADOPT-apple-notes (14926) and its acceptance (14943-14946) requires user-chosen note text verified by readback, which the generic M2-0084 acceptance does not. Revert that one row if the owner disagrees.

Result on the register (DERIVED): the four `NOT_TESTED` rows (CAP-27, 31, 41, 48) now have proving owners, so no row is `NOT_TESTED` while a ticket citing its CAPADOPT id exists. Rows without any citing ticket keep their marker or owner (CAP-01/02/11/12/14/15/21/23/32/39/45/47 EXCLUDED; CAP-13 M2-0082).

## Validator (`docs/metis-2.0/tools/trace/build-traceability.mjs`)

`validateCapabilityDispositions` now also fails when:
1. an owner or `also_owners` ticket cites the capability in neither `finding_refs` (`CAPADOPT-<name>` or the bare name) nor an acceptance line (`CAPADOPT-<name>` or the `CAP-NN` id);
2. a row is `NOT_TESTED` while a ticket cites `CAPADOPT-<name>`;
3. a row carries `status: "MET"` while an owner or citing ticket is not DONE or CANCELLED (row `status` is optional, one of NOT_MET, PARTIAL, MET; no row sets it yet);
4. an `also_owners` entry is not an existing M2 ticket.

A row may declare `citation_gap` (text); rule 1 then reports a warning instead of an error. Only CAP-38 uses it.

Fixture tests are in `build-traceability.test.mjs` (four new tests). They run in the existing private `traceability.yml` workflow (`node --test ...build-traceability.test.mjs`, line 26), which I did not run.

## Not run

Tests and the validator were not run (D-28). Evidence level: DESIGNED. The first workflow run is the check that the real register passes.

LEAD_ACTION: in docs/metis-2.0/ledger/tickets.json add "CAPADOPT-google-workspace" to M2-0359 finding_refs, regenerate ledger/tickets/M2-0359.md, then delete `citation_gap` from CAP-38 in kit/CAPABILITY-DISPOSITIONS.json.
LEAD_ACTION: dispatch `gh workflow run traceability.yml -R mysticalsin/Metis-2.0-Program` on the merged branch and confirm both the `--check` step and the `node --test` step are green.
LEAD_ACTION: commit the regenerated traceability outputs (TRACEABILITY.md, ledger/traceability.json) from the workflow artifact `traceability-outputs`, if the run changes them.
