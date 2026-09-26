#!/usr/bin/env python3
"""Isolated source-expression reproductions. Requires exact supplied export, Node and existing TypeScript.
Does not reconstruct/build the app, access credentials, run provisioners, or contact services.
"""
from pathlib import Path
from datetime import datetime,timezone
import argparse,hashlib,json,re,sqlite3,subprocess,tempfile,sys
ROOT=Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--export',type=Path,required=True);ap.add_argument('--report',type=Path);a=ap.parse_args()
 ix=json.loads((ROOT/'source-review/SOURCE-INDEX.json').read_text());raw=a.export.read_bytes();assert hashlib.sha256(raw).hexdigest()==ix['source_sha256'],'Export digest mismatch'
 lines=raw.decode().splitlines();by={x['path']:x for x in ix['sections']}
 def source(p):e=by[p];return '\n'.join(lines[e['content_start_line']-1:e['content_end_line']])+'\n'
 results=[]
 def ck(name,fn):
  try:v=fn();assert v is not False;results.append({'probe':name,'passed':True,'observed':v or 'Observed as expected'})
  except Exception as e:results.append({'probe':name,'passed':False,'observed':str(e)[:1000]})
 wake=source('src/shared/metis-wake.ts');d1=source('operator/src/d1.ts');match=re.search(r'function ownedAskUpsertSql\(columns: readonly string\[\]\): string \{.*?\n\}',d1,re.S);assert match
 # Compile only two reviewed, pure expressions. No other D1/app imports are evaluated.
 payload={'wake':wake,'sql':match.group(0),'input':'Hey Métis, crée une note intitulée “Québec / R&D”.'}
 js="""const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');const p=JSON.parse(fs.readFileSync(0,'utf8'));function compile(s){return ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;}let a={exports:{}};vm.runInNewContext(compile(p.wake),a,{timeout:1000});let b={};vm.runInNewContext(compile(p.sql)+';globalThis.query=ownedAskUpsertSql(["id","device_id","input_tokens","output_tokens"]);',b,{timeout:1000});console.log(JSON.stringify({input:p.input,output:a.exports.stripWakeWord(p.input),sql:b.query}));"""
 cp=subprocess.run(['node','-e',js],input=json.dumps(payload),text=True,capture_output=True,timeout=8)
 if cp.returncode:raise RuntimeError(cp.stderr)
 ob=json.loads(cp.stdout)
 def wake_change():assert ob['output']!=ob['input'] and 'Québec' not in ob['output'];return {'input':ob['input'],'observed_output':ob['output'],'finding':'normalization affects returned command payload; preserving original spans is required'}
 ck('Actual exported wake helper changes payload casing/accents',wake_change)
 db=sqlite3.connect(':memory:');db.execute('CREATE TABLE asks (id TEXT PRIMARY KEY, device_id TEXT, input_tokens INTEGER, output_tokens INTEGER)');query=ob['sql']
 db.execute(query,('a','d1',120,30));db.execute(query,('a','d1',None,None))
 def late_null():row=db.execute('SELECT input_tokens,output_tokens FROM asks WHERE id="a"').fetchone();assert row==(None,None);return {'before':[120,30],'after':list(row),'finding':'same-device late null erases known counts in this isolated exact SQL expression'}
 ck('Actual owned upsert expression loses authoritative counts to late null',late_null)
 db.execute(query,('a','d1',120,30));db.execute(query,('a','d2',999,999))
 def owner():row=db.execute('SELECT device_id,input_tokens,output_tokens FROM asks WHERE id="a"').fetchone();assert row==('d1',120,30);return {'retained':list(row),'finding':'cross-device ownership guard remains valuable and must be preserved'}
 ck('Actual owned upsert expression rejects another device overwrite',owner)
 def cap():text=source('operator/src/dashboard.ts');assert 'listAsks(2000)' in text;return 'Source-pattern confirmation only: aggregate starts from a capped request list; no production undercount measured.'
 ck('Dashboard 2000-row anchor exists in this export',cap)
 def native():text=source('native-app/App/Store/PersistedModels.swift');assert 'try? context.save()' in text and 'linesData' in text;return 'Source-pattern confirmation only: silent save and full transcript blob need real Swift fault-injection tests.'
 ck('Native persistence anchors exist in this export',native)
 report={'scope':'ISOLATED_PURE_SOURCE_EXPRESSIONS_AND_STATIC_ANCHORS_NOT_PRODUCT_TESTS','executed_at':datetime.now(timezone.utc).isoformat(),'source_sha256':ix['source_sha256'],'checks':results,'passed':all(x['passed'] for x in results),'limits':['No complete app build or test suite.','No Electron, SwiftData, native OS, provider, Cloudflare, CRM, Dust or Teams execution.','Expected defect reproduction is not a fixed product result.','SQLite runs the extracted SQL expression against a synthetic schema, not live D1.']}
 out=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
 if a.report:a.report.write_text(out)
 print(out);return 0 if report['passed'] else 1
if __name__=='__main__':raise SystemExit(main())
