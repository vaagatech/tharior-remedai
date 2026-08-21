"""
Data models for tickets, webhooks, and inbound issue payloads.
Supports GitHub, GitLab, Jira, and ServiceNow integrations.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid


class AttachmentPayload(BaseModel):
    filename: str
    content_type: str
    bytes: Optional[str] = None  # Base64 encoded or raw string
    content: Optional[str] = None
    size_bytes: Optional[int] = None


class TicketPayload(BaseModel):
    ticket_id: str = Field(default_factory=lambda: f"TICK-{uuid.uuid4().hex[:6].upper()}")
    source: str = "jira"  # jira, github, gitlab, servicenow, web_ui
    repo_name: str = "org/payments-service"
    title: str
    description: str
    user_email: str = "engineer@enterprise.internal"
    tenant_group: str = "default"
    priority: str = "medium"  # low, medium, high, critical
    labels: List[str] = Field(default_factory=list)
    attachments: List[AttachmentPayload] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
