import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RepoOnboardingDesk } from './components/RepoOnboardingDesk';
import { KnowledgeGraphDesk } from './components/KnowledgeGraphDesk';
import { AgentStudioDesk } from './components/AgentStudioDesk';
import { ModelCatalogDesk } from './components/ModelCatalogDesk';
import { IssueBacklogDesk } from './components/IssueBacklogDesk';
import { GitPRReviewDesk } from './components/GitPRReviewDesk';
import { MultimodalStudioDesk } from './components/MultimodalStudioDesk';
import { ObservabilityDesk } from './components/ObservabilityDesk';
import { ClarificationDesk } from './components/ClarificationDesk';
import { SettingsDesk } from './components/SettingsDesk';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { useRemedaiStore } from './store/useRemedaiStore';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, fetchInitialData } = useRemedaiStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Sync activeTab with browser URL hash for location-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) {
      handleHashChange();
    } else {
      window.location.hash = `/${activeTab}`;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.location.hash = `/${activeTab}`;
  }, [activeTab]);

  const renderActiveDesk = () => {
    switch (activeTab) {
      case 'repos':
        return <RepoOnboardingDesk />;
      case 'knowledge-graph':
        return <KnowledgeGraphDesk />;
      case 'studio':
        return <AgentStudioDesk />;
      case 'catalog':
        return <ModelCatalogDesk />;
      case 'backlog':
        return <IssueBacklogDesk />;
      case 'pr-review':
        return <GitPRReviewDesk />;
      case 'multimodal':
        return <MultimodalStudioDesk />;
      case 'observability':
        return <ObservabilityDesk />;
      case 'clarifications':
        return <ClarificationDesk />;
      case 'settings':
        return <SettingsDesk />;
      default:
        return <RepoOnboardingDesk />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 font-sans overflow-hidden antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        {renderActiveDesk()}
      </main>

      {/* ⌘K Global Search & Command Modal */}
      <GlobalSearchModal />
    </div>
  );
};

export default App;
