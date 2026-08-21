"""
Anvesh Unified Storage MCP Server.
Exposes Vector Search, AST Code Indexing, and Knowledge Graph Traversal as standard MCP Tools.
"""

from typing import Dict, Any, List, Optional
from app.services.anvesh_client import anvesh_client


class AnveshStorageMCPServer:
    """Stateless MCP tool implementation for Anvesh Search Engine & Knowledge Graph."""

    @staticmethod
    async def vector_search(
        collection: str,
        query: str,
        top_k: int = 5,
        metadata_filter: Optional[Dict[str, Any]] = None,
        tenant_id: str = "default",
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Performs semantic vector similarity search in Anvesh."""
        results = anvesh_client.search_vectors(
            collection_name=collection,
            query=query,
            top_k=top_k,
            metadata_filter=metadata_filter,
            tenant_id=tenant_id,
            user_id=user_id
        )
        return {
            "server": "anvesh-storage",
            "tool": "vector_search",
            "collection": collection,
            "query": query,
            "results_count": len(results),
            "results": results
        }

    @staticmethod
    async def index_code(
        collection: str,
        item_id: str,
        code_content: str,
        metadata: Optional[Dict[str, Any]] = None,
        tenant_id: str = "default",
        user_id: str = "default"
    ) -> Dict[str, Any]:
        """Indexes a source code snippet or AST chunk into Anvesh Vector DB."""
        vector = anvesh_client._generate_deterministic_embedding(code_content)
        success = anvesh_client.insert_vector(
            collection_name=collection,
            item_id=item_id,
            vector=vector,
            content=code_content,
            metadata=metadata,
            tenant_id=tenant_id,
            user_id=user_id
        )
        return {
            "server": "anvesh-storage",
            "tool": "index_code",
            "success": success,
            "item_id": item_id,
            "collection": collection
        }

    @staticmethod
    async def query_knowledge_graph(
        root_symbol: str,
        depth: int = 2,
        tenant_id: str = "default"
    ) -> Dict[str, Any]:
        """Extracts AST nodes and dependency subgraphs from Anvesh Knowledge Graph."""
        subgraph = anvesh_client.query_graph_subgraph(
            root_id=root_symbol,
            max_depth=depth,
            tenant_id=tenant_id
        )
        return {
            "server": "anvesh-storage",
            "tool": "query_knowledge_graph",
            "subgraph": subgraph
        }

    @staticmethod
    async def get_call_hierarchy(
        symbol_name: str,
        tenant_id: str = "default"
    ) -> Dict[str, Any]:
        """Traverses callers and callees for a target symbol in Anvesh Knowledge Graph."""
        return anvesh_client.get_call_hierarchy(symbol_name=symbol_name, tenant_id=tenant_id)
