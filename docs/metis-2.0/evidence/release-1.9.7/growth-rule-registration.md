# Growth-rule registration: IDLE-GROWTH-1 and MEETING-GROWTH-1 (M2-0488, for M2-0046)

Program document. It carries no meeting, transcript or personal content. It holds only rule ids, hashes, commit ids, PR and run numbers, and repository paths. It was drafted on 2026-10-03 from read-only git reads of the app repository, and no repository code was run (D-28). App paths are given as they appear in the app repository. Program paths (`evidence/`, `ledger/`, `DECISIONS.md`) are relative to `docs/metis-2.0/`. Ledger items are cited by ticket and field, because `ledger/tickets.json` line numbers shift with every ledger commit.

This file is the growth-rule registration that M2-0488's LEAD_ACTION asks for (M2-0488 `acceptance[9]`). It is also the pre-registration that OD-35 requires before an idle leg runs (`DECISIONS.md:51`).

The rules count as registered from the registering commit. That is the first program-`main` commit that adds this file, and this command finds it: `git log --diff-filter=A --format='%H %cI' -- evidence/release-1.9.7/growth-rule-registration.md`. The same commit appends the registration to M2-0046's `notes`. It is pushed before any idle-soak or meeting-history dispatch. Program `main` is protected against force-pushes (OD-37, `DECISIONS.md:53`).

## 1. Registered rules

| Item | Value | Source (OBSERVED unless marked) |
|---|---|---|
| Rule ids | `IDLE-GROWTH-1` covers each hosted idle leg, macOS and Windows (OD-35). `MEETING-GROWTH-1` covers the 1 h meeting of the meeting-history leg (acc 4c). | `scripts/qa/soak/growth-rule.mjs:37`, `:54`; the rule data is at `:87-152` |
| **Registered sha256** | `53d05c480c66dbc8fe7005a235d67853fc7051acd13556d85c53bfb2e0a9b636` | pinned at `scripts/qa/soak/growth-rule.contract.test.ts:11` |
| What the sha256 covers | The canonical JSON of the frozen `RULES` object: object keys sorted at every depth, UTF-8, 2511 bytes. One sha256 covers both rules, so any edit to `RULES` changes the value for both, even an edit limited to `MEETING_GROWTH_1`. The verdict reports it as `rule.rulesSha256`. | `growth-rule.mjs:157-169`; `scripts/qa/soak/growth.mjs:422` |
| Merged commit | `03a0ca3e39c8859a7b997a6f815090466acd10e8`, from PR #395, squash-merged into `m2/integration` at 2026-09-30T22:08:07Z | `git log -1 03a0ca3e` |
| On `main` since | `fd38fd09c6cc161e34c6b23d2016485b43e8f9ad`, the milestone merge #429, at 2026-10-02T10:37:12Z | first-parent history of `origin/main` |
| Unchanged when drafted (2026-10-03) | At `origin/main` `d68d8e5fe2f9537b0453f415f510a3b71c972b07` and at `origin/m2/integration` `088da5c85a8b4fa66166aaac9dc06fcfdb5f5d4a`, `growth-rule.mjs` is still blob `500b7eb5789b084a0116fe693643ffdced86dd4e` and the pin has not changed. Since 03a0ca3e, the only changes under `scripts/qa/soak/` are to `idle-soak.mjs` and its test. Run the command in the next column again just before the registering commit. | `git log 03a0ca3e..origin/main -- scripts/qa/soak/` |
| Independent recomputation | The `RULES` literal at 03a0ca3e was parsed as JSON and its sorted-key form was hashed, without using the repository's code. The result is the registered sha256 (§5). | read-only recomputation, 2026-10-03 |
| Amendments before registration | None. The defaults are registered as they were merged. | The lead's choice. The lead may amend the rules only before this registration (M2-0488 `summary`). |
| Not registered | `rule.fileSha256`, the sha256 of the `growth-rule.mjs` file bytes. On an LF checkout it is `0dc604985005ac2240e677b17145c1f959f92646f132af930dd92e417e971b9b`. Any comment edit changes it. It can also differ on `windows-latest`: `.gitattributes` pins no `scripts/qa/soak/` path to LF, and its own comments say Windows CI applies `core.autocrlf` (`.gitattributes:11`, `:17`, `:29`, `:44`). INFERRED for this file. | `growth.mjs:422` |

## 2. When a verdict counts as evidence

A growth verdict counts for M2-0046 acc 4b (the idle legs, OD-35) or acc 4c (the meeting hour) only if all five of these hold:

1. The verdict's `schema` is `growth-verdict/1` (`growth.mjs:17`, `:420`).
2. `rule.id` is `IDLE-GROWTH-1` for an idle-soak leg, or `MEETING-GROWTH-1` for the meeting-history leg.
3. The verdict's `rule.rulesSha256` and the one in the leg's `lane.json` both equal the sha256 in the latest section of this file that was committed before the run was created. Until a later section exists, that is §1.
   - Idle legs write the value at `scripts/qa/soak/idle-soak.mjs:375` and `:418`. The lane copies it into `lane.json` (`scripts/qa/candidate-scenarios.mjs:147-148`, `:175-176`, `:577-578`).
   - M2-0497 must add the same field for meeting-history (M2-0497 `acceptance[2]`).
4. The run was created after the registering commit reached program `main`: its `createdAt` (`gh run view <ci_run_id> --json createdAt`) is later than that commit. This includes shakedowns. No earlier run is evidence, and no shakedown on the 1.9.6 bytes of qa-candidate run 36636273967 is evidence.
5. The run used the 1.9.7 candidate's bytes on a hosted runner (`candidate-scenarios.mjs:590-596`):
   - In `lane.json` and in the record, `build_run_id` is the 1.9.7 qa-candidate run.
   - `environment` is `hosted-runner` on `macos-latest` or `windows-latest` (`scripts/evidence/record.mjs:28`, `:101-103`).
   - `artifact_sha256` is one of three installers. For the macOS idle leg it is the DMG (M2-0492). For the Windows idle leg it is the Windows Setup (M2-0493). The lane never installs the Portable (OD-53; `scripts/qa/candidate-installer.mjs:13-15`). For meeting-history it is the Metis-QA zip, which is QA-identity bytes (M2-0497).
   - `check.mjs --release` enforces the run and bytes binding for every candidate-bound row (`scripts/evidence/check.mjs:26-29`).

`rule.fileSha256` is not one of the criteria.

## 3. How this is checked

`check.mjs --release` does not check this registration. A gate row may carry only `id`, `ticket`, `level`, `bytes`, `hosts`, `accept`, `match` and `sha256` (`check.mjs:1039`, `:1051`). A record with an unknown key is rejected (`record.mjs:237-238`).

The link between a record and the rule goes through the record's `output`:
- Each MEASURED growth record sets `output.path` to the verdict file. The verdict is committed under `evidence/raw/M2-0046/` with the leg's `lane.json` beside it (`evidence/SCHEMA.md:118`, `:313-314`).
- Each run gets its own folder, for example one named for the leg and its `ci_run_id`. Every leg writes the same file names (`idle-soak.mjs:276-279`). Rule L15 re-hashes the output of every record, not only the latest one (`check.mjs:426-438`; `evidence/SCHEMA.md:279`). So a re-dispatched leg must never overwrite the first run's files.
- `output.sha256` pins the verdict bytes.
- The lead files no PASS MEASURED record from a verdict that fails §2. At release check, the reviewer opens each recorded verdict and its `lane.json` and checks them against §2. check.mjs cannot see a mismatch, so a mismatch leaves the gate row unmet whatever check.mjs reports.

## 4. Changing a rule

- Any edit to `RULES` fails CI until a reviewed PR updates the pin and says why (`growth-rule.contract.test.ts:7-9`).
- A new pin must be registered before any dispatch runs under it (`growth-rule.contract.test.ts:8-9`).
  - Register it by appending a dated section to this file. The section gives the rule ids, the new sha256, the merged commit and the reason.
  - Earlier sections are never edited.
  - One sha256 covers both rules, so a new section re-keys `IDLE-GROWTH-1` and `MEETING-GROWTH-1` together.
- After this registration the lead may not amend the rules (M2-0488 `summary`). Changing a rule after a verdict exists under it changes a release gate.
  - OD-45 keeps every release check and forbids weakening a gate (`DECISIONS.md:61`). So such a change needs a recorded owner decision (INFERRED).
  - The change never turns an existing verdict into evidence.
- The MEETING-GROWTH-1 producers are not ready yet:
  - M2-0496 and M2-0497 are still TODO (OBSERVED).
  - `meeting-history` is not in the scenario registry or in the workflow's scenario choices on `main` (`.github/workflows/candidate-scenarios.yml:40-47`, OBSERVED).
  - Neither ticket's `scope_paths` includes `growth-rule.mjs` (OBSERVED).
  - The M2-0496 driver passes the meeting's capture start and Stop to `growth.mjs`. The verdict records them, but the pin does not cover them (`growth.mjs:5-6`, `:426`).

## 5. Known margin, and the recomputation

IDLE-GROWTH-1 validity has a fixed time budget:
- It needs at least 300 min measured after the 20-min settle, counted from the first census sample (`growth-rule.mjs:51`, `:115`; `growth.mjs:264`).
- The job records its start time in its first step. The soak deadline is that start plus 355 − 10 min (`.github/workflows/candidate-scenarios.yml:130-132`, `:190-202`; `candidate-scenarios.mjs:144`, `:172`; `idle-soak.mjs:23`, `:30-33`).
- The script fixes the sampling length when it starts. It takes whichever is shorter: 5.5 h, or the time left before the deadline (`candidate-scenarios.mjs:138`, `:166`; `idle-soak.mjs:19`, `:38-44`, `:268`).
- So a leg cannot be valid if more than about 25 min pass between the job start and the start of the soak script, and the app launch time comes out of that 25 min. This is INFERRED by arithmetic.
- An INCOMPLETE or PRECONDITION leg is dispatched once more, and both runs are recorded. A FAIL is not re-run: the candidate does not qualify until there is a fix and a new cut (M2-0492 `acceptance[9]`; OD-45).

The recomputation is read-only and runs no repository code:

```sh
git -C <app clone> show 03a0ca3e:scripts/qa/soak/growth-rule.mjs | python3 -c '
import sys, json, hashlib
s = sys.stdin.read(); a = "export const RULES = deepFreeze("
i = s.index(a) + len(a); j = s.index("\n})\n", i) + 2
c = lambda v: "[" + ",".join(map(c, v)) + "]" if isinstance(v, list) else "{" + ",".join(json.dumps(k) + ":" + c(v[k]) for k in sorted(v)) + "}" if isinstance(v, dict) else json.dumps(v)
print(hashlib.sha256(c(json.loads(s[i:j])).encode()).hexdigest())'
```

The expected output is the registered sha256.
