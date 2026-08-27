import React, { useState } from 'react';
import {
  Layers,
  RefreshCw,
  Sliders,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';
import type { TierLevel } from '../types';

export const ModelCatalogDesk: React.FC = () => {
  const {
    tierSpecs,
    customerOverrides,
    setTierShift,
    togglePreferFreeModels,
    setRefreshInterval,
    syncOpenRouterCatalog,
  } = useRemedaiStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedTier, setExpandedTier] = useState<TierLevel | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncOpenRouterCatalog();
    setTimeout(() => setIsSyncing(false), 1200);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">10-Tier Model Catalog Matrix</h1>
          </div>
          <p className="text-slate-600 text-sm">
            N models registered per tier with dynamic load balancing, automated OpenRouter pricing sync, and customer ±2 tier overrides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 text-xs transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            Tiering Policies & Sync Config
          </button>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync OpenRouter Catalog
          </button>
        </div>
      </div>

      {/* Filter and Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">Total System Tiers</div>
            <div className="text-xl font-bold text-slate-900">10 Discrete Tiers</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">Free Models Prioritization</div>
            <div className="text-sm font-bold text-emerald-600">
              {customerOverrides.prefer_free_models ? 'Enabled (0-Cost Auto-Routing)' : 'Disabled'}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={customerOverrides.prefer_free_models}
              onChange={(e) => togglePreferFreeModels(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">Sync Interval</div>
            <div className="text-sm font-bold text-slate-800">
              Every {customerOverrides.refresh_interval_hours} Hours (Weekly)
            </div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 10 Tier Cards List */}
      <div className="space-y-4">
        {tierSpecs.map((tier) => {
          const isExpanded = expandedTier === tier.tier;
          return (
            <div
              key={tier.tier}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Tier Header Bar */}
              <div
                onClick={() => setExpandedTier(isExpanded ? null : tier.tier)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-2xs">
                    T{tier.tier_number}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{tier.name}</h3>
                      <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {tier.cost_category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{tier.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right hidden sm:block">
                    <div className="text-slate-500 text-[11px]">Registered Models</div>
                    <div className="font-bold text-slate-800">{tier.registered_models?.length || tier.representative_models.length} Models</div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-slate-500 text-[11px]">Target Latency</div>
                    <div className="font-bold text-emerald-600">{tier.est_latency_ms} ms</div>
                  </div>

                  <div className="p-1.5 text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/40 space-y-6">
                  {/* Benchmarks & Target Tasks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="text-xs font-bold uppercase text-slate-600">Target Tasks & Specialization</div>
                      <div className="text-xs text-slate-700 font-medium">{tier.functional_specialization}</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tier.target_tasks.map((task) => (
                          <span key={task} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] border border-slate-200">
                            {task}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="text-xs font-bold uppercase text-slate-600">Verified Benchmarks</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(tier.benchmarks).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-500 uppercase text-[10px] font-mono">{k.replace('_', ' ')}:</span>
                            <span className="font-bold text-slate-800 font-mono">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Registered Models List with Customer Shift Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wide">
                        Registered Models in Tier {tier.tier_number} (N Models Architecture)
                      </h4>
                      <span className="text-xs text-slate-500">Customer Shift Range: -2 to +2 Tiers</span>
                    </div>

                    <div className="space-y-2">
                      {tier.registered_models?.map((model) => {
                        const shift = customerOverrides.tier_shifts[model.id] || 0;
                        return (
                          <div
                            key={model.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{model.name}</span>
                                {model.is_free && (
                                  <span className="px-2 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                                    FREE MODEL
                                  </span>
                                )}
                                <span className="text-xs font-mono text-slate-400">({model.id})</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span>Context: <strong className="text-slate-700 font-mono">{(model.context_length / 1000).toFixed(0)}k</strong></span>
                                <span>Input: <strong className="text-slate-700 font-mono">${model.prompt_cost_per_1m.toFixed(2)}/1M</strong></span>
                                <span>Output: <strong className="text-slate-700 font-mono">${model.completion_cost_per_1m.toFixed(2)}/1M</strong></span>
                                <span>Speed: <strong className="text-slate-700 font-mono">{model.tokens_per_second} t/s</strong></span>
                              </div>
                            </div>

                            {/* Shift Control Buttons */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-medium">Customer Override:</span>
                              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                                {[-2, -1, 0, 1, 2].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setTierShift(model.id, s)}
                                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                                      shift === s
                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    {s > 0 ? `+${s}` : s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sync Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Tiering & OpenRouter Config</h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Weekly Refresh Interval</label>
                <select
                  value={customerOverrides.refresh_interval_hours}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={24}>Every 24 Hours (Daily)</option>
                  <option value={72}>Every 72 Hours</option>
                  <option value={168}>Every 168 Hours (Weekly - Recommended)</option>
                  <option value={720}>Every 30 Days (Monthly)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">OpenRouter Catalog Endpoint</label>
                <input
                  type="text"
                  readOnly
                  value="https://openrouter.ai/api/v1/models"
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                />
              </div>

              <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                OpenRouter models and active discounts are cached in the GKE Redis layer. Models are automatically evaluated and placed into the 10 tiers based on context window, coding benchmarks, and pricing.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow-sm cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
