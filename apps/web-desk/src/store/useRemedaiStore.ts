import { create } from 'zustand';
import type {
  ModelTierSpec,
  CustomerTierOverrideConfig,
  MultimodalTierSpec,
  BacklogStory,
  TierLevel,
  OnboardedRepo,
  KnowledgeGraphData,
  KnowledgeGraphNode,
  SystemRoutingDecision,
  ModelCatalogEntry,
  LiveEventItem,
  SecurityVaultState,
  RepoAuthConfig,
} from '../types';

export const INITIAL_10_TIER_SPECS: ModelTierSpec[] = [
  {
    tier: 'tier_1_micro_lint',
    tier_number: 1,
    name: 'Micro & Local Syntax Guard (Free / Ultra-Low)',
    description: 'Ultra-fast syntax checking, typo fixes, comment formatting, and linter resolution.',
    functional_specialization: 'Documentation & Syntax Formatting',
    knowledge_vs_reasoning: 'Knowledge-Biased (Sub-word Grammars)',
    target_tasks: ['Syntax check', 'Typo correction', 'Comment format', 'Docstring rename', 'Linter fixes'],
    representative_models: ['meta-llama/llama-3.2-3b-instruct:free', 'google/gemini-2.0-flash-lite:free', 'qwen/qwen-2.5-coder-7b'],
    registered_models: [
      {
        id: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Llama 3.2 3B Instruct (Free)',
        context_length: 131072,
        prompt_cost_per_1m: 0.00,
        completion_cost_per_1m: 0.00,
        latency_tier: 'Ultra-Fast (<80ms)',
        tokens_per_second: 180,
        is_free: true,
        system_tier: 'tier_1_micro_lint',
        effective_tier: 'tier_1_micro_lint',
        modalities: ['text'],
        coding_score: 72,
        reasoning_score: 55,
        status: 'active',
        load_weight: 40,
      },
      {
        id: 'google/gemini-2.0-flash-lite:free',
        name: 'Gemini 2.0 Flash Lite (Free)',
        context_length: 1048576,
        prompt_cost_per_1m: 0.00,
        completion_cost_per_1m: 0.00,
        latency_tier: 'Ultra-Fast (<70ms)',
        tokens_per_second: 190,
        is_free: true,
        system_tier: 'tier_1_micro_lint',
        effective_tier: 'tier_1_micro_lint',
        modalities: ['text'],
        coding_score: 76,
        reasoning_score: 60,
        status: 'active',
        load_weight: 40,
      },
      {
        id: 'qwen/qwen-2.5-coder-7b',
        name: 'Qwen 2.5 Coder 7B',
        context_length: 32768,
        prompt_cost_per_1m: 0.04,
        completion_cost_per_1m: 0.08,
        latency_tier: 'Fast (<100ms)',
        tokens_per_second: 140,
        is_free: false,
        system_tier: 'tier_1_micro_lint',
        effective_tier: 'tier_1_micro_lint',
        modalities: ['text'],
        coding_score: 80,
        reasoning_score: 64,
        status: 'active',
        load_weight: 20,
      },
    ],
    input_cost_per_1m_usd: 0.00,
    output_cost_per_1m_usd: 0.00,
    est_latency_ms: 65.0,
    benchmarks: { humaneval: '74.2%', swe_bench_verified: '18.4%', context_window: '1M tokens', tokens_per_sec: '160 t/s' },
    reasoning_level: 'minimal',
    cost_category: 'Free / Ultra-Low Cost (<$0.05/1M)',
  },
  {
    tier: 'tier_2_ultra_fast',
    tier_number: 2,
    name: 'Ultra-Cheap Fast Remediator',
    description: 'Docstrings, straightforward variable renames, low-complexity sanity checks, and fast markdown generation.',
    functional_specialization: 'Documentation, Release Notes & Clean Refactors',
    knowledge_vs_reasoning: 'Knowledge-Biased (Broad Vocabulary & Fast Context)',
    target_tasks: ['Docstrings', 'Variable refactoring', 'Fast regex generation', 'JSON serialization fix', 'Release notes'],
    representative_models: ['deepseek/deepseek-chat:free', 'google/gemini-2.0-flash-lite', 'anthropic/claude-3-5-haiku-20241022'],
    registered_models: [
      {
        id: 'deepseek/deepseek-chat:free',
        name: 'DeepSeek V3 (Free Tier)',
        context_length: 65536,
        prompt_cost_per_1m: 0.00,
        completion_cost_per_1m: 0.00,
        latency_tier: 'Fast (<95ms)',
        tokens_per_second: 130,
        is_free: true,
        system_tier: 'tier_2_ultra_fast',
        effective_tier: 'tier_2_ultra_fast',
        modalities: ['text'],
        coding_score: 84,
        reasoning_score: 72,
        status: 'active',
        load_weight: 50,
      },
      {
        id: 'anthropic/claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        context_length: 200000,
        prompt_cost_per_1m: 0.80,
        completion_cost_per_1m: 4.00,
        latency_tier: 'Fast (<110ms)',
        tokens_per_second: 110,
        is_free: false,
        system_tier: 'tier_2_ultra_fast',
        effective_tier: 'tier_2_ultra_fast',
        modalities: ['text'],
        coding_score: 88,
        reasoning_score: 78,
        status: 'active',
        load_weight: 30,
      },
      {
        id: 'google/gemini-2.0-flash-lite',
        name: 'Gemini 2.0 Flash Lite (Dedicated)',
        context_length: 1048576,
        prompt_cost_per_1m: 0.075,
        completion_cost_per_1m: 0.30,
        latency_tier: 'Ultra-Fast (<75ms)',
        tokens_per_second: 175,
        is_free: false,
        system_tier: 'tier_2_ultra_fast',
        effective_tier: 'tier_2_ultra_fast',
        modalities: ['text', 'image'],
        coding_score: 82,
        reasoning_score: 70,
        status: 'active',
        load_weight: 20,
      },
    ],
    input_cost_per_1m_usd: 0.14,
    output_cost_per_1m_usd: 0.28,
    est_latency_ms: 90.0,
    benchmarks: { humaneval: '82.6%', swe_bench_verified: '28.5%', context_window: '1M tokens', tokens_per_sec: '130 t/s' },
    reasoning_level: 'low',
    cost_category: 'Ultra-Low Cost (<$0.20/1M)',
  },
  {
    tier: 'tier_3_economy_coder',
    tier_number: 3,
    name: 'Economy Code Refactorer & Unit Test Generator',
    description: 'Unit test authoring, mechanical refactors, regex fixes, mock fixtures, and standard CRUD boilerplate synthesis.',
    functional_specialization: 'Unit Testing & Mechanical Refactoring',
    knowledge_vs_reasoning: 'Balanced Knowledge / Reasoning',
    target_tasks: ['Unit test generation', 'Mock creation', 'CRUD endpoint setup', 'Pydantic model sync', 'Doc validation'],
    representative_models: ['qwen/qwen-2.5-coder-32b-instruct', 'deepseek/deepseek-coder-v2-lite-instruct', 'mistralai/codestral-2501'],
    registered_models: [
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        name: 'Qwen 2.5 Coder 32B Instruct',
        context_length: 131072,
        prompt_cost_per_1m: 0.25,
        completion_cost_per_1m: 0.75,
        latency_tier: 'Standard (<180ms)',
        tokens_per_second: 95,
        is_free: false,
        system_tier: 'tier_3_economy_coder',
        effective_tier: 'tier_3_economy_coder',
        modalities: ['text'],
        coding_score: 89,
        reasoning_score: 76,
        status: 'active',
        load_weight: 50,
      },
      {
        id: 'mistralai/codestral-2501',
        name: 'Codestral 2501',
        context_length: 256000,
        prompt_cost_per_1m: 0.30,
        completion_cost_per_1m: 0.90,
        latency_tier: 'Standard (<170ms)',
        tokens_per_second: 105,
        is_free: false,
        system_tier: 'tier_3_economy_coder',
        effective_tier: 'tier_3_economy_coder',
        modalities: ['text'],
        coding_score: 88,
        reasoning_score: 74,
        status: 'active',
        load_weight: 50,
      },
    ],
    input_cost_per_1m_usd: 0.30,
    output_cost_per_1m_usd: 0.90,
    est_latency_ms: 180.0,
    benchmarks: { humaneval: '88.4%', swe_bench_verified: '34.2%', context_window: '128k tokens', tokens_per_sec: '95 t/s' },
    reasoning_level: 'balanced',
    cost_category: 'Economy (<$0.50/1M)',
  },
  {
    tier: 'tier_4_mid_generalist',
    tier_number: 4,
    name: 'Mid-Tier Code Synthesis & Bug Fix Generalist',
    description: 'Multi-file bug remediation, standard business logic fixes, fast triage, and integration patch drafting.',
    functional_specialization: 'Bug Remediation & Multi-File Logic Synthesis',
    knowledge_vs_reasoning: 'Balanced Reasoning / Knowledge',
    target_tasks: ['Multi-file bug fix', 'API schema synchronization', 'Database migration script', 'Middleware logging'],
    representative_models: ['meta-llama/llama-3.3-70b-instruct', 'google/gemini-2.0-flash-001', 'mistralai/mistral-large-2411'],
    registered_models: [
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B Instruct',
        context_length: 131072,
        prompt_cost_per_1m: 0.35,
        completion_cost_per_1m: 1.10,
        latency_tier: 'Standard (<210ms)',
        tokens_per_second: 85,
        is_free: false,
        system_tier: 'tier_4_mid_generalist',
        effective_tier: 'tier_4_mid_generalist',
        modalities: ['text'],
        coding_score: 91,
        reasoning_score: 82,
        status: 'active',
        load_weight: 40,
      },
      {
        id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash',
        context_length: 1048576,
        prompt_cost_per_1m: 0.10,
        completion_cost_per_1m: 0.40,
        latency_tier: 'Fast (<150ms)',
        tokens_per_second: 150,
        is_free: false,
        system_tier: 'tier_4_mid_generalist',
        effective_tier: 'tier_4_mid_generalist',
        modalities: ['text', 'image', 'audio', 'video'],
        coding_score: 90,
        reasoning_score: 80,
        status: 'active',
        load_weight: 60,
      },
    ],
    input_cost_per_1m_usd: 0.40,
    output_cost_per_1m_usd: 1.20,
    est_latency_ms: 220.0,
    benchmarks: { humaneval: '91.2%', swe_bench_verified: '42.8%', context_window: '128k tokens', tokens_per_sec: '85 t/s' },
    reasoning_level: 'balanced',
    cost_category: 'Balanced Cost (<$1.00/1M)',
  },
  {
    tier: 'tier_5_fast_reasoner',
    tier_number: 5,
    name: 'Fast Multi-Turn Reasoner with Reflection',
    description: 'Complex multi-step logic analysis, algorithmic optimization, root cause analysis, and self-healing test loops.',
    functional_specialization: 'Algorithmic Optimization & Root Cause Analysis',
    knowledge_vs_reasoning: 'Reasoning-Biased (Thinking Chain)',
    target_tasks: ['Algorithmic fix', 'Deadlock detection', 'Memory leak resolution', 'Self-healing test runner'],
    representative_models: ['deepseek/deepseek-r1-distill-llama-70b', 'google/gemini-2.0-flash-thinking-exp:free', 'openai/gpt-4o-mini'],
    registered_models: [
      {
        id: 'google/gemini-2.0-flash-thinking-exp:free',
        name: 'Gemini 2.0 Flash Thinking (Free)',
        context_length: 1048576,
        prompt_cost_per_1m: 0.00,
        completion_cost_per_1m: 0.00,
        latency_tier: 'Standard (<300ms)',
        tokens_per_second: 90,
        is_free: true,
        system_tier: 'tier_5_fast_reasoner',
        effective_tier: 'tier_5_fast_reasoner',
        modalities: ['text'],
        coding_score: 93,
        reasoning_score: 92,
        status: 'active',
        load_weight: 50,
      },
      {
        id: 'deepseek/deepseek-r1-distill-llama-70b',
        name: 'DeepSeek R1 Distill Llama 70B',
        context_length: 131072,
        prompt_cost_per_1m: 0.60,
        completion_cost_per_1m: 2.20,
        latency_tier: 'Standard (<320ms)',
        tokens_per_second: 75,
        is_free: false,
        system_tier: 'tier_5_fast_reasoner',
        effective_tier: 'tier_5_fast_reasoner',
        modalities: ['text'],
        coding_score: 94,
        reasoning_score: 90,
        status: 'active',
        load_weight: 50,
      },
    ],
    input_cost_per_1m_usd: 0.60,
    output_cost_per_1m_usd: 2.20,
    est_latency_ms: 320.0,
    benchmarks: { humaneval: '93.5%', swe_bench_verified: '48.9%', context_window: '1M tokens', tokens_per_sec: '75 t/s' },
    reasoning_level: 'high',
    cost_category: 'Value Reasoner (<$1.50/1M)',
  },
  {
    tier: 'tier_6_core_workhorse',
    tier_number: 6,
    name: 'Core High-Capability Engineering Workhorse',
    description: 'Architectural component refactoring, robust multi-agent dispatch, cross-repo dependency resolution, and full PR generation.',
    functional_specialization: 'System-Wide Architecture Refactor & Core Engineering',
    knowledge_vs_reasoning: 'Balanced Reasoning / Deep Domain Knowledge',
    target_tasks: ['Microservice redesign', 'Full PR authoring', 'A2A coordinator dispatch', 'Database ORM migration'],
    representative_models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'deepseek/deepseek-v3'],
    registered_models: [
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        context_length: 200000,
        prompt_cost_per_1m: 3.00,
        completion_cost_per_1m: 15.00,
        latency_tier: 'Standard (<380ms)',
        tokens_per_second: 68,
        is_free: false,
        system_tier: 'tier_6_core_workhorse',
        effective_tier: 'tier_6_core_workhorse',
        modalities: ['text', 'image'],
        coding_score: 96,
        reasoning_score: 94,
        status: 'active',
        load_weight: 50,
      },
      {
        id: 'openai/gpt-4o',
        name: 'OpenAI GPT-4o',
        context_length: 128000,
        prompt_cost_per_1m: 2.50,
        completion_cost_per_1m: 10.00,
        latency_tier: 'Standard (<350ms)',
        tokens_per_second: 72,
        is_free: false,
        system_tier: 'tier_6_core_workhorse',
        effective_tier: 'tier_6_core_workhorse',
        modalities: ['text', 'image', 'audio'],
        coding_score: 95,
        reasoning_score: 93,
        status: 'active',
        load_weight: 50,
      },
    ],
    input_cost_per_1m_usd: 1.50,
    output_cost_per_1m_usd: 5.00,
    est_latency_ms: 380.0,
    benchmarks: { humaneval: '96.2%', swe_bench_verified: '57.4%', context_window: '200k tokens', tokens_per_sec: '65 t/s' },
    reasoning_level: 'high',
    cost_category: 'Workhorse ($1.50 - $3.00/1M)',
  },
  {
    tier: 'tier_7_deep_reasoner',
    tier_number: 7,
    name: 'Deep System Reasoner & Security Guard (R1 / o3-mini)',
    description: 'Deep mathematical & cryptographic reasoning, race conditions, formal verification, and automated penetration testing.',
    functional_specialization: 'Security Auditing, Race Conditions & Cryptographic Logic',
    knowledge_vs_reasoning: 'Reasoning-Heavy (Pure Inference Thinking)',
    target_tasks: ['SAST zero-day detection', 'Distributed consensus edge cases', 'Concurrency locks', 'Zero-knowledge proofs'],
    representative_models: ['deepseek/deepseek-r1', 'openai/o3-mini', 'google/gemini-2.0-pro-exp-02-05:free'],
    registered_models: [
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1 (Full 671B Reasoner)',
        context_length: 131072,
        prompt_cost_per_1m: 0.55,
        completion_cost_per_1m: 2.19,
        latency_tier: 'Deep (<550ms)',
        tokens_per_second: 55,
        is_free: false,
        system_tier: 'tier_7_deep_reasoner',
        effective_tier: 'tier_7_deep_reasoner',
        modalities: ['text'],
        coding_score: 97,
        reasoning_score: 98,
        status: 'active',
        load_weight: 60,
      },
      {
        id: 'openai/o3-mini',
        name: 'OpenAI o3-mini',
        context_length: 200000,
        prompt_cost_per_1m: 1.10,
        completion_cost_per_1m: 4.40,
        latency_tier: 'Deep (<600ms)',
        tokens_per_second: 60,
        is_free: false,
        system_tier: 'tier_7_deep_reasoner',
        effective_tier: 'tier_7_deep_reasoner',
        modalities: ['text'],
        coding_score: 96,
        reasoning_score: 97,
        status: 'active',
        load_weight: 40,
      },
    ],
    input_cost_per_1m_usd: 2.00,
    output_cost_per_1m_usd: 8.00,
    est_latency_ms: 550.0,
    benchmarks: { humaneval: '97.8%', swe_bench_verified: '65.2%', context_window: '128k tokens', tokens_per_sec: '45 t/s' },
    reasoning_level: 'ultra',
    cost_category: 'Specialized Reasoner ($2.00 - $5.00/1M)',
  },
  {
    tier: 'tier_8_senior_architect',
    tier_number: 8,
    name: 'Senior Enterprise Architect & Security Lead',
    description: 'Enterprise DDD domain modeling, legacy monolith decompilation, zero-trust cloud security posture, and compliance validation.',
    functional_specialization: 'Enterprise Architecture & Cloud Governance',
    knowledge_vs_reasoning: 'Extensive Architecture Memory & Enterprise Governance',
    target_tasks: ['Legacy migration to Rust/Go', 'SOC2 / HIPAA compliance audits', 'K8s multi-cluster mesh architecture'],
    representative_models: ['anthropic/claude-3.7-sonnet', 'openai/gpt-4.5-preview', 'google/gemini-1.5-pro-latest'],
    registered_models: [
      {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet (Hybrid Reasoning)',
        context_length: 200000,
        prompt_cost_per_1m: 3.00,
        completion_cost_per_1m: 15.00,
        latency_tier: 'Deep (<620ms)',
        tokens_per_second: 58,
        is_free: false,
        system_tier: 'tier_8_senior_architect',
        effective_tier: 'tier_8_senior_architect',
        modalities: ['text', 'image'],
        coding_score: 98,
        reasoning_score: 98,
        status: 'active',
        load_weight: 70,
      },
      {
        id: 'google/gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro (2M Context)',
        context_length: 2097152,
        prompt_cost_per_1m: 1.25,
        completion_cost_per_1m: 5.00,
        latency_tier: 'Standard (<420ms)',
        tokens_per_second: 65,
        is_free: false,
        system_tier: 'tier_8_senior_architect',
        effective_tier: 'tier_8_senior_architect',
        modalities: ['text', 'image', 'audio', 'video', 'pdf'],
        coding_score: 94,
        reasoning_score: 93,
        status: 'active',
        load_weight: 30,
      },
    ],
    input_cost_per_1m_usd: 3.00,
    output_cost_per_1m_usd: 15.00,
    est_latency_ms: 620.0,
    benchmarks: { humaneval: '98.5%', swe_bench_verified: '71.8%', context_window: '200k tokens', tokens_per_sec: '50 t/s' },
    reasoning_level: 'ultra',
    cost_category: 'High Performance ($3.00 - $6.00/1M)',
  },
  {
    tier: 'tier_9_frontier_synthesis',
    tier_number: 9,
    name: 'Frontier Synthesis & Complex Multi-Agent Orchestrator',
    description: 'Self-orchestrating multi-agent trees, complex compiler rewriting, dynamic AST mutation, and autonomous end-to-end fullstack apps.',
    functional_specialization: 'Autonomous Fullstack Architecture & Compiler-Level Synthesis',
    knowledge_vs_reasoning: 'Frontier Reasoning, Synthesis & Reflexive Iteration',
    target_tasks: ['Autonomous fullstack app creation', 'C++ to Rust auto-transpiler', 'AST rewriting engine', 'A2A supervisor'],
    representative_models: ['anthropic/claude-3.7-sonnet:thinking', 'openai/o1', 'x-ai/grok-2-1212'],
    registered_models: [
      {
        id: 'anthropic/claude-3.7-sonnet:thinking',
        name: 'Claude 3.7 Sonnet (Extended Thinking)',
        context_length: 200000,
        prompt_cost_per_1m: 3.00,
        completion_cost_per_1m: 15.00,
        latency_tier: 'Frontier (<900ms)',
        tokens_per_second: 48,
        is_free: false,
        system_tier: 'tier_9_frontier_synthesis',
        effective_tier: 'tier_9_frontier_synthesis',
        modalities: ['text', 'image'],
        coding_score: 99,
        reasoning_score: 99,
        status: 'active',
        load_weight: 50,
      },
      {
        id: 'openai/o1',
        name: 'OpenAI o1 Full',
        context_length: 200000,
        prompt_cost_per_1m: 15.00,
        completion_cost_per_1m: 60.00,
        latency_tier: 'Frontier (<1200ms)',
        tokens_per_second: 35,
        is_free: false,
        system_tier: 'tier_9_frontier_synthesis',
        effective_tier: 'tier_9_frontier_synthesis',
        modalities: ['text', 'image'],
        coding_score: 99,
        reasoning_score: 100,
        status: 'active',
        load_weight: 50,
      },
    ],
    input_cost_per_1m_usd: 5.00,
    output_cost_per_1m_usd: 25.00,
    est_latency_ms: 850.0,
    benchmarks: { humaneval: '99.2%', swe_bench_verified: '79.6%', context_window: '200k tokens', tokens_per_sec: '40 t/s' },
    reasoning_level: 'ultra',
    cost_category: 'Frontier ($5.00 - $15.00/1M)',
  },
  {
    tier: 'tier_10_elite_consensus',
    tier_number: 10,
    name: 'Elite Multi-Agent Committee & Byzantine Consensus Validator',
    description: 'Cross-model quorum: Claude 3.7 + o1 + DeepSeek R1 parallel synthesis with formal AST verification and zero-hallucination guarantee.',
    functional_specialization: 'Mission-Critical Multi-Model Consensus Verification',
    knowledge_vs_reasoning: 'Multi-Perspective Triangulation & Formal Theorem Proving',
    target_tasks: ['Smart contract audit', 'Kernel driver memory safety', 'Aerospace telemetry logic', 'Zero-hallucination quorum'],
    representative_models: ['consensus/ensemble-claude-o1-r1', 'meta-ensemble/frontier-quorum-10'],
    registered_models: [
      {
        id: 'consensus/ensemble-claude-o1-r1',
        name: 'Tri-Model Quorum (Claude 3.7 + o1 + R1)',
        context_length: 200000,
        prompt_cost_per_1m: 8.50,
        completion_cost_per_1m: 35.00,
        latency_tier: 'Quorum (<1400ms)',
        tokens_per_second: 30,
        is_free: false,
        system_tier: 'tier_10_elite_consensus',
        effective_tier: 'tier_10_elite_consensus',
        modalities: ['text', 'image'],
        coding_score: 100,
        reasoning_score: 100,
        status: 'active',
        load_weight: 100,
      },
    ],
    input_cost_per_1m_usd: 12.00,
    output_cost_per_1m_usd: 48.00,
    est_latency_ms: 1250.0,
    benchmarks: { humaneval: '99.9%', swe_bench_verified: '88.5%', context_window: '200k tokens', tokens_per_sec: '25 t/s' },
    reasoning_level: 'multi_agent_consensus',
    cost_category: 'Elite Quorum ($12.00+/1M)',
  },
];

export const INITIAL_ONBOARDED_REPOS: OnboardedRepo[] = [
  {
    id: 'repo-vaagatech-remedai',
    name: 'tharior-remedai',
    owner: 'vaagatech',
    provider: 'github',
    url: 'https://github.com/vaagatech/tharior-remedai',
    default_branch: 'main',
    selected_branches: ['main', 'develop'],
    available_branches: ['main', 'develop', 'staging', 'feature/ast-graph', 'release/v2.0'],
    status: 'INDEXED',
    last_indexed_at: '2026-08-27T17:20:00Z',
    stats: {
      files_count: 142,
      lines_of_code: 28450,
      symbols_count: 864,
      kg_nodes_count: 48,
      kg_edges_count: 92,
      languages: { TypeScript: 58, Python: 34, Shell: 8 },
    },
    auth_type: 'github_app',
    auth_config: {
      method: 'github_app',
      app_id: 'app_1092834',
      installation_id: 'inst_5893021',
      private_key_preview: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA3vK9... [Encrypted 2x with AWS KMS]\n-----END RSA PRIVATE KEY-----',
      encryption_layers: ['AES-256-GCM (Application DEK)', 'AWS KMS KEK (Envelope Encryption)'],
      kms_key_id: 'arn:aws:kms:us-east-1:257984970292:key/mrk-849fbc09',
      kms_key_version: 3,
      last_rotated_at: '2026-08-01T00:00:00Z',
      next_rotation_due: '2026-11-01T00:00:00Z',
      rotation_period_days: 90,
    },
    selected: true,
    is_checked: true,
  },
  {
    id: 'repo-vaagatech-gke-infra',
    name: 'gke-deployment',
    owner: 'vaagatech',
    provider: 'github',
    url: 'https://github.com/vaagatech/gke-deployment',
    default_branch: 'main',
    selected_branches: ['main'],
    available_branches: ['main', 'production', 'infra-modules'],
    status: 'INDEXED',
    last_indexed_at: '2026-08-27T17:25:00Z',
    stats: {
      files_count: 64,
      lines_of_code: 11200,
      symbols_count: 320,
      kg_nodes_count: 24,
      kg_edges_count: 42,
      languages: { HCL: 65, YAML: 25, Shell: 10 },
    },
    auth_type: 'federated_oauth',
    auth_config: {
      method: 'federated_oauth',
      oauth_identity: 'github:org:vaagatech',
      oauth_provider: 'GitHub Enterprise Cloud SSO',
      encryption_layers: ['AES-256-GCM (Application DEK)', 'AWS KMS KEK (Envelope Encryption)'],
      kms_key_id: 'arn:aws:kms:us-east-1:257984970292:key/mrk-849fbc09',
      kms_key_version: 3,
      last_rotated_at: '2026-08-01T00:00:00Z',
      next_rotation_due: '2026-11-01T00:00:00Z',
      rotation_period_days: 90,
    },
    selected: false,
    is_checked: true,
  },
];

export const INITIAL_KG_DATA: KnowledgeGraphData = {
  repo_id: 'repo-vaagatech-remedai',
  repo_name: 'vaagatech/tharior-remedai',
  indexed_at: '2026-08-27T17:20:00Z',
  nodes: [
    {
      id: 'app_main',
      label: 'app.main:app',
      type: 'module',
      filePath: 'apps/api-gateway/app/main.py',
      lineRange: [1, 140],
      complexity: 4,
      docstring: 'FastAPI Gateway bootstrap with CORS, OpenTelemetry, Redis caching and live routing.',
      callers: ['k8s_bff_ingress'],
      callees: ['router_llm', 'semantic_cache', 'task_orchestrator'],
      dependencies: ['fastapi', 'redis', 'pydantic'],
      x: 350,
      y: 120,
    },
    {
      id: 'router_llm',
      label: 'DynamicRouterEngine',
      type: 'class',
      filePath: 'apps/api-gateway/app/router/dynamic_tier_router.py',
      lineRange: [24, 210],
      complexity: 8,
      docstring: 'Autonomous multi-factor tiering and model selector analyzing prompt tokens and AST graph.',
      callers: ['app_main', 'agent_studio_api'],
      callees: ['openrouter_client', 'pricing_cache'],
      dependencies: ['httpx', 'useRemedaiStore'],
      x: 180,
      y: 260,
    },
    {
      id: 'semantic_cache',
      label: 'SemanticVectorCache',
      type: 'class',
      filePath: 'packages/cache/src/semantic_cache.py',
      lineRange: [15, 180],
      complexity: 6,
      docstring: 'Embedding-based cosine similarity cache with 92% hit rate for common coding patches.',
      callers: ['app_main', 'router_llm'],
      callees: ['redis_cluster'],
      dependencies: ['numpy', 'redis'],
      x: 520,
      y: 260,
    },
    {
      id: 'agent_studio_api',
      label: 'AgentStudioDesk',
      type: 'module',
      filePath: 'apps/web-desk/src/components/AgentStudioDesk.tsx',
      lineRange: [1, 380],
      complexity: 7,
      docstring: 'Developer direct prompt IDE with specialist agents and AST parser viewer.',
      callers: ['App_router'],
      callees: ['router_llm', 'useRemedaiStore'],
      dependencies: ['react', 'zustand', 'lucide-react'],
      x: 120,
      y: 420,
    },
    {
      id: 'model_catalog_api',
      label: 'ModelCatalogDesk',
      type: 'module',
      filePath: 'apps/web-desk/src/components/ModelCatalogDesk.tsx',
      lineRange: [1, 420],
      complexity: 6,
      docstring: '10-Tier multi-model catalog matrix with ±2 shifting and OpenRouter sync.',
      callers: ['App_router'],
      callees: ['useRemedaiStore'],
      dependencies: ['react', 'zustand'],
      x: 350,
      y: 420,
    },
    {
      id: 'repo_indexer',
      label: 'RepoASTGraphParser',
      type: 'class',
      filePath: 'packages/indexer/src/ast_parser.py',
      lineRange: [10, 290],
      complexity: 9,
      docstring: 'Constructs symbol dependency trees, function callers/callees, and knowledge graphs.',
      callers: ['repo_onboarding_desk'],
      callees: ['app_main'],
      dependencies: ['tree-sitter', 'networkx'],
      x: 580,
      y: 420,
    },
    {
      id: 'keda_autoscaler',
      label: 'KEDASpotScaler',
      type: 'class',
      filePath: 'deploy/k8s/resilient-app/templates/scaledobject.yaml',
      lineRange: [1, 65],
      complexity: 3,
      docstring: 'Scales agent worker pods from 0 to N based on queue depth.',
      callers: ['gke_cluster'],
      callees: ['redis_queue'],
      dependencies: ['k8s'],
      x: 750,
      y: 260,
    },
  ],
  edges: [
    { id: 'e1', source: 'app_main', target: 'router_llm', type: 'calls', weight: 3 },
    { id: 'e2', source: 'app_main', target: 'semantic_cache', type: 'calls', weight: 2 },
    { id: 'e3', source: 'router_llm', target: 'agent_studio_api', type: 'defines', weight: 2 },
    { id: 'e4', source: 'agent_studio_api', target: 'repo_indexer', type: 'imports', weight: 1 },
    { id: 'e5', source: 'repo_indexer', target: 'app_main', type: 'calls', weight: 2 },
    { id: 'e6', source: 'app_main', target: 'keda_autoscaler', type: 'imports', weight: 1 },
  ],
};

export const INITIAL_MULTIMODAL_SPECS: MultimodalTierSpec[] = [
  {
    modality: 'audio',
    group_name: 'Audio Transcription & Voice Agents',
    description: 'Speech-to-text code command transcription, podcast summaries, and ultra-low latency voice pair-programming.',
    tiers: [
      {
        tier_level: 'Audio-Tier 1 (Free / Local Whisper)',
        model_id: 'openai/whisper-large-v3-turbo',
        name: 'Whisper Large v3 Turbo',
        cost_estimate: '$0.002 / min',
        latency_estimate: '<250ms chunk',
        max_duration_or_res: '25MB / file',
        capabilities: ['Multilingual STT', 'Code punctuation', 'Speaker diarization'],
      },
      {
        tier_level: 'Audio-Tier 2 (Realtime Duplex Voice)',
        model_id: 'elevenlabs/flash-v2-5',
        name: 'ElevenLabs Flash 2.5',
        cost_estimate: '$0.015 / 1k chars',
        latency_estimate: '<95ms streaming',
        max_duration_or_res: 'Unlimited stream',
        capabilities: ['Realtime pair-programmer voice', 'Code synthesis narration'],
      },
    ],
  },
  {
    modality: 'video',
    group_name: 'Video Remediation & UI Demos',
    description: 'Automated video recordings of bug repros, visual regression playback, and PR walkthrough clips.',
    tiers: [
      {
        tier_level: 'Video-Tier 1 (Fast UI Walkthrough)',
        model_id: 'luma/ray-2-flash',
        name: 'Luma Ray 2 Flash',
        cost_estimate: '$0.08 / generation',
        latency_estimate: '12s generation',
        max_duration_or_res: '720p @ 30fps (5s)',
        capabilities: ['PR demo animation', 'Bug reproduction clip'],
      },
      {
        tier_level: 'Video-Tier 2 (Frontier Multimodal Analysis)',
        model_id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Video Analyzer',
        cost_estimate: '$0.10 / 1M tokens',
        latency_estimate: '<400ms frame',
        max_duration_or_res: '1 hour video stream',
        capabilities: ['Visual UI bug detection', 'Screen recording inspection'],
      },
    ],
  },
  {
    modality: 'image',
    group_name: 'Diagramming, Wireframes & UI Mockups',
    description: 'System architecture diagram generation, wireframe extraction from screenshots, and visual mockups.',
    tiers: [
      {
        tier_level: 'Image-Tier 1 (Fast Wireframe)',
        model_id: 'black-forest-labs/flux-1-schnell',
        name: 'FLUX.1 Schnell',
        cost_estimate: '$0.003 / image',
        latency_estimate: '<1.2s',
        max_duration_or_res: '1024x1024 px',
        capabilities: ['Mockup drafting', 'Iconography', 'Hero banners'],
      },
      {
        tier_level: 'Image-Tier 2 (Architecture Diagrams & OCR)',
        model_id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet Vision',
        cost_estimate: '$3.00 / 1M tokens',
        latency_estimate: '<450ms',
        max_duration_or_res: 'High-res AST schematics',
        capabilities: ['Screenshot-to-React UI', 'Architecture diagram deconstruction'],
      },
    ],
  },
  {
    modality: 'presentation',
    group_name: 'Executive & Architecture Decks',
    description: 'Automated executive summaries, technical architecture pitch decks, and sprint retro presentations.',
    tiers: [
      {
        tier_level: 'Presentation-Tier 1 (Markdown / Marp Deck)',
        model_id: 'deepseek/deepseek-chat:free',
        name: 'Marp Presentation Generator (Free)',
        cost_estimate: 'Free',
        latency_estimate: '<150ms',
        max_duration_or_res: '20 slide deck',
        capabilities: ['Marp slide markdown', 'Code highlighting', 'Mermaid integration'],
      },
    ],
  },
];

export const INITIAL_BACKLOG_STORIES: BacklogStory[] = [
  {
    id: 'story-101',
    source: 'github',
    key: 'THAR-42',
    title: 'Fix race condition in Redis semantic cache lock during high concurrency',
    description: 'When multiple agent workers attempt to acquire lease lock on Redis key simultaneously, TTL expiry causes orphaned worker lock.',
    repo: 'vaagatech/tharior-remedai',
    branch: 'fix/redis-cache-lock',
    priority: 'CRITICAL',
    status: 'BACKLOG',
    tier_needed: 'tier_7_deep_reasoner',
    estimated_cost_usd: 0.042,
  },
  {
    id: 'story-102',
    source: 'jira',
    key: 'REMED-108',
    title: 'Add comprehensive unit tests for AST parser function signatures',
    description: 'Ensure 100% test coverage for Python and TypeScript symbol tree extraction in packages/indexer.',
    repo: 'vaagatech/tharior-remedai',
    branch: 'feat/ast-tests',
    priority: 'MEDIUM',
    status: 'BACKLOG',
    tier_needed: 'tier_3_economy_coder',
    estimated_cost_usd: 0.008,
  },
  {
    id: 'story-103',
    source: 'gitlab',
    key: 'GL-891',
    title: 'Update Dockerfile build stage to use multi-arch lightningcss bindings',
    description: 'CI build fails on linux-x64 runner when optionalDependencies are skipped during npm ci in monorepo.',
    repo: 'vaagatech/tharior-remedai',
    branch: 'fix/ci-dockerfile-build',
    priority: 'HIGH',
    status: 'BACKLOG',
    tier_needed: 'tier_4_mid_generalist',
    estimated_cost_usd: 0.015,
  },
  {
    id: 'story-104',
    source: 'linear',
    key: 'LIN-332',
    title: 'Automate weekly OpenRouter pricing catalog refresh cron job',
    description: 'Create scheduled background worker in Cloud Scheduler to sync discounts and update tiering matrix.',
    repo: 'vaagatech/tharior-remedai',
    branch: 'feat/openrouter-cron-sync',
    priority: 'LOW',
    status: 'BACKLOG',
    tier_needed: 'tier_2_ultra_fast',
    estimated_cost_usd: 0.003,
  },
];

interface RemedaiStore {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Repositories & Onboarding
  onboardedRepos: OnboardedRepo[];
  activeRepo: OnboardedRepo | null;
  onboardRepo: (repo: Omit<OnboardedRepo, 'id' | 'status' | 'stats'>) => void;
  selectRepo: (id: string) => void;
  startIndexingRepo: (id: string) => void;
  toggleRepoChecked: (id: string) => void;
  selectAllRepos: (selected: boolean) => void;
  addRepoBranch: (repoId: string, branch: string) => void;
  removeRepoBranch: (repoId: string, branch: string) => void;
  batchIndexRepos: (repoIds?: string[]) => void;

  // Knowledge Graph
  knowledgeGraph: KnowledgeGraphData;
  selectedKGNode: KnowledgeGraphNode | null;
  selectKGNode: (node: KnowledgeGraphNode | null) => void;

  // System Intelligent Routing
  lastRoutingDecision: SystemRoutingDecision | null;
  evaluateSystemRouting: (prompt: string, targetRepo?: string, targetFiles?: string[]) => SystemRoutingDecision;

  // Model Tiers & Catalog
  tierSpecs: ModelTierSpec[];
  catalogEntries: ModelCatalogEntry[];
  customerOverrides: CustomerTierOverrideConfig;
  multimodalSpecs: MultimodalTierSpec[];
  setTierShift: (modelId: string, shift: number) => void;
  togglePreferFreeModels: (prefer: boolean) => void;
  setRefreshInterval: (hours: number) => void;
  syncOpenRouterCatalog: () => Promise<void>;

  // Backlog Stories & Automation
  backlogStories: BacklogStory[];
  activeStory: BacklogStory | null;
  selectStory: (story: BacklogStory | null) => void;
  remediateStory: (storyId: string) => Promise<void>;

  // Security & KMS Double-Encryption Vault
  securityVault: SecurityVaultState;
  rotateSecurityKeys: () => void;

  // Live Events Stream
  liveEvents: LiveEventItem[];
  addLiveEvent: (event: Omit<LiveEventItem, 'id' | 'timestamp'>) => void;

  // Global Search
  isSearchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
}

export const useRemedaiStore = create<RemedaiStore>((set, get) => ({
  activeTab: 'repos',
  setActiveTab: (tab) => set({ activeTab: tab }),

  securityVault: {
    double_encryption_enabled: true,
    primary_kms_provider: 'AWS KMS',
    kek_key_arn: 'arn:aws:kms:us-east-1:257984970292:key/mrk-849fbc09',
    active_kek_version: 3,
    dek_cipher: 'AES-256-GCM',
    auto_rotation_interval_days: 90,
    last_rotation_timestamp: '2026-08-01T00:00:00Z',
    next_scheduled_rotation: '2026-11-01T00:00:00Z',
    total_secrets_encrypted: 18,
    zero_plaintext_logs_enforced: true,
  },

  rotateSecurityKeys: () => {
    const nextVer = get().securityVault.active_kek_version + 1;
    const now = new Date().toISOString();
    const nextRot = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    set((state) => ({
      securityVault: {
        ...state.securityVault,
        active_kek_version: nextVer,
        last_rotation_timestamp: now,
        next_scheduled_rotation: nextRot,
      },
      onboardedRepos: state.onboardedRepos.map((r) => ({
        ...r,
        auth_config: r.auth_config
          ? {
              ...r.auth_config,
              kms_key_version: nextVer,
              last_rotated_at: now,
              next_rotation_due: nextRot,
            }
          : undefined,
      })),
    }));

    get().addLiveEvent({
      type: 'MODEL_SYNC',
      title: `Security KMS Key Rotation Complete (v${nextVer})`,
      description: `Re-wrapped all active Data Encryption Keys (DEKs) with new AWS KMS Key Encryption Key version ${nextVer}.`,
      severity: 'success',
    });
  },

  onboardedRepos: INITIAL_ONBOARDED_REPOS,
  activeRepo: INITIAL_ONBOARDED_REPOS[0],

  onboardRepo: (repoData) => {
    // Default to repo default branch and 'main' if not specified
    const defaultBranch = repoData.default_branch || 'main';
    const initialBranches = Array.from(
      new Set(repoData.selected_branches?.length ? repoData.selected_branches : [defaultBranch, 'main'])
    );

    const vault = get().securityVault;
    const authCfg: RepoAuthConfig = repoData.auth_config || {
      method: repoData.auth_type,
      encryption_layers: ['AES-256-GCM (Application DEK)', 'AWS KMS KEK (Envelope Encryption)'],
      kms_key_id: vault.kek_key_arn,
      kms_key_version: vault.active_kek_version,
      last_rotated_at: vault.last_rotation_timestamp,
      next_rotation_due: vault.next_scheduled_rotation,
      rotation_period_days: vault.auto_rotation_interval_days,
    };

    const newRepo: OnboardedRepo = {
      ...repoData,
      id: `repo-${Date.now()}`,
      default_branch: defaultBranch,
      selected_branches: initialBranches,
      available_branches: Array.from(new Set([defaultBranch, 'main', 'develop', 'staging'])),
      auth_type: repoData.auth_type,
      auth_config: authCfg,
      status: 'NOT_INDEXED',
      stats: {
        files_count: 0,
        lines_of_code: 0,
        symbols_count: 0,
        kg_nodes_count: 0,
        kg_edges_count: 0,
        languages: {},
      },
      selected: true,
      is_checked: true,
    };
    set((state) => ({
      onboardedRepos: [newRepo, ...state.onboardedRepos.map((r) => ({ ...r, selected: false }))],
      activeRepo: newRepo,
    }));
    get().startIndexingRepo(newRepo.id);
  },

  selectRepo: (id) => {
    set((state) => {
      const found = state.onboardedRepos.find((r) => r.id === id) || null;
      return {
        activeRepo: found,
        onboardedRepos: state.onboardedRepos.map((r) => ({ ...r, selected: r.id === id })),
      };
    });
  },

  toggleRepoChecked: (id) => {
    set((state) => ({
      onboardedRepos: state.onboardedRepos.map((r) =>
        r.id === id ? { ...r, is_checked: !r.is_checked } : r
      ),
    }));
  },

  selectAllRepos: (selected) => {
    set((state) => ({
      onboardedRepos: state.onboardedRepos.map((r) => ({ ...r, is_checked: selected })),
    }));
  },

  addRepoBranch: (repoId, branch) => {
    const trimmed = branch.trim();
    if (!trimmed) return;
    set((state) => ({
      onboardedRepos: state.onboardedRepos.map((r) => {
        if (r.id !== repoId) return r;
        if (r.selected_branches.includes(trimmed)) return r;
        return {
          ...r,
          selected_branches: [...r.selected_branches, trimmed],
          available_branches: Array.from(new Set([...(r.available_branches || []), trimmed])),
        };
      }),
    }));
  },

  removeRepoBranch: (repoId, branch) => {
    set((state) => ({
      onboardedRepos: state.onboardedRepos.map((r) => {
        if (r.id !== repoId) return r;
        // Don't allow removing if it's the only branch
        if (r.selected_branches.length <= 1) return r;
        return {
          ...r,
          selected_branches: r.selected_branches.filter((b) => b !== branch),
        };
      }),
    }));
  },

  batchIndexRepos: (repoIds) => {
    const targetIds = repoIds || get().onboardedRepos.filter((r) => r.is_checked).map((r) => r.id);
    if (!targetIds.length) return;

    set((state) => ({
      onboardedRepos: state.onboardedRepos.map((r) =>
        targetIds.includes(r.id) ? { ...r, status: 'INDEXING' } : r
      ),
    }));

    const reposList = get().onboardedRepos.filter((r) => targetIds.includes(r.id));
    const totalBranches = reposList.reduce((acc, r) => acc + (r.selected_branches?.length || 1), 0);

    get().addLiveEvent({
      type: 'AST_INDEXED',
      title: `Batch AST Indexing Initiated (${targetIds.length} Repos, ${totalBranches} Branches)`,
      description: `Starting parallel AST worker threads for repos: ${reposList.map((r) => r.name).join(', ')}`,
      severity: 'info',
    });

    setTimeout(() => {
      set((state) => ({
        onboardedRepos: state.onboardedRepos.map((r) =>
          targetIds.includes(r.id)
            ? {
                ...r,
                status: 'INDEXED',
                last_indexed_at: new Date().toISOString(),
                stats: {
                  files_count: Math.floor(100 + Math.random() * 120),
                  lines_of_code: Math.floor(18000 + Math.random() * 25000),
                  symbols_count: Math.floor(600 + Math.random() * 500),
                  kg_nodes_count: Math.floor(35 + Math.random() * 30),
                  kg_edges_count: Math.floor(60 + Math.random() * 60),
                  languages: { TypeScript: 55, Python: 35, Shell: 10 },
                },
              }
            : r
        ),
      }));

      get().addLiveEvent({
        type: 'AST_INDEXED',
        title: `Batch Indexing Complete for ${targetIds.length} Repositories`,
        description: `Constructed Knowledge Graph symbol topologies across all selected branches.`,
        severity: 'success',
      });
    }, 2200);
  },

  startIndexingRepo: (id) => {
    const repo = get().onboardedRepos.find((r) => r.id === id);
    const branches = repo?.selected_branches || ['main'];

    set((state) => ({
      onboardedRepos: state.onboardedRepos.map((r) =>
        r.id === id ? { ...r, status: 'INDEXING' } : r
      ),
    }));

    get().addLiveEvent({
      type: 'AST_INDEXED',
      title: `Repository Indexing Started: ${repo?.name || id}`,
      description: `Analyzing AST symbol trees across ${branches.length} branches (${branches.join(', ')})`,
      severity: 'info',
    });

    setTimeout(() => {
      set((state) => ({
        onboardedRepos: state.onboardedRepos.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'INDEXED',
                last_indexed_at: new Date().toISOString(),
                stats: {
                  files_count: 142,
                  lines_of_code: 28450,
                  symbols_count: 864,
                  kg_nodes_count: 48,
                  kg_edges_count: 92,
                  languages: { TypeScript: 58, Python: 34, Shell: 8 },
                },
              }
            : r
        ),
      }));

      get().addLiveEvent({
        type: 'AST_INDEXED',
        title: 'Knowledge Graph Successfully Generated',
        description: `Parsed 864 symbols across branches [${branches.join(', ')}], extracted 48 Knowledge Graph nodes and 92 dependency edges.`,
        severity: 'success',
      });
    }, 2000);
  },

  knowledgeGraph: INITIAL_KG_DATA,
  selectedKGNode: INITIAL_KG_DATA.nodes[0],
  selectKGNode: (node) => set({ selectedKGNode: node }),

  lastRoutingDecision: {
    task_intent: 'Core Architecture Refactoring & AST Inspection',
    complexity_score: 7,
    context_tokens_est: 28400,
    recommended_tier: 'tier_6_core_workhorse',
    recommended_tier_name: 'Tier 6: Core Engineering Workhorse',
    recommended_model_id: 'anthropic/claude-3.5-sonnet',
    recommended_model_name: 'Claude 3.5 Sonnet',
    reasoning_rationale: 'System analyzed prompt tokens (28.4k), multi-module AST dependencies across 3 files, and balanced reasoning depth required. Automatically selected Claude 3.5 Sonnet for high accuracy at optimal cost.',
    alternative_models: ['openai/gpt-4o', 'google/gemini-2.0-flash-001'],
    budget_impact: '$0.024 / run',
    confidence_score: 98.6,
    ast_features_detected: ['Multi-file imports', 'Async coroutines', 'Pydantic model validation'],
  },

  evaluateSystemRouting: (prompt: string, targetRepo?: string, targetFiles?: string[]) => {
    const promptLower = prompt.toLowerCase();
    let complexity = 4;
    let tier: TierLevel = 'tier_4_mid_generalist';
    let tierName = 'Tier 4: Mid-Tier Code Synthesis & Bug Fix';
    let modelId = 'google/gemini-2.0-flash-001';
    let modelName = 'Gemini 2.0 Flash';
    let rationale = '';
    const astFeatures: string[] = [];

    if (
      promptLower.includes('consensus') ||
      promptLower.includes('smart contract') ||
      promptLower.includes('zero-day') ||
      promptLower.includes('formal verification')
    ) {
      complexity = 10;
      tier = 'tier_10_elite_consensus';
      tierName = 'Tier 10: Elite Multi-Agent Committee & Consensus';
      modelId = 'consensus/ensemble-claude-o1-r1';
      modelName = 'Tri-Model Quorum (Claude 3.7 + o1 + R1)';
      rationale = 'Mission-critical consensus detected. The system activated a 3-agent Byzantine quorum with formal AST verification.';
      astFeatures.push('Byzantine Quorum', 'Formal Verification', 'Zero-Hallucination Gate');
    } else if (
      promptLower.includes('compiler') ||
      promptLower.includes('fullstack') ||
      promptLower.includes('autonomous') ||
      promptLower.includes('transpile')
    ) {
      complexity = 9;
      tier = 'tier_9_frontier_synthesis';
      tierName = 'Tier 9: Frontier Synthesis & Autonomous Fullstack';
      modelId = 'anthropic/claude-3.7-sonnet:thinking';
      modelName = 'Claude 3.7 Sonnet (Extended Thinking)';
      rationale = 'High-level synthesis and AST mutation required. System allocated frontier extended thinking reasoning budget.';
      astFeatures.push('Dynamic AST Mutation', 'Extended Thinking Chain', 'Cross-Module Transpiler');
    } else if (
      promptLower.includes('security') ||
      promptLower.includes('race condition') ||
      promptLower.includes('deadlock') ||
      promptLower.includes('cryptograph')
    ) {
      complexity = 7;
      tier = 'tier_7_deep_reasoner';
      tierName = 'Tier 7: Deep System Reasoner & Security Guard';
      modelId = 'deepseek/deepseek-r1';
      modelName = 'DeepSeek R1 (671B)';
      rationale = 'Concurrency or security challenge detected. System selected DeepSeek R1 for deep mathematical and lock analysis.';
      astFeatures.push('Thread Lock Inspection', 'SAST Security Heuristic', 'Race Condition Tree');
    } else if (
      promptLower.includes('unit test') ||
      promptLower.includes('test coverage') ||
      promptLower.includes('mock') ||
      promptLower.includes('pytest')
    ) {
      complexity = 3;
      tier = 'tier_3_economy_coder';
      tierName = 'Tier 3: Economy Code Refactorer & Unit Test Generator';
      modelId = 'qwen/qwen-2.5-coder-32b-instruct';
      modelName = 'Qwen 2.5 Coder 32B Instruct';
      rationale = 'Unit test and boilerplate generation task. System routed to economical high-speed coder to preserve cloud budget.';
      astFeatures.push('Unit Test Mocking', 'Assert Validation', 'Mechanical Refactor');
    } else if (
      promptLower.includes('typo') ||
      promptLower.includes('comment') ||
      promptLower.includes('docstring') ||
      promptLower.includes('lint')
    ) {
      complexity = 1;
      tier = 'tier_1_micro_lint';
      tierName = 'Tier 1: Micro & Local Syntax Guard (Free)';
      modelId = 'google/gemini-2.0-flash-lite:free';
      modelName = 'Gemini 2.0 Flash Lite (Free)';
      rationale = 'Formatting and syntax check. System auto-routed to 100% Free model tier with 0ms latency impact.';
      astFeatures.push('Docstring Linting', 'Typo Correction', '0-Cost Free Model');
    } else {
      complexity = 6;
      tier = 'tier_6_core_workhorse';
      tierName = 'Tier 6: Core High-Capability Engineering Workhorse';
      modelId = 'anthropic/claude-3.5-sonnet';
      modelName = 'Claude 3.5 Sonnet';
      rationale = 'Standard multi-file software engineering task. System automatically selected core engineering workhorse.';
      astFeatures.push('Multi-file Context', 'Type Signature Check', 'Reflective Diffing');
    }

    const decision: SystemRoutingDecision = {
      task_intent: targetRepo ? `[${targetRepo}] ${prompt.slice(0, 50)}` : prompt.slice(0, 60) || 'Direct Code Remediation',
      complexity_score: complexity,
      context_tokens_est: (prompt.length * 4) + ((targetFiles?.length || 1) * 8000),
      recommended_tier: tier,
      recommended_tier_name: tierName,
      recommended_model_id: modelId,
      recommended_model_name: modelName,
      reasoning_rationale: rationale,
      alternative_models: ['openai/gpt-4o', 'google/gemini-2.0-flash-001'],
      budget_impact: complexity > 6 ? '$0.028 / run' : '< $0.005 / run',
      confidence_score: 97.8 + (Math.random() * 2),
      ast_features_detected: astFeatures,
    };

    set({ lastRoutingDecision: decision });

    get().addLiveEvent({
      type: 'ROUTER_DECISION',
      title: `System Intelligently Routed Task to ${tierName}`,
      description: `Task complexity: ${complexity}/10. Model chosen: ${modelName}. Rationale: ${rationale}`,
      tier: tier,
      model: modelName,
      severity: 'info',
    });

    return decision;
  },

  tierSpecs: INITIAL_10_TIER_SPECS,
  catalogEntries: INITIAL_10_TIER_SPECS.flatMap((t) => t.registered_models),
  customerOverrides: {
    tenant_id: 'vaagatech-enterprise-dev',
    allowed_models: [],
    tier_shifts: {},
    prefer_free_models: true,
    refresh_interval_hours: 168,
  },
  multimodalSpecs: INITIAL_MULTIMODAL_SPECS,

  setTierShift: (modelId, shift) => {
    set((state) => {
      const currentShifts = { ...state.customerOverrides.tier_shifts };
      if (shift === 0) {
        delete currentShifts[modelId];
      } else {
        currentShifts[modelId] = shift;
      }
      return {
        customerOverrides: {
          ...state.customerOverrides,
          tier_shifts: currentShifts,
        },
      };
    });
  },

  togglePreferFreeModels: (prefer) => {
    set((state) => ({
      customerOverrides: {
        ...state.customerOverrides,
        prefer_free_models: prefer,
      },
    }));
  },

  setRefreshInterval: (hours) => {
    set((state) => ({
      customerOverrides: {
        ...state.customerOverrides,
        refresh_interval_hours: hours,
      },
    }));
  },

  syncOpenRouterCatalog: async () => {
    get().addLiveEvent({
      type: 'MODEL_SYNC',
      title: 'OpenRouter Models & Pricing Synchronized',
      description: 'Weekly scheduled model sync refreshed 340+ model tiers, discounts, and latency benchmarks.',
      severity: 'success',
    });
  },

  backlogStories: INITIAL_BACKLOG_STORIES,
  activeStory: INITIAL_BACKLOG_STORIES[0],
  selectStory: (story) => set({ activeStory: story }),

  remediateStory: async (storyId) => {
    const story = get().backlogStories.find((s) => s.id === storyId);
    if (!story) return;

    // Evaluate system routing for this story
    get().evaluateSystemRouting(`${story.title} - ${story.description}`, story.repo);

    set((state) => ({
      backlogStories: state.backlogStories.map((s) =>
        s.id === storyId
          ? {
              ...s,
              status: 'IN_PROGRESS',
              assigned_agent: 'Autonomous Lead Agent',
            }
          : s
      ),
    }));

    get().addLiveEvent({
      type: 'AGENT_DISPATCH',
      title: `Agent Picked Backlog Story: ${story.key}`,
      description: `Autonomous remediation started on branch ${story.branch} using system-routed tier ${story.tier_needed}`,
      tier: story.tier_needed,
      repo: story.repo,
      severity: 'info',
    });

    setTimeout(() => {
      set((state) => ({
        backlogStories: state.backlogStories.map((s) =>
          s.id === storyId
            ? {
                ...s,
                status: 'REVIEW',
                diff_preview: `diff --git a/app/main.py b/app/main.py\n--- a/app/main.py\n+++ b/app/main.py\n@@ -42,6 +42,9 @@ async def acquire_redis_lock(key: str):\n+    # Remediation applied by Autonomous Agent:\n+    # Added non-blocking TTL jitter and distributed fallback\n+    return await redis_cluster.acquire_lock_with_jitter(key, ttl=30)`,
                automated_remediation_summary: 'Remediated TTL expiry race condition by introducing distributed jitter lock.',
                last_comment: '🤖 Remediated by Autonomous Coding Agent. All 42 unit tests passed. PR #89 opened.',
              }
            : s
        ),
      }));

      get().addLiveEvent({
        type: 'DIFF_GENERATED',
        title: `Story Remediated & Pull Request Ready: ${story.key}`,
        description: 'Clean AST patch generated, unit tests passed (100% green). PR submitted for automated review.',
        tier: story.tier_needed,
        repo: story.repo,
        severity: 'success',
      });
    }, 2500);
  },

  liveEvents: [
    {
      id: 'ev-1',
      timestamp: '2026-08-27T17:25:00Z',
      type: 'MODEL_SYNC',
      title: 'OpenRouter Model Catalog Synchronized',
      description: 'Loaded 340 models across 10 system tiers with free model prioritization.',
      severity: 'success',
    },
    {
      id: 'ev-2',
      timestamp: '2026-08-27T17:25:10Z',
      type: 'AST_INDEXED',
      title: 'Repository AST & Knowledge Graph Indexed',
      description: 'Constructed 48 Knowledge Graph nodes and 92 dependency edges for vaagatech/tharior-remedai.',
      repo: 'vaagatech/tharior-remedai',
      severity: 'info',
    },
    {
      id: 'ev-3',
      timestamp: '2026-08-27T17:25:20Z',
      type: 'ROUTER_DECISION',
      title: 'Autonomous System Dynamic Tiering Active',
      description: 'System intelligent router analyzing prompts and tasks autonomously without manual tier selection.',
      severity: 'info',
    },
  ],
  addLiveEvent: (event) => {
    const newEvent: LiveEventItem = {
      ...event,
      id: `ev-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ liveEvents: [newEvent, ...state.liveEvents.slice(0, 49)] }));
  },

  isSearchModalOpen: false,
  setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),
}));
