"""
Unit & Integration Tests for Autonomous Visual Browser Subagent MCP Server.
"""

import pytest
from app.mcp.servers.browser_subagent import BrowserSubagentMCPServer
from app.mcp.client import MCPClient


@pytest.mark.asyncio
async def test_browser_navigation():
    res = await BrowserSubagentMCPServer.navigate_url("http://localhost:5173")
    assert res["status_code"] == 200
    assert "HTML5 DOM tree" in res["dom_summary"]
    assert res["latency_ms"] > 0


@pytest.mark.asyncio
async def test_browser_screenshot_capture():
    res = await BrowserSubagentMCPServer.capture_screenshot("http://localhost:5173", selector="#root")
    assert res["format"] == "image/svg+xml"
    assert "<svg" in res["screenshot_svg"]
    assert res["width"] == 800


@pytest.mark.asyncio
async def test_browser_accessibility_audit():
    audit = await BrowserSubagentMCPServer.audit_accessibility_and_dom("http://localhost:5173")
    assert audit.status_code == 200
    assert audit.accessibility_score >= 90
    assert audit.dom_elements_count > 0
    assert len(audit.accessibility_violations) >= 0


@pytest.mark.asyncio
async def test_browser_mcp_client_dispatch():
    res = await MCPClient.execute(
        "browser-subagent",
        "audit_accessibility_and_dom",
        {"url": "http://localhost:5173"}
    )
    assert res["status_code"] == 200
    assert "accessibility_violations" in res
