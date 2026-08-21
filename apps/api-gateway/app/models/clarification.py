"""
Clarification domain models, question schemas, and session state machine.
"""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field
import time
import uuid


class TaskStatus(str, Enum):
    INGESTED = "INGESTED"
    CLASSIFYING = "CLASSIFYING"
    WAITING_CLARIFICATION = "WAITING_CLARIFICATION"
    READY_FOR_SYNTHESIS = "READY_FOR_SYNTHESIS"
    SYNTHESIZING = "SYNTHESIZING"
    TESTING = "TESTING"
    CREATING_PR = "CREATING_PR"
    RESOLVED = "RESOLVED"
    FAILED = "FAILED"


class ClarificationQuestion(BaseModel):
    id: str = Field(default_factory=lambda: f"q_{uuid.uuid4().hex[:6]}")
    question: str
    suggested_options: Optional[List[str]] = None
    answer: Optional[str] = None
    selected_option: Optional[str] = None
    answered_at: Optional[float] = None
    answered_by: Optional[str] = None


class ClarificationSession(BaseModel):
    session_id: str = Field(default_factory=lambda: f"clar_{uuid.uuid4().hex[:8]}")
    task_id: str
    ticket_id: str
    repo_name: str
    title: str
    status: TaskStatus = TaskStatus.WAITING_CLARIFICATION
    questions: List[ClarificationQuestion]
    tenant_group: str = "default"
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    resolved_context: Optional[str] = None


class ClarificationAnswerRequest(BaseModel):
    answers: List[dict] = Field(
        ...,
        description="List of question responses e.g. [{'question_id': 'q_123', 'answer': 'Exponential backoff'}]"
    )
    user_email: Optional[str] = "engineer@enterprise.internal"
