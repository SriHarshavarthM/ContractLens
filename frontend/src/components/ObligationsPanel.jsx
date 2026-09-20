import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  ListTodo,
  Calendar,
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function ObligationsPanel() {
  const { obligations, extractedData } = useContractStore();
  const [filterParty, setFilterParty] = useState('ALL');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [expandedSources, setExpandedSources] = useState({});

  if (!obligations || obligations.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] p-12 rounded-2xl text-center shadow-sm">
        <ListTodo className="w-12 h-12 text-zinc-400 dark:text-zinc-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">No Obligations Found</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Upload an agreement to automatically extract party commitments and SLAs.</p>
      </div>
    );
  }

  const toggleSource = (idx) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getUrgencyBadge = (urgency) => {
    const u = (urgency || 'medium').toLowerCase();
    if (u === 'critical') {
      return {
        style: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500 animate-pulse',
        label: 'Critical'
      };
    }
    if (u === 'high') {
      return {
        style: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        label: 'High'
      };
    }
    if (u === 'medium') {
      return {
        style: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        dot: 'bg-yellow-500',
        label: 'Medium'
      };
    }
    return {
      style: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
      label: 'Routine'
    };
  };

  const partyList = Array.from(new Set(obligations.map((o) => o.party || 'Unassigned')));

  const filtered = obligations.filter((ob) => {
    const matchParty = filterParty === 'ALL' || ob.party === filterParty;
    const matchUrgency =
      filterUrgency === 'ALL' || (ob.urgency || '').toLowerCase() === filterUrgency.toLowerCase();
    return matchParty && matchUrgency;
  });

  const grouped = filtered.reduce((acc, ob) => {
    const p = ob.party || 'General Requirements';
    if (!acc[p]) acc[p] = [];
    acc[p].push(ob);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header and Filtering Bar */}
      <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-zinc-200 dark:border-[#27272A] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-brand-indigo dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Obligations Extracted ({obligations.length})
            </span>
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Party Commitments &amp; SLAs</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Categorized by contracting entity with urgency ratings and verbatim clause citations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs">
            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              className="bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-[#18181B]">All Parties</option>
              {partyList.map((p) => (
                <option key={p} value={p} className="dark:bg-[#18181B]">{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-[#18181B]">All Urgencies</option>
              <option value="critical" className="dark:bg-[#18181B]">Critical</option>
              <option value="high" className="dark:bg-[#18181B]">High</option>
              <option value="medium" className="dark:bg-[#18181B]">Medium</option>
              <option value="low" className="dark:bg-[#18181B]">Routine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Party Grouped Obligations */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([partyName, items]) => (
          <div key={partyName} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-indigo" />
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                {partyName} ({items.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {items.map((ob, idx) => {
                const uniqueKey = `${partyName}_${idx}`;
                const badge = getUrgencyBadge(ob.urgency);
                const isExpanded = expandedSources[uniqueKey];

                return (
                  <div
                    key={uniqueKey}
                    className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.style}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{ob.urgency || 'Medium'}</span>
                        </span>

                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          {ob.type || ob.obligation_type || 'Operational Deliverable'}
                        </span>

                        {ob.deadline_type && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {ob.deadline_type}
                          </span>
                        )}
                      </div>

                      {/* Deadline & Recurrence Tags */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {(ob.recurrence || ob.frequency) && (
                          <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Recurrence: {ob.recurrence || ob.frequency}</span>
                          </div>
                        )}
                        {ob.deadline && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-brand-indigo" />
                            <span>Deadline: {ob.deadline}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                      {ob.description}
                    </p>

                    {/* Consequence of Breach / Penalty Notice */}
                    {(ob.consequence || ob.penalty) && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Breach Consequence / Legal Impact: </strong>
                          <span>{ob.consequence || ob.penalty}</span>
                        </div>
                      </div>
                    )}

                    {/* Collapsible Verbatim Source Clause */}
                    {ob.source_clause && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-[#27272A]">
                        <button
                          onClick={() => toggleSource(uniqueKey)}
                          className="flex items-center justify-between w-full text-xs text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity"
                        >
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Info className="w-3.5 h-3.5" />
                            {isExpanded ? 'Hide Verbatim Source Clause' : 'View Verbatim Source Clause & Citations'}
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-600 dark:text-zinc-300 font-mono leading-relaxed">
                            "{ob.source_clause}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
