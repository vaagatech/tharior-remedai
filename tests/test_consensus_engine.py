"""
Unit & Integration Tests for Tier 10 Multi-Model Consensus Engine.
"""

import pytest
from app.services.consensus_engine import ConsensusEngine


@pytest.mark.asyncio
async def test_multi_model_consensus_resolution():
    engine = ConsensusEngine()
    resolution = await engine.resolve_with_consensus(
        ticket_id="GH-SEC-99",
        task_title="Fix Critical Distributed Race Condition in Payment Processor",
        task_description="Concurrent webhooks overwrite transaction state without optimistic lock.",
        ast_context="class PaymentProcessor: async def handle(self): ...",
        tenant_id="tenant-sec"
    )
    assert resolution.resolution_id.startswith("cons_")
    assert resolution.ticket_id == "GH-SEC-99"
    assert len(resolution.participating_models) == 3
    assert len(resolution.proposals) == 3
    assert resolution.winning_patch is not None
    assert resolution.consensus_agreement_pct >= 33.3
    assert resolution.total_cost_usd > 0
