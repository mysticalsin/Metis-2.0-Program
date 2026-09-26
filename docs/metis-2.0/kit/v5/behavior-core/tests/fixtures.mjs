// Explicit single-process test doubles. Neither journal nor port is production CUA.
import { BehaviorAuthority, identityKey } from '../dist/authority.js'
import { NativeInputLeaseBroker } from '../dist/native-lease.js'
export const binding={tenantId:'tenant-a',principalId:'user-a',deviceId:'mac-a',sessionId:'session-a',agentId:'agent-a',taskId:'task-a'}
export const target={resourceId:'doc-a',appId:'notes',windowId:'window-a',fieldId:'field-a',revision:'rev-1',transformId:'display-1',observedAtMs:1000,protected:false}
export const turn={source:'command-microphone',final:true,revision:1,mode:'do',resources:['doc-a'],capabilities:['read_resource','open_application','set_value','insert_text','create_document','navigate','send','delete','purchase','share'],routes:['connector','native_semantic','browser_dom','foreground_input'],ttlMs:30000,maxOperations:8}
export const sleep=ms=>new Promise(r=>setTimeout(r,ms))
export class MemoryJournal {
  records=new Map();resources=new Map();receipts=[]
  async reserve(r){
    if(this.records.has(r.key))return 'operation_exists'
    if(this.resources.has(r.resourceKey))return 'resource_busy'
    this.records.set(r.key,{...r});this.resources.set(r.resourceKey,r.key);return 'reserved'
  }
  async settle(key,receipt){
    const r=this.records.get(key);if(!r)throw Error('missing reservation')
    this.records.set(key,{...r,receipt});this.receipts.push(receipt)
    if(receipt.outcome==='verified'||receipt.outcome==='not_applied'||!receipt.dispatched)this.resources.delete(r.resourceKey)
  }
}
export async function fixture(options={}){
  let now=1000
  const a=new BehaviorAuthority(options.binding??binding,()=>now)
  const g=a.beginIntent({...turn,...options.intent})
  const spec={operationId:'op-a',kind:'create_document',route:'native_semantic',args:{title:'Friday plan',content:'First\nSecond\nThird'},target:{...target},expectedPostcondition:'document-content-equals',...options.proposal}
  const p=await a.propose(g,spec)
  const journal=new MemoryJournal(),inputBroker=new NativeInputLeaseBroker(),calls=[]
  let effect=null
  const port={
    async matchIntent(request){return {matches:true,sourceIntentRef:'synthetic-user-intent-a',inputRevision:request.inputRevision,proposalDigest:request.digest,expectedPostcondition:request.expectedPostcondition}},
    async observe(){calls.push('observe');return {...p.target,observedAtMs:now}},
    async dispatch(request,control){control.assertCanDispatch();calls.push('dispatch');effect=structuredClone(request.args)},
    async verify(request){calls.push('verify');return {kind:'application_readback',operationId:request.operationId,proposalDigest:request.digest,resourceId:request.target.resourceId,expectedPostcondition:request.expectedPostcondition,observedAtMs:now,result:effect?'matched':'uncertain',evidenceRef:'proof-a'}},
    async quiesce(){calls.push('quiesce');return true}
  }
  return {a,g,p,spec,journal,inputBroker,port,calls,setNow:n=>{now=n},getNow:()=>now,getEffect:()=>effect,options:()=>({authority:a,grant:g,proposal:p,journal,inputBroker,port,timeoutMs:1000}),context:()=>({binding:a.binding,currentEpoch:a.authorityEpoch,currentPolicyEpoch:0,resultAuthorized:true})}
}
