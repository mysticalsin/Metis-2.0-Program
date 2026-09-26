/** Real filesystem effect in a newly created TEMP directory, not a native app demo.
 * No live user files, network, microphone, desktop input, secret store, or production
 * memory service. Journal is explicitly a test double and disappears on exit.
 */
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { BehaviorAuthority } from '../dist/authority.js'
import { executeVerifiedOperation, presentReceipt } from '../dist/coordinator.js'
import { NativeInputLeaseBroker } from '../dist/native-lease.js'
import { MemoryJournal, binding, target, turn } from '../tests/fixtures.mjs'
export async function runFileExample(){
 const root=await mkdtemp(path.join(tmpdir(),'metis-behavior-example-'))
 const file=path.join(root,'test-note.txt'),clock=()=>performance.now()
 try {
  const authority=new BehaviorAuthority(binding,clock)
  const grant=authority.beginIntent({...turn,source:'trusted-typed',capabilities:['create_document'],routes:['native_semantic'],maxOperations:1})
  const text='Friday plan\nRéviser le contrat\nReunião com São Paulo\nEnviar um rascunho — não enviar email.'
  const proposal=await authority.propose(grant,{operationId:'file-example',kind:'create_document',route:'native_semantic',args:{title:'Friday plan',content:text},target:{...target,observedAtMs:clock()},expectedPostcondition:'exact-file-content'})
  let effectCalls=0
  const port={
   matchIntent:async p=>({matches:p.args.title==='Friday plan'&&p.args.content===text,sourceIntentRef:'explicit-example-request',inputRevision:p.inputRevision,proposalDigest:p.digest,expectedPostcondition:'exact-file-content'}),
   observe:async()=>({...target,observedAtMs:clock()}),
   dispatch:async(p,c)=>{c.assertCanDispatch();effectCalls++;await writeFile(file,p.args.content,{encoding:'utf8',flag:'wx'})},
   verify:async p=>{
    const content=await readFile(file,'utf8')
    return {kind:'application_readback',operationId:p.operationId,proposalDigest:p.digest,resourceId:p.target.resourceId,expectedPostcondition:p.expectedPostcondition,observedAtMs:clock(),result:content===text?'matched':'uncertain',evidenceRef:'sha256:'+createHash('sha256').update(content).digest('hex')}
   },
   quiesce:async()=>true
  }
  const receipt=await executeVerifiedOperation({authority,proposal,grant,journal:new MemoryJournal(),port,inputBroker:new NativeInputLeaseBroker()})
  return {scope:'REAL_TEMP_FILE_EFFECT_WITH_EXPLICIT_TEST_JOURNAL_NOT_NATIVE_METIS',effectCalls,byteMatch:(await readFile(file,'utf8'))===text,receipt,display:presentReceipt(receipt,{binding,currentEpoch:authority.authorityEpoch,currentPolicyEpoch:0,resultAuthorized:true})}
 } finally { await rm(root,{recursive:true,force:true}) }
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))console.log(JSON.stringify(await runFileExample(),null,2))
