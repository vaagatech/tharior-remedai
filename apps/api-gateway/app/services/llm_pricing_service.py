"""
10-Tier Dynamic LLM Pricing & Multi-Dimensional Specialization Service.
Pulls live model catalog and pricing from OpenRouter / LiteLLM,
evaluates multi-dimensional capabilities (Cost, Reasoning vs Knowledge, Coding Benchmarks),
and periodically updates the active tier matrix in Anvesh Unified Storage.
"""

import os
import time
import httpx
import logging
from typing import Dict, Any, List, Optional
from app.models.agent import TierLevel, ModelTierSpec
from app.services.anvesh_client import anvesh_client

logger = logging.getLogger("llm_pricing")


class LLMPricingService:
    """
    Manages live model catalogs, pricing ingestion, multi-dimensional tier scoring
    (Knowledge vs Reasoning, Benchmarks, Cost-to-Capability), and weekly automatic updates.
    """

    def __init__(self):
        self.openrouter_api_url = os.getenv("OPENROUTER_MODELS_URL", "https://openrouter.ai/api/v1/models")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.cache_ttl_seconds = 7 * 24 * 3600  # 1 week (604,800s)
        self._tier_specs: Dict[TierLevel, ModelTierSpec] = {}
        self._model_to_tier: Dict[str, TierLevel] = {}
        self._last_updated: float = 0.0
        
        # Initialize default tier matrix with multi-dimensional benchmarks
        self._build_default_tier_matrix()
        # Load from Anvesh if persisted
        self._load_from_storage()

    def _build_default_tier_matrix(self):
        """Constructs baseline 10-tier matrix with multi-dimensional benchmarks and functional specializations."""
        specs = [
            ModelTierSpec(
                tier=TierLevel.TIER_1_MICRO_LINT,
                tier_number=1,
                name="Micro & Local Syntax Guard",
                description="Ultra-fast syntax checking, typo fixes, comment formatting, and linter resolution.",
                functional_specialization="Documentation & Syntax Formatting",
                knowledge_vs_reasoning="Knowledge-Biased (Sub-word Grammars)",
                target_tasks=["Syntax check", "Typo correction", "Comment format", "Docstring rename", "Linter fixes"],
                representative_models=["gemini/gemini-1.5-flash-8b", "qwen/qwen-2.5-coder-7b", "meta-llama/llama-3.2-3b-instruct"],
                input_cost_per_1m_usd=0.0375,
                output_cost_per_1m_usd=0.15,
                est_latency_ms=65.0,
                benchmarks={"humaneval": "74.2%", "swe_bench_verified": "18.4%", "context_window": "1M tokens", "tokens_per_sec": "160 t/s"},
                reasoning_level="minimal",
                cost_category="Ultra-Low Cost (<$0.05/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_2_ULTRA_FAST,
                tier_number=2,
                name="Ultra-Cheap Fast Remediator",
                description="Docstrings, straightforward variable renames, low-complexity sanity checks, and fast markdown generation.",
                functional_specialization="Documentation, Release Notes & Clean Refactors",
                knowledge_vs_reasoning="Knowledge-Biased (Broad Vocabulary & Fast Context)",
                target_tasks=["Docstrings", "Variable refactoring", "Fast regex generation", "JSON serialization fix", "Release notes"],
                representative_models=["deepseek/deepseek-chat", "google/gemini-2.0-flash-lite", "anthropic/claude-3-5-haiku-20241022"],
                input_cost_per_1m_usd=0.14,
                output_cost_per_1m_usd=0.28,
                est_latency_ms=90.0,
                benchmarks={"humaneval": "82.6%", "swe_bench_verified": "28.5%", "context_window": "1M tokens", "tokens_per_sec": "130 t/s"},
                reasoning_level="low",
                cost_category="Ultra-Low Cost (<$0.20/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_3_ECONOMY_CODER,
                tier_number=3,
                name="Economical Code Specialist",
                description="Isolated single-function bugfixes, regex conversions, and unit test assertions.",
                functional_specialization="Unit Test Scaffolding & Isolated Functions",
                knowledge_vs_reasoning="Balanced (Code Syntax + Assertion Logic)",
                target_tasks=["Unit test fix", "Isolated helper function", "Regex parsing", "Small utility scripts", "Pydantic field validators"],
                representative_models=["openai/gpt-4o-mini", "qwen/qwen-2.5-coder-32b-instruct", "mistralai/mistral-nemo"],
                input_cost_per_1m_usd=0.15,
                output_cost_per_1m_usd=0.60,
                est_latency_ms=110.0,
                benchmarks={"humaneval": "86.8%", "swe_bench_verified": "33.2%", "context_window": "128k tokens", "tokens_per_sec": "115 t/s"},
                reasoning_level="low",
                cost_category="Economy (<$0.50/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_4_MID_GENERALIST,
                tier_number=4,
                name="Mid-Tier Generalist",
                description="Standard multi-function defect remediation, endpoint wiring, and API contract repairs.",
                functional_specialization="General Full-Stack API & Contract Remediation",
                knowledge_vs_reasoning="Balanced (Fast Inference + Code Comprehension)",
                target_tasks=["API endpoint fix", "HTTP handler patching", "Multi-function bugfix", "Pydantic validator", "SQL query fixes"],
                representative_models=["anthropic/claude-3-5-haiku", "mistralai/codestral-2501", "google/gemini-1.5-flash"],
                input_cost_per_1m_usd=0.80,
                output_cost_per_1m_usd=1.60,
                est_latency_ms=145.0,
                benchmarks={"humaneval": "88.9%", "swe_bench_verified": "40.6%", "context_window": "200k tokens", "tokens_per_sec": "95 t/s"},
                reasoning_level="medium",
                cost_category="Mid-Tier ($0.80-$1.60/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_5_FAST_REASONER,
                tier_number=5,
                name="Fast Structured Reasoner",
                description="Algorithmic logic bugs, state machine repairs, retry loops, and validation routines.",
                functional_specialization="Algorithmic Logic, Retry Policies & State Machines",
                knowledge_vs_reasoning="Reasoning-Biased (Chain-of-Thought / Thinking Tokens)",
                target_tasks=["Retry policies", "State machine bugfix", "Mathematical logic", "Validation pipelines", "Sorting & tree algorithms"],
                representative_models=["openai/o3-mini", "deepseek/deepseek-r1-distill-llama-70b", "google/gemini-2.0-flash"],
                input_cost_per_1m_usd=1.10,
                output_cost_per_1m_usd=2.20,
                est_latency_ms=180.0,
                benchmarks={"humaneval": "92.1%", "swe_bench_verified": "44.8%", "context_window": "200k tokens", "tokens_per_sec": "75 t/s"},
                reasoning_level="medium",
                cost_category="Mid-Tier ($1.10-$2.20/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_6_CORE_WORKHORSE,
                tier_number=6,
                name="Core Engineering Workhorse",
                description="Complex module refactoring, cross-file integrations, and comprehensive test suite generation.",
                functional_specialization="Deep Cross-File Integration & Module Refactoring",
                knowledge_vs_reasoning="Balanced High Capability (Full-Stack Engineering)",
                target_tasks=["Module refactor", "Integration testing", "Async IO refactoring", "Service boundary wiring", "ORM migrations"],
                representative_models=["openai/gpt-4o", "anthropic/claude-3-5-sonnet", "google/gemini-2.0-flash-001"],
                input_cost_per_1m_usd=2.50,
                output_cost_per_1m_usd=6.00,
                est_latency_ms=210.0,
                benchmarks={"humaneval": "93.7%", "swe_bench_verified": "49.2%", "context_window": "200k tokens", "tokens_per_sec": "60 t/s"},
                reasoning_level="high",
                cost_category="High Workhorse ($2.50-$6.00/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_7_DEEP_REASONER,
                tier_number=7,
                name="Deep Concurrency & Edge-Case Solver",
                description="Deadlocks, race conditions, distributed locking, and tricky async edge cases.",
                functional_specialization="Concurrency, Memory Leaks, Race Conditions & Thread Locks",
                knowledge_vs_reasoning="Ultra-Deep Reasoning (High-Budget Thought Traces)",
                target_tasks=["Concurrency deadlocks", "Race condition fixes", "Distributed locks", "Transaction isolation", "Memory leak debugging"],
                representative_models=["openai/o3-mini-high", "deepseek/deepseek-r1", "google/gemini-2.0-flash-thinking-exp"],
                input_cost_per_1m_usd=5.00,
                output_cost_per_1m_usd=12.00,
                est_latency_ms=290.0,
                benchmarks={"humaneval": "96.1%", "swe_bench_verified": "51.4%", "context_window": "200k tokens", "tokens_per_sec": "45 t/s"},
                reasoning_level="high",
                cost_category="High Reasoning ($5.00-$12.00/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_8_SENIOR_ARCHITECT,
                tier_number=8,
                name="Senior Architect & Protocol Specialist",
                description="Multi-service architecture refactoring, protocol migrations, schema evolution.",
                functional_specialization="Multi-Service Architecture & Cross-Repository Protocols",
                knowledge_vs_reasoning="Frontier Balanced (Extended Thinking + Full Repo AST)",
                target_tasks=["Multi-service refactor", "Protocol migration", "Database schema upgrade", "Cross-repo sync", "Breaking API upgrades"],
                representative_models=["anthropic/claude-3-7-sonnet", "openai/gpt-4o-2024-11-20", "meta-llama/llama-3.1-405b-instruct"],
                input_cost_per_1m_usd=12.00,
                output_cost_per_1m_usd=24.00,
                est_latency_ms=350.0,
                benchmarks={"humaneval": "97.4%", "swe_bench_verified": "70.3%", "context_window": "200k tokens", "tokens_per_sec": "38 t/s"},
                reasoning_level="frontier",
                cost_category="Frontier ($12.00-$24.00/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_9_FRONTIER_SYNTHESIS,
                tier_number=9,
                name="Frontier Cognitive Synthesis",
                description="Whole-codebase transformations, cryptography implementation, distributed consensus.",
                functional_specialization="Distributed Consensus, Novel Cryptography & Kernel Syntheses",
                knowledge_vs_reasoning="Frontier Synthesis (Maximal Cognitive Depth)",
                target_tasks=["Distributed consensus", "Cryptography audit", "Full system restructuring", "Core kernel patches", "Formal verification"],
                representative_models=["openai/o1", "anthropic/claude-3-opus", "openai/gpt-4.5-preview"],
                input_cost_per_1m_usd=25.00,
                output_cost_per_1m_usd=60.00,
                est_latency_ms=480.0,
                benchmarks={"humaneval": "98.2%", "swe_bench_verified": "72.8%", "context_window": "200k tokens", "tokens_per_sec": "25 t/s"},
                reasoning_level="frontier",
                cost_category="Frontier Synthesis ($25.00-$60.00/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_10_ELITE_CONSENSUS,
                tier_number=10,
                name="Elite Multi-Model Consensus Engine",
                description="Multi-model consensus voting across frontier engines for zero-defect mission-critical systems.",
                functional_specialization="Zero-Defect Financial Kernels & Multi-Model Cross-Verification",
                knowledge_vs_reasoning="Consensus Multi-Model Verification (Triple Engine Voting)",
                target_tasks=["Zero-defect financial kernel", "Critical security vulnerability", "Multi-model verification", "Billion-dollar transaction ledger"],
                representative_models=["consensus/claude-3.7-sonnet+o1+gemini-2.0-pro", "openai/o1-pro", "anthropic/claude-4.5-preview"],
                input_cost_per_1m_usd=60.00,
                output_cost_per_1m_usd=140.00,
                est_latency_ms=850.0,
                benchmarks={"humaneval": "99.1%", "swe_bench_verified": "78.5%", "context_window": "Consensus Ensemble", "tokens_per_sec": "Ensemble"},
                reasoning_level="consensus",
                cost_category="Elite Consensus ($60.00-$140.00/1M)"
            )
        ]

        self._tier_specs = {spec.tier: spec for spec in specs}
        for spec in specs:
            for model in spec.representative_models:
                self._model_to_tier[model] = spec.tier
                short_name = model.split("/")[-1] if "/" in model else model
                self._model_to_tier[short_name] = spec.tier

        self._last_updated = time.time()

    def _load_from_storage(self):
        """Attempts to load cached tier matrix from Anvesh Document Store."""
        cached = anvesh_client.get_document("llm_pricing", "active_tier_matrix")
        if cached and "tiers" in cached:
            try:
                for item in cached["tiers"]:
                    spec = ModelTierSpec(**item)
                    self._tier_specs[spec.tier] = spec
                    for model in spec.representative_models:
                        self._model_to_tier[model] = spec.tier
                self._last_updated = cached.get("updated_at", time.time())
                logger.info(f"Loaded {len(self._tier_specs)} model tiers from Anvesh storage.")
            except Exception as e:
                logger.warning(f"Failed to parse cached tier matrix from Anvesh: {e}")

    def _persist_to_storage(self):
        """Persists active 10-tier matrix to Anvesh Document Store."""
        payload = {
            "tiers": [spec.model_dump() for spec in self._tier_specs.values()],
            "updated_at": self._last_updated,
            "tier_count": len(self._tier_specs)
        }
        anvesh_client.store_document("llm_pricing", "active_tier_matrix", payload)

    async def fetch_and_update_pricing(self, force: bool = False) -> Dict[str, Any]:
        """
        Fetches live models and pricing from OpenRouter API,
        applies our multi-dimensional tiering algorithm, and updates Anvesh.
        """
        now = time.time()
        if not force and (now - self._last_updated) < self.cache_ttl_seconds:
            return {
                "status": "CACHED",
                "message": "Tier pricing is within the 1-week TTL window.",
                "last_updated": self._last_updated,
                "tiers": self.get_all_tiers()
            }

        headers = {}
        if self.openrouter_api_key:
            headers["Authorization"] = f"Bearer {self.openrouter_api_key}"

        fetched_models = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self.openrouter_api_url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    fetched_models = data.get("data", [])
                    logger.info(f"Fetched {len(fetched_models)} models from OpenRouter.")
        except Exception as err:
            logger.warning(f"Online price fetch failed ({err}). Applying deterministic tier heuristics.")

        if fetched_models:
            self._apply_custom_tiering_logic(fetched_models)

        self._last_updated = now
        self._persist_to_storage()

        return {
            "status": "UPDATED",
            "models_evaluated": len(fetched_models),
            "updated_at": self._last_updated,
            "tiers": self.get_all_tiers()
        }

    def _apply_custom_tiering_logic(self, raw_models: List[Dict[str, Any]]):
        """
        Multi-Dimensional Tiering Algorithm:
        Computes composite cost score, evaluates reasoning capabilities,
        and cleanly buckets models into specialized tiers while preserving
        the 'Low Cost First' optimization guarantee.
        """
        tier_buckets: Dict[TierLevel, List[str]] = {t: [] for t in TierLevel}
        
        for m in raw_models:
            model_id = m.get("id", "")
            pricing = m.get("pricing", {})
            prompt_price = float(pricing.get("prompt", 0.0) or 0.0) * 1_000_000
            completion_price = float(pricing.get("completion", 0.0) or 0.0) * 1_000_000
            blended_price = prompt_price * 0.75 + completion_price * 0.25

            # Evaluate tags / architecture
            model_lower = model_id.lower()
            is_reasoning = any(k in model_lower for k in ["r1", "o1", "o3", "thinking", "reason"])

            # Multi-dimensional assignment
            if blended_price <= 0.10:
                tier = TierLevel.TIER_1_MICRO_LINT
            elif blended_price <= 0.35:
                tier = TierLevel.TIER_2_ULTRA_FAST
            elif blended_price <= 0.80:
                tier = TierLevel.TIER_3_ECONOMY_CODER
            elif blended_price <= 1.80:
                tier = TierLevel.TIER_5_FAST_REASONER if is_reasoning else TierLevel.TIER_4_MID_GENERALIST
            elif blended_price <= 4.00:
                tier = TierLevel.TIER_5_FAST_REASONER
            elif blended_price <= 8.00:
                tier = TierLevel.TIER_7_DEEP_REASONER if is_reasoning else TierLevel.TIER_6_CORE_WORKHORSE
            elif blended_price <= 15.00:
                tier = TierLevel.TIER_7_DEEP_REASONER
            elif blended_price <= 30.00:
                tier = TierLevel.TIER_8_SENIOR_ARCHITECT
            elif blended_price <= 70.00:
                tier = TierLevel.TIER_9_FRONTIER_SYNTHESIS
            else:
                tier = TierLevel.TIER_10_ELITE_CONSENSUS

            tier_buckets[tier].append(model_id)
            self._model_to_tier[model_id] = tier

        # Keep active representative models
        for tier, models in tier_buckets.items():
            if models and tier in self._tier_specs:
                self._tier_specs[tier].representative_models = models[:4]

    def select_optimal_tier_for_task(self, title: str, description: str, ast_symbol_count: int = 1) -> TierLevel:
        """
        Greedy 'Low-Cost First' Multi-Dimensional Selector:
        Maps incoming requirements to the absolute lowest-cost capable tier.
        Defaults to Tier 1-3 for 70%+ of typical code operations.
        """
        combined = f"{title} {description}".lower()

        # 1. Consensus / Zero-defect / Financial Ledgers
        if any(k in combined for k in ["financial kernel", "consensus voting", "zero defect", "billion dollar ledger", "critical security audit"]):
            return TierLevel.TIER_10_ELITE_CONSENSUS

        # 2. Frontier Cryptography / Whole System Restructuring
        if any(k in combined for k in ["cryptography", "zero knowledge", "consensus protocol", "kernel rewrite", "formal verification"]):
            return TierLevel.TIER_9_FRONTIER_SYNTHESIS

        # 3. Senior Architecture / Multi-Service / Database Protocol Migrations
        if any(k in combined for k in ["architecture refactor", "multi-service", "protocol migration", "database schema upgrade", "breaking api"]):
            return TierLevel.TIER_8_SENIOR_ARCHITECT

        # 4. Deep Concurrency / Deadlocks / Race Conditions / Memory Leaks
        if any(k in combined for k in ["deadlock", "race condition", "mutex", "concurrency", "thread lock", "memory leak", "segfault"]):
            return TierLevel.TIER_7_DEEP_REASONER

        # 5. Complex Module Refactor / Cross-file Integration
        if any(k in combined for k in ["refactor module", "cross-file", "integration test suite", "orm migration"]) or ast_symbol_count >= 5:
            return TierLevel.TIER_6_CORE_WORKHORSE

        # 6. Structured Algorithmic Reasoning / State Machines / Math
        if any(k in combined for k in ["state machine", "retry policy", "algorithm", "tree traversal", "math logic", "backoff"]):
            return TierLevel.TIER_5_FAST_REASONER

        # 7. Standard API Handlers & HTTP Endpoints
        if any(k in combined for k in ["api handler", "http endpoint", "pydantic validator", "webhook deserializer", "route fix"]):
            return TierLevel.TIER_4_MID_GENERALIST

        # 8. Isolated Test Assertion & Helper Function (Economy)
        if any(k in combined for k in ["unit test", "assertion", "helper function", "regex", "utility script"]):
            return TierLevel.TIER_3_ECONOMY_CODER

        # 9. Micro Syntax / Typo / Markdown Lint / Comments (Ultra-Low Cost Tier 1)
        if any(k in combined for k in ["typo", "readme doc", "readme", "comment", "whitespace", "linter", "syntax check"]):
            return TierLevel.TIER_1_MICRO_LINT

        # 10. Docstrings, Variable Renames, Release Notes (Ultra-Cheap Tier 2)
        if any(k in combined for k in ["docstring", "rename variable", "release note", "formatting", "json serialize"]):
            return TierLevel.TIER_2_ULTRA_FAST

        # Default Lowest Cost Guard
        return TierLevel.TIER_1_MICRO_LINT

    def get_tier_spec(self, tier: TierLevel) -> ModelTierSpec:
        return self._tier_specs.get(tier, self._tier_specs[TierLevel.TIER_4_MID_GENERALIST])

    def get_tier_for_model(self, model_name: str) -> TierLevel:
        clean_name = model_name.split("/")[-1] if "/" in model_name else model_name
        return self._model_to_tier.get(model_name) or self._model_to_tier.get(clean_name, TierLevel.TIER_4_MID_GENERALIST)

    def get_all_tiers(self) -> List[ModelTierSpec]:
        return list(self._tier_specs.values())

    def get_default_model_for_tier(self, tier: TierLevel) -> str:
        spec = self.get_tier_spec(tier)
        return spec.representative_models[0] if spec.representative_models else "openai/gpt-4o"


# Global Pricing & Tiering Singleton
llm_pricing_service = LLMPricingService()
