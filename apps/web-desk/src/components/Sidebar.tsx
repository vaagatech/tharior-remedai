import React from 'react';
import {
  FolderGit2,
  Network,
  Bot,
  Layers,
  CheckSquare,
  Sparkles,
  GitPullRequest,
  Activity,
  HelpCircle,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeTab, setActiveTab, setSearchModalOpen, backlogStories } = useRemedaiStore();

  const navigationGroups = [
    {
      group: 'Repository & Knowledge',
      items: [
        { id: 'repos', label: 'Repo Onboarding', icon: FolderGit2, badge: 'Step 1' },
        { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Network, badge: 'AST' },
      ],
    },
    {
      group: 'Agent Core',
      items: [
        { id: 'studio', label: 'Agent Studio IDE', icon: Bot },
        { id: 'catalog', label: '10-Tier Model Catalog', icon: Layers, badge: '10 Tiers' },
        { id: 'backlog', label: 'Issue Backlog & Auto-Fix', icon: CheckSquare, badge: `${backlogStories.length}` },
        { id: 'pr-review', label: 'VCS PR Review Agent', icon: GitPullRequest },
      ],
    },
    {
      group: 'Intelligence & Ops',
      items: [
        { id: 'multimodal', label: 'Multimodal Studio', icon: Sparkles },
        { id: 'observability', label: 'Telemetry & Observability', icon: Activity, badge: 'Live' },
        { id: 'clarifications', label: 'Clarifications Desk', icon: HelpCircle },
        { id: 'settings', label: 'Settings & Cloud Config', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 shadow-xs ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              R
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                <span>RemedAI</span>
                <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[10px] font-mono rounded border border-indigo-200">
                  v2.0
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Autonomous Coding Agent</div>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            R
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Global Search Shortcut */}
      <div className="p-3">
        <button
          onClick={() => setSearchModalOpen(true)}
          className={`w-full flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 transition-all cursor-pointer ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            {!collapsed && <span>Command Palette...</span>}
          </div>
          {!collapsed && (
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {navigationGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.group}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-100">
        <div
          className={`flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          {!collapsed && (
            <div className="flex-1 truncate">
              <div className="font-semibold text-slate-800 text-[11px] truncate">KEDA Scaler: Active</div>
              <div className="text-[10px] text-slate-500 truncate">Light Mode • All Systems Green</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
