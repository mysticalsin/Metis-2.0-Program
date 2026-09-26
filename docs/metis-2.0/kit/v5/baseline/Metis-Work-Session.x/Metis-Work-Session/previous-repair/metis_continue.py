#!/usr/bin/env python3
"""Apply and test the Métis r11 delta in a fresh, authenticated local workspace.

This uses the user's existing GitHub CLI authorization, not the chat connector.
prepare: clone + guarded apply only. verify: run local source gates.
publish: rerun those gates, then commit, push a NEW review branch and open a draft PR.
repair: migrate the exact failed v1 checkout, without reset, clone or network.
diagnose: extract a local failure summary; never upload logs.
Never changes a release branch, tags, repository permissions, or live services.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import stat
import tempfile
from contextlib import contextmanager

ROOT = Path(__file__).resolve().parent
DELTA = ROOT / 'delta'
REPOSITORY = 'mysticalsin/AskToto-Mantu'
ORIGIN = 'https://github.com/' + REPOSITORY + '.git'
BASE = '2bf21f1ceefe117838325342574b57852e5cadcb'
REVIEW_BASE = 'main'  # Review staging only; never merge/promote to the release branch.

class Blocked(RuntimeError):
    pass

class CommandFailed(Blocked):
    def __init__(self, args: tuple[str, ...], returncode: int, log: Path | None = None):
        self.command = args
        self.returncode = returncode
        self.log = log
        label = ' '.join(args[:2])
        suffix = f' Inspect local log: {log}' if log else '; no success is claimed.'
        super().__init__(f'{label} failed (exit {returncode}).{suffix}')

def atomic_bytes(path: Path, data: bytes, mode: int = 0o600) -> None:
    """Replace one local file durably; callers must own the workspace exclusively."""
    if path.is_symlink() or any(parent.is_symlink() for parent in path.parents):
        raise Blocked('Refusing a symlink in a write path.')
    fd, temporary = tempfile.mkstemp(prefix='.metis-write-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as out:
            if hasattr(os, 'fchmod'):
                os.fchmod(out.fileno(), mode)
            else:
                os.chmod(temporary, mode)
            out.write(data)
            out.flush()
            os.fsync(out.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)

def atomic_json(path: Path, value: dict) -> None:
    atomic_bytes(path, (json.dumps(value, indent=2) + '\n').encode('utf-8'))

@contextmanager
def workspace_lock(workspace: Path):
    """OS-owned advisory lock releases on process exit; never reclaim another writer."""
    if not workspace.is_dir():
        raise Blocked('Workspace does not exist. Use prepare only for a new checkout.')
    path = workspace / '.metis-bridge.lock'
    if path.is_symlink():
        raise Blocked('Workspace lock must not be a symlink.')
    fd = os.open(path, os.O_CREAT | os.O_RDWR | getattr(os, 'O_NOFOLLOW', 0), 0o600)
    acquired = False
    try:
        if not stat.S_ISREG(os.fstat(fd).st_mode) or os.fstat(fd).st_nlink != 1:
            raise Blocked('Workspace lock must be a private regular file.')
        if os.name == 'nt':
            import msvcrt
            if os.fstat(fd).st_size == 0:
                os.write(fd, b'0')
            os.lseek(fd, 0, os.SEEK_SET)
            try:
                msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)
            except OSError as error:
                raise Blocked('Another bridge operation owns this workspace.') from error
        else:
            import fcntl
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError as error:
                raise Blocked('Another bridge operation owns this workspace.') from error
        acquired = True
        yield
    finally:
        if acquired:
            if os.name == 'nt':
                import msvcrt
                os.lseek(fd, 0, os.SEEK_SET)
                msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
            else:
                import fcntl
                fcntl.flock(fd, fcntl.LOCK_UN)
        os.close(fd)

def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()

def run(*args: str, cwd: Path | None = None, log: Path | None = None, timeout: int = 120) -> str:
    env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    env.update(GIT_TERMINAL_PROMPT='0', GH_PROMPT_DISABLED='1', GH_HOST='github.com')
    command = list(args)
    executable = shutil.which(command[0])
    if executable is None:
        raise Blocked(f'Required executable is missing: {command[0]}')
    command[0] = executable
    if log is not None:
        with os.fdopen(os.open(log, os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os, 'O_NOFOLLOW', 0), 0o600), 'w', encoding='utf-8') as out:
            result = subprocess.run(command, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                    stdout=out, stderr=subprocess.STDOUT, timeout=timeout)
        if result.returncode:
            raise CommandFailed(args, result.returncode, log)
        return ''
    result = subprocess.run(command, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                            capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        # Avoid echoing raw authentication errors, tokens, or provider response bodies.
        raise CommandFailed(args, result.returncode)
    return result.stdout.strip()

def git(repo: Path, *args: str) -> str:
    return run('git', '-C', str(repo), *args)

def gh_api(endpoint: str, expression: str) -> str:
    return run('gh', 'api', '--hostname', 'github.com', endpoint, '--jq', expression)

def git_network(repo: Path, *args: str) -> str:
    return git(repo, '-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', *args)

def auth_check() -> None:
    run('gh', 'auth', 'status', '--hostname', 'github.com')
    permission = gh_api(f'repos/{REPOSITORY}', '.permissions.push')
    if permission != 'true':
        raise Blocked('The authenticated account does not report repository push permission.')
    # This read is NOT evidence that this token can write. Only a successful push is.

def remote_base_check() -> None:
    head = gh_api(f'repos/{REPOSITORY}/git/ref/heads/{REVIEW_BASE}', '.object.sha')
    if head != BASE:
        raise Blocked('Remote main moved beyond this exact-source patch. Reconcile and review; do not force apply.')

def bundle_check() -> dict:
    # Check the original scoped applicator, then let it validate patch and overlay bytes.
    integrity = json.loads((ROOT / 'bundle-integrity.json').read_text('utf-8'))
    for relative, expected in integrity.items():
        path = ROOT / relative
        if path.is_symlink() or not path.is_file() or sha256(path) != expected:
            raise Blocked(f'Bundled file differs: {relative}')
    spec = importlib.util.spec_from_file_location('metis_patch_apply', DELTA / 'tools/apply.py')
    if spec is None or spec.loader is None:
        raise Blocked('Cannot load the guarded patch applicator.')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    manifest, _ = module.load_manifest()
    if manifest.get('base_commit') != BASE or manifest.get('repository') not in (None, REPOSITORY):
        raise Blocked('Unexpected bundle repository or source commit.')
    return manifest

def read_state(workspace: Path, expected_manifest_sha: str | None = None) -> dict:
    path = workspace / 'session.json'
    if path.is_symlink():
        raise Blocked('Session state must not be a symlink.')
    state = json.loads(path.read_text('utf-8'))
    if state.get('base') != BASE or state.get('manifest_sha256') != (expected_manifest_sha or sha256(DELTA / 'manifest.json')):
        raise Blocked('The session does not belong to this exact-source bundle.')
    branch = state.get('branch', '')
    if not re.fullmatch(r'work/metis-r11-[0-9]{8}-[0-9]{6}', branch):
        raise Blocked('Unexpected review branch; release/main branches are not writable targets.')
    return state

def source_check(workspace: Path, manifest: dict, expected_manifest_sha: str | None = None) -> dict:
    state = read_state(workspace, expected_manifest_sha)
    repo = workspace / 'repo'
    if repo.is_symlink() or git(repo, 'rev-parse', '--show-toplevel') != str(repo):
        raise Blocked('Unexpected repository root.')
    if git(repo, 'remote', 'get-url', '--all', 'origin') != ORIGIN:
        raise Blocked('Origin is not the intended repository.')
    if git(repo, 'remote', 'get-url', '--push', '--all', 'origin') != ORIGIN:
        raise Blocked('Push origin is not the intended repository.')
    if git(repo, 'branch', '--show-current') != state['branch'] or git(repo, 'rev-parse', 'HEAD') != BASE:
        raise Blocked('Source HEAD/branch changed. Preserve the checkout and review manually.')
    if git(repo, 'diff', '--cached', '--name-only'):
        raise Blocked('The index already contains staged work; it will not be overwritten.')
    expected = {entry['path'] for entry in manifest['files']}
    changed = {p for p in git(repo, 'diff', '--name-only', '-z', 'HEAD').split('\0') if p}
    untracked = {p for p in git(repo, 'ls-files', '--others', '--exclude-standard', '-z').split('\0') if p}
    if changed | untracked != expected:
        raise Blocked('Checkout changes differ from the exact delta. Preserve the work and review manually.')
    for entry in manifest['files']:
        target = repo / entry['path']
        current = target
        while current != repo:
            if current.is_symlink():
                raise Blocked('Symlink in a changed source path.')
            current = current.parent
        if not target.is_file() or sha256(target) != entry['new_sha256']:
            raise Blocked(f"Changed source bytes: {entry['path']}")
    return state

def prepare(workspace: Path) -> None:
    manifest = bundle_check()
    if workspace.exists():
        raise Blocked('Choose a NEW workspace directory. Existing work will not be overwritten.')
    if ROOT == workspace or ROOT in workspace.parents or workspace in ROOT.parents:
        raise Blocked('The workspace and bridge bundle must be separate, non-nested directories.')
    auth_check()
    remote_base_check()
    branch = 'work/metis-r11-' + dt.datetime.now(dt.timezone.utc).strftime('%Y%m%d-%H%M%S')
    workspace.mkdir(parents=True)
    repo = workspace / 'repo'
    run('git', '-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential',
        'clone', '--no-checkout', '--single-branch', '--branch', REVIEW_BASE,
        '--config', 'core.autocrlf=false', ORIGIN, str(repo), timeout=600)
    if git(repo, 'rev-parse', 'HEAD') != BASE:
        raise Blocked('Source changed while cloning. The clone is preserved; no patch was applied.')
    git(repo, 'switch', '-c', branch, BASE)
    run(sys.executable, str(DELTA / 'tools/apply.py'), '--repo', str(repo), '--check')
    run(sys.executable, str(DELTA / 'tools/apply.py'), '--repo', str(repo), '--apply')
    state = {'schema': 'metis.local-session.v1', 'base': BASE, 'branch': branch,
             'manifest_sha256': sha256(DELTA / 'manifest.json'), 'remote_pushed': False}
    atomic_json(workspace / 'session.json', state)
    source_check(workspace, manifest)
    print(f'APPLIED locally: {len(manifest["files"])} files in {repo}. No commit, push, PR or release.')

def verify(workspace: Path) -> tuple[dict, dict]:
    manifest = bundle_check()
    state = source_check(workspace, manifest)
    repo = workspace / 'repo'
    required = json.loads((repo / 'package.json').read_text('utf-8'))['engines']['node']
    actual = run('node', '--version').removeprefix('v')
    if required != '22.22.3' or actual != required:
        raise Blocked(f'Use the repository-pinned Node {required}; this terminal runs {actual}.')
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    evidence = workspace / ('verification-' + stamp)
    evidence.mkdir()
    gates = [
        ['npm', 'ci'],
        ['npx', '--no-install', 'playwright', 'install', 'chromium'],
        ['npm', 'run', 'typecheck'],
        ['npm', 'run', 'check:bugs'],
        ['npm', 'run', 'build'],
        ['npm', 'test'],
        ['npm', 'run', 'build:operator-client'],
        ['npm', 'run', 'build:operator-world'],
        ['npx', '--no-install', 'vitest', 'run', '--config', 'operator/scripts/vitest.config.ts'],
        ['npm', 'audit', '--audit-level=high'],
        ['node', str(DELTA / 'tools/verify.cjs'), '--repo', str(repo)],
    ]
    outcomes = [{'command': gate, 'status': 'not_run', 'exit': None} for gate in gates]
    result_path = evidence / 'results.json'
    not_verified = ['independent review', 'native packaged builds', 'signing',
                    'physical Mac/Windows journeys', 'live services', 'full r11 product acceptance']
    def save(status: str):
        atomic_json(result_path, {'schema': 'metis.source-verification.v2', 'status': status,
                    'base': BASE, 'manifest_sha256': sha256(DELTA / 'manifest.json'),
                    'gates': outcomes, 'not_verified': not_verified})
    save('running')
    for index, gate in enumerate(gates, 1):
        print(f'Running source gate {index}/{len(gates)}: ' + ' '.join(gate), flush=True)
        log = evidence / f'{index:02d}.log'
        item = outcomes[index - 1]
        item.update(status='running', log=log.name)
        save('running')
        try:
            run(*gate, cwd=repo, log=log, timeout=1800)
        except (Blocked, OSError, subprocess.TimeoutExpired) as error:
            item.update(status='timed_out' if isinstance(error, subprocess.TimeoutExpired) else 'failed',
                        exit=error.returncode if isinstance(error, CommandFailed) else None)
            if log.is_file():
                item['log_sha256'] = sha256(log)
            save('source-gates-failed')
            if log.is_file():
                try:
                    summary = write_failure_summary(log)
                    print(f'Failure summary: {summary}. Review before sharing; no upload was performed.', flush=True)
                except (Blocked, OSError):
                    print('Could not write the local excerpt. The original failed gate/log remains authoritative.', flush=True)
            raise
        item.update(status='passed', exit=0, log_sha256=sha256(log))
        save('running')
    try:
        source_check(workspace, manifest)  # Also rejects generated tracked-file drift.
    except (Blocked, OSError) as error:
        save('source-changed-after-gates')
        raise
    save('source-gates-passed')
    print(f'SOURCE GATES PASSED. Evidence: {evidence}. Not release qualification.')
    return manifest, state

def publish(workspace: Path) -> None:
    auth_check()
    remote_base_check()
    manifest, state = verify(workspace)  # Never trust a previously saved "pass" flag.
    repo = workspace / 'repo'
    branch = state['branch']
    if git_network(repo, 'ls-remote', '--heads', 'origin', f'refs/heads/{branch}'):
        raise Blocked('The remote review branch already exists. No overwrite or force push.')
    remote_base_check()
    paths = [entry['path'] for entry in manifest['files']]
    git(repo, 'add', '--', *paths)
    staged = {p for p in git(repo, 'diff', '--cached', '--name-only', '-z').split('\0') if p}
    if staged != set(paths):
        raise Blocked('Staged files differ from the manifest. Nothing was pushed.')
    git(repo, 'commit', '-m', 'fix(metis): apply r11 source-hardening delta')
    commit = git(repo, 'rev-parse', 'HEAD')
    if git(repo, 'rev-parse', 'HEAD^') != BASE or git(repo, 'status', '--porcelain=v1', '--untracked-files=all'):
        raise Blocked('Commit hooks changed checkout/history. Preserve the local commit; do not push.')
    committed = {p for p in git(repo, 'diff', '--name-only', '-z', BASE, commit).split('\0') if p}
    if committed != set(paths):
        raise Blocked('Committed paths differ from the tested delta. Nothing was pushed.')
    for entry in manifest['files']:
        if sha256(repo / entry['path']) != entry['new_sha256']:
            raise Blocked('Commit hooks changed tested source. Nothing was pushed.')
    git_network(repo, 'push', '--set-upstream', 'origin', f'HEAD:refs/heads/{branch}')
    state.update(push_acknowledged=True, commit=commit, remote_verified=False)
    atomic_json(workspace / 'session.json', state)
    remote_commit = gh_api(f'repos/{REPOSITORY}/git/ref/heads/{branch}', '.object.sha')
    if remote_commit != commit:
        raise Blocked('Remote commit readback does not match. Inspect the remote; do not retry blindly.')
    state.update(remote_pushed=True, remote_verified=True, commit=commit)
    atomic_json(workspace / 'session.json', state)
    body = workspace / 'draft-pr.md'
    body.write_text(
        '## Scope\nApplies the 16-file r11 source-hardening delta to the pinned main baseline.\n\n'
        '## Verification\nLocal source gates passed in the publishing session. '
        'Captured logs remain in the local workspace; independent CI must run.\n\n'
        '## Not a release\nNo release-branch merge, version bump, tag, deployment or signing bypass. '
        'Gateway privacy/read-permission rollout, physical Mac/Windows QA, live integrations, '
        'independent review and the remaining 66-task plan still require qualification.\n', 'utf-8')
    url = run('gh', 'pr', 'create', '--repo', REPOSITORY, '--head', branch, '--base', REVIEW_BASE,
              '--draft', '--title', 'Métis r11 source-hardening delta — review, not release',
              '--body-file', str(body), cwd=repo)
    state['draft_pr'] = url
    atomic_json(workspace / 'session.json', state)
    print(f'PUSHED {commit}. Draft PR: {url}. No merge, deployment or release.')

def write_failure_summary(log: Path) -> Path:
    """Read only a bounded tail and extract likely failure blocks, not a success verdict."""
    if log.is_symlink() or not log.is_file() or any(p.is_symlink() for p in log.parents):
        raise Blocked('Log must be a regular local file without symlink ancestors.')
    maximum = 4 * 1024 * 1024
    size = log.stat().st_size
    with log.open('rb') as source:
        if size > maximum:
            source.seek(-maximum, os.SEEK_END)
        text = source.read(maximum).decode('utf-8', errors='replace')
    # Strip terminal controls before pattern matching or emitting an excerpt.
    text = re.sub(r'\x1b\][^\x07]*(?:\x07|\x1b\\)', '', text)
    text = re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]', '', text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    lines = text.splitlines()
    anchor = re.compile(r'\bFAIL(?:ED)?\b|AssertionError|(?:Type|Syntax|Reference)Error|Unhandled (?:Error|Rejection)|Error:|Test Files|^\s*Tests\s|No test files found|ERR_[A-Z_]+', re.I)
    selected = set(range(max(0, len(lines)-45), len(lines)))
    for index, line in enumerate(lines):
        if anchor.search(line):
            selected.update(range(max(0, index-2), min(len(lines), index+13)))
    picked = sorted(selected)
    clipped = len(picked) > 360
    # Head and tail retain early failures and the final suite verdict.
    if clipped:
        picked = picked[:240] + picked[-120:]
    excerpts = []
    prior = -2
    for index in picked:
        if index != prior + 1:
            excerpts.append('... [non-selected lines omitted] ...')
        excerpts.append(lines[index][:2000])
        prior = index
    excerpt = '\n'.join(excerpts)
    excerpt = re.sub(r'(?i)(authorization|proxy-authorization|cookie|set-cookie)\s*[:=][^\n]*', r'\1: [REDACTED]', excerpt)
    excerpt = re.sub(r'(?i)\bbearer\s+[a-z0-9_.~+/-]+=*', 'Bearer [REDACTED]', excerpt)
    excerpt = re.sub(r'(?i)(?:gh[pousr]_[a-z0-9_]+|github_pat_[a-z0-9_]+|sk-[a-z0-9_-]{8,})', '[REDACTED-TOKEN]', excerpt)
    excerpt = re.sub(r'(?i)((?:api[_-]?key|password|secret|access[_-]?token)\s*[:=]\s*)[^\s,;]+', r'\1[REDACTED]', excerpt)
    excerpt = excerpt.replace(str(Path.home()), '[HOME]')
    summary = log.parent / 'test-failure-summary.txt'
    content = ("METIS LOCAL FAILURE EXCERPT - NOT A COMPLETE TEST VERDICT\n"
               f"Source log: {log.name}; bytes: {size}; SHA-256: {sha256(log)}\n"
               f"Bounded-tail truncation: {size > maximum}; excerpt clipping: {clipped}\n"
               "Reads only this log; does not inspect keyring, .env, or checkout files. No network/upload.\n"
               "Redaction is best effort: REVIEW for personal/customer content before sharing.\n\n" + excerpt + '\n')
    atomic_bytes(summary, content.encode('utf-8'))
    return summary

def diagnose(workspace: Path) -> None:
    """Inspect an existing local log without installing, re-running, or publishing."""
    candidates = sorted(p for p in workspace.glob('verification-*')
                        if re.fullmatch(r'verification-[0-9]{8}T[0-9]{12}Z', p.name))
    for directory in reversed(candidates):
        if directory.is_symlink():
            raise Blocked('Verification directory must not be a symlink.')
        logs = sorted(p for p in directory.glob('*.log') if re.fullmatch(r'[0-9]{2}\.log', p.name))
        if not logs:
            continue
        receipt = directory / 'results.json'
        if receipt.exists():
            if receipt.is_symlink():
                raise Blocked('Verification receipt must not be a symlink.')
            data = json.loads(receipt.read_text('utf-8'))
            if data.get('status') == 'source-gates-passed':
                print(f'Latest source gates passed: {receipt}. No failure is inferred; not release qualification.')
                return
        output = write_failure_summary(logs[-1])
        print(f'LOCAL EXCERPT: {output}. It is not an automatic root-cause diagnosis. Review before sharing.')
        return
    raise Blocked('No local verification logs found; the existing checkout is unchanged.')

def repair(workspace: Path) -> None:
    """Upgrade v1 bytes in-place, preserving checkout/dependencies and an exact backup.

    Partial completion can be resumed only when EVERY declared source file still
    matches an approved old/new hash. No arbitrary edits are ever accepted.
    """
    new = bundle_check()
    previous_path = ROOT / 'upgrade/previous-manifest.json'
    previous = json.loads(previous_path.read_text('utf-8'))
    previous_sha = sha256(previous_path)
    new_sha = sha256(DELTA / 'manifest.json')
    raw_state = workspace / 'session.json'
    if raw_state.is_symlink():
        raise Blocked('Session state must not be a symlink.')
    state_probe = json.loads(raw_state.read_text('utf-8'))
    recorded = state_probe.get('manifest_sha256')
    if recorded == new_sha:
        source_check(workspace, new)
        print('REPAIR ALREADY APPLIED. Checkout unchanged. Full source verification is still required.')
        return
    if recorded != previous_sha or previous.get('base_commit') != BASE:
        raise Blocked('Repair only accepts this bridge v1 session and pinned source.')
    state = read_state(workspace, previous_sha)
    if state.get('remote_pushed') or state.get('push_acknowledged') or state.get('commit'):
        raise Blocked('This repair is for the uncommitted, unpublished v1 checkout only.')
    old_entries = {e['path']: e for e in previous['files']}
    new_entries = {e['path']: e for e in new['files']}
    if set(old_entries) != set(new_entries):
        raise Blocked('Repair does not add/remove source paths; review this migration manually.')
    repo = workspace / 'repo'
    observed_entries = []
    for relative, entry in new_entries.items():
        path = repo / relative
        if path.is_symlink() or any(p.is_symlink() for p in path.parents) or not path.is_file():
            raise Blocked(f'Unsafe or missing repair source: {relative}')
        digest = sha256(path)
        if digest not in (old_entries[relative]['new_sha256'], entry['new_sha256']):
            raise Blocked(f'Unrecognized local edit: {relative}. No source files were changed.')
        observed_entries.append({**entry, 'new_sha256': digest})
    # Validates HEAD, branch, origin, staged and untracked changes before any source write.
    source_check(workspace, {**new, 'files': observed_entries}, previous_sha)
    changed = [e for e in new['files'] if sha256(repo/e['path']) != e['new_sha256']]
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup = workspace / ('repair-' + stamp)
    backup.mkdir(mode=0o700)
    atomic_bytes(backup/'session-before.json', raw_state.read_bytes())
    for entry in changed:
        target = backup / entry['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        atomic_bytes(target, (repo / entry['path']).read_bytes())
    receipt = {'schema': 'metis.bridge-repair.v2', 'status': 'prepared',
               'previous_manifest_sha256': previous_sha, 'new_manifest_sha256': new_sha,
               'changed_paths': [e['path'] for e in changed], 'gates_invalidated': True,
               'remote_pushed': False, 'release_ready': False}
    atomic_json(backup/'repair.json', receipt)
    for entry in changed:
        target = repo / entry['path']
        # Re-check immediately before replacing; work must have a single writer.
        observed = next(e for e in observed_entries if e['path'] == entry['path'])
        if sha256(target) != observed['new_sha256']:
            raise Blocked('Source changed during repair. Preserve the backup; do not reset.')
        atomic_bytes(target, (DELTA/'overlay'/entry['path']).read_bytes(), stat.S_IMODE(target.stat().st_mode))
    # Check new bytes while the old session receipt remains authoritative until commit.
    source_check(workspace, new, previous_sha)
    state.update(manifest_sha256=new_sha, bridge_revision=2, repair_backup=backup.name,
                 source_gates='not_verified_after_repair', remote_pushed=False)
    atomic_json(raw_state, state)
    source_check(workspace, new)
    receipt['status'] = 'applied'
    atomic_json(backup/'repair.json', receipt)
    print(f'REPAIRED locally: {len(changed)} files. Backup: {backup}. No reset, clone, commit, push or release.')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'verify', 'publish', 'repair', 'diagnose'])
    parser.add_argument('--workspace', required=True, type=Path)
    args = parser.parse_args()
    workspace = args.workspace.expanduser().absolute()
    # Reject symlinks before resolution, including any existing ancestor.
    if any(p.is_symlink() for p in [workspace, *workspace.parents]):
        print('STOP: workspace path contains a symlink.', file=sys.stderr)
        return 2
    workspace = workspace.resolve()
    try:
        operation = {'prepare': prepare, 'verify': verify, 'publish': publish,
                     'repair': repair, 'diagnose': diagnose}[args.action]
        if args.action in ('verify', 'publish', 'repair'):
            with workspace_lock(workspace):
                operation(workspace)
        else:
            operation(workspace)
        return 0
    except (Blocked, OSError, ValueError, KeyError, RuntimeError, subprocess.TimeoutExpired) as error:
        print(f'STOP: {error}\nAny existing checkout/local commit is preserved. No automatic reset or retry.', file=sys.stderr)
        return 2

if __name__ == '__main__':
    raise SystemExit(main())
