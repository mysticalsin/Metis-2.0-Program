import { finite, id, requireThat } from './authority.js'
/** Playback metadata only; a real audio sink must supply its actual played position. */
export type PlaybackToken=Readonly<{responseId:string;taskId:string;generation:number}>
export type Interruption=Readonly<{responseId:string;taskId:string;generation:number;heardThroughMs:number;discardQueuedAudio:true;cancelGeneration:true}>
export class PlaybackLedger {
  private generation=0
  private current:PlaybackToken|null=null
  private nextSequence=0
  private queuedThrough=0
  private playedThrough=0
  constructor(private readonly maxBufferedMs=5000,private readonly maxResponseMs=300000){
    requireThat(finite(maxBufferedMs)&&maxBufferedMs>0&&maxBufferedMs<=30000&&finite(maxResponseMs)&&maxResponseMs>=maxBufferedMs&&maxResponseMs<=3600000,'BAD_AUDIO_BUDGET')
  }
  start(responseId:string,taskId:string):PlaybackToken {
    requireThat(id(responseId)&&id(taskId),'BAD_RESPONSE_ID')
    // Caller interrupts/flushes an old sink BEFORE replacing its owner.
    requireThat(!this.current,'PLAYBACK_OWNER_EXISTS')
    const t=Object.freeze({responseId,taskId,generation:++this.generation})
    this.current=t;this.nextSequence=0;this.queuedThrough=0;this.playedThrough=0;return t
  }
  acceptChunk(token:PlaybackToken,sequence:number,startMs:number,durationMs:number):boolean {
    if(this.current!==token)return false
    if(!Number.isSafeInteger(sequence)||sequence!==this.nextSequence||!finite(startMs)||startMs!==this.queuedThrough||!finite(durationMs)||durationMs<=0||durationMs>30000)return false
    if(this.queuedThrough+durationMs-this.playedThrough>this.maxBufferedMs||this.queuedThrough+durationMs>this.maxResponseMs)return false
    this.nextSequence++;this.queuedThrough+=durationMs;return true
  }
  acknowledgePlayed(token:PlaybackToken,positionMs:number):boolean {
    if(this.current!==token||!finite(positionMs)||positionMs<this.playedThrough||positionMs>this.queuedThrough)return false
    this.playedThrough=positionMs;return true
  }
  interrupt():Interruption|null {
    if(!this.current)return null
    const out=Object.freeze({...this.current,heardThroughMs:this.playedThrough,discardQueuedAudio:true as const,cancelGeneration:true as const})
    this.current=null;this.generation++;return out
  }
  end(token:PlaybackToken):boolean {
    if(this.current!==token||this.playedThrough!==this.queuedThrough)return false
    this.current=null;return true
  }
  get active():boolean{return this.current!==null}
}
export type OutputContext=Readonly<{audienceAuthorized:boolean;muted:boolean;callActive:boolean;sharing:boolean;focusMode:boolean;privateOutputVerified:boolean;explicitRequest:boolean;routine:boolean}>
export function maySpeak(c:OutputContext):boolean {
  // Missing/unknown audience permission is denial, not a convenient default.
  if(!['audienceAuthorized','muted','callActive','sharing','focusMode','privateOutputVerified','explicitRequest','routine'].every(k=>typeof c[k as keyof OutputContext]==='boolean'))return false
  if(c.audienceAuthorized!==true || c.muted!==false)return false
  if(c.callActive||c.sharing)return c.explicitRequest===true&&c.privateOutputVerified===true
  if(c.focusMode&&c.routine&&!c.explicitRequest)return false
  return true
}
export type Control='stop_speaking'|'status_question'|'pause_task'|'cancel_task'|'stop_all'|'human_takeover'|'correct_action'|'change_reply_language'
export function controlDisposition(control:Control):Readonly<{flushSpeech:boolean;revokeActionAuthority:boolean;requiresFreshIntent:boolean}> {
  switch(control){
    case 'stop_speaking':case 'status_question':case 'change_reply_language': return Object.freeze({flushSpeech:true,revokeActionAuthority:false,requiresFreshIntent:false})
    case 'pause_task':case 'human_takeover':case 'correct_action': return Object.freeze({flushSpeech:true,revokeActionAuthority:true,requiresFreshIntent:true})
    case 'cancel_task':case 'stop_all': return Object.freeze({flushSpeech:true,revokeActionAuthority:true,requiresFreshIntent:true})
    default: throw new Error('UNRECOGNIZED_CONTROL')
  }
}
