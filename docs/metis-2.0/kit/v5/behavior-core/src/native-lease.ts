import { BoundaryError, id, requireThat } from './authority.js'
export type InputLease = Readonly<{ owner: string; fence: number }>
/**
 * One broker PER DEVICE, not per agent. Revoking a lease blocks new events but
 * does not free the device until the native driver acknowledges quiescence.
 * This is a single-host reference; real native IPC must enforce the fence too.
 */
export class NativeInputLeaseBroker {
  private sequence=0
  private current: InputLease|null=null
  private revoked=false
  acquire(owner:string): InputLease {
    requireThat(id(owner),'BAD_LEASE_OWNER')
    requireThat(!this.current,'INPUT_BUSY_OR_QUARANTINED')
    const token=Object.freeze({owner,fence:++this.sequence})
    this.current=token; this.revoked=false; return token
  }
  assertActive(token:InputLease): void {
    requireThat(this.current===token&&!this.revoked,'INPUT_LEASE_REVOKED')
  }
  revoke(token:InputLease): void { if(this.current===token) this.revoked=true }
  acknowledgeQuiescence(token:InputLease): void {
    requireThat(this.current===token && this.revoked,'QUIESCENCE_NOT_EXPECTED')
    this.current=null; this.revoked=false
  }
  humanTakeover(): void { if(this.current) this.revoked=true }
  get state(): 'free'|'active'|'quarantined' { return !this.current?'free':this.revoked?'quarantined':'active' }
}
export function isLeaseError(e:unknown): boolean { return e instanceof BoundaryError && e.code.startsWith('INPUT_') }
