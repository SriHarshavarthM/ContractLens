import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  FileText,
  ListTodo,
  Clock,
  AlertTriangle,
  GitCompare,
  MessageSquare,
  Sparkles,
  Bell,
  Upload,
  Key,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Sun,
  Moon,
  X,
  CheckCircle2,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';
import AlertsBanner from './AlertsBanner';
import AuthModal from './AuthModal';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  const {
    activeTab,
    setActiveTab,
    contracts,
    activeContractId,
    setActiveContract,
    getHealthScore,
    flags,
    apiKeyConfigured,
    saveApiKey,
    isKeyModalOpen,
    setKeyModalOpen,
    isAnalyzing,
    analysisStep,
    streamedTokens,
    theme,
    toggleTheme,
    user,
    isAuthenticated,
    logout,
    setAuthModal
  } = useContractStore();

  const [inputKey, setInputKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const activeContract = contracts.find((c) => c.id === activeContractId) || contracts[0];
  const healthScore = getHealthScore();
  const currentIndex = contracts.findIndex((c) => c.id === activeContract?.id);

  const handleNextContract = () => {
    if (contracts.length <= 1) return;
    const nextIdx = (currentIndex + 1) % contracts.length;
    setActiveContract(contracts[nextIdx]);
  };

  const handlePrevContract = () => {
    if (contracts.length <= 1) return;
    const prevIdx = (currentIndex - 1 + contracts.length) % contracts.length;
    setActiveContract(contracts[prevIdx]);
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    const ok = await saveApiKey(inputKey.trim());
    if (ok) {
      setKeySaved(true);
      setTimeout(() => {
        setKeySaved(false);
        setKeyModalOpen(false);
      }, 1200);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Contract', icon: FileText },
    { id: 'obligations', label: 'Obligations', icon: ListTodo, count: activeContract?.obligations?.length },
    { id: 'timeline', label: 'Time Management', icon: Clock, count: activeContract?.timeline?.length },
    { id: 'flags', label: 'Risk Flags', icon: AlertTriangle, count: activeContract?.flags?.length, alert: (activeContract?.flags?.length || 0) > 0 },
    { id: 'compare', label: 'Compare Diff', icon: GitCompare },
    { id: 'qa', label: 'Ask AI', icon: MessageSquare },
    { id: 'summary', label: 'Executive Summary', icon: Sparkles },
    { id: 'alerts', label: 'Alerts', icon: Bell, count: activeContract?.alerts?.alerts?.length },
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F5] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex antialiased transition-colors duration-150">
      
      {/* 1. RICH DASHBOARD SIDEBAR (240px / 64px collapsible) */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Proactive Top Banner */}
        <AlertsBanner />

        {/* TOP NAVIGATION BAR (Charcoal Dark & Clean Light) */}
        <header className="h-16 px-5 border-b border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#0E0E11] flex items-center justify-between flex-shrink-0 z-20 transition-colors">
          {/* Left: Breadcrumbs & Document Context */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setActiveTab('upload')}
              className="font-bold text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              Contracts
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="font-bold text-xs text-zinc-900 dark:text-white truncate max-w-[280px]">
              {activeContract?.title || 'Master Agreement Overview'}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          {/* Right: Actions, AI Status, Theme Toggle, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search trigger */}
            <div className="relative hidden md:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setActiveTab('qa');
                  }
                }}
                placeholder="Search contract clauses... (Press Enter)"
                className="w-64 pl-8 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-indigo"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            </div>

            {/* AI Status Pill */}
            <button
              onClick={() => setKeyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors"
              title="Gemini AI Engine Status"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-indigo" />
              <span className="hidden sm:inline">Gemini AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            </button>

            {/* Upload New Contract Yellow '+' Button */}
            <button
              onClick={() => setActiveTab('upload')}
              className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold shadow-sm transition-colors flex items-center justify-center"
              title="Upload New Agreement"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* User Profile Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-400/50 transition-all"
                title="Account Settings"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow">
                  {user?.avatar_initials || 'PD'}
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#141417] rounded-2xl shadow-2xl border border-zinc-200 dark:border-[#27272A] py-3 z-50 animate-fade-in text-zinc-900 dark:text-zinc-100">
                  <div className="px-4 pb-3 border-b border-zinc-100 dark:border-[#27272A]">
                    <div className="font-bold text-xs text-zinc-900 dark:text-white">
                      {user?.name || 'Panji Dwi'}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {user?.email || 'demo@contractlens.ai'}
                    </div>
                    <div className="mt-1 text-[10px] inline-block px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                      {user?.role || 'Lead Legal Counsel'}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setAuthModal(true, 'login');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-zinc-100 dark:hover:bg-[#1E1E22] flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Switch Account / Sign In</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setAuthModal(true, 'register');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-zinc-100 dark:hover:bg-[#1E1E22] flex items-center gap-2 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Register New Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 dark:text-rose-400 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT DASHBOARD */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          
          {/* Analysis Loading Overlay (when active from other tabs) */}
          {isAnalyzing && activeTab !== 'upload' && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#141417] p-6 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-[#27272A] shadow-2xl flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-zinc-800 border-t-brand-indigo animate-spin mb-3" />
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">Analyzing Contract with Gemini 2.5 Pro</h4>
                <p className="text-xs text-brand-indigo font-mono mb-3">{analysisStep}</p>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-indigo to-cyan-400 h-full animate-shimmer" style={{ width: '100%' }} />
                </div>
                {streamedTokens && (
                  <div className="mt-4 w-full p-3 bg-black/40 rounded-lg border border-white/10 max-h-32 overflow-hidden relative text-left">
                    <p className="text-xs text-indigo-400 mb-1 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ⚡ Gemini 2.5 Pro — Live Output
                    </p>
                    <p className="text-xs text-gray-400 font-mono leading-relaxed line-clamp-4">
                      {streamedTokens.slice(-400)}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TOP CONTRACT PROFILE CARD (When on contract detail view) */}
          {activeContract && activeTab !== 'upload' && (
            <div className="bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-5 shadow-sm transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Profile Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-[#1E1E22] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center flex-shrink-0 transition-colors"
                    title="Back to All Contracts"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
                    <FileText className="w-6 h-6" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white tracking-tight truncate max-w-[400px]">
                        {activeContract.title || activeContract.filename}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        AI Verified
                      </span>
                    </div>

                    {/* Metadata Sub-Row */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-1 text-xs">
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[11px] block font-medium">Parties</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px] block">
                          {activeContract.extractedData?.parties?.map(p => p.name).join(' ↔ ') || 'Commercial Agreement'}
                        </span>
                      </div>
                      <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[11px] block font-medium">Health Score</span>
                        <span className={`font-bold ${healthScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : healthScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {healthScore} / 100 ({healthScore >= 75 ? 'Low Risk' : 'Audit Recommended'})
                        </span>
                      </div>
                      <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[11px] block font-medium">Governing Law</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                          {activeContract.extractedData?.governing_law || 'Delaware, USA'}
                        </span>
                      </div>
                      <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                      <div>
                        <span className="text-zinc-400 dark:text-zinc-500 text-[11px] block font-medium">Contract Value</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                          {activeContract.extractedData?.financial_value || '$240,000 / yr'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-3 self-end lg:self-auto">
                  {/* Pagination: < > 1 of X */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-[#18181B] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A]">
                    <button
                      onClick={handlePrevContract}
                      className="hover:text-zinc-900 dark:hover:text-white p-0.5"
                      title="Previous Contract"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span>{currentIndex >= 0 ? currentIndex + 1 : 1} of {Math.max(1, contracts.length)}</span>
                    <button
                      onClick={handleNextContract}
                      className="hover:text-zinc-900 dark:hover:text-white p-0.5"
                      title="Next Contract"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Compare Shortcut */}
                  <button
                    onClick={() => setActiveTab('compare')}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-[#18181B] hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] transition-colors"
                    title="Compare Versions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Primary 'Send Email' / 'Legal Review' Green Button */}
                  <button
                    onClick={() => setActiveTab('flags')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs shadow transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-none text-xs font-medium">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-2 px-3 whitespace-nowrap transition-all border-b-2 ${
                        isActive
                          ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white font-bold'
                          : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                              : tab.alert
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Children Tab Views */}
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141417] p-6 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-[#27272A] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-indigo" />
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Configure Gemini API Key</h3>
              </div>
              <button
                onClick={() => setKeyModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Google Gemini Pro powers contract extraction, obligations, risk auditing, and Q&amp;A.
            </p>

            <form onSubmit={handleSaveKey}>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                API Key
              </label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-300 dark:border-[#27272A] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 text-xs focus:outline-none focus:border-brand-indigo mb-4 font-mono"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-zinc-500">
                  Status:{' '}
                  <span className={apiKeyConfigured ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                    {apiKeyConfigured ? 'Live Gemini Configured' : 'Key Required'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setKeyModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-brand-indigo hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {keySaved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Key</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
}
