import React, { useEffect } from 'react';
import { useContractStore } from './store/useContractStore';
import AppShell from './components/AppShell';
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
  } = useContractStore();

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  const activeContract = contracts.find((c) => c.id === activeContractId);

  // Render tab content based on activeTab
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
