# Codex + Fable/Claude

The complete collaboration contract is MASTER §33. This folder provides launch instructions and local packet/review transport; it is not a replacement agent runtime or a preconfigured account.

## 1. Start

Open the actual repository in Codex and supply `CODEX-START.txt`. Open a separate approved Claude/Fable session using `FABLE-START.txt`, or use the optional CLI launcher only after its data/configuration prerequisites are met. Resolve the requested real Fable model in that environment. No auto-installation, subscription purchase or credential sharing.

## 2. Source-bound review packets

After committing the intended reviewable slice in a clean dedicated worktree, run `tools/dual_agent.py packet --repo <checkout> --base <base-ref> --task TASK-027.A --context src/shared/relevant-file.ts --out <private-directory-outside-checkout>`. The helper records the actual commit tree and selected context hashes plus a bounded task body. It never includes the entire export or a credential, and never changes repository files. Review source/task content for authorized egress before any model call.

Read `tools/dual_agent.py --help` for all arguments. A dirty tree is a visible refusal, not automatically stashed/reset. Either finish the owned commit or use an isolated clean review worktree. Deleted files are recorded explicitly. Repository links and symlink targets are not traversed.

## 3. Send to the actual second participant

The reliable baseline is two authorized sessions reading the same packet/snapshot. The optional `review` subcommand calls the existing `claude` executable synchronously, never installs it, and requires the exact model, a budget, explicit data-sharing approval and confirmation that hooks/settings were reviewed. It selects read-only tools, denies MCP tools, passes the packet via stdin, requests JSON and disables session persistence. This does not override OS sandbox or managed policy and does not eliminate provider-side retention. Use an approved isolated coding account/workspace.

Examples are parameterized: discover the real checkout/base/model and use an explicit private output directory. `review --help` explains flags. A model name is not evidence that your account can use it. A nonzero exit, missing result, timeout, policy refusal or model mismatch stays a failed or unqualified review. The helper stores no keys.

## 4. Return a review

Fable independently examines actual source and actual test evidence. It returns a review JSON using `REVIEW-FORMAT.json`. `check-review` binds this to the source snapshot; it rejects stale source, packet hashes and contradictory PASS verdicts. It does not certify the reviewer's honesty or establish native/live behavior. In read-only launcher mode, Fable cannot execute tests: its report must say so and recommend the real commands for a separate authorized runner. An independent implementation lane needs its own worktree and authorization.

## 5. Keep the distinction

Packet validation is not product verification. CLI exit zero is not a clean review. A clean review is not an E2E pass. An E2E pass on an unsigned build is not a signed release. The lead closes the actual acceptance gates in MASTER §§20, 26–27 and 33.


## Reproducible local handoff commands

These commands run in a shell that already has the real authorized checkout and Python. Replace the example paths with actual private paths. Creating a packet does not contact Claude. Review requires a clean committed worktree; preserve dirty work rather than reset it.

```sh
python3 tools/dual_agent.py packet --repo /actual/AskToto-Mantu --base HEAD~1 --task TASK-027 --context src/shared/metis-command-session.ts --out /private/metis-review/task-027-v1
python3 tools/dual_agent.py check-review --repo /actual/AskToto-Mantu --packet /private/metis-review/task-027-v1/packet.json --review /private/metis-review/task-027-v1-review.json
```

Use `python3 tools/dual_agent.py review --help` for the optional actual CLI invocation. Codex must resolve the real allowed model, explicit spend budget and approved CLI configuration before passing the required authorization flags. The tool makes no install or configuration changes. It records the actual CLI response separately; validate the reviewed content afterward. The source-reader and packet tools are engineering utilities, not production agent services.
