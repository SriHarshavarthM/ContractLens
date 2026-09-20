import React, { useEffect } from 'react';
import { useContractStore } from './store/useContractStore';
import AppShell from './components/AppShell';
import AuthPage from './components/AuthPage';
import ContractLibrary from './components/ContractLibrary';
import UploadZone from './components/UploadZone';
import AnalysisHeader from './components/analysis/AnalysisHeader';
import ExecutiveOverview from './components/analysis/ExecutiveOverview';
import RiskReview from './components/analysis/RiskReview';
import ObligationsWorkspace from './components/analysis/ObligationsWorkspace';
import ClauseExplorer from './components/analysis/ClauseExplorer';
import TimelineView from './components/analysis/TimelineView';
import DocumentSummary from './components/analysis/DocumentSummary';
import CompareView from './components/CompareView';
import QAChat from './components/QAChat';

const ANALYSIS_TABS = new Set(['overview', 'obligations', 'timeline', 'flags', 'clauses', 'compare', 'qa', 'summary', 'alerts']);

export default function App() {
  const {
    activeTab,
    activeContractId,
    contracts,
    checkBackendHealth,
    isAuthenticated,
    isAuthInitializing,
    restoreSession,
    subscribeToAuth,
  } = useContractStore();

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  useEffect(() => {
    restoreSession();
    const unsubscribe = subscribeToAuth();
    return () => unsubscribe && unsubscribe();
  }, [restoreSession, subscribeToAuth]);

  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-indigo flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20 animate-pulse-subtle">
            CL
          </div>
          <div className="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-indigo to-cyan-400 animate-shimmer" />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">Restoring session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const activeContract = contracts.find((c) => c.id === activeContractId) || null;

  if (activeTab === 'library') {
    return (
      <AppShell>
        <ContractLibrary />
      </AppShell>
    );
  }

  if (activeTab === 'upload' || !activeContract) {
    return (
      <AppShell>
        <UploadZone />
      </AppShell>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'obligations':
        return <ObligationsWorkspace />;
      case 'timeline':
        return <TimelineView />;
      case 'flags':
        return <RiskReview />;
      case 'clauses':
        return <ClauseExplorer />;
      case 'compare':
        return <CompareView />;
      case 'qa':
        return <QAChat />;
      case 'summary':
        return <DocumentSummary />;
      case 'alerts':
        return <DocumentSummary />;
      case 'overview':
      default:
        return <ExecutiveOverview />;
    }
  };

  return (
    <AppShell>
      {ANALYSIS_TABS.has(activeTab) && <AnalysisHeader />}
      {renderTab()}
    </AppShell>
  );
}