'use strict'
const {test}=require('node:test')
const assert=require('node:assert/strict')
const {load}=require('./source-loader.cjs')
const {createDemoPlaybackClock,runOptionalDemoMedia,watchDemoEnvironment,
 readDemoEnvironment,demoPlaybackStatus}=load('src/renderer/src/lib/onboarding-demo-controls.ts')

function scheduler() {
  let now=0,id=0
  const pending=new Map(),cancelled=[]
  return {
    now:()=>now,
    request:cb=>{const next=id++;pending.set(next,cb);return next},
    cancel:key=>{cancelled.push(key);pending.delete(key)},
    at:value=>{now=value},
    tick:value=>{
      now=value
      const batch=[...pending.entries()]
      pending.clear()
      for(const [,callback]of batch)callback(value)
    },
    pending,cancelled
  }
}
function fixture(duration=1000) {
  const frames=[],s=scheduler()
  const c=createDemoPlaybackClock(duration,s,x=>frames.push(x))
  return {c,s,frames}
}
test('clock is idle until explicitly played',()=>{
  const {c,s,frames}=fixture()
  assert.deepEqual(c.snapshot(),{elapsedMs:0,phase:'paused'})
  assert.equal(s.pending.size,0)
  assert.equal(frames.length,0)
})
for(const duration of [-1,NaN,Infinity,-Infinity]){
  test(`invalid duration ${duration} is rejected`,()=>{
    assert.throws(()=>createDemoPlaybackClock(duration,scheduler(),()=>{}),RangeError)
  })
}
test('duplicate play schedules only one callback',()=>{
  const {c,s,frames}=fixture()
  c.play();c.play();c.play()
  assert.equal(s.pending.size,1)
  assert.equal(frames.length,1)
})
test('elapsed time accumulates exactly over animation frames',()=>{
  const {c,s}=fixture()
  c.play();s.tick(10);s.tick(45);s.tick(300)
  assert.deepEqual(c.snapshot(),{elapsedMs:300,phase:'playing'})
  assert.equal(s.pending.size,1)
})
test('pause samples the current position even between frames',()=>{
  const {c,s}=fixture()
  c.play();s.tick(100);s.at(145);c.pause()
  assert.deepEqual(c.snapshot(),{elapsedMs:145,phase:'paused'})
  assert.equal(s.pending.size,0)
})
test('pause/resume excludes ten minutes spent hidden',()=>{
  const {c,s}=fixture()
  c.play();s.tick(100);s.at(150);c.pause()
  s.at(600150);c.play();s.tick(600175)
  assert.equal(c.snapshot().elapsedMs,175)
})
test('backwards frame timestamps neither rewind nor double count',()=>{
  const {c,s}=fixture()
  c.play();s.tick(100);s.tick(50);s.tick(120)
  assert.equal(c.snapshot().elapsedMs,120)
})
test('a huge frame stops precisely at the current step hold',()=>{
  const {c,s,frames}=fixture(2999)
  c.play();s.tick(1e9)
  assert.deepEqual(c.snapshot(),{elapsedMs:2999,phase:'held'})
  assert.equal(s.pending.size,0)
  assert.equal(frames.at(-1).elapsedMs,2999)
})
test('held step never advances or automatically restarts',()=>{
  const {c,s,frames}=fixture()
  c.play();s.tick(1000)
  const n=frames.length
  c.play();c.pause();c.finish();s.tick(2000)
  assert.deepEqual(c.snapshot(),{elapsedMs:1000,phase:'held'})
  assert.equal(frames.length,n)
  assert.equal(s.pending.size,0)
})
test('zero-duration step is held immediately without a frame',()=>{
  const {c,s}=fixture(0)
  c.play()
  assert.deepEqual(c.snapshot(),{elapsedMs:0,phase:'held'})
  assert.equal(s.pending.size,0)
})
test('finish exposes complete text with no animation',()=>{
  const {c,s,frames}=fixture()
  c.finish();c.play()
  assert.deepEqual(c.snapshot(),{elapsedMs:1000,phase:'held'})
  assert.equal(frames.length,1)
  assert.equal(s.pending.size,0)
})
test('finish interrupts an already-running frame',()=>{
  const {c,s}=fixture()
  c.play();s.tick(100);c.finish()
  assert.equal(c.snapshot().phase,'held')
  assert.equal(s.pending.size,0)
})
test('RAF id zero is still cancelled',()=>{
  const {c,s}=fixture()
  c.play();c.pause()
  assert.deepEqual(s.cancelled,[0])
})
test('stale callback cannot charge elapsed time after pause/resume',()=>{
  const {c,s}=fixture()
  c.play()
  const stale=[...s.pending.values()][0]
  s.at(25);c.pause();s.at(10025);c.play()
  stale(900000)
  assert.equal(c.snapshot().elapsedMs,25)
  assert.equal(s.pending.size,1)
  s.tick(10050)
  assert.equal(c.snapshot().elapsedMs,50)
})
test('disposed clock ignores a callback already queued before cleanup',()=>{
  const {c,s,frames}=fixture()
  c.play()
  const stale=[...s.pending.values()][0], n=frames.length
  c.dispose();stale(500)
  assert.equal(frames.length,n)
  assert.equal(c.snapshot().phase,'disposed')
  assert.equal(s.pending.size,0)
})
test('dispose is idempotent and publishes no unmounted state',()=>{
  const {c,s,frames}=fixture()
  c.play();const n=frames.length
  c.dispose();c.dispose();c.pause();c.play();c.finish()
  assert.equal(frames.length,n)
  assert.equal(s.pending.size,0)
})
test('snapshots cannot mutate clock internals',()=>{
  const {c}=fixture();const result=c.snapshot()
  result.elapsedMs=9999;result.phase='playing'
  assert.deepEqual(c.snapshot(),{elapsedMs:0,phase:'paused'})
})
test('onFrame can synchronously pause without scheduling a second loop',()=>{
  const s=scheduler()
  let c
  c=createDemoPlaybackClock(1000,s,x=>{
    if(x.phase==='playing'&&x.elapsedMs>=50)c.pause()
  })
  c.play();s.tick(50)
  assert.equal(c.snapshot().phase,'paused')
  assert.equal(s.pending.size,0)
})
test('onFrame can dispose immediately on play',()=>{
  const s=scheduler()
  let c
  c=createDemoPlaybackClock(1000,s,()=>c.dispose())
  c.play()
  assert.equal(c.snapshot().phase,'disposed')
  assert.equal(s.pending.size,0)
})
test('old StrictMode-style owner cannot update a replacement owner',()=>{
  const s=scheduler(),a=[],b=[]
  const first=createDemoPlaybackClock(1000,s,x=>a.push(x))
  first.play();const stale=[...s.pending.values()][0];first.dispose()
  const second=createDemoPlaybackClock(1000,s,x=>b.push(x));second.play()
  stale(700);s.tick(50)
  assert.deepEqual(a.map(x=>x.elapsedMs),[0])
  assert.deepEqual(b.map(x=>x.elapsedMs),[0,50])
})
test('replaying uses a fresh clock and never revives old callbacks',()=>{
  const s=scheduler()
  const old=createDemoPlaybackClock(1000,s,()=>{})
  old.play();const stale=[...s.pending.values()][0];old.dispose()
  const fresh=createDemoPlaybackClock(1000,s,()=>{});fresh.play()
  stale(999);s.tick(100)
  assert.equal(fresh.snapshot().elapsedMs,100)
})
test('250 deterministic sequences preserve time bounds and one-loop ownership',()=>{
  let seed=71839,transitions=0
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed}
  for(let i=0;i<250;i++){
    const {c,s}=fixture(1000)
    let now=0,prev=0
    for(let j=0;j<100;j++){
      now+=random()%71;s.at(now)
      switch(random()%7){
        case 0:c.play();break
        case 1:c.pause();break
        case 2:s.tick(now);break
        case 3:c.play();c.play();break
        case 4:if(j>70)c.finish();break
        case 5:if(j>95)c.dispose();break
        default:s.tick(now);break
      }
      const value=c.snapshot()
      assert.ok(value.elapsedMs>=prev&&value.elapsedMs<=1000)
      assert.ok(s.pending.size<=1)
      if(value.phase!=='playing')assert.equal(s.pending.size,0)
      prev=value.elapsedMs;transitions++
    }
    c.dispose();assert.equal(s.pending.size,0)
  }
  assert.equal(transitions,25000)
})

class Target {
  constructor(){this.listeners=new Map()}
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn)}
  removeEventListener(name,fn){this.listeners.get(name)?.delete(fn)}
  dispatch(name){for(const fn of [...(this.listeners.get(name)||[])])fn()}
  count(){return [...this.listeners.values()].reduce((n,set)=>n+set.size,0)}
}
test('no browser gives safe non-capturing defaults',()=>{
  assert.deepEqual(readDemoEnvironment(null,null),{hidden:false,reducedMotion:false})
})
test('subscription reports preferences immediately',()=>{
  const doc=new Target(),media=new Target(),states=[]
  doc.visibilityState='hidden';media.matches=true
  const off=watchDemoEnvironment(doc,media,x=>states.push(x))
  assert.deepEqual(states,[{hidden:true,reducedMotion:true}]);off()
})
test('visibility and motion updates read the current values',()=>{
  const doc=new Target(),media=new Target(),states=[]
  doc.visibilityState='visible';media.matches=false
  const off=watchDemoEnvironment(doc,media,x=>states.push(x))
  doc.visibilityState='hidden';doc.dispatch('visibilitychange')
  media.matches=true;media.dispatch('change')
  assert.deepEqual(states.at(-1),{hidden:true,reducedMotion:true})
  off()
})
test('cleanup removes both subscriptions exactly once',()=>{
  const doc=new Target(),media=new Target()
  const off=watchDemoEnvironment(doc,media,()=>{})
  assert.equal(doc.count()+media.count(),2)
  off();off();assert.equal(doc.count()+media.count(),0)
})
test('queued preference event cannot notify after cleanup',()=>{
  const media=new Target(),states=[]
  const off=watchDemoEnvironment(null,media,x=>states.push(x))
  const queued=[...media.listeners.get('change')][0];off();queued()
  assert.equal(states.length,1)
})
test('visibility pauses synchronously and preserves a manual pause',()=>{
  const doc=new Target(),media=new Target(),{c,s}=fixture()
  doc.visibilityState='visible';media.matches=false;let manual=false
  const off=watchDemoEnvironment(doc,media,env=>{
    if(env.reducedMotion)c.finish()
    else if(env.hidden||manual)c.pause()
    else c.play()
  })
  s.tick(100);s.at(150);doc.visibilityState='hidden';doc.dispatch('visibilitychange')
  assert.equal(c.snapshot().elapsedMs,150)
  manual=true;s.at(600150);doc.visibilityState='visible';doc.dispatch('visibilitychange')
  assert.equal(c.snapshot().phase,'paused')
  assert.equal(c.snapshot().elapsedMs,150)
  off();c.dispose()
})
test('reduced motion settles content without re-autoplay when switched off',()=>{
  const media=new Target(),{c,s}=fixture()
  media.matches=false
  const off=watchDemoEnvironment(null,media,env=>env.reducedMotion?c.finish():c.play())
  s.tick(10);media.matches=true;media.dispatch('change')
  assert.equal(c.snapshot().phase,'held')
  media.matches=false;media.dispatch('change')
  assert.equal(s.pending.size,0)
  off()
})
test('StrictMode-style resubscription has exactly one active listener pair',()=>{
  const doc=new Target(),media=new Target()
  const off=watchDemoEnvironment(doc,media,()=>{});off()
  const off2=watchDemoEnvironment(doc,media,()=>{})
  assert.equal(doc.count()+media.count(),2);off2()
})
for(const [name,effect]of [
 ['absent',undefined],
 ['synchronous throw',()=>{throw Error('private local path')}],
 ['asynchronous rejection',()=>Promise.reject(Error('private local path'))],
 ['hostile then getter',()=>Object.defineProperty({},'then',{get(){throw Error('denied')}})]
]){
  test(`optional ${name} cannot throw into navigation`,async()=>{
    let advanced=false
    runOptionalDemoMedia(effect);advanced=true
    await new Promise(resolve=>setImmediate(resolve))
    assert.equal(advanced,true)
  })
}
test('media effect runs once in the original click before navigation',()=>{
  const order=[]
  runOptionalDemoMedia(()=>{order.push('media');return Promise.resolve()})
  order.push('navigate')
  assert.deepEqual(order,['media','navigate'])
})
test('optional media does not wait for an unresolved promise',()=>{
  const order=[]
  runOptionalDemoMedia(()=>new Promise(()=>{}));order.push('navigate')
  assert.deepEqual(order,['navigate'])
})
test('reduced-motion status takes precedence over animation copy',()=>{
  assert.match(demoPlaybackStatus('playing',{hidden:false,reducedMotion:true},false),/Animation off/)
})
test('manual pause is preserved in the status',()=>{
  assert.match(demoPlaybackStatus('playing',{hidden:false,reducedMotion:false},true),/Paused/)
})
test('completed and hidden status are distinct',()=>{
  assert.match(demoPlaybackStatus('held',{hidden:true,reducedMotion:false},false),/Step complete/)
  assert.match(demoPlaybackStatus('playing',{hidden:true,reducedMotion:false},false),/hidden/)
})
test('playing status does not invent readiness or completion',()=>{
  assert.equal(demoPlaybackStatus('playing',{hidden:false,reducedMotion:false},false),
    'Playing. Pause at any time.')
})
