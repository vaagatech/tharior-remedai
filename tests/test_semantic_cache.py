"""
Unit & Integration Tests for Semantic Cache Service.
"""

import pytest
from app.services.semantic_cache import semantic_cache, tokenize_text, compute_cosine_similarity
from app.services.llm_router import llm_router


@pytest.mark.asyncio
async def test_tokenize_and_cosine_similarity():
    """Validates tokenization and vector similarity calculation."""
    text1 = "Fix SQL injection vulnerability in user repository"
    text2 = "Fix SQL injection vulnerability in auth user repository"
    text3 = "Generate CSS responsive flexbox layout for navbar"

    from collections import Counter
    v1 = Counter(tokenize_text(text1))
    v2 = Counter(tokenize_text(text2))
    v3 = Counter(tokenize_text(text3))

    sim_high = compute_cosine_similarity(v1, v2)
    sim_low = compute_cosine_similarity(v1, v3)

    assert sim_high > 0.80
    assert sim_low < 0.20


@pytest.mark.asyncio
async def test_semantic_cache_store_and_lookup():
    """Validates storing a remediation and hitting it with semantic similarity."""
    semantic_cache.clear()
    
    query = "Remediate race condition in Redis distributed lock acquisition"
    response = "def acquire_lock_with_jitter(): pass"
    
    semantic_cache.store(
        query_text=query,
        response_content=response,
        model_used="deepseek/deepseek-chat:free",
        tokens_in=1000,
        tokens_out=250,
        cost_usd=0.0005
    )

    # Exact query hit
    is_hit, entry, score = semantic_cache.lookup(query)
    assert is_hit is True
    assert entry["response_content"] == response
    assert score >= 0.99

    # Near semantic query hit
    near_query = "Remediate race condition in Redis distributed lock acquisition algorithm"
    is_hit_near, entry_near, score_near = semantic_cache.lookup(near_query)
    assert is_hit_near is True
    assert score_near > 0.90

    # Cache stats verification
    stats = semantic_cache.get_stats()
    assert stats["cache_hits"] >= 2
    assert stats["total_tokens_saved"] >= 2500
