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
  status?: 'active' | 'degraded' | 'rate_limited';
  load_weight?: number;
}

export interface ModelTierSpec {
  tier: TierLevel;
  tier_number: number;
  name: string;
  description: string;
  functional_specialization: string;
  knowledge_vs_reasoning: string;
  target_tasks: string[];
  representative_models: string[];
  registered_models: ModelCatalogEntry[];
  input_cost_per_1m_usd: number;
  output_cost_per_1m_usd: number;
  est_latency_ms: number;
  benchmarks: Record<string, string>;
  reasoning_level: 'minimal' | 'low' | 'balanced' | 'high' | 'ultra' | 'multi_agent_consensus';
  cost_category: string;
}

export interface CustomerTierOverrideConfig {
  tenant_id: string;
  allowed_models: string[];
  tier_shifts: Record<string, number>;
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
  diff_preview?: string;
  automated_remediation_summary?: string;
  last_comment?: string;
}

export interface PromptExecutionRequest {
  id: string;
  developer_prompt: string;
  target_repo: string;
  target_files: string[];
  ast_symbols_context?: string[];
  reflection_enabled: boolean;
  internet_search_enabled: boolean;
  auto_apply_diff: boolean;
}

export interface SystemRoutingDecision {
  task_intent: string;
  complexity_score: number;
  context_tokens_est: number;
  recommended_tier: TierLevel;
  recommended_tier_name: string;
  recommended_model_id: string;
  recommended_model_name: string;
  reasoning_rationale: string;
  alternative_models: string[];
  budget_impact: string;
  confidence_score: number;
  ast_features_detected: string[];
}

export type GitAuthMethod = 'github_app' | 'federated_oauth' | 'encrypted_pat' | 'ssh_key' | 'ssh_deploy_key';

export interface RepoAuthConfig {
  method: GitAuthMethod;
  app_id?: string;
  installation_id?: string;
  private_key_preview?: string;
  oauth_identity?: string;
  oauth_provider?: string;
  encrypted_secret_preview?: string;
  encryption_layers: string[];
  kms_key_id: string;
  kms_key_version: number;
  last_rotated_at: string;
  next_rotation_due: string;
  rotation_period_days: number;
}

export interface SecurityVaultState {
  double_encryption_enabled: boolean;
  primary_kms_provider: 'AWS KMS' | 'Google Cloud KMS' | 'HashiCorp Vault';
  kek_key_arn: string;
  active_kek_version: number;
  dek_cipher: 'AES-256-GCM';
  auto_rotation_interval_days: number;
  last_rotation_timestamp: string;
  next_scheduled_rotation: string;
  total_secrets_encrypted: number;
  zero_plaintext_logs_enforced: boolean;
}

export interface OnboardedRepo {
  id: string;
  name: string;
  owner: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'azure_devops' | 'custom_git';
  url: string;
  default_branch: string;
  selected_branches: string[];
  available_branches?: string[];
  status: 'NOT_INDEXED' | 'INDEXING' | 'INDEXED' | 'FAILED' | 'OUT_OF_SYNC';
  last_indexed_at?: string;
  stats: {
    files_count: number;
    lines_of_code: number;
    symbols_count: number;
    kg_nodes_count: number;
    kg_edges_count: number;
    languages: Record<string, number>;
  };
  auth_type: GitAuthMethod;
  auth_config?: RepoAuthConfig;
  selected?: boolean;
  is_checked?: boolean;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'module' | 'package' | 'class' | 'function' | 'interface' | 'api_endpoint' | 'db_schema';
  filePath: string;
  lineRange: [number, number];
  complexity: number;
  docstring?: string;
  callers: string[];
  callees: string[];
  dependencies: string[];
  x?: number;
  y?: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'imports' | 'calls' | 'implements' | 'inherits' | 'defines';
  weight?: number;
}

export interface KnowledgeGraphData {
  repo_id: string;
  repo_name: string;
  indexed_at: string;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

export interface LiveEventItem {
  id: string;
  timestamp: string;
  type: 'AGENT_DISPATCH' | 'AST_INDEXED' | 'ROUTER_DECISION' | 'TIER_SELECTION' | 'MODEL_SYNC' | 'DIFF_GENERATED' | 'PR_REVIEW' | 'AUTO_MERGE' | 'KEDA_SCALE';
  title: string;
  description: string;
  tier?: TierLevel;
  model?: string;
  repo?: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

// Legacy compatibility exports
export interface TelemetryMetrics {
  total_requests: number;
  cache_hit_rate: number;
  avg_latency_ms: number;
  total_cost_saved_usd: number;
  total_dispatched?: number;
  success_rate_percent?: number;
  aggregate_cost_usd?: number;
  avg_cost_per_fix_usd?: number;
  active_mcp_tools?: number;
  tier_distribution?: Record<string, number>;
  total_tokens?: number;
}

export interface SystemMetrics {
  active_workers: number;
  queue_depth: number;
  memory_utilization_pct: number;
  cpu_utilization_pct: number;
  rss_bytes?: number;
  rss_mb?: number;
  vms_mb?: number;
  max_memory_mb?: number;
  headroom_mb?: number;
  reserve_mb?: number;
  usage_percent?: number;
  cpu_percent?: number;
  headroom_healthy?: boolean;
}

export interface TaskExecutionReport {
  id: string;
  task_id: string;
  title: string;
  status: TaskStatus;
  tier_used: TierLevel;
  model_used: string;
  cost_usd: number;
  execution_time_ms: number;
  ast_nodes_affected: number;
  created_at: string;
  traces?: Array<{
    step_id?: string;
    phase?: string;
    agent?: string;
    action?: string;
    timestamp?: string;
    status?: string;
    reasoning?: string;
    tokens?: number;
    cost_usd?: number;
    tier?: TierLevel;
    model?: string;
    tool_calls?: string[];
  }>;
  ticket_id?: string;
  repo_name?: string;
  assigned_agent?: string;
  tier?: TierLevel;
  total_cost_usd?: number;
  total_latency_ms?: number;
  test_results?: any;
  patch_diff?: string;
  pr_url?: string;
}

export interface ClarificationSession {
  id: string;
  task_id: string;
  question: string;
  options: string[];
  status: 'PENDING' | 'RESOLVED';
  created_at: string;
}

export interface AgentCard {
  id: string;
  name: string;
  role: string;
  status: 'IDLE' | 'BUSY' | 'PAUSED';
  current_task?: string;
}

export interface DeadLetterRecord {
  id: string;
  source: 'indexing' | 'routing' | 'remediation' | 'api_sync' | 'websocket';
  entity_id: string;
  entity_type: string;
  error_message: string;
  error_stack?: string;
  payload: any;
  retry_count: number;
  max_retries: number;
  status: 'PENDING_RETRY' | 'REPLAYING' | 'RESOLVED' | 'DISCARDED';
  timestamp: string;
  memory_at_failure_mb?: number;
  cpu_at_failure_pct?: number;
}

export interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  category: 'ROUTER' | 'AST_INDEXER' | 'STUDIO' | 'PR_AGENT' | 'SYSTEM' | 'SECURITY';
  event_name: string;
  details: string;
  duration_ms?: number;
  memory_pct: number;
  cpu_pct: number;
  trace_id: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}
