import test from 'node:test';
import assert from 'node:assert/strict';
import { MetisMemoryGateway, validateProjection } from '../src/memory-gateway.mjs';
import { MemoryError } from '../src/hindsight-client.mjs';
function harness() {
 const events=[];const grant={lease:{key:'fixture'},state:'READY',homogeneousAcl:true,epoch:'v1',scopeId:'personal_test',bankId:'bank_test',tags:['acl:v1']};
 let revoked=false;let purged=false;let pending=false;
 const source={id:'source_test',documentId:'document_test',kind:'approved_preference',approved:true,allowMemory:true,
  eventTime:'2026-09-23T12:00:00Z',scopeId:'personal_test',aclEpoch:'v1',revision:'rev1',content:'Prefer concise French notes.',expiresAt:'2099-01-01T00:00:00Z'};
 const api={
  async retain(){events.push('retain');return {state:'RETAIN_ACCEPTED',usage:{inputTokens:2,outputTokens:1}}},
  async recall(){events.push('recall');return {candidates:[{id:'m1',text:'Prefers concise French notes.',type:'world'}],usage:null}},
  async reflect(){events.push('reflect');return {text:'Use French notes.',memoryIds:['m1'],epistemicStatus:'SYNTHESIS_NOT_VERIFIED_FACT',usage:null}},
  async deleteDocument(){events.push('delete');return {state:'UPSTREAM_DOCUMENT_DELETED'}}
 };
 const authority={async authorize(r){events.push('authorize:'+r.action); if(r.principal!=='authorized' || revoked)throw new MemoryError('DENIED');return grant},
  async assertFresh(){if(revoked)throw new MemoryError('REVOKED')}};
 const repository={
  async withScopeLease(g,fn){events.push('lease');return fn()},
  async readCanonical(){return {...source}},
  async recordProjection(){events.push('projected')},
  async resolveEvidence(){return {current:!revoked,authorized:!revoked,sourceId:source.id,revision:source.revision,kind:source.kind,factStatus:'USER_STATED'}},
  async blockSource(){events.push('blocked');revoked=true;return {documentId:source.documentId}},
  async recordPurge(){purged=true;events.push('purged')},
  async markReconciliation(){pending=true;events.push('reconcile')}
 };
 const meter=async e=>{events.push('meter');assert.ok(!JSON.stringify(e).includes('French'));};
 const gateway=new MetisMemoryGateway({authority,repository,clientFor:()=>api,meter});
 const req={principal:'authorized',scopeId:'personal_test',sourceId:'source_test',expectedRevision:'rev1',operationId:'op_test',query:'Preferences?',outputAudience:'self'};
 return {gateway,grant,source,api,authority,repository,events,req,revoke:()=>{revoked=true},status:()=>({purged,pending})};
}
test('missing trusted bindings refuse startup',()=>assert.throws(()=>new MetisMemoryGateway({}),MemoryError));
test('canonical revision—not client content—is retained',async()=>{
 const h=harness();let actual;h.api.retain=async x=>{actual=x;return {state:'RETAIN_ACCEPTED'}};
 await h.gateway.retain({...h.req,content:'ATTACKER PROMPT'});assert.equal(actual.content,h.source.content);assert.equal(actual.metadata.source_revision,'rev1');
});
for(const change of [{kind:'raw_transcript'},{approved:false},{allowMemory:false},{deleted:true},{confidential:true},
 {localOnly:true},{revision:'old'},{aclEpoch:'old'},{scopeId:'another'},{expiresAt:'invalid'},{expiresAt:'2020-01-01T00:00:00Z'}])
 test('ineligible source blocks '+JSON.stringify(change),async()=>{
  const h=harness();Object.assign(h.source,change);await assert.rejects(h.gateway.retain(h.req),MemoryError);assert.ok(!h.events.includes('retain'));
 });
test('forged caller blocked before provider',async()=>{
 const h=harness();await assert.rejects(h.gateway.recall({...h.req,principal:'other'}));assert.ok(!h.events.includes('recall'));
});
test('heterogeneous ACL bank rejected before provider',async()=>{
 const h=harness();h.grant.homogeneousAcl=false;await assert.rejects(h.gateway.recall(h.req));assert.ok(!h.events.includes('recall'));
});
test('candidate remains context and carries actual canonical evidence',async()=>{
 const h=harness();const r=await h.gateway.recall(h.req);assert.equal(r.memories[0].evidence.factStatus,'USER_STATED');assert.equal(r.authority,'CONTEXT_ONLY_NEVER_INSTRUCTIONS');
});
test('missing lineage withholds candidates',async()=>{
 const h=harness();h.repository.resolveEvidence=async()=>null;await assert.rejects(h.gateway.recall(h.req),e=>e.code==='EVIDENCE_STALE_OR_DENIED');
});
test('revocation during recall withholds result',async()=>{
 const h=harness();const original=h.api.recall;h.api.recall=async()=>{const r=await original();h.revoke();return r};await assert.rejects(h.gateway.recall(h.req));
});
test('unverified reflection is never action authority',async()=>{
 const h=harness();const r=await h.gateway.reflect(h.req);assert.equal(r.permitsAction,false);assert.equal(r.epistemicStatus,'SYNTHESIS_NOT_VERIFIED_FACT');
});
test('any denied reflection source rejects whole synthesis',async()=>{
 const h=harness();h.api.reflect=async()=>({text:'LEAK',memoryIds:['m1','forbidden'],usage:null});
 const original=h.repository.resolveEvidence;h.repository.resolveEvidence=async(g,id)=>id==='forbidden'?null:original();
 await assert.rejects(h.gateway.reflect(h.req),e=>e.code==='EVIDENCE_STALE_OR_DENIED');
});
test('source edit during retain queues reconciliation instead of publishing stale projection',async()=>{
 const h=harness();h.api.retain=async()=>{h.source.revision='rev2';return {state:'RETAIN_ACCEPTED'}};
 await assert.rejects(h.gateway.retain(h.req));assert.equal(h.status().pending,true);assert.ok(!h.events.includes('projected'));
});
test('ambiguous retain failure never blindly retries',async()=>{
 const h=harness();let count=0;h.api.retain=async()=>{count++;throw new MemoryError('TIMEOUT',{ambiguous:true})};
 await assert.rejects(h.gateway.retain(h.req));assert.equal(count,1);assert.equal(h.status().pending,true);
});
test('forget blocks before provider delete and reports residual erasure',async()=>{
 const h=harness();const r=await h.gateway.forget(h.req);
 assert.ok(h.events.indexOf('blocked')<h.events.indexOf('delete'));assert.equal(r.erasure,'DERIVED_AND_BACKUP_VERIFICATION_PENDING');assert.equal(h.status().purged,true);
 await assert.rejects(h.gateway.recall(h.req));
});
test('delete outage retains tombstone and honest pending state',async()=>{
 const h=harness();h.api.deleteDocument=async()=>{throw new MemoryError('TIMEOUT',{ambiguous:true})};const r=await h.gateway.forget(h.req);
 assert.equal(r.erasure,'PURGE_PENDING');assert.equal(h.status().pending,true);assert.equal(h.status().purged,false);
});
test('aborted caller does not retrieve',async()=>{
 const h=harness();const c=new AbortController();c.abort();await assert.rejects(h.gateway.recall({...h.req,signal:c.signal}));assert.ok(!h.events.includes('recall'));
});
