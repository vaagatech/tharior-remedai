import { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Clock,
} from 'lucide-react';

interface TelemetryEvent {
  event_id: string;
  trace_id: string;
  span_id: string;
  task_id?: string;
  ticket_id?: string;
  phase: string;
  action: string;
  severity: string;
  duration_ms: number;
  cost_usd: number;
  payload: Record<string, any>;
  timestamp: number;
}

interface DeadLetterRecord {
  dlq_id: string;
  task_id: string;
  ticket_id: string;
  tenant_id: string;
  failed_phase: string;
  exception_type: string;
  exception_message: string;
  stack_trace: string;
  input_payload: Record<string, any>;
  timestamp: number;
  status: string;
  retry_count: number;
}

interface CircuitBreakerStatus {
  name: string;
  state: string;
  failure_count: number;
  success_count: number;
  total_trips: number;
}

export function ObservabilityDesk() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [dlqRecords, setDlqRecords] = useState<DeadLetterRecord[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<Record<string, CircuitBreakerStatus>>({});
  const [selectedDlq, setSelectedDlq] = useState<DeadLetterRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'dlq' | 'circuit_breakers'>('events');
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const fetchObservabilityData = async () => {
    try {
      const [eventsRes, dlqRes, cbRes] = await Promise.allSettled([
        fetch('http://localhost:8000/api/v1/telemetry/events?limit=40').then((r) => r.json()),
        fetch('http://localhost:8000/api/v1/telemetry/dlq').then((r) => r.json()),
        fetch('http://localhost:8000/api/v1/telemetry/circuit-breakers').then((r) => r.json()),
      ]);

      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value || []);
      if (dlqRes.status === 'fulfilled') setDlqRecords(dlqRes.value || []);
      if (cbRes.status === 'fulfilled') setCircuitBreakers(cbRes.value || {});
    } catch (e) {
      console.warn('Observability fetch warning:', e);
    }
  };

  useEffect(() => {
    fetchObservabilityData();
    const interval = setInterval(fetchObservabilityData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReplayDlq = async (dlqId: string) => {
    try {
      setReplayingId(dlqId);
      await fetch(`http://localhost:8000/api/v1/telemetry/dlq/${dlqId}/replay`, {
        method: 'POST',
      });
      await fetchObservabilityData();
    } catch (err) {
      console.error('Replay error:', err);
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Observability & Dead-Letter Replay Hub
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                ZERO EVENT MISSED
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Distributed traces, self-healing telemetry, circuit breakers, and persistent DLQ quarantine replay.
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'events'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Trace Stream ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('dlq')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'dlq'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Dead-Letter Queue ({dlqRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('circuit_breakers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'circuit_breakers'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Circuit Breakers
          </button>
        </div>
      </div>

      {/* Main View Grid */}
      {activeTab === 'events' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3 font-semibold">
            <span>TIMESTAMP & CORRELATION</span>
            <span>PHASE & ACTION</span>
            <span>SEVERITY</span>
            <span>DURATION / SPEND</span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No telemetry events captured yet. Ingest a ticket to view real-time traces.
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.event_id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <div className="text-slate-400 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(evt.timestamp * 1000).toLocaleTimeString()}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-indigo-400 font-bold">{evt.trace_id.slice(0, 14)}</span>
                    </div>
                    {evt.task_id && (
                      <div className="text-[11px] text-slate-500">
                        Task: <span className="text-slate-300">{evt.task_id}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 max-w-md">
                    <div className="font-bold text-slate-200">{evt.phase}</div>
                    <div className="text-slate-400 truncate">{evt.action}</div>
                  </div>

                  <div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.severity === 'ERROR' || evt.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : evt.severity === 'WARN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {evt.severity}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-300">{evt.duration_ms}ms</div>
                    {evt.cost_usd > 0 && (
                      <div className="text-[10px] text-indigo-400 font-bold">
                        ${evt.cost_usd.toFixed(5)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dead-Letter Queue View */}
      {activeTab === 'dlq' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DLQ List */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Quarantined Failure Items ({dlqRecords.length})
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {dlqRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                  Zero quarantined records. All systems operating with 100% reliability.
                </div>
              ) : (
                dlqRecords.map((record) => (
                  <div
                    key={record.dlq_id}
                    onClick={() => setSelectedDlq(record)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-xs font-mono ${
                      selectedDlq?.dlq_id === record.dlq_id
                        ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-400">{record.dlq_id}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          record.status === 'REPLAYED'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                    <div className="text-slate-300 font-medium truncate mb-1">
                      {record.exception_type}: {record.exception_message}
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Phase: {record.failed_phase}</span>
                      <span>Task: {record.task_id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DLQ Detail & Replay Bench */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            {selectedDlq ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      Failure Diagnostics: {selectedDlq.dlq_id}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Captured at {new Date(selectedDlq.timestamp * 1000).toLocaleString()} (Tenant:{' '}
                      {selectedDlq.tenant_id})
                    </p>
                  </div>

                  <button
                    onClick={() => handleReplayDlq(selectedDlq.dlq_id)}
                    disabled={replayingId === selectedDlq.dlq_id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw
                      className={`w-3.5 h-3.5 ${replayingId === selectedDlq.dlq_id ? 'animate-spin' : ''}`}
                    />
                    {replayingId === selectedDlq.dlq_id ? 'Replaying...' : 'Replay Quarantine Item'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Stack Trace</div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-300/90 overflow-x-auto max-h-48">
                    {selectedDlq.stack_trace || 'No stack trace recorded.'}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Input Payload Snapshot</div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-36">
                    {JSON.stringify(selectedDlq.input_payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 text-sm">
                Select a quarantined failure record from the left to inspect diagnostics and trigger replay.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Circuit Breakers View */}
      {activeTab === 'circuit_breakers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(circuitBreakers).map(([name, cb]) => (
            <div
              key={name}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono">{name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cb.state === 'CLOSED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : cb.state === 'HALF_OPEN'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                  }`}
                >
                  {cb.state}
                </span>
              </div>
              <div className="text-xs font-mono space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Failures:</span>
                  <span className="text-slate-200 font-bold">{cb.failure_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Trips:</span>
                  <span className="text-slate-200 font-bold">{cb.total_trips}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recovery Probes:</span>
                  <span className="text-slate-200 font-bold">{cb.success_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
