# Uploaded skill review and scope reconciliation

Reviewed input: `hindsight-agent-memory-skill-v1.0.0(1).zip`.
SHA-256: `ab3d995bab5da188d00b0c560ab9fddfc0624b1989c5b08dbb93fe19aaf9e2ed`.
All 55 members are ordinary files under one safe relative root; no symlink or traversal
member was found. All 54 entries in supplied SHA256SUMS matched their bytes. This is
internal integrity, not a publisher signature or exhaustive security certification.

Reviewed: main skill, security/retain/recall/lifecycle/derived references, relevant
recipes, clients, evidence/schema/package checkers, live-smoke entry, local deployment
examples and test I/O. Unit/fixture tests were run; no downloaded dependency, actual
provider/service, live smoke write, Docker deployment or imported capture hook was run.

| Asset or behavior | Métis disposition |
|---|---|
| Full 55-file original skill and upstream notices | Preserved unchanged as reference; source ZIP also preserved. |
| Generic main entry | Loaded after the active Métis wrapper/profile, not independently registered. |
| Python/Node clients | Reference adapters only. Existing r11 client has different return/cancellation/ID contracts. No automatic swap. |
| Canonical evidence gate | Reuse tests/invariants; real identity/source resolver and async final grant check still required. |
| Direct fixed-bank secret | Server-owned construction only; not authorization. No renderer/agent account keys. |
| Local Compose/.env | Development examples only; excluded from automatic desktop install/startup. |
| Live smoke | Explicit disposable-bank write/update/delete with potential costs. Default refusal tested. Source-text expectations cannot dictate production retention. |
| Framework/coding/MCP recipes | Conditional references; no auto-retain hook or raw service exposure. |
| Reflect/derived/append examples | Defer to real version, source-cohort, deletion and cost qualification; initial Métis projection remains replace/facts-only. |
| General reviewed-conversation option | Narrowed to Métis's already approved canonical kinds; raw transcripts remain excluded. |
| Claimed no original-text storage | Not accepted as blanket fact; official Documents guide explicitly includes raw chunks/original text. |
| `is_stale` / SDK / schema statements | Pinned documentation evidence only. Verify current deployment behavior; do not depend on staleness to prove erasure. |

The general clients intentionally leave host responsibilities open. In particular:
Python socket timeout is not total deadline; JS transport abort depends on actual
transport cooperation; the JS reference has no caller AbortSignal parameter. Existing
stronger r11/application cancellation and quiescence must not regress. Source-ID checks
in fixtures cannot prove real two-user authorization. Whole-envelope validation alone
cannot prevent all prompt injection. These are integration gates, not falsely patched
and certified production controls.

Source URLs are documented, not automatically followed. No scraped credentials,
customer content, proprietary HeyClicky binary or additional model payload is included.
