"""Validate this portable skill's structure, references, text assets and size; no network."""
from __future__ import annotations
import ast
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
LIMIT_BYTES = 5_000_000


def files(root: Path):
    return sorted(p for p in root.rglob('*') if p.is_file()
                  and '__pycache__' not in p.parts and p.suffix != '.pyc')


def validate(root: Path = ROOT) -> dict:
    problems = []
    for path in root.rglob('*'):
        if path.is_symlink():
            problems.append(f'symlink forbidden: {path.relative_to(root)}')
    items = files(root)
    total = sum(p.stat().st_size for p in items)
    if total >= LIMIT_BYTES:
        problems.append('extracted skill is not below 5,000,000 bytes')
    main = root / 'SKILL.md'
    if not main.exists():
        problems.append('missing root SKILL.md')
    else:
        text = main.read_text()
        match = re.match(r'^---\n(.*?)\n---\n', text, flags=re.S)
        if not match:
            problems.append('missing YAML frontmatter delimiters')
        else:
            for key in ('name', 'description'):
                if not re.search(r'^' + key + r':\s*\S', match[1], re.M):
                    problems.append(f'missing frontmatter {key}')
        if len(text) > 15_000:
            problems.append('entry point is too large for intended progressive disclosure')
    for path in items:
        rel = path.relative_to(root)
        if path.name in ('.env', 'id_rsa', 'id_ed25519') or path.suffix in ('.pem', '.key', '.p12'):
            problems.append(f'potential secret file: {rel}')
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeError:
            problems.append(f'unexpected binary file: {rel}')
            continue
        if path.suffix == '.py':
            try:
                ast.parse(text)
            except SyntaxError:
                problems.append(f'Python syntax error: {rel}')
        if path.suffix == '.json':
            try:
                json.loads(text)
            except ValueError:
                problems.append(f'invalid JSON: {rel}')
        if path.suffix == '.jsonl':
            for line_no, line in enumerate(text.splitlines(), 1):
                try:
                    json.loads(line)
                except ValueError:
                    problems.append(f'invalid JSONL: {rel}:{line_no}')
        if path.suffix == '.md':
            # Check package-root inline-code paths and actual relative Markdown links.
            for target in re.findall(r'`((?:references|recipes|scripts|templates|sources)/[^`\s]+)`', text):
                if '*' not in target and not (root / target).exists():
                    problems.append(f'broken package reference: {rel} -> {target}')
            for target in re.findall(r'\]\(([^)]+)\)', text):
                if not re.match(r'^(https?://|mailto:|#)', target):
                    clean=target.split('#')[0]
                    if clean and not (path.parent / clean).exists():
                        problems.append(f'broken local Markdown link: {rel} -> {target}')
    required = ['README.md','VERIFICATION.md','sources/coverage.md','sources/manifest.json',
                'scripts/memory_client.py','scripts/memory_client.mjs','scripts/live_smoke.py',
                'scripts/evidence_gate.py','scripts/check_schema.py','templates/memory-contract.json']
    for item in required:
        if not (root / item).is_file():
            problems.append(f'missing required asset: {item}')
    return {'passed': not problems, 'file_count': len(items), 'extracted_bytes': total,
            'limit_bytes': LIMIT_BYTES, 'problems': problems,
            'scope': 'Offline structure/text/syntax checks only; no native deployment tested.'}


if __name__ == '__main__':
    report = validate()
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['passed'] else 1)
