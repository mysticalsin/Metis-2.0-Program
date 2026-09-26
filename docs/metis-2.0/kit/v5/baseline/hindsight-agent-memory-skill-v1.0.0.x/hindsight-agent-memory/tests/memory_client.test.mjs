import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryClient, MemoryFailure } from '../scripts/memory_client.mjs';
const make = (fetchImpl = async () => Response.json({}), options = {}) => new MemoryClient({
  baseUrl: 'https://memory.example', apiKey: 'test-key', bankId: 'private-bank',
  scopeTags: ['purpose:assistant'], fetchImpl, ...options });
const fields = { content: 'Approved codeword is Cedar.', documentId: 'source-one',
  timestamp: '2026-09-25T10:00:00-04:00', context: 'Synthetic approved note.' };

test('recall binds bank and strict scope, uses HTTP names', async () => {
  let captured;
  const c=make(async (url, options) => {captured={url,options};return Response.json({results:[]});});
  await c.recall('Question');
  assert.ok(captured.url.endsWith('/banks/private-bank/memories/recall'));
  const body=JSON.parse(captured.options.body);
  assert.deepEqual(body.tags,['purpose:assistant']);assert.equal(body.tags_match,'all_strict');
  assert.equal(body.max_tokens,1500);assert.equal(captured.options.redirect,'error');
});
test('retain serializes document and string metadata', async () => {
  let body;
  await make(async (_,o)=>{body=JSON.parse(o.body);return Response.json({success:true});}).retain({...fields,metadata:{revision:'2'}});
  assert.equal(body.items[0].document_id,'source-one');assert.equal(body.items[0].metadata.revision,'2');assert.equal(body.async,false);
});
test('async operation ID and append require explicit capabilities', async () => {
  const id='3f2b8c1a-9d4e-4a7b-9c2f-1e6d5a4b3c2d';
  assert.throws(()=>make().retain({...fields,async:true,operationId:id}));
  assert.throws(()=>make().retain({...fields,updateMode:'append'}));
  let body;
  await make(async (_,o)=>{body=JSON.parse(o.body);return Response.json({});},
    {supportsOperationId:true,supportsAppend:true}).retain({...fields,async:true,operationId:id,updateMode:'append'});
  assert.equal(body.operation_id,id);assert.equal(body.items[0].update_mode,'append');
});
test('version reads global path', async () => {
  let seen;await make(async url=>{seen=url;return Response.json({api_version:'synthetic'});}).version();
  assert.equal(seen,'https://memory.example/version');
});
test('unsafe origins and path IDs rejected', () => {
  for(const baseUrl of ['http://remote.example','https://user:pass@memory.example','https://memory.example/path',
    'https://memory.example?q=x','https://memory.example#x','file:///tmp/x']) assert.throws(()=>make(undefined,{baseUrl}));
  for(const bankId of ['../other','..','a/b','a?x=y','']) assert.throws(()=>make(undefined,{bankId}));
});
test('nonempty immutable scope required', async () => {
  for(const scopeTags of [[],[''],['a','a'],[' a']])assert.throws(()=>make(undefined,{scopeTags}));
  const tags=['purpose:assistant'];let body;
  const c=make(async(_,o)=>{body=JSON.parse(o.body);return Response.json({});},{scopeTags:tags});
  tags[0]='private:other';await c.recall('Q');assert.deepEqual(body.tags,['purpose:assistant']);
});
test('reflect opt-in and budget enforced', async () => {
  assert.throws(()=>make().reflect('Q'));
  assert.throws(()=>make().recall('Q',{maxTokens:99999}));
  assert.throws(()=>make().recall('Q',{budget:'unlimited'}));
  await make(undefined,{allowReflect:true}).reflect('Q');
});
test('timestamp and metadata types validated', () => {
  for(const timestamp of ['yesterday','2026-09-25','2026-09-25T10:00:00'])assert.throws(()=>make().retain({...fields,timestamp}));
  assert.throws(()=>make().retain({...fields,metadata:{version:2}}));
});
test('request byte size includes unicode encoding', async () => {
  let calls=0;const c=make(async()=>{calls++;return Response.json({});},{limits:{requestBytes:300}});
  await assert.rejects(c.retain({...fields,content:'é'.repeat(250)}),RangeError);assert.equal(calls,0);
});
test('access denied distinguished from network failure', async () => {
  await assert.rejects(make(async()=>Response.json({}, {status:403})).recall('Q'),e=>e.code==='access_denied'&&!e.unknownWrite);
});
test('HTTP rejection retains explicit outcome', async () => {
  await assert.rejects(make(async()=>Response.json({}, {status:422})).retain(fields),e=>e.code==='request_rejected'&&!e.unknownWrite);
});
test('unknown write has no secret message and no retry', async () => {
  let calls=0;const c=make(async()=>{calls++;throw new Error('private secret payload');});
  await assert.rejects(c.retain(fields),e=>e.unknownWrite&&!e.message.includes('private'));assert.equal(calls,1);
});
test('server error after write is unknown', async () => {
  await assert.rejects(make(async()=>Response.json({}, {status:503})).retain(fields),e=>e.unknownWrite);
});
test('read error is not a mutating unknown outcome', async () => {
  await assert.rejects(make(async()=>{throw new Error('offline');}).recall('Q'),e=>e instanceof MemoryFailure&&!e.unknownWrite);
});
test('bad JSON, top-level array, and media type rejected', async () => {
  for(const response of [new Response('bad',{headers:{'content-type':'application/json'}}), Response.json([]),new Response('<html>')])
    await assert.rejects(make(async()=>response).recall('Q'),MemoryFailure);
});
test('oversized streamed response stopped without relying on content length', async () => {
  const response=new Response(JSON.stringify({x:'a'.repeat(1000)}),{headers:{'content-type':'application/json'}});
  await assert.rejects(make(async()=>response,{limits:{responseBytes:100}}).recall('Q'),e=>e.code==='response_size_bound_exceeded');
});
test('declared oversized response rejected', async () => {
  const response=new Response('{}',{headers:{'content-type':'application/json','content-length':'99999'}});
  await assert.rejects(make(async()=>response,{limits:{responseBytes:100}}).recall('Q'),MemoryFailure);
});
test('abort signal bounds a cooperative pending transport', async () => {
  const c=make(async(_,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(new Error('aborted')))),{limits:{timeoutMs:5}});
  await assert.rejects(c.recall('Q'),e=>e.code==='transport_or_response_failure');
});
test('delete confirms specific document; cannot clear bank', async () => {
  const seen=[];const c=make(async(url,opts)=>{seen.push([url,opts.method]);return Response.json({success:true});});
  assert.throws(()=>c.deleteDocument('one',{confirmDocumentId:'two'}));
  await c.deleteDocument('one',{confirmDocumentId:'one'});assert.equal(seen[0][1],'DELETE');
  assert.ok(seen[0][0].endsWith('/documents/one'));
});
test('invalid secret and boolean options rejected', () => {
  for(const apiKey of ['', 'key\nX-Header:x', 'has space'])assert.throws(()=>make(undefined,{apiKey}));
  assert.throws(()=>make(undefined,{allowReflect:'yes'}));assert.throws(()=>make(undefined,{limits:{timeoutMs:0}}));
});
test('malformed success write is unknown and 204 deletion is accepted', async () => {
  await assert.rejects(make(async()=>new Response('bad',{headers:{'content-type':'application/json'}})).retain(fields),e=>e.unknownWrite);
  assert.deepEqual(await make(async()=>new Response(null,{status:204})).deleteDocument('one',{confirmDocumentId:'one'}),{});
});
