/** Original implementation of the documented TypeSafe System One wire contract.
 * Stricter Métis limits are intentional. This is not model qualification or authority.
 */
import { BoundaryError, canonical, requireThat, type Json } from './authority.js';
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
export const JEV_HTTP_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
/** Candidate pin verified in public docs, NOT a verified customer account/model readiness. */
export const DOCUMENTED_JEV_PIN = 'jev-1.13.0';
export const MAX_REQUEST_BYTES = 65536;
export const MAX_RESPONSE_BYTES = 262144;
const tolerance = 0.001;
const textStructure = (v: unknown): boolean => typeof v === 'string' || Array.isArray(v) || plain(v);
export const plain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
export function freeze<T>(v: T): T { if (v && typeof v === 'object') {
    Object.freeze(v);
    for (const x of Object.values(v))
        freeze(x);
} return v; }
export const probability = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const key = (v: string) => /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
const sameKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));
const count = (v: unknown): number | null => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null;
export function usageFrom(raw: unknown): Usage {
    const x = plain(raw) ? raw : {};
    const inputTokens = count(x.input_tokens), outputTokens = count(x.output_tokens);
    return freeze({ inputTokens, outputTokens, quality: inputTokens === null && outputTokens === null ? 'unknown' : inputTokens === null || outputTokens === null ? 'partial' : 'known' });
}
export function snapshotEvaluation(value: Evaluation): Evaluation {
    // canonical rejects accessors, prototype pollution, cycles/deep objects and non-JSON values.
    const text = canonical(value);
    requireThat(new TextEncoder().encode(text).length <= MAX_REQUEST_BYTES - 256, 'DECISION_REQUEST_TOO_LARGE');
    const e = JSON.parse(text) as Evaluation;
    requireThat(plain(e) && sameKeys(e as unknown as Record<string, unknown>, ['state', 'questions']), 'DECISION_REQUEST_SHAPE');
    requireThat(typeof e.state === 'string' || Array.isArray(e.state) || plain(e.state), 'DECISION_STATE_TYPE');
    requireThat(plain(e.questions), 'DECISION_QUESTIONS');
    const names = Object.keys(e.questions);
    requireThat(names.length > 0 && names.length <= 16 && names.every(key), 'DECISION_QUESTION_LIMIT');
    for (const q of Object.values(e.questions)) {
        requireThat(plain(q) && Object.hasOwn(q, 'instructions') && textStructure(q.instructions), 'DECISION_INSTRUCTIONS');
        requireThat(['choice', 'score', 'noul'].includes(q.type), 'DECISION_QUESTION_TYPE');
        requireThat(Object.keys(q).every(k => ['type', 'instructions', 'criteria'].includes(k)), 'DECISION_QUESTION_FIELDS');
        if (q.type === 'choice') {
            requireThat(plain(q.criteria) && Object.values(q.criteria).every(v => v === null || textStructure(v)), 'DECISION_CRITERIA');
            const keys = Object.keys(q.criteria);
            // 64 is a conservative local policy; vendor permits up to 255.
            requireThat(keys.length >= 2 && keys.length <= 64 && keys.every(key), 'DECISION_CHOICE_LIMIT');
        }
        else if (q.type === 'score') {
            requireThat(Array.isArray(q.criteria) && q.criteria.length >= 2 && q.criteria.length <= 10 && q.criteria.every(x => typeof x === 'string'), 'DECISION_SCORE_LIMIT');
        }
        else if (q.criteria !== undefined) {
            requireThat(plain(q.criteria) && sameKeys(q.criteria, ['true', 'false']) && Object.values(q.criteria).every(textStructure), 'DECISION_NOUL_CRITERIA');
        }
    }
    return freeze(e);
}
function distribution(value: unknown, keys: readonly string[]): Readonly<Record<string, number>> {
    requireThat(plain(value) && sameKeys(value, keys), 'DECISION_PROBABILITY_KEYS');
    const numbers = Object.values(value);
    requireThat(numbers.every(probability), 'DECISION_PROBABILITY_RANGE');
    requireThat(Math.abs(numbers.reduce((a, b) => a + b, 0) - 1) <= tolerance, 'DECISION_PROBABILITY_SUM');
    return value as Record<string, number>;
}
/** Full response validation. Keys cannot invent actions; scores cannot invent numbers. */
export function validateEvaluation(raw: unknown, e: Evaluation, expectedModel: string): EvaluationResult {
    requireThat(plain(raw), 'DECISION_RESPONSE_SHAPE');
    requireThat(raw.model === expectedModel, 'DECISION_MODEL_DRIFT');
    requireThat(plain(raw.answers) && sameKeys(raw.answers, Object.keys(e.questions)), 'DECISION_ANSWER_KEYS');
    const answers: Record<string, Answer> = Object.create(null);
    for (const [qid, q] of Object.entries(e.questions)) {
        const a = raw.answers[qid];
        requireThat(plain(a) && a.type === q.type, 'DECISION_ANSWER_TYPE');
        if (q.type === 'choice') {
            requireThat(typeof a.choice === 'string' && Object.hasOwn(q.criteria, a.choice), 'DECISION_UNKNOWN_CHOICE');
            const probabilities = distribution(a.probabilities, Object.keys(q.criteria));
            requireThat(probability(a.confidence), 'DECISION_CONFIDENCE_MISSING_OR_INVALID');
            requireThat(probabilities[a.choice]! + tolerance >= Math.max(...Object.values(probabilities)), 'DECISION_NOT_ARGMAX');
            answers[qid] = { type: 'choice', choice: a.choice, probabilities, confidence: a.confidence };
        }
        else if (q.type === 'score') {
            const keys = q.criteria.map((_, i) => String(i));
            const probabilities = distribution(a.probabilities, keys);
            requireThat(plain(a.legend) && sameKeys(a.legend, keys) && keys.every(k => canonical((a.legend as Record<string, unknown>)[k]) === canonical(q.criteria[Number(k)])), 'DECISION_LEGEND_MISMATCH');
            const expected = keys.reduce((n, k) => n + Number(k) * probabilities[k]!, 0);
            requireThat(typeof a.score === 'number' && Number.isFinite(a.score) && a.score >= 0 && a.score <= keys.length - 1 && Math.abs(a.score - expected) <= 0.01, 'DECISION_SCORE_INCONSISTENT');
            requireThat(probability(a.confidence), 'DECISION_CONFIDENCE_MISSING_OR_INVALID');
            answers[qid] = { type: 'score', score: a.score, probabilities, legend: a.legend as Record<string, Json>, confidence: a.confidence };
        }
        else {
            requireThat(probability(a.noul), 'DECISION_NOUL_RANGE');
            // Noul has a yes-probability, NOT a vendor confidence. Never manufacture one.
            requireThat(!Object.hasOwn(a, 'confidence'), 'DECISION_NOUL_CONFIDENCE_FORBIDDEN');
            answers[qid] = { type: 'noul', noul: a.noul };
        }
    }
    return freeze({ model: expectedModel, answers, usage: usageFrom(raw.usage) });
}
export class DecisionFailure extends BoundaryError {
    constructor(code: string, public readonly retryAfterMs: number | null = null, public readonly observedUsage: Usage = usageFrom(null)) { super(code); }
}
/** Always consume an eventual rejection, including after timeout or cancellation. */
export async function within<T>(work: Promise<T>, signal: AbortSignal, ms: number): Promise<T> {
    requireThat(Number.isFinite(ms) && ms > 0 && ms <= 30000, 'DECISION_DEADLINE');
    return new Promise<T>((resolve, reject) => {
        let done = false;
        const settle = (ok: boolean, value: unknown) => { if (done)
            return; done = true; clearTimeout(timer); signal.removeEventListener('abort', abort); ok ? resolve(value as T) : reject(value); };
        const abort = () => settle(false, new DecisionFailure('DECISION_CANCELLED'));
        const timer = setTimeout(() => settle(false, new DecisionFailure('DECISION_TIMEOUT')), ms);
        work.then(v => settle(true, v), e => settle(false, e));
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted)
            abort();
    });
}
