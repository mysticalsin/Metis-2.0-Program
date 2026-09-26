/** Explicit opt-in, synthetic REAL-HINDSIGHT API smoke. Not a full Métis E2E test. */
import { randomUUID } from 'node:crypto';
import { HindsightClient, MemoryError } from './src/hindsight-client.mjs';
const args=new Set(process.argv.slice(2));
if(!args.has('--allow-synthetic-write') || !args.has('--allow-provider-cost')) {
 console.error('NOT_RUN: Requires --allow-synthetic-write --allow-provider-cost and an approved dedicated test bank.');process.exit(2);
}
const {METIS_HINDSIGHT_URL:baseUrl,METIS_HINDSIGHT_API_KEY:apiKey,METIS_HINDSIGHT_TEST_BANK:bankId}=process.env;
if(!bankId?.startsWith('metis-test-')){console.error('NOT_RUN: dedicated pre-created metis-test-* bank required.');process.exit(2)}
const doc='metis-test-'+randomUUID();const checks=[];let touched=false;let failed=false;
const client=new HindsightClient({baseUrl,apiKey,bankId,scopeTags:['metis:synthetic',`run:${doc}`],deadlineMs:120000});
try {
 await client.readiness();checks.push('runtime_privacy_flags');touched=true;
 await client.retain({documentId:doc,timestamp:new Date().toISOString(),content:`Synthetic test record ${doc}. The preferred summary language is French.`,metadata:{source_id:doc,source_revision:'test1'}});
 checks.push('real_retain_ack');await client.documentPrivacy(doc);checks.push('stored_document_text_null');
 let recalled;
 for(let i=0;i<6;i++) {recalled=await client.recall('Which summary language is preferred?');if(recalled.candidates.length)break;await new Promise(r=>setTimeout(r,1000));}
 if(!recalled?.candidates.length)throw new MemoryError('RECALL_NOT_OBSERVED');checks.push('real_scoped_recall_nonempty');
 await client.reflect('Which summary language is preferred?');checks.push('real_reflect_with_evidence');
} catch(e){failed=true;checks.push(`FAILED:${e instanceof MemoryError?e.code:'LOCAL_ERROR'}`)}
finally {
 if(touched){try{await client.deleteDocument(doc);checks.push('real_document_delete_ack');
  try{await client.documentPrivacy(doc);throw new MemoryError('DELETE_READBACK_FAILED')}
  catch(e){if(e.status!==404)throw e;checks.push('deleted_document_404')}
 }catch(e){failed=true;checks.push(`CLEANUP_UNCONFIRMED:${e instanceof MemoryError?e.code:'LOCAL_ERROR'}`)}}
}
console.log(JSON.stringify({scope:'REAL_HINDSIGHT_SYNTHETIC_SMOKE_ONLY',passed:!failed,checks,
 productE2E:'NOT_TESTED',derivedAndBackupErasure:'NOT_PROVEN'},null,2));process.exitCode=failed?1:0;
