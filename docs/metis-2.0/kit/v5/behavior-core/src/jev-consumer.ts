/** Trusted-host consumers: actually use bounded choices, but never let a provider
 * create arguments, grants, approvals, receipt proofs, or new execution routes.
 */
import { BoundaryError, canonical, digestProposal, requireThat, type BehaviorAuthority, type ScopeGrant, type Proposal, type ExactApproval } from './authority.js';
import { executeVerifiedOperation, type Receipt, type ActionPort, type OperationJournal } from './coordinator.js';
import type { NativeInputLeaseBroker } from './native-lease.js';
import { freeze, within, type ChoiceAnswer, type ScoreAnswer, type NoulAnswer } from './jev-contract.js';
import type { DecisionBinding, DecisionClient, DecisionRequest, DecisionResult } from './jev-service.js';
import { acceptedChoice, actionTemplate, knowledgeTemplate, interactionTemplate, skillTemplate, classifyEvidence, CLARIFY, TEMPLATE_VERSIONS } from './jev-templates.js';
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
export async function executeWithDecision(options: {
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
}): Promise<ActionDecisionOutcome> {
    const { authority: a, grant: g } = options;
    try {
        // Snapshot candidate metadata and preserve host-minted opaque proposal identity.
        const candidates = Object.freeze(options.candidates.map(x => Object.freeze({ ...x })));
        requireThat(candidates.length > 0 && candidates.length <= 31 && new Set(candidates.map(c => c.id)).size === candidates.length, 'DECISION_CANDIDATES_INVALID');
        candidates.forEach(c => a.check(c.proposal, g));
        const execute = async (p: Proposal) => executeVerifiedOperation({ authority: a, grant: g, proposal: p, port: options.port, journal: options.journal, inputBroker: options.inputBroker, ...(options.approval ? { approval: options.approval } : {}), ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}) });
        if (options.deterministicCandidateId) {
            const c = candidates.find(c => c.id === options.deterministicCandidateId);
            requireThat(c, 'DETERMINISTIC_TARGET_NOT_FOUND');
            // The existing independent literal/source intent matcher still runs in execute.
            return freeze({ status: 'executed', selection: 'deterministic', receipt: await execute(c.proposal) });
        }
        const signal = a.signal;
        const binding = freeze({ identity: a.binding, inputRevision: g.inputRevision, authorityEpoch: g.epoch, contextRevision: options.contextRevision, policyRevision: options.policyRevision });
        const request: DecisionRequest = freeze({ requestId: options.requestId, binding, source: options.source, final: true, purpose: 'action-selection', templateVersion: TEMPLATE_VERSIONS.action, language: options.language, candidateCount: candidates.length + 1, candidateSetDigest: await digestProposal(candidates.map(c => [c.id, c.proposal.digest])), dataClass: options.dataClass, evaluation: actionTemplate(options.utterance, candidates) });
        const expectedDigest = await digestProposal(request);
        requireThat(!signal.aborted, 'DECISION_CANCELLED');
        candidates.forEach(c => a.check(c.proposal, g));
        const result = await options.client.evaluate(request, signal);
        requireThat(!signal.aborted, 'DECISION_CANCELLED');
        candidates.forEach(c => a.check(c.proposal, g));
        if (result.status !== 'evaluated')
            return freeze({ status: 'blocked', code: result.code });
        requireThat(result.requestId === request.requestId && result.requestDigest === expectedDigest && canonical(result.binding) === canonical(binding), 'DECISION_RESPONSE_BINDING');
        const answer = result.evaluation.answers.action;
        requireThat(answer?.type === 'choice', 'DECISION_ACTION_ANSWER');
        // Trust only response structures validated by authenticated Operator client.
        if (answer.choice === CLARIFY || !acceptedChoice(answer, result.thresholds))
            return freeze({ status: 'needs_clarification', code: 'DECISION_UNCERTAIN' });
        const selected = candidates.find(c => c.id === answer.choice);
        requireThat(selected, 'DECISION_UNKNOWN_CHOICE');
        const decision: ConsumptionReceipt = freeze({ requestDigest: result.requestDigest, proposalDigest: selected.proposal.digest, provider: result.provider, model: result.model, qualificationRef: result.qualificationRef, binding });
        await within(options.recordConsumption(decision), signal, 2000);
        requireThat(!signal.aborted, 'DECISION_CANCELLED');
        a.check(selected.proposal, g);
        // No `void result`: select exactly the pre-existing proposal, then independently
        // match intent, re-observe target, approve, dispatch, verify and settle as before.
        return freeze({ status: 'executed', selection: result.provider, decision, receipt: await execute(selected.proposal) });
    }
    catch (e) {
        return freeze({ status: 'blocked', code: e instanceof BoundaryError ? e.code : 'DECISION_CONSUMER_ERROR' });
    }
}
/** Canonical knowledge owns access + revision. This is not a memory write or proof. */
export async function annotateKnowledge(options: {
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
}>> {
    try {
        requireThat(!options.signal.aborted, 'DECISION_CANCELLED');
        const sources = freeze(options.sources.map(s => ({ ...s })));
        await within(options.assertSourcesCurrent(), options.signal, 2000);
        requireThat(!options.signal.aborted, 'DECISION_CANCELLED');
        const request: DecisionRequest = freeze({ requestId: options.requestId, binding: options.binding, source: 'approved-canonical', final: true, purpose: 'knowledge-triage', templateVersion: TEMPLATE_VERSIONS.knowledge, language: options.language, candidateCount: Math.max(3, sources.length), candidateSetDigest: await digestProposal(sources), dataClass: options.dataClass, evaluation: knowledgeTemplate(options.query, sources) });
        const digest = await digestProposal(request), result = await options.client.evaluate(request, options.signal);
        await within(options.assertSourcesCurrent(), options.signal, 2000);
        requireThat(!options.signal.aborted, 'DECISION_CANCELLED');
        if (result.status !== 'evaluated')
            return freeze({ status: 'blocked', code: result.code });
        requireThat(result.requestDigest === digest && result.requestId === request.requestId && canonical(result.binding) === canonical(request.binding), 'DECISION_RESPONSE_BINDING');
        const a = result.evaluation.answers;
        requireThat(a.relevance?.type === 'score' && a.conflict?.type === 'noul' && a.actionability?.type === 'choice', 'DECISION_KNOWLEDGE_ANSWERS');
        return freeze({ status: 'annotated', label: classifyEvidence({ relevance: a.relevance as ScoreAnswer, conflict: a.conflict as NoulAnswer, actionability: a.actionability as ChoiceAnswer }, result.thresholds), provider: result.provider, model: result.model, sourceRefs: sources.map(({ ref, revision }) => ({ ref, revision })), decision: result });
    }
    catch (e) {
        return freeze({ status: 'blocked', code: e instanceof BoundaryError ? e.code : 'DECISION_KNOWLEDGE_ERROR' });
    }
}
/** Bounded read-only hint. Even a 'do' classification cannot mint a task grant.
 * Existing explicit Stop/status/speech controls and deterministic intent routes run first.
 * Skill eligibility is derived by the host and rechecked before this result is released.
 */
export async function recommendInteractionOrSkill(options: {
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
}>> {
    try {
        requireThat(!options.signal.aborted, 'DECISION_CANCELLED');
        const binding = freeze(JSON.parse(canonical(options.binding)) as DecisionBinding);
        const items = freeze((options.eligibleSkills ?? []).map(x => ({ ...x })));
        const evaluation = options.purpose === 'interaction-intent' ? interactionTemplate(options.utterance) : skillTemplate(options.utterance, items);
        const questionId = options.purpose === 'interaction-intent' ? 'intent' : 'skill';
        const q = evaluation.questions[questionId];
        requireThat(q?.type === 'choice', 'DECISION_HINT_QUESTION');
        await within(options.assertEligibleCurrent(), options.signal, 2000);
        const request: DecisionRequest = freeze({ requestId: options.requestId, binding, source: options.source, final: true, purpose: options.purpose, templateVersion: options.purpose === 'interaction-intent' ? TEMPLATE_VERSIONS.intent : TEMPLATE_VERSIONS.skill, language: options.language, candidateCount: Object.keys(q.criteria).length, candidateSetDigest: await digestProposal(q.criteria), dataClass: options.dataClass, evaluation });
        const requestDigest = await digestProposal(request);
        const result = await options.client.evaluate(request, options.signal);
        await within(options.assertEligibleCurrent(), options.signal, 2000);
        requireThat(!options.signal.aborted, 'DECISION_CANCELLED');
        if (result.status !== 'evaluated')
            return freeze({ status: 'blocked', code: result.code });
        requireThat(result.requestId === request.requestId && result.requestDigest === requestDigest && canonical(result.binding) === canonical(binding), 'DECISION_RESPONSE_BINDING');
        const answer = result.evaluation.answers[questionId];
        requireThat(answer?.type === 'choice' && Object.hasOwn(q.criteria, answer.choice), 'DECISION_HINT_ANSWER');
        if (answer.choice === CLARIFY || !acceptedChoice(answer, result.thresholds))
            return freeze({ status: 'needs_clarification', code: 'DECISION_UNCERTAIN' });
        // No execute callback, no grant API, no arbitrary tool download in this consumer.
        return freeze({ status: 'recommended', choice: answer.choice, provider: result.provider, model: result.model, requestDigest });
    }
    catch (e) {
        return freeze({ status: 'blocked', code: e instanceof BoundaryError ? e.code : 'DECISION_HINT_ERROR' });
    }
}
