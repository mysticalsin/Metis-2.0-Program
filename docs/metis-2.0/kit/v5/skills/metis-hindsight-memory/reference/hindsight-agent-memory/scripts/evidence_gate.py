"""Canonical-first evidence projection and whole-envelope budgeting.

The host must implement `resolve(memory_id, auth)` using a TRUSTED ingestion mapping
and current source/ACL store. Never construct CanonicalEvidence from recalled metadata.
The result is still untrusted data for the model, not executable instructions.
"""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
import json
from typing import Any, Callable, Iterable


@dataclass(frozen=True)
class AuthContext:
    tenant_id: str
    principal_id: str
    purpose: str
    grants_version: str

    def __post_init__(self) -> None:
        if any(not isinstance(v, str) or not v.strip() for v in
               (self.tenant_id, self.principal_id, self.purpose, self.grants_version)):
            raise ValueError("validated identity, purpose and grants version are required")


@dataclass(frozen=True)
class CanonicalEvidence:
    memory_id: str
    source_id: str
    revision: str
    active_revision: str
    tenant_id: str
    allowed_principals: frozenset[str]
    allowed_purposes: frozenset[str]
    grants_version: str
    excerpt: str
    classification: str = "source_statement"
    deleted: bool = False
    expires_at: datetime | None = None


class EvidenceUnavailable(RuntimeError):
    """The trusted resolver failed; callers must omit memory, never bypass validation."""


def serialize(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def build_evidence(
    candidates: Iterable[dict[str, Any]], *, auth: AuthContext,
    resolve: Callable[[str, AuthContext], CanonicalEvidence | None],
    max_bytes: int = 12_000, max_items: int = 8, max_candidates: int = 32,
    token_limit: int | None = None, token_counter: Callable[[str], int] | None = None,
    now: datetime | None = None,
) -> str:
    """Return valid bounded JSON, using canonical text rather than raw candidate text.

    Count the full serialized envelope with the RECEIVING model's tokenizer when
    token_counter is supplied. Without it, this function claims a byte limit only.
    Candidate iteration/resolution need a host deadline; do not supply an unbounded
    network iterator. Resolver exceptions fail the whole read closed.
    """
    for name, value in (("max_bytes", max_bytes), ("max_items", max_items), ("max_candidates", max_candidates)):
        if type(value) is not int or value < 1:
            raise ValueError(f"{name} must be a positive integer")
    if (token_counter is None) != (token_limit is None):
        raise ValueError("token_counter and token_limit must be supplied together")
    if token_limit is not None and (type(token_limit) is not int or token_limit < 1):
        raise ValueError("token_limit must be a positive integer")
    when = now or datetime.now(timezone.utc)
    if when.tzinfo is None or when.utcoffset() is None:
        raise ValueError("now must be timezone-aware")
    envelope: dict[str, Any] = {"kind": "untrusted_memory_evidence", "evidence": [], "truncated": False}

    def fits(value: dict[str, Any]) -> bool:
        encoded = serialize(value)
        if len(encoded.encode("utf-8")) > max_bytes:
            return False
        if token_counter is not None:
            count = token_counter(encoded)
            if type(count) is not int or count < 0:
                raise ValueError("token_counter must return a nonnegative integer")
            return count <= token_limit
        return True

    if not fits(envelope):
        raise ValueError("budget cannot fit even the empty evidence envelope")
    seen_ids: set[str] = set()
    seen_evidence: set[tuple[str, str, str]] = set()
    truncated = False
    for index, candidate in enumerate(candidates):
        if index >= max_candidates:
            truncated = True
            break
        if not isinstance(candidate, dict):
            continue
        memory_id = candidate.get("id")
        if not isinstance(memory_id, str) or not memory_id or len(memory_id) > 200 or memory_id in seen_ids:
            continue
        seen_ids.add(memory_id)
        try:
            record = resolve(memory_id, auth)
        except Exception:
            raise EvidenceUnavailable("canonical_source_or_authorization_unavailable") from None
        if record is None:
            continue
        if not isinstance(record, CanonicalEvidence):
            raise EvidenceUnavailable("resolver_contract_invalid")
        if (type(record.deleted) is not bool
                or not isinstance(record.allowed_principals, frozenset)
                or not isinstance(record.allowed_purposes, frozenset)
                or any(not isinstance(v, str) or not v for v in record.allowed_principals | record.allowed_purposes)):
            raise EvidenceUnavailable("resolver_authorization_contract_invalid")
        if (record.memory_id != memory_id or record.tenant_id != auth.tenant_id or record.deleted
                or auth.principal_id not in record.allowed_principals
                or auth.purpose not in record.allowed_purposes
                or record.grants_version != auth.grants_version
                or record.revision != record.active_revision):
            continue
        if record.expires_at is not None:
            if record.expires_at.tzinfo is None or record.expires_at.utcoffset() is None:
                raise EvidenceUnavailable("resolver_returned_ambiguous_expiry")
            if record.expires_at <= when:
                continue
        if (not isinstance(record.excerpt, str) or not record.excerpt.strip()
                or not isinstance(record.source_id, str) or not record.source_id
                or not isinstance(record.revision, str) or not record.revision
                or record.classification not in ("source_statement", "verified_event", "reviewed_lesson")):
            continue
        # Avoid serializing a grossly oversized canonical excerpt solely to reject it.
        if len(record.excerpt) > max_bytes or len(record.source_id) > 512 or len(record.revision) > 256:
            truncated = True
            continue
        signature = (record.source_id, record.revision, record.excerpt)
        if signature in seen_evidence:
            continue
        if len(envelope["evidence"]) >= max_items:
            truncated = True
            break
        item = {"source_id": record.source_id, "revision": record.revision,
                "text": record.excerpt, "classification": record.classification}
        proposal = {**envelope, "evidence": [*envelope["evidence"], item]}
        if not fits(proposal):
            truncated = True
            continue
        envelope = proposal
        seen_evidence.add(signature)
    # Serialize again after changing flags: arbitrary model tokenizers need not be monotonic.
    envelope["truncated"] = truncated
    while not fits(envelope):
        if not envelope["evidence"]:
            raise ValueError("budget cannot fit the truncated evidence envelope")
        envelope["evidence"].pop()
        envelope["truncated"] = True
    return serialize(envelope)
