"""
Standardized MCP Client.
Dispatches JSON-RPC 2.0 tool calls to registered stateless MCP servers
(Anvesh Storage, Knowledge Graph, Sandbox Runner, Git PR Engine, Telemetry).
"""

import time
from typing import Dict, Any, Optional
from app.mcp.servers.anvesh_storage import AnveshStorageMCPServer
from app.mcp.servers.knowledge_graph import KnowledgeGraphMCPServer
from app.mcp.servers.sandbox_runner import SandboxRunnerMCPServer
from app.mcp.servers.git_engine import GitEngineMCPServer
from app.mcp.servers.telemetry import TelemetryMCPServer


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
                    repo=params.get("repo", "default"),
                    query=params.get("query", ""),
                    file_path=params.get("file_path", ""),
                    tenant_id=params.get("tenant_id", "default")
                )
            elif tool == "get_call_graph":
                return await KnowledgeGraphMCPServer.get_call_graph(
                    repo=params.get("repo", "default"),
                    target_symbol=params.get("target_symbol", ""),
                    tenant_id=params.get("tenant_id", "default")
                )

        elif server == "sandbox-runner":
            if tool == "run_pytest":
                return await SandboxRunnerMCPServer.run_pytest(
                    patch=params.get("patch", ""),
                    test_filter=params.get("test_filter", ""),
                    timeout_sec=params.get("timeout_sec", 30)
                )
            elif tool == "run_linter":
                return await SandboxRunnerMCPServer.run_linter(
                    file_content=params.get("file_content", ""),
                    linter=params.get("linter", "ruff")
                )

        elif server == "git-engine":
            if tool == "create_branch":
                return await GitEngineMCPServer.create_branch(
                    repo=params.get("repo", "default"),
                    base_branch=params.get("base_branch", "main"),
                    branch_name=params.get("branch_name", "")
                )
            elif tool == "create_pr":
                return await GitEngineMCPServer.create_pr(
                    repo=params.get("repo", "default"),
                    patch=params.get("patch", ""),
                    title=params.get("title", "Autonomous Agent Remediation"),
                    description=params.get("description", ""),
                    branch_name=params.get("branch_name", "")
                )

        elif server == "telemetry-engine":
            if tool == "record_metric":
                return await TelemetryMCPServer.record_task_execution(
                    task_id=params.get("task_id", ""),
                    ticket_id=params.get("ticket_id", ""),
                    model=params.get("model", ""),
                    tier=params.get("tier", "tier_4_mid_generalist"),
                    cost_usd=params.get("cost_usd", 0.0),
                    latency_ms=params.get("latency_ms", 0.0),
                    input_tokens=params.get("input_tokens", 0),
                    output_tokens=params.get("output_tokens", 0),
                    success=params.get("success", True)
                )

        return {"status": "UNKNOWN_TOOL", "server": server, "tool": tool}
