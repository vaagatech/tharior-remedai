import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  TaskExecutionReport,
  ClarificationSession,
  TelemetryMetrics,
  SystemMetrics,
  AgentCard,
} from '../types';
import { useRemedaiStore } from '../store/useRemedaiStore';

export function useLiveEvents() {
  const { apiBaseUrl, setIsApiConnected } = useRemedaiStore();

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
  const [liveLogStream, setLiveLogStream] = useState<Array<{ id: string; time: string; msg: string; type: string }>>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      msg: 'Autonomous Remediation Mesh Ready. Multi-tenant sandboxing active.',
      type: 'info',
    },
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef<number>(0);

  const getFullUrl = useCallback(
    (path: string) => {
      const base = apiBaseUrl?.trim() || '';
      return `${base.replace(/\/$/, '')}${path}`;
    },
    [apiBaseUrl]
  );

  const fetchInitialData = useCallback(async () => {
    try {
      const headers = { Accept: 'application/json' };
      const [mRes, sRes, rRes, cRes, aRes] = await Promise.allSettled([
        fetch(getFullUrl('/api/v1/metrics'), { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(getFullUrl('/api/v1/metrics/system'), { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(getFullUrl('/api/v1/tickets/reports'), { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(getFullUrl('/api/v1/clarification/all'), { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(getFullUrl('/api/v1/agents'), { headers }).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value) setMetrics(mRes.value);
      if (sRes.status === 'fulfilled' && sRes.value) setSystemMetrics(sRes.value);
      if (rRes.status === 'fulfilled' && rRes.value) setReports(rRes.value);
      if (cRes.status === 'fulfilled' && cRes.value) setClarifications(cRes.value);
      if (aRes.status === 'fulfilled' && aRes.value) setAgents(aRes.value);
    } catch {
      // Graceful fallback to client-side initialized metrics
    }
  }, [getFullUrl]);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchInitialData, 15000);
    return () => clearInterval(interval);
  }, [fetchInitialData]);

  useEffect(() => {
    let reconnectTimeout: any = null;
    let isCancelled = false;

    const connectWs = () => {
      if (isCancelled) return;

      // Only attempt WebSocket if apiBaseUrl is specified or running locally
      const base = apiBaseUrl?.trim() || '';
      let wsUrl = '';

      if (base) {
        const isSecure = base.startsWith('https:');
        const cleanBase = base.replace(/^https?:\/\//, '');
        wsUrl = `${isSecure ? 'wss:' : 'ws:'}//${cleanBase}/ws/events`;
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/ws/events`;
      } else {
        // Static CloudFront CDN without backend proxy: skip noisy WS attempts until API URL is provided in Settings
        setConnected(false);
        setIsApiConnected(false);
        return;
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setIsApiConnected(true);
          reconnectAttempt.current = 0;
          addLog('Connected to Reactive Event Bus WebSocket', 'info');
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            handleEvent(payload);
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          setConnected(false);
          setIsApiConnected(false);
          if (!isCancelled) {
            reconnectAttempt.current += 1;
            const delay = Math.min(30000, Math.pow(2, Math.min(reconnectAttempt.current, 5)) * 1000);
            reconnectTimeout = setTimeout(connectWs, delay);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        setConnected(false);
      }
    };

    connectWs();

    return () => {
      isCancelled = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [apiBaseUrl, setIsApiConnected]);

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
      const res = await fetch(getFullUrl('/api/v1/system/gc'), { method: 'POST' });
      const data = await res.json();
      if (data.metrics) setSystemMetrics(data.metrics);
      addLog('Forced Garbage Collection executed. Headroom preserved.', 'success');
    } catch {
      // quiet
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
