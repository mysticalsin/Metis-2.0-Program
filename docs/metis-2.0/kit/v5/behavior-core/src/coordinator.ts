import { BehaviorAuthority, BoundaryError, type ScopeGrant, type Proposal, type ExactApproval, type Target, type Identity, type Kind, identityKey, finite, id, requireThat } from './authority.js'
import { NativeInputLeaseBroker, type InputLease } from './native-lease.js'
export type Outcome = 'verified'|'not_applied'|'unknown'|'cancelled'|'blocked'
export type Proof = Readonly<{ kind:'application_readback'|'api_commit'; operationId:string; proposalDigest:string; resourceId:string; expectedPostcondition:string; observedAtMs:number; result:'matched'|'confirmed_no_effect'|'uncertain'; evidenceRef:string }>
export type Receipt = Readonly<{ operationId:string; proposalDigest:string; identityKey:string; kind:Kind; authorityEpoch:number; policyEpoch:number; outcome:Outcome; dispatched:boolean; code:string; evidenceRef:string|null; startedAtMs:number; finishedAtMs:number; journalSettled:boolean; inputQuiesced:boolean }>
export type Reservation = Readonly<{ key:string; resourceKey:string; proposalDigest:string; operationId:string; identityKey:string }>
/** Mandatory durable, atomic host/service binding. An in-memory test store is NOT a deployment. */
export interface OperationJournal {
  /** Atomic reserve + exclusive mutation/read session resource lock. Never steal unknown work. */
  reserve(record:Reservation): Promise<'reserved'|'operation_exists'|'resource_busy'>
  /** Persist receipt; unknown or dispatched-without-proof MUST retain resource quarantine. */
  settle(key:string,receipt:Receipt): Promise<void>
}
export type IntentMatch = Readonly<{matches:boolean;sourceIntentRef:string;inputRevision:number;proposalDigest:string;expectedPostcondition:string}>
export interface ActionPort {
  /** Independently bind proposed literals/scope to canonical user intent, not the planner's own output. */
  matchIntent(p:Proposal,signal:AbortSignal):Promise<IntentMatch>
  /** These methods run trusted adapter code, not a model's claim of success. */
  observe(p:Proposal,signal:AbortSignal):Promise<Target>
  dispatch(p:Proposal,control:{signal:AbortSignal;inputLease:InputLease|null;assertCanDispatch:()=>void}):Promise<void>
  verify(p:Proposal,signal:AbortSignal):Promise<Proof>
  /** Fence and drain all native events. false/failure/timeout retains the device lock. */
  quiesce(inputLease:InputLease):Promise<boolean>
}
export type PhaseEvent = Readonly<{ phase:'preparing'|'working'|'verifying'|'settled'; operationId:string; outcome?:Outcome }>
export function reservationFor(p:Proposal): Reservation {
  // Scope resource locking across ALL agents/tasks on this device for this user.
  const resourceKey=JSON.stringify([p.binding.tenantId,p.binding.principalId,p.binding.deviceId,p.target.resourceId])
  return Object.freeze({key:JSON.stringify([p.binding.tenantId,p.binding.principalId,p.binding.deviceId,p.binding.taskId,p.operationId]),resourceKey,proposalDigest:p.digest,operationId:p.operationId,identityKey:identityKey(p.binding)})
}
const failureCode = (e:unknown):string => e instanceof BoundaryError ? e.code : 'ADAPTER_OR_STORAGE_ERROR'
/** A deadline also bounds transports that ignore AbortSignal. Late promises are observed. */
export async function bounded<T>(work:Promise<T>,signal:AbortSignal,timeoutMs:number):Promise<T> {
  requireThat(finite(timeoutMs)&&timeoutMs>0&&timeoutMs<=120000,'BAD_DEADLINE')
  return new Promise<T>((resolve,reject)=>{
    let done=false
    const finish=(ok:boolean,value:unknown)=>{
      if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',onAbort)
      if(ok)resolve(value as T);else reject(value)
    }
    const onAbort=()=>finish(false,new BoundaryError('CANCELLED'))
    const timer=setTimeout(()=>finish(false,new BoundaryError('DEADLINE_EXCEEDED')),timeoutMs)
    // Attach observers even if already cancelled, avoiding a late unhandled rejection.
    work.then(x=>finish(true,x),e=>finish(false,e))
    signal.addEventListener('abort',onAbort,{once:true})
    if(signal.aborted)onAbort()
  })
}
function validateProof(proof:Proof,p:Proposal,dispatchStartedAt:number,now:number): void {
  requireThat(proof && ['application_readback','api_commit'].includes(proof.kind),'UNTRUSTED_PROOF_KIND')
  requireThat(proof.operationId===p.operationId&&proof.proposalDigest===p.digest&&proof.resourceId===p.target.resourceId&&proof.expectedPostcondition===p.expectedPostcondition,'WRONG_PROOF')
  requireThat(finite(proof.observedAtMs)&&proof.observedAtMs>=dispatchStartedAt&&proof.observedAtMs<=now,'STALE_PROOF')
  requireThat(['matched','confirmed_no_effect','uncertain'].includes(proof.result)&&id(proof.evidenceRef),'MALFORMED_PROOF')
}
/** No retries or fallback route here: unknown side effects require reconciliation, not replay. */
export async function executeVerifiedOperation(options:{
  authority:BehaviorAuthority; proposal:Proposal; grant:ScopeGrant; approval?:ExactApproval;
  journal:OperationJournal; port:ActionPort; inputBroker:NativeInputLeaseBroker;
  timeoutMs?:number; policyRequiresApproval?:boolean; onPhase?:(event:PhaseEvent)=>void;
}):Promise<Receipt> {
  const {authority:a,proposal:p,grant:g,journal,port,inputBroker}=options
  const timeoutMs=options.timeoutMs??10000
  requireThat(finite(timeoutMs)&&timeoutMs>0&&timeoutMs<=120000,'BAD_DEADLINE')
  const started=a.now(); const reservation=reservationFor(p)
  let dispatchStartedAt=started
  let dispatched=false,reserved=false,lease:InputLease|null=null,proof:Proof|null=null
  let outcome:Outcome='blocked',code='BLOCKED',journalSettled=false,inputQuiesced=true
  const controller=new AbortController()
  const taskSignal=a.signal
  const abort=()=>{controller.abort(); if(lease)inputBroker.revoke(lease)}
  taskSignal.addEventListener('abort',abort,{once:true})
  if(taskSignal.aborted)abort()
  const emit=(phase:PhaseEvent['phase'],result?:Outcome)=>{
    // Display/animation faults must not own authorization or interrupt execution.
    try { options.onPhase?.(Object.freeze({phase,operationId:p.operationId,...(result?{outcome:result}:{})})) } catch { /* presentation only */ }
  }
  const remaining=()=>{ const n=timeoutMs-(a.now()-started); requireThat(n>0,'DEADLINE_EXCEEDED');return n }
  const wait=<T>(work:Promise<T>)=>{
    const observed=Promise.resolve(work);void observed.catch(()=>{})
    return bounded(observed,controller.signal,remaining())
  }
  const assertCanDispatch=()=>{
    requireThat(!controller.signal.aborted,'CANCELLED')
    requireThat(a.now()-started<timeoutMs,'DEADLINE_EXCEEDED')
    a.check(p,g,undefined,true)
    if(lease)inputBroker.assertActive(lease)
  }
  try {
    a.check(p,g);emit('preparing');a.check(p,g)
    // Literal/source-intent correctness is separate from merely allowing an action kind.
    const intent=await wait(port.matchIntent(p,controller.signal))
    a.check(p,g)
    requireThat(intent&&intent.matches===true&&id(intent.sourceIntentRef)&&intent.inputRevision===p.inputRevision&&intent.proposalDigest===p.digest&&intent.expectedPostcondition===p.expectedPostcondition,'INTENT_MISMATCH')
    // No context read through this port until task scope and intended result were validated.
    const observation=await wait(port.observe(p,controller.signal))
    a.check(p,g,observation)
    const answer=await wait(journal.reserve(reservation))
    requireThat(answer==='reserved',answer==='operation_exists'?'OPERATION_ALREADY_RECORDED':'RESOURCE_BUSY_OR_UNCERTAIN')
    reserved=true
    if(p.route==='foreground_input')lease=inputBroker.acquire(p.operationId)
    a.consume(p,g,observation,options.approval,options.policyRequiresApproval??false)
    assertCanDispatch()
    // Conservative boundary: once dispatch is invoked, throw/abort is not proof of no effect.
    dispatchStartedAt=a.now();dispatched=true
    const dispatchWork=port.dispatch(p,{signal:controller.signal,inputLease:lease,assertCanDispatch})
    emit('working');await wait(dispatchWork)
    assertCanDispatch();emit('verifying');assertCanDispatch()
    const candidate=await wait(port.verify(p,controller.signal))
    assertCanDispatch();const now=a.now();validateProof(candidate,p,dispatchStartedAt,now);proof=candidate
    outcome=proof.result==='matched'?'verified':proof.result==='confirmed_no_effect'?'not_applied':'unknown'
    code=outcome==='verified'?'POSTCONDITION_VERIFIED':outcome==='not_applied'?'POSTCONDITION_ABSENT':'POSTCONDITION_UNCERTAIN'
  } catch(e) {
    code=failureCode(e)
    outcome=dispatched?'unknown':(['CANCELLED','REVOKED_GRANT','SIGNED_OUT'].includes(code)?'cancelled':'blocked')
  } finally {
    taskSignal.removeEventListener('abort',abort);controller.abort()
    if(lease) {
      inputBroker.revoke(lease);inputQuiesced=false
      try {
        const ack=await bounded(port.quiesce(lease),new AbortController().signal,Math.min(timeoutMs,2000))
        if(ack===true){inputBroker.acknowledgeQuiescence(lease);inputQuiesced=true}
      } catch { /* fail closed: no new physical owner until native acknowledgement */ }
      if(!inputQuiesced){outcome=dispatched?'unknown':'blocked';code='NATIVE_NOT_QUIESCENT'}
    }
  }
  let finished:number
  try { finished=a.now() } catch { finished=started;outcome=dispatched?'unknown':'blocked';code='INVALID_CLOCK' }
  const make=(settled:boolean):Receipt=>Object.freeze({operationId:p.operationId,proposalDigest:p.digest,identityKey:identityKey(p.binding),kind:p.kind,authorityEpoch:p.epoch,policyEpoch:p.policyEpoch,outcome,dispatched,code,evidenceRef:proof?.evidenceRef??null,startedAtMs:started,finishedAtMs:finished,journalSettled:settled,inputQuiesced})
  if(reserved) {
    try {
      // Separate bounded settlement: cancellation cannot skip recording possible side effects.
      await bounded(journal.settle(reservation.key,make(true)),new AbortController().signal,Math.min(timeoutMs,2000))
      journalSettled=true
    } catch {
      outcome=dispatched?'unknown':'blocked';code='JOURNAL_UNSETTLED'
    }
  }
  const receipt=make(journalSettled);emit('settled',outcome);return receipt
}
/** No free-text model completion may replace this disposition without verified evidence. */
export function presentReceipt(r:Receipt,context:{binding:Identity;currentEpoch:number;currentPolicyEpoch:number;resultAuthorized:boolean}):{label:string;message:string;canSayDone:boolean} {
  if(context.resultAuthorized!==true || r.identityKey!==identityKey(context.binding) || r.authorityEpoch!==context.currentEpoch || r.policyEpoch!==context.currentPolicyEpoch)return {label:'Unavailable',message:'This result is not available in this conversation.',canSayDone:false}
  if(r.outcome==='verified'&&r.dispatched&&r.journalSettled&&r.inputQuiesced&&r.evidenceRef)return {label:'Done',message:r.kind==='read_resource'?'The requested information was verified.':r.kind==='insert_text'?'The text was inserted and verified.':'The requested change was verified.',canSayDone:true}
  if(r.outcome==='not_applied'&&r.journalSettled)return {label:'Not applied',message:'The requested result was not found. I have not retried the action.',canSayDone:false}
  if(r.outcome==='unknown'||(r.dispatched&&!r.journalSettled))return {label:'Could not verify',message:'I stopped further actions. The result is uncertain; I will not repeat the change without checking it.',canSayDone:false}
  if(r.outcome==='cancelled')return {label:'Stopped',message:'Stopped before dispatching this action.',canSayDone:false}
  return {label:'Needs you',message:'This action did not start. Check its target, permissions, or current task state.',canSayDone:false}
}

/** Exact current plan only. A completed first step is not a completed multi-step task. */
export function summarizeTask(receipts:readonly Receipt[],expectedOperationIds:readonly string[],context:Parameters<typeof presentReceipt>[1]):Readonly<{state:'done'|'partial'|'pending'|'needs_review';verified:number;planned:number}> {
  if(!expectedOperationIds.length||!expectedOperationIds.every(id)||new Set(expectedOperationIds).size!==expectedOperationIds.length)return Object.freeze({state:'needs_review',verified:0,planned:expectedOperationIds.length})
  const seen=new Set<string>();let verified=0
  for(const r of receipts){
    if(seen.has(r.operationId)||!expectedOperationIds.includes(r.operationId)||presentReceipt(r,context).label==='Unavailable')return Object.freeze({state:'needs_review',verified:0,planned:expectedOperationIds.length})
    seen.add(r.operationId)
    if(presentReceipt(r,context).canSayDone)verified++
  }
  return Object.freeze({state:verified===expectedOperationIds.length?'done':verified>0?'partial':'pending',verified,planned:expectedOperationIds.length})
}
