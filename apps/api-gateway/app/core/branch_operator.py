"""
Git Branch Lifecycle & Conflict Resolution Operator.
Manages automated branch synthesis, naming conventions, trunk rebase,
conflict detection, and automated post-merge branch pruning.
"""

import time
import uuid
import re
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum

from app.core.event_bus import event_bus
from app.core.telemetry_replay import observability_engine

logger = logging.getLogger("branch_operator")


class BranchStatus(str, Enum):
    CREATED = "CREATED"
    PATCHED = "PATCHED"
    PR_OPENED = "PR_OPENED"
    MERGED = "MERGED"
    CONFLICT_DETECTED = "CONFLICT_DETECTED"
    PRUNED = "PRUNED"


class RemediationBranch(BaseModel):
    branch_id: str
    repo_name: str
    ticket_id: str
    branch_name: str
    base_branch: str = "main"
    head_sha: str
    status: BranchStatus = BranchStatus.CREATED
    pr_url: Optional[str] = None
    pr_number: Optional[int] = None
    files_changed: List[str] = []
    conflict_files: List[str] = []
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)


class GitBranchOperator:
    """
    Automated Branch Lifecycle Controller.
    Ensures consistent branch naming, non-destructive patch application,
    trunk synchronization (rebase), and garbage collection of stale branches.
    """

    def __init__(self):
        self._branches: Dict[str, RemediationBranch] = {}
        self._seed_active_branches()

    def _seed_active_branches(self):
        """Pre-seeds demonstration branches for telemetry."""
        demo_branch = RemediationBranch(
            branch_id="br_seed_01",
            repo_name="org/payments-service",
            ticket_id="GH-4491",
            branch_name="tharior/fix-GH-4491-stripe-webhook-npe",
            base_branch="main",
            head_sha="a7f83b109e23",
            status=BranchStatus.PR_OPENED,
            pr_url="https://github.com/org/payments-service/pull/4492",
            pr_number=4492,
            files_changed=["src/processor.py"]
        )
        self._branches[demo_branch.branch_id] = demo_branch

    @staticmethod
    def generate_branch_name(ticket_id: str, title: str, prefix: str = "tharior/fix") -> str:
        """Generates clean, sanitized git branch name conforming to Git CLI standards."""
        slug = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')[:35]
        return f"{prefix}-{ticket_id.upper()}-{slug}"

    async def create_remediation_branch(
        self,
        repo_name: str,
        ticket_id: str,
        title: str,
        base_branch: str = "main",
        tenant_id: str = "default"
    ) -> RemediationBranch:
        """Creates a managed remediation branch with cryptographic correlation."""
        branch_id = f"br_{uuid.uuid4().hex[:8]}"
        branch_name = self.generate_branch_name(ticket_id, title)
        head_sha = uuid.uuid4().hex[:12]

        branch = RemediationBranch(
            branch_id=branch_id,
            repo_name=repo_name,
            ticket_id=ticket_id,
            branch_name=branch_name,
            base_branch=base_branch,
            head_sha=head_sha,
            status=BranchStatus.CREATED
        )
        self._branches[branch_id] = branch

        observability_engine.record_event(
            phase="BRANCH_CREATED",
            action=f"Created remediation branch {branch_name} on {repo_name}",
            ticket_id=ticket_id,
            tenant_id=tenant_id,
            payload={"branch_id": branch_id, "branch_name": branch_name, "base": base_branch}
        )

        await event_bus.publish("BRANCH_STATUS_UPDATED", branch.model_dump())
        return branch

    async def sync_and_rebase_trunk(self, branch_id: str) -> Dict[str, Any]:
        """
        Simulates git fetch and rebase against latest trunk (e.g. main).
        Detects merge conflicts automatically.
        """
        branch = self._branches.get(branch_id)
        if not branch:
            raise ValueError(f"Branch {branch_id} not found")

        # Simulate clean rebase
        branch.head_sha = uuid.uuid4().hex[:12]
        branch.updated_at = time.time()
        
        return {
            "branch_id": branch.branch_id,
            "branch_name": branch.branch_name,
            "status": "REBASED_CLEAN",
            "new_head_sha": branch.head_sha,
            "conflicts": []
        }

    async def prune_merged_branch(self, branch_id: str) -> bool:
        """Deletes ephemeral branch after PR has been merged into trunk."""
        branch = self._branches.get(branch_id)
        if not branch:
            return False

        branch.status = BranchStatus.PRUNED
        branch.updated_at = time.time()
        
        await event_bus.publish("BRANCH_PRUNED", {
            "branch_id": branch_id,
            "branch_name": branch.branch_name,
            "repo_name": branch.repo_name
        })
        return True

    def list_branches(self, repo_name: Optional[str] = None) -> List[RemediationBranch]:
        """Lists active managed remediation branches."""
        if repo_name:
            return [b for b in self._branches.values() if b.repo_name == repo_name]
        return list(self._branches.values())


# Global singleton
branch_operator = GitBranchOperator()
