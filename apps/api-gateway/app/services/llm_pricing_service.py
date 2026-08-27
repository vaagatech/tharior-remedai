"""
10-Tier Dynamic LLM Pricing & OpenRouter Multi-Dimensional Model Registry Service.
Pulls live model catalog and pricing from OpenRouter (https://openrouter.ai/models / /api/v1/models),
evaluates multi-dimensional capabilities (Cost, Reasoning vs Knowledge, Coding Benchmarks, Modalities),
supports customer tier overrides (±1 to ±2 tiers shift), free model prioritization,
multimodal grouping (Audio, Video, Image), and persists active matrices in Anvesh Unified Storage.
"""

import os
import time
import asyncio
import httpx
import logging
from typing import Dict, Any, List, Optional
from app.models.agent import (
    TierLevel,
    ModelTierSpec,
    ModalityType,
    ModelCatalogEntry,
    CustomerTierOverrideConfig,
    MultimodalTierSpec
)
from app.services.anvesh_client import anvesh_client

logger = logging.getLogger("llm_pricing")


TIER_ORDER: List[TierLevel] = [
    TierLevel.TIER_1_MICRO_LINT,
    TierLevel.TIER_2_ULTRA_FAST,
    TierLevel.TIER_3_ECONOMY_CODER,
    TierLevel.TIER_4_MID_GENERALIST,
    TierLevel.TIER_5_FAST_REASONER,
    TierLevel.TIER_6_CORE_WORKHORSE,
    TierLevel.TIER_7_DEEP_REASONER,
    TierLevel.TIER_8_SENIOR_ARCHITECT,
    TierLevel.TIER_9_FRONTIER_SYNTHESIS,
    TierLevel.TIER_10_ELITE_CONSENSUS,
]


class LLMPricingService:
    """
    Manages live OpenRouter model catalog, weekly automated pricing ingestion,
    multi-dimensional tier scoring, customer tier overrides (±1 or ±2 tiers),
    free model prioritization, and multimodal audio/video/image tier specifications.
    """

    def __init__(self):
        self.openrouter_api_url = os.getenv("OPENROUTER_MODELS_URL", "https://openrouter.ai/api/v1/models")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.cache_ttl_seconds = int(os.getenv("MODEL_CACHE_TTL_SECONDS", str(7 * 24 * 3600)))  # 1 week (604,800s)
        self._tier_specs: Dict[TierLevel, ModelTierSpec] = {}
        self._model_to_tier: Dict[str, TierLevel] = {}
        self._catalog_entries: Dict[str, ModelCatalogEntry] = {}
        self._customer_config: CustomerTierOverrideConfig = CustomerTierOverrideConfig()
        self._multimodal_specs: List[MultimodalTierSpec] = []
        self._last_updated: float = 0.0
        
        # Initialize default tier matrix & multimodal specs
        self._build_default_tier_matrix()
        self._build_default_multimodal_specs()
        # Seed catalog with rich defaults
        self._seed_baseline_catalog()
        # Load from Anvesh if persisted
        self._load_from_storage()

    def _build_default_tier_matrix(self):
        """Constructs baseline 10-tier matrix with multi-dimensional benchmarks and functional specializations."""
        specs = [
            ModelTierSpec(
                tier=TierLevel.TIER_1_MICRO_LINT,
                tier_number=1,
                name="Micro & Local Syntax Guard (Free / Ultra-Low)",
                description="Ultra-fast syntax checking, typo fixes, comment formatting, and linter resolution using free or micro models.",
                functional_specialization="Documentation & Syntax Formatting",
                knowledge_vs_reasoning="Knowledge-Biased (Sub-word Grammars)",
                target_tasks=["Syntax check", "Typo correction", "Comment format", "Docstring rename", "Linter fixes"],
                representative_models=["meta-llama/llama-3.2-3b-instruct:free", "google/gemini-2.0-flash-lite:free", "qwen/qwen-2.5-coder-7b"],
                input_cost_per_1m_usd=0.00,
                output_cost_per_1m_usd=0.00,
                est_latency_ms=65.0,
                benchmarks={"humaneval": "74.2%", "swe_bench_verified": "18.4%", "context_window": "1M tokens", "tokens_per_sec": "160 t/s"},
                reasoning_level="minimal",
                cost_category="Free / Ultra-Low Cost (<$0.05/1M)"
            ),
            ModelTierSpec(
                tier=TierLevel.TIER_2_ULTRA_FAST,
                tier_number=2,
                name="Ultra-Cheap Fast Remediator",
                description="Docstrings, straightforward variable renames, low-complexity sanity checks, and fast markdown generation.",
                functional_specialization="Documentation, Release Notes & Clean Refactors",
                knowledge_vs_reasoning="Knowledge-Biased (Broad Vocabulary & Fast Context)",
                target_tasks=["Docstrings", "Variable refactoring", "Fast regex generation", "JSON serialization fix", "Release notes"],
                representative_models=["deepseek/deepseek-chat:free", "google/gemini-2.0-flash-lite", "anthropic/claude-3-5-haiku-20241022"],
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

    def _build_default_multimodal_specs(self):
        """Constructs distinct tiering for Audio, Video, Image, and Document/Presentation assets."""
        self._multimodal_specs = [
            # Audio Tiers
            MultimodalTierSpec(
                modality=ModalityType.AUDIO,
                tier_name="Audio Tier 1 - Fast Transcription & Voice Synthesizer",
                tier_level=1,
                description="Speech-to-text, meeting summaries, lightweight TTS, voice command parsing.",
                representative_models=["openai/whisper-large-v3", "meta-llama/llama-3.2-11b-vision-instruct", "google/gemini-2.0-flash-lite"],
                cost_per_unit_usd=0.006,
                unit_description="per audio minute",
                est_latency_sec=1.2,
                supported_formats=["mp3", "wav", "m4a", "ogg"]
            ),
            MultimodalTierSpec(
                modality=ModalityType.AUDIO,
                tier_name="Audio Tier 2 - High-Fidelity Neural Audio & Polyglot Dialogue",
                tier_level=2,
                description="Emotion-aware studio narration, multi-speaker voice synthesis, real-time voice streaming.",
                representative_models=["elevenlabs/eleven-multilingual-v2", "openai/tts-1-hd", "deepgram/nova-2"],
                cost_per_unit_usd=0.030,
                unit_description="per 1,000 characters",
                est_latency_sec=2.5,
                supported_formats=["wav", "flac", "mp3"]
            ),
            # Video Tiers
            MultimodalTierSpec(
                modality=ModalityType.VIDEO,
                tier_name="Video Tier 1 - Video Understanding & Visual AST Ingestion",
                tier_level=1,
                description="Extracting code from screen recordings, UI regression video audits, timeline timestamping.",
                representative_models=["google/gemini-2.0-flash", "google/gemini-1.5-pro", "openai/gpt-4o"],
                cost_per_unit_usd=0.002,
                unit_description="per video frame / sec",
                est_latency_sec=3.5,
                supported_formats=["mp4", "webm", "mov"]
            ),
            MultimodalTierSpec(
                modality=ModalityType.VIDEO,
                tier_name="Video Tier 2 - Generative Video & Walkthrough Rendering",
                tier_level=2,
                description="Automated feature demo video generation, UI animation tutorials, screen recording voiceovers.",
                representative_models=["runway/gen-3-alpha", "kling/kling-video-v1.5", "luma/dream-machine"],
                cost_per_unit_usd=0.08,
                unit_description="per generated video second",
                est_latency_sec=18.0,
                supported_formats=["mp4", "gif"]
            ),
            # Image Tiers
            MultimodalTierSpec(
                modality=ModalityType.IMAGE,
                tier_name="Image Tier 1 - Diagram & Architecture Asset Rendering",
                tier_level=1,
                description="System architecture diagrams, UI component mockups, flowcharts, technical presentation illustrations.",
                representative_models=["black-forest-labs/flux-1-schnell", "stabilityai/stable-diffusion-xl-base-1.0", "google/imagen-3-fast"],
                cost_per_unit_usd=0.003,
                unit_description="per generated image",
                est_latency_sec=2.0,
                supported_formats=["png", "svg", "webp", "jpg"]
            ),
            MultimodalTierSpec(
                modality=ModalityType.IMAGE,
                tier_name="Image Tier 2 - Frontier Visual & Presentation Deck Synthesis",
                tier_level=2,
                description="Pixel-perfect design system comps, marketing hero assets, vector slides and complete presentation slide bundles.",
                representative_models=["black-forest-labs/flux-1-dev", "openai/dall-e-3", "midjourney/v6-api"],
                cost_per_unit_usd=0.040,
                unit_description="per 4k presentation asset",
                est_latency_sec=6.0,
                supported_formats=["png", "pdf", "pptx", "svg"]
            )
        ]

    def _seed_baseline_catalog(self):
        """Seeds initial catalog with known OpenRouter models including free variants."""
        baseline_raw = [
            # Free & Ultra-Low Cost
            {"id": "meta-llama/llama-3.2-3b-instruct:free", "name": "Llama 3.2 3B Instruct (Free)", "provider": "Meta", "prompt": 0.0, "completion": 0.0, "context": 131072, "is_free": True, "tier": TierLevel.TIER_1_MICRO_LINT, "mods": [ModalityType.TEXT]},
            {"id": "google/gemini-2.0-flash-lite:free", "name": "Gemini 2.0 Flash Lite (Free)", "provider": "Google", "prompt": 0.0, "completion": 0.0, "context": 1048576, "is_free": True, "tier": TierLevel.TIER_1_MICRO_LINT, "mods": [ModalityType.TEXT, ModalityType.IMAGE]},
            {"id": "deepseek/deepseek-chat:free", "name": "DeepSeek V3 (Free)", "provider": "DeepSeek", "prompt": 0.0, "completion": 0.0, "context": 65536, "is_free": True, "tier": TierLevel.TIER_2_ULTRA_FAST, "mods": [ModalityType.TEXT]},
            {"id": "deepseek/deepseek-r1:free", "name": "DeepSeek R1 (Free)", "provider": "DeepSeek", "prompt": 0.0, "completion": 0.0, "context": 65536, "is_free": True, "tier": TierLevel.TIER_7_DEEP_REASONER, "mods": [ModalityType.TEXT]},
            {"id": "qwen/qwen-2.5-coder-32b-instruct:free", "name": "Qwen 2.5 Coder 32B (Free)", "provider": "Alibaba", "prompt": 0.0, "completion": 0.0, "context": 32768, "is_free": True, "tier": TierLevel.TIER_3_ECONOMY_CODER, "mods": [ModalityType.TEXT]},
            # Paid High-Efficiency Models
            {"id": "google/gemini-2.0-flash-lite", "name": "Gemini 2.0 Flash Lite", "provider": "Google", "prompt": 0.075, "completion": 0.30, "context": 1048576, "is_free": False, "tier": TierLevel.TIER_2_ULTRA_FAST, "mods": [ModalityType.TEXT, ModalityType.IMAGE, ModalityType.AUDIO]},
            {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini", "provider": "OpenAI", "prompt": 0.15, "completion": 0.60, "context": 128000, "is_free": False, "tier": TierLevel.TIER_3_ECONOMY_CODER, "mods": [ModalityType.TEXT, ModalityType.IMAGE]},
            {"id": "anthropic/claude-3-5-haiku", "name": "Claude 3.5 Haiku", "provider": "Anthropic", "prompt": 0.80, "completion": 4.00, "context": 200000, "is_free": False, "tier": TierLevel.TIER_4_MID_GENERALIST, "mods": [ModalityType.TEXT, ModalityType.IMAGE]},
            {"id": "openai/o3-mini", "name": "o3-mini", "provider": "OpenAI", "prompt": 1.10, "completion": 4.40, "context": 200000, "is_free": False, "tier": TierLevel.TIER_5_FAST_REASONER, "mods": [ModalityType.TEXT]},
            {"id": "openai/gpt-4o", "name": "GPT-4o", "provider": "OpenAI", "prompt": 2.50, "completion": 10.00, "context": 128000, "is_free": False, "tier": TierLevel.TIER_6_CORE_WORKHORSE, "mods": [ModalityType.TEXT, ModalityType.IMAGE, ModalityType.AUDIO, ModalityType.VIDEO]},
            {"id": "anthropic/claude-3-5-sonnet", "name": "Claude 3.5 Sonnet", "provider": "Anthropic", "prompt": 3.00, "completion": 15.00, "context": 200000, "is_free": False, "tier": TierLevel.TIER_6_CORE_WORKHORSE, "mods": [ModalityType.TEXT, ModalityType.IMAGE]},
            {"id": "deepseek/deepseek-r1", "name": "DeepSeek R1", "provider": "DeepSeek", "prompt": 0.55, "completion": 2.19, "context": 65536, "is_free": False, "tier": TierLevel.TIER_7_DEEP_REASONER, "mods": [ModalityType.TEXT]},
            {"id": "anthropic/claude-3-7-sonnet", "name": "Claude 3.7 Sonnet (Hybrid Thinking)", "provider": "Anthropic", "prompt": 3.00, "completion": 15.00, "context": 200000, "is_free": False, "tier": TierLevel.TIER_8_SENIOR_ARCHITECT, "mods": [ModalityType.TEXT, ModalityType.IMAGE]},
            {"id": "openai/o1", "name": "OpenAI o1", "provider": "OpenAI", "prompt": 15.00, "completion": 60.00, "context": 200000, "is_free": False, "tier": TierLevel.TIER_9_FRONTIER_SYNTHESIS, "mods": [ModalityType.TEXT, ModalityType.IMAGE]},
            {"id": "openai/o1-pro", "name": "OpenAI o1 Pro", "provider": "OpenAI", "prompt": 60.00, "completion": 150.00, "context": 200000, "is_free": False, "tier": TierLevel.TIER_10_ELITE_CONSENSUS, "mods": [ModalityType.TEXT]},
        ]

        for item in baseline_raw:
            entry = ModelCatalogEntry(
                id=item["id"],
                name=item["name"],
                provider=item["provider"],
                context_length=item["context"],
                modalities=item["mods"],
                is_free=item["is_free"],
                prompt_cost_per_1m_usd=item["prompt"],
                completion_cost_per_1m_usd=item["completion"],
                system_tier=item["tier"],
                is_allowed=True,
                tags=["baseline", "openrouter", "free" if item["is_free"] else "commercial"]
            )
            self._catalog_entries[entry.id] = entry
            self._model_to_tier[entry.id] = entry.system_tier

    def _load_from_storage(self):
        """Attempts to load cached catalog, tier matrix, and customer config from Anvesh."""
        # 1. Load active tier matrix
        cached_tiers = anvesh_client.get_document("llm_pricing", "active_tier_matrix")
        if cached_tiers and "tiers" in cached_tiers:
            try:
                for item in cached_tiers["tiers"]:
                    spec = ModelTierSpec(**item)
                    self._tier_specs[spec.tier] = spec
                    for model in spec.representative_models:
                        self._model_to_tier[model] = spec.tier
                self._last_updated = cached_tiers.get("updated_at", time.time())
                logger.info(f"Loaded {len(self._tier_specs)} model tiers from Anvesh storage.")
            except Exception as e:
                logger.warning(f"Failed to parse cached tier matrix from Anvesh: {e}")

        # 2. Load catalog entries
        cached_catalog = anvesh_client.get_document("llm_pricing", "openrouter_catalog")
        if cached_catalog and "models" in cached_catalog:
            try:
                for item in cached_catalog["models"]:
                    entry = ModelCatalogEntry(**item)
                    self._catalog_entries[entry.id] = entry
                    self._model_to_tier[entry.id] = entry.user_override_tier or entry.system_tier
                logger.info(f"Loaded {len(self._catalog_entries)} catalog models from Anvesh storage.")
            except Exception as e:
                logger.warning(f"Failed to parse cached catalog from Anvesh: {e}")

        # 3. Load customer overrides
        cached_cust = anvesh_client.get_document("llm_pricing", "customer_tier_config")
        if cached_cust:
            try:
                self._customer_config = CustomerTierOverrideConfig(**cached_cust)
                self._recalculate_effective_tiers()
                logger.info("Loaded and applied customer tier override configuration from Anvesh.")
            except Exception as e:
                logger.warning(f"Failed to parse customer override config: {e}")

    def _persist_to_storage(self):
        """Persists active matrix, catalog, and customer overrides to Anvesh Document Store."""
        # 1. Persist tier matrix
        payload_tiers = {
            "tiers": [spec.model_dump() for spec in self._tier_specs.values()],
            "updated_at": self._last_updated,
            "tier_count": len(self._tier_specs)
        }
        anvesh_client.store_document("llm_pricing", "active_tier_matrix", payload_tiers)

        # 2. Persist catalog
        payload_catalog = {
            "models": [entry.model_dump() for entry in self._catalog_entries.values()],
            "updated_at": self._last_updated,
            "total_count": len(self._catalog_entries)
        }
        anvesh_client.store_document("llm_pricing", "openrouter_catalog", payload_catalog)

        # 3. Persist customer config
        anvesh_client.store_document("llm_pricing", "customer_tier_config", self._customer_config.model_dump())

    def get_config(self) -> Dict[str, Any]:
        """Returns current registry source URL, API key status, TTL, and scheduler status."""
        return {
            "source_url": self.openrouter_api_url,
            "has_api_key": bool(self.openrouter_api_key),
            "cache_ttl_seconds": self.cache_ttl_seconds,
            "refresh_interval_days": round(self.cache_ttl_seconds / 86400, 1),
            "last_updated": self._last_updated,
            "is_stale": (time.time() - self._last_updated) > self.cache_ttl_seconds,
            "total_catalog_models": len(self._catalog_entries),
            "free_models_count": sum(1 for m in self._catalog_entries.values() if m.is_free),
            "prefer_free_models": self._customer_config.prefer_free_models
        }

    def update_config(self, source_url: Optional[str] = None, api_key: Optional[str] = None, cache_ttl_seconds: Optional[int] = None) -> Dict[str, Any]:
        """Updates model registry source URL, API key, or cache refresh window."""
        if source_url:
            self.openrouter_api_url = source_url
        if api_key is not None:
            self.openrouter_api_key = api_key
        if cache_ttl_seconds and cache_ttl_seconds > 0:
            self.cache_ttl_seconds = cache_ttl_seconds
        return self.get_config()

    async def fetch_and_update_pricing(self, force: bool = False) -> Dict[str, Any]:
        """
        Fetches live models and pricing from OpenRouter API (or configured URL),
        applies our multi-dimensional tiering algorithm, preserves free models,
        applies customer tier overrides, and updates Anvesh Unified Storage.
        """
        now = time.time()
        if not force and (now - self._last_updated) < self.cache_ttl_seconds:
            return {
                "status": "CACHED",
                "message": "Model catalog is up to date (within weekly TTL window).",
                "last_updated": self._last_updated,
                "total_models": len(self._catalog_entries),
                "tiers": self.get_all_tiers()
            }

        headers = {
            "HTTP-Referer": "https://vaagatech.github.io/anvesh",
            "X-Title": "Tharior Remedai Autonomous Coding Engineer"
        }
        if self.openrouter_api_key:
            headers["Authorization"] = f"Bearer {self.openrouter_api_key}"

        fetched_models = []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(self.openrouter_api_url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    fetched_models = data.get("data", [])
                    logger.info(f"Successfully fetched {len(fetched_models)} models from OpenRouter API.")
        except Exception as err:
            logger.warning(f"Online price fetch failed ({err}). Utilizing seeded baseline catalog.")

        if fetched_models:
            self._ingest_openrouter_models(fetched_models)

        self._last_updated = now
        self._recalculate_effective_tiers()
        self._persist_to_storage()

        return {
            "status": "UPDATED",
            "models_evaluated": len(self._catalog_entries),
            "free_models_count": sum(1 for m in self._catalog_entries.values() if m.is_free),
            "updated_at": self._last_updated,
            "tiers": self.get_all_tiers()
        }

    def _ingest_openrouter_models(self, raw_models: List[Dict[str, Any]]):
        """
        Ingests and normalizes raw models from OpenRouter JSON.
        Computes composite cost score, detects modalities (audio, video, image),
        identifies free tier eligibility, and assigns baseline system tiers.
        """
        for m in raw_models:
            model_id = m.get("id", "")
            name = m.get("name") or model_id
            description = m.get("description", "")
            context_length = int(m.get("context_length", 128000))
            
            pricing = m.get("pricing", {})
            prompt_price = float(pricing.get("prompt", 0.0) or 0.0) * 1_000_000
            completion_price = float(pricing.get("completion", 0.0) or 0.0) * 1_000_000
            request_price = float(pricing.get("request", 0.0) or 0.0)
            image_price = float(pricing.get("image", 0.0) or 0.0)
            
            # Check discounts or free status
            is_free = (prompt_price == 0.0 and completion_price == 0.0) or (":free" in model_id.lower())
            
            # Determine modalities
            arch = m.get("architecture", {})
            modality_str = str(arch.get("modality", "")).lower()
            modalities = [ModalityType.TEXT]
            if "image" in modality_str or "vision" in model_id.lower() or image_price > 0:
                modalities.append(ModalityType.IMAGE)
            if "audio" in modality_str or "whisper" in model_id.lower() or "voice" in model_id.lower():
                modalities.append(ModalityType.AUDIO)
            if "video" in modality_str or "gen-3" in model_id.lower() or "kling" in model_id.lower():
                modalities.append(ModalityType.VIDEO)
            if len(modalities) > 1:
                modalities.append(ModalityType.MULTIMODAL)

            # Provider
            provider = model_id.split("/")[0].capitalize() if "/" in model_id else "OpenRouter"

            # Assign system tier based on capability & cost
            system_tier = self._compute_system_tier(model_id, prompt_price, completion_price, is_free)

            entry = ModelCatalogEntry(
                id=model_id,
                name=name,
                description=description[:200] if description else "",
                provider=provider,
                context_length=context_length,
                modalities=modalities,
                is_free=is_free,
                prompt_cost_per_1m_usd=round(prompt_price, 4),
                completion_cost_per_1m_usd=round(completion_price, 4),
                request_cost_usd=request_price,
                image_cost_usd=image_price,
                system_tier=system_tier,
                is_allowed=True,
                tags=["openrouter", "free" if is_free else "commercial"]
            )
            self._catalog_entries[model_id] = entry

    def _compute_system_tier(self, model_id: str, prompt_price: float, completion_price: float, is_free: bool) -> TierLevel:
        """Determines baseline system tier based on price and reasoning keywords."""
        blended_price = prompt_price * 0.75 + completion_price * 0.25
        model_lower = model_id.lower()
        is_reasoning = any(k in model_lower for k in ["r1", "o1", "o3", "thinking", "reason", "qwq"])

        if is_free:
            if is_reasoning:
                return TierLevel.TIER_7_DEEP_REASONER
            elif any(k in model_lower for k in ["coder", "code"]):
                return TierLevel.TIER_3_ECONOMY_CODER
            else:
                return TierLevel.TIER_1_MICRO_LINT

        if blended_price <= 0.10:
            return TierLevel.TIER_1_MICRO_LINT
        elif blended_price <= 0.35:
            return TierLevel.TIER_2_ULTRA_FAST
        elif blended_price <= 0.80:
            return TierLevel.TIER_3_ECONOMY_CODER
        elif blended_price <= 1.80:
            return TierLevel.TIER_5_FAST_REASONER if is_reasoning else TierLevel.TIER_4_MID_GENERALIST
        elif blended_price <= 4.00:
            return TierLevel.TIER_5_FAST_REASONER
        elif blended_price <= 8.00:
            return TierLevel.TIER_7_DEEP_REASONER if is_reasoning else TierLevel.TIER_6_CORE_WORKHORSE
        elif blended_price <= 15.00:
            return TierLevel.TIER_7_DEEP_REASONER
        elif blended_price <= 30.00:
            return TierLevel.TIER_8_SENIOR_ARCHITECT
        elif blended_price <= 70.00:
            return TierLevel.TIER_9_FRONTIER_SYNTHESIS
        else:
            return TierLevel.TIER_10_ELITE_CONSENSUS

    def apply_customer_override(self, config: CustomerTierOverrideConfig) -> Dict[str, Any]:
        """
        Applies customer overrides:
        1. Filters allowed models (whitelisting).
        2. Validates and enforces that model shifts cannot exceed ±2 tiers from the system baseline.
        3. Updates per-tier representative models if explicitly defined.
        4. Recalculates effective tier matrix and persists to Anvesh.
        """
        # Validate shifts: must be between -2 and +2
        validated_shifts = {}
        for model_id, shift in config.tier_shifts.items():
            clamped = max(-2, min(2, int(shift)))
            validated_shifts[model_id] = clamped
        
        config.tier_shifts = validated_shifts
        config.updated_at = time.time()
        self._customer_config = config
        
        self._recalculate_effective_tiers()
        self._persist_to_storage()
        
        return {
            "status": "APPLIED",
            "allowed_models_count": len(config.allowed_models) if config.allowed_models else len(self._catalog_entries),
            "tier_shifts_applied": len(validated_shifts),
            "prefer_free_models": config.prefer_free_models,
            "tiers": self.get_all_tiers()
        }

    def _recalculate_effective_tiers(self):
        """
        Applies customer shifts (±1 or ±2 tiers) and allowed models filter
        to populate the effective `_tier_specs` and `_model_to_tier` mappings.
        """
        tier_buckets: Dict[TierLevel, List[str]] = {t: [] for t in TierLevel}
        allowed_set = set(self._customer_config.allowed_models) if self._customer_config.allowed_models else None

        for model_id, entry in self._catalog_entries.items():
            # Check if allowed
            if allowed_set is not None and model_id not in allowed_set:
                entry.is_allowed = False
                continue
            entry.is_allowed = True

            # Calculate user override tier with ±1 or ±2 clamp
            shift = self._customer_config.tier_shifts.get(model_id, 0)
            shift = max(-2, min(2, shift))
            
            system_idx = TIER_ORDER.index(entry.system_tier)
            effective_idx = max(0, min(len(TIER_ORDER) - 1, system_idx + shift))
            effective_tier = TIER_ORDER[effective_idx]
            
            entry.user_override_tier = effective_tier if shift != 0 else None
            tier_buckets[effective_tier].append(model_id)
            self._model_to_tier[model_id] = effective_tier

        # Update representative models per tier
        for tier, spec in self._tier_specs.items():
            # Check if customer specified explicit overrides for this tier
            explicit = self._customer_config.tier_model_overrides.get(tier)
            if explicit:
                spec.representative_models = explicit
            elif tier_buckets[tier]:
                # Sort: if prefer_free_models, put free models first
                models_in_tier = tier_buckets[tier]
                if self._customer_config.prefer_free_models:
                    models_in_tier.sort(key=lambda m: 0 if self._catalog_entries.get(m, ModelCatalogEntry(id=m, name=m, provider="")).is_free else 1)
                spec.representative_models = models_in_tier[:4]

    def get_catalog_models(
        self,
        search: Optional[str] = None,
        free_only: bool = False,
        modality: Optional[str] = None,
        provider: Optional[str] = None,
        tier: Optional[TierLevel] = None,
        allowed_only: bool = False,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Returns catalog models with rich multi-filter support."""
        results = list(self._catalog_entries.values())

        if allowed_only:
            results = [m for m in results if m.is_allowed]

        if free_only:
            results = [m for m in results if m.is_free]

        if modality:
            mod_enum = ModalityType(modality.lower())
            results = [m for m in results if mod_enum in m.modalities]

        if provider:
            results = [m for m in results if provider.lower() in m.provider.lower()]

        if tier:
            results = [m for m in results if (m.user_override_tier or m.system_tier) == tier]

        if search:
            s = search.lower()
            results = [m for m in results if s in m.id.lower() or s in m.name.lower() or s in m.provider.lower()]

        total = len(results)
        paginated = results[offset : offset + limit]

        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "models": paginated
        }

    def get_customer_config(self) -> CustomerTierOverrideConfig:
        return self._customer_config

    def get_multimodal_tiers(self) -> List[MultimodalTierSpec]:
        return self._multimodal_specs

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

        # 9. Micro Syntax / Typo / Markdown Lint / Comments (Ultra-Low Cost / Free Tier 1)
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
        if spec.representative_models:
            return spec.representative_models[0]
        return "openai/gpt-4o"

    async def start_weekly_scheduler_loop(self):
        """Continuous periodic loop that refreshes OpenRouter pricing on schedule."""
        logger.info("Starting OpenRouter LLM Pricing weekly scheduler loop...")
        while True:
            try:
                logger.info("Executing scheduled LLM pricing catalog refresh...")
                result = await self.fetch_and_update_pricing(force=True)
                logger.info(f"LLM pricing catalog refreshed successfully: {result.get('models_ingested', 0)} models ingested.")
            except Exception as e:
                logger.error(f"Error refreshing LLM pricing in scheduler: {e}", exc_info=True)

            # Sleep for configured cache TTL or weekly interval (default 7 days)
            sleep_duration = max(self.cache_ttl_seconds, 60)
            logger.info(f"Scheduler sleeping for {sleep_duration} seconds until next refresh cycle.")
            await asyncio.sleep(sleep_duration)


# Global Pricing & Tiering Singleton
llm_pricing_service = LLMPricingService()
