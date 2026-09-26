/** Server-admin credential lifecycle. Bind to EXISTING encrypted vault and ledger.
 * Compare-and-swap must include current admin permission/epoch, audit and revocation
 * outbox atomically. A model probe is not production profile/privacy qualification.
 */
import { BoundaryError, id, requireThat } from './authority.js';
import { createJevBackend } from './jev-transport.js';
import { DecisionFailure, freeze, usageFrom, within, type Evaluation, type Usage } from './jev-contract.js';
export interface JevVault {
    /** Must check expectedVersion AND current actor/config epoch inside the transaction. */
    replace(input: {
        tenantId: string;
        actorId: string;
        expectedVersion: number;
        secret: string;
        model: string;
        probeRef: string;
        configurationEpoch: string;
    }): Promise<{
        status: 'committed';
        version: number;
    } | {
        status: 'conflict';
    }>;
}
export interface JevAdminSecurity {
    authorize(tenantId: string): Promise<{
        actorId: string;
        configurationEpoch: string;
    }>;
    assertCurrent(tenantId: string, actorId: string, configurationEpoch: string): Promise<void>;
}
export interface JevProbeLedger {
    reserve(input: {
        tenantId: string;
        actorId: string;
        probeRef: string;
        model: string;
    }): Promise<'reserved' | 'duplicate' | 'budget_exceeded'>;
    settle(input: {
        tenantId: string;
        probeRef: string;
        model: string;
        code: string;
        usage: Usage;
    }): Promise<void>;
}
const probe: Evaluation = { state: 'Synthetic readiness input: the selected option is blue.', questions: { selection: { type: 'choice', instructions: 'Choose the color literally named in state. This is a synthetic API-contract probe, not model calibration.', criteria: { blue: 'Blue', red: 'Red' } } } };
export async function replaceJevCredential(options: {
    tenantId: string;
    expectedVersion: number;
    newSecret: string;
    model: string;
    probeRef: string;
    signal: AbortSignal;
    security: JevAdminSecurity;
    vault: JevVault;
    probeLedger: JevProbeLedger;
    fetchImpl?: typeof fetch;
}): Promise<Readonly<{
    status: 'stored';
    version: number;
    last4: string;
    readiness: 'checking';
} | {
    status: 'blocked' | 'pending_reconciliation';
    code: string;
}>> {
    // Snapshot the admin's selected target/configuration before the first await.
    const {tenantId, expectedVersion, newSecret: secret, model, probeRef, signal, security, vault, probeLedger, fetchImpl} = options;
    let commitAttempted = false;
    try {
        requireThat(id(tenantId) && id(probeRef) && Number.isSafeInteger(expectedVersion) && expectedVersion >= 0, 'JEV_ADMIN_REQUEST');
        requireThat(!signal.aborted, 'DECISION_CANCELLED');
        const auth = await within(security.authorize(tenantId), signal, 2000);
        requireThat(id(auth.actorId) && id(auth.configurationEpoch), 'JEV_ADMIN_UNAUTHENTICATED');
        const backend = createJevBackend({ model: model, readServerSecret: async () => secret, ...(fetchImpl ? { fetchImpl: fetchImpl } : {}) });
        const reservation = await within(probeLedger.reserve({ tenantId: tenantId, actorId: auth.actorId, probeRef: probeRef, model: model }), signal, 2000);
        requireThat(reservation === 'reserved', reservation === 'duplicate' ? 'JEV_PROBE_DUPLICATE' : 'JEV_PROBE_BUDGET');
        let usage = usageFrom(null), probeCode = 'PROBE_PASSED';
        try {
            await within(security.assertCurrent(tenantId, auth.actorId, auth.configurationEpoch), signal, 2000);
            const result = await backend.evaluate(probe, signal, 2000);
            usage = result.usage;
            requireThat(result.answers.selection?.type === 'choice' && result.answers.selection.choice === 'blue', 'JEV_PROBE_FAILED');
        }
        catch (e) {
            probeCode = e instanceof BoundaryError ? e.code : 'JEV_PROBE_FAILED';
            if (e instanceof DecisionFailure && usage.quality === 'unknown')
                usage = e.observedUsage;
        }
        try {
            await within(probeLedger.settle({ tenantId: tenantId, probeRef: probeRef, model: model, code: probeCode, usage }), new AbortController().signal, 2000);
        }
        catch {
            return freeze({ status: 'blocked', code: 'JEV_PROBE_ACCOUNTING_PENDING' });
        }
        requireThat(probeCode === 'PROBE_PASSED', probeCode);
        await within(security.assertCurrent(tenantId, auth.actorId, auth.configurationEpoch), signal, 2000);
        requireThat(!signal.aborted, 'DECISION_CANCELLED');
        commitAttempted = true;
        const commit = await within(vault.replace({ tenantId: tenantId, actorId: auth.actorId, expectedVersion: expectedVersion, secret, model: model, probeRef: probeRef, configurationEpoch: auth.configurationEpoch }), new AbortController().signal, 2000);
        if (commit.status === 'conflict')
            return freeze({ status: 'blocked', code: 'JEV_ROTATION_CONFLICT' });
        requireThat(Number.isSafeInteger(commit.version) && commit.version > expectedVersion, 'JEV_VAULT_COMMIT_INVALID');
        return freeze({ status: 'stored', version: commit.version, last4: secret.slice(-4), readiness: 'checking' });
    }
    catch (e) {
        return freeze({ status: commitAttempted ? 'pending_reconciliation' : 'blocked', code: e instanceof BoundaryError ? e.code : 'JEV_ADMIN_OPERATION_FAILED' });
    }
}
