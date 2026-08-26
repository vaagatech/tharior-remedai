"""
Unit & Integration Tests for Playbook Automation Engine and PR Review Agent.
"""

import pytest
from app.services.playbook_engine import playbook_engine, StoryWebhookEvent
from app.services.pr_review_agent import pr_review_agent
from app.models.agent import PRReviewVerdict, PlaybookConfig


@pytest.mark.asyncio
async def test_pr_review_agent_clean_diff():
    """Validates PR Review Agent approves clean, well-formatted code diffs."""
    clean_diff = """--- a/service.py
+++ b/service.py
@@ -10,6 +10,12 @@ def calculate_fee(amount: float) -> float:
-    return amount * 0.05
+    if amount <= 0:
+        return 0.0
+    return round(amount * 0.05, 2)
"""
    report = await pr_review_agent.review_pr(
        pr_id="101",
        repo_name="core-service",
        title="Fix calculate fee boundary validation",
        description="Handles negative or zero amount gracefully",
        patch_diff=clean_diff,
        test_results={"passed": True, "failed_count": 0}
    )

    assert report.verdict == PRReviewVerdict.APPROVED
    assert report.security_clean is True
    assert report.score_out_of_100 >= 80


@pytest.mark.asyncio
async def test_pr_review_agent_catches_security_issue():
    """Validates PR Review Agent blocks dangerous eval() or exec() calls."""
    insecure_diff = """--- a/evaluator.py
+++ b/evaluator.py
@@ -1,3 +1,4 @@
 def run_user_code(user_input: str):
+    return eval(user_input)
"""
    report = await pr_review_agent.review_pr(
        pr_id="102",
        repo_name="core-service",
        title="Execute dynamic rule",
        description="Executes user input",
        patch_diff=insecure_diff
    )

    assert report.verdict == PRReviewVerdict.REQUEST_CHANGES
    assert report.security_clean is False
    assert any("eval" in issue.lower() for issue in report.suggested_improvements)


@pytest.mark.asyncio
async def test_playbook_story_assigned_workflow():
    """Validates complete automated story listener and remediation workflow."""
    playbook_engine.update_config(PlaybookConfig(
        listen_assigned_stories=True,
        auto_remediate=True,
        auto_merge_enabled=False
    ))

    event = StoryWebhookEvent(
        event_type="story_assigned",
        platform="jira",
        issue_id="PROJ-4521",
        issue_title="Remediate connection timeout in billing microservice",
        issue_description="Payment processor fails under high load without exponential jitter retry",
        repo_name="billing-service",
        assigned_to="tharior-agent"
    )

    result = await playbook_engine.handle_story_assignment(event)
    assert result.issue_id == "PROJ-4521"
    assert result.status == "COMPLETED"
    assert "Autonomous Remediation Completed" in result.story_comment
    assert result.task_report is not None
    assert result.pr_review is not None
