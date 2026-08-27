import { useState, useCallback } from 'react';
import type {
  TaskExecutionReport,
  ClarificationSession,
  TelemetryMetrics,
  SystemMetrics,
  AgentCard,
} from '../types';

export function useLiveEvents() {
  const [metrics, setMetrics] = useState<TelemetryMetrics>({
    total_requests: 2419,
    cache_hit_rate: 92.4,
    avg_latency_ms: 185.0,
    total_cost_saved_usd: 124.50,
  });

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    active_workers: 4,
    queue_depth: 0,
    memory_utilization_pct: 68.0,
    cpu_utilization_pct: 14.5,
  });

  const [reports, setReports] = useState<TaskExecutionReport[]>([]);
  const [clarifications, setClarifications] = useState<ClarificationSession[]>([]);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [connected] = useState(true);
  const [liveLogStream, setLiveLogStream] = useState<Array<{ id: string; time: string; msg: string; type: string }>>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      msg: 'Autonomous Remediation Mesh Ready. Multi-tenant sandboxing active.',
      type: 'info',
    },
  ]);

  const addTelemetryLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLiveLogStream((prev) => [
      { id: `log-${Date.now()}-${Math.random()}`, time: new Date().toLocaleTimeString(), msg, type },
      ...prev.slice(0, 99),
    ]);
  }, []);

  return {
    metrics,
    systemMetrics,
    reports,
    clarifications,
    agents,
    connected,
    liveLogStream,
    setMetrics,
    setSystemMetrics,
    setReports,
    setClarifications,
    setAgents,
    addTelemetryLog,
  };
}
