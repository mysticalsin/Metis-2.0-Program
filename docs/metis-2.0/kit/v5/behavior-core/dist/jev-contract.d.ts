/** Original implementation of the documented TypeSafe System One wire contract.
 * Stricter Métis limits are intentional. This is not model qualification or authority.
 */
import { BoundaryError, type Json } from './authority.js';
export type DecisionProvider = 'jev' | 'laya';
export type ChoiceQuestion = Readonly<{
    type: 'choice';
    instructions: Json;
    criteria: Readonly<Record<string, Json>>;
}>;
export type ScoreQuestion = Readonly<{
    type: 'score';
    instructions: Json;
    criteria: readonly Json[];
}>;
export type NoulQuestion = Readonly<{
    type: 'noul';
    instructions: Json;
    criteria?: Readonly<{
        true: Json;
        false: Json;
    }>;
}>;
export type Question = ChoiceQuestion | ScoreQuestion | NoulQuestion;
export type Questions = Readonly<Record<string, Question>>;
export type Evaluation = Readonly<{
    state: Json;
    questions: Questions;
}>;
export type ChoiceAnswer = Readonly<{
    type: 'choice';
    choice: string;
    probabilities: Readonly<Record<string, number>>;
    confidence: number;
}>;
export type ScoreAnswer = Readonly<{
    type: 'score';
    score: number;
    probabilities: Readonly<Record<string, number>>;
    legend: Readonly<Record<string, Json>>;
    confidence: number;
}>;
export type NoulAnswer = Readonly<{
    type: 'noul';
    noul: number;
}>;
export type Answer = ChoiceAnswer | ScoreAnswer | NoulAnswer;
export type Usage = Readonly<{
    inputTokens: number | null;
    outputTokens: number | null;
    quality: 'known' | 'partial' | 'unknown';
}>;
export type EvaluationResult = Readonly<{
    model: string;
    answers: Readonly<Record<string, Answer>>;
    usage: Usage;
}>;
export declare const JEV_HTTP_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
/** Candidate pin verified in public docs, NOT a verified customer account/model readiness. */
export declare const DOCUMENTED_JEV_PIN = "jev-1.13.0";
export declare const MAX_REQUEST_BYTES = 65536;
export declare const MAX_RESPONSE_BYTES = 262144;
export declare const plain: (v: unknown) => v is Record<string, unknown>;
export declare function freeze<T>(v: T): T;
export declare const probability: (v: unknown) => v is number;
export declare function usageFrom(raw: unknown): Usage;
export declare function snapshotEvaluation(value: Evaluation): Evaluation;
/** Full response validation. Keys cannot invent actions; scores cannot invent numbers. */
export declare function validateEvaluation(raw: unknown, e: Evaluation, expectedModel: string): EvaluationResult;
export declare class DecisionFailure extends BoundaryError {
    readonly retryAfterMs: number | null;
    readonly observedUsage: Usage;
    constructor(code: string, retryAfterMs?: number | null, observedUsage?: Usage);
}
/** Always consume an eventual rejection, including after timeout or cancellation. */
export declare function within<T>(work: Promise<T>, signal: AbortSignal, ms: number): Promise<T>;
