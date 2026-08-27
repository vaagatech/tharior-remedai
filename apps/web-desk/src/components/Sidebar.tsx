import React from 'react';
import {
  Terminal,
  ListTodo,
  AlertCircle,
  Layers,
  Video,
  DollarSign,
  GitPullRequest,
  BookOpen,
  ShieldAlert,
  Activity,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Bot,
  Users,
  Search,
} from 'lucide-react';
import { useRemedaiStore } from '../store/useRemedaiStore';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export function Sidebar({ pendingClarifications = 0 }: { pendingClarifications?: number }) {
  const {
    activePath,
    setActivePath,
    isSidebarCollapsed,
    toggleSidebar,
    setIsSearchModalOpen,
  } = useRemedaiStore();

  const navGroups: NavGroup[] = [
    {
      groupName: 'Core Workspaces',
      items: [
        { path: '/studio', label: 'Agent Studio & Prompt IDE', icon: Terminal },
        { path: '/issues', label: 'Story & Issue Backlog', icon: ListTodo, badge: '4 New', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
        {
          path: '/clarifications',
          label: 'Clarification Desk',
          icon: AlertCircle,
          badge: pendingClarifications > 0 ? `${pendingClarifications} Pending` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 font-bold',
        },
        { path: '/a2a', label: 'A2A Multi-Agent Graph', icon: Users },
        { path: '/sandbox', label: 'Sandbox Terminal', icon: Cpu },
      ],
    },
    {
      groupName: '10-Tier LLM Orchestration',
      items: [
        { path: '/tiers', label: '10-Tier Model Matrix', icon: Layers, badge: '10 Tiers', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
        { path: '/multimodal', label: 'Multimodal Media Studio', icon: Video },
        { path: '/analytics', label: 'Cost Control & Tokens', icon: DollarSign },
      ],
    },
    {
      groupName: 'Integrations & Automations',
      items: [
        { path: '/pr-review', label: 'PR Review & VCS Agent', icon: GitPullRequest },
        { path: '/playbooks', label: 'Automation Playbooks', icon: BookOpen },
      ],
    },
    {
      groupName: 'Security & Observability',
      items: [
        { path: '/sast', label: 'Security SAST Watcher', icon: ShieldAlert },
        { path: '/observability', label: 'Telemetry & DLQ Replay', icon: Activity },
        { path: '/browser', label: 'Browser Subagent MCP', icon: Globe },
      ],
    },
    {
      groupName: 'Configuration',
      items: [{ path: '/settings', label: 'Gateway & Auth Settings', icon: Settings }],
    },
  ];

  const handleNavClick = (path: string) => {
    setActivePath(path);
  };

  return (
    <aside
      className={`bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-200 z-40 sticky top-0 h-screen select-none ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Brand & Search */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div
            onClick={() => handleNavClick('/studio')}
            className="flex items-center gap-2.5 cursor-pointer min-w-0"
          >
            <div className="p-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 truncate">
                <h1 className="text-xs font-bold tracking-wider text-white font-heading truncate">
                  THARIOR REMEDAI
                </h1>
                <span className="text-[10px] text-indigo-400 font-mono block truncate">
                  Autonomous Platform
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Global Search Shortcut Button */}
        {!isSidebarCollapsed ? (
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-400 flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search Tiers, Stories...</span>
            </div>
            <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">
              ⌘K
            </kbd>
          </button>
        ) : (
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex justify-center hover:text-white cursor-pointer"
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.groupName}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activePath === item.path ||
                  (item.path === '/studio' && (activePath === '/' || activePath === ''));

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    } ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isSidebarCollapsed && item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-sans flex-shrink-0 ${
                          item.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Cluster & Connection Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 text-xs">
        {!isSidebarCollapsed ? (
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span>Cluster:</span>
              <span className="font-mono text-slate-300">gke-spot-us-central1</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Mesh Online
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Cluster: gke-spot-us-central1 (Online)">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
