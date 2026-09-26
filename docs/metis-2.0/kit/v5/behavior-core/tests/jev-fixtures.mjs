// Explicit synthetic auth, decision, journal fixtures. NEVER import into production.
import { binding } from './fixtures.mjs'
import { freeze,validateEvaluation,DecisionFailure } from '../dist/jev-contract.js'
import { ManagedDecisionService } from '../dist/jev-service.js'
import { actionTemplate,TEMPLATE_VERSIONS } from '../dist/jev-templates.js'
export const thresholds={choiceConfidence:.8,choiceProbability:.8,choiceMargin:.3,scoreConfidence:.8,noulYes:.85,noulNo:.15}
export const decisionBinding={identity:binding,inputRevision:1,authorityEpoch:1,contextRevision:'context-1',policyRevision:'policy-1'}
export const evaluation=actionTemplate('Create the second note.',[{id:'first',label:'Create first note'},{id:'second',label:'Create second note'}])
export function wire(e=evaluation,selected='second',overrides={}){
 const answers={}
 for(const [id,q] of Object.entries(e.questions)){
  if(q.type==='choice'){
   const keys=Object.keys(q.criteria),choice=keys.includes(selected)?selected:keys[0],probabilities=Object.fromEntries(keys.map(k=>[k,k===choice?1:0]))
   answers[id]={type:'choice',choice,probabilities,confidence:.97}
  }else if(q.type==='score'){
   const n=q.criteria.length-1
   answers[id]={type:'score',score:n,probabilities:Object.fromEntries(q.criteria.map((_,i)=>[String(i),i===n?1:0])),legend:Object.fromEntries(q.criteria.map((x,i)=>[String(i),x])),confidence:.95}
  }else answers[id]={type:'noul',noul:.01}
 }
 return {model:'jev-1.13.0',answers,usage:{input_tokens:100,output_tokens:0},...overrides}
}
export const request=(extra={})=>({requestId:'request-1',binding:structuredClone(decisionBinding),source:'trusted-typed',final:true,purpose:'action-selection',templateVersion:TEMPLATE_VERSIONS.action,language:'en',candidateCount:3,candidateSetDigest:'a'.repeat(64),dataClass:'synthetic',evaluation,...extra})
export function policy(extra={}){
 const profile=model=>({model,credentialRevision:'credential-1',dataReviewRef:'synthetic-review-only',allowApprovedContent:false,desktopAssistance:true,intelligenceAssessments:true,qualification:{evidenceRef:'test-only-profile-NOT-MODEL-QUALIFICATION',expiresAtMs:100000,templateVersions:Object.values(TEMPLATE_VERSIONS),languages:['en','fr-CA','es','pt-BR'],purposes:['action-selection','interaction-intent','skill-selection','knowledge-triage'],maxCandidates:32,thresholds}})
 return {revision:'policy-1',mode:'jev',primary:'jev',allowFallback:false,fallbackOn:[],timeoutMs:1000,backends:{jev:profile('jev-1.13.0'),laya:profile('laya-test-pinned')},...extra}
}
export class TestDecisionJournal{
 starts=[];receipts=[];keys=new Set();verdict='reserved';settleError=false
 async reserve(start){if(this.verdict!=='reserved')return this.verdict;const k=JSON.stringify([start.binding.identity.tenantId,start.binding.identity.principalId,start.binding.identity.deviceId,start.requestId,start.provider]);if(this.keys.has(k))return 'duplicate';this.keys.add(k);this.starts.push(start);return 'reserved'}
 async settle(r){if(this.settleError)throw Error('test storage outage');this.receipts.push(r)}
}
export function setup(options={}){
 let now=1000;const journal=options.journal??new TestDecisionJournal(),calls=[],checks=[]
 const security={authorize:async r=>{if(options.authorize) return options.authorize(r);return options.policy??policy()},assertCurrent:async(r,p,provider,phase)=>{checks.push({phase,provider});await options.current?.(r,p,provider,phase)}}
 const backend=provider=>({provider,model:provider==='jev'?'jev-1.13.0':'laya-test-pinned',evaluate:async(e,signal,ms)=>{calls.push(provider);if(options.evaluate)return options.evaluate(e,signal,ms,provider);return validateEvaluation(wire(e,'second',{model:provider==='jev'?'jev-1.13.0':'laya-test-pinned'}),e,provider==='jev'?'jev-1.13.0':'laya-test-pinned')}})
 const service=new ManagedDecisionService({security,journal,backends:options.backends??{jev:backend('jev'),laya:backend('laya')},now:()=>now})
 return {service,journal,calls,checks,security,setNow:n=>now=n}
}
export const abortSignal=()=>new AbortController().signal
export const jsonResponse=body=>new Response(JSON.stringify(body),{headers:{'content-type':'application/json'}})
