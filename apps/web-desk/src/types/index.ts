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

export type TierLevel = 'nano' | 'mid' | 'frontier';

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
  tier_distribution: {
    nano: number;
    mid: number;
    frontier: number;
  };
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
