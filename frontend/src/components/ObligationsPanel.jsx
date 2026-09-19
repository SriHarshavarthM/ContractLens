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
  CheckCircle2
} from 'lucide-react';

export default function ObligationsPanel() {
  const { obligations } = useContractStore();
  const [filterParty, setFilterParty] = useState('ALL');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [expandedSources, setExpandedSources] = useState({});

  if (!obligations || obligations.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center">
        <ListTodo className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Obligations Found</h3>
        <p className="text-xs text-slate-400">Upload an agreement to extract party commitments.</p>
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
        style: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-400 animate-pulse',
        label: 'Critical (< 7 Days / Legal Consequence)'
      };
    }
    if (u === 'high') {
      return {
        style: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400',
        label: 'High (< 30 Days / Financial Penalty)'
      };
    }
    if (u === 'medium') {
      return {
        style: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        dot: 'bg-yellow-400',
        label: 'Medium (Standard Delivery)'
      };
    }
    return {
      style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
      label: 'Low (Informational)'
    };
  };

  // Group obligations by party
  const partyList = Array.from(new Set(obligations.map((o) => o.party || 'Unspecified')));

  const filteredObligations = obligations.filter((o) => {
    if (filterParty !== 'ALL' && o.party !== filterParty) return false;
    if (filterUrgency !== 'ALL' && (o.urgency || '').toLowerCase() !== filterUrgency.toLowerCase()) return false;
    return true;
  });

  // Group filtered by party
  const grouped = filteredObligations.reduce((acc, ob) => {
    const p = ob.party || 'General Agreement';
    if (!acc[p]) acc[p] = [];
    acc[p].push(ob);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header and Filtering Bar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-indigo/20 text-indigo-300 border border-indigo-500/30">
              Obligations Extracted ({obligations.length})
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Party Commitments & Deliverables</h2>
          <p className="text-xs text-slate-400">
            Categorized by contracting entity with urgency ratings and clause references.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-white/10 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-navy-900">All Parties</option>
              {partyList.map((p) => (
                <option key={p} value={p} className="bg-navy-900">{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-navy-900">All Urgencies</option>
              <option value="critical" className="bg-navy-900">Critical</option>
              <option value="high" className="bg-navy-900">High</option>
              <option value="medium" className="bg-navy-900">Medium</option>
              <option value="low" className="bg-navy-900">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Party Grouped Obligations */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([partyName, items]) => (
          <div key={partyName} className="space-y-3">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-indigo" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
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
                    className="glass-card p-5 rounded-xl border border-white/10 hover:border-white/20 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.style}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          <span>{ob.urgency || 'Medium'}</span>
                        </span>

                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Due: <strong className="text-white">{ob.deadline || 'Ongoing'}</strong></span>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {ob.source_clause || 'Section Reference'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-100 font-medium leading-relaxed">
                      {ob.description}
                    </p>

                    {/* Collapsible Source clause */}
                    {ob.source_clause && (
                      <div className="pt-2 border-t border-white/5">
                        <button
                          onClick={() => toggleSource(uniqueKey)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors"
                        >
                          <Info className="w-3 h-3 text-indigo-400" />
                          <span>{isExpanded ? 'Hide Source Clause' : 'View Source Clause Reference'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-2.5 rounded-lg bg-navy-950/80 border border-indigo-500/20 text-[11px] text-slate-300 font-mono">
                            {ob.source_clause}
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

        {Object.keys(grouped).length === 0 && (
          <div className="glass-panel p-8 rounded-xl text-center text-slate-400 text-xs">
            No obligations match the selected filters.
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500 pr-2">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Powered by Gemini 1.5 Pro</span>
      </div>
    </div>
  );
}
