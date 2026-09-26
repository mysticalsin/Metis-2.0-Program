'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./source-loader.cjs')
const media = load('src/renderer/src/lib/onboarding-hero-video.ts')
function element({ playThrows = false, reject = false, seekThrows = false, legacy = false } = {}) {
  const calls = []
  const el = { play() {
    calls.push('play')
    if (playThrows) throw Error('NotSupportedError')
    if (legacy) return undefined
    return reject ? Promise.reject(Error('NotAllowedError')) : Promise.resolve()
  } }
  Object.defineProperty(el, 'currentTime', { set(value) {
    calls.push(`seek:${value}`)
    if (seekThrows) throw Error('InvalidStateError')
  } })
  return { el, calls }
}
const tick = () => new Promise(resolve => setImmediate(resolve))
test('null media does not block navigation', () => {
  assert.doesNotThrow(() => media.playOnboardingVideo(null, { restart: true }))
  assert.doesNotThrow(() => media.playOnboardingMedia(null, undefined))
})
test('preserves the user-gesture play-before-seek ordering', () => {
  const { el, calls } = element()
  media.playOnboardingVideo(el, { restart: true })
  assert.deepEqual(calls, ['play', 'seek:0'])
})
test('does not seek without restart', () => {
  const { el, calls } = element()
  media.playOnboardingVideo(el)
  assert.deepEqual(calls, ['play'])
})
test('synchronous play failure cannot interrupt the caller', () => {
  const { el } = element({ playThrows: true })
  let advanced = false
  assert.doesNotThrow(() => { media.playOnboardingVideo(el); advanced = true })
  assert.equal(advanced, true)
})
test('synchronous seek failure cannot interrupt the caller', () => {
  const { el } = element({ seekThrows: true })
  assert.doesNotThrow(() => media.playOnboardingVideo(el, { restart: true }))
})
test('rejected play promise is handled even when seeking also throws', async () => {
  const { el } = element({ reject: true, seekThrows: true })
  assert.doesNotThrow(() => media.playOnboardingVideo(el, { restart: true }))
  await tick()
})
test('ordinary asynchronous play rejection is consumed', async () => {
  media.playOnboardingVideo(element({ reject: true }).el)
  await tick()
})
test('video still starts when optional audio throws', () => {
  const video = element(), audio = element({ playThrows: true })
  assert.doesNotThrow(() => media.playOnboardingMedia(video.el, audio.el))
  assert.deepEqual(video.calls, ['play'])
  assert.deepEqual(audio.calls, ['play'])
})
test('audio failure and video seek failure are isolated independently', async () => {
  const video = element({ seekThrows: true }), audio = element({ reject: true, seekThrows: true })
  assert.doesNotThrow(() => media.playOnboardingMedia(video.el, audio.el, { restart: true }))
  assert.deepEqual(video.calls, ['play', 'seek:0'])
  assert.deepEqual(audio.calls, ['play', 'seek:0'])
  await tick()
})
test('legacy non-Promise media implementations are harmless', () => {
  assert.doesNotThrow(() => media.playOnboardingVideo(element({ legacy: true }).el))
})
test('packaged ASAR path resolution is unchanged', () => {
  assert.equal(media.resolveOnboardingHeroVideoSrc('./assets/hero.mp4', 'file:///App/app.asar/out/renderer/index.html'),
    'file:///App/app.asar.unpacked/out/renderer/assets/hero.mp4')
  assert.equal(media.resolveOnboardingHeroVideoSrc('./hero.mp4', 'http://localhost:5173/index.html'),
    'http://localhost:5173/hero.mp4')
})
