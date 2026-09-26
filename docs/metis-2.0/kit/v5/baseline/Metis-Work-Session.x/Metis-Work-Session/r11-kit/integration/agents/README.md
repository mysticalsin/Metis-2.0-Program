# Independent named-agent contract reference

`agent-contract.js` has no network, microphone, process, filesystem or device execution API. It demonstrates identity resolution, explicit context selection, proposal freshness, result classification and per-device lease shape. `verification/agent_contract_checks.cjs` exercises this exact reference with synthetic data.

It is NOT an authentication implementation, cryptographic approval token service, durable database, complete schema validator or deployable executor. The personal-agent ownership example intentionally omits organization roles; implement those through the existing verified Entra/service policy. Idempotency matching uses reference JSON equality, not production canonical cryptographic request binding. Use the actual stable serialized request contract and persistent transactional idempotency in production.

Device input leases require a trusted OS-host owner, monotonic expiry, generation checks, cancellation, reauthorization at each actuation and persistent recovery semantics where relevant. The example’s in-memory lease alone cannot enforce any of them. Follow MASTER §32 and the source-derived acceptance matrix.

No bundled HeyClicky implementation is reused. The source study informs behavior; original Métis code and qualified existing services remain authoritative.
