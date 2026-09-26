import test from 'node:test'
import assert from 'node:assert/strict'
import { PlaybackLedger, maySpeak, controlDisposition } from '../dist/voice.js'
import { NativeInputLeaseBroker } from '../dist/native-lease.js'
const normal={audienceAuthorized:true,muted:false,callActive:false,sharing:false,focusMode:false,privateOutputVerified:false,explicitRequest:false,routine:false}
test('barge-in carries the ACTUALLY played position, not queued duration',()=>{const v=new PlaybackLedger(),t=v.start('response-a','task-a');v.acceptChunk(t,0,0,1000);v.acceptChunk(t,1,1000,1000);v.acknowledgePlayed(t,650);assert.equal(v.interrupt().heardThroughMs,650);assert.equal(v.acceptChunk(t,2,2000,100),false)})
test('new voice owner requires interruption/drain of old owner',()=>{const v=new PlaybackLedger();v.start('r1','t1');assert.throws(()=>v.start('r2','t2'));v.interrupt();assert.doesNotThrow(()=>v.start('r2','t2'))})
test('duplicate and out-of-order voice chunks are rejected',()=>{const v=new PlaybackLedger(),t=v.start('r','t');assert.equal(v.acceptChunk(t,1,0,100),false);assert.equal(v.acceptChunk(t,0,0,100),true);assert.equal(v.acceptChunk(t,0,0,100),false);assert.equal(v.acceptChunk(t,1,90,100),false)})
test('played cursor cannot run backward or beyond delivered audio',()=>{const v=new PlaybackLedger(),t=v.start('r','t');v.acceptChunk(t,0,0,100);assert.equal(v.acknowledgePlayed(t,101),false);assert.equal(v.acknowledgePlayed(t,50),true);assert.equal(v.acknowledgePlayed(t,20),false);assert.equal(v.acknowledgePlayed(t,NaN),false)})
test('unknown playback token cannot acknowledge hearing',()=>{const v=new PlaybackLedger(),t=v.start('r','t');assert.equal(v.acceptChunk({...t},0,0,100),false)})
test('ending synthesis is not the same as finishing playback',()=>{const v=new PlaybackLedger(),t=v.start('r','t');v.acceptChunk(t,0,0,100);assert.equal(v.end(t),false);v.acknowledgePlayed(t,100);assert.equal(v.end(t),true)})
for(const patch of [{audienceAuthorized:false},{audienceAuthorized:undefined},{muted:true},{muted:undefined},{callActive:true},{sharing:true},{focusMode:true,routine:true}])test(`quiet-output boundary ${JSON.stringify(patch)}`,()=>assert.equal(maySpeak({...normal,...patch}),false))
test('private explicit response in a call requires a verified output route',()=>{assert.equal(maySpeak({...normal,callActive:true,explicitRequest:true}),false);assert.equal(maySpeak({...normal,callActive:true,explicitRequest:true,privateOutputVerified:true}),true)})
test('ordinary manual completion can speak outside quiet contexts',()=>assert.equal(maySpeak(normal),true))
for(const control of ['stop_speaking','status_question','change_reply_language'])test(`${control} must not revoke action authority`,()=>{const d=controlDisposition(control);assert.equal(d.flushSpeech,true);assert.equal(d.revokeActionAuthority,false)})
for(const control of ['pause_task','cancel_task','stop_all','human_takeover','correct_action'])test(`${control} revokes old action authority`,()=>{const d=controlDisposition(control);assert.equal(d.revokeActionAuthority,true);assert.equal(d.requiresFreshIntent,true)})
test('only one physical input owner',()=>{const b=new NativeInputLeaseBroker();b.acquire('agent-a');assert.throws(()=>b.acquire('agent-b'));assert.equal(b.state,'active')})
test('revocation does not prematurely free physical input',()=>{const b=new NativeInputLeaseBroker(),t=b.acquire('op');b.revoke(t);assert.throws(()=>b.acquire('op2'));b.acknowledgeQuiescence(t);assert.equal(b.state,'free')})
test('old drain acknowledgement cannot release a new owner',()=>{const b=new NativeInputLeaseBroker(),a=b.acquire('a');b.revoke(a);b.acknowledgeQuiescence(a);const c=b.acquire('c');assert.throws(()=>b.acknowledgeQuiescence(a));assert.doesNotThrow(()=>b.assertActive(c))})
test('fabricated token cannot control native lease',()=>{const b=new NativeInputLeaseBroker(),a=b.acquire('a');assert.throws(()=>b.assertActive({...a}));b.revoke({...a});assert.equal(b.state,'active')})
test('quiescence acknowledgement requires prior revocation',()=>{const b=new NativeInputLeaseBroker(),a=b.acquire('a');assert.throws(()=>b.acknowledgeQuiescence(a))})
test('seeded playback sequence corpus preserves monotonic audible position and retired-owner fences',()=>{
 let seed=0x6d2b79f5,transitions=0
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32}
 for(let cycle=0;cycle<200;cycle++){
  const v=new PlaybackLedger(),t=v.start(`r-${cycle}`,`t-${cycle}`);let queued=0,played=0
  for(let i=0;i<25;i++){
   const duration=1+Math.floor(rand()*400);assert.equal(v.acceptChunk(t,i,queued,duration),true);queued+=duration
   played+=Math.floor(rand()*(queued-played+1));assert.equal(v.acknowledgePlayed(t,played),true)
   assert.equal(v.acceptChunk({...t},i+1,queued,1),false);transitions++
  }
  const stopped=v.interrupt();assert.equal(stopped.heardThroughMs,played);assert.equal(v.acceptChunk(t,25,queued,1),false)
 }
 assert.equal(transitions,5000)
})
test('audio queue applies backpressure without skipping a sequence number',()=>{const v=new PlaybackLedger(1000,3000),t=v.start('r','t');assert.equal(v.acceptChunk(t,0,0,800),true);assert.equal(v.acceptChunk(t,1,800,400),false);v.acknowledgePlayed(t,500);assert.equal(v.acceptChunk(t,1,800,400),true)})
test('unknown call or sharing state prevents unprompted audio',()=>{assert.equal(maySpeak({...normal,callActive:undefined}),false);assert.equal(maySpeak({...normal,sharing:undefined}),false)})
test('unknown control has no permissive default',()=>assert.throws(()=>controlDisposition('do-anything')))
test('response budget stays bounded even when buffer is drained',()=>{const v=new PlaybackLedger(1000,1000),t=v.start('r','t');v.acceptChunk(t,0,0,1000);v.acknowledgePlayed(t,1000);assert.equal(v.acceptChunk(t,1,1000,1),false)})
