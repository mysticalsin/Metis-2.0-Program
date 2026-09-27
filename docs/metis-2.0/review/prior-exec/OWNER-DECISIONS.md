# Owner decisions (Tony) — dated, as answered in-session (AskUserQuestion / messages)

| Date | Decision | Source | Scope |
|---|---|---|---|
| 2026-09-23 | Publish 1.9.6 as a public unsigned prerelease ("release them with no signature for now") | AskUserQuestion "Release path" = "Public unsigned prerelease" + message | Owner exception to docs/SIGNING.md:29 for v1.9.6-unsigned only (prerelease, not Latest, no latest*.yml) |
| 2026-09-24 | "figure out the windows part" | stop-hook message | Windows public signing investigation + build |
| 2026-09-24 | Windows public signing route = Microsoft Artifact Signing (Public Trust), publisher entity MANTU GROUP SA | AskUserQuestion "Win signing" | TASK-063/064 signing lane; blocker #16 route chosen (provisioning still owner/IT) |
| 2026-09-24 | Shipping line = main 1.9.6 + RightEdgeSidecar; PR #194 dock lane ported deliberately, not merged wholesale | AskUserQuestion "Ship line" | Blocker #11 resolved; TASK-027.A/028.A target main's RightEdgeSidecar (reconcile B3/B5) |
