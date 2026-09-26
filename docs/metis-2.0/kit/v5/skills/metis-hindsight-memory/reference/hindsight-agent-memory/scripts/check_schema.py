"""Inspect a LOCAL deployed OpenAPI JSON. Never downloads URLs or follows external refs."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from typing import Any

REQUIRED = {
    "/version": ["get"],
    "/v1/default/banks/{bank_id}/memories": ["post"],
    "/v1/default/banks/{bank_id}/memories/recall": ["post"],
    "/v1/default/banks/{bank_id}/documents/{document_id}": ["get", "delete"],
    "/v1/default/banks/{bank_id}/operations/{operation_id}": ["get"],
}


def resolved(schema: dict[str, Any], document: dict[str, Any], depth: int = 0) -> dict[str, Any]:
    if depth > 32:
        raise ValueError("schema reference depth exceeded")
    if "$ref" not in schema:
        return schema
    ref = schema["$ref"]
    if not isinstance(ref, str) or not ref.startswith("#/"):
        raise ValueError("external references are not followed")
    node: Any = document
    for segment in ref[2:].split("/"):
        node = node[segment.replace("~1", "/").replace("~0", "~")]
    if not isinstance(node, dict):
        raise ValueError("reference must resolve to a schema object")
    return resolved(node, document, depth + 1)


def properties(schema: dict[str, Any], document: dict[str, Any], depth: int = 0) -> dict[str, Any]:
    if depth > 32:
        raise ValueError("schema depth exceeded")
    schema = resolved(schema, document)
    result = dict(schema.get("properties", {}))
    for key in ("allOf", "anyOf", "oneOf"):
        for member in schema.get(key, []):
            result.update(properties(member, document, depth + 1))
    return result


def inspect_schema(document: dict[str, Any]) -> dict[str, Any]:
    paths = document.get("paths", {})
    missing = [f"{method.upper()} {path}" for path, methods in REQUIRED.items()
               for method in methods if method not in paths.get(path, {})]
    bodies: dict[str, dict[str, Any]] = {}
    for name, path in (("retain", "/v1/default/banks/{bank_id}/memories"),
                       ("recall", "/v1/default/banks/{bank_id}/memories/recall")):
        operation = paths.get(path, {}).get("post", {})
        body = operation.get("requestBody", {})
        body = resolved(body, document)
        schema = body.get("content", {}).get("application/json", {}).get("schema", {})
        bodies[name] = properties(schema, document)
    for key in ("items", "async"):
        if key not in bodies["retain"]:
            missing.append(f"retain request property: {key}")
    for key in ("query", "types", "tags", "tags_match", "max_tokens", "budget"):
        if key not in bodies["recall"]:
            missing.append(f"recall request property: {key}")
    tag_schema = resolved(bodies["recall"].get("tags_match", {}), document)
    if "all_strict" not in tag_schema.get("enum", []):
        missing.append("recall tags_match enum does not explicitly establish all_strict")
    item_schema = resolved(bodies["retain"].get("items", {}), document).get("items", {})
    item_fields = properties(item_schema, document)
    for key in ("content", "document_id", "timestamp", "context", "tags", "metadata"):
        if key not in item_fields:
            missing.append(f"retain item property: {key}")
    return {
        "schema_version_label": document.get("info", {}).get("version"),
        "core_shape_check_passed": not missing,
        "missing_or_unproven": missing,
        "optional_fields_present": {
            "async_operation_id": "operation_id" in bodies["retain"],
            "item_update_mode": "update_mode" in item_fields,
            "reflect_endpoint": "post" in paths.get("/v1/default/banks/{bank_id}/reflect", {}),
        },
        "warning": "Static shape inspection only. No server requests, enum behavior, ACL or idempotency tested.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("openapi_json", type=Path)
    args = parser.parse_args()
    if args.openapi_json.stat().st_size > 20_000_000:
        parser.error("schema exceeds 20 MB local input bound")
    report = inspect_schema(json.loads(args.openapi_json.read_text()))
    print(json.dumps(report, indent=2))
    return 0 if report["core_shape_check_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
