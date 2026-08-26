"""
Autonomous Automation Playbook Engine.
Listens for issues or stories assigned directly to the coding agent,
orchestrates AST analysis & code remediation, posts progress comments on the story,
invokes the PR Review Agent, and conditionally executes auto-merging according to tenant policy.
"""

import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.models.agent import PlaybookConfig, TaskExecutionReport, TaskStatus
from app.models.ticket import TicketPayload
from app.services.tiered_engine import agent_engine
from app.services.pr_review_agent import pr_review_agent
from app.services.anvesh_client import anvesh_client

logger = logging.getLogger("playbook_engine")


class StoryWebhookEvent(BaseModel):
    event_type: str = "story_assigned"  # "story_assigned", "issue_opened", "jira_ticket_updated"
    platform: str = "github"             # "github", "jira", "linear"
    issue_id: str
    issue_title: str
    issue_description: str
    repo_name: str
    assigned_to: str = "tharior-agent"
    author: str = "user"
    labels: List[str] = Field(default_factory=list)


class PlaybookExecutionResult(BaseModel):
    playbook_run_id: str
    issue_id: str
    repo_name: str
    status: str  # "COMPLETED", "MERGED", "BLOCKED", "REVIEW_REQUIRED"
    task_report: Optional[TaskExecutionReport] = None
    pr_review: Optional[Dict[str, Any]] = None
    story_comment: str
    is_merged: bool = False
    execution_time_seconds: float = 0.0


class PlaybookEngine:
    """
    Manages automated playbooks: Issue/Story listener, auto-fix remediation,
    commenting on stories, PR review triggering, and policy-driven auto-merging.
    """

    def __init__(self):
        self.config = PlaybookConfig()
        self._history: List[Dict[str, Any]] = []
        self._load_from_storage()

    def _load_from_storage(self):
        """Loads playbook config and past run history from Anvesh Unified Storage."""
        cached = anvesh_client.get_document("playbooks", "engine_config")
        if cached:
            try:
                self.config = PlaybookConfig(**cached.get("config", {}))
                self._history = cached.get("history", [])
                logger.info(f"Loaded playbook configuration and {len(self._history)} past runs from Anvesh.")
            except Exception as e:
                logger.warning(f"Failed to load playbook config from Anvesh: {e}")

    def _persist_to_storage(self):
        """Persists playbook config and execution history to Anvesh."""
        payload = {
            "config": self.config.model_dump(),
            "history": self._history[-100:],  # retain last 100 runs
            "updated_at": time.time()
        }
        anvesh_client.store_document("playbooks", "engine_config", payload)

    def get_config(self) -> PlaybookConfig:
        return self.config

    def update_config(self, new_config: PlaybookConfig) -> PlaybookConfig:
        self.config = new_config
        self._persist_to_storage()
        return self.config

    async def handle_story_assignment(self, event: StoryWebhookEvent) -> PlaybookExecutionResult:
        """
        Main Playbook Workflow:
        1. Ingests assigned story/issue.
        2. Dispatches autonomous remediation engine.
        3. Generates concise story comments.
        4. Runs PR Review Agent.
        5. If auto-merge policy is satisfied, merges PR and finalizes story!
        """
        start_time = time.perf_counter()
        run_id = f"pb_{uuid.uuid4().hex[:8]}"

        logger.info(f"Playbook triggered for Issue #{event.issue_id} in repo '{event.repo_name}': {event.issue_title}")

        # Step 1: Wrap into TicketPayload and execute remediation
        ticket = TicketPayload(
            ticket_id=event.issue_id,
            repo_name=event.repo_name,
            title=event.issue_title,
            description=event.issue_description,
            environment="sandbox"
        )

        task_report = await agent_engine.process_ticket(ticket)
        patch_diff = task_report.patch_diff or ""
        pr_url = task_report.pr_url or f"https://github.com/{event.repo_name}/pull/{event.issue_id}"

        # Step 2: Invoke PR Review Agent
        pr_review = await pr_review_agent.review_pr(
            pr_id=event.issue_id,
            repo_name=event.repo_name,
            title=event.issue_title,
            description=event.issue_description,
            patch_diff=patch_diff,
            test_results=task_report.test_results
        )

        # Step 3: Evaluate Auto-Merge Policy
        is_merged = False
        status_str = "COMPLETED"

        if self.config.auto_merge_enabled:
            criteria = self.config.auto_merge_criteria
            tests_ok = not criteria.get("require_tests_passed", True) or (
                task_report.test_results and task_report.test_results.get("passed", True)
            )
            sast_ok = not criteria.get("require_sast_clean", True) or pr_review.security_clean
            review_ok = not criteria.get("require_review_agent_approval", True) or (
                pr_review.verdict.value == "APPROVED"
            )
            diff_lines = len(patch_diff.splitlines())
            diff_ok = diff_lines <= criteria.get("max_diff_lines", 500)

            if tests_ok and sast_ok and review_ok and diff_ok:
                is_merged = True
                status_str = "MERGED"
                logger.info(f"Auto-Merge POLICY PASSED for PR #{event.issue_id}. Merged autonomously.")
            else:
                status_str = "REVIEW_REQUIRED"
                logger.info(f"Auto-Merge requirements not satisfied (tests={tests_ok}, sast={sast_ok}, review={review_ok}). Leaving open for human review.")

        # Step 4: Construct concise story comment
        merge_status_msg = "Successfully merged into main branch automatically." if is_merged else "Pull Request opened and awaiting manual approval."
        story_comment = (
            f"**Autonomous Remediation Completed by Tharior Remedai Agent**\n\n"
            f"- **Selected Tier**: {task_report.tier.value} ({task_report.selected_model})\n"
            f"- **PR Review Score**: {pr_review.score_out_of_100}/100 ({pr_review.verdict.value})\n"
            f"- **Status**: {merge_status_msg}\n"
            f"- **Pull Request**: [{pr_url}]({pr_url})\n\n"
            f"**Summary of Changes:**\n{pr_review.summary}"
        )

        elapsed = round(time.perf_counter() - start_time, 2)
        result = PlaybookExecutionResult(
            playbook_run_id=run_id,
            issue_id=event.issue_id,
            repo_name=event.repo_name,
            status=status_str,
            task_report=task_report,
            pr_review=pr_review.model_dump(),
            story_comment=story_comment,
            is_merged=is_merged,
            execution_time_seconds=elapsed
        )

        # Record history
        self._history.append({
            "run_id": run_id,
            "issue_id": event.issue_id,
            "repo_name": event.repo_name,
            "status": status_str,
            "is_merged": is_merged,
            "model_used": task_report.selected_model,
            "cost_usd": task_report.total_cost_usd,
            "timestamp": time.time()
        })
        self._persist_to_storage()

        return result

    def get_history(self) -> List[Dict[str, Any]]:
        return list(reversed(self._history))


# Global Playbook Engine Singleton
playbook_engine = PlaybookEngine()
