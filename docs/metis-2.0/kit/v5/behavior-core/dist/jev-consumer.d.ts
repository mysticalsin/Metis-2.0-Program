/** Trusted-host consumers: actually use bounded choices, but never let a provider
 * create arguments, grants, approvals, receipt proofs, or new execution routes.
 */
import { type BehaviorAuthority, type ScopeGrant, type Proposal, type ExactApproval } from './authority.js';
import { type Receipt, type ActionPort, type OperationJournal } from './coordinator.js';
import type { NativeInputLeaseBroker } from './native-lease.js';
import type { DecisionBinding, DecisionClient, DecisionResult } from './jev-service.js';
export type ConsumptionReceipt = Readonly<{
    requestDigest: string;
    proposalDigest: string;
    provider: string;
    model: string;
    qualificationRef: string;
    binding: DecisionBinding;
}>;
export type ActionDecisionOutcome = Readonly<{
    status: 'executed';
    selection: 'deterministic' | 'jev' | 'laya';
    receipt: Receipt;
    decision?: ConsumptionReceipt;
}> | Readonly<{
    status: 'needs_clarification' | 'blocked';
    code: string;
}>;
export declare function executeWithDecision(options: {
    authority: BehaviorAuthority;
    grant: ScopeGrant;
    requestId: string;
    policyRevision: string;
    contextRevision: string;
    source: 'command-microphone' | 'trusted-typed';
    utterance: string;
    language: string;
    dataClass: 'synthetic' | 'approved-content';
    candidates: readonly {
        id: string;
        label: string;
        proposal: Proposal;
    }[];
    /** Only a qualified deterministic parser may set this; not the renderer/model. */
    deterministicCandidateId?: string;
    client: DecisionClient;
    port: ActionPort;
    journal: OperationJournal;
    inputBroker: NativeInputLeaseBroker;
    /** Persist selection consumption/usage linkage, BEFORE dispatch. Not execution approval. */
    recordConsumption: (receipt: ConsumptionReceipt) => Promise<void>;
    approval?: ExactApproval;
    timeoutMs?: number;
}): Promise<ActionDecisionOutcome>;
/** Canonical knowledge owns access + revision. This is not a memory write or proof. */
export declare function annotateKnowledge(options: {
    requestId: string;
    binding: DecisionBinding;
    language: string;
    query: string;
    sources: readonly {
        ref: string;
        revision: string;
        excerpt: string;
    }[];
    dataClass: 'synthetic' | 'approved-content';
    client: DecisionClient;
    signal: AbortSignal;
    assertSourcesCurrent: () => Promise<void>;
}): Promise<Readonly<{
    status: 'annotated';
    label: string;
    provider: string;
    model: string;
    sourceRefs: readonly {
        ref: string;
        revision: string;
    }[];
    decision: DecisionResult;
} | {
    status: 'blocked';
    code: string;
}>>;
/** Bounded read-only hint. Even a 'do' classification cannot mint a task grant.
 * Existing explicit Stop/status/speech controls and deterministic intent routes run first.
 * Skill eligibility is derived by the host and rechecked before this result is released.
 */
export declare function recommendInteractionOrSkill(options: {
    requestId: string;
    binding: DecisionBinding;
    source: 'command-microphone' | 'trusted-typed';
    purpose: 'interaction-intent' | 'skill-selection';
    utterance: string;
    language: string;
    dataClass: 'synthetic' | 'approved-content';
    eligibleSkills?: readonly {
        id: string;
        label: string;
    }[];
    client: DecisionClient;
    signal: AbortSignal;
    assertEligibleCurrent: () => Promise<void>;
}): Promise<Readonly<{
    status: 'recommended';
    choice: string;
    provider: string;
    model: string;
    requestDigest: string;
} | {
    status: 'needs_clarification' | 'blocked';
    code: string;
}>>;
