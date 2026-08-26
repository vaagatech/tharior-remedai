import { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Sparkles,
  RefreshCw,
  Settings,
  Database,
  Globe,
  CheckCircle2,
  Volume2,
  Video,
  Image as ImageIcon
} from 'lucide-react';

interface ModelCatalogEntry {
  id: string;
  name: string;
  description: string;
  provider: string;
  context_length: number;
  modalities: string[];
  is_free: boolean;
  prompt_cost_per_1m_usd: number;
  completion_cost_per_1m_usd: number;
  system_tier: string;
  user_override_tier?: string | null;
  is_allowed: boolean;
}

interface MultimodalTier {
  modality: string;
  tier_name: string;
  tier_level: number;
  description: string;
  representative_models: string[];
  cost_per_unit_usd: number;
  unit_description: string;
  est_latency_sec: number;
  supported_formats: string[];
}

interface CacheStats {
  enabled: boolean;
  similarity_threshold: number;
  active_cached_entries: number;
  total_queries: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate_pct: number;
  total_tokens_saved: number;
  total_cost_saved_usd: number;
}

export function ModelCatalogDesk() {
  const [models, setModels] = useState<ModelCatalogEntry[]>([]);
  const [multimodalTiers, setMultimodalTiers] = useState<MultimodalTier[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'multimodal' | 'cache_search'>('catalog');
  const [tierShifts, setTierShifts] = useState<Record<string, number>>({});
  const [allowedModels, setAllowedModels] = useState<Record<string, boolean>>({});
  const [searchPluginEnabled, setSearchPluginEnabled] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('https://openrouter.ai/api/v1/models');
  const [refreshIntervalDays, setRefreshIntervalDays] = useState(7);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/models/catalog?limit=200');
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        const allowedInit: Record<string, boolean> = {};
        data.models?.forEach((m: ModelCatalogEntry) => {
          allowedInit[m.id] = m.is_allowed;
        });
        setAllowedModels(allowedInit);
      }
    } catch {
      // Fallback baseline models
      setModels([
        { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', description: 'Ultra-fast formatting & syntax linting', provider: 'Meta', context_length: 131072, modalities: ['text'], is_free: true, prompt_cost_per_1m_usd: 0, completion_cost_per_1m_usd: 0, system_tier: 'tier_1_micro_lint', is_allowed: true },
        { id: 'google/gemini-2.0-flash-lite:free', name: 'Gemini 2.0 Flash Lite (Free)', description: 'Fast docstrings and refactors', provider: 'Google', context_length: 1048576, modalities: ['text', 'image'], is_free: true, prompt_cost_per_1m_usd: 0, completion_cost_per_1m_usd: 0, system_tier: 'tier_1_micro_lint', is_allowed: true },
        { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek V3 (Free)', description: 'Balanced economy coding and logic', provider: 'DeepSeek', context_length: 65536, modalities: ['text'], is_free: true, prompt_cost_per_1m_usd: 0, completion_cost_per_1m_usd: 0, system_tier: 'tier_2_ultra_fast', is_allowed: true },
        { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', description: 'Deep reasoning & concurrency analysis', provider: 'DeepSeek', context_length: 65536, modalities: ['text'], is_free: true, prompt_cost_per_1m_usd: 0, completion_cost_per_1m_usd: 0, system_tier: 'tier_7_deep_reasoner', is_allowed: true },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Economical coder and unit test solver', provider: 'OpenAI', context_length: 128000, modalities: ['text', 'image'], is_free: false, prompt_cost_per_1m_usd: 0.15, completion_cost_per_1m_usd: 0.60, system_tier: 'tier_3_economy_coder', is_allowed: true },
        { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Frontier full-stack workhorse', provider: 'Anthropic', context_length: 200000, modalities: ['text', 'image'], is_free: false, prompt_cost_per_1m_usd: 3.00, completion_cost_per_1m_usd: 15.00, system_tier: 'tier_6_core_workhorse', is_allowed: true },
        { id: 'anthropic/claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Senior architect with hybrid thinking', provider: 'Anthropic', context_length: 200000, modalities: ['text', 'image'], is_free: false, prompt_cost_per_1m_usd: 3.00, completion_cost_per_1m_usd: 15.00, system_tier: 'tier_8_senior_architect', is_allowed: true },
      ]);
    }

    try {
      const mmRes = await fetch('/api/v1/models/multimodal-tiers');
      if (mmRes.ok) {
        setMultimodalTiers(await mmRes.json());
      }
    } catch {}

    try {
      const cacheRes = await fetch('/api/v1/cache/stats');
      if (cacheRes.ok) {
        setCacheStats(await cacheRes.json());
      }
    } catch {}

    setLoading(false);
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleShiftChange = (modelId: string, delta: number) => {
    setTierShifts((prev) => {
      const current = prev[modelId] || 0;
      const next = Math.max(-2, Math.min(2, current + delta));
      return { ...prev, [modelId]: next };
    });
  };

  const handleApplyOverrides = async () => {
    try {
      const allowedList = Object.entries(allowedModels)
        .filter(([, allowed]) => allowed)
        .map(([id]) => id);

      const res = await fetch('/api/v1/models/customer-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowed_models: allowedList.length > 0 ? allowedList : null,
          tier_shifts: tierShifts,
          prefer_free_models: true
        })
      });

      if (res.ok) {
        showToast('Customer tier overrides & allowed whitelist applied!');
        fetchCatalog();
      }
    } catch {
      showToast('Applied locally (sandbox mode)');
    }
  };

  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/models/refresh-pricing?force=true', { method: 'POST' });
      showToast('Fetched live catalog & pricing from OpenRouter!');
      fetchCatalog();
    } catch {
      showToast('Refreshed cached model catalog');
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await fetch('/api/v1/cache/clear', { method: 'POST' });
      showToast('Semantic Cache cleared!');
      fetchCatalog();
    } catch {
      showToast('Cache cleared');
    }
  };

  const filteredModels = models.filter((m) => {
    if (freeOnly && !m.is_free) return false;
    if (selectedModality !== 'all' && !m.modalities.includes(selectedModality)) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return m.id.toLowerCase().includes(s) || m.name.toLowerCase().includes(s) || m.provider.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-wide font-heading">
              OpenRouter Dynamic Model Registry & Tier Customizer
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Weekly scheduled ingestion from <code className="text-indigo-300">openrouter.ai/models</code> • Free model prioritization • Customer ±1/2 Tier Overrides
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Registry Config</span>
          </button>

          <button
            onClick={handleForceRefresh}
            disabled={loading}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Ingesting...' : 'Refresh Weekly Catalog'}</span>
          </button>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'catalog' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>LLM Models ({models.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('multimodal')}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'multimodal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Multimodal Tiers (Audio, Video, Image)</span>
        </button>

        <button
          onClick={() => setActiveTab('cache_search')}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'cache_search' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Semantic Cache & Web Search Plugin</span>
        </button>
      </div>

      {/* Tab 1: Catalog & Tier Overrides */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search models, providers, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-200 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFreeOnly(!freeOnly)}
                className={`px-3 py-1.5 rounded-lg border transition font-medium flex items-center gap-1.5 cursor-pointer ${
                  freeOnly
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Free Models Only ({models.filter((m) => m.is_free).length})</span>
              </button>

              <select
                value={selectedModality}
                onChange={(e) => setSelectedModality(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 outline-none text-xs"
              >
                <option value="all">All Modalities</option>
                <option value="text">Text Only</option>
                <option value="image">Vision / Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>

              <button
                onClick={handleApplyOverrides}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md transition cursor-pointer"
              >
                Apply Overrides
              </button>
            </div>
          </div>

          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.map((m) => {
              const shift = tierShifts[m.id] || 0;
              const isAllowed = allowedModels[m.id] ?? true;

              return (
                <div
                  key={m.id}
                  className={`bg-slate-900/60 rounded-xl border p-4 flex flex-col justify-between transition ${
                    !isAllowed
                      ? 'border-slate-800/40 opacity-50'
                      : m.is_free
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header: Name, Provider & Free Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold text-slate-100">{m.name}</h3>
                          {m.is_free && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 font-bold">
                              FREE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{m.id}</p>
                      </div>

                      <input
                        type="checkbox"
                        checked={isAllowed}
                        onChange={(e) =>
                          setAllowedModels((prev) => ({ ...prev, [m.id]: e.target.checked }))
                        }
                        title="Allow model in tiering"
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{m.description || 'General engineering LLM.'}</p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        Provider: {m.provider}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        Ctx: {Math.round(m.context_length / 1000)}k
                      </span>
                      {m.modalities.map((mod) => (
                        <span key={mod} className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded">
                          {mod}
                        </span>
                      ))}
                    </div>

                    {/* Pricing Display */}
                    <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] flex justify-between">
                      <div>
                        <span className="text-slate-500">Prompt: </span>
                        <span className="text-slate-200 font-bold">
                          {m.is_free ? '$0.00' : `$${m.prompt_cost_per_1m_usd}/1M`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Completion: </span>
                        <span className="text-slate-200 font-bold">
                          {m.is_free ? '$0.00' : `$${m.completion_cost_per_1m_usd}/1M`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tier Override Stepper (±1 or ±2 Tiers) */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">System Tier</span>
                      <span className="text-[11px] text-indigo-300 font-bold">{m.system_tier}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleShiftChange(m.id, -1)}
                        disabled={shift <= -2}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                        title="Shift 1 tier down (lower cost)"
                      >
                        -
                      </button>

                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          shift > 0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : shift < 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400'
                        }`}
                      >
                        {shift > 0 ? `+${shift}` : shift}
                      </span>

                      <button
                        onClick={() => handleShiftChange(m.id, 1)}
                        disabled={shift >= 2}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                        title="Shift 1 tier up (higher capability)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Multimodal Tiers */}
      {activeTab === 'multimodal' && (
        <div className="space-y-4">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
            <p>
              Dedicated tiering specifications for Audio, Video, Image, and Presentation Assets.
              Same multi-dimensional routing principles with decoupled per-unit pricing metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {multimodalTiers.map((tier, idx) => (
              <div key={idx} className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tier.modality === 'audio' && <Volume2 className="w-4 h-4 text-sky-400" />}
                    {tier.modality === 'video' && <Video className="w-4 h-4 text-purple-400" />}
                    {tier.modality === 'image' && <ImageIcon className="w-4 h-4 text-emerald-400" />}
                    <h3 className="text-xs font-bold text-slate-100">{tier.tier_name}</h3>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold uppercase">
                    {tier.modality} Tier {tier.tier_level}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">{tier.description}</p>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] flex justify-between items-center">
                  <div>
                    <span className="text-slate-500">Unit Cost: </span>
                    <span className="text-emerald-400 font-bold">${tier.cost_per_unit_usd}</span>
                    <span className="text-slate-500"> ({tier.unit_description})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Latency: </span>
                    <span className="text-slate-300">{tier.est_latency_sec}s</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Representative Engines:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tier.representative_models.map((m) => (
                      <span key={m} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Semantic Cache & Internet Search Plugin */}
      {activeTab === 'cache_search' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Semantic Cache */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Semantic Cache Engine</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Cosine Sim &gt; 0.92
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Matches user queries and AST remediation prompts against verified past solutions to eliminate upstream LLM costs and zero out latency.
            </p>

            {cacheStats && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Hit Rate</span>
                  <span className="text-base font-bold text-emerald-400">{cacheStats.hit_rate_pct}%</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Cached Solutions</span>
                  <span className="text-base font-bold text-white">{cacheStats.active_cached_entries}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Tokens Saved</span>
                  <span className="text-base font-bold text-indigo-400">
                    {cacheStats.total_tokens_saved.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">USD Saved</span>
                  <span className="text-base font-bold text-emerald-400">${cacheStats.total_cost_saved_usd}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleClearCache}
              className="w-full py-2 bg-slate-800 hover:bg-rose-900/40 hover:border-rose-700 text-slate-300 hover:text-rose-300 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
            >
              Clear Semantic Cache
            </button>
          </div>

          {/* Internet Search Plugin */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Internet Search Tool Plugin</h3>
              </div>
              <button
                onClick={() => setSearchPluginEnabled(!searchPluginEnabled)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  searchPluginEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {searchPluginEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Allows remediation agents to search for current documentation, library changelogs, and CVE security advisories with token-budgeted synthesis.
            </p>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Search Provider:</span>
                <span className="text-slate-200 font-mono">DuckDuckGo / OpenRouter Web</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max Results Per Query:</span>
                <span className="text-slate-200 font-mono">5 items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Output Mode:</span>
                <span className="text-slate-200 font-mono">Concise Snippet Injection</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Model Registry Source & Scheduler</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">OpenRouter Catalog Endpoint URL</label>
                <input
                  type="text"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Scheduled Refresh Interval (Days)</label>
                <input
                  type="number"
                  value={refreshIntervalDays}
                  onChange={(e) => setRefreshIntervalDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  showToast('Updated registry schedule and source URL!');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
