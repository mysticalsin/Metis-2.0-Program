/** Operator-side orchestration candidate. Real auth, entitlement, content review,
 * cross-replica budgets/circuits and durable accounting are mandatory injected ports.
 * Never accept this module's trusted request/config objects directly from a renderer.
 */
import { type Identity } from './authority.js';
import { type DecisionProvider, type Evaluation, type EvaluationResult, type Usage } from './jev-contract.js';
import type { DecisionBackend } from './jev-transport.js';
export type Purpose = 'action-selection' | 'interaction-intent' | 'skill-selection' | 'knowledge-triage';
export type DecisionBinding = Readonly<{
    identity: Identity;
    inputRevision: number;
    authorityEpoch: number;
    contextRevision: string;
    policyRevision: string;
}>;
export type DecisionRequest = Readonly<{
    requestId: string;
    binding: DecisionBinding;
    source: 'trusted-typed' | 'command-microphone' | 'approved-canonical';
    final: boolean;
    purpose: Purpose;
    templateVersion: string;
    language: string;
    candidateCount: number;
    candidateSetDigest: string;
    dataClass: 'synthetic' | 'approved-content';
    evaluation: Evaluation;
}>;
export type Thresholds = Readonly<{
    choiceConfidence: number;
    choiceProbability: number;
    choiceMargin: number;
    scoreConfidence: number;
    noulYes: number;
    noulNo: number;
}>;
export type Qualification = Readonly<{
    evidenceRef: string;
    expiresAtMs: number;
    templateVersions: readonly string[];
    languages: readonly string[];
    purposes: readonly Purpose[];
    maxCandidates: number;
    thresholds: Thresholds;
}>;
export type BackendPolicy = Readonly<{
    model: string;
    credentialRevision: string;
    dataReviewRef: string;
    allowApprovedContent: boolean;
    desktopAssistance: boolean;
    intelligenceAssessments: boolean;
    qualification: Qualification;
}>;
export type RoutingPolicy = Readonly<{
    revision: string;
    mode: 'disabled' | 'jev' | 'laya' | 'auto';
    primary: DecisionProvider;
    allowFallback: boolean;
    fallbackOn: readonly string[];
    timeoutMs: number;
    backends: Partial<Record<DecisionProvider, BackendPolicy>>;
}>;
export type AttemptStart = Readonly<{
    attemptId: string;
    requestId: string;
    requestDigest: string;
    binding: DecisionBinding;
    purpose: Purpose;
    templateVersion: string;
    language: string;
    provider: DecisionProvider;
    model: string;
    credentialRevision: string;
    qualificationRef: string;
    startedAtMs: number;
}>;
export type AttemptReceipt = AttemptStart & Readonly<{
    outcome: 'evaluated' | 'failed' | 'cancelled' | 'stale';
    code: string;
    usage: Usage;
    latencyMs: number;
    finishedAtMs: number;
}>;
export interface DecisionJournal {
    /** Atomic: reserve budget + request attempt identity + per-tenant/provider circuit lease.
     * Duplicate must not spend again. Implement TTL/circuit recovery across replicas. */
    reserve(start: AttemptStart): Promise<'reserved' | 'duplicate' | 'budget_exceeded' | 'circuit_open'>;
    /** Idempotent durable settlement; cancellation must not drop already incurred usage.
     * Timeout/crash leaves reservation pending for reconciliation, never free/zero usage. */
    settle(receipt: AttemptReceipt): Promise<void>;
}
export interface DecisionSecurity {
    /** Authenticate the real caller, derive entitlement/policy, authorize all source fields. */
    authorize(request: DecisionRequest): Promise<RoutingPolicy>;
    /** Re-read signout/revocation, ACLs, capture ownership, input/context generation,
     * effective policy AND credential revision. Do not implement as `return true`. */
    assertCurrent(request: DecisionRequest, policy: RoutingPolicy, provider: DecisionProvider, phase: 'before_dispatch' | 'after_response' | 'before_return'): Promise<void>;
}
export type DecisionResult = Readonly<{
    status: 'evaluated';
    requestId: string;
    requestDigest: string;
    binding: DecisionBinding;
    provider: DecisionProvider;
    model: string;
    qualificationRef: string;
    thresholds: Thresholds;
    evaluation: EvaluationResult;
    attempts: readonly AttemptReceipt[];
}> | Readonly<{
    status: 'unavailable' | 'cancelled' | 'blocked';
    code: string;
    attempts: readonly AttemptReceipt[];
}>;
export interface DecisionClient {
    evaluate(request: DecisionRequest, signal: AbortSignal): Promise<DecisionResult>;
}
export declare class ManagedDecisionService implements DecisionClient {
    private readonly ports;
    constructor(ports: {
        security: DecisionSecurity;
        journal: DecisionJournal;
        backends: Partial<Record<DecisionProvider, DecisionBackend>>;
        now: () => number;
    });
    evaluate(input: DecisionRequest, signal: AbortSignal): Promise<DecisionResult>;
}
/** Pure read-model. A stored key alone never renders Ready. Poll current server state. */
export declare function decisionReadiness(facts: {
    entitled: boolean;
    enabled: boolean;
    keyStored: boolean;
    privacyApproved: boolean;
    profileQualified: boolean;
    probe: 'never' | 'passed' | 'failed';
    probeFresh: boolean;
    healthy: boolean;
}): 'not_entitled' | 'disabled' | 'unconfigured' | 'privacy_blocked' | 'unqualified' | 'checking' | 'degraded' | 'ready';
