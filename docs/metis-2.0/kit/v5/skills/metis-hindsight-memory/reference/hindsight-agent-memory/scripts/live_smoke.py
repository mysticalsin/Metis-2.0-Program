"""Opt-in live synthetic write/update/recall/delete check. Never creates/deletes a bank.

An existing disposable bank and backend key must be explicitly provided. This can
spend provider tokens. It does NOT establish complete application readiness.
"""
from __future__ import annotations
from datetime import datetime, timezone
import json
import os
import sys
import time
from uuid import uuid4
from memory_client import MemoryClient, Limits, Rejected, UnknownWrite, Unavailable


def wait_operation(client: MemoryClient, operation_id: str, seconds: float = 120) -> None:
    deadline = time.monotonic() + seconds
    delay = .5
    while time.monotonic() < deadline:
        response = client.operation(operation_id)
        status = response.get("status")
        if status == "completed":
            return
        if status in ("failed", "cancelled"):
            raise RuntimeError("operation_terminal_unsuccessful")
        if status not in ("pending", "processing"):
            raise RuntimeError("unknown_operation_response_shape")
        time.sleep(min(delay, max(0, deadline - time.monotonic())))
        delay = min(delay * 1.6, 4)
    raise RuntimeError("operation_verification_deadline")


def main() -> int:
    if os.environ.get("HINDSIGHT_ALLOW_TEST_WRITES") != "YES":
        print("Refusing live writes. Provision a disposable bank and explicitly set HINDSIGHT_ALLOW_TEST_WRITES=YES.")
        return 2
    required = ("HINDSIGHT_BASE_URL", "HINDSIGHT_API_KEY", "HINDSIGHT_BANK_ID")
    if any(not os.environ.get(key) for key in required):
        print("Missing required trusted endpoint, key or disposable-bank configuration.")
        return 2
    run_id = uuid4().hex
    doc_id = f"skill-smoke-{run_id}"
    client = MemoryClient(base_url=os.environ["HINDSIGHT_BASE_URL"],
                          api_key=os.environ["HINDSIGHT_API_KEY"],
                          bank_id=os.environ["HINDSIGHT_BANK_ID"],
                          scope_tags=(f"test:{run_id}",), limits=Limits(timeout_seconds=15))
    report: dict = {"run_id": run_id, "document_id": doc_id, "checks": [],
                    "native_authorization_suite": "NOT_RUN", "derived_erasure_suite": "NOT_RUN"}
    no_active_write = True
    may_have_document = False
    failed = False
    try:
        version = client.version()
        report["server_version"] = version.get("api_version", "unreported")
        report["checks"].append("version_read")
        for revision, codeword in (("1", "cedar-cobalt"), ("2", "maple-amber")):
            no_active_write = False
            may_have_document = True
            ack = client.retain(content=f"Synthetic project {run_id} has the current codeword {codeword}.",
                                document_id=doc_id, timestamp=datetime.now(timezone.utc).isoformat(),
                                context="Approved synthetic smoke test, not personal or customer data.",
                                metadata={"source_id": doc_id, "revision": revision}, async_=True)
            if ack.get("success") is not True:
                raise RuntimeError("retain_did_not_report_success")
            op = ack.get("operation_id")
            if not isinstance(op, str) or not op:
                raise RuntimeError("async_receipt_missing_operation_id")
            report.setdefault("operation_ids", []).append(op)
            wait_operation(client, op)
            no_active_write = True
            doc = client.document(doc_id)
            if not isinstance(doc.get("memory_unit_count"), int) or doc["memory_unit_count"] <= 0:
                raise RuntimeError("document_has_no_facts")
            # This deployment's source-text persistence must be enabled to verify replacement exactly.
            if codeword not in str(doc.get("original_text", "")):
                raise RuntimeError("source_text_missing_or_wrong_revision")
            if revision == "2" and "cedar-cobalt" in str(doc.get("original_text", "")):
                raise RuntimeError("replacement_source_still_contains_old_codeword")
            recall = client.recall(f"What is the current codeword of synthetic project {run_id}?")
            if not any(codeword in str(item.get("text", "")) for item in recall.get("results", []) if isinstance(item, dict)):
                raise RuntimeError("expected_fact_not_recalled")
            report["checks"].append(f"retain_document_recall_revision_{revision}")
        no_active_write = False
        receipt = client.delete_document(doc_id, confirm_document_id=doc_id)
        if receipt.get("success") is not True:
            raise RuntimeError("delete_did_not_report_success")
        may_have_document = False
        no_active_write = True
        try:
            client.document(doc_id)
        except Rejected as error:
            if error.status != 404:
                raise
        else:
            raise RuntimeError("document_still_accessible_after_delete")
        result = client.recall(f"What is the current codeword of synthetic project {run_id}?")
        if result.get("results"):
            raise RuntimeError("strict_test_scope_still_returns_raw_facts_after_delete")
        report["checks"].append("own_document_deleted_and_raw_scope_empty")
    except Exception as error:
        failed = True
        report["failure_class"] = type(error).__name__
        if isinstance(error, (UnknownWrite, Unavailable, Rejected)):
            report["failure_code"] = error.code
        elif isinstance(error, RuntimeError):
            report["failure_code"] = str(error)  # only locally generated labels above
        else:
            report["failure_code"] = "configuration_or_response_validation_failure"
    finally:
        if may_have_document:
            if no_active_write:
                try:
                    deleted = client.delete_document(doc_id, confirm_document_id=doc_id)
                    report["cleanup"] = "delete_acknowledged" if deleted.get("success") is True else "needs_review"
                except Exception:
                    report["cleanup"] = "needs_manual_reconciliation"
            else:
                report["cleanup"] = "reconcile_recorded_operation_then_delete_own_document; no_racing_delete_attempted"
        report["result"] = "FAILED" if failed else "PASSED_CORE_SMOKE_ONLY"
        print(json.dumps(report, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
