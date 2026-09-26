/** Real HTTP sockets to an EXPLICIT local TypeSafe protocol fixture, never a vendor
 * inference. Proves serialization + pipeline + real file effect; NOT Jev accuracy.
 */
import {test} from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {BehaviorAuthority} from '../dist/authority.js'
import {NativeInputLeaseBroker} from '../dist/native-lease.js'
import {executeWithDecision} from '../dist/jev-consumer.js'
import {createJevBackend} from '../dist/jev-transport.js'
import {setup,wire} from './jev-fixtures.mjs'
import {binding,target,turn,MemoryJournal} from './fixtures.mjs'
test('full decision path over real local HTTP chooses and verifies an actual file',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'metis-jev-integration-')),calls=[]
 const server=http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;const data=JSON.parse(body);calls.push({path:req.url,method:req.method,keys:Object.keys(data)});res.setHeader('content-type','application/json');res.end(JSON.stringify(wire(data,'second')))})
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)})
 try{
  const url=`http://127.0.0.1:${server.address().port}/v1/systemone`
  const b=createJevBackend({model:'jev-1.13.0',readServerSecret:async()=>'synthetic-test-secret',fetchImpl:async(_trustedURL,init)=>{const response=await fetch(url,init);return new Response(response.body,{status:response.status,headers:response.headers})}})
  const s=setup({backends:{jev:b}}),clock=()=>performance.now(),a=new BehaviorAuthority(binding,clock),g=a.beginIntent(turn)
  const p=title=>a.propose(g,{operationId:title==='Right'?'right-op':'wrong-op',kind:'create_document',route:'native_semantic',args:{title,content:title==='Right'?'Réunion — São Paulo — no enviar':'wrong'},target:{...target,observedAtMs:clock()},expectedPostcondition:'file-bytes-match'})
  const first=await p('Wrong'),second=await p('Right'),file=path.join(directory,'result.txt');let writes=0
  const port={matchIntent:async p=>({matches:p.args.title==='Right'&&p.args.content==='Réunion — São Paulo — no enviar',sourceIntentRef:'synthetic-canonical-intent',inputRevision:p.inputRevision,proposalDigest:p.digest,expectedPostcondition:p.expectedPostcondition}),observe:async p=>({...p.target,observedAtMs:clock()}),dispatch:async(p,c)=>{c.assertCanDispatch();writes++;await writeFile(file,p.args.content,{flag:'wx'})},verify:async p=>({kind:'application_readback',operationId:p.operationId,proposalDigest:p.digest,resourceId:p.target.resourceId,expectedPostcondition:p.expectedPostcondition,observedAtMs:clock(),result:(await readFile(file,'utf8'))===p.args.content?'matched':'uncertain',evidenceRef:'actual-temporary-file-readback'}),quiesce:async()=>true}
  const r=await executeWithDecision({authority:a,grant:g,requestId:'loopback-task',policyRevision:'policy-1',contextRevision:'context-1',source:'trusted-typed',utterance:'Create Right with the exact provided words',language:'en',dataClass:'synthetic',candidates:[{id:'first',label:'Create Wrong',proposal:first},{id:'second',label:'Create Right',proposal:second}],client:s.service,port,journal:new MemoryJournal(),inputBroker:new NativeInputLeaseBroker(),recordConsumption:async()=>{}})
  assert.equal(r.status,'executed',JSON.stringify(r));assert.equal(r.receipt.outcome,'verified');assert.equal(r.receipt.operationId,'right-op');assert.equal(writes,1);assert.equal(calls.length,1);assert.equal(calls[0].path,'/v1/systemone');assert.equal(await readFile(file,'utf8'),'Réunion — São Paulo — no enviar');assert.equal(s.journal.receipts[0].usage.inputTokens,100)
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r));await rm(directory,{recursive:true,force:true})}
})
