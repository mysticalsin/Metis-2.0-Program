/** Operator-side orchestration candidate. Real auth, entitlement, content review,
 * cross-replica budgets/circuits and durable accounting are mandatory injected ports.
 * Never accept this module's trusted request/config objects directly from a renderer.
 */
import { BoundaryError, canonical, digestProposal, id, requireThat, type Identity } from './authority.js';
import { DecisionFailure, freeze, probability, snapshotEvaluation, usageFrom, validateEvaluation, within, type DecisionProvider, type Evaluation, type EvaluationResult, type Usage } from './jev-contract.js';
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
const transient = new Set(['DECISION_TIMEOUT', 'DECISION_RATE_LIMITED', 'DECISION_OVERLOADED', 'DECISION_UPSTREAM_ERROR', 'DECISION_TRANSPORT_ERROR', 'DECISION_CIRCUIT_OPEN']);
const integer = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const safe = (e: unknown) => e instanceof BoundaryError ? e.code : 'DECISION_DEPENDENCY_ERROR';
function snapshotRequest(r: DecisionRequest): DecisionRequest {
    const text = canonical(r);
    requireThat(new TextEncoder().encode(text).length < 100000, 'DECISION_REQUEST_TOO_LARGE');
    const v = JSON.parse(text) as DecisionRequest;
    requireThat(id(v.requestId) && id(v.templateVersion) && id(v.language), 'DECISION_ID');
    requireThat(v.binding && ['tenantId', 'principalId', 'deviceId', 'sessionId', 'agentId', 'taskId'].every(k => id(v.binding.identity[k as keyof Identity])), 'DECISION_IDENTITY');
    requireThat(integer(v.binding.inputRevision) && integer(v.binding.authorityEpoch) && id(v.binding.contextRevision) && id(v.binding.policyRevision), 'DECISION_BINDING');
    requireThat(v.final === true, 'DECISION_UNSTABLE_INPUT');
    requireThat(['action-selection', 'interaction-intent', 'skill-selection', 'knowledge-triage'].includes(v.purpose), 'DECISION_PURPOSE');
    requireThat(['trusted-typed', 'command-microphone', 'approved-canonical'].includes(v.source), 'DECISION_UNTRUSTED_SOURCE');
    requireThat(v.source !== 'approved-canonical' || v.purpose === 'knowledge-triage', 'DECISION_SOURCE_ESCALATION');
    requireThat(['synthetic', 'approved-content'].includes(v.dataClass), 'DECISION_DATA_CLASS');
    requireThat(typeof v.candidateSetDigest === 'string' && /^[a-f0-9]{64}$/.test(v.candidateSetDigest), 'DECISION_CANDIDATE_DIGEST');
    requireThat(integer(v.candidateCount) && v.candidateCount > 0 && v.candidateCount <= 64, 'DECISION_CANDIDATE_LIMIT');
    const e = snapshotEvaluation(v.evaluation);
    requireThat(Object.values(e.questions).every(q => q.type !== 'choice' || Object.keys(q.criteria).length <= v.candidateCount), 'DECISION_CANDIDATE_COUNT_MISMATCH');
    return freeze({ ...v, evaluation: e });
}
function qualify(p: RoutingPolicy, r: DecisionRequest, provider: DecisionProvider, now: number): BackendPolicy {
    requireThat(p.revision === r.binding.policyRevision, 'DECISION_STALE_POLICY');
    const b = p.backends[provider];
    requireThat(b, 'DECISION_PROVIDER_NOT_CONFIGURED');
    requireThat(id(b.model) && id(b.credentialRevision) && id(b.dataReviewRef), 'DECISION_PROVIDER_NOT_QUALIFIED');
    if (provider === 'jev')
        requireThat(/^jev-\d+\.\d+\.\d+$/.test(b.model), 'JEV_PIN_REQUIRED');
    requireThat(r.purpose === 'knowledge-triage' ? b.intelligenceAssessments === true : b.desktopAssistance === true, 'DECISION_CAPABILITY_DISABLED');
    requireThat(r.dataClass === 'synthetic' || b.allowApprovedContent === true, 'DECISION_EGRESS_NOT_APPROVED');
    const q = b.qualification;
    requireThat(q && id(q.evidenceRef) && Number.isFinite(q.expiresAtMs) && now < q.expiresAtMs, 'DECISION_QUALIFICATION_EXPIRED');
    requireThat(q.purposes.includes(r.purpose) && q.templateVersions.includes(r.templateVersion) && q.languages.includes(r.language), 'DECISION_PROFILE_NOT_QUALIFIED');
    requireThat(integer(q.maxCandidates) && q.maxCandidates >= r.candidateCount, 'DECISION_CANDIDATES_NOT_QUALIFIED');
    const t = q.thresholds;
    requireThat(t && ['choiceConfidence', 'choiceProbability', 'choiceMargin', 'scoreConfidence', 'noulYes', 'noulNo'].every(k => probability(t[k as keyof Thresholds])) && t.noulNo < t.noulYes, 'DECISION_THRESHOLDS_INVALID');
    return b;
}
export class ManagedDecisionService implements DecisionClient {
    constructor(private readonly ports: {
        security: DecisionSecurity;
        journal: DecisionJournal;
        backends: Partial<Record<DecisionProvider, DecisionBackend>>;
        now: () => number;
    }) { }
    async evaluate(input: DecisionRequest, signal: AbortSignal): Promise<DecisionResult> {
        const attempts: AttemptReceipt[] = [];
        const overallStart = performance.now();
        let overallDeadline = overallStart + 10000;
        const left = () => { const n = overallDeadline - performance.now(); requireThat(n > 0, 'DECISION_TIMEOUT'); return n; };
        const wait = <T>(work: Promise<T>) => { const observed = Promise.resolve(work); void observed.catch(() => { }); return within(observed, signal, left()); };
        const fail = (code: string): DecisionResult => freeze({ status: code === 'DECISION_CANCELLED' ? 'cancelled' : transient.has(code) ? 'unavailable' : 'blocked', code, attempts: [...attempts] });
        try {
            requireThat(!signal.aborted, 'DECISION_CANCELLED');
            const request = snapshotRequest(input), requestDigest = await wait(digestProposal(request));
            const policy = freeze(JSON.parse(canonical(await wait(this.ports.security.authorize(request)))) as RoutingPolicy);
            requireThat(['disabled', 'jev', 'laya', 'auto'].includes(policy.mode) && ['jev', 'laya'].includes(policy.primary), 'DECISION_ROUTING_POLICY');
            requireThat(Number.isFinite(policy.timeoutMs) && policy.timeoutMs >= 10 && policy.timeoutMs <= 10000, 'DECISION_DEADLINE');
            overallDeadline = Math.min(overallDeadline, overallStart + policy.timeoutMs);
            if (policy.mode === 'disabled')
                return fail('DECISION_DISABLED');
            const primary: DecisionProvider = policy.mode === 'auto' ? policy.primary : policy.mode;
            const routes: DecisionProvider[] = [primary];
            if (policy.mode === 'auto' && policy.allowFallback === true)
                routes.push(primary === 'jev' ? 'laya' : 'jev');
            for (let index = 0; index < routes.length; index++) {
                const provider = routes[index]!, startTime = this.ports.now();
                requireThat(Number.isFinite(startTime) && startTime >= 0, 'DECISION_CLOCK');
                const b = qualify(policy, request, provider, startTime), backend = this.ports.backends[provider];
                requireThat(backend && backend.provider === provider && backend.model === b.model, 'DECISION_BACKEND_MISMATCH');
                await wait(this.ports.security.assertCurrent(request, policy, provider, 'before_dispatch'));
                const start = freeze({ attemptId: await wait(digestProposal([request.binding.identity.tenantId, request.binding.identity.deviceId, request.requestId, requestDigest, provider, index])), requestId: request.requestId, requestDigest, binding: request.binding, purpose: request.purpose, templateVersion: request.templateVersion, language: request.language, provider, model: b.model, credentialRevision: b.credentialRevision, qualificationRef: b.qualification.evidenceRef, startedAtMs: startTime });
                const reserved = await wait(this.ports.journal.reserve(start));
                if (reserved !== 'reserved') {
                    const code = reserved === 'duplicate' ? 'DECISION_DUPLICATE' : reserved === 'circuit_open' ? 'DECISION_CIRCUIT_OPEN' : 'DECISION_BUDGET_EXCEEDED';
                    if (code === 'DECISION_CIRCUIT_OPEN' && index + 1 < routes.length && policy.fallbackOn.includes(code))
                        continue;
                    return fail(code);
                }
                let value: EvaluationResult | undefined, code = 'EVALUATED';
                let outcome: AttemptReceipt['outcome'] = 'evaluated';
                let usage = usageFrom(null);
                const controller = new AbortController(), abort = () => controller.abort();
                signal.addEventListener('abort', abort, { once: true });
                if (signal.aborted)
                    abort();
                try {
                    // Budget reservation can race with revocation or credential rotation.
                    await wait(this.ports.security.assertCurrent(request, policy, provider, 'before_dispatch'));
                    const attemptBudget = index + 1 < routes.length ? Math.max(1, Math.floor(left() * 0.65)) : left();
                    const raw = await wait(within(backend.evaluate(request.evaluation, controller.signal, attemptBudget), controller.signal, attemptBudget));
                    usage = raw.usage;
                    // Revalidate normalized custom/Laya adapters against the exact requested semantics.
                    value = validateEvaluation({ model: raw.model, answers: raw.answers, usage: { input_tokens: raw.usage.inputTokens, output_tokens: raw.usage.outputTokens } }, request.evaluation, b.model);
                    await wait(this.ports.security.assertCurrent(request, policy, provider, 'after_response'));
                }
                catch (e) {
                    code = safe(e);
                    outcome = code === 'DECISION_CANCELLED' ? 'cancelled' : code.includes('STALE') || code.includes('REVOK') ? 'stale' : 'failed';
                    if (e instanceof DecisionFailure && (usage.quality === 'unknown' || e.observedUsage.quality !== 'unknown'))
                        usage = e.observedUsage;
                }
                finally {
                    controller.abort();
                    signal.removeEventListener('abort', abort);
                }
                const finished = this.ports.now();
                requireThat(Number.isFinite(finished) && finished >= startTime, 'DECISION_CLOCK');
                const receipt: AttemptReceipt = freeze({ ...start, outcome, code, usage, finishedAtMs: finished, latencyMs: finished - startTime });
                attempts.push(receipt);
                // Separate bounded accounting drain even after task cancellation. No raw content.
                try {
                    await within(this.ports.journal.settle(receipt), new AbortController().signal, 2000);
                }
                catch {
                    return fail('DECISION_ACCOUNTING_PENDING');
                }
                if (code !== 'EVALUATED') {
                    if (!signal.aborted && transient.has(code) && index + 1 < routes.length && policy.fallbackOn.includes(code))
                        continue;
                    return fail(code);
                }
                requireThat(value, 'DECISION_EMPTY_RESULT');
                await wait(this.ports.security.assertCurrent(request, policy, provider, 'before_return'));
                requireThat(!signal.aborted, 'DECISION_CANCELLED');
                return freeze({ status: 'evaluated', requestId: request.requestId, requestDigest, binding: request.binding, provider, model: b.model, qualificationRef: b.qualification.evidenceRef, thresholds: b.qualification.thresholds, evaluation: value, attempts: [...attempts] });
            }
            return fail('DECISION_UNAVAILABLE');
        }
        catch (e) {
            return fail(safe(e));
        }
    }
}
/** Pure read-model. A stored key alone never renders Ready. Poll current server state. */
export function decisionReadiness(facts: {
    entitled: boolean;
    enabled: boolean;
    keyStored: boolean;
    privacyApproved: boolean;
    profileQualified: boolean;
    probe: 'never' | 'passed' | 'failed';
    probeFresh: boolean;
    healthy: boolean;
}): 'not_entitled' | 'disabled' | 'unconfigured' | 'privacy_blocked' | 'unqualified' | 'checking' | 'degraded' | 'ready' {
    if (!facts.entitled)
        return 'not_entitled';
    if (!facts.enabled)
        return 'disabled';
    if (!facts.keyStored)
        return 'unconfigured';
    if (!facts.privacyApproved)
        return 'privacy_blocked';
    if (!facts.profileQualified)
        return 'unqualified';
    if (facts.probe === 'never' || !facts.probeFresh)
        return 'checking';
    if (facts.probe === 'failed' || !facts.healthy)
        return 'degraded';
    return 'ready';
}
