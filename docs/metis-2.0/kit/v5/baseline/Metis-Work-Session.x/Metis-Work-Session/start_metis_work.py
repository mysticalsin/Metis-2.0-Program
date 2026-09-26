#!/usr/bin/env python3
"""Start an installed coding agent in Tony's existing Métis checkout.
No cloning, patching, credential access, forced updates, or background process.
"""
from __future__ import annotations
import argparse
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import stat
import sys
from typing import Iterator

EXPECTED_REPO = "mysticalsin/AskToto-Mantu"
BUNDLE = Path(__file__).resolve().parent

class Stop(RuntimeError):
    pass

def output(argv: list[str], cwd: Path | None = None) -> str:
    try:
        result = subprocess.run(argv, cwd=cwd, text=True, capture_output=True,
                                timeout=20, check=False)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise Stop(f"Cannot run {Path(argv[0]).name} for this check.") from exc
    if result.returncode:
        # Do not echo raw errors: remote URLs or CLI config output can contain credentials.
        raise Stop(f"{Path(argv[0]).name} check failed (exit {result.returncode}).")
    return result.stdout.strip()

def trusted_origin(raw: str) -> bool:
    return raw.lower().rstrip("/") in {
        f"https://github.com/{EXPECTED_REPO.lower()}",
        f"https://github.com/{EXPECTED_REPO.lower()}.git",
        f"git@github.com:{EXPECTED_REPO.lower()}",
        f"git@github.com:{EXPECTED_REPO.lower()}.git",
        f"ssh://git@github.com/{EXPECTED_REPO.lower()}",
        f"ssh://git@github.com/{EXPECTED_REPO.lower()}.git"
    }

def inspect_repo(repo: Path) -> dict[str, str]:
    if not repo.is_dir():
        raise Stop(f"The existing checkout was not found at {repo}. Nothing was created or removed.")
    repo = repo.resolve()
    git = shutil.which("git")
    if not git:
        raise Stop("Git was not found in this terminal's PATH.")
    actual = Path(output([git, "-C", str(repo), "rev-parse", "--show-toplevel"])).resolve()
    if actual != repo:
        raise Stop("The selected folder is not the Git repository root.")
    for args in (
        ["config", "--get-all", "remote.origin.url"],
        ["remote", "get-url", "--push", "--all", "origin"]
    ):
        urls = output([git, "-C", str(repo), *args]).splitlines()
        if len(urls) != 1 or not trusted_origin(urls[0]):
            raise Stop("Origin does not identify the expected Métis GitHub repository. No changes made.")
    head = output([git, "-C", str(repo), "rev-parse", "HEAD"])
    if len(head) != 40 or any(c not in "0123456789abcdef" for c in head):
        raise Stop("Unexpected Git commit identity.")
    status = output([git, "-C", str(repo), "status", "--porcelain=v1", "--untracked-files=normal"])
    return {"root": str(repo), "head": head,
            "changed_paths": str(len(status.splitlines()) if status else 0)}

def verify_bundle(folder: Path) -> None:
    manifest = json.loads((folder / "CONTENT-SHA256.json").read_text(encoding="utf-8"))
    for relative, expected in manifest["files"].items():
        path = folder / relative
        if Path(relative).is_absolute() or ".." in Path(relative).parts:
            raise Stop("Invalid bundle manifest path.")
        if path.is_symlink() or not path.is_file() or folder.resolve() not in path.resolve().parents:
            raise Stop(f"Required bundle file unavailable: {relative}")
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise Stop(f"Bundle checksum mismatch: {relative}. Use an unchanged copy.")

def find_agent(requested: str, executable: str | None) -> tuple[str, str]:
    choices = ["codex", "claude"] if requested == "auto" else [requested]
    if executable:
        if requested == "auto":
            raise Stop("Choose --agent codex or --agent claude with --agent-executable.")
        path = Path(executable).expanduser().resolve()
        if not path.is_file() or not os.access(path, os.X_OK):
            raise Stop("The chosen agent executable is not executable.")
        return requested, str(path)
    for name in choices:
        detected = shutil.which(name)
        if detected:
            return name, detected
        # Named executable locations only; never inspect credential stores or scan the home directory.
        for base in (Path.home()/".local/bin", Path("/opt/homebrew/bin"), Path("/usr/local/bin")):
            candidate = base/name
            if candidate.is_file() and os.access(candidate, os.X_OK):
                return name, str(candidate)
    raise Stop(
        "No Codex or Claude Code executable was found. Open LOCAL-AGENT-INSTRUCTIONS.md "
        "inside an already authenticated coding editor at the existing repo. "
        "This launcher has not started an agent or changed the app."
    )

def agent_command(name: str, executable: str, repo: Path, prompt: str, help_text: str) -> list[str]:
    required = ["--sandbox", "--ask-for-approval", "--cd"] if name == "codex" else ["--permission-mode"]
    if any(flag not in help_text for flag in required):
        raise Stop("The installed agent CLI does not advertise the required permission flags. No agent started.")
    if name == "codex":
        return [executable, "--sandbox", "workspace-write", "--ask-for-approval",
                "on-request", "--cd", str(repo), prompt]
    if name == "claude":
        return [executable, "--permission-mode", "default", prompt]
    raise Stop("Unsupported agent.")

@contextlib.contextmanager
def foreground_lock(workspace: Path) -> Iterator[None]:
    path = workspace / ".metis-bridge.lock"
    fd = os.open(path, os.O_CREAT | os.O_RDWR | getattr(os, "O_NOFOLLOW", 0), 0o600)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_nlink != 1:
            raise Stop("Workspace lock is not an owned regular file.")
        if stat.S_IMODE(info.st_mode) & 0o077:
            raise Stop("Workspace lock is not private. No permissions were changed.")
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise Stop("A bridge operation or coding session already owns this workspace.") from exc
        yield
    finally:
        os.close(fd)

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=Path.home()/"metis-r11-work")
    parser.add_argument("--agent", choices=["auto", "codex", "claude"], default="auto")
    parser.add_argument("--agent-executable", help="Explicit installed executable; never a shell expression")
    parser.add_argument("--check", action="store_true", help="Check inputs only; do not start an agent")
    args = parser.parse_args(argv)
    if sys.version_info < (3, 10):
        raise Stop("Python 3.10 or newer is required.")
    verify_bundle(BUNDLE)
    workspace = args.workspace.expanduser().resolve()
    repo = workspace / "repo"
    facts = inspect_repo(repo)
    name, executable = find_agent(args.agent, args.agent_executable)
    help_text = output([executable, "--help"], cwd=repo)
    # The prompt contains paths and instructions only, never logs, keychain values, or tokens.
    prompt = (
        f"Work on the EXISTING Metis repository at {repo}. "
        f"Read the complete job at {BUNDLE / 'LOCAL-AGENT-INSTRUCTIONS.md'} and execute it. "
        f"The supplied source update is at {BUNDLE / 'onboarding-update'}. "
        f"The complete original r11 plan is at {BUNDLE / 'r11-kit'}. "
        f"Current observed HEAD is {facts['head']}; preserve all existing changes. "
        "Start with the real local failing test log, then integrate and test the supplied improvement, "
        "and continue the plan in verified slices. Do not stop at planning or at a draft PR. "
        "No forced resets, approval bypass, automatic production deployment, or invented subagents. "
        "Show actual work and keep this session interactive."
    )
    command = agent_command(name, executable, repo, prompt, help_text)
    print(f"Existing repo: {facts['root']}\nCommit: {facts['head']}\n"
          f"Locally changed paths: {facts['changed_paths']} (preserved)\n"
          f"Selected installed agent: {name}", flush=True)
    if args.check:
        print("Checks complete. No agent started and no application files changed.", flush=True)
        return 0
    if not sys.stdin.isatty() or not sys.stdout.isatty():
        raise Stop("Open this launcher in Terminal: the coding agent needs an interactive approval interface.")
    print("Starting a visible coding session in this checkout. Approve only operations you expect.\n"
          "This uses your existing coding-agent account/usage. No unattended permissions are enabled.\n"
          "Ctrl+C can interrupt the session. The launcher does not create a daemon or scheduled job.", flush=True)
    with foreground_lock(workspace):
        # Inherit the terminal; never capture/store the transcript, run a shell, or detach the child.
        return subprocess.run(command, cwd=repo, check=False).returncode

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrupted. Existing checkout and logs have been preserved.", file=sys.stderr)
        sys.exit(130)
    except (Stop, OSError, ValueError, KeyError) as exc:
        print(f"\nSTOP: {exc}", file=sys.stderr)
        sys.exit(2)
