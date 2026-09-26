'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./source-loader.cjs')
const wake = load('src/shared/metis-wake.ts')
const samples = [
  ['Métis open Notes', 'open Notes'],
  ['MÉTIS create a note titled "Résumé Q3 — Montréal"', 'create a note titled "Résumé Q3 — Montréal"'],
  ['Me\u0301tis create "Équipe"', 'create "Équipe"'],
  ['Métis\u0301 open Notes', 'open Notes'],
  ['Ｍｅｔｉｓ search for Résumé', 'search for Résumé'],
  ['ⓜⓔⓣⓘⓢ search for Plan № 2', 'search for Plan № 2'],
  ['Métis search https://EXAMPLE.com/a/b?q=Été&X=1#part', 'search https://EXAMPLE.com/a/b?q=Été&X=1#part'],
  ['Métis note "C:\\Work\\Q3"', 'note "C:\\Work\\Q3"'],
  ['Métis note "l’équipe d’André"', 'note "l’équipe d’André"'],
  ['Métis note "预算 — 東京 🚀"', 'note "预算 — 東京 🚀"'],
  ['Métis note "Line 1\nLine 2\twith  spaces"', 'note "Line 1\nLine 2\twith  spaces"'],
  ['Hey Métis create "R&D + 10%"', 'Hey create "R&D + 10%"'],
  ['Metis create a note titled "Métis Roadmap"', 'create a note titled "Métis Roadmap"'],
  ['  Search ÉTÉ / EXACT  ', 'Search ÉTÉ / EXACT'],
  ['metis', ''],
  ['Métis, open Arc', ', open Arc'],
  ['🚀 Métis search "Énergie"', '🚀 search "Énergie"']
]
for (const [input, expected] of samples) {
  test(`preserves source payload: ${JSON.stringify(input)}`, () => assert.equal(wake.stripWakeWord(input), expected))
}
for (const word of ['metis', 'Métis', 'MÉTIS', 'Me\u0301tis', 'Ｍｅｔｉｓ', 'ⓜⓔⓣⓘⓢ']) {
  test(`matching and source removal agree: ${word}`, () => {
    assert.equal(wake.transcriptContainsWakeWord(`${word} Keep RAW/Value`), true)
    assert.equal(wake.stripWakeWord(`${word} Keep RAW/Value`), 'Keep RAW/Value')
  })
}
for (const text of ['metisology', 'premetis', 'meta systems', '', 'METIS123']) {
  test(`does not invent a wake token: ${text}`, () => {
    assert.equal(wake.transcriptContainsWakeWord(text), false)
    assert.equal(wake.stripWakeWord(text), text)
  })
}
test('deterministic Unicode payload corpus is preserved (2,000 payloads)', () => {
  const alphabet = ['É', 'e\u0301', '🚀', '東京', '/', ':', '+', '™', 'Æ', '“', '”', '’', '\\', '&', '#', 'Q', '1', '=', '@']
  let x = 910247
  const random = () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x }
  for (let i = 0; i < 2000; i++) {
    let payload = 'Write "'
    for (let j = 0; j < 32; j++) payload += alphabet[random() % alphabet.length]
    payload += '"'
    assert.equal(wake.stripWakeWord(`Me\u0301tis ${payload}`), payload)
  }
})
test('display copy and end-phrase behavior remain unchanged', () => {
  assert.equal(wake.METIS_PILL_HI, 'Hi Métis')
  assert.equal(wake.METIS_PILL_LISTENING, "Hi Métis, I'm listening...")
  assert.equal(wake.transcriptContainsEndPhrase('Thank you'), true)
  assert.equal(wake.transcriptContainsEndPhrase('open Notes'), false)
})
