'use strict'
// Actual patched functions, with explicit isolated transport/auth/crypto/store fixtures.
// These tests establish wiring/order/failure behavior, NOT live service or crypto qualification.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./source-loader.cjs')
const gate = load('operator/src/ai-gateway.ts')
const meter = load('operator/src/ask-meter.ts')
const TOKEN = 'FAKE_TEST_ONLY_CLOUDFLARE_TOKEN_000000'
const ACCOUNT = 'test-account-0001'
const ENV = { OPERATOR_VAULT_KEY: 'FAKE_TEST_ONLY_ENCRYPTION_KEY' }
const safe = () => ({ success: true, result: { id: 'default', collect_logs: false, cache_ttl: 0, logpush: false } })
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })
function deps(trace, opts = {}) {
  return {
    './ai-gateway': gate,
    './ask-meter': meter,
    './crypto': {
      encryptVault: async () => { trace.push('encrypt'); return { cipher: 'FAKE_NEW_CIPHERTEXT_000001', iv: 'FAKE_NEW_IV_000001' } },
      decryptVault: async () => {
        trace.push('decrypt')
        if (opts.decryptFails) throw Error('fixture decryption failed')
        return JSON.stringify({ secret: TOKEN, accountId: ACCOUNT })
      }
    },
    './redact': { looksLikeSecret: () => false, providerRefusedPayload: status => ({ error: 'fixture upstream refusal', upstreamStatus: status }) },
    './fleet': { seatAuthorizedForKeys: async () => opts.authorized !== false, SEAT_NOT_APPROVED: 'fixture seat not approved' },
    './tiers': { seatHasEntitlement: async () => opts.entitled !== false },
    './vault': {
      CF_ACCOUNT_PROVIDER: 'cloudflare-account', decodeVaultPlaintext: JSON.parse,
      encodeVaultPlaintext: (secret, accountId) => JSON.stringify({ secret, accountId }),
      fundedProvidersFromMeta: () => [], isForbiddenVaultProvider: () => false,
      isVaultProvider: p => ['cloudflare', 'cloudflare-account', 'openai'].includes(p),
      isVaultLlmProvider: p => ['cloudflare', 'openai'].includes(p), last4OfSecret: s => s.slice(-4)
    },
    '../../src/shared/providers': {
      PROVIDERS: { cloudflare: { kind: 'openai', baseUrl: 'https://api.cloudflare.com' }, openai: { kind: 'openai', baseUrl: 'https://api.openai.com/v1' } },
      requiresUserBaseUrl: () => false
    },
    '../../src/shared/operator-vision': {
      operatorVisionModel: (_provider, model) => model,
      parseOperatorImage: value => ({ ok: true, image: value })
    }
  }
}
function fixture(opts = {}) {
  const trace = [], rows = [], events = [], writes = [], requests = []
  const existing = { id: 'existing-credential-0001', provider: opts.provider || 'cloudflare', status: 'active', cipher: 'FAKE_OLD_CIPHERTEXT_000001', iv: 'FAKE_OLD_IV_000001' }
  const store = {
    getSeat: async () => ({ device_id: 'fixture-seat' }),
    listVaultRows: async () => [existing],
    getVaultKey: async () => ({ ...existing }),
    putVaultKey: async row => { trace.push('put'); writes.push(row) },
    supersedeActiveVaultKeys: async () => trace.push('supersede'),
    audit: async (...args) => { trace.push('audit'); events.push(args) },
    insertEvent: async event => { trace.push('event'); events.push(event) },
    insertAsk: async row => { trace.push('meter'); rows.push(row) }
  }
  const dependencyFixtures = deps(trace, opts)
  const keys = load('operator/src/keys.ts', dependencyFixtures)
  const use = load('operator/src/use.ts', dependencyFixtures)
  const fetcher = async (url, init) => {
    requests.push({ url: String(url), init })
    if (String(url).endsWith('/ai-gateway/gateways/default')) {
      trace.push('privacy-get')
      assert.equal(init.method, 'GET')
      assert.equal(init.body, undefined)
      if (opts.httpFailure) return json({ success: false }, opts.httpFailure)
      const data = safe(); if (opts.unsafe) data.result.collect_logs = true
      return json(data)
    }
    assert.ok(String(url).endsWith('/chat/completions'))
    trace.push('inference-post')
    return json({ choices: [{ message: { content: 'Fixture answer' } }], usage: opts.usage || { prompt_tokens: 120, completion_tokens: 30 } })
  }
  return { trace, rows, events, writes, requests, existing, store, keys, use, fetcher }
}
const keyBody = () => ({ provider: 'cloudflare', accountId: ACCOUNT, secret: TOKEN })
const useBody = extra => JSON.stringify({ provider: 'cloudflare', model: 'fixture-model', clientAskId: 'logical-ask-0001', messages: [{ role: 'user', content: 'SENTINEL_PRIVATE_QUESTION_0001' }], ...extra })
for (const options of [{ unsafe: true }, { httpFailure: 403 }, { httpFailure: 404 }, { httpFailure: 500 }]) {
  for (const operation of ['write', 'rotate']) {
    test(`vault ${operation} leaves previous credentials untouched when privacy fails ${JSON.stringify(options)}`, async () => {
      const f = fixture(options)
      const out = operation === 'write'
        ? await f.keys.writeVaultKey(f.store, ENV, 'fixture@example.test', 1000, keyBody(), f.fetcher)
        : await f.keys.rotateVaultKey(f.store, ENV, 'fixture@example.test', 1000, f.existing.id, { secret: TOKEN }, f.fetcher)
      assert.equal(out.ok, false); assert.equal(out.status, 503)
      assert.equal(f.writes.length, 0); assert.equal(f.events.length, 0)
      for (const forbidden of ['encrypt', 'put', 'supersede', 'audit', 'event']) assert.equal(f.trace.includes(forbidden), false)
      assert.equal(f.requests.length, 1)
      assert.equal(JSON.stringify(out).includes(TOKEN), false)
    })
  }
}
for (const operation of ['write', 'rotate']) {
  test(`vault ${operation} proves configuration before mutation`, async () => {
    const f = fixture()
    const out = operation === 'write'
      ? await f.keys.writeVaultKey(f.store, ENV, 'fixture@example.test', 1000, keyBody(), f.fetcher)
      : await f.keys.rotateVaultKey(f.store, ENV, 'fixture@example.test', 1000, f.existing.id, { secret: TOKEN }, f.fetcher)
    assert.equal(out.ok, true)
    assert.ok(f.trace.indexOf('privacy-get') < f.trace.indexOf('encrypt'))
    assert.ok(f.trace.indexOf('encrypt') < f.trace.indexOf('put'))
    assert.equal(f.writes.length, 1)
    assert.equal(f.requests.length, 1)
    assert.equal(JSON.stringify(out).includes(TOKEN), false)
  })
}
test('unrecoverable account during rotation returns 400 before mutation', async () => {
  const f = fixture({ decryptFails: true })
  const out = await f.keys.rotateVaultKey(f.store, ENV, 'fixture@example.test', 1000, f.existing.id, { secret: TOKEN }, f.fetcher)
  assert.equal(out.ok, false); assert.equal(out.status, 400)
  assert.equal(f.writes.length, 0); assert.equal(f.events.length, 0); assert.equal(f.requests.length, 0)
})
test('explicit account recovers a rotation only after a successful preflight', async () => {
  const f = fixture({ decryptFails: true })
  const out = await f.keys.rotateVaultKey(f.store, ENV, 'fixture@example.test', 1000, f.existing.id, keyBody(), f.fetcher)
  assert.equal(out.ok, true); assert.equal(f.writes.length, 1)
  assert.ok(f.trace.indexOf('privacy-get') < f.trace.indexOf('put'))
})
test('unrelated provider vault writes do not depend on Cloudflare availability', async () => {
  const f = fixture({ provider: 'openai' })
  const out = await f.keys.writeVaultKey(f.store, ENV, 'fixture@example.test', 1000, { provider: 'openai', secret: TOKEN }, f.fetcher)
  assert.equal(out.ok, true); assert.equal(f.requests.length, 0)
})
for (const opts of [{ unsafe: true }, { httpFailure: 403 }, { httpFailure: 404 }]) {
  test(`unverified gateway sends no prompt to inference ${JSON.stringify(opts)}`, async () => {
    const f = fixture(opts)
    const response = await f.use.handleUse(f.store, ENV, 'fixture-seat', useBody(), 1000, f.fetcher)
    const data = await response.json()
    assert.equal(response.status, 503); assert.equal(data.ok, false)
    assert.match(data.code, /^GATEWAY_/)
    assert.equal(f.requests.length, 1); assert.equal(f.rows.length, 0); assert.equal(f.events.length, 0)
    assert.equal(JSON.stringify(f.requests).includes('SENTINEL_PRIVATE_QUESTION_0001'), false)
    assert.equal(JSON.stringify(data).includes(TOKEN), false)
  })
}
test('successful use sends private headers and reuses the seat logical Ask ID', async () => {
  const f = fixture()
  const response = await f.use.handleUse(f.store, ENV, 'fixture-seat', useBody(), 1000, f.fetcher)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true, text: 'Fixture answer', inputTokens: 120, outputTokens: 30 })
  assert.equal(f.requests.length, 2)
  const request = f.requests[1]
  assert.equal(request.init.headers['cf-aig-collect-log-payload'], 'false')
  assert.equal(request.init.headers['cf-aig-skip-cache'], 'true')
  assert.equal(f.rows.length, 1); assert.equal(f.rows[0].id, 'logical-ask-0001')
  assert.equal(f.rows[0].input_tokens, 120); assert.equal(f.rows[0].output_tokens, 30)
  assert.equal(JSON.stringify(f.rows).includes('SENTINEL_PRIVATE_QUESTION_0001'), false)
  assert.equal(JSON.stringify(f.events).includes('SENTINEL_PRIVATE_QUESTION_0001'), false)
})
for (const usage of [{ prompt_tokens: -1, completion_tokens: 0.3 }, { prompt_tokens: '120', completion_tokens: 9007199254740992 }]) {
  test(`invalid upstream counts stay unknown in both response and persistence ${JSON.stringify(usage)}`, async () => {
    const f = fixture({ usage })
    const response = await f.use.handleUse(f.store, ENV, 'fixture-seat', useBody(), 1000, f.fetcher)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ok: true, text: 'Fixture answer' })
    assert.equal(f.rows[0].input_tokens, null); assert.equal(f.rows[0].output_tokens, null)
  })
}
test('genuine zero usage survives response and persistence', async () => {
  const f = fixture({ usage: { prompt_tokens: 0, completion_tokens: 0 } })
  const response = await f.use.handleUse(f.store, ENV, 'fixture-seat', useBody(), 1000, f.fetcher)
  const data = await response.json()
  assert.equal(data.inputTokens, 0); assert.equal(data.outputTokens, 0)
  assert.equal(f.rows[0].input_tokens, 0); assert.equal(f.rows[0].output_tokens, 0)
})
for (const opts of [{ authorized: false }, { entitled: false }]) {
  test(`existing auth denial precedes all provider traffic ${JSON.stringify(opts)}`, async () => {
    const f = fixture(opts)
    const response = await f.use.handleUse(f.store, ENV, 'fixture-seat', useBody(), 1000, f.fetcher)
    assert.equal(response.status, 403); assert.equal(f.requests.length, 0); assert.equal(f.rows.length, 0)
  })
}
test('provider timeout wrapper preserves a caller abort signal', async () => {
  const f = fixture(), caller = new AbortController()
  let signal
  const wrapped = f.use.withProviderTimeout(async (_url, init) => { signal = init.signal; return json({}) })
  await wrapped('https://api.cloudflare.com/', { signal: caller.signal })
  assert.equal(signal.aborted, false)
  caller.abort()
  assert.equal(signal.aborted, true)
})
test('privacy deadline is not overwritten by the longer provider timeout', async () => {
  const f = fixture()
  let transportSignal
  const wrapped = f.use.withProviderTimeout((_url, init) => { transportSignal = init.signal; return new Promise(() => {}) })
  await assert.rejects(gate.ensureDefaultAiGateway(TOKEN, ACCOUNT, wrapped, { timeoutMs: 20 }), error => error.code === 'GATEWAY_CHECK_TIMEOUT')
  assert.equal(transportSignal.aborted, true)
})
test('provider timeout preserves an AbortSignal carried by Request input', async () => {
  const f = fixture(), caller = new AbortController()
  let signal
  const wrapped = f.use.withProviderTimeout(async (_url, init) => { signal = init.signal; return json({}) })
  await wrapped(new Request('https://api.cloudflare.com/', { signal: caller.signal }))
  caller.abort()
  assert.equal(signal.aborted, true)
})
test('an explicit init signal takes precedence over a Request signal', async () => {
  const f = fixture(), requestController = new AbortController(), explicit = new AbortController()
  let signal
  const wrapped = f.use.withProviderTimeout(async (_url, init) => { signal = init.signal; return json({}) })
  await wrapped(new Request('https://api.cloudflare.com/', { signal: requestController.signal }), { signal: explicit.signal })
  requestController.abort()
  assert.equal(signal.aborted, false)
  explicit.abort()
  assert.equal(signal.aborted, true)
})
test('explicit null signal preserves fetch Request override semantics', async () => {
  const f = fixture(), requestController = new AbortController()
  let signal
  const wrapped = f.use.withProviderTimeout(async (_url, init) => { signal = init.signal; return json({}) })
  await wrapped(new Request('https://api.cloudflare.com/', { signal: requestController.signal }), { signal: null })
  requestController.abort()
  assert.equal(signal.aborted, false)
})
