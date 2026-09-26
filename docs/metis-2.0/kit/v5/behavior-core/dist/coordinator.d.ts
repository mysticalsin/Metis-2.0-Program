import { BehaviorAuthority, type ScopeGrant, type Proposal, type ExactApproval, type Target, type Identity, type Kind } from './authority.js';
import { NativeInputLeaseBroker, type InputLease } from './native-lease.js';
export type Outcome = 'verified' | 'not_applied' | 'unknown' | 'cancelled' | 'blocked';
export type Proof = Readonly<{
    kind: 'application_readback' | 'api_commit';
    operationId: string;
    proposalDigest: string;
    resourceId: string;
    expectedPostcondition: string;
    observedAtMs: number;
    result: 'matched' | 'confirmed_no_effect' | 'uncertain';
    evidenceRef: string;
}>;
export type Receipt = Readonly<{
    operationId: string;
    proposalDigest: string;
    identityKey: string;
    kind: Kind;
    authorityEpoch: number;
    policyEpoch: number;
    outcome: Outcome;
    dispatched: boolean;
    code: string;
    evidenceRef: string | null;
    startedAtMs: number;
    finishedAtMs: number;
    journalSettled: boolean;
    inputQuiesced: boolean;
}>;
export type Reservation = Readonly<{
    key: string;
    resourceKey: string;
    proposalDigest: string;
    operationId: string;
    identityKey: string;
}>;
/** Mandatory durable, atomic host/service binding. An in-memory test store is NOT a deployment. */
export interface OperationJournal {
    /** Atomic reserve + exclusive mutation/read session resource lock. Never steal unknown work. */
    reserve(record: Reservation): Promise<'reserved' | 'operation_exists' | 'resource_busy'>;
    /** Persist receipt; unknown or dispatched-without-proof MUST retain resource quarantine. */
    settle(key: string, receipt: Receipt): Promise<void>;
}
export type IntentMatch = Readonly<{
    matches: boolean;
    sourceIntentRef: string;
    inputRevision: number;
    proposalDigest: string;
    expectedPostcondition: string;
}>;
export interface ActionPort {
    /** Independently bind proposed literals/scope to canonical user intent, not the planner's own output. */
    matchIntent(p: Proposal, signal: AbortSignal): Promise<IntentMatch>;
    /** These methods run trusted adapter code, not a model's claim of success. */
    observe(p: Proposal, signal: AbortSignal): Promise<Target>;
    dispatch(p: Proposal, control: {
        signal: AbortSignal;
        inputLease: InputLease | null;
        assertCanDispatch: () => void;
    }): Promise<void>;
    verify(p: Proposal, signal: AbortSignal): Promise<Proof>;
    /** Fence and drain all native events. false/failure/timeout retains the device lock. */
    quiesce(inputLease: InputLease): Promise<boolean>;
}
export type PhaseEvent = Readonly<{
    phase: 'preparing' | 'working' | 'verifying' | 'settled';
    operationId: string;
    outcome?: Outcome;
}>;
export declare function reservationFor(p: Proposal): Reservation;
/** A deadline also bounds transports that ignore AbortSignal. Late promises are observed. */
export declare function bounded<T>(work: Promise<T>, signal: AbortSignal, timeoutMs: number): Promise<T>;
/** No retries or fallback route here: unknown side effects require reconciliation, not replay. */
export declare function executeVerifiedOperation(options: {
    authority: BehaviorAuthority;
    proposal: Proposal;
    grant: ScopeGrant;
    approval?: ExactApproval;
    journal: OperationJournal;
    port: ActionPort;
    inputBroker: NativeInputLeaseBroker;
    timeoutMs?: number;
    policyRequiresApproval?: boolean;
    onPhase?: (event: PhaseEvent) => void;
}): Promise<Receipt>;
/** No free-text model completion may replace this disposition without verified evidence. */
export declare function presentReceipt(r: Receipt, context: {
    binding: Identity;
    currentEpoch: number;
    currentPolicyEpoch: number;
    resultAuthorized: boolean;
}): {
    label: string;
    message: string;
    canSayDone: boolean;
};
/** Exact current plan only. A completed first step is not a completed multi-step task. */
export declare function summarizeTask(receipts: readonly Receipt[], expectedOperationIds: readonly string[], context: Parameters<typeof presentReceipt>[1]): Readonly<{
    state: 'done' | 'partial' | 'pending' | 'needs_review';
    verified: number;
    planned: number;
}>;
