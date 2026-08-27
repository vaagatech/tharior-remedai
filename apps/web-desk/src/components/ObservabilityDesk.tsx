import React from 'react';
import {
  Activity,
  Zap,
  Server,
  Database,
  Cpu,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export const ObservabilityDesk: React.FC = () => {
  const { liveEvents } = useRemedaiStore();

  const metrics = [
    { label: 'KEDA Worker Pods', value: '4 Scaled (Spot Node)', change: '+2 on queue spike', icon: Server, color: 'text-indigo-600' },
    { label: 'Memory & GC Guard', value: '68% (Target <75%)', change: '25% reserved for GC', icon: Cpu, color: 'text-emerald-600' },
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
            High-fidelity OpenTelemetry metrics, memory GC boundaries (&lt;75% cap), KEDA session pod isolation, and live routing events.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
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

      {/* Live Event Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-slate-900 text-sm">Live System Event Stream</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time reactive wakeup</span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {liveEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.2 text-[10px] font-mono font-bold rounded uppercase ${
                      ev.severity === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : ev.severity === 'warning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {ev.type}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{ev.title}</span>
                </div>
                <p className="text-xs text-slate-600 pl-1">{ev.description}</p>
              </div>

              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
