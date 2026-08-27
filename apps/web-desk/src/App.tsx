import { useState, useEffect } from 'react';
import { useLiveEvents } from './hooks/useLiveEvents';
import { useRemedaiStore } from './store/useRemedaiStore';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AgentStudioDesk } from './components/AgentStudioDesk';
import { IssueBacklogDesk } from './components/IssueBacklogDesk';
import { ModelCatalogDesk } from './components/ModelCatalogDesk';
import { MultimodalStudioDesk } from './components/MultimodalStudioDesk';
import { GitPRReviewDesk } from './components/GitPRReviewDesk';
import { SettingsDesk } from './components/SettingsDesk';
import { ClarificationDesk } from './components/ClarificationDesk';
import { A2AVisualizer } from './components/A2AVisualizer';
import { TicketSimulator } from './components/TicketSimulator';
import { SandboxTerminal } from './components/SandboxTerminal';
import { CostAnalytics } from './components/CostAnalytics';
import { ObservabilityDesk } from './components/ObservabilityDesk';
import { BrowserPreviewDesk } from './components/BrowserPreviewDesk';
import { SecuritySASTDesk } from './components/SecuritySASTDesk';
import { PlaybookReviewDesk } from './components/PlaybookReviewDesk';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { TaskExecutionReport } from './types';
import {
  AlertCircle,
  Search,
} from 'lucide-react';

export function App() {
  const {
    activePath,
    setActivePath,
    setIsSearchModalOpen,
  } = useRemedaiStore();

  const [selectedReport] = useState<TaskExecutionReport | null>(null);

  const {
    metrics,
    reports,
    clarifications,
    agents,
    refreshData,
  } = useLiveEvents();

  const pendingClarificationsCount = clarifications.filter(
    (c) => c.status === 'WAITING_CLARIFICATION'
  ).length;

  // Sync browser popstate (back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      setActivePath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActivePath]);

  // Route View Resolver
  const renderCurrentView = () => {
    switch (activePath) {
      case '/':
      case '/studio':
        return <AgentStudioDesk />;
      case '/issues':
        return <IssueBacklogDesk />;
      case '/tiers':
      case '/models':
        return <ModelCatalogDesk />;
      case '/multimodal':
        return <MultimodalStudioDesk />;
      case '/pr-review':
        return <GitPRReviewDesk />;
      case '/clarifications':
        return (
          <ClarificationDesk
            sessions={clarifications}
            onRefresh={refreshData}
            onSessionResolved={refreshData}
          />
        );
      case '/playbooks':
        return <PlaybookReviewDesk />;
      case '/a2a':
        return (
          <A2AVisualizer
            agents={agents}
            reports={reports}
            selectedReport={selectedReport}
          />
        );
      case '/simulator':
        return (
          <TicketSimulator
            onTicketSubmitted={refreshData}
            onNavigateTab={(tab) => setActivePath(`/${tab}`)}
          />
        );
      case '/sandbox':
        return (
          <SandboxTerminal
            reports={reports}
            selectedReport={selectedReport}
          />
        );
      case '/analytics':
        return <CostAnalytics metrics={metrics} />;
      case '/observability':
        return <ObservabilityDesk />;
      case '/browser':
        return <BrowserPreviewDesk />;
      case '/sast':
        return <SecuritySASTDesk />;
      case '/settings':
        return <SettingsDesk />;
      default:
        return <AgentStudioDesk />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white">
        {/* Global Fuzzy Search Modal (Cmd+K) */}
        <GlobalSearchModal />

        {/* Left Responsive Collapsible Navigation Sidebar */}
        <Sidebar pendingClarifications={pendingClarificationsCount} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          {/* Top Header Bar */}
          <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex justify-between items-center gap-4">
            {/* Breadcrumb & Path Location */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">Workspace /</span>
              <h2 className="text-sm font-bold text-slate-200 capitalize font-heading truncate">
                {activePath === '/' || activePath === '/studio'
                  ? 'Agent Studio & Prompt IDE'
                  : activePath.replace('/', '').replace('-', ' ')}
              </h2>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-3">
              {/* Quick Search trigger */}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-400 transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Search Anything...</span>
                <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">⌘K</kbd>
              </button>

              {/* Clarification Shortcut Badge */}
              <button
                onClick={() => setActivePath('/clarifications')}
                className={`text-xs px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
                  pendingClarificationsCount > 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 animate-pulse-subtle'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pendingClarificationsCount} Clarifications</span>
              </button>
            </div>
          </header>

          {/* Main Dynamic Viewport Container */}
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            {renderCurrentView()}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
