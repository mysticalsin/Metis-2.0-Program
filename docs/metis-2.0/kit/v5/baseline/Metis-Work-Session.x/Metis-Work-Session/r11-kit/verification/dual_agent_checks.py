#!/usr/bin/env python3
"""Offline tests of handoff tooling in disposable repositories; no model/API called."""
from pathlib import Path
import argparse,importlib.util,json,os,subprocess,tempfile,types,hashlib
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('dual_agent',R/'tools/dual_agent.py');d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--report',type=Path);a=ap.parse_args();checks=[]
 def ck(name,fn):
  try:result=fn();assert result is not False;checks.append({'check':name,'passed':True})
  except Exception as e:checks.append({'check':name,'passed':False,'detail':str(e)[:350]})
  print(('PASS ' if checks[-1]['passed'] else 'FAIL ')+name,flush=True)
 def rejects(fn):
  try:fn()
  except (d.Refusal,ValueError):return True
  return False
 with tempfile.TemporaryDirectory(prefix='metis-handoff-tests-') as td:
  t=Path(td);repo=t/'repo';repo.mkdir()
  def git(*args):return subprocess.check_output(['git','-C',str(repo),*args],stderr=subprocess.DEVNULL).decode().strip()
  git('init');git('config','user.name','Synthetic Test');git('config','user.email','synthetic@example.invalid')
  (repo/'source.txt').write_text('baseline\n');git('add','.');git('commit','-m','baseline');base=git('rev-parse','HEAD')
  (repo/'source.txt').write_text('updated\n');(repo/'other.txt').write_text('context\n');git('add','.');git('commit','-m','change');head=git('rev-parse','HEAD')
  packet=d.make_packet(repo,base,'TASK-027.A',['other.txt'],t/'packet');pp=packet/'packet.json';p=d.load_json(pp)
  ck('Packet binds full source HEAD and base',lambda:p['head_commit']==head and p['base_commit']==base)
  ck('Packet retains actual slice and requirement IDs',lambda:p['task']=='TASK-027.A' and len(p['requirements'])>0)
  ck('Packet includes every changed file',lambda:set(p['changed_files'])=={'source.txt','other.txt'})
  ck('No source body is automatically embedded',lambda:'updated\n' not in pp.read_text())
  ck('Clean snapshot readback succeeds',lambda:d.verify_snapshot(pp,repo)['head_commit']==head)
  ck('Output cannot overwrite existing evidence',lambda:rejects(lambda:d.make_packet(repo,base,'TASK-027.A',[],t/'packet')))
  ck('Output cannot be inside checkout',lambda:rejects(lambda:d.make_packet(repo,base,'TASK-027.A',[],repo/'packet')))
  ck('Unknown task is refused',lambda:rejects(lambda:d.make_packet(repo,base,'TASK-999',[],t/'bad')))
  ck('Argument-looking revision is refused',lambda:rejects(lambda:d.revision(repo,'--help')))
  ck('Untracked context cannot enter packet',lambda:rejects(lambda:d.make_packet(repo,base,'TASK-027', ['not-tracked'],t/'missing')))
  for name in ['../secret','.env','folder/credentials/token','/etc/passwd','drive:C','file\\other','bad\nfile','key.pfx']:
   ck('Unsafe/sensitive path rejected '+repr(name),lambda n=name:rejects(lambda:d.safe_relative(n)))
  original=(repo/'source.txt').read_text();(repo/'source.txt').write_text('dirty\n')
  ck('Dirty source fails without cleanup',lambda:rejects(lambda:d.verify_snapshot(pp,repo)))
  ck('Dirty user bytes remain unchanged',lambda:(repo/'source.txt').read_text()=='dirty\n')
  (repo/'source.txt').write_text(original)
  review={'schema':'metis.independent-review.v1','task':p['task'],'packet_sha256':d.sha(pp.read_bytes()),'head_commit':head,'reviewer':{'provider':'synthetic','model':'synthetic-fable','session_reference':'local-fixture-only','independent':True},'evidence_level':'source-review','verdict':'PASS','files_inspected':p['changed_files'],'findings':[],'tests_executed':[],'limitations':['Synthetic checker fixture; no actual Fable session.']}
  rp=t/'review.json'
  def attempt(changes):
   q=json.loads(json.dumps(review));q.update(changes);rp.write_text(json.dumps(q));return d.check_review(pp,rp,repo)
  ck('Consistent synthetic source review passes only consistency',lambda:attempt({})['product_release_approved'] is False)
  ck('Wrong packet digest rejected',lambda:rejects(lambda:attempt({'packet_sha256':'0'*64})))
  ck('Wrong source revision rejected',lambda:rejects(lambda:attempt({'head_commit':base})))
  ck('Claimed native proof rejected',lambda:rejects(lambda:attempt({'evidence_level':'native-e2e'})))
  ck('Unresolved finding cannot be PASS',lambda:rejects(lambda:attempt({'findings':[{'severity':'high','detail':'Unresolved fixture finding.'}]})))
  ck('Changed file omitted from PASS rejected',lambda:rejects(lambda:attempt({'files_inspected':['source.txt']})))
  ck('Missing independent actor rejected',lambda:rejects(lambda:attempt({'reviewer':{'independent':False}})))
  ck('Read-only review cannot claim executed tests',lambda:rejects(lambda:attempt({'tests_executed':['npm test']})))
  ck('Changes-required remains non-release evidence',lambda:attempt({'verdict':'CHANGES_REQUIRED','findings':[{'severity':'low','detail':'Needs a real test.'}]})['review_verdict']=='CHANGES_REQUIRED')
  args=d.build_claude_args('/fake/claude','fable',2.0,4)
  ck('Read-only tool availability and MCP denial set',lambda:args[args.index('--tools')+1]=='Read,Grep,Glob' and 'mcp__*' in args)
  ck('No permission bypass or shell assembly',lambda:'--dangerously-skip-permissions' not in args and '--bare' not in args and 'default' in args)
  ck('Explicit budget and non-persistent session flags set',lambda:'--max-budget-usd' in args and '--no-session-persistence' in args)
  ck('Invalid model argument is refused',lambda:rejects(lambda:d.build_claude_args('x','--bad',1.0,2)))
  ck('Nonfinite budget refused',lambda:rejects(lambda:d.build_claude_args('x','fable',float('nan'),2)))
  ck('Zero budget refused',lambda:rejects(lambda:d.build_claude_args('x','fable',0,2)))
  ns=types.SimpleNamespace(repo=repo,packet=pp,out=t/'transport',claude='unavailable-cli',model='fable',budget_usd=1,max_turns=2,timeout_seconds=10,authorize_source_egress=False,confirm_reviewed_cli_configuration=False)
  ck('No cloud approval causes refusal before invocation',lambda:rejects(lambda:d.launch_review(ns)))
  ns.authorize_source_egress=True
  ck('Unreviewed CLI configuration causes refusal',lambda:rejects(lambda:d.launch_review(ns)))
  ns.confirm_reviewed_cli_configuration=True
  ck('Missing CLI not silently installed/substituted',lambda:rejects(lambda:d.launch_review(ns)))
  # Local executable fakes exercise process transport. No real provider/authentication.
  binary=t/'claude-fixture';binary.write_text('#!/usr/bin/env python3\nimport json,sys\nif "--version" in sys.argv: print("synthetic-cli 0");sys.exit(0)\ntext=sys.stdin.read()\nprint(json.dumps({"result":"Synthetic review transport only","session_id":"fixture","modelUsage":{"synthetic-model":{}},"is_error":False}))\n');binary.chmod(0o700);ns.claude=str(binary)
  ck('Local fake transport returns unvalidated response, never release pass',lambda:d.launch_review(ns)['independent_review']=='NOT_YET_VALIDATED')
  ck('Actual transport receipt preserves requested and reported model distinction',lambda:json.loads((ns.out/'transport.json').read_text())['reported_model_ids']==['synthetic-model'])
  ns.out=t/'transport-fail';binary.write_text('#!/usr/bin/env python3\nimport sys,json\nif "--version" in sys.argv: print("synthetic-cli 0");sys.exit(0)\nsys.stdin.read();print(json.dumps({"is_error":True,"result":"failed"}));sys.exit(1)\n')
  ck('Nonzero/error model transport fails closed',lambda:rejects(lambda:d.launch_review(ns)))
  ck('Failed transport receipt is kept as failure',lambda:json.loads((ns.out/'transport.json').read_text())['transport_result']=='FAILED_OR_UNQUALIFIED')
  ck('No application or reviewer source modified by transport',lambda:git('rev-parse','HEAD')==head and git('status','--porcelain')=='')
  (repo/'source.txt').write_text('new commit\n');git('add','.');git('commit','-m','next')
  ck('New commit invalidates old packet',lambda:rejects(lambda:d.verify_snapshot(pp,repo)))
 result={'scope':'Offline disposable Git and local fake-CLI tests. No real Codex/Fable session, product, live provider or deployment.','passed':sum(x['passed'] for x in checks),'total':len(checks),'checks':checks}
 if a.report:a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(result,indent=2)+'\n')
 return 0 if all(x['passed'] for x in checks) else 1
if __name__=='__main__':raise SystemExit(main())
