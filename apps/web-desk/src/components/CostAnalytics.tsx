import React, { useState } from 'react';
import {
  DollarSign,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import type { TelemetryMetrics } from '../types';

interface CostAnalyticsProps {
  metrics: TelemetryMetrics;
}

export const CostAnalytics: React.FC<CostAnalyticsProps> = ({ metrics }) => {
  const [taskVolume, setTaskVolume] = useState<number>(10000);

  // Model cost per 1k tasks based on specification
  const tier0CostPer1k = 0.20; // Gemini 1.5 Flash 8B / GPT-4o-mini
  const tier1CostPer1k = 1.75; // Claude 3.5 Haiku
  const tier2CostPer1k = 22.50; // Claude 3.7 Sonnet / GPT-4o

  // Current empirical distribution
  const nanoRatio = metrics.tier_distribution.nano / metrics.total_dispatched || 0.76;
  const midRatio = metrics.tier_distribution.mid / metrics.total_dispatched || 0.18;
  const frontierRatio = metrics.tier_distribution.frontier / metrics.total_dispatched || 0.06;

  // Projected cost with Tiered Routing
  const projectedTieredCost =
    (taskVolume / 1000) *
    (nanoRatio * tier0CostPer1k + midRatio * tier1CostPer1k + frontierRatio * tier2CostPer1k);

  // Cost if all were run on Frontier model
  const projectedFrontierOnlyCost = (taskVolume / 1000) * tier2CostPer1k;

  // Cost if fixed by human engineers ($85/hr, 1.5 hrs/defect)
  const humanEngineeringCost = taskVolume * 85 * 1.5;

  const dollarSavingsVsFrontier = projectedFrontierOnlyCost - projectedTieredCost;
  const percentageSavings = Math.round((dollarSavingsVsFrontier / projectedFrontierOnlyCost) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2 font-heading">
            <DollarSign className="w-5 h-5 text-indigo-400" />
            <span>Tiered LLM Orchestration & Cost Control Analytics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time economic attribution, model routing distribution, and enterprise ROI projections
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs text-emerald-400 font-semibold">
          <TrendingDown className="w-4 h-4" />
          <span>{percentageSavings}% Tiered Routing Savings</span>
        </div>
      </div>

      {/* 3 Model Tier Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 0 */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-900/50 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Tier 0: Nano / Mini
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Gemini 1.5 Flash 8B / 4o-mini</h3>
            </div>
            <span className="text-xs font-bold text-emerald-400">$0.10 - $0.30 / 1k</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sub-100ms classification, Knowledge Graph lookups, syntax formatting, and documentation typo fixes.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Workload Share:</span>
            <span className="text-emerald-400 font-bold">{Math.round(nanoRatio * 100)}% ({metrics.tier_distribution.nano} tasks)</span>
          </div>
        </div>

        {/* Tier 1 */}
        <div className="glass-panel p-5 rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-slate-900/50 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Tier 1: Mid-Tier
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Claude 3.5 Haiku</h3>
            </div>
            <span className="text-xs font-bold text-indigo-400">$1.00 - $2.50 / 1k</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standard unit test failures, isolated function logic defects, HTTP handlers, and build/linter remediations.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Workload Share:</span>
            <span className="text-indigo-400 font-bold">{Math.round(midRatio * 100)}% ({metrics.tier_distribution.mid} tasks)</span>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="glass-panel p-5 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900/50 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Tier 2: Frontier
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Claude 3.7 Sonnet / GPT-4o</h3>
            </div>
            <span className="text-xs font-bold text-amber-400">$15.00 - $30.00 / 1k</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Multi-file refactoring, distributed state bugs, cross-service deadlock resolution, and core migrations.
          </p>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Workload Share:</span>
            <span className="text-amber-400 font-bold">{Math.round(frontierRatio * 100)}% ({metrics.tier_distribution.frontier} tasks)</span>
          </div>
        </div>
      </div>

      {/* Interactive Enterprise ROI & Scale Simulator */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Enterprise Scale & ROI Simulator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Project annual cost savings comparing Tiered Autonomous Routing vs Frontier LLMs vs Human Engineering
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Projected Task Volume:</span>
            <select
              value={taskVolume}
              onChange={(e) => setTaskVolume(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value={5000}>5,000 Tasks / mo</option>
              <option value={10000}>10,000 Tasks / mo</option>
              <option value={50000}>50,000 Tasks / mo</option>
              <option value={100000}>100,000 Tasks / mo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Autonomous Tiered */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Autonomous Tiered Platform
            </span>
            <div className="text-2xl font-bold text-white font-heading">
              ${projectedTieredCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400">
              ${(projectedTieredCost / taskVolume).toFixed(4)} average per task fix
            </p>
          </div>

          {/* Frontier Only */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Un-tiered Frontier LLMs Only
            </span>
            <div className="text-2xl font-bold text-slate-300 font-heading">
              ${projectedFrontierOnlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400">
              ${(projectedFrontierOnlyCost / taskVolume).toFixed(4)} average per task fix
            </p>
          </div>

          {/* Human Engineering Equivalent */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Manual Engineering Hours
            </span>
            <div className="text-2xl font-bold text-indigo-300 font-heading">
              ${humanEngineeringCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">
              Based on 1.5 hrs/fix @ $85/hr
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
