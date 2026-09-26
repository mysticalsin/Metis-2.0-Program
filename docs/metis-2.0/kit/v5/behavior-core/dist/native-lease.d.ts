export type InputLease = Readonly<{
    owner: string;
    fence: number;
}>;
/**
 * One broker PER DEVICE, not per agent. Revoking a lease blocks new events but
 * does not free the device until the native driver acknowledges quiescence.
 * This is a single-host reference; real native IPC must enforce the fence too.
 */
export declare class NativeInputLeaseBroker {
    private sequence;
    private current;
    private revoked;
    acquire(owner: string): InputLease;
    assertActive(token: InputLease): void;
    revoke(token: InputLease): void;
    acknowledgeQuiescence(token: InputLease): void;
    humanTakeover(): void;
    get state(): 'free' | 'active' | 'quarantined';
}
export declare function isLeaseError(e: unknown): boolean;
