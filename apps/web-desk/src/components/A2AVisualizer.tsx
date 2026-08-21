import React, { useState } from 'react';
import {
  Users,
  Terminal,
  Layers,
  GitPullRequest,
} from 'lucide-react';
import type { AgentCard, TaskExecutionReport } from '../types';

interface A2AVisualizerProps {
  agents: AgentCard[];
  reports: TaskExecutionReport[];
  selectedReport?: TaskExecutionReport | null;
}

export const A2AVisualizer: React.FC<A2AVisualizerProps> = ({
  agents,
  reports,
  selectedReport: initialSelectedReport,
}) => {
  const [activeReportId, setActiveReportId] = useState<string>(
    initialSelectedReport?.task_id || reports[0]?.task_id || ''
  );

  const currentReport = reports.find((r) => r.task_id === activeReportId) || reports[0];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
      case 'indigo':
        return 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10';
      case 'purple':
        return 'border-purple-500/30 text-purple-400 bg-purple-500/10';
      case 'amber':
        return 'border-amber-500/30 text-amber-400 bg-amber-500/10';
      case 'rose':
        return 'border-rose-500/30 text-rose-400 bg-rose-500/10';
      case 'cyan':
        return 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10';
      default:
        return 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10';
    }
  };

  return (
    <div className="space-y-8">
      {/* Dynamic AgentCards Mesh */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-heading">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>A2A Domain-Specific Team Agents & AgentCards</span>
            </h2>
            <p className="text-xs text-slate-400">
              Stateless multi-agent delegation mesh with capability-based routing and MCP tool entitlements
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
            {agents.length} Registered AgentCards
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const colorClass = getColorClasses(agent.avatar_color);
            return (
              <div
                key={agent.agent_id}
                className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm ${colorClass}`}>
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white font-heading">{agent.name}</h3>
                        <p className="text-[10px] text-slate-400">{agent.domain}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {agent.default_tier}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {agent.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Capabilities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-800/80 text-slate-300"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Terminal className="w-3 h-3 text-amber-400" />
                    <span>{agent.mcp_tools.join(', ')}</span>
                  </div>
                  <span className="text-indigo-400 font-semibold">
                    ~${agent.cost_per_1k_est} / 1k tasks
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Multi-Agent Execution DAG Trace */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Multi-Agent Execution DAG & MCP Trace Inspector</span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive trace logs showing step-by-step tool invocations and latency attribution
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeReportId}
              onChange={(e) => setActiveReportId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {reports.map((r) => (
                <option key={r.task_id} value={r.task_id}>
                  {r.ticket_id} ({r.assigned_agent})
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentReport ? (
          <div className="space-y-6">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Task Ticket</span>
                <p className="font-bold text-white">{currentReport.ticket_id}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Assigned Agent</span>
                <p className="font-bold text-indigo-400">{currentReport.assigned_agent}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Total Cost & Latency</span>
                <p className="font-bold text-emerald-400">${currentReport.total_cost_usd} • {currentReport.total_latency_ms}ms</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Pull Request</span>
                <a
                  href={currentReport.pr_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1 truncate"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span className="truncate">{currentReport.pr_url || 'PR Pending'}</span>
                </a>
              </div>
            </div>

            {/* Step-by-Step DAG Timeline */}
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {currentReport.traces && currentReport.traces.length > 0 ? (
                currentReport.traces.map((step, idx) => (
                  <div key={step.step_id || idx} className="relative flex items-start gap-4 pl-1">
                    {/* Timeline Node */}
                    <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-300 z-10 shrink-0 shadow-lg shadow-indigo-500/20">
                      {idx + 1}
                    </div>

                    <div className="flex-1 bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{step.phase}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">
                            {step.agent_name}
                          </span>
                          {step.mcp_server && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">
                              MCP: {step.mcp_server} → {step.mcp_tool}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>{step.latency_ms} ms</span>
                          <span className="text-emerald-400 font-medium">${step.cost_usd}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px]">
                            {step.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300">{step.action}</p>

                      {/* Inputs & Outputs Accordion / Data snippet */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                        <div className="bg-slate-900/90 p-2 rounded border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block mb-1">Inputs:</span>
                          <pre className="text-slate-300 overflow-x-auto text-[10px]">
                            {JSON.stringify(step.inputs, null, 2)}
                          </pre>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block mb-1">Outputs:</span>
                          <pre className="text-slate-300 overflow-x-auto text-[10px]">
                            {JSON.stringify(step.outputs, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs py-4 pl-8">
                  Execution completed via fast path.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No execution report selected.
          </div>
        )}
      </div>
    </div>
  );
};
