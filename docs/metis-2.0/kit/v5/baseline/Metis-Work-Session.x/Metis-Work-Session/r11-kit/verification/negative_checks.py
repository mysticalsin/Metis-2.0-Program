#!/usr/bin/env python3
"""Verify that the kit checker detects isolated damage. The real kit is never edited."""
from __future__ import annotations
import argparse,json,runpy,shutil,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--report',type=Path);args=p.parse_args()
    validate=runpy.run_path(str(ROOT/'verification/verify_bundle.py'))['validate']
    out=[]
    cases=[('changed_master','canonical master hash'),('missing_reference','original reference bytes intact'),('dropped_use_case','master/registry exact identifier parity'),('broken_html_link','HTML local paths and fragment targets'),('armed_bar','animated armed visual contract is orb-only'),('duplicate_source','source reference IDs unique and indexed'),('static_orb','animated armed visual contract is orb-only'),('dropped_source_finding','24 source findings retained and mapped'),('dropped_agent_case','32 agent use cases have execution owners'),('agent_cycle','18 numbered agent steps form a resolvable DAG'),('fake_native_trust','HeyClicky inventory is byte-bound and non-executed'),('agent_network','agents reference has no external capture or persistence'),('wrong_presenter','only Tony Walteur is the onboarding presenter'),('fake_video','missing authentic video never fabricates an asset'),('source_snapshot','bundled source snapshot matches original supplied bytes'),('stale_agent_contract','derived agent experience matches current master'),('dropped_memory_case','32 memory cases have mapped acceptance'),('memory_cycle','16 numbered memory slices form a DAG'),('fake_memory_live','no invented live Hindsight proof'),('memory_append','memory transport uses explicit safe request profile'),('memory_logging','private deployment profile denies extra content stores'),('memory_permissive_scope','memory transport uses explicit safe request profile')]
    for kind,expected in cases:
        with tempfile.TemporaryDirectory(prefix='metis-kit-check-') as td:
            copy=Path(td)/'kit';shutil.copytree(ROOT,copy)
            if kind=='changed_master':
                path=copy/'spec/MASTER.md';path.write_bytes(path.read_bytes()+b'\nUnapproved change.\n')
            elif kind=='missing_reference':(copy/'references/assets/orb-reference.png').unlink()
            elif kind=='dropped_use_case':
                path=copy/'plan/registry.json';r=json.loads(path.read_text());r['use_cases'].pop();path.write_text(json.dumps(r))
            elif kind=='broken_html_link':
                path=copy/'OPEN-METIS-2.html';path.write_text(path.read_text().replace('spec/MASTER.pdf','spec/MISSING.pdf'))
            elif kind=='armed_bar':
                path=copy/'visual/STATE-MAP.json';r=json.loads(path.read_text());r['states'][0]['visible_elements'].append('bar');path.write_text(json.dumps(r))
            elif kind=='duplicate_source':
                path=copy/'spec/MASTER.md';path.write_text(path.read_text()+'\n### R79 · Duplicate source\n')
            elif kind=='static_orb':
                path=copy/'visual/STATE-MAP.json';r=json.loads(path.read_text());r['states'][0]['default_animation']='paused';path.write_text(json.dumps(r))
            elif kind=='dropped_source_finding':
                path=copy/'plan/registry.json';r=json.loads(path.read_text());r['source_findings'].pop();path.write_text(json.dumps(r))
            elif kind=='dropped_agent_case':
                path=copy/'plan/AGENT-EXPANSION.json';r=json.loads(path.read_text());r['cases'].pop();path.write_text(json.dumps(r))
            elif kind=='agent_cycle':
                path=copy/'plan/AGENT-EXPANSION.json';r=json.loads(path.read_text());r['ordered_steps'][0]['depends_on']=['AGSTEP-18'];path.write_text(json.dumps(r))
            elif kind=='fake_native_trust':
                path=copy/'clicky-study/ARTIFACT.json';r=json.loads(path.read_text());r['system_signing_trust_checked']=True;path.write_text(json.dumps(r))
            elif kind=='agent_network':
                path=copy/'visual/agents/src/agents.js';path.write_text(path.read_text()+"\nfetch('https://example.invalid');\n")
            elif kind=='wrong_presenter':
                path=copy/'onboarding/media/tony-walteur.manifest.json';r=json.loads(path.read_text());r['presenter']='Another person';path.write_text(json.dumps(r))
            elif kind=='fake_video':
                path=copy/'onboarding/media/tony-walteur.manifest.json';r=json.loads(path.read_text());r['status']='APPROVED';r['video']='invented.mp4';path.write_text(json.dumps(r))
            elif kind=='source_snapshot':
                (copy/'references/source/metis-1.9.5-export.txt').unlink()
            elif kind=='stale_agent_contract':
                (copy/'plan/AGENT-EXPERIENCE.md').write_text('Eight stages instead of the actual owner-directed flow.')
            elif kind=='dropped_memory_case':
                path=copy/'memory/EXPANSION.json';r=json.loads(path.read_text());r['use_cases'].pop();path.write_text(json.dumps(r))
            elif kind=='memory_cycle':
                path=copy/'memory/EXPANSION.json';r=json.loads(path.read_text());r['steps'][0]['depends_on']=['HMSTEP-16'];path.write_text(json.dumps(r))
            elif kind=='fake_memory_live':
                path=copy/'memory/LIVE-STATUS.json';r=json.loads(path.read_text());r['actual_hindsight_smoke']='PASSED';path.write_text(json.dumps(r))
            elif kind=='memory_append':
                path=copy/'memory/src/hindsight-client.mjs';path.write_text(path.read_text().replace("update_mode: 'replace'", "update_mode: 'append'"))
            elif kind=='memory_logging':
                path=copy/'memory/deploy/profile.template.json';r=json.loads(path.read_text());r['environment']['HINDSIGHT_API_LLM_TRACE_ENABLED']='true';path.write_text(json.dumps(r))
            elif kind=='memory_permissive_scope':
                path=copy/'memory/src/hindsight-client.mjs';path.write_text(path.read_text().replace("tags_match: 'all_strict'", "tags_match: 'any'"))
            checks=validate(copy,check_hashes=False)
            failed=[c['check'] for c in checks if not c['passed']]
            out.append({'probe':kind,'expected_detection':expected,'detected':expected in failed,'actual_failed_checks':failed,'scope':'temporary copy only'})
    report={'scope':'DELIVERY_KIT_NEGATIVE_CONTROLS','passed':all(x['detected'] for x in out),'probes':out}
    text=json.dumps(report,indent=2)+'\n'
    if args.report:args.report.write_text(text)
    print(text);return 0 if report['passed'] else 1
if __name__=='__main__':raise SystemExit(main())
