export type TaskStatus =
  | 'INGESTED'
  | 'CLASSIFYING'
  | 'WAITING_CLARIFICATION'
  | 'READY_FOR_SYNTHESIS'
  | 'SYNTHESIZING'
  | 'TESTING'
  | 'CREATING_PR'
  | 'RESOLVED'
  | 'FAILED';

export type TierLevel =
  | 'tier_1_micro_lint'
  | 'tier_2_ultra_fast'
  | 'tier_3_economy_coder'
  | 'tier_4_mid_generalist'
  | 'tier_5_fast_reasoner'
  | 'tier_6_core_workhorse'
  | 'tier_7_deep_reasoner'
  | 'tier_8_senior_architect'
  | 'tier_9_frontier_synthesis'
  | 'tier_10_elite_consensus'
  // Legacy aliases
  | 'nano'
  | 'mid'
  | 'frontier';

export type ModalityType = 'text' | 'audio' | 'video' | 'image' | 'presentation' | 'pdf';

export interface ModelTierSpec {
  tier: TierLevel;
  tier_number: number;
  name: string;
  description: string;
  functional_specialization: string;
  knowledge_vs_reasoning: string;
  target_tasks: string[];
  representative_models: string[];
  input_cost_per_1m_usd: number;
  output_cost_per_1m_usd: number;
  est_latency_ms: number;
  benchmarks: Record<string, string>;
  reasoning_level: 'minimal' | 'low' | 'balanced' | 'high' | 'ultra' | 'multi_agent_consensus';
  cost_category: string;
}

export interface ModelCatalogEntry {
  id: string;
  name: string;
  context_length: number;
  prompt_cost_per_1m: number;
  completion_cost_per_1m: number;
  latency_tier: string;
  tokens_per_second: number;
  is_free: boolean;
  system_tier: TierLevel;
  effective_tier: TierLevel;
  modalities: ModalityType[];
  coding_score?: number;
  reasoning_score?: number;
}

export interface CustomerTierOverrideConfig {
  tenant_id: string;
  allowed_models: string[];
  tier_shifts: Record<string, number>; // model_id -> -2, -1, 0, 1, 2
  prefer_free_models: boolean;
  custom_openrouter_url?: string;
  custom_openrouter_key?: string;
  refresh_interval_hours: number;
}

export interface MultimodalTierSpec {
  modality: ModalityType;
  group_name: string;
  description: string;
  tiers: Array<{
    tier_level: string;
    model_id: string;
    name: string;
    cost_estimate: string;
    latency_estimate: string;
    max_duration_or_res: string;
    capabilities: string[];
  }>;
}

export interface BacklogStory {
  id: string;
  source: 'github' | 'gitlab' | 'jira' | 'linear';
  key: string;
  title: string;
  description: string;
  repo: string;
  branch: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'BACKLOG' | 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEW' | 'MERGED';
  assigned_agent?: string;
  tier_needed: TierLevel;
  estimated_cost_usd: number;
  created_at: string;
  comments_count: number;
  pr_url?: string;
  auto_merge_allowed: boolean;
}

export interface PromptExecutionRequest {
  prompt: string;
  code_context?: string;
  file_path?: string;
  repo_name?: string;
  agent_role: 'coder' | 'architect' | 'bug_hunter' | 'sast_guard' | 'pr_reviewer' | 'autonomous_lead';
  target_tier: TierLevel;
  selected_model?: string;
  enable_internet_search: boolean;
  enable_ast_inspection: boolean;
  consensus_mode: boolean;
  user_id?: string;
  tenant_id?: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  suggested_options?: string[];
  answer?: string;
  selected_option?: string;
  answered_at?: number;
  answered_by?: string;
}

export interface ClarificationSession {
  session_id: string;
  task_id: string;
  ticket_id: string;
  repo_name: string;
  title: string;
  status: TaskStatus;
  questions: ClarificationQuestion[];
  tenant_group: string;
  created_at: number;
  updated_at: number;
  resolved_context?: string;
}

export interface AgentCard {
  agent_id: string;
  name: string;
  role: string;
  domain: string;
  description: string;
  capabilities: string[];
  mcp_tools: string[];
  default_tier: TierLevel;
  avatar_color: string;
  cost_per_1k_est: number;
}

export interface ExecutionTraceStep {
  step_id: string;
  timestamp: number;
  phase: string;
  agent_name: string;
  tier: string;
  model: string;
  action: string;
  mcp_server?: string;
  mcp_tool?: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  cost_usd: number;
  latency_ms: number;
  status: string;
}

export interface TaskExecutionReport {
  task_id: string;
  ticket_id: string;
  repo_name: string;
  title: string;
  status: TaskStatus;
  assigned_agent: string;
  tier: TierLevel;
  selected_model: string;
  total_cost_usd: number;
  total_latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  patch_diff?: string;
  pr_url?: string;
  test_results?: {
    tests_passed: boolean;
    exit_code?: number;
    passed_count?: number;
    failed_count?: number;
    duration_ms?: number;
    test_suites?: Array<{ name: string; status: string; duration_ms: number }>;
    stdout?: string;
  };
  traces: ExecutionTraceStep[];
  created_at: number;
  completed_at?: number;
}

export interface TelemetryMetrics {
  total_dispatched: number;
  success_rate_percent: number;
  aggregate_cost_usd: number;
  avg_cost_per_fix_usd: number;
  active_mcp_tools: number;
  tier_distribution: Record<string, number>;
  total_tokens: number;
}

export interface SystemMetrics {
  rss_bytes: number;
  rss_mb: number;
  vms_mb: number;
  max_memory_mb: number;
  headroom_mb: number;
  reserve_mb: number;
  usage_percent: number;
  cpu_percent: number;
  headroom_healthy: boolean;
}

export interface SearchItem {
  id: string;
  title: string;
  category: 'TIER' | 'MODEL' | 'AGENT' | 'STORY' | 'PLAYBOOK' | 'EVENT' | 'TOOL';
  subtitle: string;
  path: string;
  meta?: Record<string, any>;
}
