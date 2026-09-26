# Métis v5 — supplied Hindsight skill inclusion and governed integration

25 September 2026. **Consolidated handoff updated; current repository and installed app unchanged.**

## What changed

The complete uploaded Hindsight Agent Memory v1.0.0 archive is preserved and its 55
files are bundled unchanged beneath the active Métis-specific wrapper. The wrapper,
profile and reading map make the existing note-taking, keyboard, canonical-memory,
JEV and permission rules govern the general-purpose recipes. The original script
checksum manifest has 54 entries, all matching. SHA256SUMS is itself included as the
55th file. This is integrity checking, not publisher authentication.

The new integration map attaches the skill to all sixteen original HMSTEP tasks,
retaining their titles, parent roots, dependencies, acceptance and gates. It updates
the full coding prompt, host bindings, root task crosswalk and interaction acceptance.
No competing memory system, raw MCP access, automatic capture hook or new service is
introduced. The original client and evidence helper implementations are supplied as
references; API differences and actual runtime obligations are explicitly documented.

The ten existing behavior/JEV TypeScript modules, compiled artifacts, examples and tests
remain unchanged. The complete v4 keyboard/note-taking folder and original baseline
archives remain unchanged. Every edited original handoff file is also preserved under
memory/evidence/previous-v4; see PRESERVATION.json.

## Executed in this turn

| Check | Result | Boundary |
|---|---:|---|
| Existing behavior/JEV compiled candidate tests | 306 passed; 0 failed/skipped | Same compiled candidate; no new app integration or live JEV |
| Uploaded skill Python tests | 60 passed; 0 failed | Fixtures and real local loopback HTTP; not Hindsight deployment |
| Uploaded skill JavaScript tests | 21 passed; 0 failed/skipped | Explicit fake fetch/stream responses |
| New integration/package constraint tests | 34 passed; 0 failed | Package/profile structure and deliberate in-memory policy mutations |
| Uploaded skill structure validator | Passed; 55 files | Relative paths, syntax/text assets, size; no exhaustive security audit |
| Supplied file checksums | 54/54 match | Source zip and all 55 file hashes separately recorded |
| Live smoke without authorization | Refused, exit 2 | No service request or live write sent |
| Original runtime/notes/baseline preservation | 66 files byte-identical | Full per-file map retained |

Logs and executed command descriptions are under memory/evidence/. Current runtime is
Node 22.16.0 and Python 3.13.5. These differ from Tony's reported Mac Node pin. The
compiled existing candidate was rerun; a new whole-project TypeScript build is not claimed.
The 34 new validator tests assess declared initial policy and inclusion, not actual ACL
or native behavior. No root task or app scenario is closed by these test counts.

## Current documentation checks

The official retain and documents guides conflict on general original-text retention;
the Documents page expressly describes chunks and original-text readback. The profile
therefore requires actual storage/retention qualification. Official recall docs distinguish
nonempty strict tags from empty/unfiltered behavior and fact-text token budgets from
full response size. The whole envelope must be bounded and source-authorized by Métis.
Current knowledge-page/extension behavior is documented as version-bound evidence, not
assumed compatible with a deployment. See REFERENCES.md and SKILL-REVIEW.md.

## Still required

The actual checkout, native application, identity gateway, canonical storage/outbox,
current Hindsight server/schema/configuration, supplier data permission, JEV/other model
routing, two independently authenticated users, same-account later-session recall,
Dust/agent updates, correction/forget/derivative purge, backup restore, usage accounting,
concurrent note-taking, key-toggle behavior, independent review and release/signing
must still be bound and tested.

Twenty HSAC scenarios augment the previous 100 interaction cases. All 120 remain
NOT_RUN. Original HMSTEP/HM-FLOW and all r11 requirements remain. This package does not
start a server, deploy a database, activate a host skill, send customer data, modify
GitHub, access Tony's Mac or complete Métis 2.0.
