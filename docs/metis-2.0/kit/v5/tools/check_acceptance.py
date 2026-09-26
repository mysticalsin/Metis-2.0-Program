#!/usr/bin/env python3
"""Read-only evidence form/hash gate. Does NOT execute native QA or verify signing.
Requires actual trusted run provenance outside this tool; a fabricated JSON report
is not made authentic by passing shape/hash checks. Never produces release approval.
"""
from __future__ import annotations
import argparse,hashlib,json,re,sys
from pathlib import Path

class EvidenceError(ValueError): pass

def need(ok:bool,message:str)->None:
    if not ok: raise EvidenceError(message)

def digest(path:Path)->str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def load_json(path:Path):
    need(path.is_file() and path.stat().st_size<=1024*1024, 'Evidence JSON missing or oversized')
    return json.loads(path.read_text(encoding='utf-8'))

def bounded_file(root:Path,relative:str)->Path:
    need(isinstance(relative,str) and bool(relative), 'Missing evidence path')
    part=Path(relative)
    need(not part.is_absolute() and '..' not in part.parts, 'Unsafe evidence path')
    candidate=root/part
    current=root
    for component in part.parts:
        current=current/component
        need(not current.is_symlink(), 'Evidence symlinks are not accepted')
    resolved=candidate.resolve()
    need(resolved.is_relative_to(root.resolve()), 'Evidence path escapes root')
    need(resolved.is_file(), 'Evidence file missing')
    return resolved

def validate(report:dict,case_ids:list[str],root:Path,commit:str,artifact_hash:str,platform:str)->dict:
    need(isinstance(report,dict),'Report must be an object')
    need(bool(re.fullmatch(r'[0-9a-f]{40}',commit)), 'Expected source must be a full Git commit')
    need(bool(re.fullmatch(r'[0-9a-f]{64}',artifact_hash)), 'Expected artifact hash is invalid')
    need(platform in {'windows','macos-native','macos-electron-preview'},'Unknown qualification lane')
    need(report.get('schema')=='metis.native.acceptance.v2','Wrong evidence schema')
    for key,value in [('source_commit',commit),('artifact_sha256',artifact_hash),('platform',platform)]:
        need(report.get(key)==value,f'Report {key} does not match expected build')
    need(isinstance(report.get('profile_ref'),str) and bool(report['profile_ref'].strip()),'Missing isolated profile reference')
    records=report.get('cases')
    need(isinstance(records,list),'Cases must be a list')
    seen=set()
    for record in records:
        need(isinstance(record,dict),'Case must be an object')
        case=record.get('case_id')
        need(case in case_ids,'Unexpected case ID')
        need(case not in seen,'Duplicate case evidence')
        seen.add(case)
        need(record.get('status')=='PASS',f'{case}: required case has not passed')
        need(record.get('evidence_kind')=='native-live',f'{case}: unit/fixture/source checks cannot close native-live acceptance')
        path=bounded_file(root,record.get('evidence_file'))
        need(record.get('sha256')==digest(path),f'{case}: evidence bytes changed')
        evidence=load_json(path)
        need(isinstance(evidence,dict),'Evidence must be an object')
        for key,value in [('case_id',case),('source_commit',commit),('artifact_sha256',artifact_hash),('platform',platform),('status','PASS'),('evidence_kind','native-live')]:
            need(evidence.get(key)==value,f'{case}: evidence {key} mismatch')
        checks=evidence.get('checks')
        need(isinstance(checks,dict) and all(checks.get(k) is True for k in ('required_result_observed','negative_assertions_passed','isolated_profile_verified')),f'{case}: incomplete assertions')
        need(isinstance(evidence.get('native_run_ref'),str) and bool(evidence['native_run_ref'].strip()),f'{case}: missing native-run reference')
    missing=sorted(set(case_ids)-seen)
    need(not missing,'Required evidence missing: '+', '.join(missing))
    return {'status':'EVIDENCE_FORM_AND_HASH_CHECKS_PASS','scope':'Not runtime attestation, code signing, independent review or release approval','cases':len(seen),'source_commit':commit,'artifact_sha256':artifact_hash,'platform':platform}

def main()->int:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--report',type=Path,required=True);p.add_argument('--commit',required=True)
    p.add_argument('--artifact',type=Path,required=True)
    p.add_argument('--platform',required=True,choices=['windows','macos-native','macos-electron-preview'])
    p.add_argument('--matrix',type=Path,default=Path(__file__).resolve().parents[1]/'behavior/ALL-ACCEPTANCE.json')
    a=p.parse_args()
    try:
        matrix=load_json(a.matrix);case_ids=[x['id'] for x in matrix['cases']]
        need(len(case_ids)>0 and len(set(case_ids))==len(case_ids),'Invalid required case matrix')
        need(a.artifact.is_file() and not a.artifact.is_symlink(),'Exact built artifact is required')
        print(json.dumps(validate(load_json(a.report),case_ids,a.report.parent,a.commit,digest(a.artifact),a.platform),indent=2))
        return 0
    except (EvidenceError,OSError,ValueError,KeyError,TypeError) as e:
        print('NOT QUALIFIED: '+str(e),file=sys.stderr);return 2

if __name__=='__main__': raise SystemExit(main())
