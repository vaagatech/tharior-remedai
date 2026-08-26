"""
Agent-to-Agent (A2A) models, AgentCards, 10-Tier Multi-Dimensional Classification, and Execution Trace schemas.
"""

from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
import time
import uuid
from app.models.clarification import TaskStatus


class TierLevel(str, Enum):
    # 10-Tier Granular Multi-Dimensional Hierarchy (Cost, Reasoning vs Knowledge, Coding Benchmarks)
    TIER_1_MICRO_LINT = "tier_1_micro_lint"             # Micro/Local/Free: Formatting, typos, syntax lint (~$0.0375-$0.15/1M)
    TIER_2_ULTRA_FAST = "tier_2_ultra_fast"             # Ultra-Cheap Fast: Docstrings, variable renames, fast summarization (~$0.14-$0.40/1M)
    TIER_3_ECONOMY_CODER = "tier_3_economy_coder"       # Economy Coders: Isolated function fixes, regex, unit test assertions (~$0.15-$0.60/1M)
    TIER_4_MID_GENERALIST = "tier_4_mid_generalist"     # Mid-Tier Generalist: Standard API handlers, endpoint wiring, Pydantic (~$0.80-$1.60/1M)
    TIER_5_FAST_REASONER = "tier_5_fast_reasoner"       # Fast Structured Reasoner: Algorithmic bugs, state machines, math validation (~$1.10-$2.20/1M)
    TIER_6_CORE_WORKHORSE = "tier_6_core_workhorse"     # Core Workhorses: Complex module refactoring, multi-function integrations (~$2.50-$6.00/1M)
    TIER_7_DEEP_REASONER = "tier_7_deep_reasoner"       # Deep Concurrency Reasoner: Deadlocks, race conditions, async locks (~$5.00-$12.00/1M)
    TIER_8_SENIOR_ARCHITECT = "tier_8_senior_architect" # Senior Architects: Multi-service refactors, protocol migrations, schema upgrades (~$12.00-$24.00/1M)
    TIER_9_FRONTIER_SYNTHESIS = "tier_9_frontier_synthesis" # Frontier Cognitive Synthesis: Whole-repo architecture, cryptography (~$25.00-$60.00/1M)
    TIER_10_ELITE_CONSENSUS = "tier_10_elite_consensus" # Elite Multi-Model Consensus: Zero-defect financial kernels, multi-model voting (~$60.00-$140.00/1M)

    # Legacy Backward-Compatibility Aliases
    NANO = "tier_1_micro_lint"
    MID = "tier_4_mid_generalist"
    FRONTIER = "tier_8_senior_architect"


class ModelTierSpec(BaseModel):
    tier: TierLevel
    tier_number: int
    name: str
    description: str
    functional_specialization: str  # "Documentation & NL", "Syntax & Mechanical", "Economical Coding", "General Engineering", "Algorithmic Reasoning", "Core Full-Stack", "Concurrency & Threading", "System Architecture", "Frontier Cryptography", "Elite Consensus"
    knowledge_vs_reasoning: str     # "Knowledge-Biased", "Balanced", "Reasoning-Biased", "Ultra-Deep Reasoning", "Consensus Verification"
    target_tasks: List[str]
    representative_models: List[str]
    input_cost_per_1m_usd: float
    output_cost_per_1m_usd: float
    est_latency_ms: float
    benchmarks: Dict[str, str] = Field(default_factory=dict)  # e.g. {"humaneval": "92%", "swe_bench": "48%", "context_window": "200k"}
    reasoning_level: str  # "minimal", "low", "medium", "high", "frontier", "consensus"
    cost_category: str = "Low Cost"


class AgentCard(BaseModel):
    agent_id: str
    name: str
    role: str
    domain: str
    description: str
    capabilities: List[str]
    mcp_tools: List[str]
    default_tier: TierLevel
    avatar_color: str = "indigo"
    cost_per_1k_est: float


class ExecutionTraceStep(BaseModel):
    step_id: str = Field(default_factory=lambda: f"step_{uuid.uuid4().hex[:6]}")
    timestamp: float = Field(default_factory=time.time)
    phase: str  # "AST_LOOKUP", "CLASSIFICATION", "SYNTHESIS", "TEST_SANDBOX", "GIT_PR", "SELF_HEALING_REFLECTION"
    agent_name: str
    tier: str
    model: str
    action: str
    mcp_server: Optional[str] = None
    mcp_tool: Optional[str] = None
    inputs: Dict[str, Any] = Field(default_factory=dict)
    outputs: Dict[str, Any] = Field(default_factory=dict)
    cost_usd: float = 0.0
    latency_ms: float = 0.0
    status: str = "SUCCESS"  # SUCCESS, WAITING, FAILED


class TaskExecutionReport(BaseModel):
    task_id: str
    ticket_id: str
    repo_name: str
    title: str
    status: TaskStatus
    assigned_agent: str
    tier: TierLevel
    selected_model: str
    routing_mode: str = "GATEWAY"  # "STRAIGHT" or "GATEWAY"
    tenant_group: str = "default"
    user_id: str = "default"
    total_cost_usd: float = 0.0
    total_latency_ms: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0
    patch_diff: Optional[str] = None
    pr_url: Optional[str] = None
    test_results: Optional[Dict[str, Any]] = None
    reflection_cycles: int = 0
    traces: List[ExecutionTraceStep] = Field(default_factory=list)
    created_at: float = Field(default_factory=time.time)
    completed_at: Optional[float] = None


class ModalityType(str, Enum):
    TEXT = "text"
    AUDIO = "audio"
    VIDEO = "video"
    IMAGE = "image"
    MULTIMODAL = "multimodal"


class ModelCatalogEntry(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    provider: str
    context_length: int = 128000
    modalities: List[ModalityType] = Field(default_factory=lambda: [ModalityType.TEXT])
    is_free: bool = False
    prompt_cost_per_1m_usd: float = 0.0
    completion_cost_per_1m_usd: float = 0.0
    request_cost_usd: float = 0.0
    image_cost_usd: float = 0.0
    discount_pct: float = 0.0
    system_tier: TierLevel = TierLevel.TIER_4_MID_GENERALIST
    user_override_tier: Optional[TierLevel] = None
    is_allowed: bool = True
    tags: List[str] = Field(default_factory=list)


class CustomerTierOverrideConfig(BaseModel):
    allowed_models: Optional[List[str]] = None  # None means all allowed
    # Shift map: { "model_id": shift_int } where shift_int is between -2 and +2
    tier_shifts: Dict[str, int] = Field(default_factory=dict)
    # Explicit per-tier model assignments override: { "tier_1_micro_lint": ["gemini/gemini-2.0-flash-lite"] }
    tier_model_overrides: Dict[TierLevel, List[str]] = Field(default_factory=dict)
    prefer_free_models: bool = True
    allow_multimodal: bool = True
    updated_at: float = Field(default_factory=time.time)


class MultimodalTierSpec(BaseModel):
    modality: ModalityType
    tier_name: str
    tier_level: int
    description: str
    representative_models: List[str]
    cost_per_unit_usd: float
    unit_description: str  # e.g. "per 1M tokens", "per minute of audio", "per video second", "per image"
    est_latency_sec: float
    supported_formats: List[str] = Field(default_factory=list)


class SemanticCacheConfig(BaseModel):
    enabled: bool = True
    similarity_threshold: float = 0.92
    ttl_seconds: int = 86400 * 7  # 7 days
    max_entries: int = 5000


class PlaybookAction(str, Enum):
    AUTO_FIX = "auto_fix"
    AUTO_COMMENT = "auto_comment"
    AUTO_PR = "auto_pr"
    AUTO_MERGE = "auto_merge"
    NOTIFY_ONLY = "notify_only"


class PlaybookConfig(BaseModel):
    listen_assigned_stories: bool = True
    listen_issues: bool = True
    auto_remediate: bool = True
    auto_comment_on_story: bool = True
    auto_pr_creation: bool = True
    auto_merge_enabled: bool = False
    auto_merge_criteria: Dict[str, Any] = Field(default_factory=lambda: {
        "require_tests_passed": True,
        "require_sast_clean": True,
        "require_review_agent_approval": True,
        "max_diff_lines": 500
    })
    target_repositories: List[str] = Field(default_factory=lambda: ["*"])


class PRReviewVerdict(str, Enum):
    APPROVED = "APPROVED"
    REQUEST_CHANGES = "REQUEST_CHANGES"
    COMMENT_ONLY = "COMMENT_ONLY"


class PRReviewReport(BaseModel):
    pr_id: str
    repo_name: str
    verdict: PRReviewVerdict
    score_out_of_100: int
    security_clean: bool
    test_coverage_passed: bool
    summary: str
    inline_comments: List[Dict[str, Any]] = Field(default_factory=list)
    suggested_improvements: List[str] = Field(default_factory=list)
    evaluated_at: float = Field(default_factory=time.time)
    review_model: str = "deepseek/deepseek-chat"


class TokenBudgetConfig(BaseModel):
    max_output_tokens: int = 1024
    stream_thinking: bool = False
    concise_documentation_mode: bool = True
    engagement_mode: bool = True  # Emits lightweight milestone progress cards
    prefer_free_models_for_triage: bool = True

