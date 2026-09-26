#!/usr/bin/env python3
"""Validate/apply this scoped patch. No network, branch creation, push, release or reset.
Unpack the bundle OUTSIDE the target checkout. The checkout must be exclusively
owned by the applying worker, clean, at the pinned SHA and have matching LF bytes.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import tempfile

BUNDLE = Path(__file__).resolve().parents[1]

class Rejected(RuntimeError):
    pass

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def blob_digest(data: bytes) -> str:
    return hashlib.sha1(b'blob ' + str(len(data)).encode('ascii') + b'\0' + data).hexdigest()

def git(repo: Path, *args: str) -> str:
    # These operations are local. Do not let inherited Git routing/config variables
    # redirect a shadow validation or a write to a different repository/index.
    env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    result = subprocess.run(['git', '-C', str(repo), *args], capture_output=True, text=True,
                            check=False, timeout=30, env=env)
    if result.returncode:
        raise Rejected(f"git {' '.join(args[:2])} failed (exit {result.returncode}): {result.stderr.strip()}")
    return result.stdout.strip()

def path_inside(root: Path, relative: str) -> Path:
    value = PurePosixPath(relative)
    if value.is_absolute() or not value.parts or any(p in ('..', '.', '.git') for p in value.parts) or '\\' in relative:
        raise Rejected('Unsafe manifest path')
    current = root
    for segment in value.parts:
        current = current / segment
        if current.is_symlink():
            raise Rejected(f'Symlink at target path: {relative}')
    if root not in current.resolve().parents:
        raise Rejected('Target escaped its checkout')
    return current

def load_manifest() -> tuple[dict, Path]:
    manifest = json.loads((BUNDLE / 'manifest.json').read_text('utf-8'))
    if manifest.get('schema') != 'metis.scoped-patch.v1':
        raise Rejected('Unsupported manifest schema')
    patch = path_inside(BUNDLE, manifest['patch']['path'])
    raw = patch.read_bytes()
    if digest(raw) != manifest['patch']['sha256']:
        raise Rejected('Patch integrity mismatch')
    paths = [entry['path'] for entry in manifest['files']]
    if len(paths) != len(set(paths)):
        raise Rejected('Duplicate manifest paths')
    headers = re.findall(r'^diff --git a/([^\n]+) b/([^\n]+)$', raw.decode('utf-8'), re.MULTILINE)
    if [a for a, b in headers if a == b] != paths or any(a != b for a, b in headers):
        raise Rejected('Patch changes paths outside its declared manifest')
    for entry in manifest['files']:
        payload = path_inside(BUNDLE / 'overlay', entry['path'])
        if digest(payload.read_bytes()) != entry['new_sha256']:
            raise Rejected(f"Overlay integrity mismatch: {entry['path']}")
    return manifest, patch

def verify_checkout(repo: Path, manifest: dict) -> None:
    if git(repo, 'rev-parse', '--show-toplevel') != str(repo):
        raise Rejected('--repo must identify the repository root')
    if git(repo, 'rev-parse', 'HEAD') != manifest['base_commit']:
        raise Rejected('Repository HEAD differs from the pinned source. Rebase and review; do not force apply.')
    if git(repo, 'status', '--porcelain=v1', '--untracked-files=all'):
        raise Rejected('Checkout is not clean. Keep this bundle outside it; preserve existing work.')
    for entry in manifest['files']:
        target = path_inside(repo, entry['path'])
        old = entry.get('old_git_blob')
        if old is None:
            if target.exists():
                raise Rejected(f"New-file collision: {entry['path']}")
        else:
            if not target.is_file() or blob_digest(target.read_bytes()) != old:
                raise Rejected(f"Source bytes differ: {entry['path']}. Use a clean LF checkout; no automatic normalization is performed.")
            if git(repo, 'rev-parse', f"HEAD:{entry['path']}") != old:
                raise Rejected(f"Committed blob differs: {entry['path']}")

def verify_shadow(repo: Path, manifest: dict, patch: Path) -> None:
    # Before any user-file write, prove that this exact patch creates the declared
    # output bytes in an isolated scope fixture. This is not an application build.
    with tempfile.TemporaryDirectory(prefix='metis-r11-patch-') as directory:
        shadow = Path(directory).resolve()
        git(shadow, 'init', '-q')
        for entry in manifest['files']:
            if entry.get('old_git_blob') is not None:
                target = path_inside(shadow, entry['path'])
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(path_inside(repo, entry['path']).read_bytes())
        git(shadow, 'apply', '--check', '--whitespace=error', str(patch))
        git(shadow, 'apply', '--whitespace=error', str(patch))
        for entry in manifest['files']:
            if digest(path_inside(shadow, entry['path']).read_bytes()) != entry['new_sha256']:
                raise Rejected(f"Patch output mismatch: {entry['path']}")

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True, type=Path)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true', help='Read/check only; do not apply')
    mode.add_argument('--apply', action='store_true', help='Apply after checks; do not stage or commit')
    args = parser.parse_args()
    repo = args.repo.expanduser().resolve()
    lock: Path | None = None
    try:
        manifest, patch = load_manifest()
        verify_checkout(repo, manifest)
        verify_shadow(repo, manifest, patch)
        git(repo, 'apply', '--check', '--whitespace=error', str(patch))
        if args.check:
            print(f"PASS: {len(manifest['files'])} scoped files; patch applies to pinned clean source. No checkout writes.")
            return 0
        lock_path = Path(git(repo, 'rev-parse', '--git-path', 'metis-r11-apply.lock'))
        lock_path = lock_path if lock_path.is_absolute() else repo / lock_path
        fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        lock = lock_path
        with os.fdopen(fd, 'w') as handle:
            handle.write(f'pid={os.getpid()}\n')
        verify_checkout(repo, manifest)
        git(repo, 'apply', '--check', '--whitespace=error', str(patch))
        git(repo, 'apply', '--whitespace=error', str(patch))
        for entry in manifest['files']:
            if digest(path_inside(repo, entry['path']).read_bytes()) != entry['new_sha256']:
                raise Rejected('Post-apply bytes changed concurrently. Preserve the worktree and inspect; do not reset automatically.')
        print(f"APPLIED: {len(manifest['files'])} scoped files. Unstaged; not committed, pushed, deployed or released.")
        return 0
    except (Rejected, OSError, ValueError, KeyError, subprocess.TimeoutExpired) as error:
        print(f'REFUSED: {error}', file=sys.stderr)
        return 2
    finally:
        if lock is not None:
            lock.unlink(missing_ok=True)

if __name__ == '__main__':
    raise SystemExit(main())
