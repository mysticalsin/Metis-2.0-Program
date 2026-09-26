/**
 * Candidate HOST-only behavior boundary. Not an IPC handler, identity provider or
 * native permission implementation. Production must authenticate ingress BEFORE
 * calling it. The renderer/model must never receive this object or its grant APIs.
 * Immutable opaque grants are process-local; persistence/replica fencing is a
 * separate mandatory binding. No text is sent to a service by this module.
 */
export type Mode = 'talk' | 'guide' | 'do' | 'dictate'
export type InputSource = 'command-microphone' | 'trusted-typed' | 'meeting-audio' | 'assistant-playback' | 'tool-output' | 'document'
export type Kind = 'read_resource' | 'open_application' | 'set_value' | 'insert_text' | 'create_document' | 'navigate' | 'send' | 'delete' | 'purchase' | 'share'
export type Route = 'connector' | 'native_semantic' | 'browser_dom' | 'foreground_input'
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
export type Identity = Readonly<{ tenantId: string; principalId: string; deviceId: string; sessionId: string; agentId: string; taskId: string }>
export type Target = Readonly<{ resourceId: string; appId: string; windowId: string; fieldId: string; revision: string; transformId: string; observedAtMs: number; protected: boolean }>
export type Proposal = Readonly<{
  binding: Identity; epoch: number; policyEpoch: number; inputRevision: number;
  mode: Mode; operationId: string; kind: Kind; route: Route; args: Json;
  target: Target; expectedPostcondition: string; digest: string;
}>
export type ScopeGrant = Readonly<{ epoch: number; policyEpoch: number; inputRevision: number; expiresAtMs: number; resources: readonly string[]; capabilities: readonly Kind[]; routes: readonly Route[]; mode: Mode; maxOperations: number }>
export type ExactApproval = Readonly<{ digest: string; epoch: number; expiresAtMs: number }>
export class BoundaryError extends Error {
  constructor(public readonly code: string) { super(code); this.name = 'BoundaryError' }
}
export function requireThat(value: unknown, code: string): asserts value { if (!value) throw new BoundaryError(code) }
export function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
export function id(value: unknown): value is string { return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:/@-]{0,191}$/.test(value) }
const KINDS: readonly Kind[] = ['read_resource','open_application','set_value','insert_text','create_document','navigate','send','delete','purchase','share']
const ROUTES: readonly Route[] = ['connector','native_semantic','browser_dom','foreground_input']
const MODES: readonly Mode[] = ['talk','guide','do','dictate']
export const consequential = (kind: Kind): boolean => ['send','delete','purchase','share'].includes(kind)
export const mutates = (kind: Kind): boolean => kind !== 'read_resource'
export function identityKey(binding: Identity): string {
  return JSON.stringify([binding.tenantId,binding.principalId,binding.deviceId,binding.sessionId,binding.agentId,binding.taskId])
}
function validateIdentity(binding: Identity): void {
  requireThat(binding && ['tenantId','principalId','deviceId','sessionId','agentId','taskId'].every(k => id(binding[k as keyof Identity])), 'BAD_IDENTITY')
}
export function canonical(value: unknown, depth = 0): string {
  requireThat(depth <= 12, 'PAYLOAD_TOO_DEEP')
  if (value === null) return 'null'
  if (typeof value === 'string') { requireThat(value.length <= 32768, 'STRING_TOO_LARGE'); return JSON.stringify(value) }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') { requireThat(Number.isFinite(value), 'BAD_NUMBER'); return JSON.stringify(value) }
  if (Array.isArray(value)) {
    requireThat(value.length <= 128, 'ARRAY_TOO_LARGE')
    // Reject sparse arrays instead of silently changing their meaning.
    for (let i=0;i<value.length;i++) {
      const d=Object.getOwnPropertyDescriptor(value,String(i))
      requireThat(d,'SPARSE_ARRAY')
      requireThat('value' in d && d.enumerable, 'ACCESSOR_OR_HIDDEN_FIELD')
    }
    requireThat(Reflect.ownKeys(value).length===value.length+1, 'EXTRA_ARRAY_FIELD')
    return '[' + value.map(x => canonical(x,depth+1)).join(',') + ']'
  }
  requireThat(typeof value === 'object' && value !== null, 'NOT_JSON')
  const proto = Object.getPrototypeOf(value)
  requireThat(proto === Object.prototype || proto === null, 'NOT_PLAIN_OBJECT')
  const descriptors = Object.getOwnPropertyDescriptors(value)
  requireThat(Reflect.ownKeys(value).every(k => typeof k === 'string'), 'SYMBOL_KEY')
  const keys = Object.keys(descriptors).sort()
  requireThat(keys.length <= 128, 'TOO_MANY_KEYS')
  return '{' + keys.map(k => {
    const d = descriptors[k]!
    requireThat(k.length <= 128 && !['__proto__','constructor','prototype'].includes(k), 'BAD_KEY')
    requireThat('value' in d && d.enumerable, 'ACCESSOR_OR_HIDDEN_FIELD')
    return JSON.stringify(k)+':'+canonical(d.value,depth+1)
  }).join(',') + '}'
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.freeze(value); for (const v of Object.values(value)) deepFreeze(v) }
  return value
}
function immutableJson(value: Json): Json {
  const text = canonical(value)
  requireThat(new TextEncoder().encode(text).length <= 131072, 'PAYLOAD_TOO_LARGE')
  return deepFreeze(JSON.parse(text) as Json)
}
function validateArgs(kind: Kind, args: Json): void {
  requireThat(args !== null && typeof args === 'object' && !Array.isArray(args), 'BAD_ARGS')
  const a = args as Record<string,Json>
  const exact = (keys: string[]) => requireThat(Object.keys(a).length===keys.length && keys.every(k=>Object.hasOwn(a,k)), 'BAD_ARG_KEYS')
  const text = (v: Json|undefined) => typeof v==='string' && v.length>0 && v.length<=32768
  const ids = (v: Json|undefined) => Array.isArray(v) && v.length>0 && v.length<=32 && v.every(id) && new Set(v).size===v.length
  switch(kind) {
    case 'read_resource': exact([]); break
    case 'open_application': exact(['appId']); requireThat(id(a.appId),'BAD_APP'); break
    case 'set_value': exact(['value']); requireThat(typeof a.value==='string','BAD_VALUE'); break
    case 'insert_text': exact(['text']); requireThat(text(a.text),'BAD_TEXT'); break
    case 'create_document': exact(['title','content']); requireThat(text(a.title) && typeof a.content==='string','BAD_DOCUMENT'); break
    case 'navigate': {
      exact(['url']); requireThat(text(a.url),'BAD_URL')
      let u: URL; try { u = new URL(a.url as string) } catch { throw new BoundaryError('BAD_URL') }
      requireThat(u.protocol==='https:' && !u.username && !u.password, 'BAD_URL')
      // Origin/account navigation allowlists still belong in the host adapter policy.
      break
    }
    case 'send': exact(['recipientIds','body']); requireThat(ids(a.recipientIds) && text(a.body),'BAD_MESSAGE'); break
    case 'delete': exact(['objectId']); requireThat(id(a.objectId),'BAD_OBJECT'); break
    case 'purchase': exact(['itemId','quantity','currency','totalMinorUnits']); requireThat(id(a.itemId) && typeof a.quantity==='number' && Number.isSafeInteger(a.quantity) && a.quantity>0 && typeof a.currency==='string' && /^[A-Z]{3}$/.test(a.currency) && typeof a.totalMinorUnits==='number' && Number.isSafeInteger(a.totalMinorUnits) && a.totalMinorUnits>=0,'BAD_PURCHASE'); break
    case 'share': exact(['principalIds','permission']); requireThat(ids(a.principalIds) && ['read','edit'].includes(a.permission as string),'BAD_SHARE'); break
  }
}
function validateTarget(t: Target): void {
  requireThat(t && ['resourceId','appId','windowId','fieldId','revision','transformId'].every(k=>id(t[k as keyof Target])), 'BAD_TARGET')
  requireThat(finite(t.observedAtMs) && t.observedAtMs>=0 && typeof t.protected==='boolean','BAD_OBSERVATION')
}
export function targetMatches(a:Target,b:Target): boolean {
  return ['resourceId','appId','windowId','fieldId','revision','transformId'].every(k=>a[k as keyof Target]===b[k as keyof Target])
}
export async function digestProposal(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode('metis.behavior.proposal.v2\n'+canonical(value))
  const hash = await crypto.subtle.digest('SHA-256',bytes)
  return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('')
}
/** Host instance is fixed to one identity/task. Recreate and revoke on identity change. */
export class BehaviorAuthority {
  private epoch = 0
  private policyEpoch: number
  private revision = -1
  private disabled = false
  private grantState = new WeakMap<ScopeGrant,{ used: number }>()
  private approvals = new WeakSet<ExactApproval>()
  private proposals = new WeakSet<Proposal>()
  private currentAbort = new AbortController()
  private lastNow = -1
  readonly binding: Identity
  constructor(binding: Identity, private readonly clock:()=>number, policyEpoch = 0) {
    validateIdentity(binding); requireThat(Number.isSafeInteger(policyEpoch)&&policyEpoch>=0,'BAD_POLICY_EPOCH')
    this.binding=deepFreeze({...binding}); this.policyEpoch=policyEpoch
  }
  now(): number {
    const n=this.clock(); requireThat(finite(n)&&n>=0&&n>=this.lastNow,'INVALID_CLOCK')
    this.lastNow=n; return n
  }
  get signal(): AbortSignal { return this.currentAbort.signal }
  get authorityEpoch(): number { return this.epoch }
  invalidate(reason: 'stop'|'pause'|'correction'|'takeover'|'signout'|'policy'): void {
    this.epoch++; this.currentAbort.abort(new BoundaryError(reason.toUpperCase()))
    this.currentAbort=new AbortController()
    if (reason==='signout') this.disabled=true
  }
  updatePolicy(epoch: number): void {
    requireThat(Number.isSafeInteger(epoch)&&epoch>=this.policyEpoch,'BAD_POLICY_EPOCH')
    if(epoch!==this.policyEpoch) { this.policyEpoch=epoch; this.invalidate('policy') }
  }
  /** Caller must have authenticated the source/capture owner; this enum is NOT authentication. */
  beginIntent(input: { source: InputSource; final: boolean; revision: number; mode: Mode; resources: string[]; capabilities: Kind[]; routes: Route[]; ttlMs: number; maxOperations: number }): ScopeGrant {
    requireThat(!this.disabled,'SIGNED_OUT')
    requireThat(['command-microphone','trusted-typed'].includes(input.source),'UNTRUSTED_INPUT')
    requireThat(input.final===true,'UNSTABLE_INPUT')
    requireThat(Number.isSafeInteger(input.revision)&&input.revision>this.revision,'STALE_INPUT')
    requireThat(MODES.includes(input.mode),'BAD_MODE')
    requireThat(Array.isArray(input.resources)&&input.resources.length>0&&input.resources.length<=32&&input.resources.every(id)&&new Set(input.resources).size===input.resources.length,'BAD_RESOURCES')
    requireThat(Array.isArray(input.capabilities)&&input.capabilities.length>0&&input.capabilities.every(k=>KINDS.includes(k))&&new Set(input.capabilities).size===input.capabilities.length,'BAD_CAPABILITIES')
    requireThat(Array.isArray(input.routes)&&input.routes.length>0&&input.routes.every(r=>ROUTES.includes(r))&&new Set(input.routes).size===input.routes.length,'BAD_ROUTES')
    requireThat(finite(input.ttlMs)&&input.ttlMs>0&&input.ttlMs<=300000,'BAD_TTL')
    requireThat(Number.isSafeInteger(input.maxOperations)&&input.maxOperations>0&&input.maxOperations<=100,'BAD_BUDGET')
    const now=this.now()
    this.invalidate('correction'); this.revision=input.revision
    const grant=deepFreeze({epoch:this.epoch,policyEpoch:this.policyEpoch,inputRevision:this.revision,expiresAtMs:now+input.ttlMs,resources:[...input.resources],capabilities:[...input.capabilities],routes:[...input.routes],mode:input.mode,maxOperations:input.maxOperations})
    this.grantState.set(grant,{used:0}); return grant
  }
  async propose(grant: ScopeGrant, input: {operationId:string; kind:Kind; route:Route; args:Json; target:Target; expectedPostcondition:string}): Promise<Proposal> {
    this.checkGrant(grant)
    requireThat(id(input.operationId)&&id(input.expectedPostcondition),'BAD_OPERATION')
    requireThat(KINDS.includes(input.kind)&&ROUTES.includes(input.route),'UNREGISTERED_ACTION')
    validateTarget(input.target)
    const args=immutableJson(input.args); validateArgs(input.kind,args)
    const base={binding:this.binding,epoch:grant.epoch,policyEpoch:grant.policyEpoch,inputRevision:grant.inputRevision,mode:grant.mode,operationId:input.operationId,kind:input.kind,route:input.route,args,target:{...input.target},expectedPostcondition:input.expectedPostcondition}
    const p=deepFreeze({...base,digest:await digestProposal(base)})
    this.proposals.add(p); this.check(p,grant)
    return p
  }
  private checkGrant(g: ScopeGrant, enforceBudget=true): {used:number} {
    const state=this.grantState.get(g)
    requireThat(state,'FOREIGN_GRANT')
    requireThat(!this.disabled,'SIGNED_OUT')
    requireThat(g.epoch===this.epoch && g.policyEpoch===this.policyEpoch && g.inputRevision===this.revision,'REVOKED_GRANT')
    requireThat(this.now()<g.expiresAtMs,'EXPIRED_GRANT')
    if(enforceBudget) requireThat(state.used<g.maxOperations,'ACTION_BUDGET_EXHAUSTED')
    return state
  }
  check(p:Proposal,g:ScopeGrant,observation?:Target,afterConsumption=false): void {
    this.checkGrant(g,!afterConsumption); requireThat(this.proposals.has(p),'FOREIGN_PROPOSAL')
    requireThat(identityKey(p.binding)===identityKey(this.binding),'WRONG_IDENTITY')
    requireThat(p.epoch===g.epoch && p.policyEpoch===g.policyEpoch && p.inputRevision===g.inputRevision && p.mode===g.mode,'STALE_PROPOSAL')
    requireThat(g.resources.includes(p.target.resourceId),'RESOURCE_NOT_GRANTED')
    requireThat(g.capabilities.includes(p.kind),'CAPABILITY_NOT_GRANTED')
    requireThat(g.routes.includes(p.route),'ROUTE_NOT_GRANTED')
    requireThat(!p.target.protected,'PROTECTED_TARGET')
    if(p.mode==='talk'||p.mode==='guide') requireThat(p.kind==='read_resource' && p.route!=='foreground_input','MODE_ESCALATION')
    if(p.mode==='dictate') requireThat(p.kind==='insert_text','DICTATION_NOT_SUBMISSION')
    if(p.kind==='open_application') requireThat((p.args as Record<string,Json>).appId===p.target.appId,'WRONG_APP')
    if(observation) {
      validateTarget(observation); requireThat(!observation.protected,'PROTECTED_TARGET')
      requireThat(targetMatches(p.target,observation),'STALE_TARGET')
      const age=this.now()-observation.observedAtMs
      requireThat(age>=0&&age<=1500,'EXPIRED_OBSERVATION')
    }
  }
  /** Only the trusted confirmation controller calls this after presenting the exact proposal. */
  approve(p:Proposal,g:ScopeGrant,confirmedDigest:string,ttlMs=30000): ExactApproval {
    this.check(p,g); requireThat(confirmedDigest===p.digest,'APPROVAL_PAYLOAD_CHANGED')
    requireThat(finite(ttlMs)&&ttlMs>0&&ttlMs<=30000,'BAD_APPROVAL_TTL')
    const a=deepFreeze({digest:p.digest,epoch:p.epoch,expiresAtMs:Math.min(g.expiresAtMs,this.now()+ttlMs)})
    this.approvals.add(a); return a
  }
  /** Called synchronously at the final dispatcher boundary, after all awaited setup. */
  consume(p:Proposal,g:ScopeGrant,observation:Target,approval?:ExactApproval,policyRequiresApproval=false): void {
    this.check(p,g,observation)
    if(consequential(p.kind)||policyRequiresApproval) {
      requireThat(approval&&this.approvals.has(approval),'EXACT_APPROVAL_REQUIRED')
      requireThat(approval.digest===p.digest&&approval.epoch===p.epoch&&this.now()<approval.expiresAtMs,'STALE_APPROVAL')
      this.approvals.delete(approval)
    }
    this.grantState.get(g)!.used++
  }
}
