import React, { useEffect, useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  FileText,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function ContractSidebar() {
  const {
    contracts,
    activeContractId,
    setActiveContract,
    loadContractById,
    deleteContract,
    fetchContracts,
    setActiveTab,
  } = useContractStore();

  const [collapsed, setCollapsed] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const getExpirationStatus = (contract) => {
    const expStr = contract.extractedData?.expiration_date || contract.expiration_date;
    if (!expStr) return { label: 'Active', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };

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
      return { label: 'Active', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    } catch (e) {
      return { label: 'Active', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    }
  };

  const handleDelete = async (e, contractId) => {
    e.stopPropagation();
    if (confirm('Delete this contract and all its analysis from repository?')) {
      setDeletingId(contractId);
      await deleteContract(contractId);
      setDeletingId(null);
    }
  };

  return (
    <aside
      className={`relative bg-zinc-50 dark:bg-[#0E0E11] border-r border-zinc-200 dark:border-[#27272A] transition-all duration-300 flex flex-col z-20 ${
        collapsed ? 'w-14' : 'w-72 lg:w-80'
      }`}
    >
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-white dark:bg-[#18181B] border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center shadow-md z-30 transition-colors"
        title={collapsed ? 'Expand repository sidebar' : 'Collapse repository sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between">
        {!collapsed ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Contract Repository ({contracts.length})
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              Supabase persistent storage
            </p>
          </div>
        ) : (
          <FileText className="w-5 h-5 text-zinc-400 mx-auto" />
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
                onClick={() => {
                  if (c.extractedData) setActiveContract(c);
                  else loadContractById(c.id);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
                }`}
                title={c.title || c.name || c.filename}
              >
                <FileText className="w-4 h-4" />
              </button>
            );
          }

          return (
            <div
              key={c.id}
              onClick={() => {
                if (c.extractedData) setActiveContract(c);
                else loadContractById(c.id);
              }}
              className={`group p-3.5 rounded-xl cursor-pointer transition-all border relative ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500/40 shadow-sm'
                  : 'bg-white dark:bg-[#121215] border-zinc-200 dark:border-[#222226] hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${status.badge}`}>
                  {status.label}
                </span>

                <div className="flex items-center gap-1.5">
                  {flagCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold">
                      {flagCount} Risk{flagCount === 1 ? '' : 's'}
                    </span>
                  )}

                  {/* Delete Button with Trash Icon */}
                  <button
                    onClick={(e) => handleDelete(e, c.id)}
                    disabled={deletingId === c.id}
                    className="p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete contract from repository"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate mb-1">
                {c.title || c.name || c.filename}
              </h4>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span>{c.pages || 1} pages</span>
                <span>{c.obligations?.length || 0} obligations</span>
              </div>
            </div>
          );
        })}

        {contracts.length === 0 && !collapsed && (
          <div className="p-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
            No contracts stored yet. Upload or load sample contract to begin.
          </div>
        )}
      </div>

      {/* Sidebar Footer Upload CTA */}
      <div className="p-3 border-t border-zinc-200 dark:border-[#27272A]">
        <button
          onClick={() => setActiveTab('upload')}
          className={`w-full rounded-xl flex items-center justify-center gap-2 font-semibold text-xs transition-all ${
            collapsed
              ? 'p-2.5 bg-indigo-600 text-white'
              : 'px-4 py-2.5 bg-zinc-200/60 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
          }`}
          title="Upload or add another contract"
        >
          <Plus className="w-4 h-4 text-indigo-500" />
          {!collapsed && <span>Upload Contract</span>}
        </button>
      </div>
    </aside>
  );
}
