import { useEffect, useState } from 'react';
import {
  Search,
  ArrowRight,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';
import type { SearchItem } from '../types';

export function GlobalSearchModal() {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
    tierSpecs,
    stories,
    setActivePath,
  } = useRemedaiStore();

  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchableIndex: SearchItem[] = [
    ...tierSpecs.map((t) => ({
      id: `tier-${t.tier_number}`,
      title: `Tier ${t.tier_number}: ${t.name}`,
      category: 'TIER' as const,
      subtitle: `${t.representative_models.join(', ')} • ${t.cost_category}`,
      path: '/tiers',
    })),
    ...tierSpecs.flatMap((t) =>
      t.representative_models.map((m) => ({
        id: `model-${m}`,
        title: m,
        category: 'MODEL' as const,
        subtitle: `Assigned to Tier ${t.tier_number} (${t.name})`,
        path: '/tiers',
      }))
    ),
    ...stories.map((s) => ({
      id: `story-${s.id}`,
      title: `${s.key}: ${s.title}`,
      category: 'STORY' as const,
      subtitle: `Priority: ${s.priority} • Status: ${s.status} • Repo: ${s.repo}`,
      path: '/issues',
    })),
    {
      id: 'ws-studio',
      title: 'Agent Prompt Studio & Direct Developer IDE',
      category: 'TOOL' as const,
      subtitle: 'Author remediation prompts and inspect AST diffs',
      path: '/studio',
    },
    {
      id: 'ws-sast',
      title: 'Security SAST & Vulnerability Watcher',
      category: 'TOOL' as const,
      subtitle: 'Bandit & Semgrep automated security vulnerability scanner',
      path: '/sast',
    },
    {
      id: 'ws-pr',
      title: 'PR Review Agent & VCS Integration',
      category: 'TOOL' as const,
      subtitle: 'Line-by-line review annotations and automated merge criteria',
      path: '/pr-review',
    },
    {
      id: 'ws-multimodal',
      title: 'Multimodal Audio / Video / Image Studio',
      category: 'TOOL' as const,
      subtitle: 'Generate audio summaries, PR demo videos, and diagrams',
      path: '/multimodal',
    },
    {
      id: 'ws-observability',
      title: 'Observability, Distributed Traces & DLQ Replay',
      category: 'TOOL' as const,
      subtitle: 'Zero-missed-events DLQ quarantine and circuit breakers',
      path: '/observability',
    },
  ];

  const filteredItems = searchableIndex.filter((item) => {
    if (!globalSearchQuery.trim()) return true;
    const q = globalSearchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(!isSearchModalOpen);
      } else if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const handleSelect = (item: SearchItem) => {
    setActivePath(item.path);
    setIsSearchModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            type="text"
            autoFocus
            value={globalSearchQuery}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search all 10 tiers, models, backlog stories, agents, playbooks, or traces..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono border border-slate-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono ${
                      item.category === 'TIER'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : item.category === 'MODEL'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : item.category === 'STORY'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {item.category}
                  </span>
                  <div className="min-w-0 truncate">
                    <div className="text-xs font-bold truncate text-slate-100">{item.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching tiers, models, or stories found.
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300 font-mono">⌘K</kbd> anytime to open</span>
          </div>
          <div>Tharior Remedai Global Search Index</div>
        </div>
      </div>
    </div>
  );
}
