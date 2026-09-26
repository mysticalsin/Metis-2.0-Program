/**
 * Executable policy/orchestration component. The supplied authority and repository MUST
 * be the actual Métis trusted services. Fixture implementations belong in tests only.
 * This file intentionally has no JWT verifier, cloud deployment, DB implementation or
 * model-as-security shortcut. Full adapter obligations are documented in BINDINGS.md.
 */
import { MemoryError, checkedId } from './hindsight-client.mjs';
const KINDS = new Set(['approved_summary', 'approved_preference', 'verified_action_receipt']);
function requireFunctions(target, names) {
  if (!target || names.some(n => typeof target[n] !== 'function')) throw new MemoryError('TRUSTED_BINDINGS_REQUIRED');
}
function safeGrant(g) {
  if (!g || !g.lease || g.homogeneousAcl !== true || g.state !== 'READY' || typeof g.epoch !== 'string' ||
    !Array.isArray(g.tags) || !g.tags.length) throw new MemoryError('SCOPE_NOT_READY');
  checkedId(g.bankId); return Object.freeze({ ...g, tags: Object.freeze([...g.tags]) });
}
/** Classification is not itself authorization; authority still binds each real principal. */
export function validateProjection(source, grant, expectedRevision) {
  if (!source || !KINDS.has(source.kind) || source.approved !== true || source.deleted ||
    source.allowMemory !== true || source.confidential || source.localOnly || source.revision !== expectedRevision ||
    source.aclEpoch !== grant.epoch || source.scopeId !== grant.scopeId || typeof source.content !== 'string' ||
    !source.content.trim() || !source.expiresAt || !Number.isFinite(Date.parse(source.expiresAt)) || Date.parse(source.expiresAt) <= Date.now())
    throw new MemoryError('SOURCE_NOT_ELIGIBLE');
  checkedId(source.id); checkedId(source.documentId);
  return source;
}
export class MetisMemoryGateway {
  #authority; #repo; #clientFor; #meter;
  constructor({ authority, repository, clientFor, meter }) {
    requireFunctions(authority, ['authorize', 'assertFresh']);
    requireFunctions(repository, ['withScopeLease', 'readCanonical', 'recordProjection', 'resolveEvidence',
      'blockSource', 'recordPurge', 'markReconciliation']);
    if (typeof clientFor !== 'function' || typeof meter !== 'function') throw new MemoryError('TRUSTED_BINDINGS_REQUIRED');
    this.#authority = authority; this.#repo = repository; this.#clientFor = clientFor; this.#meter = meter;
  }
  async #start(request, action) {
    checkedId(request.operationId); checkedId(request.scopeId);
    const grant = safeGrant(await this.#authority.authorize({ principal: request.principal, scopeId: request.scopeId,
      action, outputAudience: request.outputAudience, operationId: request.operationId }));
    if (grant.scopeId !== request.scopeId) throw new MemoryError('SCOPE_MISMATCH');
    return grant;
  }
  async #fresh(grant, request) {
    if (request.signal?.aborted) throw new MemoryError('CANCELLED');
    await this.#authority.assertFresh(grant.lease); // Must reject a stale/revoked epoch, never refresh silently.
  }
  async #attempt(grant, request, action, fn) {
    await this.#fresh(grant, request);
    let result;
    try { result = await fn(); }
    catch (e) {
      await this.#meter({ operationId: request.operationId, feature: `memory.${action}`, status: 'failed',
        usage: null, errorClass: e instanceof MemoryError ? e.code : 'INTERNAL_FAILURE' });
      throw e instanceof MemoryError ? e : new MemoryError('INTERNAL_FAILURE');
    }
    await this.#meter({ operationId: request.operationId, feature: `memory.${action}`, status: 'provider_completed',
      usage: result.usage ?? null, errorClass: null });
    // A metering error must be durably reconciled by the supplied ledger, not suppressed as zero cost.
    return result;
  }
  async retain(request) {
    const grant = await this.#start(request, 'retain'); checkedId(request.sourceId);
    return this.#repo.withScopeLease(grant, async () => {
      await this.#fresh(grant, request);
      const source = validateProjection(await this.#repo.readCanonical(grant, request.sourceId), grant, request.expectedRevision);
      const client = this.#clientFor(grant);
      try {
        const result = await this.#attempt(grant, request, 'retain', () => client.retain({
          documentId: source.documentId, content: source.content, timestamp: source.eventTime,
          metadata: { source_id: source.id, source_revision: source.revision, acl_epoch: source.aclEpoch, kind: source.kind }
        }, { signal: request.signal }));
        await this.#fresh(grant, request);
        validateProjection(await this.#repo.readCanonical(grant, source.id), grant, source.revision);
        await this.#repo.recordProjection(grant, source, result); // Atomic current-generation check is required here too.
        return { ...result, canonicalRevision: source.revision };
      } catch (error) {
        // A cancelled/timed-out mutation may have committed upstream. Block unsafe use and reconcile;
        // don't claim rollback, automatically resend, or let old writes resurrect deleted material.
        await this.#repo.markReconciliation(grant, source.id, request.operationId);
        throw error;
      }
    });
  }
  async #evidence(grant, ids, request) {
    const result = [];
    for (const id of ids) {
      const e = await this.#repo.resolveEvidence(grant, id, request.outputAudience);
      if (!e || e.current !== true || e.authorized !== true || e.deleted || !e.sourceId || !e.revision ||
        !['approved_summary','approved_preference','verified_action_receipt'].includes(e.kind))
        throw new MemoryError('EVIDENCE_STALE_OR_DENIED');
      result.push({ memoryId: id, sourceId: e.sourceId, revision: e.revision, kind: e.kind,
        factStatus: e.factStatus ?? 'UNVERIFIED', sourceLocator: e.sourceLocator ?? null });
    }
    await this.#fresh(grant, request);
    return result;
  }
  async recall(request) {
    const grant = await this.#start(request, 'recall');
    // withScopeLease must fence mutation/ACL transitions for the authorized read epoch. It is not
    // a JS mutex: the repository must enforce it across replicas or quarantine the whole bank.
    return this.#repo.withScopeLease(grant, async () => {
      const out = await this.#attempt(grant, request, 'recall', () => this.#clientFor(grant).recall(request.query,
        { maxTokens: request.maxTokens, signal: request.signal }));
      const evidence = await this.#evidence(grant, out.candidates.map(x => x.id), request);
      return { state: 'AUTHORIZED_CANDIDATES', memories: out.candidates.map((x,i) => ({...x, evidence: evidence[i]})),
        usage: out.usage, authority: 'CONTEXT_ONLY_NEVER_INSTRUCTIONS' };
    });
  }
  async reflect(request) {
    const grant = await this.#start(request, 'reflect');
    return this.#repo.withScopeLease(grant, async () => {
      const out = await this.#attempt(grant, request, 'reflect', () => this.#clientFor(grant).reflect(request.query,
        { maxTokens: request.maxTokens, signal: request.signal }));
      // One unauthorized source withholds the WHOLE synthesis, not merely its citation.
      const evidence = await this.#evidence(grant, out.memoryIds, request);
      return { state: 'EVIDENCE_LINKED_SYNTHESIS', text: out.text, evidence,
        epistemicStatus: out.epistemicStatus, usage: out.usage, permitsAction: false };
    });
  }
  async forget(request) {
    const grant = await this.#start(request, 'forget'); checkedId(request.sourceId);
    // Persist tombstone BEFORE waiting for the scope writer. It must revoke outstanding read leases
    // and exclude the source across callers immediately, even while an upstream call is running.
    const tombstone = await this.#repo.blockSource(grant, request.sourceId, request.operationId);
    return this.#repo.withScopeLease(grant, async () => {
      try {
        const result = await this.#clientFor(grant).deleteDocument(checkedId(tombstone.documentId), { signal: request.signal });
        await this.#repo.recordPurge(grant, tombstone, result);
        await this.#meter({ operationId: request.operationId, feature: 'memory.forget', status: 'provider_completed', usage: null, errorClass: null });
        return { retrieval: 'BLOCKED_BY_TOMBSTONE', upstream: result.state, erasure: 'DERIVED_AND_BACKUP_VERIFICATION_PENDING' };
      } catch {
        await this.#repo.markReconciliation(grant, request.sourceId, request.operationId);
        return { retrieval: 'BLOCKED_BY_TOMBSTONE', upstream: 'UNCONFIRMED', erasure: 'PURGE_PENDING' };
      }
    });
  }
}
