"""
Clarification Desk & Enterprise Chat Adapters.
Manages ambiguity detection, interactive user resolution sessions,
and asynchronous dispatch to Slack (Block Kit) and MS Teams (Adaptive Cards).
"""

import httpx
import time
import uuid
from typing import List, Optional, Dict, Any
from app.models.clarification import (
    TaskStatus,
    ClarificationQuestion,
    ClarificationSession,
    ClarificationAnswerRequest
)
from app.core.event_bus import event_bus


class EnterpriseChatDispatcher:
    """Dispatches asynchronous notifications without blocking core execution."""

    @staticmethod
    async def notify_slack(webhook_url: Optional[str], session: ClarificationSession):
        """Dispatches Slack Block Kit message to enterprise channel."""
        if not webhook_url:
            return

        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"🚨 Clarification Required: {session.ticket_id}"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"Task in `{session.repo_name}` is paused: *{session.title}*"}
            }
        ]

        for q in session.questions:
            options_text = ""
            if q.suggested_options:
                options_text = f"\n*Options*: " + ", ".join([f"`{opt}`" for opt in q.suggested_options])
            blocks.append({
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"• *{q.question}*{options_text}"}
            })

        async with httpx.AsyncClient(timeout=3.0) as client:
            try:
                await client.post(webhook_url, json={"blocks": blocks})
            except Exception as err:
                print(f"[Slack Dispatch Failed]: {err}")

    @staticmethod
    async def notify_teams(webhook_url: Optional[str], session: ClarificationSession):
        """Dispatches Microsoft Teams Adaptive Card to enterprise team channel."""
        if not webhook_url:
            return

        body_elements = [
            {
                "type": "TextBlock",
                "size": "Medium",
                "weight": "Bolder",
                "text": f"Clarification Needed: {session.ticket_id}"
            },
            {
                "type": "TextBlock",
                "text": f"Repo: {session.repo_name} - {session.title}",
                "wrap": True
            }
        ]

        for q in session.questions:
            body_elements.append({
                "type": "TextBlock",
                "text": f"• {q.question}",
                "wrap": True,
                "weight": "Bolder"
            })

        card = {
            "type": "message",
            "attachments": [{
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.4",
                    "body": body_elements
                }
            }]
        }

        async with httpx.AsyncClient(timeout=3.0) as client:
            try:
                await client.post(webhook_url, json=card)
            except Exception as err:
                print(f"[Teams Dispatch Failed]: {err}")


class ClarificationHubService:
    """Manages active clarification sessions and user interaction states."""

    def __init__(self):
        self._sessions: Dict[str, ClarificationSession] = {}
        self._seed_default_sessions()

    def _seed_default_sessions(self):
        """Seeds demo sessions for immediate dashboard visibility."""
        session = ClarificationSession(
            session_id="clar_jira_8812",
            task_id="task_jira_8812",
            ticket_id="JIRA-8812",
            repo_name="org/payments-service",
            title="Implement webhook retry mechanism on HTTP 500/504 errors",
            status=TaskStatus.WAITING_CLARIFICATION,
            tenant_group="payments-prod",
            questions=[
                ClarificationQuestion(
                    id="q_retry_policy",
                    question="Should the payment webhook retry policy use linear backoff (3 attempts) or exponential jitter with max 5 attempts?",
                    suggested_options=["Linear Backoff (3 attempts)", "Exponential Jitter (5 attempts, max 60s)", "No Retry / Dead Letter Queue only"]
                ),
                ClarificationQuestion(
                    id="q_idempotency",
                    question="Should idempotency headers (X-Idempotency-Key) be regenerated on each retry attempt or preserved?",
                    suggested_options=["Preserve original Idempotency-Key", "Generate new idempotency sub-key per attempt"]
                )
            ]
        )
        self._sessions[session.session_id] = session

    def get_session(self, session_id: str) -> Optional[ClarificationSession]:
        return self._sessions.get(session_id)

    def get_session_by_ticket(self, ticket_id: str) -> Optional[ClarificationSession]:
        for s in self._sessions.values():
            if s.ticket_id == ticket_id:
                return s
        return None

    def list_pending_sessions(self) -> List[ClarificationSession]:
        return [s for s in self._sessions.values() if s.status == TaskStatus.WAITING_CLARIFICATION]

    def list_all_sessions(self) -> List[ClarificationSession]:
        return list(self._sessions.values())

    async def create_session(
        self,
        task_id: str,
        ticket_id: str,
        repo_name: str,
        title: str,
        questions: List[ClarificationQuestion],
        tenant_group: str = "default",
        slack_webhook: Optional[str] = None,
        teams_webhook: Optional[str] = None
    ) -> ClarificationSession:
        session = ClarificationSession(
            task_id=task_id,
            ticket_id=ticket_id,
            repo_name=repo_name,
            title=title,
            status=TaskStatus.WAITING_CLARIFICATION,
            questions=questions,
            tenant_group=tenant_group
        )
        self._sessions[session.session_id] = session

        # Broadcast event
        await event_bus.publish("CLARIFICATION_REQUESTED", {
            "session_id": session.session_id,
            "ticket_id": session.ticket_id,
            "repo_name": session.repo_name,
            "title": session.title,
            "questions_count": len(questions)
        })

        # Non-blocking dispatch to external chat tools
        await EnterpriseChatDispatcher.notify_slack(slack_webhook, session)
        await EnterpriseChatDispatcher.notify_teams(teams_webhook, session)

        return session

    async def resolve_session(
        self,
        session_id: str,
        answers: List[Dict[str, Any]],
        user_email: str = "engineer@enterprise.internal"
    ) -> Optional[ClarificationSession]:
        session = self._sessions.get(session_id)
        if not session:
            return None

        resolved_lines = []
        for ans in answers:
            q_id = ans.get("question_id") or ans.get("id")
            val = ans.get("answer") or ans.get("selected_option") or ""
            for q in session.questions:
                if q.id == q_id:
                    q.answer = val
                    q.selected_option = val
                    q.answered_at = time.time()
                    q.answered_by = user_email
                    resolved_lines.append(f"Q: {q.question} -> A: {val}")

        session.status = TaskStatus.READY_FOR_SYNTHESIS
        session.updated_at = time.time()
        session.resolved_context = "\n".join(resolved_lines)

        await event_bus.publish("CLARIFICATION_RESOLVED", {
            "session_id": session.session_id,
            "task_id": session.task_id,
            "ticket_id": session.ticket_id,
            "status": session.status,
            "resolved_context": session.resolved_context,
            "user_email": user_email
        })

        return session


# Global Clarification Hub Service singleton
clarification_hub = ClarificationHubService()
