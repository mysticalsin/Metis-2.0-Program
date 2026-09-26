import test from 'node:test'
import assert from 'node:assert/strict'
import { runFileExample } from '../examples/verified-file-task.mjs'
test('actual temporary file is written once and independently read back',async()=>{const r=await runFileExample();assert.equal(r.effectCalls,1);assert.equal(r.byteMatch,true);assert.equal(r.receipt.outcome,'verified');assert.equal(r.display.canSayDone,true)})
