#!/usr/bin/env python3
"""Mutation checks on TEMP copies of compiled candidate code, not the repository.
Each deliberately unsafe mutation must cause the unchanged test suite to fail.
"""
from pathlib import Path
import json,re,shutil,subprocess,tempfile
BASE=Path(__file__).resolve().parents[1]
CORE=BASE/'behavior-core'
MUTATIONS=[
 ('reject-untrusted-input','authority.js',"requireThat(['command-microphone', 'trusted-typed'].includes(input.source), 'UNTRUSTED_INPUT');","requireThat(true, 'UNTRUSTED_INPUT');"),
 ('enforce-route-scope','authority.js',"requireThat(g.routes.includes(p.route), 'ROUTE_NOT_GRANTED');","requireThat(true, 'ROUTE_NOT_GRANTED');"),
 ('require-exact-approval','authority.js',"if (consequential(p.kind) || policyRequiresApproval)","if (false)"),
 ('require-verified-completion','coordinator.js',"if (r.outcome === 'verified' && r.dispatched && r.journalSettled && r.inputQuiesced && r.evidenceRef)","if (r.dispatched)"),
 ('retain-lease-until-drained','native-lease.js',"this.revoked = true;","{ this.revoked = true; this.current = null; }"),
 ('reject-stale-voice-owner','voice.js',"if (this.current !== token)\n            return false;","if (false)\n            return false;"),
 ('dont-cancel-work-for-status','voice.js',"revokeActionAuthority: false, requiresFreshIntent: false","revokeActionAuthority: true, requiresFreshIntent: true"),
 ('all-steps-before-done','coordinator.js',"verified === expectedOperationIds.length ? 'done'","verified > 0 ? 'done'")
]
def main():
 results=[]
 for name,file,old,new in MUTATIONS:
  with tempfile.TemporaryDirectory(prefix='metis-negative-control-') as d:
   root=Path(d)/'core';shutil.copytree(CORE,root)
   p=root/'dist'/file;s=p.read_text();assert old in s,(name,'mutation anchor missing')
   p.write_text(s.replace(old,new,1))
   cmd=['node','--test',*map(str,sorted((root/'tests').glob('*.test.mjs')))]
   run=subprocess.run(cmd,cwd=root,capture_output=True,text=True,timeout=20)
   def count(k):
    m=re.search(r'^# '+k+r' (\d+)\s*$',run.stdout,re.M);return int(m.group(1)) if m else None
   result={'id':name,'exit_code':run.returncode,'tests':count('tests'),'passed':count('pass'),'failed':count('fail'),'detected':run.returncode!=0 and (count('fail') or 0)>0,'scope':'deliberate mutation of TEMP compiled copy; original sources/tests unchanged'}
   results.append(result);print(name,result['detected'],result['failed'])
 assert all(x['detected'] for x in results),'An unsafe mutation was not detected'
 (BASE/'evidence'/'negative-controls.json').write_text(json.dumps({'controls':results,'all_detected':True},indent=2)+'\n')
if __name__=='__main__':main()
