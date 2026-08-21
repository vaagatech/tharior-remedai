"""
Unit and Integration Tests for Anvesh Unified Storage (Vector DB & Knowledge Graph).
"""

import pytest
from app.services.anvesh_client import anvesh_client
from app.mcp.client import MCPClient


def test_anvesh_vector_insert_and_search():
    # Insert code vectors for tenant-1
    anvesh_client.insert_vector(
        collection_name="test_codebase",
        item_id="fn_1",
        vector=anvesh_client._generate_deterministic_embedding("def process_payment(amount, currency): pass"),
        content="def process_payment(amount, currency): pass",
        metadata={"file": "src/pay.py", "type": "function"},
        tenant_id="tenant_alpha",
        user_id="user_1"
    )

    anvesh_client.insert_vector(
        collection_name="test_codebase",
        item_id="fn_2",
        vector=anvesh_client._generate_deterministic_embedding("def calculate_tax(subtotal, rate): return subtotal * rate"),
        content="def calculate_tax(subtotal, rate): return subtotal * rate",
        metadata={"file": "src/tax.py", "type": "function"},
        tenant_id="tenant_alpha",
        user_id="user_1"
    )

    # Search in tenant_alpha
    results = anvesh_client.search_vectors(
        collection_name="test_codebase",
        query="process payment transaction",
        top_k=2,
        tenant_id="tenant_alpha",
        user_id="user_1"
    )
    assert len(results) >= 1
    assert results[0]["id"] == "fn_1"
    assert results[0]["tenant_id"] == "tenant_alpha"

    # Search in tenant_beta (should be empty due to strict tenant isolation)
    isolated_results = anvesh_client.search_vectors(
        collection_name="test_codebase",
        query="process payment transaction",
        top_k=2,
        tenant_id="tenant_beta",
        user_id="user_2"
    )
    assert len(isolated_results) == 0


def test_anvesh_knowledge_graph_traversal():
    subgraph = anvesh_client.query_graph_subgraph("repo:org/payments-service", max_depth=2, tenant_id="default")
    assert subgraph["root"] == "repo:org/payments-service"
    assert len(subgraph["nodes"]) > 0
    assert len(subgraph["edges"]) > 0

    # Test call hierarchy
    hierarchy = anvesh_client.get_call_hierarchy("process_charge", tenant_id="default")
    assert "callers" in hierarchy
    assert "callees" in hierarchy


@pytest.mark.asyncio
async def test_anvesh_mcp_tools():
    # Test vector search MCP tool
    search_res = await MCPClient.execute("anvesh-storage", "vector_search", {
        "collection": "test_codebase",
        "query": "process payment",
        "tenant_id": "tenant_alpha"
    })
    assert search_res["server"] == "anvesh-storage"
    assert search_res["tool"] == "vector_search"

    # Test knowledge graph query MCP tool
    graph_res = await MCPClient.execute("anvesh-storage", "query_knowledge_graph", {
        "root_symbol": "repo:org/payments-service",
        "depth": 2
    })
    assert graph_res["server"] == "anvesh-storage"
    assert "subgraph" in graph_res
