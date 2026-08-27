import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Server,
  Database,
  Cpu,
  RotateCw,
  Trash2,
  CheckCircle2,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export const ObservabilityDesk: React.FC = () => {
  const {
    telemetryLogs,
    deadLetterQueue,
    replayDeadLetterRecord,
    clearDeadLetterQueue,
  } = useRemedaiStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const filteredLogs = telemetryLogs.filter((l) => {
    return categoryFilter === 'ALL' || l.category === categoryFilter;
  });

  const handleReplay = async (id: string) => {
    setReplayingId(id);
    await replayDeadLetterRecord(id);
    setReplayingId(null);
  };

  const metrics = [
    { label: 'KEDA Worker Pods', value: '4 Scaled (Spot Node)', change: '+2 on queue spike', icon: Server, color: 'text-indigo-600' },
    { label: 'Memory & GC Guard', value: '54.0% (Cap: 75%)', change: '21% reserved for GC', icon: Cpu, color: 'text-emerald-600' },
    { label: 'Semantic Cache Hit Rate', value: '92.4%', change: 'Cos-sim threshold: 0.88', icon: Database, color: 'text-purple-600' },
    { label: 'Average Token Latency', value: '185 ms', change: '-42% vs naive routing', icon: Zap, color: 'text-amber-600' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">System Telemetry & Live Observability</h1>
          </div>
          <p className="text-slate-600 text-sm">
            High-fidelity telemetry, memory GC boundaries (&le;75% cap), Dead-Letter Queue (DLQ) record replay, and zero-event-loss observability.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Zero Event Loss Enforced</span>
        </div>
      </div>

      {/* Resource Governor & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">{m.label}</span>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div className="text-xl font-bold text-slate-900">{m.value}</div>
              <div className="text-xs text-slate-500 font-medium">{m.change}</div>
            </div>
          );
        })}
      </div>

      {/* Memory & CPU 75% Headroom Governor Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Dynamic Memory & CPU Headroom Governor (75% Cap)</h3>
          </div>
          <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
            GC Headroom Healthy (21% Free)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Memory Utilization</span>
              <span className="font-mono font-bold text-slate-900">54.0% / 75.0% Limit</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: '54%' }} />
            </div>
            <p className="text-[11px] text-slate-500">
              Adaptive chunk resizing active: records exceeding 50KB automatically chunked into 5-record micro batches.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">CPU Utilization</span>
              <span className="font-mono font-bold text-slate-900">38.2% / 75.0% Limit</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: '38.2%' }} />
            </div>
            <p className="text-[11px] text-slate-500">
              Worker concurrency throttled automatically if system load averages exceed 70%.
            </p>
          </div>
        </div>
      </div>

      {/* Dead-Letter Queue (DLQ) & Record Replay Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Dead-Letter Queue (DLQ) & Record Replay ({deadLetterQueue.length} items)
            </h3>
          </div>

          {deadLetterQueue.length > 0 && (
            <button
              onClick={clearDeadLetterQueue}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear DLQ</span>
            </button>
          )}
        </div>

        {deadLetterQueue.length > 0 ? (
          <div className="space-y-3">
            {deadLetterQueue.map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold uppercase text-[10px]">
                      {rec.source}
                    </span>
                    <span className="font-bold text-slate-900">{rec.entity_id}</span>
                    <span className="text-slate-500">({rec.entity_type})</span>
                  </div>
                  <p className="text-rose-700 font-mono text-[11px] break-all">{rec.error_message}</p>
                  <div className="text-[10px] text-slate-500">
                    Retries: {rec.retry_count} / {rec.max_retries} • Memory at failure: {rec.memory_at_failure_mb}MB
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReplay(rec.id)}
                    disabled={replayingId === rec.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${replayingId === rec.id ? 'animate-spin' : ''}`} />
                    <span>Replay Record</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">Dead-Letter Queue Clean (0 Failures)</p>
            <p className="text-[11px] text-slate-400">
              Any indexing or remediation record failure is automatically trapped here for replay while batch execution continues uninterrupted.
            </p>
          </div>
        )}
      </div>

      {/* Structured Telemetry Logs Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Detailed Telemetry Traces</h3>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 overflow-x-auto">
            {['ALL', 'ROUTER', 'AST_INDEXER', 'STUDIO', 'SYSTEM', 'SECURITY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2 text-slate-700"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {log.category}
                  </span>
                  <span className="font-bold text-slate-900">{log.event_name}</span>
                  <span className="text-[10px] text-slate-400">({log.trace_id})</span>
                </div>
                <p className="text-slate-600 font-sans text-xs">{log.details}</p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0 font-mono">
                {log.duration_ms !== undefined && <span>{log.duration_ms}ms</span>}
                <span>Mem: {log.memory_pct}%</span>
                <span>CPU: {log.cpu_pct}%</span>
                <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
