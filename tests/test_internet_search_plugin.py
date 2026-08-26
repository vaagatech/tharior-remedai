"""
Unit & Integration Tests for Internet Search Tool Plugin.
"""

import pytest
from app.services.internet_search_plugin import internet_search_plugin


@pytest.mark.asyncio
async def test_search_plugin_execution_and_summary():
    """Validates search execution and concise summary creation."""
    internet_search_plugin.set_enabled(True)
    res = await internet_search_plugin.search("FastAPI pydantic model_dump migration")
    
    assert res.is_enabled is True
    assert res.results_count > 0
    assert len(res.concise_summary) > 10
    assert "FastAPI" in res.concise_summary or "Pydantic" in res.concise_summary or "Context" in res.concise_summary


@pytest.mark.asyncio
async def test_search_plugin_toggle():
    """Validates disabling and enabling search plugin."""
    internet_search_plugin.set_enabled(False)
    disabled_res = await internet_search_plugin.search("Python asyncio lock")
    
    assert disabled_res.is_enabled is False
    assert disabled_res.results_count == 0
    assert "DISABLED" in disabled_res.concise_summary

    # Re-enable
    internet_search_plugin.set_enabled(True)
    enabled_res = await internet_search_plugin.search("Python asyncio lock")
    assert enabled_res.is_enabled is True
