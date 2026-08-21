"""
Unit and Integration Tests for 10-Tier Dynamic LLM Engine and Multi-Dimensional Specialization Service.
"""

import pytest
from app.models.agent import TierLevel
from app.services.llm_pricing_service import llm_pricing_service
from app.services.tiered_engine import agent_engine
from app.models.ticket import TicketPayload


def test_10_tier_spec_definitions():
    tiers = llm_pricing_service.get_all_tiers()
    assert len(tiers) == 10
    
    tier_numbers = [t.tier_number for t in tiers]
    assert sorted(tier_numbers) == list(range(1, 11))

    # Verify Tier 1 is cheapest and Tier 10 is highest capability
    t1 = llm_pricing_service.get_tier_spec(TierLevel.TIER_1_MICRO_LINT)
    t10 = llm_pricing_service.get_tier_spec(TierLevel.TIER_10_ELITE_CONSENSUS)
    assert t1.input_cost_per_1m_usd < t10.input_cost_per_1m_usd

    # Verify Multi-Dimensional Benchmark & Specialization attributes
    for tier in tiers:
        assert tier.functional_specialization != ""
        assert tier.knowledge_vs_reasoning != ""
        assert "humaneval" in tier.benchmarks or "swe_bench_verified" in tier.benchmarks


@pytest.mark.asyncio
async def test_10_tier_classification_heuristics():
    # Tier 1 test (Documentation & Syntax Lint)
    ticket1 = TicketPayload(
        ticket_id="T-1",
        title="Fix typo and formatting in README doc",
        description="Just a typo fix in markdown comments",
        repo_name="org/service"
    )
    tier1, _, _, _ = await agent_engine.classify_ticket(ticket1)
    assert tier1 == TierLevel.TIER_1_MICRO_LINT

    # Tier 2 test (Ultra-Fast Docstrings / Variable renames)
    ticket2 = TicketPayload(
        ticket_id="T-2",
        title="Generate docstrings and rename variable in helper",
        description="Add missing docstrings and update release note formatting",
        repo_name="org/service"
    )
    tier2, _, _, _ = await agent_engine.classify_ticket(ticket2)
    assert tier2 == TierLevel.TIER_2_ULTRA_FAST

    # Tier 3 test (Economy Coder - Unit test assertion)
    ticket3 = TicketPayload(
        ticket_id="T-3",
        title="Fix unit test assertion in helper function",
        description="Update regex assertion in test_parser",
        repo_name="org/service"
    )
    tier3, _, _, _ = await agent_engine.classify_ticket(ticket3)
    assert tier3 == TierLevel.TIER_3_ECONOMY_CODER

    # Tier 5 test (State machine / retry)
    ticket5 = TicketPayload(
        ticket_id="T-5",
        title="Implement exponential retry loop for rate limit handling",
        description="Add backoff retry policy to prevent 429 errors",
        repo_name="org/service"
    )
    tier5, _, _, _ = await agent_engine.classify_ticket(ticket5)
    assert tier5 == TierLevel.TIER_5_FAST_REASONER

    # Tier 7 test (Concurrency / Deadlock)
    ticket7 = TicketPayload(
        ticket_id="T-7",
        title="Fix race condition and deadlock in distributed lock manager",
        description="Deadlock occurs under concurrent worker acquisition",
        repo_name="org/service"
    )
    tier7, _, _, _ = await agent_engine.classify_ticket(ticket7)
    assert tier7 == TierLevel.TIER_7_DEEP_REASONER

    # Tier 8 test (Architecture refactor)
    ticket8 = TicketPayload(
        ticket_id="T-8",
        title="Multi-service architecture refactor and schema migration",
        description="Migrate auth contracts across 4 microservices",
        repo_name="org/service"
    )
    tier8, _, _, _ = await agent_engine.classify_ticket(ticket8)
    assert tier8 == TierLevel.TIER_8_SENIOR_ARCHITECT


@pytest.mark.asyncio
async def test_pricing_service_weekly_refresh():
    # Force refresh simulation
    res = await llm_pricing_service.fetch_and_update_pricing(force=True)
    assert res["status"] in ["UPDATED", "CACHED"]
    assert "tiers" in res
    assert len(res["tiers"]) == 10
