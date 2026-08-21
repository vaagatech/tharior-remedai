import React from 'react';
import {
  Activity,
  DollarSign,
  Terminal,
  Cpu,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import type { TelemetryMetrics, SystemMetrics, TaskExecutionReport } from '../types';

interface DeveloperDashboardProps {
  metrics: TelemetryMetrics;
  systemMetrics: SystemMetrics;
  reports: TaskExecutionReport[];
  liveLogStream: Array<{ id: string; time: string; msg: string; type: string }>;
  onTriggerGC: () => void;
  onSelectReport: (report: TaskExecutionReport) => void;
  onNavigateTab: (tab: any) => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  metrics,
  systemMetrics,
  reports,
  liveLogStream,
  onTriggerGC,
  onSelectReport,
  onNavigateTab,
}) => {
  const nanoPct = Math.round((metrics.tier_distribution.nano / metrics.total_dispatched) * 100) || 76;
  const midPct = Math.round((metrics.tier_distribution.mid / metrics.total_dispatched) * 100) || 18;
  const frontierPct = Math.max(1, 100 - nanoPct - midPct) || 6;

  // Cost comparison: if all 2,419 tasks were run on Frontier Sonnet ($0.024/task avg)
  const frontierOnlyCost = (metrics.total_dispatched * 0.024).toFixed(2);
  const actualCost = metrics.aggregate_cost_usd.toFixed(2);
  const savingsPct = Math.round(((parseFloat(frontierOnlyCost) - metrics.aggregate_cost_usd) / parseFloat(frontierOnlyCost)) * 100);

  return (
    <div className="space-y-6">
      {/* 4 Core Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dispatched */}
        <div className="glass-panel p-5 rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Total Dispatched</p>
              <h3 className="text-2xl font-bold text-white mt-1 font-heading">
                {metrics.total_dispatched.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
              {metrics.success_rate_percent}%
            </span>
            <span className="text-slate-400">Autonomous resolution rate</span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition" />
        </div>

        {/* Cost & Savings */}
        <div className="glass-panel p-5 rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Aggregate Cost</p>
              <h3 className="text-2xl font-bold text-white mt-1 font-heading">
                ${actualCost}
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-indigo-400 font-semibold">Avg ${metrics.avg_cost_per_fix_usd}</span>
            <span className="text-slate-400">/ defect fix</span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition" />
        </div>

        {/* MCP Tools */}
        <div className="glass-panel p-5 rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">MCP Tool Mesh</p>
              <h3 className="text-2xl font-bold text-white mt-1 font-heading">
                {metrics.active_mcp_tools} Active
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Graphify, OKF, Git, PyTest, Linter</span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition" />
        </div>

        {/* Pod Memory Guard */}
        <div className="glass-panel p-5 rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Pod Memory Guard</p>
                <button
                  onClick={onTriggerGC}
                  title="Force proactive garbage collection"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <h3 className="text-2xl font-bold text-white mt-1 font-heading">
                {systemMetrics.rss_mb} MB <span className="text-xs text-slate-400 font-normal">/ {systemMetrics.max_memory_mb} MB</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  systemMetrics.usage_percent > 80 ? 'bg-rose-500' : systemMetrics.usage_percent > 60 ? 'bg-amber-500' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, systemMetrics.usage_percent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="text-cyan-400">Headroom: {systemMetrics.headroom_mb} MB</span>
              <span>20% Reserve Guard</span>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition" />
        </div>
      </div>

      {/* Tiered Routing Cost Control & Savings Banner */}
      <div className="glass-panel p-6 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tiered LLM Routing Efficiency</span>
            </div>
            <h3 className="text-lg font-bold text-white font-heading">
              Dynamic Cost Optimization Hierarchy
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sub-100ms Nano verification gate classifies tasks and resolves syntax/doc tasks directly. Mid-Tier (Haiku) remediates standard unit tests, escalating to Frontier (Sonnet/GPT-4o) solely for complex cross-module refactors.
            </p>
          </div>

          <div className="flex-1 w-full max-w-md bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Model Hierarchy Distribution</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> {savingsPct}% Cost Reduction
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-900">
              <div style={{ width: `${nanoPct}%` }} className="bg-emerald-500 h-full" title={`Nano Tier: ${nanoPct}%`} />
              <div style={{ width: `${midPct}%` }} className="bg-indigo-500 h-full" title={`Mid Tier: ${midPct}%`} />
              <div style={{ width: `${frontierPct}%` }} className="bg-amber-500 h-full" title={`Frontier Tier: ${frontierPct}%`} />
            </div>

            <div className="grid grid-cols-3 text-[11px] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-300 font-medium">Tier 0 ({nanoPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-slate-300 font-medium">Tier 1 ({midPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-300 font-medium">Tier 2 ({frontierPct}%)</span>
              </div>
            </div>

            <div className="pt-1 flex justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
              <span>All-Frontier Est: <del className="text-slate-500">${frontierOnlyCost}</del></span>
              <span className="text-emerald-300 font-bold">Autonomous Tiered: ${actualCost}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Dispatches & Live Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Dispatches Table (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Recent Remediations & PRs</h3>
              </div>
              <button
                onClick={() => onNavigateTab('simulator')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition font-medium cursor-pointer"
              >
                <span>Trigger New Webhook</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Ticket</th>
                    <th className="pb-3 font-semibold">Repository</th>
                    <th className="pb-3 font-semibold">Assigned Agent / Tier</th>
                    <th className="pb-3 font-semibold">Cost / Latency</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reports.map((rep) => (
                    <tr key={rep.task_id} className="hover:bg-slate-800/40 transition group">
                      <td className="py-3 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {rep.ticket_id}
                        </div>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                        {rep.repo_name}
                      </td>
                      <td className="py-3">
                        <div className="text-slate-200 font-medium">{rep.assigned_agent}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{rep.tier} tier</div>
                      </td>
                      <td className="py-3">
                        <div className="text-slate-200">${rep.total_cost_usd}</div>
                        <div className="text-[10px] text-slate-400">{rep.total_latency_ms}ms</div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rep.status === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : rep.status === 'WAITING_CLARIFICATION'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                        }`}>
                          {rep.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectReport(rep)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition text-[11px] cursor-pointer"
                        >
                          View Diff & Traces
                        </button>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No recent reports yet. Trigger a webhook from the simulator!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Reactive Event Bus Stream */}
        <div className="glass-panel p-5 rounded-xl flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Reactive Event Stream</h3>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live WebSocket
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 font-mono text-[11px]">
            {liveLogStream.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border text-left leading-relaxed ${
                  log.type === 'warn'
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                    : log.type === 'success'
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                    : log.type === 'agent'
                    ? 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200'
                    : 'bg-slate-900/60 border-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                  <span>{log.time}</span>
                  <span className="uppercase font-bold">{log.type}</span>
                </div>
                <div className="break-words">{log.msg}</div>
              </div>
            ))}
            {liveLogStream.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Awaiting event bus messages...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
