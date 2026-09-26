import test from 'node:test';
import assert from 'node:assert/strict';
import { HindsightClient, MemoryError, normalizeUsage } from '../src/hindsight-client.mjs';
import { inspectProfile } from '../deploy/profile-check.mjs';
import { readFile } from 'node:fs/promises';
const opts = { baseUrl:'https://memory.example.invalid', apiKey:'synthetic-key-not-a-credential-000', bankId:'bank_test', scopeTags:['acl:v1','scope:private'] };
const json = d => new Response(JSON.stringify(d), {headers:{'content-type':'application/json'}});
const approved = {documentId:'document_test',timestamp:'2026-09-23T12:00:00Z', content:'Québec, R&D: €50,000 is NOT approved.', metadata:{source_id:'src_test',source_revision:'rev1'}};
const accepted = {success:true,bank_id:'bank_test',items_count:1,async:false,usage:{input_tokens:120,output_tokens:0,total_tokens:120}};
const fail = code => e => e instanceof MemoryError && e.code === code;
for (const baseUrl of ['http://memory.example.invalid','https://u:p@host.invalid','https://host.invalid/path','https://host.invalid/?key=x','https://host.invalid/#x','https://localhost'])
 test('reject unsafe service destination '+baseUrl, () => assert.throws(() => new HindsightClient({...opts,baseUrl}), MemoryError));
for (const scopeTags of [[],['x','x'],['unsafe tag'],['../../foo'],null])
 test('reject missing or unsafe scope '+JSON.stringify(scopeTags), () => assert.throws(() => new HindsightClient({...opts,scopeTags}), fail('STRICT_SCOPE_REQUIRED')));
test('reject path traversal bank',()=>assert.throws(()=>new HindsightClient({...opts,bankId:'../global'}),fail('INVALID_ID')));
test('reject short secret',()=>assert.throws(()=>new HindsightClient({...opts,apiKey:'x'}),fail('SERVICE_KEY_REQUIRED')));
test('retain uses exact original content, replace and combined scope',async()=>{
 let captured; const c=new HindsightClient({...opts,fetchImpl:async(url,init)=>{captured={url,init};return json(accepted)}});
 const out=await c.retain(approved); const b=JSON.parse(captured.init.body);
 assert.equal(b.items[0].content,approved.content);assert.equal(b.items[0].update_mode,'replace');
 assert.equal(b.items[0].observation_scopes,'combined');assert.equal(b.async,false);
 assert.equal(captured.init.redirect,'error');assert.equal(captured.init.cache,'no-store');
 assert.equal(out.usage.outputTokens,0);assert.equal(out.searchable,'NOT_PROVEN');
});
test('HTTP success is not retain success',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>json({...accepted,success:false})});
 await assert.rejects(c.retain(approved),fail('RETAIN_UNCONFIRMED'));
});
test('wrong bank cannot claim retained',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>json({...accepted,bank_id:'other'})});
 await assert.rejects(c.retain(approved),fail('RETAIN_UNCONFIRMED'));
});
test('async response cannot claim synchronous completion',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>json({...accepted,async:true})});
 await assert.rejects(c.retain(approved),fail('RETAIN_UNCONFIRMED'));
});
test('unknown consumption is not zero',()=>{
 assert.equal(normalizeUsage().inputTokens,null);assert.equal(normalizeUsage({input_tokens:0}).inputTokens,0);
 assert.equal(normalizeUsage({output_tokens:-1}).outputTokens,null);
});
test('recall forces bounded strict fact-only request',async()=>{
 let body;const c=new HindsightClient({...opts,fetchImpl:async(u,i)=>{body=JSON.parse(i.body);return json({results:[]})}});
 const r=await c.recall('What is known?');assert.deepEqual(r.candidates,[]);
 assert.equal(body.tags_match,'all_strict');assert.equal(body.trace,false);
 assert.deepEqual(body.types,['world','experience']);assert.equal(body.max_tokens,1200);assert.deepEqual(body.include,{});
});
test('unrequested trace fails rather than flowing to client',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>json({results:[],trace:{query:'secret'}})});
 await assert.rejects(c.recall('test'),fail('UNEXPECTED_CONTENT_EXPANSION'));
});
test('observation unexpectedly returned in facts-only profile fails',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>json({results:[{id:'m1',text:'guess',type:'observation'}]})});
 await assert.rejects(c.recall('test'),fail('INVALID_RECALL'));
});
test('reflect excludes models, scopes directives and requires evidence',async()=>{
 let body;const c=new HindsightClient({...opts,fetchImpl:async(u,i)=>{body=JSON.parse(i.body);return json({text:'An inference',based_on:{memories:[{id:'m1'}]}})}});
 const r=await c.reflect('test');assert.equal(r.epistemicStatus,'SYNTHESIS_NOT_VERIFIED_FACT');
 assert.equal(body.exclude_mental_models,true);assert.equal(body.apply_all_directives,false);assert.deepEqual(body.include,{facts:{}});
});
test('unsupported reflection evidence fails',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>json({text:'Unattributed assertion'})});
 await assert.rejects(c.reflect('test'),fail('REFLECTION_EVIDENCE_MISSING'));
});
test('delete is exact document and does not certify full erasure',async()=>{
 let url;const c=new HindsightClient({...opts,fetchImpl:async(u)=>{url=u;return json({success:true,document_id:'document_test',memory_units_deleted:2})}});
 const r=await c.deleteDocument('document_test');assert.ok(url.endsWith('/documents/document_test'));assert.equal(r.completeErasure,'NOT_PROVEN');
});
test('unsafe deletion id rejected before request',async()=>{
 let calls=0;const c=new HindsightClient({...opts,fetchImpl:async()=>{calls++;return json({})}});
 await assert.rejects(c.deleteDocument('../all'),fail('INVALID_ID'));assert.equal(calls,0);
});
test('readiness only trusts explicit safe flags',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>json({api_version:'0.10.1',features:{store_document_text:false,llm_trace:false,mcp:false}})});
 assert.equal((await c.readiness()).declaredPrivacyFlags,'PASS');
});
test('old or unsafe readiness fails closed',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>json({api_version:'0.10.1',features:{store_document_text:true}})});
 await assert.rejects(c.readiness(),fail('PRIVACY_CONFIGURATION'));
});
test('secret-bearing upstream body is not included in error',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>new Response('private bearer secret',{status:500})});
 try {await c.retain(approved);assert.fail()}catch(e){assert.equal(e.code,'UPSTREAM_UNAVAILABLE');assert.equal(e.ambiguous,true);assert.ok(!String(e).includes('private bearer'));}
});
test('redirect is rejected',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>{const r=json({results:[]});Object.defineProperty(r,'redirected',{value:true});return r}});
 await assert.rejects(c.recall('test'),fail('REDIRECT_REJECTED'));
});
test('response bound rejects oversized stream',async()=>{
 const c=new HindsightClient({...opts,maxResponseBytes:256,fetchImpl:async()=>json({results:[],junk:'x'.repeat(300)})});
 await assert.rejects(c.recall('test'),fail('RESPONSE_TOO_LARGE'));
});
test('deadline includes body streaming',async()=>{
 const c=new HindsightClient({...opts,deadlineMs:25,fetchImpl:async()=>new Response(new ReadableStream({start(){}}),{headers:{'content-type':'application/json'}})});
 await assert.rejects(c.recall('test'),fail('TIMEOUT'));
});
test('caller abort is immediate with no network',async()=>{
 let calls=0;const abort=new AbortController();abort.abort();
 const c=new HindsightClient({...opts,fetchImpl:async()=>{calls++;return json({})}});
 await assert.rejects(c.recall('test',{signal:abort.signal}),fail('CANCELLED'));assert.equal(calls,0);
});
test('no transparent retry after ambiguous write failure',async()=>{
 let calls=0;const c=new HindsightClient({...opts,fetchImpl:async()=>{calls++;throw Error('unknown')}});
 await assert.rejects(c.retain(approved),e=>e.ambiguous===true);assert.equal(calls,1);
});
test('invalid UTF8/JSON is not relayed',async()=>{
 const c=new HindsightClient({...opts,fetchImpl:async()=>new Response('not json',{headers:{'content-type':'application/json'}})});
 await assert.rejects(c.recall('test'),fail('INVALID_JSON'));
});
test('template intentionally fails until real deployment values approved',async()=>{
 const p=JSON.parse(await readFile(new URL('../deploy/profile.template.json',import.meta.url),'utf8'));
 assert.equal(inspectProfile(p).passed,false);
 p.image='registry.example.invalid/memory@sha256:'+'a'.repeat(64);p.region='approved-region';
 for(const k of Object.keys(p.approvedStages))p.approvedStages[k]=true;
 assert.equal(inspectProfile(p).passed,true);
 p.environment.HINDSIGHT_API_LLM_TRACE_ENABLED='true';assert.equal(inspectProfile(p).passed,false);
});
