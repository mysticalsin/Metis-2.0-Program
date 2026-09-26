/**
 * Candidate HOST-only behavior boundary. Not an IPC handler, identity provider or
 * native permission implementation. Production must authenticate ingress BEFORE
 * calling it. The renderer/model must never receive this object or its grant APIs.
 * Immutable opaque grants are process-local; persistence/replica fencing is a
 * separate mandatory binding. No text is sent to a service by this module.
 */
export type Mode = 'talk' | 'guide' | 'do' | 'dictate';
export type InputSource = 'command-microphone' | 'trusted-typed' | 'meeting-audio' | 'assistant-playback' | 'tool-output' | 'document';
export type Kind = 'read_resource' | 'open_application' | 'set_value' | 'insert_text' | 'create_document' | 'navigate' | 'send' | 'delete' | 'purchase' | 'share';
export type Route = 'connector' | 'native_semantic' | 'browser_dom' | 'foreground_input';
export type Json = null | boolean | number | string | Json[] | {
    [key: string]: Json;
};
export type Identity = Readonly<{
    tenantId: string;
    principalId: string;
    deviceId: string;
    sessionId: string;
    agentId: string;
    taskId: string;
}>;
export type Target = Readonly<{
    resourceId: string;
    appId: string;
    windowId: string;
    fieldId: string;
    revision: string;
    transformId: string;
    observedAtMs: number;
    protected: boolean;
}>;
export type Proposal = Readonly<{
    binding: Identity;
    epoch: number;
    policyEpoch: number;
    inputRevision: number;
    mode: Mode;
    operationId: string;
    kind: Kind;
    route: Route;
    args: Json;
    target: Target;
    expectedPostcondition: string;
    digest: string;
}>;
export type ScopeGrant = Readonly<{
    epoch: number;
    policyEpoch: number;
    inputRevision: number;
    expiresAtMs: number;
    resources: readonly string[];
    capabilities: readonly Kind[];
    routes: readonly Route[];
    mode: Mode;
    maxOperations: number;
}>;
export type ExactApproval = Readonly<{
    digest: string;
    epoch: number;
    expiresAtMs: number;
}>;
export declare class BoundaryError extends Error {
    readonly code: string;
    constructor(code: string);
}
export declare function requireThat(value: unknown, code: string): asserts value;
export declare function finite(value: unknown): value is number;
export declare function id(value: unknown): value is string;
export declare const consequential: (kind: Kind) => boolean;
export declare const mutates: (kind: Kind) => boolean;
export declare function identityKey(binding: Identity): string;
export declare function canonical(value: unknown, depth?: number): string;
export declare function targetMatches(a: Target, b: Target): boolean;
export declare function digestProposal(value: unknown): Promise<string>;
/** Host instance is fixed to one identity/task. Recreate and revoke on identity change. */
export declare class BehaviorAuthority {
    private readonly clock;
    private epoch;
    private policyEpoch;
    private revision;
    private disabled;
    private grantState;
    private approvals;
    private proposals;
    private currentAbort;
    private lastNow;
    readonly binding: Identity;
    constructor(binding: Identity, clock: () => number, policyEpoch?: number);
    now(): number;
    get signal(): AbortSignal;
    get authorityEpoch(): number;
    invalidate(reason: 'stop' | 'pause' | 'correction' | 'takeover' | 'signout' | 'policy'): void;
    updatePolicy(epoch: number): void;
    /** Caller must have authenticated the source/capture owner; this enum is NOT authentication. */
    beginIntent(input: {
        source: InputSource;
        final: boolean;
        revision: number;
        mode: Mode;
        resources: string[];
        capabilities: Kind[];
        routes: Route[];
        ttlMs: number;
        maxOperations: number;
    }): ScopeGrant;
    propose(grant: ScopeGrant, input: {
        operationId: string;
        kind: Kind;
        route: Route;
        args: Json;
        target: Target;
        expectedPostcondition: string;
    }): Promise<Proposal>;
    private checkGrant;
    check(p: Proposal, g: ScopeGrant, observation?: Target, afterConsumption?: boolean): void;
    /** Only the trusted confirmation controller calls this after presenting the exact proposal. */
    approve(p: Proposal, g: ScopeGrant, confirmedDigest: string, ttlMs?: number): ExactApproval;
    /** Called synchronously at the final dispatcher boundary, after all awaited setup. */
    consume(p: Proposal, g: ScopeGrant, observation: Target, approval?: ExactApproval, policyRequiresApproval?: boolean): void;
}
