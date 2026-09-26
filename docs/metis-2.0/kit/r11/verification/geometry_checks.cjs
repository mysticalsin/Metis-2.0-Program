#!/usr/bin/env node
/* Pure geometry checks only; not React/native visual or performance certification. */
const assert=require('node:assert/strict');
const orb=require('../visual/vendor/solving-engine.js');
const checks=[];function check(name,f){try{f();checks.push({check:name,passed:true});}catch(e){checks.push({check:name,passed:false,detail:String(e)});}}
check('Official 64-preset source lineage',()=>{assert.equal(orb.presetSize,64);assert.equal(orb.geometryRevision,'f4f9126cb6205b6097835d5ba1107597f5d8a11c');});
check('Deterministic solving geometry at an identical clock',()=>assert.deepEqual(orb.frame('solving',1.25),orb.frame('solving',1.25)));
check('Solving changes actual geometry over time',()=>assert.notDeepEqual(orb.frame('solving',0),orb.frame('solving',1)));
check('Resolved count is the 64 solving preset',()=>assert.equal(orb.frame('solving',0).dots.length,138));
check('Finite depth-sorted in-bounds dots over 30 seconds',()=>{for(let i=0;i<600;i++){const f=orb.frame('solving',i/20);let z=-Infinity;for(const d of f.dots){for(const k of ['x','y','z','r','white'])assert.ok(Number.isFinite(d[k]));assert.ok(d.x>=0&&d.x<=64&&d.y>=0&&d.y<=64&&d.r>=.3);assert.ok(d.z>=z);z=d.z;}}});
check('Listening is a distinct official waveform geometry',()=>assert.notDeepEqual(orb.frame('listening',1),orb.frame('solving',1)));
check('Invalid sizes and clocks rejected',()=>{for(const n of [-1,NaN,Infinity])assert.throws(()=>orb.frame('solving',n));for(const n of [0,41,100])assert.throws(()=>orb.frame('solving',1,n));});
const r={scope:'OFFLINE_SOURCE_ADAPTED_GEOMETRY_ONLY',checks,passed:checks.every(x=>x.passed)};console.log(JSON.stringify(r,null,2));process.exitCode=r.passed?0:1;
