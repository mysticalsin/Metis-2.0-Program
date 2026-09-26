/** Independent pure contract reference; no OS or media I/O and no production authority.
 * Use the existing Métis scene helpers and trusted native adapters in production.
 */
'use strict';
const SCENES=Object.freeze(['hero','problem','reveal','appearance','setup','personalize','ready']);
function flow(licenseEnabled=false){return licenseEnabled?[...SCENES.slice(0,-1),'license','ready']:[...SCENES];}
function nextScene(scene,licenseEnabled=false){const f=flow(licenseEnabled),i=f.indexOf(scene);if(i<0)throw new Error('UNKNOWN_SCENE');return f[Math.min(i+1,f.length-1)];}
function finishAllowed(x){return x.scene==='ready'&&x.consent===true&&x.corePolicyReady===true;}
const STATES=new Set(['unknown','not_determined','checking','loading','waiting','granted','denied','restricted','restart_required','revoked','unavailable','deferred']);
function permissionRow(probe,expected){
 if(!probe||probe.generation!==expected.generation||probe.principal!==expected.principal||probe.capability!==expected.capability||!STATES.has(probe.status))return {state:'checking',ready:false};
 if(probe.status==='granted')return probe.probeVerified===true?{state:'ready',ready:true}:{state:'granted_unverified',ready:false};
 if(probe.status==='waiting')return {state:'waiting_for_return',ready:false};
 if(['unknown','not_determined'].includes(probe.status))return {state:'action',ready:false};
 return {state:probe.status,ready:false};
}
function safeAsset(x){return Boolean(x&&typeof x.path==='string'&&/^media\/tony-walteur\/[a-z0-9][a-z0-9._-]*$/.test(x.path)&&!x.path.includes('..')&&/^[a-f0-9]{64}$/.test(x.sha256||''));}
function mediaPlan(m,hostProof={releaseVerified:false,verifiedHashes:[]}){
 const fallback=(reason)=>({kind:'text',src:null,autoplay:false,reason});
 if(!m||m.status!=='AVAILABLE')return fallback('NO_APPROVED_RECORDING');
 if(m.presenter!=='Tony Walteur'||JSON.stringify(m.allowedNamedHumans)!==JSON.stringify(['Tony Walteur']))return fallback('WRONG_PRESENTER');
 if(m.contentReview?.status!=='APPROVED'||!m.contentReview.reviewReference||m.rightsReview?.status!=='APPROVED'||!m.rightsReview.reviewReference)return fallback('REVIEW_REQUIRED');
 const assets=[m.video,m.poster,m.descriptiveTranscript,...(m.captions||[])];
 if(!m.captions?.length||!assets.every(safeAsset))return fallback('INCOMPLETE_ACCESSIBLE_MEDIA');
 if(!hostProof.releaseVerified||!assets.every(x=>hostProof.verifiedHashes.includes(x.sha256)))return fallback('HOST_VERIFICATION_REQUIRED');
 if(m.runtime?.autoplay!==false||m.runtime?.loop!==false||m.runtime?.externalFallback!==null||m.runtime?.completionControlledByVideo!==false)return fallback('UNSAFE_PLAYBACK_POLICY');
 return {kind:'video',src:m.video.path,autoplay:false,loop:false,completionControlledByVideo:false};
}
function acceptsResult(event,current){return !current.cancelled&&['generation','principal','capability'].every(k=>event[k]===current[k]);}
module.exports=Object.freeze({SCENES,flow,nextScene,finishAllowed,permissionRow,mediaPlan,acceptsResult});
