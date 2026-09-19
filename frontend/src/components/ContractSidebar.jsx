import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  FileText,
  Plus,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ContractSidebar() {
  const {
    contracts,
    activeContractId,
    setActiveContract,
    setActiveTab,
    activeTab
  } = useContractStore();

  const [collapsed, setCollapsed] = useState(false);

  const getExpirationStatus = (contract) => {
    const expStr = contract.extractedData?.expiration_date;
    if (!expStr) return { label: 'Active', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };

    try {
      const expDate = new Date(expStr);
      const today = new Date();
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { label: 'Expired', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      }
      if (diffDays <= 60) {
        return { label: 'Expiring Soon', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      }
      return { label: 'Active', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    } catch (e) {
      return { label: 'Active', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
  };

  return (
    <aside
      className={`relative bg-[#090D18] border-r border-white/10 transition-all duration-300 flex flex-col z-20 ${
        collapsed ? 'w-14' : 'w-72 lg:w-80'
      }`}
    >
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-navy-800 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center shadow-md z-30 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Contract Repository ({contracts.length})
            </h3>
            <p className="text-[10px] text-slate-500">
              Switch agreement context
            </p>
          </div>
        ) : (
          <FileText className="w-5 h-5 text-slate-400 mx-auto" />
        )}
      </div>

      {/* Contract List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {contracts.map((c) => {
          const isActive = c.id === activeContractId;
          const status = getExpirationStatus(c);
          const flagCount = c.flags?.length || 0;

          if (collapsed) {
            return (
              <button
                key={c.id}
                onClick={() => setActiveContract(c)}
                className={`w-full p-2.5 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-brand-indigo text-white shadow-md shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
                title={c.title || c.filename}
              >
                <FileText className="w-4 h-4" />
              </button>
            );
          }

          return (
            <div
              key={c.id}
              onClick={() => setActiveContract(c)}
              className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                isActive
                  ? 'bg-brand-indigo/15 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full border ${status.badge}`}>
                  {status.label}
                </span>

                {flagCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                    {flagCount} Risk{flagCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-white truncate mb-1">
                {c.title || c.filename}
              </h4>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{c.pages || 1} pages</span>
                <span>{c.obligations?.length || 0} obligations</span>
              </div>
            </div>
          );
        })}

        {contracts.length === 0 && !collapsed && (
          <div className="p-4 text-center text-xs text-slate-500">
            No contracts in session yet. Upload one to begin.
          </div>
        )}
      </div>

      {/* Sidebar Footer Upload CTA */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setActiveTab('upload')}
          className={`w-full rounded-xl flex items-center justify-center gap-2 font-semibold text-xs transition-all ${
            collapsed
              ? 'p-2.5 bg-brand-indigo text-white'
              : 'px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10'
          }`}
          title="Upload or add another contract"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          {!collapsed && <span>Upload Contract</span>}
        </button>
      </div>
    </aside>
  );
}
