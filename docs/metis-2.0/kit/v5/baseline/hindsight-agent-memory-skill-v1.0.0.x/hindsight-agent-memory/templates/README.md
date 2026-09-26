# Template use

`memory-contract.json` is application policy, **not a native Hindsight API body**.
Complete the source, retention and identity choices before real data is uploaded.
`bank-config.example.json` contains a small candidate native config patch. Read current
config, verify supported fields, get permission and reconcile it before applying. It
enables future sensitive-data redaction and recall-only MCP; it does not implement ACLs,
retroactive cleaning or full DLP. No script in this package applies it automatically.

`compose.local.yaml` is a local development example, not a tested production deployment.
Choose a verified full Hindsight image tag/digest, supported provider/model and secret
values. Do not place a real `.env` inside this skill when sharing or uploading it.

`acceptance-matrix.csv` and `eval-cases.jsonl` are proposed tests; they are NOT evidence
that those scenarios passed. Record actual outcomes in the target project's test report.
`implementation-handoff.md` records actual deployment evidence and remaining gates.
