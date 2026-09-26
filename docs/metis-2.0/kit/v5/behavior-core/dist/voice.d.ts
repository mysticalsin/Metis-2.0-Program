/** Playback metadata only; a real audio sink must supply its actual played position. */
export type PlaybackToken = Readonly<{
    responseId: string;
    taskId: string;
    generation: number;
}>;
export type Interruption = Readonly<{
    responseId: string;
    taskId: string;
    generation: number;
    heardThroughMs: number;
    discardQueuedAudio: true;
    cancelGeneration: true;
}>;
export declare class PlaybackLedger {
    private readonly maxBufferedMs;
    private readonly maxResponseMs;
    private generation;
    private current;
    private nextSequence;
    private queuedThrough;
    private playedThrough;
    constructor(maxBufferedMs?: number, maxResponseMs?: number);
    start(responseId: string, taskId: string): PlaybackToken;
    acceptChunk(token: PlaybackToken, sequence: number, startMs: number, durationMs: number): boolean;
    acknowledgePlayed(token: PlaybackToken, positionMs: number): boolean;
    interrupt(): Interruption | null;
    end(token: PlaybackToken): boolean;
    get active(): boolean;
}
export type OutputContext = Readonly<{
    audienceAuthorized: boolean;
    muted: boolean;
    callActive: boolean;
    sharing: boolean;
    focusMode: boolean;
    privateOutputVerified: boolean;
    explicitRequest: boolean;
    routine: boolean;
}>;
export declare function maySpeak(c: OutputContext): boolean;
export type Control = 'stop_speaking' | 'status_question' | 'pause_task' | 'cancel_task' | 'stop_all' | 'human_takeover' | 'correct_action' | 'change_reply_language';
export declare function controlDisposition(control: Control): Readonly<{
    flushSpeech: boolean;
    revokeActionAuthority: boolean;
    requiresFreshIntent: boolean;
}>;
