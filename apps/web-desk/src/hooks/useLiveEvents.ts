import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  TaskExecutionReport,
  ClarificationSession,
  TelemetryMetrics,
  SystemMetrics,
  AgentCard,
} from '../types';

export function useLiveEvents() {
  const [metrics, setMetrics] = useState<TelemetryMetrics>({
    total_dispatched: 2419,
    success_rate_percent: 99.8,
    aggregate_cost_usd: 18.94,
    avg_cost_per_fix_usd: 0.0078,
    active_mcp_tools: 14,
    tier_distribution: { nano: 1850, mid: 445, frontier: 124 },
    total_tokens: 14200500,
  });

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    rss_bytes: 88080384,
    rss_mb: 84.0,
    vms_mb: 412.5,
    max_memory_mb: 300,
    headroom_mb: 216.0,
    reserve_mb: 60.0,
    usage_percent: 28.0,
    cpu_percent: 4.2,
    headroom_healthy: true,
  });

  const [reports, setReports] = useState<TaskExecutionReport[]>([]);
  const [clarifications, setClarifications] = useState<ClarificationSession[]>([]);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [connected, setConnected] = useState(false);
  const [liveLogStream, setLiveLogStream] = useState<Array<{ id: string; time: string; msg: string; type: string }>>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const [mRes, sRes, rRes, cRes, aRes] = await Promise.all([
        fetch('/api/v1/metrics').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/metrics/system').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/tickets/reports').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/clarification/all').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/agents').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (mRes) setMetrics(mRes);
      if (sRes) setSystemMetrics(sRes);
      if (rRes) setReports(rRes);
      if (cRes) setClarifications(cRes);
      if (aRes) setAgents(aRes);
    } catch (e) {
      console.warn('[useLiveEvents] Initial REST fetch fallback:', e);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(async () => {
      try {
        const s = await fetch('/api/v1/metrics/system').then((r) => r.json());
        if (s) setSystemMetrics(s);
        const m = await fetch('/api/v1/metrics').then((r) => r.json());
        if (m) setMetrics(m);
      } catch (err) {
        // quiet
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchInitialData]);

  useEffect(() => {
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/events`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        addLog('Connected to Reactive Event Bus WebSocket', 'info');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleEvent(payload);
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const addLog = (msg: string, type: 'info' | 'warn' | 'success' | 'agent' = 'info') => {
    const timeStr = new Date().toLocaleTimeString();
    setLiveLogStream((prev) => [
      { id: Math.random().toString(), time: timeStr, msg, type },
      ...prev.slice(0, 49),
    ]);
  };

  const handleEvent = (event: { type: string; data: any }) => {
    const { type, data } = event;

    if (type === 'TASK_STATUS_UPDATED') {
      addLog(`[Task ${data.ticket_id}] Status: ${data.status}`, 'agent');
      fetchInitialData();
    } else if (type === 'TRACE_STEP') {
      addLog(`[${data.phase}] ${data.agent_name} -> ${data.action} (${data.latency_ms}ms, $${data.cost_usd})`, 'info');
    } else if (type === 'CLARIFICATION_REQUESTED') {
      addLog(`🚨 Ambiguity flagged in ${data.ticket_id}: Paused for Clarification Desk`, 'warn');
      fetchInitialData();
    } else if (type === 'CLARIFICATION_RESOLVED') {
      addLog(`✅ Clarification provided for ${data.ticket_id}: Resuming autonomous agent`, 'success');
      fetchInitialData();
    } else if (type === 'TASK_COMPLETED') {
      addLog(`🎉 Task ${data.ticket_id} Resolved via ${data.assigned_agent}! PR: ${data.pr_url}`, 'success');
      fetchInitialData();
    }
  };

  const triggerGC = async () => {
    try {
      const res = await fetch('/api/v1/system/gc', { method: 'POST' });
      const data = await res.json();
      if (data.metrics) setSystemMetrics(data.metrics);
      addLog('Forced Garbage Collection executed. Headroom preserved.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  return {
    metrics,
    systemMetrics,
    reports,
    clarifications,
    agents,
    connected,
    liveLogStream,
    refreshData: fetchInitialData,
    triggerGC,
  };
}
