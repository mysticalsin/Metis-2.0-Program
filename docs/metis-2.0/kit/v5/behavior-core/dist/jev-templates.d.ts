import { type Evaluation, type ChoiceAnswer, type ScoreAnswer, type NoulAnswer } from './jev-contract.js';
import type { Thresholds } from './jev-service.js';
export declare const TEMPLATE_VERSIONS: {
    readonly action: "metis.action-selection.v1";
    readonly intent: "metis.interaction-intent.v1";
    readonly skill: "metis.skill-selection.v1";
    readonly knowledge: "metis.knowledge-triage.v1";
};
export declare const CLARIFY = "needs_clarification";
export type CandidateDescription = Readonly<{
    id: string;
    label: string;
}>;
export declare function actionTemplate(utterance: string, items: readonly CandidateDescription[]): Evaluation;
export declare function interactionTemplate(utterance: string): Evaluation;
export declare function skillTemplate(utterance: string, items: readonly CandidateDescription[]): Evaluation;
export declare function knowledgeTemplate(query: string, sources: readonly {
    ref: string;
    revision: string;
    excerpt: string;
}[]): Evaluation;
export declare function acceptedChoice(answer: ChoiceAnswer, t: Thresholds): boolean;
/** Suggestions only: a threshold is neither calibrated accuracy nor canonical truth. */
export declare function classifyEvidence(a: {
    relevance: ScoreAnswer;
    conflict: NoulAnswer;
    actionability: ChoiceAnswer;
}, t: Thresholds): 'review_conflict' | 'candidate_evidence' | 'insufficient_or_uncertain';
