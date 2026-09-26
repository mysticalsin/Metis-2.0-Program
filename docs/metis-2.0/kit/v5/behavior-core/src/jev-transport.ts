/** SERVER ONLY: the desktop calls the authenticated Operator, never this vendor client.
 * No SDK retries, custom origins, credential redirects, raw body logging or hidden fallback.
 */
import { BoundaryError, requireThat } from './authority.js';
import { DecisionFailure, JEV_HTTP_ENDPOINT, MAX_REQUEST_BYTES, MAX_RESPONSE_BYTES, snapshotEvaluation, usageFrom, validateEvaluation, within, type Evaluation, type EvaluationResult } from './jev-contract.js';
export interface DecisionBackend {
    readonly provider: 'jev' | 'laya';
    readonly model: string;
    evaluate(evaluation: Evaluation, signal: AbortSignal, timeoutMs: number): Promise<EvaluationResult>;
}
const safeCode = (e: unknown) => e instanceof BoundaryError ? e.code : 'DECISION_TRANSPORT_ERROR';
async function readJson(response: Response, signal: AbortSignal): Promise<unknown> {
    requireThat(/^application\/(?:json|[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(response.headers.get('content-type') ?? ''), 'DECISION_CONTENT_TYPE');
    const declared = response.headers.get('content-length');
    requireThat(declared === null || (/^\d+$/.test(declared) && Number(declared) <= MAX_RESPONSE_BYTES), 'DECISION_RESPONSE_TOO_LARGE');
    requireThat(response.body, 'DECISION_EMPTY_BODY');
    const reader = response.body.getReader(), chunks: Uint8Array[] = [];
    let total = 0, complete = false;
    const abort = () => { void reader.cancel().catch(() => { }); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted)
        abort();
    try {
        for (;;) {
            const next = await reader.read();
            if (next.done) {
                complete = true;
                break;
            }
            total += next.value.byteLength;
            requireThat(total <= MAX_RESPONSE_BYTES, 'DECISION_RESPONSE_TOO_LARGE');
            chunks.push(next.value);
        }
        const bytes = new Uint8Array(total);
        let at = 0;
        for (const c of chunks) {
            bytes.set(c, at);
            at += c.byteLength;
        }
        try {
            return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        }
        catch {
            throw new DecisionFailure('DECISION_INVALID_JSON');
        }
    }
    finally {
        signal.removeEventListener('abort', abort);
        if (!complete)
            void reader.cancel().catch(() => { });
        reader.releaseLock();
    }
}
export function createJevBackend(options: {
    model: string;
    readServerSecret: () => Promise<string>;
    fetchImpl?: typeof fetch;
}): DecisionBackend {
    requireThat(typeof window === 'undefined', 'JEV_SERVER_ONLY');
    requireThat(/^jev-\d+\.\d+\.\d+$/.test(options.model), 'JEV_PIN_REQUIRED');
    const model = options.model, fetcher = options.fetchImpl ?? fetch;
    return Object.freeze({ provider: 'jev' as const, model,
        async evaluate(input: Evaluation, caller: AbortSignal, timeoutMs: number): Promise<EvaluationResult> {
            requireThat(!caller.aborted, 'DECISION_CANCELLED');
            const e = snapshotEvaluation(input), body = JSON.stringify({ ...e, model });
            requireThat(new TextEncoder().encode(body).length <= MAX_REQUEST_BYTES, 'DECISION_REQUEST_TOO_LARGE');
            const controller = new AbortController();
            const abort = () => controller.abort();
            caller.addEventListener('abort', abort, { once: true });
            if (caller.aborted)
                abort();
            let response: Response | undefined, raw: unknown;
            const work = (async () => {
                const token = await options.readServerSecret();
                requireThat(!controller.signal.aborted, 'DECISION_CANCELLED');
                requireThat(typeof token === 'string' && token.length >= 8 && token.length <= 8192 && !/[\r\n\s]/.test(token), 'JEV_SECRET_UNAVAILABLE');
                response = await fetcher(JEV_HTTP_ENDPOINT, { method: 'POST', redirect: 'error', cache: 'no-store', credentials: 'omit', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body, signal: controller.signal });
                if (controller.signal.aborted) {
                    void response.body?.cancel().catch(() => { });
                    throw new DecisionFailure('DECISION_CANCELLED');
                }
                requireThat(!response.redirected && (!response.url || response.url === JEV_HTTP_ENDPOINT), 'DECISION_REDIRECT_REFUSED');
                if (!response.ok) {
                    const s = response.status, header = response.headers.get('retry-after'), seconds = header && /^\d+(?:\.\d+)?$/.test(header) ? Number(header) : null;
                    const retry = seconds !== null && Number.isFinite(seconds) ? Math.min(seconds * 1000, 60000) : null;
                    const code = s === 401 || s === 403 ? 'JEV_CREDENTIAL_REJECTED' : s === 429 ? 'DECISION_RATE_LIMITED' : s === 529 ? 'DECISION_OVERLOADED' : s === 422 ? 'DECISION_REQUEST_REJECTED' : s === 404 ? 'JEV_MODEL_UNAVAILABLE' : 'DECISION_UPSTREAM_ERROR';
                    void response.body?.cancel().catch(() => { });
                    throw new DecisionFailure(code, retry);
                }
                raw = await readJson(response, controller.signal);
                return validateEvaluation(raw, e, model);
            })();
            try {
                return await within(work, caller, timeoutMs);
            }
            catch (e) {
                const usage = raw && typeof raw === 'object' && 'usage' in raw ? usageFrom(raw.usage) : usageFrom(null);
                if (e instanceof DecisionFailure)
                    throw e;
                throw new DecisionFailure(safeCode(e), null, usage);
            }
            finally {
                controller.abort();
                caller.removeEventListener('abort', abort);
                if (response && !response.bodyUsed)
                    void response.body?.cancel().catch(() => { });
            }
        }
    });
}
