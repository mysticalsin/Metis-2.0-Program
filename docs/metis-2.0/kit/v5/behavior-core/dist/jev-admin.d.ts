import { type Usage } from './jev-contract.js';
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
export declare function replaceJevCredential(options: {
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
}>>;
