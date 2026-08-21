import { useState } from 'react';
import {
  Activity,
  DollarSign,
  Terminal,
  Search,
  AlertCircle,
  Users,
  Zap,
  ShieldCheck,
  Globe,
  ShieldAlert,
} from 'lucide-react';
import { useLiveEvents } from './hooks/useLiveEvents';
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { ClarificationDesk } from './components/ClarificationDesk';
import { A2AVisualizer } from './components/A2AVisualizer';
import { TicketSimulator } from './components/TicketSimulator';
import { SandboxTerminal } from './components/SandboxTerminal';
import { CostAnalytics } from './components/CostAnalytics';
import { ObservabilityDesk } from './components/ObservabilityDesk';
import { BrowserPreviewDesk } from './components/BrowserPreviewDesk';
import { SecuritySASTDesk } from './components/SecuritySASTDesk';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { TaskExecutionReport } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'clarifications' | 'a2a' | 'simulator' | 'sandbox' | 'analytics' | 'observability' | 'browser' | 'sast'
  >('overview');

  const [selectedReport, setSelectedReport] = useState<TaskExecutionReport | null>(null);

  const {
    metrics,
    systemMetrics,
    reports,
    clarifications,
    agents,
    connected,
    liveLogStream,
    refreshData,
    triggerGC,
  } = useLiveEvents();

  const pendingClarificationsCount = clarifications.filter(
    (c) => c.status === 'WAITING_CLARIFICATION'
  ).length;

  const handleSelectReport = (report: TaskExecutionReport) => {
    setSelectedReport(report);
    setActiveTab('sandbox');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-mono flex flex-col selection:bg-indigo-500 selection:text-white">
        {/* Top Navigation Bar */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex flex-wrap justify-between items-center gap-4">
          {/* Brand & Cluster Meta */}
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Tharior Remedai" className="h-9 w-9 rounded-xl shadow-lg shadow-indigo-600/25" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-wide text-white font-heading">
                  THARIOR REMEDAI
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AGENTIC A2A + MCP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Cluster: aws-eks-prod-us-east-1</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {connected ? 'WebSocket Reactive Bus Online' : 'Connecting Bus...'}
                </span>
              </p>
            </div>
          </div>

          {/* Action Controls & Clarification Shortcut */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
              <Search className="w-3.5 h-3.5" />
              <span>Search Traces, ASTs...</span>
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-sans">⌘K</kbd>
            </div>

            <button
              onClick={() => setActiveTab('clarifications')}
              className={`text-xs px-3.5 py-2 rounded-lg transition font-medium flex items-center gap-2 cursor-pointer ${
                pendingClarificationsCount > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 animate-pulse-subtle'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Clarification Desk ({pendingClarificationsCount} Pending)</span>
            </button>
          </div>
        </header>

        {/* Navigation Sub-Header Tabs */}
        <nav className="border-b border-slate-800/80 bg-slate-900/40 px-6 py-2 flex gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('clarifications')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'clarifications'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Clarification Desk</span>
            {pendingClarificationsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('a2a')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'a2a'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>A2A Agents & Traces</span>
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'browser'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Browser Subagent</span>
          </button>

          <button
            onClick={() => setActiveTab('sast')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sast'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Security & SAST</span>
          </button>

          <button
            onClick={() => setActiveTab('observability')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'observability'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Observability & DLQ</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Ticket Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sandbox & Git Diff</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cost Economics</span>
          </button>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <DeveloperDashboard
              metrics={metrics}
              systemMetrics={systemMetrics}
              reports={reports}
              liveLogStream={liveLogStream}
              onTriggerGC={triggerGC}
              onSelectReport={handleSelectReport}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'clarifications' && (
            <ClarificationDesk
              sessions={clarifications}
              onRefresh={refreshData}
              onSessionResolved={refreshData}
            />
          )}

          {activeTab === 'a2a' && (
            <A2AVisualizer
              agents={agents}
              reports={reports}
              selectedReport={selectedReport}
            />
          )}

          {activeTab === 'browser' && (
            <BrowserPreviewDesk />
          )}

          {activeTab === 'sast' && (
            <SecuritySASTDesk />
          )}

          {activeTab === 'observability' && (
            <ObservabilityDesk />
          )}

          {activeTab === 'simulator' && (
            <TicketSimulator
              onTicketSubmitted={refreshData}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'sandbox' && (
            <SandboxTerminal
              reports={reports}
              selectedReport={selectedReport}
            />
          )}

          {activeTab === 'analytics' && (
            <CostAnalytics metrics={metrics} />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 bg-slate-950">
          <p>
            Tharior Remedai • Enterprise Agentic Autonomous Remediation Platform • Backed by Anvesh Unified Storage
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
