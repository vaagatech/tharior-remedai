"""
Tests for Clarification Hub Service, state transitions, and resolution flow.
"""

import pytest
from app.models.clarification import TaskStatus, ClarificationQuestion
from app.services.clarification_hub import clarification_hub


@pytest.mark.asyncio
async def test_clarification_lifecycle():
    questions = [
        ClarificationQuestion(
            id="q_strategy",
            question="Choose retry strategy",
            suggested_options=["Exponential", "Linear"]
        )
    ]
    
    session = await clarification_hub.create_session(
        task_id="task_test_lifecycle",
        ticket_id="TEST-LIFECYCLE-1",
        repo_name="org/payments-service",
        title="Ambiguous retry configuration",
        questions=questions,
        tenant_group="dev"
    )

    assert session.status == TaskStatus.WAITING_CLARIFICATION
    assert len(session.questions) == 1
    
    # Check retrieval
    fetched = clarification_hub.get_session(session.session_id)
    assert fetched is not None
    assert fetched.ticket_id == "TEST-LIFECYCLE-1"

    # Resolve session
    resolved = await clarification_hub.resolve_session(
        session_id=session.session_id,
        answers=[{"question_id": "q_strategy", "answer": "Exponential"}],
        user_email="tester@enterprise.internal"
    )

    assert resolved is not None
    assert resolved.status == TaskStatus.READY_FOR_SYNTHESIS
    assert resolved.questions[0].answer == "Exponential"
    assert "Exponential" in (resolved.resolved_context or "")
