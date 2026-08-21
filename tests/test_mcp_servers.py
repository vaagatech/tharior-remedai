"""
Tests for MCP Tools and JSON-RPC dispatch via MCPClient.
"""

import pytest
from app.mcp.client import MCPClient


@pytest.mark.asyncio
async def test_knowledge_graph_mcp():
    res = await MCPClient.execute("graph-okf", "query_ast", {"repo": "org/payments-service"})
    assert res["server"] == "graph-okf"
    assert "ast_context" in res
    assert res["symbol_count"] > 0
    assert "dependencies" in res


@pytest.mark.asyncio
async def test_sandbox_runner_mcp():
    patch = "--- a/src/test.py\n+++ b/src/test.py\n@@ -1,1 +1,2 @@\n def fix(): pass"
    res = await MCPClient.execute("sandbox-runner", "run_pytest", {"patch": patch})
    assert res["server"] == "sandbox-runner"
    assert res["tests_passed"] is True
    assert res["exit_code"] == 0
    assert "test_suites" in res


@pytest.mark.asyncio
async def test_git_engine_mcp():
    res = await MCPClient.execute("git-engine", "create_pr", {
        "repo": "org/payments-service",
        "patch": "diff --git a/test.py",
        "title": "fix: resolve retry bug"
    })
    assert res["server"] == "git-engine"
    assert "pr_url" in res
    assert res["status"] == "OPEN"
    assert res["repo"] == "org/payments-service"


@pytest.mark.asyncio
async def test_telemetry_mcp():
    res = await MCPClient.execute("telemetry-engine", "record_metric", {
        "task_id": "t_100",
        "ticket_id": "GH-100",
        "model": "gemini-1.5-flash-8b",
        "tier": "nano",
        "cost_usd": 0.0001,
        "latency_ms": 50.0,
        "input_tokens": 500,
        "output_tokens": 100,
        "success": True
    })
    assert res["server"] == "telemetry-engine"
    assert res["recorded"] is True
