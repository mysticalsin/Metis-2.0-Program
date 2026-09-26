"""Read-only package/profile integrity checks. No installation, network or runtime activation.

Passing validates this handoff's declared constraints and bytes, NOT real authentication,
Hindsight behavior, customer data permission, native capture, deployment or readiness.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
from typing import Any

ROOT = Path(__file__).resolve().parents[1]

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def load(root: Path, rel: str) -> Any:
    return json.loads((root / rel).read_text(encoding='utf-8'))

def safe_relative(value: object) -> bool:
    if not isinstance(value, str) or not value or '\\' in value:
        return False
    p = PurePosixPath(value)
    return not p.is_absolute() and '..' not in p.parts and value == p.as_posix()

def contract_errors(c: dict[str, Any]) -> list[str]:
    """Validate conservative initial example policy only, not the deployed policy."""
    expected = {
        'role': 'advisory', 'state': 'disabled_until_qualified', 'not_runtime_configuration': True,
        'product.note_taker_preserved': True,
        'product.keyboard_toggle_is_memory_trigger': False,
        'product.command_audio_is_meeting_audio': False,
        'product.memory_failure_stops_meeting': False,
        'product.memory_failure_stops_shortcuts': False,
        'product.memory_failure_stops_deterministic_actions': False,
        'identity.model_selects_bank': False, 'identity.tags_are_authorization': False,
        'identity.homogeneous_acl_required': True, 'identity.agent_rename_changes_identity': False,
        'capture.after_canonical_commit': True, 'capture.automatic_turn_capture': False,
        'capture.requires_source_memory_permission': True,
        'capture.outbox': 'existing_metadata_only_source_reference_outbox',
        'capture.update_mode': 'replace', 'capture.append_enabled': False,
        'retrieval.needed_only': True, 'retrieval.tags_match': 'all_strict',
        'retrieval.nonempty_server_scope_required': True,
        'retrieval.canonical_source_revalidation': True, 'retrieval.final_audience_epoch_recheck': True,
        'retrieval.memory_can_authorize_action': False,
        'lifecycle.tombstone_before_purge': True, 'lifecycle.forget_deletes_original_meeting': False,
        'lifecycle.derived_invalidation_required': True, 'lifecycle.backup_restore_respects_tombstones': True,
        'lifecycle.unknown_write': 'quarantine_and_reconcile_before_retry',
        'deployment.location': 'existing_private_server_service', 'deployment.desktop_database': False,
        'deployment.raw_client_mcp': False, 'deployment.auto_start_compose': False,
        'deployment.live_smoke_auto_run': False, 'deployment.native_reflect_enabled': False,
        'deployment.observations_enabled': False, 'deployment.mental_models_enabled': False,
        'deployment.knowledge_pages_enabled': False, 'deployment.customer_data_ready': False,
        'jev.uses_revalidated_evidence_only': True, 'jev.decision_can_retain_memory': False,
        'jev.credential_shared_implicitly': False, 'jev.reranker_requires_separate_route_qualification': True,
        'jev.memory_required_for_local_stop': False, 'jev.laya_only_enables_jev_rerank': False,
    }
    problems: list[str] = []
    def get(path: str) -> Any:
        value: Any = c
        for key in path.split('.'):
            if not isinstance(value, dict) or key not in value:
                return object()
            value = value[key]
        return value
    for path, wanted in expected.items():
        actual = get(path)
        if type(actual) is not type(wanted) or actual != wanted:
            problems.append('profile constraint: ' + path)
    for key, cap in {'max_recall_calls_per_relevant_turn': 1, 'max_candidates': 32,
                     'max_items': 8, 'max_envelope_bytes': 12000}.items():
        value = get('retrieval.' + key)
        if type(value) is not int or not 0 < value <= cap:
            problems.append('profile budget: ' + key)
    if get('capture.allowed_kinds') != ['approved_summary', 'approved_preference', 'verified_action_receipt']:
        problems.append('profile allowed kinds')
    required_exclusions = {'raw_audio','raw_transcript','partial_transcript','screenshot','credentials',
                           'unexecuted_plan','unreviewed_model_output'}
    excluded = get('capture.excluded_kinds')
    if not isinstance(excluded, list) or not all(isinstance(x, str) for x in excluded) or not required_exclusions.issubset(excluded):
        problems.append('profile excluded kinds')
    if get('retrieval.types') != ['world', 'experience']:
        problems.append('profile facts-only types')
    for key in ('endpoint','server_version','schema_hash','credential_binding'):
        if get('deployment.' + key) is not None:
            problems.append('example unexpectedly configured: ' + key)
    if get('lifecycle.retention_days') is not None or get('lifecycle.retention_policy_owner') is not None:
        problems.append('example must not invent retention approval')
    return problems

def validate(root: Path = ROOT) -> dict[str, Any]:
    root = root.resolve()
    errors: list[str] = []
    metrics: dict[str, Any] = {}
    if any(p.is_symlink() for p in root.rglob('*')):
        return {'schema':'metis.hindsight.package-check.v1','passed':False,'metrics':{},
                'errors':['package symlinks forbidden'],
                'scope':'No symlink contents read. Offline package check only.'}
    try:
        errors += contract_errors(load(root, 'memory/METIS-MEMORY-CONTRACT.example.json'))
        registry = load(root, 'skills/REGISTRY.json')
        active = 'skills/metis-hindsight-memory/SKILL.md'
        if registry.get('active_entrypoints') != [active] or registry.get('auto_capture') is not False or registry.get('auto_install') is not False:
            errors.append('only the inactive-by-default Metis wrapper may be registered')
        for key in ('profile','general_skill','original_zip'):
            rel = registry.get(key)
            if not safe_relative(rel) or not (root / rel).is_file():
                errors.append('missing or unsafe registry reference: ' + key)
        skill = root / 'skills/metis-hindsight-memory'
        if any(p.is_symlink() for p in skill.rglob('*')):
            errors.append('skill symlinks forbidden')
        files = [p for p in skill.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc']
        metrics['adapted_skill_bytes'] = sum(p.stat().st_size for p in files)
        if metrics['adapted_skill_bytes'] >= 5_000_000:
            errors.append('adapted skill exceeds size budget')
        for rel in (active, registry.get('profile','')):
            if not safe_relative(rel) or not (root / rel).is_file(): errors.append('entry/profile missing')
        inventory = load(root, 'memory/evidence/uploaded-skill-inventory.json')
        upstream = skill / 'reference/hindsight-agent-memory'
        entries = inventory['all_files']
        metrics['supplied_skill_files'] = len(entries)
        if len(entries) != 55:
            errors.append('original 55-file inventory changed')
        for rel, digest in entries.items():
            if not safe_relative(rel):
                errors.append('unsafe upstream reference'); continue
            p = upstream / rel
            if not p.is_file() or p.is_symlink() or sha(p.read_bytes()) != digest:
                errors.append('upstream bytes differ: ' + rel)
        actual = {p.relative_to(upstream).as_posix() for p in upstream.rglob('*')
                  if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc'}
        if actual != set(entries): errors.append('upstream inventory differs')
        z = root / 'baseline/hindsight-agent-memory-skill-v1.0.0.zip'
        if sha(z.read_bytes()) != inventory['source_zip_sha256']:
            errors.append('original upload ZIP hash differs')
        original_exp = load(root, 'memory/evidence/original-EXPANSION.json')
        mapped = load(root, 'memory/HMSTEP-SKILL-CROSSWALK.json')['steps']
        originals = {s['id']:s for s in original_exp['steps']}
        if len(mapped) != 16 or {s['id'] for s in mapped} != set(originals):
            errors.append('all 16 original memory steps required')
        for row in mapped:
            o = originals.get(row['id'],{})
            for oldkey, newkey in [('title','original_title'),('tasks','original_tasks'),('depends_on','original_dependencies'),('gates','original_gates'),('acceptance','original_acceptance')]:
                if o.get(oldkey) != row.get(newkey): errors.append('original step changed: '+row['id']+'/'+oldkey)
            for rel in row.get('skill_read_paths',[]):
                if not safe_relative(rel) or not (upstream / rel).is_file(): errors.append('bad progressive-read path')
        metrics['memory_steps_mapped'] = len(mapped)
        roots = load(root,'delivery/R11-TASK-CROSSWALK.json')['tasks']
        oldroots = load(root,'memory/evidence/previous-v4/delivery/R11-TASK-CROSSWALK.json')['tasks']
        if len(roots) != 66 or {t['id'] for t in roots} != {t['id'] for t in oldroots}:
            errors.append('66 root tasks not preserved')
        previous = {t['id']:t for t in oldroots}
        for t in roots:
            for key in ('title','original_dependencies','original_dependency_text','requirements'):
                if t.get(key) != previous.get(t['id'],{}).get(key): errors.append('root contract changed: '+t['id']+'/'+key)
        metrics['root_tasks_preserved'] = len(roots)
        aggregate = load(root,'behavior/ALL-ACCEPTANCE.json')
        cases = aggregate['cases']
        oldcases = load(root,'memory/evidence/previous-v4/behavior/ALL-ACCEPTANCE.json')['cases']
        by_id = {x['id']:x for x in cases}
        if len(cases) != 120 or len(by_id) != 120 or aggregate.get('case_count') != 120:
            errors.append('120 unique app scenarios required')
        for c in oldcases:
            if by_id.get(c['id']) != c: errors.append('inherited app case changed: '+c['id'])
        if any(c.get('status') != 'NOT_RUN' for c in cases):
            errors.append('no app case may claim native/live pass in this handoff')
        additions = load(root,'memory/ACCEPTANCE-MATRIX.json')['cases']
        if len(additions) != 20 or any(by_id.get(c['id']) != c for c in additions):
            errors.append('new acceptance map mismatch')
        metrics['app_scenarios_not_run'] = len(cases)
        oldmanifest = load(root,'memory/evidence/previous-v4/PACKAGE-MANIFEST.json')
        preserved = [f for f in oldmanifest['files'] if f['path'].startswith(('behavior-core/','baseline/','keyboard-notes/'))]
        for f in preserved:
            rel = f['path']
            if not safe_relative(rel) or not (root / rel).is_file() or sha((root / rel).read_bytes()) != f['sha256']:
                errors.append('previous runtime/notes/baseline changed: '+rel)
        metrics['existing_runtime_notes_baseline_files_checked'] = len(preserved)
        prompt = (root/'delivery/IMPLEMENTATION-PROMPT.md').read_text()
        if '## Mandatory supplied Hindsight skill integration (v5)' not in prompt or active not in prompt:
            errors.append('implementation prompt missing actual skill integration')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append('missing_or_invalid_package_input:' + type(exc).__name__)
    return {'schema':'metis.hindsight.package-check.v1','passed':not errors,'metrics':metrics,
            'errors':errors,'scope':'Offline package/profile/byte checks only; NOT native, live, authentication or release proof.'}

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    args=parser.parse_args()
    result=validate(args.root)
    print(json.dumps(result,indent=2))
    raise SystemExit(0 if result['passed'] else 1)
