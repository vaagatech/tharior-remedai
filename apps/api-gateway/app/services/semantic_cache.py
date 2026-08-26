"""
Semantic Query & Remediation Cache Service.
Provides high-speed vector / token-similarity caching for user queries and code remediation requests.
Dramatically reduces LLM token costs and latencies by returning validated past remediations
when incoming queries have high semantic cosine similarity (> 0.92).
"""

import time
import math
import hashlib
import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import Counter
from app.models.agent import SemanticCacheConfig
from app.services.anvesh_client import anvesh_client

logger = logging.getLogger("semantic_cache")


def tokenize_text(text: str) -> List[str]:
    """Tokenizes text into normalized word n-grams for semantic similarity matching."""
    import re
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    words = [w for w in cleaned.split() if len(w) > 2]
    return words


def compute_cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """Computes cosine similarity between two term-frequency vectors."""
    intersection = set(vec_a.keys()) & set(vec_b.keys())
    dot_product = sum(vec_a[x] * vec_b[x] for x in intersection)
    
    norm_a = math.sqrt(sum(val ** 2 for val in vec_a.values()))
    norm_b = math.sqrt(sum(val ** 2 for val in vec_b.values()))
    
    if not norm_a or not norm_b:
        return 0.0
    return dot_product / (norm_a * norm_b)


class SemanticCacheService:
    """
    Semantic Caching Engine for Autonomous Remediation queries.
    Saves prompts, AST context, generated patches, and execution reports.
    """

    def __init__(self):
        self.config = SemanticCacheConfig()
        self._cache_entries: List[Dict[str, Any]] = []
        self._stats = {
            "total_queries": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "total_tokens_saved": 0,
            "total_cost_saved_usd": 0.0
        }
        self._load_from_storage()

    def _load_from_storage(self):
        """Loads semantic cache entries and cumulative metrics from Anvesh Unified Storage."""
        cached_data = anvesh_client.get_document("semantic_cache", "active_cache_index")
        if cached_data:
            self._cache_entries = cached_data.get("entries", [])
            self._stats = cached_data.get("stats", self._stats)
            logger.info(f"Loaded {len(self._cache_entries)} entries into Semantic Cache from Anvesh.")

    def _persist_to_storage(self):
        """Persists cache index and metrics to Anvesh."""
        payload = {
            "entries": self._cache_entries[-self.config.max_entries:],
            "stats": self._stats,
            "updated_at": time.time()
        }
        anvesh_client.store_document("semantic_cache", "active_cache_index", payload)

    def lookup(self, query_text: str, context_repo: str = "default") -> Tuple[bool, Optional[Dict[str, Any]], float]:
        """
        Looks up incoming query in semantic cache using TF-IDF / term cosine similarity.
        Returns (is_hit, cached_entry, similarity_score).
        """
        self._stats["total_queries"] += 1
        if not self.config.enabled or not query_text.strip():
            self._stats["cache_misses"] += 1
            return False, None, 0.0

        query_tokens = tokenize_text(query_text)
        if not query_tokens:
            self._stats["cache_misses"] += 1
            return False, None, 0.0

        query_tf = Counter(query_tokens)
        best_entry: Optional[Dict[str, Any]] = None
        best_score = 0.0
        now = time.time()

        for entry in self._cache_entries:
            # Check TTL
            if (now - entry.get("created_at", 0)) > self.config.ttl_seconds:
                continue
            
            # Match repo context if provided
            if entry.get("repo_name") and entry.get("repo_name") != context_repo:
                continue

            entry_tf = entry.get("token_vector", {})
            similarity = compute_cosine_similarity(query_tf, entry_tf)

            if similarity > best_score:
                best_score = similarity
                best_entry = entry

        if best_entry and best_score >= self.config.similarity_threshold:
            self._stats["cache_hits"] += 1
            tokens_saved = best_entry.get("tokens_in", 0) + best_entry.get("tokens_out", 0)
            cost_saved = best_entry.get("cost_usd", 0.0)
            
            self._stats["total_tokens_saved"] += tokens_saved
            self._stats["total_cost_saved_usd"] += cost_saved
            
            logger.info(f"Semantic Cache HIT (Score: {best_score:.3f}) for query '{query_text[:40]}...'")
            return True, best_entry, best_score

        self._stats["cache_misses"] += 1
        return False, None, best_score

    def store(
        self,
        query_text: str,
        response_content: str,
        patch_diff: Optional[str] = None,
        model_used: str = "openai/gpt-4o",
        repo_name: str = "default",
        tokens_in: int = 0,
        tokens_out: int = 0,
        cost_usd: float = 0.0
    ):
        """Stores query and LLM remediation solution in the semantic cache."""
        if not self.config.enabled:
            return

        words = tokenize_text(query_text)
        token_vector = dict(Counter(words))
        entry_id = hashlib.sha256(query_text.encode("utf-8")).hexdigest()[:16]

        entry = {
            "entry_id": entry_id,
            "query_text": query_text,
            "response_content": response_content,
            "patch_diff": patch_diff,
            "model_used": model_used,
            "repo_name": repo_name,
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "cost_usd": cost_usd,
            "token_vector": token_vector,
            "created_at": time.time()
        }

        # Avoid exact duplicate entries
        self._cache_entries = [e for e in self._cache_entries if e.get("entry_id") != entry_id]
        self._cache_entries.append(entry)

        # Enforce max limit
        if len(self._cache_entries) > self.config.max_entries:
            self._cache_entries = self._cache_entries[-self.config.max_entries:]

        self._persist_to_storage()

    def get_stats(self) -> Dict[str, Any]:
        """Returns cache telemetry and savings metrics."""
        total = self._stats["total_queries"]
        hits = self._stats["cache_hits"]
        hit_rate_pct = round((hits / total * 100), 2) if total > 0 else 0.0

        return {
            "enabled": self.config.enabled,
            "similarity_threshold": self.config.similarity_threshold,
            "active_cached_entries": len(self._cache_entries),
            "total_queries": total,
            "cache_hits": hits,
            "cache_misses": self._stats["cache_misses"],
            "hit_rate_pct": hit_rate_pct,
            "total_tokens_saved": self._stats["total_tokens_saved"],
            "total_cost_saved_usd": round(self._stats["total_cost_saved_usd"], 4)
        }

    def update_config(self, enabled: Optional[bool] = None, threshold: Optional[float] = None, ttl_seconds: Optional[int] = None) -> Dict[str, Any]:
        """Updates semantic cache settings."""
        if enabled is not None:
            self.config.enabled = enabled
        if threshold is not None:
            self.config.similarity_threshold = max(0.5, min(1.0, threshold))
        if ttl_seconds is not None:
            self.config.ttl_seconds = ttl_seconds
        return self.get_stats()

    def clear(self):
        """Clears all cached entries."""
        self._cache_entries = []
        self._persist_to_storage()


# Global Semantic Cache Singleton
semantic_cache = SemanticCacheService()
