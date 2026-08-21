"""
Unit and Integration Tests for KEDA Operator and Git Branch Lifecycle Operator.
"""

import pytest
from app.core.keda_operator import keda_operator
from app.core.branch_operator import branch_operator, BranchStatus


@pytest.mark.asyncio
async def test_keda_operator_status_and_provisioning():
    # Test scaler status retrieval
    status = keda_operator.get_scaler_status()
    assert status.scaler_id == "keda-scaler-prod-01"
    assert status.max_replicas == 40

    # Test dynamic single-tenant ephemeral job provisioning
    job = await keda_operator.provision_isolated_worker_pod(
        task_id="task_keda_01",
        tenant_id="tenant-alpha",
        tier_level="tier-8",
        memory_limit="512Mi"
    )
    assert job.job_id.startswith("job_")
    assert job.status == "RUNNING"
    assert job.pod_name.startswith("tharior-worker-")

    # Test job listing
    active = keda_operator.list_active_jobs(tenant_id="tenant-alpha")
    assert any(j.job_id == job.job_id for j in active)

    # Test job termination
    terminated = await keda_operator.terminate_worker_pod(job.job_id, success=True)
    assert terminated is True


@pytest.mark.asyncio
async def test_git_branch_lifecycle_operator():
    # Test branch naming convention
    name = branch_operator.generate_branch_name("GH-4491", "Fix stripe webhook npe")
    assert name == "tharior/fix-GH-4491-fix-stripe-webhook-npe"

    # Test branch creation
    branch = await branch_operator.create_remediation_branch(
        repo_name="org/payments-service",
        ticket_id="GH-4491",
        title="Fix stripe webhook npe",
        tenant_id="tenant-alpha"
    )
    assert branch.branch_id.startswith("br_")
    assert branch.status == BranchStatus.CREATED
    assert branch.branch_name == name

    # Test trunk sync & rebase
    rebase_res = await branch_operator.sync_and_rebase_trunk(branch.branch_id)
    assert rebase_res["status"] == "REBASED_CLEAN"

    # Test branch pruning after merge
    pruned = await branch_operator.prune_merged_branch(branch.branch_id)
    assert pruned is True
    assert branch.status == BranchStatus.PRUNED
