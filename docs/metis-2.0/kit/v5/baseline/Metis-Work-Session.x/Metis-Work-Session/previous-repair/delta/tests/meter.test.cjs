'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./source-loader.cjs')
const meter = load('operator/src/ask-meter.ts')
async function rowFor(inputTokens, outputTokens) {
  const rows = []
  await meter.persistProxyAsk({ insertAsk: async row => rows.push(row) }, {
    deviceId: 'fixture-seat', now: 1234, provider: 'cloudflare', model: 'fixture-model',
    askId: 'logical-ask-0001', inputTokens, outputTokens, outcome: 'answered'
  })
  assert.equal(rows.length, 1)
  return rows[0]
}
for (const value of [NaN, Infinity, -Infinity, -1, -12, 0.1, Number.MAX_SAFE_INTEGER + 1, '30', null, undefined, {}, [], true]) {
  test(`invalid token count remains unknown: ${String(value)}`, async () => {
    const row = await rowFor(value, value)
    assert.equal(row.input_tokens, null)
    assert.equal(row.output_tokens, null)
    assert.equal(row.id, 'logical-ask-0001')
    assert.equal(row.device_id, 'fixture-seat')
  })
}
for (const value of [0, -0, 1, 120, 30000, Number.MAX_SAFE_INTEGER]) {
  test(`valid integer usage survives without rounding: ${value}`, async () => {
    const row = await rowFor(value, value)
    assert.equal(row.input_tokens, value === 0 ? 0 : value)
    assert.equal(row.output_tokens, value === 0 ? 0 : value)
  })
}
test('one unknown field does not discard the other authoritative field', async () => {
  const row = await rowFor(undefined, 30)
  assert.equal(row.input_tokens, null)
  assert.equal(row.output_tokens, 30)
})
test('a meter persistence failure is propagated by persistProxyAsk', async () => {
  await assert.rejects(meter.persistProxyAsk({ insertAsk: async () => { throw Error('fixture-database-failed') } }, {
    deviceId: 'fixture-seat', now: 1234, provider: 'cloudflare', model: 'fixture-model', askId: 'logical-ask-0001', outcome: 'answered'
  }), /fixture-database-failed/)
})
