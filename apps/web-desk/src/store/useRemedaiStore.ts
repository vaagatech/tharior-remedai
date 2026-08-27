import { create } from 'zustand';
import type {
  ModelTierSpec,
  CustomerTierOverrideConfig,
  MultimodalTierSpec,
  BacklogStory,
  PromptExecutionRequest,
  TierLevel,
} from '../types';

export const INITIAL_10_TIER_SPECS: ModelTierSpec[] = [
  {
    tier: 'tier_1_micro_lint',
    tier_number: 1,
    name: 'Micro & Local Syntax Guard (Free / Ultra-Low)',
    description: 'Ultra-fast syntax checking, typo fixes, comment formatting, and linter resolution using free or micro models.',
    functional_specialization: 'Documentation & Syntax Formatting',
    knowledge_vs_reasoning: 'Knowledge-Biased (Sub-word Grammars)',
    target_tasks: ['Syntax check', 'Typo correction', 'Comment format', 'Docstring rename', 'Linter fixes'],
    representative_models: ['meta-llama/llama-3.2-3b-instruct:free', 'google/gemini-2.0-flash-lite:free', 'qwen/qwen-2.5-coder-7b'],
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
    input_cost_per_1m_usd: 2.50,
    output_cost_per_1m_usd: 10.00,
    est_latency_ms: 450.0,
    benchmarks: { humaneval: '95.1%', swe_bench_verified: '57.4%', context_window: '200k tokens', tokens_per_sec: '65 t/s' },
    reasoning_level: 'high',
    cost_category: 'Core Workhorse ($2-$5/1M)',
  },
  {
    tier: 'tier_7_deep_reasoner',
    tier_number: 7,
    name: 'Deep Logic & Abstract AST Symbolic Reasoner',
    description: 'Formal verification, distributed concurrency debugging, mathematical algorithm redesign, and deep recursive tree search.',
    functional_specialization: 'Concurrency Debugging & Symbolic AST Transformation',
    knowledge_vs_reasoning: 'Pure Reasoning-Heavy (CoT Reinforcement)',
    target_tasks: ['Distributed lock debugging', 'Compiler AST transforms', 'Formal logic verification', 'Race condition elimination'],
    representative_models: ['openai/o1-mini', 'deepseek/deepseek-r1', 'qwen/qwq-32b-preview'],
    input_cost_per_1m_usd: 3.00,
    output_cost_per_1m_usd: 12.00,
    est_latency_ms: 750.0,
    benchmarks: { humaneval: '96.8%', swe_bench_verified: '62.1%', context_window: '128k tokens', tokens_per_sec: '45 t/s' },
    reasoning_level: 'ultra',
    cost_category: 'Deep Reasoner ($3-$8/1M)',
  },
  {
    tier: 'tier_8_senior_architect',
    tier_number: 8,
    name: 'Senior Lead & System Architect with Extended Thinking',
    description: 'Zero-regression distributed refactoring, high-impact security vulnerability elimination, and cross-framework migration.',
    functional_specialization: 'Zero-Regression System Architecture & Security Hardening',
    knowledge_vs_reasoning: 'Frontier Reasoning + Broad Engineering Knowledge',
    target_tasks: ['Distributed system redesign', 'Zero-day vulnerability patch', 'Legacy framework migration', 'Multi-tenant isolation'],
    representative_models: ['anthropic/claude-3.7-sonnet:thinking', 'anthropic/claude-3.7-sonnet', 'openai/o3-mini'],
    input_cost_per_1m_usd: 3.00,
    output_cost_per_1m_usd: 15.00,
    est_latency_ms: 900.0,
    benchmarks: { humaneval: '97.4%', swe_bench_verified: '70.3%', context_window: '200k tokens', tokens_per_sec: '50 t/s' },
    reasoning_level: 'ultra',
    cost_category: 'High-End Architect ($3-$15/1M)',
  },
  {
    tier: 'tier_9_frontier_synthesis',
    tier_number: 9,
    name: 'Frontier Multi-Repository Autonomous Synthesis',
    description: 'Autonomous multi-repository feature implementation, intricate full-stack codebase transformations, and complex schema evolutions.',
    functional_specialization: 'Autonomous Full-Stack Engineering & Cross-Repository Synthesis',
    knowledge_vs_reasoning: 'Frontier Reasoning & Multi-Domain Synthesis',
    target_tasks: ['Cross-repository feature delivery', 'Full-stack migration', 'Complex distributed consensus', 'End-to-end SAST remediation'],
    representative_models: ['openai/o1', 'anthropic/claude-3.7-sonnet:thinking', 'openai/o3-mini-high'],
    input_cost_per_1m_usd: 15.00,
    output_cost_per_1m_usd: 60.00,
    est_latency_ms: 1400.0,
    benchmarks: { humaneval: '98.2%', swe_bench_verified: '79.6%', context_window: '200k tokens', tokens_per_sec: '35 t/s' },
    reasoning_level: 'ultra',
    cost_category: 'Frontier Heavy ($15-$60/1M)',
  },
  {
    tier: 'tier_10_elite_consensus',
    tier_number: 10,
    name: 'Multi-Model Consensus & Voting Council',
    description: 'Zero-tolerance critical infrastructure changes. Runs 3 frontier models (Claude 3.7 + o1 + DeepSeek R1) in parallel with AST voting.',
    functional_specialization: 'Mission-Critical Consensus & Multi-Agent Voting Council',
    knowledge_vs_reasoning: 'Multi-Agent Ensemble & Cross-Verification',
    target_tasks: ['Mission-critical fintech security', 'Infrastructure Terraform rollout', 'Auth/Crypto core verification', 'Consensus voting'],
    representative_models: ['Multi-Model: Claude-3.7 + OpenAI-o1 + DeepSeek-R1', 'Ensemble Voting Engine'],
    input_cost_per_1m_usd: 21.00,
    output_cost_per_1m_usd: 87.00,
    est_latency_ms: 2200.0,
    benchmarks: { humaneval: '99.1%', swe_bench_verified: '86.5%', context_window: '200k+ tokens', tokens_per_sec: 'Parallel' },
    reasoning_level: 'multi_agent_consensus',
    cost_category: 'Elite Council ($20-$90/1M)',
  },
];

export const INITIAL_MULTIMODAL_SPECS: MultimodalTierSpec[] = [
  {
    modality: 'audio',
    group_name: 'Audio & Speech Intelligence',
    description: 'Speech recognition, audio transcription, voice debugging, and voice generation models.',
    tiers: [
      {
        tier_level: 'Audio-Tier 1 (Fast Transcription)',
        model_id: 'openai/whisper-large-v3-turbo',
        name: 'Whisper Large v3 Turbo',
        cost_estimate: '$0.006 / min',
        latency_estimate: '120ms / chunk',
        max_duration_or_res: '25 MB / file',
        capabilities: ['Multilingual speech-to-text', 'Timestamp alignment', 'Punctuation formatting'],
      },
      {
        tier_level: 'Audio-Tier 2 (Interactive Multimodal)',
        model_id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash Audio In/Out',
        cost_estimate: 'Free / $0.07/1M',
        latency_estimate: '85ms realtime',
        max_duration_or_res: '9.5 hours stream',
        capabilities: ['Direct audio comprehension', 'Code discussion via voice', 'Tone analysis'],
      },
    ],
  },
  {
    modality: 'video',
    group_name: 'Video & Motion Synthesis',
    description: 'Visual UI testing video analysis, workflow recordings, and automated demo video generation.',
    tiers: [
      {
        tier_level: 'Video-Tier 1 (Frame Analysis & QA)',
        model_id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Video Frame Analyzer',
        cost_estimate: '$0.10 / 1M tokens',
        latency_estimate: '350ms / clip',
        max_duration_or_res: '1080p @ 30fps (1M context)',
        capabilities: ['UI regression visual inspection', 'Browser video action verification', 'Crash frame detection'],
      },
      {
        tier_level: 'Video-Tier 2 (Demo Generation)',
        model_id: 'luma/ray-2-video',
        name: 'Luma Ray 2 / Kling AI',
        cost_estimate: '$0.04 / sec generation',
        latency_estimate: '4.5s / 5-sec render',
        max_duration_or_res: '1080p 60fps',
        capabilities: ['PR demo video generation', 'Feature showcase animation', 'Bug reproduction clip'],
      },
    ],
  },
  {
    modality: 'image',
    group_name: 'Image & UI Diagram Generation',
    description: 'Architecture diagrams, UI mockup rendering, visual diff audits, and flowchart creation.',
    tiers: [
      {
        tier_level: 'Image-Tier 1 (Diagram & Chart OCR)',
        model_id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet Vision',
        cost_estimate: '$3.00 / 1M tokens',
        latency_estimate: '320ms',
        max_duration_or_res: '4096 x 4096 px',
        capabilities: ['Software architecture diagram to code', 'Database ERD parsing', 'UI screenshot to HTML/CSS'],
      },
      {
        tier_level: 'Image-Tier 2 (Asset Generation)',
        model_id: 'black-forest-labs/flux-1-dev',
        name: 'Flux.1 Dev High-Res',
        cost_estimate: '$0.03 / image',
        latency_estimate: '2.8s',
        max_duration_or_res: '2048 x 2048 px',
        capabilities: ['App icon generation', 'Dark-mode banner creation', 'Vector asset mockups'],
      },
    ],
  },
  {
    modality: 'presentation',
    group_name: 'Presentations & Technical Docs',
    description: 'Automated executive slide generation, markdown architecture whitepapers, and customer release decks.',
    tiers: [
      {
        tier_level: 'Doc-Tier 1 (Executive PPTX & Markdown)',
        model_id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Technical Documentation Engine',
        cost_estimate: '$3.00 / 1M tokens',
        latency_estimate: '850ms',
        max_duration_or_res: '200k context',
        capabilities: ['Interactive slide decks', 'Mermaid diagram whitepapers', 'SOC2 compliance reports'],
      },
    ],
  },
];

export const INITIAL_STORIES: BacklogStory[] = [
  {
    id: 'story-101',
    source: 'github',
    key: 'GH-842',
    title: 'Resolve memory leak in WebSocket stream during high concurrent client broadcasts',
    description: 'During peak load (>500 concurrent connections), memory RSS climbs monotonically by 15MB/min due to uncollected cyclic task references.',
    repo: 'vaagatech/tharior-remedai',
    branch: 'fix/ws-memory-leak-broadcast',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    assigned_agent: 'Performance & SAST Guard',
    tier_needed: 'tier_7_deep_reasoner',
    estimated_cost_usd: 0.042,
    created_at: '2026-08-27 13:30',
    comments_count: 5,
    auto_merge_allowed: true,
  },
  {
    id: 'story-102',
    source: 'jira',
    key: 'ENG-3910',
    title: 'Automate OpenRouter weekly model pricing ingestion with ±2 tier customer shifting',
    description: 'Ensure OpenRouter pricing API is refreshed periodically and allows customer overrides for allowed models.',
    repo: 'vaagatech/tharior-remedai',
    branch: 'feat/openrouter-weekly-tier-shift',
    priority: 'HIGH',
    status: 'BACKLOG',
    assigned_agent: 'Tiered Routing & Cost Architect',
    tier_needed: 'tier_5_fast_reasoner',
    estimated_cost_usd: 0.015,
    created_at: '2026-08-27 14:15',
    comments_count: 2,
    auto_merge_allowed: true,
  },
  {
    id: 'story-103',
    source: 'linear',
    key: 'LIN-108',
    title: 'Implement Multi-Model Tier 10 Consensus Voting Engine for critical auth paths',
    description: 'Enforce Claude 3.7 + OpenAI o1 + DeepSeek R1 three-model ensemble cross-validation before auto-merging authorization changes.',
    repo: 'vaagatech/tharior-remedai',
    branch: 'feat/consensus-tier-10',
    priority: 'CRITICAL',
    status: 'BACKLOG',
    assigned_agent: 'Consensus & Security Council',
    tier_needed: 'tier_10_elite_consensus',
    estimated_cost_usd: 0.185,
    created_at: '2026-08-27 15:00',
    comments_count: 8,
    auto_merge_allowed: false,
  },
  {
    id: 'story-104',
    source: 'gitlab',
    key: 'GL-55',
    title: 'Generate responsive collapsible left navigation and location-based routing for Web Desk',
    description: 'Convert top navbar into left sidebar grouped by workspaces, LLM tiers, integrations, and SAST observability.',
    repo: 'vaagatech/tharior-remedai',
    branch: 'feat/ui-left-nav-router',
    priority: 'HIGH',
    status: 'REVIEW',
    assigned_agent: 'Full-Stack UI Engineer',
    tier_needed: 'tier_4_mid_generalist',
    estimated_cost_usd: 0.008,
    created_at: '2026-08-27 15:20',
    comments_count: 4,
    auto_merge_allowed: true,
  },
];

interface RemedaiStoreState {
  activePath: string;
  setActivePath: (path: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;

  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  isApiConnected: boolean;
  setIsApiConnected: (connected: boolean) => void;

  tierSpecs: ModelTierSpec[];
  multimodalSpecs: MultimodalTierSpec[];
  customerConfig: CustomerTierOverrideConfig;
  setTierShift: (modelId: string, shift: number) => void;
  toggleAllowedModel: (modelId: string) => void;
  setPreferFreeModels: (prefer: boolean) => void;
  setCustomOpenRouterUrl: (url: string) => void;
  setCustomOpenRouterKey: (key: string) => void;

  stories: BacklogStory[];
  pickAndRemediateStory: (storyId: string) => Promise<void>;
  addStoryComment: (storyId: string, author: string, text: string) => void;

  activePrompt: string;
  setActivePrompt: (prompt: string) => void;
  selectedAgentRole: PromptExecutionRequest['agent_role'];
  setSelectedAgentRole: (role: PromptExecutionRequest['agent_role']) => void;
  selectedTier: TierLevel;
  setSelectedTier: (tier: TierLevel) => void;
  isExecutingPrompt: boolean;
  promptExecutionOutput: string;
  promptThoughtTrace: Array<{ time: string; thought: string; step: string }>;
  promptCodeDiff: string;
  executePrompt: (req: PromptExecutionRequest) => Promise<void>;
  clearPromptStudio: () => void;
}

export const useRemedaiStore = create<RemedaiStoreState>((set, get) => ({
  activePath: window.location.pathname || '/',
  setActivePath: (path) => {
    window.history.pushState({}, '', path);
    set({ activePath: path });
  },
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  globalSearchQuery: '',
  setGlobalSearchQuery: (q) => set({ globalSearchQuery: q }),
  isSearchModalOpen: false,
  setIsSearchModalOpen: (open) => set({ isSearchModalOpen: open }),

  apiBaseUrl: localStorage.getItem('remedai_api_url') || (import.meta.env.VITE_API_BASE_URL ?? ''),
  setApiBaseUrl: (url) => {
    localStorage.setItem('remedai_api_url', url);
    set({ apiBaseUrl: url });
  },
  isApiConnected: false,
  setIsApiConnected: (connected) => set({ isApiConnected: connected }),

  tierSpecs: INITIAL_10_TIER_SPECS,
  multimodalSpecs: INITIAL_MULTIMODAL_SPECS,
  customerConfig: {
    tenant_id: 'dev-tenant',
    allowed_models: [
      'meta-llama/llama-3.2-3b-instruct:free',
      'deepseek/deepseek-chat:free',
      'qwen/qwen-2.5-coder-32b-instruct',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-r1-distill-llama-70b',
      'anthropic/claude-3.5-sonnet',
      'openai/o1-mini',
      'anthropic/claude-3.7-sonnet:thinking',
      'openai/o1',
    ],
    tier_shifts: {},
    prefer_free_models: true,
    custom_openrouter_url: 'https://openrouter.ai/api/v1/models',
    refresh_interval_hours: 168,
  },
  setTierShift: (modelId, shift) =>
    set((state) => ({
      customerConfig: {
        ...state.customerConfig,
        tier_shifts: {
          ...state.customerConfig.tier_shifts,
          [modelId]: Math.max(-2, Math.min(2, shift)),
        },
      },
    })),
  toggleAllowedModel: (modelId) =>
    set((state) => {
      const allowed = state.customerConfig.allowed_models.includes(modelId)
        ? state.customerConfig.allowed_models.filter((m) => m !== modelId)
        : [...state.customerConfig.allowed_models, modelId];
      return { customerConfig: { ...state.customerConfig, allowed_models: allowed } };
    }),
  setPreferFreeModels: (prefer) =>
    set((state) => ({
      customerConfig: { ...state.customerConfig, prefer_free_models: prefer },
    })),
  setCustomOpenRouterUrl: (url) =>
    set((state) => ({
      customerConfig: { ...state.customerConfig, custom_openrouter_url: url },
    })),
  setCustomOpenRouterKey: (key) =>
    set((state) => ({
      customerConfig: { ...state.customerConfig, custom_openrouter_key: key },
    })),

  stories: INITIAL_STORIES,
  pickAndRemediateStory: async (storyId) => {
    const story = get().stories.find((s) => s.id === storyId);
    if (!story) return;

    set((state) => ({
      stories: state.stories.map((s) =>
        s.id === storyId
          ? {
              ...s,
              status: 'IN_PROGRESS',
              assigned_agent: s.assigned_agent || 'Autonomous Remediation Lead',
            }
          : s
      ),
    }));

    set({
      activePrompt: `Task: Remediate ${story.key} - ${story.title}\n\nDescription:\n${story.description}\n\nTarget Repo: ${story.repo}\nTarget Branch: ${story.branch}`,
      selectedTier: story.tier_needed,
      activePath: '/studio',
    });
  },
  addStoryComment: (storyId, _author, _text) =>
    set((state) => ({
      stories: state.stories.map((s) =>
        s.id === storyId ? { ...s, comments_count: s.comments_count + 1 } : s
      ),
    })),

  activePrompt: 'Fix the memory leak in WebSocket stream handlers where client listeners are not unregistered during connection timeout.',
  setActivePrompt: (prompt) => set({ activePrompt: prompt }),
  selectedAgentRole: 'coder',
  setSelectedAgentRole: (role) => set({ selectedAgentRole: role }),
  selectedTier: 'tier_5_fast_reasoner',
  setSelectedTier: (tier) => set({ selectedTier: tier }),
  isExecutingPrompt: false,
  promptExecutionOutput: '',
  promptThoughtTrace: [],
  promptCodeDiff: '',

  executePrompt: async (req) => {
    set({
      isExecutingPrompt: true,
      promptExecutionOutput: 'Initializing Autonomous Agent Execution Pipeline...',
      promptThoughtTrace: [
        { time: new Date().toLocaleTimeString(), step: 'Ingest', thought: 'Received Developer prompt. AST parsing & symbol graph extraction starting.' },
      ],
      promptCodeDiff: '',
    });

    await new Promise((r) => setTimeout(r, 600));
    set((state) => ({
      promptThoughtTrace: [
        ...state.promptThoughtTrace,
        {
          time: new Date().toLocaleTimeString(),
          step: 'Model Routing',
          thought: `Assigned Tier: ${req.target_tier.toUpperCase()}. Target model: ${req.selected_model || 'deepseek/deepseek-r1-distill-llama-70b'} (Cost: $0.0012 est).`,
        },
      ],
    }));

    await new Promise((r) => setTimeout(r, 800));
    set((state) => ({
      promptThoughtTrace: [
        ...state.promptThoughtTrace,
        {
          time: new Date().toLocaleTimeString(),
          step: 'AST Analysis',
          thought: 'Scanned 4 AST files in context. Detected unbounded listener accumulation in EventBus.subscribe().',
        },
      ],
    }));

    await new Promise((r) => setTimeout(r, 900));
    const generatedDiff = `--- a/apps/api-gateway/app/core/event_bus.py\n+++ b/apps/api-gateway/app/core/event_bus.py\n@@ -24,8 +24,14 @@ class EventBus:\n     async def disconnect(self, websocket: WebSocket):\n-        # Memory leak: listener remained active in dictionary\n-        pass\n+        if websocket in self.active_connections:\n+            self.active_connections.remove(websocket)\n+            logger.info(f"Unregistered WebSocket connection. Remaining active: {len(self.active_connections)}")\n+        # Clean up per-client subscription queues\n+        self.client_queues.pop(websocket, None)\n`;

    set((state) => ({
      isExecutingPrompt: false,
      promptExecutionOutput: `Autonomous Remediation Succeeded.\n\nAssigned Tier: ${req.target_tier}\nModel: ${req.selected_model || 'DeepSeek-R1-Distill-70B'}\nExecution Time: 2.3s\nTokens Used: 480 Prompt + 290 Completion ($0.00084 USD)\nValidation: 14/14 Pytest assertions passed. Zero memory leaks detected.`,
      promptThoughtTrace: [
        ...state.promptThoughtTrace,
        {
          time: new Date().toLocaleTimeString(),
          step: 'Verification & Diff',
          thought: 'Synthesized unified patch. Executed local sandbox unit tests: 100% pass rate. Ready for PR review.',
        },
      ],
      promptCodeDiff: generatedDiff,
    }));
  },

  clearPromptStudio: () =>
    set({
      activePrompt: '',
      promptExecutionOutput: '',
      promptThoughtTrace: [],
      promptCodeDiff: '',
      isExecutingPrompt: false,
    }),
}));
