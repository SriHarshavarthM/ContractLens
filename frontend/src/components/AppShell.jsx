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
  Scale,
  Key,
  Search,
  Plus,
  Sun,
  Moon,
  X,
  CheckCircle2,
  LogIn,
  LogOut,
  UserCheck,
  Info
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
    setAuthModal,
    aiDemoMode
  } = useContractStore();

  const [inputKey, setInputKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const activeContract = contracts.find((c) => c.id === activeContractId) || contracts[0];

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
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'summary', label: 'Summary', icon: Sparkles },
    { id: 'obligations', label: 'Obligations', icon: ListTodo, count: activeContract?.obligations?.length },
    { id: 'timeline', label: 'Timeline', icon: Clock, count: activeContract?.timeline?.length },
    { id: 'clauses', label: 'Clauses', icon: Scale },
    { id: 'flags', label: 'Risk Review', icon: AlertTriangle, count: activeContract?.flags?.length, alert: (activeContract?.flags?.length || 0) > 0 },
    { id: 'qa', label: 'Ask AI', icon: MessageSquare },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'alerts', label: 'Alerts', icon: Bell, count: activeContract?.alerts?.alerts?.length },
  ];

  const aiConfigured = apiKeyConfigured && !aiDemoMode;
  const aiStatus = aiConfigured
    ? { dot: 'bg-emerald-500 shadow-[0_0_8px_#10B981]', label: 'Connected' }
    : aiDemoMode
    ? { dot: 'bg-amber-400 shadow-[0_0_8px_#FBBF24]', label: 'Demo mode' }
    : { dot: 'bg-rose-400 shadow-[0_0_8px_#FB7185]', label: 'Needs key' };

  const showContractTabs = activeContract && activeTab !== 'upload' && activeTab !== 'library';

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

        {/* Offline Demo Mode Notice: analysis is the tagged sample dataset, not
            results generated from the submitted document via Gemini. */}
        {aiDemoMode && isAuthenticated && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] font-medium">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Offline demo mode: AI responses are sample/fallback data, not generated from your document.
              Configure a Gemini API key for real contract analysis.
            </span>
          </div>
        )}

        {/* TOP NAVIGATION BAR (Charcoal Dark & Clean Light) */}
        <header className="h-16 px-5 border-b border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#0E0E11] flex items-center justify-between flex-shrink-0 z-20 transition-colors">
          {/* Left: Breadcrumbs & Document Context */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setActiveTab('library')}
              className="font-bold text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors flex-shrink-0"
            >
              Library
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="font-bold text-xs text-zinc-900 dark:text-white truncate max-w-[280px]">
              {activeContract?.title || 'Contract Workspace'}
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

            {/* AI Engine Status Pill */}
            <button
              onClick={() => setKeyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors"
              title="AI engine status (click to configure the backend Gemini key)"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-indigo" />
              <span className="hidden sm:inline">AI Engine</span>
              <span className={`w-2 h-2 rounded-full ${aiStatus.dot}`} />
              <span className={`hidden lg:inline ${aiConfigured ? 'text-emerald-600 dark:text-emerald-400' : aiDemoMode ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {aiStatus.label}
              </span>
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
                  {user?.avatar_initials || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#141417] rounded-2xl shadow-2xl border border-zinc-200 dark:border-[#27272A] py-3 z-50 animate-fade-in text-zinc-900 dark:text-zinc-100">
                  <div className="px-4 pb-3 border-b border-zinc-100 dark:border-[#27272A]">
                    <div className="font-bold text-xs text-zinc-900 dark:text-white">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {user?.email || 'Not signed in'}
                    </div>
                    <div className="mt-1 text-[10px] inline-block px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                      {user?.role || 'Contract Analyst'}
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
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">Analyzing contract</h4>
                <p className="text-xs text-brand-indigo font-mono mb-3">{analysisStep}</p>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-indigo to-cyan-400 h-full animate-shimmer" style={{ width: '100%' }} />
                </div>
                {streamedTokens && (
                  <div className="mt-4 w-full p-3 bg-black/40 rounded-lg border border-white/10 max-h-32 overflow-hidden relative text-left">
                    <p className="text-xs text-indigo-400 mb-1 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Gemini structured output — live
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

          {/* Analysis sub-tab navigation (when viewing a specific contract) */}
          {showContractTabs && (
            <div className="bg-white dark:bg-[#0E0E11] rounded-2xl border border-zinc-200 dark:border-[#27272A] py-1 px-2 flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none text-xs font-medium">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 py-2 px-3 whitespace-nowrap rounded-xl transition-all ${
                      isActive
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-white/20 dark:bg-zinc-950/20'
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
              Sets GEMINI_API_KEY in the backend. Contract extraction, obligations, risk auditing and Q&amp;A run through
              the Gemini API when configured; otherwise the app clearly labels offline demo output.
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
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {apiKeyConfigured ? 'Gemini configured' : 'Key required'}
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
