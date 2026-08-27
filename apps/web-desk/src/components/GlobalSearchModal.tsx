import React, { useState, useEffect } from 'react';
import {
  Search,
  Bot,
  Layers,
  CheckSquare,
  Network,
  FolderGit2,
  ArrowRight,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setSearchModalOpen,
    setActiveTab,
    tierSpecs,
    backlogStories,
    onboardedRepos,
  } = useRemedaiStore();

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(!isSearchModalOpen);
      }
      if (e.key === 'Escape' && isSearchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const results = [
    ...onboardedRepos.map((r) => ({
      id: r.id,
      title: `Repo: ${r.name}`,
      category: 'Repositories',
      action: () => {
        setActiveTab('repos');
        setSearchModalOpen(false);
      },
      icon: FolderGit2,
    })),
    ...tierSpecs.map((t) => ({
      id: t.tier,
      title: `Tier ${t.tier_number}: ${t.name}`,
      category: 'Model Tiers',
      action: () => {
        setActiveTab('catalog');
        setSearchModalOpen(false);
      },
      icon: Layers,
    })),
    ...backlogStories.map((s) => ({
      id: s.id,
      title: `Issue: ${s.key} - ${s.title}`,
      category: 'Backlog Stories',
      action: () => {
        setActiveTab('backlog');
        setSearchModalOpen(false);
      },
      icon: CheckSquare,
    })),
    {
      id: 'kg',
      title: 'Repository Knowledge Graph (AST Symbols)',
      category: 'Architecture',
      action: () => {
        setActiveTab('knowledge-graph');
        setSearchModalOpen(false);
      },
      icon: Network,
    },
    {
      id: 'studio',
      title: 'Agent Studio IDE & Direct Prompts',
      category: 'Core Agent',
      action: () => {
        setActiveTab('studio');
        setSearchModalOpen(false);
      },
      icon: Bot,
    },
  ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden space-y-3 p-4">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search tiers, models, stories, repos, AST symbols (⌘K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] text-slate-400 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-1 pt-1">
          {results.length > 0 ? (
            results.map((res) => {
              const Icon = res.icon;
              return (
                <div
                  key={res.id}
                  onClick={res.action}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50/70 hover:border-indigo-100 border border-transparent transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600 rounded-lg transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-xs text-slate-900 group-hover:text-indigo-950 truncate">
                        {res.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{res.category}</div>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No matching results found.</div>
          )}
        </div>
      </div>
    </div>
  );
};
