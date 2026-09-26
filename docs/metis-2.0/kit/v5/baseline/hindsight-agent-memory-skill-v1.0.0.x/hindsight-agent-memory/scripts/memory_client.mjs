/** Fixed-bank Hindsight reference client. Server-side only; not an ACL implementation.
 * User identity/source policy is supplied by the host. No automatic retries.
 */
export class MemoryFailure extends Error {
  constructor(code, { status = null, unknownWrite = false } = {}) {
    super(`${code}${status === null ? '' : ` (HTTP ${status})`}`);
    this.name = 'MemoryFailure'; this.code = code;
    this.status = status; this.unknownWrite = unknownWrite;
  }
}
const encoder = new TextEncoder();
const safeId = value => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$/.test(value))
    throw new TypeError('ID must be 1-200 safe ASCII characters starting with a letter or digit');
  return value;
};
const boundedText = (value, name, maximum) => {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum)
    throw new TypeError(`${name} must be nonempty bounded text`);
  return value;
};
const posInt = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${name} must be a positive integer`);
  return value;
};
const uuid = value => {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value))
    throw new TypeError('operationId must be a UUID');
  return value.toLowerCase();
};
export class MemoryClient {
  #origin; #bank; #tags; #key; #fetch; #limits; #reflect; #op; #append;
  constructor({ baseUrl, apiKey, bankId, scopeTags, allowReflect = false,
    supportsOperationId = false, supportsAppend = false, fetchImpl = globalThis.fetch, limits = {} }) {
    if (typeof baseUrl !== 'string' || /\s/.test(baseUrl)) throw new TypeError('trusted origin URL required');
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.search || url.hash || !['', '/'].includes(url.pathname))
      throw new TypeError('baseUrl must be an HTTP(S) origin without credentials or extra path/query');
    if (url.protocol === 'http:' && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
      throw new TypeError('non-loopback endpoints require HTTPS');
    if (typeof apiKey !== 'string' || !/^[\x21-\x7e]+$/.test(apiKey))
      throw new TypeError('apiKey must be a nonempty printable token without whitespace');
    if (!Array.isArray(scopeTags) || scopeTags.length < 1 || scopeTags.length > 16 ||
        new Set(scopeTags).size !== scopeTags.length) throw new TypeError('nonempty unique scopeTags required');
    for (const tag of scopeTags) {
      boundedText(tag, 'scope tag', 128);
      if (tag !== tag.trim()) throw new TypeError('scope tags cannot have leading/trailing whitespace');
    }
    for (const flag of [allowReflect, supportsOperationId, supportsAppend])
      if (typeof flag !== 'boolean') throw new TypeError('capability flags must be boolean');
    if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation required');
    this.#origin = url.origin; this.#bank = safeId(bankId); this.#key = apiKey;
    this.#tags = Object.freeze([...scopeTags]); this.#fetch = fetchImpl;
    this.#reflect = allowReflect; this.#op = supportsOperationId; this.#append = supportsAppend;
    const allowed = ['timeoutMs', 'requestBytes', 'responseBytes', 'queryChars', 'recallTokens', 'reflectTokens'];
    if (Object.keys(limits).some(k => !allowed.includes(k))) throw new TypeError('unknown limit');
    this.#limits = Object.freeze({ timeoutMs: 20000, requestBytes: 65536, responseBytes: 524288,
      queryChars: 8000, recallTokens: 2000, reflectTokens: 2000, ...limits });
    for (const [key, value] of Object.entries(this.#limits)) posInt(value, key);
  }
  async #call(method, suffix, payload = undefined, { mutation = false, globalPath = false } = {}) {
    const body = payload === undefined ? undefined : JSON.stringify(payload);
    if (body !== undefined && encoder.encode(body).length > this.#limits.requestBytes)
      throw new RangeError('request size bound exceeded before sending');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#limits.timeoutMs);
    let reader;
    try {
      const response = await this.#fetch(this.#origin + (globalPath ? suffix :
        `/v1/default/banks/${this.#bank}${suffix}`), {
        method, redirect: 'error', signal: controller.signal,
        headers: { Accept: 'application/json', Authorization: `Bearer ${this.#key}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body,
      });
      if ([401, 403].includes(response.status)) throw new MemoryFailure('access_denied', { status: response.status });
      if ([400, 404, 405, 409, 410, 413, 415, 422].includes(response.status))
        throw new MemoryFailure('request_rejected', { status: response.status });
      if (!response.ok) throw new MemoryFailure('redirect_or_service_failure', {
        status: response.status, unknownWrite: mutation });
      const declared = response.headers.get('content-length');
      if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > this.#limits.responseBytes))
        throw new MemoryFailure('response_size_bound_exceeded', { unknownWrite: mutation });
      if (response.status === 204 && !response.body) return {};
      if ((response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase() !== 'application/json')
        throw new MemoryFailure('unexpected_content_type', { unknownWrite: mutation });
      const chunks = []; let total = 0;
      if (response.body) {
        reader = response.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > this.#limits.responseBytes)
            throw new MemoryFailure('response_size_bound_exceeded', { unknownWrite: mutation });
          chunks.push(value);
        }
      }
      const bytes = new Uint8Array(total); let at = 0;
      for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.byteLength; }
      let data;
      try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
      catch { throw new MemoryFailure('invalid_json_response', { unknownWrite: mutation }); }
      if (data === null || typeof data !== 'object' || Array.isArray(data))
        throw new MemoryFailure('response_must_be_an_object', { unknownWrite: mutation });
      return data;
    } catch (error) {
      if (error instanceof MemoryFailure) throw error;
      throw new MemoryFailure('transport_or_response_failure', { unknownWrite: mutation });
    } finally {
      clearTimeout(timer);
      controller.abort(); // close any response we rejected without consuming
      if (reader) { try { await reader.cancel(); } catch {} }
    }
  }
  #budget(maxTokens, budget, maximum) {
    posInt(maxTokens, 'maxTokens');
    if (maxTokens > maximum || !['low', 'mid', 'high'].includes(budget))
      throw new RangeError('invalid or excessive budget');
  }
  version() { return this.#call('GET', '/version', undefined, { globalPath: true }); }
  retain({ content, documentId, timestamp, context, metadata = {}, async: asynchronous = false,
    operationId, updateMode = 'replace' }) {
    if (typeof asynchronous !== 'boolean') throw new TypeError('async must be boolean');
    if (typeof timestamp !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) ||
        !timestamp.includes('T') || !Number.isFinite(Date.parse(timestamp)))
      throw new TypeError('timestamp must be explicit timezone-aware ISO 8601');
    if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata) ||
        Object.keys(metadata).length > 20 || Object.entries(metadata).some(([k, v]) =>
          !k || k.length > 128 || typeof v !== 'string' || v.length > 2000))
      throw new TypeError('metadata must have at most 20 bounded string pairs');
    const item = { content: boundedText(content, 'content', this.#limits.requestBytes),
      document_id: safeId(documentId), timestamp, context: boundedText(context, 'context', 4000),
      tags: [...this.#tags], ...(Object.keys(metadata).length ? { metadata: { ...metadata } } : {}) };
    if (!['replace', 'append'].includes(updateMode)) throw new TypeError('unsupported updateMode');
    if (updateMode === 'append') {
      if (!this.#append) throw new TypeError('append capability must be verified before enabling');
      item.update_mode = 'append';
    }
    const payload = { items: [item], async: asynchronous };
    if (operationId !== undefined) {
      if (!asynchronous || !this.#op) throw new TypeError('operationId needs async and verified capability');
      payload.operation_id = uuid(operationId);
    }
    return this.#call('POST', '/memories', payload, { mutation: true });
  }
  recall(query, { maxTokens = 1500, budget = 'low' } = {}) {
    this.#budget(maxTokens, budget, this.#limits.recallTokens);
    return this.#call('POST', '/memories/recall', {
      query: boundedText(query, 'query', this.#limits.queryChars), max_tokens: maxTokens, budget,
      types: ['world', 'experience'], tags: [...this.#tags], tags_match: 'all_strict' });
  }
  reflect(query, { maxTokens = 1000, budget = 'low' } = {}) {
    if (!this.#reflect) throw new TypeError('reflect requires explicit scope and cost opt-in');
    this.#budget(maxTokens, budget, this.#limits.reflectTokens);
    return this.#call('POST', '/reflect', {
      query: boundedText(query, 'query', this.#limits.queryChars), max_tokens: maxTokens, budget,
      tags: [...this.#tags], tags_match: 'all_strict' });
  }
  document(documentId) { return this.#call('GET', `/documents/${safeId(documentId)}`); }
  operation(operationId) { return this.#call('GET', `/operations/${safeId(operationId)}`); }
  deleteDocument(documentId, { confirmDocumentId } = {}) {
    if (documentId !== confirmDocumentId) throw new TypeError('confirm the exact document to delete');
    return this.#call('DELETE', `/documents/${safeId(documentId)}`, undefined, { mutation: true });
  }
}
