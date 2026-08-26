"""
Unit & Integration Tests for OpenRouter Dynamic Model Catalog,
Weekly Ingestion, Free Model Support, Customer Tier Overrides (±1-2 Tiers), and Multimodal Tiering.
"""

import pytest
from app.services.llm_pricing_service import llm_pricing_service, TIER_ORDER
from app.models.agent import (
    TierLevel,
    CustomerTierOverrideConfig,
    ModalityType
)


@pytest.mark.asyncio
async def test_baseline_catalog_and_free_models():
    """Validates baseline catalog contains free and paid models."""
    res = llm_pricing_service.get_catalog_models(limit=200)
    assert res["total"] > 0
    
    # Check free models filter
    free_res = llm_pricing_service.get_catalog_models(free_only=True)
    assert free_res["total"] >= 4
    for model in free_res["models"]:
        assert model.is_free is True


@pytest.mark.asyncio
async def test_catalog_search_and_modality_filters():
    """Validates searching and filtering by modality (audio, video, image, text)."""
    text_res = llm_pricing_service.get_catalog_models(modality="text")
    assert text_res["total"] > 0

    image_res = llm_pricing_service.get_catalog_models(modality="image")
    assert image_res["total"] > 0

    search_res = llm_pricing_service.get_catalog_models(search="llama")
    assert search_res["total"] >= 1
    assert "llama" in search_res["models"][0].id.lower()


@pytest.mark.asyncio
async def test_customer_tier_override_enforces_plus_minus_2_tiers():
    """Validates that customer tier shifts are clamped to ±2 tiers maximum."""
    # Try shifting by +5 and -4 (should be clamped to +2 and -2)
    config = CustomerTierOverrideConfig(
        tier_shifts={
            "openai/gpt-4o-mini": 5,   # Tier 3 -> should clamp to +2 (Tier 5)
            "openai/o1": -4            # Tier 9 -> should clamp to -2 (Tier 7)
        },
        prefer_free_models=True
    )
    apply_res = llm_pricing_service.apply_customer_override(config)
    assert apply_res["status"] == "APPLIED"

    catalog = llm_pricing_service.get_catalog_models()
    gpt4o_mini = next(m for m in catalog["models"] if m.id == "openai/gpt-4o-mini")
    o1 = next(m for m in catalog["models"] if m.id == "openai/o1")

    # Baseline GPT-4o mini is Tier 2 (Ultra-Fast) -> shifted +2 is Tier 4 (Mid Generalist)
    assert gpt4o_mini.user_override_tier == TierLevel.TIER_4_MID_GENERALIST
    # Baseline o1 is Tier 8 (Senior Architect) -> shifted -2 is Tier 6 (Core Workhorse)
    assert o1.user_override_tier == TierLevel.TIER_6_CORE_WORKHORSE


@pytest.mark.asyncio
async def test_multimodal_tiers_structure():
    """Validates separate multimodal tier specs for Audio, Video, Image."""
    mm_tiers = llm_pricing_service.get_multimodal_tiers()
    assert len(mm_tiers) >= 6

    modalities = {t.modality for t in mm_tiers}
    assert ModalityType.AUDIO in modalities
    assert ModalityType.VIDEO in modalities
    assert ModalityType.IMAGE in modalities


@pytest.mark.asyncio
async def test_registry_config_update():
    """Validates updating source URL and refresh window."""
    cfg = llm_pricing_service.update_config(
        source_url="https://openrouter.ai/api/v1/models",
        cache_ttl_seconds=86400 * 7
    )
    assert cfg["source_url"] == "https://openrouter.ai/api/v1/models"
    assert cfg["refresh_interval_days"] == 7.0
