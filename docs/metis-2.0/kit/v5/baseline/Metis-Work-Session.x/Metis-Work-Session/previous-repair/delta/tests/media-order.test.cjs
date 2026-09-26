'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./source-loader.cjs')
const { playOnboardingMedia, playOnboardingVideo } = load('src/renderer/src/lib/onboarding-hero-video.ts')
function tracked(events, name, failure) {
  return {
    play() {
      events.push(`${name}:play`)
      if (failure === `${name}:play`) throw Error('synthetic play failure')
      return Promise.resolve()
    },
    set currentTime(value) {
      events.push(`${name}:seek:${value}`)
      if (failure === `${name}:seek`) throw Error('synthetic seek failure')
    }
  }
}
for (const failure of [null, 'audio:play', 'video:play', 'audio:seek', 'video:seek']) {
  test(`both play attempts precede any seek; failure=${failure}`, () => {
    const events=[]
    assert.doesNotThrow(()=>playOnboardingMedia(tracked(events,'video',failure),tracked(events,'audio',failure),{restart:true}))
    assert.deepEqual(events,['audio:play','video:play','audio:seek:0','video:seek:0'])
  })
}
test('single media starts before its seek', () => {
  const events=[];playOnboardingVideo(tracked(events,'video'),{restart:true})
  assert.deepEqual(events,['video:play','video:seek:0'])
})
test('no restart means neither element is sought', () => {
  const events=[];playOnboardingMedia(tracked(events,'video'),tracked(events,'audio'))
  assert.deepEqual(events,['audio:play','video:play'])
})
test('both rejected promises are handled despite both setters throwing', async () => {
  const events=[]
  const media=name=>({play(){events.push(name+':play');return Promise.reject(Error('synthetic denied'))}, set currentTime(v){events.push(name+':seek');throw Error('synthetic seek failure')}})
  assert.doesNotThrow(()=>playOnboardingMedia(media('video'),media('audio'),{restart:true}))
  await new Promise(resolve=>setImmediate(resolve))
  assert.deepEqual(events,['audio:play','video:play','audio:seek','video:seek'])
})
test('null and undefined elements are safe',()=>{
  assert.doesNotThrow(()=>playOnboardingMedia(null,undefined,{restart:true}))
  assert.doesNotThrow(()=>playOnboardingVideo(undefined,{restart:true}))
})
