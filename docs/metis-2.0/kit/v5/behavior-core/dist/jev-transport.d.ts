import { type Evaluation, type EvaluationResult } from './jev-contract.js';
export interface DecisionBackend {
    readonly provider: 'jev' | 'laya';
    readonly model: string;
    evaluate(evaluation: Evaluation, signal: AbortSignal, timeoutMs: number): Promise<EvaluationResult>;
}
export declare function createJevBackend(options: {
    model: string;
    readServerSecret: () => Promise<string>;
    fetchImpl?: typeof fetch;
}): DecisionBackend;
