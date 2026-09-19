import React from 'react';
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
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FolderOpen,
  Plus,
  CheckCircle2,
  Sun,
  Moon,
  LogOut,
  User,
  Layers
} from 'lucide-react';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const {
    activeTab,
    setActiveTab,
    contracts,
    activeContractId,
    setActiveContract,
    getHealthScore,
    theme,
    toggleTheme,
    user,
    setAuthModal,
    logout
  } = useContractStore();

  const activeContract = contracts.find((c) => c.id === activeContractId) || contracts[0];
  const healthScore = getHealthScore();

  const navSections = [
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'overview', label: 'Contract Overview', icon: FileText, desc: 'Commercial & Legal Terms' },
        {
          id: 'obligations',
          label: 'Obligations & SLAs',
          icon: ListTodo,
          count: activeContract?.obligations?.length,
          desc: 'Party Commitments'
        },
        {
          id: 'timeline',
          label: 'Time Management',
          icon: Clock,
          count: activeContract?.timeline?.length,
          desc: 'Chronological Milestones'
        },
        {
          id: 'flags',
          label: 'Clause Risk Audit',
          icon: AlertTriangle,
          count: activeContract?.flags?.length,
          alert: (activeContract?.flags?.length || 0) > 0,
          desc: 'Non-Standard Language'
        },
      ]
    },
    {
      title: 'ANALYSIS & TOOLS',
      items: [
        { id: 'compare', label: 'Version Diff', icon: GitCompare, desc: 'Side-by-side Redlines' },
        { id: 'qa', label: 'Ask AI Legal Q&A', icon: MessageSquare, desc: 'Instant Clause Queries' },
        { id: 'summary', label: 'Executive Briefing', icon: Sparkles, desc: 'High-Level PDF Export' },
        {
          id: 'alerts',
          label: 'Deadline Watchlist',
          icon: Bell,
          count: activeContract?.alerts?.alerts?.length,
          desc: 'Imminent Triggers'
        },
      ]
    }
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between transition-all duration-200 z-30 flex-shrink-0 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-[#FAFAFA] dark:bg-[#0E0E11] border-r border-[#E4E4E7] dark:border-[#27272A] text-zinc-800 dark:text-zinc-200`}
    >
      {/* 1. Header & Brand */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E4E4E7] dark:border-[#27272A]">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-brand-indigo flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20 flex-shrink-0">
                CL
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white leading-tight">
                  Contract<span className="text-brand-indigo">Lens</span>
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wider">
                  ENTERPRISE v2.4
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-xl bg-brand-indigo flex items-center justify-center text-white font-black text-sm shadow-md">
              CL
            </div>
          )}

          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. Active Contract Context Card (When Expanded) */}
        {!isCollapsed && activeContract && (
          <div className="p-3 mx-3 mt-3 rounded-xl bg-white dark:bg-[#141417] border border-[#E4E4E7] dark:border-[#27272A] shadow-sm">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Active Document
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Score: {healthScore}
              </span>
            </div>
            <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">
              {activeContract.title || activeContract.filename}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {activeContract.extractedData?.parties?.[0]?.name || 'Commercial Contract'}
            </div>
          </div>
        )}

        {/* 3. Navigation Sections */}
        <div className="px-2 py-3 space-y-5 overflow-y-auto max-h-[calc(100vh-250px)]">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                  {section.title}
                </div>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-850'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white dark:text-zinc-950' : 'text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'}`} />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!isCollapsed && item.count !== undefined && item.count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-zinc-800 dark:bg-zinc-300 text-white dark:text-zinc-950'
                              : item.alert
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 4. Loaded Contracts Section in Sidebar */}
          {!isCollapsed && contracts.length > 0 && (
            <div className="pt-2 border-t border-[#E4E4E7] dark:border-[#27272A]">
              <div className="px-3 pb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                  CONTRACT LIBRARY ({contracts.length})
                </span>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                  title="Upload New Contract"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                {contracts.map((c) => {
                  const isCurrent = c.id === activeContractId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveContract(c);
                        setActiveTab('overview');
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] truncate flex items-center gap-2 transition-colors ${
                        isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-brand-indigo font-bold border border-indigo-200 dark:border-indigo-800/60'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-850'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-brand-indigo' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                      <span className="truncate">{c.title || c.filename}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. User Profile Footer */}
      <div className="p-3 border-t border-[#E4E4E7] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#0E0E11]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => setAuthModal(true)}
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              title="Click to Switch Account"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow">
                {user?.avatar_initials || 'PD'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                  {user?.name || 'Panji Dwi'}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate font-mono">
                  {user?.employee_id || '#EMP07'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-600" />}
              </button>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              onClick={() => setAuthModal(true)}
              className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
              title={user?.name || 'Panji Dwi'}
            >
              {user?.avatar_initials || 'PD'}
            </div>
            <button
              onClick={toggleTheme}
              className="p-1 text-zinc-400 hover:text-zinc-100"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
