"""
Standardized MCP Client.
Dispatches JSON-RPC 2.0 tool calls to registered stateless MCP servers
(Anvesh Storage, Knowledge Graph, Sandbox Runner, Git PR Engine, Browser Subagent, Telemetry).
"""

import time
from typing import Dict, Any, Optional
from app.mcp.servers.anvesh_storage import AnveshStorageMCPServer
from app.mcp.servers.knowledge_graph import KnowledgeGraphMCPServer
from app.mcp.servers.sandbox_runner import SandboxRunnerMCPServer
from app.mcp.servers.git_engine import GitEngineMCPServer
from app.mcp.servers.telemetry import TelemetryMCPServer
from app.mcp.servers.browser_subagent import BrowserSubagentMCPServer


class MCPClient:
    """Unified client for invoking Model Context Protocol tools."""

    @staticmethod
    async def execute(server: str, tool: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a tool on the designated MCP server.
        
        Supported Servers:
          - 'anvesh-storage': Anvesh Vector Search, Code Indexing & Knowledge Graph
          - 'graph-okf': Code AST and dependency lookups (backed by Anvesh)
          - 'sandbox-runner': Ephemeral PyTest/Linter execution
          - 'git-engine': Git branching and PR creation
          - 'browser-subagent': Headless browser navigation, screenshots & DOM audits
          - 'telemetry-engine': Cost & token metrics recording
        """
        if server == "anvesh-storage":
            if tool == "vector_search":
                return await AnveshStorageMCPServer.vector_search(
                    collection=params.get("collection", "codebase"),
                    query=params.get("query", ""),
                    top_k=params.get("top_k", 5),
                    metadata_filter=params.get("metadata_filter"),
                    tenant_id=params.get("tenant_id", "default"),
                    user_id=params.get("user_id")
                )
            elif tool == "index_code":
                return await AnveshStorageMCPServer.index_code(
                    collection=params.get("collection", "codebase"),
                    item_id=params.get("item_id", "item_1"),
                    code_content=params.get("code_content", ""),
                    metadata=params.get("metadata"),
                    tenant_id=params.get("tenant_id", "default"),
                    user_id=params.get("user_id", "default")
                )
            elif tool == "query_knowledge_graph":
                return await AnveshStorageMCPServer.query_knowledge_graph(
                    root_symbol=params.get("root_symbol", ""),
                    depth=params.get("depth", 2),
                    tenant_id=params.get("tenant_id", "default")
                )
            elif tool == "get_call_hierarchy":
                return await AnveshStorageMCPServer.get_call_hierarchy(
                    symbol_name=params.get("symbol_name", ""),
                    tenant_id=params.get("tenant_id", "default")
                )

        elif server == "graph-okf":
            if tool == "query_ast":
                return await KnowledgeGraphMCPServer.query_ast(
                    repo=params.get("repo", ""),
                    query=params.get("query", ""),
                    tenant_id=params.get("tenant_id", "default")
                )

        elif server == "sandbox-runner":
            if tool == "run_pytest":
                return await SandboxRunnerMCPServer.run_pytest(
                    patch=params.get("patch", ""),
                    test_filter=params.get("test_filter", "")
                )
            elif tool == "run_linter":
                return await SandboxRunnerMCPServer.run_linter(
                    files=params.get("files", [])
                )

        elif server == "git-engine":
            if tool == "create_pr":
                return await GitEngineMCPServer.create_pr(
                    repo=params.get("repo", ""),
                    patch=params.get("patch", ""),
                    title=params.get("title", ""),
                    description=params.get("description", "")
                )

        elif server == "browser-subagent":
            if tool == "navigate_url":
                return await BrowserSubagentMCPServer.navigate_url(
                    url=params.get("url", "http://localhost:5173"),
                    wait_until=params.get("wait_until", "networkidle")
                )
            elif tool == "capture_screenshot":
                return await BrowserSubagentMCPServer.capture_screenshot(
                    url=params.get("url", "http://localhost:5173"),
                    selector=params.get("selector")
                )
            elif tool == "audit_accessibility_and_dom":
                res = await BrowserSubagentMCPServer.audit_accessibility_and_dom(
                    url=params.get("url", "http://localhost:5173")
                )
                return res.model_dump()

        elif server == "telemetry-engine":
            if tool in ("record_metric", "record_task_execution", "record_cost"):
                return await TelemetryMCPServer.record_task_execution(
                    task_id=params.get("task_id", ""),
                    ticket_id=params.get("ticket_id", ""),
                    model=params.get("model", ""),
                    tier=params.get("tier", "nano"),
                    cost_usd=params.get("cost_usd", 0.0),
                    latency_ms=params.get("latency_ms", 0.0),
                    input_tokens=params.get("input_tokens", 0),
                    output_tokens=params.get("output_tokens", 0),
                    success=params.get("success", True)
                )

        raise ValueError(f"Unknown MCP tool invocation: server '{server}', tool '{tool}'")
