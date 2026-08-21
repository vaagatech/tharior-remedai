"""
Unit Tests for Straight vs Gateway Dual LLM Router.
"""

import pytest
from app.services.llm_router import llm_router


@pytest.mark.asyncio
async def test_gateway_route_execution():
    messages = [{"role": "user", "content": "What is the meaning of life?"}]
    res = await llm_router.chat_completion(
        model="openai/gpt-4o",
        messages=messages,
        routing_mode="GATEWAY"
    )
    assert res["content"] is not None
    assert res["model"] == "openai/gpt-4o"
    assert "prompt_tokens" in res
    assert "completion_tokens" in res
    assert "cost_usd" in res
    assert "latency_ms" in res
    assert res["routing_mode"] in ["GATEWAY", "SYNTHESIZED_FALLBACK"]


@pytest.mark.asyncio
async def test_straight_route_execution():
    messages = [{"role": "user", "content": "Generate unit test"}]
    res = await llm_router.chat_completion(
        model="anthropic/claude-3-5-haiku",
        messages=messages,
        routing_mode="STRAIGHT"
    )
    assert res["content"] is not None
    assert res["routing_mode"] in ["STRAIGHT", "SYNTHESIZED_FALLBACK"]
