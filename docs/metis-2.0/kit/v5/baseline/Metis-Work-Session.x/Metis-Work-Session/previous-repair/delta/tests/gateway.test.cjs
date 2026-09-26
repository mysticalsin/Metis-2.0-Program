'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./source-loader.cjs')
const gateway = load('operator/src/ai-gateway.ts')
const TOKEN = 'FAKE_cloudflare_token_for_scoped_tests_000000'
const ACCOUNT = 'test-account-0001'
const expectedUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai-gateway/gateways/default`
const safe = () => ({ success: true, result: { id: 'default', collect_logs: false, cache_ttl: 0, logpush: false, otel: [], log_classification: false } })
const reply = (value = safe(), status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })
const hasCode = code => error => { assert.equal(error.code, code); assert.equal(error.message.includes(TOKEN), false); return true }
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
test('read-only existing-gateway check is scoped, bounded, and contains no source content', async () => {
  let calls = 0
  await gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async (url, init) => {
    calls++
    assert.equal(url, expectedUrl)
    assert.equal(init.method, 'GET')
    assert.equal(init.body, undefined)
    assert.equal(init.redirect, 'error')
    assert.equal(init.credentials, 'omit')
    assert.equal(init.cache, 'no-store')
    assert.equal(init.headers.authorization, `Bearer ${TOKEN}`)
    assert.ok(init.signal instanceof AbortSignal)
    return reply()
  })
  assert.equal(calls, 1)
})
test('optional unconfigured export/classification fields can be absent', async () => {
  const data = safe(); delete data.result.otel; delete data.result.log_classification
  await gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => reply(data))
})
for (const [field, value] of [
  ['collect_logs', true], ['collect_logs', 'false'], ['collect_logs', undefined],
  ['cache_ttl', 60], ['cache_ttl', '0'], ['cache_ttl', undefined],
  ['logpush', true], ['logpush', undefined],
  ['otel', [{ url: 'https://unapproved.example/collector' }]], ['otel', {}],
  ['log_classification', true]
]) {
  test(`blocks unsafe/unknown ${field}=${JSON.stringify(value)}`, async () => {
    const data = safe(); data.result[field] = value
    await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => reply(data)), hasCode('GATEWAY_CONFIGURATION_UNSAFE'))
  })
}
for (const data of [ {}, { success: false, result: safe().result }, { success: true, result: [] },
  { success: true, result: { ...safe().result, id: 'other-gateway' } } ]) {
  test(`requires matching successful configuration envelope: ${JSON.stringify(data)}`, async () => {
    await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => reply(data)), hasCode('GATEWAY_RESPONSE_UNVERIFIED'))
  })
}
for (const [status, code] of [[404, 'GATEWAY_REVIEW_REQUIRED'], [401, 'GATEWAY_CHECK_DENIED'], [403, 'GATEWAY_CHECK_DENIED'], [429, 'GATEWAY_CHECK_UNAVAILABLE'], [500, 'GATEWAY_CHECK_UNAVAILABLE']]) {
  test(`HTTP ${status} is never success, provisioned, or retried`, async () => {
    let calls = 0, cancelled = false
    const body = new ReadableStream({ cancel() { cancelled = true } })
    await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async (_url, init) => {
      calls++; assert.equal(init.method, 'GET')
      return new Response(body, { status })
    }), hasCode(code))
    assert.equal(calls, 1)
    assert.equal(cancelled, true)
  })
}
test('network exception text and credentials never escape the boundary', async () => {
  await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => { throw Error(`private: ${TOKEN}`) }), hasCode('GATEWAY_CHECK_UNAVAILABLE'))
})
for (const field of ['redirected', 'url']) {
  test(`rejects an unexpected ${field} before consuming JSON`, async () => {
    const res = reply()
    Object.defineProperty(res, field, { value: field === 'url' ? 'https://unapproved.example/' : true })
    await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => res), hasCode('GATEWAY_RESPONSE_UNVERIFIED'))
  })
}
test('does not trust HTML, malformed JSON, or invalid UTF-8', async () => {
  for (const res of [new Response('private HTML'), new Response('{BROKEN', { headers: { 'content-type': 'application/json' } }), new Response(Uint8Array.from([0xc3, 0x28]), { headers: { 'content-type': 'application/json' } })]) {
    await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => res), hasCode('GATEWAY_RESPONSE_UNVERIFIED'))
  }
})
test('rejects declared oversized bodies without waiting for content', async () => {
  let cancelled = false
  const res = new Response(new ReadableStream({ cancel() { cancelled = true } }), { headers: { 'content-type': 'application/json', 'content-length': '65537' } })
  await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => res), hasCode('GATEWAY_RESPONSE_UNVERIFIED'))
  assert.equal(cancelled, true)
})
test('bounds actual streamed bytes, not just Content-Length', async () => {
  const res = new Response(' '.repeat(65537), { headers: { 'content-type': 'application/json', 'content-length': '1' } })
  await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => res), hasCode('GATEWAY_RESPONSE_UNVERIFIED'))
})
test('whole-operation deadline also bounds an uncooperative fetch', async () => {
  let signal
  await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, (_url, init) => { signal = init.signal; return new Promise(() => {}) }, { timeoutMs: 20 }), hasCode('GATEWAY_CHECK_TIMEOUT'))
  assert.equal(signal.aborted, true)
})
test('whole-operation deadline also bounds a stalled JSON body', async () => {
  let cancelled = false
  const res = new Response(new ReadableStream({ cancel() { cancelled = true } }), { headers: { 'content-type': 'application/json' } })
  await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => res, { timeoutMs: 20 }), hasCode('GATEWAY_CHECK_TIMEOUT'))
  assert.equal(cancelled, true)
})
test('late response bodies are cancelled when a transport ignores abort', async () => {
  let cancelled = false
  await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => {
    await delay(35)
    return new Response(new ReadableStream({ cancel() { cancelled = true } }), { headers: { 'content-type': 'application/json' } })
  }, { timeoutMs: 20 }), hasCode('GATEWAY_CHECK_TIMEOUT'))
  await delay(30)
  assert.equal(cancelled, true)
})
test('pre-aborted callers do not send a request', async () => {
  let calls = 0
  await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => { calls++; return reply() }, { signal: AbortSignal.abort() }), hasCode('GATEWAY_CHECK_CANCELLED'))
  assert.equal(calls, 0)
})
test('caller cancellation is not mislabeled as a timeout', async () => {
  const controller = new AbortController()
  const pending = gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => { controller.abort(); return new Promise(() => {}) }, { signal: controller.signal })
  await assert.rejects(pending, hasCode('GATEWAY_CHECK_CANCELLED'))
})
test('configuration drift is rechecked; there is no stale-success cache', async () => {
  let calls = 0
  const fetcher = async () => { calls++; const data = safe(); data.result.collect_logs = calls === 2; return reply(data) }
  await gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, fetcher)
  await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, fetcher), hasCode('GATEWAY_CONFIGURATION_UNSAFE'))
  assert.equal(calls, 2)
})
for (const [token, account] of [['', ACCOUNT], [TOKEN, ''], [TOKEN, '../other'], [`${TOKEN}\nInjected: yes`, ACCOUNT]]) {
  test(`invalid credential/address shape is rejected before network (account=${JSON.stringify(account)})`, async () => {
    let calls = 0
    await assert.rejects(gateway.ensureDefaultAiGateway(token, account, async () => { calls++; return reply() }), hasCode('GATEWAY_CREDENTIALS_REQUIRED'))
    assert.equal(calls, 0)
  })
}
for (const timeoutMs of [0, -1, 0.5, NaN, Infinity, 8001]) {
  test(`invalid deadline ${timeoutMs} cannot relax the bound`, async () => {
    await assert.rejects(gateway.ensureDefaultAiGateway(TOKEN, ACCOUNT, async () => reply(), { timeoutMs }), hasCode('GATEWAY_CHECK_OPTIONS_INVALID'))
  })
}
