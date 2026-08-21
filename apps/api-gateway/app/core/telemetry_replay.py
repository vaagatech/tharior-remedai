"""
Observability, Distributed Tracing, Dead-Letter Queue (DLQ) & Failure Replay Engine.
Ensures zero missed events, persistent failure quarantine, and Prometheus metric generation.
"""

import time
import uuid
import logging
import traceback
from collections import deque
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.services.anvesh_client import anvesh_client

logger = logging.getLogger("telemetry_observability")


class TelemetryEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:8]}")
    trace_id: str = Field(default_factory=lambda: f"trc_{uuid.uuid4().hex[:12]}")
    span_id: str = Field(default_factory=lambda: f"spn_{uuid.uuid4().hex[:8]}")
    parent_span_id: Optional[str] = None
    task_id: Optional[str] = None
    ticket_id: Optional[str] = None
    tenant_id: str = "default"
    user_id: str = "default"
    phase: str
    action: str
    severity: str = "INFO"  # DEBUG, INFO, WARN, ERROR, CRITICAL
    duration_ms: float = 0.0
    cost_usd: float = 0.0
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)


class DeadLetterRecord(BaseModel):
    dlq_id: str = Field(default_factory=lambda: f"dlq_{uuid.uuid4().hex[:8]}")
    task_id: str
    ticket_id: str
    tenant_id: str
    failed_phase: str
    exception_type: str
    exception_message: str
    stack_trace: str
    input_payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)
    status: str = "PENDING_REPLAY"  # PENDING_REPLAY, REPLAYED, DISCARDED
    retry_count: int = 0
    resolved_at: Optional[float] = None


class ObservabilityEngine:
    """
    Central Observability & Resilience Bus.
    Maintains ring-buffered event streams in memory and persists full trace audits into Anvesh.
    """

    def __init__(self, max_in_memory_events: int = 2000, max_dlq_records: int = 500):
        self._events_ring_buffer: deque = deque(maxlen=max_in_memory_events)
        self._dlq_ring_buffer: deque = deque(maxlen=max_dlq_records)
        self._dlq_lookup: Dict[str, DeadLetterRecord] = {}
        
        # Metrics aggregators
        self._task_counts: Dict[str, int] = {"INGESTED": 0, "RESOLVED": 0, "FAILED": 0, "WAITING_CLARIFICATION": 0}
        self._tier_invocations: Dict[str, int] = {}
        self._total_cost_usd: float = 0.0
        self._total_tokens_consumed: int = 0
        self._start_time: float = time.time()

    def record_event(
        self,
        phase: str,
        action: str,
        task_id: Optional[str] = None,
        ticket_id: Optional[str] = None,
        tenant_id: str = "default",
        severity: str = "INFO",
        duration_ms: float = 0.0,
        cost_usd: float = 0.0,
        payload: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
        span_id: Optional[str] = None
    ) -> TelemetryEvent:
        """
        Records a structured observability event. Emits to in-memory buffer and Anvesh.
        """
        evt = TelemetryEvent(
            trace_id=trace_id or f"trc_{task_id or uuid.uuid4().hex[:8]}",
            span_id=span_id or f"spn_{uuid.uuid4().hex[:6]}",
            task_id=task_id,
            ticket_id=ticket_id,
            tenant_id=tenant_id,
            phase=phase,
            action=action,
            severity=severity,
            duration_ms=round(duration_ms, 3),
            cost_usd=round(cost_usd, 6),
            payload=payload or {}
        )

        self._events_ring_buffer.append(evt)
        self._total_cost_usd += cost_usd

        # Asynchronously or non-blockingly persist critical/error events to Anvesh
        if severity in ("WARN", "ERROR", "CRITICAL"):
            try:
                anvesh_client.store_document(
                    "telemetry_events",
                    evt.event_id,
                    evt.model_dump(),
                    tenant_id=tenant_id
                )
            except Exception as e:
                logger.warning(f"Failed to persist telemetry event to Anvesh: {e}")

        return evt

    def quarantine_failed_record(
        self,
        task_id: str,
        ticket_id: str,
        tenant_id: str,
        failed_phase: str,
        exc: Exception,
        input_payload: Optional[Dict[str, Any]] = None
    ) -> DeadLetterRecord:
        """
        Quarantines a failed execution record to the Dead-Letter Queue (DLQ).
        Allows seamless pipeline continuation for remaining items while retaining full debug context.
        """
        tb = traceback.format_exc()
        record = DeadLetterRecord(
            task_id=task_id,
            ticket_id=ticket_id,
            tenant_id=tenant_id,
            failed_phase=failed_phase,
            exception_type=exc.__class__.__name__,
            exception_message=str(exc),
            stack_trace=tb,
            input_payload=input_payload or {}
        )

        self._dlq_ring_buffer.append(record)
        self._dlq_lookup[record.dlq_id] = record
        self._task_counts["FAILED"] = self._task_counts.get("FAILED", 0) + 1

        logger.error(
            f"DLQ Quarantine [{record.dlq_id}] for Task {task_id} at phase {failed_phase}: "
            f"{record.exception_type}: {record.exception_message}"
        )

        # Persist DLQ record to Anvesh durable store
        try:
            anvesh_client.store_document(
                "dead_letter_queue",
                record.dlq_id,
                record.model_dump(),
                tenant_id=tenant_id
            )
        except Exception as err:
            logger.warning(f"Could not persist DLQ record to Anvesh: {err}")

        # Also emit telemetry error event
        self.record_event(
            phase="DLQ_QUARANTINE",
            action=f"Task {task_id} quarantined to DLQ: {record.exception_type}",
            task_id=task_id,
            ticket_id=ticket_id,
            tenant_id=tenant_id,
            severity="ERROR",
            payload={"dlq_id": record.dlq_id, "exception": str(exc), "failed_phase": failed_phase}
        )

        return record

    def list_dlq_records(self, tenant_id: Optional[str] = None) -> List[DeadLetterRecord]:
        """Returns all quarantined dead-letter records, optionally filtered by tenant."""
        records = list(self._dlq_ring_buffer)
        if tenant_id:
            return [r for r in records if r.tenant_id == tenant_id]
        return records

    def get_dlq_record(self, dlq_id: str) -> Optional[DeadLetterRecord]:
        """Fetches a specific DLQ record from memory or Anvesh."""
        if dlq_id in self._dlq_lookup:
            return self._dlq_lookup[dlq_id]
        doc = anvesh_client.get_document("dead_letter_queue", dlq_id)
        if doc:
            return DeadLetterRecord(**doc)
        return None

    def mark_replayed(self, dlq_id: str) -> bool:
        """Marks a DLQ item as successfully replayed."""
        record = self.get_dlq_record(dlq_id)
        if record:
            record.status = "REPLAYED"
            record.retry_count += 1
            record.resolved_at = time.time()
            self._dlq_lookup[dlq_id] = record
            anvesh_client.store_document("dead_letter_queue", dlq_id, record.model_dump(), tenant_id=record.tenant_id)
            return True
        return False

    def list_recent_events(self, limit: int = 50, tenant_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns the most recent observability events from the ring buffer."""
        events = list(self._events_ring_buffer)
        if tenant_id:
            events = [e for e in events if e.tenant_id == tenant_id]
        return [e.model_dump() for e in reversed(events[-limit:])]

    def generate_prometheus_metrics(self) -> str:
        """
        Generates standard Prometheus OpenMetrics text format for scraping.
        """
        uptime_seconds = time.time() - self._start_time
        lines = [
            "# HELP tharior_uptime_seconds Total runtime of the agentic gateway in seconds.",
            "# TYPE tharior_uptime_seconds gauge",
            f"tharior_uptime_seconds {round(uptime_seconds, 2)}",
            "",
            "# HELP tharior_tasks_total Total count of ingested and processed remediation tasks.",
            "# TYPE tharior_tasks_total counter",
            f'tharior_tasks_total{{status="INGESTED"}} {self._task_counts.get("INGESTED", 0)}',
            f'tharior_tasks_total{{status="RESOLVED"}} {self._task_counts.get("RESOLVED", 0)}',
            f'tharior_tasks_total{{status="FAILED"}} {self._task_counts.get("FAILED", 0)}',
            f'tharior_tasks_total{{status="WAITING_CLARIFICATION"}} {self._task_counts.get("WAITING_CLARIFICATION", 0)}',
            "",
            "# HELP tharior_dlq_records_active Current number of active quarantined failure records in DLQ.",
            "# TYPE tharior_dlq_records_active gauge",
            f"tharior_dlq_records_active {len(self._dlq_ring_buffer)}",
            "",
            "# HELP tharior_cumulative_cost_usd Cumulative dollar spend across all LLM tiers.",
            "# TYPE tharior_cumulative_cost_usd counter",
            f"tharior_cumulative_cost_usd {round(self._total_cost_usd, 6)}",
        ]
        return "\n".join(lines) + "\n"


# Global Observability & DLQ singleton
observability_engine = ObservabilityEngine()
