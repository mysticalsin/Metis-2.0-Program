import { test } from 'node:test'
import assert from 'node:assert/strict'
import { snapshotEvaluation,validateEvaluation,usageFrom,MAX_REQUEST_BYTES } from '../dist/jev-contract.js'
import { actionTemplate,knowledgeTemplate,interactionTemplate,skillTemplate,acceptedChoice,classifyEvidence } from '../dist/jev-templates.js'
import { evaluation,wire,thresholds } from './jev-fixtures.mjs'
const mixed=knowledgeTemplate('Which source supports the requirement?',[{ref:'source-1',revision:'r1',excerpt:'The request is to prepare a draft only.'}])
test('Choice parser retains stable IDs, confidence, distribution and exact zero usage',()=>{const r=validateEvaluation(wire(),evaluation,'jev-1.13.0');assert.equal(r.answers.action.choice,'second');assert.equal(r.usage.outputTokens,0);assert.ok(Object.isFrozen(r.answers.action.probabilities))})
test('all three documented primitive types decode in one batch',()=>{const r=validateEvaluation(wire(mixed),mixed,'jev-1.13.0');assert.equal(r.answers.relevance.score,2);assert.equal(r.answers.conflict.noul,.01);assert.ok(!('confidence' in r.answers.conflict))})
const invalid={
 'model drift':r=>r.model='jev-latest',
 'extra answer':r=>r.answers.extra=r.answers.action,
 'missing answer':r=>delete r.answers.action,
 'wrong answer type':r=>r.answers.action.type='score',
 'out-of-catalog choice':r=>r.answers.action.choice='shell',
 'missing confidence':r=>delete r.answers.action.confidence,
 'confidence above one':r=>r.answers.action.confidence=1.1,
 'confidence NaN':r=>r.answers.action.confidence=NaN,
 'probability missing candidate':r=>delete r.answers.action.probabilities.first,
 'extra probability key':r=>r.answers.action.probabilities.unknown=0,
 'negative probability':r=>r.answers.action.probabilities.first=-.1,
 'distribution does not sum':r=>r.answers.action.probabilities.second=.5,
 'choice not argmax':r=>r.answers.action.choice='first'
}
for(const [name,mutate]of Object.entries(invalid))test(`rejects ${name}`,()=>{const r=wire();mutate(r);assert.throws(()=>validateEvaluation(r,evaluation,'jev-1.13.0'))})
for(const value of [null,undefined,-1,1.2,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'4'])test(`usage unknown is never zero: ${String(value)}`,()=>{assert.equal(usageFrom({input_tokens:value,output_tokens:0}).inputTokens,null);assert.equal(usageFrom({input_tokens:value,output_tokens:0}).outputTokens,0)})
for(const [name,change]of Object.entries({
 'wrong score legend':r=>r.answers.relevance.legend['0']='tampered',
 'inconsistent score':r=>r.answers.relevance.score=1,
 'missing score confidence':r=>delete r.answers.relevance.confidence,
 'Noul outside probability range':r=>r.answers.conflict.noul=1.1,
 'invented Noul confidence':r=>r.answers.conflict.confidence=.99
}))test(name,()=>{const r=wire(mixed);change(r);assert.throws(()=>validateEvaluation(r,mixed,'jev-1.13.0'))})
test('rejects empty question set, single choice and oversized shortlist',()=>{for(const e of [{state:'a',questions:{}},{state:'a',questions:{a:{type:'choice',instructions:'a',criteria:{a:'a'}}}},{state:'a',questions:{a:{type:'choice',instructions:'a',criteria:Object.fromEntries(Array.from({length:65},(_,i)=>['id'+i,'x']))}}}])assert.throws(()=>snapshotEvaluation(e))})
test('request size limit is bytes not characters; no truncation',()=>{assert.throws(()=>snapshotEvaluation({state:'漢'.repeat(23000),questions:evaluation.questions}));assert.throws(()=>snapshotEvaluation({state:'x',questions:{a:{type:'score',instructions:'x',criteria:['one']}}}))})
test('rejects accessors, non-JSON and hostile prototype keys without evaluating getters',()=>{let ran=false;const v={get state(){ran=true;return 'bad'},questions:evaluation.questions};assert.throws(()=>snapshotEvaluation(v));assert.equal(ran,false);assert.throws(()=>snapshotEvaluation(JSON.parse('{"state":"a","questions":{"__proto__":{"type":"noul","instructions":"x"}}}')))})
test('explicit clarification candidate is always offered; original user text preserved',()=>{const e=actionTemplate('Crée « Vendredi — São Paulo »; no enviar.',[{id:'note',label:'Create named note'}]);assert.equal(e.state.user_request,'Crée « Vendredi — São Paulo »; no enviar.');assert.ok(e.questions.action.criteria.needs_clarification)})
test('confidence is separate from top probability and margin',()=>{const a=wire().answers.action;assert.equal(acceptedChoice(a,thresholds),true);assert.equal(acceptedChoice({...a,confidence:.2},thresholds),false);assert.equal(acceptedChoice({...a,probabilities:{first:.4,second:.6,needs_clarification:0}},thresholds),false)})
test('Intelligence combines typed evidence labels without claiming truth',()=>{let a=validateEvaluation(wire(mixed,'cite_sources'),mixed,'jev-1.13.0').answers;assert.equal(classifyEvidence(a,thresholds),'candidate_evidence');assert.equal(classifyEvidence({...a,conflict:{type:'noul',noul:.9}},thresholds),'review_conflict');assert.equal(classifyEvidence({...a,conflict:{type:'noul',noul:.5}},thresholds),'insufficient_or_uncertain')})
test('intent and skills templates remain non-authoritative closed sets',()=>{assert.ok(interactionTemplate('How is it going?').questions.intent.criteria.status);assert.ok(skillTemplate('draft a document',[{id:'doc',label:'Approved doc skill'}]).questions.skill.criteria.needs_clarification)})

for(const value of [true,42,null])test(`instructions refuse non-text scalar ${value}`,()=>{assert.throws(()=>snapshotEvaluation({state:'x',questions:{a:{type:'noul',instructions:value}}}))})
test('structured instructions and Choice descriptions remain supported',()=>{assert.doesNotThrow(()=>snapshotEvaluation({state:'x',questions:{a:{type:'choice',instructions:{question:'Which?'},criteria:{a:{label:'A'},b:null}}}}))})
test('score labels deliberately require exact text for roundtrip legend validation',()=>{assert.throws(()=>snapshotEvaluation({state:'x',questions:{a:{type:'score',instructions:'rate',criteria:[{level:'a'},{level:'b'}]}}}))})
test('Choice/Noul reject scalar criterion values before a vendor request',()=>{for(const q of [{type:'choice',instructions:'x',criteria:{a:1,b:'b'}},{type:'noul',instructions:'x',criteria:{true:true,false:'No'}}])assert.throws(()=>snapshotEvaluation({state:'x',questions:{a:q}}))})
