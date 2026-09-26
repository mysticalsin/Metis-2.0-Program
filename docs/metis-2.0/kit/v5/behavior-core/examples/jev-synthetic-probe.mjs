/** Administrator/developer qualification probe ONLY, never an employee-side route.
 * It makes one possibly billable vendor call only with the explicit flag.
 * Prefer the actual Operator admin/vault/ledger flow when integrated. No customer data.
 */
import {createJevBackend} from '../dist/jev-transport.js'
import {DOCUMENTED_JEV_PIN,DecisionFailure} from '../dist/jev-contract.js'
import {BoundaryError} from '../dist/authority.js'
const args=process.argv.slice(2)
if(args.length!==1||args[0]!=='--execute-paid-synthetic'){
 console.error('No request made. Authorized server-side qualification only: supply --execute-paid-synthetic explicitly; provide JEV_SERVER_API_KEY securely in the server environment, never in chat or command arguments.')
 process.exitCode=2
}else if(!process.env.JEV_SERVER_API_KEY){
 console.error('No request made: JEV_SERVER_API_KEY is not configured in this authorized environment.')
 process.exitCode=2
}else{
 const model=process.env.JEV_QUALIFICATION_MODEL??DOCUMENTED_JEV_PIN
 const signal=AbortSignal.timeout(2500),start=performance.now()
 try{
  const client=createJevBackend({model,readServerSecret:async()=>process.env.JEV_SERVER_API_KEY})
  const result=await client.evaluate({state:'Synthetic test: the selected color is blue.',questions:{color:{type:'choice',instructions:'Which color is explicitly selected in state?',criteria:{blue:'Blue',red:'Red'}}}},signal,2000)
  const passed=result.answers.color?.type==='choice'&&result.answers.color.choice==='blue'
  console.log(JSON.stringify({scope:'one synthetic vendor response; not calibration, privacy, two-device, native or application qualification',model:result.model,syntheticProbePassed:passed,latencyMs:performance.now()-start,usage:result.usage,productionReady:false},null,2))
  if(!passed)process.exitCode=1
 }catch(error){
  console.error(JSON.stringify({status:'not_qualified',code:error instanceof BoundaryError?error.code:'PROBE_FAILED',latencyMs:performance.now()-start,usage:error instanceof DecisionFailure?error.observedUsage:null,productionReady:false}))
  process.exitCode=1
 }
}
