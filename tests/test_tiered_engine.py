"""
Tests for Tiered LLM Routing, Ambiguity Gate, and Patch Synthesis.
"""

import pytest
from app.models.ticket import TicketPayload
from app.models.agent import TierLevel
from app.models.clarification import TaskStatus
from app.services.tiered_engine import agent_engine


@pytest.mark.asyncio
async def test_nano_classification_for_doc_typo():
    ticket = TicketPayload(
        ticket_id="TEST-DOC-1",
        title="Fix typo in README documentation",
        description="Fix typo in the deployment guide section of README.md",
        repo_name="org/payments-service"
    )
    tier, reasoning, is_ambiguous, questions = await agent_engine.classify_ticket(ticket)
    assert tier == TierLevel.NANO
    assert is_ambiguous is False
    assert len(questions) == 0


@pytest.mark.asyncio
async def test_frontier_classification_for_architecture():
    ticket = TicketPayload(
        ticket_id="TEST-ARCH-1",
        title="Multi-service architecture refactor and database schema migration",
        description="Refactor core service boundaries and protocol definitions across payments microservices.",
        repo_name="org/payments-service"
    )
    tier, reasoning, is_ambiguous, questions = await agent_engine.classify_ticket(ticket)
    assert tier == TierLevel.FRONTIER
    assert is_ambiguous is False


@pytest.mark.asyncio
async def test_ambiguity_gate_detection():
    ticket = TicketPayload(
        ticket_id="TEST-AMBIGUOUS-1",
        title="Payment webhook retry logic is broken [AMBIGUOUS]",
        description="Retry policy unspecified. Need clarification required on backoff strategy.",
        repo_name="org/payments-service"
    )
    tier, reasoning, is_ambiguous, questions = await agent_engine.classify_ticket(ticket)
    assert is_ambiguous is True
    assert len(questions) >= 1

    # Processing ambiguous ticket should halt at WAITING_CLARIFICATION
    report = await agent_engine.process_ticket(ticket)
    assert report.status == TaskStatus.WAITING_CLARIFICATION


@pytest.mark.asyncio
async def test_end_to_end_unambiguous_processing():
    ticket = TicketPayload(
        ticket_id="TEST-FIX-1",
        title="Fix NullPointerException in webhook handler",
        description="Deserializer crashes when event_id field is None.",
        repo_name="org/payments-service"
    )
    report = await agent_engine.process_ticket(ticket)
    assert report.status == TaskStatus.RESOLVED
    assert report.patch_diff is not None
    assert report.pr_url is not None
    assert report.total_cost_usd > 0
    assert report.total_latency_ms > 0
    assert report.test_results["tests_passed"] is True
