# Start real Métis implementation work

This package contains an actual four-file onboarding improvement and a foreground
launcher for a real installed Codex or Claude Code session. It is not an installer
and does not itself complete the 2.0 upgrade.

## Tony: one entry point

Extract this ZIP. Inside the extracted `Metis-Work-Session` folder, double-click
**START-METIS-WORK.command**.

The script finds its own location (Downloads folder name does not matter), verifies
its inputs and your existing `$HOME/metis-r11-work/repo`, and starts an installed
Codex, or Claude Code if Codex is not found. It reuses your existing coding-agent
account and usage. GitHub CLI authentication alone is not coding-agent authentication;
follow any normal sign-in/approval prompt inside that agent. Do not paste tokens here.

The foreground agent receives the complete implementation job, the real local test-log
location, the unmodified original r11 kit, the previous v2 repair, and the new source/tests.
Its task is to diagnose/fix the actual suite, integrate/review the new controls, safely
open an isolated development preview, and continue the full plan in verified slices.

Watch the Terminal coding-agent interface. It is not a button inside the installed
Métis app, and the installed app will not change merely because the launcher opened.
The local agent must actually build and validate the application. Approve only expected
operations. The launcher does not detach a daemon or run scheduled/background jobs.

Do not run `prepare` again. Do not repeatedly run the old `publish` command after adding
new application code: its exact-source hash gate correctly rejects the larger scope.
The agent takes over a normal reviewable Git workflow; no force push or automatic release.

If double-clicking does not open Terminal, open Terminal, type `/bin/zsh ` (including
the trailing space), drag START-METIS-WORK.command into the Terminal window, then press
Enter. This uses its actual path. Do not change macOS security settings or remove
quarantine recursively. If macOS asks for a normal explicit file-open approval, review
the script and use your normal approval process.

## What the launcher does NOT do

It does not read the keychain, print tokens, broaden GitHub permissions, install new
coding tools, overwrite existing files, modify the app profile, force/reset Git,
spawn pretend reviewers, or automatically deploy/publish a release. No local agent
has been started by this chat. It stops if no suitable installed agent is available.

The launcher uses Codex workspace-write/on-request approvals or Claude default
permissions. It checks the installed CLI's actual help flags instead of assuming an
unsupported configuration. Repository identity and output are checked without printing
credential-bearing remote URLs. Existing unstaged AND staged edits are preserved.
An OS-owned cooperative lock prevents concurrent old-bridge and launcher writes; it
does not claim to control unrelated editors or arbitrary external processes.

## Inspect without starting an agent

From this extracted folder:
`python3 start_metis_work.py --check`

Explicit selection:
`python3 start_metis_work.py --agent claude`
or `--agent codex`. A deliberately selected executable can be supplied with
`--agent-executable /absolute/path`. Shell expressions are not evaluated.

This launcher targets Tony's macOS workflow (fcntl/Terminal), not native Windows.
The source improvement retains the cross-platform application structure.

## Contents and evidence

- `onboarding-update`: real application source, patch, native test and executed
  isolated/browser evidence; see its README for boundaries.
- `previous-repair`: original v2 repair, preserved unchanged.
- `r11-kit`: complete original user-supplied scope/plan/reference files. Their historical
  mocks/previews/exports are references only, not production implementations or tests.
- `LOCAL-AGENT-INSTRUCTIONS.md`: the job actually passed to the local agent.
- `IMPLEMENTATION-REPORT.md`: this session's changes, results and limitations.
- `evidence`: launcher tests and previous-repair regression checks.
- `CONTENT-SHA256.json`: integrity check against accidental altered bundle inputs;
  this is a checksum manifest, not a publisher signature or proof of trusted signing.

If no supported local CLI is found, the script stops without changing the checkout.
Open LOCAL-AGENT-INSTRUCTIONS.md in an already authenticated coding editor against
the existing repo. No Fable executable is assumed and no new service is provisioned.

Official CLI references checked on September 24, 2026:
https://developers.openai.com/codex/cli/reference
https://code.claude.com/docs/en/cli-reference
