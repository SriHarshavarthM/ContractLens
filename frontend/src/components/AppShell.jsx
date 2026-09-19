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
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Home,
  Calendar,
  CreditCard,
  Building,
  Settings,
  HelpCircle,
  Folder,
  Sun,
  Moon,
  X,
  ExternalLink,
  Layers,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';
import AlertsBanner from './AlertsBanner';
import AuthModal from './AuthModal';

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
  const [rightStripCollapsed, setRightStripCollapsed] = useState(false);
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
    <div className="min-h-screen bg-[#F1F3F7] dark:bg-[#080C16] text-slate-800 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* Top Banner Alert if any impending obligations */}
      <AlertsBanner />

      {/* 1. TOP HEADER (Matches tiimi design in image) */}
      <header className="sticky top-0 z-40 bg-[#161B2E] text-white border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-sm">
        {/* Left: Brand Logo & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-2 font-black tracking-tight text-lg text-white hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center text-amber-400 font-extrabold text-xl tracking-tighter mr-0.5">
              <span>::</span>
            </div>
            <span>Contract<span className="text-brand-indigo">Lens</span></span>
          </button>

          <span className="text-slate-500 text-xs hidden sm:inline">/</span>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="hover:text-slate-200 cursor-pointer" onClick={() => setActiveTab('upload')}>Contracts</span>
            <span>/</span>
            <span className="text-slate-200 font-medium truncate max-w-[200px]">
              {activeContract?.title || 'Contract Detail'}
            </span>
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-2.5">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-300" />
            )}
          </button>

          {/* Live Gemini AI Status Button */}
          <button
            onClick={() => setKeyModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Gemini AI Status & Key Configuration"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Gemini Flash AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
          </button>

          {/* Yellow '+' Action Button for New Contract */}
          <button
            onClick={() => setActiveTab('upload')}
            className="p-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow transition-colors flex items-center justify-center"
            title="Upload / Add Contract"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Search Button */}
          <button
            onClick={() => setActiveTab('qa')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Search Contract Clauses"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notification Bell with Badge */}
          <button
            onClick={() => setActiveTab('alerts')}
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="View Proactive Alerts"
          >
            <Bell className="w-4 h-4" />
            {(activeContract?.alerts?.alerts?.length || 0) > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-400/50 transition-all"
              title="User Account & Authentication"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-indigo-500 p-[1.5px]">
                <div className="w-full h-full rounded-full bg-[#181E2E] flex items-center justify-center text-[11px] font-bold text-white">
                  {user?.avatar_initials || 'PD'}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#13192B] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-fade-in text-slate-800 dark:text-slate-100">
                <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {user?.name || 'Panji Dwi'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
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
                    className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Switch Account / Sign In</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setAuthModal(true, 'register');
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors"
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

      {/* 2. BODY LAYOUT: Left Icon Strip + Center Main Area + Right Quick Tools */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thin Vertical Icon Sidebar (Matches reference image) */}
        <aside className="w-14 bg-white dark:bg-[#0E1322] border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 justify-between z-20 flex-shrink-0 transition-colors">
          {/* Top Icons */}
          <div className="flex flex-col items-center gap-4 w-full px-2">
            {/* FIK / CL Logo Badge */}
            <button
              onClick={() => setActiveTab('overview')}
              className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-brand-indigo text-white font-extrabold text-xs flex items-center justify-center shadow-md mb-2"
              title="ContractLens"
            >
              CL
            </button>

            {/* Nav Icon List */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'overview'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Contract Overview"
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('obligations')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'obligations'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Obligations"
            >
              <ListTodo className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Timeline"
            >
              <Clock className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('flags')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'flags'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Risk Flags"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'compare'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Compare Versions"
            >
              <GitCompare className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'qa'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Ask AI"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeTab === 'summary'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Executive Summary"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Icons */}
          <div className="flex flex-col items-center gap-3 w-full px-2">
            <button
              onClick={() => setKeyModalOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Help & Questions"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Center Main Dashboard Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
          {/* Analysis Banner Modal if running */}
          {isAnalyzing && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#13192B] p-6 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-brand-indigo animate-spin mb-3" />
                <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Analyzing Contract with AI</h4>
                <p className="text-xs text-indigo-500 font-mono mb-3">{analysisStep}</p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-indigo to-cyan-400 h-full animate-shimmer" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {/* 3. TOP CONTRACT PROFILE CARD (Matches reference image Panji Dwi card) */}
          {activeContract && activeTab !== 'upload' && (
            <div className="bg-white dark:bg-[#13192B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 lg:p-5 shadow-sm transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Profile Segment */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center flex-shrink-0 transition-colors"
                    title="Back to All Contracts"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-500 p-[2px] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-[#181E2E] flex items-center justify-center font-bold text-slate-800 dark:text-white text-xs overflow-hidden">
                      <span className="font-extrabold text-sm text-teal-700 dark:text-teal-300">
                        {user?.avatar_initials || 'PD'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {user?.name || 'Panji Dwi'}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </div>

                    {/* Metadata Sub-Row (Matches reference image) */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-1 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] block font-medium">Last Clocked In</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">A few seconds ago</span>
                      </div>
                      <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] block font-medium">Last Messaged</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">2 Days ago</span>
                      </div>
                      <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] block font-medium">Employee ID</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {user?.employee_id || '#EMP07'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-3 self-end lg:self-auto">
                  {/* Pagination: < > 1 of X */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handlePrevContract}
                      className="hover:text-slate-900 dark:hover:text-white p-0.5"
                      title="Previous Contract"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span>{currentIndex >= 0 ? currentIndex + 1 : 1} of {Math.max(1, contracts.length)}</span>
                    <button
                      onClick={handleNextContract}
                      className="hover:text-slate-900 dark:hover:text-white p-0.5"
                      title="Next Contract"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* More options ⋮ */}
                  <button
                    onClick={() => setActiveTab('compare')}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Compare Versions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Primary 'Send Email' / 'Legal Review' Green Button */}
                  <button
                    onClick={() => setActiveTab('flags')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs shadow-md transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </button>
                </div>
              </div>

              {/* 4. SUB-NAVIGATION TABS (Matches reference image tab bar) */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-none text-xs font-medium">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-2 px-2.5 whitespace-nowrap transition-all border-b-2 ${
                        isActive
                          ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                              : tab.alert
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
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

        {/* 5. FAR RIGHT MICRO-TOOL STRIP (Matches reference image right toolbar) */}
        <aside className="w-12 bg-white dark:bg-[#0E1322] border-l border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 justify-between flex-shrink-0 transition-colors hidden xl:flex">
          <div className="flex flex-col items-center gap-3 w-full px-1">
            <button
              onClick={() => setActiveTab('upload')}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
              title="Add File"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Compare Agreements"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Contract Folder"
            >
              <Folder className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab('upload')}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Repository"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </aside>
      </div>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#13192B] p-6 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-indigo" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Configure Gemini API Key</h3>
              </div>
              <button
                onClick={() => setKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Enter your <strong className="text-slate-900 dark:text-white">Google Gemini API Key</strong> to run contract intelligence with live Gemini models. If left blank, the built-in structured mock engine provides instant demo responses.
            </p>

            <form onSubmit={handleSaveKey}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs focus:outline-none focus:border-brand-indigo mb-4 font-mono"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  Status:{' '}
                  <span className={apiKeyConfigured ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                    {apiKeyConfigured ? 'Live Gemini Configured' : 'Demo Mode Active'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setKeyModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg"
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

      {/* Authentication Modal (Sign In / Register / Demo 1-Click) */}
      <AuthModal />
    </div>
  );
}

