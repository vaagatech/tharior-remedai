"""
Unit and Integration Tests for Observability Engine, Dead-Letter Queue (DLQ), and Replay.
"""

import pytest
from app.core.telemetry_replay import observability_engine, DeadLetterRecord


def test_telemetry_event_recording():
    # Test zero-missed recording
    evt = observability_engine.record_event(
        phase="TEST_PHASE",
        action="Testing event bus recording",
        task_id="task_test_99",
        ticket_id="GH-100",
        tenant_id="tenant-alpha",
        duration_ms=45.2,
        cost_usd=0.00012,
        payload={"key": "value"}
    )
    assert evt.event_id.startswith("evt_")
    assert evt.trace_id.startswith("trc_")
    assert evt.phase == "TEST_PHASE"
    assert evt.duration_ms == 45.2

    # Verify event appears in recent event list
    recent = observability_engine.list_recent_events(limit=10, tenant_id="tenant-alpha")
    assert any(e["event_id"] == evt.event_id for e in recent)


def test_dead_letter_quarantine_and_replay():
    task_id = "task_dlq_001"
    ticket_id = "GH-FAIL-01"
    tenant_id = "tenant-payments"

    # Simulate an unhandled defect
    simulated_exc = ValueError("Database connection timeout during AST extraction")
    
    # Quarantine failure record
    dlq_record = observability_engine.quarantine_failed_record(
        task_id=task_id,
        ticket_id=ticket_id,
        tenant_id=tenant_id,
        failed_phase="AST_LOOKUP",
        exc=simulated_exc,
        input_payload={"ticket_id": ticket_id, "title": "Crash ticket"}
    )

    assert dlq_record.dlq_id.startswith("dlq_")
    assert dlq_record.exception_type == "ValueError"
    assert "Database connection timeout" in dlq_record.exception_message
    assert dlq_record.status == "PENDING_REPLAY"

    # Verify retrieval
    fetched = observability_engine.get_dlq_record(dlq_record.dlq_id)
    assert fetched is not None
    assert fetched.dlq_id == dlq_record.dlq_id

    # Verify replay status update
    replayed = observability_engine.mark_replayed(dlq_record.dlq_id)
    assert replayed is True
    updated = observability_engine.get_dlq_record(dlq_record.dlq_id)
    assert updated.status == "REPLAYED"
    assert updated.retry_count == 1


def test_prometheus_metrics_generation():
    metrics = observability_engine.generate_prometheus_metrics()
    assert "tharior_uptime_seconds" in metrics
    assert "tharior_tasks_total" in metrics
    assert "tharior_dlq_records_active" in metrics
    assert "tharior_cumulative_cost_usd" in metrics
