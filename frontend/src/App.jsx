import React, { useEffect } from 'react';
import { useContractStore } from './store/useContractStore';
import AppShell from './components/AppShell';
import AuthPage from './components/AuthPage';
import UploadZone from './components/UploadZone';
import ContractCard from './components/ContractCard';
import ObligationsPanel from './components/ObligationsPanel';
import ObligationTimeline from './components/ObligationTimeline';
import FlagsPanel from './components/FlagsPanel';
import CompareView from './components/CompareView';
import QAChat from './components/QAChat';
import SummaryPanel from './components/SummaryPanel';
import AlertsView from './components/AlertsView';

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

  // Restore any persisted Supabase session and react to auth state changes.
  useEffect(() => {
    restoreSession();
    const unsubscribe = subscribeToAuth();
    return () => unsubscribe && unsubscribe();
  }, [restoreSession, subscribeToAuth]);

  // Protected-route gate: wait for session restore, then require authentication.
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

  const activeContract = contracts.find((c) => c.id === activeContractId);

  const renderContent = () => {
    // If on upload tab or no contract yet loaded
    if (activeTab === 'upload' || !activeContract) {
      return <UploadZone />;
    }

    switch (activeTab) {
      case 'overview':
        return <ContractCard />;
      case 'obligations':
        return <ObligationsPanel />;
      case 'timeline':
        return <ObligationTimeline />;
      case 'flags':
        return <FlagsPanel />;
      case 'compare':
        return <CompareView />;
      case 'qa':
        return <QAChat />;
      case 'summary':
        return <SummaryPanel />;
      case 'alerts':
        return <AlertsView />;
      default:
        return <ContractCard />;
    }
  };

  return (
    <AppShell>
      {renderContent()}
    </AppShell>
  );
}
