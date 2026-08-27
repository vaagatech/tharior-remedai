import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, getWsBaseUrl } from '../config/api';
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
  const [connected, setConnected] = useState<boolean>(false);
  const [liveLogStream, setLiveLogStream] = useState<Array<{ id: string; time: string; msg: string; type: string }>>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      msg: 'Autonomous Remediation Mesh Ready. Connecting to live gateway event bus...',
      type: 'info',
    },
  ]);

  const addTelemetryLog = useCallback((msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLiveLogStream((prev) => [
      { id: `log-${Date.now()}-${Math.random()}`, time: new Date().toLocaleTimeString(), msg, type },
      ...prev.slice(0, 99),
    ]);
  }, []);

  const wsRef = useRef<WebSocket | null>(null);

  // Poll / Fetch Real REST Endpoints
  const refreshRestData = useCallback(async () => {
    try {
      const [m, sm, r, c, a] = await Promise.all([
        apiFetch<TelemetryMetrics>('/api/v1/metrics').catch(() => null),
        apiFetch<SystemMetrics>('/api/v1/metrics/system').catch(() => null),
        apiFetch<TaskExecutionReport[]>('/api/v1/tickets/reports').catch(() => null),
        apiFetch<ClarificationSession[]>('/api/v1/clarification/all').catch(() => null),
        apiFetch<AgentCard[]>('/api/v1/agents').catch(() => null),
      ]);

      if (m) setMetrics(m);
      if (sm) setSystemMetrics(sm);
      if (r && r.length > 0) setReports(r);
      if (c && c.length > 0) setClarifications(c);
      if (a && a.length > 0) setAgents(a);
    } catch {
      // Keep existing data if offline
    }
  }, []);

  useEffect(() => {
    refreshRestData();
    const interval = setInterval(refreshRestData, 8000);
    return () => clearInterval(interval);
  }, [refreshRestData]);

  // Connect Real Live WebSocket Stream
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;

    function connectWs() {
      const wsUrl = getWsBaseUrl();
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setConnected(true);
          addTelemetryLog(`Connected to live event bus stream (${wsUrl})`, 'success');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'HEARTBEAT' || data.type === 'pong') return;

            addTelemetryLog(
              `[${data.type || 'EVENT'}] ${data.title || data.message || JSON.stringify(data)}`,
              data.severity || 'info'
            );

            if (data.metrics) setMetrics(data.metrics);
            if (data.system_metrics) setSystemMetrics(data.system_metrics);
            if (data.report) setReports((prev) => [data.report, ...prev.slice(0, 49)]);
          } catch {
            // Raw text log
            addTelemetryLog(event.data, 'info');
          }
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setConnected(false);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          // Try reconnecting after 4s
          reconnectTimeout = setTimeout(connectWs, 4000);
        };
      } catch {
        setConnected(false);
        reconnectTimeout = setTimeout(connectWs, 5000);
      }
    }

    connectWs();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [addTelemetryLog]);

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
    refreshRestData,
  };
}
