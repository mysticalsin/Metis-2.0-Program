"""Small fixed-bank Hindsight HTTP reference client; standard library only.

User authentication, source permissions, outbox persistence and provider policy belong
in the host application. No network calls occur on import and no calls auto-retry.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import http.client
import json
import math
import re
from typing import Any, Callable, Mapping
from urllib.parse import urlsplit
from uuid import UUID

Json = dict[str, Any]
Transport = Callable[[str, str, Mapping[str, str], bytes | None, float, int], tuple[int, str, bytes]]
_SAFE_ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}\Z")


class MemoryErrorBase(RuntimeError):
    """Exception text deliberately excludes keys, request bodies and server error bodies."""

    def __init__(self, code: str, *, status: int | None = None):
        self.code, self.status = code, status
        super().__init__(code + (f" (HTTP {status})" if status is not None else ""))


class AccessDenied(MemoryErrorBase):
    pass


class Rejected(MemoryErrorBase):
    pass


class Unavailable(MemoryErrorBase):
    pass


class UnknownWrite(MemoryErrorBase):
    """The remote mutation may have happened. Reconcile; never blindly retry."""


@dataclass(frozen=True)
class Limits:
    timeout_seconds: float = 20.0  # socket timeout, not a guaranteed wall-clock bound
    request_bytes: int = 65_536
    response_bytes: int = 524_288
    query_chars: int = 8_000
    recall_tokens: int = 2_000
    reflect_tokens: int = 2_000

    def __post_init__(self) -> None:
        for name in ("request_bytes", "response_bytes", "query_chars", "recall_tokens", "reflect_tokens"):
            value = getattr(self, name)
            if type(value) is not int or value < 1:
                raise ValueError(f"{name} must be a positive integer")
        if isinstance(self.timeout_seconds, bool) or not math.isfinite(self.timeout_seconds) or self.timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be positive and finite")


def safe_id(value: str) -> str:
    if not isinstance(value, str) or not _SAFE_ID.fullmatch(value):
        raise ValueError("ID must be 1-200 safe ASCII characters, starting with a letter or digit")
    return value


def text(value: str, name: str, maximum: int) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError(f"{name} must be nonempty text within its configured bound")
    return value


def aware_timestamp(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("timestamp must be an explicit ISO 8601 string")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        raise ValueError("timestamp must be an explicit timezone-aware ISO 8601 value") from None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("timestamp must include a timezone")
    return value


def _json(body: Any) -> bytes:
    return json.dumps(body, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")


def _reject_constant(value: str) -> None:
    raise ValueError("nonstandard JSON constant")


class MemoryClient:
    """One trusted endpoint, bank and nonempty strict scope per instance.

    Keep instances server-side. The fixed binding reduces accidental scope changes;
    it is not an authorization boundary against an attacker holding the service key.
    Only origin URLs are supported (no reverse-proxy path prefix).
    """

    def __init__(
        self, *, base_url: str, api_key: str, bank_id: str,
        scope_tags: tuple[str, ...], limits: Limits | None = None,
        allow_reflect: bool = False, supports_operation_id: bool = False,
        supports_append: bool = False, transport: Transport | None = None,
    ) -> None:
        if not isinstance(base_url, str) or any(c.isspace() for c in base_url):
            raise ValueError("base_url must be a trusted origin URL")
        u = urlsplit(base_url)
        if (u.scheme not in ("http", "https") or not u.hostname or u.username is not None
                or u.password is not None or u.query or u.fragment or u.path not in ("", "/")):
            raise ValueError("base_url must be an HTTP(S) origin without credentials, path, query or fragment")
        if u.scheme == "http" and u.hostname not in ("127.0.0.1", "localhost", "::1"):
            raise ValueError("non-loopback endpoints require HTTPS")
        if not isinstance(api_key, str) or not api_key or any(ord(c) < 33 or ord(c) > 126 for c in api_key):
            raise ValueError("api_key must be a nonempty printable token with no whitespace")
        if not isinstance(scope_tags, tuple) or not 1 <= len(scope_tags) <= 16:
            raise ValueError("scope_tags must be a nonempty tuple with at most 16 tags")
        for tag in scope_tags:
            text(tag, "scope tag", 128)
            if tag != tag.strip():
                raise ValueError("scope tags cannot have leading/trailing whitespace")
        if len(set(scope_tags)) != len(scope_tags):
            raise ValueError("duplicate scope tags")
        for value in (allow_reflect, supports_operation_id, supports_append):
            if type(value) is not bool:
                raise ValueError("capability flags must be booleans")
        self._scheme, self._host = u.scheme, u.hostname
        self._port = u.port  # accessing also validates port syntax/range
        self._bank = safe_id(bank_id)
        self._prefix = f"/v1/default/banks/{self._bank}"
        self._tags = scope_tags
        self._key = api_key
        self._limits = limits or Limits()
        self._allow_reflect = allow_reflect
        self._supports_op = supports_operation_id
        self._supports_append = supports_append
        self._transport = transport or self._http_transport

    def _http_transport(self, method: str, path: str, headers: Mapping[str, str],
                        body: bytes | None, timeout: float, max_bytes: int) -> tuple[int, str, bytes]:
        cls = http.client.HTTPSConnection if self._scheme == "https" else http.client.HTTPConnection
        conn = cls(self._host, self._port, timeout=timeout)
        try:
            conn.request(method, path, body=body, headers=dict(headers))
            response = conn.getresponse()
            length = response.getheader("Content-Length")
            if length is not None and int(length) > max_bytes:
                raise ValueError("response size bound exceeded")
            payload = response.read(max_bytes + 1)
            if len(payload) > max_bytes:
                raise ValueError("response size bound exceeded")
            return response.status, response.getheader("Content-Type", ""), payload
        finally:
            conn.close()

    def _call(self, method: str, suffix: str, payload: Json | None = None,
              *, mutation: bool = False, global_path: bool = False) -> Json:
        body = _json(payload) if payload is not None else None
        if body is not None and len(body) > self._limits.request_bytes:
            raise ValueError("request size bound exceeded before sending")
        headers = {"Accept": "application/json", "Authorization": f"Bearer {self._key}"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        path = suffix if global_path else self._prefix + suffix
        failure = UnknownWrite if mutation else Unavailable
        try:
            status, content_type, raw = self._transport(
                method, path, headers, body, self._limits.timeout_seconds, self._limits.response_bytes)
        except Exception:
            raise failure("transport_or_response_failure") from None
        if status in (401, 403):
            raise AccessDenied("access_denied", status=status)
        if status in (400, 404, 405, 409, 410, 413, 415, 422):
            raise Rejected("request_rejected", status=status)
        if not 200 <= status < 300:
            raise failure("redirect_or_service_failure", status=status)
        if not isinstance(raw, bytes) or len(raw) > self._limits.response_bytes:
            raise failure("response_size_bound_exceeded", status=status)
        if status == 204 and not raw:
            return {}
        if content_type.split(";", 1)[0].strip().lower() != "application/json":
            raise failure("unexpected_content_type", status=status)
        try:
            data = json.loads(raw.decode("utf-8"), parse_constant=_reject_constant)
        except (ValueError, UnicodeError, RecursionError):
            raise failure("invalid_json_response", status=status) from None
        if not isinstance(data, dict):
            raise failure("response_must_be_an_object", status=status)
        return data

    def version(self) -> Json:
        return self._call("GET", "/version", global_path=True)

    def retain(self, *, content: str, document_id: str, timestamp: str,
               context: str, metadata: Mapping[str, str] | None = None,
               async_: bool = False, operation_id: str | None = None,
               update_mode: str = "replace") -> Json:
        if type(async_) is not bool:
            raise ValueError("async_ must be boolean")
        item: Json = {"content": text(content, "content", self._limits.request_bytes),
                      "document_id": safe_id(document_id), "timestamp": aware_timestamp(timestamp),
                      "context": text(context, "context", 4_000), "tags": list(self._tags)}
        if metadata is not None and not isinstance(metadata, Mapping):
            raise ValueError("metadata must be a mapping of string pairs")
        meta = dict(metadata or {})
        if len(meta) > 20 or any(not isinstance(k, str) or not k or len(k) > 128
                                 or not isinstance(v, str) or len(v) > 2_000 for k, v in meta.items()):
            raise ValueError("metadata must have at most 20 bounded string pairs")
        if meta:
            item["metadata"] = meta
        if update_mode not in ("replace", "append"):
            raise ValueError("unsupported update_mode")
        if update_mode == "append":
            if not self._supports_append:
                raise ValueError("append capability must be verified before enabling")
            item["update_mode"] = "append"
        payload: Json = {"items": [item], "async": async_}
        if operation_id is not None:
            if not async_ or not self._supports_op:
                raise ValueError("operation_id requires async retain and verified capability")
            try:
                payload["operation_id"] = str(UUID(operation_id))
            except (ValueError, TypeError, AttributeError):
                raise ValueError("operation_id must be a UUID") from None
        return self._call("POST", "/memories", payload, mutation=True)

    def recall(self, query: str, *, max_tokens: int = 1_500, budget: str = "low") -> Json:
        self._budget(max_tokens, budget, self._limits.recall_tokens)
        return self._call("POST", "/memories/recall", {
            "query": text(query, "query", self._limits.query_chars),
            "types": ["world", "experience"], "max_tokens": max_tokens,
            "budget": budget, "tags": list(self._tags), "tags_match": "all_strict"})

    def reflect(self, query: str, *, max_tokens: int = 1_000, budget: str = "low") -> Json:
        if not self._allow_reflect:
            raise ValueError("reflect requires explicit authorized-scope and cost opt-in")
        self._budget(max_tokens, budget, self._limits.reflect_tokens)
        return self._call("POST", "/reflect", {
            "query": text(query, "query", self._limits.query_chars), "max_tokens": max_tokens,
            "budget": budget, "tags": list(self._tags), "tags_match": "all_strict"})

    @staticmethod
    def _budget(tokens: int, budget: str, maximum: int) -> None:
        if type(tokens) is not int or not 1 <= tokens <= maximum or budget not in ("low", "mid", "high"):
            raise ValueError("invalid or excessive token/budget request")

    def document(self, document_id: str) -> Json:
        return self._call("GET", "/documents/" + safe_id(document_id))

    def operation(self, operation_id: str) -> Json:
        return self._call("GET", "/operations/" + safe_id(operation_id))

    def delete_document(self, document_id: str, *, confirm_document_id: str) -> Json:
        if confirm_document_id != document_id:
            raise ValueError("deletion confirmation must match the specific document")
        return self._call("DELETE", "/documents/" + safe_id(document_id), mutation=True)
