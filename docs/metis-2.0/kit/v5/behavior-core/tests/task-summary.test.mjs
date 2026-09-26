import test from 'node:test'
import assert from 'node:assert/strict'
import { executeVerifiedOperation,summarizeTask } from '../dist/coordinator.js'
import { fixture } from './fixtures.mjs'
async function ready(){const f=await fixture();const r=await executeVerifiedOperation(f.options());return {f,r}}
test('empty plan is not vacuous completion',async()=>{const {f}=await ready();assert.equal(summarizeTask([],[],f.context()).state,'needs_review')})
test('one verified operation completes a one-step plan',async()=>{const {f,r}=await ready();assert.equal(summarizeTask([r],['op-a'],f.context()).state,'done')})
test('a successful first step does not complete the whole task',async()=>{const {f,r}=await ready();assert.deepEqual(summarizeTask([r],['op-a','op-b'],f.context()),{state:'partial',verified:1,planned:2})})
test('pending plan has no invented percentage or completion',async()=>{const {f}=await ready();assert.equal(summarizeTask([],['op-a'],f.context()).state,'pending')})
test('duplicate expected operation IDs are refused',async()=>{const {f,r}=await ready();assert.equal(summarizeTask([r],['op-a','op-a'],f.context()).state,'needs_review')})
test('duplicate receipts cannot inflate progress',async()=>{const {f,r}=await ready();assert.equal(summarizeTask([r,r],['op-a','op-b'],f.context()).state,'needs_review')})
test('unplanned effect is not hidden in a success summary',async()=>{const {f,r}=await ready();assert.equal(summarizeTask([r],['op-b'],f.context()).state,'needs_review')})
test('revoked result context cannot complete an aggregate task',async()=>{const {f,r}=await ready();assert.equal(summarizeTask([r],['op-a'],{...f.context(),resultAuthorized:false}).state,'needs_review')})
